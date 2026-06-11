// routes/index.js
const express = require('express');
const router = express.Router();
const fs = require('fs-extra');

const path = require('path');
const codeDir = path.join(__dirname, '/../virtual_lab/code');

// Certificate Management
const certificateManagementRoutes = require('./certificateManagement/certificateManagementRoutes');

// Enrollment Management
const enrollmentManagementRoutes = require('./enrollmentManagement/enrollmentManagementRoutes');

// tier
const tierRoutes = require('./tier/tierRoutes');

// difficulty level
const difficultyLevelRoutes = require('./tier/difficultyLevelRoutes');

// course generation history
const courseGenerationHistoryRoutes = require('./tier/courseGenerationHistoryRoutes');

// Content Management
const assignmentRoute = require('./content_management/assignmentRoute');
const quizzesRoute = require('./content_management/quizzesRoute');
const quizQuestionsRoute = require('./content_management/quizQuestionsRoute');
const quizQuestionRoute = require('./content_management/quizQuestionRoute');
const quizOptionsRoute = require('./content_management/quizOptionsRoute');
const textBasedQuizTextRoute = require('./content_management/textBasedQuizTextRoute');
const dragdropQuestionRoutes = require('./content_management/dragDropQuestionRoutes');
const audioToScriptQuestionRoutes = require('./content_management/audioToScriptQuestionRoutes');
const realWordQuestionRoutes = require('./content_management/realWordQuestionRoutes');
const summaryPassageRoutes = require('./content_management/summaryPassageRoutes');
const bestOptionQuestionRoutes = require('./content_management/bestOptionQuestionRoute');
const bestOptionResponseRoutes = require('./content_management/bestOptionResponseRoute');
const completeTheSentenceRoutes = require('./content_management/completeTheSentencesRoutes')
const arrangeOrderQuestionRoutes = require('./content_management/arrangeOrderQuestionRoutes')
// Generated Quiz Routes
const multipleChoiceQuestionRoutes = require('./content_management/generated_quiz/multipleChoiceQuestionRoutes');
const trueFalseQuestionRoutes = require('./content_management/generated_quiz/trueFalseQuestionRoutes');
const fillInBlankQuestionRoutes = require('./content_management/generated_quiz/fillInBlankQuestionRoutes');

// Course Management
const courseRoutes = require('./course_management_routes/courseRoutes');
const moduleRoutes = require('./course_management_routes/moduleRoutes');
const topicRoutes = require('./course_management_routes/topicRoutes');
const wishlistRoutes = require('./course_management_routes/wishlistRoutes');
const courseCatagoryRoutes = require('./course_management_routes/courseCatagoryRoutes');
const courseFAQRoute = require('./course_management_routes/courseFAQRoutes');
const courseFAQOptionRoute = require('./course_management_routes/courseFAQOptionRoutes');
const sessionRoutes = require('./course_management_routes/sessionRoutes');
const topicContentRoutes = require('./course_management_routes/topicContentRoutes');

// Student Management
const studentStatusHistoryRoute = require('./student_management/studentStatusHistoryRoutes');
const violationsRoute = require('./student_management/violationsRoutes');
const studentFAQResponseRoutes = require('./student_management/studentFAQResponseRoutes');

// Learning Progress
const progressTrackingRoute = require('./learning_progress/progressTrackingRoute');
const quizCompletionRoutes = require('./learning_progress/quizCompletionRoute');
const quizResponseRoutes = require('./learning_progress/quizResponseRoute');
const assignmentCompletionRoutes = require('./learning_progress/assignmentCompletionRoute');
const assignmentResponseRoutes = require('./learning_progress/assignmentResponseRoute');
const audioToScriptResponseRoutes = require('./learning_progress/audioToScriptResponseRoutes');
const realWordResponseRoutes = require('./learning_progress/realWordResponseRoutes');
const summaryPassageResponse = require('./learning_progress/summaryPassageResponse');
const courseTimeTrackingRoutes = require('./learning_progress/courseTimeTrackingRoutes');
// Predefined Questions
const predefinedQuestionsRoute = require('./predefinedQuestions/predefinedQuestion');
const predefinedOptionsRoute = require('./predefinedQuestions/predefinedOption');
const quizPreDefinedRoutes = require('./predefinedQuestions/quizPreDefinedRoutes');

