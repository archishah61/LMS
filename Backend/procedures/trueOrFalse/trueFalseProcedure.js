const sequelize = require("../../config/db");

const setupTrueFalseProcedures = async () => {
  try {
    console.log("🔄 Setting up True/False Question procedures...");

    // Create a True/False question (✅ Tested)
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS createTrueFalseQuestion(
        IN p_assignment_id INT,
        IN p_question_text TEXT,
        IN p_correct_answer BOOLEAN,
        IN p_created_by INT,
        IN p_updated_by INT,
        IN p_created_by_type ENUM('admin', 'partner'),
        IN p_updated_by_type ENUM('admin', 'partner')
      )
      BEGIN
        -- Inserts a new True/False question into the tbl_true_false_questions table

        INSERT INTO tbl_true_false_questions (
          assignment_id,
          question_text,
          correct_answer,
          created_by,
          updated_by,
          created_by_type,
          updated_by_type,
          created_at,
          updated_at
        ) VALUES (
          p_assignment_id,
          p_question_text,
          p_correct_answer,
          p_created_by,
          p_updated_by,
          p_created_by_type,
          p_updated_by_type,
          NOW(),
          NOW()
        );

        -- Return the newly created question
        SELECT * FROM tbl_true_false_questions
        WHERE id = LAST_INSERT_ID();
      END;
    `);

    // Get True/False Questions by Assignment ID    (✅ Tested)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getTrueFalseQuestionsByAssignmentId(
  IN p_assignment_id INT
)
BEGIN
  SELECT 
    id,
    assignment_id,
    question_text,
    correct_answer,
    created_at,
    updated_at
  FROM tbl_true_false_questions
  WHERE assignment_id = p_assignment_id
  ORDER BY created_at ASC;
END;
  `);

    // Update True/False Questions by ID     (✅ Tested)
    await sequelize.query(`
CREATE PROCEDURE IF NOT EXISTS updateTrueFalseQuestion(
  IN p_id INT,
  IN p_question_text TEXT,
  IN p_correct_answer TINYINT(1),
  IN p_updated_by INT,
  IN p_updated_by_type ENUM('admin', 'partner')
)
BEGIN
  DECLARE err_message VARCHAR(255);

  -- Check if the question exists
  IF NOT EXISTS (SELECT 1 FROM tbl_true_false_questions WHERE id = p_id) THEN
    -- SET err_message = 'QuestionNotFoundError||True/False question not found';
      SET err_message = 'E404|NotFoundError|True/False question not found';
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = err_message;
  END IF;

  -- Update the question
  UPDATE tbl_true_false_questions
  SET question_text = p_question_text,
      correct_answer = p_correct_answer,
      updated_by = p_updated_by,
      updated_by_type = p_updated_by_type,
      updated_at = NOW()
  WHERE id = p_id;

  -- Return the updated question
  SELECT id, assignment_id, question_text, correct_answer,created_by, updated_by,created_by_type, updated_by_type, created_at, updated_at
  FROM tbl_true_false_questions
  WHERE id = p_id;
END;

    `);

    // Delete True/False Questions by ID    (✅ Tested)
    await sequelize.query(`DROP PROCEDURE IF EXISTS deleteTrueFalseQuestion`)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteTrueFalseQuestion(IN p_id INT)
BEGIN
DECLARE err_message VARCHAR(255);

  -- Check if the question exists
  IF NOT EXISTS (SELECT 1 FROM tbl_true_false_questions WHERE id = p_id) THEN
    -- SET err_message = 'QuestionNotFoundError||True/False question not found';
      SET err_message = 'E404|NotFoundError|True/False question not found';
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = err_message;
  END IF;
  -- Delete the question
  DELETE FROM tbl_true_false_questions WHERE id = p_id;
END`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteUnlistedTrueFalseQuestions(
    IN p_assignment_id INT,
    IN p_question_ids TEXT
)
BEGIN
    DECLARE sql_stmt TEXT;
    
    IF p_question_ids IS NULL OR p_question_ids = '' THEN
        -- Delete all questions for this assignment
        DELETE FROM tbl_true_false_questions WHERE assignment_id = p_assignment_id;
    ELSE
        -- Delete questions not in the provided list
        SET sql_stmt = CONCAT(
            'DELETE FROM tbl_true_false_questions WHERE assignment_id = ', p_assignment_id,
            ' AND id NOT IN (', p_question_ids, ')'
        );
        
        SET @sql = sql_stmt;
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteAllTrueFalseQuestions(
    IN p_assignment_id INT
)
BEGIN
    DELETE FROM tbl_true_false_questions WHERE assignment_id = p_assignment_id;
END`)

    console.log("✅ True/False Question procedures created!");
  } catch (error) {
    console.error("❌ Error setting up True/False Question procedures:", error);
    throw error;
  }
};

module.exports = setupTrueFalseProcedures;
