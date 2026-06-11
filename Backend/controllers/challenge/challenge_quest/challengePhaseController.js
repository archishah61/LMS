const { Op } = require("sequelize");
const ChallengePhase = require("../../../models/challenges/challenge_quest/challenge_phases");
const Challenge = require("../../../models/challenges/challenge_quest/challenges");
const { callProcedure } = require("../../../utils/procedure/callProcedure");
const Validation = require("../../../validations");

exports.createChallengePhase = async (req, res, next) => {
    try {
        const {
            challenge_id, title, description,
            bonus_reward = null, phase_type
        } = req.body;

        // Validate required fields
        if (challenge_id !== undefined) {
            // Check if challenge exists
            const { success: challengeExists, data: challengeData, error: challengeError } =
                await callProcedure("getChallengeById", [challenge_id]);

            if (!challengeExists || !challengeData || challengeData.length === 0) {
                return res.status(404).json({
                    error: challengeError || "The specified challenge does not exist."
                });
            }
        }

        Validation.isString(title, { min: 1, max: 255 }, "Title is must be between 1-255 characters.");
        if (description) Validation.isString(description, "Description Must be a string");
        Validation.isEnum(phase_type, ['Easy', 'Moderate', 'Hard'], "Phase type is required");
        if (bonus_reward) Validation.isNumber(bonus_reward, "Bonus Reward Must Be a Positive Integer");

        const { success, data, error } = await callProcedure("createChallengePhase", [
            challenge_id, title, description,
            bonus_reward, phase_type
        ]);

        if (!success) {
            return next(error);
            // return res.status(400).json({ success: false, message: error });
        }

        res.status(201).json({ success: true, message: "Phase created", data });
    } catch (error) {
        next(error);
    }
};

exports.getChallengePhases = async (req, res, next) => {
    try {
        const { success, data, error } = await callProcedure("getAllChallengePhases");
        if (!success) {
            return next(error);
            // return res.status(400).json({ success: false, message: error });
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

exports.getChallengePhasesByQuest = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { searchTerm, phaseType, status } = req.query;

        // Validate id
        if (!id) throw new Error("Challenge ID is required");

        const { success, data, error } = await callProcedure("getChallengePhasesByQuest", [
            id,
            searchTerm || null,
            phaseType || null,
            status || null
        ]);

        if (!success) {
            return next(error);
            // return res.status(400).json({ success: false, message: error });
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

exports.getChallengePhaseById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate id
        if (!id) throw new Error("Phase ID is required");

        const { success, data, error } = await callProcedure("getChallengePhaseById", [id]);
        if (!success || data.length === 0) {
            return next(error);
            // return res.status(404).json({ success: false, message: "Challenge Phase not found." });
        }

        res.status(200).json({ success: true, data: data[0] });
    } catch (error) {
        next(error);
    }
};

exports.updateChallengePhase = async (req, res, next) => {
    try {
        const { id } = req.params;

        const {
            challenge_id, title, description,
            bonus_reward = null,
            phase_type
        } = req.body;

        if (!id) throw new Error("Phase ID is required");

        if (challenge_id !== undefined) {
            // Check if challenge exists
            const { success: challengeExists, data: challengeData, error: challengeError } =
                await callProcedure("getChallengeById", [challenge_id]);

            if (!challengeExists || !challengeData || challengeData.length === 0) {
                return res.status(404).json({
                    error: challengeError || "The specified challenge does not exist."
                });
            }
        }

        if (title) Validation.isString(title, { min: 1, max: 255 }, "Title is must be between 1-255 characters.");
        if (description) Validation.isString(description, "Description Must be a string");
        if (phase_type) Validation.isEnum(phase_type, ['Easy', 'Moderate', 'Hard'], "Phase type is required");
        if (bonus_reward) Validation.isNumber(bonus_reward, "Bonus Reward Must Be a Positive Integer");

        const { success, data, error } = await callProcedure("updateChallengePhase", [
            id, challenge_id !== undefined ? challenge_id : null,
            title !== undefined ? title : null,
            description !== undefined ? description : null,
            bonus_reward !== undefined ? bonus_reward : null,
            phase_type !== undefined ? phase_type : null,
        ]);

        if (!success) {
            return next(error);
            // const err = new Error(error || "Challenge update failed");
            // err.original = { sqlState: '45000', message: error }; // simulate DB error
            // throw err;
        }

        res.status(200).json({ success: true, message: "Updated", data });
    } catch (error) {
        next(error);
    }
};

exports.deleteChallengePhase = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate id
        if (!id) throw new Error("Phase ID is required");

        const { success, error } = await callProcedure("deleteChallengePhase", [id]);
        if (!success) {
            return next(error);
            // return res.status(400).json({ success: false, message: error });
        }

        res.status(200).json({ success: true, message: "Deleted" });
    } catch (error) {
        next(error);
    }
};

exports.toggleChallengePhaseStatus = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate id
        if (!id) throw new Error("Phase ID is required");
        const { success, data, error } = await callProcedure("toggleChallengePhaseStatus", [id]);
        if (!success) {
            return next(error);
            // return res.status(400).json({ success: false, message: error });
        }

        res.status(200).json({ success: true, message: "Status toggled", data });
    } catch (error) {
        next(error);
    }
};

// -------------------------------------PROCEDURE RELATED CODE ENDS---------------------------------
