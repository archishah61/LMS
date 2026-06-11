// controllers/featureStatus/featureStatusController.js
const { callProcedure } = require("../../utils/procedure/callProcedure");
const Validation = require("../../validations");

// 1. Toggle Feature Status by ID
const toggleFeatureStatus = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate id
        Validation.isInteger(id, { min: 1 }, "Feature ID must be a positive integer.");

        const { success, data, error } = await callProcedure("toggleFeatureStatus", [id]);

        if (!success && error) return next(error);
        if (!success || !data || !data[0]) {
            return res.status(404).json({ message: "Feature not found" });
        }

        const feature = data[0];

        return res.status(200).json({
            message: `Feature status updated successfully to ${feature.is_active}`,
            feature,
        });
    } catch (error) {
        next(error);
    }
};

// 2. Get Feature Status by ID
const getFeatureStatus = async (req, res, next) => {
    try {
        const { name } = req.params;

        const { success, data, error } = await callProcedure("getFeatureStatusByName", [name]);

        if (!success && error) return next(error);
        if (!success || !data || !data[0]) {
            return res.status(404).json({ message: "Feature not found" });
        }

        return res.status(200).json(data[0]);
    } catch (error) {
        next(error);
    }
};

const getAllFeatureStatus = async (req, res, next) => {
    try {
        const { sortBy, status } = req.query;

        const { success, data, error } = await callProcedure("getAllFeatureStatus", [
            sortBy || null,
            status || null
        ]);

        if (!success && error) return next(error);
        if (!success || !data) {
            return res.status(404).json({ message: "Feature not found" });
        }

        return res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    toggleFeatureStatus,
    getFeatureStatus,
    getAllFeatureStatus
};
