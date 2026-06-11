const { callProcedure } = require("../../../utils/procedure/callProcedure");
const Validation = require("../../../validations");

// Create
exports.createActivity = async (req, res, next) => {
  try {
    const { contest_id, title, description, type, difficulty, points_reward } = req.body;

    Validation.isInteger(contest_id, "Contest ID must be a valid integer.");
    Validation.isEnum(type, ["quiz", "coding", "escape_room"], "Activity Type must be quiz, coding or escape_room.");
    Validation.isEnum(difficulty, ["easy", "medium", "hard", "expert"], "Difficulty must be easy, medium, hard or expert.");
    Validation.isString(title, { min: 1, max: 255 }, "Title must be 1-255 characters.");
    if (description) Validation.isString(description, "Description must be String");
    Validation.isInteger(points_reward, "Points Reward must be a valid integer.");

    const { success, data, error } = await callProcedure("CreateContestActivity", [
      contest_id, title?.trim(), description?.trim() || null, type, difficulty, points_reward || 0, req?.user?.id || 1
    ]);
    if (!success) return next(error);

    res.status(201).json({ success: true, message: "Activity created", activity: data[0] });
  } catch (err) { next(err); }
};

// Update
exports.updateActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, type, difficulty, points_reward } = req.body;

    if (type) Validation.isEnum(type, ["quiz", "coding", "escape_room"], "Activity Type must be quiz, coding or escape_room.");
    if (difficulty) Validation.isEnum(difficulty, ["easy", "medium", "hard", "expert"], "Difficulty must be easy, medium, hard or expert.");
    if (title) Validation.isString(title, { min: 1, max: 255 }, "Title must be 1-255 characters.");
    if (description) Validation.isString(description, "Description must be String");
    if (points_reward) Validation.isInteger(points_reward, "Points Reward must be a valid integer.");

    const { success, data, error } = await callProcedure("UpdateContestActivity", [
      id, title?.trim() || null, description?.trim() || null, type || null,
      difficulty || null, points_reward !== undefined ? points_reward : null,
      req?.user?.id || 1
    ]);
    if (!success) return next(error);

    res.status(200).json({ success: true, message: "Activity updated", activity: data[0] });
  } catch (err) { next(err); }
};

// Delete
exports.deleteActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { success, error } = await callProcedure("DeleteContestActivity", [id]);
    if (!success) return next(error);

    res.status(200).json({ success: true, message: "Activity deleted" });
  } catch (err) { next(err); }
};

// Toggle active
exports.toggleActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { success, data, error } = await callProcedure("ToggleContestActivityStatus", [id]);
    if (!success) return next(error);

    res.status(200).json({ success: true, activity: data[0] });
  } catch (err) { next(err); }
};

// Get by contest
exports.getActivitiesByContest = async (req, res, next) => {
  try {
    const { contest_id } = req.params;
    const { sortBy, type, difficulty } = req.query;

    const { success, data, error } = await callProcedure("GetContestActivitiesByContest", [
      contest_id,
      sortBy || null,
      type || null,
      difficulty || null
    ]);

    if (!success) return next(error);

    res.status(200).json({ success: true, activities: data });
  } catch (err) { next(err); }
};

// Optional: get by id
exports.getActivityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { success, data, error } = await callProcedure("GetContestActivityById", [id]);
    if (!success) return next(error);
    if (!data || data.length === 0) return res.status(404).json({ success: false, message: "Activity not found" });

    res.status(200).json({ success: true, activity: data[0] });
  } catch (err) { next(err); }
};
