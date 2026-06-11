const PrivacyPolicy = require('../../models/legalPages/privacyPolicy ');
const { callProcedure } = require("../../utils/procedure/callProcedure"); // Adjust path accordingly

// Create Privacy Policy Entry using stored procedure
exports.createPrivacyPolicy = async (req, res) => {
    try {
        const { sentences, category, createdBy } = req.body;
        if (!Array.isArray(sentences) || sentences.length === 0) {
            return res.status(400).json({ message: "Sentences must be a non-empty array." });
        }
        const { success, data, error } = await callProcedure("createPrivacyPolicy", [
            JSON.stringify(sentences), // Pass as JSON string
            category,
            createdBy,
            createdBy, // updatedBy
        ]);
        if (!success) {
            return res.status(400).json({ message: error });
        }
        res.status(201).json({ message: "Privacy Policy created successfully.", data: data });
    } catch (error) {
        console.error("Error creating Privacy Policy:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

exports.updatePrivacyPolicy = async (req, res) => {
    try {
        const { id } = req.params;
        const { sentences, updatedBy } = req.body;
        const { success, data, error } = await callProcedure("updatePrivacyPolicy", [
            id,
            JSON.stringify(sentences), // Pass as JSON string
            updatedBy,
        ]);
        if (!success) {
            return res.status(400).json({ message: error });
        }
        const updatedPolicy = data[0];
        if (!updatedPolicy) {
            return res.status(404).json({ message: "Privacy Policy not found." });
        }
        res.status(200).json({ message: "Privacy Policy updated successfully.", data: updatedPolicy });
    } catch (error) {
        console.error("Error updating Privacy Policy:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

exports.togglePrivacyPolicyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { updatedBy } = req.body;
        const { success, data, error } = await callProcedure("togglePrivacyPolicyStatus", [
            id,
            updatedBy || null, // Pass null if not provided
        ]);
        if (!success) {
            return res.status(400).json({ message: error });
        }
        const updatedPolicy = data[0];
        if (!updatedPolicy) {
            return res.status(404).json({ message: "Privacy Policy not found." });
        }
        res.status(200).json({
            message: `Privacy Policy status updated to ${updatedPolicy.status}.`,
            data: updatedPolicy
        });
    } catch (error) {
        console.error("Error toggling Privacy Policy status:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

exports.getAllPrivacyPolicies = async (req, res) => {
    try {
        const { success, data, error } = await callProcedure("getAllPrivacyPolicies");
        if (!success) {
            return res.status(400).json({ message: error });
        }
        res.status(200).json({ data: data });
    } catch (error) {
        console.error("Error fetching Privacy Policies:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Get Privacy Policy by Category using stored procedure
exports.getPrivacyPolicyByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const { success, data, error } = await callProcedure("getPrivacyPolicyByCategory", [category]);
        if (!success) {
            return res.status(400).json({ message: error });
        }
        res.status(200).json({ data: data });
    } catch (error) {
        console.error("Error fetching Privacy Policy by category:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

