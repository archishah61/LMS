
const sequelize = require("../../../config/db");

const setupMultipleChoiceQuestionGQProcedures = async () => {
    try {
        console.log("🔄 Setting up TextBasedQuizText - MCQ  procedures...");

        // Procedure: createCourseCategory
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createMultipleChoiceQuestion (
    IN p_quizTextId INT,
    IN p_text TEXT,
    IN p_correctAnswer VARCHAR(255),
    IN p_marks INT,
    IN p_options JSON,
    IN p_created_by INT,
    IN p_updated_by INT,
    IN p_created_by_type ENUM('admin', 'partner'),
    IN p_updated_by_type ENUM('admin', 'partner')
)
BEGIN
    INSERT INTO tbl_multiple_choice_questions_gq (quizTextId, text, correctAnswer, marks, options, created_by, updated_by, created_by_type, updated_by_type, created_at, updated_at)
    VALUES (p_quizTextId, p_text, p_correctAnswer, p_marks, p_options, p_created_by, p_updated_by, p_created_by_type, p_updated_by_type, NOW(), NOW());

    SELECT * FROM tbl_multiple_choice_questions_gq WHERE id = LAST_INSERT_ID();
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllMultipleChoiceQuestions()
BEGIN
    SELECT * FROM tbl_multiple_choice_questions_gq;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getMultipleChoiceQuestionById(IN p_id INT)
BEGIN
    SELECT * FROM tbl_multiple_choice_questions_gq WHERE id = p_id;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateMultipleChoiceQuestion (
    IN p_id INT,
    IN p_text TEXT,
    IN p_correctAnswer VARCHAR(255),
    IN p_options JSON,
    IN p_updated_by INT,
    IN p_updated_by_type ENUM('admin', 'partner')
)
BEGIN
    UPDATE tbl_multiple_choice_questions_gq
    SET text = p_text,
        correctAnswer = p_correctAnswer,
        options = p_options,
        updated_by = p_updated_by,
        updated_by_type = p_updated_by_type,
        updated_at = NOW()
    WHERE id = p_id;

    SELECT * FROM tbl_multiple_choice_questions_gq WHERE id = p_id;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteMultipleChoiceQuestionsByQuizTextId(IN p_quizTextId INT)
BEGIN
    DELETE FROM tbl_multiple_choice_questions_gq WHERE quizTextId = p_quizTextId;
END`);



        console.log("✅ Course procedures created!");
    } catch (error) {
        console.error("❌ Error setting TextBasedQuizText - MCQ procedures:", error);
        throw error;
    }
};

module.exports = setupMultipleChoiceQuestionGQProcedures;
