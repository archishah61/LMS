const pdfParse = require("pdf-parse");
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");
const xlsx = require("xlsx");

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { callProcedure } = require("../../utils/procedure/callProcedure");
const { generateAudioFile } = require("./textToSpeechController");
const { getPrompt } = require("./prompts/customCoursePrompts");
const sequelize = require("../../config/db");
const { notifyCourseProgress } = require("../../socket/socket");
const { getAudioDurationInMinutes } = require("../../utils/audioDuration");
const Course = require("../../models/course_management/course");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const CREATED_BY = 1;
const CREATED_BY_TYPE = "admin";
const GEMINI_MODEL = "gemini-2.5-flash-lite"
const DELAY = 5000; // in seconds

// Extract text from DOC/DOCX files
const extractTextFromWord = async (filePath) => {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } catch (error) {
        throw new Error(`Word document extraction failed: ${error.message}`);
    }
};

// Extract text from plain text files
const extractTextFromTxt = async (filePath) => {
    try {
        const data = await fs.readFile(filePath, "utf8");
        return data;
    } catch (error) {
        throw new Error(`Text file extraction failed: ${error.message}`);
    }
};

// Extract text from CSV files
const extractTextFromCSV = async (filePath) => {
    try {
        const data = await fs.readFile(filePath, "utf8");
        // Convert CSV to readable text format
        const lines = data.split("\n");
        const headers = lines[0];
        return `CSV Data:\nHeaders: ${headers}\nRows: ${lines.length - 1
            }\nContent:\n${data}`;
    } catch (error) {
        throw new Error(`CSV extraction failed: ${error.message}`);
    }
};

// Extract text from Excel files
const extractTextFromExcel = async (filePath) => {
    try {
        const workbook = xlsx.readFile(filePath);
        let extractedText = "Excel Data:\n";

        workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const csvData = xlsx.utils.sheet_to_csv(worksheet);
            extractedText += `\nSheet: ${sheetName}\n${csvData}\n`;
        });

        return extractedText;
    } catch (error) {
        throw new Error(`Excel extraction failed: ${error.message}`);
    }
};

// Extract text from PDF
const extractTextFromPDF = async (filePath) => {
    try {
        const dataBuffer = await fsp.readFile(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        throw new Error(`PDF extraction failed: ${error.message}`);
    }
};

// Universal file text extractor
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

            case "text/plain":
                extractedText = await extractTextFromTxt(filePath);
                break;

            case "text/csv":
                extractedText = await extractTextFromCSV(filePath);
                break;

            case "application/vnd.ms-excel":
            case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                extractedText = await extractTextFromExcel(filePath);
                break;

            default:
                throw new Error(`Unsupported file type: ${mimetype}`);
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

// Clean up uploaded files
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

const extractJSONObject = (text) => {
    if (typeof text !== "string") return null;

    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        return null;
    }

    return text.slice(firstBrace, lastBrace + 1);
};

const jsonParser = (rawText) => {
    try {
        // Step 1: Basic validation
        if (!rawText || typeof rawText !== 'string') {
            throw new Error('Input must be a non-empty string');
        }

        // Step 2: Remove markdown-style code block wrappers
        const jsonOnly = extractJSONObject(rawText);
        if (!jsonOnly) {
            throw new Error("No valid JSON object found");
        }

        const trimmed = jsonOnly.trim();
        const isWrapped = trimmed.startsWith("```") && trimmed.endsWith("```");

        let cleaned = isWrapped
            ? trimmed.replace(/```json|```/g, "").trim()
            : trimmed;

        // Step 3: Clean control characters and problematic sequences
        cleaned = cleaned
            // Remove or replace control characters (except \n, \r, \t which might be intentional)
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
            // Fix common JSON issues
            .replace(/[\r\n\t]/g, ' ')  // Replace newlines and tabs with spaces in the outer structure
            // Remove any trailing commas before closing brackets/braces
            .replace(/,(\s*[}\]])/g, '$1')
            // Ensure proper spacing around colons and commas
            .replace(/:\s*"/g, ': "')
            .replace(/",\s*/g, '", ');

        // Step 4: Additional cleaning for embedded strings (preserve intentional escapes)
        // This helps with strings that contain unescaped quotes or control characters
        cleaned = cleaned.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match, content) => {
            // Clean content inside strings while preserving valid escapes
            const cleanContent = content
                .replace(/\\/g, '\\\\')  // Escape backslashes
                .replace(/"/g, '\\"')    // Escape quotes
                .replace(/\n/g, '\\n')   // Escape newlines
                .replace(/\r/g, '\\r')   // Escape carriage returns
                .replace(/\t/g, '\\t');  // Escape tabs
            return `"${cleanContent}"`;
        });

        // Step 6: Attempt to parse
        const parsed = JSON.parse(cleaned);
        return parsed;

    } catch (error) {
        // Enhanced error logging
        console.error("❌ Failed to parse JSON:", error.message);

        // Find error position if available
        const positionMatch = error.message.match(/position (\d+)/);
        if (positionMatch) {
            const position = parseInt(positionMatch[1]);
            console.error(`📍 Error at position: ${position}`);

            // Show context around the error
            const start = Math.max(0, position - 50);
            const end = Math.min(rawText.length, position + 50);
            const context = rawText.substring(start, end);
            const marker = ' '.repeat(Math.min(50, position - start)) + '^^^';

            console.error('🔍 Context around error:');
            console.error(context);
            console.error(marker);

            // Show character codes around the error position
            const problemChar = rawText.charAt(position);
            const charCode = problemChar.charCodeAt(0);
            console.error(`🚫 Problematic character: "${problemChar}" (char code: ${charCode})`);
        }

        // Show first 500 characters of cleaned input
        if (typeof cleaned !== 'undefined') {
            console.error("🧹 Cleaned input preview (first 500 chars):");
            console.error(cleaned.slice(0, 500));
        }

        // Try to identify common issues
        console.error("🔧 Possible issues:");
        if (rawText.includes('\n') || rawText.includes('\r') || rawText.includes('\t')) {
            console.error("- Contains unescaped control characters (newlines, tabs, carriage returns)");
        }
        if (rawText.includes('",\n}') || rawText.includes(',\n]')) {
            console.error("- Contains trailing commas before closing brackets");
        }
        if ((rawText.match(/"/g) || []).length % 2 !== 0) {
            console.error("- Unmatched quotes detected");
        }

        throw new Error("Invalid JSON format");
    }
};

// Helper function to add delay between API calls
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sanitizeFileName = (name) => {
    return name
        .replace(/[<>,:"/\\|?*]+/g, "") // remove invalid chars
        .replace(/\s+/g, "_") // replace spaces with _
        .trim();
};

const saveMediaScript = async (courseName, mediaInfo, fileName, folder, prompt, type) => {
    try {
        if (!["image", "audio", "video"].includes(type)) {
            throw new Error("Invalid type. Must be image, audio, or video");
        }

        const safeCourseName = sanitizeFileName(courseName);

        // Base directory → uploads/media_script/courseName
        const baseDir = path.join(
            __dirname,
            "../../uploads",
            "media_script",
            safeCourseName
        );

        // Ensure directory exists
        fs.mkdirSync(baseDir, { recursive: true });

        // File path → image.txt / audio.txt / video.txt
        const filePath = path.join(baseDir, `${type}.txt`);

        let locationDetails = "";

        if (mediaInfo?.content !== "course") {
            if (mediaInfo?.content === "Slide" || mediaInfo?.content === "Accordian") {
                locationDetails = `
Session: ${mediaInfo?.sessionName || ""}
Module: ${mediaInfo?.moduleName || ""}
Topic: ${mediaInfo?.topicName || ""}
${mediaInfo?.content}: ${mediaInfo?.contentName || ""}
`;
            } else {
                locationDetails = `
Session: ${mediaInfo?.sessionName || ""}
Module: ${mediaInfo?.moduleName || ""}
${mediaInfo?.content}: ${mediaInfo?.contentName || ""}
`;
            }
        }

        // Format entry
        const entry = `
-------------------------------------------------------------------------------------------

File Name: ${fileName}
Folder: ${folder}
Created Time: ${new Date().toISOString()}
${locationDetails}Prompt:
${prompt}

-------------------------------------------------------------------------------------------
`;

        // Append instead of overwrite
        fs.appendFileSync(filePath, entry, "utf-8");

        return {
            success: true,
            message: `${type} script saved successfully`,
            path: filePath,
        };
    } catch (error) {
        console.error("❌ Error saving media script:", error);
        return { success: false, error: error.message };
    }
};

const generateAndSaveImageWithGemini = async (courseName, mediaInfo, prompt, fileName, filePath) => {
    try {

        await saveMediaScript(
            courseName,
            mediaInfo,
            fileName,
            filePath,
            prompt,
            "image"
        );

        return;

        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: {
                responseModalities: ["Text", "Image"],
            },
        });

        const response = await model.generateContent(prompt);
        await delay(12000);

        for (const part of response?.response?.candidates[0]?.content?.parts || []) {
            if (part.inlineData) {
                const mimeType = part.inlineData.mimeType || "image/png";
                const extension = mimeType.split("/")[1] || "png";
                const base64Data = part.inlineData.data;

                // Build final path → uploads/filePath/fileName
                const uploadDir = path.join(__dirname, "../../uploads", filePath);
                const finalPath = path.join(uploadDir, fileName);

                // Ensure directory exists
                fs.mkdirSync(uploadDir, { recursive: true });

                // Save file
                fs.writeFileSync(finalPath, Buffer.from(base64Data, "base64"));
                return {
                    success: true,
                    fileName,
                    filePath: finalPath,
                    mimeType,
                    url: `/uploads/${filePath}/${fileName}`, // useful if serving via Express
                };
            }
        }
        return { success: false, error: "No image data found" };
    } catch (error) {
        console.error("❌ Error with Gemini image generation:", error);
        return { success: false, error: error.message };
    }
};

const generateAndSaveAudio = async (courseName, mediaInfo, audioScript, fileName, filePath) => {
    try {

        await saveMediaScript(
            courseName,
            mediaInfo,
            fileName,
            filePath,
            audioScript,
            "audio"
        );

        // Generate audio file (your function handles script -> audio file)
        const audio = await generateAudioFile(audioScript);

        // Read the generated audio file
        const fullTempPath = path.join(__dirname, `../..${audio.filePath}`);
        const buffer = await fsp.readFile(fullTempPath);

        // Build final path → uploads/filePath/fileName
        const uploadDir = path.join(__dirname, "../../uploads", filePath);
        const finalPath = path.join(uploadDir, fileName);

        // Ensure directory exists
        await fs.mkdirSync(uploadDir, { recursive: true });

        // Save audio at final destination
        await fs.writeFileSync(finalPath, buffer);

        // Clean up temp file
        await fsp.unlink(fullTempPath);

        // 👉 Get duration
        const duration = await getAudioDurationInMinutes(`/${filePath}/${fileName}`);

        return {
            success: true,
            fileName,
            filePath: finalPath,
            mimeType: "audio/mpeg",
            url: `/uploads/${filePath}/${fileName}`, // useful if serving via Express
            duration
        };
    } catch (error) {
        console.error("❌ Error with audio generation:", error);
        return { success: false, error: error.message };
    }
};

const generateAndSaveVideo = async (courseName, mediaInfo, prompt, fileName, filePath) => {
    try {
        await saveMediaScript(
            courseName,
            mediaInfo,
            fileName,
            filePath,
            prompt,
            "video"
        );

        return;

    } catch (error) {
        console.error("❌ Error with video prompt store:", error);
        return { success: false, error: error.message };
    }
};

const generateCourseStructure = async (userQuery, difficulty_level, tierName, allExtractedText) => {
    try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const { success, data, error } = await callProcedure("getAllActiveTiers");

        const tiersStructure = data
            .filter(tier => tier.difficulty_level_id === difficulty_level?.id && tier.name === tierName)
            .map(tier => ({
                name: tier.name,
                max: {
                    sessions: tier.max_sessions,
                    modulesPerSession: tier.max_modules_per_session,
                    topicsPerModule: tier.max_topics_per_module,
                    assignmentsPerModule: tier.max_assignments_per_module,
                    quizzesPerModule: tier.max_quizzes_per_module,
                }
            }));

        const prompt = getPrompt("course.courseBuilder", {
            userQuery,
            difficulty_level: difficulty_level?.name,
            tier: tierName,
            tiersStructure: JSON.stringify(tiersStructure[0], null, 2),
            extracted_content: allExtractedText,
            maxSessions: tiersStructure[0].max.sessions,
            maxModulesPerSession: tiersStructure[0].max.modulesPerSession,
            maxTopicsPerModule: tiersStructure[0].max.topicsPerModule,
            maxAssignmentsPerModule: tiersStructure[0].max.assignmentsPerModule,
            maxQuizzesPerModule: tiersStructure[0].max.quizzesPerModule
        });

        await delay(DELAY);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();

        return jsonParser(text);
    } catch (error) {
        console.error("Gemini AI Error:", error);
        throw new Error(`AI generation failed: ${error.message}`);
    }
};

