const Validation = require('../../validations');
const FooterSetting = require('../../models/legalPages/footerSetting');
const { callProcedure } = require('../../utils/procedure/callProcedure');

// Get Footer Settings
const getFooterSettings = async (req, res, next) => {
    try {
        const { success, data, error } = await callProcedure("getFooterSettings", []);

        if (!success) {
            return next(error);
        }

        if (!data[0]) {
            return res.status(404).json({
                success: false,
                message: "Footer settings not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Footer settings recovered successfully",
            data: data[0]
        });
    } catch (error) {
        next(error);
    }
};

// Field-specific validation functions
const validateField = (field, value) => {
    try {
        switch (field) {
            case 'email':
                Validation.isEmail(value, "Please provide a valid email address");
                break;

            case 'phone':
                Validation.isMobileNumber(value, { min: 10, max: 15 }, "Please provide a valid phone number");
                break;

            case 'address':
                Validation.isString(value, { min: 10, max: 500 }, "Address must be 10-500 characters");
                break;

            case 'timing':
                Validation.isString(value, { min: 5, max: 100 }, "Timing information must be 5-100 characters");
                break;

            case 'footerLogo':
            case 'headerLogo':
                Validation.isNonEmptyString(value, `${field} path is required`);
                break;

            default:
                throw new Error(`Invalid field: ${field}`);
        }
    } catch (validationError) {
        throw validationError;
    }
};

// Update individual field in Footer Settings
const updateFooterField = async (req, res, next) => {
    try {
        const { field } = req.params;
        const userId = req.user.id;
        const validFields = ['address', 'phone', 'email', 'timing', 'footerLogo', 'headerLogo'];

        // Validate field name
        Validation.isEnum(field, validFields, "Invalid footer field");

        let value;

        // Handle logo files
        if (field === 'footerLogo' || field === 'headerLogo') {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "File not provided"
                });
            }
            value = `/footer/${req.file.filename}`;
        } else {
            // Validate presence of value for non-logo fields
            if (!req.body.value) {
                return res.status(400).json({
                    success: false,
                    message: `Value for ${field} is required`
                });
            }

            value = req.body.value;

            // Trim string values
            if (typeof value === 'string') {
                value = value.trim();
            }
        }

        // Validate field-specific rules
        validateField(field, value);

        // Process phone number formatting
        if (field === 'phone') {
            // Remove all non-digit characters
            let cleaned = value.replace(/\D/g, '');

            // Ensure the phone number starts with +91
            if (!cleaned.startsWith('91')) {
                cleaned = '91' + cleaned;
            }

            // Format the phone number as +91 XXXXXXXXXX
            value = `+${cleaned.substring(0, 2)} ${cleaned.substring(2)}`;
        }

        const { success, data, error } = await callProcedure("upsertFooterField", [field, value, userId]);

        if (!success) {
            return next(error);
        }

        return res.status(200).json({
            success: true,
            message: `${field} updated successfully`,
            data: {
                [field]: data[0][field]
            }
        });
    } catch (error) {
        console.error("Error updating footer field:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Error updating footer field",
            error: error.message
        });
    }
};

module.exports = {
    getFooterSettings,
    updateFooterField
};