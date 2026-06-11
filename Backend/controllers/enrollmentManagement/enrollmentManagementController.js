const Course = require("../../models/course_management/course");
const {
  generateUserCourseHash,
} = require("../../utils/course_management/generateHash");
const Validation = require("../../validations");
const { logUserActivity } = require("../../utils/activity/logUserActivity");
const { callProcedure } = require("../../utils/procedure/callProcedure");
const sequelize = require("../../config/db");
const Session = require("../../models/course_management/session");
const Module = require("../../models/course_management/module");
const Topic = require("../../models/course_management/topic");
const TopicContent = require("../../models/course_management/topic_content");
const { Quizzes } = require("../../models/content_management/quizzesModel");
const Assignment = require("../../models/content_management/assignmentsModel");
const { Op } = require("sequelize");
const studentAccessibleData = require("../../models/enrollment_management/student_accessible_data");
const { jsPDF } = require("jspdf");
require("jspdf-autotable");
const XLSX = require("xlsx");
const User = require("../../models/auth/user");
const FooterSetting = require("../../models/legalPages/footerSetting");
const { Partner } = require("../../models/partner/partner")
const fs = require("fs");
const path = require("path");
const Country = require("../../models/masters/country");
const State = require("../../models/masters/state");
const City = require("../../models/masters/city");
const logoPath = path.resolve("template/img/queekies.png");

// Create Enrollment using stored procedure
exports.createEnrollment = async (req, res, next) => {
  try {
    const createdBy = req.user ? req.user.id : null;
    const { courseId, userId, isEnrolledByPromoCode } = req.body;

    if (!courseId || !userId) {
      return res
        .status(400)
        .json({ error: "courseId and userId are required" });
    }

    Validation.isNumber(userId, "User ID must be a valid number");
    Validation.isString(
      courseId,
      { min: 1 },
      "Course ID must be a valid string"
    );

    const userHash = generateUserCourseHash(userId, courseId);
    const enrollmentDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const results = await callProcedure("createEnrollment", [
      userId,
      courseId,
      userHash,
      enrollmentDate,
      expiryDate,
      isEnrolledByPromoCode,
      "active",
      createdBy,
    ]);

    const course_record = await Course.findOne({
      where: { public_hash: courseId },
      attributes: ["id", "title", "public_hash"],
      raw: true,
    });

    // ✅ Fetch active sessions ordered by sequence_no
    const sessions = await Session.findAll({
      where: { course_id: course_record.id, status: "active" },
      attributes: ["id", "sequence_no"],
      order: [["sequence_no", "ASC"]],
      raw: true,
    });

    // ✅ Fetch active modules (will sort later hierarchically)
    const modulesRaw = await Module.findAll({
      where: {
        session_id: { [Op.in]: sessions.map((s) => s.id) },
        status: "active",
      },
      attributes: ["id", "session_id", "sequence_no"],
      order: [["sequence_no", "ASC"]],
      raw: true,
    });

    // ✅ Fetch active topics (will sort later hierarchically)
    const topicsRaw = await Topic.findAll({
      where: {
        module_id: { [Op.in]: modulesRaw.map((m) => m.id) },
        status: "active",
      },
      attributes: ["id", "module_id", "sequence_no"],
      order: [["sequence_no", "ASC"]],
      raw: true,
    });

    // Fetch Topic Contents (Quizzes and Assignments linked to topics)
    const topicContents = await TopicContent.findAll({
      where: {
        topic_id: { [Op.in]: topicsRaw.map((t) => t.id) },
      },
      attributes: ["topic_id", "quiz_id", "assignment_id"],
      raw: true,
    });

    // Fetch active quizzes with their module relationships
    const quizzes = await Quizzes.findAll({
      where: {
        module_id: { [Op.in]: modulesRaw.map((m) => m.id) },
        status: "active",
      },
      attributes: ["id", "module_id"],
      raw: true,
    });

    // Fetch active assignments with their module relationships
    const assignments = await Assignment.findAll({
      where: {
        module_id: { [Op.in]: modulesRaw.map((m) => m.id) },
        status: "active",
      },
      attributes: ["id", "module_id"],
      raw: true,
    });

    // ✅ Build hierarchical order for modules and topics
    let modules = [];
    for (const session of sessions) {
      const sessionModules = modulesRaw
        .filter((m) => m.session_id === session.id)
        .sort((a, b) => a.sequence_no - b.sequence_no);
      modules.push(...sessionModules);
    }

    let topics = [];
    for (const module of modules) {
      const moduleTopics = topicsRaw
        .filter((t) => t.module_id === module.id)
        .sort((a, b) => a.sequence_no - b.sequence_no);
      topics.push(...moduleTopics);
    }

    // Get the first session, module and topic IDs
    const firstSessionId = sessions.length > 0 ? sessions[0].id : null;
    const firstModule = modules.length > 0 ? modules[0] : null;
    const firstTopic =
      topics.find((t) => firstModule && t.module_id === firstModule.id) || null;

    // Collect IDs of quizzes and assignments that are attached to topics
    const topicQuizIds = new Set(
      topicContents.filter((tc) => tc.quiz_id).map((tc) => tc.quiz_id)
    );
    const topicAssignmentIds = new Set(
      topicContents
        .filter((tc) => tc.assignment_id)
        .map((tc) => tc.assignment_id)
    );

    // Create student accessible data with the new structure
    const studentData = await studentAccessibleData.create({
      user_id: userId,
      course_id: course_record.id,
      enrollment_id: results.data[0].id,
      // Format sessions - only first session is accessible
      session_ids: sessions.map((s) => ({
        id: s.id,
        isAccessible: s.id === firstSessionId,
        isCompleted: false,
      })),
      // Format modules - only first module is accessible
      module_ids: modules.map((m) => ({
        id: m.id,
        isAccessible: firstModule && m.id === firstModule.id,
        session_id: m.session_id,
        isCompleted: false,
      })),
      // Format topics - only first topic of first module is accessible
      topic_ids: topics.map((t) => {
        // Find content for this topic
        const contents = topicContents.filter((tc) => tc.topic_id === t.id);
        const relatedQuizIds = contents
          .filter((tc) => tc.quiz_id)
          .map((tc) => ({
            id: tc.quiz_id,
            isComplete: false
          }));
        const relatedAssignmentIds = contents
          .filter((tc) => tc.assignment_id)
          .map((tc) => ({
            id: tc.assignment_id,
            isComplete: false
          }));

        return {
          id: t.id,
          isAccessible: firstTopic && t.id === firstTopic.id,
          module_id: t.module_id,
          isCompleted: false,
          isQuizExists: relatedQuizIds.length > 0,
          isAssignmentExists: relatedAssignmentIds.length > 0,
          topic_quiz: relatedQuizIds,
          topic_assignment: relatedAssignmentIds,
        };
      }),
      // Format quizzes - all initially inaccessible
      quiz_ids: quizzes
        .filter((q) => !topicQuizIds.has(q.id))
        .map((q) => ({
          id: q.id,
          isAccessible: false,
          module_id: q.module_id,
          isCompleted: false,
        })),
      // Format assignments - all initially inaccessible
      assignment_ids: assignments
        .filter((a) => !topicAssignmentIds.has(a.id))
        .map((a) => ({
          id: a.id,
          isAccessible: false,
          module_id: a.module_id,
          isCompleted: false,
        })),
    });

    if (results.error) {
      return next(results.error);
    }

    try {
      const ip = (req.headers["x-forwarded-for"] || "").split(",")[0] || req.ip;
      const ua = req.headers["user-agent"];
      logUserActivity({
        userId,
        eventCategory: "course",
        eventAction: "enrolled",
        outcome: "success",
        entityType: "course",
        entityId: course_record?.id || null,
        ip,
        userAgent: ua,
        metadata: {
          title: "Course Enrollment",
          // enrollment_id: enrollmentId,
          course_title: course_record?.title || null,
          course_public_hash: course_record?.public_hash || null,
        },
      });
    } catch (e) { }
    res.status(201).json(results);
  } catch (error) {
    console.error("Enrollment error:", error);
    next(error);
  }
};

// Get all enrollments with user and course details using stored procedure
exports.getEnrollments = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.role === 'admin' ? 'admin' : req.user?.role === 'partner' ? 'partner' : 'student';
    const { searchTerm, status, dateFrom, dateTo } = req.query;

    const { success, data, error } = await callProcedure("getAllEnrollmentsWithDetails", [
      userId,
      userType,
      searchTerm || null,
      status || null,
      dateFrom || null,
      dateTo || null
    ]);

    if (!success) {
      if (error) return next(error);
      // return res.status(400).json({ error });
    }

    const resultRows = Array.isArray(data) ? data : [];

    const enrollments = resultRows.map((item) => ({
      id: item.enrollment_id,
      user_id: item.user_id,
      course_id: item.course_id,
      user_hash: item.user_hash,
      enrollment_date: item.enrollment_date,
      completion_percentage: item.completion_percentage,
      certificate_url: item.certificate_url,
      is_completed: item.is_completed,
      completed_at: item.completed_at,
      expiry_date: item.expiry_date,
      status: item.status,
      created_by: item.created_by,
      updated_by: item.updated_by,
      created_at: item.created_at,
      updated_at: item.updated_at,
      user: {
        id: item.user_id,
        full_name: item.full_name,
        email: item.email,
        username: item.username,
        mobile_no: item.mobile_no,
      },
      course: {
        id: item.course_id,
        public_hash: item.public_hash,
        title: item.title,
        description: item.description,
        thumbnail: item.thumbnail,
        price: item.price,
        duration_hours: item.duration_minutes,
        category_id: item.category_id,
        category: {
          id: item.category_id,
          category: item.category_name,
        },
      },
    }));

    res.status(200).json(enrollments);
  } catch (error) {
    next(error);
  }
};

// Get Enrollment By ID using stored procedure
exports.getEnrollmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    Validation.isNumber(id, "Enrollment ID must be a valid number");

    const results = await callProcedure("getEnrollmentById", [id]);

    if (results.error) return next(results.error);

    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

// Get User Courses using stored procedure
exports.getUserCourses = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const { status = 'all' } = req.query; // Added status param

    // Validate userId
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    Validation.isNumber(userId, "User ID must be a valid number");

    const { success, data, error } = await callProcedure(
      "getUserCoursesWithRawCourses",
      [userId, status]
    );

    if (!success && error) return next(error);

    if (!success) {
      return res.status(400).json({ error });
    }

    const resultRows = Array.isArray(data) ? data : [];

    const courses = resultRows.map((item) => ({
      user_hash: item.user_hash,
      status: item.status,
      certificate_url: item.certificate_url,
      is_completed: item.is_completed,
      completion_percentage: item.completion_percentage,
      course: {
        id: item.course_id,
        public_hash: item.public_hash,
        title: item.title,
        description: item.description,
        thumbnail: item.thumbnail,
        price: item.price,
        duration_hours: item.duration_minutes,
        category_id: item.category_id,
        category: {
          id: item.category_id,
          category: item.category_name,
        },
      },
    }));

    res.status(200).json({
      courses,
      count: courses.length,
    });
  } catch (error) {
    next(error);
  }
};

// Get User Course using stored procedure
exports.getUserCourse = async (req, res, next) => {
  try {
    const { userId, courseId } = req.params;

    // Validate input
    if (!userId || !courseId) {
      return res
        .status(400)
        .json({ error: "User ID and Course ID are required" });
    }

    Validation.isNumber(userId, "User ID must be a valid number");
    Validation.isString(
      courseId,
      { min: 1 },
      "Course ID must be a valid string"
    );

    // Use stored procedure to get enrollment
    const { success, data, error } = await callProcedure(
      "getUserCourseEnrollment",
      [userId, courseId]
    );

    if (!success && error) return next(error);
    if (!success) {
      return res.status(400).json({ error });
    }

    const resultRows = Array.isArray(data) ? data : [];
    res.status(200).json({
      userEnrollment: resultRows[0], // Return the first matching row
    });
  } catch (error) {
    next(error);
  }
};

