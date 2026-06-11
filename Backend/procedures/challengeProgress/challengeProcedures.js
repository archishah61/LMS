// utils/procedure/courseCategoryProcedures.js

const sequelize = require("../../config/db");

const setupChallengeProcedures = async () => {
    try {
        console.log("🔄 Setting up Challenge procedures...");

        await sequelize.query(`DROP PROCEDURE IF EXISTS handleEntityStatus;`);
        await sequelize.query(`CREATE PROCEDURE handleEntityStatus (
    IN p_entity_type ENUM('fill_blank','mcq','true_false','challenge_task','challenge_phase','challenge_quest','daily_challenge'),
    IN p_id INT
)
BEGIN
    DECLARE v_task_id INT;
    DECLARE v_phase_id INT;
    DECLARE v_challenge_id INT;
    DECLARE v_daily_id INT;
    DECLARE v_active_count INT;

    -- 1 Handle Question Level (Fill, MCQ, TF)
    IF p_entity_type = 'fill_blank' THEN
        SELECT challenge_task_id, challenge_id
        INTO v_task_id, v_daily_id
        FROM tbl_fillintheblanks_challenges WHERE id = p_id;
    ELSEIF p_entity_type = 'mcq' THEN
        SELECT challenge_task_id, challenge_id
        INTO v_task_id, v_daily_id
        FROM tbl_mcq_challenge WHERE id = p_id;
    ELSEIF p_entity_type = 'true_false' THEN
        SELECT challenge_task_id, challenge_id
        INTO v_task_id, v_daily_id
        FROM tbl_true_false_challenges WHERE id = p_id;
    ELSEIF p_entity_type = 'challenge_task' THEN
        SET v_task_id = p_id;
    ELSEIF p_entity_type = 'challenge_phase' THEN
        SET v_phase_id = p_id;
    END IF;

    -- 2 Cascade for Challenge Task
    IF v_task_id IS NOT NULL AND p_entity_type IN ('fill_blank','mcq','true_false') THEN
        SELECT COUNT(*) INTO v_active_count FROM tbl_fillintheblanks_challenges WHERE challenge_task_id = v_task_id AND is_active = 1;
        SET v_active_count = v_active_count + (SELECT COUNT(*) FROM tbl_mcq_challenge WHERE challenge_task_id = v_task_id AND is_active = 1);
        SET v_active_count = v_active_count + (SELECT COUNT(*) FROM tbl_true_false_challenges WHERE challenge_task_id = v_task_id AND is_active = 1);

        IF v_active_count = 0 THEN
            UPDATE tbl_challenge_tasks SET is_active = 0, updated_at = NOW() WHERE id = v_task_id;
        END IF;
    END IF;

    -- 3 Cascade for Challenge Phase
    IF v_task_id IS NOT NULL THEN
        SELECT challenge_phase_id INTO v_phase_id FROM tbl_challenge_tasks WHERE id = v_task_id;
        IF v_phase_id IS NOT NULL THEN
            SELECT COUNT(*) INTO v_active_count FROM tbl_challenge_tasks WHERE challenge_phase_id = v_phase_id AND is_active = 1;
            IF v_active_count = 0 THEN
                UPDATE tbl_challenge_phases SET is_active = 0, updated_at = NOW() WHERE id = v_phase_id;
            END IF;
        END IF;
    END IF;

    -- 4 Cascade for Challenge Quest
    IF v_phase_id IS NOT NULL THEN
        SELECT challenge_id INTO v_challenge_id FROM tbl_challenge_phases WHERE id = v_phase_id;
        IF v_challenge_id IS NOT NULL THEN
            SELECT COUNT(*) INTO v_active_count FROM tbl_challenge_phases WHERE challenge_id = v_challenge_id AND is_active = 1;
            IF v_active_count = 0 THEN
                UPDATE tbl_challenges SET is_active = 0, updated_at = NOW() WHERE id = v_challenge_id;
            END IF;
        END IF;
    END IF;

    -- 5 Cascade for Daily Challenge
    IF v_daily_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_active_count FROM tbl_fillintheblanks_challenges WHERE challenge_id = v_daily_id AND is_active = 1;
        SET v_active_count = v_active_count + (SELECT COUNT(*) FROM tbl_mcq_challenge WHERE challenge_id = v_daily_id AND is_active = 1);
        SET v_active_count = v_active_count + (SELECT COUNT(*) FROM tbl_true_false_challenges WHERE challenge_id = v_daily_id AND is_active = 1);

        IF v_active_count = 0 THEN
            UPDATE tbl_daily_challenges SET is_active = 0, updated_at = NOW() WHERE id = v_daily_id;
        END IF;
    END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS validateActivation;`);
        await sequelize.query(`CREATE PROCEDURE validateActivation (
    IN p_entity_type ENUM('daily_challenge','challenge_task','challenge_phase','challenge_quest'),
    IN p_id INT,
    IN current_status TINYINT
)
BEGIN
    DECLARE v_total_active INT DEFAULT 0;

    -- Only run validation when trying to activate (current_status = 0 → going to 1)
    IF current_status = 0 THEN

        -- 1 Challenge Task → must have at least one active question
        IF p_entity_type = 'challenge_task' THEN
            SELECT 
                (SELECT COUNT(*) FROM tbl_mcq_challenge WHERE challenge_task_id = p_id AND is_active = 1) +
                (SELECT COUNT(*) FROM tbl_true_false_challenges WHERE challenge_task_id = p_id AND is_active = 1) +
                (SELECT COUNT(*) FROM tbl_fillintheblanks_challenges WHERE challenge_task_id = p_id AND is_active = 1)
            INTO v_total_active;

            IF v_total_active = 0 THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'E400|ValidationError|Cannot activate task without at least one active question';
            END IF;
        END IF;

        -- 2 Challenge Phase → must have at least one active task
        IF p_entity_type = 'challenge_phase' THEN
            SELECT COUNT(*) INTO v_total_active
            FROM tbl_challenge_tasks
            WHERE challenge_phase_id = p_id AND is_active = 1;

            IF v_total_active = 0 THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'E400|ValidationError|Cannot activate phase without at least one active task';
            END IF;
        END IF;

        -- 3 Challenge Quest → must have at least one active phase
        IF p_entity_type = 'challenge_quest' THEN
            SELECT COUNT(*) INTO v_total_active
            FROM tbl_challenge_phases
            WHERE challenge_id = p_id AND is_active = 1;

            IF v_total_active = 0 THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'E400|ValidationError|Cannot activate challenge without at least one active phase';
            END IF;
        END IF;

        -- 4 Daily Challenge → must have at least one active question
        IF p_entity_type = 'daily_challenge' THEN
            SELECT 
                (SELECT COUNT(*) FROM tbl_mcq_challenge WHERE challenge_id = p_id AND is_active = 1) +
                (SELECT COUNT(*) FROM tbl_true_false_challenges WHERE challenge_id = p_id AND is_active = 1) +
                (SELECT COUNT(*) FROM tbl_fillintheblanks_challenges WHERE challenge_id = p_id AND is_active = 1)
            INTO v_total_active;

            IF v_total_active = 0 THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'E400|ValidationError|Cannot activate daily challenge without at least one active question';
            END IF;
        END IF;

    END IF;

END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getUserDailyChallenge;`);
        await sequelize.query(`CREATE PROCEDURE getUserDailyChallenge(IN p_user_id INT)
BEGIN
DECLARE today_start DATETIME;
SET today_start = CURDATE(); -- Midnight today

SELECT 
udc.id,
udc.user_id,
udc.challenge_id,
udc.attempts,
udc.is_completed,
udc.completed_at,
udc.points_earned,
udc.assigned_at,

dc.id AS dc_id,
dc.title,
dc.description,
dc.category,
dc.image_url,
dc.difficulty_level,
dc.time_limit,
dc.estimated_time,
dc.qualify_percentage,
dc.max_attempt,
dc.is_per_question_reward,
dc.show_answer,
dc.points_reward,
dc.per_question_reward,
dc.start_date,
dc.end_date,
dc.is_active,
dc.created_at AS dc_created_at,
dc.updated_at AS dc_updated_at,

cat.id AS cat_id,
cat.category AS cat_name,
cat.is_active AS cat_active,
cat.created_by,
cat.updated_by,
cat.created_at AS cat_createdAt,
cat.updated_at AS cat_updatedAt

FROM tbl_user_daily_challenge udc
JOIN tbl_daily_challenges dc ON dc.id = udc.challenge_id
JOIN tbl_challenge_categories cat ON cat.id = dc.category
WHERE udc.user_id = p_user_id AND udc.assigned_at >= today_start
LIMIT 1;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getUserDailyChallengeByDate;`);
        await sequelize.query(`CREATE PROCEDURE getUserDailyChallengeByDate(
IN p_user_id INT,
IN p_date DATE
)
BEGIN
DECLARE start_datetime DATETIME;
DECLARE end_datetime DATETIME;

-- Calculate the start and end time for the given date
SET start_datetime = CONCAT(p_date, ' 00:00:00');
SET end_datetime = CONCAT(p_date, ' 23:59:59');

SELECT 
udc.id,
udc.user_id,
udc.challenge_id,
udc.attempts,
udc.is_completed,
udc.completed_at,
udc.points_earned,
udc.assigned_at,

dc.id AS dc_id,
dc.title,
dc.description,
dc.category,
dc.image_url,
dc.difficulty_level,
dc.time_limit,
dc.estimated_time,
dc.qualify_percentage,
dc.max_attempt,
dc.is_per_question_reward,
dc.show_answer,
dc.points_reward,
dc.per_question_reward,
dc.start_date,
dc.end_date,
dc.is_active,
dc.created_at AS dc_created_at,
dc.updated_at AS dc_updated_at,

cat.id AS cat_id,
cat.category AS cat_name,
cat.is_active AS cat_active,
cat.created_by,
cat.updated_by,
cat.created_at AS cat_createdAt,
cat.updated_at AS cat_updatedAt

FROM tbl_user_daily_challenge udc
JOIN tbl_daily_challenges dc ON dc.id = udc.challenge_id
JOIN tbl_challenge_categories cat ON cat.id = dc.category
WHERE udc.user_id = p_user_id
AND udc.assigned_at BETWEEN start_datetime AND end_datetime
LIMIT 1;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS assignChallengeToUser;`);
        await sequelize.query(`CREATE PROCEDURE assignChallengeToUser(
IN p_user_id INT,
IN p_category INT,
IN p_difficulty_level VARCHAR(50)
)
BEGIN
DECLARE v_today DATE;
DECLARE v_existing INT;
DECLARE v_challenge_id INT;

SET v_today = CURDATE();

challenge_block: BEGIN

-- Check if a challenge is already assigned today
SELECT COUNT(*) INTO v_existing
FROM tbl_user_daily_challenge
WHERE user_id = p_user_id AND DATE(assigned_at) = v_today;

IF v_existing > 0 THEN
    SELECT 
        NULL AS id,
        p_user_id AS user_id,
        NULL AS challenge_id,
        0 AS attempts,
        FALSE AS is_completed,
        0 AS points_earned,
        NULL AS assigned_at,
        'User already has a challenge assigned for today.' AS message;
    LEAVE challenge_block;
END IF;

-- Find a unique and eligible challenge
SELECT id INTO v_challenge_id
FROM tbl_daily_challenges
WHERE category = p_category
    AND difficulty_level = p_difficulty_level
    AND is_active = TRUE
    AND start_date <= CURDATE()
    AND (end_date IS NULL OR end_date >= CURDATE())
    AND id NOT IN (
        SELECT challenge_id
        FROM tbl_user_daily_challenge
        WHERE user_id = p_user_id
    )
ORDER BY RAND()
LIMIT 1;

IF v_challenge_id IS NULL THEN
    SELECT 
        NULL AS id,
        p_user_id AS user_id,
        NULL AS challenge_id,
        0 AS attempts,
        FALSE AS is_completed,
        0 AS points_earned,
        NULL AS assigned_at,
        'No available unique challenge found for the given category and difficulty level.' AS message;
    LEAVE challenge_block;
END IF;

-- Assign the challenge
INSERT INTO tbl_user_daily_challenge (
    user_id, challenge_id, attempts, is_completed, points_earned, assigned_at
)
VALUES (
    p_user_id, v_challenge_id, 0, FALSE, 0, NOW()
);

SELECT 
    LAST_INSERT_ID() AS id,
    p_user_id AS user_id,
    v_challenge_id AS challenge_id,
    0 AS attempts,
    FALSE AS is_completed,
    0 AS points_earned,
    NOW() AS assigned_at,
    'Challenge assigned successfully!' AS message;

END challenge_block;

END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS startChallengeById;`);
        await sequelize.query(`CREATE PROCEDURE startChallengeById(IN p_user_id INT, IN p_challenge_id INT)
BEGIN
DECLARE v_is_completed BOOLEAN;
DECLARE v_attempts INT;
DECLARE v_max_attempt INT;
DECLARE v_challenge_exists BOOLEAN DEFAULT FALSE;

-- Check if the user challenge exists and get its status
SELECT 
uc.is_completed, 
uc.attempts, 
dc.max_attempt,
TRUE INTO v_is_completed, v_attempts, v_max_attempt, v_challenge_exists
FROM tbl_user_daily_challenge AS uc
JOIN tbl_daily_challenges AS dc ON uc.challenge_id = dc.id
WHERE uc.user_id = p_user_id AND uc.challenge_id = p_challenge_id
LIMIT 1;

-- Return challenge data if all validation checks pass
IF v_challenge_exists THEN
IF v_attempts >= v_max_attempt THEN
    SELECT FALSE AS success, CONCAT('Attempt limit reached (', v_attempts, '/', v_max_attempt, ').') AS message;
ELSE
    -- Return the challenge with all required data
    SELECT 
        TRUE AS success,
        dc.id,
        dc.title,
        dc.description,
        dc.category,
        dc.image_url,
        dc.difficulty_level,
        dc.time_limit,
        dc.estimated_time,
        dc.qualify_percentage,
        dc.max_attempt,
        dc.is_per_question_reward,
        dc.show_answer,
        dc.is_warning,
        dc.no_of_warning,
        dc.points_reward,
        dc.per_question_reward,
        dc.start_date,
        dc.end_date,
        dc.is_active,
        dc.created_at,
        dc.updated_at,
        cc.id AS category_id,
        cc.category,

        -- Fill in the blanks data
        (SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', fbc.id,
                'challenge_id', fbc.challenge_id,
                'text', fbc.text,
                'is_active', fbc.is_active
            )
        )
        FROM tbl_fillintheblanks_challenges fbc
        WHERE fbc.challenge_id = dc.id AND fbc.is_active = TRUE) AS fillInTheBlanks,

        -- True False data
        (SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', tfc.id,
                'question', tfc.question
            )
        )
        FROM tbl_true_false_challenges tfc
        WHERE tfc.challenge_id = dc.id AND tfc.is_active = TRUE) AS TrueFalse,

        -- MCQ data with options
        (SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', mcq.id,
                'challenge_id', mcq.challenge_id,
                'question_text', mcq.question_text,
                'is_active', mcq.is_active,
                'MCQOptionChallenges', (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', opt.id,
                            'option_text', opt.option_text,
                            'option_type', opt.option_type
                        )
                    )
                    FROM tbl_mcq_option_challenge AS opt
                    WHERE opt.mcq_id = mcq.id
                )
            )
        )
        FROM tbl_mcq_challenge AS mcq
        WHERE mcq.challenge_id = p_challenge_id AND mcq.is_active = TRUE) AS mcqChallenges

    FROM tbl_daily_challenges AS dc
    LEFT JOIN tbl_challenge_categories AS cc ON dc.category = cc.id
    WHERE dc.id = p_challenge_id
    GROUP BY dc.id;
END IF;
ELSE
SELECT FALSE AS success, 'Challenge not found for this user.' AS message;
END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getUserDailyChallengeById;`);
        await sequelize.query(`CREATE PROCEDURE getUserDailyChallengeById(IN p_user_id INT)
BEGIN
-- get the latest user challenge with daily challenge and category details
SELECT 
uc.id,
uc.user_id,
uc.challenge_id,
uc.attempts,
uc.is_completed,
uc.completed_at,
uc.points_earned,
uc.assigned_at,

-- Daily Challenge fields
dc.id AS dc_id,
dc.title,
dc.description,
dc.category,
dc.image_url,
dc.difficulty_level,
dc.time_limit,
dc.estimated_time,
dc.qualify_percentage,
dc.max_attempt,
dc.is_per_question_reward,
dc.show_answer,
dc.points_reward,
dc.per_question_reward,
dc.start_date,
dc.end_date,
dc.is_active,
dc.created_at,
dc.updated_at,

-- Category Details fields
cc.id AS category_id,
cc.category,
cc.is_active AS category_is_active,
cc.created_by,
cc.updated_by,
cc.created_at AS category_created_at,
cc.updated_at AS category_updated_at

FROM tbl_user_daily_challenge AS uc
JOIN tbl_daily_challenges AS dc ON uc.challenge_id = dc.id
JOIN tbl_challenge_categories AS cc ON dc.category = cc.id
WHERE uc.user_id = p_user_id
ORDER BY uc.assigned_at DESC
LIMIT 1;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getCompleteDatesByUserId;`);
        await sequelize.query(`CREATE PROCEDURE getCompleteDatesByUserId(
IN p_user_id INT
)
BEGIN
-- Select all challenge dates for this user, with their completion status
SELECT 
DATE_FORMAT(assigned_at, '%Y-%m-%d') AS formatted_date,
is_completed
FROM 
tbl_user_daily_challenge
WHERE 
user_id = p_user_id
ORDER BY 
assigned_at ASC;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS startUserChallengePhase;`);
        await sequelize.query(`CREATE PROCEDURE startUserChallengePhase(
IN in_user_challenge_id INT,
IN in_challenge_phase_id INT
)
BEGIN
DECLARE v_challenge_id_user INT;
DECLARE v_challenge_id_phase INT;
DECLARE v_phase_number INT;
DECLARE v_now DATETIME;
DECLARE v_prev_phase_count INT;
DECLARE v_completed_phase_count INT;
DECLARE v_user_phase_id INT;

proc_block : BEGIN

SET v_now = NOW();

-- Step 1: Validate user_challenge_id and challenge_phase_id
SELECT challenge_id INTO v_challenge_id_user
FROM tbl_user_challenge
WHERE id = in_user_challenge_id;

IF v_challenge_id_user IS NULL THEN
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|InvalidReferenceError|Invalid user_challenge_id';
END IF;

SELECT challenge_id, phase_number INTO v_challenge_id_phase, v_phase_number
FROM tbl_challenge_phases
WHERE id = in_challenge_phase_id;

IF v_challenge_id_phase IS NULL THEN
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|InvalidReferenceError|Invalid challenge_phase_id';
END IF;

-- Step 2: Validate challenge_id match
IF v_challenge_id_phase != v_challenge_id_user THEN
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|MismatchError|This phase does not belong to the selected challenge';
END IF;

-- Step 3: Check previous phases completion
SELECT COUNT(*) INTO v_prev_phase_count
FROM tbl_challenge_phases
WHERE challenge_id = v_challenge_id_user AND phase_number < v_phase_number AND is_active = TRUE;

IF v_prev_phase_count > 0 THEN
SELECT COUNT(*) INTO v_completed_phase_count
FROM tbl_user_challenge_phases
WHERE user_challenge_id = in_user_challenge_id
  AND is_completed = TRUE
  AND challenge_phase_id IN (
    SELECT id FROM tbl_challenge_phases
    WHERE challenge_id = v_challenge_id_user AND phase_number < v_phase_number AND is_active = TRUE
  );

IF v_completed_phase_count != v_prev_phase_count THEN
    SELECT 'Previous phases are not completed' AS message, FALSE AS success;
    LEAVE proc_block;
END IF;
END IF;

-- Step 4: Start or reactivate phase
SELECT id INTO v_user_phase_id
FROM tbl_user_challenge_phases
WHERE user_challenge_id = in_user_challenge_id AND challenge_phase_id = in_challenge_phase_id;

IF v_user_phase_id IS NOT NULL THEN
UPDATE tbl_user_challenge_phases
SET is_active = TRUE,
    is_lock = FALSE,
    started_at = COALESCE(started_at, v_now)
WHERE id = v_user_phase_id;
ELSE
INSERT INTO tbl_user_challenge_phases (user_challenge_id, challenge_phase_id, is_active, is_lock, started_at)
VALUES (in_user_challenge_id, in_challenge_phase_id, TRUE, FALSE, v_now);
END IF;

-- Success response
SELECT 'User Challenge Phase started successfully' AS message, TRUE AS success;

END proc_block;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getUserChallengePhase;`);
        await sequelize.query(`CREATE PROCEDURE getUserChallengePhase(
    IN p_user_challenge_id INT,
    IN p_challenge_phase_id INT
)
BEGIN
    SELECT 
        ucp.id AS ucp_id,
        cp.id AS cp_id,
        ucp.*,
        cp.*,
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'user_challenge_task', JSON_OBJECT(
                        'id', uct.id,
                        'user_challenge_phase_id', uct.user_challenge_phase_id,
                        'challenge_task_id', uct.challenge_task_id,
                        'is_completed', uct.is_completed,
                        'attempts', uct.attempts,
                        'revive_attempt_at', uct.revive_attempt_at,
                        'points_earned', uct.points_earned,
                        'completed_at', uct.completed_at,
                        'progress_percentage', uct.progress_percentage,
                        'is_active', uct.is_active,
                        'created_at', uct.created_at,
                        'updated_at', uct.updated_at
                    ),
                    'challenge_task', JSON_OBJECT(
                        'id', ct.id,
                        'challenge_phase_id', ct.challenge_phase_id,
                        'title', ct.title,
                        'description', ct.description,
                        'difficulty_level', ct.difficulty_level,
                        'order', ct.order,
                        'is_mandatory', ct.is_mandatory,
                        'show_answer', ct.show_answer,
                        'qualify_percentage', ct.qualify_percentage,
                        'max_attempts', ct.max_attempts,
                        'reward_points', ct.reward_points,
                        'time_limit', ct.time_limit,
                        'is_active', ct.is_active,
                        'created_at', ct.created_at,
                        'updated_at', ct.updated_at
                    )
                )
            )
            FROM tbl_user_challenge_tasks uct
            JOIN tbl_challenge_tasks ct ON uct.challenge_task_id = ct.id
            WHERE uct.user_challenge_phase_id = ucp.id AND ct.is_active = TRUE
        ) AS tbl_user_challenge_tasks
    FROM tbl_user_challenge_phases ucp
    JOIN tbl_challenge_phases cp ON ucp.challenge_phase_id = cp.id
    WHERE 
        ucp.user_challenge_id = p_user_challenge_id
        AND ucp.challenge_phase_id = p_challenge_phase_id
        AND cp.is_active = TRUE;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS startUserChallenge;`);
        await sequelize.query(`CREATE PROCEDURE startUserChallenge(
IN p_user_id INT,
IN p_challenge_id INT
)
BEGIN
DECLARE v_existing_user_challenge_id INT;
DECLARE v_challenge_exists INT DEFAULT 0;
DECLARE v_phase_count INT DEFAULT 0;
DECLARE v_task_count INT DEFAULT 0;
DECLARE v_start_date DATETIME;
DECLARE v_end_date DATETIME;

start_user_challenge: BEGIN

-- Error handler
DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
ROLLBACK;
SELECT 500 AS status_code, 'An error occurred while processing the request' AS message, NULL AS user_challenge_id;
END;

START TRANSACTION;

-- Input validation
IF p_user_id IS NULL OR p_challenge_id IS NULL THEN
SELECT 400 AS status_code, 'user_id and challenge_id are required' AS message, NULL AS user_challenge_id;
ROLLBACK;
LEAVE start_user_challenge;
END IF;

-- Check challenge existence
SELECT COUNT(*) INTO v_challenge_exists FROM tbl_challenges WHERE id = p_challenge_id;

IF v_challenge_exists = 0 THEN
SELECT 404 AS status_code, 'Challenge not found' AS message, NULL AS user_challenge_id;
ROLLBACK;
LEAVE start_user_challenge;
END IF;


SELECT startDate, endDate 
INTO v_start_date, v_end_date
FROM tbl_challenges 
WHERE id = p_challenge_id
LIMIT 1;

-- Validate date: Challenge not started yet
IF NOW() < v_start_date THEN
    SELECT 400 AS status_code, 'Challenge has not started yet' AS message, NULL AS user_challenge_id;
    ROLLBACK;
    LEAVE start_user_challenge;
END IF;

-- Validate date: Challenge expired
IF NOW() > v_end_date THEN
    SELECT 400 AS status_code, 'Challenge has expired' AS message, NULL AS user_challenge_id;
    ROLLBACK;
    LEAVE start_user_challenge;
END IF;

-- Check if user already started the challenge
SELECT id INTO v_existing_user_challenge_id 
FROM tbl_user_challenge 
WHERE user_id = p_user_id AND challenge_id = p_challenge_id
LIMIT 1;

IF v_existing_user_challenge_id IS NOT NULL THEN
SELECT 200 AS status_code, 'User Challenge started successfully' AS message, v_existing_user_challenge_id AS user_challenge_id;
ELSE
-- Insert new user challenge
INSERT INTO tbl_user_challenge (user_id, challenge_id, assigned_at)
VALUES (p_user_id, p_challenge_id, NOW());

SET v_existing_user_challenge_id = LAST_INSERT_ID();

-- Check for phases
SELECT COUNT(*) INTO v_phase_count 
FROM tbl_challenge_phases 
WHERE challenge_id = p_challenge_id;

IF v_phase_count = 0 THEN
    SELECT 404 AS status_code, 'No challenge phases found for the given challenge_id' AS message, NULL AS user_challenge_id;
    ROLLBACK;
    LEAVE start_user_challenge;
END IF;

-- Check if tasks exist for any challenge phase
SELECT COUNT(*) INTO v_task_count 
FROM tbl_challenge_tasks ct
JOIN tbl_challenge_phases cp ON ct.challenge_phase_id = cp.id
WHERE cp.challenge_id = p_challenge_id;

IF v_task_count = 0 THEN
    SELECT 404 AS status_code, 'No tasks found for any phase in this challenge' AS message, NULL AS user_challenge_id;
    ROLLBACK;
    LEAVE start_user_challenge;
END IF;

-- Insert user challenge phases
INSERT INTO tbl_user_challenge_phases (user_challenge_id, challenge_phase_id, created_at, updated_at)
SELECT v_existing_user_challenge_id, id, NOW(), NOW()
FROM tbl_challenge_phases
WHERE challenge_id = p_challenge_id AND is_active = TRUE;

-- Insert tasks
INSERT INTO tbl_user_challenge_tasks (user_challenge_phase_id, challenge_task_id, created_at, updated_at)
SELECT ucp.id, ct.id, NOW(), NOW()
FROM tbl_user_challenge_phases ucp
JOIN tbl_challenge_phases cp ON ucp.challenge_phase_id = cp.id
JOIN tbl_challenge_tasks ct ON ct.challenge_phase_id = cp.id
WHERE ucp.user_challenge_id = v_existing_user_challenge_id AND ct.is_active = TRUE;

SELECT 200 AS status_code, 'User Challenge recorded successfully' AS message, v_existing_user_challenge_id AS user_challenge_id;
END IF;

COMMIT;

END start_user_challenge;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getUserChallengeDetails;`);
        await sequelize.query(`CREATE PROCEDURE getUserChallengeDetails(IN p_user_challenge_id INT)
BEGIN
    SELECT * FROM tbl_user_challenge WHERE id = p_user_challenge_id;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getChallengeWithPhases;`);
        await sequelize.query(`CREATE PROCEDURE getChallengeWithPhases(IN p_challenge_id INT)
BEGIN
    -- get challenge details
    SELECT * FROM tbl_challenges WHERE id = p_challenge_id;
    
    -- get challenge phases
    SELECT * FROM tbl_challenge_phases WHERE challenge_id = p_challenge_id;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getAllChallenges;`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllChallenges(
            IN p_category_id BIGINT,
            IN p_status BOOLEAN,
            IN p_difficulty_level VARCHAR(50),
            IN p_limit INT,
            IN p_offset INT,
            IN p_is_all BOOLEAN
            )
        BEGIN 
            DECLARE v_limit BIGINT;
            DECLARE v_offset BIGINT;

            IF p_is_all = TRUE THEN
                SET v_limit = 9223372036854775807;
                SET v_offset = 0;
            ELSE
                SET v_limit = p_limit;
                SET v_offset = p_offset;
            END IF;

            SELECT COUNT(*) AS total_count
            FROM tbl_challenges
            WHERE (p_category_id IS NULL OR category_id = p_category_id)
                AND (p_status IS NULL OR is_active = p_status)
                AND (p_difficulty_level IS NULL OR difficulty_level = p_difficulty_level);

            SELECT 
                c.id,
                c.title,
                c.description,
                c.difficulty_level,
                c.category_id,
                cc.category AS category_name,
                c.reward_points,
                c.startDate,
                c.endDate,
                c.rules,
                c.is_active,
                c.created_at,
                c.updated_at
                FROM tbl_challenges AS c
                JOIN tbl_challenge_categories AS cc ON c.category_id = cc.id
            WHERE (p_category_id IS NULL OR c.category_id = p_category_id)
                AND (p_status IS NULL OR c.is_active = p_status)
                AND (p_difficulty_level IS NULL OR c.difficulty_level = p_difficulty_level)
            ORDER BY c.created_at DESC
            LIMIT v_limit OFFSET v_offset; 
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getUserChallengeById;`);
        await sequelize.query(`CREATE PROCEDURE getUserChallengeById(IN ucId INT)
BEGIN
DECLARE challenge_exists INT;
    
    -- Check if the user challenge exists
    SELECT COUNT(*) INTO challenge_exists 
    FROM tbl_user_challenge 
    WHERE id = ucId;
    
    IF challenge_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'UserChallengeQuest not found.';
    ELSE
        -- First, get the UserChallenge and its associated Challenge
        SELECT 
        uc.*, 
        c.id AS challenge_id, c.title AS challenge_title, c.description AS challenge_description,
        c.difficulty_level, c.reward_points, c.created_at AS challenge_created_at
        FROM tbl_user_challenge uc
        JOIN tbl_challenges c ON uc.challenge_id = c.id
        WHERE uc.id = ucId;

        -- Then, get all UserChallengePhases for the given UserChallenge, along with ChallengePhase info
        SELECT 
        ucp.*, 
        cp.title AS phase_title, cp.description AS phase_description,
        cp.phase_number, cp.tasks_count, cp.phase_type, cp.bonus_reward
        FROM tbl_user_challenge_phases ucp
        JOIN tbl_challenge_phases cp ON ucp.challenge_phase_id = cp.id
        WHERE ucp.user_challenge_id = ucId AND cp.is_active = TRUE;
    END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getUserChallengesByUserId;`);
        await sequelize.query(`CREATE PROCEDURE getUserChallengesByUserId(IN p_user_id INT)
BEGIN
    -- Check if the user exists
    DECLARE user_exists INT;
    SELECT COUNT(*) INTO user_exists FROM tbl_users WHERE id = p_user_id;
    
    IF user_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User not found.';
    ELSE
        -- This will directly return the exact JSON structure you need
        SELECT 
            TRUE AS success,
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', uc.id,
                        'user_id', uc.user_id,
                        'challenge_id', uc.challenge_id,
                        'is_completed', IF(uc.is_completed, TRUE, FALSE),
                        'completed_at', uc.completed_at,
                        'points_earned', uc.points_earned,
                        'status', uc.status,
                        'progress_percentage', uc.progress_percentage,
                        'assigned_at', uc.assigned_at,
                        'Challenge', JSON_OBJECT(
                            'id', c.id,
                            'title', c.title,
                            'description', c.description,
                            'difficulty_level', c.difficulty_level,
                            'category_id', c.category_id,
                            'category_name', cc.category,
                            'reward_points', c.reward_points,
                            'startDate', c.startDate,
                            'endDate', c.endDate,
                            'rules', c.rules,
                            'is_active', IF(c.is_active, TRUE, FALSE),
                            'created_at', c.created_at,
                            'updated_at', c.updated_at
                        ),
                        'UserChallengePhases', (
                            SELECT JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'id', ucp.id,
                                    'user_challenge_id', ucp.user_challenge_id,
                                    'challenge_phase_id', ucp.challenge_phase_id,
                                    'completed_tasks', ucp.completed_tasks,
                                    'is_completed', IF(ucp.is_completed, TRUE, FALSE),
                                    'points_earned', ucp.points_earned,
                                    'completed_at', ucp.completed_at,
                                    'is_lock', IF(ucp.is_lock, TRUE, FALSE),
                                    'started_at', ucp.started_at,
                                    'progress_percentage', ucp.progress_percentage,
                                    'is_active', IF(ucp.is_active, TRUE, FALSE),
                                    'created_at', ucp.created_at,
                                    'updated_at', ucp.updated_at,
                                    'ChallengePhase', JSON_OBJECT(
                                        'id', cp.id,
                                        'challenge_id', cp.challenge_id,
                                        'phase_number', cp.phase_number,
                                        'title', cp.title,
                                        'description', cp.description,
                                        'tasks_count', cp.tasks_count,
                                        'bonus_reward', cp.bonus_reward,
                                        'phase_type', cp.phase_type,
                                        'is_active', IF(cp.is_active, TRUE, FALSE),
                                        'created_at', cp.created_at,
                                        'updated_at', cp.updated_at
                                    ),
                                    'UserChallengeTasks', (
                                        SELECT JSON_ARRAYAGG(
                                            JSON_OBJECT(
                                                'id', uct.id,
                                                'user_challenge_phase_id', uct.user_challenge_phase_id,
                                                'challenge_task_id', uct.challenge_task_id,
                                                'is_completed', IF(uct.is_completed, TRUE, FALSE),
                                                'attempts', uct.attempts,
                                                'points_earned', uct.points_earned,
                                                'completed_at', uct.completed_at,
                                                'progress_percentage', uct.progress_percentage,
                                                'is_active', IF(uct.is_active, TRUE, FALSE),
                                                'created_at', uct.created_at,
                                                'updated_at', uct.updated_at,
                                                -- Enhanced task details
                                                'last_attempt_at', (
                                                    SELECT MAX(created_at) 
                                                    FROM tbl_challenge_response cqa 
                                                    WHERE cqa.user_challenge_task_id = uct.id
                                                ),
                                                'best_score', (
                                                    SELECT MAX(ROUND((total_correct / total_questions) * 100, 2))
                                                    FROM tbl_challenge_response cqa 
                                                    WHERE cqa.user_challenge_task_id = uct.id 
                                                    AND total_questions > 0
                                                ),
                                                'total_attempts_made', (
                                                    SELECT COUNT(*) 
                                                    FROM tbl_challenge_response cqa 
                                                    WHERE cqa.user_challenge_task_id = uct.id
                                                ),
                                                'average_time', (
                                                    SELECT ROUND(AVG(time_used_seconds), 2)
                                                    FROM tbl_challenge_response cqa 
                                                    WHERE cqa.user_challenge_task_id = uct.id
                                                ),
                                                'passed_attempts', (
                                                    SELECT COUNT(*) 
                                                    FROM tbl_challenge_response cqa 
                                                    WHERE cqa.user_challenge_task_id = uct.id 
                                                    AND is_passed = 1
                                                ),
                                                'total_questions_attempted', (
                                                    SELECT SUM(total_questions) 
                                                    FROM tbl_challenge_response cqa 
                                                    WHERE cqa.user_challenge_task_id = uct.id
                                                ),
                                                'total_correct_answers', (
                                                    SELECT SUM(total_correct) 
                                                    FROM tbl_challenge_response cqa 
                                                    WHERE cqa.user_challenge_task_id = uct.id
                                                ),
                                                'ChallengeTask', JSON_OBJECT(
                                                    'id', ct.id,
                                                    'challenge_phase_id', ct.challenge_phase_id,
                                                    'title', ct.title,
                                                    'description', ct.description,
                                                    'difficulty_level', ct.difficulty_level,
                                                    'order', ct.order,
                                                    'is_mandatory', IF(ct.is_mandatory, TRUE, FALSE),
                                                    'max_attempts', ct.max_attempts,
                                                    'reward_points', ct.reward_points,
                                                    'time_limit', ct.time_limit,
                                                    'show_answer', IF(ct.show_answer, TRUE, FALSE),
                                                    'is_active', IF(ct.is_active, TRUE, FALSE),
                                                    'created_at', ct.created_at,
                                                    'updated_at', ct.updated_at
                                                )
                                            )
                                        )
                                        FROM tbl_user_challenge_tasks uct
                                        JOIN tbl_challenge_tasks ct ON uct.challenge_task_id = ct.id
                                        WHERE uct.user_challenge_phase_id = ucp.id
                                        ORDER BY ct.order ASC
                                    )
                                )
                            )
                            FROM tbl_user_challenge_phases ucp
                            JOIN tbl_challenge_phases cp ON ucp.challenge_phase_id = cp.id
                            WHERE ucp.user_challenge_id = uc.id
                            ORDER BY cp.phase_number ASC
                        )
                    )
                )
                FROM tbl_user_challenge uc
                JOIN tbl_challenges c ON uc.challenge_id = c.id
                JOIN tbl_challenge_categories AS cc ON c.category_id = cc.id
                WHERE uc.user_id = p_user_id
                ORDER BY uc.assigned_at DESC
            ) AS data;
    END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS startUserChallengeTask;`);
        await sequelize.query(`CREATE PROCEDURE startUserChallengeTask(
IN p_user_challenge_phase_id INT,
IN p_challenge_task_id INT
)
BEGIN
DECLARE v_challenge_phase_id_1 INT;
DECLARE v_challenge_phase_id_2 INT; 
DECLARE v_user_challenge_task_exists INT DEFAULT 0;
DECLARE v_user_challenge_task_id INT;

