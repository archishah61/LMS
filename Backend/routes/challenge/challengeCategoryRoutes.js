const express = require("express");
const challengeCategoryController = require("../../controllers/challenge/challengeCourseController");
const checkPermission = require("../../middleware/permissionMiddleware");
const protect = require("../../middleware/protectMiddleware");

const router = express.Router();

// Challenge Category Routes
router.post("/", protect, checkPermission("Challenge Category", "create"), challengeCategoryController.createChallengeCategory);
router.get("/", protect, checkPermission("Challenge Category", "view"), challengeCategoryController.getAllChallengeCategories);
router.get("/:id", protect, checkPermission("Challenge Category", "view"), challengeCategoryController.getChallengeCategoryById);
router.put("/:id", protect, checkPermission("Challenge Category", "edit"), challengeCategoryController.updateChallengeCategory);
router.delete("/:id", protect, checkPermission("Challenge Category", "delete"), challengeCategoryController.deleteChallengeCategory);
router.patch("/:id", protect, checkPermission("Challenge Category", "toggle"), challengeCategoryController.toggleChallengeCategoryStatus);

module.exports = router;
