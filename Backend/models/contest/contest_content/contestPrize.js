const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/db");
const Admin = require("../../auth/admin");
const Contest = require("./contest");

const ContestPrize = sequelize.define("ContestPrize", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  contest_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "tbl_contests", key: "id" },
    onDelete: "CASCADE"
  },

  prize_type: {
    type: DataTypes.ENUM("position", "range"),
    allowNull: false
  },

  position_start: {
    type: DataTypes.INTEGER
  }, // for position or range start

  position_end: {
    type: DataTypes.INTEGER
  }, // for range end (nullable for single position)

  prize_points: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  prize_description: {
    type: DataTypes.STRING(500),
    allowNull: true
  },

  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "tbl_admin",
      key: "id"
    },
    onDelete: "CASCADE"
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "tbl_admin",
      key: "id"
    },
    onDelete: "SET NULL"
  }

}, {
  tableName: "tbl_contest_prizes",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});

// Associations
ContestPrize.belongsTo(Contest, {
  foreignKey: "contest_id",
});

Contest.hasMany(ContestPrize, {
  foreignKey: "contest_id",
});

ContestPrize.belongsTo(Admin, {
  foreignKey: "created_by",
});

ContestPrize.belongsTo(Admin, {
  foreignKey: "updated_by",
});

module.exports = ContestPrize;
