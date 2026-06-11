const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db"); // Adjust path based on your structure

const ContentMapping = sequelize.define(
    "ContentMapping",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        original_course_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM("session", "module", "topic"),
            allowNull: false,
        },
        original_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        copied_id: {
            type: DataTypes.JSON,
            allowNull: true,
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
        tableName: "tbl_content_mapping",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = ContentMapping;
