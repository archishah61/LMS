const express = require("express");
const router = express.Router();
const frontendStatiscticsController = require("../../controllers/landingpage_management/frontendStatiscticsController");
const protect = require("../../middleware/protectMiddleware");
const { uploadMiddleware } = require("../../middleware/uploadMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");

// ADMIN ROUTES
// Create an Statistic
router.post("/", protect, checkPermission("Landing Page Statistics", "create"), uploadMiddleware, frontendStatiscticsController.createStatistic);

// Get all Statistics (Admin) with filter
router.get("/admin", protect, checkPermission("Landing Page Statistics", "view"), frontendStatiscticsController.getAllStatisticsAdmin);

// Update an Statistic
router.put("/:id", protect, checkPermission("Landing Page Statistics", "edit"), uploadMiddleware, frontendStatiscticsController.updateStatistic);

// Delete an Statistic
router.delete("/:id", protect, checkPermission("Landing Page Statistics", "delete"), frontendStatiscticsController.deleteStatistic);

// Toggle Statistic Active status
router.patch("/:id/toggle", protect, checkPermission("Landing Page Statistics", "toggle"), frontendStatiscticsController.toggleStatisticActive);

// Update sequence of Statistics
router.put("/sequence/update", protect, checkPermission("Landing Page Statistics", "edit"), frontendStatiscticsController.updateStatisticSequence);

// USER ROUTES
// Get all active Statistics (User)
router.get("/", frontendStatiscticsController.getAllActiveStatisticsUser);

module.exports = router;
