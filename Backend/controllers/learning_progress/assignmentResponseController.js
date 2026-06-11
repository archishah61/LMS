// controllers/learning_progress/assignmentResponseController.js

// -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------

const { callProcedure } = require("../../utils/procedure/callProcedure"); // Adjust path accordingly
const AssignmentResponse = require("../../models/learning_progress/assignmentResponse");

// Create Assignment Response (Bulk Create)
exports.createAssignmentResponse = async (req, res, next) => {

  try {
    const { success, data, error } = await callProcedure("bulkCreateAssignmentResponses", [
      JSON.stringify(req.body)
    ]);

    if(!success && error) return next(error);

    if (!success) {
      return res.status(400).json({ error });
    }

    res.status(201).json(data[0]);
  } catch (error) {
    next(error);
  }
};

// Get Assignment Responses by Completion ID
exports.getAssignmentResponsesByCompletionId = async (req, res, next) => {
  try {
    const { completionId } = req.params;

    if (!completionId) {
      return res.status(400).json({
        success: false,
        message: "Completion ID is required"
      });
    }

    const responses = await AssignmentResponse.findAll({
      where: {
        assignmentCompletionId: completionId
      },
      attributes: [
        'id',
        'assignmentCompletionId',
        'questionId',
        'selectedAnswer',
        'optionIndex',
        'paragraph_meta_data',
        'created_at',
        'updated_at'
      ],
      order: [['id', 'ASC']],
      raw: true
    });

    if (!responses || responses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No responses found for this completion"
      });
    }

    return res.status(200).json({
      success: true,
      data: responses,
      message: "Assignment responses fetched successfully"
    });

  } catch (error) {
    next(error);
  }
};

