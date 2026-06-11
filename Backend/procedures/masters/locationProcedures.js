const sequelize = require("../../config/db");

const setupLocationProcedures = async () => {
    try {
        console.log("🔄 Setting up Location procedures...");

        // --------------------------------------------- Country ---------------------------------------------------------
        await sequelize.query(`DROP PROCEDURE IF EXISTS createCountry`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createCountry (
    IN p_name VARCHAR(255),
    IN p_code VARCHAR(3),
    IN p_currency VARCHAR(10),
    IN p_phone_code VARCHAR(10),
    IN p_timezone VARCHAR(100),
    IN p_region VARCHAR(100),
    IN p_subregion VARCHAR(100)
)
BEGIN
    -- Check if name or code already exists
    IF EXISTS (SELECT 1 FROM tbl_countries WHERE name = p_name OR code = p_code) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Country name or code already exists.';
    ELSE
        INSERT INTO tbl_countries (
            name, code, currency, phone_code, timezone, region, subregion, is_active, created_at, updated_at
        ) VALUES (
            p_name, p_code, p_currency, p_phone_code, p_timezone, p_region, p_subregion, TRUE, NOW(), NOW()
        );

        SELECT * FROM tbl_countries WHERE id = LAST_INSERT_ID();
    END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS updateCountry`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateCountry (
    IN p_id INT,
    IN p_name VARCHAR(255),
    IN p_code VARCHAR(3),
    IN p_currency VARCHAR(10),
    IN p_phone_code VARCHAR(10),
    IN p_timezone VARCHAR(100),
    IN p_region VARCHAR(100),
    IN p_subregion VARCHAR(100)
)
BEGIN
    -- Check if country exists
    IF NOT EXISTS (SELECT 1 FROM tbl_countries WHERE id = p_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Country not found.';
    -- Check if name or code already exists for other countries
    ELSEIF EXISTS (
        SELECT 1 FROM tbl_countries 
        WHERE (name = p_name OR code = p_code) AND id != p_id
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Country name or code already used by another record.';
    ELSE
        UPDATE tbl_countries
        SET name = p_name,
            code = p_code,
            currency = p_currency,
            phone_code = p_phone_code,
            timezone = p_timezone,
            region = p_region,
            subregion = p_subregion,
            updated_at = NOW()
        WHERE id = p_id;

        SELECT * FROM tbl_countries WHERE id = p_id;
    END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getAllCountries`);
        await sequelize.query(`CREATE PROCEDURE getAllCountries(
    IN p_search_term VARCHAR(255),
    IN p_limit VARCHAR(10),
    IN p_offset INT
)
BEGIN
    -- ========================
    -- Build WHERE clause
    -- ========================
    SET @whereClause := ' WHERE 1 = 1';

    IF p_search_term IS NOT NULL AND p_search_term != '' THEN
        SET @whereClause := CONCAT(@whereClause, 
            ' AND (name LIKE "%', p_search_term, 
            '%" OR code LIKE "%', p_search_term, 
            '%" OR region LIKE "%', p_search_term, 
            '%" OR subregion LIKE "%', p_search_term, '%")');
    END IF;

    -- ============================
    -- 1. Get total count
    -- ============================
    SET @countSQL := CONCAT(
        'SELECT COUNT(*) AS total_count FROM tbl_countries', @whereClause
    );

    PREPARE countStmt FROM @countSQL;
    EXECUTE countStmt;
    DEALLOCATE PREPARE countStmt;

    -- ============================
    -- 2. Get paginated data
    -- ============================
    SET @dataSQL := CONCAT(
        'SELECT * FROM tbl_countries',
        @whereClause,
        ' ORDER BY name'
    );

    IF p_limit IS NOT NULL AND p_limit != 'ALL' THEN
        SET @dataSQL := CONCAT(@dataSQL, ' LIMIT ', p_limit, ' OFFSET ', p_offset);
    END IF;

    PREPARE dataStmt FROM @dataSQL;
    EXECUTE dataStmt;
    DEALLOCATE PREPARE dataStmt;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getAllActiveCountries`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllActiveCountries()
BEGIN
    SET @sql = 'SELECT * FROM tbl_countries WHERE is_active = 1';

    -- Add order clause
    SET @sql = CONCAT(@sql, ' ORDER BY name');

    -- Prepare and execute the final SQL
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getCountryById`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCountryById(IN p_id INT)
BEGIN
    SELECT * FROM tbl_countries WHERE id = p_id;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS toggleCountryStatus`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS toggleCountryStatus(IN p_id INT)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tbl_countries WHERE id = p_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Country not found.';
    ELSE
    UPDATE tbl_countries
        SET is_active = NOT is_active,
            updated_at = NOW()
        WHERE id = p_id;
    END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS deleteCountry`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteCountry(IN p_id INT)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tbl_countries WHERE id = p_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Country not found.';
    ELSE
        DELETE FROM tbl_countries WHERE id = p_id;
    END IF;
END`);

        // ------------------------------------------ State ------------------------------------------------------------

        // Create State
        await sequelize.query(`DROP PROCEDURE IF EXISTS createState`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createState (
    IN p_name VARCHAR(255),
    IN p_code VARCHAR(3),
    IN p_country_id INT,
    IN p_timezone VARCHAR(100)
)
BEGIN
    -- Check if state name or code already exists for the given country
    IF EXISTS (SELECT 1 FROM tbl_states WHERE (name = p_name OR code = p_code) AND country_id = p_country_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'State name or code already exists for this country.';
    ELSE
        INSERT INTO tbl_states (name, code, country_id, timezone, is_active, created_at, updated_at)
        VALUES (p_name, p_code, p_country_id, p_timezone, TRUE, NOW(), NOW());

        SELECT * FROM tbl_states WHERE id = LAST_INSERT_ID();
    END IF;
END`);

        // Update State
        await sequelize.query(`DROP PROCEDURE IF EXISTS updateState`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateState (
    IN p_id INT,
    IN p_name VARCHAR(255),
    IN p_code VARCHAR(3),
    IN p_country_id INT,
    IN p_timezone VARCHAR(100)
)
BEGIN
    -- Check if state exists
    IF NOT EXISTS (SELECT 1 FROM tbl_states WHERE id = p_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'State not found.';
    -- Check if state name or code already exists for another state in the same country
    ELSEIF EXISTS (
        SELECT 1 FROM tbl_states 
        WHERE (name = p_name OR code = p_code) AND country_id = p_country_id AND id != p_id
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'State name or code already used by another state in this country.';
    ELSE
        UPDATE tbl_states
        SET name = p_name,
            code = p_code,
            country_id = p_country_id,
            timezone = p_timezone,
            updated_at = NOW()
        WHERE id = p_id;

        SELECT * FROM tbl_states WHERE id = p_id;
    END IF;
END`);

        // Get All States
        await sequelize.query(`DROP PROCEDURE IF EXISTS getAllStates`);
        await sequelize.query(`CREATE PROCEDURE getAllStates(
    IN p_search_term VARCHAR(255),  -- Optional: Search term for name or code
    IN p_limit VARCHAR(10),         -- Optional: Number of records to return (or 'ALL')
    IN p_offset INT,                -- Optional: Starting position for pagination
    IN p_country_id INT             -- Optional: Filter by country ID
)
BEGIN
    -- ========================
    -- Build WHERE clause
    -- ========================
    SET @whereClause := ' WHERE 1 = 1';

    IF p_search_term IS NOT NULL AND p_search_term != '' THEN
        SET @whereClause := CONCAT(@whereClause, 
            ' AND (s.name LIKE "%', p_search_term, 
            '%" OR s.code LIKE "%', p_search_term, '%")');
    END IF;

    IF p_country_id IS NOT NULL AND p_country_id > 0 THEN
        SET @whereClause := CONCAT(@whereClause, ' AND s.country_id = ', p_country_id);
    END IF;

    -- ============================
    -- 1. Get total matching count
    -- ============================
    SET @countSQL := CONCAT(
        'SELECT COUNT(*) AS total_count FROM tbl_states s', @whereClause
    );

    PREPARE countStmt FROM @countSQL;
    EXECUTE countStmt;
    DEALLOCATE PREPARE countStmt;

    -- ============================
    -- 2. Get paginated state data
    -- ============================
    SET @dataSQL := CONCAT(
        'SELECT s.*, c.name AS country_name, c.code AS country_code 
         FROM tbl_states s 
         JOIN tbl_countries c ON s.country_id = c.id',
        @whereClause,
        ' ORDER BY s.name'
    );

    IF p_limit IS NOT NULL AND p_limit != 'ALL' THEN
        SET @dataSQL := CONCAT(@dataSQL, ' LIMIT ', p_limit, ' OFFSET ', p_offset);
    END IF;

    PREPARE dataStmt FROM @dataSQL;
    EXECUTE dataStmt;
    DEALLOCATE PREPARE dataStmt;

END`);

        // Get All States
        await sequelize.query(`DROP PROCEDURE IF EXISTS getAllActiveStates`);
        await sequelize.query(`CREATE PROCEDURE getAllActiveStates(
    IN p_country_id INT             -- Optional: Filter by country ID
)
BEGIN
    -- Start with base query
    SET @sql = 'SELECT 
            s.*, 
            c.name AS country_name, 
            c.code AS country_code 
        FROM tbl_states s 
        JOIN tbl_countries c ON s.country_id = c.id 
        WHERE s.is_active = 1';
    
    -- Add country filter if provided
    IF p_country_id IS NOT NULL AND p_country_id > 0 THEN
        SET @sql = CONCAT(@sql, ' AND country_id = ', p_country_id);
    END IF;
    
    -- Sort results by name
    SET @sql = CONCAT(@sql, ' ORDER BY s.name');
    
    -- Execute the generated query
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END`);

        // Get State By ID
        await sequelize.query(`DROP PROCEDURE IF EXISTS getStateById`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getStateById(IN p_id INT)
BEGIN
    -- Check if state exists
    IF NOT EXISTS (SELECT 1 FROM tbl_states WHERE id = p_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'State not found.';
    ELSE
        SELECT * FROM tbl_states WHERE id = p_id;
    END IF;
END`);

        // Toggle State Status (Active/Inactive)
        await sequelize.query(`DROP PROCEDURE IF EXISTS toggleStateStatus`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS toggleStateStatus(IN p_id INT)
BEGIN
    -- Check if state exists
    IF NOT EXISTS (SELECT 1 FROM tbl_states WHERE id = p_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'State not found.';
    ELSE
        UPDATE tbl_states
        SET is_active = NOT is_active,
            updated_at = NOW()
        WHERE id = p_id;
    END IF;
END`);

        // ------------------------------------------ City ------------------------------------------------------------

        await sequelize.query(`DROP PROCEDURE IF EXISTS createCity`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createCity (
    IN p_name VARCHAR(255),
    IN p_code VARCHAR(10),
    IN p_state_id INT,
    IN p_timezone VARCHAR(100)
)
BEGIN
    -- Check if city name or code already exists for the given state
    IF EXISTS (
        SELECT 1 FROM tbl_cities 
        WHERE (name = p_name OR code = p_code) AND state_id = p_state_id
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'City name or code already exists for this state.';
    ELSE
        INSERT INTO tbl_cities (name, code, state_id, timezone, is_active, created_at, updated_at)
        VALUES (p_name, p_code, p_state_id, p_timezone, TRUE, NOW(), NOW());

        SELECT * FROM tbl_cities WHERE id = LAST_INSERT_ID();
    END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS updateCity;`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateCity (
    IN p_id INT,
    IN p_name VARCHAR(255),
    IN p_code VARCHAR(10),
    IN p_state_id INT,
    IN p_timezone VARCHAR(100)
)
BEGIN
    -- Check if city exists
    IF NOT EXISTS (SELECT 1 FROM tbl_cities WHERE id = p_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'City not found.';
    -- Check if name or code is used by another city in same state
    ELSEIF EXISTS (
        SELECT 1 FROM tbl_cities 
        WHERE (name = p_name OR code = p_code) AND state_id = p_state_id AND id != p_id
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'City name or code already used by another city in this state.';
    ELSE
        UPDATE tbl_cities
        SET name = p_name,
            code = p_code,
            state_id = p_state_id,
            timezone = p_timezone,
            updated_at = NOW()
        WHERE id = p_id;

        SELECT * FROM tbl_cities WHERE id = p_id;
    END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getAllCities;`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllCities(
    IN p_search_term VARCHAR(255),  -- Optional: Search term for name or code
    IN p_limit VARCHAR(10),         -- Optional: Number of records to return (or 'ALL')
    IN p_offset INT,                -- Optional: Starting position for pagination
    IN p_state_id INT               -- Optional: Filter by state ID
)
BEGIN
    -- Base SQL for WHERE clause reuse
    SET @whereClause := ' WHERE 1 = 1';

    -- Add search condition
    IF p_search_term IS NOT NULL AND p_search_term != '' THEN
        SET @whereClause := CONCAT(@whereClause, 
            ' AND (c.name LIKE "%', p_search_term, 
            '%" OR c.code LIKE "%', p_search_term, '%")');
    END IF;

    -- Add state filter
    IF p_state_id IS NOT NULL AND p_state_id > 0 THEN
        SET @whereClause := CONCAT(@whereClause, ' AND c.state_id = ', p_state_id);
    END IF;

    -- ===================
    -- 1. Get total count
    -- ===================
    SET @countSQL := CONCAT(
        'SELECT COUNT(*) AS total_count FROM tbl_cities c', @whereClause
    );

    PREPARE countStmt FROM @countSQL;
    EXECUTE countStmt;
    DEALLOCATE PREPARE countStmt;

    -- ============================
    -- 2. Get paginated city list
    -- ============================
    SET @dataSQL := CONCAT(
        'SELECT c.*, s.name AS state_name, s.code AS state_code 
         FROM tbl_cities c 
         JOIN tbl_states s ON c.state_id = s.id',
        @whereClause,
        ' ORDER BY c.name'
    );

    IF p_limit IS NOT NULL AND p_limit != 'ALL' THEN
        SET @dataSQL := CONCAT(@dataSQL, ' LIMIT ', p_limit, ' OFFSET ', p_offset);
    END IF;

    PREPARE dataStmt FROM @dataSQL;
    EXECUTE dataStmt;
    DEALLOCATE PREPARE dataStmt;

END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getAllActiveCities;`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllActiveCities(
    IN p_state_id INT
)
BEGIN
    -- Base query with active cities
    SET @sql = 'SELECT 
        c.*, 
        s.name AS state_name, 
        s.code AS state_code 
    FROM tbl_cities c 
    JOIN tbl_states s ON c.state_id = s.id 
    WHERE c.is_active = 1';

    -- Apply state filter if provided
    IF p_state_id IS NOT NULL AND p_state_id > 0 THEN
        SET @sql = CONCAT(@sql, ' AND c.state_id = ', p_state_id);
    END IF;

    -- Order by city name
    SET @sql = CONCAT(@sql, ' ORDER BY c.name');

    -- Execute query
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getCityById;`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCityById(IN p_id INT)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tbl_cities WHERE id = p_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'City not found.';
    ELSE
        SELECT * FROM tbl_cities WHERE id = p_id;
    END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS toggleCityStatus;`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS toggleCityStatus(IN p_id INT)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tbl_cities WHERE id = p_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'City not found.';
    ELSE
        UPDATE tbl_cities
        SET is_active = NOT is_active,
            updated_at = NOW()
        WHERE id = p_id;
    END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS deleteCity;`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS deleteCity(IN p_id INT)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tbl_cities WHERE id = p_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'City not found.';
    ELSE
        DELETE FROM tbl_cities WHERE id = p_id;
    END IF;
END`);

        console.log("✅ Location procedures created!");
    } catch (error) {
        console.error("❌ Error setting up Location procedures:", error);
        throw error;
    }
};

module.exports = setupLocationProcedures;
