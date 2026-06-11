const express = require("express");
const userChallengeController = require("../../../controllers/challenge/challenge_progress/userChallengeController");

const router = express.Router();
const protect = require("../../../middleware/protectMiddleware");
const checkFeature = require("../../../middleware/featureCheckMiddleware");

router.get("/", checkFeature("challenge_quest"), userChallengeController.getAllChallenges);

router.get("/enrolled", checkFeature("challenge_quest"), protect, userChallengeController.getUserChallengesByUserId);

router.get("/recommend-challenge", checkFeature("challenge_quest"), protect, userChallengeController.getChallengeRecommendations);

router.post("/start", checkFeature("challenge_quest"), protect, userChallengeController.startUserChallenge);

router.get("/leaderboard", checkFeature("challenge_quest"), userChallengeController.getChallengeQuestLeaderboard);

router.get("/:id", checkFeature("challenge_quest"), userChallengeController.getUserChallengeById);

module.exports = router;
