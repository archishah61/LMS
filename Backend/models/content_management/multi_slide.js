const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db"); // Adjust path as needed
const Topic = require("../course_management/topic");

const MultiSlide = sequelize.define(
  "MultiSlide",
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
        model: "tbl_topics", // Ensure this matches your Topic model name
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("accordian", "video", "general"),
      allowNull: false,
    },
    completion_type: {
      type: DataTypes.ENUM("audio", "timer", "video"),
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
    sequence_no: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    slide_duration: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: true,
    },
    slide_extra_duration: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: false,
    },
    total_slide_duration: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: true,
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
    tableName: "tbl_multi_slides", // Explicitly define the table name
    timestamps: true, // Sequelize manages created_at and updated_at
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

Topic.hasMany(MultiSlide, { foreignKey: "topic_id", onDelete: "CASCADE" });
MultiSlide.belongsTo(Topic, { foreignKey: "topic_id" });

module.exports = { MultiSlide };
