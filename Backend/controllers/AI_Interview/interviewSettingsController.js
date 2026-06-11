const { callProcedure } = require("../../utils/procedure/callProcedure");

exports.getFeatureSettingsAdmin = async (req, res, next) => {
    try {
        const { success, data, error } = await callProcedure("getFeatureSettings", [null]);
        if (!success) return next(error);

        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        next(error);
    }
};

exports.getFeatureSettingsUser = async (req, res, next) => {
    try {
        const { type } = req.query;

        const { success, data, error } = await callProcedure("getFeatureSettings", [type || "interview"]);
        if (!success) return next(error);

        res.status(200).json({
            success: true,
            limit: data[0]?.limit || 3
        });
    } catch (error) {
        next(error);
    }
};

exports.updateFeatureSettings = async (req, res, next) => {
    try {
        const { type, limit } = req.body;
        const updated_by = req.user?.id;
        const updated_by_type = req.user?.role === 'admin' ? 'admin' : 'partner';

        if (limit === undefined) {
            return res.status(400).json({ success: false, message: "Limit is required" });
        }

        const { success, data, error } = await callProcedure("updateFeatureSettings", [
            type,
            limit,
            updated_by,
            updated_by_type
        ]);

        if (!success) return next(error);

        res.status(200).json({
            success: true,
            message: "Interview settings updated successfully",
            data: data[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.getUserDailyFeatureCount = async (req, res, next) => {
    try {
        const { type } = req.query;
        const user_id = req.user?.id;

        if (!user_id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { success, data, error } = await callProcedure("getUserDailyFeatureCount", [user_id, type || "interview"]);
        if (!success) return next(error);

        // Fetch the limit too to return it together for the user side functionality
        const { success: sLimit, data: dLimit } = await callProcedure("getFeatureSettings", [type || "interview"]);

        res.status(200).json({
            success: true,
            count: data[0]?.count || 0,
            firstAttempt: data[0]?.first_attempt || null,
            limit: dLimit[0]?.limit || 3
        });
    } catch (error) {
        next(error);
    }
};
