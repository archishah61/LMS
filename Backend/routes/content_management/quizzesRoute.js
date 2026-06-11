const express = require('express');
const router = express.Router();
const quizzesController = require('../../controllers/content_management/quizzesController'); // Adjust the path as necessary
const protect = require('../../middleware/protectMiddleware');
const checkPermission = require('../../middleware/permissionMiddleware');

// Create Quiz
router.post('/create', protect, checkPermission("Quiz", "create"), quizzesController.createQuiz);

// Get Quiz by module ID  ✅ (Tested)
router.get('/quiz/:id', protect, checkPermission("Quiz", "view"), quizzesController.getQuizByModuleId);

// Get Active Quiz Question by module ID  ✅ (Tested)
router.get('/active-quiz/:id', protect, checkPermission("Quiz", "view"), quizzesController.getActiveQuizQuestionByModuleId);

// Update Quiz
router.put('/update/:id', protect, checkPermission("Quiz", "edit"), quizzesController.updateQuiz);

router.patch('/:quizId/status', protect, checkPermission("Quiz", "toggle"), quizzesController.updateQuizStatus);

router.get('/quizById/:id', protect, checkPermission("Quiz", "view"), quizzesController.getQuizByQuizId);

module.exports = router;