// Get User Course by Hash ID using stored procedure
exports.getUserCourseByHashId = async (req, res, next) => {
  try {
    const { userId, hashId } = req.params;

    // Validate input
    if (!userId || !hashId) {
      return res
        .status(400)
        .json({ error: "User ID and Hash ID are required" });
    }

    Validation.isNumber(userId, "User ID must be a valid number");
    Validation.isString(hashId, { min: 1 }, "Hash ID must be a valid string");

    // Use stored procedure to get course and enrollment details
    const { success, data, error } = await callProcedure(
      "getUserCourseByHashId",
      [userId, hashId]
    );

    if (!success && error) return next(error);
    if (!success) {
      return res.status(400).json({ error });
    }

    const resultRows = Array.isArray(data) ? data : [];
    if (resultRows.length === 0) {
      return res
        .status(404)
        .json({ error: "No active enrollment found for this hash ID" });
    }

    const courseDetails = resultRows[0];
    res.status(200).json({
      course: courseDetails,
      enrollmentuser: courseDetails.enrollment_id,
      certificate_url: courseDetails.certificate_url
    });
  } catch (error) {
    next(error);
  }
};

exports.createPayment = async (req, res, next) => {
  try {
    const {
      enrollment_id,
      amount,
      currency,
      payment_method,
      userId,
      transactionId,
      reference_id,
      payment_gateway,
      gateway_response,
      notes,
      status,
    } = req.body;

    if (!enrollment_id || !amount || !currency || !payment_method || !userId) {
      return res.status(400).json({
        error:
          "Fields required: enrollment_id, amount, currency, payment_method, userId",
      });
    }

    Validation.isNumber(enrollment_id, "Enrollment ID must be a valid number");
    Validation.isNumber(amount, "Amount must be a valid number");
    Validation.isString(
      currency,
      { min: 1, max: 4 },
      "Currency must be a valid 3-letter code"
    );
    Validation.isString(
      payment_method,
      { min: 1 },
      "Payment method must be a valid string"
    );
    Validation.isNumber(userId, "User ID must be a valid number");
    if (transactionId)
      Validation.isString(
        transactionId,
        { min: 1 },
        "Transaction ID must be a valid string"
      );
    if (reference_id)
      Validation.isString(
        reference_id,
        { min: 1 },
        "Reference ID must be a valid string"
      );

    // Check if the enrollment exists via procedure
    const enrollmentCheck = await callProcedure("getEnrollmentById", [
      enrollment_id,
    ]);
    if (enrollmentCheck.success === false) {
      return next(
        enrollmentCheck.error || new Error("Enrollment validation failed")
      );
    }
    const enrollmentRow = Array.isArray(enrollmentCheck.data)
      ? Array.isArray(enrollmentCheck.data[0])
        ? enrollmentCheck.data[0][0]
        : enrollmentCheck.data[0]
      : enrollmentCheck.data;
    if (!enrollmentRow) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    // Default fallback transaction ID
    const transaction_id =
      transactionId || Math.floor(Math.random() * 1000000000).toString();

    const payment = await callProcedure("createPayment", [
      enrollment_id,
      null,
      amount,
      currency,
      payment_method,
      payment_gateway,
      gateway_response ? JSON.stringify(gateway_response) : null,
      transaction_id,
      reference_id || null,
      status,
      notes || null,
      userId,
    ]);

    if (payment.success) {
      return res.status(201).json(payment);
    } else {
      return next(payment.error);
    }
  } catch (error) {
    next(error);
  }
};

// Get All Payments using stored procedure
exports.getPayments = async (req, res, next) => {
  try {
    const {
      payment_type = "all",
      search_term = "",
      limit = "ALL",
      offset = "0",
    } = req.query;

    const role = req.user?.role;
    const id = req.user?.id;

    /* ---------- VALIDATION ---------- */
    if (limit !== "ALL") {
      Validation.isInteger(limit, "Limit must be a positive integer or 'ALL'.");
    }
    if (payment_type !== "all") {
      Validation.isEnum(payment_type, ['course-enroll', 'contest-enroll', 'cheatsheet', 'course-generation'], "Payment Type is required.");
    }
    Validation.isInteger(offset, "Offset must be a non‑negative integer.");
    if (search_term) Validation.isString(search_term, { min: 1, max: 255 });
    /* --------------------------------- */

    // Convert limit for procedure (use -1 for 'ALL')
    const pageLimit = limit === "ALL" ? -1 : Number(limit);
    const pageOffset = Number(offset);

    const { success, data, error } = await callProcedure("getAllPayments", [
      search_term,
      payment_type,
      pageLimit,
      pageOffset,
      role,
      id
    ]);

    if (!success) {
      return next(error);
    }

    const cleanedData = data.map(({ total_entries, ...rest }) => rest);
    const total = data[0]?.total_entries;

    // Format response
    const response = {
      success: true,
      data: cleanedData,
      pagination: {
        limit: limit === "ALL" ? "ALL" : pageLimit,
        offset: pageOffset,
        returned: data.length,
        total: total,
        totalPages: limit === "ALL" ? 1 : Math.ceil(total / limit)
      }
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

// Get Payment By ID using stored procedure
exports.getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    Validation.isNumber(id, "Payment ID must be a valid number");
    const results = await sequelize.query(`CALL getPaymentById(:p_id)`, {
      replacements: { p_id: id },
    });

    if (!results || results.length === 0) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.status(200).json(results[0]);
  } catch (error) {
    next(error);
  }
};

// Get all payments for a user with course and enrollment details
exports.getPaymentsByUserId = async (req, res, next) => {
  try {
    const { id } = req.params; // user ID
    Validation.isNumber(id, "User ID must be a valid number");
    const results = await sequelize.query(
      `CALL getPaymentsByUserId(:p_user_id)`,
      {
        replacements: { p_user_id: id },
      }
    );
    if (!results || results.length === 0) {
      return res
        .status(404)
        .json({ message: "No payments found for this user" });
    }

    const cleanedResults = results.map((payment) => {
      const baseFields = {
        type: payment.type,
        payment_id: payment.payment_id,
        amount: payment.amount,
        currency: payment.currency,
        payment_method: payment.payment_method,
        payment_gateway: payment.payment_gateway,
        transaction_id: payment.transaction_id,
        reference_id: payment.reference_id,
        payment_status: payment.payment_status,
        transaction_date: payment.transaction_date,
        payment_notes: payment.payment_notes,
        payment_created_at: payment.payment_created_at,
      };

      // Course enrollment
      if (payment.type === "course-enroll" || payment.type === "course-generation") {
        return {
          ...baseFields,
          enrollment_id: payment.enrollment_id,
          enrollment_date: payment.enrollment_date,
          expiry_date: payment.expiry_date,
          enrollment_status: payment.enrollment_status,
          course_id: payment.course_id,
          public_hash: payment.public_hash,
          course_title: payment.course_title,
          course_description: payment.course_description,
          duration_minutes: payment.duration_minutes,
          thumbnail: payment.thumbnail,
          course_price: payment.course_price,
          course_discount: payment.course_discount,
          course_status: payment.course_status,
          tier_id: payment.tier_id,
          tier_name: payment.tier_name,
          tier_price: payment.tier_price,
        };
      }

      // Contest enrollment
      if (payment.type === "contest-enroll") {
        return {
          ...baseFields,
          contest_id: payment.contest_id,
          contest_name: payment.contest_name,
          contest_description: payment.contest_description,
          contest_banner: payment.contest_banner,
        };
      }

      return baseFields;
    });

    res.status(200).json(cleanedResults);
  } catch (error) {
    console.error("Error fetching user payments:", error);
    next(error); // or res.status(500).json({ error: "Server error" })
  }
};

// Update Payment using stored procedure
exports.updatePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated_by = req.user ? req.user.id : null;
    const {
      enrollment_id,
      amount,
      payment_status,
      payment_method,
      transaction_id,
    } = req.body;

    if (enrollment_id)
      Validation.isNumber(
        enrollment_id,
        "Enrollment ID must be a valid number"
      );
    if (amount) Validation.isNumber(amount, "Amount must be a valid number");
    if (payment_method)
      Validation.isString(
        payment_method,
        { min: 1 },
        "Payment method must be a valid string"
      );
    if (transaction_id)
      Validation.isString(
        transaction_id,
        { min: 1 },
        "Transaction ID must be a valid string"
      );

    const [results] = await sequelize.query(
      `CALL updatePayment(
      :p_id,
      :p_amount,
      :p_payment_method,
      :p_payment_status,
      :p_updated_by
    )`,
      {
        replacements: {
          p_id: id,
          p_amount: amount,
          p_payment_method: payment_method,
          p_payment_status: payment_status,
          p_updated_by: updated_by,
        },
      }
    );

    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

// Delete Payment using stored procedure
exports.deletePayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    Validation.isNumber(id, "Payment ID must be a valid number");
    await sequelize.query(`CALL deletePayment(:p_id)`, {
      replacements: { p_id: id },
    });

    res
      .status(200)
      .send({ success: true, message: "Payment Deleted Successfully" }); // No content
  } catch (error) {
    next(error);
  }
};

// -------------------------------------PROCEDURE RELATED CODE ENDS-----------------------------------

// Unified course progress endpoint
// GET /api/enrollment/users/:userId/course-progress/:courseHash
// Returns: { course: {...}, totalTopicTimeSpentSeconds, sessions: [ {id,title, isAccessible, isCompleted, modules:[ {id,title,isAccessible,isCompleted, topics:[{id,title,isAccessible,isCompleted, timeSpentSeconds, quiz, assignment}], quizzes:[...], assignments:[...] } ] } ] }
exports.getUserCourseProgress = async (req, res, next) => {
  try {
    const { userId, courseHash } = req.params;

    if (!userId || !courseHash) {
      return res
        .status(400)
        .json({ success: false, message: "userId & courseHash required" });
    }
    // Use stored procedure to fetch all relevant JSON chunks in one call
    const { success, data, error } = await callProcedure(
      "getUserCourseProgress",
      [Number(userId), courseHash]
    );

    const { success: totalTimeSpentSuccess, data: totalTimeSpentData } = await callProcedure("getCourseTotalTimeSpentByUser", [Number(userId), courseHash]);

    if (!success) {
      if (
        error
      ) {
        return next(error);
      }
      return res.status(400).json({
        success: false,
        message: "Failed to load course progress",
        error,
      });
    }

    // Procedure returns row
    const row = Array.isArray(data)
      ? Array.isArray(data[0])
        ? data[0][0]
        : data[0]
      : data;
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "No progress data found" });

    const progress = buildProgressFromProcedureRow(row);
    return res.status(200).json({ success: true, ...progress, ...{ totalTimeSpent: totalTimeSpentSuccess ? totalTimeSpentData[0].total_time_spent : null } });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// Helper to build enriched progress object from stored procedure row
