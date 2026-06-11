const sequelize = require("../../config/db");

const setupQuizProcedures = async () => {
    try {
        console.log("🔄 Setting up Quiz procedures...");

        // Create Quiz ✅ (Tested)
        await sequelize.query(`DROP PROCEDURE IF EXISTS createQuiz`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS createQuiz(
  IN p_module_hash VARCHAR(255),
  IN p_duration_minutes INT,
  IN p_quiz_data JSON,
  IN p_created_by INT,
  IN p_updated_by INT,
  IN p_created_by_type VARCHAR(20),
  IN p_updated_by_type VARCHAR(20)
)
BEGIN
  DECLARE v_module_id INT;
  DECLARE v_module_duration INT DEFAULT 0;
  DECLARE v_total_quiz_duration INT DEFAULT 0;
  DECLARE v_combined_duration INT;
  DECLARE v_error_msg TEXT;

  -- Get module ID and duration
  SELECT id, duration_minutes INTO v_module_id, v_module_duration
  FROM tbl_modules
  WHERE public_hash = p_module_hash;

  -- If module not found
  IF v_module_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|Module not found.';
  END IF;

  -- Get current total quiz duration for module
  SELECT IFNULL(SUM(duration_minutes), 0)
  INTO v_total_quiz_duration
  FROM tbl_quiz
  WHERE module_id = v_module_id;

  SET v_combined_duration = v_total_quiz_duration + p_duration_minutes;

  -- Check if the total exceeds allowed duration
  IF v_combined_duration > v_module_duration THEN
    SET v_error_msg = CONCAT(
      'E400|LimitExceededError|Limit exceeded: Total quiz duration (',
      v_combined_duration,
      ' minutes) exceeds module limit of ',
      v_module_duration,
      ' minutes. Cannot create quiz.'
    );
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = v_error_msg;
  END IF;

  -- Insert quiz
  SET @sql = CONCAT(
    'INSERT INTO tbl_quiz (module_id, duration_minutes, title, passing_score, max_attempts, attempts_gap, attempts_renew_days,isQuizCompulsory, isWarning, no_of_warning, created_by, updated_by, created_by_type, updated_by_type, quizType, status, created_at, updated_at) VALUES (',
    v_module_id, ', ',
    p_duration_minutes, ', ',
    QUOTE(JSON_UNQUOTE(JSON_EXTRACT(p_quiz_data, '$.title'))), ', ',
    JSON_UNQUOTE(JSON_EXTRACT(p_quiz_data, '$.passing_score')), ', ',
    JSON_UNQUOTE(JSON_EXTRACT(p_quiz_data, '$.max_attempts')), ', ',
    JSON_UNQUOTE(JSON_EXTRACT(p_quiz_data, '$.attempts_gap')), ', ',
    JSON_UNQUOTE(JSON_EXTRACT(p_quiz_data, '$.attempts_renew_days')), ', ',
    JSON_UNQUOTE(JSON_EXTRACT(p_quiz_data, '$.isQuizCompulsory')), ', ', 
        CASE 
             WHEN COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_quiz_data, '$.isWarning')), '0') IN ('true','1','TRUE','True') THEN 1
             ELSE 0
        END, ', ',
        GREATEST(1, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_quiz_data, '$.no_of_warning')),1)), ', ',
    p_created_by, ', ',
    p_updated_by, ', ',
    QUOTE(p_created_by_type), ', ',
    QUOTE(p_updated_by_type), ', ',
    QUOTE(JSON_UNQUOTE(JSON_EXTRACT(p_quiz_data, '$.quizType'))), ', ',
    QUOTE(
      'inactive'
    ), ', ',
    'NOW(), NOW())'
  );

  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;

  -- Return created quiz
  SELECT
    'Quiz created successfully' AS message,
    q.*
  FROM tbl_quiz q
  WHERE id = LAST_INSERT_ID();
