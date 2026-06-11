const { callProcedure } = require("../../utils/procedure/callProcedure");
const Validation = require("../../validations");

// Create Blog Category
const createBlogCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    Validation.isString(name, { min: 2, max: 255 }, "Name must be 2-255 characters long.");
    if (description) Validation.isString(description, { max: 1000 }, "Description must be less than 1000 characters.");

    const { success, data, error } = await callProcedure("createBlogCategory", [name, description || null]);

    if (!success) return next(error);

    res.status(201).json({ message: "Category created successfully", data });
  } catch (error) {
    next(error);
  }
};

// Get all Blog Categories
const getAllBlogCategories = async (req, res, next) => {
  try {
    const { success, data, error } = await callProcedure("getAllBlogCategories", []);

    if (!success) return next(error);

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// Update Blog Category
const updateBlogCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    Validation.checkIntegerMinMax(id, { min: 1 }, "Invalid ID.");
    Validation.isString(name, { min: 2, max: 255 }, "Name must be 2-255 characters long.");

    const { success, error } = await callProcedure("updateBlogCategory", [id, name, description || null, status]);

    if (!success) return next(error);

    res.status(200).json({ success: true, message: "Category updated successfully" });
  } catch (error) {
    next(error);
  }
};

// Delete Blog Category
const deleteBlogCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    Validation.checkIntegerMinMax(id, { min: 1 }, "Invalid ID.");

    const { success, error } = await callProcedure("deleteBlogCategory", [id]);

    if (!success) return next(error);

    res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBlogCategory,
  getAllBlogCategories,
  updateBlogCategory,
  deleteBlogCategory,
};
