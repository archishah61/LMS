// const { Op } = require("sequelize");
const Topic = require("../../models/course_management/topic");
const {
  enrollments,
} = require("../../models/enrollment_management/enrollment_management");
const ProgressTracking = require("../../models/learning_progress/progressTracking");
const { MultiSlide } = require("../../models/content_management/multi_slide");
const Module = require("../../models/course_management/module");
const { Video } = require("../../models/content_management/video");
const { Audio } = require("../../models/content_management/audio");
const {
  AccordionAttachment,
} = require("../../models/content_management/accordionAttachment");
const { GeneralMaterial } = require("../../models/content_management/genral");
const {
  MultiSlideAccordion,
} = require("../../models/content_management/multiSlideAccordian");
const {
  MultiSlideVideo,
} = require("../../models/content_management/multiSlideVideo");
const {
  MultiSlideAudio,
} = require("../../models/content_management/multiSlideAudio");
const {
  MultiSlideGeneral,
} = require("../../models/content_management/multiSlideGeneral");
const {
  MultiSlideAccordionAttachment,
} = require("../../models/content_management/multiSlideAccordianAttachment");
const { Accordion } = require("../../models/content_management/accordian");
const {
  calculateCourseCompletionPercentage,
  calculateModuleCompletionPercentage,
} = require("../../utils/course_management/calculateCompletionPercentage");
const TopicTag = require("../../models/content_management/tags/tagsTable");
const { Quizzes } = require("../../models/content_management/quizzesModel");
const QuizCompletion = require("../../models/learning_progress/quizCompletion");
const SlideProgress = require("../../models/learning_progress/slideProgress");
const { callProcedure } = require("../../utils/procedure/callProcedure");
const { callProcedureChallenge } = require("../../utils/procedure/callProcedureChallenge");
const TopicContent = require("../../models/course_management/topic_content");
const AssignmentCompletion = require("../../models/learning_progress/assignmentCompletion");
const { re } = require("mathjs");
const sendMail = require('../../config/mailer');
const sequelize = require("../../config/db");
const Validation = require("../../validations");
const { Op } = require("sequelize");
const Assignment = require("../../models/content_management/assignmentsModel");

// -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------

exports.checkSlideCompletion = async (req, res, next) => {
  try {
    const { userId, topicId } = req.query;


    if (!userId || !topicId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Topic ID are required",
      });
    }

    Validation.isNumber(userId, "User ID must be a number");
    Validation.isNumber(topicId, "Topic ID must be a number");

    const { success, data, error } = await callProcedure(
      "checkSlideCompletion",
      [userId, topicId]
    );

    if (!success) {
      // Handle custom errors from the procedure
      if (error && error.message) {
        if (error.message.includes("E404")) {
          return res
            .status(404)
            .json({ success: false, message: error.message.split("|")[2] });
        } else if (error.message.includes("E400")) {
          return res
            .status(400)
            .json({ success: false, message: error.message.split("|")[2] });
        }
      }

      console.error("Error calling procedure:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error?.message || "Unknown error",
      });
    }

    // Parse the completed slides from the procedure result
    let completedSlides = [];

    if (data && Array.isArray(data) && data.length > 0) {
      // MySQL procedures typically return data in this format when using callProcedure
      if (data[0] && Array.isArray(data[0]) && data[0].length > 0) {
        // Format: data = [[{completedSlides: [...]}]]
        if (data[0][0] && data[0][0].completedSlides !== undefined) {
          completedSlides = data[0][0].completedSlides;
        }
      } else if (data[0] && data[0].completedSlides !== undefined) {
        // Format: data = [{completedSlides: [...]}]
        completedSlides = data[0].completedSlides;
      }
    }

    return res.json({
      success: true,
      completedSlides: Array.isArray(completedSlides) ? completedSlides : [],
    });
  } catch (error) {
    console.error("Unexpected error in checkSlideCompletion:", error);
    next(error);
  }
};

