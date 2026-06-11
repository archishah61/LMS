// backend/routes/paypal.js
const express = require('express');
const { createOrder, verifyPayment } = require('../../controllers/razorpay/razorpayController');
const protect = require('../../middleware/protectMiddleware');
const router = express.Router();

router.post('/create-order',protect, createOrder);

router.post('/verify-payment',protect, verifyPayment);

module.exports = router;
