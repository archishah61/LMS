const { callProcedure } = require("../../../utils/procedure/callProcedure");
const { callProcedureChallenge } = require("../../../utils/procedure/callProcedureChallenge");
const Validation = require("../../../validations");

exports.createContest = async (req, res, next) => {
  try {
    let {
      template_id, title, description, category_id, start_time, end_time,
      enrollment_start, enrollment_end, is_limites_participants,
      max_participants, enroll_by, enrollment_fee,
      mode, rules, banner_url
    } = req.body;

    Validation.isDate(start_time, "Start-time must be a valid ISO date.");
    Validation.isDate(end_time, "End-time must be a valid ISO date.");

    if (new Date(end_time) <= new Date(start_time)) {
      return res.status(400).json({
        success: false,
        message: "End Time must be after Start Time."
      });
    }

    // ✅ Optional checks
    if (enrollment_start) {
      Validation.isDate(enrollment_start, "Enrollment-start must be a valid ISO date.");
    }
    if (enrollment_end) {
      Validation.isDate(enrollment_end, "Enrollment-end must be a valid ISO date.");
    }

    // Enrollment period check
    if (enrollment_start && enrollment_end) {
      if (new Date(enrollment_end) <= new Date(enrollment_start)) {
        return res.status(400).json({
          success: false,
          message: "Enrollment End must be after Enrollment Start."
        });
      }
    }

    // Enrollment must finish before contest start
    if (enrollment_end && start_time) {
      if (new Date(enrollment_end) >= new Date(start_time)) {
        return res.status(400).json({
          success: false,
          message: "Enrollment End must be before Contest Start."
        });
      }
    }

    is_limites_participants = is_limites_participants == "true" || is_limites_participants == true || is_limites_participants == 1;

    banner_url = req.file ? "/contest/banner/" + req.file.filename : null;

    if (template_id) Validation.isInteger(template_id, "Template ID must be a valid integer");

    Validation.isString(title, { min: 1, max: 255 },
      "Title must be 1‑255 characters.");
    // if (description) {
    //   Validation.isString(description,
    //     "Description must be String");
    // }
    // if (rules) {
    //   Validation.isString(rules,
    //     "Rules must be String");
    // }

    Validation.isInteger(category_id, "Category ID must be a valid integer.");
    Validation.isEnum(mode, ["solo", "team", "mixed"],
      "Mode must be Solo, Team or Mixed.");
    Validation.isEnum(enroll_by, ["free", "points", "paid"], "Enroll By must be Free, Points or Paid");
    Validation.isBoolean(is_limites_participants, "Is limited Participants must be true or false.");

    if (is_limites_participants) Validation.checkIntegerMinMax(max_participants, { min: 1 }, "Max-participants must be an integer.");
    if (enroll_by !== "free") Validation.checkIntegerMinMax(enrollment_fee, { min: 1 }, "Enrollment Fee Points must be an integer.");

    const { success, data, error } = await callProcedure("CreateContest", [
      template_id || null, category_id, title?.trim(), description?.trim() || null, start_time, end_time,
      enrollment_start || null, enrollment_end || null,
      is_limites_participants || false, max_participants || null, enroll_by || false, enrollment_fee || null,
      mode, rules?.trim() || null,
      banner_url || null,
      req?.user?.id || 1
    ]);

    if (!success) return next(error);

    res.status(201).json({ success: true, message: "Contest created successfully", contest: data[0] });
  } catch (error) {
    next(error);
  }
};

