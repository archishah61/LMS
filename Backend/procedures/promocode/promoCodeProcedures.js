const sequelize = require("../../config/db");

const setupPromoCodeProcedures = async () => {
    try {

        await sequelize.query(`DROP PROCEDURE IF EXISTS generatePromoCodes`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS generatePromoCodes(
    IN p_course_ids_json JSON,
    IN p_user_ids_json JSON,
    IN p_created_by INT,
    IN p_created_by_type VARCHAR(20)
)
BEGIN
    DECLARE v_last_batch_number VARCHAR(6);
    DECLARE v_next_num INT;
    DECLARE v_formatted_batch_number VARCHAR(6);
    DECLARE v_user_id INT;
    DECLARE v_length INT DEFAULT 0;
    DECLARE i INT DEFAULT 0;
    DECLARE v_new_promo_code VARCHAR(10);
    DECLARE v_batch_id INT;

    -- Get last batch
    SELECT batch_number INTO v_last_batch_number
    FROM tbl_batches
    ORDER BY id DESC
    LIMIT 1;

    IF v_last_batch_number IS NULL THEN
        SET v_next_num = 1;
    ELSE
        SET v_next_num = CAST(v_last_batch_number AS UNSIGNED) + 1;
    END IF;

    -- Format number: 000001
    SET v_formatted_batch_number = LPAD(v_next_num, 6, '0');

    -- Create batch
    INSERT INTO tbl_batches (
        batch_number,
        created_by,
        updated_by,
        created_by_type,
        updated_by_type,
        created_at,
        updated_at
    )
    VALUES (
        v_formatted_batch_number,
        p_created_by,
        p_created_by,
        p_created_by_type,
        p_created_by_type,
        NOW(),
        NOW()
    );

    SET v_batch_id = LAST_INSERT_ID();

    -- Length of user_ids array
    SET v_length = JSON_LENGTH(p_user_ids_json);

    -- Loop through all user_ids
    WHILE i < v_length DO
        SET v_user_id = JSON_EXTRACT(p_user_ids_json, CONCAT('$[', i, ']'));

        -- Generate promo code (UUID-based 6 chars with hyphen)
        SET v_new_promo_code = CONCAT(
            UPPER(SUBSTRING(REPLACE(UUID(), '-', ''), 1, 3)),
            '-',
            UPPER(SUBSTRING(REPLACE(UUID(), '-', ''), 4, 3))
        );

        -- Insert promo code
        INSERT INTO tbl_promo_codes (
            batch_id,
            course_ids,
            user_id,
            code,
            created_by,
            updated_by,
            created_by_type,
            updated_by_type,
            created_at,
            updated_at
        )
        VALUES (
            v_batch_id,
            p_course_ids_json,
            v_user_id,
            v_new_promo_code,
            p_created_by,
            p_created_by,
            p_created_by_type,
            p_created_by_type,
            NOW(),
            NOW()
        );

        -- Update user table
        UPDATE tbl_users
        SET isPromoCodeGenerated = TRUE
        WHERE id = v_user_id;

        SET i = i + 1;
    END WHILE;

    -- Return batch + promos
    SELECT 
        v_formatted_batch_number AS batch_number,
        v_batch_id AS batch_id;

    SELECT * FROM tbl_promo_codes WHERE batch_id = v_batch_id;

END;
`)
        await sequelize.query(`DROP PROCEDURE IF EXISTS getAllBatches`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllBatches(
            IN p_searchTerm VARCHAR(255),
            IN p_createdFrom DATETIME,
            IN p_createdTo DATETIME,
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
        FROM tbl_batches
            WHERE (p_searchTerm IS NULL OR p_searchTerm = '' OR batch_number LIKE CONCAT('%', p_searchTerm, '%'))
            AND (p_createdFrom IS NULL OR DATE(created_at) >= DATE(p_createdFrom))
            AND (p_createdTo IS NULL OR DATE(created_at) <= DATE(p_createdTo));

        -- We return batches + count of promo codes per batch.
        -- Equivalent of your Sequelize include + map.

        SELECT 
            b.id,
            b.batch_number,
            b.created_at,
            (
                SELECT COUNT(*)
                FROM tbl_promo_codes p
                WHERE p.batch_id = b.id AND p.user_id IS NOT NULL
            ) AS total_assigned_users
        FROM tbl_batches b
        WHERE (p_searchTerm IS NULL OR p_searchTerm = '' OR b.batch_number LIKE CONCAT('%', p_searchTerm, '%'))
        AND (p_createdFrom IS NULL OR DATE(b.created_at) >= DATE(p_createdFrom))
        AND (p_createdTo IS NULL OR DATE(b.created_at) <= DATE(p_createdTo))
        ORDER BY b.id DESC
        LIMIT v_limit OFFSET v_offset;

    END;`)

        await sequelize.query(`DROP PROCEDURE IF EXISTS getUsersByBatchId`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getUsersByBatchId(
    IN p_batch_id INT
)
BEGIN
    -- 1. Get promo codes for this batch
    SELECT 
        pc.id AS promo_id,
        pc.code AS promo_code,
        pc.user_id,
        pc.course_ids,
        pc.created_at
    FROM tbl_promo_codes pc
    WHERE pc.batch_id = p_batch_id;

    -- 2. Get users for these promo codes
    SELECT *
    FROM tbl_users
    WHERE id IN (
        SELECT user_id FROM tbl_promo_codes WHERE batch_id = p_batch_id AND user_id IS NOT NULL
    );

    -- 3. Get courses used by promo codes
    SELECT id, title
    FROM tbl_courses
    WHERE id IN (
        SELECT DISTINCT JSON_EXTRACT(pc.course_ids, '$[*]')
        FROM tbl_promo_codes pc
        WHERE pc.batch_id = p_batch_id
    );
END;
`)

        await sequelize.query(`DROP PROCEDURE IF EXISTS verifyPromoCode`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS verifyPromoCode(
    IN p_user_id INT,
    IN p_course_id INT,
    IN p_code VARCHAR(20)
)
BEGIN
    DECLARE v_course_ids JSON;

    -- Get promo
    SELECT course_ids
    INTO v_course_ids
    FROM tbl_promo_codes
    WHERE user_id = p_user_id AND code = p_code
    LIMIT 1;

    IF v_course_ids IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid promo code', MYSQL_ERRNO = 4001;
    END IF;

    -- Check if course exists inside JSON array
    IF JSON_CONTAINS(v_course_ids, JSON_ARRAY(p_course_id)) = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Promo code not valid for this course', MYSQL_ERRNO = 4002;
    END IF;

    -- Mark verified
    UPDATE tbl_promo_codes
    SET isVerified = TRUE
    WHERE user_id = p_user_id AND code = p_code;

    -- Return promo
    SELECT * 
    FROM tbl_promo_codes
    WHERE user_id = p_user_id AND code = p_code;
END;
`)

        await sequelize.query(`DROP PROCEDURE IF EXISTS checkPromoVerified`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS checkPromoVerified(
    IN p_user_id INT,
    IN p_course_id INT
)
BEGIN
    DECLARE v_course_ids JSON;

    SELECT course_ids
    INTO v_course_ids
    FROM tbl_promo_codes
    WHERE user_id = p_user_id AND isVerified = TRUE
    LIMIT 1;

    IF v_course_ids IS NULL THEN
        SELECT FALSE AS isVerified;
    ELSE
        IF JSON_CONTAINS(v_course_ids, JSON_ARRAY(p_course_id)) = 1 THEN
            SELECT TRUE AS isVerified;
        ELSE
            SELECT FALSE AS isVerified;
        END IF;
    END IF;
END;
`)

    } catch (error) {
        console.error("❌ Error setting up enrollment procedures:", error);
        throw error;
    }
}

module.exports = setupPromoCodeProcedures;
