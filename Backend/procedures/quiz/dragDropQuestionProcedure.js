const sequelize = require("../../config/db");

const setupDragDropQuestionProcedures = async () => {
  try {
    console.log("🔄 Setting up Drag Drop Question procedures...");

    // Procedure: Create Drag Drop Question
    await sequelize.query(`DROP PROCEDURE IF EXISTS createDragDropQuestion`);
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS createDragDropQuestion(
        IN p_quiz_id INT,
        IN p_prompt TEXT,
        IN p_options JSON,
        IN p_blanks JSON,
        IN p_marks INT,
        IN p_created_by INT,
        IN p_updated_by INT,
        IN p_created_by_type VARCHAR(20),
        IN p_updated_by_type VARCHAR(20)
      )
      BEGIN
        DECLARE quiz_exists INT DEFAULT 0;
        
        -- Check if quiz exists
        SELECT COUNT(*) INTO quiz_exists FROM tbl_quiz WHERE id = p_quiz_id;
        
        IF quiz_exists = 0 THEN
          -- Return empty result set to indicate quiz not found
          SELECT NULL as id WHERE 1=0;
        ELSE
          -- Insert the question
          INSERT INTO tbl_dragdropquestion (
            quiz_id,
            prompt,
            options,
            blanks,
            marks,
            created_by,
            updated_by,
            created_by_type,
            updated_by_type,
            created_at,
            updated_at
          ) VALUES (
            p_quiz_id,
            p_prompt,
            p_options,
            p_blanks,
            p_marks,
            p_created_by,
            p_updated_by,
            p_created_by_type,
            p_updated_by_type,
            NOW(),
            NOW()
          );
          
          -- Return the newly created question
          SELECT * FROM tbl_dragdropquestion WHERE id = LAST_INSERT_ID();
        END IF;
      END
    `);

    // Procedure: Get All Drag Drop Questions
    await sequelize.query(`DROP PROCEDURE IF EXISTS getAllDragDropQuestions`);
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS getAllDragDropQuestions(
        IN p_quiz_id INT
      )
      BEGIN
        DECLARE quiz_exists INT DEFAULT 0;
        
        IF p_quiz_id IS NOT NULL THEN
          -- Check if quiz exists
          SELECT COUNT(*) INTO quiz_exists FROM tbl_quiz WHERE id = p_quiz_id;
          
          IF quiz_exists = 0 THEN
            -- Return error flag
            SELECT 'Quiz not found' as error;
          ELSE
            -- Return questions for the specified quiz
            SELECT * FROM tbl_dragdropquestion WHERE quiz_id = p_quiz_id;
          END IF;
        ELSE
          -- Return all questions
          SELECT * FROM tbl_dragdropquestion;
        END IF;
      END
    `);

    // // Procedure: Get Drag Drop Questions By Quiz ID
    await sequelize.query(
      `DROP PROCEDURE IF EXISTS getDragDropQuestionsByQuizId`
    );
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS getDragDropQuestionsByQuizId(
        IN p_quiz_id INT
      )
      BEGIN
        DECLARE quiz_exists INT DEFAULT 0;
        
        -- Check if quiz exists
        SELECT COUNT(*) INTO quiz_exists FROM tbl_quiz WHERE id = p_quiz_id;
        
        IF quiz_exists = 0 THEN
          -- Return error flag
          SELECT 'Quiz not found' as error;
        ELSE
          -- Return questions for the specified quiz
          SELECT * FROM tbl_dragdropquestion WHERE quiz_id = p_quiz_id;
        END IF;
      END
    `);

    // // Procedure: Get Drag Drop Question By ID
    await sequelize.query(`DROP PROCEDURE IF EXISTS getDragDropQuestionById`);
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS getDragDropQuestionById(
        IN p_id INT
      )
      BEGIN
        SELECT * FROM tbl_dragdropquestion WHERE id = p_id;
      END
    `);

    // Procedure: Update Drag Drop Question
    await sequelize.query(`DROP PROCEDURE IF EXISTS updateDragDropQuestion`);
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS updateDragDropQuestion(
        IN p_id INT,
        IN p_quiz_id INT,
        IN p_prompt TEXT,
        IN p_options JSON,
        IN p_blanks JSON,
        IN p_marks INT,
        IN p_updated_by INT,
        IN p_updated_by_type VARCHAR(20)
      )
      proc_label: BEGIN
        DECLARE question_exists INT DEFAULT 0;
        DECLARE quiz_exists INT DEFAULT 0;
        
        -- Check if question exists
        SELECT COUNT(*) INTO question_exists FROM tbl_dragdropquestion WHERE id = p_id;
        
        IF question_exists = 0 THEN
          -- Return empty result to indicate question not found
          SELECT NULL as id WHERE 1=0;
        ELSE
          -- Check if quiz exists if quiz_id is provided
          IF p_quiz_id IS NOT NULL THEN
            SELECT COUNT(*) INTO quiz_exists FROM tbl_quiz WHERE id = p_quiz_id;
            
            IF quiz_exists = 0 THEN
              -- Return empty result to indicate quiz not found
              SELECT NULL as id WHERE 1=0;
              LEAVE proc_label; -- Using the defined label
            END IF;
          END IF;
          
          -- Update the question
          UPDATE tbl_dragdropquestion
          SET 
            quiz_id = IFNULL(p_quiz_id, quiz_id),
            prompt = IFNULL(p_prompt, prompt),
            options = IFNULL(p_options, options),
            blanks = IFNULL(p_blanks, blanks),
            marks = IFNULL(p_marks, marks),
            updated_by = p_updated_by,
            updated_by_type = p_updated_by_type,
            updated_at = NOW()
          WHERE id = p_id;
          
          -- Return the updated question
          SELECT * FROM tbl_dragdropquestion WHERE id = p_id;
        END IF;
      END
    `);

    // Procedure: Delete Drag Drop Question
    await sequelize.query(`DROP PROCEDURE IF EXISTS deleteDragDropQuestion`);
    await sequelize.query(`
  CREATE PROCEDURE IF NOT EXISTS deleteDragDropQuestion(
    IN p_id INT
  )
  BEGIN
    DECLARE question_exists INT DEFAULT 0;
    
    -- Check if question exists
    SELECT COUNT(*) INTO question_exists FROM tbl_dragdropquestion WHERE id = p_id;
    
    IF question_exists = 0 THEN
      -- Return error flag
      SELECT 'Question not found' as error;
    ELSE
      -- Delete the question
      DELETE FROM tbl_dragdropquestion WHERE id = p_id;
      
      -- Return success message
      SELECT p_id as deleted_id, 'Question deleted successfully' as message;
    END IF;
  END
`);

    console.log("✅ Drag Drop Question procedures created!");
  } catch (error) {
    console.error("❌ Error setting up Drag Drop Question procedures:", error);
    throw error;
  }
};

module.exports = setupDragDropQuestionProcedures;