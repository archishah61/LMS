const { PreDefinedQuestions } = require("../../models/masters/predefinedQuestion")
const { PreDefinedOptions } = require("../../models/masters/predefinedOption")
const { callProcedure } = require("../../utils/procedure/callProcedure")
const Validation = require("../../validations")
const { callProcedureChallenge } = require("../../utils/procedure/callProcedureChallenge")

// Validation functions
const validateQuestion = (data, userId, isUpdate = false) => {
  const errors = []
  try {
    // Check if question_text is required only for specific types
    const requiresQuestionText = ["mcq", "true_false"].includes(data.question_type)

    if ((!isUpdate && requiresQuestionText) || (isUpdate && data.question_text !== undefined)) {
      if (requiresQuestionText || data.question_text !== undefined) {
        Validation.isString(data.question_text, { min: 5, max: 1000 }, "Question text must be 5-1000 characters")
      }
    }

    if (data.marks !== undefined) {
      Validation.isInteger(data.marks, "Marks must be a number")
    }

    if (data.question_type && !["mcq", "image", "true_false"].includes(data.question_type)) {
      errors.push("Invalid question type")
    }

    Validation.isInteger(
      userId,
      isUpdate ? "Updated by must be a valid admin ID" : "Created by must be a valid admin ID"
    )
  } catch (err) {
    errors.push(err.message)
  }
  return errors
}

const validateOptions = (options, userId, optionImages, isUpdate = false) => {
  const errors = []

  if (!Array.isArray(options) || options.length < 2) {
    errors.push("At least 2 options are required")
    return errors
  }

  const correctOptions = options.filter((opt) => opt.is_correct)
  if (correctOptions.length !== 1) {
    errors.push("Exactly one option must be marked as correct")
  }

  options.forEach((option, index) => {
    try {
      if ((!option.option_text || option.option_text.trim().length === 0) && (!isUpdate && (!optionImages || !optionImages[index]))) {
        errors.push(`Option ${index + 1} text or image required`)
      }
      if (option.option_text && option.option_text.length > 500) {
        errors.push(`Option ${index + 1} text must be less than 500 characters`)
      }
      if (typeof option.is_correct !== "boolean") {
        errors.push(`Option ${index + 1} must have valid is_correct value`)
      }
    } catch (err) {
      errors.push(`Option ${index + 1}: ${err.message}`)
    }
  })

  return errors
}

// Create question with options
exports.createQuestionWithOptions = async (req, res, next) => {
  try {
    const { question_text, question_type, marks, options } = req.body
    const created_by = req.user.id

    // Parse options if it's a string
    let parsedOptions
    try {
      parsedOptions = typeof options === "string" ? JSON.parse(options) : options
    } catch (error) {
      return res.status(400).json({ errors: ["Invalid options format"] })
    }

    // Validate question
    // const questionErrors = validateQuestion(req.body, created_by)
    // if (questionErrors.length) {
    //   return res.status(400).json({ errors: questionErrors })
    // }

    // Handle question image
    const question_img = req.files?.predefineQuestionImage
      ? "/quiz/predefined_question_images/" + req.files.predefineQuestionImage[0].filename
      : null

    // Handle option images
    const optionImages = {}

    for (const key in req.files) {
      if (key.startsWith("predefineOptionImages[")) {
        const match = key.match(/predefineOptionImages\[(\d+)\]/);
        if (match) {
          const index = parseInt(match[1], 10);
          const file = req.files[key][0]; // Multer stores files as array per field
          optionImages[index] = "/quiz/predefined_option_images/" + file.filename;
        }
      }
    }

    // Validate options
    // const optionErrors = validateOptions(parsedOptions, created_by, optionImages)
    // if (optionErrors.length) {
    //   return res.status(400).json({ errors: optionErrors })
    // }

    // Create question with options using stored procedure
    const result = await callProcedure("createQuestionWithOptions", [
      question_text,
      question_img,
      question_type,
      marks,
      created_by,
      JSON.stringify(
        parsedOptions.map((option, index) => ({
          ...option,
          option_img: optionImages[index],
        })),
      ),
    ])

    if (result.error) {
      return next(result.error);
    }

    res.status(201).json({
      message: "Question with options created successfully",
      data: result.data,
    })
  } catch (error) {
    next(error)
  }
}

// Get all questions with options
// Get all questions with options (with pagination + search)
exports.getAllQuestionsWithOptions = async (req, res, next) => {
  try {
    const { search = "", page = 1, limit = 'all', questionType, status = null } = req.query;

    const result = await callProcedureChallenge("getAllQuestionsWithOptions", [
      search,
      parseInt(page),
      limit === 'all' ? 0 : parseInt(limit),
      questionType || null,
      status || null,
      limit === 'all' || false
    ]);

    if (result.error) {
      return next(result.error);
    }

    res.status(200).json({
      data: {
        questions: Object.values(result.data[0]) || [],
        total: result.data[1]['0'].total
      },
      success: true
    });

  } catch (error) {
    next(error);
  }
};

