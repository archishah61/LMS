const studentAccessibleData = require('../models/enrollment_management/student_accessible_data');
const Session = require('../models/course_management/session');
const Module = require('../models/course_management/module');
const Topic = require('../models/course_management/topic');
const ContentMapping = require('../models/course_management/contentMapping');
const User = require('../models/auth/user.js');
const Course = require('../models/course_management/course');
const ProgressTracking = require('../models/learning_progress/progressTracking');
const sendMail = require('../config/mailer');

exports.markModuleAsCompleted = async (req, res) => {
    try {
        const { userId, courseId, moduleId } = req.query;
        if (!userId || !courseId || !moduleId) {
            return res.status(400).json({
                success: false,
                message: "User ID, Course ID and Module ID are required",
            });
        }
        // Get the current module details
        const currentModule = await Module.findOne({
            where: {
                id: moduleId,
                status: 'active'
            },
            attributes: ['id', 'session_id'],
            raw: true
        });
        if (!currentModule) {
            return res.status(404).json({
                success: false,
                message: "Module not found"
            });
        }
        // Get student's accessible data with all necessary attributes
        const accessibleData = await studentAccessibleData.findOne({
            where: {
                user_id: userId,
                course_id: courseId
            },
            attributes: ['id', 'module_ids', 'topic_ids', 'quiz_ids', 'assignment_ids'],
            raw: true
        });
        if (!accessibleData) {
            return res.status(404).json({
                success: false,
                message: "No accessible data found for this user"
            });
        }
        // Filter modules for the current session
        const sessionModules = accessibleData.module_ids.filter(
            module => module.session_id === currentModule.session_id
        );
        // Find the index of current module and get next module
        const currentModuleIndex = sessionModules.findIndex(module => module.id === currentModule.id);

        // Find next INCOMPLETE module
        let nextModule = null;
        for (let i = currentModuleIndex + 1; i < sessionModules.length; i++) {
            if (!sessionModules[i].isCompleted && sessionModules[i].isCompleted !== "true") {
                nextModule = sessionModules[i];
                break;
            }
        }

        // If no incomplete next module found, we consider this the "last" one for progression purposes
        const isLastModuleInSession = nextModule === null;

        let updatedData = { ...accessibleData };
        if (isLastModuleInSession) {
            // If it's the last module, make all topics, quizzes and assignments of the session accessible
            updatedData.topic_ids = accessibleData.topic_ids.map(topic => {
                if (topic.session_id === currentModule.session_id) {
                    return { ...topic, isAccessible: true };
                }
                return topic;
            });

            updatedData.quiz_ids = accessibleData.quiz_ids.map(quiz => {
                if (quiz.session_id === currentModule.session_id) {
                    return { ...quiz, isAccessible: true };
                }
                return quiz;
            });
            updatedData.assignment_ids = accessibleData.assignment_ids.map(assignment => {
                if (assignment.session_id === currentModule.session_id) {
                    return { ...assignment, isAccessible: true };
                }
                return assignment;
            });

        } else if (nextModule) {
            // If there's a next module, make it accessible
            updatedData.module_ids = accessibleData.module_ids.map(module => {
                if (module.id === nextModule.id) {
                    return { ...module, isAccessible: true };
                }
                return module;
            });
            // Also make the first topic of the next module accessible
            const nextModuleTopics = accessibleData.topic_ids.filter(
                topic => topic.module_id === nextModule.id
            );
            if (nextModuleTopics.length > 0) {
                const firstTopicOfNextModule = nextModuleTopics[0];
                updatedData.topic_ids = accessibleData.topic_ids.map(topic => {
                    if (topic.id === firstTopicOfNextModule.id) {
                        return { ...topic, isAccessible: true };
                    }
                    return topic;
                });
            }
        }
        // Update the student's accessible data
        await studentAccessibleData.update(
            updatedData,
            {
                where: {
                    user_id: userId,
                    course_id: courseId
                }
            }
        );
        return res.status(200).json({
            success: true,
            message: isLastModuleInSession
                ? "Module marked as completed. Session topics, quizzes and assignments unlocked."
                : "Module marked as completed and next module unlocked",
            nextModuleId: nextModule ? nextModule.id : null,
            isLastModule: isLastModuleInSession
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error marking module as completed",
            error: error.message
        });
    }
}

const checkProgressStatus = async ({ userId, courseId, topicId }) => {

    const { module_id: moduleId } = await Topic.findOne({ where: { id: topicId }, attributes: ['module_id'], raw: true });
    const { session_id: sessionId } = await Module.findOne({ where: { id: moduleId }, attributes: ['session_id'], raw: true });

    // 1️⃣ Get original session id
    const originalSession = await Session.findOne({
        where: { id: sessionId },
        attributes: ["original_session_id"],
        raw: true
    });

    const originalSessionId = originalSession?.original_session_id || sessionId;

    // 2️⃣ Get student accessible data
    const studentData = await studentAccessibleData.findOne({
        where: { user_id: userId, course_id: courseId },
        raw: false
    });

    if (!studentData) {
        return {
            success: false,
            message: "No accessible data found for this student"
        };
    }

    const data = studentData.toJSON();

    // =========================
    // 🔹 MODULE LEVEL CHECK
    // =========================

    const topics = (data.topic_ids || []).filter(
        t => t.module_id === parseInt(moduleId)
    );

    const quizzes = (data.quiz_ids || []).filter(
        q => q.module_id === parseInt(moduleId)
    );

    const assignments = (data.assignment_ids || []).filter(
        a => a.module_id === parseInt(moduleId)
    );

    const allTopicsCompleted = topics.length > 0 && topics.every(t => t.isCompleted === true);

    const allQuizzesCompleted = quizzes.length === 0 || quizzes.every(q => q.isCompleted === true);

    const allAssignmentsCompleted = assignments.length === 0 || assignments.every(a => a.isCompleted === true);

    const allContentCompleted = allTopicsCompleted && allQuizzesCompleted && allAssignmentsCompleted;

    // =========================
    // 🔹 SESSION LEVEL CHECK
    // =========================

    const modules = (data.module_ids || []).filter(
        m => m.session_id === parseInt(originalSessionId)
    );

    const allModulesCompleted = modules.length > 0 && modules.every(m => m.isCompleted === true);
    const isLastModule = modules.length > 0 && modules[modules.length - 1].id === moduleId;

    // =========================
    // 🔹 COURSE LEVEL CHECK
    // =========================

    const sessions = (data.session_ids || []);

    const allSessionsCompleted = sessions.length > 0 && sessions.every(s => s.isCompleted === true);

    // =========================
    // 🔹 FINAL RESPONSE
    // =========================

    return {
        success: true,
        moduleCompleted: allTopicsCompleted,
        sessionCompleted: allModulesCompleted,
        courseCompleted: allSessionsCompleted,
        module: {
            moduleId: parseInt(moduleId),
            moduleCompleted: allTopicsCompleted,
            isLastModule,
            completion: {
                allQuizzesCompleted,
                allAssignmentsCompleted,
                allContentCompleted
            }
        },
        session: {
            sessionId: parseInt(originalSessionId),
            sessionCompleted: allModulesCompleted
        }
    };
};

