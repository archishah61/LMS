const express = require("express");
const userChallengePhaseController = require("../../../controllers/challenge/challenge_progress/userChallengePhaseController");
const protect = require("../../../middleware/protectMiddleware");

const router = express.Router();

router.post("/start", protect, userChallengePhaseController.startUserChallengePhase);

module.exports = router;
