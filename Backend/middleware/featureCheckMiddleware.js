// middleware/checkFeature.js

const { FeatureStatus } = require("../models/masters/featureStatus");

const checkFeature = (featureName) => {
    return async (req, res, next) => {
        try {
            if (!featureName) {
                return res.status(400).json({ message: "Feature name is required in middleware." });
            }

            // Fetch feature status
            const feature = await FeatureStatus.findOne({
                where: { name: featureName }
            });

            // If feature not found
            if (!feature) {
                return res.status(404).json({
                    success: false,
                    message: `Feature '${featureName}' not found.`,
                });
            }

            // If feature is disabled
            if (!feature.is_active) {
                return res.status(403).json({
                    success: false,
                    message: `Feature '${featureName}' is currently disabled.`,
                });
            }

            // All good → continue to controller
            next();

        } catch (error) {
            console.error("Feature check failed:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error.",
            });
        }
    };
};

module.exports = checkFeature;
