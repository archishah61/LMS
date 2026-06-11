// utils/procedure/userEngagementProcedures.js

const sequelize = require("../../config/db");

const setupUserEngagementProcedures = async () => {
  try {
    console.log("🔄 Setting up User Engagement Analytics procedures...");

    // Procedure: getCompletionAnalytics
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCompletionAnalytics()
BEGIN
  -- Create temporary tables to store results
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_course_completion (
    courseId INT,
    courseTitle VARCHAR(255),
    totalEnrollments INT,
    completed INT,
    completionRate DECIMAL(5,2)
  );

  CREATE TEMPORARY TABLE IF NOT EXISTS temp_user_completion (
    userId INT,
    userName VARCHAR(255),
    totalCourses INT,
    completedCourses INT,
    completionRate DECIMAL(5,2)
  );

  -- Populate course completion data
  INSERT INTO temp_course_completion
  SELECT
    c.id AS courseId,
    c.title AS courseTitle,
    COUNT(e.id) AS totalEnrollments,
    SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS completed,
    ROUND((SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) / COUNT(e.id)) * 100, 2) AS completionRate
  FROM tbl_enrollments e
  JOIN tbl_courses c ON e.course_id = c.id
  GROUP BY e.course_id;

  -- Populate user completion data
  INSERT INTO temp_user_completion
  SELECT
    u.id AS userId,
    u.full_name AS userName,
    COUNT(e.id) AS totalCourses,
    SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS completedCourses,
    ROUND((SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) / COUNT(e.id)) * 100, 2) AS completionRate
  FROM tbl_enrollments e
  JOIN tbl_users u ON e.user_id = u.id
  GROUP BY e.user_id;

  -- Return combined results with type identifier
  SELECT 'course' AS type, courseId, courseTitle, totalEnrollments, completed, completionRate FROM temp_course_completion
  UNION ALL
  SELECT 'user' AS type, userId AS courseId, userName AS courseTitle, totalCourses AS totalEnrollments, completedCourses AS completed, completionRate FROM temp_user_completion;

  -- Clean up
  DROP TEMPORARY TABLE IF EXISTS temp_course_completion;
  DROP TEMPORARY TABLE IF EXISTS temp_user_completion;
END;
    `);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCompletionAnalyticsByAdmin()
BEGIN
  -- Create temporary tables to store results
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_course_completion (
    courseId INT,
    courseTitle VARCHAR(255),
    totalEnrollments INT,
    completed INT,
    completionRate DECIMAL(5,2)
  );

  CREATE TEMPORARY TABLE IF NOT EXISTS temp_user_completion (
    userId INT,
    userName VARCHAR(255),
    totalCourses INT,
    completedCourses INT,
    completionRate DECIMAL(5,2)
  );

  -- Populate course completion data for courses created by the given user
  INSERT INTO temp_course_completion
  SELECT
    c.id AS courseId,
    c.title AS courseTitle,
    COUNT(e.id) AS totalEnrollments,
    SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS completed,
    ROUND((SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) / COUNT(e.id)) * 100, 2) AS completionRate
  FROM tbl_enrollments e
  JOIN tbl_courses c ON e.course_id = c.id
  WHERE c.created_by_type = 'admin'
  GROUP BY c.id, c.title;

  -- Populate user completion data, but only for enrollments in courses created by the given user
  INSERT INTO temp_user_completion
  SELECT
    u.id AS userId,
    u.full_name AS userName,
    COUNT(e.id) AS totalCourses,
    SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS completedCourses,
    ROUND((SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) / COUNT(e.id)) * 100, 2) AS completionRate
  FROM tbl_enrollments e
  JOIN tbl_users u ON e.user_id = u.id
  JOIN tbl_courses c ON e.course_id = c.id
  GROUP BY u.id, u.full_name;

  -- Return combined results with type identifier
  SELECT 'course' AS type, courseId, courseTitle, totalEnrollments, completed, completionRate FROM temp_course_completion
  UNION ALL
  SELECT 'user' AS type, userId AS courseId, userName AS courseTitle, totalCourses AS totalEnrollments, completedCourses AS completed, completionRate FROM temp_user_completion;

  -- Clean up
  DROP TEMPORARY TABLE IF EXISTS temp_course_completion;
  DROP TEMPORARY TABLE IF EXISTS temp_user_completion;
END;
`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS getCompletionAnalyticsByPartners`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCompletionAnalyticsByPartners()
BEGIN
  -- Create temporary tables to store results
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_course_completion (
    courseId INT,
    courseTitle VARCHAR(255),
    totalEnrollments INT,
    completed INT,
    completionRate DECIMAL(5,2)
  );

  CREATE TEMPORARY TABLE IF NOT EXISTS temp_user_completion (
    userId INT,
    userName VARCHAR(255),
    totalCourses INT,
    completedCourses INT,
    completionRate DECIMAL(5,2)
  );

  -- Populate course completion data for courses created by the given user
  INSERT INTO temp_course_completion
  SELECT
    c.id AS courseId,
    c.title AS courseTitle,
    COUNT(e.id) AS totalEnrollments,
    SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS completed,
    ROUND((SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) / COUNT(e.id)) * 100, 2) AS completionRate
  FROM tbl_enrollments e
  JOIN tbl_courses c ON e.course_id = c.id
  WHERE c.created_by_type = 'partner'
  GROUP BY c.id, c.title;

  -- Populate user completion data, but only for enrollments in courses created by the given user
  INSERT INTO temp_user_completion
  SELECT
    u.id AS userId,
    u.full_name AS userName,
    COUNT(e.id) AS totalCourses,
    SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS completedCourses,
    ROUND((SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) / COUNT(e.id)) * 100, 2) AS completionRate
  FROM tbl_enrollments e
  JOIN tbl_users u ON e.user_id = u.id
  JOIN tbl_courses c ON e.course_id = c.id
  WHERE c.created_by_type = 'partner'
  GROUP BY u.id, u.full_name;

  -- Return combined results with type identifier
  SELECT 'course' AS type, courseId, courseTitle, totalEnrollments, completed, completionRate FROM temp_course_completion
  UNION ALL
  SELECT 'user' AS type, userId AS courseId, userName AS courseTitle, totalCourses AS totalEnrollments, completedCourses AS completed, completionRate FROM temp_user_completion;

  -- Clean up
  DROP TEMPORARY TABLE IF EXISTS temp_course_completion;
  DROP TEMPORARY TABLE IF EXISTS temp_user_completion;
END;
`);

    await sequelize.query('DROP PROCEDURE IF EXISTS getCompletionAnalyticsForPartner');
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCompletionAnalyticsForPartner(IN userid INT)
BEGIN
  -- Create temporary tables to store results
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_course_completion (
    courseId INT,
    courseTitle VARCHAR(255),
    totalEnrollments INT,
    completed INT,
    completionRate DECIMAL(5,2)
  );

  CREATE TEMPORARY TABLE IF NOT EXISTS temp_user_completion (
    userId INT,
    userName VARCHAR(255),
    totalCourses INT,
    completedCourses INT,
    completionRate DECIMAL(5,2)
  );

  -- Populate course completion data for courses created by the given user
  INSERT INTO temp_course_completion
  SELECT
    c.id AS courseId,
    c.title AS courseTitle,
    COUNT(e.id) AS totalEnrollments,
    SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS completed,
    ROUND((SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) / COUNT(e.id)) * 100, 2) AS completionRate
  FROM tbl_enrollments e
  JOIN tbl_courses c ON e.course_id = c.id
  WHERE c.created_by = userid AND c.created_by_type = 'partner'
  GROUP BY c.id, c.title;

  -- Populate user completion data, but only for enrollments in courses created by the given user
  INSERT INTO temp_user_completion
  SELECT
    u.id AS userId,
    u.full_name AS userName,
    COUNT(e.id) AS totalCourses,
    SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS completedCourses,
    ROUND((SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) / COUNT(e.id)) * 100, 2) AS completionRate
  FROM tbl_enrollments e
  JOIN tbl_users u ON e.user_id = u.id
  JOIN tbl_courses c ON e.course_id = c.id
  WHERE c.created_by = userid AND c.created_by_type = 'partner'
  GROUP BY u.id, u.full_name;

  -- Return combined results with type identifier
  SELECT 'course' AS type, courseId, courseTitle, totalEnrollments, completed, completionRate FROM temp_course_completion
  UNION ALL
  SELECT 'user' AS type, userId AS courseId, userName AS courseTitle, totalCourses AS totalEnrollments, completedCourses AS completed, completionRate FROM temp_user_completion;

  -- Clean up
  DROP TEMPORARY TABLE IF EXISTS temp_course_completion;
  DROP TEMPORARY TABLE IF EXISTS temp_user_completion;
