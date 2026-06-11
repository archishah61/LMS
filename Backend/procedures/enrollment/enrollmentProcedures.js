// utils/procedure/enrollmentProcedures.js

const sequelize = require("../../config/db");

const setupEnrollmentProcedures = async () => {
  try {
    console.log("🔄 Setting up Enrollment procedures...");

    // Procedure: CreateEnrollment ✅ (Tested)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createEnrollment(
  IN p_user_id INT,
  IN p_course_public_hash VARCHAR(255),
  IN p_user_hash VARCHAR(255),
  IN p_enrollment_date DATETIME,
  IN p_expiry_date DATETIME,
  IN p_isEnrolledByPromoCode BOOLEAN,
  IN p_status ENUM('active', 'completed'),
  IN p_created_by INT
)
BEGIN
  DECLARE v_course_id INT;
  DECLARE v_category VARCHAR(255);
  DECLARE v_course_status VARCHAR(50);
  DECLARE v_generated_by INT;
  DECLARE existing_enrollment_count INT;

  -- Check if course exists and get its ID and category
  SELECT c.id, cc.category, c.status, c.generated_by
  INTO v_course_id, v_category, v_course_status, v_generated_by
  FROM tbl_courses c
  JOIN tbl_course_categories cc ON c.category_id = cc.id
  WHERE c.public_hash = p_course_public_hash
  LIMIT 1;

  IF v_course_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|Course not Found.',
    MYSQL_ERRNO = 4001;
  END IF;

  -- If course is private, check generated_user_id = user_id
  IF v_course_status = 'private' AND v_generated_by <> p_user_id THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E403|ForbiddenError|Course is private, you are not allowed to enroll.',
    MYSQL_ERRNO = 4003;
  END IF;

  -- Check for existing enrollment
  SELECT COUNT(*) INTO existing_enrollment_count
  FROM tbl_enrollments
  WHERE user_id = p_user_id AND course_id = v_course_id;

  IF existing_enrollment_count > 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E409|AlreadyExistsError|User is already enrolled in this course.',
    MYSQL_ERRNO = 4002;
  END IF;

  -- Insert new enrollment
  INSERT INTO tbl_enrollments (
    user_id,
    course_id,
    user_hash,
    enrollment_date,
    expiry_date,
    isEnrolledByPromoCode,
    status,
    created_by,
    updated_by,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    v_course_id,
    p_user_hash,
    p_enrollment_date,
    p_expiry_date,
    p_isEnrolledByPromoCode,
    p_status,
    p_created_by,
    p_created_by,
    NOW(),
    NOW()
  );

  -- Return the inserted record
  SELECT * FROM tbl_enrollments WHERE id = LAST_INSERT_ID();
END
  `);

    // Procedure: GetAllEnrollmentsWithDetails
    await sequelize.query('DROP PROCEDURE IF EXISTS getAllEnrollmentsWithDetails')
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllEnrollmentsWithDetails(
      IN p_id INT,
      IN p_type ENUM('admin', 'student', 'partner'),
      IN p_search_term VARCHAR(255),
      IN p_status VARCHAR(10),
      IN p_createdFrom DATETIME,
      IN p_createdTo   DATETIME
      )
    BEGIN
      DECLARE v_partners_user_id INT;

      IF p_type = 'partner' THEN
        SELECT user_id INTO v_partners_user_id FROM tbl_partners WHERE id = p_id;
      END IF;

      SELECT
        e.id AS enrollment_id,
        e.user_id,
        u.full_name,
        u.email,
        u.username,
        u.mobile_no,
        e.course_id,
        c.public_hash,
        c.title,
        c.description,
        c.thumbnail,
        c.price,
        c.duration_minutes,
        c.category_id,
        cat.category AS category_name,
        e.user_hash,
        e.enrollment_date,
        e.completion_percentage,
        e.certificate_url,
        e.is_completed,
        e.completed_at,
        e.expiry_date,
        e.status,
        e.created_by,
        e.updated_by,
        e.created_at,
        e.updated_at
      FROM tbl_enrollments e
      INNER JOIN tbl_users u ON u.id = e.user_id
      INNER JOIN tbl_courses c ON c.id = e.course_id
      LEFT JOIN tbl_course_categories cat ON cat.id = c.category_id
      WHERE 
          ((p_type = 'admin') OR
          (p_type = 'student' AND e.user_id = p_id) OR
          (p_type = 'partner' AND c.created_by_type = 'partner' AND c.created_by = p_id) OR
          (p_type = 'partner' AND c.generated_by = v_partners_user_id))
          AND (p_search_term IS NULL OR p_search_term = '' 
            OR u.full_name LIKE CONCAT('%', p_search_term, '%')
            OR u.email LIKE CONCAT('%', p_search_term, '%')
            OR c.title LIKE CONCAT('%', p_search_term, '%')) 
          AND (p_status IS NULL OR p_status = 'all' 
            OR (p_status = 'active' AND e.status = 'active' AND e.expiry_date > NOW()) 
            OR (p_status = 'completed' AND e.status = 'completed') 
            OR (p_status = 'expired' AND e.expiry_date <= NOW())) 
          AND (p_createdFrom IS NULL OR e.enrollment_date >= p_createdFrom)
          AND (p_createdTo IS NULL OR e.enrollment_date < DATE_ADD(p_createdTo, INTERVAL 1 DAY));
    END`);

    // await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllEnrollmentsWithDetails(
    //   IN p_id INT,
    //   IN p_type ENUM('admin', 'student', 'partner'),
    //   IN p_status ENUM('active','expired','completed'),
    //   IN p_from_date DATE,
    //   IN p_to_date DATE,
    //   IN p_search_term VARCHAR(255),
    //   IN p_limit INT,
    //   IN p_offset INT
    //   )
    // BEGIN
    //   DECLARE v_partners_user_id INT;

    //   IF p_type = 'student' THEN
    //     SELECT
    //       e.id AS enrollment_id,
    //       e.user_id,
    //       u.full_name,
    //       u.email,
    //       u.username,
    //       u.mobile_no,
    //       e.course_id,
    //       c.public_hash,
    //       c.title,
    //       c.description,
    //       c.thumbnail,
    //       c.price,
    //       c.duration_minutes,
    //       c.category_id,
    //       cat.category AS category_name,
    //       e.user_hash,
    //       e.enrollment_date,
    //       e.completion_percentage,
    //       e.certificate_url,
    //       e.is_completed,
    //       e.completed_at,
    //       e.expiry_date,
    //       e.status,
    //       e.created_by,
    //       e.updated_by,
    //       e.created_at,
    //       e.updated_at
    //     FROM tbl_enrollments e
    //     INNER JOIN tbl_users u ON u.id = e.user_id
    //     INNER JOIN tbl_courses c ON c.id = e.course_id
    //     LEFT JOIN tbl_course_categories cat ON cat.id = c.category_id
    //     WHERE (p_type = 'student' AND e.user_id = p_id);
    //   ELSE
    //     IF p_type = 'partner' THEN
    //       SELECT user_id INTO v_partners_user_id FROM tbl_partners WHERE id = p_id;
    //     END IF;

    //     SELECT
    //       e.id AS enrollment_id,
    //       e.user_id,
    //       u.full_name,
    //       u.email,
    //       u.username,
    //       u.mobile_no,
    //       e.course_id,
    //       c.public_hash,
    //       c.title,
    //       c.description,
    //       c.thumbnail,
    //       c.price,
    //       c.duration_minutes,
    //       c.category_id,
    //       cat.category AS category_name,
    //       e.user_hash,
    //       e.enrollment_date,
    //       e.completion_percentage,
    //       e.certificate_url,
    //       e.is_completed,
    //       e.completed_at,
    //       e.expiry_date,
    //       e.status,
    //       e.created_by,
    //       e.updated_by,
    //       e.created_at,
    //       e.updated_at
    //     FROM tbl_enrollments e
    //     INNER JOIN tbl_users u ON u.id = e.user_id
    //     INNER JOIN tbl_courses c ON c.id = e.course_id
    //     LEFT JOIN tbl_course_categories cat ON cat.id = c.category_id
    //     WHERE 
    //         ((p_type = 'admin') OR
    //         (p_type = 'partner' AND c.created_by_type = 'partner' AND c.created_by = p_id) OR
    //         (p_type = 'partner' AND c.generated_by = v_partners_user_id))
    //         -- STATUS FILTER
    //         AND (
    //             p_status IS NULL OR
    //             (
    //                 p_status = 'completed' AND e.is_completed = 1
    //             ) OR
    //             (
    //                 p_status = 'active' 
    //                 AND e.is_completed = 0 
    //                 AND (e.expiry_date IS NULL OR e.expiry_date >= CURDATE())
    //             ) OR
    //             (
    //                 p_status = 'expired' 
    //                 AND e.expiry_date < CURDATE()
    //             )
    //         )

    //         -- DATE RANGE FILTER
    //         AND (
    //             (p_from_date IS NULL AND p_to_date IS NULL) OR
    //             (e.enrollment_date BETWEEN p_from_date AND p_to_date)
    //         )

    //         -- SEARCH FILTER
    //         AND (
    //             p_search_term IS NULL OR
    //             u.full_name LIKE CONCAT('%', p_search_term, '%') OR
    //             u.email LIKE CONCAT('%', p_search_term, '%') OR
    //             c.title LIKE CONCAT('%', p_search_term, '%')
    //         )
    //         LIMIT p_limit OFFSET p_offset;
    //   END IF;
    // END`);

    // Procedure: Get Enrollment By ID ✅ (Tested)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getEnrollmentById(
  IN p_id INT
)
BEGIN
  DECLARE enrollment_exists INT;

  SELECT COUNT(*) INTO enrollment_exists
  FROM tbl_enrollments
  WHERE id = p_id;

  IF enrollment_exists = 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|Enrollment not found.';
  ELSE
    SELECT * FROM tbl_enrollments WHERE id = p_id;
  END IF;
