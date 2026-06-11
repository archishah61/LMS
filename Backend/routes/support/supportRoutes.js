const express = require("express");
const router = express.Router();
const supportController = require("../../controllers/support/supportController");
const { uploadMiddleware } = require("../../middleware/uploadMiddleware");
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");

// ✅ Create a new support ticket
router.post("/tickets", protect, checkPermission("Support", "create"), uploadMiddleware, supportController.createSupportTicket);

// ✅ Get a single support ticket with replies & attachments
router.get("/tickets/:id", protect, checkPermission("Support", "view"), supportController.getSupportTicketById);

// ✅ Get a All support ticket with replies & attachments
router.get("/tickets", protect, checkPermission("Support", "view"), supportController.getAllSupportTickets);

router.get("/user-tickets", protect, supportController.getUserSupportTickets);

// ✅ Update ticket (status, subject, etc.)
router.put("/tickets/:id", protect, checkPermission("Support", "edit"), supportController.updateSupportTicket);

// ✅ Delete a support ticket
router.delete("/tickets/:id", protect, checkPermission("Support", "delete"), supportController.deleteSupportTicket);

// ✅ Add a reply to a ticket
router.post("/replies", protect, checkPermission("Support Reply", "create"), uploadMiddleware, supportController.createSupportReply);

// ✅ Delete a reply
router.delete("/replies/:id", protect, checkPermission("Support Reply", "delete"), supportController.deleteSupportReply);

module.exports = router;
