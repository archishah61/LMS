const express = require("express");
const router = express.Router();
const quizPreDefinedController = require("../../controllers/predefinedQuestions/quizPreDefinedQuestions");
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");

// Quiz Predefined Questions Routes
router.post("/assign", protect, checkPermission("Quiz Predefined Questions", "create"), quizPreDefinedController.assignPredefinedQuestionToQuiz); //✅ (Tested)
router.get("/", protect, checkPermission("Quiz Predefined Questions", "view"), quizPreDefinedController.listAllQuizPredefinedMappings);  //✅ (Tested)
router.get("/:id", protect, checkPermission("Quiz Predefined Questions", "view"), quizPreDefinedController.getQuizPredefinedMappingById); //✅ (Tested)
router.put("/update/:id", protect, checkPermission("Quiz Predefined Questions", "edit"), quizPreDefinedController.updateQuizPredefinedQuestion);  //✅ (Tested)
router.delete("/remove/:id", protect, checkPermission("Quiz Predefined Questions", "delete"), quizPreDefinedController.removePredefinedQuestionFromQuiz);  //✅ (Tested)
router.get("/quiz/:quiz_id", quizPreDefinedController.getPredefinedQuestionsByQuizId);

module.exports = router;
