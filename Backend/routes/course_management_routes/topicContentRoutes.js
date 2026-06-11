const express = require("express");
const topicContentController = require("../../controllers/course_management/topicContentController");
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");
const router = express.Router();

// Assign content to a topic
router.post("/assign", protect, checkPermission("Topic Content","create"), topicContentController.assignContentToTopic);

// Remove content from a topic
router.delete("/remove/:topic_id", protect, checkPermission("Topic Content","delete"), topicContentController.removeContentFromTopic);

// Get topic content by topic ID
router.get("/topic/:topic_id", protect, checkPermission("Topic Content","view"), topicContentController.getTopicContentByTopicId);

// Get topic content by module ID
router.get("/module/:module_id", protect, checkPermission("Topic Content","view"), topicContentController.getTopicContentByModuleId);

module.exports = router;
