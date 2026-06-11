const sequelize = require("../../config/db");

const setupQuizOptionProcedures = async () => {
    try {
        console.log("🔄 Setting up Quiz Option procedures...");

        // 🚀 Create Quiz Option ✅ (Tested)
        await sequelize.query(`
    -- Create Quiz Option
CREATE PROCEDURE IF NOT EXISTS createQuizOption (
    IN p_question_id INT,
    IN p_option_text VARCHAR(255),
    IN p_option_img VARCHAR(255),
    IN p_is_correct BOOLEAN,
    IN p_created_by INT,
    IN p_created_by_type ENUM('admin', 'partner'),
    IN p_updated_by INT,
    IN p_updated_by_type ENUM('admin', 'partner')
)
BEGIN

    DECLARE quiz_option_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO quiz_option_exists
    FROM tbl_quizoptions
    WHERE question_id = p_question_id AND option_text = p_option_text;

    IF quiz_option_exists > 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E409|DuplicateQuizOptionError|Quiz Option already exists.',
    MYSQL_ERRNO = 1062;
    ELSE
    INSERT INTO tbl_quizoptions (
        question_id,
        option_text,
        option_img,
        is_correct,
        created_by,
        created_by_type,
        updated_by,
        updated_by_type,
        created_at,
        updated_at
    )
    VALUES (
        p_question_id,
        p_option_text,
        p_option_img,
        p_is_correct,
        p_created_by,
        p_created_by_type,
        p_updated_by,
        p_updated_by_type,
        NOW(),
        NOW()
    );
    END IF;
    SELECT * FROM tbl_quizoptions WHERE id = LAST_INSERT_ID();
END;

    `);

        // 📦 Get All Quiz Options (❌ Unused)
        await sequelize.query(`
        CREATE PROCEDURE IF NOT EXISTS getAllQuizOptions()
BEGIN
    SELECT * FROM tbl_quizoptions;
END 
      `);

        // 📦 Get Quiz Options by Question ID ✅ (Tested)
        await sequelize.query(`
       CREATE PROCEDURE IF NOT EXISTS getQuizOptionsByQuestionId(IN q_id INT)
BEGIN
    SELECT * FROM tbl_quizoptions WHERE question_id = q_id;
END
      `);


        // ♻️ Update Quiz Option by ID ✅ (Tested)
        await sequelize.query(`
        CREATE PROCEDURE IF NOT EXISTS updateQuizOption (
    IN opt_id INT,
    IN opt_text VARCHAR(255),
    IN opt_img VARCHAR(255),
    IN is_correct BOOLEAN,
    IN updated_by INT,
    IN updated_by_type ENUM('admin', 'partner')
)
BEGIN

    DECLARE quiz_option_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO quiz_option_exists
    FROM tbl_quizoptions
    WHERE id = opt_id;

    IF quiz_option_exists = 0 THEN
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'E404|NotFoundError|Quiz Option Not Found.',
      MYSQL_ERRNO = 1062;
    ELSE
    UPDATE tbl_quizoptions
    SET 
        option_text = opt_text,
        option_img = opt_img,
        is_correct = is_correct,
        updated_by = updated_by,
        updated_by_type = updated_by_type,
        updated_at = CURRENT_TIMESTAMP()
    WHERE id = opt_id;
    END IF;
END
      `);


        // 🗑️ Delete Quiz Option by ID ✅ (Tested)
        await sequelize.query(`
           CREATE PROCEDURE IF NOT EXISTS deleteQuizOption (
    IN opt_id INT
)
BEGIN
    DECLARE existing INT;

    SELECT COUNT(*) INTO existing FROM tbl_quizoptions WHERE id = opt_id;

    IF existing = 0 THEN
        -- Return nothing (controller handles the 404)
        SELECT NULL AS message;
    ELSE
        -- Return the row to be deleted
        SELECT * FROM tbl_quizoptions WHERE id = opt_id;

        -- Perform delete
        DELETE FROM tbl_quizoptions WHERE id = opt_id;
    END IF;
END
          `);


        // 🧨 Delete All Options by Question ID ✅ (Tested)
        await sequelize.query(`
           CREATE PROCEDURE IF NOT EXISTS deleteQuizOptionsByQuestionId (
    IN q_id INT
)
BEGIN
    DECLARE total_deleted INT;

    -- Count how many records exist
    SELECT COUNT(*) INTO total_deleted
    FROM tbl_quizoptions
    WHERE question_id = q_id;

    -- Perform deletion
    DELETE FROM tbl_quizoptions
    WHERE question_id = q_id;

    -- Return the deleted count
    SELECT total_deleted AS deletedCount;
END
          `);



        console.log("✅ Quiz Option procedures created successfully!");
    } catch (error) {
        console.error("❌ Error setting up quiz option procedures:", error);
        throw error;
    }
};

module.exports = setupQuizOptionProcedures;
