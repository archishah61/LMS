const { callProcedure } = require("../../utils/procedure/callProcedure");
const { callProcedureChallenge } = require("../../utils/procedure/callProcedureChallenge");
const Validation = require("../../validations");

/**
 * 1️⃣ CREATE Feature Interest
 */
const createFeatureInterest = async (req, res, next) => {
    try {
        const { user_id, feature_id, email } = req.body;

        // Validate input
        Validation.isInteger(feature_id, { min: 1 }, "Feature ID must be a positive integer.");

        if (email) {
            Validation.isString(email, { min: 5, max: 255 }, "Email must be a valid string.");
            Validation.isEmail(email, "Email must be valid.");
        }

        const { success, data, error } = await callProcedure("createFeatureInterest", [
            user_id || null,
            feature_id,
            email || null,
        ]);

        if (!success) return next(error);

        res.status(201).json({
            success,
            message: "Feature interest created successfully",
            data: data[0],
        });
    } catch (err) {
        next(err);
    }
};


/**
 * 2️⃣ DELETE Feature Interest
 */
const deleteFeatureInterest = async (req, res, next) => {
    try {
        const { id } = req.params;
        Validation.isInteger(id, { min: 1 }, "Interest ID must be a valid number.");

        const { success, error } = await callProcedure("deleteFeatureInterest", [id]);

        if (!success) return next(error);

        res.status(200).json({
            success: true,
            message: "Feature interest deleted successfully",
        });
    } catch (err) {
        next(err);
    }
};


/**
 * 3️⃣ GET ALL Feature Interests with Pagination + Search
 */
const getAllFeatureInterests = async (req, res, next) => {
    try {
        const {
            search_term = "",
            feature_filter = "all",
            limit = "ALL",
            offset = 0,
        } = req.query;

        const parsedLimit = limit === "ALL" ? 0 : parseInt(limit);
        const parsedOffset = parseInt(offset) || 0;

        if (search_term) {
            Validation.isString(search_term, { min: 0, max: 255 }, "Search term must be a string.");
        }

        if (feature_filter && feature_filter !== "all") {
            Validation.isString(feature_filter, { min: 0, max: 255 }, "Feature filter must be a string.");
        }

        if (parsedLimit !== 0) {
            Validation.isNumber(parsedLimit, { min: 1, max: 100 }, "Limit must be 1-100 or 'ALL'.");
        }

        Validation.isNumber(parsedOffset, { min: 0 }, "Offset must be a non-negative number.");

        // Call procedure
        const { success, data, error } = await callProcedureChallenge(
            "getAllFeatureInterestsWithPagination",
            [search_term, feature_filter, parsedLimit, parsedOffset]
        );

        if (!success) return next(error);

        // The procedure returns two result sets: [totalCount, data]
        const totalCount = data[0][0]?.total || 0;
        const interests = Object.values(data[1]) || [];

        res.status(200).json({
            success: true,
            data: interests,
            total: totalCount,
            page: Math.floor(parsedOffset / (parsedLimit || 1)) + 1,
            totalPages: parsedLimit ? Math.ceil(totalCount / parsedLimit) : 1
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createFeatureInterest,
    deleteFeatureInterest,
    getAllFeatureInterests,
};
