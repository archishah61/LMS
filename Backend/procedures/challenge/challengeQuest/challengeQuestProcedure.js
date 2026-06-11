
const sequelize = require("../../../config/db");

const setupChallengeQuestProcedures = async () => {
    try {
        console.log("🔄 Setting up challenge quest procedures...");

        // Procedure: createCourseCategory
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS CreateChallenge (
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_difficulty_level ENUM('Beginner', 'Intermediate', 'Advanced'),
    IN p_category_id INT,
    IN p_reward_points INT,
    IN p_startDate DATETIME,
    IN p_endDate DATETIME,
    IN p_rules TEXT
)
BEGIN
    DECLARE challenge_exists INT;
    
    -- Check for duplicate challenge (same title, category, and difficulty)
    SELECT COUNT(*) INTO challenge_exists 
    FROM tbl_challenges 
    WHERE title = p_title AND category_id = p_category_id AND difficulty_level = p_difficulty_level;
    
    IF challenge_exists > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'A challengeQuest with this title, category, and difficulty level already exists.';
    ELSE
        INSERT INTO tbl_challenges (
        title, description, difficulty_level, category_id, reward_points,
        startDate, endDate, rules , created_at , updated_at
        ) VALUES (
        p_title, p_description, p_difficulty_level, p_category_id, p_reward_points,
        p_startDate, p_endDate, p_rules , NOW(), NOW()
    );
    
    SELECT * FROM tbl_challenges WHERE id = LAST_INSERT_ID();
    END IF;
END`);

        await sequelize.query(`
           CREATE PROCEDURE IF NOT EXISTS GetAllActiveChallenges()
BEGIN
    SELECT 
        c.*,
        cc.id AS category_id,
        cc.category AS category_name
    FROM 
        tbl_challenges c
    LEFT JOIN 
        tbl_challenge_categories cc 
        ON c.category_id = cc.id
    WHERE 
        c.is_active = TRUE
        AND cc.is_active = TRUE;
END;
`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetAllChallenges()
BEGIN
    SELECT * FROM tbl_challenges;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetChallengeById(IN p_id INT)
BEGIN
DECLARE challenge_exists INT;
    
    -- Check if challenge exists
    SELECT COUNT(*) INTO challenge_exists 
    FROM tbl_challenges 
    WHERE id = p_id;
    
    IF challenge_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ChallengeQuest not found.';
    ELSE
        SELECT * FROM tbl_challenges WHERE id = p_id;
    END IF;
END `);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateChallenge (
    IN p_id INT,
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_difficulty_level ENUM('Beginner', 'Intermediate', 'Advanced'),
    IN p_category_id INT,
    IN p_reward_points INT,
    IN p_startDate DATETIME,
    IN p_endDate DATETIME,
    IN p_rules TEXT,
    IN p_is_active BOOLEAN
)
BEGIN
    DECLARE challenge_exists INT;
    DECLARE duplicate_exists INT;
    
    -- Check if challenge exists
    SELECT COUNT(*) INTO challenge_exists 
    FROM tbl_challenges 
    WHERE id = p_id;
    
    IF challenge_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Challenge not found.';
    ELSE
        -- Check for duplicate challengeQuest (same title, category, and difficulty) but not the same ID
        -- Only check if ALL three relevant fields are provided
        IF p_title IS NOT NULL AND p_category_id IS NOT NULL AND p_difficulty_level IS NOT NULL THEN
            SELECT COUNT(*) INTO duplicate_exists 
            FROM tbl_challenges 
            WHERE title = p_title 
            AND category_id = p_category_id 
            AND difficulty_level = p_difficulty_level 
            AND id != p_id;
            
            IF duplicate_exists > 0 THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'A challenge with this title, category, and difficulty level already exists.';
            END IF;
        END IF;
        
        -- Only update fields that are provided (not NULL)
        UPDATE tbl_challenges SET
            title = CASE WHEN p_title IS NOT NULL THEN p_title ELSE title END,
            description = CASE WHEN p_description IS NOT NULL THEN p_description ELSE description END,
            difficulty_level = CASE WHEN p_difficulty_level IS NOT NULL THEN p_difficulty_level ELSE difficulty_level END,
            category_id = CASE WHEN p_category_id IS NOT NULL THEN p_category_id ELSE category_id END,
            reward_points = CASE WHEN p_reward_points IS NOT NULL THEN p_reward_points ELSE reward_points END,
            startDate = CASE WHEN p_startDate IS NOT NULL THEN p_startDate ELSE startDate END,
            endDate = CASE WHEN p_endDate IS NOT NULL THEN p_endDate ELSE endDate END,
            rules = CASE WHEN p_rules IS NOT NULL THEN p_rules ELSE rules END,
            is_active = CASE WHEN p_is_active IS NOT NULL THEN p_is_active ELSE is_active END,
            updated_at = NOW()
        WHERE id = p_id;

        SELECT * FROM tbl_challenges WHERE id = p_id;
    END IF;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS DeleteChallenge(IN p_id INT)
BEGIN
DECLARE challenge_exists INT;
    
    -- Check if challenge exists
    SELECT COUNT(*) INTO challenge_exists 
    FROM tbl_challenges 
    WHERE id = p_id;
    
    IF challenge_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ChallengeQuest not found.';
    ELSE
        DELETE FROM tbl_challenges WHERE id = p_id;
    END IF;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS ToggleChallengeStatus(IN p_id INT)
BEGIN
    DECLARE challenge_exists INT;
    DECLARE current_status BOOLEAN;

    -- Check if challenge exists
    SELECT COUNT(*) INTO challenge_exists 
    FROM tbl_challenges 
    WHERE id = p_id;

    SELECT is_active INTO current_status 
    FROM tbl_challenges 
    WHERE id = p_id;
    
    IF challenge_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Challenge not found.';
    ELSE

        CALL validateActivation('challenge_quest', p_id, current_status);

        UPDATE tbl_challenges
        SET is_active = NOT is_active
        WHERE id = p_id;

        SELECT * FROM tbl_challenges WHERE id = p_id;
    END IF;
END `);



        console.log("✅ Course procedures created!");
    } catch (error) {
        console.error("❌ Error setting challenge quest procedures:", error);
        throw error;
    }
};

module.exports = setupChallengeQuestProcedures;
