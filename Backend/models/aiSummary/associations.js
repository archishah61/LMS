// models/aiSummary/summaryAssociations.js

const User = require("../auth/user");
const { Accordion } = require("../content_management/accordian");
const { GeneralMaterial } = require("../content_management/genral");
const { MultiSlideAccordion } = require("../content_management/multiSlideAccordian");
const { MultiSlideGeneral } = require("../content_management/multiSlideGeneral");
const Topic = require("../course_management/topic");
const BulletPoint = require("./BulletPoint");
const FlashCard = require("./flashCard");
const Summary = require("./summary");

const setupSummaryAssociations = () => {
  // Define associations for Summary, BulletPoint, and FlashCard
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

  Summary.hasMany(BulletPoint, { foreignKey: 'summary_id', as: 'bullet_points', onDelete: 'CASCADE' });
  BulletPoint.belongsTo(Summary, { foreignKey: 'summary_id' });

  Summary.hasMany(FlashCard, { foreignKey: 'summary_id', as: 'flash_cards', onDelete: 'CASCADE' });
  FlashCard.belongsTo(Summary, { foreignKey: 'summary_id' });
};

module.exports = setupSummaryAssociations;
