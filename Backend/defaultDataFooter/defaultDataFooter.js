const FooterSetting = require("../models/legalPages/footerSetting");
const SocialMedia = require("../models/legalPages/socialMedia"); // Adjust path as per your structure

const defaultFooterSetting = {
    address: "720 Zion Z1, near Times Square 2, off Sindhu Bhavan Marg, Bodakdev, Ahmedabad, Gujarat 380054",
    phone: "+91 9033055100",
    email: "excelsiortechnologies@gmail.com",
    timing: "Mon - Fri: 9:00 AM to 6:00 PM",
    logo: "uploads/footer/footer-logo.png", // You can leave this null if no default logo
    createdBy: 1,
    updatedBy: 1,
};

const defaultSocialMedia = {
    facebook: "https://facebook.com",
    twitter: "https://twitter.com",
    youtube: "https://youtube.com",
    instagram: "https://instagram.com",
    linkedin: "https://linkedin.com",
    createdBy: 1,
    updatedBy: 1,
};


const createDefaultFooterSetting = async () => {
    try {
        const existingFooter = await FooterSetting.findOne();
        if (!existingFooter) {
            await FooterSetting.create(defaultFooterSetting);
            console.log("✅ Default footer setting inserted successfully.");
        } else {
            console.log("⚠️ Footer setting already exists. Skipping insertion.");
        }

        const existingSocialMedia = await SocialMedia.findOne();
        if (!existingSocialMedia) {
            await SocialMedia.create(defaultSocialMedia);
            console.log("✅ Default social media links inserted successfully.");
        } else {
            console.log("⚠️ Social media record already exists. Skipping insertion.");
        }

    } catch (error) {
        console.error("❌ Error inserting default settings:", error);
    }
};

module.exports = createDefaultFooterSetting;
