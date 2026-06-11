// utils/procedure/coursePerformanceAnalyticsProcedures.js

const sequelize = require("../../config/db");

const setupCoursePerformanceAnalyicsProcedures = async () => {
  try {
    console.log("🔄 Setting up CoursePerformanceAnalyicsProcedures Analytics procedures...");

    // Get Top Enrolled Courses
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getTopEnrolledCourses()
    BEGIN
      SELECT 
        c.id AS course_id,
        c.title,
        c.thumbnail,
        c.price,
        c.category_id,
        COUNT(e.course_id) AS enrollmentCount
      FROM tbl_enrollments e
      INNER JOIN tbl_courses c ON c.id = e.course_id
      GROUP BY e.course_id, c.id
      ORDER BY enrollmentCount DESC;
    END;
  `);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getTopEnrolledCoursesByAdmin()
BEGIN
  SELECT 
    c.id AS course_id,
    c.title,
    c.thumbnail,
    c.price,
    c.category_id,
    COUNT(e.course_id) AS enrollmentCount
  FROM tbl_enrollments e
  INNER JOIN tbl_courses c ON c.id = e.course_id
  WHERE c.created_by_type = 'admin'
  GROUP BY e.course_id, c.id
  ORDER BY enrollmentCount DESC;
END;
  `);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getTopEnrolledCoursesByPartners()
BEGIN
  SELECT 
    c.id AS course_id,
    c.title,
    c.thumbnail,
    c.price,
    c.category_id,
    COUNT(e.course_id) AS enrollmentCount
  FROM tbl_enrollments e
  INNER JOIN tbl_courses c ON c.id = e.course_id
  WHERE c.created_by_type = 'partner'
  GROUP BY e.course_id, c.id
  ORDER BY enrollmentCount DESC;
END;
  `);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getTopEnrolledCoursesForPartner(IN userId INT)
BEGIN
  SELECT 
    c.id AS course_id,
    c.title,
    c.thumbnail,
    c.price,
    c.category_id,
    COUNT(e.course_id) AS enrollmentCount
  FROM tbl_enrollments e
  INNER JOIN tbl_courses c ON c.id = e.course_id
  WHERE c.created_by = userId AND c.created_by_type = 'partner'
  GROUP BY e.course_id, c.id
  ORDER BY enrollmentCount DESC;
END;
  `);

    // Get Top Rated Courses
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getTopRatedCourses()
BEGIN
    SELECT 
        r.course_id,
        AVG(r.rating) AS averageRating,
        COUNT(r.id) AS reviewCount,
        c.id AS course_id,
        c.title,
        c.thumbnail,
        c.price,
        c.category_id
    FROM tbl_reviews AS r
    LEFT JOIN tbl_courses AS c ON r.course_id = c.id
    GROUP BY r.course_id, c.id
    ORDER BY averageRating DESC;
END `);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getTopRatedCoursesByAdmin()
BEGIN
    SELECT 
        c.id AS course_id,
        c.title,
        c.thumbnail,
        c.price,
        c.category_id,
        AVG(r.rating) AS averageRating,
        COUNT(r.id) AS reviewCount
    FROM tbl_reviews AS r
    LEFT JOIN tbl_courses AS c ON r.course_id = c.id
    WHERE c.created_by_type = 'admin'
    GROUP BY c.id, c.title, c.thumbnail, c.price, c.category_id
    ORDER BY averageRating DESC;
END`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getTopRatedCoursesByPartners()
BEGIN
    SELECT 
        c.id AS course_id,
        c.title,
        c.thumbnail,
        c.price,
        c.category_id,
        AVG(r.rating) AS averageRating,
        COUNT(r.id) AS reviewCount
    FROM tbl_reviews AS r
    LEFT JOIN tbl_courses AS c ON r.course_id = c.id
    WHERE c.created_by_type = 'partner'
    GROUP BY c.id, c.title, c.thumbnail, c.price, c.category_id
    ORDER BY averageRating DESC;
END`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getTopRatedCoursesForPartner(IN userId INT)
BEGIN
    SELECT 
        c.id AS course_id,
        c.title,
        c.thumbnail,
        c.price,
        c.category_id,
        AVG(r.rating) AS averageRating,
        COUNT(r.id) AS reviewCount
    FROM tbl_reviews AS r
    LEFT JOIN tbl_courses AS c ON r.course_id = c.id
    WHERE c.created_by = userId AND c.created_by_type = 'partner'
    GROUP BY c.id, c.title, c.thumbnail, c.price, c.category_id
    ORDER BY averageRating DESC;
END`);


    //Course categories with most enrollments
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS  getCategoriesWithMostEnrollments()
BEGIN
  SELECT 
    c.category_id,
    cc.category AS category_name,
    COUNT(e.id) AS enrollmentCount
  FROM tbl_enrollments e
  JOIN tbl_courses c ON e.course_id = c.id
  JOIN tbl_course_categories cc ON c.category_id = cc.id
  GROUP BY c.category_id, cc.category
  ORDER BY enrollmentCount DESC;
