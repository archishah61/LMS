// utils/procedures/paragraphWritingProcedures.js
const sequelize = require("../../config/db");

const setupParagraphWritingProcedures = async () => {
  try {
    console.log("🔄 Setting up Paragraph Writing procedures...");

    // Paragraph Writing Create Procedure ✅ (Fixed to match model)
    await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS createParagraphWriting(
      IN p_assignment_id INT,
      IN p_paragraph TEXT,
      IN p_created_by INT,
      IN p_updated_by INT,
      IN p_created_by_type ENUM('admin', 'partner'),
      IN p_updated_by_type ENUM('admin', 'partner')
    )
    BEGIN
      INSERT INTO tbl_paragraph_writing (
        assignment_id,
        paragraph,
        created_by,
        updated_by,
        created_by_type,
        updated_by_type,
        created_at,
        updated_at
      )
      VALUES (
        p_assignment_id,
        p_paragraph,
        p_created_by,
        p_updated_by,
        p_created_by_type,
        p_updated_by_type,
        NOW(),
        NOW()
      );
  
      -- Return the created paragraph writing
      SELECT * FROM tbl_paragraph_writing WHERE id = LAST_INSERT_ID();
    END
  `);

    // Update Para Writing 
    await sequelize.query(`
  CREATE PROCEDURE IF NOT EXISTS updateParagraphWriting(
  IN p_assignment_id INT,
  IN p_paragraph TEXT,
  IN p_updated_by INT,
  IN p_updated_by_type ENUM('admin', 'partner')
)
BEGIN
  DECLARE rows_affected INT;

  UPDATE tbl_paragraph_writing
  SET paragraph = p_paragraph,  -- Ensure full replacement
      updated_by = p_updated_by,
      updated_by_type = p_updated_by_type,
      updated_at = NOW()
  WHERE assignment_id = p_assignment_id;

  SET rows_affected = ROW_COUNT();

  IF rows_affected > 0 THEN
    SELECT 
      1 AS success, 
      'Paragraph writing updated successfully' AS message,
      p_assignment_id AS assignment_id;
  ELSE
    SELECT 
      0 AS success, 
      'No paragraph writing found to update' AS message,
      p_assignment_id AS assignment_id;
  END IF;
END;
  `);



    // Paragraph Writing Get by Assignment ID Procedure ✅
    await sequelize.query(`
  CREATE PROCEDURE IF NOT EXISTS getParagraphWritingByAssignmentId(
    IN p_assignment_id INT
  )
  BEGIN
    SELECT * FROM tbl_paragraph_writing WHERE assignment_id = p_assignment_id;
  END
`);

    console.log("✅ Paragraph Writing procedures created!");
  } catch (error) {
    console.error("❌ Error setting up paragraph writing procedures:", error);
    throw error;
  }
};

module.exports = setupParagraphWritingProcedures;
