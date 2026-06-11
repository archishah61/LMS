const sequelize = require("./config/db");
const bcrypt = require("bcryptjs");
const { convert } = require("html-to-text");
const axios = require('axios');
const Admin = require("./models/auth/admin");
const User = require("./models/auth/user");
const { CourseCategory } = require("./models/masters/courseCatagory");
const Course = require("./models/course_management/course");
const Session = require("./models/course_management/session");
const Module = require("./models/course_management/module");
const { CourseVersion } = require("./models/partner/approve_request_version/courseVersion");

const Topic = require("./models/course_management/topic");
const { Video } = require("./models/content_management/video");
const { Audio } = require("./models/content_management/audio");
const { Accordion } = require("./models/content_management/accordian");
const { GeneralMaterial } = require("./models/content_management/genral");

const { MultiSlide } = require("./models/content_management/multi_slide");
const { MultiSlideVideo } = require("./models/content_management/multiSlideVideo");
const { MultiSlideAudio } = require("./models/content_management/multiSlideAudio");
const { MultiSlideGeneral } = require("./models/content_management/multiSlideGeneral");
const { MultiSlideAccordion } = require("./models/content_management/multiSlideAccordian");

const { Quizzes } = require("./models/content_management/quizzesModel");
const { QuizQuestions } = require("./models/content_management/quizQuestionsModel");
const { QuizOptions } = require("./models/content_management/quizOptionsModel");
const { CompleteSentence } = require("./models/content_management/quiz-questions-types/completeTheSentence");

const { AudioToScriptQuestion } = require("./models/content_management/quiz-questions-types/audiotoScript");
const RealWordQuestion = require("./models/content_management/quiz-questions-types/real-word");
const SummarizePassageQuestion = require("./models/content_management/quiz-questions-types/summarPassageModel");
const { SummarizerManager } = require("node-summarizer");

const { generatePublicHash } = require("./utils/course_management/generateHash");

const Assignment = require("./models/content_management/assignmentsModel");
const MatchingQuestion = require("./models/content_management/matchingQuestion");
const MatchingOption = require("./models/content_management/matchingOption");
const TrueFalseQuestion = require("./models/content_management/trueFalseQuestion");
const FillTheBlanksQuestion = require("./models/content_management/fillTheBlanks");
const ParagraphWriting = require("./models/content_management/paragraphwriting");
const CourseFAQ = require("./models/course_management/courseFAQs");
const CourseFAQOption = require("./models/course_management/courseFAQOption");
const { PreDefinedQuestions } = require("./models/masters/predefinedQuestion");
const { PreDefinedOptions } = require("./models/masters/predefinedOption");
const { BestOptionQuestion } = require("./models/content_management/quiz-questions-types/bestOptionQuestion");

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
  { category: "Programming", id: 1 },
  { category: "Design", id: 2 },
  { category: "Science", id: 3 },
  { category: "Health & Biology", id: 4 },
];

