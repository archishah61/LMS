/* eslint-disable no-unused-vars */
import { configureStore } from "@reduxjs/toolkit";
import { reduxLogger } from "../utils/reduxLogger";
import { setupListeners } from "@reduxjs/toolkit/query";
import { userAuthApi } from "../services/userAuthApi";
import { adminAuthApi } from "../services/adminAuthApi";
import { courseApi } from "../services/Course_Management/courseApi";
import { moduleApi } from "../services/Course_Management/moduleApi";
import { topicApi } from "../services/Course_Management/topicApi";
import { quizApi } from "../services/Course_Management/quizApi";
import { quizQuestionApi } from "../services/Course_Management/quizQuestionApi";
import { quizOptionApi } from "../services/Course_Management/quizOption";
import { textBasedQuizTextApi } from "../services/Course_Management/textBasedQuizTextApi";
import { assignmentApi } from "../services/Content_Management/assignmentApi";
import { preDefinedQuestionsApi } from "../services/Masters/predefinedQuestionAPI";
import { preDefinedOptionsApi } from "../services/Masters/predefinedOptionAPI";
import { quizPreDefinedQuestionsApi } from "../services/Masters/quizPreDefinedQuestionsApi";
// import { progressTrackingApi } from "../services/Learning_Progress/progressTrackingApi";
import { enrollApi } from "../services/Enrollment/enrollAPI";
// import { quizCompletionApi } from "../services/QuizResponse/quizCompletionApi";
import { quizResponseApi } from "../services/QuizResponse/quizResponseApi";
import { assignmentCompletionApi } from "../services/Assignment/assignmentCompletionApi";
import { assignmentResponseApi } from "../services/Assignment/assignmentResponseApi";
import { reviewApi } from "../services/Reviews/reviewApi";
import { wishlistApi } from "../services/Course_Management/wishlistApi";
import { courseCategoryApi } from "../services/Course_Management/courseCatagoryApi";
import { mcqApi } from "../services/Content_Management/genrated_quiz/mcqApi";
import { trueFalseApi } from "../services/Content_Management/genrated_quiz/trueFalseApi";
import { fillBlankApi } from "../services/Content_Management/genrated_quiz/fillBlankApi";
import { profitsApi } from "../services/Profits/profitApi";
import { courseFAQApi } from "../services/Course_Management/courseFAQApi";
import { courseFAQOptionApi } from "../services/Course_Management/courseFAQOptionApi";
import { topicContentApi } from "../services/Course_Management/topicContent";
import { cheatSheetApi } from "../services/CheatSheet/cheatSheetApi";
import { mainSectionApi } from "../services/CheatSheet/cheatSheetContent/mainSectionApi"; // Import the mainSectionApi
import { sectionApi } from "../services/CheatSheet/cheatSheetContent/sectionApi"; // Import the sectionApi
import { dailyChallengeApi } from "../services/Challenge/chllengeAPI"; // Import the sectionApi
import { fillInTheBlanksApi } from "../services/Challenge/fillIntheBlankAPI"; // Import the sectionApi
import { mcqChallengeApi } from "../services/Challenge/challengeMCQAPI"; // Import the sectionApi
import { trueFalseChallengeApi } from "../services/Challenge/challengeTrueFalseAPI"; // Import the sectionApi
import { userChallengeApi } from "../services/Challenge/userChallenge"; // Import the sectionApi
import { challengeCategoryApi } from "../services/Masters/challengeCategoryApi"; // Import the sectionApi
import { partnerApi } from "../services/Become_partner/becomePartnerApi"; // Import the sectionApi
import { partnerActiveApi } from "../services/Become_partner/isPartnerActiveAPI"; // Import the sectionApi
import { featureStatusApi } from "../services/Masters/featureStatusAPI";
import { featureInterestApi } from "../services/Support/featureInterestAPI";
import { userChallengeQuestApi } from "../services/Challenge/userChallengeQuestAPI";
import { userChallengePhaseApi } from "../services/Challenge/userChallengePhaseAPI";
import { userChallengeTaskApi } from "../services/Challenge/userChallengeTaskAPI";
import { challengeResponseApi } from "../services/Challenge/challengeResponseAPI";
import { challengeQuestAPI } from "../services/Challenge/challengeQuestAPI";
import { challengePhaseAPI } from "../services/Challenge/challengePhaseAPI";
import { challengeTaskAPI } from "../services/Challenge/challengeTaskAPI";
import { supportApi } from "../services/Support/supportAPI";
import { contactApi } from "../services/Support/contactApi";
import { aboutApi } from "../services/Support/aboutApi";
import { audioToScriptApi } from "../services/Content_Management/quizType/audioToScriptApi"; // Import the sectionApi
import { audioToScriptResponseApi } from "../services/Learning_Progress/audioToScriptResponseAPI"; // Import the sectionApi
import { realWordQuestionApi } from "../services/Content_Management/quizType/realWordQuestionApi"; // Import the sectionApi
import { realWordResponseApi } from "../services/Learning_Progress/realWordResponseApi"; // Import the sectionApi
import { summarizePassageApi } from "../services/Content_Management/quizType/summaryPassgaeApi"; // Import the sectionApi
import { summarizePassageResponseApi } from "../services/Learning_Progress/summarizePassageResponseApi"; // Import the sectionApi
import { sessionApi } from "../services/Course_Management/sessionApi";
import { dragDropQuestionApi } from "../services/Content_Management/quizType/dragDropQuestionApi";
import { bestOptionQuestionApi } from "../services/Content_Management/quizType/bestOptionQuestionApi";
import { bestOptionResponseApi } from "../services/Learning_Progress/bestOptionResponseApi";
import { completeTheSentenceApi } from "../services/Content_Management/quizType/completeTheSentenceApi";
import { courseTimeTrackingAPI } from "../services/Learning_Progress/courseTimeTrackingAPI";
import { paypalApi } from "../services/PayPal/paypalAPI";
import { razorpayApi } from "../services/Razorpay/razorpayAPI";
import { roleApi } from "../services/RoleAndPermission/roleApi";
import { permissionApi } from "../services/RoleAndPermission/permissionApi";
import { rolePermissionApi } from "../services/RoleAndPermission/rolePermissionApi";
import { countryApi } from "../services/Masters/countryAPI";
import { stateApi } from "../services/Masters/stateAPI";
import { cityApi } from "../services/Masters/cityAPI";
import { tierApi } from "../services/Tier/tierAPI";
import { difficultyLevelApi } from "../services/Tier/difficultyLevelAPI";
import { seoMetaApi } from "../services/LegalPages/seoMetaAPI";
import { courseGenerationHistoryApi } from "../services/Tier/courseGenerationHistoryAPI";
import { challengeAnalyticsApi } from "../services/Reporting/challengeAnalyticsApi";
import { coursePerformanceAnalyticsApi } from "../services/Reporting/coursePerformanceAnalyticsApi";
import { leaderboardAnalyticsApi } from "../services/Reporting/leaderboardAnalyticsApi";
import { revenueFinanceAnalyticsApi } from "../services/Reporting/revenueFinanceAnalyticsApi";
import { timeBasedAnalyticsApi } from "../services/Reporting/timeBasedAnalyticsApi";
import { userEngagementAnalyticsApi } from "../services/Reporting/userEngagementAnalyticsApi";
import { studentFAQResponseApi } from "../services/Student_Management/studentFAQResponseApi";
import { courseProgressRootApi } from "../services/RootApi/courseProgressRootApi";
import { aiApi } from "../services/AIServices";
import { summarizeApi } from "../services/Ai/summarizeApi";
import { summaryApi } from "../services/Ai/summaryApi";
import { bulletPointApi } from "../services/Ai/bulletPointApi";
import { flashCardApi } from "../services/Ai/flashCardApi";
import { paragraphApi } from "../services/Ai/paragraphApi";
import { interviewApi } from "../services/Ai/interviewAPI";
import { performanceTrackingApi } from "../services/Ai_performace_tracking/performanceTrackingApi";
import { performanceFeedbackApi } from "../services/Ai_performace_tracking/performanceFeedbackApi";
import { coursePerformanceTrackingApi } from "../services/Ai_performace_tracking/coursePerformanceTrackingApi";
import { adminStudentPerformanceAnalyticsApi } from "../services/Ai_performace_tracking/adminStudentPerformanceAnalyticsApi";
import { aiInterviewAnalyticsApi } from '../services/Reporting/aiInterviewAnalyticsApi';
import { allCoursesAnalyticsApi } from '../services/Ai_performace_tracking/allCoursesAnalyticsApi';
import { termsOfServiceApi } from '../services/LegalPages/termsOfServices';
import { privacyPolicyApi } from '../services/LegalPages/privacyPolicy';
import { socialMediaApi } from '../services/legalPages/socialMediaApi';
import { subscribeApi } from '../services/Support/subscribeApi';
import { footerSettingApi } from '../services/LegalPages/footerSettingApi';
import { assignmentExtensionRequestApi } from "../services/Assignment/assignmentExtensionRequestApi";
import { contestAPI } from "../services/Contest/contestAPI";
import { blogApi } from "../services/blogs/blogApi";

