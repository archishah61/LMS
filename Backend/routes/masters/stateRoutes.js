const express = require('express');
const router = express.Router();
const {
  createState,
  updateState,
  getAllStates,
  getStateById,
  toggleStateStatus,
  getAllActiveStates,
} = require('../../controllers/masters/stateController'); // Adjust path as needed
const protect = require('../../middleware/protectMiddleware');
const checkPermission = require('../../middleware/permissionMiddleware');

// Route to create a new state
router.post('/create', protect, checkPermission("State","create"), createState);

// Route to update a state
router.put('/update/:id', protect, checkPermission("State","edit"), updateState);

// Route to get all states
router.get('/all', getAllStates);

router.get('/all-active', getAllActiveStates);

// Route to get a state by ID
router.get('/:id', getStateById);

// Route to toggle the status of a state (active/inactive)
router.patch('/toggle-status/:id', protect, checkPermission("State","toggle"), toggleStateStatus);

module.exports = router;
