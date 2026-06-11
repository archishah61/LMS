const express = require("express");
const summarizePassageResponseController = require("../../controllers/learning_progress/summaryPassageResponseController");
const protect = require("../../middleware/protectMiddleware"); // For student/admin auth

const router = express.Router();

// ✅ Create SummarizePassageResponse (student submits answer)
router.post("/create", protect, summarizePassageResponseController.createSummarizePassageResponse);

// ✅ Get all responses (admin)
router.get("/", protect, summarizePassageResponseController.getAllSummarizePassageResponses);

// ✅ Get responses by question ID
router.get("/question/:question_id", protect, summarizePassageResponseController.getResponsesByQuestionId);

// ✅ Get responses by student ID
router.get("/student/:student_id", protect, summarizePassageResponseController.getResponsesByStudentId);

// ✅ Update response by ID (admin or auto-eval logic)
router.put("/update/:id", protect, summarizePassageResponseController.updateSummarizePassageResponse);

// ✅ Delete response by ID
router.delete("/delete/:id", protect, summarizePassageResponseController.deleteSummarizePassageResponse);

module.exports = router;
