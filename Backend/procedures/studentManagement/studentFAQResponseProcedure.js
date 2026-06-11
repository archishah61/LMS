// utils/procedure/studentFAQResponseProcedure.js

const sequelize = require("../../config/db");

const setupStudentFAQResponseProcedures = async () => {
  try {
    console.log("🔄 Setting up Student FAQ Response procedures...");

    // Procedure: createStudentFAQResponse ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createStudentFAQResponse(
      IN p_user_id INT,
      IN p_course_id INT,
      IN p_faq_id INT,
      IN p_selected_option_id INT,
      IN p_created_by INT
    )
    BEGIN
      INSERT INTO tbl_student_faq_responses (
        user_id,
        course_id,
        faq_id,
        selected_option_id,
        created_by,
        updated_by,
        created_at,
        updated_at
      ) VALUES (
        p_user_id,
        p_course_id,
        p_faq_id,
        p_selected_option_id,
        p_created_by,
        p_created_by,
        NOW(),
        NOW()
      );
      
      SELECT LAST_INSERT_ID() as id;
    END
  `);

    // Procedure: getAllStudentFAQResponses ✅
    await sequelize.query('DROP PROCEDURE IF EXISTS getAllStudentFAQResponses');
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllStudentFAQResponses(
  IN p_course_id INT, 
  IN p_faq_id INT,
  IN p_user_id INT,
  IN p_role ENUM('partner', 'admin'),
  IN p_id INT,
  IN p_created_by VARCHAR(10),
  IN p_createdById INT,
  IN p_search_term VARCHAR(255),
  IN p_limit INT,
  IN p_offset INT,
  IN p_is_all BOOLEAN
)
BEGIN
  DECLARE total_count INT;
  DECLARE v_limit BIGINT;
  DECLARE v_offset BIGINT;

  IF p_is_all = TRUE THEN
      SET v_limit = 9223372036854775807;
      SET v_offset = 0;
  ELSE
      SET v_limit = p_limit;
      SET v_offset = p_offset;
  END IF;
  
  -- Get total count for pagination
  SELECT COUNT(DISTINCT r.user_id) as total_count
  FROM tbl_student_faq_responses r
  LEFT JOIN tbl_courses c ON r.course_id = c.id
  LEFT JOIN tbl_course_faqs cfaq ON r.faq_id = cfaq.id
  LEFT JOIN tbl_users u ON r.created_by = u.id
  WHERE 
    (p_course_id IS NULL OR r.course_id = p_course_id) AND
    (p_faq_id IS NULL OR r.faq_id = p_faq_id) AND
    (p_user_id IS NULL OR r.user_id = p_user_id) 
    AND (p_search_term IS NULL OR p_search_term = '' OR c.title LIKE CONCAT('%', p_search_term, '%') 
    OR u.full_name LIKE CONCAT('%', p_search_term, '%') OR cfaq.question LIKE CONCAT('%', p_search_term, '%')) 
    AND (p_created_by IS NULL OR p_created_by = '' OR c.created_by_type = p_created_by) 
    AND (p_createdById IS NULL OR c.created_by = p_createdById) 
    AND (
      p_role = 'admin' 
      OR (p_role = 'partner' AND c.created_by = p_id AND c.created_by_type = 'partner')
    );
  
  -- Get grouped data
  SELECT 
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'id', u.id,
          'name', u.full_name,
          'email', u.email,
          'courses', (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', course_data.course_id,
                'title', course_data.course_title,
                'questions', course_data.questions
              )
            )
            FROM (
              SELECT 
                c.id as course_id,
                c.title as course_title,
                JSON_ARRAYAGG(
                  JSON_OBJECT(
                    'id', fr.id,
                    'faq_id', fr.faq_id,
                    'faq_question', f.question,
                    'selected_option_id', fr.selected_option_id,
                    'selected_option', o.option_text,
                    'created_by', fr.created_by,
                    'created_by_name', creator.full_name,
                    'updated_by', fr.updated_by,
                    'updated_by_name', updater.full_name,
                    'created_at', fr.created_at,
                    'updated_at', fr.updated_at
                  )
                ) as questions
              FROM tbl_student_faq_responses fr
              LEFT JOIN tbl_courses c ON fr.course_id = c.id
              LEFT JOIN tbl_course_faqs f ON fr.faq_id = f.id
              LEFT JOIN tbl_course_faq_options o ON fr.selected_option_id = o.id
              LEFT JOIN tbl_users creator ON fr.created_by = creator.id
              LEFT JOIN tbl_users updater ON fr.updated_by = updater.id
              WHERE fr.user_id = u.id
                AND (p_course_id IS NULL OR fr.course_id = p_course_id)
                AND (p_faq_id IS NULL OR fr.faq_id = p_faq_id)
                AND (p_search_term IS NULL OR p_search_term = '' OR c.title LIKE CONCAT('%', p_search_term, '%')
                OR creator.full_name LIKE CONCAT('%', p_search_term, '%') OR f.question LIKE CONCAT('%', p_search_term, '%')) 
                AND (p_created_by IS NULL OR p_created_by = '' OR c.created_by_type = p_created_by) 
                AND (p_createdById IS NULL OR c.created_by = p_createdById) 
                AND (
                  p_role = 'admin' 
                  OR (p_role = 'partner' AND c.created_by = p_id AND c.created_by_type = 'partner')
                )
              GROUP BY c.id, c.title
            ) as course_data
          )
        )
      ) as users
  FROM (
    SELECT DISTINCT u.id, u.full_name, u.email
    FROM tbl_student_faq_responses r
    LEFT JOIN tbl_users u ON r.user_id = u.id
    LEFT JOIN tbl_courses c ON r.course_id = c.id
    LEFT JOIN tbl_course_faqs cfaq ON r.faq_id = cfaq.id
    WHERE 
      (p_course_id IS NULL OR r.course_id = p_course_id) AND
      (p_faq_id IS NULL OR r.faq_id = p_faq_id) AND
      (p_user_id IS NULL OR r.user_id = p_user_id) 
      AND (p_search_term IS NULL OR p_search_term = '' OR c.title LIKE CONCAT('%', p_search_term, '%')
      OR u.full_name LIKE CONCAT('%', p_search_term, '%') OR cfaq.question LIKE CONCAT('%', p_search_term, '%')) 
      AND (p_created_by IS NULL OR p_created_by = '' OR c.created_by_type = p_created_by) 
      AND (p_createdById IS NULL OR c.created_by = p_createdById) 
      AND 
      (
        p_role = 'admin' 
        OR (p_role = 'partner' AND c.created_by = p_id AND c.created_by_type = 'partner')
      )
    ORDER BY u.id
    LIMIT v_limit OFFSET v_offset
  ) as u;
END`);

    // Procedure: getResponsesByStudentId ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getResponsesByStudentId(IN p_user_id INT)
    BEGIN
      SELECT 
        r.*,
        c.title as course_title,
        f.question as faq_question,
        o.option_text
      FROM 
        tbl_student_faq_responses r
        LEFT JOIN tbl_courses c ON r.course_id = c.id
        LEFT JOIN tbl_course_faqs f ON r.faq_id = f.id
        LEFT JOIN tbl_course_faq_options o ON r.selected_option_id = o.id
      WHERE 
        r.user_id = p_user_id;
    END
  `);

    // Procedure: getResponsesByCourseId ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getResponsesByCourseId(IN p_course_id INT)
BEGIN
  SELECT 
    r.*,
    u.full_name as user_name, 
    u.email as user_email,
    f.question as faq_question,
    o.option_text
  FROM 
    tbl_student_faq_responses r
    LEFT JOIN tbl_users u ON r.user_id = u.id
    LEFT JOIN tbl_course_faqs f ON r.faq_id = f.id
    LEFT JOIN tbl_course_faq_options o ON r.selected_option_id = o.id
  WHERE 
    r.course_id = p_course_id;
END
`);

    // Procedure: getCourseByCourseHash ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCourseByCourseHash(IN p_course_hash VARCHAR(255))
    BEGIN
      SELECT id FROM tbl_courses WHERE public_hash = p_course_hash;
    END
  `);

    console.log("✅ Student FAQ Response procedures created!");
  } catch (error) {
    console.error("❌ Error setting up student FAQ response procedures:", error);
    throw error;
  }
};

module.exports = setupStudentFAQResponseProcedures;