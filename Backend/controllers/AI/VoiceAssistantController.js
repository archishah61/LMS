
const { GoogleGenerativeAI } = require('@google/generative-ai');
const sequelize = require("../../config/db");
const { callProcedure } = require('../../utils/procedure/callProcedure');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Consolidated route configurations
const routes = {
    public: {
        'home|main|homepage|index|start': '/',
        'about|about us|company|info': '/about-us',
        'contact|contact us|reach us|get in touch': '/contact-us',
        'login|signin|sign in|log in|enter|access': '/login',
        'signup|register|sign up|create account|join': '/signup',
        'courses|all courses|browse courses|course catalog|available courses|course list': '/courses',
        'course details|view course|course info': '/course/:courseId',
        'course content': '/course-content/:courseID',
        // Add course-specific navigation patterns
        'learn|start learning|begin course|start course|take course': '/course-content/:courseID',
        'view course|see course|check course|course page': '/course/:courseId',
    },
    student: {
        'student dashboard|my dashboard|dashboard|main dashboard|student panel': '/student-dashboard',
        'profile|my profile|user profile|student profile|account|personal info': '/user-profile',
        'wishlist|my wishlist|favorites|saved courses|bookmarks': '/user-wishlist',
        'enrolled courses|my courses|current courses|active courses': '/user-enrolled-courses',
        'purchases|my purchases|order history|buying history|transactions': '/user-purchases',
        'support tickets|my tickets|help tickets|support|help|assistance': '/user-support-tickets',
        'cheat sheets|cheatsheets|reference sheets|study sheets|quick reference|notes': '/cheat-sheets',
        'daily challenge|daily challenges|today challenge|challenge': '/daily-challenge',
        'challenges|quest challenges|challenge quest|practice|exercises': '/challenges',
    },
    partner: {
        'become partner|partner registration|join as partner|register partner|partner signup': '/become-partner/register',
    },
    admin: {
        'admin|admin login': '/admin/dashboard',
        'admin admin/dashboard|analytics|admin panel|backend|analytics overview|admin analytics|overview': '/admin/dashboard',
        'course management|manage courses|course admin': '/admin/dashboard/course',
        'partner profile|admin profile': '/admin/dashboard/profile',
        'challenge analytics|challenge stats': '/admin/dashboard/analytics/challenges',
        'time analytics|time stats': '/admin/dashboard/analytics/time-based',
        'course performance|course stats': '/admin/dashboard/analytics/course-performance',
        'leaderboard|rankings': '/admin/dashboard/analytics/leaderboard',
        'revenue analytics|revenue stats|earnings': '/admin/dashboard/analytics/revenue',
        'user engagement|engagement stats': '/admin/dashboard/analytics/user-engagement',
        'students|users|manage users|user management': '/admin/dashboard/users',
        'partners|manage partners|partner management': '/admin/dashboard/partners',
        'faq|frequently asked questions': '/admin/dashboard/faq-response',
        'questions|predefined questions': '/admin/dashboard/predefined-questions',
        'categories|course categories|category management': '/admin/dashboard/course-category-master',
        'quiz questions|quiz management': '/admin/dashboard/quiz/quiz-question',
        'quiz options': '/admin/dashboard/quiz/quiz-option',
        'sessions|course sessions': '/admin/dashboard/course/:courseId/sessions',
        'modules|course modules': '/admin/dashboard/course/:courseId/session/:sessionId/modules',
        'topics|course topics': '/admin/dashboard/course/:courseId/session/:sessionId/module/:moduleId/topics',
        'admin cheat sheets|manage cheat sheets': '/admin/dashboard/cheat-sheets',
        'admin challenges|manage challenges': '/admin/dashboard/challenges',
        'challenge categories|challenge category management': '/admin/dashboard/challenge-category-master',
        'admin support|support management': '/admin/dashboard/support',
        'roles|user roles|role management': '/admin/dashboard/roles',
        'admin users|admin user management': '/admin/dashboard/admin-user',
        'permissions|role permissions|access control': '/admin/dashboard/role-permissions',
        'countries|location countries': '/admin/dashboard/locations/countries',
        'states|location states': '/admin/dashboard/locations/states',
        'cities|location cities': '/admin/dashboard/locations/cities',
    }
};

