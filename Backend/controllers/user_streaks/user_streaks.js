const UserStreak = require("../../models/user_streaks/user_streaks");
const Validation = require("../../validations");      // ✅ add
const { callProcedure } = require("../../utils/procedure/callProcedure");

// ───────────────────────────────────────────────────────────────
// GET /streaks/:id?   — Fetch a user’s streak (or current user)
// ───────────────────────────────────────────────────────────────
exports.getUserStreakById = async (req, res, next) => {
    try {
        let { id } = req.params;
        id = id ? id : req.user?.id;                     // fallback to auth user

        /* ---------- VALIDATIONS ---------- */
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required."
            });
        }
        Validation.isInteger(id, "User ID must be a valid integer.");

        /* ---------- FETCH STREAK ---------- */
        const { success, data, error } = await callProcedure('GetUserStreakById', [id]);

        if (!success) {
            if (error && error.includes('NotFound')) {
                return res.status(404).json({
                    success: false,
                    message: "User streak not found."
                });
            }
            return next(error);
        }

        res.status(200).json({ success: true, userStreak: data[0] });
    } catch (error) { next(error); }
};
