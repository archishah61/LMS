const SummarizePassageQuestion = require('../../models/content_management/quiz-questions-types/summarPassageModel');
const { Quizzes } = require('../../models/content_management/quizzesModel');
const { SummarizerManager } = require("node-summarizer");


// -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------
// const { callProcedure } = require("../../utils/procedure//callProcedure");

const { callProcedure } = require("../../utils/procedure/callProcedure");

// ✅ Create SummarizePassageQuestion using stored procedure
exports.createSummarizePassageQuestion = async (req, res, next) => {
  try {
    const { quiz_id, summary, time_limit ,marks } = req.body;

    const userId = req.user.id
    const role = req.user.role

    const result = await callProcedure("CreateSummarizePassageQuestion", [
      quiz_id,
      summary,
      time_limit,
      marks,
      userId,
      userId,
      role,
      role
    ]);


    res.status(201).json({
      message: "Summarize passage question created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Get All SummarizePassageQuestions using stored procedure
exports.getAllSummarizePassageQuestions = async (req, res, next) => {
  try {
    const result = await callProcedure("GetAllSummarizePassageQuestions");

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ✅ Get SummarizePassageQuestions by Quiz ID using stored procedure
exports.getSummarizePassageQuestionsByQuizId = async (req, res, next) => {
  const { quiz_id } = req.params;

  try {
  
    const result = await callProcedure("GetSummarizePassageQuestionsByQuizId", [quiz_id]);

    if (!result || result.length === 0) {
      return res.status(404).json({ error: "No summarize-passage questions found for this quiz" });
    }
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ✅ Update SummarizePassageQuestion by ID using stored procedure
exports.updateSummarizePassageQuestionById = async (req, res, next) => {
  const { id } = req.params;
  const { quiz_id, summary, time_limit , marks} = req.body;

  try {

    const userId = req.user.id
    const role = req.user.role

    const result = await callProcedure("UpdateSummarizePassageQuestionById", [
      id,
      quiz_id,
      summary,
      time_limit,
      marks,
      userId,
      role
    ]);

    if (!result || result.length === 0) {
      return res.status(404).json({ error: "Summarize-passage question not found" });
    }

    res.status(200).json({
      message: "Summarize-passage question updated successfully",
      summarizePassageQuestion: result[0],
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Delete SummarizePassageQuestion by ID using stored procedure
exports.deleteSummarizePassageQuestionById = async (req, res, next) => {
  const { id } = req.params;

  try {

    const result = await callProcedure("DeleteSummarizePassageQuestionById", [id]);

    res.status(200).json({
      message: "Summarize-passage question deleted successfully",
      deleted: result[0],
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------PROCEDURE RELATED CODE ENDS-----------------------------------