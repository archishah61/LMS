const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/db");
const Contest = require("../contest_content/contest");
const User = require("../../auth/user");

const UserContestEnrollment = sequelize.define("UserContestEnrollment", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "tbl_users", key: "id" },
    onDelete: "CASCADE"
  },
  contest_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "tbl_contests", key: "id" },
    onDelete: "CASCADE"
  },
  enrolled_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM("active", "withdrawn", "banned"),
    defaultValue: "active"
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  is_winner: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reward_points: {   // ✅ points earned after completing the contest
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: "tbl_user_contest_enrollments",
  timestamps: true, // enable created_at & updated_at
  createdAt: "created_at",
  updatedAt: "updated_at"
});

// Associations
UserContestEnrollment.belongsTo(User, { foreignKey: "user_id" });
UserContestEnrollment.belongsTo(Contest, { foreignKey: "contest_id" });

module.exports = UserContestEnrollment;