-- Response variables
DECLARE v_success BOOLEAN DEFAULT FALSE;
DECLARE v_message VARCHAR(255);

-- Attempt Revive
DECLARE v_attempts INT;
DECLARE v_max_attempts INT;
DECLARE v_revive_minutes INT;
DECLARE v_revive_time DATETIME;
DECLARE v_challenge_task_id INT;
DECLARE v_error_message VARCHAR(255);

proc : BEGIN

-- Validate input parameters
IF p_user_challenge_phase_id IS NULL OR p_challenge_task_id IS NULL THEN
SELECT 
    FALSE AS success,
    'user_challenge_phase_id and challenge_task_id are required' AS message,
    NULL AS userChallengeTask;
LEAVE proc;
END IF;

-- Fetch challenge phase details
SELECT challenge_phase_id INTO v_challenge_phase_id_1
FROM tbl_user_challenge_phases
WHERE id = p_user_challenge_phase_id;

-- Fetch challenge task details
SELECT challenge_phase_id INTO v_challenge_phase_id_2
FROM tbl_challenge_tasks
WHERE id = p_challenge_task_id;

-- Validate existence
IF v_challenge_phase_id_1 IS NULL OR v_challenge_phase_id_2 IS NULL THEN
SELECT 
    FALSE AS success,
    'Challenge Phase and Task Required!!!' AS message,
    NULL AS userChallengeTask;
