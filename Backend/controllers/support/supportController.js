const SupportTicket = require("../../models/support/support_ticket");
const SupportReply = require("../../models/support/support_reply");
const User = require("../../models/auth/user");
const Course = require("../../models/course_management/course");
const SupportAttachment = require("../../models/support/support_attachment");
const sequelize = require("../../config/db");
const sendMail = require("../../config/mailer");
const { callProcedure } = require("../../utils/procedure/callProcedure");
const dotenv = require('dotenv');
const Validation = require("../../validations");
const { callProcedureChallenge } = require("../../utils/procedure/callProcedureChallenge");
dotenv.config();

exports.createSupportTicket = async (req, res, next) => {
    try {
        const { user_id, title, description, category, status, related_id = null, related_type = null } = req.body;

        // Validations
        Validation.isInteger(user_id, "User ID must be a valid integer.");
        Validation.isString(title, { min: 1, max: 255 }, "Title must be a non-empty string.");
        Validation.isString(description, { min: 1 }, "Description must be a non-empty string.");
        Validation.isEnum(category, ['Content', 'Technical', 'Access', 'Billing', 'Achievement', 'Communication', 'Other'], "Invalid category.");
        Validation.isEnum(status, ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], "Invalid status.");
        if (related_type) Validation.isEnum(related_type, ['course', 'topic', 'quiz', 'assignment', 'daily-challenge', 'challenge-quest', 'contest', 'cheatsheet', 'partner', 'user_auth', 'enrollment'], "Invalid Related Type.");
        if (related_id) Validation.isInteger(related_id, "Related ID must be a valid integer.");

        const { success, data, error } = await callProcedure("createSupportTicket", [user_id, title, description, category, status, related_id, related_type]);

        if (error) {
            return next(error);
        }

        const parsedTicket = typeof data[0].ticket === 'string' ? JSON.parse(data[0].ticket) : data[0].ticket;

        let attachments = [];


        if (data[0].success && req.files && parsedTicket?.id) {
            attachments = await processSupportAttachments(req.files, parsedTicket.id, null);
        }

        return res.status(201).json(data[0]);

    } catch (error) {
        next(error);
    }
};

exports.updateSupportTicket = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, category, status } = req.body;

        // Validations
        Validation.isInteger(id, "Ticket ID must be a valid integer.");
        if (title) {
            Validation.isString(title, { min: 1, max: 255 }, "Title must be a non-empty string.");
        }
        if (description) {
            Validation.isString(description, { min: 1 }, "Description must be a non-empty string.");
        }
        if (category) {
            Validation.isEnum(category, ['Content', 'Technical', 'Access', 'Billing', 'Achievement', 'Communication', 'Other'], "Invalid category.");
        }
        if (status) {
            Validation.isEnum(status, ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], "Invalid status.");
        }

        // Call the stored procedure with defined values
        const result = await callProcedure("updateSupportTicketById", [
            id,
            title || null,
            description || null,
            category || null,
            status || null,
            "Support Query Resolved"
        ]);

        // Check if the result indicates success or failure
        if (result && result.data && result.data[0]) {
            return res.status(result.data[0].success ? 200 : 400).json(result.data[0]);
        } else {
            return res.status(400).json({ success: false, message: "Failed to update support ticket." });
        }
    } catch (error) {
        console.error("Error in updateSupportTicket:", error);
        next(error);
    }
};

exports.deleteSupportTicket = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validations
        Validation.isInteger(id, "Ticket ID must be a valid integer.");

        // Call the procedure and capture the result
        const result = await callProcedure("deleteSupportTicketById", [id]);

        // Check if the result indicates success or failure
        if (result && result.data && result.data[0]) {
            return res.status(result.data[0].success ? 200 : 404).json(result.data[0]);
        } else {
            return res.status(404).json({ success: false, message: "Failed to delete support ticket." });
        }
    } catch (error) {
        console.error("Error in deleteSupportTicket:", error);
        next(error);
    }
};

const processSupportAttachments = async (files, ticketId = null, replyId = null) => {

    if (!files || !files.supportFile) return [];

    const attachments = [];
    const supportFiles = Array.isArray(files.supportFile)
        ? files.supportFile
        : [files.supportFile];

    for (const file of supportFiles) {
        const fileUrl = `/support/attachment/${file.filename}`;
        const fileType = file.mimetype;

        await callProcedure("createSupportAttachment", [fileUrl, fileType, ticketId, replyId]);

        // Optionally push the data manually if needed
        attachments.push({
            file_url: fileUrl,
            file_type: fileType,
            ticket_id: ticketId,
            reply_id: replyId
        });
    }

    return attachments;
};

