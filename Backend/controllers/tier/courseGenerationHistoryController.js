const { callProcedure } = require("../../utils/procedure/callProcedure");

/* ───────────────────────────  GET User Course Generation History  ─────────────────────────── */
const getUserCourseGenerationHistory = async (req, res, next) => {
    try {
        const userId = req.user?.id;

        const { success, data, error } = await callProcedure("getCourseHistoryByUserId", [userId]);

        if (!success) return next(error);

        res.status(200).json({ success, data });
    } catch (error) {
        next(error);
    }
};


/* ───────────────────────────  GET Course Generation History By Id  ─────────────────────────── */
const getCourseGenerationHistoryById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { success, data, error } = await callProcedure("getCourseHistoryById", [id]);

        if (!success) return next(error);

        res.status(200).json({ success, data: data[0] });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUserCourseGenerationHistory,
    getCourseGenerationHistoryById
}