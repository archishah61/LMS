const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');
const { Quizzes } = require('../quizzesModel');

const RealWordQuestion = sequelize.define(
  'RealWordQuestion',
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
    words: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    correct_answers: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    marks: {
      type: DataTypes.JSON, // Use JSON type to store an array of marks
      allowNull: false,
      defaultValue: [], // Default value as an empty array
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
    tableName: 'tbl_realwordquestion',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

Quizzes.hasMany(RealWordQuestion, { foreignKey: 'quiz_id' });
RealWordQuestion.belongsTo(Quizzes, { foreignKey: 'quiz_id' });

module.exports = RealWordQuestion;