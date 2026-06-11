const sequelize = require("../../config/db");

const setupAssignmentExtensionRequestProcedures = async () => {
    try {
        console.log("🔄 Setting up Assignment Extension Request procedures...");

        // Create a new extension request with duplicate check
        await sequelize.query(`
            CREATE PROCEDURE IF NOT EXISTS createAssignmentExtensionRequest(
                IN p_assignmentId INT,
                IN p_userId INT,
                IN p_reason TEXT,
                IN p_createdBy INT
            )
            BEGIN
                DECLARE pending_count INT DEFAULT 0;

                SELECT COUNT(*) INTO pending_count
                FROM tbl_assignment_extension_requests
                WHERE assignmentId = p_assignmentId
                  AND userId = p_userId
                  AND status = 'Pending';

                IF pending_count > 0 THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'E409|AlreadyPending|You already have a pending request for this assignment.';
                END IF;

                INSERT INTO tbl_assignment_extension_requests (
                    assignmentId, userId, reason, status, created_by, updated_by, created_at, updated_at
                ) VALUES (
                    p_assignmentId, p_userId, p_reason, 'Pending', p_createdBy, NULL, NOW(), NOW()
                );

                SELECT * FROM tbl_assignment_extension_requests WHERE id = LAST_INSERT_ID();
            END
        `);

        // Get all extension requests with joins to assignment and user
        await sequelize.query('DROP PROCEDURE IF EXISTS getAllAssignmentExtensionRequests')
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getAllAssignmentExtensionRequests(
                IN p_role ENUM('partner', 'admin'),
                IN p_id INT,
                IN p_search_term VARCHAR(255),
                IN p_status VARCHAR(255),
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
                FROM tbl_assignment_extension_requests aer
                JOIN tbl_assignments a ON a.id = aer.assignmentId
                JOIN tbl_users u ON u.id = aer.userId
                WHERE 
                    (p_role = 'admin' 
                        OR (p_role = 'partner' AND a.created_by = p_id AND a.created_by_type = 'partner'))
                    AND (p_status IS NULL OR p_status = 'all' OR aer.status = p_status)
                    AND (p_search_term IS NULL OR p_search_term = '' OR 
                        a.title LIKE CONCAT('%', p_search_term, '%') OR
                        u.email LIKE CONCAT('%', p_search_term, '%') OR
                        u.username LIKE CONCAT('%', p_search_term, '%'));

                SELECT 
                    aer.*, 
                    a.id AS assignment_id,
                    a.title AS assignment_title,
                    u.id AS user_id,
                    u.username,
                    u.email
                FROM tbl_assignment_extension_requests aer
                JOIN tbl_assignments a ON a.id = aer.assignmentId
                JOIN tbl_users u ON u.id = aer.userId
                WHERE (p_role = 'admin' OR (p_role = 'partner' AND a.created_by = p_id AND a.created_by_type = 'partner'))
                        AND (p_status IS NULL OR p_status = 'all' OR aer.status = p_status)
                        AND (p_search_term IS NULL OR p_search_term = '' OR 
                            a.title LIKE CONCAT('%', p_search_term, '%') OR
                            u.email LIKE CONCAT('%', p_search_term, '%') OR
                            u.username LIKE CONCAT('%', p_search_term, '%'))
                ORDER BY aer.created_at DESC
                LIMIT v_limit OFFSET v_offset;
            END
        `);

        // Handle approve/reject of a request and optionally update assignment completion
        await sequelize.query(`
            DROP PROCEDURE IF EXISTS handleAssignmentExtensionRequest;
        `);
        await sequelize.query(`
            CREATE PROCEDURE handleAssignmentExtensionRequest(
                IN p_requestId INT,
                IN p_status VARCHAR(20),
                IN p_approved_due_date DATETIME,
                IN p_admin_response TEXT,
                IN p_adminId INT
            )
            BEGIN
                DECLARE v_exists INT DEFAULT 0;
                DECLARE v_current_status VARCHAR(20);
                DECLARE v_assignmentId INT;
                DECLARE v_userId INT;

                -- Check existence first to satisfy ONLY_FULL_GROUP_BY
                SELECT COUNT(*) INTO v_exists
                FROM tbl_assignment_extension_requests
                WHERE id = p_requestId;

                IF v_exists = 0 THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'E404|NotFound|Request not found';
                END IF;

                -- Fetch the needed columns separately
                SELECT status, assignmentId, userId
                INTO v_current_status, v_assignmentId, v_userId
                FROM tbl_assignment_extension_requests
                WHERE id = p_requestId
                LIMIT 1;

                IF v_current_status <> 'Pending' THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'E400|AlreadyProcessed|This request has already been processed.';
                END IF;

                IF p_status = 'Approved' AND p_approved_due_date IS NULL THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'E400|Validation|Approved due date is required when approving.';
                END IF;

                UPDATE tbl_assignment_extension_requests
                SET status = p_status,
                    admin_response = p_admin_response,
                    approved_due_date = CASE WHEN p_status = 'Approved' THEN p_approved_due_date ELSE approved_due_date END,
                    updated_by = p_adminId,
                    updated_at = NOW()
                WHERE id = p_requestId;

                IF p_status = 'Approved' THEN
                    UPDATE tbl_assignment_completion
                    SET due_date = p_approved_due_date,
                        updated_by = p_adminId,
                        updated_at = NOW()
                    WHERE assignmentId = v_assignmentId AND userId = v_userId;
                END IF;

                SELECT * FROM tbl_assignment_extension_requests WHERE id = p_requestId;
            END
        `);

        // Get all requests for a specific user with assignment details
        await sequelize.query(`
            CREATE PROCEDURE IF NOT EXISTS getAssignmentExtensionRequestsByUser(
                IN p_userId INT
            )
            BEGIN
                SELECT 
                    aer.*,
                    a.id AS assignment_id,
                    a.title AS assignment_title
                FROM tbl_assignment_extension_requests aer
                JOIN tbl_assignments a ON a.id = aer.assignmentId
                WHERE aer.userId = p_userId
                ORDER BY aer.created_at DESC;
            END
        `);

        console.log("✅ Assignment Extension Request procedures created!");
    } catch (error) {
        console.error("❌ Error setting up Assignment Extension Request procedures:", error);
        throw error;
    }
};

module.exports = setupAssignmentExtensionRequestProcedures;