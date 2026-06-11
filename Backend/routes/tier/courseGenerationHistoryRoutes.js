const express = require('express');
const router = express.Router();
const {
    getUserCourseGenerationHistory,
    getCourseGenerationHistoryById
} = require('../../controllers/tier/courseGenerationHistoryController'); // Adjust path as needed
const protect = require('../../middleware/protectMiddleware');

router.get('/', protect, getUserCourseGenerationHistory);

router.get('/:id', protect, getCourseGenerationHistoryById);

module.exports = router;
