const dotenv = require("dotenv");
dotenv.config();
const User = require("../../models/auth/user");
const { InterviewEvaluation, InterviewEvaluationResult, QuestionEvaluation } = require("../../models/aiInterview/InterviewEvaluation");
const { Op } = require("sequelize");

const { callProcedure } = require("../../utils/procedure/callProcedure");

exports.createCompleteInterviewEvaluation = async (req, res, next) => {
  const user_id = req.user?.id;
  const {
    overallScore,
    overallAssessment,
    fullResponse,
    questionEvaluations,
    role,
    category,
  } = req.body;

  if (
    !user_id ||
    overallScore === undefined || // Check if undefined instead of falsy
    !overallAssessment ||
    !questionEvaluations ||
    questionEvaluations.length === 0
  ) {
    return res.status(400).json({ error: 'Missing required fields in request.' });
  }

  try {

    // Capitalize the first letter of category and role
    const capitalizeFirstLetter = (string) => {
      if (!string) return string;
      return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const capitalizedRole = capitalizeFirstLetter(role);
    const capitalizedCategory = capitalizeFirstLetter(category);

    const { success, data, error } = await callProcedure(
      "createCompleteInterviewEvaluation",
      [
        user_id,
        capitalizedRole,
        capitalizedCategory,
        overallScore,
        overallAssessment,
        fullResponse,
        JSON.stringify(questionEvaluations)
      ]
    );

    if (!success) {
      return next(error);
    }

    const evaluation_result_id = data[0]?.evaluation_result_id;

    res.status(201).json({ 
      message: "Interview evaluation created successfully",
      evaluation_result_id
    });
  } catch (error) {
    next(error);
  }
};

// Log Interview Download
exports.logInterviewDownload = async (req, res, next) => {
  try {
    const { evaluation_result_id, download_date } = req.body;

    if (!evaluation_result_id || !download_date) {
      return res.status(400).json({ error: 'Missing required fields: evaluation_result_id, download_date.' });
    }

    const { success, error } = await callProcedure("logInterviewDownload", [evaluation_result_id, download_date]);

    if (!success) {
      return next(error);
    }

    res.status(200).json({ message: "Download logged successfully" });
  } catch (error) {
    next(error);
  }
};

// Get Complete Evaluations by User ID
exports.getCompleteEvaluationsByUserId = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated.' });
    }

    const { success, data, error } = await callProcedure("getCompleteEvaluationsByUserId", [userId]);

    if (!success) {
      return next(error);
    }

    // Process data to match the expected output format
    const interviewEvaluationsMap = new Map();
    const evaluationResultsMap = new Map();

    data.forEach(row => {
      // Process Interview Evaluations
      if (!interviewEvaluationsMap.has(row.id)) {
        interviewEvaluationsMap.set(row.id, {
          id: row.id,
          user_id: row.user_id,
          role: row.role,
          category: row.category,
          created_at: row.created_at,
          user: { id: row.user_id, full_name: row.full_name }
        });
      }

      // Process Evaluation Results
      if (row.evaluation_result_id) {
        if (!evaluationResultsMap.has(row.evaluation_result_id)) {
          // Robust parsing for downloaded_dates
          let downloadedDates = [];
          if (row.downloaded_dates) {
            try {
              downloadedDates = typeof row.downloaded_dates === 'string' 
                ? JSON.parse(row.downloaded_dates) 
                : row.downloaded_dates;
            } catch (e) {
              console.error("Error parsing downloaded_dates:", e);
              downloadedDates = [];
            }
          }

          evaluationResultsMap.set(row.evaluation_result_id, {
            id: row.evaluation_result_id,
            interviewEvaluationId: row.id,
            user_id: row.user_id,
            overallScore: row.overallScore,
            overallAssessment: row.overallAssessment,
            fullResponse: row.fullResponse,
            downloaded_dates: Array.isArray(downloadedDates) ? downloadedDates : [],
            questionEvaluations: [],
            user: { id: row.user_id, full_name: row.full_name }
          });
        }

        // Process Question Evaluations
        if (row.question_evaluation_id) {
          const evaluationResult = evaluationResultsMap.get(row.evaluation_result_id);
          if (evaluationResult && !evaluationResult.questionEvaluations.some(qe => qe.id === row.question_evaluation_id)) {
            evaluationResult.questionEvaluations.push({
              id: row.question_evaluation_id,
              question: row.question,
              originalAnswer: row.originalAnswer,
              userAnswer: row.userAnswer,
              score: row.score,
              suggestedFeedback: row.suggestedFeedback
            });
          }
        }
      }
    });

    // Convert maps to arrays
    const interviewEvaluations = Array.from(interviewEvaluationsMap.values()).sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );
    const evaluationResults = Array.from(evaluationResultsMap.values()).map((result) => {
      result.questionEvaluations.sort((a, b) => a.id - b.id);
      return result;
    }).sort((a, b) => a.id - b.id);

    res.status(200).json({
      interviewEvaluations,
      interviewEvaluationResults: evaluationResults,
    });
  } catch (error) {
    next(error);
  }
};