exports.completeContent = async (req, res, next) => {
  try {
    const { userId, topicId, slideId } = req.body;


    if (!userId || !topicId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID and Topic ID are required" });
    }

    Validation.isNumber(userId, "User ID must be a number");
    Validation.isNumber(topicId, "Topic ID must be a number");
    if (slideId !== -1) {
      Validation.isNumber(slideId, "Slide ID must be a number");
    }

    // Call the stored procedure
    const procedureResult = await callProcedure("completeContent", [
      userId,
      topicId,
      slideId || null,
    ]);

    if (!procedureResult.success && procedureResult.error)
      return next(procedureResult.error);

    if (!procedureResult.success) {
      console.error("Error calling procedure:", procedureResult.error);
      if (
        procedureResult.error.message &&
        procedureResult.error.message.includes("not found")
      ) {
        return res
          .status(404)
          .json({ success: false, message: procedureResult.error.message });
      }
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }

    // Check if data exists and has the expected structure
    if (
      !procedureResult.data ||
      !Array.isArray(procedureResult.data) ||
      !procedureResult.data[0]
    ) {
      console.error("Unexpected data structure:", procedureResult.data);
      return res.status(500).json({
        success: false,
        message: "Unexpected data structure returned from procedure",
      });
    }

    const result = procedureResult.data[0];

    // Create the response based on the stored procedure result
    let response = {
      success: true,
      message: "Content marked as completed",
      completed: result.completed,
      topicId: result.topic_id,
    };

    if (result.module_completed) {
      response.message = "Content and Module marked as completed";
      response.moduleCompleted = true;
      response.moduleId = result.module_id;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Error in completeContent controller:", error);
    next(error);
  }
};

exports.trackSlideCompletion = async (req, res, next) => {
  try {
    const { userId, topicId, slideId } = req.body;


    if (!userId || !topicId || !slideId) {
      return res.status(400).json({
        success: false,
        message: "User ID, Topic ID, and Slide ID are required",
      });
    }

    Validation.isNumber(userId, "User ID must be a number");
    Validation.isNumber(topicId, "Topic ID must be a number");
    Validation.isNumber(slideId, "Slide ID must be a number");

    // Call the stored procedure
    const procedureResult = await callProcedure("trackSlideCompletion", [
      userId,
      topicId,
      slideId,
    ]);

    if (!procedureResult.success && procedureResult.error)
      return next(procedureResult.error);

    if (!procedureResult.success) {
      console.error("Error calling procedure:", procedureResult.error);

      // Handle specific errors from the procedure
      if (procedureResult.error.message) {
        if (procedureResult.error.message.includes("Topic not found")) {
          return res
            .status(404)
            .json({ success: false, message: "Topic not found" });
        }
        if (procedureResult.error.message.includes("Enrollment not found")) {
          return res.status(404).json({
            success: false,
            message: "Enrollment not found for this user",
          });
        }
        if (procedureResult.error.message.includes("Invalid content type")) {
          return res.status(400).json({
            success: false,
            message: "Invalid content type for slide tracking",
          });
        }
        if (procedureResult.error.message.includes("Slide not found")) {
          return res.status(404).json({
            success: false,
            message: "Slide not found for this topic",
          });
        }
      }

      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }

    // Extract the results from the procedure
    if (!procedureResult.data || !procedureResult.data[0]) {
      return res.status(500).json({
        success: false,
        message: "Unexpected data structure returned from procedure",
      });
    }

    const result = procedureResult.data[0];

    // Return the proper progress information based on stored procedure's output
    res.status(200).json({
      success: true,
      message: "Slide completion tracked successfully",
      data: {
        topicId: parseInt(topicId), // Ensure we have the topic ID in the response
        progress: {
          total: result.total,
          completed: result.completed,
          status: result.status,
          timeSpent: result.timeSpent,
        },
      },
    });
  } catch (error) {
    console.error("Error tracking slide completion:", error);
    next(error);
  }
};

exports.getCourseCompletionProgress = async (req, res, next) => {
  try {
    const { userId, courseId } = req.query;


    if (!userId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Course ID are required",
      });
    }

    Validation.isNumber(userId, "User ID must be a number");
    Validation.isNumber(courseId, "Course ID must be a number");

    // Call the stored procedure
    const procedureResult = await callProcedure("getCourseCompletionProgress", [
      userId,
      courseId,
    ]);

    if (!procedureResult.success && procedureResult.error)
      return next(procedureResult.error);

    if (!procedureResult.success) {
      console.error("Error calling procedure:", procedureResult.error);
      if (
        procedureResult.error.message &&
        procedureResult.error.message.includes("not found")
      ) {
        return res
          .status(404)
          .json({ success: false, message: procedureResult.error.message });
      }
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }

    // Extract data from the result
    const resultData = procedureResult.data && procedureResult.data[0];

    if (!resultData) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve completion data",
      });
    }

    // Return comprehensive progress information
    res.status(200).json({
      success: true,
      completionPercentage: Math.round(resultData.completionPercentage),
    });
  } catch (error) {
    console.error("Error in getCourseCompletionProgress:", error);
    next(error);
  }
};