import { contestTemplateAPI } from "../services/Contest/contestTemplateAPI";
import { contestActivityAPI } from "../services/Contest/contestActivityAPI";
import { contestPrizeAPI } from "../services/Contest/contestPrizeAPI";
import { contestCodingAPI } from "../services/Contest/contestCodingAPI";
import { contestCodingTestCaseAPI } from "../services/Contest/contestCodingTestCaseAPI";
import { contestQuizAPI } from "../services/Contest/contestQuizAPI";
import { userContestAPI } from "../services/Contest/userContestAPI";
import { userActivityAPI } from "../services/Contest/userActivityAPI";
import { userContestQuizAPI } from "../services/Contest/userContestQuizAPI";
import { userContestCodingAPI } from "../services/Contest/userContestCodingAPI";
import { newProgressTrackingApi } from "../services/progressTracking/newProgressTrackingApi";
import { userActivityLogApi } from "../services/Activity/userActivityLogApi";
import { promoCodeApi } from "../services/promocode/promocodeApi";
import { importContentApi } from "../services/importContent/importContentApi";
import { testimonialApi } from "../services/Testimonials/testimonialApi";
import { frontendFaqApi } from "../services/LangingPage_Management/frontendFaqApi";
import { frontendStatisticsApi } from "../services/LangingPage_Management/frontendStatisticsApi";
import { frontendFeaturesApi } from "../services/LangingPage_Management/frontendFeaturesApi";