const courses = [
  {
    id: 1,
    title: "JavaScript Basics",
    category_id: 1,
    description: " Learn the fundamentals of JavaScript. This course covers variables, data types, functions, and control structures. Gain hands-on experience through interactive exercises and real-world examples. Perfect for beginners looking to build a solid programming foundation.",
    price: 100.0,
    discount: 10,
    duration_hours: 5,
    expiry_days: 90,
    min_access_hours: 1,
    max_access_hours: 3,
    what_you_will_learn: ["Variables", "Functions", "Loops"],
    prerequisites: ["Basic HTML"],
    hashtags: ["#javascript", "#frontend"],
    thumbnail: "/course/thumbnail/jsthumbnail.jpg",
    preview_video: "/course/preview_video/jspreviewVideo.mp4",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    id: 2,
    title: "Human Body & Anatomy Basics",
    category_id: 4,
    description: "Explore the fascinating structure of the human body! This course covers the skeletal system, circulatory system, nervous system, and more. Ideal for students, health enthusiasts, and anyone curious about how the body works.",
    price: 80.0,
    discount: 15,
    duration_hours: 6,
    expiry_days: 120,
    min_access_hours: 1,
    max_access_hours: 3,
    what_you_will_learn: [
      "Human Organ Systems",
      "Functions of Major Organs",
      "Body Structure & Anatomy Terms"
    ],
    prerequisites: ["Basic Biology"],
    hashtags: ["#anatomy", "#humanbody"],
    thumbnail: "/course/thumbnail/human_anatomy_course_thumb.jpeg",
    preview_video: "/course/preview_video/human_anatomy1.mp4",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
];

const courseFAQs = [
  {
    course_id: 1,
    question: "Why do you want to learn JavaScript?",
    created_by_type: "admin",
    updated_by_type: "admin",
    options: [
      "For college projects",
      "For getting a job",
      "For building my own projects",
      "To learn a new skill"
    ]
  },
  {
    course_id: 1,
    question: "What is your current programming level?",
    created_by_type: "admin",
    updated_by_type: "admin",
    options: [
      "Beginner",
      "Intermediate",
      "Advanced"
    ]
  },
  {
    course_id: 1,
    question: "What is your main goal after completing the course?",
    created_by_type: "admin",
    updated_by_type: "admin",
    options: [
      "Build real-world projects",
      "Prepare for interviews",
      "Start freelancing",
      "Just for learning"
    ]
  },
  {
    course_id: 1,
    question: "How much time can you dedicate weekly?",
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
    course_id: 1,
    question: "What motivates you the most to learn coding?",
    created_by_type: "admin",
    updated_by_type: "admin",
    options: [
      "Career growth",
      "Personal interest",
      "Higher salary",
      "Entrepreneurship"
    ]
  },
  {
    course_id: 2,
    question: "Why do you want to learn Human Anatomy?",
    created_by_type: "admin",
    updated_by_type: "admin",
    options: [
      "For medical entrance prep",
      "Out of personal curiosity",
      "For school / college syllabus",
      "To improve my health knowledge"
    ]
  },
  {
    course_id: 2,
    question: "What is your current understanding of human anatomy?",
    created_by_type: "admin",
    updated_by_type: "admin",
    options: [
      "Beginner",
      "Intermediate",
      "Advanced"
    ]
  },
  {
    course_id: 2,
    question: "What is your main goal after completing the course?",
    created_by_type: "admin",
    updated_by_type: "admin",
    options: [
      "Prepare for medical/health exams",
      "Better understand the human body",
      "Support fitness and wellness journey",
      "Just learning for fun"
    ]
  },
  {
    course_id: 2,
    question: "How much time can you dedicate weekly?",
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
    course_id: 2,
    question: "What motivates you the most to study the human body?",
    created_by_type: "admin",
    updated_by_type: "admin",
    options: [
      "Career in healthcare",
      "Personal interest in biology",
      "Academic requirements",
      "General knowledge and self-awareness"
    ]
  }
];

const sessions = [
  {
    course_id: 1,
    title: "Intro to JS",
    chpater_description: "Overview of JavaScript syntax and structure.",
    status: "active",
    image_name: "session1.png",
    image_path: "/session/images/jssession1.png",
    min_time_in_minute: 30,
  },
  {
    course_id: 1,
    title: "JS Functions & Scope",
    chpater_description: "Learn how functions work and how variable scope is handled in JavaScript.",
    status: "active",
    image_name: "session2.png",
    image_path: "/session/images/jssession1.png",
    min_time_in_minute: 40,
  },
  {
    course_id: 2,
    title: "Introduction to Human Anatomy",
    chpater_description: "Get familiar with the organization of the human body and its major organ systems.",
    status: "active",
    image_name: "anatomy_intro.png",
    image_path: "/session/images/human_anatomy_img2.png",
    min_time_in_minute: 30,
  },
  {
    course_id: 2,
    title: "The Skeletal System Overview",
    chpater_description: "Understand the framework of bones that support and protect the human body.",
    status: "active",
    image_name: "skeletal_system.png",
    image_path: "/session/images/human_anatomy_img2.png",
    min_time_in_minute: 40,
  }
];

const modules = [
  {
    course_id: 1,
    session_id: 1,
    title: "Variables & Data Types",
    image: "/module/image/jsmodule.jpg",
    description: "Learn about variables and data types in JavaScript.",
    duration_hours: 1,
    status: "active",
  },
  {
    course_id: 1,
    session_id: 2,
    title: "Functions & Scope",
    image: "/module/image/jsmodule.jpg",
    description: "Understand how functions are defined, invoked, and how scope works.",
    duration_hours: 1,
    status: "active",
  },
  {
    course_id: 2,
    session_id: 3,
    title: "The Skeletal System",
    image: "/module/image/human_anatomy_img2.png",
    description: "Learn about the human skeleton, its bones, types, and how it provides structure and protection to the body.",
    duration_hours: 1,
    status: "active",
  },
  {
    course_id: 2,
    session_id: 4,
    title: "The Circulatory & Respiratory Systems",
    image: "/module/image/human_anatomy_img2.png",
    description: "Explore how the heart, blood vessels, lungs, and oxygen transport work together to keep the body alive.",
    duration_hours: 1,
    status: "active",
  }
];

const humanAnatomyHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Human Anatomy Guide</title>
    <style>
    .anatomy-guide {
        font-family: 'Arial', sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f9f9f9;
    }
    .anatomy-guide header {
        background-color: #2c3e50;
        color: white;
        padding: 20px;
        border-radius: 5px;
        margin-bottom: 30px;
        text-align: center;
    }
    .anatomy-guide h1 {
        margin: 0;
        font-size: 2.5em;
    }
    .anatomy-guide h2 {
        color: #2c3e50;
        border-bottom: 2px solid #e74c3c;
        padding-bottom: 5px;
        margin-top: 40px;
    }
    .anatomy-guide article {
        background-color: white;
        padding: 25px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .anatomy-guide .system-overview {
        margin: 30px 0;
    }
    .anatomy-guide .system-card {
        background-color: #ecf0f1;
        padding: 15px;
        border-left: 4px solid #e74c3c;
        margin-bottom: 20px;
        border-radius: 0 5px 5px 0;
    }
    .anatomy-guide .system-card h3 {
        margin-top: 0;
        color: #2c3e50;
    }
    .anatomy-guide .image-container {
        margin: 20px 0;
        text-align: center;
    }
    .anatomy-guide .image-container img {
        max-width: 100%;
        height: auto;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .anatomy-guide .image-caption {
        font-style: italic;
        color: #7f8c8d;
        margin-top: 8px;
    }
    .anatomy-guide footer {
        text-align: center;
        margin-top: 50px;
        padding: 20px;
        color: #7f8c8d;
        font-size: 0.9em;
    }
</style>
</head>
<body>
<div class="anatomy-guide">
    <header>
        <h1>Human Anatomy Overview</h1>
        <p>The comprehensive guide to understanding the human body</p>
    </header>

    <article>
        <section>
            <h2>Introduction to Human Anatomy</h2>
            <p>Human anatomy is the scientific study of the body's structures and their relationships to one another. This fundamental biological science provides the foundation for understanding physiology, pathology, and all medical sciences. The human body is an incredibly complex machine composed of numerous systems working in harmony to maintain life.</p>

            <div class="image-container">
                <img src="https://img.freepik.com/premium-vector/medical-education-chart-biology-human-body-organ-system-diagram-vector-illustration_742418-247.jpg?w=826" alt="Human body organ systems diagram">
                <div class="image-caption">Diagram showing major human body systems and their organization</div>
            </div>

            <p>Modern anatomy can be divided into several branches including gross anatomy (structures visible to the naked eye), microscopic anatomy (histology), developmental anatomy (embryology), and pathological anatomy. This guide focuses on the major organ systems that sustain human life.</p>
        </section>

        <section class="system-overview">
            <h2>Major Body Systems</h2>

            <div class="system-card">
                <h3>Skeletal System</h3>
                <p>The human skeleton consists of 206 bones that provide structure, protect organs, anchor muscles, and store calcium. The skeletal system is divided into the axial skeleton (skull, vertebral column, rib cage) and appendicular skeleton (limbs and girdles). Joints between bones allow for movement while maintaining structural integrity.</p>
                <p>Key components include long bones (femur, humerus), short bones (carpals, tarsals), flat bones (scapula, sternum), and irregular bones (vertebrae, pelvis). Bone marrow within certain bones produces blood cells through hematopoiesis.</p>
            </div>

            <div class="system-card">
                <h3>Muscular System</h3>
                <p>With over 600 muscles, this system enables movement through contraction. Muscles are categorized as skeletal (voluntary movement), smooth (involuntary, in organs), or cardiac (heart muscle). The muscular system works closely with the skeletal system via tendons that connect muscle to bone.</p>
                <p>Major muscle groups include the deltoids, pectorals, abdominals, quadriceps, and hamstrings. Muscles generate heat and help maintain posture in addition to enabling locomotion and facial expressions.</p>
            </div>

            <div class="system-card">
                <h3>Circulatory System</h3>
                <p>The cardiovascular system consists of the heart, blood vessels, and approximately 5 liters of blood. This closed-loop system transports oxygen, nutrients, hormones, and waste products throughout the body. The heart's four chambers (two atria and two ventricles) pump blood through arteries, capillaries, and veins.</p>
                <p>Blood contains red blood cells (oxygen transport), white blood cells (immune defense), platelets (clotting), and plasma (liquid component). The circulatory system also helps regulate body temperature and pH balance.</p>
            </div>

            <div class="system-card">
                <h3>Respiratory System</h3>
                <p>This system facilitates gas exchange, bringing oxygen into the body and removing carbon dioxide. Air passes through the nasal cavity, pharynx, larynx, trachea, bronchi, and bronchioles before reaching the alveoli in the lungs where gas exchange occurs.</p>
                <p>The diaphragm and intercostal muscles control breathing movements. The respiratory system works closely with the circulatory system to oxygenate blood and remove metabolic waste.</p>
            </div>

            <div class="system-card">
                <h3>Digestive System</h3>
                <p>A complex series of organs that breaks down food, absorbs nutrients, and eliminates waste. The alimentary canal includes the mouth, esophagus, stomach, small intestine, large intestine, rectum, and anus. Accessory organs (liver, pancreas, gallbladder) secrete enzymes and bile to aid digestion.</p>
                <p>The process involves mechanical digestion (chewing, churning) and chemical digestion (enzymatic breakdown). Nutrients are absorbed primarily in the small intestine, while the large intestine absorbs water and forms feces.</p>
            </div>

            <div class="system-card">
                <h3>Nervous System</h3>
                <p>The body's control and communication network, divided into the central nervous system (brain and spinal cord) and peripheral nervous system (nerves throughout the body). Neurons transmit electrical signals while glial cells provide support.</p>
                <p>The brain processes sensory information and coordinates responses. The autonomic nervous system regulates involuntary functions like heartbeat and digestion, while the somatic system controls voluntary movements.</p>
            </div>
        </section>

        <section>
            <h2>Clinical Importance</h2>
            <p>Understanding human anatomy is essential for medical diagnosis and treatment. Physicians use anatomical knowledge to:</p>
            <ul>
                <li>Interpret medical imaging (X-rays, CT scans, MRIs)</li>
                <li>Perform surgical procedures safely</li>
                <li>Understand disease processes and trauma</li>
                <li>Administer medications effectively</li>
                <li>Develop rehabilitation programs</li>
            </ul>
            <p>Anatomical variations among individuals make this field particularly challenging yet fascinating for healthcare professionals.</p>
        </section>

        <section>
            <h2>Anatomical Terminology</h2>
            <p>Standardized anatomical terms describe position, direction, and movement:</p>
            <ul>
                <li><strong>Anterior/Posterior:</strong> Front/back of the body</li>
                <li><strong>Superior/Inferior:</strong> Above/below</li>
                <li><strong>Medial/Lateral:</strong> Toward/away from midline</li>
                <li><strong>Proximal/Distal:</strong> Closer to/farther from point of attachment</li>
                <li><strong>Superficial/Deep:</strong> Toward surface/inside body</li>
            </ul>
            <p>The anatomical position (standing upright, facing forward, arms at sides with palms forward) serves as the reference point for all descriptions.</p>
        </section>
    </article>
</div>
</body>
</html>
`;

const organSystemHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Organ System Overview</title>
    <style>
        .organ-system-guide {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #ffffff;
            color: #222;
            max-width: 1200px;
            margin: 0 auto;
            padding: 30px;
        }
        .organ-system-guide header {
            background: linear-gradient(to right, #2980b9, #6dd5fa);
            color: #fff;
            padding: 25px;
            border-radius: 8px;
            text-align: center;
        }
        .organ-system-guide h1 {
            margin: 0;
            font-size: 2.4em;
        }
        .organ-system-guide h2 {
            font-size: 1.8em;
            border-left: 6px solid #3498db;
            padding-left: 10px;
            margin-top: 50px;
        }
        .organ-system-guide article {
            padding: 20px;
        }
        .organ-system-guide .organs-wrapper {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .organ-system-guide .organ-card {
            border: 1px solid #e0e0e0;
            padding: 20px;
            border-radius: 8px;
            background-color: #f8faff;
            transition: box-shadow 0.3s;
        }
        .organ-system-guide .organ-card:hover {
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        .organ-system-guide .organ-card h3 {
            color: #2980b9;
            margin-top: 0;
        }
        .organ-system-guide .image-container {
            text-align: center;
            margin: 30px 0;
        }
        .organ-system-guide .image-container img {
            max-width: 100%;
            border-radius: 6px;
        }
        .organ-system-guide .image-caption {
            font-size: 0.9em;
            color: #888;
            margin-top: 5px;
        }
        .organ-system-guide dl {
            margin-top: 10px;
        }
        .organ-system-guide dt {
            font-weight: bold;
            margin-top: 10px;
        }
        .organ-system-guide dd {
            margin-left: 20px;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
<div class="organ-system-guide">
    <header>
        <h1>Understanding Human Organ Systems</h1>
        <p>Explore how each system supports human life and health</p>
    </header>

    <article>
        <h2>Overview and Introduction</h2>
        <p>The human body comprises several complex organ systems, each playing vital roles in sustaining life. These systems cooperate seamlessly to regulate bodily functions and maintain internal balance.</p>

        <div class="image-container">
            <img src="https://media.geeksforgeeks.org/wp-content/uploads/20240405114228/Diagram-of-Human-Organs.png" alt="Human body organ systems diagram">
            <div class="image-caption">Organ systems and their respective regions</div>
        </div>

        <h2>System Highlights</h2>
        <div class="organs-wrapper">
            <div class="organ-card">
                <h3>Respiratory System</h3>
                <p>Handles the vital task of breathing. Oxygen enters and carbon dioxide exits through a series of airways and lung tissues, enabling cellular respiration.</p>
            </div>
            <div class="organ-card">
                <h3>Digestive System</h3>
                <p>Processes consumed food, extracting nutrients and eliminating waste. Key organs include the stomach, intestines, liver, and pancreas.</p>
            </div>
            <div class="organ-card">
                <h3>Circulatory System</h3>
                <p>Distributes blood throughout the body, delivering essential substances and removing waste products via the heart and a network of vessels.</p>
            </div>
            <div class="organ-card">
                <h3>Nervous System</h3>
                <p>Coordinates actions and processes information through a network involving the brain, spinal cord, and peripheral nerves.</p>
            </div>
            <div class="organ-card">
                <h3>Endocrine System</h3>
                <p>Regulates long-term changes and bodily functions via hormones secreted by glands like the thyroid, adrenal, and pancreas.</p>
            </div>
            <div class="organ-card">
                <h3>Urinary System</h3>
                <p>Filters the blood and manages waste excretion through the kidneys and urinary tract, maintaining fluid and chemical balance.</p>
            </div>
            <div class="organ-card">
                <h3>Reproductive System</h3>
                <p>Facilitates human reproduction, with distinct anatomical structures and functions for male and female systems.</p>
            </div>
        </div>

        <h2>Clinical Relevance</h2>
        <p>In the medical field, familiarity with each organ system is indispensable. This knowledge aids in accurate diagnoses, effective treatments, and successful surgical interventions.</p>

        <h2>Core Anatomical Terms</h2>
        <dl>
            <dt>Anterior / Posterior</dt>
            <dd>Indicate the front and back of the body respectively.</dd>

            <dt>Superior / Inferior</dt>
            <dd>Refer to positions above or below a point of reference.</dd>

            <dt>Medial / Lateral</dt>
            <dd>Describe proximity to the body's midline.</dd>

            <dt>Proximal / Distal</dt>
            <dd>Used for limbs to indicate closeness or distance from the torso.</dd>

            <dt>Superficial / Deep</dt>
            <dd>Identify layers from surface to internal structures.</dd>
        </dl>
        <p>All directional terms are based on the body being in the standard anatomical position: upright, facing forward, arms at the side, palms facing forward.</p>
    </article>
</div>
</body>
</html>
`;

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



const basicTopics = [
  {
    module_id: 1,
    title: "Intro Video",
    description: "Learn JS basics via video",
    content_type: "video",
    video: {
      url: "/video/jsVideoTopic.mp4",
      duration_minutes: 10,
      transcript: "Welcome to JavaScript...",
      audio_url: "/audios/video/jsAudioyt.mp3",
      bullet_points: [{ time: 0, text: "Variables" }, { time: 60, text: "Functions" }],
    },
  },
  {
    module_id: 1,
    title: "Getting Started with JS - Audio",
    description: "Introduction in audio form",
    content_type: "audio",
    audio: {
      url: "/audio/jsAudioyt.mp3",
      duration_minutes: 5,
    },
  },
  {
    module_id: 1,
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
    module_id: 1,
    title: "JS Cheat Sheet",
    description: "Useful JS reference PDF",
    content_type: "general",
    general: {
      title: "Cheat Sheet",
      description: "Explore JS Cheat Sheet",
      url: "/general/pdf/js-cheatsheet.pdf",
      audio_url: "/audios/general/jsAudioyt.mp3",
      material_type: "pdf",
    },
  },
  {
    module_id: 1,
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
      {
        title: "JS Functions Audio",
        description: "Listen about JS functions",
        content_type: "audio",
        audio: {
          url: "/multiSlide/audio/jsAudioytms.mp3",
          duration_minutes: 3,
        },
      },
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
      {
        title: "JS Cheat Sheet PDF",
        description: " Quick reference for JavaScript",
        content_type: "general",
        audio_url: "/audios/multi_slide/slideAudioUrl[3].mp3",
        general: {
          title: "JS Cheat Sheet",
          description: "Quick reference for JavaScript",
          url: "/multiSlide/general/pdf/js-cheatsheetms.pdf",
          audio_url: "/audios/slide_general/jsAudioyt.mp3",
          material_type: "pdf",
        },
      }
    ],
  },
  {
    module_id: 3,
    title: "Intro Video - Human Anatomy",
    description: "Learn the basics of human anatomy via video",
    content_type: "video",
    video: {
      url: "/video/session1_module1_topic_video.mp4",
      duration_minutes: 10,
      transcript: "Welcome to Human Anatomy...",
      audio_url: "/audios/video/human_anatomy.mp3",
      bullet_points: [{ time: 0, text: "Human Body Overview" }, { time: 60, text: "Organ Systems" }]
    }
  },
  {
    module_id: 3,
    title: "Getting Started with Anatomy - Audio",
    description: "Introduction to human anatomy in audio form",
    content_type: "audio",
    audio: {
      url: "/audio/human_anatomy2.mp3",
      duration_minutes: 5
    }
  },
  {
    module_id: 3,
    title: "Human Body Systems - Accordion",
    description: "Overview of major human organ systems",
    content_type: "accordian",
    accordions: [
      {
        title: "Skeletal System",
        body: "The skeletal system provides structure and support.",
        codeLanguage: "text",
        code: "",
        audio_url: "/audios/accordion/human_anatomy2.mp3"
      },
      {
        title: "Muscular System",
        body: "The muscular system enables movement and stability.",
        codeLanguage: "text",
        code: "",
        audio_url: "/audios/accordion/human_anatomy2.mp3"
      }
    ]
  },
  {
    module_id: 3,
    title: "Anatomy Cheat Sheet",
    description: "Quick reference PDF for human body systems",
    content_type: "general",
    general: {
      title: "Human Anatomy Reference Guide",
      description: "Explore how each system supports human life and health",
      url: "/general/pdf/anatomy_cheatsheet.pdf",
      audio_url: "/audios/general/human_anatomy.mp3",
      material_type: "pdf",
    },
  },
  {
    module_id: 3,
    title: "Anatomy Multi-Slide Content",
    description: "A collection of human anatomy media formats",
    content_type: "slide",
    slides: [
      {
        title: "Skeletal System - Video",
        description: "Overview of human skeleton",
        content_type: "video",
        video: {
          url: "/multiSlide/video/session1_module1_multiSlide_video.mp4",
          duration_minutes: 5,
          audio_url: "/audios/slide_video/human_anatomy.mp3"
        }
      },
      {
        title: "Heart and Circulation - Audio",
        description: "Learn about the circulatory system",
        content_type: "audio",
        audio: {
          url: "/multiSlide/audio/human_anatomy.mp3",
          duration_minutes: 3
        }
      },
      {
        title: "Organ Systems Overview - Accordion",
        description: "Understand key organ systems",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/slideAudioUrl[2].mp3",
        accordions: [
          {
            title: "Respiratory System",
            body: "Responsible for gas exchange and breathing.",
            codeLanguage: "text",
            code: "",
            audio_url: "/audios/slide_accordion/human_anatomy2.mp3"
          },
          {
            title: "Nervous System",
            body: "Controls and coordinates body activities.",
            codeLanguage: "text",
            code: "",
            audio_url: "/audios/slide_accordion/human_anatomy.mp3"
          }
        ]
      },
      {
        title: "Anatomy Systems PDF",
        description: "Explore how each system supports human life and health",
        content_type: "general",
        audio_url: "/audios/multi_slide/slideAudioUrl[2].mp3",
        general: {
          title: "Organ Systems Overview",
          description: "Detailed human organ system explanations",
          url: "/multiSlide/general/pdf/anatomy_cheatsheet2.pdf",
          audio_url: "/audios/slide_general/human_anatomy.mp3",
          material_type: "pdf",
        },
      }
    ],
  }
];

const functionTopics = [
  {
    module_id: 2,
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
    module_id: 2,
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
    module_id: 2,
    title: "Scope & Hoisting - Audio",
    description: "Learn about scope and how hoisting works in JS.",
    content_type: "audio",
    audio: {
      url: "/audio/jsAudioyt.mp3",
      duration_minutes: 6,
    },
  },
  {
    module_id: 2,
    title: "Function Scope PDF",
    description: "Quick guide to function scope, block scope, and hoisting.",
    content_type: "general",
    general: {
      title: "Scope Reference",
      description: "All you need to know about scope in JS.",
      url: "/general/pdf/js-cheatsheet.pdf",
      audio_url: "/audios/general/jsAudioyt.mp3",
      material_type: "pdf",
    },
  },
  {
    module_id: 2,
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
      {
        title: "Lexical Scope",
        description: "How scope is determined in JS.",
        content_type: "audio",
        audio: {
          url: "/multiSlide/audio/jsAudioytms.mp3",
          duration_minutes: 3,
        },
      },
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
      {
        title: "Scope PDF",
        description: "In-depth PDF on all types of scope in JS.",
        content_type: "general",
        audio_url: "/audios/multi_slide/slideAudioUrl[2].mp3",
        general: {
          title: "Advanced Scope Guide",
          description: "Closures, lexical scope, and more.",
          url: "/multiSlide/general/pdf/js-cheatsheetms.pdf",
          material_type: "pdf",
          audio_url: "/audios/slide_general/jsAudioyt.mp3",
        },
      },
    ],
  },
  {
    module_id: 4,
    title: "Skeletal System - Video",
    description: "Explore the structure of the human skeleton",
    content_type: "video",
    video: {
      url: "/video/session1_module1_topic_video.mp4",
      duration_minutes: 8,
      transcript: "In this video, we explore the skeletal system...",
      audio_url: "/audios/video/human_anatomy.mp3",
      bullet_points: [
        { time: 0, text: "Introduction to Bones" },
        { time: 120, text: "Bone Types" }
      ],
    },
  },
  {
    module_id: 4,
    title: "Nervous System - Accordion",
    description: "Understand the basics of the nervous system",
    content_type: "accordian",
    accordions: [
      {
        title: "Central Nervous System",
        body: "Includes brain and spinal cord.",
        codeLanguage: "text",
        code: "",
        audio_url: "/audios/accordion/human_anatomy.mp3"
      },
      {
        title: "Peripheral Nervous System",
        body: "Connects CNS to limbs and organs.",
        codeLanguage: "text",
        code: "",
        audio_url: "/audios/accordion/human_anatomy2.mp3"
      }
    ]
  },
  {
    module_id: 4,
    title: "Circulatory System - Audio",
    description: "Audio guide on the human circulatory system",
    content_type: "audio",
    audio: {
      url: "/audio/human_anatomy.mp3",
      duration_minutes: 6
    }
  },
  {
    module_id: 4,
    title: "Organ Systems PDF",
    description: "A comprehensive PDF summary of the major organ systems in the human body, accompanied by an audio guide for enhanced learning.",
    content_type: "general",
    general: {
      title: "Organ Systems Summary",
      description: organSystemHTML,
      url: "/general/pdf/anatomy_cheatsheet.pdf",
      audio_url: "/audios/general/human_anatomy.mp3",
      material_type: "pdf",
    },
  }
];

const assignments = [
  // Module 1: Variables & Data Types
  {
    module_id: 1,
    title: "Variables Assignment",
    description: "Practice working with variables in JavaScript",
    file: "/assignments/file/js-cheatsheet.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    max_score: 100,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 1,
    title: "Data Types Matching",
    description: "Match JavaScript data types with their examples",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    max_score: 50,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match the data types with their examples",
        options: [
          {
            option_text: "Number",
            option_type: "text",
            match_text: "42",
            match_type: "text"
          },
          {
            option_text: "String",
            option_type: "text",
            match_text: "'hello'",
            match_type: "text"
          },
          {
            option_text: "Boolean",
            option_type: "text",
            match_text: "true",
            match_type: "text"
          }
        ]
      }
    ]
  },
  {
    module_id: 1,
    title: "Variables True/False",
    description: "Test your knowledge of variables with true/false questions",
    file: null,
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    max_score: 30,
    status: "active",
    category: "true_false",
    created_by_type: "admin",
    updated_by_type: "admin",
    true_false_questions: [
      {
        question_text: "The 'var' keyword is block-scoped",
        correct_answer: false
      },
      {
        question_text: "You can redeclare a variable with 'let'",
        correct_answer: false
      }
    ]
  },
  {
    module_id: 1,
    title: "Fill in the Blanks - Variables",
    description: "Complete the sentences about variables",
    file: null,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    max_score: 40,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text: "The _____ keyword is used to declare a constant variable",
        answers: ["const"]
      },
      {
        question_text: "Variables declared with _____ are function-scoped",
        answers: ["var"]
      }
    ]
  },
  {
    module_id: 1,
    title: "Variables Essay",
    description: "Write a paragraph explaining variables in JavaScript",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    max_score: 50,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph: "Explain the difference between let, const and var in JavaScript"
      }
    ]
  },

  // Module 2: Functions & Scope
  {
    module_id: 2,
    title: "Functions Assignment",
    description: "Practice writing functions in JavaScript",
    file: "/assignments/js-cheatsheet.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    max_score: 100,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 2,
    title: "Function Types Matching",
    description: "Match function types with their examples",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    max_score: 50,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match the function types with their examples",
        options: [
          {
            option_text: "Function Declaration",
            option_type: "text",
            match_text: "function foo() {}",
            match_type: "text"
          },
          {
            option_text: "Function Expression",
            option_type: "text",
            match_text: "const foo = function() {}",
            match_type: "text"
          },
          {
            option_text: "Arrow Function",
            option_type: "text",
            match_text: "const foo = () => {}",
            match_type: "text"
          }
        ]
      }
    ]
  },
  {
    module_id: 2,
    title: "Scope True/False",
    description: "Test your knowledge of scope with true/false questions",
    file: null,
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    max_score: 30,
    status: "active",
    category: "true_false",
    created_by_type: "admin",
    updated_by_type: "admin",
    true_false_questions: [
      {
        question_text: "Variables declared with 'let' are hoisted",
        correct_answer: true
      },
      {
        question_text: "Arrow functions have their own 'this' binding",
        correct_answer: false
      }
    ]
  },
  {
    module_id: 2,
    title: "Fill in the Blanks - Functions",
    description: "Complete the sentences about functions",
    file: null,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    max_score: 40,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text: "A function that calls itself is called a _____ function",
        answers: ["recursive"]
      },
      {
        question_text: "The _____ keyword refers to the object that owns the executing code",
        answers: ["this"]
      }
    ]
  },
  {
    module_id: 2,
    title: "Functions Essay",
    description: "Write a paragraph explaining functions in JavaScript",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    max_score: 50,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph: "Explain the concept of closures in JavaScript with an example"
      }
    ]
  },

  // Module 3: The Skeletal System
  {
    module_id: 3,
    title: "Label the Human Skeleton",
    description: "Identify major bones in a diagram",
    file: "/assignments/file/anatomy_cheatsheet.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    max_score: 100,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 3,
    title: "Bone Types Matching",
    description: "Match bone types with their examples",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    max_score: 50,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match the bone types with their examples",
        options: [
          {
            option_text: "Long Bones",
            option_type: "text",
            match_text: "Femur",
            match_type: "text"
          },
          {
            option_text: "Short Bones",
            option_type: "text",
            match_text: "Carpals",
            match_type: "text"
          },
          {
            option_text: "Flat Bones",
            option_type: "text",
            match_text: "Scapula",
            match_type: "text"
          }
        ]
      }
    ]
  },
  {
    module_id: 3,
    title: "Skeletal System True/False",
    description: "Test your knowledge of bones with true/false questions",
    file: null,
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    max_score: 30,
    status: "active",
    category: "true_false",
    created_by_type: "admin",
    updated_by_type: "admin",
    true_false_questions: [
      {
        question_text: "The femur is the longest bone in the human body",
        correct_answer: true
      },
      {
        question_text: "Bones are not living tissue",
        correct_answer: false
      }
    ]
  },
  {
    module_id: 3,
    title: "Fill in the Blanks - Bones",
    description: "Complete the sentences about the skeletal system",
    file: null,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    max_score: 40,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text: "The _____ protects the brain",
        answers: ["skull"]
      },
      {
        question_text: "Bones are connected to each other by _____",
        answers: ["ligaments"]
      }
    ]
  },
  {
    module_id: 3,
    title: "Skeletal System Essay",
    description: "Write a paragraph explaining the functions of the skeletal system",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    max_score: 50,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph: "Explain the main functions of the human skeletal system"
      }
    ]
  },

  // Module 4: The Circulatory & Respiratory Systems
  {
    module_id: 4,
    title: "Heart Diagram Assignment",
    description: "Label the parts of the heart",
    file: "/assignments/file/heart_anatomy.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    max_score: 100,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 4,
    title: "Circulatory System Matching",
    description: "Match circulatory system components with their functions",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    max_score: 50,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match the circulatory system components with their functions",
        options: [
          {
            option_text: "Arteries",
            option_type: "text",
            match_text: "Carry oxygenated blood away from heart",
            match_type: "text"
          },
          {
            option_text: "Veins",
            option_type: "text",
            match_text: "Carry deoxygenated blood to heart",
            match_type: "text"
          },
          {
            option_text: "Capillaries",
            option_type: "text",
            match_text: "Site of gas exchange",
            match_type: "text"
          }
        ]
      }
    ]
  },
  {
    module_id: 4,
    title: "Respiratory System True/False",
    description: "Test your knowledge of breathing with true/false questions",
    file: null,
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    max_score: 30,
    status: "active",
    category: "true_false",
    created_by_type: "admin",
    updated_by_type: "admin",
    true_false_questions: [
      {
        question_text: "The diaphragm contracts during inhalation",
        correct_answer: true
      },
      {
        question_text: "The trachea is also called the windpipe",
        correct_answer: true
      }
    ]
  },
  {
    module_id: 4,
    title: "Fill in the Blanks - Respiration",
    description: "Complete the sentences about the respiratory system",
    file: null,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    max_score: 40,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text: "Gas exchange occurs in the _____ of the lungs",
        answers: ["alveoli"]
      },
      {
        question_text: "The _____ is the muscle that controls breathing",
        answers: ["diaphragm"]
      }
    ]
  },
  {
    module_id: 4,
    title: "Circulatory System Essay",
    description: "Write a paragraph explaining how blood circulates through the body",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    max_score: 50,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph: "Describe the path of blood through the circulatory system"
      }
    ]
  }
];

