const sequelize = require("../../../config/db");

const setupInterviewSettingsProcedures = async () => {
  try {
    console.log("🔄 Setting up Interview Settings procedures...");

    // Procedure: getInterviewSettings
    await sequelize.query(`DROP PROCEDURE IF EXISTS getFeatureSettings`)
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS getFeatureSettings(IN p_type VARCHAR(50))
      BEGIN
        IF p_type IS NULL THEN
          SELECT * FROM tbl_feature_settings;
        ELSE 
          SELECT * FROM tbl_feature_settings WHERE is_active = 1 AND type = p_type LIMIT 1;
        END IF;
      END
    `);

    // Procedure: updateFeatureSettings
    await sequelize.query(`DROP PROCEDURE IF EXISTS updateFeatureSettings`)
    await sequelize.query(`CREATE PROCEDURE updateFeatureSettings(
  IN p_type VARCHAR(50),
  IN p_limit INT,
  IN p_updated_by INT,
  IN p_updated_by_type VARCHAR(20)
)
BEGIN
  DECLARE v_exists INT;

  -- Check if row exists for given type
  SELECT COUNT(*) INTO v_exists 
  FROM tbl_feature_settings 
  WHERE type = p_type;

  IF v_exists > 0 THEN
    -- Update specific type
    UPDATE tbl_feature_settings 
    SET 
      \`limit\` = p_limit,
      updated_by = p_updated_by,
      updated_by_type = p_updated_by_type,
      updated_at = NOW()
    WHERE type = p_type;

  ELSE
    -- Insert new type row
    INSERT INTO tbl_feature_settings (
      type,
      \`limit\`,
      created_by,
      created_by_type,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      p_type,
      p_limit,
      p_updated_by,
      p_updated_by_type,
      1,
      NOW(),
      NOW()
    );
  END IF;

  -- Return updated row
  SELECT * 
  FROM tbl_feature_settings 
  WHERE type = p_type;

END`);

    // Procedure: getUserDailyFeatureCount
    await sequelize.query(`DROP PROCEDURE IF EXISTS getUserDailyFeatureCount`)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getUserDailyFeatureCount(
      IN p_user_id INT,
      IN p_type VARCHAR(50)
      )
      BEGIN

        IF p_type = "interview" THEN
          SELECT 
            COUNT(*) as count,
            MIN(created_at) as first_attempt
          FROM tbl_interview_evaluations 
          WHERE user_id = p_user_id 
          AND DATE(created_at) = CURDATE();
        ELSEIF p_type = "math_solver" THEN
          SELECT 
            COUNT(*) as count,
            MIN(created_at) as first_attempt
          FROM tbl_math_solver_logs 
          WHERE user_id = p_user_id 
          AND DATE(created_at) = CURDATE();
        ELSEIF p_type = "course_generation" THEN
          SELECT 
            COUNT(*) as count,
            MIN(created_at) as first_attempt
          FROM tbl_course_generation_history 
          WHERE user_id = p_user_id 
          AND DATE(created_at) = CURDATE();
        ELSEIF p_type = "learning_path" THEN
          SELECT 
            COUNT(*) as count,
            MIN(createdAt) as first_attempt
          FROM tbl_learning_paths 
          WHERE user_id = p_user_id 
          AND DATE(createdAt) = CURDATE();
        END IF;
      END`);

    console.log("✅ Interview Settings procedures created!");
  } catch (error) {
    console.error("❌ Error setting up interview Settings procedures:", error);
    throw error;
  }
};

module.exports = setupInterviewSettingsProcedures;
