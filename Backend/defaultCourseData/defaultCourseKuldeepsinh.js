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
    { category: "Geography", id: 3 },
];

const courses = [
    {
        id: 3,
        title: "Gujarat's geography",
        category_id: 3,
        description: "To educate students and competitive aspirants about Gujarat's geography in an engaging, structured format.",
        price: 77,
        discount: 20,
        duration_minutes: 4320,  // 72 hours * 60
        expiry_days: 120,
        min_access_minutes: 90,  // already in minutes
        max_access_minutes: 180,  // already in minutes
        what_you_will_learn: ["Landforms", "rivers", "Climate", "Agricultural", "Geography"],
        skill_development: [
            {
                title: "Spatial Analysis",
                statements: ["Interpret complex maps and geospatial data.", "Understand geographic information systems (GIS) fundamentals."]
            },
            {
                title: "Environmental Impact Evaluation",
                statements: ["Assess human-environment interactions and their consequences.", "Analyze climate patterns and their geographical effects."]
            },
            {
                title: "Cultural Geography",
                statements: ["Explore the relationship between geography and cultural development.", "Understand demographic trends and migration patterns."]
            }
        ],
        prerequisites: ["Basic Map Skills"],
        hashtags: [
            "#gujratgeography",
            "#geography",
            "#gujarat",
            "#indiangeography",
            "#gujaratmap",
            "#gujaratstudy",
            "#geographyofgujarat",
            "#gujarattourism",
            "#gujarateducation",
            "#gujaratfacts",
            "#learngeography",
            "#competitiveexam",
            "#gpscexam",
            "#staticgk",
            "#gkgujarat"
        ],
        thumbnail: "/course/thumbnail/ggthumbnail.jpg",
        preview_video: "/course/preview_video/ggpreviewVideo.mp4",
        created_by_type: "admin",
        updated_by_type: "admin",
    },
];

const courseFAQs = [
    {
        course_id: 3,
        question: "Why do you want to learn Gujarat's geography?",
        created_by: 1,
        updated_by: 1,
        created_by_type: "admin",
        updated_by_type: "admin",
        options: [
            "For competitive exams (e.g., GPSC, UPSC)",
            "For academic studies",
            "For personal knowledge",
            "For teaching or guiding others"
        ]
    },
    {
        course_id: 3,
        question: "What is your current knowledge level about Gujarat's geography?",
        created_by: 1,
        updated_by: 1,
        created_by_type: "admin",
        updated_by_type: "admin",
        options: [
            "Beginner",
            "Basic school-level knowledge",
            "Intermediate understanding",
            "Expert/Teaching level"
        ]
    },
    {
        course_id: 3,
        question: "What topics interest you the most in Gujarat's geography?",
        created_by: 1,
        updated_by: 1,
        created_by_type: "admin",
        updated_by_type: "admin",
        options: [
            "Rivers, mountains, and physical features",
            "Districts and administrative divisions",
            "Cultural and tourism geography",
            "Agriculture and economy"
        ]
    },
    {
        course_id: 3,
        question: "How do you plan to use this knowledge?",
        created_by: 1,
        updated_by: 1,
        created_by_type: "admin",
        updated_by_type: "admin",
        options: [
            "Crack government exams",
            "Score well in school/college exams",
            "Use it for research or projects",
            "Just for fun and awareness"
        ]
    },
    {
        course_id: 3,
        question: "How much time can you dedicate weekly to this course?",
        created_by: 1,
        updated_by: 1,
        created_by_type: "admin",
        updated_by_type: "admin",
        options: [
            "1–3 hours",
            "4–6 hours",
            "7–10 hours",
            "More than 10 hours"
        ]
    }
];

const sessions = [
    {
        course_id: 3,
        title: "Introduction to Gujarat",
        chpater_description: "Overview of Gujarat's location, geography, history, and key facts.",
        status: "active",
        image_name: "gujarat_intro.png",
        image_path: "/course/thumbnail/ggthumbnail.jpg",
        min_time_in_minute: 30,
    },
    {
        course_id: 3,
        title: "Physical Geography of Gujarat",
        chpater_description: "Learn about Gujarat's landforms, rivers, climate, and soil types.",
        status: "active",
        image_name: "physical_geography.png",
        image_path: "/course/thumbnail/ggthumbnail.jpg",
        min_time_in_minute: 40,
    },
    {
        course_id: 3,
        title: "Agricultural Geography of Gujarat",
        chpater_description: "Explore Gujarat's major crops, irrigation methods, and farming challenges.",
        status: "active",
        image_name: "agriculture.png",
        image_path: "/course/thumbnail/ggthumbnail.jpg",
        min_time_in_minute: 35,
    },
    {
        course_id: 3,
        title: "Industrial Geography of Gujarat",
        chpater_description: "Understand Gujarat's key industries, ports, and economic zones.",
        status: "active",
        image_name: "industry.png",
        image_path: "/course/thumbnail/ggthumbnail.jpg",
        min_time_in_minute: 45,
    },
    {
        course_id: 3,
        title: "Cultural Geography of Gujarat",
        chpater_description: "Discover Gujarat's art, festivals, languages, and heritage sites.",
        status: "active",
        image_name: "culture.png",
        image_path: "/course/thumbnail/ggthumbnail.jpg",
        min_time_in_minute: 50,
    },
    {
        course_id: 3,
        title: "Environmental Geography of Gujarat",
        chpater_description: "Study Gujarat's ecosystems, wildlife, and environmental challenges.",
        status: "active",
        image_name: "environment.png",
        image_path: "/course/thumbnail/ggthumbnail.jpg",
        min_time_in_minute: 40,
    }
];

const modules = [
    {
        course_id: 3,
        session_id: 10,
        title: "Location & Geography",
        image: "/course/thumbnail/ggthumbnail.jpg",
        description: "Learn about Gujarat's geographical position, borders, and key facts.",
        duration_minutes: 30,  // 0.5 hours * 60
        status: "active",
    },
    {
        course_id: 3,
        session_id: 10,
        title: "Administrative Divisions",
        image: "/course/thumbnail/ggthumbnail.jpg",
        description: "Understand Gujarat's districts, regions, and municipal divisions.",
        duration_minutes: 30,  // 0.5 hours * 60
        status: "active",
    },
    {
        course_id: 3,
        session_id: 10,
        title: "Historical Background",
        image: "/course/thumbnail/ggthumbnail.jpg",
        description: "Explore Gujarat's formation, ancient names, and Indus Valley legacy.",
        duration_minutes: 30,  // 0.5 hours * 60
        status: "active",
    },

    {
        course_id: 3,
        session_id: 11,
        title: "Landforms & Regions",
        image: "/course/thumbnail/ggthumbnail.jpg",
        description: "Study Gujarat's diverse regions: Kutch, Saurashtra, Plains, etc.",
        duration_minutes: 45,  // 0.75 hours * 60
        status: "active",
    },
    {
        course_id: 3,
        session_id: 11,
        title: "Rivers of Gujarat",
        image: "/course/thumbnail/ggthumbnail.jpg",
        description: "Learn about Narmada, Sabarmati, Tapi, and other major rivers.",
        duration_minutes: 45,  // 0.75 hours * 60
        status: "active",
    },
    {
        course_id: 3,
        session_id: 11,
        title: "Climate & Soils",
        image: "/course/thumbnail/ggthumbnail.jpg",
        description: "Understand Gujarat's climate patterns and soil types.",
        duration_minutes: 30,  // 0.5 hours * 60
        status: "active",
    },

    {
        course_id: 3,
        session_id: 12,
        title: "Major Crops",
        image: "/course/thumbnail/ggthumbnail.jpg",
        description: "Explore food crops (wheat, bajra) and cash crops (cotton, groundnut).",
        duration_minutes: 45,  // 0.75 hours * 60
        status: "active",
    },
    {
        course_id: 3,
        session_id: 12,
        title: "Irrigation Methods",
        image: "/course/thumbnail/ggthumbnail.jpg",
        description: "Study canals, drip irrigation, and the Narmada Canal Project.",
        duration_minutes: 30,  // 0.5 hours * 60
        status: "active",
    },
    {
        course_id: 3,
        session_id: 12,
        title: "Agro-Based Industries",
        image: "/course/thumbnail/ggthumbnail.jpg",
        description: "Learn about dairy (Amul), textiles, and sugar mills.",
        duration_minutes: 30,  // 0.5 hours * 60
        status: "active",
    },

    {
        course_id: 3,
        session_id: 13,
        title: "Key Industries",
        image: "/course/thumbnail/ggthumbnail.jpg",
        description: "Textiles, diamonds, petrochemicals, and pharmaceuticals.",
        duration_minutes: 60,  // 1 hour * 60
        status: "active",
    },
    {
        course_id: 3,
        session_id: 13,
        title: "Ports & SEZs",
        image: "/course/thumbnail/ggthumbnail.jpg",
        description: "Kandla, Mundra ports and Special Economic Zones.",
        duration_minutes: 45,  // 0.75 hours * 60
        status: "active",
    },
    {
        course_id: 3,
        session_id: 13,
        title: "Industrial Challenges",
        image: "/course/thumbnail/ggthumbnail.jpg",
        description: "Pollution, water shortage, and infrastructure gaps.",
        duration_minutes: 30,  // 0.5 hours * 60
        status: "active",
    },

    {
        course_id: 3,
        session_id: 14,
        title: "Art & Handicrafts",
        image: "/course/thumbnail/ggthumbnail.jpg",
        description: "Bandhani, Patola sarees, Rogan art, and wood carving.",
        duration_minutes: 45,  // 0.75 hours * 60
        status: "active",
    },
    {
        course_id: 3,
        session_id: 14,
        title: "Festivals & Dance",
        image: "/course/thumbnail/ggthumbnail.jpg",
        description: "Navratri, Garba, Uttarayan, and Rann Utsav.",
        duration_minutes: 45,  // 0.75 hours * 60
        status: "active",
    },
    {
        course_id: 3,
        session_id: 14,
        title: "Pilgrimage Sites",
        image: "/course/thumbnail/ggthumbnail.jpg",
        description: "Somnath, Dwarka, Palitana, and Udvada.",
        duration_minutes: 30,  // 0.5 hours * 60
        status: "active",
    },

    {
        course_id: 3,
        session_id: 15,
        title: "Wildlife & Sanctuaries",
        image: "/course/thumbnail/ggthumbnail.jpg",
        description: "Gir National Park, Marine Park, and Wild Ass Sanctuary.",
        duration_minutes: 45,  // 0.75 hours * 60
        status: "active",
    },
    {
        course_id: 3,
        session_id: 15,
        title: "Environmental Challenges",
        image: "/course/thumbnail/ggthumbnail.jpg",
        description: "Industrial pollution, deforestation, and coastal erosion.",
        duration_minutes: 30,  // 0.5 hours * 60
        status: "active",
    },
    {
        course_id: 3,
        session_id: 15,
        title: "Renewable Energy",
        image: "/course/thumbnail/ggthumbnail.jpg",
        description: "Solar and wind energy projects in Kutch.",
        duration_minutes: 30,  // 0.5 hours * 60
        status: "active",
    }
];

const gujaratGeoHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Introduction to Gujarat's Geography</title>
    <style>
        .geo-guide {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #fdfdfd;
            color: #2c3e50;
            max-width: 1200px;
            margin: 0 auto;
            padding: 30px;
        }
        .geo-guide header {
            background: linear-gradient(to right, #27ae60, #2ecc71);
            color: #fff;
            padding: 25px;
            border-radius: 8px;
            text-align: center;
        }
        .geo-guide h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .geo-guide h2 {
            font-size: 1.8em;
            color: #16a085;
            border-bottom: 2px solid #1abc9c;
            padding-bottom: 6px;
            margin-top: 50px;
        }
        .geo-guide section {
            background-color: #ffffff;
            padding: 20px 25px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.08);
            margin-top: 30px;
        }
        .geo-guide ul {
            padding-left: 20px;
        }
        .geo-guide li {
            margin-bottom: 10px;
        }
        .geo-guide footer {
            text-align: center;
            margin-top: 60px;
            padding: 20px;
            font-size: 0.9em;
            color: #7f8c8d;
        }
    </style>
</head>
<body>
    <div class="geo-guide">
        <header>
            <h1>Introduction to Gujarat's Geography</h1>
            <p>Explore the diverse landscape of one of India's most vibrant states</p>
        </header>

        <section>
            <h2>Overview of Gujarat</h2>
            <p>Gujarat is a western state of India known for its rich cultural heritage, industrial strength, and diverse landscapes. It shares its borders with Rajasthan, Maharashtra, Madhya Pradesh, and the Arabian Sea. The capital of Gujarat is Gandhinagar, while Ahmedabad is its largest city and commercial hub.</p>
        </section>

        <section>
            <h2>Geographical Features</h2>
            <ul>
                <li><strong>Coastline:</strong> Gujarat has the longest coastline in India, spanning over 1,600 km.</li>
                <li><strong>Rann of Kutch:</strong> A unique salt marsh that becomes a white desert during the dry season and floods during monsoon.</li>
                <li><strong>Saurashtra and Kutch:</strong> Distinct regions with rugged terrain, hills, and grasslands.</li>
                <li><strong>Rivers:</strong> Major rivers like Narmada, Tapi, Mahi, and Sabarmati flow through the state.</li>
                <li><strong>Forests and Wildlife:</strong> Home to Gir National Park, the last abode of Asiatic lions.</li>
            </ul>
        </section>

        <section>
            <h2>Climate and Soil Types</h2>
            <p>The climate of Gujarat ranges from arid and semi-arid in the north to humid in the coastal areas. The state has black soil in the Deccan Trap region, alluvial soil in river basins, and saline soil in the Rann of Kutch.</p>
        </section>

        <section>
            <h2>Economic Geography</h2>
            <ul>
                <li>Major agricultural crops: Cotton, groundnut, millet, sugarcane, and wheat.</li>
                <li>Leading industrial areas: Ahmedabad, Vadodara, Surat, Rajkot, and Jamnagar.</li>
                <li>Ports: Kandla and Mundra are among India's busiest ports.</li>
                <li>Salt production: Gujarat is the largest salt producer in India.</li>
            </ul>
        </section>

        <section>
            <h2>Why Study Gujarat's Geography?</h2>
            <p>Understanding Gujarat's geography helps in learning about its agriculture, industry, transportation, natural resources, and environmental challenges. It also aids in preparing for competitive exams and developing regional planning strategies.</p>
        </section>

        <section>
            <h2>Conclusion</h2>
            <p>Gujarat's geography is a blend of natural beauty, cultural richness, and economic dynamism. Studying its landforms, climate, and development patterns gives valuable insights into the state's role in India's growth story.</p>
        </section>

        <footer>
            &copy; 2025 Gujarat Studies Portal | Designed for curious minds of HNGU and beyond.
        </footer>
    </div>
