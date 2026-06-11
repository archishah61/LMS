const { Op } = require("sequelize");
const Course = require("../../models/course_management/course");
const {
  enrollments,
} = require("../../models/enrollment_management/enrollment_management");
const CourseTimeTracking = require("../../models/learning_progress/courseTimeTracking");
const { callProcedure } = require("../../utils/procedure/callProcedure");
const Validation = require("../../validations");

// Helper function to get current date in YYYY-MM-DD format
function getCurrentDate() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

// Start a course session
// Updated startCourseSession controller
exports.startCourseSession = async (req, res, next) => {
  try {
    const { enrollment_id, userId } = req.body;

    // Validate required fields
    if (!enrollment_id || !userId) {
      return res.status(400).json({
        success: false,
        message: "enrollment_id and userId are required"
      });
    }

    Validation.isNumber(enrollment_id, "Enrollment ID must be a valid number");
    Validation.isNumber(userId, "User ID must be a valid number");

    const { success, data, error } = await callProcedure("start_course_session", [
      enrollment_id,
      userId
    ]);

    if (!success && error) {
      return next(error);
    }

    if (!success) {
      return res.status(400).json({
        success: false,
        message: "Failed to start course session",
        error
      });
    }

    // Extract the session data
    const sessionData = data[0];

    res.status(200).json({
      success: true,
      message: 'Course session started successfully',
      data: {
        session: {
          id: sessionData.id,
          enrollment_id: sessionData.enrollment_id,
          tracking_date: sessionData.tracking_date,
          total_time_spent: sessionData.total_time_spent,
          last_session_start: sessionData.last_session_start,
          last_session_end: sessionData.last_session_end,
          created_by: sessionData.created_by,
          updated_by: sessionData.updated_by,
          created_at: sessionData.created_at,
          updated_at: sessionData.updated_at
        },
        todayMinutesSpent: sessionData.todayMinutesSpent,
        maxDailyMinutes: sessionData.maxDailyMinutes,
        remainingMinutes: sessionData.remainingMinutes,
        sessionStartTime: sessionData.sessionStartTime
      }
    });
  } catch (error) {
    next(error);
  }
};

