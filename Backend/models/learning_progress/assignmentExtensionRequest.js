// models/learning_progress/assignmentExtensionRequest.js
const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const Assignment = require("../content_management/assignmentsModel");
const User = require("../auth/user");


const AssignmentExtensionRequest = sequelize.define("AssignmentExtensionRequest", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    assignmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "tbl_assignments",
            key: "id"
        },
        onDelete: "CASCADE"
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "tbl_users", // or your actual users table name
            key: "id"
        },
        onDelete: "CASCADE"
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Reason provided by student for requesting extension"
    },
    status: {
        type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
        defaultValue: "Pending",
        allowNull: false
    },
    admin_response: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Optional note from admin when approving/rejecting"
    },
    approved_due_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "The due date set by admin if request is approved"
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: "tbl_assignment_extension_requests",
    createdAt: "created_at",
    updatedAt: "updated_at"
});

// Associations
Assignment.hasMany(AssignmentExtensionRequest, { foreignKey: "assignmentId", onDelete: "CASCADE" });
AssignmentExtensionRequest.belongsTo(Assignment, { foreignKey: "assignmentId" });

User.hasMany(AssignmentExtensionRequest, { foreignKey: "userId", onDelete: "CASCADE" });
AssignmentExtensionRequest.belongsTo(User, { foreignKey: "userId" });

module.exports = AssignmentExtensionRequest;
