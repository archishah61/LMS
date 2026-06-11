const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const CourseCategory = sequelize.define(
  "CourseCategory",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Ensures no duplicate categories
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "active", // Can be 'active' or 'inactive'
      validate: {
        isIn: [["active", "inactive"]],
      },
    },
    created_by: {
      type: DataTypes.INTEGER, // admin.id
      allowNull: false,
      references: {
        model: "tbl_admin",
        key: "id",
      },
    },
    updated_by: {
      type: DataTypes.INTEGER, // admin.id
      allowNull: false,
      references: {
        model: "tbl_admin",
        key: "id",
      },
    },
  },
  {
    tableName: "tbl_course_categories",
    timestamps: true, // Enables created_at & updated_at fields
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

CourseCategory.associate = (models) => {
  CourseCategory.hasMany(models.Course, { foreignKey: "category_id" }); // A category can have many courses
};

module.exports = { CourseCategory };