LEAVE proc;
END IF;

-- Check if task belongs to phase
IF v_challenge_phase_id_1 != v_challenge_phase_id_2 THEN
SELECT 
    FALSE AS success,
    'This Task is Not In Challenge Phase!!!' AS message,
    NULL AS userChallengeTask;
LEAVE proc;
END IF;

-- Check if user challenge task already exists
SELECT COUNT(*) INTO v_user_challenge_task_exists
FROM tbl_user_challenge_tasks
WHERE user_challenge_phase_id = p_user_challenge_phase_id
AND challenge_task_id = p_challenge_task_id;

IF v_user_challenge_task_exists > 0 THEN
    -- get the ID first
    SELECT id INTO v_user_challenge_task_id
    FROM tbl_user_challenge_tasks
    WHERE user_challenge_phase_id = p_user_challenge_phase_id
    AND challenge_task_id = p_challenge_task_id;

    -- Reactivate if needed
    UPDATE tbl_user_challenge_tasks
    SET is_active = true, updated_at = NOW()
    WHERE id = v_user_challenge_task_id;

    -- Get user task data
    SELECT attempts, revive_attempt_at, challenge_task_id
    INTO v_attempts, v_revive_time, v_challenge_task_id
    FROM tbl_user_challenge_tasks
    WHERE id = v_user_challenge_task_id;

    -- Get task settings
    SELECT max_attempts, revive_attempt_time
    INTO v_max_attempts, v_revive_minutes
    FROM tbl_challenge_tasks
    WHERE id = v_challenge_task_id;

    -- If attempts reached the limit
    IF v_attempts >= v_max_attempts THEN

        -- If no revive time set, assign it
        IF v_revive_time IS NULL THEN
            UPDATE tbl_user_challenge_tasks
            SET revive_attempt_at = DATE_ADD(NOW(), INTERVAL v_revive_minutes MINUTE)
            WHERE id = v_user_challenge_task_id;

            SET v_error_message = CONCAT('E404|MaxAttemptReached|You can retry after ', DATE_ADD(NOW(), INTERVAL v_revive_minutes MINUTE));

            IF v_error_message IS NULL OR v_error_message = '' THEN
                SET v_error_message = 'E404|MaxAttemptReached|Max Attempt Reached';
            END IF;

            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = v_error_message;

        ELSE
            -- If revive time has passed
            IF NOW() >= v_revive_time THEN
                UPDATE tbl_user_challenge_tasks
                SET attempts = 0, revive_attempt_at = NULL
                WHERE id = v_user_challenge_task_id;
            ELSE
                -- Still waiting, show revive time
                SET v_error_message = CONCAT('E404|MaxAttemptReached|You can retry after ', v_revive_time);
                
                IF v_error_message IS NULL OR v_error_message = '' THEN
                    SET v_error_message = 'E404|MaxAttemptReached|Max Attempt Reached';
                END IF;

                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = v_error_message;
            END IF;
        END IF;

    END IF;