import aiReducer from "../features/AISlice";
import authReducer from "../features/authSlice";
import userReducer from "../features/userSlice";
import adminReducer from "../features/adminSlice";
import courseReducer from "../features/Course_Management/courseSlice";
import moduleReducer from "../features/Course_Management/moduleSlice";
import topicReducer from "../features/Course_Management/topicSlice";
import quizReducer from "../features/Course_Management/quizSlice";
import quizQuestionReducer from "../features/Course_Management/quizQuestionSlice";
import quizOptionsReducer from "../features/Course_Management/quizOptionSlice";
import textBasedQuizTextReducer from "../features/Course_Management/textBasedQuizTextSlice";
import assignmentReducer from "../features/Content_Management/assignmentSlice";
import predefinedQuestionReducer from "../features/Masters/predefinedQuestionSlice";
import predefinedOptionReducer from "../features/Masters/predefinedOptionSlice";
import quizPreDefinedReducer from "../features/Masters/quizPreDefinedQuestions";
import enrollReducer from "../features/Enrollment/enrollSlice";
import quizCompletionReducer from "../features/QuizResponse/quizCompletionSlice";
import quizResponsesReducer from "../features/QuizResponse/quizResponseSlice";
import assignmentCompletionReducer from "../features/Assignment/assignmentCompletionSlice";
import assignmentResponseReducer from "../features/Assignment/assignmentResponseSlice";
import reviewReducer from "../features/Review/reviewSlice";
import wishlistReducer from "../features/Course_Management/wishlistSlice";
import courseCatagoryReducer from "../features/Course_Management/courseCatagorySlice";
import mcqReducer from "../features/Content_Management/generated_quiz/mcqSlice";
import trueFalseReducer from "../features/Content_Management/generated_quiz/trueFalseSlice";
import fillBlankReducer from "../features/Content_Management/generated_quiz/fillBlankSlice";
import profitReducer from "../features/Profits/profitSlice";
import courseFAQReducer from "../features/Course_Management/courseFAQSlice";
import courseFAQOptionReducer from "../features/Course_Management/courseFAQOptionSlice";
import topicContentReducer from "../features/Course_Management/topicContentSlice";
import cheatSheetReducer from "../features/CheatSheet/cheatSheetSlice";
import mainSectionReducer from "../features/cheatSheet/cheatSheetContent/mainSectionSlice"; // Import the mainSectionSlice
import sectionReducer from "../features/cheatSheet/cheatSheetContent/sectionSlice"; // Import the sectionSlice
import challengeReducer from "../features/Challenge/challengeSlice";
import fillInTheBlankReducer from "../features/Challenge/fillInTheBlankSlice";
import challengeMCQReducer from "../features/Challenge/challengeMCQSlice";
import challengeTrueFalseReducer from "../features/Challenge/challengeTrueFalseSlice";
import userChallengeReducer from "../features/Challenge/uerChallenge";
import challengeCatReducer from "../features/Masters/challengeCatSlice";
import becomePartnerReducer from "../features/BecomePartner/becomePartnerSlice"; // Import the sectionSlice
import partnerActiveReducer from "../features/BecomePartner/isPartnerActiveSlice"; // Import the sectionSlice
import featureStatusReducer from "../features/Masters/featureStatusSlice"; // Import the sectionSlice
import featureInterestReducer from "../features/Support/featureInterestSlice"; // Import the sectionSlice
import userChallengeQuestReducer from "../features/Challenge/userChallengeQuestSlice";
import userChallengePhaseReducer from "../features/Challenge/userChallengePhaseSlice";
import userChallengeTaskReducer from "../features/Challenge/userChallengeTaskSlice";
import challengeResponseReducer from "../features/Challenge/challengeResponseSlice";
import supportReducer from "../features/Support/supportSlice";
import contactReducer from "../features/Support/contactSlice";
import aboutReducer from "../features/Support/aboutSlice";
import challengeQuestReducer from "../features/Challenge/challengeQuestSlice";
import challengePhaseReducer from "../features/Challenge/challengePhaseSlice"; // Import the sectionSlice
import challengeTaskReducer from "../features/Challenge/challengeTaskSlice"; // Import the sectionSlice
import audioToScriptReducer from "../features/Content_Management/quizType/audioToScriptSlice"; // Import the sectionSlice
import audioToScriptResponsesReducer from "../features/QuizResponse/audioToScriptResponsesSlice"; // Import the sectionSlice
import realWordQuestionReducer from "../features/Content_Management/quizType/realWordQuestionSlice"; // Import the sectionSlice
import completeTheSentenceReducer from "../features/Content_Management/quizType/completeTheSentenceSlice"; // Import the sectionSlice
import realWordResponseReducer from "../features/QuizResponse/realWordResponseSlice"; // Import the sectionSlice
import summaryPassgaeReducer from "../features/Content_Management/quizType/summaryPassgaeSlice"; // Import the sectionSlice
import summarizePassageResponseReducer from "../features/QuizResponse/summarizePassageResponseSlice"; // Import the sectionSlice
import sessionReducer from "../features/Course_Management/sessionSlice";
import bestOptionQuestionReducer from "../features/Content_Management/quizType/bestOptionQuestionSlice";
import bestOptionResponseReducer from "../features/QuizResponse/bestOptionResponseSlice";
import courseTimeTrackingReducer from "../features/Course_Management/courseTimeTrackingSlice";
import paypalReducer from "../features/PayPal/paypalSlice";
import razorpayReducer from "../features/Razorpay/razorpaySlice";
import roleReducer from "../features/RoleAndPermission/roleSlice";
import permissionReducer from "../features/RoleAndPermission/permissionSlice";
import rolePermissionReducer from "../features/RoleAndPermission/rolePermissionSlice";

