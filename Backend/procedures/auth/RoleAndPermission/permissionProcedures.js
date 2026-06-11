const sequelize = require("../../../config/db");

const setupPermissionProcedures = async () => {
  try {
    console.log("🔄 Setting up Permission procedures...");

    // DROP + CREATE: createPermission
    await sequelize.query(`DROP PROCEDURE IF EXISTS createPermission;`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createPermission (
      IN p_section VARCHAR(255),
      IN p_description VARCHAR(255),
      IN p_action ENUM('create', 'edit', 'delete', 'view', 'toggle')
    )
    BEGIN
      IF EXISTS (SELECT 1 FROM tbl_permissions WHERE section = p_section AND action = p_action) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Permission already exists for this section and action.';
      ELSE
        INSERT INTO tbl_permissions (section, description, action, created_at, updated_at)
        VALUES (p_section, p_description, p_action, NOW(), NOW());
        
        SELECT * FROM tbl_permissions WHERE id = LAST_INSERT_ID();
      END IF;
    END;`);

    // DROP + CREATE: updatePermission
    await sequelize.query(`DROP PROCEDURE IF EXISTS updatePermission;`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updatePermission (
      IN p_id INT,
      IN p_section VARCHAR(255),
      IN p_description VARCHAR(255),
      IN p_action ENUM('create', 'edit', 'delete', 'view', 'toggle')
    )
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM tbl_permissions WHERE id = p_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Permission not found.';
      ELSEIF EXISTS (
        SELECT 1 FROM tbl_permissions WHERE section = p_section AND action = p_action AND id != p_id
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Permission already used by another record.';
      ELSE
        UPDATE tbl_permissions
        SET section = p_section,
            description = p_description,
            action = p_action,
            updated_at = NOW()
        WHERE id = p_id;

        SELECT * FROM tbl_permissions WHERE id = p_id;
      END IF;
    END;`);

    // DROP + CREATE: getAllPermissions
    await sequelize.query(`DROP PROCEDURE IF EXISTS getAllPermissions;`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllPermissions(
    IN p_search_term VARCHAR(255),
    IN p_limit VARCHAR(10),
    IN p_offset INT
)
BEGIN
    -- =========================
    -- 1 Base WHERE clause
    -- =========================
    SET @where_sql = ' WHERE 1 = 1';

    IF p_search_term IS NOT NULL AND p_search_term != '' THEN
        SET @where_sql = CONCAT(
            @where_sql,
            ' AND (section LIKE "%', p_search_term, '%" 
               OR description LIKE "%', p_search_term, '%")'
        );
    END IF;

    -- =========================
    -- 2 TOTAL COUNT QUERY
    -- =========================
    SET @count_sql = 'SELECT COUNT(*) AS total_count FROM tbl_permissions';

    PREPARE count_stmt FROM @count_sql;
    EXECUTE count_stmt;
    DEALLOCATE PREPARE count_stmt;

    -- =========================
    -- 3 MAIN DATA QUERY (same response)
    -- =========================
    SET @data_sql = CONCAT(
        'SELECT * FROM tbl_permissions',
        @where_sql,
        ' ORDER BY section'
    );

    IF p_limit IS NOT NULL AND p_limit != 'ALL' THEN
        SET @data_sql = CONCAT(
            @data_sql,
            ' LIMIT ', p_limit, ' OFFSET ', p_offset
        );
    END IF;

    PREPARE data_stmt FROM @data_sql;
    EXECUTE data_stmt;
    DEALLOCATE PREPARE data_stmt;

END;`);

    // DROP + CREATE: getPermissionById
    await sequelize.query(`DROP PROCEDURE IF EXISTS getPermissionById;`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getPermissionById(IN p_id INT)
    BEGIN
      SELECT * FROM tbl_permissions WHERE id = p_id;
    END;`);

    // DROP + CREATE: deletePermission
    await sequelize.query(`DROP PROCEDURE IF EXISTS deletePermission;`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deletePermission(IN p_id INT)
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM tbl_permissions WHERE id = p_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Permission not found.';
      ELSE
        DELETE FROM tbl_permissions WHERE id = p_id;
      END IF;
    END;`);

    console.log("✅ Permission procedures created!");
  } catch (error) {
    console.error("❌ Error setting up Permission procedures:", error);
    throw error;
  }
};

module.exports = setupPermissionProcedures;
