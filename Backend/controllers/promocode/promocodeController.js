const { v4: uuidv4 } = require("uuid"); // For generating unique codes
const PromoCode = require("../../models/promocode/promocode");
const Batch = require("../../models/promocode/batch");
const Course = require("../../models/course_management/course")
const User = require("../../models/auth/user");
const { callProcedure } = require("../../utils/procedure/callProcedure");
const Validation = require("../../validations");
const { callProcedureChallenge } = require("../../utils/procedure/callProcedureChallenge");


// const generatePromoCodes = async (req, res) => {
//     try {
//         const { course_ids, user_ids } = req.body;

//         const created_by = req.user.id;
//         const created_by_type = req.user.role === "admin" ? "admin" : "partner";

//         // -------------------------------
//         // 1️⃣  CREATE/GET NEXT BATCH NUMBER
//         // -------------------------------
//         const lastBatch = await Batch.findOne({
//             order: [["id", "DESC"]],
//         });

//         let nextNumber = 1;

//         if (lastBatch) {
//             nextNumber = parseInt(lastBatch.batch_number) + 1;
//         }

//         // Format to 6 digits: 000001, 000002...
//         const formattedBatchNumber = String(nextNumber).padStart(6, "0");

//         // Create batch entry
//         const newBatch = await Batch.create({
//             batch_number: formattedBatchNumber,
//             created_by,
//             updated_by: created_by,
//             created_by_type,
//             updated_by_type: created_by_type
//         });

//         // -------------------------------
//         // 2️⃣  PROCESS PROMO CODES
//         // -------------------------------

//         let results = [];

//         for (let user_id of user_ids) {

//             // let existingPromo = await PromoCode.findOne({ where: { user_id } });

//             // if (existingPromo) {
//             //     const updatedCourseIds = Array.from(
//             //         new Set([...(existingPromo.course_ids || []), ...course_ids])
//             //     );

//             //     existingPromo.course_ids = updatedCourseIds;
//             //     existingPromo.updated_by = created_by;
//             //     existingPromo.updated_by_type = created_by_type;
//             //     existingPromo.batch_id = newBatch.id; // 🔥 attach batch

//             //     await existingPromo.save();

//             //     results.push({
//             //         user_id,
//             //         status: "updated",
//             //         promo_code: existingPromo.code,
//             //         courses: existingPromo.course_ids,
//             //         batch: formattedBatchNumber
//             //     });
//             // } else {
//             const newPromo = await PromoCode.create({
//                 batch_id: newBatch.id, // 🔥 attach batch
//                 course_ids,
//                 user_id,
//                 code: uuidv4().substring(0, 6).toUpperCase().replace(/(.{3})/, "$1-"),
//                 created_by,
//                 updated_by: created_by,
//                 created_by_type,
//                 updated_by_type: created_by_type,
//             });

//             if (newPromo) {
//                 await User.update(
//                     { isPromoCodeGenerated: true },
//                     { where: { id: user_id } }
//                 );
//             }

//             results.push({
//                 user_id,
//                 status: "created",
//                 promo_code: newPromo.code,
//                 courses: newPromo.course_ids,
//                 batch: formattedBatchNumber
//             });
//             // }
//         }

//         return res.status(200).json({
//             success: true,
//             message: "Promo code generation completed",
//             batch_number: formattedBatchNumber,
//             data: results,
//         });

//     } catch (error) {
//         console.error("Error generating promo codes:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to generate promo codes",
//             error: error.message,
//         });
//     }
// };

const generatePromoCodes = async (req, res) => {
    try {
        const { course_ids, user_ids } = req.body;

        const created_by = req.user.id;
        const created_by_type =
            req.user.role === "admin" ? "admin" : "partner";

        // Convert arrays to JSON strings
        const courseIdsJson = JSON.stringify(course_ids);
        const userIdsJson = JSON.stringify(user_ids);

        const results = await callProcedure("generatePromoCodes", [
            courseIdsJson,
            userIdsJson,
            created_by,
            created_by_type,
        ]);

        return res.status(200).json({
            success: true,
            message: "Promo code generation completed",
        });

    } catch (error) {
        console.error("SP Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate promo codes",
            error: error.message,
        });
    }
};

// const getAllBatches = async (req, res) => {
//     try {
//         const batches = await Batch.findAll({
//             include: [
//                 {
//                     model: PromoCode,
//                     as: "promoCodes",
//                     attributes: ["id", "user_id"],
//                 }
//             ],
//             order: [["id", "DESC"]],
//         });

