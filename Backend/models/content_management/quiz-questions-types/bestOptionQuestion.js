const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db'); // Adjust the path as needed
const { Quizzes } = require('../quizzesModel');

const BestOptionQuestion = sequelize.define(
  'BestOptionQuestion',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    quiz_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbl_quiz',
        key: 'id',
      },
    },
    passage: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Passage with placeholders like {1}, {2} where words are blanked',
    },
    blanked_words: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Original words that were removed (correct answers)',
    },
    distractor_options: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Map of correct word => [correct + distractors]',
    },
    marks: {
      type: DataTypes.INTEGER, // Use INTEGER type to store a single integer value for marks
      allowNull: false,
      defaultValue: 0, // Default value as 0
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
    tableName: 'tbl_bestoptionquestion',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
    //When underscored: true is set:
    //All attribute names (field names) in the model that use camelCase format 
    // (like created_at, updated_at, quizId) will be automatically converted to snake_case format 
    // (like created_at, updated_at, quiz_id) in the actual database table.
  }
);

// Associations

Quizzes.hasMany(BestOptionQuestion, { foreignKey: 'quiz_id' });
BestOptionQuestion.belongsTo(Quizzes, { foreignKey: 'quiz_id' });

module.exports = { BestOptionQuestion };
