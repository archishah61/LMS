const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db'); // Adjust path as needed
const { TextedBasedQuizText } = require('../textBasedQuizText'); // Adjust path as needed

const MultipleChoiceQuestion = sequelize.define(
    "MultipleChoiceQuestion",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        quizTextId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_textbasedquiztext", // Make sure this matches your actual table name
                key: "id",
            },
        },
        text: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        correctAnswer: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        marks: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        options: {
            type: DataTypes.JSON,
            allowNull: false,
        },
        created_by: {
            type: DataTypes.INTEGER, // admin.id or instructor
            allowNull: false
        },
        created_by_type: {
            type: DataTypes.ENUM("admin", "partner"),
            allowNull: false,
            defaultValue: "admin",
        },
        updated_by: {
            type: DataTypes.INTEGER, // admin.id or instructor
            allowNull: false
        },
        updated_by_type: {
            type: DataTypes.ENUM("admin", "partner"),
            allowNull: false,
            defaultValue: "admin",
        },
    },
    {
        tableName: 'tbl_multiple_choice_questions_gq', // Explicitly define table name
        timestamps: true, // Sequelize will manage created_at and updated_at
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

TextedBasedQuizText.hasMany(MultipleChoiceQuestion, { foreignKey: "quizTextId", onDelete: "CASCADE" });
MultipleChoiceQuestion.belongsTo(TextedBasedQuizText, { foreignKey: "quizTextId" });

module.exports = { MultipleChoiceQuestion };
