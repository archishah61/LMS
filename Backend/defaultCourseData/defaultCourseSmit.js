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
// const { QuizQuestion } = require("../models/content_management/quizQuestion");
// const { QuizQuestionOption } = require("../models/content_management/quizQuestionOption");






const SummarizePassageQuestion = require("../models/content_management/quiz-questions-types/summarPassageModel");
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
  { category: "Human Evolution", id: 1 },
];

const courses = [
  {
    id: 1,
    title: "The Story of Us: Human Evolution",
    category_id: 1,
    description: "Explore the fascinating journey of human evolution. This course covers the development from early primates to modern Homo sapiens. Learn about key ancestors, evolutionary milestones, and migration patterns. Ideal for students and curious minds interested in biology, anthropology, and human history.",
    price: 100.0,
    discount: 15,
    duration_minutes: 6 * 60,
    expiry_days: 120,
    min_access_minutes: 60,
    max_access_minutes: 120,
    what_you_will_learn: [
      "Principles of Evolution",
      "Hominid Species and Traits",
      "Out of Africa Theory"
    ],
    skill_development: [
      {
        title: "Evolutionary Concepts",
        statements: ["Understand natural selection and genetic drift.", "Analyze the fossil record and human ancestry."]
      },
      {
        title: "Biological Anthropology",
        statements: ["Trace the hominid family tree and evolution of bipedalism.", "Compare anatomical features across early hominin species."]
      },
      {
        title: "Historical Contextualization",
        statements: ["Evaluate the Out of Africa theory versus other models.", "Examine the correlation between environmental changes and evolution."]
      }
    ],
    prerequisites: ["Basic Biology Knowledge"],
    hashtags: ["#humanevolution", "#anthropology", "#biology"],
    thumbnail: "/course/thumbnail/evolutionthumbnail.jpg",
    preview_video: "/course/preview_video/evolutionPreview.mp4",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
];

const courseFAQs = [
  {
    course_id: 1,
    question: "Why are you interested in learning about human evolution?",
    created_by: 1,
    updated_by: 1,
    created_by_type: "admin",
    updated_by_type: "admin",
    options: [
      "I'm curious about human history",
      "It's part of my school curriculum",
      "I'm interested in anthropology or biology",
      "Just learning for fun"
    ]
  },
  {
    course_id: 1,
    question: "What is your current knowledge level on human evolution?",
    created_by: 1,
    updated_by: 1,
    created_by_type: "admin",
    updated_by_type: "admin",
    options: [
      "Beginner",
      "Some basic understanding",
      "Well-informed",
      "Expert"
    ]
  },
  {
    course_id: 1,
    question: "What do you hope to gain from this course?",
    created_by: 1,
    updated_by: 1,
    created_by_type: "admin",
    updated_by_type: "admin",
    options: [
      "Better understanding of human ancestry",
      "Help with school or university studies",
      "Preparation for exams",
      "Personal enrichment"
    ]
  },
  {
    course_id: 1,
    question: "How much time can you dedicate to this course each week?",
    created_by: 1,
    updated_by: 1,
    created_by_type: "admin",
    updated_by_type: "admin",
    options: [
      "Less than 2 hours",
      "2-5 hours",
      "5-10 hours",
      "More than 10 hours"
    ]
  },
  {
    course_id: 1,
    question: "Which aspect of human evolution interests you the most?",
    created_by: 1,
    updated_by: 1,
    created_by_type: "admin",
    updated_by_type: "admin",
    options: [
      "Fossil discoveries",
      "Hominid species and traits",
      "Ancient human migration",
      "Evolutionary theory and genetics"
    ]
  }
];

const sessions = [
  {
    course_id: 1,
    title: "Introduction to Human Evolution",
    chpater_description: "Get an overview of evolutionary theory and why human evolution matters.",
    status: "active",
    image_name: "session1.png",
    image_path: "/session/images/evolution_session1.png",
    min_time_in_minute: 30,
  },
  {
    course_id: 1,
    title: "The Hominid Timeline",
    chpater_description: "Explore the major stages and species in human evolutionary history.",
    status: "active",
    image_name: "session2.png",
    image_path: "/session/images/evolution_session1.png",
    min_time_in_minute: 40,
  },
  {
    course_id: 1,
    title: "Genetics and Evolution",
    chpater_description: "Understand the role of genetics in human evolution and inheritance.",
    status: "active",
    image_name: "session3.png",
    image_path: "/session/images/evolution_session1.png",
    min_time_in_minute: 35,
  },
  {
    course_id: 1,
    title: "Environmental Influences on Evolution",
    chpater_description: "Learn how environmental factors have shaped human evolution.",
    status: "active",
    image_name: "session4.png",
    image_path: "/session/images/evolution_session1.png",
    min_time_in_minute: 45,
  },
  {
    course_id: 1,
    title: "Cultural Evolution and Human Society",
    chpater_description: "Examine the impact of culture on human evolutionary processes.",
    status: "active",
    image_name: "session5.png",
    image_path: "/session/images/evolution_session1.png",
    min_time_in_minute: 50,
  }
];

const modules = [
  {
    course_id: 1,
    session_id: 1,
    title: "Understanding Evolution",
    image: "/module/image/evolution_module1.jpg",
    description: "Learn the basic principles of evolution and natural selection.",
    duration_minutes: 1 * 60,
    status: "active",
  },
  {
    course_id: 1,
    session_id: 2,
    title: "Meet the Hominids",
    image: "/module/image/evolution_module1.jpg",
    description: "Discover key hominid species like Australopithecus, Homo habilis, and Homo erectus.",
    duration_minutes: 1 * 60,
    status: "active",
  },
  {
    course_id: 1,
    session_id: 3,
    title: "Genetics in Evolution",
    image: "/module/image/evolution_module1.jpg",
    description: "Explore how genetic variations contribute to evolutionary changes.",
    duration_minutes: 1.5 * 60,
    status: "active",
  },
  {
    course_id: 1,
    session_id: 4,
    title: "Environmental Adaptations",
    image: "/module/image/evolution_module1.jpg",
    description: "Study how humans adapted to different environments throughout history.",
    duration_minutes: 2 * 60,
    status: "active",
  },
  {
    course_id: 1,
    session_id: 5,
    title: "Cultural Impact on Evolution",
    image: "/module/image/evolution_module1.jpg",
    description: "Understand the role of culture in shaping human evolution.",
    duration_minutes: 2 * 60,
    status: "active",
  }
];

const humanEvolutionIntroHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Introduction to Human Evolution</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #2c3e50;
            --secondary: #3498db;
            --accent: #e74c3c;
            --light: #ecf0f1;
            --dark: #2c3e50;
            --text: #34495e;
            --background: #f8f9fa;
            --card-bg: #ffffff;
            --gradient-start: #2980b9;
            --gradient-end: #2c3e50;
        }
        
        body {
            font-family: 'Poppins', sans-serif;
            background-color: var(--background);
            color: var(--text);
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }
        
        .evolution-guide {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px 40px;
        }
        
        .evolution-guide header {
            background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
            color: white;
            padding: 60px 30px;
            border-radius: 0 0 20px 20px;
            text-align: center;
            margin-bottom: 40px;
            box-shadow: 0 10px 30px rgba(41, 128, 185, 0.2);
            position: relative;
            overflow: hidden;
        }
        
        .evolution-guide header::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 5px;
            background: var(--accent);
        }
        
        .evolution-guide h1 {
            margin: 0;
            font-size: 3rem;
            font-weight: 700;
            font-family: 'Merriweather', serif;
            letter-spacing: -0.5px;
            margin-bottom: 15px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .evolution-guide header p {
            font-size: 1.2rem;
            max-width: 700px;
            margin: 0 auto;
            opacity: 0.9;
        }
        
        .evolution-guide h2 {
            font-size: 2rem;
            color: var(--primary);
            margin-top: 60px;
            margin-bottom: 20px;
            font-family: 'Merriweather', serif;
            position: relative;
            padding-bottom: 10px;
        }
        
        .evolution-guide h2::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 0;
            width: 60px;
            height: 4px;
            background: var(--accent);
            border-radius: 2px;
        }
        
        .evolution-guide section {
            background-color: var(--card-bg);
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
            margin-top: 30px;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border-left: 4px solid var(--secondary);
        }
        
        .evolution-guide section:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        
        .evolution-guide p {
            font-size: 1.1rem;
            margin-bottom: 20px;
        }
        
        .evolution-guide ul {
            padding-left: 20px;
            list-style-type: none;
        }
        
        .evolution-guide li {
            margin-bottom: 15px;
            padding-left: 25px;
            position: relative;
            font-size: 1.05rem;
        }
        
        .evolution-guide li::before {
            content: "•";
            color: var(--accent);
            font-size: 1.5rem;
            position: absolute;
            left: 0;
            top: -3px;
        }
        
        .evolution-guide li strong {
            color: var(--primary);
        }
        
        .evolution-guide footer {
            text-align: center;
            margin-top: 80px;
            padding: 30px;
            font-size: 0.9em;
            color: #7f8c8d;
            border-top: 1px solid #eee;
        }
        
        .timeline-highlight {
            background-color: #f8f9fa;
            padding: 30px;
            border-radius: 12px;
            margin: 40px 0;
            border-left: 4px solid var(--accent);
        }
        
        .timeline-highlight h3 {
            color: var(--accent);
            margin-top: 0;
        }
        
        @media (max-width: 768px) {
            .evolution-guide h1 {
                font-size: 2.2rem;
            }
            
            .evolution-guide h2 {
                font-size: 1.6rem;
            }
            
            .evolution-guide section {
                padding: 20px;
            }
        }
        
        /* Animation */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        section {
            animation: fadeIn 0.6s ease forwards;
        }
        
        section:nth-child(2) { animation-delay: 0.1s; }
        section:nth-child(3) { animation-delay: 0.2s; }
        section:nth-child(4) { animation-delay: 0.3s; }
        section:nth-child(5) { animation-delay: 0.4s; }
        section:nth-child(6) { animation-delay: 0.5s; }
    </style>
</head>
<body>
    <div class="evolution-guide">
        <header>
            <h1>Introduction to Human Evolution</h1>
            <p>Uncover the fascinating journey of how humans evolved from ancient ancestors to modern Homo sapiens</p>
        </header>

        <section>
            <h2>What is Human Evolution?</h2>
            <p>Human evolution is the lengthy process of change by which people originated from apelike ancestors. Scientific evidence shows that the physical and behavioral traits shared by all humans evolved over approximately six million years.</p>
            <p>This interdisciplinary field combines paleontology, anthropology, genetics, and archaeology to reconstruct our evolutionary path and understand what makes us uniquely human.</p>
        </section>

        <div class="timeline-highlight">
            <h3>Evolutionary Timeline</h3>
            <p>From our earliest ancestors to modern humans, the human evolutionary timeline spans millions of years of adaptation and change.</p>
        </div>

        <section>
            <h2>Key Concepts</h2>
            <ul>
                <li><strong>Natural Selection:</strong> The driving force of evolution where advantageous traits become more common in populations over generations.</li>
                <li><strong>Hominins:</strong> Our evolutionary lineage including species like <em>Australopithecus afarensis</em> and <em>Homo erectus</em>.</li>
                <li><strong>Fossil Record:</strong> Physical evidence including skulls, teeth, and tools that reveal our ancestral past.</li>
                <li><strong>Genetic Evidence:</strong> DNA analysis that shows our relationship to other primates and tracks human migrations.</li>
                <li><strong>Cultural Evolution:</strong> The development of tools, language, art, and social structures that complement biological evolution.</li>
            </ul>
        </section>

        <section>
            <h2>Why Study Human Evolution?</h2>
            <p>Understanding our evolutionary history provides crucial insights into human biology, health, behavior, and our place in the natural world. It helps us:</p>
            <ul>
                <li>Comprehend the origins of human diversity</li>
                <li>Understand the biological basis of many modern diseases</li>
                <li>Appreciate our connection to all life on Earth</li>
                <li>Inform conservation efforts by understanding our ecological role</li>
            </ul>
        </section>

        <section>
            <h2>Topics Covered in This Course</h2>
            <ul>
                <li>The principles of evolution and mechanisms of genetic change</li>
                <li>Major hominin species and their distinguishing characteristics</li>
                <li>Landmark fossil discoveries and their significance</li>
                <li>The emergence of modern human behavior and culture</li>
                <li>How climate change shaped human evolution</li>
                <li>Modern applications of evolutionary theory</li>
            </ul>
        </section>

        <section>
            <h2>Conclusion</h2>
            <p>Human evolution represents one of science's most compelling narratives - a story of adaptation, survival, and innovation spanning millions of years. By studying our past, we gain perspective on contemporary human challenges and opportunities.</p>
            <p>This course will take you on a journey through time, exploring the evidence and theories that explain how we became the dominant species on Earth.</p>
        </section>

        <footer>
            <p>&copy; 2025 E-Learn Platform | Enlightening generations through science and history.</p>
            <p>Explore more courses in anthropology, biology, and archaeology.</p>
        </footer>
    </div>
</body>
</html>
`;

const humanMigrationHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Human Migration and Genetic Diversity</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #5D3A9B;
            --secondary: #8E44AD;
            --accent: #E67E22;
            --light: #F5EEF8;
            --dark: #2C3E50;
            --text: #34495E;
            --background: #FAF9FC;
            --card-bg: #FFFFFF;
            --gradient-start: #5D3A9B;
            --gradient-end: #8E44AD;
        }
        
        body {
            font-family: 'Poppins', sans-serif;
            background-color: var(--background);
            color: var(--text);
            line-height: 1.7;
            margin: 0;
            padding: 0;
        }
        
        .migration-guide {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px 40px;
        }
        
        .migration-guide header {
            background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
            color: white;
            padding: 70px 30px;
            border-radius: 0 0 25px 25px;
            text-align: center;
            margin-bottom: 40px;
            box-shadow: 0 15px 35px rgba(93, 58, 155, 0.15);
            position: relative;
            overflow: hidden;
        }
        
        .migration-guide header::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 5px;
            background: var(--accent);
        }
        
        .migration-guide h1 {
            margin: 0;
            font-size: 3.2rem;
            font-weight: 700;
            font-family: 'Playfair Display', serif;
            margin-bottom: 15px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .migration-guide header p {
            font-size: 1.3rem;
            max-width: 700px;
            margin: 0 auto;
            opacity: 0.9;
            font-weight: 300;
        }
        
        .migration-guide h2 {
            font-size: 2.1rem;
            color: var(--primary);
            margin-top: 60px;
            margin-bottom: 25px;
            font-family: 'Playfair Display', serif;
            position: relative;
            padding-bottom: 12px;
        }
        
        .migration-guide h2::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 0;
            width: 70px;
            height: 4px;
            background: var(--accent);
            border-radius: 2px;
        }
        
        .migration-guide section {
            background-color: var(--card-bg);
            padding: 35px;
            border-radius: 12px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.06);
            margin-top: 35px;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border-left: 4px solid var(--secondary);
        }
        
        .migration-guide section:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .migration-guide p {
            font-size: 1.15rem;
            margin-bottom: 25px;
        }
        
        .migration-guide ul {
            padding-left: 0;
            list-style-type: none;
        }
        
        .migration-guide li {
            margin-bottom: 18px;
            padding-left: 35px;
            position: relative;
            font-size: 1.1rem;
        }
        
        .migration-guide li::before {
            content: "➤";
            color: var(--accent);
            position: absolute;
            left: 0;
            top: -1px;
        }
        
        .migration-guide li strong {
            color: var(--primary);
        }
        
        .migration-guide footer {
            text-align: center;
            margin-top: 80px;
            padding: 30px;
            font-size: 0.95em;
            color: #7f8c8d;
            border-top: 1px solid #eee;
        }
        
        .migration-map {
            background-color: var(--light);
            padding: 30px;
            border-radius: 12px;
            margin: 40px 0;
            border-left: 4px solid var(--accent);
            display: flex;
            align-items: center;
        }
        
        .migration-map img {
            max-width: 150px;
            margin-right: 25px;
        }
        
        .migration-map-content {
            flex: 1;
        }
        
        .migration-map h3 {
            color: var(--accent);
            margin-top: 0;
            font-size: 1.4rem;
        }
        
        .key-fact {
            background-color: var(--light);
            border-left: 4px solid var(--primary);
            padding: 20px;
            margin: 30px 0;
            font-style: italic;
        }
        
        @media (max-width: 768px) {
            .migration-guide h1 {
                font-size: 2.4rem;
            }
            
            .migration-guide h2 {
                font-size: 1.8rem;
            }
            
            .migration-guide section {
                padding: 25px;
            }
            
            .migration-map {
                flex-direction: column;
                text-align: center;
            }
            
            .migration-map img {
                margin-right: 0;
                margin-bottom: 20px;
            }
        }
        
        /* Animation */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        section {
            animation: fadeInUp 0.7s ease forwards;
        }
        
        section:nth-child(2) { animation-delay: 0.1s; }
        section:nth-child(3) { animation-delay: 0.2s; }
        section:nth-child(4) { animation-delay: 0.3s; }
        section:nth-child(5) { animation-delay: 0.4s; }
        section:nth-child(6) { animation-delay: 0.5s; }
    </style>
</head>
<body>
    <div class="migration-guide">
        <header>
            <h1>Human Migration and Genetic Diversity</h1>
            <p>Exploring the epic journeys that shaped humanity's global footprint</p>
        </header>

        <section>
            <h2>What Is Human Migration?</h2>
            <p>Human migration refers to the movement of people from one geographical region to another, often resulting in permanent settlement. This fundamental aspect of human history has shaped our species' genetic diversity, cultural development, and global distribution.</p>
            <p>From our earliest ancestors leaving Africa to modern diaspora communities, migration continues to redefine human societies and biological adaptation.</p>
        </section>

        <div class="migration-map">
            <img src="https://placeholder.com/migration-map.png" alt="Human migration routes illustration">
            <div class="migration-map-content">
                <h3>Global Migration Pathways</h3>
                <p>Modern genetic analysis combined with archaeological evidence reveals the complex web of human migration routes that connected continents over millennia.</p>
            </div>
        </div>

        <section>
            <h2>Key Migration Events</h2>
            <ul>
                <li><strong>Out of Africa (60,000-70,000 years ago):</strong> The seminal migration that saw Homo sapiens spread from Africa to Eurasia, eventually reaching all habitable continents.</li>
                <li><strong>Peopling of the Americas (15,000-20,000 years ago):</strong> Migration across the Bering Land Bridge during glacial periods, with coastal routes possibly preceding inland expansion.</li>
                <li><strong>Neolithic Expansion (10,000 years ago):</strong> The spread of agricultural communities from the Fertile Crescent, transforming human settlement patterns.</li>
                <li><strong>Indo-European Migrations (4,000-5,000 years ago):</strong> Movements that spread languages and cultures across Europe and South Asia.</li>
                <li><strong>Modern Global Migrations:</strong> Contemporary movements driven by economic opportunity, political instability, and environmental factors.</li>
            </ul>
        </section>

        <div class="key-fact">
            <p>Genetic studies show that all non-African humans today descend from a single population that left Africa between 50,000-80,000 years ago, carrying just a fraction of our species' total genetic diversity.</p>
        </div>

        <section>
            <h2>Genetic Diversity and Adaptation</h2>
            <p>Human migration has been the primary driver of genetic diversity as populations adapted to new environments. Selective pressures led to:</p>
            <ul>
                <li>Skin pigmentation variations in response to UV radiation levels</li>
                <li>Altitude adaptation in Tibetan and Andean populations</li>
                <li>Lactose tolerance development in pastoral societies</li>
                <li>Disease resistance variations based on regional pathogens</li>
            </ul>
            <p>Modern DNA analysis reveals these adaptations and helps reconstruct ancient migration patterns through genetic markers.</p>
        </section>

        <section>
            <h2>Why Study Human Migration?</h2>
            <p>Understanding human migration provides crucial insights into:</p>
            <ul>
                <li>The origins of modern populations and ethnic groups</li>
                <li>Patterns of genetic disease prevalence</li>
                <li>Cultural diffusion and language development</li>
                <li>Human responses to environmental change</li>
                <li>Contemporary issues of displacement and diaspora communities</li>
            </ul>
        </section>

        <section>
            <h2>Conclusion</h2>
            <p>The story of human migration is the story of our species - a narrative of exploration, adaptation, and resilience. From small bands of hunter-gatherers to today's globalized world, movement has been a constant in human history.</p>
            <p>By studying these ancient journeys, we not only understand our past but gain perspective on current migration challenges and our shared human heritage.</p>
        </section>

        <footer>
            <p>&copy; 2025 E-Learn Platform | Enlightening generations through science and history.</p>
            <p>Explore our courses in anthropology, genetics, and world history.</p>
        </footer>
    </div>
</body>
</html>
`;

const earlyHominidsHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Early Hominids and Their Environment</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background-color: #fffaf0;
            color: #2c3e50;
            font-family: 'Outfit', sans-serif;
            line-height: 1.6;
        }
        
        .hominids-guide {
            max-width: 1200px;
            margin: 40px auto;
            padding: 0;
            box-shadow: 0 15px 40px rgba(211, 84, 0, 0.1);
            border-radius: 16px;
            overflow: hidden;
            background-color: #ffffff;
        }
        
        .hominids-guide header {
            background: linear-gradient(135deg, #d35400, #f39c12);
            color: #fff;
            padding: 60px 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .hominids-guide header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSg0NSkiPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjQiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idHJhbnNwYXJlbnQiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48cmVjdCBmaWxsPSJ1cmwoI3BhdHRlcm4pIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+');
            opacity: 0.5;
        }
        
        .hominids-guide h1 {
            margin: 0 0 15px 0;
            font-size: 3.2em;
            font-weight: 700;
            letter-spacing: -0.5px;
            position: relative;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .hominids-guide header p {
            font-size: 1.4em;
            font-weight: 300;
            max-width: 700px;
            margin: 0 auto;
            position: relative;
            opacity: 0.9;
        }
        
        .hominids-guide h2 {
            font-size: 1.9em;
            color: #d35400;
            padding-bottom: 12px;
            margin-top: 0;
            margin-bottom: 20px;
            position: relative;
            font-weight: 600;
        }
        
        .hominids-guide h2::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 70px;
            height: 3px;
            background: linear-gradient(to right, #d35400, #f39c12);
            border-radius: 3px;
        }
        
        .hominids-guide section {
            background-color: #ffffff;
            padding: 40px;
            margin: 0;
            border-bottom: 1px solid rgba(211, 84, 0, 0.08);
            transition: all 0.3s ease;
            position: relative;
        }
        
        .hominids-guide section:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(211, 84, 0, 0.07);
            z-index: 1;
        }
        
        .hominids-guide section:last-of-type {
            border-bottom: none;
        }
        
        .hominids-guide p {
            font-size: 1.1em;
            color: #4b5563;
            margin-bottom: 15px;
            line-height: 1.7;
        }
        
        .hominids-guide em {
            font-style: italic;
            color: #d35400;
        }
        
        .hominids-guide ul {
            padding-left: 5px;
            list-style-type: none;
        }
        
        .hominids-guide li {
            margin-bottom: 18px;
            position: relative;
            padding-left: 28px;
            color: #4b5563;
        }
        
        .hominids-guide li::before {
            content: '';
            position: absolute;
            left: 0;
            top: 10px;
            width: 10px;
            height: 10px;
            background-color: #f39c12;
            border-radius: 50%;
            box-shadow: 0 0 0 2px rgba(243, 156, 18, 0.2);
        }
        
        .hominids-guide li strong {
            color: #d35400;
            font-weight: 600;
            display: block;
            margin-bottom: 3px;
            font-size: 1.05em;
        }
        
        .hominids-guide footer {
            text-align: center;
            padding: 35px 40px;
            background-color: #fff8ee;
            color: #7f8c8d;
            font-size: 0.95em;
            border-top: 1px solid rgba(211, 84, 0, 0.08);
        }
        
        @media (max-width: 768px) {
            .hominids-guide {
                margin: 20px;
                border-radius: 12px;
            }
            
            .hominids-guide header {
                padding: 40px 20px;
            }
            
            .hominids-guide h1 {
                font-size: 2.3em;
            }
            
            .hominids-guide header p {
                font-size: 1.1em;
            }
            
            .hominids-guide section {
                padding: 30px 20px;
            }
            
            .hominids-guide h2 {
                font-size: 1.6em;
            }
        }
        
        /* Subtle animation for sections */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .hominids-guide section {
            animation: fadeIn 0.5s ease-out forwards;
            opacity: 0;
        }
        
        .hominids-guide section:nth-child(2) { animation-delay: 0.1s; }
        .hominids-guide section:nth-child(3) { animation-delay: 0.2s; }
        .hominids-guide section:nth-child(4) { animation-delay: 0.3s; }
        .hominids-guide section:nth-child(5) { animation-delay: 0.4s; }
        .hominids-guide section:nth-child(6) { animation-delay: 0.5s; }
    </style>
</head>
<body>
    <div class="hominids-guide">
        <header>
            <h1>Early Hominids and Their Environment</h1>
            <p>Explore the origins of our ancestors</p>
        </header>
        <section>
            <h2>Who Were the Early Hominids?</h2>
            <p>Early hominids are the ancestors and relatives of modern humans. They include species like <em>Australopithecus</em> and <em>Homo habilis</em>, who lived millions of years ago and exhibited both ape-like and human-like characteristics.</p>
        </section>
        <section>
            <h2>Key Species</h2>
            <ul>
                <li><strong>Australopithecus afarensis:</strong> Known as "Lucy," this species lived around 3.2 million years ago and is one of the most famous early hominids.</li>
                <li><strong>Homo habilis:</strong> Often called "handy man," this species is known for using stone tools and lived around 2.4 to 1.4 million years ago.</li>
                <li><strong>Homo erectus:</strong> An early human species that migrated out of Africa and used more advanced tools.</li>
            </ul>
        </section>
        <section>
            <h2>Environment and Adaptations</h2>
            <p>Early hominids lived in diverse environments, from dense forests to open savannas. Their adaptations, such as bipedalism (walking on two legs) and tool use, helped them survive and thrive in these changing landscapes.</p>
        </section>
        <section>
            <h2>Why Study Early Hominids?</h2>
            <p>Studying early hominids helps us understand the origins of human traits and behaviors. It provides insights into how our ancestors lived, adapted, and evolved over millions of years.</p>
        </section>
        <section>
            <h2>Conclusion</h2>
            <p>Early hominids are a crucial part of our evolutionary story. By learning about their lives and environments, we gain a deeper appreciation for the journey that led to modern humans.</p>
        </section>
        <footer>
            &copy; 2025 E-Learn Platform | Enlightening generations through science and history.
        </footer>
    </div>
</body>
</html>
`;

const humanToolsHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Evolution of Human Tools and Technology</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
       
        body {
            background-color: #f8f9fa;
            color: #2c3e50;
            font-family: 'Poppins', sans-serif;
            line-height: 1.6;
        }
       
        .tools-guide {
            max-width: 1200px;
            margin: 40px auto;
            padding: 0;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            overflow: hidden;
            background-color: #ffffff;
        }
       
        .tools-guide header {
            background: linear-gradient(135deg, #0f766e, #10b981);
            color: #fff;
            padding: 60px 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
       
        .tools-guide header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSgzMCkiPjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idHJhbnNwYXJlbnQiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48cmVjdCBmaWxsPSJ1cmwoI3BhdHRlcm4pIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+');
            opacity: 0.4;
        }
       
        .tools-guide h1 {
            margin: 0 0 15px 0;
            font-size: 3em;
            font-weight: 700;
            letter-spacing: -0.5px;
            position: relative;
        }
       
        .tools-guide header p {
            font-size: 1.3em;
            font-weight: 300;
            max-width: 700px;
            margin: 0 auto;
            position: relative;
        }
       
        .tools-guide h2 {
            font-size: 1.8em;
            color: #0f766e;
            padding-bottom: 12px;
            margin-top: 0;
            margin-bottom: 20px;
            position: relative;
            font-weight: 600;
        }
       
        .tools-guide h2::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 60px;
            height: 3px;
            background: linear-gradient(to right, #0f766e, #10b981);
            border-radius: 3px;
        }
       
        .tools-guide section {
            background-color: #ffffff;
            padding: 40px;
            margin: 0;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
       
        .tools-guide section:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
        }
       
        .tools-guide section:last-of-type {
            border-bottom: none;
        }
       
        .tools-guide p {
            font-size: 1.05em;
            color: #4b5563;
            margin-bottom: 15px;
        }
       
        .tools-guide ul {
            padding-left: 20px;
            list-style-type: none;
        }
       
        .tools-guide li {
            margin-bottom: 15px;
            position: relative;
            padding-left: 25px;
            color: #4b5563;
        }
       
        .tools-guide li::before {
            content: '';
            position: absolute;
            left: 0;
            top: 10px;
            width: 8px;
            height: 8px;
            background-color: #10b981;
            border-radius: 50%;
        }
       
        .tools-guide li strong {
            color: #0f766e;
            font-weight: 600;
        }
       
        .tools-guide footer {
            text-align: center;
            padding: 30px 40px;
            background-color: #f8f9fa;
            color: #6b7280;
            font-size: 0.9em;
            border-top: 1px solid rgba(0, 0, 0, 0.05);
        }
       
        @media (max-width: 768px) {
            .tools-guide {
                margin: 20px;
                border-radius: 8px;
            }
           
            .tools-guide header {
                padding: 40px 20px;
            }
           
            .tools-guide h1 {
                font-size: 2.2em;
            }
           
            .tools-guide header p {
                font-size: 1.1em;
            }
           
            .tools-guide section {
                padding: 30px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="tools-guide">
        <header>
            <h1>The Evolution of Human Tools and Technology</h1>
            <p>Discover how tools shaped human evolution</p>
        </header>
 
        <section>
            <h2>What Are Human Tools?</h2>
            <p>Human tools are objects created or modified by humans to perform specific tasks. The development and use of tools have played a crucial role in human evolution, enabling our ancestors to adapt and thrive in various environments.</p>
        </section>
 
        <section>
            <h2>Key Developments</h2>
            <ul>
                <li><strong>Stone Tools:</strong> The earliest tools were made of stone, such as the Oldowan and Acheulean tools used by early hominids.</li>
                <li><strong>Fire:</strong> The control of fire allowed early humans to cook food, stay warm, and protect themselves from predators.</li>
                <li><strong>Metal Tools:</strong> The discovery of metals like copper, bronze, and iron led to more advanced tools and weapons.</li>
                <li><strong>Agricultural Tools:</strong> The development of farming tools enabled the transition from hunting and gathering to agriculture.</li>
            </ul>
        </section>
 
        <section>
            <h2>Impact on Human Evolution</h2>
            <p>The use of tools had a profound impact on human evolution. It allowed our ancestors to access new food sources, protect themselves, and create more complex societies. Tool use also contributed to the development of the human brain and cognitive abilities.</p>
        </section>
 
        <section>
            <h2>Why Study Human Tools?</h2>
            <p>Studying the evolution of human tools provides insights into the ingenuity and adaptability of our ancestors. It helps us understand how technological advancements have shaped human history and culture.</p>
        </section>
 
        <section>
            <h2>Conclusion</h2>
            <p>The evolution of human tools and technology is a testament to our species' creativity and resilience. By exploring this journey, we gain a deeper appreciation for the innovations that have shaped our world.</p>
        </section>
 
        <footer>
            &copy; 2025 E-Learn Platform | Enlightening generations through science and history.
        </footer>
    </div>
</body>
</html>
`;

const basicTopics = [
  {
    module_id: 1,
    title: "Intro to Human Evolution - Video",
    description: "An engaging introduction to the principles of human evolution",
    content_type: "video",
    video: {
      url: "/video/evolutionIntro.mp4",
      duration_minutes: 10,
      transcript: "Welcome to the fascinating journey of human evolution...",
      audio_url: "/audios/video/evolutionIntroAudio.mp3",
      bullet_points: [
        { time: 0, text: "Evolution Basics" },
        { time: 60, text: "Hominid Species" }
      ],
    },
  },
  {
    module_id: 1,
    title: "Evolution Explained - Audio",
    description: "Listen to a detailed explanation of evolutionary concepts",
    content_type: "audio",
    audio: {
      url: "/audio/evolutionAudio.mp3",
      duration_minutes: 6,
    },
  },
  {
    module_id: 1,
    title: "Key Concepts of Evolution - Accordion",
    description: "Explore main ideas in evolutionary science",
    content_type: "accordian",
    accordions: [
      {
        title: "Natural Selection",
        body: "Natural selection is a fundamental mechanism of evolution, first proposed by Charles Darwin. It explains how species evolve over time through the differential survival and reproduction of individuals due to differences in phenotype. It is the process whereby organisms better adapted to their environment tend to survive and produce more offspring. The theory's basic premise is that traits that enhance survival and reproduction will become more common in successive generations of a population, leading to evolutionary change.",
        codeLanguage: "text",
        code: "Survival of the fittest in varying environments.",
        audio_url: "/audios/accordion/evolutionAudio.mp3",
      },
      {
        title: "Genetic Drift",
        body: "Genetic drift refers to random fluctuations in the frequency of alleles in a population's gene pool. Unlike natural selection, which is driven by environmental pressures, genetic drift is a stochastic process that can lead to significant changes in small populations. It can result in the loss of genetic variation as some alleles may become fixed or lost entirely from the population. Genetic drift is particularly influential in small or isolated populations where chance events can have large effects on the population's genetic makeup.",
        codeLanguage: "text",
        code: "More pronounced in smaller populations.",
        audio_url: "/audios/accordion/brainEvolution.mp3",
      },
      {
        title: "Mutation",
        body: "Mutations are changes in the DNA sequence of a cell's genome and are the driving force of genetic diversity. They can occur due to errors during DNA replication, exposure to mutagens, or viral insertion. Mutations can be beneficial, leading to new advantageous traits, neutral with no significant impact on fitness, or harmful, potentially causing genetic disorders. Mutations are essential for evolution as they introduce new genetic variations into a population, which can then be acted upon by natural selection.",
        codeLanguage: "text",
        code: "Can be beneficial, neutral, or harmful.",
        audio_url: "/audios/accordion/culturalPractices.mp3",
      },
      {
        title: "Gene Flow",
        body: "Gene flow, also known as gene migration, is the transfer of genetic material between populations. It occurs through the movement of individuals or gametes (e.g., pollen) from one population to another, leading to interbreeding. Gene flow can introduce new alleles into a population, increasing genetic diversity and potentially introducing traits that are beneficial in the new environment. This process can counteract the effects of genetic drift and natural selection, helping to maintain genetic connectivity among populations.",
        codeLanguage: "text",
        code: "Occurs through migration and interbreeding.",
        audio_url: "/audios/accordion/humanEvolutionAudio01.mp3",
      },
      {
        title: "Adaptation",
        body: "Adaptation is the evolutionary process whereby an organism becomes better suited to its habitat. This process involves both physical and behavioral changes that enhance survival and reproduction. Adaptations can be structural, such as the shape of a bird's beak, physiological, like the ability to regulate body temperature, or behavioral, such as migration patterns. Adaptations arise through natural selection, where traits that confer a survival advantage are passed on to future generations, leading to evolutionary change.",
        codeLanguage: "text",
        code: "Involves both physical and behavioral changes.",
        audio_url: "/audios/accordion/humanEvolutionAudio02.mp3",
      }
    ]
  },
  {
    module_id: 1,
    title: "Human Evolution Summary PDF",
    description: "A concise summary of the key points in PDF format",
    content_type: "general",
    general: {
      title: "Evolution Summary",
      description: humanEvolutionIntroHTML,
      url: "/material/pdf/human-evolution-summary.pdf",
      audio_url: "/audios/general/evolutionAudio.mp3",
      material_type: "pdf",
    },
  },
  {
    module_id: 1,
    title: "Early Human Ancestors - Video",
    description: "Discover the early ancestors of humans through video",
    content_type: "video",
    video: {
      url: "/video/geneticEvolutionIntro.mp4",
      duration_minutes: 12,
      transcript: "Explore the origins of human ancestors and their way of life...",
      audio_url: "/audios/video/earlyHumanAncestorsAudio.mp3",
      bullet_points: [
        { time: 0, text: "Introduction to Early Ancestors" },
        { time: 60, text: "Lifestyle and Habitat" }
      ],
    },
  },
  {
    module_id: 1,
    title: "Evolutionary Milestones - Audio",
    description: "Listen to key milestones in human evolution",
    content_type: "audio",
    audio: {
      url: "/audio/geneticMutations.mp3",
      duration_minutes: 7,
    },
  },
  {
    module_id: 1,
    title: "Fossil Evidence - Accordion",
    description: "Examine the fossil evidence supporting human evolution",
    content_type: "accordian",
    accordions: [
      {
        title: "Lucy - Australopithecus afarensis",
        body: "Lucy is one of the most complete early human skeletons ever found, belonging to the species Australopithecus afarensis. Discovered in 1974 in the Afar region of Ethiopia, Lucy lived approximately 3.2 million years ago. She is significant because her skeleton provides extensive insights into the anatomy and locomotion of early hominids. Lucy's skeletal structure indicates that she was bipedal, walking upright on two legs, which is a key trait in human evolution. Her discovery has greatly contributed to our understanding of the evolutionary transition from tree-dwelling to ground-dwelling hominids.",
        codeLanguage: "text",
        code: "Discovered in Ethiopia, Lucy lived approximately 3.2 million years ago.",
        audio_url: "/audios/accordion/evolutionAudio.mp3",
      },
      {
        title: "Homo habilis",
        body: "Homo habilis, often referred to as 'handy man,' is one of the earliest members of the genus Homo, living approximately 2.4 to 1.4 million years ago. This species is notable for its association with the development and use of early stone tools, marking a significant advancement in hominid technology. Homo habilis had a larger brain relative to body size compared to earlier hominids, which is believed to have facilitated more complex behaviors and tool-making abilities. Their fossils have been found in various parts of Africa, providing evidence of their widespread presence and adaptability.",
        codeLanguage: "text",
        code: "Known for early stone tool use and larger brain size.",
        audio_url: "/audios/accordion/brainEvolution.mp3",
      },
      {
        title: "Homo erectus",
        body: "Homo erectus is an extinct species of hominid that lived from approximately 1.9 million to 110,000 years ago. This species is significant for being the first to exhibit a more modern human-like body structure, with longer legs and shorter arms compared to earlier hominids, indicating a shift towards a more efficient bipedal locomotion. Homo erectus is also notable for being the first hominid to migrate out of Africa, spreading to regions of Asia and Europe. They are associated with more advanced tool use, including the Acheulean stone tools, and the controlled use of fire, which had profound implications for social and dietary behaviors.",
        codeLanguage: "text",
        code: "First hominid to migrate out of Africa and use fire.",
        audio_url: "/audios/accordion/culturalPractices.mp3",
      },
      {
        title: "Neanderthals",
        body: "Neanderthals, or Homo neanderthalensis, are an extinct species of hominid that lived in Europe and parts of western and central Asia from about 400,000 to 40,000 years ago. They are known for their robust body structure, adapted to cold climates, and their relatively large brain size. Neanderthals are significant for their advanced cultural behaviors, including the creation of complex tools, use of fire, and evidence of symbolic thought such as burial practices and cave art. Genetic studies have shown that Neanderthals interbred with early Homo sapiens, contributing to the genetic makeup of modern humans outside of Africa.",
        codeLanguage: "text",
        code: "Known for robust bodies, advanced tools, and symbolic behavior.",
        audio_url: "/audios/accordion/humanEvolutionAudio01.mp3",
      },
      {
        title: "Homo sapiens",
        body: "Homo sapiens, or modern humans, emerged approximately 300,000 years ago in Africa. They are characterized by a highly developed brain, capable of abstract reasoning, language, introspection, and problem-solving. Homo sapiens are notable for their advanced cultural and technological developments, including the creation of art, complex social structures, and the development of agriculture. The migration of Homo sapiens out of Africa and their subsequent spread across the globe led to the establishment of diverse cultures and civilizations. Their ability to adapt to a wide range of environments has been a key factor in their evolutionary success.",
        codeLanguage: "text",
        code: "Characterized by advanced cognitive abilities and cultural diversity.",
        audio_url: "/audios/accordion/humanEvolutionAudio02.mp3",
      }
    ]
  },
  {
    module_id: 1,
    title: "Human Migration Patterns PDF",
    description: "A detailed look at human migration patterns in PDF format",
    content_type: "general",
    general: {
      title: "Migration Patterns",
      description: humanEvolutionIntroHTML,
      url: "/material/pdf/cultural-evolution-summary.pdf",
      audio_url: "/audios/general/culturalAudio.mp3",
      material_type: "pdf",
    },
  },
  {
    module_id: 1,
    title: "Genetic Insights - Video",
    description: "Understand the genetic insights into human evolution",
    content_type: "video",
    video: {
      url: "/video/hominidEvolutionIntro.mp4",
      duration_minutes: 11,
      transcript: "Genetic studies reveal the intricate details of human evolution...",
      audio_url: "/audios/video/geneticInsightsAudio.mp3",
      bullet_points: [
        { time: 0, text: "Introduction to Genetic Studies" },
        { time: 60, text: "Key Genetic Discoveries" }
      ],
    },
  },
  {
    module_id: 1,
    title: "Human Evolution Slides",
    description: "Multi-format slide content covering evolutionary topics",
    content_type: "slide",
    slides: [
      {
        title: "Timeline of Evolution - Video",
        description: "Watch the major milestones in human evolution",
        content_type: "video",
        video: {
          url: "/multiSlide/video/evolutionTimeline.mp4",
          duration_minutes: 5,
          audio_url: "/audios/slide_video/evolutionAudio.mp3",
        },
      },
      // {
      //   title: "Major Hominid Species - Audio",
      //   description: "Audio summary of key hominids like Homo habilis and Homo erectus",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/hominidSpeciesAudio.mp3",
      //     duration_minutes: 4,
      //   },
      // },
      {
        title: "Evolution Concepts - Accordion",
        description: "Break down evolutionary theories and examples",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/slideAudioUrl[4].mp3",
        accordions: [
          {
            title: "Hominid Traits",
            body: "Includes bipedalism, larger brains, and tool use.",
            codeLanguage: "text",
            code: "Homo erectus used stone tools and walked upright.",
            audio_url: "/audios/slide_accordion/slideAudioUrl[5].mp3",
          },
          {
            title: "Migration Patterns",
            body: "Early humans migrated from Africa to Asia and Europe.",
            codeLanguage: "text",
            code: "Out-of-Africa theory explains global distribution.",
            audio_url: "/audios/slide_accordion/migration.mp3",
          },
        ],
      },
      {
        title: "Fossil Discoveries - Video",
        description: "Explore significant fossil finds and their impact on evolutionary theory",
        content_type: "video",
        video: {
          url: "/multiSlide/video/fossilDiscoveries.mp4",
          duration_minutes: 6,
          audio_url: "/audios/slide_video/fossilAudio.mp3",
        },
      },
      // {
      //   title: "Genetic Evolution - Audio",
      //   description: "Understand the genetic changes that define human evolution",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/hominidSpeciesAudio.mp3",
      //     duration_minutes: 5,
      //   },
      // },
      {
        title: "Cultural Evolution - Accordion",
        description: "Examine the cultural advancements of early humans",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/slideAudioUrl[2].mp3",
        accordions: [
          {
            title: "Art and Symbolism",
            body: "Early humans created intricate cave paintings and symbolic artifacts that provide a window into their cultural and cognitive development. These artistic expressions, such as those found in the caves of Lascaux, France, dating back approximately 17,000 years, depict various animals, human figures, and abstract symbols. These works of art suggest a sophisticated understanding of their environment and a capacity for symbolic thought, which are key indicators of advanced cognitive abilities and cultural complexity.",
            codeLanguage: "text",
            code: "Cave paintings in Lascaux, France, date back to 17,000 years ago.",
            audio_url: "/audios/slide_accordion/artSymbolism.mp3",
          },
          {
            title: "Development of Language",
            body: "The evolution of language is a critical milestone in human development, facilitating the formation of complex social structures and the transmission of knowledge across generations. Language development is closely linked to the increase in brain size and complexity observed in the fossil record. As early humans developed more sophisticated communication methods, they were able to coordinate more effectively, share knowledge, and establish cultural norms, which significantly enhanced their survival and adaptability.",
            codeLanguage: "text",
            code: "Language development is linked to the increase in brain size.",
            audio_url: "/audios/slide_accordion/languageDevelopment.mp3",
          },
          {
            title: "Social Structures",
            body: "The development of social structures among early humans played a crucial role in their survival and evolution. These structures, including family units, kinship networks, and communal living arrangements, allowed for the sharing of resources, protection, and care of offspring. Social structures facilitated cooperation and division of labor, which were essential for the success and expansion of human groups. Evidence from archaeological sites suggests that early humans lived in organized communities, which helped them thrive in diverse and challenging environments.",
            codeLanguage: "text",
            code: "Social structures include family units and kinship networks.",
            audio_url: "/audios/slide_accordion/socialStructures.mp3",
          },
          {
            title: "Tool Use and Technology",
            body: "The use and development of tools are defining characteristics of human evolution. Early humans progressed from simple stone tools to more complex and specialized implements, which significantly impacted their ability to hunt, gather, and process food. Technological advancements, such as the controlled use of fire, allowed for the cooking of food, which improved nutrition and health. These innovations reflect the cognitive and cultural advancements of early humans and their ability to adapt to and manipulate their environment.",
            codeLanguage: "text",
            code: "Tool use ranges from simple stone tools to complex implements.",
            audio_url: "/audios/slide_accordion/toolUse.mp3",
          },
          {
            title: "Migration and Settlement",
            body: "Migration and settlement patterns of early humans are key aspects of their evolutionary history. The movement of human populations out of Africa and into various regions of the world allowed them to adapt to new environments and exploit diverse resources. These migrations led to the establishment of settlements and the development of regional cultures. The study of migration patterns provides insights into the adaptability and resilience of early humans, as well as their interactions with other hominid species.",
            codeLanguage: "text",
            code: "Migration led to the establishment of settlements and regional cultures.",
            audio_url: "/audios/slide_accordion/migrationSettlement.mp3",
          }
        ]
      },
      {
        title: "Environmental Adaptations - Video",
        description: "Learn how early humans adapted to different environments",
        content_type: "video",
        video: {
          url: "/multiSlide/video/environmentalTimeline.mp4",
          duration_minutes: 7,
          audio_url: "/audios/slide_video/evolutionAudio.mp3",
        },
      },
      // {
      //   title: "Technological Innovations - Audio",
      //   description: "Discover the technological advancements of early humans",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/environmentalAdaptationsAudio.mp3",
      //     duration_minutes: 5,
      //   },
      // },
      {
        title: "Social Structures - Accordion",
        description: "Understand the social structures of early human societies",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/slideAudioUrl[3].mp3",
        accordions: [
          {
            title: "Family and Kinship",
            body: "Early humans lived in family groups and kinship networks, which were fundamental to their social structure and survival. These kinship ties were crucial for cooperation, resource sharing, and protection. Family units provided a stable environment for raising offspring and ensured the transmission of knowledge and cultural practices across generations. Kinship networks extended beyond immediate family, creating larger social groups that enhanced collective survival strategies and social cohesion.",
            codeLanguage: "text",
            code: "Kinship ties were crucial for survival and cooperation.",
            audio_url: "/audios/slide_accordion/familyKinship.mp3",
          },
          {
            title: "Division of Labor",
            body: "Division of labor based on gender and age was common in early human societies, reflecting a strategic adaptation to environmental and social challenges. Typically, men engaged in hunting activities, which required strength and mobility, while women focused on gathering plant resources and caring for children, tasks that demanded knowledge of local flora and nurturing skills. This division allowed for efficient resource acquisition and utilization, maximizing the survival and well-being of the group.",
            codeLanguage: "text",
            code: "Men hunted while women gathered and cared for children.",
            audio_url: "/audios/slide_accordion/divisionLabor.mp3",
          },
          {
            title: "Social Hierarchies",
            body: "Social hierarchies emerged as early human societies grew more complex, establishing roles and statuses within the group. These hierarchies were often based on age, gender, skill, or kinship ties, and they helped organize communal activities and decision-making processes. Leaders or elders typically held significant influence, guiding the group in matters of conflict resolution, resource distribution, and cultural practices, thereby maintaining order and cohesion.",
            codeLanguage: "text",
            code: "Hierarchies were based on age, gender, skill, or kinship.",
            audio_url: "/audios/slide_accordion/socialHierarchies.mp3",
          },
          {
            title: "Cultural Transmission",
            body: "Cultural transmission was vital for the preservation and evolution of early human societies. Through oral traditions, storytelling, and communal rituals, knowledge and skills were passed down from one generation to the next. This transmission of cultural information enabled the accumulation of knowledge, the refinement of survival strategies, and the development of complex social norms and technological innovations.",
            codeLanguage: "text",
            code: "Knowledge was passed down through oral traditions and rituals.",
            audio_url: "/audios/slide_accordion/culturalTransmission.mp3",
          },
          {
            title: "Conflict Resolution",
            body: "Conflict resolution mechanisms were essential in maintaining harmony within early human groups. Disputes over resources, social status, or interpersonal issues were typically mediated through established social norms, the intervention of respected elders, or communal discussions. Effective conflict resolution strategies ensured group stability and cooperation, which were critical for the collective survival and success of the community.",
            codeLanguage: "text",
            code: "Conflicts were resolved through social norms and elder intervention.",
            audio_url: "/audios/slide_accordion/conflictResolution.mp3",
          }
        ]
      },
      {
        title: "Future of Human Evolution - Video",
        description: "Speculate on the future directions of human evolution",
        content_type: "video",
        video: {
          url: "/multiSlide/video/geneticTimeline.mp4",
          duration_minutes: 8,
          audio_url: "/audios/slide_video/fossilAudio.mp3",
        },
      },
      // {
      //   title: "Human Evolution Resources - General",
      //   description: humanMigrationHTML,
      //   content_type: "general",
      //   MultiSlideGenerals: [
      //     {
      //       url: "/multiSlide/general/pdf/culturalCheatSheet.pdf",
      //       material_type: "pdf",
      //       codeLanguage: "text",
      //       code: "Reference: Smithsonian Human Evolution Research (2023)",
      //     },
      //   ]
      // }
    ]
  },
];

const functionTopics = [
  {
    module_id: 2,
    title: "Hominid Evolution Overview - Video",
    description: "Understand the evolutionary timeline of hominids.",
    content_type: "video",
    video: {
      url: "/video/humanEvolutionVideo01.mp4",
      duration_minutes: 8,
      transcript: "In this video, we explore the evolution of early hominids and their key traits...",
      audio_url: "/audios/video/hominidEvolutionAudio.mp3",
      bullet_points: [
        { time: 0, text: "Australopithecus Introduction" },
        { time: 120, text: "Emergence of Homo Genus" },
      ],
    },
  },
  {
    module_id: 2,
    title: "Major Hominid Species - Accordion",
    description: "Explore the characteristics of important hominid species.",
    content_type: "accordian",
    accordions: [
      {
        title: "Australopithecus afarensis",
        body: "Australopithecus afarensis is one of the earliest known hominids, renowned for its bipedalism, which is a significant evolutionary step towards modern humans. The most famous specimen of this species is 'Lucy,' discovered in Ethiopia, who lived approximately 3.9 to 2.9 million years ago. Lucy's skeletal structure provides crucial insights into the early stages of human evolution, particularly the transition to walking upright, which had profound implications for the development of human locomotion and lifestyle.",
        codeLanguage: "text",
        code: "Lived approximately 3.9-2.9 million years ago.",
        audio_url: "/audios/accordion/australopithecusAudio.mp3",
      },
      {
        title: "Homo habilis",
        body: "Homo habilis, often referred to as 'handy man,' is notable for its association with the creation and use of early stone tools, marking a significant advancement in hominid technology. Living approximately 2.4 to 1.4 million years ago, Homo habilis had a larger brain relative to its body size compared to earlier hominids, which likely facilitated more complex behaviors and tool-making abilities. This species represents a crucial step in the cognitive and cultural evolution of early humans.",
        codeLanguage: "text",
        code: "Lived approximately 2.4-1.4 million years ago.",
        audio_url: "/audios/accordion/homoHabilisAudio.mp3",
      },
      {
        title: "Homo erectus",
        body: "Homo erectus is significant for being the first hominid to use fire and migrate out of Africa, spreading to various regions of Asia and Europe. This species lived from approximately 1.9 million to 110,000 years ago and exhibited a more modern human-like body structure, with longer legs and shorter arms, indicating a shift towards efficient bipedal locomotion. Homo erectus is also associated with more advanced tool use, including the Acheulean stone tools, and the controlled use of fire, which had profound implications for social and dietary behaviors.",
        codeLanguage: "text",
        code: "Lived approximately 1.9 million-110,000 years ago.",
        audio_url: "/audios/accordion/homoErectusAudio.mp3",
      },
      {
        title: "Homo neanderthalensis",
        body: "Homo neanderthalensis, commonly known as Neanderthals, lived in Europe and parts of western and central Asia from about 400,000 to 40,000 years ago. They are known for their robust body structure, adapted to cold climates, and their relatively large brain size. Neanderthals exhibited advanced cultural behaviors, including the creation of complex tools, use of fire, and evidence of symbolic thought such as burial practices and cave art. Genetic studies have shown that Neanderthals interbred with early Homo sapiens, contributing to the genetic makeup of modern humans outside of Africa.",
        codeLanguage: "text",
        code: "Lived approximately 400,000-40,000 years ago.",
        audio_url: "/audios/accordion/culturalAudio.mp3",
      },
      {
        title: "Homo sapiens",
        body: "Homo sapiens, or modern humans, emerged approximately 300,000 years ago in Africa. They are characterized by a highly developed brain, capable of abstract reasoning, language, introspection, and problem-solving. Homo sapiens are notable for their advanced cultural and technological developments, including the creation of art, complex social structures, and the development of agriculture. The migration of Homo sapiens out of Africa and their subsequent spread across the globe led to the establishment of diverse cultures and civilizations. Their ability to adapt to a wide range of environments has been a key factor in their evolutionary success.",
        codeLanguage: "text",
        code: "Emerged approximately 300,000 years ago.",
        audio_url: "/audios/accordion/evolutionAudio.mp3",
      }
    ]
  },
  {
    module_id: 2,
    title: "Brain Evolution and Cognitive Growth - Audio",
    description: "Learn about brain size increase and cognitive advances in hominids.",
    content_type: "audio",
    audio: {
      url: "/audio/humanEvolutionAudio02.mp3",
      duration_minutes: 6,
    },
  },
  {
    module_id: 2,
    title: "Hominid Traits Comparison - PDF",
    description: "A comprehensive PDF comparing traits among hominid species.",
    content_type: "general",
    general: {
      title: "Hominid Traits Chart",
      description: humanEvolutionIntroHTML,
      url: "/material/pdf/hominidTraitsComparison.pdf",
      audio_url: "/audios/general/humanEvolutionAudio01.mp3",
      material_type: "pdf",
    },
  },
  {
    module_id: 2,
    title: "Social Behavior in Hominids - Video",
    description: "Examine the social structures and behaviors of early hominids.",
    content_type: "video",
    video: {
      url: "/video/humanEvolutionVideo01.mp4",
      duration_minutes: 9,
      transcript: "This video discusses the social dynamics and group behaviors of early hominids...",
      audio_url: "/audios/video/humanEvolutionAudio01.mp3",
      bullet_points: [
        { time: 0, text: "Group Living and Cooperation" },
        { time: 180, text: "Communication Methods" },
      ],
    },
  },
  {
    module_id: 2,
    title: "Environmental Adaptations - Video",
    description: "Learn how hominids adapted to different environmental challenges.",
    content_type: "video",
    video: {
      url: "/video/humanEvolutionVideo02.mp4",
      duration_minutes: 10,
      transcript: "This video covers the various environmental adaptations of hominids...",
      audio_url: "/audios/video/humanEvolutionAudio01.mp3",
      bullet_points: [
        { time: 0, text: "Climate Change Adaptations" },
        { time: 240, text: "Habitat Preferences" },
      ],
    },
  },
  {
    module_id: 2,
    title: "Cultural Developments - Accordion",
    description: "Explore the cultural advancements of hominids.",
    content_type: "accordian",
    accordions: [
      {
        title: "Art and Symbolism",
        body: "Early forms of art and symbolic expression among hominids represent some of the most profound evidence of cognitive and cultural development. These artistic endeavors, including cave paintings and decorative artifacts, suggest a sophisticated understanding of their environment and a capacity for abstract thought. The intricate designs and symbols found in ancient artworks, such as those in the caves of Lascaux, France, and other sites, indicate a rich cultural life and the ability to convey complex ideas and emotions through visual means.",
        codeLanguage: "text",
        code: "Cave paintings and decorative artifacts.",
        audio_url: "/audios/accordion/australopithecusAudio.mp3",
      },
      {
        title: "Burial Practices",
        body: "The emergence of burial rituals and the inclusion of grave goods in hominid cultures provide significant insights into their belief systems and concepts of an afterlife. These practices, which involve the deliberate burial of the dead along with personal items, tools, and ornaments, suggest a spiritual dimension to early human life. Such rituals indicate a concern for the deceased and possibly a belief in some form of existence beyond death, reflecting complex social and spiritual structures.",
        codeLanguage: "text",
        code: "Indicates belief systems and afterlife concepts.",
        audio_url: "/audios/accordion/culturalAudio.mp3",
      },
      {
        title: "Tool Making and Technology",
        body: "The development of tool making and technology among hominids marks a pivotal advancement in human evolution. Early tools, crafted from stone, bone, and wood, reflect the growing cognitive abilities and manual dexterity of hominids. The progression from simple flakes and choppers to more refined and specialized tools illustrates an increasing complexity in hominid behavior and adaptation. These technological innovations facilitated more efficient hunting, gathering, and processing of resources, significantly impacting survival and lifestyle.",
        codeLanguage: "text",
        code: "Includes stone tools, bone tools, and wooden implements.",
        audio_url: "/audios/accordion/homoErectusAudio.mp3",
      },
      {
        title: "Social Structures and Organization",
        body: "The evolution of social structures and organization among hominids played a crucial role in their survival and development. Early human groups formed complex social networks that included family units, kinship ties, and communal living arrangements. These structures enabled cooperation, resource sharing, and collective decision-making, which were essential for facing environmental challenges and ensuring group cohesion. Evidence from archaeological sites suggests that these social organizations were fundamental to the success and expansion of early human populations.",
        codeLanguage: "text",
        code: "Involves family units, kinship networks, and communal living.",
        audio_url: "/audios/accordion/homoHabilisAudio.mp3",
      },
      {
        title: "Language and Communication",
        body: "The development of language and communication was a transformative milestone in hominid evolution, enabling complex social interactions and the transmission of knowledge across generations. The emergence of language facilitated the sharing of ideas, experiences, and cultural practices, which were crucial for the development of social norms and technological innovations. This advancement in communication allowed early humans to coordinate activities, establish cultural identities, and adapt to diverse environments more effectively.",
        codeLanguage: "text",
        code: "Facilitates social interactions and knowledge transmission.",
        audio_url: "/audios/accordion/evolutionAudio.mp3",
      }
    ]
  },
  {
    module_id: 2,
    title: "Hominid Evolution Deep Dive - Multi-Slide Content",
    description: "Mixed media content to better understand hominid evolution.",
    content_type: "slide",
    slides: [
      {
        title: "Hominid Timeline",
        description: "Visualize the timeline of key hominid species.",
        content_type: "video",
        video: {
          url: "/multiSlide/video/humanEvolutionVideo01.mp4",
          duration_minutes: 4,
          audio_url: "/audios/slide_video/humanEvolutionAudio01.mp3",
        },
      },
      // {
      //   title: "Tool Use and Brain Growth",
      //   description: "Audio explaining the relationship between tools and cognitive evolution.",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/humanEvolutionAudio01.mp3",
      //     duration_minutes: 3,
      //   },
      // },
      {
        title: "Neanderthals vs. Homo sapiens",
        description: "Comparison of physical and cultural traits.",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/slideAudioUrl[4].mp3",
        accordions: [
          {
            title: "Physical Traits",
            body: "Neanderthals were characterized by their robust and muscular bodies, which were well-suited to the cold climates of Ice Age Europe. In contrast, Homo sapiens exhibited a more gracile, or slender, body structure. Despite these differences in physique, both species had similar brain sizes, though their skull shapes differed significantly. Neanderthals had a more elongated skull with a prominent brow ridge, while Homo sapiens had a more rounded skull, reflecting differences in brain structure and possibly cognitive abilities.",
            codeLanguage: "text",
            code: "Similar brain sizes but different skull shapes.",
            audio_url: "/audios/slide_accordion/physicalTraitsAudio.mp3",
          },
          {
            title: "Cultural Innovations",
            body: "Homo sapiens demonstrated advanced symbolic behavior and technological innovation, which are evident in various archaeological findings. These include intricate cave art, sophisticated tools made from bone and stone, and elaborate burial customs that suggest complex social structures and belief systems. Such cultural innovations highlight the cognitive and social advancements of Homo sapiens, setting them apart from other hominid species and contributing to their evolutionary success.",
            codeLanguage: "text",
            code: "Evidence includes art, complex tools, and burial customs.",
            audio_url: "/audios/slide_accordion/culturalInnovationsAudio.mp3",
          },
          {
            title: "Social Structures",
            body: "The social structures of Homo sapiens were highly complex and varied, encompassing family units, kinship networks, and larger communal organizations. These structures facilitated cooperation, resource sharing, and collective decision-making, which were essential for survival and adaptation. The development of social hierarchies and roles within communities allowed Homo sapiens to establish stable and resilient societies, capable of thriving in diverse environments.",
            codeLanguage: "text",
            code: "Includes family units, kinship networks, and communal organizations.",
            audio_url: "/audios/slide_accordion/socialStructuresAudio.mp3",
          },
          {
            title: "Language and Communication",
            body: "The evolution of language and communication in Homo sapiens marked a significant leap in cognitive and cultural development. Language enabled the transmission of knowledge, the establishment of social norms, and the coordination of complex activities. This advancement in communication facilitated the development of cultural identities, technological innovations, and the ability to adapt to various environmental challenges, contributing to the evolutionary success of Homo sapiens.",
            codeLanguage: "text",
            code: "Facilitates knowledge transmission and social coordination.",
            audio_url: "/audios/slide_accordion/languageCommunicationAudio.mp3",
          },
          {
            title: "Technological Advancements",
            body: "Homo sapiens exhibited remarkable technological advancements, including the development of sophisticated tools, the controlled use of fire, and the creation of durable shelters. These innovations reflect their ability to manipulate and adapt to their environment, enhancing their survival and quality of life. The progression from simple stone tools to more complex and specialized implements illustrates the cognitive and cultural evolution of Homo sapiens.",
            codeLanguage: "text",
            code: "Includes sophisticated tools, fire use, and shelter construction.",
            audio_url: "/audios/slide_accordion/technologicalAdvancementsAudio.mp3",
          }
        ]
      },
      // {
      //   title: "Brain and Behavioral Evolution - PDF",
      //   description: "In-depth PDF on cognitive and behavioral advances.",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/slideAudioUrl[4].mp3",
      //   general: {
      //     title: "Cognitive Evolution Overview",
      //     description: humanToolsHTML,
      //     url: "/multiSlide/general/pdf/cognitiveEvolution.pdf",
      //     material_type: "pdf",
      //     audio_url: "/audios/slide_general/cognitiveEvolutionAudio.mp3",
      //   },
      // },
      {
        title: "Migration and Adaptation",
        description: "Video on how hominids adapted to new environments during migrations.",
        content_type: "video",
        video: {
          url: "/multiSlide/video/humanEvolutionVideo02.mp4",
          duration_minutes: 5,
          audio_url: "/audios/slide_video/humanEvolutionAudio01.mp3",
        },
      },
      // {
      //   title: "Language Development",
      //   description: "Audio on the evolution of language in hominids.",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/humanEvolutionAudio02.mp3",
      //     duration_minutes: 4,
      //   },
      // },
      {
        title: "Social Structures",
        description: "Accordion on the social structures and community life of hominids.",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/slideAudioUrl[12].mp3",
        accordions: [
          {
            title: "Family Units",
            body: "Early hominids lived in small family groups, which were fundamental for protection, cooperation, and the successful rearing of offspring. These family units provided a stable environment for nurturing the young and ensured the transmission of essential survival skills and cultural knowledge across generations. The close-knit nature of these groups facilitated mutual support and resource sharing, which were crucial for facing the challenges of their environment and ensuring the survival and continuity of the community.",
            codeLanguage: "text",
            code: "Family units were essential for survival and child-rearing.",
            audio_url: "/audios/slide_accordion/familyUnitsAudio.mp3",
          },
          {
            title: "Community Roles",
            body: "Within early hominid communities, different roles were established to optimize the group's efficiency and survival. These roles included hunters, who were responsible for procuring meat; gatherers, who collected plant resources; and caregivers, who nurtured the young and maintained the home base. This division of labor allowed for a more efficient allocation of tasks based on individual strengths and skills, contributing significantly to the overall success and resilience of hominid groups by ensuring that all necessary activities were effectively managed.",
            codeLanguage: "text",
            code: "Division of labor contributed to the success of hominid groups.",
            audio_url: "/audios/slide_accordion/communityRolesAudio.mp3",
          },
          {
            title: "Social Hierarchies",
            body: "Social hierarchies emerged within early hominid communities as a means of organizing group dynamics and decision-making processes. These hierarchies were often based on factors such as age, experience, physical strength, or social connections, and they helped to establish order and structure within the group. Leaders or elders typically held significant influence, guiding the community in matters of conflict resolution, resource distribution, and cultural practices, thereby maintaining group cohesion and stability.",
            codeLanguage: "text",
            code: "Hierarchies were based on age, experience, or social connections.",
            audio_url: "/audios/slide_accordion/socialHierarchiesAudio.mp3",
          },
          {
            title: "Cultural Transmission",
            body: "Cultural transmission was a vital process in early hominid societies, enabling the preservation and evolution of cultural knowledge and practices. Through oral traditions, storytelling, and communal rituals, essential skills and information were passed down from one generation to the next. This transmission of cultural information allowed for the accumulation of knowledge, the refinement of survival strategies, and the development of complex social norms and technological innovations, which were crucial for the adaptation and success of hominid groups.",
            codeLanguage: "text",
            code: "Knowledge was passed down through oral traditions and rituals.",
            audio_url: "/audios/slide_accordion/culturalTransmissionAudio.mp3",
          },
          {
            title: "Conflict Resolution",
            body: "Conflict resolution mechanisms were essential for maintaining harmony and cooperation within early hominid groups. Disputes over resources, social status, or interpersonal issues were typically mediated through established social norms, the intervention of respected elders, or communal discussions. Effective conflict resolution strategies ensured that group stability and cooperation were maintained, which were critical for the collective survival and success of the community in facing environmental and social challenges.",
            codeLanguage: "text",
            code: "Conflicts were resolved through social norms and elder intervention.",
            audio_url: "/audios/slide_accordion/conflictResolutionAudio.mp3",
          }
        ]
      },
      // {
      //   title: "Art and Symbolism",
      //   description: "PDF on the emergence of art and symbolic thought in hominids.",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/slideAudioUrl[11].mp3",
      //   general: {
      //     title: "Artistic Expression in Hominids",
      //     description: humanMigrationHTML,
      //     url: "/multiSlide/general/pdf/cognitiveEvolution.pdf",
      //     material_type: "pdf",
      //     audio_url: "/audios/slide_general/artSymbolismAudio.mp3",
      //   },
      // },
      {
        title: "Genetic Insights",
        description: "Video on genetic studies and their insights into hominid evolution.",
        content_type: "video",
        video: {
          url: "/multiSlide/video/humanEvolutionVideo02.mp4",
          duration_minutes: 6,
          audio_url: "/audios/slide_video/geneticInsightsAudio.mp3",
        },
      },
      // {
      //   title: "Future Directions in Hominid Research",
      //   description: "Audio on current trends and future directions in hominid research.",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/humanEvolutionAudio02.mp3",
      //     duration_minutes: 5,
      //   },
      // },
    ]
  },
];

const geneticsTopics = [
  {
    module_id: 3,
    title: "Introduction to Genetic Evolution - Video",
    description: "Overview of genetic evolution through video",
    content_type: "video",
    video: {
      url: "/video/humanEvolutionVideo01.mp4",
      duration_minutes: 12,
      transcript: "Welcome to the world of genetic evolution...",
      audio_url: "/audios/video/geneticEvolutionAudio.mp3",
      bullet_points: [
        { time: 0, text: "Genetic Basics" },
        { time: 60, text: "Mutation and Variation" }
      ],
    },
  },
  {
    module_id: 3,
    title: "Genetic Mutations - Audio",
    description: "Listen to an audio overview of genetic mutations",
    content_type: "audio",
    audio: {
      url: "/audio/humanEvolutionAudio02.mp3",
      duration_minutes: 7,
    },
  },
  {
    module_id: 3,
    title: "Key Genetic Concepts - Accordion",
    description: "Explore main ideas in genetic evolution",
    content_type: "accordian",
    accordions: [
      {
        title: "DNA and Genes",
        body: "DNA, or deoxyribonucleic acid, is the molecule that carries the genetic instructions used in the growth, development, functioning, and reproduction of all known living organisms. Genes are specific segments of DNA that contain the information necessary to produce proteins, which are essential for the structure, function, and regulation of the body's tissues and organs. These genes are the fundamental units of heredity, passing traits from parents to offspring and playing a crucial role in the biological processes that sustain life.",
        codeLanguage: "text",
        code: "Genes are segments of DNA that code for proteins.",
        audio_url: "/audios/accordion/geneticAudio.mp3",
      },
      {
        title: "Genetic Variation",
        body: "Genetic variation refers to the diversity in the genetic makeup of individuals within a population, which arises from differences in DNA sequences. This variation is crucial for evolution as it provides the raw material for natural selection to act upon. Genetic diversity enables populations to adapt to changing environments, resist diseases, and survive various challenges. It is influenced by factors such as mutation, gene flow, and genetic recombination, which contribute to the differences observed among individuals.",
        codeLanguage: "text",
        code: "Essential for adaptation and survival in changing environments.",
        audio_url: "/audios/accordion/culturalAudio.mp3",
      },
      {
        title: "Mutation",
        body: "Mutation is a change in the DNA sequence that can result in new genetic variations. These changes can be caused by errors during DNA replication, exposure to mutagens, or viral insertions. Mutations can have various effects; they can be beneficial, leading to advantageous traits, neutral with no significant impact, or harmful, potentially causing genetic disorders. Mutations are a primary source of genetic diversity and are essential for the evolutionary process, driving the adaptation and evolution of species.",
        codeLanguage: "text",
        code: "Can be beneficial, neutral, or harmful to an organism.",
        audio_url: "/audios/accordion/evolutionAudio.mp3",
      },
      {
        title: "Gene Expression",
        body: "Gene expression is the process by which the information encoded in a gene is used to synthesize a functional gene product, such as a protein or RNA molecule. This process involves the transcription of DNA into RNA and the translation of RNA into proteins, which perform various functions within the cell. Gene expression is tightly regulated to ensure that the right genes are expressed at the right times and in the correct amounts, which is crucial for the development, functioning, and maintenance of an organism.",
        codeLanguage: "text",
        code: "Involves transcription of DNA into RNA and translation into proteins.",
        audio_url: "/audios/accordion/homoErectusAudio.mp3",
      },
      {
        title: "Epigenetics",
        body: "Epigenetics refers to the study of heritable changes in gene expression that do not involve alterations to the underlying DNA sequence. These changes can be influenced by various factors, including environmental exposures, lifestyle, and disease states. Epigenetic mechanisms, such as DNA methylation and histone modification, regulate gene activity and play a crucial role in development, aging, and the response to environmental stimuli. Understanding epigenetics provides insights into how genes are regulated and how they contribute to the complexity and adaptability of living organisms.",
        codeLanguage: "text",
        code: "Involves heritable changes in gene expression without DNA alterations.",
        audio_url: "/audios/accordion/homoHabilisAudio.mp3",
      }
    ]
  },
  {
    module_id: 3,
    title: "Genetic Evolution Summary PDF",
    description: "A concise summary of the key points in PDF format",
    content_type: "general",
    general: {
      title: "Genetic Evolution Summary",
      description: humanMigrationHTML,
      url: "/material/pdf/human-evolution-summary.pdf",
      audio_url: "/audios/general/humanEvolutionAudio02.mp3",
      material_type: "pdf",
    },
  },
  {
    module_id: 3,
    title: "Natural Selection and Genetics - Video",
    description: "Understand how natural selection influences genetic evolution",
    content_type: "video",
    video: {
      url: "/video/humanEvolutionVideo02.mp4",
      duration_minutes: 10,
      transcript: "This video explores the role of natural selection in shaping genetic traits...",
      audio_url: "/audios/video/naturalSelectionAudio.mp3",
      bullet_points: [
        { time: 0, text: "Introduction to Natural Selection" },
        { time: 120, text: "Genetic Adaptations" }
      ],
    },
  },
  {
    module_id: 3,
    title: "Epigenetics and Gene Expression - Video",
    description: "Explore how epigenetics influences gene expression and evolution",
    content_type: "video",
    video: {
      url: "/video/humanEvolutionVideo01.mp4",
      duration_minutes: 11,
      transcript: "This video covers the role of epigenetics in gene expression and evolution...",
      audio_url: "/audios/video/epigeneticsAudio.mp3",
      bullet_points: [
        { time: 0, text: "Introduction to Epigenetics" },
        { time: 180, text: "Epigenetic Mechanisms" }
      ],
    },
  },
  {
    module_id: 3,
    title: "Population Genetics - Audio",
    description: "Understand the principles of population genetics",
    content_type: "audio",
    audio: {
      url: "/audio/humanEvolutionAudio02.mp3",
      duration_minutes: 8,
    },
  },
  {
    module_id: 3,
    title: "Genetic Evolution Slides",
    description: "Multi-format slide content covering genetic topics",
    content_type: "slide",
    slides: [
      {
        title: "Genetic Timeline - Video",
        description: "Watch the major milestones in genetic evolution",
        content_type: "video",
        video: {
          url: "/multiSlide/video/geneticTimeline.mp4",
          duration_minutes: 6,
          audio_url: "/audios/slide_video/evolutionAudio.mp3",
        },
      },
      // {
      //   title: "Genetic Mutations - Audio",
      //   description: "Audio summary of key genetic mutations",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/geneticMutationsAudio.mp3",
      //     duration_minutes: 5,
      //   },
      // },
      {
        title: "Genetic Concepts - Accordion",
        description: "Break down genetic theories and examples",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/slideAudioUrl[8].mp3",
        accordions: [
          {
            title: "Gene Expression",
            body: "Gene expression is the process by which information from a gene is used to create a functional product, such as a protein or RNA molecule. This process involves two main steps: transcription and translation. Transcription is the process where the DNA sequence of a gene is copied into RNA, while translation is the process where the RNA sequence is used to produce a protein.",
            codeLanguage: "text",
            code: "Gene expression can be regulated by various factors including environmental signals, developmental cues, and cellular conditions. This regulation ensures that the right genes are expressed at the right time and in the right amount.",
            audio_url: "/audios/slide_accordion/geneExpression.mp3",
          },
          {
            title: "Genetic Variation",
            body: "Genetic variation refers to the diversity in gene frequencies within a population. This variation can arise from mutations, genetic recombination, and gene flow. Mutations are changes in the DNA sequence that can create new alleles, while genetic recombination during meiosis can shuffle existing alleles to create new combinations. Gene flow occurs when individuals migrate between populations, introducing new alleles.",
            codeLanguage: "text",
            code: "Genetic variation is crucial for evolution as it provides the raw material for natural selection. Without genetic variation, populations would not be able to adapt to changing environments, and evolution would not occur.",
            audio_url: "/audios/slide_accordion/geneticVariation.mp3",
          },
          {
            title: "Epigenetics",
            body: "Epigenetics is the study of heritable changes in gene expression that do not involve changes to the underlying DNA sequence. These changes can be influenced by environmental factors, lifestyle, and disease states. Common epigenetic mechanisms include DNA methylation and histone modification.",
            codeLanguage: "text",
            code: "Epigenetic changes can have significant impacts on health and disease. For example, abnormal DNA methylation patterns are associated with various cancers. Understanding epigenetics can provide insights into how genes are regulated and how environmental factors can influence gene expression.",
            audio_url: "/audios/slide_accordion/epigenetics.mp3",
          },
          {
            title: "Genome Editing",
            body: "Genome editing is a group of technologies that give scientists the ability to change an organism's DNA. These technologies allow genetic material to be added, removed, or altered at particular locations in the genome. CRISPR-Cas9 is one of the most widely used genome editing tools.",
            codeLanguage: "text",
            code: "Genome editing has potential applications in medicine, agriculture, and biotechnology. For example, it can be used to correct genetic defects, improve crop resistance to pests, and develop new therapies for genetic disorders.",
            audio_url: "/audios/slide_accordion/genomeEditing.mp3",
          }
        ]
      },
      // {
      //   title: "Genetic Reference PDF",
      //   description: "Handy one-page cheat sheet",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/slideAudioUrl[7].mp3",
      //   general: {
      //     title: "Quick Genetic Reference",
      //     description: earlyHominidsHTML,
      //     url: "/multiSlide/general/pdf/geneticCheatSheet.pdf",
      //     audio_url: "/audios/slide_general/geneticCheatSheetAudio.mp3",
      //     material_type: "pdf",
      //   },
      // },
      {
        title: "Epigenetics Explained - Video",
        description: "Understand the role of epigenetics in genetic evolution",
        content_type: "video",
        video: {
          url: "/multiSlide/video/humanEvolutionVideo01.mp4",
          duration_minutes: 7,
          audio_url: "/audios/slide_video/epigeneticsAudio.mp3",
        },
      },
      // {
      //   title: "Population Genetics - Audio",
      //   description: "Audio overview of population genetics principles",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/humanEvolutionAudio01.mp3",
      //     duration_minutes: 6,
      //   },
      // },
      {
        title: "Genetic Disorders - Accordion",
        description: "Explore common genetic disorders and their causes",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/slideAudioUrl[12].mp3",
        accordions: [
          {
            title: "Cystic Fibrosis",
            body: "Cystic Fibrosis is a genetic disorder caused by mutations in the CFTR gene, which encodes a protein that regulates the movement of salt and water in and out of cells. This disorder primarily affects the lungs and digestive system, leading to the production of thick, sticky mucus that can clog the airways and ducts in the pancreas.",
            codeLanguage: "text",
            code: "Symptoms of Cystic Fibrosis include persistent coughing, frequent lung infections, poor growth, and digestive problems. Treatment typically involves a combination of medications, physical therapy, and nutritional support to manage symptoms and improve quality of life.",
            audio_url: "/audios/slide_accordion/cysticFibrosisAudio.mp3",
          },
          {
            title: "Sickle Cell Anemia",
            body: "Sickle Cell Anemia is a genetic blood disorder caused by a mutation in the HBB gene, which encodes the beta-globin subunit of hemoglobin. This mutation results in the production of abnormal hemoglobin molecules that can distort red blood cells into a sickle shape, leading to various complications.",
            codeLanguage: "text",
            code: "Symptoms of Sickle Cell Anemia include chronic pain, fatigue, frequent infections, and delayed growth. Treatment options include medications to manage pain and prevent complications, blood transfusions, and bone marrow transplants in severe cases.",
            audio_url: "/audios/slide_accordion/sickleCellAudio.mp3",
          },
          {
            title: "Huntington's Disease",
            body: "Huntington's Disease is a genetic disorder caused by a mutation in the HTT gene, which encodes the huntingtin protein. This mutation results in the production of an abnormal huntingtin protein that can accumulate in the brain, leading to the progressive degeneration of nerve cells.",
            codeLanguage: "text",
            code: "Symptoms of Huntington's Disease include uncontrolled movements, cognitive decline, and psychiatric problems. There is currently no cure for Huntington's Disease, and treatment focuses on managing symptoms and improving quality of life.",
            audio_url: "/audios/slide_accordion/huntingtonsDiseaseAudio.mp3",
          },
          {
            title: "Duchenne Muscular Dystrophy",
            body: "Duchenne Muscular Dystrophy is a genetic disorder caused by mutations in the DMD gene, which encodes the dystrophin protein. This protein is essential for the structural integrity of muscle fibers, and its absence leads to progressive muscle weakness and degeneration.",
            codeLanguage: "text",
            code: "Symptoms of Duchenne Muscular Dystrophy typically appear in early childhood and include delayed motor milestones, difficulty walking, and muscle wasting. Treatment options include physical therapy, medications to manage symptoms, and experimental therapies aimed at restoring dystrophin production.",
            audio_url: "/audios/slide_accordion/duchenneMuscularDystrophyAudio.mp3",
          }
        ]
      },
      // {
      //   title: "Genetic Engineering - PDF",
      //   description: "In-depth PDF on genetic engineering techniques and applications",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/slideAudioUrl[11].mp3",
      //   general: {
      //     title: "Genetic Engineering Overview",
      //     description: humanEvolutionIntroHTML,
      //     url: "/multiSlide/general/pdf/culturalCheatSheet.pdf",
      //     audio_url: "/audios/slide_general/humanEvolutionAudio01.mp3",
      //     material_type: "pdf",
      //   },
      // },
      {
        title: "CRISPR Technology - Video",
        description: "Learn about CRISPR and its impact on genetic research",
        content_type: "video",
        video: {
          url: "/multiSlide/video/humanEvolutionVideo02.mp4",
          duration_minutes: 8,
          audio_url: "/audios/slide_video/crisprAudio.mp3",
        },
      },
      // {
      //   title: "Future of Genetic Research - Audio",
      //   description: "Audio on the future directions of genetic research",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/humanEvolutionAudio02.mp3",
      //     duration_minutes: 7,
      //   },
      // },
    ]
  },
];

const environmentalTopics = [
  {
    module_id: 4,
    title: "Introduction to Environmental Evolution - Video",
    description: "Overview of environmental influences on evolution through video",
    content_type: "video",
    video: {
      url: "/video/environmentalEvolutionIntro.mp4",
      duration_minutes: 10,
      transcript: "Welcome to the study of environmental influences on evolution...",
      audio_url: "/audios/video/environmentalEvolutionAudio.mp3",
      bullet_points: [
        { time: 0, text: "Environmental Basics" },
        { time: 60, text: "Adaptation and Survival" }
      ],
    },
  },
  {
    module_id: 4,
    title: "Environmental Adaptations - Audio",
    description: "Listen to an audio overview of environmental adaptations",
    content_type: "audio",
    audio: {
      url: "/audio/environmentalAdaptations.mp3",
      duration_minutes: 6,
    },
  },
  {
    module_id: 4,
    title: "Key Environmental Concepts - Accordion",
    description: "Explore main ideas in environmental evolution",
    content_type: "accordian",
    accordions: [
      {
        title: "Natural Selection in Environments",
        body: "Natural selection is the process by which species adapt to their environments over time. This adaptation occurs through the differential survival and reproduction of individuals with favorable traits. These traits can be physical, such as camouflage or body size, or behavioral, such as mating rituals or foraging strategies.",
        codeLanguage: "text",
        code: "Adaptations can be physical or behavioral. For example, the peppered moth's coloration changes in response to industrial pollution, demonstrating how natural selection can drive rapid evolutionary change.",
        audio_url: "/audios/accordion/australopithecusAudio.mp3",
      },
      {
        title: "Camouflage and Mimicry",
        body: "Camouflage and mimicry are common adaptations that help species avoid predators or capture prey. Camouflage involves blending into the environment, while mimicry involves resembling another organism or object. These adaptations can be crucial for survival and reproduction.",
        codeLanguage: "text",
        code: "For example, stick insects use camouflage to blend into their surroundings, while some non-venomous snakes mimic the appearance of venomous species to deter predators.",
        audio_url: "/audios/accordion/culturalAudio.mp3",
      },
      {
        title: "Behavioral Adaptations",
        body: "Behavioral adaptations are actions or behaviors that increase an organism's chances of survival and reproduction. These can include migration, hibernation, and complex social behaviors. Behavioral adaptations are often influenced by environmental factors and can be learned or innate.",
        codeLanguage: "text",
        code: "For example, birds migrate to avoid harsh winter conditions, while some mammals hibernate to conserve energy during periods of food scarcity.",
        audio_url: "/audios/accordion/evolutionAudio.mp3",
      },
      {
        title: "Physiological Adaptations",
        body: "Physiological adaptations are internal processes that help organisms survive in their environments. These can include changes in metabolism, temperature regulation, and immune responses. Physiological adaptations are often influenced by genetic factors and can be crucial for survival in extreme environments.",
        codeLanguage: "text",
        code: "For example, some desert animals have evolved to conserve water through specialized kidneys, while deep-sea creatures have adapted to high-pressure environments.",
        audio_url: "/audios/accordion/geneticAudio.mp3",
      },
      {
        title: "Coevolution",
        body: "Coevolution is the process by which two or more species influence each other's evolutionary paths. This can occur through mutualistic relationships, such as pollination, or through antagonistic relationships, such as predator-prey interactions. Coevolution can lead to complex adaptations and specialized traits.",
        codeLanguage: "text",
        code: "For example, flowers and their pollinators often coevolve, with flowers developing specific shapes and colors to attract pollinators, and pollinators evolving specialized mouthparts to access nectar.",
        audio_url: "/audios/accordion/homoErectusAudio.mp3",
      }
    ]
  },
  {
    module_id: 4,
    title: "Environmental Evolution Summary PDF",
    description: "A concise summary of the key points in PDF format",
    content_type: "general",
    general: {
      title: "Environmental Evolution Summary",
      description: humanToolsHTML,
      url: "/material/pdf/environmental-evolution-summary.pdf",
      audio_url: "/audios/general/environmentalAudio.mp3",
      material_type: "pdf",
    },
  },
  {
    module_id: 4,
    title: "Climate Change and Evolution - Video",
    description: "Understand the impact of climate change on evolutionary processes",
    content_type: "video",
    video: {
      url: "/video/humanEvolutionVideo01.mp4",
      duration_minutes: 12,
      transcript: "This video explores how climate change influences species evolution...",
      audio_url: "/audios/video/climateChangeAudio.mp3",
      bullet_points: [
        { time: 0, text: "Introduction to Climate Change" },
        { time: 120, text: "Adaptation to Changing Climates" }
      ],
    },
  },
  {
    module_id: 4,
    title: "Biodiversity and Ecosystems - Audio",
    description: "Listen to an audio overview of biodiversity and its role in ecosystems",
    content_type: "audio",
    audio: {
      url: "/audio/humanEvolutionAudio01.mp3",
      duration_minutes: 7,
    },
  },
  {
    module_id: 4,
    title: "Human Impact on Environments - Accordion",
    description: "Explore the impact of human activities on environmental evolution",
    content_type: "accordian",
    accordions: [
      {
        title: "Deforestation",
        body: "Deforestation is the large-scale removal of forests, often for agricultural expansion, urban development, or logging. This process can have significant impacts on biodiversity and ecosystem stability, as it leads to the loss of habitats and disrupts ecological processes.",
        codeLanguage: "text",
        code: "Loss of habitats leads to species extinction and can alter local and global climate patterns. Deforestation also contributes to carbon dioxide emissions, exacerbating climate change.",
        audio_url: "/audios/accordion/homoHabilisAudio.mp3",
      },
      {
        title: "Pollution",
        body: "Pollution is the introduction of harmful substances or products into the environment. This can include chemical pollutants, such as pesticides and industrial waste, as well as physical pollutants, such as plastic waste. Pollution can have detrimental effects on species survival and ecosystem health.",
        codeLanguage: "text",
        code: "Chemical pollutants can cause genetic mutations, disrupt reproductive processes, and lead to the decline of sensitive species. Physical pollutants, such as plastic waste, can entangle or be ingested by wildlife, leading to injury or death.",
        audio_url: "/audios/accordion/australopithecusAudio.mp3",
      },
      {
        title: "Climate Change",
        body: "Climate change refers to long-term shifts in temperature and weather patterns, primarily caused by human activities such as the burning of fossil fuels and deforestation. These changes can have profound impacts on ecosystems and species survival.",
        codeLanguage: "text",
        code: "Rising temperatures, changing precipitation patterns, and increased frequency of extreme weather events can alter habitats and disrupt ecological processes. Species may need to adapt, migrate, or face extinction as a result of these changes.",
        audio_url: "/audios/accordion/culturalAudio.mp3",
      },
      {
        title: "Invasive Species",
        body: "Invasive species are non-native organisms that are introduced to new environments, often through human activities. These species can outcompete native species for resources, disrupt ecological processes, and alter habitats, leading to declines in biodiversity.",
        codeLanguage: "text",
        code: "Invasive species can have significant economic and ecological impacts, including the loss of agricultural productivity, the decline of native species, and the alteration of ecosystem services.",
        audio_url: "/audios/accordion/evolutionAudio.mp3",
      },
      {
        title: "Habitat Fragmentation",
        body: "Habitat fragmentation is the process by which large, continuous habitats are divided into smaller, isolated patches. This can occur due to human activities such as urban development, agriculture, and infrastructure projects. Habitat fragmentation can have significant impacts on biodiversity and ecosystem health.",
        codeLanguage: "text",
        code: "Fragmented habitats can lead to the isolation of populations, reducing genetic diversity and increasing the risk of extinction. Fragmentation can also disrupt ecological processes, such as pollination and seed dispersal, and alter species interactions.",
        audio_url: "/audios/accordion/geneticAudio.mp3",
      }
    ]
  },
  {
    module_id: 4,
    title: "Conservation Efforts - PDF",
    description: "A detailed PDF on conservation efforts and their importance",
    content_type: "general",
    general: {
      title: "Conservation Strategies",
      description: humanMigrationHTML,
      url: "/material/pdf/environmental-evolution-summary.pdf",
      audio_url: "/audios/general/humanEvolutionAudio01.mp3",
      material_type: "pdf",
    },
  },
  {
    module_id: 4,
    title: "Adaptation to Urban Environments - Video",
    description: "Learn how species adapt to urban environments",
    content_type: "video",
    video: {
      url: "/video/humanEvolutionVideo02.mp4",
      duration_minutes: 11,
      transcript: "This video discusses the adaptations of species to urban environments...",
      audio_url: "/audios/video/urbanAdaptationAudio.mp3",
      bullet_points: [
        { time: 0, text: "Introduction to Urban Environments" },
        { time: 180, text: "Examples of Urban Adaptations" }
      ],
    },
  },
  {
    module_id: 4,
    title: "Environmental Evolution Slides",
    description: "Multi-format slide content covering environmental topics",
    content_type: "slide",
    slides: [
      {
        title: "Environmental Timeline - Video",
        description: "Watch the major milestones in environmental evolution",
        content_type: "video",
        video: {
          url: "/multiSlide/video/environmentalTimeline.mp4",
          duration_minutes: 5,
          audio_url: "/audios/slide_video/environmentalAudio.mp3",
        },
      },
      // {
      //   title: "Environmental Adaptations - Audio",
      //   description: "Audio summary of key environmental adaptations",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/environmentalAdaptationsAudio.mp3",
      //     duration_minutes: 4,
      //   },
      // },
      {
        title: "Environmental Concepts - Accordion",
        description: "Break down environmental theories and examples",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/slideAudioUrl[9].mp3",
        accordions: [
          {
            title: "Climate Adaptations",
            body: "Species adapt to different climates in various ways to survive and reproduce in their environments. These adaptations can include physiological, behavioral, and morphological changes. For example, species in cold climates may have thick fur or blubber to insulate against the cold, while species in hot climates may have adaptations to conserve water.",
            codeLanguage: "text",
            code: "Adaptations can include fur thickness, hibernation, or changes in metabolism. For example, some mammals hibernate during the winter to conserve energy, while some desert animals are active at night to avoid the heat.",
            audio_url: "/audios/slide_accordion/climateAdaptations.mp3",
          },
          {
            title: "Resource Availability",
            body: "The availability of resources, such as food, water, and shelter, can drive evolutionary changes in species. When resources are scarce, species may evolve to exploit new resources or become more efficient in their use of existing resources. This can lead to the development of specialized traits and behaviors.",
            codeLanguage: "text",
            code: "Species may evolve to exploit new resources or become more efficient in their use of existing resources. For example, some species of birds have evolved specialized beaks to access different types of food, while some plants have evolved to grow in nutrient-poor soils.",
            audio_url: "/audios/slide_accordion/resourceAvailability.mp3",
          },
          {
            title: "Predator-Prey Interactions",
            body: "Predator-prey interactions are a major driving force in evolution. Predators exert selective pressure on prey species, leading to the development of adaptations that enhance survival, such as camouflage, mimicry, and defensive structures. Conversely, prey species can exert selective pressure on predators, leading to the development of adaptations that enhance hunting efficiency.",
            codeLanguage: "text",
            code: "Predators exert selective pressure on prey species, leading to the development of adaptations that enhance survival. For example, some prey species have evolved warning coloration to signal their toxicity, while some predators have evolved specialized hunting strategies to capture elusive prey.",
            audio_url: "/audios/slide_accordion/homoErectusAudio.mp3",
          },
          {
            title: "Competition",
            body: "Competition for resources, such as food, mates, and territory, can drive evolutionary changes in species. When resources are limited, species may evolve to become more competitive or to exploit different resources. This can lead to the development of specialized traits and behaviors, as well as the divergence of species.",
            codeLanguage: "text",
            code: "Species may evolve to become more competitive or to exploit different resources. For example, some species of birds have evolved specialized beaks to access different types of food, while some species of plants have evolved to grow in different habitats to avoid competition.",
            audio_url: "/audios/slide_accordion/homoHabilisAudio.mp3",
          },
          {
            title: "Symbiosis",
            body: "Symbiosis is a close, long-term interaction between two or more different species. These interactions can be mutualistic, where both species benefit, parasitic, where one species benefits at the expense of the other, or commensalistic, where one species benefits without affecting the other. Symbiotic relationships can drive evolutionary changes in species, leading to the development of specialized traits and behaviors.",
            codeLanguage: "text",
            code: "Symbiotic relationships can drive evolutionary changes in species. For example, some species of ants have evolved to farm fungi for food, while some species of bacteria have evolved to live in the guts of animals and aid in digestion.",
            audio_url: "/audios/slide_accordion/australopithecusAudio.mp3",
          }
        ]
      },
      // {
      //   title: "Environmental Reference PDF",
      //   description: "Handy one-page cheat sheet",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/slideAudioUrl[9].mp3",
      //   general: {
      //     title: "Quick Environmental Reference",
      //     description: earlyHominidsHTML,
      //     url: "/multiSlide/general/pdf/environmentalCheatSheet.pdf",
      //     audio_url: "/audios/slide_general/environmentalCheatSheetAudio.mp3",
      //     material_type: "pdf",
      //   },
      // },
      {
        title: "Biodiversity Hotspots - Video",
        description: "Explore the importance of biodiversity hotspots",
        content_type: "video",
        video: {
          url: "/multiSlide/video/humanEvolutionVideo01.mp4",
          duration_minutes: 6,
          audio_url: "/audios/slide_video/biodiversityAudio.mp3",
        },
      },
      // {
      //   title: "Human Impact on Ecosystems - Audio",
      //   description: "Audio on the effects of human activities on ecosystems",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/humanEvolutionAudio02.mp3",
      //     duration_minutes: 5,
      //   },
      // },
      {
        title: "Conservation Strategies - Accordion",
        description: "Learn about different strategies for conserving biodiversity",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/slideAudioUrl[11].mp3",
        accordions: [
          {
            title: "Protected Areas",
            body: "Establishing protected areas, such as national parks, wildlife reserves, and marine protected areas, is a key strategy for conserving habitats and species. These areas provide a refuge for biodiversity, allowing species to thrive and ecosystems to function naturally.",
            codeLanguage: "text",
            code: "National parks and wildlife reserves are examples of protected areas that provide a refuge for biodiversity. These areas can also provide opportunities for research, education, and recreation, while supporting local economies through ecotourism.",
            audio_url: "/audios/slide_accordion/protectedAreasAudio.mp3",
          },
          {
            title: "Sustainable Practices",
            body: "Promoting sustainable practices, such as sustainable agriculture, fishing, and forestry, is essential for reducing the environmental impact of human activities. These practices aim to meet the needs of the present without compromising the ability of future generations to meet their own needs.",
            codeLanguage: "text",
            code: "Examples include sustainable agriculture and fishing, which aim to minimize environmental impact while maintaining productivity. Other examples include sustainable forestry, which aims to maintain forest health and biodiversity, and sustainable urban planning, which aims to create livable, efficient, and resilient cities.",
            audio_url: "/audios/slide_accordion/sustainablePracticesAudio.mp3",
          },
          {
            title: "Restoration Ecology",
            body: "Restoration ecology is the scientific study and practice of renewing and restoring degraded, damaged, or destroyed ecosystems. This field aims to return ecosystems to their historic trajectory, including their biodiversity, structure, and function. Restoration efforts can include reforestation, wetland restoration, and the reintroduction of native species.",
            codeLanguage: "text",
            code: "Restoration efforts can include reforestation, wetland restoration, and the reintroduction of native species. These efforts can help to restore ecosystem services, such as water purification, carbon sequestration, and habitat provision, while supporting biodiversity and human well-being.",
            audio_url: "/audios/slide_accordion/culturalAudio.mp3",
          },
          {
            title: "Conservation Biology",
            body: "Conservation biology is the scientific study of the nature and status of Earth's biodiversity with the aim of protecting species, their habitats, and ecosystems from excessive rates of extinction. This field integrates principles from ecology, genetics, evolution, and social sciences to address the challenges of biodiversity loss.",
            codeLanguage: "text",
            code: "Conservation biology aims to protect species, their habitats, and ecosystems from excessive rates of extinction. This field involves the development and implementation of conservation strategies, such as habitat protection, species recovery plans, and the management of invasive species.",
            audio_url: "/audios/slide_accordion/evolutionAudio.mp3",
          },
          {
            title: "Environmental Education",
            body: "Environmental education is a process that aims to increase public awareness and knowledge about environmental issues, while promoting the development of skills, values, and attitudes necessary to address these issues. This field involves formal and informal education, as well as community engagement and outreach.",
            codeLanguage: "text",
            code: "Environmental education aims to increase public awareness and knowledge about environmental issues. This field involves the development and implementation of educational programs, such as school curricula, public campaigns, and community-based initiatives, to promote sustainable behaviors and practices.",
            audio_url: "/audios/slide_accordion/geneticAudio.mp3",
          }
        ]
      },
      // {
      //   title: "Climate Change Impacts - PDF",
      //   description: "In-depth PDF on the impacts of climate change on environments",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/slideAudioUrl[12].mp3",
      //   general: {
      //     title: "Climate Change Overview",
      //     description: humanToolsHTML,
      //     url: "/multiSlide/general/pdf/hominidTraitsComparison.pdf",
      //     audio_url: "/audios/slide_general/humanEvolutionAudio01.mp3",
      //     material_type: "pdf",
      //   },
      // },
      {
        title: "Urban Ecology - Video",
        description: "Understand the ecological dynamics of urban environments",
        content_type: "video",
        video: {
          url: "/multiSlide/video/humanEvolutionVideo01.mp4",
          duration_minutes: 7,
          audio_url: "/audios/slide_video/urbanEcologyAudio.mp3",
        },
      },
      // {
      //   title: "Future of Environmental Conservation - Audio",
      //   description: "Audio on the future directions of environmental conservation",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/geneticMutationsAudio.mp3",
      //     duration_minutes: 6,
      //   },
      // },
    ]
  },
];

const culturalTopics = [
  {
    module_id: 5,
    title: "Introduction to Cultural Evolution - Video",
    description: "Overview of cultural evolution through video",
    content_type: "video",
    video: {
      url: "/video/culturalEvolutionIntro.mp4",
      duration_minutes: 11,
      transcript: "Welcome to the study of cultural evolution...",
      audio_url: "/audios/video/culturalEvolutionAudio.mp3",
      bullet_points: [
        { time: 0, text: "Cultural Basics" },
        { time: 60, text: "Social Structures" }
      ],
    },
  },
  {
    module_id: 5,
    title: "Cultural Practices - Audio",
    description: "Listen to an audio overview of cultural practices",
    content_type: "audio",
    audio: {
      url: "/audio/culturalPractices.mp3",
      duration_minutes: 7,
    },
  },
  {
    module_id: 5,
    title: "Key Cultural Concepts - Accordion",
    description: "Explore main ideas in cultural evolution",
    content_type: "accordian",
    accordions: [
      {
        title: "Social Structures",
        body: "Social structures are the patterns of relationships in a society that shape the behavior and interactions of individuals and groups. These structures can include family, kinship, political systems, economic institutions, and religious organizations. Social structures provide a framework for understanding the organization and functioning of societies.",
        codeLanguage: "text",
        code: "Social structures can include family, kinship, and political systems. For example, the nuclear family is a common social structure in many societies, consisting of a married couple and their children. Kinship systems can vary widely, from patrilineal to matrilineal descent, and can influence inheritance, marriage, and social roles.",
        audio_url: "/audios/accordion/culturalAudio.mp3",
      },
      {
        title: "Economic Systems",
        body: "Economic systems are the structures and processes through which societies produce, distribute, and consume goods and services. These systems can include capitalism, socialism, and mixed economies. Economic systems are shaped by cultural values, historical contexts, and political ideologies.",
        codeLanguage: "text",
        code: "Economic systems can include capitalism, socialism, and mixed economies. For example, capitalism is characterized by private ownership of the means of production and market-based exchange, while socialism emphasizes collective ownership and state planning.",
        audio_url: "/audios/accordion/australopithecusAudio.mp3",
      },
      {
        title: "Political Systems",
        body: "Political systems are the structures and processes through which societies govern themselves and make collective decisions. These systems can include democracies, monarchies, authoritarian regimes, and hybrid systems. Political systems are shaped by cultural values, historical contexts, and power dynamics.",
        codeLanguage: "text",
        code: "Political systems can include democracies, monarchies, and authoritarian regimes. For example, democracies are characterized by free and fair elections, the rule of law, and the protection of individual rights, while authoritarian regimes concentrate power in the hands of a single leader or party.",
        audio_url: "/audios/accordion/evolutionAudio.mp3",
      },
      {
        title: "Religious Institutions",
        body: "Religious institutions are the organizations and structures through which individuals and groups practice their faith and express their spiritual beliefs. These institutions can include churches, mosques, temples, and synagogues. Religious institutions play a significant role in shaping cultural values, norms, and practices.",
        codeLanguage: "text",
        code: "Religious institutions can include churches, mosques, temples, and synagogues. For example, churches are central to Christian communities, providing a space for worship, education, and social gatherings, while mosques serve a similar function in Muslim communities.",
        audio_url: "/audios/accordion/geneticAudio.mp3",
      },
      {
        title: "Educational Systems",
        body: "Educational systems are the structures and processes through which societies transmit knowledge, skills, and values to future generations. These systems can include formal institutions, such as schools and universities, as well as informal settings, such as families and communities. Educational systems are shaped by cultural values, historical contexts, and social needs.",
        codeLanguage: "text",
        code: "Educational systems can include formal institutions, such as schools and universities, as well as informal settings, such as families and communities. For example, schools provide structured learning environments where students acquire academic knowledge and social skills, while families and communities transmit cultural traditions and practical skills.",
        audio_url: "/audios/accordion/homoErectusAudio.mp3",
      }
    ]
  },
  {
    module_id: 5,
    title: "Cultural Evolution Summary PDF",
    description: "A concise summary of the key points in PDF format",
    content_type: "general",
    general: {
      title: "Cultural Evolution Summary",
      description: earlyHominidsHTML,
      url: "/material/pdf/cultural-evolution-summary.pdf",
      audio_url: "/audios/general/culturalAudio.mp3",
      material_type: "pdf",
    },
  },
  {
    module_id: 5,
    title: "Language and Communication - Video",
    description: "Explore the role of language and communication in cultural evolution",
    content_type: "video",
    video: {
      url: "/video/humanEvolutionVideo01.mp4",
      duration_minutes: 10,
      transcript: "This video discusses the importance of language and communication in cultural evolution...",
      audio_url: "/audios/video/languageAudio.mp3",
      bullet_points: [
        { time: 0, text: "Introduction to Language" },
        { time: 120, text: "Communication Methods" }
      ],
    },
  },
  {
    module_id: 5,
    title: "Art and Symbolism - Audio",
    description: "Listen to an audio overview of art and symbolism in cultural evolution",
    content_type: "audio",
    audio: {
      url: "/audio/humanEvolutionAudio01.mp3",
      duration_minutes: 6,
    },
  },
  {
    module_id: 5,
    title: "Religious Beliefs and Practices - Accordion",
    description: "Explore the role of religious beliefs and practices in cultural evolution",
    content_type: "accordian",
    accordions: [
      {
        title: "Mythology and Rituals",
        body: "Mythology and rituals play a significant role in cultural identity and cohesion, providing a framework for understanding the world and our place in it. Myths are traditional stories that explain natural phenomena, cultural values, and historical events. Rituals are symbolic actions that express and reinforce cultural beliefs and practices.",
        codeLanguage: "text",
        code: "Examples include creation myths and religious ceremonies. For example, creation myths explain the origins of the world and humanity, often involving gods, heroes, and supernatural forces. Religious ceremonies, such as baptisms, weddings, and funerals, mark important life transitions and reinforce community bonds.",
        audio_url: "/audios/accordion/humanEvolutionAudio01.mp3",
      },
      {
        title: "Sacred Texts",
        body: "Sacred texts are the foundational writings of religious traditions, providing guidance, wisdom, and moral teachings. These texts are often considered divinely inspired and serve as a source of authority and inspiration for believers. Sacred texts shape cultural values, norms, and practices, influencing individual behavior and social institutions.",
        codeLanguage: "text",
        code: "Examples include the Bible, Quran, and Vedas. For example, the Bible is the sacred text of Christianity, containing the Old and New Testaments, which include stories, laws, prophecies, and teachings. The Quran is the sacred text of Islam, believed to be the word of God as revealed to the Prophet Muhammad.",
        audio_url: "/audios/accordion/humanEvolutionAudio02.mp3",
      },
      {
        title: "Festivals and Celebrations",
        body: "Festivals and celebrations are important aspects of cultural identity, marking significant events, seasons, and traditions. These events often involve rituals, feasts, music, dance, and other forms of cultural expression. Festivals and celebrations reinforce community bonds, transmit cultural values, and provide opportunities for joy and renewal.",
        codeLanguage: "text",
        code: "Examples include harvest festivals, religious holidays, and national celebrations. For example, harvest festivals, such as Thanksgiving and the Mid-Autumn Festival, celebrate the gathering of crops and give thanks for a successful harvest. Religious holidays, such as Diwali, Eid al-Fitr, and Christmas, mark important events in the religious calendar and reinforce spiritual values.",
        audio_url: "/audios/accordion/homoHabilisAudio.mp3",
      },
      {
        title: "Art and Symbolism",
        body: "Art and symbolism are powerful forms of cultural expression, conveying meaning, emotion, and identity. Art can include visual arts, such as painting, sculpture, and architecture, as well as performing arts, such as music, dance, and theater. Symbolism involves the use of symbols, metaphors, and allegories to represent abstract ideas and cultural values.",
        codeLanguage: "text",
        code: "Examples include cave paintings, religious icons, and national flags. For example, cave paintings, such as those found in Lascaux and Altamira, provide insights into the lives and beliefs of prehistoric peoples. Religious icons, such as the cross and the Star of David, symbolize spiritual concepts and identities.",
        audio_url: "/audios/accordion/australopithecusAudio.mp3",
      },
      {
        title: "Oral Traditions",
        body: "Oral traditions are the verbal expressions of cultural knowledge, history, and values, passed down from generation to generation through storytelling, songs, and proverbs. Oral traditions play a crucial role in preserving cultural heritage, transmitting wisdom, and fostering community identity.",
        codeLanguage: "text",
        code: "Examples include folktales, epic poems, and proverbs. For example, folktales, such as those collected by the Brothers Grimm, convey moral lessons and cultural values through stories of heroes, villains, and magical creatures. Epic poems, such as the Iliad and the Odyssey, recount the deeds of legendary figures and historical events.",
        audio_url: "/audios/accordion/culturalAudio.mp3",
      }
    ]
  },
  {
    module_id: 5,
    title: "Cultural Diffusion and Exchange - PDF",
    description: "A detailed PDF on cultural diffusion and exchange",
    content_type: "general",
    general: {
      title: "Cultural Diffusion Overview",
      description: earlyHominidsHTML,
      url: "/material/pdf/cultural-evolution-summary.pdf",
      audio_url: "/audios/general/humanEvolutionAudio01.mp3",
      material_type: "pdf",
    },
  },
  {
    module_id: 5,
    title: "Technology and Innovation - Video",
    description: "Understand the impact of technology and innovation on cultural evolution",
    content_type: "video",
    video: {
      url: "/video/humanEvolutionVideo01.mp4",
      duration_minutes: 9,
      transcript: "This video explores the role of technology and innovation in cultural evolution...",
      audio_url: "/audios/video/technologyAudio.mp3",
      bullet_points: [
        { time: 0, text: "Introduction to Technology" },
        { time: 180, text: "Innovation and Cultural Change" }
      ],
    },
  },
  {
    module_id: 5,
    title: "Cultural Evolution Slides",
    description: "Multi-format slide content covering cultural topics",
    content_type: "slide",
    slides: [
      {
        title: "Cultural Timeline - Video",
        description: "Watch the major milestones in cultural evolution",
        content_type: "video",
        video: {
          url: "/multiSlide/video/culturalTimeline.mp4",
          duration_minutes: 6,
          audio_url: "/audios/slide_video/culturalAudio.mp3",
        },
      },
      // {
      //   title: "Cultural Practices - Audio",
      //   description: "Audio summary of key cultural practices",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/culturalPracticesAudio.mp3",
      //     duration_minutes: 5,
      //   },
      // },
      {
        title: "Cultural Concepts - Accordion",
        description: "Break down cultural theories and examples",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/slideAudioUrl[10].mp3",
        accordions: [
          {
            title: "Rituals and Traditions",
            body: "Rituals and traditions are important aspects of cultural identity, providing a sense of continuity, belonging, and meaning. Rituals are symbolic actions that express and reinforce cultural beliefs and practices, while traditions are customs and practices passed down from generation to generation. Rituals and traditions play a crucial role in shaping individual and collective identity.",
            codeLanguage: "text",
            code: "Rituals can include ceremonies, festivals, and rites of passage. For example, ceremonies, such as weddings and funerals, mark important life transitions and reinforce community bonds. Festivals, such as harvest festivals and religious holidays, celebrate cultural values and traditions. Rites of passage, such as initiation rituals and coming-of-age ceremonies, mark the transition from one stage of life to another.",
            audio_url: "/audios/slide_accordion/rituals.mp3",
          },
          {
            title: "Language and Communication",
            body: "Language is a key component of cultural evolution, enabling the transmission of knowledge, values, and traditions from one generation to the next. Language allows individuals to express their thoughts, emotions, and identities, and to engage in social interactions and relationships. Language is shaped by cultural contexts and historical developments, and it plays a crucial role in shaping cultural identity.",
            codeLanguage: "text",
            code: "Language allows for the transmission of knowledge and traditions. For example, oral traditions, such as folktales, epic poems, and proverbs, convey cultural wisdom and values through storytelling and verbal expression. Written languages, such as literature, philosophy, and historical texts, preserve and transmit cultural knowledge and achievements.",
            audio_url: "/audios/slide_accordion/language.mp3",
          },
          {
            title: "Cuisine and Foodways",
            body: "Cuisine and foodways are important aspects of cultural identity, reflecting the unique flavors, ingredients, and cooking techniques of a culture. Food is not only a source of nourishment but also a means of expressing cultural values, traditions, and social relationships. Cuisine and foodways are shaped by historical, geographical, and social factors, and they play a crucial role in shaping cultural identity.",
            codeLanguage: "text",
            code: "Cuisine and foodways can include traditional dishes, cooking methods, and dining customs. For example, traditional dishes, such as sushi, pizza, and curry, reflect the unique flavors and ingredients of a culture. Cooking methods, such as grilling, steaming, and fermenting, are shaped by historical and geographical factors. Dining customs, such as table manners and food etiquette, reflect social relationships and cultural values.",
            audio_url: "/audios/slide_accordion/evolutionAudio.mp3",
          },
          {
            title: "Music and Dance",
            body: "Music and dance are powerful forms of cultural expression, conveying emotion, identity, and meaning. Music can include vocal and instrumental performances, as well as composed and improvised pieces. Dance can include traditional, folk, and contemporary styles, as well as social and ritual dances. Music and dance are shaped by cultural contexts and historical developments, and they play a crucial role in shaping cultural identity.",
            codeLanguage: "text",
            code: "Music and dance can include traditional, folk, and contemporary styles. For example, traditional music, such as folk songs and classical compositions, reflects the unique sounds and instruments of a culture. Folk dances, such as the Irish jig and the Hawaiian hula, express cultural values and traditions through movement and rhythm. Contemporary styles, such as hip-hop and electronic dance music, reflect the evolving tastes and influences of modern culture.",
            audio_url: "/audios/slide_accordion/geneticAudio.mp3",
          },
          {
            title: "Clothing and Adornment",
            body: "Clothing and adornment are important aspects of cultural identity, reflecting the unique styles, materials, and symbols of a culture. Clothing serves not only as a means of protection and modesty but also as a form of self-expression and social identity. Adornment, such as jewelry, tattoos, and body art, can convey cultural values, status, and personal meaning.",
            codeLanguage: "text",
            code: "Clothing and adornment can include traditional, modern, and ceremonial styles. For example, traditional clothing, such as the kimono, the sari, and the kilt, reflects the unique fabrics, colors, and designs of a culture. Modern clothing, such as jeans, t-shirts, and sneakers, reflects the global influences and trends of contemporary fashion. Ceremonial clothing, such as wedding dresses and religious robes, marks important life events and spiritual practices.",
            audio_url: "/audios/slide_accordion/homoErectusAudio.mp3",
          }
        ]
      },
      // {
      //   title: "Cultural Reference PDF",
      //   description: "Handy one-page cheat sheet",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/slideAudioUrl[10].mp3",
      //   general: {
      //     title: "Quick Cultural Reference",
      //     description: humanMigrationHTML,
      //     url: "/multiSlide/general/pdf/culturalCheatSheet.pdf",
      //     audio_url: "/audios/slide_general/culturalCheatSheetAudio.mp3",
      //     material_type: "pdf",
      //   },
      // },
      {
        title: "Art and Symbolism - Video",
        description: "Explore the role of art and symbolism in cultural evolution",
        content_type: "video",
        video: {
          url: "/multiSlide/video/humanEvolutionVideo01.mp4",
          duration_minutes: 7,
          audio_url: "/audios/slide_video/artAudio.mp3",
        },
      },
      // {
      //   title: "Music and Dance - Audio",
      //   description: "Audio on the significance of music and dance in cultural practices",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/humanEvolutionAudio01.mp3",
      //     duration_minutes: 6,
      //   },
      // },
      {
        title: "Cultural Festivals - Accordion",
        description: "Learn about various cultural festivals and their significance",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/slideAudioUrl[12].mp3",
        accordions: [
          {
            title: "Harvest Festivals",
            body: "Harvest festivals are celebrations that mark the gathering of crops and give thanks for a successful harvest. These festivals often involve rituals, feasts, music, dance, and other forms of cultural expression. Harvest festivals reinforce community bonds, transmit cultural values, and provide opportunities for joy and renewal.",
            codeLanguage: "text",
            code: "Examples include Thanksgiving and Mid-Autumn Festival. For example, Thanksgiving is a harvest festival celebrated in the United States and Canada, marking the gathering of crops and giving thanks for the blessings of the year. The Mid-Autumn Festival is a harvest festival celebrated in China and other East Asian countries, marking the end of the harvest season and the reunion of families.",
            audio_url: "/audios/slide_accordion/harvestFestivalsAudio.mp3",
          },
          {
            title: "Religious Festivals",
            body: "Religious festivals are celebrations that are tied to specific religious beliefs and practices, marking important events, seasons, and traditions. These festivals often involve rituals, prayers, feasts, and other forms of spiritual expression. Religious festivals reinforce community bonds, transmit cultural values, and provide opportunities for joy and renewal.",
            codeLanguage: "text",
            code: "Examples include Diwali, Eid al-Fitr, and Christmas. For example, Diwali is a religious festival celebrated by Hindus, Sikhs, and Jains, marking the victory of light over darkness and the triumph of good over evil. Eid al-Fitr is a religious festival celebrated by Muslims, marking the end of the holy month of Ramadan and the breaking of the fast. Christmas is a religious festival celebrated by Christians, marking the birth of Jesus Christ and the celebration of peace and goodwill.",
            audio_url: "/audios/slide_accordion/religiousFestivalsAudio.mp3",
          },
          {
            title: "National Festivals",
            body: "National festivals are celebrations that mark important events, achievements, and traditions of a nation. These festivals often involve parades, ceremonies, speeches, and other forms of patriotic expression. National festivals reinforce community bonds, transmit cultural values, and provide opportunities for joy and renewal.",
            codeLanguage: "text",
            code: "Examples include Independence Day and National Day. For example, Independence Day is a national festival celebrated in many countries, marking the declaration of independence and the birth of the nation. National Day is a national festival celebrated in many countries, marking the founding of the nation and the celebration of national identity.",
            audio_url: "/audios/slide_accordion/homoHabilisAudio.mp3",
          },
          {
            title: "Cultural Festivals",
            body: "Cultural festivals are celebrations that mark the unique traditions, arts, and heritage of a culture. These festivals often involve performances, exhibitions, workshops, and other forms of cultural expression. Cultural festivals reinforce community bonds, transmit cultural values, and provide opportunities for joy and renewal.",
            codeLanguage: "text",
            code: "Examples include Carnival and Mardi Gras. For example, Carnival is a cultural festival celebrated in many countries, marking the period before Lent and the celebration of life and joy. Mardi Gras is a cultural festival celebrated in New Orleans and other cities, marking the period before Lent and the celebration of music, dance, and parades.",
            audio_url: "/audios/slide_accordion/australopithecusAudio.mp3",
          },
          {
            title: "Seasonal Festivals",
            body: "Seasonal festivals are celebrations that mark the changing of the seasons and the cycles of nature. These festivals often involve rituals, feasts, music, dance, and other forms of cultural expression. Seasonal festivals reinforce community bonds, transmit cultural values, and provide opportunities for joy and renewal.",
            codeLanguage: "text",
            code: "Examples include Spring Festival and Winter Solstice. For example, Spring Festival is a seasonal festival celebrated in China and other East Asian countries, marking the beginning of spring and the celebration of renewal and rebirth. Winter Solstice is a seasonal festival celebrated in many cultures, marking the shortest day of the year and the celebration of light and warmth.",
            audio_url: "/audios/slide_accordion/culturalAudio.mp3",
          }
        ]
      },
      // {
      //   title: "Cultural Exchange and Globalization - PDF",
      //   description: "In-depth PDF on the impact of cultural exchange and globalization",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/slideAudioUrl[12].mp3",
      //   general: {
      //     title: "Cultural Exchange Overview",
      //     description: humanToolsHTML,
      //     url: "/multiSlide/general/pdf/hominidTraitsComparison.pdf",
      //     audio_url: "/audios/slide_general/humanEvolutionAudio01.mp3",
      //     material_type: "pdf",
      //   },
      // },
      {
        title: "Cultural Preservation - Video",
        description: "Understand the importance of cultural preservation",
        content_type: "video",
        video: {
          url: "/multiSlide/video/humanEvolutionVideo01.mp4",
          duration_minutes: 8,
          audio_url: "/audios/slide_video/preservationAudio.mp3",
        },
      },
      // {
      //   title: "Future of Cultural Evolution - Audio",
      //   description: "Audio on the future directions of cultural evolution",
      //   content_type: "audio",
      //   audio: {
      //     url: "/multiSlide/audio/humanEvolutionAudio02.mp3",
      //     duration_minutes: 7,
      //   },
      // },
    ]
  },
];

const assignments = [
  // Module 1: Early Hominids
  {
    module_id: 1,
    title: "Fossil Evidence Assignment",
    description: "Review and summarize major early hominid fossil discoveries",
    file: "/assignments/file/earlyHominids.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    max_score: 100,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 1,
    title: "Hominid Traits Matching",
    description: "Match hominid species with their unique traits",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    max_score: 50,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match early hominids with their defining traits",
        options: [
          {
            option_text: "Australopithecus afarensis",
            option_type: "text",
            match_text: "Bipedal, small brain",
            match_type: "text"
          },
          {
            option_text: "Homo habilis",
            option_type: "text",
            match_text: "Tool use, increased brain size",
            match_type: "text"
          },
          {
            option_text: "Homo erectus",
            option_type: "text",
            match_text: "Used fire, migrated from Africa",
            match_type: "text"
          }
        ]
      }
    ]
  },
  {
    module_id: 1,
    title: "Early Hominids True/False",
    description: "Test your knowledge of early hominids",
    file: null,
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    max_score: 30,
    status: "active",
    category: "true_false",
    created_by_type: "admin",
    updated_by_type: "admin",
    true_false_questions: [
      {
        question_text: "Australopithecus afarensis was fully arboreal",
        correct_answer: false
      },
      {
        question_text: "Homo habilis is often called the 'handy man'",
        correct_answer: true
      }
    ]
  },
  {
    module_id: 1,
    title: "Fill in the Blanks - Early Hominids",
    description: "Complete the facts about early hominids",
    file: null,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    max_score: 40,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text: "The famous Australopithecus skeleton found in Ethiopia is named _____",
        answers: ["Lucy"]
      },
      {
        question_text: "Homo habilis is believed to have used simple _____ tools",
        answers: ["stone"]
      }
    ]
  },
  {
    module_id: 1,
    title: "Early Hominids Essay",
    description: "Write a paragraph on early human ancestors",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    max_score: 50,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph: "Describe the significance of Australopithecus afarensis in human evolution."
      }
    ]
  },

  // Module 2: Hominid Development & Brain Evolution
  {
    module_id: 2,
    title: "Brain Evolution Assignment",
    description: "Explore how the brain developed across hominid species",
    file: "/assignments/file/brainEvolution.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    max_score: 100,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 2,
    title: "Cranial Capacity Matching",
    description: "Match species with their estimated cranial capacities",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    max_score: 50,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match hominids with average cranial capacity",
        options: [
          {
            option_text: "Australopithecus",
            option_type: "text",
            match_text: "450 cc",
            match_type: "text"
          },
          {
            option_text: "Homo habilis",
            option_type: "text",
            match_text: "600-700 cc",
            match_type: "text"
          },
          {
            option_text: "Homo sapiens",
            option_type: "text",
            match_text: "1350 cc",
            match_type: "text"
          }
        ]
      }
    ]
  },
  {
    module_id: 2,
    title: "Cognitive Development True/False",
    description: "Assess understanding of brain and behavior evolution",
    file: null,
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    max_score: 30,
    status: "active",
    category: "true_false",
    created_by_type: "admin",
    updated_by_type: "admin",
    true_false_questions: [
      {
        question_text: "Tool complexity increased as brain size grew",
        correct_answer: true
      },
      {
        question_text: "Homo erectus had a smaller brain than Australopithecus",
        correct_answer: false
      }
    ]
  },
  {
    module_id: 2,
    title: "Fill in the Blanks - Brain Evolution",
    description: "Fill in missing facts about brain and behavior",
    file: null,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    max_score: 40,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text: "_____ was the first hominid known to use fire regularly.",
        answers: ["Homo erectus"]
      },
      {
        question_text: "The increase in _____ capacity is linked with tool use and social behavior.",
        answers: ["brain"]
      }
    ]
  },
  {
    module_id: 2,
    title: "Brain Evolution Essay",
    description: "Reflect on the link between brain size and human advancement",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    max_score: 50,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph: "Discuss how increasing brain size influenced the development of language and culture in early Homo species."
      }
    ]
  },

  // Module 3: Genetics in Evolution
  {
    module_id: 3,
    title: "Genetic Variation Assignment",
    description: "Review and summarize major genetic variations in human evolution",
    file: "/assignments/file/geneticVariation.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    max_score: 100,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 3,
    title: "Genetic Traits Matching",
    description: "Match genetic traits with their evolutionary significance",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    max_score: 50,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match genetic traits with their evolutionary significance",
        options: [
          {
            option_text: "Lactose Tolerance",
            option_type: "text",
            match_text: "Adaptation to dairy farming",
            match_type: "text"
          },
          {
            option_text: "Sickle Cell Anemia",
            option_type: "text",
            match_text: "Resistance to malaria",
            match_type: "text"
          },
          {
            option_text: "High Altitude Adaptation",
            option_type: "text",
            match_text: "Survival in low-oxygen environments",
            match_type: "text"
          }
        ]
      }
    ]
  },
  {
    module_id: 3,
    title: "Genetic Evolution True/False",
    description: "Test your knowledge of genetic evolution",
    file: null,
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    max_score: 30,
    status: "active",
    category: "true_false",
    created_by_type: "admin",
    updated_by_type: "admin",
    true_false_questions: [
      {
        question_text: "Genetic mutations are always harmful",
        correct_answer: false
      },
      {
        question_text: "Natural selection acts on genetic variations",
        correct_answer: true
      }
    ]
  },
  {
    module_id: 3,
    title: "Fill in the Blanks - Genetic Evolution",
    description: "Complete the facts about genetic evolution",
    file: null,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    max_score: 40,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text: "The process by which genetic variations are passed down is called _____",
        answers: ["heredity"]
      },
      {
        question_text: "Genetic _____ is the raw material for evolution",
        answers: ["mutation"]
      }
    ]
  },
  {
    module_id: 3,
    title: "Genetic Evolution Essay",
    description: "Write a paragraph on the role of genetics in human evolution",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    max_score: 50,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph: "Describe the significance of genetic mutations in human evolution."
      }
    ]
  },

  // Module 4: Environmental Influences on Evolution
  {
    module_id: 4,
    title: "Environmental Adaptation Assignment",
    description: "Review and summarize major environmental adaptations in human evolution",
    file: "/assignments/file/environmentalAdaptation.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    max_score: 100,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 4,
    title: "Environmental Traits Matching",
    description: "Match environmental traits with their evolutionary significance",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    max_score: 50,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match environmental traits with their evolutionary significance",
        options: [
          {
            option_text: "Dark Skin",
            option_type: "text",
            match_text: "Protection against UV radiation",
            match_type: "text"
          },
          {
            option_text: "Cold Adaptation",
            option_type: "text",
            match_text: "Survival in cold climates",
            match_type: "text"
          },
          {
            option_text: "High Altitude Adaptation",
            option_type: "text",
            match_text: "Survival in low-oxygen environments",
            match_type: "text"
          }
        ]
      }
    ]
  },
  {
    module_id: 4,
    title: "Environmental Evolution True/False",
    description: "Test your knowledge of environmental evolution",
    file: null,
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    max_score: 30,
    status: "active",
    category: "true_false",
    created_by_type: "admin",
    updated_by_type: "admin",
    true_false_questions: [
      {
        question_text: "Environmental adaptations are always beneficial",
        correct_answer: false
      },
      {
        question_text: "Natural selection acts on environmental adaptations",
        correct_answer: true
      }
    ]
  },
  {
    module_id: 4,
    title: "Fill in the Blanks - Environmental Evolution",
    description: "Complete the facts about environmental evolution",
    file: null,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    max_score: 40,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text: "The process by which species adapt to their environment is called _____",
        answers: ["natural selection"]
      },
      {
        question_text: "Environmental _____ is the raw material for evolution",
        answers: ["adaptation"]
      }
    ]
  },
  {
    module_id: 4,
    title: "Environmental Evolution Essay",
    description: "Write a paragraph on the role of environment in human evolution",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    max_score: 50,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph: "Describe the significance of environmental adaptations in human evolution."
      }
    ]
  },

  // Module 5: Cultural Evolution and Human Society
  {
    module_id: 5,
    title: "Cultural Evolution Assignment",
    description: "Review and summarize major cultural developments in human evolution",
    file: "/assignments/file/culturalEvolution.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    max_score: 100,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 5,
    title: "Cultural Traits Matching",
    description: "Match cultural traits with their evolutionary significance",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    max_score: 50,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match cultural traits with their evolutionary significance",
        options: [
          {
            option_text: "Language",
            option_type: "text",
            match_text: "Communication and social cohesion",
            match_type: "text"
          },
          {
            option_text: "Art",
            option_type: "text",
            match_text: "Expression and cultural identity",
            match_type: "text"
          },
          {
            option_text: "Religion",
            option_type: "text",
            match_text: "Social norms and moral values",
            match_type: "text"
          }
        ]
      }
    ]
  },
  {
    module_id: 5,
    title: "Cultural Evolution True/False",
    description: "Test your knowledge of cultural evolution",
    file: null,
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    max_score: 30,
    status: "active",
    category: "true_false",
    created_by_type: "admin",
    updated_by_type: "admin",
    true_false_questions: [
      {
        question_text: "Cultural evolution is independent of genetic evolution",
        correct_answer: false
      },
      {
        question_text: "Natural selection acts on cultural traits",
        correct_answer: true
      }
    ]
  },
  {
    module_id: 5,
    title: "Fill in the Blanks - Cultural Evolution",
    description: "Complete the facts about cultural evolution",
    file: null,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    max_score: 40,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text: "The process by which cultural traits are passed down is called _____",
        answers: ["cultural transmission"]
      },
      {
        question_text: "Cultural _____ is the raw material for evolution",
        answers: ["innovation"]
      }
    ]
  },
  {
    module_id: 5,
    title: "Cultural Evolution Essay",
    description: "Write a paragraph on the role of culture in human evolution",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    max_score: 50,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph: "Describe the significance of cultural evolution in human history."
      }
    ]
  },
];

