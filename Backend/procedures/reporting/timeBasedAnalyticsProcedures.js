const sequelize = require("../../config/db");

const setupTimeBasedAnalyticsProcedures = async () => {
  try {
    console.log("🔄 Setting up Time Based Analytics procedures...");

    // Estimated vs Actual Completion time
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS getEstimatedVsActualCompletionTimes()
      BEGIN
        SELECT 
          c.id AS course_id,
          c.title AS course_title,
          c.duration_minutes AS estimated_hours,
          AVG(e.total_time_spent / 60) AS average_actual_hours, -- Convert minutes to hours
          COUNT(e.id) AS student_count
        FROM tbl_courses c
        JOIN tbl_enrollments e ON e.course_id = c.id
        WHERE e.is_completed = 1 -- Only completed courses
        GROUP BY c.id, c.title, c.duration_minutes
        ORDER BY c.id;
      END`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getEstimatedVsActualCompletionTimesByAdmin()
BEGIN
  SELECT 
    c.id AS course_id,
    c.title AS course_title,
    c.duration_minutes AS estimated_hours,
    AVG(e.total_time_spent / 60) AS average_actual_hours, -- Convert minutes to hours
    COUNT(e.id) AS student_count
  FROM tbl_courses c
  JOIN tbl_enrollments e ON e.course_id = c.id AND e.is_completed = 1 -- Only completed enrollments
  WHERE c.created_by_type = 'admin' -- Filter only the courses created by the user
  GROUP BY c.id, c.title, c.duration_minutes
  ORDER BY c.id;
END`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getEstimatedVsActualCompletionTimesByPartners()
BEGIN
  SELECT 
    c.id AS course_id,
    c.title AS course_title,
    c.duration_minutes AS estimated_hours,
    AVG(e.total_time_spent / 60) AS average_actual_hours, -- Convert minutes to hours
    COUNT(e.id) AS student_count
  FROM tbl_courses c
  JOIN tbl_enrollments e ON e.course_id = c.id AND e.is_completed = 1 -- Only completed enrollments
  WHERE c.created_by_type = 'partner' -- Filter only the courses created by the user
  GROUP BY c.id, c.title, c.duration_minutes
  ORDER BY c.id;
END`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getEstimatedVsActualCompletionTimesForPartner(IN userId INT)
BEGIN
  SELECT 
    c.id AS course_id,
    c.title AS course_title,
    c.duration_minutes AS estimated_hours,
    AVG(e.total_time_spent / 60) AS average_actual_hours, -- Convert minutes to hours
    COUNT(e.id) AS student_count
  FROM tbl_courses c
  JOIN tbl_enrollments e ON e.course_id = c.id AND e.is_completed = 1 -- Only completed enrollments
  WHERE c.created_by = userId AND c.created_by_type = 'partner' -- Filter only the courses created by the user
  GROUP BY c.id, c.title, c.duration_minutes
  ORDER BY c.id;
END`);

    console.log("✅ Time Based Analytics procedures created!");
  } catch (error) {
    console.error("❌ Error setting up Time Based Analytics procedures:", error);
    throw error;
  }
};

module.exports = setupTimeBasedAnalyticsProcedures;