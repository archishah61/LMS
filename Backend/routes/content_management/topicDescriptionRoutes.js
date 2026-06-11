const express = require('express');
const topicDescriptionController = require('../../controllers/content_management/topicDescriptionController');
const protect = require('../../middleware/protectMiddleware'); // Middleware for authentication/authorization
const checkPermission = require('../../middleware/permissionMiddleware');
const router = express.Router();

// ✅ Create a new Topic Description
router.post('/create', protect, checkPermission("Topic Description", "create"), topicDescriptionController.createTopicDescription);

// ✅ Get all Topic Descriptions with optional filtering and pagination
router.get('/', protect, checkPermission("Topic Description", "view"), topicDescriptionController.getAllTopicDescriptions);

// ✅ Get a single Topic Description by ID
router.get('/:id', protect, checkPermission("Topic Description", "view"), topicDescriptionController.getTopicDescriptionById);

// ✅ Update a Topic Description by ID
router.put('/update/:id', protect, checkPermission("Topic Description", "edit"), topicDescriptionController.updateTopicDescription);

// ✅ Delete a Topic Description by ID
router.delete('/delete/:id', protect, checkPermission("Topic Description", "delete"), topicDescriptionController.deleteTopicDescription);

module.exports = router;
