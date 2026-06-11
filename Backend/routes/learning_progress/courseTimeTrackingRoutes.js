const express = require('express');
const router = express.Router();
const courseTimeTrackingController = require('../../controllers/learning_progress/courseTimeTrackingController');
const protect = require("../../middleware/protectMiddleware");

// Apply auth middleware to all routes
// router.use(protect);

// Time tracking routes
router.post('/start-session', courseTimeTrackingController.startCourseSession);
router.post('/end-session', courseTimeTrackingController.endCourseSession);
router.post("/update-session", courseTimeTrackingController.updateSession);
router.get('/check-access/:enrollment_id', courseTimeTrackingController.checkCourseAccess);

module.exports = router;