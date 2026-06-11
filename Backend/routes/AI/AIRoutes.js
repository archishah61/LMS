const express = require('express');
const router = express.Router();
const {
  textToSpeech,
} = require('../../controllers/AI/textToSpeechController'); // Adjust path as needed
const protect = require('../../middleware/protectMiddleware');
const upload = require('../../config/multerConfig');
const { courseContentGenerater, courseContentGeneraterByType } = require('../../controllers/AI/courseContentGeneraterController');
const customCourseGenerator = require('../../controllers/AI/customCourseGeneratorController');
const { uploadMiddleware } = require('../../middleware/uploadMiddleware');
const { chatBot } = require('../../controllers/AI/AI');
const { voiceAssistant } = require('../../controllers/AI/VoiceAssistantController');
const { mathSolver, getUserMathHistory } = require('../../controllers/AI/MathSolverController');
const { courseContentRegenerator } = require('../../controllers/AI/courseContentRegenerator');
const { initializeLearningPath, processUserResponses, generateComprehensiveUniversalRoadmap, getGoalUpdates, getUserLearningPaths, getLearningPathDetails, resumeLearningPath } = require('../../controllers/AI/LearningPathController');
const { evaluateAnswer } = require('../../controllers/AI/answerCheckController');
const { generateAdminCourse, regenerateAdminCourseStructure } = require('../../controllers/AI/adminCourseGeneratorController');
const { generateNewCourse, saveGeneratedCourse, generateCourseContent, saveGeneratedCourseContent, regenerateNode, regenerateNodeContent, regenerateQuiz, saveGeneratedQuizContent, saveGeneratedAssignmentContent, regenerateAssignment } = require('../../controllers/AI/newCourseGeneratorController');
const checkFeature = require('../../middleware/featureCheckMiddleware');

// Route to create a new role
router.post('/text-to-speech', textToSpeech);

router.post(
  "/custom-course-structure",
  checkFeature("do_your_own_course_ai"),
  protect,
  upload.array("contentFiles", 10),
  customCourseGenerator.courseContentGenerater
);

router.post(
  "/custom-course",
  checkFeature("do_your_own_course_ai"),
  protect,
  // upload.array("contentFiles", 10),
  customCourseGenerator.confirmAndGenerateCourse
);

router.post(
  "/generate-course-structure",
  upload.array("contentFiles", 10),
  generateAdminCourse
);

router.post(
  "/regenerate-course-structure",
  upload.array("contentFiles", 10),
  regenerateAdminCourseStructure
);

// New AI Course Generator (Quick / Complete modes)
router.post(
  "/new-generate-course",
  upload.single("referenceFile"),
  generateNewCourse
);

router.post(
  "/new-save-course",
  // protect,
  saveGeneratedCourse
);

router.post(
  "/new-generate-course-content",
  // protect, // You can un-comment protect if required later
  generateCourseContent
);

router.post(
  "/new-save-course-content",
  // protect,
  saveGeneratedCourseContent
);

router.post(
  "/new-regenerate-node",
  regenerateNode
);

router.post(
  "/new-regenerate-node-content",
  regenerateNodeContent
);

router.post(
  "/new-save-quiz-content",
  saveGeneratedQuizContent
);

router.post(
  "/new-regenerate-quiz",
  regenerateQuiz
);

router.post(
  "/new-save-assignment-content",
  saveGeneratedAssignmentContent
);

router.post(
  "/new-regenerate-assignment",
  regenerateAssignment
);

router.post(
  "/generate-content",
  upload.array("contentFiles", 10),
  courseContentGenerater
);

router.post(
  "/regenerate-content",
  upload.array("contentFiles", 10),
  courseContentRegenerator
);
router.post(
  "/generate-content-by-type",
  upload.single("contentPDF"),
  courseContentGeneraterByType
);

router.post("/evaluate", protect, upload.single("speakingAudio"), evaluateAnswer);

router.post('/chat-bot', checkFeature("chatbot_ai"), protect, uploadMiddleware, chatBot);

router.post('/voice-assistant', protect, voiceAssistant);

router.get('/solve-math/history', checkFeature("maths_solver"), protect, getUserMathHistory);

router.post('/solve-math', checkFeature("maths_solver"), protect, upload.single('mathImage'), mathSolver);

router.post('/learning-path-agent/initialize', checkFeature("learning_path_ai"), protect, initializeLearningPath);

router.post('/learning-path-agent/process-responses', checkFeature("learning_path_ai"), protect, processUserResponses);

router.post('/learning-path-agent/generate-roadmap', checkFeature("learning_path_ai"), protect, generateComprehensiveUniversalRoadmap);

router.get('/learning-path-agent/exam-updates', checkFeature("learning_path_ai"), protect, getGoalUpdates);

router.get('/learning-path-agent/history', checkFeature("learning_path_ai"), protect, getUserLearningPaths);

router.post('/learning-path-agent/:sessionId/resume', checkFeature("learning_path_ai"), protect, resumeLearningPath);

router.get('/learning-path-agent/:sessionId', checkFeature("learning_path_ai"), protect, getLearningPathDetails);

module.exports = router;
