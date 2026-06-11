const express = require("express");
const router = express.Router();
const { getRevenueByCourseCategory, getCustomerLifetimeValue, getRevenueByPeriod, getTodaysRevenue, getThisWeeksRevenue, getMonthlyRevenue, getYearlyRevenue, getOverallRevenue } = require("../../controllers/reporting/RevenueAndFinancialAnalyticsController"); // Adjust path as needed
const protect = require("../../middleware/protectMiddleware");

router.use(protect);

router.get("/revenue-by-category", getRevenueByCourseCategory);

router.get("/customer-lifetime-value", getCustomerLifetimeValue);



router.get("/todays-revenue", getTodaysRevenue);
router.get("/this-weeks-revenue", getThisWeeksRevenue);
router.get("/monthly-revenue", getMonthlyRevenue);
router.get("/yearly-revenue", getYearlyRevenue);
router.get("/overall-revenue", getOverallRevenue);

module.exports = router;
