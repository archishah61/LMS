const sequelize = require("../../config/db");
const { callProcedure } = require("../../utils/procedure/callProcedure");

// -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------

function safeJsonParse(value) {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value; // return as is if it's not valid JSON
    }
  }
  return value;
}

// Create a new quiz question using stored procedure
exports.createQuizQuestion = async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;
    const role = req.user?.role || 'admin';

    let {
      quiz_id,
      type,
      marks,
      is_active,
      speaking_question,
      speaking_answer,
      dragdrop_prompt,
      dragdrop_options,
      dragdrop_blanks,
      audiotoscript_script,
      videotoscript_script,
      imagetoscript_script,
      // NEW body fields for pause types
      video_pause_stamps,
      video_pause_question_ids,
      audio_pause_stamps,
      audio_pause_question_ids,
      video_pause_url,     // optional if client sends url directly
      audio_pause_url,     // optional if client sends url directly
      assigned_pause_id,
      realword_words,
      realword_correct_answers,
      summarizepassage_summary,
      summarizepassage_time_limit,
      bestoption_passage,
      bestoption_blanked_words,
      mcq_question_text,
      mcq_options,
      arrangeorder_prompt,
      complete_sentence_options,
      sentences,
      correct_order,
    } = req.body;


    // Safely parse JSON fields
    dragdrop_options = safeJsonParse(dragdrop_options);
    dragdrop_blanks = safeJsonParse(dragdrop_blanks);
    realword_words = safeJsonParse(realword_words);
    realword_correct_answers = safeJsonParse(realword_correct_answers);
    bestoption_blanked_words = safeJsonParse(bestoption_blanked_words);
    mcq_options = safeJsonParse(mcq_options);
    complete_sentence_options = safeJsonParse(complete_sentence_options);
    sentences = safeJsonParse(sentences);
    correct_order = safeJsonParse(correct_order);

    // JSON-parse the new arrays
    video_pause_stamps = safeJsonParse(video_pause_stamps);
    video_pause_question_ids = safeJsonParse(video_pause_question_ids);
    audio_pause_stamps = safeJsonParse(audio_pause_stamps);
    audio_pause_question_ids = safeJsonParse(audio_pause_question_ids);

    let audiotoscript_url = null;
    let videotoscript_url = null;
    let imagetoscript_url = null;
    let video_url = null;
    let audio_url = null;

    // existing file handling: extend to fetch pause files
    let video_pause_file_url = null;
    let audio_pause_file_url = null;


    if (!quiz_id || !type) {
      return res.status(400).json({
        message: "Quiz ID and type are required.",
      });
    }


    // pull all uploaded files (if any)
    if (req.files) {

      // priority: dedicated keys 'video_pause' / 'audio_pause', fallback to 'video' / 'audio'
      const videoPauseFile = req.files['videopause']?.[0] || req.files['video']?.[0];
      const audioPauseFile = req.files['audiopause']?.[0] || req.files['audio']?.[0];

      video_pause_file_url = videoPauseFile ? `/quiz/videopause/${videoPauseFile.filename}` : null;
      audio_pause_file_url = audioPauseFile ? `/quiz/audiopause/${audioPauseFile.filename}` : null;

      // generic media fields (new)
      const videoFile = req.files['video']?.[0];
      const audioFile = req.files['audio']?.[0];

      video_url = videoFile ? `/quiz/video/${videoFile.filename}` : null;
      audio_url = audioFile ? `/quiz/audio/${audioFile.filename}` : null;
    }

    // choose final urls (file takes precedence, then body-provided URL)
    const final_video_pause_url = video_pause_file_url || video_pause_url || null;
    const final_audio_pause_url = audio_pause_file_url || audio_pause_url || null;

    // Validate required fields based on type
    switch (type) {
      case 'dragdrop':
        if (!dragdrop_prompt || !dragdrop_options || !dragdrop_blanks) {
          return res.status(400).json({ message: "Missing dragdrop fields." });
        }
        break;
      case 'speaking':
        if (!speaking_question || !speaking_answer) {
          return res.status(400).json({ message: "Missing Speaking fields." });
        }
        break;

      case 'audiotoscript':
        if (req.files?.['audiotoscript']) audiotoscript_url = `/audiotoScript/${req.files?.['audiotoscript'][0].filename}`;
        if (!audiotoscript_url || !audiotoscript_script) {
          return res.status(400).json({ message: "Missing audiotoscript fields." });
        }
        break;

      case 'videotoscript':
        if (req.files['videotoscript']?.[0]?.filename) videotoscript_url = `/videoToScript/${req.files['videotoscript'][0].filename}`;
        if (!videotoscript_url || !videotoscript_script) {
          return res.status(400).json({ message: "Missing videotoscript fields." });
        }
        break;

      case 'imagetoscript':
        if (req.files['imagetoscript']?.[0]?.filename) imagetoscript_url = `/imageToScript/${req.files['imagetoscript'][0].filename}`;
        if (!imagetoscript_url || !imagetoscript_script) {
          return res.status(400).json({ message: "Missing imagetoscript fields." });
        }
        break;

      case 'realword':
        if (!realword_words || !realword_correct_answers) {
          return res.status(400).json({ message: "Missing realword fields." });
        }
        break;

      case 'summarizepassage':
        if (!summarizepassage_summary || !summarizepassage_time_limit) {
          return res.status(400).json({ message: "Missing summarizepassage fields." });
        }
        break;

      case 'bestoption':
        if (!bestoption_passage || !bestoption_blanked_words) {
          return res.status(400).json({ message: "Missing bestoption fields." });
        }
        break;

      case 'mcq':
        if (!mcq_question_text || !Array.isArray(mcq_options) || mcq_options.length === 0) {
          return res.status(400).json({ message: "MCQ question text and options are required." });
        }
        break;

      case 'complete the sentance':
        if (!mcq_question_text || !Array.isArray(complete_sentence_options) || complete_sentence_options.length === 0) {
          return res.status(400).json({ message: "Complete sentence options are required." });
        }
        break;

      // case 'arrangeorder':
      //   if (!arrangeorder_prompt || !Array.isArray(sentences) || sentences.length === 0 || !Array.isArray(correct_order) || correct_order.length === 0) {
      //     return res.status(400).json({ message: "ArrangeOrder requires prompt, sentences, and correct_order." });
      //   }
      //   break;

      case 'arrangeorder':
        if (!arrangeorder_prompt || !Array.isArray(sentences) || sentences.length === 0 ) {
          return res.status(400).json({ message: "ArrangeOrder requires prompt and sentences." });
        }
        break;

      case 'video_pause':
        if (req.files['videopause']?.[0]?.filename) {
          video_pause_url = `/quiz/videopause/${req.files['videopause'][0].filename}`;
        }
        // if client sent URL instead
        video_pause_url = video_pause_url || req.body.video_pause_url;

        if (!video_pause_url || !Array.isArray(video_pause_stamps) || !Array.isArray(video_pause_question_ids)) {
          return res.status(400).json({ message: "video_pause requires a video file/url, video_pause_stamps and video_pause_question_ids." });
        }
        break;

      case 'audio_pause':
        if (!final_audio_pause_url || !Array.isArray(audio_pause_stamps) || !Array.isArray(audio_pause_question_ids)) {
          return res.status(400).json({ message: "audio_pause requires an audio file/url, audio_pause_stamps and audio_pause_question_ids." });
        }
        if (audio_pause_stamps.length !== audio_pause_question_ids.length) {
          return res.status(400).json({ message: "audio_pause_stamps length must equal audio_pause_question_ids length." });
        }
        break;
      default:
        return res.status(400).json({ message: 'Invalid question type.' });
    }

    const question_img =
      req.files && req.files.questionImg
        ? "/quiz/question_images/" + req.files.questionImg[0].filename
        : null;

    // Call the stored procedure to create the question
    const result = await callProcedure("createQuizQuestion", [
      quiz_id,
      type,
      userId,
      role,
      userId,
      role,
      marks,
      is_active,
      question_img || null,
      speaking_question || null,
      speaking_answer || null,
      dragdrop_prompt || null,
      dragdrop_options ? JSON.stringify(dragdrop_options) : null,
      dragdrop_blanks ? JSON.stringify(dragdrop_blanks) : null,
      audiotoscript_url || null,
      audiotoscript_script || null,
      videotoscript_url || null,
      videotoscript_script || null,
      imagetoscript_url || null,
      imagetoscript_script || null,
      video_url || null,
      audio_url || null,
      final_video_pause_url || null,
      video_pause_stamps ? JSON.stringify(video_pause_stamps) : null,
      video_pause_question_ids ? JSON.stringify(video_pause_question_ids) : null,
      final_audio_pause_url || null,
      audio_pause_stamps ? JSON.stringify(audio_pause_stamps) : null,
      audio_pause_question_ids ? JSON.stringify(audio_pause_question_ids) : null,
      realword_words ? JSON.stringify(realword_words) : null,
      realword_correct_answers ? JSON.stringify(realword_correct_answers) : null,
      summarizepassage_summary || null,
      summarizepassage_time_limit || null,
      bestoption_passage || null,
      bestoption_blanked_words ? JSON.stringify(bestoption_blanked_words) : null,
      mcq_question_text || null,
      arrangeorder_prompt || null,
      sentences ? JSON.stringify(sentences) : null,
      correct_order ? JSON.stringify(correct_order) : null,
      assigned_pause_id ? parseInt(assigned_pause_id, 10) : 0
    ]);

    if (!result.success) {
      throw new Error(result.error);
    }

    // If no rows returned, quiz doesn't exist
    if (!result.data || result.data.length === 0) {
      return res.status(404).json({ error: "Related quiz not found." });
    }

    const newQuestion = result.data[0];

    // Handle MCQ options
    if (type === 'mcq' && Array.isArray(mcq_options)) {
      for (const option of mcq_options) {
        await callProcedure("createQuizQuestionOption", [
          newQuestion.id,
          'mcq',
          option.mcq_option_text,
          option.mcq_option_img,
          option.mcq_is_correct || false,
          null,
          null,
          userId,
          role,
          userId,
          role,
        ]);
      }
    }

    // Handle complete sentence options
    if (type === 'complete the sentance' && Array.isArray(complete_sentence_options)) {
      for (const option of complete_sentence_options) {
        await callProcedure("createQuizQuestionOption", [
          newQuestion.id,
          'complete_sentence',
          null,
          null,
          null,
          option.complate_correct_word,
          option.complate_hint,
          userId,
          role,
          userId,
          role,
        ]);
      }
    }

    res.status(201).json({
      success: true,
      message: "Quiz question created successfully",
      data: newQuestion
    });
  } catch (error) {
    next(error);
  }
};

