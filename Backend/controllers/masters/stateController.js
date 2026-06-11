const { callProcedure } = require("../../utils/procedure/callProcedure");
const { callProcedureChallenge } = require("../../utils/procedure/callProcedureChallenge");
const Validation = require("../../validations");   // adjust path if needed


/* ───────────────────────────  CREATE STATE  ─────────────────────────── */
const createState = async (req, res, next) => {
  try {
    const { name, code, country_id, timezone } = req.body;

    /* --------- VALIDATION --------- */
    Validation.isString(name, "State name must be a non‑empty string.");
    Validation.isStateCode(code, "State code must be two uppercase letters.");
    Validation.isInteger(country_id, "Country ID must be a positive integer.");

    if (timezone !== undefined && timezone !== null) {
      Validation.isString(timezone, { min: 1, max: 100 }, "Timezone must be a valid string.");
    }
    /* ------------------------------ */

    const { success, data, error } = await callProcedure("createState", [
      name,
      code,
      country_id,
      timezone,
    ]);

    if (!success) return next(error);

    res.status(201).json({
      success,
      message: "State created successfully",
      data: data[0],
    });
  } catch (err) {
    next(err);
  }
};



/* ───────────────────────────  UPDATE STATE  ─────────────────────────── */
const updateState = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, country_id, timezone } = req.body;

    /* --------- VALIDATION --------- */
    Validation.isInteger(id, "State ID must be a positive integer.");
    Validation.isString(name, "State name must be a non‑empty string.");
    Validation.isStateCode(code, "State code must be two uppercase letters.");
    Validation.isInteger(country_id, "Country ID must be a positive integer.");

    if (timezone !== undefined && timezone !== null) {
      Validation.isString(timezone, { min: 1, max: 100 }, "Timezone must be a valid string.");
    }
    /* ------------------------------ */

    const { success, data, error } = await callProcedure("updateState", [
      id,
      name,
      code,
      country_id,
      timezone,
    ]);

    if (!success) return next(error);

    res.status(200).json({
      success: true,
      message: "State updated successfully",
      data: data[0],
    });
  } catch (err) {
    next(err);
  }
};



/* ───────────────────────────  GET ALL STATES  ─────────────────────────── */
const getAllStates = async (req, res, next) => {
  try {
    const {
      search_term,
      limit = "10",
      offset = "0",
      country_id,
    } = req.query;

    /* --------- VALIDATION --------- */
    if (limit !== "ALL") {
      Validation.isInteger(limit, "Limit must be a positive integer or 'ALL'.");
    }
    Validation.isInteger(offset, "Offset must be a non‑negative integer.");

    if (country_id !== undefined && country_id !== null) {
      Validation.isInteger(country_id, "Country ID must be a positive integer.");
    }
    if (search_term) {
      Validation.isString(search_term, { min: 1, max: 255 }, "Search term must be a string.");
    }
    /* ------------------------------ */

    const { success, data, error } = await callProcedureChallenge("getAllStates", [
      search_term || "",
      limit === "ALL" ? "ALL" : Number(limit),
      Number(offset),
      country_id ? Number(country_id) : null,
    ]);

    if (!success) return next(error);

    res.status(200).json({ success, data: { total_count: data[0]['0'].total_count, states:Object.values(data[1]) } });
  } catch (err) {
    next(err);
  }
};

/* ───────────────────────────  GET ALL ACTIVE STATES  ─────────────────────────── */
const getAllActiveStates = async (req, res, next) => {
  try {
    const {
      country_id,
    } = req.query;

    if (country_id !== undefined && country_id !== null) {
      Validation.isInteger(country_id, "Country ID must be a positive integer.");
    }

    const { success, data, error } = await callProcedure("getAllActiveStates", [
      country_id ? Number(country_id) : null,
    ]);

    if (!success) return next(error);

    res.status(200).json({ success, data });
  } catch (err) {
    next(err);
  }
};

/* ───────────────────────────  GET STATE BY ID  ─────────────────────────── */
const getStateById = async (req, res, next) => {
  try {
    const { id } = req.params;

    Validation.isInteger(id, "State ID must be a positive integer.");

    const { success, data, error } = await callProcedure("getStateById", [id]);

    if (!success) return next(error);
    if (!data[0]) {
      return res.status(404).json({ success: false, message: "State not found" });
    }
    res.status(200).json({ success, data });
  } catch (err) {
    next(err);
  }
};



/* ───────────────────────────  TOGGLE STATE STATUS  ─────────────────────────── */
const toggleStateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    Validation.isInteger(id, "State ID must be a positive integer.");

    const { success, error } = await callProcedure("toggleStateStatus", [id]);

    if (!success) return next(error);

    res.status(200).json({
      success: true,
      message: "State status toggled successfully",
    });
  } catch (err) {
    next(err);
  }
};



/* ───────────────────────────  EXPORTS  ─────────────────────────── */
module.exports = {
  createState,
  updateState,
  getAllStates,
  getAllActiveStates,
  getStateById,
  toggleStateStatus,
};
