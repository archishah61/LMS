const express = require("express");
const courseController = require("../../controllers/course_management/courseController");
const upload = require("../../config/multerConfig"); // Adjust the path as necessary
const protect = require("../../middleware/protectMiddleware");
const { AdminOrPartner } = require("../../middleware/roleBaseMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");
const { generateCertificate } = require("../../controllers/certificateManagement/certificateManagementController");

const router = express.Router();

router.post('/certificate', protect, generateCertificate);

router.post(
  "/create",
  protect,
  checkPermission("Course", "create"),
  upload.fields([
    { name: "courseThumbnail", maxCount: 1 },
    { name: "coursePreviewVideo", maxCount: 20 },
    { name: "courseSEOImage", maxCount: 1 },
    { name: "courseOGImage", maxCount: 1 }
  ]),
  courseController.createCourse
);

router.get("/user-generated", protect, courseController.getUserGeneratedCourses);
router.get("/admin/", protect, checkPermission("Course", "view"), courseController.getAllCoursesForAdmin);
router.get("/getAllCourse", courseController.getAllCoursesName)
router.get("/trending", courseController.getAllTrendingCourses);
router.get("/", courseController.getAllCourses);
router.get("/:id", courseController.getCourseById);
router.get("/export/:id", protect, checkPermission("Course", "view"), courseController.exportCourseData);

// Update entire course (including files)
router.put(
  "/update/:id",
  protect,
  checkPermission("Course", "edit"),
  upload.fields([
    { name: "courseThumbnail", maxCount: 1 },
    { name: "coursePreviewVideo", maxCount: 20 },
    { name: "courseSEOImage", maxCount: 1 },
    { name: "courseOGImage", maxCount: 1 }
  ]),
  courseController.updateCourse
);

// ✅ New: Update course status separately
router.put("/update-status/:id", protect, checkPermission("Course", "toggle"), courseController.updateCourseStatus);

// router.delete("/delete/:id", protect, checkPermission("Course", "delete"), courseController.deleteCourse);
router.put("/sequence", protect, checkPermission("Course", "edit"), courseController.updateCourseSequence);

// router.put("/admin/approve-reject/:id", protect, courseController.adminApproveRejectCourse);

module.exports = router;
