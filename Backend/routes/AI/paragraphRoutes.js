const express = require("express");
const router = express.Router();
const { generateParagraph, analyzeTypingPerformance, savePracticeSession, getPracticeHistory } = require("../../controllers/AI/paragraphGeneratorController");
const protect = require("../../middleware/protectMiddleware");

router.post("/generate", generateParagraph);
router.post("/analyze", analyzeTypingPerformance);
router.post("/save", protect, savePracticeSession);
router.get("/history", protect, getPracticeHistory);

module.exports = router;

