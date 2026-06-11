const crypto = require("crypto");

// Function to generate a public hash for a course
function generatePublicHash(id) {
  const secret = process.env.GENERATE_PUBLIC_HASH_ID_KEY; // Keep this secret
  return crypto
    .createHmac("sha256", secret)
    .update(`${id}`)
    .digest("hex")
    .slice(0, 10); // Shorten for readability
}

// Function to generate user-specific course hash
function generateUserCourseHash(userId, courseId) {
  const secret = process.env.GENERATE_USER_ENROLL_HASH_ID_KEY; // Keep this secret
  return crypto
    .createHmac("sha256", secret)
    .update(`${userId}-${courseId}`)
    .digest("hex")
    .slice(0, 10); // Shorten for readability
}

module.exports = { generatePublicHash, generateUserCourseHash };
