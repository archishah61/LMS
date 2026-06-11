// unused don't check this file
// unused don't check this file

const QuizCompletion = require("../../models/learning_progress/quizCompletion");
const QuizResponse = require("../../models/learning_progress/quizResponse");
const ProgressTracking = require("../../models/learning_progress/progressTracking");
const Topic = require("../../models/course_management/topic");
const Module = require("../../models/course_management/module");
const Course = require("../../models/course_management/course");
const { Quizzes } = require("../../models/content_management/quizzesModel");
const TopicContent = require("../../models/course_management/topic_content");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { enrollments } = require("../../models/enrollment_management/enrollment_management");
const { AudioToScriptQuestion } = require("../../models/content_management/quiz-questions-types/audiotoScript");
const { DragDropQuestion } = require("../../models/content_management/quiz-questions-types/dragDropQuestionModel");
const SummarizePassageQuestion = require("../../models/content_management/quiz-questions-types/summarPassageModel.js");
const RealWordQuestion = require("../../models/content_management/quiz-questions-types/real-word.js");
const { BestOptionQuestion } = require("../../models/content_management/quiz-questions-types/bestOptionQuestion.js");
const { BestOptionResponse } = require("../../models/content_management/quiz-questions-types/bestOptionResponse.js");
const { CompleteSentence } = require("../../models/content_management/quiz-questions-types/completeTheSentence.js");
const {TextedBasedQuizText} = require("../../models/content_management/textBasedQuizText.js");
const { FillInBlankQuestion } = require("../../models/content_management/generated_quiz/fillInblankquestion.js");
const {MultipleChoiceQuestion} = require("../../models/content_management/generated_quiz/multiplechoicequestion.js");
const { TrueFalseQuestion } = require("../../models/content_management/generated_quiz/truefalsequestion.js");


// const TrueFalseQuestion = require("../../models/content_management/trueFalseQuestion.js");


const { callProcedure } = require("../../utils/procedure/callProcedure");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Helper function to call Gemini API
async function generateFeedback(prompt) {
  try {
    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    return "Unable to generate feedback at this time.";
  }
}

// Get User Skill Level using stored procedure
exports.getUserSkillLevel = async (req, res) => {
  const { userId, courseId } = req.params;

  try {
      // Call the stored procedure
      const response = await callProcedure("getUserSkillLevel", [userId, courseId]);

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch skill level");
      }

      const results = response.data;

      if (!results || results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No skill level data found for the user in this course."
        });
      }

      // Process the results to calculate overall skill level
      const processedData = {
        overall: {
          total_questions: results.reduce((sum, item) => sum + (item.total_questions || 0), 0),
          correct_answers: results.reduce((sum, item) => sum + (item.correct_answers || 0), 0),
          total_revisions: results.reduce((sum, item) => sum + (item.total_revisions || 0), 0),
          accuracy_rate: 0,
          skill_level: 'Beginner'
        },
        modules: results.map(item => ({
          module_id: item.module_id,
          module_title: item.module_title,
          topic_id: item.topic_id,
          topic_title: item.topic_title,
          total_questions: item.total_questions,
          correct_answers: item.correct_answers,
          total_revisions: item.total_revisions,
          accuracy_rate: item.accuracy_rate,
          skill_level: item.skill_level
        }))
      };

      processedData.overall.correct_answers = parseInt(processedData.overall.correct_answers) || 0;

      // Calculate overall accuracy rate
      if (processedData.overall.total_questions > 0) {
        processedData.overall.accuracy_rate = processedData.overall.correct_answers / processedData.overall.total_questions;
      }

      // Determine overall skill level
      if (processedData.overall.accuracy_rate >= 0.7 && processedData.overall.total_revisions >= 3) {
        processedData.overall.skill_level = 'Advanced';
      } else if (processedData.overall.accuracy_rate >= 0.5 || processedData.overall.total_revisions >= 2) {
        processedData.overall.skill_level = 'Intermediate';
      }


      return res.status(200).json({
        success: true,
        data: processedData
      });

    } catch (error) {
      console.error("Error fetching skill level:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message
      });
    }
};

