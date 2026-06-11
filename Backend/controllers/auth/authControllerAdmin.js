const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { callProcedure } = require("../../utils/procedure/callProcedure");
const Validation = require("../../validations");
const { callProcedureChallenge } = require("../../utils/procedure/callProcedureChallenge");
const { disconnectUserSocket } = require("../../socket/socket");
const Admin = require("../../models/auth/admin");

const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET_KEY || 'refresh_secret_key';

// Helper functions to generate tokens
function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
}
function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

// Login Controller (Email or Username)
exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    Validation.isString(identifier, "Identifier must be a string");
    Validation.isString(password, "Password must be a string");

    // Call the login procedure
    const result = await callProcedure("adminLogin", [identifier]);

    if (!result.success) {
      return next(result.error);
    }

    const [userData] = result.data;

    if (!userData || !userData.id) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate access and refresh tokens
    const accessToken = generateAccessToken({
      id: userData.id,
      username: userData.username,
      email: userData.email,
      role: userData.role // 'admin' or 'partner'
    });
    const refreshToken = generateRefreshToken({
      id: userData.id,
      username: userData.username,
      email: userData.email,
      role: userData.role
    });

    // Store refresh token in the appropriate DB table based on role
    if (userData.role === 'partner') {
      // For partner users, use the partner-specific procedure
      const { success, data, error } = await callProcedure("UpdatePartnerRefreshToken", [userData.id, refreshToken]);
      if (!success) {
        return next(error);
      }
    } else {
      // For admin users, use the admin procedure
      const { success, data, error } = await callProcedure("UpdateAdminRefreshToken", [userData.id, refreshToken]);
      if (!success) {
        return next(error);
      }
    }

    // Set the access token as an HTTP-only cookie for security (optional: also set refresh token as httpOnly cookie)
    // res.cookie("token", accessToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "lax",
    //   maxAge: 15 * 60 * 1000, // 15 minutes
    // });
    // // Optionally set refresh token as cookie
    // res.cookie("refreshToken", refreshToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "lax",
    //   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    // });

    res.status(200).json({ accessToken, refreshToken, message: "Login successful" });
  } catch (error) {
    next(error);
  }
};
// Create Admin
exports.createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, roleId } = req.body;

    Validation.isString(name, "Name must be a string");
    Validation.isEmail(email, "Invalid email format");
    Validation.isNumber(roleId, "Role ID must be a number");
    Validation.isStrongPassword(password, "Password must be 8+ chars with uppercase, number, and special character.");

    const hashedPassword = await bcrypt.hash(password, 10);

    const { success, data, error } = await callProcedure("createAdmin", [name, email, hashedPassword, roleId]);

    if (!success) return next(error);

    res.status(201).json({
      success,
      message: "Admin created successfully",
      data: data[0],
    });
  } catch (error) {
    next(error);
  }
};

// Update Admin
exports.updateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, roleId, password } = req.body;

    Validation.isNumber(id, "ID must be a number");
    if (name) Validation.isString(name, "Name must be a string");
    if (email) Validation.isEmail(email, "Invalid email format");
    if (roleId) Validation.isNumber(roleId, "Role ID must be a number");
    if (password) Validation.isStrongPassword(password, "Password must be 8+ chars with uppercase, number, and special character.");

    // Prepare update fields - only include what's provided in the request
    const updateFields = {};
    if (name) updateFields.username = name;
    if (email) updateFields.email = email;
    if (roleId) updateFields.roleId = roleId;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.password = hashedPassword;
    }

    // Fetch existing admin to retain old profile image if new is not uploaded
    const existingAdmin = await callProcedure("getAdminById", [id]);
    if (!existingAdmin.success || !existingAdmin.data || existingAdmin.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const oldProfileImage = existingAdmin.data[0].profile_image;

    // Get uploaded file path OR fallback to existing one
    const profileImage = req.file
      ? `/admin/image/${req.file.filename}`
      : oldProfileImage;

    const { success, data, error } = await callProcedure("updateAdmin", [
      id,
      updateFields.username || null,
      updateFields.email || null,
      updateFields.password || null,
      updateFields.roleId || null,
      profileImage || null
    ]);

    if (!success) return next(error);

    res.status(200).json({
      success,
      message: "Admin updated successfully",
      data: data[0],
    });
  } catch (error) {
    next(error);
  }
};

// Update Admin Password Only
exports.updateAdminPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Validate Inputs
    Validation.isNumber(id, "ID must be a number");
    Validation.isString(currentPassword, "Current password required");
    Validation.isString(newPassword, "New password required");

    // req.user.password contains hashed password from DB (decoded from JWT middleware)
    const storedHashedPassword = req.user.password;

    // Compare old password
    const isMatch = await bcrypt.compare(currentPassword, storedHashedPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Call Stored Procedure
    const { success, data, error } = await callProcedure("updateAdminPassword", [
      id,
      hashedNewPassword
    ]);

    if (!success) return next(error);

    res.status(200).json({
      success,
      message: "Password updated successfully",
      data: data[0],
    });
  } catch (error) {
    next(error);
  }
};


