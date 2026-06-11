const sequelize = require("../../config/db");

const setupTopicContentProcedures = async () => {

  console.log("🔄 Setting up TopicContent procedures...");
  try {
    // assignContentToTopic
    await sequelize.query(`
  -- assignContentToTopic
CREATE PROCEDURE IF NOT EXISTS assignContentToTopic(
  IN p_module_hash VARCHAR(255),  -- Accepting public_hash of the module
  IN p_topic_id INT,
  IN p_assignment_id INT,
  IN p_quiz_id INT,
  IN p_created_by INT,
  IN p_updated_by INT
)
BEGIN
  DECLARE v_module_id INT;
  DECLARE v_content_id INT;

  -- Fetch the actual module_id using the public_hash
  SELECT id INTO v_module_id
  FROM tbl_modules
  WHERE public_hash = p_module_hash;

  IF v_module_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|ModuleNotFoundError|The module with the provided hash does not exist.';
  END IF;

  -- Validate inputs
  IF p_topic_id IS NULL OR (p_assignment_id IS NULL AND p_quiz_id IS NULL) OR p_created_by IS NULL OR p_updated_by IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|MissingFieldError|All fields are required.';
  END IF;

  -- Check if content already exists for this topic
  SELECT id INTO v_content_id
  FROM tbl_topic_content
  WHERE topic_id = p_topic_id 
  AND (
    (p_assignment_id IS NOT NULL AND assignment_id = p_assignment_id) OR
    (p_quiz_id IS NOT NULL AND quiz_id = p_quiz_id)
  );

  -- If content exists, update it
  IF v_content_id IS NOT NULL THEN
    UPDATE tbl_topic_content
    SET updated_by = p_updated_by,
        updated_at = NOW()
    WHERE id = v_content_id;
  ELSE
    -- Insert new content
    INSERT INTO tbl_topic_content (
      module_id,
      topic_id,
      assignment_id,
      quiz_id,
      created_by,
      updated_by,
      created_at,
      updated_at
    ) VALUES (
      v_module_id,
      p_topic_id,
      p_assignment_id,
      p_quiz_id,
      p_created_by,
      p_updated_by,
      NOW(),
      NOW()
    );
  END IF;

  -- Return success message
  SELECT 'Content assigned to topic successfully' AS message;
END;
`);


    // RemoveContentFromTopic
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS removeContentFromTopic(
  IN p_topic_id INT,
  IN p_assignment_id INT,
  IN p_quiz_id INT
)
BEGIN
  -- Validate inputs
  IF p_topic_id IS NULL OR (p_assignment_id IS NULL AND p_quiz_id IS NULL) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E400|MissingFieldError|topic_id and either assignment_id or quiz_id are required.';
  END IF;

  -- Delete the content
  DELETE FROM tbl_topic_content
  WHERE topic_id = p_topic_id 
  AND (
    (p_assignment_id IS NOT NULL AND assignment_id = p_assignment_id) OR
    (p_quiz_id IS NOT NULL AND quiz_id = p_quiz_id)
  );

  -- Check if any rows were affected
  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E404|NotFoundError|Content not found for the given parameters.';
  END IF;

  -- Return confirmation
  SELECT 'Content removed from topic successfully' AS message;
END;
    `);

    // GetTopicContentByTopicId
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS getTopicContentByTopicId(
        IN p_topic_id INT
      )
      BEGIN
        SELECT
          tc.id,
          tc.module_id,
          tc.topic_id,
          tc.assignment_id,
          tc.quiz_id,
          tc.created_by,
          tc.updated_by,
          tc.created_at,
          tc.updated_at
        FROM tbl_topic_content tc
        WHERE tc.topic_id = p_topic_id;
      END;
    `);

    // GetTopicContentByModuleId
    await sequelize.query(`
      CREATE PROCEDURE IF NOT EXISTS getTopicContentByModuleId(
        IN p_module_id INT
      )
      BEGIN
        SELECT
          tc.id,
          tc.module_id,
          tc.topic_id,
          tc.assignment_id,
          tc.quiz_id,
          tc.created_by,
          tc.updated_by,
          tc.created_at,
          tc.updated_at
        FROM tbl_topic_content tc
        WHERE tc.module_id = p_module_id;
      END;
    `);

    console.log("✅ TopicContent procedures created successfully");
  } catch (error) {
    console.error("❌ Error creating TopicContent procedures:", error);
  }
};

module.exports = setupTopicContentProcedures;
