import courseCategoryData from "./CourseManagement/courseCategoryData";
import preDefinedQuestionData from "./PredefinedQuestions/predefinedQuestion";
import quizData from "./quizzes/quizData"; // Import the quizData
import predefinedOptionData from "./PredefinedQuestions/predefinedOption"; // Import the predefinedOptionData
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
import userChallengeTaskData from "./challengeData/ChallengeProgress/userChallengeTaskData";
import challengePhaseData from "./challengeData/ChallengeQuestManagement/challengePhaseData";
import challengeQuestData from "./challengeData/ChallengeQuestManagement/challengeQuestData";
import challengeTaskData from "./challengeData/ChallengeQuestManagement/challengeTaskData";
import userDailyChallengeData from "./challengeData/DailyChallenge/userDailyChallengeData";
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


const sidebarData = [
  {
    id: "introduction",
    title: "Introduction",
    type: "tab",
  },
  {
    id: "admin-auth",
    title: "Admin Auth",
    type: "section",
    children: [
      {
        id: "admin-auth",
        title: "Admin Auth",
        type: "dropdown",
        endpoints: adminAuthData.endpoints,
      },
    ],
  },
  {
    id: "analytics",
    title: "Analytics",
    type: "section",
    children: [
      {
        id: "challenge-analytics",
        title: "Challenge Analytics",
        type: "dropdown",
        endpoints: challengeAnalyticsData.endpoints,
      },
      {
        id: "course-performance-analytics",
        title: "Course Performance Analytics",
        type: "dropdown",
        endpoints: coursePerformanceAnalyticsData.endpoints,
      },
      {
        id: "leaderboard-analytics",
        title: "Leaderboard Analytics",
        type: "dropdown",
        endpoints: leaderboardAnalyticsData.endpoints,
      },
      {
        id: "revenue-analytics",
        title: "Revenue Analytics",
        type: "dropdown",
        endpoints: revenueAnalyticsData.endpoints,
      },
      {
        id: "time-based-analytics",
        title: "Time-Based Analytics",
        type: "dropdown",
        endpoints: timeBasedAnalyticsData.endpoints,
      },
      {
        id: "user-engagement-analytics",
        title: "User Engagement Analytics",
        type: "dropdown",
        endpoints: userEngagementAnalyticsData.endpoints,
      },
    ],
  },
  {
    id: "assignment-management",
    title: "Assignment Management",
    type: "section",
    children: [
      {
        id: "assignment",
        title: "Assignment",
        type: "dropdown",
        endpoints: assignmentData.endpoints,
      },
      {
        id: "assignment-completion",
        title: "Assignment Completion",
        type: "dropdown",
        endpoints: assignmentCompletionData.endpoints,
      },
      {
        id: "assignment-response",
        title: "Assignment Response",
        type: "dropdown",
        endpoints: assignmentResponseData.endpoints,
      },
    ],
  },
  {
    id: "challenges",
    title: "Challenges",
    type: "section",
    children: [
      {
        id: "challenge-category",
        title: "Challenge Category",
        type: "dropdown",
        endpoints: challengeCategoryData.endpoints,
      },
      {
        id: "challenge-phase",
        title: "Challenge Phase",
        type: "dropdown",
        endpoints: challengePhaseData.endpoints,
      },
      {
        id: "challenge-quest",
        title: "Challenge Quest",
        type: "dropdown",
        endpoints: challengeQuestData.endpoints,
      },
      {
        id: "challenge-task",
        title: "Challenge Task",
        type: "dropdown",
        endpoints: challengeTaskData.endpoints,
      },
      {
        id: "daily-challenge",
        title: "Daily Challenge",
        type: "dropdown",
        endpoints: dailyChallengeData.endpoints,
      },
      {
        id: "mcq-challenge",
        title: "MCQ Challenge",
        type: "dropdown",
        endpoints: mcqChallengeData.endpoints,
      },
      {
        id: "user-challenge-phase",
        title: "User Challenge Phase",
        type: "dropdown",
        endpoints: userChallengePhaseData.endpoints,
      },
      {
        id: "user-challenge-quest",
        title: "User Challenge Quest",
        type: "dropdown",
        endpoints: userChallengeQuestData.endpoints,
      },
      {
        id: "user-challenge-task",
        title: "User Challenge Task",
        type: "dropdown",
        endpoints: userChallengeTaskData.endpoints,
      },
      {
        id: "user-daily-challenge",
        title: "User Daily Challenge",
        type: "dropdown",
        endpoints: userDailyChallengeData.endpoints,
      },
    ],
  },
  {
    id: "cheatsheets",
    title: "CheatSheets",
    type: "section",
    children: [
      {
        id: "cheatsheet-management",
        title: "CheatSheet Management",
        type: "dropdown",
        endpoints: cheatsheetData.endpoints,
      },
      {
        id: "cheetsheet-main-section",
        title: "Cheetsheet Main Section",
        type: "dropdown",
        endpoints: cheetsheetMainSectionData.endpoints,
      },
      {
        id: "cheetsheet-section",
        title: "Cheetsheet Section",
        type: "dropdown",
        endpoints: cheetsheetSectionData.endpoints,
      },
    ],
  },
  {
    id: "course-faq-management",
    title: "Course FAQ Management",
    type: "section",
    children: [
      {
        id: "course-faq",
        title: "Course FAQ",
        type: "dropdown",
        endpoints: courseFAQData.endpoints,
      },
      {
        id: "course-faq-option",
        title: "Course FAQ Option",
        type: "dropdown",
        endpoints: courseFAQOptionData.endpoints,
      },
    ],
  },
  {
    id: "course-management",
    title: "Course Management",
    type: "section",
    children: [
      {
        id: "course",
        title: "Course",
        type: "dropdown",
        endpoints: courseData.endpoints,
      },
      {
        id: "course-category",
        title: "Course Category",
        type: "dropdown",
        endpoints: courseCategoryData.endpoints,
      },
      {
        id: "module",
        title: "Module",
        type: "dropdown",
        endpoints: moduleData.endpoints,
      },
      {
        id: "review",
        title: "Review",
        type: "dropdown",
        endpoints: reviewData.endpoints,
      },
      {
        id: "session",
        title: "Session",
        type: "dropdown",
        endpoints: sessionData.endpoints,
      },
    ],
  },
  {
    id: "enrollment",
    title: "Enrollment",
    type: "section",
    children: [
      {
        id: "enrollment",
        title: "Enrollment",
        type: "dropdown",
        endpoints: enrollmentData.endpoints,
      },
    ],
  },
  {
    id: "generated-quiz",
    title: "Generated Quiz",
    type: "section",
    children: [
      {
        id: "generated-quiz-fill-in-the-blanks",
        title: "Generated Quiz Fill In The Blanks",
        type: "dropdown",
        endpoints: generatedQuizFillInTheBlanksData.endpoints,
      },
      {
        id: "generated-quiz-mcq",
        title: "Generated Quiz MCQ",
        type: "dropdown",
        endpoints: generatedQuizMcqData.endpoints,
      },
      {
        id: "generated-quiz-true-false",
        title: "Generated Quiz True False",
        type: "dropdown",
        endpoints: generatedQuizTrueFalseData.endpoints,
      },
    ],
  },
  {
    id: "learning",
    title: "Learning",
    type: "section",
    children: [
      {
        id: "learning-progress",
        title: "Learning Progress",
        type: "dropdown",
        endpoints: learningProgressData.endpoints,
      },
    ],
  },
  {
    id: "location-management",
    title: "Location Management",
    type: "section",
    children: [
      {
        id: "city",
        title: "City",
        type: "dropdown",
        endpoints: cityData.endpoints,
      },
      {
        id: "country",
        title: "Country",
        type: "dropdown",
        endpoints: countryData.endpoints,
      },
      {
        id: "state",
        title: "State",
        type: "dropdown",
        endpoints: stateData.endpoints,
      },
    ],
  },
  {
    id: "partner-management",
    title: "Partner Management",
    type: "section",
    children: [
      {
        id: "partner",
        title: "Partner",
        type: "dropdown",
        endpoints: partnerData.endpoints,
      },
    ],
  },
  {
    id: "payment",
    title: "Payment",
    type: "section",
    children: [
      {
        id: "payment",
        title: "Payment",
        type: "dropdown",
        endpoints: paymentData.endpoints,
      },
    ],
  },
  {
    id: "paypal",
    title: "PayPal",
    type: "section",
    children: [
      {
        id: "paypal",
        title: "PayPal",
        type: "dropdown",
        endpoints: paypalData.endpoints,
      },
    ],
  },
  {
    id: "quiz-management",
    title: "Quiz Management",
    type: "section",
    children: [
      {
        id: "audio-to-script",
        title: "Audio To Script",
        type: "dropdown",
        endpoints: audioToScriptData.endpoints,
      },
      {
        id: "best-option-question",
        title: "Best Option Question",
        type: "dropdown",
        endpoints: bestOptionQuestionData.endpoints,
      },
      {
        id: "drag-drop-question",
        title: "Drag Drop Question",
        type: "dropdown",
        endpoints: dragAndDropData.endpoints,
      },
      {
        id: "predefined-options",
        title: "Predefined Options",
        type: "dropdown",
        endpoints: predefinedOptionData.endpoints,
      },
      {
        id: "predefined-questions",
        title: "Predefined Questions",
        type: "dropdown",
        endpoints: preDefinedQuestionData.endpoints,
      },
      {
        id: "quiz",
        title: "Quiz",
        type: "dropdown",
        endpoints: quizData.endpoints,
      },
      {
        id: "quiz-completion",
        title: "Quiz Completion",
        type: "dropdown",
        endpoints: quizCompletionData.endpoints,
      },
      {
        id: "quiz-options",
        title: "Quiz Options",
        type: "dropdown",
        endpoints: quizOptionData.endpoints,
      },
      {
        id: "quiz-predefined-questions",
        title: "Quiz Predefined Questions",
        type: "dropdown",
        endpoints: quizPredefinedQuestionData.endpoints,
      },
      {
        id: "quiz-questions",
        title: "Quiz Questions",
        type: "dropdown",
        endpoints: quizQuestionData.endpoints,
      },
      {
        id: "quiz-response",
        title: "Quiz Response",
        type: "dropdown",
        endpoints: quizResponseData.endpoints,
      },
      {
        id: "real-word",
        title: "Real Word",
        type: "dropdown",
        endpoints: realWordData.endpoints,
      },
      {
        id: "summarize-passage",
        title: "Summarize Passage",
        type: "dropdown",
        endpoints: summarizePassageData.endpoints,
      },
      {
        id: "text-based-quiz",
        title: "Text Based Quiz",
        type: "dropdown",
        endpoints: textBasedQuizData.endpoints,
      },
    ],
  },
  {
    id: "role-management",
    title: "Role Management",
    type: "section",
    children: [
      {
        id: "role",
        title: "Role",
        type: "dropdown",
        endpoints: roleData.endpoints,
      },
      {
        id: "role-permission",
        title: "Role Permission",
        type: "dropdown",
        endpoints: rolePermissionData.endpoints,
      },
    ],
  },
  {
    id: "student-faq-response",
    title: "Student FAQ Response",
    type: "section",
    children: [
      {
        id: "student-faq-response",
        title: "Student FAQ Response",
        type: "dropdown",
        endpoints: studentFAQResponseData.endpoints,
      },
    ],
  },
  {
    id: "support",
    title: "Support",
    type: "section",
    children: [
      {
        id: "support",
        title: "Support",
        type: "dropdown",
        endpoints: supportData.endpoints,
      },
    ],
  },
  {
    id: "topic-management",
    title: "Topic Management",
    type: "section",
    children: [
      {
        id: "topic-content",
        title: "Topic Content",
        type: "dropdown",
        endpoints: topicContentData.endpoints,
      },
      {
        id: "topic-data",
        title: "Topic Data",
        type: "dropdown",
        endpoints: topicData.endpoints,
      },
    ],
  },
  {
    id: "user-auth",
    title: "User Auth",
    type: "section",
    children: [
      {
        id: "user-auth",
        title: "User Auth",
        type: "dropdown",
        endpoints: userData.endpoints,
      },
    ],
  },
  {
    id: "user-streaks",
    title: "User Streaks",
    type: "section",
    children: [
      {
        id: "user-streaks",
        title: "User Streaks",
        type: "dropdown",
        endpoints: userStreaksData.endpoints,
      },
    ],
  },
  {
    id: "wishlist",
    title: "Wishlist",
    type: "section",
    children: [
      {
        id: "wishlist",
        title: "Wishlist",
        type: "dropdown",
        endpoints: wishlistData.endpoints,
      },
    ],
  },
];

export default sidebarData;
