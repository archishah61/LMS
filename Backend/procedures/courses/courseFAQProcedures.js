// Setup Course FAQ Procedures
const sequelize = require("../../config/db");

const setupCourseFAQProcedures = async () => {
    try {


        // Procedure: CreateCourseFAQ ✅ (Tested)
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS createCourseFAQ(
        p_course_hash VARCHAR(255),
        IN p_question VARCHAR(255),
        IN p_created_by INT,
        IN p_created_by_type ENUM('admin', 'partner'),
        IN p_updated_by INT,
        IN p_updated_by_type ENUM('admin', 'partner')
    )
    BEGIN
        DECLARE courseId INT;

        -- Get the course ID using public_hash
        SELECT id INTO courseId FROM tbl_courses WHERE public_hash = p_course_hash;

        -- If no course found, return nothing
        IF courseId IS NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E404|NotFoundError|Course not found';
        ELSE
            -- Insert new FAQ
            INSERT INTO tbl_course_faqs (
                course_id,
                question,
                created_by,
                created_by_type,
                updated_by,
                updated_by_type,
                created_at,
                updated_at
            ) VALUES (
                courseId,
                p_question,
                p_created_by,
                p_created_by_type,
                p_updated_by,
                p_updated_by_type,
                NOW(),
                NOW()
            );

            -- Return inserted row
            SELECT * FROM tbl_course_faqs WHERE id = LAST_INSERT_ID();
        END IF;
    END
        `);

        // Procedure: GetAllCourseFAQs ✅ (Tested)
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS getAllCourseFAQs()
    BEGIN
        -- Select all FAQs with their associated course info
        SELECT
            f.id,
            f.course_id,
            f.question,
            f.created_by,
            f.created_by_type,
            f.updated_by,
            f.updated_by_type,
            f.created_at,
            f.updated_at,
            c.id AS course_id,
            c.public_hash,
            c.sequence,
            c.title AS course_title,
            c.description,
            c.category_id,
            c.thumbnail,
            c.preview_video,
            c.price,
            c.discount,
            c.duration_minutes,
            c.expiry_days,
            c.what_you_will_learn,
            c.prerequisites,
            c.hashtags,
            c.embedding,
            c.status,
            c.min_access_minutes,
            c.max_access_minutes,
            c.created_by AS course_created_by,
            c.created_by_type AS course_created_by_type,
            c.updated_by AS course_updated_by,
            c.updated_by_type AS course_updated_by_type,
            c.created_at AS course_createdAt,
            c.updated_at AS course_updatedAt
        FROM tbl_course_faqs f
        JOIN tbl_courses c ON f.course_id = c.id;
    END
        `);

        // Procedure: GetCourseFAQsByCourseId ✅ (Tested)
        await sequelize.query(`DROP PROCEDURE IF EXISTS getCourseFAQsByCourseId`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCourseFAQsByCourseId(
        IN p_course_hash VARCHAR(255),
        IN p_is_student BOOLEAN
    )
    BEGIN
        DECLARE courseId INT;

        -- Get the course ID using public_hash
        SELECT id INTO courseId FROM tbl_courses WHERE public_hash = p_course_hash;

        -- If no course found, return nothing
        IF courseId IS NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E404|NotFoundError|Course not found';
        ELSE
            -- Select all FAQs for the course with associated course info
            SELECT
                f.id,
                f.course_id,
                f.question,
                f.created_by,
                f.created_by_type,
                f.updated_by,
                f.updated_by_type,
                f.created_at,
                f.updated_at,
                f.is_active,
                c.id AS course_id,
                c.public_hash,
                c.sequence,
                c.title AS course_title,
                c.description,
                c.category_id,
                c.thumbnail,
                c.preview_video,
                c.price,
                c.discount,
                c.duration_minutes,
                c.expiry_days,
                c.what_you_will_learn,
                c.prerequisites,
                c.hashtags,
                c.embedding,
                c.status,
                c.min_access_minutes,
                c.max_access_minutes,
                c.created_by AS course_created_by,
                c.created_by_type AS course_created_by_type,
                c.updated_by AS course_updated_by,
                c.updated_by_type AS course_updated_by_type,
                c.created_at AS course_createdAt,
                c.updated_at AS course_updatedAt
            FROM tbl_course_faqs f
            JOIN tbl_courses c ON f.course_id = c.id
            WHERE (f.course_id = courseId)
            AND (
                p_is_student = FALSE 
            OR (p_is_student = TRUE AND f.is_active = TRUE));
        END IF;
    END`);


        // Procedure: UpdateCourseFAQ ✅ (Tested)
        await sequelize.query(`DROP PROCEDURE IF EXISTS updateCourseFAQ`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateCourseFAQ(
        IN p_id INT,
        IN p_question TEXT,
        IN p_is_active BOOLEAN,
        IN p_updated_by INT,
        IN p_updated_by_type ENUM('admin', 'partner')
    )
    BEGIN
        -- Validate FAQ existence
        DECLARE faq_exists INT DEFAULT 0;
        SELECT COUNT(*) INTO faq_exists
        FROM tbl_course_faqs
        WHERE id = p_id;
    
        IF faq_exists = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E404|NotFoundError|FAQ not found';
        ELSE
            -- Update the FAQ
            UPDATE tbl_course_faqs
            SET
                question = p_question,
                is_active = COALESCE(p_is_active, is_active),
                updated_by = p_updated_by,
                updated_by_type = p_updated_by_type,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = p_id;
    
            -- Return updated FAQ
            SELECT * FROM tbl_course_faqs WHERE id = p_id;
        END IF;
    END
        `);

        // Procedure: DeleteCourseFAQ ✅ (Tested)
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS deleteCourseFAQ(IN p_id INT)
    BEGIN
        -- Validate FAQ existence
        DECLARE faq_exists INT DEFAULT 0;
        SELECT COUNT(*) INTO faq_exists
        FROM tbl_course_faqs
        WHERE id = p_id;
    
        IF faq_exists = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E404|NotFoundError|FAQ not found';
        ELSE
            -- Return the FAQ before deletion
            SELECT * FROM tbl_course_faqs WHERE id = p_id;
    
            -- Delete the FAQ
            DELETE FROM tbl_course_faqs WHERE id = p_id;
        END IF;
    END
        `);


        console.log("✅ Course FAQ Procedures created successfully");
    } catch (error) {
        console.error("❌ Error setting up Course FAQ Procedures:", error);
    }
};

module.exports = setupCourseFAQProcedures;
