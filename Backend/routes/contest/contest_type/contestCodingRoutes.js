const express = require("express");
const contestCodingController = require("../../../controllers/contest/contest_type/contestCodingControllers");
const protect = require("../../../middleware/protectMiddleware");
const checkPermission = require("../../../middleware/permissionMiddleware");

const router = express.Router();

router.post("/", protect, checkPermission("Contest Coding", "create"), contestCodingController.createContestCoding);
router.put("/:id", protect, checkPermission("Contest Coding", "edit"), contestCodingController.updateContestCoding);
router.patch("/:id/toggle", protect, checkPermission("Contest Coding", "toggle"), contestCodingController.toggleContestCodingStatus);
router.delete("/:id", protect, checkPermission("Contest Coding", "delete"), contestCodingController.deleteContestCoding);
router.get("/activity/:activity_id", protect, checkPermission("Contest Coding", "view"), contestCodingController.getContestCodingByActivity);
router.get("/:coding_id", protect, checkPermission("Contest Coding", "view"), contestCodingController.getContestCodingById);

module.exports = router;
