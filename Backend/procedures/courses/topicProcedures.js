// utils/procedure/topicProcedures.js

const sequelize = require("../../config/db");

// INSERT INTO tbl_procedure_logs (procedure_name, log_message) VALUES ("Accordian Attachments Insert", v_section_attachments);

const setupTopicProcedures = async () => {
    try {
        console.log("🔄 Setting up Topic procedures...");

        await sequelize.query(`DROP PROCEDURE IF EXISTS CreateTopicWithContent;`)
        await sequelize.query(`CREATE PROCEDURE CreateTopicWithContent(
    IN p_module_id VARCHAR(255),
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_content_type ENUM('video', 'audio', 'accordian', 'general', 'slide'),
    IN p_created_by INT,
    IN p_created_by_type VARCHAR(20),
    IN p_tags JSON,
    IN p_materials JSON,
    IN p_content JSON,
    IN p_files JSON,
    IN p_languages JSON,
    IN p_topic_duration DECIMAL(10,2),
    IN p_extra_duration DECIMAL(10,2),
    IN p_total_duration DECIMAL(10,2)
)
BEGIN
    DECLARE v_module_internal_id INT DEFAULT NULL;
    DECLARE v_highest_sequence INT DEFAULT 0;
    DECLARE v_next_sequence INT;
    DECLARE v_topic_id INT;
    DECLARE v_public_hash VARCHAR(255);
    DECLARE topic_exists INT DEFAULT 0;

    -- New variables for multi-material support
    DECLARE v_material_count INT;
    DECLARE v_material_item JSON;
    DECLARE v_mat_type VARCHAR(50);
    DECLARE v_mat_url TEXT;
    DECLARE v_code TEXT;
    DECLARE v_codeLanguage VARCHAR(50);
    DECLARE m INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Check if module exists and get its ID
    SELECT id INTO v_module_internal_id 
    FROM tbl_modules 
    WHERE public_hash = p_module_id
    LIMIT 1;
    
    IF v_module_internal_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Module not found';
    END IF;
    
    
    -- Check for duplicate topic (same module and title)
    SELECT COUNT(*) INTO topic_exists
    FROM tbl_topics
    WHERE module_id = v_module_internal_id
      AND title = p_title;
      
    IF topic_exists > 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|DuplicateError|Topic with same title already exists in this module';
    END IF;

    -- Get highest sequence number for this module
    SELECT COALESCE(MAX(sequence_no), 0) INTO v_highest_sequence
    FROM tbl_topics 
    WHERE module_id = v_module_internal_id;
    
    SET v_next_sequence = v_highest_sequence + 1;
    
    -- Convert accordion to accordian if needed
    IF p_content_type = 'accordion' THEN
        SET p_content_type = 'accordian';
    END IF;
    
    -- Create the topic
    INSERT INTO tbl_topics (
        module_id,
        title,
        description,
        content_type,
        sequence_no,
        languages,
        created_by,
        updated_by,
        created_by_type,
        updated_by_type,
        topic_duration,
        extra_duration,
        total_duration,
        created_at,
        updated_at
    ) VALUES (
        v_module_internal_id,
        p_title,
        p_description,
        p_content_type,
        v_next_sequence,
        p_languages,
        p_created_by,
        p_created_by,
        p_created_by_type,
        p_created_by_type,
        p_topic_duration,
        p_extra_duration,
        p_total_duration,
        NOW(),
        NOW()
    );
    
    SET v_topic_id = LAST_INSERT_ID();
    
    -- Generate public hash (simple implementation - you may want to use your actual hash function)
    SET v_public_hash = CONCAT('topic_', v_topic_id, '_', UNIX_TIMESTAMP());
    
    -- Update topic with public hash
    UPDATE tbl_topics 
    SET public_hash = v_public_hash 
    WHERE id = v_topic_id;
    
    -- Handle tags if provided
    IF p_tags IS NOT NULL AND JSON_VALID(p_tags) THEN
        CALL CreateTopicTags(v_topic_id, p_tags, p_files, p_created_by, p_created_by_type);
    END IF;

    -- Loop through materials array (if provided) and insert into tbl_materials
    IF p_materials IS NOT NULL AND JSON_TYPE(p_materials) = 'ARRAY' THEN
        SET v_material_count = JSON_LENGTH(p_materials);
        SET m = 0;
        WHILE m < v_material_count DO
            SET v_material_item = JSON_EXTRACT(p_materials, CONCAT('$[', m, ']'));
            SET v_mat_type = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_material_item, '$.material_type')), 'null');
            SET v_mat_url = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_material_item, '$.url')), 'null');
            SET v_codeLanguage = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_material_item, '$.codeLanguage')), 'null');
            SET v_code = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_material_item, '$.code')), 'null');

            IF v_mat_type IS NOT NULL AND ( (v_mat_url IS NOT NULL AND v_mat_url <> '') OR (v_code IS NOT NULL AND v_code <> '') ) THEN
                INSERT INTO tbl_materials (
                    topic_id,
                    material_type,
                    url,
                    code,
                    codeLanguage,
                    created_by,
                    updated_by,
                    created_by_type,
                    updated_by_type,
                    created_at,
                    updated_at
                ) VALUES (
                    v_topic_id,
                    v_mat_type,
                    v_mat_url,
                    v_code,
                    v_codeLanguage,
                    p_created_by,
                    p_created_by,
                    p_created_by_type,
                    p_created_by_type,
                    NOW(),
                    NOW()
                );
            END IF;
            SET m = m + 1;
        END WHILE;
    END IF;
    
    -- Handle content based on type
    IF p_content IS NOT NULL AND JSON_VALID(p_content) THEN
        IF p_content_type = 'video' THEN
            CALL CreateVideoContent(v_topic_id, p_content, p_files, p_created_by, p_created_by_type);
        ELSEIF p_content_type = 'audio' THEN
            CALL CreateAudioContent(v_topic_id, p_content, p_files, p_created_by, p_created_by_type);
        ELSEIF p_content_type = 'accordian' THEN
            CALL CreateAccordionContent(v_topic_id, p_content, p_files, p_created_by, p_created_by_type);
        ELSEIF p_content_type = 'general' THEN
            CALL CreateGeneralContent(v_topic_id, p_content, p_files, p_created_by, p_created_by_type);
        ELSEIF p_content_type = 'slide' THEN
            CALL CreateSlideContent(v_topic_id, p_content, p_files, p_created_by, p_created_by_type);
        END IF;
    END IF;
    
    COMMIT;
    
    SELECT v_topic_id as topic_id, v_public_hash as public_hash, 'Topic created successfully' as message;
END;`)

        await sequelize.query(`DROP PROCEDURE IF EXISTS CreateTopicTags;`)
        await sequelize.query(`CREATE PROCEDURE CreateTopicTags(
    IN p_topic_id INT,
    IN p_tags JSON,
    IN p_files JSON,
    IN p_created_by INT,
    IN p_created_by_type VARCHAR(20)
)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE total_tags INT;
    DECLARE v_tag_name VARCHAR(255);
    DECLARE v_tag_type VARCHAR(50);
    DECLARE v_tag_file_path TEXT;
    DECLARE v_tag_file_type VARCHAR(20);
    DECLARE v_code_language VARCHAR(50);
    DECLARE v_filename VARCHAR(255);
    
    SET total_tags = JSON_LENGTH(p_tags);
    
    WHILE i < total_tags DO
        SET v_tag_name = JSON_UNQUOTE(JSON_EXTRACT(p_tags, CONCAT('$[', i, '].tagName')));
        SET v_tag_type = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_tags, CONCAT('$[', i, '].tag_type'))), 'null');
        SET v_code_language = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_tags, CONCAT('$[', i, '].codeLanguage'))), 'null');
        
        -- Default values
        SET v_tag_file_path = NULL;
        SET v_tag_file_type = 'other';
        
        -- First check if it's a code-type tag
        IF v_tag_type = 'code' OR JSON_UNQUOTE(JSON_EXTRACT(p_tags, CONCAT('$[', i, '].tag_type'))) = 'code' THEN
            -- Ensure the tag type is set correctly
            SET v_tag_type = 'code';
            
            -- For code-type tags, store the code content in tag_file_path
            SET v_tag_file_path = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_tags, CONCAT('$[', i, '].tagFile'))), 'null');
            SET v_tag_file_type = 'code';
            
            -- Ensure code language is set for code-type tags
            IF v_code_language IS NULL OR v_code_language = '' THEN
                SET v_code_language = 'python'; -- Default to Python if no language specified
            END IF;
            
            -- Additional debug log for code tag
            -- Commenting out log statement since table doesn't exist
            -- INSERT INTO tbl_procedure_logs (procedure_name, log_message) 
            -- VALUES ('CreateTopicTags', CONCAT('Processing code tag: ', v_tag_name, ', code=', SUBSTRING(IFNULL(v_tag_file_path, 'NULL'), 1, 50)));
        ELSE
            -- Handle file uploads for non-code tags
            IF p_files IS NOT NULL AND JSON_VALID(p_files) THEN
                IF JSON_EXTRACT(p_files, CONCAT('$.tagFiles."', i, '"')) IS NOT NULL THEN
                    SET v_filename = JSON_UNQUOTE(JSON_EXTRACT(p_files, CONCAT('$.tagFiles."', i, '".filename')));
                    SET v_tag_file_path = CONCAT('/tags/', v_filename);
                    
                    -- Always set tag_file_type to 'other' for file uploads per requirements
                    -- We're storing all file tags as 'other' as specified
                    SET v_tag_file_type = 'other';
                ELSE
                    -- For other non-file tags
                    SET v_tag_file_path = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_tags, CONCAT('$[', i, '].tagFile'))), 'null');
                    SET v_tag_file_type = COALESCE(v_tag_type, 'other');
                END IF;
            ELSE
                -- No files provided, use tag data only
                SET v_tag_file_path = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_tags, CONCAT('$[', i, '].tagFile'))), 'null');
                SET v_tag_file_type = COALESCE(v_tag_type, 'other');
            END IF;
        END IF;
        
        -- Debug log for tag data
        -- Commenting out log statement since table doesn't exist
        -- INSERT INTO tbl_procedure_logs (procedure_name, log_message) 
        -- VALUES (
        --     'CreateTopicTags', 
        --     CONCAT(
        --         'Tag ', i, ': type=', v_tag_type, 
        --         ', file_type=', v_tag_file_type, 
        --         ', code_lang=', IFNULL(v_code_language, 'NULL'),
        --         ', path=', SUBSTRING(IFNULL(v_tag_file_path, 'NULL'), 1, 100)
        --     )
        -- );
        
        -- Insert tag
        INSERT INTO tbl_topics_tag (
            topic_id,
            tag,
            tag_file_path,
            tag_file_type,
            code_language,
            created_by,
            updated_by,
            created_by_type,
            updated_by_type,
            created_at,
            updated_at
        ) VALUES (
            p_topic_id,
            v_tag_name,
            v_tag_file_path,
            v_tag_file_type,
            v_code_language,
            p_created_by,
            p_created_by,
            p_created_by_type,
            p_created_by_type,
            NOW(),
            NOW()
        );
        
        SET i = i + 1;
    END WHILE;
END;`)

        await sequelize.query(`DROP PROCEDURE IF EXISTS CreateVideoContent;`)
        await sequelize.query(`CREATE PROCEDURE CreateVideoContent(
    IN p_topic_id INT,
    IN p_content JSON,
    IN p_files JSON,
    IN p_created_by INT,
    IN p_created_by_type VARCHAR(20)
)
BEGIN
    DECLARE v_video_url VARCHAR(255);
    DECLARE v_duration_minutes DECIMAL(6,2);
    DECLARE v_video_type VARCHAR(50);
    
    -- Extract content values
    SET v_duration_minutes = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_content, '$.duration_minutes')), 'null');
    SET v_video_type = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_content, '$.video_type')), 'null');
    
    -- Handle video URL from files or content
    IF p_files IS NOT NULL AND JSON_EXTRACT(p_files, '$.videoUrl') IS NOT NULL THEN
        -- Check if this is a YouTube URL or an uploaded file
        IF v_video_type = 'youtube' THEN
            -- For YouTube videos, use the URL as-is without prefix
            SET v_video_url = JSON_UNQUOTE(JSON_EXTRACT(p_files, '$.videoUrl'));
        ELSE
            -- For uploaded videos, add the prefix
            SET v_video_url = CONCAT('/video/', JSON_UNQUOTE(JSON_EXTRACT(p_files, '$.videoUrl')));
        END IF;
    ELSE
        SET v_video_url = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_content, '$.videoUrl')), 'null');
    END IF;
    
    -- Validate required fields
    IF v_video_url IS NULL OR v_duration_minutes IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|ValidationError|Invalid video data';
    END IF;
    
    INSERT INTO tbl_videos (
        topic_id,
        url,
        duration_minutes,
        video_type,
        created_by,
        updated_by,
        created_by_type,
        updated_by_type,
        created_at,
        updated_at
    ) VALUES (
        p_topic_id,
        v_video_url,
        v_duration_minutes,
        v_video_type,
        p_created_by,
        p_created_by,
        p_created_by_type,
        p_created_by_type,
        NOW(),
        NOW()
    );
END;`)

        await sequelize.query(`DROP PROCEDURE IF EXISTS CreateAudioContent;`)
        await sequelize.query(`CREATE PROCEDURE CreateAudioContent(
    IN p_topic_id INT,
    IN p_content JSON,
    IN p_files JSON,
    IN p_created_by INT,
    IN p_created_by_type VARCHAR(20)
)
BEGIN
    DECLARE v_audio_url VARCHAR(255);
    DECLARE v_image_url VARCHAR(255);
    DECLARE v_duration_minutes DECIMAL(6,2);
    
    -- Extract content values
    SET v_duration_minutes = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_content, '$.duration_minutes')), 'null');
    
    -- Handle audio URL from files or content
    IF p_files IS NOT NULL AND JSON_EXTRACT(p_files, '$.audioUrl') IS NOT NULL THEN
        SET v_audio_url = CONCAT('/audio/', JSON_UNQUOTE(JSON_EXTRACT(p_files, '$.audioUrl')));
    ELSE
        SET v_audio_url = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_content, '$.audioUrl')), 'null');
    END IF;

    -- Handle image URL from files or content
    IF p_files IS NOT NULL AND JSON_EXTRACT(p_files, '$.imageUrl') IS NOT NULL THEN
        SET v_image_url = CONCAT('/audio/image/', JSON_UNQUOTE(JSON_EXTRACT(p_files, '$.imageUrl')));
    END IF;
    
    -- Validate required fields
    IF v_audio_url IS NULL OR v_duration_minutes IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|ValidationError|Invalid audio data';
    END IF;
    
    INSERT INTO tbl_audios (
        topic_id,
        url,
        image_url,
        duration_minutes,
        created_by,
        updated_by,
        created_by_type,
        updated_by_type,
        created_at,
        updated_at
    ) VALUES (
        p_topic_id,
        v_audio_url,
        v_image_url,
        v_duration_minutes,
        p_created_by,
        p_created_by,
        p_created_by_type,
        p_created_by_type,
        NOW(),
        NOW()
    );
END;`)

        await sequelize.query(`DROP PROCEDURE IF EXISTS CreateAccordionContent;`)
        await sequelize.query(`CREATE PROCEDURE CreateAccordionContent(
    IN p_topic_id INT,
    IN p_content JSON,
    IN p_files JSON,
    IN p_created_by INT,
    IN p_created_by_type VARCHAR(20)
)
BEGIN
    DECLARE v_section_count INT;
    DECLARE i INT DEFAULT 0;
    DECLARE v_section_data JSON;
    DECLARE v_title VARCHAR(255);
    DECLARE v_body TEXT;
    DECLARE v_code_language VARCHAR(50);
    DECLARE v_code TEXT;
    DECLARE v_completion_type VARCHAR(20);
    DECLARE v_completion_time INT;
    DECLARE v_audio_url VARCHAR(255);
    DECLARE v_duration_minutes DECIMAL(6,2);
    DECLARE v_accordion_id INT;
    DECLARE v_section_index INT;
    
    SET v_section_count = JSON_LENGTH(p_content);
    
    WHILE i < v_section_count DO
        SET v_section_data = JSON_EXTRACT(p_content, CONCAT('$[', i, ']'));
        SET v_title = JSON_UNQUOTE(JSON_EXTRACT(v_section_data, '$.title'));
        SET v_body = JSON_UNQUOTE(JSON_EXTRACT(v_section_data, '$.body'));
        SET v_code_language = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_section_data, '$.codeLanguage')), 'null');
        SET v_code = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_section_data, '$.code')), 'null');
        SET v_completion_type = COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_section_data, '$.accordianCompletionType')), 'null'), 'audio');
        SET v_completion_time = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_section_data, '$.accordianCompletionTime')), 'null');
        SET v_duration_minutes = COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_section_data, '$.accordianAudioDuration')), 'null'), 0.00);
        SET v_section_index = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_section_data, '$.index')), 'null');
        
        -- Convert completion time from minutes to seconds
        IF v_completion_time IS NOT NULL THEN
            SET v_completion_time = v_completion_time;
        END IF;
        
        -- Handle audio URL
        SET v_audio_url = NULL;
        IF p_files IS NOT NULL AND v_section_index IS NOT NULL THEN
            IF JSON_EXTRACT(p_files, CONCAT('$.accordionAudioUrls."', v_section_index, '"')) IS NOT NULL THEN
                SET v_audio_url = CONCAT('/audios/accordion/', JSON_UNQUOTE(JSON_EXTRACT(p_files, CONCAT('$.accordionAudioUrls."', v_section_index, '"'))));
            END IF;
        END IF;
        
        IF v_audio_url IS NULL THEN
            SET v_audio_url = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_section_data, '$.audioUrl')), 'null');
        END IF;
        
        -- Create accordion section
        INSERT INTO tbl_accordions (
            topic_id,
            title,
            body,
            codeLanguage,
            code,
            completion_type,
            completion_time,
            audio_url,
            duration_minutes,
            created_by,
            updated_by,
            created_by_type,
            updated_by_type,
            created_at,
            updated_at
        ) VALUES (
            p_topic_id,
            v_title,
            v_body,
            v_code_language,
            v_code,
            v_completion_type,
            v_completion_time,
            v_audio_url,
            IF(v_completion_type = 'audio', COALESCE(v_duration_minutes, 0.00), 0.00),
            p_created_by,
            p_created_by,
            p_created_by_type,
            p_created_by_type,
            NOW(),
            NOW()
        );
        
        SET v_accordion_id = LAST_INSERT_ID();
        
        -- Handle attachments
        CALL CreateAccordionAttachments(v_accordion_id, v_section_data, p_files, i);
        
        SET i = i + 1;
    END WHILE;
END;`)

        await sequelize.query(`DROP PROCEDURE IF EXISTS CreateAccordionAttachments;`)
        await sequelize.query(`CREATE PROCEDURE CreateAccordionAttachments(
    IN p_accordion_id INT,
    IN p_section_data JSON,
    IN p_files JSON,
    IN p_section_index INT
)
BEGIN
    DECLARE v_media_urls JSON;
    DECLARE v_media_count INT;
    DECLARE j INT DEFAULT 0;
    DECLARE v_media_data JSON;
    DECLARE v_file_url VARCHAR(255);
    DECLARE v_file_type VARCHAR(20);
    DECLARE v_youtube_url VARCHAR(255);
    
    -- Handle YouTube URL
    SET v_youtube_url = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_section_data, '$.youtubeUrl')), 'null');
    IF v_youtube_url IS NOT NULL THEN
        INSERT INTO tbl_accordion_attachments (
            accordionId,
            fileUrl,
            fileType,
            created_at,
            updated_at
        ) VALUES (
            p_accordion_id,
            v_youtube_url,
            'youtube',
            NOW(),
            NOW()
        );
    END IF;
    
    -- Handle media URLs
    SET v_media_urls = JSON_EXTRACT(p_section_data, '$.mediaUrl');
    IF v_media_urls IS NOT NULL AND JSON_TYPE(v_media_urls) = 'ARRAY' THEN
        SET v_media_count = JSON_LENGTH(v_media_urls);
        
        WHILE j < v_media_count DO
            SET v_media_data = JSON_EXTRACT(v_media_urls, CONCAT('$[', j, ']'));
            SET v_file_type = JSON_UNQUOTE(JSON_EXTRACT(v_media_data, '$.fileType'));
            SET v_file_url = JSON_UNQUOTE(JSON_EXTRACT(v_media_data, '$.url'));
            
            -- Handle different file types
            IF v_file_type = 'video' AND JSON_UNQUOTE(JSON_EXTRACT(v_media_data, '$.youtubeUrl')) IS NOT NULL THEN
                SET v_file_url = JSON_UNQUOTE(JSON_EXTRACT(v_media_data, '$.youtubeUrl'));
                SET v_file_type = 'youtube';
            ELSEIF p_files IS NOT NULL AND JSON_EXTRACT(p_files, CONCAT('$.accordionAttachments."', p_section_index, '"[', j, ']')) IS NOT NULL THEN
                SET v_file_url = CONCAT('/accordion/attachments/', JSON_UNQUOTE(JSON_EXTRACT(p_files, CONCAT('$.accordionAttachments."', p_section_index, '"[', j, '].filename'))));
            END IF;
            
            INSERT INTO tbl_accordion_attachments (
                accordionId,
                fileUrl,
                fileType,
                created_at,
                updated_at
            ) VALUES (
                p_accordion_id,
                v_file_url,
                v_file_type,
                NOW(),
                NOW()
            );
            
            SET j = j + 1;
        END WHILE;
    END IF;
END;`)

        await sequelize.query(`DROP PROCEDURE IF EXISTS CreateGeneralContent;`)
        await sequelize.query(`CREATE PROCEDURE CreateGeneralContent(
    IN p_topic_id INT,
    IN p_content JSON,
    IN p_files JSON,
    IN p_created_by INT,
    IN p_created_by_type VARCHAR(20)
)
BEGIN
    DECLARE v_title VARCHAR(255);
    DECLARE v_description TEXT;
    DECLARE v_audio_url VARCHAR(255);
    DECLARE v_completion_type VARCHAR(20);
    DECLARE v_completion_time INT;
    DECLARE v_duration_minutes DECIMAL(6,2);
    
    -- Extract content values
    SET v_title = COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_content, '$.title')), 'null'), 'Untitled');
    SET v_description = JSON_UNQUOTE(JSON_EXTRACT(p_content, '$.description'));
    SET v_completion_type = COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_content, '$.completion_type')), 'null'), 'audio');
    SET v_completion_time = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_content, '$.completion_time')), 'null');
    SET v_duration_minutes = COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_content, '$.duration_minutes')), 'null'), 0.00);
    
    -- Convert completion time from minutes to seconds
    IF v_completion_time IS NOT NULL THEN
        SET v_completion_time = v_completion_time ;
    END IF;
    
    -- Validate required description
    IF v_description IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|ValidationError|General description is required';
    END IF;
    
    -- Handle audio URL for completion
    IF v_completion_type = 'audio' THEN
        IF p_files IS NOT NULL AND JSON_EXTRACT(p_files, '$.generalAudioUrl') IS NOT NULL THEN
            SET v_audio_url = CONCAT('/audios/general/', JSON_UNQUOTE(JSON_EXTRACT(p_files, '$.generalAudioUrl')));
        ELSE
            SET v_audio_url = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_content, '$.audio_url')), 'null');
        END IF;
        
        IF v_audio_url IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|ValidationError|Audio file is required for audio completion type';
        END IF;
    END IF;
    
    INSERT INTO tbl_general_materials (
        topic_id,
        audio_url,
        title,
        description,
        completion_type,
        completion_time,
        duration_minutes,
        created_by,
        updated_by,
        created_by_type,
        updated_by_type,
        created_at,
        updated_at
    ) VALUES (
        p_topic_id,
        v_audio_url,
        v_title,
        v_description,
        v_completion_type,
        v_completion_time,
        IF(v_completion_type = 'audio', COALESCE(v_duration_minutes, 0.00), 0.00),
        p_created_by,
        p_created_by,
        p_created_by_type,
        p_created_by_type,
        NOW(),
        NOW()
    );
END;`)

        await sequelize.query(`DROP PROCEDURE IF EXISTS CreateSlideContent;`)
        await sequelize.query(`CREATE PROCEDURE CreateSlideContent(
    IN p_topic_id INT,
    IN p_content JSON,
    IN p_files JSON,
    IN p_created_by INT,
    IN p_created_by_type VARCHAR(20)
)
BEGIN
    DECLARE v_slide_count INT;
    DECLARE i INT DEFAULT 0;
    DECLARE v_slide_data JSON;
    DECLARE v_slide_id INT;
    DECLARE v_title VARCHAR(255);
    DECLARE v_description TEXT;
    DECLARE v_content_type VARCHAR(50);
    DECLARE v_completion_type VARCHAR(20);
    DECLARE v_completion_time INT;
    DECLARE v_sequence_no INT;
    DECLARE v_slide_duration DECIMAL(10,2);
    DECLARE v_slide_extra_duration DECIMAL(10,2);
    DECLARE v_total_slide_duration DECIMAL(10,2);
    DECLARE v_audio_url VARCHAR(255);
    DECLARE v_slide_index INT;

    DECLARE v_materials JSON;
    DECLARE v_material_count INT;
    DECLARE k INT DEFAULT 0;
    DECLARE v_material_item JSON;
    DECLARE v_mat_type VARCHAR(50);
    DECLARE v_mat_url TEXT;
    DECLARE v_mat_code TEXT;
    DECLARE v_mat_codeLanguage VARCHAR(50);
    DECLARE v_mat_file_url TEXT;

    DECLARE v_mimetype VARCHAR(255);
    DECLARE v_filename VARCHAR(255);
    DECLARE v_subdir VARCHAR(50);

    SET v_slide_count = JSON_LENGTH(p_content);

    WHILE i < v_slide_count DO
        SET v_slide_data = JSON_EXTRACT(p_content, CONCAT('$[', i, ']'));

        -- Extract slide data
        SET v_title = JSON_UNQUOTE(JSON_EXTRACT(v_slide_data, '$.title'));
        SET v_description = JSON_UNQUOTE(JSON_EXTRACT(v_slide_data, '$.description'));
        SET v_content_type = JSON_UNQUOTE(JSON_EXTRACT(v_slide_data, '$.content_type'));
        SET v_completion_type = COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_slide_data, '$.slideCompletionType')), 'null'), 'audio');
        SET v_completion_time = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_slide_data, '$.slideCompletionTime')), 'null');
        SET v_slide_duration = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_slide_data, '$.slide_duration')), 'null');
        SET v_slide_extra_duration = COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_slide_data, '$.slide_extra_duration')), 'null'), 0.00);
        SET v_total_slide_duration = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_slide_data, '$.total_slide_duration')), 'null');
        SET v_sequence_no = COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_slide_data, '$.sequence_no')), 'null'), i);
        SET v_slide_index = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_slide_data, '$.index')), 'null');

        -- Override completion type if content is video
        IF v_content_type = 'video' THEN
            SET v_completion_type = 'video';
        END IF;

        -- Handle slide audio URL
        SET v_audio_url = NULL;
        IF p_files IS NOT NULL AND v_slide_index IS NOT NULL THEN
            IF JSON_EXTRACT(p_files, CONCAT('$.slideAudioUrl."', v_slide_index, '"')) IS NOT NULL THEN
                SET v_audio_url = CONCAT('/audios/multi_slide/', JSON_UNQUOTE(JSON_EXTRACT(p_files, CONCAT('$.slideAudioUrl."', v_slide_index, '"'))));
            END IF;
        END IF;

        -- Insert the slide
        INSERT INTO tbl_multi_slides (
            topic_id,
            title,
            description,
            type,
            completion_type,
            completion_time,
            audio_url,
            sequence_no,
            slide_duration,
            slide_extra_duration,
            total_slide_duration,
            created_by,
            created_by_type,
            updated_by,
            updated_by_type,
            created_at,
            updated_at
        ) VALUES (
            p_topic_id,
            v_title,
            v_description,
            v_content_type,
            v_completion_type,
            v_completion_time,
            v_audio_url,
            v_sequence_no,
            v_slide_duration,
            v_slide_extra_duration,
            v_total_slide_duration,
            p_created_by,
            p_created_by_type,
            p_created_by,
            p_created_by_type,
            NOW(),
            NOW()
        );

        SET v_slide_id = LAST_INSERT_ID();

        -- Handle materials for this slide
        IF JSON_EXTRACT(v_slide_data, '$.materials') IS NOT NULL THEN
            SET v_materials = JSON_EXTRACT(v_slide_data, '$.materials');

            IF JSON_TYPE(v_materials) = 'ARRAY' THEN
                SET v_material_count = JSON_LENGTH(v_materials);
            ELSE
                SET v_material_count = 0;
            END IF;

            SET k = 0;

            WHILE k < v_material_count DO
                SET v_material_item = JSON_EXTRACT(v_materials, CONCAT('$[', k, ']'));
                SET v_mat_type = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_material_item, '$.material_type')), 'null');
                SET v_mat_url = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_material_item, '$.url')), 'null');
                SET v_mat_code = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_material_item, '$.code')), 'null');
                SET v_mat_codeLanguage = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_material_item, '$.codeLanguage')), 'null');

                -- Handle file uploads if present
                IF p_files IS NOT NULL AND JSON_EXTRACT(p_files, CONCAT('$.slideMaterials[', i, '].materials[', k, '].url')) IS NOT NULL THEN
                    SET v_mat_url = JSON_UNQUOTE(JSON_EXTRACT(p_files, CONCAT('$.slideMaterials[', i, '].materials[', k, '].url')));
                END IF;


                -- Insert material for this slide
                INSERT INTO tbl_materials (
                    topic_id,
                    slide_id,
                    material_type,
                    url,
                    code,
                    codeLanguage,
                    created_by,
                    updated_by,
                    created_by_type,
                    updated_by_type,
                    created_at,
                    updated_at
                ) VALUES (
                    p_topic_id,
                    v_slide_id,
                    v_mat_type,
                    v_mat_url,
                    v_mat_code,
                    v_mat_codeLanguage,
                    p_created_by,
                    p_created_by,
                    p_created_by_type,
                    p_created_by_type,
                    NOW(),
                    NOW()
                );

                SET k = k + 1;
            END WHILE;
        END IF;

        -- Call content-specific procedures
        IF v_content_type = 'video' THEN
            CALL CreateSlideVideoContent(v_slide_id, v_slide_data, p_files, i, p_created_by, p_created_by_type);
        ELSEIF v_content_type = 'accordian' THEN
            CALL CreateSlideAccordionContent(v_slide_id, v_slide_data, p_files, i, p_created_by, p_created_by_type);
        -- Add other content types as needed
        END IF;

        SET i = i + 1;
    END WHILE;
END`)

        await sequelize.query(`DROP PROCEDURE IF EXISTS CreateSlideVideoContent;`)
        await sequelize.query(`CREATE PROCEDURE CreateSlideVideoContent(
    IN p_slide_id INT,
    IN p_slide_data JSON,
    IN p_files JSON,
    IN p_slide_index INT,
    IN p_created_by INT,
    IN p_created_by_type VARCHAR(20)
)
BEGIN
    DECLARE v_video_url VARCHAR(255);
    DECLARE v_video_type VARCHAR(50);
    DECLARE v_duration_minutes DECIMAL(6,2);
    
    SET v_duration_minutes = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_slide_data, '$.videoDuration')), 'null');
    SET v_video_type = COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_slide_data, '$.videoType')), 'null'), 'internal');
    
    -- Handle video URL
    IF p_files IS NOT NULL AND JSON_EXTRACT(p_files, CONCAT('$.slide_files."', p_slide_index, '"')) IS NOT NULL THEN
        SET v_video_url = CONCAT('/multiSlide/video/', JSON_UNQUOTE(JSON_EXTRACT(p_files, CONCAT('$.slide_files."', p_slide_index, '"'))));
        SET v_video_type = 'internal';
    ELSE
        SET v_video_url = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_slide_data, '$.videoUrl')), 'null');
    END IF;
    
    INSERT INTO tbl_multi_slides_video (
        multi_slide_id,
        url,
        type,
        duration_minutes,
        created_by,
        updated_by,
        created_by_type,
        updated_by_type,
        created_at,
        updated_at
    ) VALUES (
        p_slide_id,
        v_video_url,
        v_video_type,
        v_duration_minutes,
        p_created_by,
        p_created_by,
        p_created_by_type,
        p_created_by_type,
        NOW(),
        NOW()
    );
END;`)

        await sequelize.query(`DROP PROCEDURE IF EXISTS CreateSlideAudioContent;`)
        await sequelize.query(`CREATE PROCEDURE CreateSlideAudioContent(
    IN p_slide_id INT,
    IN p_slide_data JSON,
    IN p_files JSON,
    IN p_slide_index INT,
    IN p_created_by INT,
    IN p_created_by_type VARCHAR(20)
)
BEGIN
    DECLARE v_audio_url VARCHAR(255);
    DECLARE v_duration_minutes DECIMAL(6,2);
    
    SET v_duration_minutes = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_slide_data, '$.audioDuration')), 'null');
    
    -- Handle audio URL
    IF p_files IS NOT NULL AND JSON_EXTRACT(p_files, CONCAT('$.slide_files."', p_slide_index, '"')) IS NOT NULL THEN
        SET v_audio_url = CONCAT('/multiSlide/audio/', JSON_UNQUOTE(JSON_EXTRACT(p_files, CONCAT('$.slide_files."', p_slide_index, '"'))));
    ELSE
        SET v_audio_url = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_slide_data, '$.audioUrl')), 'null');
    END IF;
    
    INSERT INTO tbl_multi_slides_audio (
        multi_slide_id,
        url,
        duration_minutes,
        created_by,
        updated_by,
        created_by_type,
        updated_by_type,
        created_at,
        updated_at
    ) VALUES (
        p_slide_id,
        v_audio_url,
        v_duration_minutes,
        p_created_by,
        p_created_by,
        p_created_by_type,
        p_created_by_type,
        NOW(),
        NOW()
    );
END;`)

        await sequelize.query(`DROP PROCEDURE IF EXISTS CreateSlideGeneralContent;`)
        await sequelize.query(`CREATE PROCEDURE CreateSlideGeneralContent(
    IN p_slide_id INT,
    IN p_slide_data JSON,
    IN p_files JSON,
    IN p_slide_index INT,
    IN p_created_by INT,
    IN p_created_by_type VARCHAR(20)
)
BEGIN
    DECLARE v_code_language VARCHAR(50);
    DECLARE v_code TEXT;

    SET v_code_language = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_slide_data, '$.codeLanguage')), 'null');
    SET v_code = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_slide_data, '$.code')), 'null');
    
    INSERT INTO tbl_multi_slides_general (
        multi_slide_id,
        codeLanguage,
        code,
        created_by,
        updated_by,
        created_by_type,
        updated_by_type,
        created_at,
        updated_at
    ) VALUES (
        p_slide_id,
        v_code_language,
        v_code,
        p_created_by,
        p_created_by,
        p_created_by_type,
        p_created_by_type,
        NOW(),
        NOW()
    );
END;`)

        await sequelize.query(`DROP PROCEDURE IF EXISTS CreateSlideAccordionContent;`)
        await sequelize.query(`CREATE PROCEDURE CreateSlideAccordionContent(
    IN p_slide_id INT,
    IN p_slide_data JSON,
    IN p_files JSON,
    IN p_slide_index INT,
    IN p_created_by INT,
    IN p_created_by_type VARCHAR(20)
)
BEGIN
    DECLARE v_accordion_sections JSON;
    DECLARE v_section_count INT;
    DECLARE i INT DEFAULT 0;
    DECLARE v_section_data JSON;
    DECLARE v_accordion_id INT;
    DECLARE v_title VARCHAR(255);
    DECLARE v_body TEXT;
    DECLARE v_code_language VARCHAR(50);
    DECLARE v_code TEXT;
    
    SET v_accordion_sections = JSON_EXTRACT(p_slide_data, '$.accordianSections');
    
    IF v_accordion_sections IS NOT NULL AND JSON_TYPE(v_accordion_sections) = 'ARRAY' THEN
        SET v_section_count = JSON_LENGTH(v_accordion_sections);
        
        WHILE i < v_section_count DO
            SET v_section_data = JSON_EXTRACT(v_accordion_sections, CONCAT('$[', i, ']'));
            SET v_title = JSON_UNQUOTE(JSON_EXTRACT(v_section_data, '$.title'));
            SET v_body = JSON_UNQUOTE(JSON_EXTRACT(v_section_data, '$.body'));
            SET v_code_language = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_section_data, '$.codeLanguage')), 'null');
            SET v_code = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_section_data, '$.code')), 'null');
            
            INSERT INTO tbl_multislide_accordions (
                multi_slide_id,
                title,
                body,
                codeLanguage,
                code,
                created_by,
                updated_by,
                created_by_type,
                updated_by_type,
                created_at,
                updated_at
            ) VALUES (
                p_slide_id,
                v_title,
                v_body,
                v_code_language,
                v_code,
                p_created_by,
                p_created_by,
                p_created_by_type,
                p_created_by_type,
                NOW(),
                NOW()
            );
            
            SET v_accordion_id = LAST_INSERT_ID();
            
            -- Handle attachments for this accordion section
            CALL CreateSlideAccordionAttachments(v_accordion_id, v_section_data, p_files, p_slide_index, i);
            
            SET i = i + 1;
        END WHILE;
    END IF;
END;`)

        await sequelize.query(`DROP PROCEDURE IF EXISTS CreateSlideAccordionAttachments;`)
        await sequelize.query(`CREATE PROCEDURE CreateSlideAccordionAttachments(
    IN p_accordion_id INT,
    IN p_section_data JSON,
    IN p_files JSON,
    IN p_slide_index INT,
    IN p_section_index INT
)
BEGIN
    DECLARE v_media_urls JSON;
    DECLARE v_media_count INT;
    DECLARE j INT DEFAULT 0;
    DECLARE v_media_data JSON;
    DECLARE v_file_url VARCHAR(255);
    DECLARE v_file_type VARCHAR(20);
    DECLARE v_video_url VARCHAR(255);
    DECLARE v_video_type VARCHAR(20);
    
    -- Handle video URL and type only if type is 'youtube'
    SET v_video_url = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_section_data, '$.videoUrl')), 'null');
    SET v_video_type = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_section_data, '$.videoType')), 'null');

    IF v_video_url IS NOT NULL AND v_video_type = 'youtube' THEN
        INSERT INTO tbl_multislide_accordion_attachments (
            accordionId,
            fileUrl,
            fileType,
            created_at,
            updated_at
        ) VALUES (
            p_accordion_id,
            v_video_url,
            v_video_type, -- guaranteed to be 'youtube' by this point
            NOW(),
            NOW()
        );
    END IF;
    
    -- Handle media URLs
    SET v_media_urls = JSON_EXTRACT(p_section_data, '$.mediaUrl');
    IF v_media_urls IS NOT NULL AND JSON_TYPE(v_media_urls) = 'ARRAY' THEN
        SET v_media_count = JSON_LENGTH(v_media_urls);
        
        WHILE j < v_media_count DO
            SET v_media_data = JSON_EXTRACT(v_media_urls, CONCAT('$[', j, ']'));
            SET v_file_type = JSON_UNQUOTE(JSON_EXTRACT(v_media_data, '$.fileType'));
            SET v_file_url = JSON_UNQUOTE(JSON_EXTRACT(v_media_data, '$.url'));
            
            -- Handle file uploads
            IF p_files IS NOT NULL AND JSON_EXTRACT(p_files, CONCAT('$.slide_files."', p_slide_index, '"."', p_section_index, '"[', j, ']')) IS NOT NULL THEN
                SET v_file_url = CONCAT(
                    '/multislide/accordion/attachments/',
                    JSON_UNQUOTE(
                        JSON_EXTRACT(
                            p_files,
                            CONCAT('$.slide_files."', p_slide_index, '"."', p_section_index, '"[', j, ']')
                        )
                    )
                );
            END IF;
            
            INSERT INTO tbl_multislide_accordion_attachments (
                accordionId,
                fileUrl,
                fileType,
                created_at,
                updated_at
            ) VALUES (
                p_accordion_id,
                v_file_url,
                v_file_type,
                NOW(),
                NOW()
            );
            
            SET j = j + 1;
        END WHILE;
    END IF;
END;`)

        await sequelize.query(`DROP PROCEDURE IF EXISTS UpdateTopicTags`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateTopicTags(
    IN p_topic_id INT,
    IN p_tags JSON,
    IN p_tag_files JSON,
    IN p_updated_by INT
)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE total_tags INT;
    DECLARE v_tag_id INT;
    DECLARE v_tag_name VARCHAR(255);
    DECLARE v_tag_type VARCHAR(50);
    DECLARE v_tag_file JSON;
    DECLARE v_filename VARCHAR(255);
    DECLARE v_tag_file_path TEXT;
    DECLARE v_tag_file_type VARCHAR(20);
    DECLARE v_code_language VARCHAR(50);
 
    -- Create temporary table to track processed tags
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_processed_tags (
        id INT PRIMARY KEY
    );
   
    SET total_tags = JSON_LENGTH(p_tags);
 
    WHILE i < total_tags DO
        -- Extract tag data
        SET v_tag_id = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_tags, CONCAT('$[', i, '].id'))), 'null');
        SET v_tag_name = JSON_UNQUOTE(JSON_EXTRACT(p_tags, CONCAT('$[', i, '].tagName')));
        SET v_tag_type = JSON_UNQUOTE(JSON_EXTRACT(p_tags, CONCAT('$[', i, '].tag_type')));
        SET v_code_language = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_tags, CONCAT('$[', i, '].codeLanguage'))), 'null');
       
        -- Default values
        SET v_tag_file_path = NULL;
        SET v_tag_file_type = NULL;
       
        IF v_tag_type = 'code' THEN
            -- Handle code type tags
            SET v_tag_file_type = 'code';
            SET v_tag_file_path = JSON_UNQUOTE(JSON_EXTRACT(p_tags, CONCAT('$[', i, '].tagFile')));
        ELSE
            -- Handle file type tags
            IF JSON_LENGTH(JSON_EXTRACT(p_tag_files, '$.tagFilesJson')) > i THEN
                SET v_tag_file = JSON_EXTRACT(p_tag_files, CONCAT('$.tagFilesJson[', i, ']'));
 
                IF v_tag_file IS NOT NULL AND NULLIF(JSON_UNQUOTE(v_tag_file), 'null') IS NOT NULL THEN
                    SET v_filename = JSON_UNQUOTE(JSON_EXTRACT(v_tag_file, '$.filename'));
                    SET v_tag_file_path = CONCAT('/tags/', v_filename);
 
                    -- Determine file type based on extension
                    IF v_filename LIKE '%.jpg' OR v_filename LIKE '%.jpeg' OR v_filename LIKE '%.png' OR v_filename LIKE '%.gif' THEN
                        SET v_tag_file_type = 'image';
                    ELSEIF v_filename LIKE '%.mp4' OR v_filename LIKE '%.mov' OR v_filename LIKE '%.avi' OR v_filename LIKE '%.mkv' THEN
                        SET v_tag_file_type = 'video';
                    ELSEIF v_filename LIKE '%.mp3' OR v_filename LIKE '%.wav' OR v_filename LIKE '%.aac' OR v_filename LIKE '%.ogg' THEN
                        SET v_tag_file_type = 'audio';
                    ELSE
                        SET v_tag_file_type = 'other';
                    END IF;
                END IF;
            END IF;
        END IF;
       
        -- If tag has an ID, update it
        IF v_tag_id IS NOT NULL THEN
            UPDATE tbl_topics_tag
            SET
                tag = v_tag_name,
                tag_file_path = COALESCE(v_tag_file_path, tag_file_path),
                tag_file_type = COALESCE(v_tag_file_type, tag_file_type),
                code_language = v_code_language,
                updated_by = p_updated_by,
                updated_at = NOW()
            WHERE id = v_tag_id AND topic_id = p_topic_id;
           
            -- Track this tag as processed
            INSERT INTO temp_processed_tags (id) VALUES (v_tag_id);
        ELSE
            -- Insert new tag
            INSERT INTO tbl_topics_tag (
                topic_id,
                tag,
                tag_file_path,
                tag_file_type,
                code_language,
                status,
                created_by,
                updated_by,
                created_by_type,
                updated_by_type,
                created_at,
                updated_at
            )
            VALUES (
                p_topic_id,
                v_tag_name,
                v_tag_file_path,
                COALESCE(v_tag_file_type, 'other'),
                v_code_language,
                'draft',
                p_updated_by,
                p_updated_by,
                'admin',
                'admin',
                NOW(),
                NOW()
            );
           
            -- Track the newly inserted tag
            INSERT INTO temp_processed_tags (id) VALUES (LAST_INSERT_ID());
        END IF;
       
        SET i = i + 1;
    END WHILE;
   
    -- Delete tags that weren't updated or newly added
    DELETE FROM tbl_topics_tag
    WHERE topic_id = p_topic_id
    AND id NOT IN (SELECT id FROM temp_processed_tags);
   
    -- Cleanup
    DROP TEMPORARY TABLE IF EXISTS temp_processed_tags;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS UpdateTopicMaterials;`)
        await sequelize.query(`CREATE PROCEDURE UpdateTopicMaterials(
    IN p_topic_id INT,
    IN p_materials JSON,
    IN p_updated_by INT,
    IN p_updated_by_type VARCHAR(20)
)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE total_materials INT;
    DECLARE v_mat_id INT;
    DECLARE v_mat_type VARCHAR(50);
    DECLARE v_mat_url TEXT;
    DECLARE v_codeLanguage VARCHAR(50);
    DECLARE v_code TEXT;
    -- Create temporary table to track processed materials
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_processed_materials (
        id INT PRIMARY KEY
    );
    -- Create temporary table to track slide materials (to exclude from deletion)
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_slide_materials (
        id INT PRIMARY KEY
    );
    -- Populate temp_slide_materials with all slide materials for this topic
    INSERT INTO temp_slide_materials (id)
    SELECT id FROM tbl_materials WHERE topic_id = p_topic_id AND slide_id IS NOT NULL;

    SET total_materials = JSON_LENGTH(p_materials);
    WHILE i < total_materials DO
        -- Extract material data
        SET v_mat_id = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_materials, CONCAT('$[', i, '].id'))), 'null');
        SET v_mat_type = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_materials, CONCAT('$[', i, '].material_type'))), 'null');
        SET v_mat_url = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_materials, CONCAT('$[', i, '].url'))), 'null');
        SET v_codeLanguage = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_materials, CONCAT('$[', i, '].codeLanguage'))), 'null');
        SET v_code = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_materials, CONCAT('$[', i, '].code'))), 'null');
        -- Only proceed if we have required data
        IF v_mat_type IS NOT NULL AND ( (v_mat_url IS NOT NULL AND v_mat_url <> '') OR (v_code IS NOT NULL AND v_code <> '') ) THEN
            IF v_mat_id IS NOT NULL THEN
                -- Update existing material
                UPDATE tbl_materials
                SET
                    material_type = v_mat_type,
                    url = v_mat_url,
                    codeLanguage = v_codeLanguage,
                    code = v_code,
                    updated_by = p_updated_by,
                    updated_by_type = p_updated_by_type,
                    updated_at = NOW()
                WHERE id = v_mat_id AND topic_id = p_topic_id;
                -- Track this material as processed
                INSERT INTO temp_processed_materials (id) VALUES (v_mat_id);
            ELSE
                -- Insert new material
                INSERT INTO tbl_materials (
                    topic_id,
                    material_type,
                    url,
                    code,
                    codeLanguage,
                    created_by,
                    updated_by,
                    created_by_type,
                    updated_by_type,
                    created_at,
                    updated_at
                )
                VALUES (
                    p_topic_id,
                    v_mat_type,
                    v_mat_url,
                    v_code,
                    v_codeLanguage,
                    p_updated_by,
                    p_updated_by,
                    p_updated_by_type,
                    p_updated_by_type,
                    NOW(),
                    NOW()
                );
                -- Track the newly inserted material
                INSERT INTO temp_processed_materials (id) VALUES (LAST_INSERT_ID());
            END IF;
        END IF;
        SET i = i + 1;
    END WHILE;
    -- Delete materials not in input list, but exclude slide materials
    DELETE FROM tbl_materials
    WHERE topic_id = p_topic_id
    AND id NOT IN (SELECT id FROM temp_processed_materials)
    AND id NOT IN (SELECT id FROM temp_slide_materials);
    -- Cleanup
    DROP TEMPORARY TABLE IF EXISTS temp_processed_materials;
    DROP TEMPORARY TABLE IF EXISTS temp_slide_materials;
