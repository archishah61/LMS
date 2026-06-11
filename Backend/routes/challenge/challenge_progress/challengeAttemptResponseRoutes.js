const express = require("express");

const router = express.Router();
const protect = require("../../../middleware/protectMiddleware");
const { getQuizAttempts, createQuizAttempt } = require("../../../controllers/challenge/challenge_progress/challengeAttemptResponse");

router.get("/", getQuizAttempts);

router.post("/create", createQuizAttempt);

module.exports = router;
