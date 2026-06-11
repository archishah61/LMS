const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db"); // Adjust path as needed
const { MultiSlide } = require("./multi_slide");

const MultiSlideAccordion = sequelize.define(
  "MultiSlideAccordion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    multi_slide_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tbl_multi_slides", // Make sure this matches your actual table name
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
      allowNull: true, // Can be null if no code is added
    },
    code: {
      // ✅ New Field
      type: DataTypes.TEXT,
      allowNull: true, // Can be null if no code is added
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
    tableName: "tbl_multislide_accordions", // explicitly define table name
    timestamps: true, // Sequelize will manage created_at and updated_at
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

MultiSlide.hasMany(MultiSlideAccordion, { foreignKey: "multi_slide_id", onDelete: "CASCADE" });
MultiSlideAccordion.belongsTo(MultiSlide, { foreignKey: "multi_slide_id" });

module.exports = { MultiSlideAccordion };