function buildProgressFromProcedureRow(row) {
  const parse = (v, def) => {
    if (!v) return def;
    try {
      return typeof v === "string" ? JSON.parse(v) : v;
    } catch {
      return def;
    }
  };

  const userJson = parse(row.user_json, null);
  const courseJson = parse(row.course_json, {}) || {};
  const enrollmentJson = parse(row.enrollment_json, null);
  const sessions = parse(row.sessions_json, []);
  const modules = parse(row.modules_json, []);
  const topics = parse(row.topics_json, []);
  const quizzes = parse(row.quizzes_json, []);
  const assignments = parse(row.assignments_json, []);
  const quizAttemptsRaw = parse(row.quiz_attempts_json, []);
  const assignmentAttemptsRaw = parse(row.assignment_attempts_json, []);
  const sessionAccess = parse(row.session_access_json, []);
  const moduleAccess = parse(row.module_access_json, []);
  const topicAccess = parse(row.topic_access_json, []);
  const quizAccess = parse(row.quiz_access_json, []);
  const assignmentAccess = parse(row.assignment_access_json, []);
  const topicTimes = parse(row.topic_times_json, []);
  const sessionMeta = parse(row.session_meta_json, []);
  const moduleMeta = parse(row.module_meta_json, []);
  const topicMeta = parse(row.topic_meta_json, []);
  const slideDetails = parse(row.slide_details_json, []);

  // Lookup maps
  const sessionAccessMap = new Map(sessionAccess.map((s) => [s.id, s]));
  const moduleAccessMap = new Map(moduleAccess.map((m) => [m.id, m]));
  const topicAccessMap = new Map(topicAccess.map((t) => [t.id, t]));
  const quizAccessMap = new Map(quizAccess.map((q) => [q.id, q]));
  const assignmentAccessMap = new Map(assignmentAccess.map((a) => [a.id, a]));

  // Create maps for topic-specific content
  const topicQuizzesMap = new Map();
  const topicAssignmentsMap = new Map();

  topicAccess.forEach(topic => {
    // Collect topic quizzes
    if (topic.topic_quiz && Array.isArray(topic.topic_quiz)) {
      topic.topic_quiz.forEach(quiz => {
        topicQuizzesMap.set(quiz.id, {
          id: quiz.id,
          topic_id: topic.id,
          title: quiz.title,
          isComplete: quiz.isComplete || false
        });
      });
    }

    // Collect topic assignments
    if (topic.topic_assignment && Array.isArray(topic.topic_assignment)) {
      topic.topic_assignment.forEach(assignment => {
        topicAssignmentsMap.set(assignment.id, {
          id: assignment.id,
          topic_id: topic.id,
          title: assignment.title,
          isComplete: assignment.isComplete || false
        });
      });
    }
  });

  const quizAttemptsMap = quizAttemptsRaw.reduce((acc, att) => {
    (acc[att.quiz_id] = acc[att.quiz_id] || []).push(att);
    return acc;
  }, {});
  const assignmentAttemptsMap = assignmentAttemptsRaw.reduce((acc, att) => {
    (acc[att.assignment_id] = acc[att.assignment_id] || []).push(att);
    return acc;
  }, {});
  const topicFirstCompletionTimeMap = new Map(
    topicTimes.map((tt) => [
      tt.topic_id,
      tt.first_completion_time_spent ?? 0,
    ])
  );
  const topicActualTimeMap = new Map(
    topicTimes.map((tt) => [
      tt.topic_id,
      tt.student_time_spent ?? 0,
    ])
  );
  const sessionTimeMeta = new Map(
    sessionMeta.map((s) => [
      s.session_id,
      {
        start: s.start_at,
        last: s.last_activity_at,
        completed: s.completed_at,
      },
    ])
  );
  const moduleTimeMeta = new Map(
    moduleMeta.map((m) => [
      m.module_id,
      {
        start: m.start_at,
        last: m.last_activity_at,
        completed: m.completed_at,
      },
    ])
  );
  const topicTimeMeta = new Map(
    topicMeta.map((t) => [
      t.topic_id,
      {
        start: t.start_at,
        last: t.last_activity_at,
        completed: t.completed_at,
        totAccordions: t.total_accordions,
        completedAccordions: t.completed_accordions,
        totSlides: t.total_slides,
        completedSlides: t.completed_slides,
        revisionCount: t.revision_count,
        firstCompletionTimeSpent: t.first_completion_time_spent || 0,
        colorDot: t.color_dot || 'red'
      },
    ])
  );

  // ---------- NEW MAP ----------
  const slideMap = new Map();               // <-- ADD THIS
  const slideFirstCompletionTotalByTopic = new Map();
  const slideActualTotalByTopic = new Map();
  slideDetails.forEach(s => {
    const arr = slideMap.get(s.topic_id) || [];
    const slideFirstCompletion = Number(s.firstCompletionTimeSpent || 0);
    const slideActualTime = Number(s.timeSpentSeconds || 0);
    arr.push({
      slide_id: s.slide_id,
      title: s.title,
      timeSpentSeconds: slideFirstCompletion,
      actualTimeSpentSeconds: slideActualTime,
      firstCompletionTimeSpent: slideFirstCompletion,
      colorDot: s.colorDot || 'red',
      completedAt: s.completedAt,
      createdAt: s.createdAt,
      status: s.status,
      revision_count: s.revision_count,
    });
    slideMap.set(s.topic_id, arr);
    slideFirstCompletionTotalByTopic.set(
      s.topic_id,
      (slideFirstCompletionTotalByTopic.get(s.topic_id) || 0) + slideFirstCompletion
    );
    slideActualTotalByTopic.set(
      s.topic_id,
      (slideActualTotalByTopic.get(s.topic_id) || 0) + slideActualTime
    );
  });

  for (const [topicId, slides] of slideMap.entries()) {
    slides.sort((a, b) => {
      // push nulls to end
      if (!a.completedAt) return 1;
      if (!b.completedAt) return -1;

      // DESC order (latest first)
      return new Date(a.completedAt) - new Date(b.completedAt);
    });
  }

  // Grouping helpers
  const modulesBySession = modules.reduce((acc, m) => {
    acc[m.session_id] = acc[m.session_id] || [];
    acc[m.session_id].push(m);
    return acc;
  }, {});
  const topicsByModule = topics.reduce((acc, t) => {
    acc[t.module_id] = acc[t.module_id] || [];
    acc[t.module_id].push(t);
    return acc;
  }, {});
  const quizzesByModule = quizzes.reduce((acc, q) => {
    acc[q.module_id] = acc[q.module_id] || [];
    acc[q.module_id].push(q);
    return acc;
  }, {});
  const assignmentsByModule = assignments.reduce((acc, a) => {
    acc[a.module_id] = acc[a.module_id] || [];
    acc[a.module_id].push(a);
    return acc;
  }, {});

  let totalTopicTimeSpentSeconds = 0;

  const sessionTree = sessions.map((sess) => {
    const sessionModulesRaw = modulesBySession[sess.id] || [];
    const moduleNodes = sessionModulesRaw.map((mod) => {
      const modTopics = (topicsByModule[mod.id] || []).map((tp) => {
        const meta = topicTimeMeta.get(tp.id) || {};
        const slideRows = slideMap.get(tp.id) || [];
        const hasSlides = (meta.totSlides || 0) > 0 || slideRows.length > 0;
        const topicFirstCompletion =
          (meta.firstCompletionTimeSpent ?? topicFirstCompletionTimeMap.get(tp.id)) ?? 0;
        const slideFirstCompletionTotal = slideFirstCompletionTotalByTopic.get(tp.id) || 0;
        const timeSpent = hasSlides
          ? Math.max(topicFirstCompletion, slideFirstCompletionTotal)
          : topicFirstCompletion;

        const topicActualTime = topicActualTimeMap.get(tp.id) || 0;
        const slideActualTotal = slideActualTotalByTopic.get(tp.id) || 0;
        const actualTimeSpent = hasSlides
          ? Math.max(topicActualTime, slideActualTotal)
          : topicActualTime;

        totalTopicTimeSpentSeconds += topicActualTime;

        // Get topic-specific quizzes and assignments
        const topicQuizzes = Array.from(topicQuizzesMap.values())
          .filter(q => q.topic_id === tp.id)
          .map(q => {
            const attempts = (quizAttemptsMap[q.id] || []).map((a) => {
              const statusLower = (a.status || "").toLowerCase();
              let passFail = null;
              if (["passed", "completed", "success"].includes(statusLower))
                passFail = "passed";
              else if (["failed", "fail", "incomplete"].includes(statusLower))
                passFail = "failed";
              return {
                attemptId: a.attempt_id,
                status: a.status,
                isCompleted: !!a.is_completed,
                score: a.score,
                obtainedMarks: a.obtained_marks,
                totalMarks: a.total_marks,
                percentage: a.percentage,
                startedAt: a.started_at,
                completedAt: a.completed_at,
                passFail,
                triedAttempts: a.tried_attempts,
              };
            });

            return {
              id: q.id,
              isComplete: q.isComplete,
              title: q.title,
              attempts: attempts
            };
          });

        const topicAssignments = Array.from(topicAssignmentsMap.values())
          .filter(a => a.topic_id === tp.id)
          .map(a => {
            const attempts = (assignmentAttemptsMap[a.id] || []).map((at) => ({
              attemptId: at.attempt_id,
              status: at.status,
              isCompleted: !!at.is_completed,
              score: at.score,
              max_score: at.max_score,
              percentage: at.percentage,
              startedAt: at.started_at,
              completedAt: at.completed_at,
              passFail: at.status
                ? at.status.toLowerCase() === "completed"
                  ? "passed"
                  : "failed"
                : null,
              triedAttempts: at.tried_attempts,
            }));

            return {
              id: a.id,
              isComplete: a.isComplete,
              title: a.title,
              attempts: attempts
            };
          });

        const topicObj = {
          id: tp.id,
          title: tp.title,
          isAccessible: !!(topicAccessMap.get(tp.id) || {}).isAccessible,
          isCompleted: !!(topicAccessMap.get(tp.id) || {}).isCompleted,
          timeSpentSeconds: timeSpent,
          actualTimeSpentSeconds: actualTimeSpent,
          startedAt: meta.start || null,
          lastActivityAt: meta.last || null,
          completedAt: meta.completed || null,
          totalAccordions: meta.totAccordions || 0,
          completedAccordions: meta.completedAccordions || 0,
          totalSlides: meta.totSlides || 0,
          completedSlides: meta.completedSlides || 0,
          revisionCount: meta.revisionCount || 0,
          firstCompletionTimeSpent: timeSpent,
          colorDot: meta.colorDot || 'red',
          topicQuizzes: topicQuizzes,
          topicAssignments: topicAssignments
        };

        // ---- INJECT SLIDES IF THIS IS A SLIDE TOPIC ----
        if (meta.totSlides > 0) {
          topicObj.slides = slideMap.get(tp.id) || [];
        }
        // ------------------------------------------------

        return topicObj;


      });
      const modQuizzes = (quizzesByModule[mod.id] || []).map((q) => {
        const attempts = (quizAttemptsMap[q.id] || []).map((a) => {
          const statusLower = (a.status || "").toLowerCase();
          let passFail = null;
          if (["passed", "completed", "success"].includes(statusLower))
            passFail = "passed";
          else if (["failed", "fail", "incomplete"].includes(statusLower))
            passFail = "failed";
          return {
            attemptId: a.attempt_id,
            status: a.status,
            isCompleted: !!a.is_completed,
            score: a.score,
            obtainedMarks: a.obtained_marks,
            totalMarks: a.total_marks,
            percentage: a.percentage,
            startedAt: a.started_at,
            completedAt: a.completed_at,
            passFail,
            triedAttempts: a.tried_attempts,
          };
        });
        return {
          id: q.id,
          title: q.title,
          isAccessible: !!(quizAccessMap.get(q.id) || {}).isAccessible,
          isCompleted: !!(quizAccessMap.get(q.id) || {}).isCompleted,
          attempts,
        };
      });
      const modAssignments = (assignmentsByModule[mod.id] || []).map((a) => {
        const attempts = (assignmentAttemptsMap[a.id] || []).map((at) => ({
          attemptId: at.attempt_id,
          status: at.status,
          isCompleted: !!at.is_completed,
          score: at.score,
          max_score: at.max_score,
          percentage: at.percentage,
          startedAt: at.started_at,
          completedAt: at.completed_at,
          passFail: at.status
            ? at.status.toLowerCase() === "completed"
              ? "passed"
              : "failed"
            : null,
          triedAttempts: at.tried_attempts,
        }));
        return {
          id: a.id,
          title: a.title,
          isAccessible: !!(assignmentAccessMap.get(a.id) || {}).isAccessible,
          isCompleted: !!(assignmentAccessMap.get(a.id) || {}).isCompleted,
          attempts,
        };
      });

      const totalItems =
        modTopics.length + modQuizzes.length + modAssignments.length;
      const completedItems =
        modTopics.filter((t) => t.isCompleted).length +
        modQuizzes.filter((q) => q.isCompleted).length +
        modAssignments.filter((a) => a.isCompleted).length;
      let moduleStatus = "not_started";
      if (totalItems > 0) {
        if (completedItems === totalItems) moduleStatus = "completed";
        else if (
          completedItems > 0 ||
          modTopics.some((t) => t.timeSpentSeconds > 0) ||
          modQuizzes.some((q) => q.isAccessible) ||
          modAssignments.some((a) => a.isAccessible)
        )
          moduleStatus = "in_progress";
      }
      const completionPercentage =
        totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
      const mMeta = moduleTimeMeta.get(mod.id) || {};
      const completedAt =
        moduleStatus === "completed" ? mMeta.completed || null : null;
      return {
        id: mod.id,
        title: mod.title,
        isAccessible: !!(moduleAccessMap.get(mod.id) || {}).isAccessible,
        isCompleted: moduleStatus === "completed",
        status: moduleStatus,
        completionPercentage,
        totalItems,
        completedItems,
        startedAt: mMeta.start || null,
        lastActivityAt: mMeta.last || null,
        completedAt,
        topics: modTopics,
        quizzes: modQuizzes,
        assignments: modAssignments,
      };
    });
    const totalModules = moduleNodes.length;
    const completedModules = moduleNodes.filter((m) => m.isCompleted).length;
    const avgModuleCompletion =
      totalModules === 0
        ? 0
        : Math.round(
          moduleNodes.reduce((sum, m) => sum + m.completionPercentage, 0) /
          totalModules
        );
    let sessionStatus = "not_started";
    if (totalModules > 0) {
      if (completedModules === totalModules) sessionStatus = "completed";
      else if (
        completedModules > 0 ||
        moduleNodes.some((m) => m.status === "in_progress")
      )
        sessionStatus = "in_progress";
    }
    const sMeta = sessionTimeMeta.get(sess.id) || {};
    const completedAt =
      sessionStatus === "completed" ? sMeta.completed || null : null;
    return {
      id: sess.id,
      title: sess.title,
      isAccessible: !!(sessionAccessMap.get(sess.id) || {}).isAccessible,
      isCompleted: sessionStatus === "completed",
      status: sessionStatus,
      completionPercentage: avgModuleCompletion,
      totalModules,
      completedModules,
      startedAt: sMeta.start || null,
      lastActivityAt: sMeta.last || null,
      completedAt,
      modules: moduleNodes,
    };
  });

  const allModules = sessionTree.flatMap((s) => s.modules);
  const overallCompletionRate =
    allModules.length === 0
      ? 0
      : Math.round(
        allModules.reduce((sum, m) => sum + m.completionPercentage, 0) /
        allModules.length
      );
  return {
    user: userJson,
    course: courseJson,
    enrollment: enrollmentJson,
    totalTopicTimeSpentSeconds,
    overallCompletionRate,
    sessions: sessionTree,
  };
}

