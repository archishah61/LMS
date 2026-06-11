const express = require("express");
const bestOptionResponseController = require("../../controllers/content_management/bestOptionResponseContoller");
const protect = require("../../middleware/protectMiddleware");

const router = express.Router();

// ✅ Create BestOptionResponse (student submits answer)
router.post("/create", protect, bestOptionResponseController.createBestOptionResponse);

// ✅ Get all BestOptionResponses (for admin use)
router.get("/", bestOptionResponseController.getAllBestOptionResponses);

// ✅ Get responses by Question ID
router.get("/question/:question_id", bestOptionResponseController.getBestOptionResponsesByQuestionId);

// ✅ Get responses by Student ID
router.get("/student/:student_id", bestOptionResponseController.getBestOptionResponsesByStudentId);

// ✅ Update a BestOptionResponse by ID
router.put("/update/:id", protect, bestOptionResponseController.updateBestOptionResponse);

// ✅ Delete a BestOptionResponse by ID
router.delete("/delete/:id", protect, bestOptionResponseController.deleteBestOptionResponse);

module.exports = router;
