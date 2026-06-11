// Get Completion Stats Across All Challenges using stored procedure
const { callProcedure } = require("../../utils/procedure/callProcedure");

// get completion stats across all challenges
exports.getCompletionStatsAcrossAllChallenges = async (req, res) => {
  try {
    const { type } = req.query;

    // Call stored procedure that calculates completion stats across all challenges
    const { success, data, error } = await callProcedure("getCompletionStatsAcrossAllChallenges", [type || "all"]);

    if (!success) {
      return res.status(500).json({ success: false, error });
    }

    const results = Array.isArray(data) ? data : [];

    const formatted = results.map(row => ({
      challenge_id: row.challenge_id,
      challenge_name: row.challenge_name,
      challenge_type: row.challenge_type,
      total_users: parseInt(row.total_users, 10),
      completed_users: parseInt(row.completed_users, 10),
      completion_rate: parseFloat(row.completion_rate)
    }));

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error("Error fetching completion stats across all challenges:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// comprehensive overview of user learning.
exports.getUserLearningOverview = async (req, res, next) => {
  try {
    // Call stored procedure that calculates the comprehensive overview of user learning
    const { success, data, error } = await callProcedure("getUserLearningOverview");

    if (!success) {
      return next(error);
    }

    const results = Array.isArray(data) ? data : [];

    // Format the results to be returned as a JSON response
    const formatted = results.map(row => ({
      user_id: row.user_id,
      user_name: row.user_name,
      total_challenges_attempted: parseInt(row.total_challenges_attempted, 10),
      total_challenges_completed: parseInt(row.total_challenges_completed, 10),
      total_daily_challenges_attempted: parseInt(row.total_daily_challenges_attempted, 10),
      total_daily_challenges_completed: parseInt(row.total_daily_challenges_completed, 10),
      daily_challenge_points_earned: parseInt(row.daily_challenge_points_earned, 10),
      total_points_earned: parseInt(row.total_points_earned, 10),
      average_progress_percentage: parseFloat(row.average_progress_percentage),
      max_streak_count: parseInt(row.max_streak_count, 10)
    }));

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error("Error fetching user learning overview:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

//average attempts required to complete challenges.
exports.getAttemptsRequiredToCompleteChallenges = async (req, res) => {
  try {
    // Call stored procedure that calculates the average attempts required to complete challenges
    const { success, data, error } = await callProcedure("getAttemptsRequiredToCompleteChallenges");

    if (!success) {
      return res.status(500).json({ success: false, error });
    }

    const results = Array.isArray(data) ? data : [];

    // Format the results to be returned as a JSON response
    const formatted = results.map(row => ({
      challenge_id: row.challenge_id,
      challenge_name: row.challenge_name,
      challenge_type: row.challenge_type,
      average_attempts: parseFloat(row.average_attempts)
    }));

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error("Error fetching attempts required to complete challenges:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Add to your controllers file
exports.getContestOverviewStats = async (req, res) => {
  try {

    // Call stored procedure that calculates contest overview stats
    const { success, data, error } = await callProcedure("getContestOverviewStats");

    if (!success) {
      return res.status(500).json({ success: false, error });
    }

    const results = Array.isArray(data) ? data : [];

    const formatted = results.map(row => ({
      contest_id: row.contest_id,
      contest_name: row.contest_name,
      banner_url: row.banner_url,
      contest_status: row.contest_status,
      total_participants: parseInt(row.total_participants, 10),
      completion_rate: parseFloat(row.completion_rate),
      avg_score: parseFloat(row.avg_score),
      drop_off_rate: parseFloat(row.drop_off_rate)
    }));

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error("Error fetching contest overview stats:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

exports.getContestAttemptAnalytics = async (req, res) => {
  try {

    const { success, data, error } = await callProcedure("getContestAttemptAnalytics");

    if (!success) {
      return res.status(500).json({ success: false, error });
    }

    const results = Array.isArray(data) ? data : [];

    const formatted = results.map(row => ({
      type: row.type, // quiz / coding
      item_id: Number(row.item_id),
      name: row.name,

      avg_attempts_per_user: row.avg_attempts_per_user
        ? Number(row.avg_attempts_per_user)
        : 0,

      completion_ratio: row.completion_ratio
        ? Number(row.completion_ratio)
        : 0,

      // 🔥 Optional derived fields (recommended)
      completion_percentage: row.completion_ratio
        ? Number((row.completion_ratio * 100).toFixed(2))
        : 0
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });

  } catch (error) {
    console.error("Error fetching activity attempt analytics:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};