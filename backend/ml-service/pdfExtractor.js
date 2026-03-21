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
        const geminiKey = process.env.GEMINI_API_KEY;

        // Read PDF and convert to base64
        const pdfData = fs.readFileSync(pdfPath);
        const base64Pdf = pdfData.toString('base64');

        console.log(`[OCR-PDF] Analyzing document: ${pdfPath.split('/').pop()} (${(pdfData.length / 1024 / 1024).toFixed(2)} MB)`);

        // ── Tier 1: Gemini 2.0 Flash (Native PDF Multimodal) ──
        if (geminiKey) {
            try {
                console.log("[OCR-PDF] Level 1: Gemini 2.0 Flash (Large Document Scan)...");
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
                const geminiResponse = await axios.post(geminiUrl, {
                    contents: [{
                        parts: [
                            { text: "DEEP ACADEMIC EXTRACTION: You are analyzing a multi-page academic document (potentially involving handwritten notes). \n\nTasks:\n1. Transcribe EVERY page clearly, identifying headings, sub-headings, and keywords.\n2. Maintain the full intellectual depth. If a page contains a complex derivation or theorem, capture it word-for-word.\n3. Output exclusively in Markdown format.\n4. If there are diagrams, describe them in the context of the text.\n\nOutput only the Markdown content." },
                            { inline_data: { mime_type: "application/pdf", data: base64Pdf } }
                        ]
                    }]
                }, { headers: { 'Content-Type': 'application/json' }, timeout: 90000 });

                const text = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text && text.trim().length > 50) {
                    console.log("[OCR-PDF] Level 1 Success (Gemini Deep Scan)");
                    return text;
                }
            } catch (err) {
                console.warn("[OCR-PDF] Level 1 Failed (Gemini):", err.response?.data || err.message);
            }
        }

        // ── Tier 2: Mistral AI OCR (The Document Specialist) ──
        if (apiKey) {
            try {
                console.log(`[OCR-PDF] Level 2: Mistral AI OCR...`);
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
                        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                        timeout: 90000 // Extended for large documents
                    }
                );

                if (response.data?.pages?.length > 0) {
                    const markdown = response.data.pages.map(page => page.markdown || "").join('\n\n');
                    if (markdown.trim().length > 10) {
                        console.log(`[OCR-PDF] Level 2 Success (${response.data.pages.length} pages)`);
                        return markdown;
                    }
                }
            } catch (mistralErr) {
                console.error("[OCR-PDF] Level 2 Failed:", mistralErr.response?.data?.message || mistralErr.message);
            }
        }

        // ── Tier 3: Local Fallback (PDF-Parse for Digital Text) ──
        console.log("[OCR-PDF] Level 3: Falling back to local PDF-Parse (Digital Text)...");
        const data = await pdf(pdfData);
        if (data.text && data.text.trim().length > 10) {
            console.log("[OCR-PDF] Level 3 Success (Local Digital Extraction)");
            return data.text;
        }

        throw new Error('All OCR tiers failed to extract meaningful text from this PDF.');
    } catch (error) {
        console.error('[OCR-PDF-FATAL]:', error.message);
        throw new Error(`PDF scan failure: ${error.message}`);
    }
};

/**
 * Alternative: Process text with Groq (Fast alternative if Mistral is slow or for post-processing)
 */
export const postProcessWithGroq = async (text) => {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey || !text || text.length < 50) return text;

    try {
        // If text is extremely large (e.g. >30k characters), we take the first 30k for key extraction
        // to avoid model context issues on Llama (though 70b has 128k, large single inputs can be slow)
        const processingText = text.slice(0, 50000); 

        console.log(`[OCR-POST] Refining ${processingText.length} chars with Llama 3.3 70B...`);
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile', 
                messages: [
                    {
                        role: 'system',
                        content: MASTER_ANALYSIS_PROMPT + "\n\nCRITICAL: If the document is large, focus on extracting a comprehensive set of keywords, topics, and headings from ALL sections. Do not truncate the intellectual content."
                    },
                    {
                        role: 'user',
                        content: `Input Material:\n${processingText}`
                    }
                ],
                temperature: 0.1
            },
            {
                headers: {
                    'Authorization': `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const refined = response.data.choices[0].message.content;
        return refined || text;
    } catch (error) {
        console.error('Groq Post-process Error:', error.response?.data || error.message);
        return text; 
    }
};