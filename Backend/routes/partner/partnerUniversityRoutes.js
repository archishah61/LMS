const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middleware/verifyToken");

const {
    createPartnerUniversity,
    getPartnerUniversity,
    updatePartnerUniversity,
    deletePartnerUniversity,
    getAllPartnersUniversity
  } = require("../../controllers/partner/partnerUniversityController");

// University Partner Routes
router.post("/",  verifyToken, createPartnerUniversity);
router.get("/:id",  verifyToken, getPartnerUniversity);
router.put("/:id",  verifyToken, updatePartnerUniversity);
router.delete("/:id",  verifyToken, deletePartnerUniversity);
router.get("/",  verifyToken, getAllPartnersUniversity);

module.exports = router;