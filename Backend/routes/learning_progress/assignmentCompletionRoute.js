const express = require("express");
const router = express.Router();
const assignmentCompletionController = require("../../controllers/learning_progress/assignmentCompletionController");
const protect = require('../../middleware/protectMiddleware');

// Assignment Completion Routes
router.post("/", assignmentCompletionController.createAssignmentCompletion);
router.post("/due-date", assignmentCompletionController.createAssignmentDueDate);
router.get("/student/:studentId", assignmentCompletionController.getAssignmentCompletionByStudentId);
router.put("/:id", assignmentCompletionController.updateAssignmentCompletion);

router.get("/assignment/:assignmentId/:userId", assignmentCompletionController.getAssignmentCompletionByAssignmentId); // Fetch by student ID
router.post('/submit-assignment', protect, assignmentCompletionController.evaluateAssignment);

module.exports = router;
