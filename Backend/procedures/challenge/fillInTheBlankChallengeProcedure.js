// utils/procedure/courseCategoryProcedures.js

const sequelize = require("../../config/db");

const setupFillInTheBlankChallengeProcedures = async () => {
    try {
        console.log("🔄 Setting up fill in the blank challenge procedures...");

        // Procedure: createCourseCategory
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createFillInTheBlanksChallenge (
    IN p_challenge_id INT,
    IN p_challenge_task_id INT,
    IN p_contest_quiz_id INT,
    IN p_text TEXT,
    IN p_answers JSON
)
BEGIN
    DECLARE duplicate_count INT;
    
    -- Check for duplicates in the same challenge or challenge task
    IF p_challenge_id IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_count
        FROM tbl_fillintheblanks_challenges 
        WHERE challenge_id = p_challenge_id AND text = p_text;
    END IF;
    -- If challenge_task_id is provided, check for duplicates in that task
    IF p_challenge_task_id IS NOT NULL THEN
        SET duplicate_count = 0; -- Reset counter if it was set by the previous condition
        SELECT COUNT(*) INTO duplicate_count
        FROM tbl_fillintheblanks_challenges 
        WHERE challenge_task_id = p_challenge_task_id AND text = p_text;
    END IF;

    IF p_contest_quiz_id IS NOT NULL THEN
        SET duplicate_count = 0; -- Reset counter if it was set by the previous condition
        SELECT COUNT(*) INTO duplicate_count
        FROM tbl_fillintheblanks_challenges 
        WHERE contest_quiz_id = p_contest_quiz_id AND text = p_text;
    END IF;
    
    -- If duplicate found, signal SQL state with error message
    IF duplicate_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E409|DuplicateError|A fill-in-the-blank question with this text already exists for this challenge';
    ELSE
        INSERT INTO tbl_fillintheblanks_challenges (
            challenge_id,
            challenge_task_id,
            contest_quiz_id,
            text,
            answers,
            created_at,
            updated_at
        ) VALUES (
            p_challenge_id,
            p_challenge_task_id,
            p_contest_quiz_id,
            p_text,
            p_answers,
            NOW(),
            NOW()
        );
    END IF;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllFillInTheBlanksChallenges()
BEGIN
    SELECT * FROM tbl_fillintheblanks_challenges;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getFillInTheBlanksChallengeById (
    IN p_id INT
)
BEGIN
    SELECT * FROM tbl_fillintheblanks_challenges WHERE id = p_id;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateFillInTheBlanksChallenge (
    IN p_id INT,
    IN p_text TEXT,
    IN p_answers JSON
)
BEGIN
    DECLARE duplicate_count INT;
    DECLARE challenge_id_val INT;
    DECLARE challenge_task_id_val INT;
    DECLARE contest_quiz_id_val INT;
    
    -- Get the challenge_id or challenge_task_id for the question being updated
    SELECT challenge_id, challenge_task_id, contest_quiz_id INTO challenge_id_val, challenge_task_id_val, contest_quiz_id_val
    FROM tbl_fillintheblanks_challenges
    WHERE id = p_id;
    
    -- Check for duplicates in the same challenge or challenge task (excluding the current record)
    IF challenge_id_val IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_count
        FROM tbl_fillintheblanks_challenges 
        WHERE challenge_id = challenge_id_val AND text = p_text AND id != p_id;
    END IF;
    -- If challenge_task_id is provided, check for duplicates in that task
    IF challenge_task_id_val IS NOT NULL THEN
        SET duplicate_count = 0; -- Reset counter if it was set by the previous condition
        SELECT COUNT(*) INTO duplicate_count
        FROM tbl_fillintheblanks_challenges 
        WHERE challenge_task_id = challenge_task_id_val AND text = p_text AND id != p_id;
    END IF;

    IF challenge_task_id_val IS NOT NULL THEN
        SET duplicate_count = 0; -- Reset counter if it was set by the previous condition
        SELECT COUNT(*) INTO duplicate_count
        FROM tbl_fillintheblanks_challenges 
        WHERE contest_quiz_id = contest_quiz_id_val AND text = p_text AND id != p_id;
    END IF;
    
    -- If duplicate found, signal SQL state with error message
    IF duplicate_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'This Fill in the blank apready exist';
    ELSE
        UPDATE tbl_fillintheblanks_challenges
        SET
            text = IFNULL(p_text, text),
            answers = IFNULL(p_answers, answers),
            updated_at = NOW()
        WHERE id = p_id;
    END IF;
END`);

        await sequelize.query('DROP PROCEDURE IF EXISTS toggleFillInTheBlanksStatus')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS toggleFillInTheBlanksStatus (
    IN p_id INT
)
BEGIN

    -- Toggle is_active for the given FillInTheBlanksChallenge
    UPDATE tbl_fillintheblanks_challenges
    SET is_active = NOT is_active,
        updated_at = NOW()
    WHERE id = p_id;

    CALL handleEntityStatus('fill_blank',p_id);
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteFillInTheBlanksChallenge (
    IN p_id INT
)
BEGIN
    -- Toggle is_active for the given FillInTheBlanksChallenge
    UPDATE tbl_fillintheblanks_challenges
    SET is_active = false,
        updated_at = NOW()
    WHERE id = p_id;

    CALL handleEntityStatus('fill_blank',p_id);

    -- Delete the question
    DELETE FROM tbl_fillintheblanks_challenges
    WHERE id = p_id;
END`);

        console.log("✅ fill in the blank challenge procedures created!");
    } catch (error) {
        console.error("❌ Error setting fill in the blank challenge procedures:", error);
        throw error;
    }
};

module.exports = setupFillInTheBlankChallengeProcedures;