// Get quiz questions by quiz ID using stored procedure
// Get quiz questions by quiz ID using stored procedure
exports.getQuizQuestionsByQuizId = async (req, res, next) => {
  try {
    const { quiz_id } = req.params;

    const results = await sequelize.query(
      'CALL getQuizQuestionsByQuizId(:quiz_id)',
      {
        replacements: { quiz_id: quiz_id },
        type: sequelize.QueryTypes.SELECT,
        multipleStatements: true,
      }
    );

    // Destructure questions and options from result set
    const [questionRaw, optionRaw] = results;

    // Convert objects with numbered keys to array
    const questions = Object.values(questionRaw || {});
    const options = Object.values(optionRaw || {});

    // Merge options into questions + add correctAnswers array
    const questionsWithOptions = questions.map((question) => {
      const relatedOptions = options.filter(
        (opt) => opt.question_id === question.id
      );

      const correctAnswers = relatedOptions
        .filter((opt) => opt.mcq_is_correct === 1 || opt.mcq_is_correct === true) // works for SQL TINYINT and BOOLEAN
        .map((opt) => opt.id);

      return {
        ...question,
        options: relatedOptions,
        correctAnswers, // ✅ New field showing all correct option IDs
      };
    });

    // Check if quiz was found
    if (questions && questions[0] && questions[0].error) {
      return next(questions[0].error);
    }

    res.status(200).json({
      success: true,
      data: questionsWithOptions,
    });
  } catch (error) {
    next(error);
  }
};

