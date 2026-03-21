import { Analytics } from '../models/Analytics.js';
import { Submission } from '../models/Submission.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateStudyPlanAI } from '../ml-service/mlService.js';

export const calculateAndStoreAnalytics = async (userId) => {
    // Fetch all submissions with question and session details
    const submissions = await Submission.find({ user: userId })
        .populate('question')
        .populate('session');

    // Filter out submissions belonging to deleted sessions (or old orphaned ones)
    const validSubmissions = submissions.filter(sub => !!sub.session);

    // CRITICAL: Cleanup orphans so they don't impact future queries
    const orphanedIds = submissions.filter(sub => !sub.session).map(sub => sub._id);
    if (orphanedIds.length > 0) {
        Submission.deleteMany({ _id: { $in: orphanedIds } }).catch(e => console.error("[Analytics] Orphan cleanup failed:", e));
    }

    if (!validSubmissions.length) {
        return {
            overallAccuracy: 0,
            totalAttempts: 0,
            topicBreakdown: [],
            difficultyBreakdown: { Easy: 0, Medium: 0, Hard: 0 },
            practiceHistory: [],
            readinessIndex: 0,
            strongTopics: [],
            weakTopics: [],
            streak: 0
        };
    }

    // Aggregate Data
    const totalAttempts = validSubmissions.length;
    let totalScore = 0;
    let correctAnswers = 0;
    const topicStats = {};
    const difficultyStats = { Easy: { total: 0, correct: 0 }, Medium: { total: 0, correct: 0 }, Hard: { total: 0, correct: 0 } };
    const historyMap = {};

    validSubmissions.forEach(sub => {
        totalScore += (sub.score || 0);
        
        // Topic Breakdown
        const topic = sub.question?.topic || 'Uncategorized';
        if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0 };
        topicStats[topic].total += 1;
        if (sub.isCorrect) {
            topicStats[topic].correct += 1;
            correctAnswers += 1;
        }

        // Difficulty Breakdown
        const diff = sub.question?.difficulty || 'Easy';
        if (difficultyStats[diff]) {
            difficultyStats[diff].total += 1;
            if (sub.isCorrect) difficultyStats[diff].correct += 1;
        }

        // History
        const date = sub.createdAt.toISOString().split('T')[0];
        if (!historyMap[date]) historyMap[date] = 0;
        historyMap[date] += 1;
    });

    const overallAccuracy = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;
    
    const topicBreakdown = Object.keys(topicStats).map(name => {
        const topicSubmissions = validSubmissions.filter(s => (s.question?.topic || 'Uncategorized') === name);
        const lastActivity = topicSubmissions.length > 0 ? topicSubmissions[topicSubmissions.length - 1].createdAt : new Date(0);
        return {
            name,
            accuracy: topicStats[name].total > 0 ? Math.round((topicStats[name].correct / topicStats[name].total) * 100) : 0,
            count: topicStats[name].total,
            lastActivity
        };
    }).sort((a, b) => b.lastActivity - a.lastActivity);

    const difficultyBreakdown = {};
    Object.keys(difficultyStats).forEach(key => {
        difficultyBreakdown[key] = difficultyStats[key].total > 0 
            ? Math.round((difficultyStats[key].correct / difficultyStats[key].total) * 100)
            : 0;
    });

    const practiceHistory = Object.keys(historyMap).sort().map(date => {
        const daySubmissions = validSubmissions.filter(s => s.createdAt.toISOString().split('T')[0] === date);
        const dayCorrect = daySubmissions.filter(s => s.isCorrect).length;
        const count = daySubmissions.length;
        return {
            date,
            attempts: count,
            correct: dayCorrect,
            incorrect: Math.max(0, count - dayCorrect),
            accuracy: Math.round((dayCorrect / count) * 100)
        };
    }).slice(-7);

    // Readiness Index: Combined metric of accuracy and participation
    const readinessIndex = Math.min(100, Math.round(overallAccuracy * 0.7 + Math.min(totalAttempts * 2, 30)));

    // RECENT-BIASED ANALYTICS for Weak Topics and Recommendations
    const recentSubmissions = validSubmissions.slice(-20);
    const recentTopicStats = {};
    recentSubmissions.forEach(sub => {
        const topic = sub.question?.topic || 'Uncategorized';
        if (!recentTopicStats[topic]) recentTopicStats[topic] = { total: 0, correct: 0 };
        recentTopicStats[topic].total += 1;
        if (sub.isCorrect) recentTopicStats[topic].correct += 1;
    });

    const recentTopicBreakdown = Object.keys(recentTopicStats).map(name => ({
        name,
        accuracy: Math.round((recentTopicStats[name].correct / recentTopicStats[name].total) * 100)
    }));

    const strongTopics = recentTopicBreakdown.filter(t => t.accuracy >= 75).map(t => t.name);
    const weakTopics = recentTopicBreakdown.filter(t => t.accuracy < 60).map(t => t.name);

    // Identify the very latest topic
    const latestTopic = validSubmissions[validSubmissions.length - 1]?.question?.topic || 'Uncategorized';
    
    // CURRENT SESSION STATS (Requested by user)
    const latestSession = validSubmissions[validSubmissions.length - 1]?.session;
    let currentSessionStats = null;
    
    if (latestSession && latestSession.status === 'active') {
        const sessionSubmissions = validSubmissions.filter(s => s.session?._id.toString() === latestSession._id.toString());
        currentSessionStats = {
            topic: latestSession.topic,
            totalQuestions: latestSession.totalQuestions || 0,
            solved: sessionSubmissions.length,
            accuracy: sessionSubmissions.length > 0 
                ? Math.round((sessionSubmissions.filter(s => s.isCorrect).length / sessionSubmissions.length) * 100)
                : 0
        };
    }
    
    // Ensure latest topic is prominent if it's weak
    let finalWeakTopics = weakTopics;
    if (recentTopicStats[latestTopic] && (recentTopicStats[latestTopic].correct / recentTopicStats[latestTopic].total) < 0.6) {
        if (!finalWeakTopics.includes(latestTopic)) {
            finalWeakTopics = [latestTopic, ...finalWeakTopics];
        } else {
            // Move to front
            finalWeakTopics = [latestTopic, ...finalWeakTopics.filter(t => t !== latestTopic)];
        }
    }

    // If no recent weak topics, fall back to global ones
    if (finalWeakTopics.length === 0) {
        finalWeakTopics = topicBreakdown.filter(t => t.accuracy < 60).map(t => t.name);
    }

    const analyticsData = {
        overallAccuracy,
        totalAttempts,
        topicBreakdown,
        difficultyBreakdown,
        practiceHistory,
        readinessIndex,
        strongTopics,
        weakTopics: finalWeakTopics,
        recentActivity: validSubmissions.slice(-6).reverse().map(s => ({
            title: s.question?.topic || 'Practice Session',
            date: s.createdAt,
            score: s.score,
            isCorrect: s.isCorrect
        })),
        currentSessionStats
    };

    // PERSIST TO MONGODB
    try {
        await Analytics.findOneAndUpdate(
            { user: userId },
            {
                overallScore: overallAccuracy,
                totalQuestionsAttempted: totalAttempts,
                correctAnswers: correctAnswers,
                weakTopics: finalWeakTopics,
                strongTopics: strongTopics,
                readinessIndex: readinessIndex,
                topicBreakdown: topicBreakdown,
            },
            { upsert: true, returnDocument: 'after' }
        );
    } catch (dbErr) {
        console.error("Failed to persist analytics to MongoDB:", dbErr);
    }

    return analyticsData;
};

