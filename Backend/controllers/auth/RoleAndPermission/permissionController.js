const { callProcedure } = require("../../../utils/procedure/callProcedure");
const { callProcedureChallenge } = require("../../../utils/procedure/callProcedureChallenge");
const Validation = require("../../../validations");


// Get All Permissions
const getAllPermissions = async (req, res, next) => {
  try {
    const {
      search_term = '',
      limit = 'ALL',
      offset = 0,
    } = req.query;

    const parsedLimit = 'ALL';
    // const parsedLimit = limit === 'ALL' ? 'ALL' : parseInt(limit);
    const parsedOffset = parseInt(offset) || 0;

    if (search_term) Validation.isString(search_term, { min: 0, max: 255 }, "Search term must be a string with a maximum of 255 characters.");
    if (parsedLimit !== 'ALL') {
      Validation.isNumber(parsedLimit, { min: 1, max: 100 }, "Limit must be a number between 1 and 100 or 'ALL'.");
    }
    if (parsedOffset) Validation.isNumber(parsedOffset, { min: 0 }, "Offset must be a non-negative number.");

    const { success, data, error } = await callProcedureChallenge("getAllPermissions", [
      search_term,
      parsedLimit,
      parsedOffset,
    ]);

    if (!success) return next(error);

    let permissions = Object.values(data[1]);
    const totalCount = data[0][0]?.total_count || 0;

    res.status(200).json({
      success,
      data:permissions,
      totalCount
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getAllPermissions
};
