import { Session } from '../models/Session.js';
import { Submission } from '../models/Submission.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

export const getSessions = asyncHandler(async (req, res) => {
    const sessions = await Session.find({ user: req.user._id })
        .populate('studyMaterial')
        .sort({ updatedAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, sessions, "Sessions fetched successfully")
    );
});

export const getSessionById = asyncHandler(async (req, res) => {
    const session = await Session.findById(req.params.id)
        .populate('studyMaterial')
        .populate('questions')
        .populate({
            path: 'submissions',
            populate: { path: 'question' }
        });

    if (!session) {
        throw new ApiError(404, "Session not found");
    }

    if (session.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized access to session");
    }

    return res.status(200).json(
        new ApiResponse(200, session, "Session fetched successfully")
    );
});

export const completeSession = asyncHandler(async (req, res) => {
    const session = await Session.findByIdAndUpdate(
        req.params.id,
        { status: "completed" },
        { returnDocument: 'after' }
    )
    .populate('studyMaterial')
    .populate('questions')
    .populate({
        path: 'submissions',
        populate: { path: 'question' }
    });

    if (!session) {
        throw new ApiError(404, "Session not found");
    }

    return res.status(200).json(
        new ApiResponse(200, session, "Session marked as completed")
    );
});

export const deleteSession = asyncHandler(async (req, res) => {
    const session = await Session.findById(req.params.id);
    if (!session) {
        throw new ApiError(404, "Session not found");
    }
    
    if (session.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized");
    }

    // Cascade delete submissions
    if (session.submissions?.length > 0) {
        console.log(`[Session] Clearing ${session.submissions.length} submissions for session ${session._id}`);
        await Submission.deleteMany({ _id: { $in: session.submissions } });
    }

    await Session.findByIdAndDelete(req.params.id);
    
    return res.status(200).json(
        new ApiResponse(200, null, "Session deleted successfully")
    );
});

export const toggleBookmark = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { questionId } = req.body;

    const session = await Session.findById(id);

    if (!session) {
        throw new ApiError(404, "Session not found");
    }

    if (session.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized");
    }

    const bookmarkIndex = session.bookmarks.indexOf(questionId);
    if (bookmarkIndex > -1) {
        session.bookmarks.splice(bookmarkIndex, 1);
    } else {
        session.bookmarks.push(questionId);
    }

    await session.save();

    return res.status(200).json(
        new ApiResponse(200, session.bookmarks, "Bookmark toggled successfully")
    );
});

export const viewSolution = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { questionId } = req.body;

    if (!questionId) {
        throw new ApiError(400, "Question ID is required");
    }

    const session = await Session.findById(id);

    if (!session) {
        throw new ApiError(404, "Session not found");
    }

    if (session.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized");
    }

    // Add to viewedSolutions if not already there
    if (!session.viewedSolutions.includes(questionId)) {
        session.viewedSolutions.push(questionId);
        await session.save();
    }

    return res.status(200).json(
        new ApiResponse(200, session.viewedSolutions, "Solution view recorded successfully")
    );
});
