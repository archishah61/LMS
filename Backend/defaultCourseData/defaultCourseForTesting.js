const sequelize = require("../config/db");
const { getAudioDurationInMinutes } = require("../utils/audioDuration");

// Masters / Auth
const { CourseCategory } = require("../models/masters/courseCatagory");
const Course = require("../models/course_management/course");
const CourseFAQ = require("../models/course_management/courseFAQs");
const CourseFAQOption = require("../models/course_management/courseFAQOption");
const Session = require("../models/course_management/session");
const Module = require("../models/course_management/module");
const Topic = require("../models/course_management/topic");
const TopicTag = require("../models/content_management/tags/tagsTable");
const { Video } = require("../models/content_management/video");
const { Audio } = require("../models/content_management/audio");
const { Accordion } = require("../models/content_management/accordian");
const { GeneralMaterial } = require("../models/content_management/genral");
const { Material } = require("../models/content_management/material");
const { MultiSlide } = require("../models/content_management/multi_slide");
const { MultiSlideVideo } = require("../models/content_management/multiSlideVideo");
const { MultiSlideAudio } = require("../models/content_management/multiSlideAudio");
const { MultiSlideGeneral } = require("../models/content_management/multiSlideGeneral");
const { MultiSlideAccordion } = require("../models/content_management/multiSlideAccordian");
const { MultiSlideAccordionAttachment } = require("../models/content_management/multiSlideAccordianAttachment");
// Assignments & Quiz
const Assignment = require("../models/content_management/assignmentsModel");
const MatchingQuestion = require("../models/content_management/matchingQuestion");
const MatchingOption = require("../models/content_management/matchingOption");
const FillTheBlanksQuestion = require("../models/content_management/fillTheBlanks");
const ParagraphWriting = require("../models/content_management/paragraphwriting");
const { Quizzes } = require("../models/content_management/quizzesModel");
const { QuizQuestion } = require("../models/content_management/quizQuestion");
const { QuizQuestionOption } = require("../models/content_management/quizQuestionOption");
const { PreDefinedQuestions } = require("../models/masters/predefinedQuestion");
const { PreDefinedOptions } = require("../models/masters/predefinedOption");

// Utility
const { generatePublicHash } = require("../utils/course_management/generateHash");

// Helper to guarantee a unique public_hash for a model (avoids duplicate key errors if generator collides)
async function uniquePublicHash(model, field = "public_hash") {
    let attempts = 0;
    while (attempts < 10) { // try a few times
        const candidate = await generatePublicHash();
        const exists = await model.findOne({ where: { [field]: candidate } });
        if (!exists) return candidate;
        attempts++;
    }
    // Fallback: append timestamp fragment to force uniqueness
    return (await generatePublicHash()) + Date.now().toString(36).slice(-4);
}

// Helper creators forcing id=1 style only if empty
async function findOrCreateOne(model, values) {
    const existing = await model.findOne({ where: { id: values.id || 1 } });
    if (existing) return existing;
    return model.create(values);
}

const ADMIN_ID = 1; // we assume an admin with id=1 exists
const baseAudit = { created_by: ADMIN_ID, updated_by: ADMIN_ID, created_by_type: "admin", updated_by_type: "admin" };

