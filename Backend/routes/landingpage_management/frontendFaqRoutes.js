const express = require("express");
const router = express.Router();
const frontendFaqController = require("../../controllers/landingpage_management/frontendFaqController");
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");

// ADMIN ROUTES
// Create an FAQ
router.post("/", protect, checkPermission("Landing Page FAQ", "create"), frontendFaqController.createFaq);

// Get all FAQs (Admin) with filter
router.get("/admin", protect, checkPermission("Landing Page FAQ", "view"), frontendFaqController.getAllFaqsAdmin);

// Update an FAQ
router.put("/:id", protect, checkPermission("Landing Page FAQ", "edit"), frontendFaqController.updateFaq);

// Delete an FAQ
router.delete("/:id", protect, checkPermission("Landing Page FAQ", "delete"), frontendFaqController.deleteFaq);

// Toggle FAQ Active status
router.patch("/:id/toggle", protect, checkPermission("Landing Page FAQ", "toggle"), frontendFaqController.toggleFaqActive);

// Update sequence of FAQs
router.put("/sequence/update", protect, checkPermission("Landing Page FAQ", "edit"), frontendFaqController.updateFaqSequence);

// USER ROUTES
// Get all active FAQs (User)
router.get("/", frontendFaqController.getAllActiveFaqsUser);

module.exports = router;
