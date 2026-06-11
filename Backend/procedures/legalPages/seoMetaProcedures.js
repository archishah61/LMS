const sequelize = require("../../config/db");

const setupSeoMetaProcedures = async () => {
    try {
        console.log("🔄 Setting up SEO Meta procedures...");

        // ------------------------------------------------------------
        // 1️⃣ GET BY PAGE TYPE
        // ------------------------------------------------------------
        await sequelize.query(`DROP PROCEDURE IF EXISTS getSeoMetaByPageType`);
        await sequelize.query(`
        CREATE PROCEDURE getSeoMetaByPageType(
            IN p_page_type VARCHAR(255)
        )
        BEGIN
            SELECT * FROM tbl_seo_meta
            WHERE page_type = p_page_type
            LIMIT 1;
        END;
        `);

        // ------------------------------------------------------------
        // 2️⃣ SAVE (CREATE or UPDATE)
        // ------------------------------------------------------------
        await sequelize.query(`DROP PROCEDURE IF EXISTS saveSeoMeta`);
        await sequelize.query(`
        CREATE PROCEDURE saveSeoMeta(
            IN p_id INT,
            IN p_og_image VARCHAR(255),
            IN p_og_alt VARCHAR(255),
            IN p_og_title VARCHAR(255),
            IN p_og_description TEXT,
            IN p_og_keywords TEXT,

            IN p_seo_image VARCHAR(255),
            IN p_seo_alt VARCHAR(255),
            IN p_seo_title VARCHAR(255),
            IN p_seo_description TEXT,
            IN p_seo_keywords TEXT,
            IN p_canonical_url VARCHAR(255),

            IN p_page_type VARCHAR(255),
            IN p_created_by INT,
            IN p_updated_by INT
        )
        BEGIN
            DECLARE v_exists INT DEFAULT 0;

            -- Check if record with id exists
            SELECT COUNT(*) INTO v_exists
            FROM tbl_seo_meta
            WHERE id = p_id;

            IF v_exists = 0 THEN
                -- CREATE NEW
                INSERT INTO tbl_seo_meta (
                    og_image, og_alt, og_title, og_description, og_keywords,
                    seo_image, seo_alt, seo_title, seo_description, seo_keywords,
                    canonical_url, page_type,
                    created_by, updated_by,
                    is_active, created_at, updated_at
                )
                VALUES (
                    p_og_image, p_og_alt, p_og_title, p_og_description, p_og_keywords,
                    p_seo_image, p_seo_alt, p_seo_title, p_seo_description, p_seo_keywords,
                    p_canonical_url, p_page_type,
                    p_created_by, p_updated_by,
                    TRUE, NOW(), NOW()
                );

                SELECT * FROM tbl_seo_meta WHERE id = LAST_INSERT_ID();

            ELSE
                -- UPDATE EXISTING
                UPDATE tbl_seo_meta
                SET 
                    og_image = p_og_image,
                    og_alt = p_og_alt,
                    og_title = p_og_title,
                    og_description = p_og_description,
                    og_keywords = p_og_keywords,

                    seo_image = p_seo_image,
                    seo_alt = p_seo_alt,
                    seo_title = p_seo_title,
                    seo_description = p_seo_description,
                    seo_keywords = p_seo_keywords,
                    canonical_url = p_canonical_url,

                    page_type = p_page_type,
                    updated_by = p_updated_by,
                    updated_at = NOW()
                WHERE id = p_id;

                SELECT * FROM tbl_seo_meta WHERE id = p_id;
            END IF;
        END;
        `);

        // ------------------------------------------------------------
        // 3️⃣ TOGGLE ACTIVE STATUS
        // ------------------------------------------------------------
        await sequelize.query(`DROP PROCEDURE IF EXISTS toggleSeoMetaStatus`);
        await sequelize.query(`
        CREATE PROCEDURE toggleSeoMetaStatus(
            IN p_id INT,
            IN p_updated_by INT
        )
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM tbl_seo_meta WHERE id = p_id) THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SEO meta entry not found.';
            ELSE
                UPDATE tbl_seo_meta
                SET 
                    is_active = NOT is_active,
                    updated_by = p_updated_by,
                    updated_at = NOW()
                WHERE id = p_id;

                SELECT * FROM tbl_seo_meta WHERE id = p_id;
            END IF;
        END;
        `);

        console.log("✅ SEO Meta procedures created!");
    } catch (error) {
        console.error("❌ Error setting up SEO Meta procedures:", error);
        throw error;
    }
};

module.exports = setupSeoMetaProcedures;
