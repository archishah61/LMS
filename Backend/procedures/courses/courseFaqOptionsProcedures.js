// Setup Course FAQ Options Procedures
const sequelize = require("../../config/db");

const setupCourseFAQOptionsProcedures = async () => {
    try {


        // Procedure: CreateCourseFAQOption ✅ (Tested)
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS createCourseFAQOption(
        IN p_faq_id INT,
        IN p_option_text VARCHAR(255),
        IN p_created_by INT,
        IN p_created_by_type ENUM('admin', 'partner'),
        IN p_updated_by INT,
        IN p_updated_by_type ENUM('admin', 'partner')
    )
    BEGIN
        -- Validate FAQ existence
        DECLARE faq_exists INT DEFAULT 0;
        SELECT COUNT(*) INTO faq_exists
        FROM tbl_course_faqs
        WHERE id = p_faq_id;
    
        IF faq_exists = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E404|NotFoundError|FAQ question not found';
        ELSE
            -- Insert the option
            INSERT INTO tbl_course_faq_options (faq_id, option_text, created_by, created_by_type, updated_by, updated_by_type,
             created_at, updated_at)
            VALUES (p_faq_id, p_option_text, p_created_by, p_created_by_type, p_updated_by,
                p_updated_by_type, NOW(), NOW());
    
            -- Return the inserted row
            SELECT * FROM tbl_course_faq_options
            WHERE id = LAST_INSERT_ID();
        END IF;
    END
        `);

        // Procedure: GetAllCourseFAQOptions ✅ (Tested)
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS getAllCourseFAQOptions()
    BEGIN
        -- Select all FAQ options along with their parent FAQ question
        SELECT 
            o.id,
            o.faq_id,
            o.option_text,
            o.created_at,
            o.updated_at,
            f.question AS faq_question,
            f.course_id,
            f.created_by AS faq_created_by,
            f.created_by_type AS faq_created_by_type,
            f.updated_by AS faq_updated_by,
            f.updated_by_type AS faq_updated_by_type,
            f.created_at AS faq_createdAt,
            f.updated_at AS faq_updatedAt
        FROM tbl_course_faq_options o
        JOIN tbl_course_faqs f ON o.faq_id = f.id;
    END
        `);

        // Procedure: GetCourseFAQOptionsByFAQId ✅ (Tested)
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS getCourseFAQOptionsByFAQId(IN p_faq_id INT)
    BEGIN
        -- Validate FAQ existence
        DECLARE faq_exists INT DEFAULT 0;
        SELECT COUNT(*) INTO faq_exists
        FROM tbl_course_faqs
        WHERE id = p_faq_id;
    
        IF faq_exists = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E404|NotFoundError|FAQ question not found';
        ELSE
            -- Return all options for this FAQ
            SELECT 
                id,
                faq_id,
                option_text,
                created_by,
                created_by_type,
                updated_by,
                updated_by_type,
                created_at,
                updated_at
            FROM tbl_course_faq_options
            WHERE faq_id = p_faq_id;
        END IF;
    END
        `);

        // Procedure: GetFAQOptionsByFAQIds (❌ Unused)
        await sequelize.query(`
  CREATE PROCEDURE IF NOT EXISTS getFAQOptionsByFAQIds(
    IN faq_ids TEXT
)
BEGIN
    SET @query = CONCAT(
        'SELECT * FROM tbl_course_faq_options WHERE FIND_IN_SET(faq_id, "', faq_ids, '")'
    );

    PREPARE stmt FROM @query;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END

        `);

        // Procedure: UpdateCourseFAQOption ✅ (Tested)
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS updateCourseFAQOption(
        IN p_id INT,
        IN p_option_text VARCHAR(255),
        IN p_updated_by INT,
        IN p_updated_by_type ENUM('admin', 'partner')
    )
    BEGIN
        -- Validate FAQ option existence
        DECLARE option_exists INT DEFAULT 0;
        SELECT COUNT(*) INTO option_exists
        FROM tbl_course_faq_options
        WHERE id = p_id;
    
        IF option_exists = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E404|NotFoundError|FAQ option not found';
        ELSE
            -- Update the option text
            UPDATE tbl_course_faq_options
            SET option_text = p_option_text,
                updated_by = p_updated_by,
                updated_by_type = p_updated_by_type,
                updated_at = NOW()
            WHERE id = p_id;
    
            -- Return the updated option
            SELECT * FROM tbl_course_faq_options WHERE id = p_id;
        END IF;
    END
        `);

        // Procedure: DeleteCourseFAQOption ✅ (Tested)
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS deleteCourseFAQOption(
        IN p_id INT
    )
    BEGIN
        -- Validate FAQ option existence
        DECLARE option_exists INT DEFAULT 0;
        SELECT COUNT(*) INTO option_exists
        FROM tbl_course_faq_options
        WHERE id = p_id;
    
        IF option_exists = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E404|NotFoundError|FAQ option not found';
        ELSE
            -- Delete the option
            DELETE FROM tbl_course_faq_options
            WHERE id = p_id;
        END IF;
    END
        `);





        console.log("✅ Course FAQ Options Procedures created successfully");
    } catch (error) {
        console.error("❌ Error setting up Course FAQ Options Procedures:", error);
    }
};

module.exports = setupCourseFAQOptionsProcedures;