const defaultCourseForTesting = async () => {
    const t = await sequelize.transaction();
    try {
        // 1. Category
        const category = await findOrCreateOne(CourseCategory, { id: 1, category: "Programming", ...baseAudit });

        // 2. Course
        let course = await Course.findOne({ where: { id: 1 } });
        if (!course) {
            course = await Course.create({
                id: 1,
                sequence: 1, // required notNull field
                public_hash: await uniquePublicHash(Course),
                title: "Test Mini React Course",
                category_id: category.id,
                description: "A compact test course to validate seeding: includes one session, one module and five topics (video, audio, accordion, general and slide). Each description embeds tag references like #tag1# for downstream parsing and indexing.",
                price: 100,
                discount: 0,
                duration_minutes: 30,
                expiry_days: 30,
                min_access_minutes: 10,
                max_access_minutes: 120,
                what_you_will_learn: ["Understand seeding structure", "Interact with varied content types", "Observe tag usage #tag1#", "Preview quiz & assignments"],
                prerequisites: ["Basic JS", "Able to read code"],
                hashtags: ["#React", "#Test", "#tag1#"],
                thumbnail: "/course/thumbnail/react_basics.png",
                preview_video: "/course/preview_video/react_intro.mp4",
                created_by_type: "admin",
                updated_by_type: "admin",
                created_by: ADMIN_ID,
                updated_by: ADMIN_ID,
                status: "published"
            });
        } else {
            // backfill sequence/public_hash if absent
            const updates = {};
            if (course.sequence == null) updates.sequence = 1;
            if (!course.public_hash) updates.public_hash = await uniquePublicHash(Course);
            if (Object.keys(updates).length) await course.update(updates);
        }

        // 3. Course FAQ + options (single example)
        const faq = await findOrCreateOne(CourseFAQ, {
            id: 1,
            course_id: course.id,
            question: "Why this mini course?",
            ...baseAudit,
        });
        // options only if none exist
        // CourseFAQOption model uses column faq_id (not course_faq_id)
        const faqOptionCount = await CourseFAQOption.count({ where: { faq_id: faq.id } });
        if (!faqOptionCount) {
            await CourseFAQOption.bulkCreate([
                { faq_id: faq.id, option_text: "Testing seed", ...baseAudit },
                { faq_id: faq.id, option_text: "Demo content types", ...baseAudit },
                { faq_id: faq.id, option_text: "Validate migrations", ...baseAudit },
            ]);
        }

        // 4. Session
        const session = await findOrCreateOne(Session, {
            id: 1,
            course_id: course.id,
            title: "Getting Started Session",
            status: "active",
            min_time_in_minute: 5,
            sequence_no: 1,
            public_hash: await uniquePublicHash(Session),
            ...baseAudit,
        });
        // Backfill sequence if existing record lacked it
        if (session.sequence_no == null || !session.public_hash) {
            await session.update({
                sequence_no: session.sequence_no == null ? 1 : session.sequence_no,
                public_hash: session.public_hash || await uniquePublicHash(Session)
            });
        }

        // 5. Module
        const moduleRec = await findOrCreateOne(Module, {
            id: 1,
            course_id: course.id,
            session_id: session.id,
            title: "Core Content Module",
            duration_minutes: 30,
            status: "active",
            sequence_no: 1,
            public_hash: await uniquePublicHash(Module),
            ...baseAudit,
        });
        if (moduleRec.sequence_no == null || !moduleRec.public_hash) {
            await moduleRec.update({
                sequence_no: moduleRec.sequence_no == null ? 1 : moduleRec.sequence_no,
                public_hash: moduleRec.public_hash || await uniquePublicHash(Module)
            });
        }

        // Shared description lines builder with tag usage
        const lines = (heading) => (
            `${heading} overview line 1 with #tag1# code snippet indicator.\n` +
            `Line 2 elaborates context and references #tag1# for tagging engine.\n` +
            `Third line gives instructional detail about learning objective using #tag1#.\n` +
            `Fourth line stresses practical usage and metadata embedding #tag1#.\n` +
            `Fifth optional line ensures 4-5 lines length #tag1#.`
        );

        // 6. Topics (5 types)
        const topicsData = [
            { id: 1, title: "Intro Video", content_type: "video", sequence_no: 1, description: lines("Video Topic") },
            { id: 2, title: "Concept Audio", content_type: "audio", sequence_no: 2, description: lines("Audio Topic") },
            { id: 3, title: "Details Accordion", content_type: "accordian", sequence_no: 3, description: lines("Accordion Topic") },
            { id: 4, title: "General Reading", content_type: "general", sequence_no: 4, description: lines("General Topic") },
            { id: 5, title: "Mixed Slides", content_type: "slide", sequence_no: 5, description: lines("Slide Topic") },
        ];

        const topicRecords = [];
        for (const td of topicsData) {
            let topic = await Topic.findOne({ where: { id: td.id } });
            if (!topic) {
                topic = await Topic.create({
                    ...td,
                    module_id: moduleRec.id,
                    status: "active",
                    public_hash: await uniquePublicHash(Topic),
                    ...baseAudit,
                });
            }
            // Backfill missing sequence_no if previously null
            if (topic.sequence_no == null) {
                await topic.update({ sequence_no: td.sequence_no });
            }
            topicRecords.push(topic);
        }

        // Topic 1: Video (internal)
        if (!(await Video.findOne({ where: { topic_id: 1 } }))) {
            await Video.create({ topic_id: 1, url: "/video/react_intro.mp4", video_type: "internal", duration_minutes: 5, ...baseAudit });
        }
        // Tag referencing code (type code) and file image
        await ensureTags(1, { code: true, file: true });

        // Topic 2: Audio
        if (!(await Audio.findOne({ where: { topic_id: 2 } }))) {
            await Audio.create({ topic_id: 2, url: "/audio/jsx_info.mp3", duration_minutes: 4, ...baseAudit });
        }
        await ensureTags(2, { code: true, file: true });

        // Topic 3: Accordion with 3 sections each showing varying completion types (audio) and attachments as code examples
        if (!(await Accordion.findOne({ where: { topic_id: 3 } }))) {
            const accordionSections = [
                { title: "Section 1", body: lines("Accord 1"), codeLanguage: "javascript", code: "console.log('tag1');", completion_type: "audio", audio_url: "/audios/accordion/jsx_info.mp3" },
                { title: "Section 2", body: lines("Accord 2"), codeLanguage: "javascript", code: "function test(){return '#tag1#';}", completion_type: "audio", audio_url: "/audios/accordion/jsx_info.mp3" },
                { title: "Section 3", body: lines("Accord 3"), codeLanguage: "javascript", code: "const TAG='#tag1#';", completion_type: "audio", audio_url: "/audios/accordion/jsx_info.mp3" },
            ];
            for (const sec of accordionSections) {
                const rec = await Accordion.create({ topic_id: 3, ...sec, duration_minutes: await getAudioDurationInMinutes(sec.audio_url || null), ...baseAudit });
                // tag each accordion section
                await TopicTag.create({ topic_id: 3, accordionId: rec.id, tag_file_type: "code", code_language: "javascript", tag: "#tag1#", tag_file_path: 'console.log("#tag1#")', ...baseAudit });
            }
        }
        await ensureTags(3, { code: true, file: true });

        // Topic 4: General Material (Updated schema: core + multiple materials in tbl_materials)
        if (!(await GeneralMaterial.findOne({ where: { topic_id: 4 } }))) {
            const gm = await GeneralMaterial.create({
                topic_id: 4,
                title: "Reading Assets",
                description: lines("General Material Updated Schema"),
                codeLanguage: "javascript",
                code: "console.log('#tag1#');",
                completion_type: "audio",
                audio_url: "/audios/general/jsx_info.mp3",
                duration_minutes: await getAudioDurationInMinutes("/audios/general/jsx_info.mp3"),
                ...baseAudit
            });
            // Attach multiple auxiliary materials
            await Material.bulkCreate([
                { topic_id: gm.topic_id, material_type: 'pdf', url: '/general/pdf/react_info.pdf', ...baseAudit },
                { topic_id: gm.topic_id, material_type: 'document', url: '/general/document/react_notes.docx', ...baseAudit },
                { topic_id: gm.topic_id, material_type: 'link', url: 'https://react.dev/learn', ...baseAudit }
            ]);
        }
        await ensureTags(4, { code: true, file: true });

        // Topic 5: Multi Slide (with 4 slides: video, audio, accordion, general)
        if (!(await MultiSlide.findOne({ where: { topic_id: 5 } }))) {
            const slides = [
                { title: "Slide Video", sequence_no: 1, type: "video", description: lines("Slide Video"), completion_type: "audio", audio_url: "/audios/multi_slide/jsx_info.mp3" },
                // { title: "Slide Audio", type: "audio", description: lines("Slide Audio"), completion_type: "audio", audio_url: "/audios/multi_slide/jsx_info.mp3" },
                { title: "Slide Accordion", sequence_no: 2, type: "accordian", description: lines("Slide Accordion"), completion_type: "audio", audio_url: "/audios/multi_slide/jsx_info.mp3" },
                // { title: "Slide General", type: "general", description: lines("Slide General"), completion_type: "audio", audio_url: "/audios/multi_slide/jsx_info.mp3" },
            ];
            let computedSlidesTopicDuration = 0;
            for (const s of slides) {
                let slideDur = 0;
                if (s.type === "video") {
                    slideDur = 2;
                } else if (s.type === "accordian") {
                    slideDur = await getAudioDurationInMinutes(s.audio_url || null);
                }
                const slideExtra = s.slide_extra_duration || 0;
                computedSlidesTopicDuration += slideDur + slideExtra;

                const slide = await MultiSlide.create({
                    topic_id: 5,
                    ...s,
                    slide_duration: slideDur,
                    slide_extra_duration: slideExtra,
                    total_slide_duration: slideDur + slideExtra,
                    ...baseAudit
                });
                if (s.type === "video") {
                    await MultiSlideVideo.create({ multi_slide_id: slide.id, url: "/multiSlide/video/react_intro.mp4", type: "internal", duration_minutes: 2, ...baseAudit });
                    // } else if (s.type === "audio") {
                    //     await MultiSlideAudio.create({ multi_slide_id: slide.id, url: "/multiSlide/audio/jsx_info.mp3", duration_minutes: 2, ...baseAudit });
                } else if (s.type === "accordian") {
                    const acc = await MultiSlideAccordion.create({ multi_slide_id: slide.id, title: "Slide Acc Section", body: lines("Slide Acc Body"), codeLanguage: "javascript", code: "console.log('code example');", completion_type: "audio", audio_url: "/audios/multi_slide/jsx_info.mp3", ...baseAudit });
                    // Add attachments for this multislide accordion
                    await MultiSlideAccordionAttachment.bulkCreate([
                        { accordionId: acc.id, fileUrl: "/multiSlide/video/react_intro.mp4", fileType: "video" },
                        { accordionId: acc.id, fileUrl: "/multiSlide/audio/jsx_info.mp3", fileType: "audio" },
                        { accordionId: acc.id, fileUrl: "/multiSlide/general/pdf/react_info.pdf", fileType: "document" },
                    ]);
                    // attachments demonstration (video)
                    await TopicTag.create({ topic_id: 5, slide_id: slide.id, accordionId: acc.id, tag_file_type: "code", code_language: "javascript", tag: "#tag1#", tag_file_path: "console.log('#tag1#');", ...baseAudit });
                } else if (s.type === "general") {
                    // Create general slide core (no single material fields now)
                    const msg = await MultiSlideGeneral.create({
                        multi_slide_id: slide.id,
                        codeLanguage: 'javascript',
                        code: "console.log('#tag1#');",
                        ...baseAudit
                    });
                    // await Material.bulkCreate([
                    //     { slide_general_id: msg.id, material_type: 'pdf', url: '/multiSlide/general/pdf/react_info.pdf', ...baseAudit },
                    //     // { slide_general_id: msg.id, material_type: 'image', url: '/multiSlide/general/images/react_diagram.png', ...baseAudit },
                    //     { slide_general_id: msg.id, material_type: 'link', url: 'https://react.dev/reference', ...baseAudit }
                    // ]);
                }
                // tag each slide
                await TopicTag.create({ topic_id: 5, slide_id: slide.id, tag_file_type: "code", code_language: "javascript", tag: "#tag1#", tag_file_path: "console.log('#tag1#');", ...baseAudit });
            }

            await Topic.update(
                {
                    topic_duration: computedSlidesTopicDuration,
                    total_duration: computedSlidesTopicDuration,
                },
                { where: { id: 5 } }
            );
        }
        await ensureTags(5, { code: true, file: true });

        // 7. Assignments: regular, matching, fill_in_the_blanks, paragraph_writing
        const assignmentBase = { module_id: moduleRec.id, max_score: 100, max_attempt: 1, days_to_complete: 7, status: "active", ...baseAudit };
        const existingAssignments = await Assignment.findAll({ where: { module_id: moduleRec.id } });
        if (!existingAssignments.length) {
            const regular = await Assignment.create({ ...assignmentBase, title: "Regular Assignment", category: "regular", description: lines("Regular Assignment"), file: "/material/pdf/react_info.pdf" });
            const matching = await Assignment.create({ ...assignmentBase, title: "Matching Assignment", category: "matching", description: lines("Matching Assignment") });
            const fill = await Assignment.create({ ...assignmentBase, title: "Fill Blanks Assignment", category: "fill_in_the_blanks", description: lines("Fill Blanks Assignment") });
            const paragraph = await Assignment.create({ ...assignmentBase, title: "Paragraph Writing Assignment", category: "paragraph_writing", description: lines("Paragraph Writing Assignment") });

            // Matching questions/options
            const mq = await MatchingQuestion.create({ assignment_id: matching.id, question_text: "Match term to definition #tag1#", ...baseAudit });
            await MatchingOption.bulkCreate([
                { question_id: mq.id, option_text: "JS", option_type: "text", match_text: "JavaScript", match_type: "text", ...baseAudit },
                { question_id: mq.id, option_text: "DOM", option_type: "text", match_text: "Document Object Model", match_type: "text", ...baseAudit },
            ]);
            // Fill in the blanks
            await FillTheBlanksQuestion.create({ assignment_id: fill.id, question_text: "React uses a ______ DOM to optimize updates #tag1#", answers: ["virtual"], ...baseAudit });
            // Paragraph writing
            await ParagraphWriting.create({ assignment_id: paragraph.id, paragraph: "Paragraph about virtual DOM", ...baseAudit });
        }

        // 8. Quiz with multiple question types & one predefined question
        let quiz = await Quizzes.findOne({ where: { module_id: moduleRec.id } });
        if (!quiz) {
            quiz = await Quizzes.create({ module_id: moduleRec.id, title: "Module Quiz", duration_minutes: 10, passing_score: 50, max_attempts: 3, attempts_gap: 0, attempts_renew_days: 0, status: "active", quizType: "normal", ...baseAudit });

            // MCQ
            const mcqQ = await QuizQuestion.create({ quiz_id: quiz.id, type: "mcq", mcq_question_text: "What does JSX stand for? #tag1#", marks: 5, ...baseAudit });
            await QuizQuestionOption.bulkCreate([
                { question_id: mcqQ.id, type: "mcq", mcq_option_text: "JavaScript XML", mcq_is_correct: true, ...baseAudit },
                { question_id: mcqQ.id, type: "mcq", mcq_option_text: "Java Syntax Extension", mcq_is_correct: false, ...baseAudit },
            ]);
            // complete sentence
            // const completeQ = await QuizQuestion.create({ quiz_id: quiz.id, type: "complete the sentance", marks: 5, mcq_question_text: "React components must return a single _____ element. #tag1#", ...baseAudit });
            // await QuizQuestionOption.create({ question_id: completeQ.id, type: "complete_sentence", complate_correct_word: "root", complate_hint: "r", ...baseAudit });
            // dragdrop (object-based structure: each option needs id; blanks map position->correct_id)
            await QuizQuestion.create({
                quiz_id: quiz.id,
                type: "dragdrop",
                dragdrop_prompt: "In the React lifecycle, the phase when a component is first inserted into the DOM is ___, when it re-renders due to changes is ___, and when it is removed from the DOM is ___.",
                dragdrop_options: [
                    "Mounting",
                    "Updating",
                    "Unmounting"
                ],
                dragdrop_blanks: [
                    { position: 1, correct: "Mounting" },
                    { position: 2, correct: "Updating" },
                    { position: 3, correct: "Unmounting" }
                ],
                marks: 5,
                ...baseAudit
            });
            // audio to script
            await QuizQuestion.create({ quiz_id: quiz.id, type: "audiotoscript", audiotoscript_url: "/audiotoScript/jsx_info.mp3", audiotoscript_script: "virtual dom improves performance #tag1#", marks: 5, ...baseAudit });
            // real word
            await QuizQuestion.create({ quiz_id: quiz.id, type: "realword", realword_words: ["Hook", "State", "Prop"], realword_correct_answers: ["yes", "yes", "no"], marks: 5, ...baseAudit });
            // summarize passage
            await QuizQuestion.create({ quiz_id: quiz.id, type: "summarizepassage", summarizepassage_summary: "Explain virtual DOM #tag1#", summarizepassage_time_limit: 60, marks: 5, ...baseAudit });
            // best option
            await QuizQuestion.create({
                quiz_id: quiz.id,
                type: "bestoption",
                bestoption_passage: "React is a ____ library for building ____ UIs.",
                // Use richer structure (array of objects) similar to defaultCourse3 style
                bestoption_blanked_words: [
                    { word: "JavaScript", options: ["JavaScript", "Python", "C#", "Ruby"], position: 1 },
                    { word: "interactive", options: ["interactive", "static", "database", "server"], position: 2 }
                ],
                marks: 5,
                ...baseAudit
            });
            // arrange order
            // await QuizQuestion.create({ quiz_id: quiz.id, type: "arrangeorder", arrangeorder_prompt: "Order React hook execution #tag1#", sentences: ["useState", "useEffect", "cleanup"], correct_order: [0, 1, 2], marks: 5, ...baseAudit });

            // // Predefined question + options
            // const preQ = await PreDefinedQuestions.create({ question_text: "What is React? #tag1#", question_type: "mcq", marks: 5, sequence_no: 1, is_active: true, ...baseAudit });
            // await PreDefinedOptions.bulkCreate([
            //     { pre_defined_question_id: preQ.id, option_text: "A UI library", is_correct: true, ...baseAudit },
            //     { pre_defined_question_id: preQ.id, option_text: "A database", is_correct: false, ...baseAudit },
            // ]);
        }

        await t.commit();
        console.log("Default test course seeded (id=1) ✅");
    } catch (err) {
        await t.rollback();
        console.error("Seeding failed", err);
    }
};

