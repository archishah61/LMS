const cheerio = require("cheerio");

const extractAnswersAndReplaceWithBlanks = (htmlText) => {
  const $ = cheerio.load(htmlText);
  let answers = [];

  // Handle <span style="text-decoration: underline">
  $(`span[style*='text-decoration: underline'], u`).each((index, element) => {
    const answerText = $(element).text().trim();
    answers.push(answerText);
    $(element).replaceWith("_____ ");
  });

  return {
    questionWithBlanks: $.html(),
    answers,
  };
};

// -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------

const { callProcedure } = require("../../utils/procedure/callProcedure");
const Validation = require("../../validations");
const Module = require("../../models/course_management/module");

const createAssignment = async (req, res, next) => {
  try {
    let {
      module_id,
      title,
      description,
      days_to_complete,
      max_score,
      passing_score,
      max_attempt = 1,
      extension_limit = 0,
      category,
      matching_questions = [],
      true_false_questions = [],
      fill_the_blanks_questions = [],
      paragraph_prompt
    } = req.body;

    const userId = req.user.id;
    const role = req.user.role;

    // Helper function to strip HTML tags
    const stripHtmlTags = (html) => {
      return html.replace(/<[^>]*>/g, '');
    };

    if (!title || !days_to_complete || !max_score || !passing_score || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, days to complete, max score, passing_score and category are required."
      });
    }

    // Validate title
    Validation.isString(title, { min: 1, max: 255 }, "Title must be a non-empty string with a maximum length of 255 characters.");

    // Validate description if provided
    if (description) {
      Validation.isString(description, { min: 1, max: 65535 }, "Description must be a non-empty string.");
    }

    // Validate days_to_complete
    if (!Number.isInteger(Number(days_to_complete)) || Number(days_to_complete) < 1) {
      return res.status(400).json({
        success: false,
        message: "Days to complete must be a positive integer."
      });
    }

    // Validate max_score
    Validation.isInteger(max_score, "Max score must be a valid integer.");

    // Validate passing_score
    Validation.isInteger(passing_score, "Passing score must be a valid integer");

    // Validate max_attempt
    Validation.isInteger(max_attempt, "Max attempt must be a valid integer.");

    // Validate category
    Validation.isEnum(category, ["regular", "matching", "true_false", "fill_in_the_blanks", "paragraph_writing"], "Invalid category.");

    // File upload logic
    const assignmentFile = req.files["assignmentFile"]
      ? `/assignments/file/${req.files["assignmentFile"][0].filename}`
      : null;    // Create the assignment
    const { success, data, error } = await callProcedure("createAssignment", [
      module_id,
      title,
      description,
      assignmentFile,
      days_to_complete,
      max_score,
      passing_score,
      max_attempt,
      extension_limit,
      category,
      userId,
      userId,
      role,
      role
    ]);

    if (!success) {
      console.error("Error creating assignment:", error);
      return res.status(400).json({ error });
    }

    const assignment = data?.[0];
    if (!assignment?.id) throw new Error("Assignment creation failed - no ID returned");
    const assignmentId = assignment.id;

    // Parse questions if passed as stringified JSON
    matching_questions = typeof matching_questions === 'string' ? JSON.parse(matching_questions) : matching_questions;
    true_false_questions = typeof true_false_questions === 'string' ? JSON.parse(true_false_questions) : true_false_questions;
    fill_the_blanks_questions = typeof fill_the_blanks_questions === 'string' ? JSON.parse(fill_the_blanks_questions) : fill_the_blanks_questions;

    // Handle Matching Questions
    if (category === 'matching' && Array.isArray(matching_questions)) {
      for (let qIndex = 0; qIndex < matching_questions.length; qIndex++) {
        const question = matching_questions[qIndex];

        const { success: qSuccess, data: qData } = await callProcedure("createMatchingQuestion", [
          assignmentId,
          question.question_text,
          userId,
          userId,
          role,
          role
        ]);

        if (qSuccess && qData?.length && question.MatchingOptions) {
          const questionId = qData[0].id;

          for (let oIndex = 0; oIndex < question.MatchingOptions.length; oIndex++) {
            const option = question.MatchingOptions[oIndex];

            const optionImageField = `matching_option_image_${qIndex}_${oIndex}`;
            const optionImagePath = req.files[optionImageField]
              ? `/assignments/matching_options/${req.files[optionImageField][0].filename}`
              : null;

            const matchImageField = `matching_match_image_${qIndex}_${oIndex}`;
            const matchImagePath = req.files[matchImageField]
              ? `/assignments/matching_matches/${req.files[matchImageField][0].filename}`
              : null;

            Validation.isString(option.option_text, { min: 1, max: 255 }, "Option text must be a non-empty string.");
            Validation.isString(option.match_text, { min: 1, max: 255 }, "Match text must be a non-empty string.");

            await callProcedure("createMatchingOption", [
              questionId,
              optionImagePath || option.option_text,
              optionImagePath ? 'image' : 'text',
              matchImagePath || option.match_text,
              matchImagePath ? 'image' : 'text',
              userId,
              userId,
              role,
              role
            ]);
          }
        }
      }
    }

    // Handle True/False Questions
    if (category === 'true_false' && Array.isArray(true_false_questions)) {
      for (const question of true_false_questions) {

        Validation.isString(question.question_text, { min: 1, max: 65535 }, "Question text must be a non-empty string.");
        Validation.isBoolean(question.correct_answer, "Correct answer must be a boolean.");
        await callProcedure("createTrueFalseQuestion", [
          assignmentId,
          question.question_text,
          question.correct_answer,
          userId,
          userId,
          role,
          role
        ]);
      }
    }

    // Handle Fill-in-the-Blanks Questions
    if (category === 'fill_in_the_blanks' && Array.isArray(fill_the_blanks_questions)) {
      for (const question of fill_the_blanks_questions) {
        const { question_text } = question;

        if (!question_text) {
          return res.status(400).json({
            success: false,
            message: "Each fill-in-the-blanks question must have 'question_text'."
          });
        }

        Validation.isString(question_text, { min: 1, max: 65535 }, "Question text must be a non-empty string.");

        const { questionWithBlanks, answers } = extractAnswersAndReplaceWithBlanks(question_text);

        if (answers.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Each fill-in-the-blanks question must have at least one underlined answer."
          });
        }

        const result = await callProcedure("createFillTheBlanksQuestion", [
          assignmentId,
          questionWithBlanks,
          JSON.stringify(answers),
          userId,
          userId,
          role,
          role
        ]);

      }
    }

    // Handle Paragraph Writing
    if (category === 'paragraph_writing' && paragraph_prompt) {

      Validation.isString(paragraph_prompt, { min: 1, max: 65535 }, "Paragraph prompt must be a non-empty string.");
      const res = await callProcedure("createParagraphWriting", [
        assignmentId,
        paragraph_prompt,
        userId,
        userId,
        role,
        role
      ]);

    }

    res.status(201).json({
      success: true,
      message: "Assignment created successfully!",
      assignment,
    });

  } catch (error) {
    console.error("Error in createAssignment:", error);
    next(error);
  }
};

