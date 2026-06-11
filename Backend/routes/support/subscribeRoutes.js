const express = require("express");
const router = express.Router();

const protect = require("../../middleware/protectMiddleware");
const checkPermission = require('../../middleware/permissionMiddleware');

const {
    createSubscribe,
    getAllSubscribes,
    updateSubscribeStatus,
} = require("../../controllers/support/subscribeController");

router.post("/create", createSubscribe);
router.get("/", protect, checkPermission("Subscribe", "view"), getAllSubscribes);
router.patch("/status/:id", protect, checkPermission("Subscribe", "toggle"), updateSubscribeStatus);

module.exports = router;