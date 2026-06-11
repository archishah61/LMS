const { Op, fn, col, literal } = require('sequelize');
const { InterviewEvaluation, InterviewEvaluationResult, QuestionEvaluation } = require('../../models/aiInterview/InterviewEvaluation');
const User = require('../../models/auth/user');
const sequelize = require('../../config/db');
const moment = require('moment');

const { callProcedure } = require("../../utils/procedure/callProcedure");

exports.getOverallPerformanceMetrics = async (req, res) => {
  try {
    const threshold = parseFloat(req.query.threshold) || 60;

    // Call stored procedure that calculates the overall performance metrics
    const { success, data, error } = await callProcedure("getOverallPerformanceMetrics", [threshold]);

    if (!success) {
      return res.status(500).json({ success: false, error });
    }

    const results = Array.isArray(data) ? data : [];

    // Assuming the stored procedure returns data in the correct structure
    const formatted = results.map(row => ({
      totalInterviews: row.totalInterviews,
      averageScore: isNaN(parseFloat(row.averageScore))
        ? "0.00"
        : parseFloat(row.averageScore).toFixed(2),
      scoreHistogram: row.scoreHistogram,
      passCount: row.passCount,
      failCount: row.failCount,
      passRate: row.passRate
    }));


    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error("Error fetching overall performance metrics:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


exports.getCategoryRoleAnalytics = async (req, res) => {
  try {
    // Average scores by category
    const avgByCategory = await InterviewEvaluation.findAll({
      attributes: [
        'category',
        [fn('AVG', literal('(SELECT overallScore FROM tbl_interview_evaluation_results WHERE tbl_interview_evaluation_results.user_id = InterviewEvaluation.user_id LIMIT 1)')), 'avgScore'],
        [fn('COUNT', '*'), 'count']
      ],
      group: ['category'],
      raw: true
    });
    // Average scores by role
    const avgByRole = await InterviewEvaluation.findAll({
      attributes: [
        'role',
        [fn('AVG', literal('(SELECT overallScore FROM tbl_interview_evaluation_results WHERE tbl_interview_evaluation_results.user_id = InterviewEvaluation.user_id LIMIT 1)')), 'avgScore'],
        [fn('COUNT', '*'), 'count']
      ],
      group: ['role'],
      raw: true
    });
    // Most common categories/roles
    const commonCategories = await InterviewEvaluation.findAll({
      attributes: ['category', [fn('COUNT', '*'), 'count']],
      group: ['category'],
      order: [[literal('count'), 'DESC']],
      limit: 5,
      raw: true
    });
    const commonRoles = await InterviewEvaluation.findAll({
      attributes: ['role', [fn('COUNT', '*'), 'count']],
      group: ['role'],
      order: [[literal('count'), 'DESC']],
      limit: 5,
      raw: true
    });
    res.json({ avgByCategory, avgByRole, commonCategories, commonRoles });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category/role analytics', details: error.message });
  }
};


exports.getQuestionLevelInsights = async (req, res) => {
  try {
    // Group by question text, get avg score and count
    const questionStats = await QuestionEvaluation.findAll({
      attributes: [
        'question',
        [fn('AVG', col('score')), 'avgScore'],
        [fn('COUNT', '*'), 'count']
      ],
      group: ['question'],
      order: [[fn('AVG', col('score')), 'ASC']],
      raw: true
    });

    // Format avgScore to 2 decimal places
    const formatStats = (stats) => {
      return stats.map(stat => ({
        ...stat,
        avgScore: parseFloat(parseFloat(stat.avgScore).toFixed(2))
      }));
    };

    // Most challenging (lowest avg score)
    const mostChallenging = formatStats(questionStats.slice(0, 5));

    // Best performing (highest avg score)
    const bestPerforming = formatStats([...questionStats].sort((a, b) => b.avgScore - a.avgScore).slice(0, 5));

    res.json({ mostChallenging, bestPerforming });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch question-level insights', details: error.message });
  }
};

exports.getTimeBasedAnalytics = async (req, res) => {
  try {
    const { period } = req.query;
    let whereClause = {};
    let groupAttr, groupFormat;
    const now = moment();

    if (!period) {
      return res.status(400).json({ error: "Query param 'period' is required" });
    }

    let isToday = false;

    if (period.toLowerCase() === 'today') {
      isToday = true;
      whereClause = {
        created_at: {
          [Op.gte]: now.clone().startOf('day').toDate(),
          [Op.lt]: now.clone().endOf('day').toDate(),
        },
      };
      groupAttr = fn('HOUR', col('created_at'));
      groupFormat = 'hour';
    } else if (period.toLowerCase() === 'week') {
      whereClause = {
        created_at: {
          [Op.gte]: now.clone().startOf('isoWeek').toDate(),
          [Op.lt]: now.clone().endOf('isoWeek').toDate(),
        },
      };
      groupAttr = fn('DATE', col('created_at'));
      groupFormat = 'date';
    } else if (/^month=([a-z]{3})$/i.test(period)) {
      const monthAbbr = period.split('=')[1].toLowerCase();
      const monthNum = moment().month(monthAbbr).month();
      if (isNaN(monthNum)) {
        return res.status(400).json({ error: "Invalid month abbreviation" });
      }
      const start = now.clone().month(monthNum).startOf('month');
      const end = start.clone().endOf('month');
      whereClause = {
        created_at: {
          [Op.gte]: start.toDate(),
          [Op.lt]: end.toDate(),
        },
      };
      groupAttr = fn('DATE', col('created_at'));
      groupFormat = 'date';
    } else if (/^year=\d{4}$/i.test(period)) {
      const year = parseInt(period.split('=')[1], 10);
      const start = moment(`${year}-01-01`).startOf('year');
      const end = start.clone().endOf('year');
      whereClause = {
        created_at: {
          [Op.gte]: start.toDate(),
          [Op.lt]: end.toDate(),
        },
      };
      groupAttr = fn('DATE_FORMAT', col('created_at'), '%Y-%m');
      groupFormat = 'month';
    } else if (period.toLowerCase() === 'overall') {
      // YEAR(created_at) → 2023, 2024, …
      groupAttr = fn('YEAR', col('created_at'));   // yearly breakdown
      groupFormat = 'year';
    } else {
      return res.status(400).json({ error: "Invalid 'period' query format" });
    }

    const data = await InterviewEvaluation.findAll({
      attributes: [
        [groupAttr, groupFormat],
        [fn('COUNT', '*'), 'count']
      ],
      where: whereClause,
      group: [groupAttr],
      order: [[literal(groupFormat), 'ASC']],
      raw: true
    });

    // 👇 Enhance 'today' response with zero-filled hour slots
    if (isToday) {
      const hourDataMap = {};
      data.forEach(item => {
        hourDataMap[item.hour] = Number(item.count);
      });

      const fullDay = Array.from({ length: 24 }, (_, h) => {
        const label = `${h}-${h + 1}`;
        return {
          slot: label,
          count: hourDataMap[h] || 0
        };
      });

      return res.json({ period, data: fullDay });
    }

    // Default for other periods
    res.json({ period, data });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch time-based analytics',
      details: error.message,
    });
  }
};


exports.getResponseQualityMetrics = async (req, res) => {
  try {
    // Average length of user answers
    const answers = await QuestionEvaluation.findAll({ attributes: ['userAnswer', 'originalAnswer', 'score'] });
    const avgUserLen = answers.reduce((sum, q) => sum + (q.userAnswer ? q.userAnswer.length : 0), 0) / (answers.length || 1);
    const avgOrigLen = answers.reduce((sum, q) => sum + (q.originalAnswer ? q.originalAnswer.length : 0), 0) / (answers.length || 1);
    // Patterns for high/low scores
    const highScoring = answers.filter(q => q.score >= 80).map(q => q.userAnswer);
    const lowScoring = answers.filter(q => q.score < 50).map(q => q.userAnswer);
    // Most common patterns (simple: most frequent words)
    const wordFreq = arr => {
      const freq = {};
      arr.forEach(ans => ans && ans.split(/\s+/).forEach(w => { freq[w] = (freq[w] || 0) + 1; }));
      return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10);
    };
    res.json({
      avgUserAnswerLength: avgUserLen.toFixed(2),
      avgOriginalAnswerLength: avgOrigLen.toFixed(2),
      highScorePatterns: wordFreq(highScoring),
      lowScorePatterns: wordFreq(lowScoring)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch response quality metrics', details: error.message });
  }
};


exports.getAdminDashboardVisualizations = async (req, res) => {
  try {
    // Filters
    const { role, category, startDate, endDate } = req.query;
    const whereEval = {};
    if (role) whereEval.role = role;
    if (category) whereEval.category = category;
    if (startDate || endDate) whereEval.created_at = {};
    if (startDate) whereEval.created_at[Op.gte] = new Date(startDate);
    if (endDate) whereEval.created_at[Op.lte] = new Date(endDate);
    // Score heatmap: avg score by question/category
    const heatmap = await QuestionEvaluation.findAll({
      include: [{
        model: InterviewEvaluationResult,
        as: 'interviewEvaluationResult',
        include: [{
          model: InterviewEvaluation,
          as: 'interviewEvaluation', // Ensure this matches the association name
          attributes: [], // No need to specify attributes here as we're using them in the main query
        }],
        where: whereEval,
        attributes: [], // No need to specify attributes here as we're using them in the main query
      }],
      attributes: [
        'question',
        [sequelize.fn('AVG', sequelize.col('score')), 'avgScore'],
        [sequelize.col('interviewEvaluationResult.interviewEvaluation.category'), 'category']
      ],
      group: ['question', 'interviewEvaluationResult.interviewEvaluation.category'],
      raw: true
    });
    // Performance trend: avg score per week
    const trend = await InterviewEvaluationResult.findAll({
      include: [{
        model: InterviewEvaluation,
        as: 'interviewEvaluation',
        where: whereEval,
        attributes: [] // No need to specify attributes here as we're using them in the main query
      }],
      attributes: [
        [sequelize.fn('YEARWEEK', sequelize.col('InterviewEvaluationResult.created_at')), 'yearweek'],
        [sequelize.fn('AVG', sequelize.col('overallScore')), 'avgScore']
      ],
      group: [sequelize.fn('YEARWEEK', sequelize.col('InterviewEvaluationResult.created_at'))],
      order: [[sequelize.col('yearweek'), 'ASC']],
      raw: true
    });
    // Top/bottom performers
    // Top performers with full_name included
    const performers = await InterviewEvaluationResult.findAll({
      attributes: ['user_id', [fn('AVG', col('overallScore')), 'avgScore']],
      group: ['user_id', 'user.id'],  // include user.id for grouping with join
      include: [{
        model: User,
        as: 'user',
        attributes: ['full_name']
      }],
      order: [[fn('AVG', col('overallScore')), 'DESC']],
      limit: 10,
      raw: true,
      nest: true
    });
    const bottomPerformers = [...performers].sort((a, b) => a.avgScore - b.avgScore).slice(0, 10);
    res.json({ heatmap, trend, topPerformers: performers, bottomPerformers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin dashboard visualizations', details: error.message });
  }
};

exports.getAllUserPerformanceSummary = async (req, res) => {
  try {
    // Step 1: Get aggregated performance stats for each user
    const users = await InterviewEvaluationResult.findAll({
      attributes: [
        'user_id',
        [fn('AVG', col('overallScore')), 'averageScore'],
        [fn('MAX', col('overallScore')), 'bestScore'],
        [fn('MIN', col('overallScore')), 'worstScore'],
        [fn('COUNT', '*'), 'interviewCount']
      ],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'full_name', 'email']
      }],
      group: ['user_id', 'user.id'],
      raw: true,
      nest: true
    });

    // Step 2: For each user, fetch best and worst scoring interviews
    const enrichedUsers = await Promise.all(users.map(async (u) => {
      const bestResult = await InterviewEvaluationResult.findOne({
        where: { user_id: u.user_id, overallScore: u.bestScore },
        include: [{
          model: InterviewEvaluation,
          as: 'interviewEvaluation',
          attributes: ['category', 'role']
        }],
        order: [['created_at', 'ASC']]
      });

      const worstResult = await InterviewEvaluationResult.findOne({
        where: { user_id: u.user_id, overallScore: u.worstScore },
        include: [{
          model: InterviewEvaluation,
          as: 'interviewEvaluation',
          attributes: ['category', 'role']
        }],
        order: [['created_at', 'ASC']]
      });

      return {
        ...u,
        bestScoreCategory: bestResult?.interviewEvaluation?.category || null,
        bestScoreRole: bestResult?.interviewEvaluation?.role || null,
        worstScoreCategory: worstResult?.interviewEvaluation?.category || null,
        worstScoreRole: worstResult?.interviewEvaluation?.role || null
      };
    }));

    res.json({ users: enrichedUsers });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch user performance summary',
      details: error.message
    });
  }
};

