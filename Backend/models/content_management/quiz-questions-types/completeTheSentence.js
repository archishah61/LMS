const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db'); // Adjust according to your project structure
const { QuizQuestions } = require('../quizQuestionsModel');


const CompleteSentence = sequelize.define(
    "CompleteSentence",
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
                model: 'tbl_quiz',
                key: 'id',
            },
        },
        question: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        correct_word: {
            type: DataTypes.JSON,
            allowNull: false,
            comment: 'Array of correct words for blanks, e.g. ["blue", "sky"]'
        },
        hint: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of hints for each blank, e.g. ["a color", "something above"]'
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        created_by_type: {
            type: DataTypes.ENUM("admin", "partner"),
            allowNull: false,
            defaultValue: "admin",
        },
        updated_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        updated_by_type: {
            type: DataTypes.ENUM("admin", "partner"),
            allowNull: false,
            defaultValue: "admin",
        },
    },
    {
        tableName: 'tbl_complete_sentences',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

// Define associations
QuizQuestions.hasMany(CompleteSentence, { foreignKey: 'question_id', onDelete: 'CASCADE' });
CompleteSentence.belongsTo(QuizQuestions, { foreignKey: 'question_id' });

module.exports = { CompleteSentence };