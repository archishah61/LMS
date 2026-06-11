const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');
const { verifyToken } = require('../middleware/verifyToken');
const { uploadMiddleware } = require('../middleware/uploadMiddleware');

// --- Company Logo Routes ---
router.post('/logos', verifyToken, uploadMiddleware, testimonialController.createCompanyLogo);
router.get('/logos', testimonialController.getAllCompanyLogos);
router.put('/logos/:id', verifyToken, uploadMiddleware, testimonialController.updateCompanyLogo);
router.delete('/logos/:id', verifyToken, testimonialController.deleteCompanyLogo);

// --- Testimonial Routes ---
router.post('/testimonials', verifyToken, uploadMiddleware, testimonialController.createTestimonial);
router.get('/testimonials', testimonialController.getAllTestimonials);
router.put('/testimonials/:id', verifyToken, uploadMiddleware, testimonialController.updateTestimonial);
router.delete('/testimonials/:id', verifyToken, testimonialController.deleteTestimonial);



module.exports = router;