// Helper for other endpoints to get only valid (session-linked) submissions
const getValidSubmissions = async (userId) => {
    const submissions = await Submission.find({ user: userId }).populate('question').populate('session');
    return submissions.filter(sub => !!sub.session);
};

export const getUserAnalytics = asyncHandler(async (req, res) => {
    const analytics = await calculateAndStoreAnalytics(req.user._id);
    return res.status(200).json(new ApiResponse(200, analytics, "Analytics fetched and stored successfully"));
});


export const updateAnalytics = asyncHandler(async (req, res) => {
    // This now just points to the same logic for consistency
    return getUserAnalytics(req, res);
});

export const getRiskPrediction = asyncHandler(async (req, res) => {
    const submissions = await getValidSubmissions(req.user._id);
    const accuracy = submissions.length > 0 
        ? (submissions.filter(s => s.isCorrect).length / submissions.length) * 100 
        : 0;
    
    let riskLevel = "High";
    if (accuracy > 80) riskLevel = "Low";
    else if (accuracy > 50) riskLevel = "Medium";

    return res.status(200).json(
        new ApiResponse(200, { riskLevel, probability: Math.max(0, (100 - accuracy) / 100) }, "Risk prediction fetched successfully")
    );
});

export const getWeakTopics = asyncHandler(async (req, res) => {
    const submissions = await getValidSubmissions(req.user._id);
    const topicStats = {};
    submissions.forEach(sub => {
        const topic = sub.question?.topic || 'Uncategorized';
        if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0 };
        topicStats[topic].total += 1;
        if (sub.isCorrect) topicStats[topic].correct += 1;
    });

    const weakTopics = Object.keys(topicStats)
        .filter(name => (topicStats[name].correct / topicStats[name].total) < 0.6)
        .map(name => ({ name, accuracy: Math.round((topicStats[name].correct / topicStats[name].total) * 100) }));

    return res.status(200).json(
        new ApiResponse(200, weakTopics, "Weak topics fetched successfully")
    );
});

