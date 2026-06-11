const { enrollments } = require('../../../models/enrollment_management/enrollment_management');
const User = require('../../../models/auth/user');
const Course = require('../../../models/course_management/course');
const PerformanceFeedback = require('../../../models/aiStudentPerformanceTracking/performanceFeedback');
const { Op } = require('sequelize');
const Module = require('../../../models/course_management/module');
const Topic = require('../../../models/course_management/topic');

/**
 * Get course enrollment analytics with student details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @route GET /api/analytics/course-performance/:courseId
 */
const getCourseEnrollmentAnalytics = async (req, res) => {
    try {
        const { courseId } = req.params;


        // Validate courseId
        if (!courseId || isNaN(courseId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid course ID is required'
            });
        }

        // Check if course exists
        const courseExists = await Course.findByPk(courseId);
        if (!courseExists) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Get all enrollments for the course with user details
        const enrollmentData = await enrollments.findAll({
            where: {
                course_id: courseId
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'full_name', 'email', 'username']
                },
                {
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'title', 'description']
                }
            ],
            attributes: [
                'id',
                'user_id',
                'course_id',
                'enrollment_date',
                'expiry_date',
                'is_completed',
                'completed_at',
                'total_time_spent',
                'completion_percentage',
                'status'
            ],
            order: [['enrollment_date', 'DESC']]
        });

        // Calculate summary statistics
        const totalEnrollments = enrollmentData.length;
        const completedEnrollments = enrollmentData.filter(enrollment => enrollment.is_completed).length;
        const activeEnrollments = enrollmentData.filter(enrollment => enrollment.status === 'active').length;
        const averageCompletionPercentage = totalEnrollments > 0
            ? Math.round(enrollmentData.reduce((sum, enrollment) => sum + enrollment.completion_percentage, 0) / totalEnrollments)
            : 0;

        // Format the response data
        const formattedEnrollments = enrollmentData.map(enrollment => ({
            enrollment_id: enrollment.id,
            student: {
                id: enrollment.user.id,
                name: enrollment.user.full_name,
                email: enrollment.user.email,
                username: enrollment.user.username
            },
            course: {
                id: enrollment.course.id,
                title: enrollment.course.title
            },
            enrollment_date: enrollment.enrollment_date,
            expiry_date: enrollment.expiry_date,
            completion_percentage: enrollment.completion_percentage,
            total_time_spent: enrollment.total_time_spent, // in minutes
            status: enrollment.status,
            is_completed: enrollment.is_completed,
            completed_at: enrollment.completed_at,
            course_status: enrollment.is_completed ? 'Completed' : 'In Progress'
        }));

        // Prepare response
        const response = {
            success: true,
            message: 'Course enrollment analytics retrieved successfully',
            data: {
                course_info: {
                    id: courseExists.id,
                    title: courseExists.title,
                    description: courseExists.description
                },
                summary: {
                    total_enrollments: totalEnrollments,
                    completed_enrollments: completedEnrollments,
                    active_enrollments: activeEnrollments,
                    average_completion_percentage: averageCompletionPercentage,
                    completion_rate: totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0
                },
                enrollments: formattedEnrollments
            }
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Error in getCourseEnrollmentAnalytics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching course enrollment analytics',
            error: error.message
        });
    }
};

/**
 * Get course enrollment analytics with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @route GET /api/analytics/course-performance/:courseId/paginated
 */
