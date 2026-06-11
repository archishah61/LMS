// utils/procedures/studentPerformanceProcedures.js
const sequelize = require("../../config/db");

const setupStudentPerformanceAnalysisProcedures = async () => {
    try {
        console.log("🔄 Setting up Student Performance Analysis procedures...");

        // Drop existing procedure if exists
        await sequelize.query(`DROP PROCEDURE IF EXISTS getUserSkillLevel`);

        // Create the main skill level analysis procedure
        await sequelize.query(`
            CREATE PROCEDURE getUserSkillLevel(IN userId INT, IN courseId INT)
            BEGIN
                DECLARE EXIT HANDLER FOR SQLEXCEPTION
                BEGIN
                    ROLLBACK;
                    RESIGNAL;
                END;

                SELECT 
                    m.id AS module_id,
                    m.title AS module_title,
                    t.id AS topic_id,
                    t.title AS topic_title,
                    
                    -- Quiz performance metrics
                    COUNT(DISTINCT qr.id) AS total_questions,
                    SUM(CASE WHEN qr.isCorrect = TRUE THEN 1 ELSE 0 END) AS correct_answers,
                    
                    -- Progress tracking metrics
                    COALESCE(MAX(pt.revision_count), 0) AS total_revisions,
                    COALESCE(MAX(pt.time_spent), 0) AS time_spent_minutes,
                    
                    -- Quiz completion metrics
                    COUNT(DISTINCT qc.id) AS quiz_attempts,
                    SUM(qc.count) AS total_correct_from_completion,
                    SUM(qc.total_question) AS total_questions_from_completion,
                    
                    -- Calculated metrics
                    ROUND(
                        CASE 
                            WHEN COUNT(DISTINCT qr.id) > 0 THEN
                                SUM(CASE WHEN qr.isCorrect = TRUE THEN 1 ELSE 0 END) / COUNT(DISTINCT qr.id)
                            ELSE 0
                        END,
                        2
                    ) AS accuracy_rate,
                    
                    -- Skill level determination
                    CASE
                        WHEN ROUND(
                            CASE 
                                WHEN COUNT(DISTINCT qr.id) > 0 THEN
                                    SUM(CASE WHEN qr.isCorrect = TRUE THEN 1 ELSE 0 END) / COUNT(DISTINCT qr.id)
                                ELSE 0
                            END,
                            2
                        ) >= 0.8 AND COALESCE(MAX(pt.revision_count), 0) >= 3 THEN 'Advanced'
                        
                        WHEN ROUND(
                            CASE 
                                WHEN COUNT(DISTINCT qr.id) > 0 THEN
                                    SUM(CASE WHEN qr.isCorrect = TRUE THEN 1 ELSE 0 END) / COUNT(DISTINCT qr.id)
                                ELSE 0
                            END,
                            2
                        ) >= 0.6 OR COALESCE(MAX(pt.revision_count), 0) >= 2 THEN 'Intermediate'
                        
                        ELSE 'Beginner'
                    END AS skill_level,
                    
                    -- Additional metrics
                    MAX(qc.lastAttemptTime) AS last_quiz_attempt,
                    MAX(pt.last_accessed) AS last_topic_access,
                    
                    -- Completion status
                    CASE 
                        WHEN MAX(pt.completion_status) = 'completed' THEN 'Completed'
                        WHEN MAX(pt.completion_status) = 'in_progress' THEN 'In Progress'
                        ELSE 'Not Started'
                    END AS completion_status

                FROM tbl_quiz_completion qc
                
                -- Join with quiz responses to get individual question performance
                LEFT JOIN tbl_quiz_response qr ON qc.id = qr.quizCompletionId
                
                -- Join with quiz to get quiz details
                LEFT JOIN tbl_quiz q ON qc.quizId = q.id
                
                -- Join with modules (quiz can be associated with module directly)
                LEFT JOIN tbl_modules m ON qc.module_id = m.id
                
                -- Join with topics (quiz completion can have topic_id)
                LEFT JOIN tbl_topics t ON qc.topic_id = t.id
                
                -- Join with progress tracking for revision and time data
                LEFT JOIN tbl_progress_tracking pt ON (
                    pt.topic_id = t.id AND 
                    pt.enrollment_id = (
                        SELECT id 
                        FROM tbl_enrollments 
                        WHERE user_id = userId AND course_id = courseId 
                        LIMIT 1
                    )
                )
                
                WHERE qc.userId = userId
                AND m.course_id = courseId
                AND qc.isCompleted = TRUE  -- Only consider completed quizzes
                
                GROUP BY m.id, m.title, t.id, t.title
                
                HAVING total_questions > 0  -- Only include records with actual quiz data
                
                ORDER BY m.sequence_no ASC, t.sequence_no ASC;
            END
        `);

        // Create additional helper procedure for error pattern analysis
        await sequelize.query(`DROP PROCEDURE IF EXISTS getDetailedErrorPatterns`);

        await sequelize.query(`
            CREATE PROCEDURE getDetailedErrorPatterns(IN userId INT, IN courseId INT)
            BEGIN
                SELECT 
                    m.id AS module_id,
                    m.title AS module_title,
                    t.id AS topic_id,
                    t.title AS topic_title,
                    q.id AS quiz_id,
                    q.title AS quiz_title,
                    qr.questionId,
                    qr.answer,
                    qr.isCorrect,
                    qc.score,
                    qc.total_question,
                    qc.lastAttemptTime,
                    COUNT(CASE WHEN qr.isCorrect = FALSE THEN 1 END) OVER (
                        PARTITION BY m.id
                    ) AS module_error_count,
                    COUNT(CASE WHEN qr.isCorrect = FALSE THEN 1 END) OVER (
                        PARTITION BY t.id
                    ) AS topic_error_count
                    
                FROM tbl_quiz_completion qc
                JOIN tbl_quiz_response qr ON qc.id = qr.quizCompletionId
                JOIN tbl_quiz q ON qc.quizId = q.id
                JOIN tbl_modules m ON qc.module_id = m.id
                LEFT JOIN tbl_topics t ON qc.topic_id = t.id
                
                WHERE qc.userId = userId
                AND m.course_id = courseId
                AND qr.isCorrect = FALSE  -- Only incorrect answers
                
                ORDER BY m.sequence_no, t.sequence_no, qc.lastAttemptTime DESC;
            END
        `);

        // Create procedure for quiz performance summary
        await sequelize.query(`DROP PROCEDURE IF EXISTS getQuizPerformanceSummary`);

        await sequelize.query(`
            CREATE PROCEDURE getQuizPerformanceSummary(IN userId INT, IN courseId INT)
            BEGIN
                SELECT 
                    COUNT(DISTINCT qc.id) AS total_quiz_attempts,
                    COUNT(DISTINCT CASE WHEN qc.isCompleted = TRUE THEN qc.id END) AS completed_quizzes,
                    COUNT(DISTINCT qc.quizId) AS unique_quizzes_attempted,
                    
                    AVG(qc.score) AS average_score,
                    MAX(qc.score) AS highest_score,
                    MIN(qc.score) AS lowest_score,
                    
                    SUM(qc.total_question) AS total_questions_attempted,
                    SUM(qc.count) AS total_correct_answers,
                    
                    ROUND(
                        SUM(qc.count) / NULLIF(SUM(qc.total_question), 0),
                        3
                    ) AS overall_accuracy_rate,
                    
                    COUNT(DISTINCT m.id) AS modules_with_quiz_activity,
                    COUNT(DISTINCT t.id) AS topics_with_quiz_activity,
                    
                    MAX(qc.lastAttemptTime) AS last_quiz_activity,
                    MIN(qc.created_at) AS first_quiz_activity
                    
                FROM tbl_quiz_completion qc
                JOIN tbl_modules m ON qc.module_id = m.id
                LEFT JOIN tbl_topics t ON qc.topic_id = t.id
                
                WHERE qc.userId = userId
                AND m.course_id = courseId;
            END
        `);

        console.log("✅ Student Performance Analysis procedures created successfully!");

    } catch (error) {
        console.error("❌ Error setting up Student Performance Analysis procedures:", error);
        throw new Error(`Failed to set up Student Performance Analysis procedures: ${error.message}`);
    }
};

module.exports = {
    setupStudentPerformanceAnalysisProcedures
};