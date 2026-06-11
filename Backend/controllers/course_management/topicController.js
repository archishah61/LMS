const { Accordion } = require("../../models/content_management/accordian");
const {
  AccordionAttachment,
} = require("../../models/content_management/accordionAttachment");
const { Audio } = require("../../models/content_management/audio");
const { GeneralMaterial } = require("../../models/content_management/genral");
const { Material } = require("../../models/content_management/material");
const { MultiSlideGeneral } = require("../../models/content_management/multiSlideGeneral");
const { Video } = require("../../models/content_management/video");
const Module = require("../../models/course_management/module");
const Topic = require("../../models/course_management/topic");
const { MultiSlide } = require("../../models/content_management/multi_slide");

const { callProcedure } = require("../../utils/procedure/callProcedure");
const sequelize = require("../../config/db");
const Validation = require("../../validations");
const path = require("path");

// Helper to build stored material URL paths aligned with existing static routes in index.js
// typeScope: 'general' | 'slide-general'
// materialType: pdf | image | document | other | link

function buildMaterialUrl(filename, materialType = '', scope = 'material') {
  if (!filename) return null;

  // Already absolute/external path → just return it
  if (filename.includes('/') || filename.includes('\\')) return filename;

  // Scope handling (default: "material")
  if (scope === 'material' || scope === 'slide_material' || scope === 'slide-general') {
    let segment;
    switch (materialType) {
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
      return `/slide_material/${segment}/${filename}`;
    } else {
      return `/material/${segment}/${filename}`;
    }
  }
  return `/material/others/${filename}`;
}

function getRequestScalar(value) {
  return Array.isArray(value) ? value[value.length - 1] : value;
}

function parseRequestNumber(value, fallback = 0) {
  const scalarValue = getRequestScalar(value);

  if (scalarValue === undefined || scalarValue === null || scalarValue === "") {
    return fallback;
  }

  const parsedValue = parseFloat(scalarValue);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function normalizeMinuteSecondInput(value, fallback = 0) {
  const scalarValue = getRequestScalar(value);
  if (scalarValue === undefined || scalarValue === null || scalarValue === "") {
    return fallback;
  }

  const valueAsString = String(scalarValue).trim();
  const parsedValue = parseFloat(valueAsString);
  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return fallback;
  }

  if (valueAsString.includes(":")) {
    const [mPart, sPart] = valueAsString.split(":");
    const mm = parseInt(mPart, 10);
    const ss = parseInt(sPart, 10);
    if (Number.isFinite(mm) && Number.isFinite(ss) && ss >= 0 && ss <= 59) {
      return parseFloat((mm + ss / 60).toFixed(2));
    }
  }

  return parseFloat(parsedValue.toFixed(2));
}

