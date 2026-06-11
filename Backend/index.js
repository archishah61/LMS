const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const errorMiddleware = require("./middleware/errorMiddleware");
const { initSocket } = require("./socket/socket.js");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");

dotenv.config();
const sequelize = require('./config/db');

// Import all routes from the routes/index.js file
const apiRoutes = require('./routes/index.js');

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",          // local dev
      "http://localhost:8000",
      "http://10.108.42.48:5173",
      process.env.FRONTEND_URL,
      "https://view.officeapps.live.com"    // Office Online viewer
    ],
    credentials: true, // allow cookies
  })
);

app.use((req, res, next) => {
  if (req.path.startsWith('/__/auth')) {
    res.removeHeader('Cross-Origin-Opener-Policy');
    res.removeHeader('Cross-Origin-Embedder-Policy');
  }
  next();
});

app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
app.use(require("./simulationMiddleware"));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));


// Static file middleware setup
app.use("/course/thumbnail", express.static(path.join(__dirname, "uploads/course/thumbnail")));
app.use("/course/preview_video", express.static(path.join(__dirname, "uploads/course/preview_video")));
app.use("/course/seo", express.static(path.join(__dirname, "uploads/course/seo")));
app.use("/course/og", express.static(path.join(__dirname, "uploads/course/og")));

// Serve preview images for courses (when admins upload an image instead of a video)
app.use("/course/preview_image", express.static(path.join(__dirname, "uploads/course/preview_image")));
app.use("/module/image", express.static(path.join(__dirname, "uploads/module/image")));
app.use("/session/images", express.static(path.join(__dirname, "uploads/session/images")));

app.use("/certificates", express.static(path.join(__dirname, "uploads/certificates")))

app.use("/uploads/audio", express.static(path.join(__dirname, "uploads/audio")));
app.use("/audios/video", express.static(path.join(__dirname, "uploads/audios/video")));
app.use("/audios/audio", express.static(path.join(__dirname, "uploads/audios/audio")));
app.use("/audios/general", express.static(path.join(__dirname, "uploads/audios/general")));
app.use("/audios/accordion", express.static(path.join(__dirname, "uploads/audios/accordion")));
app.use("/audios/slide_video", express.static(path.join(__dirname, "uploads/audios/slide_video")));
app.use("/audios/slide_audio", express.static(path.join(__dirname, "uploads/audios/slide_audio")));
app.use("/audios/slide_general", express.static(path.join(__dirname, "uploads/audios/slide_general")));
app.use("/audios/slide_accordion", express.static(path.join(__dirname, "uploads/audios/slide_accordion")));
app.use(
  "/audios/multi_slide",
  express.static(path.join(__dirname, "uploads/audios/multi_slide"))
);


