const sequelize = require("../../config/db");

const setupNewProgressTrackingProcedures = async () => {
    try {
        console.log("🔄 Setting up New Progress Tracking procedures...");

        // await sequelize.query(`ALTER TABLE tbl_progress_tracking
        //     ADD COLUMN IF NOT EXISTS first_completion_time_spent INT NOT NULL DEFAULT 0 AFTER student_time_spent`);
        // await sequelize.query(`ALTER TABLE tbl_progress_tracking
        //     ADD COLUMN IF NOT EXISTS color_dot ENUM('red','blue','yellow') NOT NULL DEFAULT 'red' AFTER first_completion_time_spent`);
        // await sequelize.query(`ALTER TABLE tbl_progress_tracking
        //     ADD COLUMN IF NOT EXISTS first_completion_locked TINYINT(1) NOT NULL DEFAULT 0 AFTER color_dot`);

        await sequelize.query('DROP PROCEDURE IF EXISTS getAccessibleSessionsByCourseId')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAccessibleSessionsByCourseId(
    IN p_user_id INT,
    IN p_course_id INT
)
BEGIN
    DECLARE v_session_ids JSON;

    -- Get session_ids JSON from student_accessible_data
    SELECT session_ids
    INTO v_session_ids
    FROM tbl_student_accessible_data
    WHERE user_id = p_user_id
      AND course_id = p_course_id
    LIMIT 1;

    -- If no accessible data found, raise NOT FOUND error
    IF v_session_ids IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|No accessible data found for this user and course.';
    ELSE
        -- Return all sessions with accessibility & completion flags
        SELECT 
            s.id,
            s.title,
            COALESCE(
                (
                    SELECT CASE 
                               WHEN LOWER(j.isAccessible) IN ('true','1') THEN 1
                               ELSE 0
                           END
                    FROM JSON_TABLE(v_session_ids, '$[*]' COLUMNS (
                        id INT PATH '$.id',
                        isAccessible VARCHAR(10) PATH '$.isAccessible',
                        isCompleted VARCHAR(10) PATH '$.isCompleted'
                    )) j
                    WHERE j.id = s.id
                    LIMIT 1
                ), 0
            ) AS isAccessible,
            COALESCE(
                (
                    SELECT CASE 
                               WHEN LOWER(j.isCompleted) IN ('true','1') THEN 1
                               ELSE 0
                           END
                    FROM JSON_TABLE(v_session_ids, '$[*]' COLUMNS (
                        id INT PATH '$.id',
                        isAccessible VARCHAR(10) PATH '$.isAccessible',
                        isCompleted VARCHAR(10) PATH '$.isCompleted'
                    )) j
                    WHERE j.id = s.id
                    LIMIT 1
                ), 0
            ) AS isCompleted
        FROM tbl_session s
        WHERE s.course_id = p_course_id
        AND s.id IN (
            SELECT j.id
            FROM JSON_TABLE(v_session_ids, '$[*]' COLUMNS (
                id INT PATH '$.id'
            )) j
        )
        ORDER BY (
            SELECT j.row_num
            FROM JSON_TABLE(v_session_ids, '$[*]' COLUMNS (
                id INT PATH '$.id',
                row_num FOR ORDINALITY
            )) j
            WHERE j.id = s.id
        ) ASC;
    END IF;
END`)

        await sequelize.query('DROP PROCEDURE IF EXISTS getAccessibleModulesBySessionId')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAccessibleModulesBySessionId(
    IN p_user_id INT,
    IN p_course_id INT,
    IN p_session_id INT
)
BEGIN
    DECLARE v_module_ids JSON;

    -- Get module_ids JSON from student_accessible_data
    SELECT module_ids
    INTO v_module_ids
    FROM tbl_student_accessible_data
    WHERE user_id = p_user_id
      AND course_id = p_course_id
    LIMIT 1;

    -- If no accessible data found, raise NOT FOUND error
    IF v_module_ids IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|No accessible module data found for this user.';
    ELSE
        -- Return all modules that match the given session and exist in accessible data
        SELECT 
            m.id,
            m.title,
            m.duration_minutes,
            m.status,
            COALESCE(
                (
                    SELECT CASE 
                               WHEN LOWER(j.isAccessible) IN ('true','1') THEN 1
                               ELSE 0
                           END
                    FROM JSON_TABLE(v_module_ids, '$[*]' COLUMNS (
                        id INT PATH '$.id',
                        session_id INT PATH '$.session_id',
                        isAccessible VARCHAR(10) PATH '$.isAccessible',
                        isCompleted VARCHAR(10) PATH '$.isCompleted'
                    )) j
                    WHERE j.id = m.id AND j.session_id = p_session_id
                    LIMIT 1
                ), 0
            ) AS isAccessible,
            COALESCE(
                (
                    SELECT CASE 
                               WHEN LOWER(j.isCompleted) IN ('true','1') THEN 1
                               ELSE 0
                           END
                    FROM JSON_TABLE(v_module_ids, '$[*]' COLUMNS (
                        id INT PATH '$.id',
                        session_id INT PATH '$.session_id',
                        isAccessible VARCHAR(10) PATH '$.isAccessible',
                        isCompleted VARCHAR(10) PATH '$.isCompleted'
                    )) j
                    WHERE j.id = m.id AND j.session_id = p_session_id
                    LIMIT 1
                ), 0
            ) AS isCompleted
        FROM tbl_modules m
        WHERE m.session_id = p_session_id
          AND m.id IN (
              SELECT j.id
              FROM JSON_TABLE(v_module_ids, '$[*]' COLUMNS (
                  id INT PATH '$.id',
                  session_id INT PATH '$.session_id'
              )) j
              WHERE j.session_id = p_session_id
          )
        ORDER BY (
            SELECT j.row_num
            FROM JSON_TABLE(v_module_ids, '$[*]' COLUMNS (
                id INT PATH '$.id',
                row_num FOR ORDINALITY
            )) j
            WHERE j.id = m.id
        ) ASC;
    END IF;
END`)


        await sequelize.query('DROP PROCEDURE IF EXISTS getAccessibleTopicsByModuleId')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAccessibleTopicsByModuleId (
    IN p_user_id INT,
    IN p_course_id INT,
    IN p_module_id INT
)
BEGIN
    DECLARE v_topic_ids JSON;
    DECLARE v_quiz_ids JSON;
    DECLARE v_assignment_ids JSON;

    -- Validate inputs
    IF p_user_id IS NULL OR p_module_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E400|BadRequest|User ID and Module ID are required';
    END IF;

    -- Fetch JSON columns (topics, quizzes, assignments if available)
    SELECT topic_ids, quiz_ids, assignment_ids
    INTO v_topic_ids, v_quiz_ids, v_assignment_ids
    FROM tbl_student_accessible_data
    WHERE user_id = p_user_id AND course_id = p_course_id
    LIMIT 1;

    IF v_topic_ids IS NULL AND v_quiz_ids IS NULL AND v_assignment_ids IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|No accessible data found for this user';
    END IF;

    -- Temporary tables (use TINYINT for boolean flags)
    DROP TEMPORARY TABLE IF EXISTS tmp_accessible_topics;
    DROP TEMPORARY TABLE IF EXISTS tmp_accessible_quizzes;
    DROP TEMPORARY TABLE IF EXISTS tmp_accessible_assignments;
    
    -- Temp tables for topic-content linkage (extracted from JSON)
    DROP TEMPORARY TABLE IF EXISTS tmp_topic_linked_quizzes;
    DROP TEMPORARY TABLE IF EXISTS tmp_topic_linked_assignments;

    CREATE TEMPORARY TABLE tmp_accessible_topics (
        topic_id INT PRIMARY KEY,
        isAccessible TINYINT(1),
        isCompleted TINYINT(1)
    );

    CREATE TEMPORARY TABLE tmp_accessible_quizzes (
        quiz_id INT PRIMARY KEY,
        isCompleted TINYINT(1)
    );

    CREATE TEMPORARY TABLE tmp_accessible_assignments (
        assignment_id INT PRIMARY KEY,
        isCompleted TINYINT(1)
    );

    CREATE TEMPORARY TABLE tmp_topic_linked_quizzes (
        topic_id INT,
        quiz_id INT,
        isCompleted BOOLEAN
    );

    CREATE TEMPORARY TABLE tmp_topic_linked_assignments (
        topic_id INT,
        assignment_id INT,
        isCompleted BOOLEAN
    );

    -- Insert topics (casting booleans as INT)
    IF v_topic_ids IS NOT NULL THEN
        INSERT IGNORE INTO tmp_accessible_topics (topic_id, isAccessible, isCompleted)
        SELECT jt.id, jt.isAccessible, jt.isCompleted
        FROM JSON_TABLE(
            v_topic_ids,
            '$[*]' COLUMNS (
                id INT PATH '$.id',
                module_id INT PATH '$.module_id',
                isAccessible INT PATH '$.isAccessible',
                isCompleted INT PATH '$.isCompleted'
            )
        ) AS jt
        WHERE jt.module_id = p_module_id;

        -- Populate Topic Linked Quizzes (from topic_quiz array in JSON)
        INSERT INTO tmp_topic_linked_quizzes (topic_id, quiz_id, isCompleted)
        SELECT jt.id, jt.quiz_id, jt.isComplete
        FROM JSON_TABLE(
            v_topic_ids,
            '$[*]' COLUMNS (
                id INT PATH '$.id',
                module_id INT PATH '$.module_id',
                NESTED PATH '$.topic_quiz[*]' COLUMNS (
                    quiz_id INT PATH '$.id',
                    isComplete BOOLEAN PATH '$.isComplete'
                )
            )
        ) AS jt
        WHERE jt.module_id = p_module_id AND jt.quiz_id IS NOT NULL;

        -- Populate Topic Linked Assignments (from topic_assignment array in JSON)
        INSERT INTO tmp_topic_linked_assignments (topic_id, assignment_id, isCompleted)
        SELECT jt.id, jt.assignment_id, jt.isComplete
        FROM JSON_TABLE(
            v_topic_ids,
            '$[*]' COLUMNS (
                id INT PATH '$.id',
                module_id INT PATH '$.module_id',
                NESTED PATH '$.topic_assignment[*]' COLUMNS (
                    assignment_id INT PATH '$.id',
                    isComplete BOOLEAN PATH '$.isComplete'
                )
            )
        ) AS jt
        WHERE jt.module_id = p_module_id AND jt.assignment_id IS NOT NULL;
    END IF;

    -- Extract top-level quiz_ids for completion status
    IF v_quiz_ids IS NOT NULL THEN
        INSERT IGNORE INTO tmp_accessible_quizzes (quiz_id, isCompleted)
        SELECT jq.id, jq.isCompleted
        FROM JSON_TABLE(
            v_quiz_ids,
            '$[*]' COLUMNS (
                id INT PATH '$.id',
                module_id INT PATH '$.module_id',
                isCompleted INT PATH '$.isCompleted'
            )
        ) AS jq
        WHERE jq.module_id = p_module_id AND jq.id IS NOT NULL;
    END IF;

    -- Extract top-level assignment_ids for completion status
    IF v_assignment_ids IS NOT NULL THEN
        INSERT IGNORE INTO tmp_accessible_assignments (assignment_id, isCompleted)
        SELECT aj.id, aj.isCompleted
        FROM JSON_TABLE(
            v_assignment_ids,
            '$[*]' COLUMNS (
                id INT PATH '$.id',
                module_id INT PATH '$.module_id',
                isCompleted INT PATH '$.isCompleted'
            )
        ) AS aj
        WHERE aj.module_id = p_module_id AND aj.id IS NOT NULL;
    END IF;

    -- Final output: topics + linked quizzes/assignments from JSON
    SELECT 
        t.id,
        t.title,
        t.description,
        t.content_type,
        t.topic_duration,
        t.extra_duration,
        t.total_duration,
        COALESCE(at.isAccessible, 0) AS isAccessible,
        COALESCE(at.isCompleted, 0) AS isCompleted,
        COALESCE(
            (
              SELECT JSON_ARRAYAGG(
                  JSON_OBJECT('id', q.id, 'title', q.title, 'isCompleted', CASE WHEN tlq.isCompleted = 1 THEN CAST(TRUE AS JSON) ELSE CAST(FALSE AS JSON) END)
              )
              FROM tmp_topic_linked_quizzes tlq
              JOIN tbl_quiz q ON q.id = tlq.quiz_id
              -- LEFT JOIN tmp_accessible_quizzes aq ON aq.quiz_id = q.id
              WHERE tlq.topic_id = t.id AND q.id IS NOT NULL
            ), JSON_ARRAY()
        ) AS quizzes,
        COALESCE(
            (
              SELECT JSON_ARRAYAGG(
                  JSON_OBJECT('id', a.id, 'title', a.title, 'isCompleted', CASE WHEN tla.isCompleted = 1 THEN CAST(TRUE AS JSON) ELSE CAST(FALSE AS JSON) END)
              )
              FROM tmp_topic_linked_assignments tla
              JOIN tbl_assignments a ON a.id = tla.assignment_id
              -- LEFT JOIN tmp_accessible_assignments aa ON aa.assignment_id = a.id
              WHERE tla.topic_id = t.id AND a.id IS NOT NULL
            ), JSON_ARRAY()
        ) AS assignments
    FROM tbl_topics t
    LEFT JOIN tmp_accessible_topics at ON at.topic_id = t.id
    WHERE t.module_id = p_module_id
      AND at.topic_id IS NOT NULL
    ORDER BY (
        SELECT j.row_num
        FROM JSON_TABLE(v_topic_ids, '$[*]' COLUMNS (
            id INT PATH '$.id',
            row_num FOR ORDINALITY
        )) j
        WHERE j.id = at.topic_id
    ) ASC;

    DROP TEMPORARY TABLE IF EXISTS tmp_accessible_topics;
    DROP TEMPORARY TABLE IF EXISTS tmp_accessible_quizzes;
    DROP TEMPORARY TABLE IF EXISTS tmp_accessible_assignments;
    DROP TEMPORARY TABLE IF EXISTS tmp_topic_linked_quizzes;
    DROP TEMPORARY TABLE IF EXISTS tmp_topic_linked_assignments;
END;
`)

        await sequelize.query('DROP PROCEDURE IF EXISTS getAccessibleQuizzesByModuleId')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAccessibleQuizzesByModuleId(
    IN p_user_id INT,
    IN p_course_id INT,
    IN p_module_id INT
)
BEGIN
    DECLARE v_quiz_ids JSON;

    -- Get quiz_ids JSON from student_accessible_data
    SELECT quiz_ids
    INTO v_quiz_ids
    FROM tbl_student_accessible_data
    WHERE user_id = p_user_id
      AND course_id = p_course_id
    LIMIT 1;

    -- If no accessible data found
    IF v_quiz_ids IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|No accessible data found for this user';
    ELSE
        -- Get quizzes already used in topic content
        CREATE TEMPORARY TABLE tmp_excluded_quizzes
        SELECT DISTINCT quiz_id
        FROM tbl_topic_content
        WHERE module_id = p_module_id
          AND quiz_id IS NOT NULL;

        -- Return accessible quizzes not excluded
        SELECT 
            q.id,
            q.title,
            COALESCE(
                (
                    SELECT CASE 
                               WHEN LOWER(j.isAccessible) IN ('true','1') THEN 1
                               ELSE 0
                           END
                    FROM JSON_TABLE(v_quiz_ids, '$[*]' COLUMNS (
                        id INT PATH '$.id',
                        module_id INT PATH '$.module_id',
                        isAccessible VARCHAR(10) PATH '$.isAccessible',
                        isCompleted VARCHAR(10) PATH '$.isCompleted'
                    )) j
                    WHERE j.id = q.id AND j.module_id = p_module_id
                    LIMIT 1
                ), 0
            ) AS isAccessible,
            COALESCE(
                (
                    SELECT CASE 
                               WHEN LOWER(j.isCompleted) IN ('true','1') THEN 1
                               ELSE 0
                           END
                    FROM JSON_TABLE(v_quiz_ids, '$[*]' COLUMNS (
                        id INT PATH '$.id',
                        module_id INT PATH '$.module_id',
                        isAccessible VARCHAR(10) PATH '$.isAccessible',
                        isCompleted VARCHAR(10) PATH '$.isCompleted'
                    )) j
                    WHERE j.id = q.id AND j.module_id = p_module_id
                    LIMIT 1
                ), 0
            ) AS isCompleted
        FROM tbl_quiz q
        WHERE q.module_id = p_module_id
          AND q.id NOT IN (SELECT quiz_id FROM tmp_excluded_quizzes)
          AND q.id IN (
                    SELECT j.id
                    FROM JSON_TABLE(v_quiz_ids, '$[*]' COLUMNS (
                        id INT PATH '$.id',
                        module_id INT PATH '$.module_id'
                    )) j
                    WHERE j.module_id = p_module_id
                )
        ORDER BY q.created_at ASC;

        DROP TEMPORARY TABLE IF EXISTS tmp_excluded_quizzes;
    END IF;
END;`)

        await sequelize.query('DROP PROCEDURE IF EXISTS getAccessibleAssignmentsByModuleId')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAccessibleAssignmentsByModuleId(
    IN p_user_id INT,
    IN p_course_id INT,
    IN p_module_id INT
)
BEGIN
    DECLARE v_assignment_ids JSON;

    -- Get assignment_ids JSON from student_accessible_data
    SELECT assignment_ids
    INTO v_assignment_ids
    FROM tbl_student_accessible_data
    WHERE user_id = p_user_id
      AND course_id = p_course_id
    LIMIT 1;

    -- If no accessible data found
    IF v_assignment_ids IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|No accessible data found for this user';
    ELSE
        -- Collect assignments already used in topic content
        CREATE TEMPORARY TABLE tmp_excluded_assignments
        SELECT DISTINCT assignment_id
        FROM tbl_topic_content
        WHERE module_id = p_module_id
          AND assignment_id IS NOT NULL;

        -- Return accessible assignments not excluded
        SELECT 
            a.id,
            a.title,
            a.description,
            COALESCE(
                (
                    SELECT CASE 
                               WHEN LOWER(j.isAccessible) IN ('true','1') THEN 1
                               ELSE 0
                           END
                    FROM JSON_TABLE(v_assignment_ids, '$[*]' COLUMNS (
                        id INT PATH '$.id',
                        module_id INT PATH '$.module_id',
                        isAccessible VARCHAR(10) PATH '$.isAccessible',
                        isCompleted VARCHAR(10) PATH '$.isCompleted'
                    )) j
                    WHERE j.id = a.id AND j.module_id = p_module_id
                    LIMIT 1
                ), 0
            ) AS isAccessible,
            COALESCE(
                (
                    SELECT CASE 
                               WHEN LOWER(j.isCompleted) IN ('true','1') THEN 1
                               ELSE 0
                           END
                    FROM JSON_TABLE(v_assignment_ids, '$[*]' COLUMNS (
                        id INT PATH '$.id',
                        module_id INT PATH '$.module_id',
                        isAccessible VARCHAR(10) PATH '$.isAccessible',
                        isCompleted VARCHAR(10) PATH '$.isCompleted'
                    )) j
                    WHERE j.id = a.id AND j.module_id = p_module_id
                    LIMIT 1
                ), 0
            ) AS isCompleted
        FROM tbl_assignments a
        WHERE a.module_id = p_module_id
          AND a.id NOT IN (SELECT assignment_id FROM tmp_excluded_assignments)
          AND a.id IN (
                SELECT j.id
                FROM JSON_TABLE(v_assignment_ids, '$[*]' COLUMNS (
                    id INT PATH '$.id',
                    module_id INT PATH '$.module_id'
                )) j
                WHERE j.module_id = p_module_id
            )
        ORDER BY a.created_at ASC;

        DROP TEMPORARY TABLE IF EXISTS tmp_excluded_assignments;
    END IF;