END;
`);

    // Procedure: getAverageTimeSpentAnalytics
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAverageTimeSpentAnalytics()
BEGIN
  -- Create temporary tables to store results
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_user_analytics (
    userId INT,
    userName VARCHAR(255),
    totalTime INT,
    sessions INT,
    averageTimeSpent VARCHAR(50)
  );
  
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_course_analytics (
    courseId INT,
    courseTitle VARCHAR(255),
    totalTime INT,
    sessions INT,
    averageTimeSpent VARCHAR(50)
  );
  
  -- Populate user analytics
  INSERT INTO temp_user_analytics
  SELECT
    u.id AS userId,
    u.full_name AS userName,
    SUM(t.total_time_spent) AS totalTime,
    COUNT(t.id) AS sessions,
    CONCAT(ROUND(SUM(t.total_time_spent) / COUNT(t.id), 2), ' min') AS averageTimeSpent
  FROM tbl_course_time_tracking t
  JOIN tbl_enrollments e ON t.enrollment_id = e.id
  JOIN tbl_users u ON e.user_id = u.id
  GROUP BY u.id;
  
  -- Populate course analytics
  INSERT INTO temp_course_analytics
  SELECT
    c.id AS courseId,
    c.title AS courseTitle,
    SUM(t.total_time_spent) AS totalTime,
    COUNT(t.id) AS sessions,
    CONCAT(ROUND(SUM(t.total_time_spent) / COUNT(t.id), 2), ' min') AS averageTimeSpent
  FROM tbl_course_time_tracking t
  JOIN tbl_enrollments e ON t.enrollment_id = e.id
  JOIN tbl_courses c ON e.course_id = c.id
  GROUP BY c.id;
  
  -- Return combined results
  SELECT 'user' AS type, userId, userName, totalTime, sessions, averageTimeSpent FROM temp_user_analytics
  UNION ALL
  SELECT 'course' AS type, courseId, courseTitle, totalTime, sessions, averageTimeSpent FROM temp_course_analytics;
  
  -- Clean up
  DROP TEMPORARY TABLE IF EXISTS temp_user_analytics;
  DROP TEMPORARY TABLE IF EXISTS temp_course_analytics;
END;
    `);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAverageTimeSpentAnalyticsByAdmin()
