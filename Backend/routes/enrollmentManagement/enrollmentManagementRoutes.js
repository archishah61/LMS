const express = require('express');
const router = express.Router();
const enrollmentController = require('../../controllers/enrollmentManagement/enrollmentManagementController'); // Ensure correct path
const protect = require('../../middleware/protectMiddleware');
const checkPermission = require('../../middleware/permissionMiddleware');

// Routes for managing enrollments
router.post('/enrollments', enrollmentController.createEnrollment); // Create a new enrollment ✅ (Tested)
router.get('/enrollments', protect, checkPermission("User Detail", "view"), enrollmentController.getEnrollments); // Get all enrollments ✅ (Tested)
router.get('/enrollments/:id', enrollmentController.getEnrollmentById); // Get a specific enrollment by ID ✅ (Tested)

// Route to get all courses for a specific user
router.get('/users/:userId/courses', enrollmentController.getUserCourses); // Get all courses for a user ✅ (Tested)
router.get(
  "/users/:userId/courses/:courseId", // get user hash by user id & course hash id ✅ (Tested)
  enrollmentController.getUserCourse
); // Get all courses for a user
router.get(
  "/user/:userId/course-content/:hashId", // get course content for user by user id and hash id ✅ (Tested)
  enrollmentController.getUserCourseByHashId
); // Get all courses for a user
router.get('/users/:userId/course-progress/:courseHash', protect, enrollmentController.getUserCourseProgress); // Get course progress for a user and course hash
// Export hierarchical course progress CSV (protected like progress endpoint)
router.get('/users/:userId/course-progress/:courseHash/export-csv', protect, enrollmentController.exportUserCourseProgressCsv);
// XLSX export (tabular)
router.get('/users/:userId/course-progress/:courseHash/export-xlsx', protect, enrollmentController.exportUserCourseProgressXlsx);
// PDF export (server-side)
router.get('/users/:userId/course-progress/:courseHash/export-pdf', protect, enrollmentController.exportUserCourseProgressPdf);

router.post('/payments', enrollmentController.createPayment); // Create a new payment
router.get('/payments', protect, checkPermission("Payment", "view"), enrollmentController.getPayments); // Get all payments
router.get('/payments/user/:id', enrollmentController.getPaymentsByUserId); // Get all payments
router.get('/payments/:id', enrollmentController.getPaymentById); // Get a specific payment by ID
router.put('/payments/:id', enrollmentController.updatePayment); // Update an existing payment
router.delete('/payments/:id', enrollmentController.deletePayment); // Delete a payment

module.exports = router;