const createTopic = async (req, res, next) => {
  try {
    const userId = req.user.id
    const role = req.user.role

    let { module_id, title, description, content_type, content, languages } = req.body;

    // Convert accordion to accordian if needed
    if (content_type === "accordion") {
      content_type = "accordian"
    }

    // Validate required fields
    Validation.isNonEmptyString(module_id, "Module ID is required.");
    Validation.isNonEmptyString(title, "Title is required.");
    Validation.isNonEmptyString(description, "Description is required.");
    Validation.isNonEmptyString(content_type, "Content type is required.");

    // Validate content type
    const allowedContentTypes = ["video", "audio", "accordian", "general", "slide"];
    Validation.isEnum(content_type, allowedContentTypes, "Invalid content type.");

    // Basic validation
    if (!description) {
      return res.status(400).json({ message: "Topic description is required" })
    }

    // Prepare tags data
    let tagsData = null
    if (req.body.tags) {
      let rawTags = req.body.tags
      if (typeof rawTags === "string") {
        try {
          rawTags = JSON.parse(rawTags)
        } catch (err) {
          console.error("Failed to parse tags JSON:", err)
          return res.status(400).json({ error: "Invalid tags format" })
        }
      }

      // Enhanced logging for debugging tag processing

      // Process tags to ensure code tags have a language and proper tag_type
      if (Array.isArray(rawTags)) {
        rawTags = rawTags.map(tag => {
          // Make sure tag_type is explicitly set to proper value
          if (tag.tag_type === 'code') {

            // Ensure code language is set
            if (!tag.codeLanguage || tag.codeLanguage === '') {
              tag.codeLanguage = 'python';
            }


            // Make sure the tag_type is explicitly 'code'
            return {
              ...tag,
              tag_type: 'code',
              codeLanguage: tag.codeLanguage
            };
          }
          return tag;
        });
      }

      tagsData = JSON.stringify(rawTags)
    }

    // Optional materials array (only for general topics at root level)
    let materialsArray = null;
    let slideMaterialsArr = null;

    if (req.body.materials) {
      try {
        materialsArray = typeof req.body.materials === 'string' ? JSON.parse(req.body.materials) : req.body.materials;
        if (!Array.isArray(materialsArray)) materialsArray = null;
      } catch (e) {
        return res.status(400).json({ error: "Invalid materials JSON" });
      }
    }

    let materialsData = null
    if (req.body.materials) {

      // 1. Keep existing materials from body (link, code, etc.)
      let materials = req.body.materials ? JSON.parse(req.body.materials) : [];

      // 2. Replace file placeholders ("material[x]") with actual URLs
      materials = materials.map((m) => {
        // skip link & code → they already have correct data
        if (m.material_type === "link" || m.material_type === "code") {
          return m;
        }

        // If url looks like "material[x]" and we have a matching file
        if (m.url && req.files[m.url]) {
          const file = req.files[m.url][0]; // multer puts array of files
          let type = "others";
          const ext = path.extname(file.originalname).toLowerCase();

          if (ext === ".pdf") {
            type = "pdf";
          } else if (file.mimetype && file.mimetype.startsWith("image/")) {
            type = "image";
          } else {
            const docExts = new Set([
              ".doc",
              ".docx",
              ".txt",
              ".rtf",
              ".odt",
              ".ppt",
              ".pptx",
              ".xls",
              ".xlsx",
              ".html",
              ".text",
            ]);
            if (docExts.has(ext)) {
              type = "document";
            } else {
              type = "others";
            }
          }

          return {
            ...m,
            url: buildMaterialUrl(file.filename, type, "material"),
          };
        }

        return m; // unchanged if no file match
      });

      // 3. Also add any extra files from req.files that weren’t in body
      Object.keys(req.files || {}).forEach((key) => {
        if (key.startsWith("material[")) {
          const file = req.files[key][0];
          // Check if already replaced in step 2
          const exists = materials.some((m) => m.url && m.url.includes(file.filename));
          if (!exists) {
            let type = "others";
            const ext = path.extname(file.originalname).toLowerCase();

            if (ext === ".pdf") {
              type = "pdf";
            } else if (file.mimetype && file.mimetype.startsWith("image/")) {
              type = "image";
            } else {
              const docExts = new Set([
                ".doc",
                ".docx",
                ".txt",
                ".rtf",
                ".odt",
                ".ppt",
                ".pptx",
                ".xls",
                ".xlsx",
                ".html",
                ".text",
              ]);
              if (docExts.has(ext)) {
                type = "document";
              } else {
                type = "others";
              }
            }

            materials.push({
              id: null,
              material_type: type,
              url: buildMaterialUrl(file.filename, type, "material"),
              code: null,
              codeLanguage: null,
            });
          }
        }
      });

      materialsData = JSON.stringify(materials)
    }

    // Prepare content data
    let contentData = null
    let extra_duration =
      content_type === "slide"
        ? 0
        : normalizeMinuteSecondInput(req.body.extra_duration);
    let topic_duration = 0;
    let total_duration = 0;
    let slide_extra_duration_total = 0;

    if (content) {
      // Parse content as JSON if it's a string
      let parsedContent = content
      if (typeof content === "string") {
        try {
          parsedContent = JSON.parse(content)
        } catch (err) {
          console.error("Failed to parse content JSON:", err)
          return res.status(400).json({ error: "Invalid content format" })
        }
      }

      // Strict validation for content based on content_type using Validation.js
      try {
        switch (content_type) {
          case "video": {
            Validation.isNonEmptyString(parsedContent.video_type, "video_type is required in content for video type.")
            if (parsedContent.video_type === "youtube") {
              Validation.isNonEmptyString(req.body.videoUrl, "videoUrl (YouTube URL) is required for video_type 'youtube'.")
              Validation.isURL(req.body.videoUrl, "Invalid YouTube URL.")
            }
            Validation.isNonEmptyString(parsedContent.duration_minutes, "videoDuration is required in content for video type.")
            break
          }
          case "audio": {
            Validation.isNonEmptyString(parsedContent.duration_minutes, "audioDuration is required in content for audio type.")
            break
          }
          case "accordian": {
            Validation.isArray(parsedContent, { min: 1 }, "content must be a non-empty array for accordian type.")
            parsedContent.forEach((section, i) => {
              Validation.isNonEmptyString(section.title, `Section ${i + 1}: title is required and must be a string.`)
              Validation.isNonEmptyString(section.body, `Section ${i + 1}: body is required and must be a string.`)
            })
            break
          }
          case "general": {
            Validation.isNonEmptyString(parsedContent.title, "title is required in content for general type.")
            Validation.isNonEmptyString(parsedContent.description, "Description is required in content for general type.")
            // materials now optional & embedded later
            break
          }
          case "slide": {
            Validation.isArray(parsedContent, { min: 1 }, "content must be a non-empty array for slide type.")
            parsedContent.forEach((slide, i) => {
              Validation.isNonEmptyString(slide.title, `Slide ${i + 1}: title is required and must be a string.`)
              Validation.isNonEmptyString(slide.content_type, `Slide ${i + 1}: content_type is required and must be a string.`)
            })
            break
          }
          default:
            return res.status(400).json({ error: `Unknown content_type: ${content_type}` })
        }
      } catch (e) {
        return res.status(400).json({ error: e.message })
      }

      // --- DURATION CALCULATION ---
      // Calculate topic_duration based on content_type
      if (content_type === "video") {
        // For video: use duration_minutes from video content
        topic_duration = normalizeMinuteSecondInput(parsedContent.duration_minutes);
      } else if (content_type === "audio") {
        // For audio: use duration_minutes from audio content
        topic_duration = normalizeMinuteSecondInput(parsedContent.duration_minutes);
      } else if (content_type === "general") {
        // For general: check completion_type (audio or timer)
        if (parsedContent.completion_type === "timer") {
          // Timer: use completion_time (in minutes)
          topic_duration = normalizeMinuteSecondInput(parsedContent.completion_time);
        } else {
          // Audio: use generalAudioDuration from request body
          topic_duration = normalizeMinuteSecondInput(req.body.generalAudioDuration ?? req.body.topic_duration);
        }
      } else if (content_type === "accordian") {
        // For accordion: sum all accordion sections' durations
        topic_duration = (parsedContent || []).reduce((sum, section) => {
          let sectionDur = 0;
          if (section.accordianCompletionType === "timer") {
            // Timer: use accordianCompletionTime (in minutes)
            sectionDur = normalizeMinuteSecondInput(section.accordianCompletionTime);
          } else {
            // Audio: use accordianAudioDuration (in minutes)
            sectionDur = normalizeMinuteSecondInput(section.accordianAudioDuration);
          }
          return sum + sectionDur;
        }, 0);
      } else if (content_type === "slide") {
        // For slide: calculate duration for each slide based on its content_type
        topic_duration = (parsedContent || []).reduce((sum, slide) => {
          let slide_duration = 0;
          
          if (slide.content_type === "video") {
            // Slide video: use videoDuration (in minutes)
            slide_duration = normalizeMinuteSecondInput(slide.videoDuration);
          } else if (slide.content_type === "audio") {
            // Slide audio: use audioDuration (in minutes)
            slide_duration = normalizeMinuteSecondInput(slide.audioDuration);
          } else if (slide.content_type === "accordian") {
            if (slide.slideCompletionType === "timer") {
              slide_duration = normalizeMinuteSecondInput(slide.slideCompletionTime);
            } else {
              const slideLevelAudioDuration = normalizeMinuteSecondInput(
                slide.audioDuration
              );
              if (Number.isFinite(slideLevelAudioDuration)) {
                slide_duration = slideLevelAudioDuration;
              } else {
                // Fallback for legacy payloads that store per-section durations.
                slide_duration = (slide.accordianSections || []).reduce((accSum, accSec) => {
                  let accDur = 0;
                  if (accSec.accordianCompletionType === "timer") {
                    accDur = normalizeMinuteSecondInput(accSec.accordianCompletionTime);
                  } else {
                    accDur = normalizeMinuteSecondInput(accSec.accordianAudioDuration);
                  }
                  return accSum + accDur;
                }, 0);
              }
            }
          } else if (slide.content_type === "general") {
            // Slide general: check slideCompletionType (audio or timer)
            if (slide.slideCompletionType === "timer") {
              slide_duration = normalizeMinuteSecondInput(slide.slideCompletionTime);
            } else {
              slide_duration = normalizeMinuteSecondInput(slide.audioDuration);
            }
          }
          
          // Get slide extra duration (editable by user)
          let sExtra = normalizeMinuteSecondInput(slide.slide_extra_duration);
          // Calculate total slide duration
          let totalSlideDur = slide_duration + sExtra;
          slide_extra_duration_total += sExtra;
          
          // Store calculated durations back into the slide object for persistence in DB
          slide.slide_duration = parseFloat(slide_duration.toFixed(2));
          slide.slide_extra_duration = parseFloat(sExtra.toFixed(2));
          slide.total_slide_duration = parseFloat(totalSlideDur.toFixed(2));
          
          // topic_duration stores required/base duration only for slide topics.
          return sum + slide_duration;
        }, 0);
      }
      
      // Calculate total duration (topic_duration + extra_duration)
      total_duration = parseFloat((topic_duration + extra_duration + slide_extra_duration_total).toFixed(2));
      // -----------------------------

      if (content_type === "general" && parsedContent && typeof parsedContent === "object") {
        parsedContent.duration_minutes =
          parsedContent.completion_type === "audio"
            ? normalizeMinuteSecondInput(req.body.generalAudioDuration ?? parsedContent.duration_minutes)
            : 0;
      }

      contentData = JSON.stringify(parsedContent);

      // Build slideMaterials array for slide content: for each slide, resolve materials file placeholders to URLs
      if (content_type === 'slide' && Array.isArray(parsedContent)) {
        slideMaterialsArr = parsedContent.map((slide, sIdx) => {
          const mats = Array.isArray(slide.materials) ? slide.materials.map((m, mIdx) => {
            if (!m || !m.material_type) return null;

            // Handle link and code materials
            if (m.material_type === 'link') {
              return { id: m.id || null, material_type: 'link', url: m.link || m.url || null, code: null, codeLanguage: null };
            }
            if (m.material_type === 'code') {
              return { id: m.id || null, material_type: 'code', url: null, code: m.code || '', codeLanguage: m.codeLanguage || 'python' };
            }

            // For file-based materials, prefer explicit file_field if present
            const fieldName = m.file_field || `slide_material[${sIdx}][${mIdx}]`;
            if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
              const file = req.files[fieldName][0];

              const ext = path.extname(file.originalname).toLowerCase();
              let type = 'others';
              if (ext === '.pdf') type = 'pdf';
              else if (file.mimetype && file.mimetype.startsWith('image/')) type = 'image';
              else {
                const docExts = new Set(['.doc', '.docx', '.txt', '.rtf', '.odt', '.ppt', '.pptx', '.xls', '.xlsx', '.html', '.text']);
                if (docExts.has(ext)) type = 'document';
                else type = 'others';
              }

              return {
                id: m.id || null,
                material_type: m.material_type || type,
                url: buildMaterialUrl(file.filename, type, 'slide_material'),
                code: null,
                codeLanguage: null
              };
            }

            // If no uploaded file matched, keep original entry if it has a url
            return {
              id: m.id || null,
              material_type: m.material_type,
              url: m.url || m.link || null,
              code: m.code || null,
              codeLanguage: m.codeLanguage || null
            };
          }).filter(Boolean) : [];

          // Handle extra files for this slide
          // if (req.files) {
          //   Object.keys(req.files).forEach((key) => {
          //     const re = new RegExp(`^slide_material\\[${sIdx}\\]\\[(\\d+)\\]$`);
          //     const match = key.match(re);
          //     if (match) {
          //       const file = req.files[key][0];
          //       const alreadyExists = mats.some((mm) => mm.url && mm.url.includes(file.filename));
          //       if (!alreadyExists) {
          //         const ext = path.extname(file.originalname).toLowerCase();
          //         let type = 'others';
          //         if (ext === '.pdf') type = 'pdf';
          //         else if (file.mimetype && file.mimetype.startsWith('image/')) type = 'image';
          //         else {
          //           const docExts = new Set(['.doc', '.docx', '.txt', '.rtf', '.odt', '.ppt', '.pptx', '.xls', '.xlsx', '.html', '.text']);
          //           if (docExts.has(ext)) type = 'document';
          //           else type = 'others';
          //         }
          //         mats.push({
          //           id: null,
          //           material_type: type,
          //           url: buildMaterialUrl(file.filename, type, 'slide-general'),
          //           code: null,
          //           codeLanguage: null
          //         });
          //       }
          //     }
          //   });
          // }


          return { slide_index: sIdx, materials: mats };
        });
      }



    }


    // Prepare files data - FIXED FILE HANDLING
    let filesData = null
    if (req.files) {
      const filesObj = {}
      if (req.files.material) filesObj.material = req.files.material[0].filename

      // Handle different file types based on content type
      if (content_type === "video") {
        if (req.files.videoUrl) {
          filesObj.videoUrl = req.files.videoUrl[0].filename;
        } else if (req.body.videoUrl) {
          filesObj.videoUrl = req.body.videoUrl;
        }
        if (req.files.videoAudioUrl) filesObj.videoAudioUrl = req.files.videoAudioUrl[0].filename
      } else if (content_type === "audio") {
        if (req.files.audioUrl) filesObj.audioUrl = req.files.audioUrl[0].filename
        if (req.files.audioImageUrl) filesObj.imageUrl = req.files.audioImageUrl[0].filename
      } else if (content_type === "general") {
        if (req.files.generalAudioUrl) filesObj.generalAudioUrl = req.files.generalAudioUrl[0].filename
      } else if (content_type === "accordian") {
        // Handle accordion audio files - FIXED
        filesObj.accordionAudioUrls = {}
        Object.keys(req.files).forEach((key) => {
          if (key.startsWith("accordionAudioUrls[")) {
            const match = key.match(/\[(\d+)\]/)
            if (match) {
              filesObj.accordionAudioUrls[match[1]] = req.files[key][0].filename
            }
          }
        })

        filesObj.accordionAttachments = {};
        Object.keys(req.files).forEach((fieldKey) => {
          if (fieldKey.startsWith('accordionAttachment')) {
            const match = fieldKey.match(/^accordionAttachment\[(\d+)]\[(\d+)]$/);
            if (match) {
              const sectionIndex = match[1]; // e.g., "0", "1", "2"

              if (!filesObj.accordionAttachments[sectionIndex]) {
                filesObj.accordionAttachments[sectionIndex] = [];
              }

              req.files[fieldKey].forEach((file) => {
                filesObj.accordionAttachments[sectionIndex].push({
                  filename: file.filename,
                  mimetype: file.mimetype,
                });
              });
            }
          }
        });

      } else if (content_type === "slide") {
        // Handle slide files - FIXED
        filesObj.slide_files = {}

        Object.keys(req.files).forEach((fieldKey) => {
          // Un comment it for adding Slide Type Audios Audio File
          // const match = fieldKey.match(/^slide_(video|audio|general|accordion)\[(\d+)]$/);

          const match = fieldKey.match(/^slide_(video|general|accordion)\[(\d+)]$/);
          if (match) {
            const slideIndex = match[2]; // slide index as string, like '0', '1', '2'

            if (!filesObj.slide_files[slideIndex]) {
              filesObj.slide_files[slideIndex] = {};
            }

            req.files[fieldKey].forEach((file) => {
              filesObj.slide_files[slideIndex] = file.filename;
            });
          } else {
            // Handle accordion files: slide_accordion[slideIndex][accordionIndex][fileIndex]
            const accMatch = fieldKey.match(/^slide_accordion\[(\d+)]\[(\d+)]\[(\d+)]$/);
            if (accMatch) {
              const slideIndex = accMatch[1];
              const sectionIndex = accMatch[2]; // accordion index

              if (!filesObj.slide_files[slideIndex]) {
                filesObj.slide_files[slideIndex] = {};
              }

              if (!filesObj.slide_files[slideIndex][sectionIndex]) {
                filesObj.slide_files[slideIndex][sectionIndex] = [];
              }

              req.files[fieldKey].forEach((file) => {
                filesObj.slide_files[slideIndex][sectionIndex].push(file.filename);
              });
            }
          }
        });

        filesObj.slideAudioUrl = {}

        // Handle slide audio URLs - FIXED
        Object.keys(req.files).forEach((key) => {
          if (key.startsWith("slideAudioUrl[")) {
            const match = key.match(/\[(\d+)\]/)
            if (match) {
              filesObj.slideAudioUrl[match[1]] = req.files[key][0].filename
            }
          }
        })
        // Attach slideMaterialsArr if built earlier
        if (typeof slideMaterialsArr !== 'undefined' && slideMaterialsArr !== null) {
          filesObj.slideMaterials = slideMaterialsArr;
        }
      }

      // Handle tag files - FIXED
      filesObj.tagFiles = {}
      Object.keys(req.files).forEach((key) => {
        if (key.startsWith("tagFile[")) {
          const match = key.match(/\[(\d+)\]/)
          if (match) {
            filesObj.tagFiles[match[1]] = {
              filename: req.files[key][0].filename,
              mimetype: req.files[key][0].mimetype,
            }
          }
        }
      })

      filesData = JSON.stringify(filesObj)

    }

    const parsedLanguages = languages ? JSON.parse(languages) : [];

    // Call the stored procedure (SP now handles inserting materials for general via embedded JSON)
    const result = await sequelize.query(`CALL CreateTopicWithContent(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, {
      replacements: [
        module_id, title.trim(), description, content_type, userId, role, tagsData, materialsData, contentData, filesData, JSON.stringify(parsedLanguages), topic_duration, extra_duration, total_duration
      ],
      type: sequelize.QueryTypes.SELECT,
    })

    const topicResult = result[0]['0']

    return res.status(201).json({
      message: topicResult.message,
      topic: {
        id: topicResult.topic_id,
        public_hash: topicResult.public_hash,
      },
    })
  } catch (error) {
    // console.error("Error creating topic:", error)

    // Handle specific error types from stored procedure
    if (error.message && error.message.includes("E404|NotFoundError|")) {
      return res.status(404).json({
        message: error.message.split("|")[2] || "Resource not found",
      })
    } else if (error.message && error.message.includes("E400|ValidationError|")) {
      return res.status(400).json({
        message: error.message.split("|")[2] || "Validation error",
      })
    }

    next(error)
  }
}

const updateTopic = async (req, res, next) => {
  try {

    const userId = req.user.id;
    const role = req.user.role

    const { id } = req.params; // public_hash
    let {
      module_id,
      title,
      description,
      content_type,
      sequence_no,
      content,
      tags,
      tagFile,
      languages
    } = req.body;

    // Validate required fields
    if (module_id) Validation.isNonEmptyString(module_id, "Module ID must be a non-empty string.");
    if (title) Validation.isNonEmptyString(title, "Title must be a non-empty string.");
    if (description) Validation.isNonEmptyString(description, "Description must be a non-empty string.");
    if (content_type) {
      const allowedContentTypes = ["video", "audio", "accordian", "general", "slide"];
      Validation.isEnum(content_type, allowedContentTypes, "Invalid content type.");
    }

    // Parse tags if it's a string
    tags = tags ? JSON.parse(tags) : null;

    // Process tags to include code content for code-type tags
    if (tags && Array.isArray(tags)) {
      tags = tags.map((tag, index) => {
        if (tag.tag_type === 'code') {
          // If tagFile array exists and has content at this index, use it as code content
          const codeContent = tagFile && tagFile[index] ? tagFile[index] : null;
          return {
            ...tag,
            tagFile: codeContent // Store the code content in tagFile
          };
        }
        return tag;
      });
    }

    // Prepare files information as a JSON object
    const filesData = {};

    // Handle file uploads based on content_type
    if (req.files) {
      filesData.tagFilesJson = [];

      Object.keys(req.files).forEach((key) => {
        if (key.startsWith("tagFile[")) {
          const match = key.match(/\[(\d+)\]/);
          if (match) {
            const index = parseInt(match[1], 10); // get numeric index

            // Ensure the array is big enough
            filesData.tagFilesJson[index] = {
              filename: req.files[key][0].filename,
              mimetype: req.files[key][0].mimetype,
            };
          }
        }
      });

      // For video content type
      if (content_type === 'video') {
        // Get the video type from the request body
        const videoType = req.body.video_type || 'internal';
        // Store video type in filesData
        filesData.video_type = videoType;

        if (req.files.videoUrl && req.files.videoUrl[0]) {
          filesData.videoUrl = req.files.videoUrl[0].filename;
        } else if (videoType === 'youtube' && req.body.videoUrl) {
          // If it's a YouTube video, store the URL directly
          // Handle case where videoUrl might be an array
          if (Array.isArray(req.body.videoUrl)) {
            // Use the first non-null value in the array
            const validUrl = req.body.videoUrl.find(url => url && url !== 'null');
            filesData.videoUrl = validUrl || '';
          } else {
            filesData.videoUrl = req.body.videoUrl;
          }
        }

        if (req.files.videoAudioUrl && req.files.videoAudioUrl[0]) {
          filesData.videoAudioUrl = req.files.videoAudioUrl[0].filename;
        }
      }
      // For audio content type
      else if (content_type === 'audio') {
        if (req.files.audioUrl && req.files.audioUrl[0]) filesData.audioUrl = req.files.audioUrl[0].filename;
        if (req.files.audioImageUrl && req.files.audioImageUrl[0]) filesData.imageUrl = req.files.audioImageUrl[0].filename;
      }
      // For general content type
      else if (content_type === 'general') {
        if (req.files.generalMaterial && req.files.generalMaterial[0]) {
          filesData.url = req.files.generalMaterial[0].filename;
        }
        if (req.files.generalAudioUrl && req.files.generalAudioUrl[0]) {
          filesData.audio_url = req.files.generalAudioUrl[0].filename;
        }
      }
      // For accordion content type
      else if (content_type === 'accordian') {
        filesData.accordionAudioUrls = [];
        filesData.accordionAttachments = [];

        // Handle accordion audio files
        Object.keys(req.files).forEach((key) => {
          const generalAudioRegex = /^slideGeneralAudioUrl\[(\d+)\]$/;
          const match = key.match(generalAudioRegex);
          if (match) {
            const slideIndex = parseInt(match[1]);
            req.files[key].forEach((file) => {
              if (!filesData.general_audio_url) {
                filesData.general_audio_url = [];
              }
              filesData.general_audio_url[slideIndex] = file.filename;
            });
          }
        });

        // Handle accordion audio URLs
        Object.keys(req.files).forEach((key) => {
          if (key.startsWith('accordionAudioUrls[')) {
            const match = key.match(/accordionAudioUrls\[(\d+)\]/);
            if (match) {
              const index = parseInt(match[1], 10);
              req.files[key].forEach((file) => {
                filesData.accordionAudioUrls[index] = file.filename;
              });
            }
          }
        });

        // Handle accordion attachments
        Object.keys(req.files).forEach((key) => {
          const match = key.match(/accordionAttachment\[(\d+)\]\[(\d+)\]/);
          if (match) {
            const outerIndex = parseInt(match[1], 10);
            const innerIndex = parseInt(match[2], 10);
            if (!filesData.accordionAttachments[outerIndex]) {
              filesData.accordionAttachments[outerIndex] = [];
            }
            filesData.accordionAttachments[outerIndex][innerIndex] = {
              filename: req.files[key][0].filename,
              mimetype: req.files[key][0].mimetype,
              path: req.files[key][0].path,
            };
          }
        });
      }
      // For slide content type
      else if (content_type === 'slide') {
        // Initialize the array to store slide audio URLs
        filesData.slideAudioUrl = [];
        filesData.slide_video_url = [];
        // filesData.slide_audio_url = []; // uncomment to add Slide Type Audio
        filesData.slide_general_url = [];
        filesData.accordion_audio_url = [];
        filesData.slideAccordionAttachments = [];
        filesData.general_audio_url = [];
        filesData.video_audio_url = [];

        // Loop through all keys in req.files
        Object.keys(req.files).forEach((key) => {
          // Handle slide audio files
          const slideAudioRegex = /^slideAudioUrl\[(\d+)\]$/;
          const slideAudioMatch = key.match(slideAudioRegex);
          if (slideAudioMatch) {
            const slideIndex = parseInt(slideAudioMatch[1]);
            req.files[key].forEach((file) => {
              filesData.slideAudioUrl[slideIndex] = file.filename;
            });
          }

          // Handle slide video files
          const slideVideoRegex = /^slide_video\[(\d+)\]$/;
          const slideVideoMatch = key.match(slideVideoRegex);
          if (slideVideoMatch) {
            const slideIndex = parseInt(slideVideoMatch[1]);
            req.files[key].forEach((file) => {
              filesData.slide_video_url[slideIndex] = file.filename;
            });
          }

          // uncomment to add Slide Type Audio
          // Handle slide audio files
          // const slideAudioAudioRegex = /^slide_audio\[(\d+)\]$/;
          // const slideAudioAudioMatch = key.match(slideAudioAudioRegex);
          // if (slideAudioAudioMatch) {
          //   const slideIndex = parseInt(slideAudioAudioMatch[1]);
          //   req.files[key].forEach((file) => {
          //     filesData.slide_audio_url[slideIndex] = file.filename;
          //   });
          // }

          // Handle slide general files
          const slideGeneralRegex = /^slide_general\[(\d+)\]$/;
          const slideGeneralMatch = key.match(slideGeneralRegex);
          if (slideGeneralMatch) {
            const slideIndex = parseInt(slideGeneralMatch[1]);
            req.files[key].forEach((file) => {
              filesData.slide_general_url[slideIndex] = file.filename;
            });
          }

          // Handle accordion audio files
          const accordionAudioRegex = /^slideAccordionAudioUrls\[(\d+)\]\[(\d+)\]$/;
          const accordionAudioMatch = key.match(accordionAudioRegex);
          if (accordionAudioMatch) {
            const slideIndex = parseInt(accordionAudioMatch[1]);
            const accordionIndex = parseInt(accordionAudioMatch[2]);
            if (!filesData.accordion_audio_url[slideIndex]) {
              filesData.accordion_audio_url[slideIndex] = [];
            }
            req.files[key].forEach((file) => {
              filesData.accordion_audio_url[slideIndex][accordionIndex] = file.filename;
            });
          }

          // Handle accordion attachments
          const multislideAttachmentRegex = /^multislideAccordionAttachment\[(\d+)\]\[(\d+)\]\[(\d+)\]$/;
          const multislideAttachmentMatch = key.match(multislideAttachmentRegex);
          if (multislideAttachmentMatch) {
            const slideIndex = parseInt(multislideAttachmentMatch[1]);
            const accordionIndex = parseInt(multislideAttachmentMatch[2]);
            const fileIndex = parseInt(multislideAttachmentMatch[3]);
            if (!filesData.slideAccordionAttachments[slideIndex]) {
              filesData.slideAccordionAttachments[slideIndex] = [];
            }
            if (!filesData.slideAccordionAttachments[slideIndex][accordionIndex]) {
              filesData.slideAccordionAttachments[slideIndex][accordionIndex] = [];
            }
            req.files[key].forEach((file) => {
              filesData.slideAccordionAttachments[slideIndex][accordionIndex][fileIndex] = {
                filename: file.filename,
                mimetype: file.mimetype,
                path: file.path,
              };
            });
          }

          // Handle general audio files
          const generalAudioRegex = /^slideGeneralAudioUrl\[(\d+)\]$/;
          const generalAudioMatch = key.match(generalAudioRegex);
          if (generalAudioMatch) {
            const slideIndex = parseInt(generalAudioMatch[1]);
            req.files[key].forEach((file) => {
              filesData.general_audio_url[slideIndex] = file.filename;
            });
          }

          // Handle video audio files
          const videoAudioRegex = /^slideVideoAudioUrl\[(\d+)\]$/;
          const videoAudioMatch = key.match(videoAudioRegex);
          if (videoAudioMatch) {
            const slideIndex = parseInt(videoAudioMatch[1]);
            req.files[key].forEach((file) => {
              filesData.video_audio_url[slideIndex] = file.filename;
            });
          }
        });
      }
    }

    // Parse content if it's a string
    if (content && typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch (error) {
        console.error("Error parsing content:", error);
        return res.status(400).json({ message: "Invalid content format" });
      }
    }

    // Strict validation for content based on content_type using Validation.js and frontend field names
    try {
      switch (content_type) {
        case "video": {
          Validation.isNonEmptyString(req.body.video_type, "video_type is required in content for video type.");

          // Validate video type and URL
          if (req.body.video_type === "youtube") {
            // Handle videoUrl in req.body which might be an array or a string
            let videoUrl = req.body.videoUrl;

            if (Array.isArray(videoUrl)) {
              // Find the first non-null, non-empty value
              videoUrl = videoUrl.find(url => url && url !== 'null') || '';
            }

            Validation.isNonEmptyString(videoUrl, "videoUrl (YouTube URL) is required for video_type 'youtube'.");
            Validation.isURL(videoUrl, "Invalid YouTube URL.");

            // Update content.videoUrl for further processing
            if (!content.videoUrl && videoUrl) {
              content.videoUrl = videoUrl;
            }
          }

          Validation.isNonEmptyString(content.duration_minutes, "videoDuration is required in content for video type.");
          break;
        }
        case "audio": {
          Validation.isNonEmptyString(content.duration_minutes, "audioDuration is required in content for audio type.");
          break;
        }
        case "accordian": {
          content.forEach((section, i) => {
            Validation.isNonEmptyString(section.title, `Section ${i + 1}: title is required and must be a string.`);
            Validation.isNonEmptyString(section.body, `Section ${i + 1}: body is required and must be a string.`);
          });
          break;
        }
        case "general": {
          Validation.isNonEmptyString(content.description, "Description is required in content for general type.");
          // Keep legacy single-material fields backward compatible but do not force presence.
          break;
        }
        case "slide": {
          content.forEach((slide, i) => {
            Validation.isNonEmptyString(slide.title, `Slide ${i + 1}: title is required and must be a string.`);
            Validation.isNonEmptyString(slide.content_type, `Slide ${i + 1}: content_type is required and must be a string.`);
          });
          break;
        }
        default:
          return res.status(400).json({ error: `Unknown content_type: ${content_type}` });
      }
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    // Validate content format based on content_type
    if (content_type === 'accordian' && (!Array.isArray(content))) {
      return res.status(400).json({
        message: "Invalid accordion content format. Expected an array."
      });
    }

    if (content_type === 'slide' && (!Array.isArray(content))) {
      return res.status(400).json({
        message: "Invalid slide content format. Expected an array."
      });
    }

    for (let i = 0; i < tags?.length; i++) {
      const tagData = tags[i]; // assumed to be object with tagName, tagFile, tag_type
      const tagName = tagData.tagName || tags[i]; // fallback in case it's a string
    }

    // 1. Keep existing materials from body (link, code, etc.)
    let materials = [];

    if (req.body.materials) {
      materials = JSON.parse(req.body.materials);

      // 2. Replace file placeholders ("material[x]") with actual URLs
      materials = materials.map((m) => {
        // skip link & code → they already have correct data
        if (m.material_type === "link" || m.material_type === "code") {
          return m;
        }

        // If url looks like "material[x]" and we have a matching file
        if (m.url && req.files[m.url]) {
          const file = req.files[m.url][0]; // multer puts array of files
          let type = "others";
          const ext = path.extname(file.originalname).toLowerCase();

          if (ext === ".pdf") {
            type = "pdf";
          } else if (file.mimetype && file.mimetype.startsWith("image/")) {
            type = "image";
          } else {
            const docExts = new Set([
              ".doc",
              ".docx",
              ".txt",
              ".rtf",
              ".odt",
              ".ppt",
              ".pptx",
              ".xls",
              ".xlsx",
              ".html",
              ".text",
            ]);
            if (docExts.has(ext)) {
              type = "document";
            } else {
              type = "others";
            }
          }

          return {
            ...m,
            url: buildMaterialUrl(file.filename, type, "material"),
          };
        }

        return m; // unchanged if no file match
      });

      // 3. Also add any extra files from req.files that weren’t in body
      Object.keys(req.files || {}).forEach((key) => {
        if (key.startsWith("material[")) {
          const file = req.files[key][0];
          // Check if already replaced in step 2
          const exists = materials.some((m) => m.url && m.url.includes(file.filename));
          if (!exists) {
            let type = "others";
            const ext = path.extname(file.originalname).toLowerCase();

            if (ext === ".pdf") {
              type = "pdf";
            } else if (file.mimetype && file.mimetype.startsWith("image/")) {
              type = "image";
            } else {
              const docExts = new Set([
                ".doc",
                ".docx",
                ".txt",
                ".rtf",
                ".odt",
                ".ppt",
                ".pptx",
                ".xls",
                ".xlsx",
                ".html",
                ".text",
              ]);
              if (docExts.has(ext)) {
                type = "document";
              } else {
                type = "others";
              }
            }

            materials.push({
              id: null,
              material_type: type,
              url: buildMaterialUrl(file.filename, type, "material"),
              code: null,
              codeLanguage: null,
            });
          }


        }
      });
    }

    // Parse the content array from req.body
    if (content_type === 'slide') {
      // Process each slide in content
      content = content.map((slide, slideIndex) => {
        if (slide.materials && Array.isArray(slide.materials)) {
          // Process materials for this slide
          let updatedMaterials = slide.materials.map((material, materialIndex) => {
            // Skip link & code - they already have correct data
            if (material.material_type === "link" || material.material_type === "code") {
              return material;
            }

            // If url is a file placeholder like "slide_material[0][3]" and we have matching file
            if (material.url && material.url.startsWith('slide_material[') && req.files[material.url]) {
              const file = req.files[material.url][0];
              let type = "others";
              const ext = path.extname(file.originalname).toLowerCase();

              if (ext === ".pdf") {
                type = "pdf";
              } else if (file.mimetype && file.mimetype.startsWith("image/")) {
                type = "image";
              } else {
                const docExts = new Set([
                  ".doc", ".docx", ".txt", ".rtf", ".odt",
                  ".ppt", ".pptx", ".xls", ".xlsx", ".html", ".text"
                ]);
                if (docExts.has(ext)) {
                  type = "document";
                } else {
                  type = "others";
                }
              }

              return {
                ...material,
                url: buildMaterialUrl(file.filename, type, "slide_material"),
              };
            }

            return material; // unchanged if no file match
          });

          // Add any extra files from req.files that weren't in the materials array
          Object.keys(req.files || {}).forEach((key) => {
            if (key.startsWith(`slide_material[${slideIndex}][`)) {
              const file = req.files[key][0];
              // Check if already processed in step above
              const exists = updatedMaterials.some(m => m.url && m.url.includes(file.filename));
              if (!exists) {
                let type = "others";
                const ext = path.extname(file.originalname).toLowerCase();

                if (ext === ".pdf") {
                  type = "pdf";
                } else if (file.mimetype && file.mimetype.startsWith("image/")) {
                  type = "image";
                } else {
                  const docExts = new Set([
                    ".doc", ".docx", ".txt", ".rtf", ".odt",
                    ".ppt", ".pptx", ".xls", ".xlsx", ".html", ".text"
                  ]);
                  if (docExts.has(ext)) {
                    type = "document";
                  } else {
                    type = "others";
                  }
                }

                updatedMaterials.push({
                  id: null,
                  material_type: type,
                  url: buildMaterialUrl(file.filename, type, "slide_material"),
                  code: "",
                  codeLanguage: "",
                });
              }
            }
          });

          // Return the slide with updated materials
          return {
            ...slide,
            materials: updatedMaterials
          };
        }

        return slide; // Return unchanged if no materials
      });
    }

    // let slideMaterialsArr = [];
    // // Loop through uploaded slide material files
    // Object.keys(req.files || {}).forEach((key) => {
    //   if (key.startsWith("slide_material[")) {
    //     const match = key.match(/\[(\d+)\]\[(\d+)\]/); // slide index, material index
    //     if (match) {
    //       const slideIndex = parseInt(match[1]);
    //       const materialIndex = parseInt(match[2]);
    //       const file = req.files[key][0];
    //       const ext = path.extname(file.originalname).toLowerCase();
    //       let type = "others";

    //       if (ext === ".pdf") type = "pdf";
    //       else if (file.mimetype.startsWith("image/")) type = "image";
    //       else if (file.mimetype.startsWith("video/")) type = "video";
    //       else if (file.mimetype.startsWith("audio/")) type = "audio";
    //       else type = "document";

    //       // Ensure slideMaterialsArr[slideIndex] exists
    //       if (!slideMaterialsArr[slideIndex]) {
    //         slideMaterialsArr[slideIndex] = { slide_index: slideIndex, materials: [] };
    //       }

    //       slideMaterialsArr[slideIndex].materials.push({
    //         id: null,
    //         material_type: type,
    //         url: buildMaterialUrl(file.filename, type, "slide_material"),
    //         code: null,
    //         codeLanguage: null,
    //       });
    //     }
    //   }
    // });

    // // Attach to filesData for SP
    // if (slideMaterialsArr.length > 0) {
    //   filesData.slideMaterials = slideMaterialsArr;
    // }

    const parsedLanguages = languages ? JSON.parse(languages) : [];

    // --- DURATION CALCULATION FOR UPDATE ---
    let extra_duration =
      content_type === "slide"
        ? 0
        : normalizeMinuteSecondInput(req.body.extra_duration);
    let topic_duration = 0;
    let slide_extra_duration_total = 0;
    
    // Calculate topic_duration based on content_type
    if (content_type === "video") {
      // For video: use duration_minutes from video content
      topic_duration = normalizeMinuteSecondInput(content.duration_minutes);
    } else if (content_type === "audio") {
      // For audio: use duration_minutes from audio content
      topic_duration = normalizeMinuteSecondInput(content.duration_minutes);
    } else if (content_type === "general") {
      // For general: check completion_type (audio or timer)
      if (content.completion_type === "timer") {
        // Timer: use completion_time (in minutes)
        topic_duration = normalizeMinuteSecondInput(content.completion_time);
      } else {
        // Audio: use generalAudioDuration from request body
        topic_duration = normalizeMinuteSecondInput(req.body.generalAudioDuration ?? req.body.topic_duration);
      }
    } else if (content_type === "accordian") {
      // For accordion: sum all accordion sections' durations
      topic_duration = (content || []).reduce((sum, section) => {
        let sectionDur = 0;
        if (section.accordianCompletionType === "timer") {
          // Timer: use accordianCompletionTime (in minutes)
          sectionDur = normalizeMinuteSecondInput(section.accordianCompletionTime);
        } else {
          // Audio: use accordianAudioDuration (in minutes)
          sectionDur = normalizeMinuteSecondInput(section.accordianAudioDuration);
        }
        return sum + sectionDur;
      }, 0);
    } else if (content_type === "slide") {
      // For slide: calculate duration for each slide based on its content_type
      topic_duration = (content || []).reduce((sum, slide) => {
        let slide_duration = 0;
        
        if (slide.content_type === "video") {
          // Slide video: use videoDuration (in minutes)
          slide_duration = normalizeMinuteSecondInput(slide.videoDuration);
        } else if (slide.content_type === "audio") {
          // Slide audio: use audioDuration (in minutes)
          slide_duration = normalizeMinuteSecondInput(slide.audioDuration);
        } else if (slide.content_type === "accordian") {
            if (slide.slideCompletionType === "timer") {
              slide_duration = normalizeMinuteSecondInput(slide.slideCompletionTime);
            } else {
              const slideLevelAudioDuration = normalizeMinuteSecondInput(
                slide.audioDuration
              );
              if (Number.isFinite(slideLevelAudioDuration)) {
                slide_duration = slideLevelAudioDuration;
              } else {
                // Fallback for legacy payloads that store per-section durations.
                slide_duration = (slide.accordianSections || []).reduce((accSum, accSec) => {
                  let accDur = 0;
                  if (accSec.accordianCompletionType === "timer") {
                    accDur = normalizeMinuteSecondInput(accSec.accordianCompletionTime);
                  } else {
                    accDur = normalizeMinuteSecondInput(accSec.accordianAudioDuration);
                  }
                  return accSum + accDur;
                }, 0);
              }
            }
        } else if (slide.content_type === "general") {
          // Slide general: check slideCompletionType (audio or timer)
          if (slide.slideCompletionType === "timer") {
            slide_duration = normalizeMinuteSecondInput(slide.slideCompletionTime);
          } else {
              slide_duration = normalizeMinuteSecondInput(slide.audioDuration);
          }
        }
        
        // Get slide extra duration (editable by user)
        let sExtra = normalizeMinuteSecondInput(slide.slide_extra_duration);
        // Calculate total slide duration
        let totalSlideDur = slide_duration + sExtra;
        slide_extra_duration_total += sExtra;
        
        // Store calculated durations back into the slide object for persistence in DB
        slide.slide_duration = parseFloat(slide_duration.toFixed(2));
        slide.slide_extra_duration = parseFloat(sExtra.toFixed(2));
        slide.total_slide_duration = parseFloat(totalSlideDur.toFixed(2));
        
        // topic_duration stores required/base duration only for slide topics.
        return sum + slide_duration;
      }, 0);
    }
    
    // Calculate total duration (topic_duration + extra_duration)
    let total_duration = parseFloat((topic_duration + extra_duration + slide_extra_duration_total).toFixed(2));
    // -----------------------------

    if (content_type === "general" && content && typeof content === "object") {
      content.duration_minutes =
        content.completion_type === "audio"
          ? normalizeMinuteSecondInput(req.body.generalAudioDuration ?? content.duration_minutes)
          : 0;
    }

    // Execute the stored procedure
    const [results] = await sequelize.query(
      'CALL UpdateTopicWithContent(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      {
        replacements: [
          id, // public_hash
          module_id || null,
          title.trim() || null,
          description || null,
          content_type || null,
          sequence_no || null,
          userId,
          tags ? typeof tags === "string" ? tags : JSON.stringify(tags) : null,
          materials ? typeof materials === "string" ? materials : JSON.stringify(materials) : null,
          content ? JSON.stringify(content) : null,
          Object.keys(filesData).length > 0 ? JSON.stringify(filesData) : null,
          role,
          JSON.stringify(parsedLanguages),
          topic_duration,
          extra_duration,
          total_duration
        ]
      }
    );

    // // Post-update materials handling (since Update SP not yet modified for materials):
    // // General topic materials passed via req.body.materials (optional)
    // if (content_type === 'general') {
    //   const materialsProvided = Object.prototype.hasOwnProperty.call(req.body, 'materials');
    //   const filesProvided = req.files && Object.keys(req.files).some(k => k.startsWith('generalMaterial[') || k === 'generalMaterial');
    //   if (materialsProvided || filesProvided) {
    //     let updateMaterials = [];
    //     if (materialsProvided) {
    //       try { updateMaterials = typeof req.body.materials === 'string' ? JSON.parse(req.body.materials) : req.body.materials; } catch (e) { updateMaterials = []; }
    //       if (!Array.isArray(updateMaterials)) updateMaterials = [];
    //     }

    //     // Map uploaded files by index pattern generalMaterial[index]
    //     if (req.files && updateMaterials.length) {
    //       updateMaterials = updateMaterials.map((m, idx) => {
    //         if (m && m.material_type && m.material_type !== 'link') {
    //           const field = `generalMaterial[${idx}]`;
    //           if (req.files[field] && req.files[field][0]) {
    //             return { ...m, url: buildMaterialUrl(req.files[field][0].filename, 'general', m.material_type) };
    //           }
    //           if (idx === 0 && req.files.generalMaterial && req.files.generalMaterial[0]) {
    //             return { ...m, url: buildMaterialUrl(req.files.generalMaterial[0].filename, 'general', m.material_type) };
    //           }
    //         }
    //         return m;
    //       });
    //     }

    //     // Filter: ensure we don't create rows without URLs
    //     updateMaterials = (updateMaterials || []).filter(m => {
    //       if (!m || !m.material_type) return false;
    //       if (m.material_type === 'link') return !!m.url;
    //       return !!m.url;
    //     });

    //     // Persist (destroy always when materials explicitly provided; supports clearing with empty array)
    //     // const topicRow = await Topic.findOne({ where: { public_hash: id } });
    //     // if (topicRow) {
    //     //   const gm = await GeneralMaterial.findOne({ where: { topic_id: topicRow.id } });
    //     //   if (gm) {
    //     //     await Material.destroy({ where: { topic_general_id: gm.id } });
    //     //     const bulk = (updateMaterials || []).map(m => ({
    //     //       topic_general_id: gm.id,
    //     //       material_type: m.material_type,
    //     //       url: m.url || null,
    //     //       created_by: userId,
    //     //       updated_by: userId,
    //     //       created_by_type: role,
    //     //       updated_by_type: role
    //     //     }));
    //     //     if (bulk.length) await Material.bulkCreate(bulk);
    //     //   }
    //     // }
    //   }
    // }

    // // Slide general materials: expect materials embedded inside content slides for update; we replace entirely per slide
    // if (content_type === 'slide' && Array.isArray(content)) {
    //   // fetch slides to map payload by slide id when available
    //   const topicRow = await Topic.findOne({ where: { public_hash: id } });
    //   if (topicRow) {
    //     const slides = await MultiSlide.findAll({ where: { topic_id: topicRow.id }, order: [['id', 'ASC']] });
    //     // Create a map by id for reliable lookup
    //     const slidesById = new Map(slides.map(s => [String(s.id), s]));
    //     for (let i = 0; i < content.length; i++) {
    //       const slidePayload = content[i];
    //       if (slidePayload.content_type === 'general' && Array.isArray(slidePayload.materials)) {
    //         // Prefer mapping by explicit id from payload, fallback to index order
    //         const targetSlide = slidePayload.id ? slidesById.get(String(slidePayload.id)) : slides[i];
    //         if (!targetSlide) continue;
    //         const generalSlideRow = await MultiSlideGeneral.findOne({ where: { multi_slide_id: targetSlide.id } });
    //         if (generalSlideRow) {
    //           await Material.destroy({ where: { slide_general_id: generalSlideRow.id } });

    //           // Map any uploaded files for this slide general materials using pattern slide_general[slideIndex][materialIndex]
    //           let slideMats = slidePayload.materials;
    //           if (req.files) {
    //             slideMats = slideMats.map((m, mIdx) => {
    //               if (m && m.material_type && m.material_type !== 'link') {
    //                 const field = `slide_general[${i}][${mIdx}]`;
    //                 if (req.files[field] && req.files[field][0]) {
    //                   return { ...m, url: buildMaterialUrl(req.files[field][0].filename, 'slide-general', m.material_type) };
    //                 }
    //               }
    //               return m;
    //             });
    //           }

    //           // Filter valid materials only
    //           slideMats = (slideMats || []).filter(m => {
    //             if (!m || !m.material_type) return false;
    //             if (m.material_type === 'link') return !!m.url;
    //             return !!m.url;
    //           });

    //           const bulkSlide = slideMats.map(m => ({
    //             slide_general_id: generalSlideRow.id,
    //             material_type: m.material_type,
    //             url: m.url || null,
    //             created_by: userId,
    //             updated_by: userId,
    //             created_by_type: role,
    //             updated_by_type: role
    //           }));
    //           if (bulkSlide.length) await Material.bulkCreate(bulkSlide);
    //         }
    //       }
    //     }
    //   }
    // }


    // Fetch the updated topic to return in the response
    const topic = await Topic.findOne({
      where: { public_hash: id },
      include: [
        {
          model: Module,
          attributes: ['id', 'title']
        }
      ]
    });

    if (!topic) {
      return res.status(404).json({ message: "Topic not found after update" });
    }

    // Depending on content_type, fetch additional content data
    let contentData = null;

    if (content_type === 'video') {
      const videoData = await Video.findOne({ where: { topic_id: topic.id } });
      contentData = videoData;
    } else if (content_type === 'audio') {
      const audioData = await Audio.findOne({ where: { topic_id: topic.id } });
      contentData = audioData;
    } else if (content_type === 'general') {
      const generalData = await GeneralMaterial.findOne({ where: { topic_id: topic.id } });
      contentData = generalData;
    } else if (content_type === 'accordian') {
      const accordionData = await Accordion.findAll({
        where: { topic_id: topic.id },
        order: [['id', 'ASC']]
      });
      contentData = accordionData;
    } else if (content_type === 'slide') {
      // For slides, include all related content based on slide type
      const slides = await MultiSlide.findAll({
        where: { topic_id: topic.id },
        order: [['id', 'ASC']],
        // include: [
        //   { model: SlideVideo, as: 'video' },
        //   { model: SlideAudio, as: 'audio' },
        //   { model: SlideGeneral, as: 'general' },
        //   {
        //     model: SlideAccordion,
        //     as: 'accordions',
        //     include: [
        //       { model: SlideAccordionAttachment, as: 'attachments' }
        //     ]
        //   }
        // ]
      });
      contentData = slides;
    }

    return res.status(200).json({
      message: "Topic updated successfully",
      topic,
      content: contentData
    });
  } catch (error) {
    next(error);
  }
};

const getTopicsByModuleId = async (req, res, next) => {
  try {
    const { module_id } = req.params;

    // Execute the stored procedure
    const results = await sequelize.query('CALL GetTopicsByModuleId(:module_hash)', {
      replacements: { module_hash: module_id },
      type: sequelize.QueryTypes.SELECT
    });

    // If there's an error message in the first result set
    if (results[0] && results[0].message === 'Module not found') {
      return res.status(404).json({ message: "Module not found" });
    }

    // If no topics found
    if (results[0].length === 0) {
      return res.status(404).json({ message: "No topics found for this module" });
    }

    // Process results to match the structure expected by the client
    const topics = results[0] ? Object.values(results[0]) : [];
    const accordions = results[1] ? Object.values(results[1]) : [];
    const accordionAttachments = results[2] ? Object.values(results[2]) : [];
    const multiSlides = results[3] ? Object.values(results[3]) : [];
    const multiSlideVideos = results[4] ? Object.values(results[4]) : [];

    // uncomment to add Slide Type Audio
    // const multiSlideAudios = results[5] ? Object.values(results[5]) : [];
    // const multiSlideGenerals = results[6] ? Object.values(results[6]) : [];
    // const multiSlideAccordions = results[7] ? Object.values(results[7]) : [];
    // const multiSlideAccordionAttachments = results[8] ? Object.values(results[8]) : [];
    // const topicTags = results[9] ? Object.values(results[9]) : [];

    const multiSlideAccordions = results[5] ? Object.values(results[5]) : [];
    const multiSlideAccordionAttachments = results[6] ? Object.values(results[6]) : [];
    const topicTags = results[7] ? Object.values(results[7]) : [];

    // Restructure the data to match the original response format
    const formattedTopics = topics.map(topic => {
      // Base topic object
      const formattedTopic = {
        ...topic,
        Video: topic['Video.id'] ? {
          id: topic['Video.id'],
          topic_id: topic['Video.topic_id'],
          url: topic['Video.url'],
          audio_url: topic['Video.audio_url'],
          duration_minutes: topic['Video.duration_minutes'],
          transcript: topic['Video.transcript'],
          bullet_points: topic['Video.bullet_points'],
          video_type: topic['Video.video_type'],
          created_by: topic['Video.created_by'],
          created_by_type: topic['Video.created_by_type'],
          updated_by: topic['Video.updated_by'],
          updated_by_type: topic['Video.updated_by_type'],
          created_at: topic['Video.created_at'],
          updated_at: topic['Video.updated_at']
        } : null,
        Audio: topic['Audio.id'] ? {
          id: topic['Audio.id'],
          topic_id: topic['Audio.topic_id'],
          url: topic['Audio.url'],
          image_url: topic['Audio.image_url'],
          duration_minutes: topic['Audio.duration_minutes'],
          created_by: topic['Audio.created_by'],
          created_by_type: topic['Audio.created_by_type'],
          updated_by: topic['Audio.updated_by'],
          updated_by_type: topic['Audio.updated_by_type'],
          created_at: topic['Audio.created_at'],
          updated_at: topic['Audio.updated_at']
        } : null,
        GeneralMaterial: topic['GeneralMaterial.id'] ? {
          id: topic['GeneralMaterial.id'],
          topic_id: topic['GeneralMaterial.topic_id'],
          title: topic['GeneralMaterial.title'],
          description: topic['GeneralMaterial.description'],
          // codeLanguage: topic['GeneralMaterial.codeLanguage'],
          // code: topic['GeneralMaterial.code'],
          audio_url: topic['GeneralMaterial.audio_url'],
          duration_minutes: topic['GeneralMaterial.duration_minutes'] ?? 0,
          created_by: topic['GeneralMaterial.created_by'],
          created_by_type: topic['GeneralMaterial.created_by_type'],
          updated_by: topic['GeneralMaterial.updated_by'],
          updated_by_type: topic['GeneralMaterial.updated_by_type'],
          created_at: topic['GeneralMaterial.created_at'],
          updated_at: topic['GeneralMaterial.updated_at']
        } : null,
        Accordions: accordions.filter(a => a.topic_id === topic.id).map(accordion => {
          // Find attachments for this accordion
          const attachments = accordionAttachments.filter(att => att.accordionId === accordion.id);
          return {
            ...accordion,
            accordianAudioDuration: accordion.duration_minutes ?? 0,
            AccordionAttachments: attachments
          };
        }),
        MultiSlides: multiSlides.filter(ms => ms.topic_id === topic.id).map(slide => {
          return {
            ...slide,
            MultiSlideVideos: multiSlideVideos.filter(v => v.multi_slide_id === slide.id),
            // MultiSlideAudios: multiSlideAudios.filter(a => a.multi_slide_id === slide.id), // uncomment to add Slide Type Audio
            // MultiSlideGenerals: multiSlideGenerals.filter(g => g.multi_slide_id === slide.id),
            MultiSlideAccordions: multiSlideAccordions.filter(acc => acc.multi_slide_id === slide.id).map(accordion => {
              // Find attachments for this multislide accordion
              const attachments = multiSlideAccordionAttachments.filter(att => att.accordionId === accordion.id);
              return {
                ...accordion,
                MultiSlideAccordionAttachments: attachments
              };
            })
          };
        }),
        TopicTags: topicTags.filter(tag => tag.topic_id === topic.id)
      };
      // Clean up field names that were used for the join
      Object.keys(formattedTopic).forEach(key => {
        if (key.includes('.')) {
          delete formattedTopic[key];
        }
      });

      return formattedTopic;
    });

    // New material result sets from stored procedure:
    // general materials -> results[10], slide general materials -> results[11]
    const generalMaterials = results[8] ? Object.values(results[8]) : [];
    // const slideGeneralMaterials = results[11] ? Object.values(results[11]) : [];

    if (generalMaterials.length) {
      const byGen = generalMaterials.reduce((acc, row) => {
        acc[row.topic_id] = acc[row.topic_id] || [];
        acc[row.topic_id].push(row);
        return acc;
      }, {});
      formattedTopics.forEach(ft => {
        if (ft.GeneralMaterial && byGen[ft.GeneralMaterial.id]) {
          ft.GeneralMaterial.materials = byGen[ft.GeneralMaterial.id];
        }
      });
    }

    // if (slideGeneralMaterials.length) {
    //   const bySlideGen = slideGeneralMaterials.reduce((acc, row) => {
    //     acc[row.slide_general_id] = acc[row.slide_general_id] || [];
    //     acc[row.slide_general_id].push(row);
    //     return acc;
    //   }, {});
    //   formattedTopics.forEach(ft => {
    //     (ft.MultiSlides || []).forEach(slide => {
    //       (slide.MultiSlideGenerals || []).forEach(sg => {
    //         sg.materials = bySlideGen[sg.id] || [];
    //       });
    //     });
    //   });
    // }

    res.status(200).json(formattedTopics);
  } catch (error) {
    next(error);
  }
};

const getTopicById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Execute the stored procedure
    const results = await sequelize.query("CALL GetTopicById(:topic_hash)", {
      replacements: { topic_hash: id },
      type: sequelize.QueryTypes.SELECT,
    });

    // If there's an error message in the first result set
    if (results[0] && results[0].message === "Topic not found") {
      return res.status(404).json({ message: "Topic not found" });
    }

    // If no topic found
    if (Object.values(results[0]).length === 0) {
      return res.status(404).json({ message: "Topic not found" });
    }

    // Process results to match the structure expected by the client
    const topicData = results[0][0]; // Get first row of first result set
    const accordions = Object.values(results[1]) || [];
    const accordionAttachments = Object.values(results[2]) || [];
    const multiSlides = Object.values(results[3]) || [];
    const multiSlideVideos = Object.values(results[4]) || [];
    // const multiSlideAudios = Object.values(results[5]) || [];
    // const multiSlideGenerals = Object.values(results[6]) || [];
    // const multiSlideAccordions = Object.values(results[7]) || [];
    // const multiSlideAccordionAttachments = Object.values(results[8]) || [];
    // const topicTags = Object.values(results[9]) || [];
    // const generalMaterials = Object.values(results[10] || {});
    // const slideGeneralMaterials = Object.values(results[11] || {});

    const multiSlideAccordions = Object.values(results[5]) || [];
    const multiSlideAccordionAttachments = Object.values(results[6]) || [];
    // const slideMaterials = Object.values(results[3] || {});
    const slideMaterials = [];

    // loop through all slides and collect materials
    multiSlides.forEach(slide => {
      if (typeof slide.materials === "string") {
        try {
          slide.materials = JSON.parse(slide.materials);
        } catch (e) {
          slide.materials = [];
        }
      }

      if (!Array.isArray(slide.materials)) {
        slide.materials = [];
      }

      if (slide.materials.length > 0) {
        slideMaterials.push(...slide.materials);
      }
    });

    const topicTags = Object.values(results[7]) || [];
    const topicMaterials = Object.values(results[8] || {});
    // const slideGeneralMaterials = Object.values(results[10] || {});

    // Convert completion_time from seconds to minutes for GeneralMaterial
    if (topicData["GeneralMaterial.completion_time"]) {
      topicData["GeneralMaterial.completion_time"] = topicData["GeneralMaterial.completion_time"]
    }

    // Convert completion_time from seconds to minutes for Accordions
    accordions.forEach((accordion) => {
      if (accordion.completion_time) {
        accordion.completion_time = accordion.completion_time
      }
    });

    // Convert completion_time from seconds to minutes for Multislide
    multiSlides.forEach((slide) => {
      if (slide.completion_time) {
        slide.completion_time = Math.round(slide.completion_time);
      }
    });

    // Build the topic object with nested structure
    const topic = {
      ...topicData,
      Video: topicData["Video.id"]
        ? {
          id: topicData["Video.id"],
          topic_id: topicData["Video.topic_id"],
          url: topicData["Video.url"],
          audio_url: topicData["Video.audio_url"],
          duration_minutes: topicData["Video.duration_minutes"],
          transcript: topicData["Video.transcript"],
          bullet_points: topicData["Video.bullet_points"]
            ? typeof topicData["Video.bullet_points"] === "string"
              ? JSON.parse(topicData["Video.bullet_points"])
              : topicData["Video.bullet_points"]
            : null,
          video_type: topicData["Video.video_type"],
          created_by: topicData["Video.created_by"],
          created_by_type: topicData["Video.created_by_type"],
          updated_by: topicData["Video.updated_by"],
          updated_by_type: topicData["Video.updated_by_type"],
          created_at: topicData["Video.created_at"],
          updated_at: topicData["Video.updated_at"],
        }
        : null,
      Audio: topicData["Audio.id"]
        ? {
          id: topicData["Audio.id"],
          topic_id: topicData["Audio.topic_id"],
          url: topicData["Audio.url"],
          image_url: topicData["Audio.image_url"],
          duration_minutes: topicData["Audio.duration_minutes"],
          created_by: topicData["Audio.created_by"],
          created_by_type: topicData["Audio.created_by_type"],
          updated_by: topicData["Audio.updated_by"],
          updated_by_type: topicData["Audio.updated_by_type"],
          created_at: topicData["Audio.created_at"],
          updated_at: topicData["Audio.updated_at"],
        }
        : null,
      GeneralMaterial: topicData["GeneralMaterial.id"]
        ? {
          id: topicData["GeneralMaterial.id"],
          topic_id: topicData["GeneralMaterial.topic_id"],
          title: topicData["GeneralMaterial.title"],
          description: topicData["GeneralMaterial.description"],
          // codeLanguage: topicData["GeneralMaterial.codeLanguage"],
          // code: topicData["GeneralMaterial.code"],
          completion_type: topicData["GeneralMaterial.completion_type"],
          completion_time: topicData["GeneralMaterial.completion_time"],
          audio_url: topicData["GeneralMaterial.audio_url"],
          duration_minutes: topicData["GeneralMaterial.duration_minutes"] ?? 0,
          created_by: topicData["GeneralMaterial.created_by"],
          created_by_type: topicData["GeneralMaterial.created_by_type"],
          updated_by: topicData["GeneralMaterial.updated_by"],
          updated_by_type: topicData["GeneralMaterial.updated_by_type"],
          created_at: topicData["GeneralMaterial.created_at"],
          updated_at: topicData["GeneralMaterial.updated_at"],
        }
        : null,
      Accordions: accordions.map((accordion) => {
        // Find attachments for this accordion
        const attachments = accordionAttachments.filter(
          (att) => att.accordionId === accordion.id
        );
        return {
          ...accordion,
          accordianAudioDuration: accordion.duration_minutes ?? 0,
          AccordionAttachments: attachments,
        };
      }),
      MultiSlides: multiSlides.map((slide) => {
        // Match slide materials by slide_id
        const slideSpecificMaterials = Array.isArray(slide.materials) && slide.materials.length > 0
          ? slide.materials
          : slideMaterials.filter((mat) => mat.slide_id === slide.id);

        return {
          ...slide,
          MultiSlideVideos: multiSlideVideos.filter(
            (v) => v.multi_slide_id === slide.id
          ),
          MultiSlideAccordions: multiSlideAccordions
            .filter((acc) => acc.multi_slide_id === slide.id)
            .map((accordion) => {
              const attachments = multiSlideAccordionAttachments.filter(
                (att) => att.accordionId === accordion.id
              );
              return {
                ...accordion,
                MultiSlideAccordionAttachments: attachments,
              };
            }),
          SlideMaterials: slideSpecificMaterials, // ✅ added slide materials mapped by slide_id
        };
      }),

      TopicTags: topicTags,
      TopicMaterials: topicMaterials
    };

    // Clean up field names that were used for the join
    Object.keys(topic).forEach((key) => {
      if (key.includes(".")) {
        delete topic[key];
      }
    });

    // if (topic.MultiSlides) {
    //   topic.MultiSlides.forEach(sl => {
    //     (sl.MultiSlideGenerals || []).forEach(sg => {
    //       sg.materials = slideGeneralMaterials.filter(m => m.slide_general_id === sg.id);
    //     });
    //   });
    // }

    res.status(200).json({ success: true, topic });
  } catch (error) {
    next(error);
  }
};

// Update Topic Status Function
const updateTopicStatus = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const { status } = req.body;

    // Call the stored procedure: returns updated topic
    const { success, data, error } = await callProcedure("UpdateTopicStatus", [topicId, status]);

    if (!success) {
      return res.status(500).json({
        message: "Error updating topic status",
        error,
      });
    }

    const updatedTopic = data[0]; // Assuming 'data' contains the updated topic

    return res.status(200).json({
      message: `Topic ${status === "active" ? "activated" : "deactivated"} successfully`,
      topic: updatedTopic,
    });
  } catch (error) {
    next(error);
  }
};

// Update Topic Sequence Function
const updateTopicSequence = async (req, res, next) => {
  try {
    const { sequence } = req.body; // Array of topic IDs

    // Validate the sequence input
    if (!Array.isArray(sequence) || sequence.length === 0) {
      return res.status(400).json({ message: "Invalid sequence format" });
    }

    // Convert array to comma-separated string
    const topicIds = sequence.join(',');

    // Call the stored procedure
    const { success, data, error } = await callProcedure("UpdateTopicSequence", [topicIds]);

    if (!success) {
      return res.status(500).json({
        message: "Error updating topic sequence",
        error,
      });
    }

    res.status(200).json({ message: "Topics sequence updated successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTopic,
  getTopicsByModuleId,
  getTopicById,
  updateTopic,
  updateTopicSequence,
  updateTopicStatus,
};