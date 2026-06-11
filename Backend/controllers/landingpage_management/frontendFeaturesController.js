const Validation = require("../../validations");
const { callProcedure } = require("../../utils/procedure/callProcedure");

// Create Frontend Feature
exports.createFeature = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { title, description, is_active, bgColor } = req.body;

        // Validation for uploaded file
        if (!req.files || !req.files.featureIcon || req.files.featureIcon.length === 0) {
            return res.status(400).json({ message: "Feature icon is required." });
        }
        const iconPath = `/frontend_features/icons/${req.files.featureIcon[0].filename}`;

        // Validations
        Validation.isString(title, { min: 2 }, "Title is required.");
        Validation.isString(description, { min: 3 }, "Description must be at least 3 characters.");

        const isActive = is_active !== undefined ? (is_active === "true" || is_active === true ? 1 : 0) : 1;

        const { success, data, error } = await callProcedure("createFrontendFeature", [
            iconPath,
            title,
            description,
            bgColor || null,
            isActive,
            userId,
            userId
        ]);

        if (!success) return next(error);

        res.status(201).json({ message: "Feature created successfully", data });
    } catch (error) {
        next(error);
    }
};

// Get all Admin Features
exports.getAllFeaturesAdmin = async (req, res, next) => {
    try {
        const { is_active } = req.query; // 'true', 'false', or ''

        const { success, data, error } = await callProcedure("getAdminFrontendFeatures", [
            is_active || ''
        ]);

        if (!success) return next(error);

        res.status(200).json({ data });
    } catch (error) {
        next(error);
    }
};

// Get all User Active Features
exports.getAllActiveFeaturesUser = async (req, res, next) => {
    try {
        const { success, data, error } = await callProcedure("getUserFrontendFeatures", []);

        if (!success) return next(error);

        res.status(200).json({ data });
    } catch (error) {
        next(error);
    }
};

// Update Feature
exports.updateFeature = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { title, description, is_active, bgColor } = req.body;

        Validation.isInteger(id, "Feature ID must be a valid integer.");
        if (title) Validation.isString(title, { min: 2 }, "Title is required.");
        if (description) Validation.isString(description, { min: 3 }, "Description must be at least 3 characters.");

        let iconPath = null;
        if (req.files && req.files.featureIcon && req.files.featureIcon.length > 0) {
            iconPath = `/frontend_features/icons/${req.files.featureIcon[0].filename}`;
        }

        const isActive = is_active !== undefined ? ((is_active === "true" || is_active === "1" || is_active === true || is_active === 1) ? 1 : 0) : null;

        const { success, data, error } = await callProcedure("updateFrontendFeature", [
            id,
            iconPath, // This could be null if no new icon is uploaded
            title || null,
            description || null,
            bgColor || null,
            isActive,
            userId
        ]);

        if (!success) return next(error);

        res.status(200).json({ message: "Feature updated successfully", data });
    } catch (error) {
        next(error);
    }
};

// Delete Feature
exports.deleteFeature = async (req, res, next) => {
    try {
        const { id } = req.params;

        Validation.isInteger(id, "Feature ID must be a valid integer.");

        const { success, data, error } = await callProcedure("deleteFrontendFeature", [id]);

        if (!success) return next(error);

        res.status(200).json({ message: "Feature deleted successfully", data });
    } catch (error) {
        next(error);
    }
};

// Toggle Active Feature
exports.toggleFeatureActive = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        Validation.isInteger(id, "Feature ID must be a valid integer.");

        const { success, data, error } = await callProcedure("toggleFrontendFeatureActive", [
            id,
            userId
        ]);

        if (!success) return next(error);

        res.status(200).json({ message: "Feature visibility toggled successfully", data });
    } catch (error) {
        next(error);
    }
};

// Update Sequence Bulk
exports.updateFeatureSequence = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { sequences } = req.body;

        if (!Array.isArray(sequences) || sequences.length === 0) {
            return res.status(400).json({ message: "Sequences array is required" });
        }

        for (const item of sequences) {
            if (item.id !== undefined && item.sequence_no !== undefined) {
                const { success, error } = await callProcedure("updateFrontendFeatureSequence", [
                    item.id,
                    item.sequence_no,
                    userId
                ]);
                if (!success) throw error;
            }
        }

        res.status(200).json({ message: "Feature sequences updated successfully" });
    } catch (error) {
        next(error);
    }
};
