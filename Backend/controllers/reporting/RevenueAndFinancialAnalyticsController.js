const { callProcedure } = require("../../utils/procedure/callProcedure");

exports.getRevenueByCourseCategory = async (req, res) => {
  try {

    const role = req.user.role
    const userId = req.user.id

    let result;

    const { user_type, partner_id } = req.query;


    if (role == "partner") {
      result = await callProcedure("getRevenueByCourseCategoryForPartner", [
        userId
      ]);
    } else {
      if (user_type == "all") {
        result = await callProcedure("getRevenueByCourseCategory");
      } else if (user_type == "admin") {
        result = await callProcedure("getRevenueByCourseCategoryByAdmin");
      } else if (user_type == "partner" && partner_id == "all") {
        result = await callProcedure("getRevenueByCourseCategoryByPartners");
      } else if (user_type == "partner" && partner_id != "all") {
        result = await callProcedure("getRevenueByCourseCategoryForPartner", [
          partner_id
        ]);
      } else {
        result = await callProcedure("getRevenueByCourseCategory");
      }
    }
    // Call stored procedure that calculates revenue by course category
    const { success, data, error } = result;

    if (!success) {
      return res.status(500).json({ success: false, error });
    }

    const results = Array.isArray(data) ? data : [];

    const formatted = results.map(row => ({
      category_id: row.category_id,
      category_name: row.category_name,
      total_enrollments: parseInt(row.total_enrollments, 10),
      total_revenue: parseFloat(row.total_revenue)
    }));

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error("Error fetching revenue by category:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get customer lifetime value
exports.getCustomerLifetimeValue = async (req, res, next) => {
  try {

    const role = req.user.role
    const userId = req.user.id

    let result;

    const { user_type, partner_id } = req.query;

    if (role == "partner") {
      result = await callProcedure("getCustomerLifetimeValueForPartner", [
        userId
      ]);
    } else {
      if (user_type == "all") {
        result = await callProcedure("getCustomerLifetimeValue");
      } else if (user_type == "admin") {
        result = await callProcedure("getCustomerLifetimeValueByAdmin");
        
      } else if (user_type == "partner" && partner_id == "all") {
        result = await callProcedure("getCustomerLifetimeValueByPartners");
        
      } else if (user_type == "partner" && partner_id != "all") {
        result = await callProcedure("getCustomerLifetimeValueForPartner", [
          partner_id
        ]);
      } else {
        result = await callProcedure("getCustomerLifetimeValue");
      }
    }

    const { success, data, error } = result;

    if (!success) {
      return next(error);
    }

    const formatted = (Array.isArray(data) ? data : []).map(row => ({
      user_id: row.user_id,
      full_name: row.full_name,
      email: row.email,
      total_revenue: parseFloat(row.total_revenue)
    }));

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error("Error fetching customer lifetime value:", error);
    return next(error)
  }
};

// today 
exports.getTodaysRevenue = async (req, res) => {
  try {

    const role = req.user.role
    const userId = req.user.id

    const { user_type, partner_id } = req.query;

    let result;

    if (role == "partner") {
      result = await callProcedure("getTodaysRevenueForPartner", [
        userId
      ]);
    } else if (role == "admin") {
      if (user_type == "all") {
        result = await callProcedure("getTodaysRevenue");
      } else if (user_type == "admin") {
        result = await callProcedure("getTodaysRevenueByAdmin");
      } else if (user_type == "partner" && partner_id == "all") {
        result = await callProcedure("getTodaysRevenueByPartners");
      } else if (user_type == "partner" && partner_id != "all") {
        result = await callProcedure("getTodaysRevenueForPartner", [
          partner_id
        ]);
      } else {
        result = await callProcedure("getTodaysRevenue");
      }
    }
    // Call stored procedure that calculates revenue by course category
    const { success, data, error } = result;

    if (!success) {
      return res.status(500).json({ success: false, error });
    }

    const results = Array.isArray(data) ? data : [];

    const formatted = results.map(row => ({
      hour: row.hour,
      revenue: parseFloat(row.revenue)
    }));

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error("Error fetching today's revenue:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


// this week
exports.getThisWeeksRevenue = async (req, res) => {
  try {
    const role = req.user.role
    const userId = req.user.id

    const { user_type, partner_id } = req.query;

    let result;

    if (role == "partner") {
      result = await callProcedure("getThisWeeksRevenueForPartner", [
        userId
      ]);
    } else if (role == "admin") {
      if (user_type == "all") {
        result = await callProcedure("getThisWeeksRevenue");
      } else if (user_type == "admin") {
        result = await callProcedure("getThisWeeksRevenueByAdmin");
      } else if (user_type == "partner" && partner_id == "all") {
        result = await callProcedure("getThisWeeksRevenueByPartners");
      } else if (user_type == "partner" && partner_id != "all") {
        result = await callProcedure("getThisWeeksRevenueForPartner", [
          partner_id
        ]);
      } else {
        result = await callProcedure("getThisWeeksRevenue");
      }
    }
    // Call stored procedure that calculates revenue by course category
    const { success, data, error } = result;

    if (!success) {
      return res.status(500).json({ success: false, error });
    }

    const results = Array.isArray(data) ? data : [];

    const formatted = results.map(row => ({
      day: row.day,
      revenue: parseFloat(row.revenue)
    }));

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error("Error fetching this week's revenue:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


// selected month
exports.getMonthlyRevenue = async (req, res) => {
  const { month } = req.query;

  if (!month) {
    return res.status(400).json({ success: false, message: "Month is required" });
  }

  try {

    const role = req.user.role
    const userId = req.user.id

    const { user_type, partner_id } = req.query;


    let result;

    if (role == "partner") {
      result = await callProcedure("getMonthlyRevenueForPartner", [
        month,
        userId
      ]);
    } else if (role == "admin") {
      if (user_type == "all") {
        result = await callProcedure("getMonthlyRevenue", [month]);
      } else if (user_type == "admin") {
        result = await callProcedure("getMonthlyRevenueByAdmin", [month]);
      } else if (user_type == "partner" && partner_id == "all") {
        result = await callProcedure("getMonthlyRevenueByPartners", [month]);
      } else if (user_type == "partner" && partner_id != "all") {
        result = await callProcedure("getMonthlyRevenueForPartner", [
          month,
          partner_id
        ]);
      } else {
        result = await callProcedure("getThisWeeksRevenue", [month]);
      }
    }
    // Call stored procedure that calculates revenue by course category
    const { success, data, error } = result;

    if (!success) {
      return res.status(500).json({ success: false, error });
    }

    const results = Array.isArray(data) ? data : [];

    const formatted = results.map(row => ({
      date: row.date,
      revenue: parseFloat(row.revenue)
    }));

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error("Error fetching monthly revenue:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


// selected year
exports.getYearlyRevenue = async (req, res) => {
  const { year } = req.query;

  if (!year) {
    return res.status(400).json({ success: false, message: "Year is required" });
  }

  try {

    const role = req.user.role
    const userId = req.user.id

    const { user_type, partner_id } = req.query;

    let result;

    if (role == "partner") {
      result = await callProcedure("getYearlyRevenueForPartner", [
        year,
        userId
      ]);
    } else {
      if (user_type == "all") {
        result = await callProcedure("getYearlyRevenue", [year]);
      } else if (user_type == "admin") {
        result = await callProcedure("getYearlyRevenueForAdmin", [year]);
      } else if (user_type == "partner" && partner_id == "all") {
        result = await callProcedure("getYearlyRevenueByPartners", [year]);
      } else if (user_type == "partner" && partner_id != "all") {
        result = await callProcedure("getYearlyRevenueForPartner", [
          year,
          partner_id
        ]);
      } else {
        result = await callProcedure("getThisWeeksRevenue", [year]);
      }
    }
    // Call stored procedure that calculates revenue by course category
    const { success, data, error } = result;

    if (!success) {
      return res.status(500).json({ success: false, error });
    }

    const results = Array.isArray(data) ? data : [];

    const formatted = results.map(row => ({
      year: parseInt(year, 10), // Include the year in the response
      month: row.month,
      revenue: parseFloat(row.revenue)
    }));

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error("Error fetching yearly revenue:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


// overall
exports.getOverallRevenue = async (req, res) => {
  try {

    const role = req.user.role
    const userId = req.user.id

    const { user_type, partner_id } = req.query;

    let result;

    if (role == "partner") {
      result = await callProcedure("getOverallRevenueForPartner", [
        userId
      ]);
    } else {
      if (user_type == "all") {
        result = await callProcedure("getOverallRevenue");
      } else if (user_type == "admin") {
        result = await callProcedure("getOverallRevenueByAdmin");
      } else if (user_type == "partner" && partner_id == "all") {
        result = await callProcedure("getOverallRevenueByPartners");
      } else if (user_type == "partner" && partner_id != "all") {
        result = await callProcedure("getOverallRevenueForPartner", [
          partner_id
        ]);
      } else {
        result = await callProcedure("getOverallRevenue");
      }
    }
    // Call stored procedure that calculates revenue by course category
    const { success, data, error } = result;

    if (!success) {
      return res.status(500).json({ success: false, error });
    }

    const results = Array.isArray(data) ? data : [];

    const formatted = results.map(row => ({
      year: row.year,
      revenue: parseFloat(row.revenue)
    }));

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error("Error fetching overall revenue:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