END;`)

        await sequelize.query('DROP PROCEDURE IF EXISTS markTopicAsCompleted')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS markTopicAsCompleted(
    IN p_user_id INT,
    IN p_course_id INT,
    IN p_topic_id INT
)
BEGIN
    DECLARE v_module_id INT;
    DECLARE v_session_id BIGINT;
    DECLARE v_accessible_id INT;
    DECLARE v_topic_ids JSON;
    DECLARE v_quiz_ids JSON;
    DECLARE v_assignment_ids JSON;
    DECLARE v_is_last_topic BOOLEAN DEFAULT FALSE;
    DECLARE v_next_topic_id INT DEFAULT NULL;
    DECLARE v_revision_count INT DEFAULT 0;
    DECLARE v_progress_id INT;
    DECLARE v_completion_status VARCHAR(255);
    DECLARE v_original_topic_id INT;
    DECLARE v_copied_json JSON;
    DECLARE v_original_course_id INT;
    DECLARE v_original_accessible_id INT;
    DECLARE v_original_topic_ids JSON;
    DECLARE v_original_next_topic_id INT DEFAULT NULL;
    DECLARE v_original_cur_index INT DEFAULT NULL;
    DECLARE v_original_total INT DEFAULT NULL;
    DECLARE v_required_duration_seconds INT DEFAULT 0;

    -- 1. Get topic and original_topic_id
    SELECT 
        module_id,
        COALESCE(original_topic_id, id)
    INTO 
        v_module_id,
        v_original_topic_id
    FROM tbl_topics
    WHERE id = p_topic_id
    LIMIT 1;

    IF v_module_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Topic not found';
    END IF;

    SELECT session_id
    INTO v_session_id
    FROM tbl_modules
    WHERE id = v_module_id
    LIMIT 1;

    SELECT COALESCE(ROUND(topic_duration * 60), 0)
    INTO v_required_duration_seconds
    FROM tbl_topics
    WHERE id = p_topic_id
    LIMIT 1;

    -- get copied list
    SELECT copied_id
    INTO v_copied_json
    FROM tbl_content_mapping
    WHERE type='topic' AND original_id=v_original_topic_id
    LIMIT 1;

    -- 2. Get student accessible data for THIS COURSE ONLY
    SELECT id, topic_ids, quiz_ids, assignment_ids
    INTO v_accessible_id, v_topic_ids, v_quiz_ids, v_assignment_ids
    FROM tbl_student_accessible_data
    WHERE user_id = p_user_id AND course_id = p_course_id
    LIMIT 1;

    IF v_accessible_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|No accessible data found for this user';
    END IF;


    -- 3. Handle progress tracking
    SELECT revision_count
    INTO v_revision_count
    FROM tbl_progress_tracking
    WHERE user_id=p_user_id AND topic_id=p_topic_id AND completion_status='completed'
    LIMIT 1;

    IF v_revision_count IS NOT NULL THEN
        UPDATE tbl_progress_tracking
        SET revision_count = revision_count + 1
        WHERE user_id=p_user_id AND topic_id=p_topic_id
          AND completion_status='completed'
          AND accordian_id IS NULL AND slide_id IS NULL;
    END IF;

    SELECT id,completion_status
    INTO v_progress_id, v_completion_status
    FROM tbl_progress_tracking
    WHERE user_id = p_user_id
      AND course_id = p_course_id
      AND topic_id = p_topic_id
      AND accordian_id IS NULL
      AND slide_id IS NULL
    ORDER BY id ASC
    LIMIT 1;

    IF v_progress_id IS NULL THEN
        INSERT INTO tbl_progress_tracking (
            user_id, course_id, session_id, module_id, topic_id, accordian_id, slide_id,
            student_time_spent, topic_timer_time_spent, first_completion_time_spent, color_dot, first_completion_locked,
            completion_status, completed_at, created_by, updated_by, created_at, updated_at
        ) VALUES (
            p_user_id, p_course_id, v_session_id, v_module_id, p_topic_id, NULL, NULL,
            0, 0, 0,
            CASE
                WHEN v_required_duration_seconds <= 0 THEN 'red'
                ELSE 'red'
            END,
            0,
            'completed', NOW(), p_user_id, p_user_id, NOW(), NOW()
        );
    ELSEIF v_completion_status != 'completed' THEN
        UPDATE tbl_progress_tracking
        SET completion_status='completed',
            first_completion_time_spent = COALESCE(first_completion_time_spent, 0),
            color_dot = CASE
                WHEN COALESCE(first_completion_time_spent, 0) = 0 THEN 'red'
                WHEN COALESCE(first_completion_time_spent, 0) < v_required_duration_seconds THEN 'red'
                WHEN ABS(COALESCE(first_completion_time_spent, 0) - v_required_duration_seconds) <= 2 THEN 'blue'
                ELSE 'yellow'
            END,
            completed_at=NOW(),
            updated_by=p_user_id,
            updated_at=NOW()
        WHERE id=v_progress_id;
    END IF;

    -- 4. Build ordered topics for this module
    DROP TEMPORARY TABLE IF EXISTS tmp_topics;

    CREATE TEMPORARY TABLE tmp_topics
    SELECT jt.id, jt.module_id, jt.isAccessible, jt.isCompleted, jt.row_num
    FROM JSON_TABLE(v_topic_ids,'$[*]'
        COLUMNS(
            id INT PATH '$.id',
            module_id INT PATH '$.module_id',
            isAccessible VARCHAR(10) PATH '$.isAccessible',
            isCompleted BOOLEAN PATH '$.isCompleted',
            row_num FOR ORDINALITY
        )
    ) jt
    WHERE jt.module_id = v_module_id
    ORDER BY jt.row_num;

    -- 5. Mark copied-topic completed (but not unlock next topic)
    IF v_copied_json IS NOT NULL THEN
    
        CREATE TEMPORARY TABLE tmp_copied_topics AS
        SELECT jt.topic_id, jt.course_id
        FROM JSON_TABLE(v_copied_json,'$[*]'
            COLUMNS(
                topic_id INT PATH '$.topic_id',
                course_id INT PATH '$.course_id'
            )
        ) jt;

        UPDATE tbl_student_accessible_data sad
        JOIN tmp_copied_topics tct ON sad.course_id=tct.course_id
        SET sad.topic_ids = (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', j.id,
                    'module_id', j.module_id,
                    'isAccessible',
                        CASE 
                            WHEN j.id = tct.topic_id THEN CAST(TRUE AS JSON)   
                            WHEN LOWER(j.isAccessible) IN ('true', '1') THEN CAST(TRUE AS JSON)
                            ELSE CAST(FALSE AS JSON)
                        END,
                    'isCompleted',
                        CASE
                            WHEN j.id = tct.topic_id THEN CAST(TRUE AS JSON)   -- already working
                            WHEN j.isCompleted THEN CAST(TRUE AS JSON)
                            ELSE CAST(FALSE AS JSON)
                        END,
                    'isQuizExists', CASE WHEN j.isQuizExists THEN CAST(TRUE AS JSON) ELSE CAST(FALSE AS JSON) END,
                    'isAssignmentExists', CASE WHEN j.isAssignmentExists THEN CAST(TRUE AS JSON) ELSE CAST(FALSE AS JSON) END,
                    'topic_quiz', j.topic_quiz,
                    'topic_assignment', j.topic_assignment
                )
            )
            FROM JSON_TABLE(sad.topic_ids,'$[*]'
                COLUMNS(
                    id INT PATH '$.id',
                    module_id INT PATH '$.module_id',
                    isAccessible VARCHAR(10) PATH '$.isAccessible',
                    isCompleted BOOLEAN PATH '$.isCompleted',
                    isQuizExists BOOLEAN PATH '$.isQuizExists',
                    isAssignmentExists BOOLEAN PATH '$.isAssignmentExists',
                    topic_quiz JSON PATH '$.topic_quiz',
                    topic_assignment JSON PATH '$.topic_assignment'
                )
            ) j
        );

        DROP TEMPORARY TABLE IF EXISTS tmp_copied_topics;
    END IF;

    IF v_copied_json IS NOT NULL THEN
        -- Extract all copied topic + course IDs
        CREATE TEMPORARY TABLE tmp_copied_topics2 AS
        SELECT jt.topic_id, jt.course_id
        FROM JSON_TABLE(v_copied_json,'$[*]'
            COLUMNS(
                topic_id INT PATH '$.topic_id',
                course_id INT PATH '$.course_id'
            )
        ) jt;

        -- Loop each copied course
        BEGIN
            DECLARE done INT DEFAULT FALSE;
            DECLARE c_topic_id INT;
            DECLARE c_course_id INT;

            DECLARE cur CURSOR FOR 
                SELECT topic_id, course_id FROM tmp_copied_topics2;

            DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

            OPEN cur;

            copied_loop: LOOP
                FETCH cur INTO c_topic_id, c_course_id;
                IF done THEN LEAVE copied_loop; END IF;

                -- Fetch its student accessible record
                SELECT topic_ids INTO @ctopicjson
                FROM tbl_student_accessible_data
                WHERE user_id = p_user_id AND course_id = c_course_id
                LIMIT 1;

                IF @ctopicjson IS NULL THEN
                    ITERATE copied_loop;
                END IF;

                -- Build ordered topics for that module
                DROP TEMPORARY TABLE IF EXISTS tmp_copied_mod_topics;

                CREATE TEMPORARY TABLE tmp_copied_mod_topics
                SELECT jt.id, jt.module_id, jt.isAccessible, jt.isCompleted, jt.row_num
                FROM JSON_TABLE(@ctopicjson,'$[*]'
                    COLUMNS(
                        id INT PATH '$.id',
                        module_id INT PATH '$.module_id',
                        isAccessible VARCHAR(10) PATH '$.isAccessible',
                        isCompleted BOOLEAN PATH '$.isCompleted',
                        row_num FOR ORDINALITY
                    )
                ) jt
                WHERE jt.module_id = v_module_id
                ORDER BY jt.row_num;

                -- Find index and next topic
                SELECT row_num INTO @cop_cur_idx
                FROM tmp_copied_mod_topics WHERE id = c_topic_id;

                SET @cop_next_topic_id = NULL;
                SELECT id INTO @cop_next_topic_id
                FROM tmp_copied_mod_topics
                WHERE row_num > @cop_cur_idx AND (isCompleted IS FALSE OR isCompleted = 0)
                ORDER BY row_num ASC 
                LIMIT 1;

                -- Check if all previous topics are completed
                SET @all_prev_cop_completed = 0;
                SELECT COUNT(*) INTO @all_prev_cop_completed
                FROM tmp_copied_mod_topics
                WHERE row_num < @cop_cur_idx AND (isCompleted IS FALSE OR isCompleted = 0);

                -- Rebuild JSON with next topic unlocked
                SET @ctopicjson = (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', j.id,
                            'module_id', j.module_id,
                            'isAccessible',
                                CASE
                                    WHEN @all_prev_cop_completed = 0 AND j.id = @cop_next_topic_id THEN CAST(TRUE AS JSON)
                                    WHEN LOWER(j.isAccessible) IN ('true', '1') THEN CAST(TRUE AS JSON)
                                    ELSE CAST(FALSE AS JSON)
                                END,
                            'isCompleted',
                                CASE
                                    WHEN j.id = c_topic_id THEN CAST(TRUE AS JSON)
                                    WHEN j.isCompleted THEN CAST(TRUE AS JSON)
                                    ELSE CAST(FALSE AS JSON)
                                END,
                            'isQuizExists', CASE WHEN j.isQuizExists THEN CAST(TRUE AS JSON) ELSE CAST(FALSE AS JSON) END,
                            'isAssignmentExists', CASE WHEN j.isAssignmentExists THEN CAST(TRUE AS JSON) ELSE CAST(FALSE AS JSON) END,
                            'topic_quiz', j.topic_quiz,
                            'topic_assignment', j.topic_assignment
                        )
                    )
                    FROM JSON_TABLE(@ctopicjson,'$[*]'
                        COLUMNS(
                            id INT PATH '$.id',
                            module_id INT PATH '$.module_id',
                            isAccessible VARCHAR(10) PATH '$.isAccessible',
                            isCompleted BOOLEAN PATH '$.isCompleted',
                            isQuizExists BOOLEAN PATH '$.isQuizExists',
                            isAssignmentExists BOOLEAN PATH '$.isAssignmentExists',
                            topic_quiz JSON PATH '$.topic_quiz',
                            topic_assignment JSON PATH '$.topic_assignment'
                        )
                    ) j
                );

                -- Save back
                UPDATE tbl_student_accessible_data
                SET topic_ids = @ctopicjson
                WHERE user_id = p_user_id AND course_id = c_course_id;

                DROP TEMPORARY TABLE IF EXISTS tmp_copied_mod_topics;

            END LOOP;

            CLOSE cur;
        END;

        DROP TEMPORARY TABLE IF EXISTS tmp_copied_topics2;
    END IF;

    -- 6. Determine next topic ONLY for current course
    SELECT row_num INTO @cur_index FROM tmp_topics WHERE id=p_topic_id;
    
    SET v_next_topic_id = NULL;
    SELECT id INTO v_next_topic_id
    FROM tmp_topics WHERE row_num > @cur_index AND (isCompleted IS FALSE OR isCompleted = 0) ORDER BY row_num ASC LIMIT 1;

    -- Check if all previous topics are completed
    SET @all_prev_completed = 0;
    SELECT COUNT(*) INTO @all_prev_completed
    FROM tmp_topics
    WHERE row_num < @cur_index AND (isCompleted IS FALSE OR isCompleted = 0);

    IF v_next_topic_id IS NULL THEN
        -- SET v_is_last_topic = TRUE;

        SELECT NOT EXISTS (
            SELECT 1
            FROM tmp_topics
            WHERE row_num > @cur_index
        ) INTO v_is_last_topic;

    ELSE
        SET v_is_last_topic = FALSE;
    END IF;


    -- 7. Update CURRENT COURSE topic_ids (unlock next topic)
    SET v_topic_ids = (
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', j.id,
                'module_id', j.module_id,
                'isAccessible',
                    CASE
                        WHEN @all_prev_completed = 0 AND j.id = v_next_topic_id THEN CAST(TRUE AS JSON)
                        WHEN LOWER(j.isAccessible) IN ('true', '1') THEN CAST(TRUE AS JSON)
                        ELSE CAST(FALSE AS JSON)
                    END,
                'isCompleted',
                    CASE
                        WHEN j.id = p_topic_id THEN CAST(TRUE AS JSON)
                        WHEN j.isCompleted THEN CAST(TRUE AS JSON)
                        ELSE CAST(FALSE AS JSON)
                    END,
                'isQuizExists', j.isQuizExists,
                'isAssignmentExists', j.isAssignmentExists,
                'topic_quiz', j.topic_quiz,
                'topic_assignment', j.topic_assignment
            )
        )
        FROM JSON_TABLE(v_topic_ids,'$[*]'
            COLUMNS(
                id INT PATH '$.id',
                module_id INT PATH '$.module_id',
                isAccessible VARCHAR(10) PATH '$.isAccessible',
                isCompleted BOOLEAN PATH '$.isCompleted',
                isQuizExists BOOLEAN PATH '$.isQuizExists',
                isAssignmentExists BOOLEAN PATH '$.isAssignmentExists',
                topic_quiz JSON PATH '$.topic_quiz',
                topic_assignment JSON PATH '$.topic_assignment'
            )
        )j
    );

    IF p_topic_id != v_original_topic_id THEN
        -- Get the original course ID from mapping table
        SELECT original_course_id
        INTO v_original_course_id
        FROM tbl_content_mapping
        WHERE type='topic' AND original_id = v_original_topic_id
        LIMIT 1;

        IF v_original_course_id IS NOT NULL THEN
            
            -- Get original course accessible data
            SELECT id, topic_ids
            INTO v_original_accessible_id, v_original_topic_ids
            FROM tbl_student_accessible_data
            WHERE user_id = p_user_id AND course_id = v_original_course_id
            LIMIT 1;

            IF v_original_accessible_id IS NOT NULL THEN
                
                -- Build temp table for original course topics
                DROP TEMPORARY TABLE IF EXISTS tmp_original_topics;

                CREATE TEMPORARY TABLE tmp_original_topics
                SELECT jt.id, jt.module_id, jt.isAccessible, jt.isCompleted, jt.row_num
                FROM JSON_TABLE(v_original_topic_ids,'$[*]'
                    COLUMNS(
                        id INT PATH '$.id',
                        module_id INT PATH '$.module_id',
                        isAccessible VARCHAR(10) PATH '$.isAccessible',
                        isCompleted BOOLEAN PATH '$.isCompleted',
                        row_num FOR ORDINALITY
                    )
                ) jt
                WHERE jt.module_id = v_module_id   -- same module
                ORDER BY jt.row_num;

                -- Find original topic index and next topic
                SELECT row_num INTO v_original_cur_index 
                FROM tmp_original_topics 
                WHERE id = v_original_topic_id;

                SET v_original_next_topic_id = NULL;
                SELECT id INTO v_original_next_topic_id
                FROM tmp_original_topics 
                WHERE row_num > v_original_cur_index
                ORDER BY row_num ASC 
                LIMIT 1;

                -- Rebuild topic_ids with SAME LOGIC as current course
                SET v_original_topic_ids = (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', j.id,
                            'module_id', j.module_id,
                            'isAccessible',
                                CASE
                                    WHEN j.id = v_original_next_topic_id THEN CAST(TRUE AS JSON)
                                    WHEN LOWER(j.isAccessible) IN ('true', '1') THEN CAST(TRUE AS JSON)
                                    ELSE CAST(FALSE AS JSON)
                                END,
                            'isCompleted',
                                CASE
                                    WHEN j.id = v_original_topic_id THEN CAST(TRUE AS JSON)
                                    WHEN j.isCompleted THEN CAST(TRUE AS JSON)
                                    ELSE CAST(FALSE AS JSON)
                                END,
                            'isQuizExists', j.isQuizExists,
                            'isAssignmentExists', j.isAssignmentExists,
                            'topic_quiz', j.topic_quiz,
                            'topic_assignment', j.topic_assignment
                        )
                    )
                    FROM JSON_TABLE(v_original_topic_ids,'$[*]'
                        COLUMNS(
                            id INT PATH '$.id',
                            module_id INT PATH '$.module_id',
                            isAccessible VARCHAR(10) PATH '$.isAccessible',
                            isCompleted BOOLEAN PATH '$.isCompleted',
                            isQuizExists BOOLEAN PATH '$.isQuizExists',
                            isAssignmentExists BOOLEAN PATH '$.isAssignmentExists',
                            topic_quiz JSON PATH '$.topic_quiz',
                            topic_assignment JSON PATH '$.topic_assignment'
                        )
                    ) j
                );

                -- Update original course's student access data
                UPDATE tbl_student_accessible_data
                SET topic_ids = v_original_topic_ids
                WHERE id = v_original_accessible_id;

                DROP TEMPORARY TABLE IF EXISTS tmp_original_topics;

            END IF;
        END IF;
    END IF;

    -- 8. Unlock quizzes & assignments if last topic
    IF v_is_last_topic THEN
        SET v_quiz_ids = (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', j.id,
                    'module_id', j.module_id,
                    'isAccessible',
                        CASE
                            WHEN j.module_id=v_module_id THEN CAST(TRUE AS JSON)
                            WHEN LOWER(j.isAccessible) IN ('true', '1') THEN CAST(TRUE AS JSON)
                            ELSE CAST(FALSE AS JSON)
                        END,
                    'isCompleted', 
                        CASE
                            WHEN j.isCompleted THEN CAST(TRUE AS JSON)
                            ELSE CAST(FALSE AS JSON)
                        END
                )
            )
            FROM JSON_TABLE(v_quiz_ids,'$[*]'
                COLUMNS(id INT PATH '$.id', module_id INT PATH '$.module_id',
                        isAccessible VARCHAR(10) PATH '$.isAccessible',
                        isCompleted BOOLEAN PATH '$.isCompleted')
            ) j
        );

        SET v_assignment_ids = (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', j.id,
                    'module_id', j.module_id,
                    'isAccessible',
                        CASE
                            WHEN j.module_id=v_module_id THEN CAST(TRUE AS JSON)
                            WHEN LOWER(j.isAccessible) IN ('true', '1') THEN CAST(TRUE AS JSON)
                            ELSE CAST(FALSE AS JSON)
                        END,
                    'isCompleted', 
                        CASE
                            WHEN j.isCompleted THEN CAST(TRUE AS JSON)
                            ELSE CAST(FALSE AS JSON)
                        END
                )
            )
            FROM JSON_TABLE(v_assignment_ids,'$[*]'
                COLUMNS(id INT PATH '$.id', module_id INT PATH '$.module_id',
                        isAccessible VARCHAR(10) PATH '$.isAccessible',
                        isCompleted BOOLEAN PATH '$.isCompleted')
            ) j
        );
    END IF;


    -- 9. Save updated JSON (CURRENT COURSE ONLY)
    UPDATE tbl_student_accessible_data
    SET topic_ids=v_topic_ids,
        quiz_ids=v_quiz_ids,
        assignment_ids=v_assignment_ids
    WHERE id=v_accessible_id;


    -- 10. Return
    SELECT
        CAST(TRUE AS JSON) AS success,
        CASE
            WHEN v_is_last_topic THEN 'Topic marked as completed. Module quizzes and assignments unlocked.'
            ELSE 'Topic marked as completed and next topic unlocked'
        END AS message,
        v_next_topic_id AS nextTopicId,
        CAST(v_is_last_topic AS JSON) AS isLastTopic;

    DROP TEMPORARY TABLE IF EXISTS tmp_topics;
END;
`)

        await sequelize.query('DROP PROCEDURE IF EXISTS getTopicTypeById')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getTopicTypeById(
    IN p_topic_id INT
)
BEGIN
    -- If topicId is missing/null, throw an error
    IF p_topic_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E400|BadRequest|Topic ID is required';
    END IF;

    -- Return the content_type (can be NULL if not found)
    SELECT 
        CASE WHEN t.id IS NULL THEN NULL ELSE t.content_type END AS topicType
    FROM tbl_topics t
    WHERE t.id = p_topic_id
    LIMIT 1;
