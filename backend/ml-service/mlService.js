import fs from 'fs';
import { performOCR, processWithGroq } from './imageOCR.js';
import { extractTextFromPDF as extractTextFromPDF_IMPL, postProcessWithGroq } from './pdfExtractor.js';
import axios from 'axios';
import dotenv from 'dotenv';
import mammoth from 'mammoth';

dotenv.config();

export const MASTER_ANALYSIS_PROMPT = `
You are a high-precision Academic OCR Refinement Engine. 
Your goal is to take OCR-transcribed text (potentially containing handwritten notes) and normalize it into a perfectly readable, Word-by-Word Markdown structure.

CORE DIRECTIVES:
1. RAW RECOGNITION: Prioritize exact transcription. Do not "expand" or "summarize" unless necessary to fix a broken word.
2. FIX DISRUPTIONS: Quietly fix common handwriting errors (e.g., "Lex-ical" -> "Lexical").
3. MAINTAIN LISTS: If the user wrote a list (1..., 2..., or bullet points), ensure the Markdown reflects that list structure with 100% fidelity.
4. TECHNICAL ACCURACY: Ensure technical terms and academic concepts are spelled and formatted correctly according to the context of the notes.
5. NO HALLUCINATION: If a word is truly illegible, use "[...]" instead of guessing. Do NOT add any information not present in the original OCR text.

OUTPUT FORMAT:
- Output ONLY the reconstructed text in Markdown.
- No commentary, no suggestions, no additional questions.
- Focus purely on 'visualizing' the original handwritten notes word-by-word.
`;

/**
 * Enhanced PDF text extraction using high-accuracy Mistral OCR v3.
 */
export const extractTextFromPDF = async (filePath) => {
    try {
        console.log(`[ML-Service] Processing PDF: ${filePath}`);
        const rawText = await extractTextFromPDF_IMPL(filePath);
        return await postProcessWithGroq(rawText);
    } catch (error) {
        console.error("[ML-Service] PDF Extraction Failure:", error.message);
        if (process.env.USE_MOCK_AI === 'true') return "# Mock PDF Content";
        throw error;
    }
};

/**
 * Enhanced DOCX text extraction using Mammoth.
 */
export const extractTextFromDocx = async (filePath) => {
    try {
        console.log(`[ML-Service] Processing DOCX: ${filePath}`);
        const result = await mammoth.extractRawText({ path: filePath });
        const rawText = result.value; // The raw text
        const messages = result.messages; // Any messages, such as warnings
        
        if (messages.length > 0) {
            console.warn("[ML-Service] DOCX Extraction Messages:", messages);
        }

        if (!rawText || rawText.trim().length === 0) {
            return "No text could be extracted from this DOCX file.";
        }

        return await postProcessWithGroq(rawText);
    } catch (error) {
        console.error("[ML-Service] DOCX Extraction Failure:", error.message);
        if (process.env.USE_MOCK_AI === 'true') return "# Mock DOCX Content";
        throw error;
    }
};

/**
 * Enhanced Image OCR using high-accuracy Multi-Tier strategy.
 */
export const extractTextFromImage = async (filePath) => {
    try {
        console.log(`[ML-Service] Step 1: Running Multi-Tier OCR on ${filePath}...`);
        const rawText = await performOCR(filePath);
        
        const isFailure = rawText.includes("GUIDED_FAILURE") || rawText.includes("SCAN_ERROR");
        
        if (!isFailure && rawText.trim().length > 20) {
            try {
                console.log("[ML-Service] Step 2: Refining layout with Groq...");
                return await processWithGroq(rawText, "Normalize the following OCR text for an academic question generator.");
            } catch (err) {
                console.warn("[ML-Service] Layout refinement skipped:", err.message);
                return rawText;
            }
        }
        return rawText;
    } catch (error) {
        console.error("[ML-Service] Image OCR Fatal:", error.message);
        throw error;
    }
};

/**
 * Extract topics from material using FastAPI ML Service.
 */
