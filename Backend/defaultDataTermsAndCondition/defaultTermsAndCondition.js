const TermsOfService = require("../models/legalPages/termsOfService");

const defaultTerms = {
    footer: [
        "Welcome to our LMS e-learning platform. These Terms and Conditions govern your use of our platform.",
        "By accessing or using our platform, you agree to be bound by these Terms and Conditions.",
        "We reserve the right to modify these terms at any time. Your continued use of the platform constitutes acceptance of the modified terms.",
        "You must use our platform in compliance with all applicable laws and regulations.",
        "Unauthorized use of our platform may result in termination of your account and legal action.",
        "We are not liable for any damages arising from the use or inability to use our platform.",
        "If you have any questions about these Terms and Conditions, please contact us."
    ],
    partner: [
        "Our partners play a crucial role in enhancing the learning experience on our platform.",
        "Partners must adhere to our platform's guidelines and legal requirements.",
        "We reserve the right to terminate partnerships that do not comply with our terms.",
        "Partners are responsible for the content they provide and must ensure it is accurate and lawful.",
        "We may share necessary information with partners to facilitate your learning experience.",
        "Partners are prohibited from misusing user data or engaging in unauthorized activities.",
        "If you have concerns about our partners, please report them to us immediately."
    ],
    login: [
        "You are responsible for maintaining the confidentiality of your login credentials.",
        "You must not share your login information with others or use another user's account.",
        "We monitor login activity to ensure the security of our platform.",
        "Suspicious login attempts may result in temporary suspension of your account for security purposes.",
        "You agree to notify us immediately of any unauthorized use of your account.",
        "We are not liable for any loss or damage arising from unauthorized access to your account.",
        "By logging in, you agree to abide by our platform's rules and regulations."
    ],
    signup: [
        "To sign up for our platform, you must provide accurate and complete information.",
        "You must be at least 13 years old to create an account on our platform.",
        "By signing up, you agree to receive communications from us, including updates and promotional offers.",
        "We reserve the right to refuse or cancel registrations that violate our terms.",
        "You are responsible for maintaining the accuracy of your account information.",
        "Misrepresenting your identity or providing false information may result in termination of your account.",
        "By completing the signup process, you agree to these Terms and Conditions and our Privacy Policy."
    ]
};

const createDefaultTerms = async () => {
    try {
        for (const [category, sentences] of Object.entries(defaultTerms)) {
            await TermsOfService.create({
                category,
                sentences,
                createdBy: 1, // Replace with appropriate admin/user ID
                updatedBy: 1, // Same as createdBy during initial insert
            });
            console.log(`Inserted terms for category: ${category}`);
        }
        console.log("Default Terms of Service inserted successfully.");
    } catch (error) {
        console.error("Error inserting default Terms of Service:", error);
    }
};

module.exports = createDefaultTerms;