END;`)

        await sequelize.query('DROP PROCEDURE IF EXISTS getDetailedTopicById')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getDetailedTopicById (
    IN p_topic_id INT
)
BEGIN
    DECLARE v_content_type VARCHAR(50);
    DECLARE v_languages JSON;

    -- Step 1: Fetch base topic
    SELECT id, title, description, content_type, languages, topic_duration, extra_duration, total_duration, created_at, updated_at
    INTO @id, @title, @description, v_content_type, v_languages, @topic_duration, @extra_duration, @total_duration, @created_at, @updated_at
    FROM tbl_topics
    WHERE id = p_topic_id
    LIMIT 1;

    -- If no topic found → throw error
    IF @id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Topic not found';
    END IF;

    -- Step 2: return topic (as first result set)
        SELECT @id AS id, @title AS title, @description AS description, v_languages AS languages,
            v_content_type AS content_type, @topic_duration AS topic_duration, @extra_duration AS extra_duration,
            @total_duration AS total_duration, @created_at AS created_at, @updated_at AS updated_at;

    -- Step 3: return topic tags
    SELECT * 
    FROM tbl_topics_tag
    WHERE topic_id = p_topic_id;

    -- Materials for general topic (from tbl_materials)
    SELECT *
    FROM tbl_materials
    WHERE topic_id = p_topic_id
    AND slide_id IS NULL;

    -- Step 4: return content_type specific details
    IF v_content_type = 'video' THEN
        SELECT url, video_type, duration_minutes
        FROM tbl_videos
        WHERE topic_id = p_topic_id;
    ELSEIF v_content_type = 'audio' THEN
        SELECT url, image_url, duration_minutes
        FROM tbl_audios
        WHERE topic_id = p_topic_id;
    ELSEIF v_content_type = 'accordian' THEN
        SELECT a.id, a.title, a.body, a.codeLanguage, a.code,
               a.completion_type, a.completion_time, a.audio_url
        FROM tbl_accordions a
        WHERE a.topic_id = p_topic_id;

        -- attachments separately
        SELECT att.id, att.accordionId, att.fileUrl, att.fileType
        FROM tbl_accordion_attachments att
        INNER JOIN tbl_accordions a ON att.accordionId = a.id
        WHERE a.topic_id = p_topic_id;
    ELSEIF v_content_type = 'general' THEN
        SELECT id, title, description,
               completion_type, completion_time, audio_url
        FROM tbl_general_materials
        WHERE topic_id = p_topic_id;
    END IF;

END;`)

        await sequelize.query('DROP PROCEDURE IF EXISTS getSlideIdAndTitleByTopicId')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getSlideIdAndTitleByTopicId(
    IN p_topic_id INT
)
BEGIN
    DECLARE v_topic_count INT;

    -- Check if topic exists and active
    SELECT COUNT(*) INTO v_topic_count
    FROM tbl_topics
    WHERE id = p_topic_id;

    IF v_topic_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Topic not found';
    END IF;

    -- Return topic details
    SELECT id, title, description, content_type, topic_duration, extra_duration, total_duration, created_at, updated_at
    FROM tbl_topics
    WHERE id = p_topic_id;

    -- Return slides for the topic
    SELECT id, title, sequence_no, slide_duration, slide_extra_duration, total_slide_duration
    FROM tbl_multi_slides
    WHERE topic_id = p_topic_id
    ORDER BY sequence_no ASC;