// Response templates
const responses = {
    greetings: ["Woof! Hi there! I'm Buddy, your friendly learning companion!", "Hello! Buddy here, ready to help!", "Hey! I'm Buddy, your AI assistant!"],
    farewells: ["Goodbye! It was pawsome talking with you!", "See you later! Buddy out!", "Until next time! Keep learning!"],
    navigation: ["Coming right up! Let me fetch that page!", "On it! Taking you there now!", "Perfect! Let me guide you there!"],
    learning: ["Great question! Let me dig into this!", "Excellent! Time for some knowledge!", "Perfect learning moment!"],
    errors: ["Oops! My circuits got confused!", "Hmm, I'm not quite catching that!", "My bad! I didn't quite get that!"],
    clarification: ["I need a bit more info!", "Can you give me more details?", "Could you be more specific?"],
    courseFound: ["Found it! Taking you to that course!", "Perfect! Let me open that course for you!", "Great choice! Opening that course now!"],
    courseNotFound: ["Hmm, I couldn't find that course. Could you be more specific?", "I'm not sure which course you meant. Can you give me more details?"]
};

const conversationContexts = new Map();

// NEW: Course search function
const searchCourses = async (courseName, userId = null) => {
    try {
        // First try to find by exact title match
        let results = await callProcedure("searchCoursesByTitle", [courseName]);

        if (!results || results.length === 0) {
            // Try fuzzy search by keywords
            results = await callProcedure("searchCoursesByKeywords", [courseName]);
        }

        if (!results || results.length === 0) {
            // Try searching in course descriptions
            results = await callProcedure("searchCoursesInDescription", [courseName]);
        }

        // If still no results, try a more general search
        if (!results || results.length === 0) {
            const keywords = courseName.toLowerCase().split(' ');
            for (const keyword of keywords) {
                if (keyword.length > 2) { // Skip very short words
                    results = await callProcedure("searchCoursesByKeywords", [keyword]);
                    if (results && results.length > 0) break;
                }
            }
        }

        return results || [];
    } catch (error) {
        console.error('Error searching courses:', error);
        return [];
    }
};

const getRandomResponse = (category) => responses[category][Math.floor(Math.random() * responses[category].length)];

const cleanResponseForSpeech = (text) =>
    text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
        .replace(/:\)|:\(|:-\)|:-\(/g, '')
        .replace(/\s+/g, ' ')
        .trim();

const getResponseLength = (message) => {
    const messageLower = message.toLowerCase();
    if (['detailed', 'detail', 'elaborate', 'comprehensive', 'thorough'].some(k => messageLower.includes(k))) return 'detailed';
    if (['brief', 'quick', 'short', 'summary', 'simply'].some(k => messageLower.includes(k))) return 'brief';
    return 'intermediate';
};

// Enhanced learning context fetching
const fetchLearningContext = async (data) => {
    try {
        const context = {};
        const fetchers = [
            { key: 'course', id: data.courseId, proc: "getCourseById" },
            { key: 'session', id: data.activeSessionId, proc: "getSessionByPublicHash" },
            { key: 'module', id: data.activeModuleId, proc: "getModuleById" },
            { key: 'topic', id: data.activeTopicId, proc: "GetTopicById" }
        ];

        for (const { key, id, proc } of fetchers) {
            if (id) {
                const result = await callProcedure(proc, [id]);
                if (result?.length > 0) {
                    context[key] = key === 'topic' ? {
                        main: result[0] || [],
                        accordions: result[1] || [],
                        accordionAttachments: result[2] || [],
                        multiSlides: result[3] || [],
                        multiSlideVideos: result[4] || [],
                        multiSlideAudios: result[5] || [],
                        multiSlideGeneral: result[6] || [],
                        multiSlideAccordions: result[7] || [],
                        multiSlideAccordionAttachments: result[8] || [],
                        topicTags: result[9] || []
                    } : result[0];
                }
            }
        }
        return context;
    } catch (error) {
        console.error('Error fetching learning context:', error);
        return {};
    }
};