import countryReducer from "../features/Masters/countrySlice";
import stateReducer from "../features/Masters/stateSlice";
import cityReducer from "../features/Masters/citySlice";

import tierReducer from "../features/Tier/tierSlice";
import seoMetaReducer from "../features/LegalPages/seoMetaSlice";
import courseGenerationHistoryReducer from "../features/Tier/courseGenerationHistorySlice";

import challengeAnalyticsReducer from "../features/Reporting/challengeAnalyticsSlice";
import coursePerformanceAnalyticsReducer from "../features/Reporting/coursePerformanceAnalyticsSlice";
import leaderboardAnalyticsReducer from "../features/Reporting/leaderboardAnalyticsSlice";
import revenueFinanceAnalyticsReducer from "../features/Reporting/revenueFinanceAnalyticsSlice";
import timeBasedAnalyticsReducer from "../features/Reporting/timeBasedAnalyticsSlice";
import userEngagementAnalyticsReducer from "../features/Reporting/userEngagementAnalyticsSlice";
import FAQResponseReducer from "../features/FAQResponse/FAQResponseSlice";
import SummarizeReducer from "../features/Ai/summarizeSlice";
import summaryReducer from "../features/Ai/summarySlice";
import bulletPointReducer from "../features/Ai/bulletPointSlice";
import flashCardReducer from "../features/Ai/flashCardSlice";
import interviewReducer from "../features/Ai/interviewSlice";
import performanceTrackingReducer from "../features/Ai_performance_tracking/performanceTrackingSlice";
import performanceFeedbackReducer from "../features/Ai_performance_tracking/performanceFeedbackSlice";
import coursePerformanceTrackingReducer from "../features/Ai_performance_tracking/coursePerformanceTrackingSlice";
import adminStudentPerformanceAnalyticsReducer from "../features/Ai_performance_tracking/adminStudentPerformanceAnalyticsSlice";
import allCoursesAnalyticsReducer from '../features/Ai_performance_tracking/allCoursesAnalyticsSlice';
import termsOfServicesReducer from '../features/LegalPages/termsOfServicesSlice';
import privacyPolicyReducer from '../features/LegalPages/privacyPolicySlice';
import socialMediaReducer from '../features/legalPages/socialMediaSlice';
import subscribeReducer from '../features/Support/subscribeSlice';
import footerSettingReducer from '../features/legalPages/footerSettingSlice';
import assignmentExtensionRequestReducer from '../features/Assignment/assignmentExtensionRequestSlice';

import contestReducer from "../features/Contest/contestSlice";
import contestTemplateReducer from "../features/Contest/contestTemplateSlice";
import contestPrizeReducer from "../features/Contest/contestPrizeSlice";
import contestActivityReducer from "../features/Contest/contestActivitySlice";
import contestCodingReducer from "../features/Contest/contestCodingSlice";
import contestCodingTestCaseReducer from "../features/Contest/contestCodingTestCaseSlice";
import contestQuizReducer from "../features/Contest/contestQuizSlice";
import userContestReducer from "../features/Contest/userContestSlice";
import userActivityReducer from "../features/Contest/userActivitySlice";
import userContestQuizReducer from "../features/Contest/userContestQuizSlice";
import userContestCodingReducer from "../features/Contest/userContestCodingSlice";
import newProgressTrackingReducer from "../features/ProgressTracking/newProgressTrackingSlice";
import userActivityLogReducer from "../features/Activity/userActivityLogSlice";
import promoCodeReducer from "../features/promocode/promocodeSlice";
import importContentReducer from "../features/importContent/importContentSlice";
import frontendFaqReducer from "../features/LangingPage_Management/frontendFaqSlice";
import frontendStatisticsReducer from "../features/LangingPage_Management/frontendStatisticsSlice";
import frontendFeaturesReducer from "../features/LangingPage_Management/frontendFeaturesSlice";

