// models/userContestQuiz.js
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/db");
const User = require("../../auth/user");
const Contest = require("../contest_content/contest");
const ContestQuiz = require("../contest_content/contest_type/contestQuiz");

const UserContestQuiz = sequelize.define("UserContestQuiz", {
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
  quiz_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "tbl_contest_quizzes", key: "id" },
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
  percentage: {
    type: DataTypes.FLOAT,
    defaultValue: 0, // out of 100
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
  tableName: "tbl_user_contest_quizzes",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

// Associations
UserContestQuiz.belongsTo(User, { foreignKey: "user_id" });
UserContestQuiz.belongsTo(Contest, { foreignKey: "contest_id" });
UserContestQuiz.belongsTo(ContestQuiz, { foreignKey: "quiz_id" });

module.exports = UserContestQuiz;
