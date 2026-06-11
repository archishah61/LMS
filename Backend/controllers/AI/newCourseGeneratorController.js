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
const PDFDocument = require("pdfkit");
const { Op } = require("sequelize");

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
const { MultiSlideVideo } = require("../../models/content_management/multiSlideVideo");

const { Video } = require("../../models/content_management/video");
const { Audio } = require("../../models/content_management/audio");
const { CourseCategory } = require("../../models/masters/courseCatagory");
const { generatePublicHash } = require("../../utils/course_management/generateHash");

// Tag Models
const TopicTag = require("../../models/content_management/tags/tagsTable");
const { Material } = require("../../models/content_management/material");

// Quiz Models
const { Quizzes } = require("../../models/content_management/quizzesModel");
const { QuizQuestion } = require("../../models/content_management/quizQuestion");
const { QuizQuestionOption } = require("../../models/content_management/quizQuestionOption");
const Assignment = require("../../models/content_management/assignmentsModel");
const MatchingQuestion = require("../../models/content_management/matchingQuestion");
const MatchingOption = require("../../models/content_management/matchingOption");
const TrueFalseQuestion = require("../../models/content_management/trueFalseQuestion");
const FillTheBlanksQuestion = require("../../models/content_management/fillTheBlanks");
const ParagraphWriting = require("../../models/content_management/paragraphwriting");
const CourseFAQ = require("../../models/course_management/courseFAQs");
const CourseFAQOption = require("../../models/course_management/courseFAQOption");
const TopicContent = require("../../models/course_management/topic_content");

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

function buildMaterialUrl(filename, materialType = '', scope = 'material') {
    if (!filename || typeof filename !== 'string') return filename || null;

    // If it's an external web URL, return it as is
    if (filename.startsWith('http://') || filename.startsWith('https://') || filename.startsWith('//')) {
        return filename;
    }

    // Extract just the filename (e.g. "/materials/document.pdf" -> "document.pdf")
    const cleanFilename = filename.split(/[/\\]/).pop();

    // Try to detect/fallback the type from the file extension if not explicitly specified
    let detectedType = (materialType || '').toLowerCase().trim();
    if (!detectedType) {
        const ext = cleanFilename.split('.').pop().toLowerCase();
        if (ext === 'pdf') {
            detectedType = 'pdf';
        } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
            detectedType = 'image';
        } else if (['doc', 'docx', 'txt', 'csv', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
            detectedType = 'document';
        } else if (['js', 'ts', 'py', 'java', 'cpp', 'c', 'cs', 'html', 'css', 'sql', 'sh', 'json'].includes(ext)) {
            detectedType = 'code';
        }
    }

    // Scope handling (default: "material")
    if (scope === 'material' || scope === 'slide_material' || scope === 'slide-general') {
        let segment;
        switch (detectedType) {
            case 'pdf':
                segment = 'pdf';
                break;
            case 'image':
                segment = 'image';
                break;
            case 'document':
                segment = 'document';
                break;
            case 'code':
                segment = 'code'; // optional if you want to expose saved code files
                break;
            case 'others':
            default:
                segment = 'others';
                break;
        }
        if (scope === 'slide_material') {
            return `/slide_material/${segment}/${cleanFilename}`;
        } else {
            return `/material/${segment}/${cleanFilename}`;
        }
    }
    return `/material/others/${cleanFilename}`;
}

// ─── Configuration ───────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const GEMINI_MODEL = "gemini-2.5-flash";

// ─── Helper: Wait 1 minute before API request ─────────────────────────────
const waitOneMinute = () => {
    return new Promise((resolve) => {
        console.log("⏳ Waiting 1 minute before sending request...");
        setTimeout(() => {
            console.log("✅ 1 minute delay completed, sending request now...");
            resolve();
        }, 60000); // 60 seconds = 1 minute
    });
};

// ─── Content Styles Instructions ──────────────────────────────────────────

const STYLE_INSTRUCTIONS = {
    professional: "Use a formal, academic, and structured tone. Focus on clarity, precision, and professional terminology. Maintain a high standard of educational authority.",
    funny: "Use a humorous, engaging, and lighthearted tone. Include relevant jokes, puns, or witty examples to maintain student interest while still being educational.",
    story: "Use a narrative-driven, storytelling approach. Introduce characters, scenarios, or a continuous plot that unfolds through the course content to make it immersive.",
    tutorial: "Use a step-by-step, practical, and hands-on tone. Focus on 'how-to' instructions, clear demonstrations, and 'learn by doing' examples. Perfect for technical or skill-based learning.",
    friendly: "Use a conversational, warm, and approachable tone. Speak like a mentor or peer, using 'we' and 'you' to create a supportive and encouraging learning environment."
};

const parseAllowedSelection = (rawValue, allowedValues, defaultValues) => {
    if (rawValue === undefined || rawValue === null) return defaultValues;
    let parsed;
    try {
        parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    } catch (e) {
        console.error('Failed to parse selection array:', e);
        return null;
    }
    if (!Array.isArray(parsed)) return null;
    const normalized = parsed
        .map((item) => typeof item === 'string' ? item.trim() : item)
        .filter((item) => typeof item === 'string' && allowedValues.includes(item));
    if (normalized.length === 0) {
        return null;
    }
    return [...new Set(normalized)];
};

// ─── PDF Generation Utility for Regular Assignments ─────────────────────────

/**
 * Generates a PDF file from assignment title + instructions/description text.
 * Returns the relative path (e.g. "/assignments/assignment_42_abc12def.pdf")
 */
