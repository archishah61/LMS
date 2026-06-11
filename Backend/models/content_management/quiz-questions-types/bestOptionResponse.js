const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db'); // Adjust according to your project structure

const BestOptionResponse = sequelize.define(
  'BestOptionResponse',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    question_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbl_bestoptionquestion', // Ensure this matches the actual model name
        key: 'id',
      },
      onDelete: 'CASCADE', // ✅ Enable cascade delete
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbl_users', // Ensure this matches the actual model name
        key: 'id',
      },
      onDelete: 'CASCADE', // ✅ Enable cascade delete
    },
    selected_option: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Student’s selected options for each blank (ordered)',
    },
    is_correct: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      comment: 'Whether the selected options match the correct ones',
    },
  },
  {
    tableName: 'tbl_bestoptionresponse',
    timestamps: true, // Automatically manage created_at and updated_at
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Optional: If you're defining associations in the model file
BestOptionResponse.associate = (models) => {
  BestOptionResponse.belongsTo(models.BestOptionQuestion, {
    foreignKey: 'question_id',
    onDelete: 'CASCADE', // Ensure cascade delete behavior
  });
  BestOptionResponse.belongsTo(models.User, {
    foreignKey: 'student_id',
    onDelete: 'CASCADE', // Ensure cascade delete behavior
  });
};

module.exports = { BestOptionResponse };
