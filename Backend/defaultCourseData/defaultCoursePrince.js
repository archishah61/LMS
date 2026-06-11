const sequelize = require("../config/db");
const bcrypt = require("bcryptjs");
const { convert } = require("html-to-text");
const axios = require("axios");
const { getAudioDurationInMinutes } = require("../utils/audioDuration");
const Admin = require("../models/auth/admin");
const User = require("../models/auth/user");
const { CourseCategory } = require("../models/masters/courseCatagory");
const Course = require("../models/course_management/course");
const Session = require("../models/course_management/session");
const Module = require("../models/course_management/module");
const {
  CourseVersion,
} = require("../models/partner/approve_request_version/courseVersion");

const Topic = require("../models/course_management/topic");
const { Video } = require("../models/content_management/video");
const { Audio } = require("../models/content_management/audio");
const { Accordion } = require("../models/content_management/accordian");
const { GeneralMaterial } = require("../models/content_management/genral");

const { Material } = require("../models/content_management/material");

const { MultiSlide } = require("../models/content_management/multi_slide");
const {
  MultiSlideVideo,
} = require("../models/content_management/multiSlideVideo");
const {
  MultiSlideAudio,
} = require("../models/content_management/multiSlideAudio");
const {
  MultiSlideGeneral,
} = require("../models/content_management/multiSlideGeneral");
const {
  MultiSlideAccordion,
} = require("../models/content_management/multiSlideAccordian");

const { Quizzes } = require("../models/content_management/quizzesModel");
const { QuizQuestion } = require("../models/content_management/quizQuestion");
const { QuizQuestionOption } = require("../models/content_management/quizQuestionOption");
// const { QuizQuestion } = require("../models/content_management/quizQuestion");
// const { QuizQuestionOption } = require("../models/content_management/quizQuestionOption");
const {
  QuizQuestions,
} = require("../models/content_management/quizQuestionsModel");
const {
  QuizOptions,
} = require("../models/content_management/quizOptionsModel");
const {
  CompleteSentence,
} = require("../models/content_management/quiz-questions-types/completeTheSentence");

const {
  AudioToScriptQuestion,
} = require("../models/content_management/quiz-questions-types/audiotoScript");

const SummarizePassageQuestion = require("../models/content_management/quiz-questions-types/summarPassageModel");
const { SummarizerManager } = require("node-summarizer");

const {
  generatePublicHash,
} = require("../utils/course_management/generateHash");

const Assignment = require("../models/content_management/assignmentsModel");
const MatchingQuestion = require("../models/content_management/matchingQuestion");
const MatchingOption = require("../models/content_management/matchingOption");
const TrueFalseQuestion = require("../models/content_management/trueFalseQuestion");
const FillTheBlanksQuestion = require("../models/content_management/fillTheBlanks");
const ParagraphWriting = require("../models/content_management/paragraphwriting");
const CourseFAQ = require("../models/course_management/courseFAQs");
const CourseFAQOption = require("../models/course_management/courseFAQOption");
const { PreDefinedQuestions } = require("../models/masters/predefinedQuestion");
const { PreDefinedOptions } = require("../models/masters/predefinedOption");
const {
  BestOptionQuestion,
} = require("../models/content_management/quiz-questions-types/bestOptionQuestion");

const getEmbedding = async (text) => Array(768).fill(0);

// ==============================
// 🔹 Seed Data
// ==============================

const defaultAdmin = {
  username: "admin",
  email: "admin@example.com",
  password: "123",
  roleId: 1,
};

const defaultUsers = [
  {
    full_name: "alice",
    username: "alice123",
    email: "alice123@example.com",
    password: "123",
    profile_image: null,
    mobile_no: "9991112222",
    location: "Berlin",
    country_id: 1,
    state_id: 1,
    city_id: 1,
  },
  {
    full_name: "Bob Marley",
    username: "bob",
    email: "bob@example.com",
    password: "123",
    profile_image: null,
    mobile_no: "8887776666",
    location: "Toronto",
    country_id: 1,
    state_id: 1,
    city_id: 1,
  },
];

const courseCategories = [
  { category: "Language & Global Skills", id: 5 },
];

