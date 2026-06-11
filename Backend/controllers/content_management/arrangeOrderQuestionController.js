const { callProcedure } = require('../../utils/procedure/callProcedure');
const Validation = require('../../validations');

const validateArrangeOrderQuestion = (data, isUpdate = false) => {
  const errors = [];

    
  try {
    if (!isUpdate || data.quiz_id !== undefined) {
      Validation.isInteger(data.quiz_id, "Quiz ID must be a valid integer.");
    }
    if (!isUpdate || data.sentences !== undefined) {
      Validation.isJSONArray(data.sentences, "Sentences must be a valid JSON array.");
    }
    if (!isUpdate || data.correct_order !== undefined) {
      Validation.isJSONArray(data.correct_order, "Correct order must be a valid JSON array.");
    }
    if (data.marks === undefined || isNaN(data.marks)) {
      errors.push("Marks are required and must be a number.");
    } else {
      Validation.isInteger(data.marks, "Marks must be a valid integer.");
    }
  } catch (err) {
    errors.push(err.message);
  }
  return errors;
};

// ✅ Create ArrangeOrderQuestion using stored procedure
exports.createArrangeOrderQuestion = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { quiz_id, sentences, correct_order, marks } = req.body;
    const errors = validateArrangeOrderQuestion(req.body, false);
    if (errors.length) {
      return res.status(400).json({ errors });
    }
    if (!quiz_id) {
      return res.status(400).json({ error: "Quiz ID is required." });
    }
    if (!sentences) {
      return res.status(400).json({ error: "Sentences are required." });
    }
    if (!correct_order) {
      return res.status(400).json({ error: "Correct order is required." });
    }
    if (marks === undefined) {
      return res.status(400).json({ error: "Marks are required." });
    }
    const procedureResult = await callProcedure('createArrangeOrderQuestion', [
      quiz_id,
      JSON.stringify(sentences),
      JSON.stringify(correct_order),
      marks,
      userId,
      userId,
      role,
      role,
    ]);
    if (!procedureResult.success) {
      return next(procedureResult.error);
    }
    const results = procedureResult.data[0];
    res.status(201).json({
      message: results[0]?.message || "Arrange order question created successfully",
      arrangeOrderQuestion: results[0]
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Get All ArrangeOrderQuestions using stored procedure
exports.getAllArrangeOrderQuestions = async (req, res, next) => {
  try {
    const procedureResult = await callProcedure('getAllArrangeOrderQuestions');
    if (!procedureResult.success) {
      return next(procedureResult.error);
    }
    const questions = procedureResult.data;
    res.status(200).json(questions);
  } catch (error) {
    next(error);
  }
};

// ✅ Get ArrangeOrderQuestion by ID using stored procedure
exports.getArrangeOrderQuestionById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const procedureResult = await callProcedure('getArrangeOrderQuestionById', [id]);
    if (!procedureResult.success) {
      return next(procedureResult.error);
    }
    const question = procedureResult.data[0];
    if (!question) {
      return res.status(404).json({ error: "Arrange order question not found" });
    }
    res.status(200).json(question);
  } catch (error) {
    next(error);
  }
};

// ✅ Get ArrangeOrderQuestions by Quiz ID using stored procedure
exports.getArrangeOrderQuestionsByQuizId = async (req, res, next) => {
  const { quiz_id } = req.params;
  try {
    const procedureResult = await callProcedure('getArrangeOrderQuestionsByQuizId', [quiz_id]);
    if (!procedureResult.success) {
      return next(procedureResult.error);
    }
    const questions = procedureResult.data;
    if (!questions || questions.length === 0) {
      return res.status(404).json({ error: "No arrange order questions found for this quiz" });
    }
    res.status(200).json(questions);
  } catch (error) {
    next(error);
  }
};

// ✅ Update ArrangeOrderQuestion by ID using Stored Procedure
exports.updateArrangeOrderQuestionById = async (req, res, next) => {
  const userId = req.user.id;
  const role = req.user.role;
  const { id } = req.params;
  const {  sentences, correct_order, marks } = req.body;
  const errors = validateArrangeOrderQuestion(req.body, true);
  if (errors.length) {
    return res.status(400).json({ errors });
  }
  try {
    const procedureResult = await callProcedure('updateArrangeOrderQuestionById', [
      id,
      JSON.stringify(sentences),
      JSON.stringify(correct_order),
      marks,
      userId,
      role,
    ]);
    if (!procedureResult.success) {
      return next(procedureResult.error);
    }
    const updatedQuestion = procedureResult.data[0];
    res.status(200).json({
      message: "Arrange order question updated successfully",
      arrangeOrderQuestion: updatedQuestion,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Delete ArrangeOrderQuestion by ID using Stored Procedure
exports.deleteArrangeOrderQuestionById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { success, data, error } = await callProcedure("deleteArrangeOrderQuestionById", [id]);
    if (!success || !data || data.length === 0) {
      return res.status(404).json({ error: error || "Arrange order question not found" });
    }
    const deletedQuestion = data[0];
    res.status(200).json({
      message: "Arrange order question deleted successfully",
      deleted: deletedQuestion,
    });
  } catch (error) {
    next(error);
  }
};