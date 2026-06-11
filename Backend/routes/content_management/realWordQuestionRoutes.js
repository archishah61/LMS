const express = require("express");
const realWordController = require("../../controllers/content_management/realWordQuestionController");
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");
 
const router = express.Router();
 
// ✅ Generate 10 shuffled words (5 real, 5 fake)
router.get("/random-real-word-quiz", realWordController.getRandomRealWordQuiz);
 
// ✅ Bulk create real word questions (expects array of words + answers)
router.post("/", protect, checkPermission("Real Word Question", "create"), realWordController.createRealWordQuestions);
 
// ✅ Get by quiz ID
router.get("/quiz/:quiz_id", protect, checkPermission("Real Word Question", "view"), realWordController.getRealWordQuestionByQuizId);

// Change from PUT to DELETE
router.delete("/delete-word/:id", protect, checkPermission("Real Word Question", "delete"), realWordController.deleteWordFromRealWordQuestion);
 
module.exports = router;