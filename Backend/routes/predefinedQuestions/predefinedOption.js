const express = require("express");
const router = express.Router();
const preDefinedOptionController = require("../../controllers/predefinedQuestions/predefinedOptions");
const upload = require("../../config/multerConfig");
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");

// Predefined Options Routes
router.post(
  "/create",
  protect,
  checkPermission("Predefined Options", "create"),
  upload.single("preDefinedOptionImg"), // Handle option image upload
  preDefinedOptionController.createPreDefinedOption
);

router.get("/", protect, checkPermission("Predefined Options", "view"), preDefinedOptionController.getPreDefinedOptions);

router.get("/:id", protect, checkPermission("Predefined Options", "view"), preDefinedOptionController.getPreDefinedOptionsByQuestionId);

router.put(
  "/update/:id",
  protect,
  checkPermission("Predefined Options", "edit"),
  upload.single("preDefinedOptionImg"), // Handle option image upload
  preDefinedOptionController.updatePreDefinedOption
);

router.delete("/delete/:id", protect, checkPermission("Predefined Options", "delete"), preDefinedOptionController.deletePreDefinedOption);



module.exports = router;
