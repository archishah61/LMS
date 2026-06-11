/*********************************************************************
 *  reviewsController.js
 *  ──────────────────────────────────────────────────────────────────
 *  Adds centralised Validation checks for every input coming
 *  from req.body / req.params before we hit the stored procedures.
 *********************************************************************/

const Review = require("../../models/reviews/reviewsModel");
const Course = require("../../models/course_management/course");
const User = require("../../models/auth/user");

const { callProcedure } = require("../../utils/procedure/callProcedure");
// 👉 adjust the path below if your validation helper lives elsewhere
const Validation = require("../../validations");


// -------------------------------------------------- CREATE REVIEW
exports.createReview = async (req, res, next) => {
  try {
    let { course_id, user_id, review, rating } = req.body;

    if (isNaN(course_id)) {
      const course = await Course.findOne({ where: { public_hash: course_id } });
      if (!course) return res.status(404).json({ error: "Course not found" });
      course_id = course.id;
    }

    /* ---------- VALIDATION SECTION ---------- */
    Validation.isInteger(course_id, "Course ID must be a positive integer.");
    Validation.isInteger(user_id, "User ID must be a positive integer.");
    Validation.checkIntegerMinMax(rating, { min: 1, max: 5 }, "Rating must be between 1 and 5.");

    if (review !== undefined && review !== null) {          // review is optional (allowNull: true)
      Validation.isString(review, { min: 1, max: 1000 },    // keep TEXT field sensible
        "Review text must be 1‑1000 characters long.");
    }
    /* ---------------------------------------- */

    const { success, data, error } = await callProcedure(
      "createReview",
      [course_id, user_id, review, rating]
    );

    if (!success && error) return next(error);
    if (!success || !data || data.length === 0) {
      return res.status(400).json({ error: error || "Unexpected error while creating the review." });
    }

    res.status(201).json({
      message: "Review created successfully",
      review: data[0],
    });
  } catch (err) {
    next(err);
  }
};



// -------------------------------------------------- GET ALL REVIEWS
exports.getAllReviews = async (req, res, next) => {
  try {
    const { course_id, rating, search_term, page = 1, limit = 'all' } = req.query

    const role = req.user?.role;
    const id = req.user?.id;

    // Convert and handle parameters properly
    const courseId = course_id ? Number.parseInt(course_id, 10) : null
    const ratingFilter = rating === 'all' ? 0 : Number.parseInt(rating, 10)
    const searchTerm = search_term || null
    const pageNum = Number.parseInt(page, 10) || 1
    const limitNum = limit === 'all' ? 'all' : Number.parseInt(limit, 10) || 10;

    if (role === 'student') {
      const allReviews = await callProcedure("getAllReviews", []);

      if (allReviews.error) {
        return next(allReviews.error);
      }

      return res.status(200).json({
        message: "Reviews fetched successfully",
        reviews: allReviews.data || [],
      })
    }

    const { success, data, error } = await callProcedure("getAllAdminReviews", [
      courseId,
      ratingFilter,
      searchTerm,
      pageNum,
      limit === 'all' ? 0 : limitNum,
      role || null,
      id || null,
      limit === 'all' || false
    ])

    if (!success && error) {
      console.error("Procedure error:", error)
      return next(error)
    }

    // Extract pagination info from first row if data exists
    let paginationInfo = {
      total_count: 0,
      current_page: pageNum,
      total_pages: 0,
      has_next: false,
      has_prev: false,
    }

    if (data && data.length > 0) {
      const firstRow = data[0]
      paginationInfo = {
        total_count: firstRow.total_count || 0,
        current_page: firstRow.current_page || pageNum,
        total_pages: firstRow.total_pages || 0,
        has_next: (firstRow.current_page || pageNum) < (firstRow.total_pages || 0),
        has_prev: (firstRow.current_page || pageNum) > 1,
      }
    }

    return res.status(200).json({
      message: "Reviews fetched successfully",
      reviews: data || [],
      pagination: paginationInfo,
    })
  } catch (err) {
    console.error("Controller error:", err)
    next(err)
  }
}


