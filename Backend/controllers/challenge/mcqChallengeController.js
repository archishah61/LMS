const MCQChallenge = require("../../models/challenges/daily_challenges/mcq_challenge");
const MCQOptionChallenge = require("../../models/challenges/daily_challenges/mcq_option_challenge");
const DailyChallenge = require("../../models/challenges/daily_challenges/daily_challenges");
const { callProcedure } = require("../../utils/procedure/callProcedure");
const sequelize = require("../../config/db");
const Validation = require("../../validations");

exports.createMCQChallenge = async (req, res, next) => {
    try {
        const { challenge_id, challenge_task_id, contest_quiz_id, question_text, options } = req.body;

        // Validate required fields
        if ((!challenge_id && !challenge_task_id && !contest_quiz_id) || !question_text || !options) {
            return res.status(400).json({
                success: false,
                message: "All fields (challenge_id or challenge_task_id, question_text, and options) are required.",
            });
        }

        if (challenge_id) Validation.isNumber(challenge_id, "Challenge ID must be a number.");
        if (challenge_task_id) Validation.isNumber(challenge_task_id, "Challenge Task ID must be a number.");
        if (contest_quiz_id) Validation.isNumber(contest_quiz_id, "Contest Quiz ID must be a number.");
        Validation.isString(question_text, "Question text is required.");
        Validation.isArray(options, { min: 2 }, "Options must be a non-empty array with at least 2 options.");

        // Check for duplicate options
        const optionTexts = options.map(opt => opt.option_text);
        const uniqueOptionTexts = new Set(optionTexts);

        if (uniqueOptionTexts.size !== optionTexts.length) {
            return res.status(400).json({
                success: false,
                message: "Duplicate options are not allowed."
            });
        }

        // Verify exactly one correct answer is marked
        const correctOptionCount = options.filter(opt => opt.is_correct === true).length;

        if (correctOptionCount !== 1) {
            return res.status(400).json({
                success: false,
                message: "Exactly one option must be marked as correct."
            });
        }

        // Prepare options for the stored procedure
        const preparedOptions = options.map(opt => ({
            ...opt,
            option_type: opt.option_type || 'text',  // Default to 'text' if not specified
            is_correct: opt.is_correct ? 1 : 0  // Convert boolean to integer for MySQL
        }));

        // Convert options to JSON string for the stored procedure
        const optionsJSON = JSON.stringify(preparedOptions);

        // Call the stored procedure to create MCQ challenge with options
        const { success, data: result, error } = await callProcedure('createMCQChallenge', [
            challenge_id || null,
            challenge_task_id || null,
            contest_quiz_id || null,
            question_text,
            optionsJSON
        ]);


        if (!success) {
            return next(error);
        }

        return res.status(201).json({
            success: true,
            message: "MCQ Challenge with options created successfully."
        });
    } catch (error) {
        next(error);
    }
};

// ✅ Update MCQ Challenge
exports.updateMCQChallenge = async (req, res, next) => {
    try {
        const { id } = req.params;
        let { question_text, options } = req.body;

        // Validate inputs
        Validation.isNumber(id, "ID must be a number.");
        if (question_text) Validation.isString(question_text, "Question text is required.");
        if (!options || !Array.isArray(options)) {
            return res.status(400).json({
                success: false,
                message: "Options must be provided as an array."
            });
        }

        // Check if at least 2 options are provided
        if (options.length < 2) {
            return res.status(400).json({
                success: false,
                message: "At least 2 options are required for an MCQ challenge."
            });
        }

        // Check if at max 8 options are provided
        if (options.length > 8) {
            return res.status(400).json({
                success: false,
                message: "Maximum 8 options are allowed for an MCQ challenge."
            });
        }

        // Check if each option has an ID (we're only updating existing options)
        // for (const option of options) {
        //     if (!option.id) {
        //         return res.status(400).json({
        //             success: false,
        //             message: "Each option must have an ID. Adding new options is not allowed."
        //         });
        //     }
        // }

        // Check for duplicate option texts
        const optionTexts = options.map(opt => opt.option_text);
        const uniqueOptionTexts = new Set(optionTexts);

        if (uniqueOptionTexts.size !== optionTexts.length) {
            return res.status(400).json({
                success: false,
                message: "Duplicate option texts are not allowed."
            });
        }

        // Verify exactly one correct answer is marked
        const correctOptionCount = options.filter(opt => opt.is_correct === true).length;

        if (correctOptionCount !== 1) {
            return res.status(400).json({
                success: false,
                message: "Exactly one option must be marked as correct."
            });
        }

        // Transform options for the procedure
        options = options.map(opt => ({
            ...opt,
            is_correct: opt.is_correct ? 1 : 0,
            option_type: opt.option_type || 'text' // Default to 'text' if not specified
        }));

        const p_options = JSON.stringify(options);

        // Call stored procedure for updating MCQ challenge
        const { success, data: result, error } = await callProcedure('updateMCQChallenge', [id, question_text, p_options]);

        if (!success) {
            return next(error);
        }

        return res.status(200).json({
            success: true,
            message: "Challenge updated successfully."
        });
    } catch (error) {
        next(error);
    }
};

