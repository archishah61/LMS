const express = require("express");
const router = express.Router();
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");
const {
    getUserDailyFeatureCount,
    updateFeatureSettings,
    getFeatureSettingsUser,
    getFeatureSettingsAdmin
} = require("../../controllers/AI_Interview/interviewSettingsController");

router.get("/", protect, checkPermission("AI Interview Settings", "view"), getFeatureSettingsAdmin);
router.get("/user", protect, getFeatureSettingsUser);
router.post("/", protect, checkPermission("AI Interview Settings", "edit"), updateFeatureSettings);
router.get("/user-daily-count", protect, getUserDailyFeatureCount);

module.exports = router;
