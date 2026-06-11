const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/db");
const Role = require("./Role");
const Permission = sequelize.define(
  "Permission",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    section: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    action: {
      type: DataTypes.ENUM('create', 'edit', 'delete', 'view', 'toggle'),
      allowNull: false,
    },
  },
  {
    tableName: "tbl_permissions",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['section', 'action'],
      }
    ],
  }
);



module.exports = Permission;