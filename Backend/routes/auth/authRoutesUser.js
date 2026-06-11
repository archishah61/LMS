const express = require("express");
const router = express.Router();
const userController = require("../../controllers/auth/authControllerUser");
const { googleProtect } = require("../../middleware/authMiddleware");
const upload = require("../../config/multerConfig"); // Import multer config
const { verifyToken } = require("../../middleware/verifyToken");
const protect = require("../../middleware/protectMiddleware");
const UserPointsController = require("../../controllers/user_points/userPointsController");

// For Admin Use
router.post("/create", protect, userController.createUser);

router.put("/update/:id", protect, userController.updateUser);

router.get("/all", userController.getAllUsersPaginated);

// User Authentication Routes
router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.post("/logout", protect, userController.logout);
router.post("/googleLogin", googleProtect, userController.googleLogin);
router.post("/refresh-token", userController.refreshToken);

router.get('/verify-token', userController.verifyToken);
router.post('/verify-refresh-token', userController.verifyRefreshToken);

router.get("/points/:id", UserPointsController.getUserPointsById);

// Get User by ID (Protected)
router.get("/:id", protect, userController.getUserById);

// Update user profile (with image upload)
router.put("/user/:id", upload.single("profile_image"), userController.updateUserProfile);

// Delete profile image (Updated Route)
router.delete("/users/:id/delete-profile-image", userController.deleteProfileImage);

// Change Password Route (Protected)
router.post("/users/:id/change-password", userController.changePassword);

// Forgot password routes
router.post("/request-reset-password", userController.requestResetPassword);
router.post("/verify-reset-otp", userController.verifyResetOtp);
router.post("/reset-password", userController.resetPassword);
router.post("/check-user-login", userController.checkIsUserAlreadyLoggedIn);

module.exports = router;
