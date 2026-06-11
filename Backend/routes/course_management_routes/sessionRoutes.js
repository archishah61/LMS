const express = require("express");
const router = express.Router();
const sessionController = require("../../controllers/course_management/sessionController");
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");

// Create session (with optional image)
router.post("/create", protect, checkPermission("Session", "create"), sessionController.createSession);

// Get all sessions
router.get("/", protect, checkPermission("Session", "view"), sessionController.getAllSessions);

router.get("/active/:courseId", protect, sessionController.getActiveSessionsByCourseId);

// router.get("/course/:courseId", protect, checkPermission("Session", "view"), sessionController.getSessionsByCourseId);
router.get("/course/:courseId", protect, checkPermission("Session", "view"), sessionController.getSessionsByCourseId);

// Get session by ID
router.get("/:id", protect, checkPermission("Session", "view"), sessionController.getSessionById);

// Update session (with optional new image)
router.put("/update/:id", protect, checkPermission("Session", "edit"), sessionController.updateSession);

router.put("/session/sequence", protect, checkPermission("Session", "edit"), sessionController.updateSessionSequence);

router.patch('/:sessionId/status', protect, checkPermission("Session", "toggle"), sessionController.updateSessionStatus);

module.exports = router;
