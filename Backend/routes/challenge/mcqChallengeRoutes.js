const express = require("express");
const router = express.Router();
const MCQChallengeController = require("../../controllers/challenge/mcqChallengeController");

const protect = require("../../middleware/protectMiddleware"); // Adjust the path as necessary
const checkPermission = require("../../middleware/permissionMiddleware");

// Create MCQ Option
router.post("/options", MCQChallengeController.createMCQOptionChallenge);

// Update MCQ Option
router.put("/options/:id", MCQChallengeController.updateMCQOptionChallenge);

// toggle MCQ Option
router.patch("/options/:id", protect, checkPermission("MCQ Option Challenge", "toggle"), MCQChallengeController.toggleMCQOptionChallengeStatus);

// Delete MCQ
router.delete("/options/:id", protect, checkPermission("MCQ Option Challenge", "delete"), MCQChallengeController.deleteMCQOptionChallenge);

// Create MCQ
router.post("/", protect, checkPermission("MCQ Challenge", "create"), MCQChallengeController.createMCQChallenge);

// Update MCQ
router.put("/:id", protect, checkPermission("MCQ Challenge", "edit"), MCQChallengeController.updateMCQChallenge);

// Toggle MCQ
router.patch("/:id", protect, checkPermission("MCQ Challenge", "toggle"), MCQChallengeController.toggleMCQChallengeStatus);

// Delete MCQ
router.delete("/:id", protect, checkPermission("MCQ Challenge", "delete"), MCQChallengeController.deleteMCQChallenge);

module.exports = router;

