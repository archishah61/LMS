const { callProcedure } = require("../../utils/procedure/callProcedure");
const Validation = require("../../validations");

/* ───────────────────────────  SAVE SEO META (CREATE + UPDATE)  ─────────────────────────── */
const saveSeoMeta = async (req, res, next) => {
    try {
        const {
            id = 0,  // if id = 0 → create
            og_image,
            og_alt,
            og_title,
            og_description,
            og_keywords,

            seo_image,
            seo_alt,
            seo_title,
            seo_description,
            seo_keywords,
            canonical_url,

            page_type
        } = req.body;

        const userId = req.user?.id;

        /* ---------- VALIDATION ---------- */
        if (id) Validation.isInteger(id);
        if (page_type) Validation.isString(page_type, { min: 1, max: 255 });
        if (og_title) Validation.isString(og_title, { max: 255 });
        if (seo_title) Validation.isString(seo_title, { max: 255 });
        /* --------------------------------- */

        const seoImage = req.files?.seoImage?.[0]?.filename
            ? `/meta/seo/${req.files.seoImage[0].filename}`
            : seo_image || null;

        const ogImage = req.files?.ogImage?.[0]?.filename
            ? `/meta/og/${req.files.ogImage[0].filename}`
            : og_image || null;

        const { success, data, error } = await callProcedure("saveSeoMeta", [
            id,
            ogImage,
            og_alt,
            og_title,
            og_description,
            og_keywords,

            seoImage,
            seo_alt,
            seo_title,
            seo_description,
            seo_keywords,
            canonical_url,

            page_type,
            userId,  // created_by (only used if id = 0)
            userId   // updated_by
        ]);

        if (!success) return next(error);

        res.status(id == 0 ? 201 : 200).json({
            success,
            message: id == 0 ? "SEO meta created successfully" : "SEO meta updated successfully",
            data: data[0],
        });
    } catch (err) {
        next(err);
    }
};


/* ───────────────────────────  GET SEO META BY PAGE TYPE  ─────────────────────────── */
const getSeoMetaByPageType = async (req, res, next) => {
    try {
        const { page_type } = req.params;

        Validation.isString(page_type, { min: 1, max: 255 });

        const { success, data, error } = await callProcedure("getSeoMetaByPageType", [
            page_type
        ]);

        if (!success) return next(error);

        res.status(200).json({
            success: true,
            data: data[0] || null
        });
    } catch (err) {
        next(err);
    }
};


/* ───────────────────────────  TOGGLE SEO META STATUS  ─────────────────────────── */
const toggleSeoMetaStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        Validation.isInteger(id);

        const { success, data, error } = await callProcedure("toggleSeoMetaStatus", [
            id,
            userId
        ]);

        if (!success) return next(error);

        res.status(200).json({
            success: true,
            message: "SEO meta status updated successfully",
            data: data[0],
        });
    } catch (err) {
        next(err);
    }
};


module.exports = {
    saveSeoMeta,
    getSeoMetaByPageType,
    toggleSeoMetaStatus,
};
