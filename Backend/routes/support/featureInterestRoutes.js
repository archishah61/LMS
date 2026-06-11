const express = require('express');
const router = express.Router();


const protect = require('../../middleware/protectMiddleware');
const checkPermission = require('../../middleware/permissionMiddleware');
const { createFeatureInterest, getAllFeatureInterests, deleteFeatureInterest } = require('../../controllers/support/featureInterestController');


// Create a new Feature Interest (User shows interest in an AI Feature)
router.post(
    '/create',
    createFeatureInterest
);

// Get all Feature Interest records with search + pagination
router.get(
    '/all',
    protect,
    checkPermission("Feature Interest", "view"),
    getAllFeatureInterests
);

// Delete a Feature Interest
router.delete(
    '/delete/:id',
    protect,
    checkPermission("Feature Interest", "delete"),
    deleteFeatureInterest
);

module.exports = router;
