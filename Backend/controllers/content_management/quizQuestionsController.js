const { QuizQuestions } = require('../../models/content_management/quizQuestionsModel'); // Adjust the path as necessary
const { CompleteSentence } = require('../../models/content_management/quiz-questions-types/completeTheSentence'); // Adjust the path as necessary

const Validation = require("../../validations"); // Adjust path if needed

// -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------

const { callProcedure } = require("../../utils/procedure/callProcedure");

// Create Quiz Question using stored procedure
exports.createQuizQuestion = async (req, res, next) => {
    try {

        const userId = req.user.id;
        const role = req.user.role;

        const {
            quiz_id,
            question_text,
            question_type,
            marks,
            sequence_no,
            // correct_words,
        } = req.body;

        // VALIDATIONS
        Validation.isInteger(quiz_id, "Quiz ID must be a valid integer.");
        Validation.isString(question_text, { min: 5 }, "Question Text must be a valid string minimum 5 letters.");
        Validation.isQuizQuestionType(question_type, "Invalid question type.");
        Validation.checkIntegerMinMax(marks, { min: 1 }, "Marks must be a valid integer.");
        Validation.checkIntegerMinMax(sequence_no, { min: 1 }, "Sequence number must be a positive integer.");

        const question_img =
            req.files && req.files.questionImg
                ? "/quiz/question_images/" + req.files.questionImg[0].filename
                : null;

        const { success, data, error } = await callProcedure("createQuizQuestion", [
            quiz_id,
            question_text,
            question_img,
            question_type,
            marks,
            sequence_no,
            userId,
            userId,
            role,
            role,
        ]);

        if (!success) {
            return next(error);
        }

        const quizQuestion = data[0]; // assuming RETURNING id
        if (question_type === "complete-sentence" && parsedCorrectWords.length > 0) {
            for (const word of parsedCorrectWords) {
                const wordProc = await callProcedure("addCompleteSentenceWord", [
                    quizQuestion.id,
                    word.correct_word,
                    word.hint,
                    userId,
                    userId,
                    role,
                    role,
                ]);

                if (!wordProc.success) {
                    return res.status(400).json({ error: wordProc.error });
                }
            }
        }

        res.status(201).json({
            message: "Quiz question created successfully",
            quizQuestion,
        });
    } catch (error) {
        next(error);
    }
};

// // Get Quiz Questions by Quiz ID using stored procedure
exports.getQuizQuestionById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Quiz ID is required" });
        }

        const { success, data, error } = await callProcedure("getQuizQuestionById", [id]);

        if (!success) {
            return next(error);
        }

        const quizQuestions = data; // First result set (array of questions)

        if (!quizQuestions || quizQuestions.length === 0) {
            return res.status(404).json({ error: "No quiz questions found for this quiz ID" });
        }

        res.status(200).json(quizQuestions);
    } catch (error) {
        next(error);
    }
};

// // Update Quiz Question using stored procedure
exports.updateQuizQuestion = async (req, res, next) => {
    const { id } = req.params;
    try {

        Validation.isInteger(id, "Quiz Question ID must be a valid integer.");

        const userId = req.user.id;
        const role = req.user.role;

        const {
            quiz_id,
            question_text,
            question_type,
            marks,
            sequence_no,
        } = req.body;

        // VALIDATIONS
        if (quiz_id) Validation.isInteger(quiz_id, "Quiz ID must be a valid integer.");
        if (question_text) Validation.isString(question_text, { min: 5 }, "Question Text must be a valid string minimum 5 letters.");
        if (question_type) Validation.isQuizQuestionType(question_type, "Invalid question type.");
        if (marks) Validation.checkIntegerMinMax(marks, { min: 1 }, "Marks must be a valid integer.");
        if (sequence_no) Validation.checkIntegerMinMax(sequence_no, { min: 1 }, "Sequence number must be a positive integer.");

        let question_img = null;
        if (req.files && req.files.questionImg) {
            question_img = "/quiz/question_images/" + req.files.questionImg[0].filename;
        }

        const { success, data, error } = await callProcedure("updateQuizQuestion", [
            id,
            quiz_id,
            question_text,
            question_img,
            question_type,
            marks,
            sequence_no,
            userId,
            role
        ]);

        if (!success) {
            return next(error);
        }

        const updatedQuizQuestion = data[0];

        if (!updatedQuizQuestion) {
            return res.status(404).json({ error: "Quiz question not found" });
        }

        res.status(200).json({
            message: "Quiz question updated successfully",
            quizQuestion: updatedQuizQuestion,
        });

    } catch (error) {
        next(error);
    }
};

// // Delete Quiz Question using stored procedure
exports.deleteQuizQuestion = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Quiz Question ID is required" });
        }

        const { success, data, error } = await callProcedure("deleteQuizQuestion", [id]);

        if (!success) {
            return next(error);
        }

        const deletedQuizQuestion = data; // Return deleted record from the procedure

        if (!deletedQuizQuestion) {
            return res.status(404).json({ error: "Quiz question not found" });
        }

        res.status(200).json({
            message: "Quiz question deleted successfully",
            deletedQuizQuestion,
        });
    } catch (error) {
        next(error);
    }
};


// -------------------------------------PROCEDURE RELATED CODE ENDS-----------------------------------


