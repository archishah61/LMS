const { callProcedure } = require("../../utils/procedure/callProcedure");
const { callProcedureChallenge } = require("../../utils/procedure/callProcedureChallenge");
const Validation = require("../../validations");


/**
 * 1. Student - Create Extension Request
 */
exports.createRequest = async (req, res) => {
    try {
        const { assignmentId, reason } = req.body;
        const userId = req.user.id; // assuming you store logged-in user in req.user

        const result = await callProcedure("createAssignmentExtensionRequest", [
            assignmentId,
            userId,
            reason || null,
            userId,
        ]);

        if (!result.success) {
            const msg = (result.error && result.error.message) || result.error || "Failed to create extension request";
            return res.status(400).json({ message: msg.includes('|') ? msg.split('|')[2] : msg });
        }

        const request = Array.isArray(result.data) ? (Array.isArray(result.data[0]) ? result.data[0][0] : result.data[0]) : result.data;
        res.status(201).json({
            message: "Extension request submitted successfully."
        });
    } catch (error) {
        console.error("Error creating request:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


/**
 * 2. Admin - Fetch All Requests
 */
exports.getAllRequests = async (req, res, next) => {
    try {
        const role = req.user?.role;
        const id = req.user?.id;

        const {
            search_term = "",
            status = "all",
            limit = "all",
            offset = "0",
        } = req.query;

        /* ---------- VALIDATION ---------- */
        if (limit !== "all" && limit !== "ALL") {
            Validation.isInteger(limit, "Limit must be a positive integer or 'all'.");
        }

        if (status && status !== "all") Validation.isEnum(status, ["Pending", "Approved", "Rejected"], "status must be Pending, Approved or Rejected.");
        Validation.isInteger(offset, "Offset must be a non-negative integer.");
        /* --------------------------------- */

        const parsedLimit = limit === "all" ? "all" : Number(limit);
        const parsedOffset = Number(offset);

        const result = await callProcedureChallenge("getAllAssignmentExtensionRequests", [
            role || null,
            id || null,
            search_term || null,
            status || null,
            limit === "all" ? 0 : parsedLimit,
            parsedOffset,
            limit === "all" || false
        ]);

        if (!result.success) {
            return next(result.error);
        }

        const rows = Object.values(result.data[1]);

        // Map to match original include structure
        const requests = (rows || []).map(r => ({
            id: r.id,
            assignmentId: r.assignmentId,
            userId: r.userId,
            reason: r.reason,
            status: r.status,
            admin_response: r.admin_response,
            approved_due_date: r.approved_due_date,
            created_by: r.created_by,
            updated_by: r.updated_by,
            created_at: r.created_at,
            updated_at: r.updated_at,
            Assignment: { id: r.assignment_id, title: r.assignment_title },
            User: { id: r.user_id, username: r.username, email: r.email },
        }));

        const meta = result.data[0][0];
        res.json({ requests, pagination: { totalCount: meta?.total_count, totalPages: limit === "all" ? 1 : Math.ceil(meta?.total_count / parsedLimit) } });
    } catch (error) {
        console.error("Error fetching requests:", error);
        next(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


/**
 * 3. Admin - Approve / Reject Request
 */
exports.handleRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, approved_due_date, admin_response } = req.body;
        const adminId = req.user.id; // admin user

        const result = await callProcedure("handleAssignmentExtensionRequest", [
            requestId,
            status,
            approved_due_date || null,
            admin_response || null,
            adminId,
        ]);

        if (!result.success) {
            const msg = (result.error && result.error.message) || result.error || "Failed to handle request";
            // Normalize known signals
            if (typeof msg === 'string' && msg.startsWith('E404')) {
                return res.status(404).json({ message: msg.split('|')[2] || 'Not found' });
            }
            if (typeof msg === 'string' && msg.startsWith('E400')) {
                return res.status(400).json({ message: msg.split('|')[2] || 'Bad Request' });
            }
            return res.status(400).json({ message: msg });
        }

        const request = Array.isArray(result.data) ? (Array.isArray(result.data[0]) ? result.data[0][0] : result.data[0]) : result.data;
        res.json({ message: `Request ${status.toLowerCase()} successfully.`, request });
    } catch (error) {
        console.error("Error handling request:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * 4. Student - Fetch Own Requests
 */
exports.getMyRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await callProcedure("getAssignmentExtensionRequestsByUser", [userId]);
        if (!result.success) {
            const msg = (result.error && result.error.message) || result.error || "Failed to fetch requests";
            return res.status(400).json({ message: msg });
        }
        const rows = Array.isArray(result.data) && Array.isArray(result.data[0]) ? result.data[0] : result.data;
        const requests = (rows || []).map(r => ({
            id: r.id,
            assignmentId: r.assignmentId,
            userId: r.userId,
            reason: r.reason,
            status: r.status,
            admin_response: r.admin_response,
            approved_due_date: r.approved_due_date,
            created_by: r.created_by,
            updated_by: r.updated_by,
            created_at: r.created_at,
            updated_at: r.updated_at,
            Assignment: { id: r.assignment_id, title: r.assignment_title },
        }));

        res.json({ requests });
    } catch (error) {
        console.error("Error fetching student requests:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
