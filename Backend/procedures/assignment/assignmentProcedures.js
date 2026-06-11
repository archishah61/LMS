// utils/procedures/assignmentProcedures.js
const sequelize = require("../../config/db");

const setupAssignmentProcedures = async () => {
  try {
    console.log("🔄 Setting up Assignment procedures...");

    // Assignment Create using stored procedure   (✅ Tested)
    await sequelize.query('DROP PROCEDURE IF EXISTS createAssignment');
    await sequelize.query(`  CREATE PROCEDURE IF NOT EXISTS createAssignment(
    IN p_module_id VARCHAR(255),
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_file VARCHAR(255),
    IN p_days_to_complete INT,
    IN p_max_score INT,
    IN p_passing_score INT,
    IN p_max_attempt INT,
    IN p_extension_limit INT,
    IN p_category VARCHAR(50),
    IN p_created_by INT,
    IN p_updated_by INT,
    IN p_created_by_type ENUM('admin', 'partner'),
    IN p_updated_by_type ENUM('admin', 'partner')
  )
  BEGIN
    DECLARE v_module_id INT;
    DECLARE v_assignment_id INT;
    DECLARE v_status ENUM('active','closed') DEFAULT 'closed';
  
    -- Get module ID
    SELECT id INTO v_module_id FROM tbl_modules WHERE public_hash = p_module_id LIMIT 1;
  
    IF v_module_id IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Module not found';
    END IF;

    IF p_category = 'regular' THEN
      SET v_status = 'active';
    END IF;

    -- Create assignment
    INSERT INTO tbl_assignments (
      module_id, title, description, file, days_to_complete, max_score, passing_score, max_attempt, extension_limit, status,
      created_by, updated_by, category,
      created_by_type, updated_by_type,
      created_at, updated_at
    ) VALUES (
      v_module_id, p_title, p_description, p_file, p_days_to_complete, p_max_score, p_passing_score, COALESCE(p_max_attempt, 1), COALESCE(p_extension_limit, 0), v_status,
      p_created_by, p_updated_by, p_category,
      p_created_by_type, p_updated_by_type,
      NOW(), NOW()
    );
  
    SET v_assignment_id = LAST_INSERT_ID();
  
    -- Return the created assignment
    SELECT * FROM tbl_assignments WHERE id = v_assignment_id;
  END;
  `);


    // Get All Assignments //✅ (Tested)
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS getAssignments()
      BEGIN
      SELECT * FROM tbl_assignments ORDER BY days_to_complete ASC;
      END
      `);

    // Get Assignments by Module id with nested questions //✅ (Tested)
    await sequelize.query(`
  CREATE PROCEDURE IF NOT EXISTS getAssignmentsByModuleId(IN p_module_hash VARCHAR(255))
  BEGIN
    DECLARE v_module_id INT;

    -- Get actual module ID from public hash
    SELECT id INTO v_module_id FROM tbl_modules WHERE public_hash = p_module_hash LIMIT 1;

    IF v_module_id IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Module not found';
    END IF;

    -- Return assignments with nested questions
    SELECT 
      a.id,
      a.module_id,
      a.title,
      a.description,
      a.file,
      a.days_to_complete,
      a.max_score,
      a.passing_score,
      a.max_attempt,
      a.extension_limit,
      a.status,
      a.category,
      a.created_by,
      a.updated_by,
      a.created_by_type,
      a.updated_by_type,
      (
        SELECT t.id
        FROM tbl_topic_content tc
        JOIN tbl_topics t ON t.id = tc.topic_id
        WHERE tc.assignment_id = a.id
        LIMIT 1
      ) AS included_topic_id,
      (
        SELECT t.title
        FROM tbl_topic_content tc
        JOIN tbl_topics t ON t.id = tc.topic_id
        WHERE tc.assignment_id = a.id
        LIMIT 1
      ) AS included_topic_title,
      a.created_at,
      a.updated_at,

      -- True/False Questions
      (
        SELECT JSON_ARRAYAGG(JSON_OBJECT(
          'id', tf.id,
           'question', tf.question_text,
            'answer', tf.correct_answer
        ))
        FROM tbl_true_false_questions tf
        WHERE tf.assignment_id = a.id
      ) AS TrueFalseQuestions,

      -- Matching Questions with Matching Options
(
  SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
      'id', mq.id,
      'question', mq.question_text,  -- Change this line
      'MatchingOptions', (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', mo.id,
            'option', mo.option_text,
            'option_type', mo.option_type,
            'match', mo.match_text,
             'match_type', mo.match_type
          )
        )
        FROM tbl_matching_options mo
        WHERE mo.question_id = mq.id
      )
    )
  )
  FROM tbl_matching_questions mq
  WHERE mq.assignment_id = a.id
) AS MatchingQuestions,



      -- Paragraph Writings
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', pw.id,
            'prompt', pw.paragraph
          )
        )
        FROM tbl_paragraph_writing pw
        WHERE pw.assignment_id = a.id
      ) AS ParagraphWritings,

      -- Fill in the Blanks
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', fb.id,
            'sentence', fb.question_text,
            'answer', fb.answers 
          )
        )
        FROM tbl_fill_the_blanks_questions fb
        WHERE fb.assignment_id = a.id
      ) AS FillTheBlanksQuestions

    FROM tbl_assignments a
    WHERE a.module_id = v_module_id
    ORDER BY a.days_to_complete ASC;

  END
    `);


    await sequelize.query(`
