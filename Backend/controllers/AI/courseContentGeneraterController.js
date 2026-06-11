const pdfParse = require("pdf-parse");
const fs = require("fs").promises;
const fss = require("fs");
const path = require("path");

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { callProcedure } = require("../../utils/procedure/callProcedure");
const { generateAudioFile } = require("./textToSpeechController");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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
      await fs.unlink(file.path);
    } catch (error) {
      console.error(`Error deleting file ${file.path}:`, error);
    }
  }
};

// Main API endpoint for multi-level content generation
const courseContentGenerater = async (req, res, next) => {
  try {
    const {
      userQuery,
      contentTypes = ["course", "session", "module", "topic"],
      generateHierarchy = true,
    } = req.body;

    // Enhanced validation
    if (!userQuery) {
      return res.status(400).json({ error: "User query is required" });
    }

    // Handle both single string and array formats for backward compatibility
    let contentTypesArray;
    if (typeof contentTypes === "string") {
      contentTypesArray = [contentTypes];
    } else if (Array.isArray(contentTypes)) {
      contentTypesArray = contentTypes;
    } else {
      return res.status(400).json({ error: "Content types are required" });
    }

    const validContentTypes = [
      "course",
      "assignment",
      "quiz",
      "topic",
      "session",
      "module",
    ];
    const invalidTypes = contentTypesArray.filter(
      (type) => !validContentTypes.includes(type)
    );

    if (invalidTypes.length > 0) {
      return res.status(400).json({
        error: `Invalid content types: ${invalidTypes.join(", ")}`,
      });
    }

    // Process multiple uploaded files
    let allExtractedText = "";
    let fileProcessingResults = [];

    if (req.files && req.files.length > 0) {

      // Extract text from all files
      const extractionPromises = req.files.map((file) =>
        extractTextFromFile(file)
      );
      const extractionResults = await Promise.all(extractionPromises);

      // Combine all extracted text and collect results
      extractionResults.forEach((result, index) => {
        fileProcessingResults.push({
          filename: result.filename,
          type: result.type,
          textLength: result.length,
          hasError: !!result.error,
          error: result.error,
        });

        if (result.text && !result.error) {
          allExtractedText += `\n\n--- Content from ${result.filename} ---\n${result.text}`;
        }
      });

    }

    // Get categories if course generation is requested
    let categories = [];
    if (contentTypesArray.includes("course")) {
      categories = await getAllCategories();
    }

    // Generate content in hierarchical order with combined text from all files
    const generatedContent = await generateMultiLevelContent(
      allExtractedText,
      userQuery,
      contentTypesArray,
      categories,
      generateHierarchy
    );

    // Transform the results into the required format
    const courseContent = transformToFinalFormat(generatedContent.results);

    // Generate course thumbnail image if course content was generated
    let imageGenerationResults = [];

    if (
      contentTypesArray.includes("course") &&
      courseContent &&
      courseContent.image_generation_prompt
    ) {
      try {
        // Create a unique filename for the course image
        const timestamp = Date.now();
        const courseSlug = courseContent.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .substring(0, 50);
        const fileName = `course-${courseSlug}-${timestamp}.png`;

        // Generate the image using Gemini (returns data directly)
        const imageResult = await generateImageWithGemini(
          courseContent.image_generation_prompt,
          fileName
        );

        if (imageResult.success) {
          // Instead of file path, include image data in course content
          courseContent.thumbnailData = {
            fileName: imageResult.fileName,
            mimeType: imageResult.mimeType,
            dataUrl: imageResult.dataUrl, // Ready to use in frontend
            base64: imageResult.data,
          };

          // Keep original thumbnail field for backwards compatibility
          courseContent.thumbnail = `/generated-images/${fileName}`;

          imageGenerationResults.push({
            success: true,
            fileName: imageResult.fileName,
            mimeType: imageResult.mimeType,
            size: imageResult.data.length,
            prompt: courseContent.image_generation_prompt,
          });

        } else {
          imageGenerationResults.push({
            success: false,
            error: imageResult.error,
            prompt: courseContent.image_generation_prompt,
          });
        }
      } catch (imageError) {
        console.error("❌ Error during image generation:", imageError);
        imageGenerationResults.push({
          success: false,
          error: imageError.message,
          prompt: courseContent.image_generation_prompt,
        });
      }
    }

    // Clean up uploaded files
    await cleanupFiles(req.files);

    res.json({
      success: true,
      message: `Multi-level content generated successfully`,
      data: courseContent, // Now includes thumbnailData with image data
      fileProcessingResults: fileProcessingResults,
      imageGenerationResults: imageGenerationResults,
      filesProcessed: req.files ? req.files.length : 0,
      totalTextExtracted: allExtractedText.length,
      imagesGenerated: imageGenerationResults.filter((result) => result.success)
        .length,
    });
  } catch (error) {
    console.error("Error generating multi-level content:", error);

    // Clean up uploaded files in case of error
    await cleanupFiles(req.files);

    // Handle multer errors specifically
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          error: "File size too large. Maximum size is 10MB per file.",
        });
      } else if (error.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          error: "Too many files. Maximum is 10 files.",
        });
      } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          error: "Unexpected file field. Use 'contentFiles' field name.",
        });
      }
    }

    next(error);
  }
};

// New function to transform results into SAMPLE_COURSE_DATA format
const transformToFinalFormat = (results) => {
  const { course, session = [], module = [], topic = [] } = results;

  if (!course) {
    return null;
  }

  // Create the base course structure
  const transformedCourse = {
    ...course,
    sessions: [],
  };

  // Group modules by session_id
  const modulesBySession = {};
  module.forEach((mod) => {
    const sessionId = mod.session_id || 1; // Default to session 1 if not specified
    if (!modulesBySession[sessionId]) {
      modulesBySession[sessionId] = [];
    }
    modulesBySession[sessionId].push(mod);
  });

  // Group topics by module_id
  const topicsByModule = {};
  topic.forEach((top) => {
    const moduleId = top.module_id;
    if (!topicsByModule[moduleId]) {
      topicsByModule[moduleId] = [];
    }
    topicsByModule[moduleId].push(top);
  });

  // Transform sessions with their modules and topics
  transformedCourse.sessions = session.map((sess) => {
    const sessionModules = modulesBySession[sess.id] || [];

    return {
      ...sess,
      course_id: course.id,
      modules: sessionModules.map((mod) => ({
        ...mod,
        course_id: course.id,
        session_id: sess.id,
        topics: topicsByModule[mod.id] || [],
      })),
    };
  });

  return transformedCourse;
};

// Generate multi-level content with hierarchical context
const generateMultiLevelContent = async (
  allExtractedText,
  userQuery,
  contentTypes,
  categories,
  generateHierarchy
) => {
  const startTime = Date.now();
  const results = {};
  const errors = {};

  // Define generation order for hierarchical dependencies
  const generationOrder = [
    "course",
    "session",
    "module",
    "topic", // Topics will be handled specially
    "assignment",
    "quiz",
  ];
  const orderedTypes = generationOrder.filter((type) =>
    contentTypes.includes(type)
  );

  let generationContext = {
    course: null,
    sessions: [],
    modules: [],
    topics: [],
    assignments: [],
    quizzes: [],
  };

  for (const contentType of orderedTypes) {
    try {
      // Add delay between API calls to avoid rate limiting
      if (contentType !== "course") {
        await delay(1000);
      }

      const content = await generateContentByType(
        allExtractedText,
        userQuery,
        contentType,
        categories,
        generationContext,
        generateHierarchy
      );

      results[contentType] = content;

      // Update context for next generation
      if (generateHierarchy) {
        if (contentType === "course") {
          generationContext.course = Array.isArray(content)
            ? content[0]
            : content;
        } else {
          const contextKey = getContextKey(contentType);
          generationContext[contextKey] = content;
        }
      }

    } catch (error) {
      console.error(`❌ Error generating ${contentType}:`, error.message);
      errors[contentType] = error.message;
      results[contentType] = contentType === "course" ? null : [];
    }
  }

  const processingTime = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;

  return {
    results,
    errors,
    processingTime,
    generationContext,
  };
};

// Generate content by specific type with context
const generateContentByType = async (
  allExtractedText,
  userQuery,
  contentType,
  categories,
  context,
  useHierarchy
) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  let prompt = "";

  switch (contentType) {
    case "course":
      prompt = getCoursePrompt(allExtractedText, userQuery, categories);
      break;
    case "session":
      prompt = getSessionPrompt(
        allExtractedText,
        userQuery,
        useHierarchy && context.course ? [context.course] : []
      );
      break;
    case "module":
      // Only pass sessions context for modules
      prompt = getModulePrompt(
        allExtractedText,
        userQuery,
        useHierarchy ? { sessions: context.sessions || [] } : {}
      );
      break;
    case "topic":
      return await generateTopicsForAllModules(
        allExtractedText,
        userQuery,
        useHierarchy ? context.modules || [] : []
      );
    case "assignment":
      prompt = getAssignmentPrompt(
        allExtractedText,
        userQuery,
        useHierarchy ? context : {}
      );
      break;
    case "quiz":
      prompt = getQuizPrompt(
        allExtractedText,
        userQuery,
        useHierarchy ? context : {}
      );
      break;
    default:
      throw new Error(`Unsupported content type: ${contentType}`);
  }

  try {
    const result = await model.generateContent(prompt);

    const response = result.response;
    const text = response.text();

    // Clean the response to extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`No valid JSON found in AI response for ${contentType}`);
    }

    const parsedContent = JSON.parse(jsonMatch[0]);

    // For course type, handle single course object
    if (contentType === "course") {
      // Extract single course from the response
      let extractedContent = null;

      if (parsedContent.course) {
        extractedContent = parsedContent.course;
      } else if (
        parsedContent.courses &&
        Array.isArray(parsedContent.courses)
      ) {
        // Take only the first course if multiple are returned
        extractedContent = parsedContent.courses[0];
      } else {
        // Try alternative approaches for course
        extractedContent = findCourseAlternatively(parsedContent);
      }

      if (!extractedContent) {
        throw new Error("No valid course found in AI response");
      }

      return extractedContent; // Return single course object, not array
    }

    // For other content types, extract array as before
    const aiResponseKey = getAIResponseKey(contentType);
    const extractedContent = parsedContent[aiResponseKey];

    // Debug logging to identify key mismatches
    if (!extractedContent) {
      // Try to find the content with alternative approaches
      const alternativeContent = findContentAlternatively(
        parsedContent,
        contentType
      );
      if (alternativeContent) {
        return alternativeContent;
      }
    }

    return extractedContent || [];
  } catch (error) {
    console.error(`AI generation error for ${contentType}:`, error);
    throw new Error(
      `AI generation failed for ${contentType}: ${error.message}`
    );
  }
};

const processAudioByTopic = async (topics) => {
  const processedTopics = [];

  for (const topic of topics) {
    const processedTopic = { ...topic };

    try {
      // Process different content types
      switch (topic.content_type) {
        case "audio":
          // Audio topic type - always needs audio generation
          if (topic.audio && topic.audio.audio_script) {
            const audioResult = await generateAudioFile(
              topic.audio.audio_script
            );
            const audioBuffer = await fs.readFile(audioResult.fullPath);
            const base64Audio = audioBuffer.toString("base64");

            processedTopic.audio.audio_file = {
              name: audioResult.fileName,
              type: "audio/mpeg",
              data: base64Audio,
            };
          }
          break;

        case "accordian":
          // Accordion topic type - check each accordion for audio requirements
          if (topic.accordions && Array.isArray(topic.accordions)) {
            for (let i = 0; i < topic.accordions.length; i++) {
              const accordion = topic.accordions[i];
              if (
                accordion.accordianCompletionType === "audio" &&
                accordion.audio_script
              ) {
                const audioResult = await generateAudioFile(
                  accordion.audio_script
                );
                const audioBuffer = await fs.readFile(audioResult.fullPath);
                const base64Audio = audioBuffer.toString("base64");

                processedTopic.accordions[i].audio_file = {
                  name: audioResult.fileName,
                  type: "audio/mpeg",
                  data: base64Audio,
                };
              }
            }
          }
          break;

        case "general":
          // General topic type - check if completion_type is audio
          if (
            topic.general_material &&
            topic.general_material.completion_type === "audio" &&
            topic.general_material.audio_script
          ) {
            const audioResult = await generateAudioFile(
              topic.general_material.audio_script
            );
            const audioBuffer = await fs.readFile(audioResult.fullPath);
            const base64Audio = audioBuffer.toString("base64");

            processedTopic.general_material.audio_file = {
              name: audioResult.fileName,
              type: "audio/mpeg",
              data: base64Audio,
            };
          }
          break;

        case "slide":
          // Slide topic type - check each slide for audio requirements
          if (topic.multi_slides && Array.isArray(topic.multi_slides)) {
            for (let i = 0; i < topic.multi_slides.length; i++) {
              const slide = topic.multi_slides[i];

              // Check if slide itself has audio completion type and audio_script
              if (slide.slideCompletionType === "audio" && slide.audio_script) {
                const audioResult = await generateAudioFile(slide.audio_script);
                const audioBuffer = await fs.readFile(audioResult.fullPath);
                const base64Audio = audioBuffer.toString("base64");

                processedTopic.multi_slides[i].slide_audio_file = {
                  name: audioResult.fileName,
                  type: "audio/mpeg",
                  data: base64Audio,
                };
              }

              // Check slide content types for additional audio requirements
              if (slide.content_type === "audio") {
                // Audio slide content
                if (slide.audio && slide.audio.audio_script) {
                  const audioResult = await generateAudioFile(
                    slide.audio.audio_script
                  );
                  const audioBuffer = await fs.readFile(audioResult.fullPath);
                  const base64Audio = audioBuffer.toString("base64");

                  processedTopic.multi_slides[i].audio.audio_file = {
                    name: audioResult.fileName,
                    type: "audio/mpeg",
                    data: base64Audio,
                  };
                }
              }
            }
          }
          break;

        case "video":
          // Video topic type - no audio generation needed
          break;

        default:
          break;
      }
    } catch (error) {
      console.error(`Failed to process audio for topic ${topic.title}:`, error);
      processedTopic.audio_error = `Failed to process audio: ${error.message}`;
    }

    processedTopics.push(processedTopic);
  }

  return processedTopics;
};

const generateTopicsForAllModules = async (
  allExtractedText,
  userQuery,
  modules
) => {
  const allTopics = [];
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Helper function to clean JSON string
  const cleanJsonString = (jsonStr) => {
    try {
      // Remove any non-printable characters
      return jsonStr.replace(/[\x00-\x1F\x7F]/g, "");
    } catch (error) {
      return jsonStr;
    }
  };


  for (let i = 0; i < modules.length; i++) {
    const module = modules[i];
    try {
      const prompt = getTopicPrompt(
        allExtractedText,
        userQuery,
        module,
        i + 1,
        modules.length
      );
      const result = await model.generateContent(prompt);

      const response = result.response;
      const text = response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        console.error(`No valid JSON found for module ${module.id}`);
        continue;
      }

      // Clean the JSON string before parsing
      const cleanedJson = cleanJsonString(jsonMatch[0]);

      let parsedContent;
      try {
        parsedContent = JSON.parse(cleanedJson);
      } catch (parseError) {
        console.error(
          `JSON parse error for module ${module.id}:`,
          parseError.message
        );
        console.error(
          `Problematic JSON:`,
          cleanedJson.substring(0, 500) + "..."
        );
        continue;
      }

      const moduleTopics = parsedContent.topics || [];
      const adjustedTopics = moduleTopics.map((topic, index) => ({
        ...topic,
        id: `${allTopics.length + index + 1}`,
        module_id: module.id,
      }));

      // Process audio for the current module's topics
      try {
        const processedTopics = await processAudioByTopic(adjustedTopics);
        allTopics.push(...processedTopics);
      } catch (audioError) {
        console.error(
          `❌ Error processing audio for module ${module.id}:`,
          audioError.message
        );
        // Still add topics even if audio processing fails
        allTopics.push(...adjustedTopics);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(
        `❌ Error generating topics for module ${module.id}:`,
        error.message
      );
    }
  }

  return allTopics;
};

// New function to find course content using alternative approaches
const findCourseAlternatively = (parsedContent) => {
  // Try different possible key variations for course
  const possibleKeys = ["course", "courses", "Course", "COURSE"];

  for (const key of possibleKeys) {
    if (parsedContent[key]) {
      const content = parsedContent[key];
      // If it's an array, take the first item
      return Array.isArray(content) ? content[0] : content;
    }
  }

  // Check if there's a nested structure
  const allKeys = Object.keys(parsedContent);
  for (const key of allKeys) {
    const value = parsedContent[key];
    if (typeof value === "object" && value !== null) {
      if (value.course) {
        return Array.isArray(value.course) ? value.course[0] : value.course;
      }
      if (value.courses) {
        return Array.isArray(value.courses) ? value.courses[0] : value.courses;
      }
    }
  }

  // Last resort: if there's only one object in the response, use it
  const objects = allKeys.filter(
    (key) =>
      typeof parsedContent[key] === "object" &&
      parsedContent[key] !== null &&
      !Array.isArray(parsedContent[key])
  );

  if (objects.length === 1) {
    return parsedContent[objects[0]];
  }

  return null;
};

// Get the correct key for context storage
const getContextKey = (contentType) => {
  const keyMap = {
    course: "course", // Single course, not plural
    session: "sessions",
    module: "modules",
    topic: "topics",
    assignment: "assignments",
    quiz: "quizzes",
  };
  return keyMap[contentType] || `${contentType}s`;
};

// Find content using alternative approaches when key mismatch occurs
const findContentAlternatively = (parsedContent, contentType) => {
  // Try different possible key variations
  const possibleKeys = [
    contentType, // singular: "course"
    `${contentType}s`, // plural: "courses"
    contentType.toLowerCase(), // lowercase: "course"
    `${contentType.toLowerCase()}s`, // lowercase plural: "courses"
    contentType.toUpperCase(), // uppercase: "COURSE"
    `${contentType.toUpperCase()}S`, // uppercase plural: "COURSES"
  ];

  for (const key of possibleKeys) {
    if (parsedContent[key]) {
      return parsedContent[key];
    }
  }

  // If still not found, check if there's a nested structure
  const allKeys = Object.keys(parsedContent);
  for (const key of allKeys) {
    const value = parsedContent[key];
    if (typeof value === "object" && value !== null) {
      // Check if it's a nested object with our target array
      if (value[contentType]) {
        return value[contentType];
      }
      if (value[`${contentType}s`]) {
        return value[`${contentType}s`];
      }
    }
  }

  // Last resort: if there's only one array in the response, use it
  const arrays = allKeys.filter((key) => Array.isArray(parsedContent[key]));
  if (arrays.length === 1) {
    return parsedContent[arrays[0]];
  }

  return null;
};

const getAIResponseKey = (contentType) => {
  const keyMap = {
    course: "course", // Expect single course object
    session: "sessions",
    module: "modules",
    topic: "topics",
    assignment: "assignments",
    quiz: "quizzes",
  };
  return keyMap[contentType] || `${contentType}s`;
};

// Extract text from PDF
const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
};