export const extractTopics = async (text) => {
    try {
        if (text.includes("GUIDED_FAILURE")) {
            return { topics: ["Select Topic Manually", "Optical Character Recognition", "Handwriting Scan"], difficulty: "Intermediate", estimated_time: "Unknown" };
        }

        // For large documents, we use an AI prompt instead of a simple classification if available
        const groqApiKey = process.env.GROQ_API_KEY;
        if (groqApiKey && text.length > 500) {
            console.log(`[Topic-Analyzer] Exhaustive scan for ${text.length} chars...`);
            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are an academic concept extractor. Your goal is to identify ALL distinct scientific or technical topics, keywords, and headers from the provided material. Be exhaustive but STRICTLY GROUNDED in the provided text. Look for handwritten keywords and major thematic sections. Return between 5 and 15 topics based on the depth of the content.' 
                    },
                    { 
                        role: 'user', 
                        content: `Input Material:\n${text.slice(0, 40000)}\n\nINSTRUCTIONS:\n1. Extract only topics explicitly mentioned or clearly implied by the context.\n2. Do NOT use generic computer science terms (like "Compiler Design" or "IoT") unless they are present in the text.\n3. Identify major entities, events, or categories from the notes.\n\nReturn JSON: {"topics": ["Topic 1", "Topic 2", ...], "difficulty": "Easy|Medium|Hard", "estimated_time": "X hours"}` 
                    }
                ],
                response_format: { type: "json_object" }
            }, { headers: { 'Authorization': `Bearer ${groqApiKey}` }, timeout: 20000 });

            return JSON.parse(response.data.choices[0].message.content);
        }

        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
        const response = await axios.post(`${mlServiceUrl}/extract-topics`, { text }, { timeout: 15000 });
        return response.data;
    } catch (error) {
        console.warn("[Topic-Analyzer] AI Extraction failed, using heuristics:", error.message);
        const topics = ["General Knowledge"];
        if (text.toLowerCase().includes("hdfc")) topics.push("Banking & Finance");
        if (text.toLowerCase().includes("krona")) topics.push("Global Economics");
        if (text.toLowerCase().includes("handwritten")) topics.push("Manual Notes Analysis");
        return { topics, difficulty: "Medium", estimated_time: "1 hour" };
    }
};

/**
 * Analyze solution using FastAPI ML Service.
 */
export const analyzeSolution = async (question, solution) => {
    try {
        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
        const response = await axios.post(`${mlServiceUrl}/analyze-solution`, {
            question: question,
            student_solution: solution
        }, { timeout: 20000 });
        return response.data;
    } catch (error) {
        console.error("[ML-Service] Solution Analysis Failed:", error.message);
        throw error;
    }
};

/**
 * Get prerequisites for a topic using FastAPI ML Service.
 */
