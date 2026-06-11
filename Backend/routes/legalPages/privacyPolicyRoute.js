const express = require('express');
const router = express.Router();
const privacyController = require('../../controllers/legalPages/privacyPolicyController');
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");

router.post('/', protect, checkPermission("Privacy Policy", "create"),  privacyController.createPrivacyPolicy);
router.put('/update/:id',protect, checkPermission("Privacy Policy", "edit"), privacyController.updatePrivacyPolicy);
router.patch("/:id",protect,checkPermission("Privacy Policy","toggle") ,privacyController.togglePrivacyPolicyStatus);
router.get('/', protect, checkPermission("Privacy Policy", "view"),  privacyController.getAllPrivacyPolicies);
router.get('/category/:category',  privacyController.getPrivacyPolicyByCategory);

module.exports = router;
