const express = require("express");
const router = express.Router();
const moduleController = require("../../controllers/course_management/moduleController");
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");

// Module routes
router.post(
  "/create",
  protect,
  checkPermission("Module", "create"),
  moduleController.createModule
);
// router.get("/course/:course_id", protect, checkPermission("Module", "view"), moduleController.getModulesByCourseId);
router.get("/course/:course_id", moduleController.getModulesByCourseId);

router.get("/:id", protect, checkPermission("Module", "view"), moduleController.getModuleById);
router.put(
  "/update/:id",
  protect,
  checkPermission("Module", "edit"),
  moduleController.updateModule
);
router.put("/module/sequence", protect, checkPermission("Module", "edit"), moduleController.updateModuleSequence);
router.patch('/:moduleId/status', protect, checkPermission("Module", "toggle"), moduleController.updateModuleStatus);
router.get("/session/:session_id", protect, checkPermission("Module", "view"), moduleController.getModulesBySessionId);

module.exports = router;
