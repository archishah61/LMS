// utils/procedure/reviewProcedures.js

const sequelize = require("../../config/db");

const setupReviewProcedures = async () => {
  try {
    console.log("🔄 Setting up Review procedures...");

    // Procedure: createReview   ✅ (Tested)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createReview( 
  IN p_course_id INT,
  IN p_user_id INT,
  IN p_review TEXT,
  IN p_rating INT
)
BEGIN
  DECLARE review_exists INT DEFAULT 0;
  DECLARE err_message VARCHAR(255);

  -- Validate rating range
  IF p_rating < 1 OR p_rating > 5 THEN
    SET err_message = 'E400|InvalidValueError|Rating must be between 1 and 5.';
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = err_message;
  END IF;

  -- Check for existing review by user for this course
  SELECT COUNT(*) INTO review_exists
  FROM tbl_reviews
  WHERE course_id = p_course_id AND user_id = p_user_id;

  IF review_exists > 0 THEN
    SET err_message = 'E409|AlreadyExistsError|You have already reviewed this course.';
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = err_message;
  ELSE
    -- Insert new review
    INSERT INTO tbl_reviews (
      course_id,
      user_id,
      review,
      rating,
      created_by,
      updated_by,
      created_at,
      updated_at
    ) 
    VALUES (
      p_course_id,
      p_user_id,
      p_review,
      p_rating,
      p_user_id,
      p_user_id,
      NOW(),
      NOW()
    );

    -- Return the newly created review
    SELECT * FROM tbl_reviews 
    WHERE course_id = p_course_id AND user_id = p_user_id
    ORDER BY created_at DESC LIMIT 1;
  END IF;
END
  `);

    // Procedure: getAllReviews   ✅ (Tested)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllReviews()
      BEGIN
        DECLARE err_message VARCHAR(255);

        -- Select all reviews from tbl_reviews and order by created_at in descending order
        BEGIN
          -- Return all reviews
          SELECT
            r.*,
            u.full_name as user_full_name
          FROM tbl_reviews r
          JOIN tbl_users u ON r.user_id = u.id
          ORDER BY r.created_at DESC;
        END;
      END`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS getAllAdminReviews;`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllAdminReviews(
    IN p_course_id INT,
    IN p_rating INT,
    IN p_search_term VARCHAR(255),
    IN p_page INT,
    IN p_limit INT,
    IN p_role ENUM('partner', 'admin'),
    IN p_id INT,
    IN p_is_all BOOLEAN
)
BEGIN
    DECLARE v_offset INT DEFAULT 0;
    DECLARE v_total_count INT DEFAULT 0;
    
    -- Handle NULL parameters by setting defaults
    IF p_page IS NULL OR p_page < 1 THEN
        SET p_page = 1;
    END IF;
    
    IF p_limit IS NULL OR p_limit < 1 THEN
        SET p_limit = 10;
    END IF;
    
    -- Calculate offset for pagination
    SET v_offset = (p_page - 1) * p_limit;
    
    -- Get total count for pagination
    SELECT COUNT(*) INTO v_total_count
    FROM tbl_reviews r
    JOIN tbl_users u ON r.user_id = u.id
    JOIN tbl_courses c ON r.course_id = c.id
    WHERE 
        (p_course_id IS NULL OR r.course_id = p_course_id)
        AND (p_rating IS NULL OR r.rating >= p_rating)
        AND (p_search_term IS NULL OR p_search_term = '' OR 
             r.review LIKE CONCAT('%', p_search_term, '%') OR
             u.full_name LIKE CONCAT('%', p_search_term, '%') OR
             u.username LIKE CONCAT('%', p_search_term, '%'))
        AND (
            p_role = 'admin' 
            OR (p_role = 'partner' AND c.created_by = p_id AND c.created_by_type = 'partner')
          );
    
    IF p_is_all = TRUE THEN
      -- Return paginated results with course information
      SELECT 
          r.*,
          u.full_name as user_full_name,
          u.username as username,
          u.email as user_email,
          c.title as course_title,
          c.public_hash as course_public_hash,
          v_total_count as total_count,
          p_page as current_page,
          CEIL(v_total_count / p_limit) as total_pages
      FROM tbl_reviews r
      JOIN tbl_users u ON r.user_id = u.id
      JOIN tbl_courses c ON r.course_id = c.id
      WHERE 
          (p_course_id IS NULL OR r.course_id = p_course_id)
          AND (p_rating IS NULL OR r.rating >= p_rating)
          AND (p_search_term IS NULL OR p_search_term = '' OR 
              r.review LIKE CONCAT('%', p_search_term, '%') OR
              u.full_name LIKE CONCAT('%', p_search_term, '%') OR
              u.username LIKE CONCAT('%', p_search_term, '%'))
          AND (
              p_role = 'admin' 
              OR (p_role = 'partner' AND c.created_by = p_id AND c.created_by_type = 'partner')
            )
      ORDER BY r.created_at DESC;
    ELSE
      -- Return paginated results with course information
      SELECT 
          r.*,
          u.full_name as user_full_name,
          u.username as username,
          u.email as user_email,
          c.title as course_title,
          c.public_hash as course_public_hash,
          v_total_count as total_count,
          p_page as current_page,
          CEIL(v_total_count / p_limit) as total_pages
      FROM tbl_reviews r
      JOIN tbl_users u ON r.user_id = u.id
      JOIN tbl_courses c ON r.course_id = c.id
      WHERE 
          (p_course_id IS NULL OR r.course_id = p_course_id)
          AND (p_rating IS NULL OR r.rating >= p_rating)
          AND (p_search_term IS NULL OR p_search_term = '' OR 
              r.review LIKE CONCAT('%', p_search_term, '%') OR
              u.full_name LIKE CONCAT('%', p_search_term, '%') OR
              u.username LIKE CONCAT('%', p_search_term, '%'))
          AND (
              p_role = 'admin' 
              OR (p_role = 'partner' AND c.created_by = p_id AND c.created_by_type = 'partner')
            )
      ORDER BY r.created_at DESC
      LIMIT p_limit OFFSET v_offset;
    END IF;
END
`);

    // Procedure: getUserReview   ✅ (New)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getUserReview(
      IN p_course_id INT,
      IN p_user_id INT
    )
    BEGIN
      SELECT 
        r.*,
        u.full_name as full_name,
        u.profile_image as profile_image
      FROM tbl_reviews r
      JOIN tbl_users u ON r.user_id = u.id
      WHERE r.course_id = p_course_id AND r.user_id = p_user_id
      LIMIT 1;
    END;`);

    // Procedure: getReviewById   ✅ (Tested)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getReviewById(
  IN p_review_id INT
)
BEGIN
  DECLARE err_message VARCHAR(255);

  -- Try to fetch the review by ID
  BEGIN
    -- Select the review by the given ID
    SELECT * 
    FROM tbl_reviews
    WHERE id = p_review_id;
  END;
END;`);

    // Procedure: getReviewByCourseId    ✅ (Tested)
    await sequelize.query(`DROP PROCEDURE IF EXISTS getReviewsByCourseId;`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getReviewsByCourseId(
    IN p_public_hash VARCHAR(255),
    IN p_page INT,
    IN p_limit INT,
    IN p_exclude_user_id INT
    )
BEGIN
  DECLARE course_id INT DEFAULT NULL;
  DECLARE v_total_count INT DEFAULT 0;
  DECLARE v_offset INT DEFAULT 0;
  DECLARE v_avg_rating DECIMAL(3,1) DEFAULT 0;
  DECLARE err_message VARCHAR(255);

  -- Handle NULL parameters
  IF p_page IS NULL OR p_page < 1 THEN SET p_page = 1; END IF;
  IF p_limit IS NULL OR p_limit < 1 THEN SET p_limit = 10; END IF;
  
  SET v_offset = (p_page - 1) * p_limit;

  -- Try to find internal course ID from public_hash
  SELECT id INTO course_id FROM tbl_courses WHERE public_hash = p_public_hash;

  -- If course ID wasn't found, throw a custom error
  IF course_id IS NULL THEN
    SET err_message = 'E404|NotFoundError|Course not found';
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = err_message;
  END IF;

  -- Get total count and average rating (excluding user if specified)
  SELECT COUNT(*), COALESCE(AVG(rating), 0) 
  INTO v_total_count, v_avg_rating
  FROM tbl_reviews 
  WHERE course_id = course_id
  AND (p_exclude_user_id IS NULL OR user_id != p_exclude_user_id);

  -- Fetch reviews and join with user full name, including pagination metadata in each row
  SELECT
    r.*,
    u.full_name,
    u.profile_image,
    v_total_count as total_count,
    v_avg_rating as average_rating,
    p_page as current_page,
    CEIL(v_total_count / p_limit) as total_pages
  FROM tbl_reviews r
  JOIN tbl_users u ON r.user_id = u.id
  WHERE r.course_id = course_id
  AND (p_exclude_user_id IS NULL OR r.user_id != p_exclude_user_id)
  ORDER BY r.created_at DESC
  LIMIT p_limit OFFSET v_offset;
END`);

    // Procedure: updatereviewById  ✅ (Tested)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateReviewById(
  IN p_id INT,
  IN p_review TEXT,
  IN p_rating INT,
  IN p_user_id INT
)
BEGIN
  DECLARE review_exists INT;
  DECLARE err_message VARCHAR(255);

  -- Check if review exists
  SELECT COUNT(*) INTO review_exists FROM tbl_reviews WHERE id = p_id;

  IF review_exists = 0 THEN
    -- SET err_message = 'ReviewNotFoundError||Review not found';
      SET err_message = 'E404|NotFoundError|Review not found';
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = err_message;
  END IF;

  -- Validate rating range
  IF p_rating < 1 OR p_rating > 5 THEN
    SET err_message = 'E400|InvalidValueError|Rating must be between 1 and 5';
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = err_message;
  END IF;

  -- Update review
  UPDATE tbl_reviews
  SET
    review = p_review,
    rating = p_rating,
    updated_by = p_user_id,
    updated_at = NOW()
  WHERE id = p_id;

  -- Return updated review
  SELECT * FROM tbl_reviews WHERE id = p_id;
END;
`);

    // Procedure: deletreviewById   ✅ (Tested)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteReviewById(IN p_review_id INT)
BEGIN
  DECLARE err_message VARCHAR(255);

  -- Check if the review exists
  IF NOT EXISTS (SELECT 1 FROM tbl_reviews WHERE id = p_review_id) THEN
    -- SET err_message = 'ReviewNotFoundError||Review not found';
    SET err_message = 'E404|NotFoundError|Review not found';
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = err_message;
  END IF;

  -- Delete the review
  DELETE FROM tbl_reviews WHERE id = p_review_id;

  -- Confirm successful deletion
  SELECT 'Review deleted successfully' AS message;
END 
      `);

    console.log("✅ Review procedures created!");
  } catch (error) {
    console.error("❌ Error setting up review procedures:", error);
    throw error;
  }
};

module.exports = setupReviewProcedures;
