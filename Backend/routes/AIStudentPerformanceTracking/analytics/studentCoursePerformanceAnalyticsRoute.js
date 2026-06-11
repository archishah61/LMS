const express = require("express");
const router = express.Router();
const protect = require("../../../middleware/protectMiddleware");
const {
    getCourseEnrollmentAnalytics,
    getCourseModuleAnalytics,
    getCourseTopicStrengthAnalytics,
    getAllCoursesModuleAnalytics,
    getCourseErrorAnalyticsAverage,
    getAllCoursesTopicStrengthAnalytics,
    getAllCoursesErrorAnalyticsAverage
} = require("../../../controllers/AIStudentPerformanceTracking/analytics/coursePerformanceAnalytics");



router.get('/course-performance/:courseId', protect, getCourseEnrollmentAnalytics)
router.get('/course-performance/:courseId/module-analytics', protect, getCourseModuleAnalytics)
router.get('/course-performance/:courseId/topic-strength', protect, getCourseTopicStrengthAnalytics)
router.get('/course-performance/:courseId/error-analytics-avg', protect, getCourseErrorAnalyticsAverage)
router.get('/all-course-performance/module-analytics', protect, getAllCoursesModuleAnalytics)
router.get('/all-course-performance/topic-strength', protect, getAllCoursesTopicStrengthAnalytics)
router.get('/all-course-performance/error-analytics-avg', protect, getAllCoursesErrorAnalyticsAverage)

module.exports = router;