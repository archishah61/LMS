const express = require('express');
const router = express.Router();
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");

const {
    saveSeoMeta,
    getSeoMetaByPageType,
    toggleSeoMetaStatus
} = require('../../controllers/legalPages/seoMetaController');

const upload = require('../../config/multerConfig');


/* ───────────────────────────  CREATE / UPDATE SEO META  ─────────────────────────── */
/*
   If id = 0 → CREATE
   If id > 0 → UPDATE
*/
router.post(
    '/save',
    protect,
    checkPermission("SEO Meta", "create"),
    upload.fields([
        { name: "seoImage", maxCount: 1 },
        { name: "ogImage", maxCount: 1 }
    ]),
    saveSeoMeta
);


/* ───────────────────────────  GET BY PAGE TYPE  ─────────────────────────── */
router.get(
    '/by-page-type/:page_type',
    // protect,
    // checkPermission("SEO Meta", "view"),
    getSeoMetaByPageType
);


/* ───────────────────────────  TOGGLE STATUS  ─────────────────────────── */
router.patch(
    '/toggle-status/:id',
    protect,
    checkPermission("SEO Meta", "toggle"),
    toggleSeoMetaStatus
);

module.exports = router;