ELSE
-- Create new entry
INSERT INTO tbl_user_challenge_tasks (
    user_challenge_phase_id,
    challenge_task_id,
    is_completed,
    attempts,
    points_earned,
    progress_percentage,
    is_active,
    created_at,
    updated_at
) VALUES (
    p_user_challenge_phase_id,
    p_challenge_task_id,
    false,
    0,
    0,
    0.0,
    true,
    NOW(),
    NOW()
);

SET v_user_challenge_task_id = LAST_INSERT_ID();
END IF;

-- get the basic user challenge task data
SELECT 
TRUE AS success,
'User Challenge Task recorded successfully' AS message,
(SELECT 
    JSON_OBJECT(
        'id', uct.id,
        'user_challenge_phase_id', uct.user_challenge_phase_id,
        'challenge_task_id', uct.challenge_task_id,
        'is_completed', uct.is_completed,
        'attempts', uct.attempts,
        'points_earned', uct.points_earned,
        'completed_at', uct.completed_at,
        'progress_percentage', uct.progress_percentage,
        'is_active', uct.is_active,
        'created_at', uct.created_at,
        'updated_at', uct.updated_at,
        'ChallengeTask', JSON_OBJECT(
            'id', ct.id,
            'challenge_phase_id', ct.challenge_phase_id,
            'title', ct.title,
            'description', ct.description,
            'difficulty_level', ct.difficulty_level,
            'order', ct.order,
            'is_mandatory', ct.is_mandatory,
            'show_answer', ct.show_answer,
            'is_warning', ct.is_warning,
            'no_of_warning', ct.no_of_warning,
            'max_attempts', ct.max_attempts,
            'reward_points', ct.reward_points,
            'time_limit', ct.time_limit,
            'is_active', ct.is_active,
            'created_at', ct.created_at,
            'updated_at', ct.updated_at,
            'TrueFalseChallenges', IFNULL(
                (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', tfc.id,
                        'question', tfc.question
                    )
                )
                FROM tbl_true_false_challenges tfc
                WHERE tfc.challenge_task_id = ct.id AND tfc.is_active = TRUE), 
                JSON_ARRAY()
            ),
            'FillInTheBlanksChallenges', IFNULL(
                (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', fibc.id,
                        'challenge_id', fibc.challenge_id,
                        'text', fibc.text,
                        'is_active', fibc.is_active
                    )
                )
                FROM tbl_fillintheblanks_challenges fibc
                WHERE fibc.challenge_task_id = ct.id AND fibc.is_active = TRUE),
                JSON_ARRAY()
            ),
            'MCQChallenges', IFNULL(
                (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', mcq.id,
                        'question_text', mcq.question_text,
                        'MCQOptionChallenges', IFNULL(
                            (SELECT JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'id', opt.id,
                                    'option_text', opt.option_text,
                                    'option_type', opt.option_type
                                )
                            )
                            FROM tbl_mcq_option_challenge opt
                            WHERE opt.mcq_id = mcq.id AND opt.is_active = TRUE),
                            JSON_ARRAY()
                        )
                    )
                )
                FROM tbl_mcq_challenge mcq
                WHERE mcq.challenge_task_id = ct.id AND mcq.is_active = TRUE),
                JSON_ARRAY()
            )
        )
    )
