const sequelize = require("../config/db");
const bcrypt = require("bcryptjs");
const { convert } = require("html-to-text");
const axios = require('axios');
const { getAudioDurationInMinutes } = require("../utils/audioDuration");
const Admin = require("../models/auth/admin");
const User = require("../models/auth/user");
const { CourseCategory } = require("../models/masters/courseCatagory");
const Course = require("../models/course_management/course");
const Session = require("../models/course_management/session");
const Module = require("../models/course_management/module");
const { CourseVersion } = require("../models/partner/approve_request_version/courseVersion");

const Topic = require("../models/course_management/topic");
const { Video } = require("../models/content_management/video");
const { Audio } = require("../models/content_management/audio");
const { Accordion } = require("../models/content_management/accordian");
const { GeneralMaterial } = require("../models/content_management/genral");

const { Material } = require("../models/content_management/material");

const { MultiSlide } = require("../models/content_management/multi_slide");
const { MultiSlideVideo } = require("../models/content_management/multiSlideVideo");
const { MultiSlideAudio } = require("../models/content_management/multiSlideAudio");
const { MultiSlideGeneral } = require("../models/content_management/multiSlideGeneral");
const { MultiSlideAccordion } = require("../models/content_management/multiSlideAccordian");

const { Quizzes } = require("../models/content_management/quizzesModel");
const { QuizQuestion } = require("../models/content_management/quizQuestion");
const { QuizQuestionOption } = require("../models/content_management/quizQuestionOption");
const { SummarizerManager } = require("node-summarizer");

const { generatePublicHash } = require("../utils/course_management/generateHash");




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


const getEmbedding = async (text) => Array(768).fill(0);

// ==============================
// 🔹 Seed Data
// ==============================

const defaultAdmin = {
  username: "admin",
  email: "admin@example.com",
  password: "123",
  roleId: 1
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
    city_id: 1
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
    city_id: 1
  },
];

const courseCategories = [
  { category: "History", id: 4 },
];

