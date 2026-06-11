const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');
const { Quizzes } = require('../quizzesModel');

const SummarizePassageQuestion = sequelize.define(
  'SummarizePassageQuestion',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    quiz_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbl_quiz',
        key: 'id',
      },
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    time_limit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: "Time limit must be at least 1 minute.",
        },
      },
    },
    marks: {
      type: DataTypes.INTEGER, // Use INTEGER type to store a single integer value
      allowNull: false,
      defaultValue: 0, // Default value as 0
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_by_type: {
      type: DataTypes.ENUM("admin", "partner"),
      allowNull: false,
      defaultValue: "admin",
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    updated_by_type: {
      type: DataTypes.ENUM("admin", "partner"),
      allowNull: false,
      defaultValue: "admin",
    },
  },
  {
    tableName: 'tbl_summarizepassagequestion',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Relationships
Quizzes.hasMany(SummarizePassageQuestion, { foreignKey: 'quiz_id' });
SummarizePassageQuestion.belongsTo(Quizzes, { foreignKey: 'quiz_id' });

module.exports = SummarizePassageQuestion;
