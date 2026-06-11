const CourseFAQ = require("../../models/course_management/courseFAQs");
const Course = require("../../models/course_management/course");
const Validation = require("../../validations");
const { callProcedure } = require("../../utils/procedure/callProcedure");

// Example roles - customize as per your system
const allowedRoles = ["admin", "partner"];

// Create Course FAQs using Procedures
exports.createFAQ = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const { course_id, question } = req.body;

        // ✅ Validations
        Validation.isInteger(userId, "User ID must be a valid integer.");
        Validation.isEnum(role, allowedRoles, "User role is invalid.");
        Validation.isString(course_id, "Course ID must be a valid integer.");
        Validation.isString(question, { min: 5, max: 500 }, "Question must be between 5 to 500 characters.");

        const { success, data, error } = await callProcedure("createCourseFAQ", [
            course_id,
            question,
            userId,
            role,
            userId,
            role,
        ]);

        if (!success) {
            return next(error);
        }

        res.status(201).json({ message: "FAQ created successfully", faq: data });
    } catch (error) {
        next(error);
    }
};

// Get All Course FAQs with Procedures
exports.getAllFAQs = async (req, res, next) => {
    try {
        const { success, data, error } = await callProcedure("getAllCourseFAQs", []);

        if (!success) {
            return next(error);
        }

        const transformedData = data.map(item => ({
            id: item.id,
            course_id: item.course_id,
            question: item.question,
            created_by: item.created_by,
            created_by_type: item.created_by_type,
            updated_by: item.updated_by,
            updated_by_type: item.updated_by_type,
            created_at: item.created_at,
            updated_at: item.updated_at,
            course: {
                id: item.course_id,
                public_hash: item.public_hash,
                sequence: item.sequence,
                title: item.course_title,
                description: item.description,
                category_id: item.category_id,
                thumbnail: item.thumbnail,
                preview_video: item.preview_video,
                price: item.price,
                discount: item.discount,
                duration_hours: item.duration_minutes,
                expiry_days: item.expiry_days,
                what_you_will_learn: Array.isArray(item.what_you_will_learn) ? item.what_you_will_learn : (item.what_you_will_learn ? item.what_you_will_learn.split(',') : []),
                prerequisites: Array.isArray(item.prerequisites) ? item.prerequisites : (item.prerequisites ? item.prerequisites.split(',') : []),
                hashtags: Array.isArray(item.hashtags) ? item.hashtags : (item.hashtags ? item.hashtags.split(',') : []),
                embedding: Array.isArray(item.embedding) ? item.embedding : (item.embedding ? item.embedding.split(',') : []),
                status: item.status,
                min_access_hours: item.min_access_hours,
                max_access_hours: item.max_access_hours,
                created_by: item.course_created_by,
                created_by_type: item.course_created_by_type,
                updated_by: item.course_updated_by,
                updated_by_type: item.course_updated_by_type,
                created_at: item.course_createdAt,
                updated_at: item.course_updatedAt
            }
        }));

        res.status(200).json(transformedData);
    } catch (error) {
        next(error);
    }
};

// Get FAQs for a specific course using Procedures
exports.getFAQsByCourseId = async (req, res, next) => {
    try {
        const { course_id } = req.params;

        const { role } = req.user;
        // ✅ Validation
        Validation.isString(course_id, "Course ID must be a valid integer.");

        const { success, data, error } = await callProcedure("getCourseFAQsByCourseId", [course_id, role === "student" || false]);

        if (!success) {
            return next(error);
        }

        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

// Update Course FAQ using Procedures
exports.updateFAQ = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const role = req.user.role;
        const { question, is_active } = req.body;

        // ✅ Validations
        Validation.isInteger(id, "FAQ ID must be a valid integer.");
        Validation.isInteger(userId, "User ID must be a valid integer.");
        Validation.isEnum(role, allowedRoles, "User role is invalid.");
        Validation.isString(question, { min: 5, max: 500 }, "Question must be between 5 to 500 characters.");

        const { success, data, error } = await callProcedure("updateCourseFAQ", [
            id,
            question,
            is_active || false,
            userId,
            role
        ]);

        if (!success) {
            return next(error);
        }

        res.status(200).json({ message: "FAQ updated successfully", faq: data });
    } catch (error) {
        next(error);
    }
};

// Delete Course FAQ using Procedures
exports.deleteFAQ = async (req, res, next) => {
    try {
        const { id } = req.params;

        // ✅ Validation
        Validation.isInteger(id, "FAQ ID must be a valid integer.");

        const { success, data, error } = await callProcedure("deleteCourseFAQ", [id]);

        if (!success) {
            return next(error);
        }

        res.status(200).json({ message: "FAQ deleted successfully", deletedFAQ: data });
    } catch (error) {
        next(error);
    }
};