//         // Prepare response with counts
//         const result = batches.map(batch => {
//             const promoCodes = batch.promoCodes || [];

//             return {
//                 id: batch.id,
//                 batch_number: batch.batch_number,
//                 created_at: batch.created_at,
//                 // Total users assigned (user_id NOT NULL)
//                 total_assigned_users: promoCodes.filter(p => p.user_id !== null).length,
//             };
//         });

//         return res.status(200).json({
//             success: true,
//             data: result,
//         });
//     } catch (error) {
//         console.error("Error in getAllBatches:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Something went wrong",
//         });
//     }
// };

const getAllBatches = async (req, res, next) => {
    try {
        const { limit = "all", offset = "0", searchTerm, dateFrom, dateTo } = req.query;

        /* ---------- VALIDATION ---------- */
        if (limit !== "all" && limit !== "ALL") {
            Validation.isInteger(limit, "Limit must be a positive integer or 'all'.");
        }

        Validation.isInteger(offset, "Offset must be a non-negative integer.");
        /* --------------------------------- */

        const parsedLimit = limit === "all" ? "all" : Number(limit);
        const parsedOffset = Number(offset);

        const { success, data, error } = await callProcedureChallenge("getAllBatches", [
            searchTerm,
            dateFrom || null,
            dateTo || null,
            limit === "all" ? 0 : parsedLimit,
            parsedOffset,
            limit === "all" || false
        ]);

        if (!success) return next(error);

        const meta = data[0][0];

        return res.status(200).json({
            success,
            data: Object.values(data[1]),
            pagination: { totalCount: meta?.total_count, totalPages: limit === "all" ? 1 : Math.ceil(meta?.total_count / parsedLimit) }
        });
    } catch (error) {
        next(error)
    }
};

// const getUsersByBatchId = async (req, res) => {
//     try {
//         const { batchId } = req.body;

//         if (!batchId) {
//             return res.status(400).json({
//                 status: false,
//                 message: "batchId is required",
//             });
//         }

//         // 1. Fetch all promo code entries for this batch
//         const promoCodes = await PromoCode.findAll({
//             where: { batch_id: batchId },
//         });

//         if (!promoCodes.length) {
//             return res.status(404).json({
//                 status: false,
//                 message: "No users found for this batch",
//             });
//         }

//         // 2. Extract user IDs
//         const userIds = promoCodes
//             .map(p => p.user_id)
//             .filter(id => id !== null);

//         // 3. Fetch user details
//         const users = await User.findAll({
//             where: { id: userIds },
//         });

//         // 4. Fetch all course titles for promo code course_ids
//         const allCourseIds = [
//             ...new Set(promoCodes.flatMap(p => p.course_ids || [])),
//         ];

//         const courses = await Course.findAll({
//             where: { id: allCourseIds },
//             attributes: ["id", "title"],
//         });

//         const courseMap = {};
//         courses.forEach(c => {
//             courseMap[c.id] = c.title;
//         });

//         // 5. Combine user + course details
//         const result = promoCodes.map(pc => {
//             const user = users.find(u => u.id === pc.user_id);

//             return {
//                 promo_code: pc.code,
//                 user: user || null,
//                 courses: (pc.course_ids || []).map(cid => ({
//                     id: cid,
//                     title: courseMap[cid] || "Unknown Course",
//                 })),
//                 created_at: pc.created_at,
//             };
//         });

//         return res.status(200).json({
//             status: true,
//             message: "Batch users fetched successfully",
//             data: result,
//         });

//     } catch (error) {
//         console.error("Error in getUsersByBatchId:", error);
//         return res.status(500).json({
//             status: false,
//             message: "Internal server error",
//             error: error.message,
//         });
//     }
// };

