const sequelize = require("../../config/db");

const setupPerformanceFeedbackProcedures = async () => {
    try {
        console.log("🔄 Setting up Performance Feedback procedures...");

        // Procedure: get User Feedback
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getUserFeedback (
            IN p_user_id INT
        )
        BEGIN
            SELECT 
                pf.id, 
                pf.user_id, 
                pf.course_id, 
                pf.module_id, 
                pf.feedback_summary, 
                pf.version, 
                pf.created_at,
                c.title as course_title,
                m.title as module_title
            FROM 
                tbl_performance_feedbacks pf
            JOIN 
                tbl_courses c ON pf.course_id = c.id
            JOIN 
                tbl_modules m ON pf.module_id = m.id
            WHERE 
                pf.user_id = p_user_id
                AND pf.is_current = true
                AND pf.status = 'active'
            ORDER BY 
                pf.created_at DESC;
        END`);

        // Procedure: get Feedback By ID
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getFeedbackById (
            IN p_feedback_id INT
        )
        BEGIN
            SELECT 
                pf.*,
                c.title as course_title,
                m.title as module_title
            FROM 
                tbl_performance_feedbacks pf
            JOIN 
                tbl_courses c ON pf.course_id = c.id
            JOIN 
                tbl_modules m ON pf.module_id = m.id
            WHERE 
                pf.id = p_feedback_id
                AND pf.status = 'active';
        END`);

        // Procedure: get Module Feedback History
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getModuleFeedbackHistory (
            IN p_user_id INT,
            IN p_module_id INT
        )
        BEGIN
            SELECT 
                id, 
                version, 
                feedback_summary, 
                created_at,
                is_current
            FROM 
                tbl_performance_feedbacks
            WHERE 
                user_id = p_user_id
                AND module_id = p_module_id
                AND status = 'active'
            ORDER BY 
                version DESC;
        END`);

        // Procedure: Delete Feedback (Soft Delete)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS DeleteFeedback (
            IN p_feedback_id INT,
            IN p_user_id INT
        )
        BEGIN
            DECLARE v_user_id INT;
            
            -- Check if feedback exists and get user_id
            SELECT user_id INTO v_user_id
            FROM tbl_performance_feedbacks
            WHERE id = p_feedback_id;
            
            IF v_user_id IS NULL THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'E404|NotFound|Feedback not found';
            ELSEIF v_user_id != p_user_id THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'E403|Forbidden|Unauthorized to delete this feedback';
            ELSE
                -- Soft delete by updating status
                UPDATE tbl_performance_feedbacks
                SET 
                    status = 'inactive',
                    updated_by = p_user_id,
                    updated_at = NOW()
                WHERE 
                    id = p_feedback_id;
                    
                SELECT 'Feedback deleted successfully' as message;
            END IF;
        END`);

        console.log("✅ Performance Feedback procedures created!");
    } catch (error) {
        console.error("❌ Error setting up Performance Feedback procedures:", error);
        throw error;
    }
};

module.exports = setupPerformanceFeedbackProcedures;