const getCourseEnrollmentAnalyticsPaginated = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { page = 1, limit = 10, status, search } = req.query;

        // Validate courseId
        if (!courseId || isNaN(courseId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid course ID is required'
            });
        }

        // Validate pagination parameters
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);

        if (pageNumber < 1 || limitNumber < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pagination parameters'
            });
        }

        // Check if course exists
        const courseExists = await Course.findByPk(courseId);
        if (!courseExists) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Build where clause
        const whereClause = {
            course_id: courseId
        };

        if (status && ['active', 'completed'].includes(status)) {
            whereClause.status = status;
        }

        // Build search condition
        let searchCondition = {};
        if (search) {
            searchCondition = {
                [require('sequelize').Op.or]: [
                    { '$user.full_name$': { [require('sequelize').Op.like]: `%${search}%` } },
                    { '$user.email$': { [require('sequelize').Op.like]: `%${search}%` } },
                    { '$user.username$': { [require('sequelize').Op.like]: `%${search}%` } }
                ]
            };
        }

        // Get total count
        const totalCount = await enrollments.count({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: [],
                    where: searchCondition
                }
            ]
        });

        // Calculate pagination
        const offset = (pageNumber - 1) * limitNumber;
        const totalPages = Math.ceil(totalCount / limitNumber);

        // Get paginated enrollments
        const enrollmentData = await enrollments.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'full_name', 'email', 'username'],
                    where: searchCondition
                },
                {
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'title', 'description']
                }
            ],
            attributes: [
                'id',
                'user_id',
                'course_id',
                'enrollment_date',
                'expiry_date',
                'is_completed',
                'completed_at',
                'total_time_spent',
                'completion_percentage',
                'status'
            ],
            order: [['enrollment_date', 'DESC']],
            limit: limitNumber,
            offset: offset
        });

        // Format the response data
        const formattedEnrollments = enrollmentData.map(enrollment => ({
            enrollment_id: enrollment.id,
            student: {
                id: enrollment.user.id,
                name: enrollment.user.full_name,
                email: enrollment.user.email,
                username: enrollment.user.username
            },
            course: {
                id: enrollment.course.id,
                title: enrollment.course.title
            },
            enrollment_date: enrollment.enrollment_date,
            expiry_date: enrollment.expiry_date,
            completion_percentage: enrollment.completion_percentage,
            total_time_spent: enrollment.total_time_spent,
            status: enrollment.status,
            is_completed: enrollment.is_completed,
            completed_at: enrollment.completed_at,
            course_status: enrollment.is_completed ? 'Completed' : 'In Progress'
        }));

        // Prepare response
        const response = {
            success: true,
            message: 'Course enrollment analytics retrieved successfully',
            data: {
                course_info: {
                    id: courseExists.id,
                    title: courseExists.title,
                    description: courseExists.description
                },
                pagination: {
                    current_page: pageNumber,
                    total_pages: totalPages,
                    total_records: totalCount,
                    records_per_page: limitNumber,
                    has_next_page: pageNumber < totalPages,
                    has_prev_page: pageNumber > 1
                },
                enrollments: formattedEnrollments
            }
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Error in getCourseEnrollmentAnalyticsPaginated:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching course enrollment analytics',
            error: error.message
        });
    }
};

/**
 * Get average module score, skill, and time spent for a course
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @route GET /api/analytics/course-performance/:courseId/module-analytics
 */
const getCourseModuleAnalytics = async (req, res) => {
    try {
        const { courseId } = req.params;
        if (!courseId || isNaN(courseId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid course ID is required'
            });
        }

        // Get all modules for the course
        const modules = await Module.findAll({
            where: { course_id: courseId },
            attributes: ['id'],
            raw: true
        });
        if (!modules.length) {
            return res.status(404).json({
                success: false,
                message: 'No modules found for this course.'
            });
        }
        const moduleIds = modules.map(m => m.id);

        // Get all current feedbacks for these modules (all students)
        const feedbacks = await PerformanceFeedback.findAll({
            where: {
                course_id: courseId,
                module_id: { [Op.in]: moduleIds },
                is_current: true,
                status: 'active'
            },
            attributes: ['module_id', 'feedback_data'],
            raw: true
        });
        if (!feedbacks.length) {
            return res.status(404).json({
                success: false,
                message: 'No module analytics found for this course.'
            });
        }

        // Group feedbacks by module
        const moduleFeedbackMap = {};
        feedbacks.forEach(fb => {
            if (!moduleFeedbackMap[fb.module_id]) moduleFeedbackMap[fb.module_id] = [];
            moduleFeedbackMap[fb.module_id].push(fb.feedback_data);
        });

        // For each module, calculate average score, most common skill, average time spent
        let courseTotalScore = 0, courseTotalTime = 0, courseFeedbackCount = 0;
        const skillCounts = { 'Beginner': 0, 'Intermediate': 0, 'Advanced': 0 };
        let moduleAverages = [];
        for (const [moduleId, feedbackArr] of Object.entries(moduleFeedbackMap)) {
            let totalScore = 0, totalTime = 0, count = 0;
            const moduleSkillCounts = { 'Beginner': 0, 'Intermediate': 0, 'Advanced': 0 };
            feedbackArr.forEach(data => {
                if (typeof data === 'string') data = JSON.parse(data);
                if (data.module_score !== undefined) {
                    totalScore += data.module_score;
                    courseTotalScore += data.module_score;
                    count++;
                    courseFeedbackCount++;
                }
                if (data.module_skill) {
                    moduleSkillCounts[data.module_skill] = (moduleSkillCounts[data.module_skill] || 0) + 1;
                    skillCounts[data.module_skill] = (skillCounts[data.module_skill] || 0) + 1;
                }
                if (data.topics && Array.isArray(data.topics)) {
                    const topicTimes = data.topics.map(t => t.topic_time_spent || 0);
                    if (topicTimes.length) {
                        const avgTopicTime = topicTimes.reduce((a, b) => a + b, 0) / topicTimes.length;
                        totalTime += avgTopicTime;
                        courseTotalTime += avgTopicTime;
                    }
                }
            });
            const avgScore = count ? Math.round(totalScore / count) : 0;
            const avgTime = count ? Math.round(totalTime / count ) : 0; // in minutes
            const mostCommonSkill = Object.entries(moduleSkillCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
            moduleAverages.push({ module_id: moduleId, avgScore, avgTime, mostCommonSkill, count });
        }
        // Course-level averages
        const averageScore = courseFeedbackCount ? Math.round(courseTotalScore / courseFeedbackCount) : 0;
        const averageTimeSpent = courseFeedbackCount ? Math.round(courseTotalTime / courseFeedbackCount ) : 0; // in minutes
        const mostCommonSkill = Object.entries(skillCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

        res.status(200).json({
            success: true,
            message: 'Course module analytics retrieved successfully',
            data: {
                average_module_score: averageScore,
                average_module_skill: mostCommonSkill,
                average_time_spent_on_module: averageTimeSpent, // in minutes
                module_count: moduleAverages.length,
                module_analytics: moduleAverages
            }
        });
    } catch (error) {
        console.error('Error in getCourseModuleAnalytics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching course module analytics',
            error: error.message
        });
    }
};

