const jwt = require("jsonwebtoken");
const Admin = require("../models/auth/admin.js");
const { Partner } = require("../models/partner/partner.js");

const AdminOrPartner = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      // Check if it's an admin
      if (decoded.role === 'admin') {
        req.user = await Admin.findByPk(decoded.id);

        if (!req.user) {
          throw new Error("Admin not found");
        }
      }
      // Check if it's a partner
      else if (decoded.role === 'partner') {
        req.user = await Partner.findByPk(decoded.id);
        if (!req.user || req.user.status !== 'Approved') {
          throw new Error("Partner not found or not approved");
        }
      } else {
        throw new Error("Invalid role");
      }

      req.role = decoded.role; // Add role to request
      next();
    } catch (error) {
      console.error(error);
      error.statusCode = 401;
      error.message = "Not authorized, token failed";
      next(error);
    }
  }

  if (!token) {
    const error = new Error("Not authorized, no token");
    error.statusCode = 401;
    next(error);
  }
};

// Middleware to check for admin role
const isAdmin = (req, res, next) => {
  if (req.role === 'admin') {
    next();
  } else {
    const error = new Error("Not authorized as admin");
    error.statusCode = 403;
    next(error);
  }
};

// Middleware to check for partner role
const isPartner = (req, res, next) => {
  if (req.role === 'partner') {
    next();
  } else {
    const error = new Error("Not authorized as partner");
    error.statusCode = 403;
    next(error);
  }
};

// Middleware to check for either admin or partner
const isAdminOrPartner = (req, res, next) => {
  if (req.role === 'admin' || req.role === 'partner') {
    next();
  } else {
    const error = new Error("Not authorized");
    error.statusCode = 403;
    next(error);
  }
};

module.exports = {
  AdminOrPartner,
  isAdmin,
  isPartner,
  isAdminOrPartner
};