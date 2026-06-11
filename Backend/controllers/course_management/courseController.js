const { where } = require("sequelize");
const axios = require("axios");
const Course = require("../../models/course_management/course");
const {
  generatePublicHash,
} = require("../../utils/course_management/generateHash");
const { Op } = require("sequelize");
const { hash } = require("bcryptjs");
const {
  getBestMatchingCourses,
  chatbotResponse,
} = require("../../utils/textSimilarity");
const { CourseCategory } = require("../../models/masters/courseCatagory");
const {
  CourseVersion,
} = require("../../models/partner/approve_request_version/courseVersion");
const { convert } = require("html-to-text");
const { callProcedure } = require("../../utils/procedure/callProcedure");
const Role = require("../../models/auth/RoleAndPermission/Role");
const Validation = require("../../validations");
const { enrollments } = require("../../models/enrollment_management/enrollment_management");
const Challenge = require("../../models/challenges/challenge_quest/challenges");
const ChallengeCategory = require("../../models/masters/challengeCategory");
const fs = require("fs");
const path = require("path");
const { callProcedureChallenge } = require("../../utils/procedure/callProcedureChallenge");
const Session = require("../../models/course_management/session");
const Module = require("../../models/course_management/module");
const Topic = require("../../models/course_management/topic");
const TopicContent = require("../../models/course_management/topic_content");
const { Material } = require("../../models/content_management/material");
const CourseFAQ = require("../../models/course_management/courseFAQs");
const CourseFAQOption = require("../../models/course_management/courseFAQOption");
const { MultiSlide } = require("../../models/content_management/multi_slide");
const TopicTag = require("../../models/content_management/tags/tagsTable");
const { Quizzes } = require("../../models/content_management/quizzesModel");
const Assignment = require("../../models/content_management/assignmentsModel");
const { GeneralMaterial } = require("../../models/content_management/genral");
const { Accordion } = require("../../models/content_management/accordian");

// Function to generate embeddings
async function getEmbedding(text) {
  const response = await axios.post("http://0.0.0.0:8000/embed/", { text });
  return response.data.embedding;
}

