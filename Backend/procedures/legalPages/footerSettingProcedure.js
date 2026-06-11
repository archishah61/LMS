const sequelize = require("../../config/db");

const setupFooterSettingProcedures = async () => {
    try {
        console.log("🔄 Setting up Footer Setting procedures...");

        // Get the single footer settings record
        await sequelize.query(`DROP PROCEDURE IF EXISTS getFooterSettings`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getFooterSettings()
            BEGIN
                SELECT * FROM tbl_footer_settings LIMIT 1;
            END`);

        // Upsert a single field on the footer settings record
        await sequelize.query(`DROP PROCEDURE IF EXISTS upsertFooterField`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS upsertFooterField(
    IN p_field VARCHAR(50),
    IN p_value VARCHAR(500),
    IN p_userId INT
)
BEGIN
    DECLARE existing_id INT DEFAULT NULL;

    SELECT id INTO existing_id FROM tbl_footer_settings ORDER BY id ASC LIMIT 1;

    IF existing_id IS NULL THEN
        INSERT INTO tbl_footer_settings (
            address, phone, email, timing, headerLogo, footerLogo,
            createdBy, updatedBy, created_at, updated_at
        ) VALUES (
            IF(p_field = 'address', p_value, ''),
            IF(p_field = 'phone', p_value, ''),
            IF(p_field = 'email', p_value, ''),
            IF(p_field = 'timing', p_value, ''),
            IF(p_field = 'headerLogo', p_value, NULL),
            IF(p_field = 'footerLogo', p_value, NULL),
            p_userId, p_userId, NOW(), NOW()
        );

        SET existing_id = LAST_INSERT_ID();
    ELSE
        UPDATE tbl_footer_settings
        SET
            address = CASE WHEN p_field = 'address' THEN p_value ELSE address END,
            phone   = CASE WHEN p_field = 'phone'   THEN p_value ELSE phone   END,
            email   = CASE WHEN p_field = 'email'   THEN p_value ELSE email   END,
            timing  = CASE WHEN p_field = 'timing'  THEN p_value ELSE timing  END,
            headerLogo = CASE WHEN p_field = 'headerLogo' THEN p_value ELSE headerLogo END,
            footerLogo = CASE WHEN p_field = 'footerLogo' THEN p_value ELSE footerLogo END,
            updatedBy = p_userId,
            updated_at = NOW()
        WHERE id = existing_id;
    END IF;

    SELECT * FROM tbl_footer_settings WHERE id = existing_id;
END`);

        console.log("✅ Footer Setting procedures created!");
    } catch (error) {
        console.error("❌ Error setting up Footer Setting procedures:", error);
        throw error;
    }
};

module.exports = setupFooterSettingProcedures;