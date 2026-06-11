const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Country = sequelize.define(
  'Country',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    code: {
      type: DataTypes.STRING(3),
      allowNull: false,
      unique: true, // ISO alpha-3 country code (e.g., IND, USA)
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: true, // e.g., INR, USD
    },
    phone_code: {
      type: DataTypes.STRING,
      allowNull: true, // e.g., +91, +1
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: true, // e.g., Asia/Kolkata
    },
    region: {
      type: DataTypes.STRING,
      allowNull: true, // e.g., Asia, Europe
    },
    subregion: {
      type: DataTypes.STRING,
      allowNull: true, // e.g., Southern Asia
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: 'tbl_countries',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

module.exports = Country;
