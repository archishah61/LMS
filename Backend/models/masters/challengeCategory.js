const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const ChallengeCategory = sequelize.define(
  "ChallengeCategory",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Ensures no duplicate categories
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    created_by: {
      type: DataTypes.INTEGER, // admin.id
      allowNull: false,
      references: {
        model: "tbl_admin",
        key: "id",
      },
    },
    updated_by: {
      type: DataTypes.INTEGER, // admin.id
      allowNull: false,
      references: {
        model: "tbl_admin",
        key: "id",
      },
    },
  },
  {
    tableName: "tbl_challenge_categories",
    timestamps: true, // Enables created_at & updated_at fields
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

module.exports = ChallengeCategory;
