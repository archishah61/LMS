const sequelize = require("../../config/db");

const setupMatchingProcedures = async () => {
  try {
    console.log("🔄 Setting up Wishlist procedures...");

    // -- Create Matching Question using stored procedure
    await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS createMatchingQuestion(
      IN p_assignment_id INT,
      IN p_question_text TEXT,
      IN p_created_by INT,
      IN p_updated_by INT,
      IN p_created_by_type ENUM('admin', 'partner'),
      IN p_updated_by_type ENUM('admin', 'partner')
    )
    BEGIN
      DECLARE err_message VARCHAR(255);
    
      -- Insert new matching question into tbl_matching_questions
      INSERT INTO tbl_matching_questions (
        assignment_id,
        question_text,
        created_by,
        updated_by,
        created_by_type,
        updated_by_type,
        created_at,
        updated_at
      )
      VALUES (
        p_assignment_id,
        p_question_text,
        p_created_by,
        p_updated_by,
        p_created_by_type,
        p_updated_by_type,
        NOW(),
        NOW()
      );
    
      -- Return the newly created matching question
      SELECT *
      FROM tbl_matching_questions
      WHERE assignment_id = p_assignment_id
      ORDER BY created_at DESC
      LIMIT 1;
    END;
`);

    // -- Create Matching Option using stored procedure
    await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS createMatchingOption(
  IN p_question_id INT,
  IN p_option_text VARCHAR(255),
  IN p_option_type ENUM('text', 'image'),
  IN p_match_text VARCHAR(255),
  IN p_match_type ENUM('text', 'image'),
  IN p_created_by INT,
  IN p_updated_by INT,
  IN p_created_by_type ENUM('admin', 'partner'),
  IN p_updated_by_type ENUM('admin', 'partner')
)
BEGIN
  IF p_question_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|InvalidValueError|Invalid question_id';
  END IF;

  INSERT INTO tbl_matching_options (
    question_id,
    option_text,
    option_type,
    match_text,
    match_type,
    created_by,
    updated_by,
    created_by_type,
    updated_by_type,
    created_at,
    updated_at
  )
  VALUES (
    p_question_id,
    p_option_text,
    p_option_type,
    p_match_text,
    p_match_type,
    p_created_by,
    p_updated_by,
    p_created_by_type,
    p_updated_by_type,
    NOW(),
    NOW()
  );

  SELECT * FROM tbl_matching_options WHERE id = LAST_INSERT_ID();
END;
    `);


    //getMatchingQuestionsByAssignmentId     (✅ Tested)
    await sequelize.query(`
   CREATE PROCEDURE IF NOT EXISTS getMatchingQuestionsByAssignmentId(IN p_assignment_id INT)
BEGIN
  DECLARE err_message VARCHAR(255);

  IF NOT EXISTS (
    SELECT 1 FROM tbl_matching_questions WHERE assignment_id = p_assignment_id
  ) THEN
    SET err_message = 'E404|NotFoundError|No matching questions found for this assignment';
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = err_message;
  END IF;

  -- Select questions with their related options
 SELECT 
  mq.id AS question_id,
  mq.assignment_id,
  mq.question_text,
  mq.created_at AS question_created_at,
  mq.updated_at AS question_updated_at,
  mo.id AS option_id,
  mo.option_text,
  mo.option_type,
  mo.match_text,
  mo.match_type,
  mo.created_at AS option_created_at,
  mo.updated_at AS option_updated_at
FROM tbl_matching_questions mq
LEFT JOIN tbl_matching_options mo ON mq.id = mo.question_id
WHERE mq.assignment_id = p_assignment_id
ORDER BY mq.id, mo.id;
END;
`);

    // -- Update Matching Question using stored procedure
    await sequelize.query(`
  CREATE PROCEDURE IF NOT EXISTS updateMatchingQuestion(
    IN p_id INT,
    IN p_question_text TEXT,
    IN p_updated_by INT,
    IN p_updated_by_type ENUM('admin', 'partner')
  )
  BEGIN
    DECLARE err_message VARCHAR(255);

    -- Validate the ID
    IF NOT EXISTS (
      SELECT 1 FROM tbl_matching_questions WHERE id = p_id
    ) THEN
      SET err_message = 'E404|NotFoundError|No matching question found with this ID';
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = err_message;
    END IF;

    -- Update the question text and timestamp
    UPDATE tbl_matching_questions
    SET 
      question_text = IFNULL(p_question_text, question_text),
      updated_by = p_updated_by,
      updated_by_type = p_updated_by_type,
      updated_at = NOW()
    WHERE id = p_id;

    -- Return the updated question
    SELECT * FROM tbl_matching_questions WHERE id = p_id;
  END;
`);

    // -- Update Matching Option using stored procedure
    await sequelize.query(`
  CREATE PROCEDURE IF NOT EXISTS updateMatchingOption(
    IN p_option_id INT,
    IN p_option_text VARCHAR(255),
    IN p_option_type ENUM('text', 'image'),
    IN p_match_text VARCHAR(255),
    IN p_match_type ENUM('text', 'image'),
    IN p_updated_by INT,
    IN p_updated_by_type ENUM('admin', 'partner')
  )
  BEGIN
    DECLARE err_message VARCHAR(255);

    -- Validate the option ID
    IF NOT EXISTS (
      SELECT 1 FROM tbl_matching_options WHERE id = p_option_id
    ) THEN
      SET err_message = 'E404|NotFoundError|No matching option found with this ID';
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = err_message;
    END IF;

    -- Update the option fields and timestamp
    UPDATE tbl_matching_options
    SET 
      option_text = IFNULL(p_option_text, option_text),
      option_type = IFNULL(p_option_type, option_type),
      match_text = IFNULL(p_match_text, match_text),
      match_type = IFNULL(p_match_type, match_type),
      updated_by = p_updated_by,
      updated_by_type = p_updated_by_type,
      updated_at = NOW()
    WHERE id = p_option_id;

    -- Return the updated option
    SELECT * FROM tbl_matching_options WHERE id = p_option_id;
  END;
`);



    // Delete Matching Question      (✅ Tested)
    await sequelize.query(`
CREATE PROCEDURE IF NOT EXISTS deleteMatchingQuestion(
  IN p_id INT
)
BEGIN
  -- Check if the question exists
  IF NOT EXISTS (
    SELECT 1 FROM tbl_matching_questions WHERE id = p_id
  ) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|Matching question not found';
  END IF;

  -- Delete the matching question
  DELETE FROM tbl_matching_questions WHERE id = p_id;

  -- Optionally return affected rows
  SELECT ROW_COUNT() AS affectedRows;
END 
`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteUnlistedMatchingQuestions(
    IN p_assignment_id INT,
    IN p_question_ids TEXT
)
BEGIN
    DECLARE sql_stmt TEXT;
    
    IF p_question_ids IS NULL OR p_question_ids = '' THEN
        -- Delete all questions for this assignment
        DELETE FROM tbl_matching_questions WHERE assignment_id = p_assignment_id;
    ELSE
        -- Delete questions not in the provided list
        SET sql_stmt = CONCAT(
            'DELETE FROM tbl_matching_questions WHERE assignment_id = ', p_assignment_id,
            ' AND id NOT IN (', p_question_ids, ')'
        );
        
        SET @sql = sql_stmt;
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteAllMatchingQuestions(
    IN p_assignment_id INT
)
BEGIN
    DELETE FROM tbl_matching_questions WHERE assignment_id = p_assignment_id;
END`);

    console.log("✅ Wishlist procedures created!");
  } catch (error) {
    console.error("❌ Error setting up wishlist procedures:", error);
    throw error;
  }
};


module.exports = setupMatchingProcedures;