const formatLearningContext = (context) => {
    let formatted = "=== CURRENT LEARNING CONTEXT ===\n\n";

    if (context.course) {
        formatted += `📚 COURSE: ${context.course.title}\n   Description: ${context.course.description}\n`;
        if (context.course.what_you_will_learn) formatted += `   Learning Goals: ${context.course.what_you_will_learn}\n`;
        if (context.course.prerequisites) formatted += `   Prerequisites: ${context.course.prerequisites}\n`;
        formatted += "\n";
    }

    if (context.session) {
        formatted += `📖 SESSION: ${context.session.title || context.session.name}\n`;
        if (context.session.description) formatted += `   Description: ${context.session.description}\n`;
        formatted += "\n";
    }

    if (context.module) {
        formatted += `📝 MODULE: ${context.module.title}\n   Duration: ${context.module.duration_hours} hours\n`;
        if (context.module.description) formatted += `   Description: ${context.module.description}\n`;
        formatted += "\n";
    }

    if (context.topic?.main?.[0]) {
        const topic = context.topic.main[0];
        formatted += `🎯 CURRENT TOPIC: ${topic.title}\n`;
        if (topic.description) formatted += `   Description: ${topic.description}\n`;

        const contentTypes = [];
        if (topic['Video.url']) contentTypes.push(`Video (${topic['Video.duration_minutes']} min)`);
        if (topic['Audio.url']) contentTypes.push(`Audio (${topic['Audio.duration_minutes']} min)`);
        if (topic['GeneralMaterial.title']) contentTypes.push('Study Material');
        if (context.topic.accordions?.length > 0) contentTypes.push(`${context.topic.accordions.length} Additional Sections`);

        if (contentTypes.length > 0) formatted += `   Available Content: ${contentTypes.join(', ')}\n`;

        if (context.topic.topicTags?.length > 0) {
            const tags = context.topic.topicTags.map(tag => tag.tag_name || tag.name).join(', ');
            formatted += `\n🏷️ RELATED TAGS: ${tags}\n`;
        }
        formatted += "\n";
    }

    return formatted + "=== END CONTEXT ===\n";
};


const extractVoiceCommandWithGemini = async (message) => {
    try {
        const commandPrompt = `
You are a voice command classifier for an educational platform.

User Message: "${message}"

Available Voice Commands:
- GO_TO_NEXT_TOPIC: For "next topic", "go to next topic", "move to next topic", "next", "forward", "continue"
- GO_TO_PREVIOUS_TOPIC: For "previous topic", "go back", "previous", "back", "go to previous topic", "return"

Instructions:
1. Analyze if the user message is a navigation voice command
2. Match the intent to one of the available commands
3. Consider variations, synonyms, and natural language patterns
4. If no clear voice command is detected, return "NONE"

Response Format:
COMMAND: [GO_TO_NEXT_TOPIC/GO_TO_PREVIOUS_TOPIC/NONE]
CONFIDENCE: [high/medium/low]
REASONING: [brief explanation]

Examples:
- "next topic" → GO_TO_NEXT_TOPIC
- "go back" → GO_TO_PREVIOUS_TOPIC  
- "can you explain this?" → NONE
- "move forward" → GO_TO_NEXT_TOPIC
- "previous" → GO_TO_PREVIOUS_TOPIC
`;

        const result = await model.generateContent(commandPrompt);
        const response = result.response.text().trim();

        let command = null, confidence = 'low', reasoning = '';

        response.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('COMMAND:')) {
                const cmd = trimmed.replace('COMMAND:', '').trim();
                command = cmd === 'NONE' ? null : cmd;
            } else if (trimmed.startsWith('CONFIDENCE:')) {
                confidence = trimmed.replace('CONFIDENCE:', '').trim();
            } else if (trimmed.startsWith('REASONING:')) {
                reasoning = trimmed.replace('REASONING:', '').trim();
            }
        });

        return { command, confidence, reasoning };

    } catch (error) {
        console.error('Error extracting voice command with Gemini:', error);
        return { command: null, confidence: 'low', reasoning: 'Error in voice command detection' };
    }
};

