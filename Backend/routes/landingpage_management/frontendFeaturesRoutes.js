const express = require("express");
const router = express.Router();
const frontendFeaturesController = require("../../controllers/landingpage_management/frontendFeaturesController");
const protect = require("../../middleware/protectMiddleware");
const { uploadMiddleware } = require("../../middleware/uploadMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");

// ADMIN ROUTES
// Create a Feature
router.post("/", protect, checkPermission("Landing Page Features", "create"), uploadMiddleware, frontendFeaturesController.createFeature);

// Get all Features (Admin) with filter
router.get("/admin", protect, checkPermission("Landing Page Features", "view"), frontendFeaturesController.getAllFeaturesAdmin);

// Update a Feature
router.put("/:id", protect, checkPermission("Landing Page Features", "edit"), uploadMiddleware, frontendFeaturesController.updateFeature);

// Delete a Feature
router.delete("/:id", protect, checkPermission("Landing Page Features", "delete"), frontendFeaturesController.deleteFeature);

// Toggle Feature Active status
router.patch("/:id/toggle", protect, checkPermission("Landing Page Features", "toggle"), frontendFeaturesController.toggleFeatureActive);

// Update sequence of Features
router.put("/sequence/update", protect, checkPermission("Landing Page Features", "edit"), frontendFeaturesController.updateFeatureSequence);

// USER ROUTES
// Get all active Features (User)
router.get("/", frontendFeaturesController.getAllActiveFeaturesUser);

module.exports = router;