// helper to create tags (code + file image stub)
async function ensureTags(topicId, { code, file }) {
    if (code) {
        const [tagRec, created] = await TopicTag.findOrCreate({
            where: { topic_id: topicId, tag: "#tag1#", tag_file_type: "code" },
            defaults: {
                topic_id: topicId,
                tag: "#tag1#",
                tag_file_type: "code",
                code_language: "javascript",
                tag_file_path: "console.log('#tag1#');",
                created_by: ADMIN_ID,
                updated_by: ADMIN_ID,
                created_by_type: "admin",
                updated_by_type: "admin",
                status: "approved",
            },
        });
        if (!created && !tagRec.tag_file_path) {
            await tagRec.update({ tag_file_path: "// example code referencing #tag1#" });
        }
    }
    if (file) {
        const [fileTag, createdFile] = await TopicTag.findOrCreate({
            where: { topic_id: topicId, tag_file_type: "file" },
            defaults: {
                topic_id: topicId,
                tag_file_type: "file",
                tag_file_path: "/tags/react_basics.png",
                tag: "#tag1#",
                created_by: ADMIN_ID,
                updated_by: ADMIN_ID,
                created_by_type: "admin",
                updated_by_type: "admin",
                status: "approved",
            },
        });
        if (!createdFile && !fileTag.tag_file_path) {
            await fileTag.update({ tag_file_path: "/tags/react_basics.png" });
        }
    }
}

module.exports = defaultCourseForTesting;