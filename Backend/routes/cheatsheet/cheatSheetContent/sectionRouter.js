const express = require("express");
const sectionController = require("../../../controllers/cheatsheet/cheatSheetContent/sectionController"); // Adjust the path as necessary
const protect = require("../../../middleware/protectMiddleware"); // Adjust the path as necessary
const upload = require("../../../config/multerConfig");
const router = express.Router();
const { AdminOrPartner } = require("../../../middleware/roleBaseMiddleware");
const checkPermission = require("../../../middleware/permissionMiddleware");

// Section routes
router.post(
    "/create",
    AdminOrPartner,
    checkPermission("Cheat Sheet Section", "create"),
    upload.single("sectionImage"),
    sectionController.createSection
);

router.get("/",
    protect,
    checkPermission("Cheat Sheet Section", "view"),
    sectionController.getAllSections
);

router.get("/:id",
    protect,
    checkPermission("Cheat Sheet Section", "view"),
    sectionController.getSectionById
);

router.put(
    "/update/:id",
    protect,
    checkPermission("Cheat Sheet Section", "edit"),
    upload.single("sectionImage"),
    sectionController.updateSection
);

router.delete("/delete/:id", protect, checkPermission("Cheat Sheet Section", "delete"), sectionController.deleteSection);

module.exports = router;
