import mongoose, { Schema } from "mongoose";

const SubmissionSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        question: {
            type: Schema.Types.ObjectId,
            ref: "Question",
            required: true
        },
        userAnswer: {
            type: String,
            required: true
        },
        attachmentUrl: {
            type: String // ImageKit URL
        },
        attachmentId: {
            type: String // ImageKit file ID
        },
        isCorrect: {
            type: Boolean,
            default: false
        },
        score: {
            type: Number,
            default: 0
        },
        feedback: {
            type: String
        },
        stepAnalysis: {
            type: [String] // Detailed steps from AI
        },
        timeTaken: {
            type: Number // in seconds
        }
    },
    { timestamps: true }
);

export const Submission = mongoose.model("Submission", SubmissionSchema);
