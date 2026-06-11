const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const User = require('../auth/user'); // Import User model

const CourseGenerationHistory = sequelize.define(
    "CourseGenerationHistory",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_users",
                key: "id",
            },
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        structure: {
            type: DataTypes.JSON,
            allowNull: false,
        },
        is_generated: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        tableName: "tbl_course_generation_history",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

// Relationships
CourseGenerationHistory.belongsTo(User, { foreignKey: "user_id" });

module.exports = CourseGenerationHistory;
