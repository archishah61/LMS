const bcrypt = require('bcryptjs');
const { Partner } = require('../../models/partner/partner');
const User = require("../../models/auth/user");
const { Op, or } = require('sequelize');
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const Role = require('../../models/auth/RoleAndPermission/Role');
const sendMail = require('../../config/mailer'); // adjust the path as needed
const dotenv = require('dotenv');
const Validation = require('../../validations');
const { callProcedure } = require('../../utils/procedure/callProcedure');
const { callProcedureChallenge } = require('../../utils/procedure/callProcedureChallenge');
const { disconnectUserSocket } = require('../../socket/socket');

// Load environment variables
dotenv.config();

const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET_KEY || 'refresh_secret_key';

// Helper function to delete file
const deleteFile = (filePath) => {
  if (!filePath) return;

  try {
    // Get the absolute path - assuming the path stored in DB is relative to upload folder
    const fullPath = path.join(process.cwd(), 'uploads', filePath);

    // Check if file exists and delete it
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
  }
};

// Helper functions to generate tokens
function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '15m' });
}
function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

const createPartner = async (req, res, next) => {
  try {
    const {
      user_id,
      partnerType,
      organizationType,
      fullName,
      email,
      phone,
      website,
      contactPersonName,//for  organizationType,
      contactPersonEmail, //for  organizationType,
      contactPersonPhone, //for  organizationType,
    } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: 'Login is required to become a partner or user not found' });
    }

    if (!partnerType || !fullName || !email || !phone) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    /* ---------- VALIDATIONS ---------- */
    Validation.isInteger(user_id, 'User ID must be a valid integer');
    Validation.isEnum(partnerType, ['Individual', 'Organization'], 'Partner type must be either Individual or Organization');
    if (organizationType) Validation.isEnum(organizationType, ['Institute', 'College', 'School', 'Company', 'NGO', 'Other'], 'Invalid organization type');
    Validation.isString(fullName, { min: 2, max: 100 }, 'Full name is required and must be between 2-100 characters');
    Validation.isEmail(email, 'Valid email is required');
    Validation.isMobileNumber(phone, { min: 10, max: 15 }, 'Phone must be 10-15 digits');
    if (website) Validation.isString(website, { min: 0, max: 255 }, 'Website must be a valid URL');
    if (contactPersonEmail) Validation.isEmail(contactPersonEmail, 'Valid contact person email is required');
    if (contactPersonPhone) Validation.isMobileNumber(contactPersonPhone, { min: 10, max: 15 }, 'Contact person phone must be 10-15 digits');
    if (contactPersonName) Validation.isString(contactPersonName, { min: 2, max: 100 }, 'Contact person name is required');

    const role = await callProcedure('getRoleByName', ['partner']);

    if (!role) {
      return res.status(400).json({ message: 'Role not found' });
    }

    // Generate random password
    const randomPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    /* ---------- CALL PROCEDURE ---------- */
    const { success, data, error } = await callProcedure('CreatePartner', [
      user_id,
      partnerType,
      fullName,
      email,
      phone,
      hashedPassword,
      partnerType === 'Organization' ? organizationType : null,
      partnerType === 'Organization' ? contactPersonName : null,
      partnerType === 'Organization' ? contactPersonEmail : null,
      partnerType === 'Organization' ? contactPersonPhone : null,
      website || null,
      role.data[0].id
    ]);


    if (!success) {
      return next(error);
    }

    const newPartner = data[0];

    await sendMail(
      email,
      'Partner Registration Submitted',
      `Dear ${fullName},\n\nYour registration request has been submitted successfully. Please wait while our admin reviews and approves your request.\n\nThank you.`,
      `<p>Dear ${fullName},</p>
       <p>Your registration request has been <strong>submitted successfully</strong>.</p>
       <p>Please wait while our admin reviews and approves your request.</p>
       <p>Thank you.</p>`
    );

    // Send email to admin
    try {
      await sendMail(
        process.env.ADMIN_EMAIL_ID,
        'New Partner Approval Request',
        `A new partner registration request is pending approval:\n\nName: ${fullName}\nEmail: ${email}\nType: ${partnerType}`,
        `<p>A new partner registration request is pending approval:</p>
     <ul>
       <li><strong>Name:</strong> ${fullName}</li>
       <li><strong>Email:</strong> ${email}</li>
       <li><strong>Type:</strong> ${partnerType}</li>
     </ul>
     <p>Please log in to the admin panel to review and approve/reject this request.</p>`
      );
    } catch (adminMailError) {
      console.error("Failed to send admin email:", adminMailError);
    }


    res.status(201).json({
      message: 'Partner created successfully',
      partner: {
        id: newPartner.id,
        name: newPartner.name,
        email: newPartner.email,
        partner_type: newPartner.partner_type,
        status: newPartner.status,
        tempPassword: randomPassword // Remove this in production, just for testing
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAllPartners = async (req, res, next) => {
  try {
    // Optional filtering
    const { limit = "all", offset = "0", search_term, status, partner_type } = req.query;

    if (status && status.toLowerCase() !== 'all') Validation.isEnum(status, ['Pending', 'Approved', 'Rejected'], 'Invalid status value');
    if (partner_type && partner_type.toLowerCase() !== 'all') Validation.isEnum(partner_type, ['Individual', 'Organization'], 'Invalid partner type');

    /* ---------- VALIDATION ---------- */
    if (limit !== "all") {
      Validation.isInteger(limit, "Limit must be a positive integer or 'all'.");
    }

    Validation.isInteger(offset, "Offset must be a non-negative integer.");
    /* --------------------------------- */

    const parsedLimit = limit === "all" ? "all" : Number(limit);
    const parsedOffset = Number(offset);

    /* ---------- CALL PROCEDURE ---------- */
    const { success, data, error } = await callProcedureChallenge('GetAllPartners', [
      search_term || null,
      status && status.toLowerCase() !== 'all' ? status : null,
      partner_type && partner_type.toLowerCase() !== 'all' ? partner_type : null,
      limit === "all" ? 0 : parsedLimit,
      parsedOffset,
      limit === "all" || false
    ]);

    if (!success) {
      return next(error);
    }

    // Process the data to match the expected structure with nested user object
    let partners = Object.values(data[1]).map(partner => {
      // Extract user properties to create nested user object
      const userProps = {};
      Object.keys(partner).forEach(key => {
        if (key.startsWith('user.')) {
          const userKey = key.substring(5); // Remove 'user.' prefix
          userProps[userKey] = partner[key];
          delete partner[key]; // Remove the original property
        }
      });

      // Only include user object if it has properties
      const partnerWithUser = {
        ...partner,
        ...(Object.keys(userProps).length > 0 && { user: userProps })
      };

      return partnerWithUser;
    });

    // // Filter by partner_type if provided (since we handle this post-procedure)
    // if (partner_type) {
    //   partners = partners.filter(partner => partner.partner_type === partner_type);
    // }

    // Exclude password from response
    // partners = partners.map(partner => {
    //   const { password, ...partnerWithoutPassword } = partner;
    //   return partnerWithoutPassword;
    // });

    const meta = data[0][0]

    res.status(200).json({ partners, pagination: { totalPages: limit === "all" ? 1 : Math.ceil(meta.total_count / parsedLimit), totalCount: meta.total_count } });
  } catch (error) {
    next(error);
  }
};

const getPartnerById = async (req, res, next) => {
  try {
    const { id } = req.params;


    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid partner ID' });
    }

    Validation.isInteger(id, 'Partner ID must be a valid integer');

    /* ---------- CALL PROCEDURE ---------- */
    const { success, data, error } = await callProcedure('GetPartnerById', [id]);


    if (!success) {
      return next(error);
    }

    if (data.length === 0) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    // Process the data to match the expected structure with nested user object
    let partner = data[0];
    const userProps = {};

    Object.keys(partner).forEach(key => {
      if (key.startsWith('user.')) {
        const userKey = key.substring(5); // Remove 'user.' prefix
        userProps[userKey] = partner[key];
        delete partner[key]; // Remove the original property
      }
    });

    // Add nested user object if user properties exist
    if (Object.keys(userProps).length > 0) {
      partner.user = userProps;
    }

    // Exclude password from response
    const { password, ...partnerWithoutPassword } = partner;

    res.status(200).json(partnerWithoutPassword);
  } catch (error) {
    next(error);
  }
};

const updatePartner = async (req, res, next) => {
  let newLogoPath = null;

  try {
    const { id } = req.params;


    if (!id || isNaN(parseInt(id))) {
      // Clean up uploaded file if exists
      if (req.file) {
        deleteFile('/partner/logo/' + req.file.filename);
      }
      return res.status(400).json({ message: 'Invalid partner ID' });
    }

    /* ---------- VALIDATIONS ---------- */
    Validation.isInteger(id, 'Partner ID must be a valid integer');

    /* ---------- CALL PROCEDURE TO GET PARTNER ---------- */
    const { success: getPartnerSuccess, data: getPartnerData, error: getPartnerError } = await callProcedure('GetPartnerById', [id]);

    if (!getPartnerSuccess) {
      // Clean up uploaded file if exists
      if (req.file) {
        deleteFile('/partner/logo/' + req.file.filename);
      }
      return next(getPartnerError);
    }

    if (getPartnerData.length === 0) {
      // Clean up uploaded file if exists
      if (req.file) {
        deleteFile('/partner/logo/' + req.file.filename);
      }
      return res.status(404).json({ message: 'Partner not found' });
    }

    const partner = getPartnerData[0];

    // Check if partner is approved
    if (partner.status !== 'Approved') {
      // Clean up uploaded file if exists
      if (req.file) {
        deleteFile('/partner/logo/' + req.file.filename);
      }
      return res.status(403).json({
        message: 'Only approved partners can update their information'
      });
    }

    const {
      fullName,
      email,
      phone,
      password,
      website,
      contactPersonName,
      contactPersonEmail,
      contactPersonPhone,
      description,
      // status
    } = req.body;

    // Validate request body
    if (fullName) Validation.isString(fullName, { min: 2, max: 100 }, 'Full name must be between 2-100 characters');
    if (email) Validation.isEmail(email, 'Valid email is required');
    if (phone) Validation.isMobileNumber(phone, { min: 10, max: 15 }, 'Phone must be 10-15 digits');
    if (password) Validation.isStrongPassword(password, 'Password must be at least 8 characters with uppercase, number, and special character');
    if (website) Validation.isURL(website, 'Website must be a valid URL');
    if (contactPersonName) Validation.isString(contactPersonName, { min: 2, max: 100 }, 'Contact person name must be between 2-100 characters');
    if (contactPersonEmail) Validation.isEmail(contactPersonEmail, 'Valid contact person email is required');
    if (contactPersonPhone) Validation.isMobileNumber(contactPersonPhone, { min: 10, max: 15 }, 'Contact person phone must be 10-15 digits');
    if (description) Validation.isString(description, { min: 3, max: 1000 }, 'Description must be a valid string');

    // Handle profile update with procedure
    let oldLogoPath = partner.logo; // Store old logo path for deletion
    let newLogoPath = null;

    // If logo file is uploaded, update it
    if (req.file) {
      newLogoPath = '/partner/logo/' + req.file.filename;
    }

    // If password is provided, hash and update it separately
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);

      const { success: pwSuccess, error: pwError } = await callProcedure('UpdatePartnerPassword', [
        id,
        hashedPassword
      ]);

      if (!pwSuccess) {
        // Clean up uploaded file if exists
        if (req.file) {
          deleteFile('/partner/logo/' + req.file.filename);
        }
        return next(pwError);
      }
    }

    /* ---------- CALL PROCEDURE TO UPDATE PROFILE ---------- */
    const { success, data, error } = await callProcedure('UpdatePartnerProfile', [
      id,
      fullName || null,
      email || null,
      phone || null,
      website || null,
      description || null,
      newLogoPath,
      partner.partner_type === 'Organization' ? contactPersonName || null : null,
      partner.partner_type === 'Organization' ? contactPersonEmail || null : null,
      partner.partner_type === 'Organization' ? contactPersonPhone || null : null
    ]);


    if (!success) {
      // Clean up uploaded file if exists
      if (req.file) {
        deleteFile('/partner/logo/' + req.file.filename);
      }
      return next(error);
    }

    const updatedPartner = data[0];
    // Only after successful update, delete the old logo file if it exists and a new one was uploaded
    if (oldLogoPath && newLogoPath) {
      deleteFile(oldLogoPath);
    }

    // Filter out sensitive data
    const { password: pwd, ...partnerWithoutPassword } = updatedPartner;

    res.status(200).json({
      message: 'Partner updated successfully',
      partner: {
        id: updatedPartner.id,
        name: updatedPartner.name,
        email: updatedPartner.email,
        partner_type: updatedPartner.partner_type,
        status: updatedPartner.status
      }
    });
  } catch (error) {
    // Clean up newly uploaded file in case of error
    if (req.file) {
      deleteFile('/partner/logo/' + req.file.filename);
    }
    next(error);
  }
};


