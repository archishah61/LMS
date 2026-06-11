const express = require('express');
const router = express.Router();
const contactController = require('../../controllers/support/contactController'); // Adjust the path as necessary
const protect = require('../../middleware/protectMiddleware');
const checkPermission = require('../../middleware/permissionMiddleware');

// Route to create a new contact
router.post('/', contactController.createContact);

// Route to get all contacts
router.get('/',protect, checkPermission("Contact","view"), contactController.getAllContacts);

// Route to delete a contact by ID
router.delete('/:id',protect, checkPermission("Contact","delete"), contactController.deleteContactById);

// Route to delete all contacts
router.delete('/',protect, checkPermission("Contact","delete"), contactController.deleteAllContacts);

// Route to mark a contact as read by ID
router.patch('/:id/read',protect, checkPermission("Contact","edit"), contactController.markContactAsReadById);

// Route to mark all contacts as read
router.patch('/read-all',protect, checkPermission("Contact","edit"), contactController.markAllContactsAsRead);

module.exports = router;
