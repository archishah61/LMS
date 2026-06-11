const express = require("express");
const router = express.Router();
const courseFAQOptionController = require("../../controllers/course_management/courseFAQOptions");
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");

// Create FAQ options (supports multiple options)
router.post("/", protect, checkPermission("Course FAQ Option", "create"), courseFAQOptionController.createFAQOptions);

// Get all FAQ options
router.get("/", protect, checkPermission("Course FAQ Option", "view"), courseFAQOptionController.getAllFAQOptions);

// Get options for a specific FAQ question
router.get("/faq/:faq_id", protect, checkPermission("Course FAQ Option", "view"), courseFAQOptionController.getFAQOptionsByFAQId);

// 🔹 New Route: Get options for multiple FAQs in bulk
router.post("/faq-options/bulk", protect, checkPermission("Course FAQ Option", "create"), courseFAQOptionController.getFAQOptionsByFAQIds);

// Update an FAQ option
router.put("/:id", protect, checkPermission("Course FAQ Option", "edit"), courseFAQOptionController.updateFAQOption);

// Delete an FAQ option
router.delete("/:id", protect, checkPermission("Course FAQ Option", "delete"), courseFAQOptionController.deleteFAQOption);

module.exports = router;
