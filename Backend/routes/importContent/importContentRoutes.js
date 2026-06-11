const express = require('express');
const router = express.Router();
const { importAllCourses, importSessionByCourseId, importModulesBySessionId, importTopicsByModuleId, saveImportedSessions, saveImportedModules, saveImportedTopics } = require('../../controllers/importContent/importContentController');
const protect = require('../../middleware/protectMiddleware');


router.post("/sessions", saveImportedSessions);
router.post("/modules", saveImportedModules);
router.post("/topics", saveImportedTopics);

router.get("/courses", protect, importAllCourses),
router.get("/sessions/:courseId", importSessionByCourseId),
router.get("/modules/:sessionId", importModulesBySessionId),
router.get("/topics/:moduleId", importTopicsByModuleId),

module.exports = router