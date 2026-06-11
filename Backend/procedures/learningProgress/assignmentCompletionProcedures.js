// utils/procedure/assignmentCompletionProcedure.js

const sequelize = require("../../config/db");

const setupAssignmentCompletionProcedures = async () => {
  try {
    console.log("🔄 Setting up Assignment Completion procedures...");    // Procedure: createAssignmentCompletion ✅

    await sequelize.query(`DROP PROCEDURE IF EXISTS createAssignmentCompletion;`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createAssignmentCompletion(
      IN p_userId INT,
      IN p_assignmentId INT,
      IN p_isCompleted BOOLEAN,
      IN p_status ENUM('Completed', 'Incomplete'),
      IN p_score FLOAT,
      IN p_tried_attempts INT,
      IN p_due_date DATETIME,
      IN p_updated_by INT,
      IN p_created_by INT
    )
    BEGIN
      INSERT INTO tbl_assignment_completion (
        userId,
        assignmentId,
        isCompleted,
        status,
        score,
        tried_attempts,
        due_date,
        last_attempt_time,
        updated_by,
        created_by,
        created_at,
        updated_at
      ) VALUES (
        p_userId,
        p_assignmentId,
        p_isCompleted,
        p_status,
        p_score,
        p_tried_attempts,
        p_due_date,
        NOW(),
        p_updated_by,
        p_created_by,
        NOW(),
        NOW()
      );
      
      SELECT LAST_INSERT_ID() as id;
    END
  `);

    // Procedure: getAllAssignmentCompletions ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllAssignmentCompletions()
    BEGIN
      SELECT * FROM tbl_assignment_completion;
    END
  `);

    // Procedure: getAssignmentCompletionByStudentId ✅
    await sequelize.query(`DROP PROCEDURE IF EXISTS getAssignmentCompletionByStudentId;`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAssignmentCompletionByStudentId(IN studentId INT)
BEGIN
    SELECT
        ac.id AS completionId,
        ac.userId,
        ac.assignmentId,        
        ac.isCompleted,
        ac.status,
        ac.score,
        ac.tried_attempts,
        ac.last_attempt_time,
        ac.due_date,
        ac.created_by,
        ac.updated_by,
        ac.created_at,
        ac.updated_at,
        a.id AS assignmentId,
        a.module_id,
        a.title,
        a.description,
        a.file,
        a.max_score,
        a.passing_score,
        a.max_attempt,
        a.status AS assignmentStatus,
        a.category,
        a.created_by AS assignmentCreatedBy,
        a.created_by_type AS assignmentCreatedByType,
        a.updated_by AS assignmentUpdatedBy,
        a.updated_by_type AS assignmentUpdatedByType,
        a.created_at AS assignmentCreatedAt,
        a.updated_at AS assignmentUpdatedAt,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT(
            'id', mq.id,
            'assignment_id', mq.assignment_id,
            'question_text', mq.question_text,
            'options', (SELECT JSON_ARRAYAGG(JSON_OBJECT(
                'id', mo.id,
                'question_id', mo.question_id,
                'option_text', mo.option_text,
                'option_type', mo.option_type,
                'match_text', mo.match_text,
                'match_type', mo.match_type
            )) FROM tbl_matching_options mo WHERE mo.question_id = mq.id)
        )) FROM tbl_matching_questions mq WHERE mq.assignment_id = a.id) AS MatchingQuestions,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT(
            'id', tfq.id,
            'assignment_id', tfq.assignment_id,
            'question_text', tfq.question_text,
            'correct_answer', tfq.correct_answer
        )) FROM tbl_true_false_questions tfq WHERE tfq.assignment_id = a.id) AS TrueFalseQuestions,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT(
            'id', fbq.id,
            'assignment_id', fbq.assignment_id,
            'question_text', fbq.question_text,
            'answers', fbq.answers
        )) FROM tbl_fill_the_blanks_questions fbq WHERE fbq.assignment_id = a.id) AS FillTheBlanksQuestions,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT(
            'id', pw.id,
            'assignment_id', pw.assignment_id,
            'paragraph', pw.paragraph
        )) FROM tbl_paragraph_writing pw WHERE pw.assignment_id = a.id) AS ParagraphWritings,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT(
            'id', ar.id,
            'assignmentCompletionId', ar.assignmentCompletionId,
            'questionId', ar.questionId,
            'selectedAnswer', ar.selectedAnswer,
          'paragraph_meta_data', ar.paragraph_meta_data,
            'optionIndex', ar.optionIndex,
            'updated_by', ar.updated_by,
            'created_by', ar.created_by,
            'created_at', ar.created_at,
            'updated_at', ar.updated_at
        )) FROM tbl_assignment_response ar WHERE ar.assignmentCompletionId = ac.id) AS AssignmentResponses
    FROM tbl_assignment_completion ac
    JOIN tbl_assignments a ON ac.assignmentId = a.id