async function getModuleCompletionStatus(userId, courseId, moduleId) {
    try {
        if (!userId || !courseId || !moduleId) {
            throw new Error("User ID, Course ID, and Module ID are required");
        }

        // 1️⃣ Find original module ID
        const moduleRecord = await Module.findOne({
            where: { id: moduleId },
            attributes: ["original_module_id"]
        });

        // If no original_module_id → it's already original
        const originalModuleId = moduleRecord?.original_module_id || moduleId;

        // 2️⃣ Fetch student accessible data
        const studentData = await studentAccessibleData.findOne({
            where: { user_id: userId, course_id: courseId },
            raw: false
        });

        if (!studentData) {
            return {
                success: false,
                message: "No accessible data found for this student"
            };
        }

        const data = studentData.toJSON();

        // 3️⃣ Filter module content
        const topics = (data.topic_ids || []).filter(t => t.module_id === parseInt(moduleId));
        const quizzes = (data.quiz_ids || []).filter(q => q.module_id === parseInt(moduleId));
        const assignments = (data.assignment_ids || []).filter(a => a.module_id === parseInt(moduleId));

        // 4️⃣ Completion checks
        const allTopicsCompleted = topics.length > 0 && topics.every(t => t.isCompleted === true);
        const allQuizzesCompleted = quizzes.length === 0 || quizzes.every(q => q.isCompleted === true);
        const allAssignmentsCompleted = assignments.length === 0 || assignments.every(a => a.isCompleted === true);

        const allContentCompleted = allTopicsCompleted && allQuizzesCompleted && allAssignmentsCompleted;

        let sessionId;

        // 5️⃣ If module fully completed
        if (allContentCompleted) {
            const updatedModules = [...(data.module_ids || [])];

            const currentModule = updatedModules.find(m => m.id === parseInt(moduleId));
            sessionId = currentModule?.session_id;

            if (currentModule) {
                currentModule.isCompleted = true;
                currentModule.isAccessible = true; // ensure accessible
            }

            // 6️⃣ Find mapping for copied modules
            const mapping = await ContentMapping.findOne({
                where: {
                    type: "module",
                    original_id: originalModuleId
                }
            });

            // ⭐ NEW: If this is a copied module → update original module
            if (moduleId !== originalModuleId) {
                // 1️⃣ Get mapping of original module → its original course
                const originalMapping = await ContentMapping.findOne({
                    where: {
                        type: "module",
                        original_id: originalModuleId
                    }
                });

                if (originalMapping) {
                    const originalCourseId = originalMapping.original_course_id;

                    // 2️⃣ Make sure student's accessible data exists for the original course
                    const originalStudentData = await studentAccessibleData.findOne({
                        where: {
                            user_id: userId,
                            course_id: originalCourseId
                        },
                        raw: false
                    });

                    if (originalStudentData) {
                        const originalData = originalStudentData.toJSON();

                        // 3️⃣ Locate the original module in its course
                        const originalModules = [...(originalData.module_ids || [])];
                        const originalModule = originalModules.find(
                            m => m.id === parseInt(originalModuleId)
                        );

                        if (originalModule) {
                            // ⭐ Mark original module completed
                            originalModule.isCompleted = true;
                            originalModule.isAccessible = true;

                            // NEW: Mark all topics of the original module as completed
                            let originalTopics = [...(originalData.topic_ids || [])];
                            originalTopics = originalTopics.map(t => {
                                if (t.module_id === parseInt(originalModuleId)) {
                                    return { ...t, isCompleted: true, isAccessible: true };
                                }
                                return t;
                            });

                            // 4️⃣ Unlock next module in original course
                            const sortedOriginalModules = originalModules.sort(
                                (a, b) => a.sequenceNo - b.sequenceNo
                            );

                            const originalIndex = sortedOriginalModules.findIndex(
                                m => m.id === parseInt(originalModuleId)
                            );

                            // Find next INCOMPLETE module to unlock
                            let originalNextModule = null;
                            for (let i = originalIndex + 1; i < sortedOriginalModules.length; i++) {
                                if (!sortedOriginalModules[i].isCompleted || sortedOriginalModules[i].isCompleted !== true) {
                                    originalNextModule = sortedOriginalModules[i];
                                    break;
                                }
                            }

                            // Check all previous modules (up to current) are completed
                            // Note: We check up to 'index' because we just completed it. 
                            // Any modules between index and nextModule are ALSO completed (skipped by loop).
                            const allPrevOriginalCompleted = sortedOriginalModules
                                .slice(0, originalIndex + 1)
                                .every(m => m.isCompleted === true);

                            if (originalNextModule && allPrevOriginalCompleted) {
                                // Unlock module
                                originalNextModule.isAccessible = true;

                                // 5️⃣ Unlock first topic of next module
                                const nextTopics = originalTopics
                                    .filter(t => t.module_id === originalNextModule.id)
                                    .sort((a, b) => a.sequenceNo - b.sequenceNo);

                                if (nextTopics.length > 0) {
                                    const firstTopicId = nextTopics[0].id;
                                    originalTopics = originalTopics.map(t => {
                                        if (t.id === firstTopicId) {
                                            return { ...t, isAccessible: true };
                                        }
                                        return t;
                                    });
                                }
                            }

                            originalData.topic_ids = originalTopics;

                            // 6️⃣ Save changes for original course
                            originalData.module_ids = originalModules;

                            await studentAccessibleData.update(
                                {
                                    module_ids: originalModules,
                                    topic_ids: originalData.topic_ids
                                },
                                {
                                    where: {
                                        id: originalStudentData.id
                                    }
                                }
                            );

                        }
                    }
                }
            }

            if (mapping && Array.isArray(mapping.copied_id)) {
                for (const copy of mapping.copied_id) {
                    // 1️⃣ Fetch student accessible data
                    const studentData = await studentAccessibleData.findOne({
                        where: {
                            user_id: userId,
                            course_id: copy.course_id
                        }
                    });

                    if (!studentData) {
                        continue;
                    }

                    // 2️⃣ Read module_ids
                    let moduleIds = studentData.module_ids || [];

                    // 3️⃣ Find module
                    const moduleIndex = moduleIds.findIndex(
                        m => m.id === copy.module_id
                    );

                    if (moduleIndex !== -1) {
                        // 4️⃣ Update existing → keep old session_id unchanged
                        moduleIds[moduleIndex] = {
                            ...moduleIds[moduleIndex],      // keeps session_id
                            isCompleted: true,
                            isAccessible: true
                        };

                        // NEW: Mark all topics of the copied module as completed
                        let copiedTopics = studentData.topic_ids || [];
                        copiedTopics = copiedTopics.map(t => {
                            if (t.module_id === copy.module_id) {
                                return { ...t, isCompleted: true, isAccessible: true };
                            }
                            return t;
                        });


                        // ⭐ NEW: Unlock next module and first topic inside each copied course
                        const sortedCopiedModules = [...moduleIds].sort((a, b) => a.sequenceNo - b.sequenceNo);
                        const copiedIndex = sortedCopiedModules.findIndex(m => m.id === copy.module_id);

                        // Find next INCOMPLETE module
                        let copiedNextModule = null;
                        for (let i = copiedIndex + 1; i < sortedCopiedModules.length; i++) {
                            if (!sortedCopiedModules[i].isCompleted || sortedCopiedModules[i].isCompleted !== true) {
                                copiedNextModule = sortedCopiedModules[i];
                                break;
                            }
                        }

                        // Check all previous modules (including current) are completed
                        const allPrevCopiedCompleted = sortedCopiedModules
                            .slice(0, copiedIndex + 1)
                            .every(m => m.isCompleted === true);

                        if (copiedNextModule && allPrevCopiedCompleted) {
                            // Unlock next module
                            copiedNextModule.isAccessible = true;

                            // Unlock first topic of that module
                            const copiedNextTopics = copiedTopics
                                .filter(t => t.module_id === copiedNextModule.id)
                                .sort((a, b) => a.sequenceNo - b.sequenceNo);

                            if (copiedNextTopics.length > 0) {
                                copiedNextTopics[0].isAccessible = true;
                            }
                        }

                        // 5️⃣ Save back to DB
                        await studentAccessibleData.update(
                            {
                                module_ids: moduleIds,
                                topic_ids: copiedTopics
                            },
                            {
                                where: { user_id: userId, course_id: copy.course_id }
                            }
                        );

                    } else {
                        continue;
                    }
                }
            }

            // 7️⃣ Unlock next module + first topic
            const sortedModules = updatedModules.sort((a, b) => a.sequenceNo - b.sequenceNo);
            const currentIndex = sortedModules.findIndex(m => m.id === parseInt(moduleId));
            // Find next INCOMPLETE module
            let nextModule = null;
            for (let i = currentIndex + 1; i < sortedModules.length; i++) {
                if (!sortedModules[i].isCompleted || sortedModules[i].isCompleted !== true) {
                    nextModule = sortedModules[i];
                    break;
                }
            }

            // Check all previous modules (including current) are completed
            const allPrevCompleted = sortedModules
                .slice(0, currentIndex + 1)
                .every(m => m.isCompleted === true);

            if (nextModule && allPrevCompleted) {
                nextModule.isAccessible = true;

                const updatedTopics = [...(data.topic_ids || [])];
                const nextModuleTopics = updatedTopics
                    .filter(t => t.module_id === nextModule.id)
                    .sort((a, b) => a.sequenceNo - b.sequenceNo);

                if (nextModuleTopics.length > 0) {
                    nextModuleTopics[0].isAccessible = true;
                }

                data.topic_ids = updatedTopics;
            }

            data.module_ids = updatedModules;

            // 8️⃣ Save
            await studentData.update({
                module_ids: data.module_ids,
                topic_ids: data.topic_ids
            });
        }

        // 9️⃣ Response
        return {
            success: true,
            isModuleCompleted: allContentCompleted,
            sessionId,
            details: {
                topicsCompleted: allTopicsCompleted,
                quizzesCompleted: allQuizzesCompleted,
                assignmentsCompleted: allAssignmentsCompleted,
                totalTopics: topics.length,
                completedTopics: topics.filter(t => t.isCompleted).length,
                totalQuizzes: quizzes.length,
                completedQuizzes: quizzes.filter(q => q.isCompleted).length,
                totalAssignments: assignments.length,
                completedAssignments: assignments.filter(a => a.isCompleted).length
            }
        };
    } catch (error) {
        return {
            success: false,
            message: "Error checking module completion status",
            error: error.message
        };
    }
}

