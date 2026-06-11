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
    { category: "Science", id: 2 },
];

const courses = [
    {
        id: 2,
        title: "Exploring the Solar System: A Deep Dive into Planetary Science",
        category_id: 2,
        description: "Explore the solar system in depth, from planetary formation and orbital mechanics to astrobiology and current space missions. Ideal for learners aged 15–25 with a strong curiosity about space and science.",
        price: 120.0,
        discount: 15,
        duration_minutes: 12 * 60, // 12 hours in minutes
        expiry_days: 180,
        min_access_minutes: 60,
        max_access_minutes: 90,
        what_you_will_learn: [
            "Solar System Formation",
            "Orbital Mechanics & Kepler's Laws",
            "Planetary Geology & Atmospheres",
            "Gas/Ice Giants & Moons",
            "Asteroids, Comets & Dwarf Planets",
            "Current & Future Space Missions",
            "Habitability & Astrobiology",
            "Planetary Protection & Space Ethics",
        ],
        skill_development: [
            {
                title: "Astronomical Observation",
                statements: ["Learn how to identify planets and constellations.", "Understand basic telescope usage and star mapping."]
            },
            {
                title: "Scientific Reasoning",
                statements: ["Analyze planetary data to draw conclusions.", "Apply Kepler's laws to calculate orbital mechanics."]
            },
            {
                title: "Space Exploration Context",
                statements: ["Evaluate past and future mission objectives.", "Understand the ethical implications of space exploration."]
            }
        ],
        prerequisites: ["Basic Astronomy", "High School Science"],
        hashtags: ["#space", "#solarsystem", "#planetaryscience"],
        thumbnail: "/course/thumbnail/solar_thumbnail.jpg",
        preview_video: "/course/preview_video/solar_preview.mp4",
        created_by_type: "admin",
        updated_by_type: "admin",
    },
];

const courseFAQs = [
    {
        course_id: 2,
        question: "What interests you most about the solar system?",
        created_by: 1,
        updated_by: 1,
        created_by_type: "admin",
        updated_by_type: "admin",
        options: [
            "Planetary formation and origins",
            "Space missions and technology",
            "Possibility of life beyond Earth",
            "Astronomy and astrophysics"
        ]
    },
    {
        course_id: 2,
        question: "What is your current knowledge level about space science?",
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
        course_id: 2,
        question: "What do you hope to do after completing this course?",
        created_by: 1,
        updated_by: 1,
        created_by_type: "admin",
        updated_by_type: "admin",
        options: [
            "Pursue studies or career in astronomy/space science",
            "Participate in space-related research or projects",
            "Enhance general knowledge about the universe",
            "Prepare for academic exams or competitions"
        ]
    },
    {
        course_id: 2,
        question: "How much time can you dedicate weekly to this course?",
        created_by: 1,
        updated_by: 1,
        created_by_type: "admin",
        updated_by_type: "admin",
        options: [
            "Less than 5 hours",
            "5-10 hours",
            "10-15 hours",
            "More than 15 hours"
        ]
    },
    {
        course_id: 2,
        question: "What motivates you to learn about space?",
        created_by: 1,
        updated_by: 1,
        created_by_type: "admin",
        updated_by_type: "admin",
        options: [
            "Curiosity about the universe",
            "Interest in science and technology",
            "Dream of working in space exploration",
            "Desire to understand our place in the cosmos"
        ]
    },
];

const sessions = [
    {
        course_id: 2,
        title: "Solar System Origins and the Sun",
        chpater_description: "Understand the formation of the solar system, planetary classification, orbital mechanics, and explore the Sun's structure, fusion process, and solar activity impacts.",
        status: "active",
        image_name: "solar_thumbnail.jpg",
        image_path: "/session/images/solar_thumbnail.jpg",
        min_time_in_minute: 110,  // 60 + 50 merged
    },
    {
        course_id: 2,
        title: "Planets, Moons, and Small Bodies",
        chpater_description: "Study terrestrial planets' geology and atmospheres, gas and ice giants' interiors and magnetospheres, and explore moons, dwarf planets, asteroids, and comets of the solar system.",
        status: "active",
        image_name: "solar_thumbnail.jpg",
        image_path: "/session/images/solar_thumbnail.jpg",
        min_time_in_minute: 155,  // 55 + 50 + 55 + 45 merged (some trimming implied)
    },
    {
        course_id: 2,
        title: "Exploration Missions and Astrobiology",
        chpater_description: "Review past, present, and future robotic missions, and investigate habitability conditions and astrobiology of solar system bodies.",
        status: "active",
        image_name: "solar_thumbnail.jpg",
        image_path: "/session/images/solar_thumbnail.jpg",
        min_time_in_minute: 110,  // 60 + 50 merged
    },
    {
        course_id: 2,
        title: "Space Ethics, Protection, and Final Assessment",
        chpater_description: "Understand planetary protection, space ethics, and synthesize knowledge through a comprehensive capstone project or exam.",
        status: "active",
        image_name: "solar_thumbnail.jpg",
        image_path: "/session/images/solar_thumbnail.jpg",
        min_time_in_minute: 130,  // 40 + 90 merged
    },
];

const modules = [
    // Session 1: Solar System Formation & The Sun
    {
        course_id: 2,
        session_id: 6,
        title: "Origins of the Solar System",
        image: "/module/image/solar_thumbnail.jpg",
        description: "Explore the formation of the solar system and planetary classification.",
        duration_minutes: 0.75 * 60, // 0.75 hours in minutes
        status: "active",
    },
    {
        course_id: 2,
        session_id: 6,
        title: "Structure of the Sun",
        image: "/module/image/solar_thumbnail.jpg",
        description: "Learn about the layers of the Sun and the fusion process.",
        duration_minutes: 0.75 * 60,
        status: "active",
    },

    // Session 2: Planets & Moons
    {
        course_id: 2,
        session_id: 7,
        title: "Geology of Terrestrial Planets",
        image: "/module/image/solar_thumbnail.jpg",
        description: "Study the surface geology and internal structure of Mercury, Venus, Earth, and Mars.",
        duration_minutes: 0.75 * 60,
        status: "active",
    },
    {
        course_id: 2,
        session_id: 7,
        title: "Geological Activity of Solar System Moons",
        image: "/module/image/solar_thumbnail.jpg",
        description: "Discover volcanic and tectonic activities on moons like Europa and Enceladus.",
        duration_minutes: 0.75 * 60,
        status: "active",
    },

    // Session 3: Solar System Missions & Habitability
    {
        course_id: 2,
        session_id: 8,
        title: "Past and Present Space Missions",
        image: "/module/image/solar_thumbnail.jpg",
        description: "Review robotic and manned missions and their scientific contributions.",
        duration_minutes: 0.75 * 60,
        status: "active",
    },
    {
        course_id: 2,
        session_id: 8,
        title: "Conditions for Habitability",
        image: "/module/image/solar_thumbnail.jpg",
        description: "Examine the environmental and chemical conditions necessary for life.",
        duration_minutes: 0.75 * 60,
        status: "active",
    },

    // Session 4: Ethics, Protection & Final Project
    {
        course_id: 2,
        session_id: 9,
        title: "Planetary Protection Policies",
        image: "/module/image/solar_thumbnail.jpg",
        description: "Understand the policies designed to avoid contamination of celestial bodies.",
        duration_minutes: 0.75 * 60,
        status: "active",
    },
    {
        course_id: 2,
        session_id: 9,
        title: "Capstone Project Execution",
        image: "/module/image/solar_thumbnail.jpg",
        description: "Apply knowledge by completing a comprehensive project.",
        duration_minutes: 1 * 60,
        status: "active",
    },
];


const solarSystemHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Exploring the Solar System</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background: linear-gradient(135deg, #000000, #0a192f);
            color: #e6f1ff;
            font-family: 'Space Grotesk', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            background-attachment: fixed;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .solar-guide {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 30px;
            position: relative;
        }
        
        .solar-guide header {
            background: linear-gradient(to right, #0a2342, #126e82);
            padding: 60px 30px;
            border-radius: 20px;
            text-align: center;
            margin-bottom: 50px;
            box-shadow: 0 15px 40px rgba(0,0,0,0.4);
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(100, 255, 218, 0.15);
        }
        
        .solar-guide header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2022&auto=format&fit=crop') center/cover no-repeat;
            opacity: 0.15;
            filter: blur(2px);
        }
        
        .solar-guide header * {
            position: relative;
        }
        
        .solar-guide h1 {
            margin: 0;
            font-size: 3.5em;
            font-weight: 700;
            text-shadow: 0 2px 15px rgba(0,0,0,0.4);
            background: linear-gradient(to right, #64ffda, #48cae4);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            margin-bottom: 20px;
            letter-spacing: -0.5px;
        }
        
        .solar-guide header p {
            font-size: 1.4em;
            color: #a8dadc;
            max-width: 700px;
            margin: 0 auto;
            font-weight: 300;
            letter-spacing: 0.5px;
        }
        
        .solar-guide h2 {
            font-size: 2.2em;
            color: #64ffda;
            margin-bottom: 25px;
            font-weight: 600;
            border-bottom: none;
            position: relative;
            padding-bottom: 15px;
            letter-spacing: -0.5px;
        }
        
        .solar-guide h2::after {
            content: '';
            position: absolute;
            left: 0;
            bottom: 0;
            width: 80px;
            height: 4px;
            background: linear-gradient(to right, #64ffda, #48cae4);
            border-radius: 2px;
        }
        
        .planet-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin: 40px 0;
        }
        
        .planet-card {
            background: rgba(10, 25, 47, 0.7);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 35px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            border: 1px solid rgba(100, 255, 218, 0.1);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            overflow: hidden;
        }
        
        .planet-card::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(100, 255, 218, 0.05) 0%, transparent 60%);
            transform: rotate(45deg);
            opacity: 0;
            transition: opacity 0.5s ease;
        }
        
        .planet-card:hover {
            transform: translateY(-15px) scale(1.03);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            border-color: rgba(100, 255, 218, 0.3);
        }
        
        .planet-card:hover::before {
            opacity: 1;
        }
        
        .planet-card h3 {
            color: #64ffda;
            margin-bottom: 18px;
            font-size: 1.7em;
            position: relative;
        }
        
        .planet-card p {
            position: relative;
        }
        
        .solar-guide section {
            background: rgba(16, 32, 58, 0.7);
            backdrop-filter: blur(10px);
            padding: 50px;
            border-radius: 20px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.3);
            margin-bottom: 50px;
            border: 1px solid rgba(100, 255, 218, 0.1);
            position: relative;
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .solar-guide section:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        
        .solar-guide section::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 150px;
            height: 150px;
            background: radial-gradient(circle, rgba(100, 255, 218, 0.1) 0%, transparent 70%);
            border-radius: 50%;
        }
        
        .solar-guide p {
            color: #ccd6f6;
            margin-bottom: 20px;
            font-size: 1.15em;
            line-height: 1.8;
            position: relative;
        }
        
        .solar-guide ul {
            padding-left: 25px;
            margin: 25px 0;
            list-style-type: none;
        }
        
        .solar-guide li {
            margin-bottom: 20px;
            color: #a8b2d1;
            position: relative;
            padding-left: 30px;
        }
        
        .solar-guide li::before {
            content: '';
            position: absolute;
            left: 0;
            top: 10px;
            width: 8px;
            height: 8px;
            background-color: #64ffda;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(100, 255, 218, 0.5);
        }
        
        .solar-guide li strong {
            color: #64ffda;
            font-weight: 600;
            display: block;
            margin-bottom: 5px;
            font-size: 1.1em;
        }
        
        .solar-guide footer {
            text-align: center;
            margin-top: 80px;
            padding: 30px;
            font-size: 0.95em;
            color: #8892b0;
            border-top: 1px solid rgba(100, 255, 218, 0.1);
            position: relative;
        }
        
        .cosmic-button {
            display: inline-block;
            background: linear-gradient(135deg, #0a2342, #126e82);
            color: #e6f1ff;
            padding: 15px 35px;
            border-radius: 40px;
            margin-top: 25px;
            font-weight: 500;
            text-decoration: none;
            box-shadow: 0 8px 20px rgba(0,0,0,0.3);
            border: 1px solid rgba(100, 255, 218, 0.2);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            letter-spacing: 0.5px;
        }
        
        .cosmic-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #126e82, #0a2342);
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .cosmic-button:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 25px rgba(0,0,0,0.4);
        }
        
        .cosmic-button:hover::before {
            opacity: 1;
        }
        
        .star-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
        }
        
        .planet-icon {
            position: absolute;
            width: 150px;
            height: 150px;
            opacity: 0.1;
            filter: blur(1px);
        }
        
        .jupiter-bg {
            top: 30%;
            right: -50px;
            background: radial-gradient(circle, rgba(255, 165, 0, 0.2) 0%, transparent 70%);
            border-radius: 50%;
            width: 300px;
            height: 300px;
            animation: float 20s infinite alternate ease-in-out;
        }
        
        .saturn-bg {
            bottom: 10%;
            left: -80px;
            background: radial-gradient(circle, rgba(210, 180, 140, 0.2) 0%, transparent 70%);
            border-radius: 50%;
            width: 400px;
            height: 400px;
            animation: float 25s infinite alternate-reverse ease-in-out;
        }
        
        @keyframes float {
            0% { transform: translate(0, 0) rotate(0deg); }
            100% { transform: translate(30px, 30px) rotate(5deg); }
        }
        
        @media (max-width: 768px) {
            .solar-guide h1 {
                font-size: 2.5em;
            }
            
            .solar-guide h2 {
                font-size: 1.8em;
            }
            
            .solar-guide section {
                padding: 30px 25px;
            }
            
            .planet-grid {
                grid-template-columns: 1fr;
            }
            
            .planet-card {
                padding: 25px;
            }
            
            .cosmic-button {
                padding: 12px 25px;
            }
            
            .jupiter-bg, .saturn-bg {
                display: none;
            }
        }
        
        /* Orbit animation for decorative elements */
        @keyframes orbit {
            0% { transform: rotate(0deg) translateX(100px) rotate(0deg); }
            100% { transform: rotate(360deg) translateX(100px) rotate(-360deg); }
        }
        
        /* Pulse animation for stars */
        @keyframes pulse {
            0% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); opacity: 0.8; }
        }
        
        .bright-star {
            position: absolute;
            width: 4px;
            height: 4px;
            background-color: #64ffda;
            border-radius: 50%;
            box-shadow: 0 0 10px 2px rgba(100, 255, 218, 0.8);
            animation: pulse 3s infinite ease-in-out;
        }
        
        .bright-star:nth-child(1) { top: 15%; left: 10%; animation-delay: 0s; }
        .bright-star:nth-child(2) { top: 25%; right: 20%; animation-delay: 0.5s; }
        .bright-star:nth-child(3) { bottom: 30%; left: 15%; animation-delay: 1s; }
        .bright-star:nth-child(4) { bottom: 10%; right: 10%; animation-delay: 1.5s; }
        .bright-star:nth-child(5) { top: 50%; left: 50%; animation-delay: 2s; }
    </style>
