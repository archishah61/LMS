const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/db");
const { Quizzes } = require("../quizzesModel");

const DragDropQuestion = sequelize.define(
  "DragDropQuestion",
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
        model: "tbl_quiz",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    prompt: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    options: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    blanks: {
      type: DataTypes.JSON,
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
    tableName: "tbl_dragdropquestion",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: (question) => {
        if (!question.marks && Array.isArray(question.blanks)) {
          question.marks = question.blanks.length;
        }
      },
      beforeUpdate: (question) => {
        if (!question.marks && Array.isArray(question.blanks)) {
          question.marks = question.blanks.length;
        }
      },
    },
  }
);

// Associations
Quizzes.hasMany(DragDropQuestion, { foreignKey: "quiz_id" });
DragDropQuestion.belongsTo(Quizzes, { foreignKey: "quiz_id" });

module.exports = { DragDropQuestion };
