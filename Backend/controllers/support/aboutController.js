const { callProcedure } = require("../../utils/procedure/callProcedure");
const Validation = require("../../validations");

// Create About with Procedure
const createAbout = async (req, res, next) => {
  try {
    const { name, position, description, x, instagram, facebook, email } = req.body;
    const status = req.body.status ? String(req.body.status).toLowerCase() : "active";
    let img = null;
    if (req.files && req.files.aboutImg && req.files.aboutImg.length > 0) {
      img = `/aboutImg/${req.files.aboutImg[0].filename}`;
    } else if (req.body.img) {
      img = req.body.img;
    }

    // 🔍 Input Validations
    Validation.isString(name, { min: 2, max: 255 }, "Name must be 2-255 characters long.");
    Validation.isString(position, { min: 2, max: 255 }, "Position must be 2-255 characters long.");
    Validation.isString(description, { min: 10, max: 1000 }, "Description must be 10-1000 characters long.");
    if (email) Validation.isEmail(email, "Invalid email format.");
    if (x) Validation.isString(x, { max: 255 }, "X handle must be less than 255 characters.");
    if (instagram) Validation.isString(instagram, { max: 255 }, "Instagram handle must be less than 255 characters.");
    if (facebook) Validation.isString(facebook, { max: 255 }, "Facebook handle must be less than 255 characters.");
    if (img) Validation.isString(img, { max: 255 }, "Image path must be less than 255 characters.");
    Validation.isEnum(status, ["active", "inactive"], "Status must be either active or inactive.");

    const { success, data, error } = await callProcedure("createAbout", [
      name,
      position,
      description,
      x || null,
      instagram || null,
      facebook || null,
      email || null,
      status,
      img || null,
    ]);

    if (!success) {
      return next(error);
    }

    res.status(201).json({
      message: "About entry created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Get all About entries with Procedure
const getAllAbout = async (req, res, next) => {
  try {
    const { searchTerm = '', status, all = 'true', limit, offset } = req.query;
    const allEntries = String(all).toLowerCase() !== 'false';
    const normalizedStatus = status === undefined || status === '' ? null : String(status).toLowerCase();
    const parsedLimit = limit === undefined || limit === '' ? null : Number.parseInt(limit, 10);
    const parsedOffset = offset === undefined || offset === '' ? null : Number.parseInt(offset, 10);

    if (parsedLimit !== null && Number.isNaN(parsedLimit)) {
      return next(new Error('Invalid limit value.'));
    }

    if (parsedOffset !== null && Number.isNaN(parsedOffset)) {
      return next(new Error('Invalid offset value.'));
    }

    if (normalizedStatus) {
      Validation.isEnum(normalizedStatus, ["active", "inactive"], "Status must be either active or inactive.");
    }

    const { success, data, error } = await callProcedure("getAllAbout", [
      searchTerm || null,
      normalizedStatus,
      allEntries ? 1 : 0,
      parsedLimit,
      parsedOffset,
    ]);

    if (!success) {
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: data,
      message: data[0]?.length === 0
        ? "No About entries found currently."
        : "About entries retrieved successfully.",
    });
  } catch (error) {
    next(error);
  }
};


// Update About entry with Procedure
const updateAbout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, position, description, x, instagram, facebook, email } = req.body;
    let img = null;
    if (req.files?.aboutImg?.[0]) {
      img = `/aboutImg/${req.files.aboutImg[0].filename}`;
    } else if (req.body.aboutImg) {
      img = req.body.aboutImg;
    }

    // 🔍 Input Validations
    Validation.checkIntegerMinMax(id, { min: 1 }, "Invalid About entry ID.");
    Validation.isString(name, { min: 2, max: 255 }, "Name must be 2-255 characters long.");
    Validation.isString(position, { min: 2, max: 255 }, "Position must be 2-255 characters long.");
    Validation.isString(description, { min: 10, max: 1000 }, "Description must be 10-1000 characters long.");
    if (email) Validation.isEmail(email, "Invalid email format.");
    if (x) Validation.isString(x, { max: 255 }, "X handle must be less than 255 characters.");
    if (instagram) Validation.isString(instagram, { max: 255 }, "Instagram handle must be less than 255 characters.");
    if (facebook) Validation.isString(facebook, { max: 255 }, "Facebook handle must be less than 255 characters.");
    if (img) Validation.isString(img, { max: 255 }, "Image path must be less than 255 characters.");

    const { success, data, error } = await callProcedure("updateAbout", [
      id,
      name,
      position,
      description,
      x || null,
      instagram || null,
      facebook || null,
      email || null,
      img || null,
    ]);

    if (!success) {
      return next(error);
    }

    res.status(200).json({ success: true, message: "About entry updated successfully" });
  } catch (error) {
    next(error);
  }
};

const updateAboutStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const normalizedStatus = String(status || "").toLowerCase();

    Validation.checkIntegerMinMax(id, { min: 1 }, "Invalid About entry ID.");
    Validation.isEnum(normalizedStatus, ["active", "inactive"], "Status must be either active or inactive.");

    const { success, data, error } = await callProcedure("updateAboutStatus", [
      id,
      normalizedStatus,
    ]);

    if (!success) {
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: `About entry status updated to ${normalizedStatus}.`,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Delete About entry with Procedure
const deleteAbout = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 🔍 Validate that id is a positive integer
    Validation.checkIntegerMinMax(id, { min: 1 }, "Invalid About entry ID.");

    const { success, error } = await callProcedure("deleteAbout", [id]);

    if (!success) {
      return next(error);
    }

    res.status(200).json({ success: true, message: "About entry deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAbout,
  getAllAbout,
  updateAbout,
  updateAboutStatus,
  deleteAbout,
};