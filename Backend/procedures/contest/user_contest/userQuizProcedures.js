const sequelize = require("../../../config/db");

const setupUserQuizProcedures = async () => {
    try {
        console.log("🔄 Setting up user contest quiz procedures...");

        await sequelize.query(`DROP PROCEDURE IF EXISTS GetUserContestQuizAttempts`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetUserContestQuizAttempts (
    IN p_user_id INT,
    IN p_quiz_id INT
)
BEGIN
    SELECT 
        ucq.id,
        ucq.user_id,
        ucq.contest_id,
        ucq.quiz_id,
        ucq.attempt_number,
        ucq.score,
        ucq.percentage,
        ucq.time_taken_seconds,
        ucq.status,
        ucq.submitted_at,
        ucq.meta,
        ucq.created_at,
        ucq.updated_at,
        cq.title AS quiz_title,
        cq.show_answer
    FROM tbl_user_contest_quizzes ucq
    JOIN tbl_contest_quizzes cq ON cq.id = ucq.quiz_id
    WHERE ucq.user_id = p_user_id
      AND ucq.quiz_id = p_quiz_id
    ORDER BY ucq.attempt_number ASC;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS SaveUserContestQuizAttempt`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS SaveUserContestQuizAttempt (
    IN p_user_id INT,
    IN p_contest_id INT,
    IN p_quiz_id INT,
    IN p_score FLOAT,
    IN p_percentage FLOAT,
    IN p_time_taken_seconds INT,
    IN p_status ENUM('pending', 'completed', 'failed', 'skipped'),
    IN p_meta JSON
)
BEGIN
    DECLARE v_attempt_number INT DEFAULT 1;

    -- Find last attempt number
    SELECT IFNULL(MAX(attempt_number), 0) + 1 INTO v_attempt_number
    FROM tbl_user_contest_quizzes
    WHERE user_id = p_user_id
      AND contest_id = p_contest_id
      AND quiz_id = p_quiz_id;

    -- Insert attempt into tbl_user_contest_quizzes
    INSERT INTO tbl_user_contest_quizzes (
        user_id,
        contest_id,
        quiz_id,
        attempt_number,
        score,
        percentage,
        time_taken_seconds,
        status,
        submitted_at,
        meta,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_contest_id,
        p_quiz_id,
        v_attempt_number,
        p_score,
        p_percentage,
        p_time_taken_seconds,
        p_status,
        NOW(),
        p_meta,
        NOW(),
        NOW()
    );

    -- Return newly created row
    SELECT * 
    FROM tbl_user_contest_quizzes 
    WHERE id = LAST_INSERT_ID();
END`);

        console.log("✅ User contest quiz procedures created!");
    } catch (error) {
        console.error("❌ Error setting user contest quiz procedures:", error);
        throw error;
    }
};

module.exports = setupUserQuizProcedures;