END;
`)

        await sequelize.query(`DROP PROCEDURE IF EXISTS UpdateTopicWithContent`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateTopicWithContent(
    IN p_public_hash VARCHAR(255),
    IN p_module_id INT,
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_content_type ENUM('video', 'audio', 'accordian', 'general', 'slide'),
    IN p_sequence_no INT,
    IN p_updated_by INT,
    IN tags JSON,
    IN p_materials JSON,
    IN p_content JSON, -- JSON containing all content data
    IN p_files JSON, -- JSON representing uploaded files info
    IN p_updated_by_type VARCHAR(20),
    IN p_languages JSON,
    IN p_topic_duration DECIMAL(10,2),
    IN p_extra_duration DECIMAL(10,2),
    IN p_total_duration DECIMAL(10,2)
)
BEGIN
    DECLARE v_topic_id INT;
    DECLARE v_old_content_type VARCHAR(50);
    DECLARE v_old_module_id INT;
    DECLARE v_module_exists INT;
    DECLARE topic_exists INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- START TRANSACTION;

    -- Check if topic exists
    SELECT id, content_type, module_id INTO v_topic_id, v_old_content_type, v_old_module_id
    FROM tbl_topics
    WHERE public_hash = p_public_hash;
    
    IF v_topic_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Topic not found';
    END IF;
    
    -- Check if module exists if being updated
    IF p_module_id IS NOT NULL AND p_module_id != v_old_module_id THEN
        SELECT COUNT(*) INTO v_module_exists FROM tbl_modules WHERE id = p_module_id;
        IF v_module_exists = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Module not found';
        END IF;
    END IF;
    
    IF p_title IS NOT NULL THEN
        -- Check for duplicate topic (same module and title)
        SELECT COUNT(*) INTO topic_exists
        FROM tbl_topics
        WHERE module_id = v_old_module_id
        AND title = p_title
        AND id != v_topic_id;
        
        IF topic_exists > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|DuplicateError|Topic with same title already exists in this module';
        END IF;
    END IF;

    -- Update the topic
    UPDATE tbl_topics
    SET 
        module_id = COALESCE(p_module_id, module_id),
        title = COALESCE(p_title, title),
        description = COALESCE(p_description, description),
        content_type = COALESCE(p_content_type, content_type),
        sequence_no = COALESCE(p_sequence_no, sequence_no),
        topic_duration = COALESCE(p_topic_duration, topic_duration),
        extra_duration = COALESCE(p_extra_duration, extra_duration),
        total_duration = COALESCE(p_total_duration, total_duration),
        updated_by = p_updated_by,
        updated_by_type = p_updated_by_type,
        languages = COALESCE(p_languages, languages)
    WHERE id = v_topic_id;
    
    -- Handle different content types
    IF p_content IS NOT NULL AND JSON_VALID(p_content) THEN
        IF p_content_type = 'video' THEN
            CALL UpdateVideoContent(v_topic_id, p_content, p_files, p_updated_by , p_updated_by_type);
        ELSEIF p_content_type = 'audio' THEN
            CALL UpdateAudioContent(v_topic_id, p_content, p_files, p_updated_by, p_updated_by_type);
        ELSEIF p_content_type = 'accordian' THEN
            CALL UpdateAccordionContent(v_topic_id, p_content, p_files, p_updated_by, p_updated_by_type);
        ELSEIF p_content_type = 'general' THEN
            CALL UpdateGeneralContent(v_topic_id, p_content, p_files, p_updated_by, p_updated_by_type);
        ELSEIF p_content_type = 'slide' THEN
            CALL UpdateSlideContent(v_topic_id, p_content, p_files, p_updated_by, p_updated_by_type);
        END IF;
    END IF;
    
    -- Clean up old content type data if content type changed
    IF p_content_type IS NOT NULL AND p_content_type != v_old_content_type THEN
        IF v_old_content_type = 'video' THEN
            DELETE FROM tbl_videos WHERE topic_id = v_topic_id;
        ELSEIF v_old_content_type = 'audio' THEN
            DELETE FROM tbl_audios WHERE topic_id = v_topic_id;
        ELSEIF v_old_content_type = 'accordian' THEN
            DELETE FROM tbl_accordions WHERE topic_id = v_topic_id;
        ELSEIF v_old_content_type = 'general' THEN
            DELETE FROM tbl_general_materials WHERE topic_id = v_topic_id;
        ELSEIF v_old_content_type = 'slide' THEN
            -- Delete all slide-related data
            DELETE FROM tbl_multi_slides_video WHERE multi_slide_id IN (SELECT id FROM tbl_multi_slides WHERE topic_id = v_topic_id);
            -- DELETE FROM tbl_multi_slides_audio WHERE multi_slide_id IN (SELECT id FROM tbl_multi_slides WHERE topic_id = v_topic_id);
            -- DELETE FROM tbl_multi_slides_general WHERE multi_slide_id IN (SELECT id FROM tbl_multi_slides WHERE topic_id = v_topic_id);
            DELETE FROM tbl_multislide_accordion_attachments WHERE accordionId IN (SELECT id FROM tbl_multislide_accordions WHERE multi_slide_id IN (SELECT id FROM tbl_multi_slides WHERE topic_id = v_topic_id));
            DELETE FROM tbl_multislide_accordions WHERE multi_slide_id IN (SELECT id FROM tbl_multi_slides WHERE topic_id = v_topic_id);
            DELETE FROM tbl_multi_slides WHERE topic_id = v_topic_id;
        END IF;
    END IF;
    
    IF tags IS NOT NULL AND JSON_VALID(tags) THEN
        CALL UpdateTopicTags(v_topic_id, tags, p_files, p_updated_by);
    END IF;

    IF p_materials IS NOT NULL AND JSON_TYPE(p_materials) = 'ARRAY' THEN
        CALL UpdateTopicMaterials(v_topic_id, p_materials, p_updated_by, p_updated_by_type);
    END IF;

    -- COMMIT;

    SELECT 'Topic updated successfully' AS message;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS UpdateVideoContent`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateVideoContent(
    IN p_topic_id INT,
    IN p_content JSON,
    IN p_files JSON,
    IN p_updated_by INT,
    IN p_updated_by_type VARCHAR(20)
)
BEGIN
    DECLARE v_video_id INT;
    DECLARE v_video_url VARCHAR(255);
    DECLARE v_audio_url VARCHAR(255);
    DECLARE v_duration DECIMAL(6,2);
    DECLARE v_video_type VARCHAR(50);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|UpdateFailedError|Error updating video content';
    END;
    
    -- Extract values from JSON - use NULLIF to handle 'null' string values
    SET v_duration = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(p_content, '$.duration_minutes'), 'null')), 'null');
    
    -- Get video type from content
    SET v_video_type = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(p_content, '$.video_type'), 'null')), 'null');
    
    -- Get video URL from content directly without modifying it
    -- This matches CreateVideoContent behavior when URL comes from content
    SET v_video_url = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(p_content, '$.videoUrl'), 'null')), 'null');

    -- Check if video exists and get its current properties
    SELECT id, url, audio_url, video_type INTO v_video_id, v_video_url, v_audio_url, @current_video_type
    FROM tbl_videos
    WHERE topic_id = p_topic_id;
    
    -- If a video exists and has a type, don't allow changing between internal and YouTube
    IF v_video_id IS NOT NULL AND @current_video_type IS NOT NULL AND v_video_type IS NOT NULL THEN
        IF (@current_video_type = 'youtube' AND v_video_type != 'youtube') OR 
           (@current_video_type != 'youtube' AND v_video_type = 'youtube') THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|ValidationError|Cannot change video type between internal and YouTube';
        END IF;
        
        -- Keep the existing video type if it exists
        SET v_video_type = @current_video_type;
    END IF;
    
    -- Handle file URLs
    IF p_files IS NOT NULL AND JSON_VALID(p_files) THEN
        -- Handle case where video_type might be included in p_files (set it first)
        IF JSON_EXTRACT(p_files, '$.video_type') IS NOT NULL AND JSON_EXTRACT(p_files, '$.video_type') != 'null' THEN
            SET v_video_type = JSON_UNQUOTE(JSON_EXTRACT(p_files, '$.video_type'));
        END IF;
        
        IF JSON_EXTRACT(p_files, '$.videoUrl') IS NOT NULL AND JSON_EXTRACT(p_files, '$.videoUrl') != 'null' THEN
            -- Check if this is a YouTube URL or an uploaded file
            IF v_video_type = 'youtube' THEN
                -- For YouTube videos, use the URL as-is without prefix
                SET v_video_url = JSON_UNQUOTE(JSON_EXTRACT(p_files, '$.videoUrl'));
            ELSE
                -- For uploaded videos, add the prefix
                SET v_video_url = CONCAT('/video/', JSON_UNQUOTE(JSON_EXTRACT(p_files, '$.videoUrl')));
            END IF;
        END IF;
        
        IF JSON_EXTRACT(p_files, '$.videoAudioUrl') IS NOT NULL AND JSON_EXTRACT(p_files, '$.videoAudioUrl') != 'null' THEN
            SET v_audio_url = CONCAT('/audios/video/', JSON_UNQUOTE(JSON_EXTRACT(p_files, '$.videoAudioUrl')));
        END IF;
    END IF;
    
    IF v_video_id IS NOT NULL THEN
        -- Update existing video
        UPDATE tbl_videos
        SET 
            url = COALESCE(v_video_url, url),
            audio_url = COALESCE(v_audio_url, audio_url),
            duration_minutes = COALESCE(v_duration, duration_minutes),
            video_type = COALESCE(v_video_type, video_type), -- Ensure video_type is updated
            updated_by = p_updated_by,
            updated_by_type = p_updated_by_type
        WHERE id = v_video_id;
    ELSE
        -- Insert new video
        INSERT INTO tbl_videos (
            topic_id, 
            url, 
            audio_url, 
            duration_minutes,
            video_type, 
            created_by, 
            updated_by,
            created_by_type,
            updated_by_type
        ) VALUES (
            p_topic_id,
            v_video_url,
            v_audio_url,
            v_duration,
            v_video_type,
            p_updated_by,
            p_updated_by,
            p_updated_by_type,
            p_updated_by_type
        );
    END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS UpdateAudioContent`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateAudioContent(
    IN p_topic_id INT,
    IN p_content JSON,
    IN p_files JSON,
    IN p_updated_by INT,
    IN p_updated_by_type VARCHAR(255)
)
BEGIN
    DECLARE v_audio_id INT;
    DECLARE v_audio_url VARCHAR(255);
    DECLARE v_image_url VARCHAR(255);
    DECLARE v_duration DECIMAL(6,2);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|UpdateFailedError|Error updating audio content';
    END;

    -- Extract values from JSON
    SET v_duration = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(p_content, '$.duration_minutes'), 'null')), 'null');
    SET v_image_url = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(p_content, '$.image_url'), 'null')), 'null');

    -- Check if audio exists
    SELECT id, url INTO v_audio_id, v_audio_url
    FROM tbl_audios
    WHERE topic_id = p_topic_id;

    -- Handle file URL from files JSON
    IF p_files IS NOT NULL AND JSON_VALID(p_files) THEN
        IF JSON_EXTRACT(p_files, '$.audioUrl') IS NOT NULL AND JSON_EXTRACT(p_files, '$.audioUrl') != 'null' THEN
            SET v_audio_url = CONCAT('/audio/', JSON_UNQUOTE(JSON_EXTRACT(p_files, '$.audioUrl')));
        END IF;

        IF JSON_EXTRACT(p_files, '$.imageUrl') IS NOT NULL AND JSON_EXTRACT(p_files, '$.imageUrl') != 'null' THEN
            SET v_image_url = CONCAT('/audio/image/', JSON_UNQUOTE(JSON_EXTRACT(p_files, '$.imageUrl')));
        END IF;
    END IF;

    IF v_audio_id IS NOT NULL THEN
        -- Update existing audio
        UPDATE tbl_audios
        SET 
            url = COALESCE(v_audio_url, url),
            image_url = v_image_url,
            duration_minutes = COALESCE(v_duration, duration_minutes),
            updated_by = p_updated_by,
            updated_by_type = p_updated_by_type
        WHERE id = v_audio_id;
    ELSE
        -- Insert new audio
        INSERT INTO tbl_audios (
            topic_id,
            url,
            image_url,
            duration_minutes,
            created_by,
            updated_by,
            created_by_type,
            updated_by_type
        ) VALUES (
            p_topic_id,
            v_audio_url,
            v_image_url,
            v_duration,
            p_updated_by,
            p_updated_by,
            p_updated_by_type,
            p_updated_by_type
        );
    END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS UpdateGeneralContent`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateGeneralContent(
    IN p_topic_id INT,
    IN p_content JSON,
    IN p_files JSON,
    IN p_updated_by INT,
    IN p_updated_by_type VARCHAR(255)
)
BEGIN
    DECLARE v_general_id INT;
    DECLARE v_title VARCHAR(255);
    DECLARE v_description TEXT;
    DECLARE v_audio_url TEXT;
    DECLARE v_uploaded_filename VARCHAR(255);
    DECLARE v_uploaded_audio_filename VARCHAR(255);

    -- ✅ New declarations
    DECLARE v_completion_type VARCHAR(50);
    DECLARE v_completion_time INT;
    DECLARE v_duration_minutes DECIMAL(6,2);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|UpdateFailedError|Error updating general content';
    END;

    -- Extract values from JSON content
    SET v_title = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(p_content, '$.title'), 'null')), 'null');
    SET v_description = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(p_content, '$.description'), 'null')), 'null');

    -- ✅ Extract completion fields
    SET v_completion_type = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(p_content, '$.completion_type'), 'null')), 'null');
    SET v_completion_time = CAST(NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(p_content, '$.completion_time'), 'null')), 'null') AS SIGNED);
    SET v_duration_minutes = COALESCE(CAST(NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(p_content, '$.duration_minutes'), 'null')), 'null') AS DECIMAL(6,2)), 0.00);

    -- Handle URLs from p_files JSON
    IF p_files IS NOT NULL AND JSON_VALID(p_files) THEN
        SET v_uploaded_audio_filename = JSON_UNQUOTE(COALESCE(JSON_EXTRACT(p_files, '$.audio_url'), 'null'));

        IF v_uploaded_audio_filename IS NOT NULL AND v_uploaded_audio_filename != 'null' THEN
            SET v_audio_url = CONCAT('/audios/general/', v_uploaded_audio_filename);
        END IF;

    END IF;

    -- Check if general material already exists
    SELECT id INTO v_general_id
    FROM tbl_general_materials
    WHERE topic_id = p_topic_id;

    IF v_general_id IS NOT NULL THEN
        -- Update existing record
        UPDATE tbl_general_materials
        SET
            title = COALESCE(v_title, title),
            description = COALESCE(v_description, description),
            audio_url = COALESCE(v_audio_url, audio_url),
            completion_type = COALESCE(v_completion_type, completion_type), -- ✅ NEW
            completion_time = COALESCE(v_completion_time, completion_time), -- ✅ NEW
            duration_minutes = IF(COALESCE(v_completion_type, completion_type) = 'audio', COALESCE(v_duration_minutes, duration_minutes, 0.00), 0.00),
            updated_by = p_updated_by,
            updated_by_type = p_updated_by_type
        WHERE id = v_general_id;
    ELSE
        -- Insert new record
        INSERT INTO tbl_general_materials (
            topic_id,
            title,
            description,
            audio_url,
            completion_type, -- ✅ NEW
            completion_time, -- ✅ NEW
            duration_minutes,
            created_by,
            created_by_type,
            updated_by,
            updated_by_type
        ) VALUES (
            p_topic_id,
            v_title,
            v_description,
            v_audio_url,
            v_completion_type, -- ✅ NEW
            v_completion_time, -- ✅ NEW
            IF(COALESCE(v_completion_type, 'audio') = 'audio', COALESCE(v_duration_minutes, 0.00), 0.00),
            p_updated_by,
            p_updated_by_type,
            p_updated_by,
            p_updated_by_type
        );
    END IF;
