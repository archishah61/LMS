const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.js'); // Adjust the path
const Module = require('../../course_management/module.js');

const ModuleVersion = sequelize.define(
    "ModuleVersion",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        module_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_modules",
                key: "id",
            },
        },
        version: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT("long"),
            allowNull: true,
        },
        duration_hours: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM("draft", "pending", "published", "rejected", "approve"),
            defaultValue: "pending",
            allowNull: false,
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        created_by_type: {
            type: DataTypes.ENUM("admin", "partner"),
            allowNull: false,
            defaultValue: "admin",
        },
        updated_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        updated_by_type: {
            type: DataTypes.ENUM("admin", "partner"),
            allowNull: false,
            defaultValue: "admin",
        },
    },
    {
        tableName: "tbl_modules_versions",
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

// Define associations

// A Module can have multiple ModuleVersions (tracking changes to a module)
Module.hasMany(ModuleVersion, { foreignKey: 'module_id' });
ModuleVersion.belongsTo(Module, { foreignKey: 'module_id' });

module.exports = { ModuleVersion };
