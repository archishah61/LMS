const express = require("express");
const router = express.Router();
const DailyChallengesController = require("../../controllers/challenge/dailyChallengeControllers");
const FillInTheBlanksChallenge = require("../../controllers/challenge/fillInTheBlanksChallengeController");

const protect = require("../../middleware/protectMiddleware"); // Adjust the path as necessary
const checkPermission = require("../../middleware/permissionMiddleware");
const upload = require("../../config/multerConfig");

// ✅ Create Challenge with Fill in the Blanks
router.post("/", protect, checkPermission("Daily Challenge", "create"), upload.single("dailyChallengeImage"), DailyChallengesController.createChallenge);

// ✅ Get All Challenges
router.get("/", protect, checkPermission("Daily Challenge", "view"), DailyChallengesController.getAllChallenges);

// ✅ Get Challenge by ID with Questions
router.get("/:id", protect, checkPermission("Daily Challenge", "view"), DailyChallengesController.getChallengeById);

// ✅ Update Challenge by ID 
router.put("/:id", protect, checkPermission("Daily Challenge", "edit"), upload.single("dailyChallengeImage"), DailyChallengesController.updateChallenge);

// ✅ Toggle Challenge by ID 
router.patch("/:id", protect, checkPermission("Daily Challenge", "toggle"), DailyChallengesController.toggleChallengeStatus);

// ✅ Delete Challenge by ID 
router.delete("/:id", protect, checkPermission("Daily Challenge", "delete"), DailyChallengesController.deleteChallenge);

// Fill In The Blanks Routes

router.post("/fill-in-the-blanks", protect, checkPermission("Fill-in-the-Blank Challenge", "create"), FillInTheBlanksChallenge.createFillInTheBlanksChallenge);

// ✅ Get All Fill in the Blanks Challenges
router.get("/fill-in-the-blanks/all", protect, checkPermission("Fill-in-the-Blank Challenge", "view"), FillInTheBlanksChallenge.getAllFillInTheBlanksChallenges);

// ✅ Get Single Fill in the Blanks Challenge by ID
router.get("/fill-in-the-blanks/:id", protect, checkPermission("Fill-in-the-Blank Challenge", "view"), FillInTheBlanksChallenge.getFillInTheBlanksChallengeById);

// ✅ Update Fill in the Blanks Challenge
router.put("/fill-in-the-blanks/:id", protect, checkPermission("Fill-in-the-Blank Challenge", "edit"), FillInTheBlanksChallenge.updateFillInTheBlanksChallenge);

// ✅ Toggle is_active Status
router.patch("/fill-in-the-blanks/:id/toggle", protect, checkPermission("Fill-in-the-Blank Challenge", "toggle"), FillInTheBlanksChallenge.toggleFillInTheBlanksChallengeStatus);

// ✅ Delete Fill in the Blanks
router.delete("/fill-in-the-blanks/:id", protect, checkPermission("Fill-in-the-Blank Challenge", "delete"), FillInTheBlanksChallenge.deleteFillInTheBlanksChallenge);

module.exports = router;

