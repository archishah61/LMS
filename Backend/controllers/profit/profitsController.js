const { payments, enrollments } = require("../../models/enrollment_management/enrollment_management");
const Course = require("../../models/course_management/course");
const { Op, Sequelize } = require("sequelize");

// Function to calculate Net Profit
async function calculateNetProfit(month) {
  const dateRange = getMonthDateRange(month);
  const netProfit = await payments.sum("amount", {
    where: {
      transaction_date: { [Op.between]: [dateRange.start, dateRange.end] },
    },
  });
  return netProfit || 0;
}

// Function to calculate Monthly Recurring Revenue (MRR)
async function calculateMRR(month) {
  const dateRange = getMonthDateRange(month);
  const mrr = await payments.sum("amount", {
    where: {
      transaction_date: { [Op.between]: [dateRange.start, dateRange.end] },
    },
  });
  return mrr || 0;
}

// Function to calculate Total Revenue
async function calculateTotalRevenue(month) {
  const netProfit = await calculateNetProfit(month);
  const mrr = await calculateMRR(month);
  return netProfit + mrr;
}

// Function to calculate Average Revenue per Course
async function calculateAvgRevenue(month) {
  const totalRevenue = await calculateTotalRevenue(month);
  const courseCount = await Course.count();
  return courseCount > 0 ? totalRevenue / courseCount : 0;
}

// Function to calculate monthly enrollments
async function calculateMonthlyEnrollments(month) {
  const dateRange = getMonthDateRange(month);
  const enrollmentsCount = await enrollments.count({
    where: {
      created_at: { [Op.between]: [dateRange.start, dateRange.end] },
    },
  });
  return { month: dateRange.monthName, enrollments: enrollmentsCount };
}

// Function to calculate all financial metrics
async function calculateMetrics(month) {
  const [totalRevenue, netProfit, avgRevenue, mrr] = await Promise.all([
    calculateTotalRevenue(month),
    calculateNetProfit(month),
    calculateAvgRevenue(month),
    calculateMRR(month),
  ]);
  return { totalRevenue, netProfit, avgRevenue, mrr };
}

// Function to get metrics for a selected month
exports.getMetrics = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    if (month < 1 || month > 12) {
      return res.status(400).json({ error: "Invalid month. Please select a value between 1 and 12." });
    }

    const [currentMetrics, enrollmentData] = await Promise.all([
      calculateMetrics(month),
      calculateMonthlyEnrollments(month),
    ]);

    const metrics = { ...currentMetrics, enrollmentData };
    res.status(200).json(metrics);
  } catch (error) {
    next(error);
  }
};

// Utility function to get the start and end date of a selected month
function getMonthDateRange(month) {
  const year = new Date().getFullYear();
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return { start: startOfMonth, end: endOfMonth, monthName: monthNames[month - 1] };
}
