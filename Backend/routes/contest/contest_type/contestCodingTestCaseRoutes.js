const express = require("express");
const testCaseController = require("../../../controllers/contest/contest_type/contestCodingTestCaseControllers");
const protect = require("../../../middleware/protectMiddleware");

const router = express.Router();

router.post("/", protect, testCaseController.createTestCase);
router.put("/:id", protect, testCaseController.updateTestCase);
router.patch("/:id/toggle", protect, testCaseController.toggleTestCaseStatus);
router.delete("/:id", protect, testCaseController.deleteTestCase);
router.get("/:coding_id", protect, testCaseController.getTestCases);

module.exports = router;
