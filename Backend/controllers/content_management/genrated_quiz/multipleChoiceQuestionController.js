const { callProcedure } = require('../../../utils/procedure/callProcedure');

// -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------

exports.createMultipleChoiceQuestion = async (req, res, next) => {
    try {
        const { quizTextId, text, correctAnswer, marks, options } = req.body;

        if (!quizTextId || !text || !correctAnswer || !options || options.length === 0) {
            return res.status(400).json({ success: false, message: "quizTextId, text, correctAnswer, and options are required." });
        }

        const userId = req.user.id;
        const role = req.user.role;

        const { success, data, error } = await callProcedure('createMultipleChoiceQuestion', [
            quizTextId ?? null,
            text ?? null,
            correctAnswer ?? null,
            marks || null,
            JSON.stringify(options ?? []),
            userId,
            userId,
            role,
            role
        ]);

        if (!success) {
            return next(error);
            // return res.status(400).json({ success: false, message: error });
        }

        return res.status(201).json({
            success: true,
            message: "Multiple choice question created successfully!",
            question: data[0],
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteMultipleChoiceQuestion = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({ success: false, message: "ID must be a valid integer." });
        }

        const { success, error } = await callProcedure('deleteMultipleChoiceQuestionsByQuizTextId', [id]);

        // if (!success) return res.status(400).json({ success: false, message: error });

        if (!success) return next(error);

        return res.status(200).json({ success: true, message: "Multiple choice questions deleted successfully!" });
    } catch (error) {
        next(error);
    }
};

// -------------------------------------PROCEDURE RELATED CODE ENDS---------------------------------
