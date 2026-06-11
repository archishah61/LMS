const express = require("express");
const router = express.Router();

const {
    createFillInBlankQuestion,
    getAllFillInBlankQuestions,
    getFillInBlankQuestionById,
    updateFillInBlankQuestion,
    deleteFillInBlankQuestion,
} = require("../../../controllers/content_management/genrated_quiz/fillInBlankQuestionController"); // Adjust path as needed
const protect = require("../../../middleware/protectMiddleware");
const checkPermission = require("../../../middleware/permissionMiddleware");


// Create a new Fill-in-the-Blank question
router.post("/create", protect, checkPermission("Fill-in-the-Blank Generated", "create"), createFillInBlankQuestion);

// Delete a Fill-in-the-Blank question by ID
router.delete("/delete/:id", protect, checkPermission("Fill-in-the-Blank Generated", "delete"), deleteFillInBlankQuestion);

module.exports = router;