WHERE ac.userId = studentId
AND ac.id = (
    SELECT MAX(id) 
    FROM tbl_assignment_completion 
    WHERE userId = studentId 
      AND assignmentId = ac.assignmentId
);
END
  `);

    // Procedure: getAssignmentCompletionByAssignmentId (by assignmentId and userId)
    await sequelize.query(`DROP PROCEDURE IF EXISTS getAssignmentCompletionByAssignmentId;`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAssignmentCompletionByAssignmentId(
      IN p_assignmentId INT,
      IN p_userId INT
    )
    BEGIN
      SELECT * FROM tbl_assignment_completion
      WHERE assignmentId = p_assignmentId AND userId = p_userId;
    END`);

    // Procedure: createAssignmentDueDate
    await sequelize.query(`DROP PROCEDURE IF EXISTS createAssignmentDueDate;`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createAssignmentDueDate(
    IN p_user_id INT,
    IN p_assignment_id INT,
    IN p_due_date DATETIME,
    IN p_status ENUM('Completed','Incomplete')
  )
  BEGIN
    DECLARE err_message VARCHAR(255);
    DECLARE existing_completed_count INT DEFAULT 0;
    DECLARE existing_incomplete_or_null_count INT DEFAULT 0;

    -- Check assignment existence
    IF NOT EXISTS (SELECT 1 FROM tbl_assignments WHERE id = p_assignment_id) THEN
      SET err_message = 'E404|NotFoundError|Assignment not found';
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = err_message;
    END IF;

    -- Check user existence
    IF NOT EXISTS (SELECT 1 FROM tbl_users WHERE id = p_user_id) THEN
      SET err_message = 'E404|NotFoundError|User not found';
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = err_message;
    END IF;

    -- Check if user already completed this assignment
    SELECT COUNT(*) INTO existing_completed_count
    FROM tbl_assignment_completion
    WHERE userId = p_user_id 
      AND assignmentId = p_assignment_id
      AND status = 'Completed';

    -- If completed, do nothing
    IF existing_completed_count > 0 THEN
      SELECT 'Assignment already completed by this user' AS message;
    ELSE
      -- Check if there is any incomplete or isCompleted IS NULL entry
      SELECT COUNT(*) INTO existing_incomplete_or_null_count
      FROM tbl_assignment_completion
      WHERE userId = p_user_id 
        AND assignmentId = p_assignment_id
        AND isCompleted IS NULL;

      -- If such entry exists, do nothing
      IF existing_incomplete_or_null_count > 0 THEN
        SELECT 'Assignment due date already exists and not attempted' AS message;
      ELSE
        -- Insert new attempt entry
        INSERT INTO tbl_assignment_completion (
          userId,
          assignmentId,
          due_date,
          status,
          created_by,
          updated_by,
          created_at,
          updated_at
        ) VALUES (
          p_user_id,
          p_assignment_id,
          p_due_date,
          p_status,
          p_user_id,
          p_user_id,
          NOW(),
          NOW()
        );

        -- Return the new record
        SELECT * FROM tbl_assignment_completion WHERE id = LAST_INSERT_ID();
      END IF;
    END IF;
  END
`);

    // Procedure: updateAssignmentCompletion ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateAssignmentCompletion(
      IN p_id INT,
      IN p_userId INT,
      IN p_assignmentId INT,
      IN p_isCompleted BOOLEAN,
      IN p_status ENUM('Completed', 'Incomplete'),
      IN p_score FLOAT,
      IN p_tried_attempts INT,
      IN p_updated_by INT
    )
    BEGIN
      DECLARE completion_exists INT;
      SELECT COUNT(*) INTO completion_exists
      FROM tbl_assignment_completion
      WHERE id = p_id;

      IF completion_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Assignment completion not found.';
      ELSE
        UPDATE tbl_assignment_completion
        SET userId = p_userId,
            assignmentId = p_assignmentId,
            isCompleted = p_isCompleted,
            status = p_status,
            score = p_score,
            tried_attempts = p_tried_attempts,
            last_attempt_time = NOW(),
            updated_by = p_updated_by,
            updated_at = NOW()
        WHERE id = p_id;
        
        -- Return the updated record
        SELECT * FROM tbl_assignment_completion WHERE id = p_id;
      END IF;
    END
  `);

    await sequelize.query(`DROP PROCEDURE IF EXISTS findAssignmentCompletionByUserAndAssignment;`)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS findAssignmentCompletionByUserAndAssignment(
    IN p_userId INT,
    IN p_assignmentId INT
  )
  BEGIN
    -- Return the last created assignment completion entry for this user and assignment
    SELECT *
    FROM tbl_assignment_completion
    WHERE userId = p_userId
      AND assignmentId = p_assignmentId
    ORDER BY created_at DESC, id DESC
    LIMIT 1;
  END
`);

    // Procedure: deleteAssignmentCompletion ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteAssignmentCompletion(
      IN p_id INT
    )
    BEGIN
      DECLARE completion_exists INT;
      SELECT COUNT(*) INTO completion_exists
      FROM tbl_assignment_completion
      WHERE id = p_id;

      IF completion_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Assignment completion not found.';
      ELSE
        -- Get the completion record before deleting
        SELECT * FROM tbl_assignment_completion WHERE id = p_id;
        
        -- Delete the record
        DELETE FROM tbl_assignment_completion WHERE id = p_id;
      END IF;
    END
  `);

    console.log("✅ Assignment Completion procedures created!");
  } catch (error) {
    console.error("❌ Error setting up Assignment Completion procedures:", error);
    throw error;
  }
};

module.exports = setupAssignmentCompletionProcedures;