// GET /api/enrollment/users/:userId/course-progress/:courseHash/export-csv
exports.exportUserCourseProgressCsv = async (req, res, next) => {
  try {
    const { userId, courseHash } = req.params;
    if (!userId || !courseHash)
      return res.status(400).json({ message: "userId & courseHash required" });
    const { success, data, error } = await callProcedure(
      "getUserCourseProgress",
      [Number(userId), courseHash]
    );
    if (!success) return next(error || new Error("Failed to fetch progress"));
    const row = Array.isArray(data)
      ? Array.isArray(data[0])
        ? data[0][0]
        : data[0]
      : data;
    if (!row)
      return res.status(404).json({ message: "No progress data found" });
    const progress = buildProgressFromProcedureRow(row);
    const {
      course,
      enrollment,
      sessions,
      totalTopicTimeSpentSeconds,
      overallCompletionRate,
    } = progress;
    let userDetails = null;
    try {
      userDetails = row.user_json
        ? typeof row.user_json === "string"
          ? JSON.parse(row.user_json)
          : row.user_json
        : null;
    } catch {
      userDetails = null;
    }

    const formatDateTime = (dt) => {
      if (!dt) return "";
      const d = new Date(dt);
      if (isNaN(d.getTime())) return "";
      const day = d.getDate();
      const ord = (n) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
      };
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const mo = months[d.getMonth()];
      const yr = d.getFullYear().toString().slice(-2);
      let h = d.getHours();
      const m = d.getMinutes().toString().padStart(2, "0");
      const ap = h >= 12 ? "pm" : "am";
      h = h % 12;
      h = h ? h : 12;
      const hh = h.toString().padStart(2, "0");
      return `${day}${ord(day)} ${mo} ${yr} | ${hh}:${m} ${ap}`;
    };

    const formatDuration = (seconds) => {
      if (!seconds) return "0s";
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return [h ? h + "h" : null, m ? m + "m" : null, s ? s + "s" : null]
        .filter(Boolean)
        .join(" ");
    };

    const escape = (val) => {
      if (val === null || val === undefined) return "";
      let s = String(val);
      if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
      return s;
    };

    const toCell = (v) =>
      v === null ||
        v === undefined ||
        (typeof v === "string" && v.trim() === "")
        ? "-"
        : v;

    const lines = [];
    const pushHeader = (arr) => lines.push(arr.map(escape).join(","));
    const pushData = (arr) => lines.push(arr.map(toCell).map(escape).join(","));
    const pushBlank = () => lines.push("");

    // User & Course summary block
    if (userDetails) {
      pushData([
        "USER Details",
        `Name: ${userDetails.full_name}` || "",
        `Username: ${userDetails.username || ""}`,
        `Email: ${userDetails.email || ""}`,
        "",
      ]);
    }
    pushData(["COURSE", course.title || "", "", "", ""]);
    pushData([
      "",
      `Enrollment Date: ${formatDateTime(
        enrollment?.enrollment_date || enrollment?.created_at
      )}`,
      `Completion Date: ${formatDateTime(enrollment?.completed_at) || "In Progress"
      }`,
      `Overall Completion: ${overallCompletionRate}%`,
      `Total Topic Time: ${formatDuration(totalTopicTimeSpentSeconds)}`,
    ]);
    pushBlank();

    // CSV Header
    pushHeader([
      "Type",
      "Session",
      "Module",
      "Title",
      "Attempts / Time",
      "Score",
      "Started",
      "Completed",
      "Status",
    ]);
    pushBlank();

    // Sessions, Modules, Topics, Quizzes, Assignments
    sessions.forEach((session, sIdx) => {
      pushData([
        "Session",
        session.title,
        "-",
        "-",
        "-",
        "-",
        session.startedAt ? formatDateTime(session.startedAt) : "-",
        session.completedAt ? formatDateTime(session.completedAt) : "-",
        `${session.isCompleted
          ? "Completed"
          : session.isAccessible
            ? "In Progress"
            : "Locked"
        }` +
        `${session.isAccessible
          ? ` (${session.completionPercentage
            ? session.completionPercentage + "%"
            : "-"
          })`
          : ""
        }`,
      ]);

      session.modules.forEach((module, mIdx) => {
        pushData([
          "Module",
          session.title,
          module.title,
          "-",
          "-",
          "-",
          module.startedAt ? formatDateTime(module.startedAt) : "-",
          module.completedAt ? formatDateTime(module.completedAt) : "-",
          `${module.isCompleted
            ? "Completed"
            : module.isAccessible
              ? "In Progress"
              : "Locked"
          }` +
          `${module.isAccessible
            ? ` (${module.completionPercentage
              ? module.completionPercentage + "%"
              : "-"
            })`
            : ""
          }`,
        ]);

        module.topics.forEach((topic, tIdx) => {
          pushData([
            "Topic",
            session.title,
            module.title,
            topic.title,
            formatDuration(topic.timeSpentSeconds),
            "-",
            topic.startedAt ? formatDateTime(topic.startedAt) : "-",
            topic.completedAt ? formatDateTime(topic.completedAt) : "-",
            topic.isCompleted
              ? "Completed"
              : topic.isAccessible
                ? "In Progress"
                : "Not Started",
          ]);
        });

        module.quizzes.forEach((quiz, qIdx) => {
          if (!quiz.attempts?.length) {
            pushData([
              "Quiz",
              session.title,
              module.title,
              quiz.title,
              "Attempt: 0",
              quiz.isCompleted ? "100" : "-",
              "-",
              "-",
              quiz.isCompleted
                ? "Completed"
                : quiz.isAccessible
                  ? "Available"
                  : "Pending",
            ]);
          } else {
            quiz.attempts.forEach((a, aIdx) => {
              pushData([
                "Quiz Attempt",
                session.title,
                module.title,
                quiz.title,
                a.triedAttempts !== null
                  ? `Attempt: ${a.triedAttempts}`
                  : "N/A",
                a.obtainedMarks != null && a.totalMarks != null
                  ? `${a.obtainedMarks}/${a.totalMarks}`
                  : "-",
                a.startedAt ? formatDateTime(a.startedAt) : "-",
                a.completedAt ? formatDateTime(a.completedAt) : "-",
                a.passFail === "passed" ? "Passed" : "Failed",
              ]);
            });
          }
        });

        module.assignments.forEach((assignment, aIdx) => {
          if (!assignment.attempts?.length) {
            pushData([
              "Assignment",
              session.title,
              module.title,
              assignment.title,
              "Attempt: 0",
              assignment.isCompleted ? "100" : "-",
              "-",
              "-",
              assignment.isCompleted
                ? "Completed"
                : assignment.isAccessible
                  ? "Available"
                  : "Pending",
            ]);
          } else {
            assignment.attempts.forEach((att, attIdx) => {
              pushData([
                "Assignment Attempt",
                session.title,
                module.title,
                assignment.title,
                att.triedAttempts != null
                  ? `Attempt: ${att.triedAttempts}`
                  : "N/A",
                att.score != null ? `${att.score}` : "-",
                att.startedAt ? formatDateTime(att.startedAt) : "-",
                att.completedAt ? formatDateTime(att.completedAt) : "-",
                att.passFail === "passed" ? "Passed" : "Failed",
              ]);
            });
          }
        });
      });
    });

    const csv = lines.join("\n");
    const safeCourse = (course.title || "course")
      .replace(/[^a-z0-9-_]+/gi, "_")
      .toLowerCase();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeCourse}_progress_report.csv"`
    );

    return res.status(200).send(csv);
  } catch (err) {
    return next(err);
  }
};

