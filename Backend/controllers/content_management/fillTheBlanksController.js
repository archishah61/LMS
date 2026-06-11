const FillTheBlanksQuestion = require("../../models/content_management/fillTheBlanks");
const cheerio = require("cheerio");

// -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------

const { callProcedure } = require("../../utils/procedure/callProcedure");


// Controller: Create Fill-in-the-Blank Question using stored procedure
const createFillTheBlanksQuestion = async (req, res, next) => {
  try {
    const {
      assignment_id,
      question_text,
      created_by_type = 'admin',
      updated_by_type = 'admin',
    } = req.body;

    const userId = req?.user?.id;
    const userRole = req?.user?.role;

    if (
      !assignment_id ||
      !question_text
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields. Provide 'assignment_id', 'question_text'.",
      });
    }

    const { questionWithBlanks, answers } = extractAnswersAndReplaceWithBlanks(question_text);

    if (answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Each question must contain at least one underlined word.",
      });
    }

    // Call stored procedure
    const result = await callProcedure("createFillTheBlanksQuestion", [
      assignment_id,
      questionWithBlanks,
      JSON.stringify(answers),
      userId,
      userId,
      userRole,
      userRole
    ]);

    if (!result.success && result.error) return next(result.error);

    return res.status(201).json({
      success: true,
      message: "Fill-in-the-blank questions created successfully!",
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

// Get All Fill-in-the-Blank Questions for an Assignment
const getFillTheBlanksQuestionsByAssignmentId = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;

    // Call the procedure and get the data
    const { success, data, error } = await callProcedure("getFillTheBlanksQuestionsByAssignmentId", [assignmentId]);

    if (!success) {
      return next(error);
      // return res.status(400).json({ success: false, error });
    }

    // Ensure that the response is always an array, even if the data contains only one object
    const fillTheBlanksQuestions = data.length > 0 ? [data[0]] : [];  // Always an array

    // Send back the response in the exact format as required
    res.status(200).json({
      success: true,
      data: fillTheBlanksQuestions, // Return the data as an array
    });
  } catch (error) {
    next(error);
  }
};

// Update Fill-in-the-Blank Question using stored procedure
const updateFillTheBlanksQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { question_text } = req.body;
    const userId = req?.user?.id;
    const userRole = req?.user?.role;

    // Extract answers and replace blanks using your helper function
    const { questionWithBlanks, answers } = extractAnswersAndReplaceWithBlanks(question_text);

    if (answers.length === 0) {
      return res.status(400).json({ success: false, message: "No underlined answer found in the question text." });
    }

    // Call the stored procedure to update the question
    const { success, data, error } = await callProcedure("updateFillTheBlanksQuestion", [
      id,
      questionWithBlanks,
      JSON.stringify(answers),  // Convert answers array to a JSON string
      userId,
      userRole
    ]);

    if (!success) {
      return next(error);
      // return res.status(400).json({ error: error });
    }

    const updatedQuestion = data[0]; // Assuming the procedure returns the updated question

    res.status(200).json({
      success: true,
      message: "Question updated successfully",
      data: updatedQuestion,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Fill-in-the-Blank Question using stored procedure
const deleteFillTheBlanksQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Call the stored procedure to delete the question
    const { success, data, error } = await callProcedure("deleteFillTheBlanksQuestion", [id]);

    if (!success) {
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "Question deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------PROCEDURE RELATED CODE ENDS-----------------------------------

const extractAnswersAndReplaceWithBlanks = (htmlText) => {
  const $ = cheerio.load(htmlText);
  let answers = [];

  $("u, span[style*='underline']").each((index, element) => {
    const answerText = $(element).text().trim();
    answers.push(answerText);
    $(element).replaceWith("_____ ");
  });

  return {
    questionWithBlanks: $.html(),
    answers,
  };
};


module.exports = {
  createFillTheBlanksQuestion,
  getFillTheBlanksQuestionsByAssignmentId,
  updateFillTheBlanksQuestion,
  deleteFillTheBlanksQuestion,
};
