const sequelize = require("../../config/db");

const setupAudioToScriptProcedures = async () => {
  try {
    console.log("🔄 Setting up Audio-to-Script procedures...");

    // ✅ Create AudioToScriptQuestion ✅ (Tested)
    await sequelize.query(`
              -- ✅ Create AudioToScriptQuestion
           CREATE PROCEDURE IF NOT EXISTS createAudioToScriptQuestion (
    IN in_quiz_id INT,
    IN in_url VARCHAR(255),
    IN in_script TEXT,
    IN in_marks INT, -- Add the marks parameter
    IN in_created_by INT,
    IN in_updated_by INT,
    IN p_created_by_type VARCHAR(50),
    IN p_updated_by_type VARCHAR(50)
)
BEGIN
    DECLARE v_quiz_exists INT;

    -- Check if quiz exists
    SELECT COUNT(*) INTO v_quiz_exists FROM tbl_quiz WHERE id = in_quiz_id;

    IF v_quiz_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Related quiz not found.';
    END IF;

    -- Insert the audio-to-script question with the marks field
    INSERT INTO tbl_audiotoscriptquestion (
        quiz_id,
        url,
        script,
        marks, -- Include marks in the INSERT statement
        created_by,
        updated_by,
        created_by_type,
        updated_by_type,
        created_at,
        updated_at
    )
    VALUES (
        in_quiz_id,
        in_url,
        in_script,
        in_marks, -- Insert the marks value
        in_created_by,
        in_updated_by,
        p_created_by_type,
        p_updated_by_type,
        NOW(),
        NOW()
    );

    -- Return the inserted row
    SELECT
        'Audio-to-script question created successfully' AS message,
        id,
        quiz_id,
        url,
        script,
        marks, -- Include marks in the SELECT statement
        created_by,
        updated_by,
        created_at,
        updated_at
    FROM tbl_audiotoscriptquestion
    WHERE id = LAST_INSERT_ID();
END;


      `);

    // ✅ Get all AudioToScriptQuestion ✅ (Tested)
    await sequelize.query(`
-- ✅ Get all AudioToScriptQuestion
CREATE PROCEDURE IF NOT EXISTS getAllAudioToScriptQuestions()
BEGIN
  SELECT
    id,
    quiz_id,
    url,
    script,
    created_by,
    updated_by,
    created_at,
    updated_at
  FROM tbl_audiotoscriptquestion;
END;


      `);

    // ✅ Get AudioToScriptQuestion by Quiz ID ✅ (Tested)
    await sequelize.query(`
    -- ✅ Get AudioToScriptQuestion by Quiz ID
CREATE PROCEDURE IF NOT EXISTS getAudioToScriptQuestionsByQuizId(IN quizId INT)
BEGIN
  SELECT
    id,
    quiz_id,
    url,
    script,
     marks,
    created_by,
    updated_by,
    created_at,
    updated_at
  FROM tbl_audiotoscriptquestion
  WHERE quiz_id = quizId;
END;

  `);


    // ✅ Update AudioToScriptQuestion by ID ✅ (Tested)
    await sequelize.query(`
-- ✅ Update AudioToScriptQuestion by ID
CREATE PROCEDURE IF NOT EXISTS updateAudioToScriptQuestionById(
    IN in_question_id INT,
    IN in_quiz_id INT,
    IN in_url VARCHAR(255),
    IN in_script TEXT,
    IN in_marks INT, -- Add the marks parameter
    IN in_updated_by INT,
    IN in_updated_by_type VARCHAR(20)
)
BEGIN
    DECLARE v_question_exists INT;

    -- Check if the question exists
    SELECT COUNT(*) INTO v_question_exists
    FROM tbl_audiotoscriptquestion
    WHERE id = in_question_id;

    IF v_question_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Audio-to-script question not found';
    END IF;

    -- Update the AudioToScriptQuestion with the marks field
    UPDATE tbl_audiotoscriptquestion
    SET
        quiz_id = IFNULL(in_quiz_id, quiz_id),
        url = IFNULL(in_url, url),
        script = IFNULL(in_script, script),
        marks = IFNULL(in_marks, marks), -- Include marks in the UPDATE statement
        updated_by = IFNULL(in_updated_by, updated_by),
        updated_by_type = IFNULL(in_updated_by_type, updated_by_type),
        updated_at = NOW()
    WHERE id = in_question_id;

    -- Return the updated row
    SELECT
        id,
        quiz_id,
        url,
        script,
        marks, -- Include marks in the SELECT statement
        created_by,
        updated_by,
        created_at,
        updated_at
    FROM tbl_audiotoscriptquestion
    WHERE id = in_question_id;
END;
  `);


    // ✅ Delete AudioToScriptQuestion by ID  ✅ (Tested)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteAudioToScriptQuestionById(
  IN questionId INT
)
BEGIN
  -- Declare a variable to store the deleted record
  DECLARE deleted_id INT;
  DECLARE deleted_quiz_id INT;
  DECLARE deleted_script TEXT;
  DECLARE deleted_url VARCHAR(255);
  DECLARE deleted_created_by INT;
  DECLARE deleted_updated_by INT;
  DECLARE deleted_created_at DATETIME;
  DECLARE deleted_updated_at DATETIME;

  -- Select the record to be deleted into variables
  SELECT id, quiz_id, script, url, created_by, updated_by, created_at, updated_at
  INTO deleted_id, deleted_quiz_id, deleted_script, deleted_url, deleted_created_by, deleted_updated_by, deleted_created_at, deleted_updated_at
  FROM tbl_audiotoscriptquestion
  WHERE id = questionId;

  -- Delete the record
  DELETE FROM tbl_audiotoscriptquestion
  WHERE id = questionId;

  -- Return the deleted record
  SELECT
    deleted_id AS id,
    deleted_quiz_id AS quiz_id,
    deleted_script AS script,
    deleted_url AS url,
    deleted_created_by AS created_by,
    deleted_updated_by AS updated_by,
    deleted_created_at AS created_at,
    deleted_updated_at AS updated_at;
END 
  `);


    console.log("✅ Audio-to-Script procedures created successfully!");
  } catch (error) {
    console.error("❌ Error setting up Audio-to-Script procedures:", error);
    throw error;
  }
};

module.exports = setupAudioToScriptProcedures;
