const sequelize = require("../../../config/db");

const setupContestCodingTestCaseProcedures = async () => {
  try {
    console.log("🔄 Setting up contest coding test case procedures...");

    // Create
    await sequelize.query(`
CREATE PROCEDURE IF NOT EXISTS CreateContestCodingTestCase(
    IN p_coding_id BIGINT,
    IN p_input TEXT,
    IN p_expected_output TEXT,
    IN p_is_public BOOLEAN,
    IN p_order INT,
    IN p_created_by BIGINT
)
BEGIN
    INSERT INTO tbl_contest_coding_testcases (
        coding_id, input, expected_output, is_public, \`order\`,
        created_by, updated_by, createdAt, updatedAt
    ) VALUES (
        p_coding_id, p_input, p_expected_output, p_is_public, p_order,
        p_created_by, p_created_by, NOW(), NOW()
    );
    SELECT * FROM tbl_contest_coding_testcases WHERE id = LAST_INSERT_ID();
END;
    `);

    // Update
    await sequelize.query(`
CREATE PROCEDURE IF NOT EXISTS UpdateContestCodingTestCase(
    IN p_id BIGINT,
    IN p_input TEXT,
    IN p_expected_output TEXT,
    IN p_is_public BOOLEAN,
    IN p_order INT,
    IN p_updated_by BIGINT
)
BEGIN
    UPDATE tbl_contest_coding_testcases SET
        input = COALESCE(p_input, input),
        expected_output = COALESCE(p_expected_output, expected_output),
        is_public = COALESCE(p_is_public, is_public),
        \`order\` = COALESCE(p_order, \`order\`),
        updated_by = p_updated_by,
        updatedAt = NOW()
    WHERE id = p_id;

    SELECT * FROM tbl_contest_coding_testcases WHERE id = p_id;
END;
    `);

    // Toggle
    await sequelize.query(`
CREATE PROCEDURE IF NOT EXISTS ToggleContestCodingTestCaseStatus(IN p_id BIGINT)
BEGIN
    UPDATE tbl_contest_coding_testcases
    SET is_active = NOT is_active, updatedAt = NOW()
    WHERE id = p_id;
    SELECT * FROM tbl_contest_coding_testcases WHERE id = p_id;
END;
    `);

    // Delete
    await sequelize.query(`
CREATE PROCEDURE IF NOT EXISTS DeleteContestCodingTestCase(IN p_id BIGINT)
BEGIN
    DELETE FROM tbl_contest_coding_testcases WHERE id = p_id;
END;
    `);

    // Get By Coding Id
    await sequelize.query(`
CREATE PROCEDURE IF NOT EXISTS GetContestCodingTestCases(IN p_coding_id BIGINT)
BEGIN
    SELECT * FROM tbl_contest_coding_testcases WHERE coding_id = p_coding_id;
END;
    `);

    console.log("✅ Contest coding test case procedures created!");
  } catch (error) {
    console.error("❌ Error setting contest coding test case procedures:", error);
    throw error;
  }
};

module.exports = setupContestCodingTestCaseProcedures;
