const sequelize = require("../../config/db");

const setupCourseGenerationHistoryProcedures = async () => {
    try {
        console.log("🔄 Setting up Course Generation History  procedures...");

        await sequelize.query(`DROP PROCEDURE IF EXISTS createCourseGenerationHistory`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createCourseGenerationHistory(
            IN p_user_id INT,
            IN p_title VARCHAR(255),
            IN p_structure JSON
        )
        BEGIN
            INSERT INTO tbl_course_generation_history (user_id, title, structure, is_generated, created_at, updated_at)
            VALUES (p_user_id, p_title, p_structure, FALSE, NOW(), NOW());

            SELECT id, user_id, title, is_generated, created_at, updated_at
            FROM tbl_course_generation_history
            WHERE id = LAST_INSERT_ID();
        END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getCourseHistoryByUserId`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCourseHistoryByUserId(
            IN p_user_id INT
        )
        BEGIN
            SELECT 
                cgh.id,
                cgh.user_id,
                cgh.title,
                cgh.is_generated,
                cgh.created_at,
                cgh.updated_at,

                CASE 
                    WHEN p.id IS NOT NULL 
                        AND p.status = 'completed'
                    THEN TRUE
                    ELSE FALSE
                END AS is_payment_done,

                p.status AS payment_status,
                cgp.generation_complete,
                cgp.generated_course_id,
                cgp.paid_at

            FROM tbl_course_generation_history cgh

            LEFT JOIN tbl_course_generation_payments cgp
                ON cgp.course_generation_history_id = cgh.id

            LEFT JOIN tbl_payments p
                ON p.id = cgp.payment_id

            WHERE cgh.user_id = p_user_id

            ORDER BY cgh.created_at DESC;
        END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getCourseHistoryById`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCourseHistoryById(
            IN p_id INT
        )
        BEGIN
            SELECT 
                cgh.*,

                CASE 
                    WHEN p.id IS NOT NULL 
                        AND p.status = 'completed'
                    THEN TRUE
                    ELSE FALSE
                END AS is_payment_done,

                cgp.id AS course_generation_payment_id,
                cgp.tier_id

            FROM tbl_course_generation_history cgh

            LEFT JOIN tbl_course_generation_payments cgp
                ON cgp.course_generation_history_id = cgh.id

            LEFT JOIN tbl_payments p
                ON p.id = cgp.payment_id

            WHERE cgh.id = p_id;
        END;`);

        console.log("✅ Course Generation History  procedures created!");
    } catch (error) {
        console.error("❌ Error setting up Course Generation History procedures:", error);
        throw error;
    }
};

module.exports = setupCourseGenerationHistoryProcedures;