END;`)

        await sequelize.query('DROP PROCEDURE IF EXISTS getSlideContentBySlideId')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getSlideContentBySlideId(
    IN p_slide_id INT
)
BEGIN
    DECLARE v_slide_exists INT;

    -- Check if slide exists
    SELECT COUNT(*) INTO v_slide_exists
    FROM tbl_multi_slides
    WHERE id = p_slide_id;

    IF v_slide_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Slide not found';
    END IF;

    -- 1 Main slide details
        SELECT id, topic_id, title, description, type, completion_type, completion_time, audio_url, sequence_no,
            slide_duration, slide_extra_duration, total_slide_duration
    FROM tbl_multi_slides
    WHERE id = p_slide_id;

    -- 2 Topic tags
    SELECT *
    FROM tbl_topics_tag
    WHERE topic_id = (SELECT topic_id FROM tbl_multi_slides WHERE id = p_slide_id);

    -- 3 Video details
    SELECT url, type, duration_minutes
    FROM tbl_multi_slides_video
    WHERE multi_slide_id = p_slide_id;

    -- 4 Audio details (if needed)
    -- SELECT url, duration_minutes
    -- FROM tbl_multi_slides_audio
    -- WHERE multi_slide_id = p_slide_id;

    -- 5 Accordion details with attachments
    SELECT a.id, a.title, a.body, a.codeLanguage, a.code,
           att.id AS attachment_id, att.fileUrl, att.fileType
    FROM tbl_multislide_accordions a
    LEFT JOIN tbl_multislide_accordion_attachments att ON att.accordionId = a.id
    WHERE a.multi_slide_id = p_slide_id;

    -- 6 Slide materials from tbl_materials
    SELECT id, material_type, url, codeLanguage, code
    FROM tbl_materials
    WHERE slide_id = p_slide_id;

END`)

        // Not Used
        await sequelize.query('DROP PROCEDURE IF EXISTS markModuleAsCompleted')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS markModuleAsCompleted(
    IN p_user_id INT,
    IN p_course_id INT,
    IN p_module_id INT
)
BEGIN
    DECLARE v_module_exists INT;
    DECLARE v_session_id BIGINT;
    DECLARE v_next_module_id INT;
    DECLARE v_is_last_module BOOLEAN;

    -- Check if module exists and get session_id
    SELECT COUNT(*), session_id INTO v_module_exists, v_session_id
    FROM tbl_modules
    WHERE id = p_module_id ;

    IF v_module_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|Module not found';
    END IF;

    -- Get student accessible data
    SELECT id, module_ids, topic_ids, quiz_ids, assignment_ids
    INTO @access_id, @module_json, @topic_json, @quiz_json, @assignment_json
    FROM tbl_student_accessible_data
    WHERE user_id = p_user_id AND course_id = p_course_id;

    IF @access_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|No accessible data found for this user';
    END IF;

    -- Mark current module as completed and find next module
    SET @module_arr = @module_json;
    SET @next_module_id = NULL;
    SET v_is_last_module = FALSE;

    -- Iterate through modules to find current and next
    SET @i = 0;
    SET @len = JSON_LENGTH(@module_arr);
    module_loop: WHILE @i < @len DO
        IF JSON_EXTRACT(@module_arr, CONCAT('$[', @i, '].id')) = p_module_id THEN
            -- Mark current module as accessible (completed)
            SET @module_arr = JSON_SET(@module_arr, CONCAT('$[', @i, '].isAccessible'), TRUE);

            -- Check if it's last in session
            IF @i = @len - 1 THEN
                SET v_is_last_module = TRUE;
            ELSE
                -- Unlock next module in array
                SET @next_module_id = JSON_EXTRACT(@module_arr, CONCAT('$[', @i + 1, '].id'));
                SET @module_arr = JSON_SET(@module_arr, CONCAT('$[', @i + 1, '].isAccessible'), TRUE);
            END IF;
            LEAVE module_loop;
        END IF;
        SET @i = @i + 1;
    END WHILE;

    -- If last module, unlock all session content
    IF v_is_last_module THEN
        -- Unlock topics
        SET @topic_arr = JSON_ARRAY();
        SET @topic_len = JSON_LENGTH(@topic_json);
        SET @i = 0;
        WHILE @i < @topic_len DO
            SET @topic_arr = JSON_ARRAY_APPEND(@topic_arr, '$',
                JSON_SET(JSON_EXTRACT(@topic_json, CONCAT('$[', @i, ']')), '$.isAccessible', TRUE)
            );
            SET @i = @i + 1;
        END WHILE;

        -- Unlock quizzes
        SET @quiz_arr = JSON_ARRAY();
        SET @quiz_len = JSON_LENGTH(@quiz_json);
        SET @i = 0;
        WHILE @i < @quiz_len DO
            SET @quiz_arr = JSON_ARRAY_APPEND(@quiz_arr, '$',
                JSON_SET(JSON_EXTRACT(@quiz_json, CONCAT('$[', @i, ']')), '$.isAccessible', TRUE)
            );
            SET @i = @i + 1;
        END WHILE;

        -- Unlock assignments
        SET @assignment_arr = JSON_ARRAY();
        SET @assignment_len = JSON_LENGTH(@assignment_json);
        SET @i = 0;
        WHILE @i < @assignment_len DO
            SET @assignment_arr = JSON_ARRAY_APPEND(@assignment_arr, '$',
                JSON_SET(JSON_EXTRACT(@assignment_json, CONCAT('$[', @i, ']')), '$.isAccessible', TRUE)
            );
            SET @i = @i + 1;
        END WHILE;
    ELSE
        SET @topic_arr = @topic_json;
        SET @quiz_arr = @quiz_json;
        SET @assignment_arr = @assignment_json;
    END IF;

    -- Update the student's accessible data
    UPDATE tbl_student_accessible_data
    SET module_ids = @module_arr,
        topic_ids = @topic_arr,
        quiz_ids = @quiz_arr,
        assignment_ids = @assignment_arr,
        updated_at = NOW()
    WHERE id = @access_id;

    -- Return info
    SELECT @next_module_id AS nextModuleId, v_is_last_module AS isLastModule;
