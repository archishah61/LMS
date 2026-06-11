const sequelize = require("../../config/db");

const setupTestimonialProcedures = async () => {
    try {
        await sequelize.query(`DROP PROCEDURE IF EXISTS createTestimonial`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createTestimonial (
                IN p_author_name VARCHAR(255),
                IN p_author_image VARCHAR(500),
                IN p_author_role VARCHAR(255),
                IN p_testimonial_text TEXT,
                IN p_rating INT,
                IN p_company_id INT,
                IN p_status VARCHAR(20),
                IN p_created_by INT
            )
            BEGIN
                -- Validate rating range
                IF p_rating < 1 OR p_rating > 5 THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Rating must be between 1 and 5.';
                ELSE
                    INSERT INTO tbl_testimonials (
                        author_name, author_image, author_role, testimonial_text, 
                        rating, company_id, status, created_by, updated_by, created_at, updated_at
                    ) VALUES (
                        p_author_name, p_author_image, p_author_role, p_testimonial_text,
                        p_rating, p_company_id, p_status, p_created_by, p_created_by, NOW(), NOW()
                    );
                    
                    -- Return the created testimonial with company data
                    SELECT t.*, 
                        c.id AS company_id, c.name AS company_name, c.logo_url AS company_logo_url
                    FROM tbl_testimonials t
                    LEFT JOIN tbl_company_logos c ON t.company_id = c.id
                    WHERE t.id = LAST_INSERT_ID();
                END IF;
            END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS updateTestimonial`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateTestimonial (
                IN p_id INT,
                IN p_author_name VARCHAR(255),
                IN p_author_image VARCHAR(500),
                IN p_author_role VARCHAR(255),
                IN p_testimonial_text TEXT,
                IN p_rating INT,
                IN p_company_id INT,
                IN p_status VARCHAR(20),
                IN p_updated_by INT
            )
            BEGIN
                -- Check if testimonial exists
                IF NOT EXISTS (SELECT 1 FROM tbl_testimonials WHERE id = p_id) THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Testimonial not found.';
                -- Validate rating range if provided
                ELSEIF p_rating IS NOT NULL AND (p_rating < 1 OR p_rating > 5) THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Rating must be between 1 and 5.';
                ELSE
                    UPDATE tbl_testimonials
                    SET author_name = COALESCE(p_author_name, author_name),
                        author_image = COALESCE(p_author_image, author_image),
                        author_role = COALESCE(p_author_role, author_role),
                        testimonial_text = COALESCE(p_testimonial_text, testimonial_text),
                        rating = COALESCE(p_rating, rating),
                        company_id = COALESCE(p_company_id, company_id),
                        status = COALESCE(p_status, status),
                        updated_by = p_updated_by,
                        updated_at = NOW()
                    WHERE id = p_id;
                    
                    -- Return the updated testimonial with company data
                    SELECT t.*, 
                        c.id AS company_id, c.name AS company_name, c.logo_url AS company_logo_url
                    FROM tbl_testimonials t
                    LEFT JOIN tbl_company_logos c ON t.company_id = c.id
                    WHERE t.id = p_id;
                END IF;
            END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getAllTestimonials`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllTestimonials(
                IN p_status VARCHAR(20)
            )
            BEGIN
                SELECT t.*, 
                    JSON_OBJECT(
                        'id', c.id,
                        'name', c.name,
                        'logo_url', c.logo_url
                    ) AS company
                FROM tbl_testimonials t
                LEFT JOIN tbl_company_logos c ON t.company_id = c.id
                WHERE (p_status IS NULL OR p_status = '' OR t.status = p_status);
            END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS deleteTestimonial`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteTestimonial(IN p_id INT)
            BEGIN
                -- Check if testimonial exists
                IF NOT EXISTS (SELECT 1 FROM tbl_testimonials WHERE id = p_id) THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Testimonial not found.';
                ELSE
                    DELETE FROM tbl_testimonials WHERE id = p_id;
                    
                    SELECT ROW_COUNT() AS deleted_count;
                END IF;
            END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS createCompanyLogo`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createCompanyLogo (
                IN p_name VARCHAR(255),
                IN p_logo_url VARCHAR(500),
                IN p_status VARCHAR(20),
                IN p_created_by INT
            )
            BEGIN
                -- Check if company name already exists
                IF EXISTS (SELECT 1 FROM tbl_company_logos WHERE name = p_name) THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Company name already exists.';
                ELSE
                    INSERT INTO tbl_company_logos (
                        name, logo_url, status, created_by, updated_by, created_at, updated_at
                    ) VALUES (
                        p_name, p_logo_url, p_status, p_created_by, p_created_by, NOW(), NOW()
                    );
                    
                    SELECT * FROM tbl_company_logos WHERE id = LAST_INSERT_ID();
                END IF;
            END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS updateCompanyLogo `);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateCompanyLogo (
                IN p_id INT,
                IN p_name VARCHAR(255),
                IN p_logo_url VARCHAR(500),
                IN p_status VARCHAR(20),
                IN p_updated_by INT
            )
            BEGIN
                -- Check if company logo exists
                IF NOT EXISTS (SELECT 1 FROM tbl_company_logos WHERE id = p_id) THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Company logo not found.';
                -- Check if name is already used by another record
                ELSEIF EXISTS (SELECT 1 FROM tbl_company_logos WHERE name = p_name AND id != p_id) THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Company name already used by another record.';
                ELSE
                    UPDATE tbl_company_logos
                    SET name = COALESCE(p_name, name),
                        logo_url = COALESCE(p_logo_url, logo_url),
                        status = COALESCE(p_status, status),
                        updated_by = p_updated_by,
                        updated_at = NOW()
                    WHERE id = p_id;
                    
                    SELECT * FROM tbl_company_logos WHERE id = p_id;
                END IF;
            END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getAllCompanyLogos`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllCompanyLogos()
            BEGIN
                SELECT * FROM tbl_company_logos;
            END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS deleteCompanyLogo`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteCompanyLogo(IN p_id INT)
            BEGIN
                -- Check if company logo exists
                IF NOT EXISTS (SELECT 1 FROM tbl_company_logos WHERE id = p_id) THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Company logo not found.';
                -- Check if company logo is being used by any testimonial
                ELSEIF EXISTS (SELECT 1 FROM tbl_testimonials WHERE company_id = p_id) THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot delete company logo as it is being used by one or more testimonials.';
                ELSE
                    DELETE FROM tbl_company_logos WHERE id = p_id;
                    
                    SELECT ROW_COUNT() AS deleted_count;
                END IF;
            END`);

        console.log("✅ Testimonial Procedures created successfully");
    } catch (error) {
        console.error("❌ Error setting up Testimonial Procedures:", error);
    }
};

module.exports = setupTestimonialProcedures;