exports.getModuleCompletionStatus = getModuleCompletionStatus;

async function getSessionCompletionStatus(userId, courseId, sessionId) {
    try {
        if (!userId || !courseId || !sessionId) {
            throw new Error("User ID, Course ID, and Session ID are required");
        }

        // 1️⃣ Get original session id
        const originalSession = await Session.findOne({
            where: { id: sessionId },
            attributes: ["original_session_id"],
            raw: true
        });

        const originalSessionId = originalSession?.original_session_id || sessionId;

        // 2️⃣ Get student accessible data for CURRENT course
        const studentData = await studentAccessibleData.findOne({
            where: { user_id: userId, course_id: courseId },
            raw: false
        });

        if (!studentData) {
            return { success: false, message: "No accessible data found for this student" };
        }

        const data = studentData.toJSON();

        // 3️⃣ Find all modules under this session
        const modules = (data.module_ids || []).filter(
            m => m.session_id === parseInt(sessionId)
        );

        const allModulesCompleted =
            modules.length > 0 && modules.every(m => m.isCompleted);

        // 4️⃣ If session is fully completed
        if (allModulesCompleted) {
            const updatedSessions = [...(data.session_ids || [])];

            // 4.1️⃣ Mark current session complete
            const currentSession = updatedSessions.find(
                s => s.id === parseInt(sessionId)
            );

            if (currentSession) {
                currentSession.isCompleted = true;
                currentSession.isAccessible = true;
            }

            // ---------------------------------------------------------------
            // ⭐ 4.2️⃣ NEW: Update ORIGINAL SESSION if this is a COPIED session
            // ---------------------------------------------------------------
            if (sessionId != originalSessionId) {
                const originalMapping = await ContentMapping.findOne({
                    where: {
                        type: "session",
                        original_id: originalSessionId
                    }
                });

                if (originalMapping) {
                    const originalCourseId = originalMapping.original_course_id;

                    const originalStudentData = await studentAccessibleData.findOne({
                        where: {
                            user_id: userId,
                            course_id: originalCourseId
                        },
                        raw: false
                    });

                    if (originalStudentData) {
                        const originalData = originalStudentData.toJSON();
                        const originalSessions = [...(originalData.session_ids || [])];

                        const originalSessionObj = originalSessions.find(
                            s => s.id === parseInt(originalSessionId)
                        );

                        if (originalSessionObj) {
                            // Mark original as complete
                            originalSessionObj.isCompleted = true;
                            originalSessionObj.isAccessible = true;

                            // 🔓 Unlock next session in ORIGINAL course
                            const sortedOSess = originalSessions.sort(
                                (a, b) => a.sequenceNo - b.sequenceNo
                            );
                            const oIndex = sortedOSess.findIndex(
                                s => s.id === parseInt(originalSessionId)
                            );
                            // Find next INCOMPLETE session for Original Course
                            let nextOSession = null;
                            for (let i = oIndex + 1; i < sortedOSess.length; i++) {
                                if (!sortedOSess[i].isCompleted || sortedOSess[i].isCompleted !== true) {
                                    nextOSession = sortedOSess[i];
                                    break;
                                }
                            }

                            // Check all previous sessions (up to current) are completed
                            const allPrevOSessionsCompleted = sortedOSess
                                .slice(0, oIndex + 1)
                                .every(s => s.isCompleted === true);

                            if (nextOSession && allPrevOSessionsCompleted) {
                                nextOSession.isAccessible = true;

                                // 🔓 Unlock first module of this next session
                                const oModules = [...(originalData.module_ids || [])];
                                const nextModules = oModules
                                    .filter(m => m.session_id === nextOSession.id)
                                    .sort((a, b) => a.sequenceNo - b.sequenceNo);

                                if (nextModules.length > 0) {
                                    nextModules[0].isAccessible = true;
                                }

                                originalData.module_ids = oModules;
                            }

                            // Save updated info for ORIGINAL COURSE
                            await studentAccessibleData.update(
                                {
                                    session_ids: originalSessions,
                                    module_ids: originalData.module_ids
                                },
                                {
                                    where: { id: originalStudentData.id }
                                }
                            );
                        }
                    }
                }
            }

            // ---------------------------------------------------------------
            // 4.3️⃣ Update copied sessions (your existing logic)
            // ---------------------------------------------------------------
            const mapping = await ContentMapping.findOne({
                where: {
                    type: "session",
                    original_id: originalSessionId
                }
            });

            if (mapping && Array.isArray(mapping.copied_id)) {
                for (const copy of mapping.copied_id) {
                    const targetStudentData = await studentAccessibleData.findOne({
                        where: {
                            user_id: userId,
                            course_id: copy.course_id
                        }
                    });

                    if (!targetStudentData) continue;

                    let sessionIds = targetStudentData.session_ids || [];
                    const idx = sessionIds.findIndex(s => s.id === copy.session_id);

                    if (idx !== -1) {
                        sessionIds[idx].isCompleted = true;
                        sessionIds[idx].isAccessible = true;

                        // ⭐ NEW: Unlock next session + its first module in each copied course
                        const sortedCSessions = [...sessionIds].sort((a, b) => a.sequenceNo - b.sequenceNo);

                        const cIndex = sortedCSessions.findIndex(s => s.id === copy.session_id);
                        // Find next INCOMPLETE session for Copied Course
                        let copiedNextSession = null;
                        for (let i = cIndex + 1; i < sortedCSessions.length; i++) {
                            if (!sortedCSessions[i].isCompleted || sortedCSessions[i].isCompleted !== true) {
                                copiedNextSession = sortedCSessions[i];
                                break;
                            }
                        }

                        // Check all previous sessions (including current) are completed
                        const allPrevCSessionsCompleted = sortedCSessions
                            .slice(0, cIndex + 1)
                            .every(s => s.isCompleted === true);

                        if (copiedNextSession && allPrevCSessionsCompleted) {
                            copiedNextSession.isAccessible = true;

                            // Unlock first module of next session
                            let copiedModules = targetStudentData.module_ids || [];

                            const nextCopiedModules = copiedModules
                                .filter(m => m.session_id === copiedNextSession.id)
                                .sort((a, b) => a.sequenceNo - b.sequenceNo);

                            if (nextCopiedModules.length > 0) {
                                nextCopiedModules[0].isAccessible = true;
                            }

                            // Save modules and sessions
                            await studentAccessibleData.update(
                                {
                                    session_ids: sortedCSessions,
                                    module_ids: copiedModules
                                },
                                {
                                    where: {
                                        user_id: userId,
                                        course_id: copy.course_id
                                    }
                                }
                            );

                        }

                        await studentAccessibleData.update(
                            { session_ids: sessionIds },
                            {
                                where: {
                                    user_id: userId,
                                    course_id: copy.course_id
                                }
                            }
                        );
                    }
                }
            }

            // ---------------------------------------------------------------
            // 4.4️⃣ Unlock next session + its first module in CURRENT course
            // ---------------------------------------------------------------
            const sortedSessions = updatedSessions.sort((a, b) => a.sequenceNo - b.sequenceNo);
            const index = sortedSessions.findIndex(s => s.id === parseInt(sessionId));
            // Find next INCOMPLETE session for Current Course
            let nextSession = null;
            for (let i = index + 1; i < sortedSessions.length; i++) {
                if (!sortedSessions[i].isCompleted || sortedSessions[i].isCompleted !== true) {
                    nextSession = sortedSessions[i];
                    break;
                }
            }

            // Check all previous sessions (including current) are completed
            const allPrevSessionsCompleted = sortedSessions
                .slice(0, index + 1)
                .every(s => s.isCompleted === true);

            if (nextSession && allPrevSessionsCompleted) {
                nextSession.isAccessible = true;

                const updatedModules = [...(data.module_ids || [])];
                const nextSessionModules = updatedModules
                    .filter(m => m.session_id === nextSession.id)
                    .sort((a, b) => a.sequenceNo - b.sequenceNo);

                if (nextSessionModules.length > 0) {
                    nextSessionModules[0].isAccessible = true;
                }

                data.module_ids = updatedModules;
            }

            // Save updated CURRENT course
            await studentAccessibleData.update(
                {
                    session_ids: updatedSessions,
                    module_ids: data.module_ids
                },
                {
                    where: { id: studentData.id }
                }
            );
        }

        // Return response
        return {
            success: true,
            sessionCompleted: allModulesCompleted,
            details: {
                totalModules: modules.length,
                completedModules: modules.filter(m => m.isCompleted).length
            }
        };

    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "Error checking session completion status",
            error: error.message
        };
    }
}