// Get question by ID with options
exports.getQuestionWithOptionsById = async (req, res, next) => {
  const { id } = req.params
  try {
    const result = await callProcedure("getQuestionWithOptionsById", [id])

    if (result.error) {
      return next(result.error);
    }

    const rows = result.data

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Question not found" })
    }

    // Group options with question
    const question = {
      id: rows[0].id,
      question_text: rows[0].question_text,
      question_img: rows[0].question_img,
      question_type: rows[0].question_type,
      marks: rows[0].marks,
      sequence_no: rows[0].sequence_no,
      created_at: rows[0].created_at,
      updated_at: rows[0].updated_at,
      options: rows
        .filter((row) => row.option_id !== null)
        .map((row) => ({
          id: row.option_id,
          option_text: row.option_text,
          option_img: row.option_img,
          is_correct: Boolean(row.is_correct),
          created_at: row.option_created_at,
          updated_at: row.option_updated_at,
        })),
    }

    res.status(200).json(question)
  } catch (error) {
    next(error)
  }
}

// Update question with options
exports.updateQuestionWithOptions = async (req, res, next) => {
  const { id } = req.params
  try {
    const { question_text, question_type, marks, options } = req.body
    const updated_by = req.user.id

    // Parse options if it's a string
    let parsedOptions
    try {
      parsedOptions = typeof options === "string" ? JSON.parse(options) : options
    } catch (error) {
      return res.status(400).json({ errors: ["Invalid options format"] })
    }

    // Validate question
    // const questionErrors = validateQuestion(req.body, updated_by, true)
    // if (questionErrors.length) {
    //   return res.status(400).json({ errors: questionErrors })
    // }

    // Handle question image
    const question_img = req.files?.predefineQuestionImage
      ? "/quiz/predefined_question_images/" + req.files.predefineQuestionImage[0].filename
      : null

    // Handle option images
    const optionImages = {}

    for (const key in req.files) {
      if (key.startsWith("predefineOptionImages[")) {
        const match = key.match(/predefineOptionImages\[(\d+)\]/);
        if (match) {
          const index = parseInt(match[1], 10);
          const file = req.files[key][0]; // Multer stores files as array per field
          optionImages[index] = "/quiz/predefined_option_images/" + file.filename;
        }
      }
    }

    // Validate options
    // const optionErrors = validateOptions(parsedOptions, updated_by, optionImages, isUpdate = true)
    // if (optionErrors.length) {
    //   return res.status(400).json({ errors: optionErrors })
    // }

    // Update question with options using stored procedure
    const result = await callProcedure("updateQuestionWithOptions", [
      id,
      question_text,
      question_type,
      marks,
      question_img,
      updated_by,
      JSON.stringify(
        parsedOptions.map((option, index) => {
          const newImage = optionImages[index];
          const existingImage = option.option_img;

          let option_img = null;

          if (newImage) {
            option_img = newImage;
          } else if (existingImage) {
            option_img = existingImage;
          }

          const updatedOption = { ...option };
          if (option_img) {
            updatedOption.option_img = option_img;
          } else {
            delete updatedOption.option_img;
          }

          return updatedOption;
        }),
      ),
    ])

    if (result.error) {
      return next(result.error);
    }

    res.status(200).json({
      message: "Question with options updated successfully",
      data: result.data,
    })
  } catch (error) {
    next(error)
  }
}

// Delete question with options
exports.deleteQuestionWithOptions = async (req, res, next) => {
  const { id } = req.params
  try {
    const result = await callProcedure("deleteQuestionWithOptions", [id])

    if (result.error) {
      return next(result.error);
    }

    res.status(200).json({
      message: "Question with options deleted successfully",
      data: result.data,
    })
  } catch (error) {
    next(error)
  }
}

exports.toggleQuestionStatus = async (req, res, next) => {
  const { id } = req.params
  try {
    const result = await callProcedure("toggleQuestionStatus", [id])

    if (result.error) {
      return next(result.error);
    }

    res.status(200).json({
      message: "Question status Updated successfully",
      data: result.data,
    })
  } catch (error) {
    next(error)
  }
}

// Update question sequence
exports.updateQuestionSequence = async (req, res, next) => {
  try {
    const { updatedSequence } = req.body

    if (!Array.isArray(updatedSequence) || updatedSequence.length === 0) {
      return res.status(400).json({ error: "Invalid or empty sequence data" })
    }

    const result = await callProcedure("updateQuestionSequence", [JSON.stringify(updatedSequence)])

    if (result.error) {
      return next(result.error);
    }

    res.status(200).json({
      message: result.data?.[0]?.message || "Question sequence updated successfully",
    })
  } catch (error) {
    next(error)
  }
}

// const { PreDefinedOptions } = require("../../models/masters/predefinedOption");
// const {
//   PreDefinedQuestions,
// } = require("../../models/masters/predefinedQuestion"); // Adjust the path as necessary

// // -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------
// const { callProcedure } = require("../../utils/procedure/callProcedure");
// const Validation = require("../../validations");


