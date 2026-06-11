const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const RealWordQuestion = require("../content_management/quiz-questions-types/real-word"); // Assuming this path is correct
const User = require('../auth/user'); // Assuming your User model is here

const RealWordResponse = sequelize.define(
  "RealWordResponse",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tbl_users",
        key: "id",
      },
    },
    real_word_question_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tbl_realwordquestion",
        key: "id",
      },
    },
    selected_answers: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  },
  {
    tableName: "tbl_realwordresponse",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Associations
RealWordResponse.associate = (models) => {
  RealWordResponse.belongsTo(models.RealWordQuestion, {
    foreignKey: "real_word_question_id",
  });
  RealWordResponse.belongsTo(models.User, {
    foreignKey: "tbl_users",
  });
};

module.exports = RealWordResponse;