const quizzes = [
  {
    module_id: 1,
    title: "JS Basics Quiz",
    duration_minutes: 10,
    passing_score: 50,
    max_attempts: 3,
    attempts_gap: 12,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 2,
    title: "Functions & Scope Quiz",
    duration_minutes: 15,
    passing_score: 60,
    max_attempts: 2,
    attempts_gap: 24,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 3,
    title: "Human Skeleton Quiz",
    duration_minutes: 10,
    passing_score: 50,
    max_attempts: 3,
    attempts_gap: 12,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 4,
    title: "Circulatory & Respiratory Quiz",
    duration_minutes: 15,
    passing_score: 60,
    max_attempts: 2,
    attempts_gap: 24,
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  }
];

const quizQuestions = [
  // Quiz ID 1 - JS Basics
  {
    quiz_id: 1,
    module_id: 1,
    question_text: "What is the correct way to declare a variable in JavaScript?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 1,
    options: [
      { text: "let x = 5;", correct: true },
      { text: "int x = 5;", correct: false },
      { text: "x := 5;", correct: false },
      { text: "variable x = 5;", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 1,
    module_id: 1,
    question_text: "The keyword used to define a constant variable in JavaScript is",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 4,
    blanks: [{ correct_word: "const", hint: "c" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 1,
    module_id: 1,
    question_text: "The keyword used to declare a block-scoped variable is ",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 3,
    blanks: [{ correct_word: "let", hint: "l" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // Quiz ID 2 - Functions & Scope
  {
    quiz_id: 2,
    module_id: 2,
    question_text: "Which of the following is an arrow function?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 1,
    options: [
      { text: "function add(a, b) { return a + b; }", correct: false },
      { text: "const add = (a, b) => a + b;", correct: true },
      { text: "add := function(a, b) -> a + b", correct: false },
      { text: "def add(a, b): return a + b", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 2,
    module_id: 2,
    question_text: "Functions in JavaScript can be stored in variables.",
    question_type: "true-false",
    marks: 3,
    sequence_no: 2,
    options: [
      { text: "true", correct: true },
      { text: "false", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 2,
    module_id: 2,
    question_text: "The term  refers to the accessibility of variables in various parts of your code ",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 3,
    blanks: [{ correct_word: "scope", hint: "s" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // Quiz ID 3 - Skeletal System
  {
    quiz_id: 3,
    module_id: 3,
    question_text: "Which bone protects the brain?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 1,
    options: [
      { text: "Skull", correct: true },
      { text: "Ribcage", correct: false },
      { text: "Femur", correct: false },
      { text: "Pelvis", correct: false }
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 3,
    module_id: 3,
    question_text: "The human body's internal framework is made up of ",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 2,
    blanks: [{ correct_word: "bones", hint: "b" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 3,
    module_id: 3,
    question_text: "The largest bone in the human body is the ",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 3,
    blanks: [{ correct_word: "femur", hint: "f" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 3,
    module_id: 3,
    question_text: "Bones are connected to each other by ",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 4,
    blanks: [{ correct_word: "ligaments", hint: "l" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 3,
    module_id: 3,
    question_text: "The skeletal system produces blood cells in the bone marrow.",
    question_type: "true-false",
    marks: 3,
    sequence_no: 5,
    options: [
      { text: "true", correct: true },
      { text: "false", correct: false }
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // Quiz ID 4 - Circulatory & Respiratory
  {
    quiz_id: 4,
    module_id: 4,
    question_text: "Which organ pumps blood throughout the body?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 1,
    options: [
      { text: "Heart", correct: true },
      { text: "Liver", correct: false },
      { text: "Lungs", correct: false },
      { text: "Kidney", correct: false }
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 4,
    module_id: 4,
    question_text: "The lungs are responsible for exchanging oxygen and carbon dioxide.",
    question_type: "true-false",
    marks: 3,
    sequence_no: 2,
    options: [
      { text: "true", correct: true },
      { text: "false", correct: false }
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 4,
    module_id: 4,
    question_text: "The human circulatory system primarily transports  around the body ",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 3,
    blanks: [{ correct_word: "blood", hint: "b" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 4,
    module_id: 4,
    question_text: "Gas exchange occurs in the  of the lungs ",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 4,
    blanks: [{ correct_word: "alveoli", hint: "a" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 4,
    module_id: 4,
    question_text: "Which blood vessels carry oxygenated blood away from the heart?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 5,
    options: [
      { text: "Arteries", correct: true },
      { text: "Veins", correct: false },
      { text: "Capillaries", correct: false },
      { text: "Venules", correct: false }
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  }
];

const predefinedQuestions = [
  {
    question_text: "What is JavaScript primarily used for?",
    question_img: null,
    question_type: "MCQ",
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
    question_type: "MCQ",
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
    question_text: "What is the output of the following code?\n```javascript\nconsole.log(typeof null);\n```",
    question_img: null,
    question_type: "MCQ",
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
    question_type: "MCQ",
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
    question_text: "What does the `typeof` operator return for arrays in JavaScript?",
    question_img: null,
    question_type: "MCQ",
    marks: 5,
    sequence_no: 5,
    options: [
      { option_text: "array", is_correct: false },
      { option_text: "object", is_correct: true },
      { option_text: "undefined", is_correct: false },
      { option_text: "function", is_correct: false },
    ],
  },
  {
    question_text: "Which system provides structural support for the human body?",
    question_img: null,
    question_type: "MCQ",
    marks: 5,
    sequence_no: 6,
    options: [
      { option_text: "Circulatory System", is_correct: false },
      { option_text: "Skeletal System", is_correct: true },
      { option_text: "Respiratory System", is_correct: false },
      { option_text: "Digestive System", is_correct: false }
    ],
  },
  {
    question_text: "Which organ is responsible for pumping blood?",
    question_img: null,
    question_type: "MCQ",
    marks: 5,
    sequence_no: 7,
    options: [
      { option_text: "Lungs", is_correct: false },
      { option_text: "Heart", is_correct: true },
      { option_text: "Brain", is_correct: false },
      { option_text: "Kidneys", is_correct: false }
    ],
  },
  {
    question_text: "What is the primary function of the lungs?",
    question_img: null,
    question_type: "MCQ",
    marks: 5,
    sequence_no: 8,
    options: [
      { option_text: "Pump blood", is_correct: false },
      { option_text: "Exchange gases", is_correct: true },
      { option_text: "Produce hormones", is_correct: false },
      { option_text: "Digest food", is_correct: false }
    ],
  },
  {
    question_text: "Which of the following protects the spinal cord?",
    question_img: null,
    question_type: "MCQ",
    marks: 5,
    sequence_no: 9,
    options: [
      { option_text: "Ribs", is_correct: false },
      { option_text: "Vertebral Column", is_correct: true },
      { option_text: "Femur", is_correct: false },
      { option_text: "Skull", is_correct: false }
    ],
  }
];

const audioToScriptQuestions = [
  {
    quiz_id: 1,
    url: "/audiotoScript/jsAudioyt.mp3",
    script: "Welcome to the JavaScript basics course. In this audio, we'll cover variables and data types.",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 2,
    url: "/audiotoScript/jsAudioyt.mp3",
    script: "Functions are first-class objects in JavaScript and can be passed as arguments.",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 3,
    url: "/audiotoScript/human_anatomy.mp3",
    script: "Welcome to the Human Anatomy course. In this audio, we'll discuss the human skeletal system and its role in protection and movement.",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 4,
    url: "/audiotoScript/human_anatomy2.mp3",
    script: "In this audio lesson, we'll explore how the heart and lungs work together to circulate oxygen-rich blood throughout the body.",
    created_by_type: "admin",
    updated_by_type: "admin",
  }
];

const realWordQuestions = [
  {
    quiz_id: 1,
    words: ["variable", "object", "arript", "array", "funclet"],
    correct_answers: ["yes", "yes", "no", "yes", "no"],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 2,
    words: ["function", "scope", "promist", "closure", "await"],
    correct_answers: ["yes", "yes", "no", "yes", "yes"],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 3,
    words: ["bone", "organ", "skeltom", "artery", "celll"],
    correct_answers: ["yes", "yes", "no", "yes", "no"],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 4,
    words: ["heart", "lung", "neuron", "respirote", "digestive"],
    correct_answers: ["yes", "yes", "yes", "no", "yes"],
    created_by_type: "admin",
    updated_by_type: "admin",
  }
];

const summarizePassageQuestions = [
  {
    quiz_id: 1,
    passage: `Coral reefs are often referred to as the rainforests of the sea because of their incredible biodiversity. These underwater ecosystems are formed by colonies of coral polyps held together by calcium carbonate. Coral reefs provide shelter and food to countless marine species and support the livelihoods of millions of people around the world. However, they are highly sensitive to changes in water temperature, pollution, and overfishing. Climate change has led to widespread coral bleaching, putting entire reef systems at risk. Conservation efforts are underway globally to protect and restore these vital habitats.`,
    time_limit: 6,
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 2,
    passage: `Sea turtles are ancient reptiles that have existed for over 100 million years. These creatures migrate across vast distances between feeding grounds and nesting sites. They play a crucial role in marine ecosystems by maintaining healthy seagrass beds and coral reefs. Unfortunately, sea turtle populations are in decline due to habitat loss, climate change, plastic pollution, and accidental capture in fishing gear. Efforts to conserve sea turtles include beach protection programs, artificial hatcheries, and international regulations that reduce bycatch. Raising awareness and education are also key to ensuring these animals continue to thrive in the wild.`,
    time_limit: 6,
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 3,
    passage: `The human respiratory system enables breathing and gas exchange. Air enters through the nose and mouth, travels down the trachea, and into the lungs, where oxygen is absorbed into the bloodstream and carbon dioxide is expelled. Proper functioning of this system is vital for maintaining cellular respiration and overall health.`,
    time_limit: 6,
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 4,
    passage: `The digestive system breaks down food into nutrients, which the body uses for energy, growth, and repair. Starting from the mouth and ending at the intestines, the digestive tract plays a key role in nutrient absorption. Enzymes and stomach acids help process food, and undigested waste exits the body as feces.`,
    time_limit: 6,
    created_by_type: "admin",
    updated_by_type: "admin",
  }
];

const bestOptionQuestions = [
  // Quiz ID 1 - JS Basics (Module 1)
  {
    quiz_id: 1,
    passage: "JavaScript is a ____ programming language that allows you to implement ____ features on web pages. It is an essential ____ for front-end web development along with HTML and CSS.",
    blanked_words: ["versatile", "interactive", "technology"],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  // Quiz ID 2 - Functions & Scope (Module 2)
  {
    quiz_id: 2,
    passage: "In JavaScript, a ____ is a reusable block of code that performs a specific task. Variables declared inside a function have ____ scope, while those declared outside have ____ scope. Arrow functions are a ____ syntax introduced in ES6.",
    blanked_words: ["function", "local", "global", "concise"],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  // Quiz ID 3 - Human Skeleton (Module 3)
  {
    quiz_id: 3,
    passage: "The human ____ system provides structure and support for the body. It protects vital organs like the brain, which is encased in the ____. The longest bone in the human body is the ____, found in the thigh.",
    blanked_words: ["skeletal", "skull", "femur"],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  // Quiz ID 4 - Circulatory & Respiratory (Module 4)
  {
    quiz_id: 4,
    passage: "The human ____ pumps blood throughout the body via a network of blood vessels. Oxygen enters the body through the ____ system, where gas exchange occurs in tiny air sacs called ____. The vessels carrying oxygenated blood away from the heart are called ____.",
    blanked_words: ["heart", "respiratory", "alveoli", "arteries"],
    created_by_type: "admin",
    updated_by_type: "admin",
  }
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
      if (course.title === "JavaScript Basics") {
        if (session.sequence_no === 1 && module.sequence_no === 1) {
          topicsToAdd = basicTopics.filter(topic => topic.module_id === 1);
        } else if (session.sequence_no === 2) {
          topicsToAdd = functionTopics.filter(topic => topic.module_id === 2);
        }
      } else if (course.title === "Human Body & Anatomy Basics") {
        if (session.sequence_no === 1 && module.sequence_no === 1) {
          topicsToAdd = basicTopics.filter(topic => topic.module_id === 3);
        } else if (session.sequence_no === 2) {
          topicsToAdd = functionTopics.filter(topic => topic.module_id === 4);
        }
      }

      for (const topic of topicsToAdd) {
        const newTopic = await Topic.create({
          module_id: module.id,
          title: topic.title,
          description: topic.description,
          content_type: topic.content_type,
          sequence_no: sequence++,
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
                created_by: admin.id,
                updated_by: admin.id,
                created_by_type: "admin",
                updated_by_type: "admin",
              });
            }
            break;
          case "general":
            await GeneralMaterial.create({
              topic_id: newTopic.id,
              url: topic.general.url,
              audio_url: topic.general.audio_url || null,
              title: topic.general.title,
              description: topic.general.description,
              material_type: topic.general.material_type,
              created_by: admin.id,
              updated_by: admin.id,
              created_by_type: "admin",
              updated_by_type: "admin",
            });
            break;
          case "slide":
            let i = 1;
            for (const slide of topic.slides) {
              const newSlide = await MultiSlide.create({
                topic_id: newTopic.id,
                sequence_no: i,
                title: slide.title,
                description: slide.description,
                type: slide.content_type,
                audio_url: slide.audio_url || null, // Include audio_url here
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

                case "general":
                  await MultiSlideGeneral.create({
                    multi_slide_id: newSlide.id,
                    url: slide.general.url,
                    audio_url: slide.general.audio_url || null,
                    material_type: slide.general.material_type,
                    title: slide.general.title,
                    description: slide.general.description,
                    created_by: admin.id,
                    updated_by: admin.id,
                    created_by_type: "admin",
                    updated_by_type: "admin",
                  });
                  break;
              }
            }
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
      if ((course.title === "JavaScript Basics" && assignmentData.module_id <= 2) ||
        (course.title === "Human Body & Anatomy Basics" && assignmentData.module_id > 2)) {
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
            });

            for (const option of question.options) {
              await MatchingOption.create({
                question_id: matchingQuestion.id,
                option_text: option.option_text,
                option_type: option.option_type,
                match_text: option.match_text,
                match_type: option.match_type,
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
            });
          }
        }

        // Create paragraph writing questions
        if (assignmentData.category === "paragraph_writing" && assignmentData.paragraph_questions) {
          for (const question of assignmentData.paragraph_questions) {
            await ParagraphWriting.create({
              assignment_id: newAssignment.id,
              paragraph: question.paragraph,
            });
          }
        }

        console.log(`✅ Assignment "${newAssignment.title}" created for module "${module.title}"`);
      }
    }

    // Predefined questions
    for (const questionData of predefinedQuestions) {
      const question = await PreDefinedQuestions.create({
        quiz_id: null,
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
      if ((course.title === "JavaScript Basics" && quizData.module_id <= 2) ||
        (course.title === "Human Body & Anatomy Basics" && quizData.module_id > 2)) {
        const quiz = await Quizzes.create({
          ...quizData,
          module_id: module.id,
          created_by: admin.id,
          updated_by: admin.id,
        });
        console.log(`✅ Quiz "${quiz.title}" created for module "${module.title}"`);

        // Filter questions based on module_id
        const quizQuestionSet = quizQuestions.filter(q => q.module_id === module.id);

        for (const questionData of quizQuestionSet) {
          const question = await QuizQuestions.create({
            quiz_id: quiz.id,
            question_text: questionData.question_text,
            question_type: questionData.question_type,
            marks: questionData.marks,
            sequence_no: questionData.sequence_no,
            created_by_type: questionData.created_by_type,
            updated_by_type: questionData.updated_by_type,
            created_by: admin.id,
            updated_by: admin.id,
          });

          if (questionData.question_type === "mcq" || questionData.question_type === "true-false") {
            for (const opt of questionData.options) {
              await QuizOptions.create({
                question_id: question.id,
                option_text: opt.text,
                is_correct: opt.correct,
                created_by: admin.id,
                updated_by: admin.id,
              });
            }
          } else if (questionData.question_type === "complete-sentence") {
            const sentenceEntries = questionData.blanks.map((entry) => ({
              question_id: question.id,
              correct_word: entry.correct_word,
              hint: entry.hint,
              created_by: admin.id,
              updated_by: admin.id,
            }));

            await CompleteSentence.bulkCreate(sentenceEntries);
          }
        }

        // Audio to Script
        const audioScripts = audioToScriptQuestions.filter(q => q.quiz_id === quizData.module_id);

        for (const audio of audioScripts) {
          await AudioToScriptQuestion.create({
            quiz_id: quiz.id,
            url: audio.url,
            script: audio.script,
            created_by: admin.id,
            updated_by: admin.id,
          });
        }

        // Real Word Questions
        const realWords = realWordQuestions.filter(q => q.quiz_id === quizData.module_id);

        for (const real of realWords) {
          await RealWordQuestion.create({
            quiz_id: quiz.id,
            words: real.words,
            correct_answers: real.correct_answers,
            created_by: admin.id,
            updated_by: admin.id,
          });
        }

        // Summarize Passage Questions
        const summarizePassages = summarizePassageQuestions.filter(q => q.quiz_id === quizData.module_id);

        for (const passage of summarizePassages) {
          let summary;

          try {
            let summarizer = new SummarizerManager(passage.passage, 5);
            let summaryObj = await summarizer.getSummaryByRank();

            if (!summaryObj || typeof summaryObj.summary !== "string" || !summaryObj.summary.trim()) {
              // Retry with top 3 sentences
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

          await SummarizePassageQuestion.create({
            quiz_id: quiz.id,
            passage: passage.passage,
            summary,
            time_limit: passage.time_limit,
            created_by: admin.id,
            updated_by: admin.id,
            created_by_type: passage.created_by_type,
            updated_by_type: passage.updated_by_type,
          });

          console.log("✅ Summary passage stored. Summary:", summary);
        }


        // Best Option Questions
        const bestOptionQuizzes = bestOptionQuestions.filter(q => q.quiz_id === quizData.module_id);

        // Predefined list of fallback words
        const fallbackWords = [
          'manifest', 'construction', 'modeling', 'illustrative', 'projection',
          'hypothesis', 'scheme', 'reconstruction', 'principle', 'template',
          'outlook', 'element', 'exemplar', 'symbol', 'process', 'blueprint', 'artwork',
          'plan', 'refinement', 'approach', 'drafting', 'structure', 'skeleton',
          'configuration', 'conceptual', 'mock-up', 'specification', 'framework',
          'pattern', 'reproduction', 'outline', 'arrangement', 'analysis', 'notation',
          'perspective', 'translation', 'variation', 'remodeling', 'mapping',
          'preliminary', 'manifestation', 'depiction', 'render', 'drawing', 'schema',
          'simulation', 'realization', 'execution', 'dimension', 'representation',
          'hypothetical', 'expression', 'detailing', 'expansion', 'reformulation',
          'clarification', 'prototype', 'aspects', 'sequence', 'dissection', 'iteration',
          'deconstruction', 'conceptualization', 'synthesis', 'composition', 'layout',
          'system', 'solution', 'formulation', 'set', 'case', 'rendering', 'visualization',
          'proposition', 'image', 'version', 'theory', 'reflection', 'indication', 'idea',
          'simulation', 'assumption', 'step', 'paradigm', 'definition', 'implementation',
          'methodology', 'disposition', 'designs', 'diagram', 'equation', 'vision',
          'interpretation', 'map', 'transformation', 'example', 'formation',
          'presentation', 'proportion', 'sketch', 'systematic', 'delineation', 'format',
          'clarity', 'viewpoint', 'frame'
        ];

        for (const boq of bestOptionQuizzes) {
          // Create distractor options for each blanked word
          const distractor_map = {};
          for (const word of boq.blanked_words) {
            // Simply use the first few fallback words as distractors
            // In real implementation, this would use the getSimilarWords function
            const shuffled = fallbackWords.sort(() => 0.5 - Math.random());
            const distractors = shuffled.slice(0, 4);
            distractor_map[word] = [word, ...distractors];
          }

          await BestOptionQuestion.create({
            quiz_id: quiz.id,
            passage: boq.passage,
            blanked_words: boq.blanked_words,
            distractor_options: distractor_map,
            created_by: admin.id,
            updated_by: admin.id,
          });
        }

        console.log(`✅ All questions added to quiz "${quiz.title}"`);
      }
    }

    console.log("\n🎉 All course data seeded successfully.");
  } catch (error) {
    console.error("❌ Error inserting course data:", error);
  }
};

module.exports = insertDefaultCourseData;
