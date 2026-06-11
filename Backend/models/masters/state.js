const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const State = sequelize.define(
  'State',
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
      allowNull: false, // e.g., "CA" for California or "MH" for Maharashtra
    },
    country_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbl_countries',
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
    tableName: 'tbl_states',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['name', 'country_id'],
      },
      {
        unique: true,
        fields: ['code', 'country_id'],
      },
    ],
  }
);

module.exports = State;
