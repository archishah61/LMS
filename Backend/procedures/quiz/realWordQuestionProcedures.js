const sequelize = require("../../config/db");

const setupRealWordQuestionProcedures = async () => {
  try {
    console.log("🔄 Setting up Real Word Question procedures...");

    // Procedure: Create Real Word Question ✅ (Tested)
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS CreateRealWordQuestion(
        IN p_quiz_id INT,
        IN p_words JSON,
        IN p_correct_answers JSON,
        IN p_marks JSON, -- New parameter for marks
        IN p_created_by INT,
        IN p_updated_by INT,
        In p_created_by_type VARCHAR(20),
        In p_updated_by_type VARCHAR(20)
      )
      BEGIN
        INSERT INTO tbl_realwordquestion (
          quiz_id,
          words,
          correct_answers,
          marks, -- Include marks in the INSERT statement
          created_by,
          updated_by,
          created_by_type,
          updated_by_type,
          created_at,
          updated_at
        ) VALUES (
          p_quiz_id,
          p_words,
          p_correct_answers,
          p_marks, -- Insert the marks into the table
          p_created_by,
          p_updated_by,
          p_created_by_type,
          p_updated_by_type,
          NOW(),
          NOW()
        );
      END
    `);

    // Procedure: GetRealWordQuestionByQuizId ✅ (Tested)
    await sequelize.query(`
  -- ✅ Procedure: GetRealWordQuestionByQuizId
CREATE PROCEDURE IF NOT EXISTS GetRealWordQuestionByQuizId(IN p_quiz_id INT)
BEGIN
  SELECT 
    id,
    quiz_id,
    CAST(words AS JSON) AS words,
    CAST(correct_answers AS JSON) AS correct_answers,
    created_by,
    updated_by,
    created_at,
    updated_at
  FROM tbl_realwordquestion
  WHERE quiz_id = p_quiz_id;
END;

  `);

    // Procedure: Delete Word From Real Word Question ✅ (Tested)
    await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS DeleteWordFromRealWordQuestion(
      IN p_id INT,
      IN p_word_index INT,
      IN p_updated_by INT
    )
    BEGIN
      DECLARE wordList JSON;
      DECLARE answerList JSON;
      DECLARE newWordList JSON;
      DECLARE newAnswerList JSON;
  
      -- Fetch current word and answer lists
      SELECT words, correct_answers INTO wordList, answerList
      FROM tbl_realwordquestion
      WHERE id = p_id;
  
      -- Remove items at the specified index
      SET newWordList = JSON_REMOVE(wordList, CONCAT('$[', p_word_index, ']'));
      SET newAnswerList = JSON_REMOVE(answerList, CONCAT('$[', p_word_index, ']'));
  
      -- Update the row
      UPDATE tbl_realwordquestion
      SET words = newWordList,
          correct_answers = newAnswerList,
          updated_by = p_updated_by,
          updated_at = NOW()
      WHERE id = p_id;
    END
  `);

    console.log("✅ Real Word Question procedures created!");
  } catch (error) {
    console.error("❌ Error setting up Real Word Question procedures:", error);
    throw error;
  }
};

module.exports = setupRealWordQuestionProcedures;
