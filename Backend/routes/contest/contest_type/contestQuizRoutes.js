const express = require("express");
const contestQuizController = require("../../../controllers/contest/contest_type/contestQuizControllers");
const protect = require("../../../middleware/protectMiddleware");
const checkPermission = require("../../../middleware/permissionMiddleware");

const router = express.Router();

// Contest Quiz Routes
router.post("/", protect, checkPermission("Contest Quiz", "create"), contestQuizController.createContestQuiz);
router.put("/:id", protect, checkPermission("Contest Quiz", "edit"), contestQuizController.updateContestQuiz);
router.patch("/:id/toggle", protect, checkPermission("Contest Quiz", "toggle"), contestQuizController.toggleContestQuizStatus);
router.delete("/:id", protect, checkPermission("Contest Quiz", "delete"), contestQuizController.deleteContestQuiz);
router.get("/questions/:quiz_id", protect, checkPermission("Contest Quiz", "view"), contestQuizController.getContestQuizzById);
router.get("/:activity_id", protect, checkPermission("Contest Quiz", "view"), contestQuizController.getContestQuizzes);

module.exports = router;