// Authentication
const authRoutesUser = require('./auth/authRoutesUser');
const authRoutesAdmin = require('./auth/authRoutesAdmin');

// Reviews
const reviewsRoutes = require('./reviews/reviewsRoutes');

// Testimonials
const testimonialRoutes = require('./testimonialRoutes');

// Profit
const profitRoute = require('./profits/profitRoute');

// Cheatsheet
const cheatSheetRoutes = require('./cheatsheet/cheatsheetRouter');
const mainSectionRouter = require('./cheatsheet/cheatSheetContent/mainSectionRouter');
const sectionRouter = require('./cheatsheet/cheatSheetContent/sectionRouter');

// Partner
const partnerRoutes = require('./partner/partnerRouters');
const isPartnerActiveRoutes = require('./partner/isPartnerActiveRoutes');

// Challenge Routes
const dailyChallengeRoutes = require('./challenge/dailyChallengeRoutes');
const userChallengeRoutes = require('./challenge/userChallengeRoutes');
const mcqChallengeRoutes = require('./challenge/mcqChallengeRoutes');
const trueFalseChallengeRoutes = require('./challenge/challenge_quest/trueFalseChallengeRoutes');
const challengeCategoryRoutes = require('./challenge/challengeCategoryRoutes');
const challengeRoutes = require('./challenge/challenge_quest/challengeRoutes');
const challengePhaseRoutes = require('./challenge/challenge_quest/challengePhaseRoutes');
const challengeTaskRoutes = require('./challenge/challenge_quest/challengeTaskRoutes');
const userChallengeRoute = require('./challenge/challenge_progress/userChallengeRoutes');
const userChallengePhaseRoutes = require('./challenge/challenge_progress/userChallengePhaseRoutes');
const userChallengeTaskRoutes = require('./challenge/challenge_progress/userChallengeTaskRoutes');
const challengeAttemptResponseRoutes = require('./challenge/challenge_progress/challengeAttemptResponseRoutes');

// Contest
const contestTemplateRoutes = require('./contest/contest_content/contestTemplateRoutes');
const contestRoutes = require('./contest/contest_content/contestRoutes');
const contestActivityRoutes = require('./contest/contest_content/contestActivityRoutes');
const contestPrizeRoutes = require('./contest/contest_content/contestPrizeRoutes');
const contestCodingRoutes = require('./contest/contest_type/contestCodingRoutes');
const contestQuizRoutes = require('./contest/contest_type/contestQuizRoutes');
const contestCodingTestCaseRoutes = require('./contest/contest_type/contestCodingTestCaseRoutes');
const userContestRoutes = require('./contest/user_contest/userContestRoutes');
const userActivityRoutes = require('./contest/user_contest/userActivityRoutes');
const userContestQuizRoutes = require('./contest/user_contest/userContestQuizRoutes');
const userContestCodingRoutes = require('./contest/user_contest/userContestCodingRoutes');
// Support
const supportRoutes = require('./support/supportRoutes');
const blogRoutes = require('./blogs/blogRoutes');

const contactRoutes = require('./support/contactRoutes');
const aboutRoute = require('./support/aboutRoute');
const userActivityLogRouter = require('./activity/userActivityLogRoutes');

const paypalRoutes = require('./paypal/paypalRoutes');
const razorpayRoutes = require('./razorpay/razorpayRoutes');

// Country 

const countryRoutes = require('./masters/countryRoutes');
const stateRoutes = require('./masters/stateRoutes');
const cityRoutes = require('./masters/cityRoutes');

// Feature
const featureStatusRoutes = require('./masters/featureStatusRoutes');
const featureInterestRoutes = require('./support/featureInterestRoutes');

// Roles And Permission

