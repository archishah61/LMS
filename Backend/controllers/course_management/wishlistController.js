// controllers/wishlistController.js
const { callProcedure } = require("../../utils/procedure/callProcedure");
const { callProcedureChallenge } = require("../../utils/procedure/callProcedureChallenge");
const Validation = require("../../validations"); // ⬅️ NEW

// ------------------------------------------------------------------
// Add course to Wishlist
// ------------------------------------------------------------------
exports.addToWishlist = async (req, res, next) => {
  try {
    const { course_id, user_id } = req.body;

    // ---------- validation --------------------------------------------------
    Validation.isInteger(course_id, "Course ID must be an integer.");
    Validation.isInteger(user_id, "User ID must be an integer.");
    // -----------------------------------------------------------------------

    const { success, data, error } = await callProcedure("addToWishlist", [
      course_id,
      user_id,
    ]);

    if (!success && error) return next(error);

    if (!success || !data || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: error || "Unexpected error occurred while adding to wishlist.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Course added to wishlist successfully",
      data: data[0],       // newly added item
    });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// Remove course from Wishlist
// ------------------------------------------------------------------
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const { course_id, user_id } = req.body;

    Validation.isInteger(course_id, "Course ID must be an integer.");
    Validation.isInteger(user_id, "User ID must be an integer.");
    const { success, data, error } = await callProcedure("removeFromWishlist", [
      course_id,
      user_id,
    ]);

    if (!success && error) return next(error);

    if (!success || !data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: error || "Failed to remove course from wishlist",
      });
    }

    return res.status(200).json({
      success: true,
      message: data[0].message || "Course removed from wishlist",
    });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// Get Wishlist for a User
// ------------------------------------------------------------------
exports.getWishlist = async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const { limit = "all", offset = 0 } = req.query;

    const parsedLimit = limit === "all" ? "all" : Number(limit);
    const parsedOffset = Number(offset);

    Validation.isInteger(user_id, "User ID must be an integer.");
    const { success, data, error } = await callProcedureChallenge("getWishlistByUserId", [
      user_id,
      limit === "all" ? 0 : parsedLimit,
      parsedOffset,
      limit === "all" || false
    ]);

    if (!success && error) return next(error);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: error || "Could not fetch wishlist",
      });
    }

    const meta = data[0][0];

    return res.status(200).json({
      success: true,
      data: Object.values(data[1]),
      pagination: { totalCount: meta?.total_count, totalPages: limit === "all" ? 1 : Math.ceil(meta?.total_count / parsedLimit) }
    });
  } catch (error) {
    next(error);
  }
};
