const sequelize = require("../../../config/db");

exports.createQuizAttempt = async (req, res, next) => {
    try {
        const {
            user_challenge_id,
            user_challenge_task_id,
            attempt_number,
            total_questions,
            total_correct,
            total_reward_points,
            time_used_seconds,
            is_passed,
            results_details // Should be a JSON object
        } = req.body;

        // Basic validation
        if ((!user_challenge_id && !user_challenge_task_id) || attempt_number == null) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields."
            });
        }

        const result = await sequelize.query(
            `CALL createQuizAttempt(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            {
                replacements: [
                    user_challenge_id || null,
                    user_challenge_task_id || null,
                    attempt_number,
                    total_questions,
                    total_correct,
                    total_reward_points,
                    time_used_seconds,
                    is_passed,
                    JSON.stringify(results_details)
                ]
            }
        );

        return res.status(201).json({
            success: true,
            message: "Quiz attempt created successfully.",
            newAttemptId: result[0]?.new_quiz_attempt_id || null
        });
    } catch (error) {
        next(error);
    }
};

exports.getQuizAttempts = async (req, res, next) => {
    try {
        const { user_challenge_id, user_challenge_task_id } = req.query;

        if (!user_challenge_id && !user_challenge_task_id) {
            return res.status(400).json({
                success: false,
                message: "Provide either user_challenge_id or user_challenge_task_id."
            });
        }

        let procedure = '';
        let param = null;

        if (user_challenge_id) {
            procedure = 'getQuizAttemptsByDailyChallengeId';
            param = parseInt(user_challenge_id);
        } else {
            procedure = 'getQuizAttemptsByChallengeTaskId';
            param = parseInt(user_challenge_task_id);
        }

        const results = await sequelize.query(`CALL ${procedure}(?)`, {
            replacements: [param],
            type: sequelize.QueryTypes.RAW
        });

        return res.status(200).json({
            success: true,
            attempts: results
        });
    } catch (error) {
        next(error);
    }
};
