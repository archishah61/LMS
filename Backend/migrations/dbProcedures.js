// utils/procedure/setupStoredProcedures.js

const setupAssignmentProcedures = require("../procedures/assignment/assignmentProcedures");
const setupCourseCategoryProcedures = require("../procedures/courses/courseCategoryProcedures");
const setupAudioToScriptProcedures = require("../procedures/quiz/audioToScriptProcedure");
const setupFillTheBlanksProcedures = require("../procedures/quiz/fillTheBlanksProcedures");
const setupQuizOptionProcedures = require("../procedures/quiz/quizOptionProcedures");
const setupQuizProcedures = require("../procedures/quiz/quizProcedures");
const setupQuizQuestionProcedures = require("../procedures/quiz/quizQuestionProcedures");
const setupRealWordQuestionProcedures = require("../procedures/quiz/realWordQuestionProcedures");
const setupSummarizePassageQuestionProcedures = require("../procedures/quiz/summaryPassageProcedures");
const setupSessionProcedures = require("../procedures/courses/sessionsProcedures");
const setupCourseProcedures = require("../procedures/courses/courseProcedures");
const setupModuleProcedures = require("../procedures/courses/moduleProcedures");
const setupTopicProcedures = require("../procedures/courses/topicProcedures");
const setupCheatSheetProcedures = require("../procedures/cheatSheet/cheatSheetProcedure");
const setupMainSectionProcedures = require("../procedures/cheatSheet/mainSectionProcedure");
const setupSectionProcedures = require("../procedures/cheatSheet/sectionProcedure");
const setupDailyChallengeProcedures = require("../procedures/challenge/dailyChallengeProcedure");
const setupFillInTheBlankChallengeProcedures = require("../procedures/challenge/fillInTheBlankChallengeProcedure");
const setupMcqChallengeProcedures = require("../procedures/challenge/mcqChallengeProcedure");
const setupChallengeCategoryProcedures = require("../procedures/challenge/challengeCategoryProcedure");
const setupChallengeQuestProcedures = require("../procedures/challenge/challengeQuest/challengeQuestProcedure");
const setupChallengePhaseProcedures = require("../procedures/challenge/challengeQuest/challengePhaseProcedure");
const setupChallengeTaskProcedures = require("../procedures/challenge/challengeQuest/challengeTaskProcedure");
const setupTextBasedQuizTextProcedures = require("../procedures/quiz/textBasedQuiz/textBasedQuizTextProcedure");
const setupFillInTheBlankGQProcedures = require("../procedures/quiz/textBasedQuiz/fillInTheBlankGQProcedure");
const setupMultipleChoiceQuestionGQProcedures = require("../procedures/quiz/textBasedQuiz/multipleChoiceQuestionGQProcedure");
const setupEnrollmentProcedures = require("../procedures/enrollment/enrollmentProcedures");
const setupReviewProcedures = require("../procedures/Review/reviewProcedure");
const setupWishlistProcedures = require("../procedures/Wishlist/wishlistProcedure");
const setupMatchingProcedures = require("../procedures/matching/matchingProcedure");
const setupPaymentProcedures = require("../procedures/enrollment/paymentProcedures");
const setupPreDefinedQuestionProcedures = require("../procedures/predefinedQuestion/preDefinedQuestionProcedures");
const setupAdminProcedures = require("../procedures/auth/adminProcedures");
const setupUserProcedures = require("../procedures/auth/userProcedures");
const setupQuizResponseProcedures = require("../procedures/learningProgress/quizResponseProcedures");
const setupStudentFAQResponseProcedures = require("../procedures/studentManagement/studentFAQResponseProcedure");
const setupPreDefinedOptionProcedures = require("../procedures/predefinedQuestion/preDefinedOptionProcedures");
const setupQuizPreDefinedProcedures = require("../procedures/predefinedQuestion/quizPredefinedQuestionsProcedure");
const setupCourseFAQProcedures = require("../procedures/courses/courseFAQProcedures");
const setupCourseFAQOptionsProcedures = require("../procedures/courses/courseFaqOptionsProcedures");
const setupTrueFalseProcedures = require("../procedures/trueOrFalse/trueFalseProcedure");
const setupParagraphWritingProcedures = require("../procedures/paragraphWriting/paragraphWritingProcedures");
const setupQuizCompletionProcedures = require("../procedures/contentManagement/quizCompletionProcedure");
const setupAssignmentResponseProcedures = require("../procedures/learningProgress/assignmentResponseProcedures");
const setupAssignmentCompletionProcedures = require("../procedures/learningProgress/assignmentCompletionProcedures");
const setupAssignmentExtensionRequestProcedures = require("../procedures/learningProgress/assignmentExtensionRequestProcedure");
const setupBestOptionQuestionProcedures = require("../procedures/quiz/bestOptionQuestionProcedures");
const setupCourseTimeTrackingProcedures = require("../procedures/learningProgress/courseTimeTrackingProcedure");
const { setupProgressTrackingProcedures } = require("../procedures/learning_progress/progressTrackingProcedures");
const setupChallengeProcedures = require("../procedures/challengeProgress/challengeProcedures");
const setUpSupportProcedure = require("../procedures/support/supportProcedure");
// const contactProcedures = require("../procedures/support/contactProcedures");
const setupDragDropQuestionProcedures = require("../procedures/quiz/dragDropQuestionProcedure");
const setUpTrueFalseChallengeProcedures = require("../procedures/challenge/trueFalseChallengeProcedure");
const setupTopicContentProcedures = require("../procedures/courses/topicContentProcedures");
const setupLocationProcedures = require("../procedures/masters/locationProcedures");
const setupUserEngagementProcedures = require("../procedures/reporting/userEngagementProcedures");
const setupCoursePerformanceAnalyicsProcedures = require("../procedures/reporting/coursePerformanceAnalyticsProcedures");
const setupRevenueAndFinancialAnalytics = require("../procedures/reporting/revenueAndFinancialAnalyticsProcedures");
const setupRoleProcedures = require("../procedures/auth/RoleAndPermission/roleProcedures");
const setupRoleAndPermissionProcedures = require("../procedures/auth/RoleAndPermission/rolePermissionProcedures");
const setupPermissionProcedures = require("../procedures/auth/RoleAndPermission/permissionProcedures");
const setupChallengeAnalytics = require("../procedures/reporting/challengeAnalyticsProcedures");
const setupTimeBasedAnalyticsProcedures = require("../procedures/reporting/timeBasedAnalyticsProcedures");
const setupLeaderboardAndGamificationAnalyticsProcedures = require("../procedures/reporting/leaderboardAndGamificationAnalyticsProcedures");
const setupTrueFalseGQProcedures = require("../procedures/quiz/textBasedQuiz/trueflaseQuestionGQProcedure");
const setupBulletProcedures = require("../procedures/ai/summarization/bulletProcedure");
const setupFlashCardProcedures = require("../procedures/ai/summarization/flashCardProcedure");
const { setupStudentPerformanceAnalysisProcedures } = require("../procedures/AIStudentPerformanceTracking/analysisProcedure");
const setupSummaryProcedures = require("../procedures/ai/summarization/summaryProcedure");
const setupInterviewEvaluationProcedures = require("../procedures/ai/interviewProcedures/interviewProcedure");
const setupUserPointProcedures = require("../procedures/userPoint/userPointProcedure");
const setupUserStreaksProcedures = require("../procedures/userStreaks/userStreaksProcedure");
const setupadminStudentPerformanceAnalyticsProcedures = require("../procedures/AIStudentPerformanceTracking/adminStudentPerformnaceAnalyticsProcedure");
const setupPartnerProcedures = require("../procedures/partner/partnerProcedure");
const setupisPartnerActiveProcedures = require("../procedures/partner/isPartnerActiveProcedure");
const setupPerformanceFeedbackProcedures = require("../procedures/AIStudentPerformanceTracking/performanceFeedbackProcedure");
const setupEnrolledStudentsProcedures = require("../procedures/AIStudentPerformanceTracking/enrolledStudentsProcedure");
const setupInterviewAnalytics = require("../procedures/reporting/aiInterviewAnalyticsProcedure");
const { setupAnalyticsTopicProcedures } = require("../procedures/AIStudentPerformanceTracking/analyticsTopicProcedure");
const setupPrivacyPolicyProcedures = require("../procedures/legalPages/privacyPolicyProcedure");
const setupFooterSettingProcedures = require("../procedures/legalPages/footerSettingProcedure");
const setupSocialMediaProcedures = require("../procedures/legalPages/socialMediaProcedure");
const setupTermsOfServiceProcedures = require("../procedures/legalPages/termsOfServiceProcedure");
const setupAboutProcedures = require("../procedures/support/aboutProcedures");
const setupSubscribeProcedures = require("../procedures/support/subscribeProcedure");
const setupContestTemplateProcedures = require("../procedures/contest/contest_content/contestTemplateProcedures");
const setupContactProcedures = require("../procedures/support/contactProcedures");
const setupContestPrizeProcedures = require("../procedures/contest/contest_content/contestPrizeProcedures");
const setupContestActivityProcedures = require("../procedures/contest/contest_content/contestActivityProcedures");
const setupContestProcedures = require("../procedures/contest/contest_content/contestProcedures");
const setupContestCodingProcedures = require("../procedures/contest/contest_type/contestCodingProcedures");
const setupContestCodingTestCaseProcedures = require("../procedures/contest/contest_type/contestCodingTestCaseProcedures");
const setupContestQuizProcedures = require("../procedures/contest/contest_type/contestQuizProcedures");
const setupUserContestProcedures = require("../procedures/contest/user_contest/userContestProcedures");
const setupUserActivityProcedures = require("../procedures/contest/user_contest/userActivityProcedures");
const setupUserQuizProcedures = require("../procedures/contest/user_contest/userQuizProcedures");
const setupArrangeOrderProcedures = require("../procedures/quiz/ArrangeOrderQuestionProcedure");
const setupUserActivityLogProcedures = require("../procedures/activity/userActivityLogProcedures");
const { setupNewProgressTrackingProcedures } = require("../procedures/learning_progress/newProgressTrackingProcedures");
const setupTierProcedures = require("../procedures/tier/tierProcedures");
const setupDifficultyLevelProcedures = require("../procedures/tier/difficultyLevelProcedures");
const setupCourseGenerationHistoryProcedures = require("../procedures/tier/courseGenerationHistoryProcedures");
const setupFeatureStatusProcedures = require("../procedures/masters/featureStatusProcedure");
const setupFeatureInterestProcedures = require("../procedures/support/featureInterestProcedures");
const setupPromoCodeProcedures = require("../procedures/promocode/promoCodeProcedures");
const setupSeoMetaProcedures = require("../procedures/legalPages/seoMetaProcedures");
const setupImportContentProcedures = require("../procedures/importContent/importContentProcedures");
const setupFrontendFaqProcedures = require("../procedures/landingpageManagement/frontentFaqProcedures");
const setupFrontendStatisticsProcedures = require("../procedures/landingpageManagement/frontendStatiscticsProcedures");
const setupUserCodingProcedures = require("../procedures/contest/user_contest/userCodingProcedures");
const setupFrontendFeaturesProcedures = require("../procedures/landingpageManagement/frontendFeaturesProcedures");
const setupInterviewSettingsProcedures = require("../procedures/ai/interviewProcedures/interviewSettingsProcedures");
const setupBlogProcedures = require("../procedures/blogs/blogProcedures");
const setupBlogCategoryProcedures = require("../procedures/blogs/blogCategoryProcedures");
const setupTestimonialProcedures = require("../procedures/landingpageManagement/testimonialProcedures");
const setupMathSolverProcedures = require("../procedures/ai/MathSolverProcedures");
const setupParagraphGeneratorProcedures = require("../procedures/ai/ParagraphGeneratorHistoryProcedures");