END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS UpdateAccordionContent`);
        await sequelize.query(`CREATE PROCEDURE UpdateAccordionContent(
    IN p_topic_id INT,
    IN p_content JSON,
    IN p_files JSON,
    IN p_updated_by INT,
    IN p_updated_by_type VARCHAR(255)
)
BEGIN
    DECLARE v_section_count INT;
    DECLARE i INT DEFAULT 0;
    DECLARE v_section_data JSON;
    DECLARE v_section_id INT;
    DECLARE v_title VARCHAR(255);
    DECLARE v_body TEXT;
    DECLARE v_code_language VARCHAR(50);
    DECLARE v_code TEXT;
    DECLARE v_audio_url VARCHAR(255);
    DECLARE v_section_attachments JSON;
    DECLARE v_completion_type VARCHAR(20);
    DECLARE v_completion_time INT;
    DECLARE v_duration_minutes DECIMAL(6,2);
    DECLARE v_media_url JSON;
    DECLARE v_media_type VARCHAR(50);
    DECLARE v_media_path VARCHAR(255);
    DECLARE j INT DEFAULT 0;
    DECLARE v_media_count INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Temporary tables for tracking
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_existing_accordions (id INT);
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_valid_ids (id INT);
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_existing_media (id INT, fileType VARCHAR(50), fileUrl VARCHAR(255));
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_valid_media (id INT, fileType VARCHAR(50), fileUrl VARCHAR(255));

    -- Store existing accordions
    INSERT INTO temp_existing_accordions (id)
    SELECT id FROM tbl_accordions WHERE topic_id = p_topic_id;

    -- Store existing media
    INSERT INTO temp_existing_media (id, fileType, fileUrl)
    SELECT accordionId, fileType, fileUrl FROM tbl_accordion_attachments WHERE accordionId IN (SELECT id FROM tbl_accordions WHERE topic_id = p_topic_id);

    -- Count sections in JSON
    SET v_section_count = JSON_LENGTH(p_content);

    -- Loop through JSON content
    WHILE i < v_section_count DO
        SET v_section_data = JSON_EXTRACT(p_content, CONCAT('$[', i, ']'));
        SET v_section_id = JSON_UNQUOTE(JSON_EXTRACT(v_section_data, '$.id'));
        SET v_title = JSON_UNQUOTE(JSON_EXTRACT(v_section_data, '$.title'));
        SET v_body = JSON_UNQUOTE(JSON_EXTRACT(v_section_data, '$.body'));
        SET v_code_language = JSON_UNQUOTE(JSON_EXTRACT(v_section_data, '$.codeLanguage'));
        SET v_code = JSON_UNQUOTE(JSON_EXTRACT(v_section_data, '$.code'));
        SET v_section_attachments = JSON_EXTRACT(v_section_data, '$.mediaUrl');
        SET v_completion_type = JSON_UNQUOTE(JSON_EXTRACT(v_section_data, '$.accordianCompletionType'));
        SET v_completion_time = JSON_UNQUOTE(JSON_EXTRACT(v_section_data, '$.accordianCompletionTime'));
        SET v_duration_minutes = COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_section_data, '$.accordianAudioDuration')), 'null'), 0.00);

        -- Handle audio URL
        SET v_audio_url = NULL;
        IF p_files IS NOT NULL AND JSON_VALID(p_files) THEN
            IF JSON_UNQUOTE(JSON_EXTRACT(p_files, CONCAT('$.accordionAudioUrls[', i, ']'))) IS NOT NULL AND
               JSON_UNQUOTE(JSON_EXTRACT(p_files, CONCAT('$.accordionAudioUrls[', i, ']'))) != 'null' THEN
                SET v_audio_url = CONCAT('/audios/accordion/', JSON_UNQUOTE(JSON_EXTRACT(p_files, CONCAT('$.accordionAudioUrls[', i, ']'))));
            END IF;
        END IF;

        -- Track valid section ID
        IF v_section_id IS NOT NULL THEN
            INSERT INTO temp_valid_ids (id) VALUES (v_section_id);
        END IF;

        -- If section exists, update
        IF v_section_id IS NOT NULL AND EXISTS (SELECT 1 FROM temp_existing_accordions WHERE id = v_section_id) THEN
            UPDATE tbl_accordions
            SET
                title = COALESCE(v_title, title),
                body = COALESCE(v_body, body),
                audio_url = COALESCE(v_audio_url, audio_url),
                audio_url = IF(v_completion_type = 'audio', COALESCE(v_audio_url, audio_url), NULL),
                codeLanguage = COALESCE(v_code_language, codeLanguage),
                code = COALESCE(v_code, code),
                completion_type = COALESCE(v_completion_type, completion_type),
                completion_time = COALESCE(v_completion_time, completion_time),
                duration_minutes = IF(COALESCE(v_completion_type, completion_type) = 'audio', COALESCE(v_duration_minutes, duration_minutes, 0.00), 0.00),
                updated_by = p_updated_by,
                updated_by_type = p_updated_by_type
            WHERE id = v_section_id;

            -- Handle media URLs
            IF v_section_attachments IS NOT NULL THEN
                SET v_media_count = JSON_LENGTH(v_section_attachments);
                SET j = 0;
                WHILE j < v_media_count DO
                    SET v_media_url = JSON_EXTRACT(v_section_attachments, CONCAT('$[', j, ']'));
                    SET v_media_type = JSON_UNQUOTE(JSON_EXTRACT(v_media_url, '$.fileType'));
                    SET v_media_path = JSON_UNQUOTE(JSON_EXTRACT(v_media_url, '$.url'));

                    -- Case 1: url is not empty → keep existing (insert if not exists)
                    IF v_media_path IS NOT NULL AND v_media_path <> '' THEN
                        INSERT INTO tbl_accordion_attachments (accordionId, fileUrl, fileType, created_at, updated_at)
                        VALUES (v_section_id, v_media_path, v_media_type, NOW(), NOW())
                        ON DUPLICATE KEY UPDATE fileUrl = VALUES(fileUrl), updated_at = NOW();

                    -- Case 2: url is empty → check p_files
                    ELSEIF v_media_path = '' THEN
                        IF p_files IS NOT NULL AND JSON_VALID(p_files) 
                        AND JSON_EXTRACT(p_files, CONCAT('$.accordionAttachments[', i, '][', j, '].filename')) IS NOT NULL THEN

                            INSERT INTO tbl_accordion_attachments (accordionId, fileUrl, fileType, created_at, updated_at)
                            VALUES (
                                v_section_id,
                                CONCAT('/accordion/attachments/', JSON_UNQUOTE(JSON_EXTRACT(p_files, CONCAT('$.accordionAttachments[', i, '][', j, '].filename')))),
                                v_media_type,
                                NOW(),
                                NOW()
                            )
                            ON DUPLICATE KEY UPDATE fileUrl = VALUES(fileUrl), updated_at = NOW();
                        ELSE
                            -- No url and no file → delete attachment of this type
                            DELETE FROM tbl_accordion_attachments
                            WHERE accordionId = v_section_id AND fileType = v_media_type;
                        END IF;

                    -- Case 3: url is NULL → maybe check p_files
                    ELSEIF v_media_path IS NULL THEN
                        IF p_files IS NOT NULL AND JSON_VALID(p_files) 
                        AND JSON_EXTRACT(p_files, CONCAT('$.accordionAttachments[', i, '][', j, '].filename')) IS NOT NULL THEN
                            INSERT INTO tbl_accordion_attachments (accordionId, fileUrl, fileType, created_at, updated_at)
                            VALUES (
                                v_section_id,
                                CONCAT('/accordion/attachments/', JSON_UNQUOTE(JSON_EXTRACT(p_files, CONCAT('$.accordionAttachments[', i, '][', j, '].filename')))),
                                v_media_type,
                                NOW(),
                                NOW()
                            )
                            ON DUPLICATE KEY UPDATE fileUrl = VALUES(fileUrl), updated_at = NOW();
                        END IF;
                    END IF;

                    -- Mark media as valid
                    INSERT INTO temp_valid_media (id, fileType) VALUES (v_section_id, v_media_type);

                    SET j = j + 1;
                END WHILE;
            END IF;
        ELSE
            -- Insert new accordion
            INSERT INTO tbl_accordions (
                topic_id,
                title,
                body,
                audio_url,
                codeLanguage,
                code,
                completion_type,
                completion_time,
                duration_minutes,
                created_by,
                updated_by,
                created_by_type,
                updated_by_type,
                created_at,
                updated_at
            ) VALUES (
                p_topic_id,
                v_title,
                v_body,
                v_audio_url,
                v_code_language,
                v_code,
                v_completion_type,
                v_completion_time,
                IF(v_completion_type = 'audio', COALESCE(v_duration_minutes, 0.00), 0.00),
                p_updated_by,
                p_updated_by,
                p_updated_by_type,
                p_updated_by_type,
                NOW(),
                NOW()
            );

            -- Capture the new ID and store in valid IDs
            SET v_section_id = LAST_INSERT_ID();
            INSERT INTO temp_valid_ids (id) VALUES (v_section_id);

            -- Handle media URLs for new section
            IF v_section_attachments IS NOT NULL THEN
                SET v_media_count = JSON_LENGTH(v_section_attachments);
                SET j = 0;
                WHILE j < v_media_count DO
                    SET v_media_url = JSON_EXTRACT(v_section_attachments, CONCAT('$[', j, ']'));
                    SET v_media_type = JSON_UNQUOTE(JSON_EXTRACT(v_media_url, '$.fileType'));
                    SET v_media_path = JSON_UNQUOTE(JSON_EXTRACT(v_media_url, '$.url'));

                    IF v_media_path IS NULL OR v_media_path = '' THEN
                        IF p_files IS NOT NULL AND JSON_VALID(p_files) 
                        AND JSON_EXTRACT(p_files, CONCAT('$.accordionAttachments[', i, '][', j, '].filename')) IS NOT NULL THEN
                            INSERT INTO tbl_accordion_attachments (accordionId, fileUrl, fileType, created_at, updated_at)
                            VALUES (
                                v_section_id,
                                CONCAT('/accordion/attachments/', JSON_UNQUOTE(JSON_EXTRACT(p_files, CONCAT('$.accordionAttachments[', i, '][', j, '].filename')))),
                                v_media_type,
                                NOW(),
                                NOW()
                            );
                        END IF;
                    ELSE
                        -- Insert media
                        INSERT INTO tbl_accordion_attachments (accordionId, fileUrl, fileType, created_at, updated_at)
                        VALUES (v_section_id, v_media_path, v_media_type, NOW(), NOW());
                    END IF;

                    -- Mark media as valid
                    INSERT INTO temp_valid_media (id, fileType) VALUES (v_section_id, v_media_type);

                    SET j = j + 1;
                END WHILE;
            END IF;
        END IF;

        -- Delete old media not present in new list for this accordion only
        DELETE FROM tbl_accordion_attachments
        WHERE accordionId = v_section_id
        AND fileType NOT IN (
            SELECT fileType FROM temp_valid_media WHERE id = v_section_id
        );

        SET i = i + 1;
    END WHILE;

    -- Delete old accordions not present in new list
    DELETE FROM tbl_accordions
    WHERE topic_id = p_topic_id
      AND id NOT IN (SELECT id FROM temp_valid_ids);

    -- Cleanup
    DROP TEMPORARY TABLE IF EXISTS temp_existing_accordions;
    DROP TEMPORARY TABLE IF EXISTS temp_valid_ids;
    DROP TEMPORARY TABLE IF EXISTS temp_existing_media;
    DROP TEMPORARY TABLE IF EXISTS temp_valid_media;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS InsertAccordionAttachments`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS InsertAccordionAttachments(
    IN p_section_attachments JSON,
    IN p_accordion_id INT,
    IN p_i INT,
    IN p_files JSON
)
BEGIN
    DECLARE v_outer_count INT;
    DECLARE v_inner_count INT;
    DECLARE i INT DEFAULT 0;
    DECLARE j INT DEFAULT 0;

    DECLARE v_file_data JSON;
    DECLARE v_file_path VARCHAR(255);
    DECLARE v_mimetype VARCHAR(100);
    DECLARE v_file_type ENUM('video', 'audio', 'document');
    DECLARE v_existing_attachment_count INT;
    proc: BEGIN
        -- Exit if files are invalid
        IF p_files IS NULL OR NOT JSON_VALID(p_files) THEN
            LEAVE proc;
        END IF;

            SET v_inner_count = JSON_LENGTH(JSON_EXTRACT(p_files, CONCAT('$.accordionAttachments[', p_i, ']')));
            SET j = 0;


            inner_loop: WHILE j < v_inner_count DO
                SET v_file_data = JSON_EXTRACT(p_files, CONCAT('$.accordionAttachments[', p_i, '][', j, ']'));

                -- Skip nulls
                IF v_file_data IS NULL OR v_file_data = 'null' THEN
                    SET j = j + 1;
                    ITERATE inner_loop;
                END IF;

                SET v_mimetype = JSON_UNQUOTE(JSON_EXTRACT(v_file_data, '$.mimetype'));
                SET v_file_path = CONCAT('/accordion/attachments/', JSON_UNQUOTE(JSON_EXTRACT(v_file_data, '$.filename')));

                -- Determine fileType
                IF v_mimetype LIKE 'video/%' THEN
                    SET v_file_type = 'video';
                ELSEIF v_mimetype LIKE 'audio/%' THEN
                    SET v_file_type = 'audio';
                ELSE
                    SET v_file_type = 'document';
                END IF;

                -- Check existing
                SELECT COUNT(*) INTO v_existing_attachment_count
                FROM tbl_accordion_attachments
                WHERE accordionId = p_accordion_id AND fileType = v_file_type;

                IF v_existing_attachment_count > 0 THEN

                    UPDATE tbl_accordion_attachments
                    SET fileUrl = v_file_path,
                        updated_at = NOW()
                    WHERE accordionId = p_accordion_id AND fileType = v_file_type;
                ELSE
                    INSERT INTO tbl_accordion_attachments (
                        accordionId,
                        fileUrl,
                        fileType,
                        created_at,
                        updated_at
                    ) VALUES (
                        p_accordion_id,
                        v_file_path,
                        v_file_type,
                        NOW(),
                        NOW()
                    );
                END IF;

                SET j = j + 1;
            END WHILE;

        -- Cleanup unused types
        IF JSON_CONTAINS(p_section_attachments, '{"fileType": "video"}') = 0 THEN
            DELETE FROM tbl_accordion_attachments
            WHERE accordionId = p_accordion_id AND fileType = 'video';
        END IF;

        IF JSON_CONTAINS(p_section_attachments, '{"fileType": "audio"}') = 0 THEN
            DELETE FROM tbl_accordion_attachments
            WHERE accordionId = p_accordion_id AND fileType = 'audio';
        END IF;

        IF JSON_CONTAINS(p_section_attachments, '{"fileType": "document"}') = 0 THEN
            DELETE FROM tbl_accordion_attachments
            WHERE accordionId = p_accordion_id AND fileType = 'document';
        END IF;

    END proc;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS UpdateSlideContent`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateSlideContent(
    IN p_topic_id INT,
    IN p_content JSON,
    IN p_files JSON,
    IN p_updated_by INT,
    IN p_updated_by_type VARCHAR(20)
)
BEGIN
    DECLARE v_slide_count INT;
    DECLARE i INT DEFAULT 0;
    DECLARE v_slide_data JSON;
    DECLARE v_slide_id INT;
    DECLARE v_slide_title VARCHAR(255);
    DECLARE v_slide_type VARCHAR(50);
    DECLARE v_description TEXT;
    DECLARE v_completion_type VARCHAR(10);
    DECLARE v_completion_time INT;
    DECLARE v_sequence_no INT;
    DECLARE v_audio_url VARCHAR(255);
    DECLARE v_slide_index VARCHAR(10);
    DECLARE v_slide_duration DECIMAL(10,2);
    DECLARE v_slide_extra_duration DECIMAL(10,2);
    DECLARE v_total_slide_duration DECIMAL(10,2);

    DECLARE v_slide_materials JSON;
    DECLARE v_material_count INT;
    DECLARE k INT DEFAULT 0;
    DECLARE v_material_item JSON;
    DECLARE v_mat_id INT;
    DECLARE v_mat_type VARCHAR(50);
    DECLARE v_mat_url VARCHAR(255);
    DECLARE v_mat_code TEXT;
    DECLARE v_mat_codeLanguage VARCHAR(50);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        DROP TEMPORARY TABLE IF EXISTS temp_existing_slides;
        DROP TEMPORARY TABLE IF EXISTS temp_valid_slide_ids;
    END;

    CREATE TEMPORARY TABLE IF NOT EXISTS temp_existing_slides (id INT);
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_valid_slide_ids (id INT);

    INSERT INTO temp_existing_slides (id)
    SELECT id FROM tbl_multi_slides WHERE topic_id = p_topic_id;

    SET v_slide_count = JSON_LENGTH(p_content);

    WHILE i < v_slide_count DO
        SET v_slide_data = JSON_EXTRACT(p_content, CONCAT('$[', i, ']'));
        SET v_slide_id = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(v_slide_data, '$.id'), 'null')), 'null');
        SET v_slide_title = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(v_slide_data, '$.title'), 'null')), 'null');
        SET v_slide_type = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(v_slide_data, '$.content_type'), 'null')), 'null');
        SET v_description = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(v_slide_data, '$.description'), 'null')), 'null');
        SET v_completion_type = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(v_slide_data, '$.slideCompletionType'), 'audio')), 'null');
        SET v_sequence_no = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(v_slide_data, '$.sequence_no'), 'null')), 'null');
        SET v_slide_index = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(v_slide_data, '$.index'), 'null')), 'null');
        SET v_slide_duration = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_slide_data, '$.slide_duration')), 'null');
        SET v_slide_extra_duration = COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_slide_data, '$.slide_extra_duration')), 'null'), 0.00);
        SET v_total_slide_duration = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_slide_data, '$.total_slide_duration')), 'null');

        IF v_slide_type = 'video' THEN
            SET v_completion_type = 'video';
        END IF;

        SET v_completion_time = NULLIF(JSON_EXTRACT(v_slide_data, '$.slideCompletionTime'), NULL);
        IF v_completion_time IS NOT NULL AND v_completion_type = 'timer' THEN
            SET v_completion_time = v_completion_time;
        ELSE
            SET v_completion_time = NULL;
        END IF;

        SET v_audio_url = NULL;
        IF v_completion_type = 'audio' THEN
            IF JSON_UNQUOTE(JSON_EXTRACT(p_files, CONCAT('$.slideAudioUrl[', v_slide_index, ']'))) IS NOT NULL AND
               JSON_UNQUOTE(JSON_EXTRACT(p_files, CONCAT('$.slideAudioUrl[', v_slide_index, ']'))) != 'null' THEN
                SET v_audio_url = CONCAT('/audios/multi_slide/', JSON_UNQUOTE(JSON_EXTRACT(p_files, CONCAT('$.slideAudioUrl[', v_slide_index, ']'))));
            END IF;
        END IF;

        -- UPDATE EXISTING SLIDE
        IF v_slide_id IS NOT NULL AND EXISTS (SELECT 1 FROM temp_existing_slides WHERE id = v_slide_id) THEN
            UPDATE tbl_multi_slides
            SET 
                title = COALESCE(v_slide_title, title),
                description = COALESCE(v_description, description),
                type = COALESCE(v_slide_type, type),
                completion_type = COALESCE(v_completion_type, completion_type),
                completion_time = IF(v_completion_type = 'timer', v_completion_time, NULL),
                audio_url = IF(v_completion_type = 'audio', COALESCE(v_audio_url, audio_url), NULL),
                sequence_no = COALESCE(v_sequence_no, sequence_no),
                slide_duration = COALESCE(v_slide_duration, slide_duration),
                slide_extra_duration = COALESCE(v_slide_extra_duration, slide_extra_duration),
                total_slide_duration = COALESCE(v_total_slide_duration, total_slide_duration),
                updated_by = p_updated_by,
                updated_by_type = p_updated_by_type,
                updated_at = NOW()
            WHERE id = v_slide_id;

            INSERT INTO temp_valid_slide_ids (id) VALUES (v_slide_id);

        ELSE
            -- INSERT NEW SLIDE
            INSERT INTO tbl_multi_slides (
                topic_id,
                title,
                description,
                type,
                completion_type,
                completion_time,
                audio_url,
                sequence_no,
                slide_duration,
                slide_extra_duration,
                total_slide_duration,
                created_by,
                created_by_type,
                updated_by,
                updated_by_type,
                created_at,
                updated_at
            ) VALUES (
                p_topic_id,
                v_slide_title,
                v_description,
                v_slide_type,
                COALESCE(v_completion_type, 'audio'),
                IF(v_completion_type = 'timer', v_completion_time, NULL),
                IF(v_completion_type = 'audio', v_audio_url, NULL),
                v_sequence_no,
                v_slide_duration,
                v_slide_extra_duration,
                v_total_slide_duration,
                p_updated_by,
                p_updated_by_type,
                p_updated_by,
                p_updated_by_type,
                NOW(),
                NOW()
            );

            SET v_slide_id = LAST_INSERT_ID();
            INSERT INTO temp_valid_slide_ids (id) VALUES (v_slide_id);
        END IF;

        -- ✅ MATERIALS LOOP (fixed)
        SET v_slide_materials = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(v_slide_data, '$.materials'), 'null')), 'null');

        -- Create temporary table to track current material IDs
        DROP TEMPORARY TABLE IF EXISTS temp_current_material_ids;
        CREATE TEMPORARY TABLE temp_current_material_ids (id INT);

        IF v_slide_materials IS NOT NULL THEN
            SET v_material_count = JSON_LENGTH(v_slide_materials);

            SET k = 0;

            WHILE k < v_material_count DO
                SET v_material_item = JSON_EXTRACT(v_slide_materials, CONCAT('$[', k, ']'));
                SET v_mat_id = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_material_item, '$.id')), 'null');
                SET v_mat_type = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_material_item, '$.material_type')), 'null');
                SET v_mat_url = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_material_item, '$.url')), 'null');
                SET v_mat_code = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_material_item, '$.code')), 'null');
                SET v_mat_codeLanguage = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(v_material_item, '$.codeLanguage')), 'null');

                IF v_mat_id IS NOT NULL THEN
                    UPDATE tbl_materials
                    SET
                        material_type = v_mat_type,
                        url = v_mat_url,
                        code = v_mat_code,
                        codeLanguage = v_mat_codeLanguage,
                        updated_by = p_updated_by,
                        updated_by_type = p_updated_by_type,
                        updated_at = NOW()
                    WHERE id = v_mat_id;

                    -- Track this material ID
                    INSERT INTO temp_current_material_ids (id) VALUES (v_mat_id);
                ELSE

                    INSERT INTO tbl_materials (
                        topic_id, slide_id, material_type, url, code, codeLanguage,
                        created_by, updated_by, created_by_type, updated_by_type, created_at, updated_at
                    )
                    VALUES (
                        p_topic_id,
                        v_slide_id,
                        COALESCE(v_mat_type, 'general'),
                        COALESCE(v_mat_url, ''),
                        COALESCE(v_mat_code, ''),
                        COALESCE(v_mat_codeLanguage, ''),
                        p_updated_by,
                        p_updated_by,
                        p_updated_by_type,
                        p_updated_by_type,
                        NOW(),
                        NOW()
                    );

                    -- Track the new material ID
                    SET v_mat_id = LAST_INSERT_ID();
                    INSERT INTO temp_current_material_ids (id) VALUES (v_mat_id);

                END IF;

                SET k = k + 1;
            END WHILE;

            -- Delete materials for this slide that are not in the current array
            DELETE FROM tbl_materials 
            WHERE slide_id = v_slide_id 
            AND id NOT IN (SELECT id FROM temp_current_material_ids);

        ELSE
            -- If no materials in array, delete all materials for this slide
            DELETE FROM tbl_materials WHERE slide_id = v_slide_id;
        END IF;

        -- CALL video/accordion updates
        IF v_slide_type = 'video' THEN
            CALL UpdateSlideVideoContent(v_slide_id, v_slide_data, p_files, i, p_updated_by, p_updated_by_type);
        ELSEIF v_slide_type = 'accordian' THEN
            CALL UpdateSlideAccordionContent(v_slide_id, v_slide_data, p_files, i, p_updated_by, p_updated_by_type);
        END IF;

        SET i = i + 1;
    END WHILE;

    -- DELETE OBSOLETE SLIDES & ATTACHMENTS
    DELETE FROM tbl_multi_slides_video 
    WHERE multi_slide_id IN (
        SELECT id FROM tbl_multi_slides WHERE topic_id = p_topic_id
        AND id NOT IN (SELECT id FROM temp_valid_slide_ids)
    );

    DELETE FROM tbl_multislide_accordion_attachments 
    WHERE accordionId IN (
        SELECT id FROM tbl_multislide_accordions WHERE multi_slide_id IN (
            SELECT id FROM tbl_multi_slides WHERE topic_id = p_topic_id
            AND id NOT IN (SELECT id FROM temp_valid_slide_ids)
        )
    );

    DELETE FROM tbl_multislide_accordions 
    WHERE multi_slide_id IN (
        SELECT id FROM tbl_multi_slides WHERE topic_id = p_topic_id
        AND id NOT IN (SELECT id FROM temp_valid_slide_ids)
    );

    DELETE FROM tbl_multi_slides 
    WHERE topic_id = p_topic_id
    AND id NOT IN (SELECT id FROM temp_valid_slide_ids);

    DROP TEMPORARY TABLE IF EXISTS temp_existing_slides;
    DROP TEMPORARY TABLE IF EXISTS temp_valid_slide_ids;
    -- Drop temporary table
    DROP TEMPORARY TABLE IF EXISTS temp_current_material_ids;

