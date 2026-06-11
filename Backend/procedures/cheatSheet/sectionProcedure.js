// utils/procedure/courseCategoryProcedures.js

const sequelize = require("../../config/db");

const setupMainSectionProcedures = async () => {
    try {
        console.log("🔄 Setting up Course Category procedures...");

        // Procedure: createCourseCategory
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createSection (
    IN p_title VARCHAR(255),
    IN p_contentType ENUM('text', 'image'),
    IN p_content TEXT,
    IN p_sectionImage VARCHAR(255),
    IN p_mainSectionId INT
)
BEGIN
    INSERT INTO tbl_cheat_sheet_sections (
        title,
        contentType,
        content,
        sectionImage,
        mainSectionId,
        created_at,
        updated_at
    ) VALUES (
        p_title,
        p_contentType,
        p_content,
        p_sectionImage,
        p_mainSectionId,
        NOW(),
        NOW()
    );
    
    SELECT * FROM tbl_cheat_sheet_sections WHERE id = LAST_INSERT_ID();
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllSections ()
BEGIN
    SELECT * FROM tbl_cheat_sheet_sections;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getSectionById (
    IN p_id INT
)
BEGIN
    SELECT * FROM tbl_cheat_sheet_sections WHERE id = p_id;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteSection (
    IN p_id INT
)
BEGIN
    DELETE FROM tbl_cheat_sheet_sections WHERE id = p_id;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateSection (
    IN p_id INT,
    IN p_title VARCHAR(255),
    IN p_contentType ENUM('text', 'image'),
    IN p_content TEXT,
    IN p_sectionImage VARCHAR(255)
)
BEGIN
    UPDATE tbl_cheat_sheet_sections
    SET 
        title = p_title,
        contentType = p_contentType,
        content = p_content,
        sectionImage = p_sectionImage,
        updated_at = NOW()
    WHERE id = p_id;

    SELECT * FROM tbl_cheat_sheet_sections WHERE id = p_id;
END`);


        console.log("✅ Course Category procedures created!");
    } catch (error) {
        console.error("❌ Error setting up course category procedures:", error);
        throw error;
    }
};

module.exports = setupMainSectionProcedures;
