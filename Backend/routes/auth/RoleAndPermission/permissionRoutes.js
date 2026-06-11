const express = require('express');
const router = express.Router();
const {
  getAllPermissions,
} = require('../../../controllers/auth/RoleAndPermission/permissionController'); // Adjust path as needed
const protect = require('../../../middleware/protectMiddleware');
const checkPermission = require('../../../middleware/permissionMiddleware');


// Route to get all permissions
router.get('/all', protect, checkPermission("Permission", "view"), getAllPermissions);

module.exports = router;
