const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db'); // Adjust the path based on your project structure
const QuizCompletion = require('./quizCompletion'); // Import QuizResponse model

const QuizResponse = sequelize.define('QuizResponse', {
    quizCompletionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_quiz_completion',
            key: 'id'
        }
    },
    questionId: {
        type: DataTypes.STRING, // Use STRING if questionId can be alphanumeric
        allowNull: false,
    },
    answer: {
        type: DataTypes.JSON, // Use STRING if options can be alphanumeric
        allowNull: false,
    },
    isCorrect: { // Boolean field
        type: DataTypes.BOOLEAN,
        allowNull: true,
    }
}, {
    tableName: 'tbl_quiz_response',
    timestamps: true, // Adds created_at and updated_at fields
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = QuizResponse;

// Define association
QuizCompletion.hasMany(QuizResponse, { foreignKey: 'quizCompletionId', onDelete: 'CASCADE' });
QuizResponse.belongsTo(QuizCompletion, { foreignKey: 'quizCompletionId' });