const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const CourseFAQ = require("./courseFAQs"); // Import the CourseFAQ model

const CourseFAQOption = sequelize.define(
  "CourseFAQOption",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    faq_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tbl_course_faqs", // Foreign key reference to CourseFAQ table
        key: "id",
      },
      onDelete: "CASCADE",
    },
    option_text: {
      type: DataTypes.STRING,
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
    tableName: "tbl_course_faq_options",
    timestamps: true, // Enables created_at & updated_at fields
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Define relationships
CourseFAQOption.belongsTo(CourseFAQ, { foreignKey: "faq_id", as: "faq" });
CourseFAQ.hasMany(CourseFAQOption, { foreignKey: "faq_id", as: "options" });

module.exports = CourseFAQOption;