exports.toggleMCQChallengeStatus = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await callProcedure('toggleMCQChallengeStatus', [id]);

        if (result.error) {
            return next(result.error);
        }

        return res.status(200).json({
            success: true,
            message: "mcq status toggled successfully."
        });

    } catch (error) {
        next(error);
    }
};

// ✅ Delete MCQ Challenge
exports.deleteMCQChallenge = async (req, res, next) => {
    try {
        const { id } = req.params;

        Validation.isNumber(id, "ID must be a number.");
        // Call stored procedure for deleting MCQ challenge
        await callProcedure('deleteMCQChallenge', [id]);

        return res.status(200).json({
            success: true,
            message: "Challenge deleted successfully."
        });
    } catch (error) {
        next(error);
    }
};

exports.createMCQOptionChallenge = async (req, res, next) => {
    try {
        const { mcq_id, option_text, option_type, is_correct } = req.body;

        if (!mcq_id || !option_text || !option_type) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        Validation.isNumber(mcq_id, "MCQ ID must be a number.");
        Validation.isString(option_text, "Option text is required.");
        Validation.isString(option_type, "Option type is required.");

        // Normalize is_correct to boolean
        const normalizedIsCorrect = typeof is_correct === 'boolean' ? is_correct : (typeof is_correct === 'number' ? is_correct === true : false);
        Validation.isBoolean(normalizedIsCorrect, "is_correct must be a boolean value.");

        // If this is a new MCQ with no options yet, allow creating the first options
        try {
            const [mcqOption] = await sequelize.query(
                "CALL CreateMCQOptionChallenge(:mcq_id, :option_text, :option_type, :is_correct)",
                {
                    replacements: {
                        mcq_id,
                        option_text,
                        option_type,
                        is_correct: normalizedIsCorrect
                    }
                }
            );

            return res.status(201).json({
                success: true,
                message: "MCQ Option Challenge created successfully.",
                mcqOption
            });
        } catch (error) {
            if (error.message && error.message.includes('already exists')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            next(error);
        }
    } catch (error) {
        next(error);
    }
};

exports.updateMCQOptionChallenge = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { option_text, option_type, is_correct } = req.body;


        Validation.isNumber(id, "ID must be a number.");
        if (option_text) Validation.isString(option_text, "Option text must be a string.");
        if (option_type) Validation.isString(option_type, "Option type must be a string.");

        // Normalize is_correct to boolean
        let normalizedIsCorrect = false;
        if (is_correct !== undefined) {
            normalizedIsCorrect = typeof is_correct === 'boolean' ? is_correct : (typeof is_correct === 'number' ? is_correct === true : false);
            Validation.isBoolean(normalizedIsCorrect, "is_correct must be a boolean value.");
        }

        try {
            const [mcqOption] = await sequelize.query(
                "CALL UpdateMCQOptionChallenge(:id, :option_text, :option_type, :is_correct)",
                {
                    replacements: {
                        id,
                        option_text: option_text || optionCheck.option_text,
                        option_type: option_type || optionCheck.option_type,
                        is_correct: is_correct === undefined ? optionCheck.is_correct : normalizedIsCorrect
                    }
                }
            );

            return res.status(200).json({
                success: true,
                message: "Option updated successfully.",
                mcqOption
            });
        } catch (error) {
            if (error.message && error.message.includes('already exists')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            next(error);
        }
    } catch (error) {
        next(error);
    }
};

exports.toggleMCQOptionChallengeStatus = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await callProcedure('toggleMCQChallengeOptionStatus', [id]);

        if (result.error) {
            return next(result.error);
        }

        return res.status(200).json({
            success: true,
            message: "mcq option status toggled successfully."
        });

    } catch (error) {
        next(error);
    }
};

exports.deleteMCQOptionChallenge = async (req, res, next) => {
    try {
        const { id } = req.params;

        Validation.isNumber(id, "ID must be a number.");

        await sequelize.query(
            "CALL DeleteMCQOptionChallenge(:id)",
            { replacements: { id } }
        );

        return res.status(200).json({
            success: true,
            message: "Option deleted successfully."
        });

    } catch (error) {
        next(error);
    }
};

// -------------------------------------PROCEDURE RELATED CODE ENDS---------------------------------