FROM 
    tbl_user_challenge_tasks uct
JOIN 
    tbl_challenge_tasks ct ON uct.challenge_task_id = ct.id
WHERE 
    uct.id = v_user_challenge_task_id AND ct.is_active = TRUE
) AS userChallengeTask;

END proc;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS checkDailyChallenge;`);
        await sequelize.query(`CREATE PROCEDURE checkDailyChallenge(
IN p_user_id INT,
IN p_challenge_id INT,
IN p_user_answers JSON
)
BEGIN
DECLARE v_attempts INT;
DECLARE v_max_attempts INT;
DECLARE v_is_completed BOOLEAN;
DECLARE v_correct_count INT DEFAULT 0;
DECLARE v_total_count INT;
DECLARE v_points_reward INT DEFAULT 0;
DECLARE v_user_points_reward INT DEFAULT 0;
DECLARE v_is_per_question_reward BOOLEAN;
DECLARE v_show_answer BOOLEAN;
DECLARE v_per_question_reward INT;
DECLARE v_qualify_percentage INT;
DECLARE v_results JSON DEFAULT JSON_ARRAY();
DECLARE v_current_streak INT;
DECLARE v_longest_streak INT;
DECLARE v_last_completed_date DATE;
DECLARE v_today DATE DEFAULT CURDATE();
DECLARE v_diff_days INT;
DECLARE v_user_challenge_id INT;
DECLARE v_processed_answers INT DEFAULT 0;
DECLARE v_challenge_title VARCHAR(255);
DECLARE v_previous_points_earned INT DEFAULT 0;

proc : BEGIN
-- Validate inputs
IF p_user_id IS NULL OR p_challenge_id IS NULL OR p_user_answers IS NULL THEN
SELECT FALSE as success, 'User ID, Challenge ID, and user answers are required.' as message;
LEAVE proc;
END IF;

-- Check if JSON array is valid
IF JSON_TYPE(p_user_answers) != 'ARRAY' THEN
SELECT FALSE as success, 'User answers must be a JSON array.' as message;
LEAVE proc;
END IF;

-- Find User Challenge
SELECT 
udc.id, udc.attempts, udc.is_completed, dc.max_attempt, dc.points_reward, 
dc.is_per_question_reward, dc.per_question_reward, dc.qualify_percentage, dc.show_answer, udc.points_earned
INTO 
v_user_challenge_id, v_attempts, v_is_completed, v_max_attempts, v_user_points_reward, 
v_is_per_question_reward, v_per_question_reward, v_qualify_percentage, v_show_answer, v_previous_points_earned
FROM tbl_user_daily_challenge udc
JOIN tbl_daily_challenges dc ON udc.challenge_id = dc.id
WHERE udc.user_id = p_user_id AND udc.challenge_id = p_challenge_id;

-- Check if challenge exists and is available
IF v_user_challenge_id IS NULL THEN
SELECT FALSE as success, 'User Challenge not found.' as message;
LEAVE proc ;
ELSEIF v_attempts >= v_max_attempts THEN
SELECT FALSE as success, CONCAT('Attempt limit reached (', v_attempts, '/', v_max_attempts, ').') as message;
LEAVE proc;
END IF;

-- Process each answer
SET v_total_count = (
SELECT COUNT(*) FROM 
(
    SELECT id FROM tbl_fillintheblanks_challenges WHERE challenge_id = p_challenge_id AND is_active = TRUE
    UNION ALL
    SELECT id FROM tbl_mcq_challenge WHERE challenge_id = p_challenge_id AND is_active = TRUE
    UNION ALL
    SELECT id FROM tbl_true_false_challenges WHERE challenge_id = p_challenge_id AND is_active = TRUE
) as total_questions
);

-- Process each answer in JSON array
BLOCK1: BEGIN
DECLARE i INT DEFAULT 0;
DECLARE v_question_id INT;
DECLARE v_user_answer VARCHAR(255);
DECLARE v_question_type VARCHAR(50);
DECLARE v_array_length INT;

SET v_array_length = JSON_LENGTH(p_user_answers);

WHILE i < v_array_length DO
    SET v_question_id = JSON_UNQUOTE(JSON_EXTRACT(p_user_answers, CONCAT('$[', i, '].question_id')));
    SET v_question_type = JSON_UNQUOTE(JSON_EXTRACT(p_user_answers, CONCAT('$[', i, '].question_type')));
    
    -- Handle different question types
    IF v_question_type = 'fill-in-the-blank' THEN
        SET v_user_answer = JSON_UNQUOTE(JSON_EXTRACT(p_user_answers, CONCAT('$[', i, '].userAnswer')));
        
        BLOCK2: BEGIN
            DECLARE v_correct_answers JSON;
            DECLARE v_is_correct BOOLEAN DEFAULT FALSE;
            DECLARE v_formatted_correct_answers TEXT;
            
            -- get correct answers
            SELECT answers INTO v_correct_answers 
            FROM tbl_fillintheblanks_challenges 
            WHERE id = v_question_id AND is_active = TRUE;
            
            -- Check if answer is correct
            SET v_formatted_correct_answers = '';
            SET v_is_correct = checkFillInTheBlankAnswer(v_user_answer, v_correct_answers);
            
            -- Format correct answers for display
            SET v_formatted_correct_answers = formatJsonArray(v_correct_answers);
            
            -- Add to results
            SET v_results = JSON_ARRAY_APPEND(v_results, '$', JSON_OBJECT(
                'question_id', v_question_id,
                'userAnswer', v_user_answer,
                'correctAnswer', IF(v_show_answer, v_formatted_correct_answers, NULL),
                'rewardPoints', IF(v_is_per_question_reward, v_per_question_reward, NULL),
                'isCorrect', v_is_correct
            ));
            
            IF v_is_correct THEN
                SET v_correct_count = v_correct_count + 1;
            END IF;
        END BLOCK2;
        
    ELSEIF v_question_type = 'mcq' THEN
        SET v_user_answer = JSON_UNQUOTE(JSON_EXTRACT(p_user_answers, CONCAT('$[', i, '].userAnswer')));
        
        BLOCK3: BEGIN
            DECLARE v_correct_option_id INT;
            DECLARE v_correct_option_text VARCHAR(255);
            DECLARE v_user_option_text VARCHAR(255);
            DECLARE v_is_correct BOOLEAN DEFAULT FALSE;
            
            -- get correct option
            SELECT mco.id, mco.option_text INTO v_correct_option_id, v_correct_option_text
            FROM tbl_mcq_challenge mcq
            JOIN tbl_mcq_option_challenge mco ON mcq.id = mco.mcq_id
            WHERE mcq.id = v_question_id AND mco.is_correct = TRUE;
            
            -- get user's selected option text
            SELECT option_text INTO v_user_option_text
            FROM tbl_mcq_option_challenge
            WHERE id = v_user_answer;
            
            -- Check if answer is correct
            IF v_user_answer = v_correct_option_id THEN
                SET v_is_correct = TRUE;
                SET v_correct_count = v_correct_count + 1;
            ELSE
                SET v_is_correct = FALSE;
            END IF;
            
            -- Add to results
            SET v_results = JSON_ARRAY_APPEND(v_results, '$', JSON_OBJECT(
                'question_id', v_question_id,
                'userAnswer', v_user_option_text,
                'correctAnswer', IF(v_show_answer, v_correct_option_text, NULL),
                'rewardPoints', IF(v_is_per_question_reward, v_per_question_reward, NULL),
                'isCorrect', v_is_correct
            ));
        END BLOCK3;
    ELSEIF v_question_type = 'true-false' THEN
        SET v_user_answer = JSON_UNQUOTE(JSON_EXTRACT(p_user_answers, CONCAT('$[', i, '].userAnswer')));
        
        BLOCK4: BEGIN
            DECLARE v_correct_answer BOOLEAN;
            DECLARE v_is_correct BOOLEAN DEFAULT FALSE;
            
            -- get correct option
            SELECT tf.answer INTO v_correct_answer
            FROM tbl_true_false_challenges tf
            WHERE tf.id = v_question_id;
            
            -- Check if answer is correct
            IF v_user_answer = v_correct_answer THEN
                SET v_is_correct = TRUE;
                SET v_correct_count = v_correct_count + 1;
            ELSE
                SET v_is_correct = FALSE;
            END IF;
            
            -- Add to results
            SET v_results = JSON_ARRAY_APPEND(v_results, '$', JSON_OBJECT(
                'question_id', v_question_id,
                'userAnswer', v_user_answer,
                'correctAnswer', IF(v_show_answer, v_correct_answer, NULL),
                'rewardPoints', IF(v_is_per_question_reward, v_per_question_reward, NULL),
                'isCorrect', v_is_correct
            ));
        END BLOCK4;
    END IF;
    
    SET i = i + 1;
    SET v_processed_answers = v_processed_answers + 1;