END
`);

    // Procedure: Update Enrollment ❌ (Unused)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateEnrollment(
  IN p_id INT,
  IN p_user_id INT,
  IN p_course_id INT,
  IN p_enrolled_on DATETIME,
  IN p_status VARCHAR(50),
  IN p_updated_by INT
)
BEGIN
  DECLARE enrollment_exists INT;

  SELECT COUNT(*) INTO enrollment_exists
  FROM tbl_enrollments
  WHERE id = p_id;

  IF enrollment_exists = 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|Enrollment not found.';
  ELSE
    UPDATE tbl_enrollments
    SET 
      user_id = p_user_id,
      course_id = p_course_id,
      enrolled_on = p_enrolled_on,
      status = p_status,
      updated_by = p_updated_by,
      updated_at = NOW()
    WHERE id = p_id;
  END IF;
END
`);


    // Procedure: DeleteEnrollment ❌ (Unused)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS DeleteEnrollment(
  IN p_id INT
)
BEGIN
  DECLARE enrollment_exists INT;

  SELECT COUNT(*) INTO enrollment_exists
  FROM tbl_enrollments
  WHERE id = p_id;

  IF enrollment_exists = 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|Enrollment not found.';
  ELSE
    DELETE FROM tbl_enrollments WHERE id = p_id;
  END IF;
