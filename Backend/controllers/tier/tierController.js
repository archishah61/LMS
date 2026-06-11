const { callProcedure } = require("../../utils/procedure/callProcedure");
const { callProcedureChallenge } = require("../../utils/procedure/callProcedureChallenge");
const Validation = require("../../validations"); // adjust path if needed


/* ───────────────────────────  CREATE TIER  ─────────────────────────── */
const createTier = async (req, res, next) => {
    try {
        const {
            name,
            price,
            max_sessions,
            max_modules_per_session,
            max_topics_per_module,
            max_assignments_per_module,
            max_quizzes_per_module,
            difficulty_level_id
        } = req.body;

        const userId = req.user?.id;

        /* ---------- VALIDATION ---------- */
        Validation.isEnum(name, ["basic", "standard", "premium"], "Tier name must be one of: basic, standard, premium.");
        Validation.isDecimal(price, "Price must be a valid decimal number.");
        if (max_sessions !== undefined && max_sessions !== null) Validation.isInteger(max_sessions);
        if (max_modules_per_session !== undefined && max_modules_per_session !== null) Validation.isInteger(max_modules_per_session);
        if (max_topics_per_module !== undefined && max_topics_per_module !== null) Validation.isInteger(max_topics_per_module);
        if (max_assignments_per_module !== undefined && max_assignments_per_module !== null) Validation.isInteger(max_assignments_per_module);
        if (max_quizzes_per_module !== undefined && max_quizzes_per_module !== null) Validation.isInteger(max_quizzes_per_module);
        /* --------------------------------- */

        const { success, data, error } = await callProcedure("createTier", [
            name,
            price,
            max_sessions,
            max_modules_per_session,
            max_topics_per_module,
            max_assignments_per_module,
            max_quizzes_per_module,
            userId,
            userId,
            difficulty_level_id || null,
        ]);

        if (!success) return next(error);

        res.status(201).json({
            success,
            message: "Tier created successfully",
            data: data[0],
        });
    } catch (err) {
        next(err);
    }
};


/* ───────────────────────────  UPDATE TIER  ─────────────────────────── */
const updateTier = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            name,
            price,
            max_sessions,
            max_modules_per_session,
            max_topics_per_module,
            max_assignments_per_module,
            max_quizzes_per_module,
            difficulty_level_id
        } = req.body;

        const userId = req.user?.id;

        /* ---------- VALIDATION ---------- */
        Validation.isInteger(id, "Tier ID must be a positive integer.");
        Validation.isEnum(name, ["basic", "standard", "premium"], "Tier name must be one of: basic, standard, premium.");
        Validation.isDecimal(price, "Price must be a valid decimal number.");
        if (max_sessions !== undefined && max_sessions !== null) Validation.isInteger(max_sessions);
        if (max_modules_per_session !== undefined && max_modules_per_session !== null) Validation.isInteger(max_modules_per_session);
        if (max_topics_per_module !== undefined && max_topics_per_module !== null) Validation.isInteger(max_topics_per_module);
        if (max_assignments_per_module !== undefined && max_assignments_per_module !== null) Validation.isInteger(max_assignments_per_module);
        if (max_quizzes_per_module !== undefined && max_quizzes_per_module !== null) Validation.isInteger(max_quizzes_per_module);
        /* --------------------------------- */

        const { success, data, error } = await callProcedure("updateTier", [
            id,
            name,
            price,
            max_sessions,
            max_modules_per_session,
            max_topics_per_module,
            max_assignments_per_module,
            max_quizzes_per_module,
            userId,
            difficulty_level_id || null,
        ]);

        if (!success) return next(error);

        res.status(200).json({
            success,
            message: "Tier updated successfully",
            data: data[0],
        });
    } catch (err) {
        next(err);
    }
};


