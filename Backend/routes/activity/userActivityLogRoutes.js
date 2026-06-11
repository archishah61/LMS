const express = require('express');
const router = express.Router();
const { getActivityLogDates, getActivityLogsByDate, getActivityLogMeta, exportActivityLogs } = require('../../controllers/activity/userActivityLogController');
const protect = require("../../middleware/protectMiddleware"); 

router.get('/dates', protect, getActivityLogDates); // paginated distinct dates
router.get('/date/:date', protect, getActivityLogsByDate); // logs for a single date
router.get('/meta', protect, getActivityLogMeta); // distinct categories/actions/metadata keys
router.get('/export', protect, exportActivityLogs); // CSV export

module.exports = router;
