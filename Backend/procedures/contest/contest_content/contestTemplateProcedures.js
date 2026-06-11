const sequelize = require("../../../config/db");

const setupContestTemplateProcedures = async () => {
    try {
        console.log("🔄 Setting up contest template procedures...");

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS CreateContestTemplate (
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_type ENUM('recurring', 'on-demand'),
    IN p_recurrence_pattern ENUM("day", "week", "month", "year"),
    IN p_recurrence_interval INT,
    IN p_recurrence_days_of_week JSON,
    IN p_banner_url VARCHAR(500),
    IN p_created_by BIGINT
)
BEGIN
    DECLARE duplicate_exists INT;
    SELECT COUNT(*) INTO duplicate_exists FROM tbl_contest_templates WHERE title = p_title;
    IF duplicate_exists > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E409|DuplicateError|Contest Template with this title already exists.';
    ELSE
        INSERT INTO tbl_contest_templates (
            title, description, type,
            recurrence_pattern, recurrence_interval, recurrence_days_of_week, banner_url,
            created_by, created_at, updated_at
        ) VALUES (
            p_title, p_description, p_type,
            p_recurrence_pattern, p_recurrence_interval, p_recurrence_days_of_week, p_banner_url,
            p_created_by, NOW(), NOW()
        );
        SELECT * FROM tbl_contest_templates WHERE id = LAST_INSERT_ID();
    END IF;
END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS GetAllContestTemplates`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetAllContestTemplates(
            IN p_status BOOLEAN,
            IN p_type VARCHAR(20),
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
            FROM tbl_contest_templates
            WHERE (p_status IS NULL OR is_active = p_status)
                AND (p_type IS NULL OR type = p_type);

            SELECT * FROM tbl_contest_templates
            WHERE (p_status IS NULL OR is_active = p_status)
                AND (p_type IS NULL OR type = p_type)
            LIMIT v_limit OFFSET v_offset; 
        END;`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetAllActiveContestTemplates()
BEGIN
    SELECT * FROM tbl_contest_templates WHERE is_active = TRUE;
END;`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetContestTemplateById(IN p_id BIGINT)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO v_exists FROM tbl_contest_templates WHERE id = p_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Contest Template Not Found.';
    END IF;
    SELECT * FROM tbl_contest_templates WHERE id = p_id;
END;`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateContestTemplate (
    IN p_id BIGINT,
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_type ENUM('recurring', 'on-demand'),
    IN p_recurrence_pattern ENUM("day", "week", "month", "year"),
    IN p_recurrence_interval INT,
    IN p_recurrence_days_of_week JSON,
    IN p_banner_url VARCHAR(500),
    IN p_updated_by BIGINT
)
BEGIN
    DECLARE duplicate_exists INT;
    DECLARE v_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO v_exists FROM tbl_contest_templates WHERE id = p_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Contest Template Not Found.';
    END IF;

    SELECT COUNT(*) INTO duplicate_exists FROM tbl_contest_templates WHERE title = p_title AND NOT id = p_id;
    IF duplicate_exists > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E409|DuplicateError|Contest Template with this title already exists.';
    ELSE
        UPDATE tbl_contest_templates SET
            title = COALESCE(p_title, title),
            description = COALESCE(p_description, description),
            type = COALESCE(p_type, type),
            recurrence_pattern = COALESCE(p_recurrence_pattern, recurrence_pattern),
            recurrence_interval = COALESCE(p_recurrence_interval, recurrence_interval),
            recurrence_days_of_week = COALESCE(p_recurrence_days_of_week, recurrence_days_of_week),
            banner_url = COALESCE(p_banner_url, banner_url),
            updated_by = p_updated_by,
            updated_at = NOW()
        WHERE id = p_id;

        SELECT * FROM tbl_contest_templates WHERE id = p_id;
    END IF;
END;`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS DeleteContestTemplate(IN p_id BIGINT)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO v_exists FROM tbl_contest_templates WHERE id = p_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Contest Template Not Found.';
    END IF;

    DELETE FROM tbl_contest_templates WHERE id = p_id;
END;`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS ToggleContestTemplateStatus(IN p_id BIGINT)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO v_exists FROM tbl_contest_templates WHERE id = p_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Contest Template Not Found.';
    END IF;

    UPDATE tbl_contest_templates
    SET is_active = NOT is_active
    WHERE id = p_id;
    SELECT * FROM tbl_contest_templates WHERE id = p_id;
END;`);

        console.log("✅ Contest template procedures created!");
    } catch (error) {
        console.error("❌ Error setting contest template procedures:", error);
        throw error;
    }
};

module.exports = setupContestTemplateProcedures;
