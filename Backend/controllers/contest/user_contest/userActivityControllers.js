const { callProcedure } = require("../../../utils/procedure/callProcedure");

exports.startContestActivity = async (req, res, next) => {
  try {
    const { contest_id, activity_id } = req.body;
    const user_id = req.user ? req.user.id : null;

    const { success, data, error } = await callProcedure("StartContestActivity", [
      user_id,
      contest_id,
      activity_id
    ]);

    if (!success) return next(error);

    res.status(200).json({
      success: true,
      contestActivity: data[0],
    });
  } catch (error) {
    next(error);
  }
};

exports.startContestQuiz = async (req, res, next) => {
  try {
    const { contest_id, quiz_id } = req.body;
    const user_id = req.user ? req.user.id : null;

    const { success, data, error } = await callProcedure("StartContestQuiz", [
      user_id,
      contest_id,
      quiz_id
    ]);

    if (!success) return next(error);

    res.status(200).json({
      success: true,
      contestQuiz: data[0],
    });
  } catch (error) {
    next(error);
  }
};

exports.startContestCoding = async (req, res, next) => {
  try {
    const { contest_id, coding_id } = req.body;
    const user_id = req.user ? req.user.id : null;

    const { success, data, error } = await callProcedure("StartContestCoding", [
      user_id,
      contest_id,
      coding_id
    ]);

    if (!success) return next(error);

    res.status(200).json({
      success: true,
      contestCoding: data[0],
    });
  } catch (error) {
    next(error);
  }
};

exports.checkContestQuiz = async (req, res, next) => {
  try {
    const { contest_quiz_id, answers, user_contest_activity_id } = req.body;

    const sanitizedAnswers = answers.map(a => ({
      ...a,
      userAnswer: typeof a.userAnswer === "boolean"
        ? (a.userAnswer ? 1 : 0)
        : a.userAnswer
    }));

    const { success, data, error } = await callProcedure("checkContestQuiz", [
      user_contest_activity_id,
      contest_quiz_id,
      JSON.stringify(sanitizedAnswers)
    ]);

    if (!success) return next(error);

    res.status(200).json({
      success: true,
      result: data[0],
    });
  } catch (error) {
    next(error);
  }
};