// Get All Admins
exports.getAllAdmins = async (req, res, next) => {
  try {
    const { search_term = '', role_id = null, limit = 'ALL', offset = 0 } = req.query;

    if (search_term) Validation.isString(search_term, "Search term must be a string");
    if (limit && limit !== "ALL") Validation.isNumber(limit, "Limit must be a number");
    if (offset) Validation.isNumber(offset, "Offset must be a number");

    const parsedLimit = limit === 'ALL' ? 'ALL' : parseInt(limit);
    const parsedOffset = parseInt(offset) || 0;

    const { success, data, error } = await callProcedureChallenge("getAllAdmins", [
      search_term,
      role_id || null,
      parsedLimit,
      parsedOffset,
    ]);

    if (!success) return next(error);

    let admins = Object.values(data[1]);
    const totalCount = data[0][0]?.total_entries || 0;
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success,
      data: admins,
      pagination: {
        total: totalCount,
        totalPages: totalPages
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get Admin By ID
exports.getAdminById = async (req, res, next) => {
  try {
    const { id } = req.params;

    Validation.isNumber(id, "ID must be a number");

    const { success, data, error } = await callProcedure("getAdminById", [id]);

    if (!success) return next(error);

    if (!data[0]) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    res.status(200).json({ success, data: data[0] });
  } catch (error) {
    next(error);
  }
};

// Get Current Admin (Logged In Admin)
exports.getCurrentAdmin = async (req, res, next) => {
  try {

    // req.user is attached by verifyToken middleware
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const adminId = req.user.id;

    const { success, data, error } = await callProcedure("getCurrentAdmin", [adminId]);

    if (!success) return next(error);

    if (!data[0]) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    res.status(200).json({ success, data: data[0] });
  } catch (error) {
    next(error);
  }
};


// Toggle Admin Status (Active/Inactive)
exports.toggleAdminStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user?.id && req.user.id == id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot inactive your own account'
      });
    }

    Validation.isNumber(id, "ID must be a number");

    const admin = await Admin.findByPk(id);

    if (admin?.is_active) {
      const { success: logoutSuccess, data: logoutData, error: logoutError } = await callProcedure("logoutAdminOrPartner", [id, "admin"]);

      if (!logoutSuccess) return next(logoutError);

      disconnectUserSocket(id, 'admin');
    }

    const { success, data, error } = await callProcedure("toggleAdminStatus", [id]);

    if (!success) return next(error);

    res.status(200).json({
      success: true,
      message: "Admin status toggled successfully",
      data: data[0],
    });
  } catch (error) {
    next(error);
  }
};

// Delete Admin
exports.deleteAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    Validation.isNumber(id, "ID must be a number");

    const { success, error } = await callProcedure("deleteAdmin", [id]);

    if (!success) return next(error);

    res.status(200).json({
      success,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/admin/refresh-token
exports.refreshToken = async (req, res, next) => {
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

    let newAccessToken = null;
    let newRefreshToken = null;
    const tokenPayload = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };

    if (decoded.role === 'admin') {
      // Check if refreshToken matches the one in DB
      const { success, data, error } = await callProcedure("getAdminById", [decoded.id]);
      if (!success || !data || !data[0].refresh_token || data[0].refresh_token !== refreshToken) {
        return res.status(403).json({ message: "Refresh token does not match" });
      }
      // Issue new access token
      newAccessToken = generateAccessToken(tokenPayload);

      // Rotate refresh token — issue a new one and update DB
      newRefreshToken = generateRefreshToken(tokenPayload);
      await callProcedure("UpdateAdminRefreshToken", [decoded.id, newRefreshToken]);
    } else {
      // Check if refreshToken matches the one in DB
      const { success, data, error } = await callProcedure("GetPartnerById", [decoded.id]);
      if (!success || !data || !data[0].refresh_token || data[0].refresh_token !== refreshToken) {
        return res.status(403).json({ message: "Refresh token does not match" });
      }
      // Issue new access token
      newAccessToken = generateAccessToken(tokenPayload);

      // Rotate refresh token — issue a new one and update DB
      newRefreshToken = generateRefreshToken(tokenPayload);
      await callProcedure("UpdatePartnerRefreshToken", [decoded.id, newRefreshToken]);
    }

    // Return both new tokens to the client
    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ isValid: false, message: "No refresh token provided" });
    }

    let decoded;

    try {
      decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    } catch (err) {
      return res.status(403).json({ isValid: false, message: "Invalid or expired refresh token" });
    }

    // Check if refreshToken matches the one in DB
    if (decoded.role === 'admin') {
      // Check if refreshToken matches the one in DB
      const { success, data, error } = await callProcedure("getAdminById", [decoded.id]);

      if (!success || !data || !data[0].refresh_token || data[0].refresh_token !== refreshToken) {
        return res.status(403).json({ isValid: false, message: "Refresh token does not match" });
      }
    } else {
      // Check if refreshToken matches the one in DB
      const { success, data, error } = await callProcedure("GetPartnerById", [decoded.id]);

      if (!success || !data || !data[0].refresh_token || data[0].refresh_token !== refreshToken) {
        return res.status(403).json({ isValid: false, message: "Refresh token does not match" });
      }
    }

    // All checks passed
    return res.status(200).json({ isValid: true, message: "Refresh Token is Valid" });

  } catch (error) {
    next(error)
  }
};

exports.logout = async (req, res, next) => {
  try {
    // Clear refresh token in DB
    const userId = req.user?.id;
    const role = req.user?.role;

    const { success, data, error } = await callProcedure("logoutAdminOrPartner", [userId, role]);

    if (!success) return next(error);

    disconnectUserSocket(userId, role);

    res.status(200).json({ message: "Logout successful", data: { userId, role } });
  } catch (error) {
    next(error);
  }
};