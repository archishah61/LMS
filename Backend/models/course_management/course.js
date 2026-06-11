const { DataTypes } = require("sequelize");
const sequelize = require('../../config/db');
const { CourseCategory } = require('../masters/courseCatagory'); // Import the CourseCategory model
const Review = require('../reviews/reviewsModel');

const Course = sequelize.define(
  "Course",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    public_hash: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    sequence: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tbl_course_categories", // Foreign key reference
        key: "id",
      },
    },
    thumbnail: {
      type: DataTypes.STRING, // Store filename/path from multer
      allowNull: false,
    },
    preview_video: {
      type: DataTypes.JSON, // Store as an array of filenames/paths from multer
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    discount: {
      type: DataTypes.INTEGER, // Discount percentage
      allowNull: true,
    },
    // ✅ CHANGED TO MINUTES
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Total course duration in minutes",
    },
    expiry_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    what_you_will_learn: {
      type: DataTypes.JSON, // Store as an array of strings (bullet points)
      allowNull: true,
    },
    prerequisites: {
      type: DataTypes.JSON, // Store as an array of strings (prerequisites)
      allowNull: true,
    },
    hashtags: {
      type: DataTypes.JSON, // Store as an array of strings (prerequisites)
      allowNull: true,
    },
    skill_development: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    embedding: DataTypes.JSON, // Store precomputed embedding
    status: {
      type: DataTypes.ENUM(
        "draft",
        "pending",
        "approved",
        "published",
        "rejected",
        "private"
      ),
      defaultValue: "draft",
      allowNull: false,
    },
    is_points_enrollable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    points_to_enroll: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    min_access_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: "Minimum minutes required before accessing certain course content",
    },
    max_access_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: "Maximum minutes allowed for course access",
    },
    is_points_rewarded: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "If true, students earn points on course purchase",
    },
    points_rewarded: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Number of points students earn when purchasing this course",
    },
    is_points_rewarded_on_completion: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "If true, students earn points on course completion",
    },
    points_rewarded_on_completion: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Number of points students earn when completing this course",
    },
    is_copy_paste_allowed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "If true, users can copy and paste course content",
    },
    is_course_trending: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "If true, Course is shown as trending",
    },
    // 🔥 SEO Fields
    meta_title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    meta_keyword: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    meta_description: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    seo_image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    seo_image_alt: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    seo_canonical: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // 🔷 OG (Open Graph) Fields
    og_title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    og_description: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    og_image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    og_image_alt: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    generated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_by_type: {
      type: DataTypes.ENUM("admin", "partner"),
      allowNull: false,
      defaultValue: "admin",
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    updated_by_type: {
      type: DataTypes.ENUM("admin", "partner"),
      allowNull: false,
      defaultValue: "admin",
    },
  },
  {
    tableName: "tbl_courses",
    timestamps: true, // Enables created_at & updated_at fields
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Define relationships
// Ensure associations are set
Course.belongsTo(CourseCategory, { foreignKey: "category_id", as: "category" });
CourseCategory.hasMany(Course, { foreignKey: "category_id", as: "courses" });
Review.belongsTo(Course, { foreignKey: "course_id", as: "course" });

module.exports = Course;