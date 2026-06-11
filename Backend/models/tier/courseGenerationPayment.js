const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const User = require('../auth/user'); // Import your User model
const Course = require('../course_management/course'); // Import the Course model
const Tier = require('./tier');
const CourseGenerationHistory = require('./courseGenerationHistory');
const { payments } = require('../enrollment_management/enrollment_management');

const CourseGenerationPayment = sequelize.define(
    "CourseGenerationPayment",
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
        payment_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: "tbl_payments",
                key: "id",
            },
        },
        tier_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_tiers",
                key: "id",
            },
        },
        course_generation_history_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_course_generation_history",
                key: "id",
            },
        },
        generation_complete: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        generated_course_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "tbl_courses",
                key: "id",
            },
            comment: "Link to generated course (nullable until generation is done)",
        },
        paid_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: "tbl_course_generation_payments",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

// Define relationships
CourseGenerationPayment.belongsTo(User, { foreignKey: "user_id" });
CourseGenerationPayment.belongsTo(Course, { foreignKey: "generated_course_id" });
CourseGenerationPayment.belongsTo(Tier, { foreignKey: "tier_id" });
CourseGenerationPayment.belongsTo(CourseGenerationHistory, { foreignKey: "course_generation_history_id" });
CourseGenerationPayment.belongsTo(payments, { foreignKey: "payment_id" });

module.exports = CourseGenerationPayment;
