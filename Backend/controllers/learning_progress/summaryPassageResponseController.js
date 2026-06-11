const { SummarizePassageResponse } = require('../../models/learning_progress/summaryPassageResponse');
const User = require('../../models/auth/user');
const stringSimilarity = require("string-similarity");
const { SummarizerManager } = require("node-summarizer");
const { QuizQuestion } = require('../../models/content_management/quizQuestion');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.createSummarizePassageResponse = async (req, res, next) => {
    try {
        const { question_id, student_id, response_text } = req.body;

        // 🚨 If student didn't provide any response
        if (!response_text || response_text.trim().length === 0) {
            return res.status(200).json({
                student_summary: "",
                grade: "F",
                marks: 0,
                similarityScore: "0.00",
            });
        }

        const summaryKey = question_id;
        const number = summaryKey.split("_")[1]; // Extract question number

        const question = await QuizQuestion.findByPk(number);
        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }

        const student = await User.findByPk(student_id);
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        // ✨ Use Gemini to summarize the student's response
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `Summarize the following passage in 4-5 concise sentences:\n\n"${response_text}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const student_summary = response.text().trim();

        // 🧠 Grade by comparing student's summary with admin's summary
        const similarityScore = stringSimilarity.compareTwoStrings(
            question.summarizepassage_summary.toLowerCase(),
            student_summary.toLowerCase()
        );

        const totalMarks = question.marks || 5; // Default to 5 if not set

        let grade = '';
        let marksAwarded = 0;

        if (similarityScore > 0.85) {
            grade = 'A+';
            marksAwarded = totalMarks;
        } else if (similarityScore > 0.7) {
            grade = 'A';
            marksAwarded = totalMarks * 0.9;
        } else if (similarityScore > 0.6) {
            grade = 'B';
            marksAwarded = totalMarks * 0.75;
        } else if (similarityScore > 0.5) {
            grade = 'C';
            marksAwarded = totalMarks * 0.6;
        } else if (similarityScore > 0.4) {
            grade = 'D';
            marksAwarded = totalMarks * 0.4;
        } else {
            grade = 'F';
            marksAwarded = totalMarks * 0.2;
        }

        marksAwarded = parseFloat(marksAwarded.toFixed(2)); // round to 2 decimals


        // ✅ Return result
        res.status(200).json({
            student_summary,
            grade,
            marks: marksAwarded,
            similarityScore: similarityScore.toFixed(2),
        });

    } catch (error) {
        console.error("Summarization Error:", error);
        next(error);
    }
};


// ✅ Get all responses (admin use)
exports.getAllSummarizePassageResponses = async (req, res, next) => {
    try {
        const responses = await SummarizePassageResponse.findAll();
        res.status(200).json(responses);
    } catch (error) {
        next(error);
    }
};

// ✅ Get responses by Question ID
exports.getResponsesByQuestionId = async (req, res, next) => {
    const { question_id } = req.params;

    try {
        const responses = await SummarizePassageResponse.findAll({
            where: { question_id },
        });

        if (responses.length === 0) {
            return res.status(404).json({ error: "No responses found for this question" });
        }

        res.status(200).json(responses);
    } catch (error) {
        next(error);
    }
};

// ✅ Get responses by Student ID
exports.getResponsesByStudentId = async (req, res, next) => {
    const { student_id } = req.params;

    try {
        const responses = await SummarizePassageResponse.findAll({
            where: { student_id },
        });

        if (responses.length === 0) {
            return res.status(404).json({ error: "No responses found for this student" });
        }

        res.status(200).json(responses);
    } catch (error) {
        next(error);
    }
};

// ✅ Update a response
exports.updateSummarizePassageResponse = async (req, res, next) => {
    const { id } = req.params;
    const { response_text } = req.body;

    try {
        const response = await SummarizePassageResponse.findByPk(id);
        if (!response) {
            return res.status(404).json({ error: "Response not found" });
        }

        let student_summary = response.student_summary;
        let grade = response.grade;

        if (response_text && response_text !== response.response_text) {
            // Log the admin summary and student response for debugging
            const question = await SummarizePassageQuestion.findByPk(response.question_id);

            // 🧠 Recalculate grade by comparing with admin summary directly
            const similarityScore = stringSimilarity.compareTwoStrings(
                question.summary,
                response_text
            );

            if (similarityScore > 0.75) grade = 'A'; // Lowered threshold
            else if (similarityScore > 0.6) grade = 'B'; // Lowered threshold
            else if (similarityScore > 0.4) grade = 'C'; // Lowered threshold
            else grade = 'D or below';

            student_summary = response_text; // Use full response as summary
        }

        await response.update({
            response_text: response_text ?? response.response_text,
            student_summary,
            grade,
        });

        res.status(200).json({
            message: "Response updated successfully",
            response,
        });
    } catch (error) {
        next(error);
    }
};

// ✅ Delete a response
exports.deleteSummarizePassageResponse = async (req, res, next) => {
    const { id } = req.params;

    try {
        const response = await SummarizePassageResponse.findByPk(id);
        if (!response) {
            return res.status(404).json({ error: "Response not found" });
        }

        await response.destroy();

        res.status(200).json({
            message: "Response deleted successfully",
            deleted: response,
        });
    } catch (error) {
        next(error);
    }
};
