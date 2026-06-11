const express = require('express');
const router = express.Router();
const axios = require('axios');

const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Improved Intent Detection Function
async function detectUserIntentWithAI(query, conversationHistory) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Get more context from conversation history
  const recentHistory = conversationHistory.messages.slice(-6); // Last 6 messages for better context
  const historyContext = recentHistory.length > 0 ?
    `Recent conversation:\n${recentHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\n` : '';

  // Get the last assistant message for context
  const lastAssistantMessage = conversationHistory.messages
    .filter(msg => msg.role === 'assistant')
    .pop();

  // Determine if this might be a follow-up based on conversation flow
  const isLikelyFollowUp = lastAssistantMessage &&
    (query.toLowerCase().includes('more') ||
      query.toLowerCase().includes('other') ||
      query.toLowerCase().includes('different') ||
      query.toLowerCase().includes('else') ||
      query.toLowerCase().includes('another') ||
      query.toLowerCase().includes('what about') ||
      query.toLowerCase().includes('tell me about'));

  const contextualHints = lastAssistantMessage ?
    `Previous assistant response was about: ${lastAssistantMessage.intent}
     ${isLikelyFollowUp ? 'This appears to be a follow-up question.' : ''}
     ${lastAssistantMessage.intent === 'COURSE_SEARCH' || lastAssistantMessage.intent === 'COURSE_RECOMMEND' ?
      'If user asks for "more courses", "other courses", "different courses", classify as COURSE_SEARCH.' : ''}` : '';

  const intentPrompt = `
  ${historyContext}${contextualHints}

  Analyze this user query and classify it into ONE of these intents. Consider the conversation context and return ONLY the intent name:

  INTENT CLASSIFICATIONS:
  
  GREETING: "hi", "hello", "hey", "good morning", "how are you" - Initial greetings
  
  FAQ_HELP: "how to reset password", "how to login", "can't login", "login issues", "sign in help", "how to register", "create account", "sign up", "registration help", "forgot password", "how to enroll", "how to change email", "forgot username", "payment methods", "course certificate", "refund policy", "technical requirements", "how to download", "system requirements"

  WISHLIST_LINK: "my wishlist", "saved courses", "favorites", "show my wishlist"

  ENROLLED_COURSES_LINK: "my courses", "enrolled courses", "my learning", "courses I joined"

  PURCHASES_LINK: "my purchases", "purchase history", "my orders", "transactions", "what I bought"

  PROFILE_LINK: "my profile", "account settings", "personal info", "edit profile"

  COURSE_RECOMMEND: "suggest courses", "recommend courses", "what courses", "show me courses", "course categories"
  
  COURSE_SEARCH: "find courses about", "search for", "courses on", "learn about", "more courses", "other courses", "different courses" (especially as follow-up)
  
  COURSE_DETAIL: "tell me about [specific course]", "details about", "more info on", "what is [course name]"
  
  TECHNICAL_SUPPORT: "technical issue", "bug report", "app not working", "website problem", "technical help"
  
  CREATE_SUPPORT_TICKET: "create ticket", "report issue", "need help with", "submit request", "file complaint"
  
  UPDATE_SUPPORT_TICKET: "update ticket #", "add to ticket", "modify ticket", "ticket update"
  
  GET_TICKET_DETAILS: "show ticket", "ticket details", "check ticket #", "ticket status"
  
  LIST_SUPPORT_TICKETS: "my tickets", "all tickets", "show tickets", "ticket list", "support history"
  
  SUPPORT_HELP: "how to get support", "contact support", "help center", "support options"
  
  REVIEW_HELP: "how to review", "write review", "rate course", "leave feedback"
  
  FOLLOW_UP: Questions that clearly reference previous responses but aren't course-related
  
  GENERAL: Everything else, unclear intent, or general questions

  EXAMPLES:
  "hi" → GREETING
  "hello there" → GREETING  
  "how do I reset my password" → FAQ_HELP
  "how to enroll in a course" → FAQ_HELP  
  "what are the payment methods" → FAQ_HELP
  "how to get certificate" → FAQ_HELP
  "system requirements for courses" → FAQ_HELP
  "suggest me some courses" → COURSE_RECOMMEND
  "search for available courses" → COURSE_SEARCH
  "tell me more about Geography courses" → COURSE_SEARCH
  "show me other courses" (after course list) → COURSE_SEARCH
  "different courses please" → COURSE_SEARCH
  "my wishlist" → WISHLIST_LINK
  "report a technical issue" → TECHNICAL_SUPPORT
  "create support ticket" → CREATE_SUPPORT_TICKET
  "my profile" → PROFILE_LINK

  Current user query: "${query}"
  
  Intent:`;

  try {
    const result = await model.generateContent(intentPrompt);
    let detectedIntent = result.response.text().trim().toUpperCase();

    // Clean up the response - sometimes AI returns extra text
    const intentMatch = detectedIntent.match(/\b(GREETING|WISHLIST_LINK|ENROLLED_COURSES_LINK|PURCHASES_LINK|PROFILE_LINK|COURSE_RECOMMEND|COURSE_SEARCH|COURSE_DETAIL|TECHNICAL_SUPPORT|CREATE_SUPPORT_TICKET|UPDATE_SUPPORT_TICKET|GET_TICKET_DETAILS|LIST_SUPPORT_TICKETS|SUPPORT_HELP|REVIEW_HELP|FOLLOW_UP|GENERAL)\b/);

    if (intentMatch) {
      detectedIntent = intentMatch[1];
    }

    const validIntents = [
      'GREETING', 'FAQ_HELP', 'WISHLIST_LINK',
      'ENROLLED_COURSES_LINK', 'PURCHASES_LINK', 'PROFILE_LINK',
      'COURSE_SEARCH', 'COURSE_RECOMMEND', 'COURSE_DETAIL', 'TECHNICAL_SUPPORT',
      'CREATE_SUPPORT_TICKET', 'GET_TICKET_DETAILS', 'LIST_SUPPORT_TICKETS',
      'UPDATE_SUPPORT_TICKET', 'SUPPORT_HELP', 'REVIEW_HELP', 'FOLLOW_UP', 'GENERAL'
    ];

    // Additional fallback logic for common patterns
    if (!validIntents.includes(detectedIntent)) {
      const lowerQuery = query.toLowerCase();

      // Greeting patterns
      if (/^(hi|hello|hey|good morning|good afternoon|good evening)$/i.test(query.trim())) {
        detectedIntent = 'GREETING';
      }
      // FAQ patterns - Add this section
      else if (lowerQuery.includes('how to') ||
        lowerQuery.includes('how can i') ||
        lowerQuery.includes('how do i') ||
        lowerQuery.includes('what is') ||
        lowerQuery.includes('what are') ||
        lowerQuery.includes('where is') ||
        lowerQuery.includes('where can') ||
        lowerQuery.includes('reset password') ||
        lowerQuery.includes('change email') ||
        lowerQuery.includes('payment method') ||
        lowerQuery.includes('login help') ||
        lowerQuery.includes('register help') ||
        lowerQuery.includes('login issue') ||
        lowerQuery.includes('register account') ||
        lowerQuery.includes('refund') ||
        lowerQuery.includes('certificate') ||
        lowerQuery.includes('download') ||
        lowerQuery.includes('system requirement') ||
        lowerQuery.includes('browser') ||
        lowerQuery.includes('enroll')) {
        detectedIntent = 'FAQ_HELP';
      }
      // Course search patterns
      else if (lowerQuery.includes('course') && (lowerQuery.includes('find') || lowerQuery.includes('search') || lowerQuery.includes('show') || lowerQuery.includes('suggest'))) {
        detectedIntent = lowerQuery.includes('recommend') || lowerQuery.includes('suggest') ? 'COURSE_RECOMMEND' : 'COURSE_SEARCH';
      }
      // Profile/account patterns
      else if (lowerQuery.includes('profile') || lowerQuery.includes('account')) {
        detectedIntent = 'PROFILE_LINK';
      }
      // Wishlist patterns
      else if (lowerQuery.includes('wishlist') || lowerQuery.includes('saved')) {
        detectedIntent = 'WISHLIST_LINK';
      }
      // Support patterns
      else if (lowerQuery.includes('support') || lowerQuery.includes('help') || lowerQuery.includes('issue')) {
        if (lowerQuery.includes('ticket')) {
          if (lowerQuery.includes('create') || lowerQuery.includes('new')) {
            detectedIntent = 'CREATE_SUPPORT_TICKET';
          } else if (lowerQuery.includes('list') || lowerQuery.includes('all') || lowerQuery.includes('my')) {
            detectedIntent = 'LIST_SUPPORT_TICKETS';
          } else {
            detectedIntent = 'GET_TICKET_DETAILS';
          }
        } else if (lowerQuery.includes('technical') || lowerQuery.includes('bug') || lowerQuery.includes('error')) {
          detectedIntent = 'TECHNICAL_SUPPORT';
        } else {
          detectedIntent = 'SUPPORT_HELP';
        }
      }
      else {
        detectedIntent = 'GENERAL';
      }
    }

    return detectedIntent;

  } catch (error) {
    console.error('Intent detection failed:', error);

    // Fallback intent detection based on keywords
    const lowerQuery = query.toLowerCase();

    if (/^(hi|hello|hey|good morning)$/i.test(query.trim())) {
      return 'GREETING';
    } else if (lowerQuery.includes('course')) {
      return lowerQuery.includes('recommend') || lowerQuery.includes('suggest') ? 'COURSE_RECOMMEND' : 'COURSE_SEARCH';
    } else if (lowerQuery.includes('profile')) {
      return 'PROFILE_LINK';
    } else if (lowerQuery.includes('wishlist')) {
      return 'WISHLIST_LINK';
    } else if (lowerQuery.includes('support') || lowerQuery.includes('help')) {
      return 'SUPPORT_HELP';
    }

    return 'GENERAL';
  }
}