//Get All Assignments using Stored Procedures ✅ (Tested)
const getAssignments = async (req, res, next) => {
  try {
    const { success, data, error } = await callProcedure("getAssignments", []);

    if (!success) {
      return next(error);
    }

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

//Get Assignments by Module id using Stored Procedures ✅ (Tested)
const getAssignmentsByModuleId = async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    if (!moduleId || moduleId === "null") {
      return res.status(400).json({ success: false, message: "Module ID is required." });
    }

    const { success, data, error } = await callProcedure("getAssignmentsByModuleId", [moduleId]);


    if (!success) {
      return next(error);
    }
    // Transform the data to match the old controller's response structure
    const formattedData = data.map(assignment => {
      return {
        ...assignment,
        TrueFalseQuestions: (assignment.TrueFalseQuestions || []).map(q => ({
          ...q,
          correct_answer: typeof q.correct_answer !== "undefined" ? q.correct_answer : !!q.answer,
          question_text: q.question_text || q.question,
        })),

        MatchingQuestions: (assignment.MatchingQuestions || []).map(question => ({
          ...question,
          MatchingOptions: (question.MatchingOptions || []).map(option => ({
            ...option,
            option_text: option.option,   // keep these if frontend expects them
            match_text: option.match,
            option_type: option.option_type, // ✅ use the actual DB values
            match_type: option.match_type
          }))
        })),

        ParagraphWritings: (assignment.ParagraphWritings || []).map(paragraph => ({
          ...paragraph,
          paragraph: paragraph.paragraph || paragraph.prompt // Use 'paragraph' field, fallback to 'prompt' if needed
        })),

        FillTheBlanksQuestions: (assignment.FillTheBlanksQuestions || []).map(question => ({
          ...question,
          question_text: question.question_text || question.sentence, // Ensure correct field
          answers: question.answers || question.answer || []          // Normalize answer array
        }))
      };
    });

    res.status(200).json(formattedData);
  } catch (error) {
    next(error);
  }
};

