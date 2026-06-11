const express = require('express');
const router = express.Router();
const termsController = require('../../controllers/legalPages/termsOfServiceController');
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");

router.post('/', protect, checkPermission("Terms Of Services", "create"), termsController.createTermsOfService);
router.put('/update/:id', protect, checkPermission("Terms Of Services", "edit"), termsController.updateTermsOfService);
router.get('/', protect, checkPermission("Terms Of Services", "view"), termsController.getAllTermsOfService);
router.get('/category/:category',  termsController.getTermsOfServiceByCategory);
router.patch('/toggle-status/:id', protect, checkPermission("Terms Of Services", "edit"), termsController.toggleTermsOfServiceStatus);
module.exports = router;
