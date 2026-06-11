const sequelize = require("../../config/db");

const setupUserPointProcedures = async () => {
  try {
    console.log("🔄 Setting up User Point procedures...");

    // Procedure: Get user points by ID
    await sequelize.query(`DROP PROCEDURE IF EXISTS GetUserPointsById`)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetUserPointsById (
      IN p_user_id INT
    )
    BEGIN
      DECLARE user_exists INT;
      
      -- Check if user points record exists
      SELECT COUNT(*) INTO user_exists
      FROM tbl_user_points
      WHERE user_id = p_user_id;
      
      IF user_exists > 0 THEN
        -- User points record exists, return it
        SELECT * FROM tbl_user_points WHERE user_id = p_user_id;
      ELSE
        -- No record exists, create one with 0 points
        INSERT INTO tbl_user_points (
          user_id,
          points,
          total_earned,
          total_spent,
          last_updated
        ) VALUES (
          p_user_id,
          0,
          0,
          0,
          NOW()
        );
        
        -- Return the newly created record
        SELECT * FROM tbl_user_points WHERE user_id = p_user_id;
      END IF;

      -- Also return all transactions
      SELECT * FROM tbl_user_point_transactions
      WHERE user_id = p_user_id
      ORDER BY created_at DESC;
    END`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS GetUserPointsByIdPagination`)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetUserPointsByIdPagination (
    IN p_user_id INT,
    IN p_limit INT,
    IN p_offset INT,
    IN p_time_filter VARCHAR(20), -- 'all','24h','1w','1m','1y','custom'
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    DECLARE user_exists INT;

    -- Check if user points record exists
    SELECT COUNT(*) INTO user_exists
    FROM tbl_user_points
    WHERE user_id = p_user_id;

    IF user_exists > 0 THEN
        -- User points record exists, return it
        SELECT * FROM tbl_user_points WHERE user_id = p_user_id;
    ELSE
        -- No record exists, create one with 0 points
        INSERT INTO tbl_user_points (
            user_id,
            points,
            total_earned,
            total_spent,
            last_updated
        ) VALUES (
            p_user_id,
            0,
            0,
            0,
            NOW()
        );

        -- Return the newly created record
        SELECT * FROM tbl_user_points WHERE user_id = p_user_id;
    END IF;

    -- Transactions with time filter + pagination
    SELECT *
    FROM tbl_user_point_transactions
    WHERE user_id = p_user_id
      AND (
        p_time_filter = 'all'
        OR (p_time_filter = '24h' AND created_at >= NOW() - INTERVAL 1 DAY)
        OR (p_time_filter = '1w'  AND created_at >= NOW() - INTERVAL 7 DAY)
        OR (p_time_filter = '1m'  AND created_at >= NOW() - INTERVAL 1 MONTH)
        OR (p_time_filter = '1y'  AND created_at >= NOW() - INTERVAL 1 YEAR)
        OR (
            p_time_filter = 'custom' 
            AND (p_start_date IS NULL OR created_at >= p_start_date)
            AND (p_end_date IS NULL OR created_at <= DATE_ADD(p_end_date, INTERVAL 1 DAY))
        )
      )
    ORDER BY created_at DESC, id DESC
    LIMIT p_limit OFFSET p_offset;

    -- Add this after the transactions query
    SELECT COUNT(*) AS total
    FROM tbl_user_point_transactions
    WHERE user_id = p_user_id
        AND (
        p_time_filter = 'all'
        OR (p_time_filter = '24h' AND created_at >= NOW() - INTERVAL 1 DAY)
        OR (p_time_filter = '1w'  AND created_at >= NOW() - INTERVAL 7 DAY)
        OR (p_time_filter = '1m'  AND created_at >= NOW() - INTERVAL 1 MONTH)
        OR (p_time_filter = '1y'  AND created_at >= NOW() - INTERVAL 1 YEAR)
        OR (
            p_time_filter = 'custom' 
            AND (p_start_date IS NULL OR created_at >= p_start_date)
            AND (p_end_date IS NULL OR created_at <= DATE_ADD(p_end_date, INTERVAL 1 DAY))
        )
        );

END
`);

    // Procedure: Update user points by ID
    await sequelize.query(`DROP PROCEDURE IF EXISTS UpdateUserPointsById`)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateUserPointsById (
  IN p_user_id INT,
  IN p_points INT,
  IN p_is_add BOOLEAN,
  IN p_source VARCHAR(100),
  IN p_description TEXT
)
BEGIN
  DECLARE user_exists INT;
  DECLARE current_points INT;

  SELECT COUNT(*) INTO user_exists
  FROM tbl_user_points
  WHERE user_id = p_user_id;

  IF user_exists = 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFound|User points not found';
  ELSE
    SELECT points INTO current_points
    FROM tbl_user_points
    WHERE user_id = p_user_id;

    IF p_is_add THEN
      UPDATE tbl_user_points
      SET 
        points = points + p_points,
        total_earned = total_earned + p_points,
        last_updated = NOW()
      WHERE user_id = p_user_id;

      INSERT INTO tbl_user_point_transactions (
        user_id, points, type, source, description, created_at
      ) VALUES (
        p_user_id, p_points, 'earn', p_source, p_description, NOW()
      );

    ELSE
      IF current_points < p_points THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E400|InsufficientPoints|User does not have enough points';
      ELSE
        UPDATE tbl_user_points
        SET 
          points = points - p_points,
          total_spent = total_spent + p_points,
          last_updated = NOW()
        WHERE user_id = p_user_id;

        INSERT INTO tbl_user_point_transactions (
          user_id, points, type, source, description, created_at
        ) VALUES (
          p_user_id, p_points, 'spend', p_source, p_description, NOW()
        );
      END IF;
    END IF;
  END IF;
END
`);

    console.log("✅ User Point procedures created!");
  } catch (error) {
    console.error("❌ Error setting up User Point procedures:", error);
    throw error;
  }
};

module.exports = setupUserPointProcedures;