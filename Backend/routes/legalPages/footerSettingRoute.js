const express = require('express');
const router = express.Router();
const {
    getFooterSettings,
    updateFooterField
} = require('../../controllers/legalPages/footerSettingController');
const protect = require('../../middleware/protectMiddleware');
const upload = require("../../config/multerConfig"); // Adjust the path as necessary
const checkPermission = require("../../middleware/permissionMiddleware");

const conditionalUpload = (req, res, next) => {
    const field = req.params.field;

    if (field === "footerLogo") {
        upload.single('footer-logo')(req, res, next);
    } else if (field === "headerLogo") {
        upload.single('header-logo')(req, res, next);
    } else {
        next();
    }
};

// Public route
router.get('/', getFooterSettings);

// Update individual field (protected)
router.put('/:field', protect, checkPermission("Footer", "edit"), conditionalUpload, updateFooterField);

module.exports = router;