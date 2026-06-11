const express = require('express');
const router = express.Router();
const summaryController = require('../../controllers/aiSummary/summaryController');
const protect = require("../../middleware/protectMiddleware");

router.use(protect);

// Route to create a new summary
router.post('/summaries', summaryController.createSummary);

// Route to get summaries by GeneralMaterial description ID
router.get('/summaries/topic/:topic_id/general-material-desc/:general_material_desc_id', summaryController.getSummariesByGeneralMaterialDescId);

// Route to get summaries by GeneralMaterial PDF ID
router.get('/summaries/topic/:topic_id/general-material-pdf/:general_material_pdf_id', summaryController.getSummariesByGeneralMaterialPdfId);

// Route to get summaries by Accordion ID
router.get('/summaries/topic/:topic_id/accordion/:accordion_id', summaryController.getSummariesByAccordionId);

// Route to get summaries by MultiSlideGeneral description ID
router.get('/summaries/topic/:topic_id/multi-slide-general-desc/:multi_slide_general_desc_id', summaryController.getSummariesByMultiSlideGeneralDescId);

// Route to get summaries by MultiSlideGeneral PDF ID
router.get('/summaries/topic/:topic_id/multi-slide-general-pdf/:multi_slide_general_pdf_id', summaryController.getSummariesByMultiSlideGeneralPdfId);

// Route to get summaries by MultiSlideAccordion ID
router.get('/summaries/topic/:topic_id/multi-slide-accordion/:multi_slide_accordion_id', summaryController.getSummariesByMultiSlideAccordionId);


module.exports = router;