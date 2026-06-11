const PerformanceFeedback = require('../../models/aiStudentPerformanceTracking/performanceFeedback');
const Module = require('../../models/course_management/module');
const Course = require('../../models/course_management/course');
const Topic = require('../../models/course_management/topic');
const User = require('../../models/auth/user');
const { Op, fn, col, literal } = require('sequelize');
const ProgressTracking = require('../../models/learning_progress/progressTracking');
const { enrollments } = require('../../models/enrollment_management/enrollment_management');
const QuizCompletion = require('../../models/learning_progress/quizCompletion');
const { callProcedure } = require('../../utils/procedure/callProcedure');
const { callProcedureChallenge } = require('../../utils/procedure/callProcedureChallenge');

/**
 * Format time spent from seconds to a human-readable format
 * @param {number} timeInSeconds - Time spent in seconds
 * @returns {string} - Formatted time string (e.g., "2 hours 30 minutes")
 */
function formatTimeSpent(timeInSeconds) {
    // Ensure we have a valid number
    const validSeconds = Math.max(0, Math.round(timeInSeconds || 0));

    // For very short times (less than a minute), show seconds
    if (validSeconds < 60) {
        return `${validSeconds} second${validSeconds !== 1 ? 's' : ''}`;
    }

    const minutes = Math.floor(validSeconds / 60);

    // For times less than an hour, show just minutes
    if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    // For longer times, show hours and minutes
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours} hour${hours !== 1 ? 's' : ''}${remainingMinutes > 0 ? ` ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}` : ''}`;
}

/**
 * Get overall student performance analytics with filtering options
 */
exports.getStudentAnalytics = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { courseId, moduleId, topicId, version } = req.query;

        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required' });
        }

        // Check if student exists
        const { success: studentSuccess, data: studentData, error: studentError } = await callProcedure('getUserById', [studentId]);

        if (!studentSuccess) {
            return res.status(404).json({ message: 'Student not found', error: studentError });
        }

        const student = studentData[0];

        const { success, data: allVersions, error } = await callProcedure('getAllVersionsForStudentAnalytics', [studentId]);

        if (!success) {
            return res.status(500).json({ message: 'Failed to fetch available versions', error });
        }

        // Group versions by module
        const versionsByModule = {};
        allVersions.forEach(v => {
            const moduleId = v.module_id;
            if (!versionsByModule[moduleId]) {
                versionsByModule[moduleId] = {
                    moduleId: moduleId,
                    moduleTitle: v.Module?.title || 'Unknown Module',
                    courseId: v.course_id,
                    courseTitle: v.Course?.title || 'Unknown Course',
                    versions: []
                };
            }

            versionsByModule[moduleId].versions.push({
                version: v.version,
                isCurrent: v.is_current,
                created_at: v.created_at
            });
        });

        const studentIdParam = parseInt(studentId);
        const courseIdParam = courseId ? parseInt(courseId) : null;
        const moduleIdParam = moduleId ? parseInt(moduleId) : null;
        const versionParam = version || 'latest';

        const { success: feedbackSuccess, data: feedbackEntries, error: feedbackError } =
            await callProcedure('getFeedbackEntriesForStudentAnalytics', [
                studentIdParam,
                courseIdParam,
                moduleIdParam,
                versionParam
            ]);

        if (!feedbackSuccess) {
            return res.status(500).json({ message: 'Failed to fetch feedback entries', error: feedbackError });
        }

        if (feedbackEntries.length === 0) {
            return res.status(200).json({
                message: 'No feedback records found for the selected filters',
                student: {
                    id: student.id,
                    name: student.full_name,
                    email: student.email
                },
                availableVersions: allVersions.map(v => ({
                    version: v.version,
                    isCurrent: v.is_current,
                    created_at: v.created_at,
                    moduleId: v.module_id,
                    moduleTitle: v.Module?.title || 'Unknown Module',
                    courseId: v.course_id,
                    courseTitle: v.Course?.title || 'Unknown Course'
                })),
                versionsByModule: Object.values(versionsByModule),
                currentVersion: version || 'latest',
                data: []
            });
        }

        // Process data for visualization and analysis
        const processedData = {
            versionAnalysis: {},
            courseAnalysis: {},
            moduleAnalysis: [],
            performanceTrend: []
        };

        // Process data for version analysis
        const versionMap = {};
        feedbackEntries.forEach(entry => {
            const version = entry.version;
            if (!versionMap[version]) {
                versionMap[version] = {
                    version,
                    count: 0,
                    feedbackEntries: []
                };
            }
            versionMap[version].count++;
            versionMap[version].feedbackEntries.push({
                id: entry.id,
                courseId: entry.course_id,
                courseTitle: entry.Course?.title || 'Unknown Course',
                moduleId: entry.module_id,
                moduleTitle: entry.Module?.title || 'Unknown Module',
                created_at: entry.created_at
            });
        });
        processedData.versionAnalysis = Object.values(versionMap);

        // Process data for course analysis
        const courseMap = {};
        feedbackEntries.forEach(entry => {
            const courseId = entry.course_id;
            if (!courseMap[courseId]) {
                courseMap[courseId] = {
                    courseId,
                    courseTitle: entry.Course?.title || 'Unknown Course',
                    feedbackCount: 0,
                    modules: {}
                };
            }
            courseMap[courseId].feedbackCount++;

            // Add module info to this course
            const moduleId = entry.module_id;
            if (!courseMap[courseId].modules[moduleId]) {
                courseMap[courseId].modules[moduleId] = {
                    moduleId,
                    moduleTitle: entry.Module?.title || 'Unknown Module',
                    feedbackCount: 0
                };
            }
            courseMap[courseId].modules[moduleId].feedbackCount++;
        });

        // Convert modules objects to arrays
        Object.keys(courseMap).forEach(courseId => {
            courseMap[courseId].modules = Object.values(courseMap[courseId].modules);
        });
        processedData.courseAnalysis = Object.values(courseMap);

        // Process module-level feedback data for graph visualization
        const moduleMap = {};
        feedbackEntries.forEach(entry => {
            const moduleId = entry.module_id;
            if (!moduleMap[moduleId]) {
                moduleMap[moduleId] = {
                    moduleId,
                    moduleTitle: entry.Module?.title || 'Unknown Module',
                    courseId: entry.course_id,
                    courseTitle: entry.Course?.title || 'Unknown Course',
                    versions: {},
                    scores: [],
                    topicScores: {}
                };
            }

            const version = entry.version;
            if (entry.feedback_data && typeof entry.feedback_data === 'object') {
                const feedbackData = entry.feedback_data;
                let weakTopicsCount = 0;
                let strongTopicsCount = 0;
                let totalTopics = 0;
                let moduleScore = 0;

                // Check if we have the new format with topics array
                if (Array.isArray(feedbackData.topics)) {
                    totalTopics = feedbackData.topics.length;
                    weakTopicsCount = feedbackData.topics.filter(t => t.topic_score < 50).length;
                    strongTopicsCount = feedbackData.topics.filter(t => t.topic_score >= 50).length;

                    // Check if module_score is available directly
                    if (feedbackData.module_score) {
                        moduleScore = feedbackData.module_score;
                    } else {
                        // Calculate average score from topics
                        const totalScore = feedbackData.topics.reduce((sum, topic) => sum + topic.topic_score, 0);
                        moduleScore = totalTopics > 0 ? Math.round(totalScore / totalTopics) : 0;
                    }
                } else {
                    // Check if feedback is in a nested structure
                    const feedbackSource = feedbackData.feedback || feedbackData;
                    weakTopicsCount = feedbackSource.weak_topics?.length || 0;
                    strongTopicsCount = feedbackSource.strong_topics?.length || 0;
                    totalTopics = weakTopicsCount + strongTopicsCount;
                    moduleScore = totalTopics > 0 ? Math.round((strongTopicsCount / totalTopics) * 100) : 0;
                }

                const scoreData = {
                    version,
                    timestamp: entry.created_at,
                    weakTopicsCount,
                    strongTopicsCount,
                    totalTopics,
                    scorePercentage: moduleScore
                };

                moduleMap[moduleId].versions[version] = scoreData;
                moduleMap[moduleId].scores.push(scoreData);

                // Extract topic-level score data
                if (Array.isArray(feedbackData.topics)) {
                    feedbackData.topics.forEach(topic => {
                        if (!moduleMap[moduleId].topicScores[topic.title]) {
                            moduleMap[moduleId].topicScores[topic.title] = [];
                        }
                        moduleMap[moduleId].topicScores[topic.title].push({
                            version,
                            timestamp: entry.created_at,
                            score: topic.topic_score || 0,
                            timeSpent: Math.round(topic.topic_time_spent / 60) || 0,
                            status: topic.topic_score < 50 ? 'weak' : 'strong',
                            skill: topic.topic_skill || 'Not Assessed'
                        });
                    });
                } else {
                    const feedbackSource = feedbackData.feedback || feedbackData;

                    // Process weak topics (old format)
                    if (Array.isArray(feedbackSource.weak_topics)) {
                        feedbackSource.weak_topics.forEach(topic => {
                            if (!moduleMap[moduleId].topicScores[topic.title]) {
                                moduleMap[moduleId].topicScores[topic.title] = [];
                            }
                            moduleMap[moduleId].topicScores[topic.title].push({
                                version,
                                timestamp: entry.created_at,
                                score: topic.score || 0,
                                timeSpent: topic.timeSpentMinutes || 0,
                                status: 'weak'
                            });
                        });
                    }

                    // Process strong topics (old format)
                    if (Array.isArray(feedbackSource.strong_topics)) {
                        feedbackSource.strong_topics.forEach(topic => {
                            if (!moduleMap[moduleId].topicScores[topic.title]) {
                                moduleMap[moduleId].topicScores[topic.title] = [];
                            }
                            moduleMap[moduleId].topicScores[topic.title].push({
                                version,
                                timestamp: entry.created_at,
                                score: topic.score || 0,
                                timeSpent: topic.timeSpentMinutes || 0,
                                status: 'strong'
                            });
                        });
                    }
                }
            }
        });

        // Format module analysis data for graphs and UI display
        processedData.moduleAnalysis = Object.values(moduleMap).map(module => {
            // Sort scores by version/timestamp
            module.scores.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            // Format topic scores for graphing
            const formattedTopicScores = {};
            Object.keys(module.topicScores).forEach(topicTitle => {
                const topicData = module.topicScores[topicTitle];
                // Sort by version/timestamp
                topicData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                formattedTopicScores[topicTitle] = topicData;
            });

            return {
                moduleId: module.moduleId,
                moduleTitle: module.moduleTitle,
                courseId: module.courseId,
                courseTitle: module.courseTitle,
                versions: module.versions,
                scores: module.scores,
                scoreHistory: module.scores.map(score => ({
                    version: score.version,
                    timestamp: score.timestamp,
                    score: score.scorePercentage
                })),
                topicScores: formattedTopicScores,
                topicScoreHistory: Object.keys(formattedTopicScores).map(topicTitle => ({
                    topicTitle: topicTitle,
                    history: formattedTopicScores[topicTitle].map(item => ({
                        version: item.version,
                        timestamp: item.timestamp,
                        score: item.score,
                        status: item.status
                    }))
                })),
                latestScore: module.scores.length > 0
                    ? module.scores[module.scores.length - 1].scorePercentage
                    : 0,
                improvement: module.scores.length >= 2
                    ? module.scores[module.scores.length - 1].scorePercentage - module.scores[0].scorePercentage
                    : 0
            };
        });

        // Extract performance trend over time
        feedbackEntries.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        processedData.performanceTrend = feedbackEntries.map(entry => {
            // Parse feedback data to extract scores if available
            let weakTopicsCount = 0;
            let strongTopicsCount = 0;
            let moduleScore = 0;

            if (entry.feedback_data && typeof entry.feedback_data === 'object') {
                const feedbackData = entry.feedback_data;

                // Check if we have the new format with topics array
                if (Array.isArray(feedbackData.topics)) {
                    weakTopicsCount = feedbackData.topics.filter(t => t.topic_score < 50).length;
                    strongTopicsCount = feedbackData.topics.filter(t => t.topic_score >= 50).length;

                    // Check if module_score is available directly
                    if (feedbackData.module_score) {
                        moduleScore = feedbackData.module_score;
                    } else {
                        // Calculate average score from topics
                        const totalScore = feedbackData.topics.reduce((sum, topic) => sum + topic.topic_score, 0);
                        moduleScore = feedbackData.topics.length > 0 ? Math.round(totalScore / feedbackData.topics.length) : 0;
                    }
                } else {
                    // Check if feedback is in a nested structure
                    const feedbackSource = feedbackData.feedback || feedbackData;
                    weakTopicsCount = feedbackSource.weak_topics?.length || 0;
                    strongTopicsCount = feedbackSource.strong_topics?.length || 0;

                    // Calculate module score based on ratio of strong topics
                    const totalTopics = weakTopicsCount + strongTopicsCount;
                    moduleScore = totalTopics > 0 ? Math.round((strongTopicsCount / totalTopics) * 100) : 0;
                }
            }

            return {
                id: entry.id,
                date: entry.created_at,
                version: entry.version,
                courseId: entry.course_id,
                courseTitle: entry.Course?.title || 'Unknown Course',
                moduleId: entry.module_id,
                moduleTitle: entry.Module?.title || 'Unknown Module',
                weakTopicsCount,
                strongTopicsCount,
                totalTopics: weakTopicsCount + strongTopicsCount,
                moduleScore: moduleScore,
                ratio: weakTopicsCount + strongTopicsCount > 0
                    ? (strongTopicsCount / (weakTopicsCount + strongTopicsCount)) * 100
                    : 0
            };
        });

        return res.status(200).json({
            message: 'Student analytics retrieved successfully',
            student: {
                id: student.id,
                name: student.full_name,
                email: student.email
            },
            availableVersions: allVersions.map(v => ({
                version: v.version,
                isCurrent: v.is_current,
                created_at: v.created_at,
                moduleId: v.module_id,
                moduleTitle: v.Module?.title || 'Unknown Module',
                courseId: v.course_id,
                courseTitle: v.Course?.title || 'Unknown Course'
            })),
            versionsByModule: Object.values(versionsByModule),
            currentVersion: version || 'latest',
            data: processedData,
            count: feedbackEntries.length
        });
    } catch (error) {
        console.error('Error retrieving student analytics:', error);
        return res.status(500).json({
            message: 'Failed to retrieve student analytics',
            error: error.message
        });
    }
};

/**
 * Get detailed version comparison for a student's performance
 */
exports.getVersionComparison = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { courseId, moduleId, version1, version2 } = req.query;


        if (!studentId || !moduleId) {
            return res.status(400).json({ message: 'Student ID , Module ID is required' });
        }

        if (!version1 || !version2) {
            return res.status(400).json({
                message: 'Two versions for comparison are required',
                receivedParams: {
                    version1: version1,
                    version2: version2,
                    query: req.query
                }
            });
        }

        // Check if student exists
        const { success: studentSuccess, data: studentData, error: studentError } = await callProcedure('getUserById', [studentId]);

        if (!studentSuccess) {
            return res.status(404).json({ message: 'Student not found', error: studentError });
        }

        const student = studentData[0];

        // Parse versions to make sure they're treated as integers
        const v1 = parseInt(version1);
        const v2 = parseInt(version2);

        // If both courseId and moduleId are provided, this ensures we're comparing 
        // versions from exactly the same module and course
        // If either courseId or moduleId is missing, we need to ensure we're comparing
        // the same module's versions, so we need additional validation later

        const userId = parseInt(studentId);
        const courseIdParam = courseId ? parseInt(courseId) : null;
        const moduleIdParam = moduleId ? parseInt(moduleId) : null;

        // Get feedback entries for the specified versions
        const { success: feedbackSuccess, data: versionFeedback, error: feedbackError } = await callProcedure('getPerformanceFeedbackVersions', [userId, v1, v2, courseIdParam, moduleIdParam]);
        if (!feedbackSuccess) {
            return res.status(500).json({ message: 'Failed to fetch feedback versions', error: feedbackError });
        }


        // Group by version - ensure we keep the requested order from parameters
        let firstVersionFeedback = versionFeedback.filter(f => f.version === v1);
        let secondVersionFeedback = versionFeedback.filter(f => f.version === v2);



        if (firstVersionFeedback.length === 0 || secondVersionFeedback.length === 0) {
            return res.status(404).json({
                message: 'Could not find feedback data for one or both of the specified versions',
                v1Found: firstVersionFeedback.length > 0,
                v2Found: secondVersionFeedback.length > 0
            });
        }

        // If courseId and moduleId weren't specified in the query, ensure we're comparing versions from the same module
        if (!moduleId && firstVersionFeedback.length > 0 && secondVersionFeedback.length > 0) {
            // Group feedback by module to ensure we compare the right versions
            const v1ModuleIds = [...new Set(firstVersionFeedback.map(f => f.module_id))];
            const v2ModuleIds = [...new Set(secondVersionFeedback.map(f => f.module_id))];

            // Find common modules between both versions
            const commonModuleIds = v1ModuleIds.filter(id => v2ModuleIds.includes(id));

            if (commonModuleIds.length === 0) {
                return res.status(400).json({
                    message: 'Cannot compare versions across different modules. Please specify a moduleId.',
                    v1Modules: v1ModuleIds,
                    v2Modules: v2ModuleIds
                });
            } else if (commonModuleIds.length > 1) {
                // If multiple common modules, we need a specific moduleId to know which one to compare
                return res.status(400).json({
                    message: 'Found multiple common modules between versions. Please specify a moduleId.',
                    commonModules: commonModuleIds
                });
            } else {
                // If exactly one common module, filter to only include feedback for that module
                const commonModuleId = commonModuleIds[0];
                // Use let-declared variables or create new variables for filtered feedback
                const filteredFirstVersionFeedback = firstVersionFeedback.filter(f => f.module_id === commonModuleId);
                const filteredSecondVersionFeedback = secondVersionFeedback.filter(f => f.module_id === commonModuleId);

                // Replace the original arrays with the filtered ones
                firstVersionFeedback = filteredFirstVersionFeedback;
                secondVersionFeedback = filteredSecondVersionFeedback;
            }
        }

        // Extract topic details from both versions - maintain requested order
        const firstVersionTopics = extractTopicDetails(firstVersionFeedback);
        const secondVersionTopics = extractTopicDetails(secondVersionFeedback);

        // Compare the two versions - maintain requested order from URL parameters
        const comparison = {
            version1: {
                version: v1,
                timestamp: firstVersionFeedback.length > 0 ? firstVersionFeedback[0].created_at : null,
                coursesCount: new Set(firstVersionFeedback.map(f => f.course_id)).size,
                modulesCount: firstVersionFeedback.length,
                topicBreakdown: analyzeTopics(firstVersionFeedback),
                topics: firstVersionTopics
            },
            version2: {
                version: v2,
                timestamp: secondVersionFeedback.length > 0 ? secondVersionFeedback[0].created_at : null,
                coursesCount: new Set(secondVersionFeedback.map(f => f.course_id)).size,
                modulesCount: secondVersionFeedback.length,
                topicBreakdown: analyzeTopics(secondVersionFeedback),
                topics: secondVersionTopics
            },
            requestedOrder: {
                version1: v1,
                version2: v2
            },
            improvement: {}
        };

        // Calculate improvement metrics - ensure we handle missing data gracefully
        if (comparison.version1.timestamp && comparison.version2.timestamp) {
            const v1TB = comparison.version1.topicBreakdown;
            const v2TB = comparison.version2.topicBreakdown;

            comparison.improvement = {
                timeDifference: Math.floor((new Date(comparison.version2.timestamp) - new Date(comparison.version1.timestamp)) / (1000 * 60 * 60 * 24)), // days
                strongTopicsChange: (v2TB.strongTopicsCount || 0) - (v1TB.strongTopicsCount || 0),
                weakTopicsChange: (v2TB.weakTopicsCount || 0) - (v1TB.weakTopicsCount || 0),
                scoreChange: (v2TB.averageModuleScore || 0) - (v1TB.averageModuleScore || 0),
                overallImprovement: (((v2TB.strongTopicsRatio || 0) - (v1TB.strongTopicsRatio || 0)) * 100).toFixed(2) + '%',
                topicComparison: compareTopics(comparison.version1.topics, comparison.version2.topics)
            };
        } else {
            comparison.improvement = {
                error: "Cannot calculate improvements - one or both versions missing timestamp data",
                available: false
            };
        }

        return res.status(200).json({
            message: 'Version comparison retrieved successfully',
            student: {
                id: student.id,
                name: student.full_name
            },
            comparison
        });
    } catch (error) {
        console.error('Error retrieving version comparison:', error);
        return res.status(500).json({
            message: 'Failed to retrieve version comparison',
            error: error.message
        });
    }
};

/**
 * Get module-level completion status and analytics for a student
 */
exports.getModuleCompletion = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { courseId } = req.query;

        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required' });
        }

        if (!courseId) {
            return res.status(400).json({ message: 'Course ID is required' });
        }

        // Check if student exists
        const { success: studentSuccess, data: studentData, error: studentError } = await callProcedure('getUserById', [studentId]);

        if (!studentSuccess) {
            return res.status(404).json({ message: 'Student not found', error: studentError });
        }

        const student = studentData[0];

        // Check if course exists with proper type handling
        const parsedCourseId = parseInt(courseId);
        const { success: courseSuccess, data: courseData, error: courseError } = await callProcedure('getCourseByCourseId', [parsedCourseId]);

        if (!courseSuccess) {
            return res.status(404).json({ message: 'Course not found', error: courseError });
        }

        const course = courseData[0];

        const { success: enrollmentSuccess, data: enrollmentData, error: enrollmentError } = await callProcedure('getStudentEnrollmentInCourse', [studentId, courseId]);
        if (!enrollmentSuccess) {
            return res.status(404).json({ message: 'Student is not enrolled in this course', error: enrollmentError });
        }

        const enrollment = enrollmentData[0];

        // Get all modules for the course
        const { success: modulesSuccess, data: modulesData, error: modulesError } = await callProcedure('getModulesByCourse', [courseId]);
        if (!modulesSuccess) {
            return res.status(404).json({ message: 'No modules found for this course', error: modulesError });
        }
        const modules = modulesData;


        if (modules.length === 0) {
            return res.status(200).json({
                message: 'No modules found for this course',
                course: {
                    id: course.id,
                    title: course.title
                },
                student: {
                    id: student.id,
                    name: student.full_name
                },
                enrollment: enrollment,
                modules: []
            });
        }

        // Get module IDs
        const moduleIds = modules.map(module => module.id);

        // Get progress tracking for these modules
        const moduleIdsJson = JSON.stringify(moduleIds);

        const { success: moduleProgressSuccess, data: moduleProgressData, error: moduleProgressError } = await callProcedure('getProgressTrackingbyModule', [enrollment.id, moduleIdsJson]);
        if (!moduleProgressSuccess) {
            return res.status(404).json({ message: 'No module progress found for this course', error: moduleProgressError });
        }
        // Get topic-level progress tracking for more accurate time spent calculations
        const { success: topicProgressSuccess, data: topicProgressData, error: topicProgressError } =
            await callProcedure(
                'getProgressTrackingbyTopic',
                [enrollment.id, moduleIdsJson]);
        if (!topicProgressSuccess) {
            return res.status(404).json({ message: 'No topic progress found for this course', error: topicProgressError });
        }

        // Get topics for the modules
        const topicIds = topicProgressData.map(t => t.topic_id).filter(id => id !== null);

        const topicIdsJson = JSON.stringify(topicIds);
        const { success: topicsSuccess, data: topicsData, error: topicsError } = await callProcedure('getTopicsByIds', [topicIdsJson]);
        if (!topicsSuccess) {
            return res.status(404).json({ message: 'No topics found for this course', error: topicsError });
        }

        const topics = topicsData;


        // Create topic lookup map
        const topicMap = {};
        topics.forEach(topic => {
            topicMap[topic.id] = {
                id: topic.id,
                title: topic.title,
                moduleId: topic.module_id
            };
        });

        // Get quiz completions for these modules
        const { success: quizCompletionSuccess, data: quizCompletions, error: quizCompletionError } = await callProcedure('getQuizCompletionsForModule', [studentId, moduleIdsJson]);
        if (!quizCompletionSuccess) {
            return res.status(404).json({ message: 'No quiz completions found for this course', error: quizCompletionError });
        }


        // Create a map of quiz completions by module
        const { success: performanceFeedbackSuccess, data: performanceFeedback, error: performanceFeedbackError } = await callProcedure('getPerformanceFeedbackForModules', [studentId, courseId, moduleIdsJson]);
        if (!performanceFeedbackSuccess) {
            return res.status(404).json({ message: 'No performance feedback found for this course', error: performanceFeedbackError });
        }

        
        // Create a map of module progress
        const moduleProgressMap = {};
        moduleProgressData.forEach(progress => {
            moduleProgressMap[progress.module_id] = {
                completionStatus: progress.completion_status,
                moduleTimeSpent: progress.student_time_spent || 0, // Direct module time
                lastAccessed: progress.last_accessed,
                revisionCount: progress.revision_count || 0,
                completedAt: progress.completed_at,
                topics: [], // Will be filled with topic data
                topicTotalTimeSpent: 0 // Will be calculated from topics
            };
        });

        // Group topic progress by module and calculate topic-level time spent
        topicProgressData.forEach(topicProgress => {
            const moduleId = topicProgress.module_id;
            const topicId = topicProgress.topic_id;

            // Create module entry if it doesn't exist (for cases where we have topic data but no module data)
            if (!moduleProgressMap[moduleId]) {
                moduleProgressMap[moduleId] = {
                    completionStatus: 'in_progress', // Default status
                    moduleTimeSpent: 0,
                    lastAccessed: topicProgress.last_accessed,
                    revisionCount: 0,
                    completedAt: null,
                    topics: [],
                    topicTotalTimeSpent: 0
                };
            }

            // Get topic title
            const topicInfo = topicMap[topicId] || { id: topicId, title: 'Unknown Topic' };

            // Add topic to module's topic list
            moduleProgressMap[moduleId].topics.push({
                id: topicId,
                title: topicInfo.title,
                timeSpent: topicProgress.student_time_spent || 0,
                status: topicProgress.completion_status,
                lastAccessed: topicProgress.last_accessed,
                completedAt: topicProgress.completed_at
            });

            // Add to the module's topic total time
            moduleProgressMap[moduleId].topicTotalTimeSpent += (topicProgress.student_time_spent || 0);

            // Update module last accessed time if the topic was accessed more recently
            if (topicProgress.last_accessed && (!moduleProgressMap[moduleId].lastAccessed ||
                new Date(topicProgress.last_accessed) > new Date(moduleProgressMap[moduleId].lastAccessed))) {
                moduleProgressMap[moduleId].lastAccessed = topicProgress.last_accessed;
            }
        });

        // Create a map of module quiz completions
        const moduleQuizMap = {};
        quizCompletions.forEach(quiz => {
            moduleQuizMap[quiz.module_id] = {
                score: quiz.score || 0,
                isCompleted: quiz.isCompleted || false
            };
        });

        // Create a map of module performance feedback
        const moduleFeedbackMap = {};
        performanceFeedback.forEach(feedback => {
            const feedbackData = feedback.feedback_data;
            let weakTopicsCount = 0;
            let strongTopicsCount = 0;
            let moduleScore = 0;

            if (feedbackData && typeof feedbackData === 'object') {
                // Check if we have the new format with topics array
                if (Array.isArray(feedbackData.topics)) {
                    weakTopicsCount = feedbackData.topics.filter(t => t.topic_score < 50).length;
                    strongTopicsCount = feedbackData.topics.filter(t => t.topic_score >= 50).length;

                    // Check if module_score is available directly
                    if (feedbackData.module_score !== undefined) {
                        moduleScore = feedbackData.module_score;
                    } else {
                        // Calculate average score from topics
                        const totalScore = feedbackData.topics.reduce((sum, topic) => sum + topic.topic_score, 0);
                        moduleScore = feedbackData.topics.length > 0 ? Math.round(totalScore / feedbackData.topics.length) : 0;
                    }
                } else {
                    // Check if feedback is in a nested structure
                    const feedbackSource = feedbackData.feedback || feedbackData;
                    weakTopicsCount = feedbackSource.weak_topics?.length || 0;
                    strongTopicsCount = feedbackSource.strong_topics?.length || 0;

                    // Calculate module score based on ratio of strong topics
                    const totalTopics = weakTopicsCount + strongTopicsCount;
                    moduleScore = totalTopics > 0 ? Math.round((strongTopicsCount / totalTopics) * 100) : 0;
                }
            }

            moduleFeedbackMap[feedback.module_id] = {
                weakTopicsCount,
                strongTopicsCount,
                totalTopics: weakTopicsCount + strongTopicsCount,
                moduleScore,
                hasFeedback: true
            };
        });

        // Combine all data for each module
        const moduleAnalytics = modules.map(module => {
            const progress = moduleProgressMap[module.id] || {
                completionStatus: 'not_started',
                moduleTimeSpent: 0,
                topicTotalTimeSpent: 0,
                topics: [],
                lastAccessed: null,
                revisionCount: 0,
                completedAt: null
            };

            const quiz = moduleQuizMap[module.id] || {
                score: 0,
                isCompleted: false
            };

            const feedback = moduleFeedbackMap[module.id] || {
                weakTopicsCount: 0,
                strongTopicsCount: 0,
                hasFeedback: false,
                moduleScore: 0
            };

            // Calculate module score - prioritize feedback data if available
            let moduleScore = feedback.hasFeedback ? feedback.moduleScore : quiz.score;

            // Calculate total time spent for the module (prefer topic sum over module direct time)
            const moduleTopicTimeSpent = progress.topicTotalTimeSpent || 0;
            const moduleDirectTimeSpent = progress.moduleTimeSpent || 0;

            // Use topic time as the primary source of truth, fall back to module time if no topics
            const effectiveTimeSpent = progress.topics.length > 0 ? moduleTopicTimeSpent : moduleDirectTimeSpent;

            // Try to get skill level from feedback if available, otherwise determine it algorithmically
            let skillLevel = 'Not assessed';

            if (feedback.hasFeedback && feedback.weakTopicsCount + feedback.strongTopicsCount > 0) {
                // Calculate skill level based on the ratio of strong topics to total topics
                const strongRatio = feedback.strongTopicsCount / (feedback.weakTopicsCount + feedback.strongTopicsCount);

                if (strongRatio >= 0.8) {
                    skillLevel = 'Advanced';
                } else if (strongRatio >= 0.5) {
                    skillLevel = 'Intermediate';
                } else {
                    skillLevel = 'Beginner';
                }
            } else {
                // Fall back to algorithmic determination if no feedback data is available
                skillLevel = determineSkillLevel(
                    moduleScore,
                    progress.revisionCount,
                    Math.round(effectiveTimeSpent / 60) // Convert seconds to minutes
                );
            }

            // Calculate time spent in a human-readable format using our utility function
            const timeSpentFormatted = formatTimeSpent(effectiveTimeSpent);

            // Determine overall status
            const overallStatus = progress.completionStatus === 'completed' && quiz.isCompleted
                ? 'completed'
                : progress.completionStatus === 'not_started'
                    ? 'not_started'
                    : 'in_progress';

            return {
                id: module.id,
                title: module.title,
                sequenceNo: module.sequence_no,
                durationHours: module.duration_minutes,
                status: overallStatus,
                score: moduleScore,
                isQuizCompleted: quiz.isCompleted,
                timeSpent: effectiveTimeSpent,
                timeSpentFormatted,
                lastAccessed: progress.lastAccessed,
                completedAt: progress.completedAt,
                revisionCount: progress.revisionCount,
                skillLevel,
                topicCount: progress.topics.length,
                feedback: {
                    available: feedback.hasFeedback,
                    weakTopicsCount: feedback.weakTopicsCount,
                    strongTopicsCount: feedback.strongTopicsCount || 0, // Fixed the typo from 'strengthTopicsCount'
                    totalTopics: feedback.totalTopics || (feedback.weakTopicsCount + (feedback.strongTopicsCount || 0)),
                    moduleScore: feedback.moduleScore || 0,
                    strongTopicsPercentage: feedback.totalTopics > 0
                        ? Math.round(((feedback.strongTopicsCount || 0) / feedback.totalTopics) * 100)
                        : 0
                }
            };
        });

        return res.status(200).json({
            message: 'Module completion data retrieved successfully',
            course: {
                id: course.id,
                title: course.title
            },
            student: {
                id: student.id,
                name: student.full_name
            },
            enrollment: {
                id: enrollment.id,
                status: enrollment.status,
                enrolledAt: enrollment.created_at,
            },
            modules: moduleAnalytics
        });
    } catch (error) {
        console.error('Error retrieving module completion data:', error);
        return res.status(500).json({
            message: 'Failed to retrieve module completion data',
            error: error.message
        });
    }
};

/**
 * Get topic strength analysis for a student
 */
exports.getTopicStrengthAnalysis = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { courseId, moduleId, version } = req.query;

        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required' });
        }

        // Check if student exists
        const { success: studentSuccess, data: studentData, error: studentError } = await callProcedure('getUserById', [studentId]);

        if (!studentSuccess) {
            return res.status(404).json({ message: 'Student not found', error: studentError });
        }

        const student = studentData[0];

        const studentIdParam = parseInt(studentId);
        const courseIdParam = courseId ? parseInt(courseId) : null;
        const moduleIdParam = moduleId ? parseInt(moduleId) : null;
        const versionParam = version || 'latest';

        // Get latest feedback for all modules
        const { success: feedbackSuccess, data: feedbackEntries, error: feedbackError } = await callProcedure(
            'getFeedbackEntriesForStudentAnalytics', 
            [studentIdParam, courseIdParam, moduleIdParam, versionParam]
        );

        if (!feedbackSuccess) {
            return res.status(500).json({ message: 'Failed to retrieve feedback data', error: feedbackError });
        }

        if (feedbackEntries.length === 0) {
            return res.status(200).json({
                message: 'No feedback data found for this student',
                student: {
                    id: student.id,
                    name: student.full_name
                },
                strongTopics: [],
                weakTopics: []
            });
        }

        // Extract weak and strong topics from feedback data
        const weakTopics = [];
        const strongTopics = [];

        feedbackEntries.forEach(entry => {
            const feedbackData = entry.feedback_data;

            if (feedbackData && typeof feedbackData === 'object') {
                // Check if feedback data has the nested 'feedback' property structure
                const feedbackSource = feedbackData.feedback || feedbackData;

                // Process topics array if available (new format)
                if (Array.isArray(feedbackData.topics)) {
                    feedbackData.topics.forEach(topic => {
                        if (topic.topic_score < 50) {
                            // Add to weak topics
                            weakTopics.push({
                                topicTitle: topic.title,
                                score: topic.topic_score,
                                timeSpentMinutes: Math.round(topic.topic_time_spent / 60),
                                courseId: entry.course_id,
                                courseTitle: entry.Course?.title || 'Unknown Course',
                                moduleId: entry.module_id,
                                moduleTitle: entry.Module?.title || 'Unknown Module',
                                feedback: topic.feedback || {},
                                skill: topic.topic_skill || 'Not Assessed',
                                description: topic.description || ''
                            });
                        } else {
                            // Add to strong topics
                            strongTopics.push({
                                topicTitle: topic.title,
                                score: topic.topic_score,
                                timeSpentMinutes: Math.round(topic.topic_time_spent / 60),
                                courseId: entry.course_id,
                                courseTitle: entry.Course?.title || 'Unknown Course',
                                moduleId: entry.module_id,
                                moduleTitle: entry.Module?.title || 'Unknown Module',
                                skill: topic.topic_skill || 'Not Assessed',
                                description: topic.description || ''
                            });
                        }
                    });
                } else {
                    // Process weak topics (old format)
                    if (Array.isArray(feedbackSource.weak_topics)) {
                        feedbackSource.weak_topics.forEach(topic => {
                            weakTopics.push({
                                topicTitle: topic.title,
                                score: topic.score,
                                timeSpentMinutes: topic.timeSpentMinutes,
                                courseId: entry.course_id,
                                courseTitle: entry.Course?.title || 'Unknown Course',
                                moduleId: entry.module_id,
                                moduleTitle: entry.Module?.title || 'Unknown Module',
                                feedback: topic.feedback || {}
                            });
                        });
                    }

                    // Process strong topics (old format)
                    if (Array.isArray(feedbackSource.strong_topics)) {
                        feedbackSource.strong_topics.forEach(topic => {
                            strongTopics.push({
                                topicTitle: topic.title,
                                score: topic.score,
                                timeSpentMinutes: topic.timeSpentMinutes,
                                courseId: entry.course_id,
                                courseTitle: entry.Course?.title || 'Unknown Course',
                                moduleId: entry.module_id,
                                moduleTitle: entry.Module?.title || 'Unknown Module'
                            });
                        });
                    }
                }
            }
        });

        // Sort topics by score (weak topics ascending, strong topics descending)
        weakTopics.sort((a, b) => a.score - b.score);
        strongTopics.sort((a, b) => b.score - a.score);

        // Calculate overall statistics
        const topicStats = {
            totalTopics: weakTopics.length + strongTopics.length,
            weakTopicsCount: weakTopics.length,
            strongTopicsCount: strongTopics.length,
            weakTopicsPercentage: weakTopics.length + strongTopics.length > 0
                ? (weakTopics.length / (weakTopics.length + strongTopics.length) * 100).toFixed(1)
                : 0,
            strongTopicsPercentage: weakTopics.length + strongTopics.length > 0
                ? (strongTopics.length / (weakTopics.length + strongTopics.length) * 100).toFixed(1)
                : 0,
            averageWeakScore: weakTopics.length > 0
                ? (weakTopics.reduce((sum, topic) => sum + topic.score, 0) / weakTopics.length).toFixed(1)
                : 0,
            averageStrongScore: strongTopics.length > 0
                ? (strongTopics.reduce((sum, topic) => sum + topic.score, 0) / strongTopics.length).toFixed(1)
                : 0
        };

        // Process data for graphical representation
        const graphData = {
            distributionByScore: {
                labels: ['0-20', '21-40', '41-60', '61-80', '81-100'],
                datasets: [0, 0, 0, 0, 0]
            },
            distributionByModule: {},
            courseComparisonData: {}
        };

        // Fill score distribution data
        const allTopics = [...weakTopics, ...strongTopics];
        allTopics.forEach(topic => {
            const score = topic.score;
            if (score <= 20) graphData.distributionByScore.datasets[0]++;
            else if (score <= 40) graphData.distributionByScore.datasets[1]++;
            else if (score <= 60) graphData.distributionByScore.datasets[2]++;
            else if (score <= 80) graphData.distributionByScore.datasets[3]++;
            else graphData.distributionByScore.datasets[4]++;

            // Group by module
            const moduleId = topic.moduleId;
            const moduleTitle = topic.moduleTitle;
            if (!graphData.distributionByModule[moduleId]) {
                graphData.distributionByModule[moduleId] = {
                    moduleId,
                    moduleTitle,
                    totalTopics: 0,
                    weakTopics: 0,
                    strongTopics: 0,
                    averageScore: 0,
                    totalScore: 0
                };
            }

            graphData.distributionByModule[moduleId].totalTopics++;
            if (topic.score < 50) {
                graphData.distributionByModule[moduleId].weakTopics++;
            } else {
                graphData.distributionByModule[moduleId].strongTopics++;
            }
            graphData.distributionByModule[moduleId].totalScore += topic.score;

            // Group by course
            const courseId = topic.courseId;
            const courseTitle = topic.courseTitle;
            if (!graphData.courseComparisonData[courseId]) {
                graphData.courseComparisonData[courseId] = {
                    courseId,
                    courseTitle,
                    totalTopics: 0,
                    weakTopics: 0,
                    strongTopics: 0,
                    averageScore: 0,
                    totalScore: 0
                };
            }

            graphData.courseComparisonData[courseId].totalTopics++;
            if (topic.score < 50) {
                graphData.courseComparisonData[courseId].weakTopics++;
            } else {
                graphData.courseComparisonData[courseId].strongTopics++;
            }
            graphData.courseComparisonData[courseId].totalScore += topic.score;
        });

        // Calculate averages
        Object.values(graphData.distributionByModule).forEach(module => {
            module.averageScore = module.totalTopics > 0
                ? Math.round(module.totalScore / module.totalTopics)
                : 0;
        });

        Object.values(graphData.courseComparisonData).forEach(course => {
            course.averageScore = course.totalTopics > 0
                ? Math.round(course.totalScore / course.totalTopics)
                : 0;
        });

        // Convert to arrays for easier consumption in frontend
        graphData.moduleDistribution = Object.values(graphData.distributionByModule);
        graphData.courseComparisonData = Object.values(graphData.courseComparisonData);

        // Delete object versions to avoid duplication
        delete graphData.distributionByModule;
        delete graphData.courseComparisonData;

        return res.status(200).json({
            message: 'Topic strength analysis retrieved successfully',
            student: {
                id: student.id,
                name: student.full_name
            },
            stats: topicStats,
            graphData: graphData,
            weakTopics,
            strongTopics
        });
    } catch (error) {
        console.error('Error retrieving topic strength analysis:', error);
        return res.status(500).json({
            message: 'Failed to retrieve topic strength analysis',
            error: error.message
        });
    }
};

/**
 * Get detailed time spent analysis for a student
 */
exports.getTimeSpentAnalysis = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { courseId, moduleId, version } = req.query;

        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required' });
        }

        // Check if student exists
        const { success: studentSuccess, data: studentData, error: studentError } = await callProcedure('getUserById', [studentId]);

        if (!studentSuccess) {
            return res.status(404).json({ message: 'Student not found', error: studentError });
        }

        const student = studentData[0];

        // Parse parameters to ensure they're numbers
        const parsedStudentId = parseInt(studentId);
        const parsedCourseId = courseId ? parseInt(courseId) : null;
        const parsedModuleId = moduleId ? parseInt(moduleId) : null;

        const { success: studentEnrollmentsSuccess, data: studentEnrollmentsData, 
            error: studentEnrollmentsError } = await callProcedure(
                'getStudentEnrollmentInCourse', 
                [parsedStudentId, parsedCourseId]
            );

        if (!studentEnrollmentsSuccess) {
            return res.status(404).json({ message: 'Enrollments not found', error: studentEnrollmentsError });
        }

        const studentEnrollments = studentEnrollmentsData;

        if (studentEnrollments.length === 0) {
            return res.status(200).json({
                message: 'No enrollments found for this student',
                student: {
                    id: student.id,
                    name: student.full_name
                },
                timeAnalysis: []
            });
        }


        const enrollmentIds = studentEnrollments.map(e => e.id);
        const courseIds = studentEnrollments.map(e => e.course_id);

        // Get all courses

        const courseIdsJson = JSON.stringify(courseIds);
        const { success: coursesSuccess, data: coursesData, error: coursesError } = await callProcedure('getCoursesForTimeSpentByIds', [courseIdsJson]);
        if (!coursesSuccess) {
            return res.status(404).json({ message: 'Courses not found', error: coursesError });
        }

        const courses = coursesData;

        // Create course lookup map
        const courseMap = {};
        courses.forEach(course => {
            courseMap[course.id] = {
                id: course.id,
                title: course.title
            };
        });

        const enrollmentIdsJson = JSON.stringify(enrollmentIds);

        // Get module-level time tracking with filters applied
        const { success: moduleTrackingSuccess, data: moduleTrackingData, error: moduleTrackingError } = await callProcedure(
            'getModuleTrackingDataForTimeSpent',
            [enrollmentIdsJson, parsedModuleId ? JSON.stringify([parsedModuleId]) : null]
        );

        if (!moduleTrackingSuccess) {
            return res.status(404).json({ message: 'Module tracking not found', error: moduleTrackingError });
        }

        const moduleTracking = moduleTrackingData;


        // Get topic-level time tracking with filters applied
        const { success: topicTrackingSuccess, data: topicTrackingData, error: topicTrackingError } = await callProcedure(
            'getTopicTrackingDataForTimeSpent',
            [enrollmentIdsJson, parsedModuleId ? JSON.stringify([parsedModuleId]) : null]
        );

        if (!topicTrackingSuccess) {
            return res.status(404).json({ message: 'Topic tracking not found', error: topicTrackingError });
        }

        const topicTracking = topicTrackingData;


        // Get performance feedback data - for topic scores
        const studentIdParam = parseInt(studentId);
        const courseIdParam = courseId ? parseInt(courseId) : null;
        const moduleIdParam = moduleId ? parseInt(moduleId) : null;
        const versionParam = version || 'latest';

        const { success: feedbackSuccess, data: feedbackEntries, error: feedbackError } =
            await callProcedure('getFeedbackEntriesForStudentAnalytics', [
                studentIdParam,
                courseIdParam,
                moduleIdParam,
                versionParam
            ]);

        if (!feedbackSuccess) {
            return res.status(500).json({ message: 'Failed to fetch feedback entries', error: feedbackError });
        }

        const performanceFeedback = feedbackEntries;


        // Get all modules
        const moduleIds = [...new Set([
            ...moduleTracking.map(m => m.module_id),
            ...topicTracking.map(t => t.module_id)
        ])];

        const moduleIdsJson = JSON.stringify(moduleIds);
        const { success: modulesSuccess, data: modulesData, error: modulesError } = await callProcedure('getModulesByIds', [moduleIdsJson]);
        if (!modulesSuccess) {
            return res.status(404).json({ message: 'Modules not found', error: modulesError });
        }

        const modules = modulesData;


        // Create module lookup map
        const moduleMap = {};
        modules.forEach(mod => {
            moduleMap[mod.id] = {
                id: mod.id,
                title: mod.title,
                courseId: mod.course_id
            };
        });

        // Get all topics
        const topicIds = topicTracking.map(t => t.topic_id).filter(id => id !== null);

        const topicIdsJson = JSON.stringify(topicIds);
        const { success: topicsSuccess, data: topicsData, error: topicsError } = await callProcedure('getTopicsByIds', [topicIdsJson]);
        if (!topicsSuccess) {
            return res.status(404).json({ message: 'Topics not found', error: topicsError });
        }

        const topics = topicsData;

        // Create topic lookup map
        const topicMap = {};
        topics.forEach(topic => {
            topicMap[topic.id] = {
                id: topic.id,
                title: topic.title,
                moduleId: topic.module_id
            };
        });

        // Process the data for each enrollment
        const timeAnalysis = studentEnrollments.map(enrollment => {
            // Get modules for this enrollment
            const enrollmentModules = moduleTracking.filter(m => m.enrollment_id === enrollment.id);

            // Get topics for this enrollment's modules
            const enrollmentTopics = topicTracking.filter(t =>
                t.enrollment_id === enrollment.id
            );

            // Calculate total time spent on topics
            const totalTopicTime = enrollmentTopics.reduce((sum, t) => sum + (t.student_time_spent || 0), 0);

            // Calculate total time spent on course - use module time if available, otherwise use topic time
            let totalModuleTime = enrollmentModules.reduce((sum, m) => sum + (m.student_time_spent || 0), 0);
            if (totalModuleTime === 0) {
                totalModuleTime = totalTopicTime;
            }

            // Process module time data
            const moduleTimeData = enrollmentModules.map(m => {
                const moduleInfo = moduleMap[m.module_id] || { id: m.module_id, title: 'Unknown Module' };

                // Get topics for this module
                const moduleTopics = enrollmentTopics.filter(t => t.module_id === m.module_id);

                // Collect topic scores from feedback data
                const topicScores = {};

                // Find matching feedback data for this module
                const moduleFeedback = performanceFeedback.find(feedback => feedback.module_id === m.module_id);

                if (moduleFeedback && moduleFeedback.feedback_data) {
                    const feedbackData = moduleFeedback.feedback_data;

                    if (Array.isArray(feedbackData.topics)) {
                        // New format with topics array
                        feedbackData.topics.forEach(topic => {
                            // Store topic score and skill level in topicScores
                            topicScores[topic.title] = {
                                score: topic.topic_score || 0,
                                skill: topic.topic_skill || 'Not Assessed',
                                timeSpent: topic.topic_time_spent || 0 // Use topic time from feedback if available
                            };
                        });
                    } else {
                        // Old format with weak_topics and strong_topics
                        const feedbackSource = feedbackData.feedback || feedbackData;

                        if (Array.isArray(feedbackSource.weak_topics)) {
                            feedbackSource.weak_topics.forEach(topic => {
                                topicScores[topic.title] = {
                                    score: topic.score || 0,
                                    skill: 'Beginner',
                                    timeSpent: topic.timeSpentMinutes ? topic.timeSpentMinutes * 60 : 0 // Convert minutes to seconds
                                };
                            });
                        }

                        if (Array.isArray(feedbackSource.strong_topics)) {
                            feedbackSource.strong_topics.forEach(topic => {
                                topicScores[topic.title] = {
                                    score: topic.score || 0,
                                    skill: topic.score >= 80 ? 'Advanced' : 'Intermediate',
                                    timeSpent: topic.timeSpentMinutes ? topic.timeSpentMinutes * 60 : 0 // Convert minutes to seconds
                                };
                            });
                        }
                    }
                }

                const topicsTimeData = moduleTopics.map(t => {
                    const topicInfo = topicMap[t.topic_id] || { id: t.topic_id, title: 'Unknown Topic' };
                    const topicScore = topicScores[topicInfo.title] || { score: 0, skill: 'Not Assessed' };

                    // Prioritize time spent from progress tracking, but fall back to feedback time if available
                    const progressTrackingTime = t.student_time_spent || 0;
                    const feedbackTime = topicScore.timeSpent || 0;

                    // Choose the larger of the two time values (progress tracking vs feedback)
                    // This ensures we show the most complete data available
                    const effectiveTimeSpent = progressTrackingTime > 0 ? progressTrackingTime : feedbackTime;

                    return {
                        id: topicInfo.id,
                        title: topicInfo.title,
                        timeSpent: effectiveTimeSpent,
                        timeSpentFormatted: formatTimeSpent(effectiveTimeSpent),
                        status: t.completion_status,
                        lastAccessed: t.last_accessed,
                        completedAt: t.completed_at,
                        score: topicScore.score,
                        skill: topicScore.skill,
                        // Include the source of the time data for debugging
                        timeSource: progressTrackingTime > 0 ? 'progress_tracking' :
                            (feedbackTime > 0 ? 'feedback' : 'unknown')
                    };
                });

                // Sort topics by time spent descending
                topicsTimeData.sort((a, b) => b.timeSpent - a.timeSpent);

                // Calculate module time spent by summing up topic times
                // This gives us a more accurate representation of actual time spent
                const moduleTimeSpent = m.student_time_spent || 0;
                const topicsTotalTime = topicsTimeData.reduce((sum, topic) => sum + topic.timeSpent, 0);

                // Use the topicsTotalTime as the primary source of truth for time spent
                // Only fall back to module time if we have no topic data
                const finalModuleTime = topicsTimeData.length > 0 ? topicsTotalTime : moduleTimeSpent;

                // Calculate module score from performance feedback
                let moduleScore = 0;
                // Using the previously found moduleFeedback or finding it again if not already found
                const moduleScoreFeedback = moduleFeedback || performanceFeedback.find(f => f.module_id === m.module_id);

                if (moduleScoreFeedback && moduleScoreFeedback.feedback_data) {
                    const feedbackData = moduleScoreFeedback.feedback_data;

                    // Check if we have the new format with module_score
                    if (feedbackData.module_score !== undefined) {
                        moduleScore = feedbackData.module_score;
                    } else if (Array.isArray(feedbackData.topics)) {
                        // Calculate from topic scores
                        const totalScore = feedbackData.topics.reduce((sum, topic) => sum + (topic.topic_score || 0), 0);
                        moduleScore = feedbackData.topics.length > 0 ? Math.round(totalScore / feedbackData.topics.length) : 0;
                    } else {
                        // Old format with weak_topics and strong_topics
                        const feedbackSource = feedbackData.feedback || feedbackData;
                        const weakTopicsCount = feedbackSource.weak_topics?.length || 0;
                        const strongTopicsCount = feedbackSource.strong_topics?.length || 0;
                        const totalTopics = weakTopicsCount + strongTopicsCount;
                        moduleScore = totalTopics > 0 ? Math.round((strongTopicsCount / totalTopics) * 100) : 0;
                    }
                }

                return {
                    id: moduleInfo.id,
                    title: moduleInfo.title,
                    timeSpent: finalModuleTime,
                    timeSpentFormatted: formatTimeSpent(finalModuleTime),
                    status: m.completion_status,
                    lastAccessed: m.last_accessed,
                    completedAt: m.completed_at,
                    topics: topicsTimeData,
                    topicsCount: topicsTimeData.length,
                    completedTopicsCount: topicsTimeData.filter(t => t.status === 'completed').length,
                    score: moduleScore
                };
            });

            // Sort modules by time spent descending
            moduleTimeData.sort((a, b) => b.timeSpent - a.timeSpent);

            const courseInfo = courseMap[enrollment.course_id] ||
                { id: enrollment.course_id, title: 'Unknown Course' };

            return {
                enrollmentId: enrollment.id,
                courseId: courseInfo.id,
                courseTitle: courseInfo.title,
                status: enrollment.status,
                enrolledAt: enrollment.created_at,
                totalTimeSpent: totalModuleTime,
                totalTimeSpentFormatted: formatTimeSpent(totalModuleTime),
                moduleCount: moduleTimeData.length,
                completedModuleCount: moduleTimeData.filter(m => m.status === 'completed').length,
                topicCount: enrollmentTopics.length,
                completedTopicCount: enrollmentTopics.filter(t => t.completion_status === 'completed').length,
                modules: moduleTimeData
            };
        });

        // Calculate summary statistics
        const totalTimeAllCourses = timeAnalysis.reduce((sum, course) => sum + course.totalTimeSpent, 0);
        const totalCompletedModules = timeAnalysis.reduce((sum, course) => sum + course.completedModuleCount, 0);
        const totalModules = timeAnalysis.reduce((sum, course) => sum + course.moduleCount, 0);
        const totalCompletedTopics = timeAnalysis.reduce((sum, course) => sum + course.completedTopicCount, 0);
        const totalTopics = timeAnalysis.reduce((sum, course) => sum + course.topicCount, 0);

        // Sort courses by time spent descending
        timeAnalysis.sort((a, b) => b.totalTimeSpent - a.totalTimeSpent);

        // Extract all topics from all modules for correlation analysis
        const allTopics = [];

        timeAnalysis.forEach(course => {
            course.modules.forEach(module => {
                module.topics.forEach(topic => {
                    const topicTimeSeconds = topic.timeSpent || 0;
                    // Make sure we're not exceeding reasonable time values
                    // Cap at 3 hours (10800 seconds) per topic for correlation chart
                    const normalizedTimeSeconds = Math.min(topicTimeSeconds, 10800);

                    allTopics.push({
                        topicId: topic.id,
                        topicTitle: topic.title,
                        moduleId: module.id,
                        moduleTitle: module.title,
                        courseId: course.courseId,
                        courseTitle: course.courseTitle,
                        timeSpent: normalizedTimeSeconds,
                        timeSpentMinutes: Math.round(normalizedTimeSeconds / 60),
                        timeSpentOriginal: topicTimeSeconds, // Keep original for reference
                        score: topic.score || 0,
                        skill: topic.skill || 'Not Assessed',
                        timeSource: topic.timeSource || 'unknown',
                        status: topic.status || 'unknown'
                    });
                });
            });
        });

        // Sort topics by time spent for the correlation analysis
        allTopics.sort((a, b) => b.timeSpent - a.timeSpent);


        return res.status(200).json({
            message: 'Time spent analysis retrieved successfully',
            student: {
                id: student.id,
                name: student.full_name
            },
            filters: {
                courseId: courseId ? parseInt(courseId) : null,
                moduleId: moduleId ? parseInt(moduleId) : null,
                version: version || 'latest'
            },
            summary: {
                totalTimeSpent: totalTimeAllCourses,
                totalTimeSpentFormatted: formatTimeSpent(totalTimeAllCourses),
                totalCourses: timeAnalysis.length,
                courseCompletionRate: timeAnalysis.filter(c =>
                    c.completedModuleCount === c.moduleCount && c.moduleCount > 0
                ).length / timeAnalysis.length * 100,
                moduleCompletionRate: totalModules > 0 ? (totalCompletedModules / totalModules * 100).toFixed(1) : 0,
                topicCompletionRate: totalTopics > 0 ? (totalCompletedTopics / totalTopics * 100).toFixed(1) : 0
            },
            // Add the correlation data directly to the response for use in the Time vs Performance chart
            correlation: {
                topics: allTopics,
                explanation: "This data shows the relationship between time spent on each topic and the performance score achieved.",
                metadata: {
                    topicCount: allTopics.length,
                    averageTimePerTopic: allTopics.length > 0 ?
                        Math.round(allTopics.reduce((sum, t) => sum + t.timeSpentMinutes, 0) / allTopics.length) : 0,
                    maxTimeSpentMinutes: allTopics.length > 0 ?
                        Math.max(...allTopics.map(t => t.timeSpentMinutes)) : 0,
                    totalTimeSpentMinutes: allTopics.reduce((sum, t) => sum + t.timeSpentMinutes, 0),
                    timeRanges: {
                        lessThan5Min: allTopics.filter(t => t.timeSpentMinutes < 5).length,
                        between5And30Min: allTopics.filter(t => t.timeSpentMinutes >= 5 && t.timeSpentMinutes < 30).length,
                        between30And60Min: allTopics.filter(t => t.timeSpentMinutes >= 30 && t.timeSpentMinutes < 60).length,
                        moreThan60Min: allTopics.filter(t => t.timeSpentMinutes >= 60).length
                    }
                }
            },
            timeAnalysis
        });
    } catch (error) {
        console.error('Error retrieving time spent analysis:', error);
        return res.status(500).json({
            message: 'Failed to retrieve time spent analysis',
            error: error.message
        });
    }
};

/**
 * Get available versions for a student's performance feedback
 * 
 * Supports filtering by:
 * - courseId: Integer - Filter to only show versions from a specific course
 * - moduleId: Integer - Filter to only show versions from a specific module
 * 
 * Example usage:
 * /student/1/versions - Get all versions for student with ID 1
 * /student/1/versions?courseId=4 - Get only versions for course with ID 4
 * /student/1/versions?moduleId=32 - Get only versions for module with ID 32
 * /student/1/versions?courseId=4&moduleId=32 - Get versions for module 32 in course 4
 */
exports.getAvailableVersions = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { courseId, moduleId } = req.query;

        const parsedStudentId = parseInt(studentId);
        const parsedCourseId = courseId ? parseInt(courseId) : null;
        const parsedModuleId = moduleId ? parseInt(moduleId) : null;

        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required' });
        }

        // Check if student exists
        const { success: studentSuccess, data: studentData, error: studentError } = await callProcedure('getUserById', [studentId]);

        if (!studentSuccess) {
            return res.status(404).json({ message: 'Student not found', error: studentError });
        }

        const student = studentData[0];

        const { success: versionsSuccess, data: allVersions, error: versionsError } = await callProcedure(
            'getAllAvailableFeedbackVersionsForStudent',
            [parsedStudentId, parsedCourseId, parsedModuleId]
        );

        if (!versionsSuccess) {
            console.error('Error retrieving available versions:', versionsError);
            return res.status(500).json({
                message: 'Failed to retrieve available versions',
                error: versionsError.message
            });
        }

        // Group versions by module
        const versionsByModule = {};
        allVersions.forEach(v => {
            const moduleId = v.module_id;
            if (!versionsByModule[moduleId]) {
                versionsByModule[moduleId] = {
                    moduleId: moduleId,
                    moduleTitle: v.Module?.title || 'Unknown Module',
                    courseId: v.course_id,
                    courseTitle: v.Course?.title || 'Unknown Course',
                    versions: []
                };
            }

            versionsByModule[moduleId].versions.push({
                version: v.version,
                isCurrent: v.is_current,
                created_at: v.created_at
            });
        });

        const response = {
            message: 'Available versions retrieved successfully',
            student: {
                id: student.id,
                name: student.full_name,
                email: student.email
            },
            appliedFilters: {
                studentId: parseInt(studentId),
                courseId: courseId ? parseInt(courseId) : null,
                moduleId: moduleId ? parseInt(moduleId) : null
            },
            availableVersions: allVersions.map(v => ({
                id: v.id,
                version: v.version,
                isCurrent: v.is_current,
                created_at: v.created_at,
                moduleId: v.module_id,
                moduleTitle: v.Module?.title || 'Unknown Module',
                courseId: v.course_id,
                courseTitle: v.Course?.title || 'Unknown Course'
            })),
            versionsByModule: Object.values(versionsByModule),
            count: allVersions.length
        };

        return res.status(200).json(response);
    } catch (error) {
        console.error('Error retrieving available versions:', error);
        return res.status(500).json({
            message: 'Failed to retrieve available versions',
            error: error.message
        });
    }
};

/**
 * Get error analysis and improvement suggestions for a student
 */
exports.getErrorAnalysis = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { courseId, moduleId, version } = req.query;

        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required' });
        }

        // Check if student exists
        const { success: studentSuccess, data: studentData, error: studentError } = await callProcedure('getUserById', [studentId]);

        if (!studentSuccess) {
            return res.status(404).json({ message: 'Student not found', error: studentError });
        }

        const student = studentData[0];

        const studentIdParam = parseInt(studentId);
        const courseIdParam = courseId ? parseInt(courseId) : null;
        const moduleIdParam = moduleId ? parseInt(moduleId) : null;
        const versionParam = version || 'latest';

        // Get latest feedback for all modules
        const { success: feedbackSuccess, data: feedbackEntries, error: feedbackError } = await callProcedure(
            'getFeedbackEntriesForStudentAnalytics', 
            [studentIdParam, courseIdParam, moduleIdParam, versionParam]
        );
        
        if (!feedbackSuccess) {
            return res.status(500).json({ message: 'Failed to retrieve feedback data', error: feedbackError });
        }


        // If we have a moduleId filter and no feedback, return a 200 with empty data structures
        // instead of a 404, to ensure the frontend gets a clean state and can display appropriate messages
        if (feedbackEntries.length === 0) {
            if (moduleId) {
                return res.status(200).json({
                    message: 'No feedback data found for the selected module',
                    student: {
                        id: student.id,
                        name: student.full_name,
                        email: student.email
                    },
                    errorPatterns: [],
                    improvementSuggestions: [],
                    errorCountByType: {},
                    moduleAnalysis: [],
                    // Important flags for the frontend to detect empty data state
                    noDataForModule: true, // Specific flag for module-level no data
                    noData: true,          // General flag for no data
                    moduleId: parseInt(moduleId),
                    summary: {
                        totalErrors: 0,
                        totalImprovementSuggestions: 0,
                        modulesCovered: 0
                    }
                });
            } else {
                // For non-module-specific queries with no data at all, return 200 with noData flag instead of 404
                // This helps the frontend handle "All Modules" selection consistently
                return res.status(200).json({
                    message: 'No feedback data found for the specified filters',
                    student: {
                        id: student.id,
                        name: student.full_name,
                        email: student.email
                    },
                    errorPatterns: [],
                    improvementSuggestions: [],
                    errorCountByType: {},
                    moduleAnalysis: [],
                    noData: true,
                    summary: {
                        totalErrors: 0,
                        totalImprovementSuggestions: 0,
                        modulesCovered: 0
                    }
                });
            }
        }

        // Extract error patterns and improvement suggestions from feedback data
        const errorAnalysisData = {
            errorPatterns: [],
            improvementSuggestions: [],
            moduleAnalysis: [],
            errorCountByType: {}
        };

        // Validate module filtering - this is important to ensure we don't return data for the wrong module
        if (moduleId) {
            // If a specific moduleId is requested, ensure all feedback entries are for that module only
            const validEntries = feedbackEntries.filter(entry => entry.module_id === parseInt(moduleId));

            // If we filtered out some entries, log it for debugging
            if (validEntries.length < feedbackEntries.length) {
                feedbackEntries = validEntries;
            }

            // If no valid entries remain after filtering, return a clear 404
            if (feedbackEntries.length === 0) {
                return res.status(404).json({
                    message: `No feedback data found for module ID ${moduleId}`
                });
            }
        }

        // Process feedback data to extract error patterns and improvement suggestions
        feedbackEntries.forEach(entry => {
            try {
                // Parse the feedback_data JSON
                const feedbackData = typeof entry.feedback_data === 'string'
                    ? JSON.parse(entry.feedback_data)
                    : entry.feedback_data;


                // Extract error patterns from error_analysis field if it exists
                if (feedbackData?.error_analysis) {
                    // Convert error analysis object to array of error patterns
                    Object.entries(feedbackData.error_analysis).forEach(([errorType, count]) => {
                        // Create an error pattern entry
                        const errorPattern = {
                            type: errorType,
                            description: `Student has difficulty with ${errorType} (${count} occurrence${count > 1 ? 's' : ''})`,
                            severity: count > 3 ? 'high' : count > 1 ? 'medium' : 'low',
                            frequency: Math.min(count * 10, 100), // Convert count to percentage, max 100%
                            moduleId: entry.module_id,
                            moduleTitle: entry.Module?.title || 'Unknown Module',
                            courseId: entry.course_id,
                            courseTitle: entry.Course?.title || 'Unknown Course',
                            created_at: entry.created_at
                        };

                        errorAnalysisData.errorPatterns.push(errorPattern);

                        // Track error counts by type
                        if (!errorAnalysisData.errorCountByType[errorType]) {
                            errorAnalysisData.errorCountByType[errorType] = 0;
                        }
                        errorAnalysisData.errorCountByType[errorType] += count;
                    });
                }

                // Extract weak topics information for additional error patterns and improvement suggestions
                if (feedbackData?.feedback?.weak_topics && Array.isArray(feedbackData.feedback.weak_topics)) {
                    feedbackData.feedback.weak_topics.forEach(weakTopic => {
                        // Create an error pattern from weak topic
                        if (weakTopic.feedback && weakTopic.score < 60) { // Consider topics with score < 60 as error patterns
                            // Create error pattern based on weak areas
                            if (weakTopic.feedback.weak_areas && Array.isArray(weakTopic.feedback.weak_areas)) {
                                weakTopic.feedback.weak_areas.forEach((weakArea, index) => {
                                    const topicErrorPattern = {
                                        type: `Topic Weakness: ${weakTopic.title}`,
                                        description: weakArea,
                                        severity: weakTopic.score < 40 ? 'high' : weakTopic.score < 50 ? 'medium' : 'low',
                                        frequency: 100 - weakTopic.score, // Higher frequency for lower scores
                                        examples: weakTopic.feedback.practice_questions ?
                                            weakTopic.feedback.practice_questions.map(q => q.question).slice(0, 3) : [],
                                        moduleId: entry.module_id,
                                        moduleTitle: entry.Module?.title || 'Unknown Module',
                                        courseId: entry.course_id,
                                        courseTitle: entry.Course?.title || 'Unknown Course',
                                        created_at: entry.created_at
                                    };

                                    errorAnalysisData.errorPatterns.push(topicErrorPattern);
                                });
                            }

                            // Create improvement suggestions from suggestions field
                            if (weakTopic.feedback.suggestions && Array.isArray(weakTopic.feedback.suggestions)) {
                                weakTopic.feedback.suggestions.forEach((suggestion, index) => {
                                    const improvementSuggestion = {
                                        area: `Improvement for ${weakTopic.title}`,
                                        description: suggestion,
                                        priority: weakTopic.score < 40 ? 'high' : weakTopic.score < 50 ? 'medium' : 'low',
                                        actions: weakTopic.feedback.practice_questions ?
                                            weakTopic.feedback.practice_questions.map(q =>
                                                `Practice: ${q.question}`
                                            ).slice(0, 2) : [],
                                        moduleId: entry.module_id,
                                        moduleTitle: entry.Module?.title || 'Unknown Module',
                                        courseId: entry.course_id,
                                        courseTitle: entry.Course?.title || 'Unknown Course',
                                        created_at: entry.created_at
                                    };

                                    errorAnalysisData.improvementSuggestions.push(improvementSuggestion);
                                });
                            }

                            // Add time analysis as an improvement suggestion if available
                            if (weakTopic.feedback.time_analysis) {
                                const timeImprovement = {
                                    area: `Time Management for ${weakTopic.title}`,
                                    description: weakTopic.feedback.time_analysis,
                                    priority: 'medium',
                                    moduleId: entry.module_id,
                                    moduleTitle: entry.Module?.title || 'Unknown Module',
                                    courseId: entry.course_id,
                                    courseTitle: entry.Course?.title || 'Unknown Course',
                                    created_at: entry.created_at
                                };

                                errorAnalysisData.improvementSuggestions.push(timeImprovement);
                            }
                        }
                    });
                }

                // Extract direct error patterns if available (legacy support)
                if (feedbackData?.errorPatterns) {
                    feedbackData.errorPatterns.forEach(error => {
                        // Add module information to error pattern
                        errorAnalysisData.errorPatterns.push({
                            ...error,
                            moduleId: entry.module_id,
                            moduleTitle: entry.Module?.title || 'Unknown Module',
                            courseId: entry.course_id,
                            courseTitle: entry.Course?.title || 'Unknown Course',
                            created_at: entry.created_at
                        });

                        // Track error counts by type
                        const errorType = error.type || 'Unknown';
                        if (!errorAnalysisData.errorCountByType[errorType]) {
                            errorAnalysisData.errorCountByType[errorType] = 0;
                        }
                        errorAnalysisData.errorCountByType[errorType]++;
                    });
                }

                // Extract improvement suggestions
                if (feedbackData?.improvementSuggestions) {
                    feedbackData.improvementSuggestions.forEach(suggestion => {
                        // Add module information to suggestion
                        errorAnalysisData.improvementSuggestions.push({
                            ...suggestion,
                            moduleId: entry.module_id,
                            moduleTitle: entry.Module?.title || 'Unknown Module',
                            courseId: entry.course_id,
                            courseTitle: entry.Course?.title || 'Unknown Course',
                            created_at: entry.created_at
                        });
                    });
                }

                // If no explicit error patterns are found, try to extract from the feedback summary
                if ((!feedbackData?.errorPatterns || errorAnalysisData.errorPatterns.length === 0) && entry.feedback_summary) {
                    // Attempt to parse insights from the feedback summary
                    const errorKeywords = ['struggle', 'difficult', 'error', 'mistake', 'incorrect', 'wrong', 'failed', 'issue', 'weak'];
                    const improvementKeywords = ['improve', 'focus on', 'suggested', 'recommendation', 'should', 'could', 'need to', 'review', 'practice'];

                    const summary = entry.feedback_summary.toLowerCase();

                    // Look for sentences containing error keywords
                    const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 0);
                    sentences.forEach(sentence => {
                        const hasErrorKeyword = errorKeywords.some(keyword => sentence.includes(keyword));
                        const hasImprovementKeyword = improvementKeywords.some(keyword => sentence.includes(keyword));

                        if (hasErrorKeyword) {
                            // Extract any mentioned topic names in the sentence
                            let errorType = 'Inferred Error';
                            let severity = 'medium';

                            // Look for weak areas pattern like "Weak areas: X, Y, Z"
                            if (sentence.includes('weak area') || sentence.includes('weak topic')) {
                                const parts = sentence.split(':');
                                if (parts.length > 1) {
                                    // Extract weak topics list
                                    const weakTopics = parts[1].split(',').map(t => t.trim());

                                    // Create an error pattern for each weak topic
                                    weakTopics.forEach(topic => {
                                        if (topic.length > 0) {
                                            errorAnalysisData.errorPatterns.push({
                                                type: 'Topic Weakness',
                                                description: `Difficulty with ${topic}`,
                                                severity: 'high', // Explicit mention in summary means it's important
                                                frequency: 80, // High frequency for explicit mentions
                                                moduleId: entry.module_id,
                                                moduleTitle: entry.Module?.title || 'Unknown Module',
                                                courseId: entry.course_id,
                                                courseTitle: entry.Course?.title || 'Unknown Course',
                                                created_at: entry.created_at
                                            });

                                            // Track topic weakness error counts
                                            if (!errorAnalysisData.errorCountByType['Topic Weakness']) {
                                                errorAnalysisData.errorCountByType['Topic Weakness'] = 0;
                                            }
                                            errorAnalysisData.errorCountByType['Topic Weakness']++;
                                        }
                                    });
                                    return; // Skip the default error pattern creation for this sentence
                                }
                            }

                            // Look for "score: X%" pattern to determine severity
                            const scoreMatch = sentence.match(/score:\s*(\d+)%/i);
                            if (scoreMatch && scoreMatch[1]) {
                                const score = parseInt(scoreMatch[1]);
                                if (score < 40) severity = 'high';
                                else if (score < 60) severity = 'medium';
                                else severity = 'low';
                            }

                            errorAnalysisData.errorPatterns.push({
                                type: errorType,
                                description: sentence.trim(),
                                severity: severity,
                                frequency: severity === 'high' ? 90 : severity === 'medium' ? 60 : 30,
                                moduleId: entry.module_id,
                                moduleTitle: entry.Module?.title || 'Unknown Module',
                                courseId: entry.course_id,
                                courseTitle: entry.Course?.title || 'Unknown Course',
                                created_at: entry.created_at
                            });

                            // Track inferred error counts
                            if (!errorAnalysisData.errorCountByType[errorType]) {
                                errorAnalysisData.errorCountByType[errorType] = 0;
                            }
                            errorAnalysisData.errorCountByType[errorType]++;
                        }

                        if (hasImprovementKeyword) {
                            // Determine priority based on language
                            let priority = 'medium';
                            if (sentence.includes('essential') || sentence.includes('critical') ||
                                sentence.includes('crucial') || sentence.includes('must')) {
                                priority = 'high';
                            } else if (sentence.includes('might') || sentence.includes('could consider')) {
                                priority = 'low';
                            }

                            errorAnalysisData.improvementSuggestions.push({
                                area: 'Suggested Improvement',
                                description: sentence.trim(),
                                priority: priority,
                                moduleId: entry.module_id,
                                moduleTitle: entry.Module?.title || 'Unknown Module',
                                courseId: entry.course_id,
                                courseTitle: entry.Course?.title || 'Unknown Course',
                                created_at: entry.created_at
                            });
                        }
                    });

                    // Try to parse out "Weak areas: X, Strong areas: Y" pattern from the full summary
                    const weakAreasMatch = summary.match(/weak\s+areas?:([^.!?;]+)/i);
                    if (weakAreasMatch && weakAreasMatch[1]) {
                        const weakAreas = weakAreasMatch[1].split(',').map(area => area.trim());
                        weakAreas.forEach(area => {
                            if (area.length > 0) {
                                errorAnalysisData.errorPatterns.push({
                                    type: 'Weak Area',
                                    description: area,
                                    severity: 'high',
                                    frequency: 85,
                                    moduleId: entry.module_id,
                                    moduleTitle: entry.Module?.title || 'Unknown Module',
                                    courseId: entry.course_id,
                                    courseTitle: entry.Course?.title || 'Unknown Course',
                                    created_at: entry.created_at
                                });
                            }
                        });
                    }
                }

                // Process module-level error data
                const moduleData = {
                    moduleId: entry.module_id,
                    moduleTitle: entry.Module?.title || 'Unknown Module',
                    courseId: entry.course_id,
                    courseTitle: entry.Course?.title || 'Unknown Course',
                    errorCount: 0,
                    improvementCount: 0,
                    commonErrorTypes: {},
                    created_at: entry.created_at
                };

                // Count errors and suggestions at the module level
                if (feedbackData?.errorPatterns) {
                    moduleData.errorCount = feedbackData.errorPatterns.length;

                    // Track error types by module
                    feedbackData.errorPatterns.forEach(error => {
                        const errorType = error.type || 'Unknown';
                        if (!moduleData.commonErrorTypes[errorType]) {
                            moduleData.commonErrorTypes[errorType] = 0;
                        }
                        moduleData.commonErrorTypes[errorType]++;
                    });
                }

                if (feedbackData?.improvementSuggestions) {
                    moduleData.improvementCount = feedbackData.improvementSuggestions.length;
                }

                // Add module data to analysis
                errorAnalysisData.moduleAnalysis.push(moduleData);

            } catch (error) {
                console.error(`Error processing feedback entry ${entry.id}:`, error);
            }
        });

        // Check if we actually found any error data
        const hasErrorPatterns = errorAnalysisData.errorPatterns && errorAnalysisData.errorPatterns.length > 0;
        const hasErrorCounts = errorAnalysisData.errorCountByType && Object.keys(errorAnalysisData.errorCountByType).length > 0;
        const hasImprovements = errorAnalysisData.improvementSuggestions && errorAnalysisData.improvementSuggestions.length > 0;

        // If we have a specific moduleId but no actual data was found, return 200 but with a special flag
        if (moduleId && !hasErrorPatterns && !hasErrorCounts && !hasImprovements) {
            return res.status(200).json({
                message: `No error analysis data found for module ${moduleId}`,
                student: {
                    id: student.id,
                    name: student.full_name,
                    email: student.email
                },
                // Return empty data structures for frontend consistency
                errorPatterns: [],
                improvementSuggestions: [],
                errorCountByType: {},
                moduleAnalysis: [],
                // Add a special flag to indicate no data specifically for this module
                noDataForModule: true,
                moduleId: parseInt(moduleId),
                summary: {
                    totalErrors: 0,
                    totalImprovementSuggestions: 0,
                    modulesCovered: 0
                }
            });
        }

        // Check again if we have any meaningful data
        const hasAnyData =
            (errorAnalysisData.errorPatterns && errorAnalysisData.errorPatterns.length > 0) ||
            (errorAnalysisData.errorCountByType && Object.keys(errorAnalysisData.errorCountByType).length > 0) ||
            (errorAnalysisData.improvementSuggestions && errorAnalysisData.improvementSuggestions.length > 0);

        // Create a formatted response with the extracted data that matches the frontend expectations
        const response = {
            message: hasAnyData
                ? 'Error analysis retrieved successfully'
                : 'No error analysis data available',
            student: {
                id: student.id,
                name: student.full_name,
                email: student.email
            },
            // Return directly what the frontend expects
            errorPatterns: errorAnalysisData.errorPatterns || [],
            improvementSuggestions: errorAnalysisData.improvementSuggestions || [],
            errorCountByType: errorAnalysisData.errorCountByType || {},
            moduleAnalysis: errorAnalysisData.moduleAnalysis || [],
            // Add flags to clearly indicate data state
            noData: !hasAnyData,
            // If data was processed but no meaningful error patterns were found for a specific module
            // This helps differentiate between "no data because module wasn't completed" and 
            // "module was completed but no errors were found"
            noDataForModule: moduleId && !hasAnyData ? true : false,
            // Always include moduleId in response when it was in the request
            ...(moduleId ? { moduleId: parseInt(moduleId) } : {}),
            summary: {
                totalErrors: errorAnalysisData.errorPatterns?.length || 0,
                totalImprovementSuggestions: errorAnalysisData.improvementSuggestions?.length || 0,
                modulesCovered: new Set(errorAnalysisData.moduleAnalysis?.map(m => m.moduleId) || []).size
            }
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error('Error retrieving error analysis:', error);
        return res.status(500).json({
            message: 'Failed to retrieve error analysis',
            error: error.message
        });
    }
};

/**
 * Helper function to determine skill level based on score, revision count, and time spent
 */
function determineSkillLevel(score, revisionCount, timeSpentMinutes = 0) {
    // Define weights for score, revision count, and time spent
    const scoreWeight = 0.6;
    const revisionWeight = 0.25;
    const timeWeight = 0.15;

    // Normalize the revision count to a scale similar to the score (0-100)
    const normalizedRevisionCount = Math.min(revisionCount * 10, 100); // Assuming each revision adds 10 points up to a max of 100

    // Normalize time spent (assuming 30 minutes is optimal for most topics)
    const normalizedTimeSpent = Math.min((timeSpentMinutes / 30) * 100, 100); // Cap at 100

    // Calculate the combined metric
    const combinedMetric = (score * scoreWeight) + (normalizedRevisionCount * revisionWeight) + (normalizedTimeSpent * timeWeight);

    // Determine the skill level based on the combined metric
    if (combinedMetric >= 80) {
        return 'Advanced';
    } else if (combinedMetric >= 50) {
        return 'Intermediate';
    } else {
        return 'Beginner';
    }
}

/**
 * Helper function to analyze topics from feedback data
 */
function analyzeTopics(feedbackEntries) {
    let weakTopicsCount = 0;
    let strongTopicsCount = 0;
    let totalModuleScore = 0;
    let moduleCount = 0;

    feedbackEntries.forEach(entry => {
        const feedbackData = entry.feedback_data;
        let entryWeakCount = 0;
        let entryStrongCount = 0;
        let moduleScore = 0;

        if (feedbackData && typeof feedbackData === 'object') {
            // Check if we have the new format with topics array
            if (Array.isArray(feedbackData.topics)) {
                entryWeakCount = feedbackData.topics.filter(t => t.topic_score < 50).length;
                entryStrongCount = feedbackData.topics.filter(t => t.topic_score >= 50).length;

                // Get module score directly if available, otherwise calculate from topics
                if (feedbackData.module_score !== undefined) {
                    moduleScore = feedbackData.module_score;
                } else {
                    const totalScore = feedbackData.topics.reduce((sum, topic) => sum + (topic.topic_score || 0), 0);
                    moduleScore = feedbackData.topics.length > 0 ? Math.round(totalScore / feedbackData.topics.length) : 0;
                }
            } else {
                // Check if feedback is in a nested structure
                const feedbackSource = feedbackData.feedback || feedbackData;
                entryWeakCount = feedbackSource.weak_topics?.length || 0;
                entryStrongCount = feedbackSource.strong_topics?.length || 0;

                // Calculate module score based on strong/weak topic ratio
                const entryTotalTopics = entryWeakCount + entryStrongCount;
                moduleScore = entryTotalTopics > 0 ? Math.round((entryStrongCount / entryTotalTopics) * 100) : 0;
            }

            weakTopicsCount += entryWeakCount;
            strongTopicsCount += entryStrongCount;
            totalModuleScore += moduleScore;
            moduleCount++;

        }
    });

    const totalTopics = weakTopicsCount + strongTopicsCount;
    const strongTopicsRatio = totalTopics > 0 ? strongTopicsCount / totalTopics : 0;
    const averageModuleScore = moduleCount > 0 ? Math.round(totalModuleScore / moduleCount) : 0;

    return {
        weakTopicsCount,
        strongTopicsCount,
        totalTopics,
        strongTopicsRatio,
        averageModuleScore,
        strongTopicsPercentage: (strongTopicsRatio * 100).toFixed(1) + '%'
    };
}

/**
 * Helper function to extract detailed topic information from feedback entries
 */
function extractTopicDetails(feedbackEntries) {
    const topicMap = {};

    feedbackEntries.forEach(entry => {
        const feedbackData = entry.feedback_data;

        if (!feedbackData || typeof feedbackData !== 'object') {
            return;
        }

        // Handle new format with topics array
        if (Array.isArray(feedbackData.topics)) {
            feedbackData.topics.forEach(topic => {
                if (!topicMap[topic.title]) {
                    topicMap[topic.title] = {
                        title: topic.title,
                        score: topic.topic_score || 0,
                        timeSpent: Math.round(topic.topic_time_spent / 60) || 0,
                        skill: topic.topic_skill || 'Not assessed',
                        status: topic.topic_score < 50 ? 'weak' : 'strong',
                        moduleId: entry.module_id,
                        moduleTitle: entry.Module?.title || 'Unknown Module',
                        description: topic.description || ''
                    };
                }
            });
        } else {
            // Handle old format with weak_topics and strong_topics
            const feedbackSource = feedbackData.feedback || feedbackData;

            // Process weak topics
            if (Array.isArray(feedbackSource.weak_topics)) {
                feedbackSource.weak_topics.forEach(topic => {
                    if (!topicMap[topic.title]) {
                        topicMap[topic.title] = {
                            title: topic.title,
                            score: topic.score || 0,
                            timeSpent: topic.timeSpentMinutes || 0,
                            status: 'weak',
                            moduleId: entry.module_id,
                            moduleTitle: entry.Module?.title || 'Unknown Module',
                            description: topic.description || ''
                        };
                    }
                });
            }

            // Process strong topics
            if (Array.isArray(feedbackSource.strong_topics)) {
                feedbackSource.strong_topics.forEach(topic => {
                    if (!topicMap[topic.title]) {
                        topicMap[topic.title] = {
                            title: topic.title,
                            score: topic.score || 0,
                            timeSpent: topic.timeSpentMinutes || 0,
                            status: 'strong',
                            moduleId: entry.module_id,
                            moduleTitle: entry.Module?.title || 'Unknown Module',
                            description: topic.description || ''
                        };
                    }
                });
            }
        }
    });

    // Convert map to array
    return Object.values(topicMap);
}

/**
 * Helper function to format time spent in seconds to readable format
 */
function formatTimeSpent(seconds) {
    if (!seconds) return '0 minutes';

    const minutes = Math.round(seconds / 60);

    if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (remainingMinutes === 0) {
            return `${hours} hour${hours !== 1 ? 's' : ''}`;
        } else {
            return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
        }
    }
}

/**
 * Helper function to compare topics between two versions
 */
function compareTopics(version1Topics, version2Topics) {
    // Create maps for easy lookup
    const v1Map = {};
    version1Topics.forEach(topic => {
        v1Map[topic.title] = topic;
    });

    const v2Map = {};
    version2Topics.forEach(topic => {
        v2Map[topic.title] = topic;
    });

    // Get unique topic titles across both versions
    const allTopicTitles = new Set([
        ...version1Topics.map(t => t.title),
        ...version2Topics.map(t => t.title)
    ]);

    const comparisons = [];

    // Compare each topic
    allTopicTitles.forEach(title => {
        const v1Topic = v1Map[title];
        const v2Topic = v2Map[title];

        if (v1Topic && v2Topic) {
            // Topic exists in both versions
            comparisons.push({
                title,
                v1Score: v1Topic.score,
                v2Score: v2Topic.score,
                scoreDifference: v2Topic.score - v1Topic.score,
                v1Status: v1Topic.status,
                v2Status: v2Topic.status,
                statusChanged: v1Topic.status !== v2Topic.status,
                v1TimeSpent: v1Topic.timeSpent,
                v2TimeSpent: v2Topic.timeSpent,
                timeSpentDifference: v2Topic.timeSpent - v1Topic.timeSpent,
                v1Skill: v1Topic.skill,
                v2Skill: v2Topic.skill,
                skillChanged: v1Topic.skill !== v2Topic.skill
            });
        } else if (v1Topic) {
            // Topic only exists in version 1
            comparisons.push({
                title,
                v1Score: v1Topic.score,
                v2Score: null,
                scoreDifference: null,
                v1Status: v1Topic.status,
                v2Status: null,
                statusChanged: null,
                onlyInVersion: 1
            });
        } else if (v2Topic) {
            // Topic only exists in version 2
            comparisons.push({
                title,
                v1Score: null,
                v2Score: v2Topic.score,
                scoreDifference: null,
                v1Status: null,
                v2Status: v2Topic.status,
                statusChanged: null,
                onlyInVersion: 2
            });
        }
    });

    // Sort by absolute score difference (most changed first)
    comparisons.sort((a, b) => {
        // Handle cases where a topic is only in one version
        if (a.scoreDifference === null) return 1;
        if (b.scoreDifference === null) return -1;

        return Math.abs(b.scoreDifference) - Math.abs(a.scoreDifference);
    });

    return comparisons;
}
