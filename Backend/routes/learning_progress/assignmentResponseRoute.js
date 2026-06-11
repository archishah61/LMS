const express = require("express");
const router = express.Router();
const assignmentResponseController = require("../../controllers/learning_progress/assignmentResponseController");

// Assignment Response Routes
router.post("/", assignmentResponseController.createAssignmentResponse);
router.get("/completion/:completionId", assignmentResponseController.getAssignmentResponsesByCompletionId);

module.exports = router;