</head>
<body>
    <div class="star-bg">
        <div class="jupiter-bg planet-icon"></div>
        <div class="saturn-bg planet-icon"></div>
        <div class="bright-star"></div>
        <div class="bright-star"></div>
        <div class="bright-star"></div>
        <div class="bright-star"></div>
        <div class="bright-star"></div>
    </div>
    
    <div class="solar-guide">
        <header>
            <h1>Exploring the Solar System</h1>
            <p>A Deep Dive into Planetary Science and Celestial Wonders</p>
        </header>

        <section>
            <h2>What is the Solar System?</h2>
            <p>The solar system is an intricate cosmic family centered around the Sun, a medium-sized star. It consists of eight planets, their moons, dwarf planets, numerous asteroids, comets, and interplanetary dust and gas. These objects orbit the Sun due to its gravitational pull, creating a dynamic and complex system that has evolved over 4.6 billion years.</p>
            <p>Understanding the solar system not only reveals our origins but also helps us comprehend broader astrophysical processes and the potential for life beyond Earth.</p>
            <a href="#" class="cosmic-button">Start Your Cosmic Journey</a>
        </section>

        <section>
            <h2>Key Components of the Solar System</h2>
            
            <div class="planet-grid">
                <div class="planet-card">
                    <h3>The Sun</h3>
                    <p>The heart of the solar system, the Sun is a glowing ball of hot plasma, primarily hydrogen and helium, that generates energy through nuclear fusion. It provides the light and heat essential for life on Earth.</p>
                </div>
                
                <div class="planet-card">
                    <h3>Terrestrial Planets</h3>
                    <p>Mercury, Venus, Earth, and Mars are rocky planets with solid surfaces. They vary greatly in atmosphere, temperature, and geological activity, offering diverse environments to study.</p>
                </div>
                
                <div class="planet-card">
                    <h3>Gas Giants</h3>
                    <p>Jupiter and Saturn are massive planets mostly composed of hydrogen and helium, with thick atmospheres and numerous moons. Their powerful magnetic fields and storm systems like Jupiter's Great Red Spot are subjects of ongoing research.</p>
                </div>
                
                <div class="planet-card">
                    <h3>Ice Giants</h3>
                    <p>Uranus and Neptune contain more ices such as water, ammonia, and methane. Their deep blue color and unique magnetic fields make them intriguing worlds in the outer solar system.</p>
                </div>
                
                <div class="planet-card">
                    <h3>Small Bodies</h3>
                    <p>Asteroids and comets are remnants of the early solar system. Dwarf planets like Pluto and Eris challenge our understanding of planetary classification. Moons across the solar system show fascinating geology and, in some cases, hints of subsurface oceans.</p>
                </div>
            </div>
        </section>

        <section>
            <h2>Why Study the Solar System?</h2>
            <p>Exploring the solar system helps us answer fundamental questions about how planetary systems form and evolve. By studying planetary atmospheres, geology, and magnetic fields, scientists can compare Earth to its neighbors and identify what makes it hospitable for life.</p>
            <p>Moreover, investigating moons with subsurface oceans, such as Europa or Enceladus, expands the search for extraterrestrial life, while understanding asteroid composition supports planetary defense efforts.</p>
        </section>

        <section>
            <h2>Exploration and Missions</h2>
            <ul>
                <li><strong>Robotic Probes:</strong> Missions like Voyager, Cassini, and New Horizons have transformed our knowledge by visiting distant planets and moons, sending back detailed images and data.</li>
                <li><strong>Space Telescopes:</strong> Instruments like the Hubble Space Telescope observe solar phenomena and distant planetary systems, enriching our understanding of the universe.</li>
                <li><strong>Future Missions:</strong> Upcoming projects aim to land humans on Mars, probe icy moons for signs of life, and deploy more sophisticated orbiters to study planetary atmospheres and surfaces.</li>
            </ul>
        </section>

        <section>
            <h2>Key Concepts and Theories</h2>
            <ul>
                <li><strong>Solar Nebula Theory:</strong> Explains the solar system's origin from a rotating cloud of gas and dust collapsing under gravity.</li>
                <li><strong>Planetary Differentiation:</strong> Process where planets separate into layers like core, mantle, and crust due to heating.</li>
                <li><strong>Orbital Mechanics:</strong> The laws governing the movement of objects around the Sun and each other, including Kepler's laws and Newtonian gravity.</li>
                <li><strong>Astrobiology:</strong> Study of life's potential in the universe, focusing on habitable environments in our solar system.</li>
            </ul>
        </section>

        <section>
            <h2>Conclusion</h2>
            <p>The solar system offers a magnificent laboratory to understand planetary science, space exploration, and the potential for life beyond Earth. This course invites you to embark on an exciting journey through space, exploring the mysteries and marvels of our celestial neighborhood.</p>
            <p>Prepare to deepen your knowledge, engage with scientific discoveries, and fuel your curiosity about the cosmos.</p>
        </section>

        <footer>
            &copy; 2025 E-Learn Platform | Inspired by the wonders of space science.
        </footer>
    </div>

    <script>
    document.addEventListener('DOMContentLoaded', function() {
        const starBg = document.querySelector('.star-bg');

        // Create stars
        for (let i = 0; i < 300; i++) {
            const star = document.createElement('div');
            star.style.position = 'absolute';
            star.style.width = Math.random() * 3 + 'px';
            star.style.height = star.style.width;
            star.style.backgroundColor = '#ffffff';
            star.style.borderRadius = '50%';
            star.style.opacity = Math.random() * 0.8 + 0.2;

            // Position randomly
            star.style.top = Math.random() * 100 + '%';
            star.style.left = Math.random() * 100 + '%';

            // Add twinkling animation
            star.style.animation = 'twinkle ' + (Math.random() * 5 + 3) + 's infinite alternate';

            starBg.appendChild(star);
        }

        // Add keyframes for twinkling
        const styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        styleSheet.innerText = '@keyframes twinkle { 0% { opacity: ' + (Math.random() * 0.5 + 0.1) + '; } 100% { opacity: ' + (Math.random() * 0.5 + 0.5) + '; } }';
        document.head.appendChild(styleSheet);
    });
    </script>

