// controllers/moduleController.js
const Course = require("../../models/course_management/course");
const Module = require("../../models/course_management/module");
const Session = require("../../models/course_management/session");
const { callProcedure } = require("../../utils/procedure/callProcedure");
const Validation = require("../../validations"); // ⬅️  NEW

// ------------------------------------------------------------------
// Create Module
// ------------------------------------------------------------------
const createModule = async (req, res, next) => {
  try {
    const { course_id, session_id, title, duration_minutes } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    // -------- validation ----------------------------------------------------
    Validation.isString(course_id, "Course ID must be an integer.");

    Validation.isString(session_id, "Session ID must be an integer.");

    Validation.isString(title, { min: 1, max: 255 }, "Title is required (max 255 chars).");

    Validation.isNumber(duration_minutes, { min: 1 }, "Duration minutes must be a valid Positive Number.");

    Validation.isInteger(userId, "Invalid user ID.");
    Validation.isEnum(role, ["admin", "partner"], "Role must be 'admin' or 'partner'.");
    // -----------------------------------------------------------------------

    const { success, data, error } = await callProcedure("createModuleProcedure", [
      course_id,
      session_id,
      title.trim(),
      duration_minutes,
      userId,
      userId,
      role,
      role,
    ]);

    if (!success) return next(error);

    res.status(201).json({
      message: "Module created successfully",
      module: data[0],
    });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// Get Modules by Course ID
// ------------------------------------------------------------------
const getModulesByCourseId = async (req, res, next) => {
  try {
    const { course_id } = req.params;

    Validation.isString(course_id, "Course ID must be an integer.");

    const { success, data, error } = await callProcedure("getModulesByCourseId", [
      course_id,
    ]);

    if (!success) return next(error);

    if (data[0]?.error === "Course not found") {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({ message: "Modules retrieved successfully", modules: data });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// Get Modules by Session ID
// ------------------------------------------------------------------
const getModulesBySessionId = async (req, res, next) => {
  try {
    const { session_id } = req.params;
    const { searchTerm, dateFrom, dateTo, statusFilter } = req.query;

    Validation.isString(session_id, "Session ID must be an integer.");

    const { success, data, error } = await callProcedure("getModulesBySessionId", [
      session_id,
      searchTerm || null,
      dateFrom || null,
      dateTo || null,
      statusFilter || null
    ]);

    if (!success) return next(error);

    res.status(200).json({ message: "Modules retrieved successfully", modules: data });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// Get Module by ID
// ------------------------------------------------------------------
const getModuleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    Validation.isString(id, "Module ID must be an integer.");

    const { success, data, error } = await callProcedure("getModuleById", [id]);

    if (!success) return next(error);

    if (data[0]?.error === "Module not found") {
      return res.status(404).json({ message: "Module not found" });
    }

    res.status(200).json(data[0]);
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// Update Module
// ------------------------------------------------------------------
const updateModule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, sequence_no, duration_minutes } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    Validation.isString(id, "Module ID must be an integer.");

    if (title !== undefined) {
      Validation.isString(title, { min: 1, max: 255 }, "Title must be a non‑empty string.");
    }

    if (sequence_no !== undefined) {
      Validation.isInteger(sequence_no, "Sequence number must be an integer.");
    }

    if (duration_minutes !== undefined) {
      Validation.isInteger(duration_minutes, "Duration minutes must be an integer.");
      Validation.isNumber(duration_minutes, { min: 1 }, "Duration minutes must be a valid Positive Number.");
    }

    Validation.isInteger(userId, "Invalid user ID.");
    Validation.isEnum(role, ["admin", "partner"], "Role must be 'admin' or 'partner'.");

    const { success, error } = await callProcedure("updateModuleProcedure", [
      id,
      title.trim(),
      duration_minutes,
      userId,
      role,
    ]);

    if (!success) return next(error);

    res.status(200).json({ message: "Module updated successfully" });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// Update Module Sequence
// ------------------------------------------------------------------
const updateModuleSequence = async (req, res, next) => {
  try {
    const { sequence } = req.body; // array of module IDs

    Validation.isArray(sequence, { min: 1 }, "Sequence must be a non‑empty array.");
    sequence.forEach((modId, idx) => {
      Validation.isInteger(modId, `Module ID at index ${idx} must be an integer.`);
    });

    const moduleIds = JSON.stringify(sequence);

    const { success, error } = await callProcedure("updateModuleSequenceProcedure", [
      moduleIds,
    ]);

    if (!success) return next(error);

    res.status(200).json({ message: "Modules sequence updated successfully" });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// Update Module Status
// ------------------------------------------------------------------
const updateModuleStatus = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { status } = req.body;

    Validation.isInteger(moduleId, "Module ID must be an integer.");

    Validation.isEnum(status, ["active", "inactive"], "Status must be 'active' or 'inactive'.");

    const { success, error } = await callProcedure("updateModuleStatusProcedure", [
      moduleId,
      status,
    ]);

    if (!success) return next(error);

    res.status(200).json({
      message: `Module ${status === "active" ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// Export
// ------------------------------------------------------------------
module.exports = {
  createModule,
  getModulesByCourseId,
  getModulesBySessionId,
  getModuleById,
  updateModule,
  updateModuleSequence,
  updateModuleStatus,
};
