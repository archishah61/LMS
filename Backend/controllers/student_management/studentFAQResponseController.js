// controllers/student_management/studentFAQResponseController.js
const Course = require("../../models/course_management/course");
const { callProcedure } = require("../../utils/procedure/callProcedure"); // Adjust path if needed
const { callProcedureChallenge } = require("../../utils/procedure/callProcedureChallenge");
const Validation = require("../../validations");               // ✅  <-- add this

// ⚙️ CREATE  ─────────────────────────────────────────────────────────────
exports.createStudentFAQResponse = async (req, res, next) => {
    try {
        let {
            user_id,
            course_id,           // hashed ID coming from the client
            faq_id,
            selected_option_id,  // nullable
            created_by
        } = req.body;

        /* ---------- VALIDATIONS ---------- */
        Validation.isInteger(user_id, "User ID must be a valid integer.");
        Validation.isString(course_id, { min: 1, max: 255 },
            "Course ID (hash) must be a non‑empty string.");
        Validation.isInteger(faq_id, "FAQ ID must be a valid integer.");
        if (selected_option_id) {
            Validation.isInteger(selected_option_id,
                "Selected option ID must be a valid integer.");
        }
        Validation.isInteger(created_by, "Created‑by must be a valid integer.");

        /* ---------- Resolve hash → numeric course ID ---------- */
        const { success: courseSuccess, data: courseData, error: courseError } =
            await callProcedure("getCourseByCourseHash", [course_id]);

        if (!courseSuccess && courseError) return next(courseError);
        if (!courseSuccess || !courseData[0]) {
            return res.status(404).json({ message: "Invalid course reference" });
        }
        const actualCourseId = courseData[0].id;

        /* ---------- Insert response ---------- */
        const { success, data, error } = await callProcedure(
            "createStudentFAQResponse",
            [user_id, actualCourseId, faq_id, selected_option_id, created_by]
        );

        if (!success && error) return next(error);
        if (!success) return res.status(400).json({ error });

        return res.status(201).json({
            message: "Response saved successfully",
            response: { id: data[0].id }
        });
    } catch (error) { next(error); }
};

// ⚙️ GET‑ALL  ────────────────────────────────────────────────────────────

exports.getAllStudentFAQResponses = async (req, res, next) => {
    try {
        const { course_id, faq_id, user_id } = req.query;

        const role = req.user?.role;
        const id = req.user?.id;


        const { limit = "all", offset = "0", createdBy, createdById, search_term } = req.query;

        // if (status && status.toLowerCase() !== 'all') Validation.isEnum(status, ["draft", "active", "ended", "cancelled"], 'Invalid status value');
        // if (type && type.toLowerCase() !== 'all') Validation.isEnum(type, ["paid", "free"], 'Invalid type');

        /* ---------- VALIDATION ---------- */
        if (limit !== "all" && limit !== "ALL") {
            Validation.isInteger(limit, "Limit must be a positive integer or 'ALL'.");
        }

        Validation.isInteger(offset, "Offset must be a non-negative integer.");
        /* --------------------------------- */

        const parsedLimit = limit === "all" ? "all" : Number(limit);
        const parsedOffset = Number(offset);

        // ---------- OPTIONAL VALIDATIONS ----------
        if (course_id) Validation.isInteger(course_id, "Course ID filter must be an integer.");
        if (faq_id) Validation.isInteger(faq_id, "FAQ ID filter must be an integer.");
        if (user_id) Validation.isInteger(user_id, "User ID filter must be an integer.");

        // Call procedure
        const { success, data, error } = await callProcedureChallenge(
            "getAllStudentFAQResponses",
            [
                course_id || null,
                faq_id || null,
                user_id || null,
                role || null,
                id || null,
                createdBy === "all" ? null : createdBy,
                createdById === "all" || createdById === "" ? null : createdById,
                search_term || null,
                limit === "all" ? 0 : parsedLimit,
                parsedOffset,
                limit === "all" || false
            ]
        );

        if (!success && error) return next(error);
        if (!success) return res.status(400).json({ error });

        // let filteredData = data;

        // if (filteredData.length > 0) {
        //     // 1️⃣ Get unique course IDs from responses
        //     const courseIds = [...new Set(filteredData.map(item => item.course_id))];

        //     // 2️⃣ Fetch course details with created_by_type
        //     const courses = await Course.findAll({
        //         where: { id: courseIds },
        //         attributes: ["id", "created_by_type"]
        //     });

        //     // 3️⃣ Map course_id -> created_by_type
        //     const courseMap = new Map(courses.map(c => [c.id, c.created_by_type]));

        //     // 4️⃣ Append created_by_type to each FAQ response
        //     filteredData = filteredData.map(item => ({
        //         ...item,
        //         created_by_type: courseMap.get(item.course_id) || null
        //     }));

        //     // 5️⃣ Partner role filtering (only partner-created courses)
        //     if (role === "partner") {
        //         filteredData = filteredData.filter(item => item.created_by_type === "partner");
        //     }
        // }

        const meta = data[0][0];

        res.status(200).json({ message: "Responses fetched successfully", success: true, responses: data[1][0]?.users, pagination: { totalCount: meta?.total_count, totalPages: limit === "all" ? 1 : Math.ceil(meta?.total_count / parsedLimit) } });

    } catch (error) {
        next(error);
    }
};


// ⚙️ GET‑BY‑STUDENT  ────────────────────────────────────────────────────
exports.getResponsesByStudentId = async (req, res, next) => {
    try {
        const { user_id } = req.params;

        /* ---------- VALIDATION ---------- */
        Validation.isInteger(user_id, "User ID must be a valid integer.");

        const { success, data, error } =
            await callProcedure("getResponsesByStudentId", [user_id]);

        if (!success && error) return next(error);
        if (!success) return res.status(400).json({ error });
        if (!data[0]?.length) return res.status(404).json({ message: "No responses found for this student" });

        return res.status(200).json(data[0]);
    } catch (error) { next(error); }
};

// ⚙️ GET‑BY‑COURSE  ─────────────────────────────────────────────────────
exports.getResponsesByCourseId = async (req, res, next) => {
    try {
        const { course_id } = req.params;

        /* ---------- VALIDATION ---------- */
        Validation.isInteger(course_id, "Course ID must be a valid integer.");

        const { success, data, error } =
            await callProcedure("getResponsesByCourseId", [course_id]);

        if (!success && error) return next(error);
        if (!success) return res.status(400).json({ error });
        if (!data[0]?.length) return res.status(404).json({ message: "No responses found for this course" });

        return res.status(200).json(data[0]);
    } catch (error) { next(error); }
};
