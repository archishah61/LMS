const express = require("express");
const userContestController = require("../../../controllers/contest/user_contest/userContestControllers");
const protect = require("../../../middleware/protectMiddleware");
const checkFeature = require("../../../middleware/featureCheckMiddleware");

const router = express.Router();

router.post("/enroll", checkFeature("contest"), protect, userContestController.userContestEnroll);
router.get("/enrolled-all", checkFeature("contest"), protect, userContestController.getUserEnrolledContests);
router.get("/enrolled", checkFeature("contest"), protect, userContestController.getUserContestEnrollment);
// router.get("/leaderboard", protect, userContestController.getLeaderboard); // To Restrict Users From Showing Leaderboard without Authentication
router.get("/leaderboard", checkFeature("contest"), userContestController.getLeaderboard);

module.exports = router;
