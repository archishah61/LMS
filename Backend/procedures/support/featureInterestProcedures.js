const sequelize = require("../../config/db");

const setupFeatureInterestProcedures = async () => {
    try {
        console.log("🔄 Setting up Feature Interest procedures...");

        // ============================================
        // 1️⃣ CREATE Feature Interest
        // ============================================
        await sequelize.query(`DROP PROCEDURE IF EXISTS createFeatureInterest;`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createFeatureInterest (
    IN p_user_id INT,
    IN p_feature_id INT,
    IN p_email VARCHAR(255)
)
BEGIN
    DECLARE v_email VARCHAR(255);
    DECLARE err_message VARCHAR(255);

    -- CASE 1: user_id is given → fetch email from tbl_users
    IF p_user_id IS NOT NULL THEN

        -- Check user exists
        IF NOT EXISTS (SELECT 1 FROM tbl_users WHERE id = p_user_id) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'E404|NotFoundError|User not found.';
        END IF;

        -- Get email from user table
        SELECT email INTO v_email
        FROM tbl_users
        WHERE id = p_user_id;

    ELSE
        -- CASE 2: user_id is NOT given → email must be provided
        IF p_email IS NULL OR LENGTH(p_email) = 0 THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Email is required if user_id is not provided.';
        END IF;

        SET v_email = p_email;
    END IF;


    -- Check email duplicate (email must be unique)
    IF EXISTS (
        SELECT 1 FROM tbl_feature_interest WHERE email = v_email AND feature_id = p_feature_id
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Email already registered for feature interest.';
    END IF;


    -- Check duplicate pair: same user requesting same feature
    IF p_user_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM tbl_feature_interest
        WHERE user_id = p_user_id AND feature_id = p_feature_id
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'User already expressed interest in this feature.';
    END IF;


    -- Insert into table
    INSERT INTO tbl_feature_interest (
        user_id,
        feature_id,
        email,
        created_at,
        updated_at
    )
    VALUES (
        p_user_id,
        p_feature_id,
        v_email,
        NOW(),
        NOW()
    );

    -- Return new row
    SELECT *
    FROM tbl_feature_interest
    WHERE id = LAST_INSERT_ID();

END`);


        // ============================================
        // 2️⃣ DELETE Feature Interest
        // ============================================
        await sequelize.query(`DROP PROCEDURE IF EXISTS deleteFeatureInterest;`);
        await sequelize.query(`
        CREATE PROCEDURE IF NOT EXISTS deleteFeatureInterest (
            IN p_id INT
        )
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM tbl_feature_interest WHERE id = p_id) THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Feature Interest record not found.';
            ELSE
                DELETE FROM tbl_feature_interest WHERE id = p_id;
            END IF;
        END`);


        // ============================================
        // 3️⃣ GET all feature interests with pagination
        // ============================================
        await sequelize.query(`DROP PROCEDURE IF EXISTS getAllFeatureInterestsWithPagination;`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllFeatureInterestsWithPagination (
    IN p_search_term VARCHAR(255),
    IN p_feature_filter VARCHAR(255),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    -- Build the base WHERE conditions
    SET @where_conditions = ' WHERE 1=1';
    
    -- Apply search term
    IF p_search_term IS NOT NULL AND p_search_term != '' THEN
        SET @where_conditions = CONCAT(@where_conditions, 
            ' AND (fi.email LIKE "%', p_search_term, '%"
                OR fs.name LIKE "%', p_search_term, '%" 
                OR u.full_name LIKE "%', p_search_term, '%")');
    END IF;
    
    -- Apply feature filter
    IF p_feature_filter IS NOT NULL AND p_feature_filter != '' AND p_feature_filter != 'all' THEN
        SET @where_conditions = CONCAT(@where_conditions, 
            ' AND fs.name = "', p_feature_filter, '"');
    END IF;

    -- First result set: total count
    SET @count_query = CONCAT(
        'SELECT COUNT(*) as total 
         FROM tbl_feature_interest fi
         LEFT JOIN tbl_users u ON fi.user_id = u.id
         LEFT JOIN tbl_feature_status fs ON fi.feature_id = fs.id',
        @where_conditions
    );
    
    PREPARE count_stmt FROM @count_query;
    EXECUTE count_stmt;
    DEALLOCATE PREPARE count_stmt;

    -- Second result set: paginated data
    SET @data_query = CONCAT(
        'SELECT fi.*, u.full_name AS user_name, fs.name AS feature_name
         FROM tbl_feature_interest fi
         LEFT JOIN tbl_users u ON fi.user_id = u.id
         LEFT JOIN tbl_feature_status fs ON fi.feature_id = fs.id',
        @where_conditions,
        ' ORDER BY fi.created_at DESC'
    );

    -- Apply limit/offset
    IF p_limit IS NOT NULL AND p_limit > 0 THEN
        SET @data_query = CONCAT(@data_query, ' LIMIT ', p_limit, ' OFFSET ', p_offset);
    END IF;

    PREPARE data_stmt FROM @data_query;
    EXECUTE data_stmt;
    DEALLOCATE PREPARE data_stmt;
END`);

        // ============================================
        // 4️⃣ GET Feature Interest by user & feature ID
        // ============================================
        await sequelize.query(`DROP PROCEDURE IF EXISTS getFeatureInterestByUserAndFeatureId;`);
        await sequelize.query(`
        CREATE PROCEDURE IF NOT EXISTS getFeatureInterestByUserAndFeatureId (
            IN p_user_id INT,
            IN p_feature_id INT
        )
        BEGIN
            SELECT fi.*, u.name AS user_name, fs.name AS feature_name
            FROM tbl_feature_interest fi
            LEFT JOIN tbl_users u ON fi.user_id = u.id
            LEFT JOIN tbl_feature_status fs ON fi.feature_id = fs.id
            WHERE fi.user_id = p_user_id
              AND fi.feature_id = p_feature_id;
        END`);

        console.log("✅ Feature Interest procedures created!");
    } catch (error) {
        console.error("❌ Error setting up Feature Interest procedures:", error);
        throw error;
    }
};

module.exports = setupFeatureInterestProcedures;
