const { callProcedure } = require("../../../utils/procedure/callProcedure");
const { callProcedureChallenge } = require("../../../utils/procedure/callProcedureChallenge");
const Validation = require("../../../validations");

const formatDateForMySQL = (date) => {
    const d = new Date(date);
    return d.toISOString().slice(0, 19).replace('T', ' ');
};

// -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------


exports.createChallenge = async (req, res, next) => {
    try {
        const {
            title, description, difficulty_level, category_id,
            reward_points, startDate, endDate, rules
        } = req.body;

        Validation.isString(title, { min: 1, max: 255 }, "Title is must be between 1-255 characters.");
        if (description) Validation.isString(description, "Description is Must be string.");
        Validation.isEnum(difficulty_level, ['Beginner', 'Intermediate', 'Advanced'], "Difficulty level is required.");
        Validation.isNumber(category_id, "Category ID is required.");
        if (reward_points) Validation.isNumber(reward_points, "Must Be A Positive Integer");
        if (startDate) Validation.isDate(startDate);
        if (endDate) Validation.isDate(endDate);

        const { success: categoryExists, data: categoryData, error: categoryError } = await callProcedure("getChallengeCategoryById", [category_id]);

        if (!categoryExists || !categoryData || categoryData.length === 0) {
            return res.status(404).json({
                error: categoryError || "The specified category does not exist."
            });
        }

        const startDateFormatted = startDate ? formatDateForMySQL(startDate) : null;
        const endDateFormatted = endDate ? formatDateForMySQL(endDate) : null;

        const { success, data, error } = await callProcedure("createChallenge", [
            title, description, difficulty_level, category_id,
            reward_points || null, startDateFormatted,
            endDateFormatted, rules || null
        ]);

        if (!success) {
            return next(error);
            // const err = new Error(error || "Challenge create failed");
            // err.original = { sqlState: '45000', message: error }; // simulate DB error
            // throw err;
        }

        res.status(201).json({
            success: true,
            message: "Challenge Quest created successfully",
            challenge: data
        });
    } catch (error) {
        next(error);
    }
};

exports.getChallenges = async (req, res, next) => {
    try {
        const { limit = "all", offset = "0", category, difficulty, status } = req.query;

        if (status && status.toLowerCase() !== 'all') Validation.isEnum(status, ["active", "inactive"], 'Invalid status value');
        if (difficulty && difficulty.toLowerCase() !== 'all') Validation.isEnum(difficulty, ["Beginner", "Intermediate", "Advanced"], 'Invalid type');
        if (category && category.toLowerCase() !== 'all') Validation.isInteger(category, "Category must be a non-negative integer.");

        /* ---------- VALIDATION ---------- */
        if (limit !== "all") {
            Validation.isInteger(limit, "Limit must be a positive integer or 'all'.");
        }

        Validation.isInteger(offset, "Offset must be a non-negative integer.");
        /* --------------------------------- */

        const parsedLimit = limit === "all" ? "all" : Number(limit);
        const parsedOffset = Number(offset);

        const { success, data, error } = await callProcedureChallenge("getAllChallenges", [
            category && category !== 'all' ? category : null,
            status && status.toLowerCase() !== 'all' ? status.toLowerCase() === "active" ? true : false : null,
            difficulty && difficulty.toLowerCase() !== 'all' ? difficulty : null,
            limit === "all" ? 0 : parsedLimit,
            parsedOffset,
            limit === "all" || false
        ]);

        if (!success) {
            return next(error);
        }

        const meta = data[0][0];

        res.status(200).json({ success: true, data: Object.values(data[1]), pagination: { totalCount: meta?.total_count, totalPages: limit === "all" ? 1 : Math.ceil(meta?.total_count / parsedLimit) } });
    } catch (error) {
        next(error);
    }
};

// get Challenge By ID
exports.getChallengeById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: "ChallengeQuest ID is required." });
        }

        const result = await callProcedure("getChallengeById", [id]);
        if (result.length === 0) {
            return res.status(404).json({ success: false, message: "ChallengeQuest not found" });
        }
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// Update Challenge
exports.updateChallenge = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate challenge ID
        if (!id) {
            return res.status(400).json({ error: "ChallengeQuest ID is required." });
        }

        const {
            title, description, difficulty_level, category_id,
            reward_points, startDate, endDate,
            rules, is_active
        } = req.body;

        if (title) Validation.isString(title, { min: 1, max: 255 }, "Title is must be between 1-255 characters.");
        if (description) Validation.isString(description, "Description is must be String.");
        if (difficulty_level) Validation.isEnum(difficulty_level, ['Beginner', 'Intermediate', 'Advanced'], "Difficulty level is required.");
        if (category_id) Validation.isNumber(category_id, "Category ID is required.")
        if (reward_points) Validation.isNumber(reward_points, "Must Be A Positive Integer");
        if (startDate) Validation.isDate(startDate);
        if (endDate) Validation.isDate(endDate);

        // Format dates if they are provided
        const startDateFormatted = startDate !== undefined ?
            (startDate ? formatDateForMySQL(startDate) : null) : undefined;

        const endDateFormatted = endDate !== undefined ?
            (endDate ? formatDateForMySQL(endDate) : null) : undefined;

        // Call the stored procedure with only the fields that need to be updated
        // Pass null for fields that should retain their current values
        const { success, data, error } = await callProcedure("updateChallenge", [
            id,
            title !== undefined ? title : null,
            description !== undefined ? description : null,
            difficulty_level !== undefined ? difficulty_level : null,
            category_id !== undefined ? category_id : null,
            reward_points !== undefined ? reward_points : null,
            startDateFormatted !== undefined ? startDateFormatted : null,
            endDateFormatted !== undefined ? endDateFormatted : null,
            rules !== undefined ? rules : null,
            is_active !== undefined ? is_active : null
        ]);

        if (!success) {
            return next(error);
        }

        res.status(200).json({
            success: true,
            message: "ChallengeQuest updated successfully",
            challenge: data
        });

    } catch (error) {
        next(error);
    }
};

// Delete Challenge
exports.deleteChallenge = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate challenge ID
        if (!id) {
            return res.status(400).json({ error: "ChallengeQuest ID is required." });
        }

        const { success, data, error } = await callProcedure("deleteChallenge", [id]);

        if (!success) {
            return next(error);
        }

        res.status(200).json({ success: true, message: "ChallengeQuest deleted successfully" });
    } catch (error) {
        next(error);
    }
};

// Toggle Challenge Status
exports.toggleChallengeStatus = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate challenge ID
        if (!id) {
            return res.status(400).json({ error: "ChallengeQuest ID is required." });
        }

        const { success, data, error } = await callProcedure("toggleChallengeStatus", [id]);
        if (!success) {
            return next(error);
        }

        res.status(200).json({ success: true, data: data[0] });
    } catch (error) {
        next(error);
    }
};

// -------------------------------------PROCEDURE RELATED CODE ENDS---------------------------------
