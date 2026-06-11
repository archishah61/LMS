const express = require("express");
const summarizePassageController = require("../../controllers/content_management/summarPassageController");
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");

const router = express.Router();

// ✅ Create SummarizePassageQuestion
router.post("/create", protect, checkPermission("Summarize Passage Question", "create"), summarizePassageController.createSummarizePassageQuestion);

// ✅ Get All SummarizePassageQuestions
router.get("/", protect, checkPermission("Summarize Passage Question", "view"), summarizePassageController.getAllSummarizePassageQuestions);

// ✅ Get SummarizePassageQuestions by Quiz ID
router.get("/quiz/:quiz_id", protect, checkPermission("Summarize Passage Question", "view"), summarizePassageController.getSummarizePassageQuestionsByQuizId);

// ✅ Update SummarizePassageQuestion by ID
router.put("/update/:id", protect, checkPermission("Summarize Passage Question", "edit"), summarizePassageController.updateSummarizePassageQuestionById);

// ✅ Delete SummarizePassageQuestion by ID
router.delete("/delete/:id", protect, checkPermission("Summarize Passage Question", "delete"), summarizePassageController.deleteSummarizePassageQuestionById);

module.exports = router;
