const sequelize = require("../../config/db");

const setupEnrolledStudentsProcedures = async () => {
    try {
        console.log("🔄 Setting up Enrolled Students procedures...");

        // Procedure: get Enrolled Students
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getEnrolledStudents (
            IN p_course_id INT,
            IN p_status VARCHAR(20),
            IN p_role VARCHAR(20),
            IN p_user_id INT,
            IN p_creator_type VARCHAR(20)
        )
        BEGIN
            -- This procedure returns enrolled students with course information
            -- Apply different conditions based on parameters
            SELECT 
                e.id as enrollment_id,
                e.user_id,
                e.course_id,
                e.enrollment_date,
                e.status,
                e.completion_percentage,
                u.id as user_id,
                u.full_name,
                u.email,
                u.profile_image,
                u.username,
                c.id as course_id,
                c.title as course_title,
                c.description as course_description,
                c.thumbnail as course_thumbnail,
                c.created_by as course_created_by,
                c.created_by_type as course_created_by_type
            FROM 
                tbl_enrollments e
            JOIN 
                tbl_users u ON e.user_id = u.id
            JOIN 
                tbl_courses c ON e.course_id = c.id
            WHERE
                -- Apply course filter if provided
                (p_course_id IS NULL OR e.course_id = p_course_id)
                -- Apply status filter with default to 'active'
                AND (p_status IS NOT NULL AND e.status = p_status)
                -- Apply creator type filter
                AND (
                    (p_creator_type IS NULL) OR
                    (p_creator_type = 'admin' AND c.created_by_type = 'admin') OR
                    (p_creator_type = 'partner' AND c.created_by_type = 'partner') OR
                    (p_role = 'partner' AND p_user_id IS NOT NULL AND c.created_by = p_user_id AND c.created_by_type = 'partner')
                )
            ORDER BY 
                e.enrollment_date DESC;
        END`);
        
        // Procedure: get Student Enrollments
        await sequelize.query(`DROP PROCEDURE IF EXISTS getStudentEnrollments`);
        await sequelize.query(`CREATE PROCEDURE getStudentEnrollments (
            IN p_student_id INT,
            IN p_role VARCHAR(20),
            IN p_user_id INT,
            IN p_creator_type VARCHAR(20)
        )
        BEGIN
            DECLARE student_exists INT;
            
            -- Check if student exists
            SELECT COUNT(*) INTO student_exists
            FROM tbl_users
            WHERE id = p_student_id;
            
            IF student_exists = 0 THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'E404|NotFound|Student not found';
            ELSE
                -- Return enrollments for the student with course details and student info
                SELECT 
                    e.id as enrollment_id,
                    e.course_id,
                    c.title as course_title,
                    c.description as course_description,
                    c.thumbnail as course_thumbnail,
                    e.enrollment_date,
                    e.status,
                    e.completion_percentage,
                    u.id,
                    u.full_name,
                    u.email
                FROM 
                    tbl_enrollments e
                JOIN 
                    tbl_courses c ON e.course_id = c.id
                JOIN
                    tbl_users u ON e.user_id = u.id
                WHERE 
                    e.user_id = p_student_id
                    AND e.status = 'active'
                    AND (
                        (p_creator_type IS NULL) OR
                        (p_creator_type = 'admin' AND c.created_by_type = 'admin') OR
                        (p_creator_type = 'partner' AND c.created_by_type = 'partner') OR
                        (p_role = 'partner' AND p_user_id IS NOT NULL AND c.created_by = p_user_id AND c.created_by_type = 'partner')
                    )
                ORDER BY 
                    e.enrollment_date DESC;
            END IF;
        END`);
        
        // Procedure: get Modules By Course
        await sequelize.query(`DROP PROCEDURE IF EXISTS getModulesByCourse`);
        await sequelize.query(`CREATE PROCEDURE getModulesByCourse (
            IN p_course_id INT
        )
        BEGIN
            DECLARE course_exists INT;
            DECLARE course_title VARCHAR(255);
            
            -- Check if course exists and get title
            SELECT COUNT(*), MAX(title) INTO course_exists, course_title
            FROM tbl_courses
            WHERE id = p_course_id;
            
            IF course_exists = 0 THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'E404|NotFound|Course not found';
            ELSE
                -- get modules with course info included
                SELECT 
                    m.id,
                    m.title,
                    m.sequence_no,
                    m.duration_minutes,
                    p_course_id as course_id,
                    course_title as course_title
                FROM 
                    tbl_modules m
                WHERE 
                    m.course_id = p_course_id
                    AND m.status = 'active'
                ORDER BY 
                    m.sequence_no ASC;
            END IF;
        END`);
        
        // Procedure: get Topics By Module
        await sequelize.query(`DROP PROCEDURE IF EXISTS getTopicsByModule`);
        await sequelize.query(`CREATE PROCEDURE getTopicsByModule (
            IN p_module_id INT
        )
        BEGIN
            DECLARE module_exists INT;
            DECLARE module_course_id INT;
            DECLARE module_title VARCHAR(255);
            
            -- Check if module exists
            SELECT 
                COUNT(*), 
                MAX(course_id), 
                MAX(title) 
            INTO 
                module_exists, 
                module_course_id, 
                module_title
            FROM 
                tbl_modules
            WHERE 
                id = p_module_id;
            
            IF module_exists = 0 THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'E404|NotFound|Module not found';
            ELSE
                -- get topics with module info included
                SELECT 
                    t.id,
                    t.title,
                    t.sequence_no,
                    t.description,
                    p_module_id as module_id,
                    module_title as module_title,
                    module_course_id as course_id
                FROM 
                    tbl_topics t
                WHERE 
                    t.module_id = p_module_id
                    AND t.status = 'active'
                ORDER BY 
                    t.sequence_no ASC;
            END IF;
        END`);

        console.log("✅ Enrolled Students procedures created!");
    } catch (error) {
        console.error("❌ Error setting up Enrolled Students procedures:", error);
        throw error;
    }
}

module.exports = setupEnrolledStudentsProcedures;