const transformCourseToDatabase = async (courseStructure) => {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const { success, data, error } = await callProcedure("getAllCourseCategories");

    const prompt = getPrompt("course.courseToDatabase", {
        courseStructure: JSON.stringify(courseStructure),
        categories: success ? JSON.stringify(data.map(({ id, category }) => ({ id, category }))) : null,
        content_style: courseStructure?.course?.content_style || "professional"
    });

    try {
        await delay(DELAY);
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        return jsonParser(text);
    } catch (error) {
        console.error("Gemini AI Error:", error);
        throw new Error(`Course transformation failed: ${error.message}`);
    }
};

async function generateQuiz(module, quizDetails, content_style) {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = getPrompt("course.quizToDatabase", {
        module_title: module.title,
        module_overview: module.overview,
        quiz_title: quizDetails.title, // Use specific quiz data
        quiz_description: quizDetails.description,
        content_style
    });

    await delay(DELAY);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    const quizData = jsonParser(text);

    return quizData;
};

async function generateAssignment(module, assignmentData, content_style) {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = getPrompt("course.assignmentToDatabase", {
        module_title: module.title,
        module_overview: module.overview,
        assignment_title: assignmentData.title,
        assignment_description: assignmentData.description,
        assignment_category: assignmentData.type,
        content_style
    });

    await delay(DELAY);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    const assignmentContent = jsonParser(text);

    return assignmentContent;
};