const getUsersByBatchId = async (req, res) => {
    try {
        const { batchId } = req.body;

        const results = await callProcedure("getUsersByBatchId", [batchId]);

        if (!results.data || results.data.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No users found for this batch"
            });
        }

        const promoCodes = results.data;

        // Extract unique user IDs
        const userIds = promoCodes
            .filter(p => p.user_id !== null)
            .map(p => p.user_id);

        // Extract all course IDs from course_ids arrays
        const allCourseIds = [
            ...new Set(
                promoCodes.flatMap(p => p.course_ids || [])
            )
        ];

        // Fetch users
        const users = await User.findAll({
            where: { id: userIds }
        });

        // Fetch courses
        const courses = await Course.findAll({
            where: { id: allCourseIds },
            attributes: ["id", "title"]
        });

        // Map for quick lookup
        const courseMap = {};
        courses.forEach(c => courseMap[c.id] = c.title);

        // Final combined response
        const result = promoCodes.map(pc => {
            const user = users.find(u => u.id === pc.user_id);

            return {
                promo_code: pc.promo_code,
                user: user || null,
                courses: (pc.course_ids || []).map(cid => ({
                    id: cid,
                    title: courseMap[cid] || "Unknown Course"
                })),
                created_at: pc.created_at
            };
        });

        return res.status(200).json({
            status: true,
            data: result
        });

    } catch (error) {
        console.error("SP Error getUsersByBatchId:", error);
        return res.status(500).json({
            status: false,
            message: "Server error"
        });
    }
};


// const verifyPromoCode = async (req, res) => {
//     try {
//         const { user_id, course_id, code } = req.body;

//         if (!user_id || !course_id || !code) {
//             return res.status(400).json({
//                 success: false,
//                 message: "user_id, course_id and code are required.",
//             });
//         }

//         // 1. Find promo code
//         const promo = await PromoCode.findOne({
//             where: {
//                 user_id: user_id,
//                 code: code.trim()
//             },
//         });

//         if (!promo) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Invalid promo code.",
//             });
//         }

//         // 2. Check if promo code is assigned to a specific user
//         if (promo.user_id !== null && promo.user_id !== user_id) {
//             return res.status(403).json({
//                 success: false,
//                 message: "This promo code is not assigned to this user.",
//             });
//         }

//         // 3. Check if promo code is valid for this course
//         const courseIds = Array.isArray(promo.course_ids)
//             ? promo.course_ids
//             : [];

//         if (!courseIds.includes(course_id)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Promo code is not applicable for this course.",
//             });
//         }

//         await promo.update({ isVerified: true });

//         await promo.reload(); // IMPORTANT

//         // If all checks pass
//         return res.status(200).json({
//             success: true,
//             message: "Promo code verified successfully.",
//             data: promo,
//         });

//     } catch (error) {
//         console.error("Promo Code Verify Error:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Internal server error.",
//         });
//     }
// };

const verifyPromoCode = async (req, res) => {
    try {
        const { user_id, course_id, code } = req.body;

        if (!user_id || !course_id || !code) {
            return res.status(400).json({
                success: false,
                message: "user_id, course_id and code are required.",
            });
        }

        const { success, data, error } = await callProcedure("verifyPromoCode", [
            user_id,
            course_id,
            code.trim()
        ]);

        if (!success) {
            const message = error?.original?.sqlMessage || error?.sqlMessage || error?.message || (typeof error === 'string' ? error : 'Promo verification failed');
            return res.status(400).json({
                success: false,
                message,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Promo code verified successfully.",
            data,
        });

    } catch (error) {
        console.error("SP verify error:", error);

        return res.status(400).json({
            success: false,
            message: error.original?.sqlMessage || "Promo verification failed"
        });
    }
};

// const checkIsPromoCodeVerified = async (req, res) => {
//     try {
//         const { userId, courseId } = req.body;

//         if (!userId || !courseId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "userId and courseId are required",
//             });
//         }

//         // Find promo code where user matches and courseId exists in course_ids array
//         const promo = await PromoCode.findOne({
//             where: {
//                 user_id: userId,
//                 isVerified: true
//             }
//         });

//         // If no promo found
//         if (!promo) {
//             return res.status(200).json({
//                 success: true,
//                 isVerified: false,
//             });
//         }

//         // Check if courseId is inside promo.course_ids JSON array
//         const courseIds = promo.course_ids || [];
//         const match = courseIds.includes(Number(courseId));

//         return res.status(200).json({
//             success: true,
//             isVerified: match, // true or false
//         });

//     } catch (error) {
//         console.error("Error:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Internal server error",
//         });
//     }
// };

const checkIsPromoCodeVerified = async (req, res) => {
    try {
        const { userId, courseId } = req.body;

        const results = await callProcedure("checkPromoVerified", [
            userId,
            courseId
        ]);

        const isVerified = results.data?.[0].isVerified === 1;

        return res.status(200).json({
            success: true,
            isVerified
        });

    } catch (error) {
        console.error("SP error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    generatePromoCodes,
    getAllBatches,
    getUsersByBatchId,
    verifyPromoCode,
    checkIsPromoCodeVerified
};
