const axios = require('axios');
const { BestOptionQuestion } = require('../../models/content_management/quiz-questions-types/bestOptionQuestion');
const { Quizzes } = require('../../models/content_management/quizzesModel');

// Predefined list of fallback words
const fallbackWords = [
  'manifest', 'construction', 'modeling', 'illustrative', 'projection',
  'hypothesis', 'scheme', 'reconstruction', 'principle', 'template',
  'outlook', 'element', 'exemplar', 'symbol', 'process', 'blueprint', 'artwork',
  'plan', 'refinement', 'approach', 'drafting', 'structure', 'skeleton',
  'configuration', 'conceptual', 'mock-up', 'specification', 'framework',
  'pattern', 'reproduction', 'outline', 'arrangement', 'analysis', 'notation',
  'perspective', 'translation', 'variation', 'remodeling', 'mapping',
  'preliminary', 'manifestation', 'depiction', 'render', 'drawing', 'schema',
  'simulation', 'realization', 'execution', 'dimension', 'representation',
  'hypothetical', 'expression', 'detailing', 'expansion', 'reformulation',
  'clarification', 'prototype', 'aspects', 'sequence', 'dissection', 'iteration',
  'deconstruction', 'conceptualization', 'synthesis', 'composition', 'layout',
  'system', 'solution', 'formulation', 'set', 'case', 'rendering', 'visualization',
  'proposition', 'image', 'version', 'theory', 'reflection', 'indication', 'idea',
  'simulation', 'assumption', 'step', 'paradigm', 'definition', 'implementation',
  'methodology', 'disposition', 'designs', 'diagram', 'equation', 'vision',
  'interpretation', 'map', 'transformation', 'example', 'formation',
  'presentation', 'proportion', 'sketch', 'systematic', 'delineation', 'format',
  'clarity', 'viewpoint', 'frame'
];

