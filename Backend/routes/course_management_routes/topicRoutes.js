const express = require("express");
const router = express.Router();
const topicController = require("../../controllers/course_management/topicController");
const { uploadMiddleware } = require("../../middleware/uploadMiddleware");
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");
// Topic routes
router.post("/create", protect, checkPermission("Topic", "create"), uploadMiddleware, topicController.createTopic);
// router.get("/module/:module_id", protect, checkPermission("Topic", "view"), topicController.getTopicsByModuleId);
router.get("/module/:module_id", topicController.getTopicsByModuleId);
router.get("/:id", protect, checkPermission("Topic", "view"), topicController.getTopicById);
router.put(
  "/update/:id",
  protect,
  checkPermission("Topic", "edit"),
  uploadMiddleware,
  topicController.updateTopic
);
router.put("/sequence", protect, checkPermission("Topic", "edit"), topicController.updateTopicSequence);
router.patch('/:topicId/status', protect, checkPermission("Topic", "toggle"), topicController.updateTopicStatus);

module.exports = router;
