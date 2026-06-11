const StudentStatusHistory = require('../../models/student_management/studentStatusHistory');
const Student = require('../../models/auth/user');
const Validation = require('../../validations');

// Create a new student status history record

const createStudentStatusHistory = async (req, res, next) => {
    try {
        const { student_id, status, reason, changed_by, valid_from, valid_until } = req.body;

        // Validate inputs
        Validation.isInteger(student_id, "Student ID must be a valid integer.");
        Validation.isNonEmptyString(status, "Status must be a non-empty string.");
        if (reason) {
            Validation.isNonEmptyString(reason, "Reason must be a non-empty string.");
        }
        Validation.isInteger(changed_by, "Changed by must be a valid integer.");
        Validation.isDate(valid_from, "Valid from must be a valid date.");
        Validation.isDateOrNull(valid_until, "Valid until must be a valid date or null.");

        // Fetch the student by ID
        const student = await Student.findByPk(student_id);

        if (!student) {
            return res.status(404).json({ error: 'Student not found.' });
        }

        // Create the status history entry
        const newStatusHistory = await StudentStatusHistory.create({
            student_id,
            status,
            reason,
            changed_by,
            valid_from,
            valid_until,
        });

        res.status(201).json(newStatusHistory);
    } catch (error) {
        next(error);
    }
};

// Get all student status history records
const getAllStudentStatusHistories = async (req, res, next) => {
    try {
        const statusHistories = await StudentStatusHistory.findAll();
        res.status(200).json(statusHistories);
    } catch (error) {
        next(error);
    }
};

// Get a student status history record by ID
const getStudentStatusHistoryById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const statusHistory = await StudentStatusHistory.findByPk(id);
        if (!statusHistory) {
            return res.status(404).json({ error: 'Student status history not found' });
        }
        res.status(200).json(statusHistory);
    } catch (error) {
        next(error);
    }
};

// Update a student status history record
const updateStudentStatusHistory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, reason, valid_until } = req.body;

        // Validate inputs if they are provided
        if (status) {
            Validation.isNonEmptyString(status, "Status must be a non-empty string.");
        }
        if (reason) {
            Validation.isNonEmptyString(reason, "Reason must be a non-empty string.");
        }
        if (valid_until) {
            Validation.isDateOrNull(valid_until, "Valid until must be a valid date or null.");
        }

        const statusHistory = await StudentStatusHistory.findByPk(id);
        if (!statusHistory) {
            return res.status(404).json({ error: 'Student status history not found' });
        }
        statusHistory.status = status || statusHistory.status;
        statusHistory.reason = reason || statusHistory.reason;
        statusHistory.valid_until = valid_until || statusHistory.valid_until;
        await statusHistory.save();
        res.status(200).json(statusHistory);
    } catch (error) {
        next(error);
    }
};

// Delete a student status history record
const deleteStudentStatusHistory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const statusHistory = await StudentStatusHistory.findByPk(id);
        if (!statusHistory) {
            return res.status(404).json({ error: 'Student status history not found' });
        }
        await statusHistory.destroy();
        res.status(204).json({ message: 'Student status history deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createStudentStatusHistory,
    getAllStudentStatusHistories,
    getStudentStatusHistoryById,
    updateStudentStatusHistory,
    deleteStudentStatusHistory,
};