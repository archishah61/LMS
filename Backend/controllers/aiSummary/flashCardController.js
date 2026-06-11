const { callProcedure } = require("../../utils/procedure/callProcedure"); // Make sure this path is correct

// Create Flash Cards using stored procedure
exports.createFlashCard = async (req, res) => {
  try {
    const { summary_id, flash_cards } = req.body;

    // Validate input
    if (!Array.isArray(flash_cards) || flash_cards.length === 0) {
      return res.status(400).json({ error: "Flash cards array is required and should not be empty." });
    }

    const createdFlashCards = [];

    for (const flashCard of flash_cards) {
      const { question, answer } = flashCard;

      const { success, data, error } = await callProcedure("createFlashCard", [
        summary_id,
        question,
        answer,
      ]);

      if (!success) {
        return res.status(400).json({ error });
      }

      createdFlashCards.push(data[0][0]); // Assuming SELECT * after INSERT
    }

    res.status(201).json(createdFlashCards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


