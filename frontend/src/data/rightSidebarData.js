import courseCategoryData from "./CourseManagement/courseCategoryData";
import preDefinedQuestionData from "./PredefinedQuestions/predefinedQuestion";
import quizData from "./quizzes/quizData";
import predefinedOptionData from "./PredefinedQuestions/predefinedOption";
import quizPredefinedQuestionData from "./PredefinedQuestions/quizPredefinedQuestion";
import assignmentCompletionData from "./assignment/assignmentCompletionData";
import assignmentData from "./assignment/assignmentData";
import assignmentResponseData from "./assignment/assignmentResponseData ";
import adminAuthData from "./auth/adminAuthData";
import userData from "./auth/userAuthData";
import enrollmentData from "./enrollment_management/enrollmentData";
import paymentData from "./enrollment_management/paymentData";
import generatedQuizFillInTheBlanksData from "./generatedQuiz/generatedQuizFillInTheBlanksData";
import generatedQuizMcqData from "./generatedQuiz/generatedQuizMcqData";
import generatedQuizTrueFalseData from "./generatedQuiz/generatedQuizTrueFalseData";
import paypalData from "./paypal/paypalData";
import quizQuestionData from "./quizzes/quizQuestionData";
import quizOptionData from "./quizzes/quizOptionData";
import audioToScriptData from "./quizzes/audioToScriptData";
import bestOptionQuestionData from "./quizzes/bestOptionQuestionData";
import dragAndDropData from "./quizzes/dragAndDropData";
import quizCompletionData from "./quizzes/quizCompletionData";
import quizResponseData from "./quizzes/quizResponseData";
import realWordData from "./quizzes/realWordData";
import summarizePassageData from "./quizzes/summaryPassageData";
import textBasedQuizData from "./quizzes/textBasedQuizData";
import challengeAnalyticsData from "./analytics/challengeAnalyticsData";
import coursePerformanceAnalyticsData from "./analytics/coursePerformanceAnalyticsData";
import leaderboardAnalyticsData from "./analytics/leaderboardAnalyticsData";
import revenueAnalyticsData from "./analytics/revenueAnalyticsData";
import timeBasedAnalyticsData from "./analytics/timeBasedAnalyticsData";
import userEngagementAnalyticsData from "./analytics/userEngagementAnalyticsData";
import challengeCategoryData from "./challengeData/challengeCategoryData";
import dailyChallengeData from "./challengeData/dailyChallengeData";
import mcqChallengeData from "./challengeData/Challenge Questions/mcqChallengeData";
import userChallengePhaseData from "./challengeData/ChallengeProgress/userChallengePhaseData";
import userChallengeQuestData from "./challengeData/ChallengeProgress/userChallengeQuestData";
import challengePhaseData from "./challengeData/ChallengeQuestManagement/challengePhaseData";
import challengeQuestData from "./challengeData/ChallengeQuestManagement/challengeQuestData";
import challengeTaskData from "./challengeData/ChallengeQuestManagement/challengeTaskData";
import userDailyChallengeData from "./challengeData/DailyChallenge/userDailyChallengeData";
import userChallengeTaskData from "./challengeData/ChallengeProgress/userChallengeTaskData";
import cheatsheetData from "./CheetSheetManagement/cheetsheetData";
import cheetsheetMainSectionData from "./CheetSheetManagement/cheetsheetMainSectionData";
import cheetsheetSectionData from "./CheetSheetManagement/cheetsheetSectionData";
import courseData from "./CourseManagement/courseData";
import moduleData from "./CourseManagement/moduleData";
import reviewData from "./CourseManagement/reviewData";
import sessionData from "./CourseManagement/sessionData";
import learningProgressData from "./learning_progress/learningProgressData";
import cityData from './LocationManagment/cityData';
import countryData from './LocationManagment/countryData';
import stateData from './LocationManagment/stateData';
import partnerData from './Partner/partnerData';
import roleData from './RolePermissionManagement/roleData';
import rolePermissionData from './RolePermissionManagement/rolePermissionData';
import studentFAQResponseData from './StudentManagement/studentFAQResponseData';
import supportData from './support/supportData';
import userStreaksData from './user_streaks/userStreaksData';
import wishlistData from './wishlist/wishlistData';
import courseFAQData from './CourseManagement/courseFAQData';
import courseFAQOptionData from './CourseManagement/courseFAQOptionData';
import topicContentData from './CourseManagement/topicContentData';
import topicData from './CourseManagement/topicData';

const codeExamples = {
  JavaScript: {
    label: "JavaScript",
    description: "Using axios for API requests",
    template: (endpoint) => {
      const baseUrl = `${
        import.meta.env.VITE_BACKEND_MEDIA_URL
      }${endpoint.url.replace("{id}", "1")}`;
      const payload = endpoint.parameters?.reduce((acc, param) => {
        if (param.name !== 'id') {
          acc[param.name] = param.example;
        }
        return acc;
      }, {});
      const jsonPayload = JSON.stringify(payload, null, 2);

      const hasPayload = jsonPayload && Object.keys(JSON.parse(jsonPayload)).length > 0;

      return `// Using axios
      import axios from 'axios';
      ${hasPayload ? `\nconst data = ${jsonPayload};\n` : ''}axios.${endpoint.method.toLowerCase()}('${baseUrl}'${hasPayload ? ', data' : ''
        })
        .then(response => {
          console.log(response.data);
        })
        .catch(error => {
          console.error('Error:', error);
        });`;

    }
  },

  Python: {
    label: "Python",
    description: "Using requests library",
    template: (endpoint) => {
      const baseUrl = `${
        import.meta.env.VITE_BACKEND_MEDIA_URL
      }${endpoint.url.replace("{id}", "1")}`;
      const payload = endpoint.parameters?.reduce((acc, param) => {
        if (param.name !== 'id') {
          acc[param.name] = param.example;
        }
        return acc;
      }, {});
      const jsonPayload = JSON.stringify(payload, null, 2);

      const hasPayload = jsonPayload && Object.keys(JSON.parse(jsonPayload)).length > 0;

      return `import requests
      ${hasPayload ? `\ndata = ${jsonPayload}\n` : ''}response = requests.${endpoint.method.toLowerCase()}('${baseUrl}'${hasPayload ? ', json=data' : ''
        })
      print(response.json())`;

    }
  },

  cURL: {
    label: "cURL",
    description: "Command line requests",
    template: (endpoint) => {
      const baseUrl = `${
        import.meta.env.VITE_BACKEND_MEDIA_URL
      }${endpoint.url.replace("{id}", "1")}`;
      const payload = endpoint.parameters?.reduce((acc, param) => {
        if (param.name !== 'id') {
          acc[param.name] = param.example;
        }
        return acc;
      }, {});
      const jsonPayload = JSON.stringify(payload, null, 2);

      return `curl -X ${endpoint.method.toUpperCase()} ${baseUrl} \\
  -H "Content-Type: application/json"` +
        (jsonPayload && Object.keys(JSON.parse(jsonPayload)).length > 0
          ? ` \\\n  -d '${jsonPayload}'`
          : '');
    }
  }
};

