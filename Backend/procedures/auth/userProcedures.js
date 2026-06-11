// utils/procedure/userProcedure.js

const sequelize = require("../../config/db");

const setupUserProcedures = async () => {
  try {
    console.log("🔄 Setting up User Authentication procedures...");

    // Procedure: findUserByEmailOrUsername ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS findUserByEmailOrUsername(
      IN p_identifier VARCHAR(255)
    )
    BEGIN
      SELECT * FROM tbl_users 
      WHERE email = p_identifier OR username = p_identifier;
    END
  `);

    // Procedure: createUser ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createUser(
    IN p_full_name VARCHAR(255),
    IN p_username VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_password VARCHAR(255),
    IN p_mobile_no VARCHAR(15),
    IN p_location VARCHAR(255),
    IN p_profile_image VARCHAR(255),
    IN p_country_id INT,
    IN p_state_id INT,
    IN p_city_id INT,
    IN p_session_token VARCHAR(255),
    IN p_device_name VARCHAR(255),
    IN p_device_token VARCHAR(255),
    IN p_app_platform ENUM('android', 'ios', 'web'),
    IN p_login_type ENUM('normal', 'social')
  )
  BEGIN
    DECLARE user_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO user_exists
    FROM tbl_users
    WHERE email = p_email OR username = p_username;
    
    IF user_exists > 0 THEN
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'E409|UserAlreadyExistsError|Email or Username already exists',
      MYSQL_ERRNO = 1062;
    ELSE
      INSERT INTO tbl_users (
        full_name,
        username,
        email,
        password,
        mobile_no,
        location,
        profile_image,
        session_token,
        refresh_token,
        country_id,
        state_id,
        city_id,
        device_name,
        device_token,
        app_platform,
        login_type,
        created_at,
        updated_at
      ) VALUES (
        p_full_name,
        p_username,
        p_email,
        p_password,
        p_mobile_no,  -- This can be NULL
        p_location,   -- This can be NULL
        p_profile_image, -- This can be NULL
        p_session_token,
        NULL,
        p_country_id,
        p_state_id,
        p_city_id,
        p_device_name,
        p_device_token,
        p_app_platform,
        p_login_type,
        NOW(),
        NOW()
      );
      
      SELECT LAST_INSERT_ID() AS user_id;
    END IF;
  END
  `);

    // Procedure: updateUserSessionToken ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateUserSessionToken(
      IN p_user_id INT,
      IN p_session_token VARCHAR(255),
      IN p_device_name VARCHAR(255),
      IN p_device_token VARCHAR(255),
      IN p_app_platform ENUM('android', 'ios', 'web'),
      IN p_login_type ENUM('normal', 'google')
    )
    BEGIN
      UPDATE tbl_users
      SET session_token = p_session_token,
          device_name = p_device_name,
          device_token = p_device_token,
          app_platform = p_app_platform,
          login_type = p_login_type,
          updated_at = NOW()
      WHERE id = p_user_id;
    END
  `);

    // update access token
    await sequelize.query(`
              CREATE PROCEDURE IF NOT EXISTS updateUserToken(
                IN p_user_id INT,
                IN p_access_token TEXT,
                IN p_token_expiry DATE
              )
              BEGIN
                UPDATE tbl_users
                SET access_token = p_access_token,
                    token_expiry = p_token_expiry,
                    updated_at = NOW()
                WHERE id = p_user_id;
              END
            `);

    // New procedure for admin logout
    await sequelize.query(`
              CREATE PROCEDURE IF NOT EXISTS userLogout(
                IN p_user_id INT
              )
              BEGIN
                UPDATE tbl_users
                SET access_token = NULL,
                    token_expiry = NULL,
                    updated_at = NOW()
                WHERE id = p_user_id;
              END
            `);

    // Procedure: getUserById ✅
    await sequelize.query(`
