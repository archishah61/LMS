const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const { QuizQuestions } = require('./quizQuestionsModel');

const QuizOptions = sequelize.define(
  "QuizOptions",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    question_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "tbl_quizquestions", // Name of the target table
        key: "id",
      },
      allowNull: false,
    },
    option_text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    option_img: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_correct: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // Only one option should be marked as correct per question
    },
    created_by: {
      type: DataTypes.INTEGER, // admin.id
      allowNull: false
    },
    created_by_type: {
      type: DataTypes.ENUM("admin", "partner"),
      allowNull: false,
      defaultValue: "admin",
    },
    updated_by: {
      type: DataTypes.INTEGER, // admin.id
      allowNull: false
    },
    updated_by_type: {
      type: DataTypes.ENUM("admin", "partner"),
      allowNull: false,
      defaultValue: "admin",
    },
  },
  {
    tableName: "tbl_quizoptions",
    timestamps: true, // Set to true if you want Sequelize to manage created_at/updated_at automatically
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

QuizQuestions.hasMany(QuizOptions, { foreignKey: 'question_id' });
QuizOptions.belongsTo(QuizQuestions, { foreignKey: 'question_id' });


// Optionally, you can define associations here if needed
QuizOptions.associate = (models) => {
  QuizOptions.belongsTo(models.QuizQuestions, { foreignKey: 'question_id' });
  QuizOptions.belongsTo(models.Admin, { foreignKey: 'created_by' });
  QuizOptions.belongsTo(models.Admin, { foreignKey: 'updated_by' });
};

// Exporting Models
module.exports = { QuizOptions };