/**
 * Update time spent on a topic or individual slide
 */
exports.updateTimeSpent = async (req, res, next) => {
  try {
    const { userId, topicId, moduleId, timeSpent, slideId } = req.body;


    // Basic validation (similar to original controller)
    if (!topicId || !moduleId || timeSpent === undefined) {
      return res.status(400).json({
        success: false,
        message: "Topic ID, Module ID, and Time Spent are required",
      });
    }

    // Call the stored procedure
    const procedureResult = await callProcedure("updateTimeSpent", [
      userId,
      topicId,
      moduleId,
      timeSpent,
      slideId || null, // Handle null slideId for non-slide content
    ]);

    // Handle errors from stored procedure
    if (!procedureResult.success) {
      console.error("Error calling procedure:", procedureResult.error);

      // Handle specific not found errors (similar to getModuleCompletionProgress)
      if (
        procedureResult.error?.message &&
        procedureResult.error.message.includes("not found")
      ) {
        return res
          .status(404)
          .json({ success: false, message: procedureResult.error.message });
      }

      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }

    // Extract result data from the procedure
    if (
      !procedureResult.data ||
      !Array.isArray(procedureResult.data) ||
      procedureResult.data.length === 0
    ) {
      return res.status(500).json({
        success: false,
        message: "Invalid response from procedure",
      });
    }

    const resultData = procedureResult.data[0];

    // Format response based on stored procedure results
    // The stored procedure returns different fields depending on content type
    const response = {
      success: resultData.success,
    };

    // Add the appropriate time field based on what's available
    if (resultData.time_spent !== undefined) {
      response.time_spent = resultData.time_spent;
    }

    if (resultData.slide_time_spent !== undefined) {
      response.slide_time_spent = resultData.slide_time_spent;
    }

    // If there's an error message from the procedure, include it
    if (resultData.message) {
      response.message = resultData.message;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error updating time spent:", error);
    next(error);
  }
};

exports.checkTopicCompletion = async (req, res, next) => {
  try {
    const { userId, topicId } = req.query;


    if (!userId || !topicId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID and Topic ID are required" });
    }

    Validation.isNumber(userId, "User ID must be a number");
    Validation.isNumber(topicId, "Topic ID must be a number");

    // Call the stored procedure
    const { success, data, error } = await callProcedure("checkTopicCompletion", [
      userId,
      topicId
    ]);


    if (!success) {
      // Handle custom errors from the procedure
      if (error && error.message) {
        if (error.message.includes("E404")) {
          return res
            .status(404)
            .json({ success: false, message: error.message.split("|")[2] });
        } else if (error.message.includes("E400")) {
          return res
            .status(400)
            .json({ success: false, message: error.message.split("|")[2] });
        }
      }

      console.error("Error calling procedure:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error?.message || "Unknown error",
      });
    }

    // Extract data from the procedure result
    if (!data || !Array.isArray(data) || !data[0]) {
      return res.status(500).json({
        success: false,
        message: "Unexpected data structure returned from procedure",
      });
    }

    const result = data[0];

    return res.status(200).json({
      success: true,
      topicCompleted: result.topicCompleted === 1, // Convert to boolean since it comes as 0/1
      attachmentsCompleted: result.attachmentsCompleted === 1 // Convert to boolean since it comes as 0/1
    });
  } catch (error) {
    // console.error("Error checking topic completion:", error);
    next(error);
  }
};

