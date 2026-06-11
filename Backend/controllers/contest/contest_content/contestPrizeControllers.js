const { callProcedure } = require("../../../utils/procedure/callProcedure");
const Validation = require("../../../validations");

exports.createContestPrize = async (req, res, next) => {
  try {
    const { contest_id, prize_type, position_start, position_end, prize_points, prize_description } = req.body;

    Validation.isInteger(contest_id, "Category ID must be a valid integer.");
    Validation.isEnum(prize_type, ["position", "range"], "Prize Type must be Single Position or Range Position.");

    Validation.isInteger(position_start, "Position Start must be a valid integer.");
    if (prize_type === "range" || position_end) Validation.isInteger(position_end, "Position End must be a valid integer.");
    Validation.isInteger(prize_points, "Prize Points must be a valid integer.");
    if (prize_description) Validation.isString(prize_description, "Prize Description must be a String");

    const { success, data, error } = await callProcedure("CreateContestPrize", [
      contest_id, prize_type, position_start || null, position_end || null,
      prize_points || null, prize_description || null, req?.user?.id || 1
    ]);

    if (!success) return next(error);

    res.status(201).json({ success: true, message: "Contest prize created successfully", prize: data[0] });
  } catch (error) {
    next(error);
  }
};

exports.updateContestPrize = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { prize_type, position_start, position_end, prize_points, prize_description } = req.body;

    Validation.isInteger(id, "Prize ID must be a valid integer.");
    if (prize_type) Validation.isEnum(prize_type, ["position", "range"], "Prize Type must be Single Position or Range Position.");

    if (position_start) Validation.isInteger(position_start, "Position Start must be a valid integer.");
    if (prize_type === "range" || position_end) Validation.isInteger(position_end, "Position End must be a valid integer.");
    if (prize_points) Validation.isInteger(prize_points, "Prize Points must be a valid integer.");
    if (prize_description) Validation.isString(prize_description, "Prize Description must be a String");

    const { success, data, error } = await callProcedure("UpdateContestPrize", [
      id, prize_type || null, position_start || null, position_end || null,
      prize_points || null, prize_description || null, req?.user?.id || 1
    ]);

    if (!success) return next(error);

    res.status(200).json({ success: true, message: "Contest prize updated successfully", prize: data[0] });
  } catch (error) {
    next(error);
  }
};

exports.toggleContestPrizeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { success, data, error } = await callProcedure("ToggleContestPrizeStatus", [id]);

    if (!success) return next(error);

    res.status(200).json({ success: true, prize: data[0] });
  } catch (error) {
    next(error);
  }
};

exports.deleteContestPrize = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { success, error } = await callProcedure("DeleteContestPrize", [id]);

    if (!success) return next(error);

    res.status(200).json({ success: true, message: "Contest prize deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.getContestPrizes = async (req, res, next) => {
  try {
    const { contest_id } = req.params;

    const { success, data, error } = await callProcedure("GetContestPrizes", [contest_id]);

    if (!success) return next(error);

    res.status(200).json({ success: true, prizes: data });
  } catch (error) {
    next(error);
  }
};
