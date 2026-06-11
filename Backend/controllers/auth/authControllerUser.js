const User = require("../../models/auth/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { callProcedure } = require("../../utils/procedure/callProcedure");
const { callProcedureChallenge } = require("../../utils/procedure/callProcedureChallenge");
const Validation = require("../../validations");
const sendMail = require('../../config/mailer');
const { notifyForceLogout, disconnectUserSocket } = require("../../socket/socket");
const { logUserActivity } = require('../../utils/activity/logUserActivity');
const PromoCode = require("../../models/promocode/promocode");

const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET_KEY || 'refresh_secret_key';

// In-memory OTP store (for demo; use DB or cache in production)
const otpStore = {};

// Helper functions to generate tokens
function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '15m' });
}
function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

// Signup Controller
exports.signup = async (req, res, next) => {
  try {
    // Only extract required fields from req.body, and handle optional fields separately
    const { full_name, username, email, password, mobile_no, location, country_id, state_id, city_id, img, app_platform } = req.body;

    // Validate required fields
    if (!full_name || !username || !email || !password || !country_id || !state_id || !city_id) {
      return res.status(400).json({ message: "Full name, username, email,country_id,state_id,city_id and password are required fields" });
    }

    Validation.isString(full_name, "Full name must be a string");
    Validation.isString(username, "Username must be a string");
    Validation.isEmail(email, "Email must be a string");
    Validation.isStrongPassword(password, "Password must be 8+ chars with uppercase, number, and special character string.");
    if (mobile_no) Validation.isMobileNumber(mobile_no, "Mobile number must be a valid mobile number");
    if (location) Validation.isString(location, "Location must be a string");
    Validation.isNumber(country_id, "Country ID must be a number");
    Validation.isNumber(state_id, "State ID must be a number");
    Validation.isNumber(city_id, "City ID must be a number");

    // Generate a unique session token for the new user
    const sessionToken = uuidv4();

    // Hash password before storing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Platform and login type
    const device_name = null;
    const device_token = null;
    const login_type = 'normal';

    // Create new user using stored procedure
    // Pass optional fields as they are - they will be NULL if not provided
    const { success, data, error } = await callProcedure("createUser", [
      full_name,
      username,
      email,
      hashedPassword,
      mobile_no || null,
      location || null,
      img || null,
      country_id,
      state_id,
      city_id,
      sessionToken,
      device_name,
      device_token,
      app_platform,
      login_type
    ]);

    if (!success) {
      return next(error);
      // return res.status(400).json({  message: "Email or Username already exists" ||  error.message });
    }

    // Get user ID from procedure response
    const userId = data[0].user_id;
    // Create user points and streaks
    await callProcedure("createUserPoints", [userId]);
    await callProcedure("createUserStreaks", [userId]);

    // Generate access and refresh tokens
    const accessToken = generateAccessToken({ id: userId, username, email, sessionToken, role: 'user' });
    const refreshToken = generateRefreshToken({ id: userId, username, email, sessionToken, role: 'user' });

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

    // Store refresh token in DB
    await callProcedure("UpdateUserRefreshToken", [userId, refreshToken]);

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.ip;
    const ua = req.headers['user-agent'];
    logUserActivity({
      userId,
      userIdentifier: email,
      eventCategory: 'auth',
      eventAction: 'signup',
      outcome: 'success',
      entityType: 'user',
      entityId: userId,
      sessionToken,
      ip,
      userAgent: ua,
      metadata: { title: 'User Signup', login_type, app_platform }
    });
    res.status(201).json({ accessToken, refreshToken, message: "User registered successfully" });
  } catch (error) {
    try {
      const ip = (req?.headers?.['x-forwarded-for'] || '').split(',')[0] || req.ip;
      const ua = req?.headers?.['user-agent'];
      logUserActivity({
        userIdentifier: req.body?.email || req.body?.username,
        eventCategory: 'auth',
        eventAction: 'signup',
        entityType: 'user',
        outcome: 'failure',
        ip,
        userAgent: ua,
        metadata: { title: 'User Signup Failed', error: error.message }
      });
    } catch (e) { }
    next(error);
  }
};

