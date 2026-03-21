import mongoose, { Schema } from "mongoose";

const SessionSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        studyMaterial: {
            type: Schema.Types.ObjectId,
            ref: "StudyMaterial"
        },
        topic: {
            type: String,
            required: true
        },
        difficulty: {
            type: String,
            enum: ["easy", "intermediate", "hard"],
            default: "intermediate"
        },
        questions: [
            {
                type: Schema.Types.ObjectId,
                ref: "Question"
            }
        ],
        submissions: [
            {
                type: Schema.Types.ObjectId,
                ref: "Submission"
            }
        ],
        status: {
            type: String,
            enum: ["active", "completed"],
            default: "active"
        },
        currentScore: {
            type: Number,
            default: 0
        },
        totalQuestions: {
            type: Number,
            default: 0
        },
        lastAccessedAt: {
            type: Date,
            default: Date.now
        },
        bookmarks: [
            {
                type: Schema.Types.ObjectId,
                ref: "Question"
            }
        ],
        solvedQuestions: [
            {
                type: Schema.Types.ObjectId,
                ref: "Question"
            }
        ],
        viewedSolutions: [
            {
                type: Schema.Types.ObjectId,
                ref: "Question"
            }
        ]
    },
    { timestamps: true }
);

export const Session = mongoose.model("Session", SessionSchema);
