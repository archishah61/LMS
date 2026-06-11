const { AudioToScriptQuestion } = require('../../models/content_management/quiz-questions-types/audiotoScript');
const { Quizzes } = require('../../models/content_management/quizzesModel');
const { callProcedure } = require('../../utils/procedure/callProcedure'); // Adjust the path as necessary
const Validation = require('../../validations');

const validateAudioToScriptQuestion = (data, file, isUpdate = false) => {
    const errors = [];

    try {
        if (!isUpdate || data.quiz_id !== undefined) {
            Validation.isInteger(data.quiz_id, "Quiz ID must be a valid integer.");
        }

        if (!isUpdate || data.script !== undefined) {
            Validation.isString(data.script, { min: 3, max: 10000 }, "Script must be 3–10000 characters.");
        }

        if (!isUpdate && !file) {
            errors.push("Audio file is required.");
        }

        if (data.marks === undefined || isNaN(data.marks)) {
            errors.push("Marks are required and must be a number.");
        } else {
            Validation.isInteger(data.marks, "Marks must be a valid integer.");
        }

    } catch (err) {
        errors.push(err.message);
    }

    return errors;
};

// -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------

// ✅ Create AudioToScriptQuestion using stored procedure (with file upload)
exports.createAudioToScriptQuestion = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        const { quiz_id, script, marks } = req.body; // Extract marks from the request body

        const errors = validateAudioToScriptQuestion(req.body, req.file, false);
        if (errors.length) {
            return res.status(400).json({ errors });
        }

        // Validation for fields
        if (!quiz_id) {
            return res.status(400).json({ error: "Quiz ID is required." });
        }

        if (!script) {
            return res.status(400).json({ error: "Script is required." });
        }

        if (!req.file) {
            return res.status(400).json({ error: "Audio file is required." });
        }

        if (marks === undefined) {
            return res.status(400).json({ error: "Marks are required." });
        }

        const audioPath = `/audiotoScript/${req.file.filename}`;

        // Call the stored procedure with the additional marks parameter
        const procedureResult = await callProcedure('createAudioToScriptQuestion', [
            quiz_id,
            audioPath,
            script,
            marks, // Pass marks to the stored procedure
            userId,
            userId,
            role,
            role,
        ]);

        if (!procedureResult.success) {
            return next(procedureResult.error);
        }

        const results = procedureResult.data[0];

        res.status(201).json({
            message: results[0]?.message || "Audio-to-script question created successfully",
            audioToScriptQuestion: results[0]
        });

    } catch (error) {
        next(error);
    }
};

// ✅ Get All AudioToScriptQuestions using stored procedure (with file upload)
exports.getAllAudioToScriptQuestions = async (req, res, next) => {
    try {
        // Call the stored procedure
        const procedureResult = await callProcedure('getAllAudioToScriptQuestions');

        if (!procedureResult.success) {
            return next(procedureResult.error);
        }

        const questions = procedureResult.data;

        res.status(200).json(questions);
    } catch (error) {
        next(error);
    }
};

// ✅ Get Audio-to-Script Questions by Quiz ID using stored procedure
exports.getAudioToScriptQuestionsByQuizId = async (req, res, next) => {
    const { quiz_id } = req.params;

    try {
        // Call the stored procedure
        const procedureResult = await callProcedure('getAudioToScriptQuestionsByQuizId', [quiz_id]);

        if (!procedureResult.success) {
            return next(procedureResult.error);
        }

        const questions = procedureResult.data;

        if (!questions || questions.length === 0) {
            return res.status(404).json({ error: "No audio-to-script questions found for this quiz" });
        }

        res.status(200).json(questions);
    } catch (error) {
        next(error);
    }
};

// ✅ Update AudioToScriptQuestion by ID using Stored Procedure
exports.updateAudioToScriptQuestionById = async (req, res, next) => {
    const userId = req.user.id;
    const role = req.user.role;

    const { id } = req.params;
    const { quiz_id, script, marks } = req.body; // Extract marks from the request body

    const errors = validateAudioToScriptQuestion(req.body, req.file, true);
    if (errors.length) {
        return res.status(400).json({ errors });
    }

    try {
        // Check if file is uploaded, otherwise retain the existing URL
        const audioPath = req.file ? `/audiotoScript/${req.file.filename}` : null;

        // Call the stored procedure to update the question with the additional marks parameter
        const procedureResult = await callProcedure('updateAudioToScriptQuestionById', [
            id,
            quiz_id,
            audioPath,
            script,
            marks, // Pass marks to the stored procedure
            userId,
            role,
        ]);

        if (!procedureResult.success) {
            return next(procedureResult.error);
        }

        const updatedQuestion = procedureResult.data[0];

        // Return the updated question details
        res.status(200).json({
            message: "Audio-to-script question updated successfully",
            audioToScriptQuestion: updatedQuestion,
        });

    } catch (error) {
        next(error);
    }
};

// ✅ Delete AudioToScriptQuestion by ID using Stored Procedure
exports.deleteAudioToScriptQuestionById = async (req, res, next) => {
    const { id } = req.params;

    try {
        // Call the stored procedure to delete the question
        const { success, data, error } = await callProcedure("deleteAudioToScriptQuestionById", [id]);

        if (!success || !data || data.length === 0) {
            return res.status(404).json({ error: error || "Audio-to-script question not found" });
        }

        // Assuming the stored procedure returns the deleted record
        const deletedQuestion = data[0];

        res.status(200).json({
            message: "Audio-to-script question deleted successfully",
            deleted: deletedQuestion,
        });
    } catch (error) {
        next(error);
    }
};


// -------------------------------------PROCEDURE RELATED CODE ENDS-----------------------------------
