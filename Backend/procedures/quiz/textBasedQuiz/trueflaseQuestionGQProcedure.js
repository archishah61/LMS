
const sequelize = require("../../../config/db");

const setupTrueFalseGQProcedures = async () => {
    try {
        console.log("🔄 Setting up TextBasedQuizText - true false  procedures...");

        // Procedure: createCourseCategory
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createTrueFalseQuestionGQ(
    IN p_quizTextId INT,
    IN p_text TEXT,
    IN p_correctAnswer BOOLEAN,
    IN p_marks INT,
    IN p_created_by INT,
    IN p_updated_by INT,
    IN p_created_by_type ENUM('admin', 'partner'),
    IN p_updated_by_type ENUM('admin', 'partner')
)
BEGIN

    INSERT INTO tbl_true_false_questions_gq (quizTextId, text, correctAnswer, marks, created_by, updated_by, created_by_type, updated_by_type, created_at, updated_at)
    VALUES (p_quizTextId, p_text, p_correctAnswer, p_marks, p_created_by, p_updated_by, p_created_by_type, p_updated_by_type, NOW(), NOW());

    SELECT * FROM tbl_true_false_questions_gq WHERE id = LAST_INSERT_ID();
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllTrueFalseQuestionsGQ()
BEGIN
    SELECT * FROM tbl_true_false_questions_gq;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getTrueFalseQuestionByIdGQ(IN p_id INT)
BEGIN
    SELECT * FROM tbl_true_false_questions_gq WHERE id = p_id;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateTrueFalseQuestionGQ (
    IN p_id INT,
    IN p_text TEXT,
    IN p_correctAnswer BOOLEAN,
    IN p_updated_by INT,
    IN p_updated_by_type ENUM('admin', 'partner')
)
BEGIN
    UPDATE tbl_true_false_questions_gq
    SET text = p_text,
        correctAnswer = p_correctAnswer,
        updated_by = p_updated_by,
        updated_by_type = p_updated_by_type,
        updated_at = NOW()
    WHERE id = p_id;

    SELECT * FROM tbl_true_false_questions_gq WHERE id = p_id;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteTrueFalseQuestionByQuizTextIdGQ(IN p_quizTextId INT)
BEGIN
    DELETE FROM tbl_true_false_questions_gq WHERE quizTextId = p_quizTextId;
END`);



        console.log("✅ Course procedures created!");
    } catch (error) {
        console.error("❌ Error setting TextBasedQuizText - true false procedures:", error);
        throw error;
    }
};

module.exports = setupTrueFalseGQProcedures;
