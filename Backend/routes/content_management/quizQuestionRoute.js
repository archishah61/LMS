const express = require("express");
const upload = require("../../config/multerConfig"); // Multer config for file uploads
const protect = require("../../middleware/protectMiddleware");
const { AdminOrPartner } = require("../../middleware/roleBaseMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");
const { createQuizQuestion, getQuizQuestionsByQuizId, updateQuizQuestion, deleteQuizQuestion, toggleQuizQuestion } = require("../../controllers/content_management/quizQuestionController");

const router = express.Router();

// Create Quiz Question (with image upload)
router.post(
  "/create",
  protect,
  upload.fields([
    { name: "audiotoscript", maxCount: 1 },
    { name: "videotoscript", maxCount: 1 },
    { name: "imagetoscript", maxCount: 1 },
    { name: "questionImg", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "audio", maxCount: 1 },
    { name: "videopause", maxCount: 1 },
    { name: "audiopause", maxCount: 1 }
  ]),
  createQuizQuestion
);

// Get All Quiz Questions
router.get("/quiz/:quiz_id", protect, getQuizQuestionsByQuizId);

// Update Quiz Question (with image upload)
router.put(
  "/update/:id",
  protect,
  upload.fields([
    { name: "audiotoscript", maxCount: 1 },
    { name: "videotoscript", maxCount: 1 },
    { name: "imagetoscript", maxCount: 1 },
    { name: "questionImg", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "audio", maxCount: 1 },
    { name: "videopause", maxCount: 1 },
    { name: "audiopause", maxCount: 1 }
  ]),
  updateQuizQuestion
);

// Delete Quiz Question
router.patch("/toggle/:id", protect, toggleQuizQuestion);

// Delete Quiz Question
router.delete("/delete/:id", protect, deleteQuizQuestion);

module.exports = router;
