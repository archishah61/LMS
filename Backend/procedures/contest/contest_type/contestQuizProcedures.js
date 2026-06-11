const sequelize = require("../../../config/db");

const setupContestQuizProcedures = async () => {
    try {
        console.log("🔄 Setting up contest quiz procedures...");

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getContestQuizById(IN p_contest_quiz_id INT)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO v_exists FROM tbl_contest_quizzes WHERE id = p_contest_quiz_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Contest Quiz Not Found.';
    END IF;

    -- Contest Quiz details with category
    SELECT 
        *
    FROM 
        tbl_contest_quizzes
    WHERE 
        id = p_contest_quiz_id;

    -- Fill in the blanks data
    SELECT 
        fibc.*, 
        'FillInTheBlanks' AS challenge_type
    FROM 
        tbl_fillintheblanks_challenges fibc
    WHERE 
        fibc.contest_quiz_id = p_contest_quiz_id;

    -- MCQs data
    SELECT 
        mcq.*, 
        'MCQ' AS challenge_type
    FROM 
        tbl_mcq_challenge mcq
    WHERE 
        mcq.contest_quiz_id = p_contest_quiz_id;

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
            WHERE contest_quiz_id = p_contest_quiz_id
        )
    ORDER BY mcq_opt.is_correct DESC;
    
    -- True/False challenges data
    SELECT 
        tfc.*, 
        'TrueFalse' AS challenge_type
    FROM 
        tbl_true_false_challenges tfc
    WHERE 
        tfc.contest_quiz_id = p_contest_quiz_id;
END`);

        // CREATE
        await sequelize.query(`DROP PROCEDURE IF EXISTS CreateContestQuiz`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS CreateContestQuiz (
    IN p_activity_id BIGINT,
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_time_limit_seconds INT,
    IN p_max_attempts INT,
    IN p_is_warning BOOLEAN,
    IN p_no_of_warning INT,
    IN p_qualify_percentage INT,
    IN p_show_answer BOOLEAN,
    IN p_points_reward INT,
    IN p_created_by BIGINT
)
BEGIN
    DECLARE duplicate_exists INT;
    DECLARE v_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO v_exists FROM tbl_contest_activities WHERE id = p_activity_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Contest Activity Not Found.';
    END IF;
    
    SELECT COUNT(*) INTO duplicate_exists FROM tbl_contest_quizzes WHERE title = p_title AND activity_id = p_activity_id;
    IF duplicate_exists > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E409|DuplicateError|Contest Quiz with this title already exists.';
    ELSE
        INSERT INTO tbl_contest_quizzes (
            activity_id, title, description, time_limit_seconds,
            max_attempts, is_warning, no_of_warning, qualify_percentage, show_answer, points_reward,
            created_by, created_at, updated_at
        ) VALUES (
            p_activity_id, p_title, p_description, p_time_limit_seconds,
            p_max_attempts, p_is_warning, p_no_of_warning, p_qualify_percentage, p_show_answer, p_points_reward,
            p_created_by, NOW(), NOW()
        );

        SELECT * FROM tbl_contest_quizzes WHERE id = LAST_INSERT_ID();
    END IF;
END;
    `);

        // UPDATE
        await sequelize.query(`DROP PROCEDURE IF EXISTS UpdateContestQuiz`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateContestQuiz (
    IN p_id BIGINT,
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_time_limit_seconds INT,
    IN p_max_attempts INT,
    IN p_is_warning BOOLEAN,
    IN p_no_of_warning INT,
    IN p_qualify_percentage INT,
    IN p_show_answer BOOLEAN,
    IN p_points_reward INT,
    IN p_updated_by BIGINT
)
BEGIN
    DECLARE duplicate_exists INT;
    DECLARE v_exists INT DEFAULT 0;
    DECLARE v_activity_id INT;

    SELECT COUNT(*) INTO v_exists FROM tbl_contest_quizzes WHERE id = p_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Contest Quiz Not Found.';
    END IF;

    SELECT activity_id INTO v_activity_id FROM tbl_contest_quizzes WHERE id = p_id;
    SELECT COUNT(*) INTO duplicate_exists FROM tbl_contest_quizzes WHERE title = p_title AND activity_id = v_activity_id AND NOT id = p_id;
    IF duplicate_exists > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E409|DuplicateError|Contest Quiz with this title already exists.';
    ELSE
        UPDATE tbl_contest_quizzes SET
            title = COALESCE(p_title, title),
            description = COALESCE(p_description, description),
            time_limit_seconds = p_time_limit_seconds,
            max_attempts = p_max_attempts,
            is_warning = COALESCE(p_is_warning, is_warning),
            no_of_warning = COALESCE(p_no_of_warning, no_of_warning),
            qualify_percentage = COALESCE(p_qualify_percentage, qualify_percentage),
            show_answer = COALESCE(p_show_answer, show_answer),
            points_reward = COALESCE(p_points_reward, points_reward),
            updated_by = p_updated_by,
            updated_at = NOW()
        WHERE id = p_id;

        SELECT * FROM tbl_contest_quizzes WHERE id = p_id;
    END IF;
END;
    `);

        // TOGGLE STATUS
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS ToggleContestQuizStatus(IN p_id BIGINT)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO v_exists FROM tbl_contest_quizzes WHERE id = p_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Contest Quiz Not Found.';
    END IF;
    
    UPDATE tbl_contest_quizzes
    SET is_active = NOT is_active, updated_at = NOW()
    WHERE id = p_id;
    SELECT * FROM tbl_contest_quizzes WHERE id = p_id;
END;
    `);

        // DELETE
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS DeleteContestQuiz(IN p_id BIGINT)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO v_exists FROM tbl_contest_quizzes WHERE id = p_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Contest Quiz Not Found.';
    END IF;

    DELETE FROM tbl_contest_quizzes WHERE id = p_id;
END;
    `);

        // GET ALL BY ACTIVITY
        await sequelize.query(`DROP PROCEDURE IF EXISTS GetContestQuizzes`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetContestQuizzes(
            IN p_activity_id BIGINT,
            IN p_sort_by VARCHAR(20),
            IN p_status VARCHAR(20)
            )
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO v_exists FROM tbl_contest_activities WHERE id = p_activity_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Contest Activity Not Found.';
    END IF;
    
    SELECT * 
    FROM tbl_contest_quizzes 
    WHERE (activity_id = p_activity_id)
          AND (p_status IS NULL OR p_status = 'all' OR (p_status = 'active' AND is_active = TRUE) OR (p_status = 'inactive' AND is_active = FALSE))
    ORDER BY
        CASE WHEN p_sort_by = 'points_reward' THEN points_reward END DESC,
        CASE WHEN p_sort_by = 'title' THEN title END ASC,
        created_at DESC;
END;
    `);

        console.log("✅ Contest quiz procedures created!");
    } catch (error) {
        console.error("❌ Error setting contest quiz procedures:", error);
        throw error;
    }
};

module.exports = setupContestQuizProcedures;
