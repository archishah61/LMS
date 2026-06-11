const sequelize = require("../../config/db");

const setupFeatureStatusProcedures = async () => {
    try {
        console.log("🔄 Setting up Feature Status procedures...");

        // ============================
        // 1️⃣ PROCEDURE: Get Feature Status By ID
        // ============================
        await sequelize.query("DROP PROCEDURE IF EXISTS getFeatureStatusByName;");
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getFeatureStatusByName(IN p_name VARCHAR(100))
BEGIN
  DECLARE err_message VARCHAR(255);

  -- Check if the feature exists based on name
  IF NOT EXISTS (SELECT 1 FROM tbl_feature_status WHERE name = p_name) THEN
    SET err_message = 'E404|NotFoundError|Feature not found';
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = err_message;
  END IF;

  -- Return the feature
  SELECT id, name, is_active, created_at, updated_at
  FROM tbl_feature_status
  WHERE name = p_name;
END`);

        // ============================
        // 2️⃣ PROCEDURE: Toggle Feature Status (true <-> false)
        // ============================
        await sequelize.query("DROP PROCEDURE IF EXISTS toggleFeatureStatus;");
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS toggleFeatureStatus(IN p_id INT)
      BEGIN
        DECLARE v_current BOOLEAN;
        DECLARE err_message VARCHAR(255);

        -- Check if record exists
        IF NOT EXISTS (SELECT 1 FROM tbl_feature_status WHERE id = p_id) THEN
          SET err_message = 'E404|NotFoundError|Feature not found';
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = err_message;
        END IF;

        -- Fetch current status
        SELECT is_active INTO v_current 
        FROM tbl_feature_status 
        WHERE id = p_id;

        -- Toggle boolean
        UPDATE tbl_feature_status
        SET is_active = NOT v_current,
            updated_at = NOW()
        WHERE id = p_id;

        -- Return updated record
        SELECT id, name, is_active, created_at, updated_at
        FROM tbl_feature_status
        WHERE id = p_id;
      END
    `);

        await sequelize.query("DROP PROCEDURE IF EXISTS getAllFeatureStatus;");
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllFeatureStatus(
            IN p_sort_by VARCHAR(20),
            IN p_status VARCHAR(10)
          )
        BEGIN
        DECLARE err_message VARCHAR(255);

        -- Check if any feature exists
        IF NOT EXISTS (SELECT 1 FROM tbl_feature_status) THEN
            SET err_message = 'E404|NotFoundError|No feature status records found';
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = err_message;
        END IF;

        -- Return all features
        SELECT id, name, is_active, created_at, updated_at
        FROM tbl_feature_status
        WHERE (p_status IS NULL OR p_status = 'all' OR 
              (p_status = 'active' AND is_active = TRUE) OR 
              (p_status = 'inactive' AND is_active = FALSE))
        ORDER BY
            CASE WHEN p_sort_by = 'name' THEN name END ASC,
            CASE WHEN p_sort_by = 'status' THEN is_active END DESC,
            created_at DESC;
        END`);

        console.log("✅ Feature Status procedures created!");
    } catch (error) {
        console.error("❌ Error setting up Feature Status procedures:", error);
        throw error;
    }
};

module.exports = setupFeatureStatusProcedures;
