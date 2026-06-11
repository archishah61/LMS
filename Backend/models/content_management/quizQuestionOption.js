const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const { QuizQuestion } = require('./quizQuestion');

const QuizQuestionOption = sequelize.define(
  'QuizQuestionOption',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    question_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbl_quiz_questions',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('mcq', 'complete_sentence'),
      defaultValue: 'mcq',
    },
    mcq_option_text: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mcq_option_img: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mcq_is_correct: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    complate_correct_word: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    complate_hint: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_by_type: {
      type: DataTypes.ENUM('admin', 'partner'),
      defaultValue: 'admin',
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    updated_by_type: {
      type: DataTypes.ENUM('admin', 'partner'),
      defaultValue: 'admin',
    }
  },
  {
    tableName: 'tbl_quiz_question_options',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Associations
QuizQuestion.hasMany(QuizQuestionOption, { foreignKey: 'question_id' });
QuizQuestionOption.belongsTo(QuizQuestion, { foreignKey: 'question_id' });

module.exports = { QuizQuestionOption };