const methodStyles = {
  GET: {
    bgColor: "bg-blue-100",
    textColor: "text-blue-600",
    borderColor: "border-blue-200"
  },
  POST: {
    bgColor: "bg-green-100",
    textColor: "text-green-600",
    borderColor: "border-green-200"
  },
  PUT: {
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-200"
  },
  DELETE: {
    bgColor: "bg-red-100",
    textColor: "text-red-600",
    borderColor: "border-red-200"
  },
  PATCH: {
    bgColor: "bg-purple-100",
    textColor: "text-purple-600",
    borderColor: "border-purple-200"
  },
  default: {
    bgColor: "bg-gray-100",
    textColor: "text-gray-600",
    borderColor: "border-gray-200"
  }
};

// Helper functions for data handling
const getEndpoint = (endpointId) => {
  // Check in course category, predefined question, quiz, predefined option, quiz predefined question, assignment completion, assignment, assignment response, admin auth, user auth, enrollment, payment, generated quiz fill-in-the-blanks, generated quiz MCQ, generated quiz true-false, paypal, quiz questions, and quiz options endpoints
  return courseCategoryData.endpoints.find(e => e.id === endpointId) ||
    courseData.endpoints.find(e => e.id === endpointId) ||
    moduleData.endpoints.find(e => e.id === endpointId) ||
    reviewData.endpoints.find(e => e.id === endpointId) ||
    sessionData.endpoints.find(e => e.id === endpointId) ||
    preDefinedQuestionData.endpoints.find(e => e.id === endpointId) ||
    quizData.endpoints.find(e => e.id === endpointId) ||
    predefinedOptionData.endpoints.find(e => e.id === endpointId) ||
    quizPredefinedQuestionData.endpoints.find(e => e.id === endpointId) ||
    assignmentCompletionData.endpoints.find(e => e.id === endpointId) ||
    assignmentData.endpoints.find(e => e.id === endpointId) ||
    assignmentResponseData.endpoints.find(e => e.id === endpointId) ||
    adminAuthData.endpoints.find(e => e.id === endpointId) ||
    userData.endpoints.find(e => e.id === endpointId) ||
    enrollmentData.endpoints.find(e => e.id === endpointId) ||
    paymentData.endpoints.find(e => e.id === endpointId) ||
    generatedQuizFillInTheBlanksData.endpoints.find(e => e.id === endpointId) ||
    generatedQuizMcqData.endpoints.find(e => e.id === endpointId) ||
    generatedQuizTrueFalseData.endpoints.find(e => e.id === endpointId) ||
    paypalData.endpoints.find(e => e.id === endpointId) ||
    quizQuestionData.endpoints.find(e => e.id === endpointId) ||
    quizOptionData.endpoints.find(e => e.id === endpointId) ||
    audioToScriptData.endpoints.find(e => e.id === endpointId) ||
    bestOptionQuestionData.endpoints.find(e => e.id === endpointId) ||
    dragAndDropData.endpoints.find(e => e.id === endpointId) ||
    quizCompletionData.endpoints.find(e => e.id === endpointId) ||
    quizResponseData.endpoints.find(e => e.id === endpointId) ||
    realWordData.endpoints.find(e => e.id === endpointId) ||
    summarizePassageData.endpoints.find(e => e.id === endpointId) ||
    textBasedQuizData.endpoints.find(e => e.id === endpointId) ||
    challengeAnalyticsData.endpoints.find(e => e.id === endpointId) ||
    coursePerformanceAnalyticsData.endpoints.find(e => e.id === endpointId) ||
    leaderboardAnalyticsData.endpoints.find(e => e.id === endpointId) ||
    revenueAnalyticsData.endpoints.find(e => e.id === endpointId) ||
    timeBasedAnalyticsData.endpoints.find(e => e.id === endpointId) ||
    userEngagementAnalyticsData.endpoints.find(e => e.id === endpointId) ||
    challengeCategoryData.endpoints.find(e => e.id === endpointId) ||
    dailyChallengeData.endpoints.find(e => e.id === endpointId) ||
    mcqChallengeData.endpoints.find(e => e.id === endpointId) ||
    userChallengePhaseData.endpoints.find(e => e.id === endpointId) ||
    userChallengeQuestData.endpoints.find(e => e.id === endpointId) ||
    challengePhaseData.endpoints.find(e => e.id === endpointId) ||
    challengeQuestData.endpoints.find(e => e.id === endpointId) ||
    challengeTaskData.endpoints.find(e => e.id === endpointId) ||
    userChallengeTaskData.endpoints.find(e => e.id === endpointId) ||
    userDailyChallengeData.endpoints.find(e => e.id === endpointId) ||
    cheatsheetData.endpoints.find(e => e.id === endpointId) ||
    cheetsheetMainSectionData.endpoints.find(e => e.id === endpointId) ||
    cheetsheetSectionData.endpoints.find(e => e.id === endpointId) ||
    learningProgressData.endpoints.find(e => e.id === endpointId) ||
    countryData.endpoints.find(e => e.id === endpointId) ||
    stateData.endpoints.find(e => e.id === endpointId) ||
    cityData.endpoints.find(e => e.id === endpointId) ||
    partnerData.endpoints.find(e => e.id === endpointId) ||
    roleData.endpoints.find(e => e.id === endpointId) ||
    rolePermissionData.endpoints.find(e => e.id === endpointId) ||
    studentFAQResponseData.endpoints.find(e => e.id === endpointId) ||
    supportData.endpoints.find(e => e.id === endpointId) ||
    userStreaksData.endpoints.find(e => e.id === endpointId) ||
    wishlistData.endpoints.find(e => e.id === endpointId) ||
    courseFAQData.endpoints.find(e => e.id === endpointId) ||
    courseFAQOptionData.endpoints.find(e => e.id === endpointId) ||
    topicContentData.endpoints.find(e => e.id === endpointId) ||
       topicData.endpoints.find(e => e.id === endpointId);
};

