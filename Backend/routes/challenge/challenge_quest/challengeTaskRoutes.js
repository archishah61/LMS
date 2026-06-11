const express = require("express");
const challengeTaskController = require("../../../controllers/challenge/challenge_quest/challengeTaskController");
const protect = require("../../../middleware/protectMiddleware");
const checkPermission = require("../../../middleware/permissionMiddleware");

const router = express.Router();

// Challenge Category Routes
router.post("/", protect, checkPermission("Challenge Task", "create"), challengeTaskController.createChallengeTask);
router.get("/", protect, checkPermission("Challenge Task", "view"), challengeTaskController.getChallengeTasks);
router.get("/phase/:id", protect, checkPermission("Challenge Task", "view"), challengeTaskController.getChallengeTasksByPhase);
router.get("/:id", protect, checkPermission("Challenge Task", "view"), challengeTaskController.getChallengeTaskById);
router.put("/:id", protect, checkPermission("Challenge Task", "edit"), challengeTaskController.updateChallengeTask);
router.delete("/:id", protect, checkPermission("Challenge Task", "delete"), challengeTaskController.deleteChallengeTask);
router.patch("/:id", protect, checkPermission("Challenge Task", "toggle"), challengeTaskController.toggleChallengeTaskStatus);

module.exports = router;