// Helper function to add conversation context tracking
class ConversationHistory {
  constructor(userId) {
    this.userId = userId;
    this.messages = [];
    this.context = {};
    this.maxMessages = 20; // Keep last 20 messages
  }

  addMessage(role, content, intent = null, contextData = null, contextType = null) {
    const message = {
      role,
      content: content.substring(0, 500), // Limit content length
      timestamp: new Date(),
      intent,
      contextData,
      contextType
    };

    this.messages.push(message);

    // Keep only the last maxMessages
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }

  updateContext(key, value) {
    this.context[key] = value;
  }

  getFormattedHistory() {
    const recentMessages = this.messages.slice(-8); // Last 8 messages for context
    return recentMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
  }

  getLastUserMessage() {
    return this.messages
      .filter(msg => msg.role === 'user')
      .pop();
  }

  getLastAssistantMessage() {
    return this.messages
      .filter(msg => msg.role === 'assistant')
      .pop();
  }
}

// Enhanced conversation memory management
const conversationMemory = new Map();

function getConversationHistory(userId) {
  if (!userId) {
    return new ConversationHistory('anonymous');
  }

  if (!conversationMemory.has(userId)) {
    conversationMemory.set(userId, new ConversationHistory(userId));
  }

  return conversationMemory.get(userId);
}

// Cleanup function to prevent memory leaks
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  for (const [userId, history] of conversationMemory.entries()) {
    const lastMessage = history.messages[history.messages.length - 1];
    if (!lastMessage || lastMessage.timestamp < oneHourAgo) {
      conversationMemory.delete(userId);
    }
  }
}, 30 * 60 * 1000); // Run every 30 minutes

const { callProcedure } = require("../../utils/procedure/callProcedure");

const SupportTicket = require('../../models/support/support_ticket');
const SupportAttachment = require('../../models/support/support_attachment');