const courses = [
  {
    id: 4,
    title: "The Indian Constitution: Foundations of Our Democracy",
    category_id: 4,
    description: "Understand the core principles and development of the Indian Constitution. Explore fundamental rights, duties, governance structures, and the democratic values that shape our nation. This course is ideal for students, aspirants, and anyone keen to understand how India's democratic system functions.",
    price: 100.0,
    discount: 10,
    duration_minutes: 300,
    expiry_days: 90,
    min_access_minutes: 60,
    max_access_minutes: 90,
    what_you_will_learn: [
      "Preamble and its significance",
      "Fundamental Rights & Duties",
      "Structure of Indian Government"
    ],
    skill_development: [
      {
        title: "Civic Literacy",
        statements: ["Understand fundamental rights and civic duties.", "Analyze constitutional amendments and their impact."]
      },
      {
        title: "Legal Analytical Thinking",
        statements: ["Interpret key Supreme Court judgments.", "Differentiate between government branches and their powers."]
      },
      {
        title: "Democratic Participation",
        statements: ["Engage effectively in discussions about democratic processes.", "Formulate informed opinions on contemporary civic issues."]
      }
    ],
    prerequisites: ["Basic understanding of Indian History"],
    hashtags: ["#constitution", "#civics", "#democracy"],
    thumbnail: "/course/thumbnail/constitution.png",
    preview_video: "/course/preview_video/constitution_preview.mp4",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
];

const courseFAQs = [
  {
    course_id: 4,
    question: "Why do you want to learn about the Indian Constitution?",
    created_by: 1,
    updated_by: 1,
    created_by_type: "admin",
    updated_by_type: "admin",
    options: [
      "For competitive exams",
      "For academic interest",
      "To understand democratic rights",
      "Just curious"
    ]
  },
  {
    course_id: 4,
    question: "What is your current understanding of the Constitution?",
    created_by: 1,
    updated_by: 1,
    created_by_type: "admin",
    updated_by_type: "admin",
    options: [
      "Beginner",
      "Intermediate",
      "Advanced"
    ]
  },
  {
    course_id: 4,
    question: "What is your goal after completing this course?",
    created_by: 1,
    updated_by: 1,
    created_by_type: "admin",
    updated_by_type: "admin",
    options: [
      "Prepare for exams",
      "Enhance civic understanding",
      "Engage in discussions",
      "Just for awareness"
    ]
  },
  {
    course_id: 4,
    question: "How much time can you dedicate weekly?",
    created_by: 1,
    updated_by: 1,
    created_by_type: "admin",
    updated_by_type: "admin",
    options: [
      "Less than 5 hours",
      "5-10 hours",
      "10-20 hours",
      "More than 20 hours"
    ]
  },
  {
    course_id: 4,
    question: "What motivates you to learn about the Constitution?",
    created_by: 1,
    updated_by: 1,
    created_by_type: "admin",
    updated_by_type: "admin",
    options: [
      "Civic responsibility",
      "Exams and career",
      "Interest in law",
      "Understanding rights"
    ]
  },
];

const sessions = [
  {
    course_id: 4,
    title: "Introduction to the Constitution",
    chpater_description: "Learn about the making, significance, and vision behind the Indian Constitution.",
    status: "active",
    image_name: "constitution.png",
    image_path: "/session/images/constitution.png",
    min_time_in_minute: 30,
  },
  {
    course_id: 4,
    title: "Fundamental Rights & Duties",
    chpater_description: "Explore the key rights and duties guaranteed by the Constitution to every Indian citizen.",
    status: "active",
    image_name: "constitution.png",
    image_path: "/session/images/constitution.png",
    min_time_in_minute: 40,
  },
  {
    course_id: 4,
    title: "Structure of Government",
    chpater_description: "Understand the roles of the Legislature, Executive, and Judiciary in Indian democracy.",
    status: "active",
    image_name: "constitution.png",
    image_path: "/session/images/constitution.png",
    min_time_in_minute: 35,
  },
  {
    course_id: 4,
    title: "Citizenship and Democratic Process",
    chpater_description: "Examine citizenship provisions, electoral systems, and contemporary issues in Indian democracy.",
    status: "active",
    image_name: "constitution.png",
    image_path: "/session/images/constitution.png",
    min_time_in_minute: 45,
  }
];

const modules = [
  {
    //32
    course_id: 4,
    session_id: 16,
    title: "Making of the Constitution",
    image: "/module/image/constitution.png",
    description: "Learn about the historical background and drafting of the Constitution by the Constituent Assembly.",
    duration_minutes: 60,
    status: "active",
  },
  {
    //33
    course_id: 4,
    session_id: 16,
    title: "Vision and Values in the Preamble",
    image: "/module/image/constitution.png",
    description: "Understand the values enshrined in the Preamble such as justice, liberty, and equality.",
    duration_minutes: 60,
    status: "active",
  },
  {
    //34
    course_id: 4,
    session_id: 17,
    title: "Fundamental Rights",
    image: "/module/image/constitution.png",
    description: "Detailed explanation of the Fundamental Rights provided by the Constitution.",
    duration_minutes: 60,
    status: "active",
  },
  {
    //35
    course_id: 4,
    session_id: 17,
    title: "Fundamental Duties",
    image: "/module/image/constitution.png",
    description: "Responsibilities of citizens as defined in the Constitution.",
    duration_minutes: 60,
    status: "active",
  },
  {
    //36
    course_id: 4,
    session_id: 18,
    title: "Union Government Structure",
    image: "/module/image/constitution.png",
    description: "Roles and responsibilities of Parliament, President, and Prime Minister.",
    duration_minutes: 60,
    status: "active",
  },
  {
    //37
    course_id: 4,
    session_id: 18,
    title: "Judiciary and its Powers",
    image: "/module/image/constitution.png",
    description: "Learn about the Indian Judiciary, Supreme Court, and its powers.",
    duration_minutes: 60,
    status: "active",
  },
  {
    //38
    course_id: 4,
    session_id: 19,
    title: "Citizenship and Elections",
    image: "/module/image/constitution.png",
    description: "Understand citizenship provisions, election processes, and contemporary issues in Indian democracy.",
    duration_minutes: 120,
    status: "active",
  },
];

const constitutionHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Indian Constitution: Foundations of Our Democracy</title>
    <style>
        .constitution-guide {
            font-family: 'Noto Sans', Arial, sans-serif;
            background-color: #f9f9f9;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        .constitution-guide header {
            background: linear-gradient(to right, #0f4c75, #3282b8);
            color: #fff;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .constitution-guide h1 {
            margin: 0;
            font-size: 2.8em;
            font-weight: 700;
        }
        .constitution-guide .subtitle {
            font-size: 1.2em;
            margin-top: 10px;
            font-weight: 300;
        }
        .constitution-guide h2 {
            font-size: 1.8em;
            color: #0f4c75;
            border-bottom: 2px solid #3282b8;
            padding-bottom: 8px;
            margin-top: 40px;
        }
        .constitution-guide section {
            background-color: #ffffff;
            padding: 25px 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            margin-top: 30px;
        }
        .constitution-guide ul {
            padding-left: 25px;
        }
        .constitution-guide li {
            margin-bottom: 12px;
            position: relative;
        }
        .constitution-guide li:before {
            content: "•";
            color: #3282b8;
            font-weight: bold;
            display: inline-block;
            width: 1em;
            margin-left: -1em;
        }
        .constitution-guide .highlight {
            background-color: #bbe1fa;
            padding: 2px 5px;
            border-radius: 3px;
        }
        .constitution-guide .quote {
            border-left: 4px solid #3282b8;
            padding-left: 20px;
            margin: 20px 0;
            font-style: italic;
            color: #555;
        }
        .constitution-guide footer {
            text-align: center;
            margin-top: 60px;
            padding: 25px;
            font-size: 0.9em;
            color: #666;
            border-top: 1px solid #eee;
        }
        .constitution-guide .tricolor {
            height: 5px;
            background: linear-gradient(to right, #ff9933, #ff9933 33%, white 33%, white 66%, #138808 66%);
            margin: 20px 0;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="constitution-guide">
        <div class="tricolor"></div>
        <header>
            <h1>The Indian Constitution</h1>
            <p class="subtitle">Foundations of Our Democracy</p>
        </header>

        <section>
            <h2>Why Study the Constitution?</h2>
            <p>The Constitution of India is not merely a legal document but the <span class="highlight">living framework of the world's largest democracy</span>. Adopted on November 26, 1949, and coming into effect on January 26, 1950, it establishes India as a sovereign, socialist, secular, democratic republic.</p>
            
            <div class="quote">
                "The Constitution is not a mere lawyers' document, it is a vehicle of Life, and its spirit is always the spirit of Age." — Dr. B.R. Ambedkar
            </div>
        </section>

        <section>
            <h2>Key Features of the Indian Constitution</h2>
            <ul>
                <li><strong>Lengthiest Written Constitution:</strong> Originally with 395 Articles and 8 Schedules, now with 448 Articles and 12 Schedules</li>
                <li><strong>Federal System with Unitary Bias:</strong> Unique blend of federal and unitary features</li>
                <li><strong>Fundamental Rights:</strong> Guarantees six categories of rights to citizens (Articles 12-35)</li>
                <li><strong>Directive Principles:</strong> Non-justiciable guidelines for governance (Articles 36-51)</li>
                <li><strong>Independent Judiciary:</strong> With power of judicial review to uphold constitutional supremacy</li>
                <li><strong>Amendment Procedure:</strong> Balanced flexibility and rigidity (Article 368)</li>
            </ul>
        </section>

        <section>
            <h2>Course Structure</h2>
            <p>This comprehensive course covers all essential aspects of the Indian Constitution through <span class="highlight">7 modules and 21 topics</span>, including:</p>
            <ul>
                <li>Historical background and making of the Constitution</li>
                <li>Detailed analysis of the Preamble</li>
                <li>Fundamental Rights and Duties</li>
                <li>Directive Principles of State Policy</li>
                <li>Structure and functions of government organs</li>
                <li>Amendment process and landmark changes</li>
                <li>Contemporary constitutional issues and debates</li>
            </ul>
        </section>

        <section>
            <h2>Learning Outcomes</h2>
            <p>By completing this course, you will:</p>
            <ul>
                <li>Understand the philosophical foundations of the Constitution</li>
                <li>Grasp the rights and responsibilities of Indian citizens</li>
                <li>Comprehend the structure and functioning of Indian democracy</li>
                <li>Analyze important constitutional amendments and judgments</li>
                <li>Engage critically with contemporary constitutional debates</li>
            </ul>
        </section>

        <footer>
            <div class="tricolor"></div>
            &copy; 2025 Constitution Education Initiative | Proudly made in India
        </footer>
    </div>
</body>
</html>
`;

//completed
const constitutionIntroTopics = [
  {
    module_id: 32,
    title: "What is a Constitution? - Video",
    description: constitutionHTML,
    content_type: "video",
    video: {
      url: "/video/constitution_basics.mp4",
      duration_minutes: 12,
      transcript: "A constitution is the supreme law of a country...",
      audio_url: "/audios/video/constitution_audio.mp3",
      bullet_points: [
        { time: 0, text: "Definition of Constitution" },
        { time: 120, text: "Functions of Constitution" },
        { time: 240, text: "Types of Constitutions" }
      ],
    },
  },
  {
    module_id: 32,
    title: "History of Indian Constitution - Accordion",
    description: "Key events in the making of our constitution",
    content_type: "accordian",
    accordions: [
      {
        title: "Constituent Assembly",
        body: "Formation and members of the Constituent Assembly (1946)",
        audio_url: "/audios/accordion/constituent_assembly.mp3",
      },
      {
        title: "Drafting Process",
        body: "How Dr. B.R. Ambedkar and team drafted the constitution",
        audio_url: "/audios/accordion/drafting_process.mp3",
      },
      {
        title: "Adoption & Enforcement",
        body: "Final adoption on November 26, 1949 and enforcement on January 26, 1950",
        audio_url: "/audios/accordion/adoption.mp3",
      },
    ],
  },
  {
    module_id: 32,
    title: "Key Facts - Audio",
    description: "Important facts about the Indian Constitution",
    content_type: "audio",
    audio: {
      url: "/audio/constitution_facts.mp3",
      duration_minutes: 8,
    },
  },
  {
    module_id: 32,
    title: "Constitution Timeline - PDF",
    description: "Visual timeline from 1946 to 1950",
    content_type: "general",
    general: {
      title: "Constitution Making Timeline",
      description: "Chronological events in constitution formation",
      url: "/material/pdf/constitution_timeline.pdf",
      audio_url: "/audios/general/timeline_audio.mp3",
      material_type: "pdf",
    },
  },
  {
    module_id: 32,
    title: "Multi-Slide: Constitution Overview",
    description: "Comprehensive look at constitution basics",
    content_type: "slide",
    slides: [
      // {
      //   title: "Salient Features",
      //   description: "Key characteristics of Indian Constitution",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/features_audio.mp3",
      //     duration_minutes: 5,
      //   },
      // },
      {
        title: "Comparison with Other Constitutions",
        description: "How Indian Constitution differs from others",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/comparison_audio.mp3",
        accordions: [
          {
            title: "US Constitution",
            body: "Comparison of federal structures and fundamental rights",
            audio_url: "/audios/slide_accordion/us_comparison.mp3",
          },
          {
            title: "British Constitution",
            body: "Parliamentary system similarities and differences",
            audio_url: "/audios/slide_accordion/uk_comparison.mp3",
          },
        ],
      },
      // {
      //   title: "Original Constitution Document",
      //   description: "Images and details of original manuscript",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/document_audio.mp3",
      //   general: {
      //     title: "Original Manuscript",
      //     description: "Scans of original constitution pages",
      //     url: "/multiSlide/general/pdf/original_constitution.pdf",
      //     material_type: "pdf",
      //     audio_url: "/audios/slide_general/manuscript_audio.mp3",
      //   },
      // }
    ],
  },
];

//completed
const preambleTopics = [
  {
    module_id: 33,
    title: "Preamble Explained - Video",
    description: "Detailed analysis of the Preamble text",
    content_type: "video",
    video: {
      url: "/video/preamble_explained.mp4",
      duration_minutes: 15,
      transcript: "The Preamble begins with 'We the people of India'...",
      audio_url: "/audios/video/preamble_audio.mp3",
      bullet_points: [
        { time: 0, text: "Opening phrase significance" },
        { time: 180, text: "Key words analysis" },
        { time: 360, text: "42nd Amendment changes" }
      ],
    },
  },
  {
    module_id: 33,
    title: "Keywords Breakdown - Accordion",
    description: "Meaning of Sovereign, Socialist, Secular, etc.",
    content_type: "accordian",
    accordions: [
      {
        title: "Sovereign",
        body: "Complete independence in internal and external matters",
        audio_url: "/audios/accordion/sovereign.mp3",
      },
      {
        title: "Socialist",
        body: "Added by 42nd Amendment, commitment to social equality",
        audio_url: "/audios/accordion/socialist.mp3",
      },
      {
        title: "Secular",
        body: "Equal respect for all religions, no state religion",
        audio_url: "/audios/accordion/secular.mp3",
      },
      {
        title: "Democratic",
        body: "Power flows from the people through elections",
        audio_url: "/audios/accordion/democratic.mp3",
      },
      {
        title: "Republic",
        body: "No hereditary head of state, elected President",
        audio_url: "/audios/accordion/republic.mp3",
      },
    ],
  },
  {
    module_id: 33,
    title: "Kesavananda Bharati Case - Audio",
    description: "Landmark judgment that established Basic Structure doctrine",
    content_type: "audio",
    audio: {
      url: "/audio/kesavananda_case.mp3",
      duration_minutes: 10,
    },
  },
  {
    module_id: 33,
    title: "Original vs Amended Preamble - PDF",
    description: "Comparison of original and current Preamble text",
    content_type: "general",
    general: {
      title: "Preamble Comparison",
      description: "Visual comparison showing changes from 42nd Amendment",
      url: "/material/pdf/preamble_comparison.pdf",
      audio_url: "/audios/general/preamble_audio2.mp3",
      material_type: "pdf",
    },
  },
  {
    module_id: 33,
    title: "Multi-Slide: Preamble Deep Dive",
    description: "Comprehensive analysis of the Preamble's components",
    content_type: "slide",
    slides: [
      {
        title: "Historical Evolution",
        description: "How the Preamble was drafted and evolved",
        content_type: "video",
        video: {
          url: "/multiSlide/video/preamble_evolution.mp4",
          duration_minutes: 7,
          audio_url: "/audios/slide_video/preamble_history_audio.mp3",
        },
      },
      // {
      //   title: "Legal Significance",
      //   description: "Importance of Preamble in constitutional interpretation",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/preamble_legal_audio.mp3",
      //     duration_minutes: 5,
      //   },
      // },
      {
        title: "Word-by-Word Analysis",
        description: "In-depth meaning of each key term",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/preamble_terms_audio.mp3",
        accordions: [
          {
            title: "We the People",
            body: "The Preamble famously begins with 'We the People of India.' This opening phrase holds immense significance, establishing the principle of popular sovereignty. It unequivocally states that the Constitution derives its authority directly from the people of India, not from any external power, monarch, or divine right. It implies that the ultimate power resides with the citizens, who, through their representatives, enacted this supreme law. This declaration is the foundation of India's democratic and republican character, underscoring that the government exists for the people and by the people.",
            audio_url: "/audios/slide_accordion/we_the_people.mp3",
          },
          {
            title: "Justice, Liberty, Equality, Fraternity",
            body: "The Preamble outlines four core values that are the very essence of the Indian Republic: Justice encompasses social, economic, and political fairness, ensuring no discrimination based on caste, creed, or gender, and aiming to eliminate disparities. Liberty signifies freedom of thought, expression, belief, faith, and worship. It's about empowering individuals to develop their personalities, but within reasonable limits. Equality refers to equality of status and opportunity for all citizens. It aims to abolish privileges and discrimination, ensuring everyone has an equal chance to succeed. Fraternity promotes a sense of common brotherhood among all Indians. It assures the dignity of the individual and, crucially, the unity and integrity of the Nation, fostering harmony and solidarity. These values together form the moral compass of our constitutional framework.",
            audio_url: "/audios/slide_accordion/core_values.mp3",
          },
        ],
      },
      // {
      //   title: "Global Comparisons",
      //   description: "Preambles from constitutions around the world",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/global_preambles_audio.mp3",
      //   general: {
      //     title: "Comparative Preambles",
      //     description: "Side-by-side comparison with other nations",
      //     url: "/multiSlide/general/pdf/global_preambles.pdf",
      //     material_type: "pdf",
      //     audio_url: "/audios/slide_general/comparison_audio.mp3",
      //   },
      // },
      {
        title: "Supreme Court Interpretations",
        description: "Key judgments on Preamble's role",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/sc_interpretations_audio.mp3",
        accordions: [
          {
            title: "Berubari Union Case (1960)",
            body: "Initial position that Preamble is not part of Constitution",
            audio_url: "/audios/slide_accordion/berubari_case.mp3",
          },
          {
            title: "Kesavananda Bharati Case (1973)",
            body: "Reversed position - Preamble is part of Constitution",
            audio_url: "/audios/slide_accordion/kesavananda_preamble.mp3",
          },
        ],
      },
      // {
      //   title: "42nd Amendment Impact",
      //   description: "How the Preamble changed in 1976",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/42nd_amendment_impact.mp3",
      //     duration_minutes: 6,
      //   },
      // },
      // {
      //   title: "Preamble in Modern Context",
      //   description: "Contemporary relevance and application",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/modern_context_audio.mp3",
      //   general: {
      //     title: "Modern Significance",
      //     description: "Current debates and applications of Preamble values",
      //     url: "/multiSlide/general/pdf/modern_preamble.pdf",
      //     material_type: "pdf",
      //     audio_url: "/audios/slide_general/modern_audio.mp3",
      //   },
      // }
    ],
  },
];

//completed
const fundamentalRightsTopics = [
  {
    module_id: 34,
    title: "Fundamental Rights Overview - Video",
    description: "Introduction to the 6 categories of Fundamental Rights",
    content_type: "video",
    video: {
      url: "/video/fundamental_rights.mp4",
      duration_minutes: 18,
      transcript: "Part III of the Constitution contains Fundamental Rights...",
      audio_url: "/audios/video/fundamental_rights_audio.mp3",
      bullet_points: [
        { time: 0, text: "Right to Equality (Articles 14-18)" },
        { time: 180, text: "Right to Freedom (Articles 19-22)" },
        { time: 360, text: "Right Against Exploitation (Articles 23-24)" }
      ],
    },
  },
  {
    module_id: 34,
    title: "Landmark Cases - Accordion",
    description: "Important Supreme Court judgments on Fundamental Rights",
    content_type: "accordian",
    accordions: [
      {
        title: "Maneka Gandhi vs Union of India (1978)",
        body: "Expanded scope of Article 21 (Right to Life)",
        audio_url: "/audios/accordion/maneka_gandhi.mp3",
      },
      {
        title: "Kesavananda Bharati vs State of Kerala (1973)",
        body: "Established Basic Structure doctrine",
        audio_url: "/audios/accordion/kesavananda.mp3",
      },
      {
        title: "ADM Jabalpur vs Shivkant Shukla (1976)",
        body: "Habeas Corpus case during Emergency",
        audio_url: "/audios/accordion/adm_jabalpur.mp3",
      },
      {
        title: "Navtej Singh Johar vs Union of India (2018)",
        body: "Decriminalized homosexuality (Article 14, 15, 19, 21)",
        audio_url: "/audios/accordion/navtej_singh.mp3",
      },
    ],
  },
  {
    module_id: 34,
    title: "Reasonable Restrictions - Audio",
    description: "Understanding limits on Fundamental Rights",
    content_type: "audio",
    audio: {
      url: "/audio/restrictions_audio.mp3",
      duration_minutes: 12,
    },
  },
  {
    module_id: 34,
    title: "Fundamental Rights Chart - PDF",
    description: "Visual representation of all Fundamental Rights",
    content_type: "general",
    general: {
      title: "Rights Infographic",
      description: "Diagram showing all Fundamental Rights with Articles",
      url: "/material/pdf/rights_infographic.pdf",
      audio_url: "/audios/general/rights_audio.mp3",
      material_type: "pdf",
    },
  },
  {
    module_id: 34,
    title: "Multi-Slide: Fundamental Rights Deep Dive",
    description: "Comprehensive analysis of each Fundamental Right",
    content_type: "slide",
    slides: [
      {
        title: "Right to Equality (Articles 14-18)",
        description: "Equality before law and equal protection of laws",
        content_type: "video",
        video: {
          url: "/multiSlide/video/equality_rights.mp4",
          duration_minutes: 8,
          audio_url: "/audios/slide_video/equality_audio.mp3",
        },
      },
      // {
      //   title: "Right to Freedom (Articles 19-22)",
      //   description: "Six freedoms and protections against arbitrary arrest",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/freedom_rights_audio.mp3",
      //     duration_minutes: 9,
      //   },
      // },
      {
        title: "Right Against Exploitation (Articles 23-24)",
        description: "Prohibition of trafficking and child labor",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/exploitation_audio.mp3",
        accordions: [
          {
            title: "Article 23: Prohibition of Traffic in Human Beings",
            body: "Laws against human trafficking and forced labor",
            audio_url: "/audios/slide_accordion/trafficking.mp3",
          },
          {
            title: "Article 24: Prohibition of Child Labor",
            body: "Protection of children from hazardous employment",
            audio_url: "/audios/slide_accordion/child_labor.mp3",
          },
        ],
      },
      // {
      //   title: "Right to Freedom of Religion (Articles 25-28)",
      //   description: "Religious freedoms and secular state principles",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/religion_audio_start.mp3",
      //   general: {
      //     title: "Religious Freedom",
      //     description: "Balance between religious rights and state authority",
      //     url: "/multiSlide/general/pdf/religious_freedom.pdf",
      //     material_type: "pdf",
      //     audio_url: "/audios/slide_general/religion_audio.mp3",
      //   },
      // },
      {
        title: "Cultural & Educational Rights (Articles 29-30)",
        description: "Protection of minorities and their institutions",
        content_type: "video",
        video: {
          url: "/multiSlide/video/cultural_rights.mp4",
          duration_minutes: 7,
          audio_url: "/audios/slide_video/cultural_audio.mp3",
        },
      },
      {
        title: "Right to Constitutional Remedies (Article 32)",
        description: "Enforcement mechanisms for rights protection",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/remedies_audio.mp3",
        accordions: [
          {
            title: "Writs under Article 32",
            body: "Habeas Corpus, Mandamus, Prohibition, Certiorari, Quo Warranto",
            audio_url: "/audios/slide_accordion/writs.mp3",
          },
          {
            title: "Supreme Court as Guardian",
            body: "Role of SC in protecting fundamental rights",
            audio_url: "/audios/slide_accordion/sc_guardian.mp3",
          },
        ],
      },
      // {
      //   title: "Evolution of Fundamental Rights",
      //   description: "How interpretations have changed over time",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/rights_evolution.mp3",
      //     duration_minutes: 10,
      //   },
      // },
      // {
      //   title: "Rights During Emergency",
      //   description: "Suspension and limitations during emergency",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/emergency_rights_audio.mp3",
      //   general: {
      //     title: "Emergency Provisions",
      //     description: "Impact on fundamental rights during national emergencies",
      //     url: "/multiSlide/general/pdf/emergency_rights.pdf",
      //     material_type: "pdf",
      //     audio_url: "/audios/slide_general/emergency_audio.mp3",
      //   },
      // }
    ],
  },
];

//completed
const dpspTopics = [
  {
    module_id: 35,
    title: "DPSPs Explained - Video",
    description: "Understanding Directive Principles of State Policy",
    content_type: "video",
    video: {
      url: "/video/dpsp_video.mp4",
      duration_minutes: 14,
      transcript: "DPSPs are guidelines for governance in Part IV of Constitution...",
      audio_url: "/audios/video/dpsp_audio.mp3",
      bullet_points: [
        { time: 0, text: "Socialist Principles" },
        { time: 180, text: "Gandhian Principles" },
        { time: 360, text: "Liberal-Intellectual Principles" }
      ],
    },
  },
  {
    module_id: 35,
    title: "DPSPs vs Fundamental Rights - Accordion",
    description: "Comparison of justiciable vs non-justiciable rights",
    content_type: "accordian",
    accordions: [
      {
        title: "Legal Status",
        body: "Fundamental Rights are enforceable, DPSPs are not",
        audio_url: "/audios/accordion/legal_status.mp3",
      },
      {
        title: "Conflict Resolution",
        body: "How courts balance FRs and DPSPs in judgments",
        audio_url: "/audios/accordion/conflict_resolution.mp3",
      },
      {
        title: "Important Cases",
        body: "Judgments that harmonized FRs and DPSPs",
        audio_url: "/audios/accordion/important_cases.mp3",
      },
    ],
  },
  {
    module_id: 35,
    title: "Implemented DPSPs - Audio",
    description: "Examples of DPSPs that have been implemented",
    content_type: "audio",
    audio: {
      url: "/audio/implemented_dpsp.mp3",
      duration_minutes: 9,
    },
  },
  {
    module_id: 35,
    title: "Multi-Slide: DPSP Categories & Implementation",
    description: "Comprehensive coverage of all DPSP types and their implementation",
    content_type: "slide",
    slides: [
      {
        title: "Socialist Principles (Articles 38-39A)",
        description: "Economic justice and welfare state provisions",
        content_type: "video",
        video: {
          url: "/multiSlide/video/socialist_dpsp.mp4",
          duration_minutes: 7,
          audio_url: "/audios/slide_video/socialist_audio.mp3",
        },
      },
      // {
      //   title: "Gandhian Principles (Articles 40-48)",
      //   description: "Village panchayats, cottage industries, prohibition",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/gandhian_dpsp_audio.mp3",
      //     duration_minutes: 8,
      //   },
      // },
      {
        title: "Liberal-Intellectual Principles (Articles 44-50)",
        description: "Uniform civil code, education, international peace",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/liberal_dpsp_audio.mp3",
        accordions: [
          {
            title: "Article 44: Uniform Civil Code",
            body: "Status and debates on personal law reforms",
            audio_url: "/audios/slide_accordion/ucc.mp3",
          },
          {
            title: "Article 45: Early Childhood Care",
            body: "Education provisions for children under 6 years",
            audio_url: "/audios/slide_accordion/childhood_care.mp3",
          },
        ],
      },
      // {
      //   title: "Implementation Through Legislation",
      //   description: "Laws enacted to fulfill DPSP objectives",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/dpsp_laws_audio.mp3",
      //   general: {
      //     title: "DPSP Legislation",
      //     description: "Key acts implementing DPSPs over the years",
      //     url: "/multiSlide/general/pdf/dpsp_legislation.pdf",
      //     material_type: "pdf",
      //     audio_url: "/audios/slide_general/legislation_audio.mp3",
      //   },
      // },
      {
        title: "Judicial Interpretation of DPSPs",
        description: "How courts have viewed DPSPs over time",
        content_type: "video",
        video: {
          url: "/multiSlide/video/dpsp_courts.mp4",
          duration_minutes: 9,
          audio_url: "/audios/slide_video/courts_dpsp_audio.mp3",
        },
      },
      {
        title: "Challenges in Implementation",
        description: "Obstacles to DPSP realization",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/challenges_audio.mp3",
        accordions: [
          {
            title: "Resource Constraints",
            body: "Economic limitations in implementing welfare policies",
            audio_url: "/audios/slide_accordion/resources.mp3",
          },
          {
            title: "Political Factors",
            body: "How politics impacts DPSP implementation",
            audio_url: "/audios/slide_accordion/politics_dpsp.mp3",
          },
        ],
      },
      // {
      //   title: "International Comparisons",
      //   description: "Similar provisions in other constitutions",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/international_dpsp.mp3",
      //     duration_minutes: 6,
      //   },
      // },
      // {
      //   title: "Future of DPSPs",
      //   description: "Evolving role in contemporary governance",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/future_dpsp_audio.mp3",
      //   general: {
      //     title: "DPSP Evolution",
      //     description: "Emerging trends and future directions",
      //     url: "/multiSlide/general/pdf/dpsp_future.pdf",
      //     material_type: "pdf",
      //     audio_url: "/audios/slide_general/future_audio.mp3",
      //   },
      // }
    ],
  },
];

//completed
const governmentStructureTopics = [
  {
    module_id: 36,
    title: "Three Branches - Video",
    description: "Legislature, Executive and Judiciary explained",
    content_type: "video",
    video: {
      url: "/video/gov_structure.mp4",
      duration_minutes: 16,
      transcript: "Indian government follows separation of powers...",
      audio_url: "/audios/video/gov_audio.mp3",
      bullet_points: [
        { time: 0, text: "Legislature: Parliament" },
        { time: 180, text: "Executive: President to Bureaucracy" },
        { time: 360, text: "Judiciary: Supreme Court to Lower Courts" }
      ],
    },
  },
  {
    module_id: 36,
    title: "Union Executive - Accordion",
    description: "President, Prime Minister and Council of Ministers",
    content_type: "accordian",
    accordions: [
      {
        title: "President",
        body: "Head of State with constitutional powers",
        audio_url: "/audios/accordion/president.mp3",
      },
      {
        title: "Prime Minister",
        body: "Head of Government and real executive power",
        audio_url: "/audios/accordion/pm.mp3",
      },
      {
        title: "Council of Ministers",
        body: "Cabinet Ministers, Ministers of State, and Deputy Ministers",
        audio_url: "/audios/accordion/council_ministers.mp3",
      },
    ],
  },
  {
    module_id: 36,
    title: "Parliament Structure - Audio",
    description: "Lok Sabha and Rajya Sabha composition",
    content_type: "audio",
    audio: {
      url: "/audio/parliament_structure.mp3",
      duration_minutes: 11,
    },
  },
  {
    module_id: 36,
    title: "Multi-Slide: Government Structure Deep Dive",
    description: "Comprehensive analysis of Indian governmental framework",
    content_type: "slide",
    slides: [
      {
        title: "Union Legislature",
        description: "Parliament structure and functioning",
        content_type: "video",
        video: {
          url: "/multiSlide/video/parliament_deep.mp4",
          duration_minutes: 9,
          audio_url: "/audios/slide_video/parliament_audio.mp3",
        },
      },
      // {
      //   title: "Union Executive",
      //   description: "Powers and functions of President and PM",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/executive_deep_audio.mp3",
      //     duration_minutes: 7,
      //   },
      // },
      {
        title: "Union Judiciary",
        description: "Supreme Court structure and jurisdiction",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/judiciary_audio.mp3",
        accordions: [
          {
            title: "Supreme Court Composition",
            body: "CJI and judges, appointment process",
            audio_url: "/audios/slide_accordion/sc_composition.mp3",
          },
          {
            title: "Judicial Review Power",
            body: "Constitutional authority to review laws",
            audio_url: "/audios/slide_accordion/judicial_review.mp3",
          },
        ],
      },
      // {
      //   title: "State Government Structure",
      //   description: "Governor, CM, legislature, and judiciary",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/state_gov_audio_start.mp3",
      //   general: {
      //     title: "State Governance",
      //     description: "Structure of state governments under federal system",
      //     url: "/multiSlide/general/pdf/state_government.pdf",
      //     material_type: "pdf",
      //     audio_url: "/audios/slide_general/state_gov_audio.mp3",
      //   },
      // },
      {
        title: "Local Government Bodies",
        description: "Panchayati Raj and Municipal systems",
        content_type: "video",
        video: {
          url: "/multiSlide/video/local_gov.mp4",
          duration_minutes: 8,
          audio_url: "/audios/slide_video/local_gov_audio.mp3",
        },
      },
      {
        title: "Federal Relations",
        description: "Centre-State distribution of powers",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/federal_audio.mp3",
        accordions: [
          {
            title: "Union, State, and Concurrent Lists",
            body: "Distribution of legislative powers",
            audio_url: "/audios/slide_accordion/lists.mp3",
          },
          {
            title: "Article 356: President's Rule",
            body: "Emergency provisions for state failure",
            audio_url: "/audios/slide_accordion/presidents_rule.mp3",
          },
        ],
      },
      // {
      //   title: "Constitutional Bodies",
      //   description: "Election Commission, UPSC, CAG, etc.",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/constitutional_bodies.mp3",
      //     duration_minutes: 10,
      //   },
      // },
      // {
      //   title: "Government Machinery",
      //   description: "Civil services and bureaucracy",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/bureaucracy_audio_start.mp3",
      //   general: {
      //     title: "Administrative Structure",
      //     description: "Organization of civil services in India",
      //     url: "/multiSlide/general/pdf/civil_services.pdf",
      //     material_type: "pdf",
      //     audio_url: "/audios/slide_general/bureaucracy_audio.mp3",
      //   },
      // }
    ],
  },
];

//completed
const amendmentsTopics = [
  {
    module_id: 37,
    title: "Amendment Process - Video",
    description: "How the Constitution can be amended",
    content_type: "video",
    video: {
      url: "/video/amendment_process.mp4",
      duration_minutes: 12,
      transcript: "Article 368 provides amendment procedures...",
      audio_url: "/audios/video/amendment_audio.mp3",
      bullet_points: [
        { time: 0, text: "Simple Majority" },
        { time: 120, text: "Special Majority" },
        { time: 240, text: "Special Majority + State Ratification" }
      ],
    },
  },
  {
    module_id: 37,
    title: "Landmark Amendments - Accordion",
    description: "Important constitutional amendments",
    content_type: "accordian",
    accordions: [
      {
        title: "42nd Amendment (1976)",
        body: "Most comprehensive amendment during Emergency",
        audio_url: "/audios/accordion/42nd.mp3",
      },
      {
        title: "44th Amendment (1978)",
        body: "Undid some 42nd Amendment changes post-Emergency",
        audio_url: "/audios/accordion/44th.mp3",
      },
      {
        title: "73rd & 74th Amendments (1992)",
        body: "Constitutionalized Panchayati Raj and Municipalities",
        audio_url: "/audios/accordion/73_74.mp3",
      },
      {
        title: "101st Amendment (2016)",
        body: "Introduced Goods and Services Tax (GST)",
        audio_url: "/audios/accordion/101st.mp3",
      },
    ],
  },
  {
    module_id: 37,
    title: "Multi-Slide: Constitutional Amendments Deep Dive",
    description: "Comprehensive analysis of key amendments and their impacts",
    content_type: "slide",
    slides: [
      {
        title: "Amendment Procedures",
        description: "Different pathways for constitutional amendments",
        content_type: "video",
        video: {
          url: "/multiSlide/video/amendment_types.mp4",
          duration_minutes: 6,
          audio_url: "/audios/slide_video/amendment_types_audio.mp3",
        },
      },
      // {
      //   title: "First Amendment (1951)",
      //   description: "Restrictions on freedom of speech and property rights",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/first_amendment.mp3",
      //     duration_minutes: 5,
      //   },
      // },
      {
        title: "Emergency Period Amendments",
        description: "Controversial changes during 1975-77",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/emergency_amendments_audio.mp3",
        accordions: [
          {
            title: "42nd Amendment (1976)",
            body: "Mini-constitution with wide-ranging changes",
            audio_url: "/audios/slide_accordion/42nd_details.mp3",
          },
          {
            title: "44th Amendment (1978)",
            body: "Post-Emergency restoration of democratic safeguards",
            audio_url: "/audios/slide_accordion/44th_details.mp3",
          },
        ],
      },
      // {
      //   title: "Property Rights Amendments",
      //   description: "Evolution of property rights in Constitution",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/property_amendments_audio.mp3",
      //   general: {
      //     title: "Property Rights Evolution",
      //     description: "From fundamental right to constitutional right",
      //     url: "/multiSlide/general/pdf/property_amendments.pdf",
      //     material_type: "pdf",
      //     audio_url: "/audios/slide_general/property_audio.mp3",
      //   },
      // },
      {
        title: "Landmark Judicial Pronouncements",
        description: "Court cases affecting amendment powers",
        content_type: "video",
        video: {
          url: "/multiSlide/video/amendment_cases.mp4",
          duration_minutes: 8,
          audio_url: "/audios/slide_video/amendment_cases_audio.mp3",
        },
      },
      {
        title: "Constitutional Reforms",
        description: "Major reformative amendments",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/reform_amendments_audio.mp3",
        accordions: [
          {
            title: "73rd & 74th Amendments (1992)",
            body: "Local self-government institutions strengthened",
            audio_url: "/audios/slide_accordion/local_govt_amendments.mp3",
          },
          {
            title: "GST Amendments",
            body: "101st Amendment introducing uniform taxation",
            audio_url: "/audios/slide_accordion/gst_amendments.mp3",
          },
        ],
      },
      // {
      //   title: "Reservation Policy Amendments",
      //   description: "Evolution of reservation provisions",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/reservation_amendments.mp3",
      //     duration_minutes: 7,
      //   },
      // },
      // {
      //   title: "Recent Significant Amendments",
      //   description: "Major constitutional changes in last decade",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/recent_amendments_audio.mp3",
      //   general: {
      //     title: "Recent Amendments",
      //     description: "Analysis of amendments from 2010 onwards",
      //     url: "/multiSlide/general/pdf/recent_amendments.pdf",
      //     material_type: "pdf",
      //     audio_url: "/audios/slide_general/recent_audio.mp3",
      //   },
      // }
    ],
  },
];

//completed
const citizenshipTopics = [
  {
    module_id: 38,
    title: "Citizenship Provisions - Video",
    description: "Constitutional provisions for Indian citizenship",
    content_type: "video",
    video: {
      url: "/video/citizenship.mp4",
      duration_minutes: 14,
      transcript: "Part II of Constitution deals with citizenship...",
      audio_url: "/audios/video/citizenship_audio.mp3",
      bullet_points: [
        { time: 0, text: "Articles 5-11 on Citizenship" },
        { time: 180, text: "Citizenship Act 1955" },
        { time: 360, text: "Recent amendments and debates" }
      ],
    },
  },
  {
    module_id: 38,
    title: "Election Process - Accordion",
    description: "How elections work in India",
    content_type: "accordian",
    accordions: [
      {
        title: "Election Commission",
        body: "Constitutional body overseeing elections",
        audio_url: "/audios/accordion/eci.mp3",
      },
      {
        title: "Voting Process",
        body: "From voter registration to result declaration",
        audio_url: "/audios/accordion/voting_process.mp3",
      },
      {
        title: "Electoral Reforms",
        body: "EVMs, VVPATs and other improvements",
        audio_url: "/audios/accordion/electoral_reforms.mp3",
      },
    ],
  },
  {
    module_id: 38,
    title: "Contemporary Issues - Audio",
    description: "Current debates like CAA, Electoral Bonds",
    content_type: "audio",
    audio: {
      url: "/audio/contemporary_issues.mp3",
      duration_minutes: 15,
    },
  },
  {
    module_id: 38,
    title: "Multi-Slide: Citizenship in India",
    description: "Comprehensive exploration of Indian citizenship",
    content_type: "slide",
    slides: [
      {
        title: "Types of Citizenship",
        description: "Different ways to acquire Indian citizenship",
        content_type: "video",
        video: {
          url: "/multiSlide/video/citizenship_types.mp4",
          duration_minutes: 7,
          audio_url: "/audios/slide_video/citizenship_types_audio.mp3",
        },
      },
      // {
      //   title: "Citizenship by Birth",
      //   description: "Constitutional provisions for citizenship by birth",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/birth_citizenship_audio.mp3",
      //     duration_minutes: 4,
      //   },
      // },
      {
        title: "Citizenship by Registration",
        description: "Process and eligibility for registration",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/registration_audio.mp3",
        accordions: [
          {
            title: "Eligibility Criteria",
            body: "Who can apply for citizenship by registration",
            audio_url: "/audios/slide_accordion/eligibility_registration.mp3",
          },
          {
            title: "Documentation",
            body: "Required documents and application process",
            audio_url: "/audios/slide_accordion/documentation_registration.mp3",
          },
        ],
      },
      // {
      //   title: "Citizenship by Naturalization",
      //   description: "Requirements and procedure",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/naturalization_audio.mp3",
      //   general: {
      //     title: "Naturalization Process",
      //     description: "Step-by-step guide to naturalization",
      //     url: "/multiSlide/general/pdf/naturalization_guide.pdf",
      //     material_type: "pdf",
      //     audio_url: "/audios/slide_general/naturalization_process_audio.mp3",
      //   },
      // },
      {
        title: "Overseas Citizenship of India (OCI)",
        description: "Rights and limitations of OCI cardholders",
        content_type: "video",
        video: {
          url: "/multiSlide/video/oci_explained.mp4",
          duration_minutes: 8,
          audio_url: "/audios/slide_video/oci_audio.mp3",
        },
      },
      {
        title: "Loss of Citizenship",
        description: "How Indian citizenship can be terminated",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/loss_citizenship_audio.mp3",
        accordions: [
          {
            title: "Renunciation",
            body: "Voluntary giving up of Indian citizenship",
            audio_url: "/audios/slide_accordion/renunciation.mp3",
          },
          {
            title: "Termination",
            body: "When citizenship can be revoked by the government",
            audio_url: "/audios/slide_accordion/termination.mp3",
          },
        ],
      },
      // {
      //   title: "Citizenship Amendment Act",
      //   description: "Recent changes and their implications",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/caa_explained_audio.mp3",
      //     duration_minutes: 10,
      //   },
      // },
      // {
      //   title: "Citizenship Case Studies",
      //   description: "Real-world examples and legal precedents",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/case_studies_audio.mp3",
      //   general: {
      //     title: "Legal Precedents",
      //     description: "Important Supreme Court judgments on citizenship",
      //     url: "/multiSlide/general/pdf/citizenship_cases.pdf",
      //     material_type: "pdf",
      //     audio_url: "/audios/slide_general/legal_cases_audio.mp3",
      //   },
      // }
    ],
  },
];

const assignments = [
  // Module 1: Making of the Constitution
  {
    module_id: 32,
    title: "Constitutional Assembly Analysis",
    description: "Analyze the composition and working of the Constitutional Assembly",
    file: "/assignments/file/constitution-assembly-timeline.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    max_score: 100,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 32,
    title: "Constitutional Influences Matching",
    description: "Match constitutional provisions with their foreign influences",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    max_score: 50,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match the constitutional provisions with their source of inspiration",
        options: [
          {
            option_text: "Fundamental Rights",
            option_type: "text",
            match_text: "USA",
            match_type: "text"
          },
          {
            option_text: "Parliamentary System",
            option_type: "text",
            match_text: "UK",
            match_type: "text"
          },
          {
            option_text: "Directive Principles",
            option_type: "text",
            match_text: "Ireland",
            match_type: "text"
          },
          {
            option_text: "Emergency Provisions",
            option_type: "text",
            match_text: "Germany (Weimar)",
            match_type: "text"
          },
          {
            option_text: "Fundamental Duties",
            option_type: "text",
            match_text: "USSR",
            match_type: "text"
          }
        ]
      }
    ]
  },
  // {
  //   module_id: 32,
  //   title: "Constitutional Facts True/False",
  //   description: "Test your knowledge of constitutional history",
  //   file: null,
  //   due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
  //   max_score: 30,
  //   status: "active",
  //   category: "true_false",
  //   created_by_type: "admin",
  //   updated_by_type: "admin",
  //   true_false_questions: [
  //     {
  //       question_text: "The Constitution of India was adopted on January 26, 1950",
  //       correct_answer: false
  //     },
  //     {
  //       question_text: "Dr. B.R. Ambedkar was the Chairman of the Drafting Committee",
  //       correct_answer: true
  //     },
  //     {
  //       question_text: "The original Constitution had 395 articles",
  //       correct_answer: true
  //     },
  //     {
  //       question_text: "The Indian Constitution is entirely a written constitution",
  //       correct_answer: true
  //     },
  //     {
  //       question_text: "The Constituent Assembly took exactly 2 years to draft the Constitution",
  //       correct_answer: false
  //     }
  //   ]
  // },
  {
    module_id: 32,
    title: "Fill in the Blanks - Constitution Making",
    description: "Complete sentences about the making of the Indian Constitution",
    file: null,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    max_score: 40,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text: "The Indian Constitution was adopted on _____ (date)",
        answers: ["November 26, 1949"]
      },
      {
        question_text: "The Constituent Assembly took _____ years, _____ months, and _____ days to complete the Constitution",
        answers: ["2 years", "11 months", "17 days"]
      },
      {
        question_text: "_____ was the President of the Constituent Assembly",
        answers: ["Dr. Rajendra Prasad"]
      },
      {
        question_text: "The Constitution of India came into effect on _____",
        answers: ["January 26, 1950"]
      }
    ]
  },
  {
    module_id: 32,
    title: "Constitution Making Essay",
    description: "Write about the challenges faced during Constitution making",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    max_score: 50,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph: "The Constituent Assembly faced immense challenges while drafting the Indian Constitution. Foremost was India's vast diversity, encompassing numerous languages, religions, and social stratifications. This was addressed by ensuring broad representation in the Assembly and adopting a secular, inclusive framework with fundamental rights and directive principles to protect all citizens. Another major hurdle was the trauma of Partition and communal violence, necessitating the creation of a strong, unified nation. The Assembly responded by opting for a strong federal structure, carefully defining citizenship, and rejecting separate electorates to promote national integration. The integration of over 500 princely states was a complex political task, resolved largely through the diplomatic efforts of Sardar Vallabhbhai Patel, leading to their accession into the Indian Union. Furthermore, deep-seated socio-economic inequalities, like untouchability and widespread poverty, demanded constitutional remedies. The Assembly addressed this by abolishing untouchability, introducing affirmative action (reservations), and outlining Directive Principles for state-led social welfare. Finally, selecting a stable political system for a newly independent nation led to the adoption of a parliamentary democracy and a unique quasi-federal structure, balancing central authority with state autonomy. The Assembly's methodical approach, relying on expert committees, extensive debates, and drawing from global constitutional best practices, allowed it to overcome these formidable challenges and produce a robust constitution."
      }
    ]
  },

  // Module 2: Vision and Values in the Preamble
  {
    module_id: 33,
    title: "Preamble Analysis Assignment",
    description: "Analyze the key values enshrined in the Preamble",
    file: "/assignments/file/preamble-comparison.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    max_score: 100,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 33,
    title: "Preamble Values Matching",
    description: "Match Preamble values with their meanings",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    max_score: 50,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match the Preamble values with their meanings",
        options: [
          {
            option_text: "Sovereign",
            option_type: "text",
            match_text: "Free from external control",
            match_type: "text"
          },
          {
            option_text: "Socialist",
            option_type: "text",
            match_text: "Economic and social equality",
            match_type: "text"
          },
          {
            option_text: "Secular",
            option_type: "text",
            match_text: "Equal respect for all religions",
            match_type: "text"
          },
          {
            option_text: "Democratic",
            option_type: "text",
            match_text: "People have supreme power",
            match_type: "text"
          },
          {
            option_text: "Republic",
            option_type: "text",
            match_text: "Elected head of state",
            match_type: "text"
          }
        ]
      }
    ]
  },
  // {
  //   module_id: 33,
  //   title: "Preamble True/False",
  //   description: "Test your knowledge of the Preamble",
  //   file: null,
  //   due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
  //   max_score: 30,
  //   status: "active",
  //   category: "true_false",
  //   created_by_type: "admin",
  //   updated_by_type: "admin",
  //   true_false_questions: [
  //     {
  //       question_text: "The words 'Socialist' and 'Secular' were part of the original Preamble",
  //       correct_answer: false
  //     },
  //     {
  //       question_text: "The Preamble begins with the words 'We, the people of India'",
  //       correct_answer: true
  //     },
  //     {
  //       question_text: "The Preamble is not enforceable in a court of law",
  //       correct_answer: true
  //     },
  //     {
  //       question_text: "The Preamble was amended by the 44th Constitutional Amendment",
  //       correct_answer: false
  //     },
  //     {
  //       question_text: "According to the Supreme Court, the Preamble is part of the Basic Structure",
  //       correct_answer: true
  //     }
  //   ]
  // },
  {
    module_id: 33,
    title: "Fill in the Blanks - Preamble",
    description: "Complete sentences about the Preamble",
    file: null,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    max_score: 40,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text: "The words 'Socialist' and 'Secular' were added to the Preamble by the _____ Amendment",
        answers: ["42"]
      },
      {
        question_text: "The Preamble guarantees _____, _____, _____, and _____ to all citizens",
        answers: ["justice", "liberty", "equality", "fraternity"]
      },
      {
        question_text: "The phrase 'dignity of the individual' is related to the value of _____ in the Preamble",
        answers: ["fraternity"]
      },
      {
        question_text: "In the Kesavananda Bharati case, the Supreme Court held that the Preamble is part of the _____ of the Constitution",
        answers: ["Basic Structure"]
      }
    ]
  },
  {
    module_id: 33,
    title: "Preamble Essay",
    description: "Write about the importance of the Preamble",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    max_score: 50,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph: "The Preamble is called the 'soul of the Constitution' because it embodies the core values, philosophy, and aspirations of the Indian nation. Starting with We, the People of India, it establishes popular sovereignty, signifying that the Constitution's authority flows from its citizens. It then declares India to be a Sovereign, Socialist, Secular, Democratic, Republic, outlining the fundamental nature of the Indian state. Furthermore, it sets out the Constitution's noble objectives: to secure Justice (social, economic, political), Liberty (of thought, expression, belief, faith, worship), Equality (of status and opportunity), and promote Fraternity (assuring dignity of the individual and unity of the nation). Thus, the Preamble serves as a guiding light, reflecting the constitutional philosophy of a free, equitable, and united India, and acting as a key to understanding the spirit and intent of the entire document."
      }
    ]
  },

  // Module 3: Fundamental Rights
  {
    module_id: 34,
    title: "Fundamental Rights Analysis",
    description: "Analyze the six categories of Fundamental Rights",
    file: "/assignments/file/fundamental-rights-chart.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    max_score: 100,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 34,
    title: "Rights Articles Matching",
    description: "Match Fundamental Rights with their corresponding Articles",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    max_score: 50,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match the Fundamental Rights with their corresponding Articles",
        options: [
          {
            option_text: "Right to Equality",
            option_type: "text",
            match_text: "Articles 14-18",
            match_type: "text"
          },
          {
            option_text: "Right to Freedom",
            option_type: "text",
            match_text: "Articles 19-22",
            match_type: "text"
          },
          {
            option_text: "Right Against Exploitation",
            option_type: "text",
            match_text: "Articles 23-24",
            match_type: "text"
          },
          {
            option_text: "Right to Freedom of Religion",
            option_type: "text",
            match_text: "Articles 25-28",
            match_type: "text"
          },
          {
            option_text: "Cultural and Educational Rights",
            option_type: "text",
            match_text: "Articles 29-30",
            match_type: "text"
          },
          {
            option_text: "Right to Constitutional Remedies",
            option_type: "text",
            match_text: "Article 32",
            match_type: "text"
          }
        ]
      }
    ]
  },
  // {
  //   module_id: 34,
  //   title: "Fundamental Rights True/False",
  //   description: "Test your knowledge of Fundamental Rights",
  //   file: null,
  //   due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
  //   max_score: 30,
  //   status: "active",
  //   category: "true_false",
  //   created_by_type: "admin",
  //   updated_by_type: "admin",
  //   true_false_questions: [
  //     {
  //       question_text: "Fundamental Rights are available only to citizens of India",
  //       correct_answer: false
  //     },
  //     {
  //       question_text: "Right to Property was originally a Fundamental Right",
  //       correct_answer: true
  //     },
  //     {
  //       question_text: "Article 14 guarantees equality before law to all persons",
  //       correct_answer: true
  //     },
  //     {
  //       question_text: "Reasonable restrictions can be imposed on all Fundamental Rights",
  //       correct_answer: false
  //     },
  //     {
  //       question_text: "Dr. Ambedkar called Article 32 the 'heart and soul' of the Constitution",
  //       correct_answer: true
  //     }
  //   ]
  // },
  {
    module_id: 34,
    title: "Fill in the Blanks - Fundamental Rights",
    description: "Complete sentences about Fundamental Rights",
    file: null,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    max_score: 40,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text: "Article _____ provides for the Right to Life and Personal Liberty",
        answers: ["21"]
      },
      {
        question_text: "Right to Property was removed as a Fundamental Right by the _____ Amendment",
        answers: ["44"]
      },
      {
        question_text: "Article _____ prohibits untouchability in any form",
        answers: ["17"]
      },
      {
        question_text: "_____ is a writ issued to produce a detained person before the court",
        answers: ["Habeas Corpus"]
      },
      {
        question_text: "The Right to Education under Article 21A was added by the _____ Amendment",
        answers: ["86"]
      }
    ]
  },
  {
    module_id: 34,
    title: "Fundamental Rights Essay",
    description: "Write about the importance of Fundamental Rights",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    max_score: 50,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph: "Article 21 of the Indian Constitution, stating No person shall be deprived of his life or personal liberty except according to procedure established by law, has undergone a transformative expansion through the Supreme Court's judicial activism, moving far beyond mere physical existence. This evolution began with the landmark Maneka Gandhi v. Union of India (1978) case, which introduced the concept that the procedure established by law must be fair, just, and reasonable, not arbitrary. Subsequently, the Court has interpreted life to mean a life with human dignity, encompassing a plethora of implied rights. For instance, in Olga Tellis v. Bombay Municipal Corporation (1985), the Court recognized the Right to Livelihood as integral to the right to life. The Right to a Clean Environment was included in cases like M.C. Mehta v. Union of India (1987), while the Right to Health was affirmed in Parmanand Katara v. Union of India (1989). The Right to Education was declared a fundamental right under Article 21 in Unni Krishnan v. State of Andhra Pradesh (1993), later explicitly added as Article 21A. More recently, the Right to Privacy was affirmed in K.S. Puttaswamy v. Union of India (2017), and the Right to Die with Dignity (passive euthanasia) was recognized in Common Cause v. Union of India (2018). This expansive interpretation has made Article 21 a dynamic and pivotal protector of human rights in India, adapting to societal changes and ensuring a dignified existence for all."
      }
    ]
  },

  // Module 4: Fundamental Duties
  {
    module_id: 35,
    title: "Fundamental Duties Analysis",
    description: "Analyze the Fundamental Duties of citizens",
    file: "/assignments/file/fundamental-duties.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    max_score: 100,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 35,
    title: "Directive Principles Matching",
    description: "Match Directive Principles with their categories",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    max_score: 50,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match the Directive Principles with their categories",
        options: [
          {
            option_text: "Equal pay for equal work",
            option_type: "text",
            match_text: "Socialist Principles",
            match_type: "text"
          },
          {
            option_text: "Protection of monuments",
            option_type: "text",
            match_text: "Liberal-Intellectual Principles",
            match_type: "text"
          },
          {
            option_text: "Prohibition of cow slaughter",
            option_type: "text",
            match_text: "Gandhian Principles",
            match_type: "text"
          },
          {
            option_text: "Promotion of cottage industries",
            option_type: "text",
            match_text: "Gandhian Principles",
            match_type: "text"
          },
          {
            option_text: "Uniform Civil Code",
            option_type: "text",
            match_text: "Liberal-Intellectual Principles",
            match_type: "text"
          }
        ]
      }
    ]
  },
  // {
  //   module_id: 35,
  //   title: "Duties and DPSPs True/False",
  //   description: "Test your knowledge of Duties and Directive Principles",
  //   file: null,
  //   due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
  //   max_score: 30,
  //   status: "active",
  //   category: "true_false",
  //   created_by_type: "admin",
  //   updated_by_type: "admin",
  //   true_false_questions: [
  //     {
  //       question_text: "Fundamental Duties were part of the original Constitution",
  //       correct_answer: false
  //     },
  //     {
  //       question_text: "Directive Principles are justiciable in courts",
  //       correct_answer: false
  //     },
  //     {
  //       question_text: "There are 11 Fundamental Duties in the Constitution",
  //       correct_answer: true
  //     },
  //     {
  //       question_text: "Fundamental Duties were added by the 42nd Amendment",
  //       correct_answer: true
  //     },
  //     {
  //       question_text: "Directive Principles are contained in Part IV of the Constitution",
  //       correct_answer: true
  //     }
  //   ]
  // },
  {
    module_id: 35,
    title: "Fill in the Blanks - Duties and DPSPs",
    description: "Complete sentences about Duties and Directive Principles",
    file: null,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    max_score: 40,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text: "Fundamental Duties are mentioned in Article _____ of the Constitution",
        answers: ["51A"]
      },
      {
        question_text: "The _____ Amendment added the duty to provide opportunities for education to children",
        answers: ["86"]
      },
      {
        question_text: "Directive Principles were inspired by the Constitution of _____",
        answers: ["Ireland"]
      },
      {
        question_text: "Article _____ directs the state to secure a Uniform Civil Code",
        answers: ["44"]
      }
    ]
  },
  {
    module_id: 35,
    title: "DPSPs and Duties Essay",
    description: "Write about the relationship between DPSPs and Fundamental Rights",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    max_score: 50,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph: "The relationship between Fundamental Rights (FRs) and Directive Principles of State Policy (DPSPs) has evolved significantly in India's constitutional jurisprudence, moving from an initial position of FR supremacy to one of harmonious construction. Initially, in State of Madras v. Champakam Dorairajan (1951), the Supreme Court held that FRs would prevail over DPSPs in case of a conflict, deeming DPSPs subordinate. However, this rigid stance shifted with Kesavananda Bharati v. State of Kerala (1973), which introduced the 'Basic Structure Doctrine,' implying that while Parliament could amend FRs, it couldn't alter the Constitution's core essence. This landmark judgment paved the way for a more balanced approach. The Minerva Mills v. Union of India (1980) case solidified this harmony, ruling that the balance between FRs and DPSPs is a part of the Constitution's basic structure and that one cannot be sacrificed for the other. The Court declared that they are complementary and aim at the same goal of social revolution. This evolving interpretation emphasizes that both are essential for achieving the welfare state envisioned by the Constitution, with courts striving to interpret laws to give effect to DPSPs without infringing upon fundamental freedoms."
      }
    ]
  },

  // Module 5: Union Government Structure
  {
    module_id: 36,
    title: "Union Government Analysis",
    description: "Analyze the structure and functions of the Union Government",
    file: "/assignments/file/union-government.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    max_score: 100,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 36,
    title: "Government Powers Matching",
    description: "Match constitutional offices with their powers",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    max_score: 50,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match the constitutional offices with their powers",
        options: [
          {
            option_text: "President",
            option_type: "text",
            match_text: "Appointing Prime Minister",
            match_type: "text"
          },
          {
            option_text: "Prime Minister",
            option_type: "text",
            match_text: "Advising President",
            match_type: "text"
          },
          {
            option_text: "Lok Sabha Speaker",
            option_type: "text",
            match_text: "Presiding over lower house",
            match_type: "text"
          },
          {
            option_text: "Chief Justice",
            option_type: "text",
            match_text: "Constitutional interpretation",
            match_type: "text"
          },
          {
            option_text: "Attorney General",
            option_type: "text",
            match_text: "Legal advisor to government",
            match_type: "text"
          }
        ]
      }
    ]
  },
  // {
  //   module_id: 36,
  //   title: "Parliament True/False",
  //   description: "Test your knowledge of the Indian Parliament",
  //   file: null,
  //   due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
  //   max_score: 30,
  //   status: "active",
  //   category: "true_false",
  //   created_by_type: "admin",
  //   updated_by_type: "admin",
  //   true_false_questions: [
  //     {
  //       question_text: "The President is part of Parliament",
  //       correct_answer: true
  //     },
  //     {
  //       question_text: "Rajya Sabha can be dissolved by the President",
  //       correct_answer: false
  //     },
  //     {
  //       question_text: "Money Bills can originate only in Lok Sabha",
  //       correct_answer: true
  //     },
  //     {
  //       question_text: "Vice President is elected by members of Parliament",
  //       correct_answer: true
  //     },
  //     {
  //       question_text: "The minimum age to become a Rajya Sabha member is 25 years",
  //       correct_answer: false
  //     }
  //   ]
  // },
  {
    module_id: 36,
    title: "Fill in the Blanks - Union Government",
    description: "Complete sentences about the Union Government",
    file: null,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    max_score: 40,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text: "The President of India is elected by an electoral college consisting of elected members of _____ and _____",
        answers: ["Lok Sabha and Rajya Sabha", "State Legislative Assemblies"]
      },
      {
        question_text: "The maximum strength of Lok Sabha is _____",
        answers: ["552"]
      },
      {
        question_text: "The maximum strength of Rajya Sabha is _____",
        answers: ["250"]
      },
      {
        question_text: "The President can nominate _____ members to Rajya Sabha",
        answers: ["12"]
      },
      {
        question_text: "Article _____ provides for the Council of Ministers to aid and advise the President",
        answers: ["74"]
      }
    ]
  },
  {
    module_id: 36,
    title: "Union Government Essay",
    description: "Write about the relationship between different organs of government",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    max_score: 50,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph: "India's Constitution establishes a system of checks and balances among the Legislature, Executive, and Judiciary, ensuring no single branch becomes overly powerful. The Legislature (Parliament) checks the Executive through no-confidence motions, question hour, and scrutiny of legislation and budgets; it also initiates impeachment proceedings against judges. The Executive influences the Legislature by proposing laws, and the President has veto power over bills. It appoints judges and can pardon convicts, checking the Judiciary. The Judiciary exercises judicial review, striking down unconstitutional laws passed by the Legislature or arbitrary executive actions, and protecting fundamental rights. It also checks both by interpreting the Constitution. In practice, this system is largely effective, demonstrating its resilience. The judiciary, through landmark judgments like the Basic Structure Doctrine, has consistently asserted its role in protecting the Constitution from legislative overreach. However, challenges persist, particularly when a strong majority government in the Legislature can potentially diminish the effectiveness of parliamentary oversight on the Executive. Instances of executive overreach and judicial activism sometimes spark debates about the precise boundaries of power. Despite these tensions, the foundational framework of checks and balances remains crucial for upholding democratic principles and the rule of law in India."
      }
    ]
  },

  // Module 6: Judiciary and its Powers
  {
    module_id: 37,
    title: "Judiciary Analysis",
    description: "Analyze the structure and powers of the Indian Judiciary",
    file: "/assignments/file/judiciary-structure.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    max_score: 100,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 37,
    title: "Judiciary Powers Matching",
    description: "Match different courts with their jurisdictions",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    max_score: 50,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match the courts with their jurisdictions",
        options: [
          {
            option_text: "Supreme Court",
            option_type: "text",
            match_text: "Constitutional interpretation",
            match_type: "text"
          },
          {
            option_text: "High Court",
            option_type: "text",
            match_text: "Supervision of subordinate courts",
            match_type: "text"
          },
          {
            option_text: "District Court",
            option_type: "text",
            match_text: "Original and appellate jurisdiction",
            match_type: "text"
          },
          {
            option_text: "Family Court",
            option_type: "text",
            match_text: "Matrimonial disputes",
            match_type: "text"
          },
          {
            option_text: "Fast Track Court",
            option_type: "text",
            match_text: "Speedy trial of specific cases",
            match_type: "text"
          }
        ]
      }
    ]
  },
  // {
  //   module_id: 37,
  //   title: "Judiciary True/False",
  //   description: "Test your knowledge of the Indian Judiciary",
  //   file: null,
  //   due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
  //   max_score: 30,
  //   status: "active",
  //   category: "true_false",
  //   created_by_type: "admin",
  //   updated_by_type: "admin",
  //   true_false_questions: [
  //     {
  //       question_text: "The Supreme Court of India was established in 1950",
  //       correct_answer: true
  //     },
  //     {
  //       question_text: "The Chief Justice of India is appointed by the President in consultation with the Prime Minister",
  //       correct_answer: false
  //     },
  //     {
  //       question_text: "High Court judges retire at the age of 65",
  //       correct_answer: false
  //     },
  //     {
  //       question_text: "The Supreme Court can issue all five types of writs",
  //       correct_answer: true
  //     },
  //     {
  //       question_text: "The concept of Public Interest Litigation (PIL) is mentioned in the Constitution",
  //       correct_answer: false
  //     }
  //   ]
  // },
  {
    module_id: 37,
    title: "Fill in the Blanks - Judiciary",
    description: "Complete sentences about the Indian Judiciary",
    file: null,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    max_score: 40,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text: "The Supreme Court consists of the Chief Justice and _____ other judges",
        answers: ["34"]
      },
      {
        question_text: "The minimum qualification to become a Supreme Court judge is _____ years of experience as a High Court judge or _____",
        answers: ["5", "10 years as an advocate"]
      },
      {
        question_text: "The _____ Amendment created the National Judicial Appointments Commission",
        answers: ["99"]
      },
      {
        question_text: "_____ is the power of courts to examine the constitutionality of laws",
        answers: ["Judicial Review"]
      }
    ]
  },
  {
    module_id: 37,
    title: "Judiciary Essay",
    description: "Write about judicial activism in India",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    max_score: 50,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph: "Judicial activism in India refers to the judiciary's proactive role in interpreting and enforcing laws to promote justice, especially when the executive or legislature fails to act. Proponents argue it's crucial for protecting citizens' rights, citing instances where the Supreme Court intervened to safeguard fundamental rights like the right to a clean environment, education, and livelihood, often through Public Interest Litigations (PILs) as seen in cases like Vishaka v. State of Rajasthan (sexual harassment guidelines) or environmental cases. They argue it fills legislative vacuums and ensures accountability. Critics, however, contend that judicial activism can sometimes lead to judicial overreach, where courts seemingly step into the domains of the executive or legislature, making policy decisions or creating laws, thereby potentially disrupting the separation of powers and democratic accountability. While the line is often debated, the Supreme Court has undeniably played a crucial, often transformative, role in expanding and protecting citizens' rights, evolving from being a mere interpreter of law to a vital guardian of the Constitution."
      }
    ]
  },

  // Module 7: Federal Structure
  {
    module_id: 38,
    title: "Federalism Analysis",
    description: "Analyze the federal structure of India",
    file: "/assignments/file/federalism-chart.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    max_score: 100,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 38,
    title: "Federal Powers Matching",
    description: "Match subjects with their respective lists",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    max_score: 50,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match the subjects with their respective lists",
        options: [
          {
            option_text: "Defense",
            option_type: "text",
            match_text: "Union List",
            match_type: "text"
          },
          {
            option_text: "Police",
            option_type: "text",
            match_text: "State List",
            match_type: "text"
          },
          {
            option_text: "Education",
            option_type: "text",
            match_text: "Concurrent List",
            match_type: "text"
          },
          {
            option_text: "Banking",
            option_type: "text",
            match_text: "Union List",
            match_type: "text"
          },
          {
            option_text: "Public Health",
            option_type: "text",
            match_text: "State List",
            match_type: "text"
          }
        ]
      }
    ]
  },
  // {
  //   module_id: 38,
  //   title: "Federalism True/False",
  //   description: "Test your knowledge of Indian federalism",
  //   file: null,
  //   due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
  //   max_score: 30,
  //   status: "active",
  //   category: "true_false",
  //   created_by_type: "admin",
  //   updated_by_type: "admin",
  //   true_false_questions: [
  //     {
  //       question_text: "India is described as a 'Union of States' in the Constitution",
  //       correct_answer: true
  //     },
  //     {
  //       question_text: "The Governor is appointed by the President",
  //       correct_answer: true
  //     },
  //     {
  //       question_text: "Residuary powers belong to the states in India",
  //       correct_answer: false
  //     },
  //     {
  //       question_text: "The Union List contains 97 subjects",
  //       correct_answer: true
  //     },
  //     {
  //       question_text: "States can make their own constitutions in India",
  //       correct_answer: false
  //     }
  //   ]
  // },
  {
    module_id: 38,
    title: "Fill in the Blanks - Federalism",
    description: "Complete sentences about Indian federalism",
    file: null,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    max_score: 40,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text: "The State List contains _____ subjects",
        answers: ["61"]
      },
      {
        question_text: "The Concurrent List contains _____ subjects",
        answers: ["52"]
      },
      {
        question_text: "Article _____ provides for the creation of new states",
        answers: ["3"]
      },
      {
        question_text: "_____ is a special provision regarding the state of Jammu and Kashmir",
        answers: ["Article 370"]
      },
      {
        question_text: "The _____ Commission recommends the share of states in central taxes",
        answers: ["Finance"]
      }
    ]
  },
  {
    module_id: 38,
    title: "Federalism Essay",
    description: "Write about the evolution of Centre-State relations",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    max_score: 50,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph: "Centre-State relations in India have evolved through distinct phases, marked by shifts in power dynamics. Initially, from independence until the late 1960s, a strong centralizing tendency prevailed, largely due to single-party dominance (Congress) at both the Centre and most states. Conflicts were often resolved internally within the party structure. The period from 1967 onwards saw the rise of non-Congress governments in several states, leading to increased state assertiveness and demands for greater autonomy, often met with centralizing responses, including frequent imposition of President's Rule under Article 356. The late 1980s and the coalition era of the 1990s brought about a significant change, fostering greater cooperative federalism as regional parties gained prominence and became integral to central governments, necessitating consensus and consultation. Recent trends, post-2014, indicate a shift towards a more cooperative and competitive federalism, with the abolition of the Planning Commission and creation of NITI Aayog, and the implementation of GST, which, while centralizing some fiscal powers, also involves states in decision-making through the GST Council. While tensions over issues like financial devolution, legislative overlaps, and the role of the Governor persist, the overall trajectory has been towards a more collaborative, albeit sometimes contentious, federal partnership."
      }
    ]
  }
];

const quizzes = [
  {
    //30
    module_id: 32, // Making of the Constitution
    title: "Constitution Introduction Quiz",
    duration_minutes: 10,
    passing_score: 60,
    max_attempts: 3,
    attempts_gap: 12,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    //31
    module_id: 33, // Vision and Values in the Preamble
    title: "Preamble & Core Values Quiz",
    duration_minutes: 15,
    passing_score: 70,
    max_attempts: 2,
    attempts_gap: 24,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    //32
    module_id: 34, // Fundamental Rights
    title: "Fundamental Rights Assessment",
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
    //33
    module_id: 35, // Fundamental Duties
    title: "Fundamental Duties Quiz",
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
    //34
    module_id: 36, // Union Government Structure
    title: "Union Government Assessment",
    duration_minutes: 20,
    passing_score: 70,
    max_attempts: 2,
    attempts_gap: 24,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    //35
    module_id: 37, // Judiciary and its Powers
    title: "Judiciary & Constitutional Powers Quiz",
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
    //36
    module_id: 38, // Citizenship and Elections
    title: "Citizenship & Election Process Quiz",
    duration_minutes: 15,
    passing_score: 60,
    max_attempts: 3,
    attempts_gap: 12,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  }
];

const predefinedQuestions = [
  {
    question_text: "When was the Indian Constitution adopted?",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 11,
    options: [
      { option_text: "15 August 1947", is_correct: false },
      { option_text: "26 January 1950", is_correct: false },
      { option_text: "26 November 1949", is_correct: true },
      { option_text: "2 October 1949", is_correct: false },
    ],
  },
  {
    question_text: "Which of the following words were added to the Preamble by the 42nd Amendment?",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 12,
    options: [
      { option_text: "Justice and Liberty", is_correct: false },
      { option_text: "Socialist and Secular", is_correct: true },
      { option_text: "Democratic and Republic", is_correct: false },
      { option_text: "Equality and Fraternity", is_correct: false },
    ],
  },
  {
    question_text: "Which article of the Indian Constitution deals with the Right to Equality?",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 13,
    options: [
      { option_text: "Article 14-18", is_correct: true },
      { option_text: "Article 19-22", is_correct: false },
      { option_text: "Article 23-24", is_correct: false },
      { option_text: "Article 32", is_correct: false },
    ],
  },
  {
    question_text: "Who was the chairman of the Drafting Committee of the Indian Constitution?",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 14,
    options: [
      { option_text: "Jawaharlal Nehru", is_correct: false },
      { option_text: "Rajendra Prasad", is_correct: false },
      { option_text: "B.R. Ambedkar", is_correct: true },
      { option_text: "Sardar Patel", is_correct: false },
    ],
  },
  {
    question_text: "Which case established the 'Basic Structure Doctrine' of the Constitution?",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 15,
    options: [
      { option_text: "Golaknath Case (1967)", is_correct: false },
      { option_text: "Kesavananda Bharati Case (1973)", is_correct: true },
      { option_text: "Minerva Mills Case (1980)", is_correct: false },
      { option_text: "Maneka Gandhi Case (1978)", is_correct: false },
    ],
  },
  {
    question_text: "Which part of the Indian Constitution deals with Fundamental Duties?",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 16,
    options: [
      { option_text: "Part III", is_correct: false },
      { option_text: "Part IV", is_correct: false },
      { option_text: "Part IVA", is_correct: true },
      { option_text: "Part V", is_correct: false },
    ],
  },
  {
    question_text: "The Indian Constitution borrowed the concept of Directive Principles of State Policy from which country's constitution?",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 17,
    options: [
      { option_text: "United States", is_correct: false },
      { option_text: "United Kingdom", is_correct: false },
      { option_text: "Ireland", is_correct: true },
      { option_text: "Canada", is_correct: false },
    ],
  },
  {
    question_text: "Which of the following is NOT a feature of the Indian Constitution?",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 18,
    options: [
      { option_text: "Federal System", is_correct: false },
      { option_text: "Parliamentary Democracy", is_correct: false },
      { option_text: "Presidential System", is_correct: true },
      { option_text: "Independent Judiciary", is_correct: false },
    ],
  },
  {
    question_text: "Which article provides the right to constitutional remedies?",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 19,
    options: [
      { option_text: "Article 14", is_correct: false },
      { option_text: "Article 19", is_correct: false },
      { option_text: "Article 21", is_correct: false },
      { option_text: "Article 32", is_correct: true },
    ],
  },
  {
    question_text: "The concept of 'Judicial Review' in the Indian Constitution is borrowed from:",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 20,
    options: [
      { option_text: "United States", is_correct: true },
      { option_text: "United Kingdom", is_correct: false },
      { option_text: "France", is_correct: false },
      { option_text: "Australia", is_correct: false },
    ],
  },
  {
    question_text: "Which of the following Fundamental Rights is available only to citizens and not to foreigners?",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 21,
    options: [
      { option_text: "Right to Equality", is_correct: false },
      { option_text: "Right to Freedom of Religion", is_correct: false },
      { option_text: "Right against Exploitation", is_correct: false },
      { option_text: "Right to Freedom of Speech", is_correct: true },
    ],
  },
  {
    question_text: "The Indian Constitution recognizes how many official languages?",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 22,
    options: [
      { option_text: "14", is_correct: false },
      { option_text: "18", is_correct: false },
      { option_text: "22", is_correct: true },
      { option_text: "25", is_correct: false },
    ],
  },
  {
    question_text: "Which amendment reduced the voting age from 21 to 18 years?",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 23,
    options: [
      { option_text: "42nd Amendment", is_correct: false },
      { option_text: "44th Amendment", is_correct: false },
      { option_text: "61st Amendment", is_correct: true },
      { option_text: "73rd Amendment", is_correct: false },
    ],
  },
  {
    question_text: "The concept of 'Rule of Law' in the Indian Constitution is derived from:",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 24,
    options: [
      { option_text: "United States", is_correct: false },
      { option_text: "United Kingdom", is_correct: true },
      { option_text: "France", is_correct: false },
      { option_text: "Canada", is_correct: false },
    ],
  },
  {
    question_text: "Which of the following is NOT a Fundamental Right under the Indian Constitution?",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 25,
    options: [
      { option_text: "Right to Property", is_correct: true },
      { option_text: "Right to Education", is_correct: false },
      { option_text: "Right to Privacy", is_correct: false },
      { option_text: "Right to Constitutional Remedies", is_correct: false },
    ],
  },
];

const quizQuestions = [
  // Quiz ID 1 - Constitution Introduction
  {
    quiz_id: 30,
    module_id: 32,
    question_text: "When was the Constitution of India adopted?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 1,
    options: [
      { text: "26 January 1950", correct: false },
      { text: "26 November 1949", correct: true },
      { text: "15 August 1947", correct: false },
      { text: "30 January 1948", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 30,
    module_id: 32,
    question_text: "The Constitution of India came into effect on _____",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 2,
    blanks: [{ correct_word: "26 January 1950", hint: "26 January 19" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 30,
    module_id: 32,
    question_text: "Who was the Chairman of the Drafting Committee of the Indian Constitution?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 3,
    options: [
      { text: "Jawaharlal Nehru", correct: false },
      { text: "Sardar Vallabhbhai Patel", correct: false },
      { text: "Dr. B.R. Ambedkar", correct: true },
      { text: "Dr. Rajendra Prasad", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 30,
    module_id: 32,
    question_text: "The Constitution of India is the longest written constitution in the world.",
    question_type: "true-false",
    marks: 5,
    sequence_no: 4,
    options: [
      { text: "true", correct: true },
      { text: "false", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 30,
    module_id: 32,
    question_text: "The original Constitution of India contained _____ articles and _____ schedules.",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 5,
    blanks: [
      { correct_word: "395", hint: "39" },
      { correct_word: "eight", hint: "ei" },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // Quiz ID 2 - Preamble & Core Values
  {
    quiz_id: 31,
    module_id: 33,
    question_text: "Which of the following words were added to the Preamble by the 42nd Amendment?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 1,
    options: [
      { text: "Democratic, Republic", correct: false },
      { text: "Sovereign, Justice", correct: false },
      { text: "Socialist, Secular", correct: true },
      { text: "Fraternity, Liberty", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 31,
    module_id: 33,
    question_text: "The Preamble begins with the phrase We, the people of _____.",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 2,
    blanks: [{ correct_word: "India", hint: "I" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 31,
    module_id: 33,
    question_text: "According to Supreme Court judgments, the Preamble is a part of the Constitution.",
    question_type: "true-false",
    marks: 5,
    sequence_no: 3,
    options: [
      { text: "true", correct: true },
      { text: "false", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 31,
    module_id: 33,
    question_text: "In which case did the Supreme Court first recognize the Preamble as part of the Constitution?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 4,
    options: [
      { text: "Kesavananda Bharati vs State of Kerala", correct: true },
      { text: "Maneka Gandhi vs Union of India", correct: false },
      { text: "Minerva Mills vs Union of India", correct: false },
      { text: "Golaknath vs State of Punjab", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 31,
    module_id: 33,
    question_text: "The term _____ in the Preamble means India is free from external control.",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 5,
    blanks: [{ correct_word: "Sovereign", hint: "S" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // Quiz ID 3 - Fundamental Rights
  {
    quiz_id: 32,
    module_id: 34,
    question_text: "Which article of the Constitution guarantees the Right to Equality before law?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 1,
    options: [
      { text: "Article 12", correct: false },
      { text: "Article 14", correct: true },
      { text: "Article 19", correct: false },
      { text: "Article 21", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 32,
    module_id: 34,
    question_text: "The Right to Freedom of Religion is provided by Articles _____ to _____ of the Constitution.",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 2,
    blanks: [
      { correct_word: "25", hint: "2" },
      { correct_word: "28", hint: "2" },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 32,
    module_id: 34,
    question_text: "The Right to Constitutional Remedies (Article 32) is described by Dr. Ambedkar as the 'heart and soul' of the Constitution.",
    question_type: "true-false",
    marks: 5,
    sequence_no: 3,
    options: [
      { text: "true", correct: true },
      { text: "false", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 32,
    module_id: 34,
    question_text: "Which of the following writs is issued by a court to ensure that a person detained is brought before the court?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 4,
    options: [
      { text: "Mandamus", correct: false },
      { text: "Certiorari", correct: false },
      { text: "Habeas Corpus", correct: true },
      { text: "Quo Warranto", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 32,
    module_id: 34,
    question_text: "Article 21 of the Constitution guarantees the right to _____ and personal liberty.",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 5,
    blanks: [{ correct_word: "life", hint: "l" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // Quiz ID 4 - Fundamental Duties
  {
    quiz_id: 33,
    module_id: 35,
    question_text: "In which year were Fundamental Duties added to the Constitution?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 1,
    options: [
      { text: "1950", correct: false },
      { text: "1976", correct: true },
      { text: "1989", correct: false },
      { text: "2002", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 33,
    module_id: 35,
    question_text: "Fundamental Duties are mentioned in Article _____ of the Constitution.",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 2,
    blanks: [{ correct_word: "51A", hint: "5" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 33,
    module_id: 35,
    question_text: "Fundamental Duties were added to the Constitution by the 42nd Amendment, based on recommendations of the Swaran Singh Committee.",
    question_type: "true-false",
    marks: 5,
    sequence_no: 3,
    options: [
      { text: "true", correct: true },
      { text: "false", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 33,
    module_id: 35,
    question_text: "Which of the following is NOT a Fundamental Duty under the Constitution?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 4,
    options: [
      { text: "To protect the sovereignty of India", correct: false },
      { text: "To pay taxes regularly and honestly", correct: true },
      { text: "To protect and improve the natural environment", correct: false },
      { text: "To safeguard public property", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 33,
    module_id: 35,
    question_text: "One of the Fundamental Duties is to develop scientific _____ and spirit of inquiry.",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 5,
    blanks: [{ correct_word: "temper", hint: "t" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // Quiz ID 5 - Union Government
  {
    quiz_id: 34,
    module_id: 36,
    question_text: "Who is the head of the Executive in India?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 1,
    options: [
      { text: "Prime Minister", correct: false },
      { text: "President", correct: true },
      { text: "Chief Justice", correct: false },
      { text: "Speaker of Lok Sabha", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 34,
    module_id: 36,
    question_text: "The President of India is elected by an electoral college consisting of _____ and _____.",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 2,
    blanks: [
      { correct_word: "elected members of Parliament", hint: "elected members of P" },
      { correct_word: "elected members of State Legislative Assemblies", hint: "elected members of State Legislative A" },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 34,
    module_id: 36,
    question_text: "The Prime Minister of India must be a member of the Lok Sabha.",
    question_type: "true-false",
    marks: 5,
    sequence_no: 3,
    options: [
      { text: "true", correct: false },
      { text: "false", correct: true },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 34,
    module_id: 36,
    question_text: "Which of the following is NOT a function of the Parliament?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 4,
    options: [
      { text: "Making laws", correct: false },
      { text: "Controlling the Executive", correct: false },
      { text: "Constitutional amendments", correct: false },
      { text: "Trying criminal cases", correct: true },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 34,
    module_id: 36,
    question_text: "The Council of Ministers is collectively responsible to the _____.",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 5,
    blanks: [{ correct_word: "Lok Sabha", hint: "L" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // Quiz ID 6 - Judiciary
  {
    quiz_id: 35,
    module_id: 37,
    question_text: "Who appoints the judges of the Supreme Court?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 1,
    options: [
      { text: "Prime Minister", correct: false },
      { text: "President", correct: true },
      { text: "Chief Justice of India", correct: false },
      { text: "Law Minister", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 35,
    module_id: 37,
    question_text: "The Supreme Court of India consists of a Chief Justice and _____ other judges (as of 2022).",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 2,
    blanks: [{ correct_word: "33", hint: "3" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 35,
    module_id: 37,
    question_text: "The Supreme Court has the power of judicial review.",
    question_type: "true-false",
    marks: 5,
    sequence_no: 3,
    options: [
      { text: "true", correct: true },
      { text: "false", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 35,
    module_id: 37,
    question_text: "Which doctrine was established in the Kesavananda Bharati case?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 4,
    options: [
      { text: "Doctrine of Eclipse", correct: false },
      { text: "Doctrine of Lapse", correct: false },
      { text: "Basic Structure Doctrine", correct: true },
      { text: "Doctrine of Pleasure", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 35,
    module_id: 37,
    question_text: "The minimum qualification to become a Supreme Court judge is _____ years of experience as a High Court judge or advocate.",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 5,
    blanks: [{ correct_word: "10", hint: "1" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // Quiz ID 7 - Citizenship and Elections
  {
    quiz_id: 36,
    module_id: 38,
    question_text: "Which article of the Constitution deals with citizenship at the commencement of the Constitution?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 1,
    options: [
      { text: "Article 5", correct: true },
      { text: "Article 11", correct: false },
      { text: "Article 15", correct: false },
      { text: "Article 21", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 36,
    module_id: 38,
    question_text: "The Election Commission of India is established under Article _____ of the Constitution.",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 2,
    blanks: [{ correct_word: "324", hint: "32" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 36,
    module_id: 38,
    question_text: "The Citizenship Amendment Act (CAA) 2019 provides citizenship to persecuted minorities from Pakistan, Bangladesh and Afghanistan.",
    question_type: "true-false",
    marks: 5,
    sequence_no: 3,
    options: [
      { text: "true", correct: true },
      { text: "false", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 36,
    module_id: 38,
    question_text: "Who appoints the Chief Election Commissioner of India?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 4,
    options: [
      { text: "Prime Minister", correct: false },
      { text: "President", correct: true },
      { text: "Supreme Court", correct: false },
      { text: "Parliament", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 36,
    module_id: 38,
    question_text: "The National Voters' Day is celebrated on _____ every year.",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 5,
    blanks: [{ correct_word: "25 January", hint: "25 J" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
];

// Special Quiz Types for the Indian Constitution Course
const audioToScriptQuestions = [
  {
    quiz_id: 30,
    url: "/audiotoScript/constitution_making.mp3",
    script: "The Indian Constitution was drafted by the Constituent Assembly which worked for almost three years from December 1946 to November 1949. Dr. B.R. Ambedkar served as the Chairman of the Drafting Committee and is often referred to as the Father of the Indian Constitution.",
    marks: 5,
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 31,
    url: "/audiotoScript/preamble_importance.mp3",
    script: "The Preamble to the Constitution sets out the guiding principles and philosophy of the document. It declares India as a sovereign, socialist, secular, democratic republic and aims to secure justice, liberty, equality, and fraternity for all citizens.",
    marks: 8,
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 32,
    url: "/audiotoScript/fundamental_rights_explained.mp3",
    script: "Fundamental Rights are enshrined in Part III of the Constitution from Articles 12 to 35. These rights are justiciable, meaning citizens can approach the Supreme Court directly under Article 32 if these rights are violated.",
    marks: 3,
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 36,
    url: "/audiotoScript/citizenship_elections.mp3",
    script: "The Election Commission of India is an autonomous constitutional authority responsible for administering election processes in India. It was established on 25th January 1950, which is now celebrated as National Voters' Day. The Commission consists of a Chief Election Commissioner and two Election Commissioners appointed by the President of India.",
    marks: 7,
    created_by_type: "admin",
    updated_by_type: "admin",
  },
];

const realWordQuestions = [
  {
    quiz_id: 30,
    words: ["constitution", "preamble", "soverign", "amendment", "secularism"],
    correct_answers: ["yes", "yes", "no", "yes", "yes"],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 31,
    words: ["seculer", "sovereign", "democrasy", "republic", "fraternity"],
    correct_answers: ["no", "yes", "no", "yes", "yes"],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 32,
    words: ["justiciable", "writs", "article", "mondamus", "liberty"],
    correct_answers: ["yes", "yes", "yes", "no", "yes"],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 36,
    words: ["citizenship", "election", "commision", "voter", "ballot"],
    correct_answers: ["yes", "yes", "no", "yes", "yes"],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
];


const summarizePassageQuestions = [
  {
    quiz_id: 30,
    passage: `The Constitution of India was drafted by the Constituent Assembly which was established in 1946. The Assembly conducted its first meeting on December 9, 1946, and elected Dr. Rajendra Prasad as its permanent Chairman. The Drafting Committee was appointed on August 29, 1947, with Dr. B.R. Ambedkar as its Chairman. After many deliberations and considerations of various drafts, the Constitution was finally adopted on November 26, 1949, and it came into effect on January 26, 1950. The date was specifically chosen as it was the anniversary of 'Purna Swaraj Day' which was celebrated on January 26, 1930. The Constitution originally consisted of 395 articles arranged under 22 parts and 8 schedules. It is the longest written constitution in the world.`,
    time_limit: 6,
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 31,
    passage: `The Preamble to the Constitution of India is a brief introductory statement that sets out the guiding principles and values of the document. It was inspired by the Preamble to the Constitution of the United States of America. Initially, the Preamble declared India as a "sovereign democratic republic," but the 42nd Amendment, enacted in 1976 during the Emergency, added the words "socialist" and "secular." The Preamble serves as a key to understanding the Constitution, although initially there was a legal debate about whether it is part of the Constitution or not. The Supreme Court in the landmark Kesavananda Bharati case (1973) held that the Preamble is part of the Constitution and is subject to the amending power of the Parliament.`,
    time_limit: 6,
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 32,
    passage: `Fundamental Rights are enshrined in Part III of the Indian Constitution from Articles 12 to 35. These rights are universally applicable to all citizens, with certain exceptions for aliens and restrictions during emergency situations. Initially, there were seven categories of Fundamental Rights, but after the 44th Amendment in 1978, the Right to Property was removed from the list and made a constitutional right under Article 300A. The six categories now are: Right to Equality (Articles 14-18), Right to Freedom (Articles 19-22), Right against Exploitation (Articles 23-24), Right to Freedom of Religion (Articles 25-28), Cultural and Educational Rights (Articles 29-30), and Right to Constitutional Remedies (Article 32). Dr. B.R. Ambedkar called Article 32 the "heart and soul" of the Constitution as it provides for judicial remedies against violations of these rights.`,
    time_limit: 6,
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 36,
    passage: `The Election Commission of India is a permanent constitutional body established under Article 324 of the Constitution. It consists of a Chief Election Commissioner and two Election Commissioners appointed by the President for a term of six years or until they reach 65 years of age, whichever is earlier. The Commission is responsible for conducting elections to the Lok Sabha, Rajya Sabha, State Legislative Assemblies, and the offices of President and Vice President. The Commission operates with complete autonomy and is insulated from executive interference. It has the power to supervise elections, enforce the Model Code of Conduct, and even cancel polls in case of malpractices. The Commission has introduced several electoral reforms including Electronic Voting Machines (EVMs) and Voter Verifiable Paper Audit Trail (VVPAT) systems.`,
    time_limit: 6,
    created_by_type: "admin",
    updated_by_type: "admin",
  },
];

const bestOptionQuestions = [
  {
    quiz_id: 30,
    passage: "The Constitution of India was adopted on ____ and came into effect on ____. It declares India as a ____ republic where sovereignty rests with the people.",
    blanked_words: [
      { word: "26 November 1949", options: ["26 November 1949", "15 August 1947", "26 January 1950", "26 January 1949"], position: 1 },
      { word: "26 January 1950", options: ["26 January 1950", "26 November 1949", "15 August 1947", "26 January 1949"], position: 2 },
      { word: "democratic", options: ["democratic", "socialist", "secular", "federal"], position: 3 }
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 31,
    passage: "The Preamble begins with the words '____, the people of India.' The words ____ and ____ were added to the Preamble through the 42nd Amendment in 1976.",
    blanked_words: [
      { word: "We", options: ["We", "I", "The", "All"], position: 1 },
      { word: "socialist", options: ["socialist", "democratic", "republic", "secular"], position: 2 },
      { word: "secular", options: ["secular", "socialist", "democratic", "republic"], position: 3 }
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 32,
    passage: "Article ____ guarantees the Right to Equality before law to all citizens. The Right to Freedom of Religion is provided in Articles ____ to ____. The Right to Constitutional Remedies is considered the ____ of the Constitution by Dr. Ambedkar.",
    blanked_words: [
      { word: "14", options: ["14", "15", "16", "17"], position: 1 },
      { word: "25", options: ["25", "26", "27", "28"], position: 2 },
      { word: "28", options: ["28", "29", "30", "31"], position: 3 },
      { word: "heart and soul", options: ["heart and soul", "backbone", "foundation", "essence"], position: 4 }
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 36,
    passage: "The Election Commission of India is established under Article ____ of the Constitution. It consists of a ____ Election Commissioner and two ____. The Commission is responsible for conducting free and fair ____ in India.",
    blanked_words: [
      { word: "324", options: ["324", "325", "326", "327"], position: 1 },
      { word: "Chief", options: ["Chief", "Deputy", "Assistant", "Senior"], position: 2 },
      { word: "Election Commissioners", options: ["Election Commissioners", "Deputy Commissioners", "Assistant Commissioners", "Senior Commissioners"], position: 3 },
      { word: "elections", options: ["elections", "referendums", "polls", "surveys"], position: 4 }
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
    console.log("entered in khushi's default data seeder");

    // Admin
    let admin = await Admin.findOne({ where: { email: defaultAdmin.email } });
    if (!admin) {
      admin = await Admin.create({ ...defaultAdmin, password: defaultAdmin.password });
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
      let existing = await CourseCategory.findOne({ where: { category: category.category } });
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
      const existing = await Course.findOne({ where: { title: courseData.title } });
      if (existing) continue;

      const highestCourse = await Course.findOne({ order: [["sequence", "DESC"]] });
      const nextSequence = highestCourse ? highestCourse.sequence + 1 : 1;

      const categoryObj = categoryRecords.find(c => c.id === courseData.category_id);
      if (!categoryObj) {
        console.error(`❌ No matching category for course "${courseData.title}"`);
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

      const plainDescription = convert(courseData.description || "", { wordwrap: false });
      const courseText = `passage: ${courseData.title}. ${plainDescription}. What you will learn: ${newCourse.what_you_will_learn.join(". ")}. Hashtags: ${newCourse.hashtags.join(", ")}. Category: ${categoryRecords.find(c => c.id === category_id).category}`;
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
      const faqsForCourse = courseFAQs.filter(faq => faq.course_id === course.id);
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
      const course = courseRecords.find(c => c.id === sessionData.course_id);
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
      const course = courseRecords.find(c => c.id === modData.course_id);
      const session = sessionRecords.find(s => s.id === modData.session_id);

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

    // Topics
    for (const module of moduleRecords) {
      let sequence = 1;

      // Get the course and session for this module
      const course = courseRecords.find(c => c.id === module.course_id);
      const session = sessionRecords.find(s => s.id === module.session_id);

      // Determine which topics to add based on the course, session, and module sequence
      let topicsToAdd = [];
      if (course.title === "The Indian Constitution: Foundations of Our Democracy") {
        if (session.sequence_no === 1) {
          if (module.sequence_no === 1) {
            topicsToAdd = constitutionIntroTopics;
          } else if (module.sequence_no === 2) {
            topicsToAdd = preambleTopics;
          }
        } else if (session.sequence_no === 2) {
          if (module.sequence_no === 3) {
            topicsToAdd = fundamentalRightsTopics;
          } else if (module.sequence_no === 4) {
            topicsToAdd = dpspTopics;
          }
        } else if (session.sequence_no === 3) {
          if (module.sequence_no === 5) {
            topicsToAdd = governmentStructureTopics;
          } else if (module.sequence_no === 6) {
            topicsToAdd = amendmentsTopics;
          }
        } else if (session.sequence_no === 4) {
          if (module.sequence_no === 7) {
            topicsToAdd = citizenshipTopics;
          }
        }
      }

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
                audio_url: slide.audio_url || null, // Include audio_url here
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

        console.log(`✅ Topic "${topic.title}" created under module "${module.title}"`);
      }
    }

    // Assignments
    for (const assignmentData of assignments) {
      const module = moduleRecords.find(m => m.id === assignmentData.module_id);
      if (!module) continue;

      // Get the course for this module
      const course = courseRecords.find(c => c.id === module.course_id);

      // Only create assignments for the matching course
      if (course.title === "The Indian Constitution: Foundations of Our Democracy") {
        const newAssignment = await Assignment.create({
          ...assignmentData,
          created_by: admin.id,
          updated_by: admin.id,
        });

        // Create matching questions if this is a matching assignment
        if (assignmentData.category === "matching" && assignmentData.matching_questions) {
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
        if (assignmentData.category === "fill_in_the_blanks" && assignmentData.fill_blank_questions) {
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
        if (assignmentData.category === "paragraph_writing" && assignmentData.paragraph_questions) {
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

        console.log(`✅ Assignment "${newAssignment.title}" created for module "${module.title}"`);
      }
    }

    // Predefined questions
    for (const questionData of predefinedQuestions) {
      const question = await PreDefinedQuestions.create({
        question_text: questionData.question_text,
        question_img: questionData.question_img,
        question_type: questionData.question_type,
        marks: questionData.marks,
        sequence_no: questionData.sequence_no,
        created_by: admin.id,
        updated_by: admin.id,
      });

      for (const opt of questionData.options) {
        await PreDefinedOptions.create({
          pre_defined_question_id: question.id,
          option_text: opt.option_text,
          is_correct: opt.is_correct,
          created_by: admin.id,
          updated_by: admin.id,
        });
      }

      console.log(`✅ Predefined question "${question.question_text}" created.`);
    }

    // Quizzes
    for (const quizData of quizzes) {
      const module = moduleRecords.find(m => m.id === quizData.module_id);
      if (!module) continue;

      // Get the course for this module
      const course = courseRecords.find(c => c.id === module.course_id);

      // Only create quizzes for the matching course
      if (course.title === "The Indian Constitution: Foundations of Our Democracy") {
        const quiz = await Quizzes.create({
          ...quizData,
          module_id: module.id,
          created_by: admin.id,
          updated_by: admin.id,
        });
        console.log(`✅ Quiz "${quiz.title}" created for module "${module.title}"`);


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