// Partner Login Controller
const partnerLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;


    /* ---------- VALIDATIONS ---------- */
    Validation.isEmail(email, 'Valid email is required');
    Validation.isString(password, 'Password is required');

    /* ---------- CALL PROCEDURE ---------- */
    const { success, data, error } = await callProcedure('FindPartnerByEmail', [email]);


    if (!success) {
      return next(error);
    }

    if (data.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const partner = data[0];

    // Check if partner is approved
    if (partner.status !== 'Approved') {
      return res.status(403).json({ message: 'Your account is pending approval' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, partner.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate a new session token
    const sessionToken = uuidv4();

    /* ---------- UPDATE SESSION TOKEN ---------- */
    const { success: updateSuccess, data: updateData, error: updateError } =
      await callProcedure('UpdatePartnerSessionToken', [partner.id, sessionToken]);


    if (!updateSuccess) {
      return next(updateError);
    }

    // Generate access and refresh tokens
    const accessToken = generateAccessToken({
      id: partner.id,
      email: partner.email,
      role: 'partner',
      sessionToken,
      partner_type: partner.partner_type
    });
    const refreshToken = generateRefreshToken({
      id: partner.id,
      email: partner.email,
      role: 'partner',
      sessionToken,
      partner_type: partner.partner_type
    });

    // Store refresh token in DB (add a procedure UpdatePartnerRefreshToken)
    await callProcedure('UpdatePartnerRefreshToken', [partner.id, refreshToken]);

    // Set the access and refresh tokens as HTTP-only cookies
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      partner: partnerWithoutPassword,
      mustChangePassword: partner.mustChangePassword
    });
  } catch (error) {
    next(error);
  }
};

