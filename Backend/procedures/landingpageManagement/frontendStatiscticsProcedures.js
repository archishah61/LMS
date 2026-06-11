const sequelize = require("../../config/db");

const setupFrontendStatisticsProcedures = async () => {
    try {
        await sequelize.query(`DROP PROCEDURE IF EXISTS createFrontendStatistic`);
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS createFrontendStatistic(
        IN p_icon VARCHAR(255),
        IN p_value VARCHAR(255),
        IN p_label VARCHAR(255),
        IN p_description TEXT,
        IN p_is_active BOOLEAN,
        IN p_created_by INT,
        IN p_updated_by INT
    )
    BEGIN
        DECLARE next_sequence INT DEFAULT 1;

        SELECT COALESCE(MAX(sequence_no), 0) + 1 INTO next_sequence FROM tbl_frontend_statistics;

        INSERT INTO tbl_frontend_statistics (
            icon, value, label, description, is_active, sequence_no,
            created_by, updated_by, created_at, updated_at
        ) VALUES (
            p_icon, p_value, p_label, p_description, COALESCE(p_is_active, TRUE), next_sequence,
            p_created_by, p_updated_by, NOW(), NOW()
        );
        SELECT * FROM tbl_frontend_statistics WHERE id = LAST_INSERT_ID();
    END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getAdminFrontendStatistics`);
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS getAdminFrontendStatistics(
        IN p_is_active VARCHAR(10)
    )
    BEGIN
        IF p_is_active = 'true' THEN
            SELECT * FROM tbl_frontend_statistics WHERE is_active = TRUE ORDER BY sequence_no ASC;
        ELSEIF p_is_active = 'false' THEN
            SELECT * FROM tbl_frontend_statistics WHERE is_active = FALSE ORDER BY sequence_no ASC;
        ELSE
            SELECT * FROM tbl_frontend_statistics ORDER BY sequence_no ASC;
        END IF;
    END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getUserFrontendStatistics`);
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS getUserFrontendStatistics()
    BEGIN
        SELECT id, icon, value, label, description, sequence_no 
        FROM tbl_frontend_statistics 
        WHERE is_active = TRUE 
        ORDER BY sequence_no ASC;
    END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS updateFrontendStatistic`);
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS updateFrontendStatistic(
        IN p_id INT,
        IN p_icon VARCHAR(255),
        IN p_value VARCHAR(255),
        IN p_label VARCHAR(255),
        IN p_description TEXT,
        IN p_is_active BOOLEAN,
        IN p_updated_by INT
    )
    BEGIN
        DECLARE stat_exists INT DEFAULT 0;
        SELECT COUNT(*) INTO stat_exists FROM tbl_frontend_statistics WHERE id = p_id;
        
        IF stat_exists = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Statistic not found';
        ELSE
            UPDATE tbl_frontend_statistics
            SET 
                icon = COALESCE(p_icon, icon),
                value = COALESCE(p_value, value),
                label = COALESCE(p_label, label),
                description = COALESCE(p_description, description),
                is_active = COALESCE(p_is_active, is_active),
                updated_by = p_updated_by,
                updated_at = NOW()
            WHERE id = p_id;
            
            SELECT * FROM tbl_frontend_statistics WHERE id = p_id;
        END IF;
    END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS deleteFrontendStatistic`);
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS deleteFrontendStatistic(IN p_id INT)
    BEGIN
        DECLARE stat_exists INT DEFAULT 0;
        SELECT COUNT(*) INTO stat_exists FROM tbl_frontend_statistics WHERE id = p_id;
        
        IF stat_exists = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Statistic not found';
        ELSE
            SELECT * FROM tbl_frontend_statistics WHERE id = p_id;
            DELETE FROM tbl_frontend_statistics WHERE id = p_id;
        END IF;
    END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS toggleFrontendStatisticActive`);
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS toggleFrontendStatisticActive(
        IN p_id INT,
        IN p_updated_by INT
    )
    BEGIN
        DECLARE stat_exists INT DEFAULT 0;
        SELECT COUNT(*) INTO stat_exists FROM tbl_frontend_statistics WHERE id = p_id;
        
        IF stat_exists = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Statistic not found';
        ELSE
            UPDATE tbl_frontend_statistics
            SET is_active = NOT is_active,
                updated_by = p_updated_by,
                updated_at = NOW()
            WHERE id = p_id;
            
            SELECT * FROM tbl_frontend_statistics WHERE id = p_id;
        END IF;
    END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS updateFrontendStatisticSequence`);
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS updateFrontendStatisticSequence(
        IN p_id INT,
        IN p_sequence_no INT,
        IN p_updated_by INT
    )
    BEGIN
        UPDATE tbl_frontend_statistics
        SET sequence_no = p_sequence_no,
            updated_by = p_updated_by,
            updated_at = NOW()
        WHERE id = p_id;
    END
        `);

        console.log("✅ Frontend Statistics Procedures created successfully");
    } catch (error) {
        console.error("❌ Error setting up Frontend Statistics Procedures:", error);
    }
};

module.exports = setupFrontendStatisticsProcedures;
