const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const Module = require("../course_management/module");

const Quizzes = sequelize.define(
  "Quizzes",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    module_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "tbl_modules", // Name of the target table
        key: "id",
      },
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    passing_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    max_attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    attempts_gap: {
      // New field for attempts gap
      type: DataTypes.INTEGER, // Duration in hours
      allowNull: false,
      defaultValue: 0, // Default value if not provided
    },
    attempts_renew_days: {
      type: DataTypes.INTEGER, // Duration in days
      allowNull: false,
      defaultValue: 0, // Default value if not provided
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
      allowNull: false,
    },
    isQuizCompulsory: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    quizType: {
      type: DataTypes.ENUM("normal", "text_based"),
      allowNull: false,
    },
    // New warning related fields
    isWarning: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      // comment: 'If true, student gets limited warnings when leaving quiz (tab switch / ESC / fullscreen exit)'
    },
    no_of_warning: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      },
      // comment: 'Maximum number of warnings allowed before auto submit'
    },
    created_by: {
      type: DataTypes.INTEGER, // admin.id
      allowNull: false,
    },
    created_by_type: {
      type: DataTypes.ENUM("admin", "partner"),
      allowNull: false,
      defaultValue: "admin",
    },
    updated_by: {
      type: DataTypes.INTEGER, // admin.id
      allowNull: false,
    },
    updated_by_type: {
      type: DataTypes.ENUM("admin", "partner"),
      allowNull: false,
      defaultValue: "admin",
    },
  },
  {
    tableName: "tbl_quiz",
    timestamps: true, // Set to true if you want Sequelize to manage created_at/updated_at automatically
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Optionally, you can define associations here if needed
Quizzes.associate = (models) => {
  Quizzes.belongsTo(models.Topics, { foreignKey: "module_id" });
  Quizzes.belongsTo(models.Admin, { foreignKey: "created_by" });
  Quizzes.belongsTo(models.Admin, { foreignKey: "updated_by" });
};

Module.hasMany(Quizzes, { foreignKey: "module_id" });
Quizzes.belongsTo(Module, { foreignKey: "module_id" });

// Exporting Models
module.exports = { Quizzes };
