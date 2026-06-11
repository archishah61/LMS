const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db"); // Adjust the path as needed
const Assignment = require("../content_management/assignmentsModel"); // Import the Assignment model

const AssignmentCompletion = sequelize.define("AssignmentCompletion", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    assignmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "tbl_assignments", // Reference to the Assignment table
            key: "id",
        },
        onDelete: "CASCADE"
    },
    isCompleted: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM("Completed", "Incomplete"),
        // if all answers are submitted, then status is Completed else Incomplete
        allowNull: true
    },
    score: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    tried_attempts: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Number of attempts the student has used"
    },
    due_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    reminder_24h_sent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    reminder_12h_sent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    reminder_due_sent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    last_attempt_time: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
        comment: "Timestamp of the last attempt"
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: true,
    tableName: "tbl_assignment_completion",
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Define relationship with Assignment
Assignment.hasMany(AssignmentCompletion, { foreignKey: "assignmentId", onDelete: "CASCADE" });
AssignmentCompletion.belongsTo(Assignment, { foreignKey: "assignmentId" });

module.exports = AssignmentCompletion;
