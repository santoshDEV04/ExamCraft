import mongoose, { Schema } from "mongoose";

const AnalyticsSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        overallScore: {
            type: Number,
            default: 0
        },
        totalQuestionsAttempted: {
            type: Number,
            default: 0
        },
        correctAnswers: {
            type: Number,
            default: 0
        },
        weakTopics: {
            type: [String],
            default: []
        },
        strongTopics: {
            type: [String],
            default: []
        },
        readinessIndex: {
            type: Number,
            default: 0
        },
        topicBreakdown: [
            {
                name: String,
                accuracy: Number,
                count: Number
            }
        ],
        performanceHistory: [
            {
                date: { type: Date, default: Date.now },
                score: Number,
                topic: String
            }
        ],
        studyPlan: [
            {
                day: Number,
                topic: String,
                task: String,
                isCompleted: { type: Boolean, default: false }
            }
        ]
    },
    { timestamps: true }
);

export const Analytics = mongoose.model("Analytics", AnalyticsSchema);
