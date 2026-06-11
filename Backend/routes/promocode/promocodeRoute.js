const express = require("express");
const { generatePromoCodes, getAllBatches, getUsersByBatchId, verifyPromoCode, checkIsPromoCodeVerified } = require("../../controllers/promocode/promocodeController");
const router = express.Router();
const protect = require("../../middleware/protectMiddleware");


// Generate promo codes for multiple courses for a single user
router.post("/generate", protect, generatePromoCodes);
router.post("/batches/users", protect, getUsersByBatchId);
router.post("/verify", protect, verifyPromoCode);
router.post("/check-verified", protect, checkIsPromoCodeVerified);
router.get("/batches", protect, getAllBatches);

module.exports = router;