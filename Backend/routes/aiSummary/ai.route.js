const express = require("express");
const router = express.Router();
const protect = require("../../middleware/protectMiddleware");
const { summarizePassageController } = require("../../controllers/aiSummary/ai.controller");

router.post("/summarize", protect, summarizePassageController);

module.exports = router;
