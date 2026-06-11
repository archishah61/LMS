const express = require("express");
const router = express.Router();
const quizResponseController = require("../../controllers/learning_progress/quizResponseController");

// Routes for Quiz Responses
router.post("/", quizResponseController.createQuizResponse);

module.exports = router;