// FAQ Database - Add this before your chatBot function
const FAQ_DATABASE = {
  "password_reset": {
    question: "How to reset my password?",
    answer: `**Reset Your Password:**
    
1. Go to the Login page
2. Click on "Forgot Password?" link
3. Enter your registered email address
4. Check your email for reset instructions
5. Click the reset link in the email
6. Create a new secure password
7. Confirm your new password
8. Login with your new password

**Note:** Reset links expire in 24 hours.`,
    keywords: ["reset password", "forgot password", "change password", "password recovery"],
    quickReplies: [
      { name: "Login help", description: "Need login assistance" },
      { name: "Account security", description: "Security tips" },
      { name: "Contact support", description: "Still need help" }
    ]
  },

  "login_help": {
    question: "How to login to my account?",
    answer: `Login to Your Account:

    1. Visit the Login page
    2. Enter your registered email address
    3. Type your password carefully
    4. Click the "Login" button
    5. If enabled, complete the CAPTCHA or security check
    6. You'll be redirected to your dashboard

    Note: If you forgot your password, use the "Forgot Password?" link.`,
    keywords: ["login", "sign in", "log in", "access account", "can't login"],
    quickReplies: [
      { name: "Forgot password", description: "Recover your password" },
      { name: "Register", description: "Create a new account" },
      { name: "Contact support", description: "Need more help" }
    ]
  },

  "register_help": {
    question: "How to register for a new account?",
    answer: `Register a New Account:

    1. Go to the Registration or Sign Up page
    2. Enter your full name and email address
    3. Choose a secure password
    4. Agree to the Terms & Conditions (if required)
    5. Click the "Sign Up" or "Register" button
    6. Check your email for a verification link
    7. Click the link to activate your account

    Note: Use a valid email to receive important updates.`,
    keywords: ["register", "sign up", "create account", "new account", "join"],
    quickReplies: [
      { name: "Login help", description: "Already have an account" },
      { name: "Email verification", description: "Didn't get verification email" },
      { name: "Contact support", description: "Still need help" }
    ]
  },

  "course_enrollment": {
    question: "How to enroll in a course?",
    answer: `**Enroll in a Course:**
    
1. Browse courses or search for specific topics
2. Click on the course you're interested in
3. Review course details, curriculum, and reviews
4. Click "Enroll Now" or "Add to Cart"
5. If it's a paid course:
   - Choose your payment method
   - Complete the payment process
6. For free courses, you'll be enrolled immediately
7. Access your course from "My Courses" section
8. Start learning!

**Payment Methods:** Credit/Debit Cards, PayPal, Bank Transfer`,
    keywords: ["enroll course", "join course", "how to enroll", "course registration", "buy course"],
    quickReplies: [
      { name: "Browse courses", description: "Find courses to enroll" },
      { name: "Payment help", description: "Payment assistance" },
      { name: "Free courses", description: "Find free courses" }
    ]
  },

  "payment_methods": {
    question: "What payment methods are accepted?",
    answer: `**Accepted Payment Methods:**
    
**Credit/Debit Cards:**
- Visa, MasterCard, American Express
- Secure SSL encryption for all transactions

**Digital Wallets:**
- PayPal
- Google Pay (mobile)
- Apple Pay (mobile)

**Bank Transfer:**
- Direct bank transfer (processing time: 2-3 days)
- Available for amounts above $50

**Security Features:**
- 256-bit SSL encryption
- PCI DSS compliant payment processing
- Secure tokenization of card details`,
    keywords: ["payment methods", "credit card", "paypal", "payment options", "how to pay"],
    quickReplies: [
      { name: "Payment issues", description: "Having payment problems" },
      { name: "Refund policy", description: "About refunds" },
      { name: "Course enrollment", description: "How to enroll" }
    ]
  },

  "certificates": {
    question: "How to get course certificates?",
    answer: `**Getting Course Certificates:**
    
**Completion Requirements:**
1. Complete all course modules (100%)
2. Pass all quizzes/assignments (if applicable)
3. Meet minimum score requirements
4. Finish within the course timeline

**Download Certificate:**
1. Go to "My Courses" section
2. Find your completed course
3. Click "View Certificate" or "Download Certificate"
4. Certificate will be generated in PDF format
5. Save or print as needed

**Certificate Features:**
- Includes your name and completion date
- Unique verification code
- Instructor signature (digital)
- Course curriculum hours`,
    keywords: ["certificate", "completion certificate", "course certificate", "download certificate", "certification"],
    quickReplies: [
      { name: "My courses", description: "Check course progress" },
      { name: "Course requirements", description: "What's needed to pass" },
      { name: "Certificate verification", description: "Verify a certificate" }
    ]
  },

  "refund_policy": {
    question: "What is the refund policy?",
    answer: `**Refund Policy:**
    
**30-Day Money-Back Guarantee:**
- Request refund within 30 days of purchase
- Must have completed less than 30% of course content
- Original payment method will be refunded

**How to Request Refund:**
1. Go to "My Purchases" section
2. Find the course you want to refund
3. Click "Request Refund"
4. Fill out the refund reason form
5. Submit your request

**Processing Time:**
- Refund requests reviewed within 2-3 business days
- Approved refunds processed within 5-7 business days
- You'll receive email confirmation

**Note:** Some courses may have different refund terms.`,
    keywords: ["refund", "money back", "refund policy", "return course", "cancel course"],
    quickReplies: [
      { name: "Request refund", description: "Start refund process" },
      { name: "My purchases", description: "View purchase history" },
      { name: "Contact support", description: "Refund assistance" }
    ]
  },

  "system_requirements": {
    question: "What are the system requirements?",
    answer: `**System Requirements:**
    
**Minimum Browser Requirements:**
- Chrome 70+ (Recommended)
- Firefox 65+
- Safari 12+
- Edge 79+
- Internet Explorer 11+ (limited features)

**Internet Connection:**
- Minimum: 1 Mbps for video streaming
- Recommended: 5+ Mbps for HD quality
- Mobile data usage: ~100MB per hour

**Hardware Requirements:**
- RAM: 2GB minimum, 4GB recommended
- Processor: Dual-core 1.5GHz or better
- Storage: 1GB free space for offline content

**Mobile Apps:**
- iOS 12.0 or later
- Android 7.0 (API level 24) or later
- Tablets and phones supported`,
    keywords: ["system requirements", "browser requirements", "technical requirements", "device compatibility", "mobile app"],
    quickReplies: [
      { name: "Mobile app", description: "Download mobile app" },
      { name: "Video issues", description: "Troubleshoot video problems" },
      { name: "Technical support", description: "Get technical help" }
    ]
  },

  "change_email": {
    question: "How to change my email address?",
    answer: `**Change Email Address:**
    
**From Your Profile:**
1. Login to your account
2. Go to "My Profile" section
3. Click "Edit Profile" or "Account Settings"
4. Find "Email Address" field
5. Enter your new email address
6. Click "Update" or "Save Changes"
7. Verify the new email address

**Email Verification:**
- Check your new email for verification link
- Click the verification link
- Your email will be updated successfully

**Important Notes:**
- You'll need to login with your new email
- All notifications will be sent to new email
- Keep your old email accessible until verification`,
    keywords: ["change email", "update email", "email address", "modify email", "new email"],
    quickReplies: [
      { name: "Profile settings", description: "Update other profile info" },
      { name: "Email verification", description: "Verification issues" },
      { name: "Login help", description: "Login with new email" }
    ]
  },

  "download_course": {
    question: "How to download course materials?",
    answer: `**Download Course Materials:**
    
**Available Downloads:**
- Course PDFs and documents
- Presentation slides
- Audio files (where available)
- Resource files and templates

**How to Download:**
1. Go to your enrolled course
2. Navigate to the specific lesson
3. Look for "Download" or "Resources" section
4. Click the download link/button
5. Files will be saved to your device

**Offline Access:**
- Use our mobile app for offline viewing
- Download lessons for offline access
- Note: Some interactive content requires internet

**File Formats:**
- PDFs, DOCX, PPTX
- MP3 audio files
- ZIP archives for multiple files`,
    keywords: ["download", "course materials", "offline access", "download files", "course resources"],
    quickReplies: [
      { name: "Mobile app", description: "Offline course access" },
      { name: "File issues", description: "Download problems" },
      { name: "Course access", description: "Access course content" }
    ]
  }
};

// AI-powered FAQ matching function
async function findFAQAnswer(userQuery) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Create searchable FAQ data
    const faqSearchData = Object.entries(FAQ_DATABASE).map(([key, faq]) => ({
      key,
      question: faq.question,
      keywords: faq.keywords.join(', ')
    }));

    const faqPrompt = `
    You are a FAQ matching system. Find the best matching FAQ for the user's question.
    
    User Question: "${userQuery}"
    
    Available FAQs:
    ${JSON.stringify(faqSearchData)}
    
    Respond with ONLY a JSON object like:
    {
      "faqKey": "exact_key_from_available_faqs or null",
      "confidence": "high|medium|low",
      "reason": "Why this FAQ matches"
    }
    `;

    const result = await model.generateContent(faqPrompt);
    const responseText = result.response.text();
    const match = responseText.match(/\{.*\}/s);

    if (!match) return null;

    const matchData = JSON.parse(match[0]);

    if (!matchData.faqKey || matchData.confidence === 'low') {
      return null;
    }

    return FAQ_DATABASE[matchData.faqKey];

  } catch (error) {
    console.error('FAQ matching error:', error);
    return null;
  }
}

// [Keep all your existing helper functions: getUserWishlist, getUserCourses, etc.]
async function getUserWishlist(userId) {
  try {
    const { success, data, error } = await callProcedure("getWishlistWithCoursesByUserId", [userId]);
    if (!success) {
      throw new Error(error || "Could not fetch user courses");
    }
    return data;
  } catch (err) {
    console.error("Error fetching user courses:", err.message);
    throw err;
  }
}

async function getUserCourses(userId) {
  try {
    const { success, data, error } = await callProcedure("GetUserCoursesWithRawCourses", [userId]);
    if (!success) {
      throw new Error(error || "Could not fetch user courses");
    }
    return data;
  } catch (err) {
    console.error("Error fetching user courses:", err.message);
    throw err;
  }
}

