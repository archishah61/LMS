const sequelize = require("../../config/db");

const setupBlogProcedures = async () => {
  try {
    console.log("🔄 Setting up Blog procedures...");

    // Procedure: createBlog
    await sequelize.query(`DROP PROCEDURE IF EXISTS createBlog;`);
    await sequelize.query(`CREATE PROCEDURE createBlog(
      IN p_title VARCHAR(255),
      IN p_slug VARCHAR(255),
      IN p_content TEXT,
      IN p_author VARCHAR(255),
      IN p_image VARCHAR(255),
      IN p_status ENUM('draft', 'published'),
      IN p_category VARCHAR(255)
    )
    BEGIN
      DECLARE slug_exists INT DEFAULT 0;
      SELECT COUNT(*) INTO slug_exists
      FROM tbl_blogs
      WHERE slug = p_slug;

      IF slug_exists > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E409|DuplicateBlogError|Blog with this slug already exists.',
        MYSQL_ERRNO = 1062;
      ELSE
        INSERT INTO tbl_blogs (
          title,
          slug,
          content,
          author,
          image,
          status,
          category,
          created_at,
          updated_at
        ) VALUES (
          p_title,
          p_slug,
          p_content,
          p_author,
          p_image,
          p_status,
          p_category,
          NOW(),
          NOW()
        );
      END IF;
    END
    `);

    // Procedure: getAllBlogs
    await sequelize.query(`DROP PROCEDURE IF EXISTS getAllBlogs;`);
    await sequelize.query(`CREATE PROCEDURE getAllBlogs(
      IN p_search_term VARCHAR(255), 
      IN p_status VARCHAR(20),
      IN p_category VARCHAR(255)
    )
    BEGIN
      SELECT * 
      FROM tbl_blogs
      WHERE (p_search_term IS NULL OR p_search_term = '' 
        OR title LIKE CONCAT('%', p_search_term, '%')
        OR author LIKE CONCAT('%', p_search_term, '%'))
        AND (p_status IS NULL OR p_status = '' OR status = p_status)
        AND (p_category IS NULL OR p_category = '' OR category = p_category)
      ORDER BY created_at DESC;
    END`);

    // Procedure: getBlogBySlug
    await sequelize.query(`DROP PROCEDURE IF EXISTS getBlogBySlug;`);
    await sequelize.query(`CREATE PROCEDURE getBlogBySlug(IN p_slug VARCHAR(255))
    BEGIN
      SELECT * 
      FROM tbl_blogs
      WHERE slug = p_slug;
    END`);

    // Procedure: updateBlog
    await sequelize.query(`DROP PROCEDURE IF EXISTS updateBlog;`);
    await sequelize.query(`CREATE PROCEDURE updateBlog(
      IN p_id INT,
      IN p_title VARCHAR(255),
      IN p_slug VARCHAR(255),
      IN p_content TEXT,
      IN p_author VARCHAR(255),
      IN p_image VARCHAR(255),
      IN p_status ENUM('draft', 'published'),
      IN p_category VARCHAR(255)
    )
    BEGIN
      DECLARE blog_exists INT;
      SELECT COUNT(*) INTO blog_exists
      FROM tbl_blogs
      WHERE id = p_id;

      IF blog_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Blog not found.';
      ELSE
        UPDATE tbl_blogs
        SET title = p_title,
            slug = p_slug,
            content = p_content,
            author = p_author,
            image = p_image,
            status = p_status,
            category = p_category,
            updated_at = NOW()
        WHERE id = p_id;
      END IF;
    END
    `);

    // Procedure: deleteBlog
    await sequelize.query(`DROP PROCEDURE IF EXISTS deleteBlog;`);
    await sequelize.query(`CREATE PROCEDURE deleteBlog(IN p_id INT)
    BEGIN
      DECLARE blog_exists INT;
      SELECT COUNT(*) INTO blog_exists
      FROM tbl_blogs
      WHERE id = p_id;

      IF blog_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Blog not found.';
      ELSE
        DELETE FROM tbl_blogs WHERE id = p_id;
      END IF;
    END
    `);

    console.log("✅ Blog procedures created!");
  } catch (error) {
    console.error("❌ Error setting up Blog procedures:", error);
    throw error;
  }
};

module.exports = setupBlogProcedures;
