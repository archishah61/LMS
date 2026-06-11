const express = require("express");
const router = express.Router();
const userController = require("../../controllers/auth/authControllerAdmin");
const upload = require("../../config/multerConfig"); // Import multer config

const {
    getRolePermissionsByRoleId,
} = require('../../controllers/auth/RoleAndPermission/rolePermissionController'); // Adjust path as needed
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");

// Auth routes
router.post("/login", userController.login);
router.get("/permissions", protect, getRolePermissionsByRoleId);
router.post("/refresh-token", userController.refreshToken);
router.post("/verify-refresh-token", userController.verifyRefreshToken);
router.post("/logout", protect, userController.logout);

// Admin management routes
router.get("/admins", protect, checkPermission("Admin", "view"), userController.getAllAdmins);
router.get("/admins/me", protect, userController.getCurrentAdmin);
router.get("/admins/:id", protect, checkPermission("Admin", "view"), userController.getAdminById);
router.post("/admins", protect, checkPermission("Admin", "create"), userController.createAdmin);
router.put("/admins/:id/password", protect, checkPermission("Admin", "edit"), userController.updateAdminPassword);
router.put("/admins/:id", protect, checkPermission("Admin", "edit"), upload.single("profile_image_admin"),userController.updateAdmin);
router.delete("/admins/:id", protect, checkPermission("Admin", "delete"), userController.deleteAdmin);
router.patch("/admins/:id", protect, checkPermission("Admin", "toggle"), userController.toggleAdminStatus); // 👈 New Route Added

module.exports = router;
