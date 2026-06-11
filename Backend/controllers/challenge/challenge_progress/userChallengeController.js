const UserChallenge = require("../../../models/challenges/challenge_progress/user_challenge");
const UserChallengePhase = require("../../../models/challenges/challenge_progress/user_challenge_phases");
const UserChallengeTask = require("../../../models/challenges/challenge_progress/user_challenge_tasks");
const ChallengePhase = require("../../../models/challenges/challenge_quest/challenge_phases");
const ChallengeTask = require("../../../models/challenges/challenge_quest/challenge_tasks");
const Challenge = require("../../../models/challenges/challenge_quest/challenges");
const ChallengeCategory = require("../../../models/masters/challengeCategory");
const sequelize = require('../../../config/db'); // adjust the path to your sequelize instance
const { callProcedureChallenge } = require("../../../utils/procedure/callProcedureChallenge");
const { callProcedure } = require("../../../utils/procedure/callProcedure");
const Validation = require("../../../validations");

exports.startUserChallenge = async (req, res, next) => {
    try {
        let { user_id, challenge_id } = req.body;
        user_id = user_id ? user_id : req.user.id;


        if (!user_id || !challenge_id) {
            return res.status(400).json({ message: "user_id and challenge_id are required" });
        }

        Validation.isNumber(user_id, "User ID must be a number.");
        Validation.isNumber(challenge_id, "Challenge ID must be a number.");

        const { success, data, error } = await callProcedureChallenge('startUserChallenge', [user_id, challenge_id]);

        if (!success) {
            return res.status(500).json({ message: "Failed to start challenge", error });
        }

        // Extract the first result row
        const result = data[0][0];

        // If stored procedure returned an error
        if (result.status_code !== 200) {
            return res.status(result.status_code).json({ message: result.message });
        }

        const userChallengeResult = await callProcedure('getUserChallengeDetails', [result.user_challenge_id]);
        if (!userChallengeResult.success || !userChallengeResult.data || !userChallengeResult.data[0]) {
            return res.status(400).json({ message: "Failed to fetch user challenge details" });
        }
        // Get the first row from the first result set
        const userChallenge = userChallengeResult.data[0][0] || userChallengeResult.data[0];

        // Convert boolean fields from numbers to booleans
        if (userChallenge) {
            userChallenge.is_completed = !!userChallenge.is_completed;
            userChallenge.is_active = !!userChallenge.is_active;
        }

        // Fetch challenge with phases using stored procedure
        const challengeResult = await callProcedureChallenge('getChallengeWithPhases', [challenge_id]);
        if (!challengeResult.success || !challengeResult.data) {
            return res.status(400).json({ message: "Failed to fetch challenge details" });
        }

        // Process result sets from getChallengeWithPhases procedure
        const challenge = challengeResult.data[0][0]; // First result set, first row (challenge details)
        if (!challenge) {
            return res.status(404).json({ message: "Challenge not found" });
        }

        // Convert is_active from number to boolean
        challenge.is_active = !!challenge.is_active;

        // Get phases from the second result set and convert to array
        const challengePhases = Array.isArray(challengeResult.data[1])
            ? challengeResult.data[1]
            : Object.values(challengeResult.data[1] || {});

        // Convert boolean fields in each phase
        challengePhases.forEach(phase => {
            if (phase) {
                phase.is_active = !!phase.is_active;
                phase.bonus_reward = phase.bonus_reward || 0;
            }
        });

        // Add phases to challenge object as an array
        challenge.ChallengePhases = challengePhases;

        return res.status(200).json({
            message: result.message,
            userChallenge,
            challenge
        });

    } catch (error) {
        next(error);
    }
};

exports.getAllChallenges = async (req, res, next) => {
    try {
        const { success, data, error } = await callProcedure('GetAllActiveChallenges', []);

        if (!success) {
            return res.status(500).json({ success: false, message: "Failed to fetch challenges", error });
        }

        res.status(200).json({ success: true, data: data });
    } catch (error) {
        next(error);
    }
};

exports.getChallengeQuestLeaderboard = async (req, res, next) => {
    try {
        const { difficulty_level, category_id, timeinterval } = req.query;

        const { success, data, error } = await callProcedure('getChallengeQuestLeaderboard', [
            difficulty_level || 'all',
            category_id ? category_id !== 'all' ? category_id : null : null,
            timeinterval || 'today'
        ]);

        if (!success) {
            return next(error);
        }

        res.status(200).json({ success: true, data: data });
    } catch (error) {
        next(error);
    }
};

exports.getUserChallengeById = async (req, res, next) => {
    try {
        const { id } = req.params; // UserChallenge ID


        Validation.isNumber(id, "User Challenge ID must be a number.");

        const { success, data, error } = await callProcedureChallenge('getUserChallengeById', [id]);

        if (!success) {
            return res.status(500).json({ success: false, message: "Failed to fetch user challenge", error });
        }

        const userChallengeData = Object.values(data[0]);
        const userChallengePhasesData = Object.values(data[1]);
        // Then format them like your original response:
        res.status(200).json({
            success: true,
            data: {
                ...userChallengeData[0],
                Challenge: {
                    id: userChallengeData[0].challenge_id,
                    title: userChallengeData[0].challenge_title,
                    description: userChallengeData[0].challenge_description,
                    difficulty_level: userChallengeData[0].difficulty_level,
                    reward_points: userChallengeData[0].reward_points,
                    created_at: userChallengeData[0].challenge_created_at
                },
                UserChallengePhases: userChallengePhasesData.map(phase => ({
                    ...phase,
                    ChallengePhase: {
                        id: phase.challenge_phase_id,
                        title: phase.phase_title,
                        description: phase.phase_description,
                        bonus_reward: phase.bonus_reward,
                        phase_number: phase.phase_number,
                        tasks_count: phase.tasks_count,
                        phase_type: phase.phase_type,
                        is_final_phase: phase.is_final_phase
                    }
                }))
            }
        });

    } catch (error) {
        // console.error("Error fetching UserChallenge by ID:", error);
        next(error);
    }
};

exports.getUserChallengesByUserId = async (req, res, next) => {
    try {
        const userId = req.user?.id;


        Validation.isNumber(userId, "User ID must be a number.");

        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is missing" });
        }

        // Using Sequelize to call the stored procedure
        const { success, data, error } = await callProcedure('getUserChallengesByUserId', [userId]);
        if (!success) {
            return next(error);
        }
        res.status(200).json(data[0]);
    } catch (error) {
        next(error);
    }
};


exports.getChallengeRecommendations = async (req, res, next) => {
    try {
        const userId = req.user.id; // Assuming req.user is populated by authentication middleware
        const { success, data, error } = await callProcedure("getChallengeRecommendations", [userId]);

        if (!success) {
            return next(error);
        }

        if (!data[0] || data[0].length === 0) {
            return res.status(200).json({ message: 'No matching challenges found.', recommendations: [] });
        }

        return res.status(200).json(data[0]);
    } catch (error) {
        console.error('Error fetching recommended challenges:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