function normalizeNumberArray(input) {
  if (!input) return null;

  // If input is a string, try parsing it
  if (typeof input === "string") {
    try {
      input = JSON.parse(input);
    } catch (err) {
      return null; // invalid JSON string
    }
  }

  // Ensure input is an array
  if (!Array.isArray(input)) return null;

  // Convert all elements to integers
  return input.map(n => parseInt(n, 10)).filter(n => !isNaN(n));
}

// Update quiz question using stored procedure
exports.updateQuizQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const userId = req.user.id;
    const role = req.user.role;

    let {
      quiz_id,
      type,
      marks,
      is_active,
      speaking_question,
      speaking_answer,
      dragdrop_prompt,
      dragdrop_options,
      dragdrop_blanks,
      audiotoscript_url,
      audiotoscript_script,
      videotoscript_url,
      videotoscript_script,
      imagetoscript_url,
      imagetoscript_script,
      video_url,
      audio_url,
      // ✅ Add missing pause fields
      video_pause_stamps,
      video_pause_question_ids,
      audio_pause_stamps,
      audio_pause_question_ids,
      video_pause_url,
      audio_pause_url,
      realword_words,
      realword_correct_answers,
      summarizepassage_summary,
      summarizepassage_time_limit,
      bestoption_passage,
      bestoption_blanked_words,
      mcq_question_text,
      mcq_options,
      complete_sentence_options,
      arrangeorder_prompt,
      sentences,
      correct_order,
      assigned_pause_id
    } = req.body;


    // Normalize pause arrays
    video_pause_stamps = normalizeNumberArray(video_pause_stamps);
    audio_pause_stamps = normalizeNumberArray(audio_pause_stamps);

    dragdrop_options = safeJsonParse(dragdrop_options);
    dragdrop_blanks = safeJsonParse(dragdrop_blanks);
    realword_words = safeJsonParse(realword_words);
    realword_correct_answers = safeJsonParse(realword_correct_answers);
    bestoption_blanked_words = safeJsonParse(bestoption_blanked_words);
    mcq_options = safeJsonParse(mcq_options);
    complete_sentence_options = safeJsonParse(complete_sentence_options);
    sentences = safeJsonParse(sentences);
    correct_order = safeJsonParse(correct_order);

    const question_img =
      req.files && req.files.questionImg
        ? "/quiz/question_images/" + req.files.questionImg[0].filename
        : null;


    // Generic/media handling for update:
    if (!req.files?.['video'] && req.body.existing_video) {
      video_url = req.body.existing_video;
    } else if (req.files?.['video']?.[0]?.filename) {
      video_url = `/quiz/video/${req.files['video'][0].filename}`;
    }

    // audio
    if (!req.files?.['audio'] && req.body.existing_audio) {
      audio_url = req.body.existing_audio;
    } else if (req.files?.['audio']?.[0]?.filename) {
      audio_url = `/quiz/audio/${req.files['audio'][0].filename}`;
    }

    if (type === "audiotoscript" && !req.files?.['audiotoscript']) {
      audiotoscript_url = req.body.existing_audiotoScript || null;
    } else if (type === "audiotoscript" && req.files?.['audiotoscript']) {
      audiotoscript_url = `/audiotoScript/${req.files?.['audiotoscript'][0].filename}`
    }

    if (type === "videotoscript" && !req.files['videotoscript']) {
      videotoscript_url = req.body.existing_videotoScript || null;
    } else if (req.files['videotoscript']?.[0]?.filename) {
      videotoscript_url = `/videoToScript/${req.files['videotoscript'][0].filename}`;
    }

    if (type === "imagetoscript" && !req.files['imagetoscript']) {
      imagetoscript_url = req.body.existing_imagetoScript || null;
    } else if (req.files['imagetoscript']?.[0]?.filename) {
      imagetoscript_url = `/imageToScript/${req.files['imagetoscript'][0].filename}`;
    }


    if (req.files['videopause']?.[0]?.filename) {
      video_pause_url = `/quiz/videopause/${req.files['videopause'][0].filename}`;
    } else if (req.body.video_pause_url) {
      video_pause_url = req.body.video_pause_url;
    }

    if (req.files['audiopause']?.[0]?.filename) {
      audio_pause_url = `/quiz/audiopause/${req.files['audiopause'][0].filename}`;
    } else if (req.body.audio_pause_url) {
      audio_pause_url = req.body.audio_pause_url;
    }


    const result = await callProcedure("updateQuizQuestion", [
      id,
      quiz_id || null,
      type || null,
      userId,
      role,
      marks || null,
      is_active || null,
      question_img || null,
      speaking_question || null,
      speaking_answer || null,
      dragdrop_prompt || null,
      dragdrop_options ? JSON.stringify(dragdrop_options) : null,
      dragdrop_blanks ? JSON.stringify(dragdrop_blanks) : null,
      audiotoscript_url || null,
      audiotoscript_script || null,
      videotoscript_url || null,
      videotoscript_script || null,
      imagetoscript_url || null,
      imagetoscript_script || null,
      video_url || null,
      audio_url || null,
      video_pause_url || null,
      video_pause_stamps ? JSON.stringify(video_pause_stamps) : null,
      video_pause_question_ids ? (Array.isArray(video_pause_question_ids) ? JSON.stringify(video_pause_question_ids) : video_pause_question_ids) : null,
      audio_pause_url || null,
      audio_pause_stamps ? JSON.stringify(audio_pause_stamps) : null,
      audio_pause_question_ids ? (Array.isArray(audio_pause_question_ids) ? JSON.stringify(audio_pause_question_ids) : audio_pause_question_ids) : null,
      realword_words ? JSON.stringify(realword_words) : null,
      realword_correct_answers ? JSON.stringify(realword_correct_answers) : null,
      summarizepassage_summary || null,
      summarizepassage_time_limit || null,
      bestoption_passage || null,
      bestoption_blanked_words ? JSON.stringify(bestoption_blanked_words) : null,
      mcq_question_text || null,
      arrangeorder_prompt || null,
      sentences ? JSON.stringify(sentences) : null,
      correct_order ? JSON.stringify(correct_order) : null,
      assigned_pause_id ? parseInt(assigned_pause_id, 10) : null
    ]);

    if (!result.success) {
      throw new Error(result.error);
    }

    const updatedQuestion = result.data;

    if (!updatedQuestion || updatedQuestion.length === 0) {
      return res.status(404).json({ success: false, error: "Not Found" });
    }

    // Delete existing options and recreate them
    await callProcedure("deleteQuizQuestionOptions", [id]);

    // Handle MCQ options
    if (type === 'mcq' && Array.isArray(mcq_options)) {
      for (const option of mcq_options) {
        await callProcedure("createQuizQuestionOption", [
          id,
          'mcq',
          option.mcq_option_text,
          option.mcq_option_img,
          option.mcq_is_correct || false,
          null,
          null,
          userId,
          role,
          userId,
          role,
        ]);
      }
    }

    // Handle complete sentence options
    if (type === 'complete the sentance' && Array.isArray(complete_sentence_options)) {
      for (const option of complete_sentence_options) {
        await callProcedure("createQuizQuestionOption", [
          id,
          'complete_sentence',
          null,
          null,
          null,
          option.complate_correct_word,
          option.complate_hint,
          userId,
          role,
          userId,
          role,
        ]);
      }
    }

    res.status(200).json({ success: true, data: updatedQuestion[0] });
  } catch (error) {
    next(error);
  }
};

