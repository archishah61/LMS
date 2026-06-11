const sequelize = require("../../../config/db");

const setupRoleProcedures = async () => {
    try {
        console.log("🔄 Setting up Role procedures...");

        await sequelize.query(`DROP PROCEDURE IF EXISTS createRole;`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createRole (
    IN p_name VARCHAR(255),
    IN p_description VARCHAR(255)
)
BEGIN
    -- Check if role name already exists
    IF EXISTS (SELECT 1 FROM tbl_roles WHERE name = p_name) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Role name already exists.';
    ELSE
        INSERT INTO tbl_roles (
            name, description, created_at, updated_at
        ) VALUES (
            p_name, p_description, NOW(), NOW()
        );

        SELECT * FROM tbl_roles WHERE id = LAST_INSERT_ID();
    END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS updateRole;`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateRole (
    IN p_id INT,
    IN p_name VARCHAR(255),
    IN p_description VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tbl_roles WHERE id = p_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Role not found.';
    ELSEIF EXISTS (
        SELECT 1 FROM tbl_roles WHERE name = p_name AND id != p_id
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Role name already used by another record.';
    ELSE
        UPDATE tbl_roles
        SET name = p_name,
            description = p_description,
            updated_at = NOW()
        WHERE id = p_id;

        SELECT * FROM tbl_roles WHERE id = p_id;
    END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getAllRoles;`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllRoles(
    IN p_search_term VARCHAR(255),
    IN p_limit VARCHAR(10),
    IN p_offset INT
)
BEGIN
    -- BASE QUERY
    SET @sql = 'SELECT * FROM tbl_roles WHERE 1 = 1';

    -- SEARCH FILTER
    IF p_search_term IS NOT NULL AND p_search_term != '' THEN
        SET @sql = CONCAT(
            @sql,
            ' AND (name LIKE "%', p_search_term, '%"
                   OR description LIKE "%', p_search_term, '%")'
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
    SET @sql = CONCAT(@sql, ' ORDER BY name');

    IF p_limit IS NOT NULL AND p_limit != 'ALL' THEN
        SET @sql = CONCAT(@sql, ' LIMIT ', p_limit, ' OFFSET ', p_offset);
    END IF;

    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getRoleById;`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getRoleById(IN p_id INT)
BEGIN
    SELECT * FROM tbl_roles WHERE id = p_id;
END`);

await sequelize.query(`DROP PROCEDURE IF EXISTS getRoleByName;`);
await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getRoleByName(IN p_name VARCHAR(255))
BEGIN
    SELECT * FROM tbl_roles WHERE name = p_name;
END`);

await sequelize.query(`DROP PROCEDURE IF EXISTS deleteRole;`);
await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteRole(IN p_id INT)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tbl_roles WHERE id = p_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Role not found.';
    ELSE
        DELETE FROM tbl_roles WHERE id = p_id;
    END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS toggleRoleStatus;`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS toggleRoleStatus(IN p_id INT)
BEGIN    
    IF NOT EXISTS (SELECT 1 FROM tbl_roles WHERE id = p_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Role not found.';
    ELSE
        -- Toggle role status
        UPDATE tbl_roles
        SET is_active = NOT is_active
        WHERE id = p_id;
        
        -- Return role details with both admin and partner IDs
        SELECT 
            r.*,
            JSON_OBJECT(
                'admin_ids', (
                    SELECT JSON_ARRAYAGG(a.id)
                    FROM tbl_admin a
                    WHERE a.roleId = p_id
                ),
                'partner_ids', (
                    SELECT JSON_ARRAYAGG(p.id)
                    FROM tbl_partners p
                    WHERE p.roleId = p_id
                )
            ) AS user_details
        FROM tbl_roles r
        WHERE r.id = p_id;
    END IF;
END`);

        console.log("✅ Role procedures created!");
    } catch (error) {
        console.error("❌ Error setting up Role procedures:", error);
        throw error;
    }
};

module.exports = setupRoleProcedures;
