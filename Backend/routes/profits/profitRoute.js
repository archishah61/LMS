const express = require("express");
const router = express.Router();
const profitsController = require("../../controllers/profit/profitsController");

// Route to get financial metrics
router.get("/metrics", profitsController.getMetrics);

module.exports = router;