// Login Controller (Email or Username)
exports.login = async (req, res, next) => {
  try {
    const { identifier, password, app_platform, login_type, forceLogin } = req.body; // identifier can be email or username

    Validation.isString(identifier, "Identifier must be a string");
    if (login_type !== "social") {
      Validation.isString(password, "Password must be a string");
    }
    // Find user by email or username using stored procedure
    const { success, data, error } = await callProcedure("findUserByEmailOrUsername", [identifier]);

    if (!success) {
      return next(error);
    }

    const [user] = data; // First result set, first row
    const isUserAlreadyLoggedIn = !!(user?.refresh_token);

    if (!user || !user.is_active) {
      const message = !user ? "Invalid credentials" : "Access denied. User account is inactive.";
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.ip;
      const ua = req.headers['user-agent'];
      logUserActivity({
        userId: user ? user.id : null,
        userIdentifier: identifier,
        eventCategory: 'auth',
        eventAction: 'login',
        entityType: 'user',
        outcome: 'failure',
        ip,
        userAgent: ua,
        metadata: { title: 'User Login Failed', reason: message, app_platform, login_type }
      });
      return next(Object.assign(new Error(message), { statusCode: 401 }));
    }

    if (login_type != "social") {
      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.ip;
        const ua = req.headers['user-agent'];
        logUserActivity({
          userId: user.id,
          userIdentifier: identifier,
          eventCategory: 'auth',
          eventAction: 'login',
          entityType: 'user',
          outcome: 'failure',
          ip,
          userAgent: ua,
          metadata: { title: 'User Login Failed', reason: 'invalid_credentials', app_platform, login_type }
        });
        return res.status(400).json({ message: "Invalid credentials" });
      }
    }

    if (isUserAlreadyLoggedIn && forceLogin) {
      // 🔑 Only force logout old device if user confirmed
      notifyForceLogout(user.id);
    }
    // Generate a new session token (unique for each login)
    const sessionToken = uuidv4();

    const device_name = null;
    const device_token = null;

    // Update session token and device/platform info in DB (if your procedure supports it)
    if (typeof user.id !== 'undefined') {
      await callProcedure("updateUserSessionToken", [user.id, sessionToken, device_name, device_token, app_platform, login_type]);
    }

    // Generate access and refresh tokens
    const accessToken = generateAccessToken({ id: user.id, username: user.username, email: user.email, role: "user", sessionToken });
    const refreshToken = generateRefreshToken({ id: user.id, username: user.username, email: user.email, role: "user", sessionToken });
    // // Set the access token as an HTTP-only cookie for security (optional: also set refresh token as httpOnly cookie)
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

    // Store refresh token in DB
    const { success1, data1, error1 } = await callProcedure("UpdateUserRefreshToken", [user.id, refreshToken]);

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.ip;
    const ua = req.headers['user-agent'];
    logUserActivity({
      userId: user.id,
      userIdentifier: user.email,
      eventCategory: 'auth',
      eventAction: 'login',
      outcome: 'success',
      entityType: 'user',
      entityId: user.id,
      sessionToken,
      ip,
      userAgent: ua,
      metadata: { title: 'User Login', app_platform, login_type }
    });
    res.status(200).json({ accessToken, refreshToken, message: "Login successful" });
  } catch (error) {
    try {
      const ip = (req?.headers?.['x-forwarded-for'] || '').split(',')[0] || req.ip;
      const ua = req?.headers?.['user-agent'];
      logUserActivity({
        userIdentifier: req.body?.identifier,
        eventCategory: 'auth',
        eventAction: 'login',
        entityType: 'user',
        outcome: 'failure',
        ip,
        userAgent: ua,
        metadata: { title: 'User Login Failed', error: error.message || 'login_error_catch_block' }
      });
    } catch (e) { }
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    // Clear refresh token in DB
    const userId = req.user?.id;
    if (userId) {
      await callProcedure("UpdateUserRefreshToken", [userId, null]);
    }


    // res.cookie("token", "", {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "lax",
    //   expires: new Date(0), // Expire the cookie immediately
    // });

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.ip;
    const ua = req.headers['user-agent'];
    logUserActivity({
      userId: userId || null,
      userIdentifier: req.user?.email || null,
      eventCategory: 'auth',
      eventAction: 'logout',
      outcome: 'success',
      entityType: 'user',
      entityId: userId || null,
      ip,
      userAgent: ua,
      metadata: { title: 'User Logout', reason: 'user_initiated' }
    });

    disconnectUserSocket(userId, "student");

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    next(error);
  }
};