async function createFullQuiz(courseName, sessionName, moduleName, quizData) {
    try {
        // 1. Create Quiz
        const [quizResult] = await sequelize.query(
            `CALL createQuiz(:p_module_hash, :p_duration_minutes, :p_quiz_data, :p_created_by, :p_updated_by, :p_created_by_type, :p_updated_by_type)`,
            {
                replacements: {
                    p_module_hash: quizData.module_hash,
                    p_duration_minutes: quizData.quiz.duration_minutes,
                    p_quiz_data: JSON.stringify(quizData.quiz),
                    p_created_by: CREATED_BY,
                    p_updated_by: CREATED_BY,
                    p_created_by_type: CREATED_BY_TYPE,
                    p_updated_by_type: CREATED_BY_TYPE,
                },
            }
        );

        const quizId = quizResult.id;
        const mediaInfo = { sessionName, moduleName, content: "Quiz", contentName: quizResult.title || quizData.title };

        // 2. Create Questions
        for (const question of quizData.questions) {
            if (question.type === "audiotoscript") {
                await generateAndSaveAudio(courseName, mediaInfo, question.audio_script, question.audiotoscript_url.split("/").pop(), "/audiotoScript/audiotoScript")
            } else if (question.type === "speaking") {
                if (question.audio_script) {
                    await generateAndSaveAudio(courseName, mediaInfo, question.audio_script, question.audioFile, "/quiz/audio")
                }
                if (question.image_prompt) {
                    await generateAndSaveImageWithGemini(courseName, mediaInfo, question.image_prompt, question.imageFile, "/quiz/question_images");
                }
            } else if (question.type === "imagetoscript") {
                await generateAndSaveImageWithGemini(courseName, mediaInfo, question.image_prompt, question.imagetoscript_url.split("/").pop(), "/imagetoscript/imagetoscript");
            }

            const [questionResult] = await sequelize.query(
                `CALL createQuizQuestion(
          :p_quiz_id,
          :p_type,
          :p_created_by,
          :p_created_by_type,
          :p_updated_by,
          :p_updated_by_type,
          :p_marks,
          :p_is_active,
          :p_question_img,
          :p_speaking_question,
          :p_speaking_answer,
          :p_dragdrop_prompt,
          :p_dragdrop_options,
          :p_dragdrop_blanks,
          :p_audiotoscript_url,
          :p_audiotoscript_script,
          :p_videotoscript_url,
          :p_videotoscript_script,
          :p_imagetoscript_url,
          :p_imagetoscript_script,
          :p_video_url,          
          :p_audio_url,
          :p_video_pause_url,
          :p_video_pause_stamps,
          :p_video_pause_question_ids,
          :p_audio_pause_url,
          :p_audio_pause_stamps,
          :p_audio_pause_question_ids,
          :p_realword_words,
          :p_realword_correct_answers,
          :p_summarizepassage_summary,
          :p_summarizepassage_time_limit,
          :p_bestoption_passage,
          :p_bestoption_blanked_words,
          :p_mcq_question_text,
          :p_arrangeorder_prompt,
          :p_sentences,
          :p_correct_order,
          :p_assigned_pause_id
        )`,
                {
                    replacements: {
                        p_quiz_id: quizId,
                        p_type: question.type === "complete_the_sentence" || question.type === "complete_the_sentance" || question.type === "complete the sentance" || question.type === "complete the sentence" ? "complete the sentance" : question.type,
                        p_created_by: CREATED_BY,
                        p_created_by_type: CREATED_BY_TYPE,
                        p_updated_by: CREATED_BY,
                        p_updated_by_type: CREATED_BY_TYPE,
                        p_marks: question.marks,
                        p_is_active: true,
                        p_question_img: question.type === "speaking" && question.image_prompt ? "/quiz/question_images/" + question.imageFile : null,
                        p_speaking_question: question.speaking_question || null,
                        p_speaking_answer: question.speaking_answer || null,
                        p_dragdrop_prompt: question.dragdrop_prompt || null,
                        p_dragdrop_options: question.dragdrop_options
                            ? JSON.stringify(question.dragdrop_options)
                            : null,
                        p_dragdrop_blanks: question.dragdrop_blanks
                            ? JSON.stringify(question.dragdrop_blanks)
                            : null,
                        p_audiotoscript_url: question.type === "audiotoscript" ? "/audiotoScript/" + question.audiotoscript_url.split("/").pop() : null,
                        p_audiotoscript_script: question.audiotoscript_script || null,
                        p_videotoscript_url: null,
                        p_videotoscript_script: null,
                        p_imagetoscript_url: question.type === "imagetoscript" && question.imagetoscript_url ? "/imagetoscript/" + question.imagetoscript_url.split("/").pop() : null,
                        p_imagetoscript_script: question.type === "imagetoscript" && question.imagetoscript_script ? question.imagetoscript_script : null,
                        p_video_url: null,
                        p_audio_url: question.type === "speaking" && question.audio_script ? "/quiz/audio/" + question.audioFile : null,
                        p_video_pause_url: null,
                        p_video_pause_stamps: null,
                        p_video_pause_question_ids: null,
                        p_audio_pause_url: null,
                        p_audio_pause_stamps: null,
                        p_audio_pause_question_ids: null,
                        p_realword_words: question.realword_words
                            ? JSON.stringify(question.realword_words)
                            : null,
                        p_realword_correct_answers: question.realword_correct_answers
                            ? JSON.stringify(question.realword_correct_answers)
                            : null,
                        p_summarizepassage_summary:
                            question.summarizepassage_summary || null,
                        p_summarizepassage_time_limit:
                            question.summarizepassage_time_limit || null,
                        p_bestoption_passage: question.bestoption_passage || null,
                        p_bestoption_blanked_words: question.bestoption_blanked_words
                            ? JSON.stringify(question.bestoption_blanked_words)
                            : null,
                        p_mcq_question_text: question.mcq_question_text || null,
                        p_arrangeorder_prompt: question.arrangeorder_prompt || null,
                        p_sentences: JSON.stringify(question.sentences) || null,
                        p_correct_order: JSON.stringify(question.correct_order) || null,
                        p_assigned_pause_id: 0
                    },
                }
            );

            const questionId = questionResult.id;

            // 3. If MCQ or idea passage → Create Options
            if (question.mcq_options && question.mcq_options.length > 0) {
                for (const option of question.mcq_options) {
                    const [optionResult] = await sequelize.query(
                        `CALL createQuizQuestionOption(
                            :p_question_id,
                            :p_type,
                            :p_mcq_option_text,
                            :p_mcq_option_img,
                            :p_mcq_is_correct,
                            :p_complate_correct_word,
                            :p_complate_hint,
                            :p_created_by,
                            :p_created_by_type,
                            :p_updated_by,
                            :p_updated_by_type
                            )`,
                        {
                            replacements: {
                                p_question_id: questionId,
                                p_type: question.type, // "mcq" | "complete"
                                p_mcq_option_text: option.mcq_option_text || null,
                                p_mcq_option_img: option.mcq_option_img || null,
                                p_mcq_is_correct:
                                    typeof option.mcq_is_correct === "boolean"
                                        ? option.mcq_is_correct
                                        : null,
                                p_complate_correct_word: option.complate_correct_word || null,
                                p_complate_hint: option.complate_hint || null,
                                p_created_by: CREATED_BY,
                                p_created_by_type: CREATED_BY_TYPE,
                                p_updated_by: CREATED_BY,
                                p_updated_by_type: CREATED_BY_TYPE,
                            },
                        }
                    );
                }
            }

            // 3. If Complete Sentence → Create Options
            if (question.complete_sentence_options && question.complete_sentence_options.length > 0) {
                for (const option of question.complete_sentence_options) {
                    const [optionResult] = await sequelize.query(
                        `CALL createQuizQuestionOption(
                            :p_question_id,
                            :p_type,
                            :p_mcq_option_text,
                            :p_mcq_option_img,
                            :p_mcq_is_correct,
                            :p_complate_correct_word,
                            :p_complate_hint,
                            :p_created_by,
                            :p_created_by_type,
                            :p_updated_by,
                            :p_updated_by_type
                            )`,
                        {
                            replacements: {
                                p_question_id: questionId,
                                p_type: "complete_sentence",
                                p_mcq_option_text: option.mcq_option_text || null,
                                p_mcq_option_img: option.mcq_option_img || null,
                                p_mcq_is_correct:
                                    typeof option.mcq_is_correct === "boolean"
                                        ? option.mcq_is_correct
                                        : null,
                                p_complate_correct_word: option.complate_correct_word || null,
                                p_complate_hint: option.complate_hint || null,
                                p_created_by: CREATED_BY,
                                p_created_by_type: CREATED_BY_TYPE,
                                p_updated_by: CREATED_BY,
                                p_updated_by_type: CREATED_BY_TYPE,
                            },
                        }
                    );
                }
            }
        }

        await sequelize.query(`CALL updateQuizStatusById(:quiz_id, :status)`, {
            replacements: {
                quiz_id: quizId,
                status: "active"
            }
        })

        return quizId;
    } catch (err) {
        console.error("❌ Error creating quiz:", err.message);
        throw err;
    }
};

async function createFullAssignment(assignmentData) {
    try {
        const {
            title,
            description,
            days_to_complete,
            max_score,
            passing_score,
            max_attempt,
            category,
            matching_questions = [],
            true_false_questions = [],
            fill_the_blanks_questions = [],
            paragraph_prompt
        } = assignmentData;

        // 1. Create Assignment
        const [assignmentResult] = await sequelize.query(
            `CALL createAssignment(
                :p_module_id,
                :p_title,
                :p_description,
                :p_assignment_file,
                :p_days_to_complete,
                :p_max_score,
                :p_passing_score,
                :p_max_attempt,
                :p_extension_limit,
                :p_category,
                :p_created_by,
                :p_updated_by,
                :p_created_by_type,
                :p_updated_by_type
            )`,
            {
                replacements: {
                    p_module_id: assignmentData.module_id,
                    p_title: title,
                    p_description: description,
                    p_assignment_file: null,
                    p_days_to_complete: days_to_complete,
                    p_max_score: max_score,
                    p_passing_score: passing_score,
                    p_max_attempt: max_attempt,
                    p_extension_limit: 3,
                    p_category: category,
                    p_created_by: CREATED_BY,
                    p_updated_by: CREATED_BY,
                    p_created_by_type: CREATED_BY_TYPE,
                    p_updated_by_type: CREATED_BY_TYPE,
                },
            }
        );

        const assignmentId = assignmentResult.id;

        // 2. Handle different question types based on category
        switch (category) {
            case 'matching':
                await createMatchingQuestions(assignmentId, matching_questions);
                break;

            case 'true_false':
                await createTrueFalseQuestions(assignmentId, true_false_questions);
                break;

            case 'fill_in_the_blanks':
                await createFillTheBlanksQuestions(assignmentId, fill_the_blanks_questions);
                break;

            case 'paragraph_writing':
                await createParagraphWriting(assignmentId, paragraph_prompt);
                break;
        }

        await sequelize.query(`CALL updateAssignmentStatusById(:assignment_id, :status)`, {
            replacements: {
                assignment_id: assignmentId,
                status: "active"
            }
        })

        return assignmentId;

    } catch (err) {
        console.error("❌ Error creating assignment:", err.message);
        throw err;
    }
};

// Helper functions for different question types
async function createMatchingQuestions(assignmentId, questions) {
    for (const question of questions) {
        const [questionResult] = await sequelize.query(
            `CALL createMatchingQuestion(
                :p_assignment_id,
                :p_question_text,
                :p_created_by,
                :p_updated_by,
                :p_created_by_type,
                :p_updated_by_type
            )`,
            {
                replacements: {
                    p_assignment_id: assignmentId,
                    p_question_text: question.question_text,
                    p_created_by: CREATED_BY,
                    p_updated_by: CREATED_BY,
                    p_created_by_type: CREATED_BY_TYPE,
                    p_updated_by_type: CREATED_BY_TYPE,
                },
            }
        );

        const questionId = questionResult.id;

        for (const option of question.MatchingOptions) {
            await sequelize.query(
                `CALL createMatchingOption(
                    :p_question_id,
                    :p_option_text,
                    :p_option_type,
                    :p_match_text,
                    :p_match_type,
                    :p_created_by,
                    :p_updated_by,
                    :p_created_by_type,
                    :p_updated_by_type
                )`,
                {
                    replacements: {
                        p_question_id: questionId,
                        p_option_text: option.option_text,
                        p_option_type: 'text',
                        p_match_text: option.match_text,
                        p_match_type: 'text',
                        p_created_by: CREATED_BY,
                        p_updated_by: CREATED_BY,
                        p_created_by_type: CREATED_BY_TYPE,
                        p_updated_by_type: CREATED_BY_TYPE,
                    },
                }
            );
        }
    }
};

async function createTrueFalseQuestions(assignmentId, questions) {
    for (const question of questions) {
        await sequelize.query(
            `CALL createTrueFalseQuestion(
                :p_assignment_id,
                :p_question_text,
                :p_correct_answer,
                :p_created_by,
                :p_updated_by,
                :p_created_by_type,
                :p_updated_by_type
            )`,
            {
                replacements: {
                    p_assignment_id: assignmentId,
                    p_question_text: question.question_text,
                    p_correct_answer: question.correct_answer,
                    p_created_by: CREATED_BY,
                    p_updated_by: CREATED_BY,
                    p_created_by_type: CREATED_BY_TYPE,
                    p_updated_by_type: CREATED_BY_TYPE,
                },
            }
        );
    }
};

