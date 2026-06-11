const sequelize = require("../../config/db");

const setupWishlistProcedures = async () => {
    try {
        console.log("🔄 Setting up Wishlist procedures...");

        //Add to wishlist   (✅ Tested)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS addToWishlist(
  IN p_course_id INT,
  IN p_user_id INT
)
BEGIN
  DECLARE wishlist_exists INT DEFAULT 0;
  DECLARE err_message VARCHAR(255);

  -- Check if the course is already in the wishlist
  SELECT COUNT(*) INTO wishlist_exists
  FROM tbl_wishlist
  WHERE course_id = p_course_id AND user_id = p_user_id;

  IF wishlist_exists > 0 THEN
    SET err_message = 'E409|AlreadyExistsError|Course is already in the wishlist.';
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = err_message;
  ELSE
    -- Insert into wishlist
    INSERT INTO tbl_wishlist (
      course_id,
      user_id,
      created_by,
      created_by_type,
      updated_by,
      updated_by_type,
      created_at,
      updated_at
    )
    VALUES (
      p_course_id,
      p_user_id,
      p_user_id,
      'admin',
      p_user_id,
      'admin',
      NOW(),
      NOW()
    );

    -- Return the newly created wishlist item
    SELECT * FROM tbl_wishlist
    WHERE course_id = p_course_id AND user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
END;
`);

        //Remove the wishlist  (✅ Tested)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS removeFromWishlist(
  IN p_course_id INT,
  IN p_user_id INT
)
BEGIN
  DECLARE item_exists INT DEFAULT 0;
  DECLARE err_message VARCHAR(255);

  -- Check if the wishlist item exists
  SELECT COUNT(*) INTO item_exists 
  FROM tbl_wishlist 
  WHERE course_id = p_course_id AND user_id = p_user_id;

  IF item_exists = 0 THEN
    -- SET err_message = 'WishlistNotFoundError||Wishlist item not found';
    SET err_message = 'E404|NotFoundError|Wishlist item not found';
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = err_message;
  END IF;

  -- Remove the wishlist item
  DELETE FROM tbl_wishlist 
  WHERE course_id = p_course_id AND user_id = p_user_id;

  -- Return confirmation
  SELECT 'Course removed from wishlist' AS message;
END;
`);

        //Get wishlist by userId    (✅ Tested)
        await sequelize.query("DROP PROCEDURE IF EXISTS getWishlistByUserId");
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getWishlistByUserId(
  IN p_user_id INT,
  IN p_limit INT,
  IN p_offset INT,
  IN p_is_all BOOLEAN
)
BEGIN
  DECLARE user_exists INT DEFAULT 0;
  DECLARE err_message VARCHAR(255);
  DECLARE v_limit BIGINT;
  DECLARE v_offset BIGINT;

  IF p_is_all = TRUE THEN
      SET v_limit = 9223372036854775807;
      SET v_offset = 0;
  ELSE
      SET v_limit = p_limit;
      SET v_offset = p_offset;
  END IF;

  -- Optional: check if user exists
  SELECT COUNT(*) INTO user_exists FROM tbl_users WHERE id = p_user_id;

  IF user_exists = 0 THEN
    -- SET err_message = 'UserNotFoundError||User not found';
    SET err_message = 'E404|NotFoundError|User not found';
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = err_message;
  END IF;

  SELECT COUNT(DISTINCT w.id) AS total_count
  FROM tbl_wishlist w;

  -- Return all wishlist items for the user
  SELECT 
    w.id AS wishlist_id,
    w.created_at AS wishlist_created_at,

    c.id AS course_id,
    c.public_hash,
    c.title,
    c.description,
    c.thumbnail,
    c.preview_video,
    c.price,
    c.discount,
    c.duration_minutes,
    c.expiry_days,
    c.status,

    cat.id AS category_id,
    cat.category AS category_name,

    p.id AS partner_id,
    p.partner_type,
    p.name AS partner_name,
    p.email AS partner_email,
    p.phone AS partner_phone,
    p.organization_type,
    p.contact_person_name,
    p.contact_person_email,
    p.contact_person_phone,
    p.website,
    p.description AS partner_description,
    p.logo AS partner_logo

  FROM tbl_wishlist w
  JOIN tbl_courses c ON c.id = w.course_id
  JOIN tbl_course_categories cat ON cat.id = c.category_id
  LEFT JOIN tbl_partners p 
    ON c.created_by_type = 'partner'
    AND c.created_by = p.id
  WHERE w.user_id = p_user_id
  ORDER BY w.created_at DESC
  LIMIT v_limit OFFSET v_offset;
END;`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getWishlistWithCoursesByUserId (
            IN p_user_id INT
          )
          BEGIN
            DECLARE user_exists INT DEFAULT 0;
            DECLARE err_message VARCHAR(255);

            -- Check if user exists
            SELECT COUNT(*) INTO user_exists FROM tbl_users WHERE id = p_user_id;

            IF user_exists = 0 THEN
              SET err_message = 'E404|NotFoundError|User not found';
              SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = err_message;
            END IF;

            -- Get wishlist with full course details
            SELECT 
              w.id AS wishlist_id,
              w.user_id,
              w.course_id,
              w.created_at AS wishlist_createdAt,
              w.updated_at AS wishlist_updatedAt,

              c.id AS course_id,
              c.public_hash,
              c.sequence,
              c.title,
              c.description,
              c.category_id,
              c.thumbnail,
              c.preview_video,
              c.price,
              c.discount,
              c.duration_minutes,
              c.expiry_days,
              c.what_you_will_learn,
              c.is_points_enrollable,
              c.points_to_enroll,
              c.prerequisites,
              c.hashtags,
              c.status,
              c.min_access_minutes,
              c.max_access_minutes,
              c.created_at AS course_createdAt,
              c.updated_at AS course_updatedAt

            FROM tbl_wishlist w
            INNER JOIN tbl_courses c ON w.course_id = c.id
            WHERE w.user_id = p_user_id
            ORDER BY w.created_at DESC;
          END`);

        console.log("✅ Wishlist procedures created!");
    } catch (error) {
        console.error("❌ Error setting up wishlist procedures:", error);
        throw error;
    }
};

module.exports = setupWishlistProcedures;
