const MainSection = require("../../../models/cheat_sheet/cheat_sheet_content/mainsection");
const Section = require("../../../models/cheat_sheet/cheat_sheet_content/section");
const { callProcedure } = require("../../../utils/procedure/callProcedure");
const Validation = require("../../../validations");

const createMainSection = async (req, res, next) => {
    try {
        const {
            mainTitle,
            cheatsheetId,
            createdBy,
            updatedBy,
        } = req.body;

        const created_by_type = 'admin'
        const updated_by_type = 'admin'

        // Validations
        Validation.isString(mainTitle, { min: 1, max: 255 }, "Invalid mainTitle");
        Validation.isInteger(cheatsheetId, "Invalid cheatsheetId");
        Validation.isInteger(createdBy, "Invalid createdBy");
        Validation.isInteger(updatedBy, "Invalid updatedBy");

        const params = [
            mainTitle,
            cheatsheetId,
            createdBy,
            updatedBy,
            created_by_type,
            updated_by_type,
        ];



        const { success, data, error } = await callProcedure("createMainSection", params);

        if (!success) {
            return next(error);
            // return res.status(400).json({ error });
        }

        res.status(201).json(data[0]);
    } catch (error) {
        next(error);
    }
};

const getAllMainSections = async (req, res, next) => {
    try {
        const { success, data, error } = await callProcedure("getAllMainSections", []);

        if (!success) {
            return next(error);
            // return res.status(400).json({ error });
        }

        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

const getMainSectionById = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const { search_term } = req.query;

        Validation.isInteger(id, "Invalid mainSection ID");

        const { success, data, error } = await callProcedure("getMainSectionById", [id, search_term || null]);

        if (!success) {
            return next(error);
            // return res.status(400).json({ error });
        }

        if (data.length === 0) {
            return res.status(404).json({ error: 'No data found' });
        }

        // Grouping main sections and their sections
        const resultMap = {};

        data.forEach(row => {
            if (!resultMap[row.mainSectionId]) {
                resultMap[row.mainSectionId] = {
                    id: row.mainSectionId,
                    mainTitle: row.mainTitle,
                    status:row.status,
                    cheatsheetId: row.cheatsheetId,
                    createdBy: row.createdBy,
                    created_by_type: row.created_by_type,
                    updatedBy: row.updatedBy,
                    updated_by_type: row.updated_by_type,
                    created_at: row.mainSectionCreatedAt,
                    updated_at: row.mainSectionUpdatedAt,
                    Sections: []
                };
            }

            // Only push section if it exists (LEFT JOIN may return NULL)
            if (row.sectionId) {
                resultMap[row.mainSectionId].Sections.push({
                    id: row.sectionId,
                    title: row.sectionTitle,
                    contentType: row.contentType,
                    content: row.content,
                    sectionImage: row.sectionImage,
                    created_at: row.sectionCreatedAt,
                    updated_at: row.sectionUpdatedAt
                });
            }
        });

        const result = Object.values(resultMap);

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};


const updateMainSection = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            mainTitle,
        } = req.body;

        Validation.isInteger(id, "Invalid ID");
        Validation.isString(mainTitle, { min: 1, max: 255 }, "Invalid mainTitle");

        if (!mainTitle) {
            return res.status(400).json({
                error: "Missing required fields: title, updatedBy, updated_by_type",
            });
        }

        const params = [
            id,
            mainTitle,
        ];

        const { success, data, error } = await callProcedure("updateMainSection", params);

        if (!success) {
            return next(error);
        }

        res.status(200).json({
            message: "MainSection updated successfully",
            data,
        });
    } catch (error) {
        next(error);
    }
};


const deleteMainSection = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { success, data, error } = await callProcedure("deleteMainSection", [id]);

        Validation.isInteger(id, "Invalid mainSection ID");

        if (!success) {
            return next(error);
            // return res.status(400).json({ error });
        }

        res.status(200).send('MainSection deleted');
    } catch (error) {
        next(error);
    }
};


const toggleMainSectionStatus = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ID
        Validation.isInteger(id, "Invalid mainSection ID");

        // Call stored procedure
        const { success, data, error } = await callProcedure("toggleMainSectionStatus", [id]);

        if (!success) {
            return next(error);
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ message: "MainSection not found" });
        }

        res.status(200).json({
            message: "MainSection status toggled successfully",
            data: data[0], // return the updated row
        });
    } catch (error) {
        next(error);
    }
};


module.exports = {
    createMainSection,
    getAllMainSections,
    getMainSectionById,
    updateMainSection,
    deleteMainSection,
    toggleMainSectionStatus
};
