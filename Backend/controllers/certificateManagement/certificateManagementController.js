const { certificate_templates, issued_certificates } = require('../../models/certificate_management/certificate_management');

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

const { Op } = require("sequelize");
const { enrollments } = require('../../models/enrollment_management/enrollment_management');
const User = require('../../models/auth/user');
const Course = require('../../models/course_management/course');
const { Partner } = require('../../models/partner/partner');
const Admin = require('../../models/auth/admin');

function stripHtmlTags(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
}

async function generateCertificateFromTemplate(details) {
    let browser;

    try {
        // Read HTML template
        const templatePath = path.join(__dirname, '../../template/certificate-template.html');
        const htmlTemplate = fs.readFileSync(templatePath, 'utf8');

        // Read logo image and convert to base64
        const imgPath = path.join(__dirname, '../../template/img/queekies.png');
        let logoUrl = '';
        try {
            const logoBase64 = fs.readFileSync(imgPath, 'base64');
            logoUrl = `data:image/png;base64,${logoBase64}`;
        } catch (err) {
            console.error('⚠️ Could not read logo file for base64 conversion:', err);
        }

        // Compile template with Handlebars
        const template = handlebars.compile(htmlTemplate);

        // Prepare data for template
        const templateData = {
            studentName: details.studentName,
            courseName: details.courseName,
            description: details.description,
            completionDate: details.completionDate,
            certificateId: details.certificateId,
            duration: details.duration,
            grade: details.grade,
            organizationName: details.organizationName, // Add this
            signerName: details.signerName, // Add this
            signerTitle: details.signerTitle, // Add this
            logoUrl: logoUrl // Pass base64 logo
        };

        // Render HTML with actual data
        const finalHTML = template(templateData);

        // Launch Puppeteer
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Set viewport to match certificate dimensions
        await page.setViewport({ width: 1123, height: 794 }); // exact A4 ratio at 96 DPI

        // Set the HTML content
        await page.setContent(finalHTML, { waitUntil: 'networkidle0' });

        // Generate PDF with precise dimensions to prevent page breaks
        const pdfBuffer = await page.pdf({
            width: '900px',
            height: '650px',
            printBackground: true,
            margin: {
                top: '0px',
                right: '0px',
                bottom: '0px',
                left: '0px'
            },
            pageRanges: '1'
        });

        // Build final path → uploads/filePath/fileName
        const uploadDir = path.join(__dirname, "../../uploads/certificates");
        const finalPath = path.join(uploadDir, details.certificateId + ".pdf");

        // Ensure directory exists
        fs.mkdirSync(uploadDir, { recursive: true });

        // Save PDF to file
        fs.writeFileSync(finalPath, pdfBuffer);

        return path.basename(finalPath);

    } catch (error) {
        console.error('❌ Error generating certificate:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

const retryAsync = async (fn, retries = 3, delay = 800) => {
    try {
        return await fn();
    } catch (error) {
        if (retries <= 0) {
            throw error;
        }

        console.warn(`generateCertificateFromTemplate failed. Retrying... (${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));

        return retryAsync(fn, retries - 1, delay);
    }
};

exports.generateCertificate = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { courseId } = req.body;

        // 1️⃣ Validate input
        if (!userId || !courseId) {
            return res.status(400).json({
                success: false,
                message: "userId and courseId are required."
            });
        }

        // 2️⃣ Fetch Enrollment
        const enrollment = await enrollments.findOne({
            where: { user_id: userId, course_id: courseId },
        });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: "Enrollment not found for this user and course."
            });
        }

        // 3️⃣ Check if course is completed
        if (!enrollment.is_completed) {
            return res.status(400).json({
                success: false,
                message: "Course not yet completed. Certificate not available."
            });
        }

        // 4️⃣ Fetch related user and course details
        const user = await User.findByPk(userId);
        const course = await Course.findByPk(courseId);

        if (!user || !course) {
            return res.status(404).json({
                success: false,
                message: "User or Course not found."
            });
        }

        // 5️⃣ Fetch organization/partner details based on course creator
        let organizationName = "Queekies"; // Default
        let signerName = "Authorized Signatory"; // Default
        let signerTitle = "Co-Founder"; // Default

        if (course.created_by_type === "partner") {
            // Find partner through user mapping
            const partner = await Partner.findOne({
                where: { id: course.created_by },
                include: [{ model: User, as: "user" }]
            });

            if (partner) {
                organizationName = partner.name;
                signerName = partner.partner_type === "Organization"
                    ? (partner.contact_person_name || "Authorized Signatory")
                    : partner.name;
                signerTitle = partner.partner_type === "Organization"
                    ? "Authorized Signatory"
                    : "Instructor";
            }
        } else if (course.created_by_type === "admin") {
            // Fetch admin details if needed
            const admin = await Admin.findByPk(course.created_by);
            if (admin) {
                // You can customize admin organization name if needed
                organizationName = "Queekies";
            }
        }

        // 6️⃣ Prepare certificate details
        const completionDate = enrollment.completed_at
            ? new Date(enrollment.completed_at)
            : new Date();

        // Create a sequential ID (example: CERT-20251810XXX)
        const currentYear = completionDate.getFullYear();
        const currentDay = String(completionDate.getDate()).padStart(2, "0");
        const currentMonth = String(completionDate.getMonth() + 1).padStart(2, "0");

        // Find last generated certificate for sequence
        const lastCert = await enrollments.findOne({
            where: {
                is_completed: true,
                completed_at: { [Op.ne]: null },
            },
            order: [["completed_at", "DESC"]],
        });

        let seq = 1;
        if (lastCert) {
            seq = lastCert.id + 1;
        }

        const certificateId = `CERT-${currentYear}${currentDay}${currentMonth}${String(seq).padStart(3, "0")}`;

        // Convert duration to readable format
        const durationInMinutes = course.duration_minutes || 0;
        const duration = durationInMinutes >= 60
            ? `${Math.floor(durationInMinutes / 60)} hours ${durationInMinutes % 60} mins`
            : `${durationInMinutes} mins`;

        // Grade logic
        const grade = enrollment.completion_percentage >= 90
            ? "A+"
            : enrollment.completion_percentage >= 75
                ? "A"
                : enrollment.completion_percentage >= 60
                    ? "B"
                    : "C";

        // 7️⃣ Generate certificate PDF with organization details
        const pdfPath = await retryAsync(() =>
            generateCertificateFromTemplate({
                studentName: user.full_name,
                courseName: course.title,
                description: stripHtmlTags(course.description),
                completionDate: completionDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                certificateId,
                duration,
                grade,
                organizationName,
                signerName,
                signerTitle
            })
        );

        // 8️⃣ Update enrollment with certificate path
        await enrollments.update({
            certificate_url: '/certificates/' + pdfPath
        }, {
            where: {
                user_id: userId,
                course_id: courseId
            }
        });

        // 9️⃣ Return response
        return res.json({
            success: true,
            message: "Certificate generated successfully.",
            path: '/certificates/' + pdfPath,
            certificateId,
            studentName: user.full_name,
            courseName: course.title,
            completionDate,
            organizationName
        });

    } catch (error) {
        next(error);
    }
};

// Create a new certificate template
exports.createCertificateTemplate = async (req, res, next) => {
    try {
        // Assuming you have user authentication middleware that adds a user object to the request
        const createdBy = req.user ? req.user.id : null; // Get the user ID from the request (adjust as needed)

        const template = await certificate_templates.create({
            ...req.body,
            created_by: createdBy,
        });
        res.status(201).json(template);
    } catch (error) {
        next(error);
    }
};

// Get all certificate templates
exports.getCertificateTemplates = async (req, res, next) => {
    try {
        const templates = await certificate_templates.findAll();
        res.status(200).json(templates);
    } catch (error) {
        next(error);
    }
};

// Update an existing certificate template
exports.updateCertificateTemplate = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updatedBy = req.user ? req.user.id : null; // Get the user ID from the request

        const template = await certificate_templates.findByPk(id);

        if (!template) {
            return res.status(404).json({ error: 'Certificate template not found' });
        }

        await template.update({
            ...req.body,
            updated_by: updatedBy,
            updated_at: new Date(), // Only needed if timestamps: false
        });

        res.status(200).json(template);
    } catch (error) {
        next(error);
    }
};

// Delete a certificate template
exports.deleteCertificateTemplate = async (req, res, next) => {
    try {
        const { id } = req.params;
        const template = await certificate_templates.findByPk(id);

        if (!template) {
            return res.status(404).json({ error: 'Certificate template not found' });
        }

        await template.destroy();
        res.status(204).send(); // No content on successful deletion
    } catch (error) {
        next(error);
    }
};

// Create a new issued certificate
exports.createIssuedCertificate = async (req, res, next) => {
    try {
        // Assuming you have user authentication middleware
        const createdBy = req.user ? req.user.id : null; // Get the user ID from the request

        const issuedCertificate = await issued_certificates.create({
            ...req.body,
            created_by: createdBy,
        });
        res.status(201).json(issuedCertificate);
    } catch (error) {
        next(error);
    }
};

// Get all issued certificates
exports.getIssuedCertificates = async (req, res, next) => {
    try {
        const certificates = await issued_certificates.findAll();
        res.status(200).json(certificates);
    } catch (error) {
        next(error);
    }
};

// Get a specific issued certificate by ID
exports.getIssuedCertificateById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const certificate = await issued_certificates.findByPk(id);

        if (!certificate) {
            return res.status(404).json({ error: 'Issued Certificate not found' });
        }

        res.status(200).json(certificate);
    } catch (error) {
        next(error);
    }
};

// Update an existing issued certificate
exports.updateIssuedCertificate = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updatedBy = req.user ? req.user.id : null; // Get the user ID from the request

        const certificate = await issued_certificates.findByPk(id);

        if (!certificate) {
            return res.status(404).json({ error: 'Issued certificate not found' });
        }

        await certificate.update({
            ...req.body,
            updated_by: updatedBy,
            updated_at: new Date(), // Only needed if timestamps: false
        });

        res.status(200).json(certificate);
    } catch (error) {
        next(error);
    }
};

// Delete an issued certificate
exports.deleteIssuedCertificate = async (req, res, next) => {
    try {
        const { id } = req.params;
        const certificate = await issued_certificates.findByPk(id);

        if (!certificate) {
            return res.status(404).json({ error: 'Issued certificate not found' });
        }

        await certificate.destroy();
        res.status(204).send(); // No content on successful deletion
    } catch (error) {
        next(error);
    }
};