// const validatePreDefinedQuestion = (data, userId, isUpdate = false) => {
//   const errors = [];

//   try {
//     if (!isUpdate || data.question_text !== undefined) {
//       Validation.isString(data.question_text, { min: 5, max: 1000 }, 'Question text must be 5-1000 characters');
//     }

//     if (data.marks !== undefined) {
//       Validation.isInteger(data.marks, 'Marks must be a number');
//     }

//     // Validate user ID (from req.user.id)
//     Validation.isInteger(userId, isUpdate ? 'Updated by must be a valid admin ID' : 'Created by must be a valid admin ID');

//   } catch (err) {
//     errors.push(err.message);
//   }

//   return errors;
// };


// // Create Predefined Question using stored procedure
// exports.createPreDefinedQuestion = async (req, res, next) => {
//   try {
//     const { question_text, question_type, marks } = req.body;
//     const created_by = req.user.id;
//     const errors = validatePreDefinedQuestion(req.body, created_by);
//     if (errors.length) {
//       return res.status(400).json({ errors });
//     }

//     // Check if files are uploaded and extract filenames
//     const question_img = req.file
//       ? "/quiz/predefined_question_images/" + req.file.filename
//       : null;

//     // Call stored procedure to create predefined question
//     const result = await callProcedure("createPreDefinedQuestion", [
//       question_text,
//       question_img,
//       question_type,
//       marks,
//       created_by,
//     ]);

//     res.status(201).json({
//       message: "Predefined question created successfully",
//       preDefinedQuestion: result[0],
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // Get All Predefined Questions using stored procedure
// exports.getPreDefinedQuestions = async (req, res, next) => {
//   try {
//     // Call stored procedure to get all predefined questions
//     const result = await callProcedure("getAllPreDefinedQuestions", []);
//     // Return the data directly to match the original format
//     res.status(200).json(result.data || []);
//   } catch (error) {
//     next(error);
//   }
// };

// // Get Predefined Question by ID using stored procedure
// exports.getPreDefinedQuestionById = async (req, res, next) => {
//   const { id } = req.params;
//   try {
//     const result = await callProcedure("getPreDefinedQuestionById", [id]);
//     const rows = result.data;

//     if (!rows || rows.length === 0) {
//       return res.status(404).json({ error: "Predefined question not found" });
//     }

//     // Extract common question fields from first row
//     const {
//       option_id, option_text, option_img, is_correct, option_createdAt, option_updatedAt,
//       ...questionData
//     } = rows[0];

//     const preDefinedQuestion = {
//       ...questionData,
//       PreDefinedOptions: rows
//         .filter(row => row.option_id !== null)
//         .map(row => ({
//           id: row.option_id,
//           option_text: row.option_text,
//           option_img: row.option_img,
//           is_correct: row.is_correct,
//           created_at: row.option_createdAt,
//           updated_at: row.option_updatedAt,
//         })),
//     };

//     res.status(200).json(preDefinedQuestion);
//   } catch (error) {
//     next(error);
//   }
// };

// // Update Predefined Question using stored procedure
// exports.updatePreDefinedQuestion = async (req, res, next) => {
//   const { id } = req.params;

//   try {
//     const { question_text, question_type, marks } = req.body;
//     const updated_by = req.user.id;

//     const errors = validatePreDefinedQuestion(req.body, updated_by, true);
//     if (errors.length) {
//       return res.status(400).json({ errors });
//     }

//     // Handle optional image
//     const question_img = req.file
//       ? "/quiz/predefined_question_images/" + req.file.filename
//       : null;

//     const result = await callProcedure("updatePreDefinedQuestion", [
//       id,
//       question_text,
//       question_type,
//       marks,
//       question_img,
//       updated_by,
//     ]);

//     const updatedPreDefinedQuestion = result.data?.[0];

//     res.status(200).json({
//       message: "Predefined question updated successfully",
//       preDefinedQuestion: updatedPreDefinedQuestion,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // Delete Predefined Question using stored procedure
// exports.deletePreDefinedQuestion = async (req, res, next) => {
//   const { id } = req.params;
//   try {
//     const result = await callProcedure("deletePreDefinedQuestion", [id]);

//     const deletedPreDefinedQuestion = result.data?.[0];

//     res.status(200).json({
//       message: "Predefined question deleted successfully",
//       deletedPreDefinedQuestion,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // Update Predefined Question Sequence using stored procedure
// exports.updatePreDefinedQuestionSequence = async (req, res, next) => {
//   try {
//     const { updatedSequence } = req.body;

//     if (!Array.isArray(updatedSequence) || updatedSequence.length === 0) {
//       return res.status(400).json({ error: "Invalid or empty sequence data" });
//     }

//     const result = await callProcedure("updatePreDefinedQuestionSequence", [
//       JSON.stringify(updatedSequence),
//     ]);

//     res.status(200).json({
//       message: result.data?.[0]?.message || "Question sequence updated successfully",
//     });
//   } catch (error) {
//     next(error);
//   }
// };


// // -------------------------------------PROCEDURE RELATED CODE ENDS---------------------------------