// Add these methods to the exports in the controller file:

exports.updateTopicTimeSpent = async (req, res, next) => {
  try {
    const { userId, topicId, timeSpent } = req.body;


    if (!userId || !topicId || timeSpent === undefined) {
      return res.status(400).json({
        success: false,
        message: "User ID, Topic ID, and Time Spent are required",
      });
    }

    Validation.isNumber(userId, "User ID must be a number");
    Validation.isNumber(topicId, "Topic ID must be a number");
    Validation.isNumber(timeSpent, "Time Spent must be a number");

    // Call the stored procedure
    const procedureResult = await callProcedure("updateTopicTimeSpent", [
      userId,
      topicId,
      timeSpent,
    ]);

    if (!procedureResult.success) {
      console.error("Error calling procedure:", procedureResult.error);

      if (
        procedureResult.error?.message &&
        procedureResult.error.message.includes("not found")
      ) {
        return res
          .status(404)
          .json({ success: false, message: procedureResult.error.message });
      }

      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }    // Extract result data
    let resultData;

    // Handle different possible formats of the stored procedure result
    if (procedureResult.data) {
      if (Array.isArray(procedureResult.data[0])) {
        resultData = procedureResult.data[0][0];
      } else if (procedureResult.data[0]) {
        resultData = procedureResult.data[0];
      }
    } if (!resultData || resultData.total_time_spent === undefined) {
      console.error("Missing or invalid result data from procedure:", procedureResult);
      return res.status(200).json({
        success: true,
        message: "Time updated, but could not retrieve updated total",
        totalTimeSpent: null
      });
    }

    return res.status(200).json({
      success: true,
      totalTimeSpent: resultData.total_time_spent,
      completionStatus: resultData.completion_status || 'in_progress'
    });
  } catch (error) {
    console.error("Error updating topic time spent:", error);
    next(error);
  }
};

exports.checkModuleCompletion = async (req, res, next) => {
  try {
    const { userId, moduleId } = req.query;


    if (!userId || !moduleId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Module ID are required",
      });
    }

    Validation.isNumber(userId, "User ID must be a number");
    Validation.isNumber(moduleId, "Module ID must be a number");

    // Call the stored procedure
    const { success, data, error } = await callProcedure(
      "checkModuleCompletion",
      [userId, moduleId]
    );


    if (!success) {
      // Handle custom errors from the procedure
      if (error && error.message) {
        if (error.message.includes("E404")) {
          return res
            .status(404)
            .json({ success: false, message: error.message.split("|")[2] });
        }
      }

      console.error("Error calling procedure:", error);

      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error?.message || "Unknown error",
      });
    }

    // Extract data from the procedure result
    if (!data || !Array.isArray(data) || !data[0]) {
      return res.status(500).json({
        success: false,
        message: "Unexpected data structure returned from procedure",
      });
    }

    // So we need to access data[0] directly
    const result = data[0];

    return res.status(200).json({
      success: true,
      completed: result.completed === 1 // Convert to boolean since it comes as 0/1
    });
  } catch (error) {
    // console.error("Error checking module completion:", error);
    next(error);
  }
};