END WHILE;
END BLOCK1;

-- Update attempt count
UPDATE tbl_user_daily_challenge 
SET attempts = attempts + 1
WHERE id = v_user_challenge_id;

-- Check if user qualifies for completion
IF v_correct_count >= (v_total_count * v_qualify_percentage / 100) THEN
    SET v_points_reward = v_points_reward + v_user_points_reward;

-- Calculate points
IF v_is_per_question_reward THEN
    SET v_points_reward = v_per_question_reward * v_correct_count;
END IF;

SELECT dc.title
INTO v_challenge_title
FROM tbl_user_daily_challenge udc
JOIN tbl_daily_challenges dc ON udc.challenge_id = dc.id
WHERE udc.id = v_user_challenge_id;

IF v_previous_points_earned < v_points_reward THEN
    CALL UpdateUserPointsById(
        p_user_id,
        v_points_reward - v_previous_points_earned,
        TRUE,
        'daily_challenge_completion',
        CONCAT('Completing daily challenge ', v_challenge_title)
    );
END IF;

-- Update streak
SELECT current_streak, longest_streak, last_completed_date
INTO v_current_streak, v_longest_streak, v_last_completed_date
FROM tbl_user_streaks
WHERE user_id = p_user_id;

IF v_last_completed_date IS NULL THEN
    -- First time completing a challenge
    UPDATE tbl_user_streaks SET 
            current_streak = 1,
            longest_streak = 1,
            last_completed_date = v_today,
            missed_days=0
        WHERE user_id = p_user_id;
ELSE
    -- Calculate days difference
    SET v_diff_days = DATEDIFF(v_today, v_last_completed_date);
    
    IF v_diff_days = 1 THEN
        -- Consecutive day
        UPDATE tbl_user_streaks
        SET 
            current_streak = current_streak + 1,
            longest_streak = GREATEST(longest_streak, current_streak + 1),
            last_completed_date = v_today
        WHERE user_id = p_user_id;
    ELSEIF v_diff_days > 1 THEN
        -- Streak broken
        UPDATE tbl_user_streaks
        SET 
            current_streak = 1,
            missed_days = missed_days + 1,
            last_completed_date = v_today
        WHERE user_id = p_user_id;
    ELSE
        -- Same day, no streak update needed
        UPDATE tbl_user_streaks
        SET last_completed_date = v_today
        WHERE user_id = p_user_id;
    END IF;
END IF;

-- Mark challenge as completed
UPDATE tbl_user_daily_challenge
SET 
    is_completed = TRUE,
    points_earned = GREATEST(v_points_reward, v_previous_points_earned),
    completed_at = NOW()
WHERE id = v_user_challenge_id;
END IF;

-- Return results
SELECT 
TRUE as success,
'Challenge checked successfully.' as message,
v_results as results,
v_correct_count as correct_count,
v_total_count as total_count,
CONCAT(v_correct_count, '/', v_total_count) as score,
v_points_reward as totalRewardPoints;
END proc;
END`);

        await sequelize.query('DROP FUNCTION IF EXISTS checkFillInTheBlankAnswer');
        await sequelize.query(`CREATE FUNCTION checkFillInTheBlankAnswer(
user_answer VARCHAR(255),
correct_answers JSON
) RETURNS BOOLEAN
DETERMINISTIC
BEGIN
DECLARE i INT DEFAULT 0;
DECLARE array_length INT;
DECLARE current_answer VARCHAR(255);

SET array_length = JSON_LENGTH(correct_answers);

-- Convert user answer to lowercase for case-insensitive comparison
SET user_answer = LOWER(TRIM(user_answer));

WHILE i < array_length DO
SET current_answer = LOWER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(correct_answers, CONCAT('$[', i, ']')))));
IF user_answer = current_answer THEN
    RETURN TRUE;
END IF;
SET i = i + 1;
END WHILE;

RETURN FALSE;
END`);

        await sequelize.query('DROP FUNCTION IF EXISTS formatJsonArray');
        await sequelize.query(`CREATE FUNCTION formatJsonArray(json_array JSON) RETURNS TEXT
DETERMINISTIC
BEGIN
DECLARE result TEXT DEFAULT '';
DECLARE i INT DEFAULT 0;
DECLARE array_length INT;

SET array_length = JSON_LENGTH(json_array);

WHILE i < array_length DO
IF i > 0 THEN
    SET result = CONCAT(result, ', ');
END IF;
SET result = CONCAT(result, JSON_UNQUOTE(JSON_EXTRACT(json_array, CONCAT('$[', i, ']'))));
SET i = i + 1;
END WHILE;

RETURN result;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS completeUserChallengeTaskById;`)
        await sequelize.query(`CREATE PROCEDURE completeUserChallengeTaskById(IN p_task_id INT)
BEGIN
    DECLARE v_user_challenge_phase_id INT;
    DECLARE v_user_challenge_id INT;
    DECLARE v_user_id INT;
    DECLARE v_all_phases_completed BOOLEAN;
    DECLARE v_total_tasks INT;
    DECLARE v_completed_tasks INT;
    DECLARE v_total_points_earned INT;
    DECLARE v_points_earned INT DEFAULT 0;
    DECLARE v_title INT;
    DECLARE v_challenge_title VARCHAR(255);
    DECLARE v_challenge_already_completed BOOLEAN;
    DECLARE v_task_already_completed BOOLEAN;

    DECLARE done INT DEFAULT 0;
    DECLARE v_challenge_id INT;

    DECLARE v_phase_id INT;
    DECLARE v_phase_title VARCHAR(255);
    DECLARE v_phase_points INT DEFAULT 0;

    DECLARE v_task_id INT;
    DECLARE v_task_title VARCHAR(255);
    DECLARE v_task_points INT DEFAULT 0;

    DECLARE phase_cursor CURSOR FOR
    SELECT cp.id, cp.title, COALESCE(cp.bonus_reward, 0)
    FROM tbl_user_challenge_phases ucp
    JOIN tbl_challenge_phases cp ON cp.id = ucp.challenge_phase_id
    WHERE cp.challenge_id = v_challenge_id AND ucp.is_completed = TRUE AND ucp.user_challenge_id = v_user_challenge_id
    ORDER BY phase_number;

    DECLARE task_cursor CURSOR FOR
    SELECT ct.id, ct.title, COALESCE(ct.reward_points, 0)
    FROM tbl_user_challenge_phases ucp 
    JOIN tbl_user_challenge_tasks uct ON uct.user_challenge_phase_id = ucp.id
    JOIN tbl_challenge_tasks ct ON uct.challenge_task_id = ct.id
    WHERE ucp.user_challenge_id = v_user_challenge_id AND uct.is_completed = TRUE AND ct.challenge_phase_id = v_phase_id;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

-- Start transaction for consistency
START TRANSACTION;

SELECT is_completed 
INTO v_task_already_completed 
from tbl_user_challenge_tasks where id = p_task_id;

-- Step 1: Update the task
UPDATE tbl_user_challenge_tasks 
SET is_completed = TRUE, 
progress_percentage = 100, 
completed_at = NOW()
WHERE id = p_task_id;

-- Step 2: Select values into variables
SELECT user_challenge_phase_id
INTO v_user_challenge_phase_id
FROM tbl_user_challenge_tasks
WHERE id = p_task_id;

-- get the phase info
SELECT user_challenge_id INTO v_user_challenge_id
FROM tbl_user_challenge_phases
WHERE id = v_user_challenge_phase_id;

-- Recalculate phase points and progress
SELECT 
COUNT(*) as total_tasks,
COUNT(CASE WHEN is_completed = TRUE THEN 1 END) as completed_tasks,
SUM(COALESCE(points_earned, 0)) as total_points
INTO v_total_tasks, v_completed_tasks, v_total_points_earned
FROM tbl_user_challenge_tasks
WHERE user_challenge_phase_id = v_user_challenge_phase_id;

-- Update phase progress
UPDATE tbl_user_challenge_phases
SET completed_tasks = v_completed_tasks,
points_earned = v_total_points_earned,
progress_percentage = IF(v_total_tasks > 0, (v_completed_tasks * 100) / v_total_tasks, 0)
WHERE id = v_user_challenge_phase_id;

-- Check if all mandatory tasks are completed
IF NOT EXISTS (
SELECT 1
FROM tbl_user_challenge_tasks uct
JOIN tbl_challenge_tasks ct ON uct.challenge_task_id = ct.id
WHERE uct.user_challenge_phase_id = v_user_challenge_phase_id
AND ct.is_mandatory = TRUE
AND ct.is_active = TRUE
AND uct.is_completed = FALSE
) THEN
    -- Add bonus reward to v_total_points_earned when all mandatory tasks are completed
    SELECT v_total_points_earned + IFNULL(cp.bonus_reward, 0)
    INTO v_total_points_earned
    FROM tbl_user_challenge_phases ucp
    JOIN tbl_challenge_phases cp ON ucp.challenge_phase_id = cp.id
    WHERE ucp.id = v_user_challenge_phase_id;

    -- All mandatory tasks are completed, mark phase as complete
    UPDATE tbl_user_challenge_phases
    SET is_completed = TRUE,
        completed_at = NOW(),
        points_earned = v_total_points_earned,
        progress_percentage = 100
    WHERE id = v_user_challenge_phase_id;
END IF;

-- Update UserChallenge progress
SELECT 
COUNT(*) as total_tasks,
COUNT(CASE WHEN uct.is_completed = TRUE THEN 1 END) as completed_tasks,
SUM(COALESCE(uct.points_earned, 0)) as total_points,
uc.user_id
INTO v_total_tasks, v_completed_tasks, v_total_points_earned, v_user_id
FROM tbl_user_challenge_phases ucp
JOIN tbl_user_challenge_tasks uct ON ucp.id = uct.user_challenge_phase_id
JOIN tbl_user_challenge uc ON ucp.user_challenge_id = uc.id
WHERE ucp.user_challenge_id = v_user_challenge_id
GROUP BY uc.user_id;

    -- Add bonus_reward to v_total_points_earned when the phase is completed
    SELECT v_total_points_earned + IFNULL(SUM(cp.bonus_reward), 0)
    INTO v_total_points_earned
    FROM tbl_user_challenge_phases ucp
    JOIN tbl_challenge_phases cp ON ucp.challenge_phase_id = cp.id
    WHERE ucp.user_challenge_id = v_user_challenge_id
    AND ucp.is_completed = TRUE;

