const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const FeatureStatus = sequelize.define('FeatureStatus', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,       // No duplicate feature names
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, // Default: off
    }
}, {
    tableName: "tbl_feature_status",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = { FeatureStatus };
