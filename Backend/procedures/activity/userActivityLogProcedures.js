const sequelize = require('../../config/db');

const setupUserActivityLogProcedures = async () => {
  try {
    console.log('🔄 Setting up User Activity Log procedures...');

    // Adjust column to handle hashed IP length (64 hex chars) and potential IPv6
    // await sequelize.query("ALTER TABLE tbl_user_activity_log MODIFY COLUMN ip_address VARCHAR(128) NULL").catch(()=>{});

    // Recreate logUserActivity procedure with updated param length
    await sequelize.query('DROP PROCEDURE IF EXISTS logUserActivity');
    await sequelize.query(`CREATE PROCEDURE logUserActivity(
      IN p_user_id INT,
      IN p_user_identifier VARCHAR(191),
      IN p_event_category VARCHAR(32),
      IN p_event_action VARCHAR(64),
      IN p_outcome VARCHAR(10),
      IN p_entity_type VARCHAR(32),
      IN p_entity_id INT,
      IN p_session_token VARCHAR(255),
      IN p_ip_address VARCHAR(128),
      IN p_user_agent TEXT,
      IN p_metadata JSON,
      IN p_occurred_at DATETIME
    )
    BEGIN
      INSERT INTO tbl_user_activity_log(
        user_id,user_identifier,event_category,event_action,outcome,entity_type,entity_id,session_token,ip_address,user_agent,metadata,occurred_at,created_at,updated_at
      ) VALUES (
        p_user_id,p_user_identifier,p_event_category,p_event_action,p_outcome,p_entity_type,p_entity_id,p_session_token,p_ip_address,p_user_agent,p_metadata,IFNULL(p_occurred_at,NOW()),NOW(),NOW()
      );
    END`);

    // New: paginate distinct dates (descending) for sidebar
    await sequelize.query('DROP PROCEDURE IF EXISTS getUserActivityLogDates');
    await sequelize.query(`CREATE PROCEDURE getUserActivityLogDates(
      IN p_user_id INT,
      IN p_start DATETIME,
      IN p_end DATETIME,
      IN p_limit INT,
      IN p_offset INT
    )
    BEGIN
      DECLARE v_limit INT DEFAULT 30;
      DECLARE v_offset INT DEFAULT 0;
      IF p_limit IS NOT NULL THEN SET v_limit = p_limit; END IF;
      IF p_offset IS NOT NULL THEN SET v_offset = p_offset; END IF;
      SELECT DISTINCT DATE(occurred_at) AS activity_date
      FROM tbl_user_activity_log
      WHERE (p_user_id IS NULL OR user_id = p_user_id)
        AND (p_start IS NULL OR occurred_at >= p_start)
        AND (p_end IS NULL OR occurred_at <= p_end)
      ORDER BY activity_date DESC
      LIMIT v_limit OFFSET v_offset;
    END`);

    // New: logs for a specific date (descending time), excluding IP, include course title when entity_type='course'
    await sequelize.query('DROP PROCEDURE IF EXISTS getUserActivityLogsByDate');
    await sequelize.query(`CREATE PROCEDURE getUserActivityLogsByDate(
      IN p_user_id INT,
      IN p_date DATE,
      IN p_event_category VARCHAR(32),
      IN p_event_action VARCHAR(64),
      IN p_outcome VARCHAR(10),
      IN p_entity_type VARCHAR(32),
      IN p_limit INT,
      IN p_offset INT
    )
    BEGIN
      DECLARE v_limit INT DEFAULT 200;
      DECLARE v_offset INT DEFAULT 0;
      IF p_limit IS NOT NULL THEN SET v_limit = p_limit; END IF;
      IF p_offset IS NOT NULL THEN SET v_offset = p_offset; END IF;
      -- Course title join removed; course title now supplied in metadata.course_title for course events
      SELECT l.id,l.user_id,l.user_identifier,l.event_category,l.event_action,l.outcome,
        l.entity_type,l.entity_id,l.session_token,l.user_agent,l.metadata,l.occurred_at,l.created_at
      FROM tbl_user_activity_log l
      WHERE DATE(l.occurred_at)=p_date
        AND (p_user_id IS NULL OR l.user_id = p_user_id)
        AND (p_event_category IS NULL OR l.event_category = p_event_category)
        AND (p_event_action IS NULL OR l.event_action = p_event_action)
        AND (p_outcome IS NULL OR l.outcome = p_outcome)
        AND (p_entity_type IS NULL OR l.entity_type = p_entity_type)
      ORDER BY l.occurred_at DESC
      LIMIT v_limit OFFSET v_offset;
    END`);

    // New: metadata summary (categories, actions, sample metadata rows) for UI suggestions
    await sequelize.query('DROP PROCEDURE IF EXISTS getUserActivityLogMeta');
    await sequelize.query(`CREATE PROCEDURE getUserActivityLogMeta(
      IN p_user_id INT
    )
    BEGIN
      -- Distinct categories
      SELECT DISTINCT event_category AS v
      FROM tbl_user_activity_log
      WHERE (p_user_id IS NULL OR user_id = p_user_id)
        AND event_category IS NOT NULL AND event_category <> ''
      ORDER BY 1
      LIMIT 200;

      -- Distinct actions
      SELECT DISTINCT event_action AS v
      FROM tbl_user_activity_log
      WHERE (p_user_id IS NULL OR user_id = p_user_id)
        AND event_action IS NOT NULL AND event_action <> ''
      ORDER BY 1
      LIMIT 300;

      -- Recent metadata rows (JSON) for deriving keys in application layer
      SELECT metadata
      FROM tbl_user_activity_log
      WHERE (p_user_id IS NULL OR user_id = p_user_id)
        AND metadata IS NOT NULL
      ORDER BY occurred_at DESC
      LIMIT 500;
    END`);

    // Export logs generic procedure (single result set)
    await sequelize.query('DROP PROCEDURE IF EXISTS exportUserActivityLogs');
    await sequelize.query(`CREATE PROCEDURE exportUserActivityLogs(
      IN p_user_id INT,
      IN p_from DATETIME,
      IN p_to DATETIME,
      IN p_exact_date DATE,
      IN p_event_category VARCHAR(32),
      IN p_event_action VARCHAR(64),
      IN p_outcome VARCHAR(10),
      IN p_entity_type VARCHAR(32),
      IN p_limit INT
    )
    BEGIN
      DECLARE v_limit INT DEFAULT 50000;
      IF p_limit IS NOT NULL AND p_limit > 0 THEN SET v_limit = LEAST(p_limit, 100000); END IF;
      SELECT id, user_id, event_category, event_action, outcome, entity_type, entity_id, occurred_at, metadata
      FROM tbl_user_activity_log
      WHERE (p_user_id IS NULL OR user_id = p_user_id)
        AND (p_event_category IS NULL OR event_category = p_event_category)
        AND (p_event_action IS NULL OR event_action = p_event_action)
        AND (p_outcome IS NULL OR outcome = p_outcome)
        AND (p_entity_type IS NULL OR entity_type = p_entity_type)
        AND (
          (p_exact_date IS NOT NULL AND DATE(occurred_at) = p_exact_date)
          OR (
            p_exact_date IS NULL AND
            (p_from IS NULL OR occurred_at >= p_from) AND
            (p_to IS NULL OR occurred_at < p_to)
          )
        )
      ORDER BY occurred_at DESC
      LIMIT v_limit;
    END`);
  } catch (err) {
    console.error('❌ Error creating User Activity Log procedures:', err);
    throw err;
  }
};

module.exports = setupUserActivityLogProcedures;
