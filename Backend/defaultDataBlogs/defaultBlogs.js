const Blog = require("../models/blogs/blog");
const BlogCategory = require("../models/blogs/blogCategory");

const defaultBlogCategories = [
  { name: "Technology", status: true },
  { name: "Education", status: true },
  { name: "Tips", status: true },
  { name: "Career", status: true },
  { name: "Industry News", status: true },
];

const defaultBlogs = [
  {
    title: "Mastering React in 2024",
    slug: "mastering-react-2024",
    content: "<h2>Getting Started with React</h2><p>React is one of the most popular JavaScript libraries for building user interfaces. In this guide, we'll explore the latest features including Server Components and the new React Compiler...</p><h3>Why choose React?</h3><ul><li>Declarative UI</li><li>Component-Based Architecture</li><li>Vibrant Ecosystem</li></ul>",
    author: "Admin",
    category: "Technology",
    status: "published",
    image: null,
  },
  {
    title: "The Future of E-Learning",
    slug: "future-of-e-learning",
    content: "<h2>Personalized Learning Paths</h2><p>AI is transforming how we learn. With personalized algorithms, students can now receive tailored content that matches their learning pace and style...</p><h3>Key Trends</h3><ol><li>AI Integration</li><li>Micro-learning</li><li>Gamification</li></ol>",
    author: "Admin",
    category: "Education",
    status: "published",
    image: null,
  },
  {
    title: "Tips for Effective Remote Study",
    slug: "remote-study-tips",
    content: "<h2>Success in a Digital Classroom</h2><p>Remote learning requires discipline and a dedicated space. Here are our top tips for staying focused while studying from home...</p><blockquote>'The beautiful thing about learning is that no one can take it away from you.' - B.B. King</blockquote>",
    author: "Admin",
    category: "Tips",
    status: "published",
    image: null,
  }
];

const createDefaultBlogCategories = async () => {
  try {
    const count = await BlogCategory.count();
    if (count === 0) {
      for (const categoryData of defaultBlogCategories) {
        await BlogCategory.create(categoryData);
      }
      console.log("✅ Default blog categories inserted successfully.");
    } else {
      console.log("ℹ️ Blog categories already exist, skipping default insertion.");
    }
  } catch (error) {
    console.error("❌ Error inserting default blog categories:", error);
  }
};

const createDefaultBlogs = async () => {
  try {
    const count = await Blog.count();
    if (count === 0) {
      for (const blogData of defaultBlogs) {
        await Blog.create(blogData);
      }
      console.log("✅ Default blogs inserted successfully.");
    } else {
      console.log("ℹ️ Blogs already exist, skipping default insertion.");
    }
  } catch (error) {
    console.error("❌ Error inserting default blogs:", error);
  }
};

module.exports = { createDefaultBlogs, createDefaultBlogCategories };
