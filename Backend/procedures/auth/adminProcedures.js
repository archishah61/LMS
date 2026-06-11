// /procedures/adminProcedures.js
const sequelize = require("../../config/db");

const setupAdminProcedures = async () => {
  try {
    console.log("🔄 Setting up Admin procedures...");

    // Admin Signup
    await sequelize.query(`
          CREATE PROCEDURE IF NOT EXISTS adminSignup(
            IN p_username VARCHAR(255),
            IN p_email VARCHAR(255),
            IN p_password VARCHAR(255)
          )
          BEGIN
            DECLARE v_user_exists INT;
    
            -- Check if user already exists by email or username
            SELECT COUNT(*) INTO v_user_exists
            FROM tbl_admin
            WHERE email = p_email OR username = p_username;
    
            IF v_user_exists > 0 THEN
              SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E409|UserAlreadyExistsError|User already exists';
            END IF;
    
            -- Create new admin user
            INSERT INTO tbl_admin (username, email, password, refresh_token, created_at, updated_at)
            VALUES (p_username, p_email, p_password, NULL, NOW(), NOW());
    
            -- Return the created admin user
            SELECT * FROM tbl_admin WHERE email = p_email;
          END
        `);

    // Admin Login
    await sequelize.query(`DROP PROCEDURE IF EXISTS adminLogin;`);
    await sequelize.query(`CREATE PROCEDURE adminLogin(
  IN p_identifier VARCHAR(255)
)
BEGIN
  DECLARE v_id INT;
  DECLARE v_roleId INT;
  DECLARE v_username VARCHAR(255);
  DECLARE v_email VARCHAR(255);
  DECLARE v_password VARCHAR(255);
  DECLARE v_role VARCHAR(20);
  DECLARE v_is_active BOOLEAN;
  DECLARE v_partner_role_is_active BOOLEAN;

  proc_end: BEGIN
    -- First check in admin table
    SELECT id, username, roleId, email, password, is_active
    INTO v_id, v_username, v_roleId, v_email, v_password, v_is_active
    FROM tbl_admin
    WHERE email = p_identifier OR username = p_identifier
    LIMIT 1;

    IF v_id IS NOT NULL THEN
      IF v_is_active = FALSE THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E403|AccountInactiveError|Admin account is inactive';
      END IF;

      SELECT is_active INTO v_is_active
      FROM tbl_roles WHERE id = v_roleId LIMIT 1;

      IF v_is_active = FALSE THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E403|AccountInactiveError|Admin account is inactive';
      END IF;

      SET v_role = 'admin';

      SELECT v_id AS id, v_username AS username, v_email AS email, v_password AS password, v_role AS role;
      LEAVE proc_end;
    END IF;

    -- Then check in partner table
    SELECT id, name, email, password, roleId, status
    INTO v_id, v_username, v_email, v_password, v_roleId, v_role -- reuse v_role to store status
    FROM tbl_partners
    WHERE email = p_identifier
    LIMIT 1;

    IF v_id IS NOT NULL THEN
      IF v_role != 'Approved' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E403|AccountInactiveError|Partner account is not approved';
      END IF;

      SELECT is_active INTO v_partner_role_is_active
      FROM tbl_roles WHERE id = v_roleId LIMIT 1;

      IF v_partner_role_is_active = FALSE THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E403|AccountInactiveError|Partner account is not approved';
      END IF;

      SET v_role = 'partner';

      SELECT v_id AS id, v_username AS username, v_email AS email, v_password AS password, v_role AS role;
      LEAVE proc_end;
    END IF;

    -- If not found in either
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E401|InvalidCredentialsError|Invalid credentials';

  END proc_end;
END
`);

    // Create Admin
    await sequelize.query(`DROP PROCEDURE IF EXISTS createAdmin;`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createAdmin (
      IN p_username VARCHAR(255),
      IN p_email VARCHAR(255),
      IN p_password VARCHAR(255),
      IN p_roleId INT
    )
    BEGIN
      IF EXISTS (SELECT 1 FROM tbl_admin WHERE username = p_username OR email = p_email) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Username or Email already exists.';
      ELSE
        INSERT INTO tbl_admin (username, email, password, roleId, is_active, refresh_token, created_at, updated_at)
        VALUES (p_username, p_email, p_password, p_roleId, TRUE, NULL, NOW(), NOW());

        SELECT * FROM tbl_admin WHERE id = LAST_INSERT_ID();
      END IF;
    END`);

    // Update Admin
    await sequelize.query(`DROP PROCEDURE IF EXISTS updateAdmin;`);
    await sequelize.query(`
CREATE PROCEDURE updateAdmin (
  IN p_id INT,
  IN p_username VARCHAR(255),
  IN p_email VARCHAR(255),
  IN p_password VARCHAR(255),
  IN p_roleId INT,
  IN p_profileImage VARCHAR(255)
)
BEGIN
  DECLARE current_username VARCHAR(255);
  DECLARE current_email VARCHAR(255);
  DECLARE current_password VARCHAR(255);
  DECLARE current_roleId INT;
  DECLARE current_profileImage VARCHAR(255);

  -- Get current values
  SELECT username, email, password, roleId, profile_image
  INTO current_username, current_email, current_password, current_roleId, current_profileImage
  FROM tbl_admin
  WHERE id = p_id;

  -- If no record found
  IF current_username IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Admin not found.';
  END IF;

  -- Check uniqueness for username/email
  IF (p_username IS NOT NULL AND p_username != current_username AND EXISTS (
      SELECT 1 FROM tbl_admin WHERE username = p_username AND id != p_id
    )) 
    OR 
    (p_email IS NOT NULL AND p_email != current_email AND EXISTS (
      SELECT 1 FROM tbl_admin WHERE email = p_email AND id != p_id
    ))
  THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Username or Email already used by another record.';

  ELSE
    UPDATE tbl_admin
    SET 
      username = COALESCE(p_username, username),
      email = COALESCE(p_email, email),
      password = COALESCE(p_password, password),
      roleId = COALESCE(p_roleId, roleId),
      profile_image = COALESCE(p_profileImage, profile_image),
      updated_at = NOW()
    WHERE id = p_id;

    SELECT * FROM tbl_admin WHERE id = p_id;
  END IF;
END
`);


    // Update Admin Password Only
    await sequelize.query(`DROP PROCEDURE IF EXISTS updateAdminPassword;`);
    await sequelize.query(`
CREATE PROCEDURE IF NOT EXISTS updateAdminPassword (
  IN p_id INT,
  IN p_new_password VARCHAR(255)
)
BEGIN
  -- Check if admin exists
  IF NOT EXISTS (SELECT 1 FROM tbl_admin WHERE id = p_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Admin not found.';
  ELSE
    UPDATE tbl_admin
    SET 
      password = p_new_password,
      updated_at = NOW()
    WHERE id = p_id;

    SELECT id, username, email, updated_at
    FROM tbl_admin 
    WHERE id = p_id;
  END IF;
END
`);

    // Get All Admins
    await sequelize.query(`DROP PROCEDURE IF EXISTS getAllAdmins;`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllAdmins(
    IN p_search_term VARCHAR(255),
    IN p_role_id INT,
    IN p_limit VARCHAR(10),
    IN p_offset INT
)
BEGIN
    -- BASE QUERY
    SET @sql = 'SELECT a.*, r.name AS role_name
                FROM tbl_admin a
                JOIN tbl_roles r ON a.roleId = r.id
                WHERE 1=1';

    -- SEARCH FILTER
    IF p_search_term IS NOT NULL AND p_search_term != '' THEN
        SET @sql = CONCAT(
            @sql,
            ' AND (a.username LIKE "%', p_search_term, '%"
                   OR a.email LIKE "%', p_search_term, '%")'
        );
    END IF;

    -- ROLE FILTER
    IF p_role_id IS NOT NULL THEN
        SET @sql = CONCAT(
            @sql,
            ' AND a.roleId = ', 
            p_role_id
        );
    END IF;
    
    -- TOTAL COUNT QUERY
    SET @count_sql = CONCAT(
        'SELECT COUNT(*) AS total_entries FROM (',
        @sql,
        ') AS count_table'
    );

    PREPARE count_stmt FROM @count_sql;
    EXECUTE count_stmt;
    DEALLOCATE PREPARE count_stmt;

    -- ORDER + PAGINATION
    SET @sql = CONCAT(@sql, ' ORDER BY a.username');

    IF p_limit IS NOT NULL AND p_limit != 'ALL' THEN
        SET @sql = CONCAT(@sql, ' LIMIT ', p_limit, ' OFFSET ', p_offset);
    END IF;

    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END;`);

    // Get Admin By ID
    await sequelize.query(`DROP PROCEDURE IF EXISTS getAdminById;`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAdminById(IN p_id INT)
    BEGIN
      SELECT a.*, r.name AS role_name, a.refresh_token
      FROM tbl_admin a
      JOIN tbl_roles r ON a.roleId = r.id
      WHERE a.id = p_id;
    END`);

    // Get Current Admin
    await sequelize.query(`DROP PROCEDURE IF EXISTS getCurrentAdmin;`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCurrentAdmin(IN p_id INT)
BEGIN
  SELECT 
    a.*, 
    r.name AS role_name, 
    a.refresh_token
  FROM tbl_admin a
  JOIN tbl_roles r ON a.roleId = r.id
  WHERE a.id = p_id;
END`);

    // Toggle is_active
    await sequelize.query(`DROP PROCEDURE IF EXISTS toggleAdminStatus;`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS toggleAdminStatus(IN p_id INT)
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM tbl_admin WHERE id = p_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Admin not found.';
      ELSE
        UPDATE tbl_admin
        SET is_active = NOT is_active,
            updated_at = NOW()
        WHERE id = p_id;

        SELECT * FROM tbl_admin WHERE id = p_id;
      END IF;
    END`);

    // Delete Admin
    await sequelize.query(`DROP PROCEDURE IF EXISTS deleteAdmin;`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteAdmin(IN p_id INT)
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM tbl_admin WHERE id = p_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Admin not found.';
      ELSE
        DELETE FROM tbl_admin WHERE id = p_id;
      END IF;
    END`);

    // Procedure: Update Admin Refresh Token
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateAdminRefreshToken(
      IN p_admin_id INT,
      IN p_refresh_token TEXT
    )
    BEGIN
      UPDATE tbl_admin
      SET refresh_token = p_refresh_token,
          updated_at = NOW()
      WHERE id = p_admin_id;
    END`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS logoutAdminOrPartner(
      IN p_id INT,
      IN p_role VARCHAR(255)
    )
    BEGIN
      IF p_role = 'admin' THEN
        UPDATE tbl_admin
        SET refresh_token = NULL,
            updated_at = NOW()
        WHERE id = p_id;
      ELSE
        UPDATE tbl_partners
        SET refresh_token = NULL,
            updated_at = NOW()
        WHERE id = p_id;
      END IF;
    END`);

    console.log("✅ Admin procedures created!");
  } catch (error) {
    console.error("❌ Error setting up Admin procedures:", error);
    throw error;
  }
};

module.exports = setupAdminProcedures;

