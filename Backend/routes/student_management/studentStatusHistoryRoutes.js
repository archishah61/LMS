const express = require('express');
const router = express.Router();
const StudentStatusHistory = require('../../controllers/student_management/studentStatusHistoryController');

// Student Status History Routes
router.post('/student-status-history', StudentStatusHistory.createStudentStatusHistory);
router.get('/student-status-history', StudentStatusHistory.getAllStudentStatusHistories);
router.get('/student-status-history/:id', StudentStatusHistory.getStudentStatusHistoryById);
router.put('/student-status-history/:id', StudentStatusHistory.updateStudentStatusHistory);
router.delete('/student-status-history/:id', StudentStatusHistory.deleteStudentStatusHistory);


module.exports = router;