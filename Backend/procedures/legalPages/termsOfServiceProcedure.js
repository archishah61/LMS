const sequelize = require("../../config/db");

const setupTermsOfServiceProcedures = async () => {
    try {
        console.log("🔄 Setting up Terms Of Service procedures...");
        await sequelize.query(`
            CREATE PROCEDURE IF NOT EXISTS createTermsOfService(
                IN p_sentences JSON,
                IN p_category VARCHAR(50),
                IN p_createdBy INT,
                IN p_updatedBy INT
            )
            BEGIN
                INSERT INTO tbl_terms_of_service (
                    sentences, category, status, createdBy, updatedBy, created_at, updated_at
                ) VALUES (
                    p_sentences, p_category, 'active', p_createdBy, p_updatedBy, NOW(), NOW()
                );

                SELECT * FROM tbl_terms_of_service WHERE id = LAST_INSERT_ID();
            END
        `);

        await sequelize.query(`
            CREATE PROCEDURE IF NOT EXISTS updateTermsOfService(
                IN p_id INT,
                IN p_sentences JSON,
                IN p_status VARCHAR(20),
                IN p_updatedBy INT
            )
            BEGIN
                UPDATE tbl_terms_of_service
                SET
                    sentences = IFNULL(p_sentences, sentences),
                    status = IFNULL(p_status, status),
                    updatedBy = p_updatedBy,
                    updated_at = NOW()
                WHERE id = p_id;

                SELECT * FROM tbl_terms_of_service WHERE id = p_id;
            END
        `);

        await sequelize.query(`
            CREATE PROCEDURE IF NOT EXISTS getAllTermsOfService()
            BEGIN
                SELECT * FROM tbl_terms_of_service ORDER BY created_at DESC;
            END
        `);

        await sequelize.query(`
            CREATE PROCEDURE IF NOT EXISTS getTermsOfServiceByCategory(
                IN p_category VARCHAR(50)
            )
            BEGIN
                SELECT * FROM tbl_terms_of_service
                WHERE category = p_category
                ORDER BY created_at DESC;
            END
        `);

        await sequelize.query(`
            CREATE PROCEDURE IF NOT EXISTS toggleTermsOfServiceStatus(
                IN p_id INT,
                IN p_updatedBy INT
            )
            BEGIN
                DECLARE current_status VARCHAR(20);
                DECLARE new_status VARCHAR(20);

                SELECT status INTO current_status FROM tbl_terms_of_service WHERE id = p_id;

                IF current_status = 'active' THEN
                    SET new_status = 'inactive';
                ELSE
                    SET new_status = 'active';
                END IF;

                UPDATE tbl_terms_of_service
                SET
                    status = new_status,
                    updatedBy = p_updatedBy,
                    updated_at = NOW()
                WHERE id = p_id;

                SELECT * FROM tbl_terms_of_service WHERE id = p_id;
            END
        `);

        console.log("✅ Terms Of Service procedures created!");
    } catch (error) {
        console.error("❌ Error setting up Terms Of Service procedures:", error);
        throw error;
    }
};

module.exports = setupTermsOfServiceProcedures;