END;`)

        await sequelize.query('DROP PROCEDURE IF EXISTS trackStudentTimeSpentOnTopic')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS trackStudentTimeSpentOnTopic(
    IN p_user_id INT,
    IN p_course_id INT,
    IN p_session_id BIGINT,
    IN p_module_id INT,
    IN p_topic_id INT,
    IN p_accordian_id INT,
    IN p_slide_id INT,
    IN p_time_spent INT,
    IN p_timer_time INT,
    IN p_completion_status ENUM('not_started','in_progress','completed'),
    IN p_include_in_first_completion TINYINT,
    IN p_finalize_first_completion TINYINT
)
BEGIN
    DECLARE v_progress_id INT;
    DECLARE v_existing_time_spent INT DEFAULT 0;
    DECLARE v_existing_timer_time INT DEFAULT 0;
    DECLARE v_existing_first_completion_time_spent INT DEFAULT 0;
    DECLARE v_existing_first_completion_locked TINYINT DEFAULT 0;
    DECLARE v_required_duration_seconds INT DEFAULT 0;
    DECLARE v_total_duration_seconds INT DEFAULT 0;
    DECLARE v_updated_first_completion INT DEFAULT 0;
    DECLARE v_time_increment INT DEFAULT 0;

    IF p_slide_id IS NOT NULL THEN
        SELECT COALESCE(ROUND(slide_duration * 60), 0), COALESCE(ROUND(total_slide_duration * 60), 0)
        INTO v_required_duration_seconds, v_total_duration_seconds
        FROM tbl_multi_slides
        WHERE id = p_slide_id
        LIMIT 1;
    ELSE
        SELECT COALESCE(ROUND(topic_duration * 60), 0), COALESCE(ROUND(total_duration * 60), 0)
        INTO v_required_duration_seconds, v_total_duration_seconds
        FROM tbl_topics
        WHERE id = p_topic_id
        LIMIT 1;
    END IF;

    -- Check if a progress record exists
    SELECT id, student_time_spent, topic_timer_time_spent, first_completion_time_spent, first_completion_locked
    INTO v_progress_id, v_existing_time_spent, v_existing_timer_time, v_existing_first_completion_time_spent, v_existing_first_completion_locked
    FROM tbl_progress_tracking
    WHERE user_id = p_user_id
      AND course_id = p_course_id
      AND session_id = p_session_id
      AND module_id = p_module_id
      AND topic_id = p_topic_id
      AND (accordian_id = p_accordian_id OR (accordian_id IS NULL AND p_accordian_id IS NULL))
      AND (slide_id = p_slide_id OR (slide_id IS NULL AND p_slide_id IS NULL))
    LIMIT 1;

    IF v_progress_id IS NULL THEN
        SET v_updated_first_completion = CASE
            WHEN COALESCE(p_include_in_first_completion, 0) = 1
                THEN COALESCE(p_time_spent, 0)
            ELSE 0
        END;

        SET v_time_increment = COALESCE(p_time_spent, 0);

        IF v_total_duration_seconds > 0 THEN
            SET v_updated_first_completion = LEAST(v_updated_first_completion, v_total_duration_seconds);
            IF COALESCE(p_include_in_first_completion, 0) = 1 THEN
                SET v_time_increment = LEAST(v_time_increment, v_total_duration_seconds);
            END IF;
        END IF;

        -- Record does not exist, insert new
        INSERT INTO tbl_progress_tracking (
            user_id, course_id, session_id, module_id, topic_id, accordian_id, slide_id,
            student_time_spent, topic_timer_time_spent, first_completion_time_spent, color_dot, first_completion_locked,
            completion_status, completed_at, created_by, updated_by, created_at, updated_at
        )
        VALUES (
            p_user_id, p_course_id, p_session_id, p_module_id, p_topic_id, p_accordian_id, p_slide_id,
            v_time_increment, COALESCE(p_timer_time,0), v_updated_first_completion,
            CASE
                WHEN v_updated_first_completion = 0 THEN 'red'
                WHEN v_updated_first_completion < v_required_duration_seconds THEN 'red'
                WHEN ABS(v_updated_first_completion - v_required_duration_seconds) <= 2 THEN 'blue'
                ELSE 'yellow'
            END,
            CASE WHEN COALESCE(p_finalize_first_completion, 0) = 1 THEN 1 ELSE 0 END,
            p_completion_status,
            CASE WHEN p_completion_status = 'completed' THEN NOW() ELSE NULL END,
            p_user_id, p_user_id, NOW(), NOW()
        );

        SET v_progress_id = LAST_INSERT_ID();

    ELSE
        SET v_time_increment = COALESCE(p_time_spent, 0);

        -- If first completion is already locked, ignore repeated first-completion increments
        -- (prevents duplicate finalize/onComplete updates from inflating student_time_spent).
        IF COALESCE(v_existing_first_completion_locked, 0) = 1
           AND COALESCE(p_include_in_first_completion, 0) = 1 THEN
            SET v_time_increment = 0;
        END IF;

        -- During first completion phase, do not allow increments beyond total required duration.
        IF COALESCE(v_existing_first_completion_locked, 0) = 0
           AND COALESCE(p_include_in_first_completion, 0) = 1
           AND v_total_duration_seconds > 0 THEN
            SET v_time_increment = LEAST(
                v_time_increment,
                GREATEST(v_total_duration_seconds - LEAST(v_existing_time_spent, v_total_duration_seconds), 0)
            );
        END IF;

        IF COALESCE(p_include_in_first_completion, 0) = 1 AND COALESCE(v_existing_first_completion_locked, 0) = 0 THEN
            SET v_updated_first_completion = v_existing_first_completion_time_spent + COALESCE(p_time_spent, 0);
            IF v_total_duration_seconds > 0 THEN
                SET v_updated_first_completion = LEAST(v_updated_first_completion, v_total_duration_seconds);
            END IF;
        ELSE
            SET v_updated_first_completion = v_existing_first_completion_time_spent;
        END IF;

        -- Record exists, update existing
        UPDATE tbl_progress_tracking
        SET student_time_spent = v_existing_time_spent + COALESCE(p_time_spent, 0),
            topic_timer_time_spent = v_existing_timer_time + COALESCE(p_timer_time,0),
            first_completion_time_spent = v_updated_first_completion,
            color_dot = CASE
                WHEN v_updated_first_completion = 0 THEN 'red'
                WHEN v_updated_first_completion < v_required_duration_seconds THEN 'red'
                WHEN ABS(v_updated_first_completion - v_required_duration_seconds) <= 2 THEN 'blue'
                ELSE 'yellow'
            END,
            first_completion_locked = CASE
                WHEN COALESCE(p_finalize_first_completion, 0) = 1 THEN 1
                ELSE first_completion_locked
            END,
            completion_status = COALESCE(p_completion_status, completion_status),
            completed_at = CASE 
                WHEN p_completion_status = 'completed' 
                    AND (completed_at IS NULL OR completion_status != 'completed') THEN NOW()
                ELSE completed_at
            END,
            updated_by = p_user_id,
            updated_at = NOW()
        WHERE id = v_progress_id;
    END IF;

    -- ✅ Return full record
    SELECT * 
    FROM tbl_progress_tracking
    WHERE id = v_progress_id;
END;`)

        await sequelize.query('DROP PROCEDURE IF EXISTS createAccordianProgressRecordsForTopic')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createAccordianProgressRecordsForTopic(
    IN p_user_id INT,
    IN p_course_id INT,
    IN p_session_id BIGINT,
    IN p_module_id INT,
    IN p_topic_id INT,
    IN p_accordian_id INT,
    IN p_slide_id INT,
    IN p_time_spent INT,
    IN p_timer_time INT,
    IN p_completion_status ENUM('not_started','in_progress','completed')
)
BEGIN
    DECLARE v_progress_id INT;
    DECLARE v_existing_time_spent INT DEFAULT 0;
    DECLARE v_existing_timer_time INT DEFAULT 0;

        IF p_accordian_id IS NULL THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'E400|BadRequest|Accordion ID is required';
        END IF;

    -- Check if record already exists
    SELECT id, student_time_spent, topic_timer_time_spent
    INTO v_progress_id, v_existing_time_spent, v_existing_timer_time
    FROM tbl_progress_tracking
    WHERE user_id = p_user_id
      AND course_id = p_course_id
            AND (session_id <=> p_session_id)
            AND (module_id <=> p_module_id)
      AND topic_id = p_topic_id
            AND (accordian_id <=> p_accordian_id)
            AND (slide_id <=> p_slide_id)
    LIMIT 1;

    IF v_progress_id IS NULL THEN
        -- Record doesn't exist, create new
        INSERT INTO tbl_progress_tracking (
            user_id, course_id, session_id, module_id, topic_id, accordian_id, slide_id,
            student_time_spent, topic_timer_time_spent, completion_status, completed_at, created_by, updated_by, created_at, updated_at
        )
        VALUES (
            p_user_id, p_course_id, p_session_id, p_module_id, p_topic_id, p_accordian_id, p_slide_id,
            COALESCE(p_timer_time,0), COALESCE(p_time_spent,0), p_completion_status,
            CASE WHEN p_completion_status = 'completed' THEN NOW() ELSE NULL END,
            p_user_id, p_user_id, NOW(), NOW()
        );
        -- ✅ Return full record
        SELECT * 
        FROM tbl_progress_tracking
        WHERE id = LAST_INSERT_ID();
    ELSE
        -- ✅ Return full record
        SELECT * 
        FROM tbl_progress_tracking
        WHERE id = v_progress_id;
    END IF;
