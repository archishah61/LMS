const sequelize = require("../../../config/db");

const setupUserContestProcedures = async () => {
    try {
        console.log("🔄 Setting up user contest procedures...");

        await sequelize.query(`DROP PROCEDURE IF EXISTS EnrollUserInContest`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS EnrollUserInContest (
            IN p_user_id INT,
            IN p_contest_id INT,
            IN p_payment_id INT
        )
        BEGIN
            DECLARE v_contest_count INT DEFAULT 0;
            DECLARE v_enrollment_count INT DEFAULT 0;
            DECLARE v_enrollment_id INT;
            DECLARE v_contest_title VARCHAR(255);
            DECLARE v_enroll_by VARCHAR(20);
            DECLARE v_payment_status VARCHAR(20);
            DECLARE v_enrollment_fee INT DEFAULT 0;
            DECLARE v_enrollment_start DATETIME;
            DECLARE v_enrollment_end DATETIME;
            DECLARE v_is_limited BOOLEAN DEFAULT FALSE;
            DECLARE v_max_participants INT DEFAULT NULL;
            DECLARE v_current_participants INT DEFAULT 0;
            DECLARE v_user_points INT DEFAULT 0;

            -- 1. Check if contest exists
            SELECT COUNT(*) INTO v_contest_count
            FROM tbl_contests
            WHERE id = p_contest_id;

            IF v_contest_count = 0 THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'E404|NotFoundError|Contest not found';
            END IF;

            -- 2. Get contest details
            SELECT title, enroll_by, enrollment_fee, enrollment_start, enrollment_end,
                   is_limites_participants, max_participants
            INTO v_contest_title, v_enroll_by, v_enrollment_fee, v_enrollment_start, v_enrollment_end,
                 v_is_limited, v_max_participants
            FROM tbl_contests
            WHERE id = p_contest_id;

            -- 3. Enrollment time validation
            IF v_enrollment_start IS NOT NULL AND v_enrollment_end IS NOT NULL THEN
                IF NOW() < v_enrollment_start OR NOW() > v_enrollment_end THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'E400|BadRequest|Enrollment period closed';
                END IF;
            END IF;

            -- 4. Check if user is already enrolled
            SELECT id INTO v_enrollment_id
            FROM tbl_user_contest_enrollments
            WHERE user_id = p_user_id
              AND contest_id = p_contest_id
            LIMIT 1;

            IF v_enrollment_id IS NOT NULL THEN
                -- return existing enrollment instead of error
                SELECT *
                FROM tbl_user_contest_enrollments
                WHERE id = v_enrollment_id;
            ELSE
                -- 5. Check max participants if contest is limited
                IF v_is_limited = TRUE THEN
                    SELECT COUNT(*) INTO v_current_participants
                    FROM tbl_user_contest_enrollments
                    WHERE contest_id = p_contest_id
                      AND status = 'active';

                    IF v_max_participants IS NOT NULL AND v_current_participants >= v_max_participants THEN
                        SIGNAL SQLSTATE '45000'
                        SET MESSAGE_TEXT = 'E400|BadRequest|Max participants reached';
                    END IF;
                END IF;

                -- 6. Points validation if contest is enroll by points
                IF v_enroll_by = "points" THEN
                    SELECT points INTO v_user_points
                    FROM tbl_user_points
                    WHERE user_id = p_user_id
                    LIMIT 1;

                    IF v_user_points IS NULL THEN
                        SET v_user_points = 0;
                    END IF;

                    IF v_user_points < v_enrollment_fee THEN
                        SIGNAL SQLSTATE '45000'
                        SET MESSAGE_TEXT = 'E400|BadRequest|Not enough points to enroll';
                    END IF;

                    -- Deduct points
                    CALL UpdateUserPointsById(
                        p_user_id,
                        v_enrollment_fee,
                        FALSE,
                        'contest_enrollment',
                        CONCAT('Enroll Contest ', v_contest_title)
                    );
                END IF;

                IF v_enroll_by = "paid" THEN
                    SELECT status INTO v_payment_status
                    FROM tbl_payments
                    WHERE id = p_payment_id
                    LIMIT 1;

                    IF v_payment_status != 'completed' THEN
                        SIGNAL SQLSTATE '45000'
                        SET MESSAGE_TEXT = 'E400|BadRequest|Payment is not completed';
                    END IF;
                END IF;

                -- 7. Insert new enrollment
                INSERT INTO tbl_user_contest_enrollments
                (user_id, contest_id, enrolled_at, status, created_at, updated_at)
                VALUES
                (p_user_id, p_contest_id, NOW(), 'active', NOW(), NOW());

                -- 8. Update contest total participants
                UPDATE tbl_contests
                SET total_participants = (
                    SELECT COUNT(*)
                    FROM tbl_user_contest_enrollments
                    WHERE contest_id = p_contest_id
                      AND status = 'active'
                )
                WHERE id = p_contest_id;

                -- Return the newly inserted enrollment
                SELECT *
                FROM tbl_user_contest_enrollments
                WHERE id = LAST_INSERT_ID();
            END IF;

        END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS CheckUserContestEnrollment`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS CheckUserContestEnrollment (
    IN p_user_id INT,
    IN p_contest_id INT
)
BEGIN
    DECLARE v_enrollment_id INT;

    -- Check if active enrollment exists
    SELECT id INTO v_enrollment_id
    FROM tbl_user_contest_enrollments
    WHERE user_id = p_user_id
      AND contest_id = p_contest_id
      AND status = 'active'
    LIMIT 1;

    IF v_enrollment_id IS NOT NULL THEN
        -- Return enrollment row
        SELECT * 
        FROM tbl_user_contest_enrollments
        WHERE id = v_enrollment_id;
    ELSE
        -- Throw error if not enrolled
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|User not enrolled in this contest';
    END IF;
        END`);

        await sequelize.query("DROP PROCEDURE IF EXISTS getUserEnrolledContests");
        await sequelize.query(`CREATE PROCEDURE getUserEnrolledContests(IN p_user_id INT)
BEGIN
    SELECT 
        c.*,
        cat.category AS category_name,
        uce.status AS enrollment_status,
        uce.score,
        uce.is_winner,
        uce.reward_points,
        uce.enrolled_at,

        CASE 
            WHEN (
                SELECT COUNT(*) 
                FROM tbl_contest_activities ca
                WHERE ca.contest_id = c.id
                  AND ca.is_active = TRUE
            ) = (
                SELECT COUNT(*) 
                FROM tbl_user_contest_activities uca
                WHERE uca.contest_id = c.id 
                  AND uca.user_id = p_user_id
                  AND uca.status = 'completed'
            )
            THEN TRUE
            ELSE FALSE
        END AS is_completed

    FROM tbl_user_contest_enrollments AS uce
    INNER JOIN tbl_contests AS c ON c.id = uce.contest_id
    LEFT JOIN tbl_challenge_categories AS cat ON cat.id = c.category_id
    WHERE uce.user_id = p_user_id;
        END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getLeaderboard`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getLeaderboard (
    IN p_contest_id INT,
    IN p_user_id INT,
    IN p_time_filter ENUM('daily','weekly','monthly', 'yearly', 'all'),
    IN p_category_filter INT,
    IN p_limit INT,
    IN p_offset INT,
    IN p_is_all BOOLEAN
)
BEGIN
    DECLARE v_start_date DATE;

    -- Calculate time filter start date
    IF p_time_filter = 'daily' THEN
        SET v_start_date = CURDATE();
    ELSEIF p_time_filter = 'weekly' THEN
        SET v_start_date = DATE_SUB(CURDATE(), INTERVAL 7 DAY);
    ELSEIF p_time_filter = 'monthly' THEN
        SET v_start_date = DATE_SUB(CURDATE(), INTERVAL 30 DAY);
    ELSEIF p_time_filter = 'yearly' THEN
        SET v_start_date = DATE_SUB(CURDATE(), INTERVAL 365 DAY);
    ELSE
        SET v_start_date = NULL; -- all-time
    END IF;

    IF p_is_all = TRUE THEN
        -- Main leaderboard response with nested activities
        SELECT 
            u.id AS user_id,
            u.username,
            u.full_name,
            u.profile_image,
            SUM(uca.score) AS total_score,
            DENSE_RANK() OVER (ORDER BY SUM(uca.score) DESC) AS user_rank,

            -- Activities JSON array
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'user_activity_id', ua.id,
                        'score', ua.score,
                        -- 'time_taken', ua.time_taken_seconds,
                        'status', ua.status,
                        'submitted_at', ua.submitted_at
                    )
                )
                FROM tbl_user_contest_activities ua
                WHERE ua.user_id = u.id
                AND (p_contest_id IS NULL OR ua.contest_id = p_contest_id)
                AND (v_start_date IS NULL OR DATE(ua.created_at) >= v_start_date)
            ) AS activities

        FROM tbl_user_contest_activities uca
        JOIN tbl_users u ON uca.user_id = u.id
        JOIN tbl_contests c ON c.id = uca.contest_id
        WHERE (p_contest_id IS NULL OR uca.contest_id = p_contest_id)
        AND (v_start_date IS NULL OR DATE(uca.created_at) >= v_start_date)
        AND (p_category_filter IS NULL OR c.category_id = p_category_filter)
        GROUP BY u.id, u.username, u.full_name, u.profile_image
        ORDER BY total_score DESC;
    ELSE
        SELECT 
            u.id AS user_id,
            u.username,
            u.full_name,
            u.profile_image,
            SUM(uca.score) AS total_score,
            DENSE_RANK() OVER (ORDER BY SUM(uca.score) DESC) AS user_rank,

            -- Activities JSON array
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'user_activity_id', ua.id,
                        'score', ua.score,
                        -- 'time_taken', ua.time_taken_seconds,
                        'status', ua.status,
                        'submitted_at', ua.submitted_at
                    )
                )
                FROM tbl_user_contest_activities ua
                WHERE ua.user_id = u.id
                AND (p_contest_id IS NULL OR ua.contest_id = p_contest_id)
                AND (v_start_date IS NULL OR DATE(ua.created_at) >= v_start_date)
            ) AS activities

        FROM tbl_user_contest_activities uca
        JOIN tbl_users u ON uca.user_id = u.id
        JOIN tbl_contests c ON c.id = uca.contest_id
        WHERE (p_contest_id IS NULL OR uca.contest_id = p_contest_id)
        AND (v_start_date IS NULL OR DATE(uca.created_at) >= v_start_date)
        AND (p_category_filter IS NULL OR c.category_id = p_category_filter)
        GROUP BY u.id, u.username, u.full_name, u.profile_image
        ORDER BY total_score DESC
        LIMIT p_limit OFFSET p_offset;
    END IF;

    -- Optional: If user_id provided, return just that user separately
    IF p_user_id IS NOT NULL THEN
        SELECT 
            ranked.user_id,
            ranked.username,
            ranked.full_name,
            ranked.profile_image,
            ranked.total_score,
            ranked.user_rank,
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'user_activity_id', ua.id,
                        'score', ua.score,
                        'status', ua.status,
                        'submitted_at', ua.submitted_at
                    )
                )
                FROM tbl_user_contest_activities ua
                WHERE ua.user_id = ranked.user_id
                AND (p_contest_id IS NULL OR ua.contest_id = p_contest_id)
                AND (v_start_date IS NULL OR DATE(ua.created_at) >= v_start_date)
            ) AS activities
        FROM (
            SELECT 
                u.id AS user_id,
                u.username,
                u.full_name,
                u.profile_image,
                SUM(uca.score) AS total_score,
                DENSE_RANK() OVER (ORDER BY SUM(uca.score) DESC) AS user_rank
            FROM tbl_user_contest_activities uca
            JOIN tbl_users u ON uca.user_id = u.id
            JOIN tbl_contests c ON c.id = uca.contest_id
            WHERE (p_contest_id IS NULL OR uca.contest_id = p_contest_id)
            AND (v_start_date IS NULL OR DATE(uca.created_at) >= v_start_date)
            AND (p_category_filter IS NULL OR c.category_id = p_category_filter)
            GROUP BY u.id, u.username, u.full_name, u.profile_image
        ) AS ranked
        WHERE ranked.user_id = p_user_id;
    END IF;
        END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS EndContestAndRewardUsers`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS EndContestAndRewardUsers (
    IN p_contest_id INT
)
BEGIN
    DECLARE v_end_time DATETIME;
    DECLARE v_title VARCHAR(255);
    DECLARE v_done INT DEFAULT 0;
    DECLARE v_user_id INT;
    DECLARE v_rank INT DEFAULT 0;
    DECLARE v_score INT;
    DECLARE v_prev_score INT DEFAULT NULL;
    DECLARE v_points_reward INT;
    DECLARE v_prize_desc VARCHAR(500);
    DECLARE v_contest_status VARCHAR(20);

    DECLARE v_contest_ended BOOLEAN DEFAULT FALSE;

    -- Cursor for users ordered by score
    DECLARE user_cursor CURSOR FOR
        SELECT uce.user_id, uce.score
        FROM tbl_user_contest_enrollments uce
        WHERE uce.contest_id = p_contest_id AND uce.score IS NOT NULL AND uce.score > 0
        ORDER BY uce.score DESC;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
    proc_end: BEGIN
    -- Get contest details
    SELECT end_time, title, status INTO v_end_time, v_title, v_contest_status
    FROM tbl_contests
    WHERE id = p_contest_id;

    -- If contest already ended -> return flag
    IF v_contest_status = 'ended' THEN
        SET v_contest_ended = TRUE;

        SELECT CONCAT('Contest ID ', p_contest_id, ' has already ended. Rewards were assigned earlier.') AS message,
               v_contest_ended AS contest_ended;
        LEAVE proc_end;
    END IF;

    -- If contest end time is reached
    IF v_end_time <= NOW() THEN
        SET v_contest_ended = TRUE;

        -- Update contest status
        UPDATE tbl_contests
        SET status = 'ended'
        WHERE id = p_contest_id;

        -- Process winners
        OPEN user_cursor;

        read_loop: LOOP
            FETCH user_cursor INTO v_user_id, v_score;
            IF v_done = 1 THEN
                LEAVE read_loop;
            END IF;

            IF v_prev_score IS NULL OR v_score < v_prev_score THEN
                SET v_rank = v_rank + 1;
            END IF;

            SET v_prev_score = v_score;

            -- Check prize for this rank
            SELECT prize_points, prize_description
            INTO v_points_reward, v_prize_desc
            FROM tbl_contest_prizes
            WHERE contest_id = p_contest_id
              AND is_active = 1
              AND (
                  (prize_type = 'position' AND position_start = v_rank)
                  OR
                  (prize_type = 'range' AND v_rank BETWEEN position_start AND position_end)
              )
            LIMIT 1;

            -- If prize found and not already rewarded
            IF v_points_reward IS NOT NULL THEN
                IF NOT EXISTS (
                    SELECT 1 FROM tbl_user_contest_enrollments
                    WHERE user_id = v_user_id
                      AND contest_id = p_contest_id
                      AND is_winner = TRUE
                ) THEN
                    -- Mark as winner
                    UPDATE tbl_user_contest_enrollments
                    SET is_winner = TRUE, reward_points = v_points_reward
                    WHERE user_id = v_user_id AND contest_id = p_contest_id;

                    -- Reward user
                    CALL UpdateUserPointsById(
                        v_user_id,
                        v_points_reward,
                        TRUE,
                        'contest_winner',
                        CONCAT('Winning contest: ', v_title)
                    );

                END IF;
            END IF;

        END LOOP;

        CLOSE user_cursor;

        SELECT CONCAT('Contest ID ', p_contest_id, ' has ended and rewards assigned successfully.') AS message,
               v_contest_ended AS contest_ended;

    ELSE
        SET v_contest_ended = FALSE;

        SELECT CONCAT('Contest ID ', p_contest_id, ' is still ongoing. No rewards assigned yet.') AS message,
               v_contest_ended AS contest_ended;
    END IF;

    END proc_end;
        END`);

        console.log("✅ User contest procedures created!");
    } catch (error) {
        console.error("❌ Error setting user contest procedures:", error);
        throw error;
    }
};

module.exports = setupUserContestProcedures;
