const { callProcedure } = require("../../../utils/procedure/callProcedure");

exports.saveUserContestCodingAttempt = async (req, res, next) => {
  try {
    const user_id = req.user ? req.user.id : null;
    const {
      contest_id,
      coding_id,
      score,
      time_taken_seconds,
      status,
      meta,
    } = req.body;

    const { success, data, error } = await callProcedure("SaveUserContestCodingAttempt", [
      user_id,
      contest_id,
      coding_id,
      score,
      time_taken_seconds,
      status,
      JSON.stringify(meta || {}),
    ]);

    if (!success) return next(error);

    res.status(200).json({
      success: true,
      attempt: data[0],
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserContestCodingAttempts = async (req, res, next) => {
  try {
    const user_id = req.user ? req.user.id : null;
    const { coding_id } = req.params;

    const { success, data, error } = await callProcedure("GetUserContestCodingAttempts", [
      user_id,
      coding_id,
    ]);

    if (!success) return next(error);

    res.status(200).json({
      success: true,
      attempts: data,
    });
  } catch (error) {
    next(error);
  }
};
