// utils/procedure/courseCategoryProcedures.js

const sequelize = require("../../config/db");

const setupCourseCategoryProcedures = async () => {
  try {
    console.log("🔄 Setting up Course Category procedures...");

    // Procedure: createCourseCategory ✅ (Tested)
    await sequelize.query('DROP PROCEDURE IF EXISTS createCourseCategory')
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createCourseCategory(
  IN p_category VARCHAR(255),
  IN p_created_by INT
)
BEGIN
  DECLARE category_exists INT DEFAULT 0;
  SELECT COUNT(*) INTO category_exists
  FROM tbl_course_categories
  WHERE category = p_category;

  IF category_exists > 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E409|DuplicateCategoryError|Category already exists.',
    MYSQL_ERRNO = 1062;
  ELSE
    INSERT INTO tbl_course_categories (
      category,
      status,
      created_by,
      updated_by,
      created_at,
      updated_at
    ) VALUES (
      p_category,
      'active', -- Default status
      p_created_by,
      p_created_by,
      NOW(),
      NOW()
    );
    SELECT * FROM tbl_course_categories WHERE id = LAST_INSERT_ID();
  END IF;
END
  `);

    // Procedure: getAllCourseCategories ✅ (Tested)
    await sequelize.query(`DROP PROCEDURE IF EXISTS getAllCourseCategories`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllCourseCategories(
      IN p_is_active VARCHAR(50),
      IN p_sortBy VARCHAR(50)
)
    BEGIN
      SELECT * FROM tbl_course_categories
       WHERE ( p_is_active IS NULL OR  p_is_active = 'all' OR status = p_is_active)

    ORDER BY
        CASE WHEN p_sortBy = 'created_at' THEN created_by END ASC,
        CASE WHEN p_sortBy = 'name' THEN category END ASC,
        CASE WHEN p_sortBy = 'status' THEN status END ASC,
        created_at DESC; -- default fallback sorting
    END
  `);

    // Procedure: getAllCourseCategories ✅ (Tested)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllActiveCourseCategories()
    BEGIN
      SELECT * FROM tbl_course_categories WHERE status = 'active';
    END
  `);

    // Procedure: getCourseCategoryById ✅ (Tested)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCourseCategoryById(IN p_id INT)
    BEGIN
      SELECT * FROM tbl_course_categories WHERE id = p_id;
    END
  `);

    // Procedure: updateCourseCategory ✅ (Tested)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateCourseCategory(
      IN p_id INT,
      IN p_category VARCHAR(255),
      IN p_updated_by INT
    )
    BEGIN
      DECLARE category_exists INT;
      SELECT COUNT(*) INTO category_exists
      FROM tbl_course_categories
      WHERE id = p_id;

      IF category_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Category not found.';
      ELSE
        UPDATE tbl_course_categories
        SET category = p_category,
            updated_by = p_updated_by,
            updated_at = NOW()
        WHERE id = p_id;
      END IF;
    END
  `);

    // Procedure: updateCourseCategoryStatus ✅ (Tested)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateCourseCategoryStatus(
    IN p_id INT,
    IN p_status VARCHAR(20),
    IN p_updated_by INT
  )
  BEGIN
    DECLARE category_exists INT;
    SELECT COUNT(*) INTO category_exists
    FROM tbl_course_categories
    WHERE id = p_id;
  
    IF category_exists = 0 THEN
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Category not found.';
    ELSE
      UPDATE tbl_course_categories
      SET status = p_status,
          updated_by = p_updated_by,
          updated_at = NOW()
      WHERE id = p_id;
    END IF;
  END
 `);

    // Procedure: deleteCourseCategory ✅ (Tested)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteCourseCategory(IN p_id INT)
    BEGIN
      DECLARE category_exists INT;
      SELECT COUNT(*) INTO category_exists
      FROM tbl_course_categories
      WHERE id = p_id;

      IF category_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Category not found.';
      ELSE
        DELETE FROM tbl_course_categories WHERE id = p_id;
      END IF;
    END
  `);

    console.log("✅ Course Category procedures created!");
  } catch (error) {
    console.error("❌ Error setting up course category procedures:", error);
    throw error;
  }
};

module.exports = setupCourseCategoryProcedures;
