const { callProcedure } = require("../../utils/procedure/callProcedure");
const sendMail = require('../../config/mailer');
const Validation = require("../../validations");
const { callProcedureChallenge } = require("../../utils/procedure/callProcedureChallenge");

exports.createSubscribe = async (req, res, next) => {
    try {
        const { email } = req.body;

        // Validate email
        Validation.isEmail(email, "Email is required.");

        const { success, data, error } = await callProcedure("createSubscribe", [email]);

        if (!success && error) return next(error);
        if (!success || !data || !data[0]) {
            return res.status(400).json({ message: error || "Unexpected error." });
        }

        const newSubscription = data[0];

        // Send welcome email (non-blocking failure: log but don't fail request)
        try {
            await sendMail(
                email,
                'Welcome to Queekies Newsletter!',
                'Thank you for subscribing to Queekies.',
                `<h2>Thank you for subscribing!</h2>
                <p>You’ll now receive updates from Queekies.</p>
                <br />
                <p>If this was a mistake, please ignore this email.</p>`
            );
        } catch (mailErr) {
            console.warn('Email send failed for subscription:', mailErr.message);
        }

        res.status(201).json({
            message: "Subscription created successfully.",
            data: newSubscription,
        });
    } catch (error) {
        next(error);
    }
};

// Get all subscriptions
exports.getAllSubscribes = async (req, res, next) => {
    try {
        const {
            search_term = "",
            status,
            limit = "all",
            offset = "0",
        } = req.query;

        /* ---------- VALIDATION ---------- */
        if (limit !== "all" && limit !== "ALL") {
            Validation.isInteger(limit, "Limit must be a positive integer or 'all'.");
        }

        Validation.isInteger(offset, "Offset must be a non-negative integer.");
        if (search_term) Validation.isString(search_term, { min: 1, max: 255 });
        /* --------------------------------- */

        const parsedLimit = limit === "all" ? "all" : Number(limit);
        const parsedOffset = Number(offset);

        const { success, data, error } = await callProcedureChallenge("getAllSubscribes", [
            search_term,
            status || null,
            limit === "all" ? 0 : parsedLimit,
            parsedOffset,
            limit === "all" || false
        ]);

        if (!success && error) return next(error);
        if (!success || !data) {
            return res.status(400).json({ message: error || "Unexpected error." });
        }

        res.status(200).json({ totalCount: data[0][0].total_count, data: Object.values(data[1]) });
    } catch (error) {
        next(error);
    }
};

exports.updateSubscribeStatus = async (req, res, next) => {
    try {
        const { id } = req.params;

        Validation.isInteger(id, { min: 1 }, "Subscription ID must be a positive integer.");

        const { success, data, error } = await callProcedure("toggleSubscribeStatus", [id]);

        if (!success && error) return next(error);
        if (!success || !data || !data[0]) {
            return res.status(404).json({ message: "Subscription not found." });
        }

        const subscription = data[0];
        res.status(200).json({
            message: `Subscription status changed to ${subscription.status}.`,
            data: subscription,
        });
    } catch (error) {
        next(error);
    }
};