exports.googleLogin = async (req, res, next) => {
  const { uid, name, email, picture } = req.user;
  const { app_platform, forceLogin } = req.body; // Get app_platform from request body

  Validation.isString(uid, "UID must be a string");
  Validation.isString(name, "Name must be a string");
  Validation.isEmail(email, "Email must be a valid email address");
  if (picture) Validation.isString(picture, "Picture must be a string");

  try {
    // Platform and login type
    const device_name = null;
    const device_token = null;
    const login_type = 'social';

    // Check if user exists
    const { success: findSuccess, data: findData } = await callProcedure("findUserByEmailOrUsername", [email]);
    let user = findData[0]; // First result set, first row

    if (!user) {
      // Generate a random username with 3 random digits
      let baseUsername = name.toLowerCase().replace(/\s+/g, "_");
      let uniqueUsername = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;

      // Generate a unique session token for the new user
      const sessionToken = uuidv4();

      // Create a placeholder password (Google login doesn't require password)
      // const placeholderPassword = await bcrypt.hash("googleLoginPassword", await bcrypt.genSalt(10));

      // Create a new user using stored procedure
      const { success, data, error } = await callProcedure("createUser", [
        name,
        uniqueUsername,
        email,
        null,
        null, // mobile_no
        null, // location
        picture, // profile_image
        null,
        null,
        null,
        sessionToken,
        device_name,
        device_token,
        app_platform,
        login_type
      ]);

      if (!success) {
        return next(error);
      }
      const userId = data[0].user_id;

      // Create user points and streaks
      await callProcedure("createUserPoints", [userId]);
      await callProcedure("createUserStreaks", [userId]);

      // Get the created user
      const { data: userData } = await callProcedure("getUserById", [userId]);
      user = userData[0];

      // Generate access and refresh tokens
      const accessToken = generateAccessToken({
        id: user.id,
        username: user.username,
        email: user.email,
        picture,
        role: "user",
        sessionToken,
      });
      const refreshToken = generateRefreshToken({
        id: user.id,
        username: user.username,
        email: user.email,
        picture,
        role: "user",
        sessionToken,
      });

      // Set the access token as an HTTP-only cookie for security
      // res.cookie("token", accessToken, {
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === "production",
      //   sameSite: "lax",
      //   maxAge: 15 * 60 * 1000, // 15 minutes
      // });
      // // Set refresh token as cookie
      // res.cookie("refreshToken", refreshToken, {
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === "production",
      //   sameSite: "lax",
      //   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      // });

      // Store refresh token in DB
      await callProcedure("UpdateUserRefreshToken", [userId, refreshToken]);

      // Log social signup
      try {
        const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.ip;
        const ua = req.headers['user-agent'];
        logUserActivity({
          userId: userId,
          userIdentifier: email,
          eventCategory: 'auth',
          eventAction: 'signup',
          entityType: 'user',
          outcome: 'success',
          ip,
          userAgent: ua,
          metadata: { reason: 'user_initiated', login_type, app_platform }
        });
      } catch (e) { }

      return res.status(201).json({ accessToken, refreshToken, message: "User registered successfully" });
    } else {
      // Generate a unique session token for the existing user

      const isUserAlreadyLoggedIn = !!(user?.refresh_token);

      if (isUserAlreadyLoggedIn && forceLogin) {
        // 🔑 Only force logout old device if user confirmed
        notifyForceLogout(user.id);
      }

      if (!user || !user.is_active) {
        const message = !user
          ? "Invalid credentials"
          : "Access denied. User account is inactive.";
        return next(Object.assign(new Error(message), { statusCode: 401 }));
      }
      const sessionToken = uuidv4();

      // Update session token in DB
      await callProcedure("updateUserSessionToken", [user.id, sessionToken]);

      // Generate access and refresh tokens
      const accessToken = generateAccessToken({
        id: user.id,
        username: user.username,
        email: user.email,
        picture,
        role: "user",
        sessionToken,
      });
      const refreshToken = generateRefreshToken({
        id: user.id,
        username: user.username,
        email: user.email,
        picture,
        role: "user",
        sessionToken,
      });

      // Set the access token as an HTTP-only cookie for security
      // res.cookie("token", accessToken, {
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === "production",
      //   sameSite: "lax",
      //   maxAge: 15 * 60 * 1000, // 15 minutes
      // });
      // // Set refresh token as cookie
      // res.cookie("refreshToken", refreshToken, {
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === "production",
      //   sameSite: "lax",
      //   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      // });

      // Store refresh token in DB
      await callProcedure("UpdateUserRefreshToken", [user.id, refreshToken]);

      // Log social login success
      try {
        const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.ip;
        const ua = req.headers['user-agent'];
        logUserActivity({
          userId: user.id,
          userIdentifier: email,
          eventCategory: 'auth',
          eventAction: 'login',
          entityType: 'user',
          outcome: 'success',
          sessionToken,
          ip,
          userAgent: ua,
          metadata: { login_type, app_platform }
        });
      } catch (e) { }

      return res.status(200).json({ accessToken, refreshToken, message: "Login successful" });
    }
  } catch (error) {
    try {
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.ip;
      const ua = req.headers['user-agent'];
      logUserActivity({
        userIdentifier: email,
        eventCategory: 'auth',
        eventAction: 'login',
        entityType: 'user',
        outcome: 'failure',
        ip,
        userAgent: ua,
        metadata: { provider: 'google', error: error.message }
      });
    } catch (e) { }
    next(error);
  }
};