const setupStoredProcedures = async () => {
  try {
    console.log("🚀 Running all stored procedure setups...");

    // Reporting

    // 1. User Engagement
    await setupUserEngagementProcedures() // Smit (Tested ✅)

    //2. Course Performance Analytics
    await setupCoursePerformanceAnalyicsProcedures() //Archi

    //3.Revenue and Financial Analytics
    await setupRevenueAndFinancialAnalytics()//Archi

    // 4. Challenge Analytics
    await setupChallengeAnalytics() // Smit 

    // 5. Time Based Analytics
    await setupTimeBasedAnalyticsProcedures() // Archi 
    //6. Leaderboard & Gamification Analytics
    await setupLeaderboardAndGamificationAnalyticsProcedures(); //Archi

    // Topic Content Item
    await setupTopicContentProcedures(); // Smit (Tested ✅)

    // Course Catagory
    await setupCourseCategoryProcedures(); // ✅ Modular import and call

    //  Session
    await setupSessionProcedures(); // ✅ Modular import and call

    // courses
    await setupCourseProcedures(); // ✅ Modular import and call

    // Modules
    await setupModuleProcedures(); // ✅ Modular import and call

    // Topics
    await setupTopicProcedures(); // ✅ Modular import and call

    await setupCourseCategoryProcedures(); // (Smit) ✅ (Tested)

    // Assignment
    await setupAssignmentProcedures(); // (Smit)

    // Fill in the blanks
    await setupFillTheBlanksProcedures(); // (Smit)
    // Course FAQs
    await setupCourseFAQProcedures(); // (Smit) ✅ (Tested)

    // Course FAQ Options
    await setupCourseFAQOptionsProcedures(); // (Smit) ✅ (Tested)

    await setupChallengeProcedures(); // (Kuldeepsinh) ✅ (Tested)

    await setUpSupportProcedure(); // (Kuldeepsinh) ✅ (Tested)

    await setupAboutProcedures();

    await setupContactProcedures(); // (smit)

    await setupSubscribeProcedures();

    await setUpTrueFalseChallengeProcedures(); // (Kuldeepsinh)

    await setupLocationProcedures(); // (Kuldeepsinh)

    await setupRoleProcedures(); // (Kuldeepsinh)

    await setupRoleAndPermissionProcedures();

    await setupPermissionProcedures();

    await setupCourseCategoryProcedures(); // ✅ Modular import and call
    await setupSessionProcedures(); // ✅ Modular import and call
    await setupCourseProcedures(); // ✅ Modular import and call

    // Assignment
    await setupAssignmentProcedures(); // (Smit) ✅(Tested)

    // Fill in the blanks
    await setupFillTheBlanksProcedures(); // (Archi) ✅(Tested)

    // Paragraph Writing
    await setupParagraphWritingProcedures(); // (Archi) ✅(Tested)

    // Quizz
    await setupQuizProcedures(); // (Smit) ✅ (Tested)

    // Quizz Question
    await setupQuizQuestionProcedures(); // (Smit)  ✅ (Tested)

    // CheatSheet
    await setupCheatSheetProcedures(); //  (Rishi) ✅ (Tested)
    await setupMainSectionProcedures(); // (Rishi) ✅ (Tested)
    await setupSectionProcedures(); // (Rishi) ✅ (Tested)

    // Quizz Options
    await setupQuizOptionProcedures(); // (Smit) ✅ (Tested)

    // Audio to Script
    await setupAudioToScriptProcedures(); // (Smit)  ✅ (Tested)

    // Real Word
    await setupRealWordQuestionProcedures(); // (Smit) ✅ (Tested)

    // Summary Passage
    await setupSummarizePassageQuestionProcedures(); // (Smit) ✅ (Tested)

    // Daily Challenge
    await setupDailyChallengeProcedures(); // (Rishi) ✅ (Tested)

    // Arrange Order 
    await setupArrangeOrderProcedures(); // (Smit) ✅ (Tested)

    // fill on the blank challenge Challenge
    await setupFillInTheBlankChallengeProcedures(); // (Rishi) ✅ (Tested)

    // Mcq challenge Challenge
    await setupMcqChallengeProcedures(); // (Rishi) ✅ (Tested)

    // challenge category Challenge
    await setupChallengeCategoryProcedures(); // (Rishi) ✅ (Tested)

    // challenge Quest Challenge
    await setupChallengeQuestProcedures(); // (Rishi) ✅ (Tested)

    // challenge Phase Challenge
    await setupChallengePhaseProcedures(); // (Rishi) ✅ (Tested)

    // challenge task Challenge
    await setupChallengeTaskProcedures(); // (Rishi) ✅ (Tested)

    // text based quiz text
    await setupTextBasedQuizTextProcedures(); // (Rishi) ✅ (Tested)

    // text based quiz text - Fill in the blank
    await setupFillInTheBlankGQProcedures(); // (Rishi) ✅ (Tested)

    // text based quiz text - multiple choice question
    await setupMultipleChoiceQuestionGQProcedures(); // (Rishi) ✅ (Tested)

    // Enrollment
    await setupEnrollmentProcedures(); // (Smit) ✅ (Tested)

    // Payment
    await setupPaymentProcedures(); // (Smit) ❌ (Unused)

    // Predefined Questions
    await setupPreDefinedQuestionProcedures(); // (Smit) // ✅ (Tested)

    // Predefined Options
    await setupPreDefinedOptionProcedures(); // (Smit) ✅ (Tested)

    // Quiz Predefined Questions
    await setupQuizPreDefinedProcedures(); // (Smit) ✅ (Tested)

    //Review
    await setupReviewProcedures(); // (Archi)  ✅ (Tested)

    // Wishlist
    await setupWishlistProcedures(); // (Archi)   ✅ (Tested)

    //Matching
    await setupMatchingProcedures(); // (Archi)    ✅ (Tested)

    //True Or False
    await setupTrueFalseProcedures(); // (Archi)    ✅ (Tested)

    // Session
    await setupSessionProcedures(); // (Rishi)

    // Course
    await setupCourseProcedures(); // (Rishi)

    // Admin
    await setupAdminProcedures(); //  (khushi)

    // User
    await setupUserProcedures(); //  (khushi)

    // quiz response
    await setupQuizResponseProcedures(); // (khushi)

    // Student FAQ Response
    await setupStudentFAQResponseProcedures(); // (khushi)

    //quize completion
    await setupQuizCompletionProcedures(); // (khushi)

    // Assignment Response
    await setupAssignmentResponseProcedures(); // (khushi)

    // Assignment Completion
    await setupAssignmentCompletionProcedures(); // (khushi)

    // Assignment Extension Request
    await setupAssignmentExtensionRequestProcedures(); // (khushi)

    //Best Option Questions
    await setupBestOptionQuestionProcedures(); // (Archi) ✅(Tested)

    // Progress Tracking
    await setupProgressTrackingProcedures(); // (Prince) ✅ (Tested)

    // New Progress Tracking
    await setupNewProgressTrackingProcedures(); // (Kuldeepsinh)

    // Drag Drop Question
    await setupDragDropQuestionProcedures(); // (Prince) ✅ (Tested)


    await setupTrueFalseGQProcedures(); // (Prince) ✅ (Tested)

    await setupCourseTimeTrackingProcedures(); // (khushi)

    await setupChallengeProcedures();

    //Summarization AI
    await setupBulletProcedures(); //Archi
    await setupFlashCardProcedures(); //Archi
    await setupSummaryProcedures(); //Archi

    await setupInterviewEvaluationProcedures(); // Smit

    await setupMathSolverProcedures();

    await setupParagraphGeneratorProcedures();
    
    await setupStudentPerformanceAnalysisProcedures();

    await setupUserPointProcedures();

    await setupUserStreaksProcedures();

    await setupadminStudentPerformanceAnalyticsProcedures();

    await setupPartnerProcedures();

    await setupisPartnerActiveProcedures();

    await setupFeatureStatusProcedures();

    await setupFeatureInterestProcedures();

    await setupSeoMetaProcedures();

    await setupPerformanceFeedbackProcedures();

    await setupEnrolledStudentsProcedures();

    await setupInterviewAnalytics();

    await setupAnalyticsTopicProcedures();

    await setupPrivacyPolicyProcedures();

    await setupFooterSettingProcedures();

    await setupSocialMediaProcedures();

    await setupTermsOfServiceProcedures();

    // Contest

    await setupContestTemplateProcedures();

    await setupContestProcedures();

    await setupContestPrizeProcedures();

    await setupContestActivityProcedures();

    await setupContestCodingProcedures();

    await setupContestCodingTestCaseProcedures();

    await setupUserCodingProcedures();

    await setupContestQuizProcedures();

    await setupUserContestProcedures();

    await setupUserActivityProcedures();

    await setupUserQuizProcedures();

    await setupUserActivityLogProcedures();

    await setupDifficultyLevelProcedures();

    await setupTierProcedures();

    await setupCourseGenerationHistoryProcedures();

    await setupPromoCodeProcedures();

    await setupImportContentProcedures();

    await setupFrontendFaqProcedures();

    await setupFrontendStatisticsProcedures();

    await setupFrontendFeaturesProcedures();

    await setupTestimonialProcedures()

    await setupInterviewSettingsProcedures();

    await setupBlogProcedures();
    await setupBlogCategoryProcedures();


    console.log("✅ All stored procedures created successfully!");
  } catch (error) {
    console.error("❌ Error creating stored procedures:", error);
    throw error;
  }
};

module.exports = setupStoredProcedures;
