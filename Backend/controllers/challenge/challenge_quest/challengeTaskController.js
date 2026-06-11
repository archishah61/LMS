const { Op } = require("sequelize");
const ChallengeTask = require("../../../models/challenges/challenge_quest/challenge_tasks");
const ChallengePhase = require("../../../models/challenges/challenge_quest/challenge_phases");
const TrueFalseChallenge = require("../../../models/challenges/challenge_quest/true_false_challenges");
const { callProcedure } = require("../../../utils/procedure/callProcedure");
const { callProcedureChallenge } = require("../../../utils/procedure/callProcedureChallenge");
const Validation = require("../../../validations");

exports.createChallengeTask = async (req, res, next) => {
    try {
        const {
            challenge_phase_id, title, description, difficulty_level, qualify_percentage, revive_attempt_time,
            is_mandatory, show_answer, is_warning, no_of_warning, max_attempts, reward_points, time_limit, dependency_task_id
        } = req.body;

        Validation.isNumber(challenge_phase_id, "Challenge phase ID is required");
        Validation.isString(title, { min: 1, max: 255 }, "Title is must be between 1-255 characters.");
        if (description) Validation.isString(description, "Description Must be a string");
        Validation.isEnum(difficulty_level, ['Easy', 'Moderate', 'Hard'], "Difficulty level is required")
        if (max_attempts) Validation.isNumber(max_attempts, "Max Attempts Must Be a Positive Integer");
        if (revive_attempt_time) Validation.isNumber(revive_attempt_time, "Rivive Attempts Time Must Be a Positive Integer");
        if (reward_points) Validation.isNumber(reward_points, "Reward Points Must Be a Positive Integer");
        if (time_limit) Validation.isNumber(time_limit, "Time Limit Must Be a Positive Integer");

        const { success, data, error } = await callProcedure("createChallengeTask", [
            challenge_phase_id, title, description, difficulty_level, qualify_percentage || null, revive_attempt_time,
            is_mandatory !== undefined ? is_mandatory : true, show_answer !== undefined ? show_answer : true, is_warning !== undefined ? is_warning : false, no_of_warning || 0, max_attempts || 3, reward_points || 0, time_limit || null
        ]);

        if (!success) {
            return next(error);
            // return res.status(400).json({ success: false, message: error });
        }

        res.status(201).json({ success: true, message: "Challenge Task created successfully.", data });
    } catch (error) {
        next(error);
    }
};

exports.getChallengeTasks = async (req, res, next) => {
    try {
        const { success, data, error } = await callProcedure("getChallengeTasks", []);

        // if (!success) return res.status(400).json({ success: false, message: error });
        if (!success) return next(error);

        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

exports.getChallengeTasksByPhase = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { searchTerm, difficulty, status } = req.query;

        if (!id) {
            return res.status(400).json({ error: "ChallengePhase ID is required." });
        }

        const { success, data, error } = await callProcedure("getChallengeTasksByPhase", [
            id,
            searchTerm || null,
            difficulty || null,
            status || null
        ]);

        // if (!success) return res.status(400).json({ success: false, message: error });
        if (!success) return next(error);

        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

exports.updateChallengeTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            challenge_phase_id, title, description, difficulty_level, qualify_percentage, revive_attempt_time,
            is_mandatory, show_answer, is_warning, no_of_warning, max_attempts, reward_points, time_limit
        } = req.body;

        if (challenge_phase_id) Validation.isNumber(challenge_phase_id, "Challenge phase ID is required");
        if (title) Validation.isString(title, { min: 1, max: 255 }, "Title is must be between 1-255 characters.");
        if (description) Validation.isString(description, "Description Must be a string");
        if (difficulty_level) Validation.isEnum(difficulty_level, ['Easy', 'Moderate', 'Hard'], "Difficulty level is required")
        if (max_attempts) Validation.isNumber(max_attempts, "Max Attempts Must Be a Positive Integer");
        if (reward_points) Validation.isNumber(reward_points, "Reward Points Must Be a Positive Integer");
        if (time_limit) Validation.isNumber(time_limit, "Time Limit Must Be a Positive Integer");

        const { success, data, error } = await callProcedure("updateChallengeTask", [
            id, challenge_phase_id, title, description, difficulty_level, qualify_percentage, revive_attempt_time,
            is_mandatory !== undefined ? is_mandatory : true, show_answer !== undefined ? show_answer : true, is_warning !== undefined ? is_warning : false, no_of_warning || 0, max_attempts || 3, reward_points || 0, time_limit || null
        ]);

        // if (!success) return res.status(400).json({ success: false, message: error });
        if (!success) return next(error);

        res.status(200).json({ success: true, message: "Challenge Task updated successfully.", data });
    } catch (error) {
        next(error);
    }
};

exports.deleteChallengeTask = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: "Challenge Task ID is required" });
        }

        const { success, data, error } = await callProcedure("deleteChallengeTask", [id]);

        // if (!success) return res.status(400).json({ success: false, message: error });
        if (!success) return next(error);

        res.status(200).json({ success: true, message: "Challenge Task deleted successfully." });
    } catch (error) {
        next(error);
    }
};

exports.toggleChallengeTaskStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Challenge Task ID is required" });
        }

        const { success, data, error } = await callProcedure("toggleChallengeTaskStatus", [id]);

        // if (!success) return res.status(400).json({ success: false, message: error });
        if (!success) return next(error);

        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

exports.getChallengeTaskById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Challenge Task ID is required" });
        }

        const { success, data, error } = await callProcedureChallenge("GetChallengeTaskById", [id]);

        if (!success || !data || data.length < 1 || Object.keys(data[0]).length === 0) {
            return next(error);
        }

        // Convert each table's rows to actual arrays
        const taskData = Object.values(data[0]);
        const fillBlanks = Object.values(data[1] || {});
        const mcqs = Object.values(data[2] || {});
        const mcqOptions = Object.values(data[3] || {});
        const trueFalseChallenges = Object.values(data[4] || {});

        const task = taskData[0];

        const mcqsWithOptions = mcqs.map(mcq => ({
            ...mcq,
            options: mcqOptions.filter(opt => opt.mcq_id === mcq.id),
        }));

        const formattedTask = {
            ...task,
            FillInBlankChallenges: fillBlanks,
            MCQChallenges: mcqsWithOptions,
            TrueFalseChallenges: trueFalseChallenges,
        };

        return res.status(200).json({ success: true, data: formattedTask });

    } catch (error) {
        next(error);
    }
};

// -------------------------------------PROCEDURE RELATED CODE ENDS---------------------------------
