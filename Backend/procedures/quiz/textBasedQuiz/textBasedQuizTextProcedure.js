// utils/procedure/courseCategoryProcedures.js

const sequelize = require("../../../config/db");

const setupTextBasedQuizTextProcedures = async () => {
    try {
        console.log("🔄 Setting up TextBasedQuizText  procedures...");

        // Procedure: createCourseCategory
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS CreateTextBasedQuizText (
    IN p_quiz_id INT,
    IN p_text TEXT,
    IN p_created_by INT,
    IN p_updated_by INT,
    IN p_created_by_type ENUM('admin', 'partner'),
    IN p_updated_by_type ENUM('admin', 'partner')
)
BEGIN
    INSERT INTO tbl_textbasedquiztext (
        quiz_id, text, created_by, updated_by, created_by_type, updated_by_type, created_at, updated_at
    ) VALUES (
        p_quiz_id, p_text, p_created_by, p_updated_by, p_created_by_type, p_updated_by_type, NOW(), NOW()
    );

    SELECT * FROM tbl_textbasedquiztext WHERE id = LAST_INSERT_ID();
END `);

        await sequelize.query('DROP PROCEDURE IF EXISTS GetTextBasedQuizTextByQuizId');
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetTextBasedQuizTextByQuizId(IN p_quiz_id INT)
BEGIN
    -- Text-Based Questions
    SELECT 
        id AS quiz_text_id,
        quiz_id,
        text
    FROM 
        tbl_textbasedquiztext
    WHERE 
        quiz_id = p_quiz_id;

    -- Fill-in-the-Blank Questions
    SELECT 
        id AS fib_id,
        quizTextId,
        text AS fib_text,
        marks,
        correctAnswer AS fib_answer
    FROM 
        tbl_fill_in_blank_questions_gq
    WHERE 
        quizTextId IN (
            SELECT id FROM tbl_textbasedquiztext WHERE quiz_id = p_quiz_id
        );

    -- Multiple Choice Questions
    SELECT 
        id AS mcq_id,
        quizTextId,
        text AS mcq_text,
        marks,
        correctAnswer AS mcq_answer,
        options AS mcq_options
    FROM 
        tbl_multiple_choice_questions_gq
    WHERE 
        quizTextId IN (
            SELECT id FROM tbl_textbasedquiztext WHERE quiz_id = p_quiz_id
        );

    -- True/False Questions
    SELECT 
        id AS tf_id,
        quizTextId,
        text AS tf_text,
        marks,
        correctAnswer AS tf_answer
    FROM 
        tbl_true_false_questions_gq
    WHERE 
        quizTextId IN (
            SELECT id FROM tbl_textbasedquiztext WHERE quiz_id = p_quiz_id
        );
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateTextBasedQuizText (
    IN p_id INT,
    IN p_text TEXT,
    IN p_updated_by INT,
    IN p_updated_by_type ENUM('admin', 'partner')
)
BEGIN
    UPDATE tbl_textbasedquiztext 
    SET text = p_text,
        updated_by = p_updated_by,
        updated_by_type = p_updated_by_type,
        updated_at = NOW()
    WHERE quiz_id = p_id;

    SELECT * FROM tbl_textbasedquiztext WHERE quiz_id = p_id;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS DeleteTextBasedQuizText(IN p_id INT)
BEGIN
    SELECT * FROM tbl_textbasedquiztext WHERE id = p_id;
    DELETE FROM tbl_textbasedquiztext WHERE id = p_id;
END`);



        console.log("✅ Course procedures created!");
    } catch (error) {
        console.error("❌ Error setting TextBasedQuizText procedures:", error);
        throw error;
    }
};

module.exports = setupTextBasedQuizTextProcedures;