exports.getSessionCompletionStatus = getSessionCompletionStatus;

async function getCourseCompletionStatus(userId, courseId) {
    try {
        if (!userId || !courseId) {
            throw new Error("User ID and Course ID are required");
        }

        // Fetch student's accessible data
        const studentData = await studentAccessibleData.findOne({
            where: { user_id: userId, course_id: courseId },
            raw: true
        });

        if (!studentData) {
            return {
                success: false,
                message: "No accessible data found for this student"
            };
        }

        // ✅ Check if all sessions are completed
        const sessions = studentData.session_ids || [];

        const allSessionsCompleted = sessions.length > 0 && sessions.every(s => s.isCompleted === true);

        if (allSessionsCompleted) {
            await enrollments.update({
                is_completed: true,
                completed_at: new Date()
            },
                {
                    where: {
                        user_id: userId,
                        course_id: courseId
                    }
                });
        }

        return {
            success: true,
            courseCompleted: allSessionsCompleted, // ✅ now based on sessions
            details: {
                totalSessions: sessions.length,
                completedSessions: sessions.filter(s => s.isCompleted).length
            }
        };
    } catch (error) {
        return {
            success: false,
            message: "Error checking course completion status",
            error: error.message
        };
    }
}

exports.getCourseCompletionStatus = getCourseCompletionStatus;

const { callProcedure } = require("../utils/procedure/callProcedure");

exports.checkAndUpdateTopicCompletionStatus = async (userId, courseId, type, contentId) => {
    try {
        // 1. Fetch accessible data to update flags
        const accessibleData = await studentAccessibleData.findOne({
            where: { user_id: userId, course_id: courseId }
        });

        if (!accessibleData) return;

        let topicIds = accessibleData.topic_ids || [];
        let dataModified = false;
        let topicToMarkComplete = null;

        // 2. Find the relevant topic and update the content flag
        topicIds = topicIds.map(topic => {
            let topicModified = false;

            // Check Quizzes
            if (type === 'quiz' && topic.topic_quiz && Array.isArray(topic.topic_quiz)) {
                topic.topic_quiz = topic.topic_quiz.map(q => {
                    // Check if ID matches (handling both integer and string IDs safely)
                    if (parseInt(q.id) === parseInt(contentId)) {
                        if (q.isComplete !== true) {
                            q.isComplete = true; // Set flag
                            topicModified = true;
                            dataModified = true;
                        }
                    }
                    return q;
                });
            }

            // Check Assignments
            if (type === 'assignment' && topic.topic_assignment && Array.isArray(topic.topic_assignment)) {
                topic.topic_assignment = topic.topic_assignment.map(a => {
                    if (parseInt(a.id) === parseInt(contentId)) {
                        if (a.isComplete !== true) {
                            a.isComplete = true; // Set flag
                            topicModified = true;
                            dataModified = true;
                        }
                    }
                    return a;
                });
            }

            // 3. If this topic was modified, check if ALL its contents are now complete
            if (topicModified) {
                // Check all quizzes
                const allQuizzesComplete = !topic.topic_quiz || topic.topic_quiz.length === 0 || topic.topic_quiz.every(q => q.isComplete === true);

                // Check all assignments
                const allAssignmentsComplete = !topic.topic_assignment || topic.topic_assignment.length === 0 || topic.topic_assignment.every(a => a.isComplete === true);

                // Check also if topic has accordions or other content that is already tracked elsewhere?
                // The prompt specifically asks: "if all are completes then i want to call mark topic as completed"
                // Assuming accordions/slides handled separately or assume only quiz/assignment prevent topic completion if they exist.

                if (allQuizzesComplete && allAssignmentsComplete) {
                    topicToMarkComplete = topic.id;
                }
            }
            return topic;
        });

        // 4. Save update to DB if flags changed
        if (dataModified) {
            await studentAccessibleData.update(
                { topic_ids: topicIds },
                { where: { id: accessibleData.id } }
            );
        }

        // 5. Trigger procedure if topic is fully done
        if (topicToMarkComplete) {
            await callProcedure("markTopicAsCompleted", [userId, courseId, topicToMarkComplete]);
        }

    } catch (err) {
        console.error("Error in checkAndUpdateTopicCompletionStatus:", err);
    }
};


