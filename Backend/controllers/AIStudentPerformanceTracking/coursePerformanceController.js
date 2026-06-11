const Module = require("../../models/course_management/module")
const Session = require("../../models/course_management/session")
const { Op } = require("sequelize");
const { enrollments } = require("../../models/enrollment_management/enrollment_management");
const QuizCompletion = require("../../models/learning_progress/quizCompletion");
const Course = require("../../models/course_management/course");
const studentAccessibleData = require("../../models/enrollment_management/student_accessible_data");

exports.coursePerformance = async (req, res) => {
    const { userId, courseId } = req.params;

    if (!courseId) {
        return res.status(400).json({ message: 'Course ID is required.' });
    }

    try {
        // Fetch the course details
        const course = await Course.findOne({
            where: { id: courseId },
            attributes: ['title'],
            raw: true
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // Get all sessions for the course
        const sessions = await Session.findAll({
            where: { course_id: courseId },
            attributes: ['id', 'title'],
            raw: true
        });

        const sessionIds = sessions.map(session => session.id);

        // Get all modules for these sessions
        const modules = await Module.findAll({
            where: { session_id: { [Op.in]: sessionIds } },
            attributes: ['id', 'title', 'session_id'],
            raw: true
        });

        const moduleIds = modules.map(m => m.id);

        // Get enrollment
        const enrollment = await enrollments.findOne({
            where: {
                user_id: userId,
                course_id: courseId,
            },
            attributes: ['id'],
            raw: true
        });

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found.' });
        }

        // Fetch student's accessible data to derive module + quiz completion flags
        const accessible = await studentAccessibleData.findOne({
            where: { user_id: userId, course_id: courseId },
            attributes: ['module_ids', 'quiz_ids'],
            raw: true
        });

        const moduleAccessMap = new Map((accessible?.module_ids || []).map(m => [m.id, m]));
        const quizAccessByModule = (accessible?.quiz_ids || []).reduce((acc, q) => {
            acc[q.module_id] = acc[q.module_id] || [];
            acc[q.module_id].push(q);
            return acc;
        }, {});

        // Legacy quiz completion table (if still in use) augments assignment of completion
        const quizCompletions = await QuizCompletion.findAll({
            where: { userId, module_id: { [Op.in]: moduleIds }, isCompleted: true },
            attributes: ['module_id'], raw: true
        });
        const quizCompletedModuleIds = new Set(quizCompletions.map(q => q.module_id));

        // Structure the data by sessions
        const sessionsWithModulesAndStatus = sessions.map(session => {
            // Get modules for this session
            const sessionModules = modules.filter(module => module.session_id === session.id);

            // Add completion status to each module
            const modulesWithStatus = sessionModules.map(module => {
                const moduleMeta = moduleAccessMap.get(module.id) || {};
                // Determine quiz completion: all quizzes in accessible.quiz_ids for this module completed OR quizCompletions set
                const quizzes = quizAccessByModule[module.id] || [];
                const allQuizzesCompleted = quizzes.length === 0 || quizzes.every(q => q.isCompleted === true) || quizCompletedModuleIds.has(module.id);
                const isFullyCompleted = !!moduleMeta.isCompleted && allQuizzesCompleted;
                return {
                    id: module.id,
                    title: module.title,
                    status: isFullyCompleted ? 'completed' : 'pending',
                    progressTracking: !!moduleMeta.isCompleted,
                    quizCompleted: allQuizzesCompleted
                };
            });

            // Determine session status
            const totalModules = sessionModules.length;
            const completedModulesCount = modulesWithStatus.filter(m => m.status === 'completed').length;

            const sessionStatus = totalModules === 0 ? 'pending' :
                (completedModulesCount === totalModules ? 'completed' : 'pending');

            return {
                id: session.id,
                title: session.title,
                status: sessionStatus,
                modules: modulesWithStatus,
                progress: {
                    completed: completedModulesCount,
                    total: totalModules,
                    percentage: totalModules === 0 ? 0 : Math.round((completedModulesCount / totalModules) * 100)
                }
            };
        });

        return res.status(200).json({
            courseTitle: course.title, // Include the course title in the response
            sessions: sessionsWithModulesAndStatus
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};