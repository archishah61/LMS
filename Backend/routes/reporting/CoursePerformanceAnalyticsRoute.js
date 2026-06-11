const express = require("express");
const router = express.Router();
const { getTopEnrolledCourses, getTopRatedCourses, getCategoriesWithMostEnrollments ,getAverageTimeToCompleteCourse} = require("../../controllers/reporting/CoursePerformanceAnalyticsController"); // Adjust path as needed
const protect = require("../../middleware/protectMiddleware");

router.use(protect);

router.get("/top-enrolled-courses", getTopEnrolledCourses);

router.get("/top-rated-courses", getTopRatedCourses);

router.get("/categories-most-enrollments", getCategoriesWithMostEnrollments);

router.get("/average-time-completion-per-course", getAverageTimeToCompleteCourse);

module.exports = router;
