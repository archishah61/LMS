
const { callProcedure } = require("../../utils/procedure/callProcedure");

// ✅ Create Terms of Service Entry
exports.createTermsOfService = async (req, res) => {
    try {
        const { sentences, category, createdBy } = req.body;

        if (!Array.isArray(sentences) || sentences.length === 0) {
            return res.status(400).json({ message: "Sentences must be a non-empty array." });
        }

        const { success, data, error } = await callProcedure("createTermsOfService", [
            JSON.stringify(sentences),
            category,
            createdBy,
            createdBy,
        ]);

        if (!success) {
            return res.status(400).json({ message: error || "Failed to create Terms of Service." });
        }

        const newEntry = Array.isArray(data) ? (Array.isArray(data[0]) ? data[0][0] : data[0]) : data;

        res.status(201).json({ message: "Terms of Service created successfully.", data: newEntry });
    } catch (error) {
        console.error("Error creating Terms of Service:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// ✅ Update Terms of Service by ID
exports.updateTermsOfService = async (req, res) => {
    try {
        const { id } = req.params;
        const { sentences, status, updatedBy } = req.body;
        const { success, data, error } = await callProcedure("updateTermsOfService", [
            id,
            sentences ? JSON.stringify(sentences) : null,
            status || null,
            updatedBy,
        ]);

        if (!success) {
            return res.status(400).json({ message: error || "Failed to update Terms of Service." });
        }

        const updated = Array.isArray(data) ? (Array.isArray(data[0]) ? data[0][0] : data[0]) : data;
        if (!updated) {
            return res.status(404).json({ message: "Terms of Service not found." });
        }

        res.status(200).json({ message: "Terms of Service updated successfully.", data: updated });
    } catch (error) {
        console.error("Error updating Terms of Service:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// ✅ Get All Terms of Service Entries
exports.getAllTermsOfService = async (req, res) => {
    try {
        const { success, data, error } = await callProcedure("getAllTermsOfService");
        if (!success) {
            return res.status(400).json({ message: error || "Failed to fetch Terms of Service." });
        }
        const rows = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : data;
        res.status(200).json({ data: rows });
    } catch (error) {
        console.error("Error fetching all Terms of Service:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// ✅ Get Terms of Service by Category
exports.getTermsOfServiceByCategory = async (req, res) => {
    try {
        const { category } = req.params;

        const { success, data, error } = await callProcedure("getTermsOfServiceByCategory", [category]);
        if (!success) {
            return res.status(400).json({ message: error || "Failed to fetch Terms of Service by category." });
        }
        const rows = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : data;

        res.status(200).json({ data: rows });
    } catch (error) {
        console.error("Error fetching Terms of Service by category:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// ✅ Toggle Status of Terms of Service by ID
exports.toggleTermsOfServiceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { updatedBy } = req.body;

        if (!updatedBy) {
            return res.status(400).json({ message: "updatedBy is required." });
        }
        const { success, data, error } = await callProcedure("toggleTermsOfServiceStatus", [id, updatedBy]);
        if (!success) {
            return res.status(400).json({ message: error || "Failed to toggle Terms of Service status." });
        }
        const row = Array.isArray(data) ? (Array.isArray(data[0]) ? data[0][0] : data[0]) : data;
        if (!row) {
            return res.status(404).json({ message: "Terms of Service not found." });
        }

        res.status(200).json({ message: `Terms of Service status toggled to ${row.status}.`, data: row });
    } catch (error) {
        console.error("Error toggling Terms of Service status:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};