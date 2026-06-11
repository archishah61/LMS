const express = require("express");
const router = express.Router();
const { getEstimatedVsActualCompletionTimes  } = require("../../controllers/reporting/TimeBasedAnalyticsController"); // Adjust path as needed
const protect = require("../../middleware/protectMiddleware");

router.use(protect);

//Get actual time and extimated time 
router.get("/estimated-vs-actual-completion", getEstimatedVsActualCompletionTimes);


module.exports = router;
