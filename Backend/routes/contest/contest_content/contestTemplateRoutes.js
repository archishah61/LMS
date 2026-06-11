const express = require("express");
const contestTemplateController = require("../../../controllers/contest/contest_content/contestTemplateControllers");
const checkPermission = require("../../../middleware/permissionMiddleware");
const protect = require("../../../middleware/protectMiddleware");
const upload = require("../../../config/multerConfig");
const checkFeature = require("../../../middleware/featureCheckMiddleware");

const router = express.Router();

// Contest Template Routes
router.post("/", protect, checkPermission("Contest Template", "create"), upload.single("templateBanner"), contestTemplateController.createContestTemplate);
router.get("/", protect, checkPermission("Contest Template", "view"), contestTemplateController.getContestTemplates);
router.get("/active", checkFeature("contest"), contestTemplateController.getActiveContestTemplates);
router.get("/:id", protect, contestTemplateController.getContestTemplateById);
router.put("/:id", protect, checkPermission("Contest Template", "edit"), upload.single("templateBanner"), contestTemplateController.updateContestTemplate);
router.delete("/:id", protect, checkPermission("Contest Template", "delete"), contestTemplateController.deleteContestTemplate);
router.patch("/:id/toggle", protect, checkPermission("Contest Template", "toggle"), contestTemplateController.toggleContestTemplateStatus);

module.exports = router;
