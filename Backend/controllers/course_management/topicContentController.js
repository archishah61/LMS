const { callProcedure } = require("../../utils/procedure/callProcedure");
const TopicContent = require('../../models/course_management/topic_content');
const Module = require("../../models/course_management/module");
// Assign an assignment or quiz to a topic using stored procedure
const assignContentToTopic = async (req, res, next) => {
  try {
    const contentArray = req.body;

    // If array is empty, return success since there's nothing to assign
    if (!Array.isArray(contentArray)) {
      return res.status(400).json({ success: false, message: "Request body must be an array." });
    }

    // If array is empty, return success since there's nothing to assign
    if (contentArray.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No content to assign",
        data: []
      });
    }

    const results = [];

    for (const item of contentArray) {
      const { module_id, topic_id, assignment_id, quiz_id, created_by, updated_by } = item;

      if (!module_id || !topic_id || !created_by || !updated_by) {
        return res.status(400).json({
          success: false,
          message: "module_id, topic_id, created_by, and updated_by are required in every item.",
        });
      }

      const result = await callProcedure("assignContentToTopic", [
        module_id,
        topic_id,
        assignment_id || null,
        quiz_id || null,
        created_by,
        updated_by,
      ]);

      results.push(result);
    }

    return res.status(200).json({
      success: true,
      message: "Content assigned to topics successfully",
      data: results,
    });
  } catch (error) {
    console.error("Error in assignContentToTopic:", error);

    if (error.parent && error.parent.sqlState === "45000") {
      const sqlMessage = error.parent.sqlMessage || "";
      const [code, type, message] = sqlMessage.split("|");

      if (code === "E409") {
        return res.status(409).json({ success: false, message });
      } else if (code === "E400") {
        return res.status(400).json({ success: false, message });
      }
    }

    return res.status(500).json({ success: false, message: "An unexpected error occurred.", error });
  }
};

// Remove an assignment or quiz from a topic using stored procedure
const removeContentFromTopic = async (req, res, next) => {
  try {
    const { topic_id } = req.params;
    const { assignment_id, quiz_id } = req.body;


    if (!topic_id || (!assignment_id && !quiz_id)) {
      return res.status(400).json({
        success: false,
        message: "topic_id is required. Either assignment_id or quiz_id must be provided.",
      });
    }

    const result = await callProcedure("removeContentFromTopic", [
      parseInt(topic_id),
      assignment_id || null,
      quiz_id || null
    ]);


    return res.status(200).json({
      success: true,
      message: "Content removed from topic successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in removeContentFromTopic:", error);

    if (error.parent && error.parent.sqlState === '45000') {
      const sqlMessage = error.parent.sqlMessage || '';
      const [code, type, message] = sqlMessage.split('|');


      if (code === 'E404') {
        return res.status(404).json({ success: false, message });
      } else if (code === 'E400') {
        return res.status(400).json({ success: false, message });
      }
    }

    return res.status(500).json({ success: false, message: "An unexpected error occurred.", error });
  }
};

// Get the topic's content by topic ID using stored procedure
const getTopicContentByTopicId = async (req, res, next) => {
  try {
    const { topic_id } = req.params;
    const result = await callProcedure("getTopicContentByTopicId", [topic_id]);

    // Ensure result is an array
    const resultArray = Array.isArray(result) ? result : [result];

    if (!resultArray || resultArray.length === 0 || !resultArray[0]) {
      return res.status(404).json({ success: false, message: "No content found for the given topic ID." });
    }

    res.status(200).json({
      success: true,
      message: "Topic content retrieved successfully",
      data: resultArray,
    });
  } catch (error) {
    next(error);
  }
};

// Get the topic's content by module ID using stored procedure
const getTopicContentByModuleId = async (req, res, next) => {
  try {
    const { module_id } = req.params;


    // const data = await Module.findOne({
    //   where: { public_hash: module_id },
    // });


    const result = await callProcedure("getTopicContentByModuleId", [module_id]);

    // Ensure result is an array
    const resultArray = Array.isArray(result) ? result : [result];

    if (!resultArray || resultArray.length === 0 || !resultArray[0]) {
      return res.status(404).json({ success: false, message: "No content found for the given module ID." });
    }

    res.status(200).json({
      success: true,
      message: "Topic content retrieved successfully",
      data: resultArray,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  assignContentToTopic,
  removeContentFromTopic,
  getTopicContentByTopicId,
  getTopicContentByModuleId,
};