// GET /api/enrollment/users/:userId/course-progress/:courseHash/export-xlsx
exports.exportUserCourseProgressXlsx = async (req, res, next) => {
  try {
    const { userId, courseHash } = req.params;
    if (!userId || !courseHash)
      return res.status(400).json({ message: "userId & courseHash required" });
    const { success, data, error } = await callProcedure(
      "getUserCourseProgress",
      [Number(userId), courseHash]
    );
    if (!success) return next(error || new Error("Failed to fetch progress"));
    const row = Array.isArray(data)
      ? Array.isArray(data[0])
        ? data[0][0]
        : data[0]
      : data;
    if (!row)
      return res.status(404).json({ message: "No progress data found" });
    const progress = buildProgressFromProcedureRow(row);
    const {
      user,
      course,
      enrollment,
      sessions,
      overallCompletionRate,
      totalTopicTimeSpentSeconds,
    } = progress;

    const formatDateTime = (dt) => {
      if (!dt) return "-";
      const d = new Date(dt);
      if (isNaN(d.getTime())) return "-";
      const day = d.getDate().toString().padStart(2, "0");
      const mo = (d.getMonth() + 1).toString().padStart(2, "0");
      const yr = d.getFullYear();
      const hh = d.getHours().toString().padStart(2, "0");
      const mm = d.getMinutes().toString().padStart(2, "0");
      return `${day}/${mo}/${yr} ${hh}:${mm}`;
    };

    const formatDuration = (seconds) => {
      if (!seconds) return "0s";
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return [h ? h + "h" : null, m ? m + "m" : null, s ? s + "s" : null]
        .filter(Boolean)
        .join(" ");
    };

    const headerRows = [
      ["Course Progress Report"],
      ["Course", course.title || "-"],
      [
        "Student Name",
        user?.full_name || "-",
        "Username",
        user?.username || "-",
        "Email",
        user?.email || "-",
        "User ID",
        user?.id || "",
      ],
      [
        "Enrollment Date",
        formatDateTime(enrollment?.enrollment_date || enrollment?.created_at),
        "Completion Date",
        formatDateTime(enrollment?.completed_at) || "In Progress",
        "Overall Completion",
        overallCompletionRate + "%",
        "Total Topic Time",
        formatDuration(totalTopicTimeSpentSeconds),
      ],
      [],
      [
        "Type",
        "Session",
        "Module",
        "Title",
        "Attempts / Time",
        "Score",
        "Started",
        "Completed",
        "Status",
      ],
    ];

    const dataRows = [];

    sessions.forEach((session, sIdx) => {
      dataRows.push([
        "Session",
        session.title,
        "-",
        "-",
        "-",
        "-",
        session.startedAt ? formatDateTime(session.startedAt) : "-",
        session.completedAt ? formatDateTime(session.completedAt) : "-",
        `${session.isCompleted
          ? "Completed"
          : session.isAccessible
            ? "In Progress"
            : "Locked"
        }` +
        `${session.isAccessible
          ? ` (${session.completionPercentage
            ? session.completionPercentage + "%"
            : "-"
          })`
          : ""
        }`,
      ]);

      session.modules.forEach((module, mIdx) => {
        dataRows.push([
          "Module",
          session.title,
          module.title,
          "-",
          "-",
          "-",
          module.startedAt ? formatDateTime(module.startedAt) : "-",
          module.completedAt ? formatDateTime(module.completedAt) : "-",
          `${module.isCompleted
            ? "Completed"
            : module.isAccessible
              ? "In Progress"
              : "Locked"
          }` +
          `${module.isAccessible
            ? ` (${module.completionPercentage
              ? module.completionPercentage + "%"
              : "-"
            })`
            : ""
          }`,
        ]);

        module.topics.forEach((topic, tIdx) => {
          dataRows.push([
            "Topic",
            session.title,
            module.title,
            topic.title,
            formatDuration(topic.timeSpentSeconds),
            "-",
            topic.startedAt ? formatDateTime(topic.startedAt) : "-",
            topic.completedAt ? formatDateTime(topic.completedAt) : "-",
            topic.isCompleted
              ? "Completed"
              : topic.isAccessible
                ? "In Progress"
                : "Not Started",
          ]);
        });

        module.quizzes.forEach((quiz, qIdx) => {
          if (!quiz.attempts?.length) {
            dataRows.push([
              "Quiz",
              session.title,
              module.title,
              quiz.title,
              "Attempt: 0",
              quiz.isCompleted ? "100" : "-",
              "-",
              "-",
              quiz.isCompleted
                ? "Completed"
                : quiz.isAccessible
                  ? "Available"
                  : "Pending",
            ]);
          } else {
            quiz.attempts.forEach((a, aIdx) => {
              dataRows.push([
                "Quiz Attempt",
                session.title,
                module.title,
                quiz.title,
                a.triedAttempts !== null
                  ? `Attempt: ${a.triedAttempts}`
                  : "N/A",
                a.obtainedMarks != null && a.totalMarks != null
                  ? `${a.obtainedMarks}/${a.totalMarks}`
                  : "-",
                a.startedAt ? formatDateTime(a.startedAt) : "-",
                a.completedAt ? formatDateTime(a.completedAt) : "-",
                a.passFail === "passed" ? "Passed" : "Failed",
              ]);
            });
          }
        });

        module.assignments.forEach((assignment, aIdx) => {
          if (!assignment.attempts?.length) {
            dataRows.push([
              "Assignment",
              session.title,
              module.title,
              assignment.title,
              "Attempt: 0",
              assignment.isCompleted ? "100" : "-",
              "-",
              "-",
              assignment.isCompleted
                ? "Completed"
                : assignment.isAccessible
                  ? "Available"
                  : "Pending",
            ]);
          } else {
            assignment.attempts.forEach((att, attIdx) => {
              dataRows.push([
                "Assignment Attempt",
                session.title,
                module.title,
                assignment.title,
                att.triedAttempts != null
                  ? `Attempt: ${att.triedAttempts}`
                  : "N/A",
                att.score != null ? `${att.score}` : "-",
                att.startedAt ? formatDateTime(att.startedAt) : "-",
                att.completedAt ? formatDateTime(att.completedAt) : "-",
                att.passFail === "passed" ? "Passed" : "Failed",
              ]);
            });
          }
        });
      });
    });

    const sheetData = [...headerRows, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const colWidths = [];
    sheetData.forEach((r) =>
      r.forEach((c, i) => {
        const len = (c ? String(c).length : 0) + 2;
        if (!colWidths[i] || len > colWidths[i].wch)
          colWidths[i] = { wch: Math.min(len, 60) };
      })
    );
    ws["!cols"] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Progress");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const safeTitle = (course.title || "course")
      .replace(/[^a-z0-9-_]+/gi, "_")
      .toLowerCase();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeTitle}_progress_report.xlsx"`
    );
    return res.status(200).send(buf);
  } catch (err) {
    return next(err);
  }
};

exports.exportUserCourseProgressXlsx = async (req, res, next) => {
  try {
    const { userId, courseHash } = req.params;
    if (!userId || !courseHash)
      return res.status(400).json({ message: "userId & courseHash required" });
    const { success, data, error } = await callProcedure(
      "getUserCourseProgress",
      [Number(userId), courseHash]
    );
    if (!success) return next(error || new Error("Failed to fetch progress"));
    const row = Array.isArray(data)
      ? Array.isArray(data[0])
        ? data[0][0]
        : data[0]
      : data;
    if (!row)
      return res.status(404).json({ message: "No progress data found" });
    const progress = buildProgressFromProcedureRow(row);
    const {
      user,
      course,
      enrollment,
      sessions,
      overallCompletionRate,
      totalTopicTimeSpentSeconds,
    } = progress;

    const formatDateTime = (dt) => {
      if (!dt) return "-";
      const d = new Date(dt);
      if (isNaN(d.getTime())) return "-";
      const day = d.getDate().toString().padStart(2, "0");
      const mo = (d.getMonth() + 1).toString().padStart(2, "0");
      const yr = d.getFullYear();
      const hh = d.getHours().toString().padStart(2, "0");
      const mm = d.getMinutes().toString().padStart(2, "0");
      return `${day}/${mo}/${yr} ${hh}:${mm}`;
    };

    const formatDuration = (seconds) => {
      if (!seconds) return "0s";
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return [h ? h + "h" : null, m ? m + "m" : null, s ? s + "s" : null]
        .filter(Boolean)
        .join(" ");
    };

    const headerRows = [
      ["Course Progress Report"],
      ["Course", course.title || "-"],
      [
        "Student Name",
        user?.full_name || "-",
        "Username",
        user?.username || "-",
        "Email",
        user?.email || "-",
        "User ID",
        user?.id || "",
      ],
      [
        "Enrollment Date",
        formatDateTime(enrollment?.enrollment_date || enrollment?.created_at),
        "Completion Date",
        formatDateTime(enrollment?.completed_at) || "In Progress",
        "Overall Completion",
        overallCompletionRate + "%",
        "Total Topic Time",
        formatDuration(totalTopicTimeSpentSeconds),
      ],
      [],
      [
        "Type",
        "Session",
        "Module",
        "Title",
        "Attempts / Time",
        "Score",
        "Started",
        "Completed",
        "Status",
      ],
    ];

    const dataRows = [];

    sessions.forEach((session, sIdx) => {
      dataRows.push([
        "Session",
        session.title,
        "-",
        "-",
        "-",
        "-",
        session.startedAt ? formatDateTime(session.startedAt) : "-",
        session.completedAt ? formatDateTime(session.completedAt) : "-",
        `${session.isCompleted
          ? "Completed"
          : session.isAccessible
            ? "In Progress"
            : "Locked"
        }` +
        `${session.isAccessible
          ? ` (${session.completionPercentage
            ? session.completionPercentage + "%"
            : "-"
          })`
          : ""
        }`,
      ]);

      session.modules.forEach((module, mIdx) => {
        dataRows.push([
          "Module",
          session.title,
          module.title,
          "-",
          "-",
          "-",
          module.startedAt ? formatDateTime(module.startedAt) : "-",
          module.completedAt ? formatDateTime(module.completedAt) : "-",
          `${module.isCompleted
            ? "Completed"
            : module.isAccessible
              ? "In Progress"
              : "Locked"
          }` +
          `${module.isAccessible
            ? ` (${module.completionPercentage
              ? module.completionPercentage + "%"
              : "-"
            })`
            : ""
          }`,
        ]);

        module.topics.forEach((topic, tIdx) => {
          dataRows.push([
            "Topic",
            session.title,
            module.title,
            topic.title,
            formatDuration(topic.timeSpentSeconds),
            "-",
            topic.startedAt ? formatDateTime(topic.startedAt) : "-",
            topic.completedAt ? formatDateTime(topic.completedAt) : "-",
            topic.isCompleted
              ? "Completed"
              : topic.isAccessible
                ? "In Progress"
                : "Not Started",
          ]);
        });

        module.quizzes.forEach((quiz, qIdx) => {
          if (!quiz.attempts?.length) {
            dataRows.push([
              "Quiz",
              session.title,
              module.title,
              quiz.title,
              "Attempt: 0",
              quiz.isCompleted ? "100" : "-",
              "-",
              "-",
              quiz.isCompleted
                ? "Completed"
                : quiz.isAccessible
                  ? "Available"
                  : "Pending",
            ]);
          } else {
            quiz.attempts.forEach((a, aIdx) => {
              dataRows.push([
                "Quiz Attempt",
                session.title,
                module.title,
                quiz.title,
                a.triedAttempts !== null
                  ? `Attempt: ${a.triedAttempts}`
                  : "N/A",
                a.obtainedMarks != null && a.totalMarks != null
                  ? `${a.obtainedMarks}/${a.totalMarks}`
                  : "-",
                a.startedAt ? formatDateTime(a.startedAt) : "-",
                a.completedAt ? formatDateTime(a.completedAt) : "-",
                a.passFail === "passed" ? "Passed" : "Failed",
              ]);
            });
          }
        });

        module.assignments.forEach((assignment, aIdx) => {
          if (!assignment.attempts?.length) {
            dataRows.push([
              "Assignment",
              session.title,
              module.title,
              assignment.title,
              "Attempt: 0",
              assignment.isCompleted ? "100" : "-",
              "-",
              "-",
              assignment.isCompleted
                ? "Completed"
                : assignment.isAccessible
                  ? "Available"
                  : "Pending",
            ]);
          } else {
            assignment.attempts.forEach((att, attIdx) => {
              dataRows.push([
                "Assignment Attempt",
                session.title,
                module.title,
                assignment.title,
                att.triedAttempts != null
                  ? `Attempt: ${att.triedAttempts}`
                  : "N/A",
                att.score != null ? `${att.score}` : "-",
                att.startedAt ? formatDateTime(att.startedAt) : "-",
                att.completedAt ? formatDateTime(att.completedAt) : "-",
                att.passFail === "passed" ? "Passed" : "Failed",
              ]);
            });
          }
        });
      });
    });

    const sheetData = [...headerRows, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const colWidths = [];
    sheetData.forEach((r) =>
      r.forEach((c, i) => {
        const len = (c ? String(c).length : 0) + 2;
        if (!colWidths[i] || len > colWidths[i].wch)
          colWidths[i] = { wch: Math.min(len, 60) };
      })
    );
    ws["!cols"] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Progress");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const safeTitle = (course.title || "course")
      .replace(/[^a-z0-9-_]+/gi, "_")
      .toLowerCase();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeTitle}_progress_report.xlsx"`
    );
    return res.status(200).send(buf);
  } catch (err) {
    return next(err);
  }
};