// Safely delete a previously stored preview media file (image/video)
async function deletePreviewFileIfExists(relativeWebPath) {
  try {
    if (!relativeWebPath || typeof relativeWebPath !== "string") return;
    const safePrefixes = ["/course/preview_image/", "/course/preview_video/"];
    if (!safePrefixes.some((p) => relativeWebPath.startsWith(p))) return;
    // Build absolute path under Backend/uploads
    const uploadsRoot = path.join(__dirname, "../../uploads");
    const normalized = relativeWebPath.replace(/^\//, ""); // remove leading slash
    const absolutePath = path.join(uploadsRoot, normalized);
    await fs.promises.unlink(absolutePath).catch(() => { }); // ignore if not exists
  } catch (_) {
    // swallow errors – cleanup best-effort only
  }
}

const aiChatBot = async (req, res, next) => {
  try {
    const { userQuery } = req.body; // Get user input

    if (!userQuery) {
      return res.status(400).json({ message: "User input is required" });
    }

    // Get chatbot response
    const response = await chatbotResponse(userQuery);

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// // Admin Approve/Reject Course
// const adminApproveRejectCourse = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const { action } = req.body; // action can be "approve" or "reject"
//     const status = action === "approve" ? "approved" : "rejected";

//     // Find the course and its latest version
//     const course = await Course.findByPk(id);
//     const latestVersion = await CourseVersion.findOne({
//       where: { course_id: id },
//       order: [["version", "DESC"]],
//     });

//     if (!course || !latestVersion) {
//       return res
//         .status(404)
//         .json({ message: "Course or CourseVersion not found" });
//     }

//     // Update the status in both tables
//     await course.update({ status });
//     await latestVersion.update({ status });

//     res.status(200).json({ message: `Course ${action}d successfully` });
//   } catch (error) {
//     next(error);
//   }
// };

// -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------

// Procedure to Create courses

const createCourse = async (req, res, next) => {
  try {
    const usrId = req.user.id;
    const role = req.user.role;

    let status;

    const {
      title,
      description,
      category_id,
      price,
      discount,
      duration_minutes,
      expiry_days,
      what_you_will_learn,
      is_points_enrollable = false,
      points_to_enroll,
      meta_title,
      meta_keyword,
      meta_description,
      seo_image_alt,
      seo_canonical,
      og_title,
      og_description,
      og_image_alt,
      prerequisites,
      hashtags,
      min_access_minutes,
      max_access_minutes,
      is_points_rewarded = false,
      points_rewarded,
      is_points_rewarded_on_completion,
      points_rewarded_on_completion,
      is_copy_paste_allowed,
      is_course_trending,
      skill_development
    } = req.body;

    Validation.isString(title, { min: 1, max: 255 }, "Course title is required and must be a valid string.");
    Validation.isInteger(category_id, "Category ID must be a valid integer.");
    Validation.isDecimal(price, { min: 0 }, "Price must be a valid positive decimal.");
    Validation.isInteger(expiry_days, "Expiry days must be a valid integer.");

    // if (is_points_enrollable) {
    //   Validation.isNumber(points_to_enroll, { min: 1 }, "Invalid Points To Enroll");
    // }

    // if (is_points_rewarded) {
    //   Validation.isNumber(points_rewarded, { min: 1 }, "Invalid Points To Reward");
    // }

    if (description) {
      Validation.isString(description, { min: 10, max: 1024 }, "Description must be a valid string.");
    }
    if (discount) {
      Validation.isInteger(discount, "Discount must be a valid integer.");
    }
    if (duration_minutes) {
      Validation.isInteger(duration_minutes, "Duration must be a valid integer in minutes.");
    }
    if (min_access_minutes) {
      Validation.isDecimal(min_access_minutes, "Min access minutes must be a valid number.");
    }
    if (max_access_minutes) {
      Validation.isDecimal(max_access_minutes, "Max access minutes must be a valid number.");
    }
    if (what_you_will_learn) {
      Validation.isArray(JSON.parse(what_you_will_learn), { min: 1 }, "What you will learn must be an array.");
    }
    if (prerequisites) {
      Validation.isArray(JSON.parse(prerequisites), {}, "Prerequisites must be an array.");
    }
    if (hashtags) {
      Validation.isArray(JSON.parse(hashtags), {}, "Hashtags must be an array.");
    }
    if (skill_development) {
      Validation.isArray(JSON.parse(skill_development), {}, "Skill development must be an array.");
    }

    // Check for required fields
    if (!title || !category_id || !price || !expiry_days) {
      return res.status(400).json({
        message: "Title, Category ID, Price, and Expiry Days are required.",
      });
    }

    // Set default value for discount if it is not provided
    const discountValue = discount !== undefined && discount !== null && discount !== '' ? discount : 0;

    status = "draft";

    // ❗️ Validate to ensure no negative values
    if (
      (price && price < 0) ||
      (discountValue < 0) ||
      (duration_minutes && duration_minutes < 0) ||
      (expiry_days && expiry_days < 0) ||
      (min_access_minutes && min_access_minutes < 0) ||
      (max_access_minutes && max_access_minutes < 0)
    ) {
      return res.status(400).json({
        error:
          "Negative values are not allowed for price, discount, duration, or expiry days.",
      });
    }

    // Validate min_access_hours is less than or equal to max_access_hours
    if (
      min_access_minutes &&
      max_access_minutes &&
      parseFloat(min_access_minutes) > parseFloat(max_access_minutes)
    ) {
      return res.status(400).json({
        error: "min_access_minutes must be less than or equal to max_access_minutes",
      });
    }
    // Convert stringified JSON input to actual arrays (if needed)
    const parsedWhatYouWillLearn = what_you_will_learn
      ? JSON.parse(what_you_will_learn)
      : [];
    const parsedPrerequisites = prerequisites ? JSON.parse(prerequisites) : [];
    const parsedHashtags = hashtags ? JSON.parse(hashtags) : [];
    const parsedSkillDevelopment = skill_development ? JSON.parse(skill_development) : [];
    const thumbnail = req.files?.courseThumbnail?.[0]?.filename
      ? "/course/thumbnail/" + req.files.courseThumbnail[0].filename
      : req.body.thumbnail || null;
    // Accept Course Detail Image/Video via the same field name `coursePreviewVideo`
    // Decide stored path prefix based on uploaded file type (image vs video)
    let preview_video = [];
    if (req.body.preview_video) {
      try {
        const parsed = JSON.parse(req.body.preview_video);
        preview_video = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        preview_video = Array.isArray(req.body.preview_video) ? req.body.preview_video : [req.body.preview_video];
      }
    }
    if (req.files && req.files.coursePreviewVideo) {
      req.files.coursePreviewVideo.forEach(file => {
        if (file.mimetype && file.mimetype.startsWith("image/")) {
          preview_video.push("/course/preview_image/" + file.filename);
        } else {
          preview_video.push("/course/preview_video/" + file.filename);
        }
      });
    }

    if (!thumbnail || preview_video.length === 0) {
      return res.status(400).json({
        message: "Thumbnail and Preview Video required.",
      });
    }

    let seo_image = req.files?.courseSEOImage?.[0]?.filename ? "/course/seo/" + req.files?.courseSEOImage[0].filename : req.body.seo_image || null;
    let og_image = req.files?.courseOGImage?.[0]?.filename ? "/course/og/" + req.files?.courseOGImage[0].filename : req.body.og_image || null;

    const category = await CourseCategory.findByPk(category_id);
    const categoryName = category?.category || "Unknown";

    const plainDescription = description
      ? convert(description, { wordwrap: false })
      : "";

    const courseText = `passage: ${title}. ${plainDescription}. What you will learn: ${parsedWhatYouWillLearn.join(
      ". "
    )}. Hashtags: ${parsedHashtags.join(", ")}. Category: ${categoryName}`;

    // const embedding = await getEmbedding(courseText); // returns array or object

    // Call the stored procedure with minutes instead of hours
    const { success, data, error } = await callProcedure(
      "createCourseProcedure",
      [
        title.trim(),
        description || null,
        category_id,
        price,
        discountValue || null, // Use the discountValue here
        duration_minutes || null,
        expiry_days,
        JSON.stringify(parsedWhatYouWillLearn),
        is_points_enrollable || false,
        points_to_enroll || null,
        is_points_rewarded || false,
        points_rewarded || null,
        is_points_rewarded_on_completion || false,
        points_rewarded_on_completion || null,
        is_copy_paste_allowed || false,
        is_course_trending || false,
        meta_title || null,
        meta_keyword || null,
        meta_description || null,
        seo_image || null,
        seo_image_alt || null,
        seo_canonical || null,
        og_title || null,
        og_description || null,
        og_image || null,
        og_image_alt || null,
        JSON.stringify(parsedPrerequisites),
        JSON.stringify(parsedHashtags),
        JSON.stringify(parsedSkillDevelopment),
        status || "draft",
        thumbnail,
        preview_video.length > 0 ? JSON.stringify(preview_video) : null,
        min_access_minutes || null,
        max_access_minutes || null,
        null, // to store generated by id used in Course Generation
        usrId,
        usrId,
        role,
        role,
        // JSON.stringify(embedding),
      ]
    );

    if (!success) {
      return next(error);
    }

    res.status(201).json({ success: true, course: data });
  } catch (error) {
    next(error);
  }
};

const getAllCoursesForAdmin = async (req, res, next) => {
  try {

    const usrId = req.user?.id || null;
    const role = req.user?.role || null;

    const {
      creatorType = "all",
      createdById,
      search_term = "",
      createdFrom,
      createdTo,
      limit = "all",
      offset = "0",
    } = req.query;

    /* ---------- VALIDATION ---------- */
    if (limit !== "all" && limit !== "ALL") {
      Validation.isInteger(limit, "Limit must be a positive integer or 'all'.");
    }

    Validation.isInteger(offset, "Offset must be a non-negative integer.");
    if (search_term) Validation.isString(search_term, { min: 1, max: 255 });
    /* --------------------------------- */

    const parsedLimit = limit === "all" ? "all" : Number(limit);
    const parsedOffset = Number(offset);

    let result;

    // if (creatorType && role === 'admin' && creatorType !== 'all') {
    //   result = await callProcedure("getFilteredCourses", [null, creatorType]);
    // } else if (usrId !== null && role !== null) {
    result = await callProcedureChallenge("getAllCoursesForAdmin", [
      usrId,
      role,
      creatorType === "all" ? null : creatorType,
      createdById === "all" ? null : createdById,
      search_term,
      createdFrom || null,
      createdTo || null,
      limit === "all" ? 0 : parsedLimit,
      parsedOffset,
      limit === "all" || false
    ]);
    // } else {
    //   result = await callProcedure("getAllCourses", [
    //     usrId,
    //     role,
    //   ]);
    // }

    const { success, data, error } = result

    if (!success) {
      return next(error);
      // return res.status(400).json({ error });
    }

    res.status(200).json({ totalCount: data[0][0].total_count, data: Object.values(data[1]) }); // data[0] is the actual result set
  } catch (error) {
    next(error);
  }
};

const getAllCourses = async (req, res, next) => {
  try {
    // Get query parameters for filtering
    const { role, userId, creatorType, searchTerm = '', categoryId = null, limit = "all", offset = 0 } = req.query;

    const parsedLimit = limit === "all" ? "all" : Number(limit);
    const parsedOffset = Number(offset);

    // If no filters are applied, get all courses
    if (!role && !userId && !creatorType) {
      const { success, data, error } = await callProcedureChallenge("getAllCourses", [
        searchTerm,
        categoryId,
        limit === "all" ? 0 : parsedLimit,
        parsedOffset,
        limit === "all" || false
      ]);

      if (!success) {
        return next(error);
      }

      return res.status(200).json({ totalCount: data[0][0].total_count, data: Object.values(data[1]) }); // data[0] is the actual result set
    }

    // If filters are applied, customize the procedure call
    let procedureParams = [];

    if (role === 'partner' && userId) {
      // Partner should only see their own courses
      procedureParams = [userId, 'partner'];
    } else if (creatorType === 'admin') {
      // Admin filtered courses by admin
      procedureParams = [null, 'admin'];
    } else if (creatorType === 'partner') {
      // Admin filtered courses by partner
      procedureParams = [null, 'partner'];
    } else {
      // Default case - get all courses
      const { success, data, error } = await callProcedure("getAllCourses");

      if (!success) {
        return next(error);
      }

      return res.status(200).json(data);
    }

    // Call the procedure with filtering params
    const { success, data, error } = await callProcedure("getFilteredCourses", procedureParams);

    if (!success) {
      return next(error);
    }
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const getAllTrendingCourses = async (req, res, next) => {
  try {
    // Get query parameters for filtering
    const { searchTerm = '', categoryId = null, limit = "all", offset = 0 } = req.query;

    const parsedLimit = limit === "all" ? "all" : Number(limit);
    const parsedOffset = Number(offset);

    const { success, data, error } = await callProcedureChallenge("getAllTrendingCourses", [
      searchTerm,
      categoryId,
      limit === "all" ? 0 : parsedLimit,
      parsedOffset,
      limit === "all" || false
    ]);

    if (!success) {
      return next(error);
    }

    return res.status(200).json({ totalCount: data[0][0].total_count, data: Object.values(data[1]) }); // data[0] is the actual result set
  } catch (error) {
    next(error);
  }
};

const getUserGeneratedCourses = async (req, res, next) => {
  try {
    // Get query parameters for filtering
    const userId = req.user?.id;

    const { success, data, error } = await callProcedure("getCoursesGeneratedByUser", [userId]);

    if (!success) {
      return next(error);
    }

    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { success, data, error } = await callProcedure("getCourseById", [id]);

    if (!success) {
      return next(error);
      // return res.status(400).json({ error });
    }

    if (!data[0] || data[0].length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }


    res.status(200).json(data[0]); // Return the single course
  } catch (error) {
    next(error);
  }
};

const updateCourse = async (req, res, next) => {
  try {

    const usrId = req.user.id;
    const role = req.user.role

    const { id } = req.params;
    const {
      title,
      description,
      category_id,
      price,
      discount,
      duration_minutes,
      expiry_days,
      what_you_will_learn,
      is_points_enrollable,
      points_to_enroll,
      meta_title,
      meta_keyword,
      meta_description,
      seo_image,
      seo_image_alt,
      seo_canonical,
      og_title,
      og_description,
      og_image,
      og_image_alt,
      prerequisites,
      hashtags,
      status,
      min_access_minutes,
      max_access_minutes,
      is_points_rewarded,
      points_rewarded,
      is_points_rewarded_on_completion,
      points_rewarded_on_completion,
      is_copy_paste_allowed,
      is_course_trending,
      skill_development
    } = req.body;


    Validation.isString(title, { min: 3, max: 255 }, "Course title must be a valid string and minimum 3 character.");
    // if (description) {
    //   Validation.isString(description, { min: 10 }, "Description must be a valid string.");
    // }
    Validation.isInteger(category_id, "Category ID must be a valid integer.");
    Validation.isDecimal(price, { min: 0 }, "Price must be a valid positive decimal.");
    // if (discount !== undefined) {
    //   Validation.isInteger(discount, "Discount must be a valid integer.");
    // }
    // if (duration_minutes !== undefined) {
    //   Validation.isInteger(duration_minutes, "Duration minutes must be a valid integer.");
    // }
    Validation.isInteger(expiry_days, "Expiry days must be a valid integer.");
    // if (min_access_minutes !== undefined) {
    //   Validation.isDecimal(min_access_minutes, "Min access minutes must be a valid decimal.");
    // }
    // if (max_access_minutes !== undefined) {
    //   Validation.isDecimal(max_access_minutes, "Max access minutes must be a valid decimal.");
    // }
    // if (what_you_will_learn) {
    //   Validation.isArray(JSON.parse(what_you_will_learn), {}, "What you will learn must be an array.");
    // }
    // if (prerequisites) {
    //   Validation.isArray(JSON.parse(prerequisites), {}, "Prerequisites must be an array.");
    // }
    // if (hashtags) {
    //   Validation.isArray(JSON.parse(hashtags), {}, "Hashtags must be an array.");
    // }

    // if (is_points_enrollable) {
    //   Validation.isNumber(points_to_enroll, { min: 1 }, "Invalid Points To Enroll");
    // }

    // if (is_points_rewarded) {
    //   Validation.isNumber(points_rewarded, { min: 1 }, "Invalid Points To Reward");
    // }

    // Find the course record
    const course = await Course.findOne({ where: { public_hash: id } });
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Validate to ensure no negative values
    if (
      (price !== undefined && price < 0) ||
      (discount !== undefined && discount < 0) ||
      (duration_minutes !== undefined && duration_minutes < 0) ||
      (expiry_days !== undefined && expiry_days < 0) ||
      (min_access_minutes !== undefined && min_access_minutes < 0) ||
      (max_access_minutes !== undefined && max_access_minutes < 0)
    ) {
      return res.status(400).json({
        error: "Negative values are not allowed for price, discount, duration_minutes, or expiry_days. ",
      });
    }

    // Validate min_access_minutes is less than or equal to max_access_minutes
    if (min_access_minutes !== undefined || max_access_minutes !== undefined) {
      const newMin = min_access_minutes !== undefined ? parseFloat(min_access_minutes) : parseFloat(course.min_access_minutes || 0);
      const newMax = max_access_minutes !== undefined ? parseFloat(max_access_minutes) : parseFloat(course.max_access_minutes || 0);

      if (newMin > newMax) {
        return res.status(400).json({
          error: "min_access_minutes must be less than or equal to max_access_minutes",
          details: `Cannot update: new min (${newMin}) would exceed existing/new max (${newMax})`
        });
      }
    }


    const parsedWhatYouWillLearn = what_you_will_learn
      ? JSON.parse(what_you_will_learn)
      : course.what_you_will_learn;

    const parsedPrerequisites = prerequisites
      ? JSON.parse(prerequisites)
      : course.prerequisites;

    const parsedHashtags = hashtags ? JSON.parse(hashtags) : course.hashtags;
    const parsedSkillDevelopment = skill_development ? JSON.parse(skill_development) : course.skill_development;

    const thumbnail =
      req.files && req.files.courseThumbnail
        ? "/course/thumbnail/" + req.files.courseThumbnail[0].filename
        : course.thumbnail;

    let seoImage = req.files?.courseSEOImage?.[0]?.filename ? "/course/seo/" + req.files?.courseSEOImage[0].filename : seo_image || null;
    let ogImage = req.files?.courseOGImage?.[0]?.filename ? "/course/og/" + req.files?.courseOGImage[0].filename : og_image || null;

    const oldPreviewVideoPath = course.preview_video;
    // let preview_video = course.preview_video ? (Array.isArray(course.preview_video) ? course.preview_video : [course.preview_video]) : [];

    let preview_video = [];

    // Update preview_video from the incoming request body if provided
    if (req.body.preview_video !== undefined) {
      try {
        const parsed = JSON.parse(req.body.preview_video);
        preview_video = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        preview_video = Array.isArray(req.body.preview_video) ? req.body.preview_video : [req.body.preview_video];
      }
    }

    // Update preview_video from the incoming request body if provided
    if (req.body.coursePreviewVideo !== undefined) {
      try {
        const parsed = JSON.parse(req.body.coursePreviewVideo);
        preview_video = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        preview_video = Array.isArray(req.body.coursePreviewVideo) ? req.body.coursePreviewVideo : [req.body.coursePreviewVideo];
      }
    }

    if (req.files && req.files.coursePreviewVideo) {
      req.files.coursePreviewVideo.forEach(file => {
        if (file.mimetype && file.mimetype.startsWith("image/")) {
          preview_video.push("/course/preview_image/" + file.filename);
        } else {
          preview_video.push("/course/preview_video/" + file.filename);
        }
      });
    }

    // If partner submits changes => create pending version
    const hasChanges =
      title !== course.title ||
      description !== course.description ||
      category_id !== course.category_id ||
      price !== course.price ||
      discount !== course.discount ||
      duration_minutes !== course.duration_minutes ||
      expiry_days !== course.expiry_days ||
      min_access_minutes !== course.min_access_minutes ||
      max_access_minutes !== course.max_access_minutes ||
      JSON.stringify(parsedWhatYouWillLearn) !==
      JSON.stringify(course.what_you_will_learn) ||
      JSON.stringify(parsedPrerequisites) !==
      JSON.stringify(course.prerequisites) ||
      thumbnail !== course.thumbnail ||
      JSON.stringify(preview_video) !== JSON.stringify(course.preview_video) ||
      JSON.stringify(parsedHashtags) !== JSON.stringify(course.hashtags) ||
      JSON.stringify(parsedSkillDevelopment) !== JSON.stringify(course.skill_development);

    if (preview_video) {
      Validation.isArray(preview_video, { min: 1 }, "Atleast one Course Detail Image/Video Is Required.");
    }

    // If admin or no versioning required, call procedure
    const { success, data, error } = await callProcedure(
      "updateCourseDetails",
      [
        id,
        title.trim(),
        description || null,
        category_id,
        price,
        discount || null,
        duration_minutes || null,
        expiry_days,
        JSON.stringify(parsedWhatYouWillLearn) || null,
        is_points_enrollable || false,
        points_to_enroll || null,
        is_points_rewarded || false,
        points_rewarded || null,
        is_points_rewarded_on_completion || false,
        points_rewarded_on_completion || null,
        is_copy_paste_allowed || false,
        is_course_trending || false,
        meta_title || null,
        meta_keyword || null,
        meta_description || null,
        seoImage || null,
        seo_image_alt || null,
        seo_canonical || null,
        og_title || null,
        og_description || null,
        ogImage || null,
        og_image_alt || null,
        JSON.stringify(parsedPrerequisites),
        thumbnail || null,
        preview_video.length > 0 ? JSON.stringify(preview_video) : null,
        JSON.stringify(parsedHashtags),
        JSON.stringify(parsedSkillDevelopment),
        status || "draft",
        min_access_minutes || null,
        max_access_minutes || null,
        usrId,
        role,
      ]
    );

    if (!success) {
      return next(error);
    }

    // Embedding update (optional)
    const updatedCourse = data[0];

    if (
      title ||
      description ||
      parsedWhatYouWillLearn ||
      parsedHashtags ||
      category_id
    ) {
      const updatedCategory = await CourseCategory.findByPk(category_id);
      const categoryName = updatedCategory
        ? updatedCategory.category
        : course.category_id;

      const courseText = `passage: ${title}. ${description}. What you will learn: ${parsedWhatYouWillLearn.join(
        ". "
      )}. Hashtags: ${parsedHashtags.join(", ")}. Category: ${categoryName}`;

      // const embedding = await getEmbedding(courseText);

      // await Course.update({ embedding }, { where: { public_hash: id } });
    }

    // Delete removed preview media files
    if (oldPreviewVideoPath) {
      let oldArray = Array.isArray(oldPreviewVideoPath) ? oldPreviewVideoPath : [oldPreviewVideoPath];
      for (const oldPath of oldArray) {
        if (!preview_video.includes(oldPath)) {
          await deletePreviewFileIfExists(oldPath);
        }
      }
    }

    res
      .status(200)
      .json({ message: "Course updated successfully", course: updatedCourse });
  } catch (error) {
    next(error);
  }
};

// const deleteCourse = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     const { success, error } = await callProcedure("deleteCourseById", [id]);

//     if (!success) {
//       return next(error);
//       // return res.status(404).json({ message: error || "Course not found" });
//     }

//     res.status(200).json({ message: "Course deleted successfully" });
//   } catch (error) {
//     next(error);
//   }
// };

const updateCourseStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const statusValue = typeof status === "string" ? status : status?.status;

    Validation.isEnum(
      statusValue,
      ["draft", "pending", "approved", "published", "rejected", "private"],
      "Invalid status value."
    );

    const { success, error } = await callProcedure("updateCourseStatus", [
      id,
      statusValue,
    ]);

    if (!success) {
      return next(error);
      // return res.status(404).json({ message: error || "Failed to update status" });
    }

    res
      .status(200)
      .json({ message: "Course updated successfully", status: statusValue });
  } catch (error) {
    next(error);
  }
};

const updateCourseSequence = async (req, res, next) => {
  try {
    const { sequence } = req.body; // array of course IDs in new order

    Validation.isArray(sequence, {}, "Sequence must be an array of course IDs.");

    const courseIdsJson = JSON.stringify(sequence); // Convert array to JSON string

    const { success, error } = await callProcedure("updateCourseSequence", [
      courseIdsJson,
    ]);

    if (!success) {
      return next(error);
    }

    res.status(200).json({ message: "Courses sequence updated successfully" });
  } catch (error) {
    next(error);
  }
};
const getAllCoursesName = async (req, res, next) => {
  try {

    const { search_term = "" } = req.query;

    const { success, data, error } = await callProcedure("getAllCoursesName", [search_term]);

    if (!success) return next(error);

    // const courseData = await Course.findAll({
    //   attributes: ["id", "title"]
    // });

    return res.status(200).json({
      success: true,
      message: "Courses fetched successfully",
      data: data,
    });

  } catch (error) {
    console.error("error", error);

    next(error)
    // return res.status(500).json({
    //   success: false,
    //   message: "Failed to fetch courses",
    //   error: error.message,
    // });
  }
};

// -------------------------------------PROCEDURE RELATED CODE END---------------------------------

const exportCourseData = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch the course
    const course = await Course.findOne({
      where: {
        [Op.or]: [{ id: isNaN(parseInt(id)) ? 0 : parseInt(id) }, { public_hash: id }],
      },
      raw: true
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Course Category
    const courseCategoryRec = course.category_id ? await CourseCategory.findByPk(course.category_id, {raw: true}) : null;

    // Fetch FAQs
    const faqs = await CourseFAQ.findAll({ where: { course_id: course.id }, raw: true });
    const faqIds = faqs.map(f => f.id);
    const faqOptions = faqIds.length ? await CourseFAQOption.findAll({ where: { faq_id: { [Op.in]: faqIds } }, raw: true }) : [];

    // Map FAQs
    const course_faqs = faqs.map(faq => ({
      question: faq.question,
      options: faqOptions.filter(o => o.faq_id === faq.id).map(o => o.option_text)
    }));

    // Fetch Sessions
    const sessions = await Session.findAll({ where: { course_id: course.id }, raw: true, order: [['sequence_no', 'ASC']] });
    
    // Fetch Modules
    const modules = await Module.findAll({ 
      where: { course_id: course.id }, 
      raw: true,
      order: [['sequence_no', 'ASC']]
    });

    const moduleIds = modules.map(m => m.id);
    
    // Fetch Topics
    const topics = moduleIds.length > 0 ? await Topic.findAll({ 
      where: { module_id: { [Op.in]: moduleIds } }, 
      raw: true,
      order: [['sequence_no', 'ASC']]
    }) : [];
    
    const topicIds = topics.map(t => t.id);

    // Fetch TopicTags
    const topicTags = topicIds.length > 0 ? await TopicTag.findAll({
      where: { topic_id: { [Op.in]: topicIds } },
      raw: true
    }) : [];

    // Fetch MultiSlides
    const slides = topicIds.length > 0 ? await MultiSlide.findAll({
      where: { topic_id: { [Op.in]: topicIds } },
      raw: true,
      order: [['sequence_no', 'ASC']]
    }) : [];

    // Fetch GeneralMaterials
    const generalMaterials = topicIds.length > 0 ? await GeneralMaterial.findAll({
      where: { topic_id: { [Op.in]: topicIds } },
      raw: true
    }) : [];

    // Fetch Accordions
    const accordions = topicIds.length > 0 ? await Accordion.findAll({
      where: { topic_id: { [Op.in]: topicIds } },
      raw: true
    }) : [];

    // Fetch Quizzes for modules only (as DB doesn't have topic_id)
    const quizzes = moduleIds.length > 0 ? await Quizzes.findAll({
      where: {
        module_id: { [Op.in]: moduleIds }
      },
      raw: true
    }) : [];
    
    // Fetch Assignments for modules only (as DB doesn't have topic_id)
    const assignments = moduleIds.length > 0 ? await Assignment.findAll({
      where: {
        module_id: { [Op.in]: moduleIds }
      },
      raw: true
    }) : [];
    
    const formatQuiz = (quiz) => {
        if (!quiz) return undefined;
        return {
            quizTitle: quiz.title || "Assessment",
            durationMinutes: quiz.duration || 15,
            passingMarks: quiz.passing_score || 60,
            maxAttempts: quiz.attempt_allowed || 3,
            attemptGap: 0,
            attemptRenewal: 0
        };
    };

    const formatAssignment = (assignment) => {
        if (!assignment) return undefined;
        return {
            assignmentTitle: assignment.title || "Assignment",
            durationHours: assignment.time_limit || 1,
            assignmentType: assignment.assignment_type || "regular",
            maxScore: assignment.total_marks || 100,
            passingScore: assignment.passing_marks || 50,
            maxAttempts: assignment.attempts_allowed || 3,
            extensionLimit: 0
        };
    };

    const formatTags = (tags) => {
      if (!tags || tags.length === 0) return undefined;
      return tags.map(tag => {
        const type = tag.tag_file_type === 'code' ? 'code' : 'image';
        if (type === 'code') {
          return {
            type: "code",
            name: tag.tag,
            language: tag.code_language || "text",
            content: tag.tag_file_path || "Code content placeholder"
          };
        } else {
          return {
            type: "image",
            name: tag.tag,
            prompt: "Image placeholder",
            detailed_script: "Image placeholder script"
          };
        }
      });
    };

    const tryParseJSON = (data, fallback) => {
        if (typeof data === 'string') {
            try { return JSON.parse(data); } catch (e) { return fallback; }
        }
        return data || fallback;
    };

    // Assemble Data
    const exportData = {
      courseTitle: course.title,
      courseDescription: course.description,
      totalDurationMinutes: course.duration_minutes || 0,
      totalDuration: course.duration_minutes ? course.duration_minutes + " minutes" : "0 minutes",
      what_you_will_learn: tryParseJSON(course.what_you_will_learn, []),
      prerequisites: tryParseJSON(course.prerequisites, []),
      skill_development: tryParseJSON(course.skill_development, []),
      thumbnailDescription: "A visually appealing thumbnail for " + course.title,
      previewVideoDescription: "[0:00-0:15] Introduction to " + course.title,
      price: course.price || 0,
      discount: course.discount || 0,
      meta_title: course.meta_title || "",
      meta_keyword: course.meta_keyword || "",
      meta_description: course.meta_description || "",
      seo_image_alt: course.seo_image_alt || "",
      seo_canonical: course.seo_canonical || "",
      og_title: course.og_title || "",
      og_description: course.og_description || "",
      og_image_alt: course.og_image_alt || "",
      course_faqs: course_faqs,
      courseCategory: courseCategoryRec ? courseCategoryRec.category : "General",
      sessions: sessions.map(session => ({
        sessionTitle: session.title,
        sessionDurationMinutes: session.min_time_in_minute || 0,
        sessionDuration: session.min_time_in_minute ? session.min_time_in_minute + " minutes" : "0 minutes",
        modules: modules.filter(m => m.session_id === session.id).map(module => ({
          moduleTitle: module.title,
          moduleDurationMinutes: module.duration_minutes || 0,
          moduleDuration: module.duration_minutes ? module.duration_minutes + " minutes" : "0 minutes",
          quiz: formatQuiz(quizzes.find(q => q.module_id === module.id)),
          assignment: formatAssignment(assignments.find(a => a.module_id === module.id)),
          topics: topics.filter(t => t.module_id === module.id).map(topic => {
             const topicSlides = slides.filter(s => s.topic_id === topic.id);
             let mappedType = topic.content_type;
             if (mappedType === "slide") mappedType = "multislides";
             if (mappedType === "accordian") mappedType = "accordion";

             let completionType = "audio";
             let completionTime = null;
             if (mappedType === "general") {
                const gm = generalMaterials.find(g => g.topic_id === topic.id);
                if (gm) {
                   completionType = gm.completion_type || "audio";
                   completionTime = gm.completion_time;
                }
             } else if (mappedType === "accordion") {
                const acc = accordions.find(a => a.topic_id === topic.id);
                if (acc) {
                   completionType = acc.completion_type || "audio";
                   completionTime = acc.completion_time;
                }
             } else if (mappedType === "video" || mappedType === "audio") {
                completionType = mappedType;
             }
             
             let topicObj = {
                topicTitle: topic.title,
                topicDescription: topic.description,
                topicDurationMinutes: topic.topic_duration || 0,
                topicDuration: topic.topic_duration ? topic.topic_duration + " minutes" : "0 minutes",
                topicType: mappedType || "general",
                completionType: completionType,
                isImportant: false, // Topic level quizzes aren't in DB currently
                tags: formatTags(topicTags.filter(tag => tag.topic_id === topic.id && !tag.slide_id)),
                // No topicQuiz or topicAssignment from DB as they don't have topic_id
                slides: topic.content_type === "slide" ? topicSlides.map(slide => {
                   let slideMappedType = slide.type;
                   if (slideMappedType === "accordian") slideMappedType = "accordion";
                   
                   let slideObj = {
                     slideTitle: slide.title,
                     slideDescription: slide.description,
                     slideDurationMinutes: slide.slide_duration || 0,
                     slideDuration: slide.slide_duration ? slide.slide_duration + " minutes" : "0 minutes",
                     slideType: slideMappedType || "general",
                     completionType: slide.completion_type || "audio",
                     tags: formatTags(topicTags.filter(tag => tag.slide_id === slide.id))
                   };
                   
                   if (slide.completion_type === "timer" && slide.completion_time) {
                     slideObj.duration = slide.completion_time;
                   }
                   return slideObj;
                }) : undefined
             };
             
             if (completionType === "timer" && completionTime) {
                topicObj.duration = completionTime;
             }
             
             return topicObj;
          })
        }))
      }))
    };

    return res.status(200).json(exportData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getAllTrendingCourses,
  getUserGeneratedCourses,
  getAllCoursesForAdmin,
  getCourseById,
  updateCourse,
  // deleteCourse,
  updateCourseStatus,
  updateCourseSequence,
  aiChatBot,
  getAllCoursesName,
  exportCourseData
  // adminApproveRejectCourse,
};