async function createFillTheBlanksQuestions(assignmentId, questions) {
    for (const question of questions) {
        const { questionWithBlanks, answers } = extractAnswersAndReplaceWithBlanks(question.question_text);

        await sequelize.query(
            `CALL createFillTheBlanksQuestion(
                :p_assignment_id,
                :p_question_text,
                :p_answers,
                :p_created_by,
                :p_updated_by,
                :p_created_by_type,
                :p_updated_by_type
            )`,
            {
                replacements: {
                    p_assignment_id: assignmentId,
                    p_question_text: questionWithBlanks,
                    p_answers: JSON.stringify(answers),
                    p_created_by: CREATED_BY,
                    p_updated_by: CREATED_BY,
                    p_created_by_type: CREATED_BY_TYPE,
                    p_updated_by_type: CREATED_BY_TYPE,
                },
            }
        );
    }
};

async function createParagraphWriting(assignmentId, prompt) {
    await sequelize.query(
        `CALL createParagraphWriting(
            :p_assignment_id,
            :p_prompt,
            :p_created_by,
            :p_updated_by,
            :p_created_by_type,
            :p_updated_by_type
        )`,
        {
            replacements: {
                p_assignment_id: assignmentId,
                p_prompt: prompt,
                p_created_by: CREATED_BY,
                p_updated_by: CREATED_BY,
                p_created_by_type: CREATED_BY_TYPE,
                p_updated_by_type: CREATED_BY_TYPE,
            },
        }
    );
};

// Helper function to extract answers from fill-in-the-blanks format
function extractAnswersAndReplaceWithBlanks(text) {
    const answerRegex = /__([^_]+)__/g;
    const answers = [];
    let match;

    while ((match = answerRegex.exec(text)) !== null) {
        answers.push(match[1]);
    }

    const questionWithBlanks = text.replace(answerRegex, '_____');

    return { questionWithBlanks, answers };
};

async function saveFullCourse(courseData, userId, role, courseGenerationPaymentId) {
    const t = await sequelize.transaction();
    try {
        let category = {};
        const course = courseData.course;
        if (course.category_id == null) {
            category = course.category;

            // 1. Check if category already exists
            const [existingCategory] = await sequelize.query(
                `SELECT id FROM tbl_course_categories WHERE category = :category LIMIT 1`,
                {
                    replacements: { category: category.name?.trim() },
                    transaction: t
                }
            );

            if (existingCategory && existingCategory.length > 0) {
                // Assign existing category id
                course.category_id = existingCategory[0].id;
            } else {
                // 2. Create new category via procedure
                const [categoryResult] = await sequelize.query(
                    `CALL createCourseCategory(:category, :created_by)`,
                    {
                        replacements: {
                            category: category.name,
                            created_by: CREATED_BY,
                        },
                        transaction: t
                    }
                );
                course.category_id = categoryResult.id;
            }
        }
        const faqs = courseData.faqs || [];
        const sessions = courseData.sessions || [];
        const modules = courseData.modules || [];

        // 1️⃣ Create Course
        const [courseResult] = await sequelize.query(
            `CALL createCourseProcedure(
                :title, :description, :category_id, :price, :discount, :duration_minutes, :expiry_days,
                :what_you_will_learn, :is_points_enrollable, :points_to_enroll,
                :is_points_rewarded, :points_rewarded, :is_points_rewarded_on_completion, :points_rewarded_on_completion,
                :is_copy_paste_allowed, :is_course_trending, :meta_title, :meta_keyword, :meta_description, 
                :seo_image, :seo_image_alt, :seo_canonical, :og_title, :og_description, 
                :og_image, :og_image_alt, :prerequisites, :hashtags, :p_skill_development,
                :status, :thumbnail, :preview_video, :min_access_minutes, :max_access_minutes,
                :generated_by, :created_by, :updated_by, :created_by_type, :updated_by_type
            )`,
            {
                replacements: {
                    title: course.title,
                    description: course.description,
                    category_id: course.category_id,
                    price: 0.0, // dummy
                    discount: 0, // dummy
                    duration_minutes: course.duration_minutes,
                    expiry_days: course.expiry_days,
                    what_you_will_learn: JSON.stringify(course.what_you_will_learn),
                    is_points_enrollable: false,
                    points_to_enroll: null,
                    is_points_rewarded: false,
                    points_rewarded: null,
                    is_points_rewarded_on_completion: false,
                    points_rewarded_on_completion: null,
                    is_copy_paste_allowed: false,
                    is_course_trending: false,
                    meta_title: course.meta_title || null,
                    meta_keyword: course.meta_keyword || null,
                    meta_description: course.meta_description || null,
                    seo_image: course.seo_image || "placeholder.png",
                    seo_image_alt: course.seo_image_alt || null,
                    seo_canonical: course.seo_canonical || null,
                    og_title: course.og_title || null,
                    og_description: course.og_description || null,
                    og_image: course.og_image || "placeholder.png",
                    og_image_alt: course.og_image_alt || null,
                    prerequisites: JSON.stringify(course.prerequisites),
                    hashtags: JSON.stringify(course.hashtags),
                    p_skill_development: JSON.stringify(course.skill_development),
                    status: role === "student" ? "private" : "draft",
                    thumbnail: "/course/thumbnail/" + course.thumbnail,
                    preview_video: JSON.stringify(["/course/preview_video/" + course.thumbnail]),
                    min_access_minutes: 1,
                    max_access_minutes: 180,
                    generated_by: role === "student" ? userId : null,
                    created_by: CREATED_BY,
                    updated_by: CREATED_BY,
                    created_by_type: CREATED_BY_TYPE,
                    updated_by_type: CREATED_BY_TYPE
                },
                transaction: t
            }
        );

        const createdCourse = Array.isArray(courseResult) ? courseResult[0] : courseResult;
        const courseHash = createdCourse.public_hash;

        // Generate canonical URL
        const canonicalUrl = `${process.env.FRONTEND_URL}/course/${courseHash}`;

        // Update the course canonical
        await Course.update(
            {
                seo_canonical: canonicalUrl
            },
            {
                where: {
                    public_hash: courseHash
                },
                transaction: t
            }
        );

        if (courseGenerationPaymentId) {
            // To Update the Generate Course in Course Generation Tier Payment
            await sequelize.query(`CALL updateGeneratedCourse(:p_course_gen_payment_id, :p_generated_course_id)`,
                {
                    replacements: {
                        p_course_gen_payment_id: courseGenerationPaymentId,
                        p_generated_course_id: createdCourse.id
                    },
                    transaction: t
                }
            )
        }

        // 2️⃣ Insert FAQs and FAQ Options
        for (const faq of faqs) {
            const [faqResult] = await sequelize.query(
                `CALL createCourseFAQ(:course_hash, :question, :created_by, :created_by_type, :updated_by, :updated_by_type)`,
                {
                    replacements: {
                        course_hash: courseHash,
                        question: faq.question,
                        created_by: CREATED_BY,
                        created_by_type: CREATED_BY_TYPE,
                        updated_by: CREATED_BY,
                        updated_by_type: CREATED_BY_TYPE
                    },
                    transaction: t
                }
            );

            const faqRow = Array.isArray(faqResult) ? faqResult[0] : faqResult;
            const faqId = faqRow.id;

            for (const option of faq.options) {
                await sequelize.query(
                    `CALL createCourseFAQOption(:faq_id, :option_text, :created_by, :created_by_type, :updated_by, :updated_by_type)`,
                    {
                        replacements: {
                            faq_id: faqId,
                            option_text: option.option_text,
                            created_by: CREATED_BY,
                            created_by_type: CREATED_BY_TYPE,
                            updated_by: CREATED_BY,
                            updated_by_type: CREATED_BY_TYPE
                        },
                        transaction: t
                    }
                );
            }
        }

        // 3️⃣ Insert Sessions
        const sessionMap = {};
        for (const session of sessions) {
            const [sessionResult] = await sequelize.query(
                `CALL createSession(:course_public_hash, :title, :is_points_rewarded_on_completion, :points_rewarded_on_completion, :created_by, :updated_by, :min_time_in_minute, :created_by_type, :updated_by_type)`,
                {
                    replacements: {
                        course_public_hash: courseHash,
                        title: session.title,
                        is_points_rewarded_on_completion: false,
                        points_rewarded_on_completion: null,
                        created_by: CREATED_BY,
                        updated_by: CREATED_BY,
                        min_time_in_minute: session.min_time_in_minute, // dummy min per session
                        created_by_type: CREATED_BY_TYPE,
                        updated_by_type: CREATED_BY_TYPE
                    },
                    transaction: t
                }
            );

            const sessionRow = Array.isArray(sessionResult) ? sessionResult[0] : sessionResult;
            sessionMap[session.sequence_no] = sessionRow.public_hash;
        }

        // 4️⃣ Insert Modules
        for (const module of modules) {
            await sequelize.query(
                `CALL createModuleProcedure(:course_id, :session_id, :title, :duration_minutes, :created_by, :updated_by, :created_by_type, :updated_by_type)`,
                {
                    replacements: {
                        course_id: courseHash,
                        session_id: sessionMap[module.session_id], // map session_id to hash
                        title: module.title,
                        duration_minutes: module.duration_minutes,
                        created_by: CREATED_BY,
                        updated_by: CREATED_BY,
                        created_by_type: CREATED_BY_TYPE,
                        updated_by_type: CREATED_BY_TYPE
                    },
                    transaction: t
                }
            );
        }

        await t.commit();
        return { success: true, course: createdCourse };
    } catch (err) {
        await t.rollback();
        console.error("Error saving full course:", err);
        throw err;
    }
};

