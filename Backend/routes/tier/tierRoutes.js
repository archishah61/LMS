const express = require('express');
const router = express.Router();
const {
    createTier,
    updateTier,
    getAllTiers,
    toggleTierStatus,
    deleteTier,
    getAllActiveTiers,
    purchaseCourseGeneration
} = require('../../controllers/tier/tierController'); // Adjust path as needed
const protect = require('../../middleware/protectMiddleware');
const checkPermission = require('../../middleware/permissionMiddleware');

router.post('/purchase', protect, purchaseCourseGeneration); // Create a new enrollment ✅ (Tested)

// Route to create a new tier
router.post('/create', protect, checkPermission("Tier", "create"), createTier);

// Route to update a tier
router.put('/update/:id', protect, checkPermission("Tier", "edit"), updateTier);

// Route to get all tiers
router.get('/all', protect, checkPermission("Tier", "view"), getAllTiers);

// Route to get all active tiers
router.get('/all-active', getAllActiveTiers);

// Route to toggle the status of a tier (active/inactive)
router.patch('/toggle-status/:id', protect, checkPermission("Tier", "toggle"), toggleTierStatus);

// Route to delete a tier by ID
router.delete('/delete/:id', protect, checkPermission("Tier", "delete"), deleteTier);

module.exports = router;
