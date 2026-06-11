const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const Course = require("./course"); // Import the Course model

const CourseFAQ = sequelize.define(
  "CourseFAQ",
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
        model: "tbl_courses", // Foreign key reference to Course table
        key: "id",
      },
    },
    question: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_by: {
      type: DataTypes.INTEGER, // ID of the admin creating the FAQ
      allowNull: false,
    },
    created_by_type: {
      type: DataTypes.ENUM("admin", "partner"),
      allowNull: false,
      defaultValue: "admin",
    },
    updated_by: {
      type: DataTypes.INTEGER, // ID of the admin updating the FAQ
      allowNull: false,
    },
    updated_by_type: {
      type: DataTypes.ENUM("admin", "partner"),
      allowNull: false,
      defaultValue: "admin",
    },
  },
  {
    tableName: "tbl_course_faqs",
    timestamps: true, // Enables created_at & updated_at fields
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Define the correct relationship (One-to-Many)
CourseFAQ.belongsTo(Course, { foreignKey: "course_id", as: "course" });
Course.hasMany(CourseFAQ, { foreignKey: "course_id", as: "faqs" }); // ✅ FIXED (Removed belongsToMany)

module.exports = CourseFAQ;
