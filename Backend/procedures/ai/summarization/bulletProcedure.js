const sequelize = require("../../../config/db");

const setupBulletProcedures = async () => {
    try {
        console.log("🔄 Setting up Bullet procedures...");

        //create to Bullet points   (✅ Tested)
       // Create Bullet Point
await sequelize.query(`
  CREATE PROCEDURE IF NOT EXISTS createBulletPoint(
    IN p_summary_id INT,
    IN p_bullet_point TEXT
  )
  BEGIN
    INSERT INTO tbl_bullet_points (
      summary_id,
      bullet_point,
      created_at,
      updated_at
    ) VALUES (
      p_summary_id,
      p_bullet_point,
      NOW(),
      NOW()
    );

    SELECT * FROM tbl_bullet_points WHERE id = LAST_INSERT_ID();
  END;
`);

        console.log("✅ Bullet procedures created!");
    } catch (error) {
        console.error("❌ Error setting up Bullet procedures:", error);
        throw error;
    }
};

module.exports = setupBulletProcedures;