app.use("/video", express.static(path.join(__dirname, "uploads/video")));
app.use("/audio", express.static(path.join(__dirname, "uploads/audio")));
app.use(
  "/material/pdf",
  express.static(path.join(__dirname, "uploads/material/pdf"))
);
app.use(
  "/material/image",
  express.static(path.join(__dirname, "uploads/material/image"))
);
app.use(
  "/material/document",
  express.static(path.join(__dirname, "uploads/material/document"))
);
app.use(
  "/material/others",
  express.static(path.join(__dirname, "uploads/material/others"))
);
app.use(
  "/assignments/file",
  express.static(path.join(__dirname, "uploads/assignments/file"))
);
app.use(
  "/assignments/submission",
  express.static(path.join(__dirname, "uploads/assignments/submission"))
);
app.use(
  "/quiz/question_images",
  express.static(path.join(__dirname, "uploads/quiz/question_images"))
);
app.use(
  "/quiz/video",
  express.static(path.join(__dirname, "uploads/quiz/video"))
);
app.use(
  "/quiz/audio",
  express.static(path.join(__dirname, "uploads/quiz/audio"))
);
app.use(
  "/quiz/videopause",
  express.static(path.join(__dirname, "uploads/quiz/videopause"))
);
app.use(
  "/quiz/audiopause",
  express.static(path.join(__dirname, "uploads/quiz/audiopause"))
);
app.use(
  "/quiz/option_images",
  express.static(path.join(__dirname, "uploads/quiz/option_images"))
);
app.use(
  "/quiz/predefined_question_images",
  express.static(path.join(__dirname, "uploads/predefined/question_images"))
);
app.use(
  "/quiz/predefined_option_images",
  express.static(path.join(__dirname, "uploads/predefined/option_images"))
);
app.use(
  "/accordion/attachments",
  express.static(path.join(__dirname, "uploads/accordion/attachments"))
);
app.use(
  "/multiSlide/video",
  express.static(path.join(__dirname, "uploads/multi_slide/video"))
);
app.use(
  "/multiSlide/audio",
  express.static(path.join(__dirname, "uploads/multi_slide/audio"))
);
app.use(
  "/multislide/accordion/attachments",
  express.static(path.join(__dirname, "uploads/multi_slide/accordion/attachments"))
);
app.use(
  "/multiSlide/general/pdf",
  express.static(path.join(__dirname, "uploads/multi_slide/general/pdf"))
);
app.use(
  "/multiSlide/general/image",
  express.static(path.join(__dirname, "uploads/multi_slide/general/image"))
);
app.use(
  "/multiSlide/general/document",
  express.static(path.join(__dirname, "uploads/multi_slide/general/document"))
);
app.use(
  "/multiSlide/general/others",
  express.static(path.join(__dirname, "uploads/multi_slide/general/others"))
);
app.use(
  "/user/image",
  express.static(path.join(__dirname, "uploads/user/profile_images"))
);
app.use(
  "/admin/image",
  express.static(path.join(__dirname, "uploads/admin/profile_image_admin"))
);
app.use(
  "/assignments/matching_options/",
  express.static(path.join(__dirname, "uploads/assignments/matching_options/"))
);
app.use(
  "/assignments/matching_matches/",
  express.static(path.join(__dirname, "uploads/assignments/matching_matches/"))
);
app.use(
  "/cheat-sheet/image/",
  express.static(path.join(__dirname, "uploads/cheat-sheet/image/"))
);
app.use(
  "/cheat-sheet-section/image/",
  express.static(path.join(__dirname, "uploads/cheat-sheet-content/image/"))
);
app.use(
  "/partner/logo",
  express.static(path.join(__dirname, "uploads/partner/logo"))
);
app.use("/tags/", express.static(path.join(__dirname, "uploads/tags/")));
app.use(
  "/support/attachment/",
  express.static(path.join(__dirname, "uploads/support/"))
);
app.use(
  "/testimonials/logos",
  express.static(path.join(__dirname, "uploads/testimonials/logos"))
);
app.use(
  "/testimonials/authors",
  express.static(path.join(__dirname, "uploads/testimonials/authors"))
);
app.use(
  "/audiotoScript",
  express.static(path.join(__dirname, "uploads/audiotoScript/audiotoScript"))
);
app.use(
  "/videotoscript",
  express.static(path.join(__dirname, "uploads/videotoscript/videotoscript"))
);
app.use(
  "/imagetoscript",
  express.static(path.join(__dirname, "uploads/imagetoscript/imagetoscript"))
);
app.use(
  "/generated-images",
  express.static(path.join(__dirname, "uploads/generated-images"))
);
app.use(
  "/aboutImg",
  express.static(path.join(__dirname, "uploads/aboutImg"))
);

app.use(
  "/blog",
  express.static(path.join(__dirname, "uploads/blog"))
);

app.use("/meta/seo", express.static(path.join(__dirname, "uploads/meta/seo")));
app.use("/meta/og", express.static(path.join(__dirname, "uploads/meta/og")));

app.use(
  "/frontend_statistics/icons",
  express.static(path.join(__dirname, "uploads/frontend_statistics/icons"))
);

app.use(
  "/frontend_features/icons",
  express.static(path.join(__dirname, "uploads/frontend_features/icons"))
);

app.use(
  "/footer",
  express.static(path.join(__dirname, "uploads/footer"))
);