END
`);

    // Procedure: Create or Update Student Accessible Data based on Enrollment
    await sequelize.query(`
CREATE PROCEDURE IF NOT EXISTS createStudentAccessibleData(
  IN p_enrollment_id INT,
  IN p_user_id INT
)
BEGIN
  DECLARE v_course_id INT;
  DECLARE v_session_ids JSON;
  DECLARE v_module_ids JSON;
  DECLARE v_topic_ids JSON;
  DECLARE v_quiz_ids JSON;
  DECLARE v_assignment_ids JSON;

  -- Ensure enrollment exists and get course_id
  SELECT course_id INTO v_course_id FROM tbl_enrollments WHERE id = p_enrollment_id LIMIT 1;

  IF v_course_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|Enrollment not found.';
  END IF;

  -- Active sessions for the course
  SELECT COALESCE(JSON_ARRAYAGG(id), JSON_ARRAY())
  INTO v_session_ids
  FROM tbl_session
  WHERE course_id = v_course_id AND status = 'active';

  -- Active modules under active sessions for the course
  SELECT COALESCE(JSON_ARRAYAGG(m.id), JSON_ARRAY())
  INTO v_module_ids
  FROM tbl_modules m
  JOIN tbl_session s ON s.id = m.session_id
  WHERE m.course_id = v_course_id AND m.status = 'active' AND s.status = 'active';

  -- Active topics under those modules
  SELECT COALESCE(JSON_ARRAYAGG(t.id), JSON_ARRAY())
  INTO v_topic_ids
  FROM tbl_topics t
  WHERE t.module_id IN (
    SELECT m.id FROM tbl_modules m
    JOIN tbl_session s ON s.id = m.session_id
    WHERE m.course_id = v_course_id AND m.status = 'active' AND s.status = 'active'
  ) AND t.status = 'active';

  -- Active quizzes under those modules
  SELECT COALESCE(JSON_ARRAYAGG(q.id), JSON_ARRAY())
  INTO v_quiz_ids
  FROM tbl_quiz q
  WHERE q.module_id IN (
    SELECT m.id FROM tbl_modules m
    JOIN tbl_session s ON s.id = m.session_id
    WHERE m.course_id = v_course_id AND m.status = 'active' AND s.status = 'active'
  ) AND q.status = 'active';

  -- Active assignments under those modules
  SELECT COALESCE(JSON_ARRAYAGG(a.id), JSON_ARRAY())
  INTO v_assignment_ids
  FROM tbl_assignments a
  WHERE a.module_id IN (
    SELECT m.id FROM tbl_modules m
    JOIN tbl_session s ON s.id = m.session_id
    WHERE m.course_id = v_course_id AND m.status = 'active' AND s.status = 'active'
  ) AND a.status = 'active';

  -- Upsert student accessible data
  IF EXISTS (SELECT 1 FROM tbl_student_accessible_data WHERE enrollment_id = p_enrollment_id) THEN
    UPDATE tbl_student_accessible_data
    SET
      user_id = p_user_id,
      course_id = v_course_id,
      session_ids = v_session_ids,
      module_ids = v_module_ids,
      topic_ids = v_topic_ids,
      quiz_ids = v_quiz_ids,
      assignment_ids = v_assignment_ids,
      updated_at = NOW()
    WHERE enrollment_id = p_enrollment_id;
  ELSE
    INSERT INTO tbl_student_accessible_data (
      user_id, enrollment_id, course_id, session_ids, module_ids, topic_ids, quiz_ids, assignment_ids, created_at, updated_at
    ) VALUES (
      p_user_id, p_enrollment_id, v_course_id, v_session_ids, v_module_ids, v_topic_ids, v_quiz_ids, v_assignment_ids, NOW(), NOW()
    );
  END IF;

  SELECT * FROM tbl_student_accessible_data WHERE enrollment_id = p_enrollment_id;