END;
`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS UpdateSlideVideoContent`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateSlideVideoContent(
    IN p_slide_id INT,
    IN p_slide_data JSON,
    IN p_files JSON,
    IN p_slide_index INT,
    IN p_updated_by INT,
    IN p_updated_by_type VARCHAR(20)
)
BEGIN
    DECLARE v_url VARCHAR(255);
    DECLARE v_duration_minutes DECIMAL(6,2);
    DECLARE v_existing_id INT;
    DECLARE v_type VARCHAR(255);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|UpdateFailedError|Error updating slide video content';
    END;
    
    SET v_type = NULL;
    -- Extract values from JSON
    SET v_url = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(p_slide_data, '$.videoUrl'), JSON_EXTRACT(p_slide_data, '$.url'), 'null')), 'null');
    SET v_duration_minutes = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(p_slide_data, '$.videoDuration'), 'null')), 'null');
    SET v_type = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(p_slide_data, '$.videoType'), 'null')), 'null');

    -- Handle file URLs from p_files JSON (if available)
    IF p_files IS NOT NULL AND JSON_VALID(p_files) THEN
        IF JSON_EXTRACT(p_files, CONCAT('$.slide_video_url[', p_slide_index, ']')) IS NOT NULL AND 
           JSON_UNQUOTE(JSON_EXTRACT(p_files, CONCAT('$.slide_video_url[', p_slide_index, ']'))) != 'null' THEN
            SET v_url = CONCAT('/multiSlide/video/', JSON_UNQUOTE(JSON_EXTRACT(p_files, CONCAT('$.slide_video_url[', p_slide_index, ']'))));
        END IF;
    END IF;
    
    -- Check if a record already exists for the slide
    SELECT id INTO v_existing_id
    FROM tbl_multi_slides_video
    WHERE multi_slide_id = p_slide_id;
    
    IF v_existing_id IS NOT NULL THEN
        -- Update existing slide video content
        UPDATE tbl_multi_slides_video
        SET 
            url = COALESCE(v_url, url),
            duration_minutes = COALESCE(v_duration_minutes, duration_minutes),
            type = COALESCE(v_type, type),
            updated_by = p_updated_by,
            updated_by_type = p_updated_by_type
        WHERE id = v_existing_id;
    ELSE
        -- Insert new slide video content
        INSERT INTO tbl_multi_slides_video (
            multi_slide_id,
            url,
            type,
            duration_minutes,
            created_by,
            updated_by,
            created_by_type,
            updated_by_type,
            created_at,
            updated_at
        ) VALUES (
            p_slide_id,
            v_url,
            COALESCE(v_type, 'internal'),
            v_duration_minutes,
            p_updated_by,
            p_updated_by,
            p_updated_by_type,
            p_updated_by_type,
            NOW(),
            NOW()
        );

    END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS UpdateSlideAudioContent`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateSlideAudioContent(
    IN p_slide_id INT,
    IN p_slide_data JSON,
    IN p_files JSON,
    IN p_slide_index INT,
    IN p_updated_by INT,
    IN p_updated_by_type VARCHAR(255)
)
BEGIN
    DECLARE v_url VARCHAR(255);
    DECLARE v_duration_minutes DECIMAL(6,2);
    DECLARE v_existing_id INT;
    DECLARE v_audio_file VARCHAR(255);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|UpdateFailedError|Error updating slide audio content';
    END;

    -- Extract values from JSON
    SET v_url = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(p_slide_data, '$.url'), 'null')), 'null');
    SET v_duration_minutes = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(p_slide_data, '$.audioDuration'), 'null')), 'null');

    IF p_files IS NOT NULL AND JSON_VALID(p_files) THEN
        IF JSON_EXTRACT(p_files, CONCAT('$.slide_audio_url[', p_slide_index, ']')) IS NOT NULL AND 
           JSON_EXTRACT(p_files, CONCAT('$.slide_audio_url[', p_slide_index, ']')) != 'null' THEN
            SET v_url = CONCAT('/multiSlide/audio/', JSON_UNQUOTE(JSON_EXTRACT(p_files, CONCAT('$.slide_audio_url[', p_slide_index, ']'))));
        END IF;
    END IF;

    -- Check if a record already exists for the slide
    SELECT id INTO v_existing_id
    FROM tbl_multi_slides_audio
    WHERE multi_slide_id = p_slide_id;

    IF v_existing_id IS NOT NULL THEN
        -- Update existing slide audio content
        UPDATE tbl_multi_slides_audio
        SET 
            url = COALESCE(v_url, url),
            duration_minutes = COALESCE(v_duration_minutes, duration_minutes),
            updated_by = p_updated_by,
            updated_by_type = p_updated_by_type
        WHERE id = v_existing_id;
    ELSE
        -- Insert new slide audio content
        INSERT INTO tbl_multi_slides_audio (
            multi_slide_id,
            url,
            duration_minutes,
            created_by,
            updated_by,
            created_by_type,
            updated_by_type,
            created_at,
            updated_at
        ) VALUES (
            p_slide_id,
            v_url,
            v_duration_minutes,
            p_updated_by,
            p_updated_by,
            p_updated_by_type,
            p_updated_by_type,
            NOW(),
            NOW()
        );
    END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS UpdateSlideAccordionContent`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateSlideAccordionContent(
    IN p_slide_id INT,
    IN p_slide_data JSON,
    IN p_files JSON,
    IN p_slide_index INT,
    IN p_updated_by INT,
    IN p_updated_by_type VARCHAR(255)
)
BEGIN
    DECLARE v_accordions_data JSON;
    DECLARE v_accordion_count INT;
    DECLARE i INT DEFAULT 0;
    DECLARE v_accordion_data JSON;
    DECLARE v_accordion_id INT;
    DECLARE v_title VARCHAR(255);
    DECLARE v_body TEXT;
    DECLARE v_code TEXT;
    DECLARE v_code_language VARCHAR(50);
    DECLARE v_attachments JSON;
    DECLARE v_file_type VARCHAR(50);
    DECLARE v_file_path VARCHAR(255);
    DECLARE v_youtube_url VARCHAR(255);


    proc: BEGIN

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        DROP TEMPORARY TABLE IF EXISTS temp_existing_accordions;
        DROP TEMPORARY TABLE IF EXISTS temp_valid_ids;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|UpdateFailedError|Error updating slide accordion content';
    END;

    CREATE TEMPORARY TABLE IF NOT EXISTS temp_existing_accordions (id INT);
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_valid_ids (id INT);

    SET v_accordions_data = JSON_EXTRACT(p_slide_data, '$.accordianSections');
    IF v_accordions_data IS NULL OR JSON_TYPE(v_accordions_data) != 'ARRAY' THEN
        DROP TEMPORARY TABLE IF EXISTS temp_existing_accordions;
        DROP TEMPORARY TABLE IF EXISTS temp_valid_ids;
        LEAVE proc;
    END IF;

    INSERT INTO temp_existing_accordions (id)
    SELECT id FROM tbl_multislide_accordions WHERE multi_slide_id = p_slide_id;

    SET v_accordion_count = JSON_LENGTH(v_accordions_data);

    WHILE i < v_accordion_count DO
        SET v_accordion_data = JSON_EXTRACT(v_accordions_data, CONCAT('$[', i, ']'));
        SET v_accordion_id = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(v_accordion_data, '$.id'), 'null')), 'null');
        SET v_title = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(v_accordion_data, '$.title'), 'null')), 'null');
        SET v_body = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(v_accordion_data, '$.body'), 'null')), 'null');
        SET v_code_language = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(v_accordion_data, '$.codeLanguage'), 'null')), 'null');
        SET v_code = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(v_accordion_data, '$.code'), 'null')), 'null');
        SET v_attachments = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(v_accordion_data, '$.mediaUrl'), 'null')), 'null');

        IF JSON_CONTAINS(v_attachments, '{"fileType": "youtube"}') THEN
            SET v_youtube_url = JSON_UNQUOTE(JSON_EXTRACT(v_attachments, '$.url'));
            SET v_file_type = 'youtube';
            SET v_file_path = v_youtube_url;
        ELSE
            -- Handle other types of attachments
            IF JSON_UNQUOTE(JSON_EXTRACT(v_attachments, '$.fileType')) = 'video' THEN
                SET v_file_type = 'video';
                SET v_file_path = CONCAT('/multislide/accordion/attachments/', JSON_UNQUOTE(JSON_EXTRACT(v_attachments, '$.filename')));
            ELSEIF JSON_UNQUOTE(JSON_EXTRACT(v_attachments, '$.fileType')) = 'audio' THEN
                SET v_file_type = 'audio';
                SET v_file_path = CONCAT('/multislide/accordion/attachments/', JSON_UNQUOTE(JSON_EXTRACT(v_attachments, '$.filename')));
            ELSE
                SET v_file_type = 'document';
                SET v_file_path = CONCAT('/multislide/accordion/attachments/', JSON_UNQUOTE(JSON_EXTRACT(v_attachments, '$.filename')));
            END IF;
        END IF;

        -- Store valid IDs
        IF v_accordion_id IS NOT NULL THEN
            INSERT INTO temp_valid_ids (id) VALUES (v_accordion_id);
        END IF;

        -- Update or Insert
        IF v_accordion_id IS NOT NULL AND EXISTS (SELECT 1 FROM temp_existing_accordions WHERE id = v_accordion_id) THEN
            UPDATE tbl_multislide_accordions
            SET 
                title = COALESCE(v_title, title),
                body = COALESCE(v_body, body),
                codeLanguage = COALESCE(v_code_language, codeLanguage),
                code = COALESCE(v_code, code),
                updated_by = p_updated_by,
                updated_by_type = p_updated_by_type
            WHERE id = v_accordion_id;

            CALL InsertSlideAccordionAttachments(v_attachments, v_accordion_id, p_slide_index, i, p_files);

        ELSE
            INSERT INTO tbl_multislide_accordions (
                multi_slide_id, title, body, codeLanguage, code, created_by, updated_by, created_at, updated_at , created_by_type, updated_by_type 
            ) VALUES (
                p_slide_id, v_title, v_body, v_code_language, v_code, p_updated_by, p_updated_by, NOW(), NOW() ,p_updated_by_type,p_updated_by_type
            );

            SET v_accordion_id = LAST_INSERT_ID();
            INSERT INTO temp_valid_ids (id) VALUES (v_accordion_id);

            CALL InsertSlideAccordionAttachments(v_attachments, v_accordion_id, p_slide_index, i, p_files);

        END IF;

        SET i = i + 1;
    END WHILE;

    DELETE FROM tbl_multislide_accordions
    WHERE multi_slide_id = p_slide_id
    AND id NOT IN (SELECT id FROM temp_valid_ids);

    DROP TEMPORARY TABLE IF EXISTS temp_existing_accordions;
    DROP TEMPORARY TABLE IF EXISTS temp_valid_ids;

    END proc;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS InsertSlideAccordionAttachments`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS InsertSlideAccordionAttachments(
    IN p_attachments JSON,
    IN p_accordion_id INT,
    IN p_slide_index INT,
    IN p_accordion_index INT,
    IN p_files JSON
)
BEGIN
    DECLARE v_inner_count INT;
    DECLARE v_media_count INT DEFAULT 0;
    DECLARE j INT DEFAULT 0;
    DECLARE v_file_data JSON;
    DECLARE v_file_path VARCHAR(255);
    DECLARE v_mimetype VARCHAR(100);
    DECLARE v_file_type ENUM('video', 'audio', 'document', 'youtube');
    DECLARE v_existing_count INT;

    DECLARE v_media_obj JSON;
    DECLARE v_media_path VARCHAR(255);
    DECLARE v_media_type VARCHAR(100);

    DECLARE v_has_video INT DEFAULT 0;
    DECLARE v_has_audio INT DEFAULT 0;
    DECLARE v_has_document INT DEFAULT 0;

    proc: BEGIN

        -- counters
        SET v_media_count = JSON_LENGTH(p_attachments);
        SET j = 0;

        media_loop: WHILE j < v_media_count DO
            -- extract media object
            SET v_media_obj = JSON_EXTRACT(p_attachments, CONCAT('$[', j, ']'));
            SET v_media_type = JSON_UNQUOTE(JSON_EXTRACT(v_media_obj, '$.fileType'));
            SET v_media_path = JSON_UNQUOTE(JSON_EXTRACT(v_media_obj, '$.url'));

            -- only consider if url is not null/empty
            IF v_media_path IS NOT NULL AND v_media_path <> '' THEN
                IF v_media_type = 'video' THEN
                    SET v_has_video = 1;
                ELSEIF v_media_type = 'audio' THEN
                    SET v_has_audio = 1;
                ELSEIF v_media_type = 'document' THEN
                    SET v_has_document = 1;
                END IF;
            END IF;

            SET j = j + 1;
        END WHILE media_loop;

        -- Extract fileTypes from uploaded files
        IF p_files IS NOT NULL AND JSON_VALID(p_files) THEN
            SET j = 0;
            SET v_inner_count = JSON_LENGTH(JSON_EXTRACT(p_files, CONCAT('$.slideAccordionAttachments[', p_slide_index, '][', p_accordion_index, ']')));
            proc_loop: WHILE j < v_inner_count DO
                SET v_file_data = JSON_EXTRACT(p_files, CONCAT('$.slideAccordionAttachments[', p_slide_index, '][', p_accordion_index, '][', j, ']'));

                IF v_file_data IS NULL OR LOWER(v_file_data) = 'null' THEN
                    SET j = j + 1;
                    ITERATE proc_loop;
                END IF;

                SET v_mimetype = JSON_UNQUOTE(JSON_EXTRACT(v_file_data, '$.mimetype'));
                SET v_file_path = CONCAT('/multislide/accordion/attachments/', JSON_UNQUOTE(JSON_EXTRACT(v_file_data, '$.filename')));
                                
                IF v_mimetype LIKE 'video/%' THEN
                    SET v_file_type = 'video';
                    SET v_has_video = 1;
                ELSEIF v_mimetype LIKE 'audio/%' THEN
                    SET v_file_type = 'audio';
                    SET v_has_audio = 1;
                ELSE
                    SET v_file_type = 'document';
                    SET v_has_document = 1;
                END IF;

                SELECT COUNT(*) INTO v_existing_count
                FROM tbl_multislide_accordion_attachments
                WHERE accordionId = p_accordion_id AND fileType = v_file_type;

                IF v_existing_count > 0 THEN
                    UPDATE tbl_multislide_accordion_attachments
                    SET fileUrl = v_file_path, updated_at = NOW()
                    WHERE accordionId = p_accordion_id AND fileType = v_file_type;
                ELSE
                    INSERT INTO tbl_multislide_accordion_attachments (accordionId, fileUrl, fileType, created_at, updated_at)
                    VALUES (p_accordion_id, v_file_path, v_file_type, NOW(), NOW());
                END IF;

                SET j = j + 1;
            END WHILE;
        END IF;

        -- Extract YouTube or static video/audio/document from mediaUrl
        IF JSON_VALID(p_attachments) THEN
            IF JSON_CONTAINS(p_attachments, '{"fileType": "youtube"}') THEN
                SET v_file_type = 'youtube';
                -- SET v_file_path = JSON_UNQUOTE(JSON_EXTRACT(p_attachments, '$[0].url')); -- assuming single youtube
                SELECT jt.url INTO v_file_path
                    FROM JSON_TABLE(
                        p_attachments,
                        '$[*]' COLUMNS (
                            url VARCHAR(255) PATH '$.url',
                            fileType VARCHAR(50) PATH '$.fileType'
                        )
                    ) AS jt
                    WHERE jt.fileType = 'youtube'
                    LIMIT 1;
                SET v_has_video = 1;

                SELECT COUNT(*) INTO v_existing_count
                FROM tbl_multislide_accordion_attachments
                WHERE accordionId = p_accordion_id AND fileType = 'youtube';

                IF v_existing_count > 0 THEN
                    UPDATE tbl_multislide_accordion_attachments
                    SET fileUrl = v_file_path, updated_at = NOW()
                    WHERE accordionId = p_accordion_id AND fileType = 'youtube';
                ELSE
                    INSERT INTO tbl_multislide_accordion_attachments (accordionId, fileUrl, fileType, created_at, updated_at)
                    VALUES (p_accordion_id, v_file_path, 'youtube', NOW(), NOW());
                END IF;
            END IF;
        END IF;

        -- Clean up old file types no longer present
        IF v_has_video = 0 THEN
            DELETE FROM tbl_multislide_accordion_attachments
            WHERE accordionId = p_accordion_id AND fileType IN ('video', 'youtube');
        END IF;

        IF v_has_audio = 0 THEN
            DELETE FROM tbl_multislide_accordion_attachments
            WHERE accordionId = p_accordion_id AND fileType = 'audio';
        END IF;

        IF v_has_document = 0 THEN
            DELETE FROM tbl_multislide_accordion_attachments
            WHERE accordionId = p_accordion_id AND fileType = 'document';
        END IF;

    END proc;
END;
`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS UpdateSlideGeneralContent`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateSlideGeneralContent(
    IN p_slide_id INT,
    IN p_slide_data JSON,
    IN p_files JSON,
    IN p_slide_index INT,
    IN p_updated_by INT,
    IN p_updated_by_type VARCHAR(20)
)
BEGIN
    DECLARE v_code TEXT;
    DECLARE v_code_language VARCHAR(50);
    DECLARE v_existing_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|UpdateFailedError|Error updating slide general content';
    END;

    -- Extract values from p_slide_data
    SET v_code = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(p_slide_data, '$.code'), 'null')), 'null');
    SET v_code_language = NULLIF(JSON_UNQUOTE(COALESCE(JSON_EXTRACT(p_slide_data, '$.codeLanguage'), 'null')), 'null');
    
    -- Check if entry already exists
        SELECT id INTO v_existing_id
        FROM tbl_multi_slides_general
        WHERE multi_slide_id = p_slide_id
        LIMIT 1;
    IF v_existing_id IS NOT NULL THEN
        UPDATE tbl_multi_slides_general
        SET 
            code = COALESCE(v_code, code),
            codeLanguage = COALESCE(v_code_language, codeLanguage),
            updated_by = p_updated_by,
            updated_by_type = p_updated_by_type,
            updated_at = NOW()
        WHERE id = v_existing_id;
        
    ELSE
        INSERT INTO tbl_multi_slides_general (
            multi_slide_id,
            code, codeLanguage, created_by, updated_by,
            created_by_type, updated_by_type, created_at, updated_at
        ) VALUES (
            p_slide_id,
            v_code, v_code_language, p_updated_by, p_updated_by,
            p_updated_by_type, p_updated_by_type, NOW(), NOW()
        );
        SET v_existing_id = LAST_INSERT_ID();
    END IF;    
END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS GetTopicsByModuleId`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetTopicsByModuleId(IN p_module_hash VARCHAR(255))
BEGIN
DECLARE v_module_id INT;