// Clean and lowercase a word (for search purposes)
const cleanWord = (word) => {
  return word.trim().replace(/[.,!?;:()"'`]/g, "").toLowerCase();
};

// Match the casing of original word
const matchCase = (original, suggestion) => {
  const isCapitalized = /^[A-Z]/.test(original);
  return isCapitalized
    ? suggestion.charAt(0).toUpperCase() + suggestion.slice(1).toLowerCase()
    : suggestion.toLowerCase();
};


// Fetch synonyms or use fallback
const getSimilarWords = async (word) => {
  try {
    const response = await axios.get(`https://api.api-ninjas.com/v1/thesaurus?word=${word}`, {
      headers: { 'X-Api-Key': process.env.API_NINJA_KEY },
    });

    let similarWords = response.data.synonyms || [];

    if (similarWords.length === 0) {
      const shuffled = fallbackWords.sort(() => 0.5 - Math.random());
      similarWords = shuffled.slice(0, 4);
    }

    return similarWords.slice(0, 4);
  } catch (error) {
    console.error("API Error:", error.message);
    const shuffled = fallbackWords.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  }
};



// -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------
const { callProcedure } = require("../../utils/procedure/callProcedure");


// ✅ Create BestOptionQuestion with distractors
exports.createBestOptionQuestion = async (req, res, next) => {
  try {
    const { passage, selected_words, marks } = req.body;

    const userId = req.user.id
    const role = req.user.role

    const quiz_id = selected_words[0]?.quiz_id;

    if (!quiz_id) {
      return res.status(400).json({ error: "Missing quiz_id." });
    }

    const quiz = await Quizzes.findByPk(quiz_id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found." });

    const distractor_map = {};
    const correct_options = [];

    for (const wordObj of selected_words) {
      const rawWord = wordObj.word;
      const cleaned = cleanWord(rawWord);
      const distractors = await getSimilarWords(cleaned);
      const formattedDistractors = distractors.map(d => matchCase(rawWord, d));

      distractor_map[rawWord] = [rawWord, ...formattedDistractors];
      correct_options.push(rawWord);
    }

    const { success, data, error } = await callProcedure("createBestOptionQuestion", [
      quiz_id,
      passage,
      JSON.stringify(correct_options),
      JSON.stringify(distractor_map),
      marks, // Include marks in the procedure call
      userId,
      userId,
      role,
      role
    ]);

    if (!success) {
      return next(error);
    }

    const newQuestion = data[0][0];

    res.status(201).json({
      message: "Best option question created successfully",
      question: newQuestion,
    });
  } catch (error) {
    next(error);
  }
};

// Get All BestOptionQuestions using stored procedure
exports.getAllBestOptionQuestions = async (req, res, next) => {
  try {
    const result = await callProcedure('getAllBestOptionQuestions');

    // Extract questions array from the procedure result
    // The procedure returns { success: true, data: [questions] }
    const questions = result.data;

    // Transform the snake_case fields to camelCase to match old format
    const formattedQuestions = questions.map(question => ({
      ...question,
      created_at: question.created_at,
      updated_at: question.updated_at,
      // Delete the snake_case properties
      created_at: undefined,
      updated_at: undefined
    }));

    res.status(200).json(formattedQuestions);
  } catch (error) {
    next(error);
  }
};

// ✅ Get BestOptionQuestions by Quiz ID
exports.getBestOptionQuestionsByQuizId = async (req, res, next) => {
  try {
    const { quiz_id } = req.params;

    const result = await callProcedure('getBestOptionQuestionsByQuizId', [quiz_id]);


    // Extract questions array from the procedure result
    const questions = result.data || result; // Adjust based on actual structure


    if (!questions || !questions.length) {
      return res.status(404).json({ error: "No questions found for this quiz" });
    }

    // Transform the snake_case fields to camelCase
    const formattedQuestions = questions.map(question => ({
      id: question.id,
      quizId: question.quiz_id,
      passage: question.passage,
      blankedWords: question.blanked_words,
      distractorOptions: question.distractor_options,
      marks: question.marks,
      createdBy: question.created_by,
      updatedBy: question.updated_by,
      created_at: question.created_at,
      updated_at: question.updated_at
    }));


    res.status(200).json(formattedQuestions);
  } catch (error) {
    console.error("Error:", error);
    next(error);
  }
};

// ✅ Update BestOptionQuestion by ID
exports.updateBestOptionQuestionById = async (req, res, next) => {
  const { id } = req.params;
  const { passage, blanked_words, marks } = req.body;

  try {

    const userId = req.user.id
    const role = req.user.role

    // Check if the question exists
    const question = await BestOptionQuestion.findByPk(id);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Validate passage if provided
    const finalPassage = passage || question.passage;

    // Validate blanked_words if provided, else use question.blanked_words
    const finalBlankedWords = blanked_words || question.blanked_words;

    // Process distractor options
    const distractor_map = {};
    for (const rawWord of finalBlankedWords) {
      const cleaned = cleanWord(rawWord);
      const distractors = await getSimilarWords(cleaned);
      const formattedDistractors = distractors.map(d => matchCase(rawWord, d));

      distractor_map[rawWord] = [rawWord, ...formattedDistractors];
    }

    // Call the stored procedure for update
    const { success, error } = await callProcedure('updateBestOptionQuestionById', [
      parseInt(id),
      finalPassage,
      JSON.stringify(finalBlankedWords),
      JSON.stringify(distractor_map),
      marks, // Include marks in the procedure call
      userId,
      role
    ]);

    if (!success) {
      return next(error);
    }

    // Fetch the updated record
    const updatedQuestion = await BestOptionQuestion.findByPk(id);

    res.status(200).json({
      message: "Question updated successfully",
      updated: updatedQuestion
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Delete BestOptionQuestion by ID
exports.deleteBestOptionQuestionById = async (req, res, next) => {
  const { id } = req.params;

  try {

    // Attempt deletion via stored procedure
    const result = await callProcedure('deleteBestOptionQuestionById', [id]);
    const deleted = result.data;

    if (!deleted || deleted.id === null) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.status(200).json({
      message: "Question deleted successfully",
      deleted,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------PROCEDURE RELATED CODE ENDS---------------------------------