const detectIntentWithGemini = async (message, context = {}) => {
    try {
        const { userType = 'student', conversationHistory = [], learningContext = null } = context;

        // Check for voice commands first using Gemini
        const voiceCommandResult = await extractVoiceCommandWithGemini(message);
        if (voiceCommandResult.command && voiceCommandResult.confidence !== 'low') {
            return {
                intent: 'VOICE_COMMAND',
                confidence: voiceCommandResult.confidence,
                reasoning: voiceCommandResult.reasoning,
                originalMessage: message,
                command: voiceCommandResult.command
            };
        }

        const recentHistory = conversationHistory.slice(-4)
            .map(h => `${h.role === 'user' ? 'User' : 'Buddy'}: ${h.message}`)
            .join('\n');

        const availableIntents = {
            'GREETING': 'User is greeting or saying hello',
            'FAREWELL': 'User is saying goodbye or ending conversation',
            'NAVIGATION': 'User wants to go to a specific page or section',
            'COURSE_SPECIFIC_NAVIGATION': 'User wants to navigate to a specific course by name',
            'LEARNING': 'User is asking questions to understand concepts or seeking explanations',
            'COURSE_NAVIGATION': 'User specifically wants to navigate to course-related pages',
            'CHALLENGE_NAVIGATION': 'User wants to access challenges or quiz pages',
            'ADMIN_NAVIGATION': 'User wants to access admin/management features (admin users only)',
            'VOICE_COMMAND': 'User is giving voice navigation commands like next/previous topic',
            'GENERAL': 'General conversation, casual chat, or unclear intent'
        };

        // Rest of the existing detectIntentWithGemini function remains the same...
        let contextSummary = '';
        if (learningContext?.course) contextSummary += `Currently in course: ${learningContext.course.title}\n`;
        if (learningContext?.topic?.main?.[0]) contextSummary += `Current topic: ${learningContext.topic.main[0].title}\n`;

        const intentPrompt = `
You are an expert intent classifier for Buddy, an educational AI assistant.

USER TYPE: ${userType}
AVAILABLE INTENTS: ${Object.entries(availableIntents).map(([intent, desc]) => `- ${intent}: ${desc}`).join('\n')}

${contextSummary ? `LEARNING CONTEXT:\n${contextSummary}\n` : ''}
${recentHistory ? `RECENT CONVERSATION:\n${recentHistory}\n` : ''}

CURRENT MESSAGE: "${message}"

CLASSIFICATION RULES:
1. VOICE_COMMAND: Navigation commands like "next topic", "previous topic", "go back", "next", "previous"
2. COURSE_SPECIFIC_NAVIGATION: Messages mentioning specific course names with navigation intent
3. LEARNING: Questions (what/how/why/when/where), explanations, definitions, educational queries
4. NAVIGATION: "take me to", "open", "show me", "go to", page/section requests (without specific course names)
5. GREETING/FAREWELL: conversation starters/enders
6. GENERAL: casual conversation that doesn't fit other categories

${userType !== 'admin' ? 'Note: User cannot access ADMIN_NAVIGATION' : ''}

Respond with ONLY:
INTENT: [intent_name]
CONFIDENCE: [high/medium/low]
REASONING: [brief explanation]
`;

        const result = await model.generateContent(intentPrompt);
        const response = result.response.text().trim();

        const lines = response.split('\n');
        let intent = 'GENERAL', confidence = 'medium', reasoning = '';

        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('INTENT:')) intent = trimmed.replace('INTENT:', '').trim();
            else if (trimmed.startsWith('CONFIDENCE:')) confidence = trimmed.replace('CONFIDENCE:', '').trim();
            else if (trimmed.startsWith('REASONING:')) reasoning = trimmed.replace('REASONING:', '').trim();
        });

        if (!Object.keys(availableIntents).includes(intent)) {
            intent = 'GENERAL';
            confidence = 'low';
        }

        if (intent === 'ADMIN_NAVIGATION' && userType !== 'admin') {
            intent = 'NAVIGATION';
            confidence = 'medium';
        }

        return { intent, confidence, reasoning, originalMessage: message };

    } catch (error) {
        console.error('Error in intent detection:', error);
        return { intent: 'GENERAL', confidence: 'low', reasoning: 'Fallback due to API error', originalMessage: message };
    }
};

// Route finding with fuzzy matching
const findBestRoute = (pageName, userType) => {
    const availableRoutes = { ...routes.public, ...routes.student };
    if (userType === 'admin') Object.assign(availableRoutes, routes.admin);
    if (userType === 'partner') Object.assign(availableRoutes, routes.partner);

    const pageNameLower = pageName.toLowerCase().trim();

    // Direct match in route keys
    for (const [keys, path] of Object.entries(availableRoutes)) {
        if (keys.split('|').some(key => key.trim() === pageNameLower)) {
            return { link: path, confidence: 'high' };
        }
    }

    // Fuzzy matching
    let bestMatch = { link: null, confidence: 'none', score: 0 };
    for (const [keys, path] of Object.entries(availableRoutes)) {
        const keyList = keys.split('|').map(k => k.trim());
        for (const key of keyList) {
            let score = 0;
            if (key.includes(pageNameLower) || pageNameLower.includes(key)) {
                score = Math.min(key.length, pageNameLower.length) / Math.max(key.length, pageNameLower.length);
            }

            const keyWords = key.split(' ');
            const pageWords = pageNameLower.split(' ');
            const commonWords = keyWords.filter(kw => pageWords.some(pw => pw.includes(kw) || kw.includes(pw)));

            if (commonWords.length > 0) {
                score = Math.max(score, commonWords.length / Math.max(keyWords.length, pageWords.length));
            }

            if (score > bestMatch.score) {
                bestMatch = {
                    link: path,
                    confidence: score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low',
                    score: score
                };
            }
        }
    }

    return bestMatch;
};

