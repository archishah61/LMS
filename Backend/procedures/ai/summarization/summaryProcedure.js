const sequelize = require("../../../config/db");

const setupSummaryProcedures = async () => {
    try {
        console.log("🔄 Setting up Summary procedures...");

        // Create Summary
        await sequelize.query(`
  CREATE PROCEDURE IF NOT EXISTS createSummary(
    IN p_topic_id INT,
    IN p_general_material_desc_id INT,
    IN p_general_material_pdf_id INT,
    IN p_accordion_id INT,
    IN p_multi_slide_general_desc_id INT,
    IN p_multi_slide_general_pdf_id INT,
    IN p_multi_slide_accordion_id INT,
    IN p_user_id INT,
    IN p_summary TEXT
  )
  BEGIN
    INSERT INTO tbl_summaries (
      topic_id,
      general_material_desc_id,
      general_material_pdf_id,
      accordion_id,
      multi_slide_general_desc_id,
      multi_slide_general_pdf_id,
      multi_slide_accordion_id,
      user_id,
      summary,
      created_at,
      updated_at
    )
    VALUES (
      p_topic_id,
      p_general_material_desc_id,
      p_general_material_pdf_id,
      p_accordion_id,
      p_multi_slide_general_desc_id,
      p_multi_slide_general_pdf_id,
      p_multi_slide_accordion_id,
      p_user_id,
      p_summary,
      NOW(),
      NOW()
    );

    SELECT * FROM tbl_summaries WHERE id = LAST_INSERT_ID();
  END;
`);


        console.log("✅ Summary procedures created!");
    } catch (error) {
        console.error("❌ Error setting up Summary procedures:", error);
        throw error;
    }
};

module.exports = setupSummaryProcedures;