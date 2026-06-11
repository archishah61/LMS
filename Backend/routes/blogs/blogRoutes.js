const express = require('express');
const { createBlog, getAllBlogs, getBlogBySlug, updateBlog, deleteBlog } = require('../../controllers/blogs/blogController');
const { createBlogCategory, getAllBlogCategories, updateBlogCategory, deleteBlogCategory } = require('../../controllers/blogs/blogCategoryController');
const router = express.Router();
const upload = require("../../config/multerConfig");
const protect = require('../../middleware/protectMiddleware');
const checkPermission = require('../../middleware/permissionMiddleware');

// Blog Routes
router.post('/', protect, checkPermission("Blogs", "create"), upload.fields([
    { name: "blogImage", maxCount: 1 }
]), createBlog);

router.put('/:id', protect, checkPermission("Blogs", "edit"), upload.fields([
    { name: "blogImage", maxCount: 1 }
]), updateBlog);

router.get('/', getAllBlogs);
router.get('/:slug', getBlogBySlug);
router.delete('/:id', protect, checkPermission("Blogs", "delete"), deleteBlog);

// Category Routes
router.get('/categories/all', getAllBlogCategories);
router.post('/categories', protect, checkPermission("Blogs", "create"), createBlogCategory);
router.put('/categories/:id', protect, checkPermission("Blogs", "edit"), updateBlogCategory);
router.delete('/categories/:id', protect, checkPermission("Blogs", "delete"), deleteBlogCategory);

module.exports = router;
