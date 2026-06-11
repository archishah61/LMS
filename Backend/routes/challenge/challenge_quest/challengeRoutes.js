const express = require("express");
const challengeController = require("../../../controllers/challenge/challenge_quest/challengeController");
const checkPermission = require("../../../middleware/permissionMiddleware");
const protect = require("../../../middleware/protectMiddleware");

const router = express.Router();

// Challenge Category Routes
router.post("/", protect, checkPermission("Challenge Quest", "create"), challengeController.createChallenge);
router.get("/", protect, checkPermission("Challenge Quest", "view"), challengeController.getChallenges);
router.get("/:id", protect, checkPermission("Challenge Quest", "view"), challengeController.getChallengeById);
router.put("/:id", protect, checkPermission("Challenge Quest", "edit"), challengeController.updateChallenge);
router.delete("/:id", protect, checkPermission("Challenge Quest", "delete"), challengeController.deleteChallenge);
router.patch("/:id", protect, checkPermission("Challenge Quest", "toggle"), challengeController.toggleChallengeStatus);

module.exports = router;