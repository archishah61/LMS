const sequelize = require('../../config/db.js'); // Adjust the path as necessary
const Validation = require("../../validations"); // Adjust the path as necessary

exports.isChallengeAssignedToday = async (req, res, next) => {
    try {
        const user_id = req.user ? req.user.id : null;

        Validation.isNumber(user_id, "User ID must be a number.");

        if (!user_id) {
            return res.status(400).json({ message: "User not authenticated." });
        }

        const results = await sequelize.query("CALL getUserDailyChallenge(:userId)", {
            replacements: { userId: user_id }
        });

        if (!results || results.length === 0) {
            return res.status(200).json({ assigned: false, message: "No challenge assigned for today." });
        }

        const result = results[0]; // single result

        const response = {
            id: result.id,
            user_id: result.user_id,
            challenge_id: result.challenge_id,
            attempts: result.attempts,
            is_completed: !!result.is_completed,
            completed_at: result.completed_at,
            points_earned: result.points_earned,
            assigned_at: result.assigned_at,
            DailyChallenge: {
                id: result.dc_id,
                title: result.title,
                description: result.description,
                category: result.category,
                difficulty_level: result.difficulty_level,
                time_limit: result.time_limit,
                estimated_time: result.estimated_time,
                qualify_percentage: result.qualify_percentage,
                max_attempt: result.max_attempt,
                is_per_question_reward: !!result.is_per_question_reward,
                show_answer: !!result.show_answer,
                points_reward: result.points_reward,
                per_question_reward: result.per_question_reward,
                start_date: result.start_date,
                end_date: result.end_date,
                is_active: !!result.is_active,
                created_at: result.dc_created_at,
                updated_at: result.dc_updated_at,
                categoryDetails: {
                    id: result.cat_id,
                    category: result.cat_name,
                    is_active: !!result.cat_active,
                    created_by: result.created_by,
                    updated_by: result.updated_by,
                    created_at: result.cat_createdAt,
                    updated_at: result.cat_updatedAt
                }
            }
        };

        return res.status(200).json({ assigned: true, userChallenge: response });

    } catch (error) {
        next(error);
    }
};

exports.getChallengeByDate = async (req, res, next) => {
    try {
        const user_id = req.user ? req.user.id : null;
        const date = req.query?.date;

        Validation.isNumber(user_id, "User ID must be a number.");
        Validation.isDate(date, "Date must be a valid date string.");

        if (!user_id) {
            return res.status(401).json({ success: false, message: 'Unauthorized: user not found.' });
        }

        if (!date) {
            return res.status(400).json({ success: false, message: 'No date found' });
        }

        const result = await sequelize.query(
            `CALL getUserDailyChallengeByDate(:user_id, :date);`,
            {
                replacements: { user_id, date },
            }
        );

        if (!result || result.length === 0) {
            return res.status(200).json({ success: false, message: `No challenge assigned for ${date}.` });
        }

        const raw = result[0]; // since LIMIT 1, it's safe

        const formatted = {
            id: raw.id,
            user_id: raw.user_id,
            challenge_id: raw.challenge_id,
            attempts: raw.attempts,
            is_completed: !!raw.is_completed,
            completed_at: raw.completed_at,
            points_earned: raw.points_earned,
            assigned_at: raw.assigned_at,
            DailyChallenge: {
                id: raw.dc_id,
                title: raw.title,
                description: raw.description,
                category: raw.category,
                difficulty_level: raw.difficulty_level,
                time_limit: raw.time_limit,
                estimated_time: raw.estimated_time,
                qualify_percentage: raw.qualify_percentage,
                max_attempt: raw.max_attempt,
                is_per_question_reward: !!raw.is_per_question_reward,
                show_answer: !!raw.show_answer,
                points_reward: raw.points_reward,
                per_question_reward: raw.per_question_reward,
                start_date: raw.start_date,
                end_date: raw.end_date,
                is_active: !!raw.is_active,
                created_at: raw.dc_created_at,
                updated_at: raw.dc_updated_at,
                categoryDetails: {
                    id: raw.cat_id,
                    category: raw.cat_name,
                    is_active: !!raw.cat_active,
                    created_by: raw.created_by,
                    updated_by: raw.updated_by,
                    created_at: raw.cat_createdAt,
                    updated_at: raw.cat_updatedAt
                }
            }
        };

        return res.status(200).json({ success: true, userChallenge: formatted });

    } catch (error) {
        next(error);
    }
};