CREATE PROCEDURE IF NOT EXISTS getAssignmentByAssignmentId(
    IN p_assignment_id INT
)
BEGIN
    DECLARE v_assignment_id INT;

    -- Validate assignment exists
    SELECT id INTO v_assignment_id 
    FROM tbl_assignments 
    WHERE id = p_assignment_id 
    LIMIT 1;

    IF v_assignment_id IS NULL THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'E404|NotFoundError|Assignment not found';
    END IF;

    -- Return single assignment with nested questions
    SELECT 
      a.id,
      a.module_id,
      a.title,
      a.description,
      a.file,
      a.days_to_complete,
      a.max_score,
      a.passing_score,
      a.max_attempt,
      a.extension_limit,
      a.status,
      a.category,
      a.created_by,
      a.updated_by,
      a.created_by_type,
      a.updated_by_type,
      (
        SELECT t.id
        FROM tbl_topic_content tc
        JOIN tbl_topics t ON t.id = tc.topic_id
        WHERE tc.assignment_id = a.id
        LIMIT 1
      ) AS included_topic_id,
      (
        SELECT t.title
        FROM tbl_topic_content tc
        JOIN tbl_topics t ON t.id = tc.topic_id
        WHERE tc.assignment_id = a.id
        LIMIT 1
      ) AS included_topic_title,
      a.created_at,
      a.updated_at,

      -- True/False Questions
      (
        SELECT JSON_ARRAYAGG(JSON_OBJECT(
          'id', tf.id,
          'question', tf.question_text,
          'answer', tf.correct_answer
        ))
        FROM tbl_true_false_questions tf
        WHERE tf.assignment_id = a.id
      ) AS TrueFalseQuestions,

      -- Matching Questions with Matching Options
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', mq.id,
            'question', mq.question_text,
            'MatchingOptions', (
              SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                  'id', mo.id,
                  'option', mo.option_text,
                  'option_type', mo.option_type,
                  'match', mo.match_text,
                  'match_type', mo.match_type
                )
              )
              FROM tbl_matching_options mo
              WHERE mo.question_id = mq.id
            )
          )
        )
        FROM tbl_matching_questions mq
        WHERE mq.assignment_id = a.id
      ) AS MatchingQuestions,

      -- Paragraph Writings
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', pw.id,
            'prompt', pw.paragraph
          )
        )
        FROM tbl_paragraph_writing pw
        WHERE pw.assignment_id = a.id
      ) AS ParagraphWritings,

      -- Fill in the Blanks
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', fb.id,
            'sentence', fb.question_text,
            'answer', fb.answers
          )
        )
        FROM tbl_fill_the_blanks_questions fb
        WHERE fb.assignment_id = a.id
      ) AS FillTheBlanksQuestions

    FROM tbl_assignments a
    WHERE a.id = v_assignment_id
    LIMIT 1;

