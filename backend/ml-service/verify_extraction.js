import dotenv from 'dotenv';
import { extractTopics } from './mlService.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env');
console.log("Loading .env from:", envPath);
dotenv.config({ path: envPath });

if (!process.env.GROQ_API_KEY) {
    console.error("CRITICAL: GROQ_API_KEY is not set! Check your .env file or path.");
    process.exit(1);
}

const SAMPLE_TEXT = `
Currency - Icelandic Krona.
41. HDFC Bank CEO - Aditya Puri.
42. Reliance Industries Limited CEO - Mukesh Ambani.
43. International Women's Day - 8 March.
44. Ayushman Bharat Yojana launched - 25 September, 2018.
45. Charles Frederick Worth first fashion designer of the world.
46. UAE's Director of Cricket - Robin Singh.
47. Union Minister for Coal and Mines - Shri Prahlad Joshi.
48. Drugs and Cosmetics Act (DCA) was passed in 1940.
49. BARC - Bhabha Atomic Research Centre.
50. ClimFishCon 2020 held in Kerala on 12 February.
51. National Productivity Day - 12 February.
52. International Day of Women and Girls in Science - 11 February.
53. World Unani Day - 11 February.
54. National Institute of Financial Management (NIFM) renamed as Arun Jaitley National Institute of Financial Management (AJNIFM).
55. IOC - International Olympic Committee.
56. Armand Duplantis sets pole vault world record in Poland.
57. UDAN - Ude Desh ka Aam Nagrik.
`;

async function runTest() {
    console.log("--- Starting Extraction Verification ---");
    console.log("Input text length:", SAMPLE_TEXT.length);
    
    try {
        const result = await extractTopics(SAMPLE_TEXT);
        console.log("\nDetected Topics:");
        console.log(JSON.stringify(result, null, 2));

        const hallucinations = ["Compiler Design", "Internet of Things", "IoT", "RFID", "Lexical Analysis"];
        const foundHallucinations = result.topics.filter(t => hallucinations.some(h => t.toLowerCase().includes(h.toLowerCase())));

        if (foundHallucinations.length > 0) {
            console.error("\nFAIL: Found hallucinations:", foundHallucinations);
        } else {
            console.log("\nSUCCESS: No hallucinations detected.");
        }

        const expectedKeywords = ["HDFC", "Reliance", "Women's Day", "BARC", "Unani", "Aviation", "Sports"];
        const foundKeywords = result.topics.filter(t => expectedKeywords.some(k => t.toLowerCase().includes(k.toLowerCase())));
        
        console.log(`\nGrounding check: Found ${foundKeywords.length}/${expectedKeywords.length} key content areas.`);
        
        const finalResult = {
            result,
            foundHallucinations,
            foundKeywords,
            passed: foundHallucinations.length === 0 && result.topics.length >= 5
        };

        fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(finalResult, null, 2));
        console.log("\nRESULTS SAVED TO results.json");

    } catch (error) {
        console.error("Test failed with error:", error.message);
    }
}

runTest();
