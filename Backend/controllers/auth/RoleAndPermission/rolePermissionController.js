const { callProcedure } = require("../../../utils/procedure/callProcedure"); // Adjust path accordingly
const Validation = require("../../../validations");

const manageRolePermission = async (req, res, next) => {
  try {
    const { roleId, permissions } = req.body;

    if (!roleId || !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: "roleId and permissions array are required",
      });
    }

    Validation.isNumber(roleId, "Role ID must be a valid number");
    Validation.isArray(permissions, { min: 0 }, "Permissions must be a non-empty array");

    const { success, error } = await callProcedure("manageRolePermission", [
      roleId,
      JSON.stringify(permissions),
    ]);

    if (!success) {
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "Permissions updated for the role successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getRolePermissionsByRoleId = async (req, res, next) => {
  try {
    const id = req.params.id || req.user?.roleId;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "roleId is required",
      });
    }

    Validation.isNumber(id, "Role ID must be a valid number");

    const { success, data, error } = await callProcedure("getRolePermissionsByRoleId", [id, req.user?.roleId ? "active" : null]);

    if (!success) {
      return next(error);
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  manageRolePermission,
  getRolePermissionsByRoleId,
};
