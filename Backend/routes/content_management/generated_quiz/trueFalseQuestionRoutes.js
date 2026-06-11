const express = require("express");
const router = express.Router();

const {
    createTrueFalseQuestion,
    getAllTrueFalseQuestions,
    getTrueFalseQuestionById,
    updateTrueFalseQuestion,
    deleteTrueFalseQuestion,
} = require("../../../controllers/content_management/genrated_quiz/trueFalseQuestionController"); // Adjust path as needed
const checkPermission = require("../../../middleware/permissionMiddleware");
const protect = require("../../../middleware/protectMiddleware");

// Create a new True/False question
router.post("/create", protect, checkPermission("True/False Generated", "create"), createTrueFalseQuestion);

// Get all True/False questions
router.get("/", protect, checkPermission("True/False Generated", "view"), getAllTrueFalseQuestions);

// Get a specific True/False question by ID
router.get("/:id", protect, checkPermission("True/False Generated", "view"), getTrueFalseQuestionById);

// Update a True/False question by ID
router.put("/update/:id", protect, checkPermission("True/False Generated", "edit"), updateTrueFalseQuestion);

// Delete a True/False question by ID
router.delete("/delete/:id", protect, checkPermission("True/False Generated", "delete"), deleteTrueFalseQuestion);

module.exports = router;