const getActiveAssignmentsByModuleId = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user.id;


    const module_hash = await Module.findAll({
      where: { id: moduleId },
      attributes: ['public_hash'],
      raw: true,
    });
    if (!moduleId || moduleId === "null") {
      return res.status(400).json({ success: false, message: "Module ID is required." });
    }

    const { success, data, error } = await callProcedure("getActiveAssignmentsByModuleId", [module_hash[0].public_hash, userId]);

    if (!success) {
      return next(error);
    }
    // Transform the data to match the old controller's response structure
    const formattedData = data.map(assignment => {
      return {
        ...assignment,
        TrueFalseQuestions: (assignment.TrueFalseQuestions || []).map(q => ({
          ...q,
          correct_answer: typeof q.correct_answer !== "undefined" ? q.correct_answer : !!q.answer,
          question_text: q.question_text || q.question,
        })),

        MatchingQuestions: (assignment.MatchingQuestions || []).map(question => ({
          ...question,
          MatchingOptions: (question.MatchingOptions || []).map(option => ({
            ...option,
            option_text: option.option,   // keep these if frontend expects them
            match_text: option.match,
            option_type: option.option_type, // ✅ use the actual DB values
            match_type: option.match_type
          }))
        })),

        ParagraphWritings: (assignment.ParagraphWritings || []).map(paragraph => ({
          ...paragraph,
          paragraph: paragraph.paragraph || paragraph.prompt // Use 'paragraph' field, fallback to 'prompt' if needed
        })),

        FillTheBlanksQuestions: (assignment.FillTheBlanksQuestions || []).map(question => ({
          ...question,
          question_text: question.question_text || question.sentence, // Ensure correct field
          answers: question.answers || question.answer || []          // Normalize answer array
        }))
      };
    });

    res.status(200).json(formattedData);
  } catch (error) {
    next(error);
  }
};

const getAssignmentsByAssignmentId = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    if (!assignmentId || assignmentId === "null") {
      return res.status(400).json({ success: false, message: "Assignment ID is required." });
    }

    const { success, data, error } = await callProcedure("getAssignmentByAssignmentId", [assignmentId]);

    if (!success) {
      return next(error);
    }

    // If no assignment found
    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: "Assignment not found." });
    }

    // Since procedure returns array, pick first one
    const assignment = data[0];

    const formattedData = {
      ...assignment,

      TrueFalseQuestions: (assignment.TrueFalseQuestions || []).map(q => ({
        ...q,
        correct_answer: typeof q.correct_answer !== "undefined" ? q.correct_answer : !!q.answer,
        question_text: q.question_text || q.question,
      })),

      MatchingQuestions: (assignment.MatchingQuestions || []).map(question => ({
        ...question,
        MatchingOptions: (question.MatchingOptions || []).map(option => ({
          ...option,
          option_text: option.option,
          match_text: option.match,
          option_type: option.option_type,
          match_type: option.match_type,
        })),
      })),

      ParagraphWritings: (assignment.ParagraphWritings || []).map(paragraph => ({
        ...paragraph,
        paragraph: paragraph.paragraph || paragraph.prompt,
      })),

      FillTheBlanksQuestions: (assignment.FillTheBlanksQuestions || []).map(question => ({
        ...question,
        question_text: question.question_text || question.sentence,
        answers: question.answers || question.answer || [],
      })),
    };

    res.status(200).json(formattedData);
  } catch (error) {
    next(error);
  }
};



