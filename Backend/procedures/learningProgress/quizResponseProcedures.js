// utils/procedure/quizResponseProcedures.js

const sequelize = require("../../config/db");

const setupQuizResponseProcedures = async () => {
  try {
    console.log("🔄 Setting up Quiz Response procedures...");

    // Procedure: createQuizResponse ✅ (Creates a single quiz response)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createQuizResponse(
      IN p_quizCompletionId INT,
      IN p_questionId VARCHAR(255),
      IN p_selectedOptionId VARCHAR(255)
    )
    BEGIN
      INSERT INTO tbl_quiz_response (
        quizCompletionId,
        questionId,
        selectedOptionId,
        created_at,
        updated_at
      ) VALUES (
        p_quizCompletionId,
        p_questionId,
        p_selectedOptionId,
        NOW(),
        NOW()
      );
      
      SELECT LAST_INSERT_ID() as id;
    END
  `);

    // Procedure: createBulkQuizResponses ✅ (This is a helper procedure that can be called multiple times in a transaction)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createBulkQuizResponses(
      IN p_quizCompletionId INT,
      IN p_questionId VARCHAR(255),
      IN p_selectedOptionId VARCHAR(255)
    )
    BEGIN
      INSERT INTO tbl_quiz_response (
        quizCompletionId,
        questionId,
        selectedOptionId,
        created_at,
        updated_at
      ) VALUES (
        p_quizCompletionId,
        p_questionId,
        p_selectedOptionId,
        NOW(),
        NOW()
      );
    END
  `);

    console.log("✅ Quiz Response procedures created!");
  } catch (error) {
    console.error("❌ Error setting up quiz response procedures:", error);
    throw error;
  }
};

module.exports = setupQuizResponseProcedures;