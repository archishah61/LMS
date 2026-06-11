const Validation = require("../../validations");
const { callProcedure } = require("../../utils/procedure/callProcedure");

// Create Frontend Statistic
exports.createStatistic = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { value, label, description, is_active } = req.body;

        // Validation for uploaded file
        if (!req.files || !req.files.statisticIcon || req.files.statisticIcon.length === 0) {
            return res.status(400).json({ message: "Statistic icon is required." });
        }
        const iconPath = `/frontend_statistics/icons/${req.files.statisticIcon[0].filename}`;

        // Validations
        Validation.isString(value, { min: 1 }, "Value is required.");
        Validation.isString(label, { min: 2 }, "Label is required.");
        Validation.isString(description, { min: 3 }, "Description must be at least 3 characters.");

        const { success, data, error } = await callProcedure("createFrontendStatistic", [
            iconPath,
            value,
            label,
            description,
            is_active !== undefined ? (is_active === "true" || is_active === true ? 1 : 0) : 1,
            userId,
            userId
        ]);

        if (!success) return next(error);

        res.status(201).json({ message: "Statistic created successfully", data });
    } catch (error) {
        next(error);
    }
};

// Get all Admin Statistics
exports.getAllStatisticsAdmin = async (req, res, next) => {
    try {
        const { is_active } = req.query; // 'true', 'false', or ''

        const { success, data, error } = await callProcedure("getAdminFrontendStatistics", [
            is_active || ''
        ]);

        if (!success) return next(error);

        res.status(200).json({ data });
    } catch (error) {
        next(error);
    }
};

// Get all User Active Statistics
exports.getAllActiveStatisticsUser = async (req, res, next) => {
    try {
        const { success, data, error } = await callProcedure("getUserFrontendStatistics", []);

        if (!success) return next(error);

        res.status(200).json({ data });
    } catch (error) {
        next(error);
    }
};

// Update Statistic
exports.updateStatistic = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { value, label, description, is_active } = req.body;

        Validation.isInteger(id, "Statistic ID must be a valid integer.");
        if (value) Validation.isString(value, { min: 1 }, "Value is required.");
        if (label) Validation.isString(label, { min: 2 }, "Label is required.");
        if (description) Validation.isString(description, { min: 3 }, "Description must be at least 3 characters.");

        let iconPath = null;
        if (req.files && req.files.statisticIcon && req.files.statisticIcon.length > 0) {
            iconPath = `/frontend_statistics/icons/${req.files.statisticIcon[0].filename}`;
        }

        const { success, data, error } = await callProcedure("updateFrontendStatistic", [
            id,
            iconPath, // This could be null if no new icon is uploaded
            value || null,
            label || null,
            description || null,
            is_active !== undefined ? (is_active === "true" || is_active === true || is_active === "1" || is_active === 1 ? 1 : 0) : null,
            userId
        ]);

        if (!success) return next(error);

        res.status(200).json({ message: "Statistic updated successfully", data });
    } catch (error) {
        next(error);
    }
};

// Delete Statistic
exports.deleteStatistic = async (req, res, next) => {
    try {
        const { id } = req.params;

        Validation.isInteger(id, "Statistic ID must be a valid integer.");

        const { success, data, error } = await callProcedure("deleteFrontendStatistic", [id]);

        if (!success) return next(error);

        res.status(200).json({ message: "Statistic deleted successfully", data });
    } catch (error) {
        next(error);
    }
};

// Toggle Active Statistic
exports.toggleStatisticActive = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        Validation.isInteger(id, "Statistic ID must be a valid integer.");

        const { success, data, error } = await callProcedure("toggleFrontendStatisticActive", [
            id,
            userId
        ]);

        if (!success) return next(error);

        res.status(200).json({ message: "Statistic visibility toggled successfully", data });
    } catch (error) {
        next(error);
    }
};

// Update Sequence Bulk
exports.updateStatisticSequence = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { sequences } = req.body;

        if (!Array.isArray(sequences) || sequences.length === 0) {
            return res.status(400).json({ message: "Sequences array is required" });
        }

        // We run in sequential order as procedure does not support bulk update inherently
        for (const item of sequences) {
            if (item.id !== undefined && item.sequence_no !== undefined) {
                const { success, error } = await callProcedure("updateFrontendStatisticSequence", [
                    item.id,
                    item.sequence_no,
                    userId
                ]);
                if (!success) throw error;
            }
        }

        res.status(200).json({ message: "Statistic sequences updated successfully" });
    } catch (error) {
        next(error);
    }
};
