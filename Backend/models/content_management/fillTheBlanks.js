// models/fillTheBlanks.js
const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db.js");

const FillTheBlanksQuestion = sequelize.define(
  "FillTheBlanksQuestion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    assignment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tbl_assignments",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    answers: {
      type: DataTypes.JSON, // Stores multiple answers as an array
      allowNull: false,
    },
    created_by: {
      type: DataTypes.INTEGER, // admin.id or instructor
      allowNull: false
    },
    created_by_type: {
      type: DataTypes.ENUM("admin", "partner"),
      allowNull: false,
      defaultValue: "admin",
    },
    updated_by: {
      type: DataTypes.INTEGER, // admin.id or instructor
      allowNull: false
    },
    updated_by_type: {
      type: DataTypes.ENUM("admin", "partner"),
      allowNull: false,
      defaultValue: "admin",
    },
  },
  {
    tableName: "tbl_fill_the_blanks_questions",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

module.exports = FillTheBlanksQuestion;
