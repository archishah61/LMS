const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db"); // Adjust path as needed
const Topic = require("../course_management/topic");
const { Material } = require("./material");

const GeneralMaterial = sequelize.define(
  "GeneralMaterial",
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
      allowNull: false, // Optional description of the material
    },
    // codeLanguage: {
    //   type: DataTypes.STRING,
    //   allowNull: true, // Can be null if no code is added
    // },
    // code: {
    //   type: DataTypes.TEXT,
    //   allowNull: true, // Can be null if no code is added
    // },
    completion_type: {
      type: DataTypes.ENUM("audio", "timer"),
      allowNull: false,
      defaultValue: "audio",
    },
    completion_time: {
      type: DataTypes.INTEGER, // time in seconds or minutes
      allowNull: true, // only required if completion_type is "timer"
    },
    audio_url: {
      type: DataTypes.STRING, 
      allowNull: true,
    },
    duration_minutes: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_by_type: {
      type: DataTypes.ENUM("admin", "partner"),
      allowNull: false,
      defaultValue: "admin",
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    updated_by_type: {
      type: DataTypes.ENUM("admin", "partner"),
      allowNull: false,
      defaultValue: "admin",
    },
  },
  {
    tableName: "tbl_general_materials", // Explicitly define the table name
    timestamps: true, // Sequelize manages created_at and updated_at
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

Topic.hasOne(GeneralMaterial, { foreignKey: "topic_id", onDelete: "CASCADE" });
GeneralMaterial.belongsTo(Topic, { foreignKey: "topic_id" });

// New association: a general topic core (GeneralMaterial row) can have many auxiliary Materials
// GeneralMaterial.hasMany(Material, {
//   foreignKey: "topic_general_id",
//   as: "materials",
//   onDelete: "CASCADE",
// });
// Material.belongsTo(GeneralMaterial, {
//   foreignKey: "topic_general_id",
//   as: "general_parent",
// });

module.exports = { GeneralMaterial };