END;`)

        await sequelize.query('DROP PROCEDURE IF EXISTS getAccordianStatusByTopicId')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAccordianStatusByTopicId(
    IN p_user_id INT,
    IN p_topic_id INT
)
BEGIN
    -- Temporary table to hold results
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_accordian_status (
        accordian_id INT,
        status ENUM('not_started','in_progress','completed')
    );

    -- Clear table
    DELETE FROM temp_accordian_status;

    -- Insert accordians with status
    INSERT INTO temp_accordian_status (accordian_id, status)
    SELECT
        a.id AS accordian_id,
        COALESCE(pt.completion_status, 'not_started') AS status
    FROM tbl_accordions a
    LEFT JOIN tbl_progress_tracking pt
        ON pt.accordian_id = a.id
       AND pt.user_id = p_user_id
       AND pt.topic_id = p_topic_id
    WHERE a.topic_id = p_topic_id;

    -- Return results
    SELECT * FROM temp_accordian_status;
END;`)

        await sequelize.query('DROP PROCEDURE IF EXISTS updateAccordianCompletionStatus')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateAccordianCompletionStatus(
    IN p_user_id INT,
    IN p_topic_id INT,
    IN p_accordian_id INT,
    IN p_completion_status ENUM('not_started','in_progress','completed')
)
BEGIN
    DECLARE nextAccordianId INT;
    DECLARE v_revision_count INT;

    -- 1. Check if the accordion is already completed
    SELECT revision_count
    INTO v_revision_count
    FROM tbl_progress_tracking
    WHERE user_id = p_user_id
      AND topic_id = p_topic_id
      AND accordian_id = p_accordian_id
      AND completion_status = 'completed'
    LIMIT 1;

    -- 2. If already completed, increment revision_count
    IF v_revision_count IS NOT NULL THEN
        UPDATE tbl_progress_tracking
        SET revision_count = revision_count + 1,
            updated_at = NOW()
        WHERE user_id = p_user_id 
          AND topic_id = p_topic_id 
          AND accordian_id = p_accordian_id;
    ELSE
        -- 3. Update current progress
        UPDATE tbl_progress_tracking
        SET completion_status = p_completion_status,
            completed_at = CASE 
                WHEN p_completion_status = 'completed' 
                    AND (completed_at IS NULL OR completion_status != 'completed') THEN NOW()
                ELSE completed_at
            END,
            updated_at = NOW()
        WHERE user_id = p_user_id
        AND topic_id = p_topic_id
        AND accordian_id = p_accordian_id;
    END IF;

    -- If completed, find next accordion and set it to in_progress
    IF p_completion_status = 'completed' THEN
        SELECT id INTO nextAccordianId
        FROM tbl_accordions
        WHERE topic_id = p_topic_id
          AND id > p_accordian_id
        ORDER BY id ASC
        LIMIT 1;

        IF nextAccordianId IS NOT NULL THEN
            UPDATE tbl_progress_tracking
            SET completion_status = 'in_progress',
                updated_at = NOW()
            WHERE user_id = p_user_id
              AND topic_id = p_topic_id
              AND accordian_id = nextAccordianId
              AND completion_status = 'not_started';
        END IF;
    END IF;

    -- Return current and next accordion status
    SELECT pt.*, nextAccordianId AS next_accordian_id
    FROM tbl_progress_tracking pt
    WHERE user_id = p_user_id
      AND topic_id = p_topic_id
      AND accordian_id = p_accordian_id;
END;`)

        await sequelize.query('DROP PROCEDURE IF EXISTS createSlideProgressRecordsForTopic')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createSlideProgressRecordsForTopic(
    IN p_user_id INT,
    IN p_course_id INT,
    IN p_session_id BIGINT,
    IN p_module_id INT,
    IN p_topic_id INT,
    IN p_slide_id INT,
    IN p_time_spent INT,
    IN p_timer_time INT,
    IN p_completion_status ENUM('not_started','in_progress','completed')
)
BEGIN
    DECLARE existingId INT;
    DECLARE v_lock_name VARCHAR(255);
    DECLARE v_lock_acquired INT DEFAULT 0;

    SET v_lock_name = CONCAT(
        'slide_progress_',
        p_user_id, '_', p_course_id, '_',
        COALESCE(p_session_id, -1), '_',
        COALESCE(p_module_id, -1), '_',
        p_topic_id, '_', p_slide_id
    );

    SELECT GET_LOCK(v_lock_name, 5) INTO v_lock_acquired;

    IF v_lock_acquired <> 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E409|ConflictError|Could not acquire lock for slide progress creation';
    END IF;

    SELECT MIN(id) INTO existingId
    FROM tbl_progress_tracking
    WHERE user_id = p_user_id
      AND course_id = p_course_id
      AND (session_id <=> p_session_id)
      AND (module_id <=> p_module_id)
      AND topic_id = p_topic_id
      AND slide_id = p_slide_id
      AND accordian_id IS NULL;

    IF existingId IS NOT NULL THEN
        DELETE FROM tbl_progress_tracking
        WHERE user_id = p_user_id
          AND course_id = p_course_id
          AND (session_id <=> p_session_id)
          AND (module_id <=> p_module_id)
          AND topic_id = p_topic_id
          AND slide_id = p_slide_id
          AND accordian_id IS NULL
          AND id <> existingId;
    END IF;

    IF existingId IS NULL THEN
        INSERT INTO tbl_progress_tracking (
            user_id, course_id, session_id, module_id, topic_id, slide_id,
            completion_status, topic_timer_time_spent, student_time_spent,
            completed_at, created_by, updated_by, created_at, updated_at
        ) VALUES (
            p_user_id, p_course_id, p_session_id, p_module_id, p_topic_id, p_slide_id,
            p_completion_status, IFNULL(p_time_spent,0), IFNULL(p_timer_time,0),
            CASE WHEN p_completion_status = 'completed' THEN NOW() ELSE NULL END,
            p_user_id, p_user_id, NOW(), NOW()
        );

        SET existingId = LAST_INSERT_ID();
    END IF;

    DO RELEASE_LOCK(v_lock_name);

    SELECT *
    FROM tbl_progress_tracking
    WHERE id = existingId;
END;`)

        await sequelize.query('DROP PROCEDURE IF EXISTS getSlideStatusByTopicId')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getSlideStatusByTopicId(
    IN p_user_id INT,
    IN p_topic_id INT
)
BEGIN
    -- Temporary table to store slide statuses
    DROP TEMPORARY TABLE IF EXISTS tmp_slide_status;
    CREATE TEMPORARY TABLE tmp_slide_status (
        slide_id INT,
        status ENUM('not_started','in_progress','completed')
    );

    -- Insert all slides for the topic with default 'not_started'
    INSERT INTO tmp_slide_status (slide_id, status)
    SELECT id, 'not_started'
    FROM tbl_multi_slides
    WHERE topic_id = p_topic_id
    ORDER BY sequence_no ASC;

    -- Update status based on existing progress tracking
    UPDATE tmp_slide_status t
    JOIN tbl_progress_tracking p
    ON p.slide_id = t.slide_id
       AND p.user_id = p_user_id
    SET t.status = p.completion_status;

    -- Return the result
    SELECT * FROM tmp_slide_status;
