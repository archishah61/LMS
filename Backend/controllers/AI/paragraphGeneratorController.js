const { GoogleGenerativeAI } = require("@google/generative-ai");
const AiParagraphPractice = require("../../models/aiStudentPerformanceTracking/aiParagraphPractice");
const { callProcedure } = require("../../utils/procedure/callProcedure");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const generateParagraph = async (req, res, next) => {
    try {
        const { difficulty = "basic" } = req.body;

        let wordCountInstruction = "";
        let complexityInstruction = "";

        switch (difficulty.toLowerCase()) {
            case "basic":
                wordCountInstruction = "20 to 30 words";
                complexityInstruction = "Use simple, everyday vocabulary and straightforward sentence structures. The tone should be easy to read and suitable for beginners.";
                break;
            case "intermediate":
                wordCountInstruction = "60 to 70 words";
                complexityInstruction = "Use a mix of common and slightly advanced vocabulary. Include varied sentence structures (compound and complex sentences). The tone should be engaging and suitable for average readers.";
                break;
            case "difficult":
                wordCountInstruction = "100 to 130 words";
                complexityInstruction = "Use advanced vocabulary, complex sentence structures, and sophisticated phrasing. The topic can be more abstract or technical. The tone should be formal and challenging.";
                break;
            default:
                return res.status(400).json({ error: "Invalid difficulty level. Choose basic, intermediate, or difficult." });
        }

        const prompt = `Write a single, coherent paragraph.
Requirements:
- Length: Exactly ${wordCountInstruction}.
- Style: ${complexityInstruction}
- Topic: Choose an interesting, random, family-friendly topic (e.g., nature, technology, history, daily life).
- Format: Return ONLY the text of the paragraph, without any headings, bullet points, or extra conversation.`;

        const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text().trim();

        res.status(200).json({
            success: true,
            data: {
                paragraph: text,
                difficulty: difficulty.toLowerCase()
            }
        });

    } catch (error) {
        console.error("Error generating paragraph:", error);
        res.status(500).json({
            success: false,
            error: "Failed to generate paragraph"
        });
    }
};

const savePracticeSession = async (req, res, next) => {
    try {
        const { difficulty, paragraph, wpm, accuracy, timeTaken, wrongWords, backspaceCount, lastWordSpeed } = req.body;
        const userId = req.user.id;

        // Calculate attempt count for this user
        // const previousAttempts = await AiParagraphPractice.count({
        //     where: { user_id: userId }
        // });
        // const attemptCount = previousAttempts + 1;

        // const newSession = await AiParagraphPractice.create({
        //     user_id: userId,
        //     difficulty,
        //     paragraph,
        //     wpm,
        //     accuracy,
        //     time_taken: timeTaken,
        //     wrong_words: wrongWords,
        //     backspace_count: backspaceCount,
        //     last_word_speed: lastWordSpeed,
        //     attempt_count: attemptCount
        // });

        const { success, data, error } = await callProcedure("createAiParagraphPractice", [
            userId || null,
            difficulty || null,
            paragraph || null,
            wpm || 0,
            accuracy || 0,
            timeTaken || 0,
            wrongWords || 0,
            backspaceCount || 0,
            lastWordSpeed || 0
        ]);

        if (!success) return next(error);

        res.status(201).json({
            success: true,
            message: "Practice session saved",
            data: data[0]
        });
    } catch (error) {
        next(error);
    }
};

const getPracticeHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { success, data, error } = await callProcedure("getUserPracticeHistory", [
            userId
        ]);

        if (!success) return next(error);

        // const history = await AiParagraphPractice.findAll({
        //     where: { user_id: userId },
        //     order: [['created_at', 'DESC']],
        //     limit: 25
        // });

        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        next(error);
    }
};

const analyzeTypingPerformance = async (req, res, next) => {
    try {
        const { wpm, backspaceCount, wrongWordsCount, accuracy, difficulty, timeTaken, originalParagraph, sessionId } = req.body;

        const prompt = `Analyze this user's typing performance on a ${difficulty} paragraph.
        
        Metrics:
        - Words Per Minute (WPM): ${wpm}
        - Accuracy: ${accuracy}%
        - Backspaces used: ${backspaceCount}
        - Total Wrong Words: ${wrongWordsCount}
        - Time Taken: ${timeTaken} seconds
        
        Provide a detailed analysis structured as a JSON object with the following keys:
        - "summary": A brief general overview (1-2 sentences).
        - "strengths": A list of 2-3 specific things the user did well.
        - "weaknesses": A list of 2-3 areas for improvement.
        - "pro_tips": 2 actionable tips to improve speed or accuracy.
        - "verdict": A single rating (e.g., "Intermediate", "Fast", "Precise").

        Return ONLY the JSON object.`;

        const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const response = result.response;
        let analysisText = response.text().trim();

        // Robust JSON extraction
        let parsedAnalysis;
        try {
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysisText = jsonMatch[0];
            }
            parsedAnalysis = JSON.parse(analysisText);
        } catch (parseError) {
            console.error("JSON Parse Error:", analysisText);
            parsedAnalysis = {
                summary: "Analysis complete. Great job on the session!",
                strengths: ["Consistent typing rhythm", "Good focus"],
                weaknesses: ["Occasional accuracy drops"],
                pro_tips: ["Try to keep your eyes on the screen", "Practice difficult words separately"],
                verdict: "Capable"
            };
        }

        // Save analysis to database if sessionId is provided
        if (sessionId) {
            const { success, data, error } = await callProcedure("updateAiParagraphPractice", [
                sessionId,
                JSON.stringify(parsedAnalysis),
                true
            ]);

            // await AiParagraphPractice.update({
            //     analysis: parsedAnalysis,
            //     is_analyzed: true
            // }, {
            //     where: { id: sessionId }
            // });
        }

        res.status(200).json({
            success: true,
            data: {
                analysis: parsedAnalysis
            }
        });

    } catch (error) {
        console.error("Error analyzing typing performance:", error);
        res.status(500).json({
            success: false,
            error: "Failed to analyze typing performance"
        });
    }
};

module.exports = {
    generateParagraph,
    savePracticeSession,
    getPracticeHistory,
    analyzeTypingPerformance
};