// Get User by ID
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;


    Validation.isNumber(id, "ID must be a number");

    // Find user by ID using stored procedure
    const { success, data, error } = await callProcedure("getUserById", [id]);

    if (!success) {
      return next(error);
      // return res.status(400).json({ message: error.message || "Error fetching user" });
    }

    const [user] = data; // First result set, first row

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// Update User Profile
exports.updateUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      username,
      email,
      mobile_no,
      location,
      currentPassword,
      newPassword,
      country_id,    // ← Add these
      state_id,      // ←
      city_id,       // ←
    } = req.body;


    Validation.isNumber(id, "ID must be a number");
    Validation.isString(full_name, "Full name must be a string");
    Validation.isString(username, "Username must be a string");
    Validation.isEmail(email, "Email must be a valid email address");
    if (mobile_no) Validation.isMobileNumber(mobile_no, "Mobile number must be a valid mobile number");
    if (location) Validation.isString(location, "Location must be a string");
    if (country_id) Validation.isNumber(country_id, "Country ID must be a number");
    if (state_id) Validation.isNumber(state_id, "State ID must be a number");
    if (city_id) Validation.isNumber(city_id, "City ID must be a number");
    if (newPassword) Validation.isStrongPassword(newPassword, "New password must be 8+ chars with uppercase, number, and special character.");
    if (currentPassword) Validation.isString(currentPassword, "Current Password must be 8+ chars with uppercase, number, and special character.");

    // Get user by ID to check existence
    const { success: getUserSuccess, data: getUserData } = await callProcedure("getUserById", [id]);

    if (!getUserSuccess || !getUserData[0]) {
      return res.status(404).json({ message: "User not found" });
    }

    // If updating password, verify old password first
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required" });
      }

      // Get user's current password hash
      const { data: passwordData } = await callProcedure("getUserPassword", [id]);

      const currentPasswordHash = passwordData[0][0].password;

      // Compare the entered current password with stored hash
      const isMatch = await bcrypt.compare(currentPassword, currentPasswordHash);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect current password" });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update user's password
      await callProcedure("updateUserPassword", [id, hashedPassword]);
    }

    // Get uploaded file path (if an image was uploaded)
    const profile_image = req.file
      ? `/user/image/${req.file.filename}`
      : (getUserData[0]?.profile_image || null);

    // Update user profile - NOW PASSING 10 PARAMETERS
    const { success: updateSuccess, data: updateData, error: updateError } = await callProcedure("updateUserProfile", [
      id,
      full_name,
      username,
      email,
      mobile_no,
      location,
      profile_image,
      country_id || null,    // ← Parameter 7
      state_id || null,      // ← Parameter 8
      city_id || null        // ← Parameter 9
    ]);

    if (!updateSuccess) {
      return next(updateError);
    }

    try {
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.ip;
      const ua = req.headers['user-agent'];
      const changedPassword = !!newPassword;
      logUserActivity({
        userId: Number(id),
        userIdentifier: email,
        eventCategory: 'profile',
        eventAction: 'update',
        entityType: 'user',
        outcome: 'success',
        ip,
        userAgent: ua,
        metadata: { title: 'Profile Updated', password_changed: !!newPassword }
      });
      if (newPassword) {
        logUserActivity({
          userId: Number(id),
          userIdentifier: email,
          eventCategory: 'auth',
          eventAction: 'password_change',
          entityType: 'user',
          outcome: 'success',
          ip,
          userAgent: ua,
          metadata: { title: 'Password Changed' }
        });
      }
    } catch (e) { }

    res.status(200).json({ message: "Profile updated successfully", user: updateData[0][0] });
  } catch (error) {
    next(error);
  }
};