// --------------------------------------------------------------------------------------------------
// Procedure + Controller

const { callProcedureChallenge } = require('../utils/procedure/callProcedureChallenge.js');
const { enrollments } = require('../models/enrollment_management/enrollment_management.js');

exports.getAccessibleSessionsByCourseId = async (req, res, next) => {
    try {
        const { userId, courseId } = req.query;

        if (!userId || !courseId) {
            return res.status(400).json({
                success: false,
                message: "User ID and Course ID are required",
            });
        }

        // Call stored procedure
        const result = await callProcedure("getAccessibleSessionsByCourseId", [
            userId,
            courseId,
        ]);

        // Parse to integers
        const parsedUserId = parseInt(userId, 10);
        const parsedCourseId = parseInt(courseId, 10);

        // Check if parsing failed (NaN)
        if (isNaN(parsedUserId) || isNaN(parsedCourseId)) {
            return res.status(400).json({
                success: false,
                message: "User ID and Course ID must be valid integers",
            });
        }

        if (!result.success) {
            // Pass error to middleware
            return next(result.error);
        }

        const sessions = result.data;

        return res.status(200).json({
            success: true,
            sessions: sessions.map(s => ({
                id: s.id,
                title: s.title,
                isAccessible: !!s.isAccessible,
                isCompleted: !!s.isCompleted
            })),
        });

    } catch (error) {
        return next(error); // Let middleware handle SIGNAL errors
    }
};

exports.getAccessibleModulesBySessionId = async (req, res, next) => {
    try {
        const { userId, courseId, sessionId } = req.query;

        if (!userId || !sessionId) {
            return res.status(400).json({
                success: false,
                message: "User ID and Session ID are required",
            });
        }

        // Call stored procedure
        const result = await callProcedure("getAccessibleModulesBySessionId", [
            userId,
            courseId,
            sessionId,
        ]);

        if (!result.success) {
            return next(result.error); // Let error middleware handle SIGNAL errors
        }

        const modules = result.data;

        return res.status(200).json({
            success: true,
            modules: modules.map(m => ({
                id: m.id,
                title: m.title,
                description: m.description, // keep response structure
                isAccessible: !!m.isAccessible,
                isCompleted: !!m.isCompleted
            })),
        });

    } catch (error) {
        return next(error);
    }
};

exports.getAccessibleTopicsByModuleId = async (req, res, next) => {
    const { userId, courseId, moduleId } = req.query;

    if (!userId || !moduleId) {
        return res.status(400).json({
            success: false,
            message: "User ID and Module ID are required",
        });
    }

    try {
        const { success, data, error } = await callProcedureChallenge(
            "getAccessibleTopicsByModuleId",
            [userId, courseId || null, moduleId]
        );

        if (!success) {
            return next(error);
        }

        const topic = Object.values(data[0]).find(item => item.id === 2);

        // Convert object with numeric keys to array
        const topicsArray = data[0] ? Object.values(data[0]) : [];

        const topicsWithStatus = topicsArray.map((row) => ({
            id: row.id,
            title: row.title,
            description: row.description,
            content_type: row.content_type,
            topic_duration: row.topic_duration,
            extra_duration: row.extra_duration,
            total_duration: row.total_duration,
            isAccessible: !!row.isAccessible,
            isCompleted: !!row.isCompleted,
            quizzes: Array.isArray(row.quizzes)
                ? row.quizzes.filter((q) => q != null)
                : [],
            assignments: Array.isArray(row.assignments)
                ? row.assignments.filter((a) => a != null)
                : [],
        }));

        return res.status(200).json({
            success: true,
            topics: topicsWithStatus,
        });
    } catch (error) {
        return next(error);
    }
};

exports.getAccessibleQuizzesByModuleId = async (req, res, next) => {
    try {
        const { userId, courseId, moduleId } = req.query;

        if (!userId || !moduleId) {
            return res.status(400).json({
                success: false,
                message: "User ID and Module ID are required",
            });
        }

        // Call stored procedure
        const result = await callProcedure("getAccessibleQuizzesByModuleId", [
            userId,
            courseId,
            moduleId,
        ]);

        if (!result.success) {
            return next(result.error); // Middleware handles SIGNAL errors
        }

        const quizzes = result.data;

        return res.status(200).json({
            success: true,
            quizzes: quizzes.map(q => ({
                id: q.id,
                title: q.title,
                isAccessible: !!q.isAccessible,
                isCompleted: !!q.isCompleted
            })),
        });

    } catch (error) {
        return next(error);
    }
};

exports.getAccessibleAssignmentsByModuleId = async (req, res, next) => {
    try {
        const { userId, courseId, moduleId } = req.query;

        if (!userId || !moduleId) {
            return res.status(400).json({
                success: false,
                message: "User ID and Module ID are required",
            });
        }

        // Call stored procedure
        const result = await callProcedure("getAccessibleAssignmentsByModuleId", [
            userId,
            courseId,
            moduleId,
        ]);

        if (!result.success) {
            return next(result.error); // Middleware handles SIGNAL errors
        }

        const assignments = result.data;

        return res.status(200).json({
            success: true,
            assignments: assignments.map(a => ({
                id: a.id,
                title: a.title,
                description: a.description,
                isAccessible: !!a.isAccessible,
                isCompleted: !!a.isCompleted
            })),
        });

    } catch (error) {
        return next(error);
    }
};