const generateAssignmentPDF = (title, content, assignmentId) => {
    return new Promise((resolve, reject) => {
        try {
            const uploadsDir = path.join(__dirname, "../../uploads/assignments/file");
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const uniqueId = require("crypto").randomBytes(4).toString("hex");
            const filename = `assignment_${assignmentId}_${uniqueId}.pdf`;
            const filePath = path.join(uploadsDir, filename);

            const doc = new PDFDocument({
                size: "A4",
                margins: { top: 60, bottom: 60, left: 50, right: 50 },
            });

            const writeStream = fs.createWriteStream(filePath);
            doc.pipe(writeStream);

            // Header line
            doc.moveTo(50, 45).lineTo(545, 45).strokeColor("#7c3aed").lineWidth(2).stroke();

            // Title
            doc.fontSize(22).fillColor("#1e1b4b").font("Helvetica-Bold")
                .text(title, 50, 60, { align: "center", width: 495 });

            doc.moveDown(0.5);

            // Date
            const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
            doc.fontSize(10).fillColor("#6b7280").font("Helvetica")
                .text(`Generated on: ${dateStr}`, { align: "center" });

            doc.moveDown(1);

            // Divider
            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e5e7eb").lineWidth(1).stroke();
            doc.moveDown(1);

            // Assignment Content — split into paragraphs
            doc.fontSize(12).fillColor("#374151").font("Helvetica");
            const paragraphs = content.split(/\n+/);
            for (const para of paragraphs) {
                const trimmed = para.trim();
                if (!trimmed) continue;
                doc.text(trimmed, { align: "justify", lineGap: 4 });
                doc.moveDown(0.6);
            }

            // Footer
            doc.moveDown(2);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e5e7eb").lineWidth(0.5).stroke();
            doc.moveDown(0.5);
            doc.fontSize(8).fillColor("#9ca3af").font("Helvetica-Oblique")
                .text("This assignment was auto-generated by the AI Course Generator.", { align: "center" });

            doc.end();

            writeStream.on("finish", () => {
                resolve(`/assignments/file/${filename}`);
            });
            writeStream.on("error", (err) => {
                reject(err);
            });
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * Generates a file for AI-generated material of a topic/slide to avoid 404s.
 */
const generateMaterialFile = (finalUrl, title, description, materialType, codeContent = null) => {
    return new Promise((resolve) => {
        try {
            if (!finalUrl || typeof finalUrl !== 'string') return resolve();
            if (finalUrl.startsWith('http://') || finalUrl.startsWith('https://') || finalUrl.startsWith('//')) {
                return resolve(); // External URL, no file required
            }

            // Extract segments from the finalUrl (e.g. "/material/pdf/python_basics.pdf")
            const cleanUrl = finalUrl.startsWith('/') ? finalUrl : `/${finalUrl}`;
            const parts = cleanUrl.split('/').filter(Boolean);
            if (parts.length < 3) return resolve();

            const scope = parts[0]; // 'material' or 'slide_material'
            const segment = parts[1]; // 'pdf', 'image', 'document', 'others', etc.
            const filename = parts[2];

            const uploadsDir = path.join(__dirname, "../../uploads", scope, segment);
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const filePath = path.join(uploadsDir, filename);

            // If the file already exists, don't overwrite it to be safe
            if (fs.existsSync(filePath)) {
                return resolve();
            }

            // Generate content based on file type
            if (segment === 'pdf' || filename.toLowerCase().endsWith('.pdf')) {
                const doc = new PDFDocument({
                    size: "A4",
                    margins: { top: 60, bottom: 60, left: 50, right: 50 },
                });

                const writeStream = fs.createWriteStream(filePath);
                doc.pipe(writeStream);

                // Header line
                doc.moveTo(50, 45).lineTo(545, 45).strokeColor("#7c3aed").lineWidth(2).stroke();

                // Title
                doc.fontSize(20).fillColor("#1e1b4b").font("Helvetica-Bold")
                    .text(title || "Study Material", 50, 60, { align: "center", width: 495 });

                doc.moveDown(0.5);
                const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
                doc.fontSize(9).fillColor("#6b7280").font("Helvetica")
                    .text(`Generated on: ${dateStr} • Topic Material`, { align: "center" });

                doc.moveDown(1);
                doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e5e7eb").lineWidth(1).stroke();
                doc.moveDown(1.5);

                // Body content
                doc.fontSize(12).fillColor("#1e1b4b").font("Helvetica-Bold")
                    .text("Content Summary:", { underline: true });
                doc.moveDown(0.5);

                doc.fontSize(11).fillColor("#374151").font("Helvetica");
                
                // Strip HTML tags for clean PDF rendering
                const cleanText = (description || "No description provided.")
                    .replace(/<[^>]*>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();

                const paragraphs = cleanText.split(/\. /);
                for (const para of paragraphs) {
                    const trimmed = para.trim();
                    if (!trimmed) continue;
                    doc.text(trimmed + (trimmed.endsWith('.') ? '' : '.'), { align: "justify", lineGap: 4 });
                    doc.moveDown(0.5);
                }

                if (codeContent) {
                    doc.moveDown(1);
                    doc.fontSize(12).fillColor("#1e1b4b").font("Helvetica-Bold")
                        .text("Reference Code / Resource:");
                    doc.moveDown(0.5);
                    doc.fontSize(10).fillColor("#0f172a").font("Courier")
                        .text(codeContent, { align: "left", lineGap: 2 });
                }

                // Footer
                doc.moveDown(2);
                doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e5e7eb").lineWidth(0.5).stroke();
                doc.moveDown(0.5);
                doc.fontSize(8).fillColor("#9ca3af").font("Helvetica-Oblique")
                    .text("This reference material was auto-generated by the AI Course Generator.", { align: "center" });

                doc.end();
                writeStream.on("finish", () => resolve());
                writeStream.on("error", (err) => {
                    console.error("PDF generation write stream error:", err);
                    resolve();
                });
            } else if (segment === 'image' || filename.toLowerCase().endsWith('.png') || filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg')) {
                const dummyPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
                fs.writeFile(filePath, Buffer.from(dummyPngBase64, 'base64'), (err) => {
                    if (err) console.error("Error writing material image file:", err);
                    resolve();
                });
            } else {
                // For other files, write simple text file / JSON / code snippet representation
                let fileContentStr = `Study Material: ${title}\n`;
                fileContentStr += `=========================================\n\n`;
                if (description) {
                    const cleanText = description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                    fileContentStr += `Description / Concept:\n${cleanText}\n\n`;
                }
                if (codeContent) {
                    fileContentStr += `Reference Code / Resource Content:\n${codeContent}\n`;
                }
                fs.writeFile(filePath, fileContentStr, 'utf8', (err) => {
                    if (err) console.error("Error writing material text file:", err);
                    resolve();
                });
            }
        } catch (err) {
            console.error("Error in generateMaterialFile:", err);
            resolve();
        }
    });
};

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
 * Extracts the most likely valid JSON object from raw text,
 * handling markdown blocks and leading/trailing noise.
 */
const extractJSONObject = (text) => {
    if (!text || typeof text !== "string") return null;

    let content = text.trim();

    // 1. Try to extract from markdown code blocks first (common for Gemini)
    const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
    const matches = [...content.matchAll(markdownRegex)];
    if (matches.length > 0) {
        // Use the last block as it's often the most complete one if multiple exist
        content = matches[matches.length - 1][1].trim();
    }

    // 2. Find the first '{' and last '}'
    const firstBrace = content.indexOf("{");
    const lastBrace = content.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        // Maybe it's a JSON array? 
        const firstBracket = content.indexOf("[");
        const lastBracket = content.lastIndexOf("]");
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
            return content.slice(firstBracket, lastBracket + 1);
        }
        return null;
    }

    return content.slice(firstBrace, lastBrace + 1);
};

/**
 * Aggressively repairs common AI-generated JSON issues:
 * - Trailing commas before closing structures
 * - Truncated JSON (unbalanced braces/brackets)
 * - Control characters in descriptive text
 */
const repairJSON = (str) => {
    if (!str) return null;
    let repaired = str.trim();

    try {
        // Fix trailing commas
        repaired = repaired.replace(/,(\s*[}\]])/g, "$1");

        // Remove illegal control characters (keep basics like \n if escaped correctly)
        repaired = repaired.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

        // Balance braces
        let openBraces = (repaired.match(/\{/g) || []).length;
        let closedBraces = (repaired.match(/\}/g) || []).length;
        while (openBraces > closedBraces) {
            repaired += "}";
            closedBraces++;
        }

        // Balance brackets
        let openBrackets = (repaired.match(/\[/g) || []).length;
        let closedBrackets = (repaired.match(/\]/g) || []).length;
        while (openBrackets > closedBrackets) {
            repaired += "]";
            closedBrackets++;
        }

        return JSON.parse(repaired);
    } catch (e) {
        // Last ditch attempt: if it's really messy, try one more time after 
        // replacing literal newlines with space (Gemini often does this)
        try {
            const secondAttempt = repaired.replace(/\n/g, " ");
            return JSON.parse(secondAttempt);
        } catch (innerError) {
            console.warn("🧩 JSON repair failed even after aggressive attempts");
            return null;
        }
    }
};

/**
 * Robust JSON parser with cleaning, extraction and error resilience
 */
const jsonParser = (rawText) => {
    if (!rawText) return null;

    try {
        // Clean the AI response before parsing (removes markdown backticks)
        const cleanResponse = rawText
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        // 1. Extract potential JSON content
        const jsonOnly = extractJSONObject(cleanResponse);
        if (!jsonOnly) return null;

        // 2. Initial clean
        let cleaned = jsonOnly.trim();

        // 3. Try standard parse first
        try {
            return JSON.parse(cleaned);
        } catch (parseError) {
            // 4. Attempt repair if standard parse fails
            const repaired = repairJSON(cleaned);
            if (repaired) return repaired;

            // Log exactly where it failed for debugging
            console.error("❌ JSON Parse critical failure. Sample nearby error:", parseError.message);
            return null;
        }
    } catch (error) {
        console.error("❌ Fatal error in jsonParser:", error.message);
        return null;
    }
};

// ─── Gemini Prompt Builder ───────────────────────────────────────────────────

/**
 * Builds a structured Gemini prompt based on course type and inputs
 * 
 * @param {string} prompt - User's course description/prompt
 * @param {string} courseType - "quick" or "complete"
 * @param {string} fileContent - Extracted text from uploaded reference file (optional)
 * @param {string} contentStyle - The selected tone/style (professional, funny, etc.)
 * @returns {string} - The formatted Gemini prompt
 */
const buildCoursePrompt = (prompt, courseType, fileContent, contentStyle = "professional", forceAudioCourse = false, topicTypesArr = ["video", "audio", "general", "accordion", "multislides"], assignmentTypesArr = ["regular", "matching", "true_false", "fill_in_the_blanks", "paragraph_writing"]) => {
    const styleInstruction = STYLE_INSTRUCTIONS[contentStyle] || STYLE_INSTRUCTIONS.professional;
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

    const audioRule = forceAudioCourse
        ? "CRITICAL: The user wants an AUDIO-FIRST course. You MUST set 'completionType' to 'audio' for ALL topics and slides (where applicable, e.g., general, accordion, slide)."
        : "Set 'completionType' to either 'audio' or 'timer' based on what is more relevant for each specific topic/slide. Use 'audio' for descriptive/theoretical content and 'timer' for reading-heavy or practical segments.";

    return `
You are an expert course designer AI. Your task is to generate a well-structured, hierarchical course structure based on the user's request.

### ALLOWED TOPIC TYPES
You MUST use ONLY these topic types: ${JSON.stringify(topicTypesArr)}. Do NOT use any topic type that is not in this list.

### ALLOWED ASSIGNMENT TYPES
You MUST use ONLY these assignment types: ${JSON.stringify(assignmentTypesArr)}. Do NOT use any assignment type that is not in this list.



User's Course Request
${prompt}

### Tone & Style Requirements
${styleInstruction}

${courseTypeRules}

${fileContentSection}

### Completion Type Rules
${audioRule}

### Quality Rule: No Placeholders
NEVER, UNDER ANY CIRCUMSTANCES, use placeholders like "[Detailed description here]" or "[Principle 1]". You must provide REAL, FACTUAL educational content in every field you generate.

### NO CODE IN DESCRIPTIONS
NEVER include code snippets or syntax in any description field. All code resides ONLY in the 'tags' property and is referenced by tag name (e.g., #code1#).

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
   - price: Numeric value for the course price in Indian Rupees (INR) (e.g., 4999)
   - discount: Numeric value for the discount percentage (e.g., 20)
   - meta_title: Concise SEO title for the course page (max 60 chars)
   - meta_keyword: Comma-separated string of relevant SEO keywords
   - meta_description: A compelling SEO meta description (max 160 chars)
   - seo_image_alt: Alt text describing the SEO image
   - seo_canonical: A slug representing the canonical URL (e.g., "advanced-course-topic")
   - og_title: Open Graph title for social sharing
   - og_description: Open Graph description for social sharing
   - og_image_alt: Alt text for the Open Graph image
   - course_faqs: An array of 5-6 pre-enrollment survey/diagnostic MCQs (Multiple Choice Questions) to ask the user when they enroll. CRITICAL: These questions MUST NOT be about the course contents (e.g. do not ask "What will this course cover?"). They MUST be directed AT the student to gauge their prior knowledge, background, and intentions so the admin knows about them. Examples: "What level of knowledge do you currently have in this subject?", "Why are you interested in learning this?", etc.
     - question: The question text.
     - options: An array of EXACTLY 4 strings for the MCQ options.
   - courseCategory: A single, perfect category name for this course (e.g., "Web Development", "Graphic Design", "Soft Skills", etc.).

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
   - **quiz**: Each module MUST contain a "quiz" object with the following:
      - quizTitle: A descriptive title for the module quiz
      - durationMinutes: Duration in minutes (number, typically 10-30)
      - passingMarks: Minimum passing score percentage (number, 40-80)
      - maxAttempts: Maximum number of attempts allowed (number, 1-5)
      - attemptGap: Gap between attempts in hours (number, 0-48)
      - attemptRenewal: Days after which attempts renew (number, 0-30)
    - **assignment**: Each module MUST also contain an "assignment" object with:
       - assignmentTitle: A descriptive title for the module assignment
       - durationHours: Time to complete in hours (number)
       - assignmentType: One of ${JSON.stringify(assignmentTypesArr)}. **CRITICAL: 'paragraph_writing' is a typing excellence test where students must reproduce a text exactly without mistakes.**
       - maxScore: Maximum score (e.g., 100)
       - passingScore: Passing score (e.g., 60)
       - maxAttempts: Maximum attempts (e.g., 3)
       - extensionLimit: Extension limit (e.g., 2)

4. **Topic Level**
    - topicTitle: Specific, clear topic title
    - topicDescription: A detailed comprehensive overview in clean, semantic HTML. **CRITICAL STRUCTURE: 1. Start with a 3 to 4 line description of what the topic is. 2. IF the topic is technical, you MUST explicitly insert a code block tag WITH hashes (like #code1#) into the layout to render the code, and provide a detailed explanation of the code, how to read it, and how it works. 3. IF the topic is non-technical, provide a complete explanation of the topic and add an image tag (like #img1#) if needed with the explanation. EXPLAIN EVERYTHING POINTWISE. **CRITICAL DYNAMIC LAYOUT RULE**: Do not just use standard <ul>/<li> lists everywhere. You MUST dynamically vary the HTML layout across different topics/slides to prevent boredom! Sometimes use a 2x2 HTML table grid view with borders for your points, sometimes use styled cards (<div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 5px;">), and sometimes use standard lists. Mix up the syntax so the course looks rich and diverse. BOLDING: Bold ALL important words, core concepts, and key terminology using <strong> tags. LANGUAGE: Use very simple, easy-to-understand English. Make the text attractive using TinyMCE colors. NEVER include code/images directly; only use tag placeholders. TAG USAGE: To render the asset on screen, you MUST insert the exact placeholder WITH hashes (e.g., #code1#, #img1#) somewhere in the layout. Merely mentioning "code1" in a sentence is NOT enough! Separately, when referencing the tag in sentences, write the tag name plainly without hashes (e.g., "as seen in code1" - NEVER "as seen in #code1#"). LAYOUT: Conditional. ABSOLUTE PROHIBITION: IF the topicType is "video", you are STRICTLY FORBIDDEN from using a table layout (<table/>) for ANY tags; you MUST place code tags directly into the normal text flow without tables. ONLY IF the topicType is NOT "video", and you are inserting tags (like #img1# or #code1#), you MUST use a table layout. Each tag MUST be in its own separate table (max 1 row per table) interspersed with explanation. CRITICAL TABLE FORMAT: <table style="border-collapse: collapse; width: 100.016%;" border="1"><colgroup><col style="width: 49.9921%;"><col style="width: 49.9921%;"></colgroup><tbody><tr><td>#img1#</td><td><h3 style="text-align: left;">Section Title</h3><ul style="text-align: left;"><li>Detailed <strong>pointwise explanation</strong> in simple words.</li><li>Referencing the tag (e.g., img1) within the points...</li></ul></td></tr></tbody></table> (You MUST put the actual tag placeholder with hashes inside the left <td>).**
   - isImportant: A boolean flag (true or false). Set to true ONLY if this topic covers critical, core, or highly examinable knowledge.
   - topicQuiz: If \`isImportant\` is true, you may include a 'topicQuiz' object here with the exact same structure as a module 'quiz' object (omitted if false).
   - topicAssignment: If \`isImportant\` is true, you may instead include a 'topicAssignment' object with the exact same structure as a module 'assignment' object (omitted if false). **CRITICAL RULES for topic assessments**: If \`isImportant\` is true, you MUST include EXACTLY ONE of either \`topicQuiz\` or \`topicAssignment\` (randomly decide which to generate to ensure variety). Ensure questions/tasks focus ONLY on this topic's content.
   - tags: An array of objects. 
     - CRITICAL TAG NAMING RULE: The "name" property MUST be strictly formatted as "#img1#", "#img2#", "#code1#", etc. NEVER use descriptive words in the tag name (e.g., never use "#img1_python#"). The name in the 'tags' array MUST exactly match the placeholder used in the description text. 
     - ABSOLUTE UNIQUENESS RULE: EVERY single tag within the SAME topic AND all its slides MUST have a completely UNIQUE name. NEVER generate two tags with the same name anywhere within the same topic's structure.
     - SEQUENTIAL NUMBERING: You MUST number tags continuously across the entire topic and its slides. If the Topic uses "#img1#", Slide 1 MUST use "#img2#", and Slide 2 MUST use "#img3#". DO NOT restart numbering for each slide! If you need 3 images total across a topic and its slides, their names MUST BE exactly "#img1#", "#img2#", and "#img3#".
     - If the course is coding/technical:
       - Include AT LEAST ONE object with { "type": "code", "name": "#code1#", "language": "...", "content": "A complete, working code example related to the topic." }.
       - You MAY include multiple code tags if different examples help (e.g., #code1#, #code2#, #code3#).
     - If the course is NOT coding-related:
       - Include AT LEAST ONE object with { "type": "image", "name": "#img1#", "prompt": "A concise prompt for the image.", "detailed_script": "A highly detailed, comprehensive script explaining exactly what the image should show..." } (UNLESS the topicType/slideType is "video").
     - ALWAYS include a few additional tags (at least 2-3 total) that can be either 'image' or 'code' based on relevance, remembering to increment the number continuously (e.g. #img1#, #img2# or #code1#, #code2#). **CRITICAL EXCEPTION: If the topicType or slideType is "video", you MUST NEVER include any 'image' tags in this array! For "video" types, you may ONLY generate 'code' tags if applicable.**
     - CRITICAL TAG SCOPE: In the topicDescription or slideDescription, you MUST ONLY use tags that are defined within that specific topic's or slide's 'tags' array. Never cross-reference tags from other topics.
   - topicDuration: Duration string
   - topicDurationMinutes: Duration (number). **CRITICAL: Maximum duration is 15 minutes per topic. Target an average duration of 5 to 10 minutes across all topics.**
   - topicType: MUST be exactly one of ${JSON.stringify(topicTypesArr)}. **CRITICAL RULE: If "multislides" is in the allowed list, you MUST use it for 60-70% of all topics in the course. Reserve single-page types (like "general", "video", "audio") ONLY for brief introductions or very small, simple topics. Furthermore, if the topic covers multiple distinct concepts (e.g., "Variables, Data Types, and Operators" or contains "and" or commas), it is STRICTLY FORBIDDEN to use a single-page type. You MUST use "multislides" and separate each concept into its own slide.**
   - completionType: MUST be exactly one of ["audio", "timer"]. (Ignored for 'video' and 'audio' types).
   - Topics should be atomic learning units
   - **IF topicType is "multislides"**, include a "slides" array.
 
5. **Slide Level (Only if topicType is "multislides")**
   - **CRITICAL SLIDE RULE**: A single slide MUST focus on ONE specific subtopic or atomic concept ONLY. If a broader topic contains multiple subtopics (e.g., "Introduction", "Sync vs Async", "Practical Examples"), you MUST create a SEPARATE slide for each individual subtopic. DO NOT combine multiple subtopics into a single slide.
   - slideTitle: Specific title for the slide (focused on just one subtopic)
   - slideDescription: A highly comprehensive, very detailed description in clean, semantic HTML. **CRITICAL CONTENT REQUIREMENT: You MUST generate AT LEAST 150-300 words per slide for that single subtopic. Do NOT generate short summaries, but also do NOT combine multiple subtopics just to increase length. CRITICAL STRUCTURE: 1. Start with a 3 to 4 line description of what the slide is about. 2. IF the slide is technical, you MUST explicitly insert a code block tag WITH hashes (like #code1#) into the layout to render the code, and provide a detailed explanation of the code, how to read it, and how it works. 3. IF the slide is non-technical, provide a complete explanation and add an image tag (like #img1#) if needed with the explanation. Break down the concepts deeply with multiple examples, use cases, and thorough explanations. EXPLAIN EVERYTHING POINTWISE. **CRITICAL DYNAMIC LAYOUT RULE**: Do not just use standard <ul>/<li> lists everywhere. You MUST dynamically vary the HTML layout across different topics/slides to prevent boredom! Sometimes use a 2x2 HTML table grid view with borders for your points, sometimes use styled cards (<div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 5px;">), and sometimes use standard lists. Mix up the syntax so the course looks rich and diverse. BOLDING: Bold ALL important words and core concepts using <strong> tags. LANGUAGE: Use simple, easy-to-understand English. Make the text attractive using TinyMCE colors. NEVER include code/images directly; only use tags if needed. TAG USAGE: To render the asset on screen, you MUST insert the exact placeholder WITH hashes (e.g., #code1#, #img1#) somewhere in the layout. Merely mentioning "code1" in a sentence is NOT enough! Separately, when referencing the tag in sentences, write the tag name plainly without hashes (e.g., "as seen in code1" - NEVER "as seen in #code1#"). LAYOUT: Conditional Table Format. ABSOLUTE PROHIBITION: IF the slideType is "video", you are STRICTLY FORBIDDEN from using a table layout (<table/>) for ANY tags; you MUST place code tags directly into the normal text flow without tables. ONLY IF the slideType is NOT "video", and you are inserting tags (like #img1# or #code1#), you MUST format each tag inside its own table: <table style="border-collapse: collapse; width: 100.016%;" border="1"><colgroup><col style="width: 49.9921%;"><col style="width: 49.9921%;"></colgroup><tbody><tr><td>#img1#</td><td><h3 style="text-align: left;">Slide Section</h3><ul style="text-align: left;"><li>Highly detailed pointwise explanation in <strong>simple words</strong>. Provide deep insights and examples.</li><li>Referencing the tag (e.g., img1) here...</li></ul></td></tr></tbody></table> (You MUST put the actual tag placeholder with hashes inside the left <td>).**
   - tags: Same as topic level, adhere to the coding/non-coding rules for every slide.
   - slideDuration: Duration string (e.g., "5 minutes")
   - slideDurationMinutes: Duration in minutes (number)
   - slideType: MUST be exactly one of ${JSON.stringify(topicTypesArr.filter(t => t !== 'multislides') || ["video", "audio", "general", "accordion"])}. **CRITICAL: You MUST ensure a diverse mixture of slide types within every multislide. Do NOT default to just "general".**

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
  "price": 4999,
  "discount": 15,
  "meta_title": "Comprehensive Course for Beginners",
  "meta_keyword": "learning, beginner tutorial, advanced concepts",
  "meta_description": "An immersive guide to mastering the fundamentals and advancing your skills.",
  "seo_image_alt": "Course promotional thumbnail",
  "seo_canonical": "course-title-slug",
  "og_title": "Comprehensive Course | Learn and Master",
  "og_description": "Join our complete course and start your learning journey today.",
  "og_image_alt": "Course promotional Open Graph image",
  "course_faqs": [
    {
      "question": "What level of prior knowledge do you have in this subject?",
      "options": ["Complete beginner", "Basic understanding", "Intermediate", "Advanced"]
    }
  ],
  "courseCategory": "Technology & Computing",
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
          "quiz": {
            "quizTitle": "Module 1.1 Assessment",
            "durationMinutes": 15,
            "passingMarks": 60,
            "maxAttempts": 3,
            "attemptGap": 2,
            "attemptRenewal": 7
          },
          "assignment": {
            "assignmentTitle": "HTML Syntax Matching",
            "durationHours": 1,
            "assignmentType": "matching",
            "maxScore": 50,
            "passingScore": 40,
            "maxAttempts": 3,
            "extensionLimit": 0
          },
          "topics": [
            {
              "topicTitle": "Topic Title (Standard)",
              "topicDescription": "Brief description of the topic...",
              "tags": [
                { "type": "image", "prompt": "Illustration of AI concepts..." },
                { "type": "code", "language": "javascript", "content": "console.log('AI is cool');" }
              ],
              "topicDuration": "15 minutes",
              "topicDurationMinutes": 15,
              "topicType": "video",
              "isImportant": true,
              "topicQuiz": {
                "quizTitle": "Topic Concept Check",
                "durationMinutes": 10,
                "passingMarks": 70,
                "maxAttempts": 2,
                "attemptGap": 0,
                "attemptRenewal": 0
              }
            },
            {
              "topicTitle": "Topic Title (Slides)",
              "topicDescription": "Highly detailed, extensive description of the slides topic. Include deep insights, multiple bullet points, and an overall comprehensive guide. Do not make this short.",
              "topicDuration": "20 minutes",
              "topicDurationMinutes": 20,
              "topicType": "multislides",
              "slides": [
                {
                  "slideTitle": "Slide 1 Title",
                  "slideDescription": "A highly detailed, comprehensive description of the first slide. Ensure that it spans at least 300 to 500 words containing deep insights, multiple examples, and pointwise explanations. <ul><li><strong>Point 1</strong>: Deep explanation here.</li><li><strong>Point 2</strong>: Another comprehensive detail.</li></ul>",
                  "slideDuration": "10 minutes",
                  "slideDurationMinutes": 10,
                  "slideType": "general"
                },
                {
                  "slideTitle": "Slide 2 Title",
                  "slideDescription": "Another extremely detailed slide description. Since this is a 'video' type, do NOT use tables for code tags. Instead, insert them directly: Here is #code1# explained in detail.",
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
- You MUST ONLY use topicTypes from this exact allowed list: ${JSON.stringify(topicTypesArr)}. It is UNACCEPTABLE to use any other type not in this list.
- Ensure proper time distribution at every level
- Generate meaningful, educational content structure
- Do NOT include any text before or after the JSON

IMPORTANT RULES:
- Return ONLY valid JSON.
- Do not include markdown.
- Do not include explanations.
- Do not include text before or after JSON.
- Ensure all arrays and objects are properly closed.
- Ensure commas between array elements.
- Response must start with { and end with }.
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
        const { prompt, courseType, contentStyle } = req.body;

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
        const forceAudioCourse = req.body.forceAudioCourse === 'true' || req.body.forceAudioCourse === true;
        const defaultTopicTypes = ["video", "audio", "general", "accordion", "multislides"];
        const defaultAssignmentTypes = ["regular", "matching", "true_false", "fill_in_the_blanks", "paragraph_writing"];

        const topicTypes = parseAllowedSelection(req.body.topicTypes, defaultTopicTypes, defaultTopicTypes);
        if (req.body.topicTypes !== undefined && topicTypes === null) {
            return res.status(400).json({ success: false, error: "topicTypes must contain at least one valid type from the allowed list." });
        }

        const assignmentTypes = parseAllowedSelection(req.body.assignmentTypes, defaultAssignmentTypes, defaultAssignmentTypes);
        if (req.body.assignmentTypes !== undefined && assignmentTypes === null) {
            return res.status(400).json({ success: false, error: "assignmentTypes must contain at least one valid type from the allowed list." });
        }

        const geminiPrompt = buildCoursePrompt(prompt.trim(), courseType, fileContent, contentStyle, forceAudioCourse, topicTypes, assignmentTypes);

        const model = genAI.getGenerativeModel({
            model: GEMINI_MODEL,
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        await waitOneMinute();
        const result = await model.generateContent(geminiPrompt);
        const response = await result.response;
        const text = await response.text();

        console.log("🤖 Received AI response, parsing...");

        // ── Parse and validate response ───────────────────────────────────
        const courseStructure = jsonParser(text);

        if (!courseStructure) {
            throw new Error("AI failed to provide a valid course structure JSON.");
        }

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

        // ── Log Token Usage ───────────────────────────────────────────────
        try {
            const usage = response.usageMetadata;
            if (usage) {
                const safeCourseName = (courseStructure.courseTitle || "Course").replace(/[^a-zA-Z0-9\-_ ]/g, "").trim().replace(/\s+/g, "_");
                const courseFolder = path.join(__dirname, `../../generated_courses/${safeCourseName}`);
                if (!fs.existsSync(courseFolder)) {
                    await fsp.mkdir(courseFolder, { recursive: true });
                }
                const tokenLogPath = path.join(courseFolder, `${safeCourseName}_token_usage_logs.txt`);
                let logText = `--- Course Generation Token Logs ---\n`;
                logText += `Course Title: ${courseStructure.courseTitle}\n`;
                logText += `Date: ${new Date().toISOString()}\n\n`;
                logText += `[Structure Generation (Overall Course Structure)]\n`;
                logText += `Prompt Tokens: ${usage.promptTokenCount}\n`;
                logText += `Completion Tokens: ${usage.candidatesTokenCount}\n`;
                logText += `Total Tokens: ${usage.totalTokenCount}\n\n`;
                await fsp.appendFile(tokenLogPath, logText, "utf8");
            }
        } catch (logErr) {
            console.error("⚠️ Failed to log token usage for structure:", logErr);
        }

        // ── Cleanup uploaded file ─────────────────────────────────────────
        if (req.file) {
            await cleanupFiles([req.file]);
        }

        console.log("courseStructure", courseStructure.sessions[0].modules);
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

/**
 * Utility to format minutes into a human-readable duration string
 */
const formatDuration = (totalMinutes) => {
    if (totalMinutes <= 0) return "0 minutes";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    let result = "";
    if (hours > 0) {
        result += `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    if (minutes > 0) {
        if (result) result += " ";
        result += `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return result || "0 minutes";
};

/**
 * Recalculates all durations in the course structure (Topic -> Module -> Session -> Course)
 */
const recalculateCourseDurations = (courseData) => {
    if (!courseData || !courseData.sessions) return courseData;

    let totalCourseMinutes = 0;

    // Filter out unselected sessions at the source
    courseData.sessions = courseData.sessions.filter(s => s.isSelected !== false);

    courseData.sessions.forEach(session => {
        let sessionMinutes = 0;

        // Filter out unselected modules
        if (session.modules && Array.isArray(session.modules)) {
            session.modules = session.modules.filter(m => m.isSelected !== false);

            session.modules.forEach(module => {
                let moduleMinutes = 0;

                // Filter out unselected topics
                if (module.topics && Array.isArray(module.topics)) {
                    module.topics = module.topics.filter(t => t.isSelected !== false);

                    module.topics.forEach(topic => {
                        let topicMinutes = 0;
                        if (topic.topicType === "multislides" && topic.slides && Array.isArray(topic.slides)) {
                            // Filter out unselected slides
                            topic.slides = topic.slides.filter(sl => sl.isSelected !== false);

                            topicMinutes = topic.slides.reduce((sum, slide) => sum + (parseInt(slide.slideDurationMinutes) || 0), 0);
                        } else {
                            topicMinutes = parseInt(topic.topicDurationMinutes) || 0;
                        }
                        topic.topicDurationMinutes = topicMinutes;
                        topic.topicDuration = formatDuration(topicMinutes);
                        moduleMinutes += topicMinutes;
                    });
                }
                module.moduleDurationMinutes = moduleMinutes;
                module.moduleDuration = formatDuration(moduleMinutes);
                sessionMinutes += moduleMinutes;
            });
        }
        session.sessionDurationMinutes = sessionMinutes;
        session.sessionDuration = formatDuration(sessionMinutes);
        totalCourseMinutes += sessionMinutes;
    });

    courseData.totalDurationMinutes = totalCourseMinutes;
    courseData.totalDuration = formatDuration(totalCourseMinutes);

    return courseData;
};

const saveGeneratedCourse = async (req, res) => {
    try {
        let { courseData } = req.body;
        const userId = req.user?.id || 1;
        const role = req.user?.role || "admin";

        if (!courseData || !courseData.courseTitle) {
            return res.status(400).json({ success: false, error: "Invalid course data structure." });
        }

        // Recalculate durations to account for any deletions from UI
        courseData = recalculateCourseDurations(courseData);

        // Handle Course Category: Find existing or create new
        let category_id = 1; // Default
        if (courseData.courseCategory) {
            const [categoryInstance] = await CourseCategory.findOrCreate({
                where: { category: courseData.courseCategory.trim() },
                defaults: {
                    status: "active",
                    created_by: userId,
                    updated_by: userId
                }
            });
            category_id = categoryInstance.id;
        } else {
            // Fallback to existing logic if no category provided by AI
            let category = await CourseCategory.findOne();
            category_id = category ? category.id : 1;
        }

        const safeCourseName = courseData.courseTitle.replace(/[^a-zA-Z0-9\-_ ]/g, "").trim().replace(/\s+/g, "_");
        const courseFolder = path.join(__dirname, `../../generated_courses/${safeCourseName}`);

        if (!fs.existsSync(courseFolder)) {
            await fsp.mkdir(courseFolder, { recursive: true });
        }

        const descriptionsFilePath = path.join(courseFolder, "course_descriptions.txt");
        const textualContent = `Course Title: ${courseData.courseTitle}\n\n=== Thumbnail Description ===\n${courseData.thumbnailDescription || 'N/A'}\n\n=== Preview Video Description ===\n${courseData.previewVideoDescription || 'N/A'}\n`;
        await fsp.writeFile(descriptionsFilePath, textualContent, "utf8");

        const { courseId } = req.body;
        let newCourse;

        if (courseId) {
            newCourse = await Course.findByPk(courseId);
            if (!newCourse) {
                return res.status(404).json({ success: false, error: "Course not found structure." });
            }

            await newCourse.update({
                title: courseData.courseTitle,
                description: courseData.courseDescription,
                duration_minutes: courseData.totalDurationMinutes || 0,
                what_you_will_learn: courseData.what_you_will_learn || null,
                prerequisites: courseData.prerequisites || null,
                skill_development: courseData.skill_development || null,
                price: courseData.price || 0,
                discount: courseData.discount || 0,
                meta_title: courseData.meta_title || null,
                meta_keyword: courseData.meta_keyword || null,
                meta_description: courseData.meta_description || null,
                seo_image_alt: courseData.seo_image_alt || null,
                seo_canonical: courseData.seo_canonical || null,
                og_title: courseData.og_title || null,
                og_description: courseData.og_description || null,
                og_image_alt: courseData.og_image_alt || null,
                category_id: category_id,
                updated_by: userId,
                updated_by_type: role,
            });
            // Removed complete wipe logic to prevent recreation of entries
        } else {
            newCourse = await Course.create({
                title: courseData.courseTitle,
                description: courseData.courseDescription,
                duration_minutes: courseData.totalDurationMinutes || 0,
                sequence: 1,
                category_id,
                price: courseData.price || 0,
                discount: courseData.discount || 0,
                expiry_days: 365,
                status: "draft",
                thumbnail: "/placeholder/placeholder2.png",
                preview_video: ["/placeholder/placeholder 1.mp4"],
                what_you_will_learn: courseData.what_you_will_learn || null,
                prerequisites: courseData.prerequisites || null,
                skill_development: courseData.skill_development || null,
                meta_title: courseData.meta_title || null,
                meta_keyword: courseData.meta_keyword || null,
                meta_description: courseData.meta_description || null,
                seo_image_alt: courseData.seo_image_alt || null,
                seo_canonical: courseData.seo_canonical || null,
                og_title: courseData.og_title || null,
                og_description: courseData.og_description || null,
                og_image_alt: courseData.og_image_alt || null,
                created_by: userId,
                created_by_type: role,
                updated_by: userId,
                updated_by_type: role,
            });

            newCourse.public_hash = generatePublicHash(newCourse.id);
            await newCourse.save();
        }

        const course_id = newCourse.id;

        // Keep track of valid IDs to clean up deletions
        const validSessionIds = [];
        const validModuleIds = [];
        const validTopicIds = [];
        const validSlideIds = [];

        if (courseData.sessions && Array.isArray(courseData.sessions)) {
            for (let sIdx = 0; sIdx < courseData.sessions.length; sIdx++) {
                const sessionData = courseData.sessions[sIdx];
                let newSession;

                if (courseId) {
                    newSession = await Session.findOne({ where: { course_id, sequence_no: sIdx + 1 } });
                }

                if (newSession) {
                    await newSession.update({
                        title: sessionData.sessionTitle,
                        min_time_in_minute: sessionData.sessionDurationMinutes || 0,
                        updated_by: userId,
                        updated_by_type: role,
                    });
                } else {
                    newSession = await Session.create({
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
                }

                validSessionIds.push(newSession.id);

                if (sessionData.modules && Array.isArray(sessionData.modules)) {
                    for (let mIdx = 0; mIdx < sessionData.modules.length; mIdx++) {
                        const moduleData = sessionData.modules[mIdx];
                        let newModule;

                        if (courseId) {
                            newModule = await Module.findOne({ where: { course_id, session_id: newSession.id, sequence_no: mIdx + 1 } });
                        }

                        if (newModule) {
                            await newModule.update({
                                title: moduleData.moduleTitle,
                                duration_minutes: moduleData.moduleDurationMinutes || 0,
                                updated_by: userId,
                                updated_by_type: role,
                            });
                        } else {
                            newModule = await Module.create({
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
                        }

                        validModuleIds.push(newModule.id);

                        if (moduleData.topics && Array.isArray(moduleData.topics)) {
                            for (let tIdx = 0; tIdx < moduleData.topics.length; tIdx++) {
                                const topicData = moduleData.topics[tIdx];

                                let rawType = topicData.topicType?.toLowerCase() || "general";
                                let mappedType = "general";
                                if (["video", "audio", "general", "slide"].includes(rawType)) {
                                    mappedType = rawType;
                                } else if (rawType === "accordion" || rawType === "accordian") {
                                    mappedType = "accordian";
                                } else if (rawType === "multislides") {
                                    mappedType = "slide";
                                }

                                let newTopic;
                                if (courseId) {
                                    newTopic = await Topic.findOne({ where: { module_id: newModule.id, sequence_no: tIdx + 1 } });
                                }

                                if (newTopic) {
                                    await newTopic.update({
                                        title: topicData.topicTitle,
                                        description: topicData.topicDescription || "Topic created by AI course generator",
                                        content_type: mappedType,
                                        total_duration: topicData.topicDurationMinutes || 0,
                                        topic_duration: topicData.topicDurationMinutes || 0,
                                        updated_by: userId,
                                        updated_by_type: role,
                                    });
                                    // Drop old tags so we don't duplicate them
                                    await TopicTag.destroy({ where: { topic_id: newTopic.id } });
                                } else {
                                    newTopic = await Topic.create({
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
                                }

                                validTopicIds.push(newTopic.id);

                                if (topicData.tags && Array.isArray(topicData.tags)) {
                                    for (const tag of topicData.tags) {
                                        if (!tag.name) continue;
                                        const detectedType = tag.type || tag.tag_type || tag.tagType || (tag.content ? 'code' : 'image');
                                        const detectedPath = (detectedType === 'image' || detectedType === 'file') ? '/placeholder/placeholder2.png' : (tag.content || tag.prompt || '/placeholder/placeholder2.png');
                                        await TopicTag.create({
                                            topic_id: newTopic.id,
                                            tag_file_type: detectedType,
                                            tag_file_path: detectedPath,
                                            code_language: tag.language || null,
                                            tag: tag.name || null,
                                            created_by: userId,
                                            updated_by: userId,
                                            status: 'approved'
                                        });
                                    }
                                }

                                if (mappedType === "slide" && topicData.slides && Array.isArray(topicData.slides)) {
                                    for (let slideIdx = 0; slideIdx < topicData.slides.length; slideIdx++) {
                                        const slide = topicData.slides[slideIdx];

                                        let slideRawType = slide.slideType?.toLowerCase() || "general";
                                        let slideMappedType = "general";
                                        let completionType = slide.completionType || "audio";

                                        if (slideRawType === "video") {
                                            slideMappedType = "video";
                                            completionType = "video";
                                        } else if (slideRawType === "accordion" || slideRawType === "accordian") {
                                            slideMappedType = "accordian";
                                        } else if (slideRawType === "audio") {
                                            slideMappedType = "general";
                                            completionType = "audio";
                                        }

                                        let newSlide;
                                        if (courseId) {
                                            newSlide = await MultiSlide.findOne({ where: { topic_id: newTopic.id, sequence_no: slideIdx + 1 } });
                                        }

                                        if (newSlide) {
                                            await newSlide.update({
                                                title: slide.slideTitle,
                                                description: slide.slideDescription || "Slide created by AI",
                                                type: slideMappedType,
                                                completion_type: completionType,
                                                slide_duration: slide.slideDurationMinutes || 0,
                                                total_slide_duration: slide.slideDurationMinutes || 0,
                                                updated_by: userId,
                                                updated_by_type: role,
                                            });
                                        } else {
                                            newSlide = await MultiSlide.create({
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

                                        validSlideIds.push(newSlide.id);

                                        if (slide.tags && Array.isArray(slide.tags)) {
                                            for (const tag of slide.tags) {
                                                if (!tag.name) continue;

                                                const detectedType = tag.type || tag.tag_type || tag.tagType || (tag.content ? 'code' : 'image');
                                                const detectedPath = (detectedType === 'image' || detectedType === 'file') ? '/placeholder/placeholder2.png' : (tag.content || tag.prompt || '/placeholder/placeholder2.png');

                                                await TopicTag.create({
                                                    topic_id: newTopic.id,
                                                    slide_id: newSlide.id,
                                                    tag_file_type: detectedType,
                                                    tag_file_path: detectedPath,
                                                    code_language: tag.language || null,
                                                    tag: tag.name || null,
                                                    created_by: userId,
                                                    updated_by: userId,
                                                    status: 'approved'
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Clean up out-of-bounds relations explicitly (Bottom-Up to avoid Foreign Key errors)
        if (courseId) {
            // 1. Identify which Sessions of this Course are NOT in the valid list
            const sessionsToDeleteIds = (await Session.findAll({
                where: { course_id, id: { [Op.notIn]: validSessionIds } },
                attributes: ['id']
            })).map(s => s.id);

            // 2. Identify which Modules are NOT in the valid list OR belong to deleted sessions
            const modulesToDeleteIds = (await Module.findAll({
                where: {
                    [Op.or]: [
                        { course_id, id: { [Op.notIn]: validModuleIds } },
                        { session_id: { [Op.in]: sessionsToDeleteIds } }
                    ]
                },
                attributes: ['id']
            })).map(m => m.id);

            // 3. Identify which Topics are NOT in the valid list OR belong to deleted modules
            const topicsToDeleteIds = (await Topic.findAll({
                where: {
                    [Op.or]: [
                        { module_id: { [Op.in]: validModuleIds }, id: { [Op.notIn]: validTopicIds } },
                        { module_id: { [Op.in]: modulesToDeleteIds } }
                    ]
                },
                attributes: ['id']
            })).map(t => t.id);

            // 4. Identify which Slides are NOT in the valid list OR belong to deleted topics
            const slidesToDeleteIds = (await MultiSlide.findAll({
                where: {
                    [Op.or]: [
                        { topic_id: { [Op.in]: validTopicIds }, id: { [Op.notIn]: validSlideIds } },
                        { topic_id: { [Op.in]: topicsToDeleteIds } }
                    ]
                },
                attributes: ['id']
            })).map(s => s.id);

            // ─── START DELETION (BOTTOM-UP) ───

            // Step A: TopicTags (point to both topics and slides)
            if (topicsToDeleteIds.length > 0 || slidesToDeleteIds.length > 0) {
                await TopicTag.destroy({
                    where: {
                        [Op.or]: [
                            { topic_id: { [Op.in]: topicsToDeleteIds } },
                            { slide_id: { [Op.in]: slidesToDeleteIds } }
                        ]
                    }
                });
            }

            // Step B: MultiSlides
            if (slidesToDeleteIds.length > 0) {
                await MultiSlide.destroy({ where: { id: { [Op.in]: slidesToDeleteIds } } });
            }

            // Step C: Other topic content
            if (topicsToDeleteIds.length > 0) {
                await TopicContent.destroy({ where: { topic_id: { [Op.in]: topicsToDeleteIds } } });
                await Video.destroy({ where: { topic_id: { [Op.in]: topicsToDeleteIds } } });
                await Audio.destroy({ where: { topic_id: { [Op.in]: topicsToDeleteIds } } });
                await Accordion.destroy({ where: { topic_id: { [Op.in]: topicsToDeleteIds } } });
                await GeneralMaterial.destroy({ where: { topic_id: { [Op.in]: topicsToDeleteIds } } });

                // Finally Delete Topics
                await Topic.destroy({ where: { id: { [Op.in]: topicsToDeleteIds } } });
            }

            // Step D: Modules (and their direct children Quizzes/Assignments)
            if (modulesToDeleteIds.length > 0) {
                // We should ideally clean up Quizzes/Assignments too, but they are often module-level.
                // For now, let's at least clear the module to avoid the structural FK conflict.
                await Module.destroy({ where: { id: { [Op.in]: modulesToDeleteIds } } });
            }

            // Step E: Sessions
            if (sessionsToDeleteIds.length > 0) {
                await Session.destroy({ where: { id: { [Op.in]: sessionsToDeleteIds } } });
            }
        }

        // ─── Save Course FAQs (MCQs) ───────────────────────────────────────
        if (courseData.course_faqs && Array.isArray(courseData.course_faqs)) {
            console.log(`📝 Saving ${courseData.course_faqs.length} course FAQs...`);

            // If updating, clear old FAQs first
            if (courseId) {
                const existingFAQs = await CourseFAQ.findAll({ where: { course_id: course_id } });
                for (const faq of existingFAQs) {
                    await CourseFAQOption.destroy({ where: { faq_id: faq.id } });
                    await faq.destroy();
                }
            }

            for (const faqData of courseData.course_faqs) {
                const newFAQ = await CourseFAQ.create({
                    course_id: course_id,
                    question: faqData.question,
                    is_active: true,
                    created_by: userId,
                    created_by_type: role,
                    updated_by: userId,
                    updated_by_type: role,
                });

                if (faqData.options && Array.isArray(faqData.options)) {
                    for (const optText of faqData.options) {
                        await CourseFAQOption.create({
                            faq_id: newFAQ.id,
                            option_text: optText,
                            created_by: userId,
                            created_by_type: role,
                            updated_by: userId,
                            updated_by_type: role,
                        });
                    }
                }
            }
            console.log("✅ Course FAQs saved successfully");
        }

        return res.status(200).json({
            success: true,
            message: "Course mapped and saved successfully to the database",
            courseId: newCourse.id,
            public_hash: newCourse.public_hash,
            data: courseData
        });

    } catch (error) {
        console.log("error", error)
        console.error("❌ Save generated course failed:", error.message);
        return res.status(500).json({
            success: false,
            error: error.message || "Failed to save course structure",
        });
    }
};


// ─── Controller: Generate Course Detailed Content ──────────────────────────────

const buildModuleContentPrompt = (moduleData, contentStyle = "professional", forceAudioCourse = false, quizTypesArr = ["mcq", "complete_the_sentence", "dragdrop", "realword", "summarize", "bestoption", "arrangeorder", "audiotoscript", "videotoscript", "imagetoscript", "video_pause", "audio_pause"], assignmentTypesArr = ["regular", "matching", "true_false", "fill_in_the_blanks", "paragraph_writing"]) => {
    const styleInstruction = STYLE_INSTRUCTIONS[contentStyle] || STYLE_INSTRUCTIONS.professional;
    const audioRule = forceAudioCourse
        ? "CRITICAL: The user wants an AUDIO-FIRST course. You MUST set 'completionType' to 'audio' for ALL topics and slides (where applicable, e.g., general, accordion, slide)."
        : "Set 'completionType' to either 'audio' or 'timer' based on what is more relevant for each specific topic/slide. Use 'audio' for descriptive/theoretical content and 'timer' for reading-heavy or practical segments.";
    return `
You are an expert course content generator AI.
I am providing you with a single Module object from a course (containing Topics, Slides, Quiz, and Assignment) in JSON format.
Your job is to read the ENTIRE structure of this module, and RETURN a NEW JSON structure exactly matching the hierarchy of what I provided (topics -> slides), BUT with:
1. A new property called 'contentGenerated' nested securely inside EVERY Topic object and Slide object.
2. A REFINED 'tags' array for every Topic and Slide that adheres to the strict rules below.

CRITICAL CONTENT QUALITY RULE: NEVER, UNDER ANY CIRCUMSTANCES, use placeholders like "[Detailed explanation of Principle 1]", "[mention a key component]", or "[precise, academic definition]". You must provide the ACTUAL, REAL-WORLD FACTUAL CONTENT. You are the expert; do not generate a template for someone else to fill. Provide clear, exhaustive, and final educational content.

STRICT NEGATIVE CONSTRAINT: NEVER, EVER include code snippets, function definitions, variable declarations, or syntax (e.g., console.log, if/else blocks) directly in the 'description' field. If the topic is coding-related, you MUST move ALL code into the separate 'tags' array and only include the tag name (e.g., #code1#) within the description's HTML table layout. Failure to keep code out of the description is UNACCEPTABLE.

### ALLOWED QUIZ TYPES
You MUST use ONLY these quiz types: ${JSON.stringify(quizTypesArr)}. Do NOT generate any quiz type that is not in this list.

### ALLOWED ASSIGNMENT TYPES
You MUST use ONLY these assignment types: ${JSON.stringify(assignmentTypesArr)}. Do NOT generate any assignmentType that is not in this list.

### Tone & Style Requirements
${styleInstruction}

### Completion Type Rules
${audioRule}

CRITICAL EXCEPTION FOR UNSELECTED TOPICS:
If a topic or slide has the property 'isSelected': false, you MUST completely SKIP generation for it. Simply return that node EXACTLY as it is without adding 'contentGenerated'.

Here are the strict RULES for generating 'contentGenerated' based on the object's existing 'topicType' or 'slideType':

1. If type is "video" (Topic or Slide):
   { "timestamps": [{ "timestamp": "0:00 - 0:30", "description": "..." }, { "timestamp": "0:30 - 1:00", "description": "..." }, ...], "totalDuration": "...", "videoScript": "The complete, continuous spoken narrative script for the entire video." }
   CRITICAL RULES FOR VIDEO:
   - Divide the total duration into exactly 30-second intervals (e.g., 0:00 - 0:30, 0:30 - 1:00, 1:00 - 1:30, etc.).
   - EVERY 30-second segment MUST have a UNIQUE, SPECIFIC description. Do NOT repeat or rephrase the same description across segments.
   - Each description must read like a video script: describe exactly what visuals should appear on screen, what the narrator should explain, what diagrams/animations/examples should be shown during those 30 seconds.
   - Progress through the topic logically: introduce the concept, then explain details, then show examples, then summarize — each segment must advance the content forward.

2. If type is "audio" (Topic or Slide):
   { "timestamps": [{ "timestamp": "0:00 - 0:30", "description": "..." }, { "timestamp": "0:30 - 1:00", "description": "..." }, ...], "totalDuration": "...", "audioScript": "The complete, continuous spoken narrative script for the entire audio." }
   CRITICAL RULES FOR AUDIO:
   - Divide the total duration into exactly 30-second intervals (e.g., 0:00 - 0:30, 0:30 - 1:00, 1:00 - 1:30, etc.).
   - EVERY 30-second segment MUST have a UNIQUE, SPECIFIC description. Do NOT repeat or rephrase the same description across segments.
   - Each description must read like an audio narration script: describe exactly what the speaker should say, what concepts to explain, what examples to give during those 30 seconds.
   - Progress through the topic logically: introduce the concept, then explain key points, then provide examples, then conclude — each segment must advance the content forward.

1.5. **REFINED TAGS Rules (Topic & Slide level)**:
   - For ANY topic or slide, you MUST generate or refine the 'tags' array:
   - CRITICAL: UNIQUE TAG NAMES. Every tag generated MUST have a completely UNIQUE name within the scope of the entire topic AND ALL ITS SLIDES. NEVER reuse names like #img1# or #code1# for different content pieces in the same topic or its slides. 
   - SEQUENTIAL NUMBERING: You MUST use continuous sequential numbering (e.g., #img1#, #img2#, #img3#, #code1#, #code2#) across the entire topic and its slides. If the Topic has "#img1#", Slide 1 MUST use "#img2#", and Slide 2 MUST use "#img3#". DO NOT restart numbering for each slide! NEVER use descriptive words in the tag name (e.g., never use "#img1_python#").
   - CRITICAL: STRICT TAG SCOPE & MATCHING. In the description for any specific topic or slide, you MUST ONLY use tags that are explicitly defined within the 'tags' array of THAT SPECIFIC topic or slide. Never cross-reference or invent tags belonging to other topics. If you use the placeholder [#code4#] or [#img5#] in the HTML text, you MUST have explicitly generated a tag with name "#code4#" or "#img5#" in this exact topic/slide's 'tags' array. DO NOT hallucinate tags that aren't defined.
   - If coding-related: At least ONE { "type": "code", "name": "#code1#", "language": "...", "content": "..." } with a real, functional code example. Include multiple if necessary, named continuously (#code1#, #code2#).
   - If NOT coding-related: At least ONE { "type": "image", "name": "#img1#", "prompt": "A concise prompt for the image.", "detailed_script": "A highly detailed, comprehensive script/description explaining exactly what the image should show..." }.
   - Ensure the 'name' (e.g., #code1#) matches where you've used it in the descriptions EXACTLY.

1.6. **MATERIALS Rules (Topic & Slide level)**:
   - For EVERY Topic object and Slide object (where 'isSelected' is NOT false), you MUST generate a 'materials' array containing exactly 1 to 2 objects representing highly relevant supplementary/auxiliary learning materials.
   - Each material object MUST follow this schema exactly:
     {
       "material_type": "pdf" | "link" | "document" | "image" | "code" | "other",
       "url": "https://..." | "/materials/..." | null,
       "codeLanguage": "python" | "javascript" | "html" | "css" | "sql" | null,
       "code": "..." | null
     }
   - CRITICAL SCHEMA rules for material fields:
     - If 'material_type' is "link", then 'url' MUST be a real, high-quality external educational URL/link (e.g. documentation, articles, reference websites), and 'codeLanguage' and 'code' must be null.
     - If 'material_type' is "code", then'codeLanguage' must be the name of the programming language, 'code' must be a complete, useful code snippet, and 'url' must be null.
     - If 'material_type' is "pdf", "document", "image", or "other", then 'url' must be a clean relative file path (e.g., "/materials/python_basics_cheat_sheet.pdf", "/materials/db_design_diagram.png", "/materials/sample_dataset.csv"), and 'codeLanguage' and 'code' must be null.

3. If type is "general" (Topic or Slide):
   { 
     "title": "...", // restate title
     "description": "An absolutely exhaustive, master-class level comprehensive explanation in structured HTML. Wrap the entire output in a <div>. CRITICAL RULE: EXPLAIN EVERYTHING POINTWISE using bulleted lists (<ul>/<li>). NEVER use long paragraphs; every explanation must be broken down into bullet points for readability. BOLDING: Bold ALL important words, core concepts, and key terminology using <strong> tags. LANGUAGE: Use very simple, easy-to-understand English. Make the text attractive using TinyMCE colors (e.g., <span style=\"color: #2563eb;\">Blue Text</span>). NEVER include raw code snippets or illustrations directly in the text. All code and images MUST be generated only as tags (e.g., #code1#, #img1#). You MUST generate relevant tags for EVERY topic, regardless of type. LAYOUT EXCEPTION: If the type (topicType or slideType) is \"video\" or \"audio\", do NOT use a <table> layout; however, you MUST STILL generate the relevant tags and place the tag names (e.g., #code1#) directly within the exhaustive descriptive text at relevant points. FOR ALL OTHER types (e.g., general, accordion, material): Conditional Table Layout. IF you are inserting tags into the description, you MUST use a table layout for assets. Each tag MUST be in its own separate table (max 1 row per table) followed by <p>&nbsp;</p>. EXACT TABLE FORMAT: <table style=\"border-collapse: collapse; width: 100.016%; height: 153.2px;\" border=\"1\"><colgroup><col style=\"width: 49.9921%;\"><col style=\"width: 49.9921%;\"></colgroup><tbody><tr style=\"height: 153.2px;\"><td>#tag1#</td><td><h3 style=\"text-align: left;\">Section Title</h3><ul style=\"text-align: left;\"><li>The tag1 block explains how... (reference tags in text as 'tag1' or 'code1' WITHOUT HASHTS)</li><li>Use <strong>bolding</strong> for key terms.</li></ul></td></tr></tbody></table>. You MUST put the actual tag placeholder with hashes (like #img1#, #code1#) inside the left <td>. Do NOT leave the left <td> empty. Ensure an exactly equal 50%-50% split. IF the description does NOT include any tags, DO NOT use table formatation at all. You must cover EVERY SINGLE DETAIL of this topic, including its origin, core definition, deep-dive into every sub-concept, practical real-world applications, advanced technical nuances, common errors/pitfalls, and best practices. Use <table>, <ul>, <ol>, <strong>, and <blockquote> heavily.", 
     "completionType": "audio", // OR "timer"
     "audioTimestamps": [{ "timestamp": "0:00 - ...", "description": "..." }], // if audio
     "audioScript": "The complete spoken narrative script covering everything in this section.", // ALWAYS provide this full script
     "duration": "string" // if timer
   }

4. If type is "accordion" or "accordian" (Topic or Slide):
   Divide the topic into 4-6 sensible subtopics for thorough coverage.
   {
     "subtopics": [
        {
           "title": "...",
           "description": "Exhaustively detailed explanation (EXPLAIN EVERYTHING POINTWISE using bulleted lists <ul>/<li>) in structured HTML format. Wrap in a <div>. This sub-aspect must be covered with absolute precision and depth. CRITICAL: Code or images MUST ONLY be tags. Conditional Table Layout: IF you are adding tags, format them inside this EXACT table structure: <table style=\"border-collapse: collapse; width: 100.016%; height: 153.2px;\" border=\"1\"><colgroup><col style=\"width: 49.9921%;\"><col style=\"width: 49.9921%;\"></colgroup><tbody><tr style=\"height: 153.2px;\"><td>#tag1#</td><td><h3 style=\"text-align: left;\">Section Title</h3><ul style=\"text-align: left;\"><li>Detailed <strong>pointwise text</strong> here.</li><li>Referencing tag1...</li></ul></td></tr></tbody></table>. You MUST put the actual tag placeholder with hashes (like #img1#, #code1#) inside the left <td>. Do NOT leave the left <td> empty. Add <p>&nbsp;</p> after each table. This ensures an exactly equal 50%-50% split and professional alignment. IF the description does NOT include any tags, DO NOT use table formatation at all.",
           "completionType": "audio", // OR "timer"
           "audioTimestamps": [], // if audio
           "audioScript": "The complete spoken narrative script for this subtopic.", // ALWAYS provide this full script
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
// 
6. **Quiz Questions** (Per Module)
   If this module has a "quiz" object where "isSelected" is NOT false, you MUST add a "questions" array inside the quiz containing ONLY the following allowed question types. Make sure to generate questions strictly from this permitted list based on the educational content:
${quizTypesArr.includes("mcq") ? `
   - MCQ (2-3 questions):
      { "type": "mcq", "questionText": "Question text?", "marks": 1, "options": [{ "text": "Option A", "isCorrect": false }, { "text": "Option B", "isCorrect": true }, { "text": "Option C", "isCorrect": false }, { "text": "Option D", "isCorrect": false }] }
` : ""}
${quizTypesArr.includes("complete_the_sentence") ? `
   - Complete the Sentence (1-2 questions):
      { "type": "complete_the_sentence", "questionText": "The process of _____ is fundamental to...", "marks": 1, "blanks": [{ "correctWord": "photosynthesis", "hint": "ph" }] }
` : ""}
${quizTypesArr.includes("dragdrop") ? `
   - Drag and Drop (1 question):
      { "type": "dragdrop", "prompt": "A paragraph with {1} and {2} as blanks...", "marks": 2, "options": ["option1", "option2", "distractor1"], "blanks": [{ "id": 1, "correctAnswer": "option1" }, { "id": 2, "correctAnswer": "option2" }] }
` : ""}
${quizTypesArr.includes("realword") ? `
   - Real World (1 question):
      { "type": "realword", "questionText": "Identify the correct category for these words:", "marks": 1, "words": ["Word1", "Word2", "Word3", "Word4"], "correctAnswers": [true, false, true, false] }
      CRITICAL: For 'realword' type, the 'words' array MUST contain ONLY single words, NOT sentences.
` : ""}
${quizTypesArr.includes("summarize") ? `
   - Summarize (1 question):
      { "type": "summarize", "questionText": "Summarize the following passage:", "marks": 2, "passage": "A detailed paragraph about the topic...", "expectedSummary": "A brief 2-3 sentence summary...", "timeLimit": 300 }
` : ""}
${quizTypesArr.includes("bestoption") ? `
   - Best Option (1 question):
      { "type": "bestoption", "passage": "A paragraph with {1} blank and {2} blank...", "marks": 2, "blankedWords": [{ "correct": "word1", "options": ["word1", "similar1", "similar2"] }, { "correct": "word2", "options": ["word2", "similar3", "similar4"] }] }
` : ""}
${quizTypesArr.includes("arrangeorder") ? `
   - Arrange the Order (1 question):
      { "type": "arrangeorder", "prompt": "Arrange these steps in the correct order:", "marks": 2, "sentences": ["Step Three.", "Step One.", "Step Four.", "Step Two."], "correctOrder": [1, 3, 0, 2] }
` : ""}
${quizTypesArr.includes("audiotoscript") ? `
   - Audio to Script (1 question):
      { "type": "audiotoscript", "questionText": "Listen to the audio and write the script:", "marks": 2, "script": "The full text that describes the audio narration...", "timestamps": [{ "timestamp": "0:00 - 0:15", "description": "Introduction section..." }] }
` : ""}
${quizTypesArr.includes("videotoscript") ? `
   - Video to Script (1 question):
      { "type": "videotoscript", "questionText": "Watch the video and write the script:", "marks": 2, "script": "The full text that describes the video narration...", "timestamps": [{ "timestamp": "0:00 - 0:15", "description": "Visual description..." }] }
` : ""}
${quizTypesArr.includes("imagetoscript") ? `
   - Image to Script (1 question):
      { "type": "imagetoscript", "questionText": "Describe the image in detail:", "marks": 2, "script": "A detailed description of what should be in the image...", "imageDescription": "Detailed description of the image content for generation..." }
` : ""}
${quizTypesArr.includes("video_pause") ? `
   - Video Pause (1 question):
      { 
        "type": "video_pause", 
        "videoDescription": "A timestamp-wise description of a relevant educational video (max 5 mins).", 
        "marks": 2, 
        "durationSeconds": 120,
        "pauses": [
          { "timestamp": 60, "question": { "type": "...", ... } }
        ]
      }
      RULE: 'durationSeconds' MUST be the total video duration (30 to 300 seconds). 'pauses' MUST contain 1-3 random timestamps ranging within durationSeconds. For EACH pause point, you MUST randomly select a 'question.type' from: \${JSON.stringify(quizTypesArr.filter(t => !["video_pause", "audio_pause", "audiotoscript", "videotoscript", "imagetoscript"].includes(t)) || ["mcq"])}. DO NOT just use mcq; vary the types randomly.
` : ""}
${quizTypesArr.includes("audio_pause") ? `
   - Audio Pause (1 question):
      { 
        "type": "audio_pause", 
        "audioDescription": "A timestamp-wise description of a relevant educational audio (max 5 mins).", 
        "marks": 2, 
        "durationSeconds": 120,
        "pauses": [
          { "timestamp": 45, "question": { "type": "...", ... } }
        ]
      }
      RULE: Similar to Video Pause. 'durationSeconds' MUST be the total audio duration. Randomly select its inner question type from the allowed array.
` : ""}

   7. **Assignments** (Per Module)
       Add an 'assignment' object to this module if "isSelected" is NOT false. **CRITICAL: You MUST randomly select an assignmentType from: ${JSON.stringify(assignmentTypesArr)}.**
       
       Structure:
       {
          "assignmentTitle": "Name of the Assignment",
          "description": "Deeply detailed description of the assignment tasks.",
          "durationHours": 7,
          "maxScore": 100,
          "passingScore": 60,
          "maxAttempts": 3,
          "extensionLimit": 2,
          "assignmentType": "matching", 
          
          // If assignmentType="regular":
          "regularInstructions": "Highly detailed 2-3 page content description for PDF creation.",
          
          // If assignmentType="matching":
                     "matchingData": { "questionText": "Match the following terms with their correct definitions:", "pairs": [{"item": "Term 1", "match": "Match 1"}, {"item": "Term 2", "match": "Match 2"}, {"item": "Term 3", "match": "Match 3"}, {"item": "Term 4", "match": "Match 4"}, {"item": "Term 5", "match": "Match 5"}] }, // AT LEAST 5 matching pairs.,
          
          // If assignmentType="true_false":
                     "trueFalseData": { "questions": [{"text": "Q1?", "answer": true}, {"text": "Q2?", "answer": false}, {"text": "Q3?", "answer": true}, {"text": "Q4?", "answer": false}, {"text": "Q5?", "answer": true}, {"text": "Q6?", "answer": false}, {"text": "Q7?", "answer": true}, {"text": "Q8?", "answer": false}, {"text": "Q9?", "answer": true}, {"text": "Q10?", "answer": false}] }, // EXACTLY 10 questions.,
          
          // If assignmentType="fill_in_the_blanks":
                     "fillBlanksData": { "questions": [{"text": "B1 __", "answer": "A1"}, {"text": "B2 __", "answer": "A2"}, {"text": "B3 __", "answer": "A3"}, {"text": "B4 __", "answer": "A4"}, {"text": "B5 __", "answer": "A5"}, {"text": "B6 __", "answer": "A6"}, {"text": "B7 __", "answer": "A7"}, {"text": "B8 __", "answer": "A8"}, {"text": "B9 __", "answer": "A9"}, {"text": "B10 __", "answer": "A10"}] }, // EXACTLY 10 questions.,
          
           // If assignmentType="paragraph_writing":
           "paragraph": "A highly educational, coherent paragraph (approx. 60-100 words) directly related to the module's subtopics. This will be used as a typing assignment where the student must reproduce it perfectly without any mistakes. Ensure the vocabulary is professional and the text uses only standard characters (avoid special symbols or unusual formatting) for a smooth typing experience."
       }

   8. **Topic Assessments (If Present)**
       If a Topic object contains a 'topicQuiz' and its "isSelected" is NOT false, you MUST add a "questions" array to it. **CRITICAL RULES**: Generate 8-10 questions for a topicQuiz. You MUST randomly pick a DIVERSE MIX of question types from: ${JSON.stringify(quizTypesArr.filter(t => !["video_pause", "audio_pause", "audiotoscript", "videotoscript", "imagetoscript"].includes(t)))}. DO NOT generate ONLY mcq questions — ensure at least 2-3 different types are used. **CRITICAL SCOPE RULE**: The questions for this topicQuiz MUST be strictly limited to the content covered in THIS INDIVIDUAL TOPIC. DO NOT pull concepts from other topics in the module. If a question requires knowledge outside of this specific topic, you fail.
       If a Topic object contains a 'topicAssignment' and its "isSelected" is NOT false, you MUST populate it with the appropriate detailed fields based on its assignmentType, just like Module Assignments. **CRITICAL SCOPE RULE**: The tasks/questions for this topicAssignment MUST be strictly limited to the content covered in THIS INDIVIDUAL TOPIC. DO NOT include tasks requiring knowledge from other topics. Keep the instructions and descriptions concise to save length.

Original Module JSON:
${JSON.stringify(moduleData)}

CRITICAL RULES:
- RETURN ONLY VALID JSON mirroring the original module object completely.
- Do NOT skip any topics or slides in the payload. They must all map exactly.
- If the module has a quiz, it MUST have its quiz.questions array populated with ONLY the question types listed above.
- If the module has an 'assignment' object, it MUST be populated following the structure provided above.
- Keep the descriptions highly formatted, educational, and thorough. 
- For any 'image' tags, ALWAYS provide both 'prompt' and 'detailed_script' (a comprehensive script explaining exactly what the image should show for AI generation).
- DO NOT wrap the result in \`\`\`json ... \`\`\`. Output raw valid JSON.

IMPORTANT RULES:
- Return ONLY valid JSON.
- Do not include markdown.
- Do not include explanations.
- Do not include text before or after JSON.
- Ensure all arrays and objects are properly closed.
- Ensure commas between array elements.
- Response must start with { and end with }.
`.trim();
};

const generateCourseContent = async (req, res) => {
    try {
        let { courseData, contentStyle, forceAudioCourse } = req.body;

        const defaultQuizTypes = ["mcq", "complete_the_sentence", "dragdrop", "realword", "summarize", "bestoption", "arrangeorder", "audiotoscript", "videotoscript", "imagetoscript", "video_pause", "audio_pause"];
        const defaultAssignmentTypes = ["regular", "matching", "true_false", "fill_in_the_blanks", "paragraph_writing"];

        const quizTypes = parseAllowedSelection(req.body.quizTypes, defaultQuizTypes, defaultQuizTypes);
        if (req.body.quizTypes !== undefined && quizTypes === null) {
            return res.status(400).json({ success: false, error: "quizTypes must contain at least one valid type from the allowed list." });
        }

        const assignmentTypes = parseAllowedSelection(req.body.assignmentTypes, defaultAssignmentTypes, defaultAssignmentTypes);
        if (req.body.assignmentTypes !== undefined && assignmentTypes === null) {
            return res.status(400).json({ success: false, error: "assignmentTypes must contain at least one valid type from the allowed list." });
        }

        if (!courseData || !courseData.sessions) {
            return res.status(400).json({ success: false, error: "Invalid course data passed for content generation." });
        }

        req.moduleTokenLogs = []; // Initialize array to capture token usage across concurrent module generations

        // Recalculate durations to account for any deletions from UI before generation
        courseData = recalculateCourseDurations(courseData);

        console.log("📚 Starting detailed content generation in parallel across sessions...");
        const model = genAI.getGenerativeModel({
            model: GEMINI_MODEL,
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        // Map over each session and run them concurrently
        const detailedSessionsPromises = courseData.sessions.map(async (session, sIdx) => {
            if (!session.modules) return session;

            const detailedModulesPromises = session.modules.map(async (module, mIdx) => {
                let hasSelectedTopics = false;
                module.topics?.forEach(t => {
                    if (t.isSelected !== false) hasSelectedTopics = true;
                });

                if (!hasSelectedTopics) {
                    return module;
                }

                let maxRetries = 3;
                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    console.log(`⏳ Generating content for session ${sIdx + 1}, module ${mIdx + 1} (Attempt ${attempt}/${maxRetries})...`);
                    const prompt = buildModuleContentPrompt(module, contentStyle, forceAudioCourse, quizTypes, assignmentTypes);

                    try {
                        await waitOneMinute();
                        const result = await model.generateContent(prompt);
                        const response = await result.response;
                        const text = await response.text();

                        const usage = response.usageMetadata;
                        if (usage && req.moduleTokenLogs) {
                            req.moduleTokenLogs.push(
                                `[Module Generation: Session ${sIdx + 1}, Module ${mIdx + 1} - "${module.moduleTitle}"]\n` +
                                `Prompt Tokens: ${usage.promptTokenCount}\n` +
                                `Completion Tokens: ${usage.candidatesTokenCount}\n` +
                                `Total Tokens: ${usage.totalTokenCount}\n`
                            );
                        }

                        const parsed = jsonParser(text);

                        if (!parsed) {
                            if (attempt < maxRetries) {
                                console.warn(`⚠️ Parsing failed for session ${sIdx + 1}, module ${mIdx + 1} (Attempt ${attempt}). Retrying...`);
                                continue;
                            }
                            console.error(`🚨Parsing failed for session ${sIdx + 1}, module ${mIdx + 1} after 3 attempts.`);
                            throw new Error(`Failed to parse AI output for session ${sIdx + 1}, module ${mIdx + 1} after ${maxRetries} attempts.`);
                        }

                        // --- VALIDATION FOR REQUIRED AUDIO ---
                        let missingAudio = false;
                        parsed.topics?.forEach((t, tIdx) => {
                            if (t.isSelected === false) return;

                            let needsAudio = t.completionType === "audio" || t.topicType === "audio" || forceAudioCourse;

                            if (needsAudio && t.contentGenerated && t.topicType !== "video") {
                                let hasAudioData = false;
                                if (t.topicType === "audio" && Array.isArray(t.contentGenerated.timestamps) && t.contentGenerated.timestamps.length > 0) {
                                    hasAudioData = true;
                                } else if (t.topicType === "general" && Array.isArray(t.contentGenerated.audioTimestamps) && t.contentGenerated.audioTimestamps.length > 0) {
                                    hasAudioData = true;
                                } else if ((t.topicType === "accordion" || t.topicType === "accordian") && Array.isArray(t.contentGenerated.subtopics)) {
                                    hasAudioData = t.contentGenerated.subtopics.some(sub => Array.isArray(sub.audioTimestamps) && sub.audioTimestamps.length > 0);
                                } else if (t.topicType === "multislides") {
                                    hasAudioData = true;
                                }

                                if (!hasAudioData) {
                                    console.warn(`⚠️ Module ${mIdx + 1} Topic ${tIdx + 1} missing required audio timestamps for type ${t.topicType}!`);
                                    missingAudio = true;
                                }
                            }

                            if (t.topicType === "multislides" && Array.isArray(t.slides)) {
                                t.slides.forEach((sl, sIdxSlide) => {
                                    if (sl.isSelected === false) return;
                                    let slideNeedsAudio = sl.completionType === "audio" || sl.slideType === "audio" || forceAudioCourse;
                                    if (slideNeedsAudio && sl.contentGenerated && sl.slideType !== "video") {
                                        let hasSlideAudio = false;
                                        if (sl.slideType === "audio" && Array.isArray(sl.contentGenerated.timestamps) && sl.contentGenerated.timestamps.length > 0) {
                                            hasSlideAudio = true;
                                        } else if (sl.slideType === "general" && Array.isArray(sl.contentGenerated.audioTimestamps) && sl.contentGenerated.audioTimestamps.length > 0) {
                                            hasSlideAudio = true;
                                        } else if ((sl.slideType === "accordion" || sl.slideType === "accordian") && Array.isArray(sl.contentGenerated.subtopics)) {
                                            hasSlideAudio = sl.contentGenerated.subtopics.some(sub => Array.isArray(sub.audioTimestamps) && sub.audioTimestamps.length > 0);
                                        }

                                        if (!hasSlideAudio) {
                                            console.warn(`⚠️ Module ${mIdx + 1} Topic ${tIdx + 1} Slide ${sIdxSlide + 1} missing required audio timestamps for type ${sl.slideType}!`);
                                            missingAudio = true;
                                        }
                                    }
                                });
                            }
                        });

                        if (missingAudio) {
                            if (attempt < maxRetries) {
                                console.warn(`⚠️ Validation failed for session ${sIdx + 1}, module ${mIdx + 1} (Attempt ${attempt}): Missing required audio data. Retrying...`);
                                continue;
                            }
                            console.error(`🚨 Validation failed for session ${sIdx + 1}, module ${mIdx + 1} after 3 attempts: Missing required audio data.`);
                            throw new Error(`Audio validation failed for session ${sIdx + 1}, module ${mIdx + 1} after ${maxRetries} attempts.`);
                        }
                        // ------------------------------------

                        return parsed;
                    } catch (err) {
                        if (attempt < maxRetries) {
                            console.warn(`⚠️ Error generating/parsing session ${sIdx + 1}, module ${mIdx + 1} (Attempt ${attempt}):`, err.message, `. Retrying...`);
                            continue;
                        }
                        console.error(`🚨 Error generating/parsing session ${sIdx + 1}, module ${mIdx + 1} after 3 attempts:`, err);
                        throw new Error(`API Error during generation for session ${sIdx + 1}, module ${mIdx + 1}: ${err.message}`);
                    }
                }
            });

            const detailedModules = await Promise.all(detailedModulesPromises);
            return {
                ...session,
                modules: detailedModules
            };
        });

        console.log('detailedSessionsPromises', detailedSessionsPromises)
        const detailedSessions = await Promise.all(detailedSessionsPromises);

        // Reconstruct full course data
        const detailedCourse = {
            ...courseData,
            sessions: detailedSessions
        };

        console.log("✅ Received and assembled all detailed AI session content!");

        // Store the complete generated JSON to a txt file
        try {
            const safeCourseName = (courseData.courseTitle || "Course").replace(/[^a-zA-Z0-9\-_ ]/g, "").trim().replace(/\s+/g, "_");
            const courseFolder = path.join(__dirname, `../../generated_courses/${safeCourseName}`);
            if (!fs.existsSync(courseFolder)) {
                fs.mkdirSync(courseFolder, { recursive: true });
            }
            const logPath = path.join(__dirname, '../../uploads/generated_course_data.txt');
            const logDir = path.dirname(logPath);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            fs.writeFileSync(logPath, JSON.stringify(detailedCourse, null, 2), 'utf8');
            console.log(`📝 Generated course JSON saved to ${logPath}`);

            // Write accumulated token logs
            if (req.moduleTokenLogs && req.moduleTokenLogs.length > 0) {
                const tokenLogPath = path.join(courseFolder, `${safeCourseName}_token_usage_logs.txt`);
                let logContent = `\n--- Detailed Content Generation Token Logs ---\n`;
                logContent += `Date: ${new Date().toISOString()}\n\n`;
                logContent += req.moduleTokenLogs.join("\n");
                fs.appendFileSync(tokenLogPath, logContent, 'utf8');
                console.log(`📝 Token usage logs appended to ${tokenLogPath}`);
            }

        } catch (fileErr) {
            console.error("⚠️ Failed to save generated course JSON or token logs to file:", fileErr);
        }

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
const generateBlankAudioIfMissing = () => {
    try {
        const createMp3 = (baseFolder, filename) => {
            const folderPath = path.join(__dirname, `../../uploads/${baseFolder}`);
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }
            const audioPath = path.join(folderPath, filename);
            if (!fs.existsSync(audioPath)) {
                // Generate a true 2.0-second silent WAV format byte buffer 
                // Browsers natively parse this perfectly within an .mp3 URL
                // giving it exactly a 0:02 duration, fixing the 0 duration bug.
                const sampleRate = 8000;
                const numChannels = 1;
                const bitsPerSample = 8;
                const subChunk2Size = sampleRate * numChannels * (bitsPerSample / 8) * 2; // 2 seconds
                const chunkSize = 36 + subChunk2Size;
                const buffer = Buffer.alloc(44 + subChunk2Size);
                buffer.write('RIFF', 0);
                buffer.writeUInt32LE(chunkSize, 4);
                buffer.write('WAVE', 8);
                buffer.write('fmt ', 12);
                buffer.writeUInt32LE(16, 16);
                buffer.writeUInt16LE(1, 20);
                buffer.writeUInt16LE(numChannels, 22);
                buffer.writeUInt32LE(sampleRate, 24);
                buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
                buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
                buffer.writeUInt16LE(bitsPerSample, 34);
                buffer.write('data', 36);
                buffer.writeUInt32LE(subChunk2Size, 40);
                fs.writeFileSync(audioPath, buffer);
            }
        };

        const filename = "blank_audio.mp3";
        createMp3("audio", filename);
        createMp3("audios/general", filename);
        createMp3("audios/accordion", filename);
        createMp3("audios/multi_slide", filename);

        return filename;
    } catch (e) {
        console.error("Failed to ensure blank audio:", e);
        return "dummy_url.mp3";
    }
};

const ensurePlaceholderVideo = () => {
    try {
        const sourcePath = path.join(__dirname, "../../uploads/placeholder/placeholder 1.mp4");
        const filename = "placeholder_1.mp4";

        const copyVideo = (baseFolder) => {
            const folderPath = path.join(__dirname, `../../uploads/${baseFolder}`);
            if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
            const destPath = path.join(folderPath, filename);
            if (!fs.existsSync(destPath) && fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, destPath);
            }
        };

        copyVideo("video");
        copyVideo("multi_slide/video");

        return filename;
    } catch (e) {
        console.error("Failed to ensure placeholder video:", e);
        return "placeholder_1.mp4";
    }
};

const generateBlankVideoDuration = (durationSeconds, filename, subfolder = "video") => {
    return new Promise((resolve) => {
        const physicalFolder = subfolder === "multiSlide/video" ? "multi_slide/video" : subfolder;
        const folderPath = path.join(__dirname, `../../uploads/${physicalFolder}`);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
        const videoPath = path.join(folderPath, filename);
        if (fs.existsSync(videoPath)) {
            return resolve(`/${subfolder}/${filename}`);
        }

        const copyPlaceholder = () => {
            const placeholderFilename = ensurePlaceholderVideo();
            const placeholderPath = path.join(__dirname, `../../uploads/${physicalFolder}/${placeholderFilename}`);
            try {
                if (fs.existsSync(placeholderPath)) {
                    fs.copyFileSync(placeholderPath, videoPath);
                    return `/${subfolder}/${filename}`;
                }
            } catch (copyErr) {
                console.error("Failed to copy fallback placeholder video:", copyErr);
            }
            return `/${subfolder}/placeholder_1.mp4`;
        };

        try {
            ffmpeg.setFfmpegPath(ffmpegPath);

            const duration = Math.min(Math.max(parseInt(durationSeconds) || 10, 1), 600); // between 1 and 600 seconds
            ffmpeg()
                .input('color=c=black:s=640x360')
                .inputOptions('-f', 'lavfi')
                .input('anullsrc=r=44100:cl=mono')
                .inputOptions('-f', 'lavfi')
                .duration(duration)
                .output(videoPath)
                .on('end', () => resolve(`/${subfolder}/${filename}`))
                .on('error', (err) => {
                    console.error("FFMPEG Error:", err);
                    resolve(copyPlaceholder());
                })
                .run();
        } catch (err) {
            console.error("FFMPEG Init Error:", err);
            resolve(copyPlaceholder());
        }
    });
};

const createBlankAudioDuration = (durationSeconds, filename, subfolder = "audio") => {
    try {
        const folderPath = path.join(__dirname, `../../uploads/${subfolder}`);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
        const audioPath = path.join(folderPath, filename);
        if (!fs.existsSync(audioPath)) {
            const sampleRate = 8000;
            const numChannels = 1;
            const bitsPerSample = 8;
            const duration = Math.min(Math.max(parseInt(durationSeconds) || 10, 1), 600); // between 1 and 600 seconds
            const subChunk2Size = sampleRate * numChannels * (bitsPerSample / 8) * duration;
            const chunkSize = 36 + subChunk2Size;
            const buffer = Buffer.alloc(44 + subChunk2Size);
            buffer.write('RIFF', 0);
            buffer.writeUInt32LE(chunkSize, 4);
            buffer.write('WAVE', 8);
            buffer.write('fmt ', 12);
            buffer.writeUInt32LE(16, 16);
            buffer.writeUInt16LE(1, 20);
            buffer.writeUInt16LE(numChannels, 22);
            buffer.writeUInt32LE(sampleRate, 24);
            buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
            buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
            buffer.writeUInt16LE(bitsPerSample, 34);
            buffer.write('data', 36);
            buffer.writeUInt32LE(subChunk2Size, 40);
            fs.writeFileSync(audioPath, buffer);
        }
        return `/${subfolder}/${filename}`;
    } catch (e) {
        console.error("Failed to ensure blank audio duration:", e.message);
        return subfolder === "audio" ? "/audio/blank_audio.mp3" : `/${subfolder}/blank_audio.mp3`;
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

        // Update topic tags if provided
        if (topicData.tags && Array.isArray(topicData.tags)) {
            // Sync with TopicTag table
            await TopicTag.destroy({ where: { topic_id: topicDB.id, slide_id: null } });
            for (const tag of topicData.tags) {
                if (!tag.name) continue;

                const dDetectedType = tag.type || tag.tag_type || tag.tagType || (tag.content ? 'code' : 'image');
                const dDetectedPath = (dDetectedType === 'image' || dDetectedType === 'file') ? '/placeholder/placeholder2.png' : (tag.content || tag.prompt || tag.tag_file_path || '/placeholder/placeholder2.png');

                await TopicTag.create({
                    topic_id: topicDB.id,
                    tag_file_type: dDetectedType,
                    tag_file_path: dDetectedPath,
                    code_language: tag.language || null,
                    tag: tag.name || null,
                    created_by: userId,
                    updated_by: userId,
                    status: 'approved'
                });

                // Add image scripts to media descriptions
                if (dDetectedType === 'image' && (tag.detailed_script || tag.prompt)) {
                    if (!mediaContent.includes(`=== TOPIC: ${topicDB.title} ===`)) {
                        mediaContent += `\n\n=== TOPIC: ${topicDB.title} ===\n`;
                    }
                    mediaContent += `\n[IMAGE TAG: ${tag.name}]\nScript: ${tag.detailed_script || tag.prompt}\n`;
                }
            }
            console.log(`✅ Updated tags in TopicTag table for topic: ${topicDB.title}`);
        }

        // Clear and Save Topic-level materials
        await Material.destroy({ where: { topic_id: topicDB.id, slide_id: null } });
        if (topicData.materials && Array.isArray(topicData.materials)) {
            for (const mat of topicData.materials) {
                const finalUrl = buildMaterialUrl(mat.url, mat.material_type || 'other', 'material');
                await Material.create({
                    topic_id: topicDB.id,
                    slide_id: null,
                    material_type: mat.material_type || 'other',
                    url: finalUrl,
                    codeLanguage: mat.codeLanguage || null,
                    code: mat.code || null,
                    created_by: userId,
                    updated_by: userId,
                    created_by_type: role,
                    updated_by_type: role
                });

                // Generate physical file on disk to prevent 404
                await generateMaterialFile(
                    finalUrl,
                    topicDB.title,
                    topicDB.description,
                    mat.material_type || 'other',
                    mat.code || null
                );
            }
            console.log(`✅ Saved topic-level materials for topic: ${topicDB.title}`);
        }

        const content = topicData.contentGenerated;
        if (!content) return res.status(200).json({ success: true, message: "No content to save" });

        let rawType = topicData.topicType?.toLowerCase() || topicDB.content_type?.toLowerCase() || "general";
        if (rawType === "slide") rawType = "multislides";
        if (rawType === "accordian") rawType = "accordion";

        // Update the main Topic description so the AI-generated exhaustive formatting with tags isn't lost for Video/Audio
        if (content.description && rawType !== "multislides" && rawType !== "slide") {
            await topicDB.update({ description: content.description });
        }

        // ─── Update Logic: Clear Existing Content for this Topic ─────────────
        // This ensures regeneration saves correct content without duplicates
        await Video.destroy({ where: { topic_id: topicDB.id } });
        await Audio.destroy({ where: { topic_id: topicDB.id } });
        await Accordion.destroy({ where: { topic_id: topicDB.id } });
        await GeneralMaterial.destroy({ where: { topic_id: topicDB.id } });

        // Handle Topic level Database Insertions
        const blankAudioFilename = generateBlankAudioIfMissing();
        const placeholderVideoFilename = ensurePlaceholderVideo();

        if (rawType === "video") {
            // Generate topic-specific blank video with actual duration
            const topicSafeName = (topicDB.title || "topic").replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const durationSec = Math.round((parseFloat(topicDB.total_duration) || 1) * 60);
            const topicVideoName = `topic_${topicDB.id}_${topicSafeName}_${durationSec}s.mp4`;
            const topicVideoPath = await generateBlankVideoDuration(durationSec, topicVideoName);

            const topicAudioNameForVideo = `topic_${topicDB.id}_video_audio_${topicSafeName}_${durationSec}s.mp3`;
            const topicAudioUrlForVideo = createBlankAudioDuration(durationSec, topicAudioNameForVideo, "audios/video");

            await Video.create({
                topic_id: topicDB.id,
                url: topicVideoPath,
                audio_url: topicAudioUrlForVideo,
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
            const topicSafeName = (topicDB.title || "topic").replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const durationSec = Math.round((parseFloat(topicDB.total_duration) || 1) * 60);
            const topicAudioName = `topic_${topicDB.id}_${topicSafeName}_${durationSec}s.mp3`;
            const topicAudioPath = createBlankAudioDuration(durationSec, topicAudioName, "audio");

            await Audio.create({
                topic_id: topicDB.id,
                url: topicAudioPath,
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
                    const subCompletionType = sub.completionType || "audio";
                    let subAudioUrl = `/audios/accordion/blank_audio.mp3`;

                    if (subCompletionType === "audio") {
                        const safeTitle = (sub.title || "subtopic").replace(/[^a-z0-9]/gi, '_').toLowerCase();
                        // Get individual sub-duration if AI generated it, else default
                        const subDurSec = Math.round((parseFloat(sub.durationMinutes || 0.5) || 0.5) * 60);
                        const subFileName = `subtopic_${topicDB.id}_acc_${safeTitle}_${subDurSec}s.mp3`;
                        subAudioUrl = createBlankAudioDuration(subDurSec, subFileName, "audios/accordion");
                    }

                    await Accordion.create({
                        topic_id: topicDB.id,
                        title: sub.title || "Subtopic",
                        body: sub.description || "",
                        audio_url: subAudioUrl,
                        completion_type: subCompletionType,
                        duration_minutes: sub.durationMinutes || 0,
                        created_by: userId,
                        updated_by: userId,
                        created_by_type: role,
                        updated_by_type: role
                    });
                }
            }
        } else if (rawType === "general") {
            const completionType = content.completionType || "audio";
            let audioUrl = `/audios/general/blank_audio.mp3`;

            if (completionType === "audio") {
                const safeName = (topicDB.title || "topic").replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const durSec = Math.round((parseFloat(topicDB.total_duration) || 1) * 60);
                const fileName = `topic_${topicDB.id}_general_${safeName}_${durSec}s.mp3`;
                audioUrl = createBlankAudioDuration(durSec, fileName, "audios/general");
            }

            await GeneralMaterial.create({
                topic_id: topicDB.id,
                title: content.title || topicDB.title,
                description: content.description || "",
                audio_url: audioUrl,
                completion_type: completionType,
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
                    if (!slideData) continue;

                    let sRawType = slideData.slideType?.toLowerCase() || slideDB.type?.toLowerCase() || "general";
                    if (sRawType === "accordian") sRawType = "accordion";
                    if (!slideData.contentGenerated && sRawType !== "video") continue;

                    const sContent = slideData.contentGenerated || {};

                    // Clear existing slide content for update logic
                    await MultiSlideAccordion.destroy({ where: { multi_slide_id: slideDB.id } });
                    await MultiSlideGeneral.destroy({ where: { multi_slide_id: slideDB.id } });
                    await MultiSlideVideo.destroy({ where: { multi_slide_id: slideDB.id } });

                    // Update slide tags if provided
                    if (slideData.tags && Array.isArray(slideData.tags)) {
                        // Sync with TopicTag table
                        await TopicTag.destroy({ where: { slide_id: slideDB.id } });
                        for (const tag of slideData.tags) {
                            if (!tag.name) continue;
                            const sdType = tag.type || tag.tag_type || tag.tagType || (tag.content ? 'code' : 'image');
                            const sdPath = (sdType === 'image' || sdType === 'file') ? '/placeholder/placeholder2.png' : (tag.content || tag.prompt || '/placeholder/placeholder2.png');

                            await TopicTag.create({
                                topic_id: topicDB.id,
                                slide_id: slideDB.id,
                                tag_file_type: sdType,
                                tag_file_path: sdPath,
                                code_language: tag.language || null,
                                tag: tag.name || null,
                                created_by: userId,
                                updated_by: userId,
                                status: 'approved'
                            });

                            // Add slide image scripts to media descriptions
                            if (sdType === 'image' && (tag.detailed_script || tag.prompt)) {
                                if (!mediaContent.includes(`=== TOPIC: ${topicDB.title} ===`)) {
                                    mediaContent += `\n\n=== TOPIC: ${topicDB.title} ===\n`;
                                }
                                mediaContent += `\n[SLIDE IMAGE TAG: ${tag.name} (Slide: ${slideDB.title})]\nScript: ${tag.detailed_script || tag.prompt}\n`;
                            }
                        }
                        console.log(`✅ Updated tags in TopicTag table for slide: ${slideDB.title}`);
                    }

                    // Clear and Save Slide-level materials
                    await Material.destroy({ where: { topic_id: topicDB.id, slide_id: slideDB.id } });
                    if (slideData.materials && Array.isArray(slideData.materials)) {
                        for (const mat of slideData.materials) {
                            const finalUrl = buildMaterialUrl(mat.url, mat.material_type || 'other', 'slide_material');
                            await Material.create({
                                topic_id: topicDB.id,
                                slide_id: slideDB.id,
                                material_type: mat.material_type || 'other',
                                url: finalUrl,
                                codeLanguage: mat.codeLanguage || null,
                                code: mat.code || null,
                                created_by: userId,
                                updated_by: userId,
                                created_by_type: role,
                                updated_by_type: role
                            });

                            // Generate physical file on disk to prevent 404
                            await generateMaterialFile(
                                finalUrl,
                                slideDB.title,
                                slideDB.description || topicDB.description,
                                mat.material_type || 'other',
                                mat.code || null
                            );
                        }
                        console.log(`✅ Saved slide-level materials for slide: ${slideDB.title}`);
                    }

                    // Attach audio_url to the MultiSlide parent if needed
                    const sCompletionType = slideDB.completion_type || "audio";
                    let sAudioUrl = `/audios/multi_slide/blank_audio.mp3`;

                    if (sCompletionType === "audio") {
                        const slideSafeTitle = (slideDB.title || "slide").replace(/[^a-z0-9]/gi, '_').toLowerCase();
                        const sDurSec = Math.round((parseFloat(slideDB.total_slide_duration || slideDB.slide_duration || 0.5) || 0.5) * 60);
                        const sFileName = `slide_${slideDB.id}_${slideSafeTitle}_${sDurSec}s.mp3`;
                        sAudioUrl = createBlankAudioDuration(sDurSec, sFileName, "audios/multi_slide");
                    }

                    await slideDB.update({
                        description: sContent.description || slideDB.description,
                        audio_url: sAudioUrl,
                        updated_by: userId
                    });

                    if (sRawType === "video" || sRawType === "audio") {
                        mediaContent += `\n\n=== SLIDE ${sRawType.toUpperCase()}: ${slideDB.title} ===\n`;
                        if (sContent.timestamps) mediaContent += sContent.timestamps.map(ts => `[${ts.timestamp}] ${ts.description}`).join("\n");

                        // Insert slide video/audio record
                        if (sRawType === "video") {
                            const sVideoDurSec = Math.round((parseFloat(slideDB.total_slide_duration || slideDB.slide_duration || 0.5) || 0.5) * 60);

                            // Dynamically generate the slide video with correct duration
                            const slideSafeName = (slideDB.title || "slide").replace(/[^a-z0-9]/gi, '_').toLowerCase();
                            const slideVideoName = `slide_${slideDB.id}_${slideSafeName}_${sVideoDurSec}s.mp4`;
                            const slideVideoPath = await generateBlankVideoDuration(sVideoDurSec, slideVideoName, "multiSlide/video");

                            const sVideoAudioName = `slide_video_${slideDB.id}_${sVideoDurSec}s.mp3`;
                            const sVideoAudioUrl = createBlankAudioDuration(sVideoDurSec, sVideoAudioName, "audios/slide_video");

                            await MultiSlideVideo.create({
                                multi_slide_id: slideDB.id,
                                url: slideVideoPath,
                                // audio_url: sVideoAudioUrl,
                                type: "internal",
                                duration_minutes: slideDB.total_slide_duration || slideDB.slide_duration || 0,
                                created_by: userId,
                                updated_by: userId,
                                created_by_type: role,
                                updated_by_type: role
                            });
                        }
                    } else if (sRawType === "accordion" || sRawType === "accordian") {
                        if (sContent.subtopics) {
                            for (const sub of sContent.subtopics) {
                                const sAccSafeTitle = (sub.title || "sub").replace(/[^a-z0-9]/gi, '_').toLowerCase();
                                const sAccDurSec = 30; // default for slide subtopics
                                const sAccAudioName = `slide_acc_${slideDB.id}_${sAccSafeTitle}.mp3`;
                                const sAccAudioUrl = createBlankAudioDuration(sAccDurSec, sAccAudioName, "audios/slide_accordion");

                                await MultiSlideAccordion.create({
                                    multi_slide_id: slideDB.id,
                                    title: sub.title || "Subtopic",
                                    body: sub.description || "",
                                    // audio_url: sAccAudioUrl,
                                    created_by: userId,
                                    updated_by: userId,
                                    created_by_type: role,
                                    updated_by_type: role
                                });
                            }
                        }
                    } else {
                        const sGenDurSec = 30;
                        const sGenAudioName = `slide_gen_${slideDB.id}.mp3`;
                        const sGenAudioUrl = createBlankAudioDuration(sGenDurSec, sGenAudioName, "audios/slide_general");

                        await MultiSlideGeneral.create({
                            multi_slide_id: slideDB.id,
                            // title: slideDB.title,
                            // description: sContent.description || "",
                            // audio_url: sGenAudioUrl,
                            codeLanguage: null,
                            code: "",
                            created_by: userId,
                            updated_by: userId,
                            created_by_type: role,
                            updated_by_type: role
                        });
                    }
                }
            }
        }

        // Append media descriptions to txt
        if (mediaContent) {
            await fsp.appendFile(mediaFilePath, mediaContent, "utf8");
        }

        return res.status(200).json({
            success: true,
            message: "Topic content saved successfully"
        });
    } catch (error) {
        console.error("❌ Save course content failed:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Failed to save topic content",
        });
    }
};

// ─── Controller: Save Generated Quiz Content ──────────────────────────────────

const saveGeneratedQuizContent = async (req, res) => {
    try {
        const { courseId, sessionIndex, moduleIndex, quizData } = req.body;
        const userId = req.user?.id || 1;
        const role = req.user?.role || "admin";

        if (!courseId || !quizData || sessionIndex === undefined || moduleIndex === undefined) {
            return res.status(400).json({ success: false, error: "Invalid quiz data." });
        }

        // Load DB structure
        const sessionDBList = await Session.findAll({ where: { course_id: courseId }, order: [['sequence_no', 'ASC']] });
        const sessionDB = sessionDBList[sessionIndex];
        if (!sessionDB) return res.status(404).json({ success: false, error: "Session not found." });

        const moduleDBList = await Module.findAll({ where: { session_id: sessionDB.id }, order: [['sequence_no', 'ASC']] });
        const moduleDB = moduleDBList[moduleIndex];
        if (!moduleDB) return res.status(404).json({ success: false, error: "Module not found." });

        // Clean up any existing quizzes for this module
        const existingQuizzes = await Quizzes.findAll({ where: { module_id: moduleDB.id } });
        for (const eq of existingQuizzes) {
            await TopicContent.destroy({ where: { quiz_id: eq.id } });
            const existingQuestions = await QuizQuestion.findAll({ where: { quiz_id: eq.id } });
            for (const question of existingQuestions) {
                await QuizQuestionOption.destroy({ where: { question_id: question.id } });
            }
            await QuizQuestion.destroy({ where: { quiz_id: eq.id } });
            await eq.destroy();
        }

        const quizzesToProcess = Array.isArray(quizData) ? quizData : [quizData];
        const savedQuizIds = [];

        for (const currentQuizData of quizzesToProcess) {
            // Create the quiz
            const quiz = await Quizzes.create({
                module_id: moduleDB.id,
                title: currentQuizData.quizTitle || moduleDB.title + " Quiz",
                duration_minutes: Math.max(1, parseInt(currentQuizData.durationMinutes) || 15),
                passing_score: parseInt(currentQuizData.passingMarks) || 60,
                max_attempts: Math.max(1, parseInt(currentQuizData.maxAttempts) || 3),
                attempts_gap: parseInt(currentQuizData.attemptGap) || 0,
                attempts_renew_days: parseInt(currentQuizData.attemptRenewal) || 0,
                status: "active",
                isQuizCompulsory: true,
                quizType: "normal",
                isWarning: false,
                no_of_warning: 3,
                created_by: userId,
                updated_by: userId,
                created_by_type: role,
                updated_by_type: role,
            });

            console.log("📝 Quiz created:", quiz.id, "for module:", moduleDB.title);
            savedQuizIds.push(quiz.id);

            // If it's a topic quiz, save the mapping to TopicContent
            if (currentQuizData.topicSequenceNo) {
                const topic = await Topic.findOne({
                    where: { module_id: moduleDB.id, sequence_no: currentQuizData.topicSequenceNo }
                });
                if (topic) {
                    await TopicContent.create({
                        module_id: moduleDB.id,
                        topic_id: topic.id,
                        quiz_id: quiz.id,
                        created_by: userId,
                        updated_by: userId,
                    });
                    console.log(`📎 Linked topicQuiz ${quiz.id} to topic ${topic.id}`);
                }
            }

            // Helper function for recursive saving
            const saveQuizQuestion = async (quizId, q, parentPauseId = 0) => {
                const qType = q.type?.toLowerCase() || "mcq";
                let dbType = qType;
                if (qType === "complete_the_sentence") dbType = "complete the sentance";
                if (qType === "summarize" || qType === "summarizepassage") dbType = "summarizepassage";

                const questionFields = {
                    quiz_id: quizId,
                    type: dbType,
                    marks: q.marks || 1,
                    is_active: true,
                    assigned_pause_id: parentPauseId,
                    created_by: userId,
                    updated_by: userId,
                    created_by_type: role,
                    updated_by_type: role,
                };

                switch (qType) {
                    case "mcq":
                        questionFields.mcq_question_text = q.questionText || "";
                        break;
                    case "complete_the_sentence": {
                        let text = q.questionText || "";
                        questionFields.mcq_question_text = text.replace(/{\d+}/g, "_____");
                        break;
                    }
                    case "dragdrop": {
                        let prompt = q.prompt || "";
                        prompt = prompt.replace(/{\d+}/g, "___");
                        questionFields.dragdrop_prompt = prompt;
                        questionFields.dragdrop_options = q.options || [];
                        if (q.blanks && Array.isArray(q.blanks)) {
                            questionFields.dragdrop_blanks = q.blanks
                                .sort((a, b) => a.id - b.id)
                                .map(b => b.correctAnswer || b);
                        } else {
                            questionFields.dragdrop_blanks = [];
                        }
                        break;
                    }
                    case "realword":
                        questionFields.mcq_question_text = q.questionText || "";
                        questionFields.realword_words = q.words || [];
                        questionFields.realword_correct_answers = q.correctAnswers || [];
                        break;
                    case "summarize":
                    case "summarizepassage":
                        questionFields.mcq_question_text = q.questionText || q.passage || "";
                        questionFields.summarizepassage_summary = q.expectedSummary || "";
                        questionFields.summarizepassage_time_limit = q.timeLimit || 300;
                        break;
                    case "bestoption": {
                        let passage = q.passage || "";
                        passage = passage.replace(/{\d+}/g, "___");
                        questionFields.bestoption_passage = passage;
                        if (q.blankedWords && Array.isArray(q.blankedWords)) {
                            questionFields.bestoption_blanked_words = q.blankedWords.map(b => ({
                                word: b.correct || b.word || "",
                                options: b.options || []
                            }));
                        } else {
                            questionFields.bestoption_blanked_words = [];
                        }
                        break;
                    }
                    case "arrangeorder":
                        questionFields.arrangeorder_prompt = q.prompt || "";
                        questionFields.sentences = q.sentences || [];
                        questionFields.correct_order = q.correctOrder || [];
                        break;
                    case "audiotoscript":
                        questionFields.mcq_question_text = q.questionText || "";
                        questionFields.audiotoscript_script = q.script || "";
                        questionFields.audiotoscript_url = "/audio/blank_audio.mp3";
                        break;
                    case "videotoscript":
                        questionFields.mcq_question_text = q.questionText || "";
                        questionFields.videotoscript_script = q.script || "";
                        questionFields.videotoscript_url = "/video/placeholder_1.mp4";
                        break;
                    case "imagetoscript":
                        questionFields.mcq_question_text = q.questionText || "";
                        questionFields.imagetoscript_script = q.script || q.imageDescription || "";
                        questionFields.imagetoscript_url = "/placeholder/placeholder2.png";
                        break;
                    case "video_pause":
                        questionFields.videotoscript_script = q.videoDescription || "";
                        if (q.durationSeconds) {
                            const vDuration = parseInt(q.durationSeconds) || 60;
                            const uniqueId = require('crypto').randomBytes(4).toString('hex');
                            const vFilename = `quiz_${quizId}_vpause_${uniqueId}_${vDuration}s.mp4`;
                            questionFields.video_pause_url = await generateBlankVideoDuration(vDuration, vFilename);
                        } else {
                            questionFields.video_pause_url = "/video/placeholder_1.mp4";
                        }
                        break;
                    case "audio_pause":
                        questionFields.audiotoscript_script = q.audioDescription || "";
                        if (q.durationSeconds) {
                            const aDuration = parseInt(q.durationSeconds) || 60;
                            const uniqueId = require('crypto').randomBytes(4).toString('hex');
                            const aFilename = `quiz_${quizId}_apause_${uniqueId}_${aDuration}s.mp3`;
                            questionFields.audio_pause_url = createBlankAudioDuration(aDuration, aFilename);
                        } else {
                            questionFields.audio_pause_url = "/audio/blank_audio.mp3";
                        }
                        break;
                }

                const savedQuestion = await QuizQuestion.create(questionFields);

                // Handle options
                if (qType === "mcq" && q.options) {
                    for (const opt of q.options) {
                        await QuizQuestionOption.create({
                            question_id: savedQuestion.id,
                            type: "mcq",
                            mcq_option_text: opt.text || "",
                            mcq_is_correct: opt.isCorrect || false,
                            is_active: true,
                            created_by: userId,
                            updated_by: userId,
                            created_by_type: role,
                            updated_by_type: role,
                        });
                    }
                } else if (qType === "complete_the_sentence") {
                    const blanksToProcess = Array.isArray(q.blanks) ? q.blanks : (q.correctWord ? [{ correctWord: q.correctWord, hint: q.hint }] : []);
                    for (const blank of blanksToProcess) {
                        await QuizQuestionOption.create({
                            question_id: savedQuestion.id,
                            type: "complete_sentence",
                            complate_correct_word: blank.correctWord || "",
                            complate_hint: blank.correctWord ? blank.correctWord.substring(0, 2) : "",
                            is_active: true,
                            created_by: userId,
                            updated_by: userId,
                            created_by_type: role,
                            updated_by_type: role,
                        });
                    }
                }

                // Handle nested pause questions (MULTIPLE)
                if ((qType === "video_pause" || qType === "audio_pause") && q.pauses && Array.isArray(q.pauses)) {
                    const stamps = [];
                    const questionIds = [];
                    for (const pause of q.pauses) {
                        if (!pause.question) continue;
                        const innerQ = await saveQuizQuestion(quizId, pause.question, savedQuestion.id);
                        // Use only the number part for timestamps
                        let tsNum = typeof pause.timestamp === "number" ? pause.timestamp : parseInt(pause.timestamp, 10);
                        if (isNaN(tsNum)) tsNum = 0;
                        stamps.push(tsNum);
                        questionIds.push([innerQ.id]);
                    }
                    // Update parent with timestamps and question_ids
                    await savedQuestion.update({
                        [qType === "video_pause" ? 'video_pause_stamps' : 'audio_pause_stamps']: stamps,
                        [qType === "video_pause" ? 'video_pause_question_ids' : 'audio_pause_question_ids']: questionIds
                    });
                } else if ((qType === "video_pause" || qType === "audio_pause") && q.question) {
                    // FALLBACK for old structure if AI sends single question
                    const innerQ = await saveQuizQuestion(quizId, q.question, savedQuestion.id);
                    const tsNum = typeof q.stamps?.[0] === "number" ? q.stamps[0] : 0;
                    await savedQuestion.update({
                        [qType === "video_pause" ? 'video_pause_stamps' : 'audio_pause_stamps']: [tsNum],
                        [qType === "video_pause" ? 'video_pause_question_ids' : 'audio_pause_question_ids']: [[innerQ.id]]
                    });
                }

                return savedQuestion;
            };

            // Save questions
            const questions = currentQuizData.questions || [];
            for (let qIdx = 0; qIdx < questions.length; qIdx++) {
                await saveQuizQuestion(quiz.id, questions[qIdx]);
            }

            console.log("✅ Quiz saved with", questions.length, "questions.");

            // Append image script from imagetoscript questions to media descriptions
            const quizImageScripts = questions
                .filter(q => q.type?.toLowerCase() === "imagetoscript")
                .map(q => `\n[QUIZ IMAGE: ${q.questionText || "Untitled"}]\nScript: ${q.script || q.imageDescription || ""}\n`)
                .join("");

            if (quizImageScripts) {
                const safeCourseName = (req.body.courseTitle || "Course").replace(/[^a-zA-Z0-9\-_ ]/g, "").trim().replace(/\s+/g, "_");
                const courseFolder = path.join(__dirname, `../../generated_courses/${safeCourseName}`);
                const mediaFilePath = path.join(courseFolder, "media_descriptions.txt");

                let mediaHeader = "";
                if (!fs.existsSync(mediaFilePath)) {
                    mediaHeader = `Media Descriptions for Course: ${req.body.courseTitle || "Course"}\n======================================================\n`;
                }

                const quizHeader = `\n\n=== QUIZ IMAGES: ${currentQuizData.quizTitle || moduleDB.title + " Quiz"} ===\n`;
                await fsp.appendFile(mediaFilePath, mediaHeader + quizHeader + quizImageScripts, "utf8");
            }
        } // End of quizzesToProcess loop

        return res.status(200).json({
            success: true,
            message: "Quiz content saved successfully",
            quizIds: savedQuizIds,
        });

    } catch (error) {
        console.error("❌ Save quiz content failed:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Failed to save quiz content",
        });
    }
};

const saveGeneratedAssignmentContent = async (req, res) => {
    try {
        const { courseId, sessionIndex, moduleIndex, assignmentData } = req.body;
        const userId = req.user?.id || 1;
        const role = req.user?.role || "admin";

        if (!courseId || !assignmentData || sessionIndex === undefined || moduleIndex === undefined) {
            return res.status(400).json({ success: false, error: "Missing required data." });
        }

        const sessionDBList = await Session.findAll({ where: { course_id: courseId }, order: [['sequence_no', 'ASC']] });
        const sessionDB = sessionDBList[sessionIndex];
        const moduleDBList = await Module.findAll({ where: { session_id: sessionDB.id }, order: [['sequence_no', 'ASC']] });
        const moduleDB = moduleDBList[moduleIndex];

        if (!moduleDB) return res.status(404).json({ success: false, error: "Module not found." });

        // Cleanup existing assignments for this module
        const existingAssignments = await Assignment.findAll({ where: { module_id: moduleDB.id } });
        for (const ea of existingAssignments) {
            await TopicContent.destroy({ where: { assignment_id: ea.id } });
            await MatchingQuestion.destroy({ where: { assignment_id: ea.id } });
            await TrueFalseQuestion.destroy({ where: { assignment_id: ea.id } });
            await FillTheBlanksQuestion.destroy({ where: { assignment_id: ea.id } });
            await ParagraphWriting.destroy({ where: { assignment_id: ea.id } });
            await ea.destroy();
        }

        const assignmentsToProcess = Array.isArray(assignmentData) ? assignmentData : [assignmentData];
        const savedAssignmentIds = [];

        for (const currentAssignmentData of assignmentsToProcess) {
            // Create assignment
            const assignment = await Assignment.create({
                module_id: moduleDB.id,
                title: currentAssignmentData.assignmentTitle || "Module Assignment",
                description: currentAssignmentData.description || "",
                days_to_complete: Math.max(1, parseInt(currentAssignmentData.durationHours) || 7),
                max_score: parseInt(currentAssignmentData.maxScore) || 100,
                passing_score: parseInt(currentAssignmentData.passingScore) || 60,
                max_attempt: Math.max(1, parseInt(currentAssignmentData.maxAttempts) || 3),
                extension_limit: parseInt(currentAssignmentData.extensionLimit) || 0,
                category: currentAssignmentData.assignmentType || "regular",
                status: "active",
                created_by: userId,
                updated_by: userId,
                created_by_type: role,
                updated_by_type: role,
            });

            savedAssignmentIds.push(assignment.id);

            // If it's a topic assignment, save the mapping to TopicContent
            if (currentAssignmentData.topicSequenceNo) {
                const topic = await Topic.findOne({
                    where: { module_id: moduleDB.id, sequence_no: currentAssignmentData.topicSequenceNo }
                });
                if (topic) {
                    await TopicContent.create({
                        module_id: moduleDB.id,
                        topic_id: topic.id,
                        assignment_id: assignment.id,
                        created_by: userId,
                        updated_by: userId,
                    });
                    console.log(`📎 Linked topicAssignment ${assignment.id} to topic ${topic.id}`);
                }
            }

            // Save Type-Specific Data
            const category = currentAssignmentData.assignmentType || "regular";
            switch (category) {
                case "regular":
                    // Description is already set during assignment creation, or can be updated if regularInstructions is preferred
                    if (currentAssignmentData.regularInstructions) {
                        await assignment.update({ description: currentAssignmentData.regularInstructions });
                    }
                    // Generate PDF for regular assignment
                    try {
                        const pdfContent = currentAssignmentData.regularInstructions || currentAssignmentData.description || "";
                        if (pdfContent) {
                            const pdfPath = await generateAssignmentPDF(
                                currentAssignmentData.assignmentTitle || "Module Assignment",
                                pdfContent,
                                assignment.id
                            );
                            await assignment.update({ file: pdfPath });
                            console.log(`📄 PDF generated for assignment ${assignment.id}: ${pdfPath}`);
                        }
                    } catch (pdfErr) {
                        console.error(`⚠️ PDF generation failed for assignment ${assignment.id}:`, pdfErr.message);
                    }
                    break;
                case "matching":
                    if (currentAssignmentData.matchingData) {
                        const mq = await MatchingQuestion.create({
                            assignment_id: assignment.id,
                            question_text: currentAssignmentData.matchingData.questionText || "Match the following pairs:",
                            created_by: userId,
                            updated_by: userId,
                        });
                        if (currentAssignmentData.matchingData.pairs) {
                            for (const pair of currentAssignmentData.matchingData.pairs) {
                                await MatchingOption.create({
                                    question_id: mq.id,
                                    option_text: pair.item || pair.option || "",
                                    match_text: pair.match || "",
                                    created_by: userId,
                                    updated_by: userId,
                                });
                            }
                        }
                    }
                    break;
                case "true_false":
                    if (currentAssignmentData.trueFalseData && currentAssignmentData.trueFalseData.questions) {
                        for (const q of currentAssignmentData.trueFalseData.questions) {
                            await TrueFalseQuestion.create({
                                assignment_id: assignment.id,
                                question_text: q.text || "",
                                correct_answer: q.answer === true || q.answer === "true",
                                created_by: userId,
                                updated_by: userId,
                            });
                        }
                    }
                    break;
                case "fill_in_the_blanks":
                    if (currentAssignmentData.fillBlanksData && currentAssignmentData.fillBlanksData.questions) {
                        for (const q of currentAssignmentData.fillBlanksData.questions) {
                            await FillTheBlanksQuestion.create({
                                assignment_id: assignment.id,
                                question_text: q.text || "",
                                answers: [q.answer || ""], // Store as JSON array
                                created_by: userId,
                                updated_by: userId,
                            });
                        }
                    }
                    break;
                case "paragraph_writing":
                    await ParagraphWriting.create({
                        assignment_id: assignment.id,
                        paragraph: currentAssignmentData.paragraph || "",
                        created_by: userId,
                        updated_by: userId,
                    });
                    break;
            }
        } // End of assignmentsToProcess loop

        return res.status(200).json({ success: true, message: "Assignment(s) saved successfully", assignmentIds: savedAssignmentIds });

    } catch (error) {
        console.error("❌ Save assignment content failed:", error);
        return res.status(500).json({ success: false, error: error.message || "Failed to save assignment content" });
    }
};

const regenerateAssignment = async (req, res) => {
    try {
        const { moduleData, contentStyle, comment, assignmentTypes } = req.body;
        const defaultAssignmentTypes = ["regular", "matching", "true_false", "fill_in_the_blanks", "paragraph_writing"];
        const assignmentTypesArr = parseAllowedSelection(assignmentTypes, defaultAssignmentTypes, defaultAssignmentTypes);
        if (assignmentTypes !== undefined && assignmentTypesArr === null) {
            return res.status(400).json({ success: false, error: "assignmentTypes must contain at least one valid type from the allowed list." });
        }
        if (!moduleData) return res.status(400).json({ success: false, error: "Missing moduleData." });

        const styleInstruction = STYLE_INSTRUCTIONS[contentStyle] || STYLE_INSTRUCTIONS.professional;

        const prompt = `
You are an expert educational content generator.
Based on the module content provided: ${JSON.stringify(moduleData)}

### Tone & Style Requirements
${styleInstruction}

${comment ? `### User Instructions (CRITICAL)
The user has provided the following specific instructions for this assignment regeneration:
"${comment}"
You MUST follow these instructions strictly while generating the assignment.` : ""}

RETURN a NEW valid JSON structure for one SINGLE assignment. Randomly pick one of these types: ${JSON.stringify(assignmentTypesArr)}.
Unless the user instructions specify otherwise.

Structure:
{
  "assignmentTitle": "...",
  "description": "...",
  "durationHours": 7,
  "maxScore": 100,
  "passingScore": 60,
  "maxAttempts": 3,
  "extensionLimit": 2,
  "assignmentType": "matching",
  "regularInstructions": "...", // if regular
  "matchingData": { "questionText": "...", "pairs": [{"item": "...", "match": "..."}] }, // if matching
  "trueFalseData": { "questions": [{"text": "...", "answer": true}] }, // if true_false
  "fillBlanksData": { "questions": [{"text": "...", "answer": "..."}] }, // if fill_in_the_blanks
  "paragraph": "..." // if paragraph_writing
}

CRITICAL: RETURN ONLY RAW JSON.

IMPORTANT RULES:
- Return ONLY valid JSON.
- Do not include markdown.
- Do not include explanations.
- Do not include text before or after JSON.
- Ensure all arrays and objects are properly closed.
- Ensure commas between array elements.
- Response must start with { and end with }.
`.trim();

        const model = genAI.getGenerativeModel({
            model: GEMINI_MODEL,
            generationConfig: {
                responseMimeType: "application/json",
            }
        });
        await waitOneMinute();
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();

        const parsed = jsonParser(text);

        if (!parsed) {
            console.error("🚨 Parsing failed for regenerated assignment, falling back to original structure.");
        }

        const reconstructedAssignment = parsed || moduleData.assignment; // Fallback to original

        return res.status(200).json({ success: true, data: reconstructedAssignment });
    } catch (error) {
        console.error('❌ Assignment regeneration failed:', error.message);
        return res.status(500).json({ success: false, error: error.message || 'Failed to regenerate assignment' });
    }
};


// ─── Controller: Regenerate Specific Node (Session/Module/Topic) ─────────────

const regenerateNode = async (req, res) => {
    let nodeType = 'node';
    try {
        const { courseContext, nodeType: incomingNodeType, nodeData, contentStyle, forceAudioCourse, comment, topicTypes } = req.body;
        nodeType = incomingNodeType || 'node';
        const defaultTopicTypes = ["video", "audio", "general", "accordion", "multislides"];
        const topicTypesArr = parseAllowedSelection(topicTypes, defaultTopicTypes, defaultTopicTypes);
        if (topicTypes !== undefined && topicTypesArr === null) {
            return res.status(400).json({ success: false, error: "topicTypes must contain at least one valid type from the allowed list." });
        }
        const styleInstruction = STYLE_INSTRUCTIONS[contentStyle] || STYLE_INSTRUCTIONS.professional;

        const audioRule = forceAudioCourse
            ? "CRITICAL: The user wants an AUDIO-FIRST course. You MUST set 'completionType' to 'audio' for ALL topics and slides (where applicable, e.g., general, accordion, slide)."
            : "Set 'completionType' to either 'audio' or 'timer' based on what is more relevant for each specific topic/slide. Use 'audio' for descriptive/theoretical content and 'timer' for reading-heavy or practical segments.";

        if (!courseContext || !nodeType || !nodeData) {
            return res.status(400).json({ success: false, error: "Missing required parameters." });
        }

        console.log(`⏳ Regenerating ${nodeType}...`);

        let schemaRules = "";
        let jsonSample = "";
        if (nodeType === "session") {
            schemaRules = `Return ONLY a valid JSON object representing a completely brand-new Session. It must contain 'sessionTitle', 'sessionDuration', 'sessionDurationMinutes', and a 'modules' array. Each module MUST contain 'moduleTitle', 'moduleDuration', 'moduleDurationMinutes', and a 'topics' array. Each topic MUST contain 'topicTitle', 'topicDescription', 'topicDuration', 'topicDurationMinutes' (CRITICAL: Maximum 15 minutes, with an average between 5 and 10), 'topicType' (which must be exactly one of ${JSON.stringify(topicTypesArr)}), AND 'completionType' (either 'audio' or 'timer'). Optionally, if 'isImportant' is true, topics can have 'topicQuiz' or 'topicAssignment'. **CRITICAL NO-SCROLL RULE: If a topic is large or contains many points, you MUST set its 'topicType' to 'multislides' to avoid long, scrollable pages!**`;
            jsonSample = `{ "sessionTitle": "New Title", "sessionDuration": "...", "sessionDurationMinutes": 90, "modules": [ { "moduleTitle": "...", "moduleDuration": "...", "moduleDurationMinutes": 45, "topics": [ { "topicTitle": "...", "topicDescription": "...", "topicDuration": "...", "topicDurationMinutes": 10, "topicType": "video", "completionType": "audio", "isImportant": false } ] } ] }`;
        } else if (nodeType === "module") {
            schemaRules = `Return ONLY a valid JSON object representing a completely brand-new Module. It must contain 'moduleTitle', 'moduleDuration', 'moduleDurationMinutes', and a 'topics' array. Each topic MUST contain 'topicTitle', 'topicDescription', 'tags' (array of {type: 'image', prompt: '...'} and optional {type: 'code', language: '...', content: '...'}), 'topicDuration', 'topicDurationMinutes' (CRITICAL: Maximum 15 minutes, with an average between 5 and 10), 'topicType' (exactly one of ${JSON.stringify(topicTypesArr)}), AND 'completionType' (either 'audio' or 'timer'). Optionally, if 'isImportant' is true, topics can have 'topicQuiz' or 'topicAssignment'. **CRITICAL NO-SCROLL RULE: If a topic is large or contains many points, you MUST set its 'topicType' to 'multislides' to avoid long pages!**`;
            jsonSample = `{ "moduleTitle": "New Title", "moduleDuration": "...", "moduleDurationMinutes": 45, "topics": [ { "topicTitle": "...", "topicDescription": "...", "tags": [{"type": "image", "prompt": "..."}], "topicDuration": "...", "topicDurationMinutes": 10, "topicType": "video", "completionType": "audio", "isImportant": true, "topicQuiz": { "quizTitle": "...", "durationMinutes": 15, "passingMarks": 60, "maxAttempts": 3, "attemptGap": 2, "attemptRenewal": 0 } } ] }`;
        } else if (nodeType === "topic") {
            schemaRules = `Return ONLY a valid JSON object representing a completely brand-new Topic. It must contain 'topicTitle', 'topicDescription', 'tags' (array of {type: 'image', prompt: '...'} and optional {type: 'code', language: '...', content: '...'}), 'topicDuration', 'topicDurationMinutes' (CRITICAL: Maximum 15 minutes), 'topicType' (exactly one of ${JSON.stringify(topicTypesArr)}), AND 'completionType' (either 'audio' or 'timer'). If 'isImportant' is true, optionally include 'topicQuiz' or 'topicAssignment'. If 'multislides', include 'slides' array with 'tags' and 'completionType' for each slide. **CRITICAL NO-SCROLL RULE: If this topic has extensive details, MUST formulate it as 'multislides'.**`;
            jsonSample = `{ "topicTitle": "New Title", "topicDescription": "...", "tags": [{"type": "image", "prompt": "..."}], "topicDuration": "...", "topicDurationMinutes": 10, "topicType": "video", "completionType": "audio", "isImportant": true, "topicQuiz": { "quizTitle": "...", "durationMinutes": 10, "passingMarks": 70, "maxAttempts": 2, "attemptGap": 0, "attemptRenewal": 0 } }`;
        } else {
            return res.status(400).json({ success: false, error: "Invalid nodeType" });
        }

        const prompt = `
You are an expert course designer AI. The user wants to REGENERATE a specific part of their course structure.

### Course Context
Title: ${courseContext.courseTitle}
Description: ${courseContext.courseDescription}

### Tone & Style Requirements
${styleInstruction}

### Completion Type Rules
${audioRule}

### Current ${nodeType}
The user is unsatisfied with the following ${nodeType} and wants it completely re-written with new ideas, titles, and structure appropriately scaled:
--- BEGIN CURRENT ---
${JSON.stringify(nodeData, null, 2)}
--- END CURRENT ---

${comment ? `### User Instructions (CRITICAL)
The user has provided the following specific instructions for this regeneration:
"${comment}"
You MUST follow these instructions strictly while regenerating the ${nodeType}.` : ""}

### Requirements
${schemaRules}

### Output Format
Return ONLY valid JSON exactly mapping to the sample structure. No extra text, no explanations, no markdown wrapper (\`\`\`json).
Sample format:
${jsonSample}
`;

        const model = genAI.getGenerativeModel({
            model: GEMINI_MODEL,
            generationConfig: {
                responseMimeType: "application/json",
            }
        });
        await waitOneMinute();
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();

        const parsed = jsonParser(text);

        if (!parsed) {
            console.error(`🚨 Parsing failed for regenerated ${nodeType}, falling back to original node.`);
        }

        const reconstructedNode = parsed || nodeData; // Fallback to original if parsing fails

        return res.status(200).json({
            success: true,
            data: reconstructedNode,
        });

    } catch (error) {
        console.error(`❌ ${nodeType} regeneration failed:`, error.message);
        return res.status(500).json({
            success: false,
            error: error.message || `Failed to regenerate ${nodeType}`,
        });
    }
};


// ─── Controller: Regenerate Specific Node Content (Detailed Content) ─────────

const regenerateNodeContent = async (req, res) => {
    let nodeType = 'node';
    try {
        const { nodeType: incomingNodeType, nodeData, contentStyle, comment } = req.body;
        nodeType = incomingNodeType || 'node';

        if (!nodeType || !nodeData) {
            return res.status(400).json({ success: false, error: 'Missing required parameters.' });
        }

        console.log('⏳ Regenerating detailed content for ' + nodeType + '...');

        let jsonOriginalStructureStr = JSON.stringify(nodeData, null, 2);
        const styleInstruction = STYLE_INSTRUCTIONS[contentStyle] || STYLE_INSTRUCTIONS.professional;

        const prompt = `
You are an expert course content generator AI.
I am providing you with a single ${nodeType} object from a course in JSON format.
Your job is to read the ENTIRE structure of this ${nodeType}, and RETURN a NEW JSON structure exactly matching the hierarchy of what I provided, BUT with a NEW/REGENERATED property called 'contentGenerated' nested securely inside EVERY Topic object and Slide object, and REFINED 'tags' (including detailed_script for image tags).

### Tone & Style Requirements
${styleInstruction}

${comment ? `### User Instructions (CRITICAL)
The user has provided the following specific instructions for this content regeneration:
"${comment}"
You MUST follow these instructions strictly while rewriting the educational content.` : ""}

If 'contentGenerated' already exists in the provided JSON, you MUST completely rewrite and improve it with new, high-quality, deeply detailed educational content following the same strict rules. Give fresh examples, explanations, scripts, and insights.

CRITICAL EXCEPTION FOR UNSELECTED TOPICS:
If a topic or slide has the property 'isSelected': false, you MUST completely SKIP generation for it and just return the node with its old 'contentGenerated' or no content.

Here are the strict RULES for generating 'contentGenerated' based on the object's existing 'topicType' or 'slideType':

1. If type is "video" (Topic or Slide):
   { "timestamps": [{ "timestamp": "0:00 - 0:30", "description": "..." }, ...], "totalDuration": "..." }
   CRITICAL FOR VIDEO: Divide into 30-sec intervals. Write a detailed video script describing visuals and narration. EVERY 30-second segment MUST have a UNIQUE, SPECIFIC description.

2. If type is "audio" (Topic or Slide):
   { "timestamps": [{ "timestamp": "0:00 - 0:30", "description": "..." }, ...], "totalDuration": "..." }
   CRITICAL FOR AUDIO: Divide into 30-sec intervals. Write an audio narration script. EVERY 30-second segment MUST have a UNIQUE, SPECIFIC description.

2.7. **MATERIALS Rules (Topic & Slide level)**:
   - For EVERY Topic object and Slide object (where 'isSelected' is NOT false), you MUST generate a 'materials' array containing exactly 1 to 2 objects representing highly relevant supplementary/auxiliary learning materials.
   - Each material object MUST follow this schema exactly:
     {
       "material_type": "pdf" | "link" | "document" | "image" | "code" | "other",
       "url": "https://..." | "/materials/..." | null,
       "codeLanguage": "python" | "javascript" | "html" | "css" | "sql" | null,
       "code": "..." | null
     }
   - CRITICAL SCHEMA rules for material fields:
   - If 'material_type' is "link", then 'url' MUST be a real, high-quality external educational URL/link (e.g. documentation, articles, reference websites), and 'codeLanguage' and 'code' must be null.
   - If 'material_type' is "code", then 'codeLanguage' must be the name of the programming language, 'code' must be a complete, useful code snippet, and 'url' must be null.
     - If 'material_type' is "pdf", "document", "image", or "other", then 'url' must be a clean relative file path (e.g., "/materials/python_basics_cheat_sheet.pdf", "/materials/db_design_diagram.png", "/materials/sample_dataset.csv"), and 'codeLanguage' and 'code' must be null.

2.5. **REFINED TAGS Rules (Topic & Slide level)**:
   - For ANY topic or slide, you MUST generate or refine the 'tags' array:
   - CRITICAL: UNIQUE TAG NAMES. Every tag generated MUST have a unique name within the scope of the entire topic. NEVER reuse names like #img1# or #code1# for different content pieces. Use sequential numbering (e.g., #img1#, #img2#, #code1#) to ensure every asset tag is distinct. NEVER use descriptive words in the tag name (e.g., never use "#img1_python#").
   - CRITICAL: STRICT TAG SCOPE & MATCHING. In the description for any specific topic or slide, you MUST ONLY use tags that are explicitly defined within the 'tags' array of THAT SPECIFIC topic or slide. Never cross-reference or invent tags belonging to other topics/slides. If you use the placeholder [#code4#] or [#img5#] in the HTML text, you MUST have explicitly generated a tag with name "#code4#" or "#img5#" in this exact topic's 'tags' array. DO NOT hallucinate tags that aren't defined. If a topic has 1 code and 1 image, you MUST name them #code1# and #img1# in the array, and use EXACTLY #code1# and #img1# in the description text. ALWAYS restart your numbering from 1 for every new topic/slide.
   - If coding-related: At least ONE { "type": "code", "name": "#code1#", "language": "...", "content": "..." }.
   - If NOT coding-related: At least ONE { "type": "image", "name": "#img1#", "prompt": "...", "detailed_script": "..." }.
   - Ensure the 'name' (e.g., #code1#) matches where you've used it in the descriptions EXACTLY.

3. If type is "general" (Topic or Slide):
   { 
     "title": "...", 
     "description": "An absolutely exhaustive, master-class level comprehensive explanation in structured HTML. Wrap the entire output in a <div>. CRITICAL RULE: EXPLAIN EVERYTHING POINTWISE using bulleted lists (<ul>/<li>). NEVER use long paragraphs; every explanation must be broken down into bullet points for readability. BOLDING: Bold ALL important words, core concepts, and key terminology using <strong> tags. NEVER include raw code snippets or illustrations directly in the text. All code and images MUST be generated only as tags (e.g., #code1#, #img1#). LAYOUT EXCEPTION: If the type is \"video\" or \"audio\", do NOT use a <table> layout; however, you MUST STILL generate the relevant tags and place the tag names (e.g., #code1#) directly within the descriptive text. FOR ALL OTHER types (e.g., general, accordion): Conditional Table Layout. IF you are inserting tags into the description, you MUST use a table layout for assets. Each tag MUST be in its own separate table (max 1 row per table) followed by <p>&nbsp;</p>. EXACT TABLE FORMAT: <table style=\"border-collapse: collapse; width: 100.016%; height: 153.2px;\" border=\"1\"><colgroup><col style=\"width: 49.9921%;\"><col style=\"width: 49.9921%;\"></colgroup><tbody><tr style=\"height: 153.2px;\"><td>#tag1#</td><td><h3 style=\"text-align: left;\">Section Title</h3><ul style=\"text-align: left;\"><li>The tag1 block explains how... (reference tags in text as 'tag1' or 'code1' WITHOUT HASHTAGS)</li><li>Use <strong>bolding</strong> for key terms.</li></ul></td></tr></tbody></table>. You MUST put the actual tag placeholder with hashes (like #img1#, #code1#) inside the left <td>. Do NOT leave the left <td> empty. Ensure an exactly equal 50%-50% split. IF the description does NOT include any tags, DO NOT use table formatation at all.", 
     "completionType": "audio", 
     "audioTimestamps": [{ "timestamp": "0:00 - ...", "description": "..." }], 
     "duration": "string" 
   }

4. If type is "accordion" or "accordian" (Topic or Slide):
   {
     "subtopics": [
        {
           "title": "...",
           "description": "Exhaustively detailed explanation (EXPLAIN EVERYTHING POINTWISE using bulleted lists <ul>/<li>) in structured HTML format. Wrap in a <div>. CRITICAL: Code or images MUST ONLY be tags. Conditional Table Layout: IF you are adding tags, format them inside this EXACT table structure: <table style=\"border-collapse: collapse; width: 100.016%; height: 153.2px;\" border=\"1\"><colgroup><col style=\"width: 49.9921%;\"><col style=\"width: 49.9921%;\"></colgroup><tbody><tr style=\"height: 153.2px;\"><td>#tag1#</td><td><h3 style=\"text-align: left;\">Section Title</h3><ul style=\"text-align: left;\"><li>Detailed <strong>pointwise text</strong> here.</li><li>Referencing tag1...</li></ul></td></tr></tbody></table>. You MUST put the actual tag placeholder with hashes (like #img1#, #code1#) inside the left <td>. Do NOT leave the left <td> empty. Add <p>&nbsp;</p> after each table. IF the description does NOT include any tags, DO NOT use table formatation at all.",
           "completionType": "audio",
           "audioTimestamps": [{ "timestamp": "0:00 - ...", "description": "..." }],
           "duration": "string"
        }
     ]
   }

5. If type is "multislides" (Topic only):
   {
     "title": "...",
     "description": "A brief introduction or summary for the slides in this topic.",
     "completionType": "timer",
     "duration": "1 minute"
   }
   NOTE: You MUST still generate 'contentGenerated' for EVERY individual slide inside the "slides" array based on their respective "slideType".

6. If the node contains 'topicQuiz', you MUST generate a "questions" array inside it. **CRITICAL TOKEN LIMIT RULE**: To save output length, ONLY generate 3-5 simple MCQ questions. DO NOT generate all 12 types. **CRITICAL SCOPE RULE**: The questions MUST focus EXCLUSIVELY on THIS INDIVIDUAL TOPIC'S content, not the whole module.
   If the node contains 'topicAssignment', you MUST generate detailed fields based on its "assignmentType" just like module-level assignments. **CRITICAL SCOPE RULE**: The assignment tasks MUST focus EXCLUSIVELY on THIS INDIVIDUAL TOPIC'S content, not the whole module. Keep the texts and instructions appropriately concise.

Original ${nodeType} JSON:
${jsonOriginalStructureStr}

CRITICAL RULES FOR REGENERATION:
- RETURN ONLY VALID JSON mirroring the original ${nodeType} object completely.
- Do NOT skip any elements in the payload. They must all map exactly.
- Keep the descriptions highly formatted, educational, and thorough. 
- **CRITICAL: UNIQUE TAG NAMES & FORMATTING MATCH**. Every asset tag (e.g., #img1#, #img2#, #code1#) generated MUST be perfectly unique per content piece and properly referenced exactly. NEVER reuse names.
- DO NOT wrap the result in \`\`\`json ... \`\`\`. Output raw valid JSON.

IMPORTANT RULES:
- Return ONLY valid JSON.
- Do not include markdown.
- Do not include explanations.
- Do not include text before or after JSON.
- Ensure all arrays and objects are properly closed.
- Ensure commas between array elements.
- Response must start with { and end with }.
`.trim();

        const model = genAI.getGenerativeModel({
            model: GEMINI_MODEL,
            generationConfig: {
                responseMimeType: "application/json",
            }
        });
        await waitOneMinute();
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();

        const parsed = jsonParser(text);

        if (!parsed) {
            console.error(`🚨 Parsing failed for regenerated ${nodeType} content, falling back to original node.`);
        }

        const reconstructedNode = parsed || nodeData; // Fallback to original if parsing fails

        return res.status(200).json({
            success: true,
            data: reconstructedNode,
        });

    } catch (error) {
        console.error('❌ ' + nodeType + ' content regeneration failed:', error.message);
        return res.status(500).json({
            success: false,
            error: error.message || ('Failed to regenerate ' + nodeType + ' content'),
        });
    }
};

const regenerateQuiz = async (req, res) => {
    try {
        const { moduleData, contentStyle, comment, quizTypes } = req.body;
        const defaultQuizTypes = ["mcq", "complete_the_sentence", "dragdrop", "realword", "summarize", "bestoption", "arrangeorder", "audiotoscript", "videotoscript", "imagetoscript", "video_pause", "audio_pause"];
        const quizTypesArr = parseAllowedSelection(quizTypes, defaultQuizTypes, defaultQuizTypes);
        if (quizTypes !== undefined && quizTypesArr === null) {
            return res.status(400).json({ success: false, error: "quizTypes must contain at least one valid type from the allowed list." });
        }

        if (!moduleData) {
            return res.status(400).json({ success: false, error: "Missing moduleData for quiz regeneration." });
        }

        console.log(`⏳ Regenerating quiz for module: ${moduleData.moduleTitle}...`);

        const prompt = `
You are an expert quiz generator AI.
I am providing you with a Module object from a course (containing Topics, Slides, and their educational content) in JSON format.
Your job is to RETURN a NEW JSON 'quiz' object based on the educational content of the topics within this module.

### Tone & Style Requirements
${STYLE_INSTRUCTIONS[contentStyle] || STYLE_INSTRUCTIONS.professional}

${comment ? `### User Instructions (CRITICAL)
The user has provided the following specific instructions for this quiz regeneration:
"${comment}"
You MUST follow these instructions strictly while selecting and phrasing the questions.` : ""}

The 'quiz' object MUST have a 'questions' array containing ONLY the following question types based on the users permitted options. Generate questions of the following types IF they are in the allowed list:

${quizTypesArr.includes("mcq") ? `   - MCQ (2-3 questions):\n      { "type": "mcq", "questionText": "Question text?", "marks": 1, "options": [{ "text": "Option A", "isCorrect": false }, { "text": "Option B", "isCorrect": true }, { "text": "Option C", "isCorrect": false }, { "text": "Option D", "isCorrect": false }] }` : ""}

${quizTypesArr.includes("complete_the_sentence") ? `   - Complete the Sentence (1-2 questions):\n      { "type": "complete_the_sentence", "questionText": "The process of _____ is fundamental to...", "marks": 1, "correctWord": "photosynthesis", "hint": "ph" }` : ""}

${quizTypesArr.includes("dragdrop") ? `   - Drag and Drop (1 question):\n      { "type": "dragdrop", "prompt": "A paragraph with {1} and {2} as blanks...", "marks": 2, "options": ["option1", "option2", "distractor1"], "blanks": [{ "id": 1, "correctAnswer": "option1" }, { "id": 2, "correctAnswer": "option2" }] }` : ""}

${quizTypesArr.includes("realword") ? `   - Real World (1 question):\n      { "type": "realword", "questionText": "Identify the correct category for these words:", "marks": 1, "words": ["Word1", "Word2", "Word3", "Word4"], "correctAnswers": [true, false, true, false] }\n      CRITICAL: For 'realword' type, the 'words' array MUST contain ONLY single words, NOT sentences.` : ""}

${quizTypesArr.includes("summarize") ? `   - Summarize (1 question):\n      { "type": "summarize", "questionText": "Summarize the following passage:", "marks": 2, "passage": "A detailed paragraph about the topic...", "expectedSummary": "A brief 2-3 sentence summary...", "timeLimit": 300 }` : ""}

${quizTypesArr.includes("bestoption") ? `   - Best Option (1 question):\n      { "type": "bestoption", "passage": "A paragraph with {1} blank and {2} blank...", "marks": 2, "blankedWords": [{ "correct": "word1", "options": ["word1", "similar1", "similar2"] }, { "correct": "word2", "options": ["word2", "similar3", "similar4"] }] }` : ""}

${quizTypesArr.includes("arrangeorder") ? `   - Arrange the Order (1 question):\n      { "type": "arrangeorder", "prompt": "Arrange these steps in the correct order:", "marks": 2, "sentences": ["Step Three.", "Step One.", "Step Four.", "Step Two."], "correctOrder": [1, 3, 0, 2] }` : ""}

${quizTypesArr.includes("audiotoscript") ? `   - Audio to Script (1 question):\n      { "type": "audiotoscript", "questionText": "Listen to the audio and write the script:", "marks": 2, "script": "The full text that describes the audio narration...", "timestamps": [{ "timestamp": "0:00 - 0:15", "description": "Introduction section..." }] }` : ""}

${quizTypesArr.includes("videotoscript") ? `   - Video to Script (1 question):\n      { "type": "videotoscript", "questionText": "Watch the video and write the script:", "marks": 2, "script": "The full text that describes the video narration...", "timestamps": [{ "timestamp": "0:00 - 0:15", "description": "Visual description..." }] }` : ""}

${quizTypesArr.includes("imagetoscript") ? `   - Image to Script (1 question):\n      { "type": "imagetoscript", "questionText": "Describe the image in detail:", "marks": 2, "script": "A detailed description of what should be in the image...", "imageDescription": "Detailed description of the image content for generation..." }` : ""}

${quizTypesArr.includes("video_pause") ? `   - Video Pause (1 question):\n      { \n        "type": "video_pause", \n        "videoDescription": "A timestamp-wise description of a relevant educational video (max 5 mins).", \n        "marks": 2, \n        "pauses": [\n          { "timestamp": 60, "question": { "type": "bestoption", ... } }\n        ]\n      }\n      RULE: 'pauses' MUST contain 1-3 random timestamps. For EACH pause point, you MUST randomly select a 'question.type' from: ${JSON.stringify(quizTypesArr.filter(t => !["video_pause", "audio_pause", "audiotoscript", "videotoscript", "imagetoscript"].includes(t)) || ["mcq"])}. VARIETY IS CRITICAL.` : ""}

${quizTypesArr.includes("audio_pause") ? `   - Audio Pause (1 question):\n      { \n        "type": "audio_pause", \n        "audioDescription": "A timestamp-wise description of a relevant educational audio (max 5 mins).", \n        "marks": 2, \n        "pauses": [\n          { "timestamp": 45, "question": { "type": "dragdrop", ... } }\n        ]\n      }\n      RULE: Same as video pause. Use a variety of inner question types.` : ""}

Module JSON:
${JSON.stringify(moduleData)}

CRITICAL RULES:
- RETURN ONLY THE 'quiz' OBJECT AS VALID JSON.
- DO NOT wrap the result in \`\`\`json ... \`\`\`. Output raw valid JSON.
- Every quiz MUST have its quiz.questions array populated ONLY with the question types listed above.
- Ensure all questions are deeply relevant to the educational content in the topics.

IMPORTANT RULES:
- Return ONLY valid JSON.
- Do not include markdown.
- Do not include explanations.
- Do not include text before or after JSON.
- Ensure all arrays and objects are properly closed.
- Ensure commas between array elements.
- Response must start with { and end with }.
`.trim();

        const model = genAI.getGenerativeModel({
            model: GEMINI_MODEL,
            generationConfig: {
                responseMimeType: "application/json",
            }
        });
        await waitOneMinute();
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();

        const parsed = jsonParser(text);

        if (!parsed) {
            console.error("🚨 Parsing failed for regenerated quiz, falling back to original quiz structure.");
        }

        const reconstructedQuiz = parsed || moduleData.quiz; // Fallback to existing if parsing fails

        return res.status(200).json({
            success: true,
            data: reconstructedQuiz,
        });

    } catch (error) {
        console.error('❌ Quiz regeneration failed:', error.message);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to regenerate quiz',
        });
    }
};

module.exports = {
    generateNewCourse,
    saveGeneratedCourse,
    generateCourseContent,
    saveGeneratedCourseContent,
    regenerateNode,
    regenerateNodeContent,
    regenerateQuiz,
    saveGeneratedQuizContent,
    saveGeneratedAssignmentContent,
    regenerateAssignment
};
