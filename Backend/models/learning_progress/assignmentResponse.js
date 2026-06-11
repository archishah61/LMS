const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db"); // Adjust the path as needed
const AssignmentCompletion = require("./assignmentCompletion"); // Import the model

const AssignmentResponse = sequelize.define("AssignmentResponse", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    assignmentCompletionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_assignment_completion',
            key: "id"
        }
    },
    questionId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    selectedAnswer: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    optionIndex: {
        type: DataTypes.INTEGER,
        allowNull: true // Only for matching questions
    },
    paragraph_meta_data: {
        type: DataTypes.JSON,
        allowNull: true, // For paragraph writing questions only
        comment: "Stores paragraph metrics: WPM, accuracy, speed, efficiency, etc."
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
    tableName :'tbl_assignment_response',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Define Association
AssignmentCompletion.hasMany(AssignmentResponse, { foreignKey: "assignmentCompletionId" });
AssignmentResponse.belongsTo(AssignmentCompletion, { foreignKey: "assignmentCompletionId" });

module.exports = AssignmentResponse;
