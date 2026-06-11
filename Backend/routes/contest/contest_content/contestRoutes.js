const express = require("express");
const contestController = require("../../../controllers/contest/contest_content/contestControllers");
const protect = require("../../../middleware/protectMiddleware");
const upload = require("../../../config/multerConfig");
const checkPermission = require("../../../middleware/permissionMiddleware");
const checkFeature = require("../../../middleware/featureCheckMiddleware");

const router = express.Router();

router.post("/", protect, checkPermission("Contest", "create"), upload.single("contestBanner"), contestController.createContest);
router.get("/", protect, checkPermission("Contest", "view"), contestController.getContests);
router.get("/active",contestController.getActiveContests);
router.get("/:id", checkFeature("contest"), contestController.getContestById);
router.put("/:id", protect, checkPermission("Contest", "edit"), upload.single("contestBanner"), contestController.updateContest);
router.delete("/:id", protect, checkPermission("Contest", "delete"), contestController.deleteContest);
router.patch("/:id/toggle", protect, checkPermission("Contest", "toggle"), contestController.toggleContestStatus);

module.exports = router;

