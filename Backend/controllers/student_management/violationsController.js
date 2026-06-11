const Violation = require('../../models/student_management/violations');
const Student = require('../../models/auth/user');

// Create a new violation
const createViolation = async (req, res, next) => {
    try {
        const { student_id, violation_type, description, reported_by, status } = req.body;

        // Fetch the student by ID
        const student = await Student.findByPk(student_id);

        if (!student) {
            return res.status(404).json({ error: 'Student not found.' });
        }
        const newViolation = await Violation.create({
            student_id,
            violation_type,
            description,
            reported_by,
            status,
        });
        res.status(201).json(newViolation);
    } catch (error) {
        next(error);
    }
};

// Get all violations
const getAllViolations = async (req, res, next) => {
    try {
        const violations = await Violation.findAll();
        res.status(200).json(violations);
    } catch (error) {
        next(error);
    }
};

// Get a violation by ID
const getViolationById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const violation = await Violation.findByPk(id);
        if (!violation) {
            return res.status(404).json({ error: 'Violation not found' });
        }
        res.status(200).json(violation);
    } catch (error) {
        next(error);
    }
};

// Update a violation
const updateViolation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { violation_type, description, status } = req.body;
        const violation = await Violation.findByPk(id);
        if (!violation) {
            return res.status(404).json({ error: 'Violation not found' });
        }
        violation.violation_type = violation_type || violation.violation_type;
        violation.description = description || violation.description;
        violation.status = status || violation.status;
        await violation.save();
        res.status(200).json(violation);
    } catch (error) {
        next(error);
    }
};

// Delete a violation
const deleteViolation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const violation = await Violation.findByPk(id);
        if (!violation) {
            return res.status(404).json({ error: 'Violation not found' });
        }
        await violation.destroy();
        res.status(204).json({ message: 'Violation deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createViolation,
    getAllViolations,
    getViolationById,
    updateViolation,
    deleteViolation,
};