const courses = [
  {
    id: 5,
    title: "Complete IELTS Preparation Course: Band 7+ Score",
    category_id: 5,
    description:
      "A comprehensive IELTS preparation course covering all four testing modules: Listening, Reading, Writing, and Speaking. This course is designed to help students achieve a band score of 7 or higher through in-depth lessons, practice sessions, and test strategies. Whether you're taking the Academic or General Training test, this course provides all the tools and techniques you need to excel in your IELTS examination.",
    price: 399.0,
    discount: 15,
    duration_minutes: 2700,  // 45 hours * 60
    expiry_days: 365,
    min_access_minutes: 60,  // already in minutes
    max_access_minutes: 180,  // already in minutes
    what_you_will_learn: [
      "Master techniques for all four IELTS modules: Listening, Reading, Writing, and Speaking",
      "Learn time management strategies to maximize your score on test day",
      "Practice with authentic IELTS-style questions and full-length mock tests",
      "Develop advanced vocabulary and grammar needed for a Band 7+ score",
      "Understand the scoring criteria and learn how to identify and avoid common mistakes",
      "Receive detailed feedback on writing and speaking tasks through interactive exercises",
    ],
    skill_development: [
      {
        title: "Advanced Language Mastery",
        statements: ["Develop a rich vocabulary for academic and general contexts.", "Master complex grammatical structures and idiomatic expressions."]
      },
      {
        title: "Effective Communication",
        statements: ["Structure thoughts coherently for speaking and writing tasks.", "Express ideas with fluency and precise pronunciation."]
      },
      {
        title: "Critical Reading & Listening",
        statements: ["Identify main ideas and supporting details quickly under time constraints.", "Infer meaning from context in varying accents and complex texts."]
      }
    ],
    prerequisites: [
      "Intermediate English language proficiency (B1 level or above)",
      "Basic computer skills for accessing online content",
      "Dedication to complete practice exercises and assignments",
    ],
    hashtags: [
      "#IELTS",
      "#EnglishExam",
      "#IELTS7Plus",
      "#TestPrep",
      "#StudyAbroad",
      "#EnglishProficiency",
      "#AcademicEnglish",
    ],
    thumbnail: "/course/thumbnail/IELTS_course_thumbnail.png",
    preview_video: "/course/preview_video/IELTS_course_preview_video.mp4",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
];

const courseFAQs = [
  {
    course_id: 5, // Assuming the IELTS course ID is 1
    question: "Why do you want to take the IELTS exam?",
    created_by: 1,
    created_by_type: "admin",
    updated_by: 1,
    updated_by_type: "admin",
    options: [
      "For university admission",
      "For immigration purposes",
      "For professional registration",
      "For employment opportunities",
      "Personal assessment",
    ],
  },
  {
    course_id: 5,
    question: "What is your current level of English?",
    created_by: 1,
    created_by_type: "admin",
    updated_by: 1,
    updated_by_type: "admin",
    options: [
      "Beginner (A1-A2)",
      "Intermediate (B1-B2)",
      "Advanced (C1-C2)",
      "Not sure",
    ],
  },
  {
    course_id: 5,
    question: "Which IELTS version are you planning to take?",
    created_by: 1,
    created_by_type: "admin",
    updated_by: 1,
    updated_by_type: "admin",
    options: ["IELTS Academic", "IELTS General Training", "Not sure yet"],
  },
  {
    course_id: 5,
    question: "What target band score do you need to achieve?",
    created_by: 1,
    created_by_type: "admin",
    updated_by: 1,
    updated_by_type: "admin",
    options: [
      "Band 5-5.5",
      "Band 6-6.5",
      "Band 7-7.5",
      "Band 8+",
      "Not sure yet",
    ],
  },
  {
    course_id: 5,
    question: "Which IELTS module do you find most challenging?",
    created_by: 1,
    created_by_type: "admin",
    updated_by: 1,
    updated_by_type: "admin",
    options: ["Listening", "Reading", "Writing", "Speaking"],
  },
  {
    course_id: 5,
    question: "How much time can you dedicate weekly to IELTS preparation?",
    created_by: 1,
    created_by_type: "admin",
    updated_by: 1,
    updated_by_type: "admin",
    options: [
      "Less than 5 hours",
      "5-10 hours",
      "10-20 hours",
      "More than 20 hours",
    ],
  },
  {
    course_id: 5,
    question: "How soon will you be taking the IELTS exam?",
    created_by: 1,
    created_by_type: "admin",
    updated_by: 1,
    updated_by_type: "admin",
    options: [
      "Within 1 month",
      "Within 3 months",
      "Within 6 months",
      "More than 6 months away",
      "Not scheduled yet",
    ],
  },
  {
    course_id: 5,
    question: "Have you taken the IELTS exam before?",
    created_by: 1,
    created_by_type: "admin",
    updated_by: 1,
    updated_by_type: "admin",
    options: [
      "Yes, once",
      "Yes, multiple times",
      "No, this will be my first attempt",
    ],
  },
  {
    course_id: 5,
    question: "What is your preferred learning style?",
    created_by: 1,
    created_by_type: "admin",
    updated_by: 1,
    updated_by_type: "admin",
    options: [
      "Visual learning with diagrams and charts",
      "Audio-based learning with lectures",
      "Practice-oriented with many exercises",
      "Reading detailed explanations",
      "Mixed approach",
    ],
  },
  {
    course_id: 5,
    question: "Which country are you planning to go to with your IELTS score?",
    created_by: 1,
    created_by_type: "admin",
    updated_by: 1,
    updated_by_type: "admin",
    options: [
      "United Kingdom",
      "Australia",
      "Canada",
      "United States",
      "New Zealand",
      "Other",
    ],
  },
];

const sessions = [
  {
    course_id: 5,
    title: "Introduction to IELTS and Course Overview",
    chpater_description:
      "Get familiar with the IELTS exam format, understand the scoring system, and learn how to use this course effectively for maximum benefit.",
    status: "active",
    image_name: "ielts_session1.png",
    image_path: "/session/images/ielts_session1.png",
    min_time_in_minute: 120,
  },
  {
    course_id: 5,
    title: "IELTS Listening",
    chpater_description:
      "Master the IELTS Listening test through comprehensive training in various question types and practice with authentic materials.",
    status: "active",
    image_name: "ielts_session2.png",
    image_path: "/session/images/ielts_session2.png",
    min_time_in_minute: 300,
  },
  {
    course_id: 5,
    title: "IELTS Reading",
    chpater_description:
      "Develop effective reading techniques for both Academic and General Training modules with focused practice on all question types.",
    status: "active",
    image_name: "ielts_session3.png",
    image_path: "/session/images/ielts_session3.png",
    min_time_in_minute: 300,
  },
  {
    course_id: 5,
    title: "IELTS Writing",
    chpater_description:
      "Master both writing tasks for Academic and General Training with structured approaches to achieve higher band scores.",
    status: "active",
    image_name: "ielts_session4.png",
    image_path: "/session/images/ielts_session4.png",
    min_time_in_minute: 360,
  },
  {
    course_id: 5,
    title: "IELTS Speaking",
    chpater_description:
      "Build confidence and fluency for all three parts of the speaking test with practical strategies and guided practice.",
    status: "active",
    image_name: "ielts_session5.png",
    image_path: "/session/images/ielts_session5.png",
    min_time_in_minute: 300,
  },
];

const modules = [
  // Session 20
  {
    course_id: 5,
    session_id: 20,
    title: "IELTS Test Format Overview",
    image: "/module/image/ielts_module1.jpg",
    description:
      "Introduction to the IELTS exam structure, including the four skills tested (Listening, Reading, Writing, Speaking) and the differences between Academic and General Training versions.",
    duration_minutes: 60,  // 1 hour * 60
    status: "active",
  },
  {
    course_id: 5,
    session_id: 20,
    title: "Assessment and Goal Setting",
    image: "/module/image/ielts_module2.jpg",
    description:
      "Take a diagnostic test to determine your current English level, understand the band score system, and set realistic goals for your IELTS preparation journey.",
    duration_minutes: 60,  // 1 hour * 60
    status: "active",
  },
  {
    course_id: 5,
    session_id: 20,
    title: "Effective Study Strategies",
    image: "/module/image/ielts_module3.jpg",
    description:
      "Learn proven study methods specific to IELTS preparation, time management techniques, and how to make the most of this course's resources.",
    duration_minutes: 60,  // 1 hour * 60
    status: "active",
  },

  // Session 21
  {
    course_id: 5,
    session_id: 21,
    title: "Understanding IELTS Listening Format",
    image: "/module/image/ielts_listening1.jpg",
    description:
      "Explore the structure of the IELTS Listening test, including the four sections and question types.",
    duration_minutes: 60,  // 1 hour * 60
    status: "active",
  },
  {
    course_id: 5,
    session_id: 21,
    title: "Strategies for Each Listening Section",
    image: "/module/image/ielts_listening2.jpg",
    description:
      "Learn targeted strategies to tackle Section 1 through 4 of the Listening test.",
    duration_minutes: 90,  // 1.5 hours * 60
    status: "active",
  },
  {
    course_id: 5,
    session_id: 21,
    title: "Practice with Real IELTS Listening Questions",
    image: "/module/image/ielts_listening3.jpg",
    description:
      "Attempt authentic IELTS listening tasks with explanations and audio.",
    duration_minutes: 150,  // 2.5 hours * 60
    status: "active",
  },

  // Session 22
  {
    course_id: 5,
    session_id: 22,
    title: "Overview of IELTS Reading Test",
    image: "/module/image/ielts_reading1.jpg",
    description:
      "Understand the difference between Academic and General Training reading tests, question types, and scoring.",
    duration_minutes: 60,  // 1 hour * 60
    status: "active",
  },
  {
    course_id: 5,
    session_id: 22,
    title: "Skimming, Scanning & Reading Strategies",
    image: "/module/image/ielts_reading2.jpg",
    description:
      "Learn fast-reading techniques to locate answers effectively within time limits.",
    duration_minutes: 90,  // 1.5 hours * 60
    status: "active",
  },
  {
    course_id: 5,
    session_id: 22,
    title: "Solving All IELTS Reading Question Types",
    image: "/module/image/ielts_reading3.jpg",
    description:
      "Practice with multiple question types like matching headings, True/False/Not Given, and multiple choice.",
    duration_minutes: 120,  // 2 hours * 60
    status: "active",
  },

  // Session 23
  {
    course_id: 5,
    session_id: 23,
    title: "Understanding IELTS Writing Tasks",
    image: "/module/image/ielts_writing1.jpg",
    description:
      "Explore the format of Task 1 and Task 2 in both Academic and General Training.",
    duration_minutes: 60,  // 1 hour * 60
    status: "active",
  },
  {
    course_id: 5,
    session_id: 23,
    title: "Writing Task 1: Reports and Letters",
    image: "/module/image/ielts_writing2.jpg",
    description:
      "Learn how to write effective Task 1 responses including data reports and formal/informal letters.",
    duration_minutes: 90,  // 1.5 hours * 60
    status: "active",
  },
  {
    course_id: 5,
    session_id: 23,
    title: "Writing Task 2: Opinion and Discussion Essays",
    image: "/module/image/ielts_writing3.jpg",
    description:
      "Understand essay structures, idea development, and argument coherence for high band scores.",
    duration_minutes: 120,  // 2 hours * 60
    status: "active",
  },
  {
    course_id: 5,
    session_id: 23,
    title: "Grammar and Vocabulary for IELTS Writing",
    image: "/module/image/ielts_writing4.jpg",
    description:
      "Enhance your grammar range and vocabulary with specific examples and exercises for writing tasks.",
    duration_minutes: 60,  // 1 hour * 60
    status: "active",
  },

  // Session 24
  {
    course_id: 5,
    session_id: 24,
    title: "Introduction to IELTS Speaking Format",
    image: "/module/image/ielts_speaking1.jpg",
    description:
      "Learn about the structure and timing of Part 1, Part 2, and Part 3 of the IELTS Speaking test.",
    duration_minutes: 60,  // 1 hour * 60
    status: "active",
  },
  {
    course_id: 5,
    session_id: 24,
    title: "Fluency and Coherence in Speaking",
    image: "/module/image/ielts_speaking2.jpg",
    description:
      "Techniques to speak fluently, avoid pauses, and connect ideas naturally.",
    duration_minutes: 60,  // 1 hour * 60
    status: "active",
  },
  {
    course_id: 5,
    session_id: 24,
    title: "Answering Part 1, 2, and 3 Effectively",
    image: "/module/image/ielts_speaking3.jpg",
    description:
      "Practice sample questions with model answers and breakdowns for all parts.",
    duration_minutes: 2 * 60,
    status: "active",
  },
  {
    course_id: 5,
    session_id: 24,
    title: "Pronunciation and Lexical Resource",
    image: "/module/image/ielts_speaking4.jpg",
    description:
      "Improve pronunciation and use topic-related vocabulary for higher scores.",
    duration_minutes: 1 * 60,
    status: "active",
  },
];

const jsIntroHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Introduction to JavaScript</title>
    <style>
        .js-guide {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #fdfdfd;
            color: #2c3e50;
            max-width: 1200px;
            margin: 0 auto;
            padding: 30px;
        }
        .js-guide header {
            background: linear-gradient(to right, #f39c12, #f1c40f);
            color: #fff;
            padding: 25px;
            border-radius: 8px;
            text-align: center;
        }
        .js-guide h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .js-guide h2 {
            font-size: 1.8em;
            color: #d35400;
            border-bottom: 2px solid #f39c12;
            padding-bottom: 6px;
            margin-top: 50px;
        }
        .js-guide section {
            background-color: #ffffff;
            padding: 20px 25px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.08);
            margin-top: 30px;
        }
        .js-guide ul {
            padding-left: 20px;
        }
        .js-guide li {
            margin-bottom: 10px;
        }
        .js-guide footer {
            text-align: center;
            margin-top: 60px;
            padding: 20px;
            font-size: 0.9em;
            color: #7f8c8d;
        }
    </style>
</head>
<body>
    <div class="js-guide">
        <header>
            <h1>Introduction to JavaScript</h1>
            <p>Your gateway to dynamic and interactive web development</p>
        </header>

        <section>
            <h2>What is JavaScript?</h2>
            <p>JavaScript is a versatile, high-level programming language and a core technology of the web, alongside HTML and CSS. It was originally designed to make web pages interactive, but it has since grown into a robust language used across the web—from front-end interfaces to back-end servers.</p>
        </section>

        <section>
            <h2>Key Features of JavaScript</h2>
            <ul>
                <li><strong>Lightweight and Interpreted:</strong> Runs directly in the browser without requiring compilation.</li>
                <li><strong>First-Class Functions:</strong> Functions are treated like any other variable—passed, returned, or assigned.</li>
                <li><strong>Event-Driven:</strong> Designed to respond to user events like clicks, form inputs, and keyboard actions.</li>
                <li><strong>Versatile Use:</strong> Works both on the client-side (browser) and server-side (Node.js).</li>
                <li><strong>Rich Ecosystem:</strong> Offers powerful libraries and frameworks like React, Vue, and Angular.</li>
            </ul>
        </section>

        <section>
            <h2>Why Learn JavaScript?</h2>
            <p>JavaScript is the foundation of modern web development. It powers almost every interactive experience online. Whether you're building responsive websites, real-time applications, mobile apps, or even games—JavaScript is essential.</p>
        </section>

        <section>
            <h2>Common Use Cases</h2>
            <ul>
                <li>Creating interactive websites with live content updates.</li>
                <li>Building Single-Page Applications (SPAs) using frameworks like React or Vue.</li>
                <li>Developing back-end services using Node.js.</li>
                <li>Creating cross-platform mobile apps via React Native.</li>
                <li>Developing browser-based games with engines like Phaser.</li>
            </ul>
        </section>

        <section>
            <h2>Conclusion</h2>
            <p>JavaScript is a powerful tool that continues to evolve alongside the web. Mastering JavaScript opens up endless possibilities for creating modern digital experiences. Start learning today to become a part of the exciting world of programming and innovation!</p>
        </section>

        <footer>
            &copy; 2025 E-Learn Platform | Designed for curious minds worldwide.
        </footer>
    </div>
</body>
</html>
`;

const topics = [
  // SESSION 1: Introduction to IELTS and Course Overview
  // Module 1 - IELTS Test Format Overview
  {
    module_id: 39,
    title: "IELTS Test Overview",
    description:
      "An introduction video explaining the IELTS format and purpose.",
    content_type: "video",
    video: {
      url: "/video/ielts_overview.mp4",
      duration_minutes: 8,
      transcript: "The IELTS exam tests four skills...",
      audio_url: "/audio/ielts_overview_audio.mp3",
      bullet_points: [
        { time: 0, text: "Test Structure" },
        { time: 120, text: "Academic vs General Training" },
      ],
    },
  },
  {
    module_id: 39,
    title: "IELTS Test Sections Details",
    description: "Learn about the four parts of the IELTS exam.",
    content_type: "accordian",
    accordions: [
      {
        title: "Listening",
        body: "The Listening section consists of four recordings featuring a mix of conversations and monologues. You'll answer 40 questions that test your ability to understand main ideas, specific facts, and the speaker's opinions.",
        codeLanguage: "text",
        code: "",
        audio_url: "/audios/accordion/listening.mp3",
      },
      {
        title: "Reading",
        body: "The Reading section includes three texts, each followed by a set of questions. You'll be tested on reading for gist, details, inferences, and understanding logical arguments across 40 questions in total.",
        codeLanguage: "text",
        code: "",
        audio_url: "/audios/accordion/reading.mp3",
      },
      {
        title: "Writing",
        body: "This section has two tasks: Task 1 requires you to describe visual information, while Task 2 involves writing an essay in response to an argument or problem. You must manage your time well within 60 minutes.",
        codeLanguage: "text",
        code: "",
        audio_url: "/audios/accordion/writing.mp3",
      },
      {
        title: "Speaking",
        body: "The Speaking test is a face-to-face interview divided into three parts: introduction and interview, a long turn on a topic, and a two-way discussion. It assesses fluency, pronunciation, vocabulary, and grammar.",
        codeLanguage: "text",
        code: "",
        audio_url: "/audios/accordion/speaking.mp3",
      },
    ],
  },
  {
    module_id: 39,
    title: "IELTS Format Guide PDF",
    description: "Downloadable reference guide with details on IELTS format.",
    content_type: "general",
    general: {
      title: "IELTS Format PDF",
      description: "Overview of the IELTS test structure.",
      url: "/material/pdf/ielts_format.pdf",
      audio_url: "/audios/general/ielts_pdf_audio.mp3",
      material_type: "pdf",
    },
  },

  // Module 2 - Assessment and Goal Setting
  {
    module_id: 40,
    title: "Diagnostic Test Introduction",
    description:
      "Understand the purpose and structure of the IELTS diagnostic test.",
    content_type: "video",
    video: {
      url: "/video/ielts_diagnostic_intro.mp4",
      duration_minutes: 8,
      transcript: "This video explains how to take the diagnostic test...",
      audio_url: "/audios/video/ielts_diagnostic_intro.mp3",
      bullet_points: [
        { time: 0, text: "Purpose of Diagnostic Test" },
        { time: 120, text: "How It Helps in Goal Setting" },
      ],
    },
  },
  {
    module_id: 40,
    title: "Understanding the IELTS Band Score System",
    description: "Learn how IELTS scores are calculated and interpreted.",
    content_type: "audio",
    audio: {
      url: "/audio/ielts_band_score_system.mp3",
      duration_minutes: 6,
    },
  },
  {
    module_id: 40,
    title: "Setting Personal Goals",
    description:
      "Learn how to analyze your diagnostic test results and set SMART goals.",
    content_type: "slide",
    slides: [
      {
        title: "Analyze Your Scores",
        description:
          "Understand how to interpret your diagnostic results and identify strengths and weaknesses.",
        content_type: "video",
        video: {
          url: "/multiSlide/video/score_analysis.mp4",
          duration_minutes: 3,
          audio_url: "/audios/slide_video/score_analysis.mp3",
        },
      },
      // {
      //   title: "Set SMART Goals",
      //   description:
      //     "Learn how to set Specific, Measurable, Achievable, Relevant, and Time-bound goals.",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/smart_goals.mp3",
      //     duration_minutes: 4,
      //   },
      // },
    ],
  },

  // Module 3 - Effective Study Strategies
  {
    module_id: 41,
    title: "Introduction to Study Strategies",
    description:
      "Understand the importance of adopting effective study habits for IELTS preparation.",
    content_type: "video",
    video: {
      url: "/video/study_strategies_intro.mp4",
      duration_minutes: 7,
      transcript:
        "This video introduces the value of strategic studying for IELTS success...",
      audio_url: "/audios/video/study_strategies_intro.mp3",
      bullet_points: [
        { time: 0, text: "Why Study Strategies Matter" },
        { time: 90, text: "How They Impact IELTS Performance" },
      ],
    },
  },
  {
    module_id: 41,
    title: "Time Management Techniques",
    description:
      "Learn how to effectively manage your preparation time and avoid burnout.",
    content_type: "general",
    general: {
      title: "IELTS Study Planner",
      description:
        "A comprehensive weekly planning template to balance all four IELTS skills with anti-procrastination techniques.",
      url: "/material/pdf/ielts_study_planner.pdf",
      audio_url: "/audios/general/time_management_overview.mp3",
      // normalized: unsupported 'worksheet' -> 'pdf'
      material_type: "pdf",
    },
  },
  {
    module_id: 41,
    title: "Study Strategy Reference Sheet",
    description:
      "Download a quick-reference sheet summarizing top IELTS study strategies.",
    content_type: "general",
    general: {
      title: "Study Strategies PDF",
      description: "Key tips and tricks in a single, printable page.",
      url: "/material/pdf/study_strategies_reference.pdf",
      audio_url: "/audios/general/study_strategies_reference.mp3",
      material_type: "pdf",
    },
  },

  // SESSION 2: IELTS Listening
  // Module 4 - Understanding IELTS Listening Format
  {
    module_id: 42,
    title: "Overview of the IELTS Listening Test",
    description:
      "Understand the overall structure, timing, and scoring of the IELTS Listening section.",
    content_type: "video",
    video: {
      url: "/video/listening_overview.mp4",
      duration_minutes: 6,
      transcript:
        "The IELTS Listening test includes four sections totaling around 30 minutes...",
      audio_url: "/audios/video/listening_overview.mp3",
      bullet_points: [
        { time: 0, text: "Structure of Listening Test" },
        { time: 150, text: "Types of Audio Recordings" },
        { time: 300, text: "Scoring System Overview" },
      ],
    },
  },
  {
    module_id: 42,
    title: "Listening Skills Required",
    description:
      "Learn the key listening skills tested in IELTS: gist, specific information, opinion, and attitude.",
    content_type: "accordian",
    accordions: [
      {
        title: "Listening for Gist",
        body: "Focus on understanding the overall idea or purpose of a conversation or monologue, rather than specific details. This helps you grasp the context and main message quickly.",
        codeLanguage: "text",
        code: "",
        audio_url: "/audios/accordion/gist_listening.mp3",
      },
      {
        title: "Listening for Specifics",
        body: "Pay close attention to particular information such as names, dates, numbers, places, and facts. This skill is crucial for answering detail-based questions accurately.",
        codeLanguage: "text",
        code: "",
        audio_url: "/audios/accordion/specific_info.mp3",
      },
    ],
  },

  // Module 5 - Strategies for Each Listening Section
  {
    module_id: 43,
    title: "Strategy for Sections 1 & 2",
    description: "Techniques for everyday conversations and monologues.",
    content_type: "audio",
    audio: {
      url: "/audio/strategy_sections1_2.mp3",
      duration_minutes: 7,
    },
  },
  {
    module_id: 43,
    title: "Strategy for Sections 3 & 4",
    description:
      "Learn how to follow multi-speaker conversations and academic lectures.",
    content_type: "slide",
    slides: [
      {
        title: "Identifying Speaker Viewpoints",
        description:
          "Techniques to track who is saying what and their opinions.",
        content_type: "video",
        video: {
          url: "/multiSlide/video/speaker_viewpoints.mp4",
          duration_minutes: 4,
          audio_url: "/audios/slide_video/viewpoints.mp3",
        },
      },
      // {
      //   title: "Academic Lecture Listening",
      //   description:
      //     "How to extract key points and follow the logical structure of lectures.",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/academic_lectures.mp3",
      //     duration_minutes: 3,
      //   },
      // },
    ],
  },

  // Module 6 - Practice with Real IELTS Listening Questions
  {
    module_id: 44,
    title: "Practice Test - All Sections",
    description: "Simulate test conditions with real-style audio and format.",
    content_type: "video",
    video: {
      url: "/video/listening_practice_full.mp4",
      duration_minutes: 15,
      transcript:
        "This practice test simulates typical IELTS Listening test conditions...",
      audio_url: "/audios/video/listening_practice_full.mp3",
      bullet_points: [
        { time: 0, text: "Practice Test Instructions" },
        { time: 30, text: "Full Test Audio" },
        { time: 900, text: "Check Your Answers" },
      ],
    },
  },
  {
    module_id: 44,
    title: "Self-Assessment Guide",
    description:
      "Learn how to review your listening performance for improvement.",
    content_type: "general",
    general: {
      title: "Listening Self-Assessment Form",
      description:
        "A structured form to analyze your listening test performance and track progress over time.",
      url: "/material/pdf/listening_self_assessment.pdf",
      audio_url: "/audios/general/assessment_guide_overview.mp3",
      // normalized: unsupported 'assessment-tool' -> 'other'
      material_type: "other",
    },
  },

  // SESSION 3: IELTS Reading
  // Module 7 - Overview of IELTS Reading Test
  {
    module_id: 45,
    title: "Academic vs General Reading Test",
    description:
      "Understand key differences in text type, difficulty, and expectations.",
    content_type: "slide",
    slides: [
      {
        title: "Academic Test",
        description: "3 long texts from books, journals, newspapers",
        content_type: "video",
        video: {
          url: "/multiSlide/video/academic_test.mp4",
          duration_minutes: 5,
          audio_url: "/audios/slide_video/jsAudioyt.mp3",
        },
      },
      // {
      //   title: "General Training",
      //   description: "Extracts from notices, ads, company handbooks",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/academic_test.mp3",
      //     duration_minutes: 3,
      //   },
      // },
    ],
  },
  {
    module_id: 45,
    title: "Reading Test Format and Timing",
    description:
      "Know the number of questions, time limits, and overall test structure.",
    content_type: "video",
    video: {
      url: "/video/reading_format.mp4",
      duration_minutes: 4,
      transcript:
        "The IELTS Reading test lasts 60 minutes and includes 40 questions...",
      audio_url: "/audios/video/reading_format.mp3",
      bullet_points: [
        { time: 0, text: "Reading Timing and Sections" },
        { time: 90, text: "Question Types Overview" },
        { time: 240, text: "Scoring and Band Interpretation" },
      ],
    },
  },

  // Module 8 - Skimming, Scanning & Reading Strategies
  {
    module_id: 46,
    title: "Skimming Techniques",
    description: "Learn how to quickly understand the main idea of a passage.",
    content_type: "video",
    video: {
      url: "/video/skimming.mp4",
      duration_minutes: 3.5,
      transcript: "Skimming means reading quickly to grasp the general idea...",
      audio_url: "/audios/video/skimming.mp3",
      bullet_points: [
        { time: 0, text: "When to Skim" },
        { time: 100, text: "How to Skim Efficiently" },
      ],
    },
  },
  {
    module_id: 46,
    title: "Scanning Techniques",
    description: "Identify specific information quickly using scanning skills.",
    content_type: "slide",
    slides: [
      {
        title: "What is Scanning?",
        description:
          "A technique used to find specific information like names, numbers, or keywords without reading everything.",
        content_type: "video",
        video: {
          url: "/multiSlide/video/scanning_basics.mp4",
          duration_minutes: 3,
          audio_url: "/audios/slide_video/scanning_basics.mp3",
        },
      },
      // {
      //   title: "When to Use Scanning",
      //   description:
      //     "Ideal for questions about dates, places, names, or statistics.",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/scanning_usecase.mp3",
      //     duration_minutes: 2,
      //   },
      // },
    ],
  },

  // Module 9 - Solving All IELTS Reading Question Types
  {
    module_id: 47,
    title: "Multiple Choice & Matching Headings",
    description:
      "Techniques and examples to tackle mcqs and heading-matching questions.",
    content_type: "video",
    video: {
      url: "/video/mcq_heading.mp4",
      duration_minutes: 6,
      transcript:
        "Matching headings tests your understanding of paragraph-level main ideas...",
      audio_url: "/audios/video/mcq_heading.mp3",
      bullet_points: [
        { time: 0, text: "How to Tackle mcqs" },
        { time: 180, text: "Matching Headings Strategy" },
      ],
    },
  },
  {
    module_id: 47,
    title: "True / False / Not Given",
    description:
      "Learn to differentiate between what's stated, implied, or missing.",
    content_type: "general",
    general: {
      title: "TFNG Decision Tree Guide",
      description:
        "A step-by-step flowchart to help you correctly identify True, False, and Not Given statements with practice examples.",
      url: "/material/pdf/tfng_decision_tree.pdf",
      audio_url: "/audios/general/tfng_overview.mp3",
      // normalized: unsupported 'reference-guide' -> 'pdf'
      material_type: "pdf",
    },
  },

  // SESSION 4: IELTS Writing
  // Module 10 - Understanding IELTS Writing Tasks
  {
    module_id: 48,
    title: "Overview of Writing Tasks",
    description:
      "Understand the format, requirements, and differences between Academic and General Training writing tasks.",
    content_type: "video",
    video: {
      url: "/video/writing_tasks_overview.mp4",
      duration_minutes: 7,
      transcript:
        "The IELTS Writing test consists of two tasks with different requirements for Academic and General Training...",
      audio_url: "/audios/video/writing_tasks_overview.mp3",
      bullet_points: [
        { time: 0, text: "Writing Test Structure" },
        { time: 120, text: "Academic vs General Training" },
        { time: 240, text: "Time Management Strategy" },
      ],
    },
  },
  {
    module_id: 48,
    title: "IELTS Writing Assessment Criteria",
    description:
      "Learn how examiners score your writing based on the four key criteria.",
    content_type: "slide",
    slides: [
      {
        title: "Task Achievement/Response",
        description:
          "How well you address all parts of the task and develop your ideas.",
        content_type: "video",
        video: {
          url: "/multiSlide/video/task_achievement.mp4",
          duration_minutes: 4,
          audio_url: "/audios/slide_video/task_achievement.mp3",
        },
      },
      {
        title: "Coherence and Cohesion",
        description:
          "How well your ideas flow logically and how effectively you use linking words.",
        content_type: "video",
        video: {
          url: "/multiSlide/video/coherence_cohesion.mp4",
          duration_minutes: 3,
          audio_url: "/audios/slide_video/coherence_cohesion.mp3",
        },
      },
      // {
      //   title: "Lexical Resource",
      //   description:
      //     "The range and accuracy of your vocabulary and word choice.",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/lexical_resource.mp3",
      //     duration_minutes: 3,
      //   },
      // },
    ],
  },

  // Module 11 - Writing Task 1: Reports and Letters
  {
    module_id: 49,
    title: "Academic Task 1: Data Reports",
    description:
      "Learn how to describe and analyze charts, graphs, tables, and diagrams.",
    content_type: "video",
    video: {
      url: "/video/academic_task1.mp4",
      duration_minutes: 8,
      transcript:
        "Academic Task 1 requires you to summarize and describe visual information...",
      audio_url: "/audios/video/academic_task1.mp3",
      bullet_points: [
        { time: 0, text: "Understanding Different Chart Types" },
        { time: 120, text: "Describing Trends and Comparisons" },
        { time: 240, text: "Report Structure and Format" },
      ],
    },
  },
  {
    module_id: 49,
    title: "General Training Task 1: Letter Writing",
    description:
      "Learn how to write formal, semi-formal, and informal letters.",
    content_type: "accordian",
    accordions: [
      {
        title: "Formal Letters",
        body: "Learn to write letters to authorities, companies, or professionals using a respectful tone, clear structure, and formal language. Common scenarios include job applications, complaints, or official requests.",
        codeLanguage: "text",
        code: "",
        audio_url: "/audios/accordion/formal_letters.mp3",
      },
      {
        title: "Informal Letters",
        body: "Master the art of writing to friends or relatives using relaxed and conversational language. These letters often express personal news, invitations, thanks, or apologies in a friendly tone.",
        codeLanguage: "text",
        code: "",
        audio_url: "/audios/accordion/informal_letters.mp3",
      },
    ],
  },

  // Module 12 - Writing Task 2: Opinion and Discussion Essays
  {
    module_id: 50,
    title: "Understanding Task 2 Question Types",
    description:
      "Learn to identify the different types of essay questions and what they require.",
    content_type: "video",
    video: {
      url: "/video/task2_question_types.mp4",
      duration_minutes: 9,
      transcript:
        "IELTS Task 2 questions can be categorized into several types...",
      audio_url: "/audios/video/task2_question_types.mp3",
      bullet_points: [
        { time: 0, text: "Opinion Essays" },
        { time: 120, text: "Discussion Essays" },
        { time: 240, text: "Problem-Solution Essays" },
        { time: 360, text: "Advantage-Disadvantage Essays" },
      ],
    },
  },
  {
    module_id: 50,
    title: "Essay Structure and Organization",
    description:
      "Learn how to organize your ideas in a clear, logical structure.",
    content_type: "general",
    general: {
      title: "IELTS Essay Structure Template",
      description:
        "A comprehensive template with paragraph-by-paragraph guidance, sample transitions, and PEEL structure examples.",
      url: "/material/pdf/essay_structure_template.pdf",
      audio_url: "/audios/general/essay_structure_guide.mp3",
      // normalized: unsupported 'template' -> 'pdf'
      material_type: "pdf",
    },
  },

  // Module 13 - Grammar and Vocabulary for IELTS Writing
  {
    module_id: 51,
    title: "Grammar for IELTS Writing",
    description:
      "Learn about grammar structures that can improve your writing band score.",
    content_type: "video",
    video: {
      url: "/video/grammar_for_writing.mp4",
      duration_minutes: 8,
      transcript:
        "To achieve a high band score in grammar, you need to demonstrate a variety of structures...",
      audio_url: "/audios/video/grammar_for_writing.mp3",
      bullet_points: [
        { time: 0, text: "Complex Sentence Structures" },
        { time: 120, text: "Conditional Sentences" },
        { time: 240, text: "Passive Voice Usage" },
      ],
    },
  },
  {
    module_id: 51,
    title: "Vocabulary for Task 1 and Task 2",
    description:
      "Learn specialized vocabulary for describing data and writing essays.",
    content_type: "accordian",
    accordions: [
      {
        title: "Trend Description Vocabulary",
        body: "Build a strong vocabulary for describing graphs, charts, and tables in Task 1. Learn precise verbs and adjectives to express trends such as rises, falls, and fluctuations—e.g., increase sharply, remain stable, decline gradually.",
        codeLanguage: "text",
        code: "",
        audio_url: "/audios/accordion/trend_vocabulary.mp3",
      },
      {
        title: "Essay Topic Vocabulary",
        body: "Expand your lexical resource for Task 2 essays. Gain essential vocabulary for frequently tested themes like climate change, online learning, healthcare, and technology to write with clarity and sophistication.",
        codeLanguage: "text",
        code: "",
        audio_url: "/audios/accordion/essay_topic_vocabulary.mp3",
      },
    ],
  },

  // SESSION 5: IELTS Speaking
  // Module 14 - Introduction to IELTS Speaking Format
  {
    module_id: 52,
    title: "Understanding the Speaking Test Structure",
    description:
      "Learn about the format, timing, and expectations of the three-part IELTS Speaking test.",
    content_type: "video",
    video: {
      url: "/video/speaking_test_structure.mp4",
      duration_minutes: 7,
      transcript:
        "The IELTS Speaking test is divided into three parts and takes between 11-14 minutes total...",
      audio_url: "/audios/video/speaking_test_structure.mp3",
      bullet_points: [
        { time: 0, text: "Overview of the Speaking Test" },
        { time: 120, text: "Part 1: Introduction and Interview" },
        { time: 240, text: "Part 2: Individual Long Turn" },
        { time: 360, text: "Part 3: Two-way Discussion" },
      ],
    },
  },
  {
    module_id: 52,
    title: "IELTS Speaking Assessment Criteria",
    description:
      "Understand how examiners score your speaking performance using the four marking criteria.",
    content_type: "slide",
    slides: [
      {
        title: "Fluency and Coherence",
        description:
          "How well you can speak at a natural pace without too many hesitations, and how well you connect your ideas.",
        content_type: "video",
        video: {
          url: "/multiSlide/video/fluency_coherence.mp4",
          duration_minutes: 4,
          audio_url: "/audios/slide_video/fluency_coherence.mp3",
        },
      },
      // {
      //   title: "Lexical Resource",
      //   description:
      //     "The range of vocabulary you use and how appropriately you use it for the topics discussed.",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/lexical_resource_speaking.mp3",
      //     duration_minutes: 3,
      //   },
      // },
    ],
  },

  // Module 15 - Fluency and Coherence in Speaking
  {
    module_id: 53,
    title: "Developing Natural Fluency",
    description:
      "Learn techniques to speak more smoothly and reduce hesitation.",
    content_type: "video",
    video: {
      url: "/video/developing_fluency.mp4",
      duration_minutes: 8,
      transcript:
        "Fluency is about speaking at a natural pace without too many pauses or hesitations...",
      audio_url: "/audios/video/developing_fluency.mp3",
      bullet_points: [
        { time: 0, text: "Understanding Fluency" },
        { time: 120, text: "Reducing Hesitation" },
        { time: 240, text: "Techniques for Smooth Speech" },
      ],
    },
  },
  {
    module_id: 53,
    title: "Coherence: Connecting Your Ideas",
    description:
      "Learn how to link your ideas logically and use discourse markers effectively.",
    content_type: "accordian",
    accordions: [
      {
        title: "Using Discourse Markers",
        body: "Learn to use linking words and phrases like 'however', 'furthermore' and 'on the other hand' to organize your ideas clearly and logically. These connectors improve the flow and coherence of your writing and speaking.",
        codeLanguage: "text",
        code: "",
        audio_url: "/audios/accordion/discourse_markers.mp3",
      },
      {
        title: "Topic Development",
        body: "Discover how to expand your ideas by adding relevant examples, explanations, reasons, and personal experiences. This skill helps make your responses more complete and persuasive.",
        codeLanguage: "text",
        code: "",
        audio_url: "/audios/accordion/topic_development.mp3",
      },
    ],
  },

  // Module 16 - Answering Part 1, 2, and 3 Effectively
  {
    module_id: 54,
    title: "Part 1: Introduction and Interview Strategies",
    description:
      "Learn how to answer common Part 1 questions about familiar topics.",
    content_type: "video",
    video: {
      url: "/video/part1_strategies.mp4",
      duration_minutes: 6,
      transcript:
        "In Part 1, the examiner will ask you about familiar topics like your home, family, work or studies...",
      audio_url: "/audios/video/part1_strategies.mp3",
      bullet_points: [
        { time: 0, text: "Part 1 Format and Expectations" },
        { time: 90, text: "Question Types and Topics" },
        { time: 180, text: "Response Structure" },
      ],
    },
  },
  {
    module_id: 54,
    title: "Part 2: Individual Long Turn (Cue Card)",
    description:
      "Master the 2-minute talk with effective preparation and delivery techniques.",
    content_type: "general",
    general: {
      title: "Cue Card Preparation Framework",
      description:
        "A structured template for organizing your thoughts during the 1-minute preparation time, with sample notes and delivery techniques.",
      url: "/material/pdf/cue_card_framework.pdf",
      audio_url: "/audios/general/cue_card_prep.mp3",
      // normalized: unsupported 'framework' -> 'other'
      material_type: "other",
    },
  },

  // Module 17 - Pronunciation and Lexical Resource
  {
    module_id: 55,
    title: "Key Pronunciation Features",
    description:
      "Learn how to improve your pronunciation for a higher band score.",
    content_type: "video",
    video: {
      url: "/video/key_pronunciation.mp4",
      duration_minutes: 9,
      transcript:
        "Pronunciation in IELTS focuses on several key aspects including individual sounds, word stress, intonation...",
      audio_url: "/audios/video/key_pronunciation.mp3",
      bullet_points: [
        { time: 0, text: "Individual Sounds (Phonemes)" },
        { time: 120, text: "Word Stress Patterns" },
        { time: 240, text: "Sentence Stress and Rhythm" },
      ],
    },
  },
  {
    module_id: 55,
    title: "Building Advanced Vocabulary",
    description:
      "Expand your lexical resource with topic-specific vocabulary and expressions.",
    content_type: "audio",
    audio: {
      url: "/audio/advanced_vocabulary.mp3",
      duration_minutes: 7,
    },
  },
];

const basicTopics = [
  {
    module_id: 39,
    title: "Intro Video",
    description: "Learn JS basics via video",
    content_type: "video",
    video: {
      url: "/video/jsVideoTopic.mp4",
      duration_minutes: 10,
      transcript: "Welcome to JavaScript...",
      audio_url: "/audios/video/jsAudioyt.mp3",
      bullet_points: [
        { time: 0, text: "Variables" },
        { time: 60, text: "Functions" },
      ],
    },
  },
  {
    module_id: 39,
    title: "Getting Started with JS - Audio",
    description: "Introduction in audio form",
    content_type: "audio",
    audio: {
      url: "/audio/jsAudioyt.mp3",
      duration_minutes: 5,
    },
  },
  {
    module_id: 39,
    title: "JS Basics - Accordion",
    description: "Common JS concepts",
    content_type: "accordian",
    accordions: [
      {
        title: "Variables",
        body: "Variables hold values.",
        codeLanguage: "javascript",
        code: "let x = 5;",
        audio_url: "/audios/accordion/jsAudioyt.mp3",
      },
    ],
  },
  {
    module_id: 39,
    title: "JS Cheat Sheet",
    description: "Useful JS reference PDF",
    content_type: "general",
    general: {
      title: "Cheat Sheet",
      description: jsIntroHTML,
      url: "/material/pdf/js-cheatsheet.pdf",
      audio_url: "/audios/general/jsAudioyt.mp3",
      material_type: "pdf",
    },
  },
  {
    module_id: 39,
    title: "JS Multi-Slide Content",
    description: "A collection of slides with different content types",
    content_type: "slide",
    slides: [
      {
        title: "JS Variables Slide",
        description: "Learn about variables in JS",
        content_type: "video",
        video: {
          url: "/multiSlide/video/jsVideoTopicms.mp4",
          duration_minutes: 5,
          audio_url: "/audios/slide_video/jsAudioyt.mp3",
        },
      },
      // {
      //   title: "JS Functions Audio",
      //   description: "Listen about JS functions",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/jsAudioytms.mp3",
      //     duration_minutes: 3,
      //   },
      // },
      {
        title: "JS Objects Accordion",
        description: "Explore JS objects",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/slideAudioUrl[2].mp3",
        accordions: [
          {
            title: "Object Basics",
            body: "Objects are collections of key-value pairs.",
            codeLanguage: "javascript",
            code: "const person = { name: 'John' };",
            audio_url: "/audios/slide_accordion/jsAudioyt.mp3",
          },
          {
            title: "Object Methods",
            body: "Objects can have functions as properties.",
            codeLanguage: "javascript",
            code: "const person = { greet() { console.log('Hello'); } };",
            audio_url: "/audios/slide_accordion/jsAudioyt.mp3",
          },
        ],
      },
      // {
      //   title: "JS Cheat Sheet PDF",
      //   description: jsIntroHTML,
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/slideAudioUrl[3].mp3",
      //   general: {
      //     title: "JS Cheat Sheet",
      //     description: "Quick reference for JavaScript",
      //     url: "/multiSlide/general/pdf/js-cheatsheetms.pdf",
      //     audio_url: "/audios/slide_general/jsAudioyt.mp3",
      //     material_type: "pdf",
      //   },
      // },
    ],
  },
];

const functionTopics = [
  {
    module_id: 40,
    title: "Function Basics - Video",
    description: "Learn how to define and use functions in JavaScript.",
    content_type: "video",
    video: {
      url: "/video/jsFunctionIntro.mp4",
      duration_minutes: 8,
      transcript: "In this video, we explore how to define functions...",
      audio_url: "/audios/video/jsAudioyt.mp3",
      bullet_points: [
        { time: 0, text: "Function Declaration" },
        { time: 120, text: "Function Invocation" },
      ],
    },
  },
  {
    module_id: 40,
    title: "Function Types - Accordion",
    description: "Different ways to declare functions in JS.",
    content_type: "accordian",
    accordions: [
      {
        title: "Function Declaration",
        body: "Traditional way to declare a function.",
        codeLanguage: "javascript",
        code: "function greet() { console.log('Hello!'); }",
        audio_url: "/audios/accordion/jsAudioyt.mp3",
      },
      {
        title: "Function Expression",
        body: "Assigning a function to a variable.",
        codeLanguage: "javascript",
        code: "const greet = function() { console.log('Hi!'); };",
        audio_url: "/audios/accordion/jsAudioyt.mp3",
      },
      {
        title: "Arrow Function",
        body: "Concise syntax introduced in ES6.",
        codeLanguage: "javascript",
        code: "const greet = () => console.log('Hey!');",
        audio_url: "/audios/accordion/jsAudioyt.mp3",
      },
    ],
  },
  {
    module_id: 40,
    title: "Scope & Hoisting - Audio",
    description: "Learn about scope and how hoisting works in JS.",
    content_type: "audio",
    audio: {
      url: "/audio/jsAudioyt.mp3",
      duration_minutes: 6,
    },
  },
  {
    module_id: 40,
    title: "Function Scope PDF",
    description: "Quick guide to function scope, block scope, and hoisting.",
    content_type: "general",
    general: {
      title: "Scope Reference",
      description: "All you need to know about scope in JS.",
      url: "/material/pdf/js-cheatsheet.pdf",
      audio_url: "/audios/general/jsAudioyt.mp3",
      material_type: "pdf",
    },
  },
  {
    module_id: 40,
    title: "Functions & Scope - Multi-Slide Content",
    description: "Mixed media content for better understanding.",
    content_type: "slide",
    slides: [
      {
        title: "Function Structure",
        description: "How to structure functions properly.",
        content_type: "video",
        video: {
          url: "/multiSlide/video/jsFunctionIntroms.mp4",
          duration_minutes: 4,
          audio_url: "/audios/slide_video/jsAudioyt.mp3",
        },
      },
      // {
      //   title: "Lexical Scope",
      //   description: "How scope is determined in JS.",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/jsAudioytms.mp3",
      //     duration_minutes: 3,
      //   },
      // },
      {
        title: "Block Scope Example",
        description: "Explore block scope using let and const.",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/slideAudioUrl[2].mp3",
        accordions: [
          {
            title: "Block Scope Basics",
            body: "`let` and `const` are block-scoped.",
            codeLanguage: "javascript",
            code: "if (true) { let x = 10; console.log(x); }",
            audio_url: "/audios/slide_accordion/jsAudioyt.mp3",
          },
          {
            title: "Global vs Local Scope",
            body: "Variables declared outside functions are global.",
            codeLanguage: "javascript",
            code: "let a = 5; function foo() { let b = 10; }",
            audio_url: "/audios/slide_accordion/jsAudioyt.mp3",
          },
        ],
      },
      // {
      //   title: "Scope PDF",
      //   description: "In-depth PDF on all types of scope in JS.",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/slideAudioUrl[2].mp3",
      //   general: {
      //     title: "Advanced Scope Guide",
      //     description: "Closures, lexical scope, and more.",
      //     url: "/multiSlide/general/pdf/js-cheatsheetms.pdf",
      //     material_type: "pdf",
      //     audio_url: "/audios/slide_general/jsAudioyt.mp3",
      //   },
      // },
    ],
  },
];

const assignments = [
  // Session 1: IELTS Test Format Overview
  // {
  //   module_id: 39,
  //   title: "IELTS Format Quiz",
  //   description:
  //     "Test your understanding of the IELTS exam structure and format",
  //   file: "/assignments/file/ielts-format-guide.pdf",
  //   due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
  //   max_score: 50,
  //   status: "active",
  //   category: "true_false",
  //   created_by_type: "admin",
  //   updated_by_type: "admin",
  //   true_false_questions: [
  //     {
  //       question_text: "The IELTS Listening test has three sections",
  //       correct_answer: false,
  //     },
  //     {
  //       question_text:
  //         "The Academic and General Training IELTS Writing tests have different Task 1 requirements",
  //       correct_answer: true,
  //     },
  //     {
  //       question_text:
  //         "The IELTS Speaking test is conducted with a group of candidates",
  //       correct_answer: false,
  //     },
  //     {
  //       question_text:
  //         "Both Academic and General Training Reading tests contain 40 questions",
  //       correct_answer: true,
  //     },
  //     {
  //       question_text: "The IELTS test results are valid for 3 years",
  //       correct_answer: false,
  //     },
  //   ],
  // },
  {
    module_id: 39,
    title: "IELTS Test Components Matching",
    description: "Match each IELTS test component with its correct description",
    file: null,
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    max_score: 40,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text:
          "Match each IELTS component with its correct description",
        options: [
          {
            option_text: "Listening Test",
            option_type: "text",
            match_text:
              "Contains 4 sections with 40 questions completed in 30 minutes",
            match_type: "text",
          },
          {
            option_text: "Academic Reading",
            option_type: "text",
            match_text: "3 long texts from books, journals, and newspapers",
            match_type: "text",
          },
          {
            option_text: "General Training Reading",
            option_type: "text",
            match_text:
              "Sections containing texts from notices, advertisements, and company handbooks",
            match_type: "text",
          },
          {
            option_text: "Academic Writing Task 1",
            option_type: "text",
            match_text: "Describing visual information like graphs or charts",
            match_type: "text",
          },
          {
            option_text: "Speaking Test",
            option_type: "text",
            match_text:
              "A face-to-face interview lasting 11-14 minutes with three parts",
            match_type: "text",
          },
        ],
      },
    ],
  },
  {
    module_id: 39,
    title: "IELTS Band Scores Analysis",
    description: "Analyze the IELTS band score system and assessment criteria",
    file: null,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    max_score: 60,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph:
          "Explain what each band score (1-9) represents in the IELTS scoring system and provide examples of the language proficiency expected at band scores 6, 7, and 8.",
      },
    ],
  },

  // Session 1: Assessment and Goal Setting
  {
    module_id: 40,
    title: "Personal IELTS Goals Worksheet",
    description:
      "Set realistic IELTS goals based on your diagnostic test results",
    file: "/assignments/file/ielts-goal-setting-template.pdf",
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    max_score: 50,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph:
          "Based on your diagnostic test results, identify your current band score level for each skill (Listening, Reading, Writing, Speaking). Then set specific, measurable goals for improvement in each area, including target scores and timeframe.",
      },
    ],
  },
  {
    module_id: 40,
    title: "IELTS Requirements Research",
    description:
      "Research and document the IELTS requirements for your target institutions or organizations",
    file: null,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    max_score: 40,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // Session 1: Effective Study Strategies
  {
    module_id: 41,
    title: "Study Plan Creation",
    description:
      "Create a personalized IELTS study plan based on your diagnostic results and goals",
    file: "/assignments/file/ielts-study-plan-template.pdf",
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    max_score: 50,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 41,
    title: "Study Strategies Fill-in-the-Blanks",
    description: "Complete sentences about effective IELTS study strategies",
    file: null,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    max_score: 30,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text:
          "The recommended daily study time for IELTS preparation is at least _____ minutes.",
        answers: ["60"],
      },
      {
        question_text:
          "When studying vocabulary, it's most effective to learn words in _____ rather than isolated lists.",
        answers: ["context"],
      },
      {
        question_text:
          "The _____ technique involves studying for focused periods followed by short breaks.",
        answers: ["Pomodoro"],
      },
      {
        question_text:
          "_____ practice is when you recreate test conditions exactly as they will be on exam day.",
        answers: ["Mock"],
      },
    ],
  },

  // Session 2: Understanding IELTS Listening Format
  {
    module_id: 42,
    title: "Listening Section Types Quiz",
    description:
      "Test your understanding of the four sections in the IELTS Listening test",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    max_score: 40,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text:
          "Match each IELTS Listening section with its correct description",
        options: [
          {
            option_text: "Section 1",
            option_type: "text",
            match_text:
              "A conversation between two people in an everyday social context",
            match_type: "text",
          },
          {
            option_text: "Section 2",
            option_type: "text",
            match_text: "A monologue set in an everyday social context",
            match_type: "text",
          },
          {
            option_text: "Section 3",
            option_type: "text",
            match_text:
              "A conversation between up to four people in an educational or training context",
            match_type: "text",
          },
          {
            option_text: "Section 4",
            option_type: "text",
            match_text: "A monologue on an academic subject",
            match_type: "text",
          },
        ],
      },
    ],
  },
  // {
  //   module_id: 42,
  //   title: "Listening Question Types Analysis",
  //   description:
  //     "Identify and analyze different question types in the IELTS Listening test",
  //   file: "/assignments/file/ielts-listening-questions-guide.pdf",
  //   due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
  //   max_score: 50,
  //   status: "active",
  //   category: "true_false",
  //   created_by_type: "admin",
  //   updated_by_type: "admin",
  //   true_false_questions: [
  //     {
  //       question_text:
  //         "Form completion questions in the Listening test require you to write more than three words",
  //       correct_answer: false,
  //     },
  //     {
  //       question_text:
  //         "Multiple choice questions in the Listening test always have three possible answers",
  //       correct_answer: false,
  //     },
  //     {
  //       question_text:
  //         "You can preview questions before each listening section begins",
  //       correct_answer: true,
  //     },
  //     {
  //       question_text:
  //         "Spelling mistakes are acceptable as long as the answer is recognizable",
  //       correct_answer: false,
  //     },
  //     {
  //       question_text:
  //         "The recording is played only once during the actual IELTS test",
  //       correct_answer: true,
  //     },
  //   ],
  // },

  // Session 2: Strategies for Each Listening Section
  {
    module_id: 43,
    title: "Listening Strategy Application",
    description:
      "Apply specific strategies to IELTS Listening practice questions",
    file: "/assignments/file/ielts-listening-strategies.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    max_score: 60,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 43,
    title: "Listening Note-Taking Techniques",
    description:
      "Practice effective note-taking strategies for the IELTS Listening test",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    max_score: 40,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph:
          "Describe three effective note-taking techniques for IELTS Listening. For each technique, explain how it works and provide an example of when it would be most useful during the test.",
      },
    ],
  },

  // Session 2: Practice with Real IELTS Listening Questions
  {
    module_id: 44,
    title: "Mini Listening Test Practice",
    description:
      "Complete a mini IELTS Listening test with authentic questions",
    file: "/assignments/file/ielts-mini-listening-test.pdf",
    due_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
    max_score: 80,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 44,
    title: "Listening Answer Analysis",
    description:
      "Analyze your listening test answers to identify patterns of mistakes",
    file: null,
    due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    max_score: 40,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph:
          "After completing your listening practice test, identify the types of questions where you made mistakes. Analyze patterns in your errors and describe specific strategies you will use to improve in these areas.",
      },
    ],
  },
  {
    module_id: 44,
    title: "Pronunciation and Accent Recognition",
    description:
      "Practice recognizing different accents and pronunciation in IELTS Listening",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    max_score: 30,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match each accent with its characteristic features",
        options: [
          {
            option_text: "British English",
            option_type: "text",
            match_text: "Non-rhotic accent, emphasis on intonation",
            match_type: "text",
          },
          {
            option_text: "American English",
            option_type: "text",
            match_text: "Rhotic accent, flapped 't' sounds",
            match_type: "text",
          },
          {
            option_text: "Australian English",
            option_type: "text",
            match_text:
              "Rising intonation at sentence ends, distinctive vowel sounds",
            match_type: "text",
          },
          {
            option_text: "Canadian English",
            option_type: "text",
            match_text:
              "Mix of American and British features with unique vocabulary",
            match_type: "text",
          },
        ],
      },
    ],
  },

  // Session 3: Overview of IELTS Reading Test
  // {
  //   module_id: 45,
  //   title: "Reading Format Comparison",
  //   description: "Compare Academic and General Training Reading tests",
  //   file: null,
  //   due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
  //   max_score: 40,
  //   status: "active",
  //   category: "true_false",
  //   created_by_type: "admin",
  //   updated_by_type: "admin",
  //   true_false_questions: [
  //     {
  //       question_text:
  //         "The Academic Reading test contains more texts than the General Training Reading test",
  //       correct_answer: false,
  //     },
  //     {
  //       question_text:
  //         "Both Academic and General Training Reading tests allocate 60 minutes for completion",
  //       correct_answer: true,
  //     },
  //     {
  //       question_text:
  //         "The General Training Reading test starts with shorter texts than the Academic Reading test",
  //       correct_answer: true,
  //     },
  //     {
  //       question_text:
  //         "The Academic Reading test typically contains more technical vocabulary",
  //       correct_answer: true,
  //     },
  //   ],
  // },
  {
    module_id: 45,
    title: "Reading Question Types Analysis",
    description:
      "Identify and understand different question types in the IELTS Reading test",
    file: "/assignments/file/ielts-reading-question-types.pdf",
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    max_score: 50,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match each Reading question type with its description",
        options: [
          {
            option_text: "True/False/Not Given",
            option_type: "text",
            match_text:
              "Determining if statements are factually accurate according to the text",
            match_type: "text",
          },
          {
            option_text: "Matching Headings",
            option_type: "text",
            match_text:
              "Selecting appropriate titles for paragraphs or sections",
            match_type: "text",
          },
          {
            option_text: "Summary Completion",
            option_type: "text",
            match_text:
              "Filling gaps in a summary of the text using words from a list or the passage",
            match_type: "text",
          },
          {
            option_text: "Multiple Choice",
            option_type: "text",
            match_text: "Selecting the correct answer from several options",
            match_type: "text",
          },
          {
            option_text: "Sentence Completion",
            option_type: "text",
            match_text: "Finishing sentences using information from the text",
            match_type: "text",
          },
        ],
      },
    ],
  },

  // Session 3: Skimming, Scanning & Reading Strategies
  {
    module_id: 46,
    title: "Speed Reading Techniques",
    description:
      "Practice skimming and scanning techniques for the IELTS Reading test",
    file: "/assignments/file/ielts-speed-reading-practice.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    max_score: 60,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 46,
    title: "Reading Strategy Fill-in-the-Blanks",
    description: "Complete statements about effective IELTS Reading strategies",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    max_score: 40,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text:
          "_____ is a technique used to quickly identify the main ideas of a text by reading first and last paragraphs, headings, and topic sentences.",
        answers: ["Skimming"],
      },
      {
        question_text:
          "_____ involves quickly searching for specific information such as dates, names, or numbers in a text.",
        answers: ["Scanning"],
      },
      {
        question_text:
          "You should spend approximately _____ minutes reading each passage in the Reading test.",
        answers: ["20"],
      },
      {
        question_text:
          "When approaching matching headings questions, you should first read the _____ to understand what you're looking for.",
        answers: ["headings"],
      },
    ],
  },
  {
    module_id: 46,
    title: "Timed Reading Practice",
    description:
      "Complete reading exercises within strict time limits to improve speed",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    max_score: 50,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // Session 3: Solving All IELTS Reading Question Types
  {
    module_id: 47,
    title: "Reading Question Types Practice",
    description:
      "Practice answering different types of IELTS Reading questions",
    file: "/assignments/file/ielts-reading-question-practice.pdf",
    due_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
    max_score: 70,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 47,
    title: "True/False/Not Given Strategy Analysis",
    description:
      "Analyze and practice strategies for True/False/Not Given questions",
    file: null,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    max_score: 40,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph:
          "Explain the differences between 'False' and 'Not Given' in IELTS Reading questions. Provide a strategy for distinguishing between these two options and give examples of each.",
      },
    ],
  },
  {
    module_id: 47,
    title: "Mini Reading Test",
    description:
      "Complete a mini IELTS Reading test with various question types",
    file: null,
    due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    max_score: 60,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // Session 4: Understanding IELTS Writing Tasks
  {
    module_id: 48,
    title: "Writing Tasks Comparison",
    description: "Compare Academic and General Training Writing tasks",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    max_score: 50,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match each Writing task with its requirements",
        options: [
          {
            option_text: "Academic Task 1",
            option_type: "text",
            match_text:
              "Describing data, process, diagram, or map in 150+ words",
            match_type: "text",
          },
          {
            option_text: "General Training Task 1",
            option_type: "text",
            match_text: "Writing a letter for a specific purpose in 150+ words",
            match_type: "text",
          },
          {
            option_text: "Academic Task 2",
            option_type: "text",
            match_text:
              "Writing an essay on a topic of general interest in 250+ words",
            match_type: "text",
          },
          {
            option_text: "General Training Task 2",
            option_type: "text",
            match_text:
              "Writing an essay on a topic of general interest in 250+ words",
            match_type: "text",
          },
        ],
      },
    ],
  },
  // {
  //   module_id: 48,
  //   title: "Writing Assessment Criteria Analysis",
  //   description:
  //     "Study and understand the assessment criteria for IELTS Writing",
  //   file: "/assignments/file/ielts-writing-assessment-criteria.pdf",
  //   due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
  //   max_score: 40,
  //   status: "active",
  //   category: "true_false",
  //   created_by_type: "admin",
  //   updated_by_type: "admin",
  //   true_false_questions: [
  //     {
  //       question_text:
  //         "Task Achievement is one of the four assessment criteria for IELTS Writing",
  //       correct_answer: true,
  //     },
  //     {
  //       question_text:
  //         "Using informal language is appropriate for all types of letters in General Training Task 1",
  //       correct_answer: false,
  //     },
  //     {
  //       question_text:
  //         "Task 2 carries more weight than Task 1 in the final Writing score",
  //       correct_answer: true,
  //     },
  //     {
  //       question_text:
  //         "The minimum word count is strictly enforced and candidates are penalized if they write fewer words",
  //       correct_answer: true,
  //     },
  //   ],
  // },

  // Session 4: Writing Task 1: Reports and Letters
  {
    module_id: 49,
    title: "Academic Task 1 Practice - Graph Description",
    description: "Practice describing and analyzing a graph or chart",
    file: "/assignments/file/ielts-task1-graph-practice.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    max_score: 60,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph:
          "Write a complete Academic Task 1 essay describing the provided graph. Your response should be at least 150 words and follow the appropriate structure for this task type.",
      },
    ],
  },
  {
    module_id: 49,
    title: "General Training Task 1 Practice - Letter Writing",
    description:
      "Practice writing different types of letters for General Training Task 1",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    max_score: 60,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph:
          "Write a formal letter to your landlord requesting repairs for problems in your apartment. Your response should be at least 150 words and follow the appropriate formal letter structure.",
      },
    ],
  },
  {
    module_id: 49,
    title: "Task 1 Vocabulary Fill-in-the-Blanks",
    description:
      "Complete sentences with appropriate vocabulary for Task 1 Writing",
    file: null,
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    max_score: 40,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text:
          "The graph shows a _____ increase in population between 2010 and 2020.",
        answers: [
          "significant",
          "substantial",
          "considerable",
          "sharp",
          "dramatic",
          "steep",
        ],
      },
      {
        question_text:
          "Sales _____ slightly during the holiday season before declining again.",
        answers: ["fluctuated"],
      },
      {
        question_text:
          "I am writing to _____ a complaint about the service I received.",
        answers: ["make"],
      },
      {
        question_text:
          "I would be _____ if you could address this issue as soon as possible.",
        answers: ["grateful"],
      },
    ],
  },

  // Session 4: Writing Task 2: Opinion and Discussion Essays
  // {
  //   module_id: 50,
  //   title: "Task 2 Essay Structure Analysis",
  //   description: "Analyze and understand effective essay structures for Task 2",
  //   file: "/assignments/file/ielts-task2-structure-guide.pdf",
  //   due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  //   max_score: 50,
  //   status: "active",
  //   category: "true_false",
  //   created_by_type: "admin",
  //   updated_by_type: "admin",
  //   true_false_questions: [
  //     {
  //       question_text: "A Task 2 essay must always have exactly 5 paragraphs",
  //       correct_answer: false,
  //     },
  //     {
  //       question_text:
  //         "You should always state your opinion in the introduction of an opinion essay",
  //       correct_answer: true,
  //     },
  //     {
  //       question_text:
  //         "It's acceptable to introduce new ideas in the conclusion",
  //       correct_answer: false,
  //     },
  //     {
  //       question_text: "Each body paragraph should focus on a single main idea",
  //       correct_answer: true,
  //     },
  //     {
  //       question_text:
  //         "Using examples is important to support your arguments in Task 2",
  //       correct_answer: true,
  //     },
  //   ],
  // },
  {
    module_id: 50,
    title: "Task 2 Essay Writing Practice",
    description: "Write a complete Task 2 essay on the given topic",
    file: null,
    due_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
    max_score: 80,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph:
          "Some people believe that universities should focus on providing academic skills while others think that preparing students for employment is more important. Discuss both views and give your opinion. Write at least 250 words.",
      },
    ],
  },
  {
    module_id: 50,
    title: "Task 2 Question Analysis",
    description:
      "Analyze different types of Task 2 questions and plan appropriate responses",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    max_score: 50,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text:
          "Match each Task 2 question type with the appropriate essay structure",
        options: [
          {
            option_text: "Opinion Essay",
            option_type: "text",
            match_text:
              "Introduction with clear position, body paragraphs supporting your opinion, conclusion restating opinion",
            match_type: "text",
          },
          {
            option_text: "Discussion Essay",
            option_type: "text",
            match_text:
              "Introduction presenting both sides, body paragraphs discussing each view, conclusion with your opinion",
            match_type: "text",
          },
          {
            option_text: "Problem-Solution Essay",
            option_type: "text",
            match_text:
              "Introduction identifying problem, body paragraphs analyzing problem and suggesting solutions, conclusion summarizing solutions",
            match_type: "text",
          },
          {
            option_text: "Advantages-Disadvantages Essay",
            option_type: "text",
            match_text:
              "Introduction presenting topic, body paragraphs discussing benefits and drawbacks, conclusion with balanced view",
            match_type: "text",
          },
        ],
      },
    ],
  },

  // Session 4: Grammar and Vocabulary for IELTS Writing
  {
    module_id: 51,
    title: "Advanced Grammar for IELTS Writing",
    description:
      "Practice using complex grammatical structures for higher band scores",
    file: "/assignments/file/ielts-advanced-grammar.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    max_score: 60,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text:
          "_____ the rise in global temperatures, many species are facing extinction.",
        answers: ["Due to"],
      },
      {
        question_text:
          "The government _____ implemented new policies, but they have not yet had the desired effect.",
        answers: ["has recently"],
      },
      {
        question_text:
          "_____ I were in charge, I would allocate more resources to renewable energy.",
        answers: ["If"],
      },
      {
        question_text:
          "Not only _____ the cost of living increased, but wages have also stagnated.",
        answers: ["has"],
      },
    ],
  },
  {
    module_id: 51,
    title: "Academic Vocabulary Enhancement",
    description:
      "Build and practice using advanced vocabulary for IELTS Writing tasks",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    max_score: 50,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match each word with its more academic equivalent",
        options: [
          {
            option_text: "show",
            option_type: "text",
            match_text: "demonstrate",
            match_type: "text",
          },
          {
            option_text: "big",
            option_type: "text",
            match_text: "substantial",
            match_type: "text",
          },
          {
            option_text: "good",
            option_type: "text",
            match_text: "beneficial",
            match_type: "text",
          },
          {
            option_text: "bad",
            option_type: "text",
            match_text: "detrimental",
            match_type: "text",
          },
          {
            option_text: "important",
            option_type: "text",
            match_text: "significant",
            match_type: "text",
          },
        ],
      },
    ],
  },
  {
    module_id: 51,
    title: "Error Correction Practice",
    description:
      "Identify and correct common grammar and vocabulary errors in IELTS Writing",
    file: null,
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    max_score: 40,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph:
          "Review the provided sample essay, identify at least five grammatical or vocabulary errors, and rewrite the sentences correctly. Explain why each correction improves the writing quality.",
      },
    ],
  },

  // Session 5: Introduction to IELTS Speaking Format
  // {
  //   module_id: 52,
  //   title: "Speaking Test Format Quiz",
  //   description:
  //     "Test your understanding of the IELTS Speaking test format and parts",
  //   file: null,
  //   due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
  //   max_score: 40,
  //   status: "active",
  //   category: "true_false",
  //   created_by_type: "admin",
  //   updated_by_type: "admin",
  //   true_false_questions: [
  //     {
  //       question_text: "The IELTS Speaking test consists of four parts",
  //       correct_answer: false,
  //     },
  //     {
  //       question_text:
  //         "Part 2 of the Speaking test involves a 2-minute monologue",
  //       correct_answer: true,
  //     },
  //     {
  //       question_text:
  //         "Candidates receive their Speaking test topic 24 hours in advance",
  //       correct_answer: false,
  //     },
  //     {
  //       question_text: "The entire Speaking test typically takes 11-14 minutes",
  //       correct_answer: true,
  //     },
  //     {
  //       question_text:
  //         "In Part 3, the examiner asks questions related to the Part 2 topic",
  //       correct_answer: true,
  //     },
  //   ],
  // },
  {
    module_id: 52,
    title: "Speaking Assessment Criteria Analysis",
    description: "Study and understand how the Speaking test is evaluated",
    file: "/assignments/file/ielts-speaking-band-descriptors.pdf",
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    max_score: 50,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text:
          "Match each Speaking assessment criterion with its description",
        options: [
          {
            option_text: "Fluency and Coherence",
            option_type: "text",
            match_text:
              "Speaking at an appropriate pace with minimal hesitation and well-organized ideas",
            match_type: "text",
          },
          {
            option_text: "Lexical Resource",
            option_type: "text",
            match_text:
              "Using a wide range of vocabulary accurately and appropriately",
            match_type: "text",
          },
          {
            option_text: "Grammatical Range and Accuracy",
            option_type: "text",
            match_text: "Using varied grammatical structures with few errors",
            match_type: "text",
          },
          {
            option_text: "Pronunciation",
            option_type: "text",
            match_text:
              "Producing clear speech with appropriate intonation and stress",
            match_type: "text",
          },
        ],
      },
    ],
  },

  // Session 5: Fluency and Coherence in Speaking
  {
    module_id: 53,
    title: "Fluency Building Exercises",
    description:
      "Practice speaking continuously on various topics to build fluency",
    file: "/assignments/file/ielts-fluency-topics.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    max_score: 60,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 53,
    title: "Connecting Words and Phrases",
    description:
      "Learn and practice using discourse markers to improve coherence",
    file: null,
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    max_score: 40,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text:
          "_____, I'd like to explain my reasons for this opinion.",
        answers: ["Firstly"],
      },
      {
        question_text:
          "I enjoy reading books; _____, I prefer novels to non-fiction.",
        answers: ["however"],
      },
      {
        question_text:
          "Technology has improved our lives _____ it has also created new problems.",
        answers: [
          "while"
        ],
      },
      {
        question_text:
          "_____ the high cost, I believe investing in education is worthwhile.",
        answers: ["Despite"],
      },
    ],
  },
  {
    module_id: 53,
    title: "Paraphrasing Practice",
    description:
      "Practice rephrasing ideas when you don't know the exact vocabulary",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    max_score: 50,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph:
          "For each of the given sentences, write two different ways to express the same idea using different vocabulary and grammatical structures. Focus on maintaining the original meaning while demonstrating lexical flexibility.",
      },
    ],
  },

  // Session 5: Answering Part 1, 2, and 3 Effectively
  {
    module_id: 54,
    title: "Part 1 Question Practice",
    description:
      "Practice answering common Part 1 questions about familiar topics",
    file: "/assignments/file/ielts-speaking-part1-questions.pdf",
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    max_score: 50,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 54,
    title: "Part 2 Cue Card Preparation",
    description: "Practice preparing and delivering Part 2 monologues",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    max_score: 60,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph:
          "Prepare a 2-minute speech based on the following cue card: 'Describe a teacher who has influenced you in your education. You should say: who the teacher was, what subject they taught, what was special about them, and explain why this person influenced you so much.' Include your notes for planning and the full spoken response.",
      },
    ],
  },
  {
    module_id: 54,
    title: "Part 3 Discussion Questions",
    description:
      "Practice answering in-depth Part 3 questions on abstract topics",
    file: null,
    due_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
    max_score: 60,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph:
          "Answer the following Part 3 questions related to education: 1) How has education changed in your country in the last 20 years? 2) Do you think the main purpose of education should be to prepare people for work or to broaden their knowledge? 3) How might education change in the future? Provide detailed responses for each question.",
      },
    ],
  },

  // Session 5: Pronunciation and Lexical Resource
  {
    module_id: 55,
    title: "Pronunciation Practice",
    description: "Practice difficult sounds and intonation patterns in English",
    file: "/assignments/file/ielts-pronunciation-guide.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    max_score: 50,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 55,
    title: "Topic-Specific Vocabulary",
    description:
      "Learn and practice advanced vocabulary for common IELTS Speaking topics",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    max_score: 40,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text:
          "Match each topic with advanced vocabulary words related to it",
        options: [
          {
            option_text: "Environment",
            option_type: "text",
            match_text:
              "sustainability, biodiversity, ecological, conservation",
            match_type: "text",
          },
          {
            option_text: "Technology",
            option_type: "text",
            match_text: "innovation, obsolete, cutting-edge, digitalization",
            match_type: "text",
          },
          {
            option_text: "Education",
            option_type: "text",
            match_text:
              "curriculum, pedagogy, academic, intellectually stimulating",
            match_type: "text",
          },
          {
            option_text: "Urbanization",
            option_type: "text",
            match_text: "infrastructure, congestion, metropolitan, amenities",
            match_type: "text",
          },
        ],
      },
    ],
  },
  {
    module_id: 55,
    title: "Idioms and Expressions Practice",
    description: "Learn and use natural expressions to enhance your speaking",
    file: null,
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    max_score: 30,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text:
          "The project was _____ and _____ from the beginning, with poor planning and insufficient resources.",
        answers: ["doomed to failure", "ill-conceived"],
      },
      {
        question_text:
          "Learning a language requires practice; you can't expect to become fluent _____ .",
        answers: [
          "overnight"
        ],
      },
      {
        question_text:
          "The two colleagues don't get along; they're always _____ about workplace policies.",
        answers: ["at loggerheads"],
      },
      {
        question_text:
          "After considering all options, we decided to _____ and purchase a new system.",
        answers: ["bite the bullet"],
      },
    ],
  },
];

const quizzes = [
  // MODULE 1: IELTS Test Format Overview
  {
    module_id: 39,
    title: "IELTS Format Fundamentals Quiz",
    duration_minutes: 15,
    passing_score: 60,
    max_attempts: 3,
    attempts_gap: 12,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 39,
    title: "Academic vs General Training Quiz",
    duration_minutes: 10,
    passing_score: 70,
    max_attempts: 2,
    attempts_gap: 24,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 2: Assessment and Goal Setting
  {
    module_id: 40,
    title: "IELTS Band Scores Quiz",
    duration_minutes: 12,
    passing_score: 60,
    max_attempts: 3,
    attempts_gap: 12,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 3: Effective Study Strategies
  {
    module_id: 41,
    title: "IELTS Preparation Strategies Quiz",
    duration_minutes: 15,
    passing_score: 60,
    max_attempts: 2,
    attempts_gap: 24,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 4: Understanding IELTS Listening Format
  {
    module_id: 42,
    title: "Listening Test Structure Quiz",
    duration_minutes: 10,
    passing_score: 70,
    max_attempts: 3,
    attempts_gap: 12,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 5: Strategies for Each Listening Section
  {
    module_id: 43,
    title: "Listening Strategies Quiz",
    duration_minutes: 15,
    passing_score: 65,
    max_attempts: 3,
    attempts_gap: 12,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 43,
    title: "Listening Section Analysis Quiz",
    duration_minutes: 20,
    passing_score: 70,
    max_attempts: 2,
    attempts_gap: 24,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 6: Practice with Real IELTS Listening Questions
  {
    module_id: 44,
    title: "IELTS Listening Practice Quiz",
    duration_minutes: 30,
    passing_score: 65,
    max_attempts: 3,
    attempts_gap: 24,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 44,
    title: "Listening Question Types Quiz",
    duration_minutes: 25,
    passing_score: 70,
    max_attempts: 2,
    attempts_gap: 24,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 7: Overview of IELTS Reading Test
  {
    module_id: 45,
    title: "Reading Test Format Quiz",
    duration_minutes: 15,
    passing_score: 70,
    max_attempts: 3,
    attempts_gap: 12,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 8: Skimming, Scanning & Reading Strategies
  {
    module_id: 46,
    title: "Reading Techniques Quiz",
    duration_minutes: 20,
    passing_score: 65,
    max_attempts: 3,
    attempts_gap: 12,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 46,
    title: "Speed Reading Assessment",
    duration_minutes: 25,
    passing_score: 60,
    max_attempts: 2,
    attempts_gap: 24,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 9: Solving All IELTS Reading Question Types
  {
    module_id: 47,
    title: "Reading Question Types Quiz",
    duration_minutes: 25,
    passing_score: 65,
    max_attempts: 3,
    attempts_gap: 24,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 47,
    title: "Advanced Reading Strategies Quiz",
    duration_minutes: 30,
    passing_score: 70,
    max_attempts: 2,
    attempts_gap: 24,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 10: Understanding IELTS Writing Tasks
  {
    module_id: 48,
    title: "Writing Task Format Quiz",
    duration_minutes: 15,
    passing_score: 70,
    max_attempts: 3,
    attempts_gap: 12,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 11: Writing Task 1: Reports and Letters
  {
    module_id: 49,
    title: "Task 1 Writing Quiz",
    duration_minutes: 20,
    passing_score: 65,
    max_attempts: 3,
    attempts_gap: 24,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 49,
    title: "Data Interpretation Quiz",
    duration_minutes: 25,
    passing_score: 70,
    max_attempts: 2,
    attempts_gap: 24,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 12: Writing Task 2: Opinion and Discussion Essays
  {
    module_id: 50,
    title: "Task 2 Essay Structure Quiz",
    duration_minutes: 20,
    passing_score: 65,
    max_attempts: 3,
    attempts_gap: 24,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 50,
    title: "Argument Development Quiz",
    duration_minutes: 25,
    passing_score: 70,
    max_attempts: 2,
    attempts_gap: 24,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 13: Grammar and Vocabulary for IELTS Writing
  {
    module_id: 51,
    title: "Advanced Grammar Quiz",
    duration_minutes: 20,
    passing_score: 65,
    max_attempts: 3,
    attempts_gap: 24,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 51,
    title: "Academic Vocabulary Quiz",
    duration_minutes: 25,
    passing_score: 70,
    max_attempts: 2,
    attempts_gap: 24,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 14: Introduction to IELTS Speaking Format
  {
    module_id: 52,
    title: "Speaking Test Structure Quiz",
    duration_minutes: 15,
    passing_score: 70,
    max_attempts: 3,
    attempts_gap: 12,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 15: Fluency and Coherence in Speaking
  {
    module_id: 53,
    title: "Speaking Fluency Assessment",
    duration_minutes: 20,
    passing_score: 65,
    max_attempts: 3,
    attempts_gap: 24,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 16: Answering Part 1, 2, and 3 Effectively
  {
    module_id: 54,
    title: "Speaking Response Strategies Quiz",
    duration_minutes: 25,
    passing_score: 65,
    max_attempts: 3,
    attempts_gap: 24,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 54,
    title: "Speaking Topics Quiz",
    duration_minutes: 20,
    passing_score: 70,
    max_attempts: 2,
    attempts_gap: 24,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 17: Pronunciation and Lexical Resource
  {
    module_id: 55,
    title: "Pronunciation Assessment",
    duration_minutes: 20,
    passing_score: 65,
    max_attempts: 3,
    attempts_gap: 24,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 55,
    title: "Advanced Vocabulary Quiz",
    duration_minutes: 25,
    passing_score: 70,
    max_attempts: 2,
    attempts_gap: 24,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
];

const quizQuestions = [
  // MODULE 1: IELTS Test Format Overview - Quiz 1
  {
    quiz_id: 37,
    module_id: 39,
    question_text: "How many sections are there in the IELTS test?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 1,
    options: [
      { text: "Two sections: Academic and General Training", correct: false },
      {
        text: "Three sections: Listening, Reading, and Writing",
        correct: false,
      },
      {
        text: "Four sections: Listening, Reading, Writing, and Speaking",
        correct: true,
      },
      {
        text: "Five sections: Listening, Reading, Writing, Speaking, and Grammar",
        correct: false,
      },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 37,
    module_id: 39,
    question_text:
      "What is the total duration of the IELTS Listening, Reading, and Writing tests combined?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 2,
    options: [
      { text: "1 hour and 30 minutes", correct: false },
      { text: "2 hours and 30 minutes", correct: false },
      { text: "2 hours and 40 minutes", correct: true },
      { text: "3 hours", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 37,
    module_id: 39,
    question_text:
      "The IELTS Speaking test is conducted as a face-to-face interview.",
    question_type: "true-false",
    marks: 3,
    sequence_no: 3,
    options: [
      { text: "True", correct: true },
      { text: "False", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 37,
    module_id: 39,
    question_text:
      "In the IELTS test, scores are reported as _____ scores from 1 to 9.",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 4,
    blanks: [{ correct_word: "band", hint: "b" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 37,
    module_id: 39,
    question_text: "How many parts does the IELTS Speaking test consist of?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 5,
    options: [
      { text: "Two parts", correct: false },
      { text: "Three parts", correct: true },
      { text: "Four parts", correct: false },
      { text: "Five parts", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 1: IELTS Test Format Overview - Quiz 2
  {
    quiz_id: 38,
    module_id: 39,
    question_text:
      "Which of the following is a major difference between the Academic and General Training Reading tests?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 1,
    options: [
      {
        text: "The Academic test is longer than the General Training test",
        correct: false,
      },
      { text: "The General Training test has more questions", correct: false },
      {
        text: "The Academic test uses texts from academic sources, while General Training uses everyday texts",
        correct: true,
      },
      {
        text: "The Academic test is worth more points than the General Training test",
        correct: false,
      },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 38,
    module_id: 39,
    question_text:
      "In Writing Task 1, Academic candidates must write a report based on visual information, while General Training candidates must write a _____.",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 2,
    blanks: [{ correct_word: "letter", hint: "l" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 38,
    module_id: 39,
    question_text:
      "The Listening and Speaking sections are the same for both Academic and General Training versions of IELTS.",
    question_type: "true-false",
    marks: 3,
    sequence_no: 3,
    options: [
      { text: "True", correct: true },
      { text: "False", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 2: Assessment and Goal Setting - Quiz 1
  {
    quiz_id: 39,
    module_id: 40,
    question_text:
      "What is the minimum IELTS band score typically required for immigration to most English-speaking countries?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 1,
    options: [
      { text: "Band 4.0", correct: false },
      { text: "Band 5.0", correct: false },
      { text: "Band 6.0", correct: true },
      { text: "Band 7.0", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 39,
    module_id: 40,
    question_text:
      "What is the IELTS band score typically required for undergraduate admission to most universities in the UK, USA, Australia, and Canada?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 2,
    options: [
      { text: "5.5 - 6.0", correct: false },
      { text: "6.0 - 6.5", correct: true },
      { text: "7.0 - 7.5", correct: false },
      { text: "8.0 - 8.5", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 39,
    module_id: 40,
    question_text: "IELTS scores are valid for _____ years from the test date.",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 3,
    blanks: [{ correct_word: "two", hint: "t" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 39,
    module_id: 40,
    question_text:
      "If your overall goal is Band 7, but you scored Band 6 in a practice test, how many hours of study might you need to achieve your target score?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 4,
    options: [
      { text: "10-20 hours", correct: false },
      { text: "50-100 hours", correct: true },
      { text: "200-300 hours", correct: false },
      { text: "Less than 10 hours", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 3: Effective Study Strategies - Quiz 1
  {
    quiz_id: 40,
    module_id: 41,
    question_text:
      "Which of the following is NOT an effective IELTS study strategy?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 1,
    options: [
      { text: "Taking full-length practice tests regularly", correct: false },
      { text: "Memorizing essays for common topics", correct: true },
      {
        text: "Recording yourself speaking and analyzing your performance",
        correct: false,
      },
      { text: "Learning high-frequency academic vocabulary", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 40,
    module_id: 41,
    question_text:
      "For effective IELTS preparation, it's recommended to study in focused sessions of _____ minutes, followed by short breaks.",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 2,
    blanks: [{ correct_word: "25-30", hint: "2" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 40,
    module_id: 41,
    question_text:
      "Spaced repetition is an effective technique for learning vocabulary for the IELTS test.",
    question_type: "true-false",
    marks: 3,
    sequence_no: 3,
    options: [
      { text: "True", correct: true },
      { text: "False", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 40,
    module_id: 41,
    question_text:
      "Which of the following is a recommended approach for improving IELTS listening skills?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 4,
    options: [
      { text: "Only listening to IELTS practice materials", correct: false },
      {
        text: "Listening to a wide variety of English accents and content",
        correct: true,
      },
      { text: "Focusing on American English exclusively", correct: false },
      {
        text: "Watching movies with subtitles in your native language",
        correct: false,
      },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
];

const predefinedQuestions = [
  {
    question_text: "What is JavaScript primarily used for?",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 1,
    options: [
      { option_text: "Server-side scripting", is_correct: false },
      { option_text: "Client-side scripting", is_correct: true },
      { option_text: "Database management", is_correct: false },
      { option_text: "Network configuration", is_correct: false },
    ],
  },
  {
    question_text: "Which keyword is used to declare a variable in JavaScript?",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 2,
    options: [
      { option_text: "var", is_correct: true },
      { option_text: "int", is_correct: false },
      { option_text: "string", is_correct: false },
      { option_text: "let", is_correct: true },
    ],
  },
  {
    question_text:
      "What is the output of the following code?\n```javascript\nconsole.log(typeof null);\n```",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 3,
    options: [
      { option_text: "null", is_correct: false },
      { option_text: "object", is_correct: true },
      { option_text: "undefined", is_correct: false },
      { option_text: "string", is_correct: false },
    ],
  },
  {
    question_text: "Which of the following is NOT a JavaScript data type?",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 4,
    options: [
      { option_text: "Number", is_correct: false },
      { option_text: "String", is_correct: false },
      { option_text: "Boolean", is_correct: false },
      { option_text: "Float", is_correct: true },
    ],
  },
  {
    question_text:
      "What does the `typeof` operator return for arrays in JavaScript?",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 5,
    options: [
      { option_text: "array", is_correct: false },
      { option_text: "object", is_correct: true },
      { option_text: "undefined", is_correct: false },
      { option_text: "function", is_correct: false },
    ],
  },
];

const audioToScriptQuestions = [
  // MODULE 4: Understanding IELTS Listening Format - Quiz 1
  {
    quiz_id: 41,
    url: "/audioToScript/ielts_listening_format.mp3",
    script: "The IELTS Listening test consists of four sections with increasing difficulty. Each section has 10 questions, making a total of 40 questions. You will hear each recording only once. The entire listening test takes approximately 30 minutes, with an additional 10 minutes to transfer your answers to the answer sheet.",
    marks: 7,
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 5: Strategies for Each Listening Section - Quiz 1
  {
    quiz_id: 42,
    url: "/audioToScript/ielts_listening_strategies.mp3",
    script: "When approaching Section 1 of the IELTS Listening test, remember it typically features a conversation between two people in an everyday social context. Before listening, quickly read through the questions to anticipate the information you need. Pay particular attention to specific details like names, numbers, dates, and addresses, as these are commonly tested in this section.",
    marks: 3,
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 6: Practice with Real IELTS Listening Questions - Quiz 1
  {
    quiz_id: 44,
    url: "/audioToScript/ielts_listening_practice.mp3",
    script: "Good morning everyone. Today I'll be discussing the university's new library facilities. The main library will be open from 8am to midnight on weekdays, and 10am to 6pm on weekends. The online catalogue system has been upgraded to allow book reservations up to 3 months in advance. For research assistance, you can book appointments with librarians through the university portal or by calling extension 4392.",
    marks: 8,
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 14: Introduction to IELTS Speaking Format
  {
    quiz_id: 49,
    url: "/audioToScript/ielts_speaking_format.mp3",
    script: "The IELTS Speaking test is a face-to-face interview divided into three parts. Part 1 lasts 4-5 minutes and consists of general questions about familiar topics. Part 2 is an individual long turn where you'll speak for 1-2 minutes on a given topic card. Part 3 lasts 4-5 minutes and involves more abstract questions related to the Part 2 topic. The entire speaking test takes between 11-14 minutes.",
    marks: 5,
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 15: Fluency and Coherence in Speaking
  {
    quiz_id: 50,
    url: "/audioToScript/ielts_speaking_fluency.mp3",
    script: "To improve your fluency in the IELTS Speaking test, practice using linking words and phrases such as 'however,' 'moreover,' and 'on the other hand.' These connectors help your speech flow naturally and demonstrate coherence. Another effective technique is to avoid long pauses by using filler phrases like 'let me think about that' or 'that's an interesting question' when you need a moment to organize your thoughts.",
    marks: 10,
    created_by_type: "admin",
    updated_by_type: "admin",
  },
];

const realWordQuestions = [
  // MODULE 8: Skimming, Scanning & Reading Strategies - Quiz 1
  {
    quiz_id: 46,
    words: ["skimming", "scanning", "perusal", "glancing", "skanning"],
    correct_answers: ["yes", "yes", "yes", "yes", "no"],
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 13: Grammar and Vocabulary for IELTS Writing - Quiz 1
  {
    quiz_id: 48,
    words: [
      "coherence",
      "cohesion",
      "conjunction",
      "colligation",
      "conjunctify",
    ],
    correct_answers: ["yes", "yes", "yes", "yes", "no"],
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 17: Pronunciation and Lexical Resource - Quiz 1
  {
    quiz_id: 52,
    words: [
      "articulation",
      "intonation",
      "enunciation",
      "pronouncify",
      "cadence",
    ],
    correct_answers: ["yes", "yes", "yes", "no", "yes"],
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 13: Grammar and Vocabulary for IELTS Writing - Quiz 2
  {
    quiz_id: 49,
    words: [
      "nevertheless",
      "furthermore",
      "correspondingly",
      "albeitly",
      "consequently",
    ],
    correct_answers: ["yes", "yes", "yes", "no", "yes"],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
];

const summarizePassageQuestions = [
  // MODULE 9: Solving All IELTS Reading Question Types - Quiz 2
  {
    quiz_id: 48,
    passage: `The IELTS Reading test includes matching heading questions that require candidates to match paragraph headings to the corresponding paragraphs. To approach these questions effectively, first read all the heading options to understand the range of topics. Then, skim each paragraph to identify its main idea or purpose. Look for topic sentences, which often appear at the beginning or end of paragraphs. Be cautious of distractors—headings that relate to details in the paragraph but don't capture the main idea. It's also important to note that headings usually summarize the paragraph's main point rather than focusing on specific details. After matching all paragraphs with their headings, review your choices to ensure each heading accurately reflects the central theme of its corresponding paragraph.`,
    time_limit: 6,
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 11: Writing Task 1: Reports and Letters - Quiz 1
  {
    quiz_id: 50,
    passage: `In IELTS Academic Writing Task 1, candidates must interpret and describe visual information, such as graphs, charts, tables, maps, or processes. A strong response begins with an overview that summarizes the main trends or significant features without repeating specific data. The body paragraphs should then provide detailed descriptions, grouping related information logically and using appropriate comparative language. It's essential to use a variety of sentence structures and precise vocabulary related to data description. Candidates should avoid giving personal opinions or explanations for the trends shown, as Task 1 requires objective reporting only. Remember to write at least 150 words and spend about 20 minutes on this task, as it contributes less to your Writing score than Task 2.`,
    time_limit: 6,
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 13: Grammar and Vocabulary for IELTS Writing - Quiz 1
  {
    quiz_id: 52,
    passage: `To achieve a high band score in IELTS Writing, candidates must demonstrate a wide range of vocabulary and grammatical structures. Lexical resource refers to the breadth and precision of vocabulary used. High-scoring responses include topic-specific vocabulary, appropriate collocations, and less common words or phrases. Similarly, grammatical range and accuracy require varied sentence structures, including complex sentences with subordinate clauses, conditionals, and passive voice. While errors may occur, they should be minimal and not impede communication. Candidates should avoid repetitive vocabulary and simple sentence structures, as these limit the band score potential. Practice identifying and using a variety of cohesive devices, such as conjunctions, pronouns, and referencing words, to connect ideas smoothly. Remember that it's better to use simpler vocabulary accurately than to misuse advanced vocabulary.`,
    time_limit: 6,
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 5: Strategies for Each Listening Section - Quiz 2
  {
    quiz_id: 53,
    passage: `The IELTS Listening test progresses from easier to more challenging content across its four sections. Section 1 typically features a conversation between two speakers in an everyday social context, often involving practical arrangements or basic information exchange. Section 2 presents a monologue in an everyday social context, such as a speech about local facilities or services. Section 3 involves a conversation among up to four people in an educational or training context, requiring candidates to follow potentially complex exchanges. Section 4 features an academic monologue, such as a university lecture, testing the ability to follow abstract concepts and detailed arguments. Effective section-specific strategies include anticipating practical details in Sections 1 and 2, while focusing on opinions, attitudes, and abstract concepts in Sections 3 and 4.`,
    time_limit: 6,
    created_by_type: "admin",
    updated_by_type: "admin",
  },
];

const bestOptionQuestions = [
  // MODULE 5: Strategies for Each Listening Section - Quiz 1
  {
    quiz_id: 43,
    passage:
      "When preparing for the IELTS Listening test, it's essential to develop ____ listening skills by practicing with a variety of accents and ____ contexts. Focus on understanding the ____ meaning rather than every single word, and pay special attention to ____ words that indicate changes in direction or emphasis.",
    blanked_words: [
      { word: "active", options: ["active", "passive", "selective", "intensive"], position: 1 },
      { word: "authentic", options: ["authentic", "artificial", "simulated", "theoretical"], position: 2 },
      { word: "overall", options: ["overall", "detailed", "specific", "general"], position: 3 },
      { word: "signpost", options: ["signpost", "keyword", "signal", "marker"], position: 4 }
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 8: Skimming, Scanning & Reading Strategies - Quiz 2
  {
    quiz_id: 47,
    passage:
      "Effective ____ involves quickly running your eyes over the text to get a general idea of what it's about, while ____ is searching for specific information like names, dates, or keywords. When facing a long reading passage, begin by reading the ____ and the first ____ of each paragraph to understand the text structure before addressing the questions.",
    blanked_words: [
      { word: "skimming", options: ["skimming", "scanning", "reading", "analyzing"], position: 1 },
      { word: "scanning", options: ["scanning", "skimming", "reading", "searching"], position: 2 },
      { word: "title", options: ["title", "heading", "subtitle", "caption"], position: 3 },
      { word: "sentence", options: ["sentence", "paragraph", "phrase", "word"], position: 4 }
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 11: Writing Task 1: Reports and Letters - Quiz 2
  {
    quiz_id: 51,
    passage:
      "When describing graphs in IELTS Writing Task 1, begin with an ____ of the main trends. Use appropriate ____ language to compare data points, and group ____ information together logically. Remember to include relevant ____ details without listing every number from the visual.",
    blanked_words: [
      { word: "overview", options: ["overview", "summary", "introduction", "conclusion"], position: 1 },
      { word: "comparative", options: ["comparative", "descriptive", "analytical", "narrative"], position: 2 },
      { word: "similar", options: ["similar", "different", "related", "contrasting"], position: 3 },
      { word: "specific", options: ["specific", "general", "broad", "detailed"], position: 4 }
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 16: Answering Part 1, 2, and 3 Effectively - Quiz 2
  {
    quiz_id: 54,
    passage:
      "In IELTS Speaking Part 3, questions become more ____ and analytical. Develop your answers with ____ examples and explain your ____ clearly. Use ____ phrases when you need time to think, rather than leaving long silences.",
    blanked_words: [
      { word: "abstract", options: ["abstract", "concrete", "simple", "complex"], position: 1 },
      { word: "specific", options: ["specific", "general", "vague", "detailed"], position: 2 },
      { word: "reasoning", options: ["reasoning", "opinion", "fact", "belief"], position: 3 },
      { word: "filler", options: ["filler", "transition", "connector", "linker"], position: 4 }
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // MODULE 17: Pronunciation and Lexical Resource - Quiz 2
  {
    quiz_id: 55,
    passage:
      "To demonstrate strong lexical resource in the IELTS Speaking test, use a range of ____ vocabulary appropriate to the topic. Pay attention to word ____ and natural collocations. Good ____ involves clear articulation of sounds, appropriate ____ on syllables, and natural intonation patterns.",
    blanked_words: [
      { word: "precise", options: ["precise", "vague", "simple", "complex"], position: 1 },
      { word: "formation", options: ["formation", "meaning", "spelling", "pronunciation"], position: 2 },
      { word: "pronunciation", options: ["pronunciation", "enunciation", "articulation", "speech"], position: 3 },
      { word: "stress", options: ["stress", "emphasis", "accent", "tone"], position: 4 }
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
];

// ==============================
// 🔹 Seeder Function
// ==============================

const insertDefaultCourseData = async () => {
  try {
    await sequelize.sync();

    // Admin
    let admin = await Admin.findOne({ where: { email: defaultAdmin.email } });
    if (!admin) {
      admin = await Admin.create({
        ...defaultAdmin,
        password: defaultAdmin.password,
      });
      console.log("✅ Admin created");
    }

    // Users
    for (const user of defaultUsers) {
      const existingUser = await User.findOne({ where: { email: user.email } });
      if (!existingUser) {
        const hashed = await bcrypt.hash(user.password, 10);
        await User.create({ ...user, password: hashed });
      }
    }
    console.log("✅ Users created");

    // Categories
    const categoryRecords = [];
    for (const category of courseCategories) {
      let existing = await CourseCategory.findOne({
        where: { category: category.category },
      });
      if (!existing) {
        existing = await CourseCategory.create({
          ...category,
          created_by: admin.id,
          updated_by: admin.id,
        });
      }
      categoryRecords.push(existing);
    }
    console.log("✅ Categories created");

    // Courses
    const courseRecords = [];
    for (const courseData of courses) {
      const existing = await Course.findOne({
        where: { title: courseData.title },
      });
      if (existing) continue;

      const highestCourse = await Course.findOne({
        order: [["sequence", "DESC"]],
      });
      const nextSequence = highestCourse ? highestCourse.sequence + 1 : 1;

      const categoryObj = categoryRecords.find(
        (c) => c.id === courseData.category_id
      );
      if (!categoryObj) {
        console.error(
          `❌ No matching category for course "${courseData.title}"`
        );
        continue;
      }
      const category_id = categoryObj.id;

      const status = "published";
      const created_by = admin.id;
      const updated_by = admin.id;

      const newCourse = await Course.create({
        ...courseData,
        sequence: nextSequence,
        status,
        category_id,
        created_by,
        updated_by,
        what_you_will_learn: courseData.what_you_will_learn || [],
        prerequisites: courseData.prerequisites || [],
        hashtags: courseData.hashtags || [],
      });

      newCourse.public_hash = generatePublicHash(newCourse.id);
      await newCourse.save();

      const plainDescription = convert(courseData.description || "", {
        wordwrap: false,
      });
      const courseText = `passage: ${courseData.title
        }. ${plainDescription}. What you will learn: ${newCourse.what_you_will_learn.join(
          ". "
        )}. Hashtags: ${newCourse.hashtags.join(", ")}. Category: ${categoryRecords.find((c) => c.id === category_id).category
        }`;
      const embedding = await getEmbedding(courseText);
      await newCourse.update({ embedding });

      if (courseData.created_by_type === "partner") {
        await CourseVersion.create({
          course_id: newCourse.id,
          version: 1,
          title: newCourse.title,
          description: newCourse.description,
          category_id,
          price: newCourse.price,
          discount: newCourse.discount,
          duration_hours: newCourse.duration_hours,
          expiry_days: newCourse.expiry_days,
          what_you_will_learn: newCourse.what_you_will_learn,
          prerequisites: newCourse.prerequisites,
          thumbnail: newCourse.thumbnail,
          preview_video: newCourse.preview_video,
          hashtags: newCourse.hashtags,
          embedding,
          status,
          created_by,
          updated_by,
          created_by_type: newCourse.created_by_type,
          updated_by_type: newCourse.updated_by_type,
        });
      }

      courseRecords.push(newCourse);
      console.log(`✅ Course "${newCourse.title}" created`);
    }

    // Course FAQs
    for (const course of courseRecords) {
      const faqsForCourse = courseFAQs.filter(
        (faq) => faq.course_id === course.id
      );
      for (const faqData of faqsForCourse) {
        const faq = await CourseFAQ.create({
          course_id: course.id,
          question: faqData.question,
          created_by: admin.id,
          updated_by: admin.id,
          created_by_type: faqData.created_by_type,
          updated_by_type: faqData.updated_by_type,
        });

        for (const optionText of faqData.options) {
          await CourseFAQOption.create({
            faq_id: faq.id,
            option_text: optionText,
            created_by: admin.id,
            updated_by: admin.id,
            created_by_type: faqData.created_by_type,
            updated_by_type: faqData.updated_by_type,
          });
        }
      }
      console.log(`✅ Course FAQs created for course "${course.title}"`);
    }

    // Sessions
    const sessionRecords = [];
    for (const sessionData of sessions) {
      const course = courseRecords.find((c) => c.id === sessionData.course_id);
      const highestSession = await Session.findOne({
        where: { course_id: course.id },
        order: [["sequence_no", "DESC"]],
      });
      const nextSequence = highestSession ? highestSession.sequence_no + 1 : 1;

      const newSession = await Session.create({
        ...sessionData,
        course_id: course.id,
        sequence_no: nextSequence,
        created_by: admin.id,
        updated_by: admin.id,
      });

      newSession.public_hash = generatePublicHash(newSession.id);
      await newSession.save();

      sessionRecords.push(newSession);
    }
    console.log("✅ Sessions created");

    // Modules
    const moduleRecords = [];
    for (const modData of modules) {
      const course = courseRecords.find((c) => c.id === modData.course_id);
      const session = sessionRecords.find((s) => s.id === modData.session_id);

      const highestModule = await Module.findOne({
        where: { course_id: course.id },
        order: [["sequence_no", "DESC"]],
      });
      const nextSequence = highestModule ? highestModule.sequence_no + 1 : 1;

      const newModule = await Module.create({
        ...modData,
        course_id: course.id,
        session_id: session.id,
        sequence_no: nextSequence,
        created_by: admin.id,
        updated_by: admin.id,
        created_by_type: "admin",
        updated_by_type: "admin",
      });

      newModule.public_hash = generatePublicHash(newModule.id);
      await newModule.save();

      moduleRecords.push(newModule);
    }
    console.log("✅ Modules created");

    // Create a mapping of original module_id to new module record
    const moduleIdMapping = {};
    modules.forEach((moduleData, index) => {
      moduleIdMapping[moduleData.module_id] = moduleRecords[index].id;
    });

    // Topics
    // Get all topics from the topics array
    const allTopics = topics;

    for (const module of moduleRecords) {
      let sequence = 1;

      // Find the original module_id that corresponds to this module record
      const originalModuleId =
        modules.findIndex(
          (m) =>
            m.course_id === module.course_id &&
            m.session_id === module.session_id &&
            m.title === module.title
        ) + 39;

      // Filter topics that belong to this module
      const topicsToAdd = allTopics.filter(
        (topic) => topic.module_id === originalModuleId
      );

      for (const topic of topicsToAdd) {
        // Calculate topic duration from content
        let calculatedTopicDuration = 0;
        if (topic.content_type === "video") {
          calculatedTopicDuration = topic.video?.duration_minutes || 0;
        } else if (topic.content_type === "audio") {
          calculatedTopicDuration = topic.audio?.duration_minutes || 0;
        } else if (topic.content_type === "accordian") {
          calculatedTopicDuration = (topic.accordions || []).reduce((sum, acc) => sum + (acc.duration_minutes || 0), 0);
        } else if (topic.content_type === "general") {
          if (topic.general?.completion_type === "timer") {
            calculatedTopicDuration = topic.general?.completion_time || 0;
          } else {
            calculatedTopicDuration = topic.general?.duration_minutes || 0;
          }
        } else if (topic.content_type === "slide") {
          calculatedTopicDuration = (topic.slides || []).reduce((sum, slide) => {
            let slideDur = 0;
            if (slide.content_type === "video") slideDur = slide.video?.duration_minutes || 0;
            else if (slide.content_type === "audio") slideDur = slide.audio?.duration_minutes || 0;
            else if (slide.content_type === "general") {
              if (slide.general?.completion_type === "timer") {
                slideDur = slide.general?.completion_time || 0;
              } else {
                slideDur = slide.general?.duration_minutes || 0;
              }
            }
            return sum + slideDur + (slide.slide_extra_duration || 0);
          }, 0);
        }

        const extraDuration = topic.extra_duration || 0;
        const totalDuration = calculatedTopicDuration + extraDuration;

        const newTopic = await Topic.create({
          module_id: module.id,
          title: topic.title,
          description: topic.description,
          content_type: topic.content_type,
          sequence_no: sequence++,
          topic_duration: calculatedTopicDuration,
          extra_duration: extraDuration,
          total_duration: totalDuration,
          created_by: admin.id,
          updated_by: admin.id,
          created_by_type: "admin",
          updated_by_type: "admin",
        });

        newTopic.public_hash = generatePublicHash(newTopic.id);
        await newTopic.save();

        switch (topic.content_type) {
          case "video":
            await Video.create({
              topic_id: newTopic.id,
              url: topic.video.url,
              audio_url: topic.video.audio_url || null,
              duration_minutes: topic.video.duration_minutes,
              transcript: topic.video.transcript,
              bullet_points: topic.video.bullet_points,
              created_by: admin.id,
              updated_by: admin.id,
              created_by_type: "admin",
              updated_by_type: "admin",
            });
            break;
          case "audio":
            await Audio.create({
              topic_id: newTopic.id,
              url: topic.audio.url,
              duration_minutes: topic.audio.duration_minutes,
              created_by: admin.id,
              updated_by: admin.id,
              created_by_type: "admin",
              updated_by_type: "admin",
            });
            break;
          case "accordian":
            for (const acc of topic.accordions) {
              await Accordion.create({
                topic_id: newTopic.id,
                title: acc.title,
                body: acc.body,
                codeLanguage: acc.codeLanguage,
                code: acc.code,
                audio_url: acc.audio_url || null,
                duration_minutes: await getAudioDurationInMinutes(acc.audio_url || null),
                created_by: admin.id,
                updated_by: admin.id,
                created_by_type: "admin",
                updated_by_type: "admin",
              });
            }
            break;
          case "general": {
            const coreGeneral = await GeneralMaterial.create({
              topic_id: newTopic.id,
              audio_url: topic.general.audio_url || null,
              title: topic.general.title,
              description: topic.general.description,
              codeLanguage: topic.general.codeLanguage || null,
              code: topic.general.code || null,
              completion_type: topic.general.completion_type || 'audio',
              duration_minutes: topic.general.completion_type === 'timer' ? 0 : await getAudioDurationInMinutes(topic.general.audio_url || null),
              created_by: admin.id,
              updated_by: admin.id,
              created_by_type: "admin",
              updated_by_type: "admin",
            });

            const legacyMat = topic.general.url && topic.general.material_type ? [{
              topic_id: newTopic.id,
              material_type: topic.general.material_type,
              url: topic.general.url,
              created_by: admin.id,
              updated_by: admin.id,
              created_by_type: "admin",
              updated_by_type: "admin",
            }] : [];

            const extraMats = Array.isArray(topic.general.materials) ? topic.general.materials.map(m => ({
              topic_id: newTopic.id,
              material_type: m.material_type,
              url: m.url,
              created_by: admin.id,
              updated_by: admin.id,
              created_by_type: "admin",
              updated_by_type: "admin",
            })) : [];

            const allMats = [...legacyMat, ...extraMats];
            if (allMats.length) {
              await Material.bulkCreate(allMats);
            }
            break;
          }
          case "slide":
            let computedSlidesTopicDuration = 0;
            let i = 1;
            for (const slide of topic.slides) {
              let slideDur = 0;
              if (slide.content_type === "video") {
                slideDur = slide.video?.duration_minutes || 0;
              } else if (slide.content_type === "audio") {
                slideDur = slide.audio?.duration_minutes || 0;
              } else if (slide.content_type === "accordian") {
                slideDur = await getAudioDurationInMinutes(slide.audio_url || null);
              } else if (slide.content_type === "general") {
                if (slide.general?.completion_type === "timer") {
                  slideDur = slide.general?.completion_time || 0;
                } else {
                  slideDur = slide.general?.duration_minutes || 0;
                }
              }
              const slideExtra = slide.slide_extra_duration || 0;
              computedSlidesTopicDuration += slideDur + slideExtra;

              const newSlide = await MultiSlide.create({
                topic_id: newTopic.id,
                sequence_no: i,
                title: slide.title,
                description: slide.description,
                type: slide.content_type,
                audio_url: slide.audio_url || null,
                slide_duration: slideDur,
                slide_extra_duration: slideExtra,
                total_slide_duration: slideDur + slideExtra,
                created_by: admin.id,
                updated_by: admin.id,
                created_by_type: "admin",
                updated_by_type: "admin",
              });
              i = i + 1;
              switch (slide.content_type) {
                case "video":
                  await MultiSlideVideo.create({
                    multi_slide_id: newSlide.id,
                    url: slide.video.url,
                    audio_url: slide.video.audio_url || null,
                    duration_minutes: slide.video.duration_minutes,
                    created_by: admin.id,
                    updated_by: admin.id,
                    created_by_type: "admin",
                    updated_by_type: "admin",
                  });
                  break;

                case "audio":
                  await MultiSlideAudio.create({
                    multi_slide_id: newSlide.id,
                    url: slide.audio.url,
                    duration_minutes: slide.audio.duration_minutes,
                    created_by: admin.id,
                    updated_by: admin.id,
                    created_by_type: "admin",
                    updated_by_type: "admin",
                  });
                  break;

                case "accordian":
                  for (const acc of slide.accordions) {
                    await MultiSlideAccordion.create({
                      multi_slide_id: newSlide.id,
                      title: acc.title,
                      body: acc.body,
                      codeLanguage: acc.codeLanguage,
                      code: acc.code,
                      audio_url: acc.audio_url || null,
                      created_by: admin.id,
                      updated_by: admin.id,
                      created_by_type: "admin",
                      updated_by_type: "admin",
                    });
                  }
                  break;

                case "general": {
                  const coreSlideGeneral = await MultiSlideGeneral.create({
                    multi_slide_id: newSlide.id,
                    audio_url: slide.general.audio_url || null,
                    title: slide.general.title,
                    description: slide.general.description,
                    codeLanguage: slide.general.codeLanguage || null,
                    code: slide.general.code || null,
                    completion_type: slide.general.completion_type || 'audio',
                    created_by: admin.id,
                    updated_by: admin.id,
                    created_by_type: "admin",
                    updated_by_type: "admin",
                  });

                  const legacySlideMat = slide.general.url && slide.general.material_type ? [{
                    slide_general_id: coreSlideGeneral.id,
                    material_type: slide.general.material_type,
                    url: slide.general.url,
                    created_by: admin.id,
                    updated_by: admin.id,
                    created_by_type: "admin",
                    updated_by_type: "admin",
                  }] : [];

                  const extraSlideMats = Array.isArray(slide.general.materials) ? slide.general.materials.map(m => ({
                    slide_general_id: coreSlideGeneral.id,
                    material_type: m.material_type,
                    url: m.url,
                    created_by: admin.id,
                    updated_by: admin.id,
                    created_by_type: "admin",
                    updated_by_type: "admin",
                  })) : [];

                  const slideMats = [...legacySlideMat, ...extraSlideMats];
                  if (slideMats.length) {
                    await Material.bulkCreate(slideMats);
                  }
                  break;
                }
              }
            }
            await newTopic.update({
              topic_duration: computedSlidesTopicDuration,
              total_duration: computedSlidesTopicDuration + (extraDuration || 0),
            });
        }

        console.log(
          `✅ Topic "${topic.title}" created under module "${module.title}"`
        );
      }
    }

    // Assignments
    for (const assignmentData of assignments) {
      const module = moduleRecords.find(
        (m) => m.id === assignmentData.module_id
      );
      if (!module) continue;

      // Get the course for this module
      const course = courseRecords.find((c) => c.id === module.course_id);

      // Only create assignments for the matching course
      if (course.title === "Complete IELTS Preparation Course: Band 7+ Score") {
        const newAssignment = await Assignment.create({
          ...assignmentData,
          created_by: admin.id,
          updated_by: admin.id,
        });

        // Create matching questions if this is a matching assignment
        if (
          assignmentData.category === "matching" &&
          assignmentData.matching_questions
        ) {
          for (const question of assignmentData.matching_questions) {
            const matchingQuestion = await MatchingQuestion.create({
              assignment_id: newAssignment.id,
              question_text: question.question_text,
              created_by: admin.id,
              updated_by: admin.id,
              created_by_type: "admin",
              updated_by_type: "admin",
            });

            for (const option of question.options) {
              await MatchingOption.create({
                question_id: matchingQuestion.id,
                option_text: option.option_text,
                option_type: option.option_type,
                match_text: option.match_text,
                match_type: option.match_type,
                created_by: admin.id,
                updated_by: admin.id,
                created_by_type: "admin",
                updated_by_type: "admin",
              });
            }
          }
        }

        // Create fill in the blanks questions
        if (
          assignmentData.category === "fill_in_the_blanks" &&
          assignmentData.fill_blank_questions
        ) {
          for (const question of assignmentData.fill_blank_questions) {
            await FillTheBlanksQuestion.create({
              assignment_id: newAssignment.id,
              question_text: question.question_text,
              answers: question.answers,
              created_by: admin.id,
              updated_by: admin.id,
              created_by_type: "admin",
              updated_by_type: "admin",
            });
          }
        }

        // Create paragraph writing questions
        if (
          assignmentData.category === "paragraph_writing" &&
          assignmentData.paragraph_questions
        ) {
          for (const question of assignmentData.paragraph_questions) {
            await ParagraphWriting.create({
              assignment_id: newAssignment.id,
              paragraph: question.paragraph,
              created_by: admin.id,
              updated_by: admin.id,
              created_by_type: "admin",
              updated_by_type: "admin",
            });
          }
        }

        console.log(
          `✅ Assignment "${newAssignment.title}" created for module "${module.title}"`
        );
      }
    }

    // Predefined questions
    // for (const questionData of predefinedQuestions) {
    //   const question = await PreDefinedQuestions.create({
    //     quiz_id: null,
    //     question_text: questionData.question_text,
    //     question_img: questionData.question_img,
    //     question_type: questionData.question_type,
    //     marks: questionData.marks,
    //     sequence_no: questionData.sequence_no,
    //     created_by: admin.id,
    //     updated_by: admin.id,
    //   });

    //   for (const opt of questionData.options) {
    //     await PreDefinedOptions.create({
    //       pre_defined_question_id: question.id,
    //       option_text: opt.option_text,
    //       is_correct: opt.is_correct,
    //       created_by: admin.id,
    //       updated_by: admin.id,
    //     });
    //   }

    //   console.log(
    //     `✅ Predefined question "${question.question_text}" created.`
    //   );
    // }

    // Quizzes
    for (const quizData of quizzes) {
      const module = moduleRecords.find((m) => m.id === quizData.module_id);
      if (!module) continue;

      // Get the course for this module
      const course = courseRecords.find((c) => c.id === module.course_id);

      // Only create quizzes for the matching course
      if (
        course.title === "Complete IELTS Preparation Course: Band 7+ Score"
      ) {
        const quiz = await Quizzes.create({
          ...quizData,
          module_id: module.id,
          created_by: admin.id,
          updated_by: admin.id,
        });
        console.log(
          `✅ Quiz "${quiz.title}" created for module "${module.title}"`
        );


        // Create all quiz questions using unified structure

        // 1. mcq and True/False Questions
        const quizQuestionSet = quizQuestions.filter(q => q.module_id === module.id);
        for (const questionData of quizQuestionSet) {
          if (questionData.question_type === "mcq" || questionData.question_type === "true-false") {
            const question = await QuizQuestion.create({
              quiz_id: quiz.id,
              type: questionData.question_type === "mcq" ? "mcq" : "mcq", // Both use mcq type
              marks: questionData.marks,
              mcq_question_text: questionData.question_text,
              is_active: true,
              created_by: admin.id || 1,
              updated_by: admin.id || 1,
              created_by_type: "admin",
              updated_by_type: "admin",
            });

            // Create options
            for (const opt of questionData.options) {
              await QuizQuestionOption.create({
                question_id: question.id,
                type: "mcq",
                mcq_option_text: opt.text,
                mcq_is_correct: opt.correct,
                is_active: true,
                created_by: admin.id || 1,
                updated_by: admin.id || 1,
                created_by_type: "admin",
                updated_by_type: "admin",
              });
            }
          } else if (questionData.question_type === "complete-sentence") {
            // Extract correct words and hints from blanks
            const correctWords = questionData.blanks.map(entry => entry.correct_word);
            const hints = questionData.blanks.map(entry => entry.hint);

            const question = await QuizQuestion.create({
              quiz_id: quiz.id,
              type: "complete the sentance",
              marks: questionData.marks,
              mcq_question_text: questionData.question_text,
              is_active: true,
              created_by: admin.id || 1,
              updated_by: admin.id || 1,
              created_by_type: "admin",
              updated_by_type: "admin",
            });

            // Create options for complete sentence
            for (let i = 0; i < correctWords.length; i++) {
              await QuizQuestionOption.create({
                question_id: question.id,
                type: "complete_sentence",
                complate_correct_word: correctWords[i],
                complate_hint: hints[i] || "",
                is_active: true,
                created_by: admin.id || 1,
                updated_by: admin.id || 1,
                created_by_type: "admin",
                updated_by_type: "admin",
              });
            }
          }
        }

        // 2. Audio to Script Questions
        const audioScripts = audioToScriptQuestions.filter(q => q.quiz_id === quiz.id);
        for (const audio of audioScripts) {
          await QuizQuestion.create({
            quiz_id: quiz.id,
            type: "audiotoscript",
            marks: audio.marks || 5,
            audiotoscript_url: audio.url,
            audiotoscript_script: audio.script,
            is_active: true,
            created_by: admin.id || 1,
            updated_by: admin.id || 1,
            created_by_type: "admin",
            updated_by_type: "admin",
          });
        }

        // 3. Real Word Questions
        const realWords = realWordQuestions.filter(q => q.quiz_id === quiz.id);
        for (const real of realWords) {
          await QuizQuestion.create({
            quiz_id: quiz.id,
            type: "realword",
            marks: 5,
            realword_words: real.words,
            realword_correct_answers: real.correct_answers,
            is_active: true,
            created_by: admin.id || 1,
            updated_by: admin.id || 1,
            created_by_type: "admin",
            updated_by_type: "admin",
          });
        }

        // 5. Summarize Passage Questions
        const summarizePassages = summarizePassageQuestions.filter(q => q.quiz_id === quiz.id);
        for (const passage of summarizePassages) {
          let summary;
          try {
            let summarizer = new SummarizerManager(passage.passage, 5);
            let summaryObj = await summarizer.getSummaryByRank();

            if (!summaryObj || typeof summaryObj.summary !== "string" || !summaryObj.summary.trim()) {
              summarizer = new SummarizerManager(passage.passage, 3);
              summaryObj = await summarizer.getSummaryByRank();
            }

            if (summaryObj && typeof summaryObj.summary === "string" && summaryObj.summary.trim()) {
              summary = summaryObj.summary.trim();
            } else {
              console.warn("⚠️ Could not generate summary, using passage as fallback.");
              summary = passage.passage;
            }
          } catch (err) {
            console.warn("⚠️ Error during summarization. Using full passage as summary.");
            console.warn("Reason:", err.message);
            summary = passage.passage;
          }

          await QuizQuestion.create({
            quiz_id: quiz.id,
            type: "summarizepassage",
            marks: 10,
            summarizepassage_summary: summary,
            summarizepassage_time_limit: passage.time_limit,
            is_active: true,
            created_by: admin.id || 1,
            updated_by: admin.id || 1,
            created_by_type: "admin",
            updated_by_type: "admin",
          });

          console.log("✅ Summary passage stored. Summary:", summary);
        }

        // 6. Best Option Questions
        const bestOptionQuizzes = bestOptionQuestions.filter(q => q.quiz_id === quiz.id);
        for (const boq of bestOptionQuizzes) {
          await QuizQuestion.create({
            quiz_id: quiz.id,
            type: "bestoption",
            marks: 5,
            bestoption_passage: boq.passage,
            bestoption_blanked_words: boq.blanked_words,
            is_active: true,
            created_by: admin.id || 1,
            updated_by: admin.id || 1,
            created_by_type: "admin",
            updated_by_type: "admin",
          });
        }

        // 7. Drag Drop Questions (if any)
        // Note: You'll need to add drag drop data to your seed data if you want to include them

        console.log(`✅ All questions added to quiz "${quiz.title}"`);
      }
    }

    console.log("\n🎉 All course data seeded successfully.");
  } catch (error) {
    console.error("❌ Error inserting course data:", error);
  }
};

module.exports = insertDefaultCourseData;
