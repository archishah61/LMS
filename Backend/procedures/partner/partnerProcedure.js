const sequelize = require("../../config/db");

const setupPartnerProcedures = async () => {
  try {
    console.log("🔄 Setting up Partner procedures...");

    // Procedure: Create Partner
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS CreatePartner (
      IN p_user_id INT,
      IN p_partner_type VARCHAR(20),
      IN p_name VARCHAR(255),
      IN p_email VARCHAR(255),
      IN p_phone VARCHAR(20),
      IN p_password VARCHAR(255),
      IN p_organization_type VARCHAR(20),
      IN p_contact_person_name VARCHAR(255),
      IN p_contact_person_email VARCHAR(255),
      IN p_contact_person_phone VARCHAR(20),
      IN p_website VARCHAR(255),
      IN p_role_id INT
    )
    BEGIN
      DECLARE user_exists INT;
      DECLARE email_exists INT;
      
      -- Check if user exists
      SELECT COUNT(*) INTO user_exists
      FROM tbl_users
      WHERE id = p_user_id;
      
      IF user_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFound|User not found';
      END IF;
      
      -- Check if partner with this email already exists
      SELECT COUNT(*) INTO email_exists
      FROM tbl_partners
      WHERE email = p_email;
      
      IF email_exists > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E400|EmailExists|Partner with this email already exists';
      END IF;
      
      -- Insert new partner
      INSERT INTO tbl_partners (
        user_id,
        partner_type,
        name,
        email,
        phone,
        password,
        organization_type,
        contact_person_name,
        contact_person_email,
        contact_person_phone,
        website,
        status,
        roleId,
        mustChangePassword,
        refresh_token,
        created_at,
        updated_at
      ) VALUES (
        p_user_id,
        p_partner_type,
        p_name,
        p_email,
        p_phone,
        p_password,
        p_organization_type,
        p_contact_person_name,
        p_contact_person_email,
        p_contact_person_phone,
        p_website,
        'Pending',
        p_role_id,
        1,
        NULL,
        NOW(),
        NOW()
      );
      
      -- Return the newly created partner
      SELECT * FROM tbl_partners WHERE id = LAST_INSERT_ID();
    END`);

    // Procedure: Get All Partners
    await sequelize.query(`DROP PROCEDURE IF EXISTS GetAllPartners`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetAllPartners (
      IN p_search_term VARCHAR(255),
      IN p_status VARCHAR(20),
      IN p_partner_type VARCHAR(20),
      IN p_limit INT,
      IN p_offset INT,
      IN p_is_all BOOLEAN
    )
    BEGIN
      SELECT COUNT(*) AS total_count
      FROM tbl_partners AS p
      WHERE 
        (p_search_term IS NULL OR p_search_term = '' 
        OR p.name LIKE CONCAT('%', p_search_term, '%') 
        OR p.email LIKE CONCAT('%', p_search_term, '%') 
        OR p.phone LIKE CONCAT('%', p_search_term, '%'))
        AND (p_status IS NULL OR p.status = p_status)
        AND (p_partner_type IS NULL OR p.partner_type = p_partner_type);

      IF p_is_all THEN
        SELECT 
          p.id,
          p.user_id,
          p.partner_type,
          p.name,
          p.email,
          p.phone,
          -- p.password,
          p.organization_type,
          p.contact_person_name,
          p.contact_person_email,
          p.contact_person_phone,
          p.website,
          p.description,
          p.logo,
          p.status,
          p.session_token,
          p.refresh_token,
          p.roleId,
          p.mustChangePassword,
          p.created_at,
          p.updated_at,
          u.id AS 'user.id', 
          u.username AS 'user.username',
          u.email AS 'user.email'
        FROM tbl_partners p
        LEFT JOIN tbl_users u ON p.user_id = u.id
        WHERE (p_search_term IS NULL OR p_search_term = '' 
        OR p.name LIKE CONCAT('%', p_search_term, '%') 
        OR p.email LIKE CONCAT('%', p_search_term, '%') 
        OR p.phone LIKE CONCAT('%', p_search_term, '%'))
        AND (p_status IS NULL OR p.status = p_status)
        AND (p_partner_type IS NULL OR p.partner_type = p_partner_type)
        ORDER BY p.created_at DESC;
      ELSE
        SELECT 
          p.id,
          p.user_id,
          p.partner_type,
          p.name,
          p.email,
          p.phone,
          -- p.password,
          p.organization_type,
          p.contact_person_name,
          p.contact_person_email,
          p.contact_person_phone,
          p.website,
          p.description,
          p.logo,
          p.status,
          p.session_token,
          p.refresh_token,
          p.roleId,
          p.mustChangePassword,
          p.created_at,
          p.updated_at,
          u.id AS 'user.id', 
          u.username AS 'user.username',
          u.email AS 'user.email'
        FROM tbl_partners p
        LEFT JOIN tbl_users u ON p.user_id = u.id
        WHERE (p_search_term IS NULL OR p_search_term = '' 
        OR p.name LIKE CONCAT('%', p_search_term, '%') 
        OR p.email LIKE CONCAT('%', p_search_term, '%') 
        OR p.phone LIKE CONCAT('%', p_search_term, '%'))
        AND (p_status IS NULL OR p.status = p_status)
        AND (p_partner_type IS NULL OR p.partner_type = p_partner_type)
        ORDER BY p.created_at DESC
        LIMIT p_limit OFFSET p_offset;
      END IF;
    END`);

    // Procedure: Get Partner By ID
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetPartnerById (
      IN p_partner_id INT
    )
    BEGIN
      SELECT 
        p.id,
        p.user_id,
        p.partner_type,
        p.name,
        p.email,
        p.phone,
        p.password,
        p.organization_type,
        p.contact_person_name,
        p.contact_person_email,
        p.contact_person_phone,
        p.website,
        p.description,
        p.logo,
        p.status,
        p.session_token,
        p.refresh_token,
        p.roleId,
        p.mustChangePassword,
        p.created_at,
        p.updated_at,
        u.id AS 'user.id',
        u.full_name AS 'user.full_name', 
        u.username AS 'user.username',
        u.email AS 'user.email'
      FROM tbl_partners p
      LEFT JOIN tbl_users u ON p.user_id = u.id
      WHERE p.id = p_partner_id;
    END`);

    // Procedure: Update Partner Status
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdatePartnerStatus (
      IN p_partner_id INT,
      IN p_status VARCHAR(20)
    )
    BEGIN
      DECLARE partner_exists INT;
      
      -- Check if partner exists
      SELECT COUNT(*) INTO partner_exists
      FROM tbl_partners
      WHERE id = p_partner_id;
      
      IF partner_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFound|Partner not found';
      END IF;
      
      -- Update partner status
      UPDATE tbl_partners
      SET 
        status = p_status,
        updated_at = NOW()
      WHERE id = p_partner_id;
      
      -- Return updated partner
      SELECT * FROM tbl_partners WHERE id = p_partner_id;
    END`);

    // Procedure: Update Partner Password
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdatePartnerPassword (
      IN p_partner_id INT,
      IN p_password VARCHAR(255)
    )
    BEGIN
      DECLARE partner_exists INT;
      
      -- Check if partner exists
      SELECT COUNT(*) INTO partner_exists
      FROM tbl_partners
      WHERE id = p_partner_id;
      
      IF partner_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFound|Partner not found';
      END IF;
      
      -- Update partner password
      UPDATE tbl_partners
      SET 
        password = p_password,
        updated_at = NOW()
      WHERE id = p_partner_id;
      
      -- Return updated partner
      SELECT * FROM tbl_partners WHERE id = p_partner_id;
    END`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS MustUpdatePartnerPassword (
      IN p_partner_id INT,
      IN p_password VARCHAR(255)
    )
    BEGIN
      DECLARE partner_exists INT;
      
      -- Check if partner exists
      SELECT COUNT(*) INTO partner_exists
      FROM tbl_partners
      WHERE id = p_partner_id;
      
      IF partner_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFound|Partner not found';
      END IF;
      
      -- Update partner password
      UPDATE tbl_partners
      SET 
        mustChangePassword = 0,
        password = p_password,
        updated_at = NOW()
      WHERE id = p_partner_id;
      
      -- Return updated partner
      SELECT * FROM tbl_partners WHERE id = p_partner_id;
    END`);

    // Procedure: Update Partner Profile
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdatePartnerProfile (
      IN p_partner_id INT,
      IN p_name VARCHAR(255),
      IN p_email VARCHAR(255),
      IN p_phone VARCHAR(20),
      IN p_website VARCHAR(255),
      IN p_description TEXT,
      IN p_logo VARCHAR(255),
      IN p_contact_person_name VARCHAR(255),
      IN p_contact_person_email VARCHAR(255),
      IN p_contact_person_phone VARCHAR(20)
    )
    BEGIN
      DECLARE partner_exists INT;
      DECLARE email_exists INT;
      
      -- Check if partner exists
      SELECT COUNT(*) INTO partner_exists
      FROM tbl_partners
      WHERE id = p_partner_id;
      
      IF partner_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFound|Partner not found';
      END IF;
      
      -- Check if email already exists with another partner
      IF p_email IS NOT NULL THEN
        SELECT COUNT(*) INTO email_exists
        FROM tbl_partners
        WHERE email = p_email AND id != p_partner_id;
        
        IF email_exists > 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'E400|EmailExists|Email already in use by another partner';
        END IF;
      END IF;
      
      -- Update partner profile
      UPDATE tbl_partners
      SET 
        name = IFNULL(p_name, name),
        email = IFNULL(p_email, email),
        phone = IFNULL(p_phone, phone),
        website = IFNULL(p_website, website),
        description = IFNULL(p_description, description),
        logo = IFNULL(p_logo, logo),
        contact_person_name = IFNULL(p_contact_person_name, contact_person_name),
        contact_person_email = IFNULL(p_contact_person_email, contact_person_email),
        contact_person_phone = IFNULL(p_contact_person_phone, contact_person_phone),
        updated_at = NOW()
      WHERE id = p_partner_id;
      
      -- Return updated partner
      SELECT * FROM tbl_partners WHERE id = p_partner_id;
    END`);

    // Procedure: Delete Partner
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS DeletePartner (
      IN p_partner_id INT
    )
    BEGIN
      DECLARE partner_exists INT;
      DECLARE partner_logo VARCHAR(255);
      
      -- Get partner logo path before deletion (for file deletion)
      SELECT logo INTO partner_logo 
      FROM tbl_partners
      WHERE id = p_partner_id;
      
      -- Check if partner exists
      SELECT COUNT(*) INTO partner_exists
      FROM tbl_partners
      WHERE id = p_partner_id;
      
      IF partner_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFound|Partner not found';
      END IF;
      
      -- Delete the partner
      DELETE FROM tbl_partners
      WHERE id = p_partner_id;
      
      -- Return logo path (to delete the file after procedure call)
      SELECT partner_logo as logo_path;
    END`);

    // Procedure: Find Partner By Email Or Username
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS FindPartnerByEmail (
      IN p_email VARCHAR(255)
    )
    BEGIN
      SELECT * FROM tbl_partners
      WHERE email = p_email;
    END`);

    // Procedure: Update Partner Session Token
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdatePartnerSessionToken (
      IN p_partner_id INT,
      IN p_session_token VARCHAR(255)
    )
    BEGIN
      DECLARE partner_exists INT;
      
      -- Check if partner exists
      SELECT COUNT(*) INTO partner_exists
      FROM tbl_partners
      WHERE id = p_partner_id;
      
      IF partner_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFound|Partner not found';
      END IF;
      
      -- Update partner session token
      UPDATE tbl_partners
      SET 
        session_token = p_session_token,
        updated_at = NOW()
      WHERE id = p_partner_id;
      
      -- Return updated partner
      SELECT * FROM tbl_partners WHERE id = p_partner_id;
    END`);

    // Procedure: Update Partner Refresh Token
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdatePartnerRefreshToken(
      IN p_partner_id INT,
      IN p_refresh_token TEXT
    )
    BEGIN
      UPDATE tbl_partners
      SET refresh_token = p_refresh_token,
          updated_at = NOW()
      WHERE id = p_partner_id;
    END`);

    // Procedure: Get Partner Or Admin By Email (for password reset)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetPartnerOrAdminByEmail (
      IN p_email VARCHAR(255)
    )
    BEGIN
      DECLARE user_type VARCHAR(50);

      -- First check in partners
      SELECT 'partner' INTO user_type
      FROM tbl_partners as p
      WHERE p.email = p_email
      LIMIT 1;

      -- If not found in partners, check in admins
      IF user_type IS NULL THEN
          SELECT 'admin' INTO user_type
          FROM tbl_admin as a
          WHERE a.email = p_email
          LIMIT 1;
      END IF;

      -- If no match, raise error
      IF user_type IS NULL THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'E404|NotFound|User not found with this email';
      END IF;

      -- Return user type
      SELECT user_type;
    END
    `);

    // Procedure: Reset Partner Password
    await sequelize.query(`
DROP PROCEDURE IF EXISTS ResetPartnerOrAdminPassword;
CREATE PROCEDURE ResetPartnerOrAdminPassword(
    IN p_email VARCHAR(255),
    IN p_password VARCHAR(255)
)
BEGIN
    DECLARE user_type VARCHAR(50);

    -- Find if it's partner
    SELECT 'partner' INTO user_type
    FROM tbl_partners
    WHERE email = p_email
    LIMIT 1;

    -- If not partner, check admin
    IF user_type IS NULL THEN
        SELECT 'admin' INTO user_type
        FROM tbl_admin
        WHERE email = p_email
        LIMIT 1;
    END IF;

    -- If no match, raise error
    IF user_type IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFound|User not found with this email';
    END IF;

    -- Update password based on user type
    IF user_type = 'partner' THEN
        UPDATE tbl_partners
        SET 
            password = p_password,
            mustChangePassword = 0,
            updated_at = NOW()
        WHERE email = p_email;

        SELECT 'partner' AS user_type, p.* 
        FROM tbl_partners as p
        WHERE email = p_email;

    ELSEIF user_type = 'admin' THEN
        UPDATE tbl_admin
        SET 
            password = p_password,
            updated_at = NOW()
        WHERE email = p_email;

        SELECT 'admin' AS user_type, a.* 
        FROM tbl_admin as a
        WHERE email = p_email;
    END IF;
END;
`);


    console.log("✅ Partner procedures created!");
  } catch (error) {
    console.error("❌ Error setting up Partner procedures:", error);
    throw error;
  }
};

module.exports = setupPartnerProcedures;