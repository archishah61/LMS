// utils/procedure/paymentProcedures.js

const sequelize = require("../../config/db");

const setupPaymentProcedures = async () => {
  try {
    console.log("🔄 Setting up Payment procedures...");

    // Create Payment
    await sequelize.query(`DROP PROCEDURE IF EXISTS createPayment`)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createPayment(
  IN p_enrollment_id INT,
  IN p_contest_id INT,
  IN p_amount FLOAT,
  IN p_currency VARCHAR(100),
  IN p_payment_method VARCHAR(100),
  IN p_payment_gateway VARCHAR(100),
  IN p_gateway_response JSON,
  IN p_transaction_id VARCHAR(100),
  IN p_reference_id VARCHAR(100),
  In p_status ENUM('pending', 'completed', 'failed', 'refunded'),
  IN p_notes VARCHAR(255),
  IN p_user_id INT
)
BEGIN
  DECLARE enrollment_exists INT;

  -- Check if the enrollment exists
  SELECT COUNT(*) INTO enrollment_exists FROM tbl_enrollments WHERE id = p_enrollment_id;

  IF enrollment_exists = 0 AND p_contest_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|Enrollment not Found.',
    MYSQL_ERRNO = 4001;
  END IF;

  -- Insert payment
  INSERT INTO tbl_payments (
    enrollment_id,
    contest_id,
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
  )
  VALUES (
    p_enrollment_id,
    p_contest_id,
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
    p_user_id,
    p_user_id,
    NOW(),
    NOW()
  );

  -- Return the inserted payment
  SELECT * FROM tbl_payments WHERE id = LAST_INSERT_ID();
END
`);

    // Get All Payments
    await sequelize.query(`DROP PROCEDURE IF EXISTS getAllPayments`);
    await sequelize.query(`CREATE PROCEDURE getAllPayments(
    IN p_search_term VARCHAR(255),
    IN p_payment_type ENUM('course-enroll', 'cheatsheet', 'course-generation', 'contest-enroll', 'all'),
    IN p_limit INT,
    IN p_offset INT,
    IN p_role ENUM('partner', 'admin'),
    IN p_id INT
)
BEGIN
    DECLARE v_limit_val BIGINT;
    DECLARE v_offset_val BIGINT;
    
    IF p_offset > 0 THEN
      SET v_offset_val = p_offset;
    ELSE
      SET v_offset_val = 0;
    END IF;

    -- Handle 'ALL' limit case
    IF p_limit = -1 THEN
        SET v_limit_val = 9223372036854775807; -- Maximum value for LIMIT
    ELSE
        SET v_limit_val = p_limit;
    END IF;

SELECT 
  COUNT(*) OVER() AS total_entries,
  t.*
    FROM (
    -- Course Enrollment Payments
    SELECT 
        'course-enroll' as payment_type,
        p.id as payment_id,
        p.amount,
        p.currency,
        p.payment_method,
        p.payment_gateway,
        p.transaction_id,
        p.reference_id,
        p.status as payment_status,
        p.transaction_date,
        p.created_at,
        p.updated_at,
        c.title as item_title,
        c.price as item_price,
        c.discount as item_discount,
        NULL as tier_name,
        NULL as tier_price,
        u.id as user_id,
        u.username,
        u.email,
        e.enrollment_date,
        e.expiry_date,
        p.notes,
        NULL as cheatsheet_title,
        NULL as course_generation_tier,
        c.id as course_id
    FROM tbl_payments p
    INNER JOIN tbl_enrollments e ON p.enrollment_id = e.id
    INNER JOIN tbl_courses c ON e.course_id = c.id
    INNER JOIN tbl_users u ON e.user_id = u.id
    WHERE (p_search_term IS NULL OR p_search_term = '' OR 
           c.title LIKE CONCAT('%', p_search_term, '%') OR 
           u.username LIKE CONCAT('%', p_search_term, '%') OR 
           u.email LIKE CONCAT('%', p_search_term, '%') OR
           p.transaction_id LIKE CONCAT('%', p_search_term, '%'))
      AND (p_payment_type = 'all' OR p_payment_type = 'course-enroll')
      AND (
            p_role = 'admin' 
            OR (p_role = 'partner' AND c.created_by = p_id AND c.created_by_type = 'partner')
          )

    UNION ALL

    -- Cheatsheet Payments
    SELECT 
        'cheatsheet' as payment_type,
        p.id as payment_id,
        p.amount,
        p.currency,
        p.payment_method,
        p.payment_gateway,
        p.transaction_id,
        p.reference_id,
        p.status as payment_status,
        p.transaction_date,
        p.created_at,
        p.updated_at,
        NULL as item_title,
        cs.price as item_price,
        cs.discount as item_discount,
        NULL as tier_name,
        NULL as tier_price,
        u.id as user_id,
        u.username,
        u.email,
        ucs.access_granted_at as enrollment_date,
        NULL as expiry_date,
        p.notes,
        cs.title as cheatsheet_title,
        NULL as course_generation_tier,
        NULL as course_id
    FROM tbl_payments p
    INNER JOIN tbl_user_cheat_sheets ucs ON p.id = ucs.payment_id
    INNER JOIN tbl_cheat_sheets cs ON ucs.cheatsheet_id = cs.id
    INNER JOIN tbl_users u ON ucs.user_id = u.id
    WHERE (p_search_term IS NULL OR p_search_term = '' OR 
           cs.title LIKE CONCAT('%', p_search_term, '%') OR 
           u.username LIKE CONCAT('%', p_search_term, '%') OR 
           u.email LIKE CONCAT('%', p_search_term, '%') OR
           p.transaction_id LIKE CONCAT('%', p_search_term, '%'))
      AND (p_payment_type = 'all' OR p_payment_type = 'cheatsheet')
      AND (
            p_role = 'admin' 
            OR (p_role = 'partner' AND cs.createdBy = p_id AND cs.created_by_type = 'partner')
          )
    UNION ALL

    -- Course Generation Tier Payments
    SELECT 
        'course-generation' as payment_type,
        p.id as payment_id, -- Changed from cgp.id to p.id to use the actual payment ID
        p.amount,
        p.currency,
        p.payment_method,
        p.payment_gateway,
        p.transaction_id,
        p.reference_id,
        p.status as payment_status,
        p.transaction_date,
        p.created_at,
        p.updated_at,
        COALESCE(c.title, 'Course Generation (In Progress)') as item_title,
        t.price as item_price,
        NULL as item_discount,
        t.name as tier_name,
        t.price as tier_price,
        u.id as user_id,
        u.username,
        u.email,
        cgp.created_at as enrollment_date,
        NULL as expiry_date,
        p.notes,
        NULL as cheatsheet_title,
        t.name as course_generation_tier,
        cgp.generated_course_id as course_id
    FROM tbl_payments p
    INNER JOIN tbl_course_generation_payments cgp ON p.id = cgp.payment_id
    INNER JOIN tbl_tiers t ON cgp.tier_id = t.id
    INNER JOIN tbl_users u ON cgp.user_id = u.id
    LEFT JOIN tbl_courses c ON cgp.generated_course_id = c.id
    WHERE (p_search_term IS NULL OR p_search_term = '' OR 
          t.name LIKE CONCAT('%', p_search_term, '%') OR 
          u.username LIKE CONCAT('%', p_search_term, '%') OR 
          u.email LIKE CONCAT('%', p_search_term, '%') OR
          p.transaction_id LIKE CONCAT('%', p_search_term, '%') OR
          COALESCE(c.title, '') LIKE CONCAT('%', p_search_term, '%'))
      AND (p_payment_type = 'all' OR p_payment_type = 'course-generation')
      AND (
            p_role = 'admin' 
            OR (p_role = 'partner' AND c.created_by = p_id AND c.created_by_type = 'partner')
          )
    
    UNION ALL

    -- Contest Enrollment Payments
    SELECT 
        'contest-enroll' as payment_type,
        p.id as payment_id,
        p.amount,
        p.currency,
        p.payment_method,
        p.payment_gateway,
        p.transaction_id,
        p.reference_id,
        p.status as payment_status,
        p.transaction_date,
        p.created_at,
        p.updated_at,
        con.title as item_title,
        con.enrollment_fee as item_price,
        NULL as item_discount,
        NULL as tier_name,
        NULL as tier_price,
        u.id as user_id,
        u.username,
        u.email,
        NULL as enrollment_date,
        NULL as expiry_date,
        p.notes,
        NULL as cheatsheet_title,
        NULL as course_generation_tier,
        con.id as course_id
    FROM tbl_payments p
    INNER JOIN tbl_contests con ON p.contest_id = con.id
    INNER JOIN tbl_users u ON p.created_by = u.id
    WHERE (p_search_term IS NULL OR p_search_term = '' OR 
          con.title LIKE CONCAT('%', p_search_term, '%') OR 
          u.username LIKE CONCAT('%', p_search_term, '%') OR 
          u.email LIKE CONCAT('%', p_search_term, '%') OR
          p.transaction_id LIKE CONCAT('%', p_search_term, '%'))
      AND (p_payment_type = 'all' OR p_payment_type = 'contest-enroll')
      AND (
            p_role = 'admin' 
            -- OR (p_role = 'partner' AND con.created_by = p_id)
          )
    ) t
ORDER BY t.transaction_date DESC, t.created_at DESC
LIMIT v_limit_val OFFSET v_offset_val;

END`);

    // Get Payment By ID ❌ (Unused)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getPaymentById(
      IN p_id INT
    )
    BEGIN
      DECLARE payment_exists INT;

      SELECT COUNT(*) INTO payment_exists FROM tbl_payments WHERE id = p_id;

      IF payment_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Payment not found.',
        MYSQL_ERRNO = 4002;
      END IF;

      SELECT * FROM tbl_payments WHERE id = p_id;
    END
    `);

    // Get Payments By User ID
    await sequelize.query(`DROP PROCEDURE IF EXISTS getPaymentsByUserId`);
    await sequelize.query(`CREATE PROCEDURE getPaymentsByUserId(IN input_user_id INT)
BEGIN
    SELECT 
        -- Payments
        'course-enroll' AS type,
        p.id AS payment_id,
        p.enrollment_id,
        p.amount,
        p.currency,
        p.payment_method,
        p.payment_gateway,
        p.gateway_response,
        p.transaction_id,
        p.reference_id,
        p.status AS payment_status,
        p.transaction_date,
        p.notes AS payment_notes,
        p.created_by AS payment_created_by,
        p.updated_by AS payment_updated_by,
        p.created_at AS payment_created_at,
        p.updated_at AS payment_updated_at,

        -- Enrollments
        e.id AS enrollment_id,
        e.user_id AS enrolled_user_id,
        e.course_id AS enrolled_course_id,
        e.user_hash,
        e.enrollment_date,
        e.expiry_date,
        e.status AS enrollment_status,
        e.created_by AS enrollment_created_by,
        e.updated_by AS enrollment_updated_by,
        e.created_at AS enrollment_created_at,
        e.updated_at AS enrollment_updated_at,

        -- Courses
        c.id AS course_id,
        c.public_hash,
        c.sequence,
        c.title AS course_title,
        c.description AS course_description,
        c.category_id,
        c.thumbnail,
        c.preview_video,
        c.price AS course_price,
        c.discount AS course_discount,
        c.duration_minutes,
        c.expiry_days,
        c.what_you_will_learn,
        c.is_points_enrollable,
        c.points_to_enroll,
        c.prerequisites,
        c.hashtags,
        c.embedding,
        c.status AS course_status,
        c.min_access_minutes,
        c.max_access_minutes,
        c.generated_by,
        c.created_by AS course_created_by,
        c.created_by_type,
        c.updated_by AS course_updated_by,
        c.updated_by_type,
        c.created_at AS course_created_at,
        c.updated_at AS course_updated_at,

        -- Tier info
        NULL AS tier_id,
        NULL AS tier_name,
        NULL AS tier_price,

        -- Contest info
        NULL AS contest_id,
        NULL AS contest_name,
        NULL AS contest_description,
        NULL AS contest_banner

    FROM tbl_payments p
    INNER JOIN tbl_enrollments e ON p.enrollment_id = e.id
    INNER JOIN tbl_courses c ON e.course_id = c.id
    WHERE e.user_id = input_user_id

    UNION ALL

    -- Course generation payments
    SELECT 
        -- Payments (mapped to same columns)
        'course-generation' AS type,
        p.id AS payment_id,
        NULL AS enrollment_id,
        p.amount,
        p.currency,
        p.payment_method,
        p.payment_gateway,
        p.gateway_response,
        p.transaction_id,
        p.reference_id,
        p.status AS payment_status,
        p.transaction_date,
        p.notes AS payment_notes,
        p.created_by AS payment_created_by,
        p.updated_by AS payment_updated_by,
        p.created_at AS payment_created_at,
        p.updated_at AS payment_updated_at,

        -- "Enrollments" → use NULLs to keep schema consistent
        NULL AS enrollment_id,
        NULL AS enrolled_user_id,
        NULL AS enrolled_course_id,
        NULL AS user_hash,
        NULL AS enrollment_date,
        NULL AS expiry_date,
        NULL AS enrollment_status,
        NULL AS enrollment_created_by,
        NULL AS enrollment_updated_by,
        NULL AS enrollment_created_at,
        NULL AS enrollment_updated_at,

        -- Generated Course (if present)
        gc.id AS course_id,
        gc.public_hash,
        gc.sequence,
        gc.title AS course_title,
        gc.description AS course_description,
        gc.category_id,
        gc.thumbnail,
        gc.preview_video,
        gc.price AS course_price,
        gc.discount AS course_discount,
        gc.duration_minutes,
        gc.expiry_days,
        gc.what_you_will_learn,
        gc.is_points_enrollable,
        gc.points_to_enroll,
        gc.prerequisites,
        gc.hashtags,
        gc.embedding,
        gc.status AS course_status,
        gc.min_access_minutes,
        gc.max_access_minutes,
        gc.generated_by,
        gc.created_by AS course_created_by,
        gc.created_by_type,
        gc.updated_by AS course_updated_by,
        gc.updated_by_type,
        gc.created_at AS course_created_at,
        gc.updated_at AS course_updated_at,

        -- Tier info
        t.id AS tier_id,
        t.name AS tier_name,
        t.price AS tier_price,

        -- Contest info
        NULL AS contest_id,
        NULL AS contest_name,
        NULL AS contest_description,
        NULL AS contest_banner

    FROM tbl_payments p
    INNER JOIN tbl_course_generation_payments cgp ON p.id = cgp.payment_id
    LEFT JOIN tbl_courses gc ON cgp.generated_course_id = gc.id
    LEFT JOIN tbl_tiers t ON cgp.tier_id = t.id
    WHERE cgp.user_id = input_user_id

    UNION ALL

    -- Contest enrollment payments
    SELECT 
        -- Payments
        'contest-enroll' AS type,
        p.id AS payment_id,
        NULL AS enrollment_id,
        p.amount,
        p.currency,
        p.payment_method,
        p.payment_gateway,
        p.gateway_response,
        p.transaction_id,
        p.reference_id,
        p.status AS payment_status,
        p.transaction_date,
        p.notes AS payment_notes,
        p.created_by AS payment_created_by,
        p.updated_by AS payment_updated_by,
        p.created_at AS payment_created_at,
        p.updated_at AS payment_updated_at,

        -- Enrollment-like fields (contest enrollment)
        NULL AS enrollment_id,
        NULL AS enrolled_user_id,
        NULL AS enrolled_course_id,
        NULL AS user_hash,
        NULL AS enrollment_date,
        NULL AS expiry_date,
        NULL AS enrollment_status,
        NULL AS enrollment_created_by,
        NULL AS enrollment_updated_by,
        NULL AS enrollment_created_at,
        NULL AS enrollment_updated_at,

        -- Contest info mapped to course columns
        NULL AS course_id,
        NULL AS public_hash,
        NULL AS sequence,
        NULL AS course_title,
        NULL AS course_description,
        NULL AS category_id,
        NULL AS thumbnail,
        NULL AS preview_video,
        NULL AS course_price,
        NULL AS course_discount,
        NULL AS duration_minutes,
        NULL AS expiry_days,
        NULL AS what_you_will_learn,
        NULL AS is_points_enrollable,
        NULL AS points_to_enroll,
        NULL AS prerequisites,
        NULL AS hashtags,
        NULL AS embedding,
        NULL AS course_status,
        NULL AS min_access_minutes,
        NULL AS max_access_minutes,
        NULL AS generated_by,
        NULL AS course_created_by,
        NULL AS created_by_type,
        NULL AS course_updated_by,
        NULL AS updated_by_type,
        NULL AS course_created_at,
        NULL AS course_updated_at,

        -- Tier info
        NULL AS tier_id,
        NULL AS tier_name,
        NULL AS tier_price,

        -- Contest info
        con.id AS contest_id,
        con.title AS contest_name,
        con.description AS contest_description,
        con.banner_url AS contest_banner

    FROM tbl_payments p
    INNER JOIN tbl_contests con ON p.contest_id = con.id
    INNER JOIN tbl_users u ON p.created_by = u.id
    WHERE u.id = input_user_id AND p.status = 'completed';

END`);

    // Update Payment
    await sequelize.query(`DROP PROCEDURE IF EXISTS updatePayment`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updatePayment(
      IN p_reference_id VARCHAR(100),
      In p_status ENUM('pending', 'completed', 'failed', 'refunded'),
      IN p_transaction_id VARCHAR(100),
      IN p_payment_method VARCHAR(100),
      IN p_payment_gateway VARCHAR(100),
      IN p_gateway_response JSON,
      IN p_notes VARCHAR(255)
    )
    BEGIN
      DECLARE payment_exists INT;

      SELECT COUNT(*) INTO payment_exists FROM tbl_payments WHERE reference_id = p_reference_id;

      IF payment_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Payment not found.',
        MYSQL_ERRNO = 4003;
      END IF;

      UPDATE tbl_payments
      SET transaction_id = p_transaction_id,
          status = p_status,
          payment_method = p_payment_method,
          payment_gateway = p_payment_gateway,
          gateway_response = p_gateway_response,
          notes = p_notes,
          transaction_date = NOW(),
          updated_at = NOW()
      WHERE reference_id = p_reference_id;

      SELECT * FROM tbl_payments WHERE reference_id = p_reference_id;
    END
    `);

    // Delete Payment ❌ (Unused)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deletePayment(
      IN p_id INT
    )
    BEGIN
      DECLARE payment_exists INT;

      SELECT COUNT(*) INTO payment_exists FROM tbl_payments WHERE id = p_id;

      IF payment_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Payment not found.',
        MYSQL_ERRNO = 4004;
      END IF;

      DELETE FROM tbl_payments WHERE id = p_id;
    END
    `);

    console.log("✅ Payment procedures created!");
  } catch (error) {
    console.error("❌ Error setting up payment procedures:", error);
    throw error;
  }
};

module.exports = setupPaymentProcedures;
