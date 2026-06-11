const sequelize = require("../../../config/db");

const setupContestCodingProcedures = async () => {
    try {
        console.log("🔄 Setting up contest coding procedures...");

        // Create
        await sequelize.query(`DROP PROCEDURE IF EXISTS CreateContestCoding`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS CreateContestCoding(
    IN p_activity_id BIGINT,
    IN p_title VARCHAR(255),
    IN p_points_reward INT,
    IN p_max_attempts INT,
    IN p_is_warning BOOLEAN,
    IN p_no_of_warning INT,
    IN p_problem_statement TEXT,
    IN p_constraints TEXT,
    IN p_sample_inputs_outputs JSON,
    IN p_time_limit_seconds INT,
    IN p_memory_limit_mb INT,
    IN p_difficulty_level ENUM('easy','medium','hard'),
    IN p_allowed_languages JSON,
    IN p_starter_code JSON,
    IN p_created_by BIGINT
)
BEGIN
    INSERT INTO tbl_contest_coding (
        activity_id, title, points_reward, max_attempts, is_warning, no_of_warning, problem_statement, constraints, sample_inputs_outputs,
        time_limit_seconds, memory_limit_mb, difficulty_level, allowed_languages,
        starter_code, created_by, updated_by, createdAt, updatedAt
    ) VALUES (
        p_activity_id, p_title, p_points_reward, p_max_attempts, p_is_warning, p_no_of_warning, p_problem_statement, p_constraints, p_sample_inputs_outputs,
        p_time_limit_seconds, p_memory_limit_mb, p_difficulty_level, p_allowed_languages,
        p_starter_code, p_created_by, p_created_by, NOW(), NOW()
    );
    SELECT * FROM tbl_contest_coding WHERE id = LAST_INSERT_ID();
END;`);

        // Update
        await sequelize.query(`DROP PROCEDURE IF EXISTS UpdateContestCoding`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateContestCoding(
    IN p_id BIGINT,
    IN p_title VARCHAR(255),
    IN p_points_reward INT,
    IN p_max_attempts INT,
    IN p_is_warning BOOLEAN,
    IN p_no_of_warning INT,
    IN p_problem_statement TEXT,
    IN p_constraints TEXT,
    IN p_sample_inputs_outputs JSON,
    IN p_time_limit_seconds INT,
    IN p_memory_limit_mb INT,
    IN p_difficulty_level ENUM('easy','medium','hard'),
    IN p_allowed_languages JSON,
    IN p_starter_code JSON,
    IN p_updated_by BIGINT
)
BEGIN
    UPDATE tbl_contest_coding SET
        title = COALESCE(p_title, title),
        points_reward = COALESCE(p_points_reward, points_reward),
        max_attempts = COALESCE(p_max_attempts, max_attempts),
        is_warning = COALESCE(p_is_warning, is_warning),
        no_of_warning = COALESCE(p_no_of_warning, no_of_warning),
        problem_statement = COALESCE(p_problem_statement, problem_statement),
        constraints = COALESCE(p_constraints, constraints),
        sample_inputs_outputs = COALESCE(p_sample_inputs_outputs, sample_inputs_outputs),
        time_limit_seconds = COALESCE(p_time_limit_seconds, time_limit_seconds),
        memory_limit_mb = COALESCE(p_memory_limit_mb, memory_limit_mb),
        difficulty_level = COALESCE(p_difficulty_level, difficulty_level),
        allowed_languages = COALESCE(p_allowed_languages, allowed_languages),
        starter_code = COALESCE(p_starter_code, starter_code),
        updated_by = p_updated_by,
        updatedAt = NOW()
    WHERE id = p_id;

    SELECT * FROM tbl_contest_coding WHERE id = p_id;
END;`);

        // Toggle
        await sequelize.query(`
CREATE PROCEDURE IF NOT EXISTS ToggleContestCodingStatus(IN p_id BIGINT)
BEGIN
    UPDATE tbl_contest_coding
    SET is_active = NOT is_active, updatedAt = NOW()
    WHERE id = p_id;
    SELECT * FROM tbl_contest_coding WHERE id = p_id;
END;
    `);

        // Delete
        await sequelize.query(`
CREATE PROCEDURE IF NOT EXISTS DeleteContestCoding(IN p_id BIGINT)
BEGIN
    DELETE FROM tbl_contest_coding WHERE id = p_id;
END;
    `);

        // Get By Activity
        await sequelize.query(`
CREATE PROCEDURE IF NOT EXISTS GetContestCodingByActivity(IN p_activity_id BIGINT)
BEGIN
    SELECT * FROM tbl_contest_coding WHERE activity_id = p_activity_id;
END;
    `);

        await sequelize.query(`
            CREATE PROCEDURE IF NOT EXISTS GetContestCodingById(IN p_id BIGINT)
            BEGIN
                SELECT * FROM tbl_contest_coding WHERE id = p_id;
            END;
        `);

        console.log("✅ Contest coding procedures created!");
    } catch (error) {
        console.error("❌ Error setting contest coding procedures:", error);
        throw error;
    }
};

module.exports = setupContestCodingProcedures;
