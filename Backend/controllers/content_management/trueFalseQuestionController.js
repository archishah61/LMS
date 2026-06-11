// controllers/trueFalseQuestionController.js
const TrueFalseQuestion = require("../../models/content_management/trueFalseQuestion");


// -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------

const { callProcedure } = require("../../utils/procedure/callProcedure"); // Adjust path if needed

// Create True/False Question using stored procedure
const createTrueFalseQuestion = async (req, res, next) => {
  try {
    const { assignment_id, question_text, correct_answer } = req.body;
    const userId = req?.user?.id;
    const userRole = req?.user?.role;

    const result = await callProcedure("createTrueFalseQuestion", [
      assignment_id,
      question_text,
      correct_answer,
      userId,
      userId,
      userRole,
      userRole
    ]);

    if (!result.success && result.error) {
      return next(result.error);
    }

    res.status(201).json({
      success: true,
      message: "True/False question created successfully!",
      trueFalseQuestion: result[0], // The newly created question
    });
  } catch (error) {
    next(error);
  }
};

// Get All True/False Questions for an Assignment using stored procedure
const getTrueFalseQuestionsByAssignmentId = async (req, res, next) => {
  const { assignmentId } = req.params;

  try {
    // Call the stored procedure
    const result = await callProcedure('getTrueFalseQuestionsByAssignmentId', [assignmentId]);


    // Check if the result is successful and has data
    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      // Map the result to match the desired structure
      const formattedResult = result.data.map((question) => ({
        id: question.id,
        assignment_id: question.assignment_id,
        question_text: question.question_text,
        correct_answer: question.correct_answer === 1, // Convert tinyint(1) to boolean (0/1 -> false/true)
        created_at: question.created_at,
        updated_at: question.updated_at,
      }));

      return res.status(200).json(formattedResult); // Return the formatted result
    }

    if (!result.success && result.error) {
      return next(error);
    }

    // If no data found
    return res.status(404).json({ success: false, message: "No questions found for this assignment." });
  } catch (error) {
    next(error);
  }
};

// Update True/False Question using stored procedure
const updateTrueFalseQuestion = async (req, res, next) => {
  const { id } = req.params;
  const { question_text, correct_answer } = req.body;

  const userId = req?.user?.id;
  const userRole = req?.user?.role;

  try {
    // Call the stored procedure to update the question
    const result = await callProcedure("updateTrueFalseQuestion", [
      id,
      question_text,
      correct_answer,
      userId,
      userRole
    ]);

    // Check if data was returned
    if (Array.isArray(result.data) && result.data.length > 0) {
      const updatedQuestion = result.data[0];

      // Format the result to return boolean instead of 1/0
      const formattedQuestion = {
        id: updatedQuestion.id,
        assignment_id: updatedQuestion.assignment_id,
        question_text: updatedQuestion.question_text,
        correct_answer: updatedQuestion.correct_answer === 1,
        created_at: updatedQuestion.created_at,
        updated_at: updatedQuestion.updated_at,
      };

      return res.status(200).json([formattedQuestion]);
    }

    if (!result.success && result.error) {
      return next(result.error);
    }

    return res.status(404).json({
      success: false,
      message: "True/False question not found",
    });
  } catch (error) {
    next(error);
  }
};


// Delete True/False Question using stored procedure
const deleteTrueFalseQuestion = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Call the stored procedure
    const result = await callProcedure("deleteTrueFalseQuestion", [id]);

    // If deletion was successful, MySQL procedure typically returns affected rows or success message
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: "True/False question deleted successfully",
      });
    }

    if (!result.success && result.error) {
      return next(result.error);
    }

    return res.status(404).json({
      success: false,
      message: "True/False question not found",
    });
  } catch (error) {
    next(error);
  }
};


// -------------------------------------PROCEDURE RELATED CODE ENDS---------------------------------

module.exports = {
  createTrueFalseQuestion,
  getTrueFalseQuestionsByAssignmentId,
  updateTrueFalseQuestion,
  deleteTrueFalseQuestion,
};
