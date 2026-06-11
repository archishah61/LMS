const sequelize = require("../../config/db");

const setupLeaderboardAndGamificationAnalyticsProcedures = async () => {
  try {
    console.log("🔄 Setting up LeaderboardAndGamificationAnalytics procedures...");

    //get Top Performer By challenge category
    await sequelize.query(`DROP PROCEDURE IF EXISTS getTopPerformersByChallengeCategory`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getTopPerformersByChallengeCategory()
BEGIN
    SELECT
        user_id,
        MAX(user_name) AS user_name,
        MAX(email) AS email,
        MAX(profile_image) AS profile_image,
        category,
        SUM(total_points) AS total_points
    FROM (
        SELECT
            u.id AS user_id,
            u.full_name AS user_name,
            u.email,
            u.profile_image,
            cc.category AS category,
            SUM(uc.points_earned) AS total_points
        FROM tbl_user_challenge uc
        JOIN tbl_users u ON uc.user_id = u.id
        JOIN tbl_challenges ch ON uc.challenge_id = ch.id
        JOIN tbl_challenge_categories cc ON ch.category_id = cc.id
        WHERE uc.is_completed = TRUE
        GROUP BY u.id, cc.category

        UNION ALL

        SELECT
            u.id AS user_id,
            u.full_name AS user_name,
            u.email,
            u.profile_image,
            cc.category AS category,
            SUM(udc.points_earned) AS total_points
        FROM tbl_user_daily_challenge udc
        JOIN tbl_users u ON udc.user_id = u.id
        JOIN tbl_daily_challenges dc ON udc.challenge_id = dc.id
        JOIN tbl_challenge_categories cc ON dc.category = cc.id
        WHERE udc.is_completed = TRUE
        GROUP BY u.id, cc.category
    ) combined
    GROUP BY user_id, category
    ORDER BY category, total_points DESC;
END;`);

    // Get users with highest points using stored procedure
    await sequelize.query(`DROP PROCEDURE IF EXISTS getUsersWithHighestPoints`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getUsersWithHighestPoints()
            BEGIN
              SELECT
                u.id AS user_id,
                u.full_name AS user_name,
                u.email,
                u.profile_image,  -- Include the profile_image field
                up.total_earned,
                up.points AS total_points,
                COALESCE(MAX(us.current_streak), 0) AS current_streak,
                COALESCE(MAX(us.longest_streak), 0) AS longest_streak,
                GROUP_CONCAT(DISTINCT c.title ORDER BY c.title SEPARATOR ', ') AS completed_challenges
              FROM tbl_users u
              INNER JOIN tbl_user_points up ON u.id = up.user_id
              LEFT JOIN tbl_user_streaks us ON u.id = us.user_id
              LEFT JOIN tbl_user_challenge uc ON u.id = uc.user_id AND uc.is_completed = true
              LEFT JOIN tbl_challenges c ON uc.challenge_id = c.id
              WHERE up.points > 0
              GROUP BY u.id, u.full_name, u.email, up.points, up.total_earned, u.profile_image  -- Add profile_image to GROUP BY
              ORDER BY up.total_earned DESC;
            END`);

    // Kuldeepsinh
    // Procedure: Get top 10 users by earned points and user rank
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetTopUsersAndUserRank (
      IN p_user_id INT
    )
    BEGIN
      DECLARE user_exists INT;
      DECLARE user_rank INT DEFAULT 0;
      
      -- Check if user exists in user points table
      SELECT COUNT(*) INTO user_exists
      FROM tbl_user_points
      WHERE user_id = p_user_id;
      
      -- If user doesn't exist in points table, throw error
      IF user_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFound|User points not found';
      ELSE
        -- Get user's rank based on total_earned points (same points = same rank)
        SELECT ranking INTO user_rank
        FROM (
          SELECT 
            user_id,
            RANK() OVER (ORDER BY total_earned DESC) as ranking
          FROM tbl_user_points up2
          INNER JOIN tbl_users u2 ON up2.user_id = u2.id
          WHERE u2.is_active = 1
        ) ranked_users
        WHERE user_id = p_user_id;
        
        -- Return top 10 users and the specified user's rank
        SELECT 
          'top_users' as result_type,
          up.user_id,
          u.full_name,
          u.username,
          u.profile_image,
          up.total_earned,
          up.points as current_points,
          RANK() OVER (ORDER BY up.total_earned DESC) as user_rank
        FROM tbl_user_points up
        INNER JOIN tbl_users u ON up.user_id = u.id
        WHERE u.is_active = 1
        ORDER BY up.total_earned DESC, up.id ASC
        LIMIT 10;
        
        -- Return the specified user's rank information
        SELECT 
          'user_rank' as result_type,
          up.user_id,
          u.full_name,
          u.username,
          u.profile_image,
          up.total_earned,
          up.points as current_points,
          user_rank as user_rank
        FROM tbl_user_points up
        INNER JOIN tbl_users u ON up.user_id = u.id
        WHERE up.user_id = p_user_id AND u.is_active = 1;
      END IF;
      
    END`);

    // Procedure: Get top 10 users by earned points and user rank
    await sequelize.query(`DROP PROCEDURE IF EXISTS getDailyChallengeRank`)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getDailyChallengeRank (
    IN p_user_id INT,
    IN p_difficulty_level VARCHAR(20),
    IN p_category_id INT,
    IN p_timeinterval VARCHAR(20)
)
BEGIN
    DECLARE user_exists INT;
    DECLARE user_rank INT DEFAULT 0;
    DECLARE v_start_date DATE;
    
    -- Determine start date based on time interval
    IF p_timeinterval = 'today' THEN
        SET v_start_date = CURDATE();
    ELSEIF p_timeinterval = 'week' THEN
        SET v_start_date = DATE_SUB(CURDATE(), INTERVAL 7 DAY);
    ELSEIF p_timeinterval = 'month' THEN
        SET v_start_date = DATE_SUB(CURDATE(), INTERVAL 1 MONTH);
    ELSE
        SET v_start_date = '1970-01-01';
    END IF;
    
    -- Check if user exists and has any points in the filtered period
    SELECT COUNT(DISTINCT u.id) INTO user_exists
    FROM tbl_users u
    INNER JOIN tbl_user_daily_challenge udc ON u.id = udc.user_id
    INNER JOIN tbl_daily_challenges dc ON dc.id = udc.challenge_id
    WHERE u.id = p_user_id 
      AND u.is_active = 1
      -- Difficulty Filter
      AND (p_difficulty_level = 'all' OR dc.difficulty_level = p_difficulty_level)
      -- Category Filter
      AND (p_category_id IS NULL OR dc.category = p_category_id)
      -- Time Filter
      AND DATE(udc.assigned_at) >= v_start_date;
    
    -- Return top 10 users based on total points in the filtered period
    SELECT 
        'top_users' as result_type,
        u.id as user_id,
        u.full_name,
        u.username,
        u.profile_image,
        COALESCE(SUM(udc.points_earned), 0) as total_earned,
        COALESCE(SUM(udc.points_earned), 0) as current_points,
        RANK() OVER (ORDER BY COALESCE(SUM(udc.points_earned), 0) DESC) as user_rank
    FROM tbl_users u
    INNER JOIN tbl_user_daily_challenge udc ON u.id = udc.user_id
    INNER JOIN tbl_daily_challenges dc ON dc.id = udc.challenge_id
    WHERE u.is_active = 1
      -- Difficulty Filter
      AND (p_difficulty_level = 'all' OR dc.difficulty_level = p_difficulty_level)
      -- Category Filter
      AND (p_category_id IS NULL OR dc.category = p_category_id)
      -- Time Filter
      AND DATE(udc.assigned_at) >= v_start_date
    GROUP BY u.id, u.full_name, u.username, u.profile_image
    ORDER BY total_earned DESC, u.id ASC;

    -- If user doesn't exist or has no points in filtered period, throw error
    IF NOT user_exists = 0 THEN
        -- Get user's rank based on total points earned in the filtered period
        SELECT ranking INTO user_rank
        FROM (
            SELECT 
                udc.user_id,
                RANK() OVER (ORDER BY SUM(udc.points_earned) DESC) as ranking
            FROM tbl_user_daily_challenge udc
            INNER JOIN tbl_daily_challenges dc ON dc.id = udc.challenge_id
            INNER JOIN tbl_users u ON u.id = udc.user_id
            WHERE u.is_active = 1
              -- Difficulty Filter
              AND (p_difficulty_level = 'all' OR dc.difficulty_level = p_difficulty_level)
              -- Category Filter
              AND (p_category_id IS NULL OR dc.category = p_category_id)
              -- Time Filter
              AND DATE(udc.assigned_at) >= v_start_date
            GROUP BY udc.user_id
        ) ranked_users
        WHERE user_id = p_user_id;
        
        -- Return the specified user's rank information with their total points
        SELECT 
            'user_rank' as result_type,
            u.id as user_id,
            u.full_name,
            u.username,
            u.profile_image,
            COALESCE(user_total.total_earned, 0) as total_earned,
            COALESCE(user_total.total_earned, 0) as current_points,
            user_rank as user_rank
        FROM tbl_users u
        LEFT JOIN (
            SELECT 
                udc.user_id,
                SUM(udc.points_earned) as total_earned
            FROM tbl_user_daily_challenge udc
            INNER JOIN tbl_daily_challenges dc ON dc.id = udc.challenge_id
            WHERE (p_difficulty_level = 'all' OR dc.difficulty_level = p_difficulty_level)
              -- Category Filter
              AND (p_category_id IS NULL OR dc.category = p_category_id)
              -- Time Filter
              AND DATE(udc.assigned_at) >= v_start_date
            GROUP BY udc.user_id
        ) user_total ON u.id = user_total.user_id
        WHERE u.id = p_user_id AND u.is_active = 1;
    END IF;
    
END`);

    console.log("✅ LeaderboardAndGamificationAnalytics procedures created!");
  } catch (error) {
    console.error("❌ Error setting up LeaderboardAndGamificationAnalytics procedures:", error);
    throw error;
  }
};

module.exports = setupLeaderboardAndGamificationAnalyticsProcedures;
