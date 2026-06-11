const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const SummarizePassageResponse = sequelize.define(
    'SummarizePassageResponse',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        question_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'tbl_summarizepassagequestion',
                key: 'id',
            },
        },
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'tbl_users',
                key: 'id',
            },
        },
        response_text: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        student_summary: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        grade: {
            type: DataTypes.STRING,
            allowNull: true, // Initially null before grading
        }
    },
    {
        tableName: 'tbl_summarizepassageresponse',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

// Associations
SummarizePassageResponse.associate = (models) => {
    SummarizePassageResponse.belongsTo(models.SummarizePassageQuestion, {
        foreignKey: 'question_id',
    });
    SummarizePassageResponse.belongsTo(models.Student, {
        foreignKey: 'student_id',
    });
};

module.exports = { SummarizePassageResponse };
