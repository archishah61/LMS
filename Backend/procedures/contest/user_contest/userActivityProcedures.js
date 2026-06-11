const sequelize = require("../../../config/db");

const setupUserActivityProcedures = async () => {
    try {
        console.log("🔄 Setting up user activity procedures...");

        await sequelize.query(`DROP PROCEDURE IF EXISTS StartContestActivity`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS StartContestActivity (
    IN p_user_id INT,
    IN p_contest_id INT,
    IN p_activity_id INT
)
BEGIN
    DECLARE v_enrollment_id INT;
    DECLARE v_user_activity_id INT;
    DECLARE v_activity_type VARCHAR(50);
    DECLARE v_start_time DATETIME;
    DECLARE v_status VARCHAR(50);
    DECLARE v_now DATETIME;

    SET v_now = NOW();

    -- 1. Check if user is enrolled in contest
    SELECT id INTO v_enrollment_id
    FROM tbl_user_contest_enrollments
    WHERE user_id = p_user_id 
      AND contest_id = p_contest_id 
      AND status = 'active'
    LIMIT 1;

    IF v_enrollment_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E403|ForbiddenError|User not enrolled in this contest';
    END IF;

    -- 2. Get contest timings and status
    SELECT start_time, status
    INTO v_start_time, v_status
    FROM tbl_contests
    WHERE id = p_contest_id
    LIMIT 1;

    -- If contest is not active
    IF v_status = 'draft' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E403|ForbiddenError|Contest is not active';
    END IF;

    -- If contest is not active
    IF v_status = 'cancelled' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E403|ForbiddenError|Contest is cancelled';
    END IF;

    -- If contest not started yet
    IF v_now < v_start_time THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E403|ForbiddenError|Contest has not started yet';
    END IF;

    -- 2. Check if user already has activity record
    SELECT id INTO v_user_activity_id
    FROM tbl_user_contest_activities
    WHERE user_id = p_user_id
      AND contest_id = p_contest_id
      AND activity_id = p_activity_id
    LIMIT 1;

    -- If not exists, create entry
    IF v_user_activity_id IS NULL THEN
        INSERT INTO tbl_user_contest_activities
        (user_id, contest_id, activity_id, status, created_at, updated_at)
        VALUES (p_user_id, p_contest_id, p_activity_id, 'pending', NOW(), NOW());

        SET v_user_activity_id = LAST_INSERT_ID();
    END IF;

    -- 3. Get activity type
    SELECT type INTO v_activity_type
    FROM tbl_contest_activities
    WHERE id = p_activity_id
    LIMIT 1;

    -- 4. Return activity details based on type
    IF v_activity_type = 'coding' THEN
        SELECT 
            a.id AS activity_id,
            a.title,
            a.description,
            a.type,
            a.difficulty,
            a.points_reward,
            ua.id AS user_activity_id,
            ua.status,
            ua.score,
            -- ✅ Total completed coding problems count for this user/activity
            (
                SELECT COUNT(DISTINCT c.id)
                FROM tbl_contest_coding c
                JOIN tbl_user_contest_codings uc 
                  ON uc.coding_id = c.id 
                 AND uc.user_id = p_user_id
                 AND uc.contest_id = p_contest_id
                 AND uc.status = 'completed'
                WHERE c.activity_id = a.id
                  AND c.is_active = TRUE
            ) AS completed_codings_count,
            (SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', c.id,
                    'title', c.title,
                    'problem_statement', c.problem_statement,
                    'constraints', c.constraints,
                    'sample_inputs_outputs', c.sample_inputs_outputs,
                    'time_limit_seconds',c.time_limit_seconds,
                    'memory_limit_mb', c.memory_limit_mb,
                    'allowed_languages', c.allowed_languages,
                    'starter_code', c.starter_code,
                    'points_reward', c.points_reward,
                    'max_attempts', c.max_attempts,
                    -- total attempts user has made
                    'attempt_count', (
                        SELECT COUNT(*) 
                        FROM tbl_user_contest_codings uc 
                        WHERE uc.coding_id = c.id 
                            AND uc.user_id = p_user_id
                            AND uc.contest_id = p_contest_id
                    ),

                    -- flag: whether quiz completed or not
                    'is_completed', (
                        SELECT CASE WHEN COUNT(*) > 0 THEN TRUE ELSE FALSE END
                        FROM tbl_user_contest_codings uc
                        WHERE uc.coding_id = c.id 
                            AND uc.user_id = p_user_id
                            AND uc.contest_id = p_contest_id
                            AND uc.status = 'completed'
                    )
                )
            )
            FROM tbl_contest_coding c
            WHERE c.activity_id = a.id AND c.is_active = TRUE) AS codings
        FROM tbl_contest_activities a
        JOIN tbl_user_contest_activities ua ON ua.activity_id = a.id
        WHERE a.id = p_activity_id AND ua.id = v_user_activity_id;

    ELSEIF v_activity_type = 'quiz' THEN
        SELECT 
            a.id AS activity_id,
            a.title,
            a.description,
            a.type,
            a.difficulty,
            a.points_reward,
            ua.id AS user_activity_id,
            ua.status,
            ua.score,
        -- ✅ Total completed quizzes count for this user/activity
            (
                SELECT COUNT(DISTINCT q.id)
                FROM tbl_contest_quizzes q
                JOIN tbl_user_contest_quizzes uq 
                  ON uq.quiz_id = q.id 
                 AND uq.user_id = p_user_id
                 AND uq.contest_id = p_contest_id
                 AND uq.status = 'completed'
                WHERE q.activity_id = a.id
                  AND q.is_active = TRUE
            ) AS completed_quizzes_count,
            (SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', q.id,
                    'title', q.title,
                    'description', q.description,
                    'time_limit_seconds', q.time_limit_seconds,
                    'max_attempts', q.max_attempts,
                    'qualify_percentage', q.qualify_percentage,
                    'show_answer', q.show_answer,
                    'points_reward', q.points_reward,
                    -- total attempts user has made
                    'attempt_count', (
                        SELECT COUNT(*) 
                        FROM tbl_user_contest_quizzes uq 
                        WHERE uq.quiz_id = q.id 
                            AND uq.user_id = p_user_id
                            AND uq.contest_id = p_contest_id
                    ),

                    -- flag: whether quiz completed or not
                    'is_completed', (
                        SELECT CASE WHEN COUNT(*) > 0 THEN TRUE ELSE FALSE END
                        FROM tbl_user_contest_quizzes uq 
                        WHERE uq.quiz_id = q.id 
                            AND uq.user_id = p_user_id
                            AND uq.contest_id = p_contest_id
                            AND uq.status = 'completed'
                    )
                )
            )
            FROM tbl_contest_quizzes q
            WHERE q.activity_id = a.id AND q.is_active = TRUE) AS quizzes
        FROM tbl_contest_activities a
        JOIN tbl_user_contest_activities ua ON ua.activity_id = a.id
        WHERE a.id = p_activity_id AND ua.id = v_user_activity_id;

    ELSE
        -- Default: just return basic activity info
        SELECT 
            a.*,
            ua.*
        FROM tbl_contest_activities a
        JOIN tbl_user_contest_activities ua ON ua.activity_id = a.id
        WHERE a.id = p_activity_id AND ua.id = v_user_activity_id;
    END IF;

