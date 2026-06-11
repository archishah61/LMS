const { callProcedure } = require("../../../utils/procedure/callProcedure");

exports.saveUserContestQuizAttempt = async (req, res, next) => {
  try {
    const user_id = req.user ? req.user.id : null;
    const {
      contest_id,
      quiz_id,
      score,
      percentage,
      time_taken_seconds,
      status,
      meta,
    } = req.body;

    const { success, data, error } = await callProcedure("SaveUserContestQuizAttempt", [
      user_id,
      contest_id,
      quiz_id,
      score,
      percentage,
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

exports.getUserContestQuizAttempts = async (req, res, next) => {
  try {
    const user_id = req.user ? req.user.id : null;
    const { quiz_id } = req.params;

    const { success, data, error } = await callProcedure("GetUserContestQuizAttempts", [
      user_id,
      quiz_id,
    ]);

    if (!success) return next(error);

    const processedAttempts = data.map((attempt) => {
      // If show_answer is 0/false, remove correct answers from meta
      if (!attempt.show_answer || attempt.show_answer === 0) {
        if (attempt.meta && Array.isArray(attempt.meta)) {
          attempt.meta = attempt.meta.map((q) => {
            const { correctAnswer, ...rest } = q;
            return rest;
          });
        }
      }
      return attempt;
    });

    res.status(200).json({
      success: true,
      attempts: processedAttempts,
    });
  } catch (error) {
    next(error);
  }
};