BEGIN
  -- Create temporary tables to store results
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_user_analytics (
    userId INT,
    userName VARCHAR(255),
    totalTime INT,
    sessions INT,
    averageTimeSpent VARCHAR(50)
  );

  CREATE TEMPORARY TABLE IF NOT EXISTS temp_course_analytics (
    courseId INT,
    courseTitle VARCHAR(255),
    totalTime INT,
    sessions INT,
    averageTimeSpent VARCHAR(50)
  );

  -- Populate user analytics for partner's courses only
  INSERT INTO temp_user_analytics
  SELECT
    u.id AS userId,
    u.full_name AS userName,
    SUM(t.total_time_spent) AS totalTime,
    COUNT(t.id) AS sessions,
    CONCAT(ROUND(SUM(t.total_time_spent) / COUNT(t.id), 2), ' min') AS averageTimeSpent
  FROM tbl_course_time_tracking t
  JOIN tbl_enrollments e ON t.enrollment_id = e.id
  JOIN tbl_users u ON e.user_id = u.id
  JOIN tbl_courses c ON e.course_id = c.id
  WHERE c.created_by_type = 'admin'
  GROUP BY u.id, u.full_name;

  -- Populate course analytics for partner's courses only
  INSERT INTO temp_course_analytics
  SELECT
    c.id AS courseId,
    c.title AS courseTitle,
    SUM(t.total_time_spent) AS totalTime,
    COUNT(t.id) AS sessions,
    CONCAT(ROUND(SUM(t.total_time_spent) / COUNT(t.id), 2), ' min') AS averageTimeSpent
  FROM tbl_course_time_tracking t
  JOIN tbl_enrollments e ON t.enrollment_id = e.id
  JOIN tbl_courses c ON e.course_id = c.id
  WHERE c.created_by_type = 'admin'
  GROUP BY c.id, c.title;

  -- Return combined results
  SELECT 'user' AS type, userId, userName, totalTime, sessions, averageTimeSpent FROM temp_user_analytics
  UNION ALL
  SELECT 'course' AS type, courseId, courseTitle, totalTime, sessions, averageTimeSpent FROM temp_course_analytics;

  -- Clean up
  DROP TEMPORARY TABLE IF EXISTS temp_user_analytics;
  DROP TEMPORARY TABLE IF EXISTS temp_course_analytics;
END;
`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAverageTimeSpentAnalyticsByPartners()
BEGIN
  -- Create temporary tables to store results
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_user_analytics (
    userId INT,
    userName VARCHAR(255),
    totalTime INT,
    sessions INT,
    averageTimeSpent VARCHAR(50)
  );

  CREATE TEMPORARY TABLE IF NOT EXISTS temp_course_analytics (
    courseId INT,
    courseTitle VARCHAR(255),
    totalTime INT,
    sessions INT,
    averageTimeSpent VARCHAR(50)
  );

  -- Populate user analytics for partner's courses only
  INSERT INTO temp_user_analytics
  SELECT
    u.id AS userId,
    u.full_name AS userName,
    SUM(t.total_time_spent) AS totalTime,
    COUNT(t.id) AS sessions,
    CONCAT(ROUND(SUM(t.total_time_spent) / COUNT(t.id), 2), ' min') AS averageTimeSpent
  FROM tbl_course_time_tracking t
  JOIN tbl_enrollments e ON t.enrollment_id = e.id
  JOIN tbl_users u ON e.user_id = u.id
  JOIN tbl_courses c ON e.course_id = c.id
  WHERE c.created_by_type = 'partner'
  GROUP BY u.id, u.full_name;

  -- Populate course analytics for partner's courses only
  INSERT INTO temp_course_analytics
  SELECT
    c.id AS courseId,
    c.title AS courseTitle,
    SUM(t.total_time_spent) AS totalTime,
    COUNT(t.id) AS sessions,
    CONCAT(ROUND(SUM(t.total_time_spent) / COUNT(t.id), 2), ' min') AS averageTimeSpent
  FROM tbl_course_time_tracking t
  JOIN tbl_enrollments e ON t.enrollment_id = e.id
  JOIN tbl_courses c ON e.course_id = c.id
  WHERE c.created_by_type = 'partner'
  GROUP BY c.id, c.title;

  -- Return combined results
  SELECT 'user' AS type, userId, userName, totalTime, sessions, averageTimeSpent FROM temp_user_analytics
  UNION ALL
  SELECT 'course' AS type, courseId, courseTitle, totalTime, sessions, averageTimeSpent FROM temp_course_analytics;

  -- Clean up
  DROP TEMPORARY TABLE IF EXISTS temp_user_analytics;
  DROP TEMPORARY TABLE IF EXISTS temp_course_analytics;
END;
`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAverageTimeSpentAnalyticsForPartner(IN userId INT)
BEGIN
  -- Create temporary tables to store results
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_user_analytics (
    userId INT,
    userName VARCHAR(255),
    totalTime INT,
    sessions INT,
    averageTimeSpent VARCHAR(50)
  );

  CREATE TEMPORARY TABLE IF NOT EXISTS temp_course_analytics (
    courseId INT,
    courseTitle VARCHAR(255),
    totalTime INT,
    sessions INT,
    averageTimeSpent VARCHAR(50)
  );

  -- Populate user analytics for partner's courses only
  INSERT INTO temp_user_analytics
  SELECT
    u.id AS userId,
    u.full_name AS userName,
    SUM(t.total_time_spent) AS totalTime,
    COUNT(t.id) AS sessions,
    CONCAT(ROUND(SUM(t.total_time_spent) / COUNT(t.id), 2), ' min') AS averageTimeSpent
  FROM tbl_course_time_tracking t
  JOIN tbl_enrollments e ON t.enrollment_id = e.id
  JOIN tbl_users u ON e.user_id = u.id
  JOIN tbl_courses c ON e.course_id = c.id
  WHERE c.created_by = userId AND c.created_by_type = 'partner'
  GROUP BY u.id, u.full_name;

  -- Populate course analytics for partner's courses only
  INSERT INTO temp_course_analytics
  SELECT
    c.id AS courseId,
    c.title AS courseTitle,
    SUM(t.total_time_spent) AS totalTime,
    COUNT(t.id) AS sessions,
    CONCAT(ROUND(SUM(t.total_time_spent) / COUNT(t.id), 2), ' min') AS averageTimeSpent
  FROM tbl_course_time_tracking t
  JOIN tbl_enrollments e ON t.enrollment_id = e.id
  JOIN tbl_courses c ON e.course_id = c.id
  WHERE c.created_by = userId AND c.created_by_type = 'partner'
  GROUP BY c.id, c.title;

  -- Return combined results
  SELECT 'user' AS type, userId, userName, totalTime, sessions, averageTimeSpent FROM temp_user_analytics
  UNION ALL
  SELECT 'course' AS type, courseId, courseTitle, totalTime, sessions, averageTimeSpent FROM temp_course_analytics;

  -- Clean up
  DROP TEMPORARY TABLE IF EXISTS temp_user_analytics;
  DROP TEMPORARY TABLE IF EXISTS temp_course_analytics;
