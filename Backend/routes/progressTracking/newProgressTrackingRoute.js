const express = require('express');
const router = express.Router();
const {
    getAccessibleSessionsByCourseId,
    getAccessibleModulesBySessionId,
    getAccessibleTopicsByModuleId,
    getAccessibleQuizzesByModuleId,
    getAccessibleAssignmentsByModuleId,
    markTopicAsCompleted,
    getTopicTypeById,
    getDetailedTopicById,
    trackStudentTimeSpentOnTopic,
    getAccordianStatusByTopicId,
    updateAccordianCompletionStatus,
    createAccordianProgressRecordsForTopic,
    getSlideIdAndTitleByTopicId,
    getSlideContentBySlideId,
    createSlideProgressRecordsForTopic,
    updateSlideCompletionStatus,
    getSlideStatusByTopicId,
    getCourseCompletionProgress,
    getCourseFullDetails
} = require('../../progresTracking/newProgressTracking');
const upload = require('../../config/multerConfig');

// Route to get accessible sessions by course ID
router.get('/sessions/accessible', getAccessibleSessionsByCourseId);
router.get('/modules/accessible', getAccessibleModulesBySessionId);
router.get('/topics/accessible', getAccessibleTopicsByModuleId);
router.get('/quizzes/accessible', getAccessibleQuizzesByModuleId);
router.get('/assignments/accessible', getAccessibleAssignmentsByModuleId);
router.post('/topics/complete', markTopicAsCompleted);
router.get('/topics/type', getTopicTypeById);
router.get('/topics/details', getDetailedTopicById);
router.get('/topics/slides', getSlideIdAndTitleByTopicId);
router.get('/topics/slide-content', getSlideContentBySlideId)
router.post('/track-time', upload.none(), trackStudentTimeSpentOnTopic);
router.post('/create-accordian-status', createAccordianProgressRecordsForTopic);
router.get('/accordian-status', getAccordianStatusByTopicId);
router.post('/update-accordian-status', upload.none(), updateAccordianCompletionStatus);
router.post('/create-slide-status', createSlideProgressRecordsForTopic);
router.get('/slide-status', getSlideStatusByTopicId);
router.post('/update-slide-status', upload.none(), updateSlideCompletionStatus);
router.get('/course-progress', getCourseCompletionProgress);
router.get('/course-full-details', getCourseFullDetails);

module.exports = router;