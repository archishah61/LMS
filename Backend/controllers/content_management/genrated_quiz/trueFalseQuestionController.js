const { TrueFalseQuestion } = require("../../../models/content_management/generated_quiz/truefalsequestion"); // Adjust path as needed
const { callProcedure } = require('../../../utils/procedure/callProcedure');

// -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------

exports.createTrueFalseQuestion = async (req, res, next) => {
    try {
        const { quizTextId, text, marks, correctAnswer } = req.body;

        if (!quizTextId || !text || correctAnswer === undefined) {
            return res.status(400).json({ success: false, message: "quizTextId, text, marks and correctAnswer are required." });
        }

        const userId = req.user.id;
        const role = req.user.role;

        const { success, data, error } = await callProcedure("createTrueFalseQuestionGQ", [
            quizTextId,
            text,
            correctAnswer,
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

        return res.status(201).json({
            success: true,
            message: "True/False question created successfully",
            question: data[0],
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllTrueFalseQuestions = async (req, res, next) => {
    try {
        const { success, data, error } = await callProcedure("getAllTrueFalseQuestionsGQ", []);

        // if (!success) return res.status(400).json({ success: false, message: error });

        if (!success) return next(error);

        return res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

exports.getTrueFalseQuestionById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({ success: false, message: "ID must be a valid integer required." });
        }

        const { success, data, error } = await callProcedure("getTrueFalseQuestionByIdGQ", [id]);

        // if (!success) return res.status(400).json({ success: false, message: error });

        if (!success) return next(error);

        if (!data.length) {
            return res.status(404).json({ success: false, message: "Question not found" });
        }

        return res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

exports.updateTrueFalseQuestion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { text, correctAnswer } = req.body;

        if (!id || isNaN(id)) {
            return res.status(400).json({ success: false, message: "ID must be a valid integer." });
        }

        const userId = req.user.id;
        const role = req.user.role;

        const { success, data, error } = await callProcedure("updateTrueFalseQuestionGQ", [
            id,
            text,
            correctAnswer,
            userId,
            role
        ]);

        // if (!success) return res.status(400).json({ success: false, message: error });

        if (!success) return next(error);

        return res.status(200).json({
            success: true,
            message: "True/False question updated successfully",
            question: data[0],
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteTrueFalseQuestion = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({ success: false, message: "ID must be a valid integer." });
        }

        const { success, error } = await callProcedure("deleteTrueFalseQuestionByQuizTextIdGQ", [id]);

        // if (!success) return res.status(400).json({ success: false, message: error });

        if (!success) return next(error);

        return res.status(200).json({ success: true, message: "True/False question(s) deleted successfully" });
    } catch (error) {
        next(error);
    }
};

// -------------------------------------PROCEDURE RELATED CODE ENDS---------------------------------
