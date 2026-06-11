const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db"); // Adjust path as needed
const Topic = require("../course_management/topic");

const Audio = sequelize.define(
  "Audio",
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
    url: {
      type: DataTypes.STRING, // Or DataTypes.TEXT if URLs can be very long
      allowNull: false,
    },
    image_url: {
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
    tableName: "tbl_audios", // Explicitly define the table name
    timestamps: true, // Sequelize manages created_at and updated_at
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

Topic.hasOne(Audio, { foreignKey: "topic_id", onDelete: "CASCADE" });
Audio.belongsTo(Topic, { foreignKey: "topic_id" });

module.exports = { Audio };
