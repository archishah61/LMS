const BulletPoint = require('../../models/aiSummary/bulletPoint');
const FlashCard = require('../../models/aiSummary/flashCard');
const Summary = require('../../models/aiSummary/summary');

// Create a new summary
exports.createSummary = async (req, res) => {
  try {
    const {
      topic_id,
      general_material_desc_id,
      general_material_pdf_id,
      accordion_id,
      multi_slide_general_desc_id,
      multi_slide_general_pdf_id,
      multi_slide_accordion_id,
      summary
    } = req.body;

    const newSummary = await Summary.create({
      topic_id,
      general_material_desc_id,
      general_material_pdf_id,
      accordion_id,
      multi_slide_general_desc_id,
      multi_slide_general_pdf_id,
      multi_slide_accordion_id,
      user_id: req.user.id,
      summary
    });

    res.status(201).json(newSummary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get summaries by GeneralMaterial description ID
exports.getSummariesByGeneralMaterialDescId = async (req, res) => {
  try {
    const { topic_id, general_material_desc_id } = req.params;
    const userId = req.user.id;

    const summaries = await Summary.findAll({
      where: {
        topic_id,
        general_material_desc_id: Number(general_material_desc_id),
        user_id: userId,
      },
      include: [
        { model: BulletPoint, as: 'bullet_points' },
        { model: FlashCard, as: 'flash_cards' }
      ]
    });

    const formattedSummaries = summaries.map(summary => ({
      ...summary.dataValues,
      bullet_points: summary.bullet_points.map(bp => bp.dataValues),
      flash_cards: summary.flash_cards.map(fc => fc.dataValues)
    }));

    res.status(200).json(formattedSummaries);
  } catch (error) {
    console.error('Error in getSummariesByGeneralMaterialDescId:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get summaries by GeneralMaterial PDF ID
exports.getSummariesByGeneralMaterialPdfId = async (req, res) => {
  try {
    const { topic_id, general_material_pdf_id } = req.params;
    const userId = req.user.id;

    const summaries = await Summary.findAll({
      where: {
        topic_id,
        general_material_pdf_id: Number(general_material_pdf_id),
        user_id: userId,
      },
      include: [
        { model: BulletPoint, as: 'bullet_points' },
        { model: FlashCard, as: 'flash_cards' }
      ]
    });

    const formattedSummaries = summaries.map(summary => ({
      ...summary.dataValues,
      bullet_points: summary.bullet_points.map(bp => bp.dataValues),
      flash_cards: summary.flash_cards.map(fc => fc.dataValues)
    }));

    res.status(200).json(formattedSummaries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get by Accordion ID
exports.getSummariesByAccordionId = async (req, res) => {
  try {
    const { topic_id, accordion_id } = req.params;

    // Get the user ID from the authenticated request
    const user_id = req.user.id;

    // Find the summary for this specific user and topic
    const summaries = await Summary.findOne({
      where: {
        topic_id,
        accordion_id: accordion_id,
        user_id: user_id
      },
      include: [
        { model: BulletPoint, as: 'bullet_points' },
        { model: FlashCard, as: 'flash_cards' }
      ]
    });

    // Return the summary in an array format to maintain consistency
    res.status(200).json(summaries ? [summaries] : []);
  } catch (error) {
    console.error('Error in getSummariesByAccordionId:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get by MultiSlideGeneral description ID
exports.getSummariesByMultiSlideGeneralDescId = async (req, res) => {
  try {
    const { topic_id, multi_slide_general_desc_id } = req.params;
    const userId = req.user.id;

    const summaries = await Summary.findAll({
      where: {
        topic_id,
        multi_slide_general_desc_id: Number(multi_slide_general_desc_id),
        user_id: userId,
      },
      include: [
        { model: BulletPoint, as: 'bullet_points' },
        { model: FlashCard, as: 'flash_cards' }
      ]
    });

    const formattedSummaries = summaries.map(summary => ({
      ...summary.dataValues,
      bullet_points: summary.bullet_points.map(bp => bp.dataValues),
      flash_cards: summary.flash_cards.map(fc => fc.dataValues)
    }));

    res.status(200).json(formattedSummaries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get by MultiSlideGeneral PDF ID
exports.getSummariesByMultiSlideGeneralPdfId = async (req, res) => {
  try {
    const { topic_id, multi_slide_general_pdf_id } = req.params;
    const userId = req.user.id;

    const summaries = await Summary.findAll({
      where: {
        topic_id,
        multi_slide_general_pdf_id: multi_slide_general_pdf_id,
        user_id: userId,
      },
      include: [
        { model: BulletPoint, as: 'bullet_points' },
        { model: FlashCard, as: 'flash_cards' }
      ]
    });

    const formattedSummaries = summaries.map(summary => ({
      ...summary.dataValues,
      bullet_points: summary.bullet_points.map(bp => bp.dataValues),
      flash_cards: summary.flash_cards.map(fc => fc.dataValues)
    }));

    res.status(200).json(formattedSummaries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get by MultiSlideAccordion ID
exports.getSummariesByMultiSlideAccordionId = async (req, res) => {
  try {
    const { topic_id, multi_slide_accordion_id } = req.params;
    const userId = req.user.id;

    const summaries = await Summary.findAll({
      where: {
        topic_id,
        multi_slide_accordion_id: Number(multi_slide_accordion_id),
        user_id: userId,
      },
      include: [
        { model: BulletPoint, as: 'bullet_points' },
        { model: FlashCard, as: 'flash_cards' }
      ]
    });

    const formattedSummaries = summaries.map(summary => ({
      ...summary.dataValues,
      bullet_points: summary.bullet_points.map(bp => bp.dataValues),
      flash_cards: summary.flash_cards.map(fc => fc.dataValues)
    }));

    res.status(200).json(formattedSummaries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