// Partner Change Password Controller
const changePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;


    /* ---------- VALIDATIONS ---------- */
    Validation.isInteger(id, 'Partner ID must be a valid integer');
    Validation.isStrongPassword(password, 'New password must be at least 8 characters with uppercase, number, and special character');

    /* ---------- GET PARTNER DETAILS ---------- */
    const { success: getPartnerSuccess, data: getPartnerData, error: getPartnerError } =
      await callProcedure('GetPartnerById', [id]);


    if (!getPartnerSuccess) {
      return next(getPartnerError);
    }

    if (getPartnerData.length === 0) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    const partner = getPartnerData[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    /* ---------- UPDATE PASSWORD ---------- */
    const { success, data, error } = await callProcedure('MustUpdatePartnerPassword', [
      id,
      hashedPassword
    ]);


    if (!success) {
      return next(error);
    }

    res.status(200).json({
      message: 'Password changed successfully',
      mustChangePassword: false
    });
  } catch (error) {
    next(error);
  }
};

const updatePartnerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;


    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid partner ID' });
    }

    if (!status || !['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value. Must be one of: Pending, Approved, Rejected' });
    }

    /* ---------- VALIDATIONS ---------- */
    Validation.isInteger(id, 'Partner ID must be a valid integer');
    Validation.isEnum(status, ['Pending', 'Approved', 'Rejected'], 'Invalid status value');

    /* ---------- CALL PROCEDURE ---------- */
    const { success, data, error } = await callProcedure('UpdatePartnerStatus', [
      id,
      status
    ]);

    if (['Pending', 'Rejected'].includes(status)) {
      await callProcedure('UpdatePartnerRefreshToken', [id, null]);
      disconnectUserSocket(id, 'partner');
    }

    if (!success) {
      return next(error);
    }

    if (data.length === 0) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    const partner = data[0];

    let randomPassword = null;

    // Only generate and hash password if approving
    if (status === 'Approved') {
      randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Update password separately if approved
      const result = await callProcedure('UpdatePartnerPassword', [
        partner.id,
        hashedPassword
      ]);


      if (!result.success) {
        return next(result.error);
      }
    }


    // ✅ Send email if approved
    if (status === 'Approved') {
      const subject = 'Your SmartEdu Partner Application is Approved!';
      const html = `
        <h3>Welcome ${partner.name},</h3>
        <p>Your application as a SmartEdu partner has been <strong>approved</strong>.</p>
        <p>You can now log in using the following credentials:</p>
        <ul>
          <li><strong>Email:</strong> ${partner.email}</li>
          <li><strong>Password:</strong> ${randomPassword}</li>
        </ul>
        <p>We strongly recommend you change your password after first login.</p>
        <br/>
        <p>Thanks,<br/>SmartEdu Partner Team</p>
      `;

      await sendMail(partner.email, subject, '', html);
    } else if (status === 'Rejected') {
      const subject = 'Your SmartEdu Partner Application is Rejected!';
      const html = `
        <h3>Sorry ${partner.name},</h3>
        <p>Your application as a SmartEdu partner has been <strong>rejected</strong>. Please try again.</p>
        <br/>
        <p>Thanks,<br/>SmartEdu Partner Team</p>
      `;
      await sendMail(partner.email, subject, '', html);
    } else if (status === 'Pending') {
      const subject = 'Your SmartEdu Partner Application is Pending Approval';
      const html = `
        <h3>Dear ${partner.name},</h3>
        <p>Your application as a SmartEdu partner is currently <strong>pending approval</strong>.</p>
        <p>Please wait while our admin reviews your application.</p>
        <br/>
        <p>Thanks,<br/>SmartEdu Partner Team</p>
      `;
      await sendMail(partner.email, subject, '', html);
    }

    res.status(200).json({
      message: 'Partner status updated successfully',
      status: partner.status
    });
  } catch (error) {
    next(error);
  }
};

