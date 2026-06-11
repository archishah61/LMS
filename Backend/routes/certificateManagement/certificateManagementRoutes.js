const express = require('express');
const router = express.Router();
const certificateManagementController = require("../../controllers/certificateManagement/certificateManagementController");

// Routes for managing certificate templates
router.post('/certificate-templates', certificateManagementController.createCertificateTemplate);
router.get('/certificate-templates', certificateManagementController.getCertificateTemplates);
router.put('/certificate-templates/:id', certificateManagementController.updateCertificateTemplate); // Add update route
router.delete('/certificate-templates/:id', certificateManagementController.deleteCertificateTemplate); // Add delete route


// Routes for managing issued certificates
router.post('/issued-certificates', certificateManagementController.createIssuedCertificate);
router.get('/issued-certificates', certificateManagementController.getIssuedCertificates);
router.get('/issued-certificates/:id', certificateManagementController.getIssuedCertificateById);
router.put('/issued-certificates/:id', certificateManagementController.updateIssuedCertificate); // Add update route
router.delete('/issued-certificates/:id', certificateManagementController.deleteIssuedCertificate); // Add delete route

module.exports = router;
