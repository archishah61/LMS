const { callProcedure } = require("../../../utils/procedure/callProcedure");
const { callProcedureChallenge } = require("../../../utils/procedure/callProcedureChallenge");
const Validation = require("../../../validations");

exports.createContestTemplate = async (req, res, next) => {
    try {
        let {
            title, description, type,
            recurrence_pattern, recurrence_interval, recurrence_days_of_week
        } = req.body;

        Validation.isString(title, { min: 1, max: 255 },
            "Title must be 1-255 characters.");
        if (description) {
            Validation.isString(description,
                "Description must be String");
        }
        Validation.isEnum(type, ["recurring", "on-demand"], "Template type must be recurring or on-demand.");
        if (recurrence_interval) Validation.isInteger(recurrence_interval, "Recurrence interval must be a valid integer.");
        if (recurrence_pattern) Validation.isEnum(recurrence_pattern, ["day", "week", "month", "year"], "Recurrence pattern must be day, week, month, year.");

        let banner_url = req.file ? "/template/banner/" + req.file.filename : null;

        const { success, data, error } = await callProcedure("CreateContestTemplate", [
            title?.trim(), description?.trim() || null, type,
            recurrence_pattern || null, recurrence_interval || null,
            JSON.stringify(recurrence_days_of_week) || null,
            banner_url || null,
            req?.user?.id // created_by
        ]);

        if (!success) return next(error);

        res.status(201).json({
            success: true,
            message: "Contest Template created successfully",
            contestTemplate: data[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.getContestTemplates = async (req, res, next) => {
    try {

        const { limit = "all", offset = "0", status, type } = req.query;

        if (status && status.toLowerCase() !== 'all') Validation.isEnum(status, ['active', 'inactive'], 'Invalid status value');
        if (type && type.toLowerCase() !== 'all') Validation.isEnum(type, ["recurring", "on-demand"], 'Invalid type');

        /* ---------- VALIDATION ---------- */
        if (limit !== "all" && limit !== "ALL") {
            Validation.isInteger(limit, "Limit must be a positive integer or 'all'.");
        }

        Validation.isInteger(offset, "Offset must be a non-negative integer.");
        /* --------------------------------- */

        const parsedLimit = limit === "all" ? "all" : Number(limit);
        const parsedOffset = Number(offset);
        
        const { success, data, error } = await callProcedureChallenge("GetAllContestTemplates", [
            status && status.toLowerCase() !== 'all' ? status.toLowerCase() === "active" ? true : false : null,
            type && type.toLowerCase() !== 'all' ? type : null,
            limit === "all" ? 0 : parsedLimit,
            parsedOffset,
            limit === "all" || false
        ]);

        if (!success) return next(error);

        const meta = data[0][0];

        res.status(200).json({ success: true, data: Object.values(data[1]), pagination: { totalCount: meta?.total_count, totalPages: limit === "all" ? 1 : Math.ceil(meta?.total_count / parsedLimit) } });
    } catch (error) {
        next(error);
    }
};

exports.getActiveContestTemplates = async (req, res, next) => {
    try {
        const { success, data, error } = await callProcedure("GetAllActiveContestTemplates", []);
        if (!success) return next(error);

        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

exports.getContestTemplateById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { success, data, error } = await callProcedure("GetContestTemplateById", [id]);

        if (!success) return next(error);
        if (!data || data.length === 0) {
            return res.status(404).json({ success: false, message: "Contest Template not found" });
        }

        res.status(200).json({ success: true, data: data[0] });
    } catch (error) {
        next(error);
    }
};

exports.updateContestTemplate = async (req, res, next) => {
    try {
        const { id } = req.params;
        let {
            title, description, type,
            recurrence_pattern, recurrence_interval,
            recurrence_days_of_week
        } = req.body;

        if (title) Validation.isString(title, { min: 1, max: 255 }, "Title must be 1-255 characters.");
        if (description) Validation.isString(description, "Description must be String");
        if (type) Validation.isEnum(type, ["recurring", "on-demand"], "Template type must be recurring or on-demand.");
        if (recurrence_interval) Validation.isInteger(recurrence_interval, "Recurrence interval must be a valid integer.");
        if (recurrence_pattern) Validation.isEnum(recurrence_pattern, ["day", "week", "month", "year"], "Recurrence pattern must be day, week, month, year.");

        let banner_url = req.file ? "/template/banner/" + req.file.filename : null;

        const { success, data, error } = await callProcedure("UpdateContestTemplate", [
            id,
            title?.trim() || null, description?.trim() || null, type || null,
            recurrence_pattern || null, recurrence_interval || null,
            recurrence_days_of_week ? JSON.stringify(recurrence_days_of_week) : null,
            banner_url || null,
            req?.user?.id // updated_by
        ]);

        if (!success) return next(error);

        res.status(200).json({
            success: true,
            message: "Contest Template updated successfully",
            contestTemplate: data[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteContestTemplate = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { success, error } = await callProcedure("DeleteContestTemplate", [id]);

        if (!success) return next(error);

        res.status(200).json({ success: true, message: "Contest Template deleted successfully" });
    } catch (error) {
        next(error);
    }
};

exports.toggleContestTemplateStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { success, data, error } = await callProcedure("ToggleContestTemplateStatus", [id]);

        if (!success) return next(error);

        res.status(200).json({ success: true, data: data[0] });
    } catch (error) {
        next(error);
    }
};
