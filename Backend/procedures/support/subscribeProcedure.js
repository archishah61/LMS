const sequelize = require("../../config/db");

const setupSubscribeProcedures = async () => {
  try {
    console.log("🔄 Setting up Subscribe procedures...");

    // Create a subscription
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS createSubscribe(IN p_email VARCHAR(255))
      BEGIN
        DECLARE err_message VARCHAR(255);

        IF EXISTS (SELECT 1 FROM tbl_subscribe WHERE email = p_email) THEN
          SET err_message = 'E409|ConflictError|Email already subscribed.';
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = err_message;
        END IF;

        INSERT INTO tbl_subscribe (email, status, created_at, updated_at)
        VALUES (p_email, 'active', NOW(), NOW());

        SELECT * FROM tbl_subscribe WHERE id = LAST_INSERT_ID();
      END
    `);

    // Get all subscriptions
    await sequelize.query(`DROP PROCEDURE IF EXISTS getAllSubscribes`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllSubscribes(
    IN p_search_term VARCHAR(255),
    IN p_status VARCHAR(10),
    IN p_limit INT,
    IN p_offset INT,
    IN p_is_all BOOLEAN
)
BEGIN
    SELECT COUNT(*) AS total_count
    FROM tbl_subscribe
    WHERE
        (p_search_term IS NULL
        OR p_search_term = ''
        OR email LIKE CONCAT('%', p_search_term, '%'))
        AND (p_status IS NULL OR p_status = 'all' OR p_status = status);

    IF p_is_all THEN 
      SELECT *
      FROM tbl_subscribe
      WHERE
          (p_search_term IS NULL
          OR p_search_term = ''
          OR email LIKE CONCAT('%', p_search_term, '%'))
          AND (p_status IS NULL OR p_status = 'all' OR p_status = status)
      ORDER BY created_at DESC;
    ELSE
      SELECT *
      FROM tbl_subscribe
      WHERE
          (p_search_term IS NULL
          OR p_search_term = ''
          OR email LIKE CONCAT('%', p_search_term, '%'))
          AND (p_status IS NULL OR p_status = 'all' OR p_status = status)
      ORDER BY created_at DESC
      LIMIT p_limit OFFSET p_offset;
    END IF;
END`);

    // Toggle subscription status by ID
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS toggleSubscribeStatus(IN p_id INT)
      BEGIN
        DECLARE v_current ENUM('active','inactive');
        DECLARE v_new ENUM('active','inactive');
        DECLARE err_message VARCHAR(255);

        IF NOT EXISTS (SELECT 1 FROM tbl_subscribe WHERE id = p_id) THEN
          SET err_message = 'E404|NotFoundError|Subscription not found.';
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = err_message;
        END IF;

        SELECT status INTO v_current FROM tbl_subscribe WHERE id = p_id;
        SET v_new = IF(v_current = 'active', 'inactive', 'active');

        UPDATE tbl_subscribe SET status = v_new, updated_at = NOW() WHERE id = p_id;

        SELECT * FROM tbl_subscribe WHERE id = p_id;
      END
    `);

    console.log("✅ Subscribe procedures created!");
  } catch (error) {
    console.error("❌ Error setting up subscribe procedures:", error);
    throw error;
  }
};

module.exports = setupSubscribeProcedures;
