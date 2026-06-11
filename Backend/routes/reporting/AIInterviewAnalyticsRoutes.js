const express = require('express');
const router = express.Router();
const protect = require('../../middleware/protectMiddleware');
const AIInterviewAnalyticsController = require('../../controllers/reporting/AIInterviewAnalyticsController');

router.use(protect);

// 1. Overall Performance Metrics
router.get('/overall-performance', AIInterviewAnalyticsController.getOverallPerformanceMetrics);

// 2. Category/Role-Based Analytics
router.get('/category-role-analytics', AIInterviewAnalyticsController.getCategoryRoleAnalytics);

// 3. Question-Level Insights
router.get('/question-level-insights', AIInterviewAnalyticsController.getQuestionLevelInsights);

// 4. Time-Based Analytics
router.get('/time-based-analytics', AIInterviewAnalyticsController.getTimeBasedAnalytics);

// 5. Response Quality Metrics
router.get('/response-quality-metrics', AIInterviewAnalyticsController.getResponseQualityMetrics);

// 6. Admin Dashboard Visualizations
router.get('/admin-dashboard-visualizations', AIInterviewAnalyticsController.getAdminDashboardVisualizations);

// 7. User-Wise Performance Summary
router.get('/user-performance-summary', AIInterviewAnalyticsController.getAllUserPerformanceSummary);

// 8. Best & Worst Performers by Category
router.get('/top-bottom-users-by-category', AIInterviewAnalyticsController.getTopBottomUsersByCategory);

// 9. Overall Top & Bottom Performers
router.get('/overall-top-bottom-performers', AIInterviewAnalyticsController.getOverallTopBottomPerformers);

module.exports = router; 