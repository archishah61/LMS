const Course = require("../../models/course_management/course");
const Session = require("../../models/course_management/session")
const Module = require("../../models/course_management/module")
const Topic = require("../../models/course_management/topic")
const crypto = require("crypto");
const sequelize = require("../../config/db");
const { GeneralMaterial } = require("../../models/content_management/genral");
const { Audio } = require("../../models/content_management/audio");
const { Video } = require("../../models/content_management/video");
const { Accordion } = require("../../models/content_management/accordian");
const { AccordionAttachment } = require("../../models/content_management/accordionAttachment");
const { MultiSlide } = require("../../models/content_management/multi_slide");
const { MultiSlideVideo } = require("../../models/content_management/multiSlideVideo");
const { MultiSlideGeneral } = require("../../models/content_management/multiSlideGeneral");
const { MultiSlideAccordion } = require("../../models/content_management/multiSlideAccordian");
const { MultiSlideAccordionAttachment } = require("../../models/content_management/multiSlideAccordianAttachment");

const { callProcedure } = require("../../utils/procedure/callProcedure");
const { saveContentMapping } = require("./saveContentMapping");

function generatePublicHash(length = 10) {
    return crypto.randomBytes(length)
        .toString("hex")
        .substring(0, length);
}

// Helper function to clone topics for a module
async function cloneTopicsForModule(map, transaction, req, courseId) {
    const { oldModuleId, newModuleId } = map;
    // where: { module_id: oldModuleId, status: "active" },
    const topics = await Topic.findAll({
        where: { module_id: oldModuleId },
        order: [["sequence_no", "ASC"]],
        transaction,
    });

    if (topics.length === 0) return;

    const lastTopic = await Topic.findOne({
        where: { module_id: newModuleId },
        order: [["sequence_no", "DESC"]],
        transaction,
    });
    let nextTopicSeq = lastTopic ? lastTopic.sequence_no + 1 : 1;

    for (const topic of topics) {
        const newTopic = await Topic.create({
            public_hash: generatePublicHash(10),
            module_id: newModuleId,
            original_topic_id: topic.id,
            title: topic.title,
            description: topic.description,
            content_type: topic.content_type,
            sequence_no: nextTopicSeq++,
            languages: topic.languages,
            total_duration: topic.total_duration,
            topic_duration: topic.topic_duration,
            extra_duration: topic.extra_duration,
            status: topic.status,
            created_by: req.user?.id || 1,
            created_by_type: "admin",
            updated_by: req.user?.id || 1,
            updated_by_type: "admin",
        }, { transaction });

        await saveContentMapping({
            type: "topic",
            original_id: topic.id,
            copiedObject: {
                course_id: courseId,       // depends on how you pass it
                topic_id: newTopic.id
            },
            userId: req.user?.id || 1,
            transaction
        });



        await cloneTopicContent(topic, newTopic, transaction, req);
    }
}

