const sequelize = require("../../config/db");

const setupSummarizePassageQuestionProcedures = async () => {
  try {
    console.log("🔄 Setting up Summarize Passage Question procedures...");

    //  Procedure: Create Summarize Passage Question ✅ (Tested)
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS CreateSummarizePassageQuestion(
        IN p_quiz_id INT,
        IN p_summary TEXT,
        IN p_time_limit INT,
        IN p_marks INT, -- New parameter for marks
        IN p_created_by INT,
        IN p_updated_by INT,
        IN p_created_by_type VARCHAR (20),
        IN p_updated_by_type VARCHAR (20)
      )
      BEGIN
        -- Check if related quiz exists
        IF EXISTS (SELECT 1 FROM tbl_quiz WHERE id = p_quiz_id) THEN
          INSERT INTO tbl_summarizepassagequestion (
            quiz_id,
            summary,
            time_limit,
            marks, -- Include marks in the INSERT statement
            created_by,
            updated_by,
            created_at,
            updated_at,
            created_by_type,
            updated_by_type
          ) VALUES (
            p_quiz_id,
            p_summary,
            p_time_limit,
            p_marks, -- Insert the marks into the table
            p_created_by,
            p_updated_by,
            NOW(),
            NOW(),
            p_created_by_type,
            p_updated_by_type
          );
        ELSE
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'E404|NotFoundError|Related quiz not found.';
        END IF;
      END
    `);

    // Procedure: Get All SummarizePassageQuestions  ✅ (Tested)
    await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS GetAllSummarizePassageQuestions()
BEGIN
  SELECT
    spq.*,
    q.title AS quiz_title
  FROM tbl_summarizepassagequestion spq
  JOIN tbl_quiz q ON spq.quiz_id = q.id;
END 
  `);

    //  Procedure: Get SummarizePassageQuestions by Quiz ID ✅ (Tested)
    await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS GetSummarizePassageQuestionsByQuizId(IN p_quiz_id INT)
    BEGIN
      SELECT 
        id,
        quiz_id,
        summary,
        time_limit,
        marks,
        created_by,
        updated_by,
        created_at,
        updated_at
      FROM tbl_summarizepassagequestion
      WHERE quiz_id = p_quiz_id;
    END
  `);


    // ✅ Procedure: Update SummarizePassageQuestion by ID ✅ (Tested)
    await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS UpdateSummarizePassageQuestionById(
      IN p_id INT,
      IN p_quiz_id INT,
      IN p_summary TEXT,
      IN p_time_limit INT,
       IN p_marks INT, -- New parameter for mark
      IN p_updated_by INT,
      IN p_updated_by_type VARCHAR(255)
    )
    BEGIN
      UPDATE tbl_summarizepassagequestion
      SET 
        quiz_id = IFNULL(p_quiz_id, quiz_id),
        summary = IFNULL(p_summary, summary),
        time_limit = IFNULL(p_time_limit, time_limit),
        marks = IFNULL(p_marks, marks), -- Update marks in the table
        updated_by = IFNULL(p_updated_by, updated_by),
        updated_by_type = IFNULL(p_updated_by_type, updated_by_type),
        updated_at = NOW()
      WHERE id = p_id;
  
      SELECT * FROM tbl_summarizepassagequestion WHERE id = p_id;
    END
  `);


    // ✅ Procedure: Delete SummarizePassageQuestion by ID ✅ (Tested)
    await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS DeleteSummarizePassageQuestionById(
      IN p_id INT
    )
    BEGIN
      DECLARE questionExists INT;
  
      -- Check if question exists
      SELECT COUNT(*) INTO questionExists
      FROM tbl_summarizepassagequestion
      WHERE id = p_id;
  
      IF questionExists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Summarize-passage question not found';
      ELSE
        -- Return deleted row before deletion
        SELECT * FROM tbl_summarizepassagequestion WHERE id = p_id;
  
        -- Delete the row
        DELETE FROM tbl_summarizepassagequestion WHERE id = p_id;
      END IF;
    END
  `);


    console.log("✅ Summarize Passage Question procedures created!");
  } catch (error) {
    console.error("❌ Error setting up Summarize Passage Question procedures:", error);
    throw error;
  }
};

module.exports = setupSummarizePassageQuestionProcedures;
