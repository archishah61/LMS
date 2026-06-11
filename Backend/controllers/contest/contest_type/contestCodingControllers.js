const { callProcedure } = require("../../../utils/procedure/callProcedure");

exports.createContestCoding = async (req, res, next) => {
  try {
    const {
      activity_id,
      title,
      points_reward,
      max_attempts,
      is_warning,
      no_of_warning,
      problem_statement,
      constraints,
      sample_inputs_outputs,
      time_limit_seconds,
      memory_limit_mb,
      difficulty_level,
      allowed_languages,
      starter_code
    } = req.body;

    // 🔹 Normalize + stringify safely
    const params = [
      activity_id,
      title,
      points_reward,
      max_attempts,
      is_warning || false,
      no_of_warning || 3,
      problem_statement || null,
      constraints || null,
      sample_inputs_outputs ? JSON.stringify(sample_inputs_outputs) : null,
      time_limit_seconds || null,
      memory_limit_mb || null,
      difficulty_level || "easy",
      allowed_languages ? JSON.stringify(allowed_languages) : null,
      starter_code ? JSON.stringify(starter_code) : null,
      req?.user?.id || 1
    ];

    const { success, data, error } = await callProcedure("CreateContestCoding", params);

    if (!success) return next(error);

    res.status(201).json({ success: true, coding: data[0] });
  } catch (error) {
    next(error);
  }
};

exports.updateContestCoding = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      points_reward,
      max_attempts,
      is_warning,
      no_of_warning,
      problem_statement,
      constraints,
      sample_inputs_outputs,
      time_limit_seconds,
      memory_limit_mb,
      difficulty_level,
      allowed_languages,
      starter_code
    } = req.body;

    // 🔹 Normalize + stringify safely
    const params = [
      id,
      title,
      points_reward,
      max_attempts,
      is_warning || false,
      no_of_warning || 3,
      problem_statement || null,
      constraints || null,
      sample_inputs_outputs ? JSON.stringify(sample_inputs_outputs) : null,
      time_limit_seconds || null,
      memory_limit_mb || null,
      difficulty_level || null,
      allowed_languages ? JSON.stringify(allowed_languages) : null,
      starter_code ? JSON.stringify(starter_code) : null,
      req?.user?.id || 1
    ];

    const { success, data, error } = await callProcedure("UpdateContestCoding", params);

    if (!success) return next(error);

    res.status(200).json({ success: true, coding: data[0] });
  } catch (error) {
    next(error);
  }
};

exports.toggleContestCodingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { success, data, error } = await callProcedure("ToggleContestCodingStatus", [id]);

    if (!success) return next(error);

    res.status(200).json({ success: true, coding: data[0] });
  } catch (error) {
    next(error);
  }
};

exports.deleteContestCoding = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { success, error } = await callProcedure("DeleteContestCoding", [id]);

    if (!success) return next(error);

    res.status(200).json({ success: true, message: "Contest coding deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.getContestCodingByActivity = async (req, res, next) => {
  try {
    const { activity_id } = req.params;
    const { success, data, error } = await callProcedure("GetContestCodingByActivity", [activity_id]);

    if (!success) return next(error);

    res.status(200).json({ success: true, data: data });
  } catch (error) {
    next(error);
  }
};

exports.getContestCodingById = async (req, res, next) => {
  try {
    const { coding_id } = req.params;
    const { success, data, error } = await callProcedure("GetContestCodingById", [coding_id || null]);

    if (!success) return next(error);

    res.status(200).json({ success: true, coding: data[0] });
  } catch (error) {
    next(error);
  }
};
