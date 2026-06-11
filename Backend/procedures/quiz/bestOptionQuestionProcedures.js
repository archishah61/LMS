const sequelize = require("../../config/db");

const setupBestOptionQuestionProcedures = async () => {
  try {
    console.log("🔄 Setting up Best Option Question procedures...");

    // Create Best Option Question   ✅ (Tested)
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS createBestOptionQuestion(
        IN p_quiz_id INT,
        IN p_passage TEXT,
        IN p_blanked_words JSON,
        IN p_distractor_options JSON,
        IN p_marks INT, -- New parameter for marks
        IN p_created_by INT,
        IN p_updated_by INT,
        IN p_created_by_type VARCHAR(20),
        IN p_updated_by_type VARCHAR(20)
      )
      BEGIN
        INSERT INTO tbl_bestoptionquestion (
          quiz_id,
          passage,
          blanked_words,
          distractor_options,
          marks, -- Include marks in the INSERT statement
          created_by,
          updated_by,
          created_at,
          updated_at,
          created_by_type,
          updated_by_type
        ) VALUES (
          p_quiz_id,
          p_passage,
          p_blanked_words,
          p_distractor_options,
          p_marks, -- Insert the marks into the table
          p_created_by,
          p_updated_by,
          NOW(),
          NOW(),
          p_created_by_type,
          p_updated_by_type
        );

        SELECT * FROM tbl_bestoptionquestion WHERE id = LAST_INSERT_ID();
      END;
    `);

    // Get All Best Option Questions   ✅ (Tested)
    await sequelize.query(`
        CREATE PROCEDURE IF NOT EXISTS getAllBestOptionQuestions()
      BEGIN
 SELECT 
        id,
        quiz_id,
        passage,
        blanked_words,
        distractor_options,
        marks, -- Include marks in the SELECT statement
        created_by,
        updated_by,
        created_at,
        updated_at
  FROM tbl_bestoptionquestion;
END
      `);

    // Get BestOptionQuestions by Quiz ID   ✅ (Tested)
    await sequelize.query(`
       CREATE PROCEDURE IF NOT EXISTS getBestOptionQuestionsByQuizId(IN p_quiz_id INT)
BEGIN
    SELECT
        id,
        quiz_id,
        passage,
        blanked_words,
        distractor_options,
        marks, -- Include marks in the SELECT statement
        created_by,
        updated_by,
        created_at,
        updated_at
    FROM tbl_bestoptionquestion
    WHERE quiz_id = p_quiz_id;
END;
      `);

    // Update BestOptionQuestion by ID  ❌ (Error)
    await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS updateBestOptionQuestionById(
    IN p_id INT,
    IN p_passage TEXT,
    IN p_blanked_words JSON,
    IN p_distractor_options JSON,
    IN p_marks INT, -- New parameter for marks
    IN p_updated_by INT,
    IN p_updated_by_type VARCHAR(20)
)
BEGIN
    DECLARE question_exists INT;
    
    -- Check if the question exists
    SELECT COUNT(*)
    INTO question_exists
    FROM tbl_bestoptionquestion  -- Changed table name to match your Sequelize model
    WHERE id = p_id;
    
    IF question_exists = 0 THEN
        -- Return error message if question not found
        SELECT JSON_OBJECT('error', 'Question not found') AS error;
    ELSE
        -- Update the question
        UPDATE tbl_bestoptionquestion  -- Changed table name to match your Sequelize model
        SET 
            passage = p_passage,
            blanked_words = p_blanked_words,
            distractor_options = p_distractor_options,
            marks = p_marks, -- Update marks in the table
            updated_by = p_updated_by,
            updated_by_type = p_updated_by_type,
            updated_at = NOW()
        WHERE id = p_id;
        
        -- Return the updated question
        SELECT 
            id,
            quiz_id,
            passage,
            blanked_words,
            distractor_options,
            marks, -- Include marks in the SELECT statement
            created_by,
            updated_by,
            created_at,
            updated_at
        FROM tbl_bestoptionquestion  -- Changed table name to match your Sequelize model
        WHERE id = p_id;
    END IF;
END;
    `);


    // ✅ Delete BestOptionQuestion by ID      ✅ (Tested)
    await sequelize.query(`
       CREATE PROCEDURE IF NOT EXISTS deleteBestOptionQuestionById(IN p_id INT)
BEGIN
  DECLARE v_exists INT DEFAULT 0;

  -- Check if record exists
  SELECT COUNT(*) INTO v_exists FROM tbl_bestoptionquestion WHERE id = p_id;

  IF v_exists = 0 THEN
    -- Return empty result so Node.js knows nothing was deleted
    SELECT NULL AS id;
  ELSE
    -- Select the record before deleting
    SELECT
      id,
      quiz_id,
      passage,
      blanked_words,
      distractor_options,
      created_by,
      updated_by,
      created_at,
      updated_at
    FROM tbl_bestoptionquestion
    WHERE id = p_id;

    -- Now delete the record
    DELETE FROM tbl_bestoptionquestion WHERE id = p_id;
  END IF;
END 
      `);

    console.log("✅ Best Option Question procedures created!");
  } catch (error) {
    console.error("❌ Error setting up Best Option Question procedures:", error);
    throw error;
  }
};

module.exports = setupBestOptionQuestionProcedures;
