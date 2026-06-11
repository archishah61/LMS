const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const { Quizzes } = require('./quizzesModel');

const TextedBasedQuizText = sequelize.define(
    "TextedBasedQuizText",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        quiz_id: {
            type: DataTypes.INTEGER,
            references: {
                model: "tbl_quiz", // Name of the target table
                key: "id",
            },
            allowNull: false,
        },
        text: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        created_by: {
            type: DataTypes.INTEGER, // admin.id
            allowNull: false
        },
        created_by_type: {
            type: DataTypes.ENUM("admin", "partner"),
            allowNull: false,
            defaultValue: "admin",
        },
        updated_by: {
            type: DataTypes.INTEGER, // admin.id
            allowNull: false
        },
        updated_by_type: {
            type: DataTypes.ENUM("admin", "partner"),
            allowNull: false,
            defaultValue: "admin",
        },
    },
    {
        tableName: "tbl_textbasedquiztext",
        timestamps: true, // Set to true if you want Sequelize to manage created_at/updated_at automatically
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

Quizzes.hasMany(TextedBasedQuizText, { foreignKey: 'quiz_id' });
TextedBasedQuizText.belongsTo(Quizzes, { foreignKey: 'quiz_id' });

// Optionally, you can define associations here if needed
TextedBasedQuizText.associate = (models) => {
    TextedBasedQuizText.belongsTo(models.Quizzes, { foreignKey: 'quiz_id' });
    TextedBasedQuizText.belongsTo(models.Admin, { foreignKey: 'created_by' });
    TextedBasedQuizText.belongsTo(models.Admin, { foreignKey: 'updated_by' });
};

// Exporting Models
module.exports = { TextedBasedQuizText };
