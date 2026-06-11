const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const City = sequelize.define(
  'City',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false, // e.g., airport/city code like "BOM", "NYC"
    },
    state_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbl_states',
        key: 'id',
      },
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: true, // e.g., "Asia/Kolkata"
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: 'tbl_cities',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['name', 'state_id'],
      },
      {
        unique: true,
        fields: ['code', 'state_id'],
      },
    ],
  }
);

module.exports = City;
