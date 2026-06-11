const Section = require("../../../models/cheat_sheet/cheat_sheet_content/section");
const { callProcedure } = require("../../../utils/procedure/callProcedure");
const Validation = require("../../../validations");

const createSection = async (req, res, next) => {
    try {
        const sectionImage = req.file
            ? "/cheat-sheet-section/image/" + req.file.filename
            : null;

        const {
            title,
            contentType,
            content,
            mainSectionId
        } = req.body;

        // Validations
        Validation.isString(title, { min: 1, max: 255 }, "Invalid section title");
        if (contentType) {
            Validation.isEnum(contentType, ['text', 'image'], "Invalid contentType");
        }
        if (contentType === 'text') {
            Validation.isString(content, { min: 1 }, "Content is required for text type");
        }
        if (mainSectionId !== undefined) {
            Validation.isInteger(mainSectionId, "Invalid mainSectionId");
        }

        const params = [title, contentType, content, sectionImage, mainSectionId];

        const { success, data, error } = await callProcedure("createSection", params);

        // if (!success) return res.status(400).json({ error });
        if (!success) return next(error);

        res.status(201).json(data[0]);
    } catch (error) {
        next(error);
    }
};

const updateSection = async (req, res, next) => {
    try {
        const {
            title,
            contentType,
            content,
            sectionImage: existingSectionImage,
        } = req.body;

        const sectionImage = req.file
            ? "/cheat-sheet-section/image/" + req.file.filename
            : contentType === "image"
                ? existingSectionImage || null
                : null;

        // Validations
        Validation.isInteger(req.params.id, "Invalid section ID");
        if (title) Validation.isString(title, { min: 1, max: 255 }, "Invalid section title");
        if (contentType) Validation.isEnum(contentType, ['text', 'image'], "Invalid contentType");
        if (contentType === 'text' && content) Validation.isString(content, { min: 1 }, "Content is required for text type");

        const params = [
            req.params.id,
            title,
            contentType,
            content ? content : null,
            sectionImage,
        ];

        const { success, data, error } = await callProcedure("updateSection", params);

        if (!success) return next(error);
        if (!data.length) return res.status(404).json({ error: "Section not found" });

        res.status(200).json(data[0]);
    } catch (error) {
        next(error);
    }
};

const getSectionById = async (req, res, next) => {
    try {
        const { success, data, error } = await callProcedure("getSectionById", [req.params.id]);
        Validation.isInteger(req.params.id, "Invalid section ID");
        if (!success) return next(error);
        if (!data.length) return res.status(404).json({ error: "Section not found" });
        res.status(200).json(data[0]);
    } catch (error) {
        next(error);
    }
};

const getAllSections = async (req, res, next) => {
    try {
        const { success, data, error } = await callProcedure("getAllSections", []);

        if (!success) return next(error);
        // if (!success) return res.status(400).json({ error });
        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

const deleteSection = async (req, res, next) => {
    try {
        Validation.isInteger(req.params.id, "Invalid section ID");
        const { success, error } = await callProcedure("deleteSection", [req.params.id]);
        if (!success) return next(error);
        // if (!success) return res.status(404).json({ error });
        res.status(200).send({ success, message: "Section deleted successfully" });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createSection,
    getAllSections,
    getSectionById,
    updateSection,
    deleteSection
};
