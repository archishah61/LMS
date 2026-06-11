const Validation = require("../../validations");
const { callProcedure } = require("../../utils/procedure/callProcedure");

// Create Frontend FAQ
exports.createFaq = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { question, answer, is_active } = req.body;

        // Validations
        Validation.isString(question, { min: 3 }, "Question must be between 3 and 1000 characters.");
        Validation.isString(answer, { min: 3 }, "Answer must be at least 3 characters.");

        const { success, data, error } = await callProcedure("createFrontendFaq", [
            question,
            answer,
            is_active !== undefined ? is_active : true,
            userId,
            userId
        ]);

        if (!success) return next(error);

        res.status(201).json({ message: "FAQ created successfully", data });
    } catch (error) {
        next(error);
    }
};

// Get all Admin FAQs
exports.getAllFaqsAdmin = async (req, res, next) => {
    try {
        const { is_active } = req.query; // 'true', 'false', or ''

        const { success, data, error } = await callProcedure("getAdminFrontendFaqs", [
            is_active || ''
        ]);

        if (!success) return next(error);

        res.status(200).json({ data });
    } catch (error) {
        next(error);
    }
};

// Get all User Active FAQs
exports.getAllActiveFaqsUser = async (req, res, next) => {
    try {
        const { success, data, error } = await callProcedure("getUserFrontendFaqs", []);

        if (!success) return next(error);

        res.status(200).json({ data });
    } catch (error) {
        next(error);
    }
};

// Update FAQ
exports.updateFaq = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { question, answer, is_active } = req.body;

        Validation.isInteger(id, "FAQ ID must be a valid integer.");
        Validation.isString(question, { min: 3 }, "Question must be between 3 and 1000 characters.");
        Validation.isString(answer, { min: 3 }, "Answer must be at least 3 characters.");

        const { success, data, error } = await callProcedure("updateFrontendFaq", [
            id,
            question,
            answer,
            is_active !== undefined ? is_active : null,
            userId
        ]);

        if (!success) return next(error);

        res.status(200).json({ message: "FAQ updated successfully", data });
    } catch (error) {
        next(error);
    }
};

// Delete FAQ
exports.deleteFaq = async (req, res, next) => {
    try {
        const { id } = req.params;

        Validation.isInteger(id, "FAQ ID must be a valid integer.");

        const { success, data, error } = await callProcedure("deleteFrontendFaq", [id]);

        if (!success) return next(error);

        res.status(200).json({ message: "FAQ deleted successfully", data });
    } catch (error) {
        next(error);
    }
};

// Toggle Active FAQ
exports.toggleFaqActive = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        Validation.isInteger(id, "FAQ ID must be a valid integer.");

        const { success, data, error } = await callProcedure("toggleFrontendFaqActive", [
            id,
            userId
        ]);

        if (!success) return next(error);

        res.status(200).json({ message: "FAQ visibility toggled successfully", data });
    } catch (error) {
        next(error);
    }
};

// Update Sequence Bulk
exports.updateFaqSequence = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { sequences } = req.body;

        if (!Array.isArray(sequences) || sequences.length === 0) {
            return res.status(400).json({ message: "Sequences array is required" });
        }

        // We run in sequential order as procedure does not support bulk update inherently
        for (const item of sequences) {
            if (item.id !== undefined && item.sequence_no !== undefined) {
                const { success, error } = await callProcedure("updateFrontendFaqSequence", [
                    item.id,
                    item.sequence_no,
                    userId
                ]);
                if (!success) throw error;
            }
        }

        res.status(200).json({ message: "FAQ sequences updated successfully" });
    } catch (error) {
        next(error);
    }
};
