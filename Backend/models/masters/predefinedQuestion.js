const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const PreDefinedQuestions = sequelize.define(
  "PreDefinedQuestions",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    question_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    question_img: {
      type: DataTypes.STRING, // Store filename/path from multer
      allowNull: true,
    },
    question_type: {
      type: DataTypes.ENUM(
        "mcq",
        "image",
        "true_false"
      ),
      allowNull: false,
      defaultValue: "mcq",
    },
    marks: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sequence_no: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull:false,
      defaultValue:true,
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
    tableName: "tbl_pre_defined_questions",
    timestamps: true, // Enables created_at & updated_at fields
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Define associations
PreDefinedQuestions.associate = (models) => {
  PreDefinedQuestions.belongsTo(models.Quizzes, { foreignKey: 'quiz_id', allowNull: true }); // Optional relation
  PreDefinedQuestions.belongsTo(models.Admin, { foreignKey: 'created_by' });
  PreDefinedQuestions.belongsTo(models.Admin, { foreignKey: 'updated_by' });
};

// Exporting Model
module.exports = { PreDefinedQuestions };
