const { callProcedure } = require("../../utils/procedure/callProcedure");
const Validation = require("../../validations");

const validateDragDropQuestion = (data, isUpdate = false) => {
  const errors = [];

  try {
    if (!isUpdate || data.quiz_id !== undefined) {
      Validation.isInteger(data.quiz_id, "Quiz ID must be a valid integer.");
    }

    if (!isUpdate || data.prompt !== undefined) {
      Validation.isString(data.prompt, { min: 3, max: 1000 }, "Prompt must be 3–1000 characters.");
    }

    if (!isUpdate || data.options !== undefined) {
      if (!Array.isArray(data.options) || data.options.length === 0) {
        throw new Error("Options must be a non-empty array.");
      }

      data.options.forEach((opt, index) => {
        if (typeof opt !== "string" || opt.trim().length === 0) {
          throw new Error(`Option at index ${index} must be a non-empty string.`);
        }
      });
    }

    if (data.marks !== undefined) {
      Validation.isInteger(data.marks, "Marks must be a valid number.");
    }

  } catch (err) {
    errors.push(err.message);
  }

  return errors;
};

// -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------

// Create a new drag-drop question using stored procedure
exports.createDragDropQuestion = async (req, res, next) => {
  try {

    const userId = req.user.id;
    const role = req.user.role;

    const { quiz_id, prompt, options, blanks, marks } = req.body;

    const errors = validateDragDropQuestion(req.body);
    if (errors.length) {
      return res.status(400).json({ errors });
    }

    // Check for required fields
    if (!quiz_id || !prompt || !options || !blanks) {
      return res.status(400).json({
        message: "Quiz ID, prompt, options, blanks are required.",
      });
    }

    // Call the stored procedure
    const result = await callProcedure("createDragDropQuestion", [
      quiz_id,
      prompt,
      JSON.stringify(options),
      JSON.stringify(blanks),
      marks || (Array.isArray(blanks) ? blanks.length : 0),
      userId,
      userId,
      role,
      role
    ]);

    if (!result.success) {
      throw new Error(result.error);
    }

    // If no rows returned, quiz doesn't exist (handled in the procedure)
    if (!result.data || result.data.length === 0) {
      return res.status(404).json({ error: "Related quiz not found." });
    }

    res.status(201).json({
      success: true,
      message: "Drag drop question created successfully",
      data: result.data[0]
    });
  } catch (error) {
    next(error);
  }
};

// Get all drag-drop questions (optionally filter by quiz_id) using stored procedure
exports.getAllDragDropQuestions = async (req, res, next) => {
  try {
    const { quiz_id } = req.query;

    const result = await callProcedure("getAllDragDropQuestions", [
      quiz_id || null,
    ]);

    if (!result.success) {
      throw new Error(result.error);
    }



    // Handle case where quiz not found (will be an empty result or error flag from procedure)
    if (result.data[0] && result.data[0].error) {
      return res.status(404).json({ error: "Related quiz not found." });
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

// Get drag-drop questions by quiz ID using stored procedure
exports.getDragDropQuestionsByQuizId = async (req, res, next) => {
  try {
    const { quiz_id } = req.params;

    const result = await callProcedure("getDragDropQuestionsByQuizId", [
      quiz_id,
    ]);

    if (!result.success) {
      throw new Error(result.error);
    }


    // If no rows returned, quiz doesn't exist (handled in the procedure)
    if (!result.data || (result.data.length === 0 && !result.success)) {
      return res.status(404).json({ error: "Related quiz not found." });
    }

    // Handle case where quiz not found (will be an empty result or error flag from procedure)
    if (result.data[0] && result.data[0].error) {
      return res.status(404).json({ error: "Related quiz not found." });
    }

    res.status(200).json(result.data);
  } catch (error) {
    next(error);
  }
};

// Get one drag-drop question by ID using stored procedure
exports.getDragDropQuestionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await callProcedure("getDragDropQuestionById", [id]);

    if (!result.success) {
      throw new Error(result.error);
    }



    const questions = result.data;

    if (!questions || questions.length === 0) {
      return res.status(404).json({ success: false, error: "Not Found" });
    }

    res.status(200).json({ success: true, data: questions[0] });
  } catch (error) {
    next(error);
  }
};

// Update drag-drop question using stored procedure
exports.updateDragDropQuestion = async (req, res, next) => {
  try {

    const userId = req.user.id;
    const role = req.user.role;


    const { id } = req.params;
    const { quiz_id, prompt, options, blanks, marks } = req.body;

    const errors = validateDragDropQuestion(req.body, true);
    if (errors.length) {
      return res.status(400).json({ errors });
    }

    const result = await callProcedure("updateDragDropQuestion", [
      id,
      quiz_id,
      prompt,
      options ? JSON.stringify(options) : null,
      blanks ? JSON.stringify(blanks) : null,
      marks,
      userId,
      role,
    ]);

    if (!result.success) {
      throw new Error(result.error);
    }

    const updatedQuestion = result.data;

    if (!updatedQuestion || updatedQuestion.length === 0) {
      return res.status(404).json({ success: false, error: "Not Found" });
    }

    res.status(200).json({ success: true, data: updatedQuestion[0] });
  } catch (error) {
    next(error);
  }
};

// Delete drag-drop question using stored procedure
exports.deleteDragDropQuestion = async (req, res, next) => {
  try {
    const result = await callProcedure("deleteDragDropQuestion", [
      req.params.id,
    ]);

    if (!result.success) {
      throw new Error(result.error);
    }


    // If error returned, question doesn't exist
    if (result.data && result.data[0] && result.data[0].error) {
      return res
        .status(404)
        .json({ success: false, error: result.data[0].error });
    }

    res.status(200).json({
      success: true,
      message: "Drag drop question deleted successfully",
      data: result.data[0],
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------PROCEDURE RELATED CODE ENDS-----------------------------------

