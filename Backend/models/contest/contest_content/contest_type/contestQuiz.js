// models/contest_quiz.js
const { DataTypes } = require("sequelize");
const sequelize = require("../../../../config/db.js");
const ContestActivity = require("../contestActivity.js");

const ContestQuiz = sequelize.define(
  "ContestQuiz",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    activity_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Optional: if this quiz is tied to a specific contest activity
      references: {
        model: "tbl_contest_activities",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    time_limit_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    max_attempts: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    is_warning: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    no_of_warning: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },

    qualify_percentage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 70,
      validate: {
        min: 35,
        max: 100
      }
    },
    points_reward: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    show_answer: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tbl_admin",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "tbl_admin",
        key: "id"
      },
      onDelete: "SET NULL"
    }
  },
  {
    tableName: "tbl_contest_quizzes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

ContestQuiz.belongsTo(ContestActivity, {
  foreignKey: "activity_id",
});
ContestActivity.hasMany(ContestQuiz, {
  foreignKey: "activity_id",
});

module.exports = ContestQuiz;