// Function to get all categories
const getAllCategories = async () => {
  try {
    const { success, data, error } = await callProcedure(
      "getAllCourseCategories"
    );
    return data || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

// FIXED: Enhanced Course-specific prompt - ensures SINGLE course generation
const getCoursePrompt = (allExtractedText, userQuery, categories) => {
  const categoryOptions = categories
    .map((cat) => `${cat.id}: ${cat.name}`)
    .join(", ");

  return `
You are an expert course designer and educational content strategist. Based on the provided PDF content and user query, create EXACTLY ONE comprehensive, market-ready course that maximizes learning value and commercial appeal.

EXTRACTED CONTENT:
${allExtractedText}

User Query: ${userQuery}

Available Categories: ${categoryOptions}

⚠️ CRITICAL: Generate EXACTLY ONE course only. Do not create multiple courses.
⚠️ CRITICAL: Your response must be a valid JSON object with "course" as the root key (singular, not plural).

Please generate a single course in the following JSON format:

{
  "course": {
    "id": "1",
    "title": "Compelling Course Title That Captures Main Value Proposition",
    "description": "Detailed 3-4 sentence description explaining the course's unique value, target audience, and transformation students will experience. Focus on outcomes and practical benefits.",
    "category_id": "1",
    "thumbnail": "/course/thumbnail/default.jpg",
    "preview_video": "/course/preview_video/default.mp4",
    "price": "149.99",
    "discount": "25",
    "duration_minutes": "250",
    "expiry_days": "365",
    "status": "draft",
    "what_you_will_learn": [
      "Specific, measurable learning outcome directly from PDF content",
      "Practical skill that students can immediately apply",
      "Advanced technique or concept mastery",
      "Industry-standard methodology or framework",
      "Problem-solving capability in real scenarios",
      "Professional competency development"
    ],
    "prerequisites": [
      "Essential background knowledge or experience",
      "Recommended skills or familiarity",
      "Basic tools or software access if needed"
    ],
    "hashtags": [
      "primary-topic-keyword",
      "skill-development",
      "industry-relevant",
      "certification-ready",
      "practical-learning",
      "pdf-main-theme"
    ],
    "max_access_minutes": "240",
    "min_access_minutes": "20",
    "image_generation_prompt": "Professional course thumbnail prompt for AI image generation based on course content"
  }
}

COURSE CREATION INSTRUCTIONS:
1. SINGLE COURSE ONLY: Create exactly one course, not multiple courses
2. CONTENT ANALYSIS: Thoroughly analyze the PDF to identify the most valuable and teachable concepts
3. USER INTENT: Align the course directly with what the user is seeking based on their query
4. MARKET POSITIONING: Create a course that stands out in the chosen category with unique value
5. PRICING STRATEGY: Set competitive pricing with attractive discount (20-30% range)
6. LEARNING OUTCOMES: Focus on 5-6 specific, actionable outcomes that students can achieve
7. DIFFICULTY MATCHING: Choose appropriate difficulty level based on PDF complexity and user query
8. PRACTICAL FOCUS: Emphasize hands-on learning and real-world application
9. COURSE STRUCTURE: Ensure duration_minutes reflects realistic time needed for mastery
10. ACCESSIBILITY: Set reasonable access hours considering different learning schedules
11. DISCOVERABILITY: Create hashtags that improve course findability and SEO
12. COMPLETENESS: Ensure all fields are filled with meaningful, relevant content
13. VALIDATION: Double-check that category_id exists in the provided categories list

IMAGE GENERATION PROMPT REQUIREMENTS:
14. THUMBNAIL DESIGN: Create a detailed, comprehensive prompt for generating an attractive, professional course thumbnail
15. CONTENT-BASED VISUAL ELEMENTS: The image_generation_prompt must include:
    - Specific visual representation of the main course topic/subject from PDF content
    - Industry-specific imagery that reflects the course domain
    - Professional, modern design aesthetic appropriate for the target audience
    - Strategic color palette that conveys the course's energy and professionalism
    - Clear visual hierarchy with designated space for title and branding elements
    - Technical aspect ratio specification: 16:9 for optimal thumbnail compatibility
    - High-resolution, premium quality visual standards
    - Relevant symbolic elements, icons, or graphics that reinforce learning objectives
    - Clean, educational design philosophy that builds trust and credibility
    - Demographic-appropriate visual appeal for the intended student base
    - Category-specific imagery that aligns with course classification
    - Visual storytelling elements that hint at the transformation students will experience
    - Composition balance between informative and aesthetically pleasing elements

16. ADVANCED PROMPT STRUCTURE: Structure the image_generation_prompt with these components:
    - PRIMARY SUBJECT: Main visual focus derived from PDF content analysis
    - DESIGN STYLE: Specific aesthetic direction (modern, minimalist, dynamic, corporate, creative, etc.)
    - COLOR PSYCHOLOGY: Strategic color choices that support learning and engagement
    - SYMBOLIC ELEMENTS: Industry-relevant icons, tools, or metaphorical representations
    - COMPOSITION LAYOUT: Visual arrangement that supports text overlay and branding
    - QUALITY SPECIFICATIONS: Technical requirements for professional output
    - AUDIENCE TARGETING: Visual elements that resonate with the intended learners
    - EMOTIONAL TONE: Visual mood that matches the course's value proposition

17. PROMPT OPTIMIZATION EXAMPLES:
    For Technical Courses: "Create a professional 16:9 course thumbnail featuring [specific technology/tool from PDF]. Use a modern tech aesthetic with blue and white gradients. Include clean geometric patterns, relevant software interface elements, and space for course title overlay. The design should appeal to professionals and convey expertise, innovation, and practical learning. High-quality 3D elements, subtle shadows, and contemporary typography styling."
    
    For Business Courses: "Design a sophisticated 16:9 business course thumbnail showcasing [specific business concept from PDF]. Employ a corporate color palette of navy blue, gold accents, and clean whites. Include professional imagery like charts, growth arrows, handshake silhouettes, or office environments. The composition should exude success, professionalism, and strategic thinking with premium visual quality and executive appeal."
    
    For Creative Courses: "Generate a vibrant 16:9 creative course thumbnail highlighting [specific creative skill from PDF]. Use an inspiring color palette with artistic gradients and dynamic compositions. Include relevant creative tools, artistic elements, or process visualizations. The design should spark creativity, showcase artistic potential, and appeal to creative professionals with contemporary, trend-forward visual styling."

18. CONTENT INTEGRATION: Ensure the image_generation_prompt directly reflects:
    - Key concepts identified in the PDF content analysis
    - Primary learning outcomes specified in what_you_will_learn
    - Target audience characteristics implied by prerequisites
    - Industry context derived from the extracted content
    - Skill level appropriate visual complexity
    - Course category visual conventions

CRITICAL OUTPUT REQUIREMENTS:
- Return ONLY valid JSON without any additional text, explanations, or formatting
- The JSON must start with { "course": { and end with } }
- Do NOT use "courses" (plural) - use "course" (singular)
- Generate EXACTLY ONE course, not an array of courses
- The response must be immediately parseable as JSON
- The image_generation_prompt must be a detailed, comprehensive paragraph (minimum 50 words)
- Ensure the image prompt creates visually compelling, professional thumbnails that accurately represent course value
- The image_generation_prompt should be specific enough to generate consistent, high-quality results
- Include technical specifications (16:9 aspect ratio, high quality, professional standards)
- Integrate course-specific visual elements that differentiate it from generic educational imagery
`;
};

// Enhanced Session-specific prompt with context
const getSessionPrompt = (allExtractedText, userQuery, courseContext = []) => {
  const contextInfo =
    courseContext.length > 0
      ? `\n\nCourse Context:\n${JSON.stringify(
        courseContext.slice(0, 2),
        null,
        2
      )}`
      : "";

  return `You are an expert curriculum designer with deep content analysis capabilities. Analyze the provided content and user query to determine the OPTIMAL number of sessions based on content depth, complexity, and natural learning progression.

EXTRACTED CONTENT:
${allExtractedText}

User Query: ${userQuery}
${contextInfo}

⚠️ CRITICAL REQUIREMENTS:
- ANALYZE content depth and determine natural session boundaries
- CREATE between 2-8 sessions based on content richness and complexity
- PRIORITIZE user query requirements - if user asks for specific topics, those get dedicated sessions
- ENSURE each session covers substantial, cohesive learning materials
- NO artificial limits - let content complexity guide session count

INTELLIGENT SESSION ANALYSIS:
1. CONTENT DEPTH ASSESSMENT: 
   - Scan entire PDF for major themes, concepts, and natural divisions
   - Identify content that requires foundational understanding vs advanced application
   - Recognize topics that need dedicated focus vs supporting concepts

2. USER QUERY PRIORITY ANALYSIS:
   - If user mentions specific topics/skills, create dedicated sessions for those
   - Weight user-requested content higher in session allocation
   - Ensure user's learning goals drive session structure

3. NATURAL LEARNING PROGRESSION:
   - Group related concepts that build upon each other
   - Separate foundational concepts from advanced applications
   - Create logical flow from basic understanding to practical mastery

4. COMPLEXITY-BASED STRUCTURING:
   - Simple concepts can be grouped together in single sessions
   - Complex topics that require deep understanding get individual sessions
   - Practical application topics get separate sessions from theory

5. CONTENT VOLUME ANALYSIS:
   - Rich, detailed sections warrant individual sessions
   - Brief supporting topics can be combined logically
   - Balance session length for optimal learning (45-90 minutes each)

DECISION FRAMEWORK:
- 2-3 Sessions: Simple, focused content with clear linear progression
- 4-5 Sessions: Moderate complexity with distinct topic areas
- 6-8 Sessions: Complex, comprehensive content with multiple major themes

Generate in JSON format:
{
  "sessions": [
    {
      "id": "1",
      "course_id": "1",
      "title": "Session title reflecting major content theme",
      "chapter_description": "Comprehensive description explaining why this session is necessary, what major concepts it covers, and how it fits in the learning progression. Should reflect content analysis and user query priorities.",
      "status": "active",
      "min_time_in_minute": [realistic time based on content depth]
    }
  ]
}

ENHANCED REQUIREMENTS:
1. Let content complexity determine session count (2-8 sessions)
2. Prioritize user query topics with dedicated sessions when warranted
3. Create sessions around natural content boundaries and themes
4. Ensure each session has substantial, cohesive content (not artificially split)
5. Progressive difficulty and logical learning flow
6. Session titles should reflect major themes from content analysis
7. Chapter descriptions (200-300 words) should justify why this session exists
8. Time estimates should reflect actual content depth (45-90 minutes realistic range)
9. If user query emphasizes specific areas, those areas get priority in session allocation
10. Return ONLY valid JSON without additional text

CONTENT ANALYSIS INSTRUCTIONS:
- Identify 3-5 major themes/concepts in the PDF
- Determine which themes are foundational vs advanced
- Recognize which topics the user specifically wants to learn
- Group related concepts that naturally belong together
- Separate theory from practical application where appropriate
- Consider prerequisite relationships between concepts`;
};

// Enhanced Module-specific prompt with context
const getModulePrompt = (allExtractedText, userQuery, context = {}) => {
  const contextInfo =
    context.sessions && context.sessions.length > 0
      ? `\n\nSessions Context:\n${JSON.stringify(context.sessions, null, 2)}`
      : "";

  return `You are an expert curriculum designer with advanced content analysis capabilities. For each session, determine the OPTIMAL number of modules based on content depth, learning objectives, and natural knowledge divisions.

EXTRACTED CONTENT:
${allExtractedText}

User Query: ${userQuery}
${contextInfo}

⚠️ CRITICAL REQUIREMENTS:
- ANALYZE each session's content depth to determine optimal module count
- CREATE 1-6 modules per session based on content richness and complexity
- PRIORITIZE user query elements - topics user specifically wants get dedicated modules
- ENSURE modules within each session have logical flow and natural boundaries
- NO artificial limits - let content analysis guide module structure

INTELLIGENT MODULE ANALYSIS PER SESSION:

1. CONTENT DEPTH EVALUATION:
   - Analyze how much substantial content exists for each session theme
   - Identify sub-topics that warrant individual modules vs combined coverage
   - Recognize concepts that need step-by-step progression

2. USER QUERY ALIGNMENT:
   - If user emphasizes specific skills/topics within a session, create dedicated modules
   - Ensure user's priority areas get appropriate module allocation
   - Balance user requests with natural content flow

3. LEARNING OBJECTIVE BREAKDOWN:
   - Simple session objectives → 1-2 modules
   - Moderate complexity → 2-4 modules  
   - Complex, multi-faceted sessions → 4-6 modules

4. NATURAL KNOWLEDGE DIVISIONS:
   - Theory vs Practice (separate modules when both are substantial)
   - Basic concepts vs Advanced applications
   - Different tools/techniques within the same domain
   - Sequential processes that build upon each other

5. COGNITIVE LOAD MANAGEMENT:
   - Don't overload single modules with too many concepts
   - Create focused modules that students can master completely
   - Balance module length for optimal learning (1-4 hours each)

MODULE ALLOCATION STRATEGY:
- 1 Module: Simple, focused session with single clear objective
- 2-3 Modules: Standard complexity with distinct learning phases
- 4-6 Modules: Complex sessions with multiple major concepts or extensive practical work

Generate in JSON format:
{
  "modules": [
    {
      "id": 1,
      "course_id": 1,
      "session_id": 1,
      "title": "Module title reflecting specific learning focus within session",
      "description": "Detailed description explaining this module's specific role, why it's needed as separate module, key concepts covered, and learning outcomes. Should reflect content analysis.",
      "duration_minutes": [realistic minutes based on content depth: 60-240 hours],
      "status": "active"
    }
  ]
}

ENHANCED REQUIREMENTS:
1. Analyze each session individually to determine optimal module count (1-6 per session)
2. Create modules around natural learning boundaries within each session
3. Prioritize user query topics with dedicated modules when content warrants it
4. Ensure logical progression within each session's modules
5. Module titles should be specific and reflect focused learning objectives
6. Descriptions (150-250 words) should justify why this module exists separately
7. Duration should reflect actual content depth and learning time needed
8. Balance theoretical understanding with practical application across modules
9. If session has limited content, fewer modules; if rich content, more modules
10. Return ONLY valid JSON without additional text

CONTENT ANALYSIS PER SESSION:
- Map session content to identify natural sub-divisions
- Determine which concepts need dedicated focus vs combined treatment
- Consider user query priorities within each session's scope
- Evaluate prerequisite relationships between concepts within sessions
- Balance module workload for optimal learning experience`;
};

const getTopicPrompt = (
  allExtractedText,
  userQuery,
  module,
  moduleNumber,
  totalModules
) => {
  return `You are an expert curriculum designer with advanced content analysis capabilities. Analyze the provided content and determine the OPTIMAL number of topics for this specific module based on content depth, learning objectives, and user priorities.

EXTRACTED CONTENT:
${allExtractedText}

User Query: ${userQuery}

TARGET MODULE (${moduleNumber}/${totalModules}):
${JSON.stringify(module, null, 2)}

⚠️ CRITICAL REQUIREMENTS:
- ANALYZE module content depth to determine optimal topic count
- CREATE 1-8 topics per module based on content richness and complexity
- PRIORITIZE user query elements - if user specifically wants certain topics, ensure they're covered
- ENSURE topics have logical flow and natural learning progression
- NO artificial limits - let content analysis and module objectives guide topic count

INTELLIGENT TOPIC ANALYSIS FOR THIS MODULE:

1. MODULE CONTENT DEPTH ASSESSMENT:
   - Analyze how much substantial content exists for this module's theme
   - Identify concepts that need individual topic focus vs combined coverage
   - Evaluate complexity level of module content

2. USER QUERY PRIORITY MAPPING:
   - If user emphasizes specific skills/concepts relevant to this module, create dedicated topics
   - Ensure user's priority areas within this module get appropriate topic coverage
   - Balance user requests with natural learning progression

3. LEARNING OBJECTIVE BREAKDOWN:
   - Simple module objectives → 1-3 topics
   - Moderate complexity → 3-5 topics
   - Complex, comprehensive modules → 5-8 topics

4. CONTENT TYPE OPTIMIZATION:
   - Rich theoretical content → More topics with varied content types
   - Practical/hands-on modules → Fewer topics but more interactive content
   - Mixed theory/practice → Balanced topic distribution

5. NATURAL LEARNING DIVISIONS:
   - Separate introduction/overview from deep-dive content
   - Individual topics for distinct concepts, tools, or techniques
   - Separate topics for theory vs practical application when both are substantial
   - Progressive skill-building topics

TOPIC ALLOCATION STRATEGY:
- 1-2 Topics: Focused, simple modules with single clear learning path
- 3-4 Topics: Standard complexity with distinct learning phases
- 5-6 Topics: Rich content modules with multiple concepts
- 7-8 Topics: Comprehensive, complex modules requiring extensive coverage

CONTENT TYPE SELECTION INTELLIGENCE:
- VIDEO: For demonstrations, complex explanations, visual concepts
- ACCORDION: For step-by-step processes, FAQ-style content, comparative concepts
- SLIDES: For structured presentations, sequential learning, overview content
- AUDIO: For discussions, interviews, narrative content, accessibility
- GENERAL: For reference materials, downloadable resources, comprehensive guides

Generate comprehensive topics in the following JSON structure:
{
  "topics": [
    {
      "id": "1",
      "module_id": "1",
      "title": "Topic Title - Video",
      "description": "Comprehensive topic description",
      "content_type": "video",
      "status": "active",
      "video": {
        "id": "1",
        "topic_id": "1",
        "url": "/video/default.mp4",
        "video_type": "internal",
        "duration_minutes": 15
      }
    },
    {
      "id": "2",
      "module_id": "1",
      "title": "Topic Title - Accordion",
      "description": "Interactive accordion content",
      "content_type": "accordian",
      "status": "active",
      "accordions": [
        {
          "id": "1",
          "topic_id": "2",
          "title": "Key Concept 1",
          "body": "Detailed explanation based on PDF content",
          "codeLanguage": "javascript",
          "code": "// useEffect - for async side effects\nuseEffect(() => {\n  // API calls, subscriptions, timers\n  fetchUserData();\n}, [userId]);\n\n// useLayoutEffect - for DOM measurements\nuseLayoutEffect(() => {\n  const rect = elementRef.current.getBoundingClientRect();\n  setPosition({ x: rect.left, y: rect.top });\n}, []);",
          "audioUrl": "/audios/accordion/default.mp3",
          "audio_script": "Welcome to understanding React hooks! Let's explore useEffect and useLayoutEffect. UseEffect is perfect for handling asynchronous side effects like API calls, subscriptions, and timers. Notice how we include userId in the dependency array - this ensures our effect runs whenever userId changes. UseLayoutEffect, on the other hand, is synchronous and runs before the browser paints. It's ideal for DOM measurements and updates that need to happen immediately. The key difference? UseEffect is asynchronous and won't block painting, while useLayoutEffect is synchronous and will. Choose useEffect for most scenarios, and useLayoutEffect only when you need immediate DOM updates.",
          "accordianCompletionType": "audio",
          "audio_file": {
            "name": "default.mp3",
            "type": "audio/mpeg",
            "data": "base64-encoded audio data" 
          },
          "accordianCompletionTime": null
        },
        {
          "id": "2",
          "topic_id": "2",
          "title": "Key Concept 2",
          "body": "Detailed explanation based on PDF content",
          "codeLanguage": "javascript",
          "code": "// ❌ Wrong - missing dependency\nuseEffect(() => {\n  fetchData(userId);\n}, []); // userId missing from deps\n\n// ✅ Correct - all dependencies included\nuseEffect(() => {\n  fetchData(userId);\n}, [userId]);\n\n// ✅ For objects/functions\nconst fetchData = useCallback(() => {\n  // fetch logic\n}, []);\n\nuseEffect(() => {\n  fetchData();\n}, [fetchData]);",
          "audioUrl": null,
          "audio_script": null,
          "audio_file": null,
          "accordianCompletionType": "timer",
          "accordianCompletionTime": 120
        }
      ]
    },
    {
      "id": "3",
      "module_id": "1",
      "title": "Topic Title - PDF",
      "description": "Detailed explanation based on PDF content",
      "content_type": "general",
      "status": "active",
      "general_material": {
        "id": "1",
        "topic_id": "3",
        "url": "/general/pdf/documents/react-testing-guide.pdf",
        "title": "Complete React Testing Strategy Guide",
        "description": "A comprehensive testing guide covering unit tests, integration tests, and end-to-end testing strategies for React applications with practical examples and best practices.",
        "material_type": "pdf",
        "codeLanguage": "javascript",
        "code": "function greet() { console.log('Hello!'); }",
        "audio_url": "/audios/pdf/default.mp3",
        "audio_script": "Let's dive into React testing strategies! Testing is crucial for maintaining reliable applications. This guide covers three essential testing levels: unit tests for individual components, integration tests for component interactions, and end-to-end tests for complete user workflows. We'll explore popular tools like Jest for unit testing, React Testing Library for component testing, and Cypress for end-to-end testing. Remember, good tests should be reliable, fast, and maintainable. Start with unit tests for your core logic, add integration tests for critical user paths, and use end-to-end tests sparingly for your most important workflows.",
        "completion_type": "audio",
        "audio_file": {
            "name": "default.mp3",
            "type": "audio/mpeg",
            "data": "base64-encoded audio data" 
        },
        "completion_time": null
      }
    },
    {
      "id": "4",
      "module_id": "1",
      "title": "Topic Title - Quiz",
      "description": "Detailed explanation based on PDF content",
      "content_type": "audio",
      "status": "active",
      "audio": {
        "id": "1",
        "topic_id": "4",
        "url": "/audio/quiz.mp3",
        "audio_script": "Welcome to our React concepts quiz! This interactive session will test your understanding of the key concepts we've covered. You'll hear questions about hooks, testing strategies, and best practices. Take your time to think through each question. Remember, this isn't just about getting the right answer - it's about reinforcing your learning and identifying areas where you might need more practice. Let's begin with our first question about useEffect dependencies...",
        "audio_file": {
            "name": "default.mp3",
            "type": "audio/mpeg",
            "data": "base64-encoded audio data" 
        },
        "duration_minutes": 10
      }
    },
    {
      "id": "5",
      "module_id": "1",
      "title": "Topic Title - Slide",
      "description": "Detailed explanation based on PDF content",
      "content_type": "slide",
      "status": "active",
      "multi_slides": [
        {
          "id": "1",
          "topic_id": "5",
          "title": "Slide Title",
          "description": "Detailed explanation based on PDF content",
          "content_type": "general",
          "slideCompletionType": "timer",
          "slideCompletionTime": 60,
          "audio_file": null,
          "audio_url": null,
          "audio_script": null,
          "url": "/multislide/general/slide1.pdf", // require only if materialType is not link
          "externalLink": "https://chatgpt.com/", // require only if materialType is link
          "materialType": "pdf",
          "codeLanguage": "javascript",
          "code": "function greet() { console.log('Hello!'); }"
        },
        {
          "id": "2",
          "topic_id": "5",
          "title": "Slide Title 2",
          "description": "Detailed explanation based on PDF content",
          "content_type": "video",
          "slideCompletionType": "audio",
          "audio_file": {
            "name": "default.mp3",
            "type": "audio/mpeg",
            "data": "base64-encoded audio data" 
          },
          "slideCompletionTime": null,
          "audio_url": "/audios/multi_slide/default.mp3",
          "audio_script": "This slide demonstrates practical implementation. Watch how the concepts we've discussed come together in real code. Notice the clean structure and best practices being applied. Pay attention to the error handling and the way dependencies are managed.",
          "videoUrl": "/multiSlide/video/slide2.mp4",
          "videoType": "internal",
          "videoDuration": 5
        },
        {
          "id": "3",
          "topic_id": "5",
          "title": "Slide Title 3",
          "description": "Detailed explanation based on PDF content",
          "content_type": "audio",
          "slideCompletionType": "timer",
          "audio_file": null,
          "slideCompletionTime": 30,
          "audio_url": null,
          "audio_script": null,
          "audioUrl": "/multiSlide/audio/slide3.mp3",
          "audio_script": "Here's a quick recap of what we've learned. These concepts form the foundation of modern React development. Practice implementing these patterns in your own projects.",
          "audioDuration": 3
        },
        {
          "id": "4",
          "topic_id": "5",
          "title": "Slide Title 4",
          "description": "Detailed explanation based on PDF content",
          "content_type": "accordion",
          "slideCompletionType": "audio",
          "audio_file": {
            "name": "default.mp3",
            "type": "audio/mpeg",
            "data": "base64-encoded audio data" 
          },
          "slideCompletionTime": null,
          "audio_url": "/audios/multi_slide/default.mp3",
          "audio_script": "Let's explore these concepts in more detail through our interactive sections. Each section builds upon the previous one, so take your time to understand each concept fully.",
          "accordianSections": [
            {
              "id": "1",
              "multi_slide_id": "4",
              "title": "Accordion Title 1",
              "body": "Detailed explanation based on PDF content",
              "codeLanguage": "javascript",
              "code": "function greet() { console.log('Hello!'); }"
            },
            {
              "id": "2",
              "multi_slide_id": "4",
              "title": "Accordion Title 2",
              "body": "Detailed explanation based on PDF content",
              "codeLanguage": "javascript",
              "code": "function greet() { console.log('Hello!'); }"
            }
          ]
        },
        {
          "id": "5",
          "topic_id": "5",
          "title": "Slide Title 5",
          "description": "Detailed explanation based on PDF content",
          "content_type": "general",
          "slideCompletionType": "audio",
          "audio_file": {
            "name": "default.mp3",
            "type": "audio/mpeg",
            "data": "base64-encoded audio data" 
          },
          "slideCompletionTime": null,
          "audio_url": "/audios/multi_slide/default.mp3",
          "audio_script": "For additional resources and deeper exploration, check out this external link. It provides comprehensive examples and advanced techniques that complement what we've covered here.",
          "general_material": {
            "id": "2",
            "multi_slide_id": "5",
            "externalLink": "https://example.com",
            "materialType": "link",
            "codeLanguage": "javascript",
            "code": "function greet() { console.log('Hello!'); }"
          }
        }
      ]
    }
  ]
}

ENHANCED REQUIREMENTS:
1. Analyze this specific module to determine optimal topic count (1-8 topics)
2. Create topics around natural learning boundaries within the module
3. Prioritize user query elements relevant to this module
4. Ensure logical progression and appropriate content type variety
5. Topic titles should reflect specific learning objectives
6. Descriptions should justify why each topic is necessary
7. Choose content types that best serve the learning objectives
8. Include comprehensive audio scripts for all audio elements
9. Balance different interaction types for engagement
10. If module has focused content → fewer topics; if comprehensive → more topics
11. Return ONLY valid JSON without additional text

CONTENT ANALYSIS FOR THIS MODULE:
- Map module objectives to identify natural topic divisions
- Determine which concepts need individual topic focus
- Consider user query priorities within this module's scope
- Evaluate optimal content types for each concept
- Balance topic workload and variety for optimal learning

Create topics that naturally serve this module's learning objectives without artificial constraints.`;
};

// Helper function to add delay between API calls
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Enhanced Assignment-specific prompt with context
const getAssignmentPrompt = (allExtractedText, userQuery, context = {}) => {
  const contextInfo =
    Object.keys(context).length > 0
      ? `\n\nContext from previously generated content:\n${JSON.stringify(
        context,
        null,
        2
      )}`
      : "";

  return `
You are an expert assignment creator. Based on the provided PDF content and user query, create comprehensive assignment structures.

PDF Content:
${allExtractedText}

User Query: ${userQuery}
${contextInfo}

Please generate detailed assignment structures in the following JSON format:

{
  "assignments": [
    {
      "title": "Assignment Title Based on PDF Content",
      "description": "Detailed assignment description explaining what students need to do",
      "due_date": "2024-12-31T23:59:59.000Z",
      "max_score": 100,
      "status": "active",
      "category": "regular",
      "created_by_type": "admin",
      "updated_by_type": "admin",
      "regular_questions": [
        {
          "question_text": "Question based on PDF content",
          "expected_answer": "Expected answer or rubric"
        }
      ]
    },
    {
      "title": "True/False Assignment",
      "description": "Assignment with true/false questions based on PDF content",
      "due_date": "2024-12-31T23:59:59.000Z",
      "max_score": 50,
      "status": "active",
      "category": "true_false",
      "created_by_type": "admin",
      "updated_by_type": "admin",
      "true_false_questions": [
        {
          "question_text": "True/False question based on PDF content?",
          "correct_answer": true,
          "explanation": "Explanation for the answer"
        }
      ]
    }
  ]
}

Instructions:
1. Create 3-5 assignments of different categories based on PDF content
2. If context is provided, align assignments with course/session objectives
3. Generate realistic questions that test understanding of PDF material
4. Use appropriate scoring and reasonable due dates
5. Return ONLY valid JSON without additional formatting
`;
};

// Quiz-specific prompt (new addition)
const getQuizPrompt = (allExtractedText, userQuery, context = {}) => {
  const contextInfo =
    Object.keys(context).length > 0
      ? `\n\nContext from previously generated content:\n${JSON.stringify(
        context,
        null,
        2
      )}`
      : "";

  return `
Create quiz structure based on PDF content for knowledge assessment.

PDF Content:
${allExtractedText}

User Query: ${userQuery}
${contextInfo}

Generate in JSON format:

{
  "quizzes": [
    {
      "title": "Knowledge Assessment Quiz",
      "description": "Comprehensive quiz to test understanding of key concepts from the PDF material",
      "duration_minutes": 3,
      "total_marks": 100,
      "passing_marks": 70,
      "status": "active",
      "questions": [
        {
          "type": "multiple_choice",
          "question": "Question based on PDF content?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct_answer": 0,
          "explanation": "Explanation of correct answer",
          "marks": 10
        },
        {
          "type": "true_false", 
          "question": "True/False statement from PDF?",
          "correct_answer": true,
          "explanation": "Explanation",
          "marks": 5
        }
      ]
    }
  ]
}

Instructions:
1. Create 2-3 quizzes with mixed question types
2. Base all questions on PDF content and learning objectives
3. If context provided, align with course/session structure
4. Include realistic timing and scoring
5. Return ONLY valid JSON
`;
};

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------

// Course Generation For Individual Content Type

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

// Main API endpoint for content generation
const courseContentGeneraterByType = async (req, res, next) => {
  try {
    const { userQuery, contentType, details } = req.body;

    // Validate that at least one input (PDF or query) is provided
    if (!req.file && !userQuery) {
      return res.status(400).json({
        error: "Either PDF file or user query is required (or both)",
      });
    }

    if (!contentType) {
      return res.status(400).json({ error: "Content type is required" });
    }

    const validContentTypes = [
      "assignment",
      "assignment_questions",
      "quiz",
      "text-based-quiz",
      "topic",
      "session",
      "module",
      "course",
      "faq",
      "drag-drop",
      "complete-sentence",
      "real-word",
      "mcq",
      "best-option",
      "summary-passage",
      "audio-script",
      "image-script",
      "arrange-order",
      "speaking"
    ];

    if (!validContentTypes.includes(contentType)) {
      return res.status(400).json({ error: "Invalid content type" });
    }

    let pdfText = '';

    // Extract text from PDF if provided
    if (req.file) {
      pdfText = await extractTextFromPDF(req.file.path);
    }

    // Generate content structure using AI based on content type
    const generatedContent = await generateContentStructure(
      pdfText,
      userQuery || "",
      contentType,
      details ? JSON.parse(details) : null
    );

    // Process audio generation for topics if needed
    if (contentType === 'topic' && generatedContent.topics) {
      generatedContent.topics = await processTopicsAudio(generatedContent.topics);
      generatedContent.topics = await processTopicsTags(generatedContent.topics);
    } else if (contentType === 'audio-script') {
      generatedContent.audioScriptQuestions = await processAudioScriptQuestions(generatedContent.audioScriptQuestions);
    } else if (contentType === 'image-script') {
      generatedContent.imageScriptQuestions = await processImageScriptQuestions(generatedContent.imageScriptQuestions);
    } else if (contentType === 'speaking') {
      generatedContent.speakingQuestions = await processSpeakingQuestions(generatedContent.speakingQuestions);
    } else if (contentType === 'course') {
      generatedContent.courses = await processCoursesThumbnail(generatedContent.courses);
    } else if (contentType === "assignment_questions") {
      generatedContent["assignment-questions"] = await processAssignmentQuestions(generatedContent["assignment-questions"])
    }

    // Clean up uploaded file if it exists
    if (req.file) {
      fs.unlink(req.file.path);
    }

    res.json({
      success: true,
      message: `${contentType} generated successfully`,
      data: generatedContent,
      contentType: contentType,
    });
  } catch (error) {
    console.error("Error generating content:", error);

    // Clean up uploaded file in case of error
    if (req.file && req.file.path) {
      try {
        fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error("Error cleaning up file:", unlinkError);
      }
    }

    next(error);
  }
};

// Process topics to generate audio files where needed
const processTopicsAudio = async (topics) => {
  const processedTopics = [];

  for (const topic of topics) {
    const processedTopic = { ...topic };

    // Check if topic requires audio generation
    if (topic.content_type === "audio") {
      try {

        // Use the audio_script if provided, otherwise use description
        const scriptText = topic.audio_script || topic.description;
        const audioResult = await generateAudioFile(scriptText);

        // Read audio file as base64
        const audioBuffer = await fs.readFile(audioResult.fullPath);
        const base64Audio = audioBuffer.toString("base64");

        // Attach base64 string and metadata
        processedTopic.audio_file = {
          name: audioResult.fileName,
          type: "audio/mpeg",
          data: base64Audio,
        };


        // Remove the file after base64 conversion
        await fs.unlink(audioResult.fullPath);
      } catch (audioError) {
        console.error(
          `Failed to generate audio for topic ${topic.title}:`,
          audioError
        );
        processedTopic.audio_error = "Failed to generate audio";
      }
    } else if (topic.content_type === "accordian") {
      try {
        for (let i = 0; i < processedTopic.accordianSections.length; i++) {
          if (processedTopic.accordianSections[i].accordianCompletionType === 'audio') {
            const scriptText = processedTopic.accordianSections[i].audio_script;
            // Use the audio_script if provided, otherwise use description
            const audioResult = await generateAudioFile(scriptText);

            // Read audio file as base64
            const audioBuffer = await fs.readFile(audioResult.fullPath);
            const base64Audio = audioBuffer.toString("base64");

            // Attach base64 string and metadata
            processedTopic.accordianSections[i].audio_file = {
              name: audioResult.fileName,
              type: "audio/mpeg",
              data: base64Audio,
            };

            // Remove the file after base64 conversion
            await fs.unlink(audioResult.fullPath);
          }
        }
      } catch (audioError) {
        console.error(
          `Failed to generate audio for topic ${topic.title}:`,
          audioError
        );
        processedTopic.audio_error = "Failed to generate audio";
      }
    } else if (topic.content_type === "general") {
      try {
        if (topic.generalCompletionType === 'audio') {
          // Use the audio_script if provided, otherwise use description
          const scriptText = topic.generalAudioScript;
          const audioResult = await generateAudioFile(scriptText);

          // Read audio file as base64
          const audioBuffer = await fs.readFile(audioResult.fullPath);
          const base64Audio = audioBuffer.toString("base64");

          // Attach base64 string and metadata
          processedTopic.generalAudioFile = {
            name: audioResult.fileName,
            type: "audio/mpeg",
            data: base64Audio,
          };


          // Remove the file after base64 conversion
          await fs.unlink(audioResult.fullPath);
        }
      } catch (audioError) {
        console.error(
          `Failed to generate audio for topic ${topic.title}:`,
          audioError
        );
        processedTopic.audio_error = "Failed to generate audio";
      }
    } else if (topic.content_type === "slide") {
      try {
        for (let i = 0; i < processedTopic.slides.length; i++) {
          if (processedTopic.slides[i].slideCompletionType === 'audio') {
            const scriptText = processedTopic.slides[i].slideAudioScript;
            // Use the audio_script if provided, otherwise use description
            const audioResult = await generateAudioFile(scriptText);

            // Read audio file as base64
            const audioBuffer = await fs.readFile(audioResult.fullPath);
            const base64Audio = audioBuffer.toString("base64");

            // Attach base64 string and metadata
            processedTopic.slides[i].slideAudioFile = {
              name: audioResult.fileName,
              type: "audio/mpeg",
              data: base64Audio,
            };

            // Remove the file after base64 conversion
            await fs.unlink(audioResult.fullPath);
          }

          if (processedTopic.slides[i].content_type === 'audio') {
            const scriptText = processedTopic.slides[i].audio_script;
            // Use the audio_script if provided, otherwise use description
            const audioResult = await generateAudioFile(scriptText);

            // Read audio file as base64
            const audioBuffer = await fs.readFile(audioResult.fullPath);
            const base64Audio = audioBuffer.toString("base64");

            // Attach base64 string and metadata
            processedTopic.slides[i].audioFile = {
              name: audioResult.fileName,
              type: "audio/mpeg",
              data: base64Audio,
            };

            // Remove the file after base64 conversion
            await fs.unlink(audioResult.fullPath);
          }
        }
      } catch (audioError) {
        console.error(
          `Failed to generate audio for topic ${topic.title}:`,
          audioError
        );
        processedTopic.audio_error = "Failed to generate audio";
      }
    }

    processedTopics.push(processedTopic);
  }

  return processedTopics;
};

const processAudioScriptQuestions = async (audioScriptQuestions) => {
  const processedQuestions = [];

  for (const question of audioScriptQuestions) {
    try {
      const audio = await generateAudioFile(question.script); // returns { filePath, filename }
      const fullPath = path.join(__dirname, `../..${audio.filePath}`);

      const buffer = await fs.readFile(fullPath);
      const base64 = buffer.toString('base64');

      processedQuestions.push({
        ...question,
        audioFile: {
          name: audio.filename, // e.g., 'output123.mp3'
          type: 'audio/mpeg',
          data: base64,
        },
      });

      // Remove the file after base64 conversion
      await fs.unlink(fullPath);
    } catch (error) {
      console.error(error);
      processedQuestions.push({
        ...question,
        audioFile: null,
        error: 'Audio generation failed',
      });
    }
  }

  return processedQuestions;
};

const processAssignmentQuestions = async (Questions) => {
  const processedQuestions = [];

  for (const question of Questions) {
    const processedQuestion = { ...question };

    // Process each matching option in the question
    if (processedQuestion.MatchingOptions && Array.isArray(processedQuestion.MatchingOptions)) {
      for (const option of processedQuestion.MatchingOptions) {
        // Handle option_text image generation
        if (option.option_type === 'image' && option.option_text) {
          try {
            const fileName = `match_option_${Date.now()}_${Math.random()
              .toString(36)
              .substring(7)}.png`;

            const result = await generateImageWithGemini(
              option.option_text, // Using option_text as the prompt
              fileName
            );

            if (result.success) {
              option.option_image = {
                name: result.fileName,
                type: result.mimeType,
                data: result.data,
                dataUrl: result.dataUrl,
              };
              // Keep the original text as prompt reference if needed
              option.option_prompt = option.option_text;
            } else {
              option.option_image = null;
              option.option_generation_error = "Image generation failed";
            }
          } catch (error) {
            console.error("❌ Failed to generate option image:", error);
            option.option_image = null;
            option.option_generation_error = "Image generation failed";
          }
        }

        // Handle match_text image generation
        if (option.match_type === 'image' && option.match_text) {
          try {
            const fileName = `match_target_${Date.now()}_${Math.random()
              .toString(36)
              .substring(7)}.png`;

            const result = await generateImageWithGemini(
              option.match_text, // Using match_text as the prompt
              fileName
            );

            if (result.success) {
              option.match_image = {
                name: result.fileName,
                type: result.mimeType,
                data: result.data,
                dataUrl: result.dataUrl,
              };
              // Keep the original text as prompt reference if needed
              option.match_prompt = option.match_text;
            } else {
              option.match_image = null;
              option.match_generation_error = "Image generation failed";
            }
          } catch (error) {
            console.error("❌ Failed to generate match image:", error);
            option.match_image = null;
            option.match_generation_error = "Image generation failed";
          }
        }
      }
    }

    processedQuestions.push(processedQuestion);
  }

  return processedQuestions;
};

const processSpeakingQuestions = async (speakingQuestions) => {
  const processedQuestions = [];

  for (const question of speakingQuestions) {
    const processedQuestion = { ...question };

    // 🔊 Handle audio generation if audioFile + audio_script present
    if (
      processedQuestion.audioFile &&
      processedQuestion.audio_script
    ) {
      try {
        const audio = await generateAudioFile(processedQuestion.audio_script);
        const fullPath = path.join(__dirname, `../..${audio.filePath}`);

        const buffer = await fs.readFile(fullPath);
        const base64 = buffer.toString("base64");

        processedQuestion.audioFile = {
          name: audio.filename,
          type: "audio/mpeg",
          data: base64,
        };

        await fs.unlink(fullPath);
      } catch (error) {
        console.error("❌ Failed to generate audio for speaking question:", error);
        processedQuestion.audioFile = null;
        processedQuestion.audio_generation_error = "Audio generation failed";
      }
    }

    // 🖼️ Handle image generation if imageFile + image_prompt present
    if (
      processedQuestion.imageFile &&
      processedQuestion.image_prompt
    ) {
      try {
        const fileName = `speaking_image_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}.png`;

        const result = await generateImageWithGemini(
          processedQuestion.image_prompt,
          fileName
        );

        if (result.success) {
          processedQuestion.imageFile = {
            name: result.fileName,
            type: result.mimeType,
            data: result.data,
            dataUrl: result.dataUrl,
          };
        } else {
          processedQuestion.imageFile = null;
          processedQuestion.image_generation_error = "Image generation failed";
        }
      } catch (error) {
        console.error("❌ Failed to generate image for speaking question:", error);
        processedQuestion.imageFile = null;
        processedQuestion.image_generation_error = "Image generation failed";
      }
    }

    processedQuestions.push(processedQuestion);
  }

  return processedQuestions;
};

const processImageScriptQuestions = async (questions) => {
  const processedQuestions = [];

  for (const question of questions) {
    const processedQuestion = { ...question };

    try {
      // Generate image for the image script question
      const fileName = `image_script_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;

      // Create a prompt for image generation based on the script content
      const imagePrompt = `Create an educational image for visual comprehension based on: ${question.imagetoscript_prompt}. 
      The image should be clear, educational, and suitable for academic purposes.`;

      const result = await generateImageWithGemini(imagePrompt, fileName);

      if (result.success) {
        processedQuestion.imagetoscript_image = {
          name: result.fileName,
          type: result.mimeType,
          data: result.data,
          dataUrl: result.dataUrl
        };
      } else {
        processedQuestion.imagetoscript_image = null;
        processedQuestion.image_generation_error = "Image generation failed";
      }

    } catch (imageError) {
      console.error(`❌ Failed to generate image for image script question:`, imageError);
      processedQuestion.imagetoscript_image = null;
      processedQuestion.image_generation_error = "Image generation failed";
    }

    processedQuestions.push(processedQuestion);
  }

  return processedQuestions;
};

const generateImageWithGemini = async (prompt, fileName) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation",
      generationConfig: {
        responseModalities: ["Text", "Image"],
      },
    });

    const response = await model.generateContent(prompt);
    await new Promise((resolve) => setTimeout(resolve, 5000));

    for (const part of response?.response?.candidates[0]?.content?.parts) {
      if (part.inlineData) {

        // Return image data directly without saving to disk
        return {
          success: true,
          fileName: fileName,
          mimeType: part.inlineData.mimeType || "image/png",
          data: part.inlineData.data, // base64 string
          dataUrl: `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data
            }`,
        };
      }
    }
    return { success: false, error: "No image data found" };
  } catch (error) {
    console.error("❌ Error with Gemini image generation:", error);
    return { success: false, error: error.message };
  }
};

const processTopicsTags = async (topics) => {
  const processedTopics = [];

  for (const topic of topics) {
    const processedTopic = { ...topic };

    if (topic.tags && Array.isArray(topic.tags)) {
      processedTopic.tags = [];

      for (const tag of topic.tags) {
        try {
          const fileName = `${tag.tagName.replace(
            /\s+/g,
            "_"
          )}_${Date.now()}.png`;

          const result = await generateImageWithGemini(tag.tagImagePrompt, fileName);

          if (result.success) {
            processedTopic.tags.push({
              ...tag,
              tagFile: {
                name: result.fileName,
                type: result.mimeType,
                data: result.data,
              },
            });
          } else {
            processedTopic.tags.push({
              ...tag,
              tagFile: null,
              generationError: "Image generation failed",
            });
          }

        } catch (imageError) {
          console.error(
            `❌ Failed to generate image for tag ${tag.tagName}:`,
            imageError
          );
          processedTopic.tags.push({
            ...tag,
            tagFile: null,
            generationError: "Image generation failed",
          });
        }
      }
    }

    if (topic.materials && Array.isArray(topic.materials)) {
      processedTopic.materials = [];

      for (const material of topic.materials) {
        try {
          if (material.material_type === 'image') {
            const fileName = `${Date.now()}.png`;

            const result = await generateImageWithGemini(material.image_prompt, fileName);

            if (result.success) {
              processedTopic.materials.push({
                material_type: material.material_type,
                file: {
                  name: result.fileName,
                  type: result.mimeType,
                  data: result.data,
                },
              });
            } else {
              processedTopic.materials.push({
                material_type: material.material_type,
                file: null,
                generationError: "Image generation failed",
              });
            }
          }
          if (material.material_type === 'other') {

            const audio = await generateAudioFile(material.audio_script);
            const fullPath = path.join(__dirname, `../..${audio.filePath}`);

            const buffer = await fs.readFile(fullPath);
            const base64 = buffer.toString("base64");

            processedTopic.materials.push({
              material_type: material.material_type,
              file: {
                name: audio.filename,
                type: "audio/mpeg",
                data: base64,
              },
            });
          }
        } catch (imageError) {
          console.error(
            `❌ Failed to generate for material ${material.material_type}:`,
            imageError
          );
          processedTopic.materials.push({
            material_type: material.material_type,
            file: null,
            generationError: "generation failed",
          });
        }
      }
    }

    if (topic.content_type === "slide") {
      try {
        for (const slide of topic.slides) {

          if (topic.materials && Array.isArray(topic.materials)) {
            processedTopic.materials = [];

            for (const material of topic.materials) {
              try {
                if (material.material_type === 'image') {
                  const fileName = `${Date.now()}.png`;

                  const result = await generateImageWithGemini(material.image_prompt, fileName);

                  if (result.success) {
                    processedTopic.materials.push({
                      material_type: material.material_type,
                      file: {
                        name: result.fileName,
                        type: result.mimeType,
                        data: result.data,
                      },
                    });
                  } else {
                    processedTopic.materials.push({
                      material_type: material.material_type,
                      file: null,
                      generationError: "Image generation failed",
                    });
                  }
                }
                if (material.material_type === 'other') {

                  const audio = await generateAudioFile(material.audio_script);
                  const fullPath = path.join(__dirname, `../..${audio.filePath}`);

                  const buffer = await fs.readFile(fullPath);
                  const base64 = buffer.toString("base64");

                  processedTopic.materials.push({
                    material_type: material.material_type,
                    file: {
                      name: audio.filename,
                      type: "audio/mpeg",
                      data: base64,
                    },
                  });
                }
              } catch (imageError) {
                console.error(
                  `❌ Failed to generate for material ${material.material_type}:`,
                  imageError
                );
                processedTopic.materials.push({
                  material_type: material.material_type,
                  file: null,
                  generationError: "generation failed",
                });
              }
            }
          }
        }
      } catch (audioError) {
        console.error(
          `Failed to generate audio for topic ${topic.title}:`,
          audioError
        );
        processedTopic.audio_error = "Failed to generate audio";
      }
    }

    processedTopics.push(processedTopic);
  }

  return processedTopics;
};

const processCoursesThumbnail = async (courses) => {
  const processedCourses = [];

  for (const course of courses) {
    const processedCourse = { ...course };

    if (course.image_generation_prompt) {
      try {
        const timestamp = Date.now();
        const courseSlug = course.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .substring(0, 50);
        const fileName = `course-${courseSlug}-${timestamp}.png`;

        // Generate the image
        const imageResult = await generateImageWithGemini(
          course.image_generation_prompt,
          fileName
        );

        if (imageResult.success) {
          processedCourse.thumbnailImage = {
            name: imageResult.fileName,
            type: imageResult.mimeType,
            data: imageResult.data,
          };
        } else {
          processedCourse.thumbnailImage = null;
          processedCourse.generationError = "Image generation failed";
        }
      } catch (imageError) {
        console.error(imageError);
        processedCourse.thumbnailImage = null;
        processedCourse.generationError = "Image generation error";
      }
    } else {
      processedCourse.thumbnailImage = null;
    }

    if (course.preview_image_generation_prompt) {
      try {
        const timestamp = Date.now();
        const courseSlug = course.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .substring(0, 50);
        const fileName = `course-${courseSlug}-${timestamp}.png`;

        // Generate the image
        const detailImageResult = await generateImageWithGemini(
          course.preview_image_generation_prompt,
          fileName
        );

        if (detailImageResult.success) {
          processedCourse.detailImage = {
            name: detailImageResult.fileName,
            type: detailImageResult.mimeType,
            data: detailImageResult.data,
          };
        } else {
          processedCourse.detailImage = null;
          processedCourse.detailImageGenerationError = "Image generation failed";
        }
      } catch (imageError) {
        console.error(imageError);
        processedCourse.detailImage = null;
        processedCourse.detailImageGenerationError = "Image generation error";
      }
    } else {
      processedCourse.detailImage = null;
    }

    if (course.seo_image_generation_prompt) {
      try {
        const timestamp = Date.now();
        const courseSlug = course.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .substring(0, 50);
        const fileName = `course-${courseSlug}-seo-${timestamp}.png`;

        // Generate the image
        const seoImageResult = await generateImageWithGemini(
          course.seo_image_generation_prompt,
          fileName
        );

        if (seoImageResult.success) {
          processedCourse.seoImage = {
            name: seoImageResult.fileName,
            type: seoImageResult.mimeType,
            data: seoImageResult.data,
          };
        } else {
          processedCourse.seoImage = null;
          processedCourse.seoImageGenerationError = "Image generation failed";
        }
      } catch (imageError) {
        console.error(imageError);
        processedCourse.seoImage = null;
        processedCourse.seoImageGenerationError = "Image generation error";
      }
    } else {
      processedCourse.seoImage = null;
    }

    if (course.og_image_generation_prompt) {
      try {
        const timestamp = Date.now();
        const courseSlug = course.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .substring(0, 50);
        const fileName = `course-${courseSlug}-og-${timestamp}.png`;

        // Generate the image
        const ogImageResult = await generateImageWithGemini(
          course.og_image_generation_prompt,
          fileName
        );

        if (ogImageResult.success) {
          processedCourse.ogImage = {
            name: ogImageResult.fileName,
            type: ogImageResult.mimeType,
            data: ogImageResult.data,
          };
        } else {
          processedCourse.ogImage = null;
          processedCourse.ogImage = "Image generation failed";
        }
      } catch (imageError) {
        console.error(imageError);
        processedCourse.ogImage = null;
        processedCourse.ogImage = "Image generation error";
      }
    } else {
      processedCourse.ogImage = null;
    }

    processedCourses.push(processedCourse);
  }

  return processedCourses;
};

// Enhanced Topic-specific prompt with audio script generation
const getTopicGeneratePrompt = (pdfText, userQuery) => {
  const hasContent = pdfText && pdfText.trim().length > 0;
  const hasQuery = userQuery && userQuery.trim().length > 0;

  // Extract content type preference from user query
  const getContentTypePreference = (query) => {
    if (!query) return null;

    const lowerQuery = query.toLowerCase();
    const contentTypes = ['video', 'audio', 'accordian', 'general', 'slide'];

    for (const type of contentTypes) {
      if (lowerQuery.includes(type) ||
        (type === 'accordian' && (lowerQuery.includes('interactive') || lowerQuery.includes('accordion'))) ||
        (type === 'slide' && (lowerQuery.includes('presentation') || lowerQuery.includes('slides')))) {
        return type;
      }
    }
    return null;
  };

  const preferredContentType = getContentTypePreference(userQuery);

  let contentSection = "";
  if (hasContent && hasQuery) {
    contentSection = `
PDF Content:
${pdfText}

User Requirements: ${userQuery}

Based on both the PDF content and user requirements, create comprehensive topics that effectively teach the material and meet the specified learning objectives.`;
  } else if (hasContent) {
    contentSection = `
PDF Content:
${pdfText}

Based on the PDF content provided, create comprehensive learning topics that effectively organize and teach the material.`;
  } else if (hasQuery) {
    contentSection = `
User Requirements: ${userQuery}

Based on the user requirements, create detailed learning topics. Generate comprehensive content that aligns with the specified subject/learning goals.`;
  }

  // Dynamic topic count and type instructions based on user preference
  let topicInstructions = "";
  if (preferredContentType) {
    topicInstructions = `
CONTENT TYPE SPECIFICATION: The user has requested "${preferredContentType}" content specifically.
Generate 3-5 topics, ALL of content_type "${preferredContentType}".
Ensure variety in difficulty levels, learning approaches, and specific focus areas within the ${preferredContentType} format.
Each topic should offer a unique perspective or aspect of the subject matter while maintaining the ${preferredContentType} content type.`;
  } else {
    topicInstructions = `
CONTENT TYPE VARIETY: No specific content type requested.
Generate 4-6 topics with varied content types (video, audio, accordian, general, slide).
Include at least one topic of each major content type to provide diverse learning experiences.
Ensure balanced representation across different content types and learning styles.`;
  }

  return `
You are an expert educational content designer specializing in creating engaging learning topics with multimedia support. ${contentSection}

${topicInstructions}

Generate topics in the following JSON format:

{
  "topics": [
    {
      "title": "Introduction to Core Concepts",
      "description": "Detailed description using #tagName# to indicate the use of specific tags. Tags represent attached resources like code files or documents.",
      "content_type": "${preferredContentType || 'video'}",
      ${preferredContentType === 'video' || (!preferredContentType) ? `
      "video_type": "youtube",
      "videoUrl":"provide url from youtube which is regarding this topic",` : ''}
      "estimated_duration": 25,
      "content_outline": "Introduction to key concepts, basic terminology, fundamental principles, real-world relevance, and preparation for advanced topics.",
      "status": "active",
      ${preferredContentType === 'audio' ? `
      "audio_script": "Welcome to our introduction to core concepts. In this comprehensive audio session, we'll explore the fundamental principles that form the foundation of our subject. We'll begin by establishing key terminology and basic concepts that you'll use throughout your learning journey. As we progress, we'll examine how these concepts apply in real-world scenarios and why they're essential for your understanding. This session will prepare you with the knowledge base needed for more advanced topics ahead. Listen carefully as we break down complex ideas into digestible components, ensuring you have a solid foundation to build upon.",` : ''}
      "materials": [
        {
          "material_type": "code",
          "codeLanguage": "python",
          "code": "# Core concepts example\\nprint('Understanding fundamental principles')\\n# Add more educational code here"
        },
        {
          "material_type": "image", 
          "url": "/topic_material/image/core_concepts.png",
          "image_prompt": "Create an educational diagram showing fundamental concepts with clear hierarchy and relationships between core principles"
        },
        {
          "material_type": "other", 
          "url": "/topic_material/others/concept_explanation.mp3",
          "audio_script": "In this supplementary audio, we'll dive deeper into the core concepts introduced in the main content. We'll explore additional examples and provide practical insights that reinforce your understanding of these fundamental principles."
        }
      ],
      "tags": [
        {
          "tagName": "#fundamentals#", 
          "tagImagePrompt": "Create a clean, educational illustration showing foundational building blocks or pillars representing core concepts, with modern geometric design and professional color scheme" 
        }
      ]
    },
    ${preferredContentType === 'accordian' || (!preferredContentType) ? `
    {
      "title": "Interactive Learning and Practice",
      "description": "Detailed description using #practiceMode# to indicate the use of specific tags. Hands-on accordion-style topic featuring interactive sections with code examples, practical exercises, and step-by-step guidance. This topic combines theoretical knowledge with practical application through multiple expandable sections covering different aspects of the subject.",
      "content_type": "accordian",
      "estimated_duration": 35,
      "content_outline": "Multiple interactive sections covering practical applications, code examples, exercises, troubleshooting, and best practices.",
      "status": "active",
      "materials": [
        {
          "material_type": "code",
          "codeLanguage": "javascript",
          "code": "// Interactive practice code\\nfunction practiceExercise() {\\n  console.log('Practice makes perfect!');\\n  return 'Learning through doing';\\n}"
        },
        {
          "material_type": "image", 
          "url": "/topic_material/image/interactive_diagram.png",
          "image_prompt": "Design an interactive learning interface with expandable sections, code editors, and practice areas in a modern educational layout"
        },
        {
          "material_type": "other", 
          "url": "/topic_material/others/practice_guidance.mp3",
          "audio_script": "This audio provides additional guidance for the interactive practice sections. Follow along as I explain the best approaches to solving these exercises and share tips for effective learning through hands-on practice."
        }
      ],
      "accordianSections": [
        {
          "title": "Section 1: Fundamentals",
          "body": "Comprehensive explanation of fundamental concepts with detailed examples and practical applications. This section covers the basic principles and provides a solid foundation for understanding advanced topics.",
          "codeLanguage": "javascript",
          "code": "// Example code demonstrating key concepts\\nfunction demonstrateBasics() {\\n  console.log('Learning fundamental concepts');\\n  return 'Understanding achieved';\\n}",
          "mediaUrl": [],
          "accordianCompletionType": "timer",
          "accordianCompletionTime": 10,
          "materials": [
            {
              "material_type": "code",
              "codeLanguage": "javascript",
              "code": "// Section-specific practice code\\nfunction sectionExercise() {\\n  return 'Practice completed successfully';\\n}"
            }
          ]
        },
        {
          "title": "Section 2: Practical Applications",
          "body": "Real-world examples and hands-on exercises that demonstrate how to apply the concepts learned in the previous section. Includes step-by-step guidance and best practices.",
          "codeLanguage": "python",
          "code": "# Practical application example\\ndef apply_concepts():\\n    print('Applying learned concepts')\\n    return 'Application successful'",
          "mediaUrl": [],
          "accordianCompletionType": "audio",
          "audio_script": "In this practical section, we'll apply the concepts you've just learned. Follow along as I guide you through real-world examples that demonstrate how to implement these ideas effectively. Pay attention to the code structure and best practices highlighted in each example.",
          "materials": [
            {
              "material_type": "image", 
              "url": "/section_material/image/practical_diagram.png",
              "image_prompt": "Create a workflow diagram showing step-by-step application of concepts in real-world scenarios"
            }
          ]
        }
      ],
      "tags": [
        {
          "tagName": "#practiceMode#", 
          "tagImagePrompt": "Design an interactive learning interface showing expandable accordion sections with code snippets, practice exercises, and hands-on elements in a modern educational dashboard style" 
        }
      ]
    },` : ''}
    ${preferredContentType === 'audio' || (!preferredContentType) ? `
    {
      "title": "Audio-Based Deep Dive",
      "description": "Detailed description using #deepLearning# to indicate the use of specific tags. Comprehensive audio topic designed for in-depth exploration of complex concepts. Perfect for learners who prefer auditory learning or want to study while multitasking. Covers advanced theories, detailed explanations, and expert insights.",
      "content_type": "audio",
      "estimated_duration": 30,
      "content_outline": "Detailed audio content covering advanced concepts, expert commentary, real-world case studies, and comprehensive explanations.",
      "audio_script": "Welcome to our comprehensive deep dive into advanced concepts. In this audio session, we will explore the intricate relationships between fundamental theories and their practical applications. Let's begin by examining the core principles that form the foundation of our subject matter. Throughout this session, we'll discuss real-world case studies that demonstrate how these concepts are applied in professional environments. You'll gain insights from industry experts and learn about the latest developments in the field. By the end of this audio session, you'll have a thorough understanding of complex theoretical frameworks and how they translate into practical solutions. Take notes as we progress through each concept, as these insights will be valuable for your continued learning journey.",
      "status": "active",
      "materials": [
        {
          "material_type": "code",
          "codeLanguage": "python",
          "code": "# Audio companion code examples\\n# These examples complement the audio content\\ndef advanced_concepts():\\n    print('Exploring complex theories through code')\\n    return 'Deep understanding achieved'"
        },
        {
          "material_type": "image", 
          "url": "/topic_material/image/audio_companion.png",
          "image_prompt": "Create a visual mind map showing the relationships between concepts discussed in the audio, with interconnected nodes and clear hierarchy"
        },
        {
          "material_type": "other", 
          "url": "/topic_material/others/supplementary_notes.mp3",
          "audio_script": "This supplementary audio provides additional examples and edge cases that complement the main audio session. Listen to reinforce your understanding of the complex concepts covered."
        }
      ],
      "tags": [
        {
          "tagName": "#deepLearning#", 
          "tagImagePrompt": "Create a sophisticated audio learning environment with sound waves, headphones, and brain connectivity patterns representing deep knowledge absorption and auditory learning" 
        }
      ]
    },` : ''}
    ${preferredContentType === 'general' || (!preferredContentType) ? `
    {
      "title": "Resource Library and Documentation",
      "description": "Detailed description using #resourceHub# to indicate the use of specific tags. Comprehensive general topic containing essential resources, documentation, reference materials, and supplementary content. This topic serves as a knowledge repository with downloadable materials, external links, and comprehensive guides.",
      "content_type": "general",
      "estimated_duration": 20,
      "content_outline": "Resource collection including documentation, reference guides, downloadable materials, useful links, and supplementary content.",
      "status": "active",
      "codeLanguage": "python",
      "code": "# Resource management example\\ndef manage_resources():\\n    print('Accessing learning resources')\\n    return 'Resources loaded successfully'",
      "generalCompletionType": "audio",
      "generalAudioScript": "Welcome to our comprehensive resource library. This collection contains essential materials, documentation, and reference guides that will support your learning journey. Take time to explore each resource and bookmark those most relevant to your current learning goals. These materials are designed to complement your other learning activities and provide ongoing reference support.",
      "materials": [
        {
          "material_type": "code",
          "codeLanguage": "python",
          "code": "# Resource access and management code\\ndef access_resources():\\n    resources = ['docs', 'examples', 'templates']\\n    return f'Available resources: {resources}'"
        },
        {
          "material_type": "image", 
          "url": "/topic_material/image/resource_library.png",
          "image_prompt": "Design a modern digital library interface with organized folders, documents, and search functionality in a clean educational layout"
        },
        {
          "material_type": "other", 
          "url": "/topic_material/others/resource_guide.mp3",
          "audio_script": "This audio guide walks you through the available resources and how to make the most of them. Learn about the different types of materials and how they can support your specific learning objectives."
        }
      ],
      "tags": [
        {
          "tagName": "#resourceHub#", 
          "tagImagePrompt": "Design a modern digital library interface with organized folders, documents, links, and downloadable resources in a clean, accessible layout with educational icons" 
        }
      ]
    },` : ''}
    ${preferredContentType === 'slide' || (!preferredContentType) ? `
    {
      "title": "Visual Presentation with Audio Narration",
      "description": "Detailed description using #visualLearning# to indicate the use of specific tags. Structured slide-based topic presenting information in a visual, easy-to-follow format with professional audio narration. Combines multiple content types within slides including videos, images, and interactive elements with comprehensive voice-over explanations.",
      "content_type": "slide",
      "estimated_duration": 40,
      "audio_required": true,
      "content_outline": "Multi-slide presentation covering topic progression, visual aids, multimedia content, and interactive elements with professional narration.",
      "audio_script": "Welcome to our comprehensive visual presentation. As we progress through each slide, I'll guide you through the key concepts and important details. This presentation is designed to provide you with a structured learning experience that combines visual elements with detailed explanations. We'll start with an overview of the main topics, then dive deep into each concept with practical examples and real-world applications. Pay attention to the visual aids and diagrams as they illustrate complex relationships and processes. Throughout this presentation, we'll highlight best practices and common pitfalls to avoid. By the end of this session, you'll have a complete understanding of the material and be ready to apply these concepts in practical situations.",
      "status": "active",
      "materials": [
        {
          "material_type": "code",
          "codeLanguage": "javascript",
          "code": "// Presentation companion code\\nfunction slideExamples() {\\n  console.log('Code examples for slide content');\\n  return 'Ready for presentation';\\n}"
        },
        {
          "material_type": "image", 
          "url": "/topic_material/image/presentation_overview.png",
          "image_prompt": "Create a comprehensive overview diagram showing the structure and flow of the entire presentation with clear sections and transitions"
        },
        {
          "material_type": "other", 
          "url": "/topic_material/others/slide_notes.mp3",
          "audio_script": "This supplementary audio provides additional context and background information for the presentation slides, offering deeper insights into the visual content."
        }
      ],
      "slides": [
        {
          "title": "Core Concepts Slide",
          "description": "Detailed explanation of fundamental concepts with visual aids and examples. Includes interactive elements and comprehensive coverage of key principles.",
          "content_type": "video",
          "slideCompletionType": "timer",
          "slideCompletionTime": 12,
          "videoDuration": "10",
          "materials": [
            {
              "material_type": "code",
              "codeLanguage": "python",
              "code": "# Core concepts demonstration\\nprint('Illustrating fundamental principles')\\n# Add educational code here"
            },
            {
              "material_type": "image", 
              "url": "/slide_material/image/core_diagram.png",
              "image_prompt": "Create a clear educational diagram illustrating the core concepts with labeled components and relationships"
            }
          ]
        },
        {
          "title": "Summary and Resources",
          "description": "Comprehensive summary of all covered topics with additional resources and next steps for continued learning.",
          "content_type": "general",
          "slideCompletionType": "audio",
          "slideAudioScript": "As we conclude this presentation, let's review the key points covered and explore additional resources for continued learning and skill development.",
          "materialType": "link",
          "externalLink": "https://example.com/additional-resources",
          "materials": [
            {
              "material_type": "code",
              "codeLanguage": "python",
              "code": "# Summary and next steps code\\ndef next_steps():\\n    return 'Continue learning with these resources'"
            },
            {
              "material_type": "other", 
              "url": "/slide_material/others/summary_audio.mp3",
              "audio_script": "This audio summary reinforces the key takeaways from this slide and provides guidance on how to apply what you've learned in practical scenarios."
            }
          ]
        }
      ],
      "tags": [
        {
          "tagName": "#visualLearning#",
          "tagImagePrompt": "Create a modern presentation interface with multiple slides, visual elements, audio controls, and interactive components in a professional educational design"
        }
      ]
    }` : ''}
  ]
}

Instructions:
1. **CONTENT TYPE LOGIC**: 
   - If user specifies a content type (video, audio, accordian, general, slide), create 3-5 topics ALL of that type
   - If no content type specified, create 4-6 topics with one of each type for variety
   - Ensure each topic offers unique value even when using the same content type

2. **AUDIO REQUIREMENTS**: 
   - For ANY topic with content_type "audio" or slides with audio_required=true, ALWAYS include "audio_script"
   - Audio scripts should be 150-300 words of natural, conversational narration
   - Scripts should engage learners with smooth transitions and clear explanations

3. **MATERIALS REQUIREMENTS**:
   - EVERY topic MUST include a "materials" array with 2-3 material objects
   - EVERY slide in slide topics MUST include a "materials" array with 1-2 material objects
   - Material types: "code", "image", or "other" (for audio)
   - For "code" materials: include codeLanguage and code
   - For "image" materials: include url and image_prompt
   - For "other" materials (audio): include url and audio_script

4. **CONTENT TYPE VARIATIONS**:
   - **Multiple Audio Topics**: Vary focus (theory vs practice, beginner vs advanced, overview vs deep-dive)
   - **Multiple Video Topics**: Different formats (tutorial, demonstration, explanation, case study)
   - **Multiple Accordian Topics**: Various interaction types (coding practice, Q&A, step-by-step guides)
   - **Multiple General Topics**: Different resource types (documentation, tools, references, templates)
   - **Multiple Slide Topics**: Various presentation styles (overview, detailed analysis, comparison, workflow)

5. **QUALITY STANDARDS**:
   - Generate realistic duration estimates (15-45 minutes per topic)
   - Create engaging, educationally sound descriptions
   - Include practical applications and real-world relevance
   - Ensure logical difficulty progression
   - Provide comprehensive content outlines

6. **MATERIALS GUIDELINES**:
   - Include relevant educational code examples that complement the topic content
   - Create detailed image prompts for AI generation that match the educational context
   - Write supplementary audio scripts that add value beyond the main content
   - Ensure materials enhance learning rather than duplicate existing content
   - Make materials contextually appropriate for each topic and slide

7. **FORMATTING**:
   - Return ONLY valid JSON without additional formatting
   - Ensure proper escaping of quotes and special characters in code blocks
   - Maintain consistent structure across all topics

Tag Guidelines:
- Create meaningful tags that enhance topic understanding
- Write detailed image prompts for AI generation
- Use tags in descriptions as #tagName# format
- Tags should be relevant and add educational value

Audio Script Guidelines:
- Conversational, professional tone appropriate for educational content
- Clear explanations with smooth transitions between concepts
- Include engagement elements and calls-to-action
- Match estimated duration (roughly 150-200 words per 10 minutes)
- Focus on key learning points without unnecessary filler
`;
};

const generateContentStructure = async (pdfText, userQuery, contentType, details) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  let prompt = "";

  switch (contentType) {
    case "course": // Add this case
      prompt = await getCourseGeneratePrompt(pdfText, userQuery);
      break;
    case "faq":
      prompt = getFAQGeneratePrompt(pdfText, userQuery);
      break;
    case "assignment":
      prompt = getAssignmentGeneratePrompt(pdfText, userQuery);
      break;
    case "assignment_questions":
      prompt = getAssignmentQuestionGeneratePrompt(pdfText, userQuery);
      break;
    case "quiz":
      prompt = getQuizGeneratePrompt(pdfText, userQuery);
      break;
    case "text-based-quiz":
      prompt = getTextBasedQuizPrompt(userQuery, details);
      break;
    case "drag-drop":
      prompt = getDragDropQuestionGeneratePrompt(pdfText, userQuery);
      break;
    case "complete-sentence":
      prompt = getCompleteSentenceQuestionGeneratePrompt(pdfText, userQuery);
      break;
    case "real-word":
      prompt = getRealWordQuestionGeneratePrompt(pdfText, userQuery);
      break;
    case "mcq":
      prompt = getMCQQuestionGeneratePrompt(pdfText, userQuery);
      break;
    case "arrange-order":
      prompt = getArrangeOrderQuestionGeneratePrompt(pdfText, userQuery);
      break;
    case "best-option":
      prompt = getBestOptionQuestionGeneratePrompt(pdfText, userQuery);
      break;
    case "summary-passage":
      prompt = getSummaryPassageQuestionGeneratePrompt(pdfText, userQuery);
      break;
    case "audio-script":
      prompt = getAudioScriptQuestionGeneratePrompt(pdfText, userQuery);
      break;
    case "image-script":
      prompt = getImageScriptQuestionGeneratePrompt(pdfText, userQuery);
      break;
    case "speaking":
      prompt = getSpeakingQuestionGeneratePrompt(pdfText, userQuery);
      break;
    case "topic":
      prompt = getTopicGeneratePrompt(pdfText, userQuery);
      break;
    case "session":
      prompt = getSessionGeneratePrompt(pdfText, userQuery, details);
      break;
    case "module":
      prompt = getModuleGeneratePrompt(pdfText, userQuery, details);
      break;
    default:
      throw new Error("Invalid content type");
  }

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    console.info("➡ typeof response.text():", typeof text);

    return jsonParser(text);
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
};

const getTextBasedQuizPrompt = (userQuery, details) => {
  const { totalQuestions, mcqCount, fillBlankCount, trueFalseCount } = details;

  return `
You are an expert educational content creator and quiz designer. Generate high-quality assessment questions based on the provided text content.

Text Content:
${userQuery}

Generate ${totalQuestions} questions with the following distribution:
- Multiple Choice Questions: ${mcqCount}
- Fill-in-the-Blank Questions: ${fillBlankCount}
- True/False Questions: ${trueFalseCount}

Instructions:
1. Create questions that accurately assess understanding of the text content
2. For Multiple Choice Questions:
   - Generate complete questions (no fill-in-the-blank style)
   - Provide 4 plausible options
   - Mark the correct answer clearly
   - Assign appropriate marks (1-3 based on difficulty)
3. For Fill-in-the-Blank Questions:
   - Create sentences with meaningful blanks
   - Ensure the blanked word/phrase is important to the concept
   - Provide the correct answer
4. For True/False Questions:
   - Create statements that are clearly true or false based on the text
   - Ensure false statements are plausible misconceptions
5. Ensure variety in question difficulty and cognitive level
6. Cover different parts of the text content evenly

Return the questions in the following JSON format:

{
  "questions": [
    {
      "type": "multiple_choice",
      "text": "Complete question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "marks": 2,
      "explanation": "Brief explanation of why this is correct"
    },
    {
      "type": "true_false",
      "text": "True or False: Statement based on the text",
      "correctAnswer": "True",
      "marks": 1,
      "explanation": "Brief explanation"
    },
    {
      "type": "fill_in_blank",
      "text": "Sentence with _______ blank.", // only include one blank with 7 _ we can include two word in it
      "correctAnswer": "missing_word",
      "marks": 1,
      "explanation": "Brief explanation"
    }
  ]
}

Additional Guidelines:
- Questions should test comprehension, not just memorization
- Avoid trivial questions
- Ensure grammatical correctness
- Make questions self-contained (don't require external knowledge)
- For fill-in-the-blank, only blank one significant word per question and in question include balnk of exectly _______ 7 _.
- For true/false, make statements unambiguous
- For multiple choice, make incorrect options plausible but clearly wrong
- Return ONLY valid JSON without additional text or formatting
- The total number of questions must be exactly ${totalQuestions}
`;
};

// Course-specific prompt - Add this function
const getCourseGeneratePrompt = async (pdfText, userQuery) => {
  const hasContent = pdfText && pdfText.trim().length > 0;
  const hasQuery = userQuery && userQuery.trim().length > 0;

  let contentSection = "";
  if (hasContent && hasQuery) {
    contentSection = `
PDF Content:
${pdfText}

User Requirements: ${userQuery}

Based on both the PDF content and user requirements, create comprehensive courses that effectively organize the material and meet the specified educational objectives.`;
  } else if (hasContent) {
    contentSection = `
PDF Content:
${pdfText}

Based on the PDF content provided, create comprehensive courses that effectively structure the educational material.`;
  } else if (hasQuery) {
    contentSection = `
User Requirements: ${userQuery}

Based on the user requirements, create detailed courses. Generate comprehensive educational content that aligns with the specified subject/learning objectives.`;
  }

  const { success, data, error } = await callProcedure("getAllCourseCategories");

  return `
You are an expert course designer specializing in comprehensive educational programs. ${contentSection}
        
    - categories: ${success ? JSON.stringify(data.map(({ id, category }) => ({ id, category }))) : ""}

Generate 3-4 detailed courses in the following JSON format:

{
  "courses": [
    {
      "title": "Comprehensive Foundation Course",
      "description": "A comprehensive foundational course designed to provide students with essential knowledge and skills. This course covers fundamental concepts, core principles, and practical applications that serve as the building blocks for advanced learning in the subject area.",
      "category_id": 1, // Must exactly match the id of one of the provided categories by title/meaning.  
      "price": 99.99,
      "discount": 10,
      "duration_minutes": 400,
      "expiry_days": 365,
      "what_you_will_learn": [
        "Master fundamental concepts and core principles",
        "Apply theoretical knowledge to practical scenarios",
        "Develop problem-solving skills and critical thinking",
        "Gain hands-on experience through interactive exercises",
        "Build a solid foundation for advanced topics"
      ],
      "prerequisites": [
        "Basic understanding of the subject area",
        "Access to computer and internet",
        "Commitment to complete the course duration",
        "Willingness to engage in practical exercises"
      ],
      "hashtags": [
        "fundamentals",
        "beginner-friendly",
        "comprehensive",
        "practical",
        "foundation"
      ],
      "max_access_minutes": 240,
      "min_access_minutes": 20,
      "status": "published",
      "image_generation_prompt": "Professional course thumbnail prompt for AI image generation based on course content",
      "preview_image_generation_prompt": "Professional course preview image prompt for AI image generation based on course content",
      "seo_image_generation_prompt": "Professional course SEO image prompt for AI image generation based on course content",
      "og_image_generation_prompt": "Professional course OG image prompt for AI image generation based on course content",
      "meta_title": "SEO-optimized meta title for the course (max 60 characters)",
      "meta_keyword": "Relevant keywords for search engine optimization",
      "meta_description": "Compelling meta description summarizing the course benefits and key features (max 160 characters)",
      "seo_image_alt": "Descriptive alt text for SEO image",
      "seo_canonical": "Canonical URL for the course page",
      "og_title": "Open Graph title for social media sharing (max 60 characters)",
      "og_description": "Open Graph description for social media previews (max 160 characters)",
      "og_image_alt": "Descriptive alt text for Open Graph image"
    },
    {
      "title": "Advanced Professional Development Course",
      "description": "An advanced course designed for professionals seeking to enhance their expertise and advance their careers. This comprehensive program covers sophisticated techniques, industry best practices, and cutting-edge developments in the field.",
      "category_id": 1,
      "price": 199.99,
      "discount": 15,
      "duration_minutes": 600,
      "expiry_days": 547,
      "what_you_will_learn": [
        "Master advanced techniques and methodologies",
        "Implement industry best practices and standards",
        "Lead complex projects and initiatives",
        "Develop strategic thinking and decision-making skills",
        "Stay current with latest industry trends and innovations"
      ],
      "prerequisites": [
        "Completion of foundational courses or equivalent experience",
        "Professional experience in the field",
        "Strong analytical and problem-solving skills",
        "Commitment to advanced learning objectives"
      ],
      "hashtags": [
        "advanced",
        "professional",
        "expert-level",
        "industry-standard",
        "career-advancement"
      ],
      "max_access_minutes": 240,
      "min_access_minutes": 30,
      "status": "published",
      "image_generation_prompt": "Professional course thumbnail prompt for AI image generation based on course content",
      "preview_image_generation_prompt": "Professional course preview image prompt for AI image generation based on course content",
      "seo_image_generation_prompt": "Professional course SEO image prompt for AI image generation based on course content",
      "og_image_generation_prompt": "Professional course OG image prompt for AI image generation based on course content",
      "meta_title": "SEO-optimized meta title for the course (max 60 characters)",
      "meta_keyword": "Relevant keywords for search engine optimization",
      "meta_description": "Compelling meta description summarizing the course benefits and key features (max 160 characters)",
      "seo_image_alt": "Descriptive alt text for SEO image",
      "seo_canonical": "Canonical URL for the course page",
      "og_title": "Open Graph title for social media sharing (max 60 characters)",
      "og_description": "Open Graph description for social media previews (max 160 characters)",
      "og_image_alt": "Descriptive alt text for Open Graph image"
    },
    {
      "title": "Practical Implementation Masterclass",
      "description": "A hands-on masterclass focused on practical implementation and real-world applications. Students will work on projects, case studies, and interactive exercises to develop practical skills and gain valuable experience.",
      "category_id": 1,
      "price": 149.99,
      "discount": 20,
      "duration_minutes": 350,
      "expiry_days": 365,
      "what_you_will_learn": [
        "Execute real-world projects and case studies",
        "Apply theoretical concepts to practical situations",
        "Develop portfolio-worthy work and demonstrations",
        "Master tools and technologies used in the industry",
        "Build confidence through hands-on experience"
      ],
      "prerequisites": [
        "Basic to intermediate knowledge of the subject",
        "Access to required tools and software",
        "Dedication to hands-on learning approach",
        "Willingness to work on practical projects"
      ],
      "hashtags": [
        "hands-on",
        "practical",
        "project-based",
        "real-world",
        "skill-building"
      ],
      "max_access_minutes": 240,
      "min_access_minutes": 20,
      "status": "published",
      "image_generation_prompt": "Professional course thumbnail prompt for AI image generation based on course content",
      "preview_image_generation_prompt": "Professional course preview image prompt for AI image generation based on course content",
      "seo_image_generation_prompt": "Professional course SEO image prompt for AI image generation based on course content",
      "og_image_generation_prompt": "Professional course OG image prompt for AI image generation based on course content",
      "meta_title": "SEO-optimized meta title for the course (max 60 characters)",
      "meta_keyword": "Relevant keywords for search engine optimization",
      "meta_description": "Compelling meta description summarizing the course benefits and key features (max 160 characters)",
      "seo_image_alt": "Descriptive alt text for SEO image",
      "seo_canonical": "Canonical URL for the course page",
      "og_title": "Open Graph title for social media sharing (max 60 characters)",
      "og_description": "Open Graph description for social media previews (max 160 characters)",
      "og_image_alt": "Descriptive alt text for Open Graph image"
    }
  ]
}

Instructions:
1. Create 3-4 courses with varied difficulty levels and focus areas
2. Generate realistic pricing, duration, and expiry information
3. Create comprehensive "what you will learn" lists with 4-5 meaningful points
4. Include relevant prerequisites that make educational sense
5. Add appropriate hashtags for discoverability
6. Ensure descriptions are detailed and professionally written
7. Use realistic access hour ranges
8. For SEO-OG fields, generate content-specific, optimized text based on the course topic
9. Meta titles should be concise, keyword-rich, and compelling (50-60 characters)
10. Meta descriptions should be persuasive summaries (150-160 characters)
11. SEO keywords should be relevant and include primary and secondary terms
12. Canonical URLs should follow the pattern: /courses/[course-title-slug]
13. Image alt text should be descriptive and include relevant keywords
14. OG content should be optimized for social media sharing
15. Return ONLY valid JSON without additional formatting

SEO-OG FIELD GENERATION GUIDELINES:
- Meta Title: Concise, includes primary keyword, max 60 chars
- Meta Keywords: 5-8 relevant keywords/phrases separated by commas
- Meta Description: Compelling summary with call-to-action, max 160 chars
- SEO Image Alt: Descriptive text including course topic and main benefit
- Canonical URL: Clean URL structure based on course title
- OG Title: Similar to meta title but can be slightly more engaging for social
- OG Description: More conversational version of meta description for social media
- OG Image Alt: Descriptive text for social media image previews

CRITICAL OUTPUT REQUIREMENTS:
- The image_generation_prompt must be a detailed, comprehensive paragraph (minimum 50 words)
- The preview_image_generation_prompt must be a detailed, comprehensive paragraph (minimum 50 words) for preview image
- The seo_image_generation_prompt must be a detailed, comprehensive paragraph (minimum 50 words) for preview image
- The og_image_generation_prompt must be a detailed, comprehensive paragraph (minimum 50 words) for preview image
- Ensure the image prompt creates visually compelling, professional thumbnails that accurately represent course value
- The image_generation_prompt should be specific enough to generate consistent, high-quality results
- Include technical specifications (16:9 aspect ratio, high quality, professional standards)
- Integrate course-specific visual elements that differentiate it from generic educational imagery
- Generate SEO-OG content that is unique, relevant, and optimized for each course
`;
};

const getFAQGeneratePrompt = (pdfText, userQuery) => {
  const hasContent = pdfText && pdfText.trim().length > 0;
  const hasQuery = userQuery && userQuery.trim().length > 0;

  let contentSection = "";
  if (hasContent && hasQuery) {
    contentSection = `
PDF Content:
${pdfText}

User Requirements: ${userQuery}

Based on both the PDF content and user requirements, create concise survey-style FAQs that address key aspects students should consider.`;
  } else if (hasContent) {
    contentSection = `
PDF Content:
${pdfText}

Based on the PDF content provided, create concise survey-style FAQs that capture the main learning points and student considerations.`;
  } else if (hasQuery) {
    contentSection = `
User Requirements: ${userQuery}

Based on the user requirements, create concise survey-style FAQs that address key aspects of the specified subject/topic.`;
  }

  return `
You are an expert educational content designer. ${contentSection}

Generate 5-8 survey-style FAQs in the following JSON format:

{
  "faqs": [
    {
      "question": "What is your current understanding level of the basics?",
      "options": [
        "Beginner - Need to start from scratch",
        "Intermediate - Familiar with some concepts", 
        "Advanced - Comfortable with most fundamentals"
      ]
    },
    {
      "question": "How do you prefer to apply new knowledge?",
      "options": [
        "Through practical hands-on projects",
        "By studying theoretical frameworks",
        "Via collaborative group work",
        "Through individual research"
      ]
    },
    {
      "question": "What learning resources work best for you?",
      "options": [
        "Video tutorials and demonstrations",
        "Reading materials and textbooks",
        "Interactive exercises and quizzes",
        "One-on-one guidance and mentoring"
      ]
    }
  ]
}

Instructions:
1. Create 5-8 concise survey-style FAQs
2. Each FAQ should have 3-4 short, clear answer options (1 short sentence or phrase)
3. Questions should be direct and easy to understand
4. Options should be mutually exclusive where possible
5. Focus on practical learning preferences and self-assessment
6. Keep questions and options brief and scannable
7. Include question types like:
   - Knowledge level self-assessment
   - Learning style preferences  
   - Resource preferences
   - Application preferences
   - Challenge areas
   - Goals and objectives
   - Time commitment availability
8. Make options specific and actionable
9. Ensure the survey flows logically from general to specific
10. Return ONLY valid JSON without additional formatting

Example question styles:
- "What's your primary learning goal?"
- "How much time can you dedicate weekly?"
- "Which learning format do you prefer?"
- "What's your biggest challenge with this topic?"
- "How do you measure learning success?"
`;
};

// Session-specific prompt - Updated to handle optional PDF/query
const getSessionGeneratePrompt = (pdfText, userQuery, details = null) => {
  const hasContent = pdfText && pdfText.trim().length > 0;
  const hasQuery = userQuery && userQuery.trim().length > 0;

  let contentSection = "";
  if (hasContent && hasQuery) {
    contentSection = `
PDF Content:
${pdfText}

User Requirements: ${userQuery}

Based on both the PDF content and user requirements, create comprehensive sessions that effectively teach the material and meet the specified learning objectives.`;
  } else if (hasContent) {
    contentSection = `
PDF Content:
${pdfText}

Based on the PDF content provided, create comprehensive learning sessions that effectively organize and teach the material.`;
  } else if (hasQuery) {
    contentSection = `
User Requirements: ${userQuery}

Based on the user requirements, create detailed learning sessions. Generate comprehensive content that aligns with the specified subject/learning goals.`;
  }

  return `
You are an expert educational session designer. ${contentSection}

course duration ${details?.courseDuration}
Generate 4-5 detailed sessions in the following JSON format:
- Make Sure The Duration For It Remain under the course Duration please

{
  "sessions": [
    {
      "title": "Fundamentals and Introduction Session",
      "chpater_description": "Comprehensive introduction session covering fundamental concepts, basic principles, and foundational knowledge. This session establishes the groundwork for advanced learning and provides essential context for the subject matter.",
      "status": "active",
      "image_name": "session1.png",
      "image_path": "/course/thumbnail/fundamentals.jpg",
      "min_time_in_minute": 45
    },
    {
      "title": "Core Concepts and Principles Session",
      "chpater_description": "In-depth exploration of core concepts and key principles. This session builds upon the fundamentals and introduces more complex ideas, theories, and methodologies essential for mastery of the subject.",
      "status": "active", 
      "image_name": "session2.png",
      "image_path": "/course/thumbnail/core_concepts.jpg",
      "min_time_in_minute": 55
    },
    {
      "title": "Practical Applications Session",
      "chpater_description": "Hands-on session focusing on practical applications, real-world examples, and implementation strategies. Students learn to apply theoretical knowledge to solve practical problems and understand industry applications.",
      "status": "active",
      "image_name": "session3.png", 
      "image_path": "/course/thumbnail/practical.jpg",
      "min_time_in_minute": 65
    },
    {
      "title": "Advanced Topics and Techniques Session",
      "chpater_description": "Advanced session covering sophisticated techniques, complex scenarios, and cutting-edge developments. This session challenges students with advanced concepts and prepares them for expert-level understanding.",
      "status": "active",
      "image_name": "session4.png",
      "image_path": "/course/thumbnail/advanced.jpg", 
      "min_time_in_minute": 50
    },
    {
      "title": "Integration and Mastery Session",
      "chpater_description": "Comprehensive integration session that brings together all previously learned concepts. Students demonstrate mastery through complex projects, case studies, and comprehensive assessments that showcase their complete understanding.",
      "status": "active",
      "image_name": "session5.png",
      "image_path": "/course/thumbnail/mastery.jpg",
      "min_time_in_minute": 60
    }
  ]
}

Instructions:
1. Create 4-5 sessions with logical progression from basic to advanced
2. Generate realistic time estimates (45-65 minutes per session)
3. Create comprehensive descriptions that clearly explain session content and objectives  
4. Ensure each session builds upon previous knowledge
5. Include varied session types (introduction, core concepts, practical, advanced, integration)
6. Make descriptions detailed and educationally sound
7. Return ONLY valid JSON without additional formatting
`;
};

// Module-specific prompt - Updated to handle optional PDF/query
const getModuleGeneratePrompt = (pdfText, userQuery, details = null) => {
  const hasContent = pdfText && pdfText.trim().length > 0;
  const hasQuery = userQuery && userQuery.trim().length > 0;

  let contentSection = "";
  if (hasContent && hasQuery) {
    contentSection = `
PDF Content:
${pdfText}

User Requirements: ${userQuery}

Based on both the PDF content and user requirements, create comprehensive learning modules that effectively organize the material and meet the specified educational objectives.`;
  } else if (hasContent) {
    contentSection = `
PDF Content:
${pdfText}

Based on the PDF content provided, create comprehensive learning modules that effectively organize and structure the educational material.`;
  } else if (hasQuery) {
    contentSection = `
User Requirements: ${userQuery}

Based on the user requirements, create detailed learning modules. Generate comprehensive educational content that aligns with the specified subject/learning objectives.`;
  }

  return `
You are an expert curriculum designer specializing in modular learning structures. ${contentSection}

Session duration ${details?.sessionDuration}

Generate 4-5 detailed learning modules in the following JSON format:
- Make Sure The Duration For It Remain under the Session Duration please

{
  "modules": [
    {
      "title": "Introduction and Foundations Module",
      "image": "/course/thumbnail/foundations.jpg",
      "description": "Comprehensive foundational module introducing essential concepts, terminology, and basic principles. This module establishes the groundwork for all subsequent learning, providing students with the necessary background knowledge and context to succeed in more advanced topics.",
      "duration_minutes": 30,
      "status": "active"
    },
    {
      "title": "Core Theory and Concepts Module",
      "image": "/course/thumbnail/theory.jpg", 
      "description": "In-depth exploration of core theoretical frameworks, key concepts, and fundamental principles. Students will develop a solid understanding of the theoretical foundations that underpin practical applications, including detailed analysis of important models, methodologies, and conceptual frameworks.",
      "duration_minutes": 40,
      "status": "active"
    },
    {
      "title": "Practical Implementation Module",
      "image": "/course/thumbnail/implementation.jpg",
      "description": "Hands-on module focusing on practical implementation, real-world applications, and skill development. Students engage with case studies, practical exercises, and project-based learning to apply theoretical knowledge in realistic scenarios and develop practical competencies.",
      "duration_minutes": 50,
      "status": "active"
    },
    {
      "title": "Advanced Applications Module",
      "image": "/course/thumbnail/advanced.jpg",
      "description": "Advanced module covering sophisticated applications, complex problem-solving, and cutting-edge developments. Students tackle challenging scenarios, explore advanced techniques, and develop expertise in specialized areas of the subject matter.",
      "duration_minutes": 40,
      "status": "active"
    },
    {
      "title": "Integration and Assessment Module",
      "image": "/course/thumbnail/assessment.jpg",
      "description": "Comprehensive capstone module integrating all learning outcomes through complex projects, comprehensive assessments, and portfolio development. Students demonstrate mastery by synthesizing knowledge from all previous modules and applying it to comprehensive, real-world challenges.",
      "duration_minutes": 30,
      "status": "active"
    }
  ]
}

Instructions:
1. Create 4-5 modules with logical progression and clear learning objectives
2. Generate realistic duration estimates (3-5 hours per module)
3. Create detailed, comprehensive descriptions that clearly articulate module content and outcomes
4. Ensure each module builds upon previous knowledge while standing as a complete learning unit
5. Include varied module types covering introduction, theory, practice, advanced topics, and integration
6. Make descriptions educationally sound with clear value propositions
7. Maintain consistent formatting and professional language
8. Return ONLY valid JSON without additional formatting
`;
};

const getAssignmentGeneratePrompt = (pdfText, userQuery) => {
  const hasContent = pdfText && pdfText.trim().length > 0;
  const hasQuery = userQuery && userQuery.trim().length > 0;

  let contentSection = "";
  if (hasContent && hasQuery) {
    contentSection = `
PDF Content:
${pdfText}

User Requirements: ${userQuery}

Based on both the PDF content and user requirements, create assignments that align with the provided material and meet the specified needs.`;
  } else if (hasContent) {
    contentSection = `
PDF Content:
${pdfText}

Based on the PDF content provided, create comprehensive assignments that test understanding of the material.`;
  } else if (hasQuery) {
    contentSection = `
User Requirements: ${userQuery}

Based on the user requirements, create comprehensive assignments. Generate realistic content and examples that align with the specified topic/subject.`;
  }

  return `
You are an expert assignment creator. ${contentSection}

Please generate 4-5 detailed assignment structures in the following JSON format:

{
  "assignments": [
    {
      "title": "Assignment Title",
      "description": "Detailed assignment description explaining what students need to do",
      "due_date": "2024-12-31T23:59:59.000Z",
      "max_score": 100,
      "status": "active",
      "category": "regular",
      "created_by_type": "admin",
      "updated_by_type": "admin",
      "regular_questions": [
        {
          "question_text": "Question based on content/requirements",
          "expected_answer": "Expected answer or rubric"
        }
      ]
    },
    {
      "title": "Matching Assignment Title",
      "description": "Assignment involving matching concepts",
      "due_date": "2024-12-31T23:59:59.000Z",
      "max_score": 100,
      "status": "active",
      "category": "matching",
      "created_by_type": "admin",
      "updated_by_type": "admin",
      "matching_questions": [
        {
          "question": "Match the following concepts",
          "MatchingOptions": [
            { "option_text": "Term 1", "option_type": "text", "match_text": "Definition 1", "match_type": "text" },
            { "option_text": "Term 2", "option_type": "text", "match_text": "Definition 2", "match_type": "text" }
          ]
        }
      ]
    },
    {
      "title": "True/False Assignment",
      "description": "Assignment with true/false questions",
      "due_date": "2024-12-31T23:59:59.000Z",
      "max_score": 50,
      "status": "active",
      "category": "true_false",
      "created_by_type": "admin",
      "updated_by_type": "admin",
      "true_false_questions": [
        {
          "question_text": "True/False question based on content?",
          "correct_answer": true,
          "explanation": "Explanation for the answer"
        }
      ]
    },
    {
      "title": "Fill in the Blanks Assignment",
      "description": "Assignment with fill in the blanks questions",
      "due_date": "2024-12-31T23:59:59.000Z",
      "max_score": 75,
      "status": "active",
      "category": "fill_in_the_blanks",
      "created_by_type": "admin",
      "updated_by_type": "admin",
      "fill_blank_questions": [
        {
          "question_text": "Sun Rise From <span style="text-decoration: underline;">East</span> Direction."
        }
      ]
    },
    {
      "title": "Paragraph Writing Assignment",
      "description": "Assignment requiring paragraph writing",
      "due_date": "2024-12-31T23:59:59.000Z",
      "max_score": 100,
      "status": "active",
      "category": "paragraph_writing",
      "created_by_type": "admin",
      "updated_by_type": "admin",
      "paragraph_questions": [
        {
          "paragraph": "Write a comprehensive paragraph about the main themes. Include specific examples and analysis."
        }
      ]
    }
  ]
}

Instructions:
${hasContent
      ? "1. Analyze the PDF content thoroughly"
      : "1. Generate content based on the user requirements"
    }
2. Create 4-5 assignments of different categories
3. Generate realistic questions that test understanding
4. Use appropriate scoring and due dates
5. Make sure all content is educationally sound and relevant
6. For matching questions, create logical pairs
7. For fill-in-the-blanks, identify key concepts
8. For paragraph writing, create prompts requiring deep understanding
9. Return ONLY valid JSON without any additional text or formatting
10. make the <span style="text-decoration: underline;">Write answer here</span> instead of writing it in "_____",
`;
};

// Assignment Question-specific prompt - Updated for type-specific generation
const getAssignmentQuestionGeneratePrompt = (pdfText, userQuery) => {
  const hasContent = pdfText && pdfText.trim().length > 0;
  const hasQuery = userQuery && userQuery.trim().length > 0;

  // Allowed types mapping
  const allowedTypes = {
    matching: "matching",
    fill_in_the_blanks: "fill_in_the_blanks",
    true_false: "true_false",
    paragraph_writing: "paragraph_writing",
  };

  // Detect requested type from user query
  let requestedType = null;
  if (hasQuery) {
    const queryLower = userQuery.toLowerCase();
    for (const [key, value] of Object.entries(allowedTypes)) {
      if (queryLower.includes(key)) {
        requestedType = value;
        break;
      }
    }
  }

  // If no valid type found
  if (!requestedType) {
    return `User asked: "${userQuery}". Unable to detect valid question type. Allowed types: Matching, True/False, Fill in the Blanks, Paragraph Writing. Please clarify the desired type.`;
  }

  let contentSection = "";
  if (hasContent && hasQuery) {
    contentSection = ` PDF Content: ${pdfText}  User Requirements: ${userQuery}  Based on both the PDF content and user requirements, create comprehensive ${requestedType.replace(/_/g, " ")} questions.`;
  } else if (hasContent) {
    contentSection = ` PDF Content: ${pdfText}  Based on the PDF content provided, create comprehensive ${requestedType.replace(/_/g, " ")} questions.`;
  } else if (hasQuery) {
    contentSection = ` User Requirements: ${userQuery}  Based on the user requirements, create ${requestedType.replace(/_/g, " ")} questions aligned with the specified learning objectives.`;
  }

  // Template for each question type
  const typeTemplates = {
    matching: `[
  {
    "question_text": "Match each concept with its correct description or related example.",
    "MatchingOptions": [
      { "option_text": "Primary Source", "match_text": "Original firsthand evidence or records of events.", "option_type": "text", "match_type": "text" },
      { "option_text": "Secondary Source", "match_text": "Interpretation or analysis of primary sources.", "option_type": "text", "match_type": "text" },
      { "match_text": "Used for food storage and ceremonial purposes.", "option_type": "image", "option_prompt": "Generate an ancient clay pot artifact image for early civilization", "match_type": "text" }
    ]
  }
]`,
    true_false: `[
      { "question_text": "The Industrial Revolution began in Britain during the late 18th century.", "correct_answer": true },
      { "question_text": "All historical sources from the same time period are equally reliable.", "correct_answer": false }
    ]`,
    fill_in_the_blanks: `"[
        {
          "question_text": "The <u>Scientific Revolution</u> of the 16th and 17th centuries changed the <u>natural world</u> understanding, with Galileo Galilei and Isaac Newton making discoveries in astronomy and physics.",
          "answers": ["Scientific Revolution", "natural world"]
        }
    ]`,
    paragraph_writing: `"[
      { "paragraph_prompt": "Analyze the causes and consequences of a major historical event. Discuss at least three contributing factors, their interconnections, and both short-term and long-term impacts, using examples from sources." }
    ]`,
  };

  return `
You are an expert educational assessment designer specializing in creating high-quality, type-specific assignment questions.
${contentSection}

Generate ONLY ${requestedType.replace(/_/g, " ")} questions in the following JSON format:
{
  "assignment-questions": ${typeTemplates[requestedType]}
}

General Instructions:
1. Create questions aligned with the academic level and learning objectives.
2. Ensure clarity, unambiguity, and educational value.
3. Make questions challenging but fair for students.
4. Return ONLY valid JSON without extra text or explanations.
5. The response should be a single question object, not an array.
6. In Matching and prompt generate 3 to 5 and in fill in the blank and true fasle generate from 7 to 10.

${requestedType === "matching" ? `
For Matching Questions:
- Create 3–4 (or more) matching questions, each containing 3–5 matching pairs.
- Each pair can use either "text" or "image" for both option_type and match_type.
- If option_type or match_type is "image", include an additional key:
  • "option_prompt" (for option_type = image)
  • "match_prompt" (for match_type = image)
  containing the descriptive image generation prompt.
- use images in at least in two questions.
- Ensure all text types are informative and clear.
- For image types, provide meaningful, detailed prompts that can be used to generate educationally relevant images.
` : ""}

${requestedType === "true_false" ? `
For True/False Questions:
- Create statements that test understanding, not just memorization
- Avoid absolutes (always, never) unless they are factually correct
- Ensure the statement is clearly true or false, not ambiguous
` : ""}

${requestedType === "paragraph_writing" ? `
For Paragraph Writing:
- Create prompts that encourage critical thinking and analysis
- Include specific requirements (number of examples, concepts to address)
- Make prompts open-ended enough to allow for creative responses
` : ""}

${requestedType === "fill_in_the_blanks" ? `
1. You MUST wrap each answer word/phrase in <u></u> tags in the question_text
2. The question_text should contain the complete sentence with underlined words that students need to fill in
3. The "answers" array should contain the exact same words/phrases that are underlined in the question_text
4. Example: If question_text is "The <u>heart</u> pumps <u>blood</u> through the body", then answers should be ["heart", "blood"]
5. Always ensure every underlined word in question_text has a corresponding entry in the answers array
6. Do NOT use blanks (____) in question_text - use underlined words instead`: ""}
`;
};

// Quiz-specific prompt - Updated to handle optional PDF/query
const getQuizGeneratePrompt = (pdfText, userQuery) => {
  const hasContent = pdfText && pdfText.trim().length > 0;
  const hasQuery = userQuery && userQuery.trim().length > 0;

  let contentSection = "";
  if (hasContent && hasQuery) {
    contentSection = `
PDF Content:
${pdfText}

User Requirements: ${userQuery}

Based on both the PDF content and user requirements, create quizzes that test understanding of the material and meet the specified needs.`;
  } else if (hasContent) {
    contentSection = `
PDF Content:
${pdfText}

Based on the PDF content provided, create comprehensive quizzes that test understanding of the material.`;
  } else if (hasQuery) {
    contentSection = `
User Requirements: ${userQuery}

Based on the user requirements, create comprehensive quizzes. Generate realistic questions and options that align with the specified topic/subject.`;
  }

  return `
You are an expert quiz creator. ${contentSection}

Please generate 4-5 detailed quiz structures in the following JSON format:

{
  "quizzes": [
    {
      "title": "Quiz Title 1",
      "duration_minutes": 3,
      "passing_score": 70,
      "max_attempts": 3,
      "attempts_gap": 24,
      "quizType": "normal",
      "status": "active",
      "created_by_type": "admin",
      "updated_by_type": "admin"
    },
    {
      "title": "Quiz Title 2",
      "duration_minutes": 15,
      "passing_score": 75,
      "max_attempts": 2,
      "attempts_gap": 12,
      "quizType": "normal",
      "status": "active",
      "created_by_type": "admin",
      "updated_by_type": "admin"
    },
    {
      "title": "Quiz Title 3",
      "duration_minutes": 4,
      "passing_score": 80,
      "max_attempts": 3,
      "attempts_gap": 24,
      "quizType": "advanced",
      "status": "active",
      "created_by_type": "admin",
      "updated_by_type": "admin"
    },
    {
      "title": "Quiz Title 4",
      "duration_minutes": 5,
      "passing_score": 65,
      "max_attempts": 4,
      "attempts_gap": 6,
      "quizType": "practice",
      "status": "active",
      "created_by_type": "admin",
      "updated_by_type": "admin"
    }
  ],
  "quizQuestions": [
    {
      "quiz_id": 1,
      "question_text": "Question based on content?",
      "question_type": "mcq",
      "marks": 5,
      "sequence_no": 1,
      "options": [
        { "text": "Option 1", "correct": false },
        { "text": "Option 2", "correct": true },
        { "text": "Option 3", "correct": false },
        { "text": "Option 4", "correct": false }
      ],
      "created_by_type": "admin",
      "updated_by_type": "admin"
    },
    {
      "quiz_id": 1,
      "question_text": "True or False question?",
      "question_type": "true_false",
      "marks": 3,
      "sequence_no": 2,
      "options": [
        { "text": "True", "correct": true },
        { "text": "False", "correct": false }
      ],
      "created_by_type": "admin",
      "updated_by_type": "admin"
    }
  ]
}

Instructions:
1. Create 4-5 comprehensive quizzes with varied difficulty levels
2. Generate both MCQ and True/False questions
3. Ensure questions test different levels of understanding
4. Use realistic durations and scoring
5. Create diverse quiz types (normal, advanced, practice)
6. Return ONLY valid JSON without additional formatting
`;
};

// Drag Drop Question-specific prompt - Updated to handle optional PDF/query
const getDragDropQuestionGeneratePrompt = (pdfText, userQuery) => {
  const hasContent = pdfText && pdfText.trim().length > 0;
  const hasQuery = userQuery && userQuery.trim().length > 0;

  let contentSection = "";
  if (hasContent && hasQuery) {
    contentSection = `
PDF Content:
${pdfText}

User Requirements: ${userQuery}

Based on both the PDF content and user requirements, create engaging drag and drop questions that test understanding of key concepts through fill-in-the-blank exercises.`;
  } else if (hasContent) {
    contentSection = `
PDF Content:
${pdfText}

Based on the PDF content provided, create comprehensive drag and drop questions that test understanding of the material through interactive fill-in-the-blank exercises.`;
  } else if (hasQuery) {
    contentSection = `
User Requirements: ${userQuery}

Based on the user requirements, create detailed drag and drop questions. Generate comprehensive fill-in-the-blank questions that effectively assess knowledge on the specified subject/learning goals.`;
  }

  return `
You are an expert educational assessment designer specializing in interactive drag and drop questions. ${contentSection}

Generate 4-6 detailed drag and drop questions in the following JSON format:

{
  "dragDropQuestions": [
    {
      "prompt": "Complete the following statement about data structures: A ___ is a linear data structure that follows the ___ principle, where elements are added and removed from the same end called the ___.",
      "options": [
        "stack",
        "queue",
        "LIFO",
        "FIFO", 
        "top",
        "rear",
        "array",
        "linked list"
      ],
      "blanks": [
        {
          "position": 1,
          "correct": "stack"
        },
        {
          "position": 2, 
          "correct": "LIFO"
        },
        {
          "position": 3,
          "correct": "top"
        }
      ],
      "marks": 3
    },
    {
      "prompt": "In object-oriented programming, ___ is the process of wrapping data and methods together, while ___ allows objects to take multiple forms, and ___ enables creating new classes based on existing ones.",
      "options": [
        "encapsulation",
        "inheritance", 
        "polymorphism",
        "abstraction",
        "composition",
        "aggregation",
        "method overloading",
        "data hiding"
      ],
      "blanks": [
        {
          "position": 1,
          "correct": "encapsulation"
        },
        {
          "position": 2,
          "correct": "polymorphism"
        },
        {
          "position": 3,
          "correct": "inheritance"
        }
      ],
      "marks": 3
    },
    {
      "prompt": "The ___ algorithm has a time complexity of O(n²) in the worst case, while ___ sort has a time complexity of O(n log n), making it more efficient for large datasets. The ___ search algorithm works only on sorted arrays.",
      "options": [
        "bubble sort",
        "merge sort",
        "quick sort",
        "binary search",
        "linear search",
        "insertion sort",
        "selection sort",
        "heap sort"
      ],
      "blanks": [
        {
          "position": 1,
          "correct": "bubble sort"
        },
        {
          "position": 2,
          "correct": "merge sort"
        },
        {
          "position": 3,
          "correct": "binary search"
        }
      ],
      "marks": 3
    },
    {
      "prompt": "In database design, ___ ensures that each table has a primary key and no repeating groups, while ___ eliminates partial dependencies, and ___ removes transitive dependencies.",
      "options": [
        "First Normal Form",
        "Second Normal Form", 
        "Third Normal Form",
        "BCNF",
        "primary key",
        "foreign key",
        "normalization",
        "denormalization"
      ],
      "blanks": [
        {
          "position": 1,
          "correct": "First Normal Form"
        },
        {
          "position": 2,
          "correct": "Second Normal Form"
        },
        {
          "position": 3,
          "correct": "Third Normal Form"
        }
      ],
      "marks": 3
    },
    {
      "prompt": "The ___ protocol operates at the transport layer and provides reliable data transmission, while ___ is connectionless and faster but less reliable. ___ is used for domain name resolution.",
      "options": [
        "TCP",
        "UDP",
        "HTTP",
        "DNS",
        "FTP",
        "SMTP",
        "IP",
        "ICMP"
      ],
      "blanks": [
        {
          "position": 1,
          "correct": "TCP"
        },
        {
          "position": 2,
          "correct": "UDP"
        },
        {
          "position": 3,
          "correct": "DNS"
        }
      ],
      "marks": 3
    },
    {
      "prompt": "In web development, ___ is used for styling web pages, ___ adds interactivity and dynamic behavior, while ___ structures the content and markup of web pages.",
      "options": [
        "HTML",
        "CSS",
        "JavaScript",
        "PHP",
        "Python",
        "SQL",
        "JSON",
        "XML"
      ],
      "blanks": [
        {
          "position": 1,
          "correct": "CSS"
        },
        {
          "position": 2,
          "correct": "JavaScript"
        },
        {
          "position": 3,
          "correct": "HTML"
        }
      ],
      "marks": 3
    }
  ]
}

Instructions:
1. Create 4-6 drag and drop questions with varying difficulty levels
2. Each question should have 2-4 blanks (represented by ___)
3. Provide 6-8 options per question, including some distractors
4. Ensure only one correct answer per blank
5. Make questions educational and test real understanding
6. Include a mix of:
   - Definition completion questions
   - Process/sequence questions  
   - Comparison/contrast questions
   - Technical terminology questions
7. Set appropriate marks (usually 1 mark per blank)
8. Ensure options are realistic and include plausible incorrect answers
9. Make prompts clear and unambiguous
10. Return ONLY valid JSON without additional formatting

Note: Each blank position corresponds to the order of ___ appearance in the prompt text.
`;
};

// Complete Sentence Question-specific prompt - Updated to handle optional PDF/query
const getCompleteSentenceQuestionGeneratePrompt = (pdfText, userQuery) => {
  const hasContent = pdfText && pdfText.trim().length > 0
  const hasQuery = userQuery && userQuery.trim().length > 0

  let contentSection = ""
  if (hasContent && hasQuery) {
    contentSection = `PDF Content:
${pdfText}

User Requirements: ${userQuery}

Based on both the PDF content and user requirements, create engaging complete sentence questions that test understanding of key concepts through fill-in-the-blank exercises. Each blank's hint should ONLY be the first 1–2 letters of the correct answer word.`
  } else if (hasContent) {
    contentSection = `PDF Content:
${pdfText}

Based on the PDF content provided, create comprehensive complete sentence questions that test understanding of the material through interactive fill-in-the-blank exercises. Each blank's hint should ONLY be the first 1–2 letters of the correct answer word.`
  } else if (hasQuery) {
    contentSection = `User Requirements: ${userQuery}

Based on the user requirements, create detailed complete sentence questions. Generate comprehensive fill-in-the-blank questions that effectively assess knowledge on the specified subject/learning goals. Each blank's hint should ONLY be the first 1–2 letters of the correct answer word.`
  }

  return `You are an expert educational assessment designer specializing in complete sentence fill-in-the-blank questions. 

${contentSection}

Generate 4-6 detailed complete sentence questions in the following JSON format:

{
  "completeSentenceQuestions": [
    {
      "question": "The process of _____ involves the conversion of light energy into chemical energy, which occurs in the _____ of plant cells and produces _____ as a byproduct.",
      "blanks": [
        {
          "word": "photosynthesis",
          "hint": "ph"
        },
        {
          "word": "chloroplasts",
          "hint": "ch"
        },
        {
          "word": "oxygen",
          "hint": "ox"
        }
      ]
    }
  ]
}

Instructions:
1. Create 4-6 complete sentence questions with varying difficulty levels
2. Each question should have 2-4 blanks (represented by _____)
3. For each blank's hint:
   - ONLY include the first 1–2 letters of the correct answer
   - No descriptive clues, no extra text
4. Make questions comprehensive and test real understanding
5. Include a mix of:
   - Definition and concept questions
   - Process and sequence questions
   - Relationship and comparison questions
   - Application and analysis questions
6. Ensure blanks test key vocabulary and important concepts
7. Ensure questions are clear and unambiguous
8. Cover different aspects of the subject matter
9. Return ONLY valid JSON without additional formatting

Note: Hints must be exactly the first 1–2 letters of the answer word and nothing else.`
}

const getRealWordQuestionGeneratePrompt = (pdfText, userQuery) => {
  const hasContent = pdfText && pdfText.trim().length > 0
  const hasQuery = userQuery && userQuery.trim().length > 0

  let contentSection = ""
  if (hasContent && hasQuery) {
    contentSection = `PDF Content: ${pdfText}

User Requirements: ${userQuery}

Based on both the PDF content and user requirements, create real word identification questions that test vocabulary knowledge and word recognition skills.`
  } else if (hasContent) {
    contentSection = `PDF Content: ${pdfText}

Based on the PDF content provided, create real word identification questions that test understanding of key terminology and vocabulary from the material.`
  } else if (hasQuery) {
    contentSection = `User Requirements: ${userQuery}

Based on the user requirements, create real word identification questions. Generate vocabulary-based questions that effectively assess word recognition and language skills on the specified subject/learning goals.`
  }

  return `You are an expert educational assessment designer specializing in vocabulary and word recognition questions.

${contentSection}

Generate 4-6 detailed real word identification questions in the following JSON format:

{
  "realWordQuestions": [
    {
      "words": [
        "algorithm",
        "syntax",
        "databaze",
        "function",
        "variabel",
        "compiler"
      ],
      "correct_answers": [
        "yes",
        "yes",
        "no",
        "yes",
        "no",
        "yes"
      ],
      "marks": 6,
      "category": "Programming Terminology",
      "difficulty": "intermediate"
    },
    {
      "words": [
        "photosynthesis",
        "chloroplast",
        "mitokondria",
        "nucleus",
        "membrane",
        "celular"
      ],
      "correct_answers": [
        "yes",
        "yes",
        "no",
        "yes",
        "yes",
        "no"
      ],
      "marks": 6,
      "category": "Biology Terms",
      "difficulty": "advanced"
    }
  ]
}

Instructions:
1. Create 4-6 real word identification questions with varying difficulty levels
2. Each question must have exactly 6 distinct words (no similar/repeated words)
3. For each word, provide "yes" or "no" in correct_answers indicating if it's correctly spelled
4. Create plausible fake words by:
   - Common misspellings
   - Phonetic variations
   - Letter substitutions
   - Missing or extra letters
5. Ensure fake words look realistic but are clearly incorrect
6. Focus on subject-specific terminology when content is provided
7. Include a category and difficulty level for each question
8. Set appropriate marks (usually 1 mark per correct word identified)
9. Make questions educational and test real vocabulary knowledge
10. All words must be distinct (no variations of the same word)
11. Return ONLY valid JSON without additional formatting

Note: Students will need to identify whether each word is spelled correctly by answering "yes" or "no" for each word in the list.`
}

// MCQ Question-specific prompt - Updated to handle optional PDF/query
const getMCQQuestionGeneratePrompt = (pdfText, userQuery) => {
  const hasContent = pdfText && pdfText.trim().length > 0
  const hasQuery = userQuery && userQuery.trim().length > 0

  let contentSection = ""
  if (hasContent && hasQuery) {
    contentSection = `PDF Content:
${pdfText}

User Requirements: ${userQuery}

Based on both the PDF content and user requirements, create engaging multiple choice questions that test understanding of key concepts with clear, well-structured options.`
  } else if (hasContent) {
    contentSection = `PDF Content:
${pdfText}

Based on the PDF content provided, create comprehensive multiple choice questions that test understanding of the material with clear options and explanations.`
  } else if (hasQuery) {
    contentSection = `User Requirements: ${userQuery}

Based on the user requirements, create detailed multiple choice questions. Generate comprehensive MCQ questions that effectively assess knowledge on the specified subject/learning goals.`
  }

  return `You are an expert educational assessment designer specializing in multiple choice questions (MCQ). 

${contentSection}

Generate 4-6 detailed multiple choice questions in the following JSON format:

{
  "mcqQuestions": [
    {
      "sequence_no": 1,
      "question_type": "multiple-choice",
      "marks": 1,
      "question_text": "What is the primary function of the mitochondria in a cell?",
      "options": [
        {
          "text": "Protein synthesis",
          "isCorrect": false
        },
        {
          "text": "Energy production (ATP synthesis)",
          "isCorrect": true
        },
        {
          "text": "DNA replication",
          "isCorrect": false
        },
        {
          "text": "Waste removal",
          "isCorrect": false
        }
      ],
      "correct_answer": 1,
      "explanation": "Mitochondria are known as the powerhouse of the cell because they produce ATP (adenosine triphosphate) through cellular respiration, which provides energy for cellular processes."
    },
    {
      "sequence_no": 2,
      "question_type": "multiple-choice",
      "marks": 1,
      "question_text": "Which programming concept allows a function to call itself?",
      "options": [
        {
          "text": "Iteration",
          "isCorrect": false
        },
        {
          "text": "Recursion",
          "isCorrect": true
        },
        {
          "text": "Inheritance",
          "isCorrect": false
        },
        {
          "text": "Polymorphism",
          "isCorrect": false
        }
      ],
      "correct_answer": 1,
      "explanation": "Recursion is a programming technique where a function calls itself to solve a problem by breaking it down into smaller, similar subproblems."
    },
    {
      "sequence_no": 3,
      "question_type": "multiple-choice",
      "marks": 2,
      "question_text": "In the water cycle, which process involves the change of water from liquid to gas state?",
      "options": [
        {
          "text": "Condensation",
          "isCorrect": false
        },
        {
          "text": "Precipitation",
          "isCorrect": false
        },
        {
          "text": "Evaporation",
          "isCorrect": true
        },
        {
          "text": "Collection",
          "isCorrect": false
        },
        {
          "text": "Infiltration",
          "isCorrect": false
        }
      ],
      "correct_answer": 2,
      "explanation": "Evaporation is the process where water changes from liquid state to gas (water vapor) due to heat energy, typically from the sun. This is a key component of the water cycle."
    },
    {
      "sequence_no": 4,
      "question_type": "multiple-choice",
      "marks": 1,
      "question_text": "Which of the following is NOT a fundamental principle of object-oriented programming?",
      "options": [
        {
          "text": "Encapsulation",
          "isCorrect": false
        },
        {
          "text": "Inheritance",
          "isCorrect": false
        },
        {
          "text": "Compilation",
          "isCorrect": true
        },
        {
          "text": "Polymorphism",
          "isCorrect": false
        }
      ],
      "correct_answer": 2,
      "explanation": "Compilation is a process of translating code into machine language, not a fundamental principle of OOP. The four main principles of OOP are Encapsulation, Inheritance, Polymorphism, and Abstraction."
    },
    {
      "sequence_no": 5,
      "question_type": "multiple-choice",
      "marks": 1,
      "question_text": "What is the chemical symbol for gold?",
      "options": [
        {
          "text": "Go",
          "isCorrect": false
        },
        {
          "text": "Gd",
          "isCorrect": false
        },
        {
          "text": "Au",
          "isCorrect": true
        },
        {
          "text": "Ag",
          "isCorrect": false
        }
      ],
      "correct_answer": 2,
      "explanation": "The chemical symbol for gold is Au, which comes from the Latin word 'aurum' meaning gold. Ag is silver, Gd is gadolinium, and Go is not a valid chemical symbol."
    },
    {
      "sequence_no": 6,
      "question_type": "multiple-choice",
      "marks": 2,
      "question_text": "Which of the following best describes the concept of 'Big O notation' in computer science?",
      "options": [
        {
          "text": "A way to measure the physical size of code files",
          "isCorrect": false
        },
        {
          "text": "A method for describing the performance or complexity of an algorithm",
          "isCorrect": true
        },
        {
          "text": "A programming language syntax rule",
          "isCorrect": false
        },
        {
          "text": "A database optimization technique",
          "isCorrect": false
        }
      ],
      "correct_answer": 1,
      "explanation": "Big O notation is used to describe the upper bound of the time complexity or space complexity of an algorithm, helping developers understand how the algorithm's performance scales with input size."
    }
  ]
}

Instructions:
1. Create 4-6 multiple choice questions with varying difficulty levels
2. Each question should have 3-6 answer options (typically 4 options work best)
3. Ensure only one correct answer per question
4. Include plausible distractors (incorrect options that seem reasonable)
5. Provide clear, educational explanations for correct answers
6. Make questions test real understanding, not just memorization
7. Include a mix of:
   - Factual recall questions
   - Conceptual understanding questions
   - Application and analysis questions
   - Problem-solving questions
8. Set appropriate marks (1-3 marks based on difficulty)
9. Ensure questions are clear and unambiguous
10. Cover different aspects of the subject matter
11. Make explanations educational and help reinforce learning
12. Return ONLY valid JSON without additional formatting

Note: 
- sequence_no should increment for each question
- correct_answer should be the index (0-based) of the correct option
- Both options array with isCorrect flags and correct_answer index should be provided for compatibility
- Explanations should be concise but informative
- Question difficulty should be appropriate for the target audience`
}

const getBestOptionQuestionGeneratePrompt = (pdfText, userQuery) => {
  const hasContent = pdfText && pdfText.trim().length > 0;
  const hasQuery = userQuery && userQuery.trim().length > 0;

  let contentSection = "";
  if (hasContent && hasQuery) {
    contentSection = `PDF Content: ${pdfText}\nUser Requirements: ${userQuery}\n\nCreate best option questions based on both the PDF content and user requirements.`;
  } else if (hasContent) {
    contentSection = `PDF Content: ${pdfText}\n\nCreate best option questions based on the PDF content.`;
  } else if (hasQuery) {
    contentSection = `User Requirements: ${userQuery}\n\nCreate best option questions based on the user requirements.`;
  }

  return `You are an expert educational assessment designer. ${contentSection}

Generate 4–6 best option questions in the following JSON format:

{
  "bestOptionQuestions": [
    {
      "passage": "A complete educational passage (3–5 sentences). The correct answer words MUST appear exactly once in this passage — do NOT remove, replace, or duplicate them.",
      "selectedWords": [
        {
          "word": "correct_answer_word1",
          "position": 1,
          "options": ["correct_answer_word1", "wrong1", "wrong2", "wrong3"]
        },
        {
          "word": "correct_answer_word2", 
          "position": 2,
          "options": ["wrong1", "correct_answer_word2", "wrong2", "wrong3"]
        }
      ],
      "marks": 4
    }
  ]
}

**CRITICAL INSTRUCTIONS:**
1. The "passage" must include all correct answer words exactly once and in their original form.
2. Each object in "selectedWords" represents one blank in the question:
   - "word": The exact correct answer word from the passage
   - "position": The order/sequence (1-based) in which this word appears among the selected words in the passage (1 = first selected word, 2 = second selected word, etc.)
   - "options": Must contain EXACTLY ONE correct answer (the "word" value) and three plausible distractors
3. **CRUCIAL RULE:** For each selectedWords entry, the "options" array must contain ONLY ITS OWN correct answer. Other correct answers from the same passage must NOT appear as options in other selectedWords entries.
4. Distractors must be contextually plausible but clearly incorrect alternatives.
5. The correct answer must appear in random positions (0-3 array indices) within its own options array.
6. Ensure JSON is strictly valid — no extra comments or trailing commas.
7. Each question must be educationally sound and contextually consistent.
8. The "position" field indicates the sequential order of selected words as they appear in the passage.

**Example to clarify:**
If passage is: "The ESP8266 is a microcontroller that runs an SDK for Wi-Fi connectivity."
- "ESP8266" appears first → position: 1
- "SDK" appears second → position: 2
- "Wi-Fi" appears third → position: 3

**Options Rule Example:**
If passage has words "ESP8266" and "SDK" as correct answers:
- For "ESP8266" (position: 1): options include "ESP8266" + 3 wrong options like ["ESP8266", "Arduino", "Raspberry", "Microbit"]
- For "SDK" (position: 2): options include "SDK" + 3 DIFFERENT wrong options like ["SDK", "framework", "library", "API"]
- "ESP8266" must NOT appear in SDK's options, and "SDK" must NOT appear in ESP8266's options
`;
};

const getSummaryPassageQuestionGeneratePrompt = (pdfText, userQuery) => {
  const hasContent = pdfText && pdfText.trim().length > 0;
  const hasQuery = userQuery && userQuery.trim().length > 0;

  let contentSection = "";
  if (hasContent && hasQuery) {
    contentSection = `PDF Content: ${pdfText}\nUser Requirements: ${userQuery}\n\nCreate summary passage questions based on both the PDF content and user requirements.`;
  } else if (hasContent) {
    contentSection = `PDF Content: ${pdfText}\n\nCreate summary passage questions based on the PDF content.`;
  } else if (hasQuery) {
    contentSection = `User Requirements: ${userQuery}\n\nCreate summary passage questions based on the user requirements.`;
  }

  return `You are an educational assessment designer. ${contentSection}

Generate 4-6 summary passage questions in this JSON format:

{
  "summaryPassageQuestions": [
    {
      "passage": "Comprehensive educational passage for reading comprehension and summarization practice.",
      "timeLimit": 180
    }
  ]
}

Requirements:
- Each passage should be 150-250 words that explains, discusses, or details educational topics
- Passages should be self-contained explanatory texts, NOT ending with questions
- Students will read the passage and then be asked to write a summary of it
- Time limits: 120-220 seconds based on passage length
- Include diverse educational topics (science, history, literature, technology, etc.)
- Passages should be informative and comprehensive enough to practice summarization skills
- Return ONLY valid JSON without additional formatting`;
};

const getAudioScriptQuestionGeneratePrompt = (pdfText, userQuery) => {
  const hasContent = pdfText && pdfText.trim().length > 0;
  const hasQuery = userQuery && userQuery.trim().length > 0;

  let contentSection = "";
  if (hasContent && hasQuery) {
    contentSection = `PDF Content: ${pdfText}\nUser Requirements: ${userQuery}\n\nCreate audio script questions based on both the PDF content and user requirements.`;
  } else if (hasContent) {
    contentSection = `PDF Content: ${pdfText}\n\nCreate audio script questions based on the PDF content.`;
  } else if (hasQuery) {
    contentSection = `User Requirements: ${userQuery}\n\nCreate audio script questions based on the user requirements.`;
  }

  return `You are an educational content designer. ${contentSection}

Generate minimum 4-6 audio script questions in this JSON format:

{
  "audioScriptQuestions": [
    {
      "script": "Clear, well-structured spoken content for dictation practice, written in natural conversational tone as if being read aloud by a speaker. The content should be self-contained and informative."
    }
  ]
}

Important Requirements:
- Scripts should be 200-400 words (2-4 minutes speaking time)
- Write in natural, conversational tone suitable for audio presentation
- DO NOT include any references like "Unit 1", "Topic 1", "Chapter X" or similar structural labels
- DO NOT include instructions to the listener within the script
- The script should be a continuous, flowing narrative or explanation that students can listen to and then write down exactly what they heard
- Cover diverse educational topics but present them as standalone content
- Scripts should be clear, well-paced and suitable for dictation exercises
- Return ONLY valid JSON without additional formatting`;
};

const getImageScriptQuestionGeneratePrompt = (pdfText, userQuery) => {
  const hasContent = pdfText && pdfText.trim().length > 0;
  const hasQuery = userQuery && userQuery.trim().length > 0;

  let contentSection = "";
  if (hasContent && hasQuery) {
    contentSection = `PDF Content: ${pdfText}\nUser Requirements: ${userQuery}\n\nCreate image script questions based on both the PDF content and user requirements.`;
  } else if (hasContent) {
    contentSection = `PDF Content: ${pdfText}\n\nCreate image script questions based on the PDF content.`;
  } else if (hasQuery) {
    contentSection = `User Requirements: ${userQuery}\n\nCreate image script questions based on the user requirements.`;
  }

  return `You are an educational content designer. ${contentSection}

Generate minimum 4-6 image script questions in this JSON format:

{
  "imageScriptQuestions": [
    {
      "imagetoscript_prompt": "A detailed, specific prompt for generating an educational image that will be used for visual comprehension assessment",
      "imagetoscript_script": "A comprehensive, objective description of all visual elements in the image that will serve as the correct answer key for evaluation",
      "marks": 1
    }
  ]
}

Requirements for imagetoscript_prompt:
- Must be detailed and specific enough to generate a consistent educational image
- Include visual elements, style, composition, and educational context
- Focus on creating images suitable for academic/educational visual analysis
- Example: "A detailed scientific diagram of photosynthesis showing chloroplasts in a plant cell, with arrows indicating the flow of energy, sunlight, water, and carbon dioxide, in a clean educational style with labels"

Requirements for imagetoscript_script:
- Must be an objective, comprehensive description of all visual elements
- Should serve as the correct answer that students would provide after careful observation
- Include details about colors, spatial relationships, labels, and any text present
- Should be specific enough to evaluate student responses accurately
- Example: "The diagram shows a plant cell with chloroplasts containing thylakoid stacks. Arrows indicate: sunlight entering from top left, water (H2O) entering through roots, carbon dioxide (CO2) entering through stomata, and oxygen (O2) exiting. The light-dependent reactions occur in thylakoids producing ATP and NADPH, which power the Calvin cycle in the stroma where glucose is produced."

Additional Requirements:
- Each question should focus on visual analysis, interpretation, and comprehension skills
- Images should be suitable for academic/educational contexts
- Return ONLY valid JSON without additional formatting`;
};

const getArrangeOrderQuestionGeneratePrompt = (pdfText, userQuery) => {
  const hasContent = pdfText && pdfText.trim().length > 0;
  const hasQuery = userQuery && userQuery.trim().length > 0;

  let contentSection = "";
  if (hasContent && hasQuery) {
    contentSection = `PDF Content: ${pdfText}\nUser Requirements: ${userQuery}\n\nCreate arrange order questions based on both the PDF content and user requirements.`;
  } else if (hasContent) {
    contentSection = `PDF Content: ${pdfText}\n\nCreate arrange order questions based on the PDF content.`;
  } else if (hasQuery) {
    contentSection = `User Requirements: ${userQuery}\n\nCreate arrange order questions based on the user requirements.`;
  }

  return `You are an educational assessment designer. ${contentSection}

Generate 3-5 arrange order questions in the following JSON format:

{
  "arrangeOrderQuestions": [
    {
      "prompt": "Brief instruction or context for the arrange order question",
      "sentences": [
        "First sentence in correct logical order",
        "Second sentence in correct logical order", 
        "Third sentence in correct logical order",
        "Fourth sentence in correct logical order"
      ],
      "marks": 4
    }
  ]
}

Requirements:
- Create 4-6 sentences that form a coherent paragraph when placed in the correct logical order
- The sentences array must contain the sentences in their CORRECT logical order
- DO NOT shuffle or randomize the sentences - keep them in the proper sequence
- Students will receive these sentences in shuffled order and must arrange them back to the original correct sequence
- The sentences should be challenging but logically arrangeable
- Each set of sentences should form a meaningful paragraph when arranged correctly
- Return ONLY valid JSON without additional text`;
};

const getSpeakingQuestionGeneratePrompt = (pdfText, userQuery) => {
  const hasContent = pdfText && pdfText.trim().length > 0;
  const hasQuery = userQuery && userQuery.trim().length > 0;

  let contentSection = "";
  if (hasContent && hasQuery) {
    contentSection = `PDF Content: ${pdfText}\nUser Requirements: ${userQuery}\n\nCreate speaking practice questions based on both the PDF content and user requirements.`;
  } else if (hasContent) {
    contentSection = `PDF Content: ${pdfText}\n\nCreate speaking practice questions based on the PDF content.`;
  } else if (hasQuery) {
    contentSection = `User Requirements: ${userQuery}\n\nCreate speaking practice questions based on the user requirements.`;
  }

  return `You are an educational content designer specializing in language learning and speaking practice. ${contentSection}

Generate 4-6 speaking practice questions in this JSON format:

{
  "speakingQuestions": [
    {
      "speaking_question": "Engaging question prompt that encourages extended speaking practice (30-90 seconds response time)",
      "speaking_answer": "A sample answer demonstrating good language use, proper structure, and useful vocabulary",
      "marks": 5,
      "audioFile": "optional_speaking_prompt.mp3",
      "audio_script": "The exact script that should be spoken in the audio version of the question",
      "imageFile": "optional_visual_prompt.jpg",
      "image_prompt": "A detailed and clear description of the image that should be generated for this question"
    }
  ]
}

Requirements:
- Questions should encourage extended speaking (not just yes/no answers).
- Include only **one sample answer** for each question (not an array).
- The sample answer should be long enough to demonstrate natural spoken English.
- Questions can be about various topics: daily life, opinions, descriptions, scenarios.
- Some questions should **only be text-based**.
- If the question explicitly asks the learner to **listen first then speak**, include:
  - \`audioFile\` with placeholder name (e.g., "question_prompt.mp3")
  - \`audio_script\` (the text to be spoken in the audio).
- If the question explicitly asks the learner to **describe or explain an image**, include:
  - \`imageFile\` with placeholder name (e.g., "question_visual.jpg")
  - \`image_prompt\` (a descriptive prompt for generating the image).
- If the question requires **both audio and image**, include both sets of fields.
- If the question does **not** need audio or image, exclude those fields entirely.
- Marks should reflect question complexity (3-10 marks).
- Return ONLY valid JSON without additional formatting.`;
};

module.exports = {
  courseContentGenerater,
  courseContentGeneraterByType,
};
