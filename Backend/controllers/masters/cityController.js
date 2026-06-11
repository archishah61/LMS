const { callProcedure } = require("../../utils/procedure/callProcedure");
const { callProcedureChallenge } = require("../../utils/procedure/callProcedureChallenge");
const Validation = require("../../validations");   // ← make sure the path is correct

/* ───────────────────────────  CREATE CITY  ─────────────────────────── */
const createCity = async (req, res, next) => {
  try {
    const { name, code, state_id, timezone } = req.body;

    /* --------- VALIDATION --------- */
    Validation.isString(name, { min: 1, max: 255 }, "City name must be a non‑empty string.");
    Validation.isCityCode(code, "City code must be three uppercase letters.");
    Validation.isInteger(state_id, { min: 1 }, "State ID must be a positive integer.");

    if (timezone !== undefined && timezone !== null) {
      Validation.isString(timezone, { min: 1, max: 100 }, "Timezone must be a valid string.");
    }
    /* ------------------------------ */

    const { success, data, error } = await callProcedure("createCity", [
      name,
      code,
      state_id,
      timezone,
    ]);

    if (!success) return next(error);

    res.status(201).json({
      success,
      message: "City created successfully",
      data: data[0],
    });
  } catch (err) {
    next(err);
  }
};



/* ───────────────────────────  UPDATE CITY  ─────────────────────────── */
const updateCity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, state_id, timezone } = req.body;

    /* --------- VALIDATION --------- */
    Validation.isInteger(id, { min: 1 }, "City ID must be a positive integer.");
    Validation.isString(name, { min: 1, max: 255 }, "City name must be a non‑empty string.");
    Validation.isCityCode(code, "City code must be three uppercase letters.");
    Validation.isInteger(state_id, { min: 1 }, "State ID must be a positive integer.");

    if (timezone !== undefined && timezone !== null) {
      Validation.isString(timezone, { min: 1, max: 100 }, "Timezone must be a valid string.");
    }
    /* ------------------------------ */

    const { success, data, error } = await callProcedure("updateCity", [
      id,
      name,
      code,
      state_id,
      timezone,
    ]);

    if (!success) return next(error);

    res.status(200).json({
      success: true,
      message: "City updated successfully",
      data: data[0],
    });
  } catch (err) {
    next(err);
  }
};



/* ───────────────────────────  GET ALL CITIES  ─────────────────────────── */
const getAllCities = async (req, res, next) => {
  try {
    const {
      search_term,
      limit = "10",
      offset = "0",
      state_id,
    } = req.query;

    /* --------- VALIDATION --------- */
    if (limit !== 'ALL') {
      Validation.isInteger(limit, { min: 1 }, "Limit must be a positive integer or 'ALL'.");
    }

    Validation.isInteger(offset, "Offset must be a non‑negative integer.");

    if (state_id !== undefined && state_id !== null) {
      Validation.isInteger(state_id, "State ID must be a positive integer.");
    }
    if (search_term) {
      Validation.isString(search_term, { min: 1, max: 255 }, "Search term must be a string.");
    }
    /* ------------------------------ */

    const { success, data, error } = await callProcedureChallenge("getAllCities", [
      search_term || "",
      limit === 'ALL' ? 'ALL' : Number(limit),
      Number(offset),
      state_id ? Number(state_id) : null,
    ]);

    if (!success) return next(error);

    const result = { total_count: data[0]['0'].total_count, cities: Object.values(data[1]) }
    res.status(200).json({ success, data: result });
  } catch (err) {
    next(err);
  }
};



/* ───────────────────────────  GET ALL ACTIVE CITIES  ─────────────────────────── */
const getAllActiveCities = async (req, res, next) => {
  try {
    const {
      state_id,
    } = req.query;

    if (state_id !== undefined && state_id !== null) {
      Validation.isInteger(state_id, "State ID must be a positive integer.");
    }
    /* ------------------------------ */

    const { success, data, error } = await callProcedure("getAllActiveCities", [
      state_id ? Number(state_id) : null,
    ]);

    if (!success) return next(error);

    res.status(200).json({ success, data });
  } catch (err) {
    next(err);
  }
};



/* ───────────────────────────  GET CITY BY ID  ─────────────────────────── */
const getCityById = async (req, res, next) => {
  try {
    const { id } = req.params;

    Validation.isInteger(id, "City ID must be a positive integer.");

    const { success, data, error } = await callProcedure("getCityById", [id]);

    if (!success) return next(error);
    if (!data[0]) {
      return res.status(404).json({ success: false, message: "City not found" });
    }
    res.status(200).json({ success, data: data[0] });
  } catch (err) {
    next(err);
  }
};



/* ──────────────────────  TOGGLE CITY STATUS (ACTIVE/INACTIVE)  ────────────────────── */
const toggleCityStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    Validation.isInteger(id, "City ID must be a positive integer.");

    const { success, error } = await callProcedure("toggleCityStatus", [id]);

    if (!success) return next(error);

    res.status(200).json({
      success: true,
      message: "City status toggled successfully",
    });
  } catch (err) {
    next(err);
  }
};



/* ───────────────────────────  DELETE CITY  ─────────────────────────── */
const deleteCity = async (req, res, next) => {
  try {
    const { id } = req.params;

    Validation.isInteger(id, "City ID must be a positive integer.");

    const { success, error } = await callProcedure("deleteCity", [id]);

    if (!success) return next(error);

    res.status(200).json({
      success,
      message: "City deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};


/* ───────────────────────────  EXPORTS  ─────────────────────────── */
module.exports = {
  createCity,
  updateCity,
  getAllCities,
  getAllActiveCities,
  getCityById,
  toggleCityStatus,
  deleteCity,
};
