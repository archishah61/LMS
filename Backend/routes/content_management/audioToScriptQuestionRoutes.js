const express = require("express");
const audioToScriptController = require("../../controllers/content_management/audioToScriptQuestionController");
const protect = require("../../middleware/protectMiddleware");
const upload = require("../../config/multerConfig"); // destination: uploads/audiotoScript
const router = express.Router();
const checkPermission = require("../../middleware/permissionMiddleware");

// ✅ Create AudioToScriptQuestion (expects single audio file)
router.post(
    "/create",
    protect,
    checkPermission("Audio To Script Question", "create"),
    upload.single("audiotoScript"),
    audioToScriptController.createAudioToScriptQuestion
);

// ✅ Get All AudioToScriptQuestions
router.get("/", protect, checkPermission("Audio To Script Question", "view"), audioToScriptController.getAllAudioToScriptQuestions);

// ✅ Get AudioToScriptQuestions by Quiz ID
router.get("/quiz/:quiz_id", protect, checkPermission("Audio To Script Question", "view"), audioToScriptController.getAudioToScriptQuestionsByQuizId);

// ✅ Update AudioToScriptQuestion by ID (expects new audio if uploading)
router.put(
    "/update/:id",
    protect,
    checkPermission("Audio To Script Question", "edit"),
    upload.single("audiotoScript"),
    audioToScriptController.updateAudioToScriptQuestionById
);

// ✅ Delete AudioToScriptQuestion by ID
router.delete(
    "/delete/:id",
    protect,
    checkPermission("Audio To Script Question", "delete"),
    audioToScriptController.deleteAudioToScriptQuestionById
);

module.exports = router;