END;`)

        await sequelize.query('DROP PROCEDURE IF EXISTS updateSlideCompletionStatus')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateSlideCompletionStatus(
    IN p_user_id INT,
    IN p_topic_id INT,
    IN p_slide_id INT,
    IN p_completion_status ENUM('not_started','in_progress','completed')
)
BEGIN
    DECLARE next_slide_id INT;
    DECLARE v_sequence_no INT;
    DECLARE v_revision_count INT;
    DECLARE v_required_duration_seconds INT DEFAULT 0;

    SELECT COALESCE(ROUND(slide_duration * 60), 0)
    INTO v_required_duration_seconds
    FROM tbl_multi_slides
    WHERE id = p_slide_id
    LIMIT 1;

    -- 1. Check if the slide is already completed
    SELECT revision_count
    INTO v_revision_count
    FROM tbl_progress_tracking
    WHERE user_id = p_user_id
      AND topic_id = p_topic_id
      AND slide_id = p_slide_id
      AND completion_status = 'completed'
    LIMIT 1;

    -- 2. If already completed, increment revision_count
    IF v_revision_count IS NOT NULL THEN
        UPDATE tbl_progress_tracking
        SET revision_count = revision_count + 1,
            updated_at = NOW()
        WHERE user_id = p_user_id 
          AND topic_id = p_topic_id 
          AND slide_id = p_slide_id
          AND accordian_id IS NULL;
    ELSE
        -- Update the current slide progress
        UPDATE tbl_progress_tracking
        SET completion_status = p_completion_status,
            first_completion_time_spent = CASE
                WHEN p_completion_status = 'completed' THEN LEAST(COALESCE(first_completion_time_spent, 0), v_required_duration_seconds)
                ELSE first_completion_time_spent
            END,
            color_dot = CASE
                WHEN p_completion_status = 'completed' THEN
                    CASE
                        WHEN LEAST(COALESCE(first_completion_time_spent, 0), v_required_duration_seconds) < v_required_duration_seconds THEN 'red'
                        WHEN ABS(LEAST(COALESCE(first_completion_time_spent, 0), v_required_duration_seconds) - v_required_duration_seconds) <= 2 THEN 'blue'
                        ELSE 'yellow'
                    END
                ELSE color_dot
            END,
            completed_at = CASE 
                WHEN p_completion_status = 'completed' 
                    AND (completed_at IS NULL OR completion_status != 'completed') THEN NOW()
                ELSE completed_at
            END,
            updated_at = NOW()
        WHERE user_id = p_user_id
          AND topic_id = p_topic_id
        AND slide_id = p_slide_id;
    END IF;

    SELECT sequence_no INTO v_sequence_no
    FROM tbl_multi_slides
    WHERE id = p_slide_id;

    -- Get the next slide (by sequence_no order) if current slide is completed
    IF p_completion_status = 'completed' THEN
        SELECT id INTO next_slide_id
        FROM tbl_multi_slides
        WHERE topic_id = p_topic_id
          AND sequence_no > v_sequence_no
        ORDER BY sequence_no ASC
        LIMIT 1;

        IF next_slide_id IS NOT NULL THEN
            UPDATE tbl_progress_tracking
            SET completion_status = 'in_progress',
                updated_at = NOW()
            WHERE user_id = p_user_id
              AND topic_id = p_topic_id
              AND slide_id = next_slide_id
              AND accordian_id IS NULL
              AND completion_status = 'not_started';
        END IF;
    END IF;

    -- Return the updated progress record + next slide id
    SELECT next_slide_id, pt.* FROM tbl_progress_tracking pt
    WHERE pt.user_id = p_user_id
      AND pt.topic_id = p_topic_id
      AND pt.slide_id = p_slide_id
      AND pt.accordian_id IS NULL;

END;`)

        await sequelize.query('DROP PROCEDURE IF EXISTS getModuleCompletionStatus')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getModuleCompletionStatus(
    IN p_user_id INT,
    IN p_course_id INT,
    IN p_module_id INT
)
BEGIN
    DECLARE v_studentData JSON;
    DECLARE v_topics JSON;
    DECLARE v_quizzes JSON;
    DECLARE v_assignments JSON;
    DECLARE v_modules JSON;

    proc: BEGIN

    -- Fetch the student's accessible data for this course
    SELECT CAST(student_data AS JSON)
    INTO v_studentData
    FROM (
        SELECT JSON_OBJECT(
            'module_ids', module_ids,
            'topic_ids', topic_ids,
            'quiz_ids', quiz_ids,
            'assignment_ids', assignment_ids
        ) AS student_data
        FROM tbl_student_accessible_data
        WHERE user_id = p_user_id
          AND course_id = p_course_id
        LIMIT 1
    ) t;

    IF v_studentData IS NULL THEN
        SELECT JSON_OBJECT(
            'success', FALSE,
            'message', 'No accessible data found for this student'
        ) AS response;
        LEAVE proc;
    END IF;

    -- Extract arrays
    SET v_topics = JSON_EXTRACT(v_studentData, '$.topic_ids');
    SET v_quizzes = JSON_EXTRACT(v_studentData, '$.quiz_ids');
    SET v_assignments = JSON_EXTRACT(v_studentData, '$.assignment_ids');
    SET v_modules = JSON_EXTRACT(v_studentData, '$.module_ids');

    -- Topics: count only those inside this module
    SET @totalTopics = (
        SELECT COUNT(*)
        FROM JSON_TABLE(v_topics, '$[*]' COLUMNS (
            module_id INT PATH '$.module_id',
            isCompleted BOOL PATH '$.isCompleted'
        )) t
        WHERE t.module_id = p_module_id
    );

    SET @completedTopics = (
        SELECT COUNT(*)
        FROM JSON_TABLE(v_topics, '$[*]' COLUMNS (
            module_id INT PATH '$.module_id',
            isCompleted BOOL PATH '$.isCompleted'
        )) t
        WHERE t.module_id = p_module_id AND t.isCompleted = TRUE
    );

    SET @allTopicsCompleted = IF(@totalTopics > 0 AND @completedTopics = @totalTopics, TRUE, FALSE);

    -- Quizzes
    SET @totalQuizzes = (
        SELECT COUNT(*)
        FROM JSON_TABLE(v_quizzes, '$[*]' COLUMNS (
            module_id INT PATH '$.module_id',
            isCompleted BOOL PATH '$.isCompleted'
        )) t
        WHERE t.module_id = p_module_id
    );

    SET @completedQuizzes = (
        SELECT COUNT(*)
        FROM JSON_TABLE(v_quizzes, '$[*]' COLUMNS (
            module_id INT PATH '$.module_id',
            isCompleted BOOL PATH '$.isCompleted'
        )) t
        WHERE t.module_id = p_module_id AND t.isCompleted = TRUE
    );

    SET @allQuizzesCompleted = IF(@totalQuizzes > 0 AND @completedQuizzes = @totalQuizzes, TRUE, FALSE);

    -- Assignments
    SET @totalAssignments = (
        SELECT COUNT(*)
        FROM JSON_TABLE(v_assignments, '$[*]' COLUMNS (
            module_id INT PATH '$.module_id',
            isCompleted BOOL PATH '$.isCompleted'
        )) t
        WHERE t.module_id = p_module_id
    );

    SET @completedAssignments = (
        SELECT COUNT(*)
        FROM JSON_TABLE(v_assignments, '$[*]' COLUMNS (
            module_id INT PATH '$.module_id',
            isCompleted BOOL PATH '$.isCompleted'
        )) t
        WHERE t.module_id = p_module_id AND t.isCompleted = TRUE
    );

    SET @allAssignmentsCompleted = IF(@totalAssignments > 0 AND @completedAssignments = @totalAssignments, TRUE, FALSE);

    -- Module overall
    SET @allContentCompleted = @allTopicsCompleted AND @allQuizzesCompleted AND @allAssignmentsCompleted;

    -- Final response
    SELECT JSON_OBJECT(
        'success', TRUE,
        'isModuleCompleted', @allContentCompleted,
        'details', JSON_OBJECT(
            'topicsCompleted', @allTopicsCompleted,
            'quizzesCompleted', @allQuizzesCompleted,
            'assignmentsCompleted', @allAssignmentsCompleted,
            'totalTopics', @totalTopics,
            'completedTopics', @completedTopics,
            'totalQuizzes', @totalQuizzes,
            'completedQuizzes', @completedQuizzes,
            'totalAssignments', @totalAssignments,
            'completedAssignments', @completedAssignments
        )
    ) AS response;

    END proc;
END;`)

        await sequelize.query('DROP PROCEDURE IF EXISTS getSessionCompletionStatus')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getSessionCompletionStatus(
    IN p_user_id INT,
    IN p_course_id INT,
    IN p_session_id INT
)
BEGIN
    DECLARE v_modules JSON;

    proc: BEGIN

    -- Fetch only module_ids JSON for this student
    SELECT module_ids
    INTO v_modules
    FROM tbl_student_accessible_data
    WHERE user_id = p_user_id
      AND course_id = p_course_id
    LIMIT 1;

    -- If no data found
    IF v_modules IS NULL THEN
        SELECT JSON_OBJECT(
            'success', FALSE,
            'message', 'No accessible data found for this student'
        ) AS response;
        LEAVE proc;
    END IF;

    -- Get total modules in this session
    SET @totalModules = (
        SELECT COUNT(*)
        FROM JSON_TABLE(v_modules, '$[*]'
            COLUMNS (
                mid INT PATH '$.id',
                sessId INT PATH '$.session_id',
                completed BOOL PATH '$.isCompleted'
            )
        ) AS mods
        WHERE sessId = p_session_id
    );

    -- Get completed modules in this session
    SET @completedModules = (
        SELECT COUNT(*)
        FROM JSON_TABLE(v_modules, '$[*]'
            COLUMNS (
                mid INT PATH '$.id',
                sessId INT PATH '$.session_id',
                completed BOOL PATH '$.isCompleted'
            )
        ) AS mods
        WHERE sessId = p_session_id AND completed = TRUE
    );

    -- Check if all modules completed
    SET @sessionCompleted = IF(@totalModules > 0 AND @totalModules = @completedModules, TRUE, FALSE);

    -- Return structured JSON
    SELECT JSON_OBJECT(
        'success', TRUE,
        'sessionCompleted', @sessionCompleted,
        'details', JSON_OBJECT(
            'totalModules', @totalModules,
            'completedModules', @completedModules
        )
    ) AS response;
    END proc;
END;`)

        await sequelize.query('DROP PROCEDURE IF EXISTS getCourseCompletionProgress')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCourseCompletionProgress(
    IN p_user_id INT,
    IN p_course_id INT
)
BEGIN
    DECLARE total_items INT DEFAULT 0;
    DECLARE completed_items INT DEFAULT 0;
    DECLARE progress DECIMAL(5,2) DEFAULT 0;

    -- Extract counts from module_ids
    SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN jt.isCompleted = true THEN 1 ELSE 0 END) AS completed
    INTO @m_total, @m_completed
    FROM tbl_student_accessible_data s,
         JSON_TABLE(s.module_ids, '$[*]'
            COLUMNS (
                id INT PATH '$.id',
                isCompleted BOOL PATH '$.isCompleted'
            )
         ) jt
    WHERE s.user_id = p_user_id AND s.course_id = p_course_id;

    -- Extract counts from topic_ids
    SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN jt.isCompleted = true THEN 1 ELSE 0 END) AS completed
    INTO @t_total, @t_completed
    FROM tbl_student_accessible_data s,
         JSON_TABLE(s.topic_ids, '$[*]'
            COLUMNS (
                id INT PATH '$.id',
                isCompleted BOOL PATH '$.isCompleted'
            )
         ) jt
    WHERE s.user_id = p_user_id AND s.course_id = p_course_id;

    -- Extract counts from quiz_ids
    SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN jt.isCompleted = true THEN 1 ELSE 0 END) AS completed
    INTO @q_total, @q_completed
    FROM tbl_student_accessible_data s,
         JSON_TABLE(s.quiz_ids, '$[*]'
            COLUMNS (
                id INT PATH '$.id',
                isCompleted BOOL PATH '$.isCompleted'
            )
         ) jt
    WHERE s.user_id = p_user_id AND s.course_id = p_course_id;

    -- Extract counts from assignment_ids
    SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN jt.isCompleted = true THEN 1 ELSE 0 END) AS completed
    INTO @a_total, @a_completed
    FROM tbl_student_accessible_data s,
         JSON_TABLE(s.assignment_ids, '$[*]'
            COLUMNS (
                id INT PATH '$.id',
                isCompleted BOOL PATH '$.isCompleted'
            )
         ) jt
    WHERE s.user_id = p_user_id AND s.course_id = p_course_id;

    -- Sum all
    SET total_items = IFNULL(@m_total,0) + IFNULL(@t_total,0) + IFNULL(@q_total,0) + IFNULL(@a_total,0);
    SET completed_items = IFNULL(@m_completed,0) + IFNULL(@t_completed,0) + IFNULL(@q_completed,0) + IFNULL(@a_completed,0);

    -- Calculate progress
    IF total_items > 0 THEN
        SET progress = ROUND((completed_items / total_items) * 100, 2);
    END IF;

    SELECT progress AS progress_percentage;

