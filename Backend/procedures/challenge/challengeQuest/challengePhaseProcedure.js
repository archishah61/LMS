
const sequelize = require("../../../config/db");

const setupChallengePhaseProcedures = async () => {
    try {
        console.log("🔄 Setting up challenge quest procedures...");

        // Procedure: createCourseCategory
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createChallengePhase (
    IN p_challenge_id INT,
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_bonus_reward VARCHAR(255),
    IN p_phase_type ENUM('Easy', 'Moderate', 'Hard')
)
BEGIN
    DECLARE challenge_exists INT;
    DECLARE duplicate_exists INT;
    DECLARE v_phase_number INT DEFAULT 0;

    -- Check if challenge exists
    SELECT COUNT(*) INTO challenge_exists 
    FROM tbl_challenges 
    WHERE id = p_challenge_id;
    
    IF challenge_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ChallengeQuest not found. Cannot create phase for non-existent challenge.';
    ELSE
        -- Check for duplicacy based on challenge_id, title, and phase_number
        SELECT COUNT(*) INTO duplicate_exists
        FROM tbl_challenge_phases
        WHERE challenge_id = p_challenge_id 
        AND title = p_title;
        
        IF duplicate_exists > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Duplicate phase detected. A phase with the same title or phase number already exists for this challenge.';
        ELSE

            -- Count Phase Number
            SELECT IFNULL(MAX(phase_number), 0) + 1 INTO v_phase_number 
            FROM tbl_challenge_phases 
            WHERE challenge_id = p_challenge_id;
            
            INSERT INTO tbl_challenge_phases (
                challenge_id, phase_number, title, description, tasks_count,
                bonus_reward, 
                phase_type, created_at, updated_at
            )
            VALUES (
                p_challenge_id, v_phase_number, p_title, p_description, 0,
                p_bonus_reward,
                p_phase_type, NOW(), NOW()
            );

            SELECT * FROM tbl_challenge_phases WHERE id = LAST_INSERT_ID();
        END IF;
    END IF;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS reorderPhasesByCustomOrder(
    IN p_challenge_id INT,
    IN p_phase_order JSON
)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE phase_count INT;
    DECLARE v_phase_id INT;

    -- Get the number of phases in the JSON array
    SET phase_count = JSON_LENGTH(p_phase_order);

    -- Loop through each index
    WHILE i < phase_count DO
        -- Get phase ID at index \`i\`
        SET v_phase_id = JSON_EXTRACT(p_phase_order, CONCAT('$[', i, ']'));

        -- Update phase_number based on position (i + 1)
        UPDATE tbl_challenge_phases
        SET phase_number = i + 1
        WHERE id = v_phase_id AND challenge_id = p_challenge_id;

        SET i = i + 1;
    END WHILE;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllChallengePhases()
BEGIN
    SELECT * FROM tbl_challenge_phases;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getChallengePhaseById(IN p_id INT)
BEGIN
 DECLARE challenge_exists INT;
    
    -- Check if challenge exists
    SELECT COUNT(*) INTO challenge_exists 
    FROM tbl_challenge_phases 
    WHERE id = p_id;
    
    IF challenge_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ChallengePhase not found.';
    ELSE
        SELECT * FROM tbl_challenge_phases WHERE id = p_id;
    END IF;
END `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getChallengePhasesByQuest`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getChallengePhasesByQuest(
            IN p_challenge_id INT,
            IN p_search_term VARCHAR(255), 
            IN p_phase_type VARCHAR(20), 
            IN p_status VARCHAR(20)
            )
BEGIN
 DECLARE challenge_exists INT;
    
    -- Check if challenge exists
    SELECT COUNT(*) INTO challenge_exists 
    FROM tbl_challenges 
    WHERE id = p_challenge_id;
    
    IF challenge_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Challenge not found.';
    ELSE
        SELECT * FROM tbl_challenge_phases 
        WHERE (challenge_id = p_challenge_id)
        AND (p_search_term IS NULL OR p_search_term = ''
            OR title LIKE CONCAT('%', p_search_term, '%')
            OR description LIKE CONCAT('%', p_search_term, '%'))
        AND (p_status IS NULL OR p_status = 'all' OR (p_status = 'active' AND is_active = TRUE) OR (p_status = 'inactive' AND is_active = FALSE))
        AND (p_phase_type IS NULL OR p_phase_type = 'all' OR p_phase_type = phase_type);
    END IF;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateChallengePhase (
    IN p_id INT,
    IN p_challenge_id INT,
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_bonus_reward VARCHAR(255),
    IN p_phase_type ENUM('Easy', 'Moderate', 'Hard')
)
BEGIN
 DECLARE challenge_exists INT;
    DECLARE phase_exists INT;
    DECLARE duplicate_exists INT;
    
    -- Check if phase exists
    SELECT COUNT(*) INTO phase_exists 
    FROM tbl_challenge_phases 
    WHERE id = p_id;
    
    IF phase_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Challenge Phase not found.';
    ELSE
        -- Check if challenge exists if challenge_id is provided
        IF p_challenge_id IS NOT NULL THEN
            SELECT COUNT(*) INTO challenge_exists 
            FROM tbl_challenges 
            WHERE id = p_challenge_id;
            
            IF challenge_exists = 0 THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Challenge not found. Cannot update phase for non-existent challenge.';
            END IF;
        END IF;

         IF p_title IS NOT NULL THEN
            SELECT COUNT(*) INTO duplicate_exists
            FROM tbl_challenge_phases
            WHERE id != p_id
            AND challenge_id = CASE WHEN p_challenge_id IS NOT NULL THEN p_challenge_id ELSE (SELECT challenge_id FROM tbl_challenge_phases WHERE id = p_id) END
            AND (p_title IS NOT NULL AND title = p_title);
            
            IF duplicate_exists > 0 THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Update would create a duplicate. A phase with the same title already exists for this challenge.';
            END IF;
        END IF;
        
        -- Only update fields that are provided (not NULL)
        UPDATE tbl_challenge_phases SET
            challenge_id = CASE WHEN p_challenge_id IS NOT NULL THEN p_challenge_id ELSE challenge_id END,
            title = CASE WHEN p_title IS NOT NULL THEN p_title ELSE title END,
            description = CASE WHEN p_description IS NOT NULL THEN p_description ELSE description END,
            bonus_reward = CASE WHEN p_bonus_reward IS NOT NULL THEN p_bonus_reward ELSE bonus_reward END,
            phase_type = CASE WHEN p_phase_type IS NOT NULL THEN p_phase_type ELSE phase_type END,
            updated_at = NOW()
        WHERE id = p_id;
        
        SELECT * FROM tbl_challenge_phases WHERE id = p_id;
    END IF;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteChallengePhase(IN p_id INT)
BEGIN
    DECLARE phase_exists INT;
    DECLARE v_challenge_id INT;
    
    -- Check if phase exists
    SELECT COUNT(*) INTO phase_exists 
    FROM tbl_challenge_phases 
    WHERE id = p_id;
    
    IF phase_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Challenge Phase not found.';
    ELSE
        -- Get challenge_id before deleting the phase
        SELECT challenge_id INTO v_challenge_id 
        FROM tbl_challenge_phases 
        WHERE id = p_id;

        UPDATE tbl_challenge_phases
        SET is_active = false,
            updated_at = NOW()
        WHERE id = p_id;

        CALL handleEntityStatus('challenge_phase', p_id);

        DELETE FROM tbl_challenge_phases WHERE id = p_id;

        -- Reorder the remaining phases for that challenge
        UPDATE tbl_challenge_phases p
        JOIN (
            SELECT id, ROW_NUMBER() OVER (ORDER BY phase_number, id) AS new_phase_number
            FROM tbl_challenge_phases
            WHERE challenge_id = v_challenge_id
        ) ranked ON p.id = ranked.id
        SET p.phase_number = ranked.new_phase_number;

    END IF;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS toggleChallengePhaseStatus(IN p_id INT)
BEGIN
    DECLARE phase_exists INT;
    DECLARE current_status BOOLEAN;

    -- Check if phase exists
    SELECT COUNT(*) INTO phase_exists 
    FROM tbl_challenge_phases 
    WHERE id = p_id;

    SELECT is_active INTO current_status 
    FROM tbl_challenge_phases 
    WHERE id = p_id;
    
    IF phase_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Challenge Phase not found.';
    ELSE
        
        CALL validateActivation('challenge_phase', p_id, current_status);

        UPDATE tbl_challenge_phases
        SET is_active = NOT is_active,
            updated_at = NOW()
        WHERE id = p_id;

        CALL handleEntityStatus('challenge_phase', p_id);

        SELECT * FROM tbl_challenge_phases WHERE id = p_id;
    END IF;
END`);

        console.log("✅ Course procedures created!");
    } catch (error) {
        console.error("❌ Error setting challenge quest procedures:", error);
        throw error;
    }
};

module.exports = setupChallengePhaseProcedures;
