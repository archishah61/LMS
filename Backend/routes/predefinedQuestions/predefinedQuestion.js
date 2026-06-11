const express = require("express");
const router = express.Router();
const preDefinedQuestionController = require("../../controllers/predefinedQuestions/predefinedQuestions");
const upload = require("../../config/multerConfig");
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");
const { uploadMiddleware } = require("../../middleware/uploadMiddleware");


// Routes
router.post(
  "/create",
  protect,
  checkPermission("Predefined Questions", "create"),
  uploadMiddleware,
  preDefinedQuestionController.createQuestionWithOptions,
)

router.get("/", protect, preDefinedQuestionController.getAllQuestionsWithOptions)

router.get(
  "/:id",
  protect,
  checkPermission("Predefined Questions", "view"),
  preDefinedQuestionController.getQuestionWithOptionsById,
)

router.put(
  "/update/:id",
  protect,
  checkPermission("Predefined Questions", "edit"),
  uploadMiddleware,
  preDefinedQuestionController.updateQuestionWithOptions,
)

router.delete(
  "/delete/:id",
  protect,
  checkPermission("Predefined Questions", "delete"),
  preDefinedQuestionController.deleteQuestionWithOptions,
)

router.patch(
  "/toggle/:id",
  protect,
  // checkPermission("Predefined Questions", "toggle"),
  preDefinedQuestionController.toggleQuestionStatus,
)

router.post(
  "/update-sequence",
  protect,
  checkPermission("Predefined Questions", "edit"),
  preDefinedQuestionController.updateQuestionSequence,
)

// // Predefined Questions Routes
// router.post( //✅ (Tested)
//   "/create",
//   protect,
//   checkPermission("Predefined Questions", "create"),
//   upload.single("preDefinedQuestionImg"),
//   preDefinedQuestionController.createPreDefinedQuestion
// );
// router.get("/", protect, checkPermission("Predefined Questions", "view"), preDefinedQuestionController.getPreDefinedQuestions); // ✅ (Tested)
// router.get("/:id", protect, checkPermission("Predefined Questions", "view"), preDefinedQuestionController.getPreDefinedQuestionById); // ✅ (Tested)
// router.put(
//   "/update/:id",
//   protect,
//   checkPermission("Predefined Questions", "edit"),
//   upload.single("preDefinedQuestionImg"),
//   preDefinedQuestionController.updatePreDefinedQuestion
// );
// router.delete(
//   "/delete/:id",
//   protect,
//   checkPermission("Predefined Questions", "delete"),
//   preDefinedQuestionController.deletePreDefinedQuestion
// );

// // ✅ New Route for Updating Sequence
// router.post(
//   "/update-sequence",
//   protect,
//   checkPermission("Predefined Questions", "edit"),
//   preDefinedQuestionController.updatePreDefinedQuestionSequence
// );

module.exports = router;
