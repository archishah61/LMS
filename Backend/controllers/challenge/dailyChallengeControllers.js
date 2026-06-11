// controllers/challenges/daily_challenges/daily_challenges.js
const { callProcedure } = require("../../utils/procedure/callProcedure");
const { callProcedureChallenge } = require("../../utils/procedure/callProcedureChallenge");
const Validation = require("../../validations");               // ✅ add

const allowedLevels = ["Beginner", "Intermediate", "Advanced"];

// ---------------------------------------------------------------------
//  CREATE
// ---------------------------------------------------------------------
exports.createChallenge = async (req, res, next) => {
    try {
        let {
            title,
            description,
            category,
            image_url,
            difficulty_level,
            time_limit,
            estimated_time,
            qualify_percentage = 70,
            max_attempt = 3,
            is_per_question_reward = true,
            show_answer = true,
            is_warning = true,
            no_of_warning = 3,
            points_reward,
            per_question_reward,
            start_date,
            end_date,
            is_active = true,
            fillInTheBlanks = [],
            mcqs = []
        } = req.body;

        /* ---------- VALIDATIONS ---------- */
        Validation.isString(title, { min: 1, max: 255 },
            "Title must be 1‑255 characters.");
        if (description) {
            Validation.isString(description,
                "Description must be String");
        }

        Validation.isInteger(category, "Category ID must be a valid integer.");
        Validation.isEnum(difficulty_level, allowedLevels,
            "Difficulty level must be Beginner, Intermediate, or Advanced.");

        if (time_limit !== undefined && time_limit !== null) {
            Validation.checkIntegerMinMax(time_limit, { min: 1 },
                "Time‑limit must be a positive integer (minutes).");
        }
        if (estimated_time !== undefined && estimated_time !== null) {
            Validation.checkIntegerMinMax(estimated_time, { min: 1 },
                "Estimated‑time must be a positive integer (minutes).");
        }

        Validation.isInteger(max_attempt,
            "Max‑attempt must be an integer.");                 // min check next line
        Validation.checkIntegerMinMax(max_attempt, { min: 1 },
            "Max‑attempt must be at least 1.");

        Validation.isInteger(qualify_percentage,
            "Qualify‑percentage must be an integer.");
        Validation.checkIntegerMinMax(qualify_percentage,
            { min: 35, max: 100 },
            "Qualify‑percentage must be between 35 and 100.");

        // Validation.isBoolean(Boolean(is_per_question_reward),
        //     "is_per_question_reward must be true or false.");

        // Validation.isBoolean(Boolean(show_answer),
        //     "show_answer must be true or false.");

        // Validation.isBoolean(Boolean(is_warning),
        //     "is_warning must be true or false.");

        if (points_reward !== undefined && points_reward !== null) {
            Validation.checkIntegerMinMax(points_reward, { min: 0 },
                "Points‑reward must be 0 or a positive integer.");
        }
        if (per_question_reward !== undefined && per_question_reward !== null) {
            Validation.checkIntegerMinMax(per_question_reward, { min: 0 },
                "Per‑question‑reward must be 0 or a positive integer.");
        }

        if (no_of_warning !== undefined && no_of_warning !== null) {
            Validation.checkIntegerMinMax(no_of_warning, { min: 0 },
                "Muner Of Warnings must be 0 or a positive integer.");
        }

        Validation.isDate(start_date, "Start‑date must be a valid ISO date.");
        if (end_date) {
            Validation.isDate(end_date, "End‑date must be a valid ISO date.");
            if (new Date(end_date) < new Date(start_date)) {
                return res.status(400).json({
                    success: false,
                    message: "End‑date must be after start‑date."
                });
            }
        }

        Validation.isBoolean(is_active, "is_active must be true or false.");
        Validation.isArray(fillInTheBlanks, undefined,
            "fillInTheBlanks must be an array.");
        Validation.isArray(mcqs, undefined,
            "mcqs must be an array.");

        image_url = req.file ? "/daily_challenge/image/" + req.file.filename : image_url;

        /* ---------- Stored procedure ---------- */
        const { success, data, error } = await callProcedure("createDailyChallenge", [
            title,
            description,
            category,
            image_url || null,
            difficulty_level,
            time_limit ?? null,
            estimated_time ?? null,
            qualify_percentage,
            max_attempt,
            Boolean(is_per_question_reward == 'true') || false,
            points_reward ?? null,
            per_question_reward ?? null,
            start_date,
            end_date ?? null,
            Boolean(show_answer == 'true') || false,
            Boolean(is_warning == 'true') || false,
            no_of_warning || 3,
            JSON.stringify(fillInTheBlanks),
            JSON.stringify(mcqs)
        ]);

        if (!success) return next(error);

        res.status(201).json({
            success: true,
            message: "Daily challenge created successfully!",
            challenge: data
        });
    } catch (error) { next(error); }
};