// End a course session and update time spent
exports.endCourseSession = async (req, res, next) => {
  try {
    const { enrollment_id, userId, actual_time_spent } = req.body;

    // Validate required fields
    if (!enrollment_id || !userId) {
      return res.status(400).json({
        success: false,
        message: "enrollment_id and userId are required",
      });
    }

    Validation.isNumber(enrollment_id, "Enrollment ID must be a valid number");
    Validation.isNumber(userId, "User ID must be a valid number");

    const { success, data, error } = await callProcedure("end_course_session", [
      enrollment_id,
      userId,
      actual_time_spent || 0, // Default to 0 if not provided
    ]);

    if (!success && error) {
      return next(error);
    }

    if (!success) {
      return res.status(400).json({
        success: false,
        message: "Failed to end course session",
        error,
      });
    }

    // Extract response data from procedure
    const responseData = data[0];
    res.status(200).json({
      success: true,
      message: responseData.message,
      data: responseData.data,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSession = async (req, res, next) => {
  try {
    const { enrollment_id, userId, minutes_spent } = req.body;
    // Validate required fields
    if (!enrollment_id || !userId || minutes_spent === undefined) {
      return res.status(400).json({
        success: false,
        message: "enrollment_id, userId, and minutes_spent are required",
      });
    }

    Validation.isNumber(enrollment_id, "Enrollment ID must be a valid number");
    Validation.isNumber(userId, "User ID must be a valid number");

    // Validate minutes_spent is a positive number
    if (typeof minutes_spent !== "number" || minutes_spent < 0) {
      return res.status(400).json({
        success: false,
        message: "minutes_spent must be a positive number",
      });
    }

    const { success, data, error } = await callProcedure(
      "update_course_session",
      [enrollment_id, userId, minutes_spent]
    );

    if (!success && error) {
      return next(error);
    }

    if (!success) {
      return res.status(400).json({
        success: false,
        message: "Failed to update session time",
        error,
      });
    }

    // Extract response data from procedure
    const responseData = data[0];

    res.status(200).json({
      success: true,
      message: responseData.message,
      data: responseData.data,
    });
  } catch (error) {
    next(error);
  }
};

exports.checkCourseAccess = async (req, res, next) => {
  try {
    const { enrollment_id } = req.params;

    Validation.isNumber(enrollment_id, "Enrollment ID must be a valid number");

    const { success, data, error } = await callProcedure("checkCourseAccess", [
      enrollment_id,
    ]);

    if (!success && error) return next(error);

    if (!success) {
      return res.status(400).json({
        success: false,
        error,
      });
    }

    // Extract the data from the procedure call
    const accessData = data[0].data;


    // Return response matching the original controller structure
    res.status(200).json({
      success: true,
      data: {
        canAccess: accessData.canAccess,
        hasActiveSession: accessData.hasActiveSession,
        shouldAutoStart: accessData.shouldAutoStart,
        reason: accessData.reason,
        todayHoursSpent: accessData.todayHoursSpent,
        todayMinutesSpent: accessData.todayMinutesSpent,
        totalHoursSpent: accessData.totalHoursSpent,
        totalMinutesSpent: accessData.totalMinutesSpent,
        todaySecondsSpent: accessData.todaySecondsSpent,
        minRequiredDailyHours: accessData.minRequiredDailyHours,
        maxAllowedDailyHours: accessData.maxAllowedDailyHours,
        minRequiredDailyMinutes: accessData.minRequiredDailyMinutes,
        maxAllowedDailyMinutes: accessData.maxAllowedDailyMinutes,
        minRequiredDailySeconds: accessData.minRequiredDailySeconds,
        maxAllowedDailySeconds: accessData.maxAllowedDailySeconds,
        remainingHours: accessData.remainingHours,
        remainingMinutes: accessData.remainingMinutes,
        remainingSeconds: accessData.remainingSeconds,
        currentDate: accessData.currentDate,
        dailyBreakdown: accessData.dailyBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

// const CourseTimeTracking = require('../../models/learning_progress/courseTimeTracking');
// const { enrollments } = require('../../models/enrollment_management/enrollment_management');
// const Course = require('../../models/course_management/course');
// const { Op } = require('sequelize');

// // Helper function to get current date in YYYY-MM-DD format
// function getCurrentDate() {
//     const now = new Date();
//     return now.toISOString().split('T')[0];
// }

// // Helper function to check if the date has changed
function hasDateChanged(startTime, endTime) {
  return (
    startTime.toISOString().split("T")[0] !==
    endTime.toISOString().split("T")[0]
  );
}

// // Start a course session
// exports.startCourseSession = async (req, res) => {
//   try {
//     let { enrollment_id, userId } = req.body;
//     const now = new Date();
//     const currentDate = getCurrentDate();

//     // Get enrollment with course data
//     const enrollment = await enrollments.findByPk(enrollment_id, {
//       include: [{ model: Course, as: "course" }],
//     });

//     if (!enrollment) {
//       return res.status(404).json({
//         success: false,
//         message: "Enrollment not found",
//       });
//     }

//     const course = enrollment.course;

//     // Check if there's already an active session for this enrollment
//     const activeSession = await CourseTimeTracking.findOne({
//       where: {
//         enrollment_id: enrollment_id,
//         last_session_start: { [Op.ne]: null },
//         last_session_end: null,
//       },
//     });

//     if (activeSession) {
//       return res.status(400).json({
//         success: false,
//         message: "A session is already in progress for this course",
//         data: activeSession,
//       });
//     }

//     // Check if course has a maximum daily hours restriction
//     if (course.max_access_hours !== null && course.max_access_hours > 0) {
//       // Get all of today's time tracking records
//       const todayTrackings = await CourseTimeTracking.findAll({
//         where: {
//           enrollment_id: enrollment_id,
//           tracking_date: currentDate,
//         },
//       });

//       // Calculate today's total minutes spent across all sessions
//       const todayMinutesSpent = todayTrackings.reduce((total, record) => {
//         return total + record.total_time_spent;
//       }, 0);

//       const todayHoursSpent = todayMinutesSpent / 60;

//       // Check if user has already exceeded max hours
//       if (todayMinutesSpent >= course.max_access_hours) {
//         return res.status(403).json({
//           success: false,
//           message: `Cannot start session: Maximum daily limit of ${course.max_access_hours} hours has been reached`,
//           data: {
//             todayHoursSpent: todayHoursSpent.toFixed(2),
//             maxAllowedDaily: (course.max_access_hours / 60).toFixed(2),
//             remainingMinutes: 0,
//           },
//         });
//       }
//     }

//     // Create a new time tracking record for this session
//     const newSession = await CourseTimeTracking.create({
//       enrollment_id: enrollment_id,
//       tracking_date: currentDate,
//       total_time_spent: 0,
//       last_session_start: now,
//       last_session_end: null,
//       created_by: userId,
//       updated_by: userId,
//     });

//     // Calculate remaining time for today
//     const todayTrackings = await CourseTimeTracking.findAll({
//       where: {
//         enrollment_id: enrollment_id,
//         tracking_date: currentDate,
//       },
//     });

//     const todayMinutesSpent = todayTrackings.reduce((total, record) => {
//       return total + record.total_time_spent;
//     }, 0);

//     const maxDailyMinutes = course.max_access_hours
//       ? course.max_access_hours
//       : null;
//     const remainingMinutes = maxDailyMinutes
//       ? Math.max(0, maxDailyMinutes - todayMinutesSpent)
//       : null;

//     res.status(200).json({
//       success: true,
//       message: "Course session started successfully",
//       data: {
//         session: newSession,
//         todayMinutesSpent,
//         maxDailyMinutes,
//         remainingMinutes,
//         sessionStartTime: now,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to start course session",
//       error: error.message,
//     });
//   }
// };

// // End a course session and update time spent
// exports.endCourseSession = async (req, res) => {
//   try {
//     let { enrollment_id, userId, actual_time_spent } = req.body; // Add actual_time_spent parameter
//     const now = new Date();
//     const currentDate = getCurrentDate();

//     // Get the active session record
//     const activeSession = await CourseTimeTracking.findOne({
//       where: {
//         enrollment_id: enrollment_id,
//         last_session_start: { [Op.ne]: null },
//         last_session_end: null,
//       },
//       order: [["last_session_start", "DESC"]],
//     });

//     if (!activeSession) {
//       return res.status(404).json({
//         success: false,
//         message: "No active session found",
//       });
//     }

//     // Convert actual_time_spent from seconds to minutes if provided
//     const actualMinutesSpent = actual_time_spent
//       ? Math.floor(actual_time_spent / 60)
//       : 0;

//     // Check if date has changed (midnight crossed)
//     if (hasDateChanged(activeSession.last_session_start, now)) {
//       // Handle midnight transition
//       const midnight = new Date(now);
//       midnight.setHours(0, 0, 0, 0);

//       // For midnight crossover, we need to split the actual time proportionally
//       // based on how much time was spent before and after midnight
//       const totalWallClockTime = Math.floor(
//         (now - activeSession.last_session_start) / (1000 * 60)
//       );
//       const beforeMidnightWallClock = Math.floor(
//         (midnight - activeSession.last_session_start) / (1000 * 60)
//       );
//       const afterMidnightWallClock = Math.floor((now - midnight) / (1000 * 60));

//       // Split actual engaged time proportionally
//       const beforeMidnightRatio =
//         totalWallClockTime > 0
//           ? beforeMidnightWallClock / totalWallClockTime
//           : 0;
//       const yesterdayActualTime = Math.floor(
//         actualMinutesSpent * beforeMidnightRatio
//       );
//       const todayActualTime = actualMinutesSpent - yesterdayActualTime;

//       // Update yesterday's record with actual engaged time
//       activeSession.total_time_spent = yesterdayActualTime;
//       activeSession.last_session_end = midnight;
//       activeSession.updated_by = userId;
//       await activeSession.save();

//       // Create today's session with actual engaged time (if any)
//       if (todayActualTime > 0) {
//         await CourseTimeTracking.create({
//           enrollment_id: enrollment_id,
//           tracking_date: currentDate,
//           total_time_spent: todayActualTime,
//           last_session_start: midnight,
//           last_session_end: now,
//           created_by: userId,
//           updated_by: userId,
//         });
//       }

//       res.status(200).json({
//         success: true,
//         message: "Course session ended with midnight transition",
//         data: {
//           yesterdaySession: {
//             date: activeSession.tracking_date,
//             duration: yesterdayActualTime,
//           },
//           todaySession: {
//             date: currentDate,
//             duration: todayActualTime,
//           },
//           totalSessionDuration: actualMinutesSpent,
//           actualEngagedTime: actualMinutesSpent,
//         },
//       });
//     } else {
//       // Normal same-day session ending - use actual engaged time
//       activeSession.total_time_spent = actualMinutesSpent;
//       activeSession.last_session_end = now;
//       activeSession.updated_by = userId;
//       await activeSession.save();

//       // Calculate total time spent today
//       const todaySessions = await CourseTimeTracking.findAll({
//         where: {
//           enrollment_id: enrollment_id,
//           tracking_date: currentDate,
//         },
//       });

//       const totalTodayMinutes = todaySessions.reduce((total, record) => {
//         return total + record.total_time_spent;
//       }, 0);

//       res.status(200).json({
//         success: true,
//         message: "Course session ended successfully",
//         data: {
//           sessionDuration: actualMinutesSpent, // Now represents actual engaged time
//           sessionTimeSpent: activeSession.total_time_spent,
//           totalTodayMinutes,
//           totalTodayHours: (totalTodayMinutes / 60).toFixed(2),
//           date: activeSession.tracking_date,
//           sessionStartTime: activeSession.last_session_start,
//           sessionEndTime: activeSession.last_session_end,
//           actualEngagedTime: actualMinutesSpent,
//         },
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to end course session",
//       error: error.message,
//     });
//   }
// };

// exports.updateSession = async (req, res) => {
//   try {
//     const { enrollment_id, userId, minutes_spent } = req.body;
//     const currentDate = getCurrentDate();

//     // Find the active session
//     const activeSession = await CourseTimeTracking.findOne({
//       where: {
//         enrollment_id: enrollment_id,
//         tracking_date: currentDate,
//         last_session_start: { [Op.ne]: null },
//         last_session_end: null,
//       },
//       order: [["last_session_start", "DESC"]],
//     });

//     if (!activeSession) {
//       return res.status(404).json({
//         success: false,
//         message: "No active session found",
//       });
//     }

//     // Update the session with accumulated time
//     activeSession.total_time_spent = activeSession.total_time_spent + minutes_spent;
//     activeSession.updated_by = userId;
//     await activeSession.save();

//     res.status(200).json({
//       success: true,
//       message: "Session time updated successfully",
//       data: {
//         sessionTimeSpent: activeSession.total_time_spent,
//         trackingDate: activeSession.tracking_date,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to update session time",
//       error: error.message,
//     });
//   }
// };

// // // Check if a student can access a course based on daily time restrictions
// exports.checkCourseAccess = async (req, res) => {
//   try {
//     const { enrollment_id } = req.params;
//     const currentDate = getCurrentDate();

//     // Get enrollment with course data
//     const enrollment = await enrollments.findByPk(enrollment_id, {
//       include: [{ model: Course, as: "course" }],
//     });

//     if (!enrollment) {
//       return res.status(404).json({
//         success: false,
//         message: "Enrollment not found",
//       });
//     }

//     const course = enrollment.course;

//     // Get all of today's time tracking records
//     const todayTrackings = await CourseTimeTracking.findAll({
//       where: {
//         enrollment_id: enrollment_id,
//         tracking_date: currentDate,
//       },
//     });

//     // Calculate today's total minutes spent across all sessions
//     const todayMinutesSpent = todayTrackings.reduce((total, record) => {
//       return total + record.total_time_spent;
//     }, 0);

//     const todayHoursSpent = todayMinutesSpent / 60;

//     // Check if there's an active session
//     const hasActiveSession = todayTrackings.some(
//       (record) => record.last_session_start && !record.last_session_end
//     );

//     // Get all time tracking records for historical data across all days
//     const allTimeTrackings = await CourseTimeTracking.findAll({
//       where: { enrollment_id: enrollment_id },
//       order: [["tracking_date", "DESC"]],
//     });

//     // Calculate total minutes across all days
//     const totalMinutesSpent = allTimeTrackings.reduce((total, record) => {
//       return total + record.total_time_spent;
//     }, 0);

//     const totalHoursSpent = totalMinutesSpent / 60;

//     // Check daily time restrictions
//     const maxHoursRestriction =
//       course.max_access_hours !== null &&
//       todayMinutesSpent >= course.max_access_hours;

//     // Calculate remaining time for today
//     const maxDailyMinutes = course.max_access_hours
//       ? course.max_access_hours
//       : null;
//     const remainingMinutes = maxDailyMinutes
//       ? Math.max(0, maxDailyMinutes - todayMinutesSpent)
//       : null;

//     // Determine if user can access (simplified logic for auto-start)
//     const canAccess = !maxHoursRestriction;

//     // Determine if auto-start should happen
//     const shouldAutoStart =
//       canAccess && !hasActiveSession && remainingMinutes > 0;

//     const reason = maxHoursRestriction
//       ? `Maximum ${course.max_access_hours} minutes exceeded today (${todayMinutesSpent} completed)`
//       : null;

//     // Group records by date for the daily breakdown
//     const dailyBreakdown = [];
//     const dateMap = new Map();

//     allTimeTrackings.forEach((record) => {
//       const date = record.tracking_date;
//       if (!dateMap.has(date)) {
//         dateMap.set(date, 0);
//       }
//       dateMap.set(date, dateMap.get(date) + record.total_time_spent);
//     });

//     dateMap.forEach((minutes, date) => {
//       dailyBreakdown.push({
//         date,
//         minutesSpent: minutes,
//         hoursSpent: (minutes / 60).toFixed(2),
//       });
//     });

//     // Sort daily breakdown by date (newest first)
//     dailyBreakdown.sort((a, b) => new Date(b.date) - new Date(a.date));


//     res.status(200).json({
//       success: true,
//       data: {
//         canAccess,
//         hasActiveSession,
//         shouldAutoStart,
//         reason,
//         todayHoursSpent: todayHoursSpent.toFixed(2),
//         todayMinutesSpent,
//         totalHoursSpent: totalHoursSpent.toFixed(2),
//         totalMinutesSpent,
//         minRequiredDailyHours: course.min_access_hours
//           ? course.min_access_hours / 60
//           : null,
//         maxAllowedDailyHours: course.max_access_hours
//           ? course.max_access_hours / 60
//           : null,
//         minRequiredDailyMinutes: course.min_access_hours || null,
//         maxAllowedDailyMinutes: course.max_access_hours || null,
//         remainingMinutes,
//         currentDate,
//         dailyBreakdown,
//       },
//     });
//   } catch (error) {

//     res.status(500).json({
//       success: false,
//       message: "Failed to check course access",
//       error: error.message,
//     });
//   }
// };

// // Get user's course time statistics
// exports.getCourseTimeStats = async (req, res) => {
//     try {
//         const { enrollment_id } = req.params;

//         // Get enrollment with course data
//         const enrollment = await enrollments.findByPk(enrollment_id, {
//             include: [{ model: Course, as: 'course' }]
//         });

//         if (!enrollment) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Enrollment not found'
//             });
//         }

//         // Get all time tracking records for this enrollment
//         const timeTrackings = await CourseTimeTracking.findAll({
//             where: { enrollment_id: enrollment_id },
//             order: [['tracking_date', 'DESC']]
//         });

//         if (!timeTrackings.length) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'No time tracking data found for this enrollment'
//             });
//         }

//         // Calculate total minutes across all days
//         const totalMinutesSpent = timeTrackings.reduce((total, record) => {
//             return total + record.total_time_spent;
//         }, 0);

//         const hoursSpent = Math.floor(totalMinutesSpent / 60);
//         const remainingMinutes = totalMinutesSpent % 60;

//         // Get the most recent session
//         const latestSession = timeTrackings[0];

//         res.status(200).json({
//             success: true,
//             data: {
//                 totalTimeSpent: {
//                     minutes: totalMinutesSpent,
//                     formatted: `${hoursSpent}h ${remainingMinutes}m`
//                 },
//                 courseDuration: enrollment.course.duration_hours,
//                 lastSessionStart: latestSession.last_session_start,
//                 lastSessionEnd: latestSession.last_session_end,
//                 currentStatus: latestSession.last_session_start && !latestSession.last_session_end ? 'active' : 'inactive',
//                 enrollment: {
//                     id: enrollment.id,
//                     courseName: enrollment.course.title
//                 },
//                 dailyBreakdown: timeTrackings.map(record => ({
//                     date: record.tracking_date,
//                     minutesSpent: record.total_time_spent,
//                     formattedTime: `${Math.floor(record.total_time_spent / 60)}h ${record.total_time_spent % 60}m`
//                 }))
//             }
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Failed to get time statistics',
//             error: error.message
//         });
//     }
// };

// // Reset course session for a specific date (for administrative purposes)
// exports.resetCourseSession = async (req, res) => {
//     try {
//         const { enrollment_id, tracking_date, adminId } = req.body;

//         // Check if user has admin rights (implement your own logic here)
//         if (req.role !== 'admin') {
//             return res.status(403).json({
//                 success: false,
//                 message: 'Permission denied'
//             });
//         }

//         const timeTracking = await CourseTimeTracking.findOne({
//             where: {
//                 enrollment_id: enrollment_id,
//                 tracking_date: tracking_date || getCurrentDate()
//             }
//         });

//         if (!timeTracking) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Time tracking record not found for the specified date'
//             });
//         }

//         // Reset time tracking data
//         timeTracking.total_time_spent = 0;
//         timeTracking.last_session_start = null;
//         timeTracking.last_session_end = null;
//         timeTracking.updated_by = adminId;
//         await timeTracking.save();

//         res.status(200).json({
//             success: true,
//             message: 'Course session reset successfully for the specified date',
//             data: timeTracking
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Failed to reset course session',
//             error: error.message
//         });
//     }
// };

// // Reset all time tracking for a course enrollment (for administrative purposes)
// exports.resetAllCourseSessions = async (req, res) => {
//     try {
//         const { enrollment_id, adminId } = req.body;

//         // Check if user has admin rights
//         if (req.role !== 'admin') {
//             return res.status(403).json({
//                 success: false,
//                 message: 'Permission denied'
//             });
//         }

//         // Delete all time tracking records for this enrollment
//         const deleted = await CourseTimeTracking.destroy({
//             where: { enrollment_id: enrollment_id }
//         });

//         if (!deleted) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'No time tracking records found for this enrollment'
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: `Successfully reset all time tracking records (${deleted} records deleted)`,
//             data: { deleted }
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Failed to reset all course sessions',
//             error: error.message
//         });
//     }
// };
