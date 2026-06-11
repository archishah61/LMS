const express = require("express");
const courseCategoryController = require("../../controllers/course_management/courseCatagory");
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");
const router = express.Router();

// Course Category Routes
router.post("/create", protect, checkPermission("Course Category", "create"), courseCategoryController.createCourseCategory);
router.get("/", courseCategoryController.getAllCourseCategories);
router.get("/active", courseCategoryController.getAllActiveCourseCategories);
router.put("/:id/status", protect, checkPermission("Course Category", "toggle"), courseCategoryController.updateCourseCategoryStatus);
router.get("/:id", courseCategoryController.getCourseCategoryById);
router.put("/update/:id", protect, checkPermission("Course Category", "edit"), courseCategoryController.updateCourseCategory);

module.exports = router;
