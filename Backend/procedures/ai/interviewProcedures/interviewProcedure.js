// utils/procedure/interviewEvaluationProcedures.js

const sequelize = require("../../../config/db");

const setupInterviewEvaluationProcedures = async () => {
  try {
    console.log("🔄 Setting up Interview Evaluation procedures...");

    // Procedure: createCompleteInterviewEvaluation
    await sequelize.query(`DROP PROCEDURE IF EXISTS createCompleteInterviewEvaluation;`);
    await sequelize.query(`
      CREATE PROCEDURE createCompleteInterviewEvaluation(
  IN p_user_id INT,
  IN p_role VARCHAR(255),
  IN p_category VARCHAR(255),
  IN p_overallScore FLOAT,
  IN p_overallAssessment TEXT,
  IN p_fullResponse TEXT,
  IN p_questionEvaluations JSON
)
BEGIN
  DECLARE v_evaluation_id INT;
  DECLARE v_evaluation_result_id INT;
  DECLARE i INT DEFAULT 0;
  DECLARE question_count INT;

  START TRANSACTION;

  -- Create Interview Evaluation
  INSERT INTO tbl_interview_evaluations (
    user_id,
    role,
    category,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_role,
    p_category,
    NOW(),
    NOW()
  );
  SET v_evaluation_id = LAST_INSERT_ID();

  -- Create Interview Evaluation Result
  INSERT INTO tbl_interview_evaluation_results (
    user_id,
    interviewEvaluationId,
    overallScore,
    overallAssessment,
    fullResponse,
    downloaded_dates,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    v_evaluation_id,
    p_overallScore,
    p_overallAssessment,
    p_fullResponse,
    JSON_ARRAY(),
    NOW(),
    NOW()
  );
  SET v_evaluation_result_id = LAST_INSERT_ID();

  -- Initialize question_count
  SET question_count = JSON_LENGTH(p_questionEvaluations);

  -- Create Question Evaluations
  WHILE i < question_count DO
    INSERT INTO tbl_question_evaluations (
      interviewEvaluationResultId,
      question,
      originalAnswer,
      userAnswer,
      score,
      suggestedFeedback,
      created_at,
      updated_at
    ) VALUES (
      v_evaluation_result_id,
      JSON_UNQUOTE(JSON_EXTRACT(p_questionEvaluations, CONCAT('$[', i, '].question'))),
      JSON_UNQUOTE(JSON_EXTRACT(p_questionEvaluations, CONCAT('$[', i, '].originalAnswer'))),
      JSON_UNQUOTE(JSON_EXTRACT(p_questionEvaluations, CONCAT('$[', i, '].userAnswer'))),
      JSON_EXTRACT(p_questionEvaluations, CONCAT('$[', i, '].score')),
      JSON_UNQUOTE(JSON_EXTRACT(p_questionEvaluations, CONCAT('$[', i, '].suggestedFeedback'))),
      NOW(),
      NOW()
    );
    SET i = i + 1;
  END WHILE;

  COMMIT;
  SELECT v_evaluation_result_id AS evaluation_result_id;
END
`);

    // Procedure: getCompleteEvaluationsByUserId
    await sequelize.query(`DROP PROCEDURE IF EXISTS getCompleteEvaluationsByUserId;`);
    await sequelize.query(`
      CREATE PROCEDURE getCompleteEvaluationsByUserId(IN p_user_id INT)
      BEGIN
        -- Fetch Interview Evaluation Results with Question Evaluations and User details
        SELECT
          ie.id, ie.user_id, ie.role, ie.category, ie.created_at,
          u.id AS user_id, u.full_name,
          ier.id AS evaluation_result_id, ier.overallScore, ier.overallAssessment, ier.fullResponse, ier.downloaded_dates,
          qe.id AS question_evaluation_id, qe.question, qe.originalAnswer, qe.userAnswer, qe.score, qe.suggestedFeedback
        FROM tbl_interview_evaluations ie
        LEFT JOIN tbl_users u ON ie.user_id = u.id
        LEFT JOIN tbl_interview_evaluation_results ier ON ie.id = ier.interviewEvaluationId
        LEFT JOIN tbl_question_evaluations qe ON ier.id = qe.interviewEvaluationResultId
        WHERE ie.user_id = p_user_id;
      END
    `);

    // Procedure: getCompleteEvaluationsByUserCategoryAndRole
    await sequelize.query(`DROP PROCEDURE IF EXISTS getCompleteEvaluationsByUserCategoryAndRole;`);
    await sequelize.query(`
      CREATE PROCEDURE getCompleteEvaluationsByUserCategoryAndRole(
        IN p_user_id INT,
        IN p_category VARCHAR(255),
        IN p_role VARCHAR(255)
      )
      BEGIN
        -- Fetch Interview Evaluation Results with Question Evaluations and User details
        SELECT
          ie.id, ie.user_id, ie.role, ie.category, ie.created_at,
          u.id AS user_id, u.full_name,
          ier.id AS evaluation_result_id, ier.overallScore, ier.overallAssessment, ier.fullResponse, ier.downloaded_dates,
          qe.id AS question_evaluation_id, qe.question, qe.originalAnswer, qe.userAnswer, qe.score, qe.suggestedFeedback
        FROM tbl_interview_evaluations ie
        LEFT JOIN tbl_users u ON ie.user_id = u.id
        LEFT JOIN tbl_interview_evaluation_results ier ON ie.id = ier.interviewEvaluationId
        LEFT JOIN tbl_question_evaluations qe ON ier.id = qe.interviewEvaluationResultId
        WHERE ie.user_id = p_user_id AND ie.category = p_category AND ie.role = p_role;
      END
    `);

    // Procedure: logInterviewDownload
    await sequelize.query(`DROP PROCEDURE IF EXISTS logInterviewDownload;`);
    await sequelize.query(`
      CREATE PROCEDURE logInterviewDownload(
        IN p_evaluation_result_id INT,
        IN p_download_date VARCHAR(255)
      )
      BEGIN
        UPDATE tbl_interview_evaluation_results
        SET downloaded_dates = JSON_ARRAY_APPEND(
          IFNULL(downloaded_dates, JSON_ARRAY()),
          '$',
          p_download_date
        ),
        updated_at = NOW()
        WHERE id = p_evaluation_result_id;
      END
    `);

    console.log("✅ Interview Evaluation procedures created!");
  } catch (error) {
    console.error("❌ Error setting up interview evaluation procedures:", error);
    throw error;
  }
};

module.exports = setupInterviewEvaluationProcedures;
