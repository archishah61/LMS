// utils/procedure/assignmentResponseProcedure.js

const sequelize = require("../../config/db");

const setupAssignmentResponseProcedures = async () => {
  try {
    console.log("🔄 Setting up Assignment Response procedures...");

    // Procedure: createAssignmentResponse ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createAssignmentResponse(
      IN p_assignmentCompletionId INT,
      IN p_questionId INT,
      IN p_selectedAnswer TEXT,
      IN p_optionIndex INT,
      IN p_created_by INT,
      IN p_updated_by INT
    )
    BEGIN
      INSERT INTO tbl_assignment_response (
        assignmentCompletionId,
        questionId,
        selectedAnswer,
        optionIndex,
        created_by,
        updated_by,
        created_at,
        updated_at
      ) VALUES (
        p_assignmentCompletionId,
        p_questionId,
        p_selectedAnswer,
        p_optionIndex,
        p_created_by,
        p_updated_by,
        NOW(),
        NOW()
      );
    END
  `);

    // Procedure: bulkCreateAssignmentResponses
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS bulkCreateAssignmentResponses(
      IN p_responses JSON
    )
    BEGIN
      DECLARE i INT DEFAULT 0;
      DECLARE response_count INT;
      
      SET response_count = JSON_LENGTH(p_responses);
      
      WHILE i < response_count DO
        INSERT INTO tbl_assignment_response (
          assignmentCompletionId,
          questionId,
          selectedAnswer,
          optionIndex,
          paragraph_meta_data,
          created_by,
          updated_by,
          created_at,
          updated_at
        ) VALUES (
          JSON_EXTRACT(p_responses, CONCAT('$[', i, '].assignmentCompletionId')),
          JSON_EXTRACT(p_responses, CONCAT('$[', i, '].questionId')),
          JSON_UNQUOTE(JSON_EXTRACT(p_responses, CONCAT('$[', i, '].selectedAnswer'))),
          JSON_EXTRACT(p_responses, CONCAT('$[', i, '].optionIndex')),
          JSON_EXTRACT(p_responses, CONCAT('$[', i, '].paragraph_meta_data')),
          JSON_EXTRACT(p_responses, CONCAT('$[', i, '].created_by')),
          JSON_EXTRACT(p_responses, CONCAT('$[', i, '].updated_by')),
          NOW(),
          NOW()
        );
        
        SET i = i + 1;
      END WHILE;
      
      SELECT * FROM tbl_assignment_response 
      WHERE assignmentCompletionId = JSON_EXTRACT(p_responses, '$[0].assignmentCompletionId')
      ORDER BY id DESC
      LIMIT response_count;
    END
  `);

    // Procedure: getAllAssignmentResponses ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllAssignmentResponses()
    BEGIN
      SELECT * FROM tbl_assignment_response;
    END
  `);

    // Procedure: getAssignmentResponsesByCompletionId ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAssignmentResponsesByCompletionId(IN p_completionId INT)
    BEGIN
      SELECT * FROM tbl_assignment_response 
      WHERE assignmentCompletionId = p_completionId;
    END
  `);

    // Procedure: getAssignmentResponseById ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAssignmentResponseById(IN p_id INT)
    BEGIN
      SELECT * FROM tbl_assignment_response WHERE id = p_id;
    END
  `);

    // Procedure: updateAssignmentResponse ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateAssignmentResponse(
      IN p_id INT,
      IN p_selectedAnswer TEXT,
      IN p_optionIndex INT,
      IN p_updated_by INT
    )
    BEGIN
      DECLARE response_exists INT;
      SELECT COUNT(*) INTO response_exists
      FROM tbl_assignment_response
      WHERE id = p_id;

      IF response_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Assignment response not found.';
      ELSE
        UPDATE tbl_assignment_response
        SET selectedAnswer = p_selectedAnswer,
            optionIndex = p_optionIndex,
            updated_by = p_updated_by,
            updated_at = NOW()
        WHERE id = p_id;
        
        SELECT * FROM tbl_assignment_response WHERE id = p_id;
      END IF;
    END
  `);

    // Procedure: deleteAssignmentResponse ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteAssignmentResponse(IN p_id INT)
    BEGIN
      DECLARE response_exists INT;
      DECLARE response_data JSON;
      
      SELECT COUNT(*) INTO response_exists
      FROM tbl_assignment_response
      WHERE id = p_id;

      IF response_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Assignment response not found.';
      ELSE
        SELECT JSON_OBJECT(
          'id', id, 
          'assignmentCompletionId', assignmentCompletionId,
          'questionId', questionId,
          'selectedAnswer', selectedAnswer,
          'optionIndex', optionIndex,
          'created_by', created_by,
          'updated_by', updated_by,
          'created_at', created_at,
          'updated_at', updated_at
        ) INTO response_data
        FROM tbl_assignment_response 
        WHERE id = p_id;
        
        DELETE FROM tbl_assignment_response WHERE id = p_id;
        
        SELECT response_data as deleted_response;
      END IF;
    END
  `);

    console.log("✅ Assignment Response procedures created!");
  } catch (error) {
    console.error("❌ Error setting up assignment response procedures:", error);
    throw error;
  }
};

module.exports = setupAssignmentResponseProcedures;