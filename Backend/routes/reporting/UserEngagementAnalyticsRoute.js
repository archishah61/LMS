const express = require("express");
const router = express.Router();
const { getCompletionAnalytics, getAverageTimeSpentAnalytics, getAverageSessionLengths, getRecentEnrollments, getStudentFAQAnalytics } = require("../../controllers/reporting/UserEngagementAnalyticsController");
const protect = require("../../middleware/protectMiddleware");

router.use(protect);

router.get("/course-completion", getCompletionAnalytics);
router.get("/average-time-spent", getAverageTimeSpentAnalytics);
router.get("/average-session-length", getAverageSessionLengths);
router.get("/recent-enrollments", getRecentEnrollments);
router.get("/faq-response", getStudentFAQAnalytics);


module.exports = router;
