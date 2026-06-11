const fs = require("fs").promises;
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { generateAudioFile } = require("./textToSpeechController");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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
          dataUrl: `data:${part.inlineData.mimeType || "image/png"};base64,${
            part.inlineData.data
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

const courseContentRegenerator = async (req, res, next) => {
  try {
    const {
      regenerationTargets, // Array of items to regenerate with their IDs and types
      userQuery,
      includeFiles = false, // Whether to use uploaded files for context
      contextData = {}, // Frontend state data containing parent, siblings, children
    } = req.body;

    // Validate regeneration targets
    if (!regenerationTargets || !Array.isArray(regenerationTargets)) {
      return res.status(400).json({
        error: "Regeneration targets are required as an array",
      });
    }

    // Process uploaded files if needed
    let allExtractedText = "";
    let fileProcessingResults = [];

    if (includeFiles && req.files && req.files.length > 0) {
      const extractionResults = await Promise.all(
        req.files.map((file) => extractTextFromFile(file))
      );

      extractionResults.forEach((result) => {
        fileProcessingResults.push({
          filename: result.filename,
          type: result.type,
          textLength: result.length,
          hasError: !!result.error,
        });

        if (result.text && !result.error) {
          allExtractedText += `\n\n--- Content from ${result.filename} ---\n${result.text}`;
        }
      });
    }

    // Process each regeneration target with provided context
    const regenerationResults = await processRegenerationTargets(
      regenerationTargets,
      userQuery,
      allExtractedText,
      contextData
    );

    // Generate course thumbnail images for regenerated course content
    let imageGenerationResults = [];

    // Check if any course content was regenerated and has image_generation_prompt
    if (regenerationResults && regenerationResults.course) {
      for (const courseItem of regenerationResults.course) {
        if (courseItem.image_generation_prompt) {

          try {
            // Create a unique filename for the regenerated course image
            const timestamp = Date.now();
            const courseSlug = courseItem.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "")
              .substring(0, 50);
            const fileName = `course-${courseSlug}-${timestamp}.png`;

            // Generate the image using Gemini (returns data directly)
            const imageResult = await generateImageWithGemini(
              courseItem.image_generation_prompt,
              fileName
            );

            if (imageResult.success) {
              // Add image data directly to course content
              courseItem.thumbnailData = {
                fileName: imageResult.fileName,
                mimeType: imageResult.mimeType,
                dataUrl: imageResult.dataUrl, // Ready to use in frontend
                base64: imageResult.data,
              };

              // Update thumbnail field for backwards compatibility
              courseItem.thumbnail = `/generated-images/${fileName}`;

              imageGenerationResults.push({
                success: true,
                courseId: courseItem.id,
                courseTitle: courseItem.title,
                fileName: imageResult.fileName,
                mimeType: imageResult.mimeType,
                size: imageResult.data.length,
                prompt: courseItem.image_generation_prompt,
              });
             
            } else {
              imageGenerationResults.push({
                success: false,
                courseId: courseItem.id,
                courseTitle: courseItem.title,
                error: imageResult.error,
                prompt: courseItem.image_generation_prompt,
              });
            }
          } catch (imageError) {
            console.error(
              `❌ Error during image regeneration for course ${courseItem.id}:`,
              imageError
            );
            imageGenerationResults.push({
              success: false,
              courseId: courseItem.id,
              courseTitle: courseItem.title,
              error: imageError.message,
              prompt: courseItem.image_generation_prompt,
            });
          }
        }
      }
    }

    // Clean up uploaded files
    await cleanupFiles(req.files);

    res.json({
      success: true,
      message: "Content regenerated successfully",
      data: regenerationResults, // Now includes thumbnailData for courses with regenerated images
      fileProcessingResults,
      imageGenerationResults: imageGenerationResults,
      filesProcessed: req.files ? req.files.length : 0,
      imagesGenerated: imageGenerationResults.filter((result) => result.success)
        .length,
      coursesWithRegeneratedImages: imageGenerationResults
        .filter((result) => result.success)
        .map((result) => ({
          courseId: result.courseId,
          courseTitle: result.courseTitle,
          fileName: result.fileName,
        })),
    });
  } catch (error) {
    console.error("Error regenerating content:", error);
    await cleanupFiles(req.files);
    next(error);
  }
};

// Process regeneration targets with provided context data
const processRegenerationTargets = async (
  targets,
  userQuery,
  extractedText,
  contextData
) => {
  const results = {};

  // Group targets by type for efficient processing
  const targetsByType = groupTargetsByType(targets);

  // Process each type in dependency order
  const processingOrder = ["course", "session", "module", "topic"];

  for (const type of processingOrder) {
    if (targetsByType[type]) {

      results[type] = await regenerateContentByType(
        type,
        targetsByType[type],
        userQuery,
        extractedText,
        contextData,
        results // Pass previous results for context
      );

      // Add delay to avoid rate limiting
      await delay(1000);
    }
  }

  return results;
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

// Regenerate content by specific type with provided context
const regenerateContentByType = async (
  contentType,
  targets,
  userQuery,
  extractedText,
  contextData,
  previousResults = {}
) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const regeneratedItems = [];

  for (const target of targets) {
    try {

      // Use provided context data instead of fetching from database
      const itemContext = buildContextFromProvidedData(
        contentType,
        target.id,
        contextData
      );

      // Generate context-aware prompt
      const prompt = getRegenerationPrompt(
        contentType,
        target,
        itemContext,
        userQuery,
        extractedText,
        previousResults
      );

      // Call AI model
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Parse and validate response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(
          `No valid JSON found in AI response for ${contentType} ${target.id}`
        );
      }

      const parsedContent = JSON.parse(jsonMatch[0]);
      const regeneratedItem = extractRegeneratedContent(
        parsedContent,
        contentType
      );

      if (regeneratedItem) {
        // Preserve original ID and relationships
        regeneratedItem.id = target.id;
        if (itemContext.parent_ids) {
          Object.assign(regeneratedItem, itemContext.parent_ids);
        }

        regeneratedItems.push(regeneratedItem);
      }

      // Add delay between individual items
      await delay(500);
    } catch (error) {
      console.error(
        `❌ Error regenerating ${contentType} ${target.id}:`,
        error.message
      );
      regeneratedItems.push({
        id: target.id,
        error: error.message,
        success: false,
      });
    }
  }

  // 🔊 AUDIO PROCESSING FOR TOPICS
  if (contentType === "topic" && regeneratedItems.length > 0) {

    try {
      // Filter out error items and process only successful regenerations
      const validTopics = regeneratedItems.filter((item) => !item.error);

      if (validTopics.length > 0) {
        const processedTopics = await processAudioByTopic(validTopics);

        // Replace valid topics with processed ones
        const finalItems = regeneratedItems.map((item) => {
          if (item.error) return item; // Keep error items as-is

          const processedTopic = processedTopics.find(
            (pt) => pt.id === item.id
          );
          return processedTopic || item;
        });

        return finalItems;
      }
    } catch (audioError) {
      console.error(
        `❌ Error processing audio for regenerated topics:`,
        audioError.message
      );
    }
  }

  return regeneratedItems;
};

// Build context from provided frontend data instead of database queries
const buildContextFromProvidedData = (contentType, itemId, contextData) => {
  const context = {
    current_item: null,
    parent_data: {},
    siblings: [],
    children: [],
    parent_ids: {},
  };

  try {
    // Find the current item in provided context data
    const targetData = contextData[itemId];
    if (!targetData) {
      throw new Error(`Context data not found for ${contentType} ${itemId}`);
    }

    context.current_item = targetData.current_item;
    context.parent_data = targetData.parent_data || {};
    context.siblings = targetData.siblings || [];
    context.children = targetData.children || [];

    // Build parent_ids based on content type and available parent data
    switch (contentType) {
      case "course":
        // Course is top level, no parent IDs needed
        break;

      case "session":
        if (context.parent_data.course) {
          context.parent_ids = { course_id: context.parent_data.course.id };
        }
        break;

      case "module":
        if (context.parent_data.course && context.parent_data.session) {
          context.parent_ids = {
            course_id: context.parent_data.course.id,
            session_id: context.parent_data.session.id,
          };
        }
        break;

      case "topic":
        if (
          context.parent_data.course &&
          context.parent_data.session &&
          context.parent_data.module
        ) {
          context.parent_ids = {
            course_id: context.parent_data.course.id,
            session_id: context.parent_data.session.id,
            module_id: context.parent_data.module.id,
          };
        }
        break;
    }

    return context;
  } catch (error) {
    console.error(
      `Error building context for ${contentType} ${itemId}:`,
      error
    );
    return context;
  }
};

// Generate context-aware regeneration prompts (unchanged)
const getRegenerationPrompt = (
  contentType,
  target,
  contextData,
  userQuery,
  extractedText,
  previousResults
) => {
  const baseContext = `
  REGENERATION CONTEXT:
  - Content Type: ${contentType}
  - Target ID: ${target.id}
  - User Query: ${userQuery || "No specific query provided"}
  - Regeneration Reason: ${target.reason || "User requested regeneration"}
  - Focus Areas: ${target.focus_areas?.join(", ") || "No specific focus areas"}
  
  CURRENT ITEM DATA:
  ${JSON.stringify(contextData.current_item, null, 2)}
  
  PARENT HIERARCHY:
  ${JSON.stringify(contextData.parent_data, null, 2)}
  
  SIBLING ITEMS (for context):
  ${JSON.stringify(contextData.siblings?.slice(0, 3), null, 2)}
  
  CHILDREN ITEMS (for context):
  ${JSON.stringify(contextData.children?.slice(0, 3), null, 2)}
  
  ${extractedText ? `ADDITIONAL CONTENT:\n${extractedText}` : ""}
  `;

  // Pass user requirements to prompt functions
  switch (contentType) {
    case "course":
      return getCourseRegenerationPrompt(
        baseContext,
        contextData,
        userQuery,
        target.reason,
        target.focus_areas
      );
    case "session":
      return getSessionRegenerationPrompt(
        baseContext,
        contextData,
        userQuery,
        target.reason,
        target.focus_areas
      );
    case "module":
      return getModuleRegenerationPrompt(
        baseContext,
        contextData,
        userQuery,
        target.reason,
        target.focus_areas
      );
    case "topic":
      return getTopicRegenerationPrompt(
        baseContext,
        contextData,
        userQuery,
        target.reason,
        target.focus_areas
      );
    default:
      throw new Error(
        `Unsupported content type for regeneration: ${contentType}`
      );
  }
};

// Utility functions (unchanged)
const groupTargetsByType = (targets) => {
  return targets.reduce((acc, target) => {
    if (!acc[target.type]) {
      acc[target.type] = [];
    }
    acc[target.type].push(target);
    return acc;
  }, {});
};

const extractRegeneratedContent = (parsedContent, contentType) => {
  // Extract the regenerated item from AI response
  const singular = contentType;
  const plural = contentType + "s";

  return (
    parsedContent[singular] ||
    (parsedContent[plural] && parsedContent[plural][0]) ||
    parsedContent
  );
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Specific regeneration prompts for each content type (unchanged)
const getCourseRegenerationPrompt = (
  baseContext,
  contextData,
  userQuery,
  reason,
  focusAreas
) => {
  const selectiveInstructions = generateSelectiveInstructions(
    userQuery,
    reason,
    focusAreas,
    "course"
  );

  return `${baseContext}
  
  You are regenerating a COURSE. ${selectiveInstructions.mainInstruction}
  
  Current course has ${contextData.children?.length || 0} sessions.
  
  ${selectiveInstructions.restrictionRules}
  
  SELECTIVE REGENERATION RULES:
  ${selectiveInstructions.fieldRestrictions}
  
  Generate ${selectiveInstructions.scope} course in JSON format:
  {
    "course": {
      "id": "${contextData.current_item?.id}",
      "title": "${
        selectiveInstructions.shouldModify("title")
          ? "Improved course title based on requirements"
          : contextData.current_item?.title
      }",
      "description": "${
        selectiveInstructions.shouldModify("description")
          ? "Enhanced description that aligns with requirements"
          : contextData.current_item?.description
      }",
      "category_id": "${contextData.current_item?.category_id}",
      "thumbnail": "/course/thumbnail/default.jpg",
      "preview_video": "/course/preview_video/default.mp4",
      "price": "${
        selectiveInstructions.shouldModify("price")
          ? "Updated price based on requirements"
          : contextData.current_item?.price || "149.99"
      }",
      "discount": "${
        selectiveInstructions.shouldModify("discount")
          ? "Updated discount based on requirements"
          : contextData.current_item?.discount || "25"
      }",
      "duration_hours": "${
        selectiveInstructions.shouldModify("duration")
          ? "Updated duration based on requirements"
          : contextData.current_item?.duration_hours || "25"
      }",
      "expiry_days": "${contextData.current_item?.expiry_days || "365"}",
      "status": "${contextData.current_item?.status || "draft"}",
      "what_you_will_learn": ${
        selectiveInstructions.shouldModify("learning_outcomes")
          ? `[
          "Improved learning outcome based on requirements",
          "Enhanced learning outcome aligned with changes",
          "Additional practical skill development",
          "Advanced technique mastery",
          "Real-world application capability",
          "Professional competency enhancement"
        ]`
          : JSON.stringify(contextData.current_item?.what_you_will_learn || [])
      },
      "prerequisites": ${
        selectiveInstructions.shouldModify("prerequisites")
          ? `[
          "Updated prerequisite based on requirements",
          "Enhanced prerequisite aligned with changes",
          "Recommended background knowledge"
        ]`
          : JSON.stringify(contextData.current_item?.prerequisites || [])
      },
      "hashtags": ${
        selectiveInstructions.shouldModify("hashtags")
          ? `[
          "relevant-hashtag-based-on-requirements",
          "updated-hashtag-aligned-with-changes",
          "skill-development",
          "practical-learning",
          "course-theme-based"
        ]`
          : JSON.stringify(contextData.current_item?.hashtags || [])
      },
      "max_access_hours": "${
        contextData.current_item?.max_access_hours || "24"
      }",
      "min_access_hours": "${
        contextData.current_item?.min_access_hours || "2"
      }",
      "image_generation_prompt": "${
        selectiveInstructions.shouldModify("thumbnail")
          ? "Updated professional course thumbnail prompt based on requirements and changes"
          : contextData.current_item?.image_generation_prompt ||
            "Professional course thumbnail prompt"
      }"
    }
  }

  ${
    selectiveInstructions.shouldModify("thumbnail")
      ? `
  IMAGE GENERATION PROMPT REQUIREMENTS:
  1. THUMBNAIL DESIGN: Create a detailed prompt for generating an attractive, professional course thumbnail based on the specific requirements
  2. VISUAL ELEMENTS: The image_generation_prompt should describe elements aligned with the requested changes
  3. Focus on the areas specified in requirements: ${
    focusAreas?.join(", ") || "general improvements"
  }
  `
      : ""
  }

  CRITICAL INSTRUCTIONS:
  - Return ONLY valid JSON without any additional text, explanations, or formatting
  - ${selectiveInstructions.preservationRule}
  - Only modify fields that are specifically requested or affected by the requirements
  - Maintain all existing relationships and IDs
  - If no specific field changes are requested, preserve original values
  - Focus modifications only on: ${selectiveInstructions.allowedFields.join(
    ", "
  )}
  
  Return ONLY valid JSON.`;
};

const getSessionRegenerationPrompt = (
  baseContext,
  contextData,
  userQuery,
  reason,
  focusAreas
) => {
  const selectiveInstructions = generateSelectiveInstructions(
    userQuery,
    reason,
    focusAreas,
    "session"
  );

  return `${baseContext}
  
  You are regenerating a SESSION within the course: "${
    contextData.parent_data.course?.title
  }"
  
  ${selectiveInstructions.mainInstruction}
  
  Current session has ${contextData.children?.length || 0} modules.
  Course has ${contextData.siblings?.length || 0} total sessions.
  
  SELECTIVE REGENERATION RULES:
  ${selectiveInstructions.fieldRestrictions}
  
  Generate ${selectiveInstructions.scope} session in JSON format:
  {
    "session": {
      "id": "${contextData.current_item?.id}",
      "course_id": "${contextData.current_item?.course_id}",
      "title": "${
        selectiveInstructions.shouldModify("title")
          ? "Improved session title based on requirements"
          : contextData.current_item?.title
      }",
      "chapter_description": "${
        selectiveInstructions.shouldModify("description")
          ? "Enhanced session description based on requirements"
          : contextData.current_item?.chapter_description
      }",
      "status": "${
        selectiveInstructions.shouldModify("status")
          ? "Updated status based on requirements"
          : contextData.current_item?.status || "active"
      }",
      "min_time_in_minute": ${
        selectiveInstructions.shouldModify("duration")
          ? "Updated duration based on requirements"
          : contextData.current_item?.min_time_in_minute || 45
      }
    }
  }
  
  CRITICAL INSTRUCTIONS:
  - ${selectiveInstructions.preservationRule}
  - Only modify fields that are specifically requested: ${selectiveInstructions.allowedFields.join(
    ", "
  )}
  - Maintain existing relationships and IDs
  
  Return ONLY valid JSON.`;
};

const getModuleRegenerationPrompt = (
  baseContext,
  contextData,
  userQuery,
  reason,
  focusAreas
) => {
  const selectiveInstructions = generateSelectiveInstructions(
    userQuery,
    reason,
    focusAreas,
    "module"
  );

  return `${baseContext}
  
  You are regenerating a MODULE within:
  - Course: "${contextData.parent_data.course?.title}"
  - Session: "${contextData.parent_data.session?.title}"
  
  ${selectiveInstructions.mainInstruction}
  
  Current module has ${contextData.children?.length || 0} topics.
  Session has ${contextData.siblings?.length || 0} total modules.
  
  SELECTIVE REGENERATION RULES:
  ${selectiveInstructions.fieldRestrictions}
  
  Generate ${selectiveInstructions.scope} module in JSON format:
  {
    "module": {
      "id": ${contextData.current_item?.id},
      "course_id": ${contextData.current_item?.course_id},
      "session_id": ${contextData.current_item?.session_id},
      "title": "${
        selectiveInstructions.shouldModify("title")
          ? "Improved module title based on requirements"
          : contextData.current_item?.title
      }",
      "description": "${
        selectiveInstructions.shouldModify("description")
          ? "Enhanced module description based on requirements"
          : contextData.current_item?.description
      }",
      "duration_hours": ${
        selectiveInstructions.shouldModify("duration")
          ? "Updated duration based on requirements"
          : contextData.current_item?.duration_hours || 3
      },
      "status": "${
        selectiveInstructions.shouldModify("status")
          ? "Updated status based on requirements"
          : contextData.current_item?.status || "active"
      }"
    }
  }
  
  CRITICAL INSTRUCTIONS:
  - ${selectiveInstructions.preservationRule}
  - Only modify fields that are specifically requested: ${selectiveInstructions.allowedFields.join(
    ", "
  )}
  - Maintain existing relationships and IDs
  
  Return ONLY valid JSON.`;
};

const getTopicRegenerationPrompt = (
  baseContext,
  contextData,
  userQuery,
  reason,
  focusAreas
) => {
  const selectiveInstructions = generateSelectiveInstructions(
    userQuery,
    reason,
    focusAreas,
    "topic"
  );

  return `${baseContext}
  
  You are regenerating a TOPIC within:
  - Course: "${contextData.parent_data.course?.title}"
  - Session: "${contextData.parent_data.session?.title}"  
  - Module: "${contextData.parent_data.module?.title}"
  
  ${selectiveInstructions.mainInstruction}
  
  Module has ${contextData.siblings?.length || 0} total topics.
  Current topic type: ${contextData.current_item?.content_type}
  
  ⚠️ CRITICAL REQUIREMENTS:
  - Maintain the same content_type: ${contextData.current_item?.content_type}
  - ${selectiveInstructions.preservationRule}
  - Only modify fields that are specifically requested: ${selectiveInstructions.allowedFields.join(
    ", "
  )}
  
  SELECTIVE REGENERATION RULES:
  ${selectiveInstructions.fieldRestrictions}
  
  AUDIO SCRIPT REGENERATION:
  ${
    selectiveInstructions.shouldModify("audio")
      ? `
  - Generate/update audio scripts for requested audio elements
  - Follow existing audio script guidelines
  - Focus audio improvements on: ${
    focusAreas?.filter((area) => area.includes("audio")).join(", ") ||
    "general audio enhancement"
  }
  `
      : `
  - PRESERVE all existing audio scripts and audio URLs
  - Do NOT regenerate audio content unless specifically requested
  - Maintain current audio_script values exactly as they are
  `
  }
  
  CONTENT STRUCTURE PRESERVATION:
  ${
    selectiveInstructions.shouldModify("content")
      ? `
  - Update content structure based on specific requirements
  - Maintain content_type: ${contextData.current_item?.content_type}
  - Focus content changes on: ${
    focusAreas?.filter((area) => !area.includes("audio")).join(", ") ||
    "requested areas only"
  }
  `
      : `
  - PRESERVE existing content structure completely
  - Do NOT modify video URLs, code examples, or material unless specifically requested
  - Maintain all existing IDs and relationships
  `
  }

  Generate ${
    selectiveInstructions.scope
  } topic following the exact structure for content_type: ${
    contextData.current_item?.content_type
  }
  
  [Include appropriate content type structure here - same as original but with selective modification logic]
  
  FINAL REQUIREMENTS:
  1. ${selectiveInstructions.preservationRule}
  2. Only regenerate specifically requested fields: ${selectiveInstructions.allowedFields.join(
    ", "
  )}
  3. Maintain existing IDs and relationships
  4. Preserve content_type and overall structure
  5. Return ONLY valid JSON without additional text
  6. Focus improvements only on areas specified in requirements
  
  Return ONLY valid JSON.`;
};

// Helper function to generate selective instructions
const generateSelectiveInstructions = (
  userQuery,
  reason,
  focusAreas,
  contentType
) => {
  const instructions = {
    allowedFields: [],
    shouldModify: (field) => false,
    mainInstruction: "",
    restrictionRules: "",
    fieldRestrictions: "",
    preservationRule: "",
    scope: "selectively improved",
  };

  // Parse user requirements to determine what should be modified
  const requirements = parseUserRequirements(userQuery, reason, focusAreas);

  instructions.allowedFields = requirements.fields;
  instructions.shouldModify = (field) =>
    requirements.fields.includes(field) || requirements.modifyAll;

  if (requirements.modifyAll) {
    instructions.mainInstruction =
      "Improve all aspects of the content based on provided requirements.";
    instructions.scope = "completely improved";
    instructions.preservationRule =
      "Improve all fields while maintaining structure and relationships";
  } else if (requirements.fields.length > 0) {
    instructions.mainInstruction = `Focus ONLY on modifying: ${requirements.fields.join(
      ", "
    )}. Preserve all other fields exactly as they are.`;
    instructions.restrictionRules = `
    RESTRICTION: Only the following fields should be modified: ${requirements.fields.join(
      ", "
    )}
    ALL OTHER FIELDS must remain exactly the same as current values.
    `;
    instructions.fieldRestrictions = `
    - Modify ONLY: ${requirements.fields.join(", ")}
    - PRESERVE unchanged: All other fields not in the above list
    - Use existing values for preserved fields
    `;
    instructions.preservationRule = `PRESERVE all fields except: ${requirements.fields.join(
      ", "
    )}`;
  } else {
    instructions.mainInstruction =
      "No specific modifications requested. Preserve all existing content.";
    instructions.preservationRule =
      "PRESERVE all existing fields and values exactly as they are";
    instructions.scope = "preserved";
  }

  return instructions;
};

// Helper function to parse user requirements and determine what fields to modify
const parseUserRequirements = (userQuery, reason, focusAreas) => {
  const requirements = {
    fields: [],
    modifyAll: false,
  };

  // Combine all user inputs
  const allRequirements = [userQuery, reason, ...(focusAreas || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!allRequirements || allRequirements.trim() === "") {
    return requirements; // No modifications requested
  }

  // Field mapping for different content types
  const fieldMappings = {
    // Common fields
    title: ["title", "name", "heading"],
    description: ["description", "desc", "summary", "overview"],
    content: ["content", "body", "material", "text"],
    duration: ["duration", "time", "length", "hours", "minutes"],
    status: ["status", "state", "active", "inactive"],
    price: ["price", "cost", "pricing", "fee"],
    discount: ["discount", "offer", "sale"],
    learning_outcomes: [
      "learning",
      "outcomes",
      "learn",
      "skills",
      "objectives",
    ],
    prerequisites: ["prerequisites", "requirements", "prereq"],
    hashtags: ["hashtags", "tags", "keywords"],
    thumbnail: ["thumbnail", "image", "picture", "visual"],
    audio: ["audio", "script", "voice", "sound"],
    video: ["video", "film", "recording"],
    code: ["code", "programming", "script", "example"],
  };

  // Check for "all", "everything", "complete" keywords
  if (/\b(all|everything|complete|entire|full|whole)\b/.test(allRequirements)) {
    requirements.modifyAll = true;
    return requirements;
  }

  // Check for specific field mentions
  for (const [field, keywords] of Object.entries(fieldMappings)) {
    for (const keyword of keywords) {
      if (allRequirements.includes(keyword)) {
        if (!requirements.fields.includes(field)) {
          requirements.fields.push(field);
        }
      }
    }
  }

  // If no specific fields found but there are requirements, modify common fields
  if (requirements.fields.length === 0 && allRequirements.length > 0) {
    requirements.fields = ["title", "description"]; // Default to basic fields
  }

  return requirements;
};

module.exports = {
  courseContentRegenerator,
  processRegenerationTargets,
  buildContextFromProvidedData,
};
