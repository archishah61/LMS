/**
 * New Course Generator Controller
 * 
 * Handles AI-powered course structure generation with two modes:
 * - Quick Course: Total duration under 4 hours, concise content
 * - Complete Course: Comprehensive coverage of all topics in depth
 * 
 * Integrates with Gemini AI for structured course generation.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require("pdf-parse");
let mammoth;
try {
    mammoth = require("mammoth");
} catch (e) {
    console.warn("⚠️ mammoth is not installed. DOC/DOCX extraction will fail if used.");
}

const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");

// Import Database Models for Saving
const Course = require("../../models/course_management/course");
const Session = require("../../models/course_management/session");
const Module = require("../../models/course_management/module");
const Topic = require("../../models/course_management/topic");
const { MultiSlide } = require("../../models/content_management/multi_slide");
const { GeneralMaterial } = require("../../models/content_management/genral");
const { Accordion } = require("../../models/content_management/accordian");
const { MultiSlideGeneral } = require("../../models/content_management/multiSlideGeneral");
const { MultiSlideAccordion } = require("../../models/content_management/multiSlideAccordian");
const { Video } = require("../../models/content_management/video");
const { Audio } = require("../../models/content_management/audio");
const { CourseCategory } = require("../../models/masters/courseCatagory");
const { generatePublicHash } = require("../../utils/course_management/generateHash");


// ─── Configuration ───────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const GEMINI_MODEL = "gemini-2.5-flash";

// ─── File Text Extraction Utilities ──────────────────────────────────────────

/**
 * Extract text from PDF files
 */
const extractTextFromPDF = async (filePath) => {
    try {
        const dataBuffer = await fsp.readFile(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        throw new Error(`PDF extraction failed: ${error.message}`);
    }
};

/**
 * Extract text from Word documents (DOC/DOCX)
 */
const extractTextFromWord = async (filePath) => {
    try {
        if (!mammoth) {
            throw new Error("mammoth package is not installed. Please contact support or upload a PDF instead.");
        }
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } catch (error) {
        throw new Error(`Word document extraction failed: ${error.message}`);
    }
};

/**
 * Universal file text extractor - handles PDF and DOC/DOCX
 */
const extractTextFromFile = async (file) => {
    const { path: filePath, mimetype, originalname } = file;

    try {
        let extractedText = "";

        switch (mimetype) {
            case "application/pdf":
                extractedText = await extractTextFromPDF(filePath);
                break;
            case "application/msword":
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                extractedText = await extractTextFromWord(filePath);
                break;
            default:
                throw new Error(`Unsupported file type: ${mimetype}. Only PDF and DOC/DOCX files are accepted.`);
        }

        return {
            filename: originalname,
            type: mimetype,
            text: extractedText,
            length: extractedText.length,
        };
    } catch (error) {
        console.error(`Error extracting text from ${originalname}:`, error);
        return {
            filename: originalname,
            type: mimetype,
            text: "",
            error: error.message,
        };
    }
};

/**
 * Clean up uploaded files after processing
 */
const cleanupFiles = async (files) => {
    if (!files || !Array.isArray(files)) return;

    for (const file of files) {
        try {
            await fsp.unlink(file.path);
        } catch (error) {
            console.error(`Error deleting file ${file.path}:`, error);
        }
    }
};

// ─── JSON Parsing Utility ────────────────────────────────────────────────────

/**
 * Extracts the first valid JSON object from raw text
 */
const extractJSONObject = (text) => {
    if (typeof text !== "string") return null;

    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        return null;
    }

    return text.slice(firstBrace, lastBrace + 1);
};

/**
 * Robust JSON parser with cleaning and error diagnostics
 */
const jsonParser = (rawText) => {
    let cleaned;
    try {
        if (!rawText || typeof rawText !== "string") {
            throw new Error("Input must be a non-empty string");
        }

        // Remove markdown code block wrappers
        const jsonOnly = extractJSONObject(rawText);
        if (!jsonOnly) {
            throw new Error("No valid JSON object found in response");
        }

        cleaned = jsonOnly.trim();

        // Clean control characters and fix common JSON issues
        cleaned = cleaned
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
            .replace(/[\r\n\t]/g, " ")
            .replace(/,(\s*[}\]])/g, "$1");

        const parsed = JSON.parse(cleaned);
        return parsed;
    } catch (error) {
        console.error("❌ Failed to parse AI response JSON:", error.message);

        if (cleaned) {
            console.error("🧹 Cleaned input preview (first 500 chars):");
            console.error(cleaned.slice(0, 500));
        }

        throw new Error(`Failed to parse AI response: ${error.message}`);
    }
};

