const express = require("express");
const router = express.Router();

const {
    createMultipleChoiceQuestion,
    deleteMultipleChoiceQuestion,
} = require("../../../controllers/content_management/genrated_quiz/multipleChoiceQuestionController"); // Adjust path as per your structure
const checkPermission = require("../../../middleware/permissionMiddleware");
const protect = require("../../../middleware/protectMiddleware");

// Create a new multiple choice question
router.post("/create", protect, checkPermission("Multiple Choice Generated", "create"), createMultipleChoiceQuestion);

// Delete a multiple choice question by ID
router.delete("/delete/:id", protect, checkPermission("Multiple Choice Generated", "delete"), deleteMultipleChoiceQuestion);

module.exports = router;
