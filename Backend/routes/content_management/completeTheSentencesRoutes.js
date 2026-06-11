const express = require("express");
const completeTheSentenceController = require("../../controllers/content_management/completeTheSentnces");
const protect = require("../../middleware/protectMiddleware");
// const checkPermission = require("../../middleware/permissionMiddleware");

const router = express.Router();

// ✅ Create BestOptionQuestion (Admin creates passage + blanks)
router.post("/create", protect, completeTheSentenceController.createCompleteTheSentences);

// ✅ Get all BestOptionQuestions (for admin list)
router.get("/", protect, completeTheSentenceController.getAllCompleteSentences);

// ✅ Get questions by Quiz ID
router.get("/quiz/:quiz_id", protect, completeTheSentenceController.getCompleteSentencesByQuizId);

// ✅ Update a BestOptionQuestion by ID
router.put("/update/:id", protect, completeTheSentenceController.updateCompleteSentenceById);

// ✅ Delete a BestOptionQuestion by ID
// router.delete("/delete/:id", protect, completeTheSentenceController.deleteBestOptionQuestionById);

module.exports = router;
