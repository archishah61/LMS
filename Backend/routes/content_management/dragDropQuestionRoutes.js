const express = require('express');
const router = express.Router();
const controller = require('../../controllers/content_management/dragDropQuestionController');
const protect = require('../../middleware/protectMiddleware');
const checkPermission = require('../../middleware/permissionMiddleware');

// 🔼 Create
router.post('/create', protect, checkPermission("Drag Drop Question", "create"), controller.createDragDropQuestion);

// 🔽 Read All
router.get('/', protect, checkPermission("Drag Drop Question", "view"), controller.getAllDragDropQuestions);

// 🔽 Read All by quiz id
router.get('/quiz/:quiz_id', protect, checkPermission("Drag Drop Question", "view"), controller.getDragDropQuestionsByQuizId);

// 🔍 Read One
router.get('/:id', protect, checkPermission("Drag Drop Question", "view"), controller.getDragDropQuestionById);

// ✏️ Update
router.put('/update/:id', protect, checkPermission("Drag Drop Question", "edit"), controller.updateDragDropQuestion);

// ❌ Delete
router.delete('/delete/:id', protect, checkPermission("Drag Drop Question", "delete"), controller.deleteDragDropQuestion);

module.exports = router;
