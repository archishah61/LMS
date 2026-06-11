const express = require("express");
const controller = require("../../../controllers/contest/contest_content/contestActivityControllers");
const protect = require("../../../middleware/protectMiddleware");
const checkPermission = require("../../../middleware/permissionMiddleware");

const router = express.Router();

router.post("/", protect, checkPermission("Contest Activity", "create"), controller.createActivity);
router.put("/:id", protect, checkPermission("Contest Activity", "edit"), controller.updateActivity);
router.delete("/:id", protect, checkPermission("Contest Activity", "delete"), controller.deleteActivity);
router.patch("/:id/toggle", protect, checkPermission("Contest Activity", "toggle"), controller.toggleActivity);
router.get("/contest/:contest_id", protect, checkPermission("Contest Activity", "view"), controller.getActivitiesByContest);
// Optional
router.get("/:id", protect, checkPermission("Contest Activity", "view"), controller.getActivityById);

module.exports = router;
