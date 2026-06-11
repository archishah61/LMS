// controllers/courseFAQOptionController.js
const CourseFAQOption  = require("../../models/course_management/courseFAQOption");
const CourseFAQ        = require("../../models/course_management/courseFAQs");
const { callProcedure } = require("../../utils/procedure/callProcedure");
const Validation        = require("../../validations");          // ⬅️  NEW

// ------------------------------------------------------------------
// Create FAQ Options
// ------------------------------------------------------------------
exports.createFAQOptions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role   = req.user.role;
    const { faq_id, options } = req.body;           // expects array of strings

    // ---------- validation --------------------------------------------------
    Validation.isInteger(faq_id, "FAQ ID must be an integer.");
    Validation.checkIntegerMinMax(faq_id, { min: 1 }, "FAQ ID must be positive.");

    Validation.isArray(options, { min: 1 }, "Options must be a non‑empty array.");
    Validation.isInteger(userId, "Invalid user ID.");
    Validation.isEnum(role, ["admin", "partner"], "Role must be either 'admin' or 'partner'.");

    options.forEach((opt, idx) =>
      Validation.isString(
        opt,
        { min: 1, max: 255 },
        `Option text at index ${idx} must be a non‑empty string (≤255 chars).`
      )
    );
    // -----------------------------------------------------------------------

    const createdOptions = [];
    for (const optionText of options) {
      const { success, data, error } = await callProcedure(
        "createCourseFAQOption",
        [faq_id, optionText, userId, role, userId, role]
      );

      if (!success) return next(error);
      createdOptions.push(data);
    }

    res.status(201).json({
      message: "FAQ options created successfully",
      options: createdOptions,
    });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// Get ALL FAQ Options
// ------------------------------------------------------------------
exports.getAllFAQOptions = async (_req, res, next) => {
  try {
    const { success, data, error } = await callProcedure("getAllCourseFAQOptions");
    if (!success) return next(error);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// Get FAQ Options by single FAQ ID
// ------------------------------------------------------------------
exports.getFAQOptionsByFAQId = async (req, res, next) => {
  try {
    const { faq_id } = req.params;

    Validation.isInteger(faq_id, "FAQ ID must be an integer.");
    Validation.checkIntegerMinMax(faq_id, { min: 1 }, "FAQ ID must be positive.");

    const { success, data, error } = await callProcedure(
      "getCourseFAQOptionsByFAQId",
      [faq_id]
    );

    if (!success) return next(error);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// Get FAQ Options by multiple FAQ IDs
// ------------------------------------------------------------------
exports.getFAQOptionsByFAQIds = async (req, res, next) => {
  try {
    const { faq_ids } = req.body;

    Validation.isArray(faq_ids, { min: 1 }, "FAQ IDs must be a non‑empty array.");
    faq_ids.forEach((id, idx) => {
      Validation.isInteger(id, `FAQ ID at index ${idx} must be an integer.`);
      Validation.checkIntegerMinMax(id, { min: 1 }, `FAQ ID at index ${idx} must be positive.`);
    });

    const faqIdsParam = [faq_ids.join(",")];   // SP expects CSV string

    const { success, data, error } = await callProcedure(
      "getFAQOptionsByFAQIds",
      faqIdsParam
    );

    if (!success) return next(error);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// Update a single FAQ Option
// ------------------------------------------------------------------
exports.updateFAQOption = async (req, res, next) => {
  try {
    const { id }          = req.params;
    const { option_text } = req.body;
    const userId          = req.user.id;
    const role            = req.user.role;

    Validation.isInteger(id, "Option ID must be an integer.");
    Validation.checkIntegerMinMax(id, { min: 1 }, "Option ID must be positive.");
    Validation.isString(option_text, { min: 1, max: 255 }, "Option text is required.");
    Validation.isInteger(userId, "Invalid user ID.");
    Validation.isEnum(role, ["admin", "partner"], "Role must be either 'admin' or 'partner'.");

    const { success, data, error } = await callProcedure(
      "updateCourseFAQOption",
      [id, option_text, userId, role]
    );

    if (!success) return next(error);
    res.status(200).json({ message: "FAQ option updated successfully", option: data });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------
// Delete a FAQ Option
// ------------------------------------------------------------------
exports.deleteFAQOption = async (req, res, next) => {
  try {
    const { id } = req.params;

    Validation.isInteger(id, "Option ID must be an integer.");
    Validation.checkIntegerMinMax(id, { min: 1 }, "Option ID must be positive.");

    const { success, error } = await callProcedure("deleteCourseFAQOption", [id]);
    if (!success) return next(error);

    res.status(200).json({ message: "FAQ option deleted successfully" });
  } catch (error) {
    next(error);
  }
};
