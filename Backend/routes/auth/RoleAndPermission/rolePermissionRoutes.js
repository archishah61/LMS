const express = require('express');
const router = express.Router();
const {
    manageRolePermission,
    getRolePermissionsByRoleId,
} = require('../../../controllers/auth/RoleAndPermission/rolePermissionController'); // Adjust path as needed
const protect = require('../../../middleware/protectMiddleware');
const checkPermission = require('../../../middleware/permissionMiddleware');

// Route to create a new role
router.post('/manage', protect, manageRolePermission);

// Route to get all roles
router.get('/:id', protect, getRolePermissionsByRoleId);

module.exports = router;