const generateTopicForDatabase = async (topic, moduleStructure, content_style) => {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = getPrompt("course.topicToDatabase", {
        topicStructure: JSON.stringify(topic),
        topicContentType: topic.content_type,
        moduleStructure: JSON.stringify(moduleStructure),
        content_style: content_style
    });

    try {
        await delay(DELAY);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();

        return jsonParser(text);
    } catch (error) {
        console.error("Gemini AI Error:", error);
        throw new Error(`Single topic generation failed: ${error.message}`);
    }
};

async function saveSingleTopic(courseName, sessionName, moduleName, topic) {
    const t = await sequelize.transaction();
    try {
        const mediaInfo = { sessionName, moduleName, content: "Topic", contentName: topic.title };

        let totalDuration = 0;

        let audioResponse;
        // Generate media
        if (topic.content_type === "video") {
            if (topic.content.video_prompt) {
                await generateAndSaveVideo(courseName, mediaInfo, topic.content.video_prompt, topic.content.videoUrl?.split("/").pop() || topic.files.videoUrl?.split("/").pop(), "video");
            }
        } else if (topic.content_type === "audio") {
            if (topic.content.audio_script) {
                audioResponse = await generateAndSaveAudio(courseName, mediaInfo, topic.content.audio_script, topic.content.audioUrl.split("/").pop(), "audio");
                if (audioResponse?.duration) {
                    totalDuration += audioResponse.duration;
                    topic.content.duration_minutes = audioResponse.duration;
                }
            }
            if (topic.content.image_prompt) {
                await generateAndSaveImageWithGemini(courseName, mediaInfo, topic.content.image_prompt, topic.content.image_url.split("/").pop(), "/audio/image");
            }
        } else if (topic.content_type === "general") {
            if (topic.content.completion_type === "audio") {
                audioResponse = await generateAndSaveAudio(courseName, mediaInfo, topic.content.audio_script, topic.content.audio_url.split("/").pop(), "/audios/general");
                if (audioResponse?.duration) {
                    totalDuration += audioResponse.duration;
                    topic.content.duration_minutes = audioResponse.duration;
                }
            }
        } else if (topic.content_type === "slide") {
            for (const slide of topic.content) {
                let slideDuration = 0;

                if (slide.materials) {
                    for (const material of slide.materials) {
                        if (material.material_type === "image" && material.image_prompt) {
                            await generateAndSaveImageWithGemini(courseName, { ...mediaInfo, content: "Slide", contentName: slide.title, topicName: topic.title }, material.image_prompt, material.url.split("/").pop(), "/slide_material/image");
                        } else if (material.material_type === "other" && material.audio_script) {
                            await generateAndSaveAudio(courseName, { ...mediaInfo, content: "Slide", contentName: slide.title, topicName: topic.title }, material.audio_script, material.url.split("/").pop(), "/slide_material/others");
                        }
                    }
                }

                if (slide.slideCompletionType == "audio" && slide.audio_script) {
                    const res = await generateAndSaveAudio(courseName, { ...mediaInfo, content: "Slide", contentName: slide.title, topicName: topic.title }, slide.audio_script, slide.audio_url.split("/").pop(), "/audios/multi_slide");
                    if (res?.duration) {
                        slideDuration += res.duration;
                    }
                }
                // ✅ store per slide
                slide.slide_duration = slideDuration;
                slide.slide_extra_duration = 0;
                slide.total_slide_duration = slideDuration;

                // ✅ add to total
                totalDuration += slideDuration;

                if (slide.content_type === "video") {
                    if (slide.video_prompt) {
                        await generateAndSaveVideo(courseName, { ...mediaInfo, content: "Slide", contentName: slide.title, topicName: topic.title }, slide.video_prompt, slide.videoUrl?.split("/").pop(), "/multiSlide/video");
                    }
                }
                // if (slide.content_type === "general" && slide.materials && slide.materials.length > 0) {
                //     for (material of slide.materials) {
                //         if (material.material_type === "image") {
                //             await generateAndSaveImageWithGemini(material.image_prompt, material.url.split("/").pop(), "/general/image");
                //         }
                //         if (material.material_type === "other") {
                //             await generateAndSaveAudio(material.audio_script, material.url.split("/").pop(), "/general/others");
                //         }
                //     }
                // } else if (slide.content_type === "audio" && slide.slideAudioUrl_script) {
                //     await generateAndSaveAudio(slide.slideAudioUrl_script, slide.audioUrl.split("/").pop(), "/multi_slide/audio");
                // }
            }
        } else if (topic.content_type === "accordian") {
            for (const accordian of topic.content) {
                let accDuration = 0;

                if (accordian.accordianCompletionType === "audio" && accordian.audio_script) {
                    const res = await generateAndSaveAudio(courseName, { ...mediaInfo, content: "Accordian", contentName: accordian.title, topicName: topic.title }, accordian.audio_script, accordian.audioUrl.split("/").pop(), "/audios/accordion");
                    if (res?.duration) {
                        accDuration += res.duration;
                    }
                }
                // ✅ store per accordion section
                accordian.accordianAudioDuration = accDuration;

                // ✅ add to total
                totalDuration += accDuration;
            }
        }

        if (topic.tags) {
            for (const tag of topic.tags) {
                if (tag.tag_type === "file") {
                    if (tag.image_prompt) {
                        await generateAndSaveImageWithGemini(courseName, mediaInfo, tag.image_prompt, tag.tagFile.split("/").pop(), "tags");
                    } else if (tag.audio_script) {
                        await generateAndSaveAudio(courseName, mediaInfo, tag.audio_script, tag.tagFile.split("/").pop(), "tags");
                    }
                }
            }
        }

        if (topic.materials) {
            for (const material of topic.materials) {
                if (material.material_type === "image" && material.image_prompt) {
                    await generateAndSaveImageWithGemini(courseName, mediaInfo, material.image_prompt, material.url.split("/").pop(), "/material/image");
                } else if (material.material_type === "other" && material.audio_script) {
                    await generateAndSaveAudio(courseName, mediaInfo, material.audio_script, material.url.split("/").pop(), "/material/others");
                }
            }
        }

        // Save topic via stored procedure
        const [topicResult] = await sequelize.query(
            `CALL CreateTopicWithContent(
                :module_id, :title, :description, :content_type, 
                :created_by, :created_by_type, :tags, :materials, 
                :content, :files, :languages, :p_topic_duration, :p_extra_duration, :p_total_duration
            )`,
            {
                replacements: {
                    module_id: topic.module_id,
                    title: topic.title,
                    description: (topic.content_type == 'slide' || topic.content_type == 'accordian' || topic.content_type == 'general') ? topic.description.replace(/\\n/g, '\n').replace(/<.*?>/g, '') : topic.description.replace(/\\n/g, '\n'),
                    content_type: topic.content_type == "accordian" || topic.content_type == "accordion" ? "accordian" : topic.content_type,
                    created_by: topic.created_by,
                    created_by_type: topic.created_by_type,
                    tags: JSON.stringify(preserveMultilineCode(topic.tags)),
                    materials: JSON.stringify(preserveMultilineCode(topic.materials)),
                    content: JSON.stringify(preserveMultilineCode(topic.content_type == 'slide' ? topic.content.map((obj, index) => ({ ...obj, index: index })) : topic.content)),
                    files: JSON.stringify(topic.files) || null,
                    languages: null,
                    p_topic_duration: totalDuration || 0,
                    p_extra_duration: 0,
                    p_total_duration: totalDuration || 0
                },
                transaction: t
            }
        );
        await t.commit();

        return topicResult?.topic_id
    } catch (err) {
        await t.rollback();
        console.error(`❌ Error saving topic "${topic.title}":`, err);
        throw err;
    }
};

function preserveMultilineCode(obj) {
    // Recursively traverse object and replace escaped newlines in 'code' fields
    if (Array.isArray(obj)) {
        return obj.map(preserveMultilineCode);
    } else if (typeof obj === 'object' && obj !== null) {
        const newObj = {};
        for (const key in obj) {
            if (key === 'code' && typeof obj[key] === 'string') {
                newObj[key] = obj[key]
                    .replace(/\\n/g, '\n')
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/\n{2,}/g, '\n\n'); // replace escaped \n with actual newline
            } else if (key === 'tagFile' && typeof obj[key] === 'string') {
                newObj[key] = obj[key]
                    .replace(/\\n/g, '\n')
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/\n{2,}/g, '\n\n'); // replace escaped \n with actual newline
            } else if (key === 'description' && typeof obj[key] === 'string') {
                newObj[key] = obj[key]
                    .replace(/\\n/g, '\n')
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/\n{2,}/g, '\n\n'); // replace escaped \n with actual newline
            } else if (key === 'body' && typeof obj[key] === 'string') {
                newObj[key] = obj[key]
                    .replace(/\\n/g, '\n')
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/\n{2,}/g, '\n\n'); // replace escaped \n with actual newline
            } else {
                newObj[key] = preserveMultilineCode(obj[key]);
            }
        }
        return newObj;
    }
    return obj;
}