export const getRecommendations = asyncHandler(async (req, res) => {
    const submissions = await getValidSubmissions(req.user._id);
    const topicStats = {};
    submissions.forEach(sub => {
        const topic = sub.question?.topic || 'Uncategorized';
        if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0 };
        topicStats[topic].total += 1;
        if (sub.isCorrect) topicStats[topic].correct += 1;
    });

    const recommendations = Object.keys(topicStats)
        .filter(name => (topicStats[name].correct / topicStats[name].total) < 0.7)
        .sort((a, b) => (topicStats[a].correct / topicStats[a].total) - (topicStats[b].correct / topicStats[b].total))
        .slice(0, 3)
        .map(name => `Focus on improving your skills in ${name}`);

    if (recommendations.length === 0) {
        recommendations.push("Keep up the great work! Try tackling higher difficulty questions.");
    }

    return res.status(200).json(
        new ApiResponse(200, recommendations, "Recommendations fetched successfully")
    );
});

export const saveStudyPlan = asyncHandler(async (req, res) => {
    const { studyPlan } = req.body;
    const analytics = await Analytics.findOneAndUpdate(
        { user: req.user._id },
        { studyPlan },
        { returnDocument: 'after', upsert: true }
    );
    return res.status(200).json(new ApiResponse(200, analytics.studyPlan, "Study plan saved successfully"));
});

export const generateStudyPlan = asyncHandler(async (req, res) => {
    const { topics, numDays } = req.body;
    let topicsToUse = [];

    if (topics && Array.isArray(topics) && topics.length > 0) {
        topicsToUse = topics;
    } else {
        const analytics = await calculateAndStoreAnalytics(req.user._id);
        topicsToUse = (analytics.weakTopics && analytics.weakTopics.length > 0) 
            ? analytics.weakTopics 
            : ["General Review", "Time Management", "Practice Tests"];
    }
    
    const duration = numDays || 7;
    let plan = await generateStudyPlanAI(topicsToUse, duration);

    if (!plan || !Array.isArray(plan)) {
        // Ultimate fallback if even AI Service fallback fails
        plan = [];
        for (let i = 1; i <= duration; i++) {
            const topic = topicsToUse[(i - 1) % topicsToUse.length];
            plan.push({
                day: i,
                topic,
                task: `Review and practice ${topic} concepts.`,
                isCompleted: false
            });
        }
    } else {
        // Ensure isCompleted is set for all items
        plan = plan.map(item => ({ ...item, isCompleted: !!item.isCompleted }));
    }

    const updatedAnalytics = await Analytics.findOneAndUpdate(
        { user: req.user._id },
        { studyPlan: plan },
        { returnDocument: 'after', upsert: true }
    );

    return res.status(200).json(new ApiResponse(200, updatedAnalytics.studyPlan, "Study plan generated successfully"));
});
