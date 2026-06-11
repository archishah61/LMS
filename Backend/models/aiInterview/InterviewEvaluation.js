const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const User = require('../auth/user');

// Model 1: InterviewEvaluation
const InterviewEvaluation = sequelize.define(
  "InterviewEvaluation",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    role: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "tbl_interview_evaluations",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Define relationship for InterviewEvaluation
InterviewEvaluation.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(InterviewEvaluation, { foreignKey: "user_id", as: "interviewEvaluations" });

// Model 2: InterviewEvaluationResult
const InterviewEvaluationResult = sequelize.define(
  "InterviewEvaluationResult",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
     interviewEvaluationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: InterviewEvaluation, // Ensure this model is correctly imported
        key: "id",
      },
    },
    overallScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    overallAssessment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    fullResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    downloaded_dates: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    tableName: "tbl_interview_evaluation_results",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Define relationship for InterviewEvaluationResult
InterviewEvaluationResult.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(InterviewEvaluationResult, { foreignKey: "user_id", as: "interviewEvaluationResults" });

// Model 3: QuestionEvaluation
const QuestionEvaluation = sequelize.define(
  "QuestionEvaluation",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    interviewEvaluationResultId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: InterviewEvaluationResult,
        key: "id",
      },
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    originalAnswer: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    userAnswer: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
     score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    suggestedFeedback: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "tbl_question_evaluations",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Define relationship for QuestionEvaluation
QuestionEvaluation.belongsTo(InterviewEvaluationResult, { foreignKey: "interviewEvaluationResultId", as: "interviewEvaluationResult" });
InterviewEvaluationResult.hasMany(QuestionEvaluation, { foreignKey: "interviewEvaluationResultId", as: "questionEvaluations" });

// Associate InterviewEvaluation with InterviewEvaluationResult
InterviewEvaluation.hasMany(InterviewEvaluationResult, {
  foreignKey: 'interviewEvaluationId', // This should match the field in InterviewEvaluationResult
  as: 'evaluationResults',
});

InterviewEvaluationResult.belongsTo(InterviewEvaluation, {
  foreignKey: 'interviewEvaluationId', // This should match the field in InterviewEvaluationResult
  as: 'interviewEvaluation',
});

module.exports = {
  InterviewEvaluation,
  InterviewEvaluationResult,
  QuestionEvaluation
};
