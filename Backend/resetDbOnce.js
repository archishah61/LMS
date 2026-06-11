// resetDbOnce.js
const { Sequelize } = require("sequelize");

const resetDatabase = async () => {
  const rootSequelize = new Sequelize(
    null,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: process.env.DB_DIALECT,
      logging: false,
    }
  );

  try {
    await rootSequelize.query("DROP DATABASE IF EXISTS `e-learning`;");
    await rootSequelize.query("CREATE DATABASE `e-learning`;");
    console.log("🧹 Database reset successfully");
  } catch (err) {
    console.error("❌ Error resetting database:", err);
    process.exit(1);
  } finally {
    await rootSequelize.close();
  }
};

module.exports = resetDatabase;