exports.getTopBottomUsersByCategory = async (req, res) => {
  try {
    const [categories] = await sequelize.query(`
      SELECT DISTINCT category FROM tbl_interview_evaluations
    `);

    const results = await Promise.all(categories.map(async (cat) => {
      const [top] = await sequelize.query(`
        SELECT u.id as user_id, u.full_name, AVG(r.overallScore) as avgScore
        FROM tbl_interview_evaluation_results r
        JOIN tbl_interview_evaluations e ON e.id = r.interviewEvaluationId
        JOIN tbl_users u ON u.id = r.user_id
        WHERE e.category = :category
        GROUP BY r.user_id
        ORDER BY avgScore DESC
        LIMIT 1
      `, { replacements: { category: cat.category } });

      const [bottom] = await sequelize.query(`
        SELECT u.id as user_id, u.full_name, AVG(r.overallScore) as avgScore
        FROM tbl_interview_evaluation_results r
        JOIN tbl_interview_evaluations e ON e.id = r.interviewEvaluationId
        JOIN tbl_users u ON u.id = r.user_id
        WHERE e.category = :category
        GROUP BY r.user_id
        ORDER BY avgScore ASC
        LIMIT 1
      `, { replacements: { category: cat.category } });

      return {
        category: cat.category,
        topPerformer: top[0] || null,
        bottomPerformer: bottom[0] || null
      };
    }));

    res.json({ categoryWiseTopBottom: results });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch top/bottom performers by category', details: error.message });
  }
};

exports.getOverallTopBottomPerformers = async (req, res) => {
  try {
    const allPerformers = await InterviewEvaluationResult.findAll({
      attributes: [
        'user_id',
        [fn('AVG', col('overallScore')), 'avgScore']
      ],
      group: ['user_id', 'user.id'],
      include: [{
        model: User,
        as: 'user', // <-- IMPORTANT: Must match model association alias
        attributes: ['id', 'full_name', 'email']
      }],
      raw: true,
      nest: true
    });

    const sorted = allPerformers.sort((a, b) => b.avgScore - a.avgScore);
    const topPerformers = sorted.slice(0, 5);
    const bottomPerformers = sorted.slice(-5).reverse();

    res.json({ topPerformers, bottomPerformers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch overall performers', details: error.message });
  }
};