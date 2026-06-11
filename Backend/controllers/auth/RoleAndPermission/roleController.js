const { disconnectUserSocket } = require("../../../socket/socket");
const { callProcedure } = require("../../../utils/procedure/callProcedure");
const { callProcedureChallenge } = require("../../../utils/procedure/callProcedureChallenge");
const Validation = require("../../../validations");
// Create Role
const createRole = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    Validation.isString(name, { min: 1, max: 100 }, "Role name must be a non-empty string with a maximum of 100 characters.");
    if (description) Validation.isString(description, { min: 0, max: 255 }, "Role description must be a string with a maximum of 255 characters.");

    const { success, data, error } = await callProcedure("createRole", [name, description]);

    if (!success) {
      return next(error);
    }

    res.status(201).json({
      success,
      message: "Role created successfully",
      data: data[0],
    });
  } catch (error) {
    next(error);
  }
};

// Update Role
const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    Validation.isNumber(id, "Role ID must be a valid Number.");
    if (name) Validation.isString(name, { min: 1, max: 100 }, "Role name must be a non-empty string with a maximum of 100 characters.");
    if (description) Validation.isString(description, { min: 0, max: 255 }, "Role description must be a string with a maximum of 255 characters.");

    const { success, data, error } = await callProcedure("updateRole", [id, name, description]);

    if (!success) {
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: data[0],
    });
  } catch (error) {
    next(error);
  }
};

// Get All Roles with Search and Pagination
const getAllRoles = async (req, res, next) => {
  try {
    const {
      search_term = '',
      limit = 'ALL',
      offset = 0,
    } = req.query;

    const parsedLimit = limit === 'ALL' ? 'ALL' : parseInt(limit);
    const parsedOffset = parseInt(offset) || 0;

    if (search_term) Validation.isString(search_term, { min: 0, max: 255 }, "Search term must be a string with a maximum of 255 characters.");
    if (parsedLimit !== 'ALL') {
      Validation.isNumber(parsedLimit, { min: 1, max: 100 }, "Limit must be a number between 1 and 100 or 'ALL'.");
    }
    if (parsedOffset) Validation.isNumber(parsedOffset, { min: 0 }, "Offset must be a non-negative number.");

    const { success, data, error } = await callProcedureChallenge("getAllRoles", [
      search_term,
      parsedLimit,
      parsedOffset,
    ]);

    if (!success) {
      return next(error);
    }

    let roles = Object.values(data[1]);
    const totalCount = data[0][0]?.total_entries || 0;
    const totalPages = Math.ceil(totalCount / parsedLimit);

    res.status(200).json({
      success,
      data: roles,
      pagination: {
        total: totalCount,
        totalPages: totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Role By ID
const getRoleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    Validation.isNumber(id, "Role ID must be a valid Number.");

    const { success, data, error } = await callProcedure("getRoleById", [id]);

    if (!success) {
      return next(error);
    }

    if (!data[0]) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    res.status(200).json({
      success,
      data: data[0],
    });
  } catch (error) {
    next(error);
  }
};

// Toggle Role Status (Active/Inactive)
const toggleRoleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { success, data, error } = await callProcedure("toggleRoleStatus", [id]);

    if (!success) {
      return next(error);
    }

    if (data[0]?.user_details?.admin_ids) {
      for (const adminId of data[0]?.user_details?.admin_ids) {
        const { success: logoutSuccess, data: logoutData, error: logoutError } = await callProcedure("logoutAdminOrPartner", [adminId, "admin"]);

        if (!logoutSuccess) return next(logoutError);

        disconnectUserSocket(adminId, 'admin');
      }
    }

    if (data[0]?.user_details?.partner_ids) {
      for (const partnerId of data[0]?.user_details?.partner_ids) {
        await callProcedure('UpdatePartnerRefreshToken', [partnerId, null]);
        disconnectUserSocket(partnerId, 'partner');
      }
    }

    res.status(200).json({
      success: true,
      message: "Role status toggled successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Delete Role
const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    Validation.isNumber(id, "Role ID must be a valid Number.");
    const { success, error } = await callProcedure("deleteRole", [id]);

    if (!success) {
      return next(error);
    }

    res.status(200).json({
      success,
      message: "Role deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRole,
  updateRole,
  getAllRoles,
  getRoleById,
  toggleRoleStatus,
  deleteRole,
};
