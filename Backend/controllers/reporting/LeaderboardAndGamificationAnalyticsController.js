const { callProcedure } = require("../../utils/procedure/callProcedure");
const { callProcedureChallenge } = require("../../utils/procedure/callProcedureChallenge");
const Validation = require("../../validations");

//get Top Performer By challenge category
exports.getTopPerformersByChallengeCategory = async (req, res) => {
  try {
    // Call the stored procedure that calculates the top performers by challenge category
    const { success, data, error } = await callProcedure("getTopPerformersByChallengeCategory");

    if (!success) {
      return res.status(500).json({ success: false, error });
    }

    const results = Array.isArray(data) ? data : [];

    // Group results by category
    const groupedByCategory = [];

    // Create a map to group users by category
    const categoryMap = {};

    results.forEach((row) => {
      const category = row.category;
      if (!categoryMap[category]) {
        categoryMap[category] = [];
      }

      categoryMap[category].push({
        user_id: row.user_id,
        user_name: row.user_name,
        email: row.email,
        profile_image: row.profile_image,  // Include the profile_image field
        total_points: row.total_points
      });
    });

    // Format the output with sorted students per category
    for (const category in categoryMap) {
      const sortedStudents = categoryMap[category].sort((a, b) => b.total_points - a.total_points);

      groupedByCategory.push({
        category_name: category,
        student_list: sortedStudents
      });
    }

    return res.status(200).json({
      success: true,
      data: groupedByCategory
    });
  } catch (error) {
    console.error("Error fetching top performers by challenge category:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get users with highest points using stored procedure
exports.getUsersWithHighestPoints = async (req, res, next) => {
  try {
    const { success, data, error } = await callProcedure("getUsersWithHighestPoints");

    if (!success) {
      return next(error);
    }

    const results = Array.isArray(data) ? data : [];

    return res.status(200).json({
      success: true,
      data: results.map(row => ({
        user_id: row.user_id,
        full_name: row.user_name,
        email: row.email,
        profile_image: row.profile_image,  // Include the profile_image field
        total_points: row.total_points,
        points_earned: row.total_earned,
        current_streak: row.current_streak,
        longest_streak: row.longest_streak,
        completed_challenges: row.completed_challenges
          ? row.completed_challenges.split(', ')
          : []
      }))
    });

  } catch (error) {
    console.error("Error fetching users with highest points:", error);
    return next(error)
  }
};

exports.getTopUsersAndUserRank = async (req, res, next) => {
  try {
    let { id } = req.params;

    Validation.isInteger(id, "User ID must be a valid integer.");
    const { success, data, error } = await callProcedureChallenge('GetTopUsersAndUserRank', [
      id,
    ]);

    if (!success) {
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "User ranked successfully.",
      topRankers: Object.values(data[0]),
      userRank: Object.values(data[1])
    });
  } catch (error) { next(error); }
};

exports.getDailyChallengeRank = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    Validation.isInteger(userId, "User ID must be a valid integer.");
    const { success, data, error } = await callProcedureChallenge('getDailyChallengeRank', [
      userId,
      'all',
      null,
      'month'
    ]);

    if (!success) {
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "User ranked successfully.",
      topRankers: Object.values(data[0]),
      userRank: Object.values(data[1])
    });
  } catch (error) { next(error); }
};