const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db.js");

const MatchingOption = sequelize.define(
  "MatchingOption",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    question_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tbl_matching_questions",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    option_text: {
      type: DataTypes.STRING, // Stores text or image path
      allowNull: false,
    },
    option_type: {
      type: DataTypes.ENUM("text", "image"), // Indicates whether option_text is a text or image
      allowNull: false,
      defaultValue: "text",
    },
    match_text: {
      type: DataTypes.STRING, // Stores text or image path
      allowNull: false,
    },
    match_type: {
      type: DataTypes.ENUM("text", "image"), // Indicates whether match_text is a text or image
      allowNull: false,
      defaultValue: "text",
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
    tableName: "tbl_matching_options",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

module.exports = MatchingOption;