/**
 * Get most weak and most strong topics for a course by aggregating topic scores across all students
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @route GET /api/analytics/course-performance/:courseId/topic-strength
 */
const getCourseTopicStrengthAnalytics = async (req, res) => {
    try {
        const { courseId } = req.params;
        if (!courseId || isNaN(courseId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid course ID is required'
            });
        }

        // Get all modules for the course
        const modules = await Module.findAll({
            where: { course_id: courseId },
            attributes: ['id'],
            raw: true
        });
        if (!modules.length) {
            return res.status(404).json({
                success: false,
                message: 'No modules found for this course.'
            });
        }
        const moduleIds = modules.map(m => m.id);

        // Get all current feedbacks for these modules (all students)
        const feedbacks = await PerformanceFeedback.findAll({
            where: {
                course_id: courseId,
                module_id: { [Op.in]: moduleIds },
                is_current: true,
                status: 'active'
            },
            attributes: ['feedback_data'],
            raw: true
        });
        if (!feedbacks.length) {
            return res.status(404).json({
                success: false,
                message: 'No topic analytics found for this course.'
            });
        }

        // Aggregate topic scores
        const topicScores = {};
        feedbacks.forEach(fb => {
            let data = fb.feedback_data;
            if (typeof data === 'string') data = JSON.parse(data);
            if (data.topics && Array.isArray(data.topics)) {
                data.topics.forEach(topic => {
                    if (topic.topic_score !== undefined && topic.id !== undefined) {
                        if (!topicScores[topic.id]) topicScores[topic.id] = { total: 0, count: 0 };
                        topicScores[topic.id].total += topic.topic_score;
                        topicScores[topic.id].count += 1;
                    }
                });
            }
        });

        // Calculate average score for each topic
        const topicAverages = Object.entries(topicScores).map(([topicId, { total, count }]) => ({
            topic_id: Number(topicId),
            average_score: count ? Math.round(total / count) : 0
        }));
        if (!topicAverages.length) {
            return res.status(404).json({
                success: false,
                message: 'No topic scores found for this course.'
            });
        }

        // Get topic titles
        const topicIds = topicAverages.map(t => t.topic_id);
        const topics = await Topic.findAll({
            where: { id: { [Op.in]: topicIds } },
            attributes: ['id', 'title'],
            raw: true
        });
        const topicTitleMap = {};
        topics.forEach(t => { topicTitleMap[t.id] = t.title; });

        // Attach titles
        topicAverages.forEach(t => { t.title = topicTitleMap[t.topic_id] || null; });

        // Sort by average_score
        const sorted = topicAverages.sort((a, b) => a.average_score - b.average_score);
        const most_weak_topics = sorted.slice(0, 5);
        const most_strong_topics = sorted.slice(-5).reverse();

        res.status(200).json({
            success: true,
            data: {
                most_weak_topics,
                most_strong_topics
            }
        });
    } catch (error) {
        console.error('Error in getCourseTopicStrengthAnalytics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching course topic strength analytics',
            error: error.message
        });
    }
};

