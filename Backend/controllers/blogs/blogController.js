const { callProcedure } = require("../../utils/procedure/callProcedure");
const Validation = require("../../validations");

// Create Blog
const createBlog = async (req, res, next) => {
  try {
    const { title, slug, content, author, status, category } = req.body;
    let image = null;
    if (req.files && req.files.blogImage && req.files.blogImage.length > 0) {
      image = `/blog/${req.files.blogImage[0].filename}`;
    }

    // 🔍 Input Validations
    Validation.isString(title, { min: 2, max: 255 }, "Title must be 2-255 characters long.");
    Validation.isString(slug, { min: 2, max: 255 }, "Slug must be 2-255 characters long.");
    Validation.isString(content, { min: 10 }, "Content must be at least 10 characters long.");
    if (author) Validation.isString(author, { max: 255 }, "Author name must be less than 255 characters.");
    if (category) Validation.isString(category, { max: 255 }, "Category must be less than 255 characters.");

    const { success, data, error } = await callProcedure("createBlog", [
      title,
      slug,
      content,
      author || null,
      image || null,
      status || 'draft',
      category || null,
    ]);

    if (!success) {
      return next(error);
    }

    res.status(201).json({
      message: "Blog created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Get all Blogs
const getAllBlogs = async (req, res, next) => {
  try {
    const { searchTerm = '', status = '', category = '' } = req.query;

    const { success, data, error } = await callProcedure("getAllBlogs", [
      searchTerm || null,
      status || null,
      category || null
    ]);

    if (!success) {
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: data,
      message: data.length === 0 ? "No blogs found." : "Blogs retrieved successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// Get Blog by Slug
const getBlogBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const { success, data, error } = await callProcedure("getBlogBySlug", [slug]);

    if (!success) {
      return next(error);
    }

    if (data.length === 0) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json({
      success: true,
      data: data[0],
    });
  } catch (error) {
    next(error);
  }
};

// Update Blog
const updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, slug, content, author, status, category } = req.body;
    let image = null;

    if (req.files && req.files.blogImage && req.files.blogImage.length > 0) {
      image = `/blog/${req.files.blogImage[0].filename}`;
    } else if (req.body.image) {
      image = req.body.image;
    }

    // 🔍 Input Validations
    Validation.checkIntegerMinMax(id, { min: 1 }, "Invalid Blog ID.");
    Validation.isString(title, { min: 2, max: 255 }, "Title must be 2-255 characters long.");
    Validation.isString(slug, { min: 2, max: 255 }, "Slug must be 2-255 characters long.");
    Validation.isString(content, { min: 10 }, "Content must be at least 10 characters long.");

    const { success, data, error } = await callProcedure("updateBlog", [
      id,
      title,
      slug,
      content,
      author || null,
      image || null,
      status || 'draft',
      category || null,
    ]);

    if (!success) {
      return next(error);
    }

    res.status(200).json({ success: true, message: "Blog updated successfully" });
  } catch (error) {
    next(error);
  }
};

// Delete Blog
const deleteBlog = async (req, res, next) => {
  try {
    const { id } = req.params;

    Validation.checkIntegerMinMax(id, { min: 1 }, "Invalid Blog ID.");

    const { success, error } = await callProcedure("deleteBlog", [id]);

    if (!success) {
      return next(error);
    }

    res.status(200).json({ success: true, message: "Blog deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
};
