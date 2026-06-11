const express = require("express");
const router = express.Router();
const userChallengeController = require("../../controllers/challenge/challengeController");
const UserPointsController = require("../../controllers/user_points/userPointsController");
const UserStreakController = require("../../controllers/user_streaks/user_streaks");

const protect = require("../../middleware/protectMiddleware");
const checkFeature = require("../../middleware/featureCheckMiddleware");

router.get("/start/:id", checkFeature("daily_challenge"), protect, userChallengeController.startChallengeById);

router.get("/complete-dates", checkFeature("daily_challenge"), protect, userChallengeController.getCompleteDatesById)

router.get("/streak", protect, UserStreakController.getUserStreakById);

router.get("/points", protect, UserPointsController.getUserPointsById);

router.put("/points", protect, UserPointsController.updateUserPointsById);

router.post("/check", checkFeature("daily_challenge"), protect, userChallengeController.checkChallenge);

router.post("/assign", checkFeature("daily_challenge"), protect, userChallengeController.assignChallengeToUser);

router.get("/check-assigned", checkFeature("daily_challenge"), protect, userChallengeController.isChallengeAssignedToday);

router.get("/", checkFeature("daily_challenge"), protect, userChallengeController.getChallengeByDate);

router.get("/:id", checkFeature("daily_challenge"), protect, userChallengeController.getUserChallengeById);

module.exports = router;