exports.getAllSupportTickets = async (req, res, next) => {
    try {
        const {
            status,
            category,
            search_term = "",
            limit = "all",
            offset = "0",
        } = req.query;

        /* ---------- VALIDATION ---------- */
        if (limit !== "all" && limit !== "ALL") {
            Validation.isInteger(limit, "Limit must be a positive integer or 'all'.");
        }

        Validation.isInteger(offset, "Offset must be a non-negative integer.");
        if (search_term) Validation.isString(search_term, { min: 1, max: 255 });
        /* --------------------------------- */

        const parsedLimit = limit === "all" ? "all" : Number(limit);
        const parsedOffset = Number(offset);

        if (status) Validation.isEnum(status, ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], "Invalid status.");
        if (category) Validation.isEnum(category, ['Content', 'Technical', 'Access', 'Billing', 'Achievement', 'Communication', 'Other'], "Invalid category.");

        // Call the stored procedure and get all data in one go
        const ticketsResult = await callProcedureChallenge("getSupportTicketsWithDetails", [
            status || null,
            category || null,
            search_term,
            limit === "all" ? 0 : parsedLimit,
            parsedOffset,
            limit === "all" || false
        ]);

        if (!ticketsResult.success) {
            return next(ticketsResult.error);
        }
        // Access the data property of the result object
        const ticketsRaw = Object.values(ticketsResult.data[1]) || []; // Adjust based on actual structure
        const totalCount = ticketsResult.data[0][0].total_count;

        // Ensure ticketsRaw is an array before calling map
        const tickets = Array.isArray(ticketsRaw)
            ? ticketsRaw.map(ticket => ({
                ...ticket,
                SupportReplies: ticket.SupportReplies || [],
                SupportAttachments: ticket.SupportAttachments || [],
                User: ticket.User || null,
                RelatedDetails: ticket.RelatedDetails || null
            }))
            : [];

        return res.status(200).json({
            success: true,
            tickets,
            pagination: { totalPages: limit === "all" ? 1 : Math.ceil(totalCount / parsedLimit), totalCount }
        });
    } catch (error) {
        next(error);
    }
};

exports.getUserSupportTickets = async (req, res, next) => {
    try {
        const userId = req.user ? req.user.id : null;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }
        Validation.isInteger(userId, "User ID must be a valid integer.");

        // Call the stored procedure
        const ticketsResult = await callProcedure("getSupportTicketsByUser", [userId]);

        // Check if ticketsResult and ticketsResult.data are defined and not empty
        if (!ticketsResult || !ticketsResult.data) {
            console.error("No data returned from the stored procedure.");
            return res.status(404).json({
                success: false,
                message: "No support tickets found for the user."
            });
        }

        // Access the data array from the result
        const ticketsRaw = ticketsResult.data;

        // Ensure ticketsRaw is an array before calling map
        if (!Array.isArray(ticketsRaw)) {
            console.error("Expected an array but got:", ticketsRaw);
            return res.status(500).json({
                success: false,
                message: "Unexpected data format received from the database."
            });
        }

        // Process the tickets
        const tickets = ticketsRaw.map(ticket => ({
            ...ticket,
            SupportReplies: ticket.SupportReplies || [],
            SupportAttachments: ticket.SupportAttachments || [],
            User: ticket.User || null,
            RelatedDetails: ticket.RelatedDetails || null
        }));

        return res.status(200).json({
            success: true,
            tickets
        });
    } catch (error) {
        console.error("Error in getUserSupportTickets:", error);
        next(error);
    }
};

exports.getSupportTicketById = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Validations
        Validation.isInteger(id, "Ticket ID must be a valid integer.");

        // Call the stored procedure
        const results = await callProcedure("getSupportTicketDetailsById", [id]);

        // Access the data property of the results object
        if (results && results.data && results.data[0] && !results.data[0].success) {
            return res.status(404).json({
                success: false,
                message: results.data[0].message
            });
        }

        // Return the ticket data
        return res.status(200).json(results.data[0]);
    } catch (error) {
        next(error);
    }
};

exports.createSupportReply = async (req, res, next) => {
    try {
        const { ticket_id, user_id, admin_id, message } = req.body;

        // Validations
        Validation.isInteger(ticket_id, "Ticket ID must be a valid integer.");
        if (user_id) {
            Validation.isInteger(user_id, "User ID must be a valid integer.");
        }
        if (admin_id) {
            Validation.isInteger(admin_id, "Admin ID must be a valid integer.");
        }
        Validation.isString(message, { min: 1 }, "Message must be a non-empty string.");

        // Call the stored procedure
        const result = await callProcedure("createSupportReply", [ticket_id, user_id || null, admin_id || null, message]);

        // Check if the result indicates failure
        if (!result.data[0].success) {
            return res.status(400).json(result.data[0]);
        }

        const replyId = result.data[0].reply_id;

        // Fetch the reply from the database
        const reply = await SupportReply.findByPk(replyId);

        // Check if the reply was found
        if (!reply) {
            return res.status(404).json({
                success: false,
                message: "Reply not found."
            });
        }

        // Process attachments
        const attachments = await processSupportAttachments(req.files, null, replyId);

        return res.status(201).json({
            success: true,
            message: result.data[0].message_out,
            reply: {
                ...reply.get({ plain: true }),
                attachments
            }
        });
    } catch (error) {
        next(error);
    }
};


// exports.deleteSupportReply = async (req, res, next) => {
//     try {
//         const { id } = req.params;

//         // Validations
//         Validation.isInteger(id, "Reply ID must be a valid integer.");

//         const [result] = await callProcedure("deleteSupportReply", [id]);

//         const response = Array.isArray(result) ? result[0] : result;

//         if (response.success !== 1) {
//             return res.status(404).json(response);
//         }

//         return res.status(200).json(response);
//     } catch (error) {
//         next(error);
//     }
// };

exports.deleteSupportReply = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validations
        Validation.isInteger(id, "Reply ID must be a valid integer.");

        const result = await callProcedure("deleteSupportReply", [id]);


        // Check if the result is in the expected format and handle accordingly
        if (result.success && result.data && result.data.length > 0) {
            const response = result.data[0];

            if (response.success !== 1) {
                return res.status(404).json(response);
            }

            return res.status(200).json(response);
        } else {
            // Handle unexpected result format
            return res.status(500).json({ success: false, message: "Unexpected response format" });
        }
    } catch (error) {
        next(error);
    }
};