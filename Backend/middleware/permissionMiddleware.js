const jwt = require("jsonwebtoken");
const Permission = require("../models/auth/RoleAndPermission/Permission");
const RolePermission = require("../models/auth/RoleAndPermission/RolePermission");
const Role = require("../models/auth/RoleAndPermission/Role");

const checkPermission = (section, action) => {
  return async (req, res, next) => {
    try {

      let token;

      if (req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (!token || token === "null" || token === "undefined") {
        const error = new Error("Not authorized, no token");
        error.statusCode = 401;
        return next(error);
      }


      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);


      if (decoded.role === "user") {
        return next();
      }

      const roleId = req.user?.roleId; // Assuming you attach roleId to req.user in auth middleware
      if (!roleId) {
        return res.status(403).json({ message: "Role ID not found." });
      }

      const role = await Role.findByPk(roleId);


      if (role) {
        if (!role.is_active) {
          return res.status(404).json({ message: "Role is Disable." });
        }
      } else {
        return res.status(404).json({ message: "Role not defined." });
      }

      // Find permission
      const permission = await Permission.findOne({ where: { section, action } });
      if (!permission) {
        return res.status(404).json({ message: "Permission not defined." });
      }


      // Check if role has the permission
      const hasPermission = await RolePermission.findOne({
        where: {
          roleId,
          permissionId: permission.id
        }
      });


      if (!hasPermission) {
        return res.status(403).json({ success: false, message: "Permission denied." });
      }

      return next();
    } catch (error) {
      console.error("Permission check failed:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  };
};

module.exports = checkPermission;
