const { callProcedure } = require("../../../utils/procedure/callProcedure");
const { callProcedureChallenge } = require("../../../utils/procedure/callProcedureChallenge");
const Validation = require("../../../validations");

exports.createContestQuiz = async (req, res, next) => {
  try {
    const { activity_id, title, description, time_limit_seconds, max_attempts,
      is_warning, no_of_warning, qualify_percentage, show_answer, points_reward } = req.body;

    Validation.isInteger(activity_id, "Contest ID must be a valid integer.");
    Validation.isString(title, { min: 1, max: 255 }, "Title must be 1-255 characters.");
    if (description) Validation.isString(description, "Description must be String");
    Validation.isInteger(points_reward, "Points Reward must be a valid integer.");
    if (time_limit_seconds) Validation.isInteger(time_limit_seconds, "Time Limit Seconds must be a valid integer.");
    if (max_attempts) Validation.isInteger(max_attempts, "Max Attempts must be a valid integer.");
    Validation.isInteger(qualify_percentage, "Qualify Percentage must be a valid integer.");

    const { success, data, error } = await callProcedure("CreateContestQuiz", [
      activity_id || null, title?.trim(), description?.trim() || null,
      time_limit_seconds || null, max_attempts || null, is_warning || false, no_of_warning || 3,
      qualify_percentage || 70, show_answer || false, points_reward || null,
      req?.user?.id || 1
    ]);

    if (!success) return next(error);

    res.status(201).json({ success: true, message: "Contest quiz created successfully", quiz: data[0] });
  } catch (error) {
    next(error);
  }
};

exports.updateContestQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, time_limit_seconds, max_attempts,
      is_warning, no_of_warning, qualify_percentage, show_answer, points_reward } = req.body;

    if (max_attempts) Validation.isString(title, { min: 1, max: 255 }, "Title must be 1-255 characters.");
    if (description) Validation.isString(description, "Description must be String");
    if (points_reward) Validation.isInteger(points_reward, "Points Reward must be a valid integer.");
    if (time_limit_seconds) Validation.isInteger(time_limit_seconds, "Time Limit Seconds must be a valid integer.");
    if (max_attempts) Validation.isInteger(max_attempts, "Max Attempts must be a valid integer.");
    if (qualify_percentage) Validation.isInteger(qualify_percentage, "Qualify Percentage must be a valid integer.");

    const { success, data, error } = await callProcedure("UpdateContestQuiz", [
      id, title?.trim() || null, description?.trim() || null,
      time_limit_seconds || null, max_attempts || null, is_warning || false, no_of_warning || null,
      qualify_percentage || null, show_answer || false, points_reward || null,
      req?.user?.id || 1
    ]);

    if (!success) return next(error);

    res.status(200).json({ success: true, message: "Contest quiz updated successfully", quiz: data[0] });
  } catch (error) {
    next(error);
  }
};

exports.getContestQuizzById = async (req, res, next) => {
  try {
    const { quiz_id } = req.params;

    const { success, data, error } =
      await callProcedureChallenge("getContestQuizById", [quiz_id]);

    if (!success || !data || data.length < 1 || !Object.keys(data[0]).length) {
      return next(error);
    }

    // —formatting logic unchanged—
    const quizData = Object.values(data[0]);
    const fillBlanks = Object.values(data[1] || {});
    const mcqs = Object.values(data[2] || {});
    const mcqOptions = Object.values(data[3] || {});
    const trueFalseChallenges = Object.values(data[4] || {});

    const quiz = quizData[0];

    const mcqsWithOptions = mcqs.map(mcq => ({
      ...mcq,
      options: mcqOptions.filter(opt => opt.mcq_id === mcq.id)
    }));

    const formattedChallenge = {
      ...quiz,
      FillInTheBlanksChallenges: fillBlanks,
      MCQChallenges: mcqsWithOptions,
      TrueFalseChallenges: trueFalseChallenges
    };

    res.status(200).json({ success: true, data: formattedChallenge });
  } catch (error) { next(error); }
};

exports.toggleContestQuizStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { success, data, error } = await callProcedure("ToggleContestQuizStatus", [id]);

    if (!success) return next(error);

    res.status(200).json({ success: true, quiz: data[0] });
  } catch (error) {
    next(error);
  }
};

exports.deleteContestQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { success, error } = await callProcedure("DeleteContestQuiz", [id]);

    if (!success) return next(error);

    res.status(200).json({ success: true, message: "Contest quiz deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.getContestQuizzes = async (req, res, next) => {
  try {
    const { activity_id } = req.params;
    const { sortBy, status } = req.query;

    const { success, data, error } = await callProcedure("GetContestQuizzes", [
      activity_id,
      sortBy || null,
      status || null
    ]);

    if (!success) return next(error);

    res.status(200).json({ success: true, quizzes: data });
  } catch (error) {
    next(error);
  }
};
