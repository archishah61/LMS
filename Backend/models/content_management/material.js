const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

// Material model: represents auxiliary assets (pdf/link/document/image/other) that belong
// either to a general topic core record (tbl_general_materials) OR a general slide core record
// (tbl_multi_slides_general). Exactly one of topic_general_id or slide_general_id must be non-null.
// NOTE: MySQL CHECK constraints prior to 8.0 are ignored; if you need strict enforcement
// add a BEFORE INSERT/UPDATE trigger or validate in application/service layer.

const Material = sequelize.define(
  "Material",
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
    slide_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      onDelete: "CASCADE",
    },
    material_type: {
      type: DataTypes.ENUM("pdf", "link", "document", "image", "code", "other"),
      allowNull: true,
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: true, // Can be NULL for uploaded file represented elsewhere if you add storage fields later
    },
    codeLanguage: {
      type: DataTypes.STRING,
      allowNull: true, // Can be null if no code is added
    },
    code: {
      type: DataTypes.TEXT,
      allowNull: true, // Can be null if no code is added
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
    tableName: "tbl_materials",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Associations are declared in the owning model files (topic.js)

module.exports = { Material };
