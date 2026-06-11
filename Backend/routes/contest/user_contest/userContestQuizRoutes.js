const express = require("express");
const userContestQuizController = require("../../../controllers/contest/user_contest/userContestQuizControllers");
const protect = require("../../../middleware/protectMiddleware");

const router = express.Router();

router.post("/attempt", protect, userContestQuizController.saveUserContestQuizAttempt);
router.get("/attempts/:quiz_id", protect, userContestQuizController.getUserContestQuizAttempts);

module.exports = router;
