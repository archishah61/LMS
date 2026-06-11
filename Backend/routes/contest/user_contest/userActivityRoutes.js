const express = require("express");
const userActivityController = require("../../../controllers/contest/user_contest/userActivityControllers");
const protect = require("../../../middleware/protectMiddleware");

const router = express.Router();

router.post("/start", protect, userActivityController.startContestActivity);
router.post("/quiz/start", protect, userActivityController.startContestQuiz);
router.post("/coding/start", protect, userActivityController.startContestCoding);
router.post("/check", protect, userActivityController.checkContestQuiz);

module.exports = router;