// Helper function to check red dots and send email if threshold exceeded
const checkAndSendMisuseMail = async (userId, courseId) => {
    try {
        const threshold = 5;
        // Count red dots for user in this course
        const redDotsCount = await ProgressTracking.count({
            where: {
                user_id: userId,
                course_id: courseId,
                color_dot: 'red',
                completion_status: 'completed',
                accordian_id: null,
                slide_id: null,
            }
        });

        // Check if count reaches threshold
        if (redDotsCount >= threshold) {
            // Fetch user details
            const user = await User.findOne({
                where: { id: userId },
                attributes: ['id', 'full_name', 'username', 'email'],
                raw: true
            });

            if (!user) {
                return {
                    triggered: true,
                    sent: false,
                    threshold,
                    redDotsCount,
                    reason: 'user-not-found',
                };
            }

            // Fetch course details
            const course = await Course.findOne({
                where: { id: courseId },
                attributes: ['id', 'title'],
                raw: true
            });

            if (!course) {
                return {
                    triggered: true,
                    sent: false,
                    threshold,
                    redDotsCount,
                    reason: 'course-not-found',
                    userId: user.id,
                };
            }

            // Fetch all red dot topics for this user in this course
            const redDotTopics = await ProgressTracking.findAll({
                where: {
                    user_id: userId,
                    course_id: courseId,
                    color_dot: 'red',
                    completion_status: 'completed',
                    accordian_id: null,
                    slide_id: null,
                },
                attributes: [
                    'topic_id',
                    'student_time_spent',
                    'first_completion_time_spent',
                    'completion_status'
                ],
                raw: true
            });

            // Fetch topic titles
            const topicsData = await Promise.all(
                redDotTopics.map(async (pt) => {
                    const topic = await Topic.findOne({
                        where: { id: pt.topic_id },
                        attributes: ['id', 'title', 'topic_duration'],
                        raw: true
                    });

                    const requiredDurationSeconds = topic?.topic_duration
                        ? Math.round(Number(topic.topic_duration) * 60)
                        : 0;

                    return {
                        ...pt,
                        topicTitle: topic?.title || 'Unknown Topic',
                        required_duration_seconds: requiredDurationSeconds,
                    };
                })
            );

            // Format time in human readable format
            const formatSeconds = (seconds) => {
                if (!seconds) return '0s';
                const h = Math.floor(seconds / 3600);
                const m = Math.floor((seconds % 3600) / 60);
                const s = seconds % 60;
                return [h ? h + 'h' : null, m ? m + 'm' : null, s ? s + 's' : null].filter(Boolean).join(' ');
            };

            // Prepare email HTML content
            const topicsTable = topicsData.map((t, idx) => `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${idx + 1}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${t.topicTitle}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatSeconds(t.first_completion_time_spent)}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatSeconds(t.required_duration_seconds)}</td>
                </tr>
            `).join('');

            const emailHtml = `
                <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 5px;">
                    <div style="background-color: white; max-width: 800px; margin: 0 auto; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        
                        <h2 style="color: #e74c3c; border-bottom: 3px solid #e74c3c; padding-bottom: 10px;">⚠️ User Misuse Alert</h2>
                        
                        <p style="color: #555; line-height: 1.6;">
                            A student has completed a course with multiple topics marked as <strong style="color: #e74c3c;">Red (Slow/Insufficient Time Spent)</strong>.
                        </p>

                        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <h3 style="margin-top: 0; color: #856404;">This indicates potential misuse or technical issues with time tracking.</h3>
                        </div>

                        <h3 style="color: #333; margin-top: 25px;">Student Details</h3>
                        <table style="width: 100%; border-collapse: collapse; background-color: #f9f9f9;">
                            <tr style="background-color: #ecf0f1;">
                                <td style="padding: 10px; font-weight: bold; width: 30%;">User ID:</td>
                                <td style="padding: 10px;">${user.id}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Full Name:</td>
                                <td style="padding: 10px;">${user.full_name}</td>
                            </tr>
                            <tr style="background-color: #ecf0f1;">
                                <td style="padding: 10px; font-weight: bold;">Username:</td>
                                <td style="padding: 10px;">${user.username}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Email:</td>
                                <td style="padding: 10px;"><a href="mailto:${user.email}" style="color: #3498db;">${user.email}</a></td>
                            </tr>
                        </table>

                        <h3 style="color: #333; margin-top: 25px;">Course Details</h3>
                        <table style="width: 100%; border-collapse: collapse; background-color: #f9f9f9;">
                            <tr style="background-color: #ecf0f1;">
                                <td style="padding: 10px; font-weight: bold; width: 30%;">Course ID:</td>
                                <td style="padding: 10px;">${course.id}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Course Title:</td>
                                <td style="padding: 10px;">${course.title}</td>
                            </tr>
                            <tr style="background-color: #ecf0f1;">
                                <td style="padding: 10px; font-weight: bold;">Red Dot Count:</td>
                                <td style="padding: 10px;"><strong style="color: #e74c3c;">${redDotsCount} topics</strong></td>
                            </tr>
                        </table>

                        <h3 style="color: #333; margin-top: 25px;">Topics with Red Status (Insufficient Time)</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background-color: #34495e; color: white;">
                                    <th style="padding: 12px; text-align: left;">#</th>
                                    <th style="padding: 12px; text-align: left;">Topic Name</th>
                                    <th style="padding: 12px; text-align: center;">Time Spent</th>
                                    <th style="padding: 12px; text-align: center;">Required Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${topicsTable}
                            </tbody>
                        </table>

                        <div style="background-color: #ecf0f1; padding: 15px; margin-top: 20px; border-radius: 4px;">
                            <h4 style="margin-top: 0; color: #555;">Recommended Actions:</h4>
                            <ul style="color: #555; line-height: 1.8;">
                                <li>Investigate if the student needs additional time or support</li>
                                <li>Review time tracking configuration for potential technical issues</li>
                                <li>Contact the student to understand the reason for insufficient time spent</li>
                                <li>Consider if course requirements need adjustment</li>
                            </ul>
                        </div>

                        <p style="color: #888; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px;">
                            This is an automated alert from SmartEdu Progress Tracking System.
                        </p>
                    </div>
                </div>
            `;

            // Get admin email (you can modify this to get it from a settings table or environment variable)
            const adminEmail = process.env.ADMIN_EMAIL_ID || 'rjmakwana1979@gmail.com';

            // Send email to admin
            await sendMail(
                adminEmail,
                `⚠️ Misuse Alert: User ${user.full_name} - ${redDotsCount} Red Dot Topics in ${course.title}`,
                `User ${user.full_name} (${user.username}) has ${redDotsCount} topics marked as Red (Insufficient Time) in course ${course.title}.`,
                emailHtml
            );

            return {
                triggered: true,
                sent: true,
                threshold,
                redDotsCount,
                adminEmail,
                userId: user.id,
                courseId: course.id,
                topicCount: topicsData.length,
            };
        }

        return {
            triggered: false,
            sent: false,
            threshold,
            redDotsCount,
            reason: 'threshold-not-met',
        };
    } catch (error) {
        console.error('Error checking and sending misuse mail:', error);
        // Don't throw error - log it but let the request continue
        return {
            triggered: false,
            sent: false,
            error: error?.message || 'unknown-error',
        };
    }
};