// Delete Profile Image Controller
exports.deleteProfileImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    Validation.isNumber(id, "ID must be a number");
    // Get current profile image path
    const { success: getUserSuccess, data: getUserData } = await callProcedure("getUserById", [id]);

    if (!getUserSuccess || !getUserData[0]) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentImage = getUserData[0].profile_image;

    if (!currentImage) {
      return res.status(400).json({ message: "No profile image to delete" });
    }

    // Construct file path
    const imagePath = path.join(__dirname, "../../public", currentImage);

    // Remove the file if it exists
    if (fs.existsSync(imagePath)) {
      await fs.promises.unlink(imagePath);
    }

    // Remove the image path from the database
    await callProcedure("deleteUserProfileImage", [id]);

    res.status(200).json({ message: "Profile image deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    Validation.isNumber(id, "ID must be a number");
    Validation.isStrongPassword(newPassword, "New Password must be 8+ chars with uppercase, number, and special character.");

    // Get user info including login type and password status
    const { success: getUserSuccess, data: getUserData } = await callProcedure("getUserById", [id]);

    if (!getUserSuccess || !getUserData[0]) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = getUserData[0];
    const isSocialLoginWithoutPassword = user.login_type === 'social' && user.isPasswordSet === 0;

    if (!isSocialLoginWithoutPassword) {
      // For normal users or social users who have set a password before
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required" });
      }

      Validation.isString(currentPassword, "Current Password must be 8+ chars with uppercase, number, and special character.");

      // Get user's current password hash
      const { success: getPassSuccess, data: getPassData } = await callProcedure("getUserPassword", [id]);

      if (!getPassSuccess || !getPassData[0]) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentPasswordHash = getPassData[0].password;

      // Verify the current password
      const isMatch = await bcrypt.compare(currentPassword, currentPasswordHash);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect current password" });
      }
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password and set isPasswordSet to 1
    await callProcedure("updateUserPassword", [id, hashedPassword]);

    try {
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.ip;
      const ua = req.headers['user-agent'];
      logUserActivity({
        userId: Number(id),
        userIdentifier: user.email,
        eventCategory: 'auth',
        eventAction: 'password_change',
        entityType: 'user',
        outcome: 'success',
        ip,
        userAgent: ua
      });
    } catch (e) { }
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
};

exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ valid: false, message: "No token provided" });
    }

    // Verify JWT signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // Find user by ID and check if token matches and is not expired
    const { success, data, error } = await callProcedure("getUserById", [decoded.id]);

    if (!success) {
      return res.status(401).json({ valid: false, message: "User not found" });
    }

    const user = data[0];

    // Check if token exists in database and is not expired
    if (!user || user.access_token !== token || new Date(user.token_expiry) < new Date()) {
      return res.status(401).json({ valid: false, message: "Token invalid or expired" });
    }

    // All checks passed
    return res.status(200).json({ valid: true });

  } catch (error) {
    return res.status(401).json({ valid: false, message: "Invalid token" });
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
    const { success, data, error } = await callProcedure("getUserById", [decoded.id]);
    if (!success || !data || !data[0].refresh_token || data[0].refresh_token !== refreshToken) {
      return res.status(403).json({ isValid: false, message: "Refresh token does not match" });
    }

    // All checks passed
    return res.status(200).json({ isValid: true, message: "Refresh Token is Valid" });

  } catch (error) {
    return res.status(401).json({ isValid: false, message: "Invalid token" });
  }
};