// ─── Gemini Prompt Builder ───────────────────────────────────────────────────

/**
 * Builds a structured Gemini prompt based on course type and inputs
 * 
 * @param {string} prompt - User's course description/prompt
 * @param {string} courseType - "quick" or "complete"
 * @param {string} fileContent - Extracted text from uploaded reference file (optional)
 * @returns {string} - The formatted Gemini prompt
 */
const buildCoursePrompt = (prompt, courseType, fileContent) => {
    const courseTypeRules = courseType === "quick"
        ? `
### Course Type: QUICK COURSE
- Total course duration MUST be UNDER 4 HOURS (240 minutes maximum)
- Keep content concise and focused on the most essential topics
- Limit to 2-3 sessions maximum
- Each session should have 1-2 modules
- Each module should have 2-4 topics
- Focus on key concepts only, skip advanced or niche topics
- Time distribution should be tight and efficient
        `
        : `
### Course Type: COMPLETE COURSE
- Cover ALL topics in comprehensive depth
- No time restriction - course should be as long as needed for full coverage
- Include 3-6 sessions for thorough coverage
- Each session should have 2-4 modules
- Each module should have 4-8 topics
- Include detailed explanations, examples, and advanced concepts
- Ensure progressive learning from fundamentals to advanced topics
- Cover edge cases, best practices, and real-world applications
        `;

    const fileContentSection = fileContent
        ? `
### Reference File Content
The user has provided a reference document. Use this content as the primary source for structuring the course. 
Extract key topics, concepts, and hierarchies from this content:

--- BEGIN FILE CONTENT ---
${fileContent}
--- END FILE CONTENT ---
        `
        : "";

    return `
You are an expert course designer AI. Your task is to generate a well-structured, hierarchical course structure based on the user's request.

### User's Course Request
${prompt}

${courseTypeRules}

${fileContentSection}

### Requirements

1. **Course Level**
   - courseTitle: A professional, descriptive title (max 10 words)
   - courseDescription: A detailed 2-3 sentence description
   - totalDuration: Total estimated duration string (e.g., "3 hours 30 minutes")
   - totalDurationMinutes: Total duration in minutes (number)
   - what_you_will_learn: An array of strings representing key takeaways or learning outcomes.
   - prerequisites: An array of strings outlining what is needed to take this course.
   - skill_development: An array of objects detailing the skills developed, each containing a "title" string and a "statements" array of strings.
   - thumbnailDescription: A detailed visual description of an image suitable as a thumbnail for this course. Write a text prompt/description, do not generate an image.
   - previewVideoDescription: A text description with timestamps for a course preview video. Total video duration must be less than 1 minute. Provide timestamped scenes (e.g., "[0:00-0:10] Hook and intro...", "[0:10-0:30] Course overview..."). Write text only.

2. **Session Level**
   - sessionTitle: Clear, descriptive title for each session
   - sessionDuration: Duration string for this session
   - sessionDurationMinutes: Duration in minutes (number)
   - Sessions should follow logical progression from basics to advanced

3. **Module Level**
   - moduleTitle: Descriptive module title
   - moduleDuration: Duration string for this module
   - moduleDurationMinutes: Duration in minutes (number)
   - Each module groups related topics together

4. **Topic Level**
   - topicTitle: Specific, clear topic title
   - topicDescription: A brief 4-5 sentence description of what will be taught in this topic
   - topicDuration: Duration string (e.g., "15 minutes")
   - topicDurationMinutes: Duration in minutes (number)
   - topicType: MUST be exactly one of ["video", "audio", "general", "accordion", "multislides"]. **CRITICAL: You must use a diverse mixture of these types throughout the course. Do not just use 'general'.**
   - Topics should be atomic learning units
   - **IF topicType is "multislides"**, you MUST include a "slides" array within the topic containing individual slides.

5. **Slide Level (Only if topicType is "multislides")**
   - slideTitle: Specific title for the slide
   - slideDescription: A brief 2-3 sentence description of the slide content
   - slideDuration: Duration string (e.g., "5 minutes")
   - slideDurationMinutes: Duration in minutes (number)
   - slideType: MUST be exactly one of ["video", "audio", "general", "accordion"]. **CRITICAL: You must use a diverse mixture of slide types within the slides array. Do not just use 'general'. Use video, audio, and accordion where they make logical sense.**

### Time Distribution Rules
- Sum of all session durations must equal total course duration
- Sum of all module durations within a session must equal session duration
- Sum of all topic durations within a module must equal module duration
- If topicType is "multislides", sum of all slide durations within the topic must equal topic duration
- Ensure realistic time estimates for each learning unit

### Output Format
Return ONLY valid JSON in this EXACT structure. No extra text, no explanations, no markdown:

{
  "courseTitle": "Course Title Here",
  "courseDescription": "Detailed description of the course...",
  "totalDuration": "X hours Y minutes",
  "totalDurationMinutes": 210,
  "what_you_will_learn": ["Principles of Evolution", "Hominid Species and Traits"],
  "prerequisites": ["Intermediate English language proficiency", "Basic computer skills for accessing online content"],
  "skill_development": [{"title": "Advanced Language Mastery", "statements": ["Develop a rich vocabulary.", "Master complex grammatical structures."]}],
  "thumbnailDescription": "A visually appealing thumbnail showing [subject] with [elements]...",
  "previewVideoDescription": "[0:00-0:15] Inspiring intro scene... [0:15-0:45] Montage of course topics... [0:45-1:00] Call to action...",
  "sessions": [
    {
      "sessionTitle": "Session 1 Title",
      "sessionDuration": "X hours Y minutes",
      "sessionDurationMinutes": 90,
      "modules": [
        {
          "moduleTitle": "Module 1.1 Title",
          "moduleDuration": "X minutes",
          "moduleDurationMinutes": 45,
          "topics": [
            {
              "topicTitle": "Topic Title (Standard)",
              "topicDescription": "Brief description of the topic...",
              "topicDuration": "15 minutes",
              "topicDurationMinutes": 15,
              "topicType": "video"
            },
            {
              "topicTitle": "Topic Title (Slides)",
              "topicDescription": "Brief description of the slides topic...",
              "topicDuration": "20 minutes",
              "topicDurationMinutes": 20,
              "topicType": "multislides",
              "slides": [
                {
                  "slideTitle": "Slide 1 Title",
                  "slideDescription": "Slide description here...",
                  "slideDuration": "10 minutes",
                  "slideDurationMinutes": 10,
                  "slideType": "general"
                },
                {
                  "slideTitle": "Slide 2 Title",
                  "slideDescription": "Another slide description...",
                  "slideDuration": "10 minutes",
                  "slideDurationMinutes": 10,
                  "slideType": "video"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

### Critical Rules
- Return ONLY the JSON object, nothing else
- Ensure the JSON is valid and properly formatted
- All duration minutes must be positive integers
- Maintain logical hierarchy: Course → Sessions → Modules → Topics
- Ensure proper time distribution at every level
- Generate meaningful, educational content structure
- Do NOT include any text before or after the JSON
    `.trim();
};

