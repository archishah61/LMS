const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const FeatureSettings = sequelize.define(
    "FeatureSettings",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },

        type: {
            type: DataTypes.ENUM(
                "math_solver",
                "interview",
                "course_generation",
                "learning_path"
            ),
            allowNull: false,
        },

        limit: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 3,
        },

        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },

        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        updated_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        created_by_type: {
            type: DataTypes.ENUM("admin", "partner"),
            allowNull: false,
            defaultValue: "admin",
        },

        updated_by_type: {
            type: DataTypes.ENUM("admin", "partner"),
            allowNull: true,
            defaultValue: "admin",
        },
    },
    {
        tableName: "tbl_feature_settings",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",

        indexes: [
            {
                unique: true,
                fields: ["type"], // ensures one row per feature type
            },
        ],
    }
);

module.exports = FeatureSettings;