// Get Assignment by ID using Stored Procedures ✅ (Tested)
const getAssignmentById = async (req, res, next) => {
  try {

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "Assignment ID is required." });
    }

    // Get main assignment
    const { success, data, error } = await callProcedure("getAssignmentById", [id]);

    if (!success || !data || data.length === 0) {
      return next(error);
    }



    const assignment = data[0];

    // Initialize arrays
    let matchingQuestions = [];
    let trueFalseQuestions = [];
    let fillTheBlanksQuestions = [];
    let paragraphWritings = [];

    // Based on category, fetch relevant questions
    if (assignment.category === "matching") {
      const matchQ = await callProcedure("getMatchingQuestionsByAssignmentId", [assignment.id]);
      if (matchQ.success) matchingQuestions = matchQ.data;
    }

    if (assignment.category === "true_false") {
      const tfQ = await callProcedure("getTrueFalseQuestionsByAssignmentId", [assignment.id]);
      if (tfQ.success) trueFalseQuestions = tfQ.data;
    }

    if (assignment.category === "fill_in_the_blanks") {
      const fbQ = await callProcedure("getFillTheBlanksQuestionsByAssignmentId", [assignment.id]);
      if (fbQ.success) fillTheBlanksQuestions = fbQ.data;
    }

    if (assignment.category === "paragraph_writing") {
      const pwQ = await callProcedure("getParagraphWritingByAssignmentId", [assignment.id]);
      if (pwQ.success) paragraphWritings = pwQ.data;
    }

    res.status(200).json({
      ...assignment,
      matchingQuestions,
      trueFalseQuestions,
      fillTheBlanksQuestions,
      paragraphWritings,
    });
  } catch (error) {
    next(error);
  }
};