END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS StartContestQuiz`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS StartContestQuiz (
    IN p_user_id INT,
    IN p_contest_id INT,
    IN p_quiz_id INT
)
BEGIN
    DECLARE v_enrollment_id INT;
    DECLARE v_user_activity_id INT;
    DECLARE v_activity_type VARCHAR(50);
    DECLARE v_max_attempts INT;
    DECLARE v_attempt_count INT;
    DECLARE v_start_time DATETIME;
    DECLARE v_end_time DATETIME;
    DECLARE v_status VARCHAR(50);
    DECLARE v_now DATETIME;

    SET v_now = NOW();

    -- 1. Check if user is enrolled in contest
    SELECT id INTO v_enrollment_id
    FROM tbl_user_contest_enrollments
    WHERE user_id = p_user_id 
      AND contest_id = p_contest_id 
      AND status = 'active'
    LIMIT 1;

    IF v_enrollment_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E403|ForbiddenError|User not enrolled in this contest';
    END IF;

    -- 2. Get contest timings and status
    SELECT start_time, end_time, status
    INTO v_start_time, v_end_time, v_status
    FROM tbl_contests
    WHERE id = p_contest_id
    LIMIT 1;

    -- If contest is not active
    IF v_status <> 'active' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E403|ForbiddenError|Contest is not active';
    END IF;

    -- If contest not started yet
    IF v_now < v_start_time THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E403|ForbiddenError|Contest has not started yet';
    END IF;

    -- If contest already ended
    IF v_now > v_end_time THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E403|ForbiddenError|Contest has already ended';
    END IF;

    -- Get max_attempts for quiz
    SELECT max_attempts INTO v_max_attempts
    FROM tbl_contest_quizzes
    WHERE id = p_quiz_id
    LIMIT 1;

    -- Count user attempts for this quiz
    SELECT COUNT(*) INTO v_attempt_count
    FROM tbl_user_contest_quizzes
    WHERE user_id = p_user_id
        AND contest_id = p_contest_id
        AND quiz_id = p_quiz_id;

    -- If max_attempts is not null and already exceeded
    IF v_max_attempts IS NOT NULL AND v_attempt_count >= v_max_attempts THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E403|ForbiddenError|Max quiz attempts reached';
    END IF;

        SELECT
            q.id AS quiz_id,
            q.title AS quiz_title,
            q.description AS quiz_description,
            q.time_limit_seconds,
            q.max_attempts,
            q.is_warning,
            q.no_of_warning,
            q.qualify_percentage,
            q.show_answer,
            q.points_reward,
            -- Nested: questions (MCQ, FillBlanks, True/False)
            (SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', mcq.id,
                    'question_text', mcq.question_text,
                    'options', (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', opt.id,
                                'option_text', opt.option_text,
                                'option_type', opt.option_type
                            )
                        )
                        FROM tbl_mcq_option_challenge opt
                        WHERE opt.mcq_id = mcq.id
                    )
                )
            )
            FROM tbl_mcq_challenge mcq
            WHERE mcq.contest_quiz_id = q.id AND mcq.is_active = TRUE) AS mcq_questions,
            (SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', fbc.id,
                    'text', fbc.text
                )
            )
            FROM tbl_fillintheblanks_challenges fbc
            WHERE fbc.contest_quiz_id = q.id AND fbc.is_active = TRUE) AS fill_in_the_blanks,
            (SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', tfc.id,
                    'question', tfc.question
                )
            )
            FROM tbl_true_false_challenges tfc
            WHERE tfc.contest_quiz_id = q.id AND tfc.is_active = TRUE) AS true_false_questions
        FROM tbl_contest_quizzes q
        WHERE q.id = p_quiz_id AND q.is_active = TRUE;

END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS StartContestCoding`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS StartContestCoding (
    IN p_user_id INT,
    IN p_contest_id INT,
    IN p_coding_id INT
)
BEGIN
    DECLARE v_enrollment_id INT;
    DECLARE v_user_activity_id INT;
    DECLARE v_activity_type VARCHAR(50);
    DECLARE v_max_attempts INT;
    DECLARE v_attempt_count INT;
    DECLARE v_start_time DATETIME;
    DECLARE v_end_time DATETIME;
    DECLARE v_status VARCHAR(50);
    DECLARE v_now DATETIME;

    SET v_now = NOW();

    -- 1. Check if user is enrolled in contest
    SELECT id INTO v_enrollment_id
    FROM tbl_user_contest_enrollments
    WHERE user_id = p_user_id 
      AND contest_id = p_contest_id 
      AND status = 'active'
    LIMIT 1;

    IF v_enrollment_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E403|ForbiddenError|User not enrolled in this contest';
    END IF;

    -- 2. Get contest timings and status
    SELECT start_time, end_time, status
    INTO v_start_time, v_end_time, v_status
    FROM tbl_contests
    WHERE id = p_contest_id
    LIMIT 1;

    -- If contest is not active
    IF v_status <> 'active' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E403|ForbiddenError|Contest is not active';
    END IF;

    -- If contest not started yet
    IF v_now < v_start_time THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E403|ForbiddenError|Contest has not started yet';
    END IF;

    -- If contest already ended
    IF v_now > v_end_time THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E403|ForbiddenError|Contest has already ended';
    END IF;

    -- Get max_attempts for coding
    SELECT max_attempts INTO v_max_attempts
    FROM tbl_contest_coding
    WHERE id = p_coding_id
    LIMIT 1;

    -- Count user attempts for this coding
    SELECT COUNT(*) INTO v_attempt_count
    FROM tbl_user_contest_codings
    WHERE user_id = p_user_id
        AND contest_id = p_contest_id
        AND coding_id = p_coding_id;

    -- If max_attempts is not null and already exceeded
    IF v_max_attempts IS NOT NULL AND v_attempt_count >= v_max_attempts THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E403|ForbiddenError|Max coding attempts reached';
    END IF;

        SELECT
            c.id AS coding_id,
            c.title,
            c.problem_statement,
            c.constraints,
            c.sample_inputs_outputs,
            c.difficulty_level,
            c.time_limit_seconds,
            c.memory_limit_mb,
            c.max_attempts,
            c.is_warning,
            c.no_of_warning,
            c.points_reward,
            c.allowed_languages,
            c.starter_code
        FROM tbl_contest_coding c
        WHERE c.id = p_coding_id AND c.is_active = TRUE;

