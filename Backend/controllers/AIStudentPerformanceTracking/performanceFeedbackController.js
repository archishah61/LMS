const { callProcedure } = require('../../utils/procedure/callProcedure');
const Validation = require('../../validations');

// get all feedback for a user
exports.getUserFeedback = async (req, res, next) => {
    try {
        const { userId } = req.params;

        /* ---------- VALIDATION ---------- */
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        
        Validation.isInteger(userId, "User ID must be a valid integer.");
        
        const { success, data, error } = await callProcedure('getUserFeedback', [userId]);

        if (!success) {
            return next(error);
        }
        
        return res.status(200).json({
            message: 'Feedback retrieved successfully',
            count: data.length,
            data: data
        });
    } catch (error) {
        next(error);
    }
};

// get specific feedback by ID
exports.getFeedbackById = async (req, res, next) => {
    try {
        const { feedbackId } = req.params;
        
        /* ---------- VALIDATION ---------- */
        if (!feedbackId) {
            return res.status(400).json({ message: 'Feedback ID is required' });
        }
        
        Validation.isInteger(feedbackId, "Feedback ID must be a valid integer.");
        
        const { success, data, error } = await callProcedure('getFeedbackById', [feedbackId]);

        
        if (!success) {
            return next(error);
        }
        
        if (data.length === 0) {
            return res.status(404).json({ message: 'Feedback not found' });
        }
        
        return res.status(200).json({
            message: 'Feedback retrieved successfully',
            data: data[0]
        });
    } catch (error) {
        next(error);
    }
};

// get feedback history for a specific module
exports.getModuleFeedbackHistory = async (req, res, next) => {
    try {
        const { userId, moduleId } = req.params;

        /* ---------- VALIDATION ---------- */
        if (!userId || !moduleId) {
            return res.status(400).json({ message: 'User ID and Module ID are required' });
        }
        
        Validation.isInteger(userId, "User ID must be a valid integer.");
        Validation.isInteger(moduleId, "Module ID must be a valid integer.");
        
        const { success, data, error } = await callProcedure('getModuleFeedbackHistory', [
            userId,
            moduleId
        ]);
        
        if (!success) {
            return next(error);
        }
        
        return res.status(200).json({
            message: 'Feedback history retrieved successfully',
            count: data.length,
            data: data
        });
    } catch (error) {
        next(error);
    }
};

// Delete feedback (soft delete)
exports.deleteFeedback = async (req, res, next) => {
    try {
        const { feedbackId } = req.params;
        const userId = req.user?.id; // From authentication middleware

        /* ---------- VALIDATION ---------- */
        if (!feedbackId) {
            return res.status(400).json({ message: 'Feedback ID is required' });
        }
        
        Validation.isInteger(feedbackId, "Feedback ID must be a valid integer.");
        Validation.isInteger(userId, "User ID must be a valid integer.");
        
        const { success, data, error } = await callProcedure('DeleteFeedback', [
            feedbackId,
            userId
        ]);
        
        if (!success) {
            return next(error);
        }
        
        return res.status(200).json({
            message: 'Feedback deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