// ---------------------------------------------------------------------
//  READ ALL (with search, pagination)
// ---------------------------------------------------------------------
exports.getAllChallenges = async (req, res, next) => {
    try {
        const {
            search_term = "",
            category,
            difficulty,
            status,
            limit = "all",
            offset = "0",
        } = req.query;

        /* ---------- VALIDATION ---------- */
        if (limit !== "all") {
            Validation.isInteger(limit, "Limit must be a positive integer or 'all'.");
        }
        Validation.isInteger(offset, "Offset must be a non-negative integer.");
        if (search_term) Validation.isString(search_term, { min: 1, max: 255 });
        /* --------------------------------- */

        const parsedLimit = limit === "all" ? "all" : Number(limit);
        const parsedOffset = Number(offset);

        const { success, data, error } = await callProcedureChallenge("getAllChallengesWithCategory", [
            search_term,
            category || null,
            difficulty || null,
            status || null,
            limit === "all" ? 0 : parsedLimit,
            parsedOffset,
            limit === "all" || false
        ]);

        if (!success && error) return next(error);
        if (!success || !data) {
            return res.status(400).json({ message: error || "Unexpected error." });
        }

        res.status(200).json({
            success: true,
            message: "Challenges fetched successfully.",
            totalCount: data[0][0].total_count,
            challenges: Object.values(data[1])
        });
    } catch (error) { next(error); }
};


// ---------------------------------------------------------------------
//  READ BY ID
// ---------------------------------------------------------------------
exports.getChallengeById = async (req, res, next) => {
    try {
        const { id } = req.params;
        Validation.isInteger(id, "Challenge ID must be a valid integer.");

        const { success, data, error } =
            await callProcedureChallenge("GetDailyChallengeById", [id]);

        if (!success || !data || data.length < 1 || !Object.keys(data[0]).length) {
            return next(error);
        }

        // —formatting logic unchanged—
        const challengeData = Object.values(data[0]);
        const fillBlanks = Object.values(data[1] || {});
        const mcqs = Object.values(data[2] || {});
        const mcqOptions = Object.values(data[3] || {});
        const trueFalseChallenges = Object.values(data[4] || {});

        const challenge = challengeData[0];
        const categoryDetails = { id: challenge.category_id, category: challenge.category_name };
        delete challenge.category_id;
        delete challenge.category_name;

        const mcqsWithOptions = mcqs.map(mcq => ({
            ...mcq,
            options: mcqOptions.filter(opt => opt.mcq_id === mcq.id)
        }));

        const formattedChallenge = {
            ...challenge,
            categoryDetails,
            FillInTheBlanksChallenges: fillBlanks,
            MCQChallenges: mcqsWithOptions,
            TrueFalseChallenges: trueFalseChallenges
        };

        res.status(200).json({ success: true, challenge: formattedChallenge });
    } catch (error) { next(error); }
};

// ---------------------------------------------------------------------
//  DELETE
// ---------------------------------------------------------------------
exports.deleteChallenge = async (req, res, next) => {
    try {
        const { id } = req.params;
        Validation.isInteger(id, "Challenge ID must be a valid integer.");

        const { success, error } = await callProcedure("deleteChallengeById", [id]);
        if (!success) return next(error);

        res.status(200).json({ success: true, message: "Challenge deleted successfully." });
    } catch (error) { next(error); }
};

