const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db"); // Adjust path as needed
const Topic = require("../course_management/topic");

const Accordion = sequelize.define(
  "Accordion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    topic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tbl_topics", // Make sure this matches your actual table name
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false, // Or true if you want to allow empty bodies
    },
    codeLanguage: {
      // ✅ New Field
      type: DataTypes.STRING,
      allowNull: true, // It can be null if the user doesn't add a code block
    },
    code: {
      // ✅ New Field
      type: DataTypes.TEXT,
      allowNull: true, // It can be null if no code is added
    },
    completion_type: {
      type: DataTypes.ENUM("audio", "timer"),
      allowNull: false,
      defaultValue: "audio", // keep backward compatibility
    },
    completion_time: {
      type: DataTypes.INTEGER, // time in seconds or minutes
      allowNull: true, // only required if completion_type is "timer"
    },
    audio_url: {
      type: DataTypes.STRING, // Or DataTypes.TEXT if URLs can be long
      allowNull: true, // Optional field
    },
    duration_minutes: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
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
    tableName: "tbl_accordions", // explicitly define table name
    timestamps: true, // Sequelize will manage created_at and updated_at
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

Topic.hasMany(Accordion, { foreignKey: "topic_id", onDelete: "CASCADE" });
Accordion.belongsTo(Topic, { foreignKey: "topic_id" });

module.exports = { Accordion };