exports.markTopicAsCompleted = async (req, res, next) => {
    try {
        const { userId, courseId, topicId } = req.query;
        if (!userId || !courseId || !topicId) {
            return res.status(400).json({
                success: false,
                message: "User ID, Course ID and Topic ID are required",
            });
        }

        const alreadyCompletedContent = await checkProgressStatus({
            userId,
            courseId,
            topicId
        });

        // Call the procedure
        const result = await callProcedure("markTopicAsCompleted", [
            userId,
            courseId,
            topicId,
        ]);

        if (!result.success) {
            return next(result.error);
        }

        const response = result.data[0]; // first row

        let moduleStatus = null;
        let sessionCompletionStatus = null;
        let courseCompletionStatus = null;

        // Update the course completion percentage
        await callProcedure("calculateCourseCompletionFromAccessData", [userId, courseId]);

        // Check for misuse and capture debug result
        // const misuseMailDebug = await checkAndSendMisuseMail(userId, courseId);

        // Fire-and-Forget
        checkAndSendMisuseMail(userId, courseId);

        if (response.isLastTopic) {
            const moduleId = await Topic.findOne({ where: { id: topicId }, attributes: ['module_id'], raw: true });
            if (moduleId) {
                moduleStatus = await getModuleCompletionStatus(userId, courseId, moduleId.module_id);
                if (moduleStatus.isModuleCompleted === true && moduleStatus.sessionId) {
                    sessionCompletionStatus = await getSessionCompletionStatus(userId, courseId, moduleStatus.sessionId);
                    if (sessionCompletionStatus.sessionCompleted === true) {
                        courseCompletionStatus = await getCourseCompletionStatus(userId, courseId);
                    }
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: response.message,
            nextTopicId: response.nextTopicId,
            isLastTopic: !!response.isLastTopic,
            moduleStatus: { ...moduleStatus, moduleAlreadyCompleted: alreadyCompletedContent.moduleCompleted, isLastModule: alreadyCompletedContent?.module?.isLastModule },
            sessionCompletionStatus: { ...sessionCompletionStatus, sessionAlreadyCompleted: alreadyCompletedContent.sessionCompleted },
            courseCompletionStatus: { ...courseCompletionStatus, courseAlreadyCompleted: alreadyCompletedContent.courseCompleted },
        });
    } catch (error) {
        return next(error);
    }
};

exports.getTopicTypeById = async (req, res, next) => {
    try {
        const { topicId } = req.query;

        if (!topicId) {
            return res.status(400).json({
                success: false,
                message: "Topic ID is required",
            });
        }

        const result = await callProcedure("getTopicTypeById", [topicId]);

        if (!result.success) {
            return next(result.error);
        }

        const row = result.data[0]; // first row
        return res.status(200).json({
            success: true,
            topicType: row ? row.topicType : null,
        });

    } catch (error) {
        return next(error);
    }
};

exports.getDetailedTopicById = async (req, res, next) => {
    try {
        const { topicId } = req.query;

        if (!topicId) {
            return res.status(400).json({
                success: false,
                message: "Topic ID is required",
            });
        }

        // Call stored procedure
        const result = await callProcedureChallenge("getDetailedTopicById", [topicId]);

        if (!result.success) {
            return next(result.error);
        }

        const [topicRow, tags, maetrials, contentRows, attachments] = result.data;

        if (!topicRow || topicRow.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Topic not found",
            });
        }

        const topic = topicRow[0];
        topic.TopicTags = Object.values(tags) || [];
        topic.TopicMaterials = Object.values(maetrials) || [];

        // Attach content-type-specific details
        if (topic.content_type === "video") {
            topic.videoDetails = Object.values(contentRows) || [];
        } else if (topic.content_type === "audio") {
            topic.audioDetails = Object.values(contentRows) || [];
        } else if (topic.content_type === "accordian") {
            // attach accordion + nested attachments
            const accordions = Object.values(contentRows) || [];
            if (attachments && Object.values(attachments).length > 0) {
                accordions.forEach(acc => {
                    acc.AccordionAttachments = Object.values(attachments).filter(a => a.accordionId === acc.id);
                });
            }
            topic.accordianDetails = accordions;
        } else if (topic.content_type === "general") {
            // Attach general details with materials from 4th result set (attachments slot)
            const generalDetails = Object.values(contentRows) || [];
            // const mats = attachments ? Object.values(attachments) : [];
            // const byGeneral = mats.reduce((acc, m) => {
            //     const key = m.topic_id;
            //     if (!acc[key]) acc[key] = [];
            //     acc[key].push({ id: m.id, material_type: m.material_type, url: m.url });
            //     return acc;
            // }, {});
            // generalDetails.forEach(g => { g.materials = byGeneral[g.id] || []; });
            topic.generalDetails = generalDetails;
        }

        return res.status(200).json({
            success: true,
            topic,
        });
    } catch (error) {
        return next(error);
    }
};

exports.getSlideIdAndTitleByTopicId = async (req, res, next) => {
    try {
        const { topicId } = req.query;

        if (!topicId) {
            return res.status(400).json({
                success: false,
                message: "Topic ID is required",
            });
        }

        // Call stored procedure
        const result = await callProcedureChallenge("getSlideIdAndTitleByTopicId", [topicId]);

        if (!result.success) {
            return next(result.error);
        }

        const [topicData, slides] = result.data;

        return res.status(200).json({
            success: true,
            topicData: topicData[0] || null,
            slides: slides ? Object.values(slides) : [],
        });
    } catch (error) {
        return next(error);
    }
};

exports.getSlideContentBySlideId = async (req, res, next) => {
    try {
        const { slideId } = req.query;

        if (!slideId) {
            return res.status(400).json({
                success: false,
                message: "Slide ID is required",
            });
        }

        // Call stored procedure
        const result = await callProcedureChallenge("getSlideContentBySlideId", [slideId]);

        if (!result.success) {
            return next(result.error);
        }

        // Destructure result sets
        // uncomment to add Slide Type Audio
        // const [slideArr, topicTags, videoArr, audioArr, accordianArrRaw, generalArr, materialsArr] = result.data;

        const [slideArr, topicTags, videoArr, accordianArrRaw, materialsArr] = result.data;

        if (!slideArr || Object.values(slideArr).length === 0) {
            return res.status(404).json({
                success: false,
                message: "Slide not found",
            });
        }

        const slide = slideArr[0];

        slide.slideMaterials = Object.values(materialsArr) || [];


        // Attach topic tags
        slide.TopicTags = Object.values(topicTags) || [];

        // Attach type-specific details
        if (slide.type === "video") slide.videoDetails = videoArr[0] || null;
        // uncomment to add Slide Type Audio
        // if (slide.type === "audio") slide.audioDetails = audioArr[0] || null;

        if (slide.type === "accordian" && accordianArrRaw) {
            // Group attachments per accordion
            const accordionMap = {};
            Object.values(accordianArrRaw).forEach(row => {
                if (!accordionMap[row.id]) {
                    accordionMap[row.id] = {
                        id: row.id,
                        title: row.title,
                        body: row.body,
                        codeLanguage: row.codeLanguage,
                        code: row.code,
                        MultiSlideAccordionAttachments: [],
                    };
                }
                if (row.attachment_id) {
                    accordionMap[row.id].MultiSlideAccordionAttachments.push({
                        id: row.attachment_id,
                        fileUrl: row.fileUrl,
                        fileType: row.fileType,
                    });
                }
            });
            slide.accordianDetails = Object.values(accordionMap);
        }

        // if (slide.type === "general") {
        //     // Attach general slide details with materials from procedure
        //     const generalDetails = Object.values(generalArr) || [];
        //     const mats = materialsArr ? Object.values(materialsArr) : [];
        //     const bySlideGeneral = (mats || []).reduce((acc, m) => {
        //         const key = m.slide_general_id;
        //         if (!acc[key]) acc[key] = [];
        //         acc[key].push({ id: m.id, material_type: m.material_type, url: m.url });
        //         return acc;
        //     }, {});
        //     generalDetails.forEach(g => { g.materials = bySlideGeneral[g.id] || []; });
        //     slide.generalDetails = generalDetails;
        // }

        return res.status(200).json({
            success: true,
            slide,
        });
    } catch (error) {
        return next(error);
    }
};

exports.getAccordianStatusByTopicId = async (req, res, next) => {
    try {
        const { userId, topicId } = req.query;

        if (!userId || !topicId) {
            return res.status(400).json({
                success: false,
                message: "User ID and Topic ID are required",
            });
        }

        const result = await callProcedure(
            "getAccordianStatusByTopicId",
            [parseInt(userId, 10), parseInt(topicId, 10)]
        );

        if (!result.success) {
            return next(result.error);
        }

        const accordianStatus = result.data; // first result set

        if (accordianStatus.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No accordians found for this topic",
                accordianStatus: [],
            });
        }

        return res.status(200).json({
            success: true,
            accordianStatus
        });

    } catch (error) {
        return next(error);
    }
};

