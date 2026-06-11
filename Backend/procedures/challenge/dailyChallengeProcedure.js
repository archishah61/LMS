// utils/procedure/courseCategoryProcedures.js

const sequelize = require("../../config/db");

const setupDailyChallengeProcedures = async () => {
    try {
        console.log("🔄 Setting up Daily challenge procedures...");

        // Procedure: createCourseCategory
        await sequelize.query(`DROP PROCEDURE IF EXISTS createDailyChallenge`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createDailyChallenge (
      IN p_title VARCHAR(255),
      IN p_description TEXT,
      IN p_category INT,
      IN p_image_url VARCHAR(255),
      IN p_difficulty_level ENUM('Beginner', 'Intermediate', 'Advanced'),
      IN p_time_limit INT,
      IN p_estimated_time INT,
      IN p_qualify_percentage INT,
      IN p_max_attempt INT,
      IN p_is_per_question_reward BOOLEAN,
      IN p_points_reward INT,
      IN p_per_question_reward INT,
      IN p_start_date DATETIME,
      IN p_end_date DATETIME,
      IN p_show_answer BOOLEAN,
      IN p_is_warning BOOLEAN,
      IN p_no_of_warning INT,
      IN p_fillInTheBlanks JSON,
      IN p_mcqs JSON
  )
  BEGIN
      -- All declarations must be at the top
      DECLARE newChallengeId INT;
      DECLARE i INT DEFAULT 0;
      DECLARE j INT DEFAULT 0;
      DECLARE k INT DEFAULT 0;
      DECLARE mcqId INT;

      DECLARE temp INT;

    SELECT id INTO temp FROM tbl_challenge_categories WHERE id = p_category LIMIT 1;

    IF temp IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Challenge Category not found';
    END IF;

      -- Insert into DailyChallenge
      INSERT INTO tbl_daily_challenges (
          title, description, category, image_url, difficulty_level,
          time_limit, estimated_time, qualify_percentage,
          max_attempt, is_per_question_reward,
          points_reward, per_question_reward,
          start_date, end_date,
          show_answer, is_warning, no_of_warning, created_at, updated_at
      ) VALUES (
          p_title, p_description, p_category, p_image_url, p_difficulty_level,
          p_time_limit, p_estimated_time, p_qualify_percentage,
          p_max_attempt, p_is_per_question_reward,
          p_points_reward, p_per_question_reward,
          p_start_date, p_end_date,
          p_show_answer, p_is_warning, p_no_of_warning, NOW(), NOW()
      );

      SET newChallengeId = LAST_INSERT_ID();

      -- Insert Fill in the Blanks Questions
      IF JSON_LENGTH(p_fillInTheBlanks) > 0 THEN
          SET i = 0;
          WHILE i < JSON_LENGTH(p_fillInTheBlanks) DO
              INSERT INTO tbl_fillintheblanks_challenges (challenge_id, text, answers)
              VALUES (
                  newChallengeId,
                  JSON_UNQUOTE(JSON_EXTRACT(p_fillInTheBlanks, CONCAT('$[', i, '].text'))),
                  JSON_EXTRACT(p_fillInTheBlanks, CONCAT('$[', i, '].answers'))
              );
              SET i = i + 1;
          END WHILE;
      END IF;

      -- Insert MCQs and Options
      IF JSON_LENGTH(p_mcqs) > 0 THEN
          SET j = 0;
          WHILE j < JSON_LENGTH(p_mcqs) DO
              INSERT INTO tbl_mcq_challenge (challenge_id, question_text)
              VALUES (
                  newChallengeId,
                  JSON_UNQUOTE(JSON_EXTRACT(p_mcqs, CONCAT('$[', j, '].question_text')))
              );
              SET mcqId = LAST_INSERT_ID();

              SET k = 0;
              WHILE k < JSON_LENGTH(JSON_EXTRACT(p_mcqs, CONCAT('$[', j, '].options'))) DO
                  INSERT INTO tbl_mcq_option_challenge (
                      mcq_id, option_text, option_type, is_correct
                  ) VALUES (
                      mcqId,
                      JSON_UNQUOTE(JSON_EXTRACT(p_mcqs, CONCAT('$[', j, '].options[', k, '].option_text'))),
                      JSON_UNQUOTE(JSON_EXTRACT(p_mcqs, CONCAT('$[', j, '].options[', k, '].option_type'))),
                      JSON_EXTRACT(p_mcqs, CONCAT('$[', j, '].options[', k, '].is_correct'))
                  );
                  SET k = k + 1;
              END WHILE;
              SET j = j + 1;
          END WHILE;
      END IF;

      -- Return the created challenge
      SELECT * FROM tbl_daily_challenges WHERE id = newChallengeId;
  END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getAllChallengesWithCategory`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllChallengesWithCategory(
    IN p_search_term VARCHAR(255),
    IN p_category_id VARCHAR(20),
    IN p_difficulty VARCHAR(20),
    IN p_status VARCHAR(20),
    IN p_limit INT,
    IN p_offset INT,
    IN p_is_all BOOLEAN
)
BEGIN
    -- Count total records for pagination
    SELECT COUNT(*) AS total_count
    FROM tbl_daily_challenges dc
    LEFT JOIN tbl_challenge_categories cc ON dc.category = cc.id
    WHERE
        (p_search_term IS NULL OR p_search_term = ''
            OR dc.title LIKE CONCAT('%', p_search_term, '%')
            OR dc.description LIKE CONCAT('%', p_search_term, '%')
            OR cc.category LIKE CONCAT('%', p_search_term, '%'))
        AND (p_status IS NULL OR p_status = 'all' OR (p_status = 'active' AND dc.is_active = TRUE) OR (p_status = 'inactive' AND dc.is_active = FALSE))
        AND (p_difficulty IS NULL OR p_difficulty = 'all' OR p_difficulty = dc.difficulty_level)
        AND (p_category_id IS NULL OR p_category_id = 'all' OR p_category_id = dc.category);

    -- Fetch records
    IF p_is_all THEN
        SELECT
            dc.*,
            cc.id AS category_id,
            cc.category AS category_name
        FROM
            tbl_daily_challenges dc
        LEFT JOIN
            tbl_challenge_categories cc ON dc.category = cc.id
        WHERE
            (p_search_term IS NULL
                OR p_search_term = ''
                OR dc.title LIKE CONCAT('%', p_search_term, '%')
                OR dc.description LIKE CONCAT('%', p_search_term, '%')
                OR cc.category LIKE CONCAT('%', p_search_term, '%'))
            AND (p_status IS NULL OR p_status = 'all' OR (p_status = 'active' AND dc.is_active = TRUE) OR (p_status = 'inactive' AND dc.is_active = FALSE))
            AND (p_difficulty IS NULL OR p_difficulty = 'all' OR p_difficulty = dc.difficulty_level)
            AND (p_category_id IS NULL OR p_category_id = 'all' OR p_category_id = dc.category)
        ORDER BY
            dc.start_date DESC;
    ELSE
        SELECT
            dc.*,
            cc.id AS category_id,
            cc.category AS category_name
        FROM
            tbl_daily_challenges dc
        LEFT JOIN
            tbl_challenge_categories cc ON dc.category = cc.id
        WHERE
            (p_search_term IS NULL
                OR p_search_term = ''
                OR dc.title LIKE CONCAT('%', p_search_term, '%')
                OR dc.description LIKE CONCAT('%', p_search_term, '%')
                OR cc.category LIKE CONCAT('%', p_search_term, '%'))
            AND (p_status IS NULL OR p_status = 'all' OR (p_status = 'active' AND dc.is_active = TRUE) OR (p_status = 'inactive' AND dc.is_active = FALSE))
            AND (p_difficulty IS NULL OR p_difficulty = 'all' OR p_difficulty = dc.difficulty_level)
            AND (p_category_id IS NULL OR p_category_id = 'all' OR p_category_id = dc.category)
        ORDER BY
            dc.start_date DESC
        LIMIT p_limit OFFSET p_offset;
    END IF;
END`);


        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getDailyChallengeById(IN p_challenge_id INT)
BEGIN
    -- Challenge details with category
    SELECT 
        dc.*, 
        cc.id AS category_id,
        cc.category AS category_name
    FROM 
        tbl_daily_challenges dc
    LEFT JOIN 
        tbl_challenge_categories cc ON dc.category = cc.id
    WHERE 
        dc.id = p_challenge_id;

    -- Fill in the blanks data
    SELECT 
        fibc.*, 
        'FillInTheBlanks' AS challenge_type
    FROM 
        tbl_fillintheblanks_challenges fibc
    WHERE 
        fibc.challenge_id = p_challenge_id;

    -- MCQs data
    SELECT 
        mcq.*, 
        'MCQ' AS challenge_type
    FROM 
        tbl_mcq_challenge mcq
    WHERE 
        mcq.challenge_id = p_challenge_id;

    -- MCQ options for each MCQ challenge
    SELECT 
        mcq_opt.*, 
        'MCQOption' AS challenge_type
    FROM 
        tbl_mcq_option_challenge mcq_opt
    WHERE 
        mcq_opt.mcq_id IN (
            SELECT id 
            FROM tbl_mcq_challenge 
            WHERE challenge_id = p_challenge_id
        )
    ORDER BY mcq_opt.is_correct DESC;
    
    -- True/False challenges data
    SELECT 
        tfc.*, 
        'TrueFalse' AS challenge_type
    FROM 
        tbl_true_false_challenges tfc
    WHERE 
        tfc.challenge_id = p_challenge_id;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteChallengeById(IN p_challenge_id INT)
BEGIN

    DECLARE temp INT;

    SELECT id INTO temp FROM tbl_daily_challenges WHERE id = p_challenge_id LIMIT 1;

    IF temp IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Challenge not found';
    END IF;

    -- Delete MCQ Options
    DELETE FROM tbl_mcq_option_challenge 
    WHERE mcq_id IN (
        SELECT id FROM tbl_mcq_challenge WHERE challenge_id = p_challenge_id
    );

    -- Delete MCQs
    DELETE FROM tbl_mcq_challenge WHERE challenge_id = p_challenge_id;

    -- Delete Fill in the Blanks
    DELETE FROM tbl_fillintheblanks_challenges WHERE challenge_id = p_challenge_id;

    -- Delete the Challenge
    DELETE FROM tbl_daily_challenges WHERE id = p_challenge_id;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS updateChallengeById`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateChallengeById(
    IN p_id INT,
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_category INT,
    IN p_image_url VARCHAR(255),
    IN p_difficulty_level VARCHAR(50),
    IN p_max_attempt INT,
    IN p_is_per_question_reward BOOLEAN,
    IN p_show_answer BOOLEAN,
    IN p_is_warning BOOLEAN,
    IN p_no_of_warning INT,
    IN p_per_question_reward INT,
    IN p_points_reward INT,
    IN p_qualify_percentage INT,
    IN p_start_date DATETIME,
    IN p_time_limit INT
)
BEGIN

    DECLARE temp INT;
    DECLARE temp_challenge INT;

    SELECT id INTO temp FROM tbl_challenge_categories WHERE id = p_category LIMIT 1;

    IF temp IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Challenge Category not found';
    END IF;

    SELECT id INTO temp_challenge FROM tbl_daily_challenges WHERE id = p_id LIMIT 1;

    IF temp_challenge IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Challenge not found';
    END IF;

    UPDATE tbl_daily_challenges
    SET 
        title = p_title,
        description = p_description,
        category = p_category,
        image_url = p_image_url,
        difficulty_level = p_difficulty_level,
        max_attempt = p_max_attempt,
        is_per_question_reward = p_is_per_question_reward,
        show_answer = p_show_answer,
        is_warning = p_is_warning, 
        no_of_warning = p_no_of_warning,
        per_question_reward = p_per_question_reward,
        points_reward = p_points_reward,
        qualify_percentage = p_qualify_percentage,
        start_date = p_start_date,
        time_limit = p_time_limit
    WHERE id = p_id;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS toggleChallengeStatusById;`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS toggleChallengeStatusById(IN challengeId INT)
BEGIN
    DECLARE currentStatus BOOLEAN;
    DECLARE totalQuestions INT DEFAULT 0;

    -- Check if challenge exists
    SELECT is_active INTO currentStatus
    FROM tbl_daily_challenges
    WHERE id = challengeId;

    -- If not found, throw error
    IF currentStatus IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Challenge not found';
    END IF;

    CALL validateActivation('daily_challenge', challengeId, currentStatus);

    -- Toggle is_active value
    UPDATE tbl_daily_challenges
    SET is_active = NOT currentStatus
    WHERE id = challengeId;

    -- Return the updated challenge
    SELECT * FROM tbl_daily_challenges WHERE id = challengeId;
END`);

        console.log("✅ Course procedures created!");
    } catch (error) {
        console.error("❌ Error setting Daily Challenge procedures:", error);
        throw error;
    }
};

module.exports = setupDailyChallengeProcedures;
