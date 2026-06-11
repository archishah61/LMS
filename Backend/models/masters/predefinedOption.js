const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const { PreDefinedQuestions } = require('./predefinedQuestion');

const PreDefinedOptions = sequelize.define(
  "PreDefinedOptions",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    pre_defined_question_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "tbl_pre_defined_questions", // Reference to predefined questions
        key: "id",
      },
      allowNull: false,
    },
    option_text: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    option_img: {
      type: DataTypes.STRING, // Store filename/path if option has an image
      allowNull: true,
    },
    is_correct: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // Only one or multiple options can be marked correct
    },
    created_by: {
      type: DataTypes.INTEGER, // admin.id
      allowNull: false,
      references: {
        model: "tbl_admin",
        key: "id",
      },
    },
    updated_by: {
      type: DataTypes.INTEGER, // admin.id
      allowNull: false,
      references: {
        model: "tbl_admin",
        key: "id",
      },
    },
  },
  {
    tableName: "tbl_pre_defined_options",
    timestamps: true, // Enables created_at & updated_at fields
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Define associations
PreDefinedOptions.associate = (models) => {
  PreDefinedOptions.belongsTo(models.PreDefinedQuestions, { foreignKey: 'pre_defined_question_id' });
  PreDefinedOptions.belongsTo(models.Admin, { foreignKey: 'created_by' });
  PreDefinedOptions.belongsTo(models.Admin, { foreignKey: 'updated_by' });
};

PreDefinedQuestions.hasMany(PreDefinedOptions, { foreignKey: 'pre_defined_question_id' });
PreDefinedOptions.belongsTo(PreDefinedQuestions, { foreignKey: 'pre_defined_question_id' });

// Exporting Model
module.exports = { PreDefinedOptions };