-- Check if all phases are completed
SELECT 
NOT EXISTS (
    SELECT 1 
    FROM tbl_user_challenge_phases 
    WHERE user_challenge_id = v_user_challenge_id 
    AND is_completed = FALSE
) 
INTO v_all_phases_completed;

SELECT is_completed 
INTO v_challenge_already_completed 
from tbl_user_challenge where id = v_user_challenge_id;

IF NOT v_challenge_already_completed THEN

    IF v_all_phases_completed THEN
        SELECT v_total_points_earned + IFNULL(c.reward_points, 0)
        INTO v_total_points_earned
        FROM tbl_user_challenge uc
        JOIN tbl_challenges c ON uc.challenge_id = c.id
        WHERE uc.id = v_user_challenge_id;
    END IF;

    -- Update UserChallenge
    UPDATE tbl_user_challenge
    SET points_earned = v_total_points_earned,
    progress_percentage = IF(v_total_tasks > 0, (v_completed_tasks * 100) / v_total_tasks, 0),
    is_completed = v_all_phases_completed,
    completed_at = IF(v_all_phases_completed, NOW(), completed_at),
    status = IF(v_all_phases_completed, 'completed', status)
    WHERE id = v_user_challenge_id;

    -- Update user points if challenge completed
    IF v_all_phases_completed THEN
        
        SELECT c.id, c.title, c.reward_points
        INTO v_challenge_id, v_challenge_title, v_points_earned
        FROM tbl_user_challenge uc
        JOIN tbl_challenges c ON uc.challenge_id = c.id
        WHERE uc.id = v_user_challenge_id;

        SET done = 0;
        OPEN phase_cursor;

        phase_loop: LOOP
            FETCH phase_cursor INTO v_phase_id, v_phase_title, v_phase_points;

            IF done = 1 THEN
                LEAVE phase_loop;
            END IF;

            -- reset task handler flag for each phase
            SET done = 0;

            OPEN task_cursor;

            task_loop: LOOP
                FETCH task_cursor 
                INTO v_task_id, v_task_title, v_task_points;

                IF done = 1 THEN
                    LEAVE task_loop;
                END IF;

                IF v_task_points > 0 THEN
                    -- Assign task points
                    CALL UpdateUserPointsById(
                        v_user_id,
                        v_task_points,
                        TRUE,
                        'challenge_task_reward',
                        CONCAT('Phase: ', v_phase_title,' | Task: ', v_task_title)
                    );
                END IF;

            END LOOP;

            CLOSE task_cursor;

            SET done = 0;

            IF v_phase_points > 0 THEN
                -- Assign phase points
                CALL UpdateUserPointsById(
                    v_user_id,
                    v_phase_points,
                    TRUE,
                    'challenge_phase_reward',
                    CONCAT('Phase reward: ', v_phase_title)
                );
            END IF;

        END LOOP;

        CLOSE phase_cursor;

        IF v_points_earned > 0 THEN
            -- Assign Challenge Quest points
            CALL UpdateUserPointsById(
                v_user_id,
                v_points_earned,
                TRUE,
                'challenge_quest_completion',
                CONCAT('Completing challenge ', v_challenge_title)
            );
        END IF;
    END IF;
ELSE
    IF NOT v_task_already_completed THEN
        SELECT ct.title, COALESCE(ct.reward_points, 0)
        INTO v_task_title, v_task_points
        FROM tbl_user_challenge_tasks uct
        JOIN tbl_challenge_tasks ct ON uct.challenge_task_id = ct.id
        WHERE uct.id = p_task_id AND uct.is_completed = TRUE;
    
        IF v_task_points > 0 THEN
            -- Assign task points
            CALL UpdateUserPointsById(
                v_user_id,
                v_task_points,
                TRUE,
                'challenge_task_reward',
                CONCAT('Task: ', v_task_title)
            );
        END IF;
    END IF;
END IF;

-- Unlock next phase if applicable
WITH phase_order AS (
SELECT 
    ucp.id, 
    ucp.is_lock,
    cp.phase_number,
    ROW_NUMBER() OVER (ORDER BY cp.phase_number) as row_num
FROM tbl_user_challenge_phases ucp
JOIN tbl_challenge_phases cp ON ucp.challenge_phase_id = cp.id
WHERE ucp.user_challenge_id = v_user_challenge_id
ORDER BY cp.phase_number
)
UPDATE tbl_user_challenge_phases ucp
JOIN phase_order curr ON curr.id = v_user_challenge_phase_id
JOIN phase_order next ON next.row_num = curr.row_num + 1
SET ucp.is_lock = FALSE
WHERE ucp.id = next.id AND next.is_lock = TRUE;

COMMIT;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS checkUserChallengeTaskAnswers;`)
        await sequelize.query(`CREATE PROCEDURE checkUserChallengeTaskAnswers(
IN p_user_challenge_task_id INT,
IN p_answers JSON
)
BEGIN
DECLARE v_user_challenge_phase_id INT;
DECLARE v_total_correct INT DEFAULT 0;
DECLARE v_total_reward_points INT DEFAULT 0;
DECLARE v_qualify_percentage INT DEFAULT 0;
DECLARE v_total_questions INT;
DECLARE v_total_task_questions INT;
DECLARE v_show_answer BOOLEAN;
DECLARE v_response_details JSON DEFAULT JSON_ARRAY();
DECLARE v_is_passing BOOLEAN;
DECLARE v_is_mandatory BOOLEAN;
DECLARE v_attempts INT;
DECLARE v_allowed_attempts INT;
DECLARE v_revive_minutes INT;
DECLARE v_current_revive_time DATETIME;
DECLARE v_challenge_task_id INT;

DECLARE v_question_id INT;
DECLARE v_user_answer VARCHAR(255);
DECLARE v_question_type VARCHAR(50);
DECLARE v_is_correct BOOLEAN;
DECLARE v_correct_answer JSON;
DECLARE v_user_answered VARCHAR(255);
DECLARE v_i INT DEFAULT 0;
DECLARE challenge_assigned INT DEFAULT 0;

START TRANSACTION;

    SELECT COUNT(*) INTO challenge_assigned
    FROM tbl_user_challenge_tasks
    WHERE id = p_user_challenge_task_id;

    IF challenge_assigned = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|User Challenge Task not found.';
    END IF;

    -- get the current user challenge task
    SELECT user_challenge_phase_id, attempts, challenge_task_id, revive_attempt_at INTO v_user_challenge_phase_id, v_attempts, v_challenge_task_id, v_current_revive_time
    FROM tbl_user_challenge_tasks
    WHERE id = p_user_challenge_task_id;

    SELECT reward_points, qualify_percentage, max_attempts, revive_attempt_time, is_mandatory INTO v_total_reward_points, v_qualify_percentage, v_allowed_attempts, v_revive_minutes, v_is_mandatory
    FROM tbl_challenge_tasks
    WHERE id = v_challenge_task_id;

    IF v_attempts >= v_allowed_attempts THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|MaxAttemptReached|Max Attempt Reached.';
    END IF;

    IF v_attempts + 1 = v_allowed_attempts AND v_current_revive_time IS NULL THEN
        -- If no revive time already set, assign one
        UPDATE tbl_user_challenge_tasks
        SET revive_attempt_at = DATE_ADD(NOW(), INTERVAL v_revive_minutes MINUTE)
        WHERE id = p_user_challenge_task_id;
    END IF;

    -- Increment attempts
    UPDATE tbl_user_challenge_tasks
    SET attempts = COALESCE(attempts, 0) + 1
    WHERE id = p_user_challenge_task_id;

-- Process each answer
SET v_total_task_questions = (
SELECT COUNT(*) FROM 
(
    SELECT id FROM tbl_fillintheblanks_challenges WHERE challenge_task_id = v_challenge_task_id AND is_active = TRUE
    UNION ALL
    SELECT id FROM tbl_mcq_challenge WHERE challenge_task_id = v_challenge_task_id AND is_active = TRUE
    UNION ALL
    SELECT id FROM tbl_true_false_challenges WHERE challenge_task_id = v_challenge_task_id AND is_active = TRUE
) as total_questions
);

SELECT show_answer INTO v_show_answer
    FROM tbl_challenge_tasks
    WHERE id = v_challenge_task_id;

-- get total questions
SET v_total_questions = JSON_LENGTH(p_answers);

-- Process each answer
read_loop: WHILE v_i < v_total_questions DO
-- Extract values from the current answer
SET v_question_id = JSON_UNQUOTE(JSON_EXTRACT(p_answers, CONCAT('$[', v_i, '].question_id')));
SET v_user_answer = JSON_UNQUOTE(JSON_EXTRACT(p_answers, CONCAT('$[', v_i, '].userAnswer')));
SET v_question_type = JSON_UNQUOTE(JSON_EXTRACT(p_answers, CONCAT('$[', v_i, '].question_type')));

-- Initialize values
SET v_is_correct = FALSE;
SET v_correct_answer = NULL;
SET v_user_answered = NULL;

-- Handle true-false questions
IF v_question_type = 'true-false' THEN
    SELECT answer INTO @tf_answer
    FROM tbl_true_false_challenges
    WHERE id = v_question_id;
    
    IF @tf_answer IS NOT NULL THEN
        SET v_is_correct = (
            (LOWER(v_user_answer) = 'true' AND @tf_answer = 1) OR
            (LOWER(v_user_answer) = 'false' AND @tf_answer = 0)
        );
        SET v_correct_answer = CAST(@tf_answer AS JSON);
        SET v_user_answered = v_user_answer;
    ELSE
        -- Add not found response
        SELECT JSON_ARRAY_APPEND(
            v_response_details, 
            '$', 
            JSON_OBJECT(
                'question_id', v_question_id,
                'status', 'not_found',
                'message', 'Question not found'
            )
        ) INTO v_response_details;
        SET v_i = v_i + 1;
        ITERATE read_loop;
    END IF;
    
-- Handle fill-in-the-blank questions
ELSEIF v_question_type = 'fill-in-the-blank' THEN
    SELECT answers INTO @fitb_answers
    FROM tbl_fillintheblanks_challenges
    WHERE id = v_question_id;

    IF @fitb_answers IS NOT NULL THEN
        -- Check if user answer matches any acceptable answer
        SET v_is_correct = JSON_SEARCH(
            jsonArrayLower(@fitb_answers),
            'one',
            LOWER(TRIM(v_user_answer))
        ) IS NOT NULL;

        SET v_correct_answer = @fitb_answers;
        SET v_user_answered = v_user_answer;
    ELSE
        -- Add not found response
        SELECT JSON_ARRAY_APPEND(
            v_response_details, 
            '$', 
            JSON_OBJECT(
                'question_id', v_question_id,
                'status', 'not_found', 
                'message', 'Question not found'
            )
        ) INTO v_response_details;
        SET v_i = v_i + 1;
        ITERATE read_loop;
    END IF;
    