/**
 * Get average of error_analysis for all enrolled students in a course
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @route GET /api/analytics/course-performance/:courseId/error-analytics-avg
 */
const getCourseErrorAnalyticsAverage = async (req, res) => {
    try {
        const { courseId } = req.params;
        if (!courseId || isNaN(courseId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid course ID is required'
            });
        }

        // Get all modules for the course
        const modules = await Module.findAll({
            where: { course_id: courseId },
            attributes: ['id'],
            raw: true
        });
        if (!modules.length) {
            return res.status(404).json({
                success: false,
                message: 'No modules found for this course.'
            });
        }
        const moduleIds = modules.map(m => m.id);

        // Get all current feedbacks for these modules (all students)
        const feedbacks = await PerformanceFeedback.findAll({
            where: {
                course_id: courseId,
                module_id: { [Op.in]: moduleIds },
                is_current: true,
                status: 'active'
            },
            attributes: ['feedback_data'],
            raw: true
        });
        if (!feedbacks.length) {
            return res.status(404).json({
                success: false,
                message: 'No error analytics found for this course.'
            });
        }

        // Aggregate error_analysis
        const errorTotals = {};
        let errorCount = 0;
        feedbacks.forEach(fb => {
            let data = fb.feedback_data;
            if (typeof data === 'string') data = JSON.parse(data);
            if (data.error_analysis && typeof data.error_analysis === 'object') {
                Object.entries(data.error_analysis).forEach(([key, value]) => {
                    if (!errorTotals[key]) errorTotals[key] = 0;
                    errorTotals[key] += Number(value) || 0;
                });
                errorCount++;
            }
        });
        if (!errorCount || Object.keys(errorTotals).length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No error analytics data found for this course.'
            });
        }
        // Calculate averages
        const errorAverages = {};
        Object.entries(errorTotals).forEach(([key, total]) => {
            errorAverages[key] = +(total / errorCount).toFixed(2);
        });

        res.status(200).json({
            success: true,
            data: errorAverages
        });
    } catch (error) {
        console.error('Error in getCourseErrorAnalyticsAverage:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching course error analytics average',
            error: error.message
        });
    }
};

/**
 * Get module analytics for all courses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @route GET /api/analytics/course-performance/all/module-analytics
 */
