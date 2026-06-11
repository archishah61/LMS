const { callProcedure } = require("../../utils/procedure/callProcedure");

// Estimated vs Actual Completion time
exports.getEstimatedVsActualCompletionTimes = async (req, res) => {
  try {
    const role = req.user.role
    const userId = req.user.id

    const { user_type, partner_id } = req.query;


    let result;

    if (role == "partner") {
      result = await callProcedure("getEstimatedVsActualCompletionTimesForPartner", [
        userId
      ]);
    } else {
      if (user_type == "all") {
        result = await callProcedure("getEstimatedVsActualCompletionTimes");
      } else if (user_type == "admin") {
        result = await callProcedure("getEstimatedVsActualCompletionTimesByAdmin");
        
      } else if (user_type == "partner" && partner_id == "all") {
        result = await callProcedure("getEstimatedVsActualCompletionTimesByPartners");
        
      } else if (user_type == "partner" && partner_id != "all") {
        result = await callProcedure("getEstimatedVsActualCompletionTimesForPartner", [
          partner_id
        ]);
      } else {
        result = await callProcedure("getEstimatedVsActualCompletionTimes");
      }
    }

    const { success, data, error } = result

    if (!success) {
      return res.status(500).json({ success: false, error });
    }

    const formatted = data.map(row => ({
      course_id: row.course_id,
      course_title: row.course_title,
      estimated_hours: parseFloat(row.estimated_hours),
      average_actual_hours: parseFloat(row.average_actual_hours),
      student_count: parseInt(row.student_count, 10)
    }));

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

