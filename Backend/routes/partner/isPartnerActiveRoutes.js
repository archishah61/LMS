// routes/partnerRoutes.js
const express = require("express");
const { togglePartnerStatus, getPartnerStatus } = require("../../controllers/partner/isPartnerActiveController");
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");
const router = express.Router();


// ✅ Toggle partner status (Active <-> Inactive)
router.patch("/:id/toggle",protect, checkPermission("Partner Active", "toggle"), togglePartnerStatus);

// ✅ Get partner status by ID
router.get("/:id", getPartnerStatus);

module.exports = router;
