const express = require("express");
const router = express.Router();
const performanceFeedbackController = require("../../controllers/AIStudentPerformanceTracking/performanceFeedbackController");
const protect = require("../../middleware/protectMiddleware");

// Route to get all feedback for a user
router.get('/user-feedback/:userId', protect, performanceFeedbackController.getUserFeedback);

// Route to get specific feedback by ID
router.get('/feedback/:feedbackId', protect,performanceFeedbackController.getFeedbackById);

// Route to get feedback history for a specific module
router.get('/feedback-history/:userId/:moduleId', protect,performanceFeedbackController.getModuleFeedbackHistory);

// Route to delete feedback (soft delete)
router.delete('/feedback/:feedbackId', protect, performanceFeedbackController.deleteFeedback);

module.exports = router;