export const getPrerequisites = async (topic) => {
    try {
        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
        const response = await axios.post(`${mlServiceUrl}/prerequisites`, { topic }, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error("[ML-Service] Prerequisites Retrieval Failed:", error.message);
        return { prerequisites: ["Basic concepts"], estimated_revision_time: "Unknown" };
    }
};

/**
 * High-performance Question Generation with Multi-LLM recovery.
 */
export const generateQuestionsFromText = async (text, difficulty = "Medium", questionCount = 5, topic = "") => {
    try {
        const groqApiKey = process.env.GROQ_API_KEY;
        const geminiApiKey = process.env.GEMINI_API_KEY;

        // Normalize difficulty to match Mongoose schema Enum: ["Easy", "Medium", "Hard"]
        let targetDiff = "Medium";
        const d = (difficulty || "Medium").toLowerCase();
        if (d.includes("easy")) targetDiff = "Easy";
        else if (d.includes("hard")) targetDiff = "Hard";
        else if (d.includes("inter") || d.includes("med")) targetDiff = "Medium";

        const contextText = (text && text.length > 50) ? text : `Generic academic topic: ${topic || 'General Science'}`;
        const targetTopic = topic || "General Concepts";

        // Safety Valve for low-quality source text + No Topic
        if (contextText.includes("GUIDED_FAILURE") && !topic) {
             console.log("[ML-Service] Rescue: No text/topic context. providing fallback questions.");
             return [
                {
                    topic: "Academic Success",
                    difficulty: targetDiff,
                    questionText: "Which of the following describes the 'Active Recall' study technique?",
                    options: ["Rereading notes multiple times", "Testing yourself without looking at material", "Highlighting key sentences", "Listening to lectures while sleeping"],
                    correctAnswer: "Testing yourself without looking at material",
                    explanation: "Active recall is far more effective for long-term memory than passive review or highlighting."
                }
             ].slice(0, Math.max(1, questionCount));
        }

        const isMultipleTopics = targetTopic.includes(',');
        
        const prompt = `You are an elite examiner. Generate exactly ${questionCount} MCQs ${isMultipleTopics ? `covering the following topics: "${targetTopic}"` : `about "${targetTopic}"`}.
        Difficulty Level: ${targetDiff}.
        ${text && text.length > 50 ? `Context Material: \n\n${text}\n\n` : `Provide expert questions based on general knowledge for ${isMultipleTopics ? 'these topics' : `"${targetTopic}"`}.`}
        
        ${isMultipleTopics ? `IMPORTANT: Ensure the questions are distributed across the different topics mentioned.` : ''}

        NOTE: The context material may contain sections like "Clean Rewritten Notes", "Key Topics", "Detailed Explanation", and "Key Insights Extraction". Use all sections—especially the detailed explanations and formulas—to create deep, application-based questions that test genuine academic understanding.
        
        Return ONLY valid JSON: {"questions": [{"topic": "Specific Topic", "difficulty": "${targetDiff}", "questionText": "...", "options": ["A","B","C","D"], "correctAnswer": "...", "explanation": "..."}]}`;

        // Tier 1: Groq (Try both common model names for free tier)
        if (groqApiKey) {
            const models = ['llama-3.3-70b-versatile', 'llama3-70b-8192', 'mixtral-8x7b-32768'];
            for (const model of models) {
                try {
                    console.log(`[ML-Service] Gen Level 1: Groq (${model})...`);
                    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                        model: model,
                        messages: [
                            { role: 'system', content: 'You are an academic JSON generator. Return ONLY JSON.' },
                            { role: 'user', content: prompt }
                        ],
                        response_format: { type: "json_object" }
                    }, { headers: { 'Authorization': `Bearer ${groqApiKey}` }, timeout: 45000 });

                    const data = JSON.parse(response.data.choices[0].message.content);
                    const qList = data.questions || data;
                    return Array.isArray(qList) ? qList.slice(0, questionCount) : [qList];
                } catch (err) {
                    console.warn(`[ML-Service] Groq ${model} Failed:`, err.message);
                    continue; 
                }
            }
        }

        // Tier 2: Gemini
        if (geminiApiKey) {
            try {
                console.log("[ML-Service] Gen Level 2: Gemini...");
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
                const response = await axios.post(url, {
                    contents: [{ parts: [{ text: `${prompt}\n\nContent:\n${text}` }] }],
                    generationConfig: { response_mime_type: "application/json" }
                }, { timeout: 40000 });

                const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                const data = JSON.parse(content);
                const qList = data.questions || data;
                return Array.isArray(qList) ? qList.slice(0, questionCount) : [qList];
            } catch (err) {
                console.warn("[ML-Service] Gemini Gen Failed:", err.message);
            }
        }

        // ── FINAL RESORT: If everything above fails, return high-quality static questions ──
        console.warn("[ML-Service] ALL AI PROVIDERS FAILED. Returning high-quality static fallback questions.");
        return [
            {
                topic: targetTopic,
                difficulty,
                questionText: `What is one fundamental concept often discussed in "${targetTopic}"?`,
                options: ["Option A: Core Theory", "Option B: Visual Analysis", "Option C: Practical Application", "Option D: All of the above"],
                correctAnswer: "Option D: All of the above",
                explanation: `While I couldn't connect to the AI right now, "${targetTopic}" usually involves theory, analysis, and practice.`
            },
            {
                topic: targetTopic,
                difficulty,
                questionText: `Which of the following is a key challenge when studying "${targetTopic}"?`,
                options: ["Complexity of Data", "Time Management", "Resource Availability", "Grover's Algorithm"],
                correctAnswer: "Complexity of Data",
                explanation: `Most academic subjects like "${targetTopic}" require deep analysis of complex data sets.`
            }
        ].slice(0, Math.max(2, questionCount));

    } catch (error) {
        console.error("[ML-Service] Gen Fatal (Even Fallback Failed!):", error.message);
        // Absolute last safety net
        return [{
            topic: "Emergency Mode",
            difficulty: "Easy",
            questionText: "The AI is currently under heavy load (Rate Limited). Would you like to try again in 60 seconds?",
            options: ["Try Again", "Use Offline Mode", "Contact Support", "Continue Studying"],
            correctAnswer: "Try Again",
            explanation: "Rate limits occur when too many requests are sent in a short time to the free-tier AI models."
        }];
    }
};

/**
 * Simple internal answer evaluation.
 */
