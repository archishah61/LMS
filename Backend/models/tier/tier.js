const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Tier = sequelize.define(
    "Tier",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        difficulty_level_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "tbl_difficulty_levels",
                key: "id",
            },
        },
        name: {
            type: DataTypes.ENUM(
                "basic",
                "standard",
                "premium"
            ),
            allowNull: false,
            defaultValue: "basic",
        },
        price: {
            type: DataTypes.DECIMAL(10, 2), // e.g., 1999.99
            allowNull: false,
            defaultValue: 0.0,
        },
        max_sessions: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        max_modules_per_session: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        max_topics_per_module: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        max_assignments_per_module: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        max_quizzes_per_module: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_admin",
                key: "id",
            },
        },
        updated_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_admin",
                key: "id",
            },
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: "tbl_tiers",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = Tier;
