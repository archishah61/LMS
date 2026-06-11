const sequelize = require("../../config/db");

const setupImportContentProcedures = async () => {
    try {

        await sequelize.query(`DROP PROCEDURE IF EXISTS sp_getAllCourses`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS sp_getAllCourses(
            IN p_search_term VARCHAR(255),
            IN p_roleId INT,
            IN p_role VARCHAR(50)
            )
        BEGIN
            IF p_role = 'admin' THEN
                SELECT id, title 
                FROM tbl_courses
                WHERE p_search_term IS NULL 
                        OR p_search_term = '' 
                        OR title LIKE CONCAT('%', p_search_term, '%');
            ELSE  
                SELECT c.id, c.title 
                FROM tbl_courses c        
                LEFT JOIN tbl_partners p ON p.id = p_roleId
                WHERE 
                    (p_search_term IS NULL OR p_search_term = '' 
                        OR c.title LIKE CONCAT('%', p_search_term, '%'))
                    AND ((c.created_by_type = 'partner' AND c.created_by = p_roleId)
                        OR (c.generated_by = p.user_id AND p.id = p_roleId));
            END IF;
        END`)

        await sequelize.query(`DROP PROCEDURE IF EXISTS getSessionsByCourseId`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getSessionsByCourseId(
    IN p_course_id INT,
    IN p_search_term VARCHAR(255)
)
BEGIN
    DECLARE session_count INT;

    -- Check if sessions exist
    SELECT COUNT(*) INTO session_count
    FROM tbl_session
    WHERE course_id = p_course_id;

    IF session_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|No sessions found for this course.',
        MYSQL_ERRNO = 4004;
    END IF;

    -- Return sessions
    SELECT 
        id,
        title,
        status
    FROM tbl_session
    WHERE course_id = p_course_id
    AND (p_search_term IS NULL 
        OR p_search_term = '' 
        OR title LIKE CONCAT('%', p_search_term, '%'));
END;`)

        await sequelize.query(`DROP PROCEDURE IF EXISTS importModulesBySessionId`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS importModulesBySessionId(
    IN p_session_id INT,
    IN p_search_term VARCHAR(255)
)
BEGIN
    -- Validate session ID
    IF p_session_id IS NULL OR p_session_id = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E400|BadRequest|Session ID is required.',
        MYSQL_ERRNO = 4000;
    END IF;

    -- Check if modules exist
    IF (SELECT COUNT(*) FROM tbl_modules WHERE session_id = p_session_id) = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|No modules found for this session.',
        MYSQL_ERRNO = 4004;
    END IF;

    -- Return modules list
    SELECT id, title
    FROM tbl_modules
    WHERE session_id = p_session_id
        AND (p_search_term IS NULL 
        OR p_search_term = '' 
        OR title LIKE CONCAT('%', p_search_term, '%'));
END;`)

        await sequelize.query(`DROP PROCEDURE IF EXISTS importTopicsByModuleId`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS importTopicsByModuleId(
    IN p_module_id INT,
    IN p_search_term VARCHAR(255)
)
BEGIN
    -- Validate module ID
    IF p_module_id IS NULL OR p_module_id = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E400|BadRequest|Module ID is required.',
        MYSQL_ERRNO = 4000;
    END IF;

    -- Check if topics exist
    IF (SELECT COUNT(*) FROM tbl_topics WHERE module_id = p_module_id) = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|No topics found for this module.',
        MYSQL_ERRNO = 4004;
    END IF;

    -- Return topics list
    SELECT id, title
    FROM tbl_topics
    WHERE module_id = p_module_id
        AND (p_search_term IS NULL 
        OR p_search_term = '' 
        OR title LIKE CONCAT('%', p_search_term, '%'));
END;`)


    } catch (error) {
        console.error("❌ Error setting up enrollment procedures:", error);
        throw error;
    }
}

module.exports = setupImportContentProcedures