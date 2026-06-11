const express = require('express');
const partnerController = require('../../controllers/partner/partnerController');
const upload = require('../../config/multerConfig');
const protect = require('../../middleware/protectMiddleware');
const checkPermission = require('../../middleware/permissionMiddleware');
const checkFeature = require('../../middleware/featureCheckMiddleware');

const router = express.Router();

// Public routes
router.post('/login', partnerController.partnerLogin);
router.post('/logout', partnerController.partnerLogout);

// Routes requiring authentication
router.post(
  '/create',
  checkFeature("become_a_partner"),
  upload.none(),
  checkPermission("Partner", "create"),
  protect,
  partnerController.createPartner
);

router.get('/', protect, checkPermission("Partner", "view"), partnerController.getAllPartners);
router.get('/:id', protect, checkPermission("Partner Detail", "view"), partnerController.getPartnerById);

router.put(
  '/update/:id',
  protect,
  checkPermission("Partner Detail", "edit"),
  upload.single('logo'),
  partnerController.updatePartner
);

router.put(
  '/update-status/:id',
  protect,
  checkPermission("Partner", "toggle"),
  partnerController.updatePartnerStatus
);

router.put(
  '/update-password/:id',
  protect,
  checkPermission("Partner Detail", "edit"),
  partnerController.changePassword
);

router.put(
  '/forgot-password',
  partnerController.forgotPassword
);

module.exports = router;