const sequelize = require("../../config/db");

const setupFrontendFaqProcedures = async () => {
    try {
        await sequelize.query(`DROP PROCEDURE IF EXISTS createFrontendFaq`);
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS createFrontendFaq(
        IN p_question TEXT,
        IN p_answer TEXT,
        IN p_is_active BOOLEAN,
        IN p_created_by INT,
        IN p_updated_by INT
    )
    BEGIN
        DECLARE faq_exists INT DEFAULT 0;
        DECLARE next_sequence INT DEFAULT 1;

        SELECT COUNT(*) INTO faq_exists FROM tbl_frontend_faqs WHERE question = p_question;
        
        IF faq_exists > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E409|ConflictError|FAQ already exists';
        ELSE
            SELECT COALESCE(MAX(sequence_no), 0) + 1 INTO next_sequence FROM tbl_frontend_faqs;

            INSERT INTO tbl_frontend_faqs (
                question, answer, is_active, sequence_no,
                created_by, updated_by, created_at, updated_at
            ) VALUES (
                p_question, p_answer, COALESCE(p_is_active, TRUE), next_sequence,
                p_created_by, p_updated_by, NOW(), NOW()
            );
            SELECT * FROM tbl_frontend_faqs WHERE id = LAST_INSERT_ID();
        END IF;
    END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getAdminFrontendFaqs`);
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS getAdminFrontendFaqs(
        IN p_is_active VARCHAR(10)
    )
    BEGIN
        IF p_is_active = 'true' THEN
            SELECT * FROM tbl_frontend_faqs WHERE is_active = TRUE ORDER BY sequence_no ASC;
        ELSEIF p_is_active = 'false' THEN
            SELECT * FROM tbl_frontend_faqs WHERE is_active = FALSE ORDER BY sequence_no ASC;
        ELSE
            SELECT * FROM tbl_frontend_faqs ORDER BY sequence_no ASC;
        END IF;
    END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getUserFrontendFaqs`);
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS getUserFrontendFaqs()
    BEGIN
        SELECT id, question, answer, sequence_no 
        FROM tbl_frontend_faqs 
        WHERE is_active = TRUE 
        ORDER BY sequence_no ASC;
    END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS updateFrontendFaq`);
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS updateFrontendFaq(
        IN p_id INT,
        IN p_question TEXT,
        IN p_answer TEXT,
        IN p_is_active BOOLEAN,
        IN p_updated_by INT
    )
    BEGIN
        DECLARE faq_exists INT DEFAULT 0;
        SELECT COUNT(*) INTO faq_exists FROM tbl_frontend_faqs WHERE id = p_id;
        
        IF faq_exists = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|FAQ not found';
        ELSE
            UPDATE tbl_frontend_faqs
            SET 
                question = p_question,
                answer = p_answer,
                is_active = COALESCE(p_is_active, is_active),
                updated_by = p_updated_by,
                updated_at = NOW()
            WHERE id = p_id;
            
            SELECT * FROM tbl_frontend_faqs WHERE id = p_id;
        END IF;
    END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS deleteFrontendFaq`);
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS deleteFrontendFaq(IN p_id INT)
    BEGIN
        DECLARE faq_exists INT DEFAULT 0;
        SELECT COUNT(*) INTO faq_exists FROM tbl_frontend_faqs WHERE id = p_id;
        
        IF faq_exists = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|FAQ not found';
        ELSE
            SELECT * FROM tbl_frontend_faqs WHERE id = p_id;
            DELETE FROM tbl_frontend_faqs WHERE id = p_id;
        END IF;
    END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS toggleFrontendFaqActive`);
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS toggleFrontendFaqActive(
        IN p_id INT,
        IN p_updated_by INT
    )
    BEGIN
        DECLARE faq_exists INT DEFAULT 0;
        SELECT COUNT(*) INTO faq_exists FROM tbl_frontend_faqs WHERE id = p_id;
        
        IF faq_exists = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|FAQ not found';
        ELSE
            UPDATE tbl_frontend_faqs
            SET is_active = NOT is_active,
                updated_by = p_updated_by,
                updated_at = NOW()
            WHERE id = p_id;
            
            SELECT * FROM tbl_frontend_faqs WHERE id = p_id;
        END IF;
    END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS updateFrontendFaqSequence`);
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS updateFrontendFaqSequence(
        IN p_id INT,
        IN p_sequence_no INT,
        IN p_updated_by INT
    )
    BEGIN
        UPDATE tbl_frontend_faqs
        SET sequence_no = p_sequence_no,
            updated_by = p_updated_by,
            updated_at = NOW()
        WHERE id = p_id;
    END
        `);

        console.log("✅ Frontend FAQ Procedures created successfully");
    } catch (error) {
        console.error("❌ Error setting up Frontend FAQ Procedures:", error);
    }
};

module.exports = setupFrontendFaqProcedures;
