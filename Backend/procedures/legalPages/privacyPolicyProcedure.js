const sequelize = require("../../config/db");

const setupPrivacyPolicyProcedures = async () => {
    try {
        console.log("🔄 Setting up Privacy Policy procedures...");
        await sequelize.query(`
            CREATE PROCEDURE IF NOT EXISTS createPrivacyPolicy(
            IN p_sentences JSON,
            IN p_category VARCHAR(255),
            IN p_createdBy INT,
            IN p_updatedBy INT
        )
        BEGIN
            INSERT INTO tbl_privacy_policy (
                sentences, category, createdBy, updatedBy, createdAt, updatedAt
            ) VALUES (
                p_sentences, p_category, p_createdBy, p_updatedBy, NOW(), NOW()
            );

            SELECT * FROM tbl_privacy_policy WHERE id = LAST_INSERT_ID();
        END `);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updatePrivacyPolicy(
            IN p_id INT,
            IN p_sentences JSON,
            IN p_updatedBy INT
        )
        BEGIN
            UPDATE tbl_privacy_policy
            SET
                sentences = IFNULL(p_sentences, sentences),
                updatedBy = p_updatedBy,
                updated_at = NOW()
            WHERE id = p_id;

            SELECT * FROM tbl_privacy_policy WHERE id = p_id;
        END `);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllPrivacyPolicies()
        BEGIN
            SELECT * FROM tbl_privacy_policy
            ORDER BY created_at DESC;
        END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getPrivacyPolicyByCategory(
            IN p_category VARCHAR(50)
        )
        BEGIN
            SELECT * FROM tbl_privacy_policy
            WHERE category = p_category
            ORDER BY created_at DESC;
        END `);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS togglePrivacyPolicyStatus(
            IN p_id INT,
            IN p_updatedBy INT
        )
        BEGIN
            DECLARE current_status VARCHAR(20);
            DECLARE new_status VARCHAR(20);

            -- Get current status
            SELECT status INTO current_status FROM tbl_privacy_policy WHERE id = p_id;

            -- Toggle status
            IF current_status = 'active' THEN
                SET new_status = 'inactive';
            ELSE
                SET new_status = 'active';
            END IF;

            -- Update status and updatedBy
            UPDATE tbl_privacy_policy
            SET
                status = new_status,
                updatedBy = IFNULL(p_updatedBy, updatedBy),
                updated_at = NOW()
            WHERE id = p_id;

            -- Return updated record
            SELECT * FROM tbl_privacy_policy WHERE id = p_id;
        END`);

        console.log("✅ Privacy Policy procedures created!");
    } catch (error) {
        console.error("❌ Error setting up Privacy Policy procedures:", error);
        throw error;
    }
};

module.exports = setupPrivacyPolicyProcedures;