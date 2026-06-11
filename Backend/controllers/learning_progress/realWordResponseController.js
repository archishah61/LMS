const RealWordQuestion = require('../../models/content_management/quiz-questions-types/real-word');
const RealWordResponse = require('../../models/learning_progress/realWordResponse');

// ✅ Submit student response
exports.submitRealWordResponse = async (req, res, next) => {
  try {
    const { real_word_question_id, selected_answers } = req.body;
    const student_id = req.user.id; // Assuming protect middleware sets req.user

    if (!Array.isArray(selected_answers)) {
      return res.status(400).json({ error: 'Selected answers must be an array' });
    }

    const question = await RealWordQuestion.findByPk(real_word_question_id);
    if (!question) {
      return res.status(404).json({ error: 'Real word question not found' });
    }

    // ✅ Calculate score
    const correct_answers = question.correct_answers;
    let correctCount = 0;
    for (let i = 0; i < correct_answers.length; i++) {
      if (selected_answers[i] === correct_answers[i]) {
        correctCount++;
      }
    }

    const score = (correctCount / correct_answers.length) * 100;

    const response = await RealWordResponse.create({
      student_id,
      real_word_question_id,
      selected_answers,
      score,
    });

    res.status(201).json({
      message: 'Response submitted successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Get responses for a student
exports.getRealWordResponsesByStudent = async (req, res, next) => {
  try {
    const student_id = req.user.id;

    const responses = await RealWordResponse.findAll({
      where: { student_id },
      include: [{ model: RealWordQuestion }],
      order: [['created_at', 'DESC']],
    });

    res.status(200).json(responses);
  } catch (error) {
    next(error);
  }
};

// ✅ Get all responses for a specific Real Word Question (admin/instructor view)
exports.getResponsesByQuestionId = async (req, res, next) => {
  try {
    const { question_id } = req.params;

    const responses = await RealWordResponse.findAll({
      where: { real_word_question_id: question_id },
      include: [{ model: RealWordQuestion }],
    });

    res.status(200).json(responses);
  } catch (error) {
    next(error);
  }
};
