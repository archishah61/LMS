const sequelize = require("../../config/db");

const setUpSupportProcedure = async () => {
    try {
        console.log("🔄 Setting up Support procedures...");

        await sequelize.query(`DROP PROCEDURE IF EXISTS createSupportTicket`);
        await sequelize.query(`CREATE PROCEDURE createSupportTicket (
    IN p_user_id INT,
    IN p_title TEXT,
    IN p_description TEXT,
    IN p_category VARCHAR(50),
    IN p_status VARCHAR(50),
    IN p_related_id INT,
    IN p_related_type ENUM('course', 'topic', 'quiz', 'assignment', 'daily-challenge', 'challenge-quest', 'contest', 'cheatsheet', 'partner', 'user_auth', 'enrollment')
)
BEGIN
    DECLARE validCategory BOOLEAN DEFAULT TRUE;
    DECLARE validStatus BOOLEAN DEFAULT TRUE;

    proc : BEGIN

    -- Validate required fields
    IF p_user_id IS NULL OR p_title IS NULL OR p_description IS NULL THEN
        SELECT FALSE AS success, 'User, Title, and Description are required.' AS message, NULL AS ticket;
        LEAVE proc;
    END IF;

    -- Validate category
    IF p_category NOT IN ('Content', 'Technical', 'Access', 'Billing', 'Achievement', 'Communication', 'Other') THEN
        SET validCategory = FALSE;
    END IF;

    -- Validate status
    IF p_status NOT IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') THEN
        SET validStatus = FALSE;
    END IF;

    IF validCategory = FALSE THEN
        SELECT FALSE AS success,
               'Invalid category. Must be one of: Content, Technical, Access, Billing, Achievement, Communication, Other.' AS message,
               NULL AS ticket;
    ELSEIF validStatus = FALSE THEN
        SELECT FALSE AS success,
               'Invalid status. Must be one of: OPEN, IN_PROGRESS, RESOLVED, CLOSED.' AS message,
               NULL AS ticket;
    ELSE
        -- Insert into support ticket table
        INSERT INTO tbl_support_tickets (user_id, title, description, related_type, related_id, category, status, created_at, updated_at)
        VALUES (p_user_id, p_title, p_description, p_related_type, p_related_id, p_category, p_status, NOW(), NOW());

        -- Return inserted ticket
        SELECT TRUE AS success,
               'Support ticket created successfully.' AS message,
               (SELECT JSON_OBJECT(
                   'id', id,
                   'title', title,
                   'description', description,
                   'category', category,
                   'status', status,
                   'user_id', user_id,
                   'related_type', related_type,
                   'related_id', related_id,
                   'is_active', is_active,
                   'created_at', created_at,
                   'updated_at', updated_at
               )
               FROM tbl_support_tickets WHERE id = LAST_INSERT_ID() LIMIT 1) AS ticket;
    END IF;
    END proc;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getSupportTicketsWithDetails;`);
        await sequelize.query(`CREATE PROCEDURE getSupportTicketsWithDetails(
            IN p_status VARCHAR(50),
            IN p_category VARCHAR(50),
            IN p_search_term VARCHAR(255),
            IN p_limit INT,
            IN p_offset INT,
            IN p_is_all BOOLEAN
            )
BEGIN
    DECLARE v_limit BIGINT;
    DECLARE v_offset BIGINT;

    IF p_is_all = TRUE THEN
        SET v_limit = 9223372036854775807;
        SET v_offset = 0;
    ELSE
        SET v_limit = p_limit;
        SET v_offset = p_offset;
    END IF;
    
    SELECT COUNT(*) AS total_count                    
    FROM tbl_support_tickets st
    WHERE (p_status IS NULL OR st.status = p_status)
    AND (p_category IS NULL OR st.category = p_category)
    AND (p_search_term IS NULL OR p_search_term = ''
        OR st.title LIKE CONCAT('%', p_search_term, '%')
        OR st.description LIKE CONCAT('%', p_search_term, '%'));

    SELECT
        st.id,
        st.title,
        st.description,
        st.category,
        st.status,
        st.user_id,
        st.related_id,
        st.related_type,
        st.is_active,
        st.created_at,
        st.updated_at,

        -- Attachments directly linked to ticket
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', sa.id,
                    'file_url', sa.file_url,
                    'file_type', sa.file_type,
                    'ticket_id', sa.ticket_id,
                    'reply_id', sa.reply_id,
                    'uploaded_at', sa.uploaded_at
                )
            )
            FROM tbl_support_attachments sa
            WHERE sa.ticket_id = st.id AND sa.reply_id IS NULL
        ) AS SupportAttachments,

        -- Replies with their own attachments
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', sr.id,
                    'ticket_id', sr.ticket_id,
                    'user_id', sr.user_id,
                    'message', sr.message,
                    'created_at', sr.created_at,
                    'attachments', (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', sra.id,
                                'file_url', sra.file_url,
                                'file_type', sra.file_type,
                                'ticket_id', sra.ticket_id,
                                'reply_id', sra.reply_id,
                                'uploaded_at', sra.uploaded_at
                            )
                        )
                        FROM tbl_support_attachments sra
                        WHERE sra.reply_id = sr.id
                    )
                )
            )
            FROM tbl_support_replies sr
            WHERE sr.ticket_id = st.id
        ) AS SupportReplies,

        -- User details
        (
            SELECT JSON_OBJECT(
                'id', u.id,
                'full_name', u.full_name,
                'username', u.username,
                'email', u.email,
                'profile_image', u.profile_image,
                'mobile_no', u.mobile_no,
                'location', u.location,
                'session_token', u.session_token,
                'created_at', u.created_at,
                'updated_at', u.updated_at
            )
            FROM tbl_users u
            WHERE u.id = st.user_id
        ) AS User,

        -- Details
        CASE 
            WHEN st.related_type = 'course' THEN (
                SELECT JSON_OBJECT(
                    'id', c.id,
                    'public_hash', c.public_hash,
                    'sequence', c.sequence,
                    'title', c.title,
                    'description', c.description,
                    'category_id', c.category_id,
                    'thumbnail', c.thumbnail,
                    'preview_video', c.preview_video,
                    'price', c.price,
                    'discount', c.discount,
                    'duration_hours', c.duration_minutes,
                    'expiry_days', c.expiry_days,
                    'what_you_will_learn', c.what_you_will_learn,
                    'is_points_enrollable', c.is_points_enrollable,
                    'points_to_enroll', c.points_to_enroll,
                    'prerequisites', c.prerequisites,
                    'hashtags', c.hashtags,
                    'status', c.status,
                    'min_access_hours', c.min_access_minutes,
                    'max_access_hours', c.max_access_minutes,
                    'created_by', c.created_by,
                    'created_by_type', c.created_by_type,
                    'updated_by', c.updated_by,
                    'updated_by_type', c.updated_by_type,
                    'created_at', c.created_at,
                    'updated_at', c.updated_at
                )
            FROM tbl_courses c
            WHERE c.id = st.related_id
            ) 

            WHEN st.related_type = 'daily-challenge' THEN (
                SELECT JSON_OBJECT(
                    'id', dc.id,
                    'title', dc.title
                )
            FROM tbl_daily_challenges dc
            WHERE dc.id = st.related_id
            )

            WHEN st.related_type = 'challenge-quest' THEN (
                SELECT JSON_OBJECT(
                    'id', cq.id,
                    'title', cq.title
                )
            FROM tbl_challenges cq
            WHERE cq.id = st.related_id
            )

            WHEN st.related_type = 'contest' THEN (
                SELECT JSON_OBJECT(
                    'id', c.id,
                    'title', c.title
                )
            FROM tbl_contests c
            WHERE c.id = st.related_id
            )

            WHEN st.related_type = 'cheatsheet' THEN (
                SELECT JSON_OBJECT(
                    'id', cs.id,
                    'title', cs.title
                )
            FROM tbl_cheat_sheets cs
            WHERE cs.id = st.related_id
            )

            WHEN st.related_type = 'partner' THEN (
                SELECT JSON_OBJECT(
                    'id', p.id,
                    'user_id', p.user_id,
                    'partner_type', p.partner_type,
                    'name', p.name,
                    'email', p.email,
                    'phone', p.phone,
                    'organization_type', p.organization_type,
                    'contact_person_name', p.contact_person_name,
                    'contact_person_email', p.contact_person_email,
                    'contact_person_phone', p.contact_person_phone,
                    'website', p.website,
                    'description', p.description,
                    'logo', p.logo,
                    'status', p.status,
                    'roleId', p.roleId
                )
            FROM tbl_partners p
            WHERE p.id = st.related_id
            )

            WHEN st.related_type = 'assignment' THEN (
                SELECT JSON_OBJECT(
                    'id', a.id,
                    'title', a.title,
                    'description', a.description,
                    'module_id', m.id,
                    'module_title', m.title,
                    'module_public_hash', m.public_hash,
                    'session_id', s.id,
                    'session_title', s.title,
                    'session_public_hash', s.public_hash,
                    'course_id', c.id,
                    'course_title', c.title,
                    'course_public_hash', c.public_hash
                )
                FROM tbl_assignments a
                JOIN tbl_modules m ON a.module_id = m.id
                LEFT JOIN tbl_session s ON m.session_id = s.id
                JOIN tbl_courses c ON m.course_id = c.id
                WHERE a.id = st.related_id
            )

            WHEN st.related_type = 'quiz' THEN (
                SELECT JSON_OBJECT(
                    'id', q.id,
                    'title', q.title,
                    'module_id', m.id,
                    'module_title', m.title,
                    'module_public_hash', m.public_hash,
                    'session_id', s.id,
                    'session_title', s.title,
                    'session_public_hash', s.public_hash,
                    'course_id', c.id,
                    'course_title', c.title,
                    'course_public_hash', c.public_hash
                )
                FROM tbl_quiz q
                JOIN tbl_modules m ON q.module_id = m.id
                LEFT JOIN tbl_session s ON m.session_id = s.id
                JOIN tbl_courses c ON m.course_id = c.id
                WHERE q.id = st.related_id
            )

            WHEN st.related_type = 'topic' THEN (
                SELECT JSON_OBJECT(
                    'id', tp.id,
                    'title', tp.title,
                    'public_hash', tp.public_hash,
                    'module_id', m.id,
                    'module_title', m.title,
                    'module_public_hash', m.public_hash,
                    'session_id', s.id,
                    'session_title', s.title,
                    'session_public_hash', s.public_hash,
                    'course_id', c.id,
                    'course_title', c.title,
                    'course_public_hash', c.public_hash
                )
                FROM tbl_topics tp
                JOIN tbl_modules m ON tp.module_id = m.id
                LEFT JOIN tbl_session s ON m.session_id = s.id
                JOIN tbl_courses c ON m.course_id = c.id
                WHERE tp.id = st.related_id
            )

        ELSE NULL
        END AS RelatedDetails

    FROM tbl_support_tickets st
    WHERE (p_status IS NULL OR st.status = p_status)
    AND (p_category IS NULL OR st.category = p_category)
    AND (p_search_term IS NULL OR p_search_term = ''
        OR st.title LIKE CONCAT('%', p_search_term, '%')
        OR st.description LIKE CONCAT('%', p_search_term, '%'))
    ORDER BY st.created_at DESC
    LIMIT v_limit OFFSET v_offset;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getSupportTicketDetailsById`);
        await sequelize.query(`CREATE PROCEDURE getSupportTicketDetailsById(IN ticketId INT)
BEGIN
    DECLARE userId INT;
    DECLARE relatedId INT;
    DECLARE relatedType INT;

    -- Get the user_id and related_id from the ticket
    SELECT user_id, related_id, related_type INTO userId, relatedId, relatedType 
    FROM tbl_support_tickets 
    WHERE id = ticketId;
    
    -- Check if ticket exists
    IF userId IS NULL THEN
        SELECT 
            FALSE AS success,
            'Ticket not found.' AS message;
    ELSE
        -- Return combined result as JSON structure
        SELECT 
            TRUE AS success,
            JSON_OBJECT(
                'id', t.id,
                'title', t.title,
                'description', t.description,
                'category', t.category,
                'status', t.status,
                'user_id', t.user_id,
                'related_id', t.related_id,
                'related_type', t.related_type,
                'is_active', t.is_active,
                'created_at', t.created_at,
                'updated_at', t.updated_at,
                'SupportReplies', (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', sr.id,
                            'ticket_id', sr.ticket_id,
                            'user_id', sr.user_id,
                            'message', sr.message,
                            'created_at', sr.created_at,
                            'updated_at', sr.updated_at,
                            'SupportAttachments', (
                                SELECT JSON_ARRAYAGG(
                                    JSON_OBJECT(
                                        'id', sa.id,
                                        'reply_id', sa.reply_id,
                                        'ticket_id', sa.ticket_id,
                                        'file_url', sa.file_url,
                                        'file_type', sa.file_type
                                    )
                                )
                                FROM tbl_support_attachments sa
                                WHERE sa.reply_id = sr.id
                            )
                        )
                    )
                    FROM tbl_support_replies sr
                    WHERE sr.ticket_id = t.id
                    ORDER BY sr.created_at ASC
                ),
                'SupportAttachments', (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', sa.id,
                            'ticket_id', sa.ticket_id,
                            'reply_id', sa.reply_id,
                            'file_url', sa.file_url,
                            'file_type', sa.file_type
                        )
                    )
                    FROM tbl_support_attachments sa
                    WHERE sa.ticket_id = t.id AND sa.reply_id IS NULL
                ),
                'User', (
                    SELECT JSON_OBJECT(
                        'id', u.id,
                        'full_name', u.full_name,
                        'username', u.username,
                        'email', u.email,
                        'profile_image', u.profile_image,
                        'mobile_no', u.mobile_no,
                        'location', u.location,
                        'session_token', u.session_token,
                        'created_at', u.created_at,
                        'updated_at', u.updated_at
                    )
                    FROM tbl_users u
                    WHERE u.id = t.user_id
                ),
                'SupportResolutionLog', (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', srl.id,
                        'ticket_id', srl.ticket_id,
                        'resolution_note', srl.resolution_note,
                        'resolved_at', srl.resolved_at
                    )
                )
                FROM tbl_support_resolution_logs srl
                WHERE srl.ticket_id = t.id
                ORDER BY srl.resolved_at ASC
                ),
                'RelatedDetails', (
                    -- Details
                    CASE 
                        WHEN t.related_type = 'course' THEN (
                            SELECT JSON_OBJECT(
                                'id', c.id,
                                'public_hash', c.public_hash,
                                'sequence', c.sequence,
                                'title', c.title,
                                'description', c.description,
                                'category_id', c.category_id,
                                'thumbnail', c.thumbnail,
                                'preview_video', c.preview_video,
                                'price', c.price,
                                'discount', c.discount,
                                'duration_hours', c.duration_minutes,
                                'expiry_days', c.expiry_days,
                                'what_you_will_learn', c.what_you_will_learn,
                                'is_points_enrollable', c.is_points_enrollable,
                                'points_to_enroll', c.points_to_enroll,
                                'prerequisites', c.prerequisites,
                                'hashtags', c.hashtags,
                                'status', c.status,
                                'min_access_hours', c.min_access_minutes,
                                'max_access_hours', c.max_access_minutes,
                                'created_by', c.created_by,
                                'created_by_type', c.created_by_type,
                                'updated_by', c.updated_by,
                                'updated_by_type', c.updated_by_type,
                                'created_at', c.created_at,
                                'updated_at', c.updated_at
                            )
                        FROM tbl_courses c
                        WHERE c.id = t.related_id
                        ) 

                        WHEN t.related_type = 'daily-challenge' THEN (
                            SELECT JSON_OBJECT(
                                'id', dc.id,
                                'title', dc.title
                            )
                        FROM tbl_daily_challenges dc
                        WHERE dc.id = t.related_id
                        )

                        WHEN t.related_type = 'challenge-quest' THEN (
                            SELECT JSON_OBJECT(
                                'id', cq.id,
                                'title', cq.title
                            )
                        FROM tbl_challenges cq
                        WHERE cq.id = t.related_id
                        )

                        WHEN t.related_type = 'contest' THEN (
                            SELECT JSON_OBJECT(
                                'id', c.id,
                                'title', c.title
                            )
                        FROM tbl_contests c
                        WHERE c.id = t.related_id
                        )

                        WHEN t.related_type = 'cheatsheet' THEN (
                            SELECT JSON_OBJECT(
                                'id', cs.id,
                                'title', cs.title
                            )
                        FROM tbl_cheat_sheets cs
                        WHERE cs.id = t.related_id
                        )

                        WHEN t.related_type = 'partner' THEN (
                            SELECT JSON_OBJECT(
                                'id', p.id,
                                'user_id', p.user_id,
                                'partner_type', p.partner_type,
                                'name', p.name,
                                'email', p.email,
                                'phone', p.phone,
                                'organization_type', p.organization_type,
                                'contact_person_name', p.contact_person_name,
                                'contact_person_email', p.contact_person_email,
                                'contact_person_phone', p.contact_person_phone,
                                'website', p.website,
                                'description', p.description,
                                'logo', p.logo,
                                'status', p.status,
                                'roleId', p.roleId
                            )
                        FROM tbl_partners p
                        WHERE p.id = t.related_id
                        )

                        WHEN t.related_type = 'assignment' THEN (
                            SELECT JSON_OBJECT(
                                'id', a.id,
                                'title', a.title,
                                'description', a.description,
                                'module_id', m.id,
                                'module_title', m.title,
                                'module_public_hash', m.public_hash,
                                'session_id', s.id,
                                'session_title', s.title,
                                'session_public_hash', s.public_hash,
                                'course_id', c.id,
                                'course_title', c.title,
                                'course_public_hash', c.public_hash
                            )
                            FROM tbl_assignments a
                            JOIN tbl_modules m ON a.module_id = m.id
                            LEFT JOIN tbl_session s ON m.session_id = s.id
                            JOIN tbl_courses c ON m.course_id = c.id
                            WHERE a.id = t.related_id
                        )

                        WHEN t.related_type = 'quiz' THEN (
                            SELECT JSON_OBJECT(
                                'id', q.id,
                                'title', q.title,
                                'module_id', m.id,
                                'module_title', m.title,
                                'module_public_hash', m.public_hash,
                                'session_id', s.id,
                                'session_title', s.title,
                                'session_public_hash', s.public_hash,
                                'course_id', c.id,
                                'course_title', c.title,
                                'course_public_hash', c.public_hash
                            )
                            FROM tbl_quiz q
                            JOIN tbl_modules m ON q.module_id = m.id
                            LEFT JOIN tbl_session s ON m.session_id = s.id
                            JOIN tbl_courses c ON m.course_id = c.id
                            WHERE q.id = t.related_id
                        )

                        WHEN t.related_type = 'topic' THEN (
                            SELECT JSON_OBJECT(
                                'id', tp.id,
                                'title', tp.title,
                                'public_hash', tp.public_hash,
                                'module_id', m.id,
                                'module_title', m.title,
                                'module_public_hash', m.public_hash,
                                'session_id', s.id,
                                'session_title', s.title,
                                'session_public_hash', s.public_hash,
                                'course_id', c.id,
                                'course_title', c.title,
                                'course_public_hash', c.public_hash
                            )
                            FROM tbl_topics tp
                            JOIN tbl_modules m ON tp.module_id = m.id
                            LEFT JOIN tbl_session s ON m.session_id = s.id
                            JOIN tbl_courses c ON m.course_id = c.id
                            WHERE tp.id = t.related_id
                        )

                    ELSE NULL
                    END
                )
            ) AS ticket
        FROM tbl_support_tickets t
        WHERE t.id = ticketId;
    END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getSupportTicketsByUser`)
        await sequelize.query(`CREATE PROCEDURE getSupportTicketsByUser(IN p_user_id INT)
BEGIN
    SELECT
        st.id,
        st.title,
        st.description,
        st.category,
        st.status,
        st.user_id,
        st.related_id,
        st.related_type,
        st.is_active,
        st.created_at,
        st.updated_at,

        -- Attachments directly linked to ticket
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', sa.id,
                    'file_url', sa.file_url,
                    'file_type', sa.file_type,
                    'ticket_id', sa.ticket_id,
                    'reply_id', sa.reply_id,
                    'uploaded_at', sa.uploaded_at
                )
            )
            FROM tbl_support_attachments sa
            WHERE sa.ticket_id = st.id AND sa.reply_id IS NULL
        ) AS SupportAttachments,

        -- Replies with their own attachments
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', sr.id,
                    'ticket_id', sr.ticket_id,
                    'user_id', sr.user_id,
                    'message', sr.message,
                    'created_at', sr.created_at,
                    'attachments', (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', sra.id,
                                'file_url', sra.file_url,
                                'file_type', sra.file_type,
                                'ticket_id', sra.ticket_id,
                                'reply_id', sra.reply_id,
                                'uploaded_at', sra.uploaded_at
                            )
                        )
                        FROM tbl_support_attachments sra
                        WHERE sra.reply_id = sr.id
                    )
                )
            )
            FROM tbl_support_replies sr
            WHERE sr.ticket_id = st.id
        ) AS SupportReplies,

        -- User details
        (
            SELECT JSON_OBJECT(
                'id', u.id,
                'full_name', u.full_name,
                'username', u.username,
                'email', u.email,
                'profile_image', u.profile_image,
                'mobile_no', u.mobile_no,
                'location', u.location,
                'session_token', u.session_token,
                'created_at', u.created_at,
                'updated_at', u.updated_at
            )
            FROM tbl_users u
            WHERE u.id = st.user_id
        ) AS User,

        -- Details
        CASE 
            WHEN st.related_type = 'course' THEN (
                SELECT JSON_OBJECT(
                    'id', c.id,
                    'public_hash', c.public_hash,
                    'sequence', c.sequence,
                    'title', c.title,
                    'description', c.description,
                    'category_id', c.category_id,
                    'thumbnail', c.thumbnail,
                    'preview_video', c.preview_video,
                    'price', c.price,
                    'discount', c.discount,
                    'duration_hours', c.duration_minutes,
                    'expiry_days', c.expiry_days,
                    'what_you_will_learn', c.what_you_will_learn,
                    'is_points_enrollable', c.is_points_enrollable,
                    'points_to_enroll', c.points_to_enroll,
                    'prerequisites', c.prerequisites,
                    'hashtags', c.hashtags,
                    'status', c.status,
                    'min_access_hours', c.min_access_minutes,
                    'max_access_hours', c.max_access_minutes,
                    'created_by', c.created_by,
                    'created_by_type', c.created_by_type,
                    'updated_by', c.updated_by,
                    'updated_by_type', c.updated_by_type,
                    'created_at', c.created_at,
                    'updated_at', c.updated_at
                )
            FROM tbl_courses c
            WHERE c.id = st.related_id
            ) 

            WHEN st.related_type = 'daily-challenge' THEN (
                SELECT JSON_OBJECT(
                    'id', dc.id,
                    'title', dc.title
                )
            FROM tbl_daily_challenges dc
            WHERE dc.id = st.related_id
            )

            WHEN st.related_type = 'challenge-quest' THEN (
                SELECT JSON_OBJECT(
                    'id', cq.id,
                    'title', cq.title
                )
            FROM tbl_challenges cq
            WHERE cq.id = st.related_id
            )

            WHEN st.related_type = 'contest' THEN (
                SELECT JSON_OBJECT(
                    'id', c.id,
                    'title', c.title
                )
            FROM tbl_contests c
            WHERE c.id = st.related_id
            )

            WHEN st.related_type = 'cheatsheet' THEN (
                SELECT JSON_OBJECT(
                    'id', cs.id,
                    'title', cs.title
                )
            FROM tbl_cheat_sheets cs
            WHERE cs.id = st.related_id
            )

            WHEN st.related_type = 'partner' THEN (
                SELECT JSON_OBJECT(
                    'id', p.id,
                    'user_id', p.user_id,
                    'partner_type', p.partner_type,
                    'name', p.name,
                    'email', p.email,
                    'phone', p.phone,
                    'organization_type', p.organization_type,
                    'contact_person_name', p.contact_person_name,
                    'contact_person_email', p.contact_person_email,
                    'contact_person_phone', p.contact_person_phone,
                    'website', p.website,
                    'description', p.description,
                    'logo', p.logo,
                    'status', p.status,
                    'roleId', p.roleId
                )
            FROM tbl_partners p
            WHERE p.id = st.related_id
            )

            WHEN st.related_type = 'assignment' THEN (
                SELECT JSON_OBJECT(
                    'id', a.id,
                    'title', a.title,
                    'description', a.description,
                    'module_id', m.id,
                    'module_title', m.title,
                    'module_public_hash', m.public_hash,
                    'session_id', s.id,
                    'session_title', s.title,
                    'session_public_hash', s.public_hash,
                    'course_id', c.id,
                    'course_title', c.title,
                    'course_public_hash', c.public_hash
                )
                FROM tbl_assignments a
                JOIN tbl_modules m ON a.module_id = m.id
                LEFT JOIN tbl_session s ON m.session_id = s.id
                JOIN tbl_courses c ON m.course_id = c.id
                WHERE a.id = st.related_id
            )

            WHEN st.related_type = 'quiz' THEN (
                SELECT JSON_OBJECT(
                    'id', q.id,
                    'title', q.title,
                    'module_id', m.id,
                    'module_title', m.title,
                    'module_public_hash', m.public_hash,
                    'session_id', s.id,
                    'session_title', s.title,
                    'session_public_hash', s.public_hash,
                    'course_id', c.id,
                    'course_title', c.title,
                    'course_public_hash', c.public_hash
                )
                FROM tbl_quiz q
                JOIN tbl_modules m ON q.module_id = m.id
                LEFT JOIN tbl_session s ON m.session_id = s.id
                JOIN tbl_courses c ON m.course_id = c.id
                WHERE q.id = st.related_id
            )

            WHEN st.related_type = 'topic' THEN (
                SELECT JSON_OBJECT(
                    'id', tp.id,
                    'title', tp.title,
                    'public_hash', tp.public_hash,
                    'module_id', m.id,
                    'module_title', m.title,
                    'module_public_hash', m.public_hash,
                    'session_id', s.id,
                    'session_title', s.title,
                    'session_public_hash', s.public_hash,
                    'course_id', c.id,
                    'course_title', c.title,
                    'course_public_hash', c.public_hash
                )
                FROM tbl_topics tp
                JOIN tbl_modules m ON tp.module_id = m.id
                LEFT JOIN tbl_session s ON m.session_id = s.id
                JOIN tbl_courses c ON m.course_id = c.id
                WHERE tp.id = st.related_id
            )

        ELSE NULL
        END AS RelatedDetails

    FROM tbl_support_tickets st
    WHERE st.user_id = p_user_id
    ORDER BY st.created_at DESC;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS createSupportAttachment`);
        await sequelize.query(`CREATE PROCEDURE createSupportAttachment(
    IN fileUrl VARCHAR(255),
    IN fileType VARCHAR(100),
    IN ticketId INT,
    IN replyId INT
)
BEGIN
    INSERT INTO tbl_support_attachments (
        file_url,
        file_type,
        ticket_id,
        reply_id,
        uploaded_at
    ) VALUES (
        fileUrl,
        fileType,
        ticketId,
        replyId,
        NOW()
    );
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS updateSupportTicketById;`);
        await sequelize.query(`CREATE PROCEDURE updateSupportTicketById (
    IN ticketId INT,
    IN newTitle TEXT,
    IN newDescription TEXT,
    IN newCategory VARCHAR(50),
    IN newStatus VARCHAR(50),
    IN resolutionNote TEXT
)
BEGIN
    DECLARE ticketExists INT DEFAULT 0;
    DECLARE validCategory BOOLEAN DEFAULT TRUE;
    DECLARE validStatus BOOLEAN DEFAULT TRUE;
    DECLARE currentStatus VARCHAR(50);
    proc : BEGIN
    -- Check ticket existence
    SELECT COUNT(*) INTO ticketExists FROM tbl_support_tickets WHERE id = ticketId;

    IF ticketExists = 0 THEN
        SELECT FALSE AS success, 'Ticket not found.' AS message;
        LEAVE proc;
    END IF;

    -- Validate category if provided
    IF newCategory IS NOT NULL AND newCategory NOT IN ('Content', 'Technical', 'Access', 'Billing', 'Achievement', 'Communication', 'Other') THEN
        SET validCategory = FALSE;
    END IF;

    -- Validate status if provided
    IF newStatus IS NOT NULL AND newStatus NOT IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') THEN
        SET validStatus = FALSE;
    END IF;

    IF validCategory = FALSE THEN
        SELECT FALSE AS success, 'Invalid category. Must be one of: Content, Technical, Access, Billing, Achievement, Communication, Other.' AS message;
    ELSEIF validStatus = FALSE THEN
        SELECT FALSE AS success, 'Invalid status. Must be one of: OPEN, IN_PROGRESS, RESOLVED, CLOSED.' AS message;
    ELSE

        SELECT status INTO currentStatus FROM tbl_support_tickets WHERE id = ticketId;

        -- Perform update
        UPDATE tbl_support_tickets
        SET 
            title = COALESCE(newTitle, title),
            description = COALESCE(newDescription, description),
            category = COALESCE(newCategory, category),
            status = COALESCE(newStatus, status)
        WHERE id = ticketId;
        
        -- Insert into resolution log only if status changed and newStatus is RESOLVED
        IF newStatus != currentStatus THEN
            INSERT INTO tbl_support_resolution_logs (ticket_id, resolution_note, resolved_at)
            VALUES (ticketId, newStatus, NOW());
        END IF;

        -- Return updated row with success message
            SELECT TRUE AS success, 
                   'Ticket updated successfully.' AS message,
                   (SELECT JSON_OBJECT(
                        'id', id,
                        'title', title,
                        'description', description,
                        'category', category,
                        'status', status,
                        'user_id', user_id,
                        'related_id', related_id,
                        'related_type', related_type,
                        'is_active', is_active,
                        'created_at', created_at,
                        'updated_at', updated_at
                    )
                   FROM tbl_support_tickets WHERE id = ticketId) AS ticket;

        END IF;
    END proc;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS deleteSupportTicketById`);
        await sequelize.query(`CREATE PROCEDURE deleteSupportTicketById(IN ticketId INT)
BEGIN
    DECLARE ticketExists INT DEFAULT 0;

    -- Check if ticket exists
    SELECT COUNT(*) INTO ticketExists FROM tbl_support_tickets WHERE id = ticketId;

    IF ticketExists = 0 THEN
        SELECT FALSE AS success, 'Ticket not found.' AS message;
    ELSE
        -- Delete attachments directly linked to ticket
        DELETE FROM tbl_support_attachments WHERE ticket_id = ticketId AND reply_id IS NULL;

        -- Delete attachments linked to replies
        DELETE FROM tbl_support_attachments 
        WHERE reply_id IN (SELECT id FROM tbl_support_replies WHERE ticket_id = ticketId);

        -- Delete replies
        DELETE FROM tbl_support_replies WHERE ticket_id = ticketId;

        -- Delete the ticket
        DELETE FROM tbl_support_tickets WHERE id = ticketId;

        SELECT TRUE AS success, 'Ticket deleted successfully.' AS message;
    END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS createSupportReply`);
        await sequelize.query(`CREATE PROCEDURE createSupportReply(
    IN p_ticket_id INT,
    IN p_user_id INT,
    IN p_admin_id INT,
    IN p_message TEXT
)
BEGIN
    DECLARE ticket_exists INT DEFAULT 0;

    -- Check if ticket exists
    SELECT COUNT(*) INTO ticket_exists FROM tbl_support_tickets WHERE id = p_ticket_id;

    -- Input validation
    IF p_ticket_id IS NULL OR (p_user_id IS NULL AND p_admin_id IS NULL) OR p_message IS NULL THEN
        SELECT FALSE AS success, 'ticket_id, message and one of UserId or AdminId are required.' AS message_out;
    ELSEIF ticket_exists = 0 THEN
        SELECT FALSE AS success, 'Ticket not found.' AS message_out;
    ELSE
        -- Insert reply
        INSERT INTO tbl_support_replies (
            ticket_id,
            user_id,
            admin_id,
            message,
            created_at,
            updated_at
        ) VALUES (
            p_ticket_id,
            p_user_id,
            p_admin_id,
            p_message,
            NOW(),
            NOW()
        );

        SELECT TRUE AS success, 'Reply added successfully.' AS message_out, LAST_INSERT_ID() AS reply_id;
    END IF;
END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS deleteSupportReply`);
        await sequelize.query(`CREATE PROCEDURE deleteSupportReply(
    IN p_reply_id INT
)
BEGIN
    DECLARE reply_exists INT DEFAULT 0;

    -- Check if reply exists
    SELECT COUNT(*) INTO reply_exists FROM tbl_support_replies WHERE id = p_reply_id;

    IF reply_exists = 0 THEN
        SELECT FALSE AS success, 'Reply not found.' AS message_out;
    ELSE
        DELETE FROM tbl_support_attachments WHERE reply_id = p_reply_id;
        DELETE FROM tbl_support_replies WHERE id = p_reply_id;

        SELECT TRUE AS success, 'Reply deleted successfully.' AS message_out;
    END IF;
END`);

        console.log("✅ Support procedures created!");
    } catch (error) {
        console.error("❌ Error setting up Support procedures:", error);
        throw error;
    }
};

module.exports = setUpSupportProcedure;
