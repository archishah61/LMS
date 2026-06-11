const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.js'); // Adjust the path
const Course = require('./course.js');
const Session = require('./session.js');

const Module = sequelize.define(
  "Module",
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
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tbl_courses", // References the `courses` table
        key: "id",
      },
    },
    session_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: "tbl_session", // Table name that holds sessions
        key: "id",
      },
    },
    original_module_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "tbl_modules",
        key: "id",
      },
      comment: "Reference to original module if copied",
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sequence_no: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Total course duration in minutes",
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
      allowNull: false,
    },
    created_by: {
      type: DataTypes.INTEGER, // admin.id
      allowNull: false,
    },
    created_by_type: {
      type: DataTypes.ENUM("admin", "partner"),
      allowNull: false,
      defaultValue: "admin",
    },
    updated_by: {
      type: DataTypes.INTEGER, // admin.id
      allowNull: false,
    },
    updated_by_type: {
      type: DataTypes.ENUM("admin", "partner"),
      allowNull: false,
      defaultValue: "admin",
    },
  },
  {
    tableName: "tbl_modules",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Define the relationship between Course and Module
Course.hasMany(Module, { foreignKey: 'course_id' });
Module.belongsTo(Course, { foreignKey: 'course_id' });

Module.belongsTo(Session, { foreignKey: "session_id" });
Session.hasMany(Module, { foreignKey: "session_id" });

module.exports = Module;