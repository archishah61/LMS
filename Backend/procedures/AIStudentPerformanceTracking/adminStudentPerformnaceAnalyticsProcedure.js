const sequelize = require("../../config/db");

const setupadminStudentPerformanceAnalyticsProcedures = async () => {
    try {
        console.log("🔄 Setting up Admin Student Performance Analysis procedures...");

        // Procedure: Get all versions of student performance analytics
        await sequelize.query(`DROP PROCEDURE IF EXISTS getAllVersionsForStudentAnalytics`);
        await sequelize.query(`CREATE PROCEDURE getAllVersionsForStudentAnalytics (
            IN p_student_id INT
        )
        BEGIN
            SELECT
                pf.id,
                pf.version,
                pf.is_current,
                pf.created_at,
                pf.module_id,
                pf.course_id,
                c.title as course_title,
                m.title as module_title
            FROM
                tbl_performance_feedbacks pf
            LEFT JOIN
                tbl_courses c ON pf.course_id = c.id
            LEFT JOIN
                tbl_modules m ON pf.module_id = m.id
            WHERE
                pf.user_id = p_student_id
                AND pf.status = 'active'
            ORDER BY
                pf.version ASC;
        END`);

        // Procedure: Get feedback entries for student analytics with filtering options
        await sequelize.query(`DROP PROCEDURE IF EXISTS getFeedbackEntriesForStudentAnalytics`);
        await sequelize.query(`CREATE PROCEDURE getFeedbackEntriesForStudentAnalytics (
            IN p_student_id INT,
            IN p_course_id INT,
            IN p_module_id INT,
            IN p_version VARCHAR(10)
        )
        BEGIN
            -- Declare variables
            DECLARE use_specific_version BOOLEAN;
            DECLARE version_number INT;
            
            -- Determine if we should filter by version or is_current
            IF p_version = 'latest' OR p_version IS NULL THEN
                SET use_specific_version = FALSE;
            ELSE
                SET use_specific_version = TRUE;
                SET version_number = CAST(p_version AS UNSIGNED);
            END IF;
            
            -- Main query with conditional filters
            SELECT
                pf.id, 
                pf.user_id, 
                pf.course_id, 
                pf.module_id,
                pf.feedback_summary, 
                pf.feedback_data, 
                pf.version, 
                pf.created_at, 
                pf.is_current,
                c.id AS course_id,
                c.title AS course_title,
                m.id AS module_id,
                m.title AS module_title
            FROM
                tbl_performance_feedbacks pf
            LEFT JOIN
                tbl_courses c ON pf.course_id = c.id
            LEFT JOIN
                tbl_modules m ON pf.module_id = m.id
            WHERE
                pf.user_id = p_student_id
                AND pf.status = 'active'
                -- Apply course filter if provided
                AND (p_course_id IS NULL OR pf.course_id = p_course_id)
                -- Apply module filter if provided
                AND (p_module_id IS NULL OR pf.module_id = p_module_id)
                -- Apply version filter
                AND (
                    (use_specific_version = TRUE AND pf.version = version_number)
                    OR 
                    (use_specific_version = FALSE AND pf.is_current = TRUE)
                )
            ORDER BY
                pf.created_at DESC;
        END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getProgressTrackingbyModule`);
        await sequelize.query(`CREATE PROCEDURE getProgressTrackingbyModule (
            IN p_enrollment_id INT,
            IN p_module_ids JSON  -- JSON array of module IDs
        )
        BEGIN
            SELECT 
                pt.module_id,
                pt.completion_status,
                pt.time_spent,
                pt.student_time_spent,
                pt.last_accessed,
                pt.revision_count,
                pt.completed_at
            FROM 
                tbl_progress_tracking pt
            WHERE 
                pt.enrollment_id = p_enrollment_id
                AND pt.topic_id IS NULL  -- Module-level tracking only
                AND JSON_CONTAINS(p_module_ids, CAST(pt.module_id AS JSON))
            ORDER BY 
                pt.module_id;
        END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getProgressTrackingbyTopic`); 
        await sequelize.query(`
                CREATE PROCEDURE getProgressTrackingbyTopic (
                    IN p_enrollment_id INT,
                    IN p_module_ids JSON
                )
                BEGIN
                    SELECT 
                        pt.module_id,
                        pt.topic_id,
                        pt.completion_status,
                        pt.time_spent,
                        pt.student_time_spent,
                        pt.last_accessed,
                        pt.revision_count,
                        pt.completed_at
                    FROM 
                        tbl_progress_tracking pt
                    WHERE 
                        pt.enrollment_id = p_enrollment_id
                        AND pt.topic_id IS NOT NULL
                        AND JSON_CONTAINS(p_module_ids, CAST(pt.module_id AS JSON))
                    ORDER BY 
                        pt.module_id, pt.topic_id;
                END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getModulesByIds`);
        await sequelize.query(`
            CREATE PROCEDURE getModulesByIds (
                IN p_module_ids JSON
            )
            BEGIN
                SELECT 
                    m.id,
                    m.title,
                    m.course_id
                FROM 
                    tbl_modules m
                WHERE 
                    JSON_CONTAINS(p_module_ids, CAST(m.id AS JSON))
                ORDER BY 
                    m.id;
            END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getTopicsByIds`);
        await sequelize.query(`
            CREATE PROCEDURE getTopicsByIds (
                IN p_topic_ids JSON
            )
            BEGIN
                SELECT 
                    t.id,
                    t.title,
                    t.module_id
                FROM 
                    tbl_topics t
                WHERE 
                    JSON_CONTAINS(p_topic_ids, CAST(t.id AS JSON))
                ORDER BY 
                    t.module_id, t.id;
            END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getQuizCompletionsForModule`);
        await sequelize.query(`
            CREATE PROCEDURE getQuizCompletionsForModule (
                IN p_user_id INT,
                IN p_module_ids JSON
            )
            BEGIN
                SELECT 
                    qc.module_id,
                    qc.score,
                    qc.isCompleted
                FROM 
                    tbl_quiz_completion qc
                WHERE 
                    qc.userId = p_user_id
                    AND qc.topic_id IS NULL
                    AND JSON_CONTAINS(p_module_ids, CAST(qc.module_id AS JSON))
                ORDER BY 
                    qc.module_id, qc.created_at DESC;
            END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getPerformanceFeedbackForModules`);
        await sequelize.query(`
            CREATE PROCEDURE getPerformanceFeedbackForModules (
                IN p_user_id INT,
                IN p_course_id INT,
                IN p_module_ids JSON
            )
            BEGIN
                SELECT 
                    pf.module_id,
                    pf.feedback_data
                FROM 
                    tbl_performance_feedbacks pf
                WHERE 
                    pf.user_id = p_user_id
                    AND pf.course_id = p_course_id
                    AND JSON_CONTAINS(p_module_ids, CAST(pf.module_id AS JSON))
                    AND pf.is_current = true
                    AND pf.status = 'active'
                ORDER BY 
                    pf.module_id, pf.created_at DESC;
            END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getPerformanceFeedbackVersions`);
        await sequelize.query(`
            CREATE PROCEDURE getPerformanceFeedbackVersions (
                IN p_user_id INT,
                IN p_version1 INT,
                IN p_version2 INT,
                IN p_course_id INT,
                IN p_module_id INT
            )
            BEGIN
                SELECT 
                    pf.id,
                    pf.user_id,
                    pf.course_id,
                    pf.module_id,
                    pf.feedback_data,
                    pf.feedback_summary,
                    pf.version,
                    pf.is_current,
                    pf.status,
                    pf.created_at,
                    pf.updated_at,
                    c.id as course_id_ref,
                    c.title as course_title,
                    m.id as module_id_ref,
                    m.title as module_title
                FROM 
                    tbl_performance_feedbacks pf
                LEFT JOIN 
                    tbl_courses c ON pf.course_id = c.id
                LEFT JOIN 
                    tbl_modules m ON pf.module_id = m.id
                WHERE 
                    pf.user_id = p_user_id
                    AND pf.status = 'active'
                    AND pf.version IN (p_version1, p_version2)
                    AND (p_course_id IS NULL OR pf.course_id = p_course_id)
                    AND (p_module_id IS NULL OR pf.module_id = p_module_id)
                ORDER BY 
                    pf.module_id, pf.course_id, pf.version;
            END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getAllAvailableFeedbackVersionsForStudent`);
        await sequelize.query(`
            CREATE PROCEDURE getAllAvailableFeedbackVersionsForStudent (
                IN p_student_id INT,
                IN p_course_id INT,
                IN p_module_id INT
            )
            BEGIN
                SELECT
                    pf.id,
                    pf.version,
                    pf.is_current,
                    pf.created_at,
                    pf.module_id,
                    pf.course_id,
                    pf.user_id,
                    pf.feedback_data,
                    pf.feedback_summary,
                    pf.status,
                    pf.updated_at,
                    c.id AS course_id_ref,
                    c.title AS course_title,
                    m.id AS module_id_ref,
                    m.title AS module_title
                FROM
                    tbl_performance_feedbacks pf
                LEFT JOIN
                    tbl_courses c ON pf.course_id = c.id
                LEFT JOIN
                    tbl_modules m ON pf.module_id = m.id
                WHERE
                    pf.user_id = p_student_id
                    AND pf.status = 'active'
                    AND (p_course_id IS NULL OR pf.course_id = p_course_id)
                    AND (p_module_id IS NULL OR pf.module_id = p_module_id)
                ORDER BY
                    pf.version ASC;
            END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getCoursesForTimeSpentByIds`);
        await sequelize.query(`
            CREATE PROCEDURE getCoursesForTimeSpentByIds (
                IN p_course_ids JSON
            )
            BEGIN
                SELECT 
                    id,
                    title
                FROM 
                    tbl_courses
                WHERE 
                    JSON_CONTAINS(p_course_ids, CAST(id AS JSON));
            END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getModuleTrackingDataForTimeSpent`);
        await sequelize.query(`
            CREATE PROCEDURE getModuleTrackingDataForTimeSpent (
                IN p_enrollment_ids JSON,
                IN p_module_id INT
            )
            BEGIN
                SELECT 
                    pt.enrollment_id,
                    pt.module_id,
                    pt.student_time_spent,
                    pt.time_spent,
                    pt.completion_status,
                    pt.last_accessed,
                    pt.completed_at
                FROM 
                    tbl_progress_tracking pt
                WHERE 
                    pt.topic_id IS NULL
                    AND JSON_CONTAINS(p_enrollment_ids, CAST(pt.enrollment_id AS JSON))
                    AND (p_module_id IS NULL OR pt.module_id = p_module_id);
            END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getTopicTrackingDataForTimeSpent`);
        await sequelize.query(`
            CREATE PROCEDURE getTopicTrackingDataForTimeSpent (
                IN p_enrollment_ids JSON,
                IN p_module_id INT
            )
            BEGIN
                SELECT 
                    pt.enrollment_id,
                    pt.module_id,
                    pt.topic_id,
                    pt.student_time_spent,
                    pt.time_spent,
                    pt.completion_status,
                    pt.last_accessed,
                    pt.completed_at
                FROM 
                    tbl_progress_tracking pt
                WHERE 
                    pt.topic_id IS NOT NULL
                    AND JSON_CONTAINS(p_enrollment_ids, CAST(pt.enrollment_id AS JSON))
                    AND (p_module_id IS NULL OR pt.module_id = p_module_id);
            END
        `);


        console.log("✅ Admin Student Performance Analysis procedures created!");
    } catch (error) {
        console.error("❌ Error setting up procedures:", error);
        throw error;
    }
};

module.exports = setupadminStudentPerformanceAnalyticsProcedures;
