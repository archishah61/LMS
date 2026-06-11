// Stored Procedure Setup for Quiz PreDefined Questions

const sequelize = require("../../config/db");

const setupQuizPreDefinedProcedures = async () => {
    try {
        // AssignPredefinedQuestionToQuiz ✅ (Tested)
        await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS assignPredefinedQuestionToQuiz(
        IN p_assignments JSON
      )
      BEGIN
        DECLARE done INT DEFAULT FALSE;
        DECLARE v_quiz_id INT;
        DECLARE v_pre_defined_question_id INT;
        DECLARE v_created_by INT;
        DECLARE v_updated_by INT;

        -- Cursor for iterating over the input JSON array
        DECLARE cur CURSOR FOR 
          SELECT 
            jt.quiz_id, 
            jt.pre_defined_question_id, 
            jt.created_by, 
            jt.updated_by
          FROM JSON_TABLE(p_assignments, '$[*]' 
            COLUMNS (
              quiz_id INT PATH '$.quiz_id',
              pre_defined_question_id INT PATH '$.pre_defined_question_id',
              created_by INT PATH '$.created_by',
              updated_by INT PATH '$.updated_by'
            )
          ) AS jt;

        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

        -- Start loop
        OPEN cur;

        read_loop: LOOP
          FETCH cur INTO v_quiz_id, v_pre_defined_question_id, v_created_by, v_updated_by;
          IF done THEN
            LEAVE read_loop;
          END IF;

          -- Basic validation before insertion
          IF v_quiz_id IS NULL OR v_pre_defined_question_id IS NULL OR v_created_by IS NULL OR v_updated_by IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|MissingFieldError|All fields are required in each question entry.';
          END IF;

          -- Insert into the mapping table
          INSERT INTO tbl_quiz_predefinedquestions (
            quiz_id, 
            pre_defined_question_id, 
            created_by, 
            updated_by,
            created_at,
            updated_at
          ) VALUES (
            v_quiz_id, 
            v_pre_defined_question_id, 
            v_created_by, 
            v_updated_by,
            NOW(),
            NOW()
          );
        END LOOP;

        CLOSE cur;

        -- Return confirmation
        SELECT 'Predefined questions assigned to quiz successfully' AS message;
      END;
    `);

        // UpdateQuizPredefinedQuestion ✅ (Tested)
        await sequelize.query(`
        CREATE PROCEDURE IF NOT EXISTS updateQuizPredefinedQuestion(
          IN p_id INT,
          IN p_quiz_id INT,
          IN p_pre_defined_question_id INT,
          IN p_updated_by INT
        )
        BEGIN
          -- Validate inputs
          IF p_id IS NULL OR p_quiz_id IS NULL OR p_pre_defined_question_id IS NULL OR p_updated_by IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|MissingFieldError|All fields are required.';
          END IF;
      
          -- Check if the mapping exists
          IF NOT EXISTS (
            SELECT 1 FROM tbl_quiz_predefinedquestions WHERE id = p_id
          ) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Mapping not found.';
          END IF;
      
          -- Perform update
          UPDATE tbl_quiz_predefinedquestions
          SET 
            quiz_id = p_quiz_id,
            pre_defined_question_id = p_pre_defined_question_id,
            updated_by = p_updated_by,
            updated_at = NOW()
          WHERE id = p_id;
      
          -- Return confirmation
          SELECT 'Predefined question mapping updated successfully' AS message;
        END;
      `);

        // DeleteQuizPredefinedQuestion ✅ (Tested)
        await sequelize.query(`
        CREATE PROCEDURE IF NOT EXISTS deleteQuizPredefinedQuestion(
          IN p_id INT
        )
        BEGIN
          -- Validate input
          IF p_id IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|MissingFieldError|ID is required.';
          END IF;
      
          -- Check if the mapping exists
          IF NOT EXISTS (
            SELECT 1 FROM tbl_quiz_predefinedquestions WHERE id = p_id
          ) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Mapping not found.';
          END IF;
      
          -- Delete the mapping
          DELETE FROM tbl_quiz_predefinedquestions WHERE id = p_id;
      
          -- Return confirmation
          SELECT 'Predefined question removed from quiz successfully' AS message;
        END;
      `);

        // List All Quiz Predefined Question Mappings ✅ (Tested)
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS listAllQuizPredefinedMappings()
    BEGIN
      SELECT 
        id,
        quiz_id,
        pre_defined_question_id,
        created_by,
        updated_by,
        created_at,
        updated_at
      FROM tbl_quiz_predefinedquestions;
    END;
     `);


        // Get Quiz Predefined Question Mapping By ID ✅ (Tested)
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS getQuizPredefinedMappingById(
      IN p_id INT
    )
    BEGIN
      SELECT 
        id,
        quiz_id,
        pre_defined_question_id,
        created_by,
        updated_by,
        created_at,
        updated_at
      FROM tbl_quiz_predefinedquestions
      WHERE id = p_id;
  
      -- If nothing is found, optionally you can SIGNAL here
      -- IF NOT FOUND THEN
      --   SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Mapping not found.';
      -- END IF;
    END;
        `);


        // Get Predefined Questions By Quiz ID ✅ (Tested)
        await sequelize.query(`
    -- Get Predefined Questions By Quiz ID
CREATE PROCEDURE IF NOT EXISTS getPredefinedQuestionsByQuizId(
  IN p_quiz_id INT
)
BEGIN
  SELECT 
    qp.id AS mapping_id,
    qp.quiz_id,
    qp.pre_defined_question_id,
    pdq.question_text,
    pdq.question_img,
    pdq.question_type,
    pdq.marks,
    pdo.id AS option_id,
    pdo.option_text,
    pdo.option_img,
    pdo.is_correct
  FROM tbl_quiz_predefinedquestions qp
  JOIN tbl_pre_defined_questions pdq ON qp.pre_defined_question_id = pdq.id
  LEFT JOIN tbl_pre_defined_options pdo ON pdq.id = pdo.pre_defined_question_id
  WHERE qp.quiz_id = p_quiz_id AND pdq.is_active = TRUE;
END;

         `);


        console.log("✅ AssignPredefinedQuestionToQuiz procedure created successfully");
    } catch (error) {
        console.error("❌ Error creating AssignPredefinedQuestionToQuiz procedure:", error);
    }
};

module.exports = setupQuizPreDefinedProcedures;