END
    `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getQuizzesByModuleHash`);

        // // Get Quizzes by Module ID using stored procedure✅ (Tested)
        await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS getQuizzesByModuleHash(IN p_module_hash VARCHAR(255))
      BEGIN
          DECLARE v_module_id INT;
    
          -- Get module ID
          SELECT id INTO v_module_id
          FROM tbl_modules
          WHERE public_hash = p_module_hash;
    
          -- If module not found
          IF v_module_id IS NULL THEN
              SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'E404|NotFoundError|Module not found';
          END IF;
    
          -- Main query to get quizzes and their nested questions and answers
          SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                  'id', q.id,
                  'module_id', q.module_id,
                  'title', q.title,
                  'duration_minutes', q.duration_minutes,
                  'passing_score', q.passing_score,
                  'max_attempts', q.max_attempts,
                  'attempts_gap', q.attempts_gap,
                  'status', q.status,
                  'quizType', q.quizType,
                  'attempts_renew_days',q.attempts_renew_days,
                  'isQuizCompulsory', q.isQuizCompulsory,
                  'isWarning', q.isWarning,
                  'no_of_warning', q.no_of_warning,
                  'created_by', q.created_by,
                  'created_by_type', q.created_by_type,
                  'updated_by', q.updated_by,
                  'updated_by_type', q.updated_by_type,
                  'included_topic_id', (
                      SELECT t.id
                      FROM tbl_topic_content tc
                      JOIN tbl_topics t ON t.id = tc.topic_id
                      WHERE tc.quiz_id = q.id
                      LIMIT 1
                  ),
                  'included_topic_title', (
                      SELECT t.title
                      FROM tbl_topic_content tc
                      JOIN tbl_topics t ON t.id = tc.topic_id
                      WHERE tc.quiz_id = q.id
                      LIMIT 1
                  ),
                  'created_at', DATE_FORMAT(q.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                  'updated_at', DATE_FORMAT(q.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                  'QuizPreDefinedQuestions', (
                      SELECT JSON_ARRAYAGG(
                          JSON_OBJECT(
                              'id', qpq.id,
                              'quiz_id', qpq.quiz_id,
                              'pre_defined_question_id', qpq.pre_defined_question_id,
                              'created_by', qpq.created_by,
                              'updated_by', qpq.updated_by,
                              'created_at', DATE_FORMAT(qpq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                              'updated_at', DATE_FORMAT(qpq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                              'PreDefinedQuestion', (
                                  SELECT JSON_OBJECT(
                                      'id', pdq.id,
                                      'question_text', pdq.question_text,
                                      'question_img', pdq.question_img,
                                      'question_type', pdq.question_type,
                                      'marks', pdq.marks,
                                      'created_by', pdq.created_by,
                                      'updated_by', pdq.updated_by,
                                      'created_at', DATE_FORMAT(pdq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                                      'updated_at', DATE_FORMAT(pdq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                                      'PreDefinedOptions', (
                                          SELECT JSON_ARRAYAGG(
                                              JSON_OBJECT(
                                                  'id', pdo.id,
                                                  'pre_defined_question_id', pdo.pre_defined_question_id,
                                                  'option_text', pdo.option_text,
                                                  'option_img', pdo.option_img,
                                                  'is_correct', pdo.is_correct,
                                                  'created_by', pdo.created_by,
                                                  'updated_by', pdo.updated_by,
                                                  'created_at', DATE_FORMAT(pdo.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                                                  'updated_at', DATE_FORMAT(pdo.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                                              )
                                          )
                                          FROM tbl_pre_defined_options pdo
                                          WHERE pdo.pre_defined_question_id = pdq.id
                                      )
                                  )
                                  FROM tbl_pre_defined_questions pdq
                                  WHERE pdq.id = qpq.pre_defined_question_id AND pdq.is_active = TRUE
                              )
                          )
                      )
                      FROM tbl_quiz_predefinedquestions qpq
                      WHERE qpq.quiz_id = q.id
                  ),
                  'QuizQuestions', (
                      SELECT JSON_ARRAYAGG(
                          JSON_OBJECT(
                              'id', qq.id,
                              'quiz_id', qq.quiz_id,
                              'type', qq.type,
                              'marks', qq.marks,
                              'question_img', qq.question_img,
                              'is_active', qq.is_active,
                              'created_by', qq.created_by,
                              'created_by_type', qq.created_by_type,
                              'updated_by', qq.updated_by,
                              'updated_by_type', qq.updated_by_type,
                              'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                              'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                              'question_text', qq.mcq_question_text,
                              'QuizOptions', (
                                  SELECT JSON_ARRAYAGG(
                                      JSON_OBJECT(
                                          'id', qo.id,
                                          'question_id', qo.question_id,
                                          'type', qo.type,
                                          'option_text', qo.mcq_option_text,
                                          'option_img', qo.mcq_option_img,
                                          'is_correct', qo.mcq_is_correct,
                                          'is_active', qo.is_active,
                                          'created_by', qo.created_by,
                                          'created_by_type', qo.created_by_type,
                                          'updated_by', qo.updated_by,
                                          'updated_by_type', qo.updated_by_type,
                                          'created_at', DATE_FORMAT(qo.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                                          'updated_at', DATE_FORMAT(qo.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                                      )
                                  )
                                  FROM tbl_quiz_question_options qo
                                  WHERE qo.question_id = qq.id
                              )
                          )
                      )
                      FROM tbl_quiz_questions qq
                      WHERE qq.quiz_id = q.id AND qq.type = 'mcq'
                  ),
                  'RealWordQuestions', (
                      SELECT JSON_ARRAYAGG(
                          JSON_OBJECT(
                              'id', qq.id,
                              'quiz_id', qq.quiz_id,
                              'words', qq.realword_words,
                              'correct_answers', qq.realword_correct_answers,
                              'marks', qq.marks,
                              'created_by', qq.created_by,
                              'updated_by', qq.updated_by,
                              'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                              'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                          )
                      )
                      FROM tbl_quiz_questions qq
                      WHERE qq.quiz_id = q.id AND qq.type = 'realword'
                  ),
                  'AudioToScriptQuestions', (
                      SELECT JSON_ARRAYAGG(
                          JSON_OBJECT(
                              'id', qq.id,
                              'quiz_id', qq.quiz_id,
                              'url', qq.audiotoscript_url,
                              'script', qq.audiotoscript_script,
                              'marks', qq.marks,
                              'created_by', qq.created_by,
                              'updated_by', qq.updated_by,
                              'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                              'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                          )
                      )
                      FROM tbl_quiz_questions qq
                      WHERE qq.quiz_id = q.id AND qq.type = 'audiotoscript'
                  ),
                    -- ✅ NEW: VideoToScript
            'VideoToScriptQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'url', qq.videotoscript_url,
                        'script', qq.videotoscript_script,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'updated_by', qq.updated_by,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'videotoscript'
            ),

            -- ✅ NEW: ImageToScript
            'ImageToScriptQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'url', qq.imagetoscript_url,
                        'script', qq.imagetoscript_script,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'updated_by', qq.updated_by,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'imagetoscript'
            ),

            -- ✅ NEW: ArrangeOrder
            'ArrangeOrderQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'arrangeorder_prompt', qq.arrangeorder_prompt,
                        'sentences', qq.sentences,
                        'correct_order', qq.correct_order,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'created_by_type', qq.created_by_type,
                        'updated_by', qq.updated_by,
                        'updated_by_type', qq.updated_by_type,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'arrangeorder'
            ),
                'SpeakingQuestions', (
                      SELECT JSON_ARRAYAGG(
                          JSON_OBJECT(
                              'id', qq.id,
                              'quiz_id', qq.quiz_id,
                              'speaking_question', qq.speaking_question,
                              'speaking_answer', qq.speaking_answer,
                              'audio_url', qq.audio_url,
                              'question_img', qq.question_img,
                              'marks', qq.marks,
                              'created_by', qq.created_by,
                              'updated_by', qq.updated_by,
                              'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                              'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                          )
                      )
                      FROM tbl_quiz_questions qq
                      WHERE qq.quiz_id = q.id AND qq.type = 'speaking'
                  ),
                  'DragDropQuestions', (
                      SELECT JSON_ARRAYAGG(
                          JSON_OBJECT(
                              'id', qq.id,
                              'quiz_id', qq.quiz_id,
                              'prompt', qq.dragdrop_prompt,
                              'options', qq.dragdrop_options,
                              'blanks', qq.dragdrop_blanks,
                              'marks', qq.marks,
                              'created_by', qq.created_by,
                              'updated_by', qq.updated_by,
                              'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                              'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                          )
                      )
                      FROM tbl_quiz_questions qq
                      WHERE qq.quiz_id = q.id AND qq.type = 'dragdrop'
                  ),
                  'SummarizePassageQuestions', (
                      SELECT JSON_ARRAYAGG(
                          JSON_OBJECT(
                              'id', qq.id,
                              'quiz_id', qq.quiz_id,
                              'summary', qq.summarizepassage_summary,
                              'time_limit', qq.summarizepassage_time_limit,
                              'marks', qq.marks,
                              'created_by', qq.created_by,
                              'updated_by', qq.updated_by,
                              'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                              'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                          )
                      )
                      FROM tbl_quiz_questions qq
                      WHERE qq.quiz_id = q.id AND qq.type = 'summarizepassage'
                  ),
                  'BestOptionQuestions', (
                      SELECT JSON_ARRAYAGG(
                          JSON_OBJECT(
                              'id', qq.id,
                              'quiz_id', qq.quiz_id,
                              'passage', qq.bestoption_passage,
                              'blanked_words', qq.bestoption_blanked_words,
                              'marks', qq.marks,
                              'created_by', qq.created_by,
                              'created_by_type', qq.created_by_type,
                              'updated_by', qq.updated_by,
                              'updated_by_type', qq.updated_by_type,
                              'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                              'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                          )
                      )
                      FROM tbl_quiz_questions qq
                      WHERE qq.quiz_id = q.id AND qq.type = 'bestoption'
                  ),
                  'CompleteSentenceQuestions', (
                      SELECT JSON_ARRAYAGG(
                          JSON_OBJECT(
                              'id', qq.id,
                              'quiz_id', qq.quiz_id,
                              'question', qq.mcq_question_text,
                              'correct_word', (
                                  SELECT qo.complate_correct_word 
                                  FROM tbl_quiz_question_options qo 
                                  WHERE qo.question_id = qq.id AND qo.type = 'complete_sentence' 
                                  LIMIT 1
                              ),
                              'hint', (
                                  SELECT qo.complate_hint 
                                  FROM tbl_quiz_question_options qo 
                                  WHERE qo.question_id = qq.id AND qo.type = 'complete_sentence' 
                                  LIMIT 1
                              ),
                              'marks', qq.marks,
                              'created_by', qq.created_by,
                              'created_by_type', qq.created_by_type,
                              'updated_by', qq.updated_by,
                              'updated_by_type', qq.updated_by_type,
                              'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                              'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                          )
                      )
                      FROM tbl_quiz_questions qq
                      WHERE qq.quiz_id = q.id AND qq.type = 'complete the sentance'
                  ),

                    -- ✅ NEW: VideoPause
                    'VideoPauseQuestions', (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', qq.id,
                                'quiz_id', qq.quiz_id,
                                'url', qq.video_pause_url,
                                'stamps', qq.video_pause_stamps,
                                'question_ids', qq.video_pause_question_ids,
                                'assigned_pause_id', qq.assigned_pause_id,
                                'marks', qq.marks,
                                'created_by', qq.created_by,
                                'created_by_type', qq.created_by_type,
                                'updated_by', qq.updated_by,
                                'updated_by_type', qq.updated_by_type,
                                'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                                'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                            )
                        )
                        FROM tbl_quiz_questions qq
                        WHERE qq.quiz_id = q.id AND qq.type = 'video_pause'
                    ),

                    -- ✅ NEW: AudioPause
                    'AudioPauseQuestions', (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', qq.id,
                                'quiz_id', qq.quiz_id,
                                'url', qq.audio_pause_url,
                                'stamps', qq.audio_pause_stamps,
                                'question_ids', qq.audio_pause_question_ids,
                                'assigned_pause_id', qq.assigned_pause_id,
                                'marks', qq.marks,
                                'created_by', qq.created_by,
                                'created_by_type', qq.created_by_type,
                                'updated_by', qq.updated_by,
                                'updated_by_type', qq.updated_by_type,
                                'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                                'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                            )
                        )
                        FROM tbl_quiz_questions qq
                        WHERE qq.quiz_id = q.id AND qq.type = 'audio_pause'
                    ),

                  'TextedBasedQuizTexts', (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', tbq.id,
                            'quiz_id', tbq.quiz_id,
                            'text', tbq.text,
                            'created_by', tbq.created_by,
                            'created_by_type', tbq.created_by_type,
                            'updated_by', tbq.updated_by,
                            'updated_by_type', tbq.updated_by_type,
                            'created_at', DATE_FORMAT(tbq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                            'updated_at', DATE_FORMAT(tbq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                            'FillInBlankQuestions', (
                                SELECT JSON_ARRAYAGG(
                                    JSON_OBJECT(
                                        'id', fib.id,
                                        'quizTextId', fib.quizTextId,
                                        'text', fib.text,
                                        'correctAnswer', fib.correctAnswer,
                                        'created_by', fib.created_by,
                                        'created_by_type', fib.created_by_type,
                                        'updated_by', fib.updated_by,
                                        'updated_by_type', fib.updated_by_type,
                                        'created_at', DATE_FORMAT(fib.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                                        'updated_at', DATE_FORMAT(fib.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                                    )
                                )
                                FROM tbl_fill_in_blank_questions_gq fib
                                WHERE fib.quizTextId = tbq.id
                            ),
                            'TrueFalseQuestions', (
                                SELECT JSON_ARRAYAGG(
                                    JSON_OBJECT(
                                        'id', tf.id,
                                        'quizTextId', tf.quizTextId,
                                        'text', tf.text,
                                        'correctAnswer', tf.correctAnswer,
                                        'created_by', tf.created_by,
                                        'created_by_type', tf.created_by_type,
                                        'updated_by', tf.updated_by,
                                        'updated_by_type', tf.updated_by_type,
                                        'created_at', DATE_FORMAT(tf.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                                        'updated_at', DATE_FORMAT(tf.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                                    )
                                )
                                FROM tbl_true_false_questions_gq tf
                                WHERE tf.quizTextId = tbq.id
                            ),
                            'MultipleChoiceQuestions', (
                                SELECT JSON_ARRAYAGG(
                                    JSON_OBJECT(
                                        'id', mc.id,
                                        'quizTextId', mc.quizTextId,
                                        'text', mc.text,
                                        'correctAnswer', mc.correctAnswer,
                                        'options', mc.options,
                                        'created_by', mc.created_by,
                                        'created_by_type', mc.created_by_type,
                                        'updated_by', mc.updated_by,
                                        'updated_by_type', mc.updated_by_type,
                                        'created_at', DATE_FORMAT(mc.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                                        'updated_at', DATE_FORMAT(mc.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                                    )
                                )
                                FROM tbl_multiple_choice_questions_gq mc
                                WHERE mc.quizTextId = tbq.id
                            )
                        )
                    )
                    FROM tbl_textbasedquiztext tbq
                    WHERE tbq.quiz_id = q.id
                )
              )
          ) AS quizzes
          FROM tbl_quiz q
          WHERE q.module_id = v_module_id;
      END;
    `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getQuizById`);

        await sequelize.query(`
      CREATE PROCEDURE getQuizById(
      IN p_quiz_id INT,
      IN p_user_id INT
      )
LANGUAGE SQL
main_block: BEGIN

    DECLARE v_lastAttemptTime DATETIME;
    DECLARE v_triedAttempts INT DEFAULT 0;
    DECLARE v_maxAttempts INT DEFAULT 0;
    DECLARE v_attemptsRenewDays INT DEFAULT 0;
    DECLARE v_attemptsGapHours INT DEFAULT 0;
    DECLARE v_total_active_questions INT DEFAULT 0;
    DECLARE v_next_retry_date DATETIME;

    -- If quiz not found
    IF NOT EXISTS (SELECT 1 FROM tbl_quiz WHERE id = p_quiz_id) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Quiz not found';
    END IF;

    SET v_total_active_questions = (
        -- Quiz questions (excluding pause types)
        (
            SELECT COUNT(*)
            FROM tbl_quiz_questions qq
            WHERE qq.quiz_id = p_quiz_id
            AND qq.is_active = TRUE
            AND (qq.assigned_pause_id = 0 OR qq.assigned_pause_id IS NULL)
        )
        +
        -- Predefined questions
        (
            SELECT COUNT(*)
            FROM tbl_quiz_predefinedquestions qpq
            JOIN tbl_pre_defined_questions pdq 
                ON pdq.id = qpq.pre_defined_question_id
            WHERE qpq.quiz_id = p_quiz_id
            AND pdq.is_active = TRUE
        )
        +
        -- Text-based questions
        (
            SELECT 
                COALESCE(SUM(
                    (SELECT COUNT(*) FROM tbl_fill_in_blank_questions_gq fib WHERE fib.quizTextId = tbq.id) +
                    (SELECT COUNT(*) FROM tbl_true_false_questions_gq tf WHERE tf.quizTextId = tbq.id) +
                    (SELECT COUNT(*) FROM tbl_multiple_choice_questions_gq mc WHERE mc.quizTextId = tbq.id)
                ), 0)
            FROM tbl_textbasedquiztext tbq
            WHERE tbq.quiz_id = p_quiz_id
        )
    );

    SELECT lastAttemptTime, triedAttempts
    INTO v_lastAttemptTime, v_triedAttempts
    FROM tbl_quiz_completion
    WHERE userId = p_user_id
      AND quizId = p_quiz_id
      ORDER BY triedAttempts DESC
    LIMIT 1;

    SELECT attempts_renew_days, max_attempts, attempts_gap
    INTO v_attemptsRenewDays, v_maxAttempts, v_attemptsGapHours
    FROM tbl_quiz
    WHERE id = p_quiz_id;

    IF v_triedAttempts >= v_maxAttempts THEN

        -- Calculate the next retry allowed date only if renewDays > 0
        IF v_attemptsRenewDays > 0 THEN
            SET v_next_retry_date = DATE_ADD(v_lastAttemptTime, INTERVAL v_attemptsRenewDays DAY);
        ELSE
            SET v_next_retry_date = NULL;
        END IF;

        -- If next retry date is still in future
        IF NOW() < v_next_retry_date OR v_attemptsRenewDays < 0 THEN

            SELECT JSON_OBJECT(
                    'id', q.id,
                    'module_id', q.module_id,
                    'title', q.title,
                    'duration_minutes', q.duration_minutes,
                    'passing_score', q.passing_score,
                    'max_attempts', q.max_attempts,
                    'attempts_gap', q.attempts_gap,
                    'status', q.status,
                    'quizType', q.quizType,
                    'attempts_renew_days', q.attempts_renew_days,
                    'isQuizCompulsory', q.isQuizCompulsory,
                    'isWarning', q.isWarning,
                    'no_of_warning', q.no_of_warning,
                    'total_active_questions', v_total_active_questions,
                    'created_by', q.created_by,
                    'created_by_type', q.created_by_type,
                    'updated_by', q.updated_by,
                    'updated_by_type', q.updated_by_type,
                    'created_at', DATE_FORMAT(q.created_at, '%Y-%m-%dT%H:%i:%sZ'),
                    'updated_at', DATE_FORMAT(q.updated_at, '%Y-%m-%dT%H:%i:%sZ'),
                    'nextRetryDate', DATE_FORMAT(v_next_retry_date, '%Y-%m-%dT%H:%i:%sZ'),
                    'reason', 'MaxAttempts'
            ) AS quiz
            FROM tbl_quiz q
            WHERE q.id = p_quiz_id;

            -- Stop further execution
            LEAVE main_block;
        ELSE
            -- Renew window passed → reset attempts
            UPDATE tbl_quiz_completion
            SET triedAttempts = 0
            WHERE userId = p_user_id
            AND quizId = p_quiz_id;
        END IF;
    END IF;

    
    -- =========================================
    --  CHECK ATTEMPTS GAP (attempts_gap hours)
    -- =========================================
    IF v_lastAttemptTime IS NOT NULL AND v_attemptsGapHours > 0 THEN

        SET v_next_retry_date = DATE_ADD(v_lastAttemptTime, INTERVAL v_attemptsGapHours HOUR);

        IF NOW() < v_next_retry_date THEN
            
            -- Return quiz with nextRetryDate (NO ERROR)
            SELECT JSON_OBJECT(
                    'id', q.id,
                    'module_id', q.module_id,
                    'title', q.title,
                    'duration_minutes', q.duration_minutes,
                    'passing_score', q.passing_score,
                    'max_attempts', q.max_attempts,
                    'attempts_gap', q.attempts_gap,
                    'status', q.status,
                    'quizType', q.quizType,
                    'attempts_renew_days', q.attempts_renew_days,
                    'isQuizCompulsory', q.isQuizCompulsory,
                    'isWarning', q.isWarning,
                    'no_of_warning', q.no_of_warning,
                    'total_active_questions', v_total_active_questions,
                    'created_by', q.created_by,
                    'created_by_type', q.created_by_type,
                    'updated_by', q.updated_by,
                    'updated_by_type', q.updated_by_type,
                    'created_at', DATE_FORMAT(q.created_at, '%Y-%m-%dT%H:%i:%sZ'),
                    'updated_at', DATE_FORMAT(q.updated_at, '%Y-%m-%dT%H:%i:%sZ'),
                    'nextRetryDate', DATE_FORMAT(v_next_retry_date, '%Y-%m-%dT%H:%i:%sZ'),
                    'reason', 'GapRestriction'
            ) AS quiz
            FROM tbl_quiz q
            WHERE q.id = p_quiz_id;

            LEAVE main_block;
        END IF;

    END IF;

    SELECT JSON_OBJECT(
        'id', q.id,
        'module_id', q.module_id,
        'title', q.title,
        'duration_minutes', q.duration_minutes,
        'passing_score', q.passing_score,
        'max_attempts', q.max_attempts,
        'attempts_gap', q.attempts_gap,
        'status', q.status,
        'quizType', q.quizType,
        'attempts_renew_days', q.attempts_renew_days,
        'isQuizCompulsory', q.isQuizCompulsory,
        'isWarning', q.isWarning,
        'no_of_warning', q.no_of_warning,
        'total_active_questions', v_total_active_questions,
        'created_by', q.created_by,
        'created_by_type', q.created_by_type,
        'updated_by', q.updated_by,
        'updated_by_type', q.updated_by_type,
        'created_at', DATE_FORMAT(q.created_at, '%Y-%m-%dT%H:%i:%sZ'),
        'updated_at', DATE_FORMAT(q.updated_at, '%Y-%m-%dT%H:%i:%sZ'),
        'QuizPreDefinedQuestions', (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', qpq.id,
                    'quiz_id', qpq.quiz_id,
                    'pre_defined_question_id', qpq.pre_defined_question_id,
                    'created_by', qpq.created_by,
                    'updated_by', qpq.updated_by,
                    'created_at', DATE_FORMAT(qpq.created_at, '%Y-%m-%dT%H:%i:%sZ'),
                    'updated_at', DATE_FORMAT(qpq.updated_at, '%Y-%m-%dT%H:%i:%sZ'),
                    'PreDefinedQuestion', (
                        SELECT JSON_OBJECT(
                            'id', pdq.id,
                            'question_text', pdq.question_text,
                            'question_img', pdq.question_img,
                            'question_type', pdq.question_type,
                            'marks', pdq.marks,
                            'created_by', pdq.created_by,
                            'updated_by', pdq.updated_by,
                            'created_at', DATE_FORMAT(pdq.created_at, '%Y-%m-%dT%H:%i:%sZ'),
                            'updated_at', DATE_FORMAT(pdq.updated_at, '%Y-%m-%dT%H:%i:%sZ'),
                            'PreDefinedOptions', (
                                SELECT JSON_ARRAYAGG(
                                    JSON_OBJECT(
                                        'id', pdo.id,
                                        'pre_defined_question_id', pdo.pre_defined_question_id,
                                        'option_text', pdo.option_text,
                                        'option_img', pdo.option_img,
                                        'is_correct', pdo.is_correct,
                                        'created_by', pdo.created_by,
                                        'updated_by', pdo.updated_by,
                                        'created_at', DATE_FORMAT(pdo.created_at, '%Y-%m-%dT%H:%i:%sZ'),
                                        'updated_at', DATE_FORMAT(pdo.updated_at, '%Y-%m-%dT%H:%i:%sZ')
                                    )
                                )
                                FROM tbl_pre_defined_options pdo
                                WHERE pdo.pre_defined_question_id = pdq.id
                            )
                        )
                        FROM tbl_pre_defined_questions pdq
                        WHERE pdq.id = qpq.pre_defined_question_id AND pdq.is_active = TRUE
                    )
                )
            )
            FROM tbl_quiz_predefinedquestions qpq
            WHERE qpq.quiz_id = q.id
        ),
        'QuizQuestions', (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', qq.id,
                    'quiz_id', qq.quiz_id,
                    'type', qq.type,
                    'marks', qq.marks,
                    'question_img', qq.question_img,
                    'is_active', qq.is_active,
                    'created_by', qq.created_by,
                    'created_by_type', qq.created_by_type,
                    'updated_by', qq.updated_by,
                    'updated_by_type', qq.updated_by_type,
                    'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%sZ'),
                    'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%sZ'),
                    'question_text', qq.mcq_question_text,
                    'QuizOptions', (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', qo.id,
                                'question_id', qo.question_id,
                                'type', qo.type,
                                'option_text', qo.mcq_option_text,
                                'option_img', qo.mcq_option_img,
                                'is_correct', qo.mcq_is_correct,
                                'is_active', qo.is_active,
                                'created_by', qo.created_by,
                                'created_by_type', qo.created_by_type,
                                'updated_by', qo.updated_by,
                                'updated_by_type', qo.updated_by_type,
                                'created_at', DATE_FORMAT(qo.created_at, '%Y-%m-%dT%H:%i:%sZ'),
                                'updated_at', DATE_FORMAT(qo.updated_at, '%Y-%m-%dT%H:%i:%sZ')
                            )
                        )
                        FROM tbl_quiz_question_options qo
                        WHERE qo.question_id = qq.id AND qq.is_active = TRUE
                    )
                )
            )
            FROM tbl_quiz_questions qq
            WHERE qq.quiz_id = q.id AND qq.type = 'mcq' AND qq.is_active = TRUE
        ),
        
        'RealWordQuestions', (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', qq.id,
                    'quiz_id', qq.quiz_id,
                    'words', qq.realword_words,
                    'correct_answers', qq.realword_correct_answers,
                    'marks', qq.marks,
                    'created_by', qq.created_by,
                    'updated_by', qq.updated_by,
                    'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%sZ'),
                    'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%sZ')
                )
            )
            FROM tbl_quiz_questions qq
            WHERE qq.quiz_id = q.id AND qq.type = 'realword' AND qq.is_active = TRUE
        ),
        'AudioToScriptQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'url', qq.audiotoscript_url,
                        'script', qq.audiotoscript_script,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'updated_by', qq.updated_by,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'audiotoscript' AND qq.is_active = TRUE
            ),
            'VideoToScriptQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'url', qq.videotoscript_url,
                        'script', qq.videotoscript_script,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'updated_by', qq.updated_by,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'videotoscript' AND qq.is_active = TRUE
            ),
            'ImageToScriptQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'url', qq.imagetoscript_url,
                        'script', qq.imagetoscript_script,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'updated_by', qq.updated_by,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'imagetoscript' AND qq.is_active = TRUE
            ),
            'SpeakingQuestions', (
                      SELECT JSON_ARRAYAGG(
                          JSON_OBJECT(
                              'id', qq.id,
                              'quiz_id', qq.quiz_id,
                              'speaking_question', qq.speaking_question,
                              'speaking_answer', qq.speaking_answer,
                              'audio_url', qq.audio_url,
                              'question_img', qq.question_img,
                              'marks', qq.marks,
                              'created_by', qq.created_by,
                              'updated_by', qq.updated_by,
                              'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                              'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                          )
                      )
                      FROM tbl_quiz_questions qq
                      WHERE qq.quiz_id = q.id AND qq.type = 'speaking' AND qq.is_active = TRUE
                  ),
            'DragDropQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'prompt', qq.dragdrop_prompt,
                        'options', qq.dragdrop_options,
                        'blanks', qq.dragdrop_blanks,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'updated_by', qq.updated_by,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'dragdrop' AND qq.is_active = TRUE
            ),
            'SummarizePassageQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'summary', qq.summarizepassage_summary,
                        'time_limit', qq.summarizepassage_time_limit,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'updated_by', qq.updated_by,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'summarizepassage' AND qq.is_active = TRUE
            ),
            'BestOptionQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'passage', qq.bestoption_passage,
                        'blanked_words', qq.bestoption_blanked_words,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'created_by_type', qq.created_by_type,
                        'updated_by', qq.updated_by,
                        'updated_by_type', qq.updated_by_type,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'bestoption' AND qq.is_active = TRUE
            ),
            'CompleteSentenceQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'question', qq.mcq_question_text,
                        'options', (
                            SELECT JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'id', qo.id,
                                    'question_id', qo.question_id,
                                    'correct_word', qo.complate_correct_word,
                                    'hint', qo.complate_hint,
                                    'created_at', DATE_FORMAT(qo.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                                    'updated_at', DATE_FORMAT(qo.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                                )
                            )
                            FROM tbl_quiz_question_options qo
                            WHERE qo.question_id = qq.id AND qo.type = 'complete_sentence' AND qo.is_active = TRUE
                        ),
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'created_by_type', qq.created_by_type,
                        'updated_by', qq.updated_by,
                        'updated_by_type', qq.updated_by_type,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'complete the sentance' AND qq.is_active = TRUE
            ),
            'ArrangeOrderQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'arrangeorder_prompt', qq.arrangeorder_prompt, 
                        'sentences', qq.sentences,
                        'correct_order', qq.correct_order,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'created_by_type', qq.created_by_type,
                        'updated_by', qq.updated_by,
                        'updated_by_type', qq.updated_by_type,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'arrangeorder' AND qq.is_active = TRUE
            ),
            
            'VideoPauseQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'url', qq.video_pause_url,
                        'stamps', qq.video_pause_stamps,
                        'question_ids', qq.video_pause_question_ids,
                        'assigned_pause_id', qq.assigned_pause_id,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'created_by_type', qq.created_by_type,
                        'updated_by', qq.updated_by,
                        'updated_by_type', qq.updated_by_type,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'video_pause' AND qq.is_active = TRUE
            ),

            'AudioPauseQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'url', qq.audio_pause_url,
                        'stamps', qq.audio_pause_stamps,
                        'question_ids', qq.audio_pause_question_ids,
                        'assigned_pause_id', qq.assigned_pause_id,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'created_by_type', qq.created_by_type,
                        'updated_by', qq.updated_by,
                        'updated_by_type', qq.updated_by_type,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'audio_pause' AND qq.is_active = TRUE
            ),
            
             'SpeakingQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'speaking_question', qq.speaking_question,
                        'speaking_answer', qq.speaking_answer,
                        'audio_url', qq.audio_url,
                        'question_img', qq.question_img,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'updated_by', qq.updated_by,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'speaking' AND qq.is_active = TRUE
            ),
        -- Add other question types here...
        'TextedBasedQuizTexts', (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', tbq.id,
                    'quiz_id', tbq.quiz_id,
                    'text', tbq.text,
                    'created_by', tbq.created_by,
                    'created_by_type', tbq.created_by_type,
                    'updated_by', tbq.updated_by,
                    'updated_by_type', tbq.updated_by_type,
                    'created_at', DATE_FORMAT(tbq.created_at, '%Y-%m-%dT%H:%i:%sZ'),
                    'updated_at', DATE_FORMAT(tbq.updated_at, '%Y-%m-%dT%H:%i:%sZ'),
                    'FillInBlankQuestions', (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', fib.id,
                                'quizTextId', fib.quizTextId,
                                'text', fib.text,
                                'correctAnswer', fib.correctAnswer,
                                'marks', fib.marks,
                                'created_by', fib.created_by,
                                'created_by_type', fib.created_by_type,
                                'updated_by', fib.updated_by,
                                'updated_by_type', fib.updated_by_type,
                                'created_at', DATE_FORMAT(fib.created_at, '%Y-%m-%dT%H:%i:%sZ'),
                                'updated_at', DATE_FORMAT(fib.updated_at, '%Y-%m-%dT%H:%i:%sZ')
                            )
                        )
                        FROM tbl_fill_in_blank_questions_gq fib
                        WHERE fib.quizTextId = tbq.id
                    ),
                    'TrueFalseQuestions', (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', tf.id,
                                'quizTextId', tf.quizTextId,
                                'text', tf.text,
                                'correctAnswer', tf.correctAnswer,
                                'marks', tf.marks,
                                'created_by', tf.created_by,
                                'created_by_type', tf.created_by_type,
                                'updated_by', tf.updated_by,
                                'updated_by_type', tf.updated_by_type,
                                'created_at', DATE_FORMAT(tf.created_at, '%Y-%m-%dT%H:%i:%sZ'),
                                'updated_at', DATE_FORMAT(tf.updated_at, '%Y-%m-%dT%H:%i:%sZ')
                            )
                        )
                        FROM tbl_true_false_questions_gq tf
                        WHERE tf.quizTextId = tbq.id
                    ),
                    'MultipleChoiceQuestions', (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', mc.id,
                                'quizTextId', mc.quizTextId,
                                'text', mc.text,
                                'correctAnswer', mc.correctAnswer,
                                'marks', mc.marks,
                                'options', mc.options,
                                'created_by', mc.created_by,
                                'created_by_type', mc.created_by_type,
                                'updated_by', mc.updated_by,
                                'updated_by_type', mc.updated_by_type,
                                'created_at', DATE_FORMAT(mc.created_at, '%Y-%m-%dT%H:%i:%sZ'),
                                'updated_at', DATE_FORMAT(mc.updated_at, '%Y-%m-%dT%H:%i:%sZ')
                            )
                        )
                        FROM tbl_multiple_choice_questions_gq mc
                        WHERE mc.quizTextId = tbq.id
                    )
                )
            )
            FROM tbl_textbasedquiztext tbq
            WHERE tbq.quiz_id = q.id
        ),
        'AllAssignedPauseIds', (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'question_id', qq.id,
                    'assigned_pause_id', qq.assigned_pause_id,
                    'type', qq.type
                )
            )
            FROM tbl_quiz_questions qq
            WHERE qq.quiz_id = q.id AND qq.assigned_pause_id > 0 AND qq.is_active = TRUE
        )
    )  AS quiz
    FROM tbl_quiz q
    WHERE q.id = p_quiz_id;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getActiveQuizQuestionByModuleHash`);

        // // Get Quizzes by Module ID using stored procedure✅ (Tested)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getActiveQuizQuestionByModuleHash(IN p_module_hash VARCHAR(255) , IN p_user_id INT)
BEGIN
    DECLARE v_module_id INT;
    DECLARE v_course_id INT;
    DECLARE v_enrollment_id INT;

    -- Get module ID & course ID
    SELECT id, course_id INTO v_module_id, v_course_id
    FROM tbl_modules
    WHERE public_hash = p_module_hash
    LIMIT 1;

    -- If module not found
    IF v_module_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Module not found';
    END IF;

    -- Get enrollment ID
    SELECT id INTO v_enrollment_id
    FROM tbl_enrollments
    WHERE user_id = p_user_id AND course_id = v_course_id
    LIMIT 1;

    IF v_enrollment_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Enrollment not found for this user';
    END IF;

    -- Main query to get quizzes and their nested questions and answers
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'id', q.id,
            'module_id', q.module_id,
            'title', q.title,
            'duration_minutes', q.duration_minutes,
            'passing_score', q.passing_score,
            'max_attempts', q.max_attempts,
            'attempts_gap', q.attempts_gap,
            'status', q.status,
            'quizType', q.quizType,
            'attempts_renew_days',q.attempts_renew_days,
            'isQuizCompulsory', q.isQuizCompulsory,
            'isWarning', q.isWarning,
            'no_of_warning', q.no_of_warning,
            'created_by', q.created_by,
            'created_by_type', q.created_by_type,
            'updated_by', q.updated_by,
            'updated_by_type', q.updated_by_type,
            'created_at', DATE_FORMAT(q.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
            'updated_at', DATE_FORMAT(q.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
            'QuizPreDefinedQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qpq.id,
                        'quiz_id', qpq.quiz_id,
                        'pre_defined_question_id', qpq.pre_defined_question_id,
                        'created_by', qpq.created_by,
                        'updated_by', qpq.updated_by,
                        'created_at', DATE_FORMAT(qpq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qpq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'PreDefinedQuestion', (
                            SELECT JSON_OBJECT(
                                'id', pdq.id,
                                'question_text', pdq.question_text,
                                'question_img', pdq.question_img,
                                'question_type', pdq.question_type,
                                'marks', pdq.marks,
                                'created_by', pdq.created_by,
                                'updated_by', pdq.updated_by,
                                'created_at', DATE_FORMAT(pdq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                                'updated_at', DATE_FORMAT(pdq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                                'PreDefinedOptions', (
                                    SELECT JSON_ARRAYAGG(
                                        JSON_OBJECT(
                                            'id', pdo.id,
                                            'pre_defined_question_id', pdo.pre_defined_question_id,
                                            'option_text', pdo.option_text,
                                            'option_img', pdo.option_img,
                                            'is_correct', pdo.is_correct,
                                            'created_by', pdo.created_by,
                                            'updated_by', pdo.updated_by,
                                            'created_at', DATE_FORMAT(pdo.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                                            'updated_at', DATE_FORMAT(pdo.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                                        )
                                    )
                                    FROM tbl_pre_defined_options pdo
                                    WHERE pdo.pre_defined_question_id = pdq.id
                                )
                            )
                            FROM tbl_pre_defined_questions pdq
                            WHERE pdq.id = qpq.pre_defined_question_id AND pdq.is_active = TRUE
                        )
                    )
                )
                FROM tbl_quiz_predefinedquestions qpq
                WHERE qpq.quiz_id = q.id
            ),
            'QuizQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'type', qq.type,
                        'marks', qq.marks,
                        'question_img', qq.question_img,
                        'is_active', qq.is_active,
                        'created_by', qq.created_by,
                        'created_by_type', qq.created_by_type,
                        'updated_by', qq.updated_by,
                        'updated_by_type', qq.updated_by_type,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'question_text', qq.mcq_question_text,
                        'QuizOptions', (
                            SELECT JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'id', qo.id,
                                    'question_id', qo.question_id,
                                    'type', qo.type,
                                    'option_text', qo.mcq_option_text,
                                    'option_img', qo.mcq_option_img,
                                    'is_correct', qo.mcq_is_correct,
                                    'is_active', qo.is_active,
                                    'created_by', qo.created_by,
                                    'created_by_type', qo.created_by_type,
                                    'updated_by', qo.updated_by,
                                    'updated_by_type', qo.updated_by_type,
                                    'created_at', DATE_FORMAT(qo.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                                    'updated_at', DATE_FORMAT(qo.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                                )
                            )
                            FROM tbl_quiz_question_options qo
                            WHERE qo.question_id = qq.id AND qq.is_active = TRUE
                        )
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'mcq' AND qq.is_active = TRUE
            ),
            'RealWordQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'words', qq.realword_words,
                        'correct_answers', qq.realword_correct_answers,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'updated_by', qq.updated_by,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'realword' AND qq.is_active = TRUE
            ),
            'AudioToScriptQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'url', qq.audiotoscript_url,
                        'script', qq.audiotoscript_script,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'updated_by', qq.updated_by,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'audiotoscript' AND qq.is_active = TRUE
            ),
            'VideoToScriptQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'url', qq.videotoscript_url,
                        'script', qq.videotoscript_script,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'updated_by', qq.updated_by,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'videotoscript' AND qq.is_active = TRUE
            ),
            'ImageToScriptQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'url', qq.imagetoscript_url,
                        'script', qq.imagetoscript_script,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'updated_by', qq.updated_by,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'imagetoscript' AND qq.is_active = TRUE
            ),
            'SpeakingQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'speaking_question', qq.speaking_question,
                        'speaking_answer', qq.speaking_answer,
                        'audio_url', qq.audio_url,
                        'question_img', qq.question_img,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'updated_by', qq.updated_by,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'speaking' AND qq.is_active = TRUE
            ),
            'DragDropQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'prompt', qq.dragdrop_prompt,
                        'options', qq.dragdrop_options,
                        'blanks', qq.dragdrop_blanks,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'updated_by', qq.updated_by,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'dragdrop' AND qq.is_active = TRUE
            ),
            'SummarizePassageQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'summary', qq.summarizepassage_summary,
                        'time_limit', qq.summarizepassage_time_limit,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'updated_by', qq.updated_by,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'summarizepassage' AND qq.is_active = TRUE
            ),
            'BestOptionQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'passage', qq.bestoption_passage,
                        'blanked_words', qq.bestoption_blanked_words,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'created_by_type', qq.created_by_type,
                        'updated_by', qq.updated_by,
                        'updated_by_type', qq.updated_by_type,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'bestoption' AND qq.is_active = TRUE
            ),
            'CompleteSentenceQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'question', qq.mcq_question_text,
                        'options', (
                            SELECT JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'id', qo.id,
                                    'question_id', qo.question_id,
                                    'correct_word', qo.complate_correct_word,
                                    'hint', qo.complate_hint,
                                    'created_at', DATE_FORMAT(qo.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                                    'updated_at', DATE_FORMAT(qo.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                                )
                            )
                            FROM tbl_quiz_question_options qo
                            WHERE qo.question_id = qq.id AND qo.type = 'complete_sentence' AND qo.is_active = TRUE
                        ),
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'created_by_type', qq.created_by_type,
                        'updated_by', qq.updated_by,
                        'updated_by_type', qq.updated_by_type,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'complete the sentance' AND qq.is_active = TRUE
            ),

            -- Inside your big SELECT JSON_ARRAYAGG(JSON_OBJECT(...)) in the main procedure

            'VideoPauseQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'url', qq.video_pause_url,
                        'stamps', qq.video_pause_stamps,
                        'question_ids', qq.video_pause_question_ids,
                        'assigned_pause_id', qq.assigned_pause_id,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'created_by_type', qq.created_by_type,
                        'updated_by', qq.updated_by,
                        'updated_by_type', qq.updated_by_type,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'video_pause' AND qq.is_active = TRUE
            ),

            'AudioPauseQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'url', qq.audio_pause_url,
                        'stamps', qq.audio_pause_stamps,
                        'question_ids', qq.audio_pause_question_ids,
                        'assigned_pause_id', qq.assigned_pause_id,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'created_by_type', qq.created_by_type,
                        'updated_by', qq.updated_by,
                        'updated_by_type', qq.updated_by_type,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'audio_pause' AND qq.is_active = TRUE
            ),

            'ArrangeOrderQuestions', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', qq.id,
                        'quiz_id', qq.quiz_id,
                        'arrangeorder_prompt', qq.arrangeorder_prompt,
                        'sentences', qq.sentences,
                        'correct_order', qq.correct_order,
                        'marks', qq.marks,
                        'created_by', qq.created_by,
                        'created_by_type', qq.created_by_type,
                        'updated_by', qq.updated_by,
                        'updated_by_type', qq.updated_by_type,
                        'created_at', DATE_FORMAT(qq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                        'updated_at', DATE_FORMAT(qq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                    )
                )
                FROM tbl_quiz_questions qq
                WHERE qq.quiz_id = q.id AND qq.type = 'arrangeorder' AND qq.is_active = TRUE
            ),
            'TextedBasedQuizTexts', (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', tbq.id,
                    'quiz_id', tbq.quiz_id,
                    'text', tbq.text,
                    'created_by', tbq.created_by,
                    'created_by_type', tbq.created_by_type,
                    'updated_by', tbq.updated_by,
                    'updated_by_type', tbq.updated_by_type,
                    'created_at', DATE_FORMAT(tbq.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                    'updated_at', DATE_FORMAT(tbq.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                    'FillInBlankQuestions', (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', fib.id,
                                'quizTextId', fib.quizTextId,
                                'text', fib.text,
                                'correctAnswer', fib.correctAnswer,
                                'created_by', fib.created_by,
                                'created_by_type', fib.created_by_type,
                                'updated_by', fib.updated_by,
                                'updated_by_type', fib.updated_by_type,
                                'created_at', DATE_FORMAT(fib.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                                'updated_at', DATE_FORMAT(fib.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                            )
                        )
                        FROM tbl_fill_in_blank_questions_gq fib
                        WHERE fib.quizTextId = tbq.id
                    ),
                    'TrueFalseQuestions', (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', tf.id,
                                'quizTextId', tf.quizTextId,
                                'text', tf.text,
                                'correctAnswer', tf.correctAnswer,
                                'created_by', tf.created_by,
                                'created_by_type', tf.created_by_type,
                                'updated_by', tf.updated_by,
                                'updated_by_type', tf.updated_by_type,
                                'created_at', DATE_FORMAT(tf.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                                'updated_at', DATE_FORMAT(tf.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                            )
                        )
                        FROM tbl_true_false_questions_gq tf
                        WHERE tf.quizTextId = tbq.id
                    ),
                    'MultipleChoiceQuestions', (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', mc.id,
                                'quizTextId', mc.quizTextId,
                                'text', mc.text,
                                'correctAnswer', mc.correctAnswer,
                                'options', mc.options,
                                'created_by', mc.created_by,
                                'created_by_type', mc.created_by_type,
                                'updated_by', mc.updated_by,
                                'updated_by_type', mc.updated_by_type,
                                'created_at', DATE_FORMAT(mc.created_at, '%Y-%m-%dT%H:%i:%s.%fZ'),
                                'updated_at', DATE_FORMAT(mc.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
                            )
                        )
                        FROM tbl_multiple_choice_questions_gq mc
                        WHERE mc.quizTextId = tbq.id
                    )
                )
            )
            FROM tbl_textbasedquiztext tbq
            WHERE tbq.quiz_id = q.id
        )
    )
) AS quizzes
FROM tbl_quiz q
WHERE q.module_id = v_module_id 
AND  EXISTS (
    SELECT 1
    FROM tbl_student_accessible_data sad
        WHERE sad.enrollment_id = v_enrollment_id
        AND sad.course_id = v_course_id
        AND JSON_CONTAINS(sad.quiz_ids, CAST(q.id AS JSON))
    );
