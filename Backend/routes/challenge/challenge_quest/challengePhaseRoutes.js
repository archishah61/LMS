const express = require("express");
const challengePhaseController = require("../../../controllers/challenge/challenge_quest/challengePhaseController");
const protect = require("../../../middleware/protectMiddleware");
const checkPermission = require("../../../middleware/permissionMiddleware");

const router = express.Router();

// Challenge Category Routes
router.post("/", protect, checkPermission("Challenge Phase", "create"), challengePhaseController.createChallengePhase);
router.get("/", protect, checkPermission("Challenge Phase", "view"), challengePhaseController.getChallengePhases);
router.get("/quest/:id", protect, checkPermission("Challenge Phase", "view"), challengePhaseController.getChallengePhasesByQuest);
router.get("/:id", protect, checkPermission("Challenge Phase", "view"), challengePhaseController.getChallengePhaseById);
router.put("/:id", protect, checkPermission("Challenge Phase", "edit"), challengePhaseController.updateChallengePhase);
router.delete("/:id", protect, checkPermission("Challenge Phase", "delete"), challengePhaseController.deleteChallengePhase);
router.patch("/:id", protect, checkPermission("Challenge Phase", "toggle"), challengePhaseController.toggleChallengePhaseStatus);

module.exports = router;