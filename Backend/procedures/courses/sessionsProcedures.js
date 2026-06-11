// utils/procedure/courseCategoryProcedures.js

const sequelize = require("../../config/db");

const setupSessionProcedures = async () => {
  try {
    console.log("🔄 Setting up Session procedures...");

    // Procedure: createCourseCategory
    await sequelize.query(`DROP PROCEDURE IF EXISTS createSession`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createSession(
  IN p_course_public_hash VARCHAR(255),
  IN p_title VARCHAR(200),
  IN p_is_points_rewarded_on_completion BOOLEAN,
  IN p_points_rewarded_on_completion INT,
  IN p_created_by INT,
  IN p_updated_by INT,
  IN p_min_time_in_minute INT,
  IN p_created_by_type VARCHAR(20),
  IN p_updated_by_type VARCHAR(20)
)
BEGIN
  DECLARE v_course_id INT;
  DECLARE v_next_sequence INT;
  DECLARE v_session_id BIGINT;
  DECLARE v_public_hash VARCHAR(255);
  DECLARE v_exists INT DEFAULT 0;
  DECLARE v_course_duration INT DEFAULT 0;
  DECLARE v_total_existing_minutes INT DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION

  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  -- Get course ID from public hash
  SELECT id, duration_minutes INTO v_course_id, v_course_duration
  FROM tbl_courses
  WHERE public_hash = p_course_public_hash;

  IF v_course_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|Course not found';
  END IF;

  SELECT COUNT(*) INTO v_exists
  FROM tbl_session
  WHERE course_id = v_course_id
  AND title = p_title;

  IF v_exists > 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E409|DuplicateSessionError|Session already exists in Course.',
    MYSQL_ERRNO = 1062;
  END IF;

  -- Sum of all session durations for this course
  SELECT IFNULL(SUM(min_time_in_minute), 0) INTO v_total_existing_minutes
  FROM tbl_session
  WHERE course_id = v_course_id;

  -- Check if new session exceeds course duration
  IF (v_total_existing_minutes + p_min_time_in_minute) > v_course_duration THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E400|SessionDurationExceeded|Total session duration exceeds course limit.',
    MYSQL_ERRNO = 1002;
  END IF;
  
  -- Get next sequence number
  SELECT COALESCE(MAX(sequence_no), 0) + 1 INTO v_next_sequence
  FROM tbl_session
  WHERE course_id = v_course_id;

  -- Insert new session
  INSERT INTO tbl_session (
    course_id,
    title,
    is_points_rewarded_on_completion,
    points_rewarded_on_completion,
    sequence_no,
    created_by,
    updated_by,
    min_time_in_minute,
    created_at,
    updated_at,
    created_by_type,
    updated_by_type
  ) VALUES (
    v_course_id,
    p_title,
    p_is_points_rewarded_on_completion,
    p_points_rewarded_on_completion,
    v_next_sequence,
    p_created_by,
    p_updated_by,
    p_min_time_in_minute,
    NOW(),
    NOW(),
    p_created_by_type,
    p_updated_by_type
  );

  -- Generate public hash (e.g., SHA1 of session ID)
  SET v_session_id = LAST_INSERT_ID();
  SET v_public_hash = SHA1(CONCAT('session', v_session_id));

  -- Update session with public hash
  UPDATE tbl_session
  SET public_hash = v_public_hash
  WHERE id = v_session_id;

  COMMIT;

  -- Return created session with public hash
  SELECT * FROM tbl_session WHERE id = v_session_id;
END
`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllSessions()
BEGIN
  SELECT
    s.*,
    c.id AS courseId,
    c.title AS courseTitle
  FROM tbl_session s
  JOIN tbl_courses c ON s.course_id = c.id;
END`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS getSessionByCoursePublicHash`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getSessionByCoursePublicHash(
      IN p_course_hash VARCHAR(255),
      IN p_search_term VARCHAR(255),
      IN p_createdFrom DATETIME,
      IN p_createdTo   DATETIME,
      IN p_status VARCHAR(10)      
      )
BEGIN
  DECLARE courseId INT;

  -- Get the course ID using public_hash
  SELECT id INTO courseId FROM tbl_courses WHERE public_hash = p_course_hash;

  IF courseId IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Course not found';
  ELSE
    SELECT 
      s.*
    FROM tbl_session s
    WHERE (s.course_id = courseId)
      AND (p_search_term IS NULL OR p_search_term = '' OR s.title LIKE CONCAT('%', p_search_term, '%')) 
      AND (p_status IS NULL OR p_status = 'all' OR s.status = p_status) 
      AND (p_createdFrom IS NULL OR s.created_at >= p_createdFrom)
      AND (p_createdTo IS NULL OR s.created_at < DATE_ADD(p_createdTo, INTERVAL 1 DAY))
    ORDER BY s.sequence_no ASC;
  END IF;
END`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getActiveSessionByCoursePublicHash(IN courseHash VARCHAR(255))
BEGIN
  SELECT 
    s.*
  FROM tbl_session s
  JOIN tbl_courses c ON s.course_id = c.id
  WHERE c.public_hash = courseHash
    AND s.status = 'active'
  ORDER BY s.sequence_no ASC;
END`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getSessionByPublicHash(IN sessionHash VARCHAR(255))
BEGIN
  SELECT * FROM tbl_session
  WHERE public_hash = sessionHash
  LIMIT 1;
END`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS updateSessionByPublicHash`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateSessionByPublicHash(
  IN sessionHash VARCHAR(255),
  IN newTitle VARCHAR(255),
  IN p_is_points_rewarded_on_completion BOOLEAN,
  IN p_points_rewarded_on_completion INT,
  IN newMinTimeInMinute INT,
  IN p_updated_by INT,
  IN p_updated_by_type VARCHAR(20)
)
BEGIN

  DECLARE v_courseId INT;
  DECLARE v_exists INT DEFAULT 0;
  DECLARE v_course_duration INT DEFAULT 0;
  DECLARE v_total_existing_minutes INT DEFAULT 0;

  SELECT course_id INTO v_courseId FROM tbl_session WHERE public_hash = sessionHash;

  SELECT duration_minutes INTO v_course_duration
  FROM tbl_courses
  WHERE id = v_courseId;

  IF newTitle IS NOT NULL THEN
    
    SELECT COUNT(*) INTO v_exists
    FROM tbl_session
    WHERE course_id = v_courseId
    AND title = newTitle AND public_hash != sessionHash;

    IF v_exists > 0 THEN
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'E409|DuplicateSessionError|Session already exists in Course.',
      MYSQL_ERRNO = 1062;
    END IF;
  END IF;

  IF newMinTimeInMinute IS NOT NULL THEN
    -- Sum of all session durations for this course
    SELECT IFNULL(SUM(min_time_in_minute), 0) INTO v_total_existing_minutes
    FROM tbl_session
    WHERE course_id = v_courseId AND public_hash != sessionHash;

    -- Check if new session exceeds course duration
    IF (v_total_existing_minutes + newMinTimeInMinute) > v_course_duration THEN
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'E400|SessionDurationExceeded|Total session duration exceeds course limit.',
      MYSQL_ERRNO = 1002;
    END IF;
  END IF;

  UPDATE tbl_session
  SET
    title = IFNULL(newTitle, title),
    is_points_rewarded_on_completion = IFNULL(p_is_points_rewarded_on_completion, is_points_rewarded_on_completion),
    points_rewarded_on_completion = IFNULL(p_points_rewarded_on_completion, points_rewarded_on_completion),
    min_time_in_minute = IFNULL(newMinTimeInMinute, min_time_in_minute),
    updated_by = p_updated_by,
    updated_by_type = p_updated_by_type
  WHERE public_hash = sessionHash;

  SELECT * FROM tbl_session WHERE public_hash = sessionHash;
END`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateSessionSequenceProcedure(IN p_session_ids JSON)
BEGIN
    DECLARE v_length INT DEFAULT JSON_LENGTH(p_session_ids);
    DECLARE i INT DEFAULT 0;
    DECLARE v_session_id INT;
    DECLARE v_min_sequence INT DEFAULT 9999999;
    DECLARE v_current_sequence INT;
    
    -- Find minimum sequence using a loop (much simpler)
    WHILE i < v_length DO
        SET v_session_id = JSON_UNQUOTE(JSON_EXTRACT(p_session_ids, CONCAT('$[', i, ']')));
        
        -- Get current sequence for this session
        SELECT sequence_no INTO v_current_sequence 
        FROM tbl_session 
        WHERE id = v_session_id;
        
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
        SET v_session_id = JSON_UNQUOTE(JSON_EXTRACT(p_session_ids, CONCAT('$[', i, ']')));
        
        UPDATE tbl_session
        SET sequence_no = v_min_sequence + i
        WHERE id = v_session_id;
        
        SET i = i + 1;
    END WHILE;
END`);

    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateSessionStatusById(
  IN sessionId INT,
  IN newStatus ENUM('active', 'inactive')
)
BEGIN
  IF newStatus = 'active' THEN
    CALL validateCourseActivation('session', sessionId, 'inactive');
  END IF;

  UPDATE tbl_session
  SET status = newStatus
  WHERE id = sessionId;

  CALL handleCourseEntityStatus('session', sessionId);

  SELECT * FROM tbl_session WHERE id = sessionId;
END`);

    console.log("✅ Course Category procedures created!");
  } catch (error) {
    console.error("❌ Error setting up Session procedures:", error);
    throw error;
  }
};

module.exports = setupSessionProcedures;
