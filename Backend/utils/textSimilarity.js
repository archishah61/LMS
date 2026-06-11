const axios = require("axios");
const Course = require("../models/course_management/course");
const { Op } = require("sequelize");
const { CourseCategory } = require("../models/masters/courseCatagory");
const math = require("mathjs");

async function getEmbedding(text) {
  const response = await axios.post("http://0.0.0.0:8000/embed/", { text });
  return response.data.embedding;
}

function cosineSimilarity(vecA, vecB) {
  const dotProduct = math.dot(vecA, vecB);
  const magnitudeA = math.norm(vecA);
  const magnitudeB = math.norm(vecB);
  return dotProduct / (magnitudeA * magnitudeB);
}

async function chatbotResponse(userInput) {
  // AI Intent Classification
  const classifyResponse = await axios.post("http://0.0.0.0:8000/classify/", {
    text: userInput,
  });

  if (classifyResponse.data.intent === "greeting") {
    return { type: "text", response: classifyResponse.data.response };
  }
  if (classifyResponse.data.intent === "general") {
    return { type: "text", response: classifyResponse.data.response };
  }

  // Fetch stored course embeddings + category
  const courses = await Course.findAll({
    attributes: [
      "id",
      "public_hash",
      "title",
      "description",
      "category_id",
      "what_you_will_learn",
      "hashtags",
      "embedding",
      "thumbnail",
    ],
    include: [
      {
        model: CourseCategory,
        as: "category",
        attributes: ["category"], // Get category name
      },
    ],
    where: { embedding: { [Op.ne]: null } }, // Ensure embeddings exist
  });

  if (courses.length === 0) {
    return {
      type: "text",
      response: "No courses available for recommendation.",
    };
  }

  // Get user input embedding
  const userEmbedding = await getEmbedding(`query: ${userInput}`);

  /// Compute similarity in parallel
  const bestCourses = courses
    .map((course) => {
      const score = cosineSimilarity(userEmbedding, course.embedding);
      return {
        id: course.id,

        title: course.title,
        thumbnail: course.thumbnail,
        public_hash: course.public_hash,
        score,
        sameCategory: userInput
          .toLowerCase()
          .includes(course.category.category.toLowerCase()), // Check if category matches
      };
    })
    .sort((a, b) => {
      if (a.sameCategory && !b.sameCategory) return -1; // Prefer same category
      if (!a.sameCategory && b.sameCategory) return 1;
      return b.score - a.score; // Otherwise, sort by score
    })
    .slice(0, 3); // Return top 3 courses

  return { type: "courses", recommendedCourses: bestCourses };
}
module.exports = { chatbotResponse };