-- Get the actual module ID from the public hash
SELECT id INTO v_module_id
FROM tbl_modules
WHERE public_hash = p_module_hash;

-- Check if module exists
IF v_module_id IS NULL THEN
    SELECT 'Module not found' AS message;
ELSE
    -- Return all topics with their related data
    SELECT t.*,
           -- Video data
           v.id AS 'Video.id',
           v.topic_id AS 'Video.topic_id',
           v.url AS 'Video.url',
           v.duration_minutes AS 'Video.duration_minutes',
           v.video_type AS 'Video.video_type',
           v.created_by AS 'Video.created_by',
           v.created_by_type AS 'Video.created_by_type',
           v.updated_by AS 'Video.updated_by',
           v.updated_by_type AS 'Video.updated_by_type',
           v.created_at AS 'Video.created_at',
           v.updated_at AS 'Video.updated_at',
           
           -- Audio data
           a.id AS 'Audio.id',
           a.topic_id AS 'Audio.topic_id',
           a.url AS 'Audio.url',
           a.image_url AS 'Audio.image_url',
           a.duration_minutes AS 'Audio.duration_minutes',
           a.created_by AS 'Audio.created_by',
           a.created_by_type AS 'Audio.created_by_type',
           a.updated_by AS 'Audio.updated_by',
           a.updated_by_type AS 'Audio.updated_by_type',
           a.created_at AS 'Audio.created_at',
           a.updated_at AS 'Audio.updated_at',
           
           -- General Material data
           gm.id AS 'GeneralMaterial.id',
           gm.topic_id AS 'GeneralMaterial.topic_id',
           gm.title AS 'GeneralMaterial.title',
           gm.description AS 'GeneralMaterial.description',
           gm.completion_type AS 'GeneralMaterial.completion_type',
           gm.completion_time AS 'GeneralMaterial.completion_time',
           gm.audio_url AS 'GeneralMaterial.audio_url',
           gm.duration_minutes AS 'GeneralMaterial.duration_minutes',
           gm.created_by AS 'GeneralMaterial.created_by',
           gm.created_by_type AS 'GeneralMaterial.created_by_type',
           gm.updated_by AS 'GeneralMaterial.updated_by',
           gm.updated_by_type AS 'GeneralMaterial.updated_by_type',
           gm.created_at AS 'GeneralMaterial.created_at',
           gm.updated_at AS 'GeneralMaterial.updated_at'
           
    FROM tbl_topics t
    LEFT JOIN tbl_videos v ON t.id = v.topic_id
    LEFT JOIN tbl_audios a ON t.id = a.topic_id
    LEFT JOIN tbl_general_materials gm ON t.id = gm.topic_id
    WHERE t.module_id = v_module_id
    ORDER BY t.sequence_no ASC;
   
    -- Return accordion data separately (will need to be joined in application)
    SELECT
        ac.*,
        t.id AS topic_id
    FROM tbl_accordions ac
    JOIN tbl_topics t ON ac.topic_id = t.id
    WHERE t.module_id = v_module_id;
   
    -- Return accordion attachments
    SELECT
        aa.*,
        ac.topic_id
    FROM tbl_accordion_attachments aa
    JOIN tbl_accordions ac ON aa.accordionId = ac.id
    JOIN tbl_topics t ON ac.topic_id = t.id
    WHERE t.module_id = v_module_id;
   
    -- Return MultiSlide data
    SELECT
        ms.*,
        t.id AS topic_id
    FROM tbl_multi_slides ms
    JOIN tbl_topics t ON ms.topic_id = t.id
    WHERE t.module_id = v_module_id;
   
    -- Return MultiSlideVideo data
    SELECT
        msv.*,
        ms.topic_id
    FROM tbl_multi_slides_video msv
    JOIN tbl_multi_slides ms ON msv.multi_slide_id = ms.id
    JOIN tbl_topics t ON ms.topic_id = t.id
    WHERE t.module_id = v_module_id;
   
    -- Return MultiSlideAudio data
    -- SELECT
       -- msa.*,
       -- ms.topic_id
    -- FROM tbl_multi_slides_audio msa
    -- JOIN tbl_multi_slides ms ON msa.multi_slide_id = ms.id
    -- JOIN tbl_topics t ON ms.topic_id = t.id
    -- WHERE t.module_id = v_module_id;
   
    -- Return MultiSlideGeneral data
    -- SELECT
    --     msg.*,
    --     ms.topic_id
    -- FROM tbl_multi_slides_general msg
    -- JOIN tbl_multi_slides ms ON msg.multi_slide_id = ms.id
    -- JOIN tbl_topics t ON ms.topic_id = t.id
    -- WHERE t.module_id = v_module_id;
   
    -- Return MultiSlideAccordion data
    SELECT
        msa.*,
        ms.topic_id
    FROM tbl_multislide_accordions msa
    JOIN tbl_multi_slides ms ON msa.multi_slide_id = ms.id
    JOIN tbl_topics t ON ms.topic_id = t.id
    WHERE t.module_id = v_module_id;
   
    -- Return MultiSlideAccordionAttachment data
    SELECT
        msaa.*,
        ms.topic_id
    FROM tbl_multislide_accordion_attachments msaa
    JOIN tbl_multislide_accordions msa ON msaa.accordionId = msa.id
    JOIN tbl_multi_slides ms ON msa.multi_slide_id = ms.id
    JOIN tbl_topics t ON ms.topic_id = t.id
    WHERE t.module_id = v_module_id;
   
    -- Return TopicTag data
    SELECT
        tt.*
    FROM tbl_topics_tag tt
    JOIN tbl_topics t ON tt.topic_id = t.id
    WHERE t.module_id = v_module_id;

    -- General auxiliary materials (topic-level general)
    SELECT *
    FROM tbl_materials m
    JOIN tbl_topics t ON m.topic_id = t.id
    WHERE t.module_id = v_module_id;

    -- Slide general auxiliary materials
    -- SELECT m.*, msg.multi_slide_id, ms.topic_id, msg.id AS slide_general_id
    -- FROM tbl_materials m
    -- JOIN tbl_multi_slides_general msg ON m.slide_general_id = msg.id
    -- JOIN tbl_multi_slides ms ON msg.multi_slide_id = ms.id
    -- JOIN tbl_topics t ON ms.topic_id = t.id
    -- WHERE t.module_id = v_module_id;