async function getSessionModuleMappings(courseId) {
    try {
        const [sessions] = await sequelize.query(
            `SELECT public_hash as session_hash, id as session_id, sequence_no as session_sequence 
             FROM tbl_session WHERE course_id = :courseId ORDER BY sequence_no`,
            { replacements: { courseId } }
        );

        const mappings = [];

        for (const session of sessions) {
            const [modules] = await sequelize.query(
                `SELECT public_hash as module_hash, id as module_id, sequence_no as module_sequence 
                 FROM tbl_modules WHERE session_id = :sessionId ORDER BY sequence_no`,
                { replacements: { sessionId: session.session_id } }
            );

            for (const module of modules) {
                mappings.push({
                    session_id: session.session_id,
                    session_hash: session.session_hash,
                    session_sequence: session.session_sequence,
                    module_id: module.module_id,
                    module_hash: module.module_hash,
                    module_sequence: module.module_sequence
                });
            }
        }

        return mappings;
    } catch (error) {
        console.error("Error getting session/module mappings:", error);
        throw error;
    }
};

// Give Prompt and Files --> Generate Structure and Give in Response For Review
const courseContentGenerater = async (req, res, next) => {
    const userId = req.user?.id;

    try {
        const user_id = req.user?.id;

        const { success: userFeatureSuccess, data: userFeatureData, error: userFeatureError } = await callProcedure("getUserDailyFeatureCount", [user_id, "course_generation"]);
        if (!userFeatureSuccess) return next(userFeatureError);
        const { success: sLimit, data: dLimit, error: eLimit } = await callProcedure("getFeatureSettings", ["course_generation"]);
        if (!sLimit) return next(eLimit);

        const featureDetails = userFeatureData[0];

        if (dLimit[0]?.limit && featureDetails?.count >= dLimit[0]?.limit) {
            return res.status(409).json({
                error: 'Your Usage Limit is Reached.',
                success: false
            });
        }

        notifyCourseProgress(userId, 'start', 'Generating course structure');

        const { userQuery, difficulty_level, tier } = req.body;

        // Process uploaded files (same as before)
        let allExtractedText = "";
        if (req.files && req.files.length > 0) {
            const extractionPromises = req.files.map((file) => extractTextFromFile(file));
            const extractionResults = await Promise.all(extractionPromises);

            extractionResults.forEach((result) => {
                if (result.text && !result.error) {
                    allExtractedText += `\n\n--- Content from ${result.filename} ---\n${result.text}`;
                }
            });
        }

        // Generate course structure only (stop here for user confirmation)
        const courseStructure = await generateCourseStructure(userQuery, JSON.parse(difficulty_level), tier, allExtractedText);

        // Clean up files immediately since we have the structure
        await cleanupFiles(req.files);


        const { success, data, error } = await callProcedure("createCourseGenerationHistory", [userId, courseStructure.course.title, JSON.stringify({ course: courseStructure, level: JSON.parse(difficulty_level) })])

        // Return structure for user confirmation instead of generating full course
        res.json({
            success: true,
            courseStructure: courseStructure,
            courseGenerationHistoryId: success ? data[0]?.id : null,
            message: 'Course structure generated. Please confirm items to generate.'
        });

    } catch (error) {
        await cleanupFiles(req.files);
        next(error);
    }
};

// Give Structure --> Generate and Save to DB
const confirmAndGenerateCourse = async (req, res, next) => {
    const userId = req.user?.id;
    const { role = 'student' } = req.user
    const { courseStructure, courseGenerationPaymentId, tier_id } = req.body; // selectedItems: { sessions: [], modules: [], topics: [], assignments: [], quizzes: [] }

    try {

        if (role === 'student') {
            const { success, data, error } = await callProcedure("getCourseGenerationPaymentById", [courseGenerationPaymentId])

            if (!success || data[0].user_id != userId || data[0].tier_id != tier_id) {
                return res.status(400).json({ error: "Access Denied For this" });
            }
            if (Boolean(data[0].generation_complete)) {
                return res.status(400).json({ error: "Course Already Generated" });
            }
        }

        notifyCourseProgress(userId, 'start', 'Starting course generation');

        // Transform course structure to database format (same as before)
        notifyCourseProgress(userId, 'transforming_database', 'Transforming course to database format');
        const courseDB = await transformCourseToDatabase(courseStructure);
        notifyCourseProgress(userId, 'database_transformed', 'Course transformed to database format');

        // Generate and save thumbnail
        notifyCourseProgress(userId, 'generating_thumbnail', 'Generating course thumbnail');
        await generateAndSaveImageWithGemini(courseDB.course?.title, { content: "course" }, courseDB.course?.thumbnail_prompt, courseDB.course?.thumbnail, "course/thumbnail");
        await generateAndSaveVideo(courseDB.course?.title, { content: "course" }, courseDB.course?.preview_video_prompt, courseDB.course?.preview_video, "course/preview_video");
        notifyCourseProgress(userId, 'thumbnail_generated', 'Thumbnail generated successfully');

        // Save the main course structure
        notifyCourseProgress(userId, 'saving_course', 'Saving course to database');
        const savedCourse = await saveFullCourse(courseDB, userId, role, courseGenerationPaymentId);
        notifyCourseProgress(userId, 'course_saved', 'Course saved successfully');

        const courseHash = savedCourse.course.public_hash;
        const courseId = savedCourse.course.id;

        // Get session and module mappings
        notifyCourseProgress(userId, 'retrieving_mappings', 'Retrieving session and module mappings');
        const sessionModuleMap = await getSessionModuleMappings(courseId);
        notifyCourseProgress(userId, 'mappings_retrieved', 'Session and module mappings retrieved');

        // Process only selected items
        await generateSelectedItems(courseDB.course?.title, courseStructure, sessionModuleMap, userId);

        notifyCourseProgress(userId, 'complete', 'Course generation completed successfully', {
            courseHash: courseHash,
            courseId: courseId
        });

        res.json({
            success: true,
            courseHash: courseHash,
            courseTitle: courseDB.course?.title,
            message: 'Course generated successfully based on user selection'
        });

    } catch (error) {
        console.error("Error in confirmAndGenerateCourse:", error);
        next(error);
    }
};

// Updated backend notification function
async function generateSelectedItems(course_name, courseStructure, sessionModuleMap, userId) {
    const totalSessions = courseStructure.course.sessions.length;
    const courseName = course_name || courseStructure?.course?.title;

    let processedSessions = 0;
    let totalTopics = 0;
    let processedTopics = 0;
    let totalAssignments = 0;
    let processedAssignments = 0;
    let totalQuizzes = 0;
    let processedQuizzes = 0;

    // Calculate totals first for better progress tracking
    courseStructure.course.sessions.forEach(session => {
        session.modules.forEach(module => {
            totalTopics += (module.topics || []).length;
            totalAssignments += (module.assignments || []).length;
            totalQuizzes += (module.quizzes || []).length;
        });
    });

    for (const session of courseStructure.course.sessions) {
        processedSessions++;

        notifyCourseProgress(
            userId,
            'processing_session',
            `Processing session ${processedSessions} of ${totalSessions}`,
            {
                sessionNumber: session.session_number,
                sessionTitle: session.title,
                current: processedSessions,
                total: totalSessions
            }
        );

        for (const module of session.modules) {
            const dbModuleInfo = sessionModuleMap.find(m =>
                m.session_sequence === session.session_number &&
                m.module_sequence === module.module_number
            );

            if (!dbModuleInfo) continue;

            // ─── Maps to hold title → DB id for linking ───────────────────
            const topicTitleToIdMap = {};
            const assignmentTitleToIdMap = {};
            const quizTitleToIdMap = {};

            // Process topics
            const moduleTopics = module.topics || [];
            if (moduleTopics.length > 0) {
                for (let i = 0; i < moduleTopics.length; i++) {
                    const topic = moduleTopics[i];
                    processedTopics++;

                    notifyCourseProgress(
                        userId,
                        'generating_topic',
                        `Generating topic: ${topic.title}`,
                        {
                            topicTitle: topic.title,
                            topicIndex: processedTopics,
                            totalTopics: totalTopics,
                            moduleTitle: module.title,
                            progress: Math.round((processedTopics / totalTopics) * 100)
                        }
                    );

                    const { topic_content, ...topicStructure } = topic;

                    const topicId = await generateAndSaveSingleTopic(courseName, session.title, module.title, topicStructure, dbModuleInfo, courseStructure?.course?.content_style || "professional", userId);

                    // Store topic id by title for later linking
                    topicTitleToIdMap[topic.title] = topicId;

                    notifyCourseProgress(
                        userId,
                        'topic_generated',
                        `Topic generated: ${topic.title}`,
                        {
                            topicTitle: topic.title,
                            processedType: 'topic',
                            progress: Math.round((processedTopics / totalTopics) * 100)
                        }
                    );
                }
            }

            // Process assignments
            if (module.assignments && module.assignments.length > 0) {
                for (let i = 0; i < module.assignments.length; i++) {
                    const assignment = module.assignments[i];
                    processedAssignments++;

                    notifyCourseProgress(
                        userId,
                        'generating_assignments',
                        `Generating assignment: ${assignment.title || 'Assignment'}`,
                        {
                            assignmentTitle: assignment.title || `Assignment ${i + 1}`,
                            moduleTitle: module.title,
                            assignmentIndex: processedAssignments,
                            totalAssignments: totalAssignments,
                            progress: Math.round((processedAssignments / totalAssignments) * 100)
                        }
                    );

                    const assignmentData = await generateAssignment(module, assignment, courseStructure?.course?.content_style || "professional");
                    const assignmentId = await createFullAssignment({
                        ...assignmentData,
                        module_id: dbModuleInfo.module_hash
                    });

                    // Store assignment id by title for later linking
                    assignmentTitleToIdMap[assignment.title] = assignmentId;

                    notifyCourseProgress(
                        userId,
                        'assignments_generated',
                        `Assignment generated: ${assignment.title || 'Assignment'}`,
                        {
                            assignmentTitle: assignment.title || `Assignment ${i + 1}`,
                            moduleTitle: module.title,
                            processedType: 'assignments',
                            progress: Math.round((processedAssignments / totalAssignments) * 100)
                        }
                    );
                }
            }

            // Process quizzes
            if (module.quizzes && module.quizzes.length > 0) {
                for (let i = 0; i < module.quizzes.length; i++) {
                    const quiz = module.quizzes[i];
                    processedQuizzes++;

                    notifyCourseProgress(
                        userId,
                        'generating_quiz',
                        `Generating quiz: ${quiz.title || 'Quiz'}`,
                        {
                            quizTitle: quiz.title || `Quiz ${i + 1}`,
                            moduleTitle: module.title,
                            quizIndex: processedQuizzes,
                            totalQuizzes: totalQuizzes,
                            progress: Math.round((processedQuizzes / totalQuizzes) * 100)
                        }
                    );

                    const quizData = await generateQuiz(module, quiz, courseStructure?.course?.content_style || "professional");
                    const quizId = await createFullQuiz(
                        courseName,
                        session.title,
                        module.title,
                        {
                            ...quizData,
                            module_hash: dbModuleInfo.module_hash
                        });

                    quizTitleToIdMap[quiz.title] = quizId;

                    notifyCourseProgress(
                        userId,
                        'quiz_generated',
                        `Quiz generated: ${quiz.title || 'Quiz'}`,
                        {
                            quizTitle: quiz.title || `Quiz ${i + 1}`,
                            moduleTitle: module.title,
                            processedType: 'quiz',
                            progress: Math.round((processedQuizzes / totalQuizzes) * 100)
                        }
                    );
                }
            }

            for (const topic of moduleTopics) {
                if (!topic.topic_content?.length) continue;

                const topicId = topicTitleToIdMap[topic.title];
                if (!topicId) continue;

                for (const contentRef of topic.topic_content) {
                    const resolvedAssignmentId = contentRef.type === 'assignment'
                        ? (assignmentTitleToIdMap[contentRef.title] ?? null)
                        : null;

                    const resolvedQuizId = contentRef.type === 'quiz'
                        ? (quizTitleToIdMap[contentRef.title] ?? null)
                        : null;

                    if (!resolvedAssignmentId && !resolvedQuizId) {
                        console.warn(
                            `topic_content ref not resolved — title: "${contentRef.title}", type: "${contentRef.type}"`
                        );
                        continue;
                    }

                    await callProcedure("assignContentToTopic", [
                        dbModuleInfo.module_hash || null,
                        topicId || null,
                        resolvedAssignmentId || null,
                        resolvedQuizId || null,
                        CREATED_BY || 1,
                        CREATED_BY || 1
                    ]);
                }
            }

        }
    }
};

