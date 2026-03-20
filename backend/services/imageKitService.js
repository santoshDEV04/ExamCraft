import ImageKit from "@imagekit/nodejs";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

/**
 * Upload a file to ImageKit
 * @param {string} localFilePath - Path to the local file
 * @param {string} fileName - Desired name for the file in ImageKit
 * @param {string} folder - Folder name in ImageKit
 * @returns {Promise<object>} - ImageKit upload result
 */
export const uploadToImageKit = async (localFilePath, fileName, folder = "uploads") => {
    try {
        if (!localFilePath) return null;

        // Read file as buffer and convert to base64
        const fileBuffer = fs.readFileSync(localFilePath);
        const base64File = fileBuffer.toString("base64");

        const response = await imagekit.files.upload({
            file: base64File,
            fileName: fileName,
            folder: folder,
        });

        // Delete local file after upload
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response;
    } catch (error) {
        console.error("ImageKit Upload Error:", error);
        // Clean up local file even on error
        if (localFilePath && fs.existsSync(localFilePath)) {
            try {
                fs.unlinkSync(localFilePath);
            } catch (err) {
                // Ignore unlink errors
            }
        }
        return null;
    }
};

/**
 * Delete a file from ImageKit
 * @param {string} fileId - ImageKit file ID
 */
export const deleteFromImageKit = async (fileId) => {
    try {
        if (!fileId) return;
        await imagekit.files.delete(fileId);
    } catch (error) {
        console.error("ImageKit Delete Error:", error);
    }
};

export default imagekit;
