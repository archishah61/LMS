// utils/dbUtils.js or utils/callProcedure.js

const sequelize = require("../../config/db"); // Update path to your Sequelize instance

const callProcedure = async (procedureName, params = []) => {
  try {    // Prepare parameter placeholders
    const placeholders = params.map(() => '?').join(', ');
    const query = `CALL ${procedureName}(${placeholders});`;

    // Log the procedure name and parameters

    // Execute the stored procedure
    const results = await sequelize.query(query, {
      replacements: params,
    });


    return { success: true, data: results };
  } catch (error) {
    // console.error(`Error executing procedure ${procedureName}:`, error);
    return {
      success: false,
      error: error || "Procedure call failed",
    };
  }
};


module.exports = { callProcedure };