const extractCourseNameWithAI = async (message) => {
    try {
        // Fetch all courses from the procedure
        const { success, data: allCourses, error } = await callProcedure("getAllCourses");
        if (!success) throw new Error(error || "Failed to fetch courses");

        // Create formatted course list for the AI prompt
        const formattedCourseList = allCourses.map(course =>
            `- Title: "${course.title}" | Hash: "${course.public_hash}" | ID: ${course.id} | Description: "${course.description}" | HashTags: "${course.hashtags}"`
        ).join('\n');

        const extractionPrompt = `
You are a course matching assistant. Find the best matching course from the available courses based on the user's message.

User Message: "${message}"

Available Courses:
${formattedCourseList}

Instructions:
1. Analyze the user's message to understand what course they're looking for
2. Match against course titles, descriptions, hashtags, and topics
3. Consider partial matches and synonyms (e.g., "JS" = "JavaScript", "ML" = "Machine Learning")
4. If multiple courses match, choose the most relevant one
5. If no clear match is found, return "NONE"

Response Format:
COURSE_HASH: [public_hash of matched course or NONE]
COURSE_TITLE: [title of matched course or NONE]
COURSE_ID: [ID of matched course or NONE]
CONFIDENCE: [high/medium/low]
REASONING: [brief explanation of why this course was selected]

Examples:
- User: "take me to javascript course" → Look for courses with "javascript", "JS", or web development
- User: "I want to learn python programming" → Look for Python courses
- User: "show me machine learning" → Look for ML, AI, or machine learning courses
- User: "react tutorial" → Look for React, frontend, or JavaScript courses
`;

        const result = await model.generateContent(extractionPrompt);
        const response = result.response.text().trim();

        // Parse the AI response
        let courseHash = null, courseTitle = null, courseId = null, confidence = 'low', reasoning = '';

        response.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('COURSE_HASH:')) {
                const hash = trimmed.replace('COURSE_HASH:', '').trim();
                courseHash = hash === 'NONE' ? null : hash;
            } else if (trimmed.startsWith('COURSE_TITLE:')) {
                const title = trimmed.replace('COURSE_TITLE:', '').trim();
                courseTitle = title === 'NONE' ? null : title;
            } else if (trimmed.startsWith('COURSE_ID:')) {
                const id = trimmed.replace('COURSE_ID:', '').trim();
                courseId = id === 'NONE' ? null : parseInt(id);
            } else if (trimmed.startsWith('CONFIDENCE:')) {
                confidence = trimmed.replace('CONFIDENCE:', '').trim();
            } else if (trimmed.startsWith('REASONING:')) {
                reasoning = trimmed.replace('REASONING:', '').trim();
            }
        });

        return {
            courseHash,
            courseTitle,
            courseId,
            confidence,
            reasoning
        };

    } catch (error) {
        console.error('Error extracting course with AI:', error);
        return {
            courseHash: null,
            courseTitle: null,
            courseId: null,
            confidence: 'low',
            reasoning: 'Error occurred during course extraction'
        };
    }
};