const quizzes = [
  {
    module_id: 1,
    title: "Early Hominids Quiz",
    duration_minutes: 10,
    passing_score: 50,
    max_attempts: 3,
    attempts_gap: 12, // in hours
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 2,
    title: "Brain Evolution & Development Quiz",
    duration_minutes: 15,
    passing_score: 60,
    max_attempts: 2,
    attempts_gap: 24, // in hours
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 5,
    title: "Cultural Evolution and Human Society Quiz",
    duration_minutes: 15,
    passing_score: 60,
    max_attempts: 2,
    attempts_gap: 24, // in hours
    quizType: "normal",
    status: "active",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
];

const quizQuestions = [
  // Quiz ID 1 - Early Hominids
  {
    quiz_id: 1,
    module_id: 1,
    question_text: "Which of the following is the earliest known hominid species?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 1,
    options: [
      { text: "Homo sapiens", correct: false },
      { text: "Australopithecus afarensis", correct: true },
      { text: "Homo neanderthalensis", correct: false },
      { text: "Homo habilis", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 1,
    module_id: 1,
    question_text: "Homo habilis is often associated with the use of _____ tools.",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 3,
    blanks: [{ correct_word: "stone", hint: "s" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // Quiz ID 2 - Brain Evolution & Development
  {
    quiz_id: 2,
    module_id: 2,
    question_text: "Which hominid species had a significantly larger brain capacity compared to earlier ones?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 1,
    options: [
      { text: "Australopithecus afarensis", correct: false },
      { text: "Homo erectus", correct: true },
      { text: "Sahelanthropus tchadensis", correct: false },
      { text: "Ardipithecus ramidus", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 2,
    module_id: 2,
    question_text: "Brain size and cognitive complexity increased in later hominids.",
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
    question_text: "The part of the brain associated with reasoning and planning is the _____ cortex.",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 3,
    blanks: [{ correct_word: "prefrontal", hint: "p" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // Quiz ID 3 - Cultural Evolution and Human Society
  {
    quiz_id: 3,
    module_id: 5,
    question_text: "Which of the following is a key aspect of cultural evolution?",
    question_type: "mcq",
    marks: 5,
    sequence_no: 1,
    options: [
      { text: "Genetic mutation", correct: false },
      { text: "Language development", correct: true },
      { text: "Physical adaptation", correct: false },
      { text: "Natural selection", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 3,
    module_id: 5,
    question_text: "Cultural evolution involves the transmission of knowledge and practices through _____.",
    question_type: "complete-sentence",
    marks: 5,
    sequence_no: 2,
    blanks: [{ correct_word: "generations", hint: "g" }],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 3,
    module_id: 5,
    question_text: "The development of art and religion is a significant aspect of cultural evolution.",
    question_type: "true-false",
    marks: 3,
    sequence_no: 3,
    options: [
      { text: "true", correct: true },
      { text: "false", correct: false },
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
];

const predefinedQuestions = [
  {
    question_text: "What is the primary method scientists use to study human evolution?",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 116,
    options: [
      { option_text: "Mythology", is_correct: false },
      { option_text: "Fossil evidence", is_correct: true },
      { option_text: "Astrology", is_correct: false },
      { option_text: "Alchemy", is_correct: false },
    ],
  },
  {
    question_text: "Which species is considered a direct ancestor of modern humans?",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 117,
    options: [
      { option_text: "Homo erectus", is_correct: true },
      { option_text: "Pan troglodytes", is_correct: false },
      { option_text: "Canis lupus", is_correct: false },
      { option_text: "Gorilla gorilla", is_correct: false },
    ],
  },
  {
    question_text: "What trait is most associated with bipedalism in early hominids?",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 118,
    options: [
      { option_text: "Opposable thumbs", is_correct: false },
      { option_text: "Enlarged brain", is_correct: false },
      { option_text: "Pelvic structure", is_correct: true },
      { option_text: "Facial flatness", is_correct: false },
    ],
  },
  {
    question_text: "Which of the following is NOT a known hominid species?",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 119,
    options: [
      { option_text: "Homo habilis", is_correct: false },
      { option_text: "Homo neanderthalensis", is_correct: false },
      { option_text: "Australopithecus afarensis", is_correct: false },
      { option_text: "Homo mechanicus", is_correct: true },
    ],
  },
  {
    question_text: "Which part of the brain is primarily responsible for complex thinking and planning?",
    question_img: null,
    question_type: "mcq",
    marks: 5,
    sequence_no: 120,
    options: [
      { option_text: "Occipital lobe", is_correct: false },
      { option_text: "Cerebellum", is_correct: false },
      { option_text: "Prefrontal cortex", is_correct: true },
      { option_text: "Brainstem", is_correct: false },
    ],
  },
];

const audioToScriptQuestions = [
  {
    quiz_id: 1,
    url: "/audiotoScript/humanEvolutionIntro.mp3",
    script: "Welcome to the Human Evolution course. In this audio, we'll explore early hominids and their adaptations over time.",
    marks: 10, // Default marks
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 2,
    url: "/audiotoScript/humanEvolutionIntro.mp3",
    script: "Bipedalism, brain development, and tool usage were key milestones in human evolution, helping distinguish Homo sapiens from other primates.",
    marks: 10, // Default marks
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 3,
    url: "/audiotoScript/culturalEvolutionIntro.mp3",
    script: "Cultural evolution involves the development of language, art, and social structures, which have significantly influenced human societies.",
    marks: 10, // Default marks
    created_by_type: "admin",
    updated_by_type: "admin",
  },
];

const realWordQuestions = [
  {
    quiz_id: 1,
    words: ["hominid", "fossil", "evoltion", "bipedal", "skeleten"],
    correct_answers: ["yes", "yes", "no", "yes", "no"],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 2,
    words: ["migration", "neanderthal", "genom", "prehistoric", "adaption"],
    correct_answers: ["yes", "yes", "no", "yes", "no"],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 3,
    words: ["culture", "language", "tradition", "society", "evoluton"],
    correct_answers: ["yes", "yes", "yes", "yes", "no"],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
];

const summarizePassageQuestions = [
  {
    quiz_id: 1,
    passage: `Human evolution traces the development of Homo sapiens from earlier hominins over millions of years. This process involved major anatomical and behavioral changes, including the development of bipedalism, tool-making abilities, and advanced cognitive functions. Fossil discoveries, along with genetic and archaeological evidence, have helped scientists piece together the story of our ancestry. Human evolution is not linear but rather a branching tree with several species, some of which coexisted. Research continues to uncover new insights into how humans adapted to diverse environments and spread across the globe.`,
    time_limit: 6,
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 2,
    passage: `The use of tools was a significant milestone in human evolution. Early hominins like Homo habilis are believed to have created simple stone tools for cutting and scraping. Over time, tool technology became more advanced, allowing for hunting, food preparation, and construction. Tool use reflects growing brain size and problem-solving skills, both key factors in human development. Archaeological sites across Africa and other continents have revealed a rich history of tool innovation, marking humanity's increasing ability to manipulate the environment for survival and advancement.`,
    time_limit: 6,
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    quiz_id: 3,
    passage: `Cultural evolution has played a crucial role in shaping human societies. It involves the development of language, art, and social structures that have allowed humans to adapt and thrive in various environments. These cultural advancements have significantly influenced human history and continue to impact modern societies.`,
    time_limit: 6,
    created_by_type: "admin",
    updated_by_type: "admin",
  },
];

const bestOptionQuestions = [
  // Quiz ID 1 - Human Evolution Basics
  {
    quiz_id: 1,
    passage: "Human evolution is a ____ process that has occurred over millions of years. Early humans developed ____ posture, allowing them to walk upright. One of the most significant developments was the increase in brain ____.",
    blanked_words: [
      { word: "gradual", options: ["gradual", "sudden", "rapid", "instant"], position: 1 },
      { word: "bipedal", options: ["bipedal", "quadrupedal", "prone", "upright"], position: 2 },
      { word: "size", options: ["size", "weight", "mass", "volume"], position: 3 }
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  // Quiz ID 2 - Human Evolution Advances
  {
    quiz_id: 2,
    passage: "The use of tools marked a major step in human evolution, indicating improved ____ skills. Over time, early humans began to form ____ groups and develop complex ____, laying the foundation for modern societies.",
    blanked_words: [
      { word: "problem-solving", options: ["problem-solving", "communication", "social", "physical"], position: 1 },
      { word: "social", options: ["social", "individual", "family", "tribal"], position: 2 },
      { word: "communication", options: ["communication", "language", "speech", "interaction"], position: 3 }
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  // Quiz ID 3 - Cultural Evolution and Human Society
  {
    quiz_id: 3,
    passage: "Cultural evolution involves the development of ____ and ____ structures, which have significantly influenced human societies. These developments have allowed humans to adapt to various environments and thrive.",
    blanked_words: [
      { word: "language", options: ["language", "speech", "communication", "expression"], position: 1 },
      { word: "social", options: ["social", "cultural", "economic", "political"], position: 2 }
    ],
    created_by_type: "admin",
    updated_by_type: "admin",
  },
];

[{ "position": 1, "correct_id": 1 }, { "position": 2, "correct_id": 4 }]
[{ "correct": "hi", "position": 1 }, { "correct": "are you", "position": 2 }]

const dragDropQuestions = [
  {
    quiz_id: 1,
    module_id: 1,
    type: "dragdrop",
    marks: 5,
    is_active: true,
    dragdrop_prompt: "The species that walked upright early in evolution was ___, while the species known as the 'handy man' was ___.",
    dragdrop_options: [
      "Homo sapiens",
      "Australopithecus afarensis",
      "Homo neanderthalensis",
      "Homo habilis"
    ],
    dragdrop_blanks: [
      { position: 1, correct: "Australopithecus afarensis" }, // Australopithecus afarensis
      { position: 2, correct: "Homo habilis" }  // Homo habilis
    ],
    created_by_type: "admin",
    updated_by_type: "admin"
  },
  {
    quiz_id: 2,
    module_id: 2,
    type: "dragdrop",
    marks: 5,
    is_active: true,
    dragdrop_prompt: "The part of the brain responsible for decision making is ___, while the part responsible for vision is ___.",
    dragdrop_options: [
      "Prefrontal cortex",
      "Occipital lobe",
      "Cerebellum",
      "Brainstem"
    ],
    dragdrop_blanks: [
      { position: 1, correct: "Prefrontal cortex" }, // Prefrontal cortex
      { position: 2, correct: "Occipital lobe" }  // Occipital lobe
    ],
    created_by_type: "admin",
    updated_by_type: "admin"
  },
  {
    quiz_id: 3,
    module_id: 5,
    type: "dragdrop",
    marks: 5,
    is_active: true,
    dragdrop_prompt: "One of the biggest milestones in cultural evolution was ___, and the organization of human groups into ___.",
    dragdrop_options: [
      "Language development",
      "Genetic mutation",
      "Physical adaptation",
      "Social structures"
    ],
    dragdrop_blanks: [
      { position: 1, correct: "Language development" }, // Language development
      { position: 2, correct: "Social structures" }  // Social structures
    ],
    created_by_type: "admin",
    updated_by_type: "admin"
  }
];

const arrangeOrderQuestions = [
  {
    quiz_id: 1,
    module_id: 1,
    type: "arrangeorder",
    marks: 5,
    is_active: true,
    arrangeorder_prompt: "Arrange the steps of human evolution in chronological order.",
    sentences: [
      "Homo sapiens emerged as the dominant species.",
      "Australopithecus afarensis walked upright.",
      "Homo habilis used stone tools.",
      "Homo erectus migrated out of Africa."
    ],
    correct_order: [2, 3, 4, 1],
    created_by_type: "admin",
    updated_by_type: "admin"
  },
  {
    quiz_id: 2,
    module_id: 2,
    type: "arrangeorder",
    marks: 5,
    is_active: true,
    arrangeorder_prompt: "Arrange the stages of brain development in humans.",
    sentences: [
      "The prefrontal cortex developed for advanced reasoning.",
      "The brainstem controlled basic survival functions.",
      "The cerebellum improved motor skills.",
      "The neocortex expanded for complex thought."
    ],
    correct_order: [2, 3, 4, 1],
    created_by_type: "admin",
    updated_by_type: "admin"
  },
  {
    quiz_id: 3,
    module_id: 5,
    type: "arrangeorder",
    marks: 5,
    is_active: true,
    arrangeorder_prompt: "Arrange the cultural milestones in human history.",
    sentences: [
      "The invention of writing systems.",
      "The development of agriculture.",
      "The creation of complex societies.",
      "The use of symbolic language."
    ],
    correct_order: [4, 2, 3, 1],
    created_by_type: "admin",
    updated_by_type: "admin"
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
      if (course.title === "The Story of Us: Human Evolution") {
        if (session.sequence_no === 1 && module.sequence_no === 1) {
          topicsToAdd = basicTopics.filter(topic => topic.module_id === 1);
        } else if (session.sequence_no === 2) {
          topicsToAdd = functionTopics.filter(topic => topic.module_id === 2);
        } else if (session.sequence_no === 3) {
          topicsToAdd = geneticsTopics.filter(topic => topic.module_id === 3);
        } else if (session.sequence_no === 4) {
          topicsToAdd = environmentalTopics.filter(topic => topic.module_id === 4);
        } else if (session.sequence_no === 5) {
          topicsToAdd = culturalTopics.filter(topic => topic.module_id === 5);
        }
      }

      for (const topic of topicsToAdd) {
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
                slideDur = slide.general?.completion_type === "timer"
                  ? slide.general?.completion_time || 0
                  : slide.general?.duration_minutes || 0;
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
      if (!course) continue;

      // Only create assignments for the specific course and modules 1 through 5
      if (course.title === "The Story of Us: Human Evolution" && assignmentData.module_id <= 5) {
        const newAssignment = await Assignment.create({
          ...assignmentData,
          created_by: admin.id,
          updated_by: admin.id,
        });

        // Handle matching questions
        if (assignmentData.category === "matching" && Array.isArray(assignmentData.matching_questions)) {
          for (const question of assignmentData.matching_questions) {
            const matchingQuestion = await MatchingQuestion.create({
              assignment_id: newAssignment.id,
              question_text: question.question_text,
              created_by: admin.id,
              updated_by: admin.id,
              created_by_type: "admin",
              updated_by_type: "admin",
            });

            if (Array.isArray(question.options)) {
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
        }

        // Handle fill-in-the-blank questions
        if (assignmentData.category === "fill_in_the_blanks" && Array.isArray(assignmentData.fill_blank_questions)) {
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

        // Handle paragraph writing questions
        if (assignmentData.category === "paragraph_writing" && Array.isArray(assignmentData.paragraph_questions)) {
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
    const createdQuizzes = [];
    for (const quizData of quizzes) {
      const module = moduleRecords.find(m => m.id === quizData.module_id);
      if (!module) continue;

      // Get the course for this module
      const course = courseRecords.find(c => c.id === module.course_id);

      // Only create quizzes for the matching course and module
      if (course.title === "The Story of Us: Human Evolution") {
        const quiz = await Quizzes.create({
          ...quizData,
          module_id: module.id,
          created_by: admin.id,
          updated_by: admin.id,
        });
        console.log(`✅ Quiz "${quiz.title}" created for module "${module.title}"`);
        createdQuizzes.push(quiz);


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
        const dragDropQuizzes = dragDropQuestions.filter(q => q.quiz_id === quiz.id);
        for (const ddq of dragDropQuizzes) {
          await QuizQuestion.create({
            quiz_id: quiz.id,
            type: "dragdrop",
            marks: ddq.marks,
            dragdrop_prompt: ddq.dragdrop_prompt,
            dragdrop_options: ddq.dragdrop_options, // Store options as JSON
            dragdrop_blanks: ddq.dragdrop_blanks,   // Store blanks as JSON
            is_active: ddq.is_active,
            created_by: admin.id || 1,
            updated_by: admin.id || 1,
            created_by_type: "admin",
            updated_by_type: "admin",
          });
        }

        // 8. Arrange Order Questions (if any)
        const arrangeOrderQuizzes = arrangeOrderQuestions.filter(q => q.quiz_id === quiz.id);
        for (const aoq of arrangeOrderQuizzes) {
          await QuizQuestion.create({
            quiz_id: quiz.id,
            type: "arrangeorder",
            marks: aoq.marks,
            arrangeorder_prompt: aoq.arrangeorder_prompt,
            sentences: aoq.sentences,
            correct_order: aoq.correct_order,
            is_active: aoq.is_active,
            created_by: admin.id || 1,
            updated_by: admin.id || 1,
            created_by_type: "admin",
            updated_by_type: "admin",
          });
        }


        console.log(`✅ All questions added to quiz "${quiz.title}"`);
      }

      console.log("\n🎉 All course data seeded successfully.");
    }
  } catch (error) {
    console.error("❌ Error inserting course data:", error);
  }
};

module.exports = insertDefaultCourseData;