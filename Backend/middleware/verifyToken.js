const jwt = require("jsonwebtoken");
const User = require("../models/auth/user");

exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.token; // Read token from cookies
    if (!token) {
      return next(); // Proceed to controller
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // Find user in the database
    const user = await User.findOne({ where: { id: decoded.id } });

    // Check if session token matches
    if (!user || user.session_token !== decoded.sessionToken) {
      return res
        .status(401)
        .json({ message: "Session expired. Please log in again." });
    }

    req.user = user; // Attach user to request object
    return next(); // Proceed to controller
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid token. Please log in again." });
  }
};
