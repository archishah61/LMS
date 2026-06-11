const express = require("express");
const contestPrizeController = require("../../../controllers/contest/contest_content/contestPrizeControllers");
const protect = require("../../../middleware/protectMiddleware");
const checkPermission = require("../../../middleware/permissionMiddleware");

const router = express.Router();

// Contest Prize Routes
router.post("/", protect, checkPermission("Contest Prize", "create"), contestPrizeController.createContestPrize);
router.put("/:id", protect, checkPermission("Contest Prize", "edit"), contestPrizeController.updateContestPrize);
router.patch("/:id/toggle", protect, checkPermission("Contest Prize", "toggle"), contestPrizeController.toggleContestPrizeStatus);
router.delete("/:id", protect, checkPermission("Contest Prize", "delete"), contestPrizeController.deleteContestPrize);
router.get("/:contest_id", protect, checkPermission("Contest Prize", "view"), contestPrizeController.getContestPrizes);

module.exports = router;
