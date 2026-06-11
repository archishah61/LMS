const sequelize = require("../../config/db");

const setupProgressTrackingProcedures = async () => {
  try {
    console.log("🔄 Setting up Progress Tracking procedures...");

    // Procedure: checkTopicCompletion
    // Update the stored procedure to ensure it returns data in the expected format
    await sequelize.query(`DROP PROCEDURE IF EXISTS checkTopicCompletion`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS checkTopicCompletion(
  IN p_user_id INT,
  IN p_topic_id INT
)
BEGIN
  DECLARE v_enrollment_id INT;
  DECLARE v_course_id INT;
  DECLARE v_is_completed BOOLEAN DEFAULT FALSE;
  DECLARE v_all_attachments_completed BOOLEAN DEFAULT TRUE;
  
  -- Get course_id from the topic's module
  SELECT m.course_id INTO v_course_id
  FROM tbl_topics t
  JOIN tbl_modules m ON t.module_id = m.id
  WHERE t.id = p_topic_id AND t.status = 'active';
  
  -- Check if topic exists
  IF v_course_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|Topic not found.';
  END IF;
  
  -- Get enrollment ID
  SELECT id INTO v_enrollment_id
  FROM tbl_enrollments
  WHERE user_id = p_user_id AND course_id = v_course_id;
  
  -- Check if enrollment exists
  IF v_enrollment_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|Enrollment not found for this user.';
  END IF;
  
  -- Check if the topic is completed
  SELECT COUNT(*) > 0 INTO v_is_completed
  FROM tbl_progress_tracking
  WHERE enrollment_id = v_enrollment_id 
    AND topic_id = p_topic_id
    AND completion_status = 'completed';
  
  -- Check if there are any topic content items (quizzes or assignments)
  SELECT COUNT(*) INTO @content_count
  FROM tbl_topic_content
  WHERE topic_id = p_topic_id;
  
  -- If there's no content, we just return the completion status
  IF @content_count = 0 THEN
    SELECT 
      TRUE AS success,
      v_is_completed AS topicCompleted,
      TRUE AS attachmentsCompleted;  -- No attachments, so technically completed
  ELSE
    -- Check if all quizzes are completed and passed
    SELECT EXISTS (
      SELECT 1
      FROM tbl_topic_content tc
      LEFT JOIN tbl_quiz_completion qc ON tc.quiz_id = qc.quizId AND qc.userId = p_user_id AND qc.isCompleted = TRUE AND qc.status = 'Passed'
      WHERE tc.topic_id = p_topic_id AND tc.quiz_id IS NOT NULL AND qc.id IS NULL
    ) INTO @has_incomplete_quiz;
    
    -- Check if all assignments are completed
    SELECT EXISTS (
      SELECT 1
      FROM tbl_topic_content tc
      LEFT JOIN tbl_assignment_completion ac ON tc.assignment_id = ac.assignmentId AND ac.userId = p_user_id AND ac.isCompleted = TRUE
      WHERE tc.topic_id = p_topic_id AND tc.assignment_id IS NOT NULL AND ac.id IS NULL
    ) INTO @has_incomplete_assignment;
    
    SET v_all_attachments_completed = NOT (@has_incomplete_quiz OR @has_incomplete_assignment);
    
    -- Return the results
    SELECT 
      TRUE AS success,
      v_is_completed AS topicCompleted,
      v_all_attachments_completed AS attachmentsCompleted;
  END IF;
END`);

    // Procedure: checkSlideCompletion
    await sequelize.query(`DROP PROCEDURE IF EXISTS checkSlideCompletion`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS checkSlideCompletion(
  IN p_user_id INT,
  IN p_topic_id INT
)
BEGIN
  DECLARE v_enrollment_id INT;
  DECLARE v_course_id INT;
  DECLARE v_topic_content_type VARCHAR(50);
  DECLARE v_progress_tracking_id INT;

  -- Check if topic exists and get its content type
  SELECT t.content_type, m.course_id INTO v_topic_content_type, v_course_id
  FROM tbl_topics t
  JOIN tbl_modules m ON t.module_id = m.id
  WHERE t.id = p_topic_id
  LIMIT 1;

  -- Error if topic not found
  IF v_topic_content_type IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|Topic not found.';
  END IF;
  
  -- Error if topic is not slide type
  IF v_topic_content_type != 'slide' THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E400|BadRequestError|Topic is not a slide-type content.';
  END IF;

  -- Get enrollment ID
  SELECT id INTO v_enrollment_id
  FROM tbl_enrollments
  WHERE user_id = p_user_id AND course_id = v_course_id
  LIMIT 1;

  -- Check if enrollment exists
  IF v_enrollment_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|Enrollment not found for this user.';
  END IF;

  -- Get progress tracking ID
  SELECT id INTO v_progress_tracking_id
  FROM tbl_progress_tracking
  WHERE enrollment_id = v_enrollment_id AND topic_id = p_topic_id
  LIMIT 1;

  -- If no progress tracking exists, return empty array
  IF v_progress_tracking_id IS NULL THEN
    SELECT JSON_ARRAY() AS completedSlides;
  ELSE
    -- Get completed slides from slide progress table
    SELECT JSON_ARRAYAGG(sp.slide_id) AS completedSlides
    FROM tbl_slide_progress sp
    JOIN tbl_multi_slides ms ON sp.slide_id = ms.id
    WHERE sp.progress_tracking_id = v_progress_tracking_id
    AND ms.topic_id = p_topic_id
    AND sp.completed = TRUE;
  END IF;
END;`);

    // Procedure: checkModuleCompletion
    await sequelize.query(`DROP PROCEDURE IF EXISTS checkModuleCompletion`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS checkModuleCompletion(
  IN p_user_id INT,
  IN p_module_id INT
)
this_proc: BEGIN
  DECLARE v_enrollment_id INT;
  DECLARE v_course_id INT;
  DECLARE v_module_exists INT DEFAULT 0;
  DECLARE v_module_completed BOOLEAN DEFAULT FALSE;
  DECLARE v_total_topics INT DEFAULT 0;
  DECLARE v_completed_topics INT DEFAULT 0;
  DECLARE v_total_quizzes INT DEFAULT 0;
  DECLARE v_completed_quizzes INT DEFAULT 0;
  DECLARE v_all_quizzes_passed BOOLEAN DEFAULT TRUE;
  DECLARE v_module_progress_completed BOOLEAN DEFAULT FALSE;

  -- Check if module exists
  SELECT COUNT(*) INTO v_module_exists
  FROM tbl_modules
  WHERE id = p_module_id AND status = 'active';

  IF v_module_exists = 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|Module not found.';
  END IF;

  -- Get course_id from module
  SELECT course_id INTO v_course_id
  FROM tbl_modules
  WHERE id = p_module_id
  LIMIT 1;

  -- Get enrollment ID
  SELECT id INTO v_enrollment_id
  FROM tbl_enrollments
  WHERE user_id = p_user_id AND course_id = v_course_id;

  -- Check if enrollment exists
  IF v_enrollment_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|Enrollment not found for this user.';
  END IF;

  -- Get all topics in the module
  SELECT COUNT(*) INTO v_total_topics
  FROM tbl_topics
  WHERE module_id = p_module_id AND status = 'active';
  
  -- Get completed topics count
  SELECT COUNT(*) INTO v_completed_topics
  FROM tbl_progress_tracking
  WHERE enrollment_id = v_enrollment_id
    AND module_id = p_module_id
    AND topic_id IS NOT NULL
    AND completion_status = 'completed';
  
  -- Check if all quizzes are completed and passed
  SELECT COUNT(*) INTO v_total_quizzes
  FROM tbl_quiz
  WHERE module_id = p_module_id AND status = 'active';

  IF v_total_quizzes > 0 THEN
    -- Count how many quizzes the user has attempted
    SELECT COUNT(*) INTO v_completed_quizzes
    FROM tbl_quiz q
    JOIN tbl_quiz_completion qc ON q.id = qc.quizId
    WHERE q.module_id = p_module_id 
      AND q.status = 'active'
      AND qc.userId = p_user_id
      AND qc.isCompleted = TRUE;
    
    -- Check if any quiz has failed status
    SELECT EXISTS (
      SELECT 1
      FROM tbl_quiz q
      JOIN tbl_quiz_completion qc ON q.id = qc.quizId
      WHERE q.module_id = p_module_id 
        AND q.status = 'active'
        AND qc.userId = p_user_id
        AND qc.status = 'Failed'
    ) INTO @any_failed;
    
    -- All quizzes must be attempted and none failed
    SET v_all_quizzes_passed = (v_completed_quizzes = v_total_quizzes AND @any_failed = 0);
    
    -- If any quiz isn't passed, module is not completed
    IF NOT v_all_quizzes_passed THEN
      SELECT TRUE AS success, FALSE AS completed;
      LEAVE this_proc; -- Exit the procedure early
    END IF;
  END IF;

  -- Check if module is marked as completed in progress tracking
  SELECT EXISTS (
    SELECT 1
    FROM tbl_progress_tracking
    WHERE enrollment_id = v_enrollment_id
      AND module_id = p_module_id
      AND topic_id IS NULL
      AND completion_status = 'completed'
  ) INTO v_module_progress_completed;
  
  -- Check if all topics are completed (necessary for module completion)
  SET v_module_completed = (v_completed_topics = v_total_topics AND v_all_quizzes_passed);
  
  -- Module is completed if all topics are completed, all quizzes are passed, and module is marked as completed
  SELECT 
    TRUE AS success,
    (v_module_completed OR v_module_progress_completed) AS completed;
END;`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS getAccessibleModules`);
    await sequelize.query(`CREATE PROCEDURE getAccessibleModules(
  IN p_user_id INT,
  IN p_course_id INT
)
BEGIN
  DECLARE v_enrollment_id INT;
  DECLARE v_enrollment_exists BOOLEAN DEFAULT FALSE;

  -- Check if enrollment exists
  SELECT id INTO v_enrollment_id
  FROM tbl_enrollments
  WHERE user_id = p_user_id AND course_id = p_course_id
  LIMIT 1;

  SET v_enrollment_exists = (v_enrollment_id IS NOT NULL);

  IF v_enrollment_exists = FALSE THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|Enrollment not found for this user';
  END IF;

  -- Create temporary table with session_sequence_no
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_accessible_modules (
    id INT,
    public_hash VARCHAR(255),
    course_id INT,
    session_id BIGINT,
    session_sequence_no INT,
    title VARCHAR(255),
    sequence_no INT,
    duration_minutes INT,
    status VARCHAR(20),
    created_by INT,
    created_by_type VARCHAR(20),
    updated_by INT,
    updated_by_type VARCHAR(20),
    created_at DATETIME,
    updated_at DATETIME,
    isAccessible BOOLEAN
  );

  -- Fill the temporary table with modules + session sequence number
  INSERT INTO temp_accessible_modules (
    id, public_hash, course_id, session_id, session_sequence_no,
    title, sequence_no, duration_minutes, status, created_by, created_by_type,
    updated_by, updated_by_type, created_at, updated_at, isAccessible
  )
  SELECT 
    m.id, 
    m.public_hash, 
    m.course_id, 
    m.session_id,
    s.sequence_no AS session_sequence_no,
    m.title, 
    m.sequence_no, 
    m.duration_minutes, 
    m.status, 
    m.created_by, 
    m.created_by_type, 
    m.updated_by, 
    m.updated_by_type, 
    m.created_at, 
    m.updated_at,
    CASE
      WHEN m.sequence_no = 1 THEN TRUE
      ELSE FALSE
    END
  FROM tbl_modules m
  JOIN tbl_session s ON m.session_id = s.id
  WHERE m.course_id = p_course_id
    AND EXISTS (
      SELECT 1 
      FROM tbl_student_accessible_data sad 
      WHERE sad.enrollment_id = v_enrollment_id 
        AND sad.course_id = p_course_id
        AND JSON_CONTAINS(sad.module_ids, CAST(m.id AS JSON))
    )
    ORDER BY s.sequence_no ASC, m.sequence_no ASC;

  -- Process module accessibility
  BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE current_module_id INT;
    DECLARE current_sequence INT;
    DECLARE previous_module_completed BOOLEAN DEFAULT TRUE;
    DECLARE module_cur CURSOR FOR 
      SELECT id, sequence_no FROM temp_accessible_modules ORDER BY session_sequence_no ASC, sequence_no ASC;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN module_cur;
    process_loop: LOOP
      FETCH module_cur INTO current_module_id, current_sequence;
      IF done THEN
        LEAVE process_loop;
      END IF;

      IF current_sequence > 1 THEN
        IF previous_module_completed = TRUE THEN
          UPDATE temp_accessible_modules 
          SET isAccessible = TRUE 
          WHERE id = current_module_id;
        END IF;
      END IF;

      SELECT COUNT(*) INTO @total_topics
      FROM tbl_topics
      WHERE module_id = current_module_id AND status = 'active';
      
      SELECT COUNT(*) INTO @completed_topics
      FROM tbl_progress_tracking
      WHERE enrollment_id = v_enrollment_id 
        AND module_id = current_module_id
        AND topic_id IS NOT NULL
        AND completion_status = 'completed';
      
      SET @topics_completed = (@total_topics > 0 AND @completed_topics = @total_topics);
      
      SELECT EXISTS (
        SELECT 1 
        FROM tbl_progress_tracking 
        WHERE enrollment_id = v_enrollment_id 
          AND module_id = current_module_id 
          AND topic_id IS NULL
          AND completion_status = 'completed'
      ) INTO @module_marked_completed;

      SELECT COUNT(*) INTO @total_quizzes
      FROM tbl_quiz
      WHERE module_id = current_module_id AND status = 'active';
      
      IF @total_quizzes = 0 THEN
        SET @quizzes_passed = TRUE;
      ELSE
        SELECT EXISTS (
          SELECT 1
          FROM tbl_quiz q
          JOIN tbl_quiz_completion qc ON q.id = qc.quizId
          WHERE q.module_id = current_module_id
            AND q.status = 'active'
            AND qc.userId = p_user_id
            AND LOWER(qc.status) = 'failed'
        ) INTO @has_failed_quizzes;
        
        SELECT COUNT(*) INTO @attempted_quizzes
        FROM tbl_quiz q
        JOIN tbl_quiz_completion qc ON q.id = qc.quizId
        WHERE q.module_id = current_module_id
          AND q.status = 'active'
          AND qc.userId = p_user_id
          AND qc.isCompleted = TRUE;
          
        SET @quizzes_passed = (@attempted_quizzes = @total_quizzes AND @has_failed_quizzes = 0);
      END IF;

      SET @module_completed = (@topics_completed AND @quizzes_passed) OR @module_marked_completed;

      SET previous_module_completed = @module_completed;
    END LOOP;

    CLOSE module_cur;
  END;

  -- Return ordered by session sequence first
  SELECT TRUE AS success, (
  SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
      'id', id,
      'public_hash', public_hash,
      'course_id', course_id,
      'session_id', session_id,
      'title', title,
      'sequence_no', sequence_no,
      'duration_hours', duration_minutes,
      'status', status,
      'created_by', created_by,
      'created_by_type', created_by_type,
      'updated_by', updated_by,
      'updated_by_type', updated_by_type,
      'created_at', created_at,
      'updated_at', updated_at,
      'isAccessible', isAccessible,
      'dataValues', JSON_OBJECT(
        'id', id,
        'public_hash', public_hash,
        'course_id', course_id,
        'session_id', session_id,
        'title', title,
        'sequence_no', sequence_no,
        'duration_hours', duration_minutes,
        'status', status,
        'created_by', created_by,
        'created_by_type', created_by_type,
        'updated_by', updated_by,
        'updated_by_type', updated_by_type,
        'created_at', created_at,
        'updated_at', updated_at
      )
    )
  )
  FROM (
    SELECT * 
    FROM temp_accessible_modules
    ORDER BY session_sequence_no ASC, sequence_no ASC
  ) AS ordered_modules
) AS modules;

  DROP TEMPORARY TABLE IF EXISTS temp_accessible_modules;
END`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS isTopicFullyCompleted`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS isTopicFullyCompleted(
      IN p_user_id INT,
      IN p_topic_id INT,
      IN p_enrollment_id INT
    )
    this_proc: BEGIN
      DECLARE v_topic_completed BOOLEAN DEFAULT FALSE;
      DECLARE v_all_requirements_met BOOLEAN DEFAULT TRUE;
      
      -- Check if the topic itself is completed
      SELECT EXISTS (
        SELECT 1
        FROM tbl_progress_tracking
        WHERE enrollment_id = p_enrollment_id
          AND topic_id = p_topic_id
          AND completion_status = 'completed'
      ) INTO v_topic_completed;
      
      -- If topic is not completed, return FALSE
      IF NOT v_topic_completed THEN
        SELECT FALSE AS is_fully_completed;
        LEAVE this_proc;
      END IF;
      
      -- Check if there are any associated quizzes and assignments
      SELECT COUNT(*) INTO @content_count
      FROM tbl_topic_content
      WHERE topic_id = p_topic_id;
      
      -- If there's no additional content, just return the topic completion status
      IF @content_count = 0 THEN
        SELECT TRUE AS is_fully_completed;
        LEAVE this_proc;
      END IF;
      
      -- Check all quizzes - must be completed with "Passed" status
      SELECT EXISTS (
        SELECT 1
        FROM tbl_topic_content tc
        LEFT JOIN tbl_quiz_completion qc ON tc.quiz_id = qc.quizId AND qc.userId = p_user_id AND qc.isCompleted = TRUE AND qc.status = 'Passed'
        WHERE tc.topic_id = p_topic_id AND tc.quiz_id IS NOT NULL AND qc.id IS NULL
      ) INTO @has_incomplete_quiz;
      
      -- If any quiz is incomplete, set flag to FALSE
      IF @has_incomplete_quiz THEN
        SET v_all_requirements_met = FALSE;
      END IF;
      
      -- Check all assignments - must be completed
      SELECT EXISTS (
        SELECT 1
        FROM tbl_topic_content tc
        LEFT JOIN tbl_assignment_completion ac ON tc.assignment_id = ac.assignmentId AND ac.userId = p_user_id AND ac.isCompleted = TRUE
        WHERE tc.topic_id = p_topic_id AND tc.assignment_id IS NOT NULL AND ac.id IS NULL
      ) INTO @has_incomplete_assignment;
      
      -- If any assignment is incomplete, set flag to FALSE
      IF @has_incomplete_assignment THEN
        SET v_all_requirements_met = FALSE;
      END IF;
      
      -- Return the final result
      SELECT v_all_requirements_met AS is_fully_completed;
    END;`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS completeContent`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS completeContent(
      IN p_user_id INT,
      IN p_topic_id INT,
      IN p_slide_id INT
    )
    BEGIN
      DECLARE v_enrollment_id INT;
      DECLARE v_module_id INT;
      DECLARE v_course_id INT;
      DECLARE v_content_type VARCHAR(50);
      DECLARE v_total_slides INT;
      DECLARE v_completed_slides INT;
      DECLARE v_progress_exists BOOLEAN DEFAULT FALSE;
      DECLARE v_progress_id INT;
      DECLARE v_slide_progress_exists BOOLEAN DEFAULT FALSE;
      DECLARE v_slide_progress_id INT;
      DECLARE v_module_progress_exists BOOLEAN DEFAULT FALSE;
      DECLARE v_module_progress_id INT;
      DECLARE v_updated_status VARCHAR(20);
      DECLARE v_total_time_spent INT DEFAULT 0;
      DECLARE v_slide_completion_type VARCHAR(20);
      DECLARE v_total_topics INT;
      DECLARE v_completed_topics INT;
      DECLARE v_topic_status VARCHAR(20);
      DECLARE v_module_status VARCHAR(20);
      
      -- Find the topic and get its module (only if topic is active)
      SELECT module_id, content_type, status INTO v_module_id, v_content_type, v_topic_status
      FROM tbl_topics
      WHERE id = p_topic_id;
      
      IF v_module_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Topic not found';
      END IF;
      
      -- Check if topic is active
      IF v_topic_status != 'active' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E400|ValidationError|Topic is not active';
      END IF;
      
      -- Get course ID from module and check if module is active
      SELECT course_id, status INTO v_course_id, v_module_status
      FROM tbl_modules
      WHERE id = v_module_id;
      
      -- Check if module is active
      IF v_module_status != 'active' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E400|ValidationError|Module is not active';
      END IF;
      
      -- Find enrollment
      SELECT id INTO v_enrollment_id
      FROM tbl_enrollments
      WHERE user_id = p_user_id AND course_id = v_course_id
      LIMIT 1;
      
      IF v_enrollment_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Enrollment not found for this user';
      END IF;
      
      -- Check if progress tracking exists for this topic
      SELECT id INTO v_progress_id
      FROM tbl_progress_tracking
      WHERE enrollment_id = v_enrollment_id AND topic_id = p_topic_id
      LIMIT 1;
      
      SET v_progress_exists = (v_progress_id IS NOT NULL);
      
      -- Create or update progress tracking
      IF v_progress_exists = FALSE THEN
        -- Create new progress tracking
        INSERT INTO tbl_progress_tracking 
          (enrollment_id, module_id, topic_id, completion_status, time_spent, last_accessed, created_by, updated_by, created_at, updated_at)
        VALUES 
          (v_enrollment_id, v_module_id, p_topic_id, 'in_progress', 0, NOW(), p_user_id, p_user_id, NOW(), NOW());
        
        SELECT LAST_INSERT_ID() INTO v_progress_id;
      ELSE
        -- Check if the topic was previously completed
        SELECT completion_status INTO v_updated_status
        FROM tbl_progress_tracking
        WHERE id = v_progress_id;
        
        -- If it was completed, increment revision count
        IF v_updated_status = 'completed' THEN
          UPDATE tbl_progress_tracking
          SET revision_count = revision_count + 1
          WHERE id = v_progress_id;
        END IF;
      END IF;
      
      -- Handle completion based on content type
      IF v_content_type = 'slide' THEN
        IF p_slide_id IS NULL THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'E400|MissingFieldError|Slide ID is required for slide content type';
        END IF;
        
        -- Check if slide progress exists
        SELECT id INTO v_slide_progress_id
        FROM tbl_slide_progress
        WHERE progress_tracking_id = v_progress_id AND slide_id = p_slide_id
        LIMIT 1;
        
        SET v_slide_progress_exists = (v_slide_progress_id IS NOT NULL);
        
        -- Create or update slide progress
        IF v_slide_progress_exists = FALSE THEN
          -- Get slide completion type
          SELECT completion_type INTO v_slide_completion_type
          FROM tbl_multi_slides
          WHERE id = p_slide_id;
          
          -- Create new slide progress
          INSERT INTO tbl_slide_progress
            (progress_tracking_id, slide_id, time_spent, completed, created_at, updated_at)
          VALUES
            (v_progress_id, p_slide_id, 0, TRUE, NOW(), NOW());
        ELSE
          -- Update existing slide progress
          UPDATE tbl_slide_progress
          SET 
            completed = TRUE,
            updated_at = NOW()
          WHERE id = v_slide_progress_id;
        END IF;
        
        -- Count total and completed slides (only active slides)
        SELECT COUNT(*) INTO v_total_slides
        FROM tbl_multi_slides
        WHERE topic_id = p_topic_id;
        
        SELECT COUNT(*) INTO v_completed_slides
        FROM tbl_slide_progress sp
        JOIN tbl_multi_slides ms ON sp.slide_id = ms.id
        WHERE sp.progress_tracking_id = v_progress_id 
          AND sp.completed = TRUE;
        
        -- Calculate total time spent from timer-based slides (only active slides)
        SELECT IFNULL(SUM(sp.time_spent), 0) INTO v_total_time_spent
        FROM tbl_slide_progress sp
        JOIN tbl_multi_slides ms ON sp.slide_id = ms.id
        WHERE sp.progress_tracking_id = v_progress_id 
          AND ms.completion_type = 'timer';
        
        -- Determine updated status
        IF v_completed_slides = 0 THEN
          SET v_updated_status = 'not_started';
        ELSEIF v_completed_slides < v_total_slides THEN
          SET v_updated_status = 'in_progress';
        ELSE
          SET v_updated_status = 'completed';
        END IF;
        
        -- Update progress tracking
        UPDATE tbl_progress_tracking
        SET 
          completion_status = v_updated_status,
          time_spent = v_total_time_spent,
          last_accessed = NOW(),
          completed_at = IF(v_updated_status = 'completed', NOW(), NULL),
          updated_by = p_user_id,
          updated_at = NOW()
        WHERE id = v_progress_id;
      ELSE
        -- For non-slide content types, mark the topic as completed directly
        UPDATE tbl_progress_tracking
        SET 
          completion_status = 'completed',
          completed_at = NOW(),
          last_accessed = NOW(),
          updated_by = p_user_id,
          updated_at = NOW()
        WHERE id = v_progress_id;
        
        SET v_completed_slides = v_total_slides; -- Equivalent to marking all slides as completed
      END IF;
      
      -- Check if all active topics in the module are completed
      SELECT COUNT(*) INTO v_total_topics
      FROM tbl_topics
      WHERE module_id = v_module_id AND status = 'active';
      
      SELECT COUNT(*) INTO v_completed_topics
      FROM tbl_progress_tracking pt
      JOIN tbl_topics t ON pt.topic_id = t.id
      WHERE pt.enrollment_id = v_enrollment_id
        AND pt.module_id = v_module_id
        AND pt.topic_id IS NOT NULL
        AND pt.completion_status = 'completed'
        AND t.status = 'active';
      
      -- Check if module progress exists
      SELECT id INTO v_module_progress_id
      FROM tbl_progress_tracking
      WHERE enrollment_id = v_enrollment_id
        AND module_id = v_module_id
        AND topic_id IS NULL
      LIMIT 1;
      
      SET v_module_progress_exists = (v_module_progress_id IS NOT NULL);
      
      -- Update module progress if all active topics are completed
      IF v_total_topics = v_completed_topics THEN
        IF v_module_progress_exists = FALSE THEN
          -- Create module progress
          INSERT INTO tbl_progress_tracking
            (enrollment_id, module_id, topic_id, completion_status, completed_at, created_by, updated_by, created_at, updated_at)
          VALUES
            (v_enrollment_id, v_module_id, NULL, 'completed', NOW(), p_user_id, p_user_id, NOW(), NOW());
        ELSE
          -- Update existing module progress
          UPDATE tbl_progress_tracking
          SET
            completion_status = 'completed',
            completed_at = NOW(),
            updated_by = p_user_id,
            updated_at = NOW()
          WHERE id = v_module_progress_id;
        END IF;
        
        -- Calculate and update total time spent on the course (only from active topics)
        SELECT IFNULL(SUM(pt.time_spent), 0) INTO v_total_time_spent
        FROM tbl_progress_tracking pt
        JOIN tbl_topics t ON pt.topic_id = t.id
        WHERE pt.enrollment_id = v_enrollment_id 
          AND pt.topic_id IS NOT NULL
          AND t.status = 'active';
        
        UPDATE tbl_enrollments
        SET 
          total_time_spent = v_total_time_spent,
          updated_at = NOW()
        WHERE id = v_enrollment_id;
        
        -- Return results
        SELECT 
          p_topic_id AS topic_id,
          TRUE AS completed,
          TRUE AS module_completed,
          v_module_id AS module_id;
      ELSE
        -- Return results for incomplete module
        SELECT 
          p_topic_id AS topic_id,
          IF(v_content_type = 'slide', v_completed_slides = v_total_slides, TRUE) AS completed,
          FALSE AS module_completed,
          v_module_id AS module_id;
      END IF;
    END;`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS trackSlideCompletion`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS trackSlideCompletion(
  IN p_user_id INT,
  IN p_topic_id INT,
  IN p_slide_id INT
)
BEGIN
  DECLARE v_enrollment_id INT;
  DECLARE v_module_id INT;
  DECLARE v_course_id INT;
  DECLARE v_content_type VARCHAR(50);
  DECLARE v_progress_id INT;
  DECLARE v_total_slides INT;
  DECLARE v_completed_slides INT;
  DECLARE v_completion_status VARCHAR(20);
  DECLARE v_time_spent INT DEFAULT 0;
  DECLARE v_slide_completion_type VARCHAR(10);
  DECLARE v_slide_completion_time INT;
  DECLARE v_now DATETIME;
  DECLARE v_slide_progress_exists INT;
  
  SET v_now = NOW();
  
  -- Find the topic and get its module and content type
  SELECT module_id, content_type INTO v_module_id, v_content_type
  FROM tbl_topics
  WHERE id = p_topic_id;
  
  IF v_module_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|Topic not found';
  END IF;
  
  -- Ensure the content type is 'slide'
  IF v_content_type != 'slide' THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E400|InvalidValueError|Invalid content type for slide tracking';
  END IF;
  
  -- Get course ID from module
  SELECT course_id INTO v_course_id
  FROM tbl_modules
  WHERE id = v_module_id;
  
  -- Find enrollment
  SELECT id INTO v_enrollment_id
  FROM tbl_enrollments
  WHERE user_id = p_user_id AND course_id = v_course_id
  LIMIT 1;
  
  IF v_enrollment_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|Enrollment not found for this user';
  END IF;
  
  -- Check if the slide exists
  SELECT completion_type, completion_time INTO v_slide_completion_type, v_slide_completion_time
  FROM tbl_multi_slides
  WHERE id = p_slide_id AND topic_id = p_topic_id
  LIMIT 1;
  
  IF v_slide_completion_type IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|Slide not found';
  END IF;
  
  -- Find or create progress tracking for the topic
  SELECT id INTO v_progress_id
  FROM tbl_progress_tracking
  WHERE enrollment_id = v_enrollment_id AND topic_id = p_topic_id
  LIMIT 1;
  
  IF v_progress_id IS NULL THEN
    -- Create new progress tracking entry
    INSERT INTO tbl_progress_tracking 
      (enrollment_id, module_id, topic_id, completion_status, time_spent, 
       last_accessed, created_by, updated_by, created_at, updated_at)
    VALUES 
      (v_enrollment_id, v_module_id, p_topic_id, 'not_started', 
       0, v_now, p_user_id, p_user_id, v_now, v_now);
    
    SELECT LAST_INSERT_ID() INTO v_progress_id;
  END IF;
  
  -- Check if slide progress entry exists
  SELECT COUNT(*) INTO v_slide_progress_exists
  FROM tbl_slide_progress
  WHERE progress_tracking_id = v_progress_id AND slide_id = p_slide_id;
  
  IF v_slide_progress_exists = 0 THEN
    -- Create new slide progress entry
    INSERT INTO tbl_slide_progress
      (progress_tracking_id, slide_id, completed, created_at, updated_at)
    VALUES
      (v_progress_id, p_slide_id, TRUE, v_now, v_now);
  ELSE
    -- Update existing slide progress entry
    UPDATE tbl_slide_progress
    SET 
      completed = TRUE,
      updated_at = v_now
    WHERE 
      progress_tracking_id = v_progress_id AND slide_id = p_slide_id;
  END IF;
  
  -- Count total slides for this topic
  SELECT COUNT(*) INTO v_total_slides
  FROM tbl_multi_slides
  WHERE topic_id = p_topic_id;
  
  -- Count completed slides for this progress tracking
  SELECT COUNT(*) INTO v_completed_slides
  FROM tbl_slide_progress
  WHERE 
    progress_tracking_id = v_progress_id AND completed = TRUE;
  
  -- Calculate total time spent (only for timer-based slides)
  SELECT COALESCE(SUM(sp.time_spent), 0) INTO v_time_spent
  FROM tbl_slide_progress sp
  JOIN tbl_multi_slides ms ON sp.slide_id = ms.id
  WHERE 
    sp.progress_tracking_id = v_progress_id
    AND ms.completion_type = 'timer';
  
  -- Determine the completion status
  IF v_completed_slides = 0 THEN
    SET v_completion_status = 'not_started';
  ELSEIF v_completed_slides < v_total_slides THEN
    SET v_completion_status = 'in_progress';
  ELSE
    SET v_completion_status = 'completed';
  END IF;
  
  -- Update progress tracking status
  UPDATE tbl_progress_tracking
  SET 
    completion_status = v_completion_status,
    time_spent = v_time_spent,
    last_accessed = v_now,
    completed_at = CASE WHEN v_completion_status = 'completed' THEN v_now ELSE completed_at END,
    updated_by = p_user_id,
    updated_at = v_now
  WHERE id = v_progress_id;
  
  -- Return progress information
  SELECT 
    v_total_slides AS total,
    v_completed_slides AS completed,
    v_completion_status AS status,
    v_time_spent AS timeSpent;
END;`);

    await sequelize.query(
      `DROP PROCEDURE IF EXISTS getCourseCompletionProgress`
    );
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCourseCompletionProgress(
    IN p_user_id INT,
    IN p_course_id INT
)
BEGIN
    DECLARE v_enrollment_id INT;
    DECLARE v_total_items INT DEFAULT 0;
    DECLARE v_completed_items INT DEFAULT 0;
    DECLARE v_total_topics INT DEFAULT 0;
    DECLARE v_completed_topics INT DEFAULT 0;
    DECLARE v_total_quizzes INT DEFAULT 0;
    DECLARE v_passed_quizzes INT DEFAULT 0;
    DECLARE v_completion_percentage DECIMAL(5,2);

    -- Step 1: Check if user is enrolled in the course
    SELECT id INTO v_enrollment_id 
    FROM tbl_enrollments 
    WHERE user_id = p_user_id AND course_id = p_course_id
    LIMIT 1;
    
    IF v_enrollment_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Enrollment not found for this user and course';
    END IF;

    -- Step 2: Get all active sessions from course
    -- (you can log or temp table this if needed, skipping it as we're using joins directly)

    -- Step 3: Count total number of topics from active modules under active sessions
    SELECT COUNT(t.id) INTO v_total_topics
    FROM tbl_topics t
    JOIN tbl_modules m ON t.module_id = m.id
    JOIN tbl_session s ON m.session_id = s.id
    WHERE s.course_id = p_course_id
      AND s.status = 'active'
      AND m.status = 'active';

    -- Step 4: Count total number of quizzes from active modules under active sessions
    SELECT COUNT(q.id) INTO v_total_quizzes
    FROM tbl_quiz q
    JOIN tbl_modules m ON q.module_id = m.id
    JOIN tbl_session s ON m.session_id = s.id
    WHERE s.course_id = p_course_id
      AND s.status = 'active'
      AND m.status = 'active'
      AND q.status = 'active';

    -- Step 5: Total items
    SET v_total_items = v_total_topics + v_total_quizzes;

    IF v_total_items = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Course has no content (topics or quizzes)';
    END IF;

    -- Step 6: Count completed topics
    SELECT COUNT(pt.id) INTO v_completed_topics
    FROM tbl_progress_tracking pt
    JOIN tbl_topics t ON pt.topic_id = t.id
    JOIN tbl_modules m ON t.module_id = m.id
    JOIN tbl_session s ON m.session_id = s.id
    WHERE pt.enrollment_id = v_enrollment_id
      AND s.course_id = p_course_id
      AND pt.completion_status = 'completed'
      AND s.status = 'active'
      AND m.status = 'active';

    -- Step 7: Count passed quizzes
    SELECT COUNT(DISTINCT qc.quizId) INTO v_passed_quizzes
    FROM tbl_quiz_completion qc
    JOIN tbl_quiz q ON qc.quizId = q.id
    JOIN tbl_modules m ON q.module_id = m.id
    JOIN tbl_session s ON m.session_id = s.id
    WHERE qc.userId = p_user_id
      AND s.course_id = p_course_id
      AND qc.status = 'Passed'
      AND q.status = 'active'
      AND m.status = 'active'
      AND s.status = 'active';

    -- Step 8: Calculate completed items
    SET v_completed_items = v_completed_topics + v_passed_quizzes;

    -- Step 9: Calculate completion percentage
    SET v_completion_percentage = (v_completed_items / v_total_items) * 100;

    -- Step 10: Update enrollment
    IF v_completion_percentage = 100 THEN
        UPDATE tbl_enrollments
        SET status = 'completed',
            is_completed = true,
            completed_at = NOW(),
            completion_percentage = v_completion_percentage
        WHERE id = v_enrollment_id;
    ELSE
        UPDATE tbl_enrollments
        SET completion_percentage = v_completion_percentage
        WHERE id = v_enrollment_id;
    END IF;

    -- Step 11: Return the completion percentage
    SELECT 
        v_completion_percentage AS completionPercentage;

END;`);


    await sequelize.query(
      `DROP PROCEDURE IF EXISTS getModuleCompletionProgress`
    );
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS getModuleCompletionProgress(
  IN p_user_id INT,
  IN p_module_id INT
)
BEGIN
  DECLARE v_enrollment_id INT;
  DECLARE v_course_id INT;
  DECLARE v_total_topics INT;
  DECLARE v_completed_topics INT;
  DECLARE v_completion_percentage INT;
  
  -- Get course_id from module
  SELECT course_id INTO v_course_id
  FROM tbl_modules
  WHERE id = p_module_id;
  
  IF v_course_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|Module not found';
  END IF;
  
  -- Find enrollment
  SELECT id INTO v_enrollment_id
  FROM tbl_enrollments
  WHERE user_id = p_user_id AND course_id = v_course_id
  LIMIT 1;
  
  IF v_enrollment_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|Enrollment not found for this user';
  END IF;
  
  SELECT COUNT(*) INTO v_total_topics
  FROM tbl_topics
  WHERE module_id = p_module_id AND status = 'active';
  
  -- Count completed topics
  SELECT COUNT(*) INTO v_completed_topics
  FROM tbl_progress_tracking pt
  JOIN tbl_topics t ON pt.topic_id = t.id
  WHERE pt.enrollment_id = v_enrollment_id
    AND t.module_id = p_module_id
    AND pt.completion_status = 'completed';
  
  -- Calculate completion percentage as integer
  IF v_total_topics > 0 THEN
    SET v_completion_percentage = ROUND((v_completed_topics / v_total_topics) * 100);
  ELSE
    SET v_completion_percentage = 0;
  END IF;
  
  -- Return the completion percentage as integer
  SELECT v_completion_percentage AS completionPercentage;
END;`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS getTimeSpent`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getTimeSpent(
    IN p_topic_id INT,
    IN p_slide_id INT,  -- Optional parameter for slide-specific time
    IN p_user_id INT
)
BEGIN
    DECLARE v_content_type VARCHAR(50);
    DECLARE v_progress_tracking_id INT;
    DECLARE v_time_spent INT DEFAULT 0;
    
    -- Get the topic content type
    SELECT content_type INTO v_content_type
    FROM tbl_topics
    WHERE id = p_topic_id
    LIMIT 1;
    
    -- If topic doesn't exist, signal error
    IF v_content_type IS NULL THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'E404|NotFoundError|Topic not found';
    END IF;
    
    -- Find the progress tracking record for this topic and user
    SELECT id, time_spent INTO v_progress_tracking_id, v_time_spent
    FROM tbl_progress_tracking
    WHERE topic_id = p_topic_id AND created_by = p_user_id
    LIMIT 1;
    
    -- If no progress tracking record found, v_time_spent remains 0
    
    -- If content type is 'slide' and a specific slide ID is provided
    IF v_content_type = 'slide' AND p_slide_id IS NOT NULL AND v_progress_tracking_id IS NOT NULL THEN
        -- Get time spent for the specific slide
        SELECT IFNULL(time_spent, 0) INTO v_time_spent
        FROM tbl_slide_progress
        WHERE progress_tracking_id = v_progress_tracking_id AND slide_id = p_slide_id
        LIMIT 1;
    END IF;
    
    -- Return the time spent
    SELECT v_time_spent AS time_spent;
END;`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS updateTimeSpent`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateTimeSpent(
  IN p_user_id INT, 
  IN p_topic_id INT,
  IN p_module_id INT,
  IN p_time_spent INT,
  IN p_slide_id INT
)
proc_label: BEGIN  -- Added a label here
  DECLARE v_topic_content_type VARCHAR(50);
  DECLARE v_module_course_id INT;
  DECLARE v_enrollment_id INT;
  DECLARE v_progress_tracking_id INT;
  DECLARE v_slide_completion_type VARCHAR(50);
  DECLARE v_slide_completion_time INT;
  DECLARE v_total_time_spent INT DEFAULT 0;
  DECLARE v_success BOOLEAN DEFAULT FALSE;
  DECLARE v_message VARCHAR(255);
  
  -- Validate required inputs
  IF p_topic_id IS NULL OR p_module_id IS NULL OR p_time_spent IS NULL THEN
    SELECT FALSE AS success, 'Topic ID, Module ID, and Time Spent are required' AS message;
    LEAVE proc_label;  -- Use the label name here
  END IF;
  
  -- Get topic information including content type
  SELECT t.content_type, m.course_id 
  INTO v_topic_content_type, v_module_course_id
  FROM tbl_topics t
  JOIN tbl_modules m ON t.module_id = m.id
  WHERE t.id = p_topic_id;
  
  IF v_topic_content_type IS NULL THEN
    SELECT FALSE AS success, 'Topic not found' AS message;
    LEAVE proc_label;  -- Use the label name here
  END IF;
  
  -- Find the enrollment
  SELECT id INTO v_enrollment_id
  FROM tbl_enrollments
  WHERE user_id = p_user_id AND course_id = v_module_course_id;
  
  IF v_enrollment_id IS NULL THEN
    SELECT FALSE AS success, 'Enrollment not found for this user' AS message;
    LEAVE proc_label;  -- Use the label name here
  END IF;
  
  -- Find or create progress tracking record
  SELECT id INTO v_progress_tracking_id
  FROM tbl_progress_tracking
  WHERE topic_id = p_topic_id AND created_by = p_user_id;
  
  IF v_progress_tracking_id IS NULL THEN
    -- Create new progress tracking record
    INSERT INTO tbl_progress_tracking (
      module_id, 
      topic_id,
      enrollment_id,
      time_spent,
      completion_status,
      last_accessed,
      created_by,
      updated_by,
      created_at,
      updated_at
    ) VALUES (
      p_module_id,
      p_topic_id,
      v_enrollment_id,
      IF(v_topic_content_type != 'slide', p_time_spent, 0),
      'in_progress',
      NOW(),
      p_user_id,
      p_user_id,
      NOW(),
      NOW()
    );
    
    SET v_progress_tracking_id = LAST_INSERT_ID();
  ELSE
    -- Progress tracking exists - for non-slide content, update if new time is greater
    IF v_topic_content_type != 'slide' THEN
      UPDATE tbl_progress_tracking
      SET 
        time_spent = GREATEST(time_spent, p_time_spent),
        last_accessed = NOW(),
        updated_by = p_user_id,
        updated_at = NOW()
      WHERE id = v_progress_tracking_id;
    END IF;
  END IF;
  
  -- For non-slide content types, we're done
  IF v_topic_content_type != 'slide' THEN
    SELECT 
      TRUE AS success, 
      (SELECT time_spent FROM tbl_progress_tracking WHERE id = v_progress_tracking_id) AS time_spent;
    LEAVE proc_label;  -- Use the label name here
  END IF;
  
  -- For slide content type, handle the SlideProgress updates
  IF p_slide_id IS NULL THEN
    SELECT FALSE AS success, 'Slide ID is required for slide content types' AS message;
    LEAVE proc_label;  -- Use the label name here
  END IF;
  
  -- Find the slide
  SELECT completion_type, completion_time 
  INTO v_slide_completion_type, v_slide_completion_time
  FROM tbl_multi_slides
  WHERE id = p_slide_id AND topic_id = p_topic_id;
  
  IF v_slide_completion_type IS NULL THEN
    SELECT FALSE AS success, 'Slide not found' AS message;
    LEAVE proc_label;  -- Use the label name here
  END IF;
  
  -- Check if slide progress exists
  SET @slide_progress_exists = (
    SELECT COUNT(*) 
    FROM tbl_slide_progress 
    WHERE progress_tracking_id = v_progress_tracking_id AND slide_id = p_slide_id
  );
  
  IF @slide_progress_exists = 0 THEN
    -- Create new slide progress
    INSERT INTO tbl_slide_progress (
      progress_tracking_id,
      slide_id,
      time_spent,
      completed,
      created_at,
      updated_at
    ) VALUES (
      v_progress_tracking_id,
      p_slide_id,
      p_time_spent,
      (v_slide_completion_type = 'timer' AND v_slide_completion_time IS NOT NULL AND p_time_spent >= v_slide_completion_time),
      NOW(),
      NOW()
    );
  ELSE
    -- Update slide progress if new time is greater
    UPDATE tbl_slide_progress
    SET 
      time_spent = GREATEST(time_spent, p_time_spent),
      completed = IF(
        v_slide_completion_type = 'timer' AND 
        v_slide_completion_time IS NOT NULL AND 
        p_time_spent >= v_slide_completion_time,
        TRUE,
        completed
      ),
      updated_at = NOW()
    WHERE progress_tracking_id = v_progress_tracking_id AND slide_id = p_slide_id;
  END IF;
  
  -- Calculate total time from all timer-based slides
  SELECT COALESCE(SUM(sp.time_spent), 0) INTO v_total_time_spent
  FROM tbl_slide_progress sp
  JOIN tbl_multi_slides ms ON sp.slide_id = ms.id
  WHERE sp.progress_tracking_id = v_progress_tracking_id
  AND ms.completion_type = 'timer';
  
  -- Update progress tracking with total time
  UPDATE tbl_progress_tracking
  SET 
    time_spent = v_total_time_spent,
    last_accessed = NOW(),
    updated_by = p_user_id,
    updated_at = NOW()
  WHERE id = v_progress_tracking_id;
  
  -- Return results
  SELECT 
    TRUE AS success, 
    (SELECT time_spent FROM tbl_slide_progress 
     WHERE progress_tracking_id = v_progress_tracking_id AND slide_id = p_slide_id) AS slide_time_spent;
  
END`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS getBasicAccessibleTopics`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getBasicAccessibleTopics(
      IN p_user_id INT,
      IN p_module_id INT
    )
    BEGIN
      DECLARE v_enrollment_id INT;
      DECLARE v_course_id INT;
      DECLARE v_module_exists BOOLEAN DEFAULT FALSE;

      -- Check if module exists and get course_id
      SELECT course_id INTO v_course_id
      FROM tbl_modules
      WHERE id = p_module_id
      LIMIT 1;

      IF v_course_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Module not found';
      END IF;

      -- Get enrollment ID
      SELECT id INTO v_enrollment_id
      FROM tbl_enrollments
      WHERE user_id = p_user_id AND course_id = v_course_id
      LIMIT 1;

      IF v_enrollment_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Enrollment not found for this user';
      END IF;

      -- Create temporary table to store topics with their basic information
      CREATE TEMPORARY TABLE IF NOT EXISTS temp_basic_topics (
        id INT,
        public_hash VARCHAR(255),
        module_id INT,
        title VARCHAR(255),
        content_type VARCHAR(50),
        sequence_no INT,
        original_sequence_no INT,  -- Keep track of original sequence
        status VARCHAR(20),
        isAccessible BOOLEAN
      );

      -- Insert topics with re-sequenced numbers (only active topics)
      INSERT INTO temp_basic_topics (
        id, public_hash, module_id, title, content_type, sequence_no, original_sequence_no, status
      )
      SELECT
        t.id, t.public_hash, t.module_id, t.title, t.content_type, 
        ROW_NUMBER() OVER (ORDER BY t.sequence_no ASC) as sequence_no,  -- Re-sequence only accessible topics
        t.sequence_no as original_sequence_no,
        t.status
      FROM tbl_topics t
      WHERE t.module_id = p_module_id 
        AND EXISTS (
          SELECT 1
          FROM tbl_student_accessible_data sad
          WHERE sad.enrollment_id = v_enrollment_id
            AND sad.course_id = v_course_id
            AND JSON_CONTAINS(sad.topic_ids, CAST(t.id AS JSON))
        )
      ORDER BY t.sequence_no ASC;

      -- Process topic accessibility using the new continuous sequence
      BEGIN
        DECLARE done INT DEFAULT FALSE;
        DECLARE current_topic_id INT;
        DECLARE current_sequence INT;
        DECLARE previous_completed BOOLEAN DEFAULT FALSE;
        DECLARE topic_cur CURSOR FOR
          SELECT id, sequence_no FROM temp_basic_topics ORDER BY sequence_no ASC;
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

        OPEN topic_cur;

        process_loop: LOOP
          FETCH topic_cur INTO current_topic_id, current_sequence;
          IF done THEN
            LEAVE process_loop;
          END IF;

          -- First topic is always accessible
          IF current_sequence = 1 THEN
            UPDATE temp_basic_topics
            SET isAccessible = TRUE
            WHERE id = current_topic_id;
          ELSE
            -- Get the previous topic ID (in the re-sequenced order)
            SELECT id INTO @previous_topic_id
            FROM temp_basic_topics
            WHERE sequence_no = current_sequence - 1;
            
            -- Check if previous topic is fully completed (including quizzes and assignments)
            SET previous_completed = FALSE;
            
            -- First check if the topic itself is completed
            SELECT COUNT(*) > 0 INTO @topic_completed
            FROM tbl_progress_tracking
            WHERE enrollment_id = v_enrollment_id
              AND topic_id = @previous_topic_id
              AND completion_status = 'completed';
            
            -- If topic is not completed, previous topic is not fully completed
            IF @topic_completed = 0 THEN
              SET previous_completed = FALSE;
            ELSE
              -- Check if there are any associated quizzes and assignments
              SELECT COUNT(*) INTO @has_attachments
              FROM tbl_topic_content
              WHERE topic_id = @previous_topic_id;
              
              -- If there's no additional content, topic is fully completed
              IF @has_attachments = 0 THEN
                SET previous_completed = TRUE;
              ELSE
                -- Check all quizzes and assignments
                SET @all_attachments_completed = TRUE;
                
                -- Check quizzes - must be completed with "Passed" status
                -- First, get all quizzes associated with this topic
                SELECT COUNT(*) INTO @total_quizzes
                FROM tbl_topic_content tc
                WHERE tc.topic_id = @previous_topic_id
                  AND tc.quiz_id IS NOT NULL;
                
                -- Then check how many are completed and passed by this user
                SELECT COUNT(*) INTO @completed_quizzes
                FROM tbl_topic_content tc
                JOIN tbl_quiz_completion qc ON tc.quiz_id = qc.quizId
                WHERE tc.topic_id = @previous_topic_id
                  AND tc.quiz_id IS NOT NULL
                  AND qc.userId = p_user_id 
                  AND qc.isCompleted = TRUE 
                  AND qc.status = 'Passed';
                
                -- If not all quizzes are completed and passed, mark as incomplete
                IF @completed_quizzes < @total_quizzes THEN
                  SET @all_attachments_completed = FALSE;
                END IF;
                
                -- Check assignments - must be completed
                -- First, get all assignments associated with this topic
                SELECT COUNT(*) INTO @total_assignments
                FROM tbl_topic_content tc
                WHERE tc.topic_id = @previous_topic_id
                  AND tc.assignment_id IS NOT NULL;
                
                -- Then check how many are completed by this user
                SELECT COUNT(*) INTO @completed_assignments
                FROM tbl_topic_content tc
                JOIN tbl_assignment_completion ac ON tc.assignment_id = ac.assignmentId
                WHERE tc.topic_id = @previous_topic_id
                  AND tc.assignment_id IS NOT NULL
                  AND ac.userId = p_user_id 
                  AND ac.isCompleted = TRUE;
                
                -- If not all assignments are completed, mark as incomplete
                IF @completed_assignments < @total_assignments THEN
                  SET @all_attachments_completed = FALSE;
                END IF;
                
                SET previous_completed = @all_attachments_completed;
              END IF;
            END IF;
    
            -- Update current topic accessibility
            UPDATE temp_basic_topics
            SET isAccessible = previous_completed
            WHERE id = current_topic_id;
          END IF;
        END LOOP;
    
        CLOSE topic_cur;
      END;

      -- Return the basic topic information with original sequence numbers
      SELECT
        id,
        public_hash,
        module_id,
        title,
        content_type,
        original_sequence_no as sequence_no,  -- Return original sequence numbers
        status,
        isAccessible
      FROM temp_basic_topics
      ORDER BY original_sequence_no ASC;

      -- Clean up
      DROP TEMPORARY TABLE IF EXISTS temp_basic_topics;
    END;`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS getDetailedTopicInfo`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getDetailedTopicInfo(
      IN p_user_id INT,
      IN p_topic_id INT
    )
    BEGIN
      DECLARE v_enrollment_id INT;
      DECLARE v_course_id INT;
      DECLARE v_module_id INT;
    
      -- Get module_id and course_id from the topic
      SELECT t.module_id, m.course_id INTO v_module_id, v_course_id
      FROM tbl_topics t
      JOIN tbl_modules m ON t.module_id = m.id
      WHERE t.id = p_topic_id 
      LIMIT 1;
    
      IF v_module_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Topic not found';
      END IF;
    
      -- Get enrollment ID
      SELECT id INTO v_enrollment_id
      FROM tbl_enrollments
      WHERE user_id = p_user_id AND course_id = v_course_id
      LIMIT 1;
    
      IF v_enrollment_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Enrollment not found for this user';
      END IF;
    
      -- Return detailed topic information
      SELECT
        t.id,
        t.public_hash,
        t.module_id,
        t.title,
        t.description,
        t.content_type,
        t.sequence_no,
        t.status,
        t.created_by,
        t.created_by_type,
        t.updated_by,
        t.updated_by_type,
        t.created_at,
        t.updated_at,
        CASE
          WHEN t.content_type = 'video' THEN (
            SELECT JSON_OBJECT(
              'id', v.id,
              'topic_id', v.topic_id,
              'url', v.url,
              'audio_url', v.audio_url,
              'duration_minutes', v.duration_minutes,
              'video_type', v.video_type,
              'created_by', v.created_by,
              'created_by_type', v.created_by_type,
              'updated_by', v.updated_by,
              'updated_by_type', v.updated_by_type,
              'created_at', v.created_at,
              'updated_at', v.updated_at
            )
            FROM tbl_videos v
            WHERE v.topic_id = t.id
          )
          ELSE NULL
        END AS Video,
        CASE
          WHEN t.content_type = 'audio' THEN (
            SELECT JSON_OBJECT(
              'id', a.id,
              'topic_id', a.topic_id,
              'url', a.url,
              'image_url', a.image_url,
              'duration_minutes', a.duration_minutes,
              'created_by', a.created_by,
              'created_by_type', a.created_by_type,
              'updated_by', a.updated_by,
              'updated_by_type', a.updated_by_type,
              'created_at', a.created_at,
              'updated_at', a.updated_at
            )
            FROM tbl_audios a
            WHERE a.topic_id = t.id
          )
          ELSE NULL
        END AS Audio,
        CASE
          WHEN t.content_type = 'accordian' THEN (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', acc.id,
                'topic_id', acc.topic_id,
                'title', acc.title,
                'body', acc.body,
                'codeLanguage', acc.codeLanguage,
                'code', acc.code,
                'audio_url', acc.audio_url,
                'completion_type', acc.completion_type,
                'completion_time', acc.completion_time,
                'created_by', acc.created_by,
                'created_by_type', acc.created_by_type,
                'updated_by', acc.updated_by,
                'updated_by_type', acc.updated_by_type,
                'created_at', acc.created_at,
                'updated_at', acc.updated_at,
                'AccordionAttachments', (
                  SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                      'id', aa.id,
                      'accordionId', aa.accordionId,
                      'fileUrl', aa.fileUrl,
                      'fileType', aa.fileType
                    )
                  )
                  FROM tbl_accordion_attachments aa
                  WHERE aa.accordionId = acc.id
                )
              )
            )
            FROM tbl_accordions acc
            WHERE acc.topic_id = t.id
          )
          ELSE NULL
        END AS Accordions,
        CASE
          WHEN t.content_type = 'general' THEN (
            SELECT JSON_OBJECT(
              'id', gm.id,
              'topic_id', gm.topic_id,
              'url', gm.url,
              'title', gm.title,
              'description', gm.description,
              'material_type', gm.material_type,
              'audio_url', gm.audio_url,
              'completion_type', gm.completion_type,
              'completion_time', gm.completion_time,
              'created_by', gm.created_by,
              'created_by_type', gm.created_by_type,
              'updated_by', gm.updated_by,
              'updated_by_type', gm.updated_by_type,
              'created_at', gm.created_at,
              'updated_at', gm.updated_at
            )
            FROM tbl_general_materials gm
            WHERE gm.topic_id = t.id
          )
          ELSE NULL
        END AS GeneralMaterial,
        CASE
          WHEN t.content_type = 'slide' THEN (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', ms.id,
                'topic_id', ms.topic_id,
                'title', ms.title,
                'description', ms.description,
                'type', ms.type,
                'completion_type', ms.completion_type,
                'completion_time', ms.completion_time,
                'audio_url', ms.audio_url,
                'created_by', ms.created_by,
                'created_by_type', ms.created_by_type,
                'updated_by', ms.updated_by,
                'updated_by_type', ms.updated_by_type,
                'created_at', ms.created_at,
                'updated_at', ms.updated_at,
                'MultiSlideVideos', (
                  SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                      'id', msv.id,
                      'multi_slide_id', msv.multi_slide_id,
                      'url', msv.url,
                      'type', msv.type,
                      'duration_minutes', msv.duration_minutes,
                      'created_by', msv.created_by,
                      'created_by_type', msv.created_by_type,
                      'updated_by', msv.updated_by,
                      'updated_by_type', msv.updated_by_type,
                      'created_at', msv.created_at,
                      'updated_at', msv.updated_at
                    )
                  )
                  FROM tbl_multi_slides_video msv
                  WHERE msv.multi_slide_id = ms.id
                ),
                -- 'MultiSlideAudios', (
                --   SELECT JSON_ARRAYAGG(
                --     JSON_OBJECT(
                --       'id', msa.id,
                --       'multi_slide_id', msa.multi_slide_id,
                --       'url', msa.url,
                --       'duration_minutes', msa.duration_minutes,
                --       'created_by', msa.created_by,
                --       'created_by_type', msa.created_by_type,
                --       'updated_by', msa.updated_by,
                --       'updated_by_type', msa.updated_by_type,
                --       'created_at', msa.created_at,
                --       'updated_at', msa.updated_at
                --     )
                --   )
                --   FROM tbl_multi_slides_audio msa
                --   WHERE msa.multi_slide_id = ms.id
                -- ),
                -- 'MultiSlideGenerals', (
                --   SELECT JSON_ARRAYAGG(
                --     JSON_OBJECT(
                --       'id', msg.id,
                --       'multi_slide_id', msg.multi_slide_id,
                --       'url', msg.url,
                --       'material_type', msg.material_type,
                --       'codeLanguage', msg.codeLanguage,
                --       'code', msg.code,
                --       'created_by', msg.created_by,
                --       'created_by_type', msg.created_by_type,
                --       'updated_by', msg.updated_by,
                --       'updated_by_type', msg.updated_by_type,
                --       'created_at', msg.created_at,
                --       'updated_at', msg.updated_at
                --     )
                --   )
                --   FROM tbl_multi_slides_general msg
                --   WHERE msg.multi_slide_id = ms.id
                -- ),
                'MultiSlideAccordions', (
                  SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                      'id', msa.id,
                      'multi_slide_id', msa.multi_slide_id,
                      'title', msa.title,
                      'body', msa.body,
                      'codeLanguage', msa.codeLanguage,
                      'code', msa.code,
                      'created_by', msa.created_by,
                      'created_by_type', msa.created_by_type,
                      'updated_by', msa.updated_by,
                      'updated_by_type', msa.updated_by_type,
                      'created_at', msa.created_at,
                      'updated_at', msa.updated_at,
                      'MultiSlideAccordionAttachments',(
                        SELECT JSON_ARRAYAGG(
                          JSON_OBJECT(
                            'id', maa.id,
                            'accordionId', maa.accordionId,
                            'fileUrl', maa.fileUrl,
                            'fileType', maa.fileType
                          )
                        )
                        FROM tbl_multislide_accordion_attachments maa
                        WHERE maa.accordionId = msa.id
                      )
                    )
                  )
                  FROM tbl_multislide_accordions msa
                  WHERE msa.multi_slide_id = ms.id
                )
              )
            )
            FROM tbl_multi_slides ms
            WHERE ms.topic_id = t.id
          )
          ELSE NULL
        END AS MultiSlides,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', tt.id,
              'topic_id', tt.topic_id,
              'tag_file_type', tt.tag_file_type,
              'tag_file_path', tt.tag_file_path,
              'tag', tt.tag,
              'status', tt.status
            )
          )
          FROM tbl_topics_tag tt
          WHERE tt.topic_id = t.id
        ) AS TopicTags,
        (
          SELECT COUNT(*) > 0
          FROM tbl_progress_tracking
          WHERE enrollment_id = v_enrollment_id
            AND topic_id = t.id
            AND completion_status = 'completed'
        ) AS isCompleted
      FROM tbl_topics t
      WHERE t.id = p_topic_id;
    END;`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS getTopicSlides`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getTopicSlides(
      IN p_topic_id INT
    )
    BEGIN
      -- Return only basic slide information
      SELECT 
        id,
        title,
        completion_type,
        completion_time
      FROM tbl_multi_slides
      WHERE topic_id = p_topic_id;
    END;`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS getSlideContent`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getSlideContent(
      IN p_slide_id INT
    )
    BEGIN
      -- Return detailed content for a specific slide
      SELECT 
        ms.id,
        ms.topic_id,
        ms.title,
        ms.description,
        ms.type,
        ms.completion_type,
        ms.completion_time,
        ms.audio_url,
        ms.created_by,
        ms.created_by_type,
        ms.updated_by,
        ms.updated_by_type,
        ms.created_at,
        ms.updated_at,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', msv.id,
              'multi_slide_id', msv.multi_slide_id,
              'url', msv.url,
              'type', msv.type,
              'duration_minutes', msv.duration_minutes,
              'created_by', msv.created_by,
              'created_by_type', msv.created_by_type,
              'updated_by', msv.updated_by,
              'updated_by_type', msv.updated_by_type,
              'created_at', msv.created_at,
              'updated_at', msv.updated_at
            )
          )
          FROM tbl_multi_slides_video msv
          WHERE msv.multi_slide_id = ms.id
        ) AS MultiSlideVideos,
        -- (
        --   SELECT JSON_ARRAYAGG(
        --     JSON_OBJECT(
        --       'id', msa.id,
        --       'multi_slide_id', msa.multi_slide_id,
        --       'url', msa.url,
        --       'duration_minutes', msa.duration_minutes,
        --       'created_by', msa.created_by,
        --       'created_by_type', msa.created_by_type,
        --       'updated_by', msa.updated_by,
        --       'updated_by_type', msa.updated_by_type,
        --       'created_at', msa.created_at,
        --       'updated_at', msa.updated_at
        --     )
        --   )
        --   FROM tbl_multi_slides_audio msa
        --   WHERE msa.multi_slide_id = ms.id
        -- ) AS MultiSlideAudios,
        -- (
        --   SELECT JSON_ARRAYAGG(
        --     JSON_OBJECT(
        --       'id', msg.id,
        --       'multi_slide_id', msg.multi_slide_id,
        --       'url', msg.url,
        --       'material_type', msg.material_type,
        --       'codeLanguage', msg.codeLanguage,
        --       'code', msg.code,
        --       'created_by', msg.created_by,
        --       'created_by_type', msg.created_by_type,
        --       'updated_by', msg.updated_by,
        --       'updated_by_type', msg.updated_by_type,
        --       'created_at', msg.created_at,
        --       'updated_at', msg.updated_at
        --     )
        --   )
        --   FROM tbl_multi_slides_general msg
        --   WHERE msg.multi_slide_id = ms.id
        -- ) AS MultiSlideGenerals,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', msa.id,
              'multi_slide_id', msa.multi_slide_id,
              'title', msa.title,
              'body', msa.body,
              'codeLanguage', msa.codeLanguage,
              'code', msa.code,
              'created_by', msa.created_by,
              'created_by_type', msa.created_by_type,
              'updated_by', msa.updated_by,
              'updated_by_type', msa.updated_by_type,
              'created_at', msa.created_at,
              'updated_at', msa.updated_at,
              'MultiSlideAccordionAttachments',(
                SELECT JSON_ARRAYAGG(
                  JSON_OBJECT(
                    'id', maa.id,
                    'accordionId', maa.accordionId,
                    'fileUrl', maa.fileUrl,
                    'fileType', maa.fileType
                  )
                )
                FROM tbl_multislide_accordion_attachments maa
                WHERE maa.accordionId = msa.id
              )
            )
          )
          FROM tbl_multislide_accordions msa
          WHERE msa.multi_slide_id = ms.id
        ) AS MultiSlideAccordions
      FROM tbl_multi_slides ms
      WHERE ms.id = p_slide_id;
    END;`);

    // Add this procedure to the setupProgressTrackingProcedures function        await sequelize.query(`DROP PROCEDURE IF EXISTS updateTopicTimeSpent`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateTopicTimeSpent(
      IN p_user_id INT,
      IN p_topic_id INT,
      IN p_time_spent INT  -- Time spent in seconds
    )
    BEGIN
      DECLARE v_enrollment_id INT;
      DECLARE v_course_id INT;
      DECLARE v_module_id INT;
      DECLARE v_progress_tracking_id INT;
      DECLARE v_current_time_spent INT DEFAULT 0;
      DECLARE v_completion_status VARCHAR(50);
      
      -- Get module_id and course_id from topic
      SELECT t.module_id, m.course_id 
      INTO v_module_id, v_course_id
      FROM tbl_topics t
      JOIN tbl_modules m ON t.module_id = m.id
      WHERE t.id = p_topic_id
      LIMIT 1;
      
      IF v_module_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Topic not found';
      END IF;
      
      -- Find the enrollment
      SELECT id INTO v_enrollment_id
      FROM tbl_enrollments
      WHERE user_id = p_user_id AND course_id = v_course_id
      LIMIT 1;
      
      IF v_enrollment_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Enrollment not found for this user';
      END IF;
      
      -- Find any existing progress tracking record, regardless of status
      SELECT id, student_time_spent, completion_status 
      INTO v_progress_tracking_id, v_current_time_spent, v_completion_status
      FROM tbl_progress_tracking
      WHERE enrollment_id = v_enrollment_id AND topic_id = p_topic_id
      LIMIT 1;
      
      IF v_progress_tracking_id IS NULL THEN
        -- Create new progress tracking record
        INSERT INTO tbl_progress_tracking (
          enrollment_id,
          module_id,
          topic_id,
          student_time_spent,
          completion_status,
          last_accessed,
          created_by,
          updated_by,
          created_at,
          updated_at
        ) VALUES (
          v_enrollment_id,
          v_module_id,
          p_topic_id,
          p_time_spent,
          'in_progress',
          NOW(),
          p_user_id,
          p_user_id,
          NOW(),
          NOW()
        );
        
        SET v_current_time_spent = p_time_spent;
      ELSE
        -- Update existing progress tracking record, preserving completion status
        UPDATE tbl_progress_tracking
        SET 
          student_time_spent = student_time_spent + p_time_spent,
          last_accessed = NOW(),
          updated_by = p_user_id,
          updated_at = NOW()
          -- Keep existing completion_status, don't reset to 'in_progress'
        WHERE id = v_progress_tracking_id;
        
        SET v_current_time_spent = v_current_time_spent + p_time_spent;
      END IF;
      
      -- Return the updated time spent and current status
      SELECT v_current_time_spent AS total_time_spent, 
             IFNULL(v_completion_status, 'in_progress') AS completion_status;
    END`);

    console.log("✅ Progress Tracking procedures created!");
  } catch (error) {
    console.error("❌ Error setting up Progress Tracking procedures:", error);
    throw error;
  }
};

module.exports = { setupProgressTrackingProcedures };
