const { callProcedure } = require("../../../utils/procedure/callProcedure");
const { callProcedureChallenge } = require("../../../utils/procedure/callProcedureChallenge");

exports.userContestEnroll = async (req, res, next) => {
  try {
    const { contest_id } = req.body;

    const user_id = req.user ? req.user.id : req.body.user_id ? req.body.user_id : null;

    const { success, data, error } = await callProcedure("EnrollUserInContest", [
      user_id, contest_id, null
    ]);

    if (!success) return next(error);

    res.status(201).json({ success: true, userContest: data[0] });
  } catch (error) {
    next(error);
  }
};

exports.getUserContestEnrollment = async (req, res, next) => {
  try {
    const { contest_id } = req.query;
    const user_id = req.user ? req.user.id : null;

    const { success, data, error } = await callProcedureChallenge("CheckUserContestEnrollment", [
      user_id,
      contest_id,
    ]);

    if (!success) return next(error);

    res.status(200).json({
      success: true,
      userContest: data[0][0]
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserEnrolledContests = async (req, res, next) => {
  try {
    const user_id = req.user ? req.user.id : null;

    const { success, data, error } = await callProcedure("getUserEnrolledContests", [user_id || null]);

    if (!success) return next(error);

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getLeaderboard = async (req, res, next) => {
  try {
    const { contest_id, time_filter = "all", category_filter = null, limit = 'all', offset = 0, user_id } = req.query;
    const userId = req.user ? req.user.id : null;
    
    // Call stored procedure
    const { success, data, error } = await callProcedureChallenge("getLeaderboard", [
      contest_id || null,   // contest id (nullable = global)
      userId || user_id || null,      // user id (nullable)
      time_filter,          // 'daily','weekly','monthly', 'yearly', 'all'
      category_filter || null,
      limit === "all" ? 0 : parseInt(limit, 10),  // pagination size
      parseInt(offset, 10),  // pagination offset
      limit === "all" || false
    ]);

    if (!success) return next(error);

    // data from SP comes as multiple result sets
    const leaderboard = Object.values(data[0]) || []; // first result: top N leaderboard
    const userDetails = data[1] ? data[1][0] : null; // second result: user details (if user_id passed)

    res.status(200).json({
      success: true,
      leaderboard,
      user: userDetails,
      pagination: {
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};
