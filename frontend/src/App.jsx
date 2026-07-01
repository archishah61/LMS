/* eslint-disable no-unused-vars */
import { createBrowserRouter, RouterProvider, redirect } from "react-router-dom";

import Home from "./pages/Home/Home";
import AdminLogin from "./components/auth/admin/Login";
import AdminLayout from "./components/Layout/admin/Layout";
import StudentLayout from "./components/Layout/student/Layout";
import Student from "./components/student/student";
import SignUp from "./components/auth/student/SignUp";
import Login from "./components/auth/student/Login";
import CourseDetails from './pages/course-details/CourseDetails';
import Courses from './components/admin/courses/Courses';
import CourseGenerator from './pages/course-details/customCourseGeneration.jsx';
import StudentDashboard from './pages/student-dashboard/StudentDashboard';
import CourseLearningPage from './pages/student-dashboard/CourseLearningPage';
import Module from './components/admin/courses/Module'
import Topics from './components/admin/courses/Topics';
import EditCourse from './components/admin/courses/EditCourse';
import QuizQuestions from './components/admin/Quizes/QuizQuestions';
import QuizOptions from './components/admin/Quizes/QuizOptions';
import EditModule from './components/admin/courses/EditModule';
import EditTopic from './components/admin/courses/EditTopic';
import MastersQuestion from './components/admin/mastersQuestions/masterQuestions';
import Wishlist from "./pages/course-details/wishlist"
import FilteredCourses from "./pages/course-details/FilteredCourses"
import AllCourses from './components/student/AllCourses';
import CatagoryMaster from './components/admin/masterCatagory/CatagoryMaster';
import StudentProfile from './components/student/StudentProfile'
import GenerateQuestion from './components/admin/Quizes/GenerateQuestion';
import OnboardingAnimation from './components/Layout/OnBoardAnimation';
import FAQResponsePage from './pages/Student/FAQResponsePage';
import AboutUs from './pages/Home/AboutUS/AboutUs'
import Tiers from './pages/admin/Tier/Tier'
import ContactUs from './pages/Home/ContactUs/ContactUs'
import CheatSheet from './components/admin/CheatSheet/CheatSheet';
import CheatSheetData from './components/admin/CheatSheet/CheatSheetData';
import StudentCheatSheet from './pages/cheat-sheet/StudentCheatSheet';
import StudentCheatSheetDisplay from './pages/cheat-sheet/StudentCheatSheetDisplay';
import BecomeAPartForm from './pages/partner/PartnerRegister';
import Challenges from './pages/admin/Challenges/Challenges';
import ChallengeQuestions from './pages/admin/Challenges/ChallengeQuestions';
import PartnerRegister from './pages/partner/PartnerRegister';
import Partner from './components/admin/Partners/Partner';
import PartnerDetails from './components/admin/Partners/PartnerDetails';
import DailyChallenge from './pages/user/DailyChallenge/DailyChallenge';
import DailyChallengeQuiz from './pages/user/DailyChallenge/DailyChallengeQuiz';
import ChallengeQuestUser from './pages/user/Challenges/ChallengeQuest';
import ChallengeCatagory from './components/admin/ChallengeCatMaster/ChallengeCatagory';
import ChallengeQuestStart from './pages/user/Challenges/ChallengeQuestStart';
import ChallengeQuest from './pages/admin/Challenges/ChallengeQuest';
import ChallengePhase from './pages/admin/Challenges/ChallengePhase';
import ChallengeTask from './pages/admin/Challenges/ChallengeTask';
import ChallengeQuestQuiz from './pages/user/Challenges/ChallengeQuestQuiz';
import MyChallenges from './pages/user/Challenges/MyChallenges';
import Session from './components/admin/courses/Session';
import EditSession from './components/admin/courses/EditSession';
import Support from './pages/admin/Support/Support';
import UserPurchase from './pages/course-details/UserPurchase';
import Role from './components/admin/RoleAndPermission/Role';
import Permission from './components/admin/RoleAndPermission/Permission';
import Country from './components/admin/LocationMaster/Country';
import State from './components/admin/LocationMaster/State';
import City from './components/admin/LocationMaster/City';
import AdminManagement from './components/admin/AdminUser';
import AnalyticsOverview from './pages/admin/analytics/AnalyticsOverview';
import ChallengeAnalytics from './pages/admin/analytics/ChallengeAnalytics';
import CoursePerformanceAnalytics from './pages/admin/analytics/CoursePerformanceAnalytics';
import LeaderboardAnalytics from './pages/admin/analytics/LeaderboardAnalytics';
import RevenueAnalytics from './pages/admin/analytics/RevenueAnalytics';
import TimeBasedAnalytics from './pages/admin/analytics/TimeBasedAnalytics';
import UserEngagementAnalytics from './pages/admin/analytics/UserEngagementAnalytics';
import StudentCoursePerformanceTracking from './pages/admin/analytics/studentCoursePerformanceTracking.jsx';
import FAQResponse from './pages/admin/FAQ-Response/FAQResponse';
import DocsLogin from './pages/docs/DocsLogin';
import DocsGuard from './pages/docs/DocsGuard';
import PartnerProfile from './components/admin/Partners/PartnerProfile';
import SupportTicketsPage from './pages/Student/SupportTicketsPage';
import RootLayout from './components/Layout/RootLayout';
import CrackAnInterview from './components/interview/CrackAnInterview';
import MathSolver from './components/Home/courses/MathSolver';
import LearningPathAgent from './components/Home/courses/LearningPathAgent';
import CoursePerformance from './components/coursePerformance/CoursePerformance';
import CourseGeneratorAdmin from "./pages/admin/CourseGenerator/CourseGeneratorAdmin";
import AIInterviewAnalytics from './pages/admin/analytics/AIInterviewAnalytics';
import { getAdminToken, getStudentToken } from "./services/CookieService.js";
import Reviews from "./pages/admin/Review/Reviews.jsx";
import Users from "./pages/admin/Users/Users.jsx";
import Payments from "./pages/admin/Payment/Payments.jsx";
import AssignmentQuestion from "./components/admin/Quizes/AssignmentQuestion.jsx";
import QuizQuestion from "./components/admin/Quizes/QuizQuestion";
import Contacts from "./pages/admin/Support/Contacts.jsx";
import TermsOfService from "./pages/legalPages/TermsOfService.jsx";
import PrivacyPolicy from "./pages/legalPages/PrivacyPolicy.jsx";
import SEOMeta from "./pages/legalPages/SEOMeta.jsx";
import SocialMedia from "./pages/legalPages/SocialMedia.jsx";
import Subscribe from "./pages/admin/Support/Subscribe.jsx";
import About from "./pages/admin/Support/About.jsx";
import ContestTemplatesPage from "./pages/admin/Contest/ContestTemplatesPage.jsx";
import ContestsPage from "./pages/admin/Contest/ContestPage.jsx";
import ContestActivitiesPage from "./pages/admin/Contest/ContestActivitiesPage.jsx";
import ContestCodingPage from "./pages/admin/Contest/ContestCodingPage.jsx";
import ContestQuizPage from "./pages/admin/Contest/ContestQuizPage.jsx";
import StudentCourseTracking from "./pages/admin/analytics/StudentCourseTracking.jsx";
import ExtensionRequest from "./components/admin/extensionRequest/extensionRequest.jsx";
import StudentContestsPage from "./pages/user/Contest/StudentContestsPage.jsx";
import ContestDetailsPage from "./pages/user/Contest/ContestDetailsPage.jsx";
import TemplateDetailsPage from "./pages/user/Contest/TemplateDetailsPage.jsx";
import ContestCodingQuiz from "./pages/user/Contest/ContestCodingQuiz.jsx";
import ContestActivityCoding from "./pages/user/Contest/ContestActivityCoding.jsx";
import ContestQuiz from "./pages/user/Contest/ContestQuiz.jsx";
import ContestActivityQuiz from "./pages/user/Contest/ContestActivityQuiz.jsx";
import ContestLeaderboardPage from "./pages/user/Contest/ContestLeaderboardPage.jsx";
import CourseContentDup from "./pages/course-details/CourseContentDup.jsx";
import UserActivityLog from "./pages/admin/Activity/UserActivityLog.jsx";
import TransactionsPage from "./pages/Student/TransactionsPage.jsx";
import StudentProfileLayout from "./components/student/StudentProfileLayout.jsx";
import SwaggerDocs from "./SwaggerDocs.jsx";
import Features from "./pages/admin/Features/Feature.jsx";
import FeatureInterested from "./pages/admin/Features/FeatureInterested.jsx";
import Batches from "./pages/admin/Users/Batches.jsx";
import BatchUsers from "./pages/admin/Users/BatchUsers.jsx";
import CodeEditor from './components/CodeEditor.jsx';
import PublicTermsOfService from "./pages/legalPages/PublicTermsOfService.jsx";
import PublicPrivacyPolicy from "./pages/legalPages/PublicPrivacyPolicy.jsx";
import TestimonialMaster from "./pages/admin/Testimonials/TestimonialMaster";
import TestimonialList from "./pages/admin/Testimonials/TestimonialList";
import FrontendFaq from "./components/admin/LandingpageManagement/FrontendFaq";
import FrontendStatistics from "./components/admin/LandingpageManagement/FrontendStatistics";
import ContestCodingsPage from "./pages/admin/Contest/ContestCodingsPage.jsx";
import FrontendFeatures from "./components/admin/LandingpageManagement/FrontendFeatures";
import AIFeatureSettings from "./components/admin/AIManagement/AIFeatureSettings.jsx";
import ChallengeQuestLeaderboard from "./pages/user/Challenges/ChallengeQuestLeaderboard.jsx";
import ParagraphWritingTool from "./components/ParagraphWriting/ParagraphWritingTool.jsx";
import NewCourseGenerator from "./pages/admin/newCourseGenerator/newCourseGenerator.jsx";
import TopicDetailPage from "./pages/admin/newCourseGenerator/TopicDetailPage.jsx";
import QuizDetailPage from "./pages/admin/newCourseGenerator/QuizDetailPage.jsx";
import AssignmentDetailPage from "./pages/admin/newCourseGenerator/AssignmentDetailPage";
import BlogList from "./pages/Home/Blog/BlogList.jsx";
import BlogDetail from "./pages/Home/Blog/BlogDetail.jsx";
import Blogs from "./pages/admin/Blog/Blogs.jsx";
import BlogCategoryMaster from "./pages/admin/Blog/BlogCategoryMaster.jsx";



