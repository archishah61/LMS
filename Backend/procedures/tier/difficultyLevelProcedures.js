const sequelize = require("../../config/db");

const setupDifficultyLevelProcedures = async () => {
    try {
        console.log("🔄 Setting up Difficulty Level procedures...");

        // CREATE
        await sequelize.query(`DROP PROCEDURE IF EXISTS createDifficultyLevel`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createDifficultyLevel(
            IN p_name VARCHAR(100),
            IN p_description TEXT,
            IN p_created_by INT,
            IN p_updated_by INT
        )
        BEGIN
            INSERT INTO tbl_difficulty_levels(
                name, description, created_by, updated_by,
                is_active, created_at, updated_at
            ) VALUES(
                p_name, p_description, p_created_by, p_updated_by,
                TRUE, NOW(), NOW()
            );

            SELECT * FROM tbl_difficulty_levels WHERE id = LAST_INSERT_ID();
        END`);

        // UPDATE
        await sequelize.query(`DROP PROCEDURE IF EXISTS updateDifficultyLevel`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateDifficultyLevel(
            IN p_id INT,
            IN p_name VARCHAR(100),
            IN p_description TEXT,
            IN p_updated_by INT
        )
        BEGIN
            IF NOT EXISTS(SELECT 1 FROM tbl_difficulty_levels WHERE id = p_id) THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Difficulty Level not found.';
            ELSE
                UPDATE tbl_difficulty_levels
                SET name = p_name,
                    description = p_description,
                    updated_by = p_updated_by,
                    updated_at = NOW()
                WHERE id = p_id;

                SELECT * FROM tbl_difficulty_levels WHERE id = p_id;
            END IF;
        END`);

        // GET ALL
        await sequelize.query(`DROP PROCEDURE IF EXISTS getAllDifficultyLevels`);
        await sequelize.query(`CREATE PROCEDURE getAllDifficultyLevels(
            IN p_search_term VARCHAR(255),
            IN p_limit VARCHAR(10),
            IN p_offset INT
        )
        BEGIN
            SET @whereClause := ' WHERE 1 = 1';

            IF p_search_term IS NOT NULL AND p_search_term != '' THEN
                SET @whereClause := CONCAT(@whereClause,
                    ' AND (name LIKE "%', p_search_term, '%")');
            END IF;

            -- 1. Get total count
            SET @countSQL := CONCAT(
                'SELECT COUNT(*) AS total_count FROM tbl_difficulty_levels', @whereClause
            );
            PREPARE countStmt FROM @countSQL;
            EXECUTE countStmt;
            DEALLOCATE PREPARE countStmt;

            -- 2. Get paginated data
            SET @dataSQL := CONCAT(
                'SELECT * FROM tbl_difficulty_levels',
                @whereClause,
                ' ORDER BY created_at DESC'
            );

            IF p_limit IS NOT NULL AND p_limit != 'ALL' THEN
                SET @dataSQL := CONCAT(@dataSQL, ' LIMIT ', p_limit, ' OFFSET ', p_offset);
            END IF;

            PREPARE dataStmt FROM @dataSQL;
            EXECUTE dataStmt;
            DEALLOCATE PREPARE dataStmt;
        END`);

        // GET ALL ACTIVE
        await sequelize.query(`DROP PROCEDURE IF EXISTS getAllActiveDifficultyLevels`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllActiveDifficultyLevels()
        BEGIN
            SELECT * FROM tbl_difficulty_levels WHERE is_active = 1 ORDER BY name;
        END`);

        // TOGGLE STATUS
        await sequelize.query(`DROP PROCEDURE IF EXISTS toggleDifficultyLevelStatus`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS toggleDifficultyLevelStatus(
            IN p_id INT,
            IN p_updated_by INT
        )
        BEGIN
            IF NOT EXISTS(SELECT 1 FROM tbl_difficulty_levels WHERE id = p_id) THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Difficulty Level not found.';
            ELSE
                UPDATE tbl_difficulty_levels
                SET is_active = NOT is_active,
                    updated_by = p_updated_by,
                    updated_at = NOW()
                WHERE id = p_id;

                SELECT * FROM tbl_difficulty_levels WHERE id = p_id;
            END IF;
        END`);

        // DELETE
        await sequelize.query(`DROP PROCEDURE IF EXISTS deleteDifficultyLevel`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteDifficultyLevel(IN p_id INT)
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM tbl_difficulty_levels WHERE id = p_id) THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Difficulty Level not found.';
            ELSE
                -- Also delete associated tiers
                DELETE FROM tbl_tiers WHERE difficulty_level_id = p_id;
                DELETE FROM tbl_difficulty_levels WHERE id = p_id;
            END IF;
        END`);

        // GET TIERS BY DIFFICULTY LEVEL
        await sequelize.query(`DROP PROCEDURE IF EXISTS getTiersByDifficultyLevel`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getTiersByDifficultyLevel(
            IN p_difficulty_level_id INT
        )
        BEGIN
            SELECT * FROM tbl_tiers 
            WHERE difficulty_level_id = p_difficulty_level_id
            ORDER BY created_at DESC;
        END`);

        console.log("✅ Difficulty Level procedures created!");
    } catch (error) {
        console.error("❌ Error setting up Difficulty Level procedures:", error);
        throw error;
    }
};

module.exports = setupDifficultyLevelProcedures;
