const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const { enrollments } = require('../enrollment_management/enrollment_management');
const User = require('../auth/user');

const CourseTimeTracking = sequelize.define(
    "CourseTimeTracking",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        enrollment_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_enrollments",
                key: "id",
            },
            onDelete: "CASCADE",
        },
        tracking_date: {
            type: DataTypes.DATEONLY,  // Store only the date portion
            allowNull: false,
        },
        total_time_spent: {
            type: DataTypes.INTEGER, // Time in minutes
            allowNull: false,
            defaultValue: 0
        },
        last_session_start: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        last_session_end: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_users",
                key: "id",
            }
        },
        updated_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_users",
                key: "id",
            },
        },
    },
    {
        tableName: "tbl_course_time_tracking",
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

CourseTimeTracking.belongsTo(enrollments, {
    foreignKey: "enrollment_id",
    as: "enrollment"
});

CourseTimeTracking.belongsTo(User, {
    foreignKey: "created_by",
    as: "creator",
});

CourseTimeTracking.belongsTo(User, {
    foreignKey: "updated_by",
    as: "updater",
});

// Add afterCreate and afterUpdate hooks
CourseTimeTracking.afterCreate(async (tracking, options) => {
    await updateEnrollmentTime(tracking.enrollment_id);
});

CourseTimeTracking.afterUpdate(async (tracking, options) => {
    await updateEnrollmentTime(tracking.enrollment_id);
});

async function updateEnrollmentTime(enrollmentId) {
    const totalMinutes = await CourseTimeTracking.sum('total_time_spent', {
        where: { enrollment_id: enrollmentId }
    });

    await enrollments.update({
        total_time_spent: totalMinutes || 0
    }, {
        where: { id: enrollmentId }
    });
}

module.exports = CourseTimeTracking;