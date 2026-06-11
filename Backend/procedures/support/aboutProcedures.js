const sequelize = require("../../config/db");

const setupAboutProcedures = async () => {
  try {
    console.log("🔄 Setting up About procedures...");

    // Procedure: createAbout
    await sequelize.query(`DROP PROCEDURE IF EXISTS createAbout`);
    await sequelize.query(`CREATE PROCEDURE createAbout(
      IN p_name VARCHAR(255),
      IN p_position VARCHAR(255),
      IN p_description TEXT,
      IN p_x VARCHAR(255),
      IN p_instagram VARCHAR(255),
      IN p_facebook VARCHAR(255),
      IN p_email VARCHAR(255),
      IN p_status VARCHAR(20),
      IN p_img VARCHAR(255)
    )
    BEGIN
      DECLARE name_exists INT DEFAULT 0;
      SELECT COUNT(*) INTO name_exists
      FROM tbl_about
      WHERE name = p_name AND (p_email IS NULL OR email = p_email);

      IF name_exists > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E409|DuplicateAboutError|About entry with this name and email already exists.',
        MYSQL_ERRNO = 1062;
      ELSE
        INSERT INTO tbl_about (
          name,
          position,
          description,
          x,
          instagram,
          facebook,
          email,
          status,
          img,
          created_at,
          updated_at
        ) VALUES (
          p_name,
          p_position,
          p_description,
          p_x,
          p_instagram,
          p_facebook,
          p_email,
          p_status,
          p_img,
          NOW(),
          NOW()
        );
      END IF;
    END
    `);

    // Procedure: getAllAbout
    await sequelize.query(`DROP PROCEDURE IF EXISTS getAllAbout`);
    await sequelize.query(`CREATE PROCEDURE getAllAbout(
      IN p_search_term VARCHAR(255),
      IN p_status VARCHAR(20),
      IN p_all TINYINT(1),
      IN p_limit INT,
      IN p_offset INT
    )
    BEGIN
      DECLARE v_offset INT DEFAULT 0;

      IF p_offset IS NOT NULL THEN
        SET v_offset = p_offset;
      END IF;

      IF p_all = 1 OR p_limit IS NULL THEN
        SELECT *
        FROM tbl_about
        WHERE (
          p_search_term IS NULL OR p_search_term = ''
          OR name LIKE CONCAT('%', p_search_term, '%')
          OR position LIKE CONCAT('%', p_search_term, '%')
        )
        AND (
          p_status IS NULL OR p_status = ''
          OR COALESCE(status, 'active') = p_status
        );
      ELSE
        SELECT *
        FROM tbl_about
        WHERE (
          p_search_term IS NULL OR p_search_term = ''
          OR name LIKE CONCAT('%', p_search_term, '%')
          OR position LIKE CONCAT('%', p_search_term, '%')
        )
        AND (
          p_status IS NULL OR p_status = ''
          OR COALESCE(status, 'active') = p_status
        )
        LIMIT p_limit OFFSET v_offset;
      END IF;
    END`);

    // Procedure: updateAbout
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateAbout(
      IN p_id INT,
      IN p_name VARCHAR(255),
      IN p_position VARCHAR(255),
      IN p_description TEXT,
      IN p_x VARCHAR(255),
      IN p_instagram VARCHAR(255),
      IN p_facebook VARCHAR(255),
      IN p_email VARCHAR(255),
      IN p_img VARCHAR(255)
    )
    BEGIN
      DECLARE about_exists INT;
      SELECT COUNT(*) INTO about_exists
      FROM tbl_about
      WHERE id = p_id;

      IF about_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|About entry not found.';
      ELSE
        UPDATE tbl_about
        SET name = p_name,
            position = p_position,
            description = p_description,
            x = p_x,
            instagram = p_instagram,
            facebook = p_facebook,
            email = p_email,
            img = p_img,
            updated_at = NOW()
        WHERE id = p_id;
      END IF;
    END
    `);

    // Procedure: updateAboutStatus
    await sequelize.query(`DROP PROCEDURE IF EXISTS updateAboutStatus`);
    await sequelize.query(`CREATE PROCEDURE updateAboutStatus(
      IN p_id INT,
      IN p_status VARCHAR(20)
    )
    BEGIN
      DECLARE about_exists INT;
      SELECT COUNT(*) INTO about_exists
      FROM tbl_about
      WHERE id = p_id;

      IF about_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|About entry not found.';
      ELSE
        UPDATE tbl_about
        SET status = p_status,
            updated_at = NOW()
        WHERE id = p_id;
      END IF;
    END
    `);

    // Procedure: deleteAbout
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteAbout(IN p_id INT)
    BEGIN
      DECLARE about_exists INT;
      SELECT COUNT(*) INTO about_exists
      FROM tbl_about
      WHERE id = p_id;

      IF about_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|About entry not found.';
      ELSE
        DELETE FROM tbl_about WHERE id = p_id;
      END IF;
    END
    `);

    console.log("✅ About procedures created!");
  } catch (error) {
    console.error("❌ Error setting up About procedures:", error);
    throw error;
  }
};

module.exports = setupAboutProcedures;