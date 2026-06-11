const sequelize = require("../../config/db");

const setupBlogCategoryProcedures = async () => {
  const procedures = [
    {
      name: "createBlogCategory",
      query: `
        CREATE PROCEDURE createBlogCategory(
          IN p_name VARCHAR(255),
          IN p_description TEXT
        )
        BEGIN
          INSERT INTO tbl_blog_categories (name, description, created_at, updated_at)
          VALUES (p_name, p_description, NOW(), NOW());
        END
      `,
    },
    {
      name: "getAllBlogCategories",
      query: `
        CREATE PROCEDURE getAllBlogCategories()
        BEGIN
          SELECT * FROM tbl_blog_categories ORDER BY name ASC;
        END
      `,
    },
    {
      name: "updateBlogCategory",
      query: `
        CREATE PROCEDURE updateBlogCategory(
          IN p_id INT,
          IN p_name VARCHAR(255),
          IN p_description TEXT,
          IN p_status BOOLEAN
        )
        BEGIN
          UPDATE tbl_blog_categories
          SET name = p_name, description = p_description, status = p_status, updated_at = NOW()
          WHERE id = p_id;
        END
      `,
    },
    {
      name: "deleteBlogCategory",
      query: `
        CREATE PROCEDURE deleteBlogCategory(IN p_id INT)
        BEGIN
          DELETE FROM tbl_blog_categories WHERE id = p_id;
        END
      `,
    },
  ];

  for (const proc of procedures) {
    try {
      await sequelize.query(`DROP PROCEDURE IF EXISTS ${proc.name}`);
      await sequelize.query(proc.query);
      console.log(`✅ Procedure ${proc.name} created successfully.`);
    } catch (error) {
      console.error(`❌ Error creating procedure ${proc.name}:`, error);
    }
  }
};

module.exports = setupBlogCategoryProcedures;