END
    `);

    await sequelize.query('DROP PROCEDURE IF EXISTS getActiveAssignmentsByModuleId');
    await sequelize.query(`
  CREATE PROCEDURE IF NOT EXISTS getActiveAssignmentsByModuleId(
    IN p_module_hash VARCHAR(255),
    IN p_user_id INT
)
BEGIN
    DECLARE v_module_id INT;
    DECLARE v_course_id INT;
    DECLARE v_enrollment_id INT;

    -- Get module ID & course ID
    SELECT id, course_id INTO v_module_id, v_course_id
    FROM tbl_modules
    WHERE public_hash = p_module_hash
    LIMIT 1;

    -- If module not found
    IF v_module_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Module not found';
    END IF;

    -- Get enrollment ID
    SELECT id INTO v_enrollment_id
    FROM tbl_enrollments
    WHERE user_id = p_user_id AND course_id = v_course_id
    LIMIT 1;

    IF v_enrollment_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Enrollment not found for this user';
    END IF;

    -- Return assignments with nested questions
    SELECT 
      a.id,
      a.module_id,
      a.title,
      a.description,
      a.file,
      a.days_to_complete,
      a.max_score,
      a.passing_score,
      a.max_attempt,
      a.extension_limit,
      a.status,
      a.category,
      a.created_by,
      a.updated_by,
      a.created_by_type,
      a.updated_by_type,
      a.created_at,
      a.updated_at,

      -- True/False Questions
      (
        SELECT JSON_ARRAYAGG(JSON_OBJECT(
          'id', tf.id,
          'question', tf.question_text,
          'answer', tf.correct_answer
        ))
        FROM tbl_true_false_questions tf
        WHERE tf.assignment_id = a.id
      ) AS TrueFalseQuestions,

      -- Matching Questions with Matching Options
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', mq.id,
            'question', mq.question_text,
            'MatchingOptions', (
              SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                  'id', mo.id,
                  'option', mo.option_text,
                  'option_type', mo.option_type,
                  'match', mo.match_text,
                  'match_type', mo.match_type
                )
              )
              FROM tbl_matching_options mo
              WHERE mo.question_id = mq.id
            )
          )
        )
        FROM tbl_matching_questions mq
        WHERE mq.assignment_id = a.id
      ) AS MatchingQuestions,

      -- Paragraph Writings
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', pw.id,
            'prompt', pw.paragraph
          )
        )
        FROM tbl_paragraph_writing pw
        WHERE pw.assignment_id = a.id
      ) AS ParagraphWritings,

      -- Fill in the Blanks
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', fb.id,
            'sentence', fb.question_text,
            'answer', fb.answers 
          )
        )
        FROM tbl_fill_the_blanks_questions fb
        WHERE fb.assignment_id = a.id
      ) AS FillTheBlanksQuestions

    FROM tbl_assignments a
    WHERE a.module_id = v_module_id
    AND EXISTS (
    SELECT 1
    FROM tbl_student_accessible_data sad
    WHERE sad.enrollment_id = v_enrollment_id
      AND sad.course_id = v_course_id
      AND JSON_CONTAINS(sad.assignment_ids, JSON_OBJECT('id', a.id))
)
    ORDER BY a.days_to_complete ASC;

