// utils/procedure/quizCompletionProcedure.js

const sequelize = require("../../config/db");

const setupQuizCompletionProcedures = async () => {
  try {
    console.log("🔄 Setting up Quiz Completion procedures...");

    // Procedure: getQuizCompletionByUserAndQuiz ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getQuizCompletionByUserAndQuiz(
      IN p_userId INT,
      IN p_quizId INT
    )
    BEGIN
      SELECT *, module_id, topic_id FROM tbl_quiz_completion 
      WHERE userId = p_userId AND quizId = p_quizId;
    END
  `);

    // Procedure: createQuizCompletion ✅
    await sequelize.query(`DROP PROCEDURE IF EXISTS createQuizCompletion`)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createQuizCompletion(
      IN p_userId INT,
      IN p_quizId INT,
      IN p_score INT,
      IN p_isCompleted BOOLEAN,
      IN p_status VARCHAR(255),
      IN p_triedAttempts INT,
      IN p_lastAttemptTime VARCHAR(255),
      IN p_count INT,
      IN p_total_question INT,
      IN p_created_by INT,
      IN p_updated_by INT,
      IN p_module_id INT,
      IN p_topic_id INT,
      IN p_totalMarks INT , 
      IN p_obtainedMarks INT 
    )
    BEGIN
      INSERT INTO tbl_quiz_completion (
        userId,
        quizId,
        score,
        isCompleted,
        status,
        triedAttempts,
        lastAttemptTime,
        count,
        total_question,
        created_by,
        updated_by,
        module_id,
        topic_id,
        totalMarks,
        obtainedMarks,
        created_at,
        updated_at
      ) VALUES (
        p_userId,
        p_quizId,
        p_score,
        p_isCompleted,
        p_status,
        p_triedAttempts,
        IF(p_lastAttemptTime = 'null' OR p_lastAttemptTime IS NULL, NULL, 
           FROM_UNIXTIME(p_lastAttemptTime / 1000)),
        p_count,
        p_total_question,
        p_created_by,
        p_updated_by,
        p_module_id,
        p_topic_id,
        p_totalMarks,
        p_obtainedMarks,
        NOW(),
        NOW()
      );
      
      SELECT LAST_INSERT_ID() as id;
    END
  `);

    // Procedure: getQuizResponsesByStudentId ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getQuizResponsesByStudentId(IN studentId INT)
BEGIN
    SELECT
        qc.id AS quizCompletionId,
        qc.userId,
        qc.quizId,
        qc.score,
        qc.isCompleted,
        qc.status,
        qc.triedAttempts,
        qc.lastAttemptTime,
        qc.count,
        qc.total_question,
        qc.created_by AS quizCompletionCreatedBy,
        qc.updated_by AS quizCompletionUpdatedBy,
        qc.created_at AS quizCompletionCreatedAt,
        qc.updated_at AS quizCompletionUpdatedAt,
        qr.id AS quizResponseId,
        qr.questionId,
        qr.answer,
        qr.created_at AS quizResponseCreatedAt,
        qr.updated_at AS quizResponseUpdatedAt,
        q.id AS quizId,
        q.module_id,
        q.title,
        q.duration_minutes,
        q.passing_score,
        q.max_attempts,
        q.attempts_gap,
        q.status AS quizStatus,
        q.quizType,
        q.created_by AS quizCreatedBy,
        q.created_by_type AS quizCreatedByType,
        q.updated_by AS quizUpdatedBy,
        q.updated_by_type AS quizUpdatedByType,
        q.created_at AS quizCreatedAt,
        q.updated_at AS quizUpdatedAt,
        qpdq.id AS quizPreDefinedQuestionId,
        qpdq.quiz_id AS quizPreDefinedQuestionQuizId,
        qpdq.pre_defined_question_id,
        qpdq.created_by AS quizPreDefinedQuestionCreatedBy,
        qpdq.updated_by AS quizPreDefinedQuestionUpdatedBy,
        qpdq.created_at AS quizPreDefinedQuestionCreatedAt,
        qpdq.updated_at AS quizPreDefinedQuestionUpdatedAt,
        pdq.id AS preDefinedQuestionId,
        pdq.quiz_id AS preDefinedQuestionQuizId,
        pdq.question_text,
        pdq.question_img,
        pdq.question_type,
        pdq.marks,
        pdq.sequence_no,
        pdq.created_by AS preDefinedQuestionCreatedBy,
        pdq.updated_by AS preDefinedQuestionUpdatedBy,
        pdq.created_at AS preDefinedQuestionCreatedAt,
        pdq.updated_at AS preDefinedQuestionUpdatedAt,
        pdo.id AS preDefinedOptionId,
        pdo.pre_defined_question_id AS preDefinedOptionQuestionId,
        pdo.option_text,
        pdo.option_img,
        pdo.is_correct,
        pdo.created_by AS preDefinedOptionCreatedBy,
        pdo.updated_by AS preDefinedOptionUpdatedBy,
        pdo.created_at AS preDefinedOptionCreatedAt,
        pdo.updated_at AS preDefinedOptionUpdatedAt,
        qq.id AS quizQuestionId,
        qq.quiz_id AS quizQuestionQuizId,
        qq.question_text AS quizQuestionText,
        qq.question_img AS quizQuestionImg,
        qq.question_type AS quizQuestionType,
        qq.marks AS quizQuestionMarks,
        qq.sequence_no AS quizQuestionSequenceNo,
        qq.created_by AS quizQuestionCreatedBy,
        qq.created_by_type AS quizQuestionCreatedByType,
        qq.updated_by AS quizQuestionUpdatedBy,
        qq.updated_by_type AS quizQuestionUpdatedByType,
        qq.created_at AS quizQuestionCreatedAt,
        qq.updated_at AS quizQuestionUpdatedAt,
        qo.id AS quizOptionId,
        qo.question_id AS quizOptionQuestionId,
        qo.option_text AS quizOptionText,
        qo.option_img AS quizOptionImg,
        qo.is_correct AS quizOptionIsCorrect,
        qo.created_by AS quizOptionCreatedBy,
        qo.created_by_type AS quizOptionCreatedByType,
        qo.updated_by AS quizOptionUpdatedBy,
        qo.updated_by_type AS quizOptionUpdatedByType,
        qo.created_at AS quizOptionCreatedAt,
        qo.updated_at AS quizOptionUpdatedAt
    FROM tbl_quiz_completion qc
    LEFT JOIN tbl_quiz_response qr ON qc.id = qr.quizCompletionId
    LEFT JOIN tbl_quiz q ON qc.quizId = q.id
    LEFT JOIN tbl_quiz_preDefinedQuestions qpdq ON q.id = qpdq.quiz_id
    LEFT JOIN tbl_pre_defined_questions pdq ON qpdq.pre_defined_question_id = pdq.id
    LEFT JOIN tbl_pre_defined_options pdo ON pdq.id = pdo.pre_defined_question_id
    LEFT JOIN tbl_quizquestions qq ON q.id = qq.quiz_id
    LEFT JOIN tbl_quizoptions qo ON qq.id = qo.question_id
    WHERE qc.userId = studentId;
END
  `);

    // Procedure: getQuizResponseById ✅ (Tested)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getQuizCompletionById(IN p_id INT)
    BEGIN
      SELECT * FROM tbl_quiz_completion WHERE id = p_id;
    END
  `);


    console.log("✅ Quiz Completion procedures created!");
  } catch (error) {
    console.error("❌ Error setting up quiz completion procedures:", error);
    throw error;
  }
};

module.exports = setupQuizCompletionProcedures;