const { callProcedure } = require("../../utils/procedure/callProcedure");
const Validation = require("../../validations");          // ✅ add

// -------------------------------------------------------------------
// CREATE
// -------------------------------------------------------------------
exports.createChallengeCategory = async (req, res, next) => {
  try {
    const { category, created_by } = req.body;

    /* ---------- VALIDATIONS ---------- */
    Validation.isString(category, { min: 1, max: 100 },
      "Category name must be 1‑100 characters long.");
    Validation.isInteger(created_by,
      "Created‑by must be a valid admin ID (integer).");

    const { result, data, error } = await callProcedure("createChallengeCategory", [
      category,
      created_by
    ]);

    if (error) {
      return next(error);
    }

    res.status(201).json({
      message: "Category created successfully",
      result
    });
  } catch (error) { next(error); }
};

// -------------------------------------------------------------------
// READ ALL
// -------------------------------------------------------------------
exports.getAllChallengeCategories = async (req, res, next) => {
  try {
    const { sortBy, filterStatus } = req.query;

    const { success, data, error } = await callProcedure("getAllChallengeCategories", [sortBy || null, filterStatus || null]);

    if (!success) return next(error);

    res.status(200).json(data);
  } catch (error) { next(error); }
};

// -------------------------------------------------------------------
// READ BY ID
// -------------------------------------------------------------------
exports.getChallengeCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    /* ---------- VALIDATION ---------- */
    Validation.isInteger(id, "Category ID must be a valid integer.");

    const result = await callProcedure("getChallengeCategoryById", [id]);

    if (result.data.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(result.data[0]);
  } catch (error) { next(error); }
};

// -------------------------------------------------------------------
// UPDATE
// -------------------------------------------------------------------
exports.updateChallengeCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, updated_by } = req.body;

    /* ---------- VALIDATIONS ---------- */
    Validation.isInteger(id, "Category ID must be a valid integer.");
    Validation.isString(category, { min: 1, max: 100 },
      "Category name must be 1‑100 characters long.");
    Validation.isInteger(updated_by,
      "Updated‑by must be a valid admin ID (integer).");

    const { result, data, error } = await callProcedure("updateChallengeCategory", [
      id,
      category,
      updated_by
    ]);

    if (error) {
      return next(error);
    }

    res.status(200).json({ message: "Category updated successfully" });
  } catch (error) { next(error); }
};

// -------------------------------------------------------------------
// DELETE
// -------------------------------------------------------------------
exports.deleteChallengeCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    /* ---------- VALIDATION ---------- */
    Validation.isInteger(id, "Category ID must be a valid integer.");

    await callProcedure("deleteChallengeCategory", [id]);

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) { next(error); }
};

// -------------------------------------------------------------------
// TOGGLE STATUS
// -------------------------------------------------------------------
exports.toggleChallengeCategoryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    /* ---------- VALIDATION ---------- */
    Validation.isInteger(id, "Category ID must be a valid integer.");

    await callProcedure("toggleChallengeCategoryStatus", [id]);

    res.status(200).json({ message: "Category status updated successfully" });
  } catch (error) { next(error); }
};
