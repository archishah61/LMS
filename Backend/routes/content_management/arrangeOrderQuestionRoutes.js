// routes/arrangeOrderQuestionRoutes.js
const express = require("express");
const arrangeOrderController = require("../../controllers/content_management/arrangeOrderQuestionController");
const checkPermission = require("../../middleware/permissionMiddleware");
const protect = require("../../middleware/protectMiddleware");
const router = express.Router();

// ✅ Create
router.post("/", protect, checkPermission("Arrange Order", "create"), arrangeOrderController.createArrangeOrderQuestion);

// ✅ Get All
router.get("/", protect, checkPermission("Arrange Order", "view"), arrangeOrderController.getAllArrangeOrderQuestions);

// ✅ Get by ID
router.get("/:id", protect, checkPermission("Arrange Order", "view"), arrangeOrderController.getArrangeOrderQuestionById);

// ✅ Get by Quiz ID
router.get("/quiz/:quiz_id", protect, arrangeOrderController.getArrangeOrderQuestionsByQuizId);

// ✅ Update
router.put("/:id", protect, checkPermission("Arrange Order", "edit"), arrangeOrderController.updateArrangeOrderQuestionById);

// ✅ Delete
router.delete("/:id", protect, checkPermission("Arrange Order", "delete"), arrangeOrderController.deleteArrangeOrderQuestionById);

module.exports = router;