// Helper function to clone content for a topic
async function cloneTopicContent(oldTopic, newTopic, transaction, req) {

    if (oldTopic.content_type === "video") {
        const oldVideo = await Video.findOne({
            where: { topic_id: oldTopic.id },
            transaction,
        });
        if (oldVideo) {
            await Video.create({
                topic_id: newTopic.id,
                url: oldVideo.url,
                video_type: oldVideo.video_type,
                audio_url: oldVideo.audio_url,
                duration_minutes: oldVideo.duration_minutes,
                created_by: req.user?.id || 1,
                created_by_type: "admin",
                updated_by: req.user?.id || 1,
                updated_by_type: "admin",
            }, { transaction });
        }
    } else if (oldTopic.content_type === "audio") {
        const oldAudio = await Audio.findOne({
            where: { topic_id: oldTopic.id },
            transaction,
        });
        if (oldAudio) {
            await Audio.create({
                topic_id: newTopic.id,
                url: oldAudio.url,
                image_url: oldAudio.image_url,
                duration_minutes: oldAudio.duration_minutes,
                created_by: req.user?.id || 1,
                created_by_type: "admin",
                updated_by: req.user?.id || 1,
                updated_by_type: "admin",
            }, { transaction });
        }
    } else if (oldTopic.content_type === "general") {
        const oldGeneral = await GeneralMaterial.findOne({
            where: { topic_id: oldTopic.id },
            transaction,
        });
        if (oldGeneral) {
            await GeneralMaterial.create({
                topic_id: newTopic.id,
                title: oldGeneral.title,
                description: oldGeneral.description,
                completion_type: oldGeneral.completion_type,
                completion_time: oldGeneral.completion_time,
                audio_url: oldGeneral.audio_url,
                duration_minutes: oldGeneral.duration_minutes,
                created_by: req.user?.id || 1,
                created_by_type: "admin",
                updated_by: req.user?.id || 1,
                updated_by_type: "admin",
            }, { transaction });
        }
    } else if (oldTopic.content_type === "accordian") {
        const oldAccordions = await Accordion.findAll({
            where: { topic_id: oldTopic.id },
            include: [
                {
                    model: AccordionAttachment,
                    as: "AccordionAttachments",
                },
            ],
            transaction
        });

        for (let oldAcc of oldAccordions) {
            // 1️⃣ Create New Accordion
            const newAcc = await Accordion.create({
                topic_id: newTopic.id,
                title: oldAcc.title,
                body: oldAcc.body,
                codeLanguage: oldAcc.codeLanguage,
                code: oldAcc.code,
                completion_type: oldAcc.completion_type,
                completion_time: oldAcc.completion_time,
                audio_url: oldAcc.audio_url,
                duration_minutes: oldAcc.duration_minutes,
                created_by: req?.user?.id || 1,
                created_by_type: "admin",
                updated_by: req?.user?.id || 1,
                updated_by_type: "admin",
            }, { transaction });

            // 2️⃣ Copy Accordion Attachments
            for (let att of oldAcc.AccordionAttachments) {
                await AccordionAttachment.create({
                    accordionId: newAcc.id,
                    fileUrl: att.fileUrl,
                    fileType: att.fileType,
                }, { transaction });
            }
        }
    } else if (oldTopic.content_type === "slide") {
        // 1️⃣ Load all MultiSlides + all nested relations
        const oldSlides = await MultiSlide.findAll({
            where: { topic_id: oldTopic.id },
            include: [
                { model: MultiSlideVideo },
                { model: MultiSlideGeneral },
                {
                    model: MultiSlideAccordion,
                    include: [
                        { model: MultiSlideAccordionAttachment }
                    ]
                }
            ],
            transaction
        });

        for (let oldSlide of oldSlides) {

            // 2️⃣ Create MAIN Slide Entry
            const newSlide = await MultiSlide.create({
                topic_id: newTopic.id,
                title: oldSlide.title,
                description: oldSlide.description,
                type: oldSlide.type,
                completion_type: oldSlide.completion_type,
                completion_time: oldSlide.completion_time,
                audio_url: oldSlide.audio_url,
                sequence_no: oldSlide.sequence_no,
                slide_duration: oldSlide.slide_duration,
                slide_extra_duration: oldSlide.slide_extra_duration,
                total_slide_duration: oldSlide.total_slide_duration,

                created_by: req?.user?.id || 1,
                created_by_type: "admin",
                updated_by: req?.user?.id || 1,
                updated_by_type: "admin"
            }, { transaction });

            // 3️⃣ Slide Type = VIDEO
            for (const v of oldSlide.MultiSlideVideos) {
                await MultiSlideVideo.create({
                    multi_slide_id: newSlide.id,
                    url: v.url,
                    type: v.type,
                    duration_minutes: v.duration_minutes,

                    created_by: req?.user?.id || 1,
                    created_by_type: "admin",
                    updated_by: req?.user?.id || 1,
                    updated_by_type: "admin",
                }, { transaction });
            }

            // 4️⃣ Slide Type = GENERAL
            for (const g of oldSlide.MultiSlideGenerals) {
                await MultiSlideGeneral.create({
                    multi_slide_id: newSlide.id,
                    codeLanguage: g.codeLanguage,
                    code: g.code,

                    created_by: req?.user?.id || 1,
                    created_by_type: "admin",
                    updated_by: req?.user?.id || 1,
                    updated_by_type: "admin",
                }, { transaction });
            }

            // 5️⃣ Slide Type = ACCORDION
            for (const acc of oldSlide.MultiSlideAccordions) {
                const newSlideAcc = await MultiSlideAccordion.create({
                    multi_slide_id: newSlide.id,
                    title: acc.title,
                    body: acc.body,
                    codeLanguage: acc.codeLanguage,
                    code: acc.code,

                    created_by: req?.user?.id || 1,
                    created_by_type: "admin",
                    updated_by: req?.user?.id || 1,
                    updated_by_type: "admin",
                }, { transaction });

                // 6️⃣ Clone Accordion Attachments
                for (const attach of acc.MultiSlideAccordionAttachments) {
                    await MultiSlideAccordionAttachment.create({
                        accordionId: newSlideAcc.id,
                        fileUrl: attach.fileUrl,
                        fileType: attach.fileType
                    }, { transaction });
                }
            }
        }
    }
}