// Create User - for admin
exports.createUser = async (req, res, next) => {
  try {
    const { full_name, username, email, password, mobile_no, location, country_id, state_id, city_id, profile_image } = req.body;

    // Validation
    Validation.isString(full_name, "Full name must be a string");
    Validation.isString(username, "Username must be a string");
    Validation.isEmail(email, "Email must be a valid email address");
    Validation.isStrongPassword(password, "Password must be 8+ chars with uppercase, number, and special character.");
    if (mobile_no) Validation.isMobileNumber(mobile_no, "Invalid mobile number");
    if (location) Validation.isString(location, "Location must be a string");
    Validation.isNumber(country_id, "Country ID must be a number");
    Validation.isNumber(state_id, "State ID must be a number");
    Validation.isNumber(city_id, "City ID must be a number");

    // Hash password
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));

    const { success, data, error } = await callProcedure("createUser", [
      full_name,
      username,
      email,
      hashedPassword,
      mobile_no || null,
      location || null,
      profile_image || null,
      country_id,
      state_id,
      city_id,
      null, // session token
      null,
      null,
      null,
      null
    ]);

    if (!success) return next(error);

    return res.status(201).json({ message: "User created successfully", user: data });
  } catch (error) {
    next(error);
  }
};

// Update User - for admin
exports.updateUser = async (req, res, next) => {
  try {

    const { id } = req.params;
    const { full_name, username, email, password, mobile_no, location, profile_image, country_id, state_id, city_id, is_active = null } = req.body;

    Validation.isNumber(id, "ID must be a number");
    if (full_name) Validation.isString(full_name, "Full name must be a string");
    if (username) Validation.isString(username, "Username must be a string");
    if (email) Validation.isEmail(email, "Email must be valid");
    if (mobile_no) Validation.isMobileNumber(mobile_no, "Invalid mobile number");
    if (location) Validation.isString(location, "Location must be a string");
    if (country_id) Validation.isNumber(country_id, "Country ID must be a number");
    if (state_id) Validation.isNumber(state_id, "State ID must be a number");
    if (city_id) Validation.isNumber(city_id, "City ID must be a number");

    let hashedPassword = null;
    if (password) {
      Validation.isStrongPassword(password, "Password must be 8+ chars with uppercase, number, and special character.");

      // Hash password
      const bcrypt = require("bcryptjs");
      hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
    }

    if (!is_active) {
      await callProcedure("UpdateUserRefreshToken", [id, null]);
      disconnectUserSocket(id, "student");
    }

    const { success, data, error } = await callProcedure("updateUser", [
      id,
      full_name || null,
      username || null,
      email || null,
      hashedPassword || null,
      mobile_no || null,
      location || null,
      profile_image || null,
      country_id || null,
      state_id || null,
      city_id || null,
      is_active
    ]);

    if (!success) return next(error);

    return res.status(200).json({ message: "User updated successfully", user: data[0] });
  } catch (error) {
    next(error);
  }
};

