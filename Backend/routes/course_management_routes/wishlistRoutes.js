const express = require("express");
const wishlistController = require("../../controllers/course_management/wishlistController");
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");

const router = express.Router();

// Wishlist routes
router.post("/add", protect, wishlistController.addToWishlist);
router.get("/:user_id", wishlistController.getWishlist);
router.delete("/remove/", protect, wishlistController.removeFromWishlist);

module.exports = router;