-- Handle MCQ questions
ELSEIF v_question_type = 'mcq' THEN
    -- get correct option and user selected option
    SELECT 
        mo.option_text AS user_option,
        (SELECT mo2.option_text FROM tbl_mcq_option_challenge mo2 
         WHERE mo2.mcq_id = v_question_id AND mo2.is_correct = TRUE) AS correct_option,
        mo.is_correct
    INTO @user_option, @correct_option, @is_correct
    FROM tbl_mcq_option_challenge mo
    WHERE mo.id = v_user_answer AND mo.mcq_id = v_question_id;
    
    IF @user_option IS NOT NULL THEN
        SET v_is_correct = @is_correct;
        SET v_correct_answer = JSON_QUOTE(@correct_option);
        SET v_user_answered = @user_option;
    ELSE
        -- Add not found response
        SELECT JSON_ARRAY_APPEND(
            v_response_details, 
            '$', 
            JSON_OBJECT(
                'question_id', v_question_id,
                'status', 'not_found', 
                'message', 'Question not found'
            )
        ) INTO v_response_details;
        SET v_i = v_i + 1;
        ITERATE read_loop;
    END IF;
    
ELSE
    -- Add invalid type response
    SELECT JSON_ARRAY_APPEND(
        v_response_details, 
        '$', 
        JSON_OBJECT(
            'question_id', v_question_id,
            'status', 'invalid', 
            'message', 'Unsupported question type'
        )
    ) INTO v_response_details;
    SET v_i = v_i + 1;
    ITERATE read_loop;
END IF;

-- Update totals
IF v_is_correct THEN
    SET v_total_correct = v_total_correct + 1;
END IF;

-- Add response details
SELECT JSON_ARRAY_APPEND(
    v_response_details, 
    '$', 
    JSON_OBJECT(
        'question_id', v_question_id,
        'question_type', v_question_type,
        'isCorrect', v_is_correct,
        'userAnswer', v_user_answered,
        'correctAnswer', IF(v_show_answer, v_correct_answer, NULL)
    )
) INTO v_response_details;

SET v_i = v_i + 1;
END WHILE;

SET v_is_passing = (v_total_correct >= (v_total_task_questions * (v_qualify_percentage / 100)));

-- If passed, complete the task
IF v_is_passing THEN

    -- Update user challenge task with earned points
    UPDATE tbl_user_challenge_tasks
    SET points_earned = v_total_reward_points
    WHERE id = p_user_challenge_task_id;

    CALL completeUserChallengeTaskById(p_user_challenge_task_id);
ELSEIF NOT v_is_mandatory THEN
    CALL completeUserChallengeTaskById(p_user_challenge_task_id);
END IF;

-- Create result JSON
SELECT JSON_OBJECT(
'message', 'Answers checked successfully',
'totalCorrect', v_total_correct,
'totalQuestions', v_total_task_questions,
'totalRewardPoints', IF(v_is_passing, v_total_reward_points, 0),
'details', v_response_details,
'passed', v_is_passing
) AS result;

COMMIT;
END`);

        await sequelize.query('DROP FUNCTION IF EXISTS jsonArrayLower');
        await sequelize.query(`CREATE FUNCTION jsonArrayLower(json_array JSON) 
RETURNS JSON
DETERMINISTIC
BEGIN
DECLARE i INT DEFAULT 0;
DECLARE size INT DEFAULT JSON_LENGTH(json_array);
DECLARE result JSON DEFAULT JSON_ARRAY();

WHILE i < size DO
SELECT JSON_ARRAY_APPEND(
    result, 
    '$', 
    LOWER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(json_array, CONCAT('$[', i, ']')))))
) INTO result;
SET i = i + 1;
END WHILE;

RETURN result;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS createQuizAttempt;`)
        await sequelize.query(`CREATE PROCEDURE createQuizAttempt(
            IN p_user_challenge_id INT,
            IN p_user_challenge_task_id INT,
            IN p_attempt_number INT,
            IN p_total_questions INT,
            IN p_total_correct INT,
            IN p_total_reward_points INT,
            IN p_time_used_seconds INT,
            IN p_is_passed BOOLEAN,
            IN p_results_details JSON
        )
        BEGIN

        DECLARE v_existing INT DEFAULT 0;
        DECLARE v_task_existing INT DEFAULT 0;

        IF p_user_challenge_id IS NOT NULL THEN 
        -- Check if the user daily challenge exists
        SELECT COUNT(*) INTO v_existing
        FROM tbl_user_daily_challenge
        WHERE id = p_user_challenge_id;

        -- If not found, throw error
        IF v_existing = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E404|UserDailyChallengeNotFound|The user_challenge_id does not exist.',
                MYSQL_ERRNO = 1452; -- Foreign key constraint violation-like error
        END IF;
        
        ELSE
        -- Check if the user challenge task exists
        SELECT COUNT(*) INTO v_task_existing
        FROM tbl_user_challenge_tasks
        WHERE id = p_user_challenge_task_id;

        -- If not found, throw error
        IF v_task_existing = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E404|UserTaskChallengeNotFound|The user_challenge_task_id does not exist.',
                MYSQL_ERRNO = 1452; -- Foreign key constraint violation-like error
        END IF;
        END IF;

    INSERT INTO tbl_challenge_response(
            user_challenge_id,
            user_challenge_task_id,
            attempt_number,
            total_questions,
            total_correct,
            total_reward_points,
            time_used_seconds,
            is_passed,
            results_details,
            created_at,
            updated_at
        ) VALUES(
            p_user_challenge_id,
            p_user_challenge_task_id,
            p_attempt_number,
            p_total_questions,
            p_total_correct,
            p_total_reward_points,
            p_time_used_seconds,
            p_is_passed,
            p_results_details,
            NOW(),
            NOW()
        );
    SELECT LAST_INSERT_ID() AS new_quiz_attempt_id;
        END;`)

        await sequelize.query('DROP PROCEDURE IF EXISTS getQuizAttemptsByDailyChallengeId;')
        await sequelize.query(`CREATE PROCEDURE getQuizAttemptsByDailyChallengeId(
            IN p_user_challenge_id INT
        )
        BEGIN
        SELECT
        id,
            user_challenge_id,
            attempt_number,
            total_questions,
            total_correct,
            total_reward_points,
            time_used_seconds,
            is_passed,
            results_details,
            created_at,
            updated_at
    FROM tbl_challenge_response
    WHERE user_challenge_id = p_user_challenge_id
    ORDER BY attempt_number DESC;
        END;`)

        await sequelize.query('DROP PROCEDURE IF EXISTS getQuizAttemptsByChallengeTaskId;')
        await sequelize.query(`CREATE PROCEDURE getQuizAttemptsByChallengeTaskId(
    IN p_user_challenge_task_id INT
)
BEGIN
    SELECT
        id,
        user_challenge_task_id,
        attempt_number,
        total_questions,
        total_correct,
        total_reward_points,
        time_used_seconds,
        is_passed,
        results_details,
        created_at,
        updated_at
    FROM tbl_challenge_response
    WHERE user_challenge_task_id = p_user_challenge_task_id
    ORDER BY attempt_number DESC;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getChallengeRecommendations(IN user_id INT)
BEGIN
    DECLARE course_count INT;
    DECLARE category_count INT;
    
    -- Step 1: Check for user enrollments
    SELECT COUNT(*) INTO course_count
    FROM tbl_enrollments e
    WHERE e.user_id = user_id;
    
    IF course_count = 0 THEN
        SELECT JSON_ARRAY() AS recommendations;
    ELSE
        -- Step 2 & 3: Get distinct category names from enrolled courses
        CREATE TEMPORARY TABLE IF NOT EXISTS temp_categories (
            category VARCHAR(255)
        );
        
        INSERT INTO temp_categories
        SELECT DISTINCT cc.category
        FROM tbl_enrollments e
        INNER JOIN tbl_courses c ON e.course_id = c.id
        INNER JOIN tbl_course_categories cc ON c.category_id = cc.id
        WHERE e.user_id = user_id;
        
        -- Check if any categories were found
        SELECT COUNT(*) INTO category_count
        FROM temp_categories;
        
        IF category_count = 0 THEN
            DROP TEMPORARY TABLE IF EXISTS temp_categories;
            SELECT JSON_ARRAY() AS recommendations;
        ELSE
            -- Step 4 & 5: Get challenges from matching categories
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', ch.id,
                    'title', ch.title,
                    'description', ch.description,
                    'difficulty_level', ch.difficulty_level,
                    'category_id', ch.category_id,
                    'reward_points', ch.reward_points,
                    'startDate', ch.startDate,
                    'endDate', ch.endDate,
                    'rules', ch.rules,
                    'is_active', ch.is_active,
                    'created_at', ch.created_at,
                    'updated_at', ch.updated_at
                )
            ) AS recommendations
            FROM tbl_challenges ch
            INNER JOIN tbl_challenge_categories cc ON ch.category_id = cc.id
            WHERE cc.category IN (SELECT category FROM temp_categories)
            AND ch.is_active = TRUE
            ORDER BY ch.title ASC;
            
            DROP TEMPORARY TABLE IF EXISTS temp_categories;
        END IF;
    END IF;
END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getChallengeQuestLeaderboard`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getChallengeQuestLeaderboard(
    IN p_difficulty_level VARCHAR(20),
    IN p_category_id INT,
    IN p_timeinterval VARCHAR(20)
)
BEGIN

    DECLARE v_start_date DATE;

    -- Determine start date based on time interval
    IF p_timeinterval = 'today' THEN
        SET v_start_date = CURDATE();
    ELSEIF p_timeinterval = 'week' THEN
        SET v_start_date = DATE_SUB(CURDATE(), INTERVAL 7 DAY);
    ELSEIF p_timeinterval = 'month' THEN
        SET v_start_date = DATE_SUB(CURDATE(), INTERVAL 1 MONTH);
    ELSE
        SET v_start_date = '1970-01-01';
    END IF;

    SELECT 
        u.id AS user_id,
        u.full_name,
        SUM(uc.points_earned) AS total_points,
        RANK() OVER (ORDER BY SUM(uc.points_earned) DESC) AS user_rank
    FROM tbl_user_challenge uc
    INNER JOIN tbl_users u 
        ON u.id = uc.user_id
    INNER JOIN tbl_challenges c 
        ON c.id = uc.challenge_id
    WHERE

        -- Difficulty Filter
        (p_difficulty_level = 'all' OR c.difficulty_level = p_difficulty_level)

        -- Category Filter
        AND (p_category_id IS NULL OR c.category_id = p_category_id)

        -- Time Filter
        AND DATE(uc.assigned_at) >= v_start_date

    GROUP BY u.id, u.full_name
    ORDER BY total_points DESC;

END;`);

        console.log("✅ Challenge procedures created!");
    } catch (error) {
        console.error("❌ Error setting up challenge procedures:", error);
        throw error;
    }
};

module.exports = setupChallengeProcedures;
