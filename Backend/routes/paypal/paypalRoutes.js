// backend/routes/paypal.js
const express = require('express');
const { OrdersCreateRequest, OrdersCaptureRequest } = require('../../controllers/paypal/paypalController');
const router = express.Router();

router.post('/create-order', OrdersCreateRequest);

router.post('/capture-order', OrdersCaptureRequest);

module.exports = router;
