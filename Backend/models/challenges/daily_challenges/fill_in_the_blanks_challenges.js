const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.js'); // Adjust the path as necessary
const DailyChallenge = require('./daily_challenges');
const ChallengeTask = require('../challenge_quest/challenge_tasks.js');
const ContestQuiz = require('../../contest/contest_content/contest_type/contestQuiz.js');

const FillInTheBlanksChallenge = sequelize.define('FillInTheBlanksChallenge', {
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
    text: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    answers: {
        type: DataTypes.JSON,
        allowNull: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'tbl_fillintheblanks_challenges',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

FillInTheBlanksChallenge.belongsTo(DailyChallenge, {
    foreignKey: 'challenge_id',
});

DailyChallenge.hasMany(FillInTheBlanksChallenge, {
    foreignKey: 'challenge_id',
});

FillInTheBlanksChallenge.belongsTo(ChallengeTask, {
    foreignKey: 'challenge_task_id',
});

ChallengeTask.hasMany(FillInTheBlanksChallenge, {
    foreignKey: 'challenge_task_id',
});

FillInTheBlanksChallenge.belongsTo(ContestQuiz, {
    foreignKey: 'contest_quiz_id',
});

ContestQuiz.hasMany(FillInTheBlanksChallenge, {
    foreignKey: 'contest_quiz_id',
});

module.exports = FillInTheBlanksChallenge;