exports.updateContest = async (req, res, next) => {
  try {
    const { id } = req.params;
    let {
      template_id, title, description, category_id, start_time, end_time,
      enrollment_start, enrollment_end, is_limites_participants,
      max_participants, enroll_by, enrollment_fee,
      mode, rules, banner_url
    } = req.body;

    if (start_time) Validation.isDate(start_time, "Start-time must be a valid ISO date.");
    if (end_time) Validation.isDate(end_time, "End-time must be a valid ISO date.");

    if (new Date(end_time) <= new Date(start_time)) {
      return res.status(400).json({
        success: false,
        message: "End Time must be after Start Time."
      });
    }

    // ✅ Optional checks
    if (enrollment_start) {
      Validation.isDate(enrollment_start, "Enrollment-start must be a valid ISO date.");
    }
    if (enrollment_end) {
      Validation.isDate(enrollment_end, "Enrollment-end must be a valid ISO date.");
    }

    // Enrollment period check
    if (enrollment_start && enrollment_end) {
      if (new Date(enrollment_end) <= new Date(enrollment_start)) {
        return res.status(400).json({
          success: false,
          message: "Enrollment End must be after Enrollment Start."
        });
      }
    }

    // Enrollment must finish before contest start
    if (enrollment_end && start_time) {
      if (new Date(enrollment_end) >= new Date(start_time)) {
        return res.status(400).json({
          success: false,
          message: "Enrollment End must be before Contest Start."
        });
      }
    }

    banner_url = req.file ? "/contest/banner/" + req.file.filename : null;

    is_limites_participants = is_limites_participants == "true" || is_limites_participants == true || is_limites_participants == 1;

    if (template_id) Validation.isInteger(template_id, "Template ID must be a valid integer");

    if (title) Validation.isString(title, { min: 1, max: 255 }, "Title must be 1‑255 characters.");
    // if (description) Validation.isString(description, "Description must be String");
    // if (rules) Validation.isString(rules, "Rules must be String");
    if (category_id) Validation.isInteger(category_id, "Category ID must be a valid integer.");
    if (mode) Validation.isEnum(mode, ["solo", "team", "mixed"], "Mode must be Solo, Team or Mixed.");

    Validation.isBoolean(is_limites_participants, "Is limited Participants must be true or false.");
    if (enroll_by) Validation.isEnum(enroll_by, ["free", "points", "paid"], "Enroll By must be Free, Points or Paid");

    if (is_limites_participants) Validation.checkIntegerMinMax(max_participants, { min: 1 }, "Max-participants must be an integer.");
    if (enroll_by !== "free") Validation.checkIntegerMinMax(enrollment_fee, { min: 1 }, "Enrollment Fee must be an integer.");

    const { success, data, error } = await callProcedure("UpdateContest", [
      id, template_id || null, category_id || null, title?.trim() || null, description?.trim() || null,
      start_time || null, end_time || null,
      enrollment_start || null, enrollment_end || null,
      is_limites_participants !== undefined ? is_limites_participants : null,
      max_participants || 0 || null, enroll_by || null,
      enrollment_fee || null, mode || null,
      rules?.trim() || null, banner_url || null,
      req?.user?.id || 1
    ]);

    if (!success) return next(error);

    res.status(200).json({ success: true, message: "Contest updated successfully", contest: data[0] });
  } catch (error) {
    next(error);
  }
};

exports.deleteContest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { success, error } = await callProcedure("DeleteContest", [id]);

    if (!success) return next(error);

    res.status(200).json({ success: true, message: "Contest deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.toggleContestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // pass new status
    const { success, data, error } = await callProcedure("ToggleContestStatus", [id, status]);

    if (!success) return next(error);

    res.status(200).json({ success: true, contest: data[0] });
  } catch (error) {
    next(error);
  }
};

exports.getContests = async (req, res, next) => {
  try {
    const { limit = "all", offset = "0", status, type, template_id, sortBy } = req.query;

    if (status && status.toLowerCase() !== 'all') Validation.isEnum(status, ["draft", "active", "ended", "cancelled"], 'Invalid status value');
    if (type && type.toLowerCase() !== 'all') Validation.isEnum(type, ["paid", "free", "points"], 'Invalid type');

    /* ---------- VALIDATION ---------- */
    if (limit !== "all" && limit !== "ALL") {
      Validation.isInteger(limit, "Limit must be a positive integer or 'all'.");
    }

    Validation.isInteger(offset, "Offset must be a non-negative integer.");
    /* --------------------------------- */

    const parsedLimit = limit === "all" ? "all" : Number(limit);
    const parsedOffset = Number(offset);

    const { success, data, error } = await callProcedureChallenge("GetContests", [
      template_id || null,
      status && status.toLowerCase() !== 'all' ? status : null,
      type ? type.toLowerCase() !== 'all' ? type.toLowerCase() : null : null,
      sortBy || null,
      limit === "all" ? 0 : parsedLimit,
      parsedOffset,
      limit === "all" || false
    ]);

    if (!success) return next(error);

    const meta = data[0][0];

    res.status(200).json({ success: true, data: Object.values(data[1]), pagination: { totalCount: meta?.total_count, totalPages: limit === "all" ? 1 : Math.ceil(meta?.total_count / parsedLimit) } });
  } catch (error) {
    next(error);
  }
};

exports.getActiveContests = async (req, res, next) => {
  try {
    const { template_id } = req.query;
    const { success, data, error } = await callProcedure("GetActiveContests", [template_id || null]);

    if (!success) return next(error);

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getContestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { success, data, error } = await callProcedure("GetContestById", [id]);

    if (!success) return next(error);
    if (!data || data.length === 0) return res.status(404).json({ success: false, message: "Contest not found" });

    res.status(200).json({ success: true, contest: data[0] });
  } catch (error) {
    next(error);
  }
};
