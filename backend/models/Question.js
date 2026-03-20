import mongoose, { Schema } from "mongoose";

const QuestionSchema = new Schema(
    {
        materialId: {
            type: Schema.Types.ObjectId,
            ref: "StudyMaterial"
        },
        topic: {
            type: String,
            required: true,
            trim: true
        },
        difficulty: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            required: true
        },
        questionType: {
            type: String,
            enum: ["MCQ", "ShortAnswer", "TrueFalse"],
            default: "MCQ"
        },
        questionText: {
            type: String,
            required: true
        },
        options: {
            type: [String],
            default: []
        },
        correctAnswer: {
            type: String,
            required: true
        },
        explanation: {
            type: String
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps: true }
);

export const Question = mongoose.model("Question", QuestionSchema);
