const sequelize = require("../../config/db")

async function setupPreDefinedQuestionProcedures() {
  try {
    // Create question with options
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS createQuestionWithOptions(
        IN p_question_text TEXT,
        IN p_question_img VARCHAR(255),
        IN p_question_type VARCHAR(50),
        IN p_marks INT,
        IN p_created_by INT,
        IN p_options JSON
      )
      BEGIN
        DECLARE question_id INT;
        DECLARE next_sequence INT;
        DECLARE done INT DEFAULT FALSE;
        DECLARE option_text VARCHAR(500);
        DECLARE option_img VARCHAR(255);
        DECLARE is_correct BOOLEAN;
        DECLARE option_index INT DEFAULT 0;
        
        -- Calculate next sequence number
        SELECT IFNULL(MAX(sequence_no), 0) + 1 INTO next_sequence
        FROM tbl_pre_defined_questions;
        
        -- Validate admin exists
        IF NOT EXISTS (SELECT 1 FROM tbl_admin WHERE id = p_created_by) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'E404|NotFoundError|Admin does not exist.';
        END IF;
        
        -- Insert question
        INSERT INTO tbl_pre_defined_questions (
          question_text, question_img, question_type, marks, sequence_no, is_active,
          created_by, updated_by, created_at, updated_at
        ) VALUES (
          p_question_text, p_question_img, p_question_type, p_marks, next_sequence, true,
          p_created_by, p_created_by, NOW(), NOW()
        );
        
        SET question_id = LAST_INSERT_ID();
        
        -- Insert options
        WHILE option_index < JSON_LENGTH(p_options) DO
          SET option_text = JSON_UNQUOTE(JSON_EXTRACT(p_options, CONCAT('$[', option_index, '].option_text')));
          SET option_img = JSON_UNQUOTE(JSON_EXTRACT(p_options, CONCAT('$[', option_index, '].option_img')));
          SET is_correct = JSON_EXTRACT(p_options, CONCAT('$[', option_index, '].is_correct'));
          
          INSERT INTO tbl_pre_defined_options (
            pre_defined_question_id, option_text, option_img, is_correct,
            created_by, updated_by, created_at, updated_at
          ) VALUES (
            question_id, option_text, option_img, is_correct,
            p_created_by, p_created_by, NOW(), NOW()
          );
          
          SET option_index = option_index + 1;
        END WHILE;
        
        -- Return created question with options
        SELECT 
          q.*,
          o.id AS option_id,
          o.option_text,
          o.option_img,
          o.is_correct,
          o.created_at AS option_created_at,
          o.updated_at AS option_updated_at
        FROM tbl_pre_defined_questions q
        LEFT JOIN tbl_pre_defined_options o ON q.id = o.pre_defined_question_id
        WHERE q.id = question_id;
      END;
    `)

    // Get all questions with options
    await sequelize.query(`DROP PROCEDURE IF EXISTS getAllQuestionsWithOptions`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllQuestionsWithOptions(
    IN search_term VARCHAR(255),
    IN page INT,
    IN p_limit INT,
    IN p_questionType VARCHAR(50),
    IN p_status VARCHAR(50),
    IN p_is_all BOOLEAN
)
BEGIN
    DECLARE offset_val INT;
    SET offset_val = (page - 1) * p_limit;

    IF p_is_all = TRUE THEN
      -- Main data with pagination
      SELECT 
        q.*,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', o.id,
            'option_text', o.option_text,
            'option_img', o.option_img,
            'is_correct', o.is_correct,
            'created_at', o.created_at,
            'updated_at', o.updated_at
          )
        ) AS options
      FROM tbl_pre_defined_questions q
      LEFT JOIN tbl_pre_defined_options o ON q.id = o.pre_defined_question_id
      WHERE q.question_text LIKE CONCAT('%', search_term, '%')
        AND (p_status IS NULL OR p_status = '' OR (p_status = 'active' AND q.is_active = TRUE) OR (p_status = 'inactive' AND q.is_active = FALSE))
        AND (p_questionType IS NULL OR p_questionType = '' OR q.question_type = p_questionType)
      GROUP BY q.id
      ORDER BY q.sequence_no;
    ELSE
      -- Main data with pagination
      SELECT 
        q.*,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', o.id,
            'option_text', o.option_text,
            'option_img', o.option_img,
            'is_correct', o.is_correct,
            'created_at', o.created_at,
            'updated_at', o.updated_at
          )
        ) AS options
      FROM tbl_pre_defined_questions q
      LEFT JOIN tbl_pre_defined_options o ON q.id = o.pre_defined_question_id
      WHERE q.question_text LIKE CONCAT('%', search_term, '%')
        AND (p_status IS NULL OR p_status = '' OR (p_status = 'active' AND q.is_active = TRUE) OR (p_status = 'inactive' AND q.is_active = FALSE))
        AND (p_questionType IS NULL OR p_questionType = '' OR q.question_type = p_questionType)
      GROUP BY q.id
      ORDER BY q.sequence_no
      LIMIT offset_val, p_limit;
    END IF;
    
    -- Total count of filtered questions (not paginated)
    SELECT COUNT(*) AS total
    FROM tbl_pre_defined_questions q
    WHERE q.question_text LIKE CONCAT('%', search_term, '%')
      AND (p_status IS NULL OR p_status = '' OR (p_status = 'active' AND q.is_active = TRUE) OR (p_status = 'inactive' AND q.is_active = FALSE))
      AND (p_questionType IS NULL OR p_questionType = '' OR q.question_type = p_questionType);
END`)

    // Get question with options by ID
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS getQuestionWithOptionsById(
        IN p_id INT
      )
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM tbl_pre_defined_questions WHERE id = p_id) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'E404|NotFoundError|Question not found.';
        END IF;
        
        SELECT 
          q.*,
          o.id AS option_id,
          o.option_text,
          o.option_img,
          o.is_correct,
          o.created_at AS option_created_at,
          o.updated_at AS option_updated_at
        FROM tbl_pre_defined_questions q
        LEFT JOIN tbl_pre_defined_options o ON q.id = o.pre_defined_question_id
        WHERE q.id = p_id;
      END;
    `)

    // Update question with options
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS updateQuestionWithOptions(
        IN p_id INT,
        IN p_question_text TEXT,
        IN p_question_type VARCHAR(50),
        IN p_marks INT,
        IN p_question_img VARCHAR(255),
        IN p_updated_by INT,
        IN p_options JSON
      )
      BEGIN
        DECLARE done INT DEFAULT FALSE;
        DECLARE option_id INT;
        DECLARE option_text VARCHAR(500);
        DECLARE option_img VARCHAR(255);
        DECLARE is_correct BOOLEAN;
        DECLARE option_index INT DEFAULT 0;
        
        -- Validate question exists
        IF NOT EXISTS (SELECT 1 FROM tbl_pre_defined_questions WHERE id = p_id) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'E404|NotFoundError|Question not found.';
        END IF;
        
        -- Validate admin exists
        IF NOT EXISTS (SELECT 1 FROM tbl_admin WHERE id = p_updated_by) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'E404|NotFoundError|Admin does not exist.';
        END IF;
        
        -- Update question
        UPDATE tbl_pre_defined_questions
        SET 
          question_text = p_question_text,
          question_type = p_question_type,
          marks = p_marks,
          question_img = IFNULL(p_question_img, question_img),
          updated_by = p_updated_by,
          updated_at = NOW()
        WHERE id = p_id;
        
        -- Delete existing options
        DELETE FROM tbl_pre_defined_options WHERE pre_defined_question_id = p_id;
        
        -- Insert new options
        WHILE option_index < JSON_LENGTH(p_options) DO
          SET option_text = JSON_UNQUOTE(JSON_EXTRACT(p_options, CONCAT('$[', option_index, '].option_text')));
          SET option_img = JSON_UNQUOTE(JSON_EXTRACT(p_options, CONCAT('$[', option_index, '].option_img')));
          SET is_correct = JSON_EXTRACT(p_options, CONCAT('$[', option_index, '].is_correct'));
          
          INSERT INTO tbl_pre_defined_options (
            pre_defined_question_id, option_text, option_img, is_correct,
            created_by, updated_by, created_at, updated_at
          ) VALUES (
            p_id, option_text, option_img, is_correct,
            p_updated_by, p_updated_by, NOW(), NOW()
          );
          
          SET option_index = option_index + 1;
        END WHILE;
        
        -- Return updated question with options
        SELECT 
          q.*,
          o.id AS option_id,
          o.option_text,
          o.option_img,
          o.is_correct,
          o.created_at AS option_created_at,
          o.updated_at AS option_updated_at
        FROM tbl_pre_defined_questions q
        LEFT JOIN tbl_pre_defined_options o ON q.id = o.pre_defined_question_id
        WHERE q.id = p_id;
      END;
    `)

    // Delete question with options
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS deleteQuestionWithOptions(
        IN p_id INT
      )
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM tbl_pre_defined_questions WHERE id = p_id) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'E404|NotFoundError|Question not found.';
        END IF;
        
        -- Return question before deletion
        SELECT * FROM tbl_pre_defined_questions WHERE id = p_id;
        
        -- Delete options first (foreign key constraint)
        DELETE FROM tbl_pre_defined_options WHERE pre_defined_question_id = p_id;
        
        -- Delete question
        DELETE FROM tbl_pre_defined_questions WHERE id = p_id;
      END;
    `)

    // Delete question with options
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS toggleQuestionStatus(
        IN p_id INT
      )
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM tbl_pre_defined_questions WHERE id = p_id) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'E404|NotFoundError|Question not found.';
        END IF;
        
        UPDATE tbl_pre_defined_questions
        SET 
          is_active = IF(is_active = 1, 0, 1)
        WHERE id = p_id;

        -- Return question before deletion
        SELECT * FROM tbl_pre_defined_questions WHERE id = p_id;
      END;
    `)

    // Update question sequence
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS updateQuestionSequence(
        IN p_sequence_json JSON
      )
      BEGIN
        DECLARE done INT DEFAULT FALSE;
        DECLARE v_id INT;
        DECLARE v_sequence_no INT;
        
        DECLARE cur CURSOR FOR 
          SELECT jt.id, jt.sequence_no
          FROM JSON_TABLE(p_sequence_json, '$[*]'
            COLUMNS (
              id INT PATH '$.id',
              sequence_no INT PATH '$.sequence_no'
            )
          ) AS jt;
          
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
        
        OPEN cur;
        
        read_loop: LOOP
          FETCH cur INTO v_id, v_sequence_no;
          IF done THEN
            LEAVE read_loop;
          END IF;
          
          IF EXISTS (SELECT 1 FROM tbl_pre_defined_questions WHERE id = v_id) THEN
            UPDATE tbl_pre_defined_questions
            SET sequence_no = v_sequence_no
            WHERE id = v_id;
          END IF;
        END LOOP;
        
        CLOSE cur;
        
        SELECT 'Sequence updated successfully' AS message;
      END;
    `)

    console.log("✅ Combined procedures created successfully.")
  } catch (error) {
    console.error("❌ Error setting up combined procedures:", error)
  }
}

module.exports = setupPreDefinedQuestionProcedures
