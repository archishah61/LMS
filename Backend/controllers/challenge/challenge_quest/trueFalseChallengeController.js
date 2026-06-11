const { callProcedure } = require("../../../utils/procedure/callProcedure");
const Validation = require("../../../validations");

// ✅ Update True/False Challenge
exports.updateTrueFalseChallenge = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { question, answer = null } = req.body;

        Validation.isNumber(id, "ID must be a number.");
        if (question) Validation.isString(question, { min: 1 }, "Question must have at least 1 character.");
        if (answer !== null) Validation.isBoolean(answer, "Answer must be a boolean value.");
        // Call the updateTrueFalseChallenge stored procedure
        const { success, result, error } = await callProcedure('updateTrueFalseChallenge', [
            id,
            question || null,
            answer
        ]);

        if (!success) {
            return next(error);
        }

        return res.status(200).json({
            success: true,
            message: "Challenge updated successfully.",
            result
        });

    } catch (error) {
        next(error);
    }
};

// ✅ Toggle True/False Challenge active status
exports.toggleTrueFalseChallengeStatus = async (req, res, next) => {
    try {
        const { id } = req.params;

        Validation.isNumber(id, "ID must be a number.");

        // Call stored procedure
        await callProcedure('toggleTrueFalseChallengeStatus', [id]);

        return res.status(200).json({
            success: true,
            message: "True/False challenge status toggled successfully."
        });
    } catch (error) {
        next(error);
    }
};


// ✅ Delete True/False Challenge using stored procedure
exports.deleteTrueFalseChallenge = async (req, res, next) => {
    try {
        const { id } = req.params;

        Validation.isNumber(id, "ID must be a number.");

        // Call stored procedure
        await callProcedure('deleteTrueFalseChallenge', [id]);

        return res.status(200).json({
            success: true,
            message: "True/False challenge deleted successfully."
        });
    } catch (error) {
        next(error);
    }
};

// ✅ Create True/False Challenge using stored procedure
exports.createTrueFalseChallenge = async (req, res, next) => {
    try {
        const { challenge_task_id, challenge_id, contest_quiz_id, question, answer } = req.body;

        if (challenge_id) Validation.isNumber(challenge_id, "Challenge ID must be a number.");
        if (challenge_task_id) Validation.isNumber(challenge_task_id, "Challenge Task ID must be a number.");
        if (contest_quiz_id) Validation.isNumber(contest_quiz_id, "Contest Quiz ID must be a number.");
        Validation.isString(question, { min: 1 }, "Question is required and must be at least 1 character long.");
        Validation.isBoolean(answer, "Answer must be a boolean value.");

        // Call stored procedure
        const { success, data, error } = await callProcedure('createTrueFalseChallenge', [
            challenge_task_id || null,
            challenge_id || null,
            contest_quiz_id || null,
            question,
            answer
        ]);

        if (!success) {
            return next(error);
        }

        return res.status(201).json({
            success: true,
            message: "True/False challenge created successfully."
        });

    } catch (error) {
        next(error);
    }
};
