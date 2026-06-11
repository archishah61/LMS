const express = require("express");
const router = express.Router();
const quizCompletionController = require("../../controllers/learning_progress/quizCompletionController");
const protect = require('../../middleware/protectMiddleware');
const upload = require("../../config/multerConfig");

// Routes for Quiz Completion
router.post("/", quizCompletionController.createQuizCompletion);
router.get("/student/:studentId", quizCompletionController.getQuizResponsesByStudentId); // Fetch by student ID
router.get("/quiz/:quizId/:userId", quizCompletionController.getQuizCompletionByQuizId); // Fetch by student ID
router.post('/submit-quiz', protect, upload.array("speakingAudio", 10), quizCompletionController.evaluateQuiz);

module.exports = router;
