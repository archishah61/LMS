const sequelize = require("../../../config/db");

const setupContestProcedures = async () => {
    try {
        console.log("🔄 Setting up contest procedures...");

        await sequelize.query("DROP PROCEDURE IF EXISTS CreateContest");
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS CreateContest (
    IN p_template_id BIGINT,
    IN p_category_id INT,
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_start_time DATETIME,
    IN p_end_time DATETIME,
    IN p_enrollment_start DATETIME,
    IN p_enrollment_end DATETIME,
    IN p_is_limites_participants BOOLEAN,
    IN p_max_participants INT,
    IN p_enroll_by ENUM('free','points','paid'),
    IN p_enrollment_fee INT,
    IN p_mode ENUM('solo','team','mixed'),
    IN p_rules TEXT,
    IN p_banner_url VARCHAR(500),
    IN p_created_by BIGINT
)
BEGIN

    DECLARE duplicate_exists INT;
    DECLARE v_category_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO v_category_exists FROM tbl_challenge_categories WHERE id = p_category_id;
    IF v_category_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Category Not Found.';
    END IF;

    SELECT COUNT(*) INTO duplicate_exists FROM tbl_contests WHERE title = p_title;
    IF duplicate_exists > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E409|DuplicateError|Contest with this title already exists.';
    END IF;

    INSERT INTO tbl_contests (
        template_id, title, description, category_id, start_time, end_time,
        enrollment_start, enrollment_end, status, is_limites_participants,
        max_participants, enroll_by, enrollment_fee,
        mode, rules, banner_url,
        created_by, created_at, updated_at
    ) VALUES (
        p_template_id, p_title, p_description, p_category_id, p_start_time, p_end_time,
        p_enrollment_start, p_enrollment_end, 'draft', p_is_limites_participants,
        p_max_participants, p_enroll_by, p_enrollment_fee,
        p_mode, p_rules, p_banner_url,
        p_created_by, NOW(), NOW()
    );
    SELECT * FROM tbl_contests WHERE id = LAST_INSERT_ID();
END;`);

        await sequelize.query("DROP PROCEDURE IF EXISTS UpdateContest");
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateContest (
    IN p_id BIGINT,
    IN p_template_id BIGINT,
    IN p_category_id INT,
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_start_time DATETIME,
    IN p_end_time DATETIME,
    IN p_enrollment_start DATETIME,
    IN p_enrollment_end DATETIME,
    IN p_is_limites_participants BOOLEAN,
    IN p_max_participants INT,
    IN p_enroll_by ENUM('free','points','paid'),
    IN p_enrollment_fee INT,
    IN p_mode ENUM('solo','team','mixed'),
    IN p_rules TEXT,
    IN p_banner_url VARCHAR(500),
    IN p_updated_by BIGINT
)
BEGIN

    DECLARE duplicate_exists INT;
    DECLARE v_exists INT DEFAULT 0;
    DECLARE v_category_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO v_category_exists FROM tbl_challenge_categories WHERE id = p_category_id;
    IF v_category_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Category Not Found.';
    END IF;

    SELECT COUNT(*) INTO v_exists FROM tbl_contests WHERE id = p_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Contest Not Found.';
    END IF;

    SELECT COUNT(*) INTO duplicate_exists FROM tbl_contests WHERE title = p_title AND NOT id = p_id;
    IF duplicate_exists > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E409|DuplicateError|Contest with this title already exists.';
    END IF;

    UPDATE tbl_contests SET
        template_id = COALESCE(p_template_id, template_id),
        category_id = COALESCE(p_category_id,category_id),
        title = COALESCE(p_title, title),
        description = COALESCE(p_description, description),
        start_time = COALESCE(p_start_time, start_time),
        end_time = COALESCE(p_end_time, end_time),
        enrollment_start = p_enrollment_start,
        enrollment_end = p_enrollment_end,
        is_limites_participants = COALESCE(p_is_limites_participants, is_limites_participants),
        max_participants = p_max_participants,
        enroll_by = COALESCE(p_enroll_by, enroll_by),
        enrollment_fee = COALESCE(p_enrollment_fee, enrollment_fee),
        mode = COALESCE(p_mode, mode),
        rules = COALESCE(p_rules, rules),
        banner_url = COALESCE(p_banner_url, banner_url),
        updated_by = p_updated_by,
        updated_at = NOW()
    WHERE id = p_id;

    SELECT * FROM tbl_contests WHERE id = p_id;
END;`);

        await sequelize.query("DROP PROCEDURE IF EXISTS DeleteContest");
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS DeleteContest(IN p_id BIGINT)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO v_exists FROM tbl_contests WHERE id = p_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Contest Not Found.';
    END IF;

    DELETE FROM tbl_contests WHERE id = p_id;
END;`);

        await sequelize.query("DROP PROCEDURE IF EXISTS ToggleContestStatus");
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS ToggleContestStatus(IN p_id BIGINT, IN p_status ENUM('draft','active','ended','cancelled'))
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO v_exists FROM tbl_contests WHERE id = p_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Contest Not Found.';
    END IF;

    UPDATE tbl_contests
    SET status = p_status, updated_at = NOW()
    WHERE id = p_id;
    SELECT * FROM tbl_contests WHERE id = p_id;
END;`);

        await sequelize.query("DROP PROCEDURE IF EXISTS GetContests");
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetContests(
            IN p_template_id BIGINT,
            IN p_status VARCHAR(20),
            IN p_type VARCHAR(20),
            IN p_sortBy VARCHAR(20),            
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
            FROM tbl_contests
            WHERE (p_template_id IS NULL OR template_id = p_template_id)
                AND (p_status IS NULL OR status = p_status)
                AND (p_type IS NULL OR enroll_by = p_type);

            SELECT * FROM tbl_contests
            WHERE (p_template_id IS NULL OR template_id = p_template_id)
                AND (p_status IS NULL OR status = p_status)
                AND (p_type IS NULL OR enroll_by = p_type)
            ORDER BY
                CASE WHEN p_sortBy = 'newest' THEN created_at END DESC,
                CASE WHEN p_sortBy = 'oldest' THEN created_at END ASC,
                CASE WHEN p_sortBy = 'participants' THEN total_participants END DESC,
                CASE WHEN p_sortBy = 'status' THEN status END ASC,
                created_at DESC
            LIMIT v_limit OFFSET v_offset; 
END;`);

        await sequelize.query("DROP PROCEDURE IF EXISTS GetActiveContests");
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetActiveContests(IN p_template_id BIGINT)
BEGIN
    IF p_template_id IS NOT NULL THEN
        SELECT 
            c.*,
            cat.category AS category_name
        FROM tbl_contests AS c
        LEFT JOIN tbl_challenge_categories AS cat ON cat.id = c.category_id
        WHERE c.status <> 'draft' AND c.template_id = p_template_id;
    ELSE
        SELECT 
            c.*,
            cat.category AS category_name
        FROM tbl_contests AS c
        LEFT JOIN tbl_challenge_categories AS cat ON cat.id = c.category_id
        WHERE c.status <> 'draft';
    END IF;
END;`);

        await sequelize.query("DROP PROCEDURE IF EXISTS GetContestById");
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetContestById(IN p_id BIGINT)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO v_exists FROM tbl_contests WHERE id = p_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Contest Not Found.';
    END IF;

    SELECT 
        c.id,
        c.template_id,
        c.category_id,
        c.title,
        c.description,
        c.start_time,
        c.end_time,
        c.enrollment_start,
        c.enrollment_end,
        c.status,
        c.is_limites_participants,
        c.max_participants,
        c.total_participants,
        c.enroll_by,
        c.enrollment_fee,
        c.mode,
        c.rules,
        c.banner_url,
        c.created_by,
        c.updated_by,
        c.created_at,
        c.updated_at,

        -- Activities (only active)
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', a.id,
                    'title', a.title,
                    'description', a.description,
                    'type', a.type,
                    'difficulty', a.difficulty,
                    'points_reward', a.points_reward,
                    'created_by', a.created_by,
                    'updated_by', a.updated_by,
                    'created_at', a.created_at,
                    'updated_at', a.updated_at
                )
            )
            FROM tbl_contest_activities a
            WHERE a.contest_id = c.id AND a.is_active = TRUE AND c.start_time <= NOW()
        ) AS activities,

        -- Prizes (only active)
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', p.id,
                    'prize_type', p.prize_type,
                    'position_start', p.position_start,
                    'position_end', p.position_end,
                    'prize_points', p.prize_points,
                    'prize_description', p.prize_description,
                    'created_by', p.created_by,
                    'updated_by', p.updated_by,
                    'created_at', p.created_at,
                    'updated_at', p.updated_at
                )
            )
            FROM tbl_contest_prizes p
            WHERE p.contest_id = c.id AND p.is_active = TRUE
        ) AS prizes

    FROM tbl_contests c
    WHERE c.id = p_id
    GROUP BY c.id;
END`);

        console.log("✅ Contest procedures created!");
    } catch (error) {
        console.error("❌ Error setting contest procedures:", error);
        throw error;
    }
};

module.exports = setupContestProcedures;
