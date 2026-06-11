const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db'); // Adjust path as needed
const { TextedBasedQuizText } = require('../textBasedQuizText'); // Adjust path as needed

const TrueFalseQuestion = sequelize.define(
    "TrueFalseQuestion",
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
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        marks: {
            type: DataTypes.INTEGER,
            allowNull: true,
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
        tableName: 'tbl_true_false_questions_gq', // Explicitly define table name
        timestamps: true, // Sequelize will manage created_at and updated_at
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

TextedBasedQuizText.hasMany(TrueFalseQuestion, { foreignKey: "quizTextId", onDelete: "CASCADE" });
TrueFalseQuestion.belongsTo(TextedBasedQuizText, { foreignKey: "quizTextId" });

module.exports = { TrueFalseQuestion };
