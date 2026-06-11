const jwt = require("jsonwebtoken");
const Admin = require("../models/auth/admin.js");
const User = require("../models/auth/user.js");
const { Op } = require("sequelize");
const { callProcedure } = require("../utils/procedure/callProcedure.js");
const { Partner } = require("../models/partner/partner.js");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      
      if (!token || token === "null" || token === "undefined") {
        const error = new Error("Not authorized, no token");
        error.statusCode = 401;
        return next(error);
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      let user;

      if (decoded.role === "user") {
        // const { success, data, error } = await callProcedure("getUserById", [
        //   decoded.id,
        // ]);
        // if (!success) {
        //   const err = new Error("No User found with this id");
        //   err.statusCode = 401;
        //   return next(err);
        // }

        // const user = data[0];

        // if (!user || user.access_token !== token || new Date(user.token_expiry) < new Date()) {
        //   const error = new Error("Not authorized, token invalid or expired");
        //   error.statusCode = 401;
        //   return next(error);
        // }

        // req.user = user;

        user = await User.findByPk(decoded.id);
        if (!user || !user.is_active) {
          const message = !user
            ? "Not authorized, no user found with this id"
            : "Access denied. User account is inactive.";
          return next(Object.assign(new Error(message), { statusCode: 401 }));
        }

        req.user = user;
        req.user.role = 'student';

      } else if (decoded.role === "admin") {

        user = await Admin.findByPk(decoded.id);
        if (!user || !user.is_active) {
          const message = !user
            ? "Not authorized, no admin found with this id"
            : "Access denied. Admin account is inactive.";
          return next(Object.assign(new Error(message), { statusCode: 401 }));
        }

        req.user = user;
        req.user.role = decoded.role;

      } else if (decoded.role === "partner") {

        user = await Partner.findByPk(decoded.id);
        if (!user) {
          const error = new Error("Not authorized, no partner found with this id");
          error.statusCode = 401;
          return next(error);
        }
        req.user = user;
        req.user.role = decoded.role;

      }

      return next();
    } catch (error) {
      error.statusCode = 401;
      error.message = "Not authorized, token failed";
      return next(error);
    }

  } else {
    const error = new Error("Not authorized, no authorization header");
    error.statusCode = 401;
    return next(error);
  }
};

module.exports = protect;