// ─── Controller: Generate Course Structure ───────────────────────────────────

/**
 * POST /api/new-generate-course
 * 
 * Accepts:
 * - prompt (string, required): Course description from user
 * - courseType (string, required): "quick" or "complete"
 * - referenceFile (file, optional): PDF or DOC/DOCX file
 * 
 * Returns structured JSON course hierarchy
 */

const generateNewCourse = async (req, res) => {
    try {
        const { prompt, courseType } = req.body;

        // ── Validation ────────────────────────────────────────────────────
        if (!prompt || !prompt.trim()) {
            return res.status(400).json({
                success: false,
                error: "Course prompt is required.",
            });
        }

        if (!courseType || !["quick", "complete"].includes(courseType)) {
            return res.status(400).json({
                success: false,
                error: 'Course type must be either "quick" or "complete".',
            });
        }

        console.log(`📚 Starting ${courseType} course generation...`);
        console.log(`📝 User prompt: "${prompt.substring(0, 100)}..."`);

        // ── Extract file content if uploaded ──────────────────────────────
        let fileContent = "";
        if (req.file) {
            console.log(`📄 Processing uploaded file: ${req.file.originalname}`);
            const extractionResult = await extractTextFromFile(req.file);

            if (extractionResult.text && !extractionResult.error) {
                fileContent = extractionResult.text;
                console.log(`✅ Extracted ${fileContent.length} characters from file`);
            } else if (extractionResult.error) {
                console.warn(`⚠️ File extraction warning: ${extractionResult.error}`);
            }
        }

        // ── Build and send prompt to Gemini ───────────────────────────────
        const geminiPrompt = buildCoursePrompt(prompt.trim(), courseType, fileContent);

        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const result = await model.generateContent(geminiPrompt);
        const response = await result.response;
        const text = await response.text();

        console.log("🤖 Received AI response, parsing...");

        // ── Parse and validate response ───────────────────────────────────
        const courseStructure = jsonParser(text);

        // Validate required fields
        if (!courseStructure.courseTitle || !courseStructure.sessions || !Array.isArray(courseStructure.sessions)) {
            throw new Error("Invalid course structure: missing courseTitle or sessions array");
        }

        // Validate session structure
        courseStructure.sessions.forEach((session, sIdx) => {
            if (!session.sessionTitle || !session.modules || !Array.isArray(session.modules)) {
                throw new Error(`Invalid session structure at index ${sIdx}`);
            }
            session.modules.forEach((module, mIdx) => {
                if (!module.moduleTitle || !module.topics || !Array.isArray(module.topics)) {
                    throw new Error(`Invalid module structure at session ${sIdx}, module ${mIdx}`);
                }
            });
        });

        console.log(`✅ Course generated successfully: "${courseStructure.courseTitle}"`);
        console.log(`   Sessions: ${courseStructure.sessions.length}`);
        console.log(`   Total Duration: ${courseStructure.totalDuration}`);

        // ── Cleanup uploaded file ─────────────────────────────────────────
        if (req.file) {
            await cleanupFiles([req.file]);
        }

        // ── Send response ─────────────────────────────────────────────────
        return res.status(200).json({
            success: true,
            message: "Course structure generated successfully",
            data: courseStructure,
        });

    } catch (error) {
        console.error("❌ Course generation failed:", error.message);

        // Cleanup file on error
        if (req.file) {
            await cleanupFiles([req.file]);
        }

        return res.status(500).json({
            success: false,
            error: error.message || "Failed to generate course structure",
        });
    }
};

