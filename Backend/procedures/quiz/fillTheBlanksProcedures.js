// procedures/fillTheBlanks.procedure.js

const sequelize = require("../../config/db");

const setupFillTheBlanksProcedures = async () => {
  try {
    console.log("🔄 Setting up Fill-in-the-Blank procedures...");

    // ✅ Create Fill-in-the-Blank Question    (✅ Tested)
    await sequelize.query(`
     CREATE PROCEDURE IF NOT EXISTS createFillTheBlanksQuestion (
  IN p_assignment_id INT,
  IN p_question_text TEXT,
  IN p_answers JSON,
  IN p_created_by INT,
  IN p_updated_by INT,
  IN p_created_by_type ENUM('admin', 'partner'),
  IN p_updated_by_type ENUM('admin', 'partner')
)
BEGIN
  INSERT INTO tbl_fill_the_blanks_questions (
    assignment_id,
    question_text,
    answers,
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
    p_answers,
    p_created_by,
    p_updated_by,
    p_created_by_type,
    p_updated_by_type,
    NOW(),
    NOW()
  );

  SELECT * FROM tbl_fill_the_blanks_questions WHERE id = LAST_INSERT_ID();
END;
     `);

    // ✅ Get Fill-in-the-Blank Questions by Assignment ID     (✅ Tested)
    await sequelize.query(`
   -- Get All Fill-in-the-Blank Questions for an Assignment
CREATE PROCEDURE IF NOT EXISTS getFillTheBlanksQuestionsByAssignmentId(
    IN p_assignment_id INT
)
BEGIN
    SELECT 
        *
    FROM tbl_fill_the_blanks_questions
    WHERE assignment_id = p_assignment_id;
END;
     `);

    // ✅ Update Fill-in-the-Blank Question (✅ Tested)
    await sequelize.query(`
     CREATE PROCEDURE IF NOT EXISTS updateFillTheBlanksQuestion(
      IN p_id INT,
      IN p_question_text TEXT,
      IN p_answers JSON,
      IN p_updated_by INT,
      IN p_updated_by_type ENUM('admin', 'partner')
     )
     BEGIN
       -- Update the fill-in-the-blank question text
       UPDATE tbl_fill_the_blanks_questions
       SET question_text = p_question_text,
          answers = p_answers, -- Store the answers as JSON
          updated_by = p_updated_by,
          updated_by_type = p_updated_by_type,
          updated_at = NOW()
       WHERE id = p_id;
     
       -- Get the updated question
       SELECT * FROM tbl_fill_the_blanks_questions WHERE id = p_id;
     END
     `);


    // ✅ Delete Fill-in-the-Blank Question     (✅ Tested)
    await sequelize.query(`DROP PROCEDURE IF EXISTS deleteFillTheBlanksQuestion`)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteFillTheBlanksQuestion(IN p_id INT)
        BEGIN
            -- Check if the question exists
            IF NOT EXISTS (SELECT 1 FROM tbl_fill_the_blanks_questions WHERE id = p_id) THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Fill In The Blank question not found';
            END IF;
            -- Delete the question
            DELETE FROM tbl_fill_the_blanks_questions WHERE id = p_id;
        END;`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteUnlistedFillBlanksQuestions(
    IN p_assignment_id INT,
    IN p_question_ids TEXT
)
BEGIN
    DECLARE sql_stmt TEXT;
    
    IF p_question_ids IS NULL OR p_question_ids = '' THEN
        -- Delete all questions for this assignment
        DELETE FROM tbl_fill_the_blanks_questions WHERE assignment_id = p_assignment_id;
    ELSE
        -- Delete questions not in the provided list
        SET sql_stmt = CONCAT(
            'DELETE FROM tbl_fill_the_blanks_questions WHERE assignment_id = ', p_assignment_id,
            ' AND id NOT IN (', p_question_ids, ')'
        );
        
        SET @sql = sql_stmt;
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteAllFillBlanksQuestions(
    IN p_assignment_id INT
)
BEGIN
    DELETE FROM tbl_fill_the_blanks_questions WHERE assignment_id = p_assignment_id;
END`);

    console.log("✅ Fill-in-the-Blank procedure created successfully!");
  } catch (error) {
    console.error("❌ Error setting up Fill-in-the-Blank procedure:", error);
    throw error;
  }
};

module.exports = setupFillTheBlanksProcedures;
