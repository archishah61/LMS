const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const User = require('../auth/user');

const AiParagraphPractice = sequelize.define('AiParagraphPractice', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    difficulty: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'basic, intermediate, difficult'
    },
    paragraph: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    wpm: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    accuracy: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    time_taken: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    wrong_words: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    backspace_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    last_word_speed: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    attempt_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Sequential attempt number for this user'
    },
    analysis: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'AI generated analysis structure'
    },
    is_analyzed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: "tbl_ai_paragraph_practices",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Associations
AiParagraphPractice.belongsTo(User, { foreignKey: 'userId' });

module.exports = AiParagraphPractice;