const roleRoutes = require('./auth/RoleAndPermission/roleRoutes');
const permissionRoutes = require('./auth/RoleAndPermission/permissionRoutes');
const rolePermissionRoutes = require('./auth/RoleAndPermission/rolePermissionRoutes');

// reporting
const UserEngagementAnalyticsRoutes = require('./reporting/UserEngagementAnalyticsRoute')
const CoursePerformanceAnalyticsRoutes = require('./reporting/CoursePerformanceAnalyticsRoute')
const RevenueAndFinancialAnalyticsRoute = require('./reporting/RevenueAndFinancialAnalyticsRoute')
const ChallengeAnalyticsRoutes = require('./reporting/ChallengeAnalyticsRoutes')
const TimeBasedAnalyticsRoutes = require('./reporting/TimeBasedAnalyticsRoutes')
const LeaderboardAndGamificationAnalyticsRoutes = require('./reporting/LeaderboardAndGamificationAnalyticsRoutes')
const AIRoutes = require("./AI/AIRoutes");
const AIInterviewAnalyticsRoutes = require('./reporting/AIInterviewAnalyticsRoutes');


// ai 
const aiRoute = require('./aiSummary/ai.route')
const summaryRoutes = require('./aiSummary/summaryRoutes')
const bulletPointRoutes = require('./aiSummary/bulletPointRoutes')
const flashCardRoutes = require('./aiSummary/flashCardRoutes')

// Paragraph Route
const paragraphRoutes = require('./AI/paragraphRoutes')

// interview
const aiInterviewRoutes = require('./AI_Interview/interviewRoutes')
const interviewSettingsRoutes = require('./AI_Interview/interviewSettingsRoutes')

const analyticsRoutes = require('./AIStudentPerformanceTracking/analyticsRoutes');
const coursePerformanceRoutes = require('./AIStudentPerformanceTracking/coursePerformanceRoutes');
const performanceFeedbackRoutes = require('./AIStudentPerformanceTracking/performanceFeedbackRoutes');
const adminStudentPerformanceAnalyticsRoutes = require('./AIStudentPerformanceTracking/adminStudentPerformanceAnalyticsRoutes');
const enrolledStudentsRoutes = require('./AIStudentPerformanceTracking/enrolledStudentsRoutes');

const studentCoursePerformanceAnalyticsRoutes = require('./AIStudentPerformanceTracking/analytics/studentCoursePerformanceAnalyticsRoute')

// LegalPages 
const termsOfServicesRoutes = require('./legalPages/termsOfServiceRoute')
const privacyPolicyRoutes = require('./legalPages/privacyPolicyRoute')

const socialMediaRoutes = require('./legalPages/socialMediaRoutes')
const subscribeRoutes = require('./support/subscribeRoutes');
const footerSettingRoutes = require('./legalPages/footerSettingRoute');
const assignmentExtensionRequestRoutes = require('./learning_progress/assignmentExtensionRequestRoute');
const newProgressTrackingRoutes = require('./progressTracking/newProgressTrackingRoute')
const promocodeRoutes = require('./promocode/promocodeRoute')

// SEO Meta
const seoMetaRoutes = require('./legalPages/seoMetaRoutes');
const importContentRoutes = require('./importContent/importContentRoutes')

// Landing Page Management
const frontendFaqRoutes = require('./landingpage_management/frontendFaqRoutes');
const frontendStatiscticsRoutes = require('./landingpage_management/frontendStatiscticsRoutes');
const frontendFeaturesRoutes = require('./landingpage_management/frontendFeaturesRoutes');


// Register API routes
router.use("/", AIRoutes);
router.use("/", certificateManagementRoutes);
router.use("/", studentStatusHistoryRoute);
router.use("/", violationsRoute);
//router.use("/", progressTrackingRoute); // Removed to avoid duplicate routes

