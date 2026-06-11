// routes/flashCardRoutes.js
const express = require('express');
const router = express.Router();
const flashCardController = require('../../controllers/aiSummary/flashCardController');
const protect = require("../../middleware/protectMiddleware");

router.use(protect);

// Route to create a new flash card
router.post('/flashcards', flashCardController.createFlashCard);

module.exports = router;
