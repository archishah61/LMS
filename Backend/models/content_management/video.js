const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db"); // Adjust the path as needed
const Topic = require("../course_management/topic");

const Video = sequelize.define(
  "Video",
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
        model: "tbl_topics",
        key: "id",
      },
      onDelete: "CASCADE", // Delete videos if topic is deleted
    },
    url: {
      type: DataTypes.STRING, // Or DataTypes.TEXT if URLs can be very long
      allowNull: false,
    },
    video_type: {
      type: DataTypes.ENUM("internal", "youtube"),
      allowNull: false,
      defaultValue: "internal",
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
    tableName: "tbl_videos", // Explicitly define the table name
    timestamps: true, // Sequelize manages created_at and updated_at
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

Topic.hasOne(Video, { foreignKey: "topic_id", onDelete: "CASCADE" });
Video.belongsTo(Topic, { foreignKey: "topic_id" });

module.exports = { Video };
