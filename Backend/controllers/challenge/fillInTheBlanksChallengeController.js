const { callProcedure } = require("../../utils/procedure/callProcedure");
const Validation = require("../../validations");

exports.createFillInTheBlanksChallenge = async (req, res, next) => {
    try {
        const { challenge_id, challenge_task_id, contest_quiz_id, text, answers } = req.body;

        if ((!challenge_id && !challenge_task_id && !contest_quiz_id) || !text || !answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ success: false, message: "Required fields are missing or invalid." });
        }

        if (challenge_id) Validation.isNumber(challenge_id, "Challenge ID must be a number.");
        if (challenge_task_id) Validation.isNumber(challenge_task_id, "Challenge Task ID must be a number.");
        if (contest_quiz_id) Validation.isNumber(contest_quiz_id, "Contest Quiz ID must be a number.");
        Validation.isString(text ,"Fill in the blank must not be empty.");
        Validation.isArray(answers, { min: 1 }, "Answers must be a non-empty array with at least 1 answer.");

        const answersJSON = JSON.stringify(answers);

        const { success, data, error} = await callProcedure('createFillInTheBlanksChallenge', [
            challenge_id || null,
            challenge_task_id || null,
            contest_quiz_id || null,
            text,
            answersJSON
        ]);


        if (!success) {
            return next(error);
        }

        return res.status(201).json({
            success: true,
            message: "fill in the blank created."
        });

    } catch (error) {
        next(error);
    }
};

exports.getAllFillInTheBlanksChallenges = async (req, res, next) => {
    try {
        const fillInTheBlanksChallenges = await callProcedure('getAllFillInTheBlanksChallenges');

        return res.status(200).json({
            success: true,
            message: "fill in the blank fetched successfully.",
            fillInTheBlanksChallenges
        });
    } catch (error) {
        next(error);
    }
};

exports.getFillInTheBlanksChallengeById = async (req, res, next) => {
    try {
        const { id } = req.params;

        Validation.isNumber(id, "ID must be a number.");

        const result = await callProcedure('getFillInTheBlanksChallengeById', [id]);

        if (!result || result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Challenge not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "fill in the blank fetched successfully.",
            fillInTheBlanksChallenge: result
        });
    } catch (error) {
        next(error);
    }
};

exports.updateFillInTheBlanksChallenge = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { text, answers } = req.body;

        if (id) Validation.isNumber(id, "ID must be a number.");
        if (text) Validation.isString(text ,"Fill in the blank must not be empty.");
        if (answers) Validation.isArray(answers, { min: 1 }, "Answers must be a non-empty array.");

        const answersJSON = answers ? JSON.stringify(answers) : null;


        const {success, data, error} =await callProcedure('updateFillInTheBlanksChallenge', [
            id,
            text || null,
            answersJSON
        ]);

        if (!success) {
            return next(error);
        }

        return res.status(200).json({
            success: true,
            message: "fill in the blank updated successfully."
        });

    } catch (error) {
        next(error);
    }
};

exports.toggleFillInTheBlanksChallengeStatus = async (req, res, next) => {
    try {
        const { id } = req.params;

        await callProcedure('toggleFillInTheBlanksStatus', [id]);

        return res.status(200).json({
            success: true,
            message: "fill in the blank status toggled successfully."
        });

    } catch (error) {
        next(error);
    }
};

exports.deleteFillInTheBlanksChallenge = async (req, res, next) => {
    try {
        const { id } = req.params;

        Validation.isNumber(id, "ID must be a number.");

        await callProcedure('deleteFillInTheBlanksChallenge', [id]);

        return res.status(200).json({
            success: true,
            message: "fill in the blank deleted successfully."
        });

    } catch (error) {
        next(error);
    }
};

// -------------------------------------PROCEDURE RELATED CODE ENDS---------------------------------
