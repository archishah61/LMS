const sequelize = require("../../config/db");

const setupisPartnerActiveProcedures = async () => {
  try {
    console.log("🔄 Setting up isPartnerActive procedures...");

    // Get partner status by ID
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS getPartnerStatusById(IN p_id INT)
      BEGIN
        DECLARE err_message VARCHAR(255);

        IF NOT EXISTS (SELECT 1 FROM tbl_partnerActive WHERE id = p_id) THEN
          SET err_message = 'E404|NotFoundError|Partner not found';
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = err_message;
        END IF;

        SELECT id, isActive, created_at, updated_at
        FROM tbl_partnerActive
        WHERE id = p_id;
      END
    `);

    // Toggle partner status Active <-> Inactive
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS togglePartnerStatus(IN p_id INT)
BEGIN
  DECLARE v_current ENUM('Active','Inactive');
  DECLARE v_new ENUM('Active','Inactive');

  -- If no record exists for the given ID, create one as Active
  IF NOT EXISTS (SELECT 1 FROM tbl_partnerActive WHERE id = p_id) THEN
    INSERT INTO tbl_partnerActive (id, isActive, created_at, updated_at)
    VALUES (p_id, 'Active', NOW(), NOW());
    
    -- Since we just inserted it, set v_new to 'Active'
    SET v_new = 'Active';
  ELSE
    -- Otherwise, fetch current status
    SELECT isActive INTO v_current FROM tbl_partnerActive WHERE id = p_id;
    SET v_new = IF(v_current = 'Active', 'Inactive', 'Active');
    
    -- Update the existing record with the toggled status
    UPDATE tbl_partnerActive
    SET isActive = v_new,
        updated_at = NOW()
    WHERE id = p_id;
  END IF;

  -- Return the current state
  SELECT id, isActive, created_at, updated_at
  FROM tbl_partnerActive
  WHERE id = p_id;
END`);

    console.log("✅ isPartnerActive procedures created!");
  } catch (error) {
    console.error("❌ Error setting up isPartnerActive procedures:", error);
    throw error;
  }
};

module.exports = setupisPartnerActiveProcedures;