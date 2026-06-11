// utils/procedure/courseProcedures.js

const sequelize = require("../../config/db");

const setupCoursesProcedures = async () => {
  try {
    console.log("🔄 Setting up Session procedures...");

    // Status Handler
    await sequelize.query(`DROP PROCEDURE IF EXISTS handleCourseEntityStatus`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS handleCourseEntityStatus (
    IN p_entity_type ENUM('topic','module','session','course'),
    IN p_id INT
)
BEGIN
    DECLARE v_module_id INT;
    DECLARE v_session_id INT;
    DECLARE v_course_id INT;
    DECLARE v_active_count INT;

    -- 1 Topic → Check parent Module
    IF p_entity_type = 'topic' THEN
        SELECT module_id INTO v_module_id FROM tbl_topics WHERE id = p_id;
        
        SELECT COUNT(*) INTO v_active_count 
        FROM tbl_topics WHERE module_id = v_module_id AND status = 'active';

        IF v_active_count = 0 THEN
            UPDATE tbl_modules SET status = 'inactive', updated_at = NOW() WHERE id = v_module_id;
            SET p_entity_type = 'module';
            SET p_id = v_module_id;
        ELSE
            SET v_module_id = NULL;
        END IF;
    END IF;

    -- 2 Module → Check parent Session
    IF p_entity_type = 'module' AND v_module_id IS NULL THEN
        SET v_module_id = p_id;
    END IF;

    IF v_module_id IS NOT NULL THEN
        SELECT session_id, course_id INTO v_session_id, v_course_id 
        FROM tbl_modules WHERE id = v_module_id;

        IF v_session_id IS NOT NULL THEN
            SELECT COUNT(*) INTO v_active_count 
            FROM tbl_modules WHERE session_id = v_session_id AND status = 'active';

            IF v_active_count = 0 THEN
                UPDATE tbl_session SET status = 'inactive', updated_at = NOW() WHERE id = v_session_id;
                SET p_entity_type = 'session';
                SET p_id = v_session_id;
            ELSE
                SET v_session_id = NULL;
            END IF;
        END IF;
    END IF;

    -- 3 Session → Check parent Course
    IF p_entity_type = 'session' AND v_session_id IS NULL THEN
        SET v_session_id = p_id;
    END IF;

    IF v_session_id IS NOT NULL THEN
        SELECT course_id INTO v_course_id FROM tbl_session WHERE id = v_session_id;

        SELECT COUNT(*) INTO v_active_count 
        FROM tbl_session WHERE course_id = v_course_id AND status = 'active';

        IF v_active_count = 0 THEN
            UPDATE tbl_courses SET status = 'draft', updated_at = NOW() WHERE id = v_course_id;
        END IF;
    END IF;

END`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS validateCourseActivation`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS validateCourseActivation (
    IN p_entity_type ENUM('topic','module','session','course'),
    IN p_id INT,
    IN current_status ENUM('active','inactive')
)
BEGIN
    DECLARE v_total_active INT DEFAULT 0;

    -- Only validate when trying to activate
    IF current_status = 'inactive' THEN
        
        -- 1 Module → must have at least one active Topic
        IF p_entity_type = 'module' THEN
            SELECT COUNT(*) INTO v_total_active 
            FROM tbl_topics 
            WHERE module_id = p_id AND status = 'active';

            IF v_total_active = 0 THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'E400|ValidationError|Cannot activate module without at least one active topic';
            END IF;
        END IF;

        -- 2 Session → must have at least one active Module
        IF p_entity_type = 'session' THEN
            SELECT COUNT(*) INTO v_total_active 
            FROM tbl_modules 
            WHERE session_id = p_id AND status = 'active';

            IF v_total_active = 0 THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'E400|ValidationError|Cannot activate session without at least one active module';
            END IF;
        END IF;

        -- 3 Course → must have at least one active Session
        IF p_entity_type = 'course' THEN
            SELECT COUNT(*) INTO v_total_active 
            FROM tbl_session 
            WHERE course_id = p_id AND status = 'active';

            IF v_total_active = 0 THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'E400|ValidationError|Cannot activate course without at least one active session';
            END IF;
        END IF;

    END IF;

END`);

    // Procedure: createCourse
    await sequelize.query(`DROP PROCEDURE IF EXISTS createCourseProcedure`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createCourseProcedure (
        IN p_title VARCHAR(255),
        IN p_description LONGTEXT,
        IN p_category_id INT,
        IN p_price DECIMAL(10,2),
        IN p_discount INT,
        IN p_duration_minutes INT, -- ✅ updated
        IN p_expiry_days INT,
        IN p_what_you_will_learn JSON,
        IN p_is_points_enrollable BOOLEAN,
        IN p_points_to_enroll INT,
        IN p_is_points_rewarded BOOLEAN,
        IN p_points_rewarded INT,
        IN p_is_points_rewarded_on_completion BOOLEAN,
        IN p_points_rewarded_on_completion INT,
        IN p_is_copy_paste_allowed BOOLEAN,
        IN p_is_course_trending BOOLEAN,
        IN p_meta_title VARCHAR(255),
        IN p_meta_keyword TEXT,
        IN p_meta_description LONGTEXT,
        IN p_seo_image VARCHAR(255),
        IN p_seo_image_alt VARCHAR(255),
        IN p_seo_canonical VARCHAR(255),
        IN p_og_title VARCHAR(255),
        IN p_og_description LONGTEXT,
        IN p_og_image VARCHAR(255),
        IN p_og_image_alt VARCHAR(255),
        IN p_prerequisites JSON,
        IN p_hashtags JSON,
        IN p_skill_development JSON,
        IN p_status VARCHAR(20),
        IN p_thumbnail VARCHAR(255),
        IN p_preview_video JSON,
        IN p_min_access_minutes DECIMAL(10,2), -- ✅ updated
        IN p_max_access_minutes DECIMAL(10,2), -- ✅ updated
        IN p_generated_by INT,
        IN p_created_by INT,
        IN p_updated_by INT,
        IN p_created_by_type VARCHAR(20),
        IN p_updated_by_type VARCHAR(20)
      )
      BEGIN
        DECLARE v_next_sequence INT DEFAULT 1;
        DECLARE v_course_id INT;
      DECLARE v_exists INT DEFAULT 0;

      SELECT COUNT(*) INTO v_exists
      FROM tbl_courses
      WHERE title = p_title;

      IF v_exists > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E409|DuplicateCourseError|Course already exists.',
        MYSQL_ERRNO = 1062;
      ELSE
        SELECT IFNULL(MAX(sequence), 0) + 1 INTO v_next_sequence FROM tbl_courses;
      
        INSERT INTO tbl_courses (
          title,
          description,
          category_id,
          price,
          discount,
          duration_minutes, -- ✅ updated
          expiry_days,
          what_you_will_learn,
          prerequisites,
          hashtags,
          skill_development,
          sequence,
          status,
          thumbnail,
          preview_video,
          is_points_enrollable,
          points_to_enroll,
          is_points_rewarded,
          points_rewarded,
          is_points_rewarded_on_completion,
          points_rewarded_on_completion,
          is_copy_paste_allowed,
          is_course_trending,
          meta_title,
          meta_keyword,
          meta_description,
          seo_image,
          seo_image_alt,
          seo_canonical,
          og_title,
          og_description,
          og_image,
          og_image_alt,
          min_access_minutes, -- ✅ updated
          max_access_minutes, -- ✅ updated
          generated_by,
          created_by,
          updated_by,
          created_by_type,
          updated_by_type,
          created_at,
          updated_at
        )
        VALUES (
          p_title,
          p_description,
          p_category_id,
          p_price,
          p_discount,
          p_duration_minutes,
          p_expiry_days,
          p_what_you_will_learn,
          p_prerequisites,
          p_hashtags,
          p_skill_development,
          v_next_sequence,
          p_status,
          p_thumbnail,
          p_preview_video,
          p_is_points_enrollable,
          p_points_to_enroll,
          p_is_points_rewarded,
          p_points_rewarded,
          p_is_points_rewarded_on_completion,
          p_points_rewarded_on_completion,
          p_is_copy_paste_allowed,
          p_is_course_trending,
          p_meta_title,
          p_meta_keyword,
          p_meta_description,
          p_seo_image,
          p_seo_image_alt,
          p_seo_canonical,
          p_og_title,
          p_og_description,
          p_og_image,
          p_og_image_alt,
          p_min_access_minutes,
          p_max_access_minutes,
          p_generated_by,
          p_created_by,
          p_updated_by,
          p_created_by_type,
          p_updated_by_type,
          NOW(),
          NOW()
        );
      
        SET v_course_id = LAST_INSERT_ID();
      
        UPDATE tbl_courses
        SET public_hash = MD5(CONCAT('course_', v_course_id))
        WHERE id = v_course_id;
      
        SELECT * FROM tbl_courses WHERE id = v_course_id;
        END IF;
      END;`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS getAllCourses`);
    await sequelize.query(`CREATE PROCEDURE getAllCourses(
        IN p_search_term VARCHAR(255),
        IN p_categoryId INT,
        IN p_limit INT,
        IN p_offset INT,
        IN p_is_all BOOLEAN
      )
BEGIN
    DECLARE v_limit BIGINT;
    DECLARE v_offset BIGINT;

    IF p_is_all = TRUE THEN
        SET v_limit = 9223372036854775807;
        SET v_offset = 0;
    ELSE
        SET v_limit = p_limit;
        SET v_offset = p_offset;
    END IF;

    
    SELECT COUNT(DISTINCT c.id) AS total_count
    FROM tbl_courses c
    INNER JOIN tbl_course_categories cat 
        ON c.category_id = cat.id
        AND c.status = 'published'
        AND cat.status = 'active'
    WHERE (p_search_term IS NULL OR p_search_term = '' OR c.title LIKE CONCAT('%', p_search_term, '%')) 
      AND (p_categoryId IS NULL OR c.category_id = p_categoryId);

    SELECT 
        c.id,
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
        c.skill_development,
        c.embedding,
        c.status,
        c.created_by,
        c.created_by_type,
        c.updated_by,
        c.updated_by_type,
        c.created_at,
        c.updated_at,
        
        -- Review stats
        (SELECT COUNT(*) FROM tbl_reviews WHERE course_id = c.id) AS review_count,
        (SELECT COALESCE(AVG(rating), 0) FROM tbl_reviews WHERE course_id = c.id) AS average_rating,

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
        p.logo AS partner_logo,
        p.status AS partner_status

      FROM tbl_courses c
    INNER JOIN tbl_course_categories cat 
        ON c.category_id = cat.id
        AND c.status = 'published'
        AND cat.status = 'active'
    LEFT JOIN tbl_partners p 
        ON c.created_by_type = 'partner'
        AND c.created_by = p.id
    WHERE (p_search_term IS NULL OR p_search_term = '' OR c.title LIKE CONCAT('%', p_search_term, '%')) 
      AND (p_categoryId IS NULL OR c.category_id = p_categoryId)
      LIMIT v_limit OFFSET v_offset;
END;`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS getAllTrendingCourses`);
    await sequelize.query(`CREATE PROCEDURE getAllTrendingCourses(
        IN p_search_term VARCHAR(255),
        IN p_categoryId INT,
        IN p_limit INT,
        IN p_offset INT,
        IN p_is_all BOOLEAN
      )
BEGIN
    DECLARE v_limit BIGINT;
    DECLARE v_offset BIGINT;

    IF p_is_all = TRUE THEN
        SET v_limit = 9223372036854775807;
        SET v_offset = 0;
    ELSE
        SET v_limit = p_limit;
        SET v_offset = p_offset;
    END IF;

    SELECT COUNT(DISTINCT c.id) AS total_count
    FROM tbl_courses c
    INNER JOIN tbl_course_categories cat 
        ON c.category_id = cat.id
        AND c.status = 'published'
        AND cat.status = 'active'
    WHERE (c.is_course_trending = TRUE)
      AND (p_search_term IS NULL OR p_search_term = '' OR c.title LIKE CONCAT('%', p_search_term, '%')) 
      AND (p_categoryId IS NULL OR c.category_id = p_categoryId);

    SELECT 
        c.id,
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
        c.skill_development,
        c.is_course_trending,
        c.status,
        c.created_by,
        c.created_by_type,
        c.updated_by,
        c.updated_by_type,
        c.created_at,
        c.updated_at,
        
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
        p.logo AS partner_logo,
        p.status AS partner_status

      FROM tbl_courses c
    INNER JOIN tbl_course_categories cat 
        ON c.category_id = cat.id
        AND c.status = 'published'
        AND cat.status = 'active'
    LEFT JOIN tbl_partners p 
        ON c.created_by_type = 'partner'
        AND c.created_by = p.id
    WHERE (c.is_course_trending = TRUE)
      AND (p_search_term IS NULL OR p_search_term = '' OR c.title LIKE CONCAT('%', p_search_term, '%')) 
      AND (p_categoryId IS NULL OR c.category_id = p_categoryId)
      LIMIT v_limit OFFSET v_offset;
END;`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS getAllCoursesForAdmin`);
    await sequelize.query(`CREATE PROCEDURE getAllCoursesForAdmin(
    IN p_roleId INT,
    IN p_role VARCHAR(50),
    IN p_created_by VARCHAR(10),
    IN p_createdById INT,
    IN p_search_term VARCHAR(255),
    IN p_createdFrom DATETIME,
    IN p_createdTo   DATETIME,
    IN p_limit INT,
    IN p_offset INT,
    IN p_is_all BOOLEAN
)
BEGIN
    DECLARE v_limit BIGINT;
    DECLARE v_offset BIGINT;

    IF p_is_all = TRUE THEN
        SET v_limit = 9223372036854775807;
        SET v_offset = 0;
    ELSE
        SET v_limit = p_limit;
        SET v_offset = p_offset;
    END IF;

    SELECT COUNT(DISTINCT c.id) AS total_count
    FROM tbl_courses c
    LEFT JOIN tbl_partners p
      ON p.id = c.created_by
    AND c.created_by_type = 'partner'
    AND p_role = 'partner'
    WHERE
      (p_role = 'admin'
        OR ( 
          p_role = 'partner' 
          AND (
            (c.created_by_type = 'partner' AND c.created_by = p_roleId)
            OR (c.generated_by = p.user_id AND p.id = p_roleId)
          )
        )
      ) 
      AND (p_search_term IS NULL OR p_search_term = '' OR c.title LIKE CONCAT('%', p_search_term, '%')) 
      AND (p_created_by IS NULL OR p_created_by = '' OR c.created_by_type = p_created_by) 
      AND (p_createdById IS NULL OR c.created_by = p_createdById)
      AND (p_createdFrom IS NULL OR c.created_at >= p_createdFrom)
      AND (p_createdTo IS NULL OR c.created_at <= p_createdTo);

    IF p_role = 'admin' THEN
        SELECT 
            c.id,
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
            c.skill_development,
            c.embedding,
            c.status,
            c.generated_by,
            c.created_by,
            c.created_by_type,
            c.updated_by,
            c.updated_by_type,
            c.created_at,
            c.updated_at
        FROM tbl_courses c
        LEFT JOIN tbl_course_categories cat ON c.category_id = cat.id
        WHERE
          (p_search_term IS NULL OR p_search_term = '' OR c.title LIKE CONCAT('%', p_search_term, '%'))
          AND (p_created_by IS NULL OR p_created_by = '' OR c.created_by_type = p_created_by)
          AND (p_createdById IS NULL OR c.created_by = p_createdById)
          AND (p_createdFrom IS NULL OR c.created_at >= p_createdFrom)
          AND (p_createdTo IS NULL OR c.created_at <= p_createdTo)
        LIMIT v_limit OFFSET v_offset;

    ELSE
        SELECT 
            c.id,
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
            c.skill_development,
            c.embedding,
            c.status,
            c.generated_by,
            c.created_by,
            c.created_by_type,
            c.updated_by,
            c.updated_by_type,
            c.created_at,
            c.updated_at
        FROM tbl_courses c
        LEFT JOIN tbl_course_categories cat ON c.category_id = cat.id
        LEFT JOIN tbl_partners p ON p.id = p_roleId
        WHERE 
          ((c.created_by_type = 'partner' AND c.created_by = p_roleId)
          OR (c.generated_by = p.user_id AND p.id = p_roleId))
          AND (p_search_term IS NULL OR p_search_term = '' OR c.title LIKE CONCAT('%', p_search_term, '%'))
          AND (p_createdFrom IS NULL OR c.created_at >= p_createdFrom)
          AND (p_createdTo IS NULL OR c.created_at <= p_createdTo)
        LIMIT v_limit OFFSET v_offset;
    END IF;
END`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS getAllCoursesName`);
    await sequelize.query(`CREATE PROCEDURE getAllCoursesName(
    IN p_search_term VARCHAR(255)
)
BEGIN
        SELECT 
            c.id,
            c.title
        FROM tbl_courses c
        WHERE
          (p_search_term IS NULL OR p_search_term = '' OR c.title LIKE CONCAT('%', p_search_term, '%'));
END`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS getCoursesGeneratedByUser`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCoursesGeneratedByUser(
  IN p_user_id INT
)
BEGIN
  IF EXISTS (
    SELECT 1 FROM tbl_courses WHERE generated_by = p_user_id
  ) THEN
    SELECT 
      NULL AS user_hash, -- Not relevant here (since it’s from enrollments)
      NULL AS status,    -- Not from enrollments either
      c.id AS course_id,
      c.public_hash,
      c.title,
      c.description,
      c.thumbnail,
      c.price,
      c.duration_minutes,
      c.category_id,
      cat.category AS category_name
    FROM tbl_courses c
    LEFT JOIN tbl_course_categories cat ON c.category_id = cat.id
    WHERE c.generated_by = p_user_id;
  ELSE
    SELECT 
      NULL AS user_hash,
      NULL AS status,
      NULL AS course_id,
      NULL AS public_hash,
      NULL AS title,
      NULL AS description,
      NULL AS thumbnail,
      NULL AS price,
      NULL AS duration_minutes,
      NULL AS category_id,
      NULL AS category_name
    WHERE 1 = 0; -- Safely returns zero rows, but schema is retained
  END IF;
END`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS getCourseById`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCourseById(IN course_hash VARCHAR(255))
BEGIN
    SELECT 
        c.id,
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
        c.meta_title,
        c.meta_keyword,
        c.meta_description,
        c.seo_image,
        c.seo_image_alt,
        c.seo_canonical,
        c.og_title,
        c.og_description,
        c.og_image,
        c.og_image_alt,
        c.prerequisites,
        c.hashtags,
        c.skill_development,
        c.embedding,
        c.status,
        c.max_access_minutes,
        c.min_access_minutes,
        c.is_points_rewarded,
        c.points_rewarded,
        c.is_points_rewarded_on_completion,
        c.points_rewarded_on_completion,
        c.is_copy_paste_allowed,
        c.is_course_trending,
        c.generated_by,
        c.created_by,
        c.created_by_type,
        c.updated_by,
        c.updated_by_type,
        c.created_at,
        c.updated_at,
        p.name AS partner_name
    FROM 
        tbl_courses c
    LEFT JOIN 
        tbl_course_categories cat ON c.category_id = cat.id
    LEFT JOIN
        tbl_partners p ON c.created_by_type = 'partner' AND c.created_by = p.id
    WHERE 
        c.public_hash = course_hash;
END`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS updateCourseDetails`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateCourseDetails(
  IN public_hash_in VARCHAR(255),
  IN title_in VARCHAR(255),
  IN description_in LONGTEXT,
  IN category_id_in INT,
  IN price_in DECIMAL(10,2),
  IN discount_in INT,
  IN duration_minutes_in INT,
  IN expiry_days_in INT,
  IN what_you_will_learn_in JSON,
  IN is_points_enrollable_in BOOLEAN,
  IN points_to_enroll_in INT,
  IN is_points_rewarded_in BOOLEAN,
  IN points_rewarded_in INT,
  IN is_points_rewarded_on_completion_in BOOLEAN,
  IN points_rewarded_on_completion_in INT,
  IN is_copy_paste_allowed_in BOOLEAN,
  IN is_course_trending_in BOOLEAN,
  IN meta_title_in VARCHAR(255),
  IN meta_keyword_in TEXT,
  IN meta_description_in LONGTEXT,
  IN seo_image_in VARCHAR(255),
  IN seo_image_alt_in VARCHAR(255),
  IN seo_canonical_in VARCHAR(255),
  IN og_title_in VARCHAR(255),
  IN og_description_in LONGTEXT,
  IN og_image_in VARCHAR(255),
  IN og_image_alt_in VARCHAR(255),
  IN prerequisites_in JSON,
  IN thumbnail_in VARCHAR(255),
  IN preview_video_in JSON,
  IN hashtags_in JSON,
  IN skill_development_in JSON,
  IN status_in ENUM('draft','pending','approved','published','rejected','private'),
  IN min_access_minutes_in DECIMAL(10,2),
  IN max_access_minutes_in DECIMAL(10,2),
  IN updated_by_in INT,
  IN updated_by_type_in ENUM('admin','partner')
)
BEGIN
  DECLARE courseId INT;
  DECLARE v_exists INT DEFAULT 0;

  SELECT id INTO courseId FROM tbl_courses WHERE public_hash = public_hash_in;

  IF courseId IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Course not found';
  END IF;

  IF title_in IS NOT NULL THEN
      SELECT COUNT(*) INTO v_exists
      FROM tbl_courses
      WHERE title = title_in AND public_hash != public_hash_in;

      IF v_exists > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E409|DuplicateCourseError|Course already exists.',
        MYSQL_ERRNO = 1062;
      END IF;
  END IF;

  UPDATE tbl_courses
  SET
    title = title_in,
    description = description_in,
    category_id = category_id_in,
    price = price_in,
    discount = IFNULL(discount_in, 0),
    duration_minutes = duration_minutes_in,
    expiry_days = expiry_days_in,
    what_you_will_learn = what_you_will_learn_in,
    is_points_enrollable = is_points_enrollable_in,
    points_to_enroll = points_to_enroll_in,
    is_points_rewarded = is_points_rewarded_in,
    points_rewarded = points_rewarded_in,
    is_points_rewarded_on_completion = is_points_rewarded_on_completion_in,
    points_rewarded_on_completion = points_rewarded_on_completion_in,
    is_copy_paste_allowed = is_copy_paste_allowed_in,
    is_course_trending = is_course_trending_in,
    meta_title = meta_title_in,
    meta_keyword = meta_keyword_in,
    meta_description = meta_description_in,
    seo_image = seo_image_in,
    seo_image_alt = seo_image_alt_in,
    seo_canonical = seo_canonical_in,
    og_title = og_title_in,
    og_description = og_description_in,
    og_image = og_image_in,
    og_image_alt = og_image_alt_in,
    prerequisites = prerequisites_in,
    thumbnail = thumbnail_in,
    preview_video = preview_video_in,
    hashtags = hashtags_in,
    skill_development = skill_development_in,
    status = status_in,
    min_access_minutes = min_access_minutes_in,
    max_access_minutes = max_access_minutes_in,
    updated_by = updated_by_in,
    updated_by_type = updated_by_type_in,
    updated_at = NOW()
  WHERE public_hash = public_hash_in;

  SELECT * FROM tbl_courses WHERE public_hash = public_hash_in;
END`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteCourseById(IN course_id INT)
BEGIN
  DECLARE courseExists INT;

  SELECT COUNT(*) INTO courseExists FROM tbl_courses WHERE id = course_id;

  IF courseExists = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Course not found';
  END IF;

  DELETE FROM tbl_courses WHERE id = course_id;
END`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateCourseStatus(
  IN course_identifier VARCHAR(255),
  IN new_status ENUM('draft', 'pending', 'approved', 'published', 'rejected', 'private')
)
BEGIN
  DECLARE courseId INT;

  -- Try to find by id first
  SELECT id INTO courseId FROM tbl_courses
  WHERE id = course_identifier OR public_hash = course_identifier
  LIMIT 1;

  IF courseId IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Course not found';
  END IF;

  -- Validate status
  IF NOT FIND_IN_SET(new_status, 'draft,pending,approved,published,rejected,private') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|InvalidValueError|Invalid status value';
  END IF;

  IF new_status = 'published' THEN
    CALL validateCourseActivation('course', courseId, 'inactive');
  END IF;

  -- Update status
  UPDATE tbl_courses
  SET status = new_status
  WHERE id = courseId;
END`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateCourseSequence(IN p_course_ids JSON)
BEGIN
  DECLARE i INT DEFAULT 0;
  DECLARE total INT;
  DECLARE v_id INT;

  SET total = JSON_LENGTH(p_course_ids);

  WHILE i < total DO
    SET v_id = JSON_UNQUOTE(JSON_EXTRACT(p_course_ids, CONCAT('$[', i, ']')));

    UPDATE tbl_courses
    SET sequence = i + 1
    WHERE id = v_id;

    SET i = i + 1;
  END WHILE;
END`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS getCourseByCourseId`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCourseByCourseId(IN course_id INT)
BEGIN
    SELECT 
        c.id,
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
        c.embedding,
        c.status,
        CASE 
            WHEN c.max_access_minutes IS NOT NULL THEN ROUND(c.max_access_minutes / 60, 2)
            ELSE NULL
        END AS max_access_minutes,
        CASE 
            WHEN c.min_access_minutes IS NOT NULL THEN ROUND(c.min_access_minutes / 60, 2)
            ELSE NULL
        END AS min_access_minutes,
        c.created_by,
        c.created_by_type,
        c.updated_by,
        c.updated_by_type,
        c.created_at,
        c.updated_at
    FROM 
        tbl_courses c
    LEFT JOIN 
        tbl_course_categories cat ON c.category_id = cat.id
    WHERE 
        c.id = course_id;
END`);

    // Add the missing getFilteredCourses procedure
    await sequelize.query(`DROP PROCEDURE IF EXISTS getFilteredCourses`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getFilteredCourses(
      IN p_user_id INT,
      IN p_creator_type VARCHAR(20)
    )
    BEGIN
      -- If filtering by partner's own courses
      IF p_user_id IS NOT NULL AND p_creator_type = 'partner' THEN
        SELECT 
            c.id,
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
            c.embedding,
            c.status,
            c.created_by,
            c.created_by_type,
            c.updated_by,
            c.updated_by_type,
            c.created_at,
            c.updated_at
        FROM tbl_courses c
        LEFT JOIN tbl_course_categories cat ON c.category_id = cat.id
        WHERE c.created_by = p_user_id AND c.created_by_type = 'partner';
      
      -- If filtering by creator type only (admin created or partner created)
      ELSEIF p_creator_type IN ('admin', 'partner') THEN
        SELECT 
            c.id,
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
            c.embedding,
            c.status,
            c.created_by,
            c.created_by_type,
            c.updated_by,
            c.updated_by_type,
            c.created_at,
            c.updated_at
        FROM tbl_courses c
        LEFT JOIN tbl_course_categories cat ON c.category_id = cat.id
        WHERE c.created_by_type = p_creator_type;
      
      -- Fallback to returning all courses
      ELSE
        SELECT 
            c.id,
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
            c.embedding,
            c.status,
            c.created_by,
            c.created_by_type,
            c.updated_by,
            c.updated_by_type,
            c.created_at,
            c.updated_at
        FROM tbl_courses c
        LEFT JOIN tbl_course_categories cat ON c.category_id = cat.id;
      END IF;
    END`);

    console.log("✅ Course procedures created!");
  } catch (error) {
    console.error("❌ Error setting up Session procedures:", error);
    throw error;
  }
};

module.exports = setupCoursesProcedures;
