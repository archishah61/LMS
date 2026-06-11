// utils/procedure/courseCategoryProcedures.js

const sequelize = require("../../config/db");

const setupChallengeCategoryProcedures = async () => {
    try {
        console.log("🔄 Setting up challenge category procedures...");

        // Procedure: createCourseCategory
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createChallengeCategory (
    IN p_category VARCHAR(255),
    IN p_created_by INT
)
BEGIN
    DECLARE duplicate_exists INT;

    -- Check for duplicate category name
    SELECT COUNT(*) INTO duplicate_exists
    FROM tbl_challenge_categories
    WHERE category = p_category;

    IF duplicate_exists > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E409|ConflictError|Challenge category with this name already exists';
    ELSE
        INSERT INTO tbl_challenge_categories (
            category, is_active, created_by, updated_by, created_at, updated_at
        )
        VALUES (
            p_category, TRUE, p_created_by, p_created_by, NOW(), NOW()
        );
    END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getAllChallengeCategories`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllChallengeCategories(
            IN p_sort_by VARCHAR(20),
            IN p_status VARCHAR(10)
            )
            BEGIN
                SELECT * FROM tbl_challenge_categories
                    WHERE (p_status IS NULL OR 
                        p_status = 'all' OR 
                        (p_status = 'active' AND is_active = TRUE) OR 
                        (p_status = 'inactive' AND is_active = FALSE))
                ORDER BY
                    CASE WHEN p_sort_by = 'name' THEN category END ASC,
                    CASE WHEN p_sort_by = 'status' THEN is_active END ASC,
                    created_at DESC;
            END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getChallengeCategoryById(IN p_id INT)
BEGIN
    SELECT * FROM tbl_challenge_categories WHERE id = p_id;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateChallengeCategory (
    IN p_id INT,
    IN p_category VARCHAR(255),
    IN p_updated_by INT
)
BEGIN
    DECLARE duplicate_exists INT;

    -- Check if another category with the same name already exists
    SELECT COUNT(*) INTO duplicate_exists
    FROM tbl_challenge_categories
    WHERE category = p_category AND id != p_id;

    IF duplicate_exists > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E409|ConflictError|Challenge category with this name already exists';
    ELSE
        UPDATE tbl_challenge_categories
        SET category = p_category,
            updated_by = p_updated_by,
            updated_at = NOW()
        WHERE id = p_id;
    END IF;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteChallengeCategory(IN p_id INT)
BEGIN
    DELETE FROM tbl_challenge_categories WHERE id = p_id;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS toggleChallengeCategoryStatus(IN p_id INT)
BEGIN
    UPDATE tbl_challenge_categories
    SET is_active = NOT is_active,
        updated_at = NOW()
    WHERE id = p_id;
END`);

        console.log("✅ Course procedures created!");
    } catch (error) {
        console.error("❌ Error setting challenge category procedures:", error);
        throw error;
    }
};

module.exports = setupChallengeCategoryProcedures;
