const sequelize = require("../../config/db");

const setupChallengeAnalytics = async () => {
    try {
        console.log("🔄 Setting up Challenge Analytics procedures...");

        // get completion stats across all challenges
        // await sequelize.query(`DROP PROCEDURE IF EXISTS getCompletionStatsAcrossAllChallenges`)
        // await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCompletionStatsAcrossAllChallenges()
        //     BEGIN
        //         SELECT
        //             c.id AS challenge_id,
        //             c.title AS challenge_name,
        //             COUNT(DISTINCT uc.user_id) AS total_users,
        //             SUM(CASE WHEN uc.is_completed = 1 THEN 1 ELSE 0 END) AS completed_users,
        //             (SUM(CASE WHEN uc.is_completed = 1 THEN 1 ELSE 0 END) / COUNT(DISTINCT uc.user_id)) * 100 AS completion_rate
        //         FROM tbl_challenges c
        //         LEFT JOIN tbl_user_challenge uc ON uc.challenge_id = c.id
        //         GROUP BY c.id, c.title
        //         ORDER BY completion_rate DESC;
        //     END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getCompletionStatsAcrossAllChallenges`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCompletionStatsAcrossAllChallenges(
    IN p_type VARCHAR(50)
)
BEGIN

    SELECT * FROM (

        -- Challenge Quest
        SELECT
            c.id AS challenge_id,
            c.title AS challenge_name,
            'challenge_quest' AS challenge_type,
            COUNT(DISTINCT uc.user_id) AS total_users,
            SUM(CASE WHEN uc.is_completed = 1 THEN 1 ELSE 0 END) AS completed_users,
            ROUND(
                (SUM(CASE WHEN uc.is_completed = 1 THEN 1 ELSE 0 END) 
                / NULLIF(COUNT(DISTINCT uc.user_id), 0)) * 100,
            2) AS completion_rate
        FROM tbl_challenges c
        LEFT JOIN tbl_user_challenge uc 
            ON uc.challenge_id = c.id
        GROUP BY c.id, c.title

        UNION ALL

        -- Daily Challenge
        SELECT
            dc.id AS challenge_id,
            dc.title AS challenge_name,
            'daily_challenge' AS challenge_type,
            COUNT(DISTINCT udc.user_id) AS total_users,
            SUM(CASE WHEN udc.is_completed = 1 THEN 1 ELSE 0 END) AS completed_users,
            ROUND(
                (SUM(CASE WHEN udc.is_completed = 1 THEN 1 ELSE 0 END) 
                / NULLIF(COUNT(DISTINCT udc.user_id), 0)) * 100,
            2) AS completion_rate
        FROM tbl_daily_challenges dc
        LEFT JOIN tbl_user_daily_challenge udc 
            ON udc.challenge_id = dc.id
        GROUP BY dc.id, dc.title

        UNION ALL

        -- Contest
        SELECT
            ct.id AS challenge_id,
            ct.title AS challenge_name,
            'contest' AS challenge_type,
            COUNT(DISTINCT uce.user_id) AS total_users,

            -- completion logic: score is not null
            SUM(CASE WHEN uce.score IS NOT NULL THEN 1 ELSE 0 END) AS completed_users,

            ROUND(
                (SUM(CASE WHEN uce.score IS NOT NULL THEN 1 ELSE 0 END)
                / NULLIF(COUNT(DISTINCT uce.user_id), 0)) * 100,
            2) AS completion_rate

        FROM tbl_contests ct
        LEFT JOIN tbl_user_contest_enrollments uce
            ON uce.contest_id = ct.id
            AND uce.status = 'active'
        GROUP BY ct.id, ct.title

    ) AS combined_data

    WHERE 
        p_type = 'all'
        OR challenge_type = p_type

    ORDER BY completion_rate DESC;

END;`)

        // user learning overview.
        // await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getUserLearningOverview()
        //     BEGIN
        //         SELECT
        //             uc.user_id,
        //             u.full_name AS user_name,
        //             COUNT(uc.id) AS total_challenges_attempted,
        //             SUM(CASE WHEN uc.is_completed = 1 THEN 1 ELSE 0 END) AS total_challenges_completed,
        //             SUM(uc.points_earned) AS total_points_earned,
        //             AVG(uc.progress_percentage) AS average_progress_percentage
        //         FROM tbl_user_challenge uc
        //         JOIN tbl_users u ON uc.user_id = u.id
        //         GROUP BY uc.user_id, u.full_name;
        //     END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getUserLearningOverview`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getUserLearningOverview()
                BEGIN
                    SELECT
                        u.id AS user_id,
                        u.full_name AS user_name,

                        COALESCE(ch.total_challenges_attempted, 0) 
                            AS total_challenges_attempted,

                        COALESCE(ch.total_challenges_completed, 0) 
                            AS total_challenges_completed,

                        COALESCE(ch.total_points_earned, 0) 
                            AS total_points_earned,

                        ch.average_progress_percentage,

                        COALESCE(dc.total_daily_challenges_attempted, 0) 
                            AS total_daily_challenges_attempted,

                        COALESCE(dc.total_daily_challenges_completed, 0) 
                            AS total_daily_challenges_completed,

                        COALESCE(dc.daily_challenge_points_earned, 0) 
                            AS daily_challenge_points_earned

                    FROM tbl_users u

                    LEFT JOIN (
                        SELECT
                            uc.user_id,
                            COUNT(uc.id) 
                                AS total_challenges_attempted,
                            SUM(CASE WHEN uc.is_completed = 1 THEN 1 ELSE 0 END) 
                                AS total_challenges_completed,
                            SUM(uc.points_earned) 
                                AS total_points_earned,
                            AVG(uc.progress_percentage) 
                                AS average_progress_percentage
                        FROM tbl_user_challenge uc
                        GROUP BY uc.user_id
                    ) ch ON ch.user_id = u.id

                    LEFT JOIN (
                        SELECT
                            udc.user_id,
                            COUNT(udc.id) 
                                AS total_daily_challenges_attempted,
                            SUM(CASE WHEN udc.is_completed = 1 THEN 1 ELSE 0 END) 
                                AS total_daily_challenges_completed,
                            SUM(udc.points_earned) 
                                AS daily_challenge_points_earned
                        FROM tbl_user_daily_challenge udc
                        GROUP BY udc.user_id
                    ) dc ON dc.user_id = u.id;
                END;`);

        //average attempts required to complete challenges.
        // await sequelize.query(`DROP PROCEDURE IF EXISTS getAttemptsRequiredToCompleteChallenges`);
        // await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAttemptsRequiredToCompleteChallenges()
        //     BEGIN
        //         SELECT
        //             c.id AS challenge_id,
        //             c.title AS challenge_name,
        //             AVG(uct.attempts) AS average_attempts
        //         FROM tbl_challenges c
        //         JOIN tbl_user_challenge uc ON uc.challenge_id = c.id
        //         JOIN tbl_user_challenge_phases ucp ON ucp.user_challenge_id = uc.id
        //         JOIN tbl_user_challenge_tasks uct ON uct.user_challenge_phase_id = ucp.id
        //         WHERE uc.is_completed = 1 AND uct.is_completed = 1
        //         GROUP BY c.id, c.title
        //         ORDER BY average_attempts DESC;
        //     END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getAttemptsRequiredToCompleteChallenges`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAttemptsRequiredToCompleteChallenges()
        BEGIN
            SELECT
                dc.id AS challenge_id,
                dc.title AS challenge_name,
                'daily_challenge' AS challenge_type,
                ROUND(AVG(fp.attempt_number), 2) AS average_attempts
            FROM (
                SELECT
                    cr.user_challenge_id,
                    MIN(cr.attempt_number) AS attempt_number
                FROM tbl_challenge_response cr
                WHERE cr.user_challenge_id IS NOT NULL
                  AND cr.is_passed = 1
                GROUP BY cr.user_challenge_id
            ) fp
            JOIN tbl_user_daily_challenge udc 
                ON udc.id = fp.user_challenge_id
            JOIN tbl_daily_challenges dc 
                ON dc.id = udc.challenge_id
            GROUP BY dc.id, dc.title

            UNION ALL

            SELECT
                c.id AS challenge_id,
                c.title AS challenge_name,
                'challenge' AS challenge_type,
                ROUND(AVG(fp.attempt_number), 2) AS average_attempts
            FROM (
                SELECT
                    cr.user_challenge_task_id,
                    MIN(cr.attempt_number) AS attempt_number
                FROM tbl_challenge_response cr
                WHERE cr.user_challenge_task_id IS NOT NULL
                  AND cr.is_passed = 1
                GROUP BY cr.user_challenge_task_id
            ) fp
            JOIN tbl_user_challenge_tasks uct 
                ON uct.id = fp.user_challenge_task_id
            JOIN tbl_user_challenge_phases ucp 
                ON ucp.id = uct.user_challenge_phase_id
            JOIN tbl_user_challenge uc 
                ON uc.id = ucp.user_challenge_id
            JOIN tbl_challenges c 
                ON c.id = uc.challenge_id
            GROUP BY c.id, c.title

            ORDER BY average_attempts DESC;
        END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getContestOverviewStats`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getContestOverviewStats()
BEGIN
    SELECT 
        c.id AS contest_id,
        c.title AS contest_name,
        c.banner_url,
        c.status AS contest_status,
        
        -- Total participants (enrolled users with active status)
        COUNT(DISTINCT uce.user_id) AS total_participants,
        
        -- Completion rate: users who have score (attempted at least one activity)
        ROUND(
            (SUM(CASE WHEN uce.score IS NOT NULL THEN 1 ELSE 0 END) 
            / NULLIF(COUNT(DISTINCT uce.user_id), 0)) * 100,
        2) AS completion_rate,
        
        -- Average score across all enrolled users
        ROUND(AVG(uce.score), 2) AS avg_score,
        
        -- Drop-off Rate: registered but didn't attempt any activity
        ROUND(
            (SUM(CASE WHEN uce.score IS NULL THEN 1 ELSE 0 END) 
            / NULLIF(COUNT(DISTINCT uce.user_id), 0)) * 100,
        2) AS drop_off_rate
        
    FROM tbl_contests c
    LEFT JOIN tbl_user_contest_enrollments uce 
        ON uce.contest_id = c.id 
    GROUP BY c.id, c.title, c.banner_url, c.status
    ORDER BY c.created_at DESC;
END;`)

        await sequelize.query(`DROP PROCEDURE IF EXISTS getContestAttemptAnalytics`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getContestAttemptAnalytics()
BEGIN

    -- QUIZ ANALYTICS
    SELECT 
        'quiz' AS type,
        cq.id AS item_id,
        cq.title AS name,

        -- Avg attempts per user
        ROUND(
            COUNT(ucq.id) / NULLIF(COUNT(DISTINCT ucq.user_id), 0),
            2
        ) AS avg_attempts_per_user,

        -- Completion ratio
        ROUND(
            COUNT(DISTINCT CASE WHEN ucq.status = 'completed' THEN ucq.user_id END)
            / NULLIF(COUNT(DISTINCT ucq.user_id), 0),
            2
        ) AS completion_ratio
    FROM tbl_contest_quizzes cq
    LEFT JOIN tbl_user_contest_quizzes ucq 
        ON ucq.quiz_id = cq.id
    GROUP BY cq.id

    UNION ALL

    -- CODING ANALYTICS
    SELECT 
        'coding' AS type,
        cc.id AS item_id,
        cc.title AS name,

        -- Avg attempts per user
        ROUND(
            COUNT(ucc.id) / NULLIF(COUNT(DISTINCT ucc.user_id), 0),
            2
        ) AS avg_attempts_per_user,

        -- Completion ratio
        ROUND(
            COUNT(DISTINCT CASE WHEN ucc.status = 'completed' THEN ucc.user_id END)
            / NULLIF(COUNT(DISTINCT ucc.user_id), 0),
            2
        ) AS completion_ratio
    FROM tbl_contest_coding cc
    LEFT JOIN tbl_user_contest_codings ucc 
        ON ucc.coding_id = cc.id
    GROUP BY cc.id

    ORDER BY avg_attempts_per_user DESC;

END;`)

        console.log("✅ Challenge Analytics procedures created!");
    } catch (error) {
        console.error("❌ Error setting up Challenge Analytics procedures:", error);
        throw error;
    }
};

module.exports = setupChallengeAnalytics;
