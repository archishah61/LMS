// models/userContestQuiz.js
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/db");
const User = require("../../auth/user");
const Contest = require("../contest_content/contest");
const ContestCoding = require("../contest_content/contest_type/contestCoding");

const UserContestCoding = sequelize.define("UserContestCoding", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "tbl_users", key: "id" },
    onDelete: "CASCADE",
  },
  contest_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "tbl_contests", key: "id" },
    onDelete: "CASCADE",
  },
  coding_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "tbl_contest_coding", key: "id" },
    onDelete: "CASCADE",
  },
  attempt_number: {
    type: DataTypes.INTEGER,
    defaultValue: 1, // Track which attempt it was
  },
  score: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  time_taken_seconds: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("pending", "completed", "failed", "skipped"),
    defaultValue: "pending",
  },
  submitted_at: {
    type: DataTypes.DATE,
  },
  meta: {
    type: DataTypes.JSON,
    allowNull: true, // to store extra info (answers, etc.)
  },
}, {
  tableName: "tbl_user_contest_codings",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

// Associations
UserContestCoding.belongsTo(User, { foreignKey: "user_id" });
UserContestCoding.belongsTo(Contest, { foreignKey: "contest_id" });
UserContestCoding.belongsTo(ContestCoding, { foreignKey: "coding_id" });

module.exports = UserContestCoding;
