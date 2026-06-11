const { FillInBlankQuestion } = require('../../models/content_management/generated_quiz/fillInblankquestion');
const { MultipleChoiceQuestion } = require('../../models/content_management/generated_quiz/multiplechoicequestion');
const { TextedBasedQuizText } = require('../../models/content_management/textBasedQuizText');
const { TrueFalseQuestion } = require('../../models/content_management/generated_quiz/truefalsequestion');
const { callProcedure } = require('../../utils/procedure/callProcedure');
const { callProcedureChallenge } = require('../../utils/procedure/callProcedureChallenge');

exports.createTextBasedQuizText = async (req, res, next) => {
    try {
        const {
            quiz_id,
            question_text,
        } = req.body;

        const userId = req.user.id;
        const role = req.user.role;


        if (!quiz_id || !question_text) {
            return res.status(400).json({
                success: false,
                message: "Quiz ID and question text are required."
            });
        }


        const { success, data, error } = await callProcedure('CreateTextBasedQuizText', [
            quiz_id ?? null,
            question_text ?? null,
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
            message: "Quiz question created successfully!",
            quizQuestion: data[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.getTextBasedQuizTextById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, message: "Quiz ID is required." });
        }

        const { success, data, error } = await callProcedureChallenge('GetTextBasedQuizTextByQuizId', [id]);

        if (!success) {
            return next(error);
        }

        // Flatten the nested objects inside data
        const flatData = [];
        data.forEach(entry => {
            Object.values(entry).forEach(inner => {
                flatData.push(inner);
            });
        });

        // Transform flat data into nested structure
        const quizTextMap = {};

        flatData.forEach(row => {
            const quizTextId = row.quiz_text_id || row.quizTextId;

            // Skip if quizTextId is not present
            if (!quizTextId) {
                return;
            }

            if (!quizTextMap[quizTextId]) {
                quizTextMap[quizTextId] = {
                    id: quizTextId,
                    quiz_id: row.quiz_id,
                    text: row.text,
                    FillInBlankQuestions: [],
                    MultipleChoiceQuestions: [],
                    TrueFalseQuestions: []
                };
            }

            // Add FIB question
            if (row.fib_id) {
                quizTextMap[quizTextId].FillInBlankQuestions.push({
                    id: row.fib_id,
                    text: row.fib_text,
                    marks: row.marks,
                    correctAnswer: row.fib_answer
                });
            }

            // Add MCQ question
            if (row.mcq_id) {
                quizTextMap[quizTextId].MultipleChoiceQuestions.push({
                    id: row.mcq_id,
                    text: row.mcq_text,
                    marks: row.marks,
                    correctAnswer: row.mcq_answer,
                    options: row.mcq_options
                });
            }

            // Add TF question
            if (row.tf_id) {
                quizTextMap[quizTextId].TrueFalseQuestions.push({
                    id: row.tf_id,
                    text: row.tf_text,
                    marks: row.marks,
                    correctAnswer: row.tf_answer
                });
            }
        });


        const result = Object.values(quizTextMap);


        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};


exports.updateTextBasedQuizText = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { quiz_id, question_text } = req.body;

        const userId = req.user.id;
        const role = req.user.role;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Quiz ID is required."
            });
        }

        const { success, data, error } = await callProcedure('UpdateTextBasedQuizText', [
            quiz_id,
            question_text ?? null,
            userId,
            role
        ]);

        if (!success) {
            return next(error);
            // return res.status(400).json({ success: false, message: error });
        }

        return res.status(200).json({
            success: true,
            message: "Quiz text updated successfully!",
            quizQuestion: data,
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteTextBasedQuizText = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Quiz ID is required."
            });
        }

        const { success, data, error } = await callProcedure('DeleteTextBasedQuizText', [id]);

        if (!success) {
            return next(error);
            // return res.status(400).json({ success: false, message: error });
        }

        return res.status(200).json({
            success: true,
            message: "Quiz text deleted successfully!",
            deletedQuizText: data[0]
        });
    } catch (error) {
        next(error);
    }
};

// -------------------------------------PROCEDURE RELATED CODE ENDS---------------------------------
