const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // or your email provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use App Password if 2FA is enabled
    },
    tls: {
        rejectUnauthorized: false, // <<< This line allows self-signed certs
    },
});

const sendMail = async (to, subject, text, html) => {
    const mailOptions = {
        from: `"SmartEdu Partner Team" <${process.env.EMAIL_USER || 'rjmakwana1979@gmail.com'}>`,
        to,
        subject,
        text,
        html: html + `<p style="font-size:12px;color:#888;">This message was sent by SmartEdu.</p>`,
    };

    const info = await transporter.sendMail(mailOptions);

    return info;
};

module.exports = sendMail;
