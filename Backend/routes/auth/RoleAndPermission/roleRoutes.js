const express = require('express');
const router = express.Router();
const {
  createRole,
  updateRole,
  getAllRoles,
  getRoleById,
  deleteRole,
  toggleRoleStatus,
} = require('../../../controllers/auth/RoleAndPermission/roleController'); // Adjust path as needed
const checkPermission = require('../../../middleware/permissionMiddleware');
const protect = require('../../../middleware/protectMiddleware');

// Route to create a new role
router.post('/create', protect, checkPermission("Role", "create"), createRole);

// Route to update a role
router.put('/update/:id', protect, checkPermission("Role", "edit"), updateRole);

// Route to get all roles
router.get('/all', protect, checkPermission("Role", "view"), getAllRoles);

// Route to get a role by ID
router.get('/:id', protect, checkPermission("Role", "view"), getRoleById);

// Route to delete a role by ID
router.delete('/delete/:id', protect, checkPermission("Role", "delete"), deleteRole);

// Route to delete a role by ID
router.patch('/toggle/:id', protect, checkPermission("Role", "toggle"), toggleRoleStatus);

module.exports = router;
