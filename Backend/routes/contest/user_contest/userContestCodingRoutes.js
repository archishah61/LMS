const express = require("express");
const userContestCodingController = require("../../../controllers/contest/user_contest/userContestCodingControllers");
const protect = require("../../../middleware/protectMiddleware");

const router = express.Router();

router.post("/attempt", protect, userContestCodingController.saveUserContestCodingAttempt);
router.get("/attempts/:coding_id", protect, userContestCodingController.getUserContestCodingAttempts);

module.exports = router;
