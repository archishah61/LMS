const sequelize = require("../../config/db");

const setupUserStreaksProcedures = async () => {
  try {
    console.log("🔄 Setting up User Streaks procedures...");

    // Procedure: Get user streak by ID
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetUserStreakById (
      IN p_user_id INT
    )
    BEGIN
      DECLARE user_exists INT;
      
      -- Check if user streak record exists
      SELECT COUNT(*) INTO user_exists
      FROM tbl_user_streaks
      WHERE user_id = p_user_id;
      
      IF user_exists > 0 THEN
        -- User streak record exists, return it
        SELECT * FROM tbl_user_streaks WHERE user_id = p_user_id;
      ELSE
        -- No record exists, return empty result
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFound|User streak not found';
      END IF;
    END`);

    console.log("✅ User Streaks procedures created!");
  }
  catch (error) {
    console.error("❌ Error setting up User Streaks procedures:", error);
    throw error;
  }
};

module.exports = setupUserStreaksProcedures;