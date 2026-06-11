const { PreDefinedOptions } = require('../../models/masters/predefinedOption'); // Adjust the path as necessary


// -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------
const { callProcedure } = require("../../utils/procedure/callProcedure");
const Validation = require('../../validations');

const validatePreDefinedOption = (data, userId, isUpdate = false) => {
    const errors = [];

    try {
        if (!isUpdate || data.pre_defined_question_id !== undefined) {
            Validation.isInteger(
                data.pre_defined_question_id,
                "Predefined Question ID must be a valid integer"
            );
        }

        if (!isUpdate || data.option_text !== undefined) {
            Validation.isString(
                data.option_text,
                { min: 1, max: 500 },
                "Option text must be 1-500 characters"
            );
        }

        if (data.is_correct !== undefined && typeof data.is_correct !== "boolean") {
            throw new Error("is_correct must be a boolean (true or false)");
        }

        Validation.isInteger(userId, isUpdate ? "Updated by must be a valid admin ID" : "Created by must be a valid admin ID");

    } catch (err) {
        errors.push(err.message);
    }

    return errors;
};

const normalizeBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return false;
};

// Function to create predefined option using stored procedure
exports.createPreDefinedOptionEntry = async (option, optionImage) => {

    const result = await callProcedure("createPreDefinedOption", [
        option.pre_defined_question_id,
        option.option_text,
        optionImage,
        option.is_correct ? 1 : 0,
        option.created_by,
        option.updated_by,
    ]);

    return result[0]; // Assuming procedure returns inserted row as first result
};

// Create Predefined Option using stored procedure
exports.createPreDefinedOption = async (req, res, next) => {
    try {
        const adminId = req.user.id;
        const option = {
            ...req.body,
            is_correct: normalizeBoolean(req.body.is_correct),
            created_by: adminId,
            updated_by: adminId,
        };
        const errors = validatePreDefinedOption(option, adminId);
        if (errors.length) {
            return res.status(400).json({ errors });
        }

        // Construct image path if an image file is uploaded
        const optionImage = req.file ? "/quiz/predefined_option_images/" + req.file.filename : null;

        // Call the stored procedure to create the option
        const createdOption = await exports.createPreDefinedOptionEntry(option, optionImage);

        res.status(201).json({ message: "Predefined option created successfully", preDefinedOption: createdOption });
    } catch (error) {
        next(error);
    }
};

// Get All PreDefinedOptions using stored procedure
exports.getPreDefinedOptions = async (req, res, next) => {
    try {
        const options = await callProcedure('getAllPreDefinedOptions', []);
        res.status(200).json(options);
    } catch (error) {
        next(error);
    }
};

// Get PreDefinedOptions by PreDefined Question ID using stored procedure
exports.getPreDefinedOptionsByQuestionId = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await callProcedure('getPreDefinedOptionsByQuestionId', [id]);

        // Extract the data array from the result
        const options = result.data;

        // Check if options is an array and not empty
        if (!Array.isArray(options) || options.length === 0) {
            return res.status(404).json({ error: 'Predefined options not found' });
        }

        // Convert is_correct from 1/0 to true/false
        const formattedOptions = options.map(option => ({
            ...option,
            is_correct: Boolean(option.is_correct)
        }));

        res.status(200).json(formattedOptions);
    } catch (error) {
        next(error);
    }
};

// Update Predefined Option using stored procedure
exports.updatePreDefinedOption = async (req, res, next) => {
    const { id } = req.params;

    try {
        // Prepare updated fields
        const adminId = req.user.id;

        let updatedData = {
            ...req.body,
            is_correct: normalizeBoolean(req.body.is_correct),
            updated_by: adminId,
        };

        if (req.file) {
            updatedData.option_img = "/quiz/predefined_option_images/" + req.file.filename;
        }

        const errors = validatePreDefinedOption(updatedData, adminId, true);
        if (errors.length) {
            return res.status(400).json({ errors });
        }

        const {
            pre_defined_question_id,
            option_text,
            option_img,
            is_correct,
            updated_by
        } = {
            ...updatedData,
            option_img: updatedData.option_img || null
        };


        // Call stored procedure to update
        const result = await callProcedure('updatePreDefinedOption', [
            id,
            pre_defined_question_id,
            option_text,
            option_img,
            is_correct ? 1 : 0,
            updated_by
        ]);


        // Fetch and return updated option
        const updatedOptionResult = await callProcedure('getPreDefinedOptionById', [id]);
        const updatedOption = updatedOptionResult.data?.[0];

        if (!updatedOption) {
            return res.status(404).json({ message: "Updated option not found" });
        }

        res.status(200).json({
            ...updatedOption,
            is_correct: Boolean(updatedOption?.is_correct),
        });

    } catch (error) {
        next(error);
    }
};

// Delete Predefined Option using stored procedure
exports.deletePreDefinedOption = async (req, res, next) => {
    const { id } = req.params;
    try {
        const deletedOption = await callProcedure('deletePreDefinedOption', [id]);

        res.status(200).json({
            message: 'Predefined option deleted successfully',
            deletedPreDefinedOption: deletedOption,
        });
    } catch (error) {
        next(error);
    }
};


// -------------------------------------PROCEDURE RELATED CODE ENDS---------------------------------