const partnerLogout = async (req, res, next) => {
  try {
    // Clear refresh token in DB (add a procedure UpdatePartnerRefreshToken)
    const partnerId = req.user?.id;
    if (partnerId) {
      await callProcedure('UpdatePartnerRefreshToken', [partnerId, null]);
    }
    // Clear cookies
    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
    });
    res.cookie("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
    });
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;


    /* ---------- VALIDATIONS ---------- */
    Validation.isEmail(email, 'Valid email is required');
    Validation.isStrongPassword(password, 'New password must be at least 8 characters with uppercase, number, and special character');

    /* ---------- CALL PROCEDURE ---------- */
    const { success, data, error } = await callProcedure('GetPartnerOrAdminByEmail', [email]);


    if (!success) {
      return next(error);
    }

    if (data.length === 0) {
      // For security reasons, still send success response even if email not found
      return res.status(200).json({
        message: 'If your email is registered with us, you will receive password reset instructions shortly.'
      });
    }

    const partner = data[0];

    const hashedPassword = await bcrypt.hash(password, 10);

    /* ---------- RESET PASSWORD ---------- */
    const { success: resetSuccess, data: resetData, error: resetError } =
      await callProcedure('ResetPartnerOrAdminPassword', [email, hashedPassword]);


    if (!resetSuccess) {
      return next(resetError);
    }

    // Send email with new password
    await sendMail(
      email,
      'Password Reset',
      `Your password has been reset to: ${password}\n\nPlease change it after logging in.`,
      `<p>Your password has been reset to: <strong>${password}</strong></p>
       <p>Please change it after logging in.</p>`
    );

    res.status(200).json({
      message: 'If your email is registered with us, you will receive password reset instructions shortly.'
    });
  } catch (error) {
    next(error);
  }
};

// Add a new controller for refreshing tokens:
// POST /api/partner/refresh-token
const refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    } catch (err) {
      return res.status(403).json({ message: "Invalid or expired refresh token" });
    }
    // Check if refreshToken matches the one in DB
    const { success, data, error } = await callProcedure('GetPartnerById', [decoded.id]);
    if (!success || !data[0] || data[0].refresh_token !== refreshToken) {
      return res.status(403).json({ message: "Refresh token does not match" });
    }
    // Issue new access token only
    const newAccessToken = generateAccessToken({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      sessionToken: decoded.sessionToken,
      partner_type: decoded.partner_type
    });

    // We'll use the existing refresh token to avoid unnecessary DB updates
    // This keeps the refresh token's original 7-day expiry

    // Return just the new access token to the client
    res.status(200).json({
      accessToken: newAccessToken
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPartner,
  getAllPartners,
  getPartnerById,
  updatePartner,
  updatePartnerStatus,
  partnerLogin,
  partnerLogout,
  changePassword,
  forgotPassword,
  refreshToken
};