END;
`);

        // // Update Quiz Status by ID ✅ (Tested)
        await sequelize.query(`DROP PROCEDURE IF EXISTS updateQuizStatusById`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS updateQuizStatusById(
    IN p_quiz_id INT,
    IN p_status ENUM('active', 'inactive')
)
BEGIN
    DECLARE v_exists INT;
    DECLARE v_type ENUM('normal', 'text_based');
    DECLARE v_total_questions INT DEFAULT 0;
    DECLARE v_topic_link_count INT DEFAULT 0;

    -- Check if quiz exists and get type
    SELECT id, quizType
    INTO v_exists, v_type
    FROM tbl_quiz
    WHERE id = p_quiz_id;

    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E404|NotFoundError|Quiz not found';
    END IF;

    -- Validate status input
    IF p_status NOT IN ('active', 'inactive') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E400|InvalidValueError|Invalid status value. Must be active or inactive.';
    END IF;

    -- Restrict direct status update if quiz is linked with a topic
    SELECT COUNT(*) INTO v_topic_link_count
    FROM tbl_topic_content
    WHERE quiz_id = p_quiz_id;

    IF v_topic_link_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'E409|ConflictError|Quiz status cannot be changed directly because it is included in a topic.';
    END IF;

    -- Only check if quiz type is normal and status is being set to active
    IF v_type = 'normal' AND p_status = 'active' THEN
        SELECT 
            (SELECT COUNT(*) 
             FROM tbl_quiz_questions 
             WHERE quiz_id = p_quiz_id AND is_active = 1) 
            +
            (SELECT COUNT(*) 
             FROM tbl_quiz_predefinedquestions qp
             JOIN tbl_pre_defined_questions pdq 
               ON qp.pre_defined_question_id = pdq.id
             WHERE qp.quiz_id = p_quiz_id AND pdq.is_active = 1)
        INTO v_total_questions;

        IF v_total_questions = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E400|ValidationError|Cannot activate quiz without at least one active question';
        END IF;
    END IF;

    -- Update status
    UPDATE tbl_quiz
    SET status = p_status,
        updated_at = NOW()
    WHERE id = p_quiz_id;

    -- Return updated quiz
    SELECT * FROM tbl_quiz WHERE id = p_quiz_id;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS updateQuizById`);
        await sequelize.query(`
      CREATE PROCEDURE updateQuizById(
  IN p_quiz_id INT,
  IN p_quiz_data JSON,
  IN p_updated_by INT,
  IN p_updated_by_type VARCHAR(20)
)
BEGIN
  DECLARE v_exists INT;
    DECLARE v_current_status VARCHAR(20);
    DECLARE v_topic_link_count INT DEFAULT 0;
  DECLARE v_title VARCHAR(255);
  DECLARE v_duration_minutes INT;
  DECLARE v_passing_score DECIMAL(5,2);
  DECLARE v_max_attempts INT;
  DECLARE v_attempts_gap INT;
  DECLARE v_status VARCHAR(20);
  DECLARE v_quizType VARCHAR(50);
  DECLARE v_attempts_renew_days INT;
  DECLARE v_isQuizCompulsory TINYINT(1);
  DECLARE v_isWarning TINYINT(1);
  DECLARE v_no_of_warning INT;

  -- Check if quiz exists
  SELECT COUNT(*) INTO v_exists FROM tbl_quiz WHERE id = p_quiz_id;
  IF v_exists = 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'E404|NotFoundError|Quiz not found';
  END IF;

    SELECT status INTO v_current_status
    FROM tbl_quiz
    WHERE id = p_quiz_id;

  -- Extract JSON values
  SET v_title = JSON_UNQUOTE(JSON_EXTRACT(p_quiz_data, '$.title'));
  SET v_duration_minutes = JSON_UNQUOTE(JSON_EXTRACT(p_quiz_data, '$.duration_minutes'));
  SET v_passing_score = JSON_UNQUOTE(JSON_EXTRACT(p_quiz_data, '$.passing_score'));
  SET v_max_attempts = JSON_UNQUOTE(JSON_EXTRACT(p_quiz_data, '$.max_attempts'));
  SET v_attempts_gap = JSON_UNQUOTE(JSON_EXTRACT(p_quiz_data, '$.attempts_gap'));
  SET v_status = JSON_UNQUOTE(JSON_EXTRACT(p_quiz_data, '$.status'));
  SET v_quizType = JSON_UNQUOTE(JSON_EXTRACT(p_quiz_data, '$.quizType'));
  SET v_attempts_renew_days = JSON_UNQUOTE(JSON_EXTRACT(p_quiz_data, '$.attempts_renew_days'));
  -- Do NOT directly assign boolean strings to tinyint vars; convert below
  SET v_no_of_warning = JSON_UNQUOTE(JSON_EXTRACT(p_quiz_data, '$.no_of_warning'));

  -- Convert boolean to int (false → 0, true → 1)
  SET v_isQuizCompulsory = CASE 
      WHEN JSON_UNQUOTE(JSON_EXTRACT(p_quiz_data, '$.isQuizCompulsory')) IN ('true', '1') THEN 1
      ELSE 0
  END;
    SET @raw_isWarning = JSON_UNQUOTE(JSON_EXTRACT(p_quiz_data, '$.isWarning'));
    IF @raw_isWarning IS NOT NULL THEN
        SET v_isWarning = CASE 
                WHEN @raw_isWarning IN ('true','1','TRUE','True') THEN 1
                WHEN @raw_isWarning IN ('false','0','FALSE','False') THEN 0
                ELSE 0
        END;
    ELSE
        SET v_isWarning = NULL; -- so COALESCE below keeps existing value
    END IF;
  SET v_no_of_warning = GREATEST(1, COALESCE(CAST(v_no_of_warning AS UNSIGNED), 1));

    -- Restrict only direct status changes when quiz is linked with a topic
    IF v_status IS NOT NULL AND v_status <> v_current_status THEN
        SELECT COUNT(*) INTO v_topic_link_count
        FROM tbl_topic_content
        WHERE quiz_id = p_quiz_id;

        IF v_topic_link_count > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'E409|ConflictError|Quiz status cannot be changed directly because it is included in a topic.';
        END IF;
    END IF;

  -- Perform the update
  UPDATE tbl_quiz
  SET
    title = COALESCE(v_title, title),
    duration_minutes = COALESCE(v_duration_minutes, duration_minutes),
    passing_score = COALESCE(v_passing_score, passing_score),
    max_attempts = COALESCE(v_max_attempts, max_attempts),
    attempts_gap = COALESCE(v_attempts_gap, attempts_gap),
    status = COALESCE(v_status, status),
    quizType = COALESCE(v_quizType, quizType),
    attempts_renew_days = COALESCE(v_attempts_renew_days, attempts_renew_days),
    isQuizCompulsory = COALESCE(v_isQuizCompulsory, isQuizCompulsory),
    isWarning = COALESCE(v_isWarning, isWarning),
    no_of_warning = COALESCE(v_no_of_warning, no_of_warning),
    updated_by = p_updated_by,
    updated_by_type = p_updated_by_type,
    updated_at = NOW()
  WHERE id = p_quiz_id;

  -- Return updated quiz
  SELECT * FROM tbl_quiz WHERE id = p_quiz_id;
END
    `);


        console.log("✅ Quiz procedures created successfully!");
    } catch (error) {
        console.error("❌ Error setting up quiz procedures:", error);
        throw error;
    }
};

module.exports = setupQuizProcedures;