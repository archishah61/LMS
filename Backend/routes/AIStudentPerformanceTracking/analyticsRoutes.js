const express = require("express");
const router = express.Router();
const analyticsController = require("../../controllers/AIStudentPerformanceTracking/analyticsController");
const analyticsTopicController = require("../../controllers/AIStudentPerformanceTracking/analyticsTopicController");

// Route to get user's skill level for a specific course
// GET /api/performance/skill-level/:userId/:courseId
router.get('/skill-level/:userId/:courseId', analyticsController.getUserSkillLevel);

// Route to get error patterns for a user in a specific course
// GET /api/performance/error-patterns/:userId/:courseId
router.get('/error-patterns/:userId/:courseId', analyticsController.getErrorPatterns);

// Route to get AI-based recommendations
// GET /api/performance/recommendations/:userId/:courseId
router.get('/recommendations/:userId/:courseId', analyticsController.getRecommendationsV2);

// Route to get detailed quiz performance for a specific module
// GET /api/performance/module-quiz/:userId/:moduleId
router.get('/module-quiz/:userId/:moduleId', analyticsController.getModuleQuizPerformance);

router.get('/topic-skill/:userId/:moduleId', analyticsTopicController.topicsSkillLevel)


module.exports = router;