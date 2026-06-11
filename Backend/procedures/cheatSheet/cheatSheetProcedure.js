// utils/procedure/courseCategoryProcedures.js

const sequelize = require("../../config/db");

const setupCheatSheetProcedures = async () => {
    try {
        console.log("🔄 Setting up Course Category procedures...");

        // Procedure: createCourseCategory
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createCheatSheet(
    IN p_title VARCHAR(255),
    IN p_imageUrl VARCHAR(255),
    IN p_description TEXT,
    IN p_isPaid BOOLEAN,
    IN p_price DECIMAL(10, 2),
    IN p_discount DECIMAL(10, 2),
    IN p_isActive BOOLEAN,
    IN p_createdBy INT,
    IN p_updatedBy INT,
    IN p_created_by_type VARCHAR(50),
    IN p_updated_by_type VARCHAR(50)
)
BEGIN
    INSERT INTO tbl_cheat_sheets (
        title, imageUrl, description, isPaid, price, discount, isActive, createdBy, updatedBy, created_by_type, updated_by_type, created_at , updated_at
    ) VALUES (
        p_title, p_imageUrl, p_description, p_isPaid, p_price, p_discount, p_isActive, p_createdBy, p_updatedBy, p_created_by_type, p_updated_by_type,NOW() , NOW()
    );
END`);

        // Procedure: getAllCourseCategories
        await sequelize.query(`DROP PROCEDURE IF EXISTS getAllCheatSheets`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllCheatSheets(
                IN p_created_by VARCHAR(10),
                IN p_createdById INT,
                IN p_search_term VARCHAR(255),
                IN p_limit INT,
                IN p_offset INT,
                IN p_is_all BOOLEAN
            ) 
BEGIN
    SELECT COUNT(*) AS total_count
    FROM tbl_cheat_sheets
    WHERE
        (p_search_term IS NULL
        OR p_search_term = ''
        OR title LIKE CONCAT('%', p_search_term, '%')) 
        AND(p_created_by = 'all'
            OR (p_created_by = 'admin'
                AND created_by_type = 'admin')
            OR (p_created_by = 'partner'
                AND created_by_type = 'partner'
                AND (p_createdById IS NULL OR createdBy = p_createdById)));

    IF p_is_all THEN 
      SELECT *
      FROM tbl_cheat_sheets
      WHERE
          (p_search_term IS NULL
          OR p_search_term = ''
          OR title LIKE CONCAT('%', p_search_term, '%'))
                  AND(p_created_by = 'all'
            OR (p_created_by = 'admin'
                AND created_by_type = 'admin')
            OR (p_created_by = 'partner'
                AND created_by_type = 'partner'
                AND (p_createdById IS NULL OR createdBy = p_createdById)))
      ORDER BY created_at DESC;
    ELSE
      SELECT *
      FROM tbl_cheat_sheets
      WHERE
          (p_search_term IS NULL
          OR p_search_term = ''
          OR title LIKE CONCAT('%', p_search_term, '%'))
                  AND(p_created_by = 'all'
            OR (p_created_by = 'admin'
                AND created_by_type = 'admin')
            OR (p_created_by = 'partner'
                AND created_by_type = 'partner'
                AND (p_createdById IS NULL OR createdBy = p_createdById)))
      ORDER BY created_at DESC
      LIMIT p_limit OFFSET p_offset;
    END IF;
END`);

        await sequelize.query('DROP PROCEDURE IF EXISTS getAllCheatSheetsByRole');
        await sequelize.query(`CREATE PROCEDURE getAllCheatSheetsByRole(
            IN userRole VARCHAR(50),
            IN userId INT,
            IN p_search_term VARCHAR(255),
            IN p_limit INT,
            IN p_offset INT,
            IN p_is_all BOOLEAN
        )
BEGIN
    SELECT COUNT(*) AS total_count
    FROM tbl_cheat_sheets
    WHERE
        (p_search_term IS NULL
        OR p_search_term = ''
        OR title LIKE CONCAT('%', p_search_term, '%')) 
        AND created_by_type = userRole AND createdBy = userId;

    IF p_is_all THEN 
      SELECT *
      FROM tbl_cheat_sheets
      WHERE
          (p_search_term IS NULL
          OR p_search_term = ''
          OR title LIKE CONCAT('%', p_search_term, '%'))
          AND created_by_type = userRole AND createdBy = userId
      ORDER BY created_at DESC;
    ELSE
      SELECT *
      FROM tbl_cheat_sheets
      WHERE
          (p_search_term IS NULL
          OR p_search_term = ''
          OR title LIKE CONCAT('%', p_search_term, '%'))
          AND created_by_type = userRole AND createdBy = userId
      ORDER BY created_at DESC
      LIMIT p_limit OFFSET p_offset;
    END IF;
END
    `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getAllActiveCheatSheets`);
        await sequelize.query(`CREATE PROCEDURE getAllActiveCheatSheets(
            IN p_search_term VARCHAR(255),
            IN p_filter_type VARCHAR(50), 
            IN p_user_id INT,
            IN p_limit INT,
            IN p_offset INT
        ) 
BEGIN
    -- Calculate Total Count
    SELECT COUNT(*) AS total_count
    FROM tbl_cheat_sheets cs
    WHERE cs.isActive = 1
    AND (p_search_term IS NULL OR p_search_term = '' OR cs.title LIKE CONCAT('%', p_search_term, '%'))
    AND (
        p_filter_type = 'all' OR
        (p_filter_type = 'free' AND cs.isPaid = 0) OR
        (p_filter_type = 'paid' AND cs.isPaid = 1) OR
        (p_filter_type = 'purchased' AND EXISTS (
            SELECT 1 FROM tbl_user_cheat_sheets ucs 
            WHERE ucs.cheatsheet_id = cs.id AND ucs.user_id = p_user_id
        ))
    );

    -- Get Data
    SELECT cs.*
    FROM tbl_cheat_sheets cs
    WHERE cs.isActive = 1
    AND (p_search_term IS NULL OR p_search_term = '' OR cs.title LIKE CONCAT('%', p_search_term, '%'))
    AND (
        p_filter_type = 'all' OR
        (p_filter_type = 'free' AND cs.isPaid = 0) OR
        (p_filter_type = 'paid' AND cs.isPaid = 1) OR
        (p_filter_type = 'purchased' AND EXISTS (
            SELECT 1 FROM tbl_user_cheat_sheets ucs 
            WHERE ucs.cheatsheet_id = cs.id AND ucs.user_id = p_user_id
        ))
    )
    ORDER BY cs.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END`);

        // Procedure: getCourseCategoryById
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCheatSheetById(IN p_id INT)
BEGIN
    SELECT * FROM tbl_cheat_sheets WHERE id = p_id;
END`);

        // Procedure: updateCourseCategory
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateCheatSheet(
    IN p_id INT,
    IN p_title VARCHAR(255),
    IN p_imageUrl VARCHAR(255),
    IN p_description TEXT,
    IN p_isPaid BOOLEAN,
    IN p_price DECIMAL(10, 2),
    IN p_discount DECIMAL(10, 2),
    IN p_isActive BOOLEAN,
    IN p_updatedBy INT
)
BEGIN
    UPDATE tbl_cheat_sheets
    SET
        title = p_title,
        imageUrl = p_imageUrl,
        description = p_description,
        isPaid = p_isPaid,
        price = p_price,
        discount = p_discount,
        isActive = p_isActive,
        updatedBy = p_updatedBy
    WHERE id = p_id;
END`);

        // Procedure: deleteCourseCategory
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteCheatSheet(IN p_id INT)
BEGIN
    DELETE FROM tbl_cheat_sheets WHERE id = p_id;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateCheatSheetStatus(IN p_id INT, IN p_status BOOLEAN)
BEGIN
    UPDATE tbl_cheat_sheets
    SET isActive = p_status
    WHERE id = p_id;
END`);

        // Procedure: purchasePaidCheatSheet - Creates payment and grants access
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS purchasePaidCheatSheet(
    IN p_user_id INT,
    IN p_cheatsheet_id INT,
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
    DECLARE payment_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Insert payment record
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
        NULL, -- enrollment_id is null for cheatsheet purchases
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

    -- Get the payment ID
    SET payment_id = LAST_INSERT_ID();

    -- Grant user access to cheatsheet
    INSERT INTO tbl_user_cheat_sheets (
        user_id,
        cheatsheet_id,
        payment_id,
        access_granted_at,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_cheatsheet_id,
        payment_id,
        NOW(),
        NOW(),
        NOW()
    );

    COMMIT;

    -- Return the payment and access details
    SELECT 
        p.id as payment_id,
        p.transaction_id,
        p.amount,
        p.currency,
        p.status,
        ucs.id as user_cheatsheet_id,
        ucs.access_granted_at
    FROM tbl_payments p
    JOIN tbl_user_cheat_sheets ucs ON p.id = ucs.payment_id
    WHERE p.id = payment_id;

END`);

        // Procedure: getUserPaidCheatSheets - Get all paid cheatsheets for a user
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getUserPaidCheatSheets(IN p_user_id INT)
BEGIN
    SELECT 
        cs.id as cheatsheet_id,
        cs.title,
        cs.imageUrl,
        cs.description,
        cs.price,
        cs.discount,
        cs.isPaid,
        cs.isActive,
        ucs.id as user_cheatsheet_id,
        ucs.access_granted_at,
        p.id as payment_id,
        p.amount as paid_amount,
        p.currency,
        p.payment_method,
        p.transaction_id,
        p.status as payment_status,
        p.transaction_date,
        p.payment_gateway,
        p.gateway_response,
        p.notes as payment_notes,
        cs.created_at as cheatsheet_created_at,
        cs.updated_at as cheatsheet_updated_at
    FROM tbl_user_cheat_sheets ucs
    JOIN tbl_cheat_sheets cs ON ucs.cheatsheet_id = cs.id
    LEFT JOIN tbl_payments p ON ucs.payment_id = p.id
    WHERE ucs.user_id = p_user_id
    AND cs.isPaid = 1
    AND cs.isActive = 1
    ORDER BY ucs.access_granted_at DESC;
END`);

        // Procedure: checkUserCheatSheetAccess - Check if user has access to a specific cheatsheet
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS checkUserCheatSheetAccess(
    IN p_user_id INT,
    IN p_cheatsheet_id INT
)
BEGIN
    SELECT 
        ucs.id as user_cheatsheet_id,
        ucs.access_granted_at,
        cs.title,
        cs.isPaid,
        p.status as payment_status,
        CASE 
            WHEN ucs.id IS NOT NULL THEN 1
            ELSE 0
        END as has_access
    FROM tbl_cheat_sheets cs
    LEFT JOIN tbl_user_cheat_sheets ucs ON cs.id = ucs.cheatsheet_id AND ucs.user_id = p_user_id
    LEFT JOIN tbl_payments p ON ucs.payment_id = p.id
    WHERE cs.id = p_cheatsheet_id;
END`);

        console.log("✅ Course Category procedures created!");
    } catch (error) {
        console.error("❌ Error setting up course category procedures:", error);
        throw error;
    }
};

module.exports = setupCheatSheetProcedures;