const handleCourseSpecificNavigation = async (message, context, userType, userId, res, contextKey, intentResult) => {
    try {
        // Step 1: Extract course information using AI
        const { courseHash, courseTitle, courseId, confidence: extractionConfidence, reasoning } = await extractCourseNameWithAI(message);

        if (!courseHash || !courseTitle) {
            return res.json({
                reply: "I'd love to help you find a course! Could you tell me which specific course you're looking for?",
                link: null,
                type: 'COURSE_SPECIFIC_NAVIGATION',
                originalMessage: message,
                confidence: 'low',
                reasoning: 'Could not match any course from available courses'
            });
        }

        // Step 2: Determine intent
        const messageLower = message.toLowerCase();
        const startLearningKeywords = ['learn', 'start', 'begin', 'take', 'study', 'continue', 'enroll'];
        const viewCourseKeywords = ['view', 'see', 'show', 'display', 'check', 'details', 'info'];

        const isStartLearning = startLearningKeywords.some(keyword => messageLower.includes(keyword));
        const isViewCourse = viewCourseKeywords.some(keyword => messageLower.includes(keyword));

        let navigationLink;
        let replyMessage;
        let navigationIntent = isStartLearning ? 'start_learning' : 'view_details';

        // Step 3: Start learning intent - Check enrollment
        if (isStartLearning && !isViewCourse) {

            if (!userId || userType !== 'student') {
                return res.json({
                    reply: "I need to know who you are to check your enrollments. Please log in first.",
                    link: '/login',
                    type: 'AUTH_REQUIRED',
                    originalMessage: message,
                    confidence: 'low',
                });
            }

            // Call the enrollment procedure
            const result = await callProcedure('GetUserCourseEnrollment', [userId, courseId]);

            if (result?.data[0]?.user_hash) {
                navigationLink = `/course-content/${result.data[0].user_hash}`;
                replyMessage = `${getRandomResponse('courseFound')} Let's start learning "${courseTitle}"!`;
            } else {
                navigationLink = `/course/${courseHash}`;
                replyMessage = `You need to enroll in "${courseTitle}" first. Head over to the course page to enroll and start learning!`;
                navigationIntent = 'enroll_first';
            }
        } else {
            // View course details
            navigationLink = `/course/${courseHash}`;
            replyMessage = `${getRandomResponse('courseFound')} Here's the "${courseTitle}" course details!`;
        }

        // Step 4: Save context and reply
        context.history.push({ role: 'assistant', message: replyMessage, timestamp: Date.now() });
        conversationContexts.set(contextKey, context);

        return res.json({
            reply: replyMessage,
            link: navigationLink,
            type: 'COURSE_SPECIFIC_NAVIGATION',
            originalMessage: message,
            confidence: extractionConfidence,
            reasoning: reasoning,
            contextId: contextKey,
            courseFound: {
                title: courseTitle,
                public_hash: courseHash,
                id: courseId
            },
            navigationIntent
        });

    } catch (error) {
        console.error('Error in course-specific navigation:', error);
        return res.json({
            reply: "Oops! I had trouble finding that course. Could you try again or check the course catalog?",
            link: '/courses',
            type: 'ERROR',
            originalMessage: message,
            confidence: 'low'
        });
    }
};

// Handler functions
const handleLearningQuery = async (message, context, data, res, contextKey, intentResult) => {
    try {
        const responseLength = getResponseLength(message);
        let learningContext = '';
        let contextData = {};

        if (data && Object.keys(data).length > 0) {
            contextData = await fetchLearningContext(data);
            learningContext = formatLearningContext(contextData);
            context.learningContext = contextData;
        } else if (context.learningContext) {
            learningContext = formatLearningContext(context.learningContext);
        }

        const conversationHistory = context.history.slice(-8)
            .map(h => `${h.role === 'user' ? 'Student' : 'Buddy'}: ${h.message}`)
            .join('\n');

        const lengthInstructions = {
            'brief': 'Keep concise, 2-3 sentences maximum.',
            'intermediate': 'Balanced explanation, 4-6 sentences.',
            'detailed': 'Comprehensive explanation with examples and context.'
        };

        const prompt = `
You are Buddy, a friendly AI learning assistant!

Your personality: Enthusiastic, encouraging, use occasional dog expressions (NO EMOJIS - this becomes speech)

${learningContext ? `Learning Context:\n${learningContext}\n` : ''}
Recent Conversation:\n${conversationHistory}

Student Question: "${message}"
Response Length: ${responseLength} - ${lengthInstructions[responseLength]}

Provide a clear, encouraging educational response. Reference current learning context when relevant.
Be supportive and relate to their learning journey.
`;

        const result = await model.generateContent(prompt);
        let aiResponse = cleanResponseForSpeech(result.response.text());

        context.history.push({ role: 'assistant', message: aiResponse, timestamp: Date.now() });
        conversationContexts.set(contextKey, context);

        return res.json({
            reply: aiResponse,
            link: null,
            type: 'LEARNING',
            originalMessage: message,
            confidence: intentResult.confidence,
            reasoning: intentResult.reasoning,
            contextId: contextKey,
            hasLearningContext: Boolean(learningContext),
            responseLength: responseLength
        });

    } catch (error) {
        console.error('Error in learning query:', error);
        return res.json({
            reply: "Oops! My learning circuits got tangled! Could you try asking again?",
            link: null,
            type: 'ERROR',
            originalMessage: message,
            confidence: 'low'
        });
    }
};