const getAllCoursesModuleAnalytics = async (req, res) => {
    try {
        // Get all courses
        const courses = await Course.findAll({
            attributes: ['id', 'title', 'description'],
            raw: true
        });
        if (!courses.length) {
            return res.status(404).json({
                success: false,
                message: 'No courses found.'
            });
        }
        // Get all modules for all courses
        const allModules = await Module.findAll({
            attributes: ['id', 'course_id'],
            raw: true
        });
        const modulesByCourse = {};
        allModules.forEach(m => {
            if (!modulesByCourse[m.course_id]) modulesByCourse[m.course_id] = [];
            modulesByCourse[m.course_id].push(m.id);
        });
        // Get all feedbacks for all modules
        const allModuleIds = allModules.map(m => m.id);
        const feedbacks = await PerformanceFeedback.findAll({
            where: {
                module_id: { [Op.in]: allModuleIds },
                is_current: true,
                status: 'active'
            },
            attributes: ['course_id', 'module_id', 'feedback_data'],
            raw: true
        });
        // Group feedbacks by course
        const feedbacksByCourse = {};
        feedbacks.forEach(fb => {
            if (!feedbacksByCourse[fb.course_id]) feedbacksByCourse[fb.course_id] = [];
            feedbacksByCourse[fb.course_id].push(fb);
        });
        // For each course, calculate analytics
        const results = courses.map(course => {
            const moduleIds = modulesByCourse[course.id] || [];
            const courseFeedbacks = (feedbacksByCourse[course.id] || []);
            // Group feedbacks by module
            const moduleFeedbackMap = {};
            courseFeedbacks.forEach(fb => {
                if (!moduleFeedbackMap[fb.module_id]) moduleFeedbackMap[fb.module_id] = [];
                moduleFeedbackMap[fb.module_id].push(fb.feedback_data);
            });
            // For each module, calculate average score, most common skill, average time spent
            let courseTotalScore = 0, courseTotalTime = 0, courseFeedbackCount = 0;
            const skillCounts = { 'Beginner': 0, 'Intermediate': 0, 'Advanced': 0 };
            let moduleAverages = [];
            for (const [moduleId, feedbackArr] of Object.entries(moduleFeedbackMap)) {
                let totalScore = 0, totalTime = 0, count = 0;
                const moduleSkillCounts = { 'Beginner': 0, 'Intermediate': 0, 'Advanced': 0 };
                feedbackArr.forEach(data => {
                    if (typeof data === 'string') data = JSON.parse(data);
                    if (data.module_score !== undefined) {
                        totalScore += data.module_score;
                        courseTotalScore += data.module_score;
                        count++;
                        courseFeedbackCount++;
                    }
                    if (data.module_skill) {
                        moduleSkillCounts[data.module_skill] = (moduleSkillCounts[data.module_skill] || 0) + 1;
                        skillCounts[data.module_skill] = (skillCounts[data.module_skill] || 0) + 1;
                    }
                    if (data.topics && Array.isArray(data.topics)) {
                        const topicTimes = data.topics.map(t => t.topic_time_spent || 0);
                        if (topicTimes.length) {
                            const avgTopicTime = topicTimes.reduce((a, b) => a + b, 0) / topicTimes.length;
                            totalTime += avgTopicTime;
                            courseTotalTime += avgTopicTime;
                        }
                    }
                });
                const avgScore = count ? Math.round(totalScore / count) : 0;
                const avgTime = count ? Math.round(totalTime / count / 60) : 0; // in minutes
                const mostCommonSkill = Object.entries(moduleSkillCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
                moduleAverages.push({ module_id: moduleId, avgScore, avgTime, mostCommonSkill, count });
            }
            // Course-level averages
            const averageScore = courseFeedbackCount ? Math.round(courseTotalScore / courseFeedbackCount) : 0;
            const averageTimeSpent = courseFeedbackCount ? Math.round(courseTotalTime / courseFeedbackCount / 60) : 0; // in minutes
            const mostCommonSkill = Object.entries(skillCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
            return {
                course_id: course.id,
                title: course.title,
                description: course.description,
                average_module_score: averageScore,
                average_module_skill: mostCommonSkill,
                average_time_spent_on_module: averageTimeSpent,
                module_count: moduleAverages.length,
                module_analytics: moduleAverages
            };
        });
        res.status(200).json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Error in getAllCoursesModuleAnalytics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching all courses module analytics',
            error: error.message
        });
    }
};

/**
 * Get topic strength analytics (top 5 weak/strong topics) for all courses
 * @route GET /api/analytics/course-performance/all/topic-strength
 */
const getAllCoursesTopicStrengthAnalytics = async (req, res) => {
    try {
        const courses = await Course.findAll({ attributes: ['id', 'title', 'description'], raw: true });
        if (!courses.length) {
            return res.status(404).json({ success: false, message: 'No courses found.' });
        }
        const allModules = await Module.findAll({ attributes: ['id', 'course_id'], raw: true });
        const modulesByCourse = {};
        allModules.forEach(m => {
            if (!modulesByCourse[m.course_id]) modulesByCourse[m.course_id] = [];
            modulesByCourse[m.course_id].push(m.id);
        });
        const allModuleIds = allModules.map(m => m.id);
        const feedbacks = await PerformanceFeedback.findAll({
            where: { module_id: { [Op.in]: allModuleIds }, is_current: true, status: 'active' },
            attributes: ['course_id', 'feedback_data'],
            raw: true
        });
        // Group feedbacks by course
        const feedbacksByCourse = {};
        feedbacks.forEach(fb => {
            if (!feedbacksByCourse[fb.course_id]) feedbacksByCourse[fb.course_id] = [];
            feedbacksByCourse[fb.course_id].push(fb);
        });
        // Get all topic titles
        const allTopicIds = new Set();
        feedbacks.forEach(fb => {
            let data = fb.feedback_data;
            if (typeof data === 'string') data = JSON.parse(data);
            if (data.topics && Array.isArray(data.topics)) {
                data.topics.forEach(topic => {
                    if (topic.id !== undefined) allTopicIds.add(topic.id);
                });
            }
        });
        const topics = await Topic.findAll({ where: { id: { [Op.in]: Array.from(allTopicIds) } }, attributes: ['id', 'title'], raw: true });
        const topicTitleMap = {};
        topics.forEach(t => { topicTitleMap[t.id] = t.title; });
        // For each course, calculate topic strength
        const results = courses.map(course => {
            const courseFeedbacks = feedbacksByCourse[course.id] || [];
            const topicScores = {};
            courseFeedbacks.forEach(fb => {
                let data = fb.feedback_data;
                if (typeof data === 'string') data = JSON.parse(data);
                if (data.topics && Array.isArray(data.topics)) {
                    data.topics.forEach(topic => {
                        if (topic.topic_score !== undefined && topic.id !== undefined) {
                            if (!topicScores[topic.id]) topicScores[topic.id] = { total: 0, count: 0 };
                            topicScores[topic.id].total += topic.topic_score;
                            topicScores[topic.id].count += 1;
                        }
                    });
                }
            });
            const topicAverages = Object.entries(topicScores).map(([topicId, { total, count }]) => ({
                topic_id: Number(topicId),
                average_score: count ? Math.round(total / count) : 0,
                title: topicTitleMap[topicId] || null
            }));
            const sorted = topicAverages.sort((a, b) => a.average_score - b.average_score);
            const most_weak_topics = sorted.slice(0, 5);
            const most_strong_topics = sorted.slice(-5).reverse();
            return {
                course_id: course.id,
                title: course.title,
                description: course.description,
                most_weak_topics,
                most_strong_topics
            };
        });
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error('Error in getAllCoursesTopicStrengthAnalytics:', error);
        res.status(500).json({ success: false, message: 'Internal server error while fetching all courses topic strength analytics', error: error.message });
    }
};

