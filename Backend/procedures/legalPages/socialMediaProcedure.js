const sequelize = require("../../config/db");

const setupSocialMediaProcedures = async () => {
    try {
        console.log("🔄 Setting up Social Media procedures...");
        // Get social media links (single row)
        await sequelize.query(`
            CREATE PROCEDURE IF NOT EXISTS getSocialMediaLinks()
            BEGIN
                SELECT * FROM tbl_social_media ORDER BY id ASC LIMIT 1;
            END
        `);

        // Upsert a specific platform link
        await sequelize.query(`
            CREATE PROCEDURE IF NOT EXISTS upsertSocialMediaLink(
                IN p_platform VARCHAR(50),
                IN p_url VARCHAR(500),
                IN p_userId INT
            )
            BEGIN
                DECLARE existing_id INT DEFAULT NULL;

                SELECT id INTO existing_id FROM tbl_social_media ORDER BY id ASC LIMIT 1;

                IF existing_id IS NULL THEN
                    INSERT INTO tbl_social_media (
                        facebook, twitter, youtube, instagram, linkedin,
                        createdBy, updatedBy, created_at, updated_at
                    ) VALUES (
                        IF(p_platform = 'facebook', p_url, NULL),
                        IF(p_platform = 'twitter', p_url, NULL),
                        IF(p_platform = 'youtube', p_url, NULL),
                        IF(p_platform = 'instagram', p_url, NULL),
                        IF(p_platform = 'linkedin', p_url, NULL),
                        p_userId, p_userId, NOW(), NOW()
                    );

                    SET existing_id = LAST_INSERT_ID();
                ELSE
                    UPDATE tbl_social_media
                    SET
                        facebook = CASE WHEN p_platform = 'facebook' THEN p_url ELSE facebook END,
                        twitter  = CASE WHEN p_platform = 'twitter'  THEN p_url ELSE twitter  END,
                        youtube  = CASE WHEN p_platform = 'youtube'  THEN p_url ELSE youtube  END,
                        instagram= CASE WHEN p_platform = 'instagram'THEN p_url ELSE instagram END,
                        linkedin = CASE WHEN p_platform = 'linkedin' THEN p_url ELSE linkedin END,
                        updatedBy = p_userId,
                        updated_at = NOW()
                    WHERE id = existing_id;
                END IF;

                -- Return the updated row
                SELECT * FROM tbl_social_media WHERE id = existing_id;
            END
        `);

        console.log("✅ Social Media procedures created!");
    } catch (error) {
        console.error("❌ Error setting up Social Media procedures:", error);
        throw error;
    }
};

module.exports = setupSocialMediaProcedures;