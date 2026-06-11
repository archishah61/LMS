const resetDatabase = require("./resetDbOnce");
const insertDefaultData = require("./defaultData");

const initializeDatabase = async () => {
  try {

    await resetDatabase();
    await insertDefaultData();
    console.log("✅ Default data inserted successfully.");

  } catch (error) {
    console.error("❌ Error inserting data:", error);
  }
};

module.exports = initializeDatabase;
