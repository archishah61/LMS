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
const TopicContent = require("../models/course_management/topic_content");

const getEmbedding = async (text) => Array(768).fill(0);

// ==============================
// 🔹 Seed Data
// ==============================

const courseCategories = [
  { category: "Programming", id: 6, created_by: 1, updated_by: 1 },
];

const courses = [
  {
    id: 6,
    title: "React Basics: A Comprehensive Introduction",
    category_id: 6,
    description: "This course is designed to provide a foundational understanding of React, a popular JavaScript library for building user interfaces. Through a combination of video lectures, interactive exercises, and diverse assessment types, learners will grasp core React concepts and gain practical experience. This structure is optimized for integration with a course database, allowing for easy content population from YouTube resources.",
    price: 149.99,
    discount: 20,
    duration_minutes: 15,
    expiry_days: 180,
    min_access_minutes: 60,
    max_access_minutes: 120,
    what_you_will_learn: [
      "React Core Concepts and JSX",
      "Component Architecture",
      "State Management and Props",
      "Lifecycle Methods and Hooks",
      "Routing and Navigation",
      "Forms and User Input Handling",
      "API Integration and Data Fetching",
      "Real-world Project Development"
    ],
    prerequisites: ["Basic JavaScript knowledge", "HTML and CSS fundamentals", "ES6+ features understanding"],
    hashtags: ["#React", "#JavaScript", "#WebDevelopment", "#FrontendDevelopment", "#UI"],
    thumbnail: "/course/thumbnail/react_basics.png",
    preview_video: "/course/preview_video/react_intro.mp4",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
];

const courseFAQs = [
  {
    course_id: 6,
    question: "What level of JavaScript knowledge do I need for this course?",
    created_by: 1,
    updated_by: 1,
    created_by_type: "admin",
    updated_by_type: "admin",
    options: [
      "Beginner",
      "Intermediate",
      "Advanced",
      "None - I'm new to JavaScript"
    ]
  },
  {
    course_id: 6,
    question: "Why are you interested in learning React?",
    created_by: 1,
    updated_by: 1,
    created_by_type: "admin",
    updated_by_type: "admin",
    options: [
      "Career advancement",
      "Building personal projects",
      "Understanding modern web development",
      "Required for work/school"
    ]
  },
  {
    course_id: 6,
    question: "What is your experience with other JavaScript frameworks?",
    created_by: 1,
    updated_by: 1,
    created_by_type: "admin",
    updated_by_type: "admin",
    options: [
      "None",
      "Some experience with Angular",
      "Some experience with Vue",
      "Experienced with multiple frameworks"
    ]
  },
  {
    course_id: 6,
    question: "How much time can you dedicate weekly to this course?",
    created_by: 1,
    updated_by: 1,
    created_by_type: "admin",
    updated_by_type: "admin",
    options: [
      "1-3 hours",
      "4-6 hours",
      "7-10 hours",
      "10+ hours"
    ]
  },
  {
    course_id: 6,
    question: "What type of applications are you most interested in building with React?",
    created_by: 1,
    updated_by: 1,
    created_by_type: "admin",
    updated_by_type: "admin",
    options: [
      "Business/Enterprise applications",
      "Social media applications",
      "E-commerce platforms",
      "Portfolio/Personal websites",
      "Mobile applications with React Native"
    ]
  },
];

const sessions = [
  {
    //25
    course_id: 6,
    title: "Getting Started with React & Core Concepts",
    status: "active",
    min_time_in_minute: 60,
  },
  //26
  {
    course_id: 6,
    title: "State, Hooks & Event Handling",
    status: "active",
    min_time_in_minute: 75,
  },
  //27
  {
    course_id: 6,
    title: "Lists, Forms & Routing",
    status: "active",
    min_time_in_minute: 70,
  },
];

const modules = [
  {
    //56
    course_id: 6,
    session_id: 25, // Assuming session IDs will start from 20 for these new sessions
    title: "Introduction to React",
    duration_minutes: 1.5 * 60,
    status: "active",
  },
  {
    //57
    course_id: 6,
    session_id: 25,
    title: "Components and Props",
    duration_minutes: 2 * 60,
    status: "active",
  },
  {
    //58
    course_id: 6,
    session_id: 26,
    title: "Managing State with Hooks",
    duration_minutes: 2.5 * 60,
    status: "active",
  },
  {
    //59
    course_id: 6,
    session_id: 26,
    title: "Event Handling & Conditional Rendering",
    duration_minutes: 1.5 * 60,
    status: "active",
  },
  {
    //60
    course_id: 6,
    session_id: 27,
    title: "Rendering Lists and Forms",
    duration_minutes: 2 * 60,
    status: "active",
  },
  {
    //61
    course_id: 6,
    session_id: 27,
    title: "React Router Basics",
    duration_minutes: 1.5 * 60,
    status: "active",
  },
];

// HTML content for the React intro
const reactIntroHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React Basics: A Comprehensive Introduction</title>
    <style>
        .react-guide {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f9f9f9;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        .react-guide header {
            background: linear-gradient(to right, #61dafb, #282c34);
            color: #fff;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .react-guide h1 {
            margin: 0;
            font-size: 2.8em;
            font-weight: 700;
        }
        .react-guide .subtitle {
            font-size: 1.2em;
            margin-top: 10px;
            font-weight: 300;
        }
        .react-guide h2 {
            font-size: 1.8em;
            color: #282c34;
            border-bottom: 2px solid #61dafb;
            padding-bottom: 8px;
            margin-top: 40px;
        }
        .react-guide section {
            background-color: #ffffff;
            padding: 25px 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            margin-top: 30px;
        }
        .react-guide ul {
            padding-left: 25px;
        }
        .react-guide li {
            margin-bottom: 12px;
            position: relative;
        }
        .react-guide li:before {
            content: "•";
            color: #61dafb;
            font-weight: bold;
            display: inline-block;
            width: 1em;
            margin-left: -1em;
        }
        .react-guide .highlight {
            background-color: #e6f7ff;
            padding: 2px 5px;
            border-radius: 3px;
        }
        .react-guide .code {
            font-family: 'Courier New', Courier, monospace;
            background-color: #282c34;
            color: #61dafb;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            margin: 15px 0;
        }
        .react-guide .logo {
            display: block;
            width: 100px;
            height: auto;
            margin: 0 auto 20px;
        }
        .react-guide footer {
            text-align: center;
            margin-top: 60px;
            padding: 25px;
            font-size: 0.9em;
            color: #666;
            border-top: 1px solid #eee;
        }
        .react-guide .react-banner {
            height: 5px;
            background: linear-gradient(to right, #61dafb, #282c34);
            margin: 20px 0;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="react-guide">
        <div class="react-banner"></div>
        <header>
            <h1>React Basics</h1>
            <p class="subtitle">A Comprehensive Introduction to React</p>
        </header>

        <section>
            <h2>What is React?</h2>
            <p>React is a <span class="highlight">JavaScript library for building user interfaces</span>, particularly single-page applications. It's maintained by Facebook and a community of individual developers and companies. React allows developers to create large web applications that can change data without reloading the page.</p>
            
            <div class="code">
                import React from 'react';<br>
                import ReactDOM from 'react-dom';<br><br>
                
                function HelloWorld() {<br>
                &nbsp;&nbsp;return &lt;h1&gt;Hello, React World!&lt;/h1&gt;;<br>
                }<br><br>
                
                ReactDOM.render(<br>
                &nbsp;&nbsp;&lt;HelloWorld /&gt;,<br>
                &nbsp;&nbsp;document.getElementById('root')<br>
                );
            </div>
        </section>

        <section>
            <h2>Key Features of React</h2>
            <ul>
                <li><strong>Component-Based Architecture:</strong> React is built around reusable components</li>
                <li><strong>Virtual DOM:</strong> Makes rendering updates efficient through a virtual representation of the UI</li>
                <li><strong>JSX Syntax:</strong> Combines JavaScript and HTML for powerful templating</li>
                <li><strong>Unidirectional Data Flow:</strong> Makes applications more predictable and easier to debug</li>
                <li><strong>React Hooks:</strong> Enables state and lifecycle features in functional components</li>
                <li><strong>Rich Ecosystem:</strong> Extensive libraries and tools including Redux, React Router, and Next.js</li>
            </ul>
        </section>

        <section>
            <h2>Course Structure</h2>
            <p>This comprehensive course covers all essential aspects of React development through <span class="highlight">3 sessions and 6 modules</span>, including:</p>
            <ul>
                <li>React fundamentals and JSX</li>
                <li>Components, props, and state management</li>
                <li>Hooks and lifecycle methods</li>
                <li>Event handling and conditional rendering</li>
                <li>List rendering and form handling</li>
                <li>Client-side routing with React Router</li>
            </ul>
        </section>

        <section>
            <h2>Learning Outcomes</h2>
            <p>By completing this course, you will:</p>
            <ul>
                <li>Build interactive user interfaces with React</li>
                <li>Understand component architecture and data flow</li>
                <li>Master state management with hooks</li>
                <li>Implement client-side routing in single-page applications</li>
                <li>Create reusable component libraries</li>
                <li>Follow React best practices for performance optimization</li>
            </ul>
        </section>

        <footer>
            <div class="react-banner"></div>
            &copy; 2025 React Education Initiative | Empowering developers worldwide
        </footer>
    </div>
</body>
</html>
`;

// Topic content
const topics = [
  {
    //172
    module_id: 56, // Assuming first module ID will be 39 based on pattern
    title: "React tutorial for beginners ⚛️",
    description: "Comprehensive guide to React fundamentals and setup",
    content_type: "video",
    video: {
      url: "/video/react_tutorial_beginners.mp4",
      duration_minutes: 15,
      audio_url: "/audios/video/react_tutorial_audio.mp3",
    },
  },
  {
    //173
    module_id: 56,
    title: "What is JSX?",
    description: "Understanding JSX syntax and its role in React development",
    content_type: "accordian",
    accordions: [
      {
        title: "JSX Basics",
        body: "JSX stands for JavaScript XML. It is a syntax extension for JavaScript recommended by React that looks similar to HTML but provides the full power of JavaScript. JSX produces React 'elements' that are rendered to the DOM.",
        audio_url: "/audios/accordion/jsx_info.mp3",
        completion_type: "audio", // Audio-based completion
      },
      {
        title: "JSX vs HTML",
        body: "While JSX looks like HTML, there are important differences: class attribute becomes className, for attribute becomes htmlFor, and style accepts a JavaScript object with camelCase properties rather than a CSS string.",
        audio_url: "/audios/accordion/jsx_info.mp3",
        completion_type: "audio", // Audio-based completion
      },
      {
        title: "Expressions in JSX",
        body: "You can embed JavaScript expressions in JSX using curly braces. This allows you to dynamically render content based on JavaScript variables, functions, or calculations.",
        completion_type: "timer", // Audio-based completion
        completion_time: 1,
      },
      {
        title: "JSX Compilation",
        body: "JSX is not understood by browsers directly. It is compiled to standard JavaScript by tools like Babel before being served to the browser. This compilation process converts JSX elements to React.createElement() calls.",
        completion_type: "timer", // Audio-based completion
        completion_time: 1,
      },
    ],
  },
  {
    //174
    module_id: 57,
    title: "PROPS in React explained 📧",
    description: "Learn how to pass and use props in React components",
    content_type: "video",
    video: {
      url: "/video/react_props_explained.mp4",
      duration_minutes: 12,
      transcript: "Props, short for properties, are a way of passing data from parent to child components in React. They are read-only and help make your components reusable...",
      audio_url: "/audios/video/react_props_audio.mp3",
      bullet_points: [
        { time: 0, text: "What are props in React?" },
        { time: 120, text: "Passing props to components" },
        { time: 240, text: "Default props and prop types" },
        { time: 360, text: "Props vs State comparison" },
        { time: 600, text: "Best practices for using props" }
      ],
    },
  },
  {
    //175
    module_id: 57,
    title: "Functional vs. Class Components",
    description: "Compare the two main types of React components",
    content_type: "slide",
    slides: [
      // {
      //   title: "Component Types Overview",
      //   description: "A comparison of functional and class components in React",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/react_props_audio.mp3",
      //   general: {
      //     title: "Component Types in React",
      //     description: "An overview of the two main component paradigms in React",
      //     url: "/multiSlide/general/pdf/react_info.pdf",
      //     material_type: "pdf",
      //     audio_url: "/audios/slide_general/react_props_audio.mp3",
      //   },
      // },
      {
        title: "Class Components Deep Dive",
        description: "Understanding class components and their lifecycle methods",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/react_props_audio.mp3",
        accordions: [
          {
            title: "Class Component Structure",
            body: "Class components are ES6 classes that extend from React.Component. They require a render() method that returns React elements and can have state and lifecycle methods.",
            audio_url: "/audios/slide_accordion/react_props_audio.mp3",
            completion_type: "audio",
          },
          {
            title: "Lifecycle Methods",
            body: "Class components have lifecycle methods like componentDidMount, componentDidUpdate, and componentWillUnmount that allow you to run code at specific points in the component's life.",
            completion_time: 60,
            completion_type: "timer",
          },
          {
            title: "When to Use Class Components",
            body: "While hooks have largely replaced the need for class components, they may still be useful in certain error boundaries or when working with older codebases.",
            completion_time: 45,
            completion_type: "timer",
          },
        ],
      },
    ],
  },
  {
    //176
    module_id: 58,
    title: "React Full Course for free",
    description: "Comprehensive guide to React state management with hooks",
    content_type: "video",
    video: {
      url: "/video/react_hooks_course.mp4",
      duration_minutes: 20,
      transcript: "In this section, we'll focus on React hooks, which were introduced in React 16.8. Hooks let you use state and other React features without writing a class...",
      audio_url: "/audios/video/react_hooks_audio.mp3",
      bullet_points: [
        { time: 0, text: "Introduction to React Hooks" },
        { time: 240, text: "useState Hook for state management" },
        { time: 480, text: "useEffect for side effects" },
        { time: 720, text: "Custom hooks for reusable logic" },
        { time: 960, text: "Rules of Hooks" }
      ],
    },
  },
  {
    //177
    module_id: 58,
    title: "The useEffect Hook",
    description: "Learn about side effects management in React",
    content_type: "audio",
    audio: {
      url: "/audio/react_hooks_audio.mp3",
      duration_minutes: 10,
      transcript: "The useEffect hook lets you perform side effects in functional components. It serves the same purpose as componentDidMount, componentDidUpdate, and componentWillUnmount in class components, but unified into a single API..."
    },
  },
  {
    //178
    module_id: 59,
    title: "Handling Events in React",
    description: "Master event handling in React components",
    content_type: "slide",
    slides: [
      {
        title: "Event Handling Basics",
        description: "Learn the fundamentals of event handling in React",
        content_type: "video",
        audio_url: "/audios/multi_slide/react_hooks_audio.mp3",
        video: {
          url: "/multiSlide/video/react_hooks_course.mp4",
          duration_minutes: 8,
          transcript: "React event handling is very similar to handling events in DOM elements, but with some syntactical differences...",
          audio_url: "/audios/slide_video/react_hooks_audio.mp3",
          bullet_points: [
            { time: 0, text: "React event naming (camelCase)" },
            { time: 120, text: "Passing functions as event handlers" },
            { time: 240, text: "Preventing default behavior" }
          ],
        },
      },
      // {
      //   title: "Event Binding Methods",
      //   description: "Different approaches to binding event handlers",
      //   content_type: "general",
      //   audio_url: "/audios/multi_slide/react_hooks_audio.mp3",
      //   general: {
      //     title: "Event Binding Techniques",
      //     description: "Various methods to bind event handlers in React components",
      //     url: "/multiSlide/general/pdf/react_info.pdf",
      //     material_type: "pdf",
      //     audio_url: "/audios/slide_general/react_hooks_audio.mp3",
      //   },
      // },
    ],
  },
  {
    //179
    module_id: 59,
    title: "Conditional Rendering Techniques",
    description: "Learn different approaches for conditional rendering in React",
    content_type: "general",
    general: {
      title: "Conditional Rendering in React",
      description: "A comprehensive guide to different conditional rendering patterns",
      url: "/material/pdf/react_info.pdf",
      audio_url: "/audios/general/react_hooks_audio.mp3",
      material_type: "pdf",
    },
  },
  {
    //180
    module_id: 60,
    title: "Rendering Lists in React",
    description: "Techniques for efficiently rendering lists with React",
    content_type: "slide",
    slides: [
      {
        title: "List Rendering Basics",
        description: "Core concepts of rendering lists in React",
        content_type: "accordian",
        audio_url: "/audios/multi_slide/react_hooks_audio.mp3",
        accordions: [
          {
            title: "Using map() for Lists",
            body: "In React, the JavaScript map() method is the most common approach for rendering lists. It transforms an array of data into an array of JSX elements that can be rendered to the DOM.",
            audio_url: "/audios/slide_accordion/react_hooks_audio.mp3",
            completion_type: "audio",
          },
          {
            title: "Keys in Lists",
            body: "When rendering lists in React, each item should have a unique 'key' prop. Keys help React identify which items have changed, been added, or removed, improving performance.",
            completion_time: 60,
            completion_type: "timer",
          },
        ],
      },
      // {
      //   title: "Advanced List Patterns",
      //   description: "More sophisticated techniques for list rendering",
      //   content_type: "audio",
      //   audio_url: "/audios/multi_slide/react_hooks_audio.mp3",
      //   audio: {
      //     url: "/multiSlide/audio/react_hooks_audio.mp3",
      //     duration_minutes: 7,
      //     transcript: "Beyond basic list rendering, there are several advanced patterns to consider. These include virtualized lists for performance, infinite scrolling, and handling complex nested lists..."
      //   },
      // },
    ],
  },
  // {
  //   //181
  //   module_id: 60,
  //   title: "Controlled Components and Forms",
  //   description: "Building and managing forms with React",
  //   content_type: "slide",
  //   slides: [
  //     {
  //       title: "Controlled Components",
  //       description: "Understanding form handling with controlled components",
  //       content_type: "audio",
  //       audio_url: "/audios/multi_slide/react_hooks_audio.mp3",
  //       audio: {
  //         url: "/multiSlide/audio/react_hooks_audio.mp3",
  //         duration_minutes: 8,
  //         transcript: "In HTML, form elements like input, textarea, and select typically maintain their own state. In React, we can make React state be the 'single source of truth' by controlling these elements. This approach is called using 'controlled components'..."
  //       },
  //     },
  //     {
  //       title: "Form Validation",
  //       description: "Implementing validation in React forms",
  //       content_type: "audio",
  //       audio_url: "/audios/multi_slide/react_hooks_audio.mp3",
  //       audio: {
  //         url: "/multiSlide/audio/react_hooks_audio.mp3",
  //         duration_minutes: 6,
  //         transcript: "Form validation is essential for ensuring data quality. In React, we can implement validation by checking input values against certain rules when the form state changes or when the form is submitted..."
  //       },
  //     },
  //   ],
  // },
  // {
  //   //182
  //   module_id: 61,
  //   title: "Introduction to React Router",
  //   description: "Learn client-side routing with React Router",
  //   content_type: "slide",
  //   slides: [
  //     {
  //       title: "React Router Basics",
  //       description: "Getting started with React Router",
  //       content_type: "general",
  //       audio_url: "/audios/multi_slide/react_hooks_audio.mp3",
  //       general: {
  //         title: "React Router Fundamentals",
  //         description: "An introduction to client-side routing with React Router",
  //         url: "/multiSlide/general/pdf/react_info.pdf",
  //         material_type: "pdf",
  //         audio_url: "/audios/slide_general/react_hooks_audio.mp3",
  //       },
  //     },
  //     {
  //       title: "Route Parameters & Navigation",
  //       description: "Working with route parameters and programmatic navigation",
  //       content_type: "general",
  //       audio_url: "/audios/multi_slide/react_hooks_audio.mp3",
  //       general: {
  //         title: "Advanced Routing Techniques",
  //         description: "Using route parameters, nested routes, and programmatic navigation",
  //         url: "/multiSlide/general/pdf/react_info.pdf",
  //         material_type: "pdf",
  //         audio_url: "/audios/slide_general/react_props_audio.mp3",
  //       },
  //     },
  //   ],
  // },
];

const assignments = [
  // Module 1: Introduction to React
  {
    module_id: 56,
    title: "React Basics Assignment",
    description: "Analyze the core concepts of React and its advantages",
    file: "/assignments/file/react_info.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    max_score: 100,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 56,
    title: "JSX Concepts Matching",
    description: "Match JSX concepts with their descriptions",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    max_score: 50,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match the JSX concepts with their descriptions",
        options: [
          {
            option_text: "JSX",
            option_type: "text",
            match_text: "JavaScript XML syntax extension",
            match_type: "text"
          },
          {
            option_text: "Components",
            option_type: "text",
            match_text: "Reusable UI building blocks",
            match_type: "text"
          },
          {
            option_text: "Virtual DOM",
            option_type: "text",
            match_text: "Efficient UI update mechanism",
            match_type: "text"
          },
          {
            option_text: "Props",
            option_type: "text",
            match_text: "Data passed to components",
            match_type: "text"
          },
          {
            option_text: "State",
            option_type: "text",
            match_text: "Internal component data",
            match_type: "text"
          }
        ]
      }
    ]
  },
  {
    module_id: 56,
    title: "Fill in the Blanks - React Basics",
    description: "Complete sentences about React fundamentals",
    file: null,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    max_score: 40,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text: "React was developed by engineers at _____",
        answers: ["Facebook"]
      },
      {
        question_text: "The _____ is React's efficient update mechanism",
        answers: ["Virtual DOM"]
      },
      {
        question_text: "_____ are reusable UI building blocks in React",
        answers: ["Components"]
      },
      {
        question_text: "Data passed to components are called _____",
        answers: ["props"]
      }
    ]
  },
  {
    module_id: 56,
    title: "React Basics Essay",
    description: "Write about the advantages of using React",
    file: null,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    max_score: 50,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph: "React offers several key advantages for modern web development."
      }
    ]
  },

  // Module 2: Components and Props
  {
    module_id: 57,
    title: "Components Analysis",
    description: "Analyze the different types of React components",
    file: "/assignments/file/react_info.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    max_score: 100,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 57,
    title: "Component Types Matching",
    description: "Match component types with their characteristics",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    max_score: 50,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match the component types with their characteristics",
        options: [
          {
            option_text: "Functional Component",
            option_type: "text",
            match_text: "Uses functions and hooks",
            match_type: "text"
          },
          {
            option_text: "Class Component",
            option_type: "text",
            match_text: "Uses lifecycle methods",
            match_type: "text"
          },
          {
            option_text: "Presentational Component",
            option_type: "text",
            match_text: "Focuses on UI rendering",
            match_type: "text"
          },
          {
            option_text: "Container Component",
            option_type: "text",
            match_text: "Manages data and state",
            match_type: "text"
          },
          {
            option_text: "Higher-Order Component",
            option_type: "text",
            match_text: "Takes component and returns enhanced component",
            match_type: "text"
          }
        ]
      }
    ]
  },

  // Module 3: Managing State with Hooks
  {
    module_id: 58,
    title: "React Hooks Implementation",
    description: "Implement useState and useEffect hooks in functional components",
    file: "/assignments/file/react_info.pdf",
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    max_score: 100,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 58,
    title: "Hooks True or False Quiz",
    description: "Test your knowledge of React hooks",
    file: null,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    max_score: 50,
    status: "active",
    category: "true_false",
    created_by_type: "admin",
    updated_by_type: "admin",
    true_false_questions: [
      {
        question: "useState can only be used for primitive data types",
        is_true: false,
        explanation: "useState can be used for any data type, including objects and arrays."
      },
      {
        question: "useEffect runs after every render by default",
        is_true: true,
        explanation: "By default, useEffect runs after the first render and after every update."
      },
      {
        question: "You can call hooks conditionally",
        is_true: false,
        explanation: "Hooks must be called at the top level of your components, not inside loops or conditions."
      },
      {
        question: "Custom hooks must start with 'use'",
        is_true: true,
        explanation: "By convention, custom hooks should start with 'use' to signal that they follow the rules of hooks."
      },
      {
        question: "useRef values persist across renders",
        is_true: true,
        explanation: "useRef returns a mutable ref object whose .current property is initialized to the passed argument and persists across re-renders."
      }
    ]
  },

  // Module 4: Event Handling & Conditional Rendering
  {
    module_id: 59,
    title: "Event Handlers in React",
    description: "Create components with different event handling techniques",
    file: "/assignments/file/react_info.pdf",
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    max_score: 80,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 59,
    title: "Conditional Rendering Patterns",
    description: "Explain different conditional rendering approaches in React",
    file: null,
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    max_score: 60,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph: "Conditional rendering in React allows developers to create dynamic user interfaces that respond to different states and conditions."
      }
    ]
  },

  // Module 5: Rendering Lists and Forms
  {
    module_id: 60,
    title: "List Rendering Implementation",
    description: "Create efficient list components with proper key usage",
    file: "/assignments/file/react_info.pdf",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    max_score: 70,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 60,
    title: "Form Handling Fill in the Blanks",
    description: "Complete sentences about form handling in React",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    max_score: 50,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text: "A _____ component is one where form data is handled by the React component",
        answers: ["controlled"]
      },
      {
        question_text: "To handle form input changes, you typically use the _____ event",
        answers: ["onChange"]
      },
      {
        question_text: "The _____ event is used to handle form submissions",
        answers: ["onSubmit"]
      },
      {
        question_text: "In controlled components, form data is stored in component _____",
        answers: ["state"]
      },
      {
        question_text: "To prevent the default form submission behavior, use _____",
        answers: ["event.preventDefault()"]
      }
    ]
  },

  // Module 6: React Router Basics
  {
    module_id: 61,
    title: "React Router Implementation",
    description: "Create a multi-page React application using React Router",
    file: "/assignments/file/react_info.pdf",
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    max_score: 100,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },
  {
    module_id: 61,
    title: "Routing Concepts Matching",
    description: "Match routing concepts with their descriptions",
    file: null,
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    max_score: 60,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match the React Router concepts with their descriptions",
        options: [
          {
            option_text: "BrowserRouter",
            option_type: "text",
            match_text: "Router that uses HTML5 history API",
            match_type: "text"
          },
          {
            option_text: "Route",
            option_type: "text",
            match_text: "Renders UI when path matches current URL",
            match_type: "text"
          },
          {
            option_text: "Link",
            option_type: "text",
            match_text: "Creates navigation without page refresh",
            match_type: "text"
          },
          {
            option_text: "useParams",
            option_type: "text",
            match_text: "Hook to access URL parameters",
            match_type: "text"
          },
          {
            option_text: "useNavigate",
            option_type: "text",
            match_text: "Hook for programmatic navigation",
            match_type: "text"
          }
        ]
      }
    ]
  }
];

// Add topic-level assignments by adding assignment_id to topic_content
const topicAssignments = [
  // Topic: React tutorial for beginners (Module 1)
  {
    topic_id: 172, // First topic in the topics array
    module_id: 56, // Introduction to React
    title: "React Setup Assignment",
    description: "Set up a React development environment and create your first component",
    file: "/assignments/file/react_info.pdf",
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    max_score: 50,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // Topic: What is JSX? (Module 1)
  {
    topic_id: 173, // Second topic in the topics array
    module_id: 56, // Introduction to React
    title: "JSX Transformation",
    description: "Convert HTML to JSX and explain the differences",
    file: null,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    max_score: 60,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text: "In JSX, the HTML 'class' attribute becomes _____",
        answers: ["className"]
      },
      {
        question_text: "JSX expressions are embedded using _____ syntax",
        answers: ["curly braces", "{}"]
      },
      {
        question_text: "The _____ tool compiles JSX to regular JavaScript",
        answers: ["Babel"]
      }
    ]
  },

  // Topic: PROPS in React explained (Module 2)
  {
    topic_id: 174, // Third topic in the topics array
    module_id: 57, // Components and Props
    title: "Props Implementation",
    description: "Create components that use props effectively",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    max_score: 70,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph: "Props (short for properties) in React are a fundamental concept for passing data from parent to child components."
      }
    ]
  },

  // Topic: Functional vs. Class Components (Module 2)
  {
    topic_id: 175, // Fourth topic in the topics array
    module_id: 57, // Components and Props
    title: "Component Comparison",
    description: "Compare the pros and cons of functional and class components",
    file: null,
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    max_score: 60,
    status: "active",
    category: "true_false",
    created_by_type: "admin",
    updated_by_type: "admin",
    true_false_questions: [
      {
        question: "Functional components can use state with hooks",
        is_true: true,
        explanation: "With the introduction of hooks, functional components can now manage state using useState."
      },
      {
        question: "Class components are being deprecated in React",
        is_true: false,
        explanation: "While functional components are preferred, class components are still supported and not officially deprecated."
      },
      {
        question: "Functional components are more performant than class components",
        is_true: true,
        explanation: "Generally, functional components have better performance due to less overhead compared to class components."
      }
    ]
  },

  // Topic: React Full Course for free (Module 3 - Hooks)
  {
    topic_id: 176, // Fifth topic in the topics array
    module_id: 58, // Managing State with Hooks
    title: "Hooks Basic Implementation",
    description: "Implement useState and useEffect in a simple counter application",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    max_score: 70,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // Topic: The useEffect Hook (Module 3)
  {
    topic_id: 177, // Sixth topic in the topics array
    module_id: 58, // Managing State with Hooks
    title: "Side Effects Management",
    description: "Properly manage side effects in React components",
    file: null,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    max_score: 80,
    status: "active",
    category: "fill_in_the_blanks",
    created_by_type: "admin",
    updated_by_type: "admin",
    fill_blank_questions: [
      {
        question_text: "The _____ hook is used to perform side effects in functional components",
        answers: ["useEffect"]
      },
      {
        question_text: "To run an effect only on mount, provide an empty _____ array",
        answers: ["dependency", "dependencies"]
      },
      {
        question_text: "The function returned by useEffect is called a _____ function",
        answers: ["cleanup"]
      }
    ]
  },

  // Topic: Handling Events in React (Module 4)
  {
    topic_id: 178, // Seventh topic in the topics array
    module_id: 59, // Event Handling & Conditional Rendering
    title: "Event Handling Techniques",
    description: "Implement various event handling patterns in React",
    file: null,
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    max_score: 60,
    status: "active",
    category: "matching",
    created_by_type: "admin",
    updated_by_type: "admin",
    matching_questions: [
      {
        question_text: "Match the event handling concepts with their descriptions",
        options: [
          {
            option_text: "Synthetic Events",
            option_type: "text",
            match_text: "React's cross-browser wrapper for native events",
            match_type: "text"
          },
          {
            option_text: "Event Delegation",
            option_type: "text",
            match_text: "Technique where events bubble up to a parent element",
            match_type: "text"
          },
          {
            option_text: "Arrow Functions",
            option_type: "text",
            match_text: "Preserves the 'this' context in event handlers",
            match_type: "text"
          }
        ]
      }
    ]
  },

  // Topic: Conditional Rendering Techniques (Module 4)
  {
    topic_id: 179, // Eighth topic in the topics array
    module_id: 59, // Event Handling & Conditional Rendering
    title: "Implementing Conditional UI",
    description: "Create a component with multiple conditional rendering approaches",
    file: null,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    max_score: 50,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // Topic: Rendering Lists in React (Module 5)
  {
    topic_id: 180, // Ninth topic in the topics array
    module_id: 60, // Rendering Lists and Forms
    title: "List Rendering Challenge",
    description: "Create components that efficiently render dynamic lists",
    file: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    max_score: 70,
    status: "active",
    category: "true_false",
    created_by_type: "admin",
    updated_by_type: "admin",
    true_false_questions: [
      {
        question: "Each item in a list must have a unique 'key' prop",
        is_true: true,
        explanation: "Keys help React identify which items have changed, been added, or removed and should be unique among siblings."
      },
      {
        question: "Using the array index as a key is always the best practice",
        is_true: false,
        explanation: "Using the array index as a key can lead to issues if the list order changes. It's better to use a unique identifier from your data."
      },
      {
        question: "The key prop is passed to your component as a prop",
        is_true: false,
        explanation: "Keys are not accessible as props in the component; they're specially handled by React for reconciliation."
      }
    ]
  },

  // Topic: Controlled Components and Forms (Module 5)
  {
    topic_id: 181, // Tenth topic in the topics array
    module_id: 60, // Rendering Lists and Forms
    title: "Form Implementation Assignment",
    description: "Create a fully functional form with validation using controlled components",
    file: null,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    max_score: 90,
    status: "active",
    category: "regular",
    created_by_type: "admin",
    updated_by_type: "admin",
  },

  // Topic: Introduction to React Router (Module 6)
  {
    topic_id: 182, // Eleventh topic in the topics array
    module_id: 61, // React Router Basics
    title: "Basic Routing Implementation",
    description: "Set up basic routing in a React application",
    file: null,
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    max_score: 80,
    status: "active",
    category: "paragraph_writing",
    created_by_type: "admin",
    updated_by_type: "admin",
    paragraph_questions: [
      {
        paragraph: "React Router is the standard routing library for React applications."
      }
    ]
  }
];

// Export the data for use in index.js
const createReactCourse = async () => {
  try {
    console.log("Initializing React Basics Course Data...");

    // Create Course Category if not exists
    const categoryRecords = [];
    for (const category of courseCategories) {
      let existing = await CourseCategory.findOne({ where: { category: category.category } });
      if (!existing) {
        existing = await CourseCategory.create({
          ...category,
          created_by: 1,
          updated_by: 1,
        });
      }
      categoryRecords.push(existing);
    }

    // Create Course if not exists
    const courseRecords = [];
    let createdCourse;
    for (const course of courses) {
      const existing = await Course.findOne({ where: { title: course.title } });
      if (existing) continue;

      const highestCourse = await Course.findOne({ order: [["sequence", "DESC"]] });
      const nextSequence = highestCourse ? highestCourse.sequence + 1 : 1;

      const categoryObj = categoryRecords.find(c => c.id === course.category_id);
      if (!categoryObj) {
        console.error(`❌ No matching category for course "${course.title}"`);
        continue;
      }
      const category_id = categoryObj.id;

      const status = "published";
      const created_by = 1;
      const updated_by = 1;

      const newCourse = await Course.create({
        ...course,
        sequence: nextSequence,
        status,
        category_id,
        created_by,
        updated_by,
        what_you_will_learn: course.what_you_will_learn || [],
        prerequisites: course.prerequisites || [],
        hashtags: course.hashtags || [],
      });

      createdCourse = newCourse,

        newCourse.public_hash = generatePublicHash(newCourse.id);
      await newCourse.save();

      const plainDescription = convert(course.description || "", { wordwrap: false });
      const courseText = `passage: ${course.title}. ${plainDescription}. What you will learn: ${newCourse.what_you_will_learn.join(". ")}. Hashtags: ${newCourse.hashtags.join(", ")}. Category: ${categoryRecords.find(c => c.id === category_id).category}`;
      const embedding = await getEmbedding(courseText);
      await newCourse.update({ embedding });

      if (course.created_by_type === "partner") {
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

      // Create Course FAQs
      for (const course of courseRecords) {
        const faqsForCourse = courseFAQs.filter(faq => faq.course_id === course.id);
        for (const faqData of faqsForCourse) {
          const faq = await CourseFAQ.create({
            course_id: course.id,
            question: faqData.question,
            created_by: 1,
            updated_by: 1,
            created_by_type: faqData.created_by_type,
            updated_by_type: faqData.updated_by_type,
          });

          for (const optionText of faqData.options) {
            await CourseFAQOption.create({
              faq_id: faq.id,
              option_text: optionText,
              created_by: 1,
              updated_by: 1,
              created_by_type: faqData.created_by_type,
              updated_by_type: faqData.updated_by_type,
            });
          }
        }
        console.log(`✅ Course FAQs created for course "${course.title}"`);
      }

      // Create Sessions
      for (const session of sessions) {
        const [createdSession] = await Session.findOrCreate({
          where: {
            course_id: session.course_id,
            title: session.title
          },
          defaults: {
            ...session,
            created_by: 1,
            updated_by: 1,
            created_by_type: "admin",
            updated_by_type: "admin",
          }
        });
        // Set public_hash for session
        createdSession.public_hash = generatePublicHash(createdSession.id);
        await createdSession.save();
      }

      // Create Modules
      const allSessions = await Session.findAll({
        where: {
          course_id: course.id
        }
      });

      for (const module of modules) {
        // Find the matching session by title to get the correct ID
        const course = courseRecords.find(c => c.id === module.course_id);
        const session = allSessions.find(s => s.id === module.session_id);

        const highestModule = await Module.findOne({
          where: { course_id: course.id },
          order: [["sequence_no", "DESC"]],
        });
        const nextSequence = highestModule ? highestModule.sequence_no + 1 : 1;

        if (session) {
          const [createdModule] = await Module.findOrCreate({
            where: {
              course_id: module.course_id,
              session_id: session.id,
              title: module.title
            },
            defaults: {
              ...module,
              sequence_no: nextSequence,
              created_by: 1,
              updated_by: 1,
              created_by_type: "admin",
              updated_by_type: "admin",
            }
          });
          // Set public_hash for module
          createdModule.public_hash = generatePublicHash(createdModule.id);
          await createdModule.save();
          console.log(`Created/Found Module: ${createdModule.title}`);
        } else {
          console.log(`Session not found for module: ${module.title}`);
        }
      }


      // Create Quizzes (following Khushi file pattern)
      const quizzes = [
        {
          module_id: 56, // Introduction to React
          title: "React Basics Quiz",
          duration_minutes: 15,
          passing_score: 70,
          max_attempts: 3,
          attempts_gap: 12,
          quizType: "normal",
          status: "active",
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          module_id: 57, // Components and Props
          title: "Components & Props Quiz",
          duration_minutes: 20,
          passing_score: 75,
          max_attempts: 2,
          attempts_gap: 24,
          quizType: "normal",
          status: "active",
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          module_id: 58, // Managing State with Hooks
          title: "React Hooks Quiz",
          duration_minutes: 25,
          passing_score: 80,
          max_attempts: 3,
          attempts_gap: 24,
          quizType: "normal",
          status: "active",
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          module_id: 59, // Event Handling & Conditional Rendering
          title: "Event Handling Quiz",
          duration_minutes: 15,
          passing_score: 70,
          max_attempts: 3,
          attempts_gap: 12,
          quizType: "normal",
          status: "active",
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          module_id: 60, // Rendering Lists and Forms
          title: "Lists & Forms Quiz",
          duration_minutes: 20,
          passing_score: 75,
          max_attempts: 2,
          attempts_gap: 24,
          quizType: "normal",
          status: "active",
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          module_id: 61, // React Router Basics
          title: "React Router Quiz",
          duration_minutes: 15,
          passing_score: 70,
          max_attempts: 3,
          attempts_gap: 12,
          quizType: "normal",
          status: "active",
          created_by_type: "admin",
          updated_by_type: "admin",
        }
      ];

      const quizQuestions = [
        // Quiz for Module 56 - Introduction to React
        {
          quiz_id: 51,
          module_id: 56,
          question_text: "What is React?",
          question_type: "mcq",
          marks: 5,
          sequence_no: 1,
          options: [
            { text: "A JavaScript library for building user interfaces", correct: true },
            { text: "A programming language", correct: false },
            { text: "A database management system", correct: false },
            { text: "A web server", correct: false },
          ],
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 51,
          module_id: 56,
          question_text: "React was developed by engineers at _____",
          question_type: "complete-sentence",
          marks: 5,
          sequence_no: 2,
          blanks: [{ correct_word: "Facebook", hint: "F" }],
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 51,
          module_id: 56,
          question_text: "JSX stands for JavaScript XML",
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

        // Quiz for Module 57 - Components and Props
        {
          quiz_id: 52,
          module_id: 57,
          question_text: "What are props in React?",
          question_type: "mcq",
          marks: 5,
          sequence_no: 1,
          options: [
            { text: "Internal component state", correct: false },
            { text: "Data passed from parent to child components", correct: true },
            { text: "Event handlers", correct: false },
            { text: "CSS styles", correct: false },
          ],
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 52,
          module_id: 57,
          question_text: "Props are _____ in React components",
          question_type: "complete-sentence",
          marks: 5,
          sequence_no: 2,
          blanks: [{ correct_word: "read-only", hint: "read" }],
          created_by_type: "admin",
          updated_by_type: "admin",
        },

        // Quiz for Module 58 - Managing State with Hooks
        {
          quiz_id: 53,
          module_id: 58,
          question_text: "Which hook is used for state management in functional components?",
          question_type: "mcq",
          marks: 5,
          sequence_no: 1,
          options: [
            { text: "useState", correct: true },
            { text: "useEffect", correct: false },
            { text: "useContext", correct: false },
            { text: "useReducer", correct: false },
          ],
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 53,
          module_id: 58,
          question_text: "The _____ hook runs after every render by default",
          question_type: "complete-sentence",
          marks: 5,
          sequence_no: 2,
          blanks: [{ correct_word: "useEffect", hint: "use" }],
          created_by_type: "admin",
          updated_by_type: "admin",
        },

        // Quiz for Module 59 - Event Handling & Conditional Rendering
        {
          quiz_id: 54,
          module_id: 59,
          question_text: "React events are named using camelCase",
          question_type: "true-false",
          marks: 5,
          sequence_no: 1,
          options: [
            { text: "true", correct: true },
            { text: "false", correct: false },
          ],
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 54,
          module_id: 59,
          question_text: "Conditional rendering allows you to _____ content based on conditions",
          question_type: "complete-sentence",
          marks: 5,
          sequence_no: 2,
          blanks: [{ correct_word: "show or hide", hint: "show" }],
          created_by_type: "admin",
          updated_by_type: "admin",
        },

        // Quiz for Module 60 - Rendering Lists and Forms
        {
          quiz_id: 55,
          module_id: 60,
          question_text: "What is the purpose of the 'key' prop in lists?",
          question_type: "mcq",
          marks: 5,
          sequence_no: 1,
          options: [
            { text: "To style list items", correct: false },
            { text: "To help React identify which items have changed", correct: true },
            { text: "To make items clickable", correct: false },
            { text: "To add animations", correct: false },
          ],
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 55,
          module_id: 60,
          question_text: "Controlled components have their form data handled by _____",
          question_type: "complete-sentence",
          marks: 5,
          sequence_no: 2,
          blanks: [{ correct_word: "React state", hint: "React" }],
          created_by_type: "admin",
          updated_by_type: "admin",
        },

        // Quiz for Module 61 - React Router Basics
        {
          quiz_id: 56,
          module_id: 61,
          question_text: "What is React Router used for?",
          question_type: "mcq",
          marks: 5,
          sequence_no: 1,
          options: [
            { text: "State management", correct: false },
            { text: "Client-side routing", correct: true },
            { text: "API calls", correct: false },
            { text: "Styling components", correct: false },
          ],
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 56,
          module_id: 61,
          question_text: "The _____ component renders UI when the current location matches the route's path",
          question_type: "complete-sentence",
          marks: 5,
          sequence_no: 2,
          blanks: [{ correct_word: "Route", hint: "R" }],
          created_by_type: "admin",
          updated_by_type: "admin",
        }
      ];

      // Additional Question Types for React Course
      const audioToScriptQuestions = [
        {
          quiz_id: 51, // React Basics Quiz
          url: "/audiotoScript/react_introduction.mp3",
          script: "React is a JavaScript library for building user interfaces. It was developed by Facebook engineers and is now maintained by Meta. React allows developers to create reusable UI components and efficiently update the DOM through a virtual representation.",
          marks: 5,
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 52, // Components & Props Quiz
          url: "/audiotoScript/react_props_explained.mp3",
          script: "Props, short for properties, are a way of passing data from parent to child components in React. They are read-only and help make your components reusable. Props can be any type of data including strings, numbers, objects, arrays, and even functions.",
          marks: 8,
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 53, // React Hooks Quiz
          url: "/audiotoScript/react_hooks_basics.mp3",
          script: "React Hooks were introduced in React 16.8 to allow functional components to use state and other React features. The most commonly used hooks are useState for state management and useEffect for side effects. Hooks must be called at the top level of your component.",
          marks: 6,
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 54, // Event Handling Quiz
          url: "/audiotoScript/react_events.mp3",
          script: "React events are named using camelCase, such as onClick, onChange, and onSubmit. They are passed as JSX attributes and receive a synthetic event object. Event handlers can be defined as functions or arrow functions within your component.",
          marks: 7,
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 55, // Lists & Forms Quiz
          url: "/audiotoScript/react_lists_forms.mp3",
          script: "When rendering lists in React, each item should have a unique key prop to help React identify which items have changed. Controlled components are form elements whose values are controlled by React state, making them the single source of truth for form data.",
          marks: 5,
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 56, // React Router Quiz
          url: "/audiotoScript/react_router_intro.mp3",
          script: "React Router is the standard routing library for React applications. It enables client-side routing, allowing users to navigate between different views without page refreshes. The BrowserRouter component uses the HTML5 history API to keep the UI in sync with the URL.",
          marks: 6,
          created_by_type: "admin",
          updated_by_type: "admin",
        }
      ];

      const realWordQuestions = [
        {
          quiz_id: 51,
          words: ["react", "jsx", "component", "virtual", "dom"],
          correct_answers: ["yes", "yes", "yes", "yes", "yes"],
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 52,
          words: ["props", "state", "reusable", "parent", "child"],
          correct_answers: ["yes", "yes", "yes", "yes", "yes"],
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 53,
          words: ["hooks", "usestate", "useeffect", "functional", "sideeffects"],
          correct_answers: ["yes", "yes", "yes", "yes", "no"],
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 54,
          words: ["events", "camelcase", "onclick", "synthetic", "handler"],
          correct_answers: ["yes", "yes", "yes", "yes", "yes"],
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 55,
          words: ["lists", "keys", "controlled", "forms", "state"],
          correct_answers: ["yes", "yes", "yes", "yes", "yes"],
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 56,
          words: ["router", "routing", "browserrouter", "navigation", "url"],
          correct_answers: ["yes", "yes", "yes", "yes", "yes"],
          created_by_type: "admin",
          updated_by_type: "admin",
        }
      ];

      const summarizePassageQuestions = [
        {
          quiz_id: 51,
          passage: `React is a declarative, efficient, and flexible JavaScript library for building user interfaces. It was developed by Facebook engineers and first released in 2013. React allows developers to create large web applications that can change data without reloading the page. The library uses a component-based architecture where UIs are broken down into small, reusable pieces called components. React introduces JSX, a syntax extension that allows developers to write HTML-like code within JavaScript. One of React's key features is its virtual DOM, which is a lightweight copy of the actual DOM. When state changes occur, React compares the virtual DOM with the real DOM and efficiently updates only the necessary parts, resulting in better performance. React is often used with other libraries and tools like Redux for state management, React Router for routing, and various build tools like Webpack and Babel.`,
          time_limit: 6,
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 52,
          passage: `Props in React are a fundamental mechanism for passing data between components. The term "props" is short for "properties" and represents the way data flows from parent components to child components. Props are read-only, meaning that child components cannot modify the props they receive from their parents. This unidirectional data flow helps maintain predictable and manageable application state. Props can contain any type of data including primitive values like strings and numbers, complex data structures like objects and arrays, and even functions that can be called by child components. When a parent component passes props to a child, the child receives them as a single object that can be destructured for easier access. Props make components highly reusable because the same component can render different content based on the props it receives. This pattern is essential for building modular and maintainable React applications.`,
          time_limit: 6,
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 53,
          passage: `React Hooks represent a significant evolution in React development, introduced in version 16.8 to address the complexity of class components and the difficulty of reusing stateful logic between components. Hooks allow functional components to use state and other React features that were previously only available in class components. The useState hook is the most fundamental hook that enables functional components to manage local state. It returns an array with the current state value and a function to update it. The useEffect hook handles side effects in functional components, serving the same purpose as componentDidMount, componentDidUpdate, and componentWillUnmount in class components. Hooks follow specific rules: they must be called at the top level of components, cannot be called inside loops, conditions, or nested functions, and should only be called from React functions or custom hooks. Custom hooks can be created to extract component logic into reusable functions, promoting code reusability and separation of concerns.`,
          time_limit: 6,
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 54,
          passage: `Event handling in React follows a pattern that's similar to handling events in regular DOM elements, but with important syntactical and functional differences. React events are named using camelCase convention, so the HTML onclick becomes onClick, onchange becomes onChange, and onsubmit becomes onSubmit. React passes a synthetic event object to event handlers, which is a cross-browser wrapper around the native browser event. This synthetic event provides a consistent interface across different browsers and includes additional features like automatic event pooling. Event handlers in React can be defined as regular functions or arrow functions within the component. Arrow functions are often preferred because they automatically bind the 'this' context, preventing common binding issues. React automatically handles the binding of event handlers to the component instance, eliminating the need for manual binding that was required in class components. Event handlers can prevent default behavior using event.preventDefault() and stop event propagation using event.stopPropagation().`,
          time_limit: 6,
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 55,
          passage: `List rendering and form handling are two essential concepts in React development that enable dynamic and interactive user interfaces. When rendering lists in React, developers typically use the JavaScript map() method to transform arrays of data into arrays of JSX elements. Each item in a list must have a unique 'key' prop that helps React identify which items have changed, been added, or removed during re-renders. Keys should be stable, predictable, and unique among siblings to ensure optimal performance and correct component behavior. Controlled components are form elements whose values are controlled by React state, making React the single source of truth for form data. This approach provides several benefits including better control over form validation, easier implementation of complex form logic, and consistent state management. When users interact with controlled components, React updates the state, which in turn updates the component's render output. This creates a predictable data flow and makes it easier to implement features like form validation, conditional rendering based on form state, and programmatic form manipulation.`,
          time_limit: 6,
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 56,
          passage: `React Router is the de facto standard routing library for React applications, enabling developers to create single-page applications with multiple views and navigation capabilities. It provides a way to implement client-side routing, allowing users to navigate between different parts of an application without full page refreshes. The BrowserRouter component is the primary router that uses the HTML5 history API to keep the UI in sync with the URL. Route components are used to define which component should render when the current location matches a specific path. These routes can be nested to create complex routing hierarchies. Link components provide declarative navigation between routes, while the useNavigate hook enables programmatic navigation. React Router also provides hooks like useParams for accessing URL parameters and useLocation for getting information about the current URL. The library supports various routing patterns including dynamic routes with parameters, nested routes, and protected routes that require authentication.`,
          time_limit: 6,
          created_by_type: "admin",
          updated_by_type: "admin",
        }
      ];

      const bestOptionQuestions = [
        {
          quiz_id: 51,
          passage: "React is a ____ library for building ____. It was developed by engineers at ____ and uses a ____ architecture.",
          blanked_words: [
            { word: "JavaScript", options: ["JavaScript", "Python", "Java", "C++"], position: 1 },
            { word: "user interfaces", options: ["user interfaces", "databases", "servers", "algorithms"], position: 2 },
            { word: "Facebook", options: ["Facebook", "Google", "Microsoft", "Apple"], position: 3 },
            { word: "component-based", options: ["component-based", "object-oriented", "functional", "procedural"], position: 4 }
          ],
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 52,
          passage: "Props are ____ that are passed from ____ to ____ components. They are ____ and help make components ____.",
          blanked_words: [
            { word: "data", options: ["data", "functions", "styles", "events"], position: 1 },
            { word: "parent", options: ["parent", "child", "sibling", "root"], position: 2 },
            { word: "child", options: ["child", "parent", "sibling", "ancestor"], position: 3 },
            { word: "read-only", options: ["read-only", "mutable", "private", "public"], position: 4 },
            { word: "reusable", options: ["reusable", "unique", "complex", "simple"], position: 5 }
          ],
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 53,
          passage: "The ____ hook is used for state management, while the ____ hook handles side effects. Hooks must be called at the ____ level of components.",
          blanked_words: [
            { word: "useState", options: ["useState", "useEffect", "useContext", "useReducer"], position: 1 },
            { word: "useEffect", options: ["useEffect", "useState", "useMemo", "useCallback"], position: 2 },
            { word: "top", options: ["top", "bottom", "middle", "any"], position: 3 }
          ],
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 54,
          passage: "React events are named using ____ and receive a ____ event object. Event handlers can be ____ or ____ functions.",
          blanked_words: [
            { word: "camelCase", options: ["camelCase", "snake_case", "PascalCase", "kebab-case"], position: 1 },
            { word: "synthetic", options: ["synthetic", "native", "custom", "virtual"], position: 2 },
            { word: "regular", options: ["regular", "arrow", "async", "generator"], position: 3 },
            { word: "arrow", options: ["arrow", "regular", "async", "generator"], position: 4 }
          ],
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 55,
          passage: "When rendering lists, each item needs a unique ____ prop. Controlled components have their form data handled by ____ state.",
          blanked_words: [
            { word: "key", options: ["key", "id", "index", "name"], position: 1 },
            { word: "React", options: ["React", "DOM", "JavaScript", "HTML"], position: 2 }
          ],
          created_by_type: "admin",
          updated_by_type: "admin",
        },
        {
          quiz_id: 56,
          passage: "React Router enables ____ routing in React applications. The ____ component uses the HTML5 history API to keep the UI in sync with the ____.",
          blanked_words: [
            { word: "client-side", options: ["client-side", "server-side", "static", "dynamic"], position: 1 },
            { word: "BrowserRouter", options: ["BrowserRouter", "HashRouter", "MemoryRouter", "StaticRouter"], position: 2 },
            { word: "URL", options: ["URL", "path", "route", "location"], position: 3 }
          ],
          created_by_type: "admin",
          updated_by_type: "admin",
        }
      ];


      const allModules = await Module.findAll({
        where: {
          course_id: course.id
        }
      });

      const createdQuizzes = [];
      // Create quizzes and questions following Khushi pattern
      for (const quizData of quizzes) {
        const module = allModules.find(m => m.id === quizData.module_id);
        if (!module) continue;

        // Only create quizzes for the React course
        if (createdCourse.title === "React Basics: A Comprehensive Introduction") {
          const quiz = await Quizzes.create({
            ...quizData,
            module_id: module.id,
            created_by: 1,
            updated_by: 1,
          });
          console.log(`✅ Quiz "${quiz.title}" created for module "${module.title}"`);

          // Create all quiz questions using unified structure

          // 1. MCQ and True/False Questions
          const quizQuestionSet = quizQuestions.filter(q => q.module_id === module.id);
          for (const questionData of quizQuestionSet) {
            if (questionData.question_type === "mcq" || questionData.question_type === "true-false") {
              const question = await QuizQuestion.create({
                quiz_id: quiz.id,
                type: questionData.question_type === "mcq" ? "mcq" : "mcq", // Both use mcq type
                marks: questionData.marks,
                mcq_question_text: questionData.question_text,
                is_active: true,
                created_by: 1,
                updated_by: 1,
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
                  created_by: 1,
                  updated_by: 1,
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
                created_by: 1,
                updated_by: 1,
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
                  created_by: 1,
                  updated_by: 1,
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
              created_by: 1,
              updated_by: 1,
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
              created_by: 1,
              updated_by: 1,
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
              created_by: 1,
              updated_by: 1,
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
              created_by: 1,
              updated_by: 1,
              created_by_type: "admin",
              updated_by_type: "admin",
            });
          }

          // 7. Drag Drop Questions (if any)
          // Note: You'll need to add drag drop data to your seed data if you want to include them

          console.log(`✅ All questions added to quiz "${quiz.title}"`);
          createdQuizzes.push(quiz);
        }
      }



      // Create Topics


      // create Topics
      for (const [topicIndex, topic] of topics.entries()) {

        // Find the correct module by matching the relative position
        const module = allModules.find(m => m.id === topic.module_id);


        if (module) {

        const highestTopic = await Topic.findOne({
            where: { module_id: module.id },
            order: [["sequence_no", "DESC"]],
          });
          const nextSequence = highestTopic ? highestTopic.sequence_no + 1 : 1;

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

          const [createdTopic] = await Topic.findOrCreate({
            where: {
              module_id: module.id,
              title: topic.title
            },
            defaults: {
              module_id: module.id,
              title: topic.title,
              description: topic.description,
              content_type: topic.content_type, module_id: module.id,
              sequence_no: nextSequence,
              topic_duration: calculatedTopicDuration,
              extra_duration: extraDuration,
              total_duration: totalDuration,
              created_by: 1,
              updated_by: 1,
              created_by_type: "admin",
              updated_by_type: "admin",
            }
          });
          // Set public_hash for topic
          createdTopic.public_hash = generatePublicHash(createdTopic.id);
          await createdTopic.save();
          console.log(`Created/Found Topic: ${createdTopic.title}`);

          // Create the specific content type for this topic
          switch (topic.content_type) {
            case 'video':
              if (topic.video) {
                const [createdVideo] = await Video.findOrCreate({
                  where: {
                    topic_id: createdTopic.id
                  },
                  defaults: {
                    ...topic.video,
                    topic_id: createdTopic.id,
                    created_by: 1,
                    updated_by: 1,
                    created_by_type: "admin",
                    updated_by_type: "admin",
                  }
                });
                console.log(`Created/Found Video for topic: ${createdTopic.title}`);
              }
              break;
            case 'audio':
              if (topic.audio) {
                const [createdAudio] = await Audio.findOrCreate({
                  where: {
                    topic_id: createdTopic.id
                  },
                  defaults: {
                    ...topic.audio,
                    topic_id: createdTopic.id,
                    created_by: 1,
                    updated_by: 1,
                    created_by_type: "admin",
                    updated_by_type: "admin",
                  }
                });
                console.log(`Created/Found Audio for topic: ${createdTopic.title}`);
              }
              break;
            case 'accordian':
              if (topic.accordions && Array.isArray(topic.accordions)) {
                for (const accordionData of topic.accordions) {
                  const [createdAccordion] = await Accordion.findOrCreate({
                    where: {
                      topic_id: createdTopic.id,
                      title: accordionData.title
                    },
                    defaults: {
                      ...accordionData,
                      duration_minutes: await getAudioDurationInMinutes(accordionData.audio_url || null),
                      topic_id: createdTopic.id,
                      created_by: 1,
                      updated_by: 1,
                      created_by_type: "admin",
                      updated_by_type: "admin",
                    }
                  });
                  console.log(`Created/Found Accordion: ${createdAccordion.title} for topic: ${createdTopic.title}`);
                }
              }
              break;
            case 'general':
              if (topic.general) {
                // Create/Find core general row (remove legacy single material fields)
                const generalCoreData = {
                  title: topic.general.title || `General Content for ${createdTopic.title}`,
                  description: topic.general.description || 'General description',
                  completion_type: topic.general.completion_type || 'audio',
                  audio_url: topic.general.audio_url || null,
                  duration_minutes: topic.general.completion_type === 'timer' ? 0 : await getAudioDurationInMinutes(topic.general.audio_url || null),
                  codeLanguage: topic.general.codeLanguage || null,
                  code: topic.general.code || null
                };
                const [createdGeneral] = await GeneralMaterial.findOrCreate({
                  where: { topic_id: createdTopic.id },
                  defaults: {
                    ...generalCoreData,
                    topic_id: createdTopic.id,
                    created_by: 1,
                    updated_by: 1,
                    created_by_type: 'admin',
                    updated_by_type: 'admin'
                  }
                });
                // Attach auxiliary materials if provided via topic.general.materials (array) else seed defaults
                const materialCount = await Material.count({ where: { topic_id: createdTopic.id } });
                if (!materialCount) {
                  const materialsSeed = (topic.general.materials && Array.isArray(topic.general.materials)) ? topic.general.materials : [
                    // { material_type: 'pdf', url: '/general/pdf/sample.pdf' },
                    { material_type: 'link', url: 'https://react.dev/learn' },
                    // { material_type: 'image', url: '/general/images/sample.png' }
                  ];
                  await Material.bulkCreate(materialsSeed.map(m => ({
                    topic_id: createdTopic.id,
                    material_type: m.material_type,
                    url: m.url,
                    created_by: 1,
                    updated_by: 1,
                    created_by_type: 'admin',
                    updated_by_type: 'admin'
                  })));
                }
                console.log(`Created/Found General material (updated schema) for topic: ${createdTopic.title}`);
              }
              break;
            case 'slide':
              if (topic.slides && Array.isArray(topic.slides)) {
                // Create the MultiSlide parent
                let computedSlidesTopicDuration = 0;
                for (const [index, slide] of topic.slides.entries()) {
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

                  const [createdMultiSlide] = await MultiSlide.findOrCreate({
                    where: {
                      topic_id: createdTopic.id
                    },
                    defaults: {
                      topic_id: createdTopic.id,
                      sequence_no: index + 1,
                      title: slide.title,
                      description: slide.description,
                      type: slide.content_type,
                      audio_url: slide.audio_url || null,
                      slide_duration: slideDur,
                      slide_extra_duration: slideExtra,
                      total_slide_duration: slideDur + slideExtra,
                      created_by: 1,
                      updated_by: 1,
                      created_by_type: "admin",
                      updated_by_type: "admin",
                    }
                  });

                  if (!createdMultiSlide.slide_duration || Number(createdMultiSlide.slide_duration) === 0) {
                    await createdMultiSlide.update({
                      slide_duration: slideDur,
                      slide_extra_duration: slideExtra,
                      total_slide_duration: slideDur + slideExtra,
                    });
                  }

                  // Based on the slide content_type, create appropriate slide type
                  switch (slide.content_type) {
                    case 'video':
                      if (slide.video) {
                        const [createdSlideVideo] = await MultiSlideVideo.findOrCreate({
                          where: {
                            multi_slide_id: createdMultiSlide.id,
                          },
                          defaults: {
                            ...slide,
                            ...slide.video,
                            multi_slide_id: createdMultiSlide.id,
                            slide_number: index + 1,
                            created_by: 1,
                            updated_by: 1,
                            created_by_type: "admin",
                            updated_by_type: "admin",
                          }
                        });
                        console.log(`Created/Found MultiSlide Video: ${slide.title}`);
                      }
                      break;
                    // case 'audio':
                    //   if (slide.audio) {
                    //     const [createdSlideAudio] = await MultiSlideAudio.findOrCreate({
                    //       where: {
                    //         multi_slide_id: createdMultiSlide.id,
                    //       },
                    //       defaults: {
                    //         ...slide,
                    //         ...slide.audio,
                    //         multi_slide_id: createdMultiSlide.id,
                    //         slide_number: index + 1,
                    //         created_by: 1,
                    //         updated_by: 1,
                    //         created_by_type: "admin",
                    //         updated_by_type: "admin",
                    //       }
                    //     });
                    //     console.log(`Created/Found MultiSlide Audio: ${slide.title}`);
                    //   }
                    //   break;
                    case 'general':
                      if (slide.general) {
                        const generalSlideCore = {
                          codeLanguage: slide.general.codeLanguage || null,
                          code: slide.general.code || null
                        };
                        const [createdSlideGeneral] = await MultiSlideGeneral.findOrCreate({
                          where: { multi_slide_id: createdMultiSlide.id },
                          defaults: {
                            ...generalSlideCore,
                            multi_slide_id: createdMultiSlide.id,
                            created_by: 1,
                            updated_by: 1,
                            created_by_type: 'admin',
                            updated_by_type: 'admin'
                          }
                        });
                        // const slideMaterialsCount = await Material.count({ where: { slide_general_id: createdSlideGeneral.id } });
                        // if (!slideMaterialsCount) {
                        //   const slideMaterialSeed = (slide.general.materials && Array.isArray(slide.general.materials)) ? slide.general.materials : [
                        //     // { material_type: 'pdf', url: '/multiSlide/general/pdf/sample.pdf' },
                        //     // { material_type: 'document', url: '/multiSlide/general/doc/sample.docx' },
                        //     { material_type: 'link', url: 'https://react.dev/reference' }
                        //   ];
                        //   await Material.bulkCreate(slideMaterialSeed.map(m => ({
                        //     slide_general_id: createdSlideGeneral.id,
                        //     material_type: m.material_type,
                        //     url: m.url,
                        //     created_by: 1,
                        //     updated_by: 1,
                        //     created_by_type: 'admin',
                        //     updated_by_type: 'admin'
                        //   })));
                        // }
                        console.log(`Created/Found MultiSlide General (updated schema): ${slide.title}`);
                      }
                      break;
                    case 'accordian':
                      if (slide.accordions && Array.isArray(slide.accordians)) {
                        const [createdSlideAccordion] = await MultiSlideAccordion.findOrCreate({
                          where: {
                            multi_slide_id: createdMultiSlide.id,
                          },
                          defaults: {
                            title: slide.title,
                            description: slide.description,
                            multi_slide_id: createdMultiSlide.id,
                            slide_number: index + 1,
                            audio_url: slide.audio_url,
                            created_by: 1,
                            updated_by: 1,
                            created_by_type: "admin",
                            updated_by_type: "admin",
                          }
                        });

                        // Create the individual accordions for this slide
                        for (const accordionData of slide.accordions) {
                          await Accordion.findOrCreate({
                            where: {
                              multi_slide_accordion_id: createdSlideAccordion.id,
                              title: accordionData.title
                            },
                            defaults: {
                              ...accordionData,
                              multi_slide_accordion_id: createdSlideAccordion.id,
                              created_by: 1,
                              updated_by: 1,
                              created_by_type: "admin",
                              updated_by_type: "admin",
                            }
                          });
                        }
                        console.log(`Created/Found MultiSlide Accordion: ${slide.title}`);
                      }
                      break;
                  }
                }
                await createdTopic.update({
                  topic_duration: computedSlidesTopicDuration,
                  total_duration: computedSlidesTopicDuration + (extraDuration || 0),
                });
                console.log(`Created/Found MultiSlide for topic: ${createdTopic.title}`);
              }
              break;
          }

          // Add a quiz to some topics for topic-level quiz testing
          if (topicIndex < createdQuizzes.length) {
            // Add a topic_content entry with quiz_id for this topic
            await TopicContent.findOrCreate({
              where: {
                module_id: module.id,
                topic_id: createdTopic.id,
                quiz_id: createdQuizzes[topicIndex].id,
              },
              defaults: {
                module_id: module.id,
                topic_id: createdTopic.id,
                quiz_id: createdQuizzes[topicIndex].id,
                created_by: 1,
                updated_by: 1,
              },
            });
            console.log(`Added topic-level quiz to topic: ${createdTopic.title}`);
          }
        } else {
          console.log(`Module not found for topic: ${topic.title}`);
        }
      }


      for (const assignmentData of assignments) {
        const module = await Module.findOne({ where: { id: assignmentData.module_id } });
        if (!module) continue;

        const newAssignment = await Assignment.create({
          ...assignmentData,
          created_by: 1,
          updated_by: 1,
        });

        // Create matching questions if this is a matching assignment
        if (assignmentData.category === "matching" && assignmentData.matching_questions) {
          for (const question of assignmentData.matching_questions) {
            const matchingQuestion = await MatchingQuestion.create({
              assignment_id: newAssignment.id,
              question_text: question.question_text,
              created_by: 1,
              updated_by: 1,
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
                created_by: 1,
                updated_by: 1,
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
              created_by: 1,
              updated_by: 1,
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
              created_by: 1,
              updated_by: 1,
              created_by_type: "admin",
              updated_by_type: "admin",
            });
          }
        }

        console.log(`Created module-level assignment: ${newAssignment.title}`);
      }

      // Create topic-level assignments
      for (const assignmentData of topicAssignments) {
        const topic = await Topic.findOne({ where: { id: assignmentData.topic_id } });
        if (!topic) continue;

        const newAssignment = await Assignment.create({
          ...assignmentData,
          created_by: 1,
          updated_by: 1,
        });

        // Create fill in the blanks questions if they exist
        if (assignmentData.category === "fill_in_the_blanks" && assignmentData.fill_blank_questions) {
          for (const question of assignmentData.fill_blank_questions) {
            await FillTheBlanksQuestion.create({
              assignment_id: newAssignment.id,
              question_text: question.question_text,
              answers: question.answers,
              created_by: 1,
              updated_by: 1,
              created_by_type: "admin",
              updated_by_type: "admin",
            });
          }
        }

        // Create paragraph writing questions if they exist
        if (assignmentData.category === "paragraph_writing" && assignmentData.paragraph_questions) {
          for (const question of assignmentData.paragraph_questions) {
            await ParagraphWriting.create({
              assignment_id: newAssignment.id,
              paragraph: question.paragraph,
              created_by: 1,
              updated_by: 1,
              created_by_type: "admin",
              updated_by_type: "admin",
            });
          }
        }

        // Link the assignment to the topic via topic_content
        await TopicContent.findOrCreate({
          where: {
            module_id: topic.module_id,
            topic_id: topic.id,
            assignment_id: newAssignment.id,
          },
          defaults: {
            module_id: topic.module_id,
            topic_id: topic.id,
            assignment_id: newAssignment.id,
            created_by: 1,
            updated_by: 1,
          },
        });

        console.log(`Created topic-level assignment: ${newAssignment.title}`);
      }



      // Create Topics
      // const allModules = await Module.findAll({
      //   where: {
      //     course_id: course.id
      //   }
      // });

      // for (const [topicIndex, topic] of topics.entries()) {
      //   // Find the correct module by matching the relative position
      //   const moduleIndex = topic.module_id - 39; // 39 is the assumed starting ID
      //   const module = allModules[moduleIndex];

      //   if (module) {
      //     const [createdTopic] = await Topic.findOrCreate({
      //       where: {
      //         module_id: module.id,
      //         title: topic.title
      //       },
      //       defaults: {
      //         ...topic,
      //         module_id: module.id,
      //         created_by: 1,
      //         updated_by: 1,
      //         created_by_type: "admin",
      //         updated_by_type: "admin",
      //         public_hash: await generatePublicHash()
      //       }
      //     });

      //     // Create the specific content type for this topic
      //     switch (topic.content_type) {
      //       case 'video':
      //         if (topic.video) {
      //           const [createdVideo] = await Video.findOrCreate({
      //             where: {
      //               topic_id: createdTopic.id
      //             },
      //             defaults: {
      //               ...topic.video,
      //               topic_id: createdTopic.id,
      //               created_by: 1,
      //               updated_by: 1,
      //               created_by_type: "admin",
      //               updated_by_type: "admin",
      //             }
      //           });
      //         }
      //         break;
      //       case 'audio':
      //         if (topic.audio) {
      //           const [createdAudio] = await Audio.findOrCreate({
      //             where: {
      //               topic_id: createdTopic.id
      //             },
      //             defaults: {
      //               ...topic.audio,
      //               topic_id: createdTopic.id,
      //               created_by: 1,
      //               updated_by: 1,
      //               created_by_type: "admin",
      //               updated_by_type: "admin",
      //             }
      //           });
      //         }
      //         break;
      //       case 'accordian':
      //         if (topic.accordions && Array.isArray(topic.accordions)) {
      //           for (const accordionData of topic.accordions) {
      //             const [createdAccordion] = await Accordion.findOrCreate({
      //               where: {
      //                 topic_id: createdTopic.id,
      //                 title: accordionData.title
      //               },
      //               defaults: {
      //                 ...accordionData,
      //                 topic_id: createdTopic.id,
      //                 created_by: 1,
      //                 updated_by: 1,
      //                 created_by_type: "admin",
      //                 updated_by_type: "admin",
      //               }
      //             });
      //           }
      //         }
      //         break;
      //       case 'general':
      //         if (topic.general) {
      //           const [createdGeneral] = await GeneralMaterial.findOrCreate({
      //             where: {
      //               topic_id: createdTopic.id
      //             },
      //             defaults: {
      //               ...topic.general,
      //               topic_id: createdTopic.id,
      //               created_by: 1,
      //               updated_by: 1,
      //               created_by_type: "admin",
      //               updated_by_type: "admin",
      //             }
      //           });
      //         }
      //         break;
      //       case 'slide':
      //         if (topic.slides && Array.isArray(topic.slides)) {
      //           // Create the MultiSlide parent
      //           const [createdMultiSlide] = await MultiSlide.findOrCreate({
      //             where: {
      //               topic_id: createdTopic.id
      //             },
      //             defaults: {
      //               topic_id: createdTopic.id,
      //               created_by: 1,
      //               updated_by: 1,
      //               created_by_type: "admin",
      //               updated_by_type: "admin",
      //             }
      //           });

      //           // Create each slide
      //           for (const [index, slide] of topic.slides.entries()) {
      //             // Based on the slide content_type, create appropriate slide type
      //             switch (slide.content_type) {
      //               case 'video':
      //                 if (slide.video) {
      //                   const [createdSlideVideo] = await MultiSlideVideo.findOrCreate({
      //                     where: {
      //                       multi_slide_id: createdMultiSlide.id,
      //                       slide_number: index + 1
      //                     },
      //                     defaults: {
      //                       ...slide,
      //                       ...slide.video,
      //                       multi_slide_id: createdMultiSlide.id,
      //                       slide_number: index + 1,
      //                       created_by: 1,
      //                       updated_by: 1,
      //                       created_by_type: "admin",
      //                       updated_by_type: "admin",
      //                     }
      //                   });
      //                 }
      //                 break;
      //               case 'audio':
      //                 if (slide.audio) {
      //                   const [createdSlideAudio] = await MultiSlideAudio.findOrCreate({
      //                     where: {
      //                       multi_slide_id: createdMultiSlide.id,
      //                       slide_number: index + 1
      //                     },
      //                     defaults: {
      //                       ...slide,
      //                       ...slide.audio,
      //                       multi_slide_id: createdMultiSlide.id,
      //                       slide_number: index + 1,
      //                       created_by: 1,
      //                       updated_by: 1,
      //                       created_by_type: "admin",
      //                       updated_by_type: "admin",
      //                     }
      //                   });
      //                 }
      //                 break;
      //               case 'general':
      //                 if (slide.general) {
      //                   const [createdSlideGeneral] = await MultiSlideGeneral.findOrCreate({
      //                     where: {
      //                       multi_slide_id: createdMultiSlide.id,
      //                       slide_number: index + 1
      //                     },
      //                     defaults: {
      //                       ...slide,
      //                       ...slide.general,
      //                       multi_slide_id: createdMultiSlide.id,
      //                       slide_number: index + 1,
      //                       created_by: 1,
      //                       updated_by: 1,
      //                       created_by_type: "admin",
      //                       updated_by_type: "admin",
      //                     }
      //                   });
      //                 }
      //                 break;
      //               case 'accordian':
      //                 if (slide.accordions && Array.isArray(slide.accordians)) {
      //                   const [createdSlideAccordion] = await MultiSlideAccordion.findOrCreate({
      //                     where: {
      //                       multi_slide_id: createdMultiSlide.id,
      //                       slide_number: index + 1
      //                     },
      //                     defaults: {
      //                       title: slide.title,
      //                       description: slide.description,
      //                       multi_slide_id: createdMultiSlide.id,
      //                       slide_number: index + 1,
      //                       audio_url: slide.audio_url,
      //                       created_by: 1,
      //                       updated_by: 1,
      //                       created_by_type: "admin",
      //                       updated_by_type: "admin",
      //                     }
      //                   });

      //                   // Create the individual accordions for this slide
      //                   for (const accordionData of slide.accordions) {
      //                     await Accordion.findOrCreate({
      //                       where: {
      //                         multi_slide_accordion_id: createdSlideAccordion.id,
      //                         title: accordionData.title
      //                       },
      //                       defaults: {
      //                         ...accordionData,
      //                         multi_slide_accordion_id: createdSlideAccordion.id,
      //                         created_by: 1,
      //                         updated_by: 1,
      //                         created_by_type: "admin",
      //                         updated_by_type: "admin",
      //                       }
      //                     });
      //                   }
      //                 }
      //                 break;
      //             }
      //           }
      //         }
      //         break;
      //     }

      //     // Add a quiz to some topics for topic-level quiz testing
      //     if (topicIndex < createdQuizzes.length) {
      //       // Add a topic_content entry with quiz_id for this topic
      //       await TopicContent.findOrCreate({
      //         where: {
      //           module_id: module.id,
      //           topic_id: createdTopic.id,
      //           quiz_id: createdQuizzes[topicIndex].id,
      //         },
      //         defaults: {
      //           module_id: module.id,
      //           topic_id: createdTopic.id,
      //           quiz_id: createdQuizzes[topicIndex].id,
      //           created_by: 1,
      //           updated_by: 1,
      //         },
      //       });
      //     }
      //   } else {
      //   }
      // }
    }

    console.log("React Basics Course initialization completed!");
  } catch (error) {
    console.error("Error initializing React Basics Course data:", error);
  }
};

module.exports = { createReactCourse };