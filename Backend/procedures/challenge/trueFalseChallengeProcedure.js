// utils/procedure/courseCategoryProcedures.js

const sequelize = require("../../config/db");

const setUpTrueFalseChallengeProcedures = async () => {
    try {
        console.log("🔄 Setting up true false challenge procedures...");

        await sequelize.query(`DROP PROCEDURE IF EXISTS createTrueFalseChallenge;`);
        await sequelize.query(`CREATE PROCEDURE createTrueFalseChallenge (
    IN p_challenge_task_id INT,
    IN p_challenge_id INT,
    IN p_contest_quiz_id INT,
    IN p_question TEXT,
    IN p_answer BOOLEAN
)
BEGIN
    DECLARE challenge_exists INT DEFAULT 0;
    DECLARE task_exists INT DEFAULT 0;
    DECLARE duplicate_count INT DEFAULT 0;

    -- Check if challenge exists (if provided)
    IF p_challenge_id IS NOT NULL THEN
        SELECT COUNT(*) INTO challenge_exists
        FROM tbl_daily_challenges
        WHERE id = p_challenge_id;

        IF challenge_exists = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E404|NotFoundError|Challenge not found';
        END IF;
    END IF;

    -- Check if task exists (if provided)
    IF p_challenge_task_id IS NOT NULL THEN
        SELECT COUNT(*) INTO task_exists
        FROM tbl_challenge_tasks
        WHERE id = p_challenge_task_id;

        IF task_exists = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E404|NotFoundError|Challenge Task not found';
        END IF;
    END IF;

    IF p_contest_quiz_id IS NOT NULL THEN
        SELECT COUNT(*) INTO task_exists
        FROM tbl_contest_quizzes
        WHERE id = p_contest_quiz_id;

        IF task_exists = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E404|NotFoundError|Contest Quiz not found';
        END IF;
    END IF;
    
    -- Check for duplicates in the same challenge or challenge task
    IF p_challenge_id IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_count
        FROM tbl_true_false_challenges
        WHERE challenge_id = p_challenge_id AND question = p_question;
        
        IF duplicate_count > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E409|DuplicateError|A true/false question with this text already exists for this challenge';
        END IF;
    END IF;
    -- If challenge_task_id is provided, check for duplicates in that task
    IF p_challenge_task_id IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_count
        FROM tbl_true_false_challenges
        WHERE challenge_task_id = p_challenge_task_id AND question = p_question;
        
        IF duplicate_count > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E409|DuplicateError|A true/false question with this text already exists for this challenge task';
        END IF;
    END IF;

    IF p_contest_quiz_id IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_count
        FROM tbl_true_false_challenges
        WHERE contest_quiz_id = p_contest_quiz_id AND question = p_question;
        
        IF duplicate_count > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E409|DuplicateError|A true/false question with this text already exists for this Contest Quiz';
        END IF;
    END IF;

    -- Insert the True/False Challenge
    INSERT INTO tbl_true_false_challenges (
        challenge_task_id,
        challenge_id,
        contest_quiz_id,
        question,
        answer,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        p_challenge_task_id,
        p_challenge_id,
        p_contest_quiz_id,
        p_question,
        p_answer,
        TRUE,
        NOW(),
        NOW()
    );

    -- Return success message and created row
    SELECT 'True/False Challenge created successfully.' AS message;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS updateTrueFalseChallenge;`);
        await sequelize.query(`CREATE PROCEDURE updateTrueFalseChallenge (
    IN p_id INT,
    IN p_question TEXT,
    IN p_answer BOOLEAN
)
BEGIN
    DECLARE challenge_id_val INT;
    DECLARE challenge_task_id_val INT;
    DECLARE contest_quiz_id_val INT;
    DECLARE duplicate_count INT DEFAULT 0;
    DECLARE record_exists INT DEFAULT 0;
    
    -- Check if the record exists
    SELECT COUNT(*) INTO record_exists
    FROM tbl_true_false_challenges
    WHERE id = p_id;
    
    IF record_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|True/False challenge not found';
    END IF;
    
    -- Get the challenge_id or challenge_task_id for the question being updated
    SELECT challenge_id, challenge_task_id, contest_quiz_id INTO challenge_id_val, challenge_task_id_val, contest_quiz_id_val
    FROM tbl_true_false_challenges
    WHERE id = p_id;
    
    -- Check for duplicates in the same challenge or challenge task (excluding the current record)
    IF challenge_id_val IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_count
        FROM tbl_true_false_challenges
        WHERE challenge_id = challenge_id_val AND question = p_question AND id != p_id;
    END IF;
    -- If challenge_task_id is provided, check for duplicates in that task
    IF challenge_task_id_val IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_count
        FROM tbl_true_false_challenges
        WHERE challenge_task_id = challenge_task_id_val AND question = p_question AND id != p_id;
    END IF;

    IF contest_quiz_id_val IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_count
        FROM tbl_true_false_challenges
        WHERE contest_quiz_id = contest_quiz_id_val AND question = p_question AND id != p_id;
    END IF;

    IF duplicate_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E409|DuplicateError|A true/false question with this text already exists';
    END IF;
    
    -- Update the True/False Challenge
    UPDATE tbl_true_false_challenges
    SET
        question = IFNULL(p_question, question),
        answer = IFNULL(p_answer, answer),
        updated_at = NOW()
    WHERE id = p_id; 
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS deleteTrueFalseChallenge;`);
        await sequelize.query(`CREATE PROCEDURE deleteTrueFalseChallenge(
    IN tf_id INT
)
BEGIN
    DECLARE v_tf_id INT;

    SELECT id
    INTO v_tf_id
    FROM tbl_true_false_challenges
    WHERE id = tf_id
    LIMIT 1;

    IF v_tf_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|True/False Challenge not found';
    END IF;

    UPDATE tbl_true_false_challenges
    SET is_active = false,
        updated_at = NOW()
    WHERE id = tf_id;

    CALL handleEntityStatus('true_false',tf_id);

    -- Delete the question
    DELETE FROM tbl_true_false_challenges WHERE id = tf_id;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS toggleTrueFalseChallengeStatus;`)
        await sequelize.query(`CREATE PROCEDURE toggleTrueFalseChallengeStatus(
    IN tf_id INT
)
BEGIN
    DECLARE v_tf_id INT;

    SELECT id
    INTO v_tf_id
    FROM tbl_true_false_challenges
    WHERE id = tf_id
    LIMIT 1;

    IF v_tf_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|True/False Challenge not found';
    END IF;

    UPDATE tbl_true_false_challenges
    SET is_active = NOT is_active,
        updated_at = NOW()
    WHERE id = tf_id;

    CALL handleEntityStatus('true_false',tf_id);
END`);

        console.log("✅ true false challenge procedures created!");
    } catch (error) {
        console.error("❌ Error setting true false challenge procedures:", error);
        throw error;
    }
};

module.exports = setUpTrueFalseChallengeProcedures;