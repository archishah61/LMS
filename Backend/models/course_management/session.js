const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const Course = require("./course");

const Session = sequelize.define(
  "Session",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    public_hash: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    original_session_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: "tbl_session",
        key: "id",
      },
      comment: "Reference to original session if copied",
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      onDelete: "CASCADE",
      references: {
        model: "tbl_courses", // References the `courses` table
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    is_points_rewarded_on_completion: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "If true, students earn points on session completion",
    },
    points_rewarded_on_completion: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Number of points students earn when completing this session",
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
      allowNull: false,
    },
    sequence_no: {
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
    min_time_in_minute: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: "tbl_session",
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Define relationships
// Ensure associations are set
Session.belongsTo(Course, { foreignKey: "course_id" });
Course.hasMany(Session, { foreignKey: "course_id" });

module.exports = Session;