exports.importAllCourses = async (req, res) => {
    try {
        const userId = req.user?.id || null;
        const userRole = req.user?.role || null;

        const { searchQuery = '' } = req.query;

        const results = await callProcedure("sp_getAllCourses", [
            searchQuery,
            userId,
            userRole
        ]);

        if (!results || results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No courses available"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Courses fetched successfully",
            data: results?.data
        });

    } catch (error) {
        console.error("Error fetching courses:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

exports.importSessionByCourseId = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { searchQuery = '' } = req.query;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: "Course ID is required"
            });
        }

        const results = await callProcedure("getSessionsByCourseId", [
            courseId,
            searchQuery
        ]);

        return res.status(200).json({
            success: true,
            message: "Sessions fetched successfully",
            data: results?.data
        });

    } catch (error) {
        console.error("Error fetching sessions:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

exports.importModulesBySessionId = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { searchQuery = '' } = req.query;

        const modules = await callProcedure("importModulesBySessionId", [
            sessionId,
            searchQuery
        ]);

        return res.status(200).json({
            success: true,
            message: "Modules fetched successfully",
            data: modules?.data
        });

    } catch (error) {
        console.error("Procedure error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

exports.importTopicsByModuleId = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const { searchQuery = '' } = req.query;

        const topics = await callProcedure("importTopicsByModuleId", [
            moduleId,
            searchQuery
        ]);

        return res.status(200).json({
            success: true,
            message: "Topics fetched successfully",
            data: topics?.data
        });

    } catch (error) {
        console.error("Procedure error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

exports.saveImportedSessions = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { courseId, sessionIds } = req.body;

        if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
            return res.status(400).json({ message: "sessionIds must be a non-empty array" });
        }

        if (!courseId) {
            return res.status(400).json({ message: "courseId is required" });
        }

        // 1️⃣ Fetch selected sessions
        const sessions = await Session.findAll({
            where: { id: sessionIds },
            order: [["sequence_no", "ASC"]],
            transaction: t
        });

        if (sessions.length === 0) {
            return res.status(404).json({ message: "No sessions found" });
        }

        // --------------------------- Validation Start ---------------------------

        // 🔁 Check for duplicate imported sessions
        const existingImportedSessions = await Session.findAll({
            where: {
                course_id: courseId,
                original_session_id: sessionIds
            },
            attributes: ["original_session_id"],
            transaction: t
        });

        if (existingImportedSessions.length > 0) {
            const duplicatedIds = existingImportedSessions.map(
                s => s.original_session_id
            );

            await t.rollback();

            return res.status(400).json({
                success: false,
                message: "Some sessions are already imported in this course",
                duplicated_session_ids: duplicatedIds
            });
        }

        // 🔹 Get total duration of existing course sessions
        const existingDuration = await Session.sum("min_time_in_minute", {
            where: { course_id: courseId },
            transaction: t
        }) || 0;

        // 🔹 Calculate duration of selected sessions
        const importingDuration = sessions.reduce((total, s) => {
            return total + (s.min_time_in_minute || 0);
        }, 0);

        const course = await Course.findByPk(courseId, { transaction: t });

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        const courseMaxDuration = course.duration_minutes; // adjust field name if different

        const finalDuration = existingDuration + importingDuration;

        if (courseMaxDuration && finalDuration > courseMaxDuration) {
            const exceededBy = finalDuration - courseMaxDuration;

            await t.rollback();

            return res.status(400).json({
                message: `Course duration exceeded by ${exceededBy} minutes`,
                success: false
            });
        }

        // --------------------------- Validation End ---------------------------

        // 2️⃣ Get last sequence number in course
        const lastSession = await Session.findOne({
            where: { course_id: courseId },
            order: [["sequence_no", "DESC"]],
            transaction: t
        });

        let nextSequence = lastSession ? lastSession.sequence_no + 1 : 1;

        const createdSessions = []; // Map of old → new session IDs

        // 3️⃣ Clone sessions
        for (const session of sessions) {
            const newSession = await Session.create({
                public_hash: generatePublicHash(10),
                course_id: courseId,
                original_session_id: session.id,
                title: session.title,
                status: session.status,
                is_points_rewarded_on_completion: Boolean(session.is_points_rewarded_on_completion),
                points_rewarded_on_completion: Boolean(session.points_rewarded_on_completion),
                sequence_no: nextSequence++,
                min_time_in_minute: session.min_time_in_minute,
                is_points_rewarded_on_completion: session.is_points_rewarded_on_completion,
                points_rewarded_on_completion: session.points_rewarded_on_completion,
                created_by: req.user?.id || 1,
                updated_by: req.user?.id || 1,
                created_by_type: "admin",
                updated_by_type: "admin"
            }, { transaction: t });

            await saveContentMapping({
                type: "session",
                original_id: session.id,
                copiedObject: {
                    course_id: courseId,
                    session_id: newSession.id
                },
                userId: req.user?.id || 1,
                transaction: t
            });


            createdSessions.push({
                oldSessionId: session.id,
                newSessionId: newSession.id
            });
        }

        // 🔥 Store mapping of oldModule → newModule for cloning topics
        const moduleMap = [];

        // 4️⃣ Clone modules for each session
        for (const mapped of createdSessions) {
            const modules = await Module.findAll({
                where: { session_id: mapped.oldSessionId },
                order: [["sequence_no", "ASC"]],
                transaction: t
            });

            if (modules.length === 0) continue;

            const lastModule = await Module.findOne({
                where: { session_id: mapped.newSessionId },
                order: [["sequence_no", "DESC"]],
                transaction: t
            });

            let nextModuleSeq = lastModule ? lastModule.sequence_no + 1 : 1;

            for (const mod of modules) {
                const newModule = await Module.create({
                    public_hash: generatePublicHash(10),
                    course_id: courseId,
                    session_id: mapped.newSessionId,
                    original_module_id: mod.id,
                    title: mod.title,
                    sequence_no: nextModuleSeq++,
                    duration_minutes: mod.duration_minutes,
                    status: mod.status,
                    created_by: req.user?.id || 1,
                    created_by_type: "admin",
                    updated_by: req.user?.id || 1,
                    updated_by_type: "admin"
                }, { transaction: t });

                await saveContentMapping({
                    type: "module",
                    original_id: mod.id,
                    copiedObject: {
                        course_id: courseId,
                        module_id: newModule.id
                    },
                    userId: req.user?.id || 1,
                    transaction: t
                });

                // Save mapping to clone topics
                moduleMap.push({
                    oldModuleId: mod.id,
                    newModuleId: newModule.id
                });
            }
        }

        // 5️⃣ Clone Topics for each module
        for (const mapped of moduleMap) {
            await cloneTopicsForModule(mapped, t, req, courseId);
        }

        await t.commit();

        return res.status(200).json({
            message: "Sessions, Modules & Topics imported successfully",
            imported_sessions: createdSessions.length
        });

    } catch (error) {
        await t.rollback();
        console.error(error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

exports.saveImportedModules = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { sessionId, moduleIds } = req.body;

        if (!moduleIds || !Array.isArray(moduleIds) || moduleIds.length === 0) {
            return res.status(400).json({
                message: "moduleIds must be a non-empty array"
            });
        }

        if (!sessionId) {
            return res.status(400).json({
                message: "sessionId is required"
            });
        }

        // Validate session
        const sessionData = await Session.findOne({
            where: { id: sessionId },
            transaction: t
        });

        if (!sessionData) {
            return res.status(404).json({
                message: "Invalid sessionId. Session not found."
            });
        }

        const courseId = sessionData.course_id;

        // 1️⃣ Fetch selected modules
        const modules = await Module.findAll({
            where: { id: moduleIds },
            order: [["sequence_no", "ASC"]],
            transaction: t
        });

        if (modules.length === 0) {
            return res.status(404).json({
                message: "No modules found for provided moduleIds"
            });
        }

        // --------------------------- Validation Start ---------------------------

        // 🔁 Check for duplicate imported sessions
        const existingImportedModules = await Module.findAll({
            where: {
                session_id: sessionId,
                original_module_id: moduleIds
            },
            attributes: ["original_module_id"],
            transaction: t
        });

        if (existingImportedModules.length > 0) {
            const duplicatedIds = existingImportedModules.map(
                m => m.original_module_id
            );

            await t.rollback();

            return res.status(400).json({
                success: false,
                message: "Some modules are already imported in this session",
                duplicated_module_ids: duplicatedIds
            });
        }

        // 🔹 Get total duration of existing course sessions
        const existingDuration = await Module.sum("duration_minutes", {
            where: { session_id: sessionId },
            transaction: t
        }) || 0;

        // 🔹 Calculate duration of selected sessions
        const importingDuration = modules.reduce((total, m) => {
            return total + (m.duration_minutes || 0);
        }, 0);

        const sessionMaxDuration = sessionData.min_time_in_minute; // adjust field name if different

        const finalDuration = existingDuration + importingDuration;

        if (sessionMaxDuration && finalDuration > sessionMaxDuration) {
            const exceededBy = finalDuration - sessionMaxDuration;

            await t.rollback();

            return res.status(400).json({
                message: `Session duration exceeded by ${exceededBy} minutes`,
                success: false
            });
        }

        // --------------------------- Validation End ---------------------------

        // 2️⃣ Find next sequence no. in session
        const lastModule = await Module.findOne({
            where: { session_id: sessionId },
            order: [["sequence_no", "DESC"]],
            transaction: t
        });

        let nextSequence = lastModule ? lastModule.sequence_no + 1 : 1;

        const moduleMap = [];

        // 3️⃣ Clone Modules + Save Content Mapping
        for (const module of modules) {

            const newModule = await Module.create({
                public_hash: generatePublicHash(10),
                session_id: sessionId,
                course_id: courseId,
                original_module_id: module.id,
                title: module.title,
                status: module.status,
                sequence_no: nextSequence++,
                duration_minutes: module.duration_minutes,
                created_by: req.user?.id || 1,
                updated_by: req.user?.id || 1,
                created_by_type: "admin",
                updated_by_type: "admin"
            }, { transaction: t });


            // 4️⃣ Save Module Mapping (same as in session import controller)
            await saveContentMapping({
                type: "module",
                original_id: module.id,
                copiedObject: {
                    course_id: courseId,
                    module_id: newModule.id
                },
                userId: req.user?.id || 1,
                transaction: t
            });


            moduleMap.push({
                oldModuleId: module.id,
                newModuleId: newModule.id
            });
        }

        // 5️⃣ Clone Topics for each cloned Module
        for (const map of moduleMap) {
            await cloneTopicsForModule(map, t, req, courseId);
        }

        await t.commit();

        return res.status(200).json({
            message: "Modules & Topics imported successfully",
            imported_modules: moduleMap.length
        });

    } catch (error) {
        await t.rollback();
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

exports.saveImportedTopics = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { moduleId, topicIds } = req.body;

        if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
            return res.status(400).json({
                message: "topicIds must be a non-empty array"
            });
        }

        if (!moduleId) {
            return res.status(400).json({
                message: "moduleId is required"
            });
        }

        // Validate module
        const moduleData = await Module.findOne({
            where: { id: moduleId },
            transaction: t
        });

        if (!moduleData) {
            return res.status(404).json({
                message: "Invalid moduleId. Module not found."
            });
        }

        const courseId = moduleData.course_id;

        // 1️⃣ Fetch selected topics
        const topics = await Topic.findAll({
            where: { id: topicIds },
            order: [["sequence_no", "ASC"]],
            transaction: t
        });

        if (topics.length === 0) {
            return res.status(404).json({
                message: "No topics found for provided topicIds"
            });
        }

        // 🔁 Check for duplicate imported sessions
        const existingImportedTopics = await Topic.findAll({
            where: {
                module_id: moduleId,
                original_topic_id: topicIds
            },
            attributes: ["original_topic_id"],
            transaction: t
        });

        if (existingImportedTopics.length > 0) {
            const duplicatedIds = existingImportedTopics.map(
                t => t.original_topic_id
            );

            await t.rollback();

            return res.status(400).json({
                success: false,
                message: "Some topics are already imported in this module",
                duplicated_topic_ids: duplicatedIds
            });
        }

        // 2️⃣ Find next sequence
        const lastTopic = await Topic.findOne({
            where: { module_id: moduleId },
            order: [["sequence_no", "DESC"]],
            transaction: t
        });

        let nextSeq = lastTopic ? lastTopic.sequence_no + 1 : 1;

        const topicMap = [];

        // 3️⃣ Clone topics
        for (const oldTopic of topics) {

            const newTopic = await Topic.create({
                public_hash: generatePublicHash(10),
                module_id: moduleId,
                course_id: courseId, // Use target module's course id
                session_id: moduleData.session_id,
                original_topic_id: oldTopic.id,
                title: oldTopic.title,
                description: oldTopic.description,
                content_type: oldTopic.content_type,
                status: oldTopic.status,
                sequence_no: nextSeq++,
                languages: oldTopic.languages,
                total_duration: oldTopic.total_duration,
                topic_duration: oldTopic.topic_duration,
                extra_duration: oldTopic.extra_duration,

                created_by: req.user?.id || 1,
                created_by_type: "admin",
                updated_by: req.user?.id || 1,
                updated_by_type: "admin"
            }, { transaction: t });

            topicMap.push({
                oldTopicId: oldTopic.id,
                newTopicId: newTopic.id
            });

            // 4️⃣ Save Topic Mapping (NEW)
            await saveContentMapping({
                type: "topic",
                original_id: oldTopic.id,
                copiedObject: {
                    course_id: courseId,
                    topic_id: newTopic.id
                },
                userId: req.user?.id || 1,
                transaction: t
            });

            // 5️⃣ Clone Topic Content
            await cloneTopicContent(oldTopic, newTopic, t, req);
        }

        await t.commit();

        return res.status(200).json({
            message: "Topics imported successfully",
            imported_topics: topicMap.length
        });

    } catch (error) {
        await t.rollback();
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
