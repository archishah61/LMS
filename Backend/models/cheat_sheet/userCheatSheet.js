// models/userCheatSheet.js
const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const User = require("../auth/user");
const CheatSheet = require("./cheatsheet");
const { payments } = require("../enrollment_management/enrollment_management");

const UserCheatSheet = sequelize.define("UserCheatSheet", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "tbl_users",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  cheatsheet_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "tbl_cheat_sheets",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  payment_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "tbl_payments",
      key: "id",
    },
  },
  access_granted_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "tbl_user_cheat_sheets",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

// associations
User.hasMany(UserCheatSheet, { foreignKey: "user_id" });
UserCheatSheet.belongsTo(User, { foreignKey: "user_id" });

CheatSheet.hasMany(UserCheatSheet, { foreignKey: "cheatsheet_id" });
UserCheatSheet.belongsTo(CheatSheet, { foreignKey: "cheatsheet_id" });

payments.hasMany(UserCheatSheet, { foreignKey: "payment_id" });
UserCheatSheet.belongsTo(payments, { foreignKey: "payment_id" });

module.exports = UserCheatSheet;