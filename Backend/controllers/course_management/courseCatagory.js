// const { CourseCategory } = require("../../models/masters/courseCatagory");


// -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------

const { callProcedure } = require("../../utils/procedure/callProcedure"); // Adjust path accordingly
const Validation = require("../../validations");


// Create Course Category with status
const createCourseCategory = async (req, res, next) => {
  try {
    const { category, created_by, status = "active" } = req.body;


    // 🔍 Validation
    Validation.isString(category, { min: 2, max: 255 }, "Category name must be 2-255 characters long.");
    Validation.checkIntegerMinMax(created_by, { min: 1 }, "Created_by must be a valid admin ID.");
    Validation.isEnum(status, ["active", "inactive"], "Status must be either 'active' or 'inactive'.");

    const { success, data, error } = await callProcedure("createCourseCategory", [
      category,
      created_by,
    ]);

    if (!success) {
      return next(error);
      // return res.status(400).json({ error });
    }

    res.status(201).json({
      message: "Category created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Get all Course Catagory with Procedures
const getAllCourseCategories = async (req, res, next) => {
  try {

    const { status, sort } = req.query;
    const { success, data, error } = await callProcedure("getAllCourseCategories", [status || null, sort || null]);

    if (!success) {
      return next(error);
      // return res.status(400).json({ error });
    }

    // data[0] holds the actual result set when calling stored procedures in MySQL via Sequelize
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// Get all Course Catagory with Procedures
const getAllActiveCourseCategories = async (req, res, next) => {
  try {
    const { success, data, error } = await callProcedure("getAllActiveCourseCategories");

    if (!success) {
      return next(error);
    }

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// Get a single course category by ID with Procedures
const getCourseCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 🔍 Validate that id is a positive integer
    Validation.checkIntegerMinMax(id, { min: 1 }, "Invalid course category ID.")

    const { success, data, error } = await callProcedure("getCourseCategoryById", [id]);

    if (!success) {
      return next(error);
      // return res.status(400).json({ error });
    }

    const category = data[0]; // First result set, first row

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
};

// Update Course Category with Procedures
const updateCourseCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, updated_by } = req.body;

    // 🔍 Input Validations
    Validation.checkIntegerMinMax(id, { min: 1 }, "Invalid course category ID.");
    Validation.isString(category, { min: 2, max: 255 }, "Category must be 2-255 characters long.");
    Validation.checkIntegerMinMax(updated_by, { min: 1 }, "Invalid admin ID for updated_by.");

    const { success, data, error } = await callProcedure("updateCourseCategory", [id, category, updated_by]);

    if (!success) {
      return next(error);
      // return res.status(400).json({ success: false, message: error || "Failed to update category" });
    }

    // If success but no data returned (which is the case with this procedure)
    return res.status(200).json({ success: true, message: "Category updated successfully" });

  } catch (error) {
    next(error);
  }
};

// Update only the status of a Course Category with Procedure
const updateCourseCategoryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, updated_by } = req.body;

    // 🔍 Input Validations
    Validation.checkIntegerMinMax(id, { min: 1 }, "Invalid course category ID.");
    Validation.checkIntegerMinMax(updated_by, { min: 1 }, "Invalid admin ID for updated_by.");
    Validation.isEnum(status, ["active", "inactive"], "Status must be 'active' or 'inactive'.");

    const { success, error } = await callProcedure("updateCourseCategoryStatus", [
      id,
      status,
      updated_by,
    ]);

    if (!success) {
      return res.status(400).json({ success: false, message: error || "Failed to update category status" });
    }

    res.status(200).json({ success: true, message: "Category status updated successfully" });
  } catch (error) {
    next(error);
  }
};


// -------------------------------------PROCEDURE RELATED CODE ENDS-----------------------------------

module.exports = {
  createCourseCategory,
  getAllCourseCategories,
  getAllActiveCourseCategories,
  getCourseCategoryById,
  updateCourseCategory,
  updateCourseCategoryStatus,
};