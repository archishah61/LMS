const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const { Quizzes } = require('./quizzesModel');

const QuizQuestions = sequelize.define(
  "QuizQuestions",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    quiz_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "tbl_quiz", // Name of the target table
        key: "id",
      },
      allowNull: false,
    },
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    question_img: {
      type: DataTypes.STRING, // Store filename/path from multer
      allowNull: true,
    },
    question_type: {
      type: DataTypes.STRING, // You can add more types if needed
      allowNull: false,
    },
    marks: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sequence_no: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    tableName: "tbl_quizquestions",
    timestamps: true, // Set to true if you want Sequelize to manage created_at/updated_at automatically
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

Quizzes.hasMany(QuizQuestions, { foreignKey: 'quiz_id' });
QuizQuestions.belongsTo(Quizzes, { foreignKey: 'quiz_id' });



// Optionally, you can define associations here if needed
QuizQuestions.associate = (models) => {
  QuizQuestions.belongsTo(models.Quizzes, { foreignKey: 'quiz_id' });
  QuizQuestions.belongsTo(models.Admin, { foreignKey: 'created_by' });
  QuizQuestions.belongsTo(models.Admin, { foreignKey: 'updated_by' });
};

// Exporting Models
module.exports = { QuizQuestions };
