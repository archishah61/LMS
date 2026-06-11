const express = require("express");
const router = express.Router();
const realWordResponseController = require("../../controllers/learning_progress/realWordResponseController");
const protect = require("../../middleware/protectMiddleware");

// ✅ Submit response to a real word quiz
router.post("/submit", protect, realWordResponseController.submitRealWordResponse);

// ✅ Get all responses by the logged-in student
router.get("/my-responses", protect, realWordResponseController.getRealWordResponsesByStudent);

// ✅ Get all responses for a specific Real Word Question (for admin/instructor view)
router.get("/question/:question_id", realWordResponseController.getResponsesByQuestionId);

module.exports = router;
