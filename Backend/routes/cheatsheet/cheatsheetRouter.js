const express = require("express");
const cheatSheetController = require("../../controllers/cheatsheet/cheatsheetController"); // Adjust the path as necessary
const upload = require("../../config/multerConfig"); // Adjust the path as necessary
const protect = require("../../middleware/protectMiddleware"); // Adjust the path as necessary
const { AdminOrPartner } = require("../../middleware/roleBaseMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");
const checkFeature = require("../../middleware/featureCheckMiddleware");

const router = express.Router();

// CheatSheet routes
router.post(
    "/create",
    AdminOrPartner,
    protect,
    checkPermission("Cheat Sheet", "create"),
    upload.single("imageUrl"), // Assuming only one image file is uploaded
    cheatSheetController.createCheatSheet
);

router.post(
    "/pay",
    checkFeature("cheatsheet"),
    protect,
    cheatSheetController.purchasePaidCheatSheet
);

router.get("/", AdminOrPartner, cheatSheetController.getAllCheatSheets);
router.get("/active", checkFeature("cheatsheet"), cheatSheetController.getAllActiveCheatSheets);
router.get("/get-paid", checkFeature("cheatsheet"), protect, cheatSheetController.getUserPaidCheatSheets);
router.get("/:id", checkFeature("cheatsheet"), cheatSheetController.getCheatSheetById);

// Update entire cheat sheet (including files)
router.put(
    "/update/:id",
    AdminOrPartner,
    checkPermission("Cheat Sheet", "edit"),
    upload.single("imageUrl"), // Assuming only one image file is uploaded
    cheatSheetController.updateCheatSheet
);

router.delete("/delete/:id", protect, checkPermission("Cheat Sheet", "delete"), cheatSheetController.deleteCheatSheet);
router.patch('/:cheatSheetId/status', protect, checkPermission("Cheat Sheet", "toggle"), cheatSheetController.updateCheatSheetStatus);

module.exports = router;