// ─── Controller: Save Generated Course Structure ─────────────────────────────

const saveGeneratedCourse = async (req, res) => {
    try {
        const { courseData } = req.body;
        const userId = req.user?.id || 1;
        const role = req.user?.role || "admin";

        if (!courseData || !courseData.courseTitle) {
            return res.status(400).json({ success: false, error: "Invalid course data structure." });
        }

        // 1. Get a default category for the generated course
        let category = await CourseCategory.findOne();
        let category_id = category ? category.id : 1;

        // Save Thumbnail and Preview Video Descriptions to a .txt file
        const safeCourseName = courseData.courseTitle.replace(/[^a-zA-Z0-9\-_ ]/g, "").trim().replace(/\s+/g, "_");
        const courseFolder = path.join(__dirname, `../../generated_courses/${safeCourseName}`);
        
        if (!fs.existsSync(courseFolder)) {
            await fsp.mkdir(courseFolder, { recursive: true });
        }

        const descriptionsFilePath = path.join(courseFolder, "course_descriptions.txt");
        const textualContent = `Course Title: ${courseData.courseTitle}\n\n=== Thumbnail Description ===\n${courseData.thumbnailDescription || 'N/A'}\n\n=== Preview Video Description ===\n${courseData.previewVideoDescription || 'N/A'}\n`;
        await fsp.writeFile(descriptionsFilePath, textualContent, "utf8");

        // 2. Insert Course
        const newCourse = await Course.create({
            title: courseData.courseTitle,
            description: courseData.courseDescription,
            duration_minutes: courseData.totalDurationMinutes || 0,
            sequence: 1, // Default sequence
            category_id,
            price: 0,
            expiry_days: 365,
            status: "draft",
            thumbnail: "course_image.png", // Dummy file name
            preview_video: ["preview_video.mp4"], // Dummy array
            what_you_will_learn: courseData.what_you_will_learn || null,
            prerequisites: courseData.prerequisites || null,
            skill_development: courseData.skill_development || null,
            created_by: userId,
            created_by_type: role,
            updated_by: userId,
            updated_by_type: role,
        });

        // Generate and update Course public hash
        newCourse.public_hash = generatePublicHash(newCourse.id);
        await newCourse.save();

        const course_id = newCourse.id;

        // 3. Iterate over Sessions
        if (courseData.sessions && Array.isArray(courseData.sessions)) {
            for (let sIdx = 0; sIdx < courseData.sessions.length; sIdx++) {
                const sessionData = courseData.sessions[sIdx];
                
                const newSession = await Session.create({
                    course_id: course_id,
                    title: sessionData.sessionTitle,
                    min_time_in_minute: sessionData.sessionDurationMinutes || 0,
                    sequence_no: sIdx + 1,
                    status: "active",
                    created_by: userId,
                    created_by_type: role,
                    updated_by: userId,
                    updated_by_type: role,
                });

                newSession.public_hash = generatePublicHash(newSession.id);
                await newSession.save();

                // 4. Iterate over Modules
                if (sessionData.modules && Array.isArray(sessionData.modules)) {
                    for (let mIdx = 0; mIdx < sessionData.modules.length; mIdx++) {
                        const moduleData = sessionData.modules[mIdx];
                        
                        const newModule = await Module.create({
                            course_id: course_id,
                            session_id: newSession.id,
                            title: moduleData.moduleTitle,
                            duration_minutes: moduleData.moduleDurationMinutes || 0,
                            sequence_no: mIdx + 1,
                            status: "active",
                            created_by: userId,
                            created_by_type: role,
                            updated_by: userId,
                            updated_by_type: role,
                        });

                        newModule.public_hash = generatePublicHash(newModule.id);
                        await newModule.save();

                        // 5. Iterate over Topics
                        if (moduleData.topics && Array.isArray(moduleData.topics)) {
                            for (let tIdx = 0; tIdx < moduleData.topics.length; tIdx++) {
                                const topicData = moduleData.topics[tIdx];

                                // Map generative structure topicType to DB Enum
                                let rawType = topicData.topicType?.toLowerCase() || "general";
                                let mappedType = "general";
                                if (["video", "audio", "general", "slide"].includes(rawType)) {
                                    mappedType = rawType;
                                } else if (rawType === "accordion" || rawType === "accordian") {
                                    mappedType = "accordian";
                                } else if (rawType === "multislides") {
                                    mappedType = "slide";
                                }

                                const newTopic = await Topic.create({
                                    module_id: newModule.id,
                                    title: topicData.topicTitle,
                                    description: topicData.topicDescription || "Topic created by AI course generator",
                                    content_type: mappedType,
                                    sequence_no: tIdx + 1,
                                    status: "active",
                                    total_duration: topicData.topicDurationMinutes || 0,
                                    topic_duration: topicData.topicDurationMinutes || 0,
                                    extra_duration: 0,
                                    created_by: userId,
                                    created_by_type: role,
                                    updated_by: userId,
                                    updated_by_type: role,
                                });

                                newTopic.public_hash = generatePublicHash(newTopic.id);
                                await newTopic.save();

                                // If the topic is 'slide' (multislides) and there are slides, insert them:
                                if (mappedType === "slide" && topicData.slides && Array.isArray(topicData.slides)) {
                                    for (let slideIdx = 0; slideIdx < topicData.slides.length; slideIdx++) {
                                        const slide = topicData.slides[slideIdx];
                                        
                                        let slideRawType = slide.slideType?.toLowerCase() || "general";
                                        let slideMappedType = "general";
                                        let completionType = "audio"; // default
                                        
                                        if (slideRawType === "video") {
                                            slideMappedType = "video";
                                            completionType = "video";
                                        } else if (slideRawType === "accordion" || slideRawType === "accordian") {
                                            slideMappedType = "accordian";
                                        } else if (slideRawType === "audio") {
                                            slideMappedType = "general";
                                            completionType = "audio";
                                        }

                                        await MultiSlide.create({
                                            topic_id: newTopic.id,
                                            title: slide.slideTitle,
                                            description: slide.slideDescription || "Slide created by AI",
                                            type: slideMappedType,
                                            completion_type: completionType,
                                            sequence_no: slideIdx + 1,
                                            slide_duration: slide.slideDurationMinutes || 0,
                                            slide_extra_duration: 0,
                                            total_slide_duration: slide.slideDurationMinutes || 0,
                                            created_by: userId,
                                            created_by_type: role,
                                            updated_by: userId,
                                            updated_by_type: role,
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return res.status(200).json({ 
            success: true, 
            message: "Course mapped and saved successfully to the database", 
            courseId: newCourse.id,
            public_hash: newCourse.public_hash 
        });

    } catch (error) {
        console.error("❌ Save generated course failed:", error.message);
        return res.status(500).json({
            success: false,
            error: error.message || "Failed to save course structure",
        });
    }
};

// ─── Controller: Generate Course Detailed Content ──────────────────────────────

const buildSessionContentPrompt = (sessionData) => {
    return `
You are an expert course content generator AI.
I am providing you with a single Session object from a course (containing Modules, Topics, Slides) in JSON format.
Your job is to read the ENTIRE structure of this session, and RETURN a NEW JSON structure exactly matching the hierarchy of what I provided (modules -> topics -> slides), BUT with a new property called 'contentGenerated' nested securely inside EVERY Topic object and Slide object.

CRITICAL EXCEPTION FOR UNSELECTED TOPICS:
If a topic or slide has the property 'isSelected': false, you MUST completely SKIP generation for it. Simply return that node EXACTLY as it is without adding 'contentGenerated'.

Here are the strict RULES for generating 'contentGenerated' based on the object's existing 'topicType' or 'slideType':

1. If type is "video" (Topic or Slide):
   { "timestamps": [{ "timestamp": "0:00 - 0:30", "description": "..." }, { "timestamp": "0:30 - 1:00", "description": "..." }, ...], "totalDuration": "..." }
   CRITICAL RULES FOR VIDEO:
   - Divide the total duration into exactly 30-second intervals (e.g., 0:00 - 0:30, 0:30 - 1:00, 1:00 - 1:30, etc.).
   - EVERY 30-second segment MUST have a UNIQUE, SPECIFIC description. Do NOT repeat or rephrase the same description across segments.
   - Each description must read like a video script: describe exactly what visuals should appear on screen, what the narrator should explain, what diagrams/animations/examples should be shown during those 30 seconds.
   - Progress through the topic logically: introduce the concept, then explain details, then show examples, then summarize — each segment must advance the content forward.

2. If type is "audio" (Topic or Slide):
   { "timestamps": [{ "timestamp": "0:00 - 0:30", "description": "..." }, { "timestamp": "0:30 - 1:00", "description": "..." }, ...], "totalDuration": "..." }
   CRITICAL RULES FOR AUDIO:
   - Divide the total duration into exactly 30-second intervals (e.g., 0:00 - 0:30, 0:30 - 1:00, 1:00 - 1:30, etc.).
   - EVERY 30-second segment MUST have a UNIQUE, SPECIFIC description. Do NOT repeat or rephrase the same description across segments.
   - Each description must read like an audio narration script: describe exactly what the speaker should say, what concepts to explain, what examples to give during those 30 seconds.
   - Progress through the topic logically: introduce the concept, then explain key points, then provide examples, then conclude — each segment must advance the content forward.

3. If type is "general" (Topic or Slide):
   { 
     "title": "...", // restate title
     "description": "highly detailed text explaining the concept", 
     "completionType": "audio", // OR "timer"
     "audioTimestamps": [{ "timestamp": "0:00 - ...", "description": "..." }], // if audio
     "duration": "string" // if timer
   }

4. If type is "accordion" or "accordian" (Topic or Slide):
   Divide the topic into sensible multiple subtopics.
   {
     "subtopics": [
        {
           "title": "...",
           "description": "highly detailed text",
           "completionType": "audio", // OR "timer"
           "audioTimestamps": [], // if audio
           "duration": "string" // if timer
        }
     ]
   }

5. If type is "multislides" (Topic only):
   Do NOT generate subtopics for the topic itself. Just provide a brief introduction/description for the topic.
   {
     "title": "...", // restate title
     "description": "A brief introduction or summary for the slides in this topic.",
     "completionType": "timer",
     "duration": "1 minute"
   }
   NOTE: You MUST still generate 'contentGenerated' for EVERY individual slide inside the "slides" array based on their respective "slideType".

Original Session JSON:
${JSON.stringify(sessionData)}

CRITICAL RULES:
- RETURN ONLY VALID JSON mirroring the original session object completely.
- Do NOT skip any modules, topics or slides in the payload. They must all map exactly.
- Keep the descriptions highly formatted, educational, and thorough. 
- DO NOT wrap the result in \`\`\`json ... \`\`\`. Output raw valid JSON.
`.trim();
};

const generateCourseContent = async (req, res) => {
    try {
        const { courseData } = req.body;

        if (!courseData || !courseData.sessions) {
            return res.status(400).json({ success: false, error: "Invalid course data passed for content generation." });
        }

        console.log("📚 Starting detailed content generation in parallel across sessions...");
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        // Map over each session and run them concurrently
        const detailedSessionsPromises = courseData.sessions.map(async (session, idx) => {
            // Check if ANY topic is selected in this session. If not, return the session as is without wasting AI tokens.
            let hasSelectedTopics = false;
            session.modules?.forEach(m => {
                 m.topics?.forEach(t => {
                      if (t.isSelected !== false) hasSelectedTopics = true;
                 });
            });

            if (!hasSelectedTopics) {
                 return session;
            }

            console.log(`⏳ Generating content for session ${idx + 1}/${courseData.sessions.length}...`);
            const prompt = buildSessionContentPrompt(session);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = await response.text();
            
            try {
                return jsonParser(text);
            } catch (err) {
                 console.error(`Error parsing session ${idx+1}:`, err);
                 throw new Error(`Failed to parse AI response for session ${idx+1}: ${err.message}`);
            }
        });

        const detailedSessions = await Promise.all(detailedSessionsPromises);
        
        // Reconstruct full course data
        const detailedCourse = {
            ...courseData,
            sessions: detailedSessions
        };

        console.log("✅ Received and assembled all detailed AI session content!");

        return res.status(200).json({
            success: true,
            message: "Course content generated successfully",
            data: detailedCourse,
        });

    } catch (error) {
        console.error("❌ Content generation failed:", error.message);
        return res.status(500).json({
            success: false,
            error: error.message || "Failed to generate detailed content",
        });
    }
};

const saveGeneratedCourseContent = async (req, res) => {
    try {
        const { courseId, courseTitle, sessionIndex, moduleIndex, topicIndex, topicData } = req.body;
        const userId = req.user?.id || 1;
        const role = req.user?.role || "admin";

        if (!courseId || !topicData || sessionIndex === undefined || moduleIndex === undefined || topicIndex === undefined) {
            return res.status(400).json({ success: false, error: "Invalid data." });
        }

        const safeCourseName = (courseTitle || "Course").replace(/[^a-zA-Z0-9\-_ ]/g, "").trim().replace(/\s+/g, "_");
        const courseFolder = path.join(__dirname, `../../generated_courses/${safeCourseName}`);
        
        if (!fs.existsSync(courseFolder)) {
            await fsp.mkdir(courseFolder, { recursive: true });
        }
        const mediaFilePath = path.join(courseFolder, "media_descriptions.txt");
        let mediaContent = "";

        // First time initialization logic (if it's the first topic)
        if (sessionIndex === 0 && moduleIndex === 0 && topicIndex === 0) {
             mediaContent = `Media Descriptions for Course: ${courseTitle}\n======================================================\n`;
        }

        // Load DB structure sequentially
        const sessionDBList = await Session.findAll({ where: { course_id: courseId }, order: [['sequence_no', 'ASC']] });
        const sessionDB = sessionDBList[sessionIndex];
        if (!sessionDB) return res.status(404).json({ success: false, error: "Session not found." });

        const moduleDBList = await Module.findAll({ where: { session_id: sessionDB.id }, order: [['sequence_no', 'ASC']] });
        const moduleDB = moduleDBList[moduleIndex];
        if (!moduleDB) return res.status(404).json({ success: false, error: "Module not found." });

        const topicDBList = await Topic.findAll({ where: { module_id: moduleDB.id }, order: [['sequence_no', 'ASC']] });
        const topicDB = topicDBList[topicIndex];
        if (!topicDB) return res.status(404).json({ success: false, error: "Topic not found." });

        const content = topicData.contentGenerated;
        if (!content) return res.status(200).json({ success: true, message: "No content to save" });

        let rawType = topicData.topicType?.toLowerCase() || "general";

        // Handle Topic level Database Insertions
        if (rawType === "video") {
            await Video.create({
                topic_id: topicDB.id,
                url: "dummy_url.mp4",
                video_type: "internal",
                duration_minutes: topicDB.total_duration || 0,
                created_by: userId,
                updated_by: userId,
                created_by_type: role,
                updated_by_type: role
            });
            mediaContent += `\n\n=== VIDEO: ${topicDB.title} ===\n`;
            if (content.timestamps) mediaContent += content.timestamps.map(ts => `[${ts.timestamp}] ${ts.description}`).join("\n");
        } else if (rawType === "audio") {
            await Audio.create({
                topic_id: topicDB.id,
                url: "dummy_url.mp3",
                duration_minutes: topicDB.total_duration || 0,
                created_by: userId,
                updated_by: userId,
                created_by_type: role,
                updated_by_type: role
            });
            mediaContent += `\n\n=== AUDIO: ${topicDB.title} ===\n`;
            if (content.timestamps) mediaContent += content.timestamps.map(ts => `[${ts.timestamp}] ${ts.description}`).join("\n");
        } else if (rawType === "accordion" || rawType === "accordian") {
            if (content.subtopics) {
                for (const sub of content.subtopics) {
                    await Accordion.create({
                        topic_id: topicDB.id,
                        title: sub.title || "Subtopic",
                        body: sub.description || "",
                        completion_type: sub.completionType || "audio",
                        duration_minutes: 0,
                        created_by: userId,
                        updated_by: userId,
                        created_by_type: role,
                        updated_by_type: role
                    });
                }
            }
        } else if (rawType === "general") {
            await GeneralMaterial.create({
                topic_id: topicDB.id,
                title: content.title || topicDB.title,
                description: content.description || "",
                completion_type: content.completionType || "audio",
                duration_minutes: topicDB.total_duration || 0,
                created_by: userId,
                updated_by: userId,
                created_by_type: role,
                updated_by_type: role
            });
        } else if (rawType === "multislides" || rawType === "slide") {
            if (topicData.slides && topicData.slides.length > 0) {
                const slidesDB = await MultiSlide.findAll({ where: { topic_id: topicDB.id }, order: [['sequence_no', 'ASC']] });
                
                for (let slIdx = 0; slIdx < slidesDB.length; slIdx++) {
                    const slideDB = slidesDB[slIdx];
                    const slideData = topicData.slides[slIdx];
                    if (!slideData || !slideData.contentGenerated) continue;

                    const sContent = slideData.contentGenerated;
                    let sRawType = slideData.slideType?.toLowerCase() || "general";

                    if (sRawType === "video" || sRawType === "audio") {
                        mediaContent += `\n\n=== SLIDE ${sRawType.toUpperCase()}: ${slideDB.title} ===\n`;
                        if (sContent.timestamps) mediaContent += sContent.timestamps.map(ts => `[${ts.timestamp}] ${ts.description}`).join("\n");
                    } else if (sRawType === "accordion" || sRawType === "accordian") {
                        if (sContent.subtopics) {
                            for (const sub of sContent.subtopics) {
                                await MultiSlideAccordion.create({
                                    multi_slide_id: slideDB.id,
                                    title: sub.title || "Subtopic",
                                    body: sub.description || "",
                                    created_by: userId,
                                    updated_by: userId,
                                    created_by_type: role,
                                    updated_by_type: role
