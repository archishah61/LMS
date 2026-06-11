const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const Topic = require("../course_management/topic");
const { GeneralMaterial } = require("../content_management/genral");
const { Accordion } = require("../content_management/accordian");
const { MultiSlideGeneral } = require("../content_management/multiSlideGeneral");
const { MultiSlideAccordion } = require("../content_management/multiSlideAccordian");
const User = require("../auth/user");

const Summary = sequelize.define(
  "Summary",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    topic_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Topic,
        key: "id",
      },
    },
    general_material_desc_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: GeneralMaterial,
        key: "id",
      },
    },
    general_material_pdf_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: GeneralMaterial,
        key: "id",
      },
    },
    accordion_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Accordion,
        key: "id",
      },
    },
    multi_slide_general_desc_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: MultiSlideGeneral,
        key: "id",
      },
    },
    multi_slide_general_pdf_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: MultiSlideGeneral,
        key: "id",
      },
    },
    multi_slide_accordion_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: MultiSlideAccordion,
        key: "id",
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    summary: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
  },
  {
    tableName: "tbl_summaries",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Define associations
Topic.hasMany(Summary, { foreignKey: 'topic_id' });
Summary.belongsTo(Topic, { foreignKey: 'topic_id' });

GeneralMaterial.hasMany(Summary, { foreignKey: 'general_material_desc_id' });
Summary.belongsTo(GeneralMaterial, { foreignKey: 'general_material_desc_id' });

GeneralMaterial.hasMany(Summary, { foreignKey: 'general_material_pdf_id' });
Summary.belongsTo(GeneralMaterial, { foreignKey: 'general_material_pdf_id' });

Accordion.hasMany(Summary, { foreignKey: 'accordion_id' });
Summary.belongsTo(Accordion, { foreignKey: 'accordion_id' });

MultiSlideGeneral.hasMany(Summary, { foreignKey: 'multi_slide_general_desc_id' });
Summary.belongsTo(MultiSlideGeneral, { foreignKey: 'multi_slide_general_desc_id' });

MultiSlideGeneral.hasMany(Summary, { foreignKey: 'multi_slide_general_pdf_id' });
Summary.belongsTo(MultiSlideGeneral, { foreignKey: 'multi_slide_general_pdf_id' });

MultiSlideAccordion.hasMany(Summary, { foreignKey: 'multi_slide_accordion_id' });
Summary.belongsTo(MultiSlideAccordion, { foreignKey: 'multi_slide_accordion_id' });

User.hasMany(Summary, { foreignKey: 'user_id' });
Summary.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Summary;