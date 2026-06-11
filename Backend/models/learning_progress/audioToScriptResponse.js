const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const AudioToScriptResponse = sequelize.define(
    'AudioToScriptResponse',
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
                model: 'tbl_audiotoscriptquestion',
                key: 'id',
            },
        },
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'tbl_quiz_completion',
                key: 'id',
            },
        },
        response_text: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        grade: {
            type: DataTypes.ENUM('A', 'B', 'C', 'D', 'E', 'F'),
            allowNull: true,
        }
    },
    {
        tableName: 'tbl_audiotoscriptresponse',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

// Associations
AudioToScriptResponse.associate = (models) => {
    AudioToScriptResponse.belongsTo(models.AudioToScriptQuestion, {
        foreignKey: 'question_id',
    });
    AudioToScriptResponse.belongsTo(models.Student, {
        foreignKey: 'student_id',
    });
};

module.exports = { AudioToScriptResponse };
