const express = require("express");
const router = express.Router();
const { getCompletionStatsAcrossAllChallenges, getUserLearningOverview, getAttemptsRequiredToCompleteChallenges, getContestOverviewStats, getContestAttemptAnalytics } = require("../../controllers/reporting/ChallengeAnalyticsController"); // Adjust path as needed
const protect = require("../../middleware/protectMiddleware");

router.use(protect);

router.get("/comletion-stats-all-challenge", getCompletionStatsAcrossAllChallenges);
router.get("/learning-overview", getUserLearningOverview);
router.get("/average-attempts-per-challenge", getAttemptsRequiredToCompleteChallenges);
router.get("/contests", getContestOverviewStats);
router.get("/contests/attempts", getContestAttemptAnalytics);

module.exports = router;
