const express = require('express');
const router = express.Router();
const {
    createDifficultyLevel,
    updateDifficultyLevel,
    getAllDifficultyLevels,
    getAllActiveDifficultyLevels,
    toggleDifficultyLevelStatus,
    deleteDifficultyLevel,
    getTiersByDifficultyLevel,
} = require('../../controllers/tier/difficultyLevelController');
const protect = require('../../middleware/protectMiddleware');
const checkPermission = require('../../middleware/permissionMiddleware');

// Route to create a new difficulty level
router.post('/create', protect, checkPermission("Tier", "create"), createDifficultyLevel);

// Route to update a difficulty level
router.put('/update/:id', protect, checkPermission("Tier", "edit"), updateDifficultyLevel);

// Route to get all difficulty levels
router.get('/all', protect, checkPermission("Tier", "view"), getAllDifficultyLevels);

// Route to get all active difficulty levels
router.get('/all-active', getAllActiveDifficultyLevels);

// Route to toggle the status of a difficulty level
router.patch('/toggle-status/:id', protect, checkPermission("Tier", "toggle"), toggleDifficultyLevelStatus);

// Route to delete a difficulty level by ID
router.delete('/delete/:id', protect, checkPermission("Tier", "delete"), deleteDifficultyLevel);

// Route to get tiers for a specific difficulty level
router.get('/:id/tiers', protect, checkPermission("Tier", "view"), getTiersByDifficultyLevel);

module.exports = router;