function studentAuthLoader() {
  const { access_token } = getStudentToken();
  if (!access_token) {
    throw redirect("/?login=true"); // stops rendering completely
  }
  return null;
}

function adminAuthLoader() {
  const { access_token } = getAdminToken();
  if (!access_token) {
    throw redirect("/admin/login"); // stops rendering completely
  }
  return null;
}

// To protect this route and ensure only logged-in students can access it,
// add the `studentAuthLoader` as shown in the example below:
//
// {
//   path: "/user-profile",
//   element: <StudentProfile />,
//   loader: studentAuthLoader,
// }

// Similerly For Admin.

const router = createBrowserRouter([
  {
    path: "",
    element: <RootLayout />, // <- This wraps everything
    children: [
      {
        path: "/animation-greetings",
        element: <OnboardingAnimation />,
      },
      {
        path: "/ai/crack-an-interview",
        element: <CrackAnInterview />,
      },
      {
        path: "/ai/maths-solver",
        element: <MathSolver />,
      },
      {
        path: "/ai/learning-path",
        element: <LearningPathAgent />,
      },
      {
        path: "/ai/do-your-own-course",
        element: <CourseGenerator />,
      },
      {
        path: "/ai/paragraph-typing",
        element: <ParagraphWritingTool />,
      },
      {
        path: "",
        element: <StudentLayout />,
        children: [
          {
            path: "/",
            element: <Home />,
          },
          {
            path: "/about-us",
            element: <AboutUs />,
          },
          {
            path: "/contact-us",
            element: <ContactUs />,
          },
          {
            path: "/course/:courseSlug",
            element: <CourseDetails />,
          },
          {
            path: "/course/:courseSlug/faq-response",
            element: <FAQResponsePage />,
          },
          {
            path: "/student-dashboard",
            element: <StudentDashboard />,
          },
          {
            path: "/course/:courseSlug/learning",
            element: <CourseLearningPage />,
          },
          {
            path: "/user-wishlist",
            element: <Wishlist />,
            loader: studentAuthLoader,
          },
          {
            path: "/user-enrolled-courses",
            element: <FilteredCourses />,
            loader: studentAuthLoader,
          },
          {
            path: "/user-purchases",
            element: <UserPurchase />,
            loader: studentAuthLoader,
          },
          {
            path: "/user-support-tickets",
            element: <SupportTicketsPage />,
            loader: studentAuthLoader,
          },
          {
            path: "/courses",
            element: <AllCourses />,
          },
          {
            path: "/user-profile",
            element: <StudentProfile />,
            loader: studentAuthLoader,
          },
          {
            path: "/transactions",
            element: <TransactionsPage />,
            loader: studentAuthLoader,
          },
          {
            path: "/cheat-sheets",
            element: <StudentCheatSheet />,
            // loader: studentAuthLoader,
          },
          {
            path: "/cheat-sheets/:sheetSlug",
            element: <StudentCheatSheetDisplay />,
            loader: studentAuthLoader,
          },
          {
            path: "/become-partner/register",
            element: <PartnerRegister />,
          },
          {
            path: "/template/:templateSlug/contests",
            element: <TemplateDetailsPage />,
          },
          {
            path: "/contests",
            element: <StudentContestsPage />,
          },
          {
            path: "/contests/:contestSlug",
            element: <ContestDetailsPage />,
          },
          {
            path: "/contests/:contestSlug/leaderboard",
            element: <ContestLeaderboardPage />,
          },
          {
            path: "/contests/:contestSlug/quiz/:activitySlug/start",
            element: <ContestQuiz />,
          },
          {
            path: "/contests/:contestSlug/quiz/:activitySlug",
            element: <ContestActivityQuiz />,
          },
          {
            path: "/contests/:contestSlug/coding/:activitySlug",
            element: <ContestActivityCoding />,
          },
          {
            path: "/contests/:contestSlug/coding/:activitySlug/solve",
            element: <ContestCodingQuiz />,
          },
          {
            path: "/daily-challenge",
            element: <DailyChallenge />,
            loader: studentAuthLoader,
          },
          {
            path: "/daily-challenge/:challengeSlug",
            element: <DailyChallengeQuiz />,
            loader: studentAuthLoader,
          },
          {
            path: "/my-challenges",
            element: <MyChallenges />,
            loader: studentAuthLoader,
          },
          {
            path: "/challenges",
            element: <ChallengeQuestUser />,
          },
          {
            path: "/challenges/leaderboard",
            element: <ChallengeQuestLeaderboard />,
          },
          {
            path: "/challenges/:userChallengeSlug",
            element: <ChallengeQuestStart />,
            loader: studentAuthLoader,
          },
          {
            path: "/challenges/task/:userChallengeTaskSlug",
            element: <ChallengeQuestQuiz />,
            loader: studentAuthLoader,
          },
          {
            path: "/course/:courseSlug/performance",
            element: <CoursePerformance />,
          },
          {
            path: "/user-profile-layout",
            element: <StudentProfileLayout />,
            children: [
              {
                index: true,
                element: <StudentProfile />,
              },
              {
                path: "enrolled-courses",
                element: <FilteredCourses />,
                loader: studentAuthLoader,
              },
              {
                path: "purchases",
                element: <UserPurchase />,
                loader: studentAuthLoader,
              },
              {
                path: "wishlist",
                element: <Wishlist />,
                loader: studentAuthLoader,
              },
              {
                path: "challenges",
                element: <MyChallenges />,
                loader: studentAuthLoader,
              },
              {
                path: "support",
                element: <SupportTicketsPage />,
                loader: studentAuthLoader,
              },
              {
                path: "transactions",
                element: <TransactionsPage />,
                loader: studentAuthLoader,
              }
            ],
          },
          {
            path: "/terms-of-service",
            element: <PublicTermsOfService />,
          },
          {
            path: "/privacy-policy",
            element: <PublicPrivacyPolicy />,
          },
          {
            path: "/blogs",
            element: <BlogList />,
          },
          {
            path: "/blogs/:slug",
            element: <BlogDetail />,
          },
        ],
      },
      {
        path: "/course-content/:courseSlug",
        element: <CourseContentDup />,
      },
      {
        path: "/virtual-lab",
        element: <CodeEditor />,
      },
      {
        path: "/admin",
        element: <AdminLayout />,
        loader: adminAuthLoader,
        children: [
          {
            index: true,
            loader: () => redirect("/admin/dashboard"),
          },
          {
            path: "dashboard",
            element: <AnalyticsOverview />,
          },
          {
            path: "dashboard/course",
            element: <Courses />,
          },
          {
            path: "dashboard/profile",
            element: <PartnerProfile />,
          },
          {
            path: "dashboard/analytics/challenges",
            element: <ChallengeAnalytics />,
          },
          {
            path: "dashboard/analytics/time-based",
            element: <TimeBasedAnalytics />,
          },
          {
            path: "dashboard/analytics/course-performance",
            element: <CoursePerformanceAnalytics />,
          },
          {
            path: "dashboard/analytics/leaderboard",
            element: <LeaderboardAnalytics />,
          },
          {
            path: "dashboard/analytics/ai-interview",
            element: <AIInterviewAnalytics />,
          },
          {
            path: "dashboard/analytics/revenue",
            element: <RevenueAnalytics />,
          },
          {
            path: "dashboard/analytics/user-engagement",
            element: <UserEngagementAnalytics />,
          },
          {
            path: "dashboard/analytics/student-course-performance",
            element: <StudentCoursePerformanceTracking />,
          },
          {
            path: "dashboard/users",
            element: <Users />,
          },
          {
            path: "dashboard/activity/logs",
            element: <UserActivityLog />,
          },
          {
            path: "dashboard/payments",
            element: <Payments />,
          },
          {
            path: "dashboard/students",
            element: <Student />,
          },
          {
            path: "dashboard/students/courseProgress/:courseSlug",
            element: <StudentCourseTracking />,
          },
          {
            path: "dashboard/partners",
            element: <Partner />,
          },
          {
            path: "dashboard/partners/:partnerSlug",
            element: <PartnerDetails />,
          },
          {
            path: "dashboard/faq-response",
            element: <FAQResponse />,
          },
          {
            path: "dashboard/reviews",
            element: <Reviews />,
          },
          {
            path: "dashboard/predefined-questions",
            element: <MastersQuestion />,
          },
          {
            path: "dashboard/course-category-master",
            element: <CatagoryMaster />,
          },
          {
            path: "dashboard/text-based-quiz/quiz-question/:quizSlug",
            element: <QuizQuestion />,
          },
          {
            path: "dashboard/quiz/quiz-question/:quizSlug",
            element: <QuizQuestions />,
          },
          {
            path: "dashboard/quiz/quiz-option/:questionSlug",
            element: <QuizOptions />,
          },
          {
            path: "dashboard/quiz/generate-question",
            element: <GenerateQuestion />,
          },
          {
            path: "dashboard/assignment/questions/:assignmentSlug",
            element: <AssignmentQuestion />,
          },
          {
            path: "dashboard/course/:courseIdSlug",
            element: <EditCourse />,
          },
          {
            path: "dashboard/course/:courseIdSlug/sessions",
            element: <Session />,
          },
          {
            path: "dashboard/course/:courseIdSlug/session/update/:sessionIdSlug",
            element: <EditSession />,
          },
          {
            path: "dashboard/course/:courseIdSlug/session/:sessionIdSlug/modules",
            element: <Module />,
          },
          {
            path: "dashboard/course/:courseIdSlug/session/:sessionIdSlug/module/update/:moduleIdSlug",
            element: <EditModule />,
          },
          {
            path: "dashboard/course/:courseIdSlug/session/:sessionIdSlug/module/:moduleIdSlug/topics",
            element: <Topics />,
          },
          {
            path: "dashboard/course/topic/topics/:topicIdSlug",
            element: <EditTopic />,
          },
          {
            path: "dashboard/cheat-sheets",
            element: <CheatSheet />,
          },
          {
            path: "dashboard/cheat-sheets/:cheatsheetSlug/data",
            element: <CheatSheetData />,
          },
          {
            path: "dashboard/contests/templates",
            element: <ContestTemplatesPage />,
          },
          {
            path: "dashboard/contests/templates/:template_name",
            element: <ContestsPage />, // contests for a template
          },
          {
            path: "dashboard/contests",
            element: <ContestsPage />,
          },
          {
            path: "dashboard/contests/:contest_name/activities",
            element: <ContestActivitiesPage />,
          },
          {
            path: "dashboard/contests/activity/:activity_title/coding",
            element: <ContestCodingsPage />,
          },
          {
            path: "dashboard/contests/activity/:activity_title/coding/:action_type",
            element: <ContestCodingPage />,
          },
          {
            path: "dashboard/contests/activity/:activity_title/quiz",
            element: <ContestQuizPage />,
          },
          {
            path: "dashboard/challenges",
            element: <Challenges />,
          },
          {
            path: "dashboard/challenges/:challenge_type/questions",
            element: <ChallengeQuestions />,
          },
          {
            path: "dashboard/challenges/quest",
            element: <ChallengeQuest />,
          },
          {
            path: "dashboard/challenges/:challengePhaseSlug/phase",
            element: <ChallengePhase />,
          },
          {
            path: "dashboard/challenges/:challengePhaseSlug/task",
            element: <ChallengeTask />,
          },
          {
            path: "dashboard/challenge-category-master",
            element: <ChallengeCatagory />,
          },
          {
            path: "dashboard/support",
            element: <Support />,
          },
          {
            path: "dashboard/contacts",
            element: <Contacts />,
          },
          {
            path: "dashboard/about",
            element: <About />,
          },
          {
            path: "dashboard/blogs",
            element: <Blogs />,
          },
          {
            path: "dashboard/blogs/categories",
            element: <BlogCategoryMaster />,
          },
          {
            path: "dashboard/tiers",
            element: <Tiers />,
          },
          {
            path: "dashboard/features",
            element: <Features />,
          },
          {
            path: "dashboard/features/interested",
            element: <FeatureInterested />,
          },
          {
            path: "dashboard/roles",
            element: <Role />,
          },
          {
            path: "dashboard/admin-user",
            element: <AdminManagement />,
          },
          {
            path: "dashboard/role-permissions/:roleSlug",
            element: <Permission />,
          },
          {
            path: "dashboard/locations/countries",
            element: <Country />,
          },
          {
            path: "dashboard/locations/states",
            element: <State />,
          },
          {
            path: "dashboard/locations/cities",
            element: <City />,
          },
          {
            path: "dashboard/terms-of-service",
            element: <TermsOfService />,
          },
          {
            path: "dashboard/privacy-policy",
            element: <PrivacyPolicy />,
          },
          {
            path: "dashboard/social-media",
            element: <SocialMedia />,
          },
          {
            path: "dashboard/subscribe",
            element: <Subscribe />,
          },
          {
            path: "dashboard/extension-requests",
            element: <ExtensionRequest />,
          },
          {
            path: "dashboard/batch/list",
            element: <Batches />,
          },
          {
            path: "dashboard/batches/users/list/:batchId",
            element: <BatchUsers />,
          },
          {
            path: "dashboard/seo-meta",
            element: <SEOMeta />,
          },
          {
            path: "dashboard/testimonials/master",
            element: <TestimonialMaster />,
          },
          {
            path: "dashboard/testimonials/list",
            element: <TestimonialList />,
          },
          {
            path: "dashboard/landing-management/faqs",
            element: <FrontendFaq />,
          },
          {
            path: "dashboard/landing-management/statistics",
            element: <FrontendStatistics />,
          },
          {
            path: "dashboard/landing-management/features",
            element: <FrontendFeatures />,
          },
          {
            path: "dashboard/ai-management/feature-settings",
            element: <AIFeatureSettings />,
          },
        ],
      },
      {
        path: "/admin/login",
        element: <AdminLogin userType="admin" />,
      },
      /* Removed login/signup routes */
      {
        path: "/docs",
        element: <DocsGuard />,
      },
      {
        path: "api-docs",
        element: <SwaggerDocs />,
      },
      {
        path: "/docs/login",
        element: <DocsLogin />,
      },
      {
        path: "/generate-course",
        element: <NewCourseGenerator />,
      },
      {
        path: "/generate-course/topic",
        element: <TopicDetailPage />,
      },
      {
        path: "/generate-course/quiz",
        element: <QuizDetailPage />,
      },
      {
        path: "/generate-course/assignment",
        element: <AssignmentDetailPage />,
      },
      {
        path: "/course-generate",
        element: <CourseGeneratorAdmin />,
      },
      // {
      //   path: "/course-generate",
      //   element: <CourseGeneratorAdmin />,
      // },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