/**
 * Get error analytics averages for all courses
 * @route GET /api/analytics/course-performance/all/error-analytics-avg
 */
const getAllCoursesErrorAnalyticsAverage = async (req, res) => {
    try {
        const courses = await Course.findAll({ attributes: ['id', 'title', 'description'], raw: true });
        if (!courses.length) {
            return res.status(404).json({ success: false, message: 'No courses found.' });
        }
        const allModules = await Module.findAll({ attributes: ['id', 'course_id'], raw: true });
        const modulesByCourse = {};
        allModules.forEach(m => {
            if (!modulesByCourse[m.course_id]) modulesByCourse[m.course_id] = [];
            modulesByCourse[m.course_id].push(m.id);
        });
        const allModuleIds = allModules.map(m => m.id);
        const feedbacks = await PerformanceFeedback.findAll({
            where: { module_id: { [Op.in]: allModuleIds }, is_current: true, status: 'active' },
            attributes: ['course_id', 'feedback_data'],
            raw: true
        });
        // Group feedbacks by course
        const feedbacksByCourse = {};
        feedbacks.forEach(fb => {
            if (!feedbacksByCourse[fb.course_id]) feedbacksByCourse[fb.course_id] = [];
            feedbacksByCourse[fb.course_id].push(fb);
        });
        // For each course, calculate error analytics averages
        const results = courses.map(course => {
            const courseFeedbacks = feedbacksByCourse[course.id] || [];
            const errorTotals = {};
            let errorCount = 0;
            courseFeedbacks.forEach(fb => {
                let data = fb.feedback_data;
                if (typeof data === 'string') data = JSON.parse(data);
                if (data.error_analysis && typeof data.error_analysis === 'object') {
                    Object.entries(data.error_analysis).forEach(([key, value]) => {
                        if (!errorTotals[key]) errorTotals[key] = 0;
                        errorTotals[key] += Number(value) || 0;
                    });
                    errorCount++;
                }
            });
            const errorAverages = {};
            Object.entries(errorTotals).forEach(([key, total]) => {
                errorAverages[key] = errorCount ? +(total / errorCount).toFixed(2) : 0;
            });
            return {
                course_id: course.id,
                title: course.title,
                description: course.description,
                error_analytics_avg: errorAverages
            };
        });
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error('Error in getAllCoursesErrorAnalyticsAverage:', error);
        res.status(500).json({ success: false, message: 'Internal server error while fetching all courses error analytics average', error: error.message });
    }
};

module.exports = {
    getCourseEnrollmentAnalytics,
    getCourseEnrollmentAnalyticsPaginated,
    getCourseModuleAnalytics,
    getCourseTopicStrengthAnalytics,
    getCourseErrorAnalyticsAverage,
    getAllCoursesModuleAnalytics,
    getAllCoursesTopicStrengthAnalytics,
    getAllCoursesErrorAnalyticsAverage
};
