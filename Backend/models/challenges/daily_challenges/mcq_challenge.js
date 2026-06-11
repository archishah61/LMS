// models/matchingQuestion.js
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/db.js");
const DailyChallenge = require("./daily_challenges.js");
const ChallengeTask = require("../challenge_quest/challenge_tasks.js");
const ContestQuiz = require("../../contest/contest_content/contest_type/contestQuiz.js");

const MCQChallenge = sequelize.define(
  "MCQChallenge",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
        model: "tbl_daily_challenges",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    tableName: "tbl_mcq_challenge",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

MCQChallenge.belongsTo(DailyChallenge, {
  foreignKey: 'challenge_id',
});

DailyChallenge.hasMany(MCQChallenge, {
  foreignKey: 'challenge_id',
});

MCQChallenge.belongsTo(ChallengeTask, {
  foreignKey: 'challenge_task_id',
});

ChallengeTask.hasMany(MCQChallenge, {
  foreignKey: 'challenge_task_id',
});

MCQChallenge.belongsTo(ContestQuiz, {
    foreignKey: 'contest_quiz_id',
});

ContestQuiz.hasMany(MCQChallenge, {
    foreignKey: 'contest_quiz_id',
});


module.exports = MCQChallenge;