END`)

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCategoriesWithMostEnrollmentsByAdmin()
BEGIN
  SELECT 
    c.category_id,
    cc.category AS category_name,
    COUNT(e.id) AS enrollmentCount
  FROM tbl_enrollments e
  JOIN tbl_courses c ON e.course_id = c.id
  JOIN tbl_course_categories cc ON c.category_id = cc.id
  WHERE c.created_by_type = 'admin'
  GROUP BY c.category_id, cc.category
  ORDER BY enrollmentCount DESC;
END`)

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCategoriesWithMostEnrollmentsByPartners()
BEGIN
  SELECT 
    c.category_id,
    cc.category AS category_name,
    COUNT(e.id) AS enrollmentCount
  FROM tbl_enrollments e
  JOIN tbl_courses c ON e.course_id = c.id
  JOIN tbl_course_categories cc ON c.category_id = cc.id
  WHERE c.created_by_type = 'partner'
  GROUP BY c.category_id, cc.category
  ORDER BY enrollmentCount DESC;
END`)

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCategoriesWithMostEnrollmentsForPartner(IN userId INT)
BEGIN
  SELECT 
    c.category_id,
    cc.category AS category_name,
    COUNT(e.id) AS enrollmentCount
  FROM tbl_enrollments e
  JOIN tbl_courses c ON e.course_id = c.id
  JOIN tbl_course_categories cc ON c.category_id = cc.id
  WHERE c.created_by = userId AND c.created_by_type = 'partner'
  GROUP BY c.category_id, cc.category
  ORDER BY enrollmentCount DESC;
END`)

    // Get Average Time to Complete Each Course and Count of Completed Users
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAverageTimeToCompleteCourse()
      BEGIN
          SELECT
              c.id AS course_id,
              c.title,
              c.thumbnail,
              AVG(ctt.total_time_spent) AS averageTimeSpent,
              COUNT(DISTINCT e.user_id) AS completedUsersCount
          FROM tbl_course_time_tracking ctt
          INNER JOIN tbl_enrollments e ON ctt.enrollment_id = e.id
          INNER JOIN tbl_courses c ON e.course_id = c.id
          WHERE e.status = 'completed'
          GROUP BY c.id, c.title, c.thumbnail
          ORDER BY averageTimeSpent DESC;
      END;
  `);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAverageTimeToCompleteCourseByAdmin()
BEGIN
    SELECT
        c.id AS course_id,
        c.title,
        c.thumbnail,
        AVG(ctt.total_time_spent) AS averageTimeSpent,
        COUNT(DISTINCT e.user_id) AS completedUsersCount
    FROM tbl_course_time_tracking ctt
    INNER JOIN tbl_enrollments e ON ctt.enrollment_id = e.id
    INNER JOIN tbl_courses c ON e.course_id = c.id
    WHERE e.status = 'completed'
      AND c.created_by_type = 'admin'
    GROUP BY c.id, c.title, c.thumbnail
    ORDER BY averageTimeSpent DESC;
END
  `);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAverageTimeToCompleteCourseByPartners()
BEGIN
    SELECT
        c.id AS course_id,
        c.title,
        c.thumbnail,
        AVG(ctt.total_time_spent) AS averageTimeSpent,
        COUNT(DISTINCT e.user_id) AS completedUsersCount
    FROM tbl_course_time_tracking ctt
    INNER JOIN tbl_enrollments e ON ctt.enrollment_id = e.id
    INNER JOIN tbl_courses c ON e.course_id = c.id
    WHERE e.status = 'completed'
      AND c.created_by_type = 'partner'
    GROUP BY c.id, c.title, c.thumbnail
    ORDER BY averageTimeSpent DESC;
END
  `);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAverageTimeToCompleteCourseForPartner(IN userId INT)
BEGIN
    SELECT
        c.id AS course_id,
        c.title,
        c.thumbnail,
        AVG(ctt.total_time_spent) AS averageTimeSpent,
        COUNT(DISTINCT e.user_id) AS completedUsersCount
    FROM tbl_course_time_tracking ctt
    INNER JOIN tbl_enrollments e ON ctt.enrollment_id = e.id
    INNER JOIN tbl_courses c ON e.course_id = c.id
    WHERE e.status = 'completed'
      AND c.created_by = userId AND c.created_by_type = 'partner'
    GROUP BY c.id, c.title, c.thumbnail
    ORDER BY averageTimeSpent DESC;
END
  `);

    console.log("✅ CoursePerformanceAnalyicsProcedures procedures created!");
  } catch (error) {
    console.error("❌ Error setting up CoursePerformanceAnalyicsProcedures procedures:", error);
    throw error;
  }
};

module.exports = setupCoursePerformanceAnalyicsProcedures;  