END;`)

        await sequelize.query('DROP PROCEDURE IF EXISTS calculateCourseCompletionFromAccessData')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS calculateCourseCompletionFromAccessData(
    IN p_user_id INT,
    IN p_course_id INT
)
BEGIN
    DECLARE v_enrollment_id INT;
    DECLARE v_completion_percentage DECIMAL(5,2);
    DECLARE v_total_items INT DEFAULT 0;
    DECLARE v_completed_items INT DEFAULT 0;
    DECLARE v_json JSON;

    -- Step 1: Get enrollment ID
    SELECT id INTO v_enrollment_id
    FROM tbl_enrollments
    WHERE user_id = p_user_id AND course_id = p_course_id
    LIMIT 1;

    IF v_enrollment_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Enrollment not found for this user and course';
    END IF;

    -- Step 2: Get student accessible data JSON
    SELECT JSON_OBJECT(
        'topic_ids', topic_ids,
        'quiz_ids', quiz_ids,
        'assignment_ids', assignment_ids
    )
    INTO v_json
    FROM tbl_student_accessible_data
    WHERE user_id = p_user_id AND course_id = p_course_id
    LIMIT 1;

    IF v_json IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No accessible data found for this user and course';
    END IF;

    -- Step 3: Count total accessible + completed items (topics)
    SELECT 
        COUNT(*) INTO @total_topics
    FROM JSON_TABLE(
        JSON_EXTRACT(v_json, '$.topic_ids'),
        '$[*]' COLUMNS(
            id INT PATH '$.id'
        )
    ) AS jt;

    SELECT 
        COUNT(*) INTO @completed_topics
    FROM JSON_TABLE(
        JSON_EXTRACT(v_json, '$.topic_ids'),
        '$[*]' COLUMNS(
            isCompleted BOOL PATH '$.isCompleted'
        )
    ) AS jt
    WHERE jt.isCompleted = TRUE;

    -- Step 4: Count total accessible + completed quizzes
    SELECT 
        COUNT(*) INTO @total_quizzes
    FROM JSON_TABLE(
        JSON_EXTRACT(v_json, '$.quiz_ids'),
        '$[*]' COLUMNS(
            id INT PATH '$.id'
        )
    ) AS jt;

    SELECT 
        COUNT(*) INTO @completed_quizzes
    FROM JSON_TABLE(
        JSON_EXTRACT(v_json, '$.quiz_ids'),
        '$[*]' COLUMNS(
            isCompleted BOOL PATH '$.isCompleted'
        )
    ) AS jt
    WHERE jt.isCompleted = TRUE;

    -- Step 5: Count total accessible + completed assignments
    SELECT 
        COUNT(*) INTO @total_assignments
    FROM JSON_TABLE(
        JSON_EXTRACT(v_json, '$.assignment_ids'),
        '$[*]' COLUMNS(
            id INT PATH '$.id'
        )
    ) AS jt;

    SELECT 
        COUNT(*) INTO @completed_assignments
    FROM JSON_TABLE(
        JSON_EXTRACT(v_json, '$.assignment_ids'),
        '$[*]' COLUMNS(
            isCompleted BOOL PATH '$.isCompleted'
        )
    ) AS jt
    WHERE jt.isCompleted = TRUE;

    -- Step 6: Calculate totals
    SET v_total_items = @total_topics + @total_quizzes + @total_assignments;
    SET v_completed_items = @completed_topics + @completed_quizzes + @completed_assignments;

    IF v_total_items = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No accessible items found for this user and course';
    END IF;

    SET v_completion_percentage = ROUND((v_completed_items / v_total_items) * 100, 2);

    -- Step 7: Update tbl_enrollments
    IF v_completion_percentage = 100 THEN
        UPDATE tbl_enrollments
        SET status = 'completed',
            is_completed = TRUE,
            completed_at = NOW(),
            completion_percentage = v_completion_percentage
        WHERE id = v_enrollment_id;
    ELSE
        UPDATE tbl_enrollments
        SET completion_percentage = v_completion_percentage
        WHERE id = v_enrollment_id;
    END IF;

    -- Step 8: Return summary
    SELECT 
        v_completion_percentage AS completionPercentage,
        v_total_items AS totalItems,
        v_completed_items AS completedItems;

END`)

        await sequelize.query('DROP PROCEDURE IF EXISTS getFullAccessibleCourseData;')
        await sequelize.query(`CREATE PROCEDURE getFullAccessibleCourseData(
    IN p_user_id INT,
    IN p_course_id INT
)
BEGIN
    DECLARE v_session_ids JSON;
    DECLARE v_module_ids JSON;
    DECLARE v_topic_ids JSON;
    DECLARE v_quiz_ids JSON;
    DECLARE v_assignment_ids JSON;

    -- Fetch all JSON accessibility data
    SELECT session_ids, module_ids, topic_ids, quiz_ids, assignment_ids
    INTO v_session_ids, v_module_ids, v_topic_ids, v_quiz_ids, v_assignment_ids
    FROM tbl_student_accessible_data
    WHERE user_id = p_user_id AND course_id = p_course_id
    LIMIT 1;

    IF v_session_ids IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|No accessible data found';
    END IF;

    -- Return nested JSON: Course → Sessions → Modules → Topics
    SELECT JSON_OBJECT(
        'courseId', c.id,
        'title', c.title,
        'sessions',
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'sessionId', s.id,
                    'title', s.title,
                    'isAccessible',
                        COALESCE((SELECT CASE WHEN LOWER(js.isAccessible) IN ('true','1') THEN 1 ELSE 0 END
                                  FROM JSON_TABLE(v_session_ids, '$[*]' COLUMNS (
                                        id INT PATH '$.id',
                                        isAccessible VARCHAR(10) PATH '$.isAccessible'
                                  )) js
                                  WHERE js.id = s.id LIMIT 1), 0),
                    'isCompleted',
                        COALESCE((SELECT CASE WHEN LOWER(js.isCompleted) IN ('true','1') THEN 1 ELSE 0 END
                                  FROM JSON_TABLE(v_session_ids, '$[*]' COLUMNS (
                                        id INT PATH '$.id',
                                        isCompleted VARCHAR(10) PATH '$.isCompleted'
                                  )) js
                                  WHERE js.id = s.id LIMIT 1), 0),

                    'modules',
                        (
                            SELECT JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'moduleId', m.id,
                                    'title', m.title,
                                    'isAccessible',
                                        COALESCE((SELECT CASE WHEN LOWER(jm.isAccessible) IN ('true','1') THEN 1 ELSE 0 END
                                                  FROM JSON_TABLE(v_module_ids, '$[*]' COLUMNS (
                                                        id INT PATH '$.id',
                                                        session_id INT PATH '$.session_id',
                                                        isAccessible VARCHAR(10) PATH '$.isAccessible'
                                                  )) jm
                                                  WHERE jm.id = m.id AND jm.session_id = s.id LIMIT 1), 0),

                                    'isCompleted',
                                        COALESCE((SELECT CASE WHEN LOWER(jm.isCompleted) IN ('true','1') THEN 1 ELSE 0 END
                                                  FROM JSON_TABLE(v_module_ids, '$[*]' COLUMNS (
                                                        id INT PATH '$.id',
                                                        session_id INT PATH '$.session_id',
                                                        isCompleted VARCHAR(10) PATH '$.isCompleted'
                                                  )) jm
                                                  WHERE jm.id = m.id AND jm.session_id = s.id LIMIT 1), 0),

                                    'topics',
                                        (
                                            SELECT JSON_ARRAYAGG(
                                                JSON_OBJECT(
                                                    'topicId', t.id,
                                                    'title', t.title,
                                                    'isAccessible',
                                                        COALESCE((SELECT jt.isAccessible
                                                                  FROM JSON_TABLE(v_topic_ids, '$[*]' COLUMNS (
                                                                        id INT PATH '$.id',
                                                                        module_id INT PATH '$.module_id',
                                                                        isAccessible INT PATH '$.isAccessible'
                                                                  )) jt
                                                                  WHERE jt.id = t.id AND jt.module_id = m.id LIMIT 1), 0),
                                                    'isCompleted',
                                                        COALESCE((SELECT jt.isCompleted
                                                                  FROM JSON_TABLE(v_topic_ids, '$[*]' COLUMNS (
                                                                        id INT PATH '$.id',
                                                                        module_id INT PATH '$.module_id',
                                                                        isCompleted INT PATH '$.isCompleted'
                                                                  )) jt
                                                                  WHERE jt.id = t.id AND jt.module_id = m.id LIMIT 1), 0),
                                                    'isQuizExists',
                                                        COALESCE((SELECT jt.isQuizExists
                                                                FROM JSON_TABLE(v_topic_ids, '$[*]' COLUMNS (
                                                                        id INT PATH '$.id',
                                                                        module_id INT PATH '$.module_id',
                                                                        isQuizExists INT PATH '$.isQuizExists'
                                                                )) jt
                                                                WHERE jt.id = t.id AND jt.module_id = m.id LIMIT 1), 0),

                                                    'topic_quiz',
                                                        COALESCE((
                                                            SELECT JSON_ARRAYAGG(
                                                                JSON_OBJECT(
                                                                    'id', q.id,
                                                                    'title', q.title,
                                                                    'isComplete', jq.isComplete
                                                                )
                                                            )
                                                            FROM JSON_TABLE(v_topic_ids, '$[*]' COLUMNS (
                                                                id INT PATH '$.id',
                                                                module_id INT PATH '$.module_id',
                                                                topic_quiz JSON PATH '$.topic_quiz'
                                                            )) jt
                                                            JOIN JSON_TABLE(jt.topic_quiz, '$[*]' COLUMNS (
                                                                quiz_id INT PATH '$.id',
                                                                isComplete BOOLEAN PATH '$.isComplete'
                                                            )) jq
                                                            JOIN tbl_quiz q ON q.id = jq.quiz_id
                                                            WHERE jt.id = t.id AND jt.module_id = m.id
                                                        ), JSON_ARRAY()),

                                                    'isAssignmentExists',
                                                        COALESCE((SELECT jt.isAssignmentExists
                                                                FROM JSON_TABLE(v_topic_ids, '$[*]' COLUMNS (
                                                                        id INT PATH '$.id',
                                                                        module_id INT PATH '$.module_id',
                                                                        isAssignmentExists INT PATH '$.isAssignmentExists'
                                                                )) jt
                                                                WHERE jt.id = t.id AND jt.module_id = m.id LIMIT 1), 0),

                                                    'topic_assignment',
                                                        COALESCE((
                                                            SELECT JSON_ARRAYAGG(
                                                                JSON_OBJECT(
                                                                    'id', a.id,
                                                                    'title', a.title,
                                                                    'isComplete', ja.isComplete
                                                                )
                                                            )
                                                            FROM JSON_TABLE(v_topic_ids, '$[*]' COLUMNS (
                                                                id INT PATH '$.id',
                                                                module_id INT PATH '$.module_id',
                                                                topic_assignment JSON PATH '$.topic_assignment'
                                                            )) jt
                                                            JOIN JSON_TABLE(jt.topic_assignment, '$[*]' COLUMNS (
                                                                assignment_id INT PATH '$.id',
                                                                isComplete BOOLEAN PATH '$.isComplete'
                                                            )) ja
                                                            JOIN tbl_assignments a ON a.id = ja.assignment_id
                                                            WHERE jt.id = t.id AND jt.module_id = m.id
                                                        ), JSON_ARRAY())
                                                )
                                            )
                                            FROM tbl_topics t
                                            WHERE t.module_id = m.id
                                            AND EXISTS (
                                                SELECT 1
                                                FROM JSON_TABLE(v_topic_ids, '$[*]' COLUMNS (
                                                    id INT PATH '$.id',
                                                    module_id INT PATH '$.module_id'
                                                )) jt
                                                WHERE jt.id = t.id AND jt.module_id = m.id
                                            )
                                        ),
                                        
                                    'quizzes',
                                        COALESCE((
                                            SELECT JSON_ARRAYAGG(
                                                JSON_OBJECT(
                                                    'id', q.id,
                                                    'title', q.title,
                                                    'isAccessible',
                                                        COALESCE(jq.isAccessible, 0),
                                                    'isCompleted',
                                                        COALESCE(jq.isCompleted, 0)
                                                )
                                            )
                                            FROM JSON_TABLE(v_quiz_ids, '$[*]' COLUMNS (
                                                id INT PATH '$.id',
                                                module_id INT PATH '$.module_id',
                                                isAccessible BOOLEAN PATH '$.isAccessible',
                                                isCompleted BOOLEAN PATH '$.isCompleted'
                                            )) jq
                                            JOIN tbl_quiz q ON q.id = jq.id
                                            WHERE jq.module_id = m.id
                                        ), JSON_ARRAY()),

                                    'assignments',
                                        COALESCE((
                                            SELECT JSON_ARRAYAGG(
                                                JSON_OBJECT(
                                                    'id', a.id,
                                                    'title', a.title,
                                                    'isAccessible',
                                                        COALESCE(ja.isAccessible, 0),
                                                    'isCompleted',
                                                        COALESCE(ja.isCompleted, 0)
                                                )
                                            )
                                            FROM JSON_TABLE(v_assignment_ids, '$[*]' COLUMNS (
                                                id INT PATH '$.id',
                                                module_id INT PATH '$.module_id',
                                                isAccessible BOOLEAN PATH '$.isAccessible',
                                                isCompleted BOOLEAN PATH '$.isCompleted'
                                            )) ja
                                            JOIN tbl_assignments a ON a.id = ja.id
                                            WHERE ja.module_id = m.id
                                        ), JSON_ARRAY())
                                )
                            )
                            FROM tbl_modules m
                            WHERE m.session_id = s.id
                            AND EXISTS (
                                SELECT 1
                                FROM JSON_TABLE(v_module_ids, '$[*]' COLUMNS (
                                    id INT PATH '$.id',
                                    session_id INT PATH '$.session_id'
                                )) jm
                                WHERE jm.id = m.id AND jm.session_id = s.id
                            )
                        )
                )
            )
            FROM tbl_session s
            WHERE s.course_id = p_course_id
            AND EXISTS (
                SELECT 1
                FROM JSON_TABLE(v_session_ids, '$[*]' COLUMNS (
                    id INT PATH '$.id'
                )) js
                WHERE js.id = s.id
            )
        )
    ) AS course
    FROM tbl_courses c
    WHERE c.id = p_course_id;

END`)

        console.log("✅ New Progress Tracking procedures created!");
    } catch (error) {
        console.error("❌ Error setting up New Progress Tracking procedures:", error);
        throw error;
    }
};

module.exports = { setupNewProgressTrackingProcedures };