/* ───────────────────────────  GET ALL TIERS  ─────────────────────────── */
const getAllTiers = async (req, res, next) => {
    try {
        const {
            search_term = "",
            sortBy,
            type,
            limit = "ALL",
            offset = "0",
        } = req.query;

        /* ---------- VALIDATION ---------- */
        if (limit !== "ALL") {
            Validation.isInteger(limit, "Limit must be a positive integer or 'ALL'.");
        }
        Validation.isInteger(offset, "Offset must be a non-negative integer.");
        if (search_term) Validation.isString(search_term, { min: 1, max: 255 });
        /* --------------------------------- */

        const parsedLimit = limit === "ALL" ? "ALL" : Number(limit);
        const parsedOffset = Number(offset);

        const { success, data, error } = await callProcedureChallenge("getAllTiers", [
            search_term || null,
            sortBy || null,
            type || null,
            parsedLimit,
            parsedOffset,
        ]);

        if (!success) return next(error);

        res.status(200).json({
            success,
            data: {
                total_count: data[0]["0"].total_count,
                tiers: Object.values(data[1]),
            },
        });
    } catch (err) {
        next(err);
    }
};


/* ───────────────────────────  GET ALL ACTIVE TIERS  ─────────────────────────── */
const getAllActiveTiers = async (req, res, next) => {
    try {
        const { success, data, error } = await callProcedure("getAllActiveTiers");

        if (!success) return next(error);

        res.status(200).json({ success, data });
    } catch (err) {
        next(err);
    }
};


/* ───────────────────────────  TOGGLE TIER STATUS  ─────────────────────────── */
const toggleTierStatus = async (req, res, next) => {
    try {
        const { id } = req.params;

        const userId = req.user?.id;

        Validation.isInteger(id, "Tier ID must be a positive integer.");

        const { success, data, error } = await callProcedure("toggleTierStatus", [id, userId]);

        if (!success) return next(error);

        res.status(200).json({
            success: true,
            message: "Tier status toggled successfully",
            data: data[0],
        });
    } catch (err) {
        next(err);
    }
};


/* ───────────────────────────  DELETE TIER  ─────────────────────────── */
const deleteTier = async (req, res, next) => {
    try {
        const { id } = req.params;

        Validation.isInteger(id, "Tier ID must be a positive integer.");

        const { success, error } = await callProcedure("deleteTier", [id]);

        if (!success) return next(error);

        res.status(200).json({
            success,
            message: "Tier deleted successfully",
        });
    } catch (err) {
        next(err);
    }
};


/* ───────────────────────────  PURCHASE TIER  ─────────────────────────── */
const purchaseCourseGeneration = async (req, res, next) => {
    try {
        const {
            tier_id,
            course_generation_history_id,
            amount,
            currency,
            payment_method,
            transaction_id,
            reference_id,
            status,
            notes,
            payment_gateway,
            gateway_response,
        } = req.body;

        const user_id = req.user?.id;

        // ✅ Validations
        Validation.isInteger(user_id, "Invalid user ID");
        Validation.isInteger(tier_id, "Invalid tier ID");
        Validation.isNumber(amount, { min: 0 }, "Invalid amount");
        Validation.isEnum(currency, ["INR", "USD"], "Invalid currency");
        Validation.isString(payment_method, { min: 1 }, "Invalid payment method");
        Validation.isString(transaction_id, { min: 1 }, "Invalid transaction ID");
        Validation.isEnum(status, ['pending', 'completed', 'failed', 'refunded'], "Invalid status");

        // ✅ Prepare params for stored procedure
        const params = [
            user_id,
            tier_id,
            course_generation_history_id,
            amount,
            currency,
            payment_method,
            transaction_id,
            reference_id || null,
            status,
            notes || null,
            payment_gateway || null,
            gateway_response ? JSON.stringify(gateway_response) : null,
            user_id,
        ];

        const { success, data, error } = await callProcedure("purchaseCourseGeneration", params);

        if (!success) {
            return next(error);
        }

        res.status(201).json({
            success,
            message: "Course generation payment successful",
            purchase: data[0],
        });
    } catch (error) {
        next(error);
    }
};

/* ───────────────────────────  EXPORTS  ─────────────────────────── */
module.exports = {
    createTier,
    updateTier,
    getAllTiers,
    getAllActiveTiers,
    toggleTierStatus,
    deleteTier,
    purchaseCourseGeneration
};
