// controllers/answerCheckController.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const GEMINI_MODEL = "gemini-2.5-flash-lite"

const jsonParser = (rawText) => {
    try {
        // Step 1: Basic validation
        if (!rawText || typeof rawText !== 'string') {
            throw new Error('Input must be a non-empty string');
        }

        // Step 2: Remove markdown-style code block wrappers
        const trimmed = rawText.trim();
        const isWrapped = trimmed.startsWith("```") && trimmed.endsWith("```");

        let cleaned = isWrapped
            ? trimmed.replace(/```json|```/g, "").trim()
            : trimmed;

        // Step 3: Clean control characters and problematic sequences
        cleaned = cleaned
            // Remove or replace control characters (except \n, \r, \t which might be intentional)
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
            // Fix common JSON issues
            .replace(/[\r\n\t]/g, ' ')  // Replace newlines and tabs with spaces in the outer structure
            // Remove any trailing commas before closing brackets/braces
            .replace(/,(\s*[}\]])/g, '$1')
            // Ensure proper spacing around colons and commas
            .replace(/:\s*"/g, ': "')
            .replace(/",\s*/g, '", ');

        // Step 4: Additional cleaning for embedded strings (preserve intentional escapes)
        // This helps with strings that contain unescaped quotes or control characters
        cleaned = cleaned.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match, content) => {
            // Clean content inside strings while preserving valid escapes
            const cleanContent = content
                .replace(/\\/g, '\\\\')  // Escape backslashes
                .replace(/"/g, '\\"')    // Escape quotes
                .replace(/\n/g, '\\n')   // Escape newlines
                .replace(/\r/g, '\\r')   // Escape carriage returns
                .replace(/\t/g, '\\t');  // Escape tabs
            return `"${cleanContent}"`;
        });

        // Step 6: Attempt to parse
        const parsed = JSON.parse(cleaned);
        return parsed;

    } catch (error) {
        // Enhanced error logging
        console.error("❌ Failed to parse JSON:", error.message);

        // Find error position if available
        const positionMatch = error.message.match(/position (\d+)/);
        if (positionMatch) {
            const position = parseInt(positionMatch[1]);
            console.error(`📍 Error at position: ${position}`);

            // Show context around the error
            const start = Math.max(0, position - 50);
            const end = Math.min(rawText.length, position + 50);
            const context = rawText.substring(start, end);
            const marker = ' '.repeat(Math.min(50, position - start)) + '^^^';

            console.error('🔍 Context around error:');
            console.error(context);
            console.error(marker);

            // Show character codes around the error position
            const problemChar = rawText.charAt(position);
            const charCode = problemChar.charCodeAt(0);
            console.error(`🚫 Problematic character: "${problemChar}" (char code: ${charCode})`);
        }

        // Show first 500 characters of cleaned input
        if (typeof cleaned !== 'undefined') {
            console.error("🧹 Cleaned input preview (first 500 chars):");
            console.error(cleaned.slice(0, 500));
        }

        // Try to identify common issues
        console.error("🔧 Possible issues:");
        if (rawText.includes('\n') || rawText.includes('\r') || rawText.includes('\t')) {
            console.error("- Contains unescaped control characters (newlines, tabs, carriage returns)");
        }
        if (rawText.includes('",\n}') || rawText.includes(',\n]')) {
            console.error("- Contains trailing commas before closing brackets");
        }
        if ((rawText.match(/"/g) || []).length % 2 !== 0) {
            console.error("- Unmatched quotes detected");
        }

        throw new Error("Invalid JSON format");
    }
};

async function transcribeAudioWithGemini(filePath, mimeType) {
    try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const audioBytes = fs.readFileSync(filePath).toString("base64");

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: "Please transcribe this audio to text." },
                        {
                            inlineData: {
                                mimeType: mimeType || "audio/mpeg",
                                data: audioBytes,
                            },
                        },
                    ],
                },
            ],
        });
        return result.response.text(); // transcript string
    } catch (error) {
        console.error(error)
        return null;
    }
}

