const fs = require("fs");
const path = require("path");
const nspell = require("nspell");

const RealWordQuestion = require('../../models/content_management/quiz-questions-types/real-word');
const { Quizzes } = require('../../models/content_management/quizzesModel');

let spell;

// ✅ Load dictionary
try {
  const aff = fs.readFileSync(require.resolve("dictionary-en-us/index.aff"), "utf-8");
  const dic = fs.readFileSync(require.resolve("dictionary-en-us/index.dic"), "utf-8");
  spell = nspell(aff, dic);
} catch (error) {
  console.error("❌ Failed to load dictionary:", error);
}

// Helper Functions

// ✅ Generate 10 random real/fake words
exports.getRandomRealWordQuiz = async (req, res, next) => {
  try {
    if (!spell) {
      return res.status(500).json({ error: "Dictionary not loaded" });
    }

    const realWords = [];
    const fakeWords = [];
    const usedWords = new Set();

    while (realWords.length < 5) {
      const word = generateRandomRealWord();
      if (!usedWords.has(word)) {
        realWords.push({ word, correct_answer: "yes" });
        usedWords.add(word);
      }
    }

    while (fakeWords.length < 5) {
      const word = generateFakeWord();
      if (!spell.correct(word) && !usedWords.has(word)) {
        fakeWords.push({ word, correct_answer: "no" });
        usedWords.add(word);
      }
    }

    const quiz = [...realWords, ...fakeWords].sort(() => 0.5 - Math.random());
    res.status(200).json({ quiz });
  } catch (error) {
    next(error);
  }
};

// ✅ Generate realistic fake word from syllables
function generateFakeWord() {
  const syllables = [
    "ba", "be", "bi", "bo", "bu",
    "ca", "ce", "ci", "co", "cu",
    "da", "de", "di", "do", "du",
    "ra", "re", "ri", "ro", "ru",
    "ka", "ke", "ki", "ko", "ku",
    "za", "ze", "zi", "zo", "zu",
    "fa", "fe", "fi", "fo", "fu",
    "la", "le", "li", "lo", "lu",
    "na", "ne", "ni", "no", "nu",
    "ta", "te", "ti", "to", "tu",
    "ma", "me", "mi", "mo", "mu",
    "pa", "pe", "pi", "po", "pu",
    "sha", "she", "shi", "sho", "shu"
  ];

  const syllableCount = Math.floor(Math.random() * 4) + 2; // 2–3 syllables
  let word = "";
  for (let i = 0; i < syllableCount; i++) {
    word += syllables[Math.floor(Math.random() * syllables.length)];
  }
  return word;
}

// ✅ Generate real word using spell check
function generateRandomRealWord() {
  const word = generateFakeWord();
  return spell.correct(word) ? word : generateRandomRealWord();
}


// -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------
const { callProcedure } = require("../../utils/procedure/callProcedure");

// ✅ Create Real Word Questions using stored procedure
exports.createRealWordQuestions = async (req, res, next) => {
  try {
    const { questions } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    const words = questions.map(q => q.word);
    const correct_answers = questions.map(q => q.correct_answer);
    const marks = questions.map(q => q.marks);
    const { quiz_id } = questions[0];

    const result = await callProcedure('CreateRealWordQuestion', [
      quiz_id,
      JSON.stringify(words),
      JSON.stringify(correct_answers),
      JSON.stringify(marks),
      userId,
      userId,
      role,
      role,
    ]);


    res.status(201).json({
      message: "Real word questions created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Get Real Word Questions by Quiz ID using stored procedure (❌ To be tested)
exports.getRealWordQuestionByQuizId = async (req, res, next) => {
  const { quiz_id } = req.params;

  try {

    const result = await callProcedure('GetRealWordQuestionByQuizId', [parseInt(quiz_id)]);

    const data = result?.data || result;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ error: "No real word questions found for this quiz." });
    }

    const formatted = data.map(row => ({
      id: row.id,
      quiz_id: row.quiz_id,
      words: typeof row.words === 'string' ? JSON.parse(row.words) : row.words,
      correct_answers: typeof row.correct_answers === 'string' ? JSON.parse(row.correct_answers) : row.correct_answers,
      created_by: row.created_by,
      updated_by: row.updated_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    res.status(200).json(formatted); // ✅ just send plain data
  } catch (error) {
    next(error);
  }
};

// ✅ Delete a word from a real word question using stored procedure
exports.deleteWordFromRealWordQuestion = async (req, res, next) => {
  const { id } = req.params;
  const { wordIndex, updated_by } = req.body;

  try {

    if (!Number.isInteger(wordIndex) || wordIndex < 0) {
      return res.status(400).json({ error: "Invalid word index" });
    }

    await callProcedure('DeleteWordFromRealWordQuestion', [
      parseInt(id),
      wordIndex,
      parseInt(updated_by),
    ]);
    res.status(200).json({ message: "Word removed successfully" });
  } catch (error) {
    next(error);
  }
};


// -------------------------------------PROCEDURE RELATED CODE ENDS-----------------------------------