// Get Error Patterns
exports.getErrorPatterns = async (req, res, next) => {
  const { userId, courseId } = req.params;

  try {
    // Get user's enrollment
    const enrollment = await enrollments.findOne({
      where: { user_id: userId, course_id: courseId }
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "User not enrolled in this course"
      });
    }

    // Get quiz responses with incorrect answers - Fixed include structure
    const responses = await QuizResponse.findAll({
      where: { isCorrect: false },
      include: [
        {
          model: QuizCompletion,
          where: { userId: userId },
          include: [
            {
              model: Quizzes,
              include: [
                {
                  model: Module,
                  where: { course_id: courseId },
                  attributes: ['id', 'title', 'course_id'], // Specify needed attributes
                  include: [
                    {
                      model: Topic,
                      attributes: ['id', 'title'],
                      required: false // Make topics optional
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });

    const errorMap = {};
    const topicErrorMap = {};
    const moduleErrorMap = {};

    responses.forEach((response, index) => {
      try {

        // Parse answer data
        let answerData;
        try {
          answerData = typeof response.answer === 'string'
            ? JSON.parse(response.answer)
            : response.answer;
        } catch (parseError) {
          console.error("Error parsing answer data:", parseError);
          return; // Skip this response
        }

        const quizCompletion = response.QuizCompletion;
        if (!quizCompletion) {
          return;
        }

        const quiz = quizCompletion.Quiz;
        if (!quiz) {
          return;
        }

        const module = quiz.Module;
        if (!module) {
          return;
        }

        const moduleId = module.id;
        const moduleName = module.title;

        // Extract question text from answer data
        let questionText = "Unknown question";

        // Try different possible structures for question text
        if (answerData.question_text) {
          questionText = answerData.question_text;
        } else if (answerData.question) {
          questionText = answerData.question;
        } else if (typeof answerData === 'object') {
          // If answerData is an object with question IDs as keys
          const questionId = Object.keys(answerData)[0];
          if (questionId) {
            questionText = `Question ID: ${questionId} - Answer: ${answerData[questionId]}`;
          }
        }

        // Module-level errors
        if (!moduleErrorMap[moduleId]) {
          moduleErrorMap[moduleId] = {
            module_name: moduleName,
            errors: []
          };
        }
        moduleErrorMap[moduleId].errors.push(questionText);

        // Topic-level errors (if quiz is associated with specific topics)
        if (quizCompletion.topic_id) {

          const topicId = quizCompletion.topic_id;
          const topics = module.Topics || [];
          const topic = topics.find(t => t.id === topicId);
          const topicName = topic?.title || `Unknown Topic (ID: ${topicId})`;

          if (!topicErrorMap[topicId]) {
            topicErrorMap[topicId] = {
              topic_name: topicName,
              module_id: moduleId,
              module_name: moduleName,
              errors: []
            };
          }
          topicErrorMap[topicId].errors.push(questionText);
        }

      } catch (parseError) {
        console.error(`Error processing response ${index + 1}:`, parseError);
      }
    });

    const errorPatterns = {
      by_module: moduleErrorMap,
      by_topic: topicErrorMap,
      summary: {
        total_modules_with_errors: Object.keys(moduleErrorMap).length,
        total_topics_with_errors: Object.keys(topicErrorMap).length,
        total_error_count: responses.length
      }
    };

    res.json({
      success: true,
      errorPatterns: errorPatterns
    });
  } catch (error) {
    console.error("Error in getErrorPatterns:", error);
    next(error);
  }
};

// Also update the internal version
exports.getErrorPatternsInternal = async (userId, courseId) => {
  try {
    // Get user's enrollment
    const enrollment = await enrollments.findOne({
      where: { user_id: userId, course_id: courseId }
    });

    if (!enrollment) {
      return {
        success: false,
        message: "User not enrolled in this course"
      };
    }

    // Get quiz responses with incorrect answers - Fixed include structure
    const responses = await QuizResponse.findAll({
      where: { isCorrect: false },
      include: [
        {
          model: QuizCompletion,
          where: { userId: userId },
          include: [
            {
              model: Quizzes,
              include: [
                {
                  model: Module,
                  where: { course_id: courseId },
                  attributes: ['id', 'title', 'course_id'],
                  include: [
                    {
                      model: Topic,
                      attributes: ['id', 'title'],
                      required: false
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });

    const errorMap = {};
    const topicErrorMap = {};
    const moduleErrorMap = {};

    responses.forEach((response) => {
      try {
        let answerData;
        try {
          answerData = typeof response.answer === 'string'
            ? JSON.parse(response.answer)
            : response.answer;
        } catch (parseError) {
          console.error("Error parsing answer data:", parseError);
          return;
        }

        const quizCompletion = response.QuizCompletion;
        const quiz = quizCompletion?.Quizzes;
        const module = quiz?.Module;

        if (module) {
          const moduleId = module.id;
          const moduleName = module.title;

          // Extract question text
          let questionText = "Unknown question";
          if (answerData.question_text) {
            questionText = answerData.question_text;
          } else if (answerData.question) {
            questionText = answerData.question;
          } else if (typeof answerData === 'object') {
            const questionId = Object.keys(answerData)[0];
            if (questionId) {
              questionText = `Question ID: ${questionId} - Answer: ${answerData[questionId]}`;
            }
          }

          // Module-level errors
          if (!moduleErrorMap[moduleId]) {
            moduleErrorMap[moduleId] = {
              module_name: moduleName,
              errors: []
            };
          }
          moduleErrorMap[moduleId].errors.push(questionText);

          // Topic-level errors
          if (quizCompletion.topic_id) {
            const topicId = quizCompletion.topic_id;
            const topics = module.Topics || [];
            const topic = topics.find(t => t.id === topicId);
            const topicName = topic?.title || `Unknown Topic (ID: ${topicId})`;

            if (!topicErrorMap[topicId]) {
              topicErrorMap[topicId] = {
                topic_name: topicName,
                module_id: moduleId,
                module_name: moduleName,
                errors: []
              };
            }
            topicErrorMap[topicId].errors.push(questionText);
          }
        }
      } catch (parseError) {
        console.error("Error parsing answer data:", parseError);
      }
    });

    const errorPatterns = {
      by_module: moduleErrorMap,
      by_topic: topicErrorMap,
      summary: {
        total_modules_with_errors: Object.keys(moduleErrorMap).length,
        total_topics_with_errors: Object.keys(topicErrorMap).length,
        total_error_count: responses.length
      }
    };

    return {
      success: true,
      errorPatterns: errorPatterns
    };
  } catch (error) {
    console.error("Error in getErrorPatternsInternal:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get detailed quiz performance for a specific module
exports.getModuleQuizPerformance = async (req, res) => {
  const { userId, moduleId } = req.params;

  try {
    const quizPerformance = await QuizCompletion.findAll({
      where: {
        userId: userId,
        module_id: moduleId
      },
      include: [
        {
          model: Quizzes,
          attributes: ['title', 'passing_score', 'max_attempts']
        },
        {
          model: Module,
          attributes: ['title']
        },
        {
          model: Topic,
          attributes: ['title'],
          required: false
        },
        {
          model: QuizResponse,
          attributes: ['isCorrect', 'answer']
        }
      ]
    });

    const performanceData = quizPerformance.map(completion => ({
      quiz_id: completion.quizId,
      quiz_title: completion.Quizzes?.title,
      module_title: completion.Module?.title,
      topic_title: completion.Topic?.title,
      score: completion.score,
      total_questions: completion.total_question,
      correct_answers: completion.count,
      accuracy_rate: completion.total_question > 0 ? completion.count / completion.total_question : 0,
      attempts_used: completion.triedAttempts,
      max_attempts: completion.Quizzes?.max_attempts,
      is_completed: completion.isCompleted,
      status: completion.status,
      last_attempt: completion.lastAttemptTime,
      passing_score: completion.Quizzes?.passing_score,
      passed: completion.score >= (completion.Quizzes?.passing_score || 0)
    }));

    res.json({
      success: true,
      data: performanceData
    });

  } catch (error) {
    console.error("Error fetching module quiz performance:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.getRecommendationsV2 = async (req, res, next) => {
  const { userId, courseId } = req.params;

  try {
    // Get skill level data
    const skillLevelResponse = await exports.getUserSkillLevel(req, {
      status: (code) => ({
        json: (data) => data
      })
    });

    // Get error patterns data using internal function
    const errorPatternResponse = await exports.getErrorPatternsInternal(userId, courseId);

    const skillData = skillLevelResponse.data || skillLevelResponse;
    const errorData = errorPatternResponse.success ? errorPatternResponse.errorPatterns : null;

    if (!skillData) {
      return res.status(400).json({
        success: false,
        message: "Unable to fetch skill level data for recommendations"
      });
    }

    // Handle case where error data might be missing
    const errorPatterns = errorData || {
      by_module: {},
      by_topic: {},
      summary: {
        total_modules_with_errors: 0,
        total_topics_with_errors: 0,
        total_error_count: 0
      }
    };

    // Rest of the code remains the same...
    const overallSkill = skillData.overall;
    const moduleDetails = skillData.modules || [];
    const errorsByModule = errorPatterns.by_module || {};
    const errorsByTopic = errorPatterns.by_topic || {};

    // Create comprehensive prompt for AI (same as above)
    const prompt = `
      You are an AI tutor analyzing student learning behavior for personalized recommendations.

      STUDENT PERFORMANCE PROFILE:
      - Overall Skill Level: ${overallSkill.skill_level}
      - Overall Accuracy Rate: ${(overallSkill.accuracy_rate * 100).toFixed(2)}%
      - Total Questions Attempted: ${overallSkill.total_questions}
      - Total Correct Answers: ${overallSkill.correct_answers}
      - Total Revisions: ${overallSkill.total_revisions}

      MODULE-WISE PERFORMANCE:
      ${moduleDetails.map(module => `
      - Module: ${module.module_title}
        - Topic: ${module.topic_title || 'General'}
        - Accuracy: ${(parseFloat(module.accuracy_rate) * 100).toFixed(2)}%
        - Questions: ${module.total_questions}
        - Correct: ${module.correct_answers}
        - Revisions: ${module.total_revisions}
        - Skill Level: ${module.skill_level}
      `).join('')}

      ERROR ANALYSIS:
      ${Object.keys(errorsByModule).length > 0 ? `
      Modules with Most Errors:
      ${Object.entries(errorsByModule).map(([moduleId, data]) => `
      - ${data.module_name}: ${data.errors.length} errors
        Common mistake patterns: ${data.errors.slice(0, 3).join('; ')}
      `).join('')}
      ` : 'No specific error patterns identified from recent quiz attempts.'}

      ${Object.keys(errorsByTopic).length > 0 ? `
      Topics with Specific Issues:
      ${Object.entries(errorsByTopic).map(([topicId, data]) => `
      - ${data.topic_name} (${data.module_name}): ${data.errors.length} errors
      `).join('')}
      ` : 'No topic-specific error patterns identified.'}

      SUMMARY STATISTICS:
      - Total Modules with Errors: ${errorPatterns.summary.total_modules_with_errors}
      - Total Topics with Errors: ${errorPatterns.summary.total_topics_with_errors}
      - Total Error Count: ${errorPatterns.summary.total_error_count}

      Based on this comprehensive analysis, provide detailed recommendations in the following format:

      ## SKILL ASSESSMENT
      [Provide overall assessment of the student's learning progress]

      ## WEAK AREAS IDENTIFIED
      [List specific topics/modules that need attention]

      ## RECOMMENDED STUDY PLAN
      [Provide step-by-step study recommendations]

      ## PRACTICE FOCUS AREAS
      [Suggest specific types of questions or concepts to practice]

      ## LEARNING STRATEGIES
      [Recommend study techniques based on their learning patterns]

      ## PROGRESS GOALS
      [Set achievable short-term and long-term goals]

      Keep recommendations practical, specific, and encouraging.
      `;

    const feedback = await generateFeedback(prompt);

    res.json({
      success: true,
      data: {
        skillLevel: skillData,
        errorPatterns: errorPatterns,
        aiRecommendations: feedback,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error in getRecommendations:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};