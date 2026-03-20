import mongoose, { Schema } from "mongoose";

const StudyMaterialSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        files: [
            {
                url: String,
                fileId: String,
                name: String,
                size: Number,
                fileType: String
            }
        ],
        fileUrl: String, // Keeping for backward compatibility (legacy)
        fileType: {
            type: String,
            enum: ["pdf", "image", "text", "docs", "multi"],
            required: true
        },
        extractedText: {
            type: String
        },
        status: {
            type: String,
            enum: ["pending", "processing", "completed", "failed"],
            default: "pending"
        }
    },
    { timestamps: true }
);

export const StudyMaterial = mongoose.model("StudyMaterial", StudyMaterialSchema);
