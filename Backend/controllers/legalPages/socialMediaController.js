const { callProcedure } = require("../../utils/procedure/callProcedure");

// Get all social media links
const getAllSocialLinks = async (req, res) => {
    try {
    const { success, data, error } = await callProcedure("getSocialMediaLinks");
        if (!success) {
            return res.status(500).json({ success: false, message: "Error retrieving social media links", error });
        }

    const row = Array.isArray(data) ? (Array.isArray(data[0]) ? data[0][0] : data[0]) : data;
    const socialLinks = row ? [row] : [];

        return res.status(200).json({
            success: true,
            message: "Social media links retrieved successfully",
            data: socialLinks
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error retrieving social media links",
            error: error.message
        });
    }
};

// Update individual social media link
const updateSocialLink = async (req, res) => {
    try {
        const { platform } = req.params;
        const { url } = req.body;
        const userId = req.user.id; // Assuming you have user info in request from auth middleware

        // Validate platform parameter
        const validPlatforms = ['facebook', 'twitter', 'youtube', 'instagram', 'linkedin'];
        if (!validPlatforms.includes(platform)) {
            return res.status(400).json({
                success: false,
                message: "Invalid social media platform"
            });
        }

        const procRes = await callProcedure("upsertSocialMediaLink", [platform, url, userId]);
        if (!procRes.success) {
            return res.status(400).json({ success: false, message: procRes.error || "Procedure failed" });
        }

        const updated = Array.isArray(procRes.data) ? (Array.isArray(procRes.data[0]) ? procRes.data[0][0] : procRes.data[0]) : procRes.data;

        return res.status(200).json({
            success: true,
            message: `${platform} link updated successfully`,
            data: { platform, url: updated ? updated[platform] : url }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error updating social media link",
            error: error.message
        });
    }
};

module.exports = {
    getAllSocialLinks,
    updateSocialLink
};
