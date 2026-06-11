const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure storage engine with dynamic destination and filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Base uploads folder
    let folder = path.join(__dirname, "../", "uploads");

    // General materials (root level): determine folder by mimetype/extension (supports both generalMaterial and generalMaterial[index])
    if (file.fieldname === "material" || file.fieldname.startsWith("material[")) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === ".pdf") {
        folder = path.join(folder, "material", "pdf");
      } else if (file.mimetype && file.mimetype.startsWith("image/")) {
        folder = path.join(folder, "material", "image");
      } else {
        const docExts = new Set([".doc", ".docx", ".txt", ".rtf", ".odt", ".ppt", ".pptx", ".xls", ".xlsx", ".html", ".text"]);
        if (docExts.has(ext)) {
          folder = path.join(folder, "material", "document");
        } else {
          folder = path.join(folder, "material", "others");
        }
      }
    } else if (file.fieldname.startsWith("slide_material[")) {
      // Files for slide general materials are sent as slide_general[slideIndex][materialIndex]
      // Determine folder by mimetype or extension, not by brittle name parsing
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === ".pdf") {
        folder = path.join(folder, "slide_material", "pdf");
      } else if (file.mimetype && file.mimetype.startsWith("image/")) {
        folder = path.join(folder, "slide_material", "image");
      } else {
        const docExts = new Set([".doc", ".docx", ".txt", ".rtf", ".odt", ".ppt", ".pptx", ".xls", ".xlsx", ".html", ".text"]);
        if (docExts.has(ext)) {
          folder = path.join(folder, "slide_material", "document");
        } else {
          folder = path.join(folder, "slide_material", "others");
        }
      }
    }
    // Rest of your destination logic remains unchanged
    else if (file.fieldname === "assignmentFile") {
      folder = path.join(folder, "assignments", "file");
    } else if (file.fieldname.startsWith("matching_option_image_") || file.fieldname.startsWith("option_images[")) {
      folder = path.join(folder, "assignments", "matching_options");
    } else if (file.fieldname.startsWith("matching_match_image_") || file.fieldname.startsWith("match_images[")) {
      folder = path.join(folder, "assignments", "matching_matches");
    } else if (file.fieldname.startsWith("accordionAudioUrls[")) {
      folder = path.join(folder, "audios", "accordion");
    } else if (file.fieldname.startsWith("slideAudioUrl[")) {
      folder = path.join(folder, "audios", "multi_slide");
    } else if (file.fieldname.startsWith("slide_video[")) {
      folder = path.join(folder, "multi_slide", "video");
    } else if (file.fieldname.startsWith("slide_audio[")) {
      folder = path.join(folder, "multi_slide", "audio");
    } else if (file.fieldname.startsWith("tagFile[")) {
      folder = path.join(folder, "tags");
    } else if (file.fieldname.startsWith("accordionAttachment[")) {
      folder = path.join(folder, "accordion", "attachments");
    } else if (file.fieldname.startsWith("predefineOptionImages[")) {
      folder = path.join(folder, "predefined", "option_images");
    } else if (file.fieldname.startsWith("multislideAccordionAttachment[") || file.fieldname.startsWith("slide_accordion[")) {
      folder = path.join(folder, "multi_slide", "accordion", "attachments");
    } else {
      switch (file.fieldname) {
        case "courseThumbnail":
          folder = path.join(folder, "course", "thumbnail");
          break;
        case "coursePreviewVideo":
          // Support both image and video for course detail preview
          // If it's an image -> uploads/course/preview_image; if video -> uploads/course/preview_video
          if (file.mimetype && file.mimetype.startsWith("image/")) {
            folder = path.join(folder, "course", "preview_image");
          } else if (file.mimetype && file.mimetype.startsWith("video/")) {
            folder = path.join(folder, "course", "preview_video");
          } else {
            const ext = path.extname(file.originalname).toLowerCase();
            const imageExts = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"]);
            const videoExts = new Set([".mp4", ".webm", ".ogg", ".mov", ".m4v", ".avi"]);
            if (imageExts.has(ext)) {
              folder = path.join(folder, "course", "preview_image");
            } else if (videoExts.has(ext)) {
              folder = path.join(folder, "course", "preview_video");
            } else {
              // default to video folder for unknown types to preserve prior behavior
              folder = path.join(folder, "course", "preview_video");
            }
          }
          break;
        case "seoImage":
          folder = path.join(folder, "meta", "seo");
          break;
        case "ogImage":
          folder = path.join(folder, "meta", "og");
          break;
        case "courseSEOImage":
          folder = path.join(folder, "course", "seo");
          break;
        case "courseOGImage":
          folder = path.join(folder, "course", "og");
          break;
        case "sessionImage":
          folder = path.join(folder, "session", "images");
          break;
        case "moduleImage":
          folder = path.join(folder, "module", "image");
          break;
        case "videoUrl":
          folder = path.join(folder, "video");
          break;
        case "generalAudioUrl":
          folder = path.join(folder, "audios", "general");
          break;
        case "accordionAudioUrls":
          folder = path.join(folder, "audios", "accordion");
          break;
        case "audioUrl":
          folder = path.join(folder, "audio");
          break;
        case "audioImageUrl":
          folder = path.join(folder, "audio", "image");
          break;
        case "assignmentSubmissionFile":
          folder = path.join(folder, "assignments", "submission");
          break;
        case "questionImg":
          folder = path.join(folder, "quiz", "question_images");
          break;
        case "video":
          folder = path.join(folder, "quiz", "video");
          break;
        case "audio":
          folder = path.join(folder, "quiz", "audio");
          break;
        case "videopause":
          folder = path.join(folder, "quiz", "videopause");
          break;
        case "audiopause":
          folder = path.join(folder, "quiz", "audiopause");
          break;
        case "optionImage":
          folder = path.join(folder, "quiz", "option_images");
          break;
        case "predefineQuestionImage":
          folder = path.join(folder, "predefined", "question_images");
          break;
        // case "predefineOptionImages":
        //   folder = path.join(folder, "predefined", "option_images");
        //   break;
        case "accordionAttachment":
          folder = path.join(folder, "accordion", "attachments");
          break;
        case "multislideAccordionAttachment":
          folder = path.join(folder, "multi_slide", "accordion", "attachments");
          break;
        case "profile_image":
          folder = path.join(folder, "user", "profile_images");
          break;
        case "profile_image_admin":
          folder = path.join(folder, "admin", "profile_image_admin");
          break;
        case "imageUrl":
          folder = path.join(folder, "cheat-sheet", "image");
          break;
        case "contestBanner":
          folder = path.join(folder, "contest", "banner");
          break;
        case "dailyChallengeImage":
          folder = path.join(folder, "daily_challenge", "image");
          break;
        case "templateBanner":
          folder = path.join(folder, "contest_template", "banner");
          break;
        case "sectionImage":
          folder = path.join(folder, "cheat-sheet-content", "image");
          break;
        case "content":
          folder = path.join(folder, "cheat-sheet-content", "image");
          break;
        case "logo":
          folder = path.join(folder, "partner", "logo");
          break;
        case "accordionTagFile":
          folder = path.join(folder, "tags");
          break;
        case "slideTagFile":
          folder = path.join(folder, "tags");
          break;
        case "audiotoscript":
          folder = path.join(folder, "audiotoScript", "audiotoScript");
          break;
        case "videotoscript":
          folder = path.join(folder, "videotoscript", "videotoscript");
          break;
        case "imagetoscript":
          folder = path.join(folder, "imagetoscript", "imagetoscript");
          break;
        case "supportFile":
          folder = path.join(folder, "support");
          break;
        case "chatBotFile":
          folder = path.join(folder, "temp");
          break;
        case "mathImage":
          folder = path.join(folder, "maths-solver");
          break;
        case "aboutImg":
          folder = path.join(folder, "aboutImg");
          break;
        case "blogImage":
          folder = path.join(folder, "blog");
          break;
        case "footer-logo":
        case "header-logo":
          folder = path.join(folder, "footer");
          break;
        case "companyLogo":
          folder = path.join(folder, "testimonials", "logos");
          break;
        case "authorImage":
          folder = path.join(folder, "testimonials", "authors");
          break;
        case "statisticIcon":
          folder = path.join(folder, "frontend_statistics", "icons");
          break;
        case "featureIcon":
          folder = path.join(folder, "frontend_features", "icons");
          break;
        default:
          folder = path.join(folder, "others");
      }
    }

    // Ensure that the folder exists (create it if not)
    fs.mkdirSync(folder, { recursive: true });

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    // Create a unique filename: fieldname-timestamp-random.ext
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Initialize multer with file validation
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // For generalMaterial, validate by file type (pdf, image, common docs); supports indexed fields.
    // Unknown types are allowed and will route to 'general/others'.
    if (file.fieldname === "material" || file.fieldname.startsWith("material[")) {
      // No hard rejection here; destination sorts by extension/mime to appropriate folder.
    }
    // For slide_general, validate based on material type from the request body
    else if (file.fieldname.startsWith("slide_general")) {
      // Accept files for slide general materials; rely on destination to sort
      // Basic sanity checks only
      // Allow images by mimetype, pdf by extension, and common docs by extension
      const ext = path.extname(file.originalname).toLowerCase();
      if (file.mimetype && file.mimetype.startsWith('image/')) {
        // ok
      } else if (ext === '.pdf') {
        // ok
      } else {
        const validDocExtensions = [
          ".doc", ".docx", ".txt", ".rtf", ".odt", ".ppt", ".pptx", ".xls", ".xlsx", ".html", ".text"
        ];
        if (!validDocExtensions.includes(ext)) {
          // Still accept unknown types into others folder to avoid blocking
        }
      }
    }

    // Accept the file
    cb(null, true);
  },
});

module.exports = upload;
