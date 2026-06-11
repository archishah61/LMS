const { callProcedure } = require("../../utils/procedure/callProcedure"); // Make sure this path is correct

// Create Bullet Points using stored procedure
exports.createBulletPoint = async (req, res) => {
  try {
    const { summary_id, bullet_point } = req.body;

    // Validate input
    if (!summary_id || !bullet_point || !Array.isArray(bullet_point)) {
      return res.status(400).json({ error: "summary_id and a non-empty array of bullet_point are required" });
    }

    const createdBulletPoints = [];

    for (const bp of bullet_point) {
      const { success, data, error } = await callProcedure("createBulletPoint", [summary_id, bp]);

      if (!success) {
        return res.status(400).json({ error });
      }

      createdBulletPoints.push(data[0][0]); // Assuming SELECT * after INSERT
    }

    res.status(201).json(createdBulletPoints);
  } catch (error) {
    console.error("Error creating bullet points:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