exports.getAccessibleModules = async (req, res, next) => {
  try {
    const { userId, courseId } = req.query;


    if (!userId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Course ID are required",
      });
    }

    Validation.isNumber(userId, "User ID must be a number");
    Validation.isNumber(courseId, "Course ID must be a number");

    // Call the stored procedure
    const { success, data, error } = await callProcedure(
      "getAccessibleModules",
      [userId, courseId]
    );

    if (!success) {
      // Handle custom errors from the procedure
      if (error && error.message) {
        if (error.message.includes("E404")) {
          return res
            .status(404)
            .json({ success: false, message: error.message.split("|")[2] });
        }
      }

      console.error("Error calling procedure:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error?.message || "Unknown error",
      });
    }

    // Extract data from the procedure result
    if (!data || !Array.isArray(data) || !data[0]) {
      return res.status(500).json({
        success: false,
        message: "Unexpected data structure returned from procedure",
      });
    }

    return res.json(data[0]);
  } catch (error) {
    console.error("Error fetching accessible modules:", error);
    next(error);
  }
};


exports.getBasicAccessibleTopics = async (req, res, next) => {
  try {
    const { userId, moduleId } = req.params;

    Validation.isNumber(userId, "User ID must be a number");
    Validation.isNumber(moduleId, "Module ID must be a number");

    const result = await callProcedure('getBasicAccessibleTopics', [
      userId, moduleId
    ])
    const { success, data, error } = result
    res.json(data);
  } catch (error) {
    console.error("Error in getBasicAccessibleTopics:", error);
    next(error);
  }
};

exports.getDetailedTopicInfo = async (req, res, next) => {
  try {
    const { userId, topicId } = req.params;


    Validation.isNumber(userId, "User ID must be a number");
    Validation.isNumber(topicId, "Topic ID must be a number");

    const result = await callProcedure('getDetailedTopicInfo', [
      userId, topicId
    ])

    const { success, data, error } = result

    res.json(data[0]); // Return the first row since we're getting a single topic
  } catch (error) {
    console.error("Error in getDetailedTopicInfo:", error);
    next(error);
  }
};

exports.getTopicSlides = async (req, res, next) => {
  try {
    const { topicId } = req.params;

    Validation.isNumber(topicId, "Topic ID must be a number");

    const result = await callProcedure('getTopicSlides', [topicId]);
    const { success, data, error } = result;
    if (!success) {
      return res.status(500).json({ success: false, message: error?.message || 'Failed to fetch slides' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error in getTopicSlides:', error);
    next(error);
  }
};

exports.getSlideContent = async (req, res, next) => {
  try {
    const { slideId } = req.params;

    Validation.isNumber(slideId, "Slide ID must be a number");

    const result = await callProcedure('getSlideContent', [slideId]);
    const { success, data, error } = result;
    if (!success) {
      return res.status(500).json({ success: false, message: error?.message || 'Failed to fetch slide content' });
    }
    res.json(data[0]);
  } catch (error) {
    console.error('Error in getSlideContent:', error);
    next(error);
  }
};

exports.getStudentTopicDetails = async (req, res, next) => {
  try {
    const { moduleId, topicIds } = req.body;

    const progressTrackings = await ProgressTracking.findAll({
      where: {
        module_id: moduleId,
        topic_id: { [Op.in]: topicIds },
      },
      raw: true,
    });

    return res.status(200).json({
      success: true,
      data: progressTrackings
    });

  } catch (error) {
    next(error);
  }
};

exports.getQuizzesIdByModuleId = async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    const quizzes = await Quizzes.findAll({
      where: {
        module_id: moduleId,
      },
      attributes: [
        'id',
        'title'
      ],
      raw: true,
    });

    return res.status(200).json({
      success: true,
      data: quizzes,
    });
  } catch (err) {
    console.error('Error in getQuizzesIdByModuleId:', err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getAssignmentIdByModuleId = async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    const assignment = await Assignment.findAll({
      where: {
        module_id: moduleId,
      },
      attributes: [
        'id',
        'title'
      ],
      raw: true,
    });

    return res.status(200).json({
      success: true,
      data: assignment,
    });
  } catch (err) {
    console.error('Error in getQuizzesIdByModuleId:', err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};