</body>
</html>
`;

const basicTopics = [
    //1: Location and Geographical Position
    {
        module_id: 14,
        title: "Gujarat Location Overview - Video",
        description: "Explore Gujarat's location and borders in a detailed video.",
        content_type: "video",
        video: {
            url: "/video/gujarat_overview_3.mp4",
            duration_minutes: 8,
            transcript: "Gujarat is located in western India, sharing borders with Rajasthan, MP, Maharashtra, and the Arabian Sea...",
            audio_url: "/audios/video/gujarat_location_audio.mp3",
            bullet_points: [
                { time: 0, text: "Introduction" },
                { time: 90, text: "Borders with states" },
                { time: 180, text: "International border with Pakistan" },
                { time: 300, text: "Latitude and Longitude" },
            ],
        },
    },
    {
        module_id: 14,
        title: "Gujarat Location - Audio Summary",
        description: "Brief audio summary of Gujarat's geographical position.",
        content_type: "audio",
        audio: {
            url: "/audio/gujarat_location_summary.mp3",
            duration_minutes: 4,
        },
    },
    {
        module_id: 14,
        title: "Gujarat Location Facts - Accordion",
        description: "Key facts about Gujarat's location in accordion format.",
        content_type: "accordian",
        accordions: [
            {
                title: "Borders",
                body: "Gujarat shares borders with Rajasthan, Madhya Pradesh, Maharashtra, and Pakistan.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/gujarat_borders.mp3",
            },
            {
                title: "Latitude and Longitude",
                body: "Latitude ranges from ~20°N to 24.5°N, Longitude from ~68°E to 74.5°E.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/gujarat_latlong.mp3",
            },
        ],
    },

    //2: Area and Population
    {
        module_id: 15,
        title: "Area and Population - Multi-Slide Content",
        description: "Explore Gujarat's area, population, and demographics through slides.",
        content_type: "slide",
        slides: [
            // {
            //     title: "Area Details",
            //     description: "Gujarat covers about 196,000 sq km, the 6th largest state in India.",
            //     content_type: "general",
            //     audio_url: "/audios/slide_general/area_audio.mp3",
            //     general: {
            //         title: "Area",
            //         description: "About 196,000 square kilometers.",
            //         url: "/material/image/gujarat_area.jpg",
            //         audio_url: "/audios/slide_general/area_audio.mp3",
            //         material_type: "image",
            //     },
            // },
            {
                title: "Population Stats",
                description: "Population is around 6.04 crore as per 2011 census.",
                content_type: "video",
                video: {
                    url: "/video/gujarat_location.mp4",
                    duration_minutes: 6,
                    audio_url: "/audios/slide_video/population_audio.mp3",
                },
            },
            // {
            //     title: "Population Density",
            //     description: "Density is about 308 people per sq km.",
            //     content_type: "audio",
            //     audio: {
            //         url: "/audio/population_density_audio.mp3",
            //         duration_minutes: 3,
            //     },
            // },
        ],
    },
    {
        module_id: 15,
        title: "Population Data Cheat Sheet",
        description: "Quick reference PDF for Gujarat's population data.",
        content_type: "general",
        general: {
            title: "Population Cheat Sheet",
            description: "A PDF summarizing key population statistics.",
            url: "/material/pdf/population_cheatsheet.pdf",
            audio_url: "/audios/general/population_cheatsheet_audio.mp3",
            material_type: "pdf",
        },
    },

    //3: Administrative Divisions & Historical Background
    {
        module_id: 16,
        title: "Administrative Divisions - Video",
        description: "Learn about Gujarat's districts, talukas, and regions via video.",
        content_type: "video",
        video: {
            url: "/video/gujrat_overview_2.mp4",
            duration_minutes: 7,
            transcript: "Gujarat consists of 33 districts, 250+ talukas and 6 major regions...",
            audio_url: "/audios/video/admin_divisions_audio.mp3",
            bullet_points: [
                { time: 0, text: "Introduction" },
                { time: 120, text: "Districts and Talukas" },
                { time: 240, text: "Major Regions" },
            ],
        },
    },
    {
        module_id: 16,
        title: "Historical Background - Accordion",
        description: "Explore Gujarat's rich historical legacy through accordions.",
        content_type: "accordian",
        accordions: [
            {
                title: "State Formation",
                body: "Gujarat was formed on 1 May 1960, separated from Bombay State.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/state_formation_audio.mp3",
            },
            {
                title: "Ancient Names and Legacy",
                body: "Known as Anarta, Lata, Saurashtra; rich in Indus Valley Civilization sites.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/ancient_names_audio.mp3",
            },
        ],
    },
    {
        module_id: 16,
        title: "Administrative Divisions - Audio Summary",
        description: "Brief audio on Gujarat's administrative setup.",
        content_type: "audio",
        audio: {
            url: "/audio/admin_divisions_summary.mp3",
            duration_minutes: 5,
        },
    },
    //4: Landforms & Regions
    {
        module_id: 17,
        title: "Gujarat's Diverse Regions - Video Overview",
        description: "Explore Kutch, Saurashtra, and other regions through this detailed video.",
        content_type: "video",
        video: {
            url: "/video/gujrat_overview.mp4",
            duration_minutes: 9,
            transcript: "Gujarat consists of five major regions - Kutch, Saurashtra, North Gujarat Plains...",
            audio_url: "/audios/video/regions_audio.mp3",
            bullet_points: [
                { time: 0, text: "Introduction to Gujarat's geography" },
                { time: 120, text: "Kutch Region features" },
                { time: 240, text: "Saurashtra Plateau" },
                { time: 360, text: "Central & South Gujarat" }
            ]
        }
    },
    {
        module_id: 17,
        title: "Landforms Cheat Sheet",
        description: "Quick reference PDF for Gujarat's major landforms.",
        content_type: "general",
        general: {
            title: "Landforms PDF",
            description: "Summary of Gujarat's physical regions",
            url: "/material/image/landforms_cheatsheet.jpg",
            audio_url: "/audios/general/landforms_audio.mp3",
            material_type: "image"
        }
    },
    {
        module_id: 17,
        title: "Regional Comparison - Accordion",
        description: "Compare Gujarat's regions through expandable sections.",
        content_type: "accordian",
        accordions: [
            {
                title: "Kutch vs Saurashtra",
                body: "Kutch is arid with salt deserts while Saurashtra has fertile black soil.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/region_comparison.mp3"
            },
            {
                title: "Plains Features",
                body: "North Gujarat plains are semi-arid while South Gujarat has fertile alluvial soil.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/plains_features.mp3"
            }
        ]
    },

    //5: Rivers of Gujarat
    {
        module_id: 18,
        title: "Major Rivers - Multi-Slide Content",
        description: "Learn about Narmada, Sabarmati, Tapi and other rivers through slides.",
        content_type: "slide",
        slides: [
            {
                title: "Narmada River",
                description: "Lifeline of Gujarat, originating from Amarkantak.",
                content_type: "video",
                video: {
                    url: "/video/narmada_video.mp4",
                    duration_minutes: 5,
                    audio_url: "/audios/slide_video/narmada_audio.mp3"
                }
            },
            // {
            //     title: "Sabarmati River",
            //     description: "Flows through Ahmedabad, originates in Rajasthan.",
            //     content_type: "general",
            //     audio_url: "/audios/slide_general/sabarmati_audio.mp3",
            //     general: {
            //         title: "Sabarmati Details",
            //         description: "Historical and economic importance",
            //         url: "/material/pdf/sabarmati_river.pdf",
            //         audio_url: "/audios/slide_general/sabarmati_audio.mp3",
            //         material_type: "pdf"
            //     }
            // },
            // {
            //     title: "Seasonal Rivers",
            //     description: "Overview of Banas, Daman Ganga and other seasonal rivers.",
            //     content_type: "audio",
            //     audio: {
            //         url: "/audio/seasonal_rivers.mp3",
            //         duration_minutes: 4
            //     }
            // }
        ]
    },
    {
        module_id: 18,
        title: "River Basin Map",
        description: "Map of Gujarat's river systems.",
        content_type: "general",
        general: {
            title: "River Map",
            description: "Visual guide to Gujarat's waterways",
            url: "/material/image/river_basins.webp",
            audio_url: "/audios/general/river_map_audio.mp3",
            material_type: "image"
        }
    },

    //6: Climate & Soils
    {
        module_id: 19,
        title: "Climate Patterns",
        description: "Understand Gujarat's tropical monsoon climate through PDF.",
        content_type: "general",
        general: {
            title: "Climate Patterns",
            description: "Gujarat experiences three main seasons - summer, monsoon and winter",
            url: "/material/pdf/climate_change.pdf",
            audio_url: "/audios/slide_accordion/groundnut_audio.mp3",
            material_type: "pdf"
        }
    },
    {
        module_id: 19,
        title: "Soil Types - Audio Guide",
        description: "Audio summary of Gujarat's major soil types.",
        content_type: "audio",
        audio: {
            url: "/audio/soil_types.mp3",
            duration_minutes: 6
        }
    },

    //7: Major Crops
    {
        module_id: 20,
        title: "Agriculture in Gujarat - Multi-Slide",
        description: "Comprehensive overview through multiple content slides.",
        content_type: "slide",
        slides: [
            {
                title: "Food Crops",
                description: "Wheat, bajra, rice and other staple crops.",
                content_type: "video",
                video: {
                    url: "/video/food_crops.mp4",
                    duration_minutes: 6,
                    audio_url: "/audios/slide_video/crops_audio.mp3"
                }
            },
            {
                title: "Cash Crops",
                description: "Cotton, groundnut, tobacco and their economic importance.",
                content_type: "accordian",
                audio_url: "/audios/slide_accordion/cotton_audio.mp3",
                accordions: [
                    {
                        title: "Cotton Belt",
                        body: "Saurashtra region accounts for majority of Gujarat's cotton production.",
                        audio_url: "/audios/slide_accordion/cotton_audio.mp3"
                    },
                    {
                        title: "Groundnut Cultivation",
                        body: "Kutch and Saurashtra are major groundnut growing areas.",
                        audio_url: "/audios/slide_accordion/groundnut_audio.mp3"
                    }
                ]
            },
            // {
            //     title: "Cropping Seasons",
            //     description: "Kharif, Rabi and Zaid seasons explained.",
            //     content_type: "audio",
            //     audio: {
            //         url: "/audio/cropping_seasons.mp3",
            //         duration_minutes: 5
            //     }
            // }
        ]
    },
    {
        module_id: 20,
        title: "Crop Calendar",
        description: "Visual guide to planting and harvesting seasons.",
        content_type: "general",
        general: {
            title: "Crop Calendar",
            description: "Monthly guide to agricultural activities",
            url: "/material/pdf/crop_calendar.pdf",
            audio_url: "/audios/general/calendar_audio.mp3",
            material_type: "pdf"
        }
    },

    //8: Irrigation Methods
    {
        module_id: 21,
        title: "Narmada Canal Project - Video",
        description: "How the canal network transformed Gujarat's agriculture.",
        content_type: "video",
        video: {
            url: "/video/narmada_canal.mp4",
            duration_minutes: 8,
            transcript: "The Sardar Sarovar Dam and its canal network brought water to arid regions...",
            audio_url: "/audios/video/canal_audio.mp3",
            bullet_points: [
                { time: 0, text: "Project overview" },
                { time: 120, text: "Canal network map" },
                { time: 240, text: "Impact on agriculture" }
            ]
        }
    },
    {
        module_id: 21,
        title: "Traditional vs Modern Methods",
        description: "Comparison of irrigation techniques.",
        content_type: "accordian",
        accordions: [
            {
                title: "Traditional Wells",
                body: "Still used in many parts, but groundwater levels are falling.",
                audio_url: "/audios/accordion/traditional_irrigation.mp3"
            },
            {
                title: "Drip Irrigation",
                body: "Increasingly popular in water-scarce regions like Kutch.",
                audio_url: "/audios/accordion/drip_irrigation.mp3"
            }
        ]
    },

    //9: Agro-Based Industries
    {
        module_id: 22,
        title: "Amul Success Story - Video",
        description: "Case study of Gujarat's dairy cooperative model.",
        content_type: "video",
        video: {
            url: "/video/amul_story.mp4",
            duration_minutes: 10,
            transcript: "The Amul cooperative started in Anand and revolutionized India's dairy industry...",
            audio_url: "/audios/video/amul_audio.mp3",
            bullet_points: [
                { time: 0, text: "Origins in Anand" },
                { time: 180, text: "Cooperative model" },
                { time: 360, text: "Impact on rural economy" }
            ]
        }
    },
    {
        module_id: 22,
        title: "Agro-Industries Map",
        description: "Geographical distribution of food processing units.",
        content_type: "general",
        general: {
            title: "Industry Map",
            description: "Location of major agro-industries",
            url: "/material/image/agro_industries.png",
            audio_url: "/audios/general/industry_map_audio.mp3",
            material_type: "image"
        }
    },
    {
        module_id: 22,
        course_id: 3,
        session_id: 12,
        title: "Textile Industry Overview",
        description: "Audio summary of cotton and synthetic textile production.",
        content_type: "audio",
        audio: {
            url: "/audio/textile_industry.mp3",
            duration_minutes: 7
        }
    },

    //10: Key Industries
    {
        module_id: 23,
        title: "Industrial Gujarat - Multi-Slide",
        description: "Comprehensive industrial overview through slides.",
        content_type: "slide",
        slides: [
            {
                title: "Diamond Industry",
                description: "Surat's global dominance in diamond cutting.",
                content_type: "video",
                video: {
                    url: "/video/diamond_industry.mp4",
                    duration_minutes: 6,
                    audio_url: "/audios/slide_video/diamonds_audio.mp3"
                }
            },
            // {
            //     title: "Petrochemical Hub",
            //     description: "Jamnagar, Vadodara and Dahej's refining capacity.",
            //     content_type: "general",
            //     audio_url: "/audios/slide_general/petro_audio.mp3",
            //     general: {
            //         title: "Petrochemical Report",
            //         description: "Statistics and growth projections",
            //         url: "/material/image/petrochemical_report.gif",
            //         audio_url: "/audios/slide_general/petro_audio.mp3",
            //         material_type: "image"
            //     }
            // },
            {
                title: "Pharmaceutical Sector",
                description: "Gujarat's role in generic drug production.",
                content_type: "accordian",
                audio_url: "/audios/slide_accordion/pharma_audio.mp3",
                accordions: [
                    {
                        title: "Major Pharma Clusters",
                        body: "Ankleshwar, Vapi and Ahmedabad account for bulk production.",
                        audio_url: "/audios/slide_accordion/pharma_audio.mp3"
                    }
                ]
            }
        ]
    },
    {
        module_id: 23,
        title: "Industrial Policy Summary",
        description: "Key government initiatives for industrial growth.",
        content_type: "accordian",
        accordions: [
            {
                title: "Vibrant Gujarat Summit",
                body: "Biennial event attracting global investors since 2003.",
                audio_url: "/audios/accordion/vibrant_gujarat.mp3"
            },
            {
                title: "Ease of Doing Business",
                body: "Single-window clearance and other reforms.",
                audio_url: "/audios/accordion/business_reforms.mp3"
            }
        ]
    },

    //11: Ports & SEZs
    {
        module_id: 24,
        title: "Gujarat's Ports - Video Tour",
        description: "Aerial views and operations of major ports.",
        content_type: "video",
        video: {
            url: "/video/gujarat_ports.mp4",
            duration_minutes: 8,
            transcript: "Gujarat's 1600km coastline hosts India's largest ports including Kandla and Mundra...",
            audio_url: "/audios/video/ports_audio.mp3",
            bullet_points: [
                { time: 0, text: "Port infrastructure" },
                { time: 120, text: "Cargo handling" },
                { time: 240, text: "Economic impact" }
            ]
        }
    },
    {
        module_id: 24,
        title: "SEZ Benefits - Audio Explanation",
        description: "How Special Economic Zones boost investment.",
        content_type: "audio",
        audio: {
            url: "/audio/sez_benefits.mp3",
            duration_minutes: 5
        }
    },

    //12: Industrial Challenges
    {
        module_id: 25,
        title: "Pollution Issues - Case Studies",
        description: "Environmental challenges in industrial zones.",
        content_type: "accordian",
        accordions: [
            {
                title: "Vapi's Pollution Legacy",
                body: "Once among world's most polluted places, now improving.",
                audio_url: "/audios/accordion/vapi_pollution.mp3"
            },
            {
                title: "Water Scarcity",
                body: "Industrial demand vs agricultural needs in water-stressed regions.",
                audio_url: "/audios/accordion/water_scarcity.mp3"
            }
        ]
    },
    {
        module_id: 25,
        title: "Sustainable Solutions",
        description: "How industries are addressing environmental concerns.",
        content_type: "general",
        general: {
            title: "Sustainability Report",
            description: "Case studies of green initiatives",
            url: "/material/pdf/sustainability.pdf",
            audio_url: "/audios/general/sustainability_audio.mp3",
            material_type: "pdf"
        }
    },

    //13: Art & Handicrafts
    {
        module_id: 26,
        title: "Traditional Crafts - Video Showcase",
        description: "Artisans creating Patola, Bandhani and Rogan art.",
        content_type: "video",
        video: {
            url: "/video/gujarat_crafts.mp4",
            duration_minutes: 9,
            transcript: "Gujarat's handicrafts reflect centuries-old traditions passed through generations...",
            audio_url: "/audios/video/crafts_audio.mp3",
            bullet_points: [
                { time: 0, text: "Patola weaving" },
                { time: 120, text: "Bandhani process" },
                { time: 240, text: "Rogan painting" },
                { time: 360, text: "Wood carving" }
            ]
        }
    },
    {
        module_id: 26,
        title: "Craft Clusters Map",
        description: "Geographical distribution of traditional arts.",
        content_type: "general",
        general: {
            title: "Crafts Map",
            description: "Locations of major handicraft centers",
            url: "/material/image/craft_clusters.jpg",
            audio_url: "/audios/general/crafts_map_audio.mp3",
            material_type: "image"
        }
    },
    {
        module_id: 26,
        title: "Craft Techniques - Accordion",
        description: "Detailed methods behind each art form.",
        content_type: "accordian",
        accordions: [
            {
                title: "Patola Weaving",
                body: "Complex double-ikat technique taking months per saree.",
                audio_url: "/audios/accordion/patola_weaving.mp3"
            },
            {
                title: "Rogan Art",
                body: "Castor oil-based paint applied with metal stylus.",
                audio_url: "/audios/accordion/rogan_art.mp3"
            }
        ]
    },

    //14: Festivals & Dance
    {
        module_id: 27,
        title: "Navratri Celebrations - Video",
        description: "Nine nights of Garba and Dandiya across Gujarat.",
        content_type: "video",
        video: {
            url: "/video/navratri.mp4",
            duration_minutes: 7,
            transcript: "Navratri transforms Gujarat into a vibrant celebration of dance and devotion...",
            audio_url: "/audios/video/navratri_audio.mp3",
            bullet_points: [
                { time: 0, text: "Religious significance" },
                { time: 90, text: "Garba styles" },
                { time: 180, text: "Dandiya raas" }
            ]
        }
    },
    {
        module_id: 27,
        title: "Festival Calendar",
        description: "Annual cycle of Gujarat's cultural events.",
        content_type: "general",
        general: {
            title: "Festival Guide",
            description: "Month-by-month festival schedule",
            url: "/material/pdf/festival_calendar.pdf",
            audio_url: "/audios/general/festival_audio.mp3",
            material_type: "pdf"
        }
    },

    {
        module_id: 28,
        title: "Sacred Gujarat - Multi-Slide",
        description: "Spiritual journey through important religious sites.",
        content_type: "slide",
        slides: [
            {
                title: "Somnath Temple",
                description: "One of twelve Jyotirlingas, rebuilt seven times.",
                content_type: "video",
                video: {
                    url: "/video/somnath_temple.mp4",
                    duration_minutes: 5,
                    audio_url: "/audios/slide_video/somnath_audio.mp3"
                }
            },
            // {
            //     title: "Dwarka",
            //     description: "Lord Krishna's legendary kingdom.",
            //     content_type: "audio",
            //     audio: {
            //         url: "/audio/dwarka_history.mp3",
            //         duration_minutes: 4
            //     }
            // },
            {
                title: "Jain Pilgrimages",
                description: "Palitana and Girnar's sacred mountains.",
                content_type: "accordian",
                audio_url: "/audios/slide_accordion/jain_temples.mp3",
                accordions: [
                    {
                        title: "Shatrunjaya",
                        body: "Palitana's hill with 863 marble temples.",
                        audio_url: "/audios/slide_accordion/jain_temples.mp3"
                    }
                ]
            }
        ]
    },

    {
        module_id: 29,
        title: "Asiatic Lions - Video Documentary",
        description: "Gir National Park's conservation success story.",
        content_type: "video",
        video: {
            url: "/video/asiatic_lions.mp4",
            duration_minutes: 10,
            transcript: "The last wild population of Asiatic lions thrives in Gujarat's Gir forest...",
            audio_url: "/audios/video/lions_audio.mp3",
            bullet_points: [
                { time: 0, text: "Population recovery" },
                { time: 120, text: "Conservation methods" },
                { time: 240, text: "Community involvement" }
            ]
        }
    },
    {
        module_id: 29,
        title: "Sanctuaries Guide",
        description: "Covering all protected areas.",
        content_type: "general",
        general: {
            title: "Wildlife Guide",
            description: "Details on Gujarat's sanctuaries and parks",
            url: "/material/image/wildlife_guide.webp",
            audio_url: "/audios/general/wildlife_audio.mp3",
            material_type: "image"
        }
    },
    {
        module_id: 29,
        title: "Biodiversity - Accordion",
        description: "Key species found in different ecosystems.",
        content_type: "accordian",
        accordions: [
            {
                title: "Gir's Big Cats",
                body: "Lions, leopards and other predators.",
                audio_url: "/audios/accordion/gir_wildlife.mp3"
            },
            {
                title: "Marine Life",
                body: "Coral reefs and sea turtles of Gulf of Kutch.",
                audio_url: "/audios/accordion/marine_life.mp3"
            }
        ]
    },

    {
        module_id: 30,
        title: "Pollution Issues - Multi-Slide",
        description: "Industrial and urban environmental challenges.",
        content_type: "slide",
        slides: [
            {
                title: "Air Pollution",
                description: "Industrial emissions and urban air quality.",
                content_type: "video",
                video: {
                    url: "/video/air_pollution.mp4",
                    duration_minutes: 6,
                    audio_url: "/audios/slide_video/pollution_audio.mp3"
                }
            },
            // {
            //     title: "Water Pollution",
            //     description: "Industrial effluent and river contamination.",
            //     content_type: "general",
            //     audio_url: "/audios/slide_general/water_report.mp3",
            //     general: {
            //         title: "Water Quality Report",
            //         description: "Findings from major river studies",
            //         url: "/material/pdf/water_quality.pdf",
            //         audio_url: "/audios/slide_general/water_report.mp3",
            //         material_type: "pdf"
            //     }
            // }
        ]
    },
    {
        module_id: 30,
        title: "Climate Change Impact",
        description: "Audio discussion on regional climate effects.",
        content_type: "audio",
        audio: {
            url: "/audio/climate_impact.mp3",
            duration_minutes: 7
        }
    },

    {
        module_id: 31,
        title: "Solar Gujarat - Video Report",
        description: "How Gujarat became a solar energy leader.",
        content_type: "video",
        video: {
            url: "/video/solar_gujarat.mp4",
            duration_minutes: 8,
            transcript: "Gujarat's solar parks in Charanka and other regions contribute significantly...",
            audio_url: "/audios/video/solar_audio.mp3",
            bullet_points: [
                { time: 0, text: "Solar park concept" },
                { time: 120, text: "Installed capacity" },
                { time: 240, text: "Future projects" }
            ]
        }
    },
    {
        module_id: 31,
        title: "Wind Energy - Audio Summary",
        description: "Kutch's wind farms and their output.",
        content_type: "audio",
        audio: {
            url: "/audio/wind_energy.mp3",
            duration_minutes: 5
        }
    },
    {
        module_id: 31,
        title: "Renewable Projects Map",
        description: "Map of solar and wind installations.",
        content_type: "general",
        general: {
            title: "Energy Map",
            description: "Locations of major renewable projects",
            url: "/material/image/renewable_energy.png",
            audio_url: "/audios/general/energy_map_audio.mp3",
            material_type: "image"
        }
    }
];

const assignments = [
    {
        module_id: 14,
        title: "Border Matching",
        description: "Match Gujarat's neighboring states/countries with their directions",
        file: null,
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        max_score: 50,
        status: "active",
        category: "matching",
        created_by_type: "admin",
        updated_by_type: "admin",
        matching_questions: [
            {
                question_text: "Match the borders with their directions",
                options: [
                    { option_text: "North", option_type: "text", match_text: "Rajasthan", match_type: "text" },
                    { option_text: "East", option_type: "text", match_text: "Madhya Pradesh", match_type: "text" },
                    { option_text: "South", option_type: "text", match_text: "Maharashtra", match_type: "text" },
                    { option_text: "West", option_type: "text", match_text: "Arabian Sea", match_type: "text" }
                ]
            }
        ]
    },
    {
        module_id: 14,
        title: "Geography True/False",
        description: "Test your knowledge of Gujarat's geography",
        file: null,
        due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        max_score: 30,
        status: "active",
        category: "true_false",
        created_by_type: "admin",
        updated_by_type: "admin",
        true_false_questions: [
            { question_text: "Gujarat has the longest coastline in India", correct_answer: true },
            { question_text: "Gujarat shares a border with Nepal", correct_answer: false }
        ]
    },

    {
        module_id: 15,
        title: "Districts Assignment",
        description: "Analyze Gujarat's population",
        file: "/assignments/file/population_cheatsheet.pdf",
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        max_score: 100,
        status: "active",
        category: "regular",
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        module_id: 15,
        title: "Region Matching",
        description: "Match regions with their characteristics",
        file: null,
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        max_score: 50,
        status: "active",
        category: "matching",
        created_by_type: "admin",
        updated_by_type: "admin",
        matching_questions: [
            {
                question_text: "Match the regions with their characteristics",
                options: [
                    { option_text: "Kutch", option_type: "text", match_text: "Largest district", match_type: "text" },
                    { option_text: "Saurashtra", option_type: "text", match_text: "Peninsula region", match_type: "text" },
                    { option_text: "South Gujarat", option_type: "text", match_text: "Most industrialized", match_type: "text" }
                ]
            }
        ]
    },

    {
        module_id: 16,
        title: "Historical Events Quiz",
        description: "Test your knowledge of Gujarat's history",
        file: null,
        due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        max_score: 50,
        status: "active",
        category: "fill_in_the_blanks",
        created_by_type: "admin",
        updated_by_type: "admin",
        fill_blank_questions: [
            { question_text: "Gujarat was formed as a separate state on _____", answers: ["1st May 1960"] },
            { question_text: "The ancient name of Gujarat was _____", answers: ["Gurjaratra"] }
        ]
    },

    {
        module_id: 17,
        title: "Region Characteristics",
        description: "Write about key features of Gujarat's regions",
        file: null,
        due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        max_score: 50,
        status: "active",
        category: "paragraph_writing",
        created_by_type: "admin",
        updated_by_type: "admin",
        paragraph_questions: [
            { paragraph: "Compare and contrast the geographical features of Kutch and Saurashtra" }
        ]
    },

    {
        module_id: 18,
        title: "River Matching",
        description: "Match rivers with their characteristics",
        file: null,
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        max_score: 50,
        status: "active",
        category: "matching",
        created_by_type: "admin",
        updated_by_type: "admin",
        matching_questions: [
            {
                question_text: "Match the rivers with their features",
                options: [
                    { option_text: "Narmada", option_type: "text", match_text: "Largest west-flowing river", match_type: "text" },
                    { option_text: "Sabarmati", option_type: "text", match_text: "Flows through Ahmedabad", match_type: "text" }
                ]
            }
        ]
    },

    {
        module_id: 19,
        title: "Climate True/False",
        description: "Test your knowledge of Gujarat's climate",
        file: null,
        due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        max_score: 30,
        status: "active",
        category: "true_false",
        created_by_type: "admin",
        updated_by_type: "admin",
        true_false_questions: [
            { question_text: "Kutch receives the highest rainfall in Gujarat", correct_answer: false },
            { question_text: "Gujarat experiences three main seasons", correct_answer: true }
        ]
    },

    {
        module_id: 20,
        title: "Crop Matching",
        description: "Match crops with their growing regions",
        file: null,
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        max_score: 50,
        status: "active",
        category: "matching",
        created_by_type: "admin",
        updated_by_type: "admin",
        matching_questions: [
            {
                question_text: "Match the crops with their regions",
                options: [
                    { option_text: "Cotton", option_type: "text", match_text: "Saurashtra", match_type: "text" },
                    { option_text: "Groundnut", option_type: "text", match_text: "North Gujarat", match_type: "text" }
                ]
            }
        ]
    },

    {
        module_id: 21,
        title: "Irrigation Essay",
        description: "Write about the Narmada Canal Project",
        file: null,
        due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        max_score: 50,
        status: "active",
        category: "paragraph_writing",
        created_by_type: "admin",
        updated_by_type: "admin",
        paragraph_questions: [
            { paragraph: "Explain the significance of the Narmada Canal Project for Gujarat's agriculture" }
        ]
    },

    {
        module_id: 22,
        title: "Agro-Industries Assignment",
        description: "Research Gujarat's Crop Calender",
        file: "/assignments/file/crop_calendar.pdf",
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        max_score: 100,
        status: "active",
        category: "regular",
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        module_id: 22,
        title: "Industry Matching",
        description: "Match industries with their products",
        file: null,
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        max_score: 50,
        status: "active",
        category: "matching",
        created_by_type: "admin",
        updated_by_type: "admin",
        matching_questions: [
            {
                question_text: "Match the industries with their products",
                options: [
                    { option_text: "Dairy", option_type: "text", match_text: "Milk products", match_type: "text" },
                    { option_text: "Textiles", option_type: "text", match_text: "Cotton fabrics", match_type: "text" }
                ]
            }
        ]
    },

    {
        module_id: 23,
        title: "Industry Quiz",
        description: "Test your knowledge of Gujarat's industries",
        file: null,
        due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        max_score: 50,
        status: "active",
        category: "true_false",
        created_by_type: "admin",
        updated_by_type: "admin",
        true_false_questions: [
            { question_text: "Surat is known as the diamond capital of India", correct_answer: true },
            { question_text: "Vadodara is a major center for petrochemicals", correct_answer: true }
        ]
    },

    {
        module_id: 24,
        title: "Port Matching",
        description: "Match ports with their features",
        file: null,
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        max_score: 50,
        status: "active",
        category: "matching",
        created_by_type: "admin",
        updated_by_type: "admin",
        matching_questions: [
            {
                question_text: "Match the ports with their characteristics",
                options: [
                    { option_text: "Kandla", option_type: "text", match_text: "Major cargo port", match_type: "text" },
                    { option_text: "Mundra", option_type: "text", match_text: "Private port", match_type: "text" }
                ]
            }
        ]
    },

    {
        module_id: 25,
        title: "Solutions Essay",
        description: "Propose solutions to industrial challenges",
        file: null,
        due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        max_score: 50,
        status: "active",
        category: "paragraph_writing",
        created_by_type: "admin",
        updated_by_type: "admin",
        paragraph_questions: [
            { paragraph: "Suggest measures to address water shortage issues in Gujarat's industries" }
        ]
    },

    {
        module_id: 26,
        title: "Art Matching",
        description: "Match handicrafts with their places of origin",
        file: null,
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        max_score: 50,
        status: "active",
        category: "matching",
        created_by_type: "admin",
        updated_by_type: "admin",
        matching_questions: [
            {
                question_text: "Match the handicrafts with their origins",
                options: [
                    { option_text: "Bandhani", option_type: "text", match_text: "Kutch", match_type: "text" },
                    { option_text: "Patola", option_type: "text", match_text: "Patan", match_type: "text" }
                ]
            }
        ]
    },

    {
        module_id: 27,
        title: "Festival Matching",
        description: "Match festivals with their descriptions",
        file: null,
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        max_score: 50,
        status: "active",
        category: "matching",
        created_by_type: "admin",
        updated_by_type: "admin",
        matching_questions: [
            {
                question_text: "Match the festivals with their features",
                options: [
                    { option_text: "Navratri", option_type: "text", match_text: "Nine nights of dance", match_type: "text" },
                    { option_text: "Uttarayan", option_type: "text", match_text: "Kite flying festival", match_type: "text" }
                ]
            }
        ]
    },

    {
        module_id: 28,
        title: "Temple Quiz",
        description: "Test your knowledge of Gujarat's pilgrimage sites",
        file: null,
        due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        max_score: 50,
        status: "active",
        category: "fill_in_the_blanks",
        created_by_type: "admin",
        updated_by_type: "admin",
        fill_blank_questions: [
            { question_text: "The famous Somnath Temple is located in _____ district", answers: ["Gir Somnath"] },
            { question_text: "Dwarka is associated with Lord _____", answers: ["Krishna"] }
        ]
    },

    {
        module_id: 29,
        title: "Sanctuary Matching",
        description: "Match sanctuaries with their key species",
        file: null,
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        max_score: 50,
        status: "active",
        category: "matching",
        created_by_type: "admin",
        updated_by_type: "admin",
        matching_questions: [
            {
                question_text: "Match the sanctuaries with their wildlife",
                options: [
                    { option_text: "Gir National Park", option_type: "text", match_text: "Asiatic Lion", match_type: "text" },
                    { option_text: "Wild Ass Sanctuary", option_type: "text", match_text: "Indian Wild Ass", match_type: "text" }
                ]
            }
        ]
    },

    {
        module_id: 30,
        title: "Environment Assignment",
        description: "Analyze environmental issues in Gujarat",
        file: "/assignments/file/population_cheatsheet.pdf",
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        max_score: 100,
        status: "active",
        category: "regular",
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        module_id: 30,
        title: "Solutions Essay",
        description: "Propose environmental solutions",
        file: null,
        due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        max_score: 50,
        status: "active",
        category: "paragraph_writing",
        created_by_type: "admin",
        updated_by_type: "admin",
        paragraph_questions: [
            { paragraph: "Suggest measures to address industrial pollution in Gujarat" }
        ]
    },

    {
        module_id: 31,
        title: "Energy Assignment",
        description: "Research renewable energy in Gujarat",
        file: "/assignments/file/sustainability.pdf",
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        max_score: 100,
        status: "active",
        category: "regular",
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        module_id: 31,
        title: "Energy Quiz",
        description: "Test your knowledge of renewable energy",
        file: null,
        due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        max_score: 50,
        status: "active",
        category: "true_false",
        created_by_type: "admin",
        updated_by_type: "admin",
        true_false_questions: [
            { question_text: "Gujarat is a leader in solar energy production", correct_answer: true },
            { question_text: "Kutch has major wind energy projects", correct_answer: true }
        ]
    }
];

const quizzes = [
    {
        module_id: 14,
        title: "Gujarat Location Basics Quiz",
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
        module_id: 15,
        title: "Gujarat Admin Divisions Quiz",
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
        module_id: 16,
        title: "Gujarat History Quiz",
        duration_minutes: 12,
        passing_score: 55,
        max_attempts: 3,
        attempts_gap: 12,
        quizType: "normal",
        status: "active",
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        module_id: 17,
        title: "Landforms of Gujarat Quiz",
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
        module_id: 18,
        title: "Rivers of Gujarat Quiz",
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
        module_id: 19,
        title: "Climate & Soils Quiz",
        duration_minutes: 10,
        passing_score: 50,
        max_attempts: 2,
        attempts_gap: 24,
        quizType: "normal",
        status: "active",
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        module_id: 20,
        title: "Gujarat Crops Quiz",
        duration_minutes: 12,
        passing_score: 55,
        max_attempts: 3,
        attempts_gap: 12,
        quizType: "normal",
        status: "active",
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        module_id: 21,
        title: "Irrigation Methods Quiz",
        duration_minutes: 10,
        passing_score: 50,
        max_attempts: 2,
        attempts_gap: 24,
        quizType: "normal",
        status: "active",
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        module_id: 22,
        title: "Agro Industries Quiz",
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
        module_id: 23,
        title: "Key Industries Quiz",
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
        module_id: 24,
        title: "Ports & SEZs Quiz",
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
        module_id: 25,
        title: "Industrial Challenges Quiz",
        duration_minutes: 10,
        passing_score: 50,
        max_attempts: 2,
        attempts_gap: 24,
        quizType: "normal",
        status: "active",
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        module_id: 26,
        title: "Art & Handicrafts Quiz",
        duration_minutes: 12,
        passing_score: 55,
        max_attempts: 3,
        attempts_gap: 12,
        quizType: "normal",
        status: "active",
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        module_id: 27,
        title: "Festivals & Dance Quiz",
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
        module_id: 28,
        title: "Pilgrimage Sites Quiz",
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
        module_id: 29,
        title: "Wildlife Quiz",
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
        module_id: 30,
        title: "Environmental Challenges Quiz",
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
        module_id: 31,
        title: "Renewable Energy Quiz",
        duration_minutes: 10,
        passing_score: 50,
        max_attempts: 2,
        attempts_gap: 24,
        quizType: "normal",
        status: "active",
        created_by_type: "admin",
        updated_by_type: "admin",
    }
];

const quizQuestions = [
    {
        quiz_id: 12,
        module_id: 14,
        question_text: "Which of these states does NOT border Gujarat?",
        question_type: "mcq",
        marks: 5,
        sequence_no: 1,
        options: [
            { text: "Rajasthan", correct: false },
            { text: "Madhya Pradesh", correct: false },
            { text: "Maharashtra", correct: false },
            { text: "Uttar Pradesh", correct: true },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 12,
        module_id: 14,
        question_text: "Gujarat has the longest coastline in India.",
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
        quiz_id: 12,
        module_id: 14,
        question_text: "The Tropic of _____ passes through Gujarat",
        question_type: "complete-sentence",
        marks: 5,
        sequence_no: 3,
        blanks: [{ correct_word: "Cancer", hint: "C" }],
        created_by_type: "admin",
        updated_by_type: "admin",
    },

    {
        quiz_id: 13,
        module_id: 15,
        question_text: "How many districts are there in Gujarat?",
        question_type: "mcq",
        marks: 5,
        sequence_no: 1,
        options: [
            { text: "28", correct: false },
            { text: "33", correct: true },
            { text: "25", correct: false },
            { text: "30", correct: false },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 13,
        module_id: 15,
        question_text: "The administrative capital of Gujarat is _____",
        question_type: "complete-sentence",
        marks: 5,
        sequence_no: 2,
        blanks: [{ correct_word: "Gandhinagar", hint: "G" }],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 13,
        module_id: 15,
        question_text: "Kutch is the largest district of Gujarat by area.",
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

    {
        quiz_id: 14,
        module_id: 16,
        question_text: "Which ancient civilization had major sites in Gujarat?",
        question_type: "mcq",
        marks: 5,
        sequence_no: 1,
        options: [
            { text: "Indus Valley", correct: true },
            { text: "Mesopotamian", correct: false },
            { text: "Egyptian", correct: false },
            { text: "Chinese", correct: false },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 14,
        module_id: 16,
        question_text: "Gujarat was formed as a separate state in the year _____",
        question_type: "complete-sentence",
        marks: 5,
        sequence_no: 2,
        blanks: [{ correct_word: "1960", hint: "19" }],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 14,
        module_id: 16,
        question_text: "Lothal was an ancient port city in Gujarat.",
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

    {
        quiz_id: 15,
        module_id: 17,
        question_text: "Which of these is NOT a geographical region of Gujarat?",
        question_type: "mcq",
        marks: 5,
        sequence_no: 1,
        options: [
            { text: "Kutch", correct: false },
            { text: "Saurashtra", correct: false },
            { text: "Deccan Plateau", correct: true },
            { text: "Gujarat Plains", correct: false },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 15,
        module_id: 17,
        question_text: "The Rann of Kutch is famous for its _____ desert",
        question_type: "complete-sentence",
        marks: 5,
        sequence_no: 2,
        blanks: [{ correct_word: "salt", hint: "s" }],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 15,
        module_id: 17,
        question_text: "Girnar is the highest peak in Gujarat.",
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

    //5: Rivers of Gujarat
    {
        quiz_id: 16,
        module_id: 18,
        question_text: "Which is the longest river in Gujarat?",
        question_type: "mcq",
        marks: 5,
        sequence_no: 1,
        options: [
            { text: "Sabarmati", correct: false },
            { text: "Narmada", correct: true },
            { text: "Tapi", correct: false },
            { text: "Mahi", correct: false },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 16,
        module_id: 18,
        question_text: "The Sabarmati river flows through the city of _____",
        question_type: "complete-sentence",
        marks: 5,
        sequence_no: 2,
        blanks: [{ correct_word: "Ahmedabad", hint: "A" }],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 16,
        module_id: 18,
        question_text: "Sardar Sarovar Dam is built on the Tapi river.",
        question_type: "true-false",
        marks: 3,
        sequence_no: 3,
        options: [
            { text: "true", correct: false },
            { text: "false", correct: true },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },

    //6: Climate & Soils
    {
        quiz_id: 17,
        module_id: 19,
        question_text: "Which type of climate does most of Gujarat have?",
        question_type: "mcq",
        marks: 5,
        sequence_no: 1,
        options: [
            { text: "Tropical Wet", correct: false },
            { text: "Tropical Dry", correct: true },
            { text: "Alpine", correct: false },
            { text: "Mediterranean", correct: false },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 17,
        module_id: 19,
        question_text: "The black soil region of Gujarat is good for growing _____",
        question_type: "complete-sentence",
        marks: 5,
        sequence_no: 2,
        blanks: [{ correct_word: "cotton", hint: "c" }],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 17,
        module_id: 19,
        question_text: "Gujarat receives most of its rainfall during winter.",
        question_type: "true-false",
        marks: 3,
        sequence_no: 3,
        options: [
            { text: "true", correct: false },
            { text: "false", correct: true },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },

    //7: Major Crops
    {
        quiz_id: 18,
        module_id: 20,
        question_text: "Which of these is a major cash crop of Gujarat?",
        question_type: "mcq",
        marks: 5,
        sequence_no: 1,
        options: [
            { text: "Wheat", correct: false },
            { text: "Groundnut", correct: true },
            { text: "Rice", correct: false },
            { text: "Bajra", correct: false },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 18,
        module_id: 20,
        question_text: "Gujarat is the largest producer of _____ in India",
        question_type: "complete-sentence",
        marks: 5,
        sequence_no: 2,
        blanks: [{ correct_word: "cumin", hint: "c" }],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 18,
        module_id: 20,
        question_text: "Banaskantha district is famous for potato cultivation.",
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

    //8: Irrigation Methods
    {
        quiz_id: 19,
        module_id: 21,
        question_text: "Which is the largest irrigation project in Gujarat?",
        question_type: "mcq",
        marks: 5,
        sequence_no: 1,
        options: [
            { text: "Ukai Dam", correct: false },
            { text: "Sardar Sarovar", correct: true },
            { text: "Dantiwada Dam", correct: false },
            { text: "Kadana Dam", correct: false },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 19,
        module_id: 21,
        question_text: "The Sujalam Sufalam scheme is related to _____ recharge",
        question_type: "complete-sentence",
        marks: 5,
        sequence_no: 2,
        blanks: [{ correct_word: "groundwater", hint: "g" }],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 19,
        module_id: 21,
        question_text: "Drip irrigation helps conserve water.",
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

    //9: Agro-Based Industries
    {
        quiz_id: 20,
        module_id: 22,
        question_text: "Which cooperative is known as 'Amul'?",
        question_type: "mcq",
        marks: 5,
        sequence_no: 1,
        options: [
            { text: "Gujarat Cooperative Milk Marketing Federation", correct: true },
            { text: "Gujarat Agro Industries Corporation", correct: false },
            { text: "Gujarat State Fertilizers", correct: false },
            { text: "Gujarat State Seeds Corporation", correct: false },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 20,
        module_id: 22,
        question_text: "The 'White Revolution' in India started from _____",
        question_type: "complete-sentence",
        marks: 5,
        sequence_no: 2,
        blanks: [{ correct_word: "Anand", hint: "A" }],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 20,
        module_id: 22,
        question_text: "Surat is famous for its diamond polishing industry.",
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

    //10: Key Industries
    {
        quiz_id: 21,
        module_id: 23,
        question_text: "Which city is known as the 'Petrochemical Capital of India'?",
        question_type: "mcq",
        marks: 5,
        sequence_no: 1,
        options: [
            { text: "Ahmedabad", correct: false },
            { text: "Vadodara", correct: true },
            { text: "Surat", correct: false },
            { text: "Rajkot", correct: false },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 21,
        module_id: 23,
        question_text: "The Tata Nano car plant was originally planned in _____",
        question_type: "complete-sentence",
        marks: 5,
        sequence_no: 2,
        blanks: [{ correct_word: "Sanand", hint: "S" }],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 21,
        module_id: 23,
        question_text: "Jamnagar has one of the world's largest oil refineries.",
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

    //11: Ports & SEZs
    {
        quiz_id: 22,
        module_id: 24,
        question_text: "Which is the largest private port in India?",
        question_type: "mcq",
        marks: 5,
        sequence_no: 1,
        options: [
            { text: "Kandla", correct: false },
            { text: "Mundra", correct: true },
            { text: "Pipavav", correct: false },
            { text: "Dahej", correct: false },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 22,
        module_id: 24,
        question_text: "The first SEZ in Gujarat was established at _____",
        question_type: "complete-sentence",
        marks: 5,
        sequence_no: 2,
        blanks: [{ correct_word: "Kandla", hint: "K" }],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 22,
        module_id: 24,
        question_text: "GIFT City is a special economic zone near Ahmedabad.",
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

    //12: Industrial Challenges
    {
        quiz_id: 23,
        module_id: 25,
        question_text: "Which of these is a major industrial challenge in Gujarat?",
        question_type: "mcq",
        marks: 5,
        sequence_no: 1,
        options: [
            { text: "Water shortage", correct: true },
            { text: "Excess rainfall", correct: false },
            { text: "Lack of skilled labor", correct: false },
            { text: "No government support", correct: false },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 23,
        module_id: 25,
        question_text: "The _____ river basin faces severe pollution from industries",
        question_type: "complete-sentence",
        marks: 5,
        sequence_no: 2,
        blanks: [{ correct_word: "Sabarmati", hint: "S" }],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 23,
        module_id: 25,
        question_text: "Gujarat has no issues with industrial waste management.",
        question_type: "true-false",
        marks: 3,
        sequence_no: 3,
        options: [
            { text: "true", correct: false },
            { text: "false", correct: true },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },

    //13: Art & Handicrafts
    {
        quiz_id: 24,
        module_id: 26,
        question_text: "Which of these is a famous Gujarati textile art?",
        question_type: "mcq",
        marks: 5,
        sequence_no: 1,
        options: [
            { text: "Bandhani", correct: true },
            { text: "Madhubani", correct: false },
            { text: "Warli", correct: false },
            { text: "Pattachitra", correct: false },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 24,
        module_id: 26,
        question_text: "The double ikat silk sarees from Patan are called _____",
        question_type: "complete-sentence",
        marks: 5,
        sequence_no: 2,
        blanks: [{ correct_word: "Patola", hint: "P" }],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 24,
        module_id: 26,
        question_text: "Rogan painting is done using a pen.",
        question_type: "true-false",
        marks: 3,
        sequence_no: 3,
        options: [
            { text: "true", correct: false },
            { text: "false", correct: true },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },

    //14: Festivals & Dance
    {
        quiz_id: 25,
        module_id: 27,
        question_text: "Which festival is known as the 'International Kite Festival'?",
        question_type: "mcq",
        marks: 5,
        sequence_no: 1,
        options: [
            { text: "Navratri", correct: false },
            { text: "Diwali", correct: false },
            { text: "Uttarayan", correct: true },
            { text: "Holi", correct: false },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 25,
        module_id: 27,
        question_text: "The traditional dance form performed during Navratri is _____",
        question_type: "complete-sentence",
        marks: 5,
        sequence_no: 2,
        blanks: [{ correct_word: "Garba", hint: "G" }],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 25,
        module_id: 27,
        question_text: "Rann Utsav is celebrated in the summer season.",
        question_type: "true-false",
        marks: 3,
        sequence_no: 3,
        options: [
            { text: "true", correct: false },
            { text: "false", correct: true },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },

    //15: Pilgrimage Sites
    {
        quiz_id: 26,
        module_id: 28,
        question_text: "Which of these is NOT a Jain pilgrimage site in Gujarat?",
        question_type: "mcq",
        marks: 5,
        sequence_no: 1,
        options: [
            { text: "Palitana", correct: false },
            { text: "Shatrunjaya", correct: false },
            { text: "Dwarka", correct: true },
            { text: "Girnar", correct: false },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 26,
        module_id: 28,
        question_text: "The Somnath temple is located in _____ district",
        question_type: "complete-sentence",
        marks: 5,
        sequence_no: 2,
        blanks: [{ correct_word: "Gir-Somnath", hint: "G" }],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 26,
        module_id: 28,
        question_text: "Udvada is an important pilgrimage site for Zoroastrians.",
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

    //16: Wildlife & Sanctuaries
    {
        quiz_id: 27,
        module_id: 29,
        question_text: "Which animal is Gir National Park famous for?",
        question_type: "mcq",
        marks: 5,
        sequence_no: 1,
        options: [
            { text: "Bengal Tiger", correct: false },
            { text: "Asiatic Lion", correct: true },
            { text: "Indian Elephant", correct: false },
            { text: "Indian Rhino", correct: false },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 27,
        module_id: 29,
        question_text: "The Wild Ass Sanctuary is located in the _____ region",
        question_type: "complete-sentence",
        marks: 5,
        sequence_no: 2,
        blanks: [{ correct_word: "Little Rann of Kutch", hint: "L" }],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 27,
        module_id: 29,
        question_text: "Marine National Park is located in Jamnagar.",
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

    //17: Environmental Challenges
    {
        quiz_id: 28,
        module_id: 30,
        question_text: "Which of these is a major environmental issue in Gujarat?",
        question_type: "mcq",
        marks: 5,
        sequence_no: 1,
        options: [
            { text: "Industrial pollution", correct: true },
            { text: "Glacial melting", correct: false },
            { text: "Volcanic eruptions", correct: false },
            { text: "Tsunamis", correct: false },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 28,
        module_id: 30,
        question_text: "The _____ region faces severe coastal erosion",
        question_type: "complete-sentence",
        marks: 5,
        sequence_no: 2,
        blanks: [{ correct_word: "Kutch", hint: "K" }],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 28,
        module_id: 30,
        question_text: "Gujarat has no problems with air pollution.",
        question_type: "true-false",
        marks: 3,
        sequence_no: 3,
        options: [
            { text: "true", correct: false },
            { text: "false", correct: true },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },

    //18: Renewable Energy
    {
        quiz_id: 29,
        module_id: 31,
        question_text: "Which district has the largest solar park in Gujarat?",
        question_type: "mcq",
        marks: 5,
        sequence_no: 1,
        options: [
            { text: "Kutch", correct: true },
            { text: "Banaskantha", correct: false },
            { text: "Patan", correct: false },
            { text: "Mehsana", correct: false },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 29,
        module_id: 31,
        question_text: "The _____ project is Asia's largest wind farm",
        question_type: "complete-sentence",
        marks: 5,
        sequence_no: 2,
        blanks: [{ correct_word: "Muppandal", hint: "M" }],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 29,
        module_id: 31,
        question_text: "Gujarat has potential for tidal energy generation.",
        question_type: "true-false",
        marks: 3,
        sequence_no: 3,
        options: [
            { text: "true", correct: true },
            { text: "false", correct: false },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    }
];

const predefinedQuestions = [
    //1: Location & Geography
    {
        quiz_id: 12,
        question_text: "Which state lies to the north of Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 26,
        options: [
            { option_text: "Maharashtra", is_correct: false },
            { option_text: "Rajasthan", is_correct: true },
            { option_text: "Madhya Pradesh", is_correct: false },
            { option_text: "Pakistan", is_correct: false },
        ],
    },
    {
        quiz_id: 12,
        question_text: "What is the total length of Gujarat's coastline?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 27,
        options: [
            { option_text: "About 1,600 km", is_correct: true },
            { option_text: "About 800 km", is_correct: false },
            { option_text: "About 2,400 km", is_correct: false },
            { option_text: "About 400 km", is_correct: false },
        ],
    },
    {
        quiz_id: 12,
        question_text: "Which water body lies to the west of Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 28,
        options: [
            { option_text: "Bay of Bengal", is_correct: false },
            { option_text: "Indian Ocean", is_correct: false },
            { option_text: "Arabian Sea", is_correct: true },
            { option_text: "Persian Gulf", is_correct: false },
        ],
    },
    {
        quiz_id: 12,
        question_text: "Which is the westernmost state of India?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 29,
        options: [
            { option_text: "Maharashtra", is_correct: false },
            { option_text: "Rajasthan", is_correct: false },
            { option_text: "Gujarat", is_correct: true },
            { option_text: "Kerala", is_correct: false },
        ],
    },
    {
        quiz_id: 12,
        question_text: "What is the approximate area of Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 30,
        options: [
            { option_text: "96,000 sq km", is_correct: false },
            { option_text: "196,000 sq km", is_correct: true },
            { option_text: "296,000 sq km", is_correct: false },
            { option_text: "156,000 sq km", is_correct: false },
        ],
    },

    //2: Administrative Divisions
    {
        quiz_id: 13,
        question_text: "How many districts does Gujarat have (as of 2023)?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 31,
        options: [
            { option_text: "27", is_correct: false },
            { option_text: "33", is_correct: true },
            { option_text: "38", is_correct: false },
            { option_text: "41", is_correct: false },
        ],
    },
    {
        quiz_id: 13,
        question_text: "Which is the capital city of Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 32,
        options: [
            { option_text: "Surat", is_correct: false },
            { option_text: "Vadodara", is_correct: false },
            { option_text: "Rajkot", is_correct: false },
            { option_text: "Gandhinagar", is_correct: true },
        ],
    },
    {
        quiz_id: 13,
        question_text: "Into how many administrative divisions is Gujarat divided?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 33,
        options: [
            { option_text: "4", is_correct: true },
            { option_text: "6", is_correct: false },
            { option_text: "8", is_correct: false },
            { option_text: "10", is_correct: false },
        ],
    },
    {
        quiz_id: 13,
        question_text: "Which of the following is NOT an administrative division of Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 34,
        options: [
            { option_text: "North Gujarat", is_correct: false },
            { option_text: "Saurashtra", is_correct: false },
            { option_text: "Kutch", is_correct: false },
            { option_text: "Vidarbha", is_correct: true },
        ],
    },
    {
        quiz_id: 13,
        question_text: "What is a 'taluka' in Gujarat's administrative structure?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 35,
        options: [
            { option_text: "The smallest administrative unit", is_correct: false },
            { option_text: "A subdivision of a district", is_correct: true },
            { option_text: "A group of districts", is_correct: false },
            { option_text: "A municipal corporation", is_correct: false },
        ],
    },

    //3: Historical Background
    {
        quiz_id: 14,
        question_text: "When was the state of Gujarat formed?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 36,
        options: [
            { option_text: "1947", is_correct: false },
            { option_text: "1950", is_correct: false },
            { option_text: "1960", is_correct: true },
            { option_text: "1970", is_correct: false },
        ],
    },
    {
        quiz_id: 14,
        question_text: "Gujarat was formed from which former state?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 37,
        options: [
            { option_text: "Madras State", is_correct: false },
            { option_text: "Bombay State", is_correct: true },
            { option_text: "Central Provinces", is_correct: false },
            { option_text: "Hyderabad State", is_correct: false },
        ],
    },
    {
        quiz_id: 14,
        question_text: "Which ancient civilization flourished in parts of modern-day Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 38,
        options: [
            { option_text: "Indus Valley Civilization", is_correct: true },
            { option_text: "Mesopotamian Civilization", is_correct: false },
            { option_text: "Egyptian Civilization", is_correct: false },
            { option_text: "Yangtze Civilization", is_correct: false },
        ],
    },
    {
        quiz_id: 14,
        question_text: "Which historical site in Gujarat is associated with the Indus Valley Civilization?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 39,
        options: [
            { option_text: "Mohenjo-daro", is_correct: false },
            { option_text: "Harappa", is_correct: false },
            { option_text: "Lothal", is_correct: true },
            { option_text: "Kalibangan", is_correct: false },
        ],
    },
    {
        quiz_id: 14,
        question_text: "What was Gujarat known as in ancient times?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 40,
        options: [
            { option_text: "Anga", is_correct: false },
            { option_text: "Gurjaratra", is_correct: true },
            { option_text: "Avanti", is_correct: false },
            { option_text: "Magadha", is_correct: false },
        ],
    },

    // Continue with other modules...
    //4: Landforms & Regions
    {
        quiz_id: 15,
        question_text: "What is the largest district of Gujarat in terms of area?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 41,
        options: [
            { option_text: "Ahmedabad", is_correct: false },
            { option_text: "Surat", is_correct: false },
            { option_text: "Kutch", is_correct: true },
            { option_text: "Rajkot", is_correct: false },
        ],
    },
    {
        quiz_id: 15,
        question_text: "What is the Rann of Kutch?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 42,
        options: [
            { option_text: "A mountain range", is_correct: false },
            { option_text: "A seasonal salt marsh", is_correct: true },
            { option_text: "A river valley", is_correct: false },
            { option_text: "A tropical forest", is_correct: false },
        ],
    },
    {
        quiz_id: 15,
        question_text: "Which mountain range runs through eastern Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 43,
        options: [
            { option_text: "Western Ghats", is_correct: false },
            { option_text: "Vindhya Range", is_correct: false },
            { option_text: "Aravalli Range", is_correct: true },
            { option_text: "Satpura Range", is_correct: false },
        ],
    },
    {
        quiz_id: 15,
        question_text: "What is the Saurashtra region also known as?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 44,
        options: [
            { option_text: "Kathiawar Peninsula", is_correct: true },
            { option_text: "Gir Highlands", is_correct: false },
            { option_text: "Kachchh Plateau", is_correct: false },
            { option_text: "Dangs Forest", is_correct: false },
        ],
    },
    {
        quiz_id: 15,
        question_text: "Which of these is NOT one of Gujarat's major geographical regions?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 45,
        options: [
            { option_text: "Kutch", is_correct: false },
            { option_text: "Saurashtra", is_correct: false },
            { option_text: "North Gujarat", is_correct: false },
            { option_text: "Bundhelkhand", is_correct: true },
        ],
    },

    //5: Rivers of Gujarat
    {
        quiz_id: 16,
        question_text: "Which is the longest river of Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 46,
        options: [
            { option_text: "Sabarmati", is_correct: false },
            { option_text: "Tapi", is_correct: false },
            { option_text: "Narmada", is_correct: true },
            { option_text: "Mahi", is_correct: false },
        ],
    },
    {
        quiz_id: 16,
        question_text: "Which river is called the 'Lifeline of Gujarat'?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 47,
        options: [
            { option_text: "Sabarmati", is_correct: false },
            { option_text: "Tapi", is_correct: false },
            { option_text: "Narmada", is_correct: true },
            { option_text: "Mahi", is_correct: false },
        ],
    },
    {
        quiz_id: 16,
        question_text: "Which famous dam is built on the Narmada River?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 48,
        options: [
            { option_text: "Ukai Dam", is_correct: false },
            { option_text: "Dharoi Dam", is_correct: false },
            { option_text: "Sardar Sarovar Dam", is_correct: true },
            { option_text: "Kadana Dam", is_correct: false },
        ],
    },
    {
        quiz_id: 16,
        question_text: "Which river flows through Ahmedabad city?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 49,
        options: [
            { option_text: "Sabarmati", is_correct: true },
            { option_text: "Tapi", is_correct: false },
            { option_text: "Mahi", is_correct: false },
            { option_text: "Narmada", is_correct: false },
        ],
    },
    {
        quiz_id: 16,
        question_text: "Which river forms an estuary in the Gulf of Khambhat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 50,
        options: [
            { option_text: "Luni", is_correct: false },
            { option_text: "Tapi", is_correct: true },
            { option_text: "Banas", is_correct: false },
            { option_text: "Saraswati", is_correct: false },
        ],
    },

    //6: Climate & Soils
    {
        quiz_id: 17,
        question_text: "Which type of climate is found in most parts of Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 51,
        options: [
            { option_text: "Tropical Wet", is_correct: false },
            { option_text: "Semi-arid", is_correct: true },
            { option_text: "Humid Continental", is_correct: false },
            { option_text: "Alpine", is_correct: false },
        ],
    },
    {
        quiz_id: 17,
        question_text: "What is the average annual rainfall in Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 52,
        options: [
            { option_text: "300-400 mm", is_correct: false },
            { option_text: "500-700 mm", is_correct: true },
            { option_text: "1000-1500 mm", is_correct: false },
            { option_text: "2000-2500 mm", is_correct: false },
        ],
    },
    {
        quiz_id: 17,
        question_text: "Which soil type is most prevalent in the Kutch region?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 53,
        options: [
            { option_text: "Alluvial Soil", is_correct: false },
            { option_text: "Black Cotton Soil", is_correct: false },
            { option_text: "Red Sandy Soil", is_correct: false },
            { option_text: "Saline Soil", is_correct: true },
        ],
    },
    {
        quiz_id: 17,
        question_text: "Which region of Gujarat receives the highest rainfall?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 54,
        options: [
            { option_text: "The Dangs", is_correct: true },
            { option_text: "Kutch", is_correct: false },
            { option_text: "North Gujarat", is_correct: false },
            { option_text: "Central Gujarat", is_correct: false },
        ],
    },
    {
        quiz_id: 17,
        question_text: "Which soil is locally known as 'Regur' in Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 55,
        options: [
            { option_text: "Red Soil", is_correct: false },
            { option_text: "Black Cotton Soil", is_correct: true },
            { option_text: "Laterite Soil", is_correct: false },
            { option_text: "Desert Soil", is_correct: false },
        ],
    },

    //7: Major Crops
    {
        quiz_id: 18,
        question_text: "Which crop is Gujarat the largest producer of in India?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 56,
        options: [
            { option_text: "Wheat", is_correct: false },
            { option_text: "Rice", is_correct: false },
            { option_text: "Cotton", is_correct: true },
            { option_text: "Sugarcane", is_correct: false },
        ],
    },
    {
        quiz_id: 18,
        question_text: "Which oilseed is extensively grown in Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 57,
        options: [
            { option_text: "Sunflower", is_correct: false },
            { option_text: "Groundnut", is_correct: true },
            { option_text: "Soybean", is_correct: false },
            { option_text: "Sesame", is_correct: false },
        ],
    },
    {
        quiz_id: 18,
        question_text: "Which millet is commonly grown in the arid regions of Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 58,
        options: [
            { option_text: "Ragi", is_correct: false },
            { option_text: "Jowar", is_correct: false },
            { option_text: "Bajra", is_correct: true },
            { option_text: "Maize", is_correct: false },
        ],
    },
    {
        quiz_id: 18,
        question_text: "Which spice is Gujarat famous for producing?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 59,
        options: [
            { option_text: "Black Pepper", is_correct: false },
            { option_text: "Cardamom", is_correct: false },
            { option_text: "Cumin", is_correct: true },
            { option_text: "Cloves", is_correct: false },
        ],
    },
    {
        quiz_id: 18,
        question_text: "In which season is cotton primarily grown in Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 60,
        options: [
            { option_text: "Rabi (Winter)", is_correct: false },
            { option_text: "Kharif (Monsoon)", is_correct: true },
            { option_text: "Zaid (Summer)", is_correct: false },
            { option_text: "All year round", is_correct: false },
        ],
    },

    //8: Irrigation Methods
    {
        quiz_id: 19,
        question_text: "What percentage of Gujarat's cultivated area is under irrigation?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 61,
        options: [
            { option_text: "About 20%", is_correct: false },
            { option_text: "About 40%", is_correct: true },
            { option_text: "About 60%", is_correct: false },
            { option_text: "About 80%", is_correct: false },
        ],
    },
    {
        quiz_id: 19,
        question_text: "Which canal system is part of the Sardar Sarovar Project?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 62,
        options: [
            { option_text: "Indira Gandhi Canal", is_correct: false },
            { option_text: "Narmada Main Canal", is_correct: true },
            { option_text: "Upper Ganga Canal", is_correct: false },
            { option_text: "Krishna Delta Canal", is_correct: false },
        ],
    },
    {
        quiz_id: 19,
        question_text: "Which irrigation method is widely promoted for water conservation in Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 63,
        options: [
            { option_text: "Flood Irrigation", is_correct: false },
            { option_text: "Furrow Irrigation", is_correct: false },
            { option_text: "Drip Irrigation", is_correct: true },
            { option_text: "Basin Irrigation", is_correct: false },
        ],
    },
    {
        quiz_id: 19,
        question_text: "What is a 'check dam' used for in Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 64,
        options: [
            { option_text: "Flood control", is_correct: false },
            { option_text: "Water harvesting and groundwater recharge", is_correct: true },
            { option_text: "Navigation", is_correct: false },
            { option_text: "Hydroelectric power", is_correct: false },
        ],
    },
    {
        quiz_id: 19,
        question_text: "Which traditional water harvesting structure is found in Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 65,
        options: [
            { option_text: "Vav (Stepwell)", is_correct: true },
            { option_text: "Kund", is_correct: false },
            { option_text: "Johad", is_correct: false },
            { option_text: "Ahar-Pyne", is_correct: false },
        ],
    },

    //9: Agro-Based Industries
    {
        quiz_id: 20,
        question_text: "Which famous dairy cooperative originated in Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 66,
        options: [
            { option_text: "Nandini", is_correct: false },
            { option_text: "Amul", is_correct: true },
            { option_text: "Verka", is_correct: false },
            { option_text: "Saras", is_correct: false },
        ],
    },
    {
        quiz_id: 20,
        question_text: "Which city in Gujarat is known as the 'Manchester of India' due to its textile industry?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 67,
        options: [
            { option_text: "Surat", is_correct: false },
            { option_text: "Vadodara", is_correct: false },
            { option_text: "Rajkot", is_correct: false },
            { option_text: "Ahmedabad", is_correct: true },
        ],
    },
    {
        quiz_id: 20,
        question_text: "Where is the headquarters of Amul located?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 68,
        options: [
            { option_text: "Ahmedabad", is_correct: false },
            { option_text: "Anand", is_correct: true },
            { option_text: "Gandhinagar", is_correct: false },
            { option_text: "Vadodara", is_correct: false },
        ],
    },
    {
        quiz_id: 20,
        question_text: "Which oilseed processing is a major agro-industry in Saurashtra?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 69,
        options: [
            { option_text: "Mustard oil", is_correct: false },
            { option_text: "Groundnut oil", is_correct: true },
            { option_text: "Sunflower oil", is_correct: false },
            { option_text: "Soybean oil", is_correct: false },
        ],
    },
    {
        quiz_id: 20,
        question_text: "Which region in Gujarat is known for its sugar mills?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 70,
        options: [
            { option_text: "Kutch", is_correct: false },
            { option_text: "South Gujarat", is_correct: true },
            { option_text: "North Gujarat", is_correct: false },
            { option_text: "Saurashtra", is_correct: false },
        ],
    },

    //10: Key Industries
    {
        quiz_id: 21,
        question_text: "Which city is the center of Gujarat's diamond cutting and polishing industry?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 71,
        options: [
            { option_text: "Ahmedabad", is_correct: false },
            { option_text: "Vadodara", is_correct: false },
            { option_text: "Surat", is_correct: true },
            { option_text: "Rajkot", is_correct: false },
        ],
    },
    {
        quiz_id: 21,
        question_text: "Where is Gujarat's largest petroleum refinery located?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 72,
        options: [
            { option_text: "Jamnagar", is_correct: true },
            { option_text: "Bharuch", is_correct: false },
            { option_text: "Dwarka", is_correct: false },
            { option_text: "Porbandar", is_correct: false },
        ],
    },
    {
        quiz_id: 21,
        question_text: "Which industrial corridor connects Gujarat and Delhi?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 73,
        options: [
            { option_text: "Mumbai-Ahmedabad Industrial Corridor", is_correct: false },
            { option_text: "Delhi-Mumbai Industrial Corridor", is_correct: true },
            { option_text: "Ahmedabad-Pune Industrial Corridor", is_correct: false },
            { option_text: "Surat-Delhi Industrial Corridor", is_correct: false },
        ],
    },
    {
        quiz_id: 21,
        question_text: "What percentage of India's pharmaceutical production comes from Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 74,
        options: [
            { option_text: "About 10%", is_correct: false },
            { option_text: "About 20%", is_correct: false },
            { option_text: "About 33%", is_correct: true },
            { option_text: "About 50%", is_correct: false },
        ],
    },
    {
        quiz_id: 21,
        question_text: "Which ceramic industrial cluster is located in Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 75,
        options: [
            { option_text: "Morbi", is_correct: true },
            { option_text: "Ankleshwar", is_correct: false },
            { option_text: "Dahej", is_correct: false },
            { option_text: "Mundra", is_correct: false },
        ],
    },

    //11: Ports & SEZs
    {
        quiz_id: 22,
        question_text: "Which is India's first privately managed port located in Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 76,
        options: [
            { option_text: "Kandla Port", is_correct: false },
            { option_text: "Mundra Port", is_correct: true },
            { option_text: "Hazira Port", is_correct: false },
            { option_text: "Dahej Port", is_correct: false },
        ],
    },
    {
        quiz_id: 22,
        question_text: "Which port in Gujarat handles the largest volume of cargo?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 77,
        options: [
            { option_text: "Okha Port", is_correct: false },
            { option_text: "Porbandar Port", is_correct: false },
            { option_text: "Kandla Port (Deendayal Port)", is_correct: true },
            { option_text: "Bedi Port", is_correct: false },
        ],
    },
    {
        quiz_id: 22,
        question_text: "What is a Special Economic Zone (SEZ)?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 78,
        options: [
            { option_text: "An area with relaxed economic regulations to promote exports", is_correct: true },
            { option_text: "A region with special agricultural subsidies", is_correct: false },
            { option_text: "An area reserved for domestic industries only", is_correct: false },
            { option_text: "A zone where foreign companies cannot operate", is_correct: false },
        ],
    },
    {
        quiz_id: 22,
        question_text: "How many major and minor ports does Gujarat have?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 79,
        options: [
            { option_text: "Around 10", is_correct: false },
            { option_text: "Around 20", is_correct: false },
            { option_text: "Around 30", is_correct: false },
            { option_text: "Around 40", is_correct: true },
        ],
    },
    {
        quiz_id: 22,
        question_text: "Which SEZ in Gujarat is focused on petroleum and petrochemicals?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 80,
        options: [
            { option_text: "Dahej SEZ", is_correct: true },
            { option_text: "Kandla SEZ", is_correct: false },
            { option_text: "Surat SEZ", is_correct: false },
            { option_text: "Ahmedabad SEZ", is_correct: false },
        ],
    },

    //12: Industrial Challenges
    {
        quiz_id: 23,
        question_text: "Which is a major industrial pollution hotspot in Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 81,
        options: [
            { option_text: "Vapi", is_correct: true },
            { option_text: "Bhuj", is_correct: false },
            { option_text: "Porbandar", is_correct: false },
            { option_text: "Godhra", is_correct: false },
        ],
    },
    {
        quiz_id: 23,
        question_text: "What is a major challenge for the textile industry in Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 82,
        options: [
            { option_text: "Water scarcity", is_correct: true },
            { option_text: "Excess rainfall", is_correct: false },
            { option_text: "Excess labor", is_correct: false },
            { option_text: "Low demand", is_correct: false },
        ],
    },
    {
        quiz_id: 23,
        question_text: "What environmental issue affects the industrial area of Ankleshwar?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 83,
        options: [
            { option_text: "Air pollution", is_correct: false },
            { option_text: "Water pollution", is_correct: true },
            { option_text: "Soil erosion", is_correct: false },
            { option_text: "Deforestation", is_correct: false },
        ],
    },
    {
        quiz_id: 23,
        question_text: "Which natural disaster has affected Gujarat's industrial infrastructure?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 84,
        options: [
            { option_text: "Floods", is_correct: false },
            { option_text: "Earthquakes", is_correct: true },
            { option_text: "Volcanic eruptions", is_correct: false },
            { option_text: "Avalanches", is_correct: false },
        ],
    },
    {
        quiz_id: 23,
        question_text: "What power issue affects industries in parts of Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 85,
        options: [
            { option_text: "Power surplus", is_correct: false },
            { option_text: "Power outages", is_correct: true },
            { option_text: "Excess electricity generation", is_correct: false },
            { option_text: "Too many power plants", is_correct: false },
        ],
    },

    //13: Art & Handicrafts
    {
        quiz_id: 24,
        question_text: "Which traditional tie-dye textile art is famous in Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 86,
        options: [
            { option_text: "Kalamkari", is_correct: false },
            { option_text: "Bandhani", is_correct: true },
            { option_text: "Batik", is_correct: false },
            { option_text: "Pochampally", is_correct: false },
        ],
    },
    {
        quiz_id: 24,
        question_text: "Which traditional embroidery style originated in the Kutch region?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 87,
        options: [
            { option_text: "Phulkari", is_correct: false },
            { option_text: "Chikankari", is_correct: false },
            { option_text: "Rabari", is_correct: true },
            { option_text: "Kantha", is_correct: false },
        ],
    },
    {
        quiz_id: 24,
        question_text: "What is the specialty of Patola sarees from Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 88,
        options: [
            { option_text: "Double ikat weave", is_correct: true },
            { option_text: "Gold zari work", is_correct: false },
            { option_text: "Block printing", is_correct: false },
            { option_text: "Embroidery", is_correct: false },
        ],
    },
    {
        quiz_id: 24,
        question_text: "Where is Patola silk traditionally made in Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 89,
        options: [
            { option_text: "Surat", is_correct: false },
            { option_text: "Patan", is_correct: true },
            { option_text: "Rajkot", is_correct: false },
            { option_text: "Bhuj", is_correct: false },
        ],
    },
    {
        quiz_id: 24,
        question_text: "What is Rogan art?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 90,
        options: [
            { option_text: "A form of paper craft", is_correct: false },
            { option_text: "A style of painting using oil-based colors", is_correct: true },
            { option_text: "A technique of wood carving", is_correct: false },
            { option_text: "A method of pottery", is_correct: false },
        ],
    },

    //14: Festivals & Dance
    {
        quiz_id: 25,
        question_text: "Which festival is celebrated with great enthusiasm in Gujarat and involves dancing around in circles?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 91,
        options: [
            { option_text: "Diwali", is_correct: false },
            { option_text: "Holi", is_correct: false },
            { option_text: "Navratri", is_correct: true },
            { option_text: "Pongal", is_correct: false },
        ],
    },
    {
        quiz_id: 25,
        question_text: "What is Garba?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 92,
        options: [
            { option_text: "A folk dance of Gujarat", is_correct: true },
            { option_text: "A traditional musical instrument", is_correct: false },
            { option_text: "A special cuisine", is_correct: false },
            { option_text: "A religious ritual", is_correct: false },
        ],
    },
    {
        quiz_id: 25,
        question_text: "Which kite festival is celebrated in Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 93,
        options: [
            { option_text: "Pongal", is_correct: false },
            { option_text: "Bihu", is_correct: false },
            { option_text: "Uttarayan", is_correct: true },
            { option_text: "Onam", is_correct: false },
        ],
    },
    {
        quiz_id: 25,
        question_text: "What festival celebrates the arrival of monsoons in Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 94,
        options: [
            { option_text: "Sharad Purnima", is_correct: false },
            { option_text: "Janmashtami", is_correct: false },
            { option_text: "Rann Utsav", is_correct: false },
            { option_text: "Ashadhi Bij", is_correct: true },
        ],
    },
    {
        quiz_id: 25,
        question_text: "Which folk dance is performed by the Siddi community of Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 95,
        options: [
            { option_text: "Dhamaal", is_correct: true },
            { option_text: "Dandiya Raas", is_correct: false },
            { option_text: "Garba", is_correct: false },
            { option_text: "Tippani", is_correct: false },
        ],
    },

    //15: Pilgrimage Sites
    {
        quiz_id: 26,
        question_text: "Which temple in Gujarat is one of the 12 Jyotirlingas of Lord Shiva?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 96,
        options: [
            { option_text: "Dwarkadhish Temple", is_correct: false },
            { option_text: "Somnath Temple", is_correct: true },
            { option_text: "Akshardham Temple", is_correct: false },
            { option_text: "Sun Temple at Modhera", is_correct: false },
        ],
    },
    {
        quiz_id: 26,
        question_text: "Which city in Gujarat is associated with Lord Krishna?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 97,
        options: [
            { option_text: "Somnath", is_correct: false },
            { option_text: "Dwarka", is_correct: true },
            { option_text: "Palitana", is_correct: false },
            { option_text: "Porbandar", is_correct: false },
        ],
    },
    {
        quiz_id: 26,
        question_text: "What is special about the Jain temples at Palitana?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 98,
        options: [
            { option_text: "They are underwater", is_correct: false },
            { option_text: "They are the oldest in India", is_correct: false },
            { option_text: "They are built on a mountain", is_correct: true },
            { option_text: "They are made entirely of glass", is_correct: false },
        ],
    },
    {
        quiz_id: 26,
        question_text: "Which is the holiest fire temple for Parsis in Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 99,
        options: [
            { option_text: "Udvada Atash Behram", is_correct: true },
            { option_text: "Iranshah Temple", is_correct: false },
            { option_text: "Wadiaji Atash Bahram", is_correct: false },
            { option_text: "Surat Fire Temple", is_correct: false },
        ],
    },
    {
        quiz_id: 26,
        question_text: "Which sun temple in Gujarat is known for its architectural excellence?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 100,
        options: [
            { option_text: "Konark Sun Temple", is_correct: false },
            { option_text: "Martand Sun Temple", is_correct: false },
            { option_text: "Modhera Sun Temple", is_correct: true },
            { option_text: "Surya Pahar Temple", is_correct: false },
        ],
    },

    //16: Wildlife & Sanctuaries
    {
        quiz_id: 27,
        question_text: "Which animal is Gir National Park famous for?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 101,
        options: [
            { option_text: "Bengal Tiger", is_correct: false },
            { option_text: "One-horned Rhinoceros", is_correct: false },
            { option_text: "Asiatic Lion", is_correct: true },
            { option_text: "Snow Leopard", is_correct: false },
        ],
    },
    {
        quiz_id: 27,
        question_text: "Which wildlife sanctuary in Gujarat is home to the Indian Wild Ass?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 102,
        options: [
            { option_text: "Velavadar National Park", is_correct: false },
            { option_text: "Wild Ass Wildlife Sanctuary", is_correct: true },
            { option_text: "Gir National Park", is_correct: false },
            { option_text: "Marine National Park", is_correct: false },
        ],
    },
    {
        quiz_id: 27,
        question_text: "Where is the Marine National Park located in Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 103,
        options: [
            { option_text: "Gulf of Kutch", is_correct: true },
            { option_text: "Gulf of Khambhat", is_correct: false },
            { option_text: "Arabian Sea coast", is_correct: false },
            { option_text: "Rann of Kutch", is_correct: false },
        ],
    },
    {
        quiz_id: 27,
        question_text: "Which sanctuary in Gujarat is known for blackbuck conservation?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 104,
        options: [
            { option_text: "Nal Sarovar", is_correct: false },
            { option_text: "Velavadar Blackbuck National Park", is_correct: true },
            { option_text: "Jessore Sloth Bear Sanctuary", is_correct: false },
            { option_text: "Shoolpaneshwar Wildlife Sanctuary", is_correct: false },
        ],
    },
    {
        quiz_id: 27,
        question_text: "Which bird sanctuary in Gujarat is famous for flamingos?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 105,
        options: [
            { option_text: "Nal Sarovar Bird Sanctuary", is_correct: true },
            { option_text: "Thol Bird Sanctuary", is_correct: false },
            { option_text: "Khijadiya Bird Sanctuary", is_correct: false },
            { option_text: "Porbandar Bird Sanctuary", is_correct: false },
        ],
    },

    //17: Environmental Challenges
    {
        quiz_id: 28,
        question_text: "Which environmental issue affects the coastal areas of Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 106,
        options: [
            { option_text: "Coastal erosion", is_correct: true },
            { option_text: "Avalanches", is_correct: false },
            { option_text: "Landslides", is_correct: false },
            { option_text: "Forest fires", is_correct: false },
        ],
    },
    {
        quiz_id: 28,
        question_text: "What is causing groundwater depletion in parts of Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 107,
        options: [
            { option_text: "Excess rainfall", is_correct: false },
            { option_text: "Over-extraction for agriculture", is_correct: true },
            { option_text: "Seismic activities", is_correct: false },
            { option_text: "Volcanic activities", is_correct: false },
        ],
    },
    {
        quiz_id: 28,
        question_text: "Which problem is associated with the high level of industrialization in Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 108,
        options: [
            { option_text: "Industrial pollution", is_correct: true },
            { option_text: "Excess wildlife", is_correct: false },
            { option_text: "Overpopulation of forests", is_correct: false },
            { option_text: "Excessive rainfall", is_correct: false },
        ],
    },
    {
        quiz_id: 28,
        question_text: "What environmental issue affects the agricultural lands in some parts of Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 109,
        options: [
            { option_text: "Soil salinization", is_correct: true },
            { option_text: "Excessive fertility", is_correct: false },
            { option_text: "Too much organic matter", is_correct: false },
            { option_text: "Excessive irrigation facilities", is_correct: false },
        ],
    },
    {
        quiz_id: 28,
        question_text: "Which environmental challenge is faced by the Rann of Kutch region?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 110,
        options: [
            { option_text: "Desertification", is_correct: true },
            { option_text: "Excessive rainfall", is_correct: false },
            { option_text: "Volcanic eruptions", is_correct: false },
            { option_text: "Excessive vegetation growth", is_correct: false },
        ],
    },

    //18: Renewable Energy
    {
        quiz_id: 29,
        question_text: "Which renewable energy source is most developed in Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 111,
        options: [
            { option_text: "Geothermal energy", is_correct: false },
            { option_text: "Tidal energy", is_correct: false },
            { option_text: "Solar energy", is_correct: true },
            { option_text: "Nuclear energy", is_correct: false },
        ],
    },
    {
        quiz_id: 29,
        question_text: "Where is the largest solar park in Gujarat located?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 112,
        options: [
            { option_text: "Charanka", is_correct: true },
            { option_text: "Dwarka", is_correct: false },
            { option_text: "Surat", is_correct: false },
            { option_text: "Vadodara", is_correct: false },
        ],
    },
    {
        quiz_id: 29,
        question_text: "Which region of Gujarat has high potential for wind energy?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 113,
        options: [
            { option_text: "Eastern plains", is_correct: false },
            { option_text: "Kutch", is_correct: true },
            { option_text: "Central Gujarat", is_correct: false },
            { option_text: "The Dangs", is_correct: false },
        ],
    },
    {
        quiz_id: 29,
        question_text: "What is the main advantage of developing renewable energy in Gujarat?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 114,
        options: [
            { option_text: "Reduces dependence on fossil fuels", is_correct: true },
            { option_text: "Creates more pollution", is_correct: false },
            { option_text: "Increases water consumption", is_correct: false },
            { option_text: "Reduces agricultural output", is_correct: false },
        ],
    },
    {
        quiz_id: 29,
        question_text: "What is the Gujarat government's policy toward renewable energy?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 115,
        options: [
            { option_text: "Discouraging investments", is_correct: false },
            { option_text: "Neutral stance", is_correct: false },
            { option_text: "Promoting growth and incentives", is_correct: true },
            { option_text: "Banning solar installations", is_correct: false },
        ],
    },
];

const audioToScriptQuestions = [
    {
        quiz_id: 12,
        url: "/audiotoScript/gujaratLocation.mp3",
        script: "Gujarat is located on the western coast of India, bordered by Rajasthan, Madhya Pradesh, Maharashtra, and the Arabian Sea. The state lies between 20°1' to 24°7' north latitude and 68°4' to 74°4' east longitude.",
        marks: 7,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 13,
        url: "/audiotoScript/gujaratAdmin.mp3",
        script: "Gujarat is divided into 33 districts, grouped under 6 administrative divisions. The capital is Gandhinagar, while Ahmedabad is the largest city. Each district is headed by a District Collector.",
        marks: 3,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 14,
        url: "/audiotoScript/gujaratHistory.mp3",
        script: "Gujarat has a rich history dating back to the Indus Valley Civilization at sites like Lothal and Dholavira. It was ruled by various dynasties including the Mauryas, Guptas, Solankis, and later the Mughals before becoming a British protectorate.",
        marks: 8,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 15,
        url: "/audiotoScript/gujaratLandforms.mp3",
        script: "Gujarat's topography includes the Kathiawar Peninsula, Kutch region, and the plains of the Sabarmati and Mahi rivers. The Rann of Kutch is a seasonal salt marsh, while the Gir hills are home to Asia's only wild lions.",
        marks: 5,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 16,
        url: "/audiotoScript/gujaratRivers.mp3",
        script: "Major rivers in Gujarat include the Narmada, Tapi, Sabarmati, and Mahi. The Narmada, originating in Amarkantak, is the largest west-flowing river, crucial for irrigation through the Sardar Sarovar Dam.",
        marks: 10,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 17,
        url: "/audiotoScript/gujaratClimate.mp3",
        script: "Gujarat has a tropical monsoon climate with three distinct seasons. The state experiences diverse soil types including black cotton soil in central Gujarat, alluvial soil in the plains, and sandy soil in Kutch.",
        marks: 2,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 18,
        url: "/audiotoScript/gujaratCrops.mp3",
        script: "Gujarat is a leading producer of cotton, groundnuts, and castor. Other important crops include wheat, bajra, and tobacco. The state's agricultural success is supported by its diverse climate zones.",
        marks: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 19,
        url: "/audiotoScript/gujaratIrrigation.mp3",
        script: "Gujarat utilizes various irrigation methods including canal systems from major dams, drip irrigation in water-scarce regions, and traditional check dams called 'check dams'. The Sardar Sarovar project is crucial for water supply.",
        marks: 9,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 20,
        url: "/audiotoScript/gujaratAgroIndustries.mp3",
        script: "Gujarat's agro-industries include edible oil processing, dairy cooperatives like Amul, cotton textiles, and sugar mills. The state is a leader in food processing with major industrial clusters.",
        marks: 4,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 21,
        url: "/audiotoScript/gujaratIndustries.mp3",
        script: "Gujarat's industrial sector includes petrochemicals in Vadodara, pharmaceuticals in Ahmedabad, diamonds in Surat, and ceramics in Morbi. The state contributes significantly to India's industrial output.",
        marks: 1,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 22,
        url: "/audiotoScript/gujaratPorts.mp3",
        script: "Gujarat has India's longest coastline with major ports like Kandla, Mundra, and Pipavav. Special Economic Zones like the Gujarat International Finance Tec-City attract global investments.",
        marks: 7,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 23,
        url: "/audiotoScript/gujaratChallenges.mp3",
        script: "Industrial challenges in Gujarat include water scarcity in northern regions, pollution from chemical industries, and the need for skilled labor development. The state is addressing these through policy initiatives.",
        marks: 3,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 24,
        url: "/audiotoScript/gujaratHandicrafts.mp3",
        script: "Gujarat is renowned for its handicrafts including Patola silk sarees from Patan, Bandhani tie-dye textiles, intricate wood carvings from Sankheda, and silver jewelry from Kutch.",
        marks: 8,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 25,
        url: "/audiotoScript/gujaratFestivals.mp3",
        script: "Major festivals include Navratri with its famous Garba dance, the Kite Festival of Uttarayan, and the Rann Utsav in Kutch. Traditional dances include Garbi, Dandiya Raas, and Tippani.",
        marks: 5,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 26,
        url: "/audiotoScript/gujaratPilgrimage.mp3",
        script: "Important pilgrimage sites include the Somnath Temple, Dwarkadhish Temple, Ambaji Temple, and Palitana's Jain temples. The state attracts devotees of various faiths throughout the year.",
        marks: 10,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 27,
        url: "/audiotoScript/gujaratWildlife.mp3",
        script: "Gujarat's wildlife includes Asiatic lions in Gir National Park, wild asses in the Little Rann of Kutch, and flamingos in the Nal Sarovar. The state has 4 national parks and 23 wildlife sanctuaries.",
        marks: 2,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 28,
        url: "/audiotoScript/gujaratEnvironment.mp3",
        script: "Environmental challenges include desertification in Kutch, groundwater depletion, industrial pollution, and coastal erosion. Conservation efforts focus on water management and renewable energy adoption.",
        marks: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 29,
        url: "/audiotoScript/gujaratRenewable.mp3",
        script: "Gujarat leads in renewable energy with Asia's largest solar park at Charanka and significant wind power capacity. The state aims to generate 30% of its energy from renewable sources by 2030.",
        marks: 4,
        created_by_type: "admin",
        updated_by_type: "admin",
    }
];

const realWordQuestions = [
    //1: Location & Geography
    {
        quiz_id: 12,
        words: ["Gujarat", "Maharastra", "Arabian", "latitude", "Rajasthan", "longitude"],
        correct_answers: ["yes", "no", "yes", "yes", "yes", "yes"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    //2: Administrative Divisions
    {
        quiz_id: 13,
        words: ["Gandhinagar", "Ahmedabad", "collector", "taluka", "panchayt", "33"],
        correct_answers: ["yes", "yes", "yes", "yes", "no", "yes"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    //3: Historical Background
    {
        quiz_id: 14,
        words: ["Lothal", "Dholavira", "Maurya", "Solanki", "Mughals", "British", "Harappn"],
        correct_answers: ["yes", "yes", "yes", "yes", "yes", "yes", "no"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    //4: Landforms & Regions
    {
        quiz_id: 15,
        words: ["Kathiawar", "Kutch", "Rann", "Gir", "Sahyadri", "Aravalli"],
        correct_answers: ["yes", "yes", "yes", "yes", "no", "no"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    //5: Rivers of Gujarat
    {
        quiz_id: 16,
        words: ["Narmada", "Tapi", "Sabarmati", "Godavri", "Mahi", "Saraswati"],
        correct_answers: ["yes", "yes", "yes", "no", "yes", "no"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    //6: Climate & Soils
    {
        quiz_id: 17,
        words: ["monsoon", "blacksoil", "alluvial", "laterite", "arid", "kharif"],
        correct_answers: ["yes", "yes", "yes", "no", "yes", "yes"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    //7: Major Crops
    {
        quiz_id: 18,
        words: ["cotton", "groundnut", "wheat", "tea", "castor", "rubber"],
        correct_answers: ["yes", "yes", "yes", "no", "yes", "no"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    //8: Irrigation Methods
    {
        quiz_id: 19,
        words: ["drip", "sprinkler", "canal", "well", "checkdam", "terrace"],
        correct_answers: ["yes", "yes", "yes", "yes", "yes", "no"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    //9: Agro-Based Industries
    {
        quiz_id: 20,
        words: ["Amul", "oilmill", "textile", "sugar", "ceramic", "pharma"],
        correct_answers: ["yes", "yes", "yes", "yes", "no", "no"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    //10: Key Industries
    {
        quiz_id: 21,
        words: ["petrochemical", "diamond", "pharma", "ceramic", "automobile", "steel"],
        correct_answers: ["yes", "yes", "yes", "yes", "no", "no"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    //11: Ports & SEZs
    {
        quiz_id: 22,
        words: ["Kandla", "Mundra", "Pipavav", "GIFT", "Dholera", "Surat"],
        correct_answers: ["yes", "yes", "yes", "yes", "yes", "no"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    //12: Industrial Challenges
    {
        quiz_id: 23,
        words: ["pollution", "water", "skillgap", "electricity", "corruption", "land"],
        correct_answers: ["yes", "yes", "yes", "no", "no", "yes"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    //13: Art & Handicrafts
    {
        quiz_id: 24,
        words: ["Patola", "Bandhani", "Sankheda", "Kutch", "embroidry", "pottery"],
        correct_answers: ["yes", "yes", "yes", "yes", "yes", "no"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    //14: Festivals & Dance
    {
        quiz_id: 25,
        words: ["Navratri", "Garba", "Uttarayan", "Diwali", "Tippani", "Dandiya"],
        correct_answers: ["yes", "yes", "yes", "no", "yes", "yes"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    //15: Pilgrimage Sites
    {
        quiz_id: 26,
        words: ["Somnath", "Dwarka", "Ambaji", "Palitana", "Pavagadh", "Modhera"],
        correct_answers: ["yes", "yes", "yes", "yes", "yes", "yes"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    //16: Wildlife & Sanctuaries
    {
        quiz_id: 27,
        words: ["Gir", "lion", "flamingo", "NalSarovar", "wildass", "tiger"],
        correct_answers: ["yes", "yes", "yes", "yes", "yes", "no"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    //17: Environmental Challenges
    {
        quiz_id: 28,
        words: ["desertification", "erosion", "pollution", "deforestation", "water", "noise"],
        correct_answers: ["yes", "yes", "yes", "yes", "yes", "no"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    //18: Renewable Energy
    {
        quiz_id: 29,
        words: ["solar", "wind", "charanka", "biogas", "hydropower", "nuclear"],
        correct_answers: ["yes", "yes", "yes", "yes", "no", "no"],
        created_by_type: "admin",
        updated_by_type: "admin",
    }
];

const summarizePassageQuestions = [
    {
        quiz_id: 12,
        passage: `Gujarat is a state located on the western coast of India, encompassing the Kathiawar Peninsula and the surrounding mainland. It shares borders with Rajasthan, Madhya Pradesh, and Maharashtra, and has a coastline along the Arabian Sea. The state's strategic location has made it a hub for trade and commerce.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 13,
        passage: `Gujarat is administratively divided into districts, talukas, and villages to ensure efficient governance. Each district is headed by a District Collector, while smaller regions are managed by local authorities. This system helps streamline public services and administrative tasks across the state.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 14,
        passage: `Gujarat has a rich historical background, from the ancient Indus Valley Civilization to the rule of Mauryas, Chalukyas, and Mughals. It has been an important region for trade, culture, and spirituality. Historical monuments, inscriptions, and archaeological sites are spread across the state.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 15,
        passage: `Gujarat's landforms are diverse, including plains, hills, plateaus, and coastal regions. The Rann of Kutch, Gir Hills, and the coastal belt offer geographical variety. These landforms contribute to the state's agriculture, tourism, and biodiversity.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 16,
        passage: `Gujarat is home to several important rivers such as the Narmada, Tapi, Sabarmati, and Mahi. These rivers play a crucial role in irrigation, agriculture, and providing drinking water. Many of these rivers originate in neighboring states and flow through Gujarat into the Arabian Sea.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 17,
        passage: `Gujarat exhibits diverse climatic conditions, ranging from arid regions in Kutch to sub-humid areas in the south. The state experiences extreme temperatures, with hot summers and mild winters. Soil types vary across regions, including black cotton soil, alluvial soil, and saline soils, supporting a variety of agricultural practices.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 18,
        passage: `Gujarat's agriculture is diverse, with major crops including cotton, groundnut, rice, wheat, and sugarcane. The state's varied climate and soil types enable the cultivation of both food and cash crops, contributing significantly to its economy.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 19,
        passage: `Irrigation in Gujarat is facilitated through various methods, including canal systems, tube wells, and modern techniques like drip and sprinkler irrigation. Projects like the Sardar Sarovar Dam and the Sujalam Sufalam Yojana have enhanced water availability, supporting agriculture in arid regions.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 20,
        passage: `Agro-based industries in Gujarat, such as cotton textiles, sugar mills, and oilseed processing units, play a vital role in the state's economy. These industries utilize locally produced agricultural raw materials, adding value and providing employment opportunities in rural areas.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 21,
        passage: `Gujarat is a leading industrial state in India, with key sectors including petrochemicals, pharmaceuticals, automobiles, and information technology. Industrial hubs like Ahmedabad, Vadodara, and Surat have attracted significant investments, contributing to the state's economic growth.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 22,
        passage: `Gujarat's strategic location along the Arabian Sea has led to the development of several major ports, including Mundra, Kandla, and Hazira. The state also hosts Special Economic Zones (SEZs) that promote export-oriented industries, boosting trade and employment.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 23,
        passage: `Despite its industrial success, Gujarat faces challenges such as environmental degradation, resource depletion, and socio-economic disparities. Addressing issues like pollution, sustainable development, and inclusive growth are essential for the state's long-term prosperity.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 24,
        passage: `Gujarat boasts a rich tradition of arts and handicrafts, including embroidery, beadwork, pottery, and textile weaving. These crafts reflect the state's cultural heritage and provide livelihoods to many artisans, contributing to the preservation of traditional skills.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 25,
        passage: `Gujarat's festivals and dances, such as Navratri with its Garba and Dandiya Raas performances, showcase the state's vibrant cultural life. These celebrations foster community spirit and attract tourists, highlighting Gujarat's rich traditions and hospitality.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 26,
        passage: `Gujarat is home to numerous pilgrimage sites, including the Somnath and Dwarkadhish temples, attracting devotees from across the country. These religious centers are integral to the state's spiritual landscape and cultural identity.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 27,
        passage: `Gujarat's diverse ecosystems support a variety of wildlife, with sanctuaries like Gir 
    National Park, home to the Asiatic lion, and the Marine National Park in the Gulf of Kutch. 
    Conservation efforts aim to protect these habitats and the species they harbor.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 28,
        passage: `Environmental challenges in Gujarat include pollution, deforestation, and water scarcity. Initiatives focusing on sustainable practices, afforestation, and pollution control are crucial to mitigate these issues and ensure ecological balance.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 29,
        passage: `Gujarat is a leader in renewable energy, with significant investments in solar and wind power. The state's initiatives contribute to sustainable energy production and reduce dependence on fossil fuels.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    }
];

const bestOptionQuestions = [
    {
        quiz_id: 12,
        passage: "Gujarat is a state on the ____ coast of India, including the Kathiawar Peninsula and sharing a border with _____. Its location makes it a hub for ____ and commerce.",
        blanked_words: [
            { word: "western", options: ["western", "eastern", "northern", "southern"], position: 1 },
            { word: "Rajasthan", options: ["Rajasthan", "Maharashtra", "Madhya Pradesh", "Punjab"], position: 2 },
            { word: "trade", options: ["trade", "agriculture", "industry", "tourism"], position: 3 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 13,
        passage: "Gujarat is divided into ____ for governance. Each district is headed by a ____ Collector and smaller areas are managed by ____ authorities.",
        blanked_words: [
            { word: "districts", options: ["districts", "states", "regions", "zones"], position: 1 },
            { word: "District", options: ["District", "State", "Regional", "Local"], position: 2 },
            { word: "local", options: ["local", "state", "central", "regional"], position: 3 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 14,
        passage: "Gujarat has a rich ____ history, including the Indus Valley Civilization and the rule of ____ and Mughals. The state has many historical ____.",
        blanked_words: [
            { word: "cultural", options: ["cultural", "political", "economic", "social"], position: 1 },
            { word: "Mauryas", options: ["Mauryas", "Guptas", "Cholas", "Pallavas"], position: 2 },
            { word: "monuments", options: ["monuments", "temples", "forts", "palaces"], position: 3 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 15,
        passage: "The state's geography includes plains, hills, and the ____ of Kutch. These landforms impact agriculture, ____ and tourism.",
        blanked_words: [
            { word: "Rann", options: ["Rann", "Desert", "Plateau", "Valley"], position: 1 },
            { word: "biodiversity", options: ["biodiversity", "agriculture", "climate", "economy"], position: 2 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 16,
        passage: "Rivers like the ____ and Sabarmati provide water for ____ and daily use. Most rivers eventually flow into the ____ Sea.",
        blanked_words: [
            { word: "Narmada", options: ["Narmada", "Tapi", "Mahi", "Godavari"], position: 1 },
            { word: "irrigation", options: ["irrigation", "drinking", "industrial", "domestic"], position: 2 },
            { word: "Arabian", options: ["Arabian", "Bay of Bengal", "Indian Ocean", "Mediterranean"], position: 3 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 17,
        passage: "Gujarat experiences varied ____ conditions, from arid Kutch to humid south. Soils include black cotton, alluvial, and ____ soils.",
        blanked_words: [
            { word: "climatic", options: ["climatic", "weather", "environmental", "atmospheric"], position: 1 },
            { word: "saline", options: ["saline", "alkaline", "acidic", "neutral"], position: 2 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 18,
        passage: "Main crops in Gujarat include cotton, ____, and wheat. Its diverse climate and soil types support both food and ____ crops.",
        blanked_words: [
            { word: "groundnut", options: ["groundnut", "soybean", "sunflower", "sesame"], position: 1 },
            { word: "cash", options: ["cash", "food", "fiber", "oil"], position: 2 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 19,
        passage: "Irrigation in Gujarat uses canals, tube wells, and modern systems like ____ irrigation. Projects like Sardar Sarovar and ____ Sufalam aid water supply.",
        blanked_words: [
            { word: "drip", options: ["drip", "sprinkler", "flood", "furrow"], position: 1 },
            { word: "Sujalam", options: ["Sujalam", "Sardar", "Narmada", "Sabarmati"], position: 2 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 20,
        passage: "Gujarat's agro-based industries include textile mills, oilseed processing, and ____. These use local raw materials and generate rural ____.",
        blanked_words: [
            { word: "sugar mills", options: ["sugar mills", "rice mills", "flour mills", "oil mills"], position: 1 },
            { word: "employment", options: ["employment", "income", "development", "growth"], position: 2 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 21,
        passage: "Major industries in Gujarat include petrochemicals, ____, and automobiles. Cities like Ahmedabad and ____ are key industrial hubs.",
        blanked_words: [
            { word: "pharmaceuticals", options: ["pharmaceuticals", "textiles", "cement", "steel"], position: 1 },
            { word: "Surat", options: ["Surat", "Vadodara", "Rajkot", "Bhavnagar"], position: 2 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 22,
        passage: "Gujarat has major ports like ____ and Kandla. It also has several ____ Economic Zones that encourage trade and exports.",
        blanked_words: [
            { word: "Mundra", options: ["Mundra", "Mumbai", "Chennai", "Kolkata"], position: 1 },
            { word: "Special", options: ["Special", "Free", "Export", "Industrial"], position: 2 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 23,
        passage: "Challenges in Gujarat include pollution, water scarcity, and economic ____. Sustainable growth requires environmental and social ____.",
        blanked_words: [
            { word: "inequality", options: ["inequality", "poverty", "unemployment", "development"], position: 1 },
            { word: "balance", options: ["balance", "equity", "justice", "harmony"], position: 2 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 24,
        passage: "Gujarat's handicrafts include embroidery, ____, and pottery. These traditional skills reflect its cultural ____.",
        blanked_words: [
            { word: "beadwork", options: ["beadwork", "weaving", "painting", "sculpture"], position: 1 },
            { word: "heritage", options: ["heritage", "tradition", "culture", "history"], position: 2 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 25,
        passage: "Festivals like ____ are celebrated with dances such as Garba and Dandiya. These events promote cultural identity and attract ____.",
        blanked_words: [
            { word: "Navratri", options: ["Navratri", "Diwali", "Holi", "Raksha Bandhan"], position: 1 },
            { word: "tourists", options: ["tourists", "devotees", "visitors", "pilgrims"], position: 2 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 26,
        passage: "Gujarat has pilgrimage sites such as Somnath and ____. These attract devotees and are key to the state's spiritual ____.",
        blanked_words: [
            { word: "Dwarka", options: ["Dwarka", "Badrinath", "Kedarnath", "Rameshwaram"], position: 1 },
            { word: "identity", options: ["identity", "heritage", "culture", "tradition"], position: 2 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 27,
        passage: "Wildlife in Gujarat includes the Asiatic ____ found in Gir. The Marine National Park in the Gulf of ____ protects marine species.",
        blanked_words: [
            { word: "lion", options: ["lion", "tiger", "leopard", "cheetah"], position: 1 },
            { word: "Kutch", options: ["Kutch", "Cambay", "Khambhat", "Gulf of Mannar"], position: 2 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 28,
        passage: "Gujarat faces environmental issues like deforestation and ____. Solutions include afforestation, sustainable use of resources, and pollution ____.",
        blanked_words: [
            { word: "pollution", options: ["pollution", "erosion", "desertification", "flooding"], position: 1 },
            { word: "control", options: ["control", "prevention", "management", "reduction"], position: 2 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 29,
        passage: "Gujarat is investing in renewable energy, especially ____ and solar power. These initiatives reduce reliance on fossil ____.",
        blanked_words: [
            { word: "wind", options: ["wind", "hydro", "nuclear", "biomass"], position: 1 },
            { word: "fuels", options: ["fuels", "coal", "oil", "gas"], position: 2 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    }
];

const insertDefaultCourseGujratGeographyData = async () => {
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
            topicsToAdd = basicTopics.filter(topic => topic.module_id === module.id);

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
            if ((assignmentData.module_id <= 18)) {
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
            if ((quizData.module_id <= 18)) {
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

module.exports = insertDefaultCourseGujratGeographyData;