// Delete quiz question using stored procedure
exports.deleteQuizQuestion = async (req, res, next) => {
  try {
    const result = await callProcedure("deleteQuizQuestion", [
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
      message: "Quiz question deleted successfully",
      data: result.data[0],
    });
  } catch (error) {
    next(error);
  }
};

// Toggle quiz question status using stored procedure
exports.toggleQuizQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await callProcedure("toggleQuizQuestion", [id]);

    if (!result.success) {
      throw new Error(result.error);
    }

    const updatedQuestion = result.data;

    if (!updatedQuestion || updatedQuestion.length === 0) {
      return res.status(404).json({ success: false, error: "Not Found" });
    }

    res.status(200).json({
      success: true,
      message: "Question status updated successfully",
      data: updatedQuestion[0]
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------PROCEDURE RELATED CODE ENDS-----------------------------------

// const { QuizQuestion } = require("../../models/content_management/quizQuestion");
// const { QuizQuestionOption } = require("../../models/content_management/quizQuestionOption");

// exports.createQuizQuestion = async (req, res, next) => {
//     try {
//         const {
//             quiz_id,
//             type,
//             created_by,
//             created_by_type = 'admin',
//             updated_by,
//             updated_by_type = 'admin',
//             marks,
//             is_active,
//             question_img,

//             // Type-specific fields
//             dragdrop_prompt,
//             dragdrop_options,
//             dragdrop_blanks,

//             audiotoscript_url,
//             audiotoscript_script,

//             realword_words,
//             realword_correct_answers,

//             summarizepassage_summary,
//             summarizepassage_time_limit,

//             bestoption_passage,
//             bestoption_blanked_words,

//             mcq_question_text,
//             mcq_options, // array of { mcq_option_text, mcq_option_img, mcq_is_correct }

//             complete_sentence_options, // array of { complate_correct_word, complate_hint }

//         } = req.body;

//         // Step 1: Prepare question data based on type
//         const questionData = {
//             quiz_id,
//             type,
//             created_by,
//             created_by_type,
//             updated_by,
//             updated_by_type,
//             marks,
//             is_active,
//             question_img,
//         };

//         switch (type) {
//             case 'dragdrop':
//                 Object.assign(questionData, {
//                     dragdrop_prompt,
//                     dragdrop_options,
//                     dragdrop_blanks,
//                 });
//                 break;
//             case 'audiotoscript':
//                 Object.assign(questionData, {
//                     audiotoscript_url,
//                     audiotoscript_script,
//                 });
//                 break;
//             case 'realword':
//                 Object.assign(questionData, {
//                     realword_words,
//                     realword_correct_answers,
//                 });
//                 break;
//             case 'summarizepassage':
//                 Object.assign(questionData, {
//                     summarizepassage_summary,
//                     summarizepassage_time_limit,
//                 });
//                 break;
//             case 'bestoption':
//                 Object.assign(questionData, {
//                     bestoption_passage,
//                     bestoption_blanked_words,
//                 });
//                 break;
//             case 'mcq':
//                 Object.assign(questionData, {
//                     mcq_question_text,
//                 });
//                 break;
//             case 'complete the sentance':
//                 // No top-level fields for this yet
//                 break;
//             default:
//                 return res.status(400).json({ message: 'Invalid question type' });
//         }

//         // Step 2: Create question
//         const newQuestion = await QuizQuestion.create(questionData);

//         // Step 3: Insert options if needed
//         if (type === 'mcq' && Array.isArray(mcq_options)) {
//             const optionsToInsert = mcq_options.map((opt) => ({
//                 question_id: newQuestion.id,
//                 type: 'mcq',
//                 mcq_option_text: opt.mcq_option_text,
//                 mcq_option_img: opt.mcq_option_img,
//                 mcq_is_correct: opt.mcq_is_correct || false,
//                 created_by,
//                 created_by_type,
//                 updated_by,
//                 updated_by_type,
//             }));
//             await QuizQuestionOption.bulkCreate(optionsToInsert);
//         }

//         if (type === 'complete the sentance' && Array.isArray(complete_sentence_options)) {
//             const optionsToInsert = complete_sentence_options.map((opt) => ({
//                 question_id: newQuestion.id,
//                 type: 'complete_sentence',
//                 complate_correct_word: opt.complate_correct_word,
//                 complate_hint: opt.complate_hint,
//                 created_by,
//                 created_by_type,
//                 updated_by,
//                 updated_by_type,
//             }));
//             await QuizQuestionOption.bulkCreate(optionsToInsert);
//         }

//         res.status(201).json({
//             message: 'Question created successfully',
//             data: newQuestion,
//         });
//     } catch (error) {
//         next(error);
//     }
// };

// exports.getQuizQuestionsByQuizId = async (req, res, next) => {
//     try {
//         const { quiz_id } = req.params;

//         if (!quiz_id) {
//             return res.status(400).json({ message: 'quiz_id is required' });
//         }

//         const questions = await QuizQuestion.findAll({
//             where: { quiz_id },
//             include: [
//                 {
//                     model: QuizQuestionOption,
//                 },
//             ],
//         });

//         if (!questions || questions.length === 0) {
//             return res.status(404).json({ message: 'No questions found for this quiz' });
//         }

//         res.status(200).json({ data: questions });
//     } catch (error) {
//         next(error);
//     }
// };

// exports.updateQuizQuestion = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const {
//       type,
//       updated_by,
//       updated_by_type = 'admin',
//       // all same fields like create...
//       dragdrop_prompt,
//       dragdrop_options,
//       dragdrop_blanks,
//       dragdrop_marks,
//       audiotoscript_url,
//       audiotoscript_script,
//       realword_words,
//       realword_correct_answers,
//       summarizepassage_summary,
//       summarizepassage_time_limit,
//       bestoption_passage,
//       bestoption_blanked_words,
//       mcq_question_text,
//       mcq_options,
//       complete_sentence_options,
//     } = req.body;

//     const question = await QuizQuestion.findByPk(id);
//     if (!question) {
//       return res.status(404).json({ message: 'Question not found' });
//     }

//     const updateData = {
//       type,
//       updated_by,
//       updated_by_type,
//     };

//     switch (type) {
//       case 'dragdrop':
//         Object.assign(updateData, { dragdrop_prompt, dragdrop_options, dragdrop_blanks, dragdrop_marks });
//         break;
//       case 'audiotoscript':
//         Object.assign(updateData, { audiotoscript_url, audiotoscript_script });
//         break;
//       case 'realword':
//         Object.assign(updateData, { realword_words, realword_correct_answers });
//         break;
//       case 'summarizepassage':
//         Object.assign(updateData, { summarizepassage_summary, summarizepassage_time_limit });
//         break;
//       case 'bestoption':
//         Object.assign(updateData, { bestoption_passage, bestoption_blanked_words });
//         break;
//       case 'mcq':
//         Object.assign(updateData, { mcq_question_text });
//         break;
//     }

//     await question.update(updateData);

//     // Update options
//     await QuizQuestionOption.destroy({ where: { question_id: id } });

//     if (type === 'mcq' && Array.isArray(mcq_options)) {
//       const opts = mcq_options.map((opt) => ({
//         question_id: id,
//         type: 'mcq',
//         mcq_option_text: opt.mcq_option_text,
//         mcq_option_img: opt.mcq_option_img,
//         mcq_is_correct: opt.mcq_is_correct || false,
//         created_by: question.created_by,
//         created_by_type: question.created_by_type,
//         updated_by,
//         updated_by_type,
//       }));
//       await QuizQuestionOption.bulkCreate(opts);
//     }

//     if (type === 'complete the sentance' && Array.isArray(complete_sentence_options)) {
//       const opts = complete_sentence_options.map((opt) => ({
//         question_id: id,
//         type: 'complete_sentence',
//         complate_correct_word: opt.complate_correct_word,
//         complate_hint: opt.complate_hint,
//         created_by: question.created_by,
//         created_by_type: question.created_by_type,
//         updated_by,
//         updated_by_type,
//       }));
//       await QuizQuestionOption.bulkCreate(opts);
//     }

//     res.status(200).json({ message: 'Question updated successfully' });
//   } catch (error) {
//     next(error);
//   }
// };

// exports.deleteQuizQuestion = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     const question = await QuizQuestion.findByPk(id);
//     if (!question) {
//       return res.status(404).json({ message: 'Question not found' });
//     }

//     await QuizQuestionOption.destroy({ where: { question_id: id } });
//     await question.destroy();

//     res.status(200).json({ message: 'Question deleted successfully' });
//   } catch (error) {
//     next(error);
//   }
// };

// exports.toggleQuizQuestion = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     const question = await QuizQuestion.findByPk(id);
//     if (!question) {
//       return res.status(404).json({ message: 'Question not found' });
//     }

//     await question.update({is_active: !question.is_active});

//     res.status(200).json({ message: 'Question Status updated successfully', question });
//   } catch (error) {
//     next(error);
//   }
// };

