const pdfParse = require("pdf-parse");
const { getPrompt } = require("./prompts/customCoursePrompts");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const fsp = require("fs").promises;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const CREATED_BY = 1;
const CREATED_BY_TYPE = "admin";
const GEMINI_MODEL = "gemini-3.1-flash-lite-preview"

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

const jsonParser = (rawText) => {
    try {
        // Step 1: Basic validation
        if (!rawText || typeof rawText !== 'string') {
            throw new Error('Input must be a non-empty string');
        }

        // Step 2: Remove markdown-style code block wrappers
        const trimmed = rawText.trim();
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

const generateAdminCourse = async (req, res, next) => {
    const userId = req.user?.id;

    try {

        const { userQuery, difficulty_level, generation_mode = "quick", estimated_hours = 2, contentStyle = "academic" } = req.body;

        // Process uploaded files if any
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

        // Step 1: Generate Course Structure (Sessions & Modules)
        const courseStructure = await generateAdminCourseStructure(userQuery, difficulty_level, allExtractedText, generation_mode, estimated_hours, contentStyle);

        // Step 2: Generate content for each module sequentially
        const completeCourse = await generateAllModuleContent(courseStructure, difficulty_level, allExtractedText, generation_mode, estimated_hours, contentStyle);

        // Clean up files
        await cleanupFiles(req.files);

        res.json({
            success: true,
            course: completeCourse,
            message: 'Admin course structure generated successfully'
        });

    } catch (error) {
        await cleanupFiles(req.files);
        next(error);
    }
};

const generateAdminCourseStructure = async (userQuery, difficulty_level, extractedContent, generation_mode, estimated_hours, contentStyle) => {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = getPrompt("course.adminCourseStructure", {
        userQuery,
        difficulty_level,
        extracted_content: extractedContent,
        generation_mode,
        estimated_hours: estimated_hours || 4,
        content_style: contentStyle
    });

    try {
        await delay(5000);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();
        return jsonParser(text);
    } catch (error) {
        console.error("Gemini AI Error in course structure:", error);
        throw new Error(`Course structure generation failed: ${error.message}`);
    }
};

const generateModuleContent = async (courseTitle, session, module, difficulty_level, allExtractedText, generation_mode, estimated_hours, contentStyle) => {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = getPrompt("course.adminModuleContent", {
        courseTitle,
        sessionTitle: session.title,
        sessionNumber: session.session_number,
        moduleTitle: module.title,
        moduleNumber: module.module_number,
        moduleOverview: module.overview,
        difficulty_level,
        generation_mode,
        estimated_hours,
        extracted_content: allExtractedText,
        content_style: contentStyle
    });

    try {
        await delay(5000);
        const result = await model.generateContent(prompt);
        const response = await result.response;

        const text = await response.text();
        return jsonParser(text);
    } catch (error) {
        console.error(`Gemini AI Error in module ${module.module_number}:`, error);
        throw new Error(`Module content generation failed: ${error.message}`);
    }
};

const generateAllModuleContent = async (courseStructure, difficulty_level, allExtractedText, generation_mode, estimated_hours, contentStyle) => {
    const completeCourse = JSON.parse(JSON.stringify(courseStructure));

    // Initialize modules array in each session
    completeCourse.course.sessions.forEach(session => {
        session.modules = [];
    });

    // Collect all modules from all sessions
    const allModules = [];
    courseStructure.course.sessions.forEach(session => {
        session.modules.forEach(module => {
            allModules.push({
                session,
                module,
                targetSession: completeCourse.course.sessions.find(
                    s => s.session_number === session.session_number
                )
            });
        });
    });

    // Process modules in batches of 3 to avoid rate limits
    const BATCH_SIZE = 3;

    for (let i = 0; i < allModules.length; i += BATCH_SIZE) {
        const batch = allModules.slice(i, i + BATCH_SIZE);

        // Process batch in parallel
        const batchPromises = batch.map(({ session, module }) =>
            generateModuleContent(
                courseStructure.course.title,
                session,
                module,
                difficulty_level,
                allExtractedText,
                generation_mode,
                estimated_hours,
                contentStyle
            ).then(content => ({
                session,
                module,
                content,
                targetSession: completeCourse.course.sessions.find(
                    s => s.session_number === session.session_number
                )
            })).catch(error => {
                console.error(`Failed to generate content for module ${module.module_number}:`, error);
                return { error: true, module, session };
            })
        );

        try {
            const batchResults = await Promise.all(batchPromises);

            // Process successful results
            batchResults.forEach(result => {
                if (!result.error && result.content && result.targetSession) {
                    result.targetSession.modules.push({
                        ...result.module,
                        topics: result.content.module_content.topics,
                        assignments: result.content.module_content.assignments,
                        quizzes: result.content.module_content.quizzes
                    });
                }
            });

            // Add delay between batches
            if (i + BATCH_SIZE < allModules.length) {
                await delay(5000); // 2 second delay between batches
            }

        } catch (error) {
            console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error);
            // Continue with next batch even if one fails
        }
    }

    return completeCourse;
};

const regenerateAdminCourseStructure = async (req, res, next) => {
    try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const { userQuery, regenerationTargets, contextData } = req.body;

        // Step 1: Convert inputs to JSON strings for the prompt
        const regenerationTargetsJSON = JSON.stringify(regenerationTargets, null, 2);
        const contextDataJSON = JSON.stringify(contextData, null, 2);

        const prompt = getPrompt("course.adminContentRegeneration", {
            userQuery,
            regenerationTargetsJSON,
            contextDataJSON
        });

        await delay(5000);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();

        // Parse the response
        let parsedResponse;
        try {
            parsedResponse = jsonParser(text);
        } catch (parseError) {
            console.error("Failed to parse AI response:", parseError);
            // Try to extract JSON from the text if it's wrapped in markdown
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsedResponse = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("Invalid JSON response from AI");
            }
        }

        // Validate the response structure
        if (!parsedResponse.regeneratedContent || !Array.isArray(parsedResponse.regeneratedContent)) {
            throw new Error("Invalid response format from AI - missing regeneratedContent array");
        }

        // Step 4: Return response in the format expected by frontend
        res.json({
            success: true,
            message: "Selected content regenerated successfully",
            data: {
                regeneratedContent: parsedResponse.regeneratedContent
            }
        });

    } catch (error) {
        console.error("Error in regenerateAdminCourseContent:", error);

        // Return error in format frontend expects
        res.status(500).json({
            success: false,
            error: error.message || "Failed to regenerate content",
            message: "Regeneration failed"
        });
    }
};

module.exports = {
    generateAdminCourse,
    regenerateAdminCourseStructure
}