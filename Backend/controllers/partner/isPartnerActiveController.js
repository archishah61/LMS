// controllers/partner/isPartnerActiveController.js
const { callProcedure } = require("../../utils/procedure/callProcedure");
const Validation = require("../../validations");

// 1. Toggle isActive by ID (preserve response shape)
const togglePartnerStatus = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate id
        Validation.isInteger(id, { min: 1 }, "Partner ID must be a positive integer.");

        const { success, data, error } = await callProcedure("togglePartnerStatus", [id]);

        if (!success && error) return next(error);
        if (!success || !data || !data[0]) {
            return res.status(404).json({ message: "Partner not found" });
        }

        const partner = data[0];
        return res.status(200).json({
            message: `Partner status updated successfully to ${partner.isActive}`,
            partner,
        });
    } catch (error) {
        next(error);
    }
};

// 2. Get Partner by ID (preserve response shape)
const getPartnerStatus = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate id
        Validation.isInteger(id, { min: 1 }, "Partner ID must be a positive integer.");

        const { success, data, error } = await callProcedure("getPartnerStatusById", [id]);

        if (!success && error) return next(error);
        if (!success || !data || !data[0]) {
            return res.status(404).json({ message: "Partner not found" });
        }

        return res.status(200).json(data[0]);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    togglePartnerStatus,
    getPartnerStatus,
};
