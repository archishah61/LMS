const sequelize = require("../../config/db");

const setupParagraphGeneratorProcedures = async () => {
    try {
        console.log("🔄 Setting up Paragraph Generator procedures...");

        await sequelize.query(`DROP PROCEDURE IF EXISTS createAiParagraphPractice;`);
        await sequelize.query(`CREATE PROCEDURE createAiParagraphPractice (
    IN p_user_id INT,
    IN p_difficulty VARCHAR(50),
    IN p_paragraph TEXT,
    IN p_wpm FLOAT,
    IN p_accuracy FLOAT,
    IN p_time_taken FLOAT,
    IN p_wrong_words INT,
    IN p_backspace_count INT,
    IN p_last_word_speed INT
)
BEGIN

    DECLARE v_attempt_count INT;
    
    -- Calculate the attempt count for this user (total attempts + 1)
    SELECT COUNT(*) + 1 INTO v_attempt_count
    FROM tbl_ai_paragraph_practices 
    WHERE user_id = p_user_id;
    
    -- If no previous attempts, set to 1
    IF v_attempt_count IS NULL THEN
        SET v_attempt_count = 1;
    END IF;

    INSERT INTO tbl_ai_paragraph_practices (
        user_id,
        difficulty,
        paragraph,
        wpm,
        accuracy,
        time_taken,
        wrong_words,
        backspace_count,
        last_word_speed,
        attempt_count,
        is_analyzed,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_difficulty,
        p_paragraph,
        p_wpm,
        p_accuracy,
        p_time_taken,
        p_wrong_words,
        p_backspace_count,
        p_last_word_speed,
        v_attempt_count,
        FALSE,
        NOW(),
        NOW()
    );
    
    -- Return the created session
    SELECT * FROM tbl_ai_paragraph_practices WHERE id = LAST_INSERT_ID();
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS updateAiParagraphPractice;`);
        await sequelize.query(`CREATE PROCEDURE updateAiParagraphPractice (
    IN p_session_id INT,
    IN p_analysis JSON,
    IN p_is_analyzed BOOLEAN
)
BEGIN
    UPDATE tbl_ai_paragraph_practices 
    SET 
        analysis = COALESCE(p_analysis, analysis),
        is_analyzed = COALESCE(p_is_analyzed, is_analyzed),
        updated_at = NOW()
    WHERE 
        id = p_session_id;
    
    -- Return the updated session
    SELECT * FROM tbl_ai_paragraph_practices WHERE id = p_session_id;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getUserPracticeHistory;`);
        await sequelize.query(`CREATE PROCEDURE getUserPracticeHistory (
    IN p_user_id INT
)
BEGIN
    -- Get paginated results
    SELECT * FROM tbl_ai_paragraph_practices 
    WHERE user_id = p_user_id 
    ORDER BY created_at DESC;
END`);

        console.log("✅ Paragraph Generator procedures created!");
    } catch (error) {
        console.error("❌ Error setting up Paragraph Generator procedures:", error);
        throw error;
    }
};

module.exports = setupParagraphGeneratorProcedures;