END;

    `);

    // Get Assignment by ID //✅ (Tested)
    await sequelize.query(`
        CREATE PROCEDURE IF NOT EXISTS getAssignmentById(IN p_assignment_id INT)
        BEGIN
          -- Return the assignment
          SELECT * FROM tbl_assignments WHERE id = p_assignment_id;
        END
      `);

    // To Active Assignment After DIY Course Generation only
    await sequelize.query(`DROP PROCEDURE IF EXISTS updateAssignmentStatusById`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateAssignmentStatusById(
          IN p_assignment_id INT,
          IN p_status ENUM('active', 'inactive')
      )
      BEGIN
          DECLARE v_exists INT;
          DECLARE v_topic_link_count INT DEFAULT 0;
      
          -- Check if assignment exists and get type
          SELECT id
          INTO v_exists
          FROM tbl_assignments
          WHERE id = p_assignment_id;
      
          IF v_exists = 0 THEN
              SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'E404|NotFoundError|Assignment not found';
          END IF;
      
          -- Validate status input
          IF p_status NOT IN ('active', 'inactive') THEN
              SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'E400|InvalidValueError|Invalid status value. Must be active or inactive.';
          END IF;

            -- Restrict direct status update if assignment is linked with a topic
            SELECT COUNT(*) INTO v_topic_link_count
            FROM tbl_topic_content
            WHERE assignment_id = p_assignment_id;

            IF v_topic_link_count > 0 THEN
              SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'E409|ConflictError|Assignment status cannot be changed directly because it is included in a topic.';
            END IF;
      
          -- Update status
          UPDATE tbl_assignments
          SET status = p_status,
              updated_at = NOW()
          WHERE id = p_assignment_id;
      
          -- Return updated assignment
          SELECT * FROM tbl_assignments WHERE id = p_assignment_id;
      END`);

    // -- Update Assignment by ID    
    await sequelize.query('DROP PROCEDURE IF EXISTS updateAssignment');
    await sequelize.query(`
        CREATE PROCEDURE IF NOT EXISTS updateAssignment(
            IN p_assignment_id INT,
            IN p_title VARCHAR(255),
            IN p_description TEXT,
            IN p_file VARCHAR(255),
            IN p_days_to_complete INT,
            IN p_max_score INT,
            IN p_passing_score INT,
            IN p_max_attempt INT,
            IN p_extension_limit INT,
            IN p_status VARCHAR(50),
            IN p_updated_by INT,
            IN p_updated_by_type ENUM('admin', 'partner'),
            IN p_category VARCHAR(50)
        )
        BEGIN
            DECLARE v_assignment_exists INT;
            DECLARE v_category ENUM('regular', 'matching', 'true_false', 'fill_in_the_blanks', 'paragraph_writing');
            DECLARE v_total_questions INT DEFAULT 0;
          DECLARE v_current_status VARCHAR(20);
          DECLARE v_topic_link_count INT DEFAULT 0;

            -- Check if assignment exists
            SELECT COUNT(*) INTO v_assignment_exists
            FROM tbl_assignments
            WHERE id = p_assignment_id;
      
            IF v_assignment_exists = 0 THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Assignment not found';
            END IF;            
            
            -- 1. Check if assignment exists and get category
            SELECT category
            INTO v_category
            FROM tbl_assignments
            WHERE id = p_assignment_id;

            SELECT status
            INTO v_current_status
            FROM tbl_assignments
            WHERE id = p_assignment_id;

            -- Restrict only direct status changes when assignment is linked with a topic
            IF p_status IS NOT NULL AND p_status <> v_current_status THEN
              SELECT COUNT(*) INTO v_topic_link_count
              FROM tbl_topic_content
              WHERE assignment_id = p_assignment_id;

              IF v_topic_link_count > 0 THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'E409|ConflictError|Assignment status cannot be changed directly because it is included in a topic.';
              END IF;
            END IF;

            -- 2. Validate status input
            IF p_status NOT IN ('active', 'closed') THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'E400|InvalidValueError|Invalid status value. Must be active or closed.';
            END IF;

            -- 3. If activating, check if questions exist for that category
            IF p_status = 'active' THEN
                CASE v_category
                    WHEN 'matching' THEN
                        SELECT COUNT(*) INTO v_total_questions
                        FROM tbl_matching_questions
                        WHERE assignment_id = p_assignment_id;

                    WHEN 'true_false' THEN
                        SELECT COUNT(*) INTO v_total_questions
                        FROM tbl_true_false_questions
                        WHERE assignment_id = p_assignment_id;

                    WHEN 'fill_in_the_blanks' THEN
                        SELECT COUNT(*) INTO v_total_questions
                        FROM tbl_fill_the_blanks_questions
                        WHERE assignment_id = p_assignment_id;

                    WHEN 'paragraph_writing' THEN
                        SELECT COUNT(*) INTO v_total_questions
                        FROM tbl_paragraph_writing
                        WHERE assignment_id = p_assignment_id;

                    ELSE -- regular
                        SET v_total_questions = 1; -- skip check for 'regular'
                END CASE;

                IF v_category <> 'regular' AND v_total_questions = 0 THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'E400|ValidationError|Cannot activate assignment without questions';
                END IF;
            END IF;
            
            -- Update assignment
            UPDATE tbl_assignments
            SET
                title = COALESCE(p_title, title),
                description = COALESCE(p_description, description),
                file = COALESCE(p_file, file),
                days_to_complete = COALESCE(p_days_to_complete, days_to_complete),
                max_score = COALESCE(p_max_score, max_score),
                passing_score = COALESCE(p_passing_score, passing_score),
                max_attempt = COALESCE(p_max_attempt, max_attempt),
                extension_limit = COALESCE(p_extension_limit, extension_limit),
                status = COALESCE(p_status, status),
                updated_by = p_updated_by,
                updated_by_type = p_updated_by_type,
                category = COALESCE(p_category, category),
                updated_at = NOW()
            WHERE id = p_assignment_id;
      
            -- Return the updated assignment
            SELECT *
            FROM tbl_assignments
            WHERE id = p_assignment_id;
        END;
      `);

    await sequelize.query(`
  CREATE PROCEDURE IF NOT EXISTS deleteUnlistedTrueFalseQuestions(
      IN p_assignment_id INT,
      IN p_question_ids VARCHAR(255)
  )
  BEGIN
      DELETE FROM tbl_true_false_questions
      WHERE assignment_id = p_assignment_id
      AND id NOT IN (SELECT * FROM JSON_TABLE(CONCAT('[', p_question_ids, ']'), '$[*]' COLUMNS(id INT PATH '$')) AS jt);
  END;
`);

    // Add procedure to delete unlisted matching options for a specific question
    await sequelize.query(`
  CREATE PROCEDURE IF NOT EXISTS deleteUnlistedMatchingOptions(
      IN p_question_id INT,
      IN p_option_ids VARCHAR(255)
  )
  BEGIN
      DELETE FROM tbl_matching_options
      WHERE question_id = p_question_id
      AND id NOT IN (SELECT * FROM JSON_TABLE(CONCAT('[', p_option_ids, ']'), '$[*]' COLUMNS(id INT PATH '$')) AS jt);
  END;
`);

    // Add procedure to delete all matching options for a specific question
    await sequelize.query(`
  CREATE PROCEDURE IF NOT EXISTS deleteAllMatchingOptions(
      IN p_question_id INT
  )
  BEGIN
      DELETE FROM tbl_matching_options
      WHERE question_id = p_question_id;
  END;
`);

    // Add procedure to delete all matching questions for an assignment (with cascade)
    await sequelize.query(`
  CREATE PROCEDURE IF NOT EXISTS deleteAllMatchingQuestions(
      IN p_assignment_id INT
  )
  BEGIN
      -- First delete all options for all questions
      DELETE mo FROM tbl_matching_options mo
      INNER JOIN tbl_matching_questions mq ON mo.question_id = mq.id
      WHERE mq.assignment_id = p_assignment_id;
      
      -- Then delete all questions
      DELETE FROM tbl_matching_questions
      WHERE assignment_id = p_assignment_id;
  END;
`);

    // Add procedure to delete unlisted matching questions (with cascade)
    await sequelize.query(`
  CREATE PROCEDURE IF NOT EXISTS deleteUnlistedMatchingQuestions(
      IN p_assignment_id INT,
      IN p_question_ids VARCHAR(255)
  )
  BEGIN
      -- First delete options for questions that will be deleted
      DELETE mo FROM tbl_matching_options mo
      INNER JOIN tbl_matching_questions mq ON mo.question_id = mq.id
      WHERE mq.assignment_id = p_assignment_id
      AND mq.id NOT IN (SELECT * FROM JSON_TABLE(CONCAT('[', p_question_ids, ']'), '$[*]' COLUMNS(id INT PATH '$')) AS jt);
      
      -- Then delete the unlisted questions
      DELETE FROM tbl_matching_questions
      WHERE assignment_id = p_assignment_id
      AND id NOT IN (SELECT * FROM JSON_TABLE(CONCAT('[', p_question_ids, ']'), '$[*]' COLUMNS(id INT PATH '$')) AS jt);
  END;
`);

    console.log("✅ Assignment procedures created!");
  } catch (error) {
    console.error("❌ Error setting up assignment procedures:", error);
    throw error;
  }
};

module.exports = setupAssignmentProcedures;