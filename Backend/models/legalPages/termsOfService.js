const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const TermsOfService = sequelize.define(
    "TermsOfService",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        sentences: {
            type: DataTypes.JSON, // Store as array of strings
            allowNull: false,
            defaultValue: [],
        },
        category: {
            type: DataTypes.ENUM("footer", "partner", "login", "signup"),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("active", "inactive"),
            allowNull: false,
            defaultValue: "active",
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        updatedBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: "tbl_terms_of_service",
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

module.exports = TermsOfService;
