// utils/procedure/courseCategoryProcedures.js

const sequelize = require("../../config/db");

const setupMainSectionProcedures = async () => {
    try {
        console.log("🔄 Setting up Course Category procedures...");

        // Procedure: createCourseCategory
        await sequelize.query(`
            CREATE PROCEDURE IF NOT EXISTS createMainSection(
                IN p_title VARCHAR(255),
                IN p_cheatsheetId INT,
                IN p_createdBy INT,
                IN p_updatedBy INT,
                IN p_created_by_type VARCHAR(255),
                IN p_updated_by_type VARCHAR(255)
            )
            BEGIN
                INSERT INTO tbl_cheat_sheets_main_section (
                    mainTitle, cheatsheetId, createdBy, updatedBy, created_by_type, updated_by_type, created_at, updated_at
                ) VALUES (
                    p_title, p_cheatsheetId, p_createdBy, p_updatedBy, p_created_by_type, p_updated_by_type, NOW(), NOW()
                );

                SELECT * FROM tbl_cheat_sheets_main_section
                WHERE id = LAST_INSERT_ID();
            END
            `);


        // Procedure: getAllCourseCategories
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllMainSections()
BEGIN
    SELECT * FROM tbl_cheat_sheets_main_section;
END`);

        // Procedure: getCourseCategoryById
        await sequelize.query(`DROP PROCEDURE IF EXISTS getMainSectionById`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getMainSectionById(
    IN p_id INT,
    IN p_search_term VARCHAR(255)
)
BEGIN
    SELECT 
        m.id AS mainSectionId,
        m.mainTitle,
        m.status,
        m.cheatsheetId,
        m.createdBy,
        m.created_by_type,
        m.updatedBy,
        m.updated_by_type,
        m.created_at AS mainSectionCreatedAt,
        m.updated_at AS mainSectionUpdatedAt,
        s.id AS sectionId,
        s.title AS sectionTitle,
        s.contentType,
        s.content,
        s.sectionImage,
        s.created_at AS sectionCreatedAt,
        s.updated_at AS sectionUpdatedAt
    FROM tbl_cheat_sheets_main_section m
    LEFT JOIN tbl_cheat_sheet_sections s ON m.id = s.mainSectionId
    WHERE m.cheatsheetId = p_id
    AND (
        p_search_term IS NULL OR p_search_term = '' OR
        s.title LIKE CONCAT('%', p_search_term, '%') OR
        s.content LIKE CONCAT('%', p_search_term, '%')
    );
END`);

        // Procedure: updateCourseCategory
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateMainSection(
    IN p_id INT,
    IN p_mainTitle VARCHAR(255)
    
)
BEGIN
    UPDATE tbl_cheat_sheets_main_section
    SET
        mainTitle = p_mainTitle,
        updated_at = NOW()
    WHERE id = p_id;

    SELECT * FROM tbl_cheat_sheets_main_section WHERE id = p_id;
END`);


        // Procedure: deleteCourseCategory
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteMainSection(IN p_id INT)
BEGIN
    DELETE FROM tbl_cheat_sheets_main_section WHERE id = p_id;
END`);

        // Procedure: toggleMainSectionStatus
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS toggleMainSectionStatus(
        IN p_id INT
    )
    BEGIN
        UPDATE tbl_cheat_sheets_main_section
        SET status = CASE
            WHEN status = 'active' THEN 'inactive'
            ELSE 'active'
        END,
        updated_at = NOW()
        WHERE id = p_id;

        SELECT * FROM tbl_cheat_sheets_main_section WHERE id = p_id;
    END
`);


        console.log("✅ Course Category procedures created!");
    } catch (error) {
        console.error("❌ Error setting up course category procedures:", error);
        throw error;
    }
};

module.exports = setupMainSectionProcedures;
