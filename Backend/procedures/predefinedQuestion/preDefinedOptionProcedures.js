const sequelize = require('../../config/db'); // ✅ Correct sequelize import

async function setupPreDefinedOptionProcedures() {
    try {
        // Create Predefined options // ✅ (Tested)
        await sequelize.query(`
            CREATE PROCEDURE IF NOT EXISTS createPreDefinedOption(
                IN p_pre_defined_question_id INT,
                IN p_option_text VARCHAR(255),
                IN p_option_img VARCHAR(255),
                IN p_is_correct BOOLEAN,
                IN p_created_by INT,
                IN p_updated_by INT
            )
            BEGIN
                -- Validate: Predefined question must exist
                IF NOT EXISTS (
                    SELECT 1 FROM tbl_pre_defined_questions WHERE id = p_pre_defined_question_id
                ) THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'E404|NotFoundError|Predefined Question does not exist.';
                END IF;

                -- Validate: Created by admin must exist
                IF NOT EXISTS (
                    SELECT 1 FROM tbl_admin WHERE id = p_created_by
                ) THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'E404|NotFoundError|Created By Admin ID does not exist.';
                END IF;

                -- Validate: Updated by admin must exist
                IF NOT EXISTS (
                    SELECT 1 FROM tbl_admin WHERE id = p_updated_by
                ) THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'E404|NotFoundError|Updated By Admin ID does not exist.';
                END IF;

                -- Insert predefined option
                INSERT INTO tbl_pre_defined_options (
                    pre_defined_question_id,
                    option_text,
                    option_img,
                    is_correct,
                    created_by,
                    updated_by,
                    created_at,
                    updated_at
                )
                VALUES (
                    p_pre_defined_question_id,
                    p_option_text,
                    p_option_img,
                    p_is_correct,
                    p_created_by,
                    p_updated_by,
                    NOW(),
                    NOW()
                );

                -- Return the inserted option
                SELECT * FROM tbl_pre_defined_options WHERE id = LAST_INSERT_ID();
            END;
        `);

        // Get All PreDefinedOptions // ✅ (Tested)
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS getAllPreDefinedOptions()
    BEGIN
        SELECT * FROM tbl_pre_defined_options;
    END
        `);

        // Get PreDefinedOptions by PreDefined Question ID // ✅ (Tested)
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS getPreDefinedOptionsByQuestionId(
        IN p_pre_defined_question_id INT
    )
    BEGIN
        SELECT * FROM tbl_pre_defined_options
        WHERE pre_defined_question_id = p_pre_defined_question_id;
    END
        `);

        // Get PreDefinedOption by ID
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS getPreDefinedOptionById(
        IN p_id INT
    )
    BEGIN
        -- Validate: Check if the option exists
        IF NOT EXISTS (
            SELECT 1 FROM tbl_pre_defined_options WHERE id = p_id
        ) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E404|NotFoundError|Predefined option not found.';
        END IF;

        -- Return the option
        SELECT * FROM tbl_pre_defined_options WHERE id = p_id;
    END;
         `);


        // Update PreDefined Option // ✅ (Tested)
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS updatePreDefinedOption(
        IN p_id INT,
        IN p_pre_defined_question_id INT,
        IN p_option_text VARCHAR(255),
        IN p_option_img VARCHAR(255),
        IN p_is_correct BOOLEAN,
        IN p_updated_by INT
    )
    BEGIN
        -- Validate: Option must exist
        IF NOT EXISTS (
            SELECT 1 FROM tbl_pre_defined_options WHERE id = p_id
        ) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E404|NotFoundError|Predefined Option does not exist.';
        END IF;

        -- Validate: Predefined Question must exist
        IF NOT EXISTS (
            SELECT 1 FROM tbl_pre_defined_questions WHERE id = p_pre_defined_question_id
        ) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E404|NotFoundError|Predefined Question does not exist.';
        END IF;

        -- Validate: Updated by admin must exist
        IF NOT EXISTS (
            SELECT 1 FROM tbl_admin WHERE id = p_updated_by
        ) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E404|NotFoundError|Updated By Admin ID does not exist.';
        END IF;

        -- Update the predefined option
        UPDATE tbl_pre_defined_options
        SET
            pre_defined_question_id = p_pre_defined_question_id,
            option_text = p_option_text,
            option_img = p_option_img,
            is_correct = p_is_correct,
            updated_by = p_updated_by,
            updated_at = NOW()
        WHERE id = p_id;

        -- Return the updated option
        SELECT * FROM tbl_pre_defined_options WHERE id = p_id;
    END;
        `);

        // Delete Predefined Option // ✅ (Tested)
        await sequelize.query(`
    CREATE PROCEDURE IF NOT EXISTS deletePreDefinedOption(
        IN p_id INT
    )
    BEGIN
        -- Validate: Check if the option exists
        IF NOT EXISTS (
            SELECT 1 FROM tbl_pre_defined_options WHERE id = p_id
        ) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E404|NotFoundError|Predefined option not found.';
        END IF;

        -- Return the deleted option
        SELECT * FROM tbl_pre_defined_options WHERE id = p_id;

        -- Delete the option
        DELETE FROM tbl_pre_defined_options WHERE id = p_id;
    END;
        `);


        console.log('✅ PreDefinedOption procedure created successfully.');
    } catch (error) {
        console.error('❌ Error setting up PreDefinedOption procedures:', error);
    }
}

module.exports = setupPreDefinedOptionProcedures;
