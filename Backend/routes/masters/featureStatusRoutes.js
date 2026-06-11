// routes/featureStatusRoutes.js
const express = require("express");

const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");
const { toggleFeatureStatus, getFeatureStatus, getAllFeatureStatus } = require("../../controllers/masters/featureStatusController");

const router = express.Router();

// ✅ Toggle feature status (true <-> false)
router.patch("/:id/toggle", protect, checkPermission("Feature Status", "toggle"), toggleFeatureStatus);

// ✅ Get All feature status
router.get("/", getAllFeatureStatus);

// ✅ Get feature status by ID
router.get("/:name", getFeatureStatus);


module.exports = router;
