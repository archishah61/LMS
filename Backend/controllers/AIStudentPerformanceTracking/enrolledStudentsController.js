const { callProcedure } = require("../../utils/procedure/callProcedure");
const Validation = require("../../validations");

// Get list of enrolled students with course information
exports.getEnrolledStudents = async (req, res, next) => {
    try {
        // Get query parameters for filtering
        const { courseId, status, role, userId, creatorType } = req.query;

        // Set default status to 'active' if not provided
        const statusValue = status || 'active';

        // Call the stored procedure
        const { success, data, error } = await callProcedure('getEnrolledStudents', [
            courseId ? parseInt(courseId) : null,
            statusValue,
            role || null,
            userId ? parseInt(userId) : null,
            creatorType || null
        ]);


        if (!success) {
            return next(error);
        }

        // Process the result - data will contain rows of enrollments with user and course details
        const studentMap = {};

        data.forEach(row => {
            if (!row.user_id) return;

            // If student not yet in map, add them
            if (!studentMap[row.user_id]) {
                studentMap[row.user_id] = {
                    id: row.user_id,
                    name: row.full_name,
                    email: row.email,
                    username: row.username,
                    profileImage: row.profile_image,
                    enrollments: []
                };
            }

            // Add this course to the student's enrollments
            studentMap[row.user_id].enrollments.push({
                enrollmentId: row.enrollment_id,
                courseId: row.course_id,
                courseTitle: row.course_title || 'Unknown Course',
                courseDescription: row.course_description || '',
                courseThumbnail: row.course_thumbnail || '',
                enrollmentDate: row.enrollment_date,
                status: row.status,
                completionPercentage: row.completion_percentage
            });
        });

        // Convert map to array
        const students = Object.values(studentMap);

        return res.status(200).json({
            message: 'Enrolled students retrieved successfully',
            students,
            count: students.length,
            appliedFilters: {
                courseId: courseId ? parseInt(courseId) : null,
                status: statusValue,
                role: role || null,
                userId: userId ? parseInt(userId) : null,
                creatorType: creatorType || null
            }
        });

    } catch (error) {
        console.error('Error fetching enrolled students:', error);
        return next(error);
    }
};


//  Get course enrollments for a specific student
exports.getStudentEnrollments = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const { role, userId, creatorType } = req.query; // Get role, userId and creatorType from query params

        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required' });
        }

        const parsedStudentId = parseInt(studentId);

        // Validate student ID
        Validation.isInteger(parsedStudentId, "Student ID must be a valid integer.");

        // Call the stored procedure
        const { success, data, error } = await callProcedure('getStudentEnrollments', [
            parsedStudentId,
            role || null,
            userId ? parseInt(userId) : null,
            creatorType || null
        ]);

        if (!success) {
            return next(error);
        }

        // If no enrollments, we'll have an empty array but need to handle that case
        if (!data || data.length === 0) {
            return res.status(200).json({
                message: 'No enrollments found for this student',
                student: {
                    id: parsedStudentId,
                    name: '',
                    email: ''
                },
                enrollments: [],
                count: 0,
                appliedFilters: {
                    role: role || null,
                    userId: userId ? parseInt(userId) : null,
                    creatorType: creatorType || null
                }
            });
        }

        // Get student details from first row (all rows will have the same student info)
        const studentDetails = data.length > 0 ? {
            id: data[0].id,
            full_name: data[0].full_name,
            email: data[0].email
        } : null;

        // Format the enrollments data
        const formattedEnrollments = data.map(enrollment => ({
            enrollmentId: enrollment.enrollment_id,
            courseId: enrollment.course_id,
            courseTitle: enrollment.course_title || 'Unknown Course',
            courseDescription: enrollment.course_description || '',
            courseThumbnail: enrollment.course_thumbnail || '',
            enrollmentDate: enrollment.enrollment_date,
            status: enrollment.status,
            completionPercentage: enrollment.completion_percentage
        }));

        return res.status(200).json({
            message: 'Student enrollments retrieved successfully',
            student: {
                id: studentDetails ? studentDetails.id : parsedStudentId,
                name: studentDetails ? studentDetails.full_name : '',
                email: studentDetails ? studentDetails.email : ''
            },
            enrollments: formattedEnrollments,
            count: formattedEnrollments.length,
            appliedFilters: {
                role: role || null,
                userId: userId ? parseInt(userId) : null,
                creatorType: creatorType || null
            }
        });

    } catch (error) {
        console.error('Error fetching student enrollments:', error);
        return next(error);
    }
};


// Get modules for a specific course
exports.getModulesByCourse = async (req, res, next) => {
    try {
        const { courseId } = req.params;

        if (!courseId) {
            return res.status(400).json({ message: 'Course ID is required' });
        }

        const parsedCourseId = parseInt(courseId);

        // Validate course ID
        Validation.isInteger(parsedCourseId, "Course ID must be a valid integer.");

        // Call the stored procedure
        const { success, data, error } = await callProcedure('getModulesByCourse', [parsedCourseId]);

        if (!success) {
            return next(error);
        }

        // If no modules found, return empty array
        if (!data || data.length === 0) {
            return res.status(200).json({
                message: 'No modules found for this course',
                course: {
                    id: parsedCourseId,
                    title: ''
                },
                modules: [],
                count: 0
            });
        }

        // Get course details from first row
        const courseDetails = {
            id: parsedCourseId,
            title: data[0].course_title || ''
        };

        const formattedModules = data.map(module => ({
            id: module.id,
            title: module.title,
            sequenceNo: module.sequence_no,
            durationHours: module.duration_minutes
        }));

        return res.status(200).json({
            message: 'Course modules retrieved successfully',
            course: {
                id: courseDetails.id,
                title: courseDetails.title
            },
            modules: formattedModules,
            count: formattedModules.length
        });

    } catch (error) {
        console.error('Error fetching course modules:', error);
        return next(error);
    }
};


//  Get topics for a specific module (Extra no used now)
exports.getTopicsByModule = async (req, res, next) => {
    try {
        const { moduleId } = req.params;

        if (!moduleId) {
            return res.status(400).json({ message: 'Module ID is required' });
        }

        const parsedModuleId = parseInt(moduleId);

        // Validate module ID
        Validation.isInteger(parsedModuleId, "Module ID must be a valid integer.");

        // Call the stored procedure
        const { success, data, error } = await callProcedure('getTopicsByModule', [parsedModuleId]);

        if (!success) {
            return next(error);
        }

        // If no topics found, return empty array
        if (!data || data.length === 0) {
            return res.status(200).json({
                message: 'No topics found for this module',
                module: {
                    id: parsedModuleId,
                    title: '',
                    courseId: null
                },
                topics: [],
                count: 0
            });
        }

        // Get module details from first row
        const moduleDetails = {
            id: parsedModuleId,
            title: data[0].module_title || '',
            courseId: data[0].course_id
        };

        const formattedTopics = data.map(topic => ({
            id: topic.id,
            title: topic.title,
            sequenceNo: topic.sequence_no,
            description: topic.description
        }));

        return res.status(200).json({
            message: 'Module topics retrieved successfully',
            module: {
                id: moduleDetails.id,
                title: moduleDetails.title,
                courseId: moduleDetails.course_id
            },
            topics: formattedTopics,
            count: formattedTopics.length
        });

    } catch (error) {
        console.error('Error fetching module topics:', error);
        return next(error);
    }
};