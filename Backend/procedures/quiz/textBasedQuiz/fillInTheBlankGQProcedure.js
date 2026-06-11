
const sequelize = require("../../../config/db");

const setupFillInTheBlankGQProcedures = async () => {
    try {
        console.log("🔄 Setting up TextBasedQuizText - fill in the blank  procedures...");

        // Procedure: createCourseCategory
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createFillInBlankQuestionGQ (
    IN p_quizTextId INT,
    IN p_text TEXT,
    IN p_correctAnswer VARCHAR(255),
    IN p_marks INT,
    IN p_created_by INT,
    IN p_updated_by INT,
    IN p_created_by_type ENUM('admin', 'partner'),
    IN p_updated_by_type ENUM('admin', 'partner')
)
BEGIN
    INSERT INTO tbl_fill_in_blank_questions_gq (quizTextId, text, correctAnswer, marks, created_by, updated_by, created_by_type, updated_by_type, created_at, updated_at)
    VALUES (p_quizTextId, p_text, p_correctAnswer, p_marks, p_created_by, p_updated_by, p_created_by_type, p_updated_by_type, NOW(), NOW());

    SELECT * FROM tbl_fill_in_blank_questions_gq WHERE id = LAST_INSERT_ID();
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteFillInBlankQuestionGQ (
    IN p_quizTextId INT
)
BEGIN
    DELETE FROM tbl_fill_in_blank_questions_gq WHERE quizTextId = p_quizTextId;
END`);
        console.log("✅ Course procedures created!");
    } catch (error) {
        console.error("❌ Error setting TextBasedQuizText - fill in the blank procedures:", error);
        throw error;
    }
};

module.exports = setupFillInTheBlankGQProcedures;
