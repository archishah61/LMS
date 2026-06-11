const express = require("express");
const router = express.Router();
const protect = require("../../middleware/protectMiddleware");
const { generateInterviewController, evaluateInterviewController } = require("../../controllers/AI_Interview/interviewQueAnsController");
const { createCompleteInterviewEvaluation, getCompleteEvaluationsByUserId, getCompleteEvaluationsByUserCategoryAndRole, getAttemptsToday, logInterviewDownload } = require("../../controllers/AI_Interview/interviewEvaluationController");
const checkFeature = require("../../middleware/featureCheckMiddleware");

router.use(checkFeature("interview_ai"));
router.use(protect);

router.post("/gen-que",  generateInterviewController);
router.post("/evaluate", evaluateInterviewController);

router.post('/complete-evaluation', createCompleteInterviewEvaluation);
router.get('/complete-evaluation/', getCompleteEvaluationsByUserId);
router.get('/evaluations/full-filtered', getCompleteEvaluationsByUserCategoryAndRole);
router.get('/attempts-today', getAttemptsToday);
router.post('/log-download', logInterviewDownload);

module.exports = router;
