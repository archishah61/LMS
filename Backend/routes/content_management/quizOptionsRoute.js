const express = require("express");
const quizOptionsController = require("../../controllers/content_management/quizOptionController"); // Adjust the path as necessary
const upload = require("../../config/multerConfig"); // Multer config for file uploads
const protect = require("../../middleware/protectMiddleware");
const { AdminOrPartner } = require("../../middleware/roleBaseMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");

const router = express.Router();

// Create Quiz Option (with image upload)
router.post(
  "/create",
  AdminOrPartner,
  checkPermission("Quiz Option", "create"),
  upload.single("optionImage"), // Handle option image upload
  quizOptionsController.createQuizOption
);

// Get All Quiz Options
router.get("/", protect, checkPermission("Quiz Option", "view"), quizOptionsController.getQuizOptions);

// Get Quiz Option by ID
router.get("/:id", protect, checkPermission("Quiz Option", "view"), quizOptionsController.getQuizOptionById);

// Update Quiz Option (with image upload)
router.put(
  "/update/:id",
  protect,
  checkPermission("Quiz Option", "edit"),
  upload.fields([{ name: "optionImage", maxCount: 1 }]), // Handle option image upload
  quizOptionsController.updateQuizOption
);

// Delete Quiz Option
router.delete("/delete/:id", protect, checkPermission("Quiz Option", "delete"), quizOptionsController.deleteQuizOption);

router.delete(
  "/delete/options/:questionId",
  protect,
  checkPermission("Quiz Option", "delete"),
  quizOptionsController.deleteOptionsByQuestionId
);

module.exports = router;
