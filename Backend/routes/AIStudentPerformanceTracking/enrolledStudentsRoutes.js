const express = require('express');
const enrolledStudentsController = require('../../controllers/AIStudentPerformanceTracking/enrolledStudentsController');
const protect = require('../../middleware/protectMiddleware');

const router = express.Router();

// All routes below require authentication
// router.use(protect);

// Get all enrolled students
router.get('/', enrolledStudentsController.getEnrolledStudents);

// Get course enrollments for a specific student
router.get('/student/:studentId', enrolledStudentsController.getStudentEnrollments);

// Get modules for a specific course
router.get('/course/:courseId/modules', enrolledStudentsController.getModulesByCourse);

// Get topics for a specific module
router.get('/module/:moduleId/topics', enrolledStudentsController.getTopicsByModule);

module.exports = router;