exports.assignChallengeToUser = async (req, res, next) => {
    try {
        const { category, difficulty_level } = req.body;
        const user_id = req.user?.id;

        Validation.isNumber(user_id, "User ID must be a number.");
        Validation.isNumber(category, "Category is required.");
        Validation.isEnum(difficulty_level, ["Beginner", "Intermediate", "Advanced"], "Difficulty level must be one of: Beginner, Intermediate, Advanced.");

        if (!user_id || !category || !difficulty_level) {
            return res.status(400).json({
                success: false,
                message: "User ID, category, and difficulty level are required."
            });
        }

        // Execute the stored procedure
        const results = await sequelize.query(
            `CALL assignChallengeToUser(:user_id, :category, :difficulty_level)`,
            {
                replacements: { user_id, category, difficulty_level }
            }
        );

        // Stored procedure returns result in the first index
        const result = results[0];

        if (result.message === 'User already has a challenge assigned for today.') {
            return res.status(409).json({ success: false, message: result.message });
        }

        if (result.message === 'No available unique challenge found for the given category and difficulty level.') {
            return res.status(404).json({ success: false, message: result.message });
        }

        // Success
        return res.status(201).json({
            success: true,
            message: result.message,
            data: {
                id: result.id,
                user_id: result.user_id,
                challenge_id: result.challenge_id,
                attempts: result.attempts,
                is_completed: result.is_completed,
                points_earned: result.points_earned,
                assigned_at: result.assigned_at
            }
        });

    } catch (error) {
        next(error);
    }
};

exports.startChallengeById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user.id : null; // Get the user ID from the request

        Validation.isNumber(id, "Challenge ID must be a number.");
        Validation.isNumber(userId, "User ID must be a number.");

        // Using raw query to call the stored procedure
        const results = await sequelize.query('CALL startChallengeById(?, ?)', {
            replacements: [userId, id],
            type: sequelize.QueryTypes.RAW
        });

        // The first element in results contains our procedure output
        const procedureResult = results[0];

        // Check if we got an error message
        if (!procedureResult.success) {
            return res.status(404).json({
                success: false,
                message: procedureResult.message
            });
        }

        // Format the challenge data to match the original response structure
        const challenge = {
            id: procedureResult.id,
            title: procedureResult.title,
            description: procedureResult.description,
            category: procedureResult.category,
            difficulty_level: procedureResult.difficulty_level,
            time_limit: procedureResult.time_limit,
            estimated_time: procedureResult.estimated_time,
            qualify_percentage: procedureResult.qualify_percentage,
            max_attempt: procedureResult.max_attempt,
            is_per_question_reward: procedureResult.is_per_question_reward,
            show_answer: procedureResult.show_answer,
            is_warning: procedureResult.is_warning,
            no_of_warning: procedureResult.no_of_warning,
            points_reward: procedureResult.points_reward,
            per_question_reward: procedureResult.per_question_reward,
            start_date: procedureResult.start_date,
            end_date: procedureResult.end_date,
            is_active: procedureResult.is_active,
            created_at: procedureResult.created_at,
            updated_at: procedureResult.updated_at,
            categoryDetails: {
                id: procedureResult.category_id,
                category: procedureResult.category
            },
            FillInTheBlanksChallenges: procedureResult.fillInTheBlanks || [],
            TrueFalseChallenges: procedureResult.TrueFalse || [],
            MCQChallenges: procedureResult.mcqChallenges || []
        };

        return res.status(200).json({ success: true, challenge });
    } catch (error) {
        next(error);
    }
};

