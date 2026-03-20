import fs from 'fs';
import dotenv from 'dotenv';
import axios from 'axios';
import { createRequire } from 'module';
import { MASTER_ANALYSIS_PROMPT } from './mlService.js';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

dotenv.config();

export const extractTextFromPDF = async (pdfPath) => {
    try {
        const apiKey = process.env.MISTRAL_API_KEY;
        if (!apiKey) {
            throw new Error('Mistral API Key is missing in .env');
        }

        // Read PDF and convert to base64
        const pdfData = fs.readFileSync(pdfPath);
        const base64Pdf = pdfData.toString('base64');

        try {
            console.log(`[OCR-PDF] Attempting Mistral AI OCR for ${pdfPath.split('/').pop()}...`);
            const response = await axios.post(
                'https://api.mistral.ai/v1/ocr',
                {
                    model: 'mistral-ocr-latest',
                    document: {
                        type: 'document_url',
                        document_url: `data:application/pdf;base64,${base64Pdf}`
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 45000 // 45s timeout for large PDFs
                }
            );

            if (response.data?.pages?.length > 0) {
                const markdown = response.data.pages.map(page => page.markdown || "").join('\n\n');
                if (markdown.trim().length > 5) return markdown;
            }
            console.warn("[OCR-PDF] Mistral returned empty pages, trying fallback...");
        } catch (mistralErr) {
            console.error("[OCR-PDF] Mistral Failed:", mistralErr.response?.data?.message || mistralErr.message);
            console.log("[OCR-PDF] Falling back to local PDF-Parse (Digital Text Extraction)...");
            
            // Local fallback for digital PDFs
            const data = await pdf(pdfData);
            if (data.text && data.text.trim().length > 10) {
                console.log("[OCR-PDF] Digital text successfully extracted via fallback.");
                return data.text;
            }
            
            throw new Error(mistralErr.response?.data?.message || mistralErr.message || 'No text extracted from PDF.'); 
        }

        throw new Error('No text extracted from PDF.');

    } catch (error) {
        console.error('PDF OCR Processing Failure:', error.response?.data || error.message);
        throw new Error(`PDF processing failed: ${error.message}`);
    }
};

/**
 * Alternative: Process text with Groq (Fast alternative if Mistral is slow or for post-processing)
 */
export const postProcessWithGroq = async (text) => {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) return text; // Bypass if no key

    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama3-8b-8192', 
                messages: [
                    {
                        role: 'system',
                        content: MASTER_ANALYSIS_PROMPT
                    },
                    {
                        role: 'user',
                        content: `Input Content (from OCR/PDF Extraction):\n${text}`
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
        console.error('Groq Post-process Error:', error.response?.data || error.message);
        return text; // Return original if post-processing fails
    }
};