const handleNavigationQuery = async (message, context, userType, res, contextKey, intentResult) => {
    try {
        const availableRoutes = { ...routes.public, ...routes.student };
        if (userType === 'admin') Object.assign(availableRoutes, routes.admin);
        if (userType === 'partner') Object.assign(availableRoutes, routes.partner);

        const navigationPrompt = `
Extract navigation target from: "${message}"
Available pages: ${Object.keys(availableRoutes).join(', ')}

Response format:
TARGET: [specific page name]
CONFIDENCE: [high/medium/low]
`;

        const navResult = await model.generateContent(navigationPrompt);
        const navResponse = navResult.response.text();

        let target = null, navConfidence = 'medium';
        navResponse.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('TARGET:')) target = trimmed.replace('TARGET:', '').trim();
            else if (trimmed.startsWith('CONFIDENCE:')) navConfidence = trimmed.replace('CONFIDENCE:', '').trim();
        });

        let navigationLink = null, finalReply = '';

        if (target) {
            const routeResult = findBestRoute(target, userType);
            navigationLink = routeResult.link;
            finalReply = navigationLink ?
                `${getRandomResponse('navigation')} Taking you to ${target}!` :
                `Hmm, I couldn't find "${target}"! Try: dashboard, courses, or profile`;
        } else {
            finalReply = `${getRandomResponse('clarification')} What page would you like me to take you to?`;
        }

        context.history.push({ role: 'assistant', message: finalReply, timestamp: Date.now() });
        conversationContexts.set(contextKey, context);

        return res.json({
            reply: finalReply,
            link: navigationLink,
            type: intentResult.intent,
            originalMessage: message,
            confidence: navConfidence,
            reasoning: intentResult.reasoning,
            contextId: contextKey,
            extractedTarget: target
        });

    } catch (error) {
        console.error('Error in navigation query:', error);
        return res.json({
            reply: "Oops! My navigation circuits got tangled! Could you try asking again?",
            link: null,
            type: 'ERROR',
            originalMessage: message,
            confidence: 'low'
        });
    }
};

const handleVoiceCommand = async (message, context, res, contextKey, intentResult) => {
    try {
        // Get command from intent result (already extracted by Gemini)
        const command = intentResult.command;
        let replyMessage = '';

        switch (command) {
            case 'GO_TO_NEXT_TOPIC':
                replyMessage = "Moving to the next topic!";
                break;
            case 'GO_TO_PREVIOUS_TOPIC':
                replyMessage = "Going back to the previous topic!";
                break;
            default:
                replyMessage = "I understand you want to navigate, but I'm not sure where!";
        }

        context.history.push({ role: 'assistant', message: replyMessage, timestamp: Date.now() });
        conversationContexts.set(contextKey, context);

        return res.json({
            reply: replyMessage,
            link: null,
            command: command, // This is the key addition for frontend
            type: 'VOICE_COMMAND',
            originalMessage: message,
            confidence: intentResult.confidence,
            reasoning: intentResult.reasoning,
            contextId: contextKey
        });

    } catch (error) {
        console.error('Error in voice command handler:', error);
        return res.json({
            reply: "Oops! I had trouble with that command. Could you try again?",
            link: null,
            type: 'ERROR',
            originalMessage: message,
            confidence: 'low'
        });
    }
};