END;
`);

    // Procedure: average session length of user
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAverageSessionLengths()
   BEGIN
     -- Create temporary tables to store results
     CREATE TEMPORARY TABLE IF NOT EXISTS temp_user_sessions (
       userId INT,
       userName VARCHAR(255),
       totalSessions INT,
       totalDuration INT,
       avgSessionLength VARCHAR(50)
     );
   
     CREATE TEMPORARY TABLE IF NOT EXISTS temp_course_sessions (
       courseId INT,
       courseTitle VARCHAR(255),
       totalSessions INT,
       totalDuration INT,
       avgSessionLength VARCHAR(50)
     );
   
     -- New table for user-course session data
     CREATE TEMPORARY TABLE IF NOT EXISTS temp_user_course_sessions (
       userId INT,
       userName VARCHAR(255),
       courseId INT,
       courseTitle VARCHAR(255),
       totalSessions INT,
       totalDuration INT,
       avgSessionLength VARCHAR(50)
     );
   
     -- Populate user session data
     INSERT INTO temp_user_sessions
     SELECT
       u.id AS userId,
       u.full_name AS userName,
       COUNT(t.id) AS totalSessions,
       SUM(t.total_time_spent) AS totalDuration,
       CONCAT(ROUND(AVG(t.total_time_spent), 2), ' min') AS avgSessionLength
     FROM tbl_course_time_tracking t
     JOIN tbl_enrollments e ON t.enrollment_id = e.id
     JOIN tbl_users u ON e.user_id = u.id
     GROUP BY u.id;
   
     -- Populate course session data
     INSERT INTO temp_course_sessions
     SELECT
       c.id AS courseId,
       c.title AS courseTitle,
       COUNT(t.id) AS totalSessions,
       SUM(t.total_time_spent) AS totalDuration,
       CONCAT(ROUND(AVG(t.total_time_spent), 2), ' min') AS avgSessionLength
     FROM tbl_course_time_tracking t
     JOIN tbl_enrollments e ON t.enrollment_id = e.id
     JOIN tbl_courses c ON e.course_id = c.id
     GROUP BY c.id;
   
     -- Populate user-course session data
     INSERT INTO temp_user_course_sessions
     SELECT
       u.id AS userId,
       u.full_name AS userName,
       c.id AS courseId,
       c.title AS courseTitle,
       COUNT(t.id) AS totalSessions,
       SUM(t.total_time_spent) AS totalDuration,
       CONCAT(ROUND(AVG(t.total_time_spent), 2), ' min') AS avgSessionLength
     FROM tbl_course_time_tracking t
     JOIN tbl_enrollments e ON t.enrollment_id = e.id
     JOIN tbl_users u ON e.user_id = u.id
     JOIN tbl_courses c ON e.course_id = c.id
     GROUP BY u.id, c.id;
   
     -- Return combined results with matching column counts
     SELECT 'user' AS type, userId, userName, NULL AS courseId, NULL AS courseTitle, totalSessions, totalDuration, avgSessionLength FROM temp_user_sessions
     UNION ALL
     SELECT 'course' AS type, NULL AS userId, NULL AS userName, courseId, courseTitle, totalSessions, totalDuration, avgSessionLength FROM temp_course_sessions
     UNION ALL
     SELECT 'user_course' AS type, userId, userName, courseId, courseTitle, totalSessions, totalDuration, avgSessionLength FROM temp_user_course_sessions;
   
     -- Clean up
     DROP TEMPORARY TABLE IF EXISTS temp_user_sessions;
     DROP TEMPORARY TABLE IF EXISTS temp_course_sessions;
     DROP TEMPORARY TABLE IF EXISTS temp_user_course_sessions;
   END;
   `)

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAverageSessionLengthsByAdmin()
BEGIN
  -- Create temporary tables to store results
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_user_sessions (
    userId INT,
    userName VARCHAR(255),
    totalSessions INT,
    totalDuration INT,
    avgSessionLength VARCHAR(50)
  );

  CREATE TEMPORARY TABLE IF NOT EXISTS temp_course_sessions (
    courseId INT,
    courseTitle VARCHAR(255),
    totalSessions INT,
    totalDuration INT,
    avgSessionLength VARCHAR(50)
  );

  CREATE TEMPORARY TABLE IF NOT EXISTS temp_user_course_sessions (
    userId INT,
    userName VARCHAR(255),
    courseId INT,
    courseTitle VARCHAR(255),
    totalSessions INT,
    totalDuration INT,
    avgSessionLength VARCHAR(50)
  );

  -- Populate user session data (for partner's courses only)
  INSERT INTO temp_user_sessions
  SELECT
    u.id AS userId,
    u.full_name AS userName,
    COUNT(t.id) AS totalSessions,
    SUM(t.total_time_spent) AS totalDuration,
    CONCAT(ROUND(AVG(t.total_time_spent), 2), ' min') AS avgSessionLength
  FROM tbl_course_time_tracking t
  JOIN tbl_enrollments e ON t.enrollment_id = e.id
  JOIN tbl_users u ON e.user_id = u.id
  JOIN tbl_courses c ON e.course_id = c.id
  WHERE c.created_by_type = 'admin'
  GROUP BY u.id, u.full_name;

  -- Populate course session data (for partner's courses only)
  INSERT INTO temp_course_sessions
  SELECT
    c.id AS courseId,
    c.title AS courseTitle,
    COUNT(t.id) AS totalSessions,
    SUM(t.total_time_spent) AS totalDuration,
    CONCAT(ROUND(AVG(t.total_time_spent), 2), ' min') AS avgSessionLength
  FROM tbl_course_time_tracking t
  JOIN tbl_enrollments e ON t.enrollment_id = e.id
  JOIN tbl_courses c ON e.course_id = c.id
  WHERE c.created_by_type = 'admin'
  GROUP BY c.id, c.title;

  -- Populate user-course session data (for partner's courses only)
  INSERT INTO temp_user_course_sessions
  SELECT
    u.id AS userId,
    u.full_name AS userName,
    c.id AS courseId,
    c.title AS courseTitle,
    COUNT(t.id) AS totalSessions,
    SUM(t.total_time_spent) AS totalDuration,
    CONCAT(ROUND(AVG(t.total_time_spent), 2), ' min') AS avgSessionLength
  FROM tbl_course_time_tracking t
  JOIN tbl_enrollments e ON t.enrollment_id = e.id
  JOIN tbl_users u ON e.user_id = u.id
  JOIN tbl_courses c ON e.course_id = c.id
  WHERE c.created_by_type = 'admin'
  GROUP BY u.id, u.full_name, c.id, c.title;

  -- Return combined results with matching column counts
  SELECT 'user' AS type, userId, userName, NULL AS courseId, NULL AS courseTitle, totalSessions, totalDuration, avgSessionLength FROM temp_user_sessions
  UNION ALL
  SELECT 'course' AS type, NULL AS userId, NULL AS userName, courseId, courseTitle, totalSessions, totalDuration, avgSessionLength FROM temp_course_sessions
  UNION ALL
  SELECT 'user_course' AS type, userId, userName, courseId, courseTitle, totalSessions, totalDuration, avgSessionLength FROM temp_user_course_sessions;

  -- Clean up
  DROP TEMPORARY TABLE IF EXISTS temp_user_sessions;
  DROP TEMPORARY TABLE IF EXISTS temp_course_sessions;
  DROP TEMPORARY TABLE IF EXISTS temp_user_course_sessions;
END;
`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAverageSessionLengthsByPartners()
BEGIN
  -- Create temporary tables to store results
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_user_sessions (
    userId INT,
    userName VARCHAR(255),
    totalSessions INT,
    totalDuration INT,
    avgSessionLength VARCHAR(50)
  );

  CREATE TEMPORARY TABLE IF NOT EXISTS temp_course_sessions (
    courseId INT,
    courseTitle VARCHAR(255),
    totalSessions INT,
    totalDuration INT,
    avgSessionLength VARCHAR(50)
  );

  CREATE TEMPORARY TABLE IF NOT EXISTS temp_user_course_sessions (
    userId INT,
    userName VARCHAR(255),
    courseId INT,
    courseTitle VARCHAR(255),
    totalSessions INT,
    totalDuration INT,
    avgSessionLength VARCHAR(50)
  );

  -- Populate user session data (for partner's courses only)
  INSERT INTO temp_user_sessions
  SELECT
    u.id AS userId,
    u.full_name AS userName,
    COUNT(t.id) AS totalSessions,
    SUM(t.total_time_spent) AS totalDuration,
    CONCAT(ROUND(AVG(t.total_time_spent), 2), ' min') AS avgSessionLength
  FROM tbl_course_time_tracking t
  JOIN tbl_enrollments e ON t.enrollment_id = e.id
  JOIN tbl_users u ON e.user_id = u.id
  JOIN tbl_courses c ON e.course_id = c.id
  WHERE c.created_by_type = 'partner'
  GROUP BY u.id, u.full_name;

  -- Populate course session data (for partner's courses only)
  INSERT INTO temp_course_sessions
  SELECT
    c.id AS courseId,
    c.title AS courseTitle,
    COUNT(t.id) AS totalSessions,
    SUM(t.total_time_spent) AS totalDuration,
    CONCAT(ROUND(AVG(t.total_time_spent), 2), ' min') AS avgSessionLength
  FROM tbl_course_time_tracking t
  JOIN tbl_enrollments e ON t.enrollment_id = e.id
  JOIN tbl_courses c ON e.course_id = c.id
  WHERE c.created_by_type = 'partner'
  GROUP BY c.id, c.title;

  -- Populate user-course session data (for partner's courses only)
  INSERT INTO temp_user_course_sessions
  SELECT
    u.id AS userId,
    u.full_name AS userName,
    c.id AS courseId,
    c.title AS courseTitle,
    COUNT(t.id) AS totalSessions,
    SUM(t.total_time_spent) AS totalDuration,
    CONCAT(ROUND(AVG(t.total_time_spent), 2), ' min') AS avgSessionLength
  FROM tbl_course_time_tracking t
  JOIN tbl_enrollments e ON t.enrollment_id = e.id
  JOIN tbl_users u ON e.user_id = u.id
  JOIN tbl_courses c ON e.course_id = c.id
  WHERE c.created_by_type = 'partner'
  GROUP BY u.id, u.full_name, c.id, c.title;

  -- Return combined results with matching column counts
  SELECT 'user' AS type, userId, userName, NULL AS courseId, NULL AS courseTitle, totalSessions, totalDuration, avgSessionLength FROM temp_user_sessions
  UNION ALL
  SELECT 'course' AS type, NULL AS userId, NULL AS userName, courseId, courseTitle, totalSessions, totalDuration, avgSessionLength FROM temp_course_sessions
  UNION ALL
  SELECT 'user_course' AS type, userId, userName, courseId, courseTitle, totalSessions, totalDuration, avgSessionLength FROM temp_user_course_sessions;

  -- Clean up
  DROP TEMPORARY TABLE IF EXISTS temp_user_sessions;
  DROP TEMPORARY TABLE IF EXISTS temp_course_sessions;
  DROP TEMPORARY TABLE IF EXISTS temp_user_course_sessions;
END;
`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAverageSessionLengthsForPartner(IN userId INT)
BEGIN
  -- Create temporary tables to store results
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_user_sessions (
    userId INT,
    userName VARCHAR(255),
    totalSessions INT,
    totalDuration INT,
    avgSessionLength VARCHAR(50)
  );

  CREATE TEMPORARY TABLE IF NOT EXISTS temp_course_sessions (
    courseId INT,
    courseTitle VARCHAR(255),
    totalSessions INT,
    totalDuration INT,
    avgSessionLength VARCHAR(50)
  );

  CREATE TEMPORARY TABLE IF NOT EXISTS temp_user_course_sessions (
    userId INT,
    userName VARCHAR(255),
    courseId INT,
    courseTitle VARCHAR(255),
    totalSessions INT,
    totalDuration INT,
    avgSessionLength VARCHAR(50)
  );

  -- Populate user session data (for partner's courses only)
  INSERT INTO temp_user_sessions
  SELECT
    u.id AS userId,
    u.full_name AS userName,
    COUNT(t.id) AS totalSessions,
    SUM(t.total_time_spent) AS totalDuration,
    CONCAT(ROUND(AVG(t.total_time_spent), 2), ' min') AS avgSessionLength
  FROM tbl_course_time_tracking t
  JOIN tbl_enrollments e ON t.enrollment_id = e.id
  JOIN tbl_users u ON e.user_id = u.id
  JOIN tbl_courses c ON e.course_id = c.id
  WHERE c.created_by = userId AND c.created_by_type = 'partner'
  GROUP BY u.id, u.full_name;

  -- Populate course session data (for partner's courses only)
  INSERT INTO temp_course_sessions
  SELECT
    c.id AS courseId,
    c.title AS courseTitle,
    COUNT(t.id) AS totalSessions,
    SUM(t.total_time_spent) AS totalDuration,
    CONCAT(ROUND(AVG(t.total_time_spent), 2), ' min') AS avgSessionLength
  FROM tbl_course_time_tracking t
  JOIN tbl_enrollments e ON t.enrollment_id = e.id
  JOIN tbl_courses c ON e.course_id = c.id
  WHERE c.created_by = userId AND c.created_by_type = 'partner'
  GROUP BY c.id, c.title;

  -- Populate user-course session data (for partner's courses only)
  INSERT INTO temp_user_course_sessions
  SELECT
    u.id AS userId,
    u.full_name AS userName,
    c.id AS courseId,
    c.title AS courseTitle,
    COUNT(t.id) AS totalSessions,
    SUM(t.total_time_spent) AS totalDuration,
    CONCAT(ROUND(AVG(t.total_time_spent), 2), ' min') AS avgSessionLength
  FROM tbl_course_time_tracking t
  JOIN tbl_enrollments e ON t.enrollment_id = e.id
  JOIN tbl_users u ON e.user_id = u.id
  JOIN tbl_courses c ON e.course_id = c.id
  WHERE c.created_by = userId AND c.created_by_type = 'partner'
  GROUP BY u.id, u.full_name, c.id, c.title;

  -- Return combined results with matching column counts
  SELECT 'user' AS type, userId, userName, NULL AS courseId, NULL AS courseTitle, totalSessions, totalDuration, avgSessionLength FROM temp_user_sessions
  UNION ALL
  SELECT 'course' AS type, NULL AS userId, NULL AS userName, courseId, courseTitle, totalSessions, totalDuration, avgSessionLength FROM temp_course_sessions
  UNION ALL
  SELECT 'user_course' AS type, userId, userName, courseId, courseTitle, totalSessions, totalDuration, avgSessionLength FROM temp_user_course_sessions;

  -- Clean up
  DROP TEMPORARY TABLE IF EXISTS temp_user_sessions;
  DROP TEMPORARY TABLE IF EXISTS temp_course_sessions;
  DROP TEMPORARY TABLE IF EXISTS temp_user_course_sessions;
END;
`);

    //Get 10 recent enrollments
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getRecentEnrollments()
  BEGIN
  SELECT 
    u.full_name AS user_name,
    c.title AS course_title,
    DATE_FORMAT(e.enrollment_date, '%d-%m-%Y') AS enrollment_date,
    cc.category AS course_category
  FROM tbl_enrollments e
  INNER JOIN tbl_users u ON e.user_id = u.id
  INNER JOIN tbl_courses c ON e.course_id = c.id
  INNER JOIN tbl_course_categories cc ON c.category_id = cc.id
  ORDER BY e.enrollment_date DESC
  LIMIT 10;
END`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getRecentEnrollmentsByAdmin()
BEGIN
  SELECT 
    u.full_name AS user_name,
    c.title AS course_title,
    DATE_FORMAT(e.enrollment_date, '%d-%m-%Y') AS enrollment_date,
    cc.category AS course_category
  FROM tbl_enrollments e
  INNER JOIN tbl_users u ON e.user_id = u.id
  INNER JOIN tbl_courses c ON e.course_id = c.id
  INNER JOIN tbl_course_categories cc ON c.category_id = cc.id
  WHERE c.created_by_type = 'admin'
  ORDER BY e.enrollment_date DESC
  LIMIT 10;
END;
`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getRecentEnrollmentsByPartners()
BEGIN
  SELECT 
    u.full_name AS user_name,
    c.title AS course_title,
    DATE_FORMAT(e.enrollment_date, '%d-%m-%Y') AS enrollment_date,
    cc.category AS course_category
  FROM tbl_enrollments e
  INNER JOIN tbl_users u ON e.user_id = u.id
  INNER JOIN tbl_courses c ON e.course_id = c.id
  INNER JOIN tbl_course_categories cc ON c.category_id = cc.id
  WHERE c.created_by_type = 'partner'
  ORDER BY e.enrollment_date DESC
  LIMIT 10;
END;
`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getRecentEnrollmentsForPartner(IN userId INT)
BEGIN
  SELECT 
    u.full_name AS user_name,
    c.title AS course_title,
    DATE_FORMAT(e.enrollment_date, '%d-%m-%Y') AS enrollment_date,
    cc.category AS course_category
  FROM tbl_enrollments e
  INNER JOIN tbl_users u ON e.user_id = u.id
  INNER JOIN tbl_courses c ON e.course_id = c.id
  INNER JOIN tbl_course_categories cc ON c.category_id = cc.id
  WHERE c.created_by = userId AND c.created_by_type = 'partner'
  ORDER BY e.enrollment_date DESC
  LIMIT 10;
END;
`);


    // get faq response analytics
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getStudentFAQAnalytics(
  IN p_course_id INT
)
BEGIN
  -- Create temporary tables to store results
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_faq_question (
    courseId INT,
    courseTitle VARCHAR(255),
    questionId INT,
    questionText VARCHAR(255),
    optionText VARCHAR(255),
    count INT
  );

  -- Populate FAQ question data
  INSERT INTO temp_faq_question
  SELECT
    c.id AS courseId,
    c.title AS courseTitle,
    f.id AS questionId,
    f.question AS questionText,
    o.option_text AS optionText,
    COUNT(r.id) AS count
  FROM
    tbl_student_faq_responses r
  JOIN
    tbl_courses c ON r.course_id = c.id
  JOIN
    tbl_course_faqs f ON r.faq_id = f.id
  JOIN
    tbl_course_faq_options o ON r.selected_option_id = o.id
  WHERE
    (p_course_id IS NULL OR c.id = p_course_id)
  GROUP BY
    c.id, c.title, f.id, f.question, o.option_text;

  -- Create a temporary table to store total counts per question
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_total_question_counts (
    courseId INT,
    questionId INT,
    totalCount INT
  );

  -- Populate total counts per question
  INSERT INTO temp_total_question_counts
  SELECT
    courseId,
    questionId,
    SUM(count) AS totalCount
  FROM
    temp_faq_question
  GROUP BY
    courseId, questionId;

  -- Return results with percentages
  SELECT
    tfq.courseId,
    tfq.courseTitle,
    tfq.questionId,
    tfq.questionText,
    tfq.optionText,
    tfq.count,
    ROUND((tfq.count / ttqc.totalCount) * 100, 2) AS percentage
  FROM
    temp_faq_question tfq
  JOIN
    temp_total_question_counts ttqc ON tfq.courseId = ttqc.courseId AND tfq.questionId = ttqc.questionId;

  -- Clean up
  DROP TEMPORARY TABLE IF EXISTS temp_faq_question;
  DROP TEMPORARY TABLE IF EXISTS temp_total_question_counts;
END 
`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getStudentFAQAnalyticsByAdmin(
  IN p_course_id INT
)
BEGIN
  -- Create temporary tables to store results
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_faq_question (
    courseId INT,
    courseTitle VARCHAR(255),
    questionId INT,
    questionText VARCHAR(255),
    optionText VARCHAR(255),
    count INT
  );

  -- Populate FAQ question data
  INSERT INTO temp_faq_question
  SELECT
    c.id AS courseId,
    c.title AS courseTitle,
    f.id AS questionId,
    f.question AS questionText,
    o.option_text AS optionText,
    COUNT(r.id) AS count
  FROM
    tbl_student_faq_responses r
  JOIN
    tbl_courses c ON r.course_id = c.id
  JOIN
    tbl_course_faqs f ON r.faq_id = f.id
  JOIN
    tbl_course_faq_options o ON r.selected_option_id = o.id
  WHERE
    (p_course_id IS NULL OR c.id = p_course_id)
    AND c.created_by_type = 'admin'
  GROUP BY
    c.id, c.title, f.id, f.question, o.option_text;

  -- Create a temporary table to store total counts per question
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_total_question_counts (
    courseId INT,
    questionId INT,
    totalCount INT
  );

  -- Populate total counts per question
  INSERT INTO temp_total_question_counts
  SELECT
    courseId,
    questionId,
    SUM(count) AS totalCount
  FROM
    temp_faq_question
  GROUP BY
    courseId, questionId;

  -- Return results with percentages
  SELECT
    tfq.courseId,
    tfq.courseTitle,
    tfq.questionId,
    tfq.questionText,
    tfq.optionText,
    tfq.count,
    ROUND((tfq.count / ttqc.totalCount) * 100, 2) AS percentage
  FROM
    temp_faq_question tfq
  JOIN
    temp_total_question_counts ttqc ON tfq.courseId = ttqc.courseId AND tfq.questionId = ttqc.questionId;

  -- Clean up
  DROP TEMPORARY TABLE IF EXISTS temp_faq_question;
  DROP TEMPORARY TABLE IF EXISTS temp_total_question_counts;
END
`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getStudentFAQAnalyticsByPartners(
  IN p_course_id INT
)
BEGIN
  -- Create temporary tables to store results
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_faq_question (
    courseId INT,
    courseTitle VARCHAR(255),
    questionId INT,
    questionText VARCHAR(255),
    optionText VARCHAR(255),
    count INT
  );

  -- Populate FAQ question data
  INSERT INTO temp_faq_question
  SELECT
    c.id AS courseId,
    c.title AS courseTitle,
    f.id AS questionId,
    f.question AS questionText,
    o.option_text AS optionText,
    COUNT(r.id) AS count
  FROM
    tbl_student_faq_responses r
  JOIN
    tbl_courses c ON r.course_id = c.id
  JOIN
    tbl_course_faqs f ON r.faq_id = f.id
  JOIN
    tbl_course_faq_options o ON r.selected_option_id = o.id
  WHERE
    (p_course_id IS NULL OR c.id = p_course_id)
    AND c.created_by_type = 'partner'
  GROUP BY
    c.id, c.title, f.id, f.question, o.option_text;

  -- Create a temporary table to store total counts per question
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_total_question_counts (
    courseId INT,
    questionId INT,
    totalCount INT
  );

  -- Populate total counts per question
  INSERT INTO temp_total_question_counts
  SELECT
    courseId,
    questionId,
    SUM(count) AS totalCount
  FROM
    temp_faq_question
  GROUP BY
    courseId, questionId;

  -- Return results with percentages
  SELECT
    tfq.courseId,
    tfq.courseTitle,
    tfq.questionId,
    tfq.questionText,
    tfq.optionText,
    tfq.count,
    ROUND((tfq.count / ttqc.totalCount) * 100, 2) AS percentage
  FROM
    temp_faq_question tfq
  JOIN
    temp_total_question_counts ttqc ON tfq.courseId = ttqc.courseId AND tfq.questionId = ttqc.questionId;

  -- Clean up
  DROP TEMPORARY TABLE IF EXISTS temp_faq_question;
  DROP TEMPORARY TABLE IF EXISTS temp_total_question_counts;
END
`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getStudentFAQAnalyticsForPartner(
  IN p_course_id INT,
  IN userId INT
)
BEGIN
  -- Create temporary tables to store results
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_faq_question (
    courseId INT,
    courseTitle VARCHAR(255),
    questionId INT,
    questionText VARCHAR(255),
    optionText VARCHAR(255),
    count INT
  );

  -- Populate FAQ question data
  INSERT INTO temp_faq_question
  SELECT
    c.id AS courseId,
    c.title AS courseTitle,
    f.id AS questionId,
    f.question AS questionText,
    o.option_text AS optionText,
    COUNT(r.id) AS count
  FROM
    tbl_student_faq_responses r
  JOIN
    tbl_courses c ON r.course_id = c.id
  JOIN
    tbl_course_faqs f ON r.faq_id = f.id
  JOIN
    tbl_course_faq_options o ON r.selected_option_id = o.id
  WHERE
    (p_course_id IS NULL OR c.id = p_course_id)
    AND c.created_by = userId
    AND c.created_by_type = 'partner'
  GROUP BY
    c.id, c.title, f.id, f.question, o.option_text;

  -- Create a temporary table to store total counts per question
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_total_question_counts (
    courseId INT,
    questionId INT,
    totalCount INT
  );

  -- Populate total counts per question
  INSERT INTO temp_total_question_counts
  SELECT
    courseId,
    questionId,
    SUM(count) AS totalCount
  FROM
    temp_faq_question
  GROUP BY
    courseId, questionId;

  -- Return results with percentages
  SELECT
    tfq.courseId,
    tfq.courseTitle,
    tfq.questionId,
    tfq.questionText,
    tfq.optionText,
    tfq.count,
    ROUND((tfq.count / ttqc.totalCount) * 100, 2) AS percentage
  FROM
    temp_faq_question tfq
  JOIN
    temp_total_question_counts ttqc ON tfq.courseId = ttqc.courseId AND tfq.questionId = ttqc.questionId;

  -- Clean up
  DROP TEMPORARY TABLE IF EXISTS temp_faq_question;
  DROP TEMPORARY TABLE IF EXISTS temp_total_question_counts;
END
`);

    console.log("✅ User Engagement procedures created!");
  } catch (error) {
    console.error("❌ Error setting up User Engagement procedures:", error);
    throw error;
  }
};

module.exports = setupUserEngagementProcedures;