// old helper function to process selected items only
// async function generateSelectedItems(courseStructure, sessionModuleMap, userId) {
//     const totalSessions = courseStructure.course.sessions.length;
//     let processedSessions = 0;

//     for (const session of courseStructure.course.sessions) {
//         processedSessions++;

//         notifyCourseProgress(
//             userId,
//             'processing_session',
//             `Processing session ${processedSessions} of ${totalSessions}`,
//             {
//                 sessionNumber: session.session_number,
//                 sessionTitle: session.title,
//                 current: processedSessions,
//                 total: totalSessions
//             }
//         );

//         for (const module of session.modules) {
//             const dbModuleInfo = sessionModuleMap.find(m =>
//                 m.session_sequence === session.session_number &&
//                 m.module_sequence === module.module_number
//             );

//             if (!dbModuleInfo) continue;

//             // Process topics
//             const moduleTopics = module.topics || [];
//             if (moduleTopics.length > 0) {
//                 notifyCourseProgress(
//                     userId,
//                     'processing_topics',
//                     `Processing ${moduleTopics.length} topics for module`,
//                     {
//                         moduleTitle: module.title,
//                         totalTopics: moduleTopics.length
//                     }
//                 );

//                 for (let i = 0; i < moduleTopics.length; i++) {
//                     const topic = moduleTopics[i];
//                     notifyCourseProgress(
//                         userId,
//                         'generating_topic',
//                         `Generating topic: ${topic.title}`,
//                         {
//                             topicTitle: topic.title,
//                             topicIndex: i + 1,
//                             totalTopics: moduleTopics.length,
//                             moduleTitle: module.title
//                         }
//                     );

//                     await generateAndSaveSingleTopic(topic, dbModuleInfo, userId);

//                     notifyCourseProgress(
//                         userId,
//                         'topic_generated',
//                         `Topic generated: ${topic.title}`,
//                         {
//                             topicTitle: topic.title,
//                             processedType: 'topic'
//                         }
//                     );
//                 }
//             }

//             // Process assignments
//             if (module.assignments && module.assignments.length > 0) {
//                 notifyCourseProgress(
//                     userId,
//                     'generating_assignments',
//                     `Generating ${module.assignments.length} assignments`,
//                     {
//                         moduleTitle: module.title,
//                         totalAssignments: module.assignments.length
//                     }
//                 );

//                 for (const assignment of module.assignments) {
//                     const assignmentData = await generateAssignment(module, assignment);
//                     await createFullAssignment({
//                         ...assignmentData,
//                         module_id: dbModuleInfo.module_hash
//                     });
//                 }

//                 notifyCourseProgress(
//                     userId,
//                     'assignments_generated',
//                     `Assignments generated for module`,
//                     {
//                         moduleTitle: module.title,
//                         processedType: 'assignments'
//                     }
//                 );
//             }

//             // Process quiz
//             if (module.quizzes && module.quizzes.length > 0) {
//                 notifyCourseProgress(
//                     userId,
//                     'generating_quizzes',
//                     `Generating ${module.quizzes.length} quizzes for module`,
//                     {
//                         moduleTitle: module.title,
//                         totalQuizzes: module.quizzes.length
//                     }
//                 );

//                 for (let i = 0; i < module.quizzes.length; i++) {
//                     const quiz = module.quizzes[i];
//                     notifyCourseProgress(
//                         userId,
//                         'generating_quiz',
//                         `Generating quiz ${i + 1} of ${module.quizzes.length}`,
//                         {
//                             moduleTitle: module.title,
//                             quizTitle: quiz.title,
//                             quizIndex: i + 1,
//                             totalQuizzes: module.quizzes.length
//                         }
//                     );

//                     const quizData = await generateQuiz(module, quiz); // Pass the specific quiz
//                     await createFullQuiz({
//                         ...quizData,
//                         module_hash: dbModuleInfo.module_hash
//                     });

//                     notifyCourseProgress(
//                         userId,
//                         'quiz_generated',
//                         `Quiz ${i + 1} generated successfully`,
//                         {
//                             moduleTitle: module.title,
//                             quizTitle: quiz.title,
//                             processedType: 'quiz'
//                         }
//                     );
//                 }
//             }
//         }
//     }
// }

// Helper to generate single topic (extracted from generateAndSaveTopics)
async function generateAndSaveSingleTopic(courseName, sessionName, moduleName, topic, dbModuleInfo, content_style, userId) {
    try {
        const topicDB = await generateTopicForDatabase(topic, { title: dbModuleInfo.module_title, topics: [topic] }, content_style);
        topicDB.topic.module_id = dbModuleInfo.module_hash;
        const topicId = await saveSingleTopic(courseName, sessionName, moduleName, topicDB.topic);

        notifyCourseProgress(
            userId,
            'topic_generated',
            `Topic generated: ${topic.title}`,
            { title: topic.title, processedType: 'topic' }
        );

        return topicId;
    } catch (error) {
        console.error(`Error processing topic:`, error.message);
    }
};

module.exports = {
    courseContentGenerater,
    confirmAndGenerateCourse
}

// async function saveTopics(topicsData) {
//     const t = await sequelize.transaction();
//     try {
//         // / Now you can use topicsData to create topic records
//         for (const topic of topicsData.topics) {

