// utils/procedure/courseCategoryProcedures.js

const sequelize = require("../../config/db");

const setupMcqChallengeProcedures = async () => {
    try {
        console.log("🔄 Setting up mcq challenge procedures...");

        // Procedure: createCourseCategory
        await sequelize.query(`DROP PROCEDURE IF EXISTS createMCQChallenge;`);
        await sequelize.query(`CREATE PROCEDURE createMCQChallenge (
    IN p_challenge_id INT,
    IN p_challenge_task_id INT,
    IN p_contest_quiz_id INT,
    IN p_question_text TEXT,
    IN p_options JSON
)
BEGIN
    DECLARE new_id INT;
    DECLARE i INT DEFAULT 0;
    DECLARE total INT;
    DECLARE opt_text TEXT;
    DECLARE opt_type VARCHAR(10);
    DECLARE is_corr BOOLEAN;
    DECLARE existing_count INT;
    
    -- Declare handlers for exceptions
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        -- If there's an error, rollback the transaction
        ROLLBACK;
        RESIGNAL;
    END;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Check for duplicates based on challenge_id or challenge_task_id and question_text
    IF p_challenge_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM tbl_mcq_challenge 
        WHERE challenge_id = p_challenge_id AND question_text = p_question_text
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'A question with this text already exists for this challenge';
    END IF;
    
    IF p_challenge_task_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM tbl_mcq_challenge 
        WHERE challenge_task_id = p_challenge_task_id AND question_text = p_question_text
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'A question with this text already exists for this task';
    END IF;

    IF p_contest_quiz_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM tbl_mcq_challenge 
        WHERE contest_quiz_id = p_contest_quiz_id AND question_text = p_question_text
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'A question with this text already exists for this quiz';
    END IF;
    
    -- Get total options in JSON array
    SET total = JSON_LENGTH(p_options);
    
    -- Check that we have at least 2 options
    IF total < 2 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'At least 2 options are required for an MCQ challenge';
    END IF;
    
    -- Check for duplicate options within the provided JSON
    DROP TEMPORARY TABLE IF EXISTS temp_option_texts;
    CREATE TEMPORARY TABLE temp_option_texts (
        option_text VARCHAR(255),
        option_type VARCHAR(50)
    );
    
    -- Insert all option texts into temp table
    SET i = 0;
    WHILE i < total DO
        SET opt_text = JSON_UNQUOTE(JSON_EXTRACT(p_options, CONCAT('$[', i, '].option_text')));
        SET opt_type = JSON_UNQUOTE(JSON_EXTRACT(p_options, CONCAT('$[', i, '].option_type')));
        
        INSERT INTO temp_option_texts VALUES (opt_text, opt_type);
        SET i = i + 1;
    END WHILE;
    
    -- Check for duplicates in the input options
    SELECT COUNT(*) INTO existing_count FROM (
        SELECT option_text, option_type, COUNT(*) as cnt
        FROM temp_option_texts
        GROUP BY option_text, option_type
        HAVING cnt > 1
    ) AS dup;
    
    IF existing_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Duplicate options detected in the input';
    END IF;
    
    -- Check if at least one option is marked as correct
    SET i = 0;
    SET existing_count = 0;
    WHILE i < total DO
        IF CAST(JSON_UNQUOTE(JSON_EXTRACT(p_options, CONCAT('$[', i, '].is_correct'))) AS UNSIGNED) = 1 THEN
            SET existing_count = existing_count + 1;
        END IF;
        SET i = i + 1;
    END WHILE;
    
    IF existing_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'At least one option must be marked as correct';
    END IF;

    -- Insert MCQ challenge
    INSERT INTO tbl_mcq_challenge (challenge_id, challenge_task_id, contest_quiz_id, question_text, created_at, updated_at)
    VALUES (p_challenge_id, p_challenge_task_id, p_contest_quiz_id, p_question_text, NOW(), NOW());

    SET new_id = LAST_INSERT_ID();
    
    -- Insert all options
    SET i = 0;
    WHILE i < total DO
        SET opt_text = JSON_UNQUOTE(JSON_EXTRACT(p_options, CONCAT('$[', i, '].option_text')));
        SET opt_type = JSON_UNQUOTE(JSON_EXTRACT(p_options, CONCAT('$[', i, '].option_type')));
        SET is_corr = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_options, CONCAT('$[', i, '].is_correct'))) AS UNSIGNED);
        
        INSERT INTO tbl_mcq_option_challenge (
            mcq_id, 
            option_text, 
            option_type, 
            is_correct,
            created_at,
            updated_at
        ) VALUES (
            new_id,
            opt_text,
            opt_type,
            is_corr,
            NOW(),
            NOW()
        );
        
        SET i = i + 1;
    END WHILE;
    
    -- Clean up and commit
    DROP TEMPORARY TABLE IF EXISTS temp_option_texts;
    COMMIT;

    -- Return the inserted ID
    SELECT new_id AS inserted_id;
END`);
        await sequelize.query(`DROP PROCEDURE IF EXISTS updateMCQChallenge;`);
        await sequelize.query(`CREATE PROCEDURE updateMCQChallenge(
    IN p_mcq_id INT,
    IN p_question_text TEXT,
    IN p_options JSON
)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE total INT;
    DECLARE opt_id INT;
    DECLARE opt_text TEXT;
    DECLARE opt_type VARCHAR(10); -- Changed from ENUM to VARCHAR
    DECLARE is_corr BOOLEAN;
    DECLARE existing_count INT;
    DECLARE challenge_id_val INT;
    DECLARE challenge_task_id_val INT;
    DECLARE contest_quiz_id_val INT;
    DECLARE options_count_in_db INT;
    DECLARE option_exists_in_db INT DEFAULT 0;
    
    -- Declare handlers for exceptions
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Get challenge_id and challenge_task_id for this MCQ
    SELECT challenge_id, challenge_task_id, contest_quiz_id INTO challenge_id_val, challenge_task_id_val, contest_quiz_id_val
    FROM tbl_mcq_challenge WHERE id = p_mcq_id;
    
    -- Check for duplicates when updating question_text
    IF challenge_id_val IS NOT NULL AND EXISTS (
        SELECT 1 FROM tbl_mcq_challenge 
        WHERE challenge_id = challenge_id_val 
        AND question_text = p_question_text
        AND id != p_mcq_id
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'A question with this text already exists for this challenge';
    END IF;
    
    IF challenge_task_id_val IS NOT NULL AND EXISTS (
        SELECT 1 FROM tbl_mcq_challenge 
        WHERE challenge_task_id = challenge_task_id_val 
        AND question_text = p_question_text
        AND id != p_mcq_id
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'A question with this text already exists for this task';
    END IF;

    IF contest_quiz_id_val IS NOT NULL AND EXISTS (
        SELECT 1 FROM tbl_mcq_challenge 
        WHERE contest_quiz_id = contest_quiz_id_val 
        AND question_text = p_question_text
        AND id != p_mcq_id
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'A question with this text already exists for this quiz';
    END IF;

    -- Update question_text
    UPDATE tbl_mcq_challenge
    SET question_text = p_question_text,
        updated_at = NOW()
    WHERE id = p_mcq_id;

    -- Get total options in JSON array
    SET total = JSON_LENGTH(p_options);
    
    -- Check that we have at least 2 options
    IF total < 2 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'At least 2 options are required for an MCQ challenge';
    END IF;
    
    -- Count existing options in the database
    SELECT COUNT(*) INTO options_count_in_db FROM tbl_mcq_option_challenge WHERE mcq_id = p_mcq_id;

    -- Check for duplicate options within the provided JSON
    DROP TEMPORARY TABLE IF EXISTS temp_option_texts;
    CREATE TEMPORARY TABLE temp_option_texts (
        option_text VARCHAR(255),
        option_type VARCHAR(50)
    );
    
    -- Insert all option texts into temp table
    SET i = 0;
    WHILE i < total DO
        SET opt_text = JSON_UNQUOTE(JSON_EXTRACT(p_options, CONCAT('$[', i, '].option_text')));
        SET opt_type = JSON_UNQUOTE(JSON_EXTRACT(p_options, CONCAT('$[', i, '].option_type')));
        
        INSERT INTO temp_option_texts VALUES (opt_text, opt_type);
        SET i = i + 1;
    END WHILE;
    
    -- Check for duplicates in the input options
    SELECT COUNT(*) INTO existing_count FROM (
        SELECT option_text, option_type, COUNT(*) as cnt
        FROM temp_option_texts
        GROUP BY option_text, option_type
        HAVING cnt > 1
    ) AS dup;
    
    IF existing_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Duplicate options detected in the input';
    END IF;
        
    SET i = 0;

    WHILE i < total DO

        SET opt_id = CAST(JSON_EXTRACT(p_options, CONCAT('$[', i, '].id')) AS UNSIGNED);
        SET opt_text = JSON_UNQUOTE(JSON_EXTRACT(p_options, CONCAT('$[', i, '].option_text')));
        SET opt_type = JSON_UNQUOTE(JSON_EXTRACT(p_options, CONCAT('$[', i, '].option_type')));
        SET is_corr = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_options, CONCAT('$[', i, '].is_correct'))) AS UNSIGNED);

        -- IF option has ID → UPDATE
        IF opt_id IS NOT NULL AND opt_id > 0 THEN

            SELECT COUNT(*) INTO option_exists_in_db
            FROM tbl_mcq_option_challenge
            WHERE id = opt_id AND mcq_id = p_mcq_id;

            IF option_exists_in_db = 0 THEN
                SET @error_msg = CONCAT('Option ID ', opt_id, ' does not exist for this challenge');
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = @error_msg;
            END IF;

            UPDATE tbl_mcq_option_challenge
            SET option_text = opt_text,
                option_type = opt_type,
                is_correct = is_corr,
                updated_at = NOW()
            WHERE id = opt_id AND mcq_id = p_mcq_id;

        ELSE

            -- IF no ID → INSERT new option
            INSERT INTO tbl_mcq_option_challenge
            (
                mcq_id,
                option_text,
                option_type,
                is_correct,
                created_at,
                updated_at
            )
            VALUES
            (
                p_mcq_id,
                opt_text,
                opt_type,
                is_corr,
                NOW(),
                NOW()
            );

        END IF;

        SET i = i + 1;

    END WHILE;
    
    -- Check if there's at least one correct option
    IF NOT EXISTS (
        SELECT 1 FROM tbl_mcq_option_challenge
        WHERE mcq_id = p_mcq_id AND is_correct = TRUE
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'At least one option must be marked as correct';
    END IF;
    
    -- Clean up and commit
    DROP TEMPORARY TABLE IF EXISTS temp_option_texts;
    COMMIT;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS deleteMCQChallenge;`);
        await sequelize.query(`CREATE PROCEDURE deleteMCQChallenge(
    IN mcq_id INT
)
BEGIN
    DECLARE v_mcq_id INT;

    SELECT id
    INTO v_mcq_id
    FROM tbl_mcq_challenge
    WHERE id = mcq_id
    LIMIT 1;

    IF v_mcq_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|MCQ Challenge not found';
    END IF;

    UPDATE tbl_mcq_challenge
    SET is_active = false,
        updated_at = NOW()
    WHERE id = mcq_id;

    CALL handleEntityStatus('mcq',mcq_id);

    DELETE FROM tbl_mcq_challenge WHERE id = mcq_id;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS toggleMCQChallengeStatus;`);
        await sequelize.query(`CREATE PROCEDURE toggleMCQChallengeStatus(
    IN mcq_id INT
)
BEGIN
    
    DECLARE v_mcq_id INT;

    SELECT id
    INTO v_mcq_id
    FROM tbl_mcq_challenge
    WHERE id = mcq_id
    LIMIT 1;

    IF v_mcq_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|MCQ Challenge not found';
    END IF;

    UPDATE tbl_mcq_challenge
    SET is_active = NOT is_active,
        updated_at = NOW()
    WHERE id = mcq_id;

    CALL handleEntityStatus('mcq',mcq_id);
END`)

        await sequelize.query(`DROP PROCEDURE IF EXISTS createMCQOptionChallenge;`);
        await sequelize.query(`CREATE PROCEDURE createMCQOptionChallenge(
    IN mcq_id INT,
    IN option_text VARCHAR(255),
    IN option_type ENUM('text', 'image'),
    IN is_correct BOOLEAN
)
BEGIN
    INSERT INTO tbl_mcq_option_challenge (mcq_id, option_text, option_type, is_correct, created_at, updated_at)
    VALUES (mcq_id, option_text, option_type, is_correct, NOW(), NOW());
    
    SELECT * FROM tbl_mcq_option_challenge WHERE id = LAST_INSERT_ID();
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS updateMCQOptionChallenge;`);
        await sequelize.query(`CREATE PROCEDURE updateMCQOptionChallenge(
    IN p_option_id INT,
    IN p_option_text VARCHAR(255),
    IN p_option_type ENUM('text', 'image'),
    IN p_is_correct BOOLEAN
)
BEGIN
    DECLARE mcq_id_val INT;
    
    -- Get the MCQ ID for this option
    SELECT mcq_id INTO mcq_id_val FROM tbl_mcq_option_challenge WHERE id = p_option_id;
    
    -- Check if updating would create a duplicate option for this MCQ
    IF EXISTS (
        SELECT 1 FROM tbl_mcq_option_challenge
        WHERE mcq_id = mcq_id_val 
        AND option_text = p_option_text 
        AND option_type = p_option_type 
        AND id != p_option_id
    ) THEN
        SET @error_msg = CONCAT('Option with text "', p_option_text, '" already exists for this challenge');
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = @error_msg;
    END IF;
    
    -- Update the option
    UPDATE tbl_mcq_option_challenge
    SET option_text = p_option_text, option_type = p_option_type, is_correct = p_is_correct, updated_at = NOW()
    WHERE id = p_option_id;
    
    SELECT * FROM tbl_mcq_option_challenge WHERE id = p_option_id;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS deleteMCQOptionChallenge;`);
        await sequelize.query(`CREATE PROCEDURE deleteMCQOptionChallenge(
    IN option_id INT
)
BEGIN
    DELETE FROM tbl_mcq_option_challenge WHERE id = option_id;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS toggleMCQChallengeOptionStatus;`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS toggleMCQChallengeOptionStatus (
    IN p_id INT
)
BEGIN
    UPDATE tbl_mcq_option_challenge
    SET is_active = NOT is_active,
        updated_at = NOW()
    WHERE id = p_id;
END`);

        console.log("✅ fill in the blank challenge procedures created!");
    } catch (error) {
        console.error("❌ Error setting mcq challenge procedures:", error);
        throw error;
    }
};

module.exports = setupMcqChallengeProcedures;