</body>
</html>
`;

const basicTopics = [
    // Session 1: Solar System Formation & The Sun
    {
        module_id: 6,
        title: "Origins of the Solar System - Intro Video",
        description: "Explore the formation of the solar system and planetary classification.",
        content_type: "video",
        video: {
            url: "/video/videoplayback.mp4",
            duration_minutes: 15,
            transcript: "Welcome to the origins of the Solar System...",
            audio_url: "/audios/video/videoplayback.mp3",
            bullet_points: [
                { time: 0, text: "Formation theories" },
                { time: 300, text: "Planetary classification" },
            ],
        },
    },
    {
        module_id: 6,
        title: "Nebular Hypothesis Explained - Slide",
        description: "Dive deeper into the most accepted theory of solar system formation.",
        content_type: "slide",
        slides: [
            {
                title: "Introduction to the Nebular Hypothesis",
                description: "Basics of the nebular hypothesis and its historical context.",
                content_type: "video",
                video: {
                    url: "/multiSlide/video/solarSystemOrigins.mp4",
                    duration_minutes: 6,
                    audio_url: "/audios/slide_video/solar_preview.mp3",
                },
            },
            // {
            //     title: "Stages of Solar System Formation",
            //     description: "From gas cloud collapse to planetesimal formation.",
            //     content_type: "audio",
            //     audio: {
            //         url: "/multiSlide/audio/videoplayback.mp3",
            //         duration_minutes: 5,
            //     },
            // },
        ],
    },
    {
        module_id: 7,
        title: "Structure of the Sun - Accordion",
        description: "Learn about the layers of the Sun and the fusion process.",
        content_type: "accordian",
        accordions: [
            {
                title: "Sun's Layers",
                body: "The Sun has layers including the core, radiative zone, and convective zone.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/solar_preview.mp3",
            },
            {
                title: "Nuclear Fusion",
                body: "Fusion is the process powering the Sun, converting hydrogen into helium.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/videoplayback.mp3",
            },
            {
                title: "The Photosphere",
                body: "The photosphere is the visible surface of the Sun from which light is emitted.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/solar_preview.mp3",
            },
            {
                title: "The Chromosphere",
                body: "A thin layer above the photosphere characterized by reddish glow during solar eclipses.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/videoplayback.mp3",
            },
            {
                title: "The Corona",
                body: "The Sun's outer atmosphere, visible during eclipses, with extremely high temperatures.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/solar_preview.mp3",
            },
            {
                title: "Solar Wind",
                body: "Streams of charged particles ejected from the Sun's corona influencing space weather.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/videoplayback.mp3",
            },
        ],
    },
    {
        module_id: 7,
        title: "Solar Flares & Sunspots - General PDF",
        description: "Understand solar activity and its impact on Earth and space missions.",
        content_type: "general",
        general: {
            title: "Solar Activity",
            description: "A guide to understanding sunspots, solar flares, and their cycles.",
            url: "/material/pdf/solarActivity.pdf",
            audio_url: "/audios/general/videoplayback.mp3",
            material_type: "pdf",
        },
    },
    // Session 2: Planets & Moons
    {
        module_id: 8,
        title: "Geology of Terrestrial Planets - General PDF",
        description: "Comprehensive guide on terrestrial planet geology and atmospheres.",
        content_type: "general",
        general: {
            title: "Terrestrial Planets Geology",
            description: "Comprehensive guide on terrestrial planet geology and atmospheres.",
            url: "/material/pdf/terrestrialPlanetsGeology.pdf",
            audio_url: "/audios/general/ioVolcanism.mp3",
            material_type: "pdf",
        },
    },
    {
        module_id: 8,
        title: "Atmospheres of Terrestrial Planets - Accordion",
        description: "Explore how the atmospheres of Mercury, Venus, Earth, and Mars differ.",
        content_type: "accordian",
        accordions: [
            {
                title: "Mercury",
                body: "Almost no atmosphere due to its low gravity and proximity to the Sun.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/atmospheres.mp3",
            },
            {
                title: "Venus",
                body: "Dense atmosphere primarily of CO₂ with a runaway greenhouse effect.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/atmospheres.mp3",
            },
            {
                title: "Earth",
                body: "Supports life with a nitrogen-oxygen atmosphere and water vapor.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/atmospheres.mp3",
            },
            {
                title: "Mars",
                body: "Thin atmosphere mainly of CO₂, incapable of supporting human life.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/atmospheres.mp3",
            },
        ],
    },
    {
        module_id: 9,
        title: "Geological Activity of Solar System Moons - Slide",
        description: "Discover volcanic and tectonic activities on moons like Europa and Enceladus.",
        content_type: "slide",
        slides: [
            {
                title: "Volcanism on Io",
                description: "Io is the most volcanically active body in the solar system.",
                content_type: "video",
                video: {
                    url: "/multiSlide/video/ioVolcanism.mp4",
                    duration_minutes: 7,
                    audio_url: "/audios/slide_video/ioVolcanism.mp3",
                },
            },
            // {
            //     title: "Tectonics on Europa",
            //     description: "Europa shows evidence of tectonic activity beneath its icy crust.",
            //     content_type: "audio",
            //     audio: {
            //         url: "/multiSlide/audio/ioVolcanism.mp3",
            //         duration_minutes: 6,
            //     },
            // },
            {
                title: "Cryovolcanism on Enceladus",
                description: "Enceladus exhibits cryovolcanic activity with plumes of water vapor and ice particles.",
                content_type: "video",
                video: {
                    url: "/multiSlide/video/ioVolcanism.mp4",
                    duration_minutes: 5,
                    audio_url: "/audios/slide_video/ioVolcanism.mp3",
                },
            },
            // {
            //     title: "Surface Features of Titan",
            //     description: "Titan has dunes, lakes, and river channels shaped by methane cycles.",
            //     content_type: "audio",
            //     audio: {
            //         url: "/multiSlide/audio/ioVolcanism.mp3",
            //         duration_minutes: 6,
            //     },
            // },
            {
                title: "Tectonic Fractures on Ganymede",
                description: "Ganymede displays complex tectonic fractures caused by internal stresses.",
                content_type: "video",
                video: {
                    url: "/multiSlide/video/ioVolcanism.mp4",
                    duration_minutes: 6,
                    audio_url: "/audios/slide_video/ioVolcanism.mp3",
                },
            },
        ],
    },
    {
        module_id: 9,
        title: "Moon Exploration Missions - Video",
        description: "An overview of historic and recent missions to explore moons.",
        content_type: "video",
        video: {
            url: "/video/moonMissionsOverview.mp4",
            duration_minutes: 10,
            transcript: "From Apollo to Artemis and robotic orbiters around Europa...",
            audio_url: "/audios/video/moonMissionsOverview.mp3",
            bullet_points: [
                { time: 0, text: "Apollo program" },
                { time: 240, text: "Europa Clipper" },
                { time: 420, text: "Artemis program" },
            ],
        },
    },
    // Session 3: Solar System Missions & Habitability
    {
        module_id: 10,
        title: "Past and Present Space Missions - Video",
        description: "Review robotic and manned missions and their scientific contributions.",
        content_type: "video",
        video: {
            url: "/video/spaceMissionsOverview.mp4",
            duration_minutes: 12,
            transcript: "Explore key space missions that have shaped our understanding...",
            audio_url: "/audios/video/spaceMissionsOverview.mp3",
            bullet_points: [
                { time: 0, text: "Robotic missions" },
                { time: 360, text: "Manned missions" },
            ],
        },
    },
    {
        module_id: 10,
        title: "Mars Rovers in Detail - Accordion",
        description: "A look into the science instruments and goals of rovers like Curiosity and Perseverance.",
        content_type: "accordian",
        accordions: [
            {
                title: "Curiosity Rover",
                body: "Landed in 2012, focused on assessing Mars' habitability.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/marsRovers.mp3",
            },
            {
                title: "Perseverance Rover",
                body: "Exploring signs of ancient life and preparing samples for return.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/marsRovers.mp3",
            },
            {
                title: "Science Instruments",
                body: "Includes spectrometers, drills, weather sensors, and cameras.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/marsRovers.mp3",
            },
        ],
    },
    {
        module_id: 11,
        title: "Conditions for Habitability - Accordion",
        description: "Examine the environmental and chemical conditions necessary for life.",
        content_type: "accordian",
        accordions: [
            {
                title: "Liquid Water",
                body: "Presence of liquid water is crucial for life as we know it.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/spaceMissionsOverview.mp3",
            },
            {
                title: "Chemical Environment",
                body: "Essential chemical elements and energy sources support habitability.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/spaceMissionsOverview.mp3",
            },
            {
                title: "Atmospheric Conditions",
                body: "A stable atmosphere protects and sustains life by regulating temperature and pressure.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/spaceMissionsOverview.mp3",
            },
            {
                title: "Temperature Range",
                body: "Habitability requires temperatures within a range that allows liquid water and biological processes.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/spaceMissionsOverview.mp3",
            },
            {
                title: "Energy Sources",
                body: "Sources like sunlight, geothermal heat, or chemical energy are necessary to power life processes.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/spaceMissionsOverview.mp3",
            },
            {
                title: "Protection from Radiation",
                body: "A magnetic field or atmospheric shielding helps protect life from harmful cosmic and solar radiation.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/spaceMissionsOverview.mp3",
            },
        ],
    },
    {
        module_id: 11,
        title: "Exoplanets and the Habitable Zone - Slide",
        description: "Explore exoplanets and the 'Goldilocks Zone' for life.",
        content_type: "slide",
        slides: [
            {
                title: "What is a Habitable Zone?",
                description: "Definition and significance of the habitable zone around stars.",
                content_type: "video",
                video: {
                    url: "/multiSlide/video/habitableZone.mp4",
                    duration_minutes: 7,
                    audio_url: "/audios/slide_video/habitableZone.mp3",
                },
            },
            // {
            //     title: "Kepler Mission Discoveries",
            //     description: "Findings from NASA's exoplanet-hunting mission.",
            //     content_type: "audio",
            //     audio: {
            //         url: "/multiSlide/audio/habitableZone.mp3",
            //         duration_minutes: 5,
            //     },
            // },
        ],
    },

    // Session 4: Ethics, Protection & Final Project
    {
        module_id: 12,
        title: "Planetary Protection Policies - General PDF",
        description: "Guidelines and international policies for protecting celestial bodies.",
        content_type: "general",
        general: {
            title: "Planetary Protection",
            description: "Guidelines and international policies for protecting celestial bodies.",
            url: "/material/pdf/planetaryProtectionPolicies.pdf",
            audio_url: "/audios/general/projectPlanning.mp3",
            material_type: "pdf",
        },
    },
    {
        module_id: 12,
        title: "Ethical Considerations in Space Exploration - Accordion",
        description: "Understand ethical challenges in planetary colonization and contamination.",
        content_type: "accordian",
        accordions: [
            {
                title: "Planetary Colonization",
                body: "Moral implications of transforming alien worlds for human use.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/spaceMissionsOverview.mp3",
            },
            {
                title: "Biological Contamination",
                body: "Risks of carrying Earth microbes to pristine extraterrestrial environments.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/spaceMissionsOverview.mp3",
            },
            {
                title: "Rights of Alien Life",
                body: "Debates about the rights and protection of potential extraterrestrial organisms.",
                codeLanguage: null,
                code: null,
                audio_url: "/audios/accordion/spaceMissionsOverview.mp3",
            },
        ],
    },
    {
        module_id: 13,
        title: "Capstone Project Execution - Slide",
        description: "Apply knowledge by completing a comprehensive project.",
        content_type: "slide",
        slides: [
            {
                title: "Project Planning",
                description: "Steps to organize and plan your final project.",
                content_type: "video",
                video: {
                    url: "/multiSlide/video/projectPlanning.mp4",
                    duration_minutes: 8,
                    audio_url: "/audios/slide_video/projectPlanning.mp3",
                },
            },
            // {
            //     title: "Presentation Tips",
            //     description: "How to effectively present your findings.",
            //     content_type: "audio",
            //     audio: {
            //         url: "/multiSlide/audio/projectPlanning.mp3",
            //         duration_minutes: 5,
            //         audio_url: "/audios/slide_video/projectPlanning.mp3",
            //     },
            // },
            {
                title: "Research Methods",
                description: "Overview of effective research techniques for your project.",
                content_type: "accordian",
                audio_url: "/audios/slide_video/habitableZone.mp3",
                accordions: [
                    {
                        title: "Qualitative Research",
                        body: "Methods involving observations, interviews, and case studies.",
                        codeLanguage: null,
                        code: null,
                        audio_url: "/audios/accordion/projectPlanning.mp3",
                    },
                    {
                        title: "Quantitative Research",
                        body: "Methods involving data collection, experiments, and surveys.",
                        codeLanguage: null,
                        code: null,
                        audio_url: "/audios/accordion/projectPlanning.mp3",
                    },
                ],
            },
            // {
            //     title: "Data Analysis Tools",
            //     description: "Introduction to tools for analyzing your project data.",
            //     content_type: "general",
            //     audio_url: "/audios/slide_video/habitableZone.mp3",
            //     general: {
            //         title: "Data Analysis Tools Overview",
            //         description: "Summary of popular software and techniques to analyze data.",
            //         url: "/material/pdf/planetaryProtectionPolicies.pdf",
            //         audio_url: "/audios/general/projectPlanning.mp3",
            //         material_type: "pdf",
            //     },
            // },
            {
                title: "Final Submission Guidelines",
                description: "Important instructions to prepare and submit your project.",
                content_type: "video",
                video: {
                    url: "/multiSlide/video/projectPlanning.mp4",
                    duration_minutes: 6,
                    audio_url: "/audios/slide_video/projectPlanning.mp3",
                },
            },
            // {
            //     title: "Q&A and Feedback",
            //     description: "Tips on handling questions and receiving constructive feedback.",
            //     content_type: "audio",
            //     audio: {
            //         url: "/multiSlide/audio/projectPlanning.mp3",
            //         duration_minutes: 4,
            //     },
            // },
        ],
    },
    {
        module_id: 13,
        title: "Project Peer Review Process - General PDF",
        description: "Learn about the importance and steps of peer reviewing final projects.",
        content_type: "general",
        general: {
            title: "Peer Review Guidelines",
            description: "Instructions for giving and receiving constructive feedback.",
            url: "/material/pdf/peerReview.pdf",
            audio_url: "/audios/general/projectPlanning.mp3",
            material_type: "pdf",
        },
    },

];


const assignments = [
    // Module 1: Introduction to the Solar System
    {
        module_id: 6,
        title: "Solar System Origins Essay",
        description: "Describe the nebular hypothesis and how it explains the formation of the solar system.",
        file: null,
        due_date: new Date(Date.now() + 7 * 86400000),
        max_score: 50,
        status: "active",
        category: "paragraph_writing",
        created_by_type: "admin",
        updated_by_type: "admin",
        paragraph_questions: [
            { paragraph: "Explain how the solar system formed from a rotating disk of gas and dust." }
        ]
    },
    {
        module_id: 6,
        title: "Planet Classification",
        description: "Match each planet to its type.",
        file: null,
        due_date: new Date(Date.now() + 5 * 86400000),
        max_score: 30,
        status: "active",
        category: "matching",
        created_by_type: "admin",
        updated_by_type: "admin",
        matching_questions: [
            {
                question_text: "Match the planets with their classification",
                options: [
                    { option_text: "Earth", option_type: "text", match_text: "Terrestrial", match_type: "text" },
                    { option_text: "Jupiter", option_type: "text", match_text: "Gas Giant", match_type: "text" },
                    { option_text: "Neptune", option_type: "text", match_text: "Ice Giant", match_type: "text" }
                ]
            }
        ]
    },

    // Module 2: The Sun and Solar Energy
    {
        module_id: 7,
        title: "Sun Layers Fill-in",
        description: "Complete the sentences about the sun's internal structure.",
        file: null,
        due_date: new Date(Date.now() + 4 * 86400000),
        max_score: 40,
        status: "active",
        category: "fill_in_the_blanks",
        created_by_type: "admin",
        updated_by_type: "admin",
        fill_blank_questions: [
            {
                question_text: "The sun's energy is produced in the _____.",
                answers: ["core"]
            },
            {
                question_text: "The outermost layer of the sun's atmosphere is called the _____.",
                answers: ["corona"]
            }
        ]
    },
    {
        module_id: 7,
        title: "Fusion Process Essay",
        description: "Explain how nuclear fusion occurs in the sun.",
        file: null,
        due_date: new Date(Date.now() + 6 * 86400000),
        max_score: 50,
        status: "active",
        category: "paragraph_writing",
        created_by_type: "admin",
        updated_by_type: "admin",
        paragraph_questions: [
            { paragraph: "Describe the fusion of hydrogen into helium in the sun's core." }
        ]
    },

    // Module 3: Terrestrial Planets
    {
        module_id: 8,
        title: "Terrestrial Features Match",
        description: "Match the planets with their prominent features.",
        file: null,
        due_date: new Date(Date.now() + 5 * 86400000),
        max_score: 30,
        status: "active",
        category: "matching",
        created_by_type: "admin",
        updated_by_type: "admin",
        matching_questions: [
            {
                question_text: "Match the planets with their main features",
                options: [
                    { option_text: "Mars", option_type: "text", match_text: "Olympus Mons", match_type: "text" },
                    { option_text: "Venus", option_type: "text", match_text: "Thick Atmosphere", match_type: "text" },
                    { option_text: "Mercury", option_type: "text", match_text: "No Atmosphere", match_type: "text" }
                ]
            }
        ]
    },
    // {
    //     module_id: 3,
    //     title: "Geological T/F",
    //     description: "Test your knowledge of terrestrial planet geology.",
    //     file: null,
    //     due_date: new Date(Date.now() + 6 * 86400000),
    //     max_score: 30,
    //     status: "active",
    //     category: "true_false",
    //     created_by_type: "admin",
    //     updated_by_type: "admin",
    //     true_false_questions: [
    //         { question_text: "Mars has flowing water on its surface.", correct_answer: false },
    //         { question_text: "Earth has active plate tectonics.", correct_answer: true }
    //     ]
    // },

    // Module 4: Moons and Volcanism
    {
        module_id: 9,
        title: "Europa vs Enceladus Essay",
        description: "Compare geological activity on Europa and Enceladus.",
        file: null,
        due_date: new Date(Date.now() + 7 * 86400000),
        max_score: 50,
        status: "active",
        category: "paragraph_writing",
        created_by_type: "admin",
        updated_by_type: "admin",
        paragraph_questions: [
            { paragraph: "Compare the evidence for subsurface oceans on Europa and Enceladus." }
        ]
    },
    {
        module_id: 9,
        title: "Io Volcanism Fill-in",
        description: "Complete facts about Io's volcanic activity.",
        file: null,
        due_date: new Date(Date.now() + 5 * 86400000),
        max_score: 40,
        status: "active",
        category: "fill_in_the_blanks",
        created_by_type: "admin",
        updated_by_type: "admin",
        fill_blank_questions: [
            { question_text: "Io is the most _____ active body in the solar system.", answers: ["volcanically"] },
            { question_text: "The volcanic activity on Io is caused by _____ heating.", answers: ["tidal"] }
        ]
    },

    // Module 5: Robotic Space Missions
    {
        module_id: 10,
        title: "Mission Matching",
        description: "Match robotic missions with their destinations.",
        file: null,
        due_date: new Date(Date.now() + 5 * 86400000),
        max_score: 30,
        status: "active",
        category: "matching",
        created_by_type: "admin",
        updated_by_type: "admin",
        matching_questions: [
            {
                question_text: "Match the space mission with its target",
                options: [
                    { option_text: "Cassini", option_type: "text", match_text: "Saturn", match_type: "text" },
                    { option_text: "Curiosity", option_type: "text", match_text: "Mars", match_type: "text" },
                    { option_text: "Juno", option_type: "text", match_text: "Jupiter", match_type: "text" }
                ]
            }
        ]
    },
    // {
    //     module_id: 5,
    //     title: "Mission T/F",
    //     description: "Identify true or false about robotic missions.",
    //     file: null,
    //     due_date: new Date(Date.now() + 6 * 86400000),
    //     max_score: 30,
    //     status: "active",
    //     category: "true_false",
    //     created_by_type: "admin",
    //     updated_by_type: "admin",
    //     true_false_questions: [
    //         { question_text: "Voyager 1 is the farthest human-made object from Earth.", correct_answer: true },
    //         { question_text: "Opportunity rover landed on Venus.", correct_answer: false }
    //     ]
    // },

    // Module 6: Conditions for Life
    {
        module_id: 11,
        title: "Habitability Essay",
        description: "Explain the conditions that support life.",
        file: null,
        due_date: new Date(Date.now() + 7 * 86400000),
        max_score: 50,
        status: "active",
        category: "paragraph_writing",
        created_by_type: "admin",
        updated_by_type: "admin",
        paragraph_questions: [
            { paragraph: "Describe the roles of water, energy, and chemical stability for supporting life." }
        ]
    },
    {
        module_id: 11,
        title: "Essential Conditions Fill-in",
        description: "Fill in the missing terms related to habitability.",
        file: null,
        due_date: new Date(Date.now() + 5 * 86400000),
        max_score: 40,
        status: "active",
        category: "fill_in_the_blanks",
        created_by_type: "admin",
        updated_by_type: "admin",
        fill_blank_questions: [
            { question_text: "_____ is the universal solvent necessary for life.", answers: ["Water"] },
            { question_text: "Life requires a source of _____ to sustain metabolism.", answers: ["energy"] }
        ]
    },

    // Module 7: Planetary Protection
    {
        module_id: 12,
        title: "Contamination Essay",
        description: "Discuss why preventing space contamination is important.",
        file: null,
        due_date: new Date(Date.now() + 6 * 86400000),
        max_score: 50,
        status: "active",
        category: "paragraph_writing",
        created_by_type: "admin",
        updated_by_type: "admin",
        paragraph_questions: [
            { paragraph: "Why must we avoid contaminating other worlds with Earth microbes?" }
        ]
    },
    // {
    //     module_id: 7,
    //     title: "Protection T/F",
    //     description: "Evaluate planetary protection statements.",
    //     file: null,
    //     due_date: new Date(Date.now() + 5 * 86400000),
    //     max_score: 30,
    //     status: "active",
    //     category: "true_false",
    //     created_by_type: "admin",
    //     updated_by_type: "admin",
    //     true_false_questions: [
    //         { question_text: "Planetary protection applies only to missions returning to Earth.", correct_answer: false },
    //         { question_text: "Inbound and outbound protection are both part of policy.", correct_answer: true }
    //     ]
    // },

    // Module 8: Capstone Project Execution
    {
        module_id: 13,
        title: "Capstone Plan Essay",
        description: "Outline your capstone project goals and methods.",
        file: null,
        due_date: new Date(Date.now() + 7 * 86400000),
        max_score: 50,
        status: "active",
        category: "paragraph_writing",
        created_by_type: "admin",
        updated_by_type: "admin",
        paragraph_questions: [
            { paragraph: "Outline your capstone project including objectives and steps for execution." }
        ]
    },
    {
        module_id: 13,
        title: "Project Phases Matching",
        description: "Match phases of a project with descriptions.",
        file: null,
        due_date: new Date(Date.now() + 5 * 86400000),
        max_score: 30,
        status: "active",
        category: "matching",
        created_by_type: "admin",
        updated_by_type: "admin",
        matching_questions: [
            {
                question_text: "Match the project phase to its description",
                options: [
                    { option_text: "Planning", option_type: "text", match_text: "Defining tasks and milestones", match_type: "text" },
                    { option_text: "Execution", option_type: "text", match_text: "Carrying out tasks", match_type: "text" },
                    { option_text: "Evaluation", option_type: "text", match_text: "Reviewing outcomes", match_type: "text" }
                ]
            }
        ]
    }
];

const quizzes = [
    // Module 1: Origins of the Solar System
    {
        module_id: 6,
        title: "Solar System Formation Quiz",
        duration_minutes: 12,
        passing_score: 60,
        max_attempts: 3,
        attempts_gap: 12,
        quizType: "normal",
        status: "active",
        created_by_type: "admin",
        updated_by_type: "admin",
    },

    // Module 2: Structure of the Sun
    {
        module_id: 7,
        title: "Layers of the Sun Quiz",
        duration_minutes: 15,
        passing_score: 65,
        max_attempts: 2,
        attempts_gap: 24,
        quizType: "normal",
        status: "active",
        created_by_type: "admin",
        updated_by_type: "admin",
    },

    // Module 3: Geology of Terrestrial Planets
    {
        module_id: 8,
        title: "Terrestrial Planet Geology Quiz",
        duration_minutes: 14,
        passing_score: 70,
        max_attempts: 3,
        attempts_gap: 18,
        quizType: "normal",
        status: "active",
        created_by_type: "admin",
        updated_by_type: "admin",
    },

    // Module 4: Geological Activity of Solar System Moons
    {
        module_id: 9,
        title: "Moon Volcanism Quiz",
        duration_minutes: 16,
        passing_score: 68,
        max_attempts: 2,
        attempts_gap: 24,
        quizType: "normal",
        status: "active",
        created_by_type: "admin",
        updated_by_type: "admin",
    },

    // Module 5: Past and Present Space Missions
    {
        module_id: 10,
        title: "Space Missions Overview Quiz",
        duration_minutes: 10,
        passing_score: 55,
        max_attempts: 3,
        attempts_gap: 12,
        quizType: "normal",
        status: "active",
        created_by_type: "admin",
        updated_by_type: "admin",
    },

    // Module 6: Conditions for Habitability
    {
        module_id: 11,
        title: "Habitability Factors Quiz",
        duration_minutes: 15,
        passing_score: 65,
        max_attempts: 2,
        attempts_gap: 24,
        quizType: "normal",
        status: "active",
        created_by_type: "admin",
        updated_by_type: "admin",
    },

    // Module 7: Planetary Protection Policies
    {
        module_id: 12,
        title: "Planetary Protection Basics Quiz",
        duration_minutes: 12,
        passing_score: 60,
        max_attempts: 2,
        attempts_gap: 18,
        quizType: "normal",
        status: "active",
        created_by_type: "admin",
        updated_by_type: "admin",
    },

    // Module 8: Capstone Project Execution
    {
        module_id: 13,
        title: "Capstone Readiness Quiz",
        duration_minutes: 20,
        passing_score: 75,
        max_attempts: 1,
        attempts_gap: 48,
        quizType: "normal",
        status: "active",
        created_by_type: "admin",
        updated_by_type: "admin",
    },
];

const quizQuestions = [
    // Quiz ID 1 - JS Basics
    {
        quiz_id: 4,
        module_id: 6,
        question_text: "Which element is most abundant in the early solar nebula?",
        question_type: "mcq",
        marks: 5,
        sequence_no: 3,
        options: [
            { text: "Oxygen", correct: false },
            { text: "Hydrogen", correct: true },
            { text: "Carbon", correct: false },
            { text: "Iron", correct: false },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 4,
        module_id: 6,
        question_text: "True or False: The planets formed immediately after the Big Bang.",
        question_type: "true-false",
        marks: 3,
        sequence_no: 4,
        options: [
            { text: "true", correct: false },
            { text: "false", correct: true },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 5,
        module_id: 7,
        question_text: "The Sun's outermost layer, visible during a solar eclipse, is the _____",
        question_type: "complete-sentence",
        marks: 5,
        sequence_no: 3,
        blanks: [{ correct_word: "corona", hint: "c" }],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 5,
        module_id: 7,
        question_text: "Energy in the Sun is produced through what process?",
        question_type: "mcq",
        marks: 5,
        sequence_no: 4,
        options: [
            { text: "Combustion", correct: false },
            { text: "Fission", correct: false },
            { text: "Fusion", correct: true },
            { text: "Radiation", correct: false },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 6,
        module_id: 8,
        question_text: "Which of the terrestrial planets has a dense carbon dioxide atmosphere and surface temperatures hot enough to melt lead?",
        question_type: "mcq",
        marks: 5,
        sequence_no: 2,
        options: [
            { text: "Mars", correct: false },
            { text: "Earth", correct: false },
            { text: "Venus", correct: true },
            { text: "Mercury", correct: false },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 6,
        module_id: 8,
        question_text: "True or False: Mercury has a thick atmosphere and active plate tectonics.",
        question_type: "true-false",
        marks: 3,
        sequence_no: 2,
        options: [
            { text: "true", correct: false },
            { text: "false", correct: true },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 7,
        module_id: 9,
        question_text: "Europa is believed to have a subsurface ocean beneath its _____",
        question_type: "complete-sentence",
        marks: 5,
        sequence_no: 2,
        blanks: [{ correct_word: "ice crust", hint: "i" }],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 8,
        module_id: 10,
        question_text: "Which mission was launched to explore the outer planets and is now in interstellar space?",
        question_type: "mcq",
        marks: 5,
        sequence_no: 2,
        options: [
            { text: "Apollo 13", correct: false },
            { text: "Cassini", correct: false },
            { text: "Voyager 1", correct: true },
            { text: "Hubble", correct: false },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 9,
        module_id: 11,
        question_text: "A planet must be located in the __________ zone to have conditions suitable for liquid water.",
        question_type: "complete-sentence",
        marks: 5,
        sequence_no: 2,
        blanks: [{ correct_word: "habitable", hint: "h" }],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 10,
        module_id: 12,
        question_text: "True or False: Planetary protection applies only to robotic missions, not human ones.",
        question_type: "true-false",
        marks: 3,
        sequence_no: 2,
        options: [
            { text: "true", correct: false },
            { text: "false", correct: true },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 11,
        module_id: 13,
        question_text: "Which of the following best describes the goal of the Capstone Project?",
        question_type: "mcq",
        marks: 5,
        sequence_no: 2,
        options: [
            { text: "To memorize facts from all modules", correct: false },
            { text: "To apply learned concepts to a real-world problem", correct: true },
            { text: "To complete a timed multiple-choice test", correct: false },
            { text: "To summarize lecture notes", correct: false },
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    }
];

const predefinedQuestions = [
    {
        question_text: "What force is primarily responsible for the formation of the solar system?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 1,
        options: [
            { option_text: "Electromagnetic force", is_correct: false },
            { option_text: "Nuclear force", is_correct: false },
            { option_text: "Gravitational force", is_correct: true },
            { option_text: "Centrifugal force", is_correct: false },
        ],
    },
    {
        question_text: "Which planet is known for having the most prominent ring system?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 2,
        options: [
            { option_text: "Jupiter", is_correct: false },
            { option_text: "Uranus", is_correct: false },
            { option_text: "Neptune", is_correct: false },
            { option_text: "Saturn", is_correct: true },
        ],
    },
    {
        question_text: "Which celestial body is believed to harbor a subsurface ocean beneath its icy crust?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 3,
        options: [
            { option_text: "Europa", is_correct: true },
            { option_text: "Io", is_correct: false },
            { option_text: "Titan", is_correct: false },
            { option_text: "Phobos", is_correct: false },
        ],
    },
    {
        question_text: "What is the primary component of the Sun's energy generation process?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 4,
        options: [
            { option_text: "Nuclear fusion", is_correct: true },
            { option_text: "Nuclear fission", is_correct: false },
            { option_text: "Radioactive decay", is_correct: false },
            { option_text: "Gravitational collapse", is_correct: false },
        ],
    },
    {
        question_text: "Which planet has surface features most similar to Earth's, including volcanoes and valleys?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 5,
        options: [
            { option_text: "Mercury", is_correct: false },
            { option_text: "Venus", is_correct: true },
            { option_text: "Mars", is_correct: false },
            { option_text: "Jupiter", is_correct: false },
        ],
    },
    {
        question_text: "Which planet is known as the Red Planet?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 6,
        options: [
            { option_text: "Venus", is_correct: false },
            { option_text: "Mars", is_correct: true },
            { option_text: "Mercury", is_correct: false },
            { option_text: "Saturn", is_correct: false },
        ],
    },
    {
        question_text: "Which mission was the first to successfully land humans on the Moon?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 7,
        options: [
            { option_text: "Apollo 11", is_correct: true },
            { option_text: "Voyager 1", is_correct: false },
            { option_text: "Luna 2", is_correct: false },
            { option_text: "Curiosity", is_correct: false },
        ],
    },
    {
        question_text: "What is the most geologically active moon in the solar system?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 8,
        options: [
            { option_text: "Europa", is_correct: false },
            { option_text: "Io", is_correct: true },
            { option_text: "Ganymede", is_correct: false },
            { option_text: "Callisto", is_correct: false },
        ],
    },
    {
        question_text: "Which gas is most abundant in the atmosphere of Venus?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 9,
        options: [
            { option_text: "Oxygen", is_correct: false },
            { option_text: "Nitrogen", is_correct: false },
            { option_text: "Carbon Dioxide", is_correct: true },
            { option_text: "Hydrogen", is_correct: false },
        ],
    },
    {
        question_text: "Which of the following is a key requirement for planetary habitability?",
        question_img: null,
        question_type: "mcq",
        marks: 5,
        sequence_no: 10,
        options: [
            { option_text: "Presence of a rocky surface", is_correct: false },
            { option_text: "Extreme surface temperatures", is_correct: false },
            { option_text: "Liquid water", is_correct: true },
            { option_text: "Absence of an atmosphere", is_correct: false },
        ],
    },
];

const audioToScriptQuestions = [
    {
        quiz_id: 4,
        url: "/audiotoScript/solar_preview.mp3",
        script: "The solar system formed approximately 4.6 billion years ago from a rotating cloud of gas and dust known as the solar nebula.",
        created_by_type: "admin",
        updated_by_type: "admin",
        marks: 0, // You can set a default value or specify a particular value
    },
    {
        quiz_id: 5,
        url: "/audiotoScript/solar_preview.mp3",
        script: "The Sun consists of several layers, including the core, radiative zone, convective zone, photosphere, chromosphere, and corona.",
        created_by_type: "admin",
        updated_by_type: "admin",
        marks: 0, // You can set a default value or specify a particular value
    },
    {
        quiz_id: 6,
        url: "/audiotoScript/solar_preview.mp3",
        script: "Terrestrial planets like Earth and Mars have solid rocky surfaces, with geological processes such as volcanism and tectonics shaping their features.",
        created_by_type: "admin",
        updated_by_type: "admin",
        marks: 0, // You can set a default value or specify a particular value
    },
    {
        quiz_id: 7,
        url: "/audiotoScript/solar_preview.mp3",
        script: "Several moons in our solar system, such as Io and Enceladus, exhibit volcanic activity, driven by tidal heating or internal processes.",
        created_by_type: "admin",
        updated_by_type: "admin",
        marks: 0, // You can set a default value or specify a particular value
    },
    {
        quiz_id: 8,
        url: "/audiotoScript/solar_preview.mp3",
        script: "Space missions like Voyager, Cassini, and Perseverance have expanded our understanding of the planets and other celestial bodies.",
        created_by_type: "admin",
        updated_by_type: "admin",
        marks: 0, // You can set a default value or specify a particular value
    },
    {
        quiz_id: 9,
        url: "/audiotoScript/solar_preview.mp3",
        script: "Planetary habitability depends on several factors, including liquid water, a stable climate, a magnetic field, and a suitable atmosphere.",
        created_by_type: "admin",
        updated_by_type: "admin",
        marks: 0, // You can set a default value or specify a particular value
    },
    {
        quiz_id: 10,
        url: "/audiotoScript/solar_preview.mp3",
        script: "Planetary protection policies aim to prevent biological contamination of other planets and preserve the integrity of scientific exploration.",
        created_by_type: "admin",
        updated_by_type: "admin",
        marks: 0, // You can set a default value or specify a particular value
    },
    {
        quiz_id: 11,
        url: "/audiotoScript/solar_preview.mp3",
        script: "Your capstone project will integrate knowledge across planetary science, from solar system formation to mission design and analysis.",
        created_by_type: "admin",
        updated_by_type: "admin",
        marks: 0, // You can set a default value or specify a particular value
    },
];

const realWordQuestions = [
    {
        quiz_id: 4,
        words: ["nebula", "planetoid", "solor", "accretion", "protostar"],
        correct_answers: ["yes", "yes", "no", "yes", "yes"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 5,
        words: ["photosphere", "chromosfeer", "radiative", "convection", "corona"],
        correct_answers: ["yes", "no", "yes", "yes", "yes"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 6,
        words: ["tectonics", "volcano", "impactcrator", "regolith", "magma"],
        correct_answers: ["yes", "yes", "no", "yes", "yes"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 7,
        words: ["voyager", "cassini", "curiosoty", "perseverance", "lander"],
        correct_answers: ["yes", "yes", "no", "yes", "yes"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 8,
        words: ["habitability", "biosignature", "magnetosphere", "cryovolcanism", "terraform"],
        correct_answers: ["yes", "yes", "yes", "yes", "no"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 9,
        words: ["contamination", "sterilization", "bioburden", "planetary", "prottection"],
        correct_answers: ["yes", "yes", "yes", "yes", "no"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 10,
        words: ["capstone", "synergy", "integration", "reserach", "presentation"],
        correct_answers: ["yes", "yes", "yes", "no", "yes"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 11,
        words: ["exoplanet", "biosphere", "astrobiology", "climatology", "meteoroid"],
        correct_answers: ["yes", "yes", "yes", "yes", "yes"],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
];


const summarizePassageQuestions = [
    {
        quiz_id: 4,
        passage: `The solar system formed from a giant cloud of gas and dust called a nebula around 4.6 billion years ago. Through gravitational collapse and accretion, the Sun ignited and planets formed from surrounding material.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 5,
        passage: `The Sun's structure consists of the core, radiative zone, and convection zone, with outer layers called the photosphere, chromosphere, and corona. These layers generate energy and release solar wind, which influences the entire solar system.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 6,
        passage: `Terrestrial planets have rocky surfaces with features formed by volcanic activity, tectonic shifts, and impact cratering. Studying their geology reveals their formation history and internal processes.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 7,
        passage: `Many moons in the solar system display geological activity such as volcanism and tectonics despite their small size. This activity influences their surface features and potential habitability.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 8,
        passage: `Space missions like Voyager, Cassini, and Perseverance have provided invaluable data on planets, moons, and asteroids. These missions use orbiters, landers, and rovers to explore and analyze the solar system.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 9,
        passage: `Habitability depends on key factors such as liquid water availability, suitable temperature, protective atmosphere, and magnetic fields. These conditions determine a planet's potential to support life.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 10,
        passage: `Planetary protection policies aim to prevent biological contamination between Earth and other celestial bodies, ensuring scientific integrity and preserving potential extraterrestrial ecosystems.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    {
        quiz_id: 11,
        passage: `The capstone project combines research, data analysis, and presentation skills to demonstrate comprehensive understanding of planetary science concepts and findings from the course.`,
        time_limit: 6,
        created_by_type: "admin",
        updated_by_type: "admin",
    },
];