exports.exportUserCourseProgressPdf = async (req, res, next) => {
  try {
    const { userId, courseHash } = req.params;

    // Fetch full user details
    const fullUser = await User.findOne({
      where: { id: userId },
      attributes: [
        "id",
        "full_name",
        "username",
        "email",
        "profile_image",
        "mobile_no",
        "location",
        "country_id",
        "state_id",
        "city_id"
      ]
    });

    if (!fullUser) {
      return res.status(404).json({ message: "User not found" });
    }


    if (!userId || !courseHash)
      return res.status(400).json({ message: "userId & courseHash required" });
    const { success, data, error } = await callProcedure(
      "getUserCourseProgress",
      [Number(userId), courseHash]
    );

    if (!success) return next(error || new Error("Failed to fetch progress"));
    const row = Array.isArray(data)
      ? Array.isArray(data[0])
        ? data[0][0]
        : data[0]
      : data;
    if (!row)
      return res.status(404).json({ message: "No progress data found" });

    let countryName = null;
    let stateName = null;
    let cityName = null;

    try {
      if (fullUser.country_id) {
        const country = await Country.findOne({
          where: { id: fullUser.country_id },
          attributes: ["name"],
          raw: true,
        });
        countryName = country?.name || null;
      }
    } catch (err) {
      console.error("Error fetching country:", err.message);
    }

    try {
      if (fullUser.state_id) {
        const state = await State.findOne({
          where: { id: fullUser.state_id },
          attributes: ["name"],
          raw: true,
        });
        stateName = state?.name || null;
      }
    } catch (err) {
      console.error("Error fetching state:", err.message);
    }

    try {
      if (fullUser.city_id) {
        const city = await City.findOne({
          where: { id: fullUser.city_id },
          attributes: ["name"],
          raw: true,
        });
        cityName = city?.name || null;
      }
    } catch (err) {
      console.error("Error fetching city:", err.message);
    }

    const progress = buildProgressFromProcedureRow(row);
    const {
      course,
      enrollment,
      sessions,
      overallCompletionRate,
      totalTopicTimeSpentSeconds,
    } = progress;

    const totalHours = minutesToHours(course.duration_minutes);
    const completedHours = secondsToHours(totalTopicTimeSpentSeconds);
    const remainingHours = (totalHours - completedHours).toFixed(2);

    // ==================== COUNTS ====================

    // --- SESSION COUNTS ---
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.isCompleted).length;
    const remainingSessions = totalSessions - completedSessions;

    // --- MODULE COUNTS ---
    let totalModules = 0;
    let completedModules = 0;

    sessions.forEach(s => {
      s.modules.forEach(m => {
        totalModules++;
        if (m.isCompleted) completedModules++;
      });
    });

    const remainingModules = totalModules - completedModules;

    // --- TOPIC COUNTS ---
    let totalTopics = 0;
    let completedTopics = 0;

    sessions.forEach(s => {
      s.modules.forEach(m => {
        m.topics.forEach(t => {
          totalTopics++;
          if (t.isCompleted) completedTopics++;
        });
      });
    });

    const remainingTopics = totalTopics - completedTopics;


    // Override the user with Full DB User
    const user = {
      ...progress.user,
      ...fullUser.dataValues,
      country_name: countryName,
      state_name: stateName,
      city_name: cityName,
    };

    function formatDateTime(dateStr) {
      const date = new Date(dateStr);

      const day = date.getDate();
      const month = date.toLocaleString("en-US", { month: "long" });
      const year = date.getFullYear();

      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${day} ${month} ${year} | ${hours}:${minutes}`;
    }

    const formatDuration = (seconds) => {
      if (!seconds) return "0s";
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return [h ? h + "h" : null, m ? m + "m" : null, s ? s + "s" : null]
        .filter(Boolean)
        .join(" ");
    };

    function secondsToHours(seconds) {
      return (seconds / 3600).toFixed(2); // 2 decimals
    }

    function minutesToHours(minutes) {
      return (minutes / 60).toFixed(2);
    }

    // Build rows similar to XLSX endpoint
    const bodyRows = [];
    sessions.forEach((session) => {
      bodyRows.push([
        "Session",
        session.title,
        "-",
        "-",
        "-",
        "-",
        session.startedAt ? formatDateTime(session.startedAt) : "-",
        session.completedAt ? formatDateTime(session.completedAt) : "-",
        `${session.isCompleted
          ? "Completed"
          : session.isAccessible
            ? "In Progress"
            : "Locked"
        }${session.isAccessible
          ? ` (${session.completionPercentage
            ? session.completionPercentage + "%"
            : "-"
          })`
          : ""
        }`,
      ]);
      session.modules.forEach((module) => {
        bodyRows.push([
          "Module",
          session.title,
          module.title,
          "-",
          "-",
          "-",
          module.startedAt ? formatDateTime(module.startedAt) : "-",
          module.completedAt ? formatDateTime(module.completedAt) : "-",
          `${module.isCompleted
            ? "Completed"
            : module.isAccessible
              ? "In Progress"
              : "Locked"
          }${module.isAccessible
            ? ` (${module.completionPercentage
              ? module.completionPercentage + "%"
              : "-"
            })`
            : ""
          }`,
        ]);
        module.topics.forEach((topic) => {
          bodyRows.push([
            "Topic",
            session.title,
            module.title,
            topic.title,
            formatDuration(topic.timeSpentSeconds),
            "-",
            topic.startedAt ? formatDateTime(topic.startedAt) : "-",
            topic.completedAt ? formatDateTime(topic.completedAt) : "-",
            topic.isCompleted
              ? "Completed"
              : topic.isAccessible
                ? "In Progress"
                : "Not Started",
          ]);
        });
        module.quizzes.forEach((quiz) => {
          if (!quiz.attempts?.length) {
            bodyRows.push([
              "Quiz",
              session.title,
              module.title,
              quiz.title,
              "Attempt: 0",
              quiz.isCompleted ? "100" : "-",
              "-",
              "-",
              quiz.isCompleted
                ? "Completed"
                : quiz.isAccessible
                  ? "Available"
                  : "Pending",
            ]);
          } else {
            quiz.attempts.forEach((a) => {
              bodyRows.push([
                "Quiz Attempt",
                session.title,
                module.title,
                quiz.title,
                a.triedAttempts !== null
                  ? `Attempt: ${a.triedAttempts}`
                  : "N/A",
                a.obtainedMarks != null && a.totalMarks != null
                  ? `${a.obtainedMarks}/${a.totalMarks}`
                  : "-",
                a.startedAt ? formatDateTime(a.startedAt) : "-",
                a.completedAt ? formatDateTime(a.completedAt) : "-",
                a.passFail === "passed" ? "Passed" : "Failed",
              ]);
            });
          }
        });
        module.assignments.forEach((assignment) => {
          if (!assignment.attempts?.length) {
            bodyRows.push([
              "Assignment",
              session.title,
              module.title,
              assignment.title,
              "Attempt: 0",
              assignment.isCompleted ? "100" : "-",
              "-",
              "-",
              assignment.isCompleted
                ? "Completed"
                : assignment.isAccessible
                  ? "Available"
                  : "Pending",
            ]);
          } else {
            assignment.attempts.forEach((att) => {
              bodyRows.push([
                "Assignment Attempt",
                session.title,
                module.title,
                assignment.title,
                att.triedAttempts != null
                  ? `Attempt: ${att.triedAttempts}`
                  : "N/A",
                att.score != null ? `${att.score}` : "-",
                att.startedAt ? formatDateTime(att.startedAt) : "-",
                att.completedAt ? formatDateTime(att.completedAt) : "-",
                att.passFail === "passed" ? "Passed" : "Failed",
              ]);
            });
          }
        });
      });
    });

    let logoBase64 = null;
    // try {
    //   const footerRow = await FooterSetting.findOne({
    //     order: [["id", "DESC"]], // last row wins
    //     raw: true,
    //   });
    //   if (footerRow?.logo) {
    //     const logoResp = await fetch(`http://localhost:8000${footerRow.logo}`);
    //     const logoBuf = await logoResp.arrayBuffer();
    //     logoBase64 = Buffer.from(logoBuf).toString("base64");
    //   }
    // } catch (e) {
    //   console.error("Could not load website logo:", e.message);
    // }

    try {
      const fileData = fs.readFileSync(logoPath);
      logoBase64 = fileData.toString("base64");
    } catch (e) {
      console.error("Static logo not found:", e.message);
    }

    /* ----------  WEBSITE LOGO  ---------- */

    let logoBase64partner = null;
    if (course.created_by_type == "partner") {
      try {
        const partnerdata = await Partner.findAll({
          where: { id: course.created_by },
          raw: true
        });

        if (partnerdata[0]?.logo) {
          const logoResp = await fetch(`http://localhost:8000${partnerdata[0].logo}`);
          const logoBuf = await logoResp.arrayBuffer();
          logoBase64partner = Buffer.from(logoBuf).toString("base64");
        }
      } catch (e) {
        console.error("Could not load website logo:", e.message);
      }
    }

    // -------------------- PROFESSIONAL LIGHT & FRIENDLY PDF UI START --------------------
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let cursorY = 0;
    const margin = 40;
    const contentWidth = pageWidth - (margin * 2);

    // Light & Friendly Color Palette
    const colors = {
      primary: [99, 102, 241],        // Soft indigo
      primaryLight: [224, 231, 255],  // Very light indigo
      success: [134, 239, 172],       // Light green
      successDark: [34, 197, 94],     // Medium green
      info: [147, 197, 253],          // Light blue
      infoDark: [59, 130, 246],       // Medium blue
      warning: [253, 224, 71],        // Light yellow
      warningDark: [234, 179, 8],     // Medium yellow
      accent: [216, 180, 254],        // Light purple
      background: [249, 250, 251],    // Very light gray
      white: [255, 255, 255],
      textDark: [31, 41, 55],
      textMedium: [75, 85, 99],
      textLight: [156, 163, 175],
      border: [243, 244, 246],
      yellowLight: [254, 249, 195],
      greenLight: [220, 252, 231]
    };

    // Helper: Check if new page needed
    const checkNewPage = (spaceNeeded = 100) => {
      if (cursorY + spaceNeeded > pageHeight - 60) {
        doc.addPage();
        cursorY = margin;
        return true;
      }
      return false;
    };

    // --- 1-row header:  logo (right)  +  title (left)  ---
    const rowY = margin + 25;    // common vertical position
    const logoH = 21.8;
    const logoW = 112;
    const gap = 8;               // space between the two logos

    // Rightmost logo
    const logoX1 = pageWidth - margin - logoW;

    // Second logo (to the left of the first)
    const logoX2 = logoX1 - logoW - gap;

    // Add partner logo (left)
    // if (logoBase64partner) {
    //   doc.addImage(
    //     `data:image/png;base64,${logoBase64partner}`,
    //     "PNG",
    //     logoX2,
    //     rowY,
    //     logoW,
    //     logoH
    //   );
    // }

    // Add main logo (right)
    if (logoBase64) {
      doc.addImage(
        `data:image/png;base64,${logoBase64}`,
        "PNG",
        logoX1,
        rowY,
        logoW,
        logoH
      );
    }

    // text baseline is vertically centred inside the 40 px high logo
    const textY = rowY + logoH / 2 + 10; // +10 to optically centre (tweak if needed)

    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.setTextColor(...colors.primary);
    doc.text("Course Progress", margin, textY);

    // --- everything that used to start at cursorY = 150 now starts lower ---
    cursorY = rowY + logoH + 40; // leave a gap under the row

    // User Card - Light & Friendly + Course Progress Circle
    doc.setFillColor(...colors.white);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(1);
    doc.roundedRect(margin, cursorY, contentWidth, 150, 12, 12, 'FD');

    // Profile photo OR initial bubble
    if (user.profile_image) {
      try {

        const imgBuf = await fetch(`http://localhost:8000${user.profile_image}`)
        const base64Img = await imgBuf.arrayBuffer();
        const logoBase64Profile = Buffer.from(base64Img).toString("base64");

        if (logoBase64Profile) {
          doc.addImage(
            `data:image/png;base64,${logoBase64Profile}`,
            "JPEG",
            margin + 18,
            cursorY + 18,
            55,
            55
          );
        }
      } catch (e) {
        console.error("Profile image load error", e);
      }
    } else {
      // Initial bubble
      doc.setFillColor(...colors.primaryLight);
      doc.circle(margin + 45, cursorY + 45, 28, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(...colors.primary);
      const initial = (user.full_name || "U").charAt(0).toUpperCase();
      doc.text(initial, margin + 38, cursorY + 53);
    }

    // User text info (left block)

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...colors.textMedium);

    const col1X = margin + 90;
    const col2X = margin + 270;
    let row1Y = cursorY + 30;
    const rowGap = 35; // because each cell has 2 lines

    // Helper → Label on line 1, Value on line 2
    function drawTwoLine(label, value, x, y, valueMaxWidth = 200) {
      // Label (line 1)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...colors.textDark);
      doc.text(label, x, y);

      // Value (line 2)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...colors.textMedium);

      const wrappedValue = doc.splitTextToSize(value || "-", valueMaxWidth);
      doc.text(wrappedValue, x, y + 12);
    }

    /* -----------------------------------
       ROW 1 → Name + Email
    -------------------------------------*/
    drawTwoLine("Name :", user.full_name, col1X, row1Y);
    drawTwoLine("Email :", user.email, col2X, row1Y);

    /* -----------------------------------
       ROW 2 → Mobile + Location
    -------------------------------------*/
    row1Y += rowGap;
    drawTwoLine("Mobile :", user.mobile_no, col1X, row1Y);

    const locationString = [
      user.city_name,
      user.state_name,
      user.country_name
    ].filter(Boolean).join(", ");

    drawTwoLine("Location :", locationString, col2X, row1Y);

    /* -----------------------------------
       ROW 3 → Course + Enrolled
    -------------------------------------*/
    row1Y += rowGap + 10;
    drawTwoLine("Course:", course.title, col1X, row1Y, 170);
    drawTwoLine("Enrolled:", formatDateTime(enrollment.enrollment_date), col2X, row1Y);

    // -------- COURSE PROGRESS CIRCLE (RIGHT SIDE) --------
    const cpX = margin + contentWidth - 45; // right side position
    const cpY = cursorY + 50;
    const cpRadius = 24;

    // Background Circle
    doc.setFillColor(255, 255, 255);
    doc.circle(cpX, cpY, cpRadius, 'F');

    // Progress Arc
    // --- THIN PROGRESS CIRCLE WITH BORDER --- //
    const totalAngle = (overallCompletionRate / 100) * 360;
    const start = -90;

    // Draw thin border circle
    doc.setLineWidth(4);
    doc.setDrawColor(200, 200, 200);
    doc.circle(cpX, cpY, cpRadius, 'S');

    // Thin progress arc
    if (totalAngle > 0) {
      doc.setLineWidth(4);                 // ⬅ thinner arc thickness
      doc.setDrawColor(...colors.successDark);

      const end = start + totalAngle;

      for (let ang = start; ang < end; ang += 3) {
        const next = Math.min(ang + 3, end);

        const x1 = cpX + cpRadius * Math.cos((ang * Math.PI) / 180);
        const y1 = cpY + cpRadius * Math.sin((ang * Math.PI) / 180);
        const x2 = cpX + cpRadius * Math.cos((next * Math.PI) / 180);
        const y2 = cpY + cpRadius * Math.sin((next * Math.PI) / 180);

        doc.line(x1, y1, x2, y2);
      }
    }

    // Inner white circle
    doc.setFillColor(255, 255, 255);
    doc.circle(cpX, cpY, cpRadius - 5, 'F');

    // Course % Text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...colors.textDark);
    const cpt = `${overallCompletionRate}% `;
    const w = doc.getTextWidth(cpt);
    doc.text(cpt, (cpX - w / 2) + 3, cpY + 5);

    // ----- TITLE ABOVE PROGRESS BLOCK -----
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...colors.textDark);
    doc.text("Course Summary : ", margin, cursorY + 190);  // adjust vertical position

    // ---------------- COURSE PROGRESS SUMMARY BLOCK ----------------
    cursorY = cursorY + 200;
    checkNewPage(100);

    // Outer Block Border (white background behind it)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...colors.border);

    // Calculate column positions
    const colWidth = contentWidth / 3;
    const boxY = cursorY + 30;

    // ---------------------- COLUMN BACKGROUNDS ----------------------
    doc.setLineWidth(0);

    // Column 1 (Light Blue)
    doc.setFillColor(...colors.primaryLight);
    doc.rect(margin, cursorY, colWidth, 70, "F");

    // Column 2 (Light Green)
    doc.setFillColor(...colors.greenLight);
    doc.rect(margin + colWidth, cursorY, colWidth, 70, "F");

    // Column 3 (Light Yellow)
    doc.setFillColor(...colors.yellowLight);
    doc.rect(margin + colWidth * 2, cursorY, colWidth, 70, "F");

    // ---------------------- VERTICAL LINES ----------------------
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(1);
    doc.line(margin + colWidth, cursorY + 10, margin + colWidth, cursorY + 60);
    doc.line(margin + colWidth * 2, cursorY + 10, margin + colWidth * 2, cursorY + 60);

    // ---------------------- CENTERED TEXT FUNCTION ----------------------
    function drawCenter(label, value, x, textColor) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...colors.textDark);
      doc.text(label, x, boxY, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(13);
      doc.setTextColor(...textColor);
      doc.text(String(value), x, boxY + 18, { align: "center" });
    }

    // ---------------------- APPLY TEXT COLORS PER COLUMN ----------------------

    // Column 1 → Dark Blue Text
    drawCenter("Total Hours", `${totalHours} hrs`, margin + colWidth / 2, colors.infoDark);

    // Column 2 → Dark Green Text
    drawCenter("Completed Hours", `${completedHours} hrs`, margin + colWidth + colWidth / 2, colors.successDark);

    // Column 3 → Dark Yellow Text
    drawCenter("Remaining Hours", `${remainingHours} hrs`, margin + colWidth * 2 + colWidth / 2, colors.warningDark);


    // ----- TITLE -----
    cursorY += 70;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...colors.textDark);
    doc.text("Session Summary :", margin, cursorY + 30);

    // ----- BLOCK -----
    cursorY += 40;
    doc.setFillColor(...colors.white);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(1);
    doc.roundedRect(margin, cursorY, contentWidth, 70, 10, 10, "FD");

    const boxY1 = cursorY + 30;
    const colWidth1 = contentWidth / 3;

    // ---------------------- COLUMN BACKGROUNDS ----------------------
    doc.setLineWidth(0);

    // Column 1 (Light Blue)
    doc.setFillColor(...colors.primaryLight);
    doc.rect(margin, cursorY, colWidth, 70, "F");

    // Column 2 (Light Green)
    doc.setFillColor(...colors.greenLight);
    doc.rect(margin + colWidth, cursorY, colWidth, 70, "F");

    // Column 3 (Light Yellow)
    doc.setFillColor(...colors.yellowLight);
    doc.rect(margin + colWidth * 2, cursorY, colWidth, 70, "F");

    // Vertical lines
    doc.line(margin + colWidth1, cursorY + 10, margin + colWidth1, cursorY + 60);
    doc.line(margin + colWidth1 * 2, cursorY + 10, margin + colWidth1 * 2, cursorY + 60);

    // Helper
    function drawCenterBlock(label, value, x, y, color) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...colors.textDark);
      doc.text(label, x, y, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(13);
      doc.setTextColor(...color);
      doc.text(String(value), x, y + 18, { align: "center" });
    }

    drawCenterBlock("Total Sessions", totalSessions, margin + colWidth1 / 2, boxY1, colors.infoDark);
    drawCenterBlock("Completed", completedSessions, margin + colWidth1 + colWidth1 / 2, boxY1, colors.successDark);
    drawCenterBlock("Remaining", remainingSessions, margin + colWidth1 * 2 + colWidth1 / 2, boxY1, colors.warningDark);

    cursorY += 70;

    // TITLE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...colors.textDark);
    doc.text("Module Summary :", margin, cursorY + 30);

    // BLOCK
    cursorY += 40;
    doc.setFillColor(...colors.white);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(1);
    doc.roundedRect(margin, cursorY, contentWidth, 70, 10, 10, "FD");

    const boxY2 = cursorY + 30;
    const colWidth2 = contentWidth / 3;

    // ---------------------- COLUMN BACKGROUNDS ----------------------
    doc.setLineWidth(0);

    // Column 1 (Light Blue)
    doc.setFillColor(...colors.primaryLight);
    doc.rect(margin, cursorY, colWidth, 70, "F");

    // Column 2 (Light Green)
    doc.setFillColor(...colors.greenLight);
    doc.rect(margin + colWidth, cursorY, colWidth, 70, "F");

    // Column 3 (Light Yellow)
    doc.setFillColor(...colors.yellowLight);
    doc.rect(margin + colWidth * 2, cursorY, colWidth, 70, "F");

    // Vertical lines
    doc.line(margin + colWidth2, cursorY + 10, margin + colWidth2, cursorY + 60);
    doc.line(margin + colWidth2 * 2, cursorY + 10, margin + colWidth2 * 2, cursorY + 60);

    drawCenterBlock("Total Modules", totalModules, margin + colWidth2 / 2, boxY2, colors.infoDark);
    drawCenterBlock("Completed", completedModules, margin + colWidth2 + colWidth2 / 2, boxY2, colors.successDark);
    drawCenterBlock("Remaining", remainingModules, margin + colWidth2 * 2 + colWidth2 / 2, boxY2, colors.warningDark);

    cursorY += 70;

    // TITLE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...colors.textDark);
    doc.text("Topic Summary :", margin, cursorY + 30);

    // ---------------------- COLUMN BACKGROUNDS ----------------------
    doc.setLineWidth(0);

    // BLOCK
    cursorY += 40;
    doc.setFillColor(...colors.white);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(1);
    doc.roundedRect(margin, cursorY, contentWidth, 70, 10, 10, "FD");

    const boxY3 = cursorY + 30;
    const colWidth3 = contentWidth / 3;

    // Column 1 (Light Blue)
    doc.setFillColor(...colors.primaryLight);
    doc.rect(margin, cursorY, colWidth, 70, "F");

    // Column 2 (Light Green)
    doc.setFillColor(...colors.greenLight);
    doc.rect(margin + colWidth, cursorY, colWidth, 70, "F");

    // Column 3 (Light Yellow)
    doc.setFillColor(...colors.yellowLight);
    doc.rect(margin + colWidth * 2, cursorY, colWidth, 70, "F");

    doc.line(margin + colWidth3, cursorY + 10, margin + colWidth3, cursorY + 60);
    doc.line(margin + colWidth3 * 2, cursorY + 10, margin + colWidth3 * 2, cursorY + 60);

    drawCenterBlock("Total Topics", totalTopics, margin + colWidth3 / 2, boxY3, colors.infoDark);
    drawCenterBlock("Completed", completedTopics, margin + colWidth3 + colWidth3 / 2, boxY3, colors.successDark);
    drawCenterBlock("Remaining", remainingTopics, margin + colWidth3 * 2 + colWidth3 / 2, boxY3, colors.warningDark);

    cursorY += 90;

    // =============== SESSION DETAILS PAGES ===============
    doc.addPage();
    cursorY = margin + 10;

    sessions.forEach((session, sessionIdx) => {
      if (sessionIdx > 0) {
        doc.addPage();
        cursorY = margin; // Reset position
      }

      // Session Badge with circular progress
      doc.setFillColor(...colors.primaryLight);
      doc.roundedRect(margin, cursorY, contentWidth, 75, 10, 10, 'F');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...colors.primary);
      doc.text(`Session ${sessionIdx + 1} `, margin + 20, cursorY + 25);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...colors.textDark);
      doc.text(session.title, margin + 20, cursorY + 45);

      // --- Started At under session title ---
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...colors.textMedium);

      // Format: 18 November 2025 | 12:33
      const startedFormatted = formatDateTime(session.startedAt);
      const startedText = `Started at: ${startedFormatted}`;

      doc.text(startedText, margin + 20, cursorY + 60);

      // Circular progress on the right
      const circleX = pageWidth - margin - 40;
      const circleY = cursorY + 40;
      const radius = 22;

      // Background circle
      doc.setFillColor(255, 255, 255);
      doc.circle(circleX, circleY, radius, 'F');

      // Progress arc
      const progressAngle = (session.completionPercentage / 100) * 360;
      if (progressAngle > 0) {
        doc.setFillColor(...colors.successDark);
        doc.setLineWidth(2);
        doc.setDrawColor(...colors.successDark);

        // Draw arc segments to fill the circle
        const startAngle = -90; // Start from top
        const endAngle = startAngle + progressAngle;

        for (let angle = startAngle; angle < endAngle; angle += 5) {
          const nextAngle = Math.min(angle + 5, endAngle);
          const x1 = circleX + radius * Math.cos((angle * Math.PI) / 180);
          const y1 = circleY + radius * Math.sin((angle * Math.PI) / 180);
          const x2 = circleX + radius * Math.cos((nextAngle * Math.PI) / 180);
          const y2 = circleY + radius * Math.sin((nextAngle * Math.PI) / 180);

          doc.line(circleX, circleY, x1, y1);
          doc.line(x1, y1, x2, y2);
          doc.line(x2, y2, circleX, circleY);
        }
      }

      // Inner white circle for percentage text
      doc.setFillColor(255, 255, 255);
      doc.circle(circleX, circleY, radius - 4, 'F');

      // Percentage text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...colors.textDark);
      const percentText = `${session.completionPercentage}% `;
      const textWidth = doc.getTextWidth(percentText);
      doc.text(percentText, circleX - textWidth / 2, circleY + 3.5);

      cursorY += 100;  // because one more line was added

      // Session info pills
      checkNewPage(70);

      // Modules
      session.modules.forEach((module, moduleIdx) => {
        checkNewPage(150);

        // Module header with circular progress
        doc.setFillColor(...colors.background);
        doc.roundedRect(margin + 15, cursorY, contentWidth - 30, 45, 8, 8, 'F');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...colors.textDark);
        doc.text(`Module ${moduleIdx + 1}: ${module.title} `, margin + 25, cursorY + 28);

        // Circular progress on the right for module
        const moduleCircleX = pageWidth - margin - 35;
        const moduleCircleY = cursorY + 22;
        const moduleRadius = 18;

        // Background circle
        doc.setFillColor(255, 255, 255);
        doc.circle(moduleCircleX, moduleCircleY, moduleRadius, 'F');

        // Progress arc for module
        const moduleProgressAngle = (module.completionPercentage / 100) * 360;
        if (moduleProgressAngle > 0) {
          doc.setFillColor(...colors.infoDark);
          doc.setLineWidth(2);
          doc.setDrawColor(...colors.infoDark);

          const startAngle = -90;
          const endAngle = startAngle + moduleProgressAngle;

          for (let angle = startAngle; angle < endAngle; angle += 5) {
            const nextAngle = Math.min(angle + 5, endAngle);
            const x1 = moduleCircleX + moduleRadius * Math.cos((angle * Math.PI) / 180);
            const y1 = moduleCircleY + moduleRadius * Math.sin((angle * Math.PI) / 180);
            const x2 = moduleCircleX + moduleRadius * Math.cos((nextAngle * Math.PI) / 180);
            const y2 = moduleCircleY + moduleRadius * Math.sin((nextAngle * Math.PI) / 180);

            doc.line(moduleCircleX, moduleCircleY, x1, y1);
            doc.line(x1, y1, x2, y2);
            doc.line(x2, y2, moduleCircleX, moduleCircleY);
          }
        }

        // Inner white circle
        doc.setFillColor(255, 255, 255);
        doc.circle(moduleCircleX, moduleCircleY, moduleRadius - 3, 'F');

        // Percentage text
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...colors.textDark);
        const modulePercentText = `${module.completionPercentage}% `;
        const moduleTextWidth = doc.getTextWidth(modulePercentText);
        doc.text(modulePercentText, moduleCircleX - moduleTextWidth / 2, moduleCircleY + 3);

        cursorY += 60;

        // Topics
        if (module.topics && module.topics.length > 0) {
          checkNewPage(80);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(...colors.textMedium);
          doc.text("Topics", margin + 25, cursorY);
          cursorY += 15;

          doc.autoTable({
            startY: cursorY,
            head: [["Topic", "Time Spent", "Status"]],
            body: module.topics.map((t) => [
              t.title,
              formatDuration(t.timeSpentSeconds),
              t.isCompleted ? "Done" : t.isAccessible ? "In Progress" : "Locked",
            ]),
            theme: "plain",
            headStyles: {
              fillColor: colors.background,
              textColor: colors.textMedium,
              fontSize: 9,
              fontStyle: "bold",
              cellPadding: { top: 8, bottom: 8, left: 10, right: 10 },
            },
            bodyStyles: {
              fontSize: 9,
              cellPadding: { top: 10, bottom: 10, left: 10, right: 10 },
              textColor: colors.textDark,
            },
            alternateRowStyles: {
              fillColor: [255, 255, 255],
            },
            styles: {
              lineColor: colors.border,
              lineWidth: 0.5,
            },
            margin: { left: margin + 25, right: margin + 25 },
          });

          cursorY = doc.lastAutoTable.finalY + 20;
        }

        // Quizzes
        if (module.quizzes && module.quizzes.length > 0) {
          checkNewPage(80);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(...colors.textMedium);
          doc.text("Quizzes", margin + 25, cursorY);
          cursorY += 15;

          doc.autoTable({
            startY: cursorY,
            head: [["Quiz Title", "Attempts", "Score", "Status"]],
            body: module.quizzes.map((q) => [
              q.title,
              q.attempts?.length || 0,
              q.isCompleted ? "100%" : "-",
              q.isCompleted ? "Completed" : q.isAccessible ? "Available" : "Locked",
            ]),
            theme: "plain",
            headStyles: {
              fillColor: colors.warning,
              textColor: colors.textDark,
              fontSize: 9,
              fontStyle: "bold",
              cellPadding: { top: 8, bottom: 8, left: 10, right: 10 },
            },
            bodyStyles: {
              fontSize: 9,
              cellPadding: { top: 10, bottom: 10, left: 10, right: 10 },
              textColor: colors.textDark,
            },
            alternateRowStyles: {
              fillColor: [255, 255, 255],
            },
            styles: {
              lineColor: colors.border,
              lineWidth: 0.5,
            },
            margin: { left: margin + 25, right: margin + 25 },
          });

          cursorY = doc.lastAutoTable.finalY + 20;
        }

        // Assignments
        if (module.assignments && module.assignments.length > 0) {
          checkNewPage(80);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(...colors.textMedium);
          doc.text("Assignments", margin + 25, cursorY);
          cursorY += 15;

          doc.autoTable({
            startY: cursorY,
            head: [["Assignment", "Attempts", "Score", "Status"]],
            body: module.assignments.map((a) => [
              a.title,
              a.attempts?.length || 0,
              a.score ?? "-",
              a.isCompleted ? "Submitted" : a.isAccessible ? "Available" : "Locked",
            ]),
            theme: "plain",
            headStyles: {
              fillColor: colors.accent,
              textColor: colors.textDark,
              fontSize: 9,
              fontStyle: "bold",
              cellPadding: { top: 8, bottom: 8, left: 10, right: 10 },
            },
            bodyStyles: {
              fontSize: 9,
              cellPadding: { top: 10, bottom: 10, left: 10, right: 10 },
              textColor: colors.textDark,
            },
            alternateRowStyles: {
              fillColor: [255, 255, 255],
            },
            styles: {
              lineColor: colors.border,
              lineWidth: 0.5,
            },
            margin: { left: margin + 25, right: margin + 25 },
          });

          cursorY = doc.lastAutoTable.finalY + 25;
        }
      });

      cursorY += 15;
    });

    // Add page numbers
    const totalPages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Footer style
      doc.setFontSize(8);
      doc.setTextColor(...colors.textLight);

      // --- Horizontal line above footer ---
      doc.setDrawColor(...colors.border);   // or use your preferred color
      doc.setLineWidth(1);
      doc.line(
        margin,
        pageHeight - 30,     // position of line (a bit above footer text)
        pageWidth - margin,
        pageHeight - 30
      );

      // LEFT SIDE TEXT
      doc.text("Powered by: Queekies", margin, pageHeight - 20);

      // RIGHT SIDE PAGE NUMBER
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 70, pageHeight - 20);
    }



    // SEND BUFFER
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename = "progress_${user.username}.pdf"`
    );
    return res.status(200).send(pdfBuffer);
    // -------------------- PROFESSIONAL LIGHT & FRIENDLY PDF UI END --------------------

  } catch (err) {
    return next(err);
  }
};