export const evaluateAnswer = async (question, correctAnswer, userAnswer, options = []) => {
    try {
        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) return { isCorrect: userAnswer === correctAnswer, score: userAnswer === correctAnswer ? 100 : 0, feedback: "Direct match evaluation." };

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.3-70b-versatile',
            messages: [
                { 
                    role: 'system', 
                    content: `You are an elite academic evaluator. Your task is to provide a "DEEP LOGICAL" assessment of a student's answer.
                    
                    EVALUATION CRITERIA:
                    1. FACTUAL ACCURACY: Is the student's answer factually correct for the given question? Do not rely solely on the "Expected Answer" if the student's reasoning is sound and reflects current technical reality.
                    2. CONCEPTUAL DEPTH: Does the student demonstrate understanding of the underlying principles?
                    3. TONE: 
                       - If wrong: Be firm and "downgrading" but highly educational. Explain exactly what was missed.
                       - If right: Be encouraging and professional.
                    
                    RETURN JSON ONLY: 
                    {
                        "isCorrect": boolean, 
                        "score": number (0-100), 
                        "feedback": "Deeply reasoned explanation (1-2 sentences)",
                        "stepAnalysis": ["Logical Step 1...", "Logical Step 2..."]
                    }` 
                },
                { role: 'user', content: `Question: ${question}\n${options?.length > 0 ? `Options: ${options.join(' | ')}\n` : ''}Expected Answer (from system): ${correctAnswer}\nStudent's Submitted Result: ${userAnswer}` }
            ],
            response_format: { type: "json_object" }
        }, { headers: { 'Authorization': `Bearer ${groqApiKey}` }, timeout: 25000 });

        const evaluation = JSON.parse(response.data.choices[0].message.content);
        return {
            isCorrect: evaluation.isCorrect || false,
            score: evaluation.score || 0,
            feedback: evaluation.feedback || "Accuracy assessment complete.",
            stepAnalysis: evaluation.stepAnalysis || []
        };
    } catch (error) {
        return { isCorrect: userAnswer === correctAnswer, score: userAnswer === correctAnswer ? 100 : 0, feedback: "Evaluation error, direct match used." };
    }
};

/**
 * AI-powered Study Plan Generation.
 */
export const generateStudyPlanAI = async (topics, duration) => {
    try {
        const groqApiKey = process.env.GROQ_API_KEY;
        const geminiApiKey = process.env.GEMINI_API_KEY;

        const prompt = `You are an expert AI academic advisor. Generate a highly personalized ${duration}-day study roadmap for the following topics: ${topics.join(', ')}.
        
        CRITICAL RULES:
        1. NO REPETITION: Every day must have a UNIQUE, logical, and progressive task. 
        2. REASONING: Each task should reflect a "thought-out" approach (e.g., conceptual review first, then practical application, then advanced problem solving).
        3. FORMAT: Each task should be descriptive (1-2 sentences) and professional.
        4. OUTPUT: Return ONLY a JSON object with this structure: 
           {"plan": [{"day": 1, "topic": "...", "task": "..."}]}`;

        // Tier 1: Groq
        if (groqApiKey) {
            try {
                const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: 'You are an academic JSON generator.' },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: "json_object" }
                }, { headers: { 'Authorization': `Bearer ${groqApiKey}` }, timeout: 30000 });

                const data = JSON.parse(response.data.choices[0].message.content);
                return data.plan || data;
            } catch (err) {
                console.warn("[ML-Service] AI Study Plan (Groq) Failed:", err.message);
            }
        }

        // Tier 2: Gemini fallback
        if (geminiApiKey) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
                const response = await axios.post(url, {
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { response_mime_type: "application/json" }
                }, { timeout: 30000 });

                const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                const data = JSON.parse(content);
                return data.plan || data;
            } catch (err) {
                console.warn("[ML-Service] AI Study Plan (Gemini) Failed:", err.message);
            }
        }

        // Fallback: Smart Hardcoded Patterns
        const fallbackPlan = [];
        const taskTemplates = [
            "Foundational Review: Master core concepts and definitions of {topic}.",
            "Practical Application: Solve medium-difficulty problems and application-based questions on {topic}.",
            "Advanced Deep Dive: Tackle complex scenarios and edge cases relevant to {topic}.",
            "Synoptic Review: Connect {topic} with previous concepts and take a timed mini-quiz.",
            "Visual Learning: Create a detailed mind-map or flow-chart of {topic} architecture.",
            "Mock Implementation: Build a small simulation or manual project based on {topic} principles.",
            "Retrospective: Identify remaining gaps in {topic} and perform targeted revision."
        ];

        for (let i = 1; i <= duration; i++) {
            const topic = topics[(i - 1) % topics.length];
            const template = taskTemplates[(i - 1) % taskTemplates.length];
            fallbackPlan.push({
                day: i,
                topic,
                task: template.replace('{topic}', topic),
                isCompleted: false
            });
        }
        return fallbackPlan;

    } catch (error) {
        console.error("[ML-Service] Study Plan AI Fatal:", error.message);
        return null;
    }
};