// Get Complete Evaluations by User, Category, and Role
exports.getCompleteEvaluationsByUserCategoryAndRole = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { category, role } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated.' });
    }

    if (!category || !role) {
      return res.status(400).json({ error: 'Missing required query parameters: category, role.' });
    }

    const { success, data, error } = await callProcedure("getCompleteEvaluationsByUserCategoryAndRole", [userId, category, role]);

    if (!success) {
      return next(error);
    }

    // Process data to match the expected output format
    const interviewEvaluationsMap = new Map();
    const evaluationResultsMap = new Map();

    data.forEach(row => {
      if (!interviewEvaluationsMap.has(row.id)) {
        interviewEvaluationsMap.set(row.id, {
          id: row.id,
          user_id: row.user_id,
          role: row.role,
          category: row.category,
          created_at: row.created_at,
          user: { id: row.user_id, full_name: row.full_name }
        });
      }

      if (row.evaluation_result_id) {
        if (!evaluationResultsMap.has(row.evaluation_result_id)) {
          let downloadedDates = [];
          if (row.downloaded_dates) {
            try {
              downloadedDates = typeof row.downloaded_dates === 'string' 
                ? JSON.parse(row.downloaded_dates) 
                : row.downloaded_dates;
            } catch (e) {
              downloadedDates = [];
            }
          }

          evaluationResultsMap.set(row.evaluation_result_id, {
            id: row.evaluation_result_id,
            interviewEvaluationId: row.id,
            user_id: row.user_id,
            overallScore: row.overallScore,
            overallAssessment: row.overallAssessment,
            fullResponse: row.fullResponse,
            downloaded_dates: Array.isArray(downloadedDates) ? downloadedDates : [],
            questionEvaluations: []
          });
        }

        if (row.question_evaluation_id) {
          const evaluationResult = evaluationResultsMap.get(row.evaluation_result_id);
          if (evaluationResult) {
            evaluationResult.questionEvaluations.push({
              id: row.question_evaluation_id,
              question: row.question,
              originalAnswer: row.originalAnswer,
              userAnswer: row.userAnswer,
              score: row.score,
              suggestedFeedback: row.suggestedFeedback
            });
          }
        }
      }
    });

    res.status(200).json({
      interviewEvaluations: Array.from(interviewEvaluationsMap.values()),
      interviewEvaluationResults: Array.from(evaluationResultsMap.values()),
    });
  } catch (error) {
    next(error);
  }
};

// Get today's interview attempts for the current user
exports.getAttemptsToday = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated.' });
    }
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const attempts = await InterviewEvaluation.findAll({
      where: {
        user_id: userId,
        created_at: { [Op.gte]: startOfDay }
      },
      order: [['created_at', 'ASC']]
    });
    res.json({
      count: attempts.length,
      firstAttempt: attempts[0]?.created_at || null
    });
  } catch (error) {
    next(error);
  }
};
