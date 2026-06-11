const { BestOptionResponse } = require('../../models/content_management/quiz-questions-types/bestOptionResponse');
const { BestOptionQuestion } = require('../../models/content_management/quiz-questions-types/bestOptionQuestion');
const User = require('../../models/auth/user'); // Using User model as student

// ✅ Create a response (student submits answer)
exports.createBestOptionResponse = async (req, res, next) => {
    try {
        const { question_id, student_id, selected_option } = req.body;

        // Check if question exists
        const question = await BestOptionQuestion.findByPk(question_id);
        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }

        // Check if student exists (User model is used for students)
        const student = await User.findByPk(student_id);
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        // Determine if the selected options are correct
        const correct_answers = question.blanked_words; // Correct answers are the blanked words
        const is_correct = selected_option.every((option, index) => option === correct_answers[index]);

        const response = await BestOptionResponse.create({
            question_id,
            student_id,
            selected_option,
            is_correct,
        });

        res.status(201).json({
            message: "Response submitted successfully",
            response,
        });
    } catch (error) {
        next(error);
    }
};

// ✅ Get all responses (admin use)
exports.getAllBestOptionResponses = async (req, res, next) => {
    try {
        const responses = await BestOptionResponse.findAll();
        res.status(200).json(responses);
    } catch (error) {
        next(error);
    }
};

// ✅ Get responses by Question ID
exports.getBestOptionResponsesByQuestionId = async (req, res, next) => {
    const { question_id } = req.params;

    try {
        const responses = await BestOptionResponse.findAll({
            where: { question_id },
        });

        if (responses.length === 0) {
            return res.status(404).json({ error: "No responses found for this question" });
        }

        res.status(200).json(responses);
    } catch (error) {
        next(error);
    }
};

// ✅ Get responses by Student ID
exports.getBestOptionResponsesByStudentId = async (req, res, next) => {
    const { student_id } = req.params;

    try {
        const responses = await BestOptionResponse.findAll({
            where: { student_id },
        });

        if (responses.length === 0) {
            return res.status(404).json({ error: "No responses found for this student" });
        }

        res.status(200).json(responses);
    } catch (error) {
        next(error);
    }
};

// ✅ Update a response (admin or automated logic)
exports.updateBestOptionResponse = async (req, res, next) => {
    const { id } = req.params;
    const { selected_option, is_correct } = req.body;

    try {
        const response = await BestOptionResponse.findByPk(id);
        if (!response) {
            return res.status(404).json({ error: "Response not found" });
        }

        // If selected options were provided, we will update the response and correctness
        const updated_is_correct = is_correct ?? response.is_correct;

        if (selected_option) {
            const question = await BestOptionQuestion.findByPk(response.question_id);
            const correct_answers = question.blanked_words;
            const updated_is_correct = selected_option.every((option, index) => option === correct_answers[index]);
        }

        await response.update({
            selected_option: selected_option ?? response.selected_option,
            is_correct: updated_is_correct,
        });

        res.status(200).json({
            message: "Response updated successfully",
            response,
        });
    } catch (error) {
        next(error);
    }
};

// ✅ Delete a response (admin)
exports.deleteBestOptionResponse = async (req, res, next) => {
    const { id } = req.params;

    try {
        const response = await BestOptionResponse.findByPk(id);
        if (!response) {
            return res.status(404).json({ error: "Response not found" });
        }

        await response.destroy();

        res.status(200).json({
            message: "Response deleted successfully",
            deleted: response,
        });
    } catch (error) {
        next(error);
    }
};