// -------------------------------------------------- GET REVIEW BY ID
exports.getReviewById = async (req, res, next) => {
  try {
    const { id } = req.params;

    /* ---------- VALIDATION ---------- */
    Validation.isInteger(id, "Review ID must be a positive integer.");
    /* -------------------------------- */

    const { success, data, error } = await callProcedure("getReviewById", [id]);

    if (!success && error) return next(error);
    if (!success || !data || data.length === 0) {
      return res.status(404).json({ error: error || "Review not found." });
    }

    res.status(200).json({ review: data[0] });
  } catch (err) {
    next(err);
  }
};


// -------------------------------------------------- GET USER REVIEW
exports.getUserReview = async (req, res, next) => {
  try {
    const { courseId, userId } = req.query;

    let finalCourseId = courseId;
    if (isNaN(courseId)) {
        const course = await Course.findOne({ where: { public_hash: courseId } });
        if (!course) return res.status(404).json({ message: "Course not found" });
        finalCourseId = course.id;
    }

    const { success, data, error } = await callProcedure("getUserReview", [finalCourseId, userId]);

    if (!success && error) return next(error);

    if (!data || data.length === 0) {
      // It's acceptable to not have a review
      return res.status(200).json({ review: null });
    }

    res.status(200).json({ review: data[0] });
  } catch (err) {
    next(err);
  }
};



// ---------------------------------------------- GET REVIEWS BY COURSE
exports.getReviewsByCourseId = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10, exclude_user_id } = req.query;

    Validation.isString(courseId, "Course ID hash must be a string.");

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const excludeUserId = exclude_user_id ? parseInt(exclude_user_id, 10) : null;

    const { success, data, error } = await callProcedure("getReviewsByCourseId", [
      courseId,
      pageNum,
      limitNum,
      excludeUserId
    ]);

    if (!success && error) return next(error);

    let reviews = data || [];
    let pagination = {
      total_count: 0,
      current_page: pageNum,
      total_pages: 0,
      average_rating: 0
    };

    if (reviews.length > 0) {
      const first = reviews[0];
      pagination = {
        total_count: first.total_count,
        current_page: first.current_page,
        total_pages: first.total_pages,
        average_rating: first.average_rating
      };
    }

    res.status(200).json({
      reviews,
      pagination
    });
  } catch (err) {
    next(err);
  }
};



// -------------------------------------------------- UPDATE REVIEW
exports.updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { review, rating, user_id } = req.body;

    /* ---------- VALIDATION ---------- */
    Validation.isInteger(id, "Review ID must be a positive integer.");
    Validation.isInteger(user_id, "User ID must be a positive integer.");
    Validation.checkIntegerMinMax(rating, { min: 1, max: 5 }, "Rating must be between 1 and 5.");
    if (review !== undefined && review !== null) {
      Validation.isString(review, { min: 1, max: 1000 },
        "Review text must be 1‑1000 characters long.");
    }
    /* -------------------------------- */

    const { success, data, error } = await callProcedure(
      "updateReviewById",
      [id, review, rating, user_id]
    );

    if (!success && error) return next(error);
    if (!success) {
      return res.status(400).json({ message: error || "Failed to update review" });
    }

    res.status(200).json({ message: "Review updated successfully", review: data[0] });
  } catch (err) {
    next(err);
  }
};



// -------------------------------------------------- DELETE REVIEW
exports.deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    /* ---------- VALIDATION ---------- */
    Validation.isInteger(id, { min: 1 }, "Review ID must be a positive integer.");
    /* -------------------------------- */

    const { success, data, error } = await callProcedure("deleteReviewById", [id]);

    if (!success && error) return next(error);

    if (!success || !data || !data[0] || data[0].message !== "Review deleted successfully") {
      return res.status(404).json({
        message: error || "Review not found or error during deletion",
      });
    }

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (err) {
    next(err);
  }
};
