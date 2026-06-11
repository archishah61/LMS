// controllers/support/contactController.js
const { callProcedure } = require("../../utils/procedure/callProcedure");
const { callProcedureChallenge } = require("../../utils/procedure/callProcedureChallenge");
const Validation = require("../../validations");

// Controller to create a new contact
exports.createContact = async (req, res, next) => {
  try {
    const { fullName, email, subject, message } = req.body;

    /* ---------- VALIDATION SECTION ---------- */
    Validation.isString(fullName, { min: 1, max: 255 }, "Full name must be 1-255 characters long.");
    Validation.isEmail(email, "Email must be a valid email address.");
    Validation.isString(subject, { min: 1, max: 255 }, "Subject must be 1-255 characters long.");
    Validation.isString(message, { min: 1, max: 1000 }, "Message must be 1-1000 characters long.");
    /* ---------------------------------------- */

    const { success, data, error } = await callProcedure(
      "createContact",
      [fullName, email, subject, message]
    );

    if (!success && error) return next(error);
    if (!success || !data || data.length === 0) {
      return res.status(400).json({ error: error || "Unexpected error while creating the contact." });
    }

    res.status(201).json({
      message: "Contact created successfully",
      contact: data[0],
    });
  } catch (err) {
    next(err);
  }
};

// Controller to get all contacts
exports.getAllContacts = async (req, res, next) => {
  try {
    const {
      limit = "all",
      offset = "0",
      read = ""
    } = req.query;

    /* ---------- VALIDATION ---------- */
    if (limit !== "all" && limit !== "ALL") {
      Validation.isInteger(limit, "Limit must be a positive integer or 'all'.");
    }

    Validation.isInteger(offset, "Offset must be a non-negative integer.");
    /* --------------------------------- */

    const parsedLimit = limit === "all" ? "all" : Number(limit);
    const parsedOffset = Number(offset);

    const { success, data, error } = await callProcedureChallenge("getAllContacts", [
      limit === "all" ? 0 : parsedLimit,
      parsedOffset,
      limit === "all" || false,
      read || "all"
    ]);

    if (!success && error) return next(error);
    if (!success || !data) {
      return res.status(400).json({ error: error || "Unexpected error while fetching contacts." });
    }

    res.status(200).json({ totalCount: data[0][0].total_count, contacts: Object.values(data[1]) });
  } catch (err) {
    next(err);
  }
};

// Controller to delete a contact by ID
exports.deleteContactById = async (req, res, next) => {
  try {
    const { id } = req.params;

    /* ---------- VALIDATION ---------- */
    Validation.isInteger(id, { min: 1 }, "Contact ID must be a positive integer.");
    /* -------------------------------- */

    const { success, data, error } = await callProcedure("deleteContactById", [id]);

    if (!success && error) return next(error);
    if (!success || !data || !data[0] || data[0].message !== "Contact deleted successfully") {
      return res.status(404).json({
        message: error || "Contact not found or error during deletion",
      });
    }

    res.status(200).json({ message: "Contact deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// Controller to delete all contacts
exports.deleteAllContacts = async (req, res, next) => {
  try {
    const { success, data, error } = await callProcedure("deleteAllContacts", []);

    if (!success && error) return next(error);
    if (!success || !data || !data[0] || data[0].message !== "All contacts deleted successfully") {
      return res.status(400).json({
        message: error || "Unexpected error while deleting all contacts.",
      });
    }

    res.status(200).json({ message: "All contacts deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// Controller to mark a contact as read by ID
exports.markContactAsReadById = async (req, res, next) => {
  try {
    const { id } = req.params;

    /* ---------- VALIDATION ---------- */
    Validation.isInteger(id, { min: 1 }, "Contact ID must be a positive integer.");
    /* -------------------------------- */

    const { success, data, error } = await callProcedure("markContactAsReadById", [id]);

    if (!success && error) return next(error);
    if (!success || !data || data.length === 0) {
      return res.status(404).json({ error: error || "Contact not found" });
    }

    res.status(200).json({ contact: data[0] });
  } catch (err) {
    next(err);
  }
};

// Controller to mark all contacts as read
exports.markAllContactsAsRead = async (req, res, next) => {
  try {
    const { success, data, error } = await callProcedure("markAllContactsAsRead", []);

    if (!success && error) return next(error);
    if (!success || !data) {
      return res.status(400).json({ error: error || "Unexpected error while marking all contacts as read." });
    }

    res.status(200).json({ contacts: data });
  } catch (err) {
    next(err);
  }
};
