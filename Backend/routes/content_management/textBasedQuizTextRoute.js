const express = require('express');
const router = express.Router();
const textBasedQuizTextController = require('../../controllers/content_management/textBasedQuizTextController');
const upload = require("../../config/multerConfig"); // Multer config for file uploads
const protect = require('../../middleware/protectMiddleware');
const checkPermission = require('../../middleware/permissionMiddleware');

// Create Quiz Question
router.post('/create', protect, checkPermission("Text Based Quiz Text", "create"), upload.none(), textBasedQuizTextController.createTextBasedQuizText);

// Get Quiz Question by ID
router.get('/:id', protect, checkPermission("Text Based Quiz Text", "view"), textBasedQuizTextController.getTextBasedQuizTextById);

// Update Quiz Question
router.put('/update/:id', protect, checkPermission("Text Based Quiz Text", "edit"), upload.none(), textBasedQuizTextController.updateTextBasedQuizText);

// Delete Quiz Question
router.delete('/delete/:id', protect, checkPermission("Text Based Quiz Text", "delete"), textBasedQuizTextController.deleteTextBasedQuizText);

module.exports = router;