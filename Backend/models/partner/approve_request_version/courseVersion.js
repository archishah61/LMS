const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');
const Course = require('../../course_management/course'); // Adjust the path as needed

const CourseVersion = sequelize.define(
    "CourseVersion",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      course_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tbl_courses",
          key: "id",
        },
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "tbl_course_categories", // Foreign key reference
          key: "id",
        },
      },
      thumbnail: {
        type: DataTypes.STRING, // Store filename/path from multer
        allowNull: true,
      },
      preview_video: {
        type: DataTypes.STRING, // Store filename/path from multer
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      discount: {
        type: DataTypes.INTEGER, // Discount percentage
        allowNull: true,
      },
      duration_hours: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      expiry_days: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      embedding: DataTypes.JSON, // Store precomputed embedding
      status: {
        type: DataTypes.ENUM("draft", "pending", "approved" ,"published", "rejected"),
        defaultValue: "pending",
        allowNull: false,
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
      tableName: "tbl_course_versions",
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );
  
Course.hasMany(CourseVersion, { foreignKey: 'course_id' });
CourseVersion.belongsTo(Course, { foreignKey: 'course_id' });


module.exports = { CourseVersion };