exports.getSlideStatusByTopicId = async (req, res, next) => {
    try {
        const { userId, topicId } = req.query;

        if (!userId || !topicId) {
            return res.status(400).json({
                success: false,
                message: "User ID and Topic ID are required",
            });
        }

        // Call stored procedure
        const result = await callProcedure("getSlideStatusByTopicId", [
            parseInt(userId),
            parseInt(topicId)
        ]);

        if (!result.success) {
            return next(result.error);
        }

        return res.status(200).json({
            success: true,
            slideStatus: result.data || []
        });
    } catch (error) {
        return next(error);
    }
};

exports.updateSlideCompletionStatus = async (req, res, next) => {
    try {
        const { user_id, topic_id, slide_id, completion_status } = req.body;

        if (!user_id || !topic_id || !slide_id || !completion_status) {
            return res.status(400).json({
                success: false,
                message: "User ID, Topic ID, Slide ID and Completion Status are required",
            });
        }

        const result = await callProcedure("updateSlideCompletionStatus", [
            parseInt(user_id),
            parseInt(topic_id),
            parseInt(slide_id),
            completion_status
        ]);

        if (!result.success) {
            return next(result.error);
        }

        return res.status(200).json({
            success: true,
            message: "Slide completion status updated successfully",
            data: result.data[0] || {}
        });

    } catch (error) {
        return next(error)
    }
};

exports.trackStudentTimeSpentOnTopic = async (req, res, next) => {
    try {
        const {
            user_id,
            course_id,
            session_id,
            module_id,
            topic_id,
            accordian_id,
            slide_id,
            time_spent,
            timer_time,
            completion_status,
            include_in_first_completion,
            finalize_first_completion,
        } = req.body;

        const includeInFirstCompletionFlag =
            typeof include_in_first_completion === 'undefined'
                ? 1
                : (include_in_first_completion ? 1 : 0);
        const finalizeFirstCompletionFlag = finalize_first_completion ? 1 : 0;

        if (!user_id || !course_id || !topic_id) {
            return res.status(400).json({
                success: false,
                message: "user_id, course_id and topic_id are required",
            });
        }

        const result = await callProcedure(
            "trackStudentTimeSpentOnTopic",
            [
                user_id,
                course_id,
                session_id || null,
                module_id || null,
                topic_id,
                accordian_id || null,
                slide_id || null,
                parseInt(time_spent, 10) || 0,
                parseInt(timer_time, 10) || 0,
                completion_status || null,
                includeInFirstCompletionFlag,
                finalizeFirstCompletionFlag,
            ]
        );

        if (!result.success) {
            return next(result.error);
        }

        return res.status(200).json({
            success: true,
            message: "Time tracking updated successfully",
            data: result.data[0], // first result set, first row
        });
    } catch (error) {
        return next(error);
    }
};

exports.createAccordianProgressRecordsForTopic = async (req, res, next) => {
    try {
        const {
            user_id,
            course_id,
            session_id,
            module_id,
            topic_id,
            accordian_id,
            slide_id,
            time_spent,
            timer_time,
            completion_status,
        } = req.body;

        if (!user_id || !course_id || !topic_id) {
            return res.status(400).json({
                success: false,
                message: "user_id, course_id and topic_id are required",
            });
        }

        const result = await callProcedure(
            "createAccordianProgressRecordsForTopic",
            [
                user_id,
                course_id,
                session_id || null,
                module_id || null,
                topic_id,
                accordian_id || null,
                slide_id || null,
                parseInt(time_spent, 10) || 0,
                parseInt(timer_time, 10) || 0,
                completion_status || "not_started",
            ]
        );

        if (!result.success) {
            return next(result.error);
        }

        return res.status(200).json({
            success: true,
            message: "Time tracking updated successfully",
            data: result.data[0], // first result set, first row
        });

    } catch (error) {
        return next(error);
    }
};

exports.createSlideProgressRecordsForTopic = async (req, res, next) => {
    try {
        const {
            user_id,
            course_id,
            session_id,
            module_id,
            topic_id,
            slide_id,
            time_spent,
            timer_time,
            completion_status,
        } = req.body;

        if (!user_id || !course_id || !topic_id || !slide_id) {
            return res.status(400).json({
                success: false,
                message: "User ID, Course ID, Topic ID, and Slide ID are required",
            });
        }

        // Call stored procedure
        const result = await callProcedure(
            "createSlideProgressRecordsForTopic",
            [
                parseInt(user_id),
                parseInt(course_id),
                parseInt(session_id) || null,
                parseInt(module_id) || null,
                parseInt(topic_id),
                parseInt(slide_id),
                parseInt(time_spent) || 0,
                parseInt(timer_time) || 0,
                completion_status
            ]
        );

        if (!result.success) {
            return next(result.error);
        }

        return res.status(200).json({
            success: true,
            message: "Slide progress record created or fetched successfully",
            data: result.data[0], // newly created or existing record
        });
    } catch (error) {
        return next(error)
    }
};

exports.updateAccordianCompletionStatus = async (req, res, next) => {
    try {
        const { user_id, topic_id, accordian_id, completion_status } = req.body;

        if (!user_id || !topic_id || !accordian_id || !completion_status) {
            return res.status(400).json({
                success: false,
                message: "User ID, Topic ID, Accordian ID and Completion Status are required",
            });
        }

        const result = await callProcedure(
            "updateAccordianCompletionStatus",
            [parseInt(user_id), parseInt(topic_id), parseInt(accordian_id), completion_status]
        );

        if (!result.success) {
            return next(result.error);
        }

        // Destructure to separate next_accordian_id from the rest of the record
        const { next_accordian_id, ...record } = result.data[0] || {};

        return res.status(200).json({
            success: true,
            message: "Accordion completion status updated successfully",
            data: record, // only the actual progress record
            next_accordian_id: next_accordian_id || null // keep it outside
        });

    } catch (error) {
        return next(error)
    }
};

exports.getCourseCompletionProgress = async (req, res, next) => {
    try {
        const { userId, courseId } = req.query;

        if (!userId || !courseId) {
            return res.status(400).json({
                success: false,
                message: "User ID and Course ID are required",
            });
        }

        const result = await callProcedure("getCourseCompletionProgress", [
            parseInt(userId, 10),
            parseInt(courseId, 10)
        ]);

        if (!result.success) {
            return next(result.error);
        }

        return res.status(200).json({
            success: true,
            progress: result.data[0]?.progress_percentage || 0,
            // total_items: result.data[0]?.total_items || 0,
            // completed_items: result.data[0]?.completed_items || 0
        });

    } catch (error) {
        return next(error);
    }
};

exports.getCourseFullDetails = async (req, res, next) => {
    try {
        const { userId, courseId } = req.query;

        if (!userId || !courseId) {
            return res.status(400).json({
                success: false,
                message: "User ID and Course ID are required",
            });
        }

        const result = await callProcedure("getFullAccessibleCourseData", [
            parseInt(userId, 10),
            parseInt(courseId, 10)
        ]);

        if (!result.success) {
            return next(result.error);
        }

        return res.status(200).json({
            success: true,
            data: result.data[0]
        });

    } catch (error) {
        return next(error);
    }
};