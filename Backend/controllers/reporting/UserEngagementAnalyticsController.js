const { callProcedure } = require("../../utils/procedure/callProcedure");

// 🚀 Controller: Course Completion Analytics (Stored Procedure)
exports.getCompletionAnalytics = async (req, res) => {
  try {

    const role = req.user.role
    const userId = req.user.id

    let result;

    const { user_type, partner_id } = req.query;


    if (role == "partner") {
      result = await callProcedure("getCompletionAnalyticsForPartner", [
        userId
      ]);
    } else {
      if (user_type == "all") {
        result = await callProcedure("getCompletionAnalytics");
      } else if (user_type == "admin") {
        result = await callProcedure("getCompletionAnalyticsByAdmin");
        
      } else if (user_type == "partner" && partner_id == "all") {
        result = await callProcedure("getCompletionAnalyticsByPartners");
      } else if (user_type == "partner" && partner_id != "all") {
        result = await callProcedure("getCompletionAnalyticsForPartner", [
          partner_id
        ]);
      } else {
        result = await callProcedure("getCompletionAnalytics");
      }
    }
    // Call stored procedure that calculates revenue by course category
    const { success, data, error } = result;

    if (!success) {
      return res.status(500).json({ success: false, error });
    }

    // Separate course and user data
    const courseCompletionRates = data
      .filter(item => item.type === 'course')
      .map(course => ({
        courseId: course.courseId,
        courseTitle: course.courseTitle,
        totalEnrollments: parseInt(course.totalEnrollments),
        completed: parseInt(course.completed),
        completionRate: parseFloat(course.completionRate).toFixed(2) + "%"
      }));

    const userCompletionRates = data
      .filter(item => item.type === 'user')
      .map(user => ({
        userId: user.courseId, // Note: courseId is used here to match the structure
        userName: user.courseTitle, // Note: courseTitle is used here to match the structure
        totalCourses: parseInt(user.totalEnrollments),
        completedCourses: parseInt(user.completed),
        completionRate: parseFloat(user.completionRate).toFixed(2) + "%"
      }));

    res.status(200).json({
      success: true,
      data: {
        courseCompletionRates,
        userCompletionRates,
      },
    });
  } catch (error) {
    console.error("Error in completion analytics (SP):", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 🚀 Controller: Average Time Spent Analytics (Stored Procedure)
exports.getAverageTimeSpentAnalytics = async (req, res) => {
  try {

    const role = req.user.role
    const userId = req.user.id

    let result;

    const { user_type, partner_id } = req.query;


    if (role == "partner") {
      result = await callProcedure("getAverageTimeSpentAnalyticsForPartner", [
        userId
      ]);
    } else {
      if (user_type == "all") {
        result = await callProcedure("getAverageTimeSpentAnalytics");
      } else if (user_type == "admin") {
        result = await callProcedure("getAverageTimeSpentAnalyticsByAdmin");
        
      } else if (user_type == "partner" && partner_id == "all") {
        result = await callProcedure("getAverageTimeSpentAnalyticsByPartners");
        
      } else if (user_type == "partner" && partner_id != "all") {
        result = await callProcedure("getAverageTimeSpentAnalyticsForPartner", [
          partner_id
        ]);
      } else {
        result = await callProcedure("getAverageTimeSpentAnalytics");
      }
    }
    // Call stored procedure that calculates revenue by course category
    const { success, data, error } = result;

    if (!success) {
      return res.status(500).json({ success: false, error });
    }

    // Separate user and course data
    const averageTimePerUser = data
      .filter(item => item.type === 'user')
      .map(user => ({
        userId: user.userId,
        userName: user.userName,
        totalTime: user.totalTime,
        sessions: user.sessions,
        averageTimeSpent: user.averageTimeSpent
      }));

    const averageTimePerCourse = data
      .filter(item => item.type === 'course')
      .map(course => ({
        courseId: course.userId,  // Note: This is userId from the UNION result
        courseTitle: course.userName,  // This is userName from the UNION result
        totalTime: course.totalTime,
        sessions: course.sessions,
        averageTimeSpent: course.averageTimeSpent
      }));

    res.status(200).json({
      success: true,
      data: {
        averageTimePerUser,
        averageTimePerCourse,
      },
    });
  } catch (error) {
    console.error("Error in average time analytics (SP):", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 🚀 Controller: Average Session Length Analytics (Stored Procedure)
exports.getAverageSessionLengths = async (req, res) => {
  try {

    const role = req.user.role
    const userId = req.user.id

    let result;

    const { user_type, partner_id } = req.query;


    if (role == "partner") {
      result = await callProcedure("getAverageSessionLengthsForPartner", [
        userId
      ]);
    } else {

      if (user_type == "all") {
        result = await callProcedure("getAverageSessionLengths");
      } else if (user_type == "admin") {
        result = await callProcedure("getAverageSessionLengthsByAdmin");
        
      } else if (user_type == "partner" && partner_id == "all") {
        result = await callProcedure("getAverageSessionLengthsByPartners");
        
      } else if (user_type == "partner" && partner_id != "all") {
        result = await callProcedure("getAverageSessionLengthsForPartner", [
          partner_id
        ]);
      } else {
        result = await callProcedure("getAverageSessionLengths");
      }
    }
    // Call stored procedure that calculates revenue by course category
    const { success, data, error } = result;

    if (!success) {
      return res.status(500).json({ success: false, error });
    }

    // Separate user and course data
    const averageSessionPerUser = data
      .filter(item => item.type === 'user')
      .map(user => ({
        userId: user.userId,
        userName: user.userName,
        totalSessions: parseInt(user.totalSessions),
        totalDuration: parseInt(user.totalDuration),
        averageSessionLength: user.avgSessionLength
      }));

    const averageSessionPerCourse = data
      .filter(item => item.type === 'course')
      .map(course => ({
        courseId: course.courseId,
        courseTitle: course.courseTitle,
        totalSessions: parseInt(course.totalSessions),
        totalDuration: parseInt(course.totalDuration),
        averageSessionLength: course.avgSessionLength
      }));

    // New field for user-course session data
    const averageSessionPerUserCourse = data
      .filter(item => item.type === 'user_course')
      .map(userCourse => ({
        userId: userCourse.userId,
        userName: userCourse.userName,
        courseId: userCourse.courseId,
        courseTitle: userCourse.courseTitle,
        totalSessions: parseInt(userCourse.totalSessions),
        totalDuration: parseInt(userCourse.totalDuration),
        averageSessionLength: userCourse.avgSessionLength
      }));

    // Calculate the average session length for each course across all users
    const overallAverageSessionPerCourse = {};
    averageSessionPerUserCourse.forEach(userCourse => {
      if (!overallAverageSessionPerCourse[userCourse.courseId]) {
        overallAverageSessionPerCourse[userCourse.courseId] = {
          courseId: userCourse.courseId,
          courseTitle: userCourse.courseTitle,
          totalDuration: 0,
          totalSessions: 0
        };
      }
      overallAverageSessionPerCourse[userCourse.courseId].totalDuration += userCourse.totalDuration;
      overallAverageSessionPerCourse[userCourse.courseId].totalSessions += userCourse.totalSessions;
    });

    // Calculate the average session length
    for (const courseId in overallAverageSessionPerCourse) {
      const courseData = overallAverageSessionPerCourse[courseId];
      courseData.averageSessionLength = (courseData.totalDuration / courseData.totalSessions).toFixed(2) + ' min';
    }

    // Convert the object to an array for the response
    const overallAverageSessionPerCourseArray = Object.values(overallAverageSessionPerCourse);

    res.status(200).json({
      success: true,
      data: {
        averageSessionPerUser,
        averageSessionPerCourse,
        averageSessionPerUserCourse,
        overallAverageSessionPerCourse: overallAverageSessionPerCourseArray // New field added here
      },
    });
  } catch (error) {
    console.error("Error in session length analytics (SP):", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 🚀 Controller: Get Recent Enrollments
exports.getRecentEnrollments = async (req, res) => {
  try {

    const role = req.user.role
    const userId = req.user.id

    let result;

    const { user_type, partner_id } = req.query;


    if (role == "partner") {
      result = await callProcedure("getRecentEnrollmentsForPartner", [
        userId
      ]);
    } else {
      if (user_type == "all") {
        result = await callProcedure("getRecentEnrollments");
      } else if (user_type == "admin") {
        result = await callProcedure("getRecentEnrollmentsByAdmin");
        
      } else if (user_type == "partner" && partner_id == "all") {
        result = await callProcedure("getRecentEnrollmentsByPartners");
        
      } else if (user_type == "partner" && partner_id != "all") {
        result = await callProcedure("getRecentEnrollmentsForPartner", [
          partner_id
        ]);
      } else {
        result = await callProcedure("getRecentEnrollments");
      }
    }


    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch recent enrollments",
        error: result.error
      });
    }

    // Assuming result.data is an array of enrollments
    const enrollments = result.data || [];

    return res.status(200).json({
      success: true,
      data: enrollments
    });

  } catch (error) {
    console.error("Error fetching recent enrollments:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching recent enrollments"
    });
  }
};

// 🚀 Controller: Get Analytics on Student FAQ Responses
exports.getStudentFAQAnalytics = async (req, res) => {
  try {
    const { course_id } = req.query;
    const role = req.user.role
    const userId = req.user.id

    let result;

    const { user_type, partner_id } = req.query;

    if (role == "partner") {
      result = await callProcedure("getStudentFAQAnalyticsForPartner", [
        course_id || null,
        userId
      ]);
    } else {
      if (user_type == "all") {
        result = await callProcedure("getStudentFAQAnalytics",
          [course_id || null]);
      } else if (user_type == "admin") {
        result = await callProcedure("getStudentFAQAnalyticsByAdmin",
          [course_id || null]);
        
      } else if (user_type == "partner" && partner_id == "all") {
        result = await callProcedure("getStudentFAQAnalyticsByPartners",
          [course_id || null]);
        
      } else if (user_type == "partner" && partner_id != "all") {
        result = await callProcedure("getStudentFAQAnalyticsForPartner", [
          course_id || null,
          userId
        ]);
      } else {
        result = await callProcedure("getStudentFAQAnalytics");
      }
    }

    const { success, data, error } = result

    if (!success) {
      return res.status(500).json({ success: false, error });
    }

    // Format the data to group by course and question
    const formattedData = data.reduce((acc, item) => {
      const { courseId, courseTitle, questionId, questionText, optionText, percentage } = item;

      if (!acc[courseId]) {
        acc[courseId] = {
          courseId,
          courseTitle,
          questions: {}
        };
      }

      if (!acc[courseId].questions[questionId]) {
        acc[courseId].questions[questionId] = {
          questionId,
          questionText,
          options: []
        };
      }

      acc[courseId].questions[questionId].options.push({
        optionText,
        percentage
      });

      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: Object.values(formattedData)
    });
  } catch (error) {
    console.error("Error in student FAQ analytics (SP):", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};