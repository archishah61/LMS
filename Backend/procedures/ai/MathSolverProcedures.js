const sequelize = require("../../config/db");

const setupMathSolverProcedures = async () => {
    try {
        console.log("🔄 Setting up Math Solver procedures...");

        await sequelize.query(`DROP PROCEDURE IF EXISTS createMathSolverLog;`);
        await sequelize.query(`CREATE PROCEDURE createMathSolverLog (
            IN p_user_id INT,
            IN p_input_type VARCHAR(20),
            IN p_image_url TEXT,
            IN p_dict_of_vars JSON,
            IN p_language VARCHAR(50),
            IN p_custom_prompt TEXT,
            IN p_solution JSON
        )
        BEGIN
            INSERT INTO tbl_math_solver_logs (
                user_id,
                input_type,
                image_url,
                dict_of_vars,
                language,
                custom_prompt,
                solution,
                created_at,
                updated_at
            ) VALUES (
                p_user_id,
                p_input_type,
                p_image_url,
                p_dict_of_vars,
                p_language,
                p_custom_prompt,
                p_solution,
                NOW(),
                NOW()
            );
            
            -- Return the ID of the newly created log
            SELECT LAST_INSERT_ID() AS log_id;
        END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getUserMathSolverHistory;`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getUserMathSolverHistory (IN p_user_id INT)
        BEGIN
            SELECT * FROM tbl_math_solver_logs WHERE user_id = p_user_id ORDER BY created_at DESC;
        END`);

        console.log("✅ Math Solver procedures created!");
    } catch (error) {
        console.error("❌ Error setting up Math Solver procedures:", error);
        throw error;
    }
};

module.exports = setupMathSolverProcedures;