const handleGeneralQuery = async (message, context, userType, res, contextKey, intentResult) => {
    try {
        const responseLength = getResponseLength(message);
        const contextString = context.history.slice(-8)
            .map(h => `${h.role === 'user' ? 'User' : 'Buddy'}: ${h.message}`)
            .join('\n');

        const lengthInstructions = {
            'brief': '1-2 sentences maximum.',
            'intermediate': '3-4 sentences.',
            'detailed': 'Comprehensive response with examples.'
        };

        const prompt = `
You are Buddy, a friendly AI assistant for an educational platform!

Personality: Enthusiastic, helpful, use dog expressions naturally (NO EMOJIS - speech conversion)
Recent conversation:\n${contextString}
Current message: "${message}"
Response Length: ${responseLength} - ${lengthInstructions[responseLength]}

Respond warmly and helpfully. If platform-related, provide helpful info. Be conversational and engaging.
`;

        const result = await model.generateContent(prompt);
        let aiResponse = cleanResponseForSpeech(result.response.text());

        context.history.push({ role: 'assistant', message: aiResponse, timestamp: Date.now() });
        if (context.history.length > 20) context.history = context.history.slice(-20);
        conversationContexts.set(contextKey, context);

        return res.json({
            reply: aiResponse,
            link: null,
            type: 'GENERAL',
            originalMessage: message,
            confidence: intentResult.confidence,
            reasoning: intentResult.reasoning,
            contextId: contextKey,
            responseLength: responseLength
        });

    } catch (error) {
        console.error('Error in general query:', error);
        return res.json({
            reply: "Oops! My circuits got confused! Can you try asking again?",
            link: null,
            type: 'ERROR',
            originalMessage: message,
            confidence: 'low'
        });
    }
};

// Main voice assistant function
const voiceAssistant = async (req, res) => {
    try {
        const { message, sessionId, data } = req.body;
        const userType = req.user?.role || 'student';
        const userId = req.user?.id;

        if (!message?.trim()) {
            return res.status(400).json({
                error: 'Message is required',
                reply: getRandomResponse('errors'),
                link: null,
                type: 'ERROR'
            });
        }

        // Context management
        const contextKey = `${userId}_${sessionId || 'default'}`;
        let context = conversationContexts.get(contextKey);

        if (!context || Date.now() - context.lastInteraction > 3600000) {
            context = { history: [], lastInteraction: Date.now(), userType, learningContext: null };
        }

        context.history.push({ role: 'user', message, timestamp: Date.now() });
        context.lastInteraction = Date.now();

        // Fetch learning context
        if (data && Object.keys(data).length > 0) {
            context.learningContext = await fetchLearningContext(data);
        }

        // Intent detection and handling
        const intentResult = await detectIntentWithGemini(message, {
            userType,
            conversationHistory: context.history.slice(-6),
            learningContext: context.learningContext
        });

        switch (intentResult.intent) {
            case 'FAREWELL':
                conversationContexts.delete(contextKey);
                return res.json({
                    reply: getRandomResponse('farewells'),
                    link: null,
                    type: 'FAREWELL',
                    originalMessage: message,
                    confidence: intentResult.confidence,
                    reasoning: intentResult.reasoning
                });

            case 'GREETING':
                const greeting = context.history.length <= 2 ? getRandomResponse('greetings') : "Hi again! What can I help you with now?";
                context.history.push({ role: 'assistant', message: greeting, timestamp: Date.now() });
                conversationContexts.set(contextKey, context);
                return res.json({
                    reply: greeting,
                    link: null,
                    type: 'GREETING',
                    originalMessage: message,
                    confidence: intentResult.confidence,
                    reasoning: intentResult.reasoning
                });

            case 'LEARNING':
                return await handleLearningQuery(message, context, data, res, contextKey, intentResult);

            case 'NAVIGATION':
            case 'COURSE_NAVIGATION':
            case 'CHALLENGE_NAVIGATION':
            case 'ADMIN_NAVIGATION':
                return await handleNavigationQuery(message, context, userType, res, contextKey, intentResult);

            case 'COURSE_SPECIFIC_NAVIGATION':
                return await handleCourseSpecificNavigation(message, context, userType, userId, res, contextKey, intentResult);

            case 'VOICE_COMMAND':
                return await handleVoiceCommand(message, context, res, contextKey, intentResult);

            default:
                return await handleGeneralQuery(message, context, userType, res, contextKey, intentResult);
        }

    } catch (error) {
        console.error('🚨 Error in Buddy voice assistant:', error);
        res.status(500).json({
            error: 'Internal server error',
            reply: "Woof! Something went wrong in my circuits! Please try again!",
            link: null,
            type: 'ERROR'
        });
    }
};

// Memory cleanup
setInterval(() => {
    const now = Date.now();
    const maxAge = 2 * 60 * 60 * 1000; // 2 hours

    for (const [key, context] of conversationContexts.entries()) {
        if (now - context.lastInteraction > maxAge) {
            conversationContexts.delete(key);
        }
    }
}, 300000); // Every 5 minutes

module.exports = { voiceAssistant };