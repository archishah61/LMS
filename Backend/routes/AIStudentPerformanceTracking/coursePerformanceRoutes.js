const express = require("express");
const { coursePerformance } = require("../../controllers/AIStudentPerformanceTracking/coursePerformanceController");
const router = express.Router();
const protect = require("../../middleware/protectMiddleware");

router.get('/course-performance/:userId/:courseId', protect, coursePerformance)

module.exports = router;