async function getRecommendedCourses(userId, query) {
  try {
    const { success, data: allCourses, error } = await callProcedure("getAllCourses");
    if (!success) throw new Error(error || "Failed to fetch courses");

    // Check if this is a request for different courses
    const isDifferentRequest = query.toLowerCase().includes('different from previous') ||
      query.toLowerCase().includes('other') ||
      query.toLowerCase().includes('more') ||
      query.toLowerCase().includes('else');

    const courseTitles = allCourses.map(c => ({
      id: c.id,
      title: c.title,                                // Primary keyword matching
      description: c.description,                    // Rich semantic context
      what_you_will_learn: c.what_you_will_learn,    // Intent matching
      hashtags: c.hashtags,                          // Keyword/topic clustering
      category_id: c.category_id,                    // Grouping by domain
      prerequisites: c.prerequisites,                // Beginner/advanced filtering
      price: c.price,                                 // Budget filter
      discount: c.discount,                           // Budget filter
      duration_hours: c.duration_hours               // For short/long course filtering
    }));

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let coursePrompt;

    if (isDifferentRequest) {
      coursePrompt = `
        You are a course recommendation engine. The user is asking for different/other course recommendations.
        Provide diverse courses from different categories/topics. Focus on variety and avoid similar courses.

        User query: "${query}"

        Course list:
        ${JSON.stringify(courseTitles)}

        Respond with ONLY a JSON array of up to 3 diverse course IDs, like:
        [1, 4, 7]
      `;
    } else {
      coursePrompt = `
        You are a course recommendation engine. Based on the user's query and the list of available course titles, return the most relevant course IDs in JSON array format.

        If the query is empty or unclear, recommend any suitable courses.

        User query: "${query}"

        Course list:
        ${JSON.stringify(courseTitles)}

        Respond with ONLY a JSON array of up to 3 course IDs, like:
        [1, 4, 7]
      `;
    }

    const result = await model.generateContent(coursePrompt);
    const responseText = result.response.text();
    const match = responseText.match(/\[.*\]/s);
    if (!match) throw new Error("No valid JSON array found in AI response");

    const recommendedIds = JSON.parse(match[0]);
    const recommendedCourses = allCourses.filter(c => recommendedIds.includes(c.id));
    return recommendedCourses;
  } catch (err) {
    console.error("AI-based course recommendation failed:", err.message);
    return [];
  }
}

async function getCourseDetails(userId, query) {
  try {
    const { success, data: allCourses, error } = await callProcedure("getAllCourses");
    if (!success) throw new Error(error || "Failed to fetch courses");

    const courseSummaries = allCourses.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description
    }));

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const detailPrompt = `
      You are a smart course matching engine. Given the user's query and a list of course titles with descriptions, return the single most relevant course ID in JSON format.

      User query: "${query}"

      Course list:
      ${JSON.stringify(courseSummaries)}

      Respond with ONLY a JSON object like:
      { "id": 5 }
    `;

    const result = await model.generateContent(detailPrompt);
    const responseText = result.response.text();
    const match = responseText.match(/\{.*\}/s);
    if (!match) throw new Error("No valid course ID found in AI response");

    const { id } = JSON.parse(match[0]);
    const matchedCourse = allCourses.find(c => c.id === id);
    if (!matchedCourse) throw new Error("Course ID not found in full data");

    return matchedCourse;
  } catch (err) {
    console.error("AI-based course detail fetch failed:", err.message);
    return null;
  }
}

async function getUserPurchases(userId) {
  try {
    const { success, data, error } = await callProcedure("getPaymentsByUserId", [userId]);
    if (!success) {
      throw new Error(error || "Could not fetch user courses");
    }
    return data;
  } catch (err) {
    console.error("Error fetching user courses:", err.message);
    throw err;
  }
}

async function getUserProfile(userId) {
  try {
    const { success, data, error } = await callProcedure("getUserById", [userId]);
    if (!success) {
      throw new Error(error || "Could not fetch user courses");
    }
    return data;
  } catch (err) {
    console.error("Error fetching user courses:", err.message);
    throw err;
  }
}

async function getAllCategories() {
  const { success, data, error } = await callProcedure("getAllCourseCategories");
  return data;
}

const fs = require("fs");
const path = require("path");

function moveFileToSupport(file) {
  const destDir = "uploads/support/";
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  const tempPath = file.path;
  const finalPath = path.join(destDir, file.filename);

  fs.renameSync(tempPath, finalPath);
  return file.filename;
}

// Function to create support ticket through chatbot
async function createSupportTicket(userId, query, files = [], courseId = null) {
  try {
    // Your predefined categories (mapped to enum values)
    const supportCategories = [
      { name: "Technical", description: "Problems with platform, login, or course access" },
      { name: "Course Content", description: "Issues with course materials, videos, or assignments" },
      { name: "Billing", description: "Problems with payments, refunds, or billing" },
      { name: "Other", description: "General inquiries or uncategorized issues" }
    ];

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const categoryPrompt = `
      You are a support ticket categorization system. Analyze the user's support request and determine:
      1. The most appropriate category (from the available options)
      2. Extract key details for the ticket
      3. Suggest a title for the ticket

      User query: "${query}"

      Available categories:
      ${JSON.stringify(supportCategories)}

      Respond with ONLY a JSON object like:
      {
        "category": "Technical",
        "title": "Login not working on mobile",
        "description": "User is unable to log in via mobile app with correct credentials.",
        "priority": "low|medium|high"
      }
    `;

    const result = await model.generateContent(categoryPrompt);
    const responseText = result.response.text();
    const match = responseText.match(/\{.*\}/s);
    if (!match) throw new Error("Invalid response format from AI");

    const ticketData = JSON.parse(match[0]);

    // Ensure the category is valid
    const validCategory = supportCategories.find(c => c.name === ticketData.category);
    if (!validCategory) throw new Error("Invalid category selected");

    // Create the support ticket
    const newTicket = await SupportTicket.create({
      user_id: userId,
      course_id: courseId || null,
      title: ticketData.title,
      description: ticketData.description,
      category: ticketData.category,
      status: 'OPEN',
      is_active: true
    });

    // Handle file attachments (if any)
    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        moveFileToSupport(file);

        const fileUrl = `/support/attachment/${file.filename}`;  // Adjust this path as per your static hosting
        await SupportAttachment.create({
          file_url: fileUrl,
          file_type: file.mimetype,
          ticket_id: newTicket.id,
          uploaded_at: new Date()
        });
      }
    }

    return {
      ticketId: newTicket.id,
      title: newTicket.title,
      category: newTicket.category,
      description: newTicket.description,
      status: newTicket.status,
      message: "✅ Support ticket created successfully! Our team will respond shortly."
    };

  } catch (err) {
    console.error("Support ticket creation failed:", err.message);
    return {
      error: true,
      message: "❌ Failed to create support ticket. Please try again later."
    };
  }
}

