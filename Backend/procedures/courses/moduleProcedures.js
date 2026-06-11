// utils/procedure/courseCategoryProcedures.js

const sequelize = require("../../config/db");

const setupModuleProcedures = async () => {
  try {
    console.log("🔄 Setting up module procedures...");

    await sequelize.query("DROP PROCEDURE IF EXISTS createModuleProcedure")
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createModuleProcedure (
    IN in_course_id VARCHAR(255),
    IN in_session_id VARCHAR(255),
    IN in_title VARCHAR(255),
    IN in_duration_minutes INT,
    IN in_created_by INT,
    IN in_updated_by INT,
    IN in_created_by_type ENUM('admin', 'partner'),
    IN in_updated_by_type ENUM('admin', 'partner')
  )
  BEGIN
    DECLARE v_error_message VARCHAR(255);
    DECLARE next_sequence INT DEFAULT 1;
    DECLARE total_duration INT DEFAULT 0;
    DECLARE course_duration INT;
    DECLARE course_db_id INT;
    DECLARE session_db_id INT;
    DECLARE module_exists INT;
    DECLARE new_module_id INT;
    DECLARE v_session_duration INT DEFAULT 0;
    DECLARE v_total_existing_minutes INT DEFAULT 0;
    
    -- Get course ID from public_hash if passed that way
    SELECT id, duration_minutes INTO course_db_id, course_duration
    FROM tbl_courses
    WHERE public_hash = in_course_id
    LIMIT 1;  -- Add LIMIT 1 to ensure single row
    
    IF course_db_id IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Course not found';
    END IF;
    
    -- Get session ID
    SELECT id, min_time_in_minute INTO session_db_id, v_session_duration FROM tbl_session
    WHERE public_hash = in_session_id
    LIMIT 1;  -- Add LIMIT 1 to ensure single row
    
    IF session_db_id IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Session not found';
    END IF;
    
    -- Check for duplicate module (same course, session and title)
    SELECT COUNT(*) INTO module_exists
    FROM tbl_modules
    WHERE course_id = course_db_id
      AND session_id = session_db_id
      AND title = in_title;
      
    IF module_exists > 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|DuplicateError|Module with same title already exists in this course and session';
    END IF;
    
    -- Sum of all module durations for this course
    SELECT IFNULL(SUM(duration_minutes), 0) INTO v_total_existing_minutes
    FROM tbl_modules
    WHERE session_id = session_db_id;

    -- Check if new module exceeds session duration
    IF (v_total_existing_minutes + in_duration_minutes) > v_session_duration THEN
      SET v_error_message = CONCAT('E400|LimitExceededError|Limit exceeded: Total duration of modules (', v_total_existing_minutes + in_duration_minutes, ' minutes) exceeds session limit of ', v_session_duration, ' minutes.');
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = v_error_message;
    END IF;

    -- Get highest sequence
    SELECT IFNULL(MAX(sequence_no), 0) + 1 INTO next_sequence
    FROM tbl_modules
    WHERE course_id = course_db_id;
    
    -- Get total duration so far
    -- SELECT IFNULL(SUM(duration_minutes), 0) INTO total_duration
    -- FROM tbl_modules
    -- WHERE course_id = course_db_id;
    
    -- IF (total_duration + in_duration_minutes) > course_duration THEN
    --   SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|LimitExceededError|Module duration exceeds course limit';
    -- END IF;
    
    -- Insert module
    INSERT INTO tbl_modules (
      public_hash,
      course_id,
      session_id,
      title,
      sequence_no,
      duration_minutes,
      created_by,
      created_by_type,
      updated_by,
      updated_by_type,
      created_at,
      updated_at
    )
    VALUES (
      UUID(), -- temp public hash
      course_db_id,
      session_db_id,
      in_title,
      next_sequence,
      in_duration_minutes,
      in_created_by,
      in_created_by_type,
      in_updated_by,
      in_updated_by_type,
      NOW(),
      NOW()
    );
    
    -- Store the inserted ID
    SET new_module_id = LAST_INSERT_ID();
    
    -- Update public_hash using the stored ID
    UPDATE tbl_modules
    SET public_hash = CONCAT('mod_', new_module_id)
    WHERE id = new_module_id;
    
    -- Return created module (single result set)
    SELECT * FROM tbl_modules WHERE id = new_module_id;
END`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getModulesByCourseId(IN p_course_hash VARCHAR(255))
BEGIN
    DECLARE courseId INT;

    -- Get the course ID using public_hash
    SELECT id INTO courseId FROM tbl_courses WHERE public_hash = p_course_hash;

    -- If no course found, return nothing
    IF courseId IS NULL THEN
        SELECT 'Course not found' AS error;
    ELSE
        -- Fetch modules
        SELECT
            m.id,
            m.public_hash,
            m.title,
            m.sequence_no,
            m.duration_minutes,
            m.status,
            m.session_id,
            m.created_by,
            m.created_by_type,
            m.updated_by,
            m.updated_by_type,
            m.created_at,
            m.updated_at
        FROM
            tbl_modules m
        WHERE
            m.course_id = courseId
        ORDER BY
            m.sequence_no ASC;
    END IF;
END`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS getModulesBySessionId`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getModulesBySessionId(
      IN p_session_hash VARCHAR(255),
      IN p_search_term VARCHAR(255),
      IN p_createdFrom DATETIME,
      IN p_createdTo   DATETIME,
      IN p_status VARCHAR(10)      
      )
BEGIN
    DECLARE sessionId BIGINT;

    -- Get session ID from public_hash
    SELECT id INTO sessionId FROM tbl_session WHERE public_hash = p_session_hash;

    -- If session not found
    IF sessionId IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Session not found';
    ELSE
        -- Return modules by session ID
        SELECT
            m.id,
            m.public_hash,
            m.title,
            m.sequence_no,
            m.duration_minutes,
            m.status,
            m.course_id,
            m.created_by,
            m.created_by_type,
            m.updated_by,
            m.updated_by_type,
            m.created_at,
            m.updated_at
        FROM
            tbl_modules m
        WHERE (m.session_id = sessionId)
          AND (p_search_term IS NULL OR p_search_term = '' OR m.title LIKE CONCAT('%', p_search_term, '%')) 
          AND (p_status IS NULL OR p_status = 'all' OR m.status = p_status) 
          AND (p_createdFrom IS NULL OR m.created_at >= p_createdFrom)
          AND (p_createdTo IS NULL OR m.created_at < DATE_ADD(p_createdTo, INTERVAL 1 DAY))
        ORDER BY m.sequence_no ASC;
    END IF;
END`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getModuleById(IN p_module_hash VARCHAR(255))
BEGIN
    DECLARE modId INT;

    -- Get the module ID using public_hash
    SELECT id INTO modId FROM tbl_modules WHERE public_hash = p_module_hash;

    -- If no module found, return an error message
    IF modId IS NULL THEN
        SELECT 'Module not found' AS error;
    ELSE
        -- Return the module details
        SELECT
            id,
            public_hash,
            course_id,
            session_id,
            title,
            sequence_no,
            duration_minutes,
            status,
            created_by,
            created_by_type,
            updated_by,
            updated_by_type,
            created_at,
            updated_at
        FROM tbl_modules
        WHERE id = modId;
    END IF;
END;`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateModuleProcedure (
  IN p_module_hash VARCHAR(255),
  IN p_title TEXT,
  IN p_duration_minutes INT,
  IN p_updated_by INT,
  IN p_updated_by_type ENUM('admin', 'partner')
)
BEGIN
  DECLARE v_module_id INT;
  DECLARE v_course_id INT;
  DECLARE v_session_id INT;
  DECLARE v_course_duration INT;
  DECLARE v_session_duration INT;
  DECLARE v_total_duration INT;
  DECLARE v_new_version INT;
  DECLARE v_error_message TEXT;
  DECLARE v_module_exists INT;

  -- Get module by public_hash
  SELECT id, course_id, session_id INTO v_module_id, v_course_id, v_session_id
  FROM tbl_modules
  WHERE public_hash = p_module_hash;

   -- Get session Duration
  SELECT min_time_in_minute INTO v_session_duration FROM tbl_session
  WHERE id = v_session_id
  LIMIT 1;

  IF v_module_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'E404|NotFoundError|Module not found';
  END IF;

  -- Get course details
  SELECT duration_minutes INTO v_course_duration
  FROM tbl_courses
  WHERE id = v_course_id;

  IF v_course_duration IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'E404|NotFoundError|Associated course not found';
  END IF;

  -- Check for duplicate module if title is being updated
  IF p_title IS NOT NULL THEN
    SELECT COUNT(*) INTO v_module_exists
    FROM tbl_modules
    WHERE course_id = v_course_id 
      AND session_id = v_session_id 
      AND title = p_title
      AND id != v_module_id;

    IF v_module_exists > 0 THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E400|DuplicateError|Another module with same title already exists in this course and session';
    END IF;
  END IF;
  
  IF p_duration_minutes IS NOT NULL THEN
    -- Total duration of other modules (excluding current one)
    SELECT COALESCE(SUM(duration_minutes), 0) INTO v_total_duration
    FROM tbl_modules
    WHERE session_id = v_session_id AND id != v_module_id;

    SET v_total_duration = v_total_duration + IFNULL(p_duration_minutes, 0);

    IF v_total_duration > v_session_duration THEN
      SET v_error_message = CONCAT('E400|LimitExceededError|Limit exceeded: Total duration of modules (', v_total_duration, ' minutes) exceeds session limit of ', v_session_duration, ' minutes.');
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = v_error_message;
    END IF;
  END IF;

    -- Update the module directly
    UPDATE tbl_modules
    SET
      title = IFNULL(p_title, title),
      duration_minutes = IFNULL(p_duration_minutes, duration_minutes),
      updated_by = p_updated_by
    WHERE id = v_module_id;
END;
`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS updateModuleSequenceProcedure`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateModuleSequenceProcedure(IN p_module_ids JSON)
BEGIN
    DECLARE v_length INT DEFAULT JSON_LENGTH(p_module_ids);
    DECLARE i INT DEFAULT 0;
    DECLARE v_module_id INT;
    DECLARE v_min_sequence INT DEFAULT 9999999;
    DECLARE v_current_sequence INT;
    
    -- Find minimum sequence using a loop (much simpler)
    WHILE i < v_length DO
        SET v_module_id = JSON_UNQUOTE(JSON_EXTRACT(p_module_ids, CONCAT('$[', i, ']')));
        
        -- Get current sequence for this module
        SELECT sequence_no INTO v_current_sequence 
        FROM tbl_modules 
        WHERE id = v_module_id;
        
        -- Update minimum if current is smaller
        IF v_current_sequence < v_min_sequence THEN
            SET v_min_sequence = v_current_sequence;
        END IF;
        
        SET i = i + 1;
    END WHILE;
    
    -- Reset counter for update loop
    SET i = 0;
    
    -- Update sequences starting from the minimum sequence found
    WHILE i < v_length DO
        SET v_module_id = JSON_UNQUOTE(JSON_EXTRACT(p_module_ids, CONCAT('$[', i, ']')));
        
        UPDATE tbl_modules
        SET sequence_no = v_min_sequence + i
        WHERE id = v_module_id;
        
        SET i = i + 1;
    END WHILE;
END`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateModuleStatusProcedure(
    IN p_module_id INT,
    IN p_status ENUM('active', 'inactive')
)
BEGIN
    -- Check if the module exists
    DECLARE v_module_count INT;
    
    SELECT COUNT(*) INTO v_module_count FROM tbl_modules WHERE id = p_module_id;
    
    IF v_module_count = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Module not found';
    ELSE
        IF p_status = 'active' THEN
          CALL validateCourseActivation('module', p_module_id, 'inactive');
        END IF;
        
        -- Update the module's status
        UPDATE tbl_modules
        SET status = p_status
        WHERE id = p_module_id;

        CALL handleCourseEntityStatus('module', p_module_id);
    END IF;
END`);


    console.log("✅ module procedures created!");
  } catch (error) {
    console.error("❌ Error setting up Module procedures:", error);
    throw error;
  }
};

module.exports = setupModuleProcedures;