router.use("/user/auth", authRoutesUser);
router.use("/admin/auth", authRoutesAdmin);
router.use("/courses", courseRoutes);
router.use("/course-generate-history", courseGenerationHistoryRoutes);
router.use("/tiers", tierRoutes);
router.use("/difficulty-levels", difficultyLevelRoutes);
router.use("/modules", moduleRoutes);
router.use("/topics", topicRoutes);
router.use("/assignments", assignmentRoute);
router.use("/quizzes", quizzesRoute);
// router.use("/quiz-questions", quizQuestionsRoute);
router.use("/quiz-question", quizQuestionRoute);
router.use("/quiz-options", quizOptionsRoute);
router.use("/pre-defined-questions", predefinedQuestionsRoute);
router.use("/pre-defined-options", predefinedOptionsRoute);
router.use("/quiz-predefined-questions", quizPreDefinedRoutes);
router.use("/enroll", enrollmentManagementRoutes);
router.use("/quiz-completions", quizCompletionRoutes);
router.use("/quiz-responses", quizResponseRoutes);
router.use("/assignment-completions", assignmentCompletionRoutes);
router.use("/assignment-responses", assignmentResponseRoutes);
router.use("/review", reviewsRoutes);
router.use("/testimonials", testimonialRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/course-catagory", courseCatagoryRoutes);
router.use("/text-based-quiz-text", textBasedQuizTextRoute);
router.use("/progress", progressTrackingRoute);
router.use("/generated-quiz/mcq", multipleChoiceQuestionRoutes);
router.use("/generated-quiz/true-false", trueFalseQuestionRoutes);
router.use("/generated-quiz/fill-in-the-blanks", fillInBlankQuestionRoutes);
router.use("/profits", profitRoute);
router.use("/course-faqs", courseFAQRoute);
router.use("/course-faq-options", courseFAQOptionRoute);
router.use("/student-faq-response", studentFAQResponseRoutes);
router.use("/cheat-sheets/main-section/section", sectionRouter);
router.use("/cheat-sheets/main-section", mainSectionRouter);
router.use("/cheat-sheets", cheatSheetRoutes);
router.use("/audio-to-script", audioToScriptQuestionRoutes);
router.use("/audio-to-script-response", audioToScriptResponseRoutes);
router.use("/real-word", realWordQuestionRoutes);
router.use("/real-word-response", realWordResponseRoutes);
router.use("/summary", summaryPassageRoutes);
router.use("/best-option-questions", bestOptionQuestionRoutes);
router.use("/best-option-response", bestOptionResponseRoutes);
router.use("/summary-passage-response", summaryPassageResponse);
router.use("/sessions", sessionRoutes);
router.use("/topic-content", topicContentRoutes);
router.use("/track-course", courseTimeTrackingRoutes);
router.use("/dragdrop-questions", dragdropQuestionRoutes);
router.use("/complete-sentence", completeTheSentenceRoutes);
router.use("/arrange-order", arrangeOrderQuestionRoutes);

// Partner routes
router.use("/partners", partnerRoutes);
router.use("/partner-active", isPartnerActiveRoutes);

// Challenge routes
router.use("/challenge-response", challengeAttemptResponseRoutes);
router.use("/challenge/category", challengeCategoryRoutes);
router.use("/challenge/mcq", mcqChallengeRoutes);
router.use("/challenge/true-false", trueFalseChallengeRoutes);
router.use("/challenge/quest/user", userChallengeRoute);
router.use("/challenge/phase/user", userChallengePhaseRoutes);
router.use("/challenge/task/user", userChallengeTaskRoutes);
router.use("/challenge/quest", challengeRoutes);
router.use("/challenge/phase", challengePhaseRoutes);
router.use("/challenge/task", challengeTaskRoutes);
router.use("/challenge", dailyChallengeRoutes);
router.use("/user/challenge", userChallengeRoutes);
router.use('/activity/logs', userActivityLogRouter);

// Contest Routes
router.use("/contest/user", userContestRoutes);
router.use("/contest/user/activity", userActivityRoutes);
router.use("/contest/user/activity/quiz", userContestQuizRoutes);
router.use("/contest/user/activity/coding", userContestCodingRoutes);
router.use("/contest/template", contestTemplateRoutes);
router.use("/contest/activity/coding/test-case", contestCodingTestCaseRoutes)
router.use("/contest/activity/coding", contestCodingRoutes);
router.use("/contest/activity/quiz", contestQuizRoutes);
router.use("/contest/activity", contestActivityRoutes);
router.use("/contest/prize", contestPrizeRoutes);
router.use("/contest", contestRoutes);

// Support Routes
router.use("/support", supportRoutes);
router.use("/blogs", blogRoutes);
router.use("/contacts", contactRoutes);
router.use("/about", aboutRoute);

// Featuer Status
router.use("/feature", featureStatusRoutes);
router.use("/feature-interest", featureInterestRoutes);

// PayPal Routes

router.use("/paypal", paypalRoutes);

// Razorpay Routes

router.use("/razorpay", razorpayRoutes);

// country Routes

router.use("/countries", countryRoutes);
router.use("/states", stateRoutes);
router.use("/cities", cityRoutes);

// Role And Permissions

router.use("/roles", roleRoutes);
router.use("/permissions", permissionRoutes);
router.use("/role-permissions", rolePermissionRoutes)
// reporting
router.use("/user-engagement", UserEngagementAnalyticsRoutes);
router.use("/course-performance", CoursePerformanceAnalyticsRoutes);
router.use("/revenue-and-financial", RevenueAndFinancialAnalyticsRoute);
router.use("/challenge-analytics", ChallengeAnalyticsRoutes);
router.use("/time-based-analytics", TimeBasedAnalyticsRoutes);
router.use("/leaderboard-gamification", LeaderboardAndGamificationAnalyticsRoutes);
router.use('/ai-interview-analytics', AIInterviewAnalyticsRoutes);


// ai
router.use("/ai", aiRoute);
router.use("/ai-summary", summaryRoutes);
router.use("/ai-bullet-point", bulletPointRoutes);
router.use("/ai-flash-card", flashCardRoutes);
router.use("/ai-paragraph", paragraphRoutes);

// Interview
router.use("/interview", aiInterviewRoutes);
router.use("/feature-settings", interviewSettingsRoutes);

//student performance tracking
router.use("/student-performance-tracking", analyticsRoutes);
router.use("/student-course-performance-tracking", coursePerformanceRoutes);

// Performance feedback storage and retrieval
router.use("/performance-feedback", performanceFeedbackRoutes);

// Admin student performance analytics
router.use("/admin-student-performance-analytics", adminStudentPerformanceAnalyticsRoutes);

// Enrolled students for analytics
router.use("/enrolled-students", enrolledStudentsRoutes);

router.use("/course-analytics", studentCoursePerformanceAnalyticsRoutes)

// LegalPages
router.use("/terms", termsOfServicesRoutes)
router.use("/privacy", privacyPolicyRoutes)

router.use("/social-media", socialMediaRoutes);

router.use("/subscribe", subscribeRoutes)
router.use("/footer-settings", footerSettingRoutes);

router.use("/seo-meta", seoMetaRoutes);
router.use("/extension", assignmentExtensionRequestRoutes);

router.use("/newProgress", newProgressTrackingRoutes);
router.use("/promo-codes", promocodeRoutes)

router.use("/import-content", importContentRoutes)

// Landing Page Faqs
router.use("/frontend-faqs", frontendFaqRoutes)
router.use("/frontend-statistics", frontendStatiscticsRoutes)
router.use("/frontend-features", frontendFeaturesRoutes)

router.get('/', (req, res) => {
    res.send('Virtual Web Lab Backend API');
});

// File operations API
router.post('/files/save', async (req, res) => {
    try {
        const { filename, content, language } = req.body;
        const filePath = path.join(codeDir, filename);

        await fs.writeFile(filePath, content);
        res.json({ success: true, message: 'File saved successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/files/list', async (req, res) => {
    try {
        const files = await fs.readdir(codeDir);
        res.json({ success: true, files });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/files/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(codeDir, filename);
        const content = await fs.readFile(filePath, 'utf8');
        res.json({ success: true, content });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete file endpoint
router.delete('/files/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(codeDir, filename);

        // Check if file exists
        if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
            res.json({ success: true, message: 'File deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'File not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;