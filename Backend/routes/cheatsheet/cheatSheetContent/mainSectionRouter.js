const express = require("express");
const mainSectionController = require("../../../controllers/cheatsheet/cheatSheetContent/mainSectionController"); // Adjust the path as necessary
const router = express.Router();
const protect = require("../../../middleware/protectMiddleware"); // Adjust the path as necessary
const { AdminOrPartner } = require("../../../middleware/roleBaseMiddleware");
const checkPermission = require("../../../middleware/permissionMiddleware");

// MainSection routes
router.post(
    "/create",
    AdminOrPartner,
    checkPermission("Cheat Sheet Main Section", "create"),
    mainSectionController.createMainSection
);

router.get("/",
    protect,
    checkPermission("Cheat Sheet Main Section", "view"),
    mainSectionController.getAllMainSections
);

router.get("/:id",
    protect,
    checkPermission("Cheat Sheet Main Section", "view"),
    mainSectionController.getMainSectionById
);

router.put(
    "/update/:id",
    protect,
    checkPermission("Cheat Sheet Main Section", "edit"),
    mainSectionController.updateMainSection
);

router.patch(
    "/toggle-status/:id",
    protect,
    checkPermission("Cheat Sheet Main Section", "toggle"),
    mainSectionController.toggleMainSectionStatus
);

router.delete("/delete/:id", protect, checkPermission("Cheat Sheet Main Section", "delete"), mainSectionController.deleteMainSection);


module.exports = router;
