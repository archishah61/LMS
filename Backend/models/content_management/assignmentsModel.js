const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db.js");
const Module = require("../course_management/module.js");
const MatchingQuestion = require("./matchingQuestion.js");
const TrueFalseQuestion = require("./trueFalseQuestion.js");
const MatchingOption = require("./matchingOption.js");
const FillTheBlanksQuestion = require("./fillTheBlanks.js"); // Import FillTheBlanksQuestion model
const ParagraphWriting = require("./paragraphwriting.js");

// Define the Assignment model
const Assignment = sequelize.define(
  "Assignment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    module_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tbl_modules",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    file: {
      type: DataTypes.STRING, // Stores file path or filename
      allowNull: true,
    },
    days_to_complete: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 7,
      validate: {
        min: 1,
        isInt: true
      },
      comment: "Number of days allowed to complete the assignment"
    },
    max_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    passing_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    max_attempt: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1, // Default to 1 attempt
      comment: "Maximum number of attempts allowed for this assignment"
    },
    extension_limit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Maximum number of extension requests allowed for this assignment",
    },
    status: {
      type: DataTypes.ENUM("active", "closed"),
      defaultValue: "closed",
    },
    category: {
      type: DataTypes.ENUM(
        "regular",
        "matching",
        "true_false",
        "fill_in_the_blanks",
        "paragraph_writing"
      ), // Added "fill_in_the_blanks"
      allowNull: false,
      defaultValue: "regular",
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
    tableName: "tbl_assignments",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Define relationships
Module.hasMany(Assignment, { foreignKey: "module_id" });
Assignment.belongsTo(Module, { foreignKey: "module_id" });

Assignment.hasMany(MatchingQuestion, { foreignKey: "assignment_id" });
MatchingQuestion.belongsTo(Assignment, { foreignKey: "assignment_id" });

Assignment.hasMany(TrueFalseQuestion, { foreignKey: "assignment_id" });
TrueFalseQuestion.belongsTo(Assignment, { foreignKey: "assignment_id" });

MatchingQuestion.hasMany(MatchingOption, { foreignKey: "question_id" });
MatchingOption.belongsTo(MatchingQuestion, { foreignKey: "question_id" });

//  New: Relationship with Fill in the Blanks Questions
Assignment.hasMany(FillTheBlanksQuestion, { foreignKey: "assignment_id", onDelete: "CASCADE" });
FillTheBlanksQuestion.belongsTo(Assignment, { foreignKey: "assignment_id" });

Assignment.hasMany(ParagraphWriting, { foreignKey: "assignment_id", onDelete: "CASCADE" });
ParagraphWriting.belongsTo(Assignment, { foreignKey: "assignment_id" });
// Export the Assignment model
module.exports = Assignment;
