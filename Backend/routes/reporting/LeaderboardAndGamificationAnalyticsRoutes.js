const express = require("express");
const router = express.Router();
const { getTopPerformersByChallengeCategory, getUsersWithHighestPoints, getTopUsersAndUserRank, getDailyChallengeRank } = require("../../controllers/reporting/LeaderboardAndGamificationAnalyticsController"); // Adjust path as needed
const protect = require("../../middleware/protectMiddleware");

router.use(protect);

// GET: Top performers by challenge category
router.get("/top-performers-by-category", getTopPerformersByChallengeCategory);

//get User with highest points 
router.get("/users-with-highest-points", getUsersWithHighestPoints);

router.get("/points-rank", getDailyChallengeRank);

router.get("/points-rank/:id", getTopUsersAndUserRank);


module.exports = router;
