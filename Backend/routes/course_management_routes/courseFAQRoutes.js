const express = require("express");
const router = express.Router();
const courseFAQController = require("../../controllers/course_management/courseFAQs");
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");

// Create a new FAQ
router.post("/", protect, checkPermission("Course FAQ", "create"), courseFAQController.createFAQ);

// Get all FAQs
router.get("/", protect, checkPermission("Course FAQ", "view"), courseFAQController.getAllFAQs);

// Get FAQs by Course ID
router.get("/course/:course_id", protect, checkPermission("Course FAQ", "view"), courseFAQController.getFAQsByCourseId);

// Update an FAQ
router.put("/:id", protect, checkPermission("Course FAQ", "edit"), courseFAQController.updateFAQ);

// Delete an FAQ
router.delete("/:id", protect, checkPermission("Course FAQ", "delete"), courseFAQController.deleteFAQ);

module.exports = router;
