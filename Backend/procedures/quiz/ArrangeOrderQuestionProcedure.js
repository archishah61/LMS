const sequelize = require("../../config/db");

const setupArrangeOrderProcedures = async () => {
  try {
    console.log("🔄 Setting up Arrange Order Question procedures...");

    // ✅ Create ArrangeOrderQuestion
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS createArrangeOrderQuestion (
        IN in_quiz_id INT,
        IN in_sentences JSON,
        IN in_correct_order JSON,
        IN in_marks INT,
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
        -- Insert the arrange order question
        INSERT INTO tbl_arrangeorderquestion (
          quiz_id,
          sentences,
          correct_order,
          marks,
          created_by,
          updated_by,
          created_by_type,
          updated_by_type,
          created_at,
          updated_at
        )
        VALUES (
          in_quiz_id,
          in_sentences,
          in_correct_order,
          in_marks,
          in_created_by,
          in_updated_by,
          p_created_by_type,
          p_updated_by_type,
          NOW(),
          NOW()
        );
        -- Return the inserted row
        SELECT
          'Arrange order question created successfully' AS message,
          id,
          quiz_id,
          sentences,
          correct_order,
          marks,
          created_by,
          updated_by,
          created_at,
          updated_at
        FROM tbl_arrangeorderquestion
        WHERE id = LAST_INSERT_ID();
      END;
    `);

    // ✅ Get all ArrangeOrderQuestions
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS getAllArrangeOrderQuestions()
      BEGIN
        SELECT
          id,
          quiz_id,
          sentences,
          correct_order,
          marks,
          created_by,
          updated_by,
          created_at,
          updated_at
        FROM tbl_arrangeorderquestion;
      END;
    `);

    // ✅ Get ArrangeOrderQuestion by ID
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS getArrangeOrderQuestionById(IN questionId INT)
      BEGIN
        SELECT
          id,
          quiz_id,
          sentences,
          correct_order,
          marks,
          created_by,
          updated_by,
          created_at,
          updated_at
        FROM tbl_arrangeorderquestion
        WHERE id = questionId;
      END;
    `);

    // ✅ Get ArrangeOrderQuestions by Quiz ID
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS getArrangeOrderQuestionsByQuizId(IN quizId INT)
      BEGIN
        SELECT
          id,
          quiz_id,
          sentences,
          correct_order,
          marks,
          created_by,
          updated_by,
          created_at,
          updated_at
        FROM tbl_arrangeorderquestion
        WHERE quiz_id = quizId;
      END;
    `);

    // ✅ Update ArrangeOrderQuestion by ID
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS updateArrangeOrderQuestionById(
        IN in_question_id INT,
        IN in_sentences JSON,
        IN in_correct_order JSON,
        IN in_marks INT,
        IN in_updated_by INT,
        IN in_updated_by_type VARCHAR(20)
      )
      BEGIN
        DECLARE v_question_exists INT;
        -- Check if the question exists
        SELECT COUNT(*) INTO v_question_exists
        FROM tbl_arrangeorderquestion
        WHERE id = in_question_id;
        IF v_question_exists = 0 THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Arrange order question not found';
        END IF;
        -- Update the ArrangeOrderQuestion
        UPDATE tbl_arrangeorderquestion
        SET
          sentences = IFNULL(in_sentences, sentences),
          correct_order = IFNULL(in_correct_order, correct_order),
          marks = IFNULL(in_marks, marks),
          updated_by = IFNULL(in_updated_by, updated_by),
          updated_by_type = IFNULL(in_updated_by_type, updated_by_type),
          updated_at = NOW()
        WHERE id = in_question_id;
        -- Return the updated row
        SELECT
          id,
          sentences,
          correct_order,
          marks,
          created_by,
          updated_by,
          created_at,
          updated_at
        FROM tbl_arrangeorderquestion
        WHERE id = in_question_id;
      END;
    `);

    // ✅ Delete ArrangeOrderQuestion by ID
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS deleteArrangeOrderQuestionById(IN questionId INT)
      BEGIN
        -- Declare variables for the deleted record
        DECLARE deleted_id INT;
        DECLARE deleted_quiz_id INT;
        DECLARE deleted_sentences JSON;
        DECLARE deleted_correct_order JSON;
        DECLARE deleted_marks INT;
        DECLARE deleted_created_by INT;
        DECLARE deleted_updated_by INT;
        DECLARE deleted_created_at DATETIME;
        DECLARE deleted_updated_at DATETIME;
        -- Select the record to be deleted into variables
        SELECT id, quiz_id, sentences, correct_order, marks, created_by, updated_by, created_at, updated_at
        INTO deleted_id, deleted_quiz_id, deleted_sentences, deleted_correct_order, deleted_marks, deleted_created_by, deleted_updated_by, deleted_created_at, deleted_updated_at
        FROM tbl_arrangeorderquestion
        WHERE id = questionId;
        -- Delete the record
        DELETE FROM tbl_arrangeorderquestion
        WHERE id = questionId;
        -- Return the deleted record
        SELECT
          deleted_id AS id,
          deleted_quiz_id AS quiz_id,
          deleted_sentences AS sentences,
          deleted_correct_order AS correct_order,
          deleted_marks AS marks,
          deleted_created_by AS created_by,
          deleted_updated_by AS updated_by,
          deleted_created_at AS created_at,
          deleted_updated_at AS updated_at;
      END
    `);

    console.log("✅ Arrange Order Question procedures created successfully!");
  } catch (error) {
    console.error("❌ Error setting up Arrange Order Question procedures:", error);
    throw error;
  }
};

module.exports = setupArrangeOrderProcedures;
