const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const User = require("../auth/user");
const Course = require("../course_management/course");

const SupportTicket = sequelize.define("SupportTicket", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    category: {
        type: DataTypes.ENUM('Content', 'Technical', 'Access', 'Billing', 'Achievement', 'Communication', 'Other'),
        allowNull: false,
        defaultValue: 'Other'
    },
    status: {
        type: DataTypes.ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'),
        defaultValue: 'OPEN',
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_users',
            key: 'id'
        },
        onDelete: "CASCADE",
    },
    related_type: {
        type: DataTypes.ENUM(
            'course', 'topic', 'quiz', 'assignment',
            'daily-challenge', 'challenge-quest', 'contest', 'cheatsheet',
            'partner', 'user_auth', 'enrollment'
        ),
        allowNull: true
    },
    related_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'tbl_support_tickets',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Associations
User.hasMany(SupportTicket, { foreignKey: "user_id" });
SupportTicket.belongsTo(User, { foreignKey: "user_id" });

Course.hasMany(SupportTicket, { foreignKey: "course_id" });
SupportTicket.belongsTo(Course, { foreignKey: "course_id" });

module.exports = SupportTicket;
