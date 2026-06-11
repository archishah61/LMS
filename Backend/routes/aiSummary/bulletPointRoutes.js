// routes/bulletPointRoutes.js
const express = require('express');
const router = express.Router();
const bulletPointController = require('../../controllers/aiSummary/bulletPointController');
const protect = require("../../middleware/protectMiddleware");

router.use(protect);

// Route to create a new bullet point
router.post('/bulletpoints', bulletPointController.createBulletPoint);

module.exports = router;
