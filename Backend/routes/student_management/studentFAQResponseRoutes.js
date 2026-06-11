const express = require("express");
const router = express.Router();
const studentFAQResponseController = require("../../controllers/student_management/studentFAQResponseController");
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");

// ✅ Create a new response
router.post("/create", protect, checkPermission("Student FAQ Responses", "create"), studentFAQResponseController.createStudentFAQResponse);

// ✅ Get all responses
router.get("/all", protect, checkPermission("Student FAQ Responses", "view"), studentFAQResponseController.getAllStudentFAQResponses);

// ✅ Get responses by Student ID
router.get("/student/:user_id", protect, checkPermission("Student FAQ Responses", "view"), studentFAQResponseController.getResponsesByStudentId);

// ✅ Get responses by Course ID
router.get("/course/:course_id", protect, checkPermission("Student FAQ Responses", "view"), studentFAQResponseController.getResponsesByCourseId);

module.exports = router;