END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS GetTopicById`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetTopicById(IN p_topic_hash VARCHAR(255))
BEGIN
DECLARE v_topic_id INT;

-- Get the actual topic ID from the public hash
SELECT id INTO v_topic_id
FROM tbl_topics
WHERE public_hash = p_topic_hash;

-- Check if topic exists
IF v_topic_id IS NULL THEN
    SELECT 'Topic not found' AS message;
ELSE
    -- Return topic with its related data
    SELECT t.*,
        -- Video data
        v.id AS 'Video.id',
        v.topic_id AS 'Video.topic_id',
        v.url AS 'Video.url',
        v.duration_minutes AS 'Video.duration_minutes',
        v.video_type AS 'Video.video_type',
        v.created_by AS 'Video.created_by',
        v.created_by_type AS 'Video.created_by_type',
        v.updated_by AS 'Video.updated_by',
        v.updated_by_type AS 'Video.updated_by_type',
        v.created_at AS 'Video.created_at',
        v.updated_at AS 'Video.updated_at',
           
        -- Audio data (added missing aliases updated_by & updated_at)
        a.id AS 'Audio.id',
        a.topic_id AS 'Audio.topic_id',
        a.url AS 'Audio.url',
        a.image_url AS 'Audio.image_url',
        a.duration_minutes AS 'Audio.duration_minutes',
        a.created_by AS 'Audio.created_by',
        a.created_by_type AS 'Audio.created_by_type',
        a.updated_by AS 'Audio.updated_by',
        a.updated_by_type AS 'Audio.updated_by_type',
        a.created_at AS 'Audio.created_at',
        a.updated_at AS 'Audio.updated_at',
           
        -- General Material core (deprecated url/material_type removed)
        gm.id AS 'GeneralMaterial.id',
        gm.topic_id AS 'GeneralMaterial.topic_id',
        gm.title AS 'GeneralMaterial.title',
        gm.description AS 'GeneralMaterial.description',
        gm.completion_type AS 'GeneralMaterial.completion_type',
        gm.completion_time AS 'GeneralMaterial.completion_time',
        gm.audio_url AS 'GeneralMaterial.audio_url',
        gm.duration_minutes AS 'GeneralMaterial.duration_minutes',
        gm.created_by AS 'GeneralMaterial.created_by',
        gm.created_by_type AS 'GeneralMaterial.created_by_type',
        gm.updated_by AS 'GeneralMaterial.updated_by',
        gm.updated_by_type AS 'GeneralMaterial.updated_by_type',
        gm.created_at AS 'GeneralMaterial.created_at',
        gm.updated_at AS 'GeneralMaterial.updated_at'
           
    FROM tbl_topics t
    LEFT JOIN tbl_videos v ON t.id = v.topic_id
    LEFT JOIN tbl_audios a ON t.id = a.topic_id
    LEFT JOIN tbl_general_materials gm ON t.id = gm.topic_id
    WHERE t.id = v_topic_id;
   
    -- Return accordion data with new fields
    SELECT
        ac.*
    FROM tbl_accordions ac
    WHERE ac.topic_id = v_topic_id
    ORDER BY ac.id ASC;
   
    -- Return accordion attachments
    SELECT
        aa.*
    FROM tbl_accordion_attachments aa
    JOIN tbl_accordions ac ON aa.accordionId = ac.id
    WHERE ac.topic_id = v_topic_id;
   
    -- Return MultiSlide data with the newly added fields
    -- Return MultiSlide data with materials nested
SELECT
    ms.id,
    ms.topic_id,
    ms.title,
    ms.description,
    ms.type,
    ms.completion_type,
    ms.completion_time,
    ms.audio_url,
    ms.sequence_no,
    ms.slide_duration,
    ms.slide_extra_duration,
    ms.total_slide_duration,
    ms.created_by,
    ms.created_by_type,
    ms.updated_by,
    ms.updated_by_type,
    ms.created_at,
    ms.updated_at,
    
    -- Nested slide materials as JSON array
    IF(COUNT(m.id) = 0, JSON_ARRAY(), JSON_ARRAYAGG(
        JSON_OBJECT(
            'id', m.id,
            'slide_id', m.slide_id,
            'material_type', m.material_type,
            'url', m.url,
            'code', m.code,
            'codeLanguage', m.codeLanguage,
            'created_by', m.created_by,
            'created_by_type', m.created_by_type,
            'updated_by', m.updated_by,
            'updated_by_type', m.updated_by_type,
            'created_at', m.created_at,
            'updated_at', m.updated_at
        )
    )) AS materials

FROM tbl_multi_slides ms
LEFT JOIN tbl_materials m ON ms.id = m.slide_id
WHERE ms.topic_id = v_topic_id
GROUP BY ms.id
ORDER BY ms.id ASC;

   
    -- Return MultiSlideVideo data
    SELECT
        msv.*
    FROM tbl_multi_slides_video msv
    JOIN tbl_multi_slides ms ON msv.multi_slide_id = ms.id
    WHERE ms.topic_id = v_topic_id;
   
    -- Return MultiSlideAudio data
    -- SELECT
       -- msa.*
    -- FROM tbl_multi_slides_audio msa
    -- JOIN tbl_multi_slides ms ON msa.multi_slide_id = ms.id
    -- WHERE ms.topic_id = v_topic_id;
   
    -- Return MultiSlideGeneral data with new fields
    -- SELECT
    --     msg.id,
    --     msg.multi_slide_id,
    --     msg.codeLanguage,
    --     msg.code,
    --     msg.created_by,
    --     msg.created_by_type,
    --     msg.updated_by,
    --     msg.updated_by_type,
    --     msg.created_at,
    --     msg.updated_at
    -- FROM tbl_multi_slides_general msg
    -- JOIN tbl_multi_slides ms ON msg.multi_slide_id = ms.id
    -- WHERE ms.topic_id = v_topic_id;
   
    -- Return MultiSlideAccordion data with new fields
    SELECT
        msa.id,
        msa.multi_slide_id,
        msa.title,
        msa.body,
        msa.codeLanguage,
        msa.code,
        msa.created_by,
        msa.created_by_type,
        msa.updated_by,
        msa.updated_by_type,
        msa.created_at,
        msa.updated_at
    FROM tbl_multislide_accordions msa
    JOIN tbl_multi_slides ms ON msa.multi_slide_id = ms.id
    WHERE ms.topic_id = v_topic_id
    ORDER BY msa.id ASC;
   
    -- Return MultiSlideAccordionAttachment data
    SELECT
        msaa.*
    FROM tbl_multislide_accordion_attachments msaa
    JOIN tbl_multislide_accordions msa ON msaa.accordionId = msa.id
    JOIN tbl_multi_slides ms ON msa.multi_slide_id = ms.id
    WHERE ms.topic_id = v_topic_id;

    -- Return TopicTag data
    SELECT
        tt.*
    FROM tbl_topics_tag tt
    WHERE tt.topic_id = v_topic_id;

    -- General auxiliary materials for this topic
    SELECT *
    FROM tbl_materials
    WHERE topic_id = v_topic_id AND slide_id IS NULL;

    -- Slide general auxiliary materials for this topic
    -- SELECT m.*, msg.multi_slide_id, msg.id AS slide_general_id
    -- FROM tbl_materials m
    -- JOIN tbl_multi_slides_general msg ON m.slide_general_id = msg.id
    -- JOIN tbl_multi_slides ms ON msg.multi_slide_id = ms.id
    -- WHERE ms.topic_id = v_topic_id;
END IF;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateTopicStatus(
IN p_topic_id INT,
IN p_status ENUM('active', 'inactive')
)
BEGIN
DECLARE topicExists INT;

-- Validate status input manually (fallback safety)
IF p_status NOT IN ('active', 'inactive') THEN
SIGNAL SQLSTATE '45000'
SET MESSAGE_TEXT = 'E400|InvalidValueError|Invalid status. Must be ''active'' or ''inactive''.';
END IF;

-- Check if topic exists
SELECT COUNT(*) INTO topicExists
FROM tbl_topics
WHERE id = p_topic_id;

IF topicExists = 0 THEN
SIGNAL SQLSTATE '45000'
SET MESSAGE_TEXT = 'E404|NotFoundError|Topic not found';
ELSE

-- Update topic status and updated_at
UPDATE tbl_topics
SET status = p_status,
    updated_at = CURRENT_TIMESTAMP
WHERE id = p_topic_id;

-- Update linked quiz statuses to match topic status
UPDATE tbl_quiz q
JOIN tbl_topic_content tc ON tc.quiz_id = q.id
SET q.status = p_status,
    q.updated_at = CURRENT_TIMESTAMP
WHERE tc.topic_id = p_topic_id;

-- Update linked assignment statuses based on topic status
UPDATE tbl_assignments a
JOIN tbl_topic_content tc ON tc.assignment_id = a.id
SET a.status = CASE WHEN p_status = 'active' THEN 'active' ELSE 'closed' END,
    a.updated_at = CURRENT_TIMESTAMP
WHERE tc.topic_id = p_topic_id;

CALL handleCourseEntityStatus('topic', p_topic_id);

-- Return the updated topic details
SELECT *
FROM tbl_topics
WHERE id = p_topic_id;
END IF;
END`)

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS UpdateTopicSequence(
IN p_topic_ids TEXT
)
BEGIN
DECLARE curr_id TEXT;
DECLARE next_pos INT DEFAULT 1;
DECLARE done INT DEFAULT 0;

