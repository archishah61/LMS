const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db.js"); // Adjust the path
const Module = require("./module.js"); // Ensure this matches the correct model
const { Material } = require("../content_management/material.js");

const Topic = sequelize.define(
  "Topic",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    public_hash: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    module_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tbl_modules",
        key: "id",
      },
      onDelete: "CASCADE", // Ensures topics are deleted if the module is deleted
    },
    original_topic_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "tbl_topics",
        key: "id",
      },
      comment: "Reference to original topic if copied",
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
    content_type: {
      type: DataTypes.ENUM("video", "audio", "accordian", "general", "slide"),
      allowNull: false,
    },
    sequence_no: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    languages: {
      type: DataTypes.JSON, // Store as an array of strings (prerequisites)
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
      allowNull: false,
    },
    total_duration: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: true,
    },
    topic_duration: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: true,
    },
    extra_duration: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    created_by_type: {
      type: DataTypes.ENUM("admin", "partner"),
      allowNull: false,
      defaultValue: "admin",
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    updated_by_type: {
      type: DataTypes.ENUM("admin", "partner"),
      allowNull: false,
      defaultValue: "admin",
    },
  },
  {
    tableName: "tbl_topics",
    timestamps: true, // ✅ Enables automatic created_at and updated_at fields
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

Module.hasMany(Topic, { foreignKey: "module_id" });
Topic.belongsTo(Module, { foreignKey: "module_id" });

Topic.hasMany(Material, { foreignKey: "topic_id", onDelete: "CASCADE" });
Material.belongsTo(Topic, { foreignKey: "topic_id" });

module.exports = Topic;
