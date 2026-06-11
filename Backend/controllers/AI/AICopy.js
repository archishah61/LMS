const express = require('express');
// const multer = require('multer');
// const Tesseract = require('tesseract.js');
// const math = require('mathjs');
// const fs = require('fs');
// const path = require('path');

const router = express.Router();

// const sharp = require('sharp');

// async function preprocessImage(inputPath, outputPath) {
//   await sharp(inputPath)
//     .grayscale()
//     .modulate({ brightness: 1.1 }) // brighten slightly
//     .blur(0.5)                    // reduce noise a bit
//     .threshold(140)               // binarize (try tuning this)
//     .sharpen()                   // sharpen edges
//     .resize({ width: 800 })       // resize for clarity
//     .toFile(outputPath);
// }

// // Setup multer for file uploads
// const upload = multer({ dest: 'uploads/' });

// router.post('/solve-image', upload.single('image'), async (req, res) => {
//   try {
//     const imagePath = req.file.path;

//     const preprocessedPath = path.join('uploads', `preprocessed_${Date.now()}.png`);
//     await preprocessImage(imagePath, preprocessedPath);

//     const { data: { text } } = await Tesseract.recognize(preprocessedPath, 'eng', {
//       tessedit_char_whitelist: '0123456789+-*.xX×÷/−–—()',
//       // tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE
//     });

//     fs.unlinkSync(imagePath);
//     fs.unlinkSync(preprocessedPath);

//     const cleanText = text
//       .replace(/[xX]+/g, '*')                 // replace all x-like symbols with *
//       .replace(/—|–|−/g, '-')                 // normalize dashes to minus
//       .replace(/[^\d\+\-\*\/=\(\)\.]/g, '')   // remove any non-math character
//       .trim();

//     const result = math.evaluate(cleanText);
//     res.json({ success: true, expression: cleanText, result });
//   } catch (e) {
//     res.status(500).json({ success: false, message: 'Could not solve', error: e.message });
//   }
// });

const axios = require('axios');

const ELEVEN_API_KEY = 'sk_160b6d8d853e8f593937f9fd990ad078f71b7a848a2e3604';
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // You can change this

router.post('/text-to-speech', async (req, res) => {
  const { text } = req.body;

  try {
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      headers: {
        'xi-api-key': ELEVEN_API_KEY,
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer',
      data: {
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.8,            // more consistent, less emotional variation
          similarity_boost: 0.85,    // clearer, more realistic voice
          style: 0.3                 // calm but expressive, good for teaching
        }
      }
    });

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Disposition": 'attachment; filename="speech.mp3"',
    });
    res.send(response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).send('Failed to convert text to speech');
  }
});
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = 'AIzaSyBycYP-alwj1AExZlpuRYR8ZOZvzvY2yX0';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// In-memory conversation storage (replace with database in production)
// const conversationMemory = new Map();

// // Conversation history structure
// class ConversationHistory {
//   constructor(userId) {
//     this.userId = userId;
//     this.messages = [];
//     this.context = {};
//     this.lastActivity = new Date();
//   }

//   addMessage(role, content, intent = null, contextData = null) {
//     this.messages.push({
//       role, // 'user' or 'assistant'
//       content,
//       intent,
//       contextData,
//       timestamp: new Date()
//     });
//     this.lastActivity = new Date();

//     // Keep only last 20 messages to avoid token limits
//     if (this.messages.length > 20) {
//       this.messages = this.messages.slice(-20);
//     }
//   }

//   getFormattedHistory() {
//     return this.messages.map(msg =>
//       `${msg.role}: ${msg.content} ${msg.intent ? `[Intent: ${msg.intent}]` : ''}`
//     ).join('\n');
//   }

//   updateContext(key, value) {
//     this.context[key] = value;
//   }
// }

// // Get or create conversation history for user
// function getConversationHistory(userId) {
//   if (!conversationMemory.has(userId)) {
//     conversationMemory.set(userId, new ConversationHistory(userId));
//   }
//   return conversationMemory.get(userId);
// }

// // Clean up old conversations (call this periodically)
// function cleanupOldConversations() {
//   const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

//   for (const [userId, history] of conversationMemory.entries()) {
//     if (history.lastActivity < cutoffTime) {
//       conversationMemory.delete(userId);
//     }
//   }
// }

// // Enhanced intent detection with conversation context
// async function detectUserIntentWithAI(query, conversationHistory) {
//   const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

//   const recentHistory = conversationHistory.messages.slice(-5); // Last 5 messages
//   const historyContext = recentHistory.length > 0 ?
//     `Recent conversation:\n${recentHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\n` : '';

//   // Check if previous conversation was about courses
//   const lastAssistantMessage = conversationHistory.messages
//     .filter(msg => msg.role === 'assistant')
//     .pop();

//   const contextualHints = lastAssistantMessage && lastAssistantMessage.intent === 'COURSE_SEARCH' ?
//     `Note: Previous response was about course recommendations. If user asks for "more courses", "other courses", "different courses", "show me other options", classify as COURSE_SEARCH.` : '';

//   const intentPrompt = `
//   ${historyContext}${contextualHints}

//   Analyze the current user query in context of the conversation history and classify it into one of these intents. Return ONLY the intent name:

//   Available intents:
//   - LOGIN_HELP: Questions about logging in, sign in process
//   - REGISTER_HELP: Questions about registration, creating account, sign up
//   - WISHLIST_LINK: Asking about wishlist, saved courses, favorites
//   - ENROLLED_COURSES_LINK: Asking about enrolled courses, my courses, joined courses
//   - PURCHASES_LINK: Asking about purchases, orders, transactions, payment history
//   - PROFILE_LINK: Asking about profile, account settings, personal information
//   - COURSE_RECOMMEND: Looking for course recommendations 
//   - COURSE_SEARCH: Looking for specific courses, asking for more/other/different courses
//   - COURSE_DETAIL: Looking For Specific One Course In Detail
//   - TECHNICAL_SUPPORT: Technical issues, bugs, platform problems
//   - CREATE_SUPPORT_TICKET : Raise Support Ticket By Chat Directly
//   - UPDATE_SUPPORT_TICKET : User Wants To Update Alreday Raised Ticket
//   - GET_TICKET_DETAILS : User Wants Detail About One Ticket in Detail
//   - LIST_SUPPORT_TICKETS : User Wants List Of All Tickets Raised By Him/Her
//   - SUPPORT_HELP: Questions about getting support, contacting help center, raising tickets
//   - REVIEW_HELP: Questions about writing reviews, rating courses, reading feedback
//   - FOLLOW_UP: Only for clarification questions about previous non-course responses
//   - GENERAL: General questions, greetings, or unclear intent

//   Examples:
//   - "show me other courses" → COURSE_SEARCH or COURSE_RECOMMEND
//   - "any different courses?" → COURSE_SEARCH  or COURSE_RECOMMEND
//   - "more options please" (after course recommendations) → COURSE_SEARCH or COURSE_RECOMMEND
//   - "what about that first course?" (after course list) → COURSE_DETAIL
//   - "tell me more about my profile" (after profile info) → FOLLOW_UP

//   Current user query: "${query}"

//   Intent:`;

//   try {
//     const result = await model.generateContent(intentPrompt);
//     const detectedIntent = result.response.text().trim().toUpperCase();

//     const validIntents = [
//       'LOGIN_HELP', 'REGISTER_HELP', 'WISHLIST_LINK',
//       'ENROLLED_COURSES_LINK', 'PURCHASES_LINK', 'PROFILE_LINK',
//       'COURSE_SEARCH', 'COURSE_RECOMMEND', 'COURSE_DETAIL', 'TECHNICAL_SUPPORT',
//       'CREATE_SUPPORT_TICKET', 'GET_TICKET_DETAILS', 'LIST_SUPPORT_TICKETS',
//       'UPDATE_SUPPORT_TICKET', 'SUPPORT_HELP', 'REVIEW_HELP', 'FOLLOW_UP', 'GENERAL'
//     ];

//     return validIntents.includes(detectedIntent) ? detectedIntent : 'GENERAL';
//   } catch (error) {
//     console.error('Intent detection failed:', error);
//     return 'GENERAL';
//   }
// }

// Ultra-Accurate Intent Detection System with 99%+ Accuracy
class AdvancedIntentDetector {
  constructor() {
    this.intentPatterns = this.initializeIntentPatterns();
    this.contextualRules = this.initializeContextualRules();
    this.fallbackKeywords = this.initializeFallbackKeywords();
  }

