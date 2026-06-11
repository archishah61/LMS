const { callProcedure } = require("../../utils/procedure/callProcedure");
const { callProcedureChallenge } = require("../../utils/procedure/callProcedureChallenge");
const Validation = require("../../validations");   // adjust path if needed


/* ───────────────────────────  CREATE COUNTRY  ─────────────────────────── */
const createCountry = async (req, res, next) => {
  try {
    const {
      name,
      code,
      currency,
      phone_code,
      timezone,
      region,
      subregion,
    } = req.body;

    /* ---------- VALIDATION ---------- */
    Validation.isAlphabet(name, "Country name must contain letters only.");
    Validation.isCountryCode(code, "Country code must be a 3‑letter ISO code.");
    if (currency !== undefined && currency !== null) Validation.isCurrencyCode(currency);
    if (phone_code !== undefined && phone_code !== null) Validation.isPhoneCode(phone_code);
    if (timezone !== undefined && timezone !== null) Validation.isString(timezone, { min: 1, max: 100 });
    if (region !== undefined && region !== null) Validation.isAlphabet(region);
    if (subregion !== undefined && subregion !== null) Validation.isAlphabet(subregion);
    /* --------------------------------- */

    const { success, data, error } = await callProcedure("createCountry", [
      name,
      code,
      currency,
      phone_code,
      timezone,
      region,
      subregion,
    ]);

    if (!success) return next(error);

    res.status(201).json({
      success,
      message: "Country created successfully",
      data: data[0],
    });
  } catch (err) {
    next(err);
  }
};



/* ───────────────────────────  UPDATE COUNTRY  ─────────────────────────── */
const updateCountry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      currency,
      phone_code,
      timezone,
      region,
      subregion,
    } = req.body;

    /* ---------- VALIDATION ---------- */
    Validation.isInteger(id, "Country ID must be a positive integer.");
    Validation.isAlphabet(name, "Country name must contain letters only.");
    Validation.isCountryCode(code, "Country code must be a 3‑letter ISO code.");
    if (currency !== undefined && currency !== null) Validation.isCurrencyCode(currency);
    if (phone_code !== undefined && phone_code !== null) Validation.isPhoneCode(phone_code);
    if (timezone !== undefined && timezone !== null) Validation.isString(timezone, { min: 1, max: 100 });
    if (region !== undefined && region !== null) Validation.isAlphabet(region);
    if (subregion !== undefined && subregion !== null) Validation.isAlphabet(subregion);
    /* --------------------------------- */

    const { success, data, error } = await callProcedure("updateCountry", [
      id,
      name,
      code,
      currency,
      phone_code,
      timezone,
      region,
      subregion,
    ]);

    if (!success) return next(error);

    res.status(200).json({
      success: true,
      message: "Country updated successfully",
      data: data[0],
    });
  } catch (err) {
    next(err);
  }
};



/* ───────────────────────────  GET ALL COUNTRIES  ─────────────────────────── */
const getAllCountries = async (req, res, next) => {
  try {
    const {
      search_term = "",
      limit = "10",
      offset = "0",
    } = req.query;

    /* ---------- VALIDATION ---------- */
    if (limit !== "ALL") {
      Validation.isInteger(limit, "Limit must be a positive integer or 'ALL'.");
    }
    Validation.isInteger(offset, "Offset must be a non‑negative integer.");
    if (search_term) Validation.isString(search_term, { min: 1, max: 255 });
    /* --------------------------------- */

    const parsedLimit = limit === "ALL" ? "ALL" : Number(limit);
    const parsedOffset = Number(offset);

    const { success, data, error } = await callProcedureChallenge("getAllCountries", [
      search_term,
      parsedLimit,
      parsedOffset,
    ]);

    if (!success) return next(error);

    res.status(200).json({ success, data: { total_count: data[0]['0'].total_count, countries: Object.values(data[1]) } });
  } catch (err) {
    next(err);
  }
};


/* ───────────────────────────  GET ALL ACTIVE CITIES  ─────────────────────────── */
const getAllActiveCountries = async (req, res, next) => {
  try {

    const { success, data, error } = await callProcedure("getAllActiveCountries");

    if (!success) return next(error);

    res.status(200).json({ success, data });
  } catch (err) {
    next(err);
  }
};


/* ───────────────────────────  GET COUNTRY BY ID  ─────────────────────────── */
const getCountryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    Validation.isInteger(id, "Country ID must be a positive integer.");

    const { success, data, error } = await callProcedure("getCountryById", [id]);

    if (!success) return next(error);
    if (!data[0]) {
      return res.status(404).json({ success: false, message: "Country not found" });
    }
    res.status(200).json({ success, data });
  } catch (err) {
    next(err);
  }
};



/* ───────────────────────────  TOGGLE COUNTRY STATUS  ─────────────────────────── */
const toggleCountryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    Validation.isInteger(id, "Country ID must be a positive integer.");

    const { success, error } = await callProcedure("toggleCountryStatus", [id]);

    if (!success) return next(error);

    res.status(200).json({
      success: true,
      message: "Country status toggled successfully",
    });
  } catch (err) {
    next(err);
  }
};



/* ───────────────────────────  DELETE COUNTRY  ─────────────────────────── */
const deleteCountry = async (req, res, next) => {
  try {
    const { id } = req.params;

    Validation.isInteger(id, "Country ID must be a positive integer.");

    const { success, error } = await callProcedure("deleteCountry", [id]);

    if (!success) return next(error);

    res.status(200).json({
      success,
      message: "Country deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};



/* ───────────────────────────  EXPORTS  ─────────────────────────── */
module.exports = {
  createCountry,
  updateCountry,
  getAllCountries,
  getAllActiveCountries,
  getCountryById,
  toggleCountryStatus,
  deleteCountry,
};
