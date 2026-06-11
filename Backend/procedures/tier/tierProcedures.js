const sequelize = require("../../config/db");

const setupTierProcedures = async () => {
    try {
        console.log("🔄 Setting up Tier procedures...");

        await sequelize.query(`DROP PROCEDURE IF EXISTS createTier`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createTier(
            IN p_name ENUM('basic', 'standard', 'premium'),
            IN p_price DECIMAL(10, 2),
            IN p_max_sessions INT,
            IN p_max_modules_per_session INT,
            IN p_max_topics_per_module INT,
            IN p_max_assignments_per_module INT,
            IN p_max_quizzes_per_module INT,
            IN p_created_by INT,
            IN p_updated_by INT,
            IN p_difficulty_level_id INT
        )
        BEGIN
        DECLARE v_exists INT DEFAULT 0;

        -- Check if tier name already exists
        SELECT COUNT(*) INTO v_exists
        FROM tbl_tiers
        WHERE name = p_name;

        INSERT INTO tbl_tiers(
            name, price, max_sessions, max_modules_per_session, max_topics_per_module,
            max_assignments_per_module, max_quizzes_per_module, created_by, updated_by,
            is_active, created_at, updated_at, difficulty_level_id
        ) VALUES(
            p_name, p_price, p_max_sessions, p_max_modules_per_session, p_max_topics_per_module,
            p_max_assignments_per_module, p_max_quizzes_per_module, p_created_by, p_updated_by,
            CASE WHEN v_exists > 0 THEN FALSE ELSE TRUE END, NOW(), NOW(), p_difficulty_level_id
        );

        SELECT * FROM tbl_tiers WHERE id = LAST_INSERT_ID();
        END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS updateTier`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateTier(
            IN p_id INT,
            IN p_name ENUM('basic', 'standard', 'premium'),
            IN p_price DECIMAL(10, 2),
            IN p_max_sessions INT,
            IN p_max_modules_per_session INT,
            IN p_max_topics_per_module INT,
            IN p_max_assignments_per_module INT,
            IN p_max_quizzes_per_module INT,
            IN p_updated_by INT,
            IN p_difficulty_level_id INT
        )
        BEGIN
        -- Check if tier exists
    IF NOT EXISTS(SELECT 1 FROM tbl_tiers WHERE id = p_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tier not found.';
    ELSE
        UPDATE tbl_tiers
        SET name = p_name,
            price = p_price,
            max_sessions = p_max_sessions,
            max_modules_per_session = p_max_modules_per_session,
            max_topics_per_module = p_max_topics_per_module,
            max_assignments_per_module = p_max_assignments_per_module,
            max_quizzes_per_module = p_max_quizzes_per_module,
            updated_by = p_updated_by,
            updated_at = NOW(),
            difficulty_level_id = p_difficulty_level_id
        WHERE id = p_id;

        SELECT * FROM tbl_tiers WHERE id = p_id;
    END IF;
        END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getAllTiers`);
        await sequelize.query(`CREATE PROCEDURE getAllTiers(
            IN p_search_term VARCHAR(255),
            IN p_sort_by VARCHAR(20),
            IN p_type VARCHAR(20),
            IN p_limit VARCHAR(10),
            IN p_offset INT
        )
        BEGIN
    SET @whereClause := ' WHERE 1 = 1';

    IF p_search_term IS NOT NULL AND p_search_term != '' THEN
        SET @whereClause := CONCAT(@whereClause,
            ' AND (name LIKE "%', p_search_term, '%")');
    END IF;

    IF p_type IS NOT NULL AND p_type != '' AND p_type != 'all' THEN
        SET @whereClause := CONCAT(@whereClause,
            ' AND (name = ''', p_type, ''')');
    END IF;

    -- 1. Get total count
    SET @countSQL := CONCAT(
            'SELECT COUNT(*) AS total_count FROM tbl_tiers', @whereClause
        );
    PREPARE countStmt FROM @countSQL;
    EXECUTE countStmt;
    DEALLOCATE PREPARE countStmt;

    -- 2. Get paginated data
    SET @dataSQL := CONCAT(
            'SELECT * FROM tbl_tiers',
            @whereClause,
            ' ORDER BY
                CASE WHEN ''name'' = ''', p_sort_by, ''' THEN name END ASC,
                CASE WHEN ''price'' = ''', p_sort_by, ''' THEN price END DESC,
                created_at DESC'
        );

    IF p_limit IS NOT NULL AND p_limit != 'ALL' THEN
        SET @dataSQL := CONCAT(@dataSQL, ' LIMIT ', p_limit, ' OFFSET ', p_offset);
    END IF;

    PREPARE dataStmt FROM @dataSQL;
    EXECUTE dataStmt;
    DEALLOCATE PREPARE dataStmt;
        END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getAllActiveTiers`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllActiveTiers()
        BEGIN
    SET @sql = 'SELECT * FROM tbl_tiers WHERE is_active = 1 ORDER BY name';

    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
        END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS toggleTierStatus`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS toggleTierStatus(
    IN p_id INT,
    IN p_updated_by INT
)
BEGIN
    DECLARE v_name ENUM('basic','standard','premium');
    DECLARE v_current_status BOOLEAN;
    DECLARE v_difficulty_level_id INT;

    -- Check if tier exists
    IF NOT EXISTS(SELECT 1 FROM tbl_tiers WHERE id = p_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tier not found.';
    ELSE
        -- Get current tier name and status
        SELECT name, is_active, difficulty_level_id INTO v_name, v_current_status, v_difficulty_level_id
        FROM tbl_tiers
        WHERE id = p_id;

        -- If going to activate this tier
        IF v_current_status = FALSE THEN
            -- Deactivate all others with same name
            UPDATE tbl_tiers
            SET is_active = FALSE,
                updated_by = p_updated_by,
                updated_at = NOW()
            WHERE name = v_name AND difficulty_level_id = v_difficulty_level_id AND id <> p_id;
        END IF;

        -- Toggle this tier
        UPDATE tbl_tiers
        SET is_active = NOT is_active,
            updated_by = p_updated_by,
            updated_at = NOW()
        WHERE id = p_id;

        -- Return updated row
        SELECT * FROM tbl_tiers WHERE id = p_id;
    END IF;
        END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS deleteTier`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteTier(IN p_id INT)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tbl_tiers WHERE id = p_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tier not found.';
    ELSE
        DELETE FROM tbl_tiers WHERE id = p_id;
    END IF;
        END`);

        // Purchase Tier

        await sequelize.query(`DROP PROCEDURE IF EXISTS purchaseCourseGeneration`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS purchaseCourseGeneration (
    IN p_user_id INT,
    IN p_tier_id INT,
    IN p_course_generation_history_id INT,
    IN p_amount FLOAT,
    IN p_currency VARCHAR(10),
    IN p_payment_method VARCHAR(100),
    IN p_transaction_id VARCHAR(255),
    IN p_reference_id VARCHAR(255),
    IN p_status ENUM('pending', 'completed', 'failed', 'refunded'),
    IN p_notes VARCHAR(255),
    IN p_payment_gateway VARCHAR(255),
    IN p_gateway_response JSON,
    IN p_created_by INT
)
BEGIN
    DECLARE v_payment_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Insert into payments table
    INSERT INTO tbl_payments (
        enrollment_id,
        amount,
        currency,
        payment_method,
        payment_gateway,
        gateway_response,
        transaction_id,
        reference_id,
        status,
        transaction_date,
        notes,
        created_by,
        updated_by,
        created_at,
        updated_at
    ) VALUES (
        NULL,
        p_amount,
        p_currency,
        p_payment_method,
        p_payment_gateway,
        p_gateway_response,
        p_transaction_id,
        p_reference_id,
        p_status,
        NOW(),
        p_notes,
        p_created_by,
        p_created_by,
        NOW(),
        NOW()
    );

    -- Get inserted payment id
    SET v_payment_id = LAST_INSERT_ID();

    -- Insert into course generation payments
    INSERT INTO tbl_course_generation_payments (
        user_id,
        payment_id,
        tier_id,
        course_generation_history_id,
        generation_complete,
        generated_course_id,
        paid_at,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        v_payment_id,
        p_tier_id,
        p_course_generation_history_id,
        FALSE,
        NULL,
        NOW(),
        NOW(),
        NOW()
    );

    COMMIT;

    -- Return details
    SELECT 
        p.id AS payment_id,
        p.transaction_id,
        p.amount,
        p.currency,
        p.status,
        cgp.id AS course_generation_payment_id,
        cgp.tier_id,
        cgp.generation_complete,
        cgp.paid_at
    FROM tbl_payments p
    JOIN tbl_course_generation_payments cgp 
      ON p.id = cgp.payment_id
    WHERE p.id = v_payment_id;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS updateGeneratedCourse`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateGeneratedCourse (
    IN p_course_gen_payment_id INT,
    IN p_generated_course_id INT
)
BEGIN

    DECLARE v_course_generation_history_id INT;

    SELECT course_generation_history_id INTO v_course_generation_history_id
        FROM tbl_course_generation_payments
        WHERE id = p_course_gen_payment_id;

    UPDATE tbl_course_generation_payments
    SET generated_course_id = p_generated_course_id,
        generation_complete = TRUE,
        updated_at = NOW()
    WHERE id = p_course_gen_payment_id;
    
    UPDATE tbl_course_generation_history
    SET is_generated = TRUE,
        updated_at = NOW()
    WHERE id = v_course_generation_history_id;

    -- Return updated record
    SELECT * 
    FROM tbl_course_generation_payments 
    WHERE id = p_course_gen_payment_id;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getCourseGenerationPaymentById`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCourseGenerationPaymentById (
    IN p_course_gen_payment_id INT
)
BEGIN
    SELECT 
        *
    FROM tbl_course_generation_payments
    WHERE id = p_course_gen_payment_id;
END`);

        console.log("✅ Tier procedures created!");
    } catch (error) {
        console.error("❌ Error setting up Tier procedures:", error);
        throw error;
    }
};

module.exports = setupTierProcedures;
