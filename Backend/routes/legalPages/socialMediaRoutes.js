const express = require('express');
const router = express.Router();
const protect = require('../../middleware/protectMiddleware');
const {
    getAllSocialLinks,
    updateSocialLink
} = require('../../controllers/legalPages/socialMediaController');
const checkPermission = require("../../middleware/permissionMiddleware");

// Public routes
router.get('/', getAllSocialLinks);

// Protected routes (require authentication)
router.put('/:platform', protect,checkPermission("Social Media","edit"), updateSocialLink);


module.exports = router;
