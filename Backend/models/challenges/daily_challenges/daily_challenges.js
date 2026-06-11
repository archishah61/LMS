const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.js'); // Adjust the path as necessary
const ChallengeCategory = require('../../masters/challengeCategory.js');

const DailyChallenge = sequelize.define('DailyChallenge', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    category: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_challenge_categories',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    image_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    difficulty_level: {
        type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
        allowNull: false
    },
    time_limit: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    estimated_time: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    qualify_percentage: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 70,
        validate: {
            min: 35,
            max: 100
        }
    },
    max_attempt: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3
    },
    is_per_question_reward: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    points_reward: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    per_question_reward: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    start_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    end_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    show_answer: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    is_warning: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    no_of_warning: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1
        }
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'tbl_daily_challenges',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

DailyChallenge.belongsTo(ChallengeCategory, {
    foreignKey: "category",
    as: "categoryDetails",
});

ChallengeCategory.hasMany(DailyChallenge, {
    foreignKey: "category",
    as: "dailyChallenges",
});

module.exports = DailyChallenge;