// Function to update support ticket through chatbot
async function updateSupportTicket(userId, ticketId, updateData, files = []) {
  try {
    // Find the ticket and verify ownership
    const ticket = await SupportTicket.findOne({
      where: {
        id: ticketId,
        user_id: userId,
        is_active: true
      }
    });

    if (!ticket) {
      return {
        error: true,
        message: "❌ Ticket not found or you don't have permission to update it."
      };
    }

    // Check if ticket is still open for updates
    if (ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') {
      return {
        error: true,
        message: "❌ Cannot update a closed or resolved ticket. Create a new ticket if you need further assistance."
      };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Use AI to understand what the user wants to update
    const updatePrompt = `
      You are a support ticket update analyzer. Analyze the user's update request and determine:
      1. What fields they want to update (title, description, priority, category)
      2. Extract the new values for those fields
      3. Provide a summary of changes

      Current ticket details:
      - Title: "${ticket.title}"
      - Description: "${ticket.description}"
      - Category: "${ticket.category}"
      - Priority: "${ticket.priority || 'medium'}"

      User update request: "${updateData}"

      Available categories: ["Technical", "Course Content", "Billing", "Other"]
      Available priorities: ["low", "medium", "high"]

      Respond with ONLY a JSON object like:
      {
        "updates": {
          "title": "new title or null if no change",
          "description": "new description or null if no change",
          "category": "new category or null if no change",
          "priority": "new priority or null if no change"
        },
        "summary": "Brief summary of what will be updated"
      }
    `;

    const result = await model.generateContent(updatePrompt);
    const responseText = result.response.text();
    const match = responseText.match(/\{.*\}/s);
    if (!match) throw new Error("Invalid response format from AI");

    const analysisData = JSON.parse(match[0]);
    const updates = {};

    // Build update object with only changed fields
    if (analysisData.updates.title && analysisData.updates.title !== ticket.title) {
      updates.title = analysisData.updates.title;
    }
    if (analysisData.updates.description && analysisData.updates.description !== ticket.description) {
      updates.description = analysisData.updates.description;
    }
    if (analysisData.updates.category && analysisData.updates.category !== ticket.category) {
      updates.category = analysisData.updates.category;
    }
    if (analysisData.updates.priority && analysisData.updates.priority !== ticket.priority) {
      updates.priority = analysisData.updates.priority;
    }

    // Add updated timestamp
    updates.updated_at = new Date();

    // Update the ticket if there are changes
    if (Object.keys(updates).length > 1) { // More than just updated_at
      await SupportTicket.update(updates, {
        where: { id: ticketId }
      });
    }

    // Handle new file attachments (if any)
    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        moveFileToSupport(file);
        const fileUrl = `/support/attachment/${file.filename}`;
        await SupportAttachment.create({
          file_url: fileUrl,
          file_type: file.mimetype,
          ticket_id: ticketId,
          uploaded_at: new Date()
        });
      }
    }

    // Get updated ticket details
    const updatedTicket = await SupportTicket.findByPk(ticketId);

    return {
      ticketId: updatedTicket.id,
      title: updatedTicket.title,
      category: updatedTicket.category,
      description: updatedTicket.description,
      priority: updatedTicket.priority,
      status: updatedTicket.status,
      updatesApplied: Object.keys(updates).filter(key => key !== 'updated_at'),
      filesAdded: files.length,
      summary: analysisData.summary,
      message: "✅ Support ticket updated successfully! Our team has been notified of the changes."
    };

  } catch (err) {
    console.error("Support ticket update failed:", err.message);
    return {
      error: true,
      message: "❌ Failed to update support ticket. Please try again later."
    };
  }
}

// Function to get support ticket details through chatbot
async function getSupportTicketDetails(userId, ticketIdentifier) {
  try {
    let whereClause = {
      user_id: userId,
      is_active: true
    };

    // Handle different ways to identify ticket (ID, title keywords, etc.)
    if (!isNaN(ticketIdentifier)) {
      // If it's a number, search by ID
      whereClause.id = parseInt(ticketIdentifier);
    } else {
      // Use AI to find ticket by description or title keywords
      const userTickets = await SupportTicket.findAll({
        where: { user_id: userId, is_active: true },
        order: [['created_at', 'DESC']],
        limit: 10
      });

      if (userTickets.length === 0) {
        return {
          error: true,
          message: "❌ No support tickets found for your account."
        };
      }

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const matchPrompt = `
        You are a ticket matching system. Find the best matching ticket based on the user's query.
        
        User query: "${ticketIdentifier}"
        
        Available tickets:
        ${JSON.stringify(userTickets.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        category: t.category,
        status: t.status,
        created_at: t.created_at
      })))}

        Respond with ONLY a JSON object like:
        {
          "ticketId": "ID of best matching ticket or null if no good match",
          "confidence": "high|medium|low",
          "reason": "Why this ticket was selected"
        }
      `;

      const result = await model.generateContent(matchPrompt);
      const responseText = result.response.text();
      const match = responseText.match(/\{.*\}/s);
      if (!match) throw new Error("Invalid response format from AI");

      const matchData = JSON.parse(match[0]);

      if (!matchData.ticketId || matchData.confidence === 'low') {
        return {
          error: true,
          message: `❌ Could not find a ticket matching "${ticketIdentifier}". Please provide a ticket ID or be more specific.`,
          availableTickets: userTickets.map(t => ({
            id: t.id,
            title: t.title,
            status: t.status,
            created: t.created_at.toDateString()
          }))
        };
      }

      whereClause.id = matchData.ticketId;
    }

    // Fetch ticket with attachments
    const ticket = await SupportTicket.findOne({
      where: whereClause,
      include: [
        {
          model: SupportAttachment,
          required: false
        },
        {
          model: SupportReply,
          required: false,
          include: [
            {
              model: SupportAttachment,
              required: false
            }
          ]
        }
      ]
    });

    if (!ticket) {
      return {
        error: true,
        message: "❌ Ticket not found or you don't have permission to view it."
      };
    }

    // Get ticket responses/comments if you have them
    // Assuming you might have a SupportResponse model
    let responses = [];

    return {
      ticketId: ticket.id,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority || 'medium',
      status: ticket.status,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
      attachments: ticket.attachments ? ticket.attachments.map(att => ({
        fileName: att.file_url.split('/').pop(),
        fileType: att.file_type,
        uploadedAt: att.uploaded_at
      })) : [],
      message: "✅ Ticket details retrieved successfully!"
    };

  } catch (err) {
    console.error("Get ticket details failed:", err.message);
    return {
      error: true,
      message: "❌ Failed to retrieve ticket details. Please try again later."
    };
  }
}

// Function to get all user's support tickets
async function getUserSupportTickets(userId, status = null, limit = 10) {
  try {
    let whereClause = {
      user_id: userId,
      is_active: true
    };

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    const tickets = await SupportTicket.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: limit,
      include: [{
        model: SupportAttachment,
        required: false,
        attributes: ['id', 'file_type']
      }]
    });

    if (tickets.length === 0) {
      return {
        tickets: [],
        message: status
          ? `❌ No ${status.toLowerCase()} tickets found.`
          : "❌ No support tickets found for your account."
      };
    }

    const ticketSummary = tickets.map(ticket => ({
      id: ticket.id,
      title: ticket.title,
      category: ticket.category,
      status: ticket.status,
      priority: ticket.priority || 'medium',
      created_at: ticket.created_at.toDateString(),
      hasAttachments: ticket.attachments && ticket.attachments.length > 0
    }));

    return ticketSummary;

  } catch (err) {
    console.error("Get user tickets failed:", err.message);
    return {
      error: true,
      message: "❌ Failed to retrieve your support tickets. Please try again later."
    };
  }
}

