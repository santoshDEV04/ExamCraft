import fs from 'fs';
import dotenv from 'dotenv';
import axios from 'axios';
import { MASTER_ANALYSIS_PROMPT } from './mlService.js';

dotenv.config();

/**
 * Perform OCR on an image using Mistral AI's OCR v3 model.
 * @param {string} imagePath - Path to the image file.
 * @returns {Promise<string>} - The extracted text in Markdown format.
 */
export const performOCR = async (imagePath) => {
    try {
        const imageData = fs.readFileSync(imagePath);
        const base64Image = imageData.toString('base64');
        const apiKey = process.env.MISTRAL_API_KEY;
        const extension = imagePath.split('.').pop().toLowerCase();
        const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';

        console.log(`[OCR-PIPELINE] Analyzing ${imagePath.split('/').pop()} (${mimeType})`);

        // ── Tier 1: Gemini 2.0 Flash (Strongest for Handwriting / Mixed Content) ──
        // We move Gemini to Tier 1 because it's significantly better at handwriting than Mistral OCR v1.
        const geminiKey = process.env.GEMINI_API_KEY;
        if (geminiKey) {
            try {
                console.log("[OCR] Level 1: Gemini 2.0 Flash (Handwriting Optimized)...");
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
                const geminiResponse = await axios.post(geminiUrl, {
                    contents: [{
                        parts: [
                            { text: "TRANSCRIPTION & MULTIMODAL ANALYSIS: You are an expert at deciphering handwritten notes, technical diagrams, and academic study material. \n\nTasks:\n1. Transcribe EVERY single word accurately, even if it is cursive, messy, or faintly written.\n2. Maintain the SPATIAL STRUCTURE of the notes exactly as written. Use Markdown headers for titles and indented bullet points for lists.\n3. Reconstruct broken or incomplete words using context (e.g., 'Lexic..' -> 'Lexical'), but only if the meaning is unambiguous. Do NOT add outside information.\n4. Identify and describe any diagrams, tables, or drawings in detail.\n5. If multiple subjects or sections are covered, keep them distinctly separate in the output.\n6. STRICT GROUNDING: ONLY output text that is visible in the image. Do NOT categorize or add generic labels like 'Topic:' or 'Subject:' unless they are written in the notes.\n\nOutput ONLY the transcribed Markdown content without preamble." },
                            { inline_data: { mime_type: mimeType, data: base64Image } }
                        ]
                    }]
                }, { headers: { 'Content-Type': 'application/json' }, timeout: 45000 });

                const text = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text && text.trim().length > 10) {
                    console.log("[OCR] Level 1 Success (Gemini)");
                    return text;
                }
            } catch (err) {
                console.warn("[OCR] Level 1 Failed (Gemini):", err.response?.data || err.message);
            }
        }

        // ── Tier 2: Mistral OCR (The Document Specialist) ──
        if (apiKey) {
            try {
                console.log(`[OCR] Level 2: Mistral AI OCR...`);
                const response = await axios.post(
                    'https://api.mistral.ai/v1/ocr',
                    {
                        model: 'mistral-ocr-latest',
                        document: { type: 'image_url', image_url: `data:${mimeType};base64,${base64Image}` }
                    },
                    {
                        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                        timeout: 50000
                    }
                );
                if (response.data?.pages?.length > 0) {
                    const text = response.data.pages.map(page => page.markdown || "").join('\n\n');
                    if (text.trim().length > 3) {
                        console.log("[OCR] Level 2 Success (Mistral)");
                        return text;
                    }
                }
            } catch (err) {
                console.warn("[OCR] Level 2 Failed (Mistral):", err.response?.data?.message || err.message);
            }
        }

        // ── Tier 3: Groq / Llama 3.2 Vision ──
        const groqKey = process.env.GROQ_API_KEY;
        if (groqKey) {
            try {
                console.log("[OCR] Level 3: Groq Llama 3.2 Vision...");
                const groqResponse = await axios.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    {
                        model: 'llama-3.2-11b-vision-preview',
                        messages: [{
                            role: 'user',
                            content: [
                                { type: 'text', text: 'Transcribe the text in this image perfectly. Output Markdown.' },
                                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
                            ]
                        }]
                    },
                    { headers: { 'Authorization': `Bearer ${groqKey}` }, timeout: 30000 }
                );
                const text = groqResponse.data.choices[0].message.content;
                if (text && text.trim().length > 3) {
                    console.log("[OCR] Level 3 Success (Groq)");
                    return text;
                }
            } catch (err) {
                console.warn("[OCR] Level 3 Failed (Groq):", err.message);
            }
        }

        // ── Tier 4: Local Tesseract (Last Resort) ──
        try {
            console.log("[OCR] Level 4: Local Tesseract (Offline)...");
            const tesseractModule = await import('tesseract.js');
            const { createWorker } = tesseractModule.default || tesseractModule;
            const worker = await createWorker('eng');
            
            // Try recognizing the path instead of buffer for better stability on Windows
            const { data: { text } } = await worker.recognize(imagePath);
            await worker.terminate();

            if (text && text.trim().length > 2) {
                console.log("[OCR] Level 4 Success (Tesseract)");
                return `[LOCAL OFFLINE SCAN]:\n\n${text}`;
            }
        } catch (err) {
            console.error("[OCR] Level 4 Failed (Tesseract):", err.message);
        }

        // FINAL SAFETY VALVE
        return "GUIDED_FAILURE: Our high-precision AI scanners (Gemini/Mistral) and local engine couldn't extract enough clear text from this image. \n\n**Suggestions:** \n1. Ensure the camera is stable and well-lit. \n2. Capture the text head-on (not at an angle). \n3. You can manually enter your topic below to keep practicing!";
    } catch (error) {
        console.error('[OCR-FATAL] Pipeline Error:', error.message);
        return "SCAN_ERROR: The processing pipeline encountered a technical issue.";
    }
};

/**
 * Alternative: Process OCR with Groq (Fast alternative if Mistral is slow or for post-processing)
 * Note: Groq's Vision models can also be used for OCR.
 */
export const processWithGroq = async (text, prompt) => {
    try {
        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
            throw new Error('Groq API Key is missing in .env');
        }

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile', // Stronger model for complex reconstruction
                messages: [
                    {
                        role: 'system',
                        content: MASTER_ANALYSIS_PROMPT
                    },
                    {
                        role: 'user',
                        content: `Input Content (from OCR):\n${text}`
                    }
                ],
                temperature: 0.1
            },
            {
                headers: {
                    'Authorization': `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content;

    } catch (error) {
        console.error('Groq Error:', error.response?.data || error.message);
        throw new Error(`Groq processing failed: ${error.message}`);
    }
};