END
`);

    // Procedure: Get User Course Progress (returns JSON payloads for controller to shape response)
    await sequelize.query(`DROP PROCEDURE IF EXISTS getUserCourseProgress`);
    await sequelize.query(`CREATE PROCEDURE getUserCourseProgress(
    IN p_user_id INT,
    IN p_course_public_hash VARCHAR(255)
)
BEGIN
  DECLARE v_course_id INT;
  DECLARE v_has_accessible INT DEFAULT 0;
  DECLARE v_session_ids JSON;
  DECLARE v_module_ids JSON;
  DECLARE v_topic_ids JSON;
  DECLARE v_quiz_ids JSON;
  DECLARE v_assignment_ids JSON;

  -- Resolve course
  SELECT id INTO v_course_id
  FROM tbl_courses
  WHERE public_hash = p_course_public_hash
  LIMIT 1;

  IF v_course_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Course not found.';
  END IF;

  -- Ensure student accessible data exists
  SELECT COUNT(*) INTO v_has_accessible
  FROM tbl_student_accessible_data
  WHERE user_id = p_user_id AND course_id = v_course_id;

  IF v_has_accessible = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Accessible data not initialized for user/course';
  END IF;

  -- Fetch accessible arrays
  SELECT session_ids, module_ids, topic_ids, quiz_ids, assignment_ids
    INTO v_session_ids, v_module_ids, v_topic_ids, v_quiz_ids, v_assignment_ids
  FROM tbl_student_accessible_data
  WHERE user_id = p_user_id AND course_id = v_course_id
  LIMIT 1;

  -- =====================================================================
  -- MAIN SELECT (single row with JSON payloads)
  -- =====================================================================
  SELECT
    -- user basic
    (SELECT JSON_OBJECT(
        'id', u.id,
        'full_name', u.full_name,
        'username', u.username,
        'email', u.email
      ) FROM tbl_users u WHERE u.id = p_user_id LIMIT 1) AS user_json,

    -- course basic
    (SELECT JSON_OBJECT(
        'id', c.id,
        'public_hash', c.public_hash,
        'title', c.title,
        'description', c.description,
        'thumbnail', c.thumbnail,
        'duration_minutes', c.duration_minutes,
        'created_by_type', c.created_by_type,
        'created_by', c.created_by
      ) FROM tbl_courses c WHERE c.id = v_course_id) AS course_json,

    -- enrollment summary
    (SELECT JSON_OBJECT(
        'id', e.id,
        'status', e.status,
        'user_hash', e.user_hash,
        'is_completed', e.is_completed,
        'enrollment_date', e.enrollment_date,
        'completed_at', e.completed_at,
        'completion_percentage', e.completion_percentage,
        'created_at', e.created_at,
        'updated_at', e.updated_at
      ) FROM tbl_enrollments e
       WHERE e.user_id = p_user_id AND e.course_id = v_course_id LIMIT 1) AS enrollment_json,

    -- sessions list (ordered)
    (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT('id', s.id, 'title', s.title)), JSON_ARRAY())
       FROM (
         SELECT jt.idx, jt.id
         FROM JSON_TABLE(v_session_ids, '$[*]' COLUMNS(
           idx FOR ORDINALITY,
           id INT PATH '$.id'
         )) jt
         ORDER BY jt.idx
       ) x
       JOIN tbl_session s ON s.id = x.id) AS sessions_json,

    -- modules list (ordered)
    (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT('id', m.id, 'title', m.title, 'session_id', m.session_id)), JSON_ARRAY())
       FROM (
         SELECT jt.idx, jt.id
         FROM JSON_TABLE(v_module_ids, '$[*]' COLUMNS(
           idx FOR ORDINALITY,
           id INT PATH '$.id'
         )) jt
         ORDER BY jt.idx
       ) x
       JOIN tbl_modules m ON m.id = x.id) AS modules_json,

    -- topics list (ordered)
    (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT('id', t.id, 'title', t.title, 'module_id', t.module_id)), JSON_ARRAY())
       FROM (
         SELECT jt.idx, jt.id
         FROM JSON_TABLE(v_topic_ids, '$[*]' COLUMNS(
           idx FOR ORDINALITY,
           id INT PATH '$.id'
         )) jt
         ORDER BY jt.idx
       ) x
       JOIN tbl_topics t ON t.id = x.id) AS topics_json,

    -- quizzes list (ordered)
    (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT('id', q.id, 'title', q.title, 'module_id', q.module_id)), JSON_ARRAY())
       FROM (
         SELECT jt.idx, jt.id
         FROM JSON_TABLE(v_quiz_ids, '$[*]' COLUMNS(
           idx FOR ORDINALITY,
           id INT PATH '$.id'
         )) jt
         ORDER BY jt.idx
       ) x
       JOIN tbl_quiz q ON q.id = x.id) AS quizzes_json,

    -- assignments list (ordered)
    (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT('id', a.id, 'title', a.title, 'module_id', a.module_id)), JSON_ARRAY())
       FROM (
         SELECT jt.idx, jt.id
         FROM JSON_TABLE(v_assignment_ids, '$[*]' COLUMNS(
           idx FOR ORDINALITY,
           id INT PATH '$.id'
         )) jt
         ORDER BY jt.idx
       ) x
       JOIN tbl_assignments a ON a.id = x.id) AS assignments_json,

    -- quiz attempts
    (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT(
              'attempt_id', qc.id,
              'quiz_id', qc.quizId,
              'status', qc.status,
              'is_completed', qc.isCompleted,
              'score', qc.score,
              'obtained_marks', qc.obtainedMarks,
              'total_marks', qc.totalMarks,
              'percentage', CASE WHEN qc.totalMarks > 0 THEN ROUND((qc.obtainedMarks / qc.totalMarks) * 100, 2) ELSE NULL END,
              'tried_attempts', qc.triedAttempts,
              'started_at', qc.created_at,
              'completed_at', qc.updated_at
            )), JSON_ARRAY())
       FROM tbl_quiz_completion qc
       WHERE qc.userId = p_user_id
         AND qc.triedAttempts IS NOT NULL
         AND qc.quizId IN (
          -- 1 Direct quizzes
          SELECT jt1.id
          FROM JSON_TABLE(
            v_quiz_ids,
            '$[*]' COLUMNS (
              id INT PATH '$.id'
            )
          ) jt1

          UNION

          -- 2 Topic-based quizzes
          SELECT jt2.quiz_id
          FROM JSON_TABLE(
            v_topic_ids,
            '$[*].topic_quiz[*]'
            COLUMNS (
              quiz_id INT PATH '$.id'
            )
          ) jt2
        )
    ) AS quiz_attempts_json,

    -- assignment attempts
    (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT(
              'attempt_id', ac.id,
              'assignment_id', ac.assignmentId,
              'status', ac.status,
              'is_completed', ac.isCompleted,
              'score', ac.score,
              'max_score', a.max_score,
              'percentage', ROUND((ac.score / a.max_score) * 100, 2),
              -- 'percentage', ac.score,
              'tried_attempts', ac.tried_attempts,
              'started_at', ac.created_at,
              'completed_at', ac.updated_at
            )), JSON_ARRAY())
       FROM tbl_assignment_completion ac
       INNER JOIN tbl_assignments a ON a.id = ac.assignmentId
       WHERE ac.userId = p_user_id
         AND ac.tried_attempts IS NOT NULL AND ac.tried_attempts > 0
         AND ac.assignmentId IN (
          -- 1 Direct assignments
          SELECT jt1.id
          FROM JSON_TABLE(
            v_assignment_ids,
            '$[*]' COLUMNS (
              id INT PATH '$.id'
            )
          ) jt1

          UNION

          -- 2 Topic-based assignments
          SELECT jt2.assignment_id
          FROM JSON_TABLE(
            v_topic_ids,
            '$[*].topic_assignment[*]'
            COLUMNS (
              assignment_id INT PATH '$.id'
            )
          ) jt2
        )
    ) AS assignment_attempts_json,

    -- accessible arrays (raw)
    v_session_ids    AS session_access_json,
    v_module_ids     AS module_access_json,
    -- Enhanced topic access with titles
    (SELECT COALESCE(JSON_ARRAYAGG(
        JSON_OBJECT(
            'id', t.id,
            'module_id', t.module_id,
            'topic_quiz', COALESCE(
                (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', q.id,
                        'title', q.title,  -- ADDED TITLE
                        'isComplete', tq.isComplete
                    )
                )
                 FROM JSON_TABLE(
                    j.topic_quiz,
                    '$[*]' COLUMNS(
                        id INT PATH '$.id',
                        isComplete BOOLEAN PATH '$.isComplete'
                    )
                 ) tq
                 JOIN tbl_quiz q ON q.id = tq.id
                 WHERE tq.id IS NOT NULL),
                JSON_ARRAY()
            ),
            'topic_assignment', COALESCE(
                (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', a.id,
                        'title', a.title,  -- ADDED TITLE
                        'isComplete', ta.isComplete
                    )
                )
                 FROM JSON_TABLE(
                    j.topic_assignment,
                    '$[*]' COLUMNS(
                        id INT PATH '$.id',
                        isComplete BOOLEAN PATH '$.isComplete'
                    )
                 ) ta
                 JOIN tbl_assignments a ON a.id = ta.id
                 WHERE ta.id IS NOT NULL),
                JSON_ARRAY()
            ),
            'isCompleted', j.isCompleted,
            'isAccessible', j.isAccessible,
            'isQuizExists', j.isQuizExists,
            'isAssignmentExists', j.isAssignmentExists
        )
    ), JSON_ARRAY())
     FROM JSON_TABLE(v_topic_ids, '$[*]' COLUMNS(
        id INT PATH '$.id',
        module_id INT PATH '$.module_id',
        topic_quiz JSON PATH '$.topic_quiz',
        topic_assignment JSON PATH '$.topic_assignment',
        isCompleted BOOLEAN PATH '$.isCompleted',
        isAccessible BOOLEAN PATH '$.isAccessible',
        isQuizExists BOOLEAN PATH '$.isQuizExists',
        isAssignmentExists BOOLEAN PATH '$.isAssignmentExists'
     )) j
     JOIN tbl_topics t ON t.id = j.id) AS topic_access_json,
    v_quiz_ids       AS quiz_access_json,
    v_assignment_ids AS assignment_access_json,

    -- session meta timing
    (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT(
              'session_id', sm.session_id,
              'start_at', sm.start_at,
              'last_activity_at', sm.last_activity_at,
              'completed_at', sm.completed_at
            )), JSON_ARRAY())
       FROM (
         SELECT pt.session_id,
                MIN(pt.created_at) AS start_at,
                MAX(pt.updated_at) AS last_activity_at,
                MAX(pt.updated_at) AS completed_at
         FROM tbl_progress_tracking pt
         WHERE pt.user_id = p_user_id AND pt.course_id = v_course_id AND pt.session_id IS NOT NULL
         GROUP BY pt.session_id
       ) sm
       WHERE sm.session_id IN (SELECT jt.id FROM JSON_TABLE(v_session_ids,'$[*]' COLUMNS(id INT PATH '$.id')) jt)
    ) AS session_meta_json,

    -- module meta timing
    (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT(
              'module_id', mm.module_id,
              'start_at', mm.start_at,
              'last_activity_at', mm.last_activity_at,
              'completed_at', mm.completed_at
            )), JSON_ARRAY())
       FROM (
         SELECT pt.module_id,
                MIN(pt.created_at) AS start_at,
                MAX(pt.updated_at) AS last_activity_at,
                MAX(pt.updated_at) AS completed_at
         FROM tbl_progress_tracking pt
         WHERE pt.user_id = p_user_id AND pt.course_id = v_course_id AND pt.module_id IS NOT NULL
         GROUP BY pt.module_id
       ) mm
       WHERE mm.module_id IN (SELECT jt.id FROM JSON_TABLE(v_module_ids,'$[*]' COLUMNS(id INT PATH '$.id')) jt)
    ) AS module_meta_json,

    -- ==============================
    -- TOPIC META (now with slide_id & student_time_spent)
    -- ==============================
    (SELECT COALESCE(JSON_ARRAYAGG(
              JSON_OBJECT(
                'topic_id', tm.topic_id,
                'start_at', tm.start_at,
                'last_activity_at', tm.last_activity_at,
                'completed_at', tm.effective_completed_at,
                'total_accordions', tm.tot_accordions,
                'completed_accordions', tm.completed_accordions,
                'total_slides', tm.tot_slides,
                'completed_slides', tm.completed_slides,
                'revision_count', tm.revision_count,
                'student_time_spent', tm.student_time_spent,
                'first_completion_time_spent', tm.first_completion_time_spent,
                'color_dot', tm.color_dot
              )
            ), JSON_ARRAY())
       FROM (
         SELECT 
           base.topic_id,
           base.start_at,
           base.last_activity_at,
           a.tot_accordions,
           ac.completed_accordions,
           ms.tot_slides,
           msc.completed_slides,
           tc.topic_completed,
           rc.revision_count,
           ts.student_time_spent,                     -- NEW
           fc.first_completion_time_spent,
           fc.color_dot,
           base.completed_at AS effective_completed_at
           -- CASE
           --   WHEN IFNULL(a.tot_accordions,0) > 0 THEN 
           --     CASE WHEN IFNULL(ac.completed_accordions,0) = IFNULL(a.tot_accordions,0) THEN base.last_activity_at ELSE NULL END
           --   WHEN IFNULL(ms.tot_slides,0) > 0 THEN 
           --     CASE WHEN IFNULL(msc.completed_slides,0) = IFNULL(ms.tot_slides,0) THEN base.last_activity_at ELSE NULL END
           --   ELSE 
           --     CASE WHEN tc.topic_completed = 1 THEN base.last_activity_at ELSE NULL END
           -- END AS effective_completed_at
         FROM (
           SELECT pt.topic_id,
                  MIN(pt.created_at) AS start_at,
                  MIN(pt.completed_at) AS completed_at,
                  MAX(pt.updated_at) AS last_activity_at
           FROM tbl_progress_tracking pt
           WHERE pt.user_id = p_user_id AND pt.course_id = v_course_id AND pt.topic_id IS NOT NULL
           GROUP BY pt.topic_id
         ) base
         LEFT JOIN (
           SELECT topic_id, COUNT(*) AS tot_accordions
           FROM tbl_accordions
           GROUP BY topic_id
         ) a ON a.topic_id = base.topic_id
         LEFT JOIN (
           SELECT topic_id, COUNT(*) AS completed_accordions
           FROM tbl_progress_tracking
           WHERE user_id = p_user_id AND course_id = v_course_id
             AND accordian_id IS NOT NULL AND completion_status = 'completed'
           GROUP BY topic_id
         ) ac ON ac.topic_id = base.topic_id
         LEFT JOIN (
           SELECT topic_id, COUNT(*) AS tot_slides
           FROM tbl_multi_slides
           GROUP BY topic_id
         ) ms ON ms.topic_id = base.topic_id
         LEFT JOIN (
           -- COUNT completed slides using slide_id
           SELECT topic_id, COUNT(*) AS completed_slides
           FROM tbl_progress_tracking
           WHERE user_id = p_user_id AND course_id = v_course_id
             AND slide_id IS NOT NULL AND completion_status = 'completed'
           GROUP BY topic_id
         ) msc ON msc.topic_id = base.topic_id
         LEFT JOIN (
           SELECT topic_id, MAX(CASE WHEN completion_status='completed' AND accordian_id IS NULL AND slide_id IS NULL THEN 1 ELSE 0 END) AS topic_completed
           FROM tbl_progress_tracking
           WHERE user_id = p_user_id AND course_id = v_course_id AND topic_id IS NOT NULL
           GROUP BY topic_id
         ) tc ON tc.topic_id = base.topic_id
         LEFT JOIN (
           SELECT topic_id, MAX(revision_count) AS revision_count
           FROM tbl_progress_tracking
           WHERE user_id = p_user_id AND course_id = v_course_id AND topic_id IS NOT NULL
           GROUP BY topic_id
         ) rc ON rc.topic_id = base.topic_id
         LEFT JOIN (
           SELECT topic_id, SUM(student_time_spent) AS student_time_spent
           FROM tbl_progress_tracking
           WHERE user_id = p_user_id AND course_id = v_course_id AND topic_id IS NOT NULL
           GROUP BY topic_id
         ) ts ON ts.topic_id = base.topic_id
         LEFT JOIN (
           SELECT
             topic_id,
             MAX(first_completion_time_spent) AS first_completion_time_spent,
             SUBSTRING_INDEX(GROUP_CONCAT(color_dot ORDER BY first_completion_time_spent DESC), ',', 1) AS color_dot
           FROM tbl_progress_tracking
           WHERE user_id = p_user_id
             AND course_id = v_course_id
             AND topic_id IS NOT NULL
             AND accordian_id IS NULL
             AND slide_id IS NULL
           GROUP BY topic_id
         ) fc ON fc.topic_id = base.topic_id
         WHERE base.topic_id IN (SELECT jt.id FROM JSON_TABLE(v_topic_ids,'$[*]' COLUMNS(id INT PATH '$.id')) jt)
       ) tm
    ) AS topic_meta_json,

   -- topic time map (still provided for convenience)
    (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT(
      'topic_id', tt.topic_id,
      'student_time_spent', tt.time_spent,
      'first_completion_time_spent', tt.first_completion_time_spent
    )), JSON_ARRAY())
       FROM (
         SELECT
           pt.topic_id,
           SUM(pt.student_time_spent) AS time_spent,
           MAX(CASE
             WHEN pt.accordian_id IS NULL AND pt.slide_id IS NULL
               THEN COALESCE(pt.first_completion_time_spent, 0)
             ELSE 0
           END) AS first_completion_time_spent
         FROM tbl_progress_tracking pt
         JOIN (SELECT jt.id FROM JSON_TABLE(v_topic_ids, '$[*]' COLUMNS(id INT PATH '$.id')) jt) tl ON tl.id = pt.topic_id
         WHERE pt.user_id = p_user_id AND pt.course_id = v_course_id
         GROUP BY pt.topic_id
       ) tt) AS topic_times_json,

    -- NEW: Detailed per-slide progress (title + time spent) for all accessible slide topics
    (SELECT COALESCE(JSON_ARRAYAGG(
              JSON_OBJECT(
                'topic_id', sd.topic_id,
                'slide_id', sd.slide_id,
                'title', sd.title,
                'timeSpentSeconds', sd.time_spent,
                'firstCompletionTimeSpent', sd.first_completion_time_spent,
                'colorDot', sd.color_dot,
                'completedAt', sd.completed_at,
                'createdAt', sd.created_at,
                'status', sd.completion_status,
                'revision_count', sd.revision_count
              )
            ), JSON_ARRAY())
       FROM (
         -- Slides with progress
         SELECT 
           pt.topic_id,
           pt.slide_id,
           ms.title,
           COALESCE(SUM(pt.student_time_spent), 0) AS time_spent,
           COALESCE(MAX(pt.first_completion_time_spent), 0) AS first_completion_time_spent,
           SUBSTRING_INDEX(GROUP_CONCAT(pt.color_dot ORDER BY pt.first_completion_time_spent DESC), ',', 1) AS color_dot,
           MAX(pt.completed_at) AS completed_at,
           MIN(pt.created_at) AS created_at,
           MAX(pt.revision_count) AS revision_count,
           MAX(pt.completion_status) AS completion_status
         FROM tbl_progress_tracking pt
         JOIN tbl_multi_slides ms ON ms.id = pt.slide_id
         WHERE pt.user_id = p_user_id 
           AND pt.course_id = v_course_id 
           AND pt.slide_id IS NOT NULL
           AND pt.topic_id IN (SELECT jt.id FROM JSON_TABLE(v_topic_ids, '$[*]' COLUMNS(id INT PATH '$.id')) jt)
         GROUP BY pt.topic_id, pt.slide_id, ms.title

         UNION ALL

         -- Slides with NO progress (time = 0)
         SELECT 
           ms.topic_id,
           ms.id AS slide_id,
           ms.title,
           0 AS time_spent,
           0 AS first_completion_time_spent,
           'red' AS color_dot,
           NULL AS completed_at,
           NULL AS created_at,
           NULL AS revision_count,
           NULL AS completion_status
         FROM tbl_multi_slides ms
         WHERE ms.topic_id IN (SELECT jt.id FROM JSON_TABLE(v_topic_ids, '$[*]' COLUMNS(id INT PATH '$.id')) jt)
           AND NOT EXISTS (
             SELECT 1 FROM tbl_progress_tracking pt2
             WHERE pt2.user_id = p_user_id 
               AND pt2.course_id = v_course_id 
               AND pt2.slide_id = ms.id
           )
       ) sd
       ORDER BY sd.topic_id, sd.slide_id
    ) AS slide_details_json;

