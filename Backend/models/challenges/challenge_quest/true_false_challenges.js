const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.js'); // Adjust the path as necessary
const ChallengeTask = require('./challenge_tasks.js');
const DailyChallenge = require('../daily_challenges/daily_challenges.js');
const ContestQuiz = require('../../contest/contest_content/contest_type/contestQuiz.js');

const TrueFalseChallenge = sequelize.define('TrueFalseChallenge', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    contest_quiz_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tbl_contest_quizzes',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    challenge_task_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tbl_challenge_tasks',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    challenge_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tbl_daily_challenges',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    question: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    answer: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'tbl_true_false_challenges',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

TrueFalseChallenge.belongsTo(DailyChallenge, {
    foreignKey: 'challenge_id',
});

DailyChallenge.hasMany(TrueFalseChallenge, {
    foreignKey: 'challenge_id',
});

TrueFalseChallenge.belongsTo(ChallengeTask, {
    foreignKey: 'challenge_task_id',
});

ChallengeTask.hasMany(TrueFalseChallenge, {
    foreignKey: 'challenge_task_id',
});

TrueFalseChallenge.belongsTo(ContestQuiz, {
    foreignKey: 'contest_quiz_id',
});

ContestQuiz.hasMany(TrueFalseChallenge, {
    foreignKey: 'contest_quiz_id',
});

module.exports = TrueFalseChallenge;
