const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');
const { Quizzes } = require('../quizzesModel');

const ArrangeOrderQuestion = sequelize.define(
  'ArrangeOrderQuestion',
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
    sentences: {
      type: DataTypes.JSON, // store array of sentences
      allowNull: false,
    },
    correct_order: {
      type: DataTypes.JSON, // store array of indexes or sentence IDs
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
    tableName: 'tbl_arrangeorderquestion',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Relations
Quizzes.hasMany(ArrangeOrderQuestion, { foreignKey: 'quiz_id' });
ArrangeOrderQuestion.belongsTo(Quizzes, { foreignKey: 'quiz_id' });

module.exports = { ArrangeOrderQuestion };
