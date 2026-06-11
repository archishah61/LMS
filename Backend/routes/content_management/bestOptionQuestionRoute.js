const express = require("express");
const bestOptionController = require("../../controllers/content_management/bestOptionQuestionController");
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");

const router = express.Router();

// ✅ Create BestOptionQuestion (Admin creates passage + blanks)
router.post("/create", protect, checkPermission("Best Option Question", "create"), bestOptionController.createBestOptionQuestion);

// ✅ Get all BestOptionQuestions (for admin list)
router.get("/", protect, checkPermission("Best Option Question", "view"), bestOptionController.getAllBestOptionQuestions);

// ✅ Get questions by Quiz ID
router.get("/quiz/:quiz_id", protect, checkPermission("Best Option Question", "view"), bestOptionController.getBestOptionQuestionsByQuizId);

// ✅ Update a BestOptionQuestion by ID
router.put("/update/:id", protect, checkPermission("Best Option Question", "edit"), bestOptionController.updateBestOptionQuestionById);

// ✅ Delete a BestOptionQuestion by ID
router.delete("/delete/:id", protect, checkPermission("Best Option Question", "delete"), bestOptionController.deleteBestOptionQuestionById);

module.exports = router;
