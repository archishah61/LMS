const sequelize = require("../../../config/db");

const setupRoleAndPermissionProcedures = async () => {
    try {
        console.log("🔄 Setting up RoleAndPermission procedures...");

        await sequelize.query(`DROP PROCEDURE IF EXISTS manageRolePermission;`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS manageRolePermission(
    IN p_role_id INT,
    IN p_permissions JSON
)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE perm_id INT;
    DECLARE total INT;

    -- Get number of permission ids in the array
    SET total = JSON_LENGTH(p_permissions);

    -- Step 1: Add new permissions if they don't exist
    WHILE i < total DO
        SET perm_id = JSON_EXTRACT(p_permissions, CONCAT('$[', i, ']'));

        -- Remove quotes if needed (MySQL treats JSON_EXTRACT as JSON string)
        SET perm_id = TRIM(BOTH '"' FROM perm_id);

        IF NOT EXISTS (
            SELECT 1 FROM tbl_role_permissions 
            WHERE roleId = p_role_id AND permissionId = perm_id
        ) THEN
            INSERT INTO tbl_role_permissions (roleId, permissionId, created_at, updated_at)
            VALUES (p_role_id, perm_id, NOW(), NOW());
        END IF;

        SET i = i + 1;
    END WHILE;

    -- Step 2: Remove permissions that are not in the JSON array
    DELETE FROM tbl_role_permissions
    WHERE roleId = p_role_id
    AND (total < 1 OR permissionId NOT IN (
        SELECT CAST(JSON_UNQUOTE(JSON_EXTRACT(p_permissions, CONCAT('$[', seq.n, ']'))) AS UNSIGNED)
        FROM (
            WITH RECURSIVE seq AS (
                SELECT 0 AS n
                UNION ALL
                SELECT n + 1 FROM seq WHERE n + 1 < JSON_LENGTH(p_permissions)
            )
            SELECT * FROM seq
        ) AS seq
    ));
        END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getRolePermissionsByRoleId;`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getRolePermissionsByRoleId(
            IN p_role_id INT,
            IN p_status VARCHAR(20)
)
        BEGIN
        SELECT 
            rp.id AS role_permission_id,
            rp.roleId,
            rp.permissionId,
            p.section,
            p.description,
            p.action,
            rp.created_at,
            rp.updated_at
        FROM tbl_role_permissions rp
        JOIN tbl_permissions p ON rp.permissionId = p.id
        JOIN tbl_roles r ON rp.roleId = r.id
        WHERE rp.roleId = p_role_id AND (p_status IS NULL OR p_status = '' OR r.is_active = TRUE);
        END`);

        console.log("✅ RoleAndPermission procedures created!");
    } catch (error) {
        console.error("❌ Error setting up RoleAndPermission procedures:", error);
        throw error;
    }
};

module.exports = setupRoleAndPermissionProcedures;