//             if (topic.content_type === "audio" && topic.content.audio_script) {
//                 await generateAndSaveAudio(topic.content.audio_script, topic.content.audioUrl.split("/").pop(), "audio")
//             } else if (topic.content_type === "general") {
//                 if (topic.content.completion_type === "audio") {
//                     await generateAndSaveAudio(topic.content.audio_script, topic.content.audio_url.split("/").pop(), "/audios/general")
//                 }
//                 if (topic.content.material_type === "image") {
//                     await generateAndSaveImageWithGemini(topic.content.image_prompt, topic.files.generalMaterial, "general/image");
//                 }
//             } else if (topic.content_type === "slide") {
//                 for (const slide of topic.content) {
//                     if (slide.slideCompletionType === "audio" && slide.audio_script) {
//                         await generateAndSaveAudio(slide.audio_script, slide.audio_url.split("/").pop(), "/audios/multi_slide")
//                     }
//                     if (slide.content_type === "general" && slide.materialType === "image") {
//                         await generateAndSaveImageWithGemini(slide.image_prompt, slide.imageFileName, "multi_slide/general/image");
//                     } else if (slide.content_type === "audio" && slide.audioUrl_script) {
//                         await generateAndSaveAudio(slide.audioUrl_script, slide.audioUrl.split("/").pop(), "/multi_slide/audio")
//                     }
//                     // else if (slide.content_type === "accordian") {
//                     //     for (const accordian of slide.accordianSections) {
//                     //         if (accordian.accordianCompletionType === "audio" && accordian.audio_script) {
//                     //             await generateAndSaveAudio(accordian.audio_script, accordian.audioUrl.split("/").pop(), "/audios/accordion")
//                     //         }
//                     //     }
//                     // }
//                 }
//             } else if (topic.content_type === "accordian") {
//                 for (const accordian of topic.content) {
//                     if (accordian.accordianCompletionType === "audio" && accordian.audio_script) {
//                         await generateAndSaveAudio(accordian.audio_script, accordian.audioUrl.split("/").pop(), "/audios/accordion")
//                     }
//                 }
//             }

//             if (topic.tags) {
//                 for (const tag of topic.tags) {
//                     if (tag.tag_type === "file") {
//                         if (tag.image_prompt) {
//                             await generateAndSaveImageWithGemini(tag.image_prompt, tag.tagFile.split("/").pop(), "tags");
//                         } else
//                             if (tag.audio_script) {
//                                 await generateAndSaveAudio(tag.audio_script, tag.tagFile.split("/").pop(), "tags");
//                             }
//                     }
//                 }
//             }

//             // Call your stored procedure for each topic
//             const result = await sequelize.query(
//                 `CALL CreateTopicWithContent(
//             :module_id, :title, :description, :content_type,
//             :created_by, :created_by_type, :tags, :content, :files
//         )`,
//                 {
//                     replacements: {
//                         module_id: topic.module_id,
//                         title: topic.title,
//                         description: topic.description,
//                         content_type: topic.content_type,
//                         created_by: topic.created_by,
//                         created_by_type: topic.created_by_type,
//                         tags: JSON.stringify(topic.tags),
//                         content: JSON.stringify(topic.content),
//                         files: JSON.stringify(topic.files)
//                     }
//                 }
//             );
//         }
//     } catch (err) {
//         await t.rollback();
//         console.error("Error saving full course:", err);
//         throw err;
//     }
// }

// async function generateCourseAndSave(userId, userQuery, difficulty_level, tier, allExtractedText) {
//     try {
//         // Step 1: Generate course structure
//         notifyCourseProgress(userId, 'generating_structure', 'Generating course structure');
//         const courseStructure = await generateCourseStructure(userQuery, difficulty_level, tier, allExtractedText);
//         notifyCourseProgress(userId, 'structure_generated', 'Course structure generated successfully');
//         notifyCourseProgress(userId, 'transforming_database', 'Transforming course to database format');
//         const courseDB = await transformCourseToDatabase(courseStructure);
//         notifyCourseProgress(userId, 'database_transformed', 'Course transformed to database format');

//         await generateAndSaveImageWithGemini(courseDB.course.thumbnail_prompt, courseDB.course.thumbnail, "course/thumbnail");

//         // Step 3: Save the main course structure (course, FAQs, sessions, modules)
//         notifyCourseProgress(userId, 'saving_course', 'Saving course to database');
//         const savedCourse = await saveFullCourse(courseDB, userId);
//         notifyCourseProgress(userId, 'course_saved', 'Course saved successfully');

//         const courseHash = savedCourse.course.public_hash;
//         const courseId = savedCourse.course.id;

//         // Step 4: Get session and module mappings
//         notifyCourseProgress(userId, 'retrieving_mappings', 'Retrieving session and module mappings');
//         const sessionModuleMap = await getSessionModuleMappings(courseId);
//         notifyCourseProgress(userId, 'mappings_retrieved', 'Session and module mappings retrieved');
//         // Step 5: Process each module to generate and save topics, quizzes, and assignments
//         const totalModules = courseStructure.course.sessions.reduce((acc, session) => acc + session.modules.length, 0);
//         let processedModules = 0;

//         notifyCourseProgress(userId, 'processing_modules', `Starting processing of ${totalModules} modules`, {
//             total: totalModules,
//             processed: 0
//         });

//         for (const session of courseStructure.course.sessions) {
//             for (const module of session.modules) {
//                 processedModules++;

//                 notifyCourseProgress(
//                     userId,
//                     'processing_module',
//                     `Processing module ${processedModules} of ${totalModules}`,
//                     {
//                         current: processedModules,
//                         total: totalModules,
//                         title: module.title,
//                         session: session.session_number,
//                         totalTopics: module.topics?.length || 0,
//                         totalAssignments: module.assignments?.length || 0,
//                         totalQuizzes: module.quiz ? 1 : 0,
//                         processedTopics: 0,
//                         processedAssignments: 0,
//                         processedQuizzes: 0
//                     }
//                 );

//                 // Find the actual database IDs for this module
//                 const dbModuleInfo = sessionModuleMap.find(m =>
//                     m.session_sequence === session.session_number &&
//                     m.module_sequence === module.module_number
//                 );

//                 if (!dbModuleInfo) {
//                     console.warn(`Could not find database mapping for session ${session.session_number}, module ${module.module_number}`);
//                     continue;
//                 }

//                 try {

//                     // // All Topic of Module in One
//                     // const topicsDB = await generateTopicsForDatabase(module);

//                     // await saveTopics({
//                     //     topics: topicsDB.topics.map(topic => ({
//                     //         ...topic,
//                     //         module_id: dbModuleInfo.module_hash
//                     //     }))
//                     // });

//                     // Process topics One by One
//                     await generateAndSaveTopics(module, dbModuleInfo, userId);

//                     for (const assignment of module.assignments || []) {
//                         notifyCourseProgress(
//                             userId,
//                             'generating_assignment',
//                             `Generating assignment: ${assignment.title}`,
//                             { title: assignment.title, module: module.title }
//                         );

//                         const assignmentData = await generateAssignment(module, assignment);
//                         await createFullAssignment({
//                             ...assignmentData,
//                             module_id: dbModuleInfo.module_hash
//                         });
//                         notifyCourseProgress(
//                             userId,
//                             'assignment_generated',
//                             `Assignment generated: ${assignment.title}`,
//                             { title: assignment.title, module: module.title, processedType: 'assignment' }
//                         );
//                     }

//                     if (module.quiz) {
//                         notifyCourseProgress(
//                             userId,
//                             'generating_quiz',
//                             `Generating quiz: ${module.quiz.title}`,
//                             { title: module.quiz.title, module: module.title }
//                         );
//                         const quizData = await generateQuiz(module);
//                         await createFullQuiz({
//                             ...quizData,
//                             module_hash: dbModuleInfo.module_hash
//                         });
//                         notifyCourseProgress(
//                             userId,
//                             'quiz_generated',
//                             `Quiz generated: ${module.quiz.title}`,
//                             { title: module.quiz.title, module: module.title, processedType: 'quiz' }
//                         );
//                     }

//                 } catch (error) {
//                     console.error(`❌ Error processing topics for module ${module.title}:`, error);
//                     notifyCourseProgress(userId, 'module_error', `Error processing module: ${error.message}`);
//                 }
//             }
//         }

//         notifyCourseProgress(userId, 'all_modules_processed', 'All modules processed successfully', {
//             totalModules: totalModules
//         });

//         return {
//             success: true,
//             course: savedCourse,
//             courseHash: courseHash
//         };

//     } catch (error) {
//         console.error("❌ Error in generateCourseAndSave:", error);
//         throw new Error(`Course generation failed: ${error.message}`);
//     }
// }

// Helper function to get session and module mappings from database

// const generateAndSaveTopics = async (moduleStructure, dbModuleInfo, userId) => {
//     for (let i = 0; i < moduleStructure.topics.length; i++) {
//         const topic = moduleStructure.topics[i];

//         notifyCourseProgress(
//             userId,
//             'generating_topic',
//             `Generating topic: ${topic.title}`,
//             { title: topic.title, module: moduleStructure.title }
//         );
//         try {
//             // Generate from AI
//             const topicDB = await generateTopicForDatabase(topic, moduleStructure);

//             // Add module_hash
//             topicDB.topic.module_id = dbModuleInfo.module_hash;

//             // Save immediately
//             await saveSingleTopic(topicDB.topic);
//             notifyCourseProgress(
//                 userId,
//                 'topic_generated',
//                 `Topic generated: ${topic.title}`,
//                 { title: topic.title, module: moduleStructure.title, processedType: 'topic' }
//             );

//         } catch (error) {
//             console.error(`❌ Error processing topic ${i + 1} (${topic.title || "Untitled"}):`, error.message);
//         }
//     }
// };

// const generateTopicsForDatabase = async (moduleStructure, moduleInfo) => {
//     const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

//     const prompt = getPrompt("course.topicsToDatabase", {
//         moduleStructure: JSON.stringify(moduleStructure),
//         module_id: moduleInfo.module_id,
//         session_id: moduleInfo.session_id
//     });

//     try {
//         const result = await model.generateContent(prompt);
//         const response = await result.response;
//         const text = await response.text();

//         return jsonParser(text);
//     } catch (error) {
//         console.error("Gemini AI Error:", error);
//         throw new Error(`Topics generation failed: ${error.message}`);
//     }
// };
