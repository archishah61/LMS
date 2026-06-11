const { Quizzes } = require("../../models/content_management/quizzesModel");
const Course = require("../../models/course_management/course");
const Module = require("../../models/course_management/module");
const Topic = require("../../models/course_management/topic");
const {
  enrollments,
} = require("../../models/enrollment_management/enrollment_management");
const ProgressTracking = require("../../models/learning_progress/progressTracking");
const QuizCompletion = require("../../models/learning_progress/quizCompletion");

const calculateCourseCompletionPercentage = async (userId, courseId) => {
  try {
    // Get course with modules
    const course = await Course.findByPk(courseId, {
      include: [
        {
          model: Module,
          where: { status: "active" },
          include: [
            { model: Topic, where: { status: "active" } },
            { model: Quizzes, where: { status: "active" }, required: false },
          ],
        },
      ],
    });

    if (!course) {
      throw new Error("Course not found");
    }

    // Get enrollment
    const enrollment = await enrollments.findOne({
      where: { user_id: userId, course_id: courseId },
    });

    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    let totalItems = 0;
    let completedItems = 0;

    // Process each module
    for (const module of course.Modules) {
      // Count and check topics
      for (const topic of module.Topics) {
        totalItems++;

        const progress = await ProgressTracking.findOne({
          where: {
            enrollment_id: enrollment.id,
            topic_id: topic.id,
            completion_status: "completed",
          },
        });

        if (progress) {
          completedItems++;
        }
      }

      // Count and check quizzes
      if (module.Quizzes && module.Quizzes.length > 0) {
        for (const quiz of module.Quizzes) {
          totalItems++;

          const quizCompletion = await QuizCompletion.findOne({
            where: {
              userId: userId,
              quizId: quiz.id,
              status: "passed",
            },
          });

          if (quizCompletion) {
            completedItems++;
          }
        }
      }
    }

    // Calculate percentage
    const completionPercentage =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    return completionPercentage;
  } catch (error) {
    console.error("Error in manual calculation:", error);
    throw error;
  }
};

const calculateModuleCompletionPercentage = async (userId, moduleId) => {
  const module = await Module.findByPk(moduleId, {
    include: [
      {
        model: Course,
        include: [
          {
            model: enrollments,
            as: "enrollments", // ✅ Use the alias
            where: { user_id: userId },
            required: false, // Allow course without enrollment
          },
        ],
      },
      {
        model: Topic,
        as: "Topics", // ✅ Use the alias if defined
      },
    ],
  });

  if (!module) {
    throw new Error("Module not found");
  }

  const enrollment = module.Course?.enrollments?.[0];

  if (!enrollment) {
    throw new Error("Enrollment not found");
  }

  let totalTopics = module.Topics.length;
  let completedTopics = 0;

  for (const topic of module.Topics) {
    const progress = await ProgressTracking.findOne({
      where: { enrollment_id: enrollment.id, topic_id: topic.id },
    });
    if (progress && progress.completion_status === "completed") {
      completedTopics++;
    }
  }

  const completionPercentage = (completedTopics / totalTopics) * 100;
  return completionPercentage;
};

module.exports = {
  calculateCourseCompletionPercentage,
  calculateModuleCompletionPercentage,
};
