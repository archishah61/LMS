const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db'); // Adjust the path based on your project structure
const { Quizzes } = require('../content_management/quizzesModel');
const Module = require('../course_management/module');
const Topic = require('../course_management/topic');

const QuizCompletion = sequelize.define('QuizCompletion', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_users',
            key: 'id'
        }
    },
    quizId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_quiz',
            key: 'id'
        }
    },
    score: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    isCompleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    triedAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0, // Starts from 0 and increments with each attempt
    },
    lastAttemptTime: {
        type: DataTypes.DATE,
        allowNull: true, // Stores the timestamp of the last attempt
    },
    totalMarks: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    obtainedMarks: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    count: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    total_question: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    created_by: {
        type: DataTypes.INTEGER, // admin.id
        allowNull: false,
        references: {
            model: 'tbl_users',
            key: 'id',
        },
    },
    updated_by: {
        type: DataTypes.INTEGER, // admin.id
        allowNull: false,
        references: {
            model: 'tbl_users',
            key: 'id',
        },
    },
    module_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_modules',
            key: 'id',
        },
    },
    topic_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tbl_topics',
            key: 'id',
        },
    },
}, {
    tableName: 'tbl_quiz_completion',
    timestamps: true, // Adds created_at and updated_at fields
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = QuizCompletion;

Quizzes.hasMany(QuizCompletion, { foreignKey: "quizId", onDelete: "CASCADE" });
QuizCompletion.belongsTo(Quizzes, { foreignKey: "quizId" });

// Add associations for module_id and topic_id
Module.hasMany(QuizCompletion, { foreignKey: "module_id", onDelete: "CASCADE" });
QuizCompletion.belongsTo(Module, { foreignKey: "module_id" });

Topic.hasMany(QuizCompletion, { foreignKey: "topic_id", onDelete: "CASCADE" });
QuizCompletion.belongsTo(Topic, { foreignKey: "topic_id" });