-- Temporary table to hold sequence updates
CREATE TEMPORARY TABLE IF NOT EXISTS temp_topic_sequence (
sequence_no INT PRIMARY KEY AUTO_INCREMENT,
topic_id INT
) ENGINE=MEMORY;

WHILE NOT done DO
SET curr_id = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(p_topic_ids, ',', next_pos), ',', -1));

IF curr_id = '' OR curr_id IS NULL THEN
  SET done = 1;
ELSE
  INSERT INTO temp_topic_sequence(topic_id)
  VALUES (CAST(curr_id AS UNSIGNED));
  SET next_pos = next_pos + 1;
END IF;

IF next_pos > CHAR_LENGTH(p_topic_ids) - CHAR_LENGTH(REPLACE(p_topic_ids, ',', '')) + 1 THEN
  SET done = 1;
END IF;
END WHILE;

-- Update the actual sequence in tbl_topics
UPDATE tbl_topics t
JOIN temp_topic_sequence temp ON t.id = temp.topic_id
SET t.sequence_no = temp.sequence_no;

DROP TEMPORARY TABLE IF EXISTS temp_topic_sequence;
END`);

        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS GetTopicNamesByModuleId(
    IN p_module_id INT
)
BEGIN
    -- Check if module exists
    IF NOT EXISTS (SELECT 1 FROM tbl_modules WHERE id = p_module_id) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'E404|NotFoundError|Module not found';
    END IF;

    -- Return topic names and IDs
    SELECT 
        id,
        title,
        public_hash,
        sequence_no
    FROM tbl_topics 
    WHERE module_id = p_module_id 
    ORDER BY sequence_no ASC;
END`);

        console.log("✅ Topic procedures created!");
    } catch (error) {
        console.error("❌ Error setting up Topic procedures:", error);
        throw error;
    }
};

module.exports = setupTopicProcedures;