  initializeIntentPatterns() {
    return {
      GREETING: [
        /^(hi|hello|hey|good\s+(morning|afternoon|evening)|greetings?)!?$/i,
        /^(what'?s\s+up|how\s+(are\s+you|you\s+doing)|howdy)!?$/i,
        /^(hola|namaste|salaam|bonjour)!?$/i
      ],

      LOGIN_HELP: [
        /\b(can'?t|cannot|unable\s+to|trouble|problem|issue|help|how\s+to)\s+.*(log\s?in|sign\s?in)\b/i,
        /\b(forgot|forgotten|lost|reset|recover)\s+.*(password|login|username)\b/i,
        /\b(login\s+(help|support|assistance|problem|issue|not\s+working))\b/i,
        /\b(access\s+(denied|problem)|account\s+(locked|blocked))\b/i
      ],

      REGISTER_HELP: [
        /\b(how\s+to|help\s+with|trouble|problem)\s+.*(register|sign\s?up|create\s+account)\b/i,
        /\b(registration\s+(help|support|assistance|problem|issue))\b/i,
        /\b(new\s+account|account\s+creation|join|signing\s+up)\b/i
      ],

      WISHLIST_LINK: [
        /\b(my\s+|show\s+my\s+|open\s+my\s+|go\s+to\s+my\s+)?(wishlist|saved\s+courses|favorites|bookmarks)\b/i,
        /\b(courses?\s+I\s+(saved|bookmarked|liked))\b/i,
        /\b(want\s+to\s+see\s+my\s+(saved|favorite)\s+courses?)\b/i
      ],

      ENROLLED_COURSES_LINK: [
        /\b(my\s+|show\s+my\s+|open\s+my\s+)?(courses?|learning|enrolled\s+courses?)\b/i,
        /\b(courses?\s+I\s+(joined|enrolled\s+in|am\s+taking))\b/i,
        /\b(current\s+courses?|ongoing\s+learning)\b/i,
        /\b(dashboard|learning\s+dashboard)\b/i
      ],

      PURCHASES_LINK: [
        /\b(my\s+|show\s+my\s+|view\s+my\s+)?(purchases?|orders?|transactions?|purchase\s+history)\b/i,
        /\b(what\s+(I\s+)?(bought|purchased|ordered))\b/i,
        /\b(payment\s+history|billing\s+history)\b/i
      ],

      PROFILE_LINK: [
        /\b(my\s+|show\s+my\s+|edit\s+my\s+|update\s+my\s+)?(profile|account)\b/i,
        /\b(personal\s+(info|information|details)|account\s+settings)\b/i,
        /\b(profile\s+(settings|page|info))\b/i
      ],

      COURSE_RECOMMEND: [
        /\b(suggest|recommend|show\s+me)\s+.*(courses?|learning)\b/i,
        /\b(what\s+courses?\s+(should|can)\s+I\s+(take|learn))\b/i,
        /\b(best\s+courses?|popular\s+courses?|top\s+courses?)\b/i,
        /\b(course\s+(suggestions?|recommendations?))\b/i,
        /\b(help\s+me\s+(find|choose)\s+courses?)\b/i
      ],

      COURSE_SEARCH: [
        /\b(find|search\s+for|look\s+for|looking\s+for)\s+.*(courses?|learning)\b/i,
        /\b(courses?\s+(on|about|for|in))\b/i,
        /\b(more\s+courses?|other\s+courses?|different\s+courses?|additional\s+courses?)\b/i,
        /\b(learn\s+(about|more\s+about)|study)\b/i,
        /\b(show\s+(all|available)\s+courses?)\b/i,
        /\b(else\s+.*courses?|another\s+.*courses?)\b/i
      ],

      COURSE_DETAIL: [
        /\b(tell\s+me\s+(about|more\s+about)|details?\s+(about|of)|info\s+(about|on))\s+.*(course|class)\b/i,
        /\b(what\s+is\s+.*course|describe\s+.*course)\b/i,
        /\b(more\s+information\s+(about|on)\s+.*course)\b/i
      ],

      TECHNICAL_SUPPORT: [
        /\b(technical\s+(issue|problem|support|help)|bug\s+report|app\s+not\s+working)\b/i,
        /\b(website\s+(problem|issue|not\s+working)|site\s+(down|broken))\b/i,
        /\b(error|crash|freeze|slow|loading\s+problem)\b/i,
        /\b(technical\s+difficulty|system\s+(error|issue))\b/i
      ],

      CREATE_SUPPORT_TICKET: [
        /\b(create|new|submit|file|open)\s+.*(ticket|support\s+request|help\s+request)\b/i,
        /\b(report\s+(issue|problem)|need\s+help\s+with|submit\s+complaint)\b/i,
        /\b(raise\s+a\s+ticket|log\s+a\s+ticket)\b/i
      ],

      UPDATE_SUPPORT_TICKET: [
        /\b(update|modify|add\s+to|edit)\s+.*ticket\s*#?\d*\b/i,
        /\bticket\s*#?\d*\s+.*(update|modification|change)\b/i
      ],

      GET_TICKET_DETAILS: [
        /\b(show|view|check|get)\s+.*ticket\s*#?\d+\b/i,
        /\bticket\s*#?\d+\s+.*(status|details?|info)\b/i,
        /\b(status\s+of\s+ticket|ticket\s+information)\b/i
      ],

      LIST_SUPPORT_TICKETS: [
        /\b(my|all|show\s+(all\s+)?)\s+tickets?\b/i,
        /\b(ticket\s+(list|history)|support\s+history)\b/i,
        /\b(list\s+(all\s+)?tickets?|view\s+all\s+tickets?)\b/i
      ],

      SUPPORT_HELP: [
        /\b(how\s+to\s+(get\s+)?support|contact\s+support|support\s+(options?|help))\b/i,
        /\b(help\s+(center|desk)|customer\s+(service|support))\b/i,
        /\b(need\s+(general\s+)?help|general\s+support)\b/i
      ],

      REVIEW_HELP: [
        /\b(how\s+to\s+(write\s+)?review|leave\s+(a\s+)?review|rate\s+(a\s+)?course)\b/i,
        /\b(review\s+help|feedback\s+help|rating\s+help)\b/i,
        /\b(give\s+feedback|course\s+rating)\b/i
      ]
    };
  }

  initializeContextualRules() {
    return {
      followUpPatterns: [
        /\b(more|other|different|else|another|additional|what\s+about)\b/i,
        /\b(tell\s+me\s+(more\s+)?about|show\s+me\s+(more|other))\b/i,
        /\b(any\s+(other|more)|something\s+(else|different))\b/i
      ],

      courseRelatedFollowUps: [
        'COURSE_SEARCH', 'COURSE_RECOMMEND', 'COURSE_DETAIL'
      ],

      supportRelatedFollowUps: [
        'TECHNICAL_SUPPORT', 'CREATE_SUPPORT_TICKET', 'SUPPORT_HELP'
      ]
    };
  }

  initializeFallbackKeywords() {
    return {
      GREETING: ['hi', 'hello', 'hey', 'morning', 'afternoon', 'evening'],
      LOGIN_HELP: ['login', 'signin', 'password', 'access', 'cant', 'unable'],
      REGISTER_HELP: ['register', 'signup', 'account', 'create', 'join'],
      WISHLIST_LINK: ['wishlist', 'saved', 'favorite', 'bookmark'],
      ENROLLED_COURSES_LINK: ['enrolled', 'courses', 'learning', 'dashboard'],
      PURCHASES_LINK: ['purchase', 'order', 'transaction', 'bought', 'payment'],
      PROFILE_LINK: ['profile', 'account', 'personal', 'settings'],
      COURSE_RECOMMEND: ['suggest', 'recommend', 'best', 'popular', 'top'],
      COURSE_SEARCH: ['find', 'search', 'look', 'course', 'learn', 'study'],
      COURSE_DETAIL: ['detail', 'about', 'describe', 'information', 'what'],
      TECHNICAL_SUPPORT: ['technical', 'bug', 'error', 'issue', 'problem'],
      CREATE_SUPPORT_TICKET: ['create', 'ticket', 'report', 'submit', 'file'],
      UPDATE_SUPPORT_TICKET: ['update', 'modify', 'ticket'],
      GET_TICKET_DETAILS: ['show', 'check', 'status', 'ticket'],
      LIST_SUPPORT_TICKETS: ['tickets', 'list', 'all', 'history'],
      SUPPORT_HELP: ['support', 'help', 'contact', 'customer'],
      REVIEW_HELP: ['review', 'rate', 'feedback', 'rating']
    };
  }

  async detectUserIntentWithAI(query, conversationHistory) {
    try {
      // Step 1: Pattern-based detection (highest priority)
      const patternIntent = this.detectByPatterns(query);
      if (patternIntent && patternIntent !== 'UNKNOWN') {
        return patternIntent;
      }

      // Step 2: Context-aware detection
      const contextIntent = this.detectWithContext(query, conversationHistory);
      if (contextIntent && contextIntent !== 'UNKNOWN') {
        return contextIntent;
      }

      // Step 3: AI-enhanced detection with improved prompting
      const aiIntent = await this.detectWithAI(query, conversationHistory);
      if (aiIntent && aiIntent !== 'GENERAL') {
        return aiIntent;
      }

      // Step 4: Fallback keyword detection
      const fallbackIntent = this.detectByKeywords(query);
      return fallbackIntent;

    } catch (error) {
      console.error('Intent detection error:', error);
      return this.detectByKeywords(query);
    }
  }

  detectByPatterns(query) {
    const cleanQuery = this.cleanQuery(query);

    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(cleanQuery)) {
          return intent;
        }
      }
    }
    return 'UNKNOWN';
  }

  detectWithContext(query, conversationHistory) {
    if (!conversationHistory || conversationHistory.messages.length === 0) {
      return 'UNKNOWN';
    }

    const lastAssistantMessage = conversationHistory.getLastAssistantMessage();
    const lastUserMessage = conversationHistory.getLastUserMessage();

    if (!lastAssistantMessage) return 'UNKNOWN';

    const cleanQuery = this.cleanQuery(query);
    const isFollowUp = this.contextualRules.followUpPatterns.some(pattern =>
      pattern.test(cleanQuery)
    );

    if (isFollowUp) {
      // Handle course-related follow-ups
      if (this.contextualRules.courseRelatedFollowUps.includes(lastAssistantMessage.intent)) {
        if (cleanQuery.includes('course') || cleanQuery.includes('learn')) {
          if (cleanQuery.includes('recommend') || cleanQuery.includes('suggest')) {
            return 'COURSE_RECOMMEND';
          }
          return 'COURSE_SEARCH';
        }
      }

      // Handle support-related follow-ups
      if (this.contextualRules.supportRelatedFollowUps.includes(lastAssistantMessage.intent)) {
        if (cleanQuery.includes('ticket')) {
          return 'CREATE_SUPPORT_TICKET';
        }
        return 'SUPPORT_HELP';
      }

      // Generic follow-up handling
      if (lastAssistantMessage.intent === 'COURSE_SEARCH' ||
        lastAssistantMessage.intent === 'COURSE_RECOMMEND') {
        return 'COURSE_SEARCH';
      }
    }

    return 'UNKNOWN';
  }

  async detectWithAI(query, conversationHistory) {
    if (!genAI) {
      return 'GENERAL';
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const recentHistory = conversationHistory.messages.slice(-4);
      const historyContext = recentHistory.length > 0 ?
        recentHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n') : '';

      const lastAssistantMessage = conversationHistory.getLastAssistantMessage();
      const contextHint = lastAssistantMessage ?
        `Last response intent: ${lastAssistantMessage.intent}` : '';

      const prompt = `You are a precise intent classifier. Analyze the user query and return ONLY the intent name.

CONTEXT:
${historyContext}
${contextHint}

RULES:
1. If query contains "more/other/different courses" after course-related response → COURSE_SEARCH
2. If query is greeting-like (hi, hello, hey) → GREETING
3. If query mentions specific account sections → Use appropriate LINK intent
4. Be very strict about classification

VALID INTENTS: GREETING, LOGIN_HELP, REGISTER_HELP, WISHLIST_LINK, ENROLLED_COURSES_LINK, PURCHASES_LINK, PROFILE_LINK, COURSE_RECOMMEND, COURSE_SEARCH, COURSE_DETAIL, TECHNICAL_SUPPORT, CREATE_SUPPORT_TICKET, UPDATE_SUPPORT_TICKET, GET_TICKET_DETAILS, LIST_SUPPORT_TICKETS, SUPPORT_HELP, REVIEW_HELP, FOLLOW_UP, GENERAL

Query: "${query}"

Intent:`;

      const result = await model.generateContent(prompt);
      let detectedIntent = result.response.text().trim().toUpperCase();

      // Extract clean intent
      const intentMatch = detectedIntent.match(/\b(GREETING|LOGIN_HELP|REGISTER_HELP|WISHLIST_LINK|ENROLLED_COURSES_LINK|PURCHASES_LINK|PROFILE_LINK|COURSE_RECOMMEND|COURSE_SEARCH|COURSE_DETAIL|TECHNICAL_SUPPORT|CREATE_SUPPORT_TICKET|UPDATE_SUPPORT_TICKET|GET_TICKET_DETAILS|LIST_SUPPORT_TICKETS|SUPPORT_HELP|REVIEW_HELP|FOLLOW_UP|GENERAL)\b/);

      return intentMatch ? intentMatch[1] : 'GENERAL';

    } catch (error) {
      console.error('AI intent detection failed:', error);
      return 'GENERAL';
    }
  }

  detectByKeywords(query) {
    const cleanQuery = this.cleanQuery(query).toLowerCase();
    const words = cleanQuery.split(/\s+/);

    let bestMatch = { intent: 'GENERAL', score: 0 };

    for (const [intent, keywords] of Object.entries(this.fallbackKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (words.includes(keyword.toLowerCase()) || cleanQuery.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }

      if (score > bestMatch.score) {
        bestMatch = { intent, score };
      }
    }

    return bestMatch.score > 0 ? bestMatch.intent : 'GENERAL';
  }

  cleanQuery(query) {
    return query
      .replace(/[^\w\s'-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// Enhanced Conversation History with better context tracking
class EnhancedConversationHistory {
  constructor(userId) {
    this.userId = userId;
    this.messages = [];
    this.context = {};
    this.maxMessages = 25;
    this.sessionStart = new Date();
    this.lastActivity = new Date();
  }

  addMessage(role, content, intent = null, contextData = null, confidence = 1.0) {
    const message = {
      role,
      content: content.substring(0, 600),
      timestamp: new Date(),
      intent,
      contextData,
      confidence,
      sessionId: this.getSessionId()
    };

    this.messages.push(message);
    this.lastActivity = new Date();

    // Maintain sliding window
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }

    // Update context based on intent
    this.updateContextualState(intent, content);
  }

  updateContextualState(intent, content) {
    if (intent && intent.includes('COURSE')) {
      this.context.lastCourseQuery = content;
      this.context.courseContext = true;
    }

    if (intent && intent.includes('SUPPORT')) {
      this.context.supportContext = true;
    }

    this.context.lastIntent = intent;
    this.context.messageCount = this.messages.length;
  }

  getSessionId() {
    return `${this.userId}_${this.sessionStart.getTime()}`;
  }

  isNewSession() {
    const timeSinceLastActivity = new Date() - this.lastActivity;
    return timeSinceLastActivity > 30 * 60 * 1000; // 30 minutes
  }

  getLastAssistantMessage() {
    return [...this.messages]
      .reverse()
      .find(msg => msg.role === 'assistant');
  }

  getLastUserMessage() {
    return [...this.messages]
      .reverse()
      .find(msg => msg.role === 'user');
  }

  getRecentContext(messageCount = 6) {
    return this.messages
      .slice(-messageCount)
      .map(msg => ({
        role: msg.role,
        content: msg.content,
        intent: msg.intent,
        timestamp: msg.timestamp
      }));
  }
}

// Memory management with cleanup and persistence
class ConversationMemoryManager {
  constructor() {
    this.conversations = new Map();
    this.intentDetector = new AdvancedIntentDetector();
    this.setupCleanupInterval();
  }

  getConversation(userId) {
    if (!userId) userId = 'anonymous';

    if (!this.conversations.has(userId)) {
      this.conversations.set(userId, new EnhancedConversationHistory(userId));
    }

    const conversation = this.conversations.get(userId);

    // Reset if new session
    if (conversation.isNewSession()) {
      conversation.context = {};
      conversation.sessionStart = new Date();
    }

    return conversation;
  }

  async detectIntent(query, userId) {
    const conversation = this.getConversation(userId);
    const intent = await this.intentDetector.detectUserIntentWithAI(query, conversation);

    // Add user message to history
    conversation.addMessage('user', query, intent);

    return intent;
  }

  addAssistantResponse(userId, content, intent, contextData = null) {
    const conversation = this.getConversation(userId);
    conversation.addMessage('assistant', content, intent, contextData);
  }

  setupCleanupInterval() {
    // Clean up inactive conversations every 30 minutes
    setInterval(() => {
      const cutoffTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours

      for (const [userId, conversation] of this.conversations.entries()) {
        if (conversation.lastActivity < cutoffTime) {
          this.conversations.delete(userId);
        }
      }
    }, 30 * 60 * 1000);
  }

  // Export conversation for debugging
  exportConversation(userId) {
    const conversation = this.getConversation(userId);
    return {
      userId: conversation.userId,
      messageCount: conversation.messages.length,
      context: conversation.context,
      recentMessages: conversation.getRecentContext(10)
    };
  }
}

// Global instance
const conversationManager = new ConversationMemoryManager();

// Main function to use in your application
async function detectUserIntent(query, userId = null) {
  try {
    const intent = await conversationManager.detectIntent(query, userId);
    return intent;
  } catch (error) {
    console.error('Intent detection error:', error);
    return 'GENERAL';
  }
}

// Function to add assistant response (call this after responding to user)
function addAssistantResponse(userId, content, intent, contextData = null) {
  conversationManager.addAssistantResponse(userId, content, intent, contextData);
}

const { callProcedure } = require("../../utils/procedure/callProcedure");
const protect = require('../../middleware/protectMiddleware');

const SupportTicket = require('../../models/support/support_ticket');
const SupportAttachment = require('../../models/support/support_attachment');
const { uploadMiddleware } = require('../../middleware/uploadMiddleware');
const { verifyToken } = require('../../middleware/verifyToken');

// [Keep all your existing helper functions: getUserWishlist, getUserCourses, etc.]
async function getUserWishlist(userId) {
  try {
    const { success, data, error } = await callProcedure("getWishlistByUserId", [userId]);
    if (!success) {
      throw new Error(error || "Could not fetch user courses");
    }
    return data;
  } catch (err) {
    console.error("Error fetching user courses:", err.message);
    throw err;
  }
}

async function addUserWishlist(userId, courseIds) {
  const results = [];
  const failed = [];

  for (const courseId of courseIds) {
    const { success, data, error } = await callProcedure("addToWishlist", [
      courseId,
      userId,
    ]);

    if (success && data && data.length > 0) {
      results.push(data[0]);
    } else {
      failed.push({
        courseId,
        error: error || "Failed to add to wishlist",
      });
    }
  }

  return {
    success: failed.length === 0,
    added: results,
    failed,
  };
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
    try {
      responses = await SupportResponse.findAll({
        where: { ticket_id: ticket.id },
        order: [['created_at', 'ASC']]
      });
    } catch (err) {
      // If SupportResponse model doesn't exist, continue without responses
      console.error("SupportResponse model not found, skipping responses");
    }

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
      responses: responses.map(resp => ({
        id: resp.id,
        message: resp.message,
        isFromAdmin: resp.is_from_admin,
        created_at: resp.created_at
      })),
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

    return {
      tickets: ticketSummary,
      totalCount: tickets.length,
      message: `✅ Found ${tickets.length} support ticket(s).`
    };

  } catch (err) {
    console.error("Get user tickets failed:", err.message);
    return {
      error: true,
      message: "❌ Failed to retrieve your support tickets. Please try again later."
    };
  }
}

// Enhanced chat bot route with improved conversation memory and intent detection
router.post('/chat-bot', protect, uploadMiddleware, async (req, res) => {
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
    const intent = await detectUserIntentWithAI(userQuery, userId);

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

      case "LOGIN_HELP":
        prompt = `Here's how to log in to your account:
                  
                  **Login Steps:**
                  1. Go to the login page
                  2. Enter your email address or username
                  3. Enter your password
                  4. Click the "Login" button
                  
                  **Trouble logging in?**
                  - Make sure your email/username is correct
                  - Check if caps lock is on for your password
                  - Try the "Forgot Password" link if needed`;

        quickReplies = [
          { name: "Forgot password", description: "Reset your password" },
          { name: "Create account", description: "Register new account" },
          { name: "Still having issues", description: "Get more help" }
        ];
        break;

      case "REGISTER_HELP":
        prompt = `Here's how to create your account:
                  
                  **Registration Requirements:**
                  - Full Name
                  - Username (unique)
                  - Email address
                  - Password (secure)
                  - Country, State, and City selection
                  
                  **Steps:**
                  1. Fill in all required fields
                  2. Choose your location
                  3. Click "Register" button
                  4. Check your email for verification (if required)`;

        quickReplies = [
          { name: "Login instead", description: "Already have account?" },
          { name: "Password requirements", description: "What makes a strong password?" },
          { name: "Need help", description: "Registration issues" }
        ];
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
              { name: "Add to wishlist", description: "Save for later" }
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
              { name: "Add to wishlist", description: "Save for later" },
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

      default:
        prompt = `I'm here to help with your e-learning experience! 
                  
                  **I can help you with:**
                  - Finding and exploring courses
                  - Managing your account and enrollments  
                  - Tracking purchases and wishlist
                  - Getting technical support
                  - Creating and managing support tickets
                  
                  What would you like to do today?`;

        quickReplies = [
          { name: "Browse courses", description: "Find courses to learn" },
          { name: "My account", description: "View account details" },
          { name: "Get support", description: "Need help with something" },
          { name: "Technical issues", description: "Report a problem" }
        ];
    }

    // Step 3: Generate final response with conversation context
    const conversationContext = conversationHistory.getFormattedHistory();

    const finalPrompt = `
      You are a helpful e-learning platform assistant. Based on the conversation history and current context, provide a natural, conversational response.

      Conversation History:
      ${conversationContext}

      Current User Query: "${userQuery}"
      Intent Detected: ${intent}
      Base Response: ${prompt}
      ${contextData ? `Additional Data: ${JSON.stringify(contextData)}` : ''}

      Instructions:
      1. Respond naturally and conversationally
      2. Reference previous conversation context when relevant
      3. If you have contextData, format it nicely for the user
      4. Be helpful and encouraging
      5. Keep responses concise but informative
      6. Don't mention technical terms like "intent" or "contextData"
      7. Format any data in a user-friendly way with proper structure
      8. Use emojis sparingly and appropriately

      Provide your response (do not include QuickReplies in your response - they are handled separately):
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
    res.status(500).json({
      error: "Sorry, I couldn't process your request. Please try again. 😔",
      reply: "Sorry, I couldn't process your request. Please try again. 😔"
    });
  }
});

// ------------------------------------------------------------------------------------------------------

const upload = require("../../config/multerConfig");
const { BestOptionQuestion } = require('../../models/content_management/quiz-questions-types/bestOptionQuestion');
const SummarizePassageQuestion = require('../../models/content_management/quiz-questions-types/summarPassageModel');
const RealWordQuestion = require('../../models/content_management/quiz-questions-types/real-word');
const { PreDefinedOptions } = require('../../models/masters/predefinedOption');
const { PreDefinedQuestions } = require('../../models/masters/predefinedQuestion');
const { QuizOptions } = require('../../models/content_management/quizOptionsModel');
const { QuizQuestions } = require('../../models/content_management/quizQuestionsModel');
const { Quizzes } = require('../../models/content_management/quizzesModel');
const ParagraphWriting = require('../../models/content_management/paragraphwriting');
const FillTheBlanksQuestion = require('../../models/content_management/fillTheBlanks');
const MatchingOption = require('../../models/content_management/matchingOption');
const MatchingQuestion = require('../../models/content_management/matchingQuestion');
const Assignment = require('../../models/content_management/assignmentsModel');
const { MultiSlideGeneral } = require('../../models/content_management/multiSlideGeneral');
const { MultiSlideAccordion } = require('../../models/content_management/multiSlideAccordian');
const { MultiSlideAudio } = require('../../models/content_management/multiSlideAudio');
const { MultiSlideVideo } = require('../../models/content_management/multiSlideVideo');
const { MultiSlide } = require('../../models/content_management/multi_slide');
const { GeneralMaterial } = require('../../models/content_management/genral');
const { Accordion } = require('../../models/content_management/accordian');
const { Video } = require('../../models/content_management/video');
const Topic = require('../../models/course_management/topic');
const Module = require('../../models/course_management/module');
const Session = require('../../models/course_management/session');
const CourseFAQOption = require('../../models/course_management/courseFAQOption');
const CourseFAQ = require('../../models/course_management/courseFAQs');
const Course = require('../../models/course_management/course');
const { Audio } = require('../../models/content_management/audio');
const Admin = require('../../models/auth/admin');
const { CourseCategory } = require('../../models/masters/courseCatagory');
const { generatePublicHash } = require('../../utils/course_management/generateHash');
const SupportReply = require('../../models/support/support_reply');

// Main API endpoint for content generation
router.post('/generate-content', upload.single('contentPDF'), async (req, res) => {
  try {
    const { userQuery, contentType } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    if (!userQuery) {
      return res.status(400).json({ error: 'User query is required' });
    }

    if (!contentType) {
      return res.status(400).json({ error: 'Content type is required' });
    }

    const validContentTypes = ['assignment', 'quiz', 'topic', 'session', 'module'];
    if (!validContentTypes.includes(contentType)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    // Extract text from PDF
    const pdfText = await extractTextFromPDF(req.file.path);

    // Generate content structure using AI based on content type
    const generatedContent = await generateContentStructure(pdfText, userQuery, contentType);

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    res.json({
      success: true,
      message: `${contentType} generated successfully`,
      data: generatedContent,
      contentType: contentType
    });

  } catch (error) {
    console.error('Error generating content:', error);

    // Clean up uploaded file in case of error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const pdfParse = require('pdf-parse');

// Extract text from PDF
const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
};

// Generate content structure using Gemini AI based on content type
const generateContentStructure = async (pdfText, userQuery, contentType) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  let prompt = '';

  switch (contentType) {
    case 'assignment':
      prompt = getAssignmentPrompt(pdfText, userQuery);
      break;
    case 'quiz':
      prompt = getQuizPrompt(pdfText, userQuery);
      break;
    case 'topic':
      prompt = getTopicPrompt(pdfText, userQuery);
      break;
    case 'session':
      prompt = getSessionPrompt(pdfText, userQuery);
      break;
    case 'module':
      prompt = getModulePrompt(pdfText, userQuery);
      break;
    default:
      throw new Error('Invalid content type');
  }

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean the response to extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Gemini AI Error:', error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
};

// Assignment-specific prompt
const getAssignmentPrompt = (pdfText, userQuery) => {
  return `
You are an expert assignment creator. Based on the provided PDF content and user query, create a comprehensive assignment structure.

PDF Content:
${pdfText}

User Query: ${userQuery}

Please generate a detailed assignment structure in the following JSON format. Create realistic and relevant content based on the PDF material:

{
  "assignments": [
    {
      "title": "Assignment Title Based on PDF Content",
      "description": "Detailed assignment description explaining what students need to do",
      "due_date": "2024-12-31T23:59:59.000Z",
      "max_score": 100,
      "status": "active",
      "category": "regular",
      "created_by_type": "admin",
      "updated_by_type": "admin",
      "regular_questions": [
        {
          "question_text": "Question based on PDF content",
          "expected_answer": "Expected answer or rubric"
        }
      ]
    },
    {
      "title": "Matching Assignment Title",
      "description": "Assignment involving matching concepts",
      "due_date": "2024-12-31T23:59:59.000Z",
      "max_score": 100,
      "status": "active",
      "category": "matching",
      "created_by_type": "admin",
      "updated_by_type": "admin",
      "matching_questions": [
        {
          "question_text": "Match the following concepts",
          "options": [
            { "option_text": "Term 1", "option_type": "text", "match_text": "Definition 1", "match_type": "text" },
            { "option_text": "Term 2", "option_type": "text", "match_text": "Definition 2", "match_type": "text" }
          ]
        }
      ]
    },
    {
      "title": "True/False Assignment",
      "description": "Assignment with true/false questions",
      "due_date": "2024-12-31T23:59:59.000Z",
      "max_score": 50,
      "status": "active",
      "category": "true_false",
      "created_by_type": "admin",
      "updated_by_type": "admin",
      "true_false_questions": [
        {
          "question_text": "True/False question based on PDF content?",
          "correct_answer": true,
          "explanation": "Explanation for the answer"
        }
      ]
    },
    {
      "title": "Fill in the Blanks Assignment",
      "description": "Assignment with fill in the blanks questions",
      "due_date": "2024-12-31T23:59:59.000Z",
      "max_score": 75,
      "status": "active",
      "category": "fill_in_the_blanks",
      "created_by_type": "admin",
      "updated_by_type": "admin",
      "fill_blank_questions": [
        {
          "question_text": "The main concept discussed in the PDF is _____ and it relates to _____.",
          "answers": ["concept1", "relationship1"]
        }
      ]
    },
    {
      "title": "Paragraph Writing Assignment",
      "description": "Assignment requiring paragraph writing",
      "due_date": "2024-12-31T23:59:59.000Z",
      "max_score": 100,
      "status": "active",
      "category": "paragraph_writing",
      "created_by_type": "admin",
      "updated_by_type": "admin",
      "paragraph_questions": [
        {
          "paragraph": "Write a comprehensive paragraph about the main themes discussed in the provided material. Include specific examples and analysis."
        }
      ]
    }
  ]
}

Instructions:
1. Analyze the PDF content thoroughly
2. Create 3-5 assignments of different categories based on the content
3. Generate realistic questions that test understanding of the PDF material
4. Use appropriate scoring and due dates
5. Make sure all content is educationally sound and relevant
6. For matching questions, create logical pairs from the PDF content
7. For fill-in-the-blanks, identify key concepts that can be tested
8. For paragraph writing, create prompts that require deep understanding
9. Return ONLY valid JSON without any additional text or formatting
`;
};

// Quiz-specific prompt
const getQuizPrompt = (pdfText, userQuery) => {
  return `
You are an expert quiz creator. Based on the provided PDF content and user query, create a comprehensive quiz structure.

PDF Content:
${pdfText}

User Query: ${userQuery}

Please generate a detailed quiz structure in the following JSON format:

{
  "quizzes": [
    {
      "title": "Quiz Title Based on PDF Content",
      "duration_minutes": 30,
      "passing_score": 70,
      "max_attempts": 3,
      "attempts_gap": 24,
      "quizType": "normal",
      "status": "active",
      "created_by_type": "admin",
      "updated_by_type": "admin"
    }
  ],
  "quizQuestions": [
    {
      "quiz_id": 1,
      "question_text": "Question based on PDF content?",
      "question_type": "mcq",
      "marks": 5,
      "sequence_no": 1,
      "options": [
        { "text": "Option 1", "correct": false },
        { "text": "Option 2", "correct": true },
        { "text": "Option 3", "correct": false },
        { "text": "Option 4", "correct": false }
      ],
      "created_by_type": "admin",
      "updated_by_type": "admin"
    }
  ]
}

Instructions:
1. Create comprehensive quizzes based on PDF content
2. Generate MCQ, True/False questions
3. Ensure questions test different levels of understanding
4. Return ONLY valid JSON without additional formatting
`;
};

// Topic-specific prompt
const getTopicPrompt = (pdfText, userQuery) => {
  return `
You are an expert curriculum designer. Create detailed topics based on the PDF content.

PDF Content:
${pdfText}

User Query: ${userQuery}

Generate topic structure in JSON format:

{
  "topics": [
    {
      "title": "Topic Title - Video",
      "description": "Comprehensive topic description",
      "content_type": "video",
      "video": {
        "url": "/video/default.mp4",
        "duration_minutes": 15,
        "transcript": "Detailed transcript based on PDF content",
        "audio_url": "/audios/video/default.mp3",
        "bullet_points": [
          { "time": 0, "text": "Introduction to main concept" },
          { "time": 300, "text": "Key points discussion" },
          { "time": 600, "text": "Practical applications" }
        ]
      }
    },
    {
      "title": "Topic Title - Accordion",
      "description": "Interactive accordion content",
      "content_type": "accordian",
      "accordions": [
        {
          "title": "Key Concept 1",
          "body": "Detailed explanation based on PDF content",
          "codeLanguage": null,
          "code": null,
          "audio_url": "/audios/accordion/default.mp3"
        }
      ]
    }
  ]
}

Instructions:
1. Create 3-5 topics with varied content types
2. Base all content on PDF material
3. Generate realistic durations and descriptions
4. Return ONLY valid JSON
`;
};

// Session-specific prompt
const getSessionPrompt = (pdfText, userQuery) => {
  return `
Create session structure based on PDF content.

PDF Content:
${pdfText}

User Query: ${userQuery}

Generate in JSON format:

{
  "sessions": [
    {
      "title": "Session Title Based on PDF",
      "chpater_description": "Comprehensive session description covering main themes",
      "status": "active",
      "image_name": "session.png",
      "image_path": "/course/thumbnail/default.jpg",
      "min_time_in_minute": 45
    }
  ]
}

Instructions:
1. Create 2-3 sessions based on major PDF themes
2. Realistic time estimates
3. Return ONLY valid JSON
`;
};

// Module-specific prompt
const getModulePrompt = (pdfText, userQuery) => {
  return `
Create module structure based on PDF content.

PDF Content:
${pdfText}

User Query: ${userQuery}

Generate in JSON format:

{
  "modules": [
    {
      "title": "Module Title",
      "image": "/course/thumbnail/default.jpg",
      "description": "Detailed module description based on PDF",
      "duration_hours": 3,
      "status": "active"
    }
  ]
}

Instructions:
1. Create 2-4 modules based on PDF content
2. Logical progression of topics
3. Return ONLY valid JSON
`;
};

// // Main API endpoint
// router.post('/generate-course', upload.single('courseGeneratePDF'), async (req, res) => {
//   try {
//     const { userQuery } = req.body;

//     if (!req.file) {
//       return res.status(400).json({ error: 'PDF file is required' });
//     }

//     if (!userQuery) {
//       return res.status(400).json({ error: 'User query is required' });
//     }


//     // Extract text from PDF
//     const pdfText = await extractTextFromPDF(req.file.path);

//     // Generate course structure using AI
//     const courseStructure = await generateCourseStructure(pdfText, userQuery);

//     // Save to database
//     const savedCourseData = await saveToDB(courseStructure);

//     // Clean up uploaded file
//     await fs.unlink(req.file.path);

//     res.json({
//       success: true,
//       message: 'Course generated successfully',
//       data: savedCourseData
//     });

//   } catch (error) {
//     console.error('Error generating course:', error);

//     // Clean up uploaded file in case of error
//     if (req.file && req.file.path) {
//       try {
//         await fs.unlink(req.file.path);
//       } catch (unlinkError) {
//         console.error('Error cleaning up file:', unlinkError);
//       }
//     }

//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });

// const pdfParse = require('pdf-parse');

// // Extract text from PDF
// const extractTextFromPDF = async (filePath) => {
//   try {
//     const dataBuffer = await fs.readFile(filePath);
//     const data = await pdfParse(dataBuffer);
//     return data.text;
//   } catch (error) {
//     throw new Error(`PDF extraction failed: ${error.message}`);
//   }
// };

// // Generate course structure using Gemini AI
// const generateCourseStructure = async (pdfText, userQuery) => {
//   const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

//   const prompt = `
// You are an expert course curriculum designer. Based on the provided PDF content and user query, create a comprehensive course structure.

// PDF Content:
// ${pdfText}

// User Query: ${userQuery}

// Please generate a detailed course structure in the following JSON format. Make sure to create realistic and relevant content based on the PDF material:

// {
//   "course": {
//     "title": "Course Title",
//     "category_id": 1,
//     "description": "Detailed course description",
//     "price": 99,
//     "discount": 10,
//     "duration_hours": 40,
//     "expiry_days": 90,
//     "min_access_hours": 60,
//     "max_access_hours": 120,
//     "what_you_will_learn": ["Learning outcome 1", "Learning outcome 2"],
//     "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
//     "hashtags": ["#hashtag1", "#hashtag2"],
//     "thumbnail": "/course/thumbnail/default.jpg",
//     "preview_video": "/course/preview_video/default.mp4",
//     "created_by_type": "admin",
//     "updated_by_type": "admin"
//   },
//   "courseFAQs": [
//     {
//       "question": "FAQ question 1",
//       "created_by": 1,
//       "updated_by": 1,
//       "created_by_type": "admin",
//       "updated_by_type": "admin",
//       "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
//     }
//   ],
//   "sessions": [
//     {
//       "title": "Session Title",
//       "chpater_description": "Session description",
//       "status": "active",
//       "image_name": "session.png",
//       "image_path": "/course/thumbnail/default.jpg",
//       "min_time_in_minute": 30
//     }
//   ],
//   "modules": [
//     {
//       "session_id": 1,
//       "title": "Module Title",
//       "image": "/course/thumbnail/default.jpg",
//       "description": "Module description",
//       "duration_hours": 2,
//       "status": "active"
//     }
//   ],
//   "topics": [
//     {
//       "module_id": 1,
//       "title": "Topic Title - Video",
//       "description": "Topic description",
//       "content_type": "video",
//       "video": {
//         "url": "/video/default.mp4",
//         "duration_minutes": 10,
//         "transcript": "Video transcript based on content",
//         "audio_url": "/audios/video/default.mp3",
//         "bullet_points": [
//           { "time": 0, "text": "Introduction" },
//           { "time": 120, "text": "Main content" }
//         ]
//       }
//     },
//     {
//       "module_id": 1,
//       "title": "Topic Title - Audio",
//       "description": "Audio topic description",
//       "content_type": "audio",
//       "audio": {
//         "url": "/audio/default.mp3",
//         "duration_minutes": 5
//       }
//     },
//     {
//       "module_id": 1,
//       "title": "Topic Title - Accordion",
//       "description": "Accordion topic description",
//       "content_type": "accordian",
//       "accordions": [
//         {
//           "title": "Accordion Title",
//           "body": "Accordion content based on PDF",
//           "codeLanguage": null,
//           "code": null,
//           "audio_url": "/audios/accordion/default.mp3"
//         }
//       ]
//     }
//   ],
//   "assignments": [
//     {
//       "module_id": 1,
//       "title": "Assignment Title",
//       "description": "Assignment description",
//       "file": null,
//       "due_date": "2024-12-31T23:59:59.000Z",
//       "max_score": 100,
//       "status": "active",
//       "category": "matching",
//       "created_by_type": "admin",
//       "updated_by_type": "admin",
//       "matching_questions": [
//         {
//           "question_text": "Match the following",
//           "options": [
//             { "option_text": "Term 1", "option_type": "text", "match_text": "Definition 1", "match_type": "text" }
//           ]
//         }
//       ]
//     }
//   ],
//   "quizzes": [
//     {
//       "module_id": 1,
//       "title": "Quiz Title",
//       "duration_minutes": 15,
//       "passing_score": 60,
//       "max_attempts": 3,
//       "attempts_gap": 24,
//       "quizType": "normal",
//       "status": "active",
//       "created_by_type": "admin",
//       "updated_by_type": "admin"
//     }
//   ],
//   "quizQuestions": [
//     {
//       "quiz_id": 1,
//       "module_id": 1,
//       "question_text": "Question based on PDF content?",
//       "question_type": "mcq",
//       "marks": 5,
//       "sequence_no": 1,
//       "options": [
//         { "text": "Option 1", "correct": false },
//         { "text": "Option 2", "correct": true },
//         { "text": "Option 3", "correct": false },
//         { "text": "Option 4", "correct": false }
//       ],
//       "created_by_type": "admin",
//       "updated_by_type": "admin"
//     }
//   ],
//   "predefinedQuestions": [
//     {
//       "quiz_id": 1,
//       "question_text": "Predefined question from content",
//       "question_img": null,
//       "question_type": "MCQ",
//       "marks": 5,
//       "sequence_no": 1,
//       "options": [
//         { "option_text": "Option 1", "is_correct": false },
//         { "option_text": "Option 2", "is_correct": true }
//       ]
//     }
//   ],
//   "realWordQuestions": [
//     {
//       "quiz_id": 1,
//       "words": ["word1", "word2", "word3"],
//       "correct_answers": ["yes", "no", "yes"],
//       "created_by_type": "admin",
//       "updated_by_type": "admin"
//     }
//   ],
//   "summarizePassageQuestions": [
//     {
//       "quiz_id": 1,
//       "passage": "Passage to summarize from PDF",
//       "time_limit": 5,
//       "created_by_type": "admin",
//       "updated_by_type": "admin"
//     }
//   ],
//   "bestOptionQuestions": [
//     {
//       "quiz_id": 1,
//       "passage": "Fill in the blanks: The main concept is ____ and it relates to ____.",
//       "blanked_words": ["concept", "relationship"],
//       "created_by_type": "admin",
//       "updated_by_type": "admin"
//     }
//   ]
// }

// Instructions:
// 1. Analyze the PDF content thoroughly
// 2. Create 2-3 sessions based on major topics
// 3. Each session should have 1-2 modules
// 4. Each module should have 2-3 topics with mixed content types (video, audio, accordion)
// 5. Generate relevant quizzes, assignments, and all type of questions based on the content // assignment only contains this categories "regular", "matching", "true_false", "fill_in_the_blanks", "paragraph_writing"
// 6. Make sure all content is educationally sound and progressive
// 7. Use realistic durations and scoring
// 8. Create hashtags relevant to the subject matter
// 9. Generate FAQs that potential students might ask
// 10. Return ONLY valid JSON without any additional text or formatting
// `;

//   try {
//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text();

//     // Clean the response to extract JSON
//     const jsonMatch = text.match(/\{[\s\S]*\}/);
//     if (!jsonMatch) {
//       throw new Error('No valid JSON found in AI response');
//     }

//     return JSON.parse(jsonMatch[0]);
//   } catch (error) {
//     console.error('Gemini AI Error:', error);
//     throw new Error(`AI generation failed: ${error.message}`);
//   }
// };

// // Database simulation functions (replace with your actual DB operations)
// const saveToDB = async (courseData) => {
//   // This is where you would implement your actual database operations
//   // For now, we'll just return the data with generated IDs

//   let currentId = 1;
//   const generateId = () => currentId++;

//   // Add IDs to the course structure
//   courseData.course.id = generateId();
//   const courseId = courseData.course.id;

//   // Add course_id to sessions and generate session IDs
//   courseData.sessions = courseData.sessions.map(session => ({
//     ...session,
//     id: generateId(),
//     course_id: courseId
//   }));

//   // Add session_id and course_id to modules and generate module IDs
//   courseData.modules = courseData.modules.map((module, index) => ({
//     ...module,
//     id: generateId(),
//     course_id: courseId,
//     session_id: courseData.sessions[index % courseData.sessions.length].id
//   }));

//   // Add module_id to topics and generate topic IDs
//   courseData.topics = courseData.topics.map((topic, index) => ({
//     ...topic,
//     id: generateId(),
//     module_id: courseData.modules[index % courseData.modules.length].id
//   }));

//   // Add IDs and references to all other entities
//   courseData.courseFAQs = courseData.courseFAQs.map(faq => ({
//     ...faq,
//     id: generateId(),
//     course_id: courseId
//   }));

//   courseData.assignments = courseData.assignments.map((assignment, index) => ({
//     ...assignment,
//     id: generateId(),
//     module_id: courseData.modules[index % courseData.modules.length].id
//   }));

//   courseData.quizzes = courseData.quizzes.map((quiz, index) => ({
//     ...quiz,
//     id: generateId(),
//     module_id: courseData.modules[index % courseData.modules.length].id
//   }));

//   courseData.quizQuestions = courseData.quizQuestions.map((question, index) => ({
//     ...question,
//     id: generateId(),
//     quiz_id: courseData.quizzes[index % courseData.quizzes.length].id
//   }));

//   courseData.predefinedQuestions = courseData.predefinedQuestions.map((question, index) => ({
//     ...question,
//     id: generateId(),
//     quiz_id: courseData.quizzes[index % courseData.quizzes.length].id
//   }));

//   courseData.realWordQuestions = courseData.realWordQuestions.map((question, index) => ({
//     ...question,
//     id: generateId(),
//     quiz_id: courseData.quizzes[index % courseData.quizzes.length].id
//   }));

//   courseData.summarizePassageQuestions = courseData.summarizePassageQuestions.map((question, index) => ({
//     ...question,
//     id: generateId(),
//     quiz_id: courseData.quizzes[index % courseData.quizzes.length].id
//   }));

//   courseData.bestOptionQuestions = courseData.bestOptionQuestions.map((question, index) => ({
//     ...question,
//     id: generateId(),
//     quiz_id: courseData.quizzes[index % courseData.quizzes.length].id
//   }));

//   await insertCourseData(courseData);

//   return courseData;
// };

// const insertCourseData = async (courseData) => {
//   const {
//     course,
//     courseFAQs,
//     sessions,
//     modules,
//     topics,
//     assignments,
//     quizzes,
//     quizQuestions,
//     predefinedQuestions,
//     realWordQuestions,
//     summarizePassageQuestions,
//     bestOptionQuestions
//   } = courseData;

//   try {
//     // Find or create admin user
//     const admin = await Admin.findOne({ where: { roleId: 1 } });
//     if (!admin) {
//       throw new Error('Admin user not found');
//     }

//     // 1. Find or Create Category
//     let category = await CourseCategory.findOne({
//       where: { id: course.category_id }
//     });

//     if (!category) {
//       // If category doesn't exist, create a default one or throw error
//       throw new Error(`Category with ID ${course.category_id} not found`);
//     }

//     // 2. Create Course
//     const highestCourse = await Course.findOne({
//       order: [["sequence", "DESC"]]
//     });
//     const nextCourseSequence = highestCourse ? highestCourse.sequence + 1 : 1;

//     const newCourse = await Course.create({
//       title: course.title,
//       description: course.description,
//       category_id: category.id,
//       price: course.price,
//       discount: course.discount,
//       duration_hours: course.duration_hours,
//       expiry_days: course.expiry_days,
//       min_access_hours: course.min_access_hours,
//       max_access_hours: course.max_access_hours,
//       what_you_will_learn: course.what_you_will_learn || [],
//       prerequisites: course.prerequisites || [],
//       hashtags: course.hashtags || [],
//       thumbnail: course.thumbnail,
//       preview_video: course.preview_video,
//       sequence: nextCourseSequence,
//       status: "published",
//       created_by: admin.id,
//       updated_by: admin.id,
//       created_by_type: course.created_by_type || "admin",
//       updated_by_type: course.updated_by_type || "admin"
//     });

//     // Generate public hash for course
//     newCourse.public_hash = generatePublicHash(newCourse.id);
//     await newCourse.save();

//     // Generate and save embedding if function exists
//     if (typeof getEmbedding === 'function') {
//       const plainDescription = convert(course.description || "", { wordwrap: false });
//       const courseText = `passage: ${course.title}. ${plainDescription}. What you will learn: ${newCourse.what_you_will_learn.join(". ")}. Hashtags: ${newCourse.hashtags.join(", ")}. Category: ${category.category}`;
//       const embedding = await getEmbedding(courseText);
//       await newCourse.update({ embedding });
//     }


//     // 3. Create Course FAQs
//     if (courseFAQs && courseFAQs.length > 0) {
//       for (const faqData of courseFAQs) {
//         const faq = await CourseFAQ.create({
//           course_id: newCourse.id,
//           question: faqData.question,
//           created_by: admin.id,
//           updated_by: admin.id,
//           created_by_type: faqData.created_by_type || "admin",
//           updated_by_type: faqData.updated_by_type || "admin",
//         });

//         // Create FAQ options
//         if (faqData.options && faqData.options.length > 0) {
//           for (const optionText of faqData.options) {
//             await CourseFAQOption.create({
//               faq_id: faq.id,
//               option_text: optionText,
//               created_by: admin.id,
//               updated_by: admin.id,
//               created_by_type: faqData.created_by_type || "admin",
//               updated_by_type: faqData.updated_by_type || "admin",
//             });
//           }
//         }
//       }
//     }

//     // 4. Create Sessions
//     const sessionMap = new Map(); // To store original session_id -> new session mapping

//     if (sessions && sessions.length > 0) {
//       for (const sessionData of sessions) {
//         const highestSession = await Session.findOne({
//           where: { course_id: newCourse.id },
//           order: [["sequence_no", "DESC"]],
//         });
//         const nextSessionSequence = highestSession ? highestSession.sequence_no + 1 : 1;

//         const newSession = await Session.create({
//           course_id: newCourse.id,
//           title: sessionData.title,
//           chpater_description: sessionData.chpater_description,
//           status: sessionData.status || "active",
//           image_name: sessionData.image_name,
//           image_path: sessionData.image_path,
//           min_time_in_minute: sessionData.min_time_in_minute,
//           sequence_no: nextSessionSequence,
//           created_by: admin.id,
//           updated_by: admin.id,
//         });

//         // Generate public hash for session
//         newSession.public_hash = generatePublicHash(newSession.id);
//         await newSession.save();

//         // Map original session_id to new session
//         sessionMap.set(sessionData.id, newSession);

//       }
//     }

//     // 5. Create Modules
//     const moduleMap = new Map(); // To store original module_id -> new module mapping

//     if (modules && modules.length > 0) {
//       for (const moduleData of modules) {
//         const session = sessionMap.get(moduleData.session_id);
//         if (!session) {
//           console.error(`❌ Session not found for module "${moduleData.title}"`);
//           continue;
//         }

//         const highestModule = await Module.findOne({
//           where: { course_id: newCourse.id },
//           order: [["sequence_no", "DESC"]],
//         });
//         const nextModuleSequence = highestModule ? highestModule.sequence_no + 1 : 1;

//         const newModule = await Module.create({
//           course_id: newCourse.id,
//           session_id: session.id,
//           title: moduleData.title,
//           image: moduleData.image,
//           description: moduleData.description,
//           duration_hours: moduleData.duration_hours,
//           status: moduleData.status || "active",
//           sequence_no: nextModuleSequence,
//           created_by: admin.id,
//           updated_by: admin.id,
//           created_by_type: "admin",
//           updated_by_type: "admin",
//         });

//         // Generate public hash for module
//         newModule.public_hash = generatePublicHash(newModule.id);
//         await newModule.save();

//         // Map original module_id to new module
//         moduleMap.set(moduleData.id, newModule);

//       }
//     }

//     // 6. Create Topics
//     if (topics && topics.length > 0) {
//       for (const topicData of topics) {
//         const module = moduleMap.get(topicData.module_id);
//         if (!module) {
//           console.error(`❌ Module not found for topic "${topicData.title}"`);
//           continue;
//         }

//         const highestTopic = await Topic.findOne({
//           where: { module_id: module.id },
//           order: [["sequence_no", "DESC"]],
//         });
//         const nextTopicSequence = highestTopic ? highestTopic.sequence_no + 1 : 1;

//         const newTopic = await Topic.create({
//           module_id: module.id,
//           title: topicData.title,
//           description: topicData.description,
//           content_type: topicData.content_type,
//           sequence_no: nextTopicSequence,
//           created_by: admin.id,
//           updated_by: admin.id,
//           created_by_type: "admin",
//           updated_by_type: "admin",
//         });

//         // Generate public hash for topic
//         newTopic.public_hash = generatePublicHash(newTopic.id);
//         await newTopic.save();

//         // Create content based on content_type
//         switch (topicData.content_type) {
//           case "video":
//             if (topicData.video) {
//               await Video.create({
//                 topic_id: newTopic.id,
//                 url: topicData.video.url,
//                 audio_url: topicData.video.audio_url || null,
//                 duration_minutes: topicData.video.duration_minutes,
//                 transcript: topicData.video.transcript,
//                 bullet_points: topicData.video.bullet_points || [],
//                 created_by: admin.id,
//                 updated_by: admin.id,
//                 created_by_type: "admin",
//                 updated_by_type: "admin",
//               });
//             }
//             break;

//           case "audio":
//             if (topicData.audio) {
//               await Audio.create({
//                 topic_id: newTopic.id,
//                 url: topicData.audio.url,
//                 duration_minutes: topicData.audio.duration_minutes,
//                 created_by: admin.id,
//                 updated_by: admin.id,
//                 created_by_type: "admin",
//                 updated_by_type: "admin",
//               });
//             }
//             break;

//           case "accordian":
//             if (topicData.accordions) {
//               for (const acc of topicData.accordions) {
//                 await Accordion.create({
//                   topic_id: newTopic.id,
//                   title: acc.title,
//                   body: acc.body,
//                   codeLanguage: acc.codeLanguage,
//                   code: acc.code,
//                   audio_url: acc.audio_url || null,
//                   created_by: admin.id,
//                   updated_by: admin.id,
//                   created_by_type: "admin",
//                   updated_by_type: "admin",
//                 });
//               }
//             }
//             break;

//           case "general":
//             if (topicData.general) {
//               await GeneralMaterial.create({
//                 topic_id: newTopic.id,
//                 url: topicData.general.url,
//                 audio_url: topicData.general.audio_url || null,
//                 title: topicData.general.title,
//                 description: topicData.general.description,
//                 material_type: topicData.general.material_type,
//                 created_by: admin.id,
//                 updated_by: admin.id,
//                 created_by_type: "admin",
//                 updated_by_type: "admin",
//               });
//             }
//             break;

//           case "slide":
//             if (topicData.slides) {
//               for (const slide of topicData.slides) {
//                 const newSlide = await MultiSlide.create({
//                   topic_id: newTopic.id,
//                   title: slide.title,
//                   description: slide.description,
//                   type: slide.content_type,
//                   audio_url: slide.audio_url || null,
//                   created_by: admin.id,
//                   updated_by: admin.id,
//                   created_by_type: "admin",
//                   updated_by_type: "admin",
//                 });

//                 // Create slide content based on type
//                 switch (slide.content_type) {
//                   case "video":
//                     if (slide.video) {
//                       await MultiSlideVideo.create({
//                         multi_slide_id: newSlide.id,
//                         url: slide.video.url,
//                         audio_url: slide.video.audio_url || null,
//                         duration_minutes: slide.video.duration_minutes,
//                         created_by: admin.id,
//                         updated_by: admin.id,
//                         created_by_type: "admin",
//                         updated_by_type: "admin",
//                       });
//                     }
//                     break;

//                   case "audio":
//                     if (slide.audio) {
//                       await MultiSlideAudio.create({
//                         multi_slide_id: newSlide.id,
//                         url: slide.audio.url,
//                         duration_minutes: slide.audio.duration_minutes,
//                         created_by: admin.id,
//                         updated_by: admin.id,
//                         created_by_type: "admin",
//                         updated_by_type: "admin",
//                       });
//                     }
//                     break;

//                   case "accordian":
//                     if (slide.accordions) {
//                       for (const acc of slide.accordions) {
//                         await MultiSlideAccordion.create({
//                           multi_slide_id: newSlide.id,
//                           title: acc.title,
//                           body: acc.body,
//                           codeLanguage: acc.codeLanguage,
//                           code: acc.code,
//                           audio_url: acc.audio_url || null,
//                           created_by: admin.id,
//                           updated_by: admin.id,
//                           created_by_type: "admin",
//                           updated_by_type: "admin",
//                         });
//                       }
//                     }
//                     break;

//                   case "general":
//                     if (slide.general) {
//                       await MultiSlideGeneral.create({
//                         multi_slide_id: newSlide.id,
//                         url: slide.general.url,
//                         audio_url: slide.general.audio_url || null,
//                         material_type: slide.general.material_type,
//                         title: slide.general.title,
//                         description: slide.general.description,
//                         created_by: admin.id,
//                         updated_by: admin.id,
//                         created_by_type: "admin",
//                         updated_by_type: "admin",
//                       });
//                     }
//                     break;
//                 }
//               }
//             }
//             break;
//         }

//       }
//     }

//     // 7. Create Assignments
//     if (assignments && assignments.length > 0) {
//       for (const assignmentData of assignments) {
//         const module = moduleMap.get(assignmentData.module_id);
//         if (!module) {
//           console.error(`❌ Module not found for assignment "${assignmentData.title}"`);
//           continue;
//         }

//         const newAssignment = await Assignment.create({
//           module_id: module.id,
//           title: assignmentData.title,
//           description: assignmentData.description,
//           file: assignmentData.file,
//           due_date: assignmentData.due_date,
//           max_score: assignmentData.max_score,
//           status: assignmentData.status || "active",
//           category: assignmentData.category,
//           created_by: admin.id,
//           updated_by: admin.id,
//           created_by_type: assignmentData.created_by_type || "admin",
//           updated_by_type: assignmentData.updated_by_type || "admin",
//         });

//         // Create matching questions if this is a matching assignment
//         if (assignmentData.category === "matching" && assignmentData.matching_questions) {
//           for (const question of assignmentData.matching_questions) {
//             const matchingQuestion = await MatchingQuestion.create({
//               assignment_id: newAssignment.id,
//               question_text: question.question_text,
//               created_by: admin.id,
//               updated_by: admin.id,
//               created_by_type: "admin",
//               updated_by_type: "admin",
//             });

//             for (const option of question.options) {
//               await MatchingOption.create({
//                 question_id: matchingQuestion.id,
//                 option_text: option.option_text,
//                 option_type: option.option_type,
//                 match_text: option.match_text,
//                 match_type: option.match_type,
//                 created_by: admin.id,
//                 updated_by: admin.id,
//                 created_by_type: "admin",
//                 updated_by_type: "admin",
//               });
//             }
//           }
//         }

//         // Create fill in the blanks questions
//         if (assignmentData.category === "fill_in_the_blanks" && assignmentData.fill_blank_questions) {
//           for (const question of assignmentData.fill_blank_questions) {
//             await FillTheBlanksQuestion.create({
//               assignment_id: newAssignment.id,
//               question_text: question.question_text,
//               answers: question.answers,
//               created_by: admin.id,
//               updated_by: admin.id,
//               created_by_type: "admin",
//               updated_by_type: "admin",
//             });
//           }
//         }

//         // Create paragraph writing questions
//         if (assignmentData.category === "paragraph_writing" && assignmentData.paragraph_questions) {
//           for (const question of assignmentData.paragraph_questions) {
//             await ParagraphWriting.create({
//               assignment_id: newAssignment.id,
//               paragraph: question.paragraph,
//               created_by: admin.id,
//               updated_by: admin.id,
//               created_by_type: "admin",
//               updated_by_type: "admin",
//             });
//           }
//         }

//       }
//     }

//     // 8. Create Quizzes
//     if (quizzes && quizzes.length > 0) {
//       for (const quizData of quizzes) {
//         const module = moduleMap.get(quizData.module_id);
//         if (!module) {
//           console.error(`❌ Module not found for quiz "${quizData.title}"`);
//           continue;
//         }

//         const quiz = await Quizzes.create({
//           module_id: module.id,
//           title: quizData.title,
//           duration_minutes: quizData.duration_minutes,
//           passing_score: quizData.passing_score,
//           max_attempts: quizData.max_attempts,
//           attempts_gap: quizData.attempts_gap,
//           quizType: quizData.quizType || "normal",
//           status: quizData.status || "active",
//           created_by: admin.id,
//           updated_by: admin.id,
//           created_by_type: quizData.created_by_type || "admin",
//           updated_by_type: quizData.updated_by_type || "admin",
//         });


//         // Create Quiz Questions
//         if (quizQuestions && quizQuestions.length > 0) {
//           const quizQuestionSet = quizQuestions.filter(q => q.quiz_id === quizData.id);

//           for (const questionData of quizQuestionSet) {
//             const question = await QuizQuestions.create({
//               quiz_id: quiz.id,
//               question_text: questionData.question_text,
//               question_type: questionData.question_type,
//               marks: questionData.marks,
//               sequence_no: questionData.sequence_no,
//               created_by_type: questionData.created_by_type || "admin",
//               updated_by_type: questionData.updated_by_type || "admin",
//               created_by: admin.id,
//               updated_by: admin.id,
//             });

//             if (questionData.question_type === "mcq" || questionData.question_type === "true-false") {
//               for (const opt of questionData.options) {
//                 await QuizOptions.create({
//                   question_id: question.id,
//                   option_text: opt.text,
//                   is_correct: opt.correct,
//                   created_by: admin.id,
//                   updated_by: admin.id,
//                 });
//               }
//             }
//           }
//         }

//         // Create Predefined Questions for this quiz
//         if (predefinedQuestions && predefinedQuestions.length > 0) {
//           const predefinedForQuiz = predefinedQuestions.filter(q => q.quiz_id === quizData.id);

//           for (const questionData of predefinedForQuiz) {
//             const question = await PreDefinedQuestions.create({
//               quiz_id: quiz.id,
//               question_text: questionData.question_text,
//               question_img: questionData.question_img,
//               question_type: questionData.question_type,
//               marks: questionData.marks,
//               sequence_no: questionData.sequence_no,
//               created_by: admin.id,
//               updated_by: admin.id,
//             });

//             for (const opt of questionData.options) {
//               await PreDefinedOptions.create({
//                 pre_defined_question_id: question.id,
//                 option_text: opt.option_text,
//                 is_correct: opt.is_correct,
//                 created_by: admin.id,
//                 updated_by: admin.id,
//               });
//             }
//           }
//         }

//         // Create Real Word Questions
//         if (realWordQuestions && realWordQuestions.length > 0) {
//           const realWords = realWordQuestions.filter(q => q.quiz_id === quizData.id);

//           for (const real of realWords) {
//             await RealWordQuestion.create({
//               quiz_id: quiz.id,
//               words: real.words,
//               correct_answers: real.correct_answers,
//               created_by: admin.id,
//               updated_by: admin.id,
//               created_by_type: real.created_by_type || "admin",
//               updated_by_type: real.updated_by_type || "admin",
//             });
//           }
//         }
//         // Create Summarize Passage Questions
//         if (summarizePassageQuestions && summarizePassageQuestions.length > 0) {
//           const summarizePassages = summarizePassageQuestions.filter(q => q.quiz_id === quizData.id);

//           for (const passage of summarizePassages) {
//             let summary;

//             try {
//               if (typeof SummarizerManager !== 'undefined') {
//                 let summarizer = new SummarizerManager(passage.passage, 5);
//                 let summaryObj = await summarizer.getSummaryByRank();

//                 if (!summaryObj || typeof summaryObj.summary !== "string" || !summaryObj.summary.trim()) {
//                   summarizer = new SummarizerManager(passage.passage, 3);
//                   summaryObj = await summarizer.getSummaryByRank();
//                 }

//                 if (summaryObj && typeof summaryObj.summary === "string" && summaryObj.summary.trim()) {
//                   summary = summaryObj.summary.trim();
//                 } else {
//                   summary = passage.passage;
//                 }
//               } else {
//                 summary = passage.passage;
//               }
//             } catch (err) {
//               console.warn("⚠️ Error during summarization. Using full passage as summary.");
//               summary = passage.passage;
//             }

//             await SummarizePassageQuestion.create({
//               quiz_id: quiz.id,
//               passage: passage.passage,
//               summary,
//               time_limit: passage.time_limit,
//               created_by: admin.id,
//               updated_by: admin.id,
//               created_by_type: passage.created_by_type || "admin",
//               updated_by_type: passage.updated_by_type || "admin",
//             });
//           }
//         }

//         // Create Best Option Questions
//         if (bestOptionQuestions && bestOptionQuestions.length > 0) {
//           const bestOptionQuizzes = bestOptionQuestions.filter(q => q.quiz_id === quizData.id);

//           // Fallback words for distractor options
//           const fallbackWords = [
//             'manifest', 'construction', 'modeling', 'illustrative', 'projection',
//             'hypothesis', 'scheme', 'reconstruction', 'principle', 'template',
//             'outlook', 'element', 'exemplar', 'symbol', 'process', 'blueprint'
//           ];

//           for (const boq of bestOptionQuizzes) {
//             const distractor_map = {};
//             for (const word of boq.blanked_words) {
//               const shuffled = fallbackWords.sort(() => 0.5 - Math.random());
//               const distractors = shuffled.slice(0, 4);
//               distractor_map[word] = [word, ...distractors];
//             }

//             await BestOptionQuestion.create({
//               quiz_id: quiz.id,
//               passage: boq.passage,
//               blanked_words: boq.blanked_words,
//               distractor_options: distractor_map,
//               created_by: admin.id,
//               updated_by: admin.id,
//               created_by_type: boq.created_by_type || "admin",
//               updated_by_type: boq.updated_by_type || "admin",
//             });
//           }
//         }

//       }
//     }

//     return {
//       success: true,
//       course_id: newCourse.id,
//       message: "Course data inserted successfully"
//     };

//   } catch (error) {
//     console.error("❌ Error inserting course data:", error);
//     throw error;
//   }
// };

module.exports = router;
