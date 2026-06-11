const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const { Quizzes } = require("../content_management/quizzesModel");
const { PreDefinedQuestions } = require("./predefinedQuestion");

/**
 * Junction Table: QuizPreDefinedQuestions
 *
 * This model represents the many-to-many relationship between:
 *   - Quizzes (tbl_quiz)
 *   - Predefined Questions (tbl_pre_defined_questions)
 *
 * Purpose:
 *   - Allows a single predefined question to be assigned to multiple quizzes.
 *   - Allows a single quiz to contain multiple predefined questions.
 *
 * Key Columns:
 *   - quiz_id: References a specific quiz.
 *   - pre_defined_question_id: References a predefined question.
 *   - created_by / updated_by: Track which admin performed the mapping or update.
 *
 * Notes:
 *   - Enforces referential integrity with CASCADE deletes.
 *   - Sequelize associations define relationships both ways for easy querying.
 *   - Timestamps enabled for created_at and updated_at tracking.
 * 
 *  this table is a junction table to assign & remove predefined question to any quizz
    by this table we can establish many to many relationship between prefefined question and quizzes
    i.e. 1 predefined question can be assigned to multiple quizzes and 1 quizz can have multiple predefined questions
 */


const QuizPreDefinedQuestions = sequelize.define(
    "QuizPreDefinedQuestions",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        quiz_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_quiz", // Name of the quizzes table
                key: "id",
            },
            onDelete: "CASCADE",
        },
        pre_defined_question_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_pre_defined_questions", // Name of the predefined questions table
                key: "id",
            },
            onDelete: "CASCADE",
        },
        created_by: {
            type: DataTypes.INTEGER, // Admin ID who created the mapping
            allowNull: false,
            references: {
                model: "tbl_admin", // Admin table
                key: "id",
            },
        },
        updated_by: {
            type: DataTypes.INTEGER, // Admin ID who last updated the mapping
            allowNull: false,
            references: {
                model: "tbl_admin", // Admin table
                key: "id",
            },
        },
    },
    {
        tableName: "tbl_quiz_predefinedquestions",
        timestamps: true, // Enables created_at & updated_at fields
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

module.exports = { QuizPreDefinedQuestions };

// Define relationships
Quizzes.hasMany(QuizPreDefinedQuestions, { foreignKey: "quiz_id" });
QuizPreDefinedQuestions.belongsTo(Quizzes, { foreignKey: "quiz_id" });

PreDefinedQuestions.hasMany(QuizPreDefinedQuestions, { foreignKey: "pre_defined_question_id" });
QuizPreDefinedQuestions.belongsTo(PreDefinedQuestions, { foreignKey: "pre_defined_question_id" });
