const express = require("express");
const reviewController = require("../../controllers/reviews/reviewController");
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");

const router = express.Router();

// Review routes
router.post("/create", protect, checkPermission("Reviews", "create"), reviewController.createReview);
router.get("/", protect, checkPermission("Reviews", "view"), reviewController.getAllReviews);
router.get("/user-review", protect, reviewController.getUserReview);
router.get("/:id", protect, checkPermission("Reviews", "view"), reviewController.getReviewById);
router.get("/course/:courseId", reviewController.getReviewsByCourseId);
router.put("/update/:id", protect, checkPermission("Reviews", "edit"), reviewController.updateReview);
router.delete("/delete/:id", protect, checkPermission("Reviews", "delete"), reviewController.deleteReview);
module.exports = router;
