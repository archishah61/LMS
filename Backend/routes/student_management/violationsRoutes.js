const express = require('express');
const router = express.Router();

const Violations = require('../../controllers/student_management/violationsController');


// Violations Routes
router.post('/violations', Violations.createViolation);
router.get('/violations', Violations.getAllViolations);
router.get('/violations/:id', Violations.getViolationById);
router.put('/violations/:id', Violations.updateViolation);
router.delete('/violations/:id', Violations.deleteViolation);

module.exports = router;