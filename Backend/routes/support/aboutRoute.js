const express = require('express');
const { createAbout, updateAbout, updateAboutStatus, getAllAbout, deleteAbout } = require('../../controllers/support/aboutController');
const router = express.Router();
const upload = require("../../config/multerConfig"); // Adjust the path as necessary
const protect = require('../../middleware/protectMiddleware');
const checkPermission = require('../../middleware/permissionMiddleware');

router.post('/', protect, checkPermission("About", "create"), upload.fields([
    { name: "aboutImg", maxCount: 1 }
]), createAbout);

router.put('/:id', protect, checkPermission("About", "edit"),  upload.fields([
    { name: "aboutImg", maxCount: 1 }
]), updateAbout);

router.patch('/update-status/:id', protect, checkPermission("About", "toggle"), updateAboutStatus);

router.get('/', getAllAbout);

router.delete('/:id', protect, checkPermission("About", "delete"),  deleteAbout);

module.exports = router;
