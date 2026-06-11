
const sequelize = require("../../../config/db");

const setupChallengeTaskProcedures = async () => {
    try {
        console.log("🔄 Setting up challenge task procedures...");

        // Procedure: createCourseCategory
        await sequelize.query(`DROP PROCEDURE IF EXISTS createChallengeTask;`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createChallengeTask(
                IN p_challenge_phase_id INT,
                IN p_title VARCHAR(255),
                IN p_description TEXT,
                IN p_difficulty_level ENUM('Easy', 'Moderate', 'Hard'),
                IN p_qualify_percentage INT,
                IN p_revive_attempt_time INT,
                IN p_is_mandatory BOOLEAN,
                IN p_show_answer BOOLEAN,
                IN p_is_warning BOOLEAN, 
                IN p_no_of_warning INT,
                IN p_max_attempts INT,
                IN p_reward_points INT,
                IN p_time_limit INT
            )
            BEGIN
            DECLARE phase_exists INT;
            DECLARE duplicate_exists INT;
            DECLARE v_order INT DEFAULT 0;

            -- Check if challenge phase exists
            SELECT COUNT(*) INTO phase_exists 
            FROM tbl_challenge_phases 
            WHERE id = p_challenge_phase_id;
    
    IF phase_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Challenge phase not found.';
    ELSE
        -- Check for duplicacy (same challenge_phase_id, title and difficulty_level)
        SELECT COUNT(*) INTO duplicate_exists 
        FROM tbl_challenge_tasks 
        WHERE challenge_phase_id = p_challenge_phase_id 
        AND title = p_title 
        AND difficulty_level = p_difficulty_level;
        
        -- Count Order
        SELECT IFNULL(MAX(\`order\`), 0) + 1 INTO v_order 
        FROM tbl_challenge_tasks 
        WHERE challenge_phase_id = p_challenge_phase_id;

        IF duplicate_exists > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Duplicate challenge task found with the same phase, title, task type, and difficulty level.';
        ELSE
                INSERT INTO tbl_challenge_tasks (
                    challenge_phase_id, title, description, difficulty_level, qualify_percentage, revive_attempt_time,
                    \`order\`, is_mandatory, show_answer, is_warning, no_of_warning, max_attempts, reward_points, time_limit , is_active , created_at , updated_at
                ) VALUES (
                    p_challenge_phase_id, p_title, p_description, p_difficulty_level, p_qualify_percentage, p_revive_attempt_time,
                    v_order, p_is_mandatory, p_show_answer, p_is_warning, p_no_of_warning, p_max_attempts, p_reward_points, p_time_limit , false , NOW(), NOW()
                );

                UPDATE tbl_challenge_phases SET
                    tasks_count = CASE WHEN tasks_count IS NOT NULL THEN tasks_count + 1 ELSE 1 END,
                    updated_at = NOW()
                WHERE id = p_challenge_phase_id;
        END IF;
    END IF;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS reorderTasksByCustomOrder(
    IN p_challenge_phase_id INT,
    IN p_task_order JSON
)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE task_count INT;
    DECLARE v_task_id INT;

    -- Get total tasks in the JSON array
    SET task_count = JSON_LENGTH(p_task_order);

    -- Loop through each task ID
    WHILE i < task_count DO
        SET v_task_id = JSON_EXTRACT(p_task_order, CONCAT('$[', i, ']'));

        -- Update the order for each task based on its index
        UPDATE tbl_challenge_tasks
        SET \`order\` = i + 1
        WHERE id = v_task_id AND challenge_phase_id = p_challenge_phase_id;

        SET i = i + 1;
    END WHILE;
END;
`)

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getChallengeTasks()
BEGIN
    SELECT * FROM tbl_challenge_tasks;
END `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getChallengeTasksByPhase`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getChallengeTasksByPhase(
            IN p_challenge_phase_id INT,
            IN p_search_term VARCHAR(255), 
            IN p_difficulty VARCHAR(20), 
            IN p_status VARCHAR(20)
            )
BEGIN
DECLARE phase_exists INT;
    
    -- Check if challenge phase exists
    SELECT COUNT(*) INTO phase_exists 
    FROM tbl_challenge_phases 
    WHERE id = p_challenge_phase_id;
    
    IF phase_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Challenge phase not found.';
    ELSE
        SELECT * FROM tbl_challenge_tasks 
        WHERE (challenge_phase_id = p_challenge_phase_id)
            AND (p_search_term IS NULL OR p_search_term = ''
                OR title LIKE CONCAT('%', p_search_term, '%')
                OR description LIKE CONCAT('%', p_search_term, '%'))
            AND (p_status IS NULL OR p_status = 'all' OR (p_status = 'active' AND is_active = TRUE) OR (p_status = 'inactive' AND is_active = FALSE))
            AND (p_difficulty IS NULL OR p_difficulty = 'all' OR p_difficulty = difficulty_level);
    END IF;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateChallengeTask(
    IN p_id INT,
    IN p_challenge_phase_id INT,
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_difficulty_level ENUM('Easy', 'Moderate', 'Hard'),
    IN p_qualify_percentage INT,
    IN p_revive_attempt_time INT,
    IN p_is_mandatory BOOLEAN,
    IN p_show_answer BOOLEAN,
    IN p_is_warning BOOLEAN, 
    IN p_no_of_warning INT,
    IN p_max_attempts INT,
    IN p_reward_points INT,
    IN p_time_limit INT
)
BEGIN
DECLARE task_exists INT;
DECLARE phase_exists INT;
DECLARE duplicate_exists INT;

-- Check if task exists
    SELECT COUNT(*) INTO task_exists 
    FROM tbl_challenge_tasks 
    WHERE id = p_id;
    
    IF task_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Challenge task not found.';
    ELSE
        -- Check if challenge phase exists
        SELECT COUNT(*) INTO phase_exists 
        FROM tbl_challenge_phases 
        WHERE id = p_challenge_phase_id;
        
        IF phase_exists = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Challenge phase not found.';
        ELSE
            -- Check for duplicacy (same challenge_phase_id, title and difficulty_level)
            SELECT COUNT(*) INTO duplicate_exists 
            FROM tbl_challenge_tasks 
            WHERE challenge_phase_id = p_challenge_phase_id 
            AND title = p_title 
            AND difficulty_level = p_difficulty_level
            AND id != p_id;  -- Exclude the current task being updated
            
            IF duplicate_exists > 0 THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Duplicate challenge task found with the same phase, title, task type, and difficulty level.';
            ELSE
                UPDATE tbl_challenge_tasks
                SET
                    challenge_phase_id = p_challenge_phase_id,
                    title = p_title,
                    description = p_description,
                    difficulty_level = p_difficulty_level,
                    qualify_percentage = p_qualify_percentage,
                    revive_attempt_time = p_revive_attempt_time,
                    is_mandatory = p_is_mandatory,
                    show_answer = p_show_answer,
                    is_warning = p_is_warning, 
                    no_of_warning = p_no_of_warning,
                    max_attempts = p_max_attempts,
                    reward_points = p_reward_points,
                    time_limit = p_time_limit,
                    updated_at = NOW()
                WHERE id = p_id;
            END IF;
        END IF;
    END IF;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteChallengeTask(IN p_id INT)
BEGIN
    DECLARE task_exists INT;
    DECLARE p_challenge_phase_id INT;

    -- Check if task exists
    SELECT COUNT(*) INTO task_exists 
    FROM tbl_challenge_tasks 
    WHERE id = p_id;

    IF task_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Challenge task not found.';
    ELSE
        -- Get the challenge_phase_id before deletion
        SELECT challenge_phase_id INTO p_challenge_phase_id 
        FROM tbl_challenge_tasks 
        WHERE id = p_id;

        -- Toggle is_active status
        UPDATE tbl_challenge_tasks
        SET is_active = false
        WHERE id = p_id;

        CALL handleEntityStatus('challenge_task', p_id);

        -- Delete the task
        DELETE FROM tbl_challenge_tasks WHERE id = p_id;

        -- Update the tasks_count in the corresponding challenge_phase
        UPDATE tbl_challenge_phases SET
            tasks_count = CASE 
                           WHEN tasks_count IS NOT NULL THEN GREATEST(tasks_count - 1, 0) 
                           ELSE 1 
                         END,
            updated_at = NOW()
        WHERE id = p_challenge_phase_id;

        UPDATE tbl_challenge_tasks t
        JOIN (
            SELECT id, ROW_NUMBER() OVER (ORDER BY \`order\`, id) AS new_order
            FROM tbl_challenge_tasks
            WHERE challenge_phase_id = p_challenge_phase_id
        ) ranked ON t.id = ranked.id
        SET t.\`order\` = ranked.new_order;

    END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS toggleChallengeTaskStatus;`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS toggleChallengeTaskStatus(IN p_id INT)
BEGIN
    DECLARE task_exists INT;
    DECLARE current_status BOOLEAN;
    DECLARE total_questions INT DEFAULT 0;

    -- Check if task exists and get current status
    SELECT id, is_active 
    INTO task_exists, current_status
    FROM tbl_challenge_tasks 
    WHERE id = p_id;

    -- If task not found
    IF task_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Challenge task not found';
    END IF;

    CALL validateActivation('challenge_task', p_id, current_status);

    -- Toggle is_active status
    UPDATE tbl_challenge_tasks
    SET is_active = NOT current_status
    WHERE id = p_id;

    CALL handleEntityStatus('challenge_task', p_id);
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getChallengeTaskById(IN p_task_id INT)
BEGIN
DECLARE task_exists INT;
    
    -- Check if task exists
    SELECT COUNT(*) INTO task_exists 
    FROM tbl_challenge_tasks 
    WHERE id = p_task_id;
    
    IF task_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Challenge task not found.';
    ELSE
        -- Challenge task details
        SELECT 
            ct.*
        FROM 
            tbl_challenge_tasks ct
        WHERE 
            ct.id = p_task_id;

        -- Fill in the blanks data
        SELECT 
            fibc.*, 
            'FillInBlank' AS challenge_type
        FROM 
            tbl_fillintheblanks_challenges fibc
        WHERE 
            fibc.challenge_task_id = p_task_id;

        -- MCQs data
        SELECT 
            mcq.*, 
            'MCQ' AS challenge_type
        FROM 
            tbl_mcq_challenge mcq
        WHERE 
            mcq.challenge_task_id = p_task_id;

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
                WHERE challenge_task_id = p_task_id
            )
        ORDER BY mcq_opt.is_correct DESC;
        
        -- True/False challenges data
        SELECT 
            tfc.*, 
            'TrueFalse' AS challenge_type
        FROM 
            tbl_true_false_challenges tfc
        WHERE 
            tfc.challenge_task_id = p_task_id;
    END IF;
END`);

        console.log("✅ Course procedures created!");
    } catch (error) {
        console.error("❌ Error setting challenge task procedures:", error);
        throw error;
    }
};

module.exports = setupChallengeTaskProcedures;
