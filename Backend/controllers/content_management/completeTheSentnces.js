const { CompleteSentence } = require('../../models/content_management/quiz-questions-types/completeTheSentence');
const Validation = require("../../validations");   // ← adjust path to match your tree


exports.createCompleteTheSentences = async (req, res) => {
    try {
        const { quiz_id, question, blanks } = req.body;
        const userId = req.user.id;
        const role = req.user.role;


        // ---------- VALIDATIONS ----------
        Validation.isInteger(quiz_id, "quiz_id must be a valid integer.");
        Validation.isString(question, { min: 5 }, "Question must be at least 5 characters.");
        Validation.isArray(blanks, { min: 1 }, "blanks must be a non‑empty array of objects.");

        // Extract correct words and hints
        const correctWords = blanks.map(ans => ans.word);
        const hints = blanks.map(ans => ans.hint || null);

        blanks.forEach((b, idx) => {
            Validation.isObject(b, `Blank at index ${idx} must be an object.`);
            Validation.isString(b.word, { min: 1 }, `word in blank #${idx + 1} must be a string.`);
            if (b.hint !== undefined && b.hint !== null) {
                Validation.isString(b.hint, { min: 1 }, `hint in blank #${idx + 1} must be a string.`);
            }
        });

        if (correctWords.some(word => !word)) {
            return res.status(400).json({
                success: false,
                message: 'Each answer must have a correct_word.'
            });
        }

        const newSentence = await CompleteSentence.create({
            quiz_id,
            question,
            correct_word: correctWords,
            hint: hints,
            created_by: userId,
            created_by_type: role,
            updated_by: userId,
            updated_by_type: role
        });

        return res.status(201).json({
            success: true,
            message: 'Complete-the-sentence question created successfully.',
            data: newSentence
        });

    } catch (error) {
        console.error('Error creating complete-the-sentence question:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
};



exports.getAllCompleteSentences = async (req, res) => {
    try {
        const sentences = await CompleteSentence.findAll();

        return res.status(200).json({
            success: true,
            message: 'All complete-the-sentence questions retrieved successfully.',
            data: sentences
        });
    } catch (error) {
        console.error('Error fetching complete-the-sentence questions:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
};

exports.getCompleteSentencesByQuizId = async (req, res) => {
    try {
        const { quiz_id } = req.params;

        Validation.isInteger(quiz_id, "quiz_id must be a valid integer.");

        const sentences = await CompleteSentence.findAll({
            where: { quiz_id: quiz_id }
        });

        if (!sentences || sentences.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No questions found for this quiz ID.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Complete-the-sentence questions retrieved successfully.',
            data: sentences
        });

    } catch (error) {
        console.error('Error fetching questions by quiz ID:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
};


exports.updateCompleteSentenceById = async (req, res) => {
    try {
        const { id } = req.params;
        const { question, correct_word, hint } = req.body;
        const userId = req.user.id;
        const role = req.user.role;

        const sentence = await CompleteSentence.findByPk(id);

        Validation.isInteger(id, "ID must be a valid integer.");

        if (question !== undefined)
            Validation.isString(question, { min: 5 }, "Question must be at least 5 characters.");

        if (correct_word !== undefined) {
            let cw = correct_word;
            if (typeof cw === "string") {
                try { cw = JSON.parse(cw); } catch { Validation.throwError("correct_word must be an array or JSON array."); }
            }
            Validation.isStringArray(cw, { min: 1 }, "correct_word must be a non‑empty array of strings.");
            sentence.correct_word = cw;
        }

        if (hint !== undefined) {
            let ht = hint;
            if (typeof ht === "string") {
                try { ht = JSON.parse(ht); } catch { Validation.throwError("hint must be an array or JSON array."); }
            }
            Validation.isStringArray(ht, { min: 0 }, "hint must be an array of strings.");
            sentence.hint = ht;
        }

        if (!sentence) {
            return res.status(404).json({
                success: false,
                message: 'Complete-the-sentence question not found.'
            });
        }

        // Update fields
        sentence.question = question || sentence.question;
        sentence.correct_word = correct_word || sentence.correct_word;
        sentence.hint = hint || sentence.hint;
        sentence.updated_by = userId;
        sentence.updated_by_type = role;

        await sentence.save();

        return res.status(200).json({
            success: true,
            message: 'Question updated successfully.',
            data: sentence
        });

    } catch (error) {
        console.error('Error updating question:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
};
