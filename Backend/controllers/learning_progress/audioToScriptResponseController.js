const { AudioToScriptResponse } = require('../../models/learning_progress/audioToScriptResponse');
const { AudioToScriptQuestion } = require('../../models/content_management/quiz-questions-types/audiotoScript');
const User = require('../../models/auth/user');

// Add this dictionary at the top
const contractionsMap = {
    "aren't": "are not",
    "can't": "cannot",
    "could've": "could have",
    "couldn't": "could not",
    "didn't": "did not",
    "doesn't": "does not",
    "don't": "do not",
    "hadn't": "had not",
    "hasn't": "has not",
    "haven't": "have not",
    "he'd": "he would",
    "he'll": "he will",
    "he's": "he is",
    "I'd": "I would",
    "I'll": "I will",
    "I'm": "I am",
    "I've": "I have",
    "isn't": "is not",
    "it's": "it is",
    "let's": "let us",
    "mightn't": "might not",
    "mustn't": "must not",
    "shan't": "shall not",
    "she'd": "she would",
    "she'll": "she will",
    "she's": "she is",
    "should've": "should have",
    "shouldn't": "should not",
    "that's": "that is",
    "there's": "there is",
    "they'd": "they would",
    "they'll": "they will",
    "they're": "they are",
    "they've": "they have",
    "we'd": "we would",
    "we're": "we are",
    "we've": "we have",
    "we'll": "we will",
    "weren't": "were not",
    "what'll": "what will",
    "what're": "what are",
    "what's": "what is",
    "what've": "what have",
    "where's": "where is",
    "who's": "who is",
    "won't": "will not",
    "would've": "would have",
    "wouldn't": "would not",
    "you'd": "you would",
    "you'll": "you will",
    "you're": "you are",
    "you've": "you have",
};

// Function to expand contractions in a sentence
const expandContractions = (text) => {
    let expandedText = text;
    for (const contraction in contractionsMap) {
        const regex = new RegExp(`\\b${contraction}\\b`, 'gi');
        expandedText = expandedText.replace(regex, contractionsMap[contraction]);
    }
    return expandedText;
};

// Normalizer with contraction expansion
const normalizeText = (text) => {
    const expanded = expandContractions(text);
    return expanded
        .toLowerCase()
        .replace(/[^\w\s]/gi, '') // Remove punctuation
        .trim();
};


// Utility to calculate similarity score (based on common words)
const calculateSimilarity = (text1, text2) => {
    const words1 = new Set(normalizeText(text1).split(/\s+/));
    const words2 = new Set(normalizeText(text2).split(/\s+/));

    const intersection = [...words1].filter(word => words2.has(word));
    const similarity = intersection.length / Math.max(words1.size, words2.size);

    return similarity;
};

// Map similarity to letter grade
const getLetterGrade = (similarity) => {
    if (similarity >= 0.9) return 'A';
    if (similarity >= 0.8) return 'B';
    if (similarity >= 0.7) return 'C';
    if (similarity >= 0.6) return 'D';
    if (similarity >= 0.5) return 'E';
    return 'F';
};

// ✅ Create a response (student submits answer)
exports.createAudioToScriptResponse = async (req, res, next) => {
    try {
        const { question_id, student_id, response_text } = req.body;

        // Check if question exists
        const question = await AudioToScriptQuestion.findByPk(question_id);
        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }

        // Check if student exists
        const student = await User.findByPk(student_id);
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        // Calculate similarity and grade
        const similarity = calculateSimilarity(response_text, question.script);
        const grade = getLetterGrade(similarity);

        const response = await AudioToScriptResponse.create({
            question_id,
            student_id,
            response_text,
            grade,
        });

        res.status(201).json({
            message: "Response submitted successfully",
            grade,
            response,
        });
    } catch (error) {
        next(error);
    }
};

// ✅ Get all responses (admin use)
exports.getAllAudioToScriptResponses = async (req, res, next) => {
    try {
        const responses = await AudioToScriptResponse.findAll();
        res.status(200).json(responses);
    } catch (error) {
        next(error);
    }
};

// ✅ Get responses by Question ID
exports.getResponsesByQuestionId = async (req, res, next) => {
    const { question_id } = req.params;

    try {
        const responses = await AudioToScriptResponse.findAll({
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
exports.getResponsesByStudentId = async (req, res, next) => {
    const { student_id } = req.params;

    try {
        const responses = await AudioToScriptResponse.findAll({
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
exports.updateAudioToScriptResponse = async (req, res, next) => {
    const { id } = req.params;
    const { response_text, is_correct } = req.body;

    try {
        const response = await AudioToScriptResponse.findByPk(id);
        if (!response) {
            return res.status(404).json({ error: "Response not found" });
        }

        await response.update({
            response_text: response_text ?? response.response_text,
            is_correct: typeof is_correct === 'boolean' ? is_correct : response.is_correct,
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
exports.deleteAudioToScriptResponse = async (req, res, next) => {
    const { id } = req.params;

    try {
        const response = await AudioToScriptResponse.findByPk(id);
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
