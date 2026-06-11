const express = require("express");
const router = express.Router();
const TrueFalseChallenge = require("../../../controllers/challenge/challenge_quest/trueFalseChallengeController");
const protect = require("../../../middleware/protectMiddleware");
const checkPermission = require("../../../middleware/permissionMiddleware");

router.post("/", protect, checkPermission("True/False Challenge", "create"), TrueFalseChallenge.createTrueFalseChallenge);
router.put("/:id", protect, checkPermission("True/False Challenge", "edit"), TrueFalseChallenge.updateTrueFalseChallenge);
router.patch("/:id", protect, checkPermission("True/False Challenge", "toggle"), TrueFalseChallenge.toggleTrueFalseChallengeStatus);
router.delete("/:id", protect, checkPermission("True/False Challenge", "delete"), TrueFalseChallenge.deleteTrueFalseChallenge);

module.exports = router;