export const store = configureStore({
  reducer: {
    [aiApi.reducerPath]: aiApi.reducer,
    [userAuthApi.reducerPath]: userAuthApi.reducer,
    [adminAuthApi.reducerPath]: adminAuthApi.reducer,
    [courseApi.reducerPath]: courseApi.reducer,
    [moduleApi.reducerPath]: moduleApi.reducer,
    [topicApi.reducerPath]: topicApi.reducer,
    [quizApi.reducerPath]: quizApi.reducer,
    [quizQuestionApi.reducerPath]: quizQuestionApi.reducer,
    [quizOptionApi.reducerPath]: quizOptionApi.reducer,
    [assignmentApi.reducerPath]: assignmentApi.reducer,
    [preDefinedQuestionsApi.reducerPath]: preDefinedQuestionsApi.reducer,
    [preDefinedOptionsApi.reducerPath]: preDefinedOptionsApi.reducer,
    [quizPreDefinedQuestionsApi.reducerPath]: quizPreDefinedQuestionsApi.reducer,
    [enrollApi.reducerPath]: enrollApi.reducer,
    // [progressTrackingApi.reducerPath]: progressTrackingApi.reducer,
    // [quizCompletionApi.reducerPath]: quizCompletionApi.reducer,
    [quizResponseApi.reducerPath]: quizResponseApi.reducer,
    [assignmentCompletionApi.reducerPath]: assignmentCompletionApi.reducer,
    [assignmentResponseApi.reducerPath]: assignmentResponseApi.reducer,
    [textBasedQuizTextApi.reducerPath]: textBasedQuizTextApi.reducer,
    [reviewApi.reducerPath]: reviewApi.reducer,
    [wishlistApi.reducerPath]: wishlistApi.reducer,
    [courseCategoryApi.reducerPath]: courseCategoryApi.reducer,
    [mcqApi.reducerPath]: mcqApi.reducer,
    [trueFalseApi.reducerPath]: trueFalseApi.reducer,
    [fillBlankApi.reducerPath]: fillBlankApi.reducer,
    [profitsApi.reducerPath]: profitsApi.reducer,
    [courseFAQApi.reducerPath]: courseFAQApi.reducer,
    [courseFAQOptionApi.reducerPath]: courseFAQOptionApi.reducer,
    [cheatSheetApi.reducerPath]: cheatSheetApi.reducer,
    [mainSectionApi.reducerPath]: mainSectionApi.reducer, // Add mainSectionApi reducer
    [sectionApi.reducerPath]: sectionApi.reducer, // Add sectionApi reducer
    [dailyChallengeApi.reducerPath]: dailyChallengeApi.reducer, // Add sectionApi reducer
    [fillInTheBlanksApi.reducerPath]: fillInTheBlanksApi.reducer, // Add sectionApi reducer
    [mcqChallengeApi.reducerPath]: mcqChallengeApi.reducer, // Add sectionApi reducer
    [trueFalseChallengeApi.reducerPath]: trueFalseChallengeApi.reducer, // Add sectionApi reducer
    [userChallengeApi.reducerPath]: userChallengeApi.reducer, // Add sectionApi reducer
    [challengeCategoryApi.reducerPath]: challengeCategoryApi.reducer, // Add sectionApi reducer
    [partnerApi.reducerPath]: partnerApi.reducer, // Add sectionApi reducer
    [partnerActiveApi.reducerPath]: partnerActiveApi.reducer, // Add sectionApi reducer
    [featureStatusApi.reducerPath]: featureStatusApi.reducer,
    [featureInterestApi.reducerPath]: featureInterestApi.reducer,
    [userChallengeQuestApi.reducerPath]: userChallengeQuestApi.reducer,
    [userChallengePhaseApi.reducerPath]: userChallengePhaseApi.reducer,
    [userChallengeTaskApi.reducerPath]: userChallengeTaskApi.reducer,
    [challengeResponseApi.reducerPath]: challengeResponseApi.reducer,
    [challengeQuestAPI.reducerPath]: challengeQuestAPI.reducer, // Add sectionApi reducer
    [challengePhaseAPI.reducerPath]: challengePhaseAPI.reducer, // Add sectionApi reducer
    [challengeTaskAPI.reducerPath]: challengeTaskAPI.reducer, // Add sectionApi reducer
    [supportApi.reducerPath]: supportApi.reducer,
    [contactApi.reducerPath]: contactApi.reducer,
    [aboutApi.reducerPath]: aboutApi.reducer,

    [contestAPI.reducerPath]: contestAPI.reducer,
    [contestTemplateAPI.reducerPath]: contestTemplateAPI.reducer,
    [contestPrizeAPI.reducerPath]: contestPrizeAPI.reducer,
    [contestActivityAPI.reducerPath]: contestActivityAPI.reducer,
    [contestCodingAPI.reducerPath]: contestCodingAPI.reducer,
    [contestCodingTestCaseAPI.reducerPath]: contestCodingTestCaseAPI.reducer,
    [contestQuizAPI.reducerPath]: contestQuizAPI.reducer,
    [userContestAPI.reducerPath]: userContestAPI.reducer,
    [userActivityAPI.reducerPath]: userActivityAPI.reducer,
    [userContestQuizAPI.reducerPath]: userContestQuizAPI.reducer,
    [userContestCodingAPI.reducerPath]: userContestCodingAPI.reducer,
    [userActivityLogApi.reducerPath]: userActivityLogApi.reducer,

    [audioToScriptApi.reducerPath]: audioToScriptApi.reducer, // Add sectionApi reducer
    [audioToScriptResponseApi.reducerPath]: audioToScriptResponseApi.reducer, // Add sectionApi reducer
    [realWordQuestionApi.reducerPath]: realWordQuestionApi.reducer,
    [summarizePassageApi.reducerPath]: summarizePassageApi.reducer,
    [summarizePassageResponseApi.reducerPath]:
      summarizePassageResponseApi.reducer,
    [sessionApi.reducerPath]: sessionApi.reducer,
    [dragDropQuestionApi.reducerPath]: dragDropQuestionApi.reducer,
    [bestOptionQuestionApi.reducerPath]: bestOptionQuestionApi.reducer,
    [completeTheSentenceApi.reducerPath]: completeTheSentenceApi.reducer,
    [bestOptionResponseApi.reducerPath]: bestOptionResponseApi.reducer,
    [courseTimeTrackingAPI.reducerPath]: courseTimeTrackingAPI.reducer,
    [paypalApi.reducerPath]: paypalApi.reducer,
    [razorpayApi.reducerPath]: razorpayApi.reducer,
    [topicContentApi.reducerPath]: topicContentApi.reducer,
    [roleApi.reducerPath]: roleApi.reducer,
    [permissionApi.reducerPath]: permissionApi.reducer,
    [rolePermissionApi.reducerPath]: rolePermissionApi.reducer,
    [countryApi.reducerPath]: countryApi.reducer,
    [stateApi.reducerPath]: stateApi.reducer,
    [cityApi.reducerPath]: cityApi.reducer,
    [tierApi.reducerPath]: tierApi.reducer,
    [difficultyLevelApi.reducerPath]: difficultyLevelApi.reducer,
    [courseGenerationHistoryApi.reducerPath]: courseGenerationHistoryApi.reducer,
    [challengeAnalyticsApi.reducerPath]: challengeAnalyticsApi.reducer,
    [coursePerformanceAnalyticsApi.reducerPath]: coursePerformanceAnalyticsApi.reducer,
    [leaderboardAnalyticsApi.reducerPath]: leaderboardAnalyticsApi.reducer,
    [revenueFinanceAnalyticsApi.reducerPath]: revenueFinanceAnalyticsApi.reducer,
    [timeBasedAnalyticsApi.reducerPath]: timeBasedAnalyticsApi.reducer,
    [userEngagementAnalyticsApi.reducerPath]: userEngagementAnalyticsApi.reducer,
    [studentFAQResponseApi.reducerPath]: studentFAQResponseApi.reducer,
    [courseProgressRootApi.reducerPath]: courseProgressRootApi.reducer,
    [summarizeApi.reducerPath]: summarizeApi.reducer,
    [summaryApi.reducerPath]: summaryApi.reducer,
    [bulletPointApi.reducerPath]: bulletPointApi.reducer,
    [flashCardApi.reducerPath]: flashCardApi.reducer,
    [paragraphApi.reducerPath]: paragraphApi.reducer,
    [interviewApi.reducerPath]: interviewApi.reducer,
    [performanceTrackingApi.reducerPath]: performanceTrackingApi.reducer,
    [performanceFeedbackApi.reducerPath]: performanceFeedbackApi.reducer,
    [coursePerformanceTrackingApi.reducerPath]: coursePerformanceTrackingApi.reducer,
    [adminStudentPerformanceAnalyticsApi.reducerPath]: adminStudentPerformanceAnalyticsApi.reducer,
    [aiInterviewAnalyticsApi.reducerPath]: aiInterviewAnalyticsApi.reducer,
    [allCoursesAnalyticsApi.reducerPath]: allCoursesAnalyticsApi.reducer,
    [seoMetaApi.reducerPath]: seoMetaApi.reducer,
    [blogApi.reducerPath]: blogApi.reducer,

    [termsOfServiceApi.reducerPath]: termsOfServiceApi.reducer,
    [privacyPolicyApi.reducerPath]: privacyPolicyApi.reducer,
    [socialMediaApi.reducerPath]: socialMediaApi.reducer,
    [subscribeApi.reducerPath]: subscribeApi.reducer,
    [footerSettingApi.reducerPath]: footerSettingApi.reducer,
    [assignmentExtensionRequestApi.reducerPath]: assignmentExtensionRequestApi.reducer,
    [newProgressTrackingApi.reducerPath]: newProgressTrackingApi.reducer,
    [promoCodeApi.reducerPath]: promoCodeApi.reducer,
    [importContentApi.reducerPath]: importContentApi.reducer,
    [testimonialApi.reducerPath]: testimonialApi.reducer,
    [frontendFaqApi.reducerPath]: frontendFaqApi.reducer,
    [frontendStatisticsApi.reducerPath]: frontendStatisticsApi.reducer,
    [frontendFeaturesApi.reducerPath]: frontendFeaturesApi.reducer,
    ai: aiReducer,
    auth: authReducer,
    user: userReducer,
    admin: adminReducer,
    course: courseReducer,
    module: moduleReducer,
    topic: topicReducer,
    quiz: quizReducer,
    quizQuestion: quizQuestionReducer,
    quizOption: quizOptionsReducer,
    assignment: assignmentReducer,
    preDefinedQuestions: predefinedQuestionReducer,
    preDefinedOptions: predefinedOptionReducer,
    quizPreDefinedQuestions: quizPreDefinedReducer,
    enrollment_info: enrollReducer,
    quizCompletion: quizCompletionReducer,
    quizResponses: quizResponsesReducer,
    assignmentCompletion: assignmentCompletionReducer,
    assignmentResponse: assignmentResponseReducer,
    review_info: reviewReducer,
    wishlist_info: wishlistReducer,
    course_category: courseCatagoryReducer,
    textBasedQuizText: textBasedQuizTextReducer,
    mcq_info: mcqReducer,
    true_false_info: trueFalseReducer,
    fill_blank_info: fillBlankReducer,
    profits_info: profitReducer,
    courseFAQ: courseFAQReducer,
    courseFAQOption: courseFAQOptionReducer,
    cheatSheet_info: cheatSheetReducer,
    mainSection_info: mainSectionReducer, // Add mainSectionSlice reducer
    section_info: sectionReducer, // Add sectionSlice reducer
    daily_challenge: challengeReducer, // Add sectionSlice reducer
    fill_in_the_blanks: fillInTheBlankReducer, // Add sectionSlice reducer
    mcq_challenge: challengeMCQReducer, // Add sectionSlice reducer
    true_false_challenge: challengeTrueFalseReducer, // Add sectionSlice reducer
    user_challenge: userChallengeReducer, // Add sectionSlice reducer
    challengeCategory: challengeCatReducer, // Add sectionSlice reducer
    becomePartner: becomePartnerReducer, // Add sectionSlice reducer
    partner_active: partnerActiveReducer, // Add sectionSlice reducer
    featureStatus: featureStatusReducer,
    featureInterest: featureInterestReducer,
    userChallengeQuest: userChallengeQuestReducer,
    userChallengePhase: userChallengePhaseReducer,
    userChallengeTask: userChallengeTaskReducer,
    challengeResponse: challengeResponseReducer,
    challengeQuest: challengeQuestReducer,
    challengePhase: challengePhaseReducer, // Add sectionSlice reducer
    challengeTask: challengeTaskReducer, // Add sectionSlice reducer
    support: supportReducer,
    contact_info: contactReducer,
    about_info: aboutReducer,
    audioToScript: audioToScriptReducer, // Add sectionSlice reducer
    audioToScriptResponse: audioToScriptResponsesReducer, // Add sectionSlice reducer
    realWordQuestion: realWordQuestionReducer, // Add sectionSlice reducer
    summarizePassage: summaryPassgaeReducer, // Add sectionSlice reducer
    summarizePassageResponse: summarizePassageResponseReducer, // Add sectionSlice reducer
    session: sessionReducer,
    bestOptionQuestion: bestOptionQuestionReducer,
    completeTheSentence: completeTheSentenceReducer,
    bestOptionResponse: bestOptionResponseReducer,
    courseTimeTracking: courseTimeTrackingReducer,
    paypal: paypalReducer,
    razorpay: razorpayReducer,
    topicContent: topicContentReducer,
    role: roleReducer,
    permission: permissionReducer,
    rolePermission: rolePermissionReducer,
    country: countryReducer,
    state: stateReducer,
    city: cityReducer,
    tier: tierReducer,
    courseGenerationHistory: courseGenerationHistoryReducer,
    challenge_analytics: challengeAnalyticsReducer,
    course_performance_analytics: coursePerformanceAnalyticsReducer,
    leaderboard_analytics: leaderboardAnalyticsReducer,
    revenue_finance_analytics: revenueFinanceAnalyticsReducer,
    time_based_analytics: timeBasedAnalyticsReducer,
    user_engagement_analytics: userEngagementAnalyticsReducer,
    studentFAQResponse_info: FAQResponseReducer,
    summarize_info: SummarizeReducer,
    summary: summaryReducer,
    bulletPoint: bulletPointReducer,
    flashCard: flashCardReducer,
    interview_info: interviewReducer,
    performanceTracking: performanceTrackingReducer,
    performanceFeedback: performanceFeedbackReducer,
    coursePerformanceTracking: coursePerformanceTrackingReducer,
    adminStudentPerformanceAnalytics: adminStudentPerformanceAnalyticsReducer,
    allCoursesAnalytics: allCoursesAnalyticsReducer,
    seoMeta: seoMetaReducer,
    termsOfService_info: termsOfServicesReducer,
    privacyPolicy_info: privacyPolicyReducer,
    setSocialMediaInfo: socialMediaReducer,
    setSubscribeInfo: subscribeReducer,
    footerSettingInfo: footerSettingReducer,
    assignmentExtensionRequest: assignmentExtensionRequestReducer,
    contest: contestReducer,
    contestTemplate: contestTemplateReducer,
    contestPrize: contestPrizeReducer,
    contestActivity: contestActivityReducer,
    contestCoding: contestCodingReducer,
    contestCodingTestCase: contestCodingTestCaseReducer,
    contestQuiz: contestQuizReducer,
    userContest: userContestReducer,
    userActivity: userActivityReducer,
    userContestQuiz: userContestQuizReducer,
    userContestCoding: userContestCodingReducer,
    newProgressTracking: newProgressTrackingReducer,
    userActivityLog: userActivityLogReducer,
    promoCode: promoCodeReducer,
    importContent: importContentReducer,
    frontendFaq: frontendFaqReducer,
    frontendStatistics: frontendStatisticsReducer,
    frontendFeatures: frontendFeaturesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }).concat(
      aiApi.middleware,
      userAuthApi.middleware,
      adminAuthApi.middleware,
      courseApi.middleware,
      moduleApi.middleware,
      topicApi.middleware,
      quizApi.middleware,
      quizQuestionApi.middleware,
      quizOptionApi.middleware,
      assignmentApi.middleware,
      preDefinedQuestionsApi.middleware,
      preDefinedOptionsApi.middleware,
      quizPreDefinedQuestionsApi.middleware,
      enrollApi.middleware,
      // progressTrackingApi.middleware,
      // quizCompletionApi.middleware,
      quizResponseApi.middleware,
      assignmentCompletionApi.middleware,
      assignmentResponseApi.middleware,
      textBasedQuizTextApi.middleware,
      reviewApi.middleware,
      wishlistApi.middleware,
      courseCategoryApi.middleware,
      mcqApi.middleware,
      trueFalseApi.middleware,
      fillBlankApi.middleware,
      profitsApi.middleware,
      courseFAQApi.middleware,
      courseFAQOptionApi.middleware,
      cheatSheetApi.middleware,
      mainSectionApi.middleware, // Add mainSectionApi middleware
      sectionApi.middleware, // Add sectionApi middleware
      dailyChallengeApi.middleware, // Add sectionApi middleware
      fillInTheBlanksApi.middleware, // Add sectionApi middleware
      mcqChallengeApi.middleware, // Add sectionApi middleware
      trueFalseChallengeApi.middleware, // Add sectionApi middleware
      userChallengeApi.middleware, // Add sectionApi middleware
      challengeCategoryApi.middleware, // Add sectionApi middleware
      supportApi.middleware,
      contactApi.middleware,
      aboutApi.middleware,
      partnerApi.middleware,
      partnerActiveApi.middleware,
      featureStatusApi.middleware,
      featureInterestApi.middleware,
      userChallengeQuestApi.middleware,
      userChallengePhaseApi.middleware,
      userChallengeTaskApi.middleware,
      challengeResponseApi.middleware,
      challengeQuestAPI.middleware,
      challengePhaseAPI.middleware, // Add sectionApi middleware
      challengeTaskAPI.middleware, // Add sectionApi middleware
      audioToScriptApi.middleware,
      audioToScriptResponseApi.middleware,
      realWordQuestionApi.middleware,
      completeTheSentenceApi.middleware,
      summarizePassageApi.middleware,
      summarizePassageResponseApi.middleware,
      sessionApi.middleware,
      dragDropQuestionApi.middleware,
      bestOptionResponseApi.middleware,
      bestOptionQuestionApi.middleware,
      courseTimeTrackingAPI.middleware,
      reduxLogger,
      paypalApi.middleware,
      razorpayApi.middleware,
      topicContentApi.middleware,
      roleApi.middleware,
      permissionApi.middleware,
      rolePermissionApi.middleware,
      countryApi.middleware,
      stateApi.middleware,
      cityApi.middleware,
      tierApi.middleware,
      difficultyLevelApi.middleware,
      seoMetaApi.middleware,
      blogApi.middleware,

      courseGenerationHistoryApi.middleware,
      challengeAnalyticsApi.middleware,
      coursePerformanceAnalyticsApi.middleware,
      leaderboardAnalyticsApi.middleware,
      revenueFinanceAnalyticsApi.middleware,
      timeBasedAnalyticsApi.middleware,
      userEngagementAnalyticsApi.middleware,
      studentFAQResponseApi.middleware,
      courseProgressRootApi.middleware,
      summarizeApi.middleware,
      summaryApi.middleware,
      bulletPointApi.middleware,
      flashCardApi.middleware,
      paragraphApi.middleware,
      interviewApi.middleware,
      performanceTrackingApi.middleware,
      performanceFeedbackApi.middleware,
      coursePerformanceTrackingApi.middleware,
      adminStudentPerformanceAnalyticsApi.middleware,
      aiInterviewAnalyticsApi.middleware,
      allCoursesAnalyticsApi.middleware,
      termsOfServiceApi.middleware,
      privacyPolicyApi.middleware,
      socialMediaApi.middleware,
      subscribeApi.middleware,
      footerSettingApi.middleware,
      assignmentExtensionRequestApi.middleware,
      contestAPI.middleware,
      contestTemplateAPI.middleware,
      contestActivityAPI.middleware,
      contestPrizeAPI.middleware,
      contestCodingAPI.middleware,
      contestCodingTestCaseAPI.middleware,
      contestQuizAPI.middleware,
      userContestAPI.middleware,
      userActivityAPI.middleware,
      userContestQuizAPI.middleware,
      userContestCodingAPI.middleware,
      newProgressTrackingApi.middleware,
      userActivityLogApi.middleware,
      promoCodeApi.middleware,
      importContentApi.middleware,
      testimonialApi.middleware,
      frontendFaqApi.middleware,
      frontendStatisticsApi.middleware,
      frontendFeaturesApi.middleware,
    ),
});

setupListeners(store.dispatch);
