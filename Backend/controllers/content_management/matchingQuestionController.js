// controllers/matchingQuestionController.js
const MatchingQuestion = require("../../models/content_management/matchingQuestion");
const MatchingOption = require("../../models/content_management/matchingOption"); // Import MatchingOption model


// -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------

const { callProcedure } = require("../../utils/procedure/callProcedure"); // Adjust path if needed


// Create Matching Question using stored procedure
const createMatchingQuestion = async (req, res, next) => {
  try {
    const { assignment_id, question_text, options } = req.body;
    const userId = req.user?.id;
    const role = req.user?.role;

    // Validate inputs
    if (!assignment_id || !question_text) {
      return res.status(400).json({
        success: false,
        message: "Assignment ID and question text are required",
      });
    }

    if (options.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one matching option pair is required",
      });
    }

    // Create the matching question
    const { success: qCreateSuccess, data: qData, error: qError } = await callProcedure("createMatchingQuestion", [
      assignment_id,
      question_text,
      userId,
      userId,
      role,
      role,
    ]);

    if (!qCreateSuccess && qError) {
      return next(qError);
    }

    let questionId = qData[0].id;

    // Handle matching options with file uploads
    for (let index = 0; index < options.length; index++) {
      const option = options[index];

      // Get file paths if they exist
      const optionImageFile = req.files?.[`option_images[${index}]`]?.[0];
      const matchImageFile = req.files?.[`match_images[${index}]`]?.[0];

      const optionImagePath = optionImageFile
        ? `/assignments/matching_options/${optionImageFile.filename}`
        : null;

      const matchImagePath = matchImageFile
        ? `/assignments/matching_matches/${matchImageFile.filename}`
        : null;

      // Set appropriate content based on type
      const optionContent = option.option_type === "image" && optionImagePath
        ? optionImagePath
        : option.option_text;

      const matchContent = option.match_type === "image" && matchImagePath
        ? matchImagePath
        : option.match_text;

      // Determine types
      const finalOptionType = optionImagePath ? "image" : option.option_type || "text";
      const finalMatchType = matchImagePath ? "image" : option.match_type || "text";

      const { success: createSuccess, data: optionData } = await callProcedure("createMatchingOption", [
        questionId,
        optionContent,
        finalOptionType,
        matchContent,
        finalMatchType,
        userId,
        userId,
        role,
        role,
      ]);
    }

    // Return success response
    res.status(201).json({
      success: true,
      message: "Matching question created successfully!",
      id: questionId,
      question_text,
      options: options.map((opt, idx) => ({
        ...opt,
        option_content: opt.option_type === "image" && req.files?.[`option_images[${idx}]`]?.[0]?.filename
          ? `/assignments/matching_options/${req.files[`option_images[${idx}]`][0].filename}`
          : opt.option_text,
        match_content: opt.match_type === "image" && req.files?.[`match_images[${idx}]`]?.[0]?.filename
          ? `/assignments/matching_matches/${req.files[`match_images[${idx}]`][0].filename}`
          : opt.match_text,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Get All Matching Questions for an Assignment (Procedure-based)
const getMatchingQuestionsByAssignmentId = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;

    const { data } = await callProcedure("getMatchingQuestionsByAssignmentId", [assignmentId]);

    // Ensure correct data format
    const rawData = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : data;

    // Format like old controller output
    const formatted = rawData.reduce((acc, curr) => {
      const questionIndex = acc.findIndex(q => q.id === curr.question_id);

      const option = {
        id: curr.option_id,
        question_id: curr.question_id,
        option_text: curr.option_text,
        option_type: curr.option_type,
        match_text: curr.match_text,
        match_type: curr.match_type,
        created_at: curr.option_created_at,
        updated_at: curr.option_updated_at,
      };

      if (questionIndex === -1) {
        acc.push({
          id: curr.question_id,
          assignment_id: curr.assignment_id,
          question_text: curr.question_text,
          created_at: curr.question_created_at,
          updated_at: curr.question_updated_at,
          MatchingOptions: curr.option_id ? [option] : [],
        });
      } else if (curr.option_id) {
        acc[questionIndex].MatchingOptions.push(option);
      }

      return acc;
    }, []);

    // Match old controller: send array directly
    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

//Update Matching Question for an assignment Procedure
const updateMatchingQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { question_text, options } = req.body;
    const userId = req.user?.id;
    const role = req.user?.role;

    // Validate inputs
    if (!question_text) {
      return res.status(400).json({
        success: false,
        message: "Question text is required",
      });
    }

    // Update the matching question
    const { success: qUpdateSuccess, error: qError } = await callProcedure("updateMatchingQuestion", [
      id,
      question_text,
      userId,
      role,
    ]);

    if (!qUpdateSuccess && qError) {
      return next(qError);
    }

    const validOptionIdsForQuestion = [];

    if (options.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one matching option pair is required",
      });
    }

    // Handle matching options with file uploads
    for (let index = 0; index < options.length; index++) {
      const option = options[index];

      // Get file paths if they exist
      const optionImageFile = req.files?.[`option_images[${index}]`]?.[0];
      const matchImageFile = req.files?.[`match_images[${index}]`]?.[0];

      const optionImagePath = optionImageFile
        ? `/assignments/matching_options/${optionImageFile.filename}`
        : null;

      const matchImagePath = matchImageFile
        ? `/assignments/matching_matches/${matchImageFile.filename}`
        : null;

      // Determine final content and type based on uploaded files
      let finalOptionContent, finalOptionType, finalMatchContent, finalMatchType;

      // For option
      if (optionImagePath && option.option_type === "image") {
        finalOptionContent = optionImagePath;
        finalOptionType = "image";
      } else {
        finalOptionContent = option.option_text;
        finalOptionType = option.option_type || "text";
      }

      // For match
      if (matchImagePath && option.match_type === "image") {
        finalMatchContent = matchImagePath;
        finalMatchType = "image";
      } else {
        finalMatchContent = option.match_text;
        finalMatchType = option.match_type || "text";
      }

      // Update existing option or create new one
      if (option.option_id && Number(option.option_id) > 0) {
        const { success: optionUpdateSuccess } = await callProcedure("updateMatchingOption", [
          option.option_id,
          finalOptionContent,
          finalOptionType,
          finalMatchContent,
          finalMatchType,
          userId,
          role,
        ]);

        if (optionUpdateSuccess) {
          validOptionIdsForQuestion.push(option.option_id);
        }
      } else {
        // Create new option
        const { success: createSuccess, data: optionData } = await callProcedure("createMatchingOption", [
          id,
          finalOptionContent,
          finalOptionType,
          finalMatchContent,
          finalMatchType,
          userId,
          userId,
          role,
          role,
        ]);

        if (createSuccess && optionData?.[0]?.id) {
          validOptionIdsForQuestion.push(optionData[0].id);
        }
      }
    }

    // Delete any options that weren't included in the update
    if (validOptionIdsForQuestion.length > 0) {
      await callProcedure("deleteUnlistedMatchingOptions", [
        id,
        validOptionIdsForQuestion.join(",")
      ]);
    } else {
      // If no valid options, delete all options for this question
      await callProcedure("deleteAllMatchingOptions", [id]);
    }

    // Return updated data with file paths
    const updatedOptions = options.map((opt, idx) => ({
      option_id: validOptionIdsForQuestion[idx] || null,
      option_text: opt.option_text,
      option_type: opt.option_type,
      match_text: opt.match_text,
      match_type: opt.match_type,
      option_content: req.files?.[`option_images[${idx}]`]?.[0]?.filename
        ? `/assignments/matching_options/${req.files[`option_images[${idx}]`][0].filename}`
        : (opt.option_type === "image" ? opt.option_text : null),
      match_content: req.files?.[`match_images[${idx}]`]?.[0]?.filename
        ? `/assignments/matching_matches/${req.files[`match_images[${idx}]`][0].filename}`
        : (opt.match_type === "image" ? opt.match_text : null),
    }));

    res.status(200).json({
      success: true,
      message: "Matching question updated successfully",
      id,
      question_text,
      options: updatedOptions,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Matching Question
const deleteMatchingQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data } = await callProcedure("deleteMatchingQuestion", [id]);

    if (!data || data[0].affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Matching question not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Matching question deleted successfully",
    });

  } catch (error) {
    next(error);
  }
};

// -------------------------------------PROCEDURE RELATED CODE ENDS---------------------------------

module.exports = {
  createMatchingQuestion,
  getMatchingQuestionsByAssignmentId,
  updateMatchingQuestion,
  deleteMatchingQuestion,
};
