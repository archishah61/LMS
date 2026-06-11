class Validation {
    static throwError(msg, fallback) {
        throw new Error(msg || fallback);
    }

    static checkStringMinMax(value, { min, max } = {}, msg) {
        if (min !== undefined && value.length < min) {
            this.throwError(msg, `Minimum length is ${min}.`);
        }
        if (max !== undefined && value.length > max) {
            this.throwError(msg, `Maximum length is ${max}.`);
        }
    }

    static checkIntegerMinMax(value, { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {}, msg) {
        const num = Number(value);
        if (!Number.isInteger(num)) {
            this.throwError(msg, "Value must be an integer.");
        }
        if (num < min || num > max) {
            this.throwError(msg, `Integer must be between ${min} and ${max}.`);
        }
    }

    static isString(value, { min = 1, max = 1024 } = {}, msg) {
        if (typeof value !== "string" || !value.trim()) {
            this.throwError(msg, "Must be a non-empty string.");
        }
        this.checkStringMinMax(value, { min, max }, msg);
    }

    static isNumber(value, { min = 0, max = Infinity } = {}, msg) {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (typeof num !== "number" || isNaN(num) || num < min || num > max) {
            this.throwError(msg, `Number must be between ${min} and ${max}.`);
        }
    }

    static isInteger(value, msg) {
        const num = Number(value);
        if (!Number.isInteger(num)) {
            this.throwError(msg, "Must be a valid integer.");
        }
    }

    static isBoolean(value, msg) {
        if (typeof value !== "boolean") {
            this.throwError(msg, "Must be true or false.");
        }
    }

    static isEmail(value, msg) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            this.throwError(msg, "Invalid email format.");
        }
    }

    static isMobileNumber(value, { min = 10, max = 15 } = {}, msg) {
        if (!/^[0-9]+$/.test(value)) {
            this.throwError(msg, "Contact Number must contain only digits.");
        }
        this.checkStringMinMax(value, { min, max }, "Contact Number must be between 10 to 15 digits.");
    }

    static isURL(value, msg) {
        try {
            new URL(value);
        } catch {
            this.throwError(msg, "Invalid URL format.");
        }
    }

    static isDate(value, msg) {
        if (isNaN(Date.parse(value))) {
            this.throwError(msg, "Invalid date format.");
        }
    }

    static isArray(value, { min = 0, max = Infinity } = {}, msg) {
        if (!Array.isArray(value)) {
            this.throwError(msg, "Must be an array.");
        }
        this.checkStringMinMax(value, { min, max }, msg);
    }

    static isObject(value, msg) {
        if (typeof value !== "object" || Array.isArray(value) || value === null) {
            this.throwError(msg, "Must be an object.");
        }
    }

    static isEnum(value, options, msg) {
        if (!options.includes(value)) {
            this.throwError(msg, `Value must be one of: ${options.join(", ")}`);
        }
    }

    static isAlpha(value, msg) {
        if (!/^[a-zA-Z]+$/.test(value)) {
            this.throwError(msg, "Must contain only letters.");
        }
    }

    static isAlphaNumeric(value, msg) {
        if (!/^[a-zA-Z0-9]+$/.test(value)) {
            this.throwError(msg, "Must contain only letters and numbers.");
        }
    }

    static isStrongPassword(value, msg) {
        if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value)) {
            this.throwError(msg, "Password must be 8+ chars with uppercase, number, and special character.");
        }
    }

    static isZipCode(value, msg) {
        if (!/^\d{5,10}$/.test(value)) {
            this.throwError(msg, "Invalid ZIP code.");
        }
    }

    static isUUID(value, msg) {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
            this.throwError(msg, "Invalid UUID format.");
        }
    }

    static isHexColor(value, msg) {
        if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
            this.throwError(msg, "Invalid hex color.");
        }
    }

    static isCustomRegex(value, regex, msg) {
        if (!regex.test(value)) {
            this.throwError(msg, "Invalid format.");
        }
    }

    static isJSON(value, msg) {
        try {
            const parsed = typeof value === 'string' ? JSON.parse(value) : value;
            if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
                throw new Error();
            }
        } catch {
            this.throwError(msg, "Must be a valid JSON object.");
        }
    }

    static isJSONArray(value, msg) {
        try {
            const parsed = typeof value === 'string' ? JSON.parse(value) : value;
            if (!Array.isArray(parsed)) {
                throw new Error();
            }
        } catch {
            this.throwError(msg, "Must be a valid JSON array.");
        }
    }

    static hasMinLength(value, minLength, msg) {
        if ((typeof value === 'string' || Array.isArray(value)) && value.length < minLength) {
            this.throwError(msg, `Must be at least ${minLength} characters long.`);
        }
    }

    // Validates a 3‑letter uppercase airport / city code (e.g. "BOM", "NYC")
    static isCityCode(value, msg) {
        if (typeof value !== "string" || !/^[A-Z]{3}$/.test(value.trim())) {
            this.throwError(msg, "City code must be three uppercase letters (e.g., BOM).");
        }
    }

    // Validates a two‑letter uppercase state / province code (e.g. "CA", "MH")
    static isStateCode(value, msg) {
        if (typeof value !== "string" || !/^[A-Z]{2}$/.test(value.trim())) {
            this.throwError(msg, "State code must be exactly two uppercase letters (e.g., CA).");
        }
    }

    // Only uppercase ISO‑3166 alpha‑3 codes, e.g. "IND", "USA"
    static isCountryCode(value, msg) {
        if (typeof value !== "string" || !/^[A-Z]{3}$/.test(value.trim())) {
            this.throwError(msg, "Country code must be a 3‑letter uppercase code (e.g., IND).");
        }
    }

    // Only uppercase ISO‑4217 currency codes, e.g. "INR", "USD"
    static isCurrencyCode(value, msg) {
        if (typeof value !== "string" || !/^[A-Z]{3}$/.test(value.trim())) {
            this.throwError(msg, "Currency must be a 3‑letter uppercase code (e.g., USD).");
        }
    }

    // Phone code like "+1", "+91", "+358"
    static isPhoneCode(value, msg) {
        if (typeof value !== "string" || !/^\+\d{1,4}$/.test(value.trim())) {
            this.throwError(msg, "Phone code must be a plus sign followed by 1‑4 digits (e.g., +91).");
        }
    }

    // Letters and spaces only (for names, regions, etc.)
    static isAlphabet(value, msg) {
        if (typeof value !== "string" || !/^[A-Za-z\s]+$/.test(value.trim())) {
            this.throwError(msg, "Value must contain alphabetic characters only.");
        }
    }

    static isQuizQuestionType(value, msg) {
        const allowed = [
            "multiple-choice", "true-false", "fill-blank",
            "complete-sentence", "drag-drop", "match-the-following",
            "real-word", "best-option", "image"
        ];
        if (!allowed.includes(value)) {
            this.throwError(msg, `Invalid question type. Must be one of: ${allowed.join(", ")}`);
        }
    }

    // You can extend this with more edge case-specific validations
    static isDecimal(value, { min = 0, max = Infinity } = {}, msg) {
        const num = parseFloat(value);
        if (isNaN(num) || num < min || num > max) {
            this.throwError(msg, `Decimal must be between ${min} and ${max}.`);
        }
    }

    // Helper function to validate answers array
    static validateAnswers(answers) {
        const errors = [];
        const supportedQuestionTypes = ['true-false', 'fill-in-the-blank', 'mcq'];

        answers.forEach((answer, index) => {
            const answerErrors = [];

            // Check required fields
            if (!answer.question_id) {
                answerErrors.push(`Question ID is required`);
            } else if (!Number.isInteger(Number(answer.question_id)) || Number(answer.question_id) <= 0) {
                answerErrors.push(`Question ID must be a positive integer`);
            }

            if (!answer.question_type) {
                answerErrors.push(`Question type is required`);
            } else if (!supportedQuestionTypes.includes(answer.question_type)) {
                answerErrors.push(`Unsupported question type. Allowed types: ${supportedQuestionTypes.join(', ')}`);
            }

            // Validate userAnswer based on question type
            if (answer.question_type) {
                switch (answer.question_type) {
                    case 'true-false':
                        if (!answer.userAnswer) {
                            answerErrors.push(`User answer is required for true-false questions`);
                        } else if (!['true', 'false'].includes(answer.userAnswer.toString().toLowerCase())) {
                            answerErrors.push(`Answer must be either "true" or "false" for true-false questions`);
                        }
                        break;

                    case 'fill-in-the-blank':
                        if (!answer.userAnswer || answer.userAnswer.toString().trim() === '') {
                            answerErrors.push(`Answer cannot be empty for fill-in-the-blank questions`);
                        } else if (answer.userAnswer.toString().length > 500) {
                            answerErrors.push(`Answer is too long (maximum 500 characters)`);
                        }
                        break;

                    case 'mcq':
                        if (!answer.userAnswer) {
                            answerErrors.push(`User answer is required for MCQ questions`);
                        } else if (!Number.isInteger(Number(answer.userAnswer)) || Number(answer.userAnswer) <= 0) {
                            answerErrors.push(`Answer must be a valid option ID for MCQ questions`);
                        }
                        break;
                }
            }

            // Check for duplicate question IDs
            const duplicateIndex = answers.findIndex((a, i) =>
                i !== index && a.question_id === answer.question_id
            );
            if (duplicateIndex !== -1) {
                answerErrors.push(`Duplicate question ID found (also at index ${duplicateIndex})`);
            }

            // Add errors for this answer if any
            if (answerErrors.length > 0) {
                errors.push({
                    index: index,
                    question_id: answer.question_id,
                    errors: answerErrors
                });
            }
        });

        return errors;
    }
    static isStringArray(value, { min = 1, max = Infinity } = {}, msg) {
        if (!Array.isArray(value)) {
            this.throwError(msg, "Must be an array.");
        }
        if (value.length < min || value.length > max) {
            this.throwError(msg, `Array must contain between ${min} and ${max} items.`);
        }
        for (const v of value) {
            if (typeof v !== "string" || !v.trim()) {
                this.throwError(msg, "Each item must be a non‑empty string.");
            }
        }
    }

    static isOptionType(value, msg) {
        if (!["text", "image"].includes(value)) {
            this.throwError(msg, "Option type must be either 'text' or 'image'.");
        }
    }

    static isMatchType(value, msg) {
        if (!["text", "image"].includes(value)) {
            this.throwError(msg, "Match type must be either 'text' or 'image'.");
        }
    }

    static isNonEmptyString(value, msg) {
        if (typeof value !== "string" || !value.trim()) {
            this.throwError(msg, "Must be a non-empty string.");
        }
    }

    static isDateOrNull(value, msg) {
        if (value !== null && isNaN(Date.parse(value))) {
            this.throwError(msg, "Invalid date format.");
        }
    }

}

module.exports = Validation;