// Enhanced chat bot route with improved conversation memory and intent detection
const chatBot = async (req, res, next) => {
  const { userQuery } = req.body;

  const userId = req.user ? req.user.id : null;

  try {
    // Validate user query
    if (!userQuery || userQuery.trim().length === 0) {
      return res.status(400).json({ error: "Please provide a valid message." });
    }

    // Get conversation history
    const conversationHistory = getConversationHistory(userId);

    // Add user message to history
    conversationHistory.addMessage('user', userQuery);

    // Step 1: Detect intent using improved AI with conversation context
    const intent = await detectUserIntentWithAI(userQuery, conversationHistory);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      tools: [{
        google_search: {}
      }]
    });

    let prompt = "";
    let link = null;
    let contextData = null;
    let quickReplies = null;
    let contextType = null;
    let assistantResponse = "";

    // Step 2: Handle intent and fetch relevant data if needed
    switch (intent) {
      case "GREETING":
        prompt = `Welcome to our e-learning platform! I'm here to help you with:
                  - Finding and exploring courses
                  - Managing your account and profile
                  - Tracking your enrollments and purchases
                  - Getting technical support
                  - Accessing your wishlist and purchases
                  
                  What can I help you with today?`;

        quickReplies = [
          { name: "Find courses", description: "Browse available courses" },
          { name: "My account", description: "View profile and settings" },
          { name: "My courses", description: "See enrolled courses" },
          { name: "Need help", description: "Get support" }
        ];
        break;

      case "FOLLOW_UP":
        // Handle follow-up questions based on conversation history
        const lastAssistantMessage = conversationHistory.messages
          .filter(msg => msg.role === 'assistant')
          .pop();

        if (lastAssistantMessage && lastAssistantMessage.contextData) {
          contextData = lastAssistantMessage.contextData;
          contextType = lastAssistantMessage.contextType || "Follow_Up";
          prompt = `Following up on our previous conversation. Let me help you with more details about: ${lastAssistantMessage.content.substring(0, 100)}...`;
        } else {
          prompt = `I'm here to help with any follow-up questions. What would you like to know more about?`;
        }
        break;

      case "CREATE_SUPPORT_TICKET":
        try {
          contextData = await createSupportTicket(userId, userQuery, req.files.chatBotFile);
          contextType = "SUPPORT_TICKET";
          if (contextData) {
            conversationHistory.updateContext('lastSupportTicket', contextData);
            prompt = `✅ **Support ticket created successfully!**
                      
                      **Ticket Details:**
                      - Ticket ID: #${contextData.id || contextData.ticketId}
                      - Status: ${contextData.status || 'Open'}
                      - Priority: ${contextData.priority || 'Normal'}
                      
                      Our support team will respond soon. You can track your ticket status anytime.`;

            quickReplies = [
              { name: "View my tickets", description: "See all support tickets" },
              { name: "Add more details", description: "Update this ticket" },
              { name: "Create another ticket", description: "Report different issue" }
            ];
          } else {
            prompt = `❌ **Unable to create support ticket**
                      
                      Please try again or visit the support section manually. If the problem persists, you can also contact us directly.`;

            quickReplies = [
              { name: "Try again", description: "Create support ticket" },
              { name: "Visit support", description: "Go to support section" },
              { name: "Contact us", description: "Other contact methods" }
            ];
          }
        } catch (error) {
          console.error('Support ticket creation error:', error);
          prompt = `❌ **Error creating support ticket**
                    
                    There was a technical issue. Please try again or contact support directly.`;
        }
        break;

      case "UPDATE_SUPPORT_TICKET":
        const ticketUpdateMatch = userQuery.match(/ticket\s*#?(\d+)|#(\d+)/i);
        const ticketIdToUpdate = ticketUpdateMatch ? (ticketUpdateMatch[1] || ticketUpdateMatch[2]) : null;

        if (ticketIdToUpdate) {
          try {
            contextData = await updateSupportTicket(userId, ticketIdToUpdate, userQuery, req.files.chatBotFile);
            contextType = "SUPPORT_TICKET";
            conversationHistory.updateContext('lastTicketUpdate', contextData);
            prompt = `✅ **Ticket #${ticketIdToUpdate} updated successfully!**
                      
                      Your update has been added to the ticket. Our support team has been notified.`;

            quickReplies = [
              { name: "View ticket details", description: "See full ticket info" },
              { name: "Add another update", description: "More information" },
              { name: "View all tickets", description: "See my tickets" }
            ];
          } catch (error) {
            prompt = `❌ **Unable to update ticket #${ticketIdToUpdate}**
                      
                      Please make sure the ticket ID is correct and try again.`;
          }
        } else {
          prompt = `To update a support ticket, please provide the ticket ID. 
                    
                    **Examples:**
                    - "Update ticket #123"
                    - "Add info to ticket 456"
                    - "Modify ticket #789"`;

          quickReplies = [
            { name: "View my tickets", description: "Find ticket ID" },
            { name: "Create new ticket", description: "Report new issue" }
          ];
        }
        break;

      case "GET_TICKET_DETAILS":
        const ticketDetailMatch = userQuery.match(/ticket\s*#?(\d+)|#(\d+)/i);
        let ticketIdentifier = ticketDetailMatch ? (ticketDetailMatch[1] || ticketDetailMatch[2]) : null;

        if (ticketIdentifier) {
          try {
            contextData = await getSupportTicketDetails(userId, ticketIdentifier);
            contextType = "SUPPORT_TICKET";
            conversationHistory.updateContext('lastTicketDetails', contextData);

            if (contextData) {
              prompt = `**Ticket #${ticketIdentifier} Details:**
                        
                        **Status:** ${contextData.status || 'Open'}
                        **Priority:** ${contextData.priority || 'Normal'}
                        **Created:** ${contextData.created_at || 'N/A'}
                        **Last Updated:** ${contextData.updated_at || 'N/A'}
                        
                        **Description:** ${contextData.description || 'No description available'}`;

              quickReplies = [
                { name: "Update this ticket", description: "Add more information" },
                { name: "View all tickets", description: "See other tickets" },
                { name: "Create new ticket", description: "Report different issue" }
              ];
            } else {
              prompt = `❌ **Ticket #${ticketIdentifier} not found**
                        
                        Please check the ticket ID and try again.`;
            }
          } catch (error) {
            prompt = `❌ **Error retrieving ticket details**
                      
                      Please try again or visit the support section.`;
          }
        } else {
          prompt = `Please provide a specific ticket ID to view details.
                    
                    **Examples:**
                    - "Show ticket #123"
                    - "Details for ticket 456"
                    - "Check ticket #789"`;

          quickReplies = [
            { name: "View all tickets", description: "See my tickets list" },
            { name: "Create new ticket", description: "Report an issue" }
          ];
        }
        break;

      case "LIST_SUPPORT_TICKETS":
        const statusMatch = userQuery.match(/\b(open|closed|resolved|pending)\b/i);
        const requestedStatus = statusMatch ? statusMatch[1] : null;

        try {
          contextType = "SUPPORT_TICKET_LIST";
          contextData = await getUserSupportTickets(userId, requestedStatus);
          conversationHistory.updateContext('lastTicketList', contextData);

          if (contextData && contextData.length > 0) {
            const statusFilter = requestedStatus ? ` (${requestedStatus} tickets)` : '';
            prompt = `**Your Support Tickets${statusFilter}:**
                      
                      Found ${contextData.length} ticket(s). Here's the summary:`;

            // Add ticket summaries to context for AI to format nicely
            quickReplies = [
              { name: "View specific ticket", description: "Get ticket details" },
              { name: "Create new ticket", description: "Report new issue" },
              { name: "Filter by status", description: "Show specific status" }
            ];
          } else {
            prompt = `**No support tickets found**
                      
                      ${requestedStatus ? `You don't have any ${requestedStatus} tickets.` : 'You haven\'t created any support tickets yet.'}
                      
                      Would you like to create one?`;

            quickReplies = [
              { name: "Create support ticket", description: "Report an issue" },
              { name: "Get help", description: "Other support options" }
            ];
          }
        } catch (error) {
          prompt = `❌ **Error retrieving your tickets**
                    
                    Please try again or visit the support section directly.`;
        }
        break;

      case "SUPPORT_HELP":
        prompt = `**Getting Support:**
                  
                  **Quick Support Options:**
                  1. **Chat with me** - I can create support tickets directly
                  2. **Help Center** - Available on Course Details pages
                  3. **Support Tickets** - Submit detailed requests with file attachments
                  4. **Live Chat** - For urgent issues
                  
                  **How to Submit a Support Ticket:**
                  - Select appropriate category
                  - Describe your issue clearly
                  - Attach relevant files/screenshots
                  - Submit and track your ticket
                  
                  Admin typically responds within 24 hours.`;

        quickReplies = [
          { name: "Create support ticket", description: "Report an issue now" },
          { name: "View my tickets", description: "Check existing tickets" },
          { name: "Urgent help", description: "Need immediate assistance" }
        ];
        break;

      case "REVIEW_HELP":
        prompt = `**Writing Course Reviews:**
                  
                  **How to Leave a Review:**
                  1. Go to a course you've completed or are enrolled in
                  2. Look for "Write a Review" or "Rate this Course" button
                  3. Select your star rating (1-5 stars)
                  4. Write your detailed feedback
                  5. Submit your review
                  
                  **Tips for Good Reviews:**
                  - Be honest and specific
                  - Mention what you liked/disliked
                  - Help other students make informed decisions
                  - Keep it constructive and respectful`;

        quickReplies = [
          { name: "My enrolled courses", description: "See courses to review" },
          { name: "How to rate", description: "Rating guidelines" },
          { name: "Review policies", description: "Community guidelines" }
        ];
        break;

      case "WISHLIST_LINK":
        try {
          contextData = await getUserWishlist(userId);
          contextType = "COURSE_LIST";
          conversationHistory.updateContext('lastWishlist', contextData);

          if (contextData && contextData.length > 0) {
            prompt = `**Your Wishlist (${contextData.length} courses saved):**
                      
                      Here are your saved courses. I'll also redirect you to the full wishlist page where you can manage all your saved courses.`;
            link = `/user-wishlist`;

            quickReplies = [
              { name: "Enroll in course", description: "Join a saved course" },
              { name: "Remove from wishlist", description: "Manage saved courses" },
              { name: "Find more courses", description: "Discover new courses" }
            ];
          } else {
            prompt = `**Your wishlist is empty**
                      
                      You haven't saved any courses yet. Would you like me to help you find some interesting courses to add?`;

            quickReplies = [
              { name: "Browse courses", description: "Find courses to save" },
              { name: "Course recommendations", description: "Get personalized suggestions" },
              { name: "Popular courses", description: "See trending courses" }
            ];
          }
        } catch (error) {
          prompt = `❌ **Error loading your wishlist**
                    
                    Please try again or visit the wishlist page directly.`;
          link = `/user-wishlist`;
        }
        break;

      case "ENROLLED_COURSES_LINK":
        try {
          contextData = await getUserCourses(userId);
          contextType = "COURSE_LIST";
          conversationHistory.updateContext('lastEnrolledCourses', contextData);

          if (contextData && contextData.length > 0) {
            prompt = `**Your Enrolled Courses (${contextData.length} courses):**
                      
                      Here are your active courses. I'll redirect you to the full page where you can continue learning.`;
            link = `/user-enrolled-courses`;

            quickReplies = [
              { name: "Continue learning", description: "Resume a course" },
              { name: "Course progress", description: "Check completion status" },
              { name: "Find more courses", description: "Enroll in new courses" }
            ];
          } else {
            prompt = `**No enrolled courses**
                      
                      You haven't enrolled in any courses yet. Let me help you find some great courses to start your learning journey!`;

            quickReplies = [
              { name: "Browse courses", description: "Explore available courses" },
              { name: "Course recommendations", description: "Get suggestions" },
              { name: "Popular courses", description: "See what's trending" }
            ];
          }
        } catch (error) {
          prompt = `❌ **Error loading your courses**
                    
                    Please try again or visit the enrolled courses page directly.`;
          link = `/user-enrolled-courses`;
        }
        break;

      case "PURCHASES_LINK":
        try {
          contextData = await getUserPurchases(userId);
          contextType = "PURCHASE_LIST";
          conversationHistory.updateContext('lastPurchases', contextData);

          if (contextData && contextData.length > 0) {
            prompt = `**Your Purchase History (${contextData.length} transactions):**
                      
                      Here's a summary of your purchases. Redirecting to the full purchase history page.`;
            link = `/user-purchases`;

            quickReplies = [
              { name: "Download receipts", description: "Get purchase receipts" },
              { name: "Refund request", description: "Request a refund" },
              { name: "Purchase support", description: "Help with purchases" }
            ];
          } else {
            prompt = `**No purchase history**
                      
                      You haven't made any purchases yet. Browse our courses to find something you'd like to learn!`;

            quickReplies = [
              { name: "Browse courses", description: "Find courses to purchase" },
              { name: "Free courses", description: "Start with free content" },
              { name: "Course bundles", description: "Save with bundles" }
            ];
          }
        } catch (error) {
          prompt = `❌ **Error loading purchase history**
                    
                    Please try again or visit the purchases page directly.`;
          link = `/user-purchases`;
        }
        break;

      case "PROFILE_LINK":
        try {
          contextData = await getUserProfile(userId);
          contextType = "USER_PROFILE";
          conversationHistory.updateContext('lastProfile', contextData);

          prompt = `**Your Profile Information:**
                    
                    Here's your current profile data. I'll redirect you to the full profile page where you can update your information.`;
          link = `/user-profile`;

          quickReplies = [
            { name: "Update profile", description: "Edit personal information" },
            { name: "Change password", description: "Update security settings" },
            { name: "Privacy settings", description: "Manage privacy options" }
          ];
        } catch (error) {
          prompt = `❌ **Error loading profile**
                    
                    Please try again or visit the profile page directly.`;
          link = `/user-profile`;
        }
        break;

      case "COURSE_RECOMMEND":
        try {
          const categories = await getAllCategories();
          contextData = categories.map(cat => ({
            id: cat.id,
            name: cat.category
          }));
          conversationHistory.updateContext('lastCourseSearchCategories', contextData);
          contextType = "CATEGORY_SELECTION";

          prompt = `**Course Categories Available:**
                    
                    Choose a category that interests you, and I'll show you the best courses in that area:
                    
                    ${contextData.map((cat, i) => `${i + 1}. **${cat.name}**`).join('\n')}`;

          // Generate quick replies from categories
          quickReplies = contextData.slice(0, 4).map(cat => ({
            name: cat.name,
            description: `Explore ${cat.name} courses`
          }));

          // Add a "See all categories" option if there are more than 4
          if (contextData.length > 4) {
            quickReplies.push({ name: "See all categories", description: "View complete list" });
          }
        } catch (error) {
          prompt = `❌ **Error loading course categories**
                    
                    Please try again or browse courses directly.`;

          quickReplies = [
            { name: "Browse all courses", description: "See all available courses" },
            { name: "Popular courses", description: "View trending courses" },
            { name: "Free courses", description: "Start with free content" }
          ];
        }
        break;

      case "COURSE_SEARCH":
        try {
          // Check if this is a follow-up to previous course recommendations
          const lastCourseSearchData = conversationHistory.context.lastCourseSearch;
          const isFollowUpCourseRequest = userQuery.toLowerCase().includes('other') ||
            userQuery.toLowerCase().includes('more') ||
            userQuery.toLowerCase().includes('different') ||
            userQuery.toLowerCase().includes('else') ||
            userQuery.toLowerCase().includes('another');

          if (isFollowUpCourseRequest && lastCourseSearchData) {
            contextData = await getRecommendedCourses(userId, userQuery + " different from previous results");
            contextType = "COURSE_LIST";
            conversationHistory.updateContext('lastCourseSearch', contextData);
            prompt = `**Different Course Recommendations:**
                      
                      Based on your request for alternative options, here are some other courses you might like:`;
          } else {
            contextData = await getRecommendedCourses(userId, userQuery);
            contextType = "COURSE_LIST";
            conversationHistory.updateContext('lastCourseSearch', contextData);
            prompt = `**Course Recommendations for "${userQuery}":**
                      
                      Here are some courses that match your interests:`;
          }

          if (contextData && contextData.length > 0) {
            quickReplies = [
              { name: "Tell me more", description: "Get details about a course" },
              { name: "Different courses", description: "Show other options" },
              { name: "Enroll now", description: "Join a course" },
              // { name: "Add to wishlist", description: "Save for later" }
            ];
          } else {
            prompt = `**No courses found for "${userQuery}"**
                      
                      Let me help you find something else that might interest you.`;

            quickReplies = [
              { name: "Browse categories", description: "Explore by category" },
              { name: "Popular courses", description: "See trending courses" },
              { name: "All courses", description: "View complete catalog" }
            ];
          }
        } catch (error) {
          prompt = `❌ **Error searching for courses**
                    
                    Please try a different search term or browse by category.`;

          quickReplies = [
            { name: "Browse categories", description: "Explore by category" },
            { name: "Try again", description: "Search different terms" }
          ];
        }
        break;

      case "COURSE_DETAIL":
        try {
          contextData = await getCourseDetails(userId, userQuery);
          contextType = "COURSE";

          if (contextData) {
            conversationHistory.updateContext('lastCourseDetail', contextData);
            prompt = `**Course Details: "${contextData.title}"**
                      
                      Here's everything you need to know about this course:`;

            quickReplies = [
              { name: "Enroll now", description: "Join this course" },
              // { name: "Add to wishlist", description: "Save for later" },
              { name: "See reviews", description: "Read student feedback" },
              { name: "Similar courses", description: "Find related courses" }
            ];
          } else {
            prompt = `❌ **Course not found**
                      
                      I couldn't find details for that course. Please check the course name or try searching differently.`;

            quickReplies = [
              { name: "Search courses", description: "Find courses" },
              { name: "Browse categories", description: "Explore by category" },
              { name: "Popular courses", description: "See trending courses" }
            ];
          }
        } catch (error) {
          prompt = `❌ **Error loading course details**
                    
                    Please try again or browse our course catalog.`;
        }
        break;

      case "TECHNICAL_SUPPORT":
        prompt = `**Technical Support**
                  
                  I'm here to help with technical issues! Please describe the problem you're experiencing:
                  
                  **Common Issues:**
                  - Login problems
                  - Video playback issues
                  - Page loading problems
                  - File download issues
                  - Mobile app troubles
                  
                  **For immediate help:**
                  - Try refreshing the page
                  - Clear your browser cache
                  - Check your internet connection
                  - Try a different browser`;

        quickReplies = [
          { name: "Login issues", description: "Can't access account" },
          { name: "Video problems", description: "Course videos not working" },
          { name: "App issues", description: "Mobile app troubles" },
          { name: "Create support ticket", description: "Report detailed issue" }
        ];
        break;

      case "FAQ_HELP":
        try {
          // Use AI to find the most relevant FAQ
          const matchedFAQ = await findFAQAnswer(userQuery);

          if (matchedFAQ) {
            contextData = matchedFAQ;
            contextType = "FAQ_ANSWER";
            conversationHistory.updateContext('lastFAQAnswer', matchedFAQ);

            prompt = `**${matchedFAQ.question}**
                
                ${matchedFAQ.answer}
                
                **Need more help?** Feel free to ask follow-up questions or contact support.`;

            quickReplies = matchedFAQ.quickReplies || [
              { name: "More questions", description: "Ask another question" },
              { name: "Contact support", description: "Get personal help" },
              { name: "Browse help topics", description: "See all help topics" }
            ];

          } else {
            // No specific FAQ found, show general help
            prompt = `**I can help you with these common questions:**
                
                🔐 **Account & Login:**
                - How to reset password
                - Change email address
                - Account security
                
                📚 **Courses:**
                - How to enroll in courses
                - Download course materials
                - Get course certificates
                
                💳 **Payments & Refunds:**
                - Payment methods accepted
                - Refund policy
                - Billing questions
                
                🔧 **Technical Help:**
                - System requirements
                - Browser compatibility
                - Mobile app support
                
                Just ask me about any of these topics!`;

            quickReplies = [
              { name: "Password reset", description: "How to reset password" },
              { name: "Course enrollment", description: "How to enroll" },
              { name: "Certificates", description: "Get course certificates" },
              { name: "Payment help", description: "Payment questions" }
            ];
          }

        } catch (error) {
          console.error('FAQ processing error:', error);
          prompt = `**Help Center**
              
              I'm here to help with your questions! Here are some topics I can assist with:
              
              - Account and login issues
              - Course enrollment and access  
              - Payments and refunds
              - Technical support
              - Certificates and downloads
              
              What specific question do you have?`;

          quickReplies = [
            { name: "Account help", description: "Login and account issues" },
            { name: "Course questions", description: "Enrollment and access" },
            { name: "Payment support", description: "Billing and refunds" },
            { name: "Technical help", description: "Technical issues" }
          ];
        }
        break;

      // Update your default case to include FAQ options

      default:
        prompt = `I'm here to help with your e-learning experience! 
            
            **I can help you with:**
            - Finding and exploring courses
            - Managing your account and enrollments  
            - Tracking purchases and wishlist
            - Getting technical support
            - Creating and managing support tickets
            - **Answering frequently asked questions**
            
            What would you like to do today?`;

        quickReplies = [
          { name: "Browse courses", description: "Find courses to learn" },
          { name: "My account", description: "View account details" },
          { name: "Common questions", description: "FAQ and help topics" },
          { name: "Get support", description: "Need help with something" }
        ];
    }

    // Step 3: Generate final response with conversation context
    const conversationContext = conversationHistory.getFormattedHistory();

    const finalPrompt = `
      You are a helpful e-learning platform assistant. Based on the conversation history and current context, provide a natural, friendly response that fits the platform’s conversational style.

      Conversation History:
      ${conversationContext}

      Current User Query: "${userQuery}"
      Intent Detected: ${intent}
      Base Response: ${prompt}
      ${contextData ? `Additional Data: ${JSON.stringify(contextData)}` : ''}

      Instructions:
      1. Respond naturally, conversationally, and supportively.
      2. Reference previous conversation context when it's relevant.
      3. DO NOT list detailed course or item data in the message — these are already displayed as cards in the UI (e.g., horizontally scrollable lists).
      4. for genral questions like 2+4 or any History or GK related question answer directly and the quick replies are related to the question and one reply for end that conversation.
      4. Instead, acknowledge the content shown visually with helpful indicators like "Here are some options for you 👇".
      5. Be concise, informative, and encouraging.
      6. Do not mention technical terms like "intent", "contextData", or "base response".
      7. Use emojis sparingly and only to enhance clarity or friendliness.
      8. Avoid repeating what's already shown in UI cards like course lists, purchase history, or recommendations.

      Provide only the chatbot's response text below:
    `;

    const result = await model.generateContent(finalPrompt);

    assistantResponse = result.response.text().trim();

    // Add assistant response to conversation history with all context
    conversationHistory.addMessage('assistant', assistantResponse, intent, contextData, contextType);

    res.json({
      reply: assistantResponse,
      redirectLink: link,
      intent: intent,
      contextType: contextType,
      quickReplies: quickReplies,
      contextData: contextData,
      conversationId: userId
    });

  } catch (err) {
    console.error('Chatbot error:', err);
    next(err);
  }
};

module.exports = {
  chatBot
};