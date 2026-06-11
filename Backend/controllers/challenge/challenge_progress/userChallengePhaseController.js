const { callProcedure } = require("../../../utils/procedure/callProcedure");
const Validation = require("../../../validations");

exports.startUserChallengePhase = async (req, res, next) => {
    try {
        const { user_challenge_id, challenge_phase_id } = req.body;

        if (!user_challenge_id || !challenge_phase_id) {
            return res.status(400).json({
                message: "user_challenge_id and challenge_phase_id are required"
            });
        }

        Validation.isNumber(user_challenge_id, "User Challenge ID must be a number.");
        Validation.isNumber(challenge_phase_id, "Challenge Phase ID must be a number.");

        // Call procedure to start phase
        const { success, data, error } = await callProcedure('startUserChallengePhase', [
            user_challenge_id,
            challenge_phase_id
        ]);

        if (!success) {
            return next(error);
            // return res.status(500).json({ message: "Failed to start challenge Phase", error });
        }

        const result = Array.isArray(data) ? data[0] : data;

        if (result && result.success === 0) {
            return res.status(200).json({
                success: false,
                message: result.message
            });
        }

        // ✅ Get the full phase and task details
        const phaseDataRaw = await callProcedure('getUserChallengePhase', [
            user_challenge_id,
            challenge_phase_id
        ]);

        const raw = Array.isArray(phaseDataRaw.data) ? phaseDataRaw.data[0] : phaseDataRaw.data;

        if (!raw) {
            return res.status(404).json({ message: "User Challenge Phase not found" });
        }

        // 🧩 Extract ChallengePhase data
        const challengePhase = {
            id: raw.challenge_phase_id,
            challenge_id: raw.challenge_id,
            phase_number: raw.phase_number,
            title: raw.title,
            description: raw.description,
            tasks_count: raw.tasks_count,
            bonus_reward: raw.bonus_reward || 0,
            phase_type: raw.phase_type,
            is_active: raw.cp_is_active ?? true, // alias if needed
            created_at: raw.cp_created_at ?? raw.created_at,
            updated_at: raw.cp_updated_at ?? raw.updated_at
        };

        const userChallengePhase = {
            id: raw.ucp_id,
            user_challenge_id: raw.user_challenge_id,
            challenge_phase_id: raw.challenge_phase_id,
            completed_tasks: raw.completed_tasks,
            is_completed: raw.is_completed,
            points_earned: raw.points_earned,
            completed_at: raw.completed_at,
            is_lock: raw.is_lock,
            started_at: raw.started_at,
            progress_percentage: raw.progress_percentage,
            is_active: raw.ucp_is_active ?? true, // alias if needed
            created_at: raw.ucp_created_at ?? raw.created_at,
            updated_at: raw.ucp_updated_at ?? raw.updated_at,
            ChallengePhase: challengePhase,
            UserChallengeTasks: (raw.tbl_user_challenge_tasks || []).map(task => {
                const ct = task.challenge_task;
                const uct = task.user_challenge_task;

                return {
                    id: uct.id,
                    user_challenge_phase_id: uct.user_challenge_phase_id,
                    challenge_task_id: uct.challenge_task_id,
                    is_completed: Boolean(uct.is_completed),
                    attempts: uct.attempts,
                    points_earned: uct.points_earned,
                    completed_at: uct.completed_at,
                    progress_percentage: uct.progress_percentage,
                    is_active: Boolean(uct.is_active),
                    revive_attempt_at: uct.revive_attempt_at,
                    created_at: uct.created_at,
                    updated_at: uct.updated_at,
                    ChallengeTask: {
                        id: ct.id,
                        challenge_phase_id: ct.challenge_phase_id,
                        title: ct.title,
                        description: ct.description,
                        difficulty_level: ct.difficulty_level,
                        qualify_percentage: ct.qualify_percentage,
                        order: ct.order,
                        is_mandatory: Boolean(ct.is_mandatory),
                        show_answer: Boolean(ct.show_answer),
                        max_attempts: ct.max_attempts,
                        reward_points: ct.reward_points,
                        time_limit: ct.time_limit,
                        is_active: Boolean(ct.is_active),
                        created_at: ct.created_at,
                        updated_at: ct.updated_at
                    }
                };
            })
        };
        
        return res.status(200).json({
            success: true,
            message: "User Challenge Phase started successfully.",
            userChallengePhase
        });

    } catch (error) {
        next(error);
    }
};
