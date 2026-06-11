const express = require("express");
const quizQuestionsController = require("../../controllers/content_management/quizQuestionsController"); // Adjust path if needed
const upload = require("../../config/multerConfig"); // Multer config for file uploads
const protect = require("../../middleware/protectMiddleware");
const { AdminOrPartner } = require("../../middleware/roleBaseMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");

const router = express.Router();

// Create Quiz Question (with image upload)
router.post(
  "/create",
  protect,
  checkPermission("Quiz Question", "create"),
  upload.fields([{ name: "questionImg", maxCount: 1 }]), // Handle question image upload
  quizQuestionsController.createQuizQuestion
);


// Get Quiz Question by ID
router.get("/:id", protect, checkPermission("Quiz Question", "view"), quizQuestionsController.getQuizQuestionById);

// Update Quiz Question (with image upload)
router.put(
  "/update/:id",
  protect,
  checkPermission("Quiz Question", "edit"),
  upload.fields([{ name: "questionImg", maxCount: 1 }]), // Handle question image upload
  quizQuestionsController.updateQuizQuestion
);

// Delete Quiz Question
router.delete("/delete/:id", protect, checkPermission("Quiz Question", "delete"), quizQuestionsController.deleteQuizQuestion);

module.exports = router;
