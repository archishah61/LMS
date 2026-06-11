// This middleware dynamically registers many possible file field names, including
// generalMaterial (single) and generalMaterial[index] for multiple materials,
// as well as slide_general[slideIndex][materialIndex]. No logic change needed here.
const upload = require("../config/multerConfig");

const uploadMiddleware = (req, res, next) => {

  // Define a function to handle dynamically named fields
  const handleDynamicField = (name, maxCount) => {
    const fields = [];
    // Add the base field
    fields.push({ name, maxCount });

    // Add fields with indices (for arrays)
    for (let i = 0; i < 50; i++) {
      fields.push({ name: `${name}[${i}]`, maxCount: 1 });

      // For multi-slide accordions (double indexing)
      if (name === 'accordionAttachment') {
        for (let j = 0; j < 50; j++) {
          fields.push({ name: `${name}[${i}][${j}]`, maxCount: 1 });
        }
      }

      // For slide_general materials (double indexing): slide_general[slideIndex][materialIndex]
      if (name === 'slide_general') {
        for (let j = 0; j < 200; j++) {
          fields.push({ name: `${name}[${i}][${j}]`, maxCount: 1 });
        }
      }

      // For slide_material files (double indexing): slide_material[slideIndex][materialIndex]
      if (name === 'slide_material') {
        for (let j = 0; j < 200; j++) {
          fields.push({ name: `${name}[${i}][${j}]`, maxCount: 1 });
        }
      }

      if (name === 'slide_accordion') {
        for (let j = 0; j < 50; j++) {
          for (let k = 0; k < 5; k++) {
            fields.push({ name: `${name}[${i}][${j}][${k}]`, maxCount: 1 });
          }
        }
      }

      if (name === 'multislideAccordionAttachment') {
        for (let j = 0; j < 50; j++) {
          for (let k = 0; k < 50; k++) {
            fields.push({ name: `${name}[${i}][${j}][${k}]`, maxCount: 1 });
          }
        }
      }
    }

    return fields;
  };

  // Flatten all fields into a single array
  const fields = [
    { name: "videoUrl", maxCount: 1 },
    { name: "generalAudioUrl", maxCount: 1 },
    { name: "audioUrl", maxCount: 1 },
    { name: "audioImageUrl", maxCount: 1 },
    { name: "companyLogo", maxCount: 1 },
    { name: "authorImage", maxCount: 1 },
    { name: "statisticIcon", maxCount: 1 },
    { name: "featureIcon", maxCount: 1 },
    // General Material (legacy base + indexed) – now handled via dynamic helper
    ...handleDynamicField("material", 50),
    // { name: "accordionAttachment", maxCount: 50 },
    // { name: "slide_video", maxCount: 50 },
    // { name: "slide_audio", maxCount: 50 },
    // { name: "slide_general", maxCount: 50 },
    // { name: "multislideAccordionAttachment", maxCount: 50 },
    ...handleDynamicField("tagFile", 50),
    { name: "accordionTagFile", maxCount: 50 },
    { name: "slideTagFile", maxCount: 50 },
    { name: "supportFile", maxCount: 50 },
    { name: "chatBotFile", maxCount: 50 },
    { name: "predefineQuestionImage", maxCount: 1 },
    // { name: "predefineOptionImages", maxCount: 50 },
    ...handleDynamicField("predefineOptionImages", 50),
    ...handleDynamicField("slide_video", 50),
    ...handleDynamicField("slide_audio", 50),
    ...handleDynamicField("accordionAudioUrls", 50),
    ...handleDynamicField("accordionAttachment", 50),
    ...handleDynamicField("multislideAccordionAttachment", 50),
    ...handleDynamicField("slide_accordion", 50),
    // ...handleDynamicField("slide_general", 200), // now supports slide_general[slideIndex][materialIndex]
    ...handleDynamicField("slide_material", 200), // now supports slide_material[slideIndex][materialIndex]
    ...handleDynamicField("slideAudioUrl", 50),
  ];

  upload.fields(fields)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

module.exports = { uploadMiddleware };