const sequelize = require("../../config/db");

const setupFrontendFeaturesProcedures = async () => {
    try {
        // Create Procedure
        await sequelize.query(`
            DROP PROCEDURE IF EXISTS createFrontendFeature;
        `);
        await sequelize.query(`
            CREATE PROCEDURE createFrontendFeature(
                IN p_icon VARCHAR(255),
                IN p_title VARCHAR(255),
                IN p_description TEXT,
                IN p_bgColor VARCHAR(255),
                IN p_is_active TINYINT(1),
                IN p_created_by INT,
                IN p_updated_by INT
            )
            BEGIN
                DECLARE v_max_sequence INT;
                SELECT IFNULL(MAX(sequence_no), 0) INTO v_max_sequence FROM tbl_frontend_features;
                
                INSERT INTO tbl_frontend_features (icon, title, description, bgColor, sequence_no, is_active, created_by, updated_by, created_at, updated_at)
                VALUES (p_icon, p_title, p_description, p_bgColor, v_max_sequence + 1, p_is_active, p_created_by, p_updated_by, NOW(), NOW());
                
                SELECT * FROM tbl_frontend_features WHERE id = LAST_INSERT_ID();
            END;
        `);

        // Get All Admin
        await sequelize.query(`
            DROP PROCEDURE IF EXISTS getAdminFrontendFeatures;
        `);
        await sequelize.query(`
            CREATE PROCEDURE getAdminFrontendFeatures(
                IN p_is_active VARCHAR(10)
            )
            BEGIN
                IF p_is_active = '' THEN
                    SELECT * FROM tbl_frontend_features ORDER BY sequence_no ASC;
                ELSE
                    SELECT * FROM tbl_frontend_features WHERE is_active = IF(p_is_active = 'true', 1, 0) ORDER BY sequence_no ASC;
                END IF;
            END;
        `);

        // Get Active User
        await sequelize.query(`
            DROP PROCEDURE IF EXISTS getUserFrontendFeatures;
        `);
        await sequelize.query(`
            CREATE PROCEDURE getUserFrontendFeatures()
            BEGIN
                SELECT icon, title, description, bgColor FROM tbl_frontend_features 
                WHERE is_active = 1 
                ORDER BY sequence_no ASC;
            END;
        `);

        // Update Procedure
        await sequelize.query(`
            DROP PROCEDURE IF EXISTS updateFrontendFeature;
        `);
        await sequelize.query(`
            CREATE PROCEDURE updateFrontendFeature(
                IN p_id INT,
                IN p_icon VARCHAR(255),
                IN p_title VARCHAR(255),
                IN p_description TEXT,
                IN p_bgColor VARCHAR(255),
                IN p_is_active TINYINT(1),
                IN p_updated_by INT
            )
            BEGIN
                UPDATE tbl_frontend_features 
                SET 
                    icon = IFNULL(p_icon, icon),
                    title = IFNULL(p_title, title),
                    description = IFNULL(p_description, description),
                    bgColor = IFNULL(p_bgColor, bgColor),
                    is_active = IFNULL(p_is_active, is_active),
                    updated_by = p_updated_by,
                    updated_at = NOW()
                WHERE id = p_id;
                
                SELECT * FROM tbl_frontend_features WHERE id = p_id;
            END;
        `);

        // Delete Procedure
        await sequelize.query(`
            DROP PROCEDURE IF EXISTS deleteFrontendFeature;
        `);
        await sequelize.query(`
            CREATE PROCEDURE deleteFrontendFeature(
                IN p_id INT
            )
            BEGIN
                DELETE FROM tbl_frontend_features WHERE id = p_id;
            END;
        `);

        // Toggle Active
        await sequelize.query(`
            DROP PROCEDURE IF EXISTS toggleFrontendFeatureActive;
        `);
        await sequelize.query(`
            CREATE PROCEDURE toggleFrontendFeatureActive(
                IN p_id INT,
                IN p_updated_by INT
            )
            BEGIN
                UPDATE tbl_frontend_features 
                SET is_active = NOT is_active, 
                    updated_by = p_updated_by,
                    updated_at = NOW() 
                WHERE id = p_id;
                
                SELECT * FROM tbl_frontend_features WHERE id = p_id;
            END;
        `);

        // Update Sequence
        await sequelize.query(`
            DROP PROCEDURE IF EXISTS updateFrontendFeatureSequence;
        `);
        await sequelize.query(`
            CREATE PROCEDURE updateFrontendFeatureSequence(
                IN p_id INT,
                IN p_sequence_no INT,
                IN p_updated_by INT
            )
            BEGIN
                UPDATE tbl_frontend_features 
                SET sequence_no = p_sequence_no, 
                    updated_by = p_updated_by,
                    updated_at = NOW() 
                WHERE id = p_id;
            END;
        `);

        console.log("✅ Frontend Features Procedures created successfully");
    } catch (error) {
        console.error("❌ Error setting up Frontend Features Procedures:", error);
    }
};

module.exports = setupFrontendFeaturesProcedures;