END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS checkContestQuiz`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS checkContestQuiz(
    IN p_user_contest_activity_id INT,
    IN p_quiz_id INT,
    IN p_user_answers JSON
)
BEGIN
    DECLARE v_correct_count INT DEFAULT 0;
    DECLARE v_total_count INT DEFAULT 0;
    DECLARE v_results JSON DEFAULT JSON_ARRAY();
    DECLARE v_show_answer BOOLEAN DEFAULT TRUE; -- configurable if needed
    DECLARE v_is_qualified BOOLEAN DEFAULT FALSE;
    DECLARE v_qualify_percentage INT;
    DECLARE v_user_id INT;
    DECLARE v_contest_id INT;
    DECLARE v_activity_id INT;
    DECLARE v_quiz_title VARCHAR(255);
    DECLARE v_activity_status VARCHAR(255);
    DECLARE v_points_reward INT DEFAULT 0;
    DECLARE v_activity_points_reward INT DEFAULT 0;
    DECLARE v_is_per_question_reward BOOLEAN DEFAULT FALSE;
    DECLARE v_previous_points_earned INT DEFAULT 0;

    -- validate inputs
    IF p_quiz_id IS NULL OR p_user_answers IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E400|ValidationError|Quiz ID and Answers are required';
    END IF;

    -- validate quiz exists
    SELECT qualify_percentage, points_reward, title, show_answer
    INTO v_qualify_percentage, v_points_reward, v_quiz_title, v_show_answer
    FROM tbl_contest_quizzes
    WHERE id = p_quiz_id AND is_active = TRUE;

    IF v_qualify_percentage IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Quiz not found or inactive';
    END IF;

    -- total questions in this quiz
    SELECT COUNT(*) INTO v_total_count
    FROM (
        SELECT id FROM tbl_fillintheblanks_challenges WHERE contest_quiz_id = p_quiz_id AND is_active = TRUE
        UNION ALL
        SELECT id FROM tbl_mcq_challenge WHERE contest_quiz_id = p_quiz_id AND is_active = TRUE
        UNION ALL
        SELECT id FROM tbl_true_false_challenges WHERE contest_quiz_id = p_quiz_id AND is_active = TRUE
    ) q;

    -- iterate through answers
    BEGIN
        DECLARE i INT DEFAULT 0;
        DECLARE v_array_length INT;
        DECLARE v_question_id INT;
        DECLARE v_question_type VARCHAR(50);
        DECLARE v_user_answer VARCHAR(255);

        SET v_array_length = JSON_LENGTH(p_user_answers);

        WHILE i < v_array_length DO
            SET v_question_id = JSON_UNQUOTE(JSON_EXTRACT(p_user_answers, CONCAT('$[', i, '].question_id')));
            SET v_question_type = JSON_UNQUOTE(JSON_EXTRACT(p_user_answers, CONCAT('$[', i, '].question_type')));
            SET v_user_answer = JSON_UNQUOTE(JSON_EXTRACT(p_user_answers, CONCAT('$[', i, '].userAnswer')));

            -- handle MCQ
            IF v_question_type = 'mcq' THEN
                BEGIN
                    DECLARE v_correct_option_id INT;
                    DECLARE v_correct_option_text VARCHAR(255);
                    DECLARE v_user_option_text VARCHAR(255);
                    DECLARE v_is_correct BOOLEAN DEFAULT FALSE;

                    SELECT mco.id, mco.option_text
                    INTO v_correct_option_id, v_correct_option_text
                    FROM tbl_mcq_challenge mcq
                    JOIN tbl_mcq_option_challenge mco ON mcq.id = mco.mcq_id
                    WHERE mcq.id = v_question_id AND mco.is_correct = TRUE;

                    SELECT option_text INTO v_user_option_text
                    FROM tbl_mcq_option_challenge
                    WHERE id = v_user_answer;

                    IF v_user_answer = v_correct_option_id THEN
                        SET v_is_correct = TRUE;
                        SET v_correct_count = v_correct_count + 1;
                    END IF;

                    SET v_results = JSON_ARRAY_APPEND(v_results, '$', JSON_OBJECT(
                        'question_id', v_question_id,
                        'userAnswer', v_user_option_text,
                        'correctAnswer', IF(v_show_answer, v_correct_option_text, NULL),
                        'isCorrect', v_is_correct
                    ));
                END;
            END IF;

            -- handle Fill in the Blank
            IF v_question_type = 'fill-in-the-blank' THEN
                BEGIN
                    DECLARE v_correct_answers JSON;
                    DECLARE v_is_correct BOOLEAN DEFAULT FALSE;
                    DECLARE v_formatted_correct_answers TEXT;

                    SELECT answers INTO v_correct_answers
                    FROM tbl_fillintheblanks_challenges
                    WHERE id = v_question_id AND is_active = TRUE;

                    -- ⚡ call custom function (if exists) to validate, else simple equality
                    SET v_is_correct = checkFillInTheBlankAnswer(v_user_answer, v_correct_answers);

                    SET v_formatted_correct_answers = formatJsonArray(v_correct_answers);

                    IF v_is_correct THEN
                        SET v_correct_count = v_correct_count + 1;
                    END IF;

                    SET v_results = JSON_ARRAY_APPEND(v_results, '$', JSON_OBJECT(
                        'question_id', v_question_id,
                        'userAnswer', v_user_answer,
                        'correctAnswer', IF(v_show_answer, v_formatted_correct_answers, NULL),
                        'isCorrect', v_is_correct
                    ));
                END;
            END IF;

            -- handle True/False
            IF v_question_type = 'true-false' THEN
                BEGIN
                    DECLARE v_correct_answer BOOLEAN;
                    DECLARE v_is_correct BOOLEAN DEFAULT FALSE;

                    SELECT answer INTO v_correct_answer
                    FROM tbl_true_false_challenges
                    WHERE id = v_question_id;

                    IF v_user_answer = v_correct_answer THEN
                        SET v_is_correct = TRUE;
                        SET v_correct_count = v_correct_count + 1;
                    END IF;

                    SET v_results = JSON_ARRAY_APPEND(v_results, '$', JSON_OBJECT(
                        'question_id', v_question_id,
                        'userAnswer', v_user_answer,
                        'correctAnswer', IF(v_show_answer, v_correct_answer, NULL),
                        'isCorrect', v_is_correct
                    ));
                END;
            END IF;

            SET i = i + 1;
        END WHILE;
    END;

    SELECT score, user_id, contest_id, activity_id INTO v_previous_points_earned, v_user_id, v_contest_id, v_activity_id FROM tbl_user_contest_activities
    WHERE id = p_user_contest_activity_id;

    IF v_correct_count >= (v_total_count * v_qualify_percentage / 100) THEN
        SET v_is_qualified = TRUE;
    END IF;

    IF v_is_qualified THEN
        -- Check if this quiz was already completed before
        IF NOT EXISTS (
            SELECT 1 FROM tbl_user_contest_quizzes
            WHERE user_id = v_user_id 
            AND contest_id = v_contest_id
            AND quiz_id = p_quiz_id
            AND status = 'completed'
        ) THEN
            -- First time this quiz is being rewarded
            UPDATE tbl_user_contest_activities
            SET score = score + v_points_reward
            WHERE id = p_user_contest_activity_id;

            UPDATE tbl_user_contest_enrollments
            SET score = IFNULL(score,0) + v_points_reward
            WHERE user_id = v_user_id AND contest_id = v_contest_id;
        END IF;

        -- Check if all active quizzes for this activity are completed
        IF NOT EXISTS (
            SELECT 1 FROM tbl_contest_quizzes cq
            WHERE cq.activity_id = (
                SELECT activity_id FROM tbl_user_contest_activities WHERE id = p_user_contest_activity_id
            )
            AND cq.is_active = TRUE
            AND NOT cq.id = p_quiz_id
            AND NOT EXISTS (
                SELECT 1 FROM tbl_user_contest_quizzes uq
                WHERE uq.quiz_id = cq.id
                    AND uq.user_id = v_user_id
                    AND uq.contest_id = v_contest_id
                    AND uq.status = 'completed'
            )
        ) THEN
            SELECT points_reward INTO v_activity_points_reward FROM tbl_contest_activities
            WHERE id = v_activity_id;

            SELECT status INTO v_activity_status FROM tbl_user_contest_activities
            WHERE id = p_user_contest_activity_id;

            -- All quizzes are completed -> mark activity done
            UPDATE tbl_user_contest_activities
            SET status = 'completed', submitted_at = NOW()
            WHERE id = p_user_contest_activity_id;

            IF NOT v_activity_status = 'completed' THEN
                -- All quizzes are completed -> mark activity done
                UPDATE tbl_user_contest_activities
                SET score = score + v_activity_points_reward
                WHERE id = p_user_contest_activity_id;

                UPDATE tbl_user_contest_enrollments
                SET score = score + v_activity_points_reward
                WHERE user_id = v_user_id AND contest_id = v_contest_id;
            END IF;
        END IF;
    END IF;

-- return results
SELECT 
    'Quiz checked successfully' AS message,
    v_results AS results,
    v_correct_count AS correct_count,
    v_total_count AS total_count,
    CONCAT(v_correct_count, '/', v_total_count) AS score,
    IF(v_is_qualified, v_points_reward, 0) AS totalRewardPoints,
    v_is_qualified AS isQualified;
END`)

        console.log("✅ User activity procedures created!");
    } catch (error) {
        console.error("❌ Error setting user activity procedures:", error);
        throw error;
    }
};

module.exports = setupUserActivityProcedures;
