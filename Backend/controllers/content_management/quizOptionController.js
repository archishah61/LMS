const { QuizOptions } = require('../../models/content_management/quizOptionsModel'); // Adjust the path as necessary

const Validation = require("../../validations");   // ← adjust path if different
// -------------------------------------CREATE QUIZ OPTION CONTROLLER STARTS---------------------------------

const { callProcedure } = require("../../utils/procedure/callProcedure");



// Create Quiz Option using stored procedure
exports.createQuizOption = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        let role = req.user?.role;

        // Map roleId to role string if role is missing
        if (!role && req.user?.roleId) {
            if (req.user.roleId === 1) role = 'admin';
            else if (req.user.roleId === 2) role = 'partner';
        }

        if (!userId || !role) {
            console.error("[QuizOption] Missing userId or role in req.user", req.user);
            return res.status(401).json({ error: "Unauthorized: user or role missing" });
        }

        const option = { ...req.body };
        const optionImage = req.file ? "/quiz/option_images/" + req.file.filename : null;

        // ---------- VALIDATIONS ----------
        Validation.isInteger(option.question_id, "Question ID must be a valid integer.");
        Validation.isString(option.option_text, { min: 1 }, "Option Text must be a non‑empty string.");
        Validation.isString(option.is_correct, "is_correct must be true or false.");
        // Option image is optional but, if present, must be a string
        if (optionImage) Validation.isString(optionImage, { min: 1, max: 255 }, "Invalid image path.");
        // ---------------------------------


        const { success, data, error } = await callProcedure("createQuizOption", [
            option.question_id,
            option.option_text,
            optionImage,
            option.is_correct === 'true' || option.is_correct === true, // Cast to boolean
            userId,
            role,
            userId,
            role
        ]);

        if (!success) {
            console.error("[QuizOption] Procedure error:", error);
            throw new Error(error || "Failed to create quiz option");
        }

        res.status(201).json({
            message: "Quiz option created successfully",
            quizOption: data[0]
        });
    } catch (error) {
        console.error("[QuizOption] Controller error:", error);
        next(error);
    }
};

// Get All Quiz Options using stored procedure (❌ Unused)
exports.getQuizOptions = async (req, res, next) => {
    try {
        const { success, data, error } = await callProcedure("getAllQuizOptions", []);

        if (!success) {
            throw new Error(error || "Failed to fetch quiz options");
        }

        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

// Get Quiz Option by ID using stored procedure
exports.getQuizOptionById = async (req, res, next) => {
    try {
        const { id } = req.params;

        Validation.isInteger(req.params.id, "ID must be a valid integer.");

        const { success, data, error } = await callProcedure("getQuizOptionsByQuestionId", [id]);

        if (!success) {
            throw new Error(error || "Failed to fetch quiz option");
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Quiz option not found' });
        }

        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

// Update Quiz Option using stored procedure
exports.updateQuizOption = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const role = req.user.role;

        Validation.isInteger(id, "Quiz Option ID must be a valid integer.");

        let updatedData = { ...req.body };

        let is_correct = null;
        is_correct = updatedData.is_correct;

        if (updatedData.option_text)
            Validation.isString(updatedData.option_text, { min: 1 }, "Option Text must be a non‑empty string.");

        if (updatedData.is_correct !== undefined)
            Validation.isString(updatedData.is_correct, "is_correct must be true or false.");

        if (updatedData.option_img)
            Validation.isString(updatedData.option_img, { min: 1, max: 255 }, "Invalid image path.");

        // Check if an image file is uploaded
        if (req.files && req.files.optionImage) {
            updatedData.option_img = "/quiz/option_images/" + req.files.optionImage[0].filename;
        }

        const params = [
            parseInt(id),
            updatedData.option_text || null,
            updatedData.option_img || null,
            updatedData.is_correct === "true" || updatedData.is_correct === true,
            userId,
            role
        ];

        const { success, error } = await callProcedure("updateQuizOption", params);

        if (!success) {
            throw new Error(error || "Failed to update quiz option");
        }

        res.status(200).json({ message: "Quiz option updated successfully" });
    } catch (error) {
        next(error);
    }
};

// Delete Quiz Option using stored procedure
exports.deleteQuizOption = async (req, res, next) => {
    const { id } = req.params;
    Validation.isInteger(id, "ID must be a valid integer.");

    try {

        const { results } = await callProcedure("deleteQuizOption", [parseInt(id)]);

        if (!results || results.length === 0) {
            return res.status(404).json({ error: 'Quiz option not found' });
        }

        res.status(200).json({ message: 'Quiz option deleted successfully', deletedQuizOption: results[0] });
    } catch (error) {
        next(error);
    }
};

// Delete Quiz Options by Question ID using stored procedure
exports.deleteOptionsByQuestionId = async (req, res, next) => {
    try {
        const { questionId } = req.params;

        Validation.isInteger(questionId, "Question ID must be a valid integer.");

        const { results } = await callProcedure("deleteQuizOptionsByQuestionId", [parseInt(questionId)]);

        if (!results || results.length === 0 || results[0].deletedCount === 0) {
            return res.status(404).json({ message: "No options found for the given question ID." });
        }

        res.status(200).json({ message: "Options deleted successfully.", deletedCount: results[0].deletedCount });
    } catch (error) {
        next(error);
    }
};


// -------------------------------------CREATE QUIZ OPTION CONTROLLER ENDS---------------------------------

