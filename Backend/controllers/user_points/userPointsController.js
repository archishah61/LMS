const UserPoints = require("../../models/user_points/user_points");
const Validation = require("../../validations");          // ✅ add
const { callProcedure } = require("../../utils/procedure/callProcedure");
const { callProcedureChallenge } = require("../../utils/procedure/callProcedureChallenge");

// ───────────────────────────────────────────────────────────────
// GET  /points/:id?   — Fetch a user’s points (or current user)
// ───────────────────────────────────────────────────────────────
exports.getUserPointsById = async (req, res, next) => {
    try {
        let { id } = req.params;
        id = id ? id : req.user?.id;
        const {
            limit,
            offset,
            time_filter = 'all',
            start_date = null,
            end_date = null
        } = req.query;

        /* ---------- VALIDATION ---------- */
        Validation.isInteger(id, "User ID must be a valid integer.");

        // If time_filter is custom, start_date and end_date might be passed
        // We can pass them as null if not present

        if (limit || offset || (time_filter && time_filter != 'all')) {
            const { success, data, error } = await callProcedureChallenge('GetUserPointsByIdPagination', [
                id,
                limit,
                offset,
                time_filter,
                start_date || null,
                end_date || null
            ]);

            if (!success) {
                return next(error);
            }

            res.status(200).json({ success: true, userPoints: data[0]['0'], transactions: Object.values(data[1]), total: data[2][0].total });
        } else {
            const { success, data, error } = await callProcedureChallenge('GetUserPointsById', [id]);

            if (!success) {
                return next(error);
            }

            res.status(200).json({ success: true, userPoints: data[0]['0'], transactions: Object.values(data[1]) });
        }

    } catch (error) { next(error); }
};

// ───────────────────────────────────────────────────────────────
// PATCH /points/:id?  — Add / subtract points for a user
// body: { points: <int>, is_add: <bool> }
// ───────────────────────────────────────────────────────────────
exports.updateUserPointsById = async (req, res, next) => {
    try {
        let { id } = req.params;
        id = id ? id : req.user?.id;

        /* ---------- BODY DESTRUCTURING ---------- */
        let { points, is_add, source, message } = req.body;

        /* ---------- VALIDATIONS ---------- */
        Validation.isInteger(id, "User ID must be a valid integer.");
        Validation.isInteger(points, "Points must be a valid integer.");
        Validation.checkIntegerMinMax(points, { min: 1 },
            "Points must be at least 1.");                      // no zero / negatives
        Validation.isBoolean(is_add, "is_add must be true or false.");
        Validation.isString(source, "source must be a valid String.");
        Validation.isString(message, "message must be a valid String.");

        const { success, error } = await callProcedure('UpdateUserPointsById', [
            id,
            points,
            is_add,
            source,
            message
        ]);

        if (!success) {
            return next(error);
        }

        res.status(200).json({
            success: true,
            message: "User points updated successfully.",
            // userPoints: data[0]
        });
    } catch (error) { next(error); }
};