const getLearningProgress = () => {
  if (!learningProgressData.endpoints[0]?.responses || !Array.isArray(learningProgressData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return learningProgressData.endpoints[0].responses[0].example.map(progress => ({
    id: progress.id,
    name: progress.name
  }));
};

const getCourses = () => {
  if (!courseData.endpoints[0]?.responses || !Array.isArray(courseData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return courseData.endpoints[0].responses[0].example.map(course => ({
    id: course.id,
    name: course.title
  }));
};

const getModules = () => {
  if (!moduleData.endpoints[0]?.responses || !Array.isArray(moduleData.endpoints[0]?.responses[0]?.example?.modules)) {
    return [];
  }
  return moduleData.endpoints[0].responses[0].example.modules.map(module => ({
    id: module.id,
    name: module.title
  }));
};

const getReviews = () => {
  if (!reviewData.endpoints[0]?.responses || !Array.isArray(reviewData.endpoints[0]?.responses[0]?.example?.reviews)) {
    return [];
  }
  return reviewData.endpoints[0].responses[0].example.reviews.map(review => ({
    id: review.id,
    name: review.review
  }));
};

const getSessions = () => {
  if (!sessionData.endpoints[0]?.responses || !Array.isArray(sessionData.endpoints[0]?.responses[0]?.example?.sessions)) {
    return [];
  }
  return sessionData.endpoints[0].responses[0].example.sessions.map(session => ({
    id: session.id,
    name: session.title
  }));
};

const getCheatSheets = () => {
  if (!cheatsheetData.endpoints[0]?.responses || !Array.isArray(cheatsheetData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return cheatsheetData.endpoints[0].responses[0].example.map(sheet => ({
    id: sheet.id,
    name: sheet.title
  }));
};

const getCheetsheetMainSections = () => {
  if (!cheetsheetMainSectionData.endpoints[0]?.responses || !Array.isArray(cheetsheetMainSectionData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return cheetsheetMainSectionData.endpoints[0].responses[0].example.map(section => ({
    id: section.id,
    name: section.mainTitle
  }));
};

const getCheetsheetSections = () => {
  if (!cheetsheetSectionData.endpoints[0]?.responses || !Array.isArray(cheetsheetSectionData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return cheetsheetSectionData.endpoints[0].responses[0].example.map(section => ({
    id: section.id,
    name: section.title
  }));
};

const getUserChallengeTasks = () => {
  if (!userChallengeTaskData.endpoints[0]?.responses || !Array.isArray(userChallengeTaskData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return userChallengeTaskData.endpoints[0].responses[0].example.map(task => ({
    id: task.id,
    name: task.ChallengeTask.title
  }));
};

const getUserDailyChallenges = () => {
  if (!userDailyChallengeData.endpoints[0]?.responses || !Array.isArray(userDailyChallengeData.endpoints[0]?.responses[0]?.example?.challenge)) {
    return [];
  }
  return userDailyChallengeData.endpoints[0].responses[0].example.challenge.map(challenge => ({
    id: challenge.id,
    name: challenge.title
  }));
};

const getMcqChallenges = () => {
  if (!mcqChallengeData.endpoints[0]?.responses || !Array.isArray(mcqChallengeData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return mcqChallengeData.endpoints[0].responses[0].example.map(challenge => ({
    id: challenge.id,
    name: challenge.question_text
  }));
};

const getUserChallengePhases = () => {
  if (!userChallengePhaseData.endpoints[0]?.responses || !Array.isArray(userChallengePhaseData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return userChallengePhaseData.endpoints[0].responses[0].example.map(phase => ({
    id: phase.id,
    name: phase.phase_title
  }));
};

const getUserChallengeQuests = () => {
  if (!userChallengeQuestData.endpoints[0]?.responses || !Array.isArray(userChallengeQuestData.endpoints[0]?.responses[0]?.example?.data)) {
    return [];
  }
  return userChallengeQuestData.endpoints[0].responses[0].example.data.map(quest => ({
    id: quest.id,
    name: quest.title
  }));
};

const getChallengePhases = () => {
  if (!challengePhaseData.endpoints[0]?.responses || !Array.isArray(challengePhaseData.endpoints[0]?.responses[0]?.example?.data)) {
    return [];
  }
  return challengePhaseData.endpoints[0].responses[0].example.data.map(phase => ({
    id: phase.id,
    name: phase.title
  }));
};

const getChallengeQuests = () => {
  if (!challengeQuestData.endpoints[0]?.responses || !Array.isArray(challengeQuestData.endpoints[0]?.responses[0]?.example?.data)) {
    return [];
  }
  return challengeQuestData.endpoints[0].responses[0].example.data.map(quest => ({
    id: quest.id,
    name: quest.title
  }));
};

const getChallengeTasks = () => {
  if (!challengeTaskData.endpoints[0]?.responses || !Array.isArray(challengeTaskData.endpoints[0]?.responses[0]?.example?.data)) {
    return [];
  }
  return challengeTaskData.endpoints[0].responses[0].example.data.map(task => ({
    id: task.id,
    name: task.title
  }));
};

const getChallengeCategories = () => {
  if (!challengeCategoryData.endpoints[0]?.responses || !Array.isArray(challengeCategoryData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return challengeCategoryData.endpoints[0].responses[0].example.map(category => ({
    id: category.id,
    name: category.category
  }));
};

const getDailyChallenges = () => {
  if (!dailyChallengeData.endpoints[1]?.responses || !Array.isArray(dailyChallengeData.endpoints[1]?.responses[0]?.example)) {
    return [];
  }
  return dailyChallengeData.endpoints[1].responses[0].example.map(challenge => ({
    id: challenge.id,
    name: challenge.title
  }));
};

const getChallengeAnalytics = () => {
  if (!challengeAnalyticsData.endpoints[0]?.responses || !Array.isArray(challengeAnalyticsData.endpoints[0]?.responses[0]?.example?.data)) {
    return [];
  }
  return challengeAnalyticsData.endpoints[0].responses[0].example.data.map(analytics => ({
    id: analytics.challenge_id,
    name: analytics.challenge_name
  }));
};

const getCoursePerformanceAnalytics = () => {
  if (!coursePerformanceAnalyticsData.endpoints[0]?.responses || !Array.isArray(coursePerformanceAnalyticsData.endpoints[0]?.responses[0]?.example?.data)) {
    return [];
  }
  return coursePerformanceAnalyticsData.endpoints[0].responses[0].example.data.map(analytics => ({
    id: analytics.course_id,
    name: analytics.title
  }));
};

const getLeaderboardAnalytics = () => {
  if (!leaderboardAnalyticsData.endpoints[0]?.responses || !Array.isArray(leaderboardAnalyticsData.endpoints[0]?.responses[0]?.example?.data)) {
    return [];
  }
  return leaderboardAnalyticsData.endpoints[0].responses[0].example.data.map(analytics => ({
    id: analytics.user_id,
    name: analytics.user_name
  }));
};

const getRevenueAnalytics = () => {
  if (!revenueAnalyticsData.endpoints[0]?.responses || !Array.isArray(revenueAnalyticsData.endpoints[0]?.responses[0]?.example?.data)) {
    return [];
  }
  return revenueAnalyticsData.endpoints[0].responses[0].example.data.map(analytics => ({
    id: analytics.category_id,
    name: analytics.category_name
  }));
};

const getTimeBasedAnalytics = () => {
  if (!timeBasedAnalyticsData.endpoints[0]?.responses || !Array.isArray(timeBasedAnalyticsData.endpoints[0]?.responses[0]?.example?.data)) {
    return [];
  }
  return timeBasedAnalyticsData.endpoints[0].responses[0].example.data.map(analytics => ({
    id: analytics.course_id,
    name: analytics.course_title
  }));
};

const getUserEngagementAnalytics = () => {
  if (!userEngagementAnalyticsData.endpoints[0]?.responses || !Array.isArray(userEngagementAnalyticsData.endpoints[0]?.responses[0]?.example?.data)) {
    return [];
  }
  return userEngagementAnalyticsData.endpoints[0].responses[0].example.data.map(analytics => ({
    id: analytics.userId,
    name: analytics.userName
  }));
};

const getRealWordQuestions = () => {
  if (!realWordData.endpoints[0]?.responses || !Array.isArray(realWordData.endpoints[0]?.responses[0]?.example?.quiz)) {
    return [];
  }
  return realWordData.endpoints[0].responses[0].example.quiz.map(question => ({
    id: question.word,
    name: question.word
  }));
};

const getSummarizePassageQuestions = () => {
  if (!summarizePassageData.endpoints[0]?.responses || !Array.isArray(summarizePassageData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return summarizePassageData.endpoints[0].responses[0].example.map(question => ({
    id: question.id,
    name: question.summary
  }));
};

const getTextBasedQuizQuestions = () => {
  if (!textBasedQuizData.endpoints[0]?.responses || !Array.isArray(textBasedQuizData.endpoints[0]?.responses[0]?.example?.quizTexts)) {
    return [];
  }
  return textBasedQuizData.endpoints[0].responses[0].example.quizTexts.map(question => ({
    id: question.id,
    name: question.text
  }));
};

const getQuizResponses = () => {
  if (!quizResponseData.endpoints[0]?.responses || !Array.isArray(quizResponseData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return quizResponseData.endpoints[0].responses[0].example.map(response => ({
    id: response.id,
    name: `Quiz Completion ID: ${response.quizCompletionId}, Question ID: ${response.questionId}`
  }));
};

const getQuizCompletions = () => {
  if (!quizCompletionData.endpoints[0]?.responses || !Array.isArray(quizCompletionData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return quizCompletionData.endpoints[0].responses[0].example.map(completion => ({
    id: completion.id,
    name: `User ID: ${completion.userId}, Quiz ID: ${completion.quizId}`
  }));
};

const getDragDropQuestions = () => {
  if (!dragAndDropData.endpoints[0]?.responses || !Array.isArray(dragAndDropData.endpoints[0]?.responses[0]?.example?.data)) {
    return [];
  }
  return dragAndDropData.endpoints[0].responses[0].example.data.map(question => ({
    id: question.id,
    name: question.prompt
  }));
};

const getCategories = () => {
  if (!courseCategoryData.endpoints[0]?.responses || !Array.isArray(courseCategoryData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return courseCategoryData.endpoints[0].responses[0].example.map(cat => ({
    id: cat.id,
    name: cat.category
  }));
};

const getQuestions = () => {
  if (!preDefinedQuestionData.endpoints[0]?.responses || !Array.isArray(preDefinedQuestionData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return preDefinedQuestionData.endpoints[0].responses[0].example.map(q => ({
    id: q.id,
    name: q.question_text
  }));
};

const getQuizzes = () => {
  if (!quizData.endpoints[0]?.responses || !Array.isArray(quizData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return quizData.endpoints[0].responses[0].example.map(quiz => ({
    id: quiz.id,
    name: quiz.title
  }));
};

const getOptions = () => {
  if (!predefinedOptionData.endpoints[0]?.responses || !Array.isArray(predefinedOptionData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return predefinedOptionData.endpoints[0].responses[0].example.map(option => ({
    id: option.id,
    name: option.option_text
  }));
};

const getQuizPredefinedQuestions = () => {
  if (!quizPredefinedQuestionData.endpoints[0]?.responses || !Array.isArray(quizPredefinedQuestionData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return quizPredefinedQuestionData.endpoints[0].responses[0].example.map(qpq => ({
    id: qpq.id,
    name: `Quiz ID: ${qpq.quiz_id}, Question ID: ${qpq.pre_defined_question_id}`
  }));
};

const getAssignmentCompletions = () => {
  if (!assignmentCompletionData.endpoints[0]?.responses || !Array.isArray(assignmentCompletionData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return assignmentCompletionData.endpoints[0].responses[0].example.map(ac => ({
    id: ac.id,
    name: `User ID: ${ac.userId}, Assignment ID: ${ac.assignmentId}`
  }));
};

const getAssignments = () => {
  if (!assignmentData.endpoints[0]?.responses || !Array.isArray(assignmentData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return assignmentData.endpoints[0].responses[0].example.map(assignment => ({
    id: assignment.id,
    name: assignment.title
  }));
};

const getAssignmentResponses = () => {
  if (!assignmentResponseData.endpoints[0]?.responses || !Array.isArray(assignmentResponseData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return assignmentResponseData.endpoints[0].responses[0].example.map(ar => ({
    id: ar.id,
    name: `Assignment Completion ID: ${ar.assignmentCompletionId}, Question ID: ${ar.questionId}`
  }));
};

const getAdminAuths = () => {
  if (!adminAuthData.endpoints[0]?.responses || !Array.isArray(adminAuthData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return adminAuthData.endpoints[0].responses[0].example.map(admin => ({
    id: admin.id,
    name: admin.username
  }));
};

const getUserAuths = () => {
  if (!userData.endpoints[0]?.responses || !Array.isArray(userData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return userData.endpoints[0].responses[0].example.map(user => ({
    id: user.id,
    name: user.username
  }));
};

const getEnrollments = () => {
  if (!enrollmentData.endpoints[0]?.responses || !Array.isArray(enrollmentData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return enrollmentData.endpoints[0].responses[0].example.map(enrollment => ({
    id: enrollment.id,
    name: `User ID: ${enrollment.user_id}, Course ID: ${enrollment.course_id}`
  }));
};

const getPayments = () => {
  if (!paymentData.endpoints[0]?.responses || !Array.isArray(paymentData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return paymentData.endpoints[0].responses[0].example.map(payment => ({
    id: payment.id,
    name: `Enrollment ID: ${payment.enrollment_id}, Amount: ${payment.amount}`
  }));
};

const getGeneratedQuizFillInTheBlanks = () => {
  if (!generatedQuizFillInTheBlanksData.endpoints[0]?.responses || !Array.isArray(generatedQuizFillInTheBlanksData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return generatedQuizFillInTheBlanksData.endpoints[0].responses[0].example.map(question => ({
    id: question.id,
    name: question.text
  }));
};

const getGeneratedQuizMcq = () => {
  if (!generatedQuizMcqData.endpoints[0]?.responses || !Array.isArray(generatedQuizMcqData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return generatedQuizMcqData.endpoints[0].responses[0].example.map(question => ({
    id: question.id,
    name: question.text
  }));
};

const getGeneratedQuizTrueFalse = () => {
  if (!generatedQuizTrueFalseData.endpoints[0]?.responses || !Array.isArray(generatedQuizTrueFalseData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return generatedQuizTrueFalseData.endpoints[0].responses[0].example.map(question => ({
    id: question.id,
    name: question.text
  }));
};

const getPaypalOrders = () => {
  if (!paypalData.endpoints[0]?.responses || !Array.isArray(paypalData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return paypalData.endpoints[0].responses[0].example.map(order => ({
    id: order.id,
    name: `Order ID: ${order.id}`
  }));
};

const getQuizQuestions = () => {
  if (!quizQuestionData.endpoints[0]?.responses || !Array.isArray(quizQuestionData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return quizQuestionData.endpoints[0].responses[0].example.map(question => ({
    id: question.id,
    name: question.question_text
  }));
};

const getQuizOptions = () => {
  if (!quizOptionData.endpoints[0]?.responses || !Array.isArray(quizOptionData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return quizOptionData.endpoints[0].responses[0].example.map(option => ({
    id: option.id,
    name: option.option_text
  }));
};

const getAudioToScriptQuestions = () => {
  if (!audioToScriptData.endpoints[0]?.responses || !Array.isArray(audioToScriptData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return audioToScriptData.endpoints[0].responses[0].example.map(question => ({
    id: question.id,
    name: question.script
  }));
};

const getBestOptionQuestions = () => {
  if (!bestOptionQuestionData.endpoints[0]?.responses || !Array.isArray(bestOptionQuestionData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return bestOptionQuestionData.endpoints[0].responses[0].example.map(question => ({
    id: question.id,
    name: question.passage
  }));
};

const getCountries = () => {
  if (!countryData.endpoints[0]?.responses || !Array.isArray(countryData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return countryData.endpoints[0].responses[0].example.map(country => ({
    id: country.id,
    name: country.name
  }));
};

const getStates = () => {
  if (!stateData.endpoints[0]?.responses || !Array.isArray(stateData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return stateData.endpoints[0].responses[0].example.map(state => ({
    id: state.id,
    name: state.name
  }));
};

const getCities = () => {
  if (!cityData.endpoints[0]?.responses || !Array.isArray(cityData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return cityData.endpoints[0].responses[0].example.map(city => ({
    id: city.id,
    name: city.name
  }));
};

const getPartners = () => {
  if (!partnerData.endpoints[0]?.responses || !Array.isArray(partnerData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return partnerData.endpoints[0].responses[0].example.map(partner => ({
    id: partner.id,
    name: partner.name
  }));
};

const getRoles = () => {
  if (!roleData.endpoints[0]?.responses || !Array.isArray(roleData.endpoints[0]?.responses[0]?.example?.data)) {
    return [];
  }
  return roleData.endpoints[0].responses[0].example.data.map(role => ({
    id: role.id,
    name: role.name
  }));
};

const getRolePermissions = () => {
  if (!rolePermissionData.endpoints[0]?.responses || !Array.isArray(rolePermissionData.endpoints[0]?.responses[0]?.example?.data)) {
    return [];
  }
  return rolePermissionData.endpoints[0].responses[0].example.data.map(permission => ({
    id: permission.role_permission_id,
    name: permission.section
  }));
};

const getFAQResponses = () => {
  if (!studentFAQResponseData.endpoints[0]?.responses || !Array.isArray(studentFAQResponseData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return studentFAQResponseData.endpoints[0].responses[0].example.map(faq => ({
    id: faq.id,
    name: faq.faq_question
  }));
};

const getSupportTickets = () => {
  if (!supportData.endpoints[0]?.responses || !Array.isArray(supportData.endpoints[0]?.responses[0]?.example?.tickets)) {
    return [];
  }
  return supportData.endpoints[0].responses[0].example.tickets.map(ticket => ({
    id: ticket.id,
    name: ticket.title
  }));
};

const getUserStreaks = () => {
  if (!userStreaksData.endpoints[0]?.responses || !Array.isArray(userStreaksData.endpoints[0]?.responses[0]?.example?.userStreak)) {
    return [];
  }
  return userStreaksData.endpoints[0].responses[0].example.userStreak.map(streak => ({
    id: streak.id,
    name: `Streak ${streak.id}`
  }));
};

const getWishlists = () => {
  if (!wishlistData.endpoints[0]?.responses || !Array.isArray(wishlistData.endpoints[0]?.responses[0]?.example?.data)) {
    return [];
  }
  return wishlistData.endpoints[0].responses[0].example.data.map(wishlist => ({
    id: wishlist.id,
    name: `Wishlist ${wishlist.id}`
  }));
};

const getCourseFAQs = () => {
  if (!courseFAQData.endpoints[0]?.responses || !Array.isArray(courseFAQData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return courseFAQData.endpoints[0].responses[0].example.map(faq => ({
    id: faq.id,
    name: faq.question
  }));
};

const getCourseFAQOptions = () => {
  if (!courseFAQOptionData.endpoints[0]?.responses || !Array.isArray(courseFAQOptionData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return courseFAQOptionData.endpoints[0].responses[0].example.map(option => ({
    id: option.id,
    name: option.option_text
  }));
};


const getTopicContents = () => {
  if (!topicContentData.endpoints[0]?.responses || !Array.isArray(topicContentData.endpoints[0]?.responses[0]?.example?.data)) {
    return [];
  }
  return topicContentData.endpoints[0].responses[0].example.data.map(content => ({
    id: content.id,
    name: `Content ${content.id}`
  }));
};

const getTopics = () => {
  if (!topicData.endpoints[0]?.responses || !Array.isArray(topicData.endpoints[0]?.responses[0]?.example)) {
    return [];
  }
  return topicData.endpoints[0].responses[0].example.map(topic => ({
    id: topic.id,
    name: topic.title
  }));
};


const getResponse = (endpointId, selectedId) => {
  const endpoint = getEndpoint(endpointId);
  if (!endpoint) return null;

  let response = endpoint.responses[0]?.example;

  if (endpointId === 'get-all-course-categories' && selectedId && Array.isArray(response)) {
    response = response.filter(cat => cat.id === selectedId);
  } else if (endpointId === 'get-all-predefined-questions' && selectedId && Array.isArray(response)) {
    response = response.filter(q => q.id === selectedId);
  } else if (endpointId === 'get-all-quizzes' && selectedId && Array.isArray(response)) {
    response = response.filter(quiz => quiz.id === selectedId);
  } else if (endpointId === 'get-all-predefined-options' && selectedId && Array.isArray(response)) {
    response = response.filter(option => option.id === selectedId);
  } else if (endpointId === 'get-all-quiz-predefined-questions' && selectedId && Array.isArray(response)) {
    response = response.filter(qpq => qpq.id === selectedId);
  } else if (endpointId === 'get-all-assignment-completions' && selectedId && Array.isArray(response)) {
    response = response.filter(ac => ac.id === selectedId);
  } else if (endpointId === 'get-all-assignments' && selectedId && Array.isArray(response)) {
    response = response.filter(assignment => assignment.id === selectedId);
  } else if (endpointId === 'create-assignment-responses' && selectedId && Array.isArray(response)) {
    response = response.filter(ar => ar.id === selectedId);
  } else if (endpointId === 'get-all-admins' && selectedId && Array.isArray(response)) {
    response = response.filter(admin => admin.id === selectedId);
  } else if (endpointId === 'user-signup' && selectedId && Array.isArray(response)) {
    response = response.filter(user => user.id === selectedId);
  } else if (endpointId === 'get-all-enrollments' && selectedId && Array.isArray(response)) {
    response = response.filter(enrollment => enrollment.id === selectedId);
  } else if (endpointId === 'get-all-payments' && selectedId && Array.isArray(response)) {
    response = response.filter(payment => payment.id === selectedId);
  } else if (endpointId === 'get-all-fill-in-the-blanks' && selectedId && Array.isArray(response)) {
    response = response.filter(question => question.id === selectedId);
  } else if (endpointId === 'get-all-mcq' && selectedId && Array.isArray(response)) {
    response = response.filter(question => question.id === selectedId);
  } else if (endpointId === 'get-all-true-false' && selectedId && Array.isArray(response)) {
    response = response.filter(question => question.id === selectedId);
  } else if (endpointId === 'create-order' && selectedId && Array.isArray(response)) {
    response = response.filter(order => order.id === selectedId);
  } else if (endpointId === 'get-all-quiz-questions' && selectedId && Array.isArray(response)) {
    response = response.filter(question => question.id === selectedId);
  } else if (endpointId === 'get-all-quiz-options' && selectedId && Array.isArray(response)) {
    response = response.filter(option => option.id === selectedId);
  } else if (endpointId === 'get-all-audio-to-script-questions' && selectedId && Array.isArray(response)) {
    response = response.filter(question => question.id === selectedId);
  } else if (endpointId === 'get-all-best-option-questions' && selectedId && Array.isArray(response)) {
    response = response.filter(question => question.id === selectedId);
  } else if (endpointId === 'get-all-drag-drop-questions' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(question => question.id === selectedId);
  } else if (endpointId === 'get-quiz-responses-by-student-id' && selectedId && Array.isArray(response)) {
    response = response.filter(completion => completion.id === selectedId);
  } else if (endpointId === 'create-quiz-response' && selectedId && Array.isArray(response)) {
    response = response.filter(response => response.id === selectedId);
  } else if (endpointId === 'get-random-real-word-quiz' && selectedId && Array.isArray(response?.quiz)) {
    response = response.quiz.filter(question => question.word === selectedId);
  } else if (endpointId === 'get-all-summarize-passage-questions' && selectedId && Array.isArray(response)) {
    response = response.filter(question => question.id === selectedId);
  } else if (endpointId === 'get-all-quiz-questions' && selectedId && Array.isArray(response?.quizTexts)) {
    response = response.quizTexts.filter(question => question.id === selectedId);
  } else if (endpointId === 'get-completion-stats-across-all-challenges' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(analytics => analytics.challenge_id === selectedId);
  } else if (endpointId === 'get-user-learning-overview' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(analytics => analytics.user_id === selectedId);
  } else if (endpointId === 'get-attempts-required-to-complete-challenges' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(analytics => analytics.challenge_id === selectedId);
  } else if (endpointId === 'get-top-enrolled-courses' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(analytics => analytics.course_id === selectedId);
  } else if (endpointId === 'get-top-rated-courses' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(analytics => analytics.course_id === selectedId);
  } else if (endpointId === 'get-categories-with-most-enrollments' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(analytics => analytics.category_id === selectedId);
  } else if (endpointId === 'get-average-time-to-complete-course' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(analytics => analytics.course_id === selectedId);
  } else if (endpointId === 'get-top-performers-by-challenge-category' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(analytics => analytics.category_name === selectedId);
  } else if (endpointId === 'get-users-with-highest-points' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(analytics => analytics.user_id === selectedId);
  } else if (endpointId === 'get-revenue-by-course-category' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(analytics => analytics.category_id === selectedId);
  } else if (endpointId === 'get-customer-lifetime-value' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(analytics => analytics.user_id === selectedId);
  } else if (endpointId === 'get-todays-revenue' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(analytics => analytics.hour === selectedId);
  } else if (endpointId === 'get-this-weeks-revenue' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(analytics => analytics.day === selectedId);
  } else if (endpointId === 'get-monthly-revenue' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(analytics => analytics.date === selectedId);
  } else if (endpointId === 'get-yearly-revenue' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(analytics => analytics.month === selectedId);
  } else if (endpointId === 'get-overall-revenue' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(analytics => analytics.year === selectedId);
  } else if (endpointId === 'get-estimated-vs-actual-completion' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(analytics => analytics.course_id === selectedId);
  } else if (endpointId === 'get-course-completion' && selectedId && Array.isArray(response?.data?.courseCompletionRates)) {
    response = response.data.courseCompletionRates.filter(analytics => analytics.courseId === selectedId);
  } else if (endpointId === 'get-average-time-spent' && selectedId && Array.isArray(response?.data?.averageTimePerUser)) {
    response = response.data.averageTimePerUser.filter(analytics => analytics.userId === selectedId);
  } else if (endpointId === 'get-average-session-length' && selectedId && Array.isArray(response?.data?.averageSessionPerUser)) {
    response = response.data.averageSessionPerUser.filter(analytics => analytics.userId === selectedId);
  } else if (endpointId === 'get-recent-enrollments' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(analytics => analytics.user_name === selectedId);
  } else if (endpointId === 'get-student-faq-analytics' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(analytics => analytics.courseId === selectedId);
  } else if (endpointId === 'get-all-challenge-categories' && selectedId && Array.isArray(response)) {
    response = response.filter(category => category.id === selectedId);
  } else if (endpointId === 'get-all-daily-challenges' && selectedId && Array.isArray(response)) {
    response = response.filter(challenge => challenge.id === selectedId);
  } else if (endpointId === 'create-mcq-challenge' && selectedId && Array.isArray(response)) {
    response = response.filter(challenge => challenge.id === selectedId);
  } else if (endpointId === 'start-user-challenge-phase' && selectedId && Array.isArray(response)) {
    response = response.filter(phase => phase.id === selectedId);
  } else if (endpointId === 'get-all-challenges' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(quest => quest.id === selectedId);
  } else if (endpointId === 'get-all-challenge-phases' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(phase => phase.id === selectedId);
  } else if (endpointId === 'get-all-challenge-quests' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(quest => quest.id === selectedId);
  } else if (endpointId === 'get-all-challenge-tasks' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(task => task.id === selectedId);
  } else if (endpointId === 'start-user-challenge-task' && selectedId && Array.isArray(response)) {
    response = response.filter(task => task.id === selectedId);
  } else if (endpointId === 'start-challenge-by-id' && selectedId && Array.isArray(response?.challenge)) {
    response = response.challenge.filter(challenge => challenge.id === selectedId);
  } else if (endpointId === 'get-all-cheatsheets' && selectedId && Array.isArray(response)) {
    response = response.filter(sheet => sheet.id === selectedId);
  } else if (endpointId === 'get-all-main-sections' && selectedId && Array.isArray(response)) {
    response = response.filter(section => section.id === selectedId);
  } else if (endpointId === 'get-all-cheetsheet-sections' && selectedId && Array.isArray(response)) {
    response = response.filter(section => section.id === selectedId);
  } else if (endpointId === 'get-all-courses' && selectedId && Array.isArray(response)) {
    response = response.filter(course => course.id === selectedId);
  } else if (endpointId === 'get-all-modules' && selectedId && Array.isArray(response?.modules)) {
    response = response.modules.filter(module => module.id === selectedId);
  } else if (endpointId === 'get-all-reviews' && selectedId && Array.isArray(response?.reviews)) {
    response = response.reviews.filter(review => review.id === selectedId);
  } else if (endpointId === 'get-all-sessions' && selectedId && Array.isArray(response?.sessions)) {
    response = response.sessions.filter(session => session.id === selectedId);
  } else if (endpointId === 'check-topic-completion' && selectedId && Array.isArray(response)) {
    response = response.filter(progress => progress.id === selectedId);
  } else if (endpointId === 'get-all-countries' && selectedId && Array.isArray(response)) {
    response = response.filter(country => country.id === selectedId);
  } else if (endpointId === 'get-all-states' && selectedId && Array.isArray(response)) {
    response = response.filter(state => state.id === selectedId);
  } else if (endpointId === 'get-all-cities' && selectedId && Array.isArray(response)) {
    response = response.filter(city => city.id === selectedId);
  } else if (endpointId === 'get-all-partners' && selectedId && Array.isArray(response)) {
    response = response.filter(partner => partner.id === selectedId);
  } else if (endpointId === 'get-all-roles' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(role => role.id === selectedId);
  } else if (endpointId === 'get-all-role-permissions' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(permission => permission.role_permission_id === selectedId);
  } else if (endpointId === 'get-all-faq-responses' && selectedId && Array.isArray(response)) {
    response = response.filter(faq => faq.id === selectedId);
  } else if (endpointId === 'get-all-support-tickets' && selectedId && Array.isArray(response?.tickets)) {
    response = response.tickets.filter(ticket => ticket.id === selectedId);
  } else if (endpointId === 'get-user-streak' && selectedId && Array.isArray(response?.userStreak)) {
    response = response.userStreak.filter(streak => streak.id === selectedId);
  } else if (endpointId === 'get-wishlist-by-user' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(wishlist => wishlist.id === selectedId);
  } else if (endpointId === 'get-all-faqs' && selectedId && Array.isArray(response)) {
    response = response.filter(faq => faq.id === selectedId);
  } else if (endpointId === 'get-all-faq-options' && selectedId && Array.isArray(response)) {
    response = response.filter(option => option.id === selectedId);
  } else if (endpointId === 'get-topic-content-by-topic-id' && selectedId && Array.isArray(response?.data)) {
    response = response.data.filter(content => content.id === selectedId);
  }else if (endpointId === 'get-topic-by-id' && selectedId && Array.isArray(response?.topic)) {
    response = response.topic.filter(topic => topic.id === selectedId);
  }

  return response;
};

const rightSidebarData = {
  codeExamples,
  methodStyles,
  defaultTab: "JavaScript",
  tabs: ["JavaScript", "Python", "cURL"],
  getEndpoint,
  getCategories,
  getCourses,
  getModules,
  getReviews,
  getSessions,
  getQuestions,
  getQuizzes,
  getOptions,
  getQuizPredefinedQuestions,
  getAssignmentCompletions,
  getAssignments,
  getAssignmentResponses,
  getAdminAuths,
  getUserAuths,
  getEnrollments,
  getResponse,
  getPayments,
  getGeneratedQuizFillInTheBlanks,
  getGeneratedQuizMcq,
  getGeneratedQuizTrueFalse,
  getPaypalOrders,
  getQuizQuestions,
  getQuizOptions,
  getAudioToScriptQuestions,
  getBestOptionQuestions,
  getDragDropQuestions,
  getQuizCompletions,
  getQuizResponses,
  getRealWordQuestions,
  getSummarizePassageQuestions,
  getTextBasedQuizQuestions,
  getChallengeAnalytics,
  getCoursePerformanceAnalytics,
  getLeaderboardAnalytics,
  getRevenueAnalytics,
  getTimeBasedAnalytics,
  getUserEngagementAnalytics,
  getChallengeCategories,
  getDailyChallenges,
  getMcqChallenges,
  getUserChallengePhases,
  getUserChallengeQuests,
  getChallengePhases,
  getChallengeQuests,
  getChallengeTasks,
  getUserChallengeTasks,
  getUserDailyChallenges,
  getCheatSheets,
  getCheetsheetMainSections,
  getCheetsheetSections,
  getLearningProgress,
  getCountries,
  getStates,
  getCities,
  getPartners,
  getRoles,
  getRolePermissions,
  getFAQResponses,
  getSupportTickets,
  getUserStreaks,
  getWishlists,
  getCourseFAQs,
  getCourseFAQOptions,
  getTopicContents,
  getTopics,
};

export default rightSidebarData;
