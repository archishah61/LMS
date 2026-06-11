const sequelize = require("../../../config/db");

const setupUserCodingProcedures = async () => {
    try {
        console.log("🔄 Setting up user contest coding procedures...");

        await sequelize.query(`DROP PROCEDURE IF EXISTS GetUserContestCodingAttempts`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetUserContestCodingAttempts (
    IN p_user_id INT,
    IN p_coding_id INT
)
BEGIN
    SELECT 
        ucc.id,
        ucc.user_id,
        ucc.contest_id,
        ucc.coding_id,
        ucc.attempt_number,
        ucc.score,
        ucc.time_taken_seconds,
        ucc.status,
        ucc.submitted_at,
        ucc.meta,
        ucc.created_at,
        ucc.updated_at,
        cc.title AS coding_title
    FROM tbl_user_contest_codings ucc
    JOIN tbl_contest_coding cc ON cc.id = ucc.coding_id
    WHERE ucc.user_id = p_user_id
      AND ucc.coding_id = p_coding_id
    ORDER BY ucc.attempt_number ASC;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS SaveUserContestCodingAttempt`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS SaveUserContestCodingAttempt (
    IN p_user_id INT,
    IN p_contest_id INT,
    IN p_coding_id INT,
    IN p_score FLOAT,
    IN p_time_taken_seconds INT,
    IN p_status ENUM('pending', 'completed', 'failed', 'skipped'),
    IN p_meta JSON
)
BEGIN
    DECLARE v_attempt_number INT DEFAULT 1;
    DECLARE v_user_contest_activity_id INT;
    DECLARE v_activity_id INT;
    DECLARE v_activity_points_reward INT DEFAULT 0;
    DECLARE v_activity_status VARCHAR(255);

    SELECT uca.id, uca.activity_id INTO v_user_contest_activity_id, v_activity_id
    FROM tbl_user_contest_activities uca
    JOIN tbl_contest_coding cc ON cc.activity_id = uca.activity_id
    WHERE uca.user_id = p_user_id 
    AND cc.id = p_coding_id
    AND uca.contest_id = p_contest_id
    LIMIT 1;

    IF p_status = 'completed' THEN
        -- Check if this coding was already completed before
        IF NOT EXISTS (
            SELECT 1 FROM tbl_user_contest_codings
            WHERE user_id = p_user_id 
            AND contest_id = p_contest_id
            AND coding_id = p_coding_id
            AND status = 'completed'
        ) THEN
            -- First time this coding is being rewarded
            UPDATE tbl_user_contest_activities
            SET score = score + p_score
            WHERE id = v_user_contest_activity_id;

            UPDATE tbl_user_contest_enrollments
            SET score = IFNULL(score,0) + p_score
            WHERE user_id = p_user_id AND contest_id = p_contest_id;
        END IF;

        -- Check if all active codings for this activity are completed
        IF NOT EXISTS (
            SELECT 1 FROM tbl_contest_coding cc
            WHERE cc.activity_id = (
                SELECT activity_id FROM tbl_user_contest_activities WHERE id = v_user_contest_activity_id
            )
            AND cc.is_active = TRUE
            AND NOT cc.id = p_coding_id
            AND NOT EXISTS (
                SELECT 1 FROM tbl_user_contest_codings uc
                WHERE uc.coding_id = cc.id
                    AND uc.user_id = p_user_id
                    AND uc.status = 'completed'
            )
        ) THEN
            SELECT points_reward INTO v_activity_points_reward FROM tbl_contest_activities
            WHERE id = v_activity_id;

            SELECT status INTO v_activity_status FROM tbl_user_contest_activities
            WHERE id = v_user_contest_activity_id;

            -- All coding problems are completed -> mark activity done
            UPDATE tbl_user_contest_activities
            SET status = 'completed', submitted_at = NOW()
            WHERE id = v_user_contest_activity_id;

            IF NOT v_activity_status = 'completed' THEN
                -- All coding problems are completed -> mark activity done
                UPDATE tbl_user_contest_activities
                SET score = score + v_activity_points_reward
                WHERE id = v_user_contest_activity_id;

                UPDATE tbl_user_contest_enrollments
                SET score = score + v_activity_points_reward
                WHERE user_id = p_user_id AND contest_id = p_contest_id;
            END IF;
        END IF;
    END IF;

    -- Find last attempt number
    SELECT IFNULL(MAX(attempt_number), 0) + 1 INTO v_attempt_number
    FROM tbl_user_contest_codings
    WHERE user_id = p_user_id
      AND contest_id = p_contest_id
      AND coding_id = p_coding_id;

    -- Insert attempt into tbl_user_contest_codings
    INSERT INTO tbl_user_contest_codings (
        user_id,
        contest_id,
        coding_id,
        attempt_number,
        score,
        time_taken_seconds,
        status,
        submitted_at,
        meta,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_contest_id,
        p_coding_id,
        v_attempt_number,
        p_score,
        p_time_taken_seconds,
        p_status,
        NOW(),
        p_meta,
        NOW(),
        NOW()
    );

    -- Return newly created row
    SELECT * 
    FROM tbl_user_contest_codings 
    WHERE id = LAST_INSERT_ID();
END`);

        console.log("✅ User contest coding procedures created!");
    } catch (error) {
        console.error("❌ Error setting user contest coding procedures:", error);
        throw error;
    }
};

module.exports = setupUserCodingProcedures;