const bestOptionQuestions = [
    // Quiz ID 1 - Solar System Formation
    {
        quiz_id: 4,
        passage: "The solar system formed from a ____ of gas and dust called a ____ about 4.6 billion years ago. Gravity caused the ____ of material to form the Sun and planets.",
        blanked_words: [
            { word: "nebula", options: ["nebula", "star", "planet", "moon"], position: 1 },
            { word: "cloud", options: ["cloud", "storm", "wind", "rain"], position: 2 },
            { word: "accretion", options: ["accretion", "explosion", "collision", "fusion"], position: 3 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    // Quiz ID 2 - Layers of the Sun
    {
        quiz_id: 5,
        passage: "The Sun's ____ consists of the core, radiative zone, and ____ zone. The outer layers include the photosphere, ____ and corona.",
        blanked_words: [
            { word: "structure", options: ["structure", "surface", "atmosphere", "core"], position: 1 },
            { word: "convection", options: ["convection", "radiation", "conduction", "fusion"], position: 2 },
            { word: "chromosphere", options: ["chromosphere", "photosphere", "corona", "core"], position: 3 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    // Quiz ID 3 - Terrestrial Planet Geology
    {
        quiz_id: 6,
        passage: "Terrestrial planets have ____ surfaces formed by volcanic activity, tectonics, and impact ____. These features reveal their internal ____ and history.",
        blanked_words: [
            { word: "rocky", options: ["rocky", "gaseous", "icy", "metallic"], position: 1 },
            { word: "cratering", options: ["cratering", "erosion", "deposition", "folding"], position: 2 },
            { word: "processes", options: ["processes", "structures", "materials", "layers"], position: 3 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    // Quiz ID 4 - Geological Activity of Moons
    {
        quiz_id: 7,
        passage: "Some moons show ____ activity such as ____ and tectonics despite their small size, affecting their surface and potential habitability.",
        blanked_words: [
            { word: "geological", options: ["geological", "atmospheric", "magnetic", "orbital"], position: 1 },
            { word: "volcanism", options: ["volcanism", "erosion", "impact", "tectonics"], position: 2 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    // Quiz ID 5 - Space Missions Overview
    {
        quiz_id: 8,
        passage: "Space missions like Voyager and Cassini use ____ and rovers to collect ____ about planets, moons, and asteroids in our solar system.",
        blanked_words: [
            { word: "orbiters", options: ["orbiters", "landers", "rovers", "probes"], position: 1 },
            { word: "data", options: ["data", "samples", "images", "signals"], position: 2 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    // Quiz ID 6 - Habitability Factors
    {
        quiz_id: 9,
        passage: "Habitability requires factors like liquid ____, a protective ____, and a stable ____. These conditions support the possibility of life.",
        blanked_words: [
            { word: "water", options: ["water", "oxygen", "nitrogen", "carbon"], position: 1 },
            { word: "atmosphere", options: ["atmosphere", "magnetosphere", "ionosphere", "hydrosphere"], position: 2 },
            { word: "temperature", options: ["temperature", "pressure", "gravity", "radiation"], position: 3 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    // Quiz ID 7 - Planetary Protection Basics
    {
        quiz_id: 10,
        passage: "Planetary protection aims to prevent ____ contamination between Earth and other celestial bodies, preserving scientific ____. ",
        blanked_words: [
            { word: "biological", options: ["biological", "chemical", "physical", "radiological"], position: 1 },
            { word: "integrity", options: ["integrity", "purity", "safety", "quality"], position: 2 }
        ],
        created_by_type: "admin",
        updated_by_type: "admin",
    },
    // Quiz ID 8 - Capstone Readiness
    {
        quiz_id: 11,
        passage: "The capstone project involves ____ research, data ____, and presentation skills to demonstrate knowledge of ____ science.",
        blanked_words: [
            { word: "independent", options: ["independent", "collaborative", "guided", "supervised"], position: 1 },
            { word: "analysis", options: ["analysis", "collection", "processing", "interpretation"], position: 2 },
            { word: "planetary", options: ["planetary", "solar", "stellar", "cosmic"], position: 3 }
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
                    duration_minutes: newCourse.duration_minutes,
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
            console.log(`Processing module: ${module.title} with ID: ${module.id}`);

            // Get the course and session for this module
            const course = courseRecords.find(c => c.id === module.course_id);
            const session = sessionRecords.find(s => s.id === module.session_id);

            if (!course || !session) {
                console.warn(`Course or session not found for module ID: ${module.id}`);
            }

            // Determine which topics to add based on the module_id
            let topicsToAdd = basicTopics.filter(topic => topic.module_id === module.id);
            console.log(`Found ${topicsToAdd.length} topics to add for module: ${module.title}`);

            for (const topic of topicsToAdd) {
                console.log(`Creating topic: ${topic.title} with content type: ${topic.content_type}`);

                try {
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
                    console.log(`Topic "${topic.title}" saved with ID: ${newTopic.id}`);

                    switch (topic.content_type) {
                        case "video":
                            console.log(`Creating video content for topic: ${topic.title}`);
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
                            console.log(`Creating audio content for topic: ${topic.title}`);
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
                            console.log(`Creating accordion content for topic: ${topic.title}`);
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
                            console.log(`Creating general material content for topic: ${topic.title}`);
                            // Create core general material record without direct file fields (normalized)
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

                            // Build materials array from legacy single material data OR new array if provided
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
                            console.log(`Creating slide content for topic: ${topic.title}`);
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

                                        // const slideMats = [...legacySlideMat, ...extraSlideMats];
                                        // if (slideMats.length) {
                                        //     await Material.bulkCreate(slideMats);
                                        // }
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
                } catch (error) {
                    console.error(`Failed to create topic "${topic.title}" under module "${module.title}":`, error);
                }
            }
        }
        // Assignments
        for (const assignmentData of assignments) {
            const module = moduleRecords.find(m => m.id === assignmentData.module_id);
            if (!module) continue;

            // Get the course for this module
            const course = courseRecords.find(c => c.id === module.course_id);

            // Create assignments for the matching course
            if (course.title === "Exploring the Solar System: A Deep Dive into Planetary Science") {
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

            // Create quizzes for the matching course
            if (course.title === "Exploring the Solar System: A Deep Dive into Planetary Science") {
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
                            created_by: admin.id,
                            updated_by: admin.id,
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
                                created_by: admin.id,
                                updated_by: admin.id,
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
                            created_by: admin.id,
                            updated_by: admin.id,
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
                                created_by: admin.id,
                                updated_by: admin.id,
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
                        created_by: admin.id,
                        updated_by: admin.id,
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
                        created_by: admin.id,
                        updated_by: admin.id,
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
                        created_by: admin.id,
                        updated_by: admin.id,
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
                        created_by: admin.id,
                        updated_by: admin.id,
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
