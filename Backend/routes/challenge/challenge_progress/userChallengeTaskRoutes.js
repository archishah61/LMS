const express = require("express");
const userChallengeTaskController = require("../../../controllers/challenge/challenge_progress/userChallengeTaskController");
const protect = require("../../../middleware/protectMiddleware");

const router = express.Router();

router.post("/start", protect, userChallengeTaskController.startUserChallengeTask);
router.post("/check", protect, userChallengeTaskController.checkUserChallengeTaskAnswers);

module.exports = router;
