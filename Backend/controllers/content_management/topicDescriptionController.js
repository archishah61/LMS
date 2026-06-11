const { Op } = require('sequelize');
const { TopicDescription } = require('../../models/content_management/quiz-questions-types/topicDescription');

// Create a new Topic Description
exports.createTopicDescription = async (req, res, next) => {
    try {
        const { quiz_id, passage, time_limit, created_by } = req.body;

        // Input validation
        if (!quiz_id || !passage || !time_limit || !created_by) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const topic = await TopicDescription.create({
            quiz_id,
            passage,
            time_limit,
            created_by,
            updated_by: created_by,
        });

        res.status(201).json({ message: 'Topic Description created successfully', data: topic });
    } catch (error) {
        next(error);
    }
};

// Get all Topic Descriptions with optional filtering and pagination
exports.getAllTopicDescriptions = async (req, res, next) => {
    try {
        const { quiz_id, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = quiz_id ? { quiz_id } : {};

        const { count, rows } = await TopicDescription.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            data: rows,
        });
    } catch (error) {
        next(error);
    }
};

// Get a single Topic Description by ID
exports.getTopicDescriptionById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const topic = await TopicDescription.findByPk(id);

        if (!topic) {
            return res.status(404).json({ error: 'Topic Description not found' });
        }

        res.status(200).json({ data: topic });
    } catch (error) {
        next(error);
    }
};

// Update a Topic Description
exports.updateTopicDescription = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { quiz_id, passage, time_limit, updated_by } = req.body;

        // Input validation
        if (!quiz_id || !passage || !time_limit || !updated_by) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const topic = await TopicDescription.findByPk(id);

        if (!topic) {
            return res.status(404).json({ error: 'Topic Description not found' });
        }

        await topic.update({
            quiz_id,
            passage,
            time_limit,
            updated_by,
        });

        res.status(200).json({ message: 'Topic Description updated successfully', data: topic });
    } catch (error) {
        next(error);
    }
};

// Delete a Topic Description
exports.deleteTopicDescription = async (req, res, next) => {
    try {
        const { id } = req.params;
        const topic = await TopicDescription.findByPk(id);

        if (!topic) {
            return res.status(404).json({ error: 'Topic Description not found' });
        }

        await topic.destroy();
        res.status(200).json({ message: 'Topic Description deleted successfully' });
    } catch (error) {
        next(error);
    }
};
