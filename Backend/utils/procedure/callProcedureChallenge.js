// utils/dbUtils.js or utils/callProcedure.js

const sequelize = require("../../config/db"); // Update path to your Sequelize instance

const callProcedureChallenge = async (procedureName, params = []) => {
    try {
        // Prepare parameter placeholders
        const placeholders = params.map(() => '?').join(', ');
        const query = `CALL ${procedureName}(${placeholders});`;

        // Execute the stored procedure
        const results = await sequelize.query(query, {
            replacements: params,
            raw: true,
            multipleStatements: true,
            type: sequelize.QueryTypes.SELECT
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

module.exports = { callProcedureChallenge };