// Get All Users (Paginated)- for admin
exports.getAllUsersPaginated = async (req, res, next) => {
  try {
    let { page = 1, limit = 'all', search = "" } = req.query;

    page = parseInt(page);

    if (isNaN(page) || page < 1) page = 1;
    const limitNum = limit === 'all' ? 0 : Number.parseInt(limit, 10) || 10;

    const offset = (page - 1) * limitNum;

    const { success, data, error } = await callProcedureChallenge("getAllUsersWithPagination", [
      limit === 'all' ? 0 : limitNum,
      offset,
      `%${search}%`,
      limit === 'all' || false
    ]);

    if (!success) return next(error);

    let users = Object.values(data[0]);
    const totalCount = data[1][0]?.total_users || 0;
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      data: users,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh-token
exports.refreshToken = async (req, res, next) => {
  try {

    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    } catch (err) {
      return res.status(403).json({ message: "Invalid or expired refresh token" });
    }
    // Optionally: check if refreshToken is in DB for this user
    // Check if refreshToken matches the one in DB
    const { success, data, error } = await callProcedure("getUserById", [decoded.id]);
    if (!success || !data || !data[0].refresh_token || data[0].refresh_token !== refreshToken) {
      return res.status(403).json({ message: "Refresh token does not match" });
    }

    // Issue new access token
    const newAccessToken = generateAccessToken({
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      sessionToken: decoded.sessionToken,
    });
    // res.cookie("token", newAccessToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "lax",
    //   maxAge: 15 * 60 * 1000, // 15 minutes
    // });

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/request-reset-password
exports.requestResetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    Validation.isEmail(email, "Email must be valid");
    // Find user by email
    const { success, data } = await callProcedure("findUserByEmailOrUsername", [email]);
    const user = data && data[0];
    // Always return 200 to prevent user enumeration
    if (!success || !user) {
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.ip;
      const ua = req.headers['user-agent'];
      logUserActivity({
        userIdentifier: email,
        eventCategory: 'auth',
        eventAction: 'password_reset_request',
        entityType: 'user',
        outcome: 'failure',
        ip,
        userAgent: ua,
        metadata: { title: 'Password Reset Requested', stage: 'request', reason: 'email_not_registered' }
      });
      return res.status(400).json({ message: "This email id is not registered." });
    }
    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiryMs = 1 * 60 * 1000; // 1 minute
    const expiryDate = new Date(Date.now() + expiryMs);
    otpStore[email] = { otp, expires: Date.now() + expiryMs };
    try {
      await sendMail(
        email,
        'Your Password Reset OTP',
        `Your OTP for password reset is: ${otp}\nThis OTP will expire in 1 minute (at ${expiryDate.toLocaleTimeString()})`,
        `<p>Your OTP for password reset is: <b>${otp}</b></p><p>This OTP will expire in <b>1 minute</b> (at <b>${expiryDate.toLocaleTimeString()}</b>).</p>`
      );
    } catch (mailErr) {
      console.error("Failed to send OTP email:", mailErr);
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.ip;
      const ua = req.headers['user-agent'];
      logUserActivity({
        userId: user.id,
        userIdentifier: email,
        eventCategory: 'auth',
        eventAction: 'password_reset_request',
        outcome: 'failure',
        ip,
        userAgent: ua,
        metadata: { title: 'Password Reset Email Failed', stage: 'request', reason: 'email_send_failed' }
      });
      return res.status(400).json({ message: "This email id is not valid." });
    }
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.ip;
    const ua = req.headers['user-agent'];
    logUserActivity({
      userId: user.id,
      userIdentifier: email,
      eventCategory: 'auth',
      eventAction: 'password_reset_request',
      entityType: 'user',
      outcome: 'success',
      ip,
      userAgent: ua,
      metadata: { title: 'Password Reset Requested', stage: 'request', expires_in_ms: expiryMs }
    });
    res.status(200).json({ message: "If this email is registered, an OTP has been sent.", expiresIn: expiryMs });
  } catch (error) {
    console.error("Request reset password error:", error);
    try {
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.ip;
      const ua = req.headers['user-agent'];
      logUserActivity({
        userIdentifier: req.body?.email,
        eventCategory: 'auth',
        entityType: 'user',
        eventAction: 'password_reset_request',
        outcome: 'failure',
        ip,
        userAgent: ua,
        metadata: { title: 'Password Reset Request Failed', stage: 'request', error: error.message }
      });
    } catch (e) { }
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
};

// POST /api/auth/verify-reset-otp
exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    Validation.isEmail(email, "Email must be valid");
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.ip;
    const ua = req.headers['user-agent'];
    if (!otpStore[email]) {
      logUserActivity({ userIdentifier: email, eventCategory: 'auth', eventAction: 'password_reset_request', entityType: 'user', outcome: 'failure', ip, userAgent: ua, metadata: { title: 'Password Reset OTP Verification Failed', stage: 'verify_otp', reason: 'otp_missing_or_expired' } });
      return res.status(400).json({ message: "OTP not requested or expired. Please request a new OTP.", expired: true });
    }
    if (otpStore[email].otp !== otp) {
      logUserActivity({ userIdentifier: email, eventCategory: 'auth', eventAction: 'password_reset_request', entityType: 'user', outcome: 'failure', ip, userAgent: ua, metadata: { title: 'Password Reset OTP Verification Failed', stage: 'verify_otp', reason: 'invalid_otp' } });
      return res.status(400).json({ message: "Invalid OTP. Please check and try again.", expired: false });
    }
    if (Date.now() > otpStore[email].expires) {
      delete otpStore[email];
      logUserActivity({ userIdentifier: email, eventCategory: 'auth', eventAction: 'password_reset_request', entityType: 'user', outcome: 'failure', ip, userAgent: ua, metadata: { title: 'Password Reset OTP Expired', stage: 'verify_otp', reason: 'otp_expired' } });
      return res.status(400).json({ message: "OTP expired. Please request a new OTP.", expired: true });
    }
    logUserActivity({ userIdentifier: email, eventCategory: 'auth', eventAction: 'password_reset_request', entityType: 'user', outcome: 'success', ip, userAgent: ua, metadata: { title: 'Password Reset OTP Verified', stage: 'verify_otp' } });
    res.status(200).json({ message: "OTP verified" });
  } catch (error) {
    console.error("Verify OTP error:", error);
    try {
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.ip;
      const ua = req.headers['user-agent'];
      logUserActivity({ userIdentifier: req.body?.email, eventCategory: 'auth', eventAction: 'password_reset_request', entityType: 'user', outcome: 'failure', ip, userAgent: ua, metadata: { title: 'Password Reset OTP Verification Failed', stage: 'verify_otp', error: error.message } });
    } catch (e) { }
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    Validation.isEmail(email, "Email must be valid");
    Validation.isStrongPassword(newPassword, "Password must be 8+ chars with uppercase, number, and special character.");
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.ip;
    const ua = req.headers['user-agent'];
    if (!otpStore[email]) {
      logUserActivity({ userIdentifier: email, eventCategory: 'auth', eventAction: 'password_reset_complete', entityType: 'user', outcome: 'failure', ip, userAgent: ua, metadata: { title: 'Password Reset Failed', stage: 'reset', reason: 'otp_missing_or_expired' } });
      return res.status(400).json({ message: "OTP not requested or expired. Please request a new OTP." });
    }
    if (otpStore[email].otp !== otp) {
      logUserActivity({ userIdentifier: email, eventCategory: 'auth', eventAction: 'password_reset_complete', entityType: 'user', outcome: 'failure', ip, userAgent: ua, metadata: { title: 'Password Reset Failed', stage: 'reset', reason: 'invalid_otp' } });
      return res.status(400).json({ message: "Invalid OTP. Please check and try again." });
    }
    if (Date.now() > otpStore[email].expires) {
      delete otpStore[email];
      logUserActivity({ userIdentifier: email, eventCategory: 'auth', eventAction: 'password_reset_complete', entityType: 'user', outcome: 'failure', ip, userAgent: ua, metadata: { title: 'Password Reset Failed', stage: 'reset', reason: 'otp_expired' } });
      return res.status(400).json({ message: "OTP expired. Please request a new OTP." });
    }
    // Find user by email
    const { success, data } = await callProcedure("findUserByEmailOrUsername", [email]);
    const user = data && data[0];
    if (!success || !user) {
      return res.status(400).json({ message: "User not found" });
    }
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await callProcedure("updateUserPassword", [user.id, hashedPassword]);
    // Invalidate OTP
    delete otpStore[email];
    logUserActivity({ userId: user.id, userIdentifier: email, eventCategory: 'auth', eventAction: 'password_reset_complete', entityType: 'user', outcome: 'success', ip, userAgent: ua, metadata: { title: 'Password Reset Successful', stage: 'reset' } });
    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    try {
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.ip;
      const ua = req.headers['user-agent'];
      logUserActivity({ userIdentifier: req.body?.email, eventCategory: 'auth', eventAction: 'password_reset_complete', entityType: 'user', outcome: 'failure', ip, userAgent: ua, metadata: { title: 'Password Reset Failed', stage: 'reset', error: error.message } });
    } catch (e) { }
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
};

exports.checkIsUserAlreadyLoggedIn = async (req, res) => {
  try {
    const { identifier } = req.body; // identifier can be email or username

    const { success, data, error } = await callProcedure("findUserByEmailOrUsername", [identifier]);
    if (!success) {
      return next(error);
    }

    const [user] = data; // First result set, first row
    const isUserAlreadyLoggedIn = !!(user?.refresh_token);

    res.status(200).json({ isUserAlreadyLoggedIn });
  } catch (error) {
    console.error("Check user login status error:", error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
};