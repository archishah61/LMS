const { callProcedure } = require("../../../utils/procedure/callProcedure");
const Validation = require("../../../validations");

exports.startUserChallengeTask = async (req, res, next) => {
    try {
        const { user_challenge_phase_id, challenge_task_id } = req.body;


        if (!user_challenge_phase_id || !challenge_task_id) {
            return res.status(400).json({ message: "user_challenge_phase_id and challenge_task_id are required" });
        }

        Validation.isNumber(user_challenge_phase_id, "User Challenge Phase ID must be a number.");
        Validation.isNumber(challenge_task_id, "Challenge Task ID must be a number.");

        const { success, data, error } = await callProcedure('startUserChallengeTask', [
            user_challenge_phase_id,
            challenge_task_id
        ]);

        if (!success) {
            return next(error);
        }

        const response = data[0];

        // Handle failure case
        if (!response.success) {
            return res.status(400).json({ message: response.message });
        }

        // Parse the JSON data if needed (MySQL might return it already parsed)
        let userChallengeTask = response.userChallengeTask;
        if (typeof userChallengeTask === 'string') {
            userChallengeTask = JSON.parse(userChallengeTask);
        }

        // Handle empty arrays (MySQL JSON_ARRAYAGG returns null for empty arrays)
        if (!userChallengeTask.ChallengeTask.TrueFalseChallenges) {
            userChallengeTask.ChallengeTask.TrueFalseChallenges = [];
        }
        if (!userChallengeTask.ChallengeTask.FillInTheBlanksChallenges) {
            userChallengeTask.ChallengeTask.FillInTheBlanksChallenges = [];
        }
        if (!userChallengeTask.ChallengeTask.MCQChallenges) {
            userChallengeTask.ChallengeTask.MCQChallenges = [];
        }

        return res.status(200).json({
            success: response.success,
            message: response.message,
            userChallengeTask
        });

    } catch (error) {
        console.error("Error starting User Challenge Task:", error);
        next(error);
    }
};

exports.checkUserChallengeTaskAnswers = async (req, res, next) => {
    try {
        const { user_challenge_task_id, answers } = req.body;


        Validation.isNumber(user_challenge_task_id, "User Challenge Task ID must be a number.");
        if (Array.isArray(answers) && answers.length > 0) Validation.isArray(answers, { min: 1 }, "Answers must be a non-empty array.");
        // Validate each answer object
        answers.forEach((answer, index) => {
            Validation.isObject(answer, `Answer at index ${index} must be an object.`);
            Validation.isNumber(answer.question_id, `Answer at index ${index} must have a valid question_id.`);
            // Validation.isString(answer.userAnswer, `Answer at index ${index} must have a non-empty answer string.`);
            Validation.isString(answer.question_type, `Answer at index ${index} must have a valid question_type.`);
        });

        // Call the stored procedure
        const { success, data, error } = await callProcedure('checkUserChallengeTaskAnswers', [
            user_challenge_task_id,
            JSON.stringify(answers)
        ]);
        
        if (!success) {
            return next(error);
        }

        // The stored procedure returns a result object
        const result = data[0].result;

        return res.status(200).json({
            message: result.message,
            totalCorrect: result.totalCorrect,
            totalQuestions: result.totalQuestions,
            totalRewardPoints: result.totalRewardPoints,
            details: result.details,
            passed: result.passed === 1 ? true : false
        });

    } catch (error) {
        console.error("Error checking User Challenge Task answers:", error);
        next(error);
    }
};