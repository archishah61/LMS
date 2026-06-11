const sequelize = require("../../../config/db");

const setupContestActivityProcedures = async () => {
    try {
        console.log("🔄 Setting up contest activity procedures...");

        await sequelize.query('DROP PROCEDURE IF EXISTS CreateContestActivity')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS CreateContestActivity (
  IN p_contest_id BIGINT,
  IN p_title VARCHAR(255),
  IN p_description TEXT,
  IN p_type ENUM('quiz','coding','escape_room'),
  IN p_difficulty ENUM('easy','medium','hard','expert'),
  IN p_points_reward INT,
  IN p_created_by BIGINT
)
BEGIN
    DECLARE duplicate_exists INT;
    SELECT COUNT(*) INTO duplicate_exists FROM tbl_contest_activities WHERE title = p_title AND contest_id = p_contest_id;
    IF duplicate_exists > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E409|DuplicateError|Contest Activity with this title already exists.';
    ELSE
      INSERT INTO tbl_contest_activities (
        contest_id, title, description, type, difficulty, points_reward,
        is_active, created_by, created_at, updated_at
      ) VALUES (
        p_contest_id, p_title, p_description, p_type, p_difficulty, p_points_reward,
        TRUE, p_created_by, NOW(), NOW()
      );
      SELECT * FROM tbl_contest_activities WHERE id = LAST_INSERT_ID();
    END IF;
END;
    `);

        await sequelize.query('DROP PROCEDURE IF EXISTS UpdateContestActivity')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateContestActivity (
  IN p_id BIGINT,
  IN p_title VARCHAR(255),
  IN p_description TEXT,
  IN p_type ENUM('quiz','coding','escape_room'),
  IN p_difficulty ENUM('easy','medium','hard','expert'),
  IN p_points_reward INT,
  IN p_updated_by BIGINT
)
BEGIN
    DECLARE duplicate_exists INT;
    DECLARE v_exists INT DEFAULT 0;
    DECLARE v_contest_id INT;

    SELECT COUNT(*) INTO v_exists FROM tbl_contest_activities WHERE id = p_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Contest Activity Not Found.';
    END IF;

    SELECT contest_id INTO v_contest_id FROM tbl_contest_activities WHERE id = p_id;
    SELECT COUNT(*) INTO duplicate_exists FROM tbl_contest_activities WHERE title = p_title AND contest_id = v_contest_id AND NOT id = p_id;
    IF duplicate_exists > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E409|DuplicateError|Contest Activity with this title already exists.';
    ELSE
      UPDATE tbl_contest_activities SET
        title = COALESCE(p_title, title),
        description = COALESCE(p_description, description),
        type = COALESCE(p_type, type),
        difficulty = COALESCE(p_difficulty, difficulty),
        points_reward = COALESCE(p_points_reward, points_reward),
        updated_by = p_updated_by,
        updated_at = NOW()
      WHERE id = p_id;

      SELECT * FROM tbl_contest_activities WHERE id = p_id;
    END IF;
END;
    `);

        await sequelize.query('DROP PROCEDURE IF EXISTS DeleteContestActivity')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS DeleteContestActivity (IN p_id BIGINT)
BEGIN
  DECLARE v_exists INT DEFAULT 0;

  SELECT COUNT(*) INTO v_exists FROM tbl_contest_activities WHERE id = p_id;
  IF v_exists = 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Contest Activity Not Found.';
  END IF;
  DELETE FROM tbl_contest_activities WHERE id = p_id;
END;
    `);

        await sequelize.query('DROP PROCEDURE IF EXISTS ToggleContestActivityStatus')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS ToggleContestActivityStatus (IN p_id BIGINT)
BEGIN
  DECLARE v_exists INT DEFAULT 0;

  SELECT COUNT(*) INTO v_exists FROM tbl_contest_activities WHERE id = p_id;
  IF v_exists = 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Contest Activity Not Found.';
  END IF;

  UPDATE tbl_contest_activities
  SET is_active = NOT is_active, updated_at = NOW()
  WHERE id = p_id;
  SELECT * FROM tbl_contest_activities WHERE id = p_id;
END;
    `);

        await sequelize.query('DROP PROCEDURE IF EXISTS GetContestActivitiesByContest')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetContestActivitiesByContest (
            IN p_contest_id BIGINT,
            IN p_sort_by VARCHAR(20),
            IN p_type VARCHAR(20),
            IN p_difficulty VARCHAR(20)
            )
BEGIN
  DECLARE v_exists INT DEFAULT 0;

  SELECT COUNT(*) INTO v_exists FROM tbl_contests WHERE id = p_contest_id;
  IF v_exists = 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Contest Not Found.';
  END IF;

  SELECT *
  FROM tbl_contest_activities
  WHERE (contest_id = p_contest_id)
        AND (p_type IS NULL OR p_type = 'all' OR p_type = type)
        AND (p_difficulty IS NULL OR p_difficulty = 'all' OR p_difficulty = difficulty)
    ORDER BY
        CASE WHEN p_sort_by = 'points_reward' THEN points_reward END DESC,
        CASE WHEN p_sort_by = 'title' THEN title END ASC,
        created_at DESC;
END;
    `);

        await sequelize.query('DROP PROCEDURE IF EXISTS GetContestActivityById')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetContestActivityById (IN p_id BIGINT)
BEGIN
  DECLARE v_exists INT DEFAULT 0;

  SELECT COUNT(*) INTO v_exists FROM tbl_contest_activities WHERE id = p_id;
  IF v_exists = 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Contest Activity Not Found.';
  END IF;

  SELECT * FROM tbl_contest_activities WHERE id = p_id;
END;
    `);

        console.log("✅ Contest activity procedures created!");
    } catch (error) {
        console.error("❌ Error setting contest activity procedures:", error);
        throw error;
    }
};

module.exports = setupContestActivityProcedures;
