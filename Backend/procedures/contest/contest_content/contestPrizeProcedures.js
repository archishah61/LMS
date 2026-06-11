const sequelize = require("../../../config/db");

const setupContestPrizeProcedures = async () => {
  try {
    console.log("🔄 Setting up contest prize procedures...");

    await sequelize.query(`DROP PROCEDURE IF EXISTS CreateContestPrize`)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS CreateContestPrize (
    IN p_contest_id BIGINT,
    IN p_prize_type ENUM('position','range'),
    IN p_position_start INT,
    IN p_position_end INT,
    IN p_prize_points INT,
    IN p_prize_description VARCHAR(500),
    IN p_created_by BIGINT
)
BEGIN

    DECLARE v_exists INT;

    -- Validation: Check overlap or duplicate
    SELECT COUNT(*) INTO v_exists
    FROM tbl_contest_prizes
    WHERE contest_id = p_contest_id
      AND is_active = TRUE
      AND (
            (p_prize_type = 'position' AND prize_type = 'position' 
             AND position_start = p_position_start)
         OR (p_prize_type = 'range' AND prize_type = 'range'
             AND NOT (position_end < p_position_start OR position_start > p_position_end))
         OR (p_prize_type = 'position' AND prize_type = 'range'
             AND p_position_start BETWEEN position_start AND position_end)
         OR (p_prize_type = 'range' AND prize_type = 'position'
             AND position_start BETWEEN p_position_start AND p_position_end)
      );

    IF v_exists > 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Prize positions/ranges overlap with existing prize.';
    ELSE
        INSERT INTO tbl_contest_prizes (
            contest_id, prize_type, position_start, position_end,
            prize_points, prize_description, created_by, created_at, updated_at
        ) VALUES (
            p_contest_id, p_prize_type, p_position_start, p_position_end,
            p_prize_points, p_prize_description, p_created_by, NOW(), NOW()
        );
        SELECT * FROM tbl_contest_prizes WHERE id = LAST_INSERT_ID();
    END IF;
END;`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS UpdateContestPrize`)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateContestPrize (
    IN p_id BIGINT,
    IN p_prize_type ENUM('position','range'),
    IN p_position_start INT,
    IN p_position_end INT,
    IN p_prize_points INT,
    IN p_prize_description VARCHAR(500),
    IN p_updated_by BIGINT
)
BEGIN

    DECLARE v_exists INT;
    DECLARE v_contest_id BIGINT;

    -- Get contest_id of the prize being updated
    SELECT contest_id INTO v_contest_id
    FROM tbl_contest_prizes WHERE id = p_id;

    -- Validation: Check overlap or duplicate (exclude self)
    SELECT COUNT(*) INTO v_exists
    FROM tbl_contest_prizes
    WHERE contest_id = v_contest_id
      AND id != p_id
      AND is_active = TRUE
      AND (
            (p_prize_type = 'position' AND prize_type = 'position' 
             AND position_start = p_position_start)
         OR (p_prize_type = 'range' AND prize_type = 'range'
             AND NOT (position_end < p_position_start OR position_start > p_position_end))
         OR (p_prize_type = 'position' AND prize_type = 'range'
             AND p_position_start BETWEEN position_start AND position_end)
         OR (p_prize_type = 'range' AND prize_type = 'position'
             AND position_start BETWEEN p_position_start AND p_position_end)
      );

    IF v_exists > 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Prize positions/ranges overlap with existing prize.';
    ELSE
        UPDATE tbl_contest_prizes SET
            prize_type = COALESCE(p_prize_type, prize_type),
            position_start = COALESCE(p_position_start, position_start),
            position_end = COALESCE(p_position_end, position_end),
            prize_points = COALESCE(p_prize_points, prize_points),
            prize_description = COALESCE(p_prize_description, prize_description),
            updated_by = p_updated_by,
            updated_at = NOW()
        WHERE id = p_id;

        SELECT * FROM tbl_contest_prizes WHERE id = p_id;
    END IF;
END;`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS ToggleContestPrizeStatus`)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS ToggleContestPrizeStatus(IN p_id BIGINT)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO v_exists FROM tbl_contest_prizes WHERE id = p_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Contest Prize Not Found.';
    END IF;

    UPDATE tbl_contest_prizes
    SET is_active = NOT is_active, updated_at = NOW()
    WHERE id = p_id;
    SELECT * FROM tbl_contest_prizes WHERE id = p_id;
END;`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS DeleteContestPrize`)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS DeleteContestPrize(IN p_id BIGINT)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO v_exists FROM tbl_contest_prizes WHERE id = p_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Contest Prize Not Found.';
    END IF;

    DELETE FROM tbl_contest_prizes WHERE id = p_id;
END;`);

    await sequelize.query(`DROP PROCEDURE IF EXISTS GetContestPrizes`)
    await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetContestPrizes(IN p_contest_id BIGINT)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO v_exists FROM tbl_contests WHERE id = p_contest_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Contest Not Found.';
    END IF;

    SELECT * FROM tbl_contest_prizes WHERE contest_id = p_contest_id;
END;`);

    console.log("✅ Contest prize procedures created!");
  } catch (error) {
    console.error("❌ Error setting contest prize procedures:", error);
    throw error;
  }
};

module.exports = setupContestPrizeProcedures;
