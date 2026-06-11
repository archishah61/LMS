import courseCategoryData from "./CourseManagement/courseCategoryData";
import preDefinedQuestionData from "./PredefinedQuestions/predefinedQuestion";
import quizData from "./quizzes/quizData"; // Import the quizData
import predefinedOptionData from "./PredefinedQuestions/predefinedOption"; // Import predefinedOptionData
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
import bestOptionQuestionData from "./quizzes/bestOptionQuestionData";
import audioToScriptData from "./quizzes/audioToScriptData";
import dragAndDropData from "./quizzes/dragAndDropData";
import quizCompletionData from "./quizzes/quizCompletionData";
import quizResponseData from "./quizzes/quizResponseData";
import realWordData from "./quizzes/realWordData";
import summarizePassageData from "./quizzes/summaryPassageData";
import textBasedQuizData from "./quizzes/textBasedQuizData";
import timeBasedAnalyticsData from "./analytics/timeBasedAnalyticsData";
import userEngagementAnalyticsData from "./analytics/userEngagementAnalyticsData";
import revenueAnalyticsData from "./analytics/revenueAnalyticsData";
import leaderboardAnalyticsData from "./analytics/leaderboardAnalyticsData";
import coursePerformanceAnalyticsData from "./analytics/coursePerformanceAnalyticsData";
import challengeAnalyticsData from "./analytics/challengeAnalyticsData";
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

const mainData = {
  introduction: {
    title: "Introduction",
    subtitle: "Embark on Your Journey with the Queekies E-Learning API",
    sections: [
      {
        title: "Welcome to the Queekies E-Learning Platform",
        content:
          "We are thrilled to welcome you to the Queekies E-Learning Platform, where innovation meets education. Our platform is designed to transform the landscape of online learning by offering a seamless, interactive, and comprehensive educational experience. Whether you are an educator looking to inspire, a developer aiming to integrate, or an administrator seeking to oversee, our platform provides the tools and flexibility to enhance the digital learning journey. With our robust suite of APIs, we empower you to create, manage, and analyze educational content with unparalleled ease and efficiency.",
      },
      {
        title: "Discover the Queekies Platform",
        content: "The Queekies platform is built on the principles of scalability and adaptability, featuring three core components that work in harmony to deliver an exceptional learning experience:",
        list: [
          {
            title: "Backend API",
            description: "At the heart of our system lies a dynamic Node.js/Express backend, serving as the powerhouse that drives the management of courses, users, enrollments, assessments, and analytics. This backend ensures a smooth and efficient workflow, making educational administration straightforward and effective."
          },
          {
            title: "Frontend Interface",
            description: "Our frontend interface is crafted to be intuitive and engaging, designed to captivate students and encourage them to explore, enroll, and actively participate in courses. This interface fosters an effective and enjoyable learning environment, tailored to meet the diverse needs and preferences of modern learners."
          },
          {
            title: "Admin Dashboard",
            description: "The Admin Dashboard is a comprehensive suite of tools specifically designed for administrators and instructors. It provides the capabilities to manage content, monitor student progress, and generate insightful reports. This dashboard is instrumental in driving educational success and fostering a culture of continuous improvement and innovation."
          },
        ],
      },
      {
        title: "Our Commitment",
        content: "At Queekies E-Learning, we are committed to providing a platform that not only meets but exceeds the expectations of our users. We continuously strive to innovate and improve, ensuring that our platform remains at the forefront of the digital education revolution. Join us on this exciting journey and experience the future of online learning."
      }
    ],
    icon: "🎓",
    path: null,
  },

  endpoints: [
    ...courseCategoryData.endpoints,
    ...courseData.endpoints,
    ...moduleData.endpoints,
    ...reviewData.endpoints,
    ...sessionData.endpoints,
    ...preDefinedQuestionData.endpoints,
    ...predefinedOptionData.endpoints,
    ...quizData.endpoints,
    ...quizPredefinedQuestionData.endpoints,
    ...assignmentCompletionData.endpoints,
    ...assignmentData.endpoints,
    ...assignmentResponseData.endpoints,
    ...adminAuthData.endpoints,
    ...userData.endpoints,
    ...enrollmentData.endpoints,
    ...paymentData.endpoints,
    ...generatedQuizFillInTheBlanksData.endpoints,
    ...generatedQuizMcqData.endpoints,
    ...generatedQuizTrueFalseData.endpoints,
    ...paypalData.endpoints,
    ...quizQuestionData.endpoints,
    ...quizOptionData.endpoints,
    ...audioToScriptData.endpoints,
    ...bestOptionQuestionData.endpoints,
    ...dragAndDropData.endpoints,
    ...quizCompletionData.endpoints,
    ...quizResponseData.endpoints,
    ...realWordData.endpoints,
    ...summarizePassageData.endpoints,
    ...textBasedQuizData.endpoints,
    ...challengeAnalyticsData.endpoints,
    ...coursePerformanceAnalyticsData.endpoints,
    ...leaderboardAnalyticsData.endpoints,
    ...revenueAnalyticsData.endpoints,
    ...timeBasedAnalyticsData.endpoints,
    ...userEngagementAnalyticsData.endpoints,
    ...challengeCategoryData.endpoints,
    ...dailyChallengeData.endpoints,
    ...mcqChallengeData.endpoints,
    ...userChallengePhaseData.endpoints,
    ...userChallengeQuestData.endpoints,
    ...challengePhaseData.endpoints,
    ...challengeQuestData.endpoints,
    ...challengeTaskData.endpoints,
    ...userChallengeTaskData.endpoints,
    ...userDailyChallengeData.endpoints,
    ...cheatsheetData.endpoints,
    ...cheetsheetMainSectionData.endpoints,
    ...cheetsheetSectionData.endpoints,
    ...learningProgressData.endpoints,
    ...countryData.endpoints,
    ...stateData.endpoints,
    ...cityData.endpoints,
    ...partnerData.endpoints,
    ...roleData.endpoints,
    ...rolePermissionData.endpoints,
    ...studentFAQResponseData.endpoints,
    ...supportData.endpoints,
    ...userStreaksData.endpoints,
    ...wishlistData.endpoints,
     ...courseFAQData.endpoints,
  ...courseFAQOptionData.endpoints,
  ...topicContentData.endpoints,
  ...topicData.endpoints,
  ]
};

export default mainData;
