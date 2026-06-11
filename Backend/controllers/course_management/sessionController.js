// controllers/sessionController.js
const Course = require("../../models/course_management/course");
const Session = require("../../models/course_management/session");
const { callProcedure } = require("../../utils/procedure/callProcedure");
const Validation = require("../../validations");          // ⬅️ NEW

// ------------------------------------------------------------------
// Create Session
// ------------------------------------------------------------------
exports.createSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const {
      course_id,           // course public_hash (string)
      title,
      // status,
      is_points_rewarded_on_completion = false,
      points_rewarded_on_completion,
      min_time_in_minute,
    } = req.body;

    // -------- validation ----------------------------------------------------
    Validation.isString(course_id, { min: 1, max: 255 }, "Course hash is required.");

    if (title !== undefined) {
      Validation.isString(title, { min: 1, max: 200 }, "Title must be a non‑empty string.");
    }

    // if (status !== undefined) {
    //   Validation.isEnum(status, ["active", "inactive"], "Status must be 'active' or 'inactive'.");
    // }

    if (min_time_in_minute !== undefined) {
      Validation.isInteger(min_time_in_minute, "Min time (minutes) must be an integer.");
      Validation.checkIntegerMinMax(min_time_in_minute, { min: 0 }, "Min time must be ≥ 0.");
    }

    if (is_points_rewarded_on_completion) {
      Validation.isInteger(points_rewarded_on_completion, "Rewarded Points must be an integer.");
      Validation.checkIntegerMinMax(points_rewarded_on_completion, { min: 1 }, "Rewarded Points must be ≥ 1.");
    }

    Validation.isInteger(userId, "Invalid user ID.");
    Validation.isEnum(role, ["admin", "partner"], "Role must be 'admin' or 'partner'.");
    // -----------------------------------------------------------------------

    const { success, data, error } = await callProcedure("createSession", [
      course_id,
      title.trim() || null,
      is_points_rewarded_on_completion || false,
      points_rewarded_on_completion || null,
      // status || "active",
      userId,
      userId,
      min_time_in_minute || null,
      role,
      role,
    ]);

    if (!success) {
      return error ? next(error) : res.status(400).json({ success: false, message: error?.message });
    }

    res.status(201).json({ success: true, session: data });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// Get All Sessions
// ------------------------------------------------------------------
exports.getAllSessions = async (_req, res, next) => {
  try {
    const result = await callProcedure("getAllSessions");
    if (result.error) return next(result.error);

    res.status(200).json({ success: true, sessions: result.data });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// Get Active Sessions by Course Hash
// ------------------------------------------------------------------
exports.getActiveSessionsByCourseId = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    Validation.isString(courseId, { min: 1, max: 255 }, "Course hash is required.");

    const result = await callProcedure("getActiveSessionByCoursePublicHash", [courseId]);
    if (result.error) return next(result.error);

    if (!result.data.length) {
      return res.status(404).json({
        success: false,
        message: "Course not found or has no sessions",
      });
    }

    // Sort sessions by sequence_number (adjust field name if needed)
    const sortedSessions = result.data.sort((a, b) => a.sequence_no - b.sequence_no);


    res.status(200).json({ success: true, sessions: sortedSessions });
  } catch (error) {
    next(error);
  }
};


// ------------------------------------------------------------------
// Get Sessions by Course Hash
// ------------------------------------------------------------------
exports.getSessionsByCourseId = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { searchTerm, dateFrom, dateTo, statusFilter } = req.query;

    Validation.isString(courseId, { min: 1, max: 255 }, "Course hash is required.");

    const result = await callProcedure("getSessionByCoursePublicHash", [
      courseId,
      searchTerm || null,
      dateFrom || null,
      dateTo || null,
      statusFilter || null
    ]);

    if (result.error) return next(result.error);

    res.status(200).json({ success: true, sessions: result.data });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// Get Session by Public Hash
// ------------------------------------------------------------------
exports.getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    Validation.isString(id, { min: 1, max: 255 }, "Session hash is required.");

    const result = await callProcedure("getSessionByPublicHash", [id]);
    if (result.error) return next(result.error);

    const session = result.data[0];
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// Update Session
// ------------------------------------------------------------------
exports.updateSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { id } = req.params;
    const {
      title,
      is_points_rewarded_on_completion = false,
      points_rewarded_on_completion = 0,
      min_time_in_minute
    } = req.body;

    Validation.isString(id, { min: 1, max: 255 }, "Session hash is required.");

    if (title !== undefined) {
      Validation.isString(title, { min: 1, max: 200 }, "Title must be a non‑empty string.");
    }

    if (min_time_in_minute !== undefined) {
      Validation.isInteger(min_time_in_minute, "Min time (minutes) must be an integer.");
      Validation.checkIntegerMinMax(min_time_in_minute, { min: 0 }, "Min time must be ≥ 0.");
    }

    if (is_points_rewarded_on_completion) {
      Validation.isInteger(points_rewarded_on_completion, "Rewarded Points must be an integer.");
      Validation.checkIntegerMinMax(points_rewarded_on_completion, { min: 1 }, "Rewarded Points must be ≥ 1.");
    }

    Validation.isInteger(userId, "Invalid user ID.");
    Validation.isEnum(role, ["admin", "partner"], "Role must be 'admin' or 'partner'.");

    const result = await callProcedure("updateSessionByPublicHash", [
      id,
      title.trim(),
      is_points_rewarded_on_completion || false,
      points_rewarded_on_completion,
      min_time_in_minute,
      userId,
      role,
    ]);

    if (result.error) return next(result.error);

    const updatedSession = result.data[0];
    if (!updatedSession) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    res.json({ success: true, session: updatedSession });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// Update Session Sequence
// ------------------------------------------------------------------
exports.updateSessionSequence = async (req, res, next) => {
  try {
    const { sequence } = req.body;          // array of session hashes

    Validation.isArray(sequence, { min: 1 }, "Sequence must be a non‑empty array.");
    sequence.forEach((hash, idx) =>
      Validation.isInteger(hash, { min: 1, max: 255 },
        `Session id at index ${idx} must be a non‑empty integer.`)
    );

    const sessionIdsJson = JSON.stringify(sequence);

    const { success, error } = await callProcedure("updateSessionSequenceProcedure", [
      sessionIdsJson,
    ]);

    if (!success) return next(error);

    res.status(200).json({ message: "Session sequence updated successfully" });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// Update Session Status
// ------------------------------------------------------------------
exports.updateSessionStatus = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.body;

    Validation.isString(sessionId, { min: 1, max: 255 }, "Session hash is required.");
    Validation.isEnum(status, ["active", "inactive"],
      "Status must be 'active' or 'inactive'.");

    const result = await callProcedure("updateSessionStatusById", [sessionId, status]);
    if (result.error) return next(result.error);

    const updatedSession = result.data[0];
    if (!updatedSession) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.status(200).json({
      message: `Session ${status === "active" ? "activated" : "deactivated"} successfully`,
      session: updatedSession,
    });
  } catch (error) {
    next(error);
  }
};
