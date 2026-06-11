const PrivacyPolicy = require("../models/legalPages/privacyPolicy ");

const defaultPolicies = {
    footer: [
        "We are committed to protecting the privacy of our users.",
        "This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you use our LMS e-learning platform.",
        "We collect personal information that you provide to us, such as your name, email address, and other contact details when you register on our platform.",
        "We use your information to provide, maintain, and improve our services, as well as to communicate with you about updates and offers.",
        "We do not sell or rent your personal information to third parties.",
        "We implement a variety of security measures to ensure the safety of your personal information.",
        "By using our platform, you consent to our Privacy Policy.",
        "If we decide to change our Privacy Policy, we will post those changes on this page."
    ],
    partner: [
        "Our partners are essential to providing a comprehensive e-learning experience.",
        "We share minimal and necessary information with our partners to facilitate your learning experience.",
        "Partners are required to adhere to strict confidentiality and data protection obligations.",
        "We ensure that our partners comply with data protection laws and regulations.",
        "Partner access to user data is limited and monitored to ensure data security.",
        "We regularly review our partners' data handling practices to ensure compliance with our Privacy Policy.",
        "If you have any concerns about how our partners handle your data, please contact us."
    ],
    login: [
        "When you log in to our platform, we collect information to authenticate your access.",
        "We use cookies and similar technologies to maintain your login session and enhance your user experience.",
        "Your login credentials are encrypted and stored securely.",
        "We monitor login attempts to detect and prevent unauthorized access.",
        "In case of suspicious login activity, we may take additional steps to verify your identity.",
        "You are responsible for maintaining the confidentiality of your login credentials.",
        "If you suspect any unauthorized use of your account, please notify us immediately."
    ],
    signup: [
        "During the signup process, we collect personal information to create your account.",
        "We require a valid email address and other necessary details to set up your profile.",
        "Your signup information is used to personalize your learning experience.",
        "We may send you a verification email to confirm your identity.",
        "By signing up, you agree to our Terms of Service and Privacy Policy.",
        "We protect your signup information with industry-standard security measures.",
        "If you provide false or misleading information during signup, we reserve the right to terminate your account."
    ]
};

const createDefaultPolicies = async () => {
    try {
        for (const [category, sentences] of Object.entries(defaultPolicies)) {
            await PrivacyPolicy.create({
                category,
                sentences,
                createdBy: 1, // Replace with dynamic user ID if needed
                updatedBy: 1, // Typically same as createdBy at creation time
            });
            console.log(`Inserted policy for category: ${category}`);
        }
        console.log("Default privacy policies inserted successfully.");
    } catch (error) {
        console.error("Error inserting default privacy policies:", error);
    }
};

module.exports = createDefaultPolicies;