END`);

    // Procedure: GetUserCoursesWithRawCourses ✅ (Tested)
    await sequelize.query(`DROP PROCEDURE IF EXISTS getUserCoursesWithRawCourses`);
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getUserCoursesWithRawCourses(
  IN p_user_id INT,
  IN p_status VARCHAR(50)
)
BEGIN
  IF EXISTS (
    SELECT 1 FROM tbl_enrollments WHERE user_id = p_user_id
  ) THEN
    SELECT 
      e.user_hash,
      e.status,
      e.certificate_url,
      e.is_completed,
      e.completion_percentage,
      c.id AS course_id,
      c.public_hash,
      c.title,
      c.description,
      c.thumbnail,
      c.price,
      c.duration_minutes,
      c.category_id,
      cat.category AS category_name
    FROM tbl_enrollments e
    INNER JOIN tbl_courses c ON e.course_id = c.id
    LEFT JOIN tbl_course_categories cat ON c.category_id = cat.id
    WHERE e.user_id = p_user_id 
    AND (
      p_status IS NULL OR p_status = 'all' OR
      (p_status = 'active' AND (e.is_completed = 0 OR e.is_completed IS NULL)) OR
      (p_status = 'completed' AND e.is_completed = 1)
    );
  ELSE
    SELECT 
      NULL AS user_hash,
      NULL AS status,
      NULL AS certificate_url,
      NULL AS is_completed,
      NULL AS completion_percentage,
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
END
`);


    // Procedure: GetUserCourseEnrollment ✅ (Tested)
    await sequelize.query(`DROP PROCEDURE IF EXISTS getUserCourseEnrollment`);

    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS getUserCourseEnrollment(
  IN p_user_id INT,
  IN p_course_public_hash VARCHAR(255)
)
BEGIN
  DECLARE v_course_id INT;

  -- Check if course exists and get its ID
  SELECT id INTO v_course_id
  FROM tbl_courses
  WHERE public_hash = p_course_public_hash
  LIMIT 1;

  IF v_course_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|Course not Found.',
    MYSQL_ERRNO = 4001;
  END IF;

  -- Get user enrollment
  SELECT *
  FROM tbl_enrollments
  WHERE user_id = p_user_id AND course_id = v_course_id;