async function checkAnswerWithGemini(questionType, questionText, correctAnswer, userAnswer) {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    let prompt = "";

    if (questionType === "summary_passage") {
        prompt = `You are an evaluator for student précis writing. Evaluate in a fair and balanced way, not overly strict.

            Definition:
            A précis is a clear and shorter version of a passage that keeps the main idea and most important points in simple words.

            Original Passage:
            ${questionText}

            User Précis:
            ${userAnswer}

            Evaluation Criteria:
            1. Main Idea - Is the main idea correctly captured?
            2. Key Points - Are most important points included (minor details can be ignored)?
            3. Conciseness - Is it shorter than the original (even if not perfectly 30-50%)?
            4. Clarity - Is it easy to understand and logically written?
            5. Originality - Mostly in student's own words (small overlap is acceptable)

            Relaxed Rules:
            - If main idea + most key points are present → give 70+.
            - If well-written but slightly short or missing minor details → do NOT heavily penalize.
            - If concise, clear, and mostly correct → prefer higher scores.
            - Only give below 50 if:
            - major key points are missing, OR
            - very unclear, OR
            - heavily copied.

            Scoring Guidelines:
            - 90-100: Good précis (minor issues allowed)
            - 70-89: Average (some missing points)
            - 41-70: Weak (important content missing)
            - 0-40: Very poor or irrelevant

            Strict Rule:
            - Return only JSON format strictly so it could parse by JSON.parse easyly

            Output Format (STRICT JSON ONLY):
            {
            "percentage": number,
            "feedback": "One short sentence explaining the main strength or issue"
            }`;
    } else if (questionType === "speaking") {
        // For spoken/oral type questions – evaluate content & clarity
        prompt = `
            You are an evaluator for spoken responses (originally given in audio, now transcribed to text).

            Question:
            ${questionText}

            User Response (transcribed):
            ${userAnswer}

            Evaluation Criteria:
            1. **Relevance** – Does the answer directly respond to the question?
            2. **Content Quality** – Are the key ideas covered? (For factual questions: accuracy. For personal/introductory questions: meaningful details.)
            3. **Clarity & Coherence** – Is the response understandable and logically structured?
            4. **Completeness** – Is the response sufficiently developed, not just 1–2 words or vague?
            5. **Conciseness** – Not unnecessarily long or repetitive.

            Scoring Guidelines:
            - 90–100%: Excellent – clear, complete, relevant, well-structured.
            - 70–89%: Good – mostly relevant, covers main points, minor gaps.
            - 50–69%: Fair – partially correct/relevant but missing important parts.
            - 30–49%: Poor – vague, incomplete, or off-topic.
            - 0–29%: Very poor – no meaningful response or totally irrelevant.

            Return output strictly in JSON format:
            {"percentage": 82, "feedback": "Short, relevant answer but missed 1-2 important points"}
                `;
    } else {
        // For imageToScript, videoToScript, audioToScript
        prompt = `
            You are an answer evaluator.
            Question Type: ${questionType}
            Question: ${questionText}
            Correct Answer (reference): ${correctAnswer}
            User Answer: ${userAnswer}

            Task:
            1. Compare the user's answer with the correct answer.
            2. Focus on meaning similarity (not just word match). Be tolerant to synonyms and grammar differences.
            3. Score based on how much the user's answer conveys the same meaning as the correct answer.
            4. Give a similarity score (0–100%).

            Return only JSON like:
            {"similarity": 85, "feedback": "User covered most points but missed "}
                `;
    }

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();

        const res = jsonParser(text);
        return { ...res, similarity: res.percentage || res.similarity };
    } catch (error) {
        console.error("error ", error)
        const similarity = calculateSimilarity(correctAnswer, typeof userAnswer === "string" ? userAnswer : questionType)

        // Return appropriate default based on question type
        if (questionType === "summary_passage") {
            return { similarity: similarity || 0, percentage: similarity || 0, feedback: "Failed to evaluate summary" };
        } else {
            return { similarity: similarity || 0, feedback: "Failed to evaluate answer" };
        }
    }
}

// Helper function to calculate similarity percentage
const calculateSimilarity = (text1, text2) => {
    if (!text1 || !text2) return 0;

    const str1 = text1.toLowerCase().replace(/\s+/g, ' ');
    const str2 = text2.toLowerCase().replace(/\s+/g, ' ');

    if (str1 === str2) return 100;

    // Simple similarity calculation (you can replace with more sophisticated algorithm)
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));

    return Math.round((commonWords.length / Math.max(words1.length, words2.length)) * 100);
};

// Express API handler
const evaluateAnswer = async (req, res, next) => {
    const { question_text, correct_answer_script, user_answer_script, question_type } = req.body;

    // Validate required fields
    if (
        !question_text ||
        (!correct_answer_script && question_type !== "summary_passage") ||
        (!user_answer_script && question_type !== "speaking") ||
        !question_type
    ) {
        return res.status(400).json({
            error:
                "Missing fields: question_text, correct_answer_script (except for summary_passage), user_answer_script, question_type",
        });
    }

    try {
        let userAnswerProcessed = user_answer_script;
        // For speaking → transcribe uploaded audio file
        if (question_type === "speaking" && req.file) {

            const mimeType = req.file.mimetype || "audio/mpeg";
            userAnswerProcessed = await transcribeAudioWithGemini(req.file.path, mimeType);

            // optionally cleanup temp file
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("File cleanup failed:", err);
            });
        }
        const result = await checkAnswerWithGemini(
            question_type,
            question_text,
            correct_answer_script,
            userAnswerProcessed
        );

        res.json({
            question_type,
            similarity: result.similarity || result.percentage || 0,
            feedback: result.feedback,
        });
    } catch (error) {
        console.error("Answer Evaluation Error:", error);
        next(error);
    }
};

module.exports = { evaluateAnswer, transcribeAudioWithGemini, checkAnswerWithGemini };
