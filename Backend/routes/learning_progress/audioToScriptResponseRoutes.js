const express = require("express");
const audioToScriptResponseController = require("../../controllers/learning_progress/audioToScriptResponseController");
const protect = require("../../middleware/protectMiddleware"); // For student/admin auth
const router = express.Router();

// ✅ Create AudioToScriptResponse (student submits answer)
router.post("/create", protect, audioToScriptResponseController.createAudioToScriptResponse);

// ✅ Get all responses (admin)
router.get("/", protect, audioToScriptResponseController.getAllAudioToScriptResponses);

// ✅ Get responses by question ID
router.get("/question/:question_id", protect, audioToScriptResponseController.getResponsesByQuestionId);

// ✅ Get responses by student ID
router.get("/student/:student_id", protect, audioToScriptResponseController.getResponsesByStudentId);

// ✅ Update response by ID (admin or auto-eval logic)
router.put("/update/:id", protect, audioToScriptResponseController.updateAudioToScriptResponse);

// ✅ Delete response by ID
router.delete("/delete/:id", protect, audioToScriptResponseController.deleteAudioToScriptResponse);

module.exports = router;
