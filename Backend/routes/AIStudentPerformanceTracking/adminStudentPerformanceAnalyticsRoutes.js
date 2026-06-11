const express = require('express');
const adminStudentPerformanceAnalyticsController = require('../../controllers/AIStudentPerformanceTracking/adminStudentPerformanceAnalyticsController');
const protect = require('../../middleware/protectMiddleware');

const router = express.Router();

// All routes below require authentication
// router.use(protect);

// Get available versions for a student
router.get('/student/:studentId/versions', adminStudentPerformanceAnalyticsController.getAvailableVersions);

// Get student performance analytics
router.get('/student/:studentId', adminStudentPerformanceAnalyticsController.getStudentAnalytics);

// Get version comparison for a student's performance
router.get('/student/:studentId/version-comparison', adminStudentPerformanceAnalyticsController.getVersionComparison);

// Get module completion status
router.get('/student/:studentId/modules', adminStudentPerformanceAnalyticsController.getModuleCompletion);

// Get topic strength analysis
router.get('/student/:studentId/topics', adminStudentPerformanceAnalyticsController.getTopicStrengthAnalysis);

// Get detailed time spent analysis
router.get('/student/:studentId/time-spent', adminStudentPerformanceAnalyticsController.getTimeSpentAnalysis);

// Get error analysis and improvement suggestions
router.get('/student/:studentId/error-analysis', adminStudentPerformanceAnalyticsController.getErrorAnalysis);

module.exports = router;