// ---------------------------------------------------------------------
//  UPDATE
// ---------------------------------------------------------------------
exports.updateChallenge = async (req, res, next) => {
    try {
        const { id } = req.params;
        Validation.isInteger(id, "Challenge ID must be a valid integer.");

        let {
            title,
            description,
            category,
            image_url,
            difficulty_level,
            max_attempt,
            time_limit,
            is_per_question_reward = null,
            show_answer = null,
            is_warning = true,
            no_of_warning = 3,
            per_question_reward,
            points_reward,
            qualify_percentage,
            start_date
        } = req.body;

        /* ---------- OPTIONAL FIELD VALIDATIONS ---------- */
        if (title !== undefined && title.trim()) {
            Validation.isString(title, { min: 1, max: 255 },
                "Title must be 1‑255 characters.");
        }
        if (description !== undefined && description.trim()) {
            Validation.isString(description,
                "Description must be String");
        }
        if (category !== undefined) {
            Validation.isInteger(category, "Category ID must be a valid integer.");
        }
        if (difficulty_level !== undefined) {
            Validation.isEnum(difficulty_level, allowedLevels,
                "Difficulty level must be Beginner, Intermediate, or Advanced.");
        }
        if (max_attempt !== undefined) {
            Validation.isInteger(max_attempt, "Max‑attempt must be an integer.");
            Validation.checkIntegerMinMax(max_attempt, { min: 1 },
                "Max‑attempt must be at least 1.");
        }
        // if (is_per_question_reward !== null) {
        //     Validation.isBoolean(Boolean(is_per_question_reward),
        //         "is_per_question_reward must be true or false.");
        // }
        // if (show_answer !== null) {
        //     Validation.isBoolean(Boolean(show_answer),
        //         "show_answer must be true or false.");
        // }

        // Validation.isBoolean(Boolean(is_warning), "is_warning must be true or false.");

        if (no_of_warning !== undefined && no_of_warning !== null) {
            Validation.checkIntegerMinMax(no_of_warning, { min: 0 },
                "Muner Of Warnings must be 0 or a positive integer.");
        }

        if (per_question_reward !== undefined && per_question_reward !== null) {
            Validation.checkIntegerMinMax(per_question_reward, { min: 0 },
                "Per‑question‑reward must be 0 or a positive integer.");
        }
        if (points_reward !== undefined && points_reward !== null) {
            Validation.checkIntegerMinMax(points_reward, { min: 0 },
                "Points‑reward must be 0 or a positive integer.");
        }
        if (qualify_percentage !== undefined) {
            Validation.isInteger(qualify_percentage,
                "Qualify‑percentage must be an integer.");
            Validation.checkIntegerMinMax(qualify_percentage,
                { min: 35, max: 100 },
                "Qualify‑percentage must be between 35 and 100.");
        }
        if (start_date !== undefined && start_date !== null) {
            Validation.isDate(start_date, "Start‑date must be a valid ISO date.");
        }

        image_url = req.file ? "/daily_challenge/image/" + req.file.filename : image_url;

        /* ---------- stored procedure ---------- */
        const { success, error } = await callProcedure("updateChallengeById", [
            id,
            title || null,
            description || null,
            category || null,
            image_url || null,
            difficulty_level || null,
            max_attempt || null,
            Boolean(is_per_question_reward == 'true') || false,
            Boolean(show_answer == 'true') || false,
            Boolean(is_warning == 'true') || false,
            no_of_warning || null,
            per_question_reward || null,
            points_reward || null,
            qualify_percentage || null,
            start_date || null,
            time_limit || null
        ]);

        if (!success) return next(error);

        const { success: challengeSuccess, data, error: challengeError } =
            await callProcedureChallenge("GetDailyChallengeById", [id]);

        if (!challengeSuccess || !data || data.length < 1 || !Object.keys(data[0]).length) {
            return next(challengeError);
        }

        // —formatting logic unchanged—
        const challengeData = Object.values(data[0]);

        res.status(200).json({
            success: true,
            message: "Challenge updated successfully.",
            challenge: challengeData
        });
    } catch (error) { next(error); }
};

// ---------------------------------------------------------------------
//  TOGGLE STATUS
// ---------------------------------------------------------------------
exports.toggleChallengeStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        Validation.isInteger(id, "Challenge ID must be a valid integer.");

        const { success, data, error } = await callProcedure("toggleChallengeStatusById", [id]);
        if (!success) return next(error);

        const updatedChallenge = data[0];        // single record expected
        res.status(200).json({
            success: true,
            message: `Challenge is now ${updatedChallenge.is_active ? "active" : "inactive"}.`,
            challenge: updatedChallenge
        });
    } catch (error) { next(error); }
};