exports.checkChallenge = async (req, res, next) => {
    try {
        const { challenge_id, userAnswers } = req.body;
        const user_id = req.user ? req.user.id : null;

        if (!user_id || !challenge_id || !userAnswers || !Array.isArray(userAnswers)) {
            return res.status(400).json({
                success: false,
                message: "User ID, Challenge ID, and user answers are required."
            });
        }

        Validation.isNumber(user_id, "User ID must be a number.");
        Validation.isNumber(challenge_id, "Challenge ID must be a number.");
        Validation.isArray(userAnswers, "User answers must be a non-empty array.");
        // Validate each answer object in userAnswers
        userAnswers.forEach((answer, index) => {
            if (typeof answer !== 'object' || !answer.question_id || answer.userAnswer == null || !answer.question_type) {
                throw new Error(`Invalid answer format at index ${index}. Each answer must be an object with question_id, userAnswer, and question_type.`);
            }
            Validation.isNumber(answer.question_id, "Question ID must be a number.");
            // The userAnswer could be a number (ID) for MCQs or a string for other question types
            if (answer.question_type === 'mcq') {
                Validation.isNumber(answer.userAnswer, "MCQ answer must be a number.");
            }
        });

        // Convert boolean to 0/1 before passing to SP
        const sanitizedAnswers = userAnswers.map(a => ({
            ...a,
            userAnswer: a.question_type === "true-false" && typeof a.userAnswer === "boolean"
                ? (a.userAnswer ? 1 : 0)
                : a.userAnswer
        }));

        // Convert sanitizedAnswers to JSON string
        const userAnswersJSON = JSON.stringify(sanitizedAnswers);

        // Call the stored procedure
        const results = await sequelize.query('CALL checkDailyChallenge(:user_id, :challenge_id, :user_answers)', {
            replacements: {
                user_id,
                challenge_id,
                user_answers: userAnswersJSON
            },
            type: sequelize.QueryTypes.RAW
        });

        // The first element of the results array contains our JSON result
        const result = results[0];

        // Parse the JSON string result into an object
        const parsedResult = result;

        // Return the result directly
        return res.status(parsedResult.success ? 200 : 400).json(parsedResult);

    } catch (error) {
        next(error);
    }
};

exports.getUserChallengeById = async (req, res, next) => {
    try {
        const id = req.user.id || null;

        Validation.isNumber(id, "User ID must be a number.");

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID required."
            });
        }
        // Call the stored procedure
        const results = await sequelize.query('CALL getUserDailyChallengeById(?)', {
            replacements: [id],
            type: sequelize.QueryTypes.RAW
        });

        // Check if we got any results
        if (!results || results.length === 0) {
            return res.status(404).json({ success: false, message: "Challenge not found For this User." });
        }

        const procedureResult = results[0];

        // Format the response to match the original structure
        const userChallenge = {
            id: procedureResult.id,
            user_id: procedureResult.user_id,
            challenge_id: procedureResult.challenge_id,
            attempts: procedureResult.attempts,
            is_completed: procedureResult.is_completed,
            completed_at: procedureResult.completed_at,
            points_earned: procedureResult.points_earned,
            assigned_at: procedureResult.assigned_at,
            DailyChallenge: {
                id: procedureResult.dc_id,
                title: procedureResult.title,
                description: procedureResult.description,
                category: procedureResult.category,
                image_url: procedureResult.image_url,
                difficulty_level: procedureResult.difficulty_level,
                time_limit: procedureResult.time_limit,
                estimated_time: procedureResult.estimated_time,
                qualify_percentage: procedureResult.qualify_percentage,
                max_attempt: procedureResult.max_attempt,
                is_per_question_reward: procedureResult.is_per_question_reward,
                show_answer: procedureResult.show_answer,
                points_reward: procedureResult.points_reward,
                per_question_reward: procedureResult.per_question_reward,
                start_date: procedureResult.start_date,
                end_date: procedureResult.end_date,
                is_active: procedureResult.is_active,
                created_at: procedureResult.created_at,
                updated_at: procedureResult.updated_at,
                categoryDetails: {
                    id: procedureResult.category_id,
                    category: procedureResult.category,
                    is_active: procedureResult.category_is_active,
                    created_by: procedureResult.created_by,
                    updated_by: procedureResult.updated_by,
                    created_at: procedureResult.category_created_at,
                    updated_at: procedureResult.category_updated_at
                }
            }
        };

        return res.status(200).json({ success: true, userChallenge });
    } catch (error) {
        next(error);
    }
};

exports.getCompleteDatesById = async (req, res, next) => {
    try {
        const user_id = req.user?.id;

        Validation.isNumber(user_id, "User ID must be a number.");

        // Call the stored procedure
        const results = await sequelize.query('CALL getCompleteDatesByUserId(:user_id)', {
            replacements: { user_id },
            type: sequelize.QueryTypes.RAW
        });

        // Separate into completed and not completed
        const completedDates = [];
        const notCompletedDates = [];

        results.forEach((row) => {
            if (row.is_completed) {
                completedDates.push(row.formatted_date);
            } else {
                notCompletedDates.push(row.formatted_date);
            }
        });

        return res.status(200).json({
            success: true,
            completed: completedDates,
            not_completed: notCompletedDates,
        });
    } catch (error) {
        next(error);
    }
};
