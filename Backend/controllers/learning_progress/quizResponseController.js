
// -------------------------------------PROCEDURE RELATED CODE ENDS-----------------------------------

// The original controller code using Sequelize is commented out below:

const QuizResponse = require("../../models/learning_progress/quizResponse"); // Adjust the path as necessary

// Create Quiz Response
exports.createQuizResponse = async (req, res, next) => {
    try {
        const response = req.body

        // Ensure req.body is an array of objects with questionId, QuizCompletionId, and selectedOptionId
        if (!Array.isArray(response) || response === 0) {
            throw new Error('Invalid request body. Expected an array of quiz answers.');
        }


        // Validate each item in the array
        response.forEach((item) => {
            if (!item.questionId || !item.quizCompletionId || !item.answer) {
                throw new Error('Each quiz answer must contain questionId, QuizCompletionId, and answer.');
            }
        });

        // Create quiz responses in bulk
        const quizResponses = await QuizResponse.bulkCreate(response);
        res.status(201).json(quizResponses);
    } catch (error) {
        next(error);
    }
};


