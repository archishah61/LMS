const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const PartnerActive = sequelize.define('Partner', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  isActive: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active'
  },
}, {
  tableName: 'tbl_partnerActive',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = { PartnerActive };