// Update Assignment using Stored Procedures
const updateAssignment = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const role = req.user.role
    let {
      title,
      description,
      days_to_complete,
      max_score,
      passing_score,
      max_attempt,
      extension_limit,
      status,
      category,
      matching_questions,
      true_false_questions,
      fill_the_blanks_questions,
      paragraph_prompt = "",
      // FIXED: Add these new fields for tracking valid question IDs
      valid_matching_question_ids,
      valid_true_false_question_ids,
      valid_fill_blanks_question_ids,
    } = req.body

    const assignmentFile = req.files?.assignmentFile?.[0]?.filename
      ? `/assignments/file/${req.files.assignmentFile[0].filename}`
      : null

    if (!id) {
      return res.status(400).json({ success: false, message: "Assignment ID is required." })
    }

    // Parse JSON strings
    matching_questions = typeof matching_questions === "string" ? JSON.parse(matching_questions) : matching_questions
    true_false_questions =
      typeof true_false_questions === "string" ? JSON.parse(true_false_questions) : true_false_questions
    fill_the_blanks_questions =
      typeof fill_the_blanks_questions === "string" ? JSON.parse(fill_the_blanks_questions) : fill_the_blanks_questions

    // FIXED: Parse valid question IDs
    valid_matching_question_ids =
      typeof valid_matching_question_ids === "string"
        ? JSON.parse(valid_matching_question_ids)
        : valid_matching_question_ids
    valid_true_false_question_ids =
      typeof valid_true_false_question_ids === "string"
        ? JSON.parse(valid_true_false_question_ids)
        : valid_true_false_question_ids
    valid_fill_blanks_question_ids =
      typeof valid_fill_blanks_question_ids === "string"
        ? JSON.parse(valid_fill_blanks_question_ids)
        : valid_fill_blanks_question_ids

    const Validation = {
      isString: (value, constraints, message) => {
        if (typeof value !== "string" || value.length < constraints.min || value.length > constraints.max) {
          throw new Error(message)
        }
      },
      isBoolean: (value, message) => {
        if (typeof value !== "boolean") {
          throw new Error(message)
        }
      },
    }

    const assignmentParams = [
      id ?? null,
      title ?? null,
      description ?? null,
      assignmentFile ?? null,
      days_to_complete ?? null,
      max_score ?? null,
      passing_score ?? null,
      max_attempt ?? null,
      extension_limit ?? null,
      status ?? null,
      userId ?? null,
      role ?? null,
      category ?? null,
    ]

    const { success, data, error } = await callProcedure("updateAssignment", assignmentParams)

    if (!success) {
      return next(error)
    }

    // FIXED: Matching questions with proper deletion
    if (category === "matching") {
      const validQuestionIds = []
      const validOptionIds = {} // Track valid option IDs for each question

      if (Array.isArray(matching_questions)) {
        for (let qIndex = 0; qIndex < matching_questions.length; qIndex++) {
          const question = matching_questions[qIndex]
          let questionId = question.question_id

          if (questionId && Number(questionId) > 0) {
            Validation.isString(
              question.question_text,
              { min: 1, max: 65535 },
              "Question text must be a non-empty string.",
            )

            // Initialize valid option IDs array for this question
            validOptionIds[questionId] = []
            const { success: qUpdateSuccess } = await callProcedure("updateMatchingQuestion", [
              questionId,
              question.question_text,
              userId,
              role,
            ])
            if (!qUpdateSuccess) {
              console.error(`Failed to update matching question ${questionId}`)
            }
          } else {
            const { success: qCreateSuccess, data: qData } = await callProcedure("createMatchingQuestion", [
              id,
              question.question_text,
              userId,
              userId,
              role,
              role,
            ])
            if (!qCreateSuccess || !qData?.[0]?.id) {
              console.error(`Failed to create matching question at index ${qIndex}`)
              continue
            }
            questionId = qData[0].id
          }

          validQuestionIds.push(questionId)

          // Handle matching options...
          if (Array.isArray(question.MatchingOptions)) {
            const validOptionIdsForQuestion = []

            for (let oIndex = 0; oIndex < question.MatchingOptions.length; oIndex++) {
              const option = question.MatchingOptions[oIndex]
              const optionImageField = `matching_option_image_${qIndex}_${oIndex}`
              const matchImageField = `matching_match_image_${qIndex}_${oIndex}`

              const optionImagePath = req.files?.[optionImageField]?.[0]?.filename
                ? `/assignments/matching_options/${req.files[optionImageField][0].filename}`
                : null
              const matchImagePath = req.files?.[matchImageField]?.[0]?.filename
                ? `/assignments/matching_matches/${req.files[matchImageField][0].filename}`
                : null

              if (option.option_id && Number(option.option_id) > 0) {
                const { success: optionUpdateSuccess } = await callProcedure("updateMatchingOption", [
                  option.option_id,
                  optionImagePath || option.option_text,
                  option.option_type,
                  matchImagePath || option.match_text,
                  option.match_type,
                  userId,
                  role,
                ])
                if (optionUpdateSuccess) {
                  validOptionIdsForQuestion.push(option.option_id)
                }
              } else {
                const { success: createSuccess, data: optionData } = await callProcedure("createMatchingOption", [
                  questionId,
                  optionImagePath || option.option_text,
                  optionImagePath ? "image" : "text",
                  matchImagePath || option.match_text,
                  matchImagePath ? "image" : "text",
                  userId,
                  userId,
                  role,
                  role,
                ])
                if (createSuccess && optionData?.[0]?.id) {
                  validOptionIdsForQuestion.push(optionData[0].id)
                }
              }
            }

            // Delete any options that weren't included in the update
            if (validOptionIdsForQuestion.length > 0) {
              await callProcedure("deleteUnlistedMatchingOptions", [questionId, validOptionIdsForQuestion.join(",")])
            } else {
              await callProcedure("deleteAllMatchingOptions", [questionId])
            }
          }
        }
      }

      // Only delete matching questions if they were included in the request
      if (Array.isArray(matching_questions) && matching_questions.length >= 0) {
        // Delete unlisted matching questions (this will cascade delete their options as well)
        if (validQuestionIds.length > 0) {
          await callProcedure("deleteUnlistedMatchingQuestions", [id, validQuestionIds.join(",")])
        } else {
          await callProcedure("deleteAllMatchingQuestions", [id])
        }
      }
    }

    // FIXED: True false questions with proper deletion
    if (category === "true_false" && Array.isArray(true_false_questions)) {
      const validQuestionIds = []

      for (const question of true_false_questions) {
        if (question.question_id) {
          Validation.isString(
            question.question_text,
            { min: 1, max: 65535 },
            "Question text must be a non-empty string.",
          )
          Validation.isBoolean(question.correct_answer, "Correct answer must be a boolean.")

          await callProcedure("updateTrueFalseQuestion", [
            question.question_id,
            question.question_text,
            question.correct_answer,
            userId,
            role,
          ])
          validQuestionIds.push(question.question_id)
        } else {
          Validation.isString(
            question.question_text,
            { min: 1, max: 65535 },
            "Question text must be a non-empty string.",
          )
          Validation.isBoolean(question.correct_answer, "Correct answer must be a boolean.")

          const { success: createSuccess, data: createData } = await callProcedure("createTrueFalseQuestion", [
            id,
            question.question_text,
            question.correct_answer,
            userId,
            userId,
            role,
            role,
          ])
          if (createSuccess && createData?.[0]?.id) {
            validQuestionIds.push(createData[0].id)
          }
        }
      }

      // FIXED: Only delete true/false questions if they were included in the request
      if (Array.isArray(true_false_questions) && true_false_questions.length >= 0) {
        if (validQuestionIds.length > 0) {
          await callProcedure("deleteUnlistedTrueFalseQuestions", [id, validQuestionIds.join(",")])
        } else {
          await callProcedure("deleteAllTrueFalseQuestions", [id])
        }
      }
    }

    // FIXED: Fill in the blanks with enhanced processing
    if (category === "fill_in_the_blanks" && Array.isArray(fill_the_blanks_questions)) {
      const validQuestionIds = []

      for (const question of fill_the_blanks_questions) {
        const { question_text } = question
        if (!question_text) {
          console.error("Fill-in-the-blanks question missing 'question_text'")
          return res.status(400).json({
            success: false,
            message: "Each fill-in-the-blanks question must have 'question_text'.",
          })
        }

        Validation.isString(question_text, { min: 1, max: 65535 }, "Question text must be a non-empty string.")

        const { questionWithBlanks, answers } = extractAnswersAndReplaceWithBlanks(question_text)

        if (answers.length === 0) {
          console.error("Fill-in-the-blanks question missing underlined answers")
          return res.status(400).json({
            success: false,
            message: "Each fill-in-the-blanks question must have at least one underlined answer.",
          })
        }

        if (question.question_id) {
          const { success: updateSuccess, error: updateError } = await callProcedure("updateFillTheBlanksQuestion", [
            question.question_id,
            questionWithBlanks,
            JSON.stringify(answers),
            userId,
            role,
          ])
          if (!updateSuccess) {
            console.error(`Failed to update Fill-In-The-Blanks question ${question.question_id}:`, updateError)
            return res.status(500).json({
              success: false,
              message: "Failed to update Fill-In-The-Blanks question.",
              error: updateError,
            })
          }
          validQuestionIds.push(question.question_id)
        } else {
          const {
            success: createSuccess,
            data: createData,
            error: createError,
          } = await callProcedure("createFillTheBlanksQuestion", [
            id,
            questionWithBlanks,
            JSON.stringify(answers),
            userId,
            userId,
            role,
            role,
          ])
          if (!createSuccess) {
            console.error("Failed to create new Fill-In-The-Blanks question:", createError)
            return res.status(500).json({
              success: false,
              message: "Failed to create new Fill-In-The-Blanks question.",
              error: createError,
            })
          }
          if (createData?.[0]?.id) {
            validQuestionIds.push(createData[0].id)
          }
        }
      }

      // FIXED: Only delete fill-in-the-blanks questions if they were included in the request
      if (Array.isArray(fill_the_blanks_questions) && fill_the_blanks_questions.length >= 0) {
        if (validQuestionIds.length > 0) {
          await callProcedure("deleteUnlistedFillBlanksQuestions", [id, validQuestionIds.join(",")])
        } else {
          await callProcedure("deleteAllFillBlanksQuestions", [id])
        }
      }
    }

    // Paragraph Writing
    if (category === "paragraph_writing") {

      if (!paragraph_prompt) {
        return res.status(400).json({
          success: false,
          message: "Paragraph prompt is required"
        });
      }

      Validation.isString(paragraph_prompt, { min: 1, max: 65535 }, "Paragraph prompt must be a non-empty string.");

      // Sanitize and format the prompt
      let formattedPrompt = paragraph_prompt;
      if (Array.isArray(paragraph_prompt)) {
        formattedPrompt = paragraph_prompt.join(" ").trim();
      } else if (typeof paragraph_prompt === "string") {
        formattedPrompt = paragraph_prompt.trim();
      }

      const { success: checkSuccess, data: existing } = await callProcedure("getParagraphWritingByAssignmentId", [id]);

      if (checkSuccess && existing?.length > 0) {
        const { success: updateSuccess, data: updateResult } = await callProcedure("updateParagraphWriting", [
          id,
          formattedPrompt,
          userId,
          role
        ]);

        if (!updateSuccess) {
          console.error("❌ Failed to update paragraph writing");
          return res.status(500).json({
            success: false,
            message: "Failed to update paragraph writing.",
          });
        }

      } else {
        const { success: createSuccess } = await callProcedure("createParagraphWriting", [
          id,
          formattedPrompt,
          userId,
          userId,
          role,
          role
        ]);

        if (!createSuccess) {
          console.error("Failed to create paragraph writing");
          return res.status(500).json({
            success: false,
            message: "Failed to create paragraph writing.",
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Assignment updated successfully!",
      assignment: data?.[0],
    })
  } catch (error) {
    next(error);
  }
}

// -------------------------------------PROCEDURE RELATED CODE ENDS-----------------------------------


module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentsByModuleId,
  getActiveAssignmentsByModuleId,
  getAssignmentById,
  updateAssignment,
  getAssignmentsByAssignmentId
};
