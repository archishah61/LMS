const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db"); // Adjust path as needed
const { MultiSlide } = require("./multi_slide");
const { Material } = require("./material");

const MultiSlideGeneral = sequelize.define(
  "MultiSlideGeneral",
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
        model: "tbl_multi_slides", // Ensure this matches your Topic model name
        key: "id",
      },
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
    tableName: "tbl_multi_slides_general", // Explicitly define the table name
    timestamps: true, // Sequelize manages created_at and updated_at
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

MultiSlide.hasMany(MultiSlideGeneral, { foreignKey: "multi_slide_id", onDelete: "CASCADE" });
MultiSlideGeneral.belongsTo(MultiSlide, { foreignKey: "multi_slide_id" });

// New association: a general slide core (MultiSlideGeneral row) can have many auxiliary Materials
// MultiSlideGeneral.hasMany(Material, {
//   foreignKey: "slide_general_id",
//   as: "materials",
//   onDelete: "CASCADE",
// });
// Material.belongsTo(MultiSlideGeneral, {
//   foreignKey: "slide_general_id",
//   as: "slide_general_parent",
// });

module.exports = { MultiSlideGeneral };
