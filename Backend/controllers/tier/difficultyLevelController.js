const { callProcedure } = require("../../utils/procedure/callProcedure");
const { callProcedureChallenge } = require("../../utils/procedure/callProcedureChallenge");
const Validation = require("../../validations");


/* ───────────────────────────  CREATE DIFFICULTY LEVEL  ─────────────────────────── */
const createDifficultyLevel = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const userId = req.user?.id;

        /* ---------- VALIDATION ---------- */
        Validation.isString(name, { min: 1, max: 100 }, "Name is required and must be under 100 characters.");
        /* --------------------------------- */

        const { success, data, error } = await callProcedure("createDifficultyLevel", [
            name,
            description || null,
            userId,
            userId,
        ]);

        if (!success) return next(error);

        res.status(201).json({
            success,
            message: "Difficulty Level created successfully",
            data: data[0],
        });
    } catch (err) {
        next(err);
    }
};


/* ───────────────────────────  UPDATE DIFFICULTY LEVEL  ─────────────────────────── */
const updateDifficultyLevel = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const userId = req.user?.id;

        /* ---------- VALIDATION ---------- */
        Validation.isInteger(id, "Difficulty Level ID must be a positive integer.");
        Validation.isString(name, { min: 1, max: 100 }, "Name is required and must be under 100 characters.");
        /* --------------------------------- */

        const { success, data, error } = await callProcedure("updateDifficultyLevel", [
            id,
            name,
            description || null,
            userId,
        ]);

        if (!success) return next(error);

        res.status(200).json({
            success,
            message: "Difficulty Level updated successfully",
            data: data[0],
        });
    } catch (err) {
        next(err);
    }
};


/* ───────────────────────────  GET ALL DIFFICULTY LEVELS  ─────────────────────────── */
const getAllDifficultyLevels = async (req, res, next) => {
    try {
        const {
            search_term = "",
            limit = "ALL",
            offset = "0",
        } = req.query;

        /* ---------- VALIDATION ---------- */
        if (limit !== "ALL") {
            Validation.isInteger(limit, "Limit must be a positive integer or 'ALL'.");
        }
        Validation.isInteger(offset, "Offset must be a non-negative integer.");
        if (search_term) Validation.isString(search_term, { min: 1, max: 255 });
        /* --------------------------------- */

        const parsedLimit = limit === "ALL" ? "ALL" : Number(limit);
        const parsedOffset = Number(offset);

        const { success, data, error } = await callProcedureChallenge("getAllDifficultyLevels", [
            search_term || null,
            parsedLimit,
            parsedOffset,
        ]);

        if (!success) return next(error);

        res.status(200).json({
            success,
            data: {
                total_count: data[0]["0"].total_count,
                difficultyLevels: Object.values(data[1]),
            },
        });
    } catch (err) {
        next(err);
    }
};


/* ───────────────────────────  GET ALL ACTIVE DIFFICULTY LEVELS  ─────────────────────────── */
const getAllActiveDifficultyLevels = async (req, res, next) => {
    try {
        const { success, data, error } = await callProcedure("getAllActiveDifficultyLevels");

        if (!success) return next(error);

        res.status(200).json({ success, data });
    } catch (err) {
        next(err);
    }
};


/* ───────────────────────────  TOGGLE DIFFICULTY LEVEL STATUS  ─────────────────────────── */
const toggleDifficultyLevelStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        Validation.isInteger(id, "Difficulty Level ID must be a positive integer.");

        const { success, data, error } = await callProcedure("toggleDifficultyLevelStatus", [id, userId]);

        if (!success) return next(error);

        res.status(200).json({
            success: true,
            message: "Difficulty Level status toggled successfully",
            data: data[0],
        });
    } catch (err) {
        next(err);
    }
};


/* ───────────────────────────  DELETE DIFFICULTY LEVEL  ─────────────────────────── */
const deleteDifficultyLevel = async (req, res, next) => {
    try {
        const { id } = req.params;

        Validation.isInteger(id, "Difficulty Level ID must be a positive integer.");

        const { success, error } = await callProcedure("deleteDifficultyLevel", [id]);

        if (!success) return next(error);

        res.status(200).json({
            success,
            message: "Difficulty Level deleted successfully",
        });
    } catch (err) {
        next(err);
    }
};


/* ───────────────────────────  GET TIERS BY DIFFICULTY LEVEL  ─────────────────────────── */
const getTiersByDifficultyLevel = async (req, res, next) => {
    try {
        const { id } = req.params;

        Validation.isInteger(id, "Difficulty Level ID must be a positive integer.");

        const { success, data, error } = await callProcedure("getTiersByDifficultyLevel", [id]);

        if (!success) return next(error);

        res.status(200).json({
            success,
            data,
        });
    } catch (err) {
        next(err);
    }
};


/* ───────────────────────────  EXPORTS  ─────────────────────────── */
module.exports = {
    createDifficultyLevel,
    updateDifficultyLevel,
    getAllDifficultyLevels,
    getAllActiveDifficultyLevels,
    toggleDifficultyLevelStatus,
    deleteDifficultyLevel,
    getTiersByDifficultyLevel,
};
