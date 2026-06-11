const sequelize = require("../../config/db");

const setupCourseTimeTrackingProcedures = async () => {
    try {
        console.log("🔄 Setting up Course Time Tracking procedures...");
        await sequelize.query(`DROP PROCEDURE IF EXISTS get_current_date`);
        await sequelize.query(`
        CREATE FUNCTION IF NOT EXISTS get_current_date()
RETURNS DATE
DETERMINISTIC
BEGIN
    RETURN CURDATE();
END;`);

        // Start a course session
        await sequelize.query(`DROP PROCEDURE IF EXISTS start_course_session`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS start_course_session(
    IN p_enrollment_id INT,
    IN p_user_id INT
)
BEGIN
    DECLARE v_now DATETIME;
    DECLARE v_current_date DATE;
    DECLARE v_enrollment_exists INT;
    DECLARE v_has_active_session INT;
    DECLARE v_max_access_minutes DECIMAL(10, 2);
    DECLARE v_today_seconds_spent INT;
    DECLARE v_remaining_seconds INT;
    DECLARE v_session_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Set initial variables
    SET v_now = NOW();
    SET v_current_date = CURDATE();

    -- Check if enrollment exists and get course data
    SELECT COUNT(*), COALESCE(MAX(c.max_access_minutes), 0)
    INTO v_enrollment_exists, v_max_access_minutes
    FROM tbl_enrollments e
    LEFT JOIN tbl_courses c ON e.course_id = c.id
    WHERE e.id = p_enrollment_id;

    -- Return error if enrollment not found
    IF v_enrollment_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Enrollment not found';
    END IF;

    -- Check for active session today
    SELECT COUNT(*) INTO v_has_active_session
    FROM tbl_course_time_tracking
    WHERE enrollment_id = p_enrollment_id
      AND last_session_start IS NOT NULL
      AND last_session_end IS NULL
      AND tracking_date = v_current_date;

    -- Return error if active session exists
    IF v_has_active_session > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E409|ConflictError|A session is already in progress for this course';
    END IF;

    -- Calculate today's time spent (in seconds)
    SELECT COALESCE(SUM(total_time_spent), 0) INTO v_today_seconds_spent
    FROM tbl_course_time_tracking
    WHERE enrollment_id = p_enrollment_id
      AND tracking_date = v_current_date;

    -- Check daily limit if applicable
    IF v_max_access_minutes IS NOT NULL AND v_max_access_minutes > 0 THEN
        -- Check if max seconds reached (convert minutes → seconds)
        IF v_today_seconds_spent >= (v_max_access_minutes * 60) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E403|LimitExceededError|Cannot start session: Maximum daily limit has been reached';
        END IF;
    END IF;

    -- Create new session
    INSERT INTO tbl_course_time_tracking (
        enrollment_id,
        tracking_date,
        total_time_spent,  -- store in seconds
        last_session_start,
        last_session_end,
        created_by,
        updated_by,
        created_at,
        updated_at
    ) VALUES (
        p_enrollment_id,
        v_current_date,
        0,
        v_now,
        NULL,
        p_user_id,
        p_user_id,
        v_now,
        v_now
    );

    SET v_session_id = LAST_INSERT_ID();

    -- Calculate remaining seconds
    IF v_max_access_minutes IS NOT NULL AND v_max_access_minutes > 0 THEN
        SET v_remaining_seconds = GREATEST(0, (v_max_access_minutes * 60) - v_today_seconds_spent);
    ELSE
        SET v_remaining_seconds = NULL;
    END IF;

    -- Return the session data with additional info
    SELECT 
        t.*,
        v_today_seconds_spent as todaySecondsSpent,
        CASE 
            WHEN v_max_access_minutes > 0 THEN (v_max_access_minutes * 60)
            ELSE NULL 
        END as maxDailySeconds,
        v_remaining_seconds as remainingSeconds,
        v_now as sessionStartTime
    FROM tbl_course_time_tracking t 
    WHERE t.id = v_session_id;

    COMMIT;
END;`);


        // End a course session and update time spent
        await sequelize.query(`DROP PROCEDURE IF EXISTS end_course_session`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS end_course_session(
    IN p_enrollment_id INT,
    IN p_user_id INT,
    IN p_actual_time_spent INT  -- actual time spent in seconds
)
BEGIN
    DECLARE v_active_session_id INT;
    DECLARE v_session_start DATETIME;
    DECLARE v_tracking_date DATE;
    DECLARE v_current_date DATE;
    DECLARE v_now DATETIME;
    DECLARE v_midnight DATETIME;
    DECLARE v_actual_seconds_spent INT;
    DECLARE v_total_wall_clock_seconds INT;
    DECLARE v_before_midnight_wall_clock INT;
    DECLARE v_after_midnight_wall_clock INT;
    DECLARE v_before_midnight_ratio DECIMAL(10, 4);
    DECLARE v_yesterday_actual_time INT;
    DECLARE v_today_actual_time INT;
    DECLARE v_total_today_seconds INT;
    DECLARE v_total_enrollment_seconds INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SET v_now = NOW();
    SET v_current_date = CURDATE();
    SET v_actual_seconds_spent = COALESCE(p_actual_time_spent, 0);

    -- Get active session
    SELECT id, last_session_start, tracking_date
    INTO v_active_session_id, v_session_start, v_tracking_date
    FROM tbl_course_time_tracking
    WHERE enrollment_id = p_enrollment_id
      AND last_session_start IS NOT NULL
      AND last_session_end IS NULL
    ORDER BY last_session_start DESC
    LIMIT 1;

    IF v_active_session_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|No active session found';
    END IF;

    -- If session crossed midnight
    IF DATE(v_session_start) < v_current_date THEN
        SET v_midnight = DATE_ADD(DATE(v_session_start), INTERVAL 1 DAY);
        
        SET v_total_wall_clock_seconds = TIMESTAMPDIFF(SECOND, v_session_start, v_now);
        SET v_before_midnight_wall_clock = TIMESTAMPDIFF(SECOND, v_session_start, v_midnight);
        SET v_after_midnight_wall_clock = TIMESTAMPDIFF(SECOND, v_midnight, v_now);
        
        SET v_before_midnight_ratio = CASE 
            WHEN v_total_wall_clock_seconds > 0 THEN v_before_midnight_wall_clock / v_total_wall_clock_seconds
            ELSE 0 
        END;
        
        SET v_yesterday_actual_time = FLOOR(v_actual_seconds_spent * v_before_midnight_ratio);
        SET v_today_actual_time = v_actual_seconds_spent - v_yesterday_actual_time;

        -- Update yesterday’s tracking record
        UPDATE tbl_course_time_tracking
        SET total_time_spent = v_yesterday_actual_time,
            last_session_end = v_midnight,
            updated_by = p_user_id,
            updated_at = v_now
        WHERE id = v_active_session_id;

        -- Insert today’s record if needed
        IF v_today_actual_time > 0 THEN
            INSERT INTO tbl_course_time_tracking (
                enrollment_id, tracking_date, total_time_spent,
                last_session_start, last_session_end,
                created_by, updated_by, created_at, updated_at
            ) VALUES (
                p_enrollment_id, v_current_date, v_today_actual_time,
                v_midnight, v_now, p_user_id, p_user_id, v_now, v_now
            );
        END IF;

        -- Update enrollment total_time_spent (add both yesterday + today)
        UPDATE tbl_enrollments
        SET total_time_spent = total_time_spent + v_actual_seconds_spent,
            updated_by = p_user_id,
            updated_at = v_now
        WHERE id = p_enrollment_id;

        SELECT 
            'Course session ended with midnight transition' as message,
            JSON_OBJECT(
                'yesterdaySession', JSON_OBJECT(
                    'date', v_tracking_date,
                    'durationInSeconds', v_yesterday_actual_time
                ),
                'todaySession', JSON_OBJECT(
                    'date', v_current_date,
                    'durationInSeconds', v_today_actual_time
                ),
                'totalSessionDurationInSeconds', v_actual_seconds_spent,
                'actualEngagedTimeInSeconds', v_actual_seconds_spent
            ) as data;

    ELSE
        -- Same-day session
        UPDATE tbl_course_time_tracking
        SET total_time_spent = v_actual_seconds_spent,
            last_session_end = v_now,
            updated_by = p_user_id,
            updated_at = v_now
        WHERE id = v_active_session_id;

        -- Update enrollment’s total_time_spent
        UPDATE tbl_enrollments
        SET total_time_spent = total_time_spent + v_actual_seconds_spent,
            updated_by = p_user_id,
            updated_at = v_now
        WHERE id = p_enrollment_id;

        -- Calculate today’s total
        SELECT COALESCE(SUM(total_time_spent), 0) INTO v_total_today_seconds
        FROM tbl_course_time_tracking
        WHERE enrollment_id = p_enrollment_id
          AND tracking_date = v_current_date;

        -- Get updated enrollment total
        SELECT total_time_spent INTO v_total_enrollment_seconds
        FROM tbl_enrollments WHERE id = p_enrollment_id;

        SELECT 
            'Course session ended successfully' as message,
            JSON_OBJECT(
                'sessionDurationInSeconds', v_actual_seconds_spent,
                'sessionTimeSpentInSeconds', v_actual_seconds_spent,
                'totalTodaySeconds', v_total_today_seconds,
                'totalTodayHours', ROUND(v_total_today_seconds / 3600, 2),
                'totalEnrollmentSeconds', v_total_enrollment_seconds,
                'totalEnrollmentHours', ROUND(v_total_enrollment_seconds / 3600, 2),
                'date', v_tracking_date,
                'sessionStartTime', v_session_start,
                'sessionEndTime', v_now,
                'actualEngagedTimeInSeconds', v_actual_seconds_spent
            ) as data;
    END IF;

    COMMIT;
END;
`);



        // Update a course session
        await sequelize.query(`DROP PROCEDURE IF EXISTS update_course_session`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS update_course_session(
    IN p_enrollment_id INT,
    IN p_user_id INT,
    IN p_seconds_spent INT  -- actual time spent in seconds
)
BEGIN
    DECLARE v_active_session_id INT;
    DECLARE v_current_total_time INT;
    DECLARE v_new_total_time INT;
    DECLARE v_tracking_date DATE;
    DECLARE v_current_date DATE;
    DECLARE v_now DATETIME;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Set initial variables
    SET v_now = NOW();
    SET v_current_date = CURDATE();

    -- Find the active session (today, not ended yet)
    SELECT id, total_time_spent, tracking_date
    INTO v_active_session_id, v_current_total_time, v_tracking_date
    FROM tbl_course_time_tracking
    WHERE enrollment_id = p_enrollment_id
      AND tracking_date = v_current_date
      AND last_session_start IS NOT NULL
      AND last_session_end IS NULL
    ORDER BY last_session_start DESC
    LIMIT 1;

    -- Return error if no active session found
    IF v_active_session_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|No active session found';
    END IF;

    -- Calculate new total time (in seconds)
    SET v_new_total_time = v_current_total_time + p_seconds_spent;

    -- Update the session with accumulated time
    UPDATE tbl_course_time_tracking
    SET total_time_spent = v_new_total_time,  -- stored in seconds
        updated_by = p_user_id,
        updated_at = v_now
    WHERE id = v_active_session_id;

    -- Return success response with session data
    SELECT 
        'Session time updated successfully' as message,
        JSON_OBJECT(
            'sessionTimeSpentInSeconds', v_new_total_time,
            'trackingDate', v_tracking_date,
            'secondsAdded', p_seconds_spent
        ) as data;

    COMMIT;
END;`);


        // Check if a student can access a course based on daily time restrictions
        await sequelize.query(`DROP PROCEDURE IF EXISTS checkCourseAccess`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS checkCourseAccess(
    IN p_enrollment_id INT
)
BEGIN
    DECLARE v_enrollment_exists INT;
    DECLARE v_course_id INT;
    DECLARE v_min_access_minutes DECIMAL(10, 2);
    DECLARE v_max_access_minutes DECIMAL(10, 2);
    DECLARE v_min_access_seconds INT;
    DECLARE v_max_access_seconds INT;
    DECLARE v_today_seconds_spent INT;
    DECLARE v_total_seconds_spent INT;
    DECLARE v_has_active_session INT;
    DECLARE v_current_date DATE;
    DECLARE v_can_access BOOLEAN;
    DECLARE v_should_auto_start BOOLEAN;
    DECLARE v_reason TEXT;
    DECLARE v_daily_breakdown JSON;
    DECLARE v_max_hours_restriction BOOLEAN;
    DECLARE v_remaining_seconds INT;
    DECLARE v_max_daily_seconds INT;

    SET v_current_date = CURDATE();

    -- Check if enrollment exists
    SELECT COUNT(*) INTO v_enrollment_exists
    FROM tbl_enrollments
    WHERE id = p_enrollment_id;

    IF v_enrollment_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Enrollment not found';
    END IF;

    -- Get course ID and access limits (in minutes from table)
    SELECT course_id, min_access_minutes, max_access_minutes 
    INTO v_course_id, v_min_access_minutes, v_max_access_minutes
    FROM tbl_enrollments
    JOIN tbl_courses ON tbl_enrollments.course_id = tbl_courses.id
    WHERE tbl_enrollments.id = p_enrollment_id;

    -- Convert access limits to seconds
    SET v_min_access_seconds = CASE 
        WHEN v_min_access_minutes IS NOT NULL AND v_min_access_minutes > 0 THEN v_min_access_minutes * 60 
        ELSE NULL 
    END;
    SET v_max_access_seconds = CASE 
        WHEN v_max_access_minutes IS NOT NULL AND v_max_access_minutes > 0 THEN v_max_access_minutes * 60 
        ELSE NULL 
    END;

    -- Calculate today's total seconds spent
    SELECT IFNULL(SUM(total_time_spent), 0) INTO v_today_seconds_spent
    FROM tbl_course_time_tracking
    WHERE enrollment_id = p_enrollment_id
      AND tracking_date = v_current_date;

    -- Check if there's an active session
    SELECT COUNT(*) INTO v_has_active_session
    FROM tbl_course_time_tracking
    WHERE enrollment_id = p_enrollment_id
      AND tracking_date = v_current_date
      AND last_session_start IS NOT NULL
      AND last_session_end IS NULL;

    -- Calculate total seconds across all days
    SELECT IFNULL(SUM(total_time_spent), 0) INTO v_total_seconds_spent
    FROM tbl_course_time_tracking
    WHERE enrollment_id = p_enrollment_id;

    -- Check daily time restrictions
    SET v_max_hours_restriction = (v_max_access_seconds IS NOT NULL AND v_today_seconds_spent >= v_max_access_seconds);

    -- Calculate remaining time for today (seconds)
    SET v_max_daily_seconds = v_max_access_seconds;
    SET v_remaining_seconds = CASE 
        WHEN v_max_daily_seconds IS NOT NULL THEN GREATEST(0, v_max_daily_seconds - v_today_seconds_spent)
        ELSE NULL 
    END;

    -- Determine if user can access
    SET v_can_access = NOT v_max_hours_restriction;

    -- Determine if auto-start should happen
    SET v_should_auto_start = (v_can_access AND v_has_active_session = 0 AND (v_remaining_seconds IS NULL OR v_remaining_seconds > 0));

    -- Set reason
    IF v_max_hours_restriction THEN
        SET v_reason = CONCAT('Maximum ', v_max_access_seconds, ' seconds exceeded today (', v_today_seconds_spent, ' completed)');
    ELSE
        SET v_reason = NULL;
    END IF;

    -- Get daily breakdown (in seconds)
    SET v_daily_breakdown = (
        SELECT IFNULL(
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'date', tracking_date,
                    'secondsSpent', seconds_spent,
                    'minutesSpent', FLOOR(seconds_spent / 60),
                    'hoursSpent', FORMAT((seconds_spent / 3600), 2)
                )
            ),
            JSON_ARRAY()
        )
        FROM (
            SELECT 
                tracking_date, 
                SUM(total_time_spent) AS seconds_spent
            FROM tbl_course_time_tracking
            WHERE enrollment_id = p_enrollment_id
            GROUP BY tracking_date
            ORDER BY tracking_date DESC
        ) AS daily_stats
    );

    -- Return access details
    SELECT JSON_OBJECT(
    'canAccess', v_can_access,
    'hasActiveSession', v_has_active_session > 0,
    'shouldAutoStart', v_should_auto_start,
    'reason', v_reason,

    -- Today's usage
    'todaySecondsSpent', v_today_seconds_spent,
    'todayMinutesSpent', FLOOR(v_today_seconds_spent / 60),
    'todayHoursSpent', FORMAT((v_today_seconds_spent / 3600), 2),

    -- Total usage
    'totalSecondsSpent', v_total_seconds_spent,
    'totalMinutesSpent', FLOOR(v_total_seconds_spent / 60),
    'totalHoursSpent', FORMAT((v_total_seconds_spent / 3600), 2),

    -- Minimum requirement
    'minRequiredDailySeconds', v_min_access_seconds,
    'minRequiredDailyMinutes', v_min_access_minutes,
    'minRequiredDailyHours', CASE 
        WHEN v_min_access_seconds IS NOT NULL THEN FORMAT((v_min_access_seconds / 3600), 2)
        ELSE NULL 
    END,

    -- Maximum allowed
    'maxAllowedDailySeconds', v_max_access_seconds,
    'maxAllowedDailyMinutes', v_max_access_minutes,
    'maxAllowedDailyHours', CASE 
        WHEN v_max_access_seconds IS NOT NULL THEN FORMAT((v_max_access_seconds / 3600), 2)
        ELSE NULL 
    END,

    -- Remaining time
    'remainingSeconds', v_remaining_seconds,
    'remainingMinutes', CASE 
        WHEN v_remaining_seconds IS NOT NULL THEN FLOOR(v_remaining_seconds / 60)
        ELSE NULL 
    END,
    'remainingHours', CASE 
        WHEN v_remaining_seconds IS NOT NULL THEN FORMAT((v_remaining_seconds / 3600), 2)
        ELSE NULL 
    END,

    -- Extra breakdown of today in hours, minutes, seconds
    'todayBreakdown', JSON_OBJECT(
        'hours', FLOOR(v_today_seconds_spent / 3600),
        'minutes', FLOOR((v_today_seconds_spent % 3600) / 60),
        'seconds', v_today_seconds_spent % 60
    ),

    -- Extra breakdown of total in hours, minutes, seconds
    'totalBreakdown', JSON_OBJECT(
        'hours', FLOOR(v_total_seconds_spent / 3600),
        'minutes', FLOOR((v_total_seconds_spent % 3600) / 60),
        'seconds', v_total_seconds_spent % 60
    ),

    'currentDate', v_current_date,
    'dailyBreakdown', v_daily_breakdown
) AS data;
END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getDailyBreakdown`);
        await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS getDailyBreakdown(
    IN p_enrollment_id INT
)
BEGIN
    SELECT
        tracking_date AS date,
        SUM(total_time_spent) AS minutesSpent,
        (SUM(total_time_spent) / 60) AS hoursSpent
    FROM
        tbl_course_time_tracking
    WHERE
        enrollment_id = p_enrollment_id
    GROUP BY
        tracking_date
    ORDER BY
        tracking_date DESC;
END;
    `);

        // Get user's course time statistics
        await sequelize.query(`DROP PROCEDURE IF EXISTS getCourseTimeStats`);
        await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS getCourseTimeStats(
        IN p_enrollment_id INT
      )
      BEGIN
        DECLARE v_enrollment_exists INT;
        DECLARE v_total_minutes_spent INT;
        DECLARE v_hours_spent INT;
        DECLARE v_remaining_minutes INT;
        DECLARE v_latest_session_start DATETIME;
        DECLARE v_latest_session_end DATETIME;
        DECLARE v_current_status VARCHAR(10);

        -- Check if enrollment exists
        SELECT COUNT(*) INTO v_enrollment_exists
        FROM tbl_enrollments
        WHERE id = p_enrollment_id;

        IF v_enrollment_exists = 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'E404|NotFoundError|Enrollment not found';
        END IF;

        -- Calculate total minutes across all days
        SELECT IFNULL(SUM(total_time_spent), 0) INTO v_total_minutes_spent
        FROM tbl_course_time_tracking
        WHERE enrollment_id = p_enrollment_id;

        SET v_hours_spent = FLOOR(v_total_minutes_spent / 60);
        SET v_remaining_minutes = v_total_minutes_spent % 60;

        -- Get the most recent session
        SELECT last_session_start, last_session_end INTO v_latest_session_start, v_latest_session_end
        FROM tbl_course_time_tracking
        WHERE enrollment_id = p_enrollment_id
        ORDER BY last_session_start DESC
        LIMIT 1;

        SET v_current_status = IF(v_latest_session_start IS NOT NULL AND v_latest_session_end IS NULL, 'active', 'inactive');

        -- Return time statistics
        SELECT JSON_OBJECT(
          'totalTimeSpent', JSON_OBJECT('minutes', v_total_minutes_spent, 'formatted', CONCAT(v_hours_spent, 'h ', v_remaining_minutes, 'm')),
          'courseDuration', (SELECT duration_minutes FROM tbl_courses WHERE id = (SELECT course_id FROM tbl_enrollments WHERE id = p_enrollment_id)),
          'lastSessionStart', v_latest_session_start,
          'lastSessionEnd', v_latest_session_end,
          'currentStatus', v_current_status,
          'enrollment', JSON_OBJECT('id', p_enrollment_id, 'courseName', (SELECT title FROM tbl_courses WHERE id = (SELECT course_id FROM tbl_enrollments WHERE id = p_enrollment_id))),
          'dailyBreakdown', (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'date', tracking_date,
                'minutesSpent', total_time_spent,
                'formattedTime', CONCAT(FLOOR(total_time_spent / 60), 'h ', total_time_spent % 60, 'm')
              )
            )
            FROM tbl_course_time_tracking
            WHERE enrollment_id = p_enrollment_id
            ORDER BY tracking_date DESC
          )
        ) AS data;
      END;
    `);

        // Get user's course time statistics
        await sequelize.query(`DROP PROCEDURE IF EXISTS getCourseTotalTimeSpentByUser`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCourseTotalTimeSpentByUser(
            IN p_user_id INT,
            IN p_course_public_hash VARCHAR(255)
        )
        BEGIN
            DECLARE v_enrollment_id INT;
            DECLARE v_total_time_spent INT DEFAULT 0;

            -- 1 Find enrollment for user + course
            SELECT e.id
            INTO v_enrollment_id
            FROM tbl_enrollments e
            INNER JOIN tbl_courses c ON c.id = e.course_id
            WHERE e.user_id = p_user_id
            AND c.public_hash = p_course_public_hash
            LIMIT 1;

            -- 2 If enrollment not found
            IF v_enrollment_id IS NULL THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'E404|NotFoundError|Enrollment not found';
            END IF;

            -- 3 Sum total minutes from tracking table
            SELECT IFNULL(SUM(total_time_spent), 0)
            INTO v_total_time_spent
            FROM tbl_course_time_tracking
            WHERE enrollment_id = v_enrollment_id;

            -- 4 Return total time in SECONDS
            SELECT
                p_user_id              AS user_id,
                p_course_public_hash   AS course_public_hash,
                v_enrollment_id        AS enrollment_id,
                v_total_time_spent AS total_time_spent;
        END;`);

        // Reset course session for a specific date (for administrative purposes)
        await sequelize.query(`DROP PROCEDURE IF EXISTS resetCourseSession`);
        await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS resetCourseSession(
        IN p_enrollment_id INT,
        IN p_tracking_date DATE,
        IN p_admin_id INT
      )
      BEGIN
        DECLARE v_time_tracking_exists INT;

        -- Check if time tracking record exists
        SELECT COUNT(*) INTO v_time_tracking_exists
        FROM tbl_course_time_tracking
        WHERE enrollment_id = p_enrollment_id
          AND tracking_date = IFNULL(p_tracking_date, CURDATE());

        IF v_time_tracking_exists = 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'E404|NotFoundError|Time tracking record not found for the specified date';
        END IF;

        -- Reset time tracking data
        UPDATE tbl_course_time_tracking
        SET total_time_spent = 0,
            last_session_start = NULL,
            last_session_end = NULL,
            updated_by = p_admin_id
        WHERE enrollment_id = p_enrollment_id
          AND tracking_date = IFNULL(p_tracking_date, CURDATE());

        -- Return the updated record
        SELECT *
        FROM tbl_course_time_tracking
        WHERE enrollment_id = p_enrollment_id
          AND tracking_date = IFNULL(p_tracking_date, CURDATE());
      END;
    `);

        // Reset all time tracking for a course enrollment (for administrative purposes)
        await sequelize.query(`DROP PROCEDURE IF EXISTS resetAllCourseSessions`);
        await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS resetAllCourseSessions(
        IN p_enrollment_id INT,
        IN p_admin_id INT
      )
      BEGIN
        -- Delete all time tracking records for this enrollment
        DELETE FROM tbl_course_time_tracking
        WHERE enrollment_id = p_enrollment_id;

        -- Return the number of deleted records
        SELECT ROW_COUNT() AS deleted;
      END;
    `);

        console.log("✅ Course Time Tracking procedures created successfully!");
    } catch (error) {
        console.error("❌ Error setting up course time tracking procedures:", error);
        throw error;
    }
};

module.exports = setupCourseTimeTrackingProcedures;
