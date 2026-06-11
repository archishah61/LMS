const sequelize = require("../../config/db");

const setupContactProcedures = async () => {
  try {
    console.log("🔄 Setting up Contact procedures...");

    // Procedure: createContact
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS createContact(
        IN p_fullName VARCHAR(255),
        IN p_email VARCHAR(255),
        IN p_subject VARCHAR(255),
        IN p_message TEXT
      )
      BEGIN
        INSERT INTO tbl_contacts (fullName, email, subject, message, created_at, updated_at)
        VALUES (p_fullName, p_email, p_subject, p_message, NOW(), NOW());

        SELECT * FROM tbl_contacts WHERE id = LAST_INSERT_ID();
      END
    `);

    // Procedure: getAllContacts
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS getAllContacts()
      BEGIN
        SELECT * FROM tbl_contacts ORDER BY created_at DESC;
      END
    `);

    await sequelize.query(`DROP PROCEDURE IF EXISTS getAllContacts`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllContacts(
        IN p_limit INT,
        IN p_offset INT,
        IN p_is_all BOOLEAN,
        IN p_read VARCHAR(10)
    )
    BEGIN
        IF p_read = 'all' THEN
          SELECT COUNT(*) AS total_count
          FROM tbl_contacts;
        ELSEIF p_read = 'read' THEN
          SELECT COUNT(*) AS total_count
          FROM tbl_contacts
          WHERE isRead = 1;
        ELSEIF p_read = 'unread' THEN
          SELECT COUNT(*) AS total_count
          FROM tbl_contacts
          WHERE isRead = 0;
        END IF;

        IF p_is_all THEN 
          IF p_read = 'all' THEN
            SELECT *
            FROM tbl_contacts
            ORDER BY created_at DESC;
          ELSEIF p_read = 'read' THEN
            SELECT *
            FROM tbl_contacts
            WHERE isRead = 1
            ORDER BY created_at DESC;
          ELSEIF p_read = 'unread' THEN
            SELECT *
            FROM tbl_contacts
            WHERE isRead = 0
            ORDER BY created_at DESC;
          END IF;
        ELSE
          IF p_read = 'all' THEN
            SELECT *
            FROM tbl_contacts
            ORDER BY created_at DESC
            LIMIT p_limit OFFSET p_offset;
          ELSEIF p_read = 'read' THEN
            SELECT *
            FROM tbl_contacts
            WHERE isRead = 1
            ORDER BY created_at DESC
            LIMIT p_limit OFFSET p_offset;
          ELSEIF p_read = 'unread' THEN
            SELECT *
            FROM tbl_contacts
            WHERE isRead = 0
            ORDER BY created_at DESC
            LIMIT p_limit OFFSET p_offset;
          END IF;
        END IF;
    END`);

    // Procedure: deleteContactById
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS deleteContactById(IN p_id INT)
      BEGIN
        DECLARE err_message VARCHAR(255);

        IF NOT EXISTS (SELECT 1 FROM tbl_contacts WHERE id = p_id) THEN
          SET err_message = 'E404|NotFoundError|Contact not found';
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = err_message;
        END IF;

        DELETE FROM tbl_contacts WHERE id = p_id;
        SELECT 'Contact deleted successfully' AS message;
      END
    `);

    // Procedure: deleteAllContacts
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS deleteAllContacts()
      BEGIN
        DELETE FROM tbl_contacts;
        SELECT 'All contacts deleted successfully' AS message;
      END
    `);

    // Procedure: markContactAsReadById
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS markContactAsReadById(IN p_id INT)
      BEGIN
        DECLARE err_message VARCHAR(255);

        IF NOT EXISTS (SELECT 1 FROM tbl_contacts WHERE id = p_id) THEN
          SET err_message = 'E404|NotFoundError|Contact not found';
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = err_message;
        END IF;

        UPDATE tbl_contacts SET isRead = TRUE, updated_at = NOW() WHERE id = p_id;
        SELECT * FROM tbl_contacts WHERE id = p_id;
      END
    `);

    // Procedure: markAllContactsAsRead
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS markAllContactsAsRead()
      BEGIN
        UPDATE tbl_contacts SET isRead = TRUE, updated_at = NOW();
        SELECT * FROM tbl_contacts;
      END
    `);

    console.log("✅ Contact procedures created!");
  } catch (error) {
    console.error("❌ Error setting up contact procedures:", error);
    throw error;
  }
};

module.exports = setupContactProcedures;
