const { PreDefinedOptions } = require("../../models/masters/predefinedOption");
const { PreDefinedQuestions } = require("../../models/masters/predefinedQuestion");
const { QuizPreDefinedQuestions } = require("../../models/masters/quizPreDefinedQuestions");


// -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------
const { callProcedure } = require("../../utils/procedure/callProcedure");

// Assign a predefined question to a quiz using stored procedure
const assignPredefinedQuestionToQuiz = async (req, res, next) => {
  try {
    const questions = req.body;


    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "Invalid request format. Expecting an array of questions." });
    }

    // Validate each entry
    for (const question of questions) {
      if (!question.quiz_id || !question.pre_defined_question_id || !question.created_by || !question.updated_by) {
        return res.status(400).json({ error: "All fields are required in each question entry." });
      }
    }

    // Convert the array of questions to a JSON string
    const questionsJson = JSON.stringify(questions);

    try {
      // Call the stored procedure with the JSON string
      const result = await callProcedure("assignPredefinedQuestionToQuiz", [questionsJson]);


      return res.status(201).json({
        message: "Predefined questions assigned to quiz successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error assigning predefined questions to quiz:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  } catch (error) {
    next(error);
  }
};

// Update the mapping of a predefined question in a quiz using stored procedure
const updateQuizPredefinedQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quiz_id, pre_defined_question_id, updated_by } = req.body;

    if (!quiz_id || !pre_defined_question_id || !updated_by) {
      return res.status(400).json({ error: "quiz_id, pre_defined_question_id, and updated_by are required." });
    }

    // Call the stored procedure
    const result = await callProcedure("updateQuizPredefinedQuestion", [
      parseInt(id),
      quiz_id,
      pre_defined_question_id,
      updated_by
    ]);

    res.json({
      message: "Predefined question mapping updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Remove a predefined question from a quiz using stored procedure
const removePredefinedQuestionFromQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;


    if (!id) {
      return res.status(400).json({ error: "ID parameter is required." });
    }

    const result = await callProcedure("deleteQuizPredefinedQuestion", [parseInt(id)]);

    if (result.error) {
      return next(result.error);
    }

    return res.status(200).json({
      success: result.success,
      message: "Predefined question removed from quiz successfully"
    })
  } catch (error) {
    next(error);
  }
};

// List all predefined question-quiz mappings using stored procedure
const listAllQuizPredefinedMappings = async (req, res, next) => {
  try {
    const result = await callProcedure("listAllQuizPredefinedMappings");

    res.status(200).json({
      message: "All predefined question-quiz mappings retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific predefined question-quiz mapping by ID using stored procedure
const getQuizPredefinedMappingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const mapping = await callProcedure("getQuizPredefinedMappingById", [id]);

    if (!mapping) {
      return res.status(404).json({ error: "Mapping not found." });
    }

    res.status(200).json({
      message: "Predefined question-quiz mapping retrieved successfully",
      data: mapping,
    });
  } catch (error) {
    next(error);
  }
};

// Get predefined questions according to quiz ID using stored procedure
const getPredefinedQuestionsByQuizId = async (req, res, next) => {
  try {
    const { quiz_id } = req.params;

    const rawResult = await callProcedure("getPredefinedQuestionsByQuizId", [quiz_id]);

    if (rawResult.error) {
      return next(rawResult.error);
    }

    const result = rawResult.data; // ✅ Corrected unwrapping


    const grouped = result?.reduce((acc, row) => {
      const existing = acc.find(q => q.pre_defined_question_id === row.pre_defined_question_id);
      const option = row.option_id
        ? { id: row.option_id, option_text: row.option_text, option_img: row.option_img, is_correct: row.is_correct }
        : null;

      if (existing) {
        if (option) existing.options.push(option);
      } else {
        acc.push({
          mapping_id: row.mapping_id,
          quiz_id: row.quiz_id,
          pre_defined_question_id: row.pre_defined_question_id,
          question_text: row.question_text,
          question_type: row.question_type,
          question_img: row.question_img,
          marks: row.marks, // Include the marks field
          options: option ? [option] : []
        });
      }

      return acc;
    }, []);

    res.json({ message: "Predefined questions for the quiz retrieved successfully", data: grouped });
  } catch (error) {
    next(error);
  }
};


// -------------------------------------PROCEDURE RELATED CODE ENDS---------------------------------


module.exports = {
  assignPredefinedQuestionToQuiz,
  updateQuizPredefinedQuestion,
  removePredefinedQuestionFromQuiz,
  listAllQuizPredefinedMappings,
  getQuizPredefinedMappingById,
  getPredefinedQuestionsByQuizId,
};
