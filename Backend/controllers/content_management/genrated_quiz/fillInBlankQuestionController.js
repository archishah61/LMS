const { FillInBlankQuestion } = require("../../../models/content_management/generated_quiz/fillInblankquestion"); // Adjust path as needed
const { callProcedure } = require('../../../utils/procedure/callProcedure');

// -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------


exports.createFillInBlankQuestion = async (req, res, next) => {
    try {
        const { quizTextId, text, marks, correctAnswer } = req.body;

        if (!quizTextId || !text || !correctAnswer) {
            return res.status(400).json({ success: false, message: "quizTextId, text, and correctAnswer are required." });
        }

        const userId = req.user.id;
        const role = req.user.role;

        const { success, data, error } = await callProcedure("createFillInBlankQuestionGQ", [
            quizTextId ?? null,
            text ?? null,
            correctAnswer ?? null,
            marks || null,
            userId,
            userId,
            role,
            role
        ]);

        if (!success) {
            return next(error);
            // return res.status(400).json({ success: false, message: error });
        }

        res.status(201).json({ success: true, message: "Question created successfully", question: data[0] });
    } catch (error) {
        next(error);
    }
};

exports.deleteFillInBlankQuestion = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({ success: false, message: "ID must be a valid integer." });
        }

        const { success, error } = await callProcedure("deleteFillInBlankQuestionGQ", [id]);

        if (!success) return next(error);
        // if (!success) return res.status(400).json({ success: false, message: error });

        res.status(200).json({ success: true, message: "Questions deleted successfully" });
    } catch (error) {
        next(error);
    }
};

// -------------------------------------PROCEDURE RELATED CODE ENDS---------------------------------

