const sequelize = require("../../../config/db");

const setupFlashCardProcedures = async () => {
  try {
    console.log("🔄 Setting up Flash Card procedures...");

    // Create Flash Card
    await sequelize.query(`
  CREATE PROCEDURE IF NOT EXISTS createFlashCard(
    IN p_summary_id INT,
    IN p_question TEXT,
    IN p_answer TEXT
  )
  BEGIN
    INSERT INTO tbl_flash_cards (
      summary_id,
      question,
      answer,
      created_at,
      updated_at
    ) VALUES (
      p_summary_id,
      p_question,
      p_answer,
      NOW(),
      NOW()
    );

    SELECT * FROM tbl_flash_cards WHERE id = LAST_INSERT_ID();
  END;
`);


    console.log("✅ Flash Card procedures created!");
  } catch (error) {
    console.error("❌ Error setting up Flash Card procedures:", error);
    throw error;
  }
};

module.exports = setupFlashCardProcedures;