CREATE PROCEDURE IF NOT EXISTS getUserById(
  IN p_id INT
)
BEGIN
  SELECT 
    u.id, 
    u.full_name, 
    u.username, 
    u.email, 
    u.profile_image, 
    u.mobile_no, 
    u.location, 
    u.session_token,
    u.login_type, 
    u.refresh_token, 
    u.access_token,
    u.token_expiry, 
    u.created_at, 
    u.updated_at,
    u.country_id,
    u.state_id,
    u.city_id,
    -- Get country name
    c.name AS country_name,
    -- Get state name
    s.name AS state_name,
    -- Get city name
    ct.name AS city_name,
    CASE 
      WHEN u.password IS NULL OR u.password = '' THEN 0
      ELSE 1
    END AS isPasswordSet
  FROM tbl_users u
  -- Left joins to get location names (won't fail if IDs are NULL)
  LEFT JOIN tbl_countries c ON u.country_id = c.id
  LEFT JOIN tbl_states s ON u.state_id = s.id
  LEFT JOIN tbl_cities ct ON u.city_id = ct.id
  WHERE u.id = p_id;
END
`);

    // Procedure: updateUserProfile ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateUserProfile(
 IN p_id INT,
  IN p_full_name VARCHAR(255),
  IN p_username VARCHAR(255),
  IN p_email VARCHAR(255),
  IN p_mobile_no VARCHAR(15),
  IN p_location VARCHAR(255),
  IN p_profile_image VARCHAR(255),
  IN p_country_id INT,
  IN p_state_id INT,
  IN p_city_id INT
)
BEGIN
  DECLARE user_exists INT DEFAULT 0;

  SELECT COUNT(*) INTO user_exists
  FROM tbl_users
  WHERE (email = p_email OR username = p_username)
  AND id != p_id;
  
  IF user_exists > 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E409|UserAlreadyExistsError|Email or Username already exists',
    MYSQL_ERRNO = 1062;
  ELSE
    UPDATE tbl_users
    SET full_name = IFNULL(p_full_name, full_name),
        username = IFNULL(p_username, username),
        email = IFNULL(p_email, email),
        mobile_no = IFNULL(p_mobile_no, mobile_no),
        location = IFNULL(p_location, location),
        profile_image = IFNULL(p_profile_image, profile_image),
        country_id = IFNULL(p_country_id, country_id),
        state_id = IFNULL(p_state_id, state_id),
        city_id = IFNULL(p_city_id, city_id),
        updated_at = NOW()
    WHERE id = p_id;
    
    -- Return the updated user with location names
    SELECT 
      u.id, 
      u.full_name, 
      u.username, 
      u.email, 
      u.profile_image, 
      u.mobile_no, 
      u.location, 
      u.created_at, 
      u.updated_at,
      u.country_id,
      u.state_id,
      u.city_id,
      c.name AS country_name,
      s.name AS state_name,
      ct.name AS city_name
    FROM tbl_users u
    LEFT JOIN tbl_countries c ON u.country_id = c.id
    LEFT JOIN tbl_states s ON u.state_id = s.id
    LEFT JOIN tbl_cities ct ON u.city_id = ct.id
    WHERE u.id = p_id;
  END IF;
END
`);
    // Procedure: getUserPassword ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getUserPassword(
      IN p_id INT
    )
    BEGIN
      SELECT password
      FROM tbl_users
      WHERE id = p_id;
    END
  `);

    // Procedure: updateUserPassword ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateUserPassword(
      IN p_id INT,
      IN p_password VARCHAR(255)
    )
    BEGIN
      UPDATE tbl_users
      SET password = p_password,
          updated_at = NOW()
      WHERE id = p_id;
    END
  `);

    // Procedure: deleteUserProfileImage ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteUserProfileImage(
      IN p_id INT
    )
    BEGIN
      UPDATE tbl_users
      SET profile_image = NULL,
          updated_at = NOW()
      WHERE id = p_id;
      
      SELECT profile_image
      FROM tbl_users
      WHERE id = p_id;
    END
  `);

    // Procedure: createUserPoints ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createUserPoints(
      IN p_user_id INT
    )
    BEGIN
      INSERT INTO tbl_user_points (
        user_id,
        created_at,
        updated_at
      ) VALUES (
        p_user_id,
        NOW(),
        NOW()
      );
    END
  `);

    // Procedure: createUserStreaks ✅
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createUserStreaks(
      IN p_user_id INT
    )
    BEGIN
      INSERT INTO tbl_user_streaks (
        user_id,
        created_at,
        updated_at
      ) VALUES (
        p_user_id,
        NOW(),
        NOW()
      );
    END
  `);

    // Procedure: updateAdminUser ✅
    await sequelize.query(`DROP PROCEDURE IF EXISTS updateUser`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateUser(
  IN p_id INT,
  IN p_full_name VARCHAR(255),
  IN p_username VARCHAR(255),
  IN p_email VARCHAR(255),
  IN p_password VARCHAR(255),
  IN p_mobile_no VARCHAR(15),
  IN p_location VARCHAR(255),
  IN p_profile_image VARCHAR(255),
  IN p_country_id INT,
  IN p_state_id INT,
  IN p_city_id INT,
  IN p_is_active BOOLEAN
)
BEGIN
  DECLARE user_exists INT DEFAULT 0;
    
  SELECT COUNT(*) INTO user_exists
  FROM tbl_users
  WHERE (email = p_email OR username = p_username)
  AND id != p_id;
    
  IF user_exists > 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E409|UserAlreadyExistsError|Email or Username already exists',
    MYSQL_ERRNO = 1062;
  ELSE
    UPDATE tbl_users
    SET full_name = IFNULL(p_full_name, full_name),
        username = IFNULL(p_username, username),
        email = IFNULL(p_email, email),
        password = IFNULL(p_password, password),
        mobile_no = IFNULL(p_mobile_no, mobile_no),
        location = IFNULL(p_location, location),
        profile_image = IFNULL(p_profile_image, profile_image),
        country_id = IFNULL(p_country_id, country_id),
        state_id = IFNULL(p_state_id, state_id),
        city_id = IFNULL(p_city_id, city_id),
        is_active = IFNULL(p_is_active, is_active),
        updated_at = NOW()
    WHERE id = p_id;

    SELECT id, full_name, username, email, profile_image, mobile_no, location, country_id, state_id, city_id, is_active, created_at, updated_at
    FROM tbl_users
    WHERE id = p_id;
  END IF;
END
`);

    // Procedure: getAllUsersWithPagination ✅
    await sequelize.query(`DROP PROCEDURE IF EXISTS getAllUsersWithPagination`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllUsersWithPagination(
  IN p_limit INT,
  IN p_offset INT,
  IN p_search VARCHAR(255),
  IN p_is_all BOOLEAN
)
BEGIN
    IF p_is_all = TRUE THEN
      SELECT 
        id, 
        full_name, 
        username, 
        email, 
        profile_image, 
        mobile_no, 
        location,
        country_id, 
        state_id, 
        city_id, 
        is_active,
        isPromoCodeGenerated,     -- ✅ added here
        created_at, 
        updated_at
      FROM tbl_users
      WHERE 
        full_name LIKE CONCAT('%', p_search, '%') OR
        username LIKE CONCAT('%', p_search, '%') OR
        email LIKE CONCAT('%', p_search, '%') OR
        mobile_no LIKE CONCAT('%', p_search, '%')
      ORDER BY created_at DESC;
    ELSE
      SELECT 
        id, 
        full_name, 
        username, 
        email, 
        profile_image, 
        mobile_no, 
        location,
        country_id, 
        state_id, 
        city_id, 
        is_active,
        isPromoCodeGenerated,     -- ✅ added here
        created_at, 
        updated_at
      FROM tbl_users
      WHERE 
        full_name LIKE CONCAT('%', p_search, '%') OR
        username LIKE CONCAT('%', p_search, '%') OR
        email LIKE CONCAT('%', p_search, '%') OR
        mobile_no LIKE CONCAT('%', p_search, '%')
      ORDER BY created_at DESC
      LIMIT p_limit OFFSET p_offset;
    END IF;

    SELECT 
      COUNT(*) AS total_users
    FROM tbl_users
    WHERE 
      full_name LIKE CONCAT('%', p_search, '%') OR
      username LIKE CONCAT('%', p_search, '%') OR
      email LIKE CONCAT('%', p_search, '%') OR
      mobile_no LIKE CONCAT('%', p_search, '%');
END
`);


    // Procedure: Update User Refresh Token
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateUserRefreshToken(
      IN p_user_id INT,
      IN p_refresh_token TEXT
    )
    BEGIN
      UPDATE tbl_users
      SET refresh_token = p_refresh_token,
          updated_at = NOW()
      WHERE id = p_user_id;
    END`);


    console.log("✅ User Authentication procedures created!");
  } catch (error) {
    console.error("❌ Error setting up user authentication procedures:", error);
    throw error;
  }
};

module.exports = setupUserProcedures;