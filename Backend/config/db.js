const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");
dotenv.config();

// Create a new instance of Sequelize using environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT,
    timezone: '+05:30', // This sets the session time zone for every connection
    logging: false,
    dialectOptions: {
      multipleStatements: true, // ✅ This enables support for multiple SELECTs in stored procedures
    },
  }
);

// Export the sequelize instance for use in other parts of the application
module.exports = sequelize;