END 
`);

    // Procedure: GetUserCourseByHashId ✅ (Tested)
    await sequelize.query(`DROP PROCEDURE IF EXISTS getUserCourseByHashId`)
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS getUserCourseByHashId(
  IN p_user_id INT,
  IN p_user_hash VARCHAR(255)
)
BEGIN
  DECLARE v_course_id INT;

  -- Get course_id from user_hash
  SELECT course_id INTO v_course_id
  FROM tbl_enrollments
  WHERE user_id = p_user_id AND user_hash = p_user_hash
  LIMIT 1;

  IF v_course_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|No active enrollment found for this hash ID.',
    MYSQL_ERRNO = 4001;
  END IF;

  -- Fetch the course details by primary key
  SELECT c.*, e.id AS enrollment_id, e.certificate_url
  FROM tbl_courses c
  JOIN tbl_enrollments e ON c.id = e.course_id
  WHERE e.user_id = p_user_id AND e.user_hash = p_user_hash
  LIMIT 1;
END 
`);

    //Procedure: GetStudentEnrollmentInCourse
    await sequelize.query(`DROP PROCEDURE IF EXISTS GetStudentEnrollmentInCourse`);
    await sequelize.query(`
      CREATE PROCEDURE GetStudentEnrollmentInCourse(
      IN p_student_id INT,
      IN p_course_id INT
      )
      BEGIN
        SELECT id, course_id, status, created_at
        FROM tbl_enrollments
        WHERE course_id = p_course_id AND user_id = p_student_id;
      END
      `);

    console.log("✅ Enrollment procedures created!");
  } catch (error) {
    console.error("error :", error);
  }
};

module.exports = setupEnrollmentProcedures;
