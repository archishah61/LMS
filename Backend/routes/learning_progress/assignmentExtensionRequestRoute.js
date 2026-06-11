const express = require("express");
const { createRequest, getAllRequests, handleRequest, getMyRequests } = require("../../controllers/learning_progress/assignmentExtensionRequestController");
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");
const router = express.Router();

// Student
router.post("/request", protect, createRequest);

// Admin
router.get("/requests", protect, checkPermission("Assignment Extension", "edit"), getAllRequests);
router.put("/request/:requestId", protect, checkPermission("Assignment Extension", "edit"), handleRequest);
router.get("/my-requests", protect, getMyRequests);

module.exports = router;
