const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');
const { Quizzes } = require('../quizzesModel');

const AudioToScriptQuestion = sequelize.define(
  'AudioToScriptQuestion',
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
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    script: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    marks: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    tableName: 'tbl_audiotoscriptquestion',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);


Quizzes.hasMany(AudioToScriptQuestion, { foreignKey: 'quiz_id' });
AudioToScriptQuestion.belongsTo(Quizzes, { foreignKey: 'quiz_id' });
module.exports = { AudioToScriptQuestion };
