const sequelize = require("../../config/db");

const setupQuizQuestionProcedures = async () => {
  try {
    console.log("🔄 Setting up Quiz Question procedures...");

    // Procedure: Create Quiz Question
    await sequelize.query(`
CREATE PROCEDURE IF NOT EXISTS createQuizQuestion(
    IN p_quiz_id INT,
    IN p_type VARCHAR(50),
    IN p_created_by INT,
    IN p_created_by_type VARCHAR(20),
    IN p_updated_by INT,
    IN p_updated_by_type VARCHAR(20),
    IN p_marks INT,
    IN p_is_active BOOLEAN,
    IN p_question_img TEXT,
    IN p_speaking_question TEXT,
    IN p_speaking_answer TEXT,
    IN p_dragdrop_prompt TEXT,
    IN p_dragdrop_options JSON,
    IN p_dragdrop_blanks JSON,
    IN p_audiotoscript_url TEXT,
    IN p_audiotoscript_script TEXT,
    IN p_videotoscript_url TEXT,
    IN p_videotoscript_script TEXT,
    IN p_imagetoscript_url TEXT,
    IN p_imagetoscript_script TEXT,
    IN p_video_url TEXT,
    IN p_audio_url TEXT,
    IN p_video_pause_url TEXT,
    IN p_video_pause_stamps JSON,
    IN p_video_pause_question_ids JSON,
    IN p_audio_pause_url TEXT,
    IN p_audio_pause_stamps JSON,
    IN p_audio_pause_question_ids JSON,
    IN p_realword_words JSON,
    IN p_realword_correct_answers JSON,
    IN p_summarizepassage_summary TEXT,
    IN p_summarizepassage_time_limit INT,
    IN p_bestoption_passage TEXT,
    IN p_bestoption_blanked_words JSON,
    IN p_mcq_question_text TEXT,
    IN p_arrangeorder_prompt TEXT,
    IN p_sentences JSON,
    IN p_correct_order JSON,
    IN p_assigned_pause_id INT
)
BEGIN
    DECLARE quiz_exists INT DEFAULT 0;
    DECLARE new_q_id INT DEFAULT 0;
    DECLARE i INT DEFAULT 0;
    DECLARE len INT DEFAULT 0;
    DECLARE tmp_qid INT;
    DECLARE j INT DEFAULT 0;
    DECLARE subLen INT DEFAULT 0;
    DECLARE subArr JSON;

    -- check quiz exists
    SELECT COUNT(*) INTO quiz_exists FROM tbl_quiz WHERE id = p_quiz_id;

    IF quiz_exists = 0 THEN
        SELECT NULL AS id WHERE 1=0;
    ELSE
        -- insert new quiz question
        INSERT INTO tbl_quiz_questions (
            quiz_id, type, created_by, created_by_type, updated_by, updated_by_type,
            marks, is_active, question_img,
            speaking_question, speaking_answer,
            dragdrop_prompt, dragdrop_options, dragdrop_blanks,
            audiotoscript_url, audiotoscript_script, videotoscript_url, videotoscript_script,
            imagetoscript_url, imagetoscript_script,
            video_url, audio_url,
            video_pause_url, video_pause_stamps, video_pause_question_ids,
            audio_pause_url, audio_pause_stamps, audio_pause_question_ids,
            realword_words, realword_correct_answers,
            summarizepassage_summary, summarizepassage_time_limit,
            bestoption_passage, bestoption_blanked_words,
            mcq_question_text, arrangeorder_prompt,
            sentences, correct_order,
            assigned_pause_id,
            created_at, updated_at
        ) VALUES (
            p_quiz_id, p_type, p_created_by, p_created_by_type, p_updated_by, p_updated_by_type,
            p_marks, p_is_active, p_question_img,
            p_speaking_question, p_speaking_answer,
            p_dragdrop_prompt, p_dragdrop_options, p_dragdrop_blanks,
            p_audiotoscript_url, p_audiotoscript_script, p_videotoscript_url, p_videotoscript_script,
            p_imagetoscript_url, p_imagetoscript_script,
            p_video_url, p_audio_url,
            p_video_pause_url, p_video_pause_stamps, p_video_pause_question_ids,
            p_audio_pause_url, p_audio_pause_stamps, p_audio_pause_question_ids,
            p_realword_words, p_realword_correct_answers,
            p_summarizepassage_summary, p_summarizepassage_time_limit,
            p_bestoption_passage, p_bestoption_blanked_words,
            p_mcq_question_text, p_arrangeorder_prompt,
            p_sentences, p_correct_order,
            p_assigned_pause_id,
            NOW(), NOW()
        );

        SET new_q_id = LAST_INSERT_ID();

        -- handle video_pause nested arrays
        IF p_type = 'video_pause' 
           AND p_video_pause_question_ids IS NOT NULL 
           AND JSON_LENGTH(p_video_pause_question_ids) > 0 THEN
            SET i = 0;
            SET len = JSON_LENGTH(p_video_pause_question_ids);

            WHILE i < len DO
                SET subArr = JSON_EXTRACT(p_video_pause_question_ids, CONCAT('$[', i, ']'));

                IF JSON_TYPE(subArr) = 'ARRAY' THEN
                    SET j = 0;
                    SET subLen = JSON_LENGTH(subArr);
                    WHILE j < subLen DO
                        SET tmp_qid = CAST(JSON_EXTRACT(subArr, CONCAT('$[', j, ']')) AS UNSIGNED);
                        IF tmp_qid IS NOT NULL AND tmp_qid != new_q_id THEN
                          UPDATE tbl_quiz_questions
                            SET assigned_pause_id = new_q_id
                            WHERE id = tmp_qid;

                        END IF;
                        SET j = j + 1;
                    END WHILE;
                ELSE
                    SET tmp_qid = CAST(subArr AS UNSIGNED);
                    IF tmp_qid IS NOT NULL AND tmp_qid != new_q_id THEN
                      UPDATE tbl_quiz_questions
                        SET assigned_pause_id = p_id
                        WHERE id = tmp_qid;
                    END IF;
                END IF;

                SET i = i + 1;
            END WHILE;
        END IF;

        -- handle audio_pause nested arrays
        IF p_type = 'audio_pause' 
           AND p_audio_pause_question_ids IS NOT NULL 
           AND JSON_LENGTH(p_audio_pause_question_ids) > 0 THEN
            SET i = 0;
            SET len = JSON_LENGTH(p_audio_pause_question_ids);

            WHILE i < len DO
                SET subArr = JSON_EXTRACT(p_audio_pause_question_ids, CONCAT('$[', i, ']'));

                IF JSON_TYPE(subArr) = 'ARRAY' THEN
                    SET j = 0;
                    SET subLen = JSON_LENGTH(subArr);
                    WHILE j < subLen DO
                        SET tmp_qid = CAST(JSON_EXTRACT(subArr, CONCAT('$[', j, ']')) AS UNSIGNED);
                        IF tmp_qid IS NOT NULL AND tmp_qid != new_q_id THEN
                          UPDATE tbl_quiz_questions
                             SET assigned_pause_id = new_q_id
                             WHERE id = tmp_qid;
                        END IF;
                        SET j = j + 1;
                    END WHILE;
                ELSE
                    SET tmp_qid = CAST(subArr AS UNSIGNED);
                    IF tmp_qid IS NOT NULL AND tmp_qid != new_q_id THEN
                      UPDATE tbl_quiz_questions
                        SET assigned_pause_id = p_id
                        WHERE id = tmp_qid;
                    END IF;
                END IF;

                SET i = i + 1;
            END WHILE;
        END IF;
          SELECT * FROM tbl_quiz_questions WHERE id = new_q_id;
    END IF;
END
`);


    // Procedure: Get Quiz Questions By Quiz ID
    await sequelize.query(`DROP PROCEDURE IF EXISTS getQuizQuestionsByQuizId`);
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS getQuizQuestionsByQuizId(
    IN p_quiz_id INT
)
BEGIN
    DECLARE quiz_exists INT DEFAULT 0;

    -- Check if quiz exists
    SELECT COUNT(*) INTO quiz_exists FROM tbl_quiz WHERE id = p_quiz_id;

    IF quiz_exists = 0 THEN
        SELECT 'Quiz not found' AS error;
    ELSE
        -- Questions result
        SELECT * FROM tbl_quiz_questions
        WHERE quiz_id = p_quiz_id;

        -- Options result with aliasing
        SELECT 
            o.id AS option_id,
            o.question_id,
            o.type AS option_type,
            o.mcq_option_text,
            o.mcq_is_correct,
            o.complate_correct_word,
            o.complate_hint,
            o.is_active AS option_is_active,
            o.created_by AS option_created_by,
            o.created_at AS option_created_at
        FROM tbl_quiz_question_options o
        JOIN tbl_quiz_questions q ON q.id = o.question_id
        WHERE q.quiz_id = p_quiz_id;
    END IF;
END
    `);

    // Procedure: Update Quiz Question
    await sequelize.query(`
CREATE PROCEDURE IF NOT EXISTS updateQuizQuestion(
    IN p_id INT,
    IN p_quiz_id INT,
    IN p_type VARCHAR(50),
    IN p_updated_by INT,
    IN p_updated_by_type VARCHAR(20),
    IN p_marks INT,
    IN p_is_active BOOLEAN,
    IN p_question_img TEXT,
    IN p_speaking_question TEXT,
    IN p_speaking_answer TEXT,
    IN p_dragdrop_prompt TEXT,
    IN p_dragdrop_options JSON,
    IN p_dragdrop_blanks JSON,
    IN p_audiotoscript_url TEXT,
    IN p_audiotoscript_script TEXT,
    IN p_videotoscript_url TEXT,
    IN p_videotoscript_script TEXT,
    IN p_imagetoscript_url TEXT,
    IN p_imagetoscript_script TEXT,
    IN p_video_url TEXT,
    IN p_audio_url TEXT,
    IN p_video_pause_url TEXT,
    IN p_video_pause_stamps JSON,
    IN p_video_pause_question_ids JSON,
    IN p_audio_pause_url TEXT,
    IN p_audio_pause_stamps JSON,
    IN p_audio_pause_question_ids JSON,
    IN p_realword_words JSON,
    IN p_realword_correct_answers JSON,
    IN p_summarizepassage_summary TEXT,
    IN p_summarizepassage_time_limit INT,
    IN p_bestoption_passage TEXT,
    IN p_bestoption_blanked_words JSON,
    IN p_mcq_question_text TEXT,
    IN p_arrangeorder_prompt TEXT,
    IN p_sentences JSON,
    IN p_correct_order JSON,
    IN p_assigned_pause_id INT
)
proc_label: BEGIN
    DECLARE question_exists INT DEFAULT 0;
    DECLARE quiz_exists INT DEFAULT 0;
    DECLARE i INT DEFAULT 0;
    DECLARE len INT DEFAULT 0;
    DECLARE tmp_qid INT;
    DECLARE j INT DEFAULT 0;
    DECLARE subLen INT DEFAULT 0;
    DECLARE subArr JSON;

    -- Does question exist?
    SELECT COUNT(*) INTO question_exists FROM tbl_quiz_questions WHERE id = p_id;
    IF question_exists = 0 THEN
        SELECT NULL AS id WHERE 1=0;
        LEAVE proc_label;
    END IF;

    -- Does quiz exist?
    IF p_quiz_id IS NOT NULL THEN
        SELECT COUNT(*) INTO quiz_exists FROM tbl_quiz WHERE id = p_quiz_id;
        IF quiz_exists = 0 THEN
            SELECT NULL AS id WHERE 1=0;
            LEAVE proc_label;
        END IF;
    END IF;

    -- Update quiz question
    UPDATE tbl_quiz_questions
    SET
        quiz_id = IFNULL(p_quiz_id, quiz_id),
        type = IFNULL(p_type, type),
        updated_by = p_updated_by,
        updated_by_type = p_updated_by_type,
        marks = IFNULL(p_marks, marks),
        is_active = IFNULL(p_is_active, is_active),
        question_img = IFNULL(p_question_img, question_img),
        speaking_question = IFNULL(p_speaking_question, speaking_question),
        speaking_answer = IFNULL(p_speaking_answer, speaking_answer),
        dragdrop_prompt = IFNULL(p_dragdrop_prompt, dragdrop_prompt),
        dragdrop_options = IFNULL(p_dragdrop_options, dragdrop_options),
        dragdrop_blanks = IFNULL(p_dragdrop_blanks, dragdrop_blanks),
        audiotoscript_url = IFNULL(p_audiotoscript_url, audiotoscript_url),
        audiotoscript_script = IFNULL(p_audiotoscript_script, audiotoscript_script),
        videotoscript_url = IFNULL(p_videotoscript_url, videotoscript_url),
        videotoscript_script = IFNULL(p_videotoscript_script, videotoscript_script),
        imagetoscript_url = IFNULL(p_imagetoscript_url, imagetoscript_url),
        imagetoscript_script = IFNULL(p_imagetoscript_script, imagetoscript_script),
        video_url = IFNULL(p_video_url, video_url),
        audio_url = IFNULL(p_audio_url, audio_url),
        video_pause_url = IFNULL(p_video_pause_url, video_pause_url),
        video_pause_stamps = IFNULL(p_video_pause_stamps, video_pause_stamps),
        video_pause_question_ids = IFNULL(p_video_pause_question_ids, video_pause_question_ids),
        audio_pause_url = IFNULL(p_audio_pause_url, audio_pause_url),
        audio_pause_stamps = IFNULL(p_audio_pause_stamps, audio_pause_stamps),
        audio_pause_question_ids = IFNULL(p_audio_pause_question_ids, audio_pause_question_ids),
        realword_words = IFNULL(p_realword_words, realword_words),
        realword_correct_answers = IFNULL(p_realword_correct_answers, realword_correct_answers),
        summarizepassage_summary = IFNULL(p_summarizepassage_summary, summarizepassage_summary),
        summarizepassage_time_limit = IFNULL(p_summarizepassage_time_limit, summarizepassage_time_limit),
        bestoption_passage = IFNULL(p_bestoption_passage, bestoption_passage),
        bestoption_blanked_words = IFNULL(p_bestoption_blanked_words, bestoption_blanked_words),
        mcq_question_text = IFNULL(p_mcq_question_text, mcq_question_text),
        arrangeorder_prompt = IFNULL(p_arrangeorder_prompt, arrangeorder_prompt),
        sentences = IFNULL(p_sentences, sentences),
        correct_order = IFNULL(p_correct_order, correct_order),
        assigned_pause_id = IFNULL(p_assigned_pause_id, assigned_pause_id),
        updated_at = NOW()
    WHERE id = p_id;

      -- Step A: Clear old assignments
        UPDATE tbl_quiz_questions
        SET assigned_pause_id = 0
        WHERE assigned_pause_id = p_id
        AND id <> p_id;

     -- Handle video_pause tagging with nested arrays (no quiz filter)
    IF p_type = 'video_pause' 
       AND p_video_pause_question_ids IS NOT NULL 
       AND JSON_LENGTH(p_video_pause_question_ids) > 0 THEN
        SET i = 0;
        SET len = JSON_LENGTH(p_video_pause_question_ids);

        WHILE i < len DO
            SET subArr = JSON_EXTRACT(p_video_pause_question_ids, CONCAT('$[', i, ']'));

            IF JSON_TYPE(subArr) = 'ARRAY' THEN
                SET j = 0;
                SET subLen = JSON_LENGTH(subArr);
                WHILE j < subLen DO
                    SET tmp_qid = CAST(JSON_UNQUOTE(JSON_EXTRACT(subArr, CONCAT('$[', j, ']'))) AS UNSIGNED);
                    IF tmp_qid IS NOT NULL AND tmp_qid != p_id THEN
                        UPDATE tbl_quiz_questions
                          SET assigned_pause_id = p_id
                          WHERE id = tmp_qid;
                    END IF;
                    SET j = j + 1;
                END WHILE;
            ELSE
                SET tmp_qid = CAST(JSON_UNQUOTE(subArr) AS UNSIGNED);
                IF tmp_qid IS NOT NULL AND tmp_qid != p_id THEN
                    UPDATE tbl_quiz_questions
                      SET assigned_pause_id = p_id
                      WHERE id = tmp_qid;
                END IF;
            END IF;

            SET i = i + 1;
        END WHILE;
    END IF;

    -- Handle audio_pause tagging with nested arrays (no quiz filter)
    IF p_type = 'audio_pause' 
       AND p_audio_pause_question_ids IS NOT NULL 
       AND JSON_LENGTH(p_audio_pause_question_ids) > 0 THEN
        SET i = 0;
        SET len = JSON_LENGTH(p_audio_pause_question_ids);

        WHILE i < len DO
            SET subArr = JSON_EXTRACT(p_audio_pause_question_ids, CONCAT('$[', i, ']'));

            IF JSON_TYPE(subArr) = 'ARRAY' THEN
                SET j = 0;
                SET subLen = JSON_LENGTH(subArr);
                WHILE j < subLen DO
                    SET tmp_qid = CAST(JSON_UNQUOTE(JSON_EXTRACT(subArr, CONCAT('$[', j, ']'))) AS UNSIGNED);
                    IF tmp_qid IS NOT NULL AND tmp_qid != p_id THEN
                        UPDATE tbl_quiz_questions
                          SET assigned_pause_id = p_id
                          WHERE id = tmp_qid;
                    END IF;
                    SET j = j + 1;
                END WHILE;
            ELSE
                SET tmp_qid = CAST(JSON_UNQUOTE(subArr) AS UNSIGNED);
                IF tmp_qid IS NOT NULL AND tmp_qid != p_id THEN
                    UPDATE tbl_quiz_questions
                      SET assigned_pause_id = p_id
                      WHERE id = tmp_qid;
                END IF;
            END IF;

            SET i = i + 1;
        END WHILE;
    END IF;

    -- Return updated row
    SELECT * FROM tbl_quiz_questions WHERE id = p_id;
END
`);

    // Procedure: Delete Quiz Question
    await sequelize.query(`DROP PROCEDURE IF EXISTS deleteQuizQuestion`);
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS deleteQuizQuestion(
        IN p_id INT
      )
      BEGIN
        DECLARE question_exists INT DEFAULT 0;
        
        -- Check if question exists
        SELECT COUNT(*) INTO question_exists FROM tbl_quiz_questions WHERE id = p_id;
        
        IF question_exists = 0 THEN
          -- Return error flag
          SELECT 'Question not found' as error;
        ELSE
          -- Clear assigned pause id
          UPDATE tbl_quiz_questions
          SET assigned_pause_id = 0
          WHERE assigned_pause_id = p_id
          AND id <> p_id;

          -- Delete related options first
          DELETE FROM tbl_quiz_question_options WHERE question_id = p_id;
          
          -- Delete the question
          DELETE FROM tbl_quiz_questions WHERE id = p_id;
          
          -- Return success message
          SELECT p_id as deleted_id, 'Question deleted successfully' as message;
        END IF;
      END
    `);

    // Procedure: Toggle Quiz Question Status
    await sequelize.query(`DROP PROCEDURE IF EXISTS toggleQuizQuestion`);
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS toggleQuizQuestion(
        IN p_id INT
      )
      BEGIN
        DECLARE question_exists INT DEFAULT 0;
        DECLARE new_status BOOLEAN;

        -- Check if question exists
        SELECT COUNT(*) INTO question_exists FROM tbl_quiz_questions WHERE id = p_id;
        
        IF question_exists = 0 THEN
          -- Return empty result to indicate question not found
          SELECT NULL as id WHERE 1=0;
        ELSE

          -- Get toggled status from main question
          SELECT NOT is_active
          INTO new_status
          FROM tbl_quiz_questions
          WHERE id = p_id;
          
          -- Update questions linked via assigned_pause_id
          UPDATE tbl_quiz_questions
          SET is_active = new_status,
              updated_at = NOW()
          WHERE assigned_pause_id = p_id
            AND id <> p_id;

          -- Toggle the is_active status
          UPDATE tbl_quiz_questions
          SET is_active = new_status,
              updated_at = NOW()
          WHERE id = p_id;
          
          -- Return the updated question
          SELECT * FROM tbl_quiz_questions WHERE id = p_id;
        END IF;
      END
    `);

    // Procedure: Create Quiz Question Option
    await sequelize.query(`DROP PROCEDURE IF EXISTS createQuizQuestionOption`);
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS createQuizQuestionOption(
        IN p_question_id INT,
        IN p_type VARCHAR(50),
        IN p_mcq_option_text TEXT,
        IN p_mcq_option_img TEXT,
        IN p_mcq_is_correct BOOLEAN,
        IN p_complate_correct_word TEXT,
        IN p_complate_hint TEXT,
        IN p_created_by INT,
        IN p_created_by_type VARCHAR(20),
        IN p_updated_by INT,
        IN p_updated_by_type VARCHAR(20)
      )
      BEGIN
        DECLARE question_exists INT DEFAULT 0;
        
        -- Check if question exists
        SELECT COUNT(*) INTO question_exists FROM tbl_quiz_questions WHERE id = p_question_id;
        
        IF question_exists = 0 THEN
          -- Return empty result set to indicate question not found
          SELECT NULL as id WHERE 1=0;
        ELSE
          -- Insert the option
          INSERT INTO tbl_quiz_question_options (
            question_id,
            type,
            mcq_option_text,
            mcq_option_img,
            mcq_is_correct,
            complate_correct_word,
            complate_hint,
            created_by,
            created_by_type,
            updated_by,
            updated_by_type,
            created_at,
            updated_at
          ) VALUES (
            p_question_id,
            p_type,
            p_mcq_option_text,
            p_mcq_option_img,
            p_mcq_is_correct,
            p_complate_correct_word,
            p_complate_hint,
            p_created_by,
            p_created_by_type,
            p_updated_by,
            p_updated_by_type,
            NOW(),
            NOW()
          );
          
          -- Return the newly created option
          SELECT * FROM tbl_quiz_question_options WHERE id = LAST_INSERT_ID();
        END IF;
      END
    `);

    // Procedure: Delete Quiz Question Options by Question ID
    await sequelize.query(`DROP PROCEDURE IF EXISTS deleteQuizQuestionOptions`);
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS deleteQuizQuestionOptions(
        IN p_question_id INT
      )
      BEGIN
        -- Delete all options for the question
        DELETE FROM tbl_quiz_question_options WHERE question_id = p_question_id;
        
        -- Return success message
        SELECT p_question_id as question_id, 'Options deleted successfully' as message;
      END
    `);

    console.log("✅ Quiz Question procedures created!");
  } catch (error) {
    console.error("❌ Error setting up Quiz Question procedures:", error);
    throw error;
  }
};

module.exports = setupQuizQuestionProcedures;