app.use(
  "/daily_challenge/image/",
  express.static(path.join(__dirname, "uploads/daily_challenge/image/"))
)

app.use(
  "/roadmaps/",
  express.static(path.join(__dirname, "/uploads/roadmaps/"))
);

app.use(
  "/contest/banner/",
  express.static(path.join(__dirname, "uploads/contest/banner/"))
);

app.use(
  "/template/banner/",
  express.static(path.join(__dirname, "uploads/contest_template/banner/"))
);

app.use(
  "/slide_material/pdf",
  express.static(path.join(__dirname, "uploads/slide_material/pdf"))
);
app.use(
  "/slide_material/image",
  express.static(path.join(__dirname, "uploads/slide_material/image"))
);
app.use(
  "/slide_material/document",
  express.static(path.join(__dirname, "uploads/slide_material/document"))
);
app.use(
  "/slide_material/others",
  express.static(path.join(__dirname, "uploads/slide_material/others"))
);
app.use(
  "/placeholder",
  express.static(path.join(__dirname, "uploads/placeholder"))
);

// Fallback for ANY image
app.use((req, res, next) => {
  // Only fallback for image requests
  if (req.originalUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    const placeholderPath = path.join(__dirname, "uploads/placeholder/placeholder.png");
    return res.sendFile(placeholderPath);
  }
  // Only fallback for Video requests
  if (req.originalUrl.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i)) {
    const placeholderPath = path.join(__dirname, "uploads/placeholder/placeholder.mp4");
    return res.sendFile(placeholderPath);
  }

  next(); // continue for non-image requests
});

app.use("/swagger-output.json", express.static(path.join(__dirname, "swagger-output.json")));

// Use all routes from the routes index
app.use("/api", apiRoutes);

const initializeDatabase = require("./initializeDatabase");
const setupStoredProcedures = require("./migrations/dbProcedures");
const StudentFAQResponse = require("./models/student_management/studentFAQResponse.js");
const AssignmentCompletion = require("./models/learning_progress/assignmentCompletion.js");
const AssignmentResponse = require("./models/learning_progress/assignmentResponse.js");
const AssignmentExtensionRequest = require("./models/learning_progress/assignmentExtensionRequest.js");
const CourseTimeTracking = require("./models/learning_progress/courseTimeTracking.js");
const ProgressTracking = require("./models/learning_progress/progressTracking.js");
const TrueFalseQuestion = require('./models/content_management/trueFalseQuestion.js');
const SupportResolutionLog = require('./models/support/support_resolution_log.js');
const TopicContent = require('./models/course_management/topic_content.js');
const Country = require("./models/masters/country.js");
const State = require("./models/masters/state.js");
const City = require("./models/masters/city.js");
const Role = require("./models/auth/RoleAndPermission/Role.js");
const Permission = require("./models/auth/RoleAndPermission/Permission.js");
const RolePermission = require("./models/auth/RoleAndPermission/RolePermission.js");
const Wishlist = require("./models/course_management/wishlist.js");
const { DragDropQuestion } = require("./models/content_management/quiz-questions-types/dragDropQuestionModel.js");
const { InterviewEvaluation, InterviewEvaluationResult, QuestionEvaluation } = require("./models/aiInterview/InterviewEvaluation.js");
const InterviewSettings = require("./models/aiInterview/interviewSettings.js");
const defaultCourseSmit = require("./defaultCourseData/defaultCourseSmit");
const defaultCourseKhushi = require("./defaultCourseData/defaultCourseKhushi");
const defaultCoursePrince = require("./defaultCourseData/defaultCoursePrince");
const defaultCourseArchi = require("./defaultCourseData/defaultCourseArchi");
const insertDefaultCourseGujratGeographyData = require("./defaultCourseData/defaultCourseKuldeepsinh");
const { createReactCourse } = require("./defaultCourseData/defaultCourse3");
const { QuizQuestion } = require("./models/content_management/quizQuestion.js");
const { QuizQuestionOption } = require("./models/content_management/quizQuestionOption.js");
const UserPointTransaction = require("./models/user_points/user_point_transactions.js");
const ChallengeAttemptResponse = require("./models/challenges/challenge_progress/challenge_attempt_response.js");
const UserCheatSheet = require("./models/cheat_sheet/userCheatSheet.js");
const Contact = require("./models/support/contact.js");
const Subscribe = require("./models/support/subscribe.js");
const createDefaultPolicies = require("./defaultDataPrivacyPolicy/defaultPrivacyPolicy.js");
const createDefaultTerms = require("./defaultDataTermsAndCondition/defaultTermsAndCondition.js");
const createDefaultFooterSetting = require("./defaultDataFooter/defaultDataFooter.js");
const createDefaultTestimonials = require("./defaultDataTestimonials/createDefaultTestimonials.js");
const ContestTemplate = require("./models/contest/contest_content/contestTemplate.js");
const Contest = require("./models/contest/contest_content/contest.js");
const ContestActivity = require("./models/contest/contest_content/contestActivity.js");
const ContestPrize = require("./models/contest/contest_content/contestPrize.js");
const ContestCoding = require("./models/contest/contest_content/contest_type/contestCoding.js");
const ContestQuiz = require("./models/contest/contest_content/contest_type/contestQuiz.js");
const UserContestActivity = require("./models/contest/user_contest/userContestActivity.js");
const UserContestEnrollment = require("./models/contest/user_contest/userContest.js");
const { Partner } = require("./models/partner/partner.js");
const { PartnerActive } = require("./models/partner/partnerActive.js");
const ContestCodingTestCase = require("./models/contest/contest_content/contest_type/contestCodingTestCase.js");
const studentAccessibleData = require("./models/enrollment_management/student_accessible_data.js");
const UserContestQuiz = require("./models/contest/user_contest/userContestQuiz.js");
const UserActivityLog = require("./models/activity/userActivityLog.js");
const { ArrangeOrderQuestion } = require("./models/content_management/quiz-questions-types/arrangeOrder.js");
const FooterSetting = require("./models/legalPages/footerSetting.js");
const CourseGenerationPayment = require("./models/tier/courseGenerationPayment.js");
const CourseGenerationHistory = require("./models/tier/courseGenerationHistory.js");
const Tier = require("./models/tier/tier.js");
const DifficultyLevel = require("./models/tier/difficultyLevel.js");
const { FeatureInterest } = require("./models/support/featureInterest.js");
const { FeatureStatus } = require("./models/masters/featureStatus.js");
const SeoMeta = require("./models/legalPages/seoMeta.js");
const setupCoursesProcedures = require("./procedures/courses/courseProcedures.js");
const ContentMapping = require("./models/course_management/contentMapping.js");
const { setupNewProgressTrackingProcedures } = require("./procedures/learning_progress/newProgressTrackingProcedures.js");
const { seedAnalyticsData } = require("./defaultCourseData/defaultAnalyticsData.js");

const CompanyLogo = require("./models/testimonials/CompanyLogo.js");
const Testimonial = require("./models/testimonials/Testimonial.js");
const FrontendFaq = require("./models/landingpage_management/frontendFaq.js");
const FrontendStatistics = require("./models/landingpage_management/frontendStatistics.js");
const UserContestCoding = require("./models/contest/user_contest/userContestCoding.js");
const FrontendFeatures = require("./models/landingpage_management/frontendFeatures.js");
const AiParagraphPractice = require("./models/aiStudentPerformanceTracking/aiParagraphPractice.js");
const LearningPath = require("./models/aiLearningPath/learning_path.js");
const MathSolverLog = require("./models/aiMathSolver/math_solver.js");
const Blog = require("./models/blogs/blog.js");
const BlogCategory = require("./models/blogs/blogCategory.js");
const { createDefaultBlogs, createDefaultBlogCategories } = require("./defaultDataBlogs/defaultBlogs");

async function syncDatabase() {
  try {
    // This will create the table if it doesn't exist
    await CompanyLogo.sync();
    await Testimonial.sync();
    await Wishlist.sync();
    await TrueFalseQuestion.sync();
    await StudentFAQResponse.sync();
    await AssignmentCompletion.sync();
    await AssignmentResponse.sync();
    await AssignmentExtensionRequest.sync();
    await CourseTimeTracking.sync();
    await ProgressTracking.sync();
    await SupportResolutionLog.sync();
    await TopicContent.sync();
    await Country.sync();
    await State.sync();
    await City.sync();
    await Role.sync();
    await Permission.sync();
    await RolePermission.sync();
    await DragDropQuestion.sync();
    await InterviewEvaluation.sync();
    await InterviewSettings.sync();
    await InterviewEvaluationResult.sync();
    await ArrangeOrderQuestion.sync();
    await QuestionEvaluation.sync();
    await QuizQuestion.sync();
    await QuizQuestionOption.sync();
    await UserPointTransaction.sync();
    await Partner.sync();
    await PartnerActive.sync();
    await FeatureStatus.sync();
    await FeatureInterest.sync();
    await SeoMeta.sync();
    await ChallengeAttemptResponse.sync();
    await UserCheatSheet.sync();
    await Contact.sync();
    await FooterSetting.sync();
    await Subscribe.sync();
    await ContestTemplate.sync();
    await Contest.sync();
    await ContestActivity.sync();
    await ContestPrize.sync();
    await ContestCoding.sync();
    await ContestCodingTestCase.sync();
    await ContestQuiz.sync();
    await UserContestActivity.sync();
    await UserContestEnrollment.sync();
    await UserContestQuiz.sync();
    await UserContestCoding.sync();
    await UserActivityLog.sync();
    await DifficultyLevel.sync();
    await Tier.sync();
    await CourseGenerationPayment.sync();
    await CourseGenerationHistory.sync();
    await studentAccessibleData.sync();
    await ContentMapping.sync();
    await FrontendFaq.sync();
    await FrontendStatistics.sync();
    await FrontendFeatures.sync();
    await AiParagraphPractice.sync();
    await LearningPath.sync();
    await MathSolverLog.sync();
    await Blog.sync();
    await BlogCategory.sync();

    // Seed permissions
    const seedBlogsPermissions = require("./utils/seedPermissions");
    await seedBlogsPermissions();

  } catch (error) {
    console.error('Error creating table:', error);
  }
}

async function runSetup() {
  try {
    // await initializeDatabase(); // Initialize the database
    // await syncDatabase();
    console.log("✅ Database initialized and synced successfully.");

    await setupStoredProcedures(); // Set up stored procedures
    console.log("✅ Stored procedures set up successfully.");

    // await defaultCourseForTesting();
    // await defaultCourseSmit();
    // await defaultCourseArchi();
    // await insertDefaultCourseGujratGeographyData();
    // await defaultCourseKhushi();
    // await defaultCoursePrince();
    // // // await createReactCourse()
    // console.log("✅ Default course data inserted successfully.");

    // await createDefaultPolicies(); // Create default privacy policies
    // await createDefaultTerms(); // Create default terms and conditions
    // await createDefaultFooterSetting(); // Create default footer settings
    // await createDefaultTestimonials(); // Create default testimonials // Turbo
    // await createDefaultBlogCategories(); // Create default blog categories
    // await createDefaultBlogs(); // Create default blogs
    // await seedAnalyticsData();

    // await setupTopicProcedures();
    // await setupNewProgressTrackingProcedures();
    console.log("Database setup complete.");
  } catch (err) {
    console.error("Error during setup:", err);
  }
}

// runSetup();
// Uncomment this line to run the setup when the server starts

// Global Error Handling Middleware (MUST BE AT THE END)
app.use(errorMiddleware);

sequelize
  .sync({ alter: false })
  .then(() => {
    const server = app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );

    // Initialize socket with the server
    initSocket(server);

    require("./jobs/reminderScheduler.js");
    require("./jobs/endContestScheduler.js");

  })
  .catch((err) => console.log(err));

// Later during app initialization

module.exports = app; // 👈 Export for Swagger
