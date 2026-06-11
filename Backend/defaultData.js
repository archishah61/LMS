const sequelize = require("./config/db.js");
const DailyChallenge = require("./models/challenges/daily_challenges/daily_challenges.js");
const FillInTheBlanksChallenge = require("./models/challenges/daily_challenges/fill_in_the_blanks_challenges.js");
const MCQChallenge = require("./models/challenges/daily_challenges/mcq_challenge.js");
const MCQOptionChallenge = require("./models/challenges/daily_challenges/mcq_option_challenge.js");
const ChallengeCategory = require("./models/masters/challengeCategory.js");
const Challenge = require("./models/challenges/challenge_quest/challenges.js");
const ChallengePhase = require("./models/challenges/challenge_quest/challenge_phases.js");
const ChallengeTask = require("./models/challenges/challenge_quest/challenge_tasks.js");
const TrueFalseChallenge = require("./models/challenges/challenge_quest/true_false_challenges.js");
const UserDailyChallenge = require("./models/challenges/daily_challenges/user_daily_challenges.js");
const FrontendFaq = require("./models/landingpage_management/frontendFaq.js");
const FrontendStatistics = require("./models/landingpage_management/frontendStatistics.js");
const FrontendFeatures = require("./models/landingpage_management/frontendFeatures.js");
const CompanyLogo = require("./models/testimonials/CompanyLogo.js");
const Testimonial = require("./models/testimonials/Testimonial.js");
const seedLocationsFromCSV = require("./uploads/location/seedLocationsFromCSV.js");
const FeatureSettings = require("./models/aiInterview/interviewSettings.js");

const Admin = require("./models/auth/admin.js");
const User = require("./models/auth/user.js");
const UserPoints = require("./models/user_points/user_points.js");
const UserStreak = require("./models/user_streaks/user_streaks.js");
const { v4: uuidv4 } = require('uuid');
const { QueryTypes } = require('sequelize');

// Helper to insert activity logs directly (bypassing stored procedure during seeding)
async function seedUserActivityLogs(insertedUsers = []) {
    try {
        console.log('Seeding sample user activity logs...');
        // Use provided inserted users (subset) or fallback to DB query
        let users = insertedUsers && insertedUsers.length ? insertedUsers.map(u => ({ id: u.id, email: u.email, username: u.username })) : await sequelize.query('SELECT id, email, username FROM tbl_users ORDER BY id ASC LIMIT 3', { type: QueryTypes.SELECT });
        if (!users.length) {
            console.log('No users found to seed activity logs. Skipping.');
            return;
        }
        // Fetch up to 3 courses (for enrollment events)
        const courses = await sequelize.query('SELECT id, title , public_hash FROM tbl_courses ORDER BY id ASC LIMIT 3', { type: QueryTypes.SELECT });
        const now = new Date();
        const rows = [];
        const baseEvents = [
            { category: 'auth', action: 'login', title: 'User Login', meta: (u) => ({ method: 'password' }) },
            { category: 'auth', action: 'logout', title: 'User Logout', meta: () => ({ reason: 'user_initiated' }) },
            { category: 'auth', action: 'password_reset_request', title: 'Password Reset Requested', meta: () => ({ stage: 'request' }) },
            { category: 'auth', action: 'password_reset_complete', title: 'Password Reset Successful', meta: () => ({ stage: 'reset' }) },
            { category: 'auth', action: 'password_change', title: 'Password Changed', meta: () => ({ via: 'profile' }) },
            { category: 'profile', action: 'update', title: 'Profile Updated', meta: () => ({ password_changed: false }) },
            { category: 'course', action: 'enrolled', title: 'Course Enrollment', meta: (u, idx) => ({ course_title: courses[idx % courses.length]?.title || 'Sample Course' }) },
        ];
        // Failure reason samples per event_action for more realistic failure metadata
        const failureDetails = {
            login: { reason: 'invalid_credentials', message: 'Email or password incorrect' },
            logout: { reason: 'session_not_found', message: 'Session already expired' },
            password_reset_request: { reason: 'rate_limited', message: 'Too many reset attempts' },
            password_reset_complete: { reason: 'token_expired', message: 'Reset token expired' },
            password_change: { reason: 'old_password_mismatch', message: 'Current password incorrect' },
            update: { reason: 'validation_error', message: 'Invalid profile field(s)' },
            enrolled: { reason: 'duplicate_enrollment', message: 'User already enrolled' }
        };
        const DAY_MS = 24 * 60 * 60 * 1000;
        const eventsPerUser = baseEvents.length * 5; // ~5 cycles of base events => denser 15 day spread
        // Track at least one failure per action
        const failureTracker = {};
        for (const [uIndex, user] of users.entries()) {
            for (let i = 0; i < eventsPerUser; i++) {
                const ev = baseEvents[i % baseEvents.length];
                // Random offset within last 15 days (0..14d)
                const dayOffsetMs = Math.floor(Math.random() * 15 * DAY_MS);
                const intraDayMs = Math.floor(Math.random() * DAY_MS);
                let ts = new Date(now.getTime() - dayOffsetMs - intraDayMs);
                ts = new Date(ts.getTime() - (uIndex * 1500 + i * 175)); // deterministic jitter
                const course = courses.length ? courses[(uIndex + i) % courses.length] : null;
                const entityType = ev.category === 'course' ? 'course' : 'user';
                const entityId = entityType === 'course' && course ? course.id : user.id;
                const successMeta = Object.assign({ title: ev.title }, ev.meta(user, i) || {});
                if (ev.category === 'course' && course) {
                    successMeta.course_title = course.title;
                    successMeta.course_public_hash = course.public_hash;
                }
                rows.push({
                    user_id: user.id,
                    user_identifier: user.email || user.username,
                    event_category: ev.category,
                    event_action: ev.action,
                    outcome: 'success',
                    entity_type: entityType,
                    entity_id: entityId,
                    session_token: uuidv4(),
                    ip_address: '127.0.0.1',
                    user_agent: 'seed-script',
                    metadata: JSON.stringify(successMeta),
                    occurred_at: ts,
                    created_at: ts,
                    updated_at: ts
                });
                // Failure variant probability 30% OR ensure at least one failure per action
                const actionKey = ev.action;
                const shouldAddFailure = Math.random() < 0.3 || !failureTracker[actionKey];
                if (shouldAddFailure) {
                    failureTracker[actionKey] = true;
                    const failMeta = Object.assign({}, successMeta, {
                        title: successMeta.title.replace(/Successful|Changed|Requested/gi, match => {
                            if (/Successful/i.test(match)) return match.replace(/Successful/i, 'Failed');
                            if (/Changed/i.test(match)) return match.replace(/Changed/i, 'Change Failed');
                            if (/Requested/i.test(match)) return match.replace(/Requested/i, 'Request Failed');
                            return match + ' Failed';
                        }),
                        failure: true,
                        error: failureDetails[actionKey]?.reason || 'generic_failure',
                        message: failureDetails[actionKey]?.message || 'Simulated failure'
                    });
                    // shift failure a tiny bit earlier
                    const failTs = new Date(ts.getTime() - 1000);
                    rows.push({
                        user_id: user.id,
                        user_identifier: user.email || user.username,
                        event_category: ev.category,
                        event_action: ev.action,
                        outcome: 'failure',
                        entity_type: entityType,
                        entity_id: entityId,
                        session_token: uuidv4(),
                        ip_address: '127.0.0.1',
                        user_agent: 'seed-script',
                        metadata: JSON.stringify(failMeta),
                        occurred_at: failTs,
                        created_at: failTs,
                        updated_at: failTs
                    });
                }
            }
        }
        // Optional: sort so most recent appear first (not required for insert but keeps order tidy)
        rows.sort((a, b) => b.occurred_at - a.occurred_at);
        if (rows.length) {
            // Bulk insert
            const valuesSql = rows.map(r => `(${r.user_id},${sequelize.escape(r.user_identifier)},${sequelize.escape(r.event_category)},${sequelize.escape(r.event_action)},${sequelize.escape(r.outcome)},${sequelize.escape(r.entity_type)},${r.entity_id},${sequelize.escape(r.session_token)},${sequelize.escape(r.ip_address)},${sequelize.escape(r.user_agent)},${sequelize.escape(r.metadata)},${sequelize.escape(r.occurred_at)},${sequelize.escape(r.created_at)},${sequelize.escape(r.updated_at)})`).join(',');
            const insertSql = `INSERT INTO tbl_user_activity_log (user_id,user_identifier,event_category,event_action,outcome,entity_type,entity_id,session_token,ip_address,user_agent,metadata,occurred_at,created_at,updated_at) VALUES ${valuesSql}`;
            await sequelize.query(insertSql);
            console.log(`Inserted ${rows.length} activity log rows for seeding.`);
        }
    } catch (e) {
        console.error('Failed seeding user activity logs:', e.message);
    }
}

// Export seeding helper if needed elsewhere
module.exports.seedUserActivityLogs = seedUserActivityLogs;

const defaultAdmin = {
    username: "admin",
    email: "admin@example.com",
    password: "123", // This will be hashed by the beforeCreate hook
    roleId: 1
};

const defaultMobileAdmin = {
    username: "mobile",
    email: "mobile@example.com",
    password: "123", // This will be hashed by the beforeCreate hook
    roleId: 1
};

const teamMembers = [
    {
        name: "Philip Newton",
        position: "Founder & CEO",
        description: "Former education consultant with 15+ years experience transforming learning environments.",
        img: "/aboutImg/man1.jpg",
        x: "https://x.com/philipnewton",
        instagram: "https://instagram.com/philipnewton",
        facebook: "https://facebook.com/philipnewton",
        email: "philip.newton@example.com",
    },
    {
        name: "Olivia Connor",
        position: "Head of Curriculum",
        description: "Curriculum design expert specializing in interactive and accessible learning materials.",
        img: "/aboutImg/women1.jpg",
        x: "https://x.com/oliviaconnor",
        instagram: "https://instagram.com/oliviaconnor",
        facebook: "https://facebook.com/oliviaconnor",
        email: "olivia.connor@example.com",
    },
    {
        name: "Isla Joanne",
        position: "Chief Learning Officer",
        description: "EdTech innovator with a passion for creating engaging educational experiences.",
        img: "/aboutImg/women2.jpg",
        x: "https://x.com/islajoanne",
        instagram: "https://instagram.com/islajoanne",
        facebook: "https://facebook.com/islajoanne",
        email: "isla.joanne@example.com",
    },
    {
        name: "John Leavy",
        position: "Technical Director",
        description: "Technology specialist focused on creating seamless learning platforms.",
        img: "/aboutImg/man2.jpg",
        x: "https://x.com/johnleavy",
        instagram: "https://instagram.com/johnleavy",
        facebook: "https://facebook.com/johnleavy",
        email: "john.leavy@example.com",
    },
];

const defaultContacts = [
    {
        fullName: "Alice Thompson",
        email: "alice.thompson@example.com",
        subject: "Inquiry about services",
        message: "Hi, I’m interested in learning more about your educational services. Can you please send me more information?",
        isRead: false,
    },
    {
        fullName: "Brian Lee",
        email: "brian.lee@example.com",
        subject: "Partnership Opportunity",
        message: "We are looking to partner with EdTech companies. Would love to discuss opportunities with your team.",
        isRead: false,
    },
    {
        fullName: "Catherine Green",
        email: "catherine.green@example.com",
        subject: "Issue with registration",
        message: "I tried registering on your platform but encountered an error. Can someone assist me?",
        isRead: true,
    },
    {
        fullName: "Daniel Martinez",
        email: "daniel.martinez@example.com",
        subject: "Speaking Engagement",
        message: "Would you be interested in speaking at our upcoming EdTech summit next month?",
        isRead: false,
    },
    {
        fullName: "Ella Robinson",
        email: "ella.robinson@example.com",
        subject: "Feedback on platform",
        message: "Just wanted to say how impressed I am with your learning platform. Great job!",
        isRead: true,
    },
    {
        fullName: "Frank Wilson",
        email: "frank.wilson@example.com",
        subject: "Technical Support",
        message: "I'm having trouble accessing the course materials. Can you help me resolve this issue?",
        isRead: false,
    },
    {
        fullName: "Grace Harris",
        email: "grace.harris@example.com",
        subject: "Course Inquiry",
        message: "Are there any upcoming courses on data science? I would like to enroll.",
        isRead: false,
    },
    {
        fullName: "Henry Clark",
        email: "henry.clark@example.com",
        subject: "Payment Issue",
        message: "I was charged twice for the same course. Can you please look into this?",
        isRead: true,
    },
    {
        fullName: "Isabella Lewis",
        email: "isabella.lewis@example.com",
        subject: "Certificate Request",
        message: "I completed the course but haven't received my certificate. Can you send it to me?",
        isRead: false,
    },
    {
        fullName: "Jack Walker",
        email: "jack.walker@example.com",
        subject: "General Inquiry",
        message: "What are the prerequisites for the advanced programming course?",
        isRead: false,
    },
    {
        fullName: "Katherine Hall",
        email: "katherine.hall@example.com",
        subject: "Feedback",
        message: "The mobile app is very user-friendly. Great work on the design!",
        isRead: true,
    },
    {
        fullName: "Liam Young",
        email: "liam.young@example.com",
        subject: "Collaboration Proposal",
        message: "We would like to collaborate on a new project. Can we schedule a meeting?",
        isRead: false,
    },
    {
        fullName: "Mia King",
        email: "mia.king@example.com",
        subject: "Technical Issue",
        message: "The video lectures are not loading properly. Can you fix this issue?",
        isRead: false,
    },
    {
        fullName: "Nathan Scott",
        email: "nathan.scott@example.com",
        subject: "Course Suggestion",
        message: "Do you offer any courses on digital marketing?",
        isRead: true,
    },
    {
        fullName: "Olivia Adams",
        email: "olivia.adams@example.com",
        subject: "Account Issue",
        message: "I can't log in to my account. Can you reset my password?",
        isRead: false,
    },
    {
        fullName: "Patrick Turner",
        email: "patrick.turner@example.com",
        subject: "Event Participation",
        message: "I would like to participate in the upcoming webinar. How can I register?",
        isRead: false,
    },
    {
        fullName: "Quinn Baker",
        email: "quinn.baker@example.com",
        subject: "Content Request",
        message: "Can you provide additional resources for the machine learning course?",
        isRead: true,
    },
    {
        fullName: "Rachel Carter",
        email: "rachel.carter@example.com",
        subject: "Feedback on Instructor",
        message: "The instructor for the photography course was very knowledgeable and helpful.",
        isRead: false,
    },
    {
        fullName: "Samuel Mitchell",
        email: "samuel.mitchell@example.com",
        subject: "Course Cancellation",
        message: "I need to cancel my enrollment in the graphic design course. What is the process?",
        isRead: false,
    },
    {
        fullName: "Tara Phillips",
        email: "tara.phillips@example.com",
        subject: "Technical Support",
        message: "The quiz module is not working correctly. Can you assist me with this?",
        isRead: true,
    },
    {
        fullName: "Victor Evans",
        email: "victor.evans@example.com",
        subject: "Inquiry about Certification",
        message: "Is the certification recognized internationally?",
        isRead: false,
    },
    {
        fullName: "Wendy Turner",
        email: "wendy.turner@example.com",
        subject: "Feedback on Course Material",
        message: "The course material for the history class was very comprehensive and well-organized.",
        isRead: false,
    },
    {
        fullName: "Xavier Morris",
        email: "xavier.morris@example.com",
        subject: "Request for Extension",
        message: "I need an extension for the assignment submission. Is it possible?",
        isRead: true,
    },
    {
        fullName: "Yvonne Wright",
        email: "yvonne.wright@example.com",
        subject: "Inquiry about Scholarships",
        message: "Are there any scholarships available for the online courses?",
        isRead: false,
    },
    {
        fullName: "Zachary Hill",
        email: "zachary.hill@example.com",
        subject: "Feedback on User Interface",
        message: "The user interface of the platform is very intuitive and easy to navigate.",
        isRead: false,
    },
    {
        fullName: "Abigail Cooper",
        email: "abigail.cooper@example.com",
        subject: "Technical Issue with Payment",
        message: "I encountered an error while making a payment. Can you help me resolve it?",
        isRead: true,
    },
    {
        fullName: "Benjamin Foster",
        email: "benjamin.foster@example.com",
        subject: "Course Recommendation",
        message: "Can you recommend a course on project management?",
        isRead: false,
    },
    {
        fullName: "Chloe Ward",
        email: "chloe.ward@example.com",
        subject: "Feedback on Customer Support",
        message: "The customer support team was very responsive and helpful.",
        isRead: false,
    },
    {
        fullName: "David Morris",
        email: "david.morris@example.com",
        subject: "Inquiry about Group Discounts",
        message: "Do you offer any group discounts for corporate training?",
        isRead: true,
    },
    {
        fullName: "Emily Russell",
        email: "emily.russell@example.com",
        subject: "Request for Course Outline",
        message: "Can you send me the course outline for the business analytics program?",
        isRead: false,
    },
    {
        fullName: "Alexander Adams",
        email: "alexander.adams@example.com",
        subject: "Inquiry about Course Duration",
        message: "How long does the certification course in digital marketing take to complete?",
        isRead: false,
    },
    {
        fullName: "Bethany Cox",
        email: "bethany.cox@example.com",
        subject: "Feedback on Course Content",
        message: "The content of the course was very relevant and up-to-date.",
        isRead: true,
    },
    {
        fullName: "Christopher Ward",
        email: "christopher.ward@example.com",
        subject: "Technical Issue with Account",
        message: "I'm unable to update my profile information. Can you assist me?",
        isRead: false,
    },
    {
        fullName: "Diana Murphy",
        email: "diana.murphy@example.com",
        subject: "Inquiry about Course Fees",
        message: "What are the fees for the advanced programming course?",
        isRead: false,
    },
    {
        fullName: "Ethan Hughes",
        email: "ethan.hughes@example.com",
        subject: "Request for Additional Resources",
        message: "Can you provide more study materials for the upcoming exam?",
        isRead: true,
    },
    {
        fullName: "Fiona Bailey",
        email: "fiona.bailey@example.com",
        subject: "Feedback on Course Structure",
        message: "The structure of the course was well-planned and easy to follow.",
        isRead: false,
    },
    {
        fullName: "George Parker",
        email: "george.parker@example.com",
        subject: "Inquiry about Course Schedule",
        message: "When does the next batch for the data science course start?",
        isRead: false,
    },
    {
        fullName: "Hannah Bell",
        email: "hannah.bell@example.com",
        subject: "Technical Support for Mobile App",
        message: "The mobile app crashes frequently. Can you look into this issue?",
        isRead: true,
    },
    {
        fullName: "Ian Wood",
        email: "ian.wood@example.com",
        subject: "Inquiry about Refund Policy",
        message: "What is your refund policy for course cancellations?",
        isRead: false,
    },
    {
        fullName: "Julia Bennett",
        email: "julia.bennett@example.com",
        subject: "Feedback on Course Instructor",
        message: "The instructor was very engaging and made the course enjoyable.",
        isRead: false,
    },
    {
        fullName: "Kevin Price",
        email: "kevin.price@example.com",
        subject: "Request for Course Completion Certificate",
        message: "I have completed the course. Can you send me the completion certificate?",
        isRead: true,
    },
    {
        fullName: "Laura Griffin",
        email: "laura.griffin@example.com",
        subject: "Inquiry about Course Prerequisites",
        message: "What are the prerequisites for enrolling in the advanced coding course?",
        isRead: false,
    },
    {
        fullName: "Michael Kelly",
        email: "michael.kelly@example.com",
        subject: "Technical Issue with Course Access",
        message: "I'm unable to access the course materials. Can you help me?",
        isRead: false,
    },
    {
        fullName: "Natalie Simpson",
        email: "natalie.simpson@example.com",
        subject: "Feedback on Course Platform",
        message: "The platform is very user-friendly and easy to navigate.",
        isRead: true,
    },
    {
        fullName: "Oscar Marshall",
        email: "oscar.marshall@example.com",
        subject: "Inquiry about Course Enrollment",
        message: "How can I enroll in the upcoming batch for the digital marketing course?",
        isRead: false,
    },
    {
        fullName: "Paige Watson",
        email: "paige.watson@example.com",
        subject: "Request for Course Extension",
        message: "I need an extension for my course deadline. Is it possible?",
        isRead: false,
    },
    {
        fullName: "Quentin Bryant",
        email: "quentin.bryant@example.com",
        subject: "Feedback on Course Content Quality",
        message: "The quality of the course content was excellent and very informative.",
        isRead: true,
    },
    {
        fullName: "Rebecca Sanders",
        email: "rebecca.sanders@example.com",
        subject: "Technical Issue with Payment Gateway",
        message: "I'm having trouble with the payment gateway. Can you assist me?",
        isRead: false,
    },
    {
        fullName: "Steven James",
        email: "steven.james@example.com",
        subject: "Inquiry about Course Certification",
        message: "Is the certification provided after course completion accredited?",
        isRead: false,
    },
    {
        fullName: "Tina Foster",
        email: "tina.foster@example.com",
        subject: "Feedback on Course Support Team",
        message: "The support team was very helpful and resolved my issues quickly.",
        isRead: true,
    },
    {
        fullName: "Umar Patel",
        email: "umar.patel@example.com",
        subject: "Request for Course Details",
        message: "Can you provide more details about the course curriculum?",
        isRead: false,
    },
    {
        fullName: "Vanessa Cole",
        email: "vanessa.cole@example.com",
        subject: "Inquiry about Course Duration",
        message: "How long is the duration of the online certification course?",
        isRead: false,
    },
    {
        fullName: "Walter Reed",
        email: "walter.reed@example.com",
        subject: "Technical Issue with Course Videos",
        message: "The course videos are buffering constantly. Can you fix this issue?",
        isRead: true,
    },
    {
        fullName: "Xena Gibbs",
        email: "xena.gibbs@example.com",
        subject: "Feedback on Course Community",
        message: "The community forum for the course was very active and helpful.",
        isRead: false,
    },
    {
        fullName: "Yasmin Shaw",
        email: "yasmin.shaw@example.com",
        subject: "Inquiry about Course Fees and Payment Plans",
        message: "Are there any installment payment plans available for the course fees?",
        isRead: false,
    },
    {
        fullName: "Zane Hart",
        email: "zane.hart@example.com",
        subject: "Request for Course Completion Confirmation",
        message: "Can you confirm that I have completed all the course requirements?",
        isRead: true,
    },
    {
        fullName: "Amber Clark",
        email: "amber.clark@example.com",
        subject: "Inquiry about Course Instructor",
        message: "Who is the instructor for the upcoming batch of the digital marketing course?",
        isRead: false,
    },
    {
        fullName: "Bradley Foster",
        email: "bradley.foster@example.com",
        subject: "Feedback on Course Material Quality",
        message: "The quality of the course material was top-notch and very detailed.",
        isRead: false,
    },
    {
        fullName: "Candice Reynolds",
        email: "candice.reynolds@example.com",
        subject: "Technical Issue with Course Login",
        message: "I'm unable to log in to the course platform. Can you help me?",
        isRead: true,
    },
    {
        fullName: "Derek Morgan",
        email: "derek.morgan@example.com",
        subject: "Inquiry about Course Schedule Flexibility",
        message: "Is there any flexibility in the course schedule for working professionals?",
        isRead: false,
    },
    {
        fullName: "Erica Long",
        email: "erica.long@example.com",
        subject: "Request for Additional Course Resources",
        message: "Can you provide more resources for the advanced modules of the course?",
        isRead: false,
    },
    {
        fullName: "Felix Carter",
        email: "felix.carter@example.com",
        subject: "Feedback on Course Platform Usability",
        message: "The platform was very easy to use and navigate through the course content.",
        isRead: true,
    }
];

const defaultPartnerIsActive = [
    {
        isActive: "Active"
    },
];

const defaultFrontendStatistics = [
    {
        icon: "/assets/numbers_1.png",
        value: "50,000+",
        label: "Students Enrolled",
        description: "Learners from around the world",
    },
    {
        icon: "/assets/numbers_2.png",
        value: "200+",
        label: "Courses Available",
        description: "Across various disciplines",
    },
    {
        icon: "/assets/numbers_3.png",
        value: "100+",
        label: "Expert Partners",
        description: "Industry professionals",
    },
    {
        icon: "/assets/numbers_4.png",
        value: "15,000+",
        label: "Hours of Content",
        description: "High-quality learning material",
    }
];

const defaultFrontendFeatures = [
    {
        icon: '/assets/experience_icon1.png',
        title: 'Industry-Led instruction',
        description: 'Gain knowledge from experienced professionals bringing practical, real-world insights into lessons.',
        bgColor: 'bg-experience1'
    },
    {
        icon: '/assets/experience_icon2.png',
        title: 'Cost-Effective Learning',
        description: 'Access premium-quality education at competitive pricing, ensuring value without compromising quality.',
        bgColor: 'bg-experience2'
    },
    {
        icon: '/assets/experience_icon4.png',
        title: 'Flexible Learning Experience',
        description: 'Learn at your own pace with a platform designed to support flexible schedules and independent progress.',
        bgColor: 'bg-experience3'
    },
    {
        icon: '/assets/experience_icon3.png',
        title: 'Guided Skill Development',
        description: 'Follow well-defined learning paths that build skills from foundational concepts to advanced levels.',
        bgColor: 'bg-experience4'
    }
];

const defaultFrontendFAQs = [
    {
        question: "How do I get started with the platform?",
        answer: "Getting started is easy! Simply create an account, browse our course catalog, and enroll in any course that interests you. You can begin learning immediately after enrollment.",
        is_active: true,
        sequence_no: 1,
        created_by: 1,
        updated_by: 1
    },
    {
        question: "Are the courses self-paced or scheduled?",
        answer: "All our courses are self-paced, allowing you to learn on your own schedule. You can access the course materials at any time and progress through the lessons at a pace that works for you.",
        is_active: true,
        sequence_no: 2,
        created_by: 1,
        updated_by: 1
    },
    {
        question: "What is the refund policy?",
        answer: "We offer a 30-day money-back guarantee for all our paid courses. If you're not satisfied with your purchase, you can request a full refund within 30 days of enrollment.",
        is_active: true,
        sequence_no: 3,
        created_by: 1,
        updated_by: 1
    },
    {
        question: "Can i access the courses on mobile devices?",
        answer: "Our platform is fully responsive and works on all devices, including smartphones and tablets. You can learn on the go with our mobile-friendly interface.",
        is_active: true,
        sequence_no: 4,
        created_by: 1,
        updated_by: 1
    },
    {
        question: "How long do i have access to a course after purchase?",
        answer: "Access duration varies by course. Each course comes with its own expiry period, which is clearly mentioned on the course page. Be sure to check the course details before enrolling.",
        is_active: true,
        sequence_no: 5,
        created_by: 1,
        updated_by: 1
    }
];

const defaultCompanyLogos = [
    {
        name: "Queekies",
        logo_url: "/testimonials/logos/queekies_placeholder.png",
        status: "active",
        created_by: 1,
        updated_by: 1
    },
    {
        name: "Queekies",
        logo_url: "/testimonials/logos/dreamlms_placeholder.png",
        status: "active",
        created_by: 1,
        updated_by: 1
    }
];

const defaultTestimonials = [
    {
        author_name: "Aarav Mehta",
        author_role: "Web Development Student at Queekies",
        testimonial_text: "Queekies offers an engaging and accessible learning experience. The lessons are practical and easy to follow. Each module focuses on real-world applications. It has helped me significantly improve my web development skills.",
        company_name: "Queekies",
        status: "active",
        rating: 5,
        author_image: "/testimonials/authors/placeholder.png",
        created_by: 1,
        updated_by: 1
    },
    {
        author_name: "Sanvi Shah",
        author_role: "Software Engineering Student at Queekies",
        testimonial_text: "Queekies transformed programming from intimidating to understandable through structured lessons and projects.",
        company_name: "Queekies",
        status: "active",
        rating: 5,
        author_image: "/testimonials/authors/placeholder.png",
        created_by: 1,
        updated_by: 1
    },
    {
        author_name: "Rahul Sharma",
        author_role: "Cybersecurity Student at Queekies",
        testimonial_text: "Switching to a cybersecurity career initially felt challenging. Queekies provided clear guidance through structured courses. The learning path was easy to follow and well organized. Supportive mentors helped clarify complex concepts. Each lesson focused on practical, real-world applications.",
        company_name: "Queekies",
        status: "active",
        rating: 5,
        author_image: "/testimonials/authors/placeholder.png",
        created_by: 1,
        updated_by: 1
    },
    {
        author_name: "Priya Nair",
        author_role: "Data Science Student at Queekies",
        testimonial_text: "Balancing a full time job and learning was challenging, but Queekies gave me the flexibility I needed. I loved the hands-on data science projects!",
        company_name: "Queekies",
        status: "active",
        rating: 5,
        author_image: "/testimonials/authors/placeholder.png",
        created_by: 1,
        updated_by: 1
    },
    {
        author_name: "Neha Gupta",
        author_role: "UI/UX Design Student at Queekies",
        testimonial_text: "The learning experience at Queekies feels personalized and engaging. The feedback I received helped me improve with every project. Community support made the learning journey more collaborative. UI/UX concepts were explained clearly and practically. Each lesson boosted my confidence in design fundamentals.",
        company_name: "Queekies",
        status: "active",
        rating: 5,
        author_image: "/testimonials/authors/placeholder.png",
        created_by: 1,
        updated_by: 1
    },
    {
        author_name: "Shrikant Patel",
        author_role: "iOS Development Student at Queekies",
        testimonial_text: "Queekies made iOS development easy to understand with structured lessons and hands-on app projects.",
        company_name: "Queekies",
        status: "active",
        rating: 5,
        author_image: "/testimonials/authors/placeholder.png",
        created_by: 1,
        updated_by: 1
    }
];

const defaultFeatureSettings = [
    {
        limit: 3,
        type: "math_solver",
        is_active: true,
        created_by: 1,
        created_by_type: 'admin'
    },
    {
        limit: 3,
        type: "interview",
        is_active: true,
        created_by: 1,
        created_by_type: 'admin'
    },
    {
        limit: 3,
        type: "course_generation",
        is_active: true,
        created_by: 1,
        created_by_type: 'admin'
    },
    {
        limit: 3,
        type: "learning_path",
        is_active: true,
        created_by: 1,
        created_by_type: 'admin'
    },
];

const defaultUsers = [
    {
        full_name: "John Doe",
        username: "johndoe",
        email: "john@example.com",
        password: "123",
        profile_image: null,
        mobile_no: "1234567890",
        location: "New York",
        country_id: 1,
        state_id: 1,
        city_id: 1
    },
    {
        full_name: "demo",
        username: "demo123",
        email: "demo123@example.com",
        password: "123",
        profile_image: null,
        mobile_no: "9876543210",
        location: "London",
        country_id: 1,
        state_id: 1,
        city_id: 1
    },
    {
        full_name: "Alex Johnson",
        username: "alexj",
        email: "alex@example.com",
        password: "123",
        profile_image: null,
        mobile_no: "5551234567",
        location: "Chicago",
        country_id: 1,
        state_id: 1,
        city_id: 1
    },
    {
        full_name: "Sarah Williams",
        username: "sarahw",
        email: "sarah@example.com",
        password: "123",
        profile_image: null,
        mobile_no: "4445556666",
        location: "Los Angeles",
        country_id: 1,
        state_id: 1,
        city_id: 1
    },
    {
        full_name: "Michael Brown",
        username: "michaelb",
        email: "michael@example.com",
        password: "123",
        profile_image: null,
        mobile_no: "7778889999",
        location: "Houston",
        country_id: 1,
        state_id: 1,
        city_id: 1
    },
    {
        full_name: "Emily Davis",
        username: "emilyd",
        email: "emily@example.com",
        password: "123",
        profile_image: null,
        mobile_no: "2223334444",
        location: "Miami",
        country_id: 1,
        state_id: 1,
        city_id: 1
    },
    {
        full_name: "David Wilson",
        username: "davidw",
        email: "david@example.com",
        password: "123",
        profile_image: null,
        mobile_no: "6667778888",
        location: "Seattle",
        country_id: 1,
        state_id: 1,
        city_id: 1
    },
    {
        full_name: "Olivia Martinez",
        username: "oliviam",
        email: "olivia@example.com",
        password: "123",
        profile_image: null,
        mobile_no: "1112223333",
        location: "San Francisco",
        country_id: 1,
        state_id: 1,
        city_id: 1
    },
    {
        full_name: "William Taylor",
        username: "willt",
        email: "william@example.com",
        password: "123",
        profile_image: null,
        mobile_no: "9998887777",
        location: "Boston",
        country_id: 1,
        state_id: 1,
        city_id: 1
    },
    {
        full_name: "Sophia Anderson",
        username: "sophiaa",
        email: "sophia@example.com",
        password: "123",
        profile_image: null,
        mobile_no: "1231231234",
        location: "Denver",
        country_id: 1,
        state_id: 1,
        city_id: 1
    },
    {
        full_name: "James Moore",
        username: "jamesm",
        email: "james@example.com",
        password: "123",
        profile_image: null,
        mobile_no: "3213214321",
        location: "Phoenix",
        country_id: 1,
        state_id: 1,
        city_id: 1
    },
    {
        full_name: "Ava Thomas",
        username: "avat",
        email: "ava@example.com",
        password: "123",
        profile_image: null,
        mobile_no: "4564567890",
        location: "Philadelphia",
        country_id: 1,
        state_id: 1,
        city_id: 1
    },
    {
        full_name: "Benjamin Jackson",
        username: "benj",
        email: "benjamin@example.com",
        password: "123",
        profile_image: null,
        mobile_no: "7897891234",
        location: "Atlanta",
        country_id: 1,
        state_id: 1,
        city_id: 1
    },
    {
        full_name: "Mia White",
        username: "miaw",
        email: "mia@example.com",
        password: "123",
        profile_image: null,
        mobile_no: "1472583690",
        location: "Austin",
        country_id: 1,
        state_id: 1,
        city_id: 1
    },
    {
        full_name: "Daniel Harris",
        username: "danielh",
        email: "daniel@example.com",
        password: "123",
        profile_image: null,
        mobile_no: "9638527410",
        location: "Dallas",
        country_id: 1,
        state_id: 1,
        city_id: 1
    },
    {
        full_name: "Charlotte Lewis",
        username: "charlottel",
        email: "charlotte@example.com",
        password: "123",
        profile_image: null,
        mobile_no: "8527419630",
        location: "Orlando",
        country_id: 1,
        state_id: 1,
        city_id: 1
    },
    {
        full_name: "Logan Clark",
        username: "loganc",
        email: "logan@example.com",
        password: "123",
        profile_image: null,
        mobile_no: "7418529630",
        location: "San Diego",
        country_id: 1,
        state_id: 1,
        city_id: 1
    }
];


const challengesData = [
    {
        "title": "Basic Mathematics",
        "description": "Test your fundamental math skills",
        "category": "Maths",
        "difficulty_level": "Beginner",
        "max_attempt": 3,
        "is_per_question_reward": true,
        "per_question_reward": 10,
        "start_date": "2023-06-01",
        "fillInTheBlanks": [
            {
                "text": "The sum of 5 and 7 is __.",
                "answers": ["12"]
            },
            {
                "text": "A triangle has __ sides.",
                "answers": ["3", "three"]
            },
            {
                "text": "The square root of 16 is __.",
                "answers": ["4", "four"]
            },
            {
                "text": "In the equation 2x = 10, x equals __.",
                "answers": ["5", "five"]
            },
            {
                "text": "The area of a rectangle is length __ width.",
                "answers": ["times", "×", "multiplied by"]
            }
        ],
        "mcqs": [
            {
                "question_text": "What is 8 × 9?",
                "options": [
                    { "option_text": "72", "option_type": "text", "is_correct": true },
                    { "option_text": "64", "option_type": "text", "is_correct": false },
                    { "option_text": "81", "option_type": "text", "is_correct": false },
                    { "option_text": "56", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which of these is a prime number?",
                "options": [
                    { "option_text": "15", "option_type": "text", "is_correct": false },
                    { "option_text": "23", "option_type": "text", "is_correct": true },
                    { "option_text": "28", "option_type": "text", "is_correct": false },
                    { "option_text": "32", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What is the value of π (pi) to two decimal places?",
                "options": [
                    { "option_text": "3.14", "option_type": "text", "is_correct": true },
                    { "option_text": "3.16", "option_type": "text", "is_correct": false },
                    { "option_text": "3.41", "option_type": "text", "is_correct": false },
                    { "option_text": "3.00", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which shape has all sides equal?",
                "options": [
                    { "option_text": "Rectangle", "option_type": "text", "is_correct": false },
                    { "option_text": "Square", "option_type": "text", "is_correct": true },
                    { "option_text": "Trapezoid", "option_type": "text", "is_correct": false },
                    { "option_text": "Parallelogram", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What is 3/4 expressed as a percentage?",
                "options": [
                    { "option_text": "25%", "option_type": "text", "is_correct": false },
                    { "option_text": "50%", "option_type": "text", "is_correct": false },
                    { "option_text": "75%", "option_type": "text", "is_correct": true },
                    { "option_text": "100%", "option_type": "text", "is_correct": false }
                ]
            }
        ]
    },
    {
        "title": "World Geography",
        "description": "Test your knowledge of world geography",
        "category": "History",
        "difficulty_level": "Intermediate",
        "max_attempt": 3,
        "is_per_question_reward": false,
        "points_reward": 100,
        "start_date": "2023-06-02",
        "fillInTheBlanks": [
            {
                "text": "The capital of France is __.",
                "answers": ["Paris"]
            },
            {
                "text": "The longest river in the world is the __.",
                "answers": ["Nile"]
            },
            {
                "text": "Mount Everest is located in the __ mountain range.",
                "answers": ["Himalayas", "Himalaya"]
            },
            {
                "text": "The largest ocean on Earth is the __ Ocean.",
                "answers": ["Pacific"]
            },
            {
                "text": "The Sahara is the largest __ in the world.",
                "answers": ["desert"]
            }
        ],
        "mcqs": [
            {
                "question_text": "Which country has the largest population?",
                "options": [
                    { "option_text": "India", "option_type": "text", "is_correct": false },
                    { "option_text": "China", "option_type": "text", "is_correct": true },
                    { "option_text": "USA", "option_type": "text", "is_correct": false },
                    { "option_text": "Brazil", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What is the capital of Australia?",
                "options": [
                    { "option_text": "Sydney", "option_type": "text", "is_correct": false },
                    { "option_text": "Melbourne", "option_type": "text", "is_correct": false },
                    { "option_text": "Canberra", "option_type": "text", "is_correct": true },
                    { "option_text": "Perth", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which continent is the largest by area?",
                "options": [
                    { "option_text": "Africa", "option_type": "text", "is_correct": false },
                    { "option_text": "Asia", "option_type": "text", "is_correct": true },
                    { "option_text": "North America", "option_type": "text", "is_correct": false },
                    { "option_text": "Europe", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "The Amazon rainforest is primarily located in which country?",
                "options": [
                    { "option_text": "Colombia", "option_type": "text", "is_correct": false },
                    { "option_text": "Brazil", "option_type": "text", "is_correct": true },
                    { "option_text": "Peru", "option_type": "text", "is_correct": false },
                    { "option_text": "Venezuela", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which of these is not a Scandinavian country?",
                "options": [
                    { "option_text": "Norway", "option_type": "text", "is_correct": false },
                    { "option_text": "Sweden", "option_type": "text", "is_correct": false },
                    { "option_text": "Finland", "option_type": "text", "is_correct": false },
                    { "option_text": "Iceland", "option_type": "text", "is_correct": true }
                ]
            }
        ]
    },
    {
        "title": "Computer Science Basics",
        "description": "Test your fundamental computer science knowledge",
        "category": "Coding",
        "difficulty_level": "Beginner",
        "max_attempt": 3,
        "is_per_question_reward": true,
        "per_question_reward": 15,
        "start_date": "2023-06-03",
        "fillInTheBlanks": [
            {
                "text": "HTML stands for __ Markup Language.",
                "answers": ["HyperText"]
            },
            {
                "text": "The brain of a computer is called the __.",
                "answers": ["CPU", "processor"]
            },
            {
                "text": "RAM stands for __ Access Memory.",
                "answers": ["Random"]
            },
            {
                "text": "In programming, 'if' is an example of a __ statement.",
                "answers": ["conditional"]
            },
            {
                "text": "The __ loop continues until a condition becomes false.",
                "answers": ["while"]
            }
        ],
        "mcqs": [
            {
                "question_text": "Which language is known as the 'mother of all languages'?",
                "options": [
                    { "option_text": "Python", "option_type": "text", "is_correct": false },
                    { "option_text": "C", "option_type": "text", "is_correct": true },
                    { "option_text": "Java", "option_type": "text", "is_correct": false },
                    { "option_text": "Assembly", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What does IDE stand for?",
                "options": [
                    { "option_text": "Integrated Development Environment", "option_type": "text", "is_correct": true },
                    { "option_text": "Internal Data Engine", "option_type": "text", "is_correct": false },
                    { "option_text": "Internet Development Entity", "option_type": "text", "is_correct": false },
                    { "option_text": "Interactive Design Element", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which data structure uses FIFO?",
                "options": [
                    { "option_text": "Stack", "option_type": "text", "is_correct": false },
                    { "option_text": "Queue", "option_type": "text", "is_correct": true },
                    { "option_text": "Array", "option_type": "text", "is_correct": false },
                    { "option_text": "Tree", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What does SQL stand for?",
                "options": [
                    { "option_text": "Structured Query Language", "option_type": "text", "is_correct": true },
                    { "option_text": "Simple Question Logic", "option_type": "text", "is_correct": false },
                    { "option_text": "System Query Language", "option_type": "text", "is_correct": false },
                    { "option_text": "Standard Question Line", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which is not a programming paradigm?",
                "options": [
                    { "option_text": "Object-oriented", "option_type": "text", "is_correct": false },
                    { "option_text": "Functional", "option_type": "text", "is_correct": false },
                    { "option_text": "Procedural", "option_type": "text", "is_correct": false },
                    { "option_text": "Hypothetical", "option_type": "text", "is_correct": true }
                ]
            }
        ]
    },
    {
        "title": "English Grammar",
        "description": "Test your knowledge of English grammar rules",
        "category": "English",
        "difficulty_level": "Beginner",
        "max_attempt": 3,
        "is_per_question_reward": false,
        "points_reward": 120,
        "start_date": "2023-06-04",
        "fillInTheBlanks": [
            {
                "text": "The comparative form of 'good' is __.",
                "answers": ["better"]
            },
            {
                "text": "A person, place or thing is called a __.",
                "answers": ["noun"]
            },
            {
                "text": "The past tense of 'go' is __.",
                "answers": ["went"]
            },
            {
                "text": "'Quickly' is an example of an __.",
                "answers": ["adverb"]
            },
            {
                "text": "The __ marks indicate direct speech.",
                "answers": ["quotation", "speech"]
            }
        ],
        "mcqs": [
            {
                "question_text": "Which sentence is correct?",
                "options": [
                    { "option_text": "She don't like apples.", "option_type": "text", "is_correct": false },
                    { "option_text": "She doesn't likes apples.", "option_type": "text", "is_correct": false },
                    { "option_text": "She doesn't like apples.", "option_type": "text", "is_correct": true },
                    { "option_text": "She not like apples.", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What is the plural of 'child'?",
                "options": [
                    { "option_text": "Childs", "option_type": "text", "is_correct": false },
                    { "option_text": "Children", "option_type": "text", "is_correct": true },
                    { "option_text": "Childes", "option_type": "text", "is_correct": false },
                    { "option_text": "Childen", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which word is a preposition?",
                "options": [
                    { "option_text": "Beautiful", "option_type": "text", "is_correct": false },
                    { "option_text": "Under", "option_type": "text", "is_correct": true },
                    { "option_text": "Running", "option_type": "text", "is_correct": false },
                    { "option_text": "Quickly", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What type of word is 'and'?",
                "options": [
                    { "option_text": "Conjunction", "option_type": "text", "is_correct": true },
                    { "option_text": "Adjective", "option_type": "text", "is_correct": false },
                    { "option_text": "Adverb", "option_type": "text", "is_correct": false },
                    { "option_text": "Preposition", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which sentence is in passive voice?",
                "options": [
                    { "option_text": "The cat chased the mouse.", "option_type": "text", "is_correct": false },
                    { "option_text": "The mouse was chased by the cat.", "option_type": "text", "is_correct": true },
                    { "option_text": "Chasing the mouse, the cat pounced.", "option_type": "text", "is_correct": false },
                    { "option_text": "The cat and mouse ran.", "option_type": "text", "is_correct": false }
                ]
            }
        ]
    },
    {
        "title": "Human Anatomy",
        "description": "Test your knowledge of the human body",
        "category": "Science",
        "difficulty_level": "Intermediate",
        "max_attempt": 3,
        "is_per_question_reward": true,
        "per_question_reward": 20,
        "start_date": "2023-06-05",
        "fillInTheBlanks": [
            {
                "text": "The largest organ in the human body is the __.",
                "answers": ["skin"]
            },
            {
                "text": "Blood is pumped by the __.",
                "answers": ["heart"]
            },
            {
                "text": "The bone in the thigh is called the __.",
                "answers": ["femur"]
            },
            {
                "text": "The __ system protects the body against disease.",
                "answers": ["immune"]
            },
            {
                "text": "Oxygen is exchanged for carbon dioxide in the __.",
                "answers": ["lungs"]
            }
        ],
        "mcqs": [
            {
                "question_text": "How many bones are in the adult human body?",
                "options": [
                    { "option_text": "206", "option_type": "text", "is_correct": true },
                    { "option_text": "150", "option_type": "text", "is_correct": false },
                    { "option_text": "300", "option_type": "text", "is_correct": false },
                    { "option_text": "180", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which organ produces insulin?",
                "options": [
                    { "option_text": "Liver", "option_type": "text", "is_correct": false },
                    { "option_text": "Pancreas", "option_type": "text", "is_correct": true },
                    { "option_text": "Kidney", "option_type": "text", "is_correct": false },
                    { "option_text": "Stomach", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What is the largest part of the human brain?",
                "options": [
                    { "option_text": "Cerebellum", "option_type": "text", "is_correct": false },
                    { "option_text": "Brainstem", "option_type": "text", "is_correct": false },
                    { "option_text": "Cerebrum", "option_type": "text", "is_correct": true },
                    { "option_text": "Medulla", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which blood type is the universal donor?",
                "options": [
                    { "option_text": "A", "option_type": "text", "is_correct": false },
                    { "option_text": "B", "option_type": "text", "is_correct": false },
                    { "option_text": "AB", "option_type": "text", "is_correct": false },
                    { "option_text": "O", "option_type": "text", "is_correct": true }
                ]
            },
            {
                "question_text": "What is the smallest bone in the human body?",
                "options": [
                    { "option_text": "Femur", "option_type": "text", "is_correct": false },
                    { "option_text": "Stapes", "option_type": "text", "is_correct": true },
                    { "option_text": "Tibia", "option_type": "text", "is_correct": false },
                    { "option_text": "Radius", "option_type": "text", "is_correct": false }
                ]
            }
        ]
    },
    {
        "title": "World History",
        "description": "Test your knowledge of important historical events",
        "category": "History",
        "difficulty_level": "Intermediate",
        "max_attempt": 3,
        "is_per_question_reward": false,
        "points_reward": 150,
        "start_date": "2023-06-06",
        "fillInTheBlanks": [
            {
                "text": "World War I began in the year __.",
                "answers": ["1914"]
            },
            {
                "text": "The __ Wall fell in 1989.",
                "answers": ["Berlin"]
            },
            {
                "text": "The ancient Egyptian writing system is called __.",
                "answers": ["hieroglyphics"]
            },
            {
                "text": "The Industrial Revolution began in __.",
                "answers": ["Britain", "England"]
            },
            {
                "text": "The Declaration of Independence was signed in __.",
                "answers": ["1776"]
            }
        ],
        "mcqs": [
            {
                "question_text": "Who was the first president of the United States?",
                "options": [
                    { "option_text": "Thomas Jefferson", "option_type": "text", "is_correct": false },
                    { "option_text": "George Washington", "option_type": "text", "is_correct": true },
                    { "option_text": "Abraham Lincoln", "option_type": "text", "is_correct": false },
                    { "option_text": "John Adams", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which ancient civilization built the pyramids?",
                "options": [
                    { "option_text": "Greeks", "option_type": "text", "is_correct": false },
                    { "option_text": "Romans", "option_type": "text", "is_correct": false },
                    { "option_text": "Egyptians", "option_type": "text", "is_correct": true },
                    { "option_text": "Mayans", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "The Renaissance began in which country?",
                "options": [
                    { "option_text": "France", "option_type": "text", "is_correct": false },
                    { "option_text": "Germany", "option_type": "text", "is_correct": false },
                    { "option_text": "Italy", "option_type": "text", "is_correct": true },
                    { "option_text": "Spain", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Who discovered penicillin?",
                "options": [
                    { "option_text": "Marie Curie", "option_type": "text", "is_correct": false },
                    { "option_text": "Alexander Fleming", "option_type": "text", "is_correct": true },
                    { "option_text": "Louis Pasteur", "option_type": "text", "is_correct": false },
                    { "option_text": "Isaac Newton", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "The Magna Carta was signed in which century?",
                "options": [
                    { "option_text": "11th", "option_type": "text", "is_correct": false },
                    { "option_text": "12th", "option_type": "text", "is_correct": false },
                    { "option_text": "13th", "option_type": "text", "is_correct": true },
                    { "option_text": "14th", "option_type": "text", "is_correct": false }
                ]
            }
        ]
    },
    {
        "title": "Physics Fundamentals",
        "description": "Test your basic physics knowledge",
        "category": "Science",
        "difficulty_level": "Advanced",
        "max_attempt": 3,
        "is_per_question_reward": true,
        "per_question_reward": 25,
        "start_date": "2023-06-07",
        "fillInTheBlanks": [
            {
                "text": "The SI unit of force is the __.",
                "answers": ["newton"]
            },
            {
                "text": "Acceleration due to gravity is approximately __ m/s².",
                "answers": ["9.8"]
            },
            {
                "text": "Energy cannot be created or destroyed is the law of __ of energy.",
                "answers": ["conservation"]
            },
            {
                "text": "The tendency of an object to resist changes in motion is called __.",
                "answers": ["inertia"]
            },
            {
                "text": "The splitting of light into its component colors is called __.",
                "answers": ["dispersion"]
            }
        ],
        "mcqs": [
            {
                "question_text": "Who formulated the laws of motion?",
                "options": [
                    { "option_text": "Albert Einstein", "option_type": "text", "is_correct": false },
                    { "option_text": "Isaac Newton", "option_type": "text", "is_correct": true },
                    { "option_text": "Galileo Galilei", "option_type": "text", "is_correct": false },
                    { "option_text": "Nikola Tesla", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What is the unit of electrical resistance?",
                "options": [
                    { "option_text": "Volt", "option_type": "text", "is_correct": false },
                    { "option_text": "Ampere", "option_type": "text", "is_correct": false },
                    { "option_text": "Ohm", "option_type": "text", "is_correct": true },
                    { "option_text": "Watt", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which color has the longest wavelength?",
                "options": [
                    { "option_text": "Violet", "option_type": "text", "is_correct": false },
                    { "option_text": "Blue", "option_type": "text", "is_correct": false },
                    { "option_text": "Red", "option_type": "text", "is_correct": true },
                    { "option_text": "Green", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What does E=mc² represent?",
                "options": [
                    { "option_text": "Newton's Second Law", "option_type": "text", "is_correct": false },
                    { "option_text": "Theory of Relativity", "option_type": "text", "is_correct": true },
                    { "option_text": "Law of Gravitation", "option_type": "text", "is_correct": false },
                    { "option_text": "Quantum Theory", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which of these is not a fundamental force?",
                "options": [
                    { "option_text": "Gravity", "option_type": "text", "is_correct": false },
                    { "option_text": "Electromagnetism", "option_type": "text", "is_correct": false },
                    { "option_text": "Strong Nuclear", "option_type": "text", "is_correct": false },
                    { "option_text": "Centrifugal", "option_type": "text", "is_correct": true }
                ]
            }
        ]
    },
    {
        "title": "Famous Literature",
        "description": "Test your knowledge of classic literature",
        "category": "English",
        "difficulty_level": "Intermediate",
        "max_attempt": 3,
        "is_per_question_reward": false,
        "points_reward": 180,
        "start_date": "2023-06-08",
        "fillInTheBlanks": [
            {
                "text": "Shakespeare wrote __ and Juliet.",
                "answers": ["Romeo"]
            },
            {
                "text": "Moby Dick is a great white __.",
                "answers": ["whale"]
            },
            {
                "text": "The author of 1984 is George __.",
                "answers": ["Orwell"]
            },
            {
                "text": "The Lord of the Rings was written by J.R.R. __.",
                "answers": ["Tolkien"]
            },
            {
                "text": "Jane Austen wrote Pride and __.",
                "answers": ["Prejudice"]
            }
        ],
        "mcqs": [
            {
                "question_text": "Who wrote 'To Kill a Mockingbird'?",
                "options": [
                    { "option_text": "Harper Lee", "option_type": "text", "is_correct": true },
                    { "option_text": "Mark Twain", "option_type": "text", "is_correct": false },
                    { "option_text": "John Steinbeck", "option_type": "text", "is_correct": false },
                    { "option_text": "F. Scott Fitzgerald", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which is not a Shakespeare play?",
                "options": [
                    { "option_text": "Macbeth", "option_type": "text", "is_correct": false },
                    { "option_text": "Hamlet", "option_type": "text", "is_correct": false },
                    { "option_text": "The Tempest", "option_type": "text", "is_correct": false },
                    { "option_text": "Wuthering Heights", "option_type": "text", "is_correct": true }
                ]
            },
            {
                "question_text": "What is the sequel to 'Alice's Adventures in Wonderland'?",
                "options": [
                    { "option_text": "Through the Looking-Glass", "option_type": "text", "is_correct": true },
                    { "option_text": "Alice Returns", "option_type": "text", "is_correct": false },
                    { "option_text": "Wonderland Revisited", "option_type": "text", "is_correct": false },
                    { "option_text": "The Mad Hatter's Tea Party", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Who wrote 'The Great Gatsby'?",
                "options": [
                    { "option_text": "Ernest Hemingway", "option_type": "text", "is_correct": false },
                    { "option_text": "F. Scott Fitzgerald", "option_type": "text", "is_correct": true },
                    { "option_text": "William Faulkner", "option_type": "text", "is_correct": false },
                    { "option_text": "John Dos Passos", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which dystopian novel features 'Big Brother'?",
                "options": [
                    { "option_text": "Brave New World", "option_type": "text", "is_correct": false },
                    { "option_text": "Fahrenheit 451", "option_type": "text", "is_correct": false },
                    { "option_text": "1984", "option_type": "text", "is_correct": true },
                    { "option_text": "The Handmaid's Tale", "option_type": "text", "is_correct": false }
                ]
            }
        ]
    },
    {
        "title": "Environmental Science",
        "description": "Test your knowledge of environmental issues",
        "category": "Science",
        "difficulty_level": "Intermediate",
        "max_attempt": 3,
        "is_per_question_reward": true,
        "per_question_reward": 20,
        "start_date": "2023-06-09",
        "fillInTheBlanks": [
            {
                "text": "The process by which plants make food is called __.",
                "answers": ["photosynthesis"]
            },
            {
                "text": "The __ effect is causing global temperatures to rise.",
                "answers": ["greenhouse"]
            },
            {
                "text": "The three R's of waste management are Reduce, Reuse, and __.",
                "answers": ["Recycle"]
            },
            {
                "text": "__ energy comes from the sun.",
                "answers": ["Solar"]
            },
            {
                "text": "The __ layer protects Earth from harmful UV radiation.",
                "answers": ["ozone"]
            }
        ],
        "mcqs": [
            {
                "question_text": "Which gas is primarily responsible for global warming?",
                "options": [
                    { "option_text": "Oxygen", "option_type": "text", "is_correct": false },
                    { "option_text": "Nitrogen", "option_type": "text", "is_correct": false },
                    { "option_text": "Carbon dioxide", "option_type": "text", "is_correct": true },
                    { "option_text": "Helium", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What percentage of Earth's water is freshwater?",
                "options": [
                    { "option_text": "10%", "option_type": "text", "is_correct": false },
                    { "option_text": "3%", "option_type": "text", "is_correct": true },
                    { "option_text": "25%", "option_type": "text", "is_correct": false },
                    { "option_text": "50%", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which is a renewable energy source?",
                "options": [
                    { "option_text": "Coal", "option_type": "text", "is_correct": false },
                    { "option_text": "Natural gas", "option_type": "text", "is_correct": false },
                    { "option_text": "Wind", "option_type": "text", "is_correct": true },
                    { "option_text": "Nuclear", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What is the main cause of ocean acidification?",
                "options": [
                    { "option_text": "Plastic pollution", "option_type": "text", "is_correct": false },
                    { "option_text": "Increased CO2 absorption", "option_type": "text", "is_correct": true },
                    { "option_text": "Oil spills", "option_type": "text", "is_correct": false },
                    { "option_text": "Overfishing", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which ecosystem has the highest biodiversity?",
                "options": [
                    { "option_text": "Desert", "option_type": "text", "is_correct": false },
                    { "option_text": "Tundra", "option_type": "text", "is_correct": false },
                    { "option_text": "Tropical rainforest", "option_type": "text", "is_correct": true },
                    { "option_text": "Grassland", "option_type": "text", "is_correct": false }
                ]
            }
        ]
    },
    {
        "title": "Space Exploration",
        "description": "Test your knowledge of astronomy and space travel",
        "category": "Science",
        "difficulty_level": "Advanced",
        "max_attempt": 3,
        "is_per_question_reward": false,
        "points_reward": 200,
        "start_date": "2023-06-10",
        "fillInTheBlanks": [
            {
                "text": "The first man on the moon was Neil __.",
                "answers": ["Armstrong"]
            },
            {
                "text": "Our solar system is located in the __ galaxy.",
                "answers": ["Milky Way"]
            },
            {
                "text": "The __ is the closest star to Earth.",
                "answers": ["Sun"]
            },
            {
                "text": "The red planet is __.",
                "answers": ["Mars"]
            },
            {
                "text": "A light-year measures __.",
                "answers": ["distance", "how far light travels in a year"]
            }
        ],
        "mcqs": [
            {
                "question_text": "Which planet has the most moons?",
                "options": [
                    { "option_text": "Earth", "option_type": "text", "is_correct": false },
                    { "option_text": "Jupiter", "option_type": "text", "is_correct": false },
                    { "option_text": "Saturn", "option_type": "text", "is_correct": true },
                    { "option_text": "Mars", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What year did the first human go to space?",
                "options": [
                    { "option_text": "1957", "option_type": "text", "is_correct": false },
                    { "option_text": "1961", "option_type": "text", "is_correct": true },
                    { "option_text": "1969", "option_type": "text", "is_correct": false },
                    { "option_text": "1975", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which is not a type of galaxy?",
                "options": [
                    { "option_text": "Spiral", "option_type": "text", "is_correct": false },
                    { "option_text": "Elliptical", "option_type": "text", "is_correct": false },
                    { "option_text": "Irregular", "option_type": "text", "is_correct": false },
                    { "option_text": "Triangular", "option_type": "text", "is_correct": true }
                ]
            },
            {
                "question_text": "What is the largest planet in our solar system?",
                "options": [
                    { "option_text": "Earth", "option_type": "text", "is_correct": false },
                    { "option_text": "Saturn", "option_type": "text", "is_correct": false },
                    { "option_text": "Jupiter", "option_type": "text", "is_correct": true },
                    { "option_text": "Neptune", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which spacecraft has left our solar system?",
                "options": [
                    { "option_text": "Voyager 1", "option_type": "text", "is_correct": true },
                    { "option_text": "Hubble Telescope", "option_type": "text", "is_correct": false },
                    { "option_text": "International Space Station", "option_type": "text", "is_correct": false },
                    { "option_text": "Mars Rover", "option_type": "text", "is_correct": false }
                ]
            }
        ]
    },
    {
        "title": "JavaScript Fundamentals",
        "description": "Test your basic JavaScript knowledge",
        "category": "Coding",
        "difficulty_level": "Beginner",
        "max_attempt": 3,
        "is_per_question_reward": true,
        "per_question_reward": 15,
        "start_date": "2023-06-11",
        "fillInTheBlanks": [
            {
                "text": "To declare a constant in JavaScript, use the __ keyword.",
                "answers": ["const"]
            },
            {
                "text": "The === operator checks for __ equality.",
                "answers": ["strict", "value and type"]
            },
            {
                "text": "JavaScript is a __-side programming language.",
                "answers": ["client", "server", "both"]
            },
            {
                "text": "The method to print to console is console.__().",
                "answers": ["log"]
            },
            {
                "text": "An __ is a collection of key-value pairs.",
                "answers": ["object"]
            }
        ],
        "mcqs": [
            {
                "question_text": "Which is not a JavaScript data type?",
                "options": [
                    { "option_text": "number", "option_type": "text", "is_correct": false },
                    { "option_text": "boolean", "option_type": "text", "is_correct": false },
                    { "option_text": "character", "option_type": "text", "is_correct": true },
                    { "option_text": "undefined", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What does DOM stand for?",
                "options": [
                    { "option_text": "Data Object Model", "option_type": "text", "is_correct": false },
                    { "option_text": "Document Object Model", "option_type": "text", "is_correct": true },
                    { "option_text": "Digital Output Module", "option_type": "text", "is_correct": false },
                    { "option_text": "Display Order Management", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which loop is guaranteed to execute at least once?",
                "options": [
                    { "option_text": "for", "option_type": "text", "is_correct": false },
                    { "option_text": "while", "option_type": "text", "is_correct": false },
                    { "option_text": "do...while", "option_type": "text", "is_correct": true },
                    { "option_text": "forEach", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What will typeof null return?",
                "options": [
                    { "option_text": "null", "option_type": "text", "is_correct": false },
                    { "option_text": "undefined", "option_type": "text", "is_correct": false },
                    { "option_text": "object", "option_type": "text", "is_correct": true },
                    { "option_text": "number", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which method adds to the end of an array?",
                "options": [
                    { "option_text": "push()", "option_type": "text", "is_correct": true },
                    { "option_text": "pop()", "option_type": "text", "is_correct": false },
                    { "option_text": "shift()", "option_type": "text", "is_correct": false },
                    { "option_text": "unshift()", "option_type": "text", "is_correct": false }
                ]
            }
        ]
    },
    {
        "title": "Algebra Basics",
        "description": "Test your fundamental algebra skills",
        "category": "Maths",
        "difficulty_level": "Beginner",
        "max_attempt": 3,
        "is_per_question_reward": false,
        "points_reward": 100,
        "start_date": "2023-06-12",
        "fillInTheBlanks": [
            {
                "text": "In the equation 3x + 5 = 20, x equals __.",
                "answers": ["5"]
            },
            {
                "text": "The slope-intercept form is y = __ + b.",
                "answers": ["mx"]
            },
            {
                "text": "(x + y)² = x² + 2xy + __.",
                "answers": ["y²", "y squared"]
            },
            {
                "text": "The solution to 2x - 4 = 10 is x = __.",
                "answers": ["7"]
            },
            {
                "text": "The __ of a line measures its steepness.",
                "answers": ["slope"]
            }
        ],
        "mcqs": [
            {
                "question_text": "What is the degree of a linear equation?",
                "options": [
                    { "option_text": "0", "option_type": "text", "is_correct": false },
                    { "option_text": "1", "option_type": "text", "is_correct": true },
                    { "option_text": "2", "option_type": "text", "is_correct": false },
                    { "option_text": "3", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which is not an algebraic expression?",
                "options": [
                    { "option_text": "2x + 3", "option_type": "text", "is_correct": false },
                    { "option_text": "5y - 7", "option_type": "text", "is_correct": false },
                    { "option_text": "4 + 8", "option_type": "text", "is_correct": true },
                    { "option_text": "3a + b", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What is the solution to x² = 16?",
                "options": [
                    { "option_text": "4", "option_type": "text", "is_correct": false },
                    { "option_text": "-4", "option_type": "text", "is_correct": false },
                    { "option_text": "±4", "option_type": "text", "is_correct": true },
                    { "option_text": "8", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which property is demonstrated by a(b + c) = ab + ac?",
                "options": [
                    { "option_text": "Commutative", "option_type": "text", "is_correct": false },
                    { "option_text": "Associative", "option_type": "text", "is_correct": false },
                    { "option_text": "Distributive", "option_type": "text", "is_correct": true },
                    { "option_text": "Identity", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What is the y-intercept in y = 2x + 3?",
                "options": [
                    { "option_text": "2", "option_type": "text", "is_correct": false },
                    { "option_text": "3", "option_type": "text", "is_correct": true },
                    { "option_text": "0", "option_type": "text", "is_correct": false },
                    { "option_text": "-3", "option_type": "text", "is_correct": false }
                ]
            }
        ]
    },
    {
        "title": "Chemistry Basics",
        "description": "Test your fundamental chemistry knowledge",
        "category": "Science",
        "difficulty_level": "Beginner",
        "max_attempt": 3,
        "is_per_question_reward": true,
        "per_question_reward": 15,
        "start_date": "2023-06-13",
        "fillInTheBlanks": [
            {
                "text": "The chemical symbol for gold is __.",
                "answers": ["Au"]
            },
            {
                "text": "Water is a __ of hydrogen and oxygen.",
                "answers": ["compound"]
            },
            {
                "text": "The pH of a neutral solution is __.",
                "answers": ["7"]
            },
            {
                "text": "CO₂ is the chemical formula for __.",
                "answers": ["carbon dioxide"]
            },
            {
                "text": "The atomic number equals the number of __ in an atom.",
                "answers": ["protons"]
            }
        ],
        "mcqs": [
            {
                "question_text": "Which is not a state of matter?",
                "options": [
                    { "option_text": "Solid", "option_type": "text", "is_correct": false },
                    { "option_text": "Liquid", "option_type": "text", "is_correct": false },
                    { "option_text": "Gas", "option_type": "text", "is_correct": false },
                    { "option_text": "Energy", "option_type": "text", "is_correct": true }
                ]
            },
            {
                "question_text": "What is the lightest element?",
                "options": [
                    { "option_text": "Helium", "option_type": "text", "is_correct": false },
                    { "option_text": "Hydrogen", "option_type": "text", "is_correct": true },
                    { "option_text": "Oxygen", "option_type": "text", "is_correct": false },
                    { "option_text": "Carbon", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which subatomic particle has a negative charge?",
                "options": [
                    { "option_text": "Proton", "option_type": "text", "is_correct": false },
                    { "option_text": "Neutron", "option_type": "text", "is_correct": false },
                    { "option_text": "Electron", "option_type": "text", "is_correct": true },
                    { "option_text": "Nucleus", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What does NaCl represent?",
                "options": [
                    { "option_text": "Water", "option_type": "text", "is_correct": false },
                    { "option_text": "Carbon dioxide", "option_type": "text", "is_correct": false },
                    { "option_text": "Table salt", "option_type": "text", "is_correct": true },
                    { "option_text": "Sugar", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which process turns liquid to gas?",
                "options": [
                    { "option_text": "Condensation", "option_type": "text", "is_correct": false },
                    { "option_text": "Evaporation", "option_type": "text", "is_correct": true },
                    { "option_text": "Freezing", "option_type": "text", "is_correct": false },
                    { "option_text": "Sublimation", "option_type": "text", "is_correct": false }
                ]
            }
        ]
    },
    {
        "title": "Python Programming",
        "description": "Test your Python coding skills",
        "category": "Coding",
        "difficulty_level": "Intermediate",
        "max_attempt": 3,
        "is_per_question_reward": false,
        "points_reward": 150,
        "start_date": "2023-06-14",
        "fillInTheBlanks": [
            {
                "text": "Python lists are __ (mutable/immutable).",
                "answers": ["mutable"]
            },
            {
                "text": "The __ function returns the length of an object.",
                "answers": ["len"]
            },
            {
                "text": "In Python, __ are used to define code blocks.",
                "answers": ["indentations"]
            },
            {
                "text": "The __ method adds an item to the end of a list.",
                "answers": ["append"]
            },
            {
                "text": "True and False are __ values in Python.",
                "answers": ["boolean"]
            }
        ],
        "mcqs": [
            {
                "question_text": "Which is used for single-line comments in Python?",
                "options": [
                    { "option_text": "//", "option_type": "text", "is_correct": false },
                    { "option_text": "#", "option_type": "text", "is_correct": true },
                    { "option_text": "--", "option_type": "text", "is_correct": false },
                    { "option_text": "/* */", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What does the 'range(3)' function generate?",
                "options": [
                    { "option_text": "[0, 1, 2]", "option_type": "text", "is_correct": true },
                    { "option_text": "[1, 2, 3]", "option_type": "text", "is_correct": false },
                    { "option_text": "[3, 2, 1]", "option_type": "text", "is_correct": false },
                    { "option_text": "[0, 1, 2, 3]", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which module is used for mathematical operations?",
                "options": [
                    { "option_text": "math", "option_type": "text", "is_correct": true },
                    { "option_text": "calc", "option_type": "text", "is_correct": false },
                    { "option_text": "numpy", "option_type": "text", "is_correct": false },
                    { "option_text": "random", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "How do you start a class definition?",
                "options": [
                    { "option_text": "def", "option_type": "text", "is_correct": false },
                    { "option_text": "class", "option_type": "text", "is_correct": true },
                    { "option_text": "new", "option_type": "text", "is_correct": false },
                    { "option_text": "struct", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which is not a Python data structure?",
                "options": [
                    { "option_text": "List", "option_type": "text", "is_correct": false },
                    { "option_text": "Tuple", "option_type": "text", "is_correct": false },
                    { "option_text": "Array", "option_type": "text", "is_correct": true },
                    { "option_text": "Dictionary", "option_type": "text", "is_correct": false }
                ]
            }
        ]
    },
    {
        "title": "Geometry Fundamentals",
        "description": "Test your basic geometry knowledge",
        "category": "Maths",
        "difficulty_level": "Beginner",
        "max_attempt": 3,
        "is_per_question_reward": true,
        "per_question_reward": 12,
        "start_date": "2023-06-15",
        "fillInTheBlanks": [
            {
                "text": "A triangle with all sides equal is called __.",
                "answers": ["equilateral"]
            },
            {
                "text": "The perimeter of a circle is called its __.",
                "answers": ["circumference"]
            },
            {
                "text": "A __ angle measures exactly 90 degrees.",
                "answers": ["right"]
            },
            {
                "text": "The area of a rectangle is length __ width.",
                "answers": ["times", "×", "multiplied by"]
            },
            {
                "text": "A __ has six faces, all squares.",
                "answers": ["cube"]
            }
        ],
        "mcqs": [
            {
                "question_text": "How many degrees in a triangle?",
                "options": [
                    { "option_text": "90", "option_type": "text", "is_correct": false },
                    { "option_text": "180", "option_type": "text", "is_correct": true },
                    { "option_text": "270", "option_type": "text", "is_correct": false },
                    { "option_text": "360", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What is π (pi) approximately equal to?",
                "options": [
                    { "option_text": "2.14", "option_type": "text", "is_correct": false },
                    { "option_text": "3.14", "option_type": "text", "is_correct": true },
                    { "option_text": "4.14", "option_type": "text", "is_correct": false },
                    { "option_text": "1.14", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which shape has only one pair of parallel sides?",
                "options": [
                    { "option_text": "Square", "option_type": "text", "is_correct": false },
                    { "option_text": "Rectangle", "option_type": "text", "is_correct": false },
                    { "option_text": "Trapezoid", "option_type": "text", "is_correct": true },
                    { "option_text": "Rhombus", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What is the volume of a cube with side length 3?",
                "options": [
                    { "option_text": "9", "option_type": "text", "is_correct": false },
                    { "option_text": "18", "option_type": "text", "is_correct": false },
                    { "option_text": "27", "option_type": "text", "is_correct": true },
                    { "option_text": "36", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "How many sides does a pentagon have?",
                "options": [
                    { "option_text": "4", "option_type": "text", "is_correct": false },
                    { "option_text": "5", "option_type": "text", "is_correct": true },
                    { "option_text": "6", "option_type": "text", "is_correct": false },
                    { "option_text": "7", "option_type": "text", "is_correct": false }
                ]
            }
        ]
    },
    {
        "title": "American History",
        "description": "Test your knowledge of US history",
        "category": "History",
        "difficulty_level": "Intermediate",
        "max_attempt": 3,
        "is_per_question_reward": false,
        "points_reward": 140,
        "start_date": "2023-06-16",
        "fillInTheBlanks": [
            {
                "text": "The first US president was George __.",
                "answers": ["Washington"]
            },
            {
                "text": "The __ War was fought between the North and South.",
                "answers": ["Civil"]
            },
            {
                "text": "The Declaration of Independence was adopted in __.",
                "answers": ["1776"]
            },
            {
                "text": "The US purchased the __ Territory from France in 1803.",
                "answers": ["Louisiana"]
            },
            {
                "text": "The 19th Amendment granted women the right to __.",
                "answers": ["vote"]
            }
        ],
        "mcqs": [
            {
                "question_text": "Which event caused the US to enter WWII?",
                "options": [
                    { "option_text": "D-Day", "option_type": "text", "is_correct": false },
                    { "option_text": "Pearl Harbor", "option_type": "text", "is_correct": true },
                    { "option_text": "Battle of Midway", "option_type": "text", "is_correct": false },
                    { "option_text": "Dunkirk", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Who gave the 'I Have a Dream' speech?",
                "options": [
                    { "option_text": "Malcolm X", "option_type": "text", "is_correct": false },
                    { "option_text": "Martin Luther King Jr.", "option_type": "text", "is_correct": true },
                    { "option_text": "Rosa Parks", "option_type": "text", "is_correct": false },
                    { "option_text": "Frederick Douglass", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which president authorized the Louisiana Purchase?",
                "options": [
                    { "option_text": "George Washington", "option_type": "text", "is_correct": false },
                    { "option_text": "Thomas Jefferson", "option_type": "text", "is_correct": true },
                    { "option_text": "John Adams", "option_type": "text", "is_correct": false },
                    { "option_text": "James Madison", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "The Boston Tea Party protested taxes from which country?",
                "options": [
                    { "option_text": "France", "option_type": "text", "is_correct": false },
                    { "option_text": "Spain", "option_type": "text", "is_correct": false },
                    { "option_text": "Britain", "option_type": "text", "is_correct": true },
                    { "option_text": "Netherlands", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which amendment abolished slavery?",
                "options": [
                    { "option_text": "13th", "option_type": "text", "is_correct": true },
                    { "option_text": "14th", "option_type": "text", "is_correct": false },
                    { "option_text": "15th", "option_type": "text", "is_correct": false },
                    { "option_text": "19th", "option_type": "text", "is_correct": false }
                ]
            }
        ]
    },
    {
        "title": "Biology Essentials",
        "description": "Test your fundamental biology knowledge",
        "category": "Science",
        "difficulty_level": "Beginner",
        "max_attempt": 3,
        "is_per_question_reward": true,
        "per_question_reward": 15,
        "start_date": "2023-06-17",
        "fillInTheBlanks": [
            {
                "text": "The basic unit of life is the __.",
                "answers": ["cell"]
            },
            {
                "text": "Photosynthesis occurs in the __ of plant cells.",
                "answers": ["chloroplasts"]
            },
            {
                "text": "Humans have __ pairs of chromosomes.",
                "answers": ["23"]
            },
            {
                "text": "The process of cell division is called __.",
                "answers": ["mitosis"]
            },
            {
                "text": "DNA stands for __ acid.",
                "answers": ["deoxyribonucleic"]
            }
        ],
        "mcqs": [
            {
                "question_text": "Which organelle is the powerhouse of the cell?",
                "options": [
                    { "option_text": "Nucleus", "option_type": "text", "is_correct": false },
                    { "option_text": "Mitochondria", "option_type": "text", "is_correct": true },
                    { "option_text": "Ribosome", "option_type": "text", "is_correct": false },
                    { "option_text": "Golgi apparatus", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which is not a type of blood cell?",
                "options": [
                    { "option_text": "Erythrocyte", "option_type": "text", "is_correct": false },
                    { "option_text": "Leukocyte", "option_type": "text", "is_correct": false },
                    { "option_text": "Thrombocyte", "option_type": "text", "is_correct": false },
                    { "option_text": "Neurocyte", "option_type": "text", "is_correct": true }
                ]
            },
            {
                "question_text": "What is the main function of red blood cells?",
                "options": [
                    { "option_text": "Fight infection", "option_type": "text", "is_correct": false },
                    { "option_text": "Transport oxygen", "option_type": "text", "is_correct": true },
                    { "option_text": "Produce antibodies", "option_type": "text", "is_correct": false },
                    { "option_text": "Form clots", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which kingdom do mushrooms belong to?",
                "options": [
                    { "option_text": "Plantae", "option_type": "text", "is_correct": false },
                    { "option_text": "Animalia", "option_type": "text", "is_correct": false },
                    { "option_text": "Fungi", "option_type": "text", "is_correct": true },
                    { "option_text": "Protista", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What is the study of heredity called?",
                "options": [
                    { "option_text": "Ecology", "option_type": "text", "is_correct": false },
                    { "option_text": "Genetics", "option_type": "text", "is_correct": true },
                    { "option_text": "Taxonomy", "option_type": "text", "is_correct": false },
                    { "option_text": "Physiology", "option_type": "text", "is_correct": false }
                ]
            }
        ]
    },
    {
        "title": "SQL Queries",
        "description": "Test your database querying skills",
        "category": "Coding",
        "difficulty_level": "Intermediate",
        "max_attempt": 3,
        "is_per_question_reward": false,
        "points_reward": 160,
        "start_date": "2023-06-18",
        "fillInTheBlanks": [
            {
                "text": "The __ clause filters groups in SQL.",
                "answers": ["HAVING"]
            },
            {
                "text": "To remove duplicates in results, use __.",
                "answers": ["DISTINCT"]
            },
            {
                "text": "The __ join returns all rows when there is a match in either table.",
                "answers": ["FULL OUTER"]
            },
            {
                "text": "To sort results, use the __ BY clause.",
                "answers": ["ORDER"]
            },
            {
                "text": "The __ constraint prevents NULL values in a column.",
                "answers": ["NOT NULL"]
            }
        ],
        "mcqs": [
            {
                "question_text": "Which SQL statement retrieves data?",
                "options": [
                    { "option_text": "INSERT", "option_type": "text", "is_correct": false },
                    { "option_text": "SELECT", "option_type": "text", "is_correct": true },
                    { "option_text": "UPDATE", "option_type": "text", "is_correct": false },
                    { "option_text": "DELETE", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which function counts rows?",
                "options": [
                    { "option_text": "SUM()", "option_type": "text", "is_correct": false },
                    { "option_text": "AVG()", "option_type": "text", "is_correct": false },
                    { "option_text": "COUNT()", "option_type": "text", "is_correct": true },
                    { "option_text": "MAX()", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which is not a SQL constraint?",
                "options": [
                    { "option_text": "PRIMARY KEY", "option_type": "text", "is_correct": false },
                    { "option_text": "FOREIGN KEY", "option_type": "text", "is_correct": false },
                    { "option_text": "UNIQUE", "option_type": "text", "is_correct": false },
                    { "option_text": "SECURE", "option_type": "text", "is_correct": true }
                ]
            },
            {
                "question_text": "What does ACID stand for in databases?",
                "options": [
                    { "option_text": "Atomicity, Consistency, Isolation, Durability", "option_type": "text", "is_correct": true },
                    { "option_text": "Accuracy, Completeness, Integrity, Durability", "option_type": "text", "is_correct": false },
                    { "option_text": "Atomicity, Completeness, Isolation, Durability", "option_type": "text", "is_correct": false },
                    { "option_text": "Accuracy, Consistency, Integrity, Durability", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which clause limits the number of rows returned?",
                "options": [
                    { "option_text": "WHERE", "option_type": "text", "is_correct": false },
                    { "option_text": "GROUP BY", "option_type": "text", "is_correct": false },
                    { "option_text": "HAVING", "option_type": "text", "is_correct": false },
                    { "option_text": "LIMIT", "option_type": "text", "is_correct": true }
                ]
            }
        ]
    },
    {
        "title": "Trigonometry Basics",
        "description": "Test your knowledge of trigonometric functions",
        "category": "Maths",
        "difficulty_level": "Intermediate",
        "max_attempt": 3,
        "is_per_question_reward": true,
        "per_question_reward": 18,
        "start_date": "2023-06-19",
        "fillInTheBlanks": [
            {
                "text": "In a right triangle, the side opposite the right angle is called the __.",
                "answers": ["hypotenuse"]
            },
            {
                "text": "The reciprocal of sine is __.",
                "answers": ["cosecant"]
            },
            {
                "text": "The identity sin²θ + cos²θ = __ always holds true.",
                "answers": ["1"]
            },
            {
                "text": "The period of the sine function is __ degrees.",
                "answers": ["360"]
            },
            {
                "text": "The tangent of 45° is __.",
                "answers": ["1"]
            }
        ],
        "mcqs": [
            {
                "question_text": "Which ratio represents sine?",
                "options": [
                    { "option_text": "Opposite/Hypotenuse", "option_type": "text", "is_correct": true },
                    { "option_text": "Adjacent/Hypotenuse", "option_type": "text", "is_correct": false },
                    { "option_text": "Opposite/Adjacent", "option_type": "text", "is_correct": false },
                    { "option_text": "Adjacent/Opposite", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What is the range of the cosine function?",
                "options": [
                    { "option_text": "0 to 1", "option_type": "text", "is_correct": false },
                    { "option_text": "-1 to 1", "option_type": "text", "is_correct": true },
                    { "option_text": "-∞ to ∞", "option_type": "text", "is_correct": false },
                    { "option_text": "0 to ∞", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which identity is correct?",
                "options": [
                    { "option_text": "tanθ = sinθ/cosθ", "option_type": "text", "is_correct": true },
                    { "option_text": "tanθ = cosθ/sinθ", "option_type": "text", "is_correct": false },
                    { "option_text": "tanθ = 1/sinθ", "option_type": "text", "is_correct": false },
                    { "option_text": "tanθ = 1/cosθ", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What is the amplitude of y = 3sin(x)?",
                "options": [
                    { "option_text": "1", "option_type": "text", "is_correct": false },
                    { "option_text": "3", "option_type": "text", "is_correct": true },
                    { "option_text": "π", "option_type": "text", "is_correct": false },
                    { "option_text": "2π", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which angle has the same sine as 30°?",
                "options": [
                    { "option_text": "60°", "option_type": "text", "is_correct": false },
                    { "option_text": "150°", "option_type": "text", "is_correct": true },
                    { "option_text": "210°", "option_type": "text", "is_correct": false },
                    { "option_text": "330°", "option_type": "text", "is_correct": false }
                ]
            }
        ]
    },
    {
        "title": "Shakespearean Literature",
        "description": "Test your knowledge of Shakespeare's works",
        "category": "English",
        "difficulty_level": "Intermediate",
        "max_attempt": 3,
        "is_per_question_reward": false,
        "points_reward": 170,
        "start_date": "2023-06-20",
        "fillInTheBlanks": [
            {
                "text": "Shakespeare's theater was called The __.",
                "answers": ["Globe"]
            },
            {
                "text": "\"To be or not to be\" is from __.",
                "answers": ["Hamlet"]
            },
            {
                "text": "The witches in Macbeth prophesy: \"All hail, Macbeth, that shalt be __ hereafter!\"",
                "answers": ["king"]
            },
            {
                "text": "Romeo and Juliet are called __ lovers.",
                "answers": ["star-crossed"]
            },
            {
                "text": "Shakespeare wrote __ sonnets.",
                "answers": ["154"]
            }
        ],
        "mcqs": [
            {
                "question_text": "Which is not a Shakespeare tragedy?",
                "options": [
                    { "option_text": "Macbeth", "option_type": "text", "is_correct": false },
                    { "option_text": "Othello", "option_type": "text", "is_correct": false },
                    { "option_text": "The Tempest", "option_type": "text", "is_correct": true },
                    { "option_text": "King Lear", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Who says \"The lady doth protest too much, methinks\"?",
                "options": [
                    { "option_text": "Ophelia", "option_type": "text", "is_correct": false },
                    { "option_text": "Gertrude", "option_type": "text", "is_correct": true },
                    { "option_text": "Lady Macbeth", "option_type": "text", "is_correct": false },
                    { "option_text": "Portia", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which play features the character Puck?",
                "options": [
                    { "option_text": "A Midsummer Night's Dream", "option_type": "text", "is_correct": true },
                    { "option_text": "The Tempest", "option_type": "text", "is_correct": false },
                    { "option_text": "Twelfth Night", "option_type": "text", "is_correct": false },
                    { "option_text": "Much Ado About Nothing", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "What was Shakespeare's wife's name?",
                "options": [
                    { "option_text": "Anne Hathaway", "option_type": "text", "is_correct": true },
                    { "option_text": "Elizabeth Taylor", "option_type": "text", "is_correct": false },
                    { "option_text": "Mary Arden", "option_type": "text", "is_correct": false },
                    { "option_text": "Judith Quiney", "option_type": "text", "is_correct": false }
                ]
            },
            {
                "question_text": "Which historical figure did Shakespeare not write a play about?",
                "options": [
                    { "option_text": "Henry V", "option_type": "text", "is_correct": false },
                    { "option_text": "Julius Caesar", "option_type": "text", "is_correct": false },
                    { "option_text": "Elizabeth I", "option_type": "text", "is_correct": true },
                    { "option_text": "Richard III", "option_type": "text", "is_correct": false }
                ]
            }
        ]
    }
];

const defaultChallenges = [
    {
        title: "JavaScript Fundamentals Challenge",
        description: "Master the basics of JavaScript programming",
        category: "Coding",
        duration: 14, // days
        difficulty_level: "Beginner",
        reward_points: 500,
        max_attempt: 3,
        rules: "Complete all phases to earn the full reward",
        phases: [
            {
                title: "Basic Concepts",
                phase_number: 1,
                description: "Learn JavaScript fundamentals",
                unlock_condition: "task_based",
                tasks: [
                    {
                        title: "Variables and Data Types",
                        description: "Understand JavaScript variables",

                        order: 1,
                        difficulty_level: "Easy",
                        max_attempts: 3,
                        reward_points: 10,
                        time_limit: 15,
                        is_mandatory: true,
                        trueFalseQuestions: [
                            {
                                question: "JavaScript is a statically typed language.",
                                answer: false
                            },
                            {
                                question: "The 'let' keyword allows block-scoped variables.",
                                answer: true
                            },
                            {
                                question: "JavaScript has a 'number' type for all numeric values.",
                                answer: true
                            },
                            {
                                question: "Undefined means a variable is declared but not assigned.",
                                answer: true
                            },
                            {
                                question: "null and undefined are identical in JavaScript.",
                                answer: false
                            }
                        ]
                    },
                    {
                        title: "Operators and Expressions",
                        description: "Work with JavaScript operators",

                        order: 2,
                        difficulty_level: "Moderate",
                        max_attempts: 3,
                        reward_points: 20,
                        time_limit: 15,
                        is_mandatory: true,
                        trueFalseQuestions: [
                            {
                                question: "The === operator performs type coercion.",
                                answer: false
                            },
                            {
                                question: "The + operator can be used for both addition and concatenation.",
                                answer: true
                            },
                            {
                                question: "The % operator returns the division remainder.",
                                answer: true
                            },
                            {
                                question: "Logical AND (&&) returns the first falsy value or the last truthy value.",
                                answer: true
                            },
                            {
                                question: "The typeof operator returns 'array' for arrays.",
                                answer: false
                            }
                        ]
                    }
                ]
            },
            {
                title: "Control Flow",
                phase_number: 2,
                description: "Master JavaScript control structures",
                unlock_condition: "task_based",
                is_final_phase: true,
                tasks: [
                    {
                        title: "Conditional Statements",
                        description: "Learn if/else and switch",

                        order: 1,
                        difficulty_level: "Moderate",
                        max_attempts: 3,
                        reward_points: 20,
                        time_limit: 15,
                        is_mandatory: true,
                        trueFalseQuestions: [
                            {
                                question: "An if statement requires curly braces {}.",
                                answer: false
                            },
                            {
                                question: "Switch cases use strict comparison (===).",
                                answer: true
                            },
                            {
                                question: "The ternary operator can replace simple if/else statements.",
                                answer: true
                            },
                            {
                                question: "JavaScript has a goto statement.",
                                answer: false
                            },
                            {
                                question: "Truthy values evaluate to true in boolean contexts.",
                                answer: true
                            }
                        ]
                    },
                    {
                        title: "Loops",
                        description: "Work with for, while, and do-while",

                        order: 2,
                        difficulty_level: "Hard",
                        max_attempts: 3,
                        reward_points: 20,
                        time_limit: 15,
                        is_mandatory: true,
                        trueFalseQuestions: [
                            {
                                question: "A for...in loop iterates over array values.",
                                answer: false
                            },
                            {
                                question: "The break statement exits the current loop.",
                                answer: true
                            },
                            {
                                question: "A do...while loop always executes at least once.",
                                answer: true
                            },
                            {
                                question: "The continue statement skips to the next iteration.",
                                answer: true
                            },
                            {
                                question: "JavaScript has a for...of loop for iterables.",
                                answer: true
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        title: "Web Development Basics",
        description: "Learn HTML, CSS and basic web concepts",
        category: "Coding",
        duration: 21,
        difficulty_level: "Beginner",
        reward_points: 750,
        max_attempt: 3,
        rules: "Complete all tasks to unlock the next phase",
        phases: [
            {
                title: "HTML Fundamentals",
                phase_number: 1,
                description: "Learn HTML structure and elements",
                unlock_condition: "task_based",
                tasks: [
                    {
                        title: "HTML Document Structure",
                        description: "Understand basic HTML skeleton",

                        order: 1,
                        difficulty_level: "Moderate",
                        max_attempts: 3,
                        reward_points: 20,
                        time_limit: 15,
                        is_mandatory: true,
                        trueFalseQuestions: [
                            {
                                question: "HTML stands for HyperText Markup Language.",
                                answer: true
                            },
                            {
                                question: "The <head> section contains visible page content.",
                                answer: false
                            },
                            {
                                question: "HTML5 is the latest version of HTML.",
                                answer: true
                            },
                            {
                                question: "All HTML tags require a closing tag.",
                                answer: false
                            },
                            {
                                question: "The <!DOCTYPE> declaration defines the document type.",
                                answer: true
                            }
                        ],
                        mcqQuestions: [
                            {
                                "question_text": "What is 8 × 9?",
                                "options": [
                                    { "option_text": "72", "option_type": "text", "is_correct": true },
                                    { "option_text": "64", "option_type": "text", "is_correct": false },
                                    { "option_text": "81", "option_type": "text", "is_correct": false },
                                    { "option_text": "56", "option_type": "text", "is_correct": false }
                                ]
                            },
                            {
                                "question_text": "Which of these is a prime number?",
                                "options": [
                                    { "option_text": "15", "option_type": "text", "is_correct": false },
                                    { "option_text": "23", "option_type": "text", "is_correct": true },
                                    { "option_text": "28", "option_type": "text", "is_correct": false },
                                    { "option_text": "32", "option_type": "text", "is_correct": false }
                                ]
                            },
                            {
                                "question_text": "What is the value of π (pi) to two decimal places?",
                                "options": [
                                    { "option_text": "3.14", "option_type": "text", "is_correct": true },
                                    { "option_text": "3.16", "option_type": "text", "is_correct": false },
                                    { "option_text": "3.41", "option_type": "text", "is_correct": false },
                                    { "option_text": "3.00", "option_type": "text", "is_correct": false }
                                ]
                            },
                            {
                                "question_text": "Which shape has all sides equal?",
                                "options": [
                                    { "option_text": "Rectangle", "option_type": "text", "is_correct": false },
                                    { "option_text": "Square", "option_type": "text", "is_correct": true },
                                    { "option_text": "Trapezoid", "option_type": "text", "is_correct": false },
                                    { "option_text": "Parallelogram", "option_type": "text", "is_correct": false }
                                ]
                            },
                            {
                                "question_text": "What is 3/4 expressed as a percentage?",
                                "options": [
                                    { "option_text": "25%", "option_type": "text", "is_correct": false },
                                    { "option_text": "50%", "option_type": "text", "is_correct": false },
                                    { "option_text": "75%", "option_type": "text", "is_correct": true },
                                    { "option_text": "100%", "option_type": "text", "is_correct": false }
                                ]
                            }
                        ],
                        fillInTheBlanks: [
                            {
                                "text": "The sum of 5 and 7 is __.",
                                "answers": ["12"]
                            },
                            {
                                "text": "A triangle has __ sides.",
                                "answers": ["3", "three"]
                            },
                            {
                                "text": "The square root of 16 is __.",
                                "answers": ["4", "four"]
                            },
                            {
                                "text": "In the equation 2x = 10, x equals __.",
                                "answers": ["5", "five"]
                            },
                            {
                                "text": "The area of a rectangle is length __ width.",
                                "answers": ["times", "×", "multiplied by"]
                            }
                        ]
                    },
                    {
                        title: "Common HTML Elements",
                        description: "Learn about frequently used tags",

                        order: 2,
                        difficulty_level: "Moderate",
                        max_attempts: 3,
                        reward_points: 20,
                        time_limit: 15,
                        is_mandatory: true,
                        trueFalseQuestions: [
                            {
                                question: "<div> is an inline element.",
                                answer: false
                            },
                            {
                                question: "<span> is a block-level element.",
                                answer: false
                            },
                            {
                                question: "<img> is a self-closing tag.",
                                answer: true
                            },
                            {
                                question: "<a> tags can only link to external websites.",
                                answer: false
                            },
                            {
                                question: "HTML comments use <!-- --> syntax.",
                                answer: true
                            }
                        ]
                    }
                ]
            },
            {
                title: "CSS Basics",
                phase_number: 2,
                description: "Learn to style web pages with CSS",
                is_final_phase: true,
                unlock_condition: "task_based",
                tasks: [
                    {
                        title: "CSS Selectors",
                        description: "Understand how to target elements",

                        order: 1,
                        difficulty_level: "Moderate",
                        max_attempts: 3,
                        reward_points: 20,
                        time_limit: 15,
                        is_mandatory: true,
                        trueFalseQuestions: [
                            {
                                question: "CSS stands for Cascading Style Sheets.",
                                answer: true
                            },
                            {
                                question: "Inline styles have the lowest priority.",
                                answer: false
                            },
                            {
                                question: "Class selectors are prefixed with a dot (.).",
                                answer: true
                            },
                            {
                                question: "ID selectors can be used multiple times on a page.",
                                answer: false
                            },
                            {
                                question: "The universal selector is represented by *.",
                                answer: true
                            }
                        ]
                    },
                    {
                        title: "CSS Box Model",
                        description: "Understand padding, margin and border",

                        order: 2,
                        difficulty_level: "Moderate",
                        max_attempts: 3,
                        reward_points: 20,
                        time_limit: 15,
                        is_mandatory: true,
                        trueFalseQuestions: [
                            {
                                question: "Padding is space outside an element.",
                                answer: false
                            },
                            {
                                question: "Margin can have negative values.",
                                answer: true
                            },
                            {
                                question: "Border is included in an element's width.",
                                answer: true
                            },
                            {
                                question: "box-sizing: border-box includes padding and border in width.",
                                answer: true
                            },
                            {
                                question: "Outline affects the box model calculations.",
                                answer: false
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        title: "Algebra Mastery Challenge",
        description: "Develop core algebra skills through practical problems",
        category: "Maths",
        duration: 10,
        difficulty_level: "Intermediate",
        reward_points: 600,
        max_attempt: 2,
        rules: "Show your work for full credit on problem-solving tasks",
        phases: [
            {
                title: "Linear Equations",
                phase_number: 1,
                description: "Solve single-variable equations",
                unlock_condition: "task_based",
                tasks: [
                    {
                        title: "Basic Equation Solving",
                        description: "Solve for x in simple equations",

                        order: 1,
                        difficulty_level: "Easy",
                        max_attempts: 3,
                        reward_points: 15,
                        time_limit: 20,
                        is_mandatory: false,
                        fillInTheBlanks: [
                            {
                                text: "If 2x + 5 = 15, then x = __",
                                answers: ["5"]
                            },
                            {
                                text: "The solution to 3(x - 4) = 21 is x = __",
                                answers: ["11"]
                            },
                            {
                                text: "If x - 8 = 10, then x = __",
                                answers: ["18"]
                            },
                            {
                                text: "Solve for x: 5x = 45. x = __",
                                answers: ["9"]
                            },
                            {
                                text: "If x / 4 = 12, then x = __",
                                answers: ["48"]
                            },
                            {
                                text: "7x + 3 = 24. x = __",
                                answers: ["3"]
                            },
                            {
                                text: "15 - x = 9. x = __",
                                answers: ["6"]
                            },
                            {
                                text: "2(x + 5) = 20. x = __",
                                answers: ["5"]
                            },
                            { text: "If 3x = 12, then x = __", answers: ["4"] },
                            { text: "x + 7 = 20. x = __", answers: ["13"] },
                            { text: "If x / 2 = 10, then x = __", answers: ["20"] },
                            { text: "Solve: 2x - 4 = 10. x = __", answers: ["7"] },
                            { text: "5x + 5 = 30. x = __", answers: ["5"] },
                            { text: "x - 15 = 5. x = __", answers: ["20"] },
                            { text: "4x = 100. x = __", answers: ["25"] },
                            { text: "x + 10 = 100. x = __", answers: ["90"] },
                            { text: "6x = 36. x = __", answers: ["6"] },
                            { text: "If x / 5 = 5, then x = __", answers: ["25"] },
                            { text: "2x + 1 = 11. x = __", answers: ["5"] },
                            { text: "3x - 9 = 0. x = __", answers: ["3"] },
                            { text: "10 - x = 2. x = __", answers: ["8"] },
                            { text: "x + x = 14. x = __", answers: ["7"] },
                            { text: "2x + x = 15. x = __", answers: ["5"] },
                            { text: "3x + 2x = 25. x = __", answers: ["5"] },
                            { text: "8x = 64. x = __", answers: ["8"] },
                            { text: "x - 3 = 17. x = __", answers: ["20"] },
                            { text: "12x = 144. x = __", answers: ["12"] },
                            { text: "x / 3 = 9. x = __", answers: ["27"] }
                        ],
                        mcqQuestions: [
                            {
                                question_text: "Which equation has the solution x = 4?",
                                options: [
                                    { option_text: "2x = 6", is_correct: false },
                                    { option_text: "x + 5 = 9", is_correct: true },
                                    { option_text: "3x - 2 = 14", is_correct: false },
                                    { option_text: "x/2 = 3", is_correct: false }
                                ]
                            },
                            {
                                question_text: "Solve for x: 4x - 7 = 5",
                                options: [
                                    { option_text: "3", is_correct: true },
                                    { option_text: "2", is_correct: false },
                                    { option_text: "12", is_correct: false },
                                    { option_text: "4", is_correct: false }
                                ]
                            },
                            {
                                question_text: "What is the value of x if 2x + 10 = 0?",
                                options: [
                                    { option_text: "5", is_correct: false },
                                    { option_text: "-5", is_correct: true },
                                    { option_text: "0", is_correct: false },
                                    { option_text: "10", is_correct: false }
                                ]
                            },
                            {
                                question_text: "If 3x + 2 = 14, then 3x equals:",
                                options: [
                                    { option_text: "12", is_correct: true },
                                    { option_text: "16", is_correct: false },
                                    { option_text: "4", is_correct: false },
                                    { option_text: "12/3", is_correct: false }
                                ]
                            },
                            {
                                question_text: "Find x: 10 - 2x = 4",
                                options: [
                                    { option_text: "3", is_correct: true },
                                    { option_text: "7", is_correct: false },
                                    { option_text: "-3", is_correct: false },
                                    { option_text: "5", is_correct: false }
                                ]
                            },
                            {
                                question_text: "Which value of x satisfies x/3 - 1 = 1?",
                                options: [
                                    { option_text: "3", is_correct: false },
                                    { option_text: "6", is_correct: true },
                                    { option_text: "9", is_correct: false },
                                    { option_text: "0", is_correct: false }
                                ]
                            },
                            {
                                question_text: "Solve: 3x + 1 = 10",
                                options: [
                                    { option_text: "3", is_correct: true },
                                    { option_text: "9", is_correct: false },
                                    { option_text: "2", is_correct: false },
                                    { option_text: "4", is_correct: false }
                                ]
                            },
                            {
                                question_text: "Solve: 5x - 5 = 20",
                                options: [
                                    { option_text: "5", is_correct: true },
                                    { option_text: "4", is_correct: false },
                                    { option_text: "25", is_correct: false },
                                    { option_text: "3", is_correct: false }
                                ]
                            },
                            {
                                question_text: "What is x if 2x = 18?",
                                options: [
                                    { option_text: "9", is_correct: true },
                                    { option_text: "6", is_correct: false },
                                    { option_text: "8", is_correct: false },
                                    { option_text: "20", is_correct: false }
                                ]
                            },
                            {
                                question_text: "If x/3 = 3, then x is:",
                                options: [
                                    { option_text: "9", is_correct: true },
                                    { option_text: "1", is_correct: false },
                                    { option_text: "6", is_correct: false },
                                    { option_text: "0", is_correct: false }
                                ]
                            },
                            {
                                question_text: "Solve: 4x + 4 = 24",
                                options: [
                                    { option_text: "5", is_correct: true },
                                    { option_text: "6", is_correct: false },
                                    { option_text: "20", is_correct: false },
                                    { option_text: "4", is_correct: false }
                                ]
                            },
                            {
                                question_text: "Find x: x - 7 = 13",
                                options: [
                                    { option_text: "20", is_correct: true },
                                    { option_text: "6", is_correct: false },
                                    { option_text: "21", is_correct: false },
                                    { option_text: "19", is_correct: false }
                                ]
                            },
                            {
                                question_text: "6x = 48",
                                options: [
                                    { option_text: "8", is_correct: true },
                                    { option_text: "6", is_correct: false },
                                    { option_text: "7", is_correct: false },
                                    { option_text: "9", is_correct: false }
                                ]
                            },
                            {
                                question_text: "x/2 = 8",
                                options: [
                                    { option_text: "16", is_correct: true },
                                    { option_text: "4", is_correct: false },
                                    { option_text: "10", is_correct: false },
                                    { option_text: "6", is_correct: false }
                                ]
                            },
                            {
                                question_text: "2x - 3 = 11",
                                options: [
                                    { option_text: "7", is_correct: true },
                                    { option_text: "14", is_correct: false },
                                    { option_text: "4", is_correct: false },
                                    { option_text: "8", is_correct: false }
                                ]
                            },
                            {
                                question_text: "x + 4 = 4",
                                options: [
                                    { option_text: "0", is_correct: true },
                                    { option_text: "4", is_correct: false },
                                    { option_text: "8", is_correct: false },
                                    { option_text: "1", is_correct: false }
                                ]
                            },
                            {
                                question_text: "3x = 0",
                                options: [
                                    { option_text: "0", is_correct: true },
                                    { option_text: "3", is_correct: false },
                                    { option_text: "1", is_correct: false },
                                    { option_text: "-3", is_correct: false }
                                ]
                            },
                            {
                                question_text: "9x = 81",
                                options: [
                                    { option_text: "9", is_correct: true },
                                    { option_text: "8", is_correct: false },
                                    { option_text: "81", is_correct: false },
                                    { option_text: "72", is_correct: false }
                                ]
                            },
                            {
                                question_text: "x/10 = 2",
                                options: [
                                    { option_text: "20", is_correct: true },
                                    { option_text: "5", is_correct: false },
                                    { option_text: "12", is_correct: false },
                                    { option_text: "2", is_correct: false }
                                ]
                            },
                            {
                                question_text: "2x + 2 = 12",
                                options: [
                                    { option_text: "5", is_correct: true },
                                    { option_text: "6", is_correct: false },
                                    { option_text: "10", is_correct: false },
                                    { option_text: "7", is_correct: false }
                                ]
                            },
                            {
                                question_text: "5x = 55",
                                options: [
                                    { option_text: "11", is_correct: true },
                                    { option_text: "10", is_correct: false },
                                    { option_text: "5", is_correct: false },
                                    { option_text: "50", is_correct: false }
                                ]
                            }
                        ],
                        trueFalseQuestions: [
                            {
                                question: "In the equation x + 5 = 10, the value of x is 5.",
                                answer: true
                            },
                            {
                                question: "If 2x = 10, then x = 20.",
                                answer: false
                            },
                            {
                                question: "The solution to 4x = 0 is x = 0.",
                                answer: true
                            },
                            {
                                question: "Adding the same number to both sides of an equation keeps it balanced.",
                                answer: true
                            },
                            {
                                question: "x - 5 = 5 is equivalent to x = 0.",
                                answer: false
                            },
                            {
                                question: "If -x = 5, then x = -5.",
                                answer: true
                            },
                            { question: "If 3x = 9, then x = 3.", answer: true },
                            { question: "x + 5 = 10, so x = 2.", answer: false },
                            { question: "2x = 22 implies x = 11.", answer: true },
                            { question: "The solution to x - 3 = 0 is x = 3.", answer: true },
                            { question: "4x = 16 means x = 2.", answer: false },
                            { question: "If x/2 = 5, then x = 10.", answer: true },
                            { question: "5x = 25 means x = 4.", answer: false },
                            { question: "x + x is the same as x^2.", answer: false },
                            { question: "x * 0 = 0 is always true.", answer: true },
                            { question: "If 10x = 10, then x = 1.", answer: true },
                            { question: "x - x = 1.", answer: false },
                            { question: "x + 0 = x.", answer: true },
                            { question: "2x = 4x means x = 0.", answer: true },
                            { question: "x / 1 = x.", answer: true },
                            { question: "x + 1 = x.", answer: false }
                        ]
                    },
                    {
                        title: "Word Problems",
                        description: "Translate word problems into equations",

                        order: 2,
                        difficulty_level: "Moderate",
                        max_attempts: 3,
                        reward_points: 25,
                        time_limit: 30,
                        is_mandatory: false,
                        fillInTheBlanks: [
                            {
                                text: "If a number increased by 7 equals 15, the number is __",
                                answers: ["8"]
                            }
                        ]
                    }
                ]
            },
            {
                title: "Quadratic Equations",
                phase_number: 2,
                description: "Master factoring and the quadratic formula",

                unlock_condition: "task_based",
                tasks: [
                    {
                        title: "Factoring Practice",
                        description: "Factor quadratic expressions",

                        order: 1,
                        difficulty_level: "Moderate",
                        max_attempts: 3,
                        reward_points: 30,
                        time_limit: 25,
                        is_mandatory: false,
                        fillInTheBlanks: [
                            {
                                text: "x² + 5x + 6 factors as (x + __)(x + __)",
                                answers: ["2", "3"]
                            }
                        ]
                    },
                    {
                        title: "Quadratic Formula",
                        description: "Apply the quadratic formula",

                        order: 2,
                        difficulty_level: "Hard",
                        max_attempts: 3,
                        reward_points: 40,
                        time_limit: 30,
                        is_mandatory: false,
                        mcqQuestions: [
                            {
                                question_text: "The quadratic formula is:",
                                options: [
                                    { option_text: "x = (-b ± √(b²-4ac))/2a", is_correct: true },
                                    { option_text: "x = b ± √(b²-4ac)/2a", is_correct: false },
                                    { option_text: "x = (-b ± √(b²+4ac))/2a", is_correct: false }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                title: "Coordinate Geometry",
                phase_number: 3,
                description: "Understand points, lines, and slopes",
                unlock_condition: "task_based",
                tasks: [
                    {
                        title: "Distance Formula",
                        description: "Calculate distance between two points",
                        order: 1,
                        difficulty_level: "Easy",
                        max_attempts: 3,
                        reward_points: 20,
                        time_limit: 20,
                        is_mandatory: false,
                        fillInTheBlanks: [
                            {
                                text: "The distance between (0,0) and (3,4) is __",
                                answers: ["5"]
                            }
                        ]
                    }
                ]
            },
            {
                title: "Systems of Equations",
                phase_number: 4,
                description: "Solve multiple equations simultaneously",
                unlock_condition: "task_based",
                tasks: [
                    {
                        title: "Substitution Method",
                        description: "Solve using substitution",
                        order: 1,
                        difficulty_level: "Moderate",
                        max_attempts: 3,
                        reward_points: 30,
                        time_limit: 25,
                        is_mandatory: false,
                        mcqQuestions: [
                            {
                                question_text: "Solve: y = 2x, x + y = 12",
                                options: [
                                    { option_text: "x=4, y=8", is_correct: true },
                                    { option_text: "x=3, y=6", is_correct: false }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                title: "Polynomials",
                phase_number: 5,
                description: "Operations with polynomials",
                unlock_condition: "task_based",
                tasks: [
                    {
                        title: "Adding Polynomials",
                        description: "Add like terms",
                        order: 1,
                        difficulty_level: "Easy",
                        max_attempts: 3,
                        reward_points: 20,
                        time_limit: 15,
                        is_mandatory: false,
                        fillInTheBlanks: [
                            {
                                text: "(2x + 3) + (x - 1) = __x + 2",
                                answers: ["3"]
                            }
                        ]
                    }
                ]
            },
            {
                title: "Inequalities",
                phase_number: 6,
                description: "Solving and graphing inequalities",
                unlock_condition: "task_based",
                tasks: [
                    {
                        title: "Linear Inequalities",
                        description: "Solve for x",
                        order: 1,
                        difficulty_level: "Moderate",
                        max_attempts: 3,
                        reward_points: 25,
                        time_limit: 20,
                        is_mandatory: false,
                        mcqQuestions: [
                            {
                                question_text: "Solve: 2x > 10",
                                options: [
                                    { option_text: "x > 5", is_correct: true },
                                    { option_text: "x < 5", is_correct: false }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                title: "Functions",
                phase_number: 7,
                description: "Function notation and evaluation",
                unlock_condition: "task_based",
                tasks: [
                    {
                        title: "Evaluate Functions",
                        description: "Find f(x)",
                        order: 1,
                        difficulty_level: "Easy",
                        max_attempts: 3,
                        reward_points: 20,
                        time_limit: 15,
                        is_mandatory: false,
                        fillInTheBlanks: [
                            {
                                text: "If f(x) = 2x + 1, then f(3) = __",
                                answers: ["7"]
                            }
                        ]
                    }
                ]
            },
            {
                title: "Exponents",
                phase_number: 8,
                description: "Rules of exponents",
                unlock_condition: "task_based",
                tasks: [
                    {
                        title: "Product Rule",
                        description: "Simplify expressions",
                        order: 1,
                        difficulty_level: "Moderate",
                        max_attempts: 3,
                        reward_points: 30,
                        time_limit: 20,
                        is_mandatory: false,
                        fillInTheBlanks: [
                            {
                                text: "x^2 * x^3 = x^__",
                                answers: ["5"]
                            }
                        ]
                    }
                ]
            },
            {
                title: "Logarithms",
                phase_number: 9,
                description: "Intro to logarithms",
                unlock_condition: "task_based",
                tasks: [
                    {
                        title: "Logarithmic Form",
                        description: "Convert exponential to log form",
                        order: 1,
                        difficulty_level: "Hard",
                        max_attempts: 3,
                        reward_points: 40,
                        time_limit: 30,
                        is_mandatory: false,
                        mcqQuestions: [
                            {
                                question_text: "2^3 = 8 written in log form is:",
                                options: [
                                    { option_text: "log2(8) = 3", is_correct: true },
                                    { option_text: "log3(8) = 2", is_correct: false }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                title: "Advanced Algebra",
                phase_number: 10,
                description: "Complex numbers and advanced topics",
                is_final_phase: true,
                unlock_condition: "task_based",
                tasks: [
                    {
                        title: "Complex Numbers",
                        description: "Operations with imaginery numbers",
                        order: 1,
                        difficulty_level: "Hard",
                        max_attempts: 3,
                        reward_points: 50,
                        time_limit: 30,
                        is_mandatory: false,
                        fillInTheBlanks: [
                            {
                                text: "i^2 is equal to __",
                                answers: ["-1"]
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        title: "Chemistry Fundamentals",
        description: "Explore atomic structure and chemical bonding",
        category: "Science",
        duration: 14,
        difficulty_level: "Intermediate",
        reward_points: 700,
        max_attempt: 3,
        rules: "Complete all lab simulations for full credit",
        phases: [
            {
                title: "Atomic Structure",
                phase_number: 1,
                description: "Understand subatomic particles and electron configuration",
                unlock_condition: "task_based",
                tasks: [
                    {
                        title: "Subatomic Particles",
                        description: "Identify protons, neutrons, and electrons",

                        order: 1,
                        difficulty_level: "Easy",
                        max_attempts: 3,
                        reward_points: 20,
                        time_limit: 15,
                        is_mandatory: true,
                        trueFalseQuestions: [
                            {
                                question: "Electrons have a negative charge.",
                                answer: true
                            },
                            {
                                question: "Neutrons are found in the electron cloud.",
                                answer: false
                            }
                        ]
                    },
                    {
                        title: "Electron Configuration",
                        description: "Write electron configurations for elements",

                        order: 2,
                        difficulty_level: "Moderate",
                        max_attempts: 3,
                        reward_points: 30,
                        time_limit: 20,
                        is_mandatory: false,
                        fillInTheBlanks: [
                            {
                                text: "The electron configuration for Oxygen is 1s² __",
                                answers: ["2s²2p⁴"]
                            }
                        ]
                    }
                ]
            },
            {
                title: "Chemical Bonding",
                phase_number: 2,
                description: "Explore ionic and covalent bonds",
                is_final_phase: true,
                unlock_condition: "task_based",
                tasks: [
                    {
                        title: "Ionic Bonds",
                        description: "Predict ionic compound formation",

                        order: 1,
                        difficulty_level: "Moderate",
                        max_attempts: 3,
                        reward_points: 35,
                        time_limit: 25,
                        is_mandatory: true,
                        mcqQuestions: [
                            {
                                question_text: "Which pair would form an ionic compound?",
                                options: [
                                    { option_text: "Na and Cl", is_correct: true },
                                    { option_text: "C and O", is_correct: false },
                                    { option_text: "H and O", is_correct: false }
                                ]
                            }
                        ]
                    },
                    {
                        title: "Covalent Bonds",
                        description: "Understand electron sharing",

                        order: 2,
                        difficulty_level: "Hard",
                        max_attempts: 3,
                        reward_points: 40,
                        time_limit: 30,
                        is_mandatory: true,
                        trueFalseQuestions: [
                            {
                                question: "Water (H₂O) has polar covalent bonds.",
                                answer: true
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        title: "Ancient Civilizations",
        description: "Explore the rise and fall of early empires",
        category: "History",
        duration: 21,
        difficulty_level: "Beginner",
        reward_points: 550,
        max_attempt: 3,
        rules: "Cite sources for all research tasks",
        phases: [
            {
                title: "Mesopotamia",
                phase_number: 1,
                description: "Study the cradle of civilization",
                unlock_condition: "task_based",
                tasks: [
                    {
                        title: "Sumerian Achievements",
                        description: "Identify key Sumerian contributions",

                        order: 1,
                        difficulty_level: "Easy",
                        max_attempts: 3,
                        reward_points: 20,
                        time_limit: 20,
                        is_mandatory: true,
                        mcqQuestions: [
                            {
                                question_text: "The Sumerians developed:",
                                options: [
                                    { option_text: "Cuneiform writing", is_correct: true },
                                    { option_text: "Democracy", is_correct: false },
                                    { option_text: "Gunpowder", is_correct: false }
                                ]
                            }
                        ]
                    },
                    {
                        title: "Hammurabi's Code",
                        description: "Understand early legal systems",

                        order: 2,
                        difficulty_level: "Moderate",
                        max_attempts: 3,
                        reward_points: 30,
                        time_limit: 25,
                        is_mandatory: true,
                        trueFalseQuestions: [
                            {
                                question: "Hammurabi's Code followed 'an eye for an eye' principle.",
                                answer: true
                            }
                        ]
                    }
                ]
            },
            {
                title: "Ancient Egypt",
                phase_number: 2,
                description: "Explore pharaonic civilization",
                is_final_phase: true,
                unlock_condition: "task_based",
                tasks: [
                    {
                        title: "Pyramid Construction",
                        description: "Understand building techniques",

                        order: 1,
                        difficulty_level: "Moderate",
                        max_attempts: 3,
                        reward_points: 35,
                        time_limit: 25,
                        is_mandatory: true,
                        fillInTheBlanks: [
                            {
                                text: "The Great Pyramid was built for Pharaoh __",
                                answers: ["Khufu", "Cheops"]
                            }
                        ]
                    },
                    {
                        title: "Hieroglyphics",
                        description: "Study Egyptian writing",

                        order: 2,
                        difficulty_level: "Hard",
                        max_attempts: 3,
                        reward_points: 40,
                        time_limit: 30,
                        is_mandatory: true,
                        mcqQuestions: [
                            {
                                question_text: "The Rosetta Stone helped decipher hieroglyphics because it:",
                                options: [
                                    { option_text: "Contained parallel texts in Greek and Egyptian", is_correct: true },
                                    { option_text: "Was written entirely in hieroglyphics", is_correct: false },
                                    { option_text: "Listed all Egyptian symbols", is_correct: false }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        "title": "Basic Arithmetic",
        "description": "Master addition and subtraction",
        "category": "Maths",
        "duration": 10,
        "difficulty_level": "Beginner",
        "reward_points": 400,
        "max_attempt": 3,
        "rules": "Show your work",
        "phases": [
            {
                "title": "Addition Basics",
                "phase_number": 1,
                "description": "Solve simple addition problems",
                "unlock_condition": "task_based",
                "tasks": [
                    {
                        "title": "Single-Digit Addition",
                        "description": "Answer the following:",

                        "order": 1,
                        "difficulty_level": "Easy",
                        "max_attempts": 3,
                        "reward_points": 20,
                        "time_limit": 10,
                        "is_mandatory": true,
                        "fillInTheBlanks": [
                            { "text": "5 + 3 = __", "answers": ["8"] },
                            { "text": "9 + 2 = __", "answers": ["11"] }
                        ]
                    }
                ]
            },
            {
                "title": "Subtraction Basics",
                "phase_number": 2,
                "description": "Solve simple subtraction problems",
                "is_final_phase": true,
                "unlock_condition": "task_based",
                "tasks": [
                    {
                        "title": "Single-Digit Subtraction",
                        "description": "Answer the following:",

                        "order": 1,
                        "difficulty_level": "Easy",
                        "max_attempts": 3,
                        "reward_points": 20,
                        "time_limit": 10,
                        "is_mandatory": true,
                        "trueFalseQuestions": [
                            { "question": "7 - 4 = 3", "answer": true },
                            { "question": "10 - 6 = 5", "answer": false }
                        ]
                    }
                ]
            }
        ]
    },
    {
        "title": "Animal Kingdom",
        "description": "Learn about mammals and birds",
        "category": "Science",
        "duration": 14,
        "difficulty_level": "Beginner",
        "reward_points": 450,
        "max_attempt": 3,
        "rules": "No external resources",
        "phases": [
            {
                "title": "Mammals",
                "phase_number": 1,
                "description": "Identify common mammals",
                "unlock_condition": "task_based",
                "tasks": [
                    {
                        "title": "Mammal Traits",
                        "description": "Select the correct answer:",

                        "order": 1,
                        "difficulty_level": "Easy",
                        "max_attempts": 3,
                        "reward_points": 25,
                        "time_limit": 15,
                        "is_mandatory": true,
                        "mcqQuestions": [
                            {
                                "question_text": "Which of these is a mammal?",
                                "options": [
                                    { "option_text": "Dolphin", "is_correct": true },
                                    { "option_text": "Eagle", "is_correct": false },
                                    { "option_text": "Goldfish", "is_correct": false }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "title": "Birds",
                "phase_number": 2,
                "description": "Identify common birds",
                "is_final_phase": true,
                "unlock_condition": "task_based",
                "tasks": [
                    {
                        "title": "Bird Traits",
                        "description": "Fill in the blank:",

                        "order": 1,
                        "difficulty_level": "Easy",
                        "max_attempts": 3,
                        "reward_points": 25,
                        "time_limit": 15,
                        "is_mandatory": true,
                        "fillInTheBlanks": [
                            { "text": "A __ is a bird that cannot fly.", "answers": ["penguin", "ostrich"] }
                        ]
                    }
                ]
            }
        ]
    },
    {
        "title": "Ancient Wonders",
        "description": "Explore the Seven Wonders",
        "category": "History",
        "duration": 14,
        "difficulty_level": "Beginner",
        "reward_points": 500,
        "max_attempt": 3,
        "rules": "Cite sources if needed",
        "phases": [
            {
                "title": "Egyptian Wonders",
                "phase_number": 1,
                "description": "Learn about the Pyramids",
                "unlock_condition": "task_based",
                "tasks": [
                    {
                        "title": "Great Pyramid",
                        "description": "Answer the question:",

                        "order": 1,
                        "difficulty_level": "Easy",
                        "max_attempts": 3,
                        "reward_points": 30,
                        "time_limit": 20,
                        "is_mandatory": true,
                        "trueFalseQuestions": [
                            { "question": "The Great Pyramid is in Cairo.", "answer": true }
                        ]
                    }
                ]
            },
            {
                "title": "Greek Wonders",
                "phase_number": 2,
                "description": "Learn about the Colossus",
                "is_final_phase": true,
                "unlock_condition": "task_based",
                "tasks": [
                    {
                        "title": "Colossus of Rhodes",
                        "description": "Fill in the blank:",

                        "order": 1,
                        "difficulty_level": "Easy",
                        "max_attempts": 3,
                        "reward_points": 30,
                        "time_limit": 20,
                        "is_mandatory": true,
                        "fillInTheBlanks": [
                            { "text": "The Colossus of Rhodes was a giant __.", "answers": ["statue"] }
                        ]
                    }
                ]
            }
        ]
    },
    {
        "title": "Python Basics",
        "description": "Learn simple Python syntax",
        "category": "Coding",
        "duration": 14,
        "difficulty_level": "Beginner",
        "reward_points": 500,
        "max_attempt": 3,
        "rules": "No IDE use",
        "phases": [
            {
                "title": "Variables",
                "phase_number": 1,
                "description": "Declare and use variables",
                "unlock_condition": "task_based",
                "tasks": [
                    {
                        "title": "Variable Types",
                        "description": "What is the output?",

                        "order": 1,
                        "difficulty_level": "Easy",
                        "max_attempts": 3,
                        "reward_points": 30,
                        "time_limit": 20,
                        "is_mandatory": true,
                        "mcqQuestions": [
                            {
                                "question_text": "What does `print(type(5))` output?",
                                "options": [
                                    { "option_text": "int", "is_correct": true },
                                    { "option_text": "str", "is_correct": false },
                                    { "option_text": "float", "is_correct": false }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "title": "Loops",
                "phase_number": 2,
                "description": "Write a simple loop",
                "is_final_phase": true,
                "unlock_condition": "task_based",
                "tasks": [
                    {
                        "title": "For Loop",
                        "description": "Fill in the blank:",

                        "order": 1,
                        "difficulty_level": "Easy",
                        "max_attempts": 3,
                        "reward_points": 30,
                        "time_limit": 20,
                        "is_mandatory": true,
                        "fillInTheBlanks": [
                            { "text": "`for i in range(3): print(__)` prints 0,1,2.", "answers": ["i"] }
                        ]
                    }
                ]
            }
        ]
    },
    {
        "title": "Synonyms & Antonyms",
        "description": "Match similar and opposite words",
        "category": "English",
        "duration": 10,
        "difficulty_level": "Beginner",
        "reward_points": 400,
        "max_attempt": 3,
        "rules": "No thesaurus",
        "phases": [
            {
                "title": "Synonyms",
                "phase_number": 1,
                "description": "Find words with similar meanings",
                "unlock_condition": "task_based",
                "tasks": [
                    {
                        "title": "Match Synonyms",
                        "description": "Select the correct pair:",

                        "order": 1,
                        "difficulty_level": "Easy",
                        "max_attempts": 3,
                        "reward_points": 25,
                        "time_limit": 15,
                        "is_mandatory": true,
                        "mcqQuestions": [
                            {
                                "question_text": "Which word is a synonym for 'happy'?",
                                "options": [
                                    { "option_text": "Joyful", "is_correct": true },
                                    { "option_text": "Angry", "is_correct": false },
                                    { "option_text": "Sad", "is_correct": false }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "title": "Antonyms",
                "phase_number": 2,
                "description": "Find words with opposite meanings",
                "is_final_phase": true,
                "unlock_condition": "task_based",
                "tasks": [
                    {
                        "title": "Match Antonyms",
                        "description": "Fill in the blank:",

                        "order": 1,
                        "difficulty_level": "Easy",
                        "max_attempts": 3,
                        "reward_points": 25,
                        "time_limit": 15,
                        "is_mandatory": true,
                        "fillInTheBlanks": [
                            { "text": "The antonym of 'hot' is __.", "answers": ["cold"] }
                        ]
                    }
                ]
            }
        ]
    },
    {
        "title": "Pop Culture",
        "description": "Test your knowledge of movies and music",
        "category": "Other",
        "duration": 7,
        "difficulty_level": "Beginner",
        "reward_points": 350,
        "max_attempt": 3,
        "rules": "No internet searches",
        "phases": [
            {
                "title": "Movies",
                "phase_number": 1,
                "description": "Guess famous films",
                "unlock_condition": "task_based",
                "tasks": [
                    {
                        "title": "Famous Quotes",
                        "description": "Who said this?",

                        "order": 1,
                        "difficulty_level": "Easy",
                        "max_attempts": 3,
                        "reward_points": 20,
                        "time_limit": 10,
                        "is_mandatory": true,
                        "mcqQuestions": [
                            {
                                "question_text": "\"May the Force be with you\" is from:",
                                "options": [
                                    { "option_text": "Star Wars", "is_correct": true },
                                    { "option_text": "Harry Potter", "is_correct": false },
                                    { "option_text": "The Avengers", "is_correct": false }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "title": "Music",
                "phase_number": 2,
                "description": "Identify hit songs",
                "is_final_phase": true,
                "unlock_condition": "task_based",
                "tasks": [
                    {
                        "title": "Song Artists",
                        "description": "Fill in the blank:",

                        "order": 1,
                        "difficulty_level": "Easy",
                        "max_attempts": 3,
                        "reward_points": 20,
                        "time_limit": 10,
                        "is_mandatory": true,
                        "fillInTheBlanks": [
                            { "text": "\"Thriller\" is a song by __.", "answers": ["Michael Jackson"] }
                        ]
                    }
                ]
            }
        ]
    }
];

const defaultCategories = ["Maths", "Science", "History", "Coding", "English", "Other"];

const dummyCheatSheets = [
    {
        title: "JavaScript Basics",
        imageUrl: "",
        description: "Essential JavaScript concepts for beginners",
        isPaid: false,
        price: null,
        discount: null,
        isActive: true,
        createdBy: 1,
        created_by_type: "admin",
        updatedBy: 1,
        updated_by_type: "admin",
        MainSections: [
            {
                mainTitle: "Variables & Data Types",
                createdBy: 1,
                created_by_type: "admin",
                updatedBy: 1,
                updated_by_type: "admin",
                Sections: [
                    {
                        title: "Variable Declaration",
                        contentType: "text",
                        content: "var, let, const - differences and usage",
                        sectionImage: null
                    },
                    {
                        title: "Data Types",
                        contentType: "text",
                        content: "Primitive types: string, number, boolean, null, undefined, symbol",
                        sectionImage: null
                    }
                ]
            },
            {
                mainTitle: "Functions",
                createdBy: 1,
                created_by_type: "admin",
                updatedBy: 1,
                updated_by_type: "admin",
                Sections: [
                    {
                        title: "Function Declaration",
                        contentType: "text",
                        content: "function myFunc() {} vs const myFunc = function() {}",
                        sectionImage: null
                    },
                    {
                        title: "Arrow Functions",
                        contentType: "text",
                        content: "const myFunc = () => {} - concise syntax and 'this' binding",
                        sectionImage: null
                    }
                ]
            }
        ]
    },
    {
        title: "Python for Data Science",
        imageUrl: "",
        description: "Python essentials for data analysis and visualization",
        isPaid: true,
        price: 9.99,
        discount: 0.00,
        isActive: true,
        createdBy: 2,
        created_by_type: "partner",
        updatedBy: 2,
        updated_by_type: "partner",
        MainSections: [
            {
                mainTitle: "NumPy Basics",
                createdBy: 2,
                created_by_type: "partner",
                updatedBy: 2,
                updated_by_type: "partner",
                Sections: [
                    {
                        title: "Arrays",
                        contentType: "text",
                        content: "Creating arrays: np.array(), np.zeros(), np.ones()",
                        sectionImage: null
                    },
                    {
                        title: "Array Operations",
                        contentType: "text",
                        content: "Element-wise operations, broadcasting, and matrix multiplication",
                        sectionImage: null
                    }
                ]
            },
            {
                mainTitle: "Pandas DataFrames",
                createdBy: 2,
                created_by_type: "partner",
                updatedBy: 2,
                updated_by_type: "partner",
                Sections: [
                    {
                        title: "DataFrame Creation",
                        contentType: "text",
                        content: "pd.DataFrame(), reading from CSV/Excel",
                        sectionImage: null
                    },
                    {
                        title: "Data Manipulation",
                        contentType: "text",
                        content: "Filtering, grouping, and aggregation methods",
                        sectionImage: null
                    }
                ]
            }
        ]
    },
    {
        title: "Linux Command Line",
        imageUrl: "",
        description: "Essential Linux commands for developers",
        isPaid: false,
        price: null,
        discount: null,
        isActive: true,
        createdBy: 1,
        created_by_type: "admin",
        updatedBy: 1,
        updated_by_type: "admin",
        MainSections: [
            {
                mainTitle: "File Operations",
                createdBy: 1,
                created_by_type: "admin",
                updatedBy: 1,
                updated_by_type: "admin",
                Sections: [
                    {
                        title: "Basic Commands",
                        contentType: "text",
                        content: "ls, cd, pwd, mkdir, rm, cp, mv",
                        sectionImage: null
                    },
                    {
                        title: "Permissions",
                        contentType: "text",
                        content: "chmod, chown, and understanding permission codes",
                        sectionImage: null
                    }
                ]
            },
            {
                mainTitle: "Process Management",
                createdBy: 1,
                created_by_type: "admin",
                updatedBy: 1,
                updated_by_type: "admin",
                Sections: [
                    {
                        title: "Process Commands",
                        contentType: "text",
                        content: "ps, top, kill, bg, fg, jobs",
                        sectionImage: null
                    },
                    {
                        title: "System Monitoring",
                        contentType: "text",
                        content: "df, du, free, uptime",
                        sectionImage: null
                    }
                ]
            }
        ]
    },
    {
        title: "React Hooks Guide",
        imageUrl: "",
        description: "Comprehensive guide to React Hooks",
        isPaid: true,
        price: 14.99,
        discount: 2.00,
        isActive: true,
        createdBy: 3,
        created_by_type: "partner",
        updatedBy: 3,
        updated_by_type: "partner",
        MainSections: [
            {
                mainTitle: "Basic Hooks",
                createdBy: 3,
                created_by_type: "partner",
                updatedBy: 3,
                updated_by_type: "partner",
                Sections: [
                    {
                        title: "useState",
                        contentType: "text",
                        content: "Managing state in functional components",
                        sectionImage: null
                    },
                    {
                        title: "useEffect",
                        contentType: "text",
                        content: "Side effects in functional components (replaces lifecycle methods)",
                        sectionImage: null
                    }
                ]
            },
            {
                mainTitle: "Advanced Hooks",
                createdBy: 3,
                created_by_type: "partner",
                updatedBy: 3,
                updated_by_type: "partner",
                Sections: [
                    {
                        title: "useContext",
                        contentType: "text",
                        content: "Accessing context without nesting",
                        sectionImage: null
                    },
                    {
                        title: "useReducer",
                        contentType: "text",
                        content: "Alternative to useState for complex state logic",
                        sectionImage: null
                    }
                ]
            }
        ]
    },
    {
        title: "SQL Quick Reference",
        imageUrl: "",
        description: "Essential SQL commands and syntax",
        isPaid: false,
        price: null,
        discount: null,
        isActive: true,
        createdBy: 1,
        created_by_type: "admin",
        updatedBy: 1,
        updated_by_type: "admin",
        MainSections: [
            {
                mainTitle: "CRUD Operations",
                createdBy: 1,
                created_by_type: "admin",
                updatedBy: 1,
                updated_by_type: "admin",
                Sections: [
                    {
                        title: "SELECT",
                        contentType: "text",
                        content: "SELECT * FROM table WHERE condition",
                        sectionImage: null
                    },
                    {
                        title: "INSERT, UPDATE, DELETE",
                        contentType: "text",
                        content: "Modifying data in tables",
                        sectionImage: null
                    }
                ]
            },
            {
                mainTitle: "Joins",
                createdBy: 1,
                created_by_type: "admin",
                updatedBy: 1,
                updated_by_type: "admin",
                Sections: [
                    {
                        title: "INNER JOIN",
                        contentType: "text",
                        content: "SELECT * FROM table1 INNER JOIN table2 ON table1.id = table2.id",
                        sectionImage: null
                    },
                    {
                        title: "LEFT/RIGHT JOIN",
                        contentType: "text",
                        content: "Including all rows from one table regardless of matches",
                        sectionImage: null
                    }
                ]
            }
        ]
    }
];

const defaultFeatureStatus = [
    { name: "cheatsheet", is_active: false },
    { name: "challenge_quest", is_active: false },
    { name: "daily_challenge", is_active: false },
    { name: "contest", is_active: false },
    { name: "maths_solver", is_active: false },
    { name: "interview_ai", is_active: false },
    { name: "learning_path_ai", is_active: false },
    { name: "do_your_own_course_ai", is_active: false },
    { name: "chatbot_ai", is_active: false },
    { name: "become_a_partner", is_active: false },
    { name: "paragraph_ai", is_active: false },
];

const axios = require('axios');
const State = require("./models/masters/state.js");
const Country = require("./models/masters/country.js");
const City = require("./models/masters/city.js");
const Role = require("./models/auth/RoleAndPermission/Role.js");
const Permission = require("./models/auth/RoleAndPermission/Permission.js");
const RolePermission = require("./models/auth/RoleAndPermission/RolePermission.js");
const Section = require("./models/cheat_sheet/cheat_sheet_content/section.js");
const MainSection = require("./models/cheat_sheet/cheat_sheet_content/mainsection.js");
const CheatSheet = require("./models/cheat_sheet/cheatsheet.js");
const About = require("./models/support/about.js");
const Contact = require("./models/support/contact.js");
const { PartnerActive } = require("./models/partner/partnerActive.js");
const insertDefaultContestData = require("./defaultCourseData/defaultContestData.js");
const Tier = require("./models/tier/tier.js");
const { FeatureStatus } = require("./models/masters/featureStatus.js");

const insertDefaultData = async () => {
    try {
        await sequelize.sync();

        await seedLocationsFromCSV();

        // const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,cca2,cca3,currencies,idd,timezones,region,subregion');
        // console.log("Countries API response received successfully");
        // const countries = response.data;

        // const countryData = countries.map((country) => ({
        //     name: country.name?.common,
        //     code: country.cca3 || country.cca2 || '', // model expects alpha-3
        //     currency: Object.keys(country.currencies || {})[0] || '',
        //     phone_code: country.idd?.root + (country.idd?.suffixes?.[0] || ''),
        //     timezone: country.timezones?.[0] || 'UTC',
        //     region: country.region || '',
        //     subregion: country.subregion || '',
        //     is_active: true,
        // }));

        // await Country.bulkCreate(countryData, { ignoreDuplicates: true });

        // for (let i = 1; i <= 50; i++) {
        //     const stateName = `State${i}`;
        //     const code = `S${i}`;
        //     const timezone = 'Asia/Kolkata';
        //     const countryId = i; // assuming 5 countries (IDs 1-5)

        //     await State.create({
        //         name: stateName,
        //         code: code,
        //         country_id: countryId,
        //         timezone: timezone,
        //         is_active: true,
        //     })
        // }

        // console.log('✅ 50 random states inserted successfully');

        // for (let i = 1; i <= 50; i++) {
        //     const cityName = `City${i}`;
        //     const code = `C${i}`;
        //     const timezone = 'Asia/Kolkata';
        //     const countryId = i; // assuming 5 countries (IDs 1-5)

        //     await City.create({
        //         name: cityName,
        //         code: code,
        //         state_id: countryId,
        //         timezone: timezone,
        //         is_active: true,
        //     })
        // }

        const defaultRoles = [
            { name: "Admin", description: "Full access to everything" },
            { name: "User Manager", description: "Manages system and users" },
            { name: "Content Manager", description: "Can manage content" },
            { name: "Analysis Manager", description: "Can only view data" },
            { name: "Partner", description: "Can Create Courses and Manage it" },
        ];

        const defaultPermissions = [
            { section: "Course", description: "Create a Course", action: "create" },
            { section: "Course", description: "Edit a Course", action: "edit" },
            { section: "Course", description: "Delete a Course", action: "delete" },
            { section: "Course", description: "View Course", action: "view" },
            { section: "Course", description: "Toggle Course status", action: "toggle" },

            { section: "Import Content", description: "Import Content", action: "create" },

            { section: "Course Category", description: "Create a Course Category", action: "create" },
            { section: "Course Category", description: "Edit a Course Category", action: "edit" },
            { section: "Course Category", description: "Delete a Course Category", action: "delete" },
            { section: "Course Category", description: "View Course Category", action: "view" },
            { section: "Course Category", description: "Toggle Course Category status", action: "toggle" },

            { section: "Challenge Category", description: "Create a Challenge Category", action: "create" },
            { section: "Challenge Category", description: "Edit a Challenge Category", action: "edit" },
            { section: "Challenge Category", description: "Delete a Challenge Category", action: "delete" },
            { section: "Challenge Category", description: "View Challenge Category", action: "view" },
            { section: "Challenge Category", description: "Toggle Challenge Category status", action: "toggle" },

            // === Admin Management ===
            { section: "Admin", description: "Create Admin", action: "create" },
            { section: "Admin", description: "Edit Admin", action: "edit" },
            { section: "Admin", description: "Delete Admin", action: "delete" },
            { section: "Admin", description: "View Admins", action: "view" },
            { section: "Admin", description: "Toggle Admin Status", action: "toggle" },

            // === User Management ===
            { section: "User", description: "Register User", action: "create" },
            { section: "User", description: "Login User", action: "view" },
            { section: "User", description: "Edit User Profile", action: "edit" },
            { section: "User", description: "Delete Profile Image", action: "delete" },
            { section: "User", description: "Logout User", action: "toggle" },

            { section: "Promo Code", description: "Generate Promo Code For Students", action: "create" },

            { section: "User Detail", description: "View enrolled courses", action: "view" },
            // { section: "User", description: "Google Login", action: "view" },
            // { section: "User", description: "View User by ID", action: "view" },
            // { section: "User", description: "Change Password", action: "edit" },

            // === User Challenge ===
            // { section: "User Challenge", description: "View All Challenges", action: "view" },
            // { section: "User Challenge", description: "View Enrolled Challenges", action: "view" },
            // { section: "User Challenge", description: "Start User Challenge", action: "create" },
            // { section: "User Challenge", description: "View Single Challenge", action: "view" },

            // === User Challenge Phase ===
            // { section: "User Challenge Phase", description: "Start User Challenge Phase", action: "create" },

            // === User Challenge Task ===
            // { section: "User Challenge Task", description: "Start Challenge Task", action: "create" },
            // { section: "User Challenge Task", description: "Check Task Answers", action: "edit" },

            // === Contest ===
            { section: "Contest", description: "Create Contest", action: "create" },
            { section: "Contest", description: "View Contest", action: "view" },
            { section: "Contest", description: "Edit Contest", action: "edit" },
            { section: "Contest", description: "Delete Contest", action: "delete" },
            { section: "Contest", description: "Toggle Contest Status", action: "toggle" },

            // === Contest Template ===
            { section: "Contest Template", description: "Create Contest Template", action: "create" },
            { section: "Contest Template", description: "View Contest Template", action: "view" },
            { section: "Contest Template", description: "Edit Contest Template", action: "edit" },
            { section: "Contest Template", description: "Delete Contest Template", action: "delete" },
            { section: "Contest Template", description: "Toggle Contest Template Status", action: "toggle" },

            // === Contest Activity ===
            { section: "Contest Activity", description: "Create Contest Activity", action: "create" },
            { section: "Contest Activity", description: "View Contest Activity", action: "view" },
            { section: "Contest Activity", description: "Edit Contest Activity", action: "edit" },
            { section: "Contest Activity", description: "Delete Contest Activity", action: "delete" },
            { section: "Contest Activity", description: "Toggle Contest Activity Status", action: "toggle" },

            // === Contest Prize ===
            { section: "Contest Prize", description: "Create Contest Prize", action: "create" },
            { section: "Contest Prize", description: "View Contest Prize", action: "view" },
            { section: "Contest Prize", description: "Edit Contest Prize", action: "edit" },
            { section: "Contest Prize", description: "Delete Contest Prize", action: "delete" },
            { section: "Contest Prize", description: "Toggle Contest Prize Status", action: "toggle" },

            // === Contest Quiz ===
            { section: "Contest Quiz", description: "Create Contest Quiz", action: "create" },
            { section: "Contest Quiz", description: "View Contest Quiz", action: "view" },
            { section: "Contest Quiz", description: "Edit Contest Quiz", action: "edit" },
            { section: "Contest Quiz", description: "Delete Contest Quiz", action: "delete" },
            { section: "Contest Quiz", description: "Toggle Contest Quiz Status", action: "toggle" },

            // === Contest Coding ===
            { section: "Contest Coding", description: "Create Contest Coding", action: "create" },
            { section: "Contest Coding", description: "View Contest Coding", action: "view" },
            { section: "Contest Coding", description: "Edit Contest Coding", action: "edit" },
            { section: "Contest Coding", description: "Delete Contest Coding", action: "delete" },
            { section: "Contest Coding", description: "Toggle Contest Coding Status", action: "toggle" },

            // === Challenge Quest ===
            { section: "Challenge Quest", description: "Create Challenge Quest", action: "create" },
            { section: "Challenge Quest", description: "View Challenge Quest", action: "view" },
            { section: "Challenge Quest", description: "Edit Challenge Quest", action: "edit" },
            { section: "Challenge Quest", description: "Delete Challenge Quest", action: "delete" },
            { section: "Challenge Quest", description: "Toggle CChallenge Quest Status", action: "toggle" },

            // === Challenge Phase ===
            { section: "Challenge Phase", description: "Create Challenge Phase", action: "create" },
            { section: "Challenge Phase", description: "View Challenge Phases", action: "view" },
            { section: "Challenge Phase", description: "Edit Challenge Phase", action: "edit" },
            { section: "Challenge Phase", description: "Delete Challenge Phase", action: "delete" },
            { section: "Challenge Phase", description: "Toggle Challenge Phase Status", action: "toggle" },

            // === Challenge Task ===
            { section: "Challenge Task", description: "Create Challenge Task", action: "create" },
            { section: "Challenge Task", description: "View Challenge Tasks", action: "view" },
            { section: "Challenge Task", description: "Edit Challenge Task", action: "edit" },
            { section: "Challenge Task", description: "Delete Challenge Task", action: "delete" },
            { section: "Challenge Task", description: "Toggle Challenge Task Status", action: "toggle" },

            // === Daily Challenge ===
            { section: "Daily Challenge", description: "Create Daily Challenge", action: "create" },
            { section: "Daily Challenge", description: "View All Daily Challenges", action: "view" },
            { section: "Daily Challenge", description: "Edit Daily Challenge", action: "edit" },
            { section: "Daily Challenge", description: "Toggle Daily Challenge Status", action: "toggle" },
            { section: "Daily Challenge", description: "Delete Daily Challenge", action: "delete" },

            // === Fill in the Blanks ===
            { section: "Fill-in-the-Blank Challenge", description: "Create Fill in the Blanks Challenge", action: "create" },
            { section: "Fill-in-the-Blank Challenge", description: "View All Fill in the Blanks Challenges", action: "view" },
            { section: "Fill-in-the-Blank Challenge", description: "Edit Fill in the Blanks Challenge", action: "edit" },
            { section: "Fill-in-the-Blank Challenge", description: "Toggle Fill in the Blanks Status", action: "toggle" },
            { section: "Fill-in-the-Blank Challenge", description: "Delete Fill in the Blanks Challenge", action: "delete" },

            // === User Challenge Extra ===
            // { section: "User Challenge", description: "Start Challenge by ID", action: "view" },
            // { section: "User Challenge", description: "Get Completed Challenge Dates", action: "view" },
            // { section: "User Challenge", description: "Check Challenge", action: "edit" },
            // { section: "User Challenge", description: "Assign Challenge to User", action: "create" },
            // { section: "User Challenge", description: "Check Assigned Challenge Today", action: "view" },
            // { section: "User Challenge", description: "View Challenge by Date", action: "view" },
            // { section: "User Challenge", description: "View User Challenge by ID", action: "view" },

            // === User Streak ===
            // { section: "User Streak", description: "View User Streak by ID", action: "view" },

            // === User Points ===
            // { section: "User Points", description: "Get User Points by ID", action: "view" },
            // { section: "User Points", description: "Update User Points by ID", action: "edit" },

            // === True/False Challenge ===
            { section: "True/False Challenge", description: "Create True/False Challenge", action: "create" },
            { section: "True/False Challenge", description: "View All True/False Challenges", action: "view" },
            { section: "True/False Challenge", description: "Edit True/False Challenge", action: "edit" },
            { section: "True/False Challenge", description: "Toggle True/False Challenge Status", action: "toggle" },
            { section: "True/False Challenge", description: "Delete True/False Challenge", action: "delete" },

            // === MCQ Challenge ===
            { section: "MCQ Challenge", description: "Create MCQ Challenge", action: "create" },
            { section: "MCQ Challenge", description: "View MCQ Challenge by ID", action: "view" },
            { section: "MCQ Challenge", description: "Edit MCQ Challenge", action: "edit" },
            { section: "MCQ Challenge", description: "Toggle MCQ Challenge Status", action: "toggle" },
            { section: "MCQ Challenge", description: "Delete MCQ Challenge", action: "delete" },

            { section: "MCQ Option Challenge", description: "Create MCQ Option", action: "create" },
            { section: "MCQ Option Challenge", description: "Edit MCQ Option", action: "edit" },
            { section: "MCQ Option Challenge", description: "Toggle MCQ Option Status", action: "toggle" },
            { section: "MCQ Option Challenge", description: "Delete MCQ Option", action: "delete" },

            // === Cheat Sheet ===
            { section: "Cheat Sheet", description: "Create Cheat Sheet", action: "create" },
            { section: "Cheat Sheet", description: "View All Cheat Sheets", action: "view" },
            { section: "Cheat Sheet", description: "Edit Cheat Sheet", action: "edit" },
            { section: "Cheat Sheet", description: "Delete Cheat Sheet", action: "delete" },
            { section: "Cheat Sheet", description: "Toggle Cheat Sheet Status", action: "toggle" },

            // === Cheat Sheet Main Section ===
            { section: "Cheat Sheet Main Section", description: "Create Main Section", action: "create" },
            { section: "Cheat Sheet Main Section", description: "View All Main Sections", action: "view" },
            { section: "Cheat Sheet Main Section", description: "Edit Main Section", action: "edit" },
            { section: "Cheat Sheet Main Section", description: "Toggle Main Section", action: "toggle" },
            { section: "Cheat Sheet Main Section", description: "Delete Main Section", action: "delete" },

            // === Cheat Sheet Section ===
            { section: "Cheat Sheet Section", description: "Create Section", action: "create" },
            { section: "Cheat Sheet Section", description: "View All Sections", action: "view" },
            { section: "Cheat Sheet Section", description: "Edit Section", action: "edit" },
            { section: "Cheat Sheet Section", description: "Delete Section", action: "delete" },

            { section: "Fill-in-the-Blank Generated", description: "Create Generated Question", action: "create" },
            { section: "Fill-in-the-Blank Generated", description: "View All Generated Questions", action: "view" },
            { section: "Fill-in-the-Blank Generated", description: "Edit Generated Question", action: "edit" },
            { section: "Fill-in-the-Blank Generated", description: "Delete Generated Question", action: "delete" },

            { section: "Multiple Choice Generated", description: "Create Generated Question", action: "create" },
            { section: "Multiple Choice Generated", description: "View All Generated Questions", action: "view" },
            { section: "Multiple Choice Generated", description: "Edit Generated Question", action: "edit" },
            { section: "Multiple Choice Generated", description: "Delete Generated Question", action: "delete" },

            { section: "True/False Generated", description: "Create Generated Question", action: "create" },
            { section: "True/False Generated", description: "View All Generated Questions", action: "view" },
            { section: "True/False Generated", description: "Edit Generated Question", action: "edit" },
            { section: "True/False Generated", description: "Delete Generated Question", action: "delete" },

            // Assignment Permissions
            { section: "Assignment", description: "Create an Assignment", action: "create" },
            { section: "Assignment", description: "Edit an Assignment", action: "edit" },
            { section: "Assignment", description: "Delete an Assignment", action: "delete" },
            { section: "Assignment", description: "View Assignment", action: "view" },

            // Matching Question Permissions
            { section: "Matching Question", description: "Create a Matching Question", action: "create" },
            { section: "Matching Question", description: "Edit a Matching Question", action: "edit" },
            { section: "Matching Question", description: "Delete a Matching Question", action: "delete" },
            { section: "Matching Question", description: "View Matching Question", action: "view" },

            // True/False Question Permissions
            { section: "True/False Question", description: "Create a True/False Question", action: "create" },
            { section: "True/False Question", description: "Edit a True/False Question", action: "edit" },
            { section: "True/False Question", description: "Delete a True/False Question", action: "delete" },
            { section: "True/False Question", description: "View True/False Question", action: "view" },

            // Fill-in-the-Blank Question Permissions
            { section: "Fill-in-the-Blank Question", description: "Create a Fill-in-the-Blank Question", action: "create" },
            { section: "Fill-in-the-Blank Question", description: "Edit a Fill-in-the-Blank Question", action: "edit" },
            { section: "Fill-in-the-Blank Question", description: "Delete a Fill-in-the-Blank Question", action: "delete" },
            { section: "Fill-in-the-Blank Question", description: "View Fill-in-the-Blank Question", action: "view" },

            // MCQs Question Permissions
            { section: "MCQs Question", description: "Create a MCQs Question", action: "create" },
            { section: "MCQs Question", description: "Edit a MCQs Question", action: "edit" },
            { section: "MCQs Question", description: "Delete a MCQs Question", action: "delete" },
            { section: "MCQs Question", description: "View MCQs Question", action: "view" },

            // Complete Sentence Question Permissions
            { section: "Complete Sentence Question", description: "Create a Complete Sentence Question", action: "create" },
            { section: "Complete Sentence Question", description: "Edit a Complete Sentence Question", action: "edit" },
            { section: "Complete Sentence Question", description: "Delete a Complete Sentence Question", action: "delete" },
            { section: "Complete Sentence Question", description: "View Complete Sentence Question", action: "view" },

            // AudioToScript Question Permissions
            { section: "Audio To Script Question", description: "Create an AudioToScript Question", action: "create" },
            { section: "Audio To Script Question", description: "Edit an AudioToScript Question", action: "edit" },
            { section: "Audio To Script Question", description: "Delete an AudioToScript Question", action: "delete" },
            { section: "Audio To Script Question", description: "View AudioToScript Question", action: "view" },

            // Quiz AudioToScript Question Permissions
            // { section: "Quiz AudioToScript Question", description: "Get AudioToScript Questions by Quiz", action: "view" },

            // BestOption Question Permissions
            { section: "Best Option Question", description: "Create a BestOption Question", action: "create" },
            { section: "Best Option Question", description: "Edit a BestOption Question", action: "edit" },
            { section: "Best Option Question", description: "Delete a BestOption Question", action: "delete" },
            { section: "Best Option Question", description: "View BestOption Question", action: "view" },

            // Quiz BestOption Question Permissions
            // { section: "Quiz BestOption Question", description: "Get BestOption Questions by Quiz", action: "view" },

            // // BestOption Response Permissions
            // { section: "BestOption Response", description: "Create a BestOption Response", action: "create" },
            // { section: "BestOption Response", description: "Edit a BestOption Response", action: "edit" },
            // { section: "BestOption Response", description: "Delete a BestOption Response", action: "delete" },
            // { section: "BestOption Response", description: "View BestOption Response", action: "view" },

            // DragDrop Question Permissions
            { section: "Drag Drop Question", description: "Create a DragDrop Question", action: "create" },
            { section: "Drag Drop Question", description: "Edit a DragDrop Question", action: "edit" },
            { section: "Drag Drop Question", description: "Delete a DragDrop Question", action: "delete" },
            { section: "Drag Drop Question", description: "View DragDrop Question", action: "view" },


            // Arrange the order quiz question
            { section: "Arrange Order", description: "Create Arrange Order Question", action: "create" },
            { section: "Arrange Order", description: "Edit Arrange Order Question", action: "edit" },
            { section: "Arrange Order", description: "Delete Arrange Order Question", action: "delete" },
            { section: "Arrange Order", description: "View Arrange Order Question", action: "view" },

            // Quiz Option Permissions
            { section: "Quiz Option", description: "Create a Quiz Option", action: "create" },
            { section: "Quiz Option", description: "Edit a Quiz Option", action: "edit" },
            { section: "Quiz Option", description: "Delete a Quiz Option", action: "delete" },
            { section: "Quiz Option", description: "View Quiz Option", action: "view" },

            // Quiz Question Permissions
            { section: "Quiz Question", description: "Create a Quiz Question", action: "create" },
            { section: "Quiz Question", description: "Edit a Quiz Question", action: "edit" },
            { section: "Quiz Question", description: "Delete a Quiz Question", action: "delete" },
            { section: "Quiz Question", description: "View Quiz Question", action: "view" },
            { section: "Quiz Question", description: "Update Quiz Question Status", action: "toggle" },

            // Quiz Permissions
            { section: "Quiz", description: "Create a Quiz", action: "create" },
            { section: "Quiz", description: "Edit a Quiz", action: "edit" },
            { section: "Quiz", description: "Delete a Quiz", action: "delete" },
            { section: "Quiz", description: "View Quiz", action: "view" },
            { section: "Quiz", description: "Update Quiz Status", action: "toggle" },

            // Real Word Question Permissions
            // { section: "RealWordQuestion", description: "Generate Random Real Word Quiz", action: "generate" },
            { section: "Real Word Question", description: "Create Real Word Questions", action: "create" },
            { section: "Real Word Question", description: "View All Real Word Questions", action: "view" },
            { section: "Real Word Question", description: "Update Real Word Question", action: "edit" },
            { section: "Real Word Question", description: "Delete Word from Real Word Question", action: "delete" },

            { section: "Summarize Passage Question", description: "Create Summarize Passage Question", action: "create" },
            { section: "Summarize Passage Question", description: "View All Summarize Passage Questions", action: "view" },
            { section: "Summarize Passage Question", description: "Update Summarize Passage Question", action: "edit" },
            { section: "Summarize Passage Question", description: "Delete Summarize Passage Question", action: "delete" },

            { section: "Text Based Quiz Text", description: "Create Text-Based Quiz Question", action: "create" },
            { section: "Text Based Quiz Text", description: "View All Text-Based Quiz Questions", action: "view" },
            { section: "Text Based Quiz Text", description: "Update Text-Based Quiz Question", action: "edit" },
            { section: "Text Based Quiz Text", description: "Delete Text-Based Quiz Question", action: "delete" },

            { section: "Topic Description", description: "Create Topic Description", action: "create" },
            { section: "Topic Description", description: "View All Topic Descriptions", action: "view" },
            { section: "Topic Description", description: "Update Topic Description", action: "edit" },
            { section: "Topic Description", description: "Delete Topic Description", action: "delete" },

            // === Course FAQ Management ===
            { section: "Course FAQ", description: "Create FAQ", action: "create" },
            { section: "Course FAQ", description: "View All FAQs", action: "view" },
            { section: "Course FAQ", description: "Update FAQ", action: "edit" },
            { section: "Course FAQ", description: "Delete FAQ", action: "delete" },

            // === Course FAQ Option Management ===
            { section: "Course FAQ Option", description: "Create FAQ Options", action: "create" },
            { section: "Course FAQ Option", description: "View All FAQ Options", action: "view" },
            { section: "Course FAQ Option", description: "Update FAQ Option", action: "edit" },
            { section: "Course FAQ Option", description: "Delete FAQ Option", action: "delete" },

            // === Module Management ===
            { section: "Module", description: "Create Module", action: "create" },
            { section: "Module", description: "View Modules", action: "view" },
            { section: "Module", description: "Update Module", action: "edit" },
            { section: "Module", description: "Delete Module", action: "delete" },
            { section: "Module", description: "Update Module Status", action: "toggle" },

            // === Session Management ===
            { section: "Session", description: "Create Session", action: "create" },
            { section: "Session", description: "View Sessions", action: "view" },
            { section: "Session", description: "Update Session", action: "edit" },
            { section: "Session", description: "Delete Session", action: "delete" },
            { section: "Session", description: "Update Session Status", action: "toggle" },

            // === Topic Content Management ===
            { section: "Topic Content", description: "Assign Content to Topic", action: "create" },
            { section: "Topic Content", description: "Remove Content from Topic", action: "delete" },
            { section: "Topic Content", description: "View Topic Content", action: "view" },

            // === Topic Management ===
            { section: "Topic", description: "Create Topic", action: "create" },
            { section: "Topic", description: "View Topics by Module ID", action: "view" },
            { section: "Topic", description: "Update Topic", action: "edit" },
            { section: "Topic", description: "Delete Topic", action: "delete" },
            { section: "Topic", description: "Update Topic Status", action: "toggle" },

            // === Wishlist Management ===
            // { section: "Wishlist", description: "Add to Wishlist", action: "create" },
            // { section: "Wishlist", description: "View Wishlist by User ID", action: "view" },
            // { section: "Wishlist", description: "Remove from Wishlist", action: "delete" },

            // === Enrollment Management ===
            // { section: "Enrollment", description: "Create Enrollment", action: "create" },
            // { section: "Enrollment", description: "View All Enrollments", action: "view" },
            // { section: "Enrollment", description: "Update Enrollment", action: "edit" },
            // { section: "Enrollment", description: "Delete Enrollment", action: "delete" },

            // { section: "Enrollment", description: "View Courses by User ID", action: "view" },
            // { section: "Enrollment", description: "View User Course by ID", action: "view" },
            // { section: "Enrollment", description: "View User Course Content", action: "view" },

            // === Payment Management ===
            { section: "Payment", description: "Create Payment", action: "create" },
            { section: "Payment", description: "View All Payments", action: "view" },
            // { section: "Payment", description: "View Payments by User ID", action: "view" },
            // { section: "Payment", description: "View Payment by ID", action: "view" },
            { section: "Payment", description: "Update Payment", action: "edit" },
            { section: "Payment", description: "Delete Payment", action: "delete" },

            // === Assignment Completion ===
            { section: "Assignment Extension", description: "Approve or Reject Assignment Extension", action: "edit" },

            // // === Assignment Response ===
            // { section: "AssignmentResponse", description: "Create Assignment Response", action: "create" },
            // { section: "AssignmentResponse", description: "View All Assignment Responses", action: "view" },
            // { section: "AssignmentResponse", description: "Update Assignment Response", action: "edit" },
            // { section: "AssignmentResponse", description: "Delete Assignment Response", action: "delete" },

            // // === Audio to Script Response ===
            // { section: "AudioToScriptResponse", description: "Create Audio to Script Response", action: "create" },
            // { section: "AudioToScriptResponse", description: "View All Audio to Script Responses", action: "view" },
            // { section: "AudioToScriptResponse", description: "Update Audio to Script Response", action: "edit" },
            // { section: "AudioToScriptResponse", description: "Delete Audio to Script Response", action: "delete" },

            // === Course Time Tracking ===
            // { section: "Course Time Tracking", description: "Start Course Session", action: "create" },
            // { section: "Course Time Tracking", description: "End Course Session", action: "edit" },
            // { section: "Course Time Tracking", description: "View Course Time Stats", action: "view" },

            // === Progress Tracking ===
            // { section: "ProgressTracking", description: "Check Topic Completion", action: "view" },
            // { section: "ProgressTracking", description: "Get Accessible Topics", action: "view" },
            // { section: "ProgressTracking", description: "Check Module Completion", action: "view" },
            // { section: "ProgressTracking", description: "Get Accessible Modules", action: "view" },
            // { section: "ProgressTracking", description: "Check Slide Completion", action: "view" },
            // { section: "ProgressTracking", description: "Complete Content", action: "create" },
            // { section: "ProgressTracking", description: "Complete Topic Slide", action: "create" },
            // { section: "ProgressTracking", description: "Check Course Completion", action: "view" },
            // { section: "ProgressTracking", description: "Get Module Completion Progress", action: "view" },

            // === Quiz Completion ===
            // { section: "QuizCompletion", description: "Create Quiz Completion", action: "create" },
            // { section: "QuizCompletion", description: "View All Quiz Completions", action: "view" },
            // { section: "QuizCompletion", description: "View Quiz Responses by Student ID", action: "view" },
            // { section: "QuizCompletion", description: "Update Quiz Completion", action: "update" },
            // { section: "QuizCompletion", description: "Delete Quiz Completion", action: "delete" },

            // === Quiz Response ===
            // { section: "Quiz Response", description: "Create Quiz Response", action: "create" },
            // { section: "Quiz Response", description: "View Quiz Response by ID", action: "view" },
            // { section: "Quiz Response", description: "Update Quiz Response", action: "edit" },
            // { section: "Quiz Response", description: "Delete Quiz Response", action: "delete" },

            // === Real Word Response ===
            // { section: "RealWordResponse", description: "Submit Real Word Response", action: "create" },
            // { section: "RealWordResponse", description: "View All Real Word Responses by Student", action: "view" },
            // { section: "RealWordResponse", description: "View Responses by Question ID", action: "view" },

            // === Summary Passage Response ===
            // { section: "SummaryPassageResponse", description: "Create Summary Passage Response", action: "create" },
            // { section: "SummaryPassageResponse", description: "View All Summary Passage Responses", action: "view" },
            // { section: "SummaryPassageResponse", description: "View Responses by Question ID", action: "view" },
            // { section: "SummaryPassageResponse", description: "View Responses by Student ID", action: "view" },
            // { section: "SummaryPassageResponse", description: "Update Summary Passage Response", action: "update" },
            // { section: "SummaryPassageResponse", description: "Delete Summary Passage Response", action: "delete" },

            { section: "City", description: "Create a new city", action: "create" },
            { section: "City", description: "Update an existing city", action: "edit" },
            { section: "City", description: "View all cities", action: "view" },
            { section: "City", description: "Toggle city status (active/inactive)", action: "toggle" },
            { section: "City", description: "Delete a city", action: "delete" },

            { section: "State", description: "Create a new state", action: "create" },
            { section: "State", description: "Update an existing state", action: "edit" },
            { section: "State", description: "View all states", action: "view" },
            { section: "State", description: "Toggle state status (active/inactive)", action: "toggle" },
            { section: "State", description: "Delete a state", action: "delete" },

            { section: "Country", description: "Create a new country", action: "create" },
            { section: "Country", description: "Update an existing country", action: "edit" },
            { section: "Country", description: "View all countries", action: "view" },
            { section: "Country", description: "Toggle country status (active/inactive)", action: "toggle" },
            { section: "Country", description: "Delete a country", action: "delete" },

            { section: "Tier", description: "Create a new counttierry", action: "create" },
            { section: "Tier", description: "Update an existing tier", action: "edit" },
            { section: "Tier", description: "View all tier", action: "view" },
            { section: "Tier", description: "Toggle tier status (active/inactive)", action: "toggle" },
            { section: "Tier", description: "Delete a tier", action: "delete" },

            { section: "Predefined Questions", description: "Create Predefined Question", action: "create" },
            { section: "Predefined Questions", description: "View All Predefined Questions", action: "view" },
            { section: "Predefined Questions", description: "Update Predefined Question", action: "edit" },
            { section: "Predefined Questions", description: "Delete Predefined Question", action: "delete" },

            { section: "Predefined Options", description: "Create Predefined Option", action: "create" },
            { section: "Predefined Options", description: "View All Predefined Options", action: "view" },
            { section: "Predefined Options", description: "Update Predefined Option", action: "edit" },
            { section: "Predefined Options", description: "Delete Predefined Option", action: "delete" },

            { section: "Quiz Predefined Questions", description: "Assign Predefined Question to Quiz", action: "create" },
            { section: "Quiz Predefined Questions", description: "View All Quiz Predefined Mappings", action: "view" },
            { section: "Quiz Predefined Questions", description: "Update Quiz Predefined Mapping", action: "edit" },
            { section: "Quiz Predefined Questions", description: "Remove Predefined Question from Quiz", action: "delete" },

            { section: "Reviews", description: "Create Review", action: "create" },
            { section: "Reviews", description: "View All Reviews", action: "view" },
            { section: "Reviews", description: "Update Review", action: "edit" },
            { section: "Reviews", description: "Delete Review", action: "delete" },

            { section: "Student FAQ Responses", description: "Create Student FAQ Response", action: "create" },
            { section: "Student FAQ Responses", description: "View All Student FAQ Responses", action: "view" },
            { section: "Student FAQ Responses", description: "Update Student FAQ Response", action: "edit" },
            { section: "Student FAQ Responses", description: "Delete Student FAQ Response", action: "delete" },

            // { section: "Student Status History", description: "Create Student Status History", action: "create" },
            // { section: "Student Status History", description: "View All Status History", action: "view" },
            // { section: "Student Status History", description: "Update Student Status History", action: "edit" },
            // { section: "Student Status History", description: "Delete Student Status History", action: "delete" },

            // { section: "Trials", description: "Create Trial", action: "create" },
            // { section: "Trials", description: "View Trials", action: "view" },
            // { section: "Trials", description: "Update Trial by Hash", action: "edit" },
            // { section: "Trials", description: "Delete Trial", action: "delete" },

            // { section: "Violations", description: "Create Violation", action: "create" },
            // { section: "Violations", description: "View All Violations", action: "view" },
            // { section: "Violations", description: "Update Violation", action: "edit" },
            // { section: "Violations", description: "Delete Violation", action: "delete" },

            { section: "Support", description: "Create Support Ticket", action: "create" },
            { section: "Support", description: "View All Support Tickets", action: "view" },
            { section: "Support", description: "Update Support Ticket", action: "edit" },
            { section: "Support", description: "Delete Support Ticket", action: "delete" },

            { section: "Support Reply", description: "Add Reply to Support Ticket", action: "create" },
            { section: "Support Reply", description: "Delete Support Reply", action: "delete" },

            // {section: "Contact" , description: "Create Contact", action: "create"},
            { section: "Contact", description: "View Contact", action: "view" },
            { section: "Contact", description: "Update Contact", action: "edit" },
            { section: "Contact", description: "Delete Contact", action: "delete" },

            { section: "About", description: "Create About", action: "create" },
            { section: "About", description: "View About", action: "view" },
            { section: "About", description: "Update About", action: "edit" },
            { section: "About", description: "Delete About", action: "delete" },
            { section: "About", description: "Toggle About", action: "toggle" },

            { section: "Role", description: "Create Role", action: "create" },
            { section: "Role", description: "View Role", action: "view" },
            { section: "Role", description: "Update Role", action: "edit" },
            { section: "Role", description: "Delete Role", action: "delete" },
            { section: "Role", description: "Toggle Role", action: "toggle" },

            { section: "Permission", description: "Create Permission", action: "create" },
            { section: "Permission", description: "View Permission", action: "view" },
            { section: "Permission", description: "Update Permission", action: "edit" },
            { section: "Permission", description: "Delete Permission", action: "delete" },

            { section: "Partner", description: "Create Partner", action: "create" },
            { section: "Partner", description: "View Partner", action: "view" },
            { section: "Partner", description: "Toggle Partner", action: "toggle" },
            { section: "Partner", description: "Delete Partner", action: "delete" },

            { section: "Partner Detail", description: "View Partner Detail", action: "view" },
            { section: "Partner Detail", description: "Update Partner Detail", action: "edit" },

            { section: "Partner Active", description: "Make become a partner active or inactive", action: "toggle" },



            { section: "Role Permission", description: "Create Role Permission", action: "create" },
            { section: "Role Permission", description: "View Role Permission", action: "view" },

            { section: "Terms Of Services", description: "Create Terms Of Services", action: "create" },
            { section: "Terms Of Services", description: "Update Terms Of Services", action: "edit" },
            { section: "Terms Of Services", description: "View Terms Of Services", action: "view" },

            { section: "Privacy Policy", description: "Create Privacy Policy", action: "create" },
            { section: "Privacy Policy", description: "Update Privacy Policy", action: "edit" },
            { section: "Privacy Policy", description: "Toggle Privacy Policy", action: "toggle" },
            { section: "Privacy Policy", description: "View Privacy Policy", action: "view" },

            { section: "Subscribe", description: "Toggle Subscribe Status", action: "toggle" },
            { section: "Subscribe", description: "View Subscribe", action: "view" },

            { section: "Social Media", description: "Update Social Media", action: "edit" },

            { section: "Footer", description: "Update Footer", action: "edit" },
            { section: "User Activity Logs", description: "View User Activity Logs", action: "view" },
            { section: "Student Course Tracking", description: "View Student Course Tracking", action: "view" },

            { section: "Feature Interest", description: "Create Feature Interest", action: "create" },
            { section: "Feature Interest", description: "View Feature Interest", action: "view" },
            { section: "Feature Interest", description: "Delete Feature Interest", action: "delete" },

            { section: "Feature Status", description: "Toggle Feature Status", action: "toggle" },

            { section: "Feature", description: "Toggle Feature Status", action: "toggle" },
            { section: "Feature", description: "view Feature Status", action: "view" },

            { section: "AI Course Generator", description: "Use AI Course Generator", action: "view" },
            { section: "AI Content Generator", description: "Use AI Content Generator", action: "view" },

            { section: "SEO Meta", description: "Create SEO Meta", action: "create" },
            { section: "SEO Meta", description: "View All SEO Meta", action: "view" },
            { section: "SEO Meta", description: "Update SEO Meta", action: "edit" },
            { section: "SEO Meta", description: "Delete SEO Meta", action: "delete" },
            { section: "SEO Meta", description: "Toggle SEO Meta Status", action: "toggle" },

            { section: "Landing Page FAQ", description: "Create Landing Page FAQ", action: "create" },
            { section: "Landing Page FAQ", description: "View Landing Page FAQ", action: "view" },
            { section: "Landing Page FAQ", description: "Update Landing Page FAQ", action: "edit" },
            { section: "Landing Page FAQ", description: "Delete Landing Page FAQ", action: "delete" },
            { section: "Landing Page FAQ", description: "Toggle Landing Page FAQ Status", action: "toggle" },

            { section: "Landing Page Statistics", description: "Create Landing Page Statistics", action: "create" },
            { section: "Landing Page Statistics", description: "View Landing Page Statistics", action: "view" },
            { section: "Landing Page Statistics", description: "Update Landing Page Statistics", action: "edit" },
            { section: "Landing Page Statistics", description: "Delete Landing Page Statistics", action: "delete" },
            { section: "Landing Page Statistics", description: "Toggle Landing Page Statistics Status", action: "toggle" },

            { section: "Landing Page Features", description: "Create Landing Page Features", action: "create" },
            { section: "Landing Page Features", description: "View Landing Page Features", action: "view" },
            { section: "Landing Page Features", description: "Update Landing Page Features", action: "edit" },
            { section: "Landing Page Features", description: "Delete Landing Page Features", action: "delete" },
            { section: "Landing Page Features", description: "Toggle Landing Page Features Status", action: "toggle" },

            { section: "Landing Page Testimonials", description: "Create Landing Page Testimonials", action: "create" },
            { section: "Landing Page Testimonials", description: "View Landing Page Testimonials", action: "view" },
            { section: "Landing Page Testimonials", description: "Update Landing Page Testimonials", action: "edit" },
            { section: "Landing Page Testimonials", description: "Delete Landing Page Testimonials", action: "delete" },
            { section: "Landing Page Testimonials", description: "Toggle Landing Page Testimonials Status", action: "toggle" },

            // { section: "AI Interview Settings", description: "Create AI Interview Settings", action: "create" },
            { section: "AI Interview Settings", description: "View AI Interview Settings", action: "view" },
            { section: "AI Interview Settings", description: "Update AI Interview Settings", action: "edit" },
            // { section: "AI Interview Settings", description: "Delete AI Interview Settings", action: "delete" },
            // { section: "AI Interview Settings", description: "Toggle AI Interview Settings Status", action: "toggle" },
        ];

        for (const role of defaultRoles) {
            await Role.findOrCreate({
                where: { name: role.name },
                defaults: role,
            });
        }

        // Insert Permissions
        for (const permission of defaultPermissions) {
            await Permission.findOrCreate({
                where: {
                    section: permission.section,
                    action: permission.action,
                },
                defaults: permission,
            });
        }

        for (let i = 1; i <= defaultPermissions.length; i++) {
            // Create RolePermission for roleId 1 and permissionId i
            const { success, data, error } = await RolePermission.findOrCreate({
                where: {
                    roleId: 1,
                    permissionId: i
                },
                defaults: { roleId: 1, permissionId: i },
            });
            if (!success) {
            }
        }

        for (let i = 1; i <= defaultPermissions.length; i++) {
            await RolePermission.findOrCreate({
                where: {
                    roleId: 5,
                    permissionId: i
                },
                defaults: { roleId: 5, permissionId: i },
            });
        }

        //now remove permmission of Admin , User and Partner from roleId
        const removePermissionsFromRole = async (roleId, sectionList) => {
            try {
                // Get all permissions with the specified sections
                const permissions = await Permission.findAll({
                    where: {
                        section: sectionList
                    }
                });

                // Get the permission IDs
                const permissionIds = permissions.map(permission => permission.id);

                // Delete the role permissions
                if (permissionIds.length > 0) {
                    await RolePermission.destroy({
                        where: {
                            roleId: roleId,
                            permissionId: permissionIds
                        }
                    });
                }
            } catch (error) {
                console.error("Error removing permissions:", error);
            }
        };

        // Remove specific permissions from Partner role (roleId 5)
        const sectionsToRemove = [
            "Admin",
            "User",
            "Promo Code",
            "City",
            "State",
            "Country",
            "Course Category",
            "Fill-in-the-Blank Challenge",
            "True/False Challenge",
            "MCQ Challenge",
            "MCQ Option Challenge",
            "Predefined Questions",
            "Predefined Options",
            "Quiz Predefined Questions",
            "Challenge Category",
            "Challenge Quest",
            "Challenge Phase",
            "Challenge Task",
            "Contest Template",
            "Contest",
            "Tier",
            "Feature",
            "Feature Status",
            "Feature Interest",
            "AI Course Generator",
            "AI Content Generator",
            "SEO Meta",
            "Daily Challenge",
            "Role",
            "Permission",
            "RolePermission",
            "Partner",
            "Support",
            "Support Reply",
            "About",
            "Contact",
            "Terms Of Services",
            "Privacy Policy",
            "Subscribe",
            "Social Media",
            "Footer",
            "User Activity Logs"
        ];

        await removePermissionsFromRole(5, sectionsToRemove);


        // Insert admin if not exists
        const existingAdmin = await Admin.findOne({
            where: { email: defaultAdmin.email }
        });
        if (!existingAdmin) {
            await Admin.create(defaultAdmin);
            console.log("Admin created successfully");
        }

        // Insert mobile admin if not exists
        const existingMobileAdmin = await Admin.findOne({
            where: { email: defaultMobileAdmin.email }
        });
        if (!existingMobileAdmin) {
            await Admin.create(defaultMobileAdmin);
            console.log("Mobile Admin created successfully");
        }

        // ── Default Difficulty Levels ──
        const DifficultyLevel = require("./models/tier/difficultyLevel.js");

        const defaultDifficultyLevels = [
            {
                name: "Beginner",
                description: "Ideal for newcomers. Courses with simpler structure and fewer modules.",
                created_by: 1,
                updated_by: 1,
                is_active: true,
            },
            {
                name: "Intermediate",
                description: "For learners with some experience. Moderate course complexity.",
                created_by: 1,
                updated_by: 1,
                is_active: true,
            },
            {
                name: "Advanced",
                description: "For experienced learners. Complex course structures with extensive content.",
                created_by: 1,
                updated_by: 1,
                is_active: true,
            },
        ];

        const createdDLs = [];
        for (const dl of defaultDifficultyLevels) {
            const [record] = await DifficultyLevel.findOrCreate({
                where: { name: dl.name },
                defaults: dl,
            });
            createdDLs.push(record);
        }
        console.log("✅ Default Difficulty Levels created/found");

        // ── Default Tiers (3 per difficulty level = 9 total) ──
        const dummyTiers = [
            // Beginner tiers
            {
                name: "basic",
                price: 49.0,
                max_sessions: 1,
                max_modules_per_session: 2,
                max_topics_per_module: 2,
                max_assignments_per_module: 1,
                max_quizzes_per_module: 1,
                created_by: 1,
                updated_by: 1,
                is_active: true,
                difficulty_level_id: createdDLs[0].id,
            },
            {
                name: "standard",
                price: 149.0,
                max_sessions: 2,
                max_modules_per_session: 2,
                max_topics_per_module: 3,
                max_assignments_per_module: 2,
                max_quizzes_per_module: 1,
                created_by: 1,
                updated_by: 1,
                is_active: true,
                difficulty_level_id: createdDLs[0].id,
            },
            {
                name: "premium",
                price: 299.0,
                max_sessions: 3,
                max_modules_per_session: 3,
                max_topics_per_module: 3,
                max_assignments_per_module: 2,
                max_quizzes_per_module: 2,
                created_by: 1,
                updated_by: 1,
                is_active: true,
                difficulty_level_id: createdDLs[0].id,
            },
            // Intermediate tiers
            {
                name: "basic",
                price: 199.0,
                max_sessions: 2,
                max_modules_per_session: 3,
                max_topics_per_module: 3,
                max_assignments_per_module: 2,
                max_quizzes_per_module: 1,
                created_by: 1,
                updated_by: 1,
                is_active: true,
                difficulty_level_id: createdDLs[1].id,
            },
            {
                name: "standard",
                price: 499.0,
                max_sessions: 3,
                max_modules_per_session: 3,
                max_topics_per_module: 4,
                max_assignments_per_module: 3,
                max_quizzes_per_module: 2,
                created_by: 1,
                updated_by: 1,
                is_active: true,
                difficulty_level_id: createdDLs[1].id,
            },
            {
                name: "premium",
                price: 799.0,
                max_sessions: 4,
                max_modules_per_session: 4,
                max_topics_per_module: 5,
                max_assignments_per_module: 3,
                max_quizzes_per_module: 2,
                created_by: 1,
                updated_by: 1,
                is_active: true,
                difficulty_level_id: createdDLs[1].id,
            },
            // Advanced tiers
            {
                name: "basic",
                price: 399.0,
                max_sessions: 3,
                max_modules_per_session: 4,
                max_topics_per_module: 4,
                max_assignments_per_module: 3,
                max_quizzes_per_module: 2,
                created_by: 1,
                updated_by: 1,
                is_active: true,
                difficulty_level_id: createdDLs[2].id,
            },
            {
                name: "standard",
                price: 799.0,
                max_sessions: 4,
                max_modules_per_session: 5,
                max_topics_per_module: 5,
                max_assignments_per_module: 4,
                max_quizzes_per_module: 3,
                created_by: 1,
                updated_by: 1,
                is_active: true,
                difficulty_level_id: createdDLs[2].id,
            },
            {
                name: "premium",
                price: 1499.0,
                max_sessions: 5,
                max_modules_per_session: 6,
                max_topics_per_module: 6,
                max_assignments_per_module: 5,
                max_quizzes_per_module: 3,
                created_by: 1,
                updated_by: 1,
                is_active: true,
                difficulty_level_id: createdDLs[2].id,
            },
        ];

        await Tier.bulkCreate(dummyTiers, { ignoreDuplicates: true });

        // Loop through each team member
        for (const member of teamMembers) {
            // Check if the team member already exists
            const existingMember = await About.findOne({
                where: { name: member.name },
            });

            // If the team member does not exist, create a new entry
            if (!existingMember) {
                await About.create({
                    name: member.name,
                    position: member.position,
                    description: member.description,
                    status: member.status || "active",
                    x: member.x,
                    instagram: member.instagram,
                    facebook: member.facebook,
                    email: member.email,
                    img: member.img,
                });
                console.log(`Team member ${member.name} created successfully.`);
            } else {
                // Optionally, update the existing member's details if needed
                await About.update(
                    {
                        position: member.position,
                        description: member.description,
                        status: member.status || "active",
                        x: member.x,
                        instagram: member.instagram,
                        facebook: member.facebook,
                        email: member.email,
                        img: member.img,
                    },
                    {
                        where: { name: member.name },
                    }
                );
                console.log(`Team member ${member.name} already exists and has been updated if necessary.`);
            }
        }

        //insert default contact 
        for (const contact of defaultContacts) {
            const existingContact = await Contact.findOne({
                where: { fullName: contact.fullName },
            });

            if (!existingContact) {
                await Contact.create(contact);
                console.log(`Contact from ${contact.fullName} created successfully.`);
            } else {
                // Optionally update if needed (based on changes)
                await Contact.update(contact, {
                    where: { fullName: contact.fullName },
                });
                console.log(`Contact from ${contact.fullName} already exists and was updated if necessary.`);
            }
        }

        await FeatureStatus.bulkCreate(defaultFeatureStatus, {
            ignoreDuplicates: true
        });

        // Insert default pertner is active
        for (const partner of defaultPartnerIsActive) {
            const existingPartner = await PartnerActive.findOne({
                where: { isActive: partner.isActive }   // check if same status exists
            });

            if (!existingPartner) {
                await PartnerActive.create(partner);
                console.log(`Partner with status "${partner.isActive}" created successfully`);
            } else {
                console.log(`Partner with status "${partner.isActive}" already exists`);
            }
        }

        // Insert users and collect newly created ones
        const newlyCreatedUsers = [];
        for (const userData of defaultUsers) {
            const existingUser = await User.findOne({ where: { email: userData.email } });
            if (!existingUser) {
                const user = await User.create(userData);
                const points = Math.floor(Math.random() * (200 - 50 + 1)) + 50;
                await UserPoints.create({ user_id: user.id, points, total_earned: points });
                await UserStreak.create({ user_id: user.id });
                newlyCreatedUsers.push(user);
            }
        }
        console.log("Users created successfully");
        // Seed activity logs for a subset (first 3) of created or existing users
        const seedTargetUsers = newlyCreatedUsers.slice(0, 3);
        if (seedTargetUsers.length) {
            await seedUserActivityLogs(seedTargetUsers);
        } else {
            // If no new users were created (already exist), still seed using fallback
            await seedUserActivityLogs();
        }

        // Insert default categories if they don't exist
        const categoryRecords = {};

        for (const categoryName of defaultCategories) {
            let category = await ChallengeCategory.findOne({ where: { category: categoryName } });
            if (!category) {
                category = await ChallengeCategory.create({ category: categoryName, created_by: 1, updated_by: 1 });
            }
            categoryRecords[categoryName] = category.id;
        }

        await insertDefaultContestData();

        for (const challengeData of challengesData) {
            const existingChallenge = await DailyChallenge.findOne({
                where: { title: challengeData.title }
            });

            if (!existingChallenge) {
                const challenge = await DailyChallenge.create({
                    title: challengeData.title,
                    description: challengeData.description,
                    category: categoryRecords[challengeData.category] || categoryRecords["Other"], // Default to Coding if not found
                    difficulty_level: challengeData.difficulty_level,
                    max_attempt: challengeData.max_attempt,
                    is_per_question_reward: challengeData.is_per_question_reward,
                    per_question_reward: challengeData.per_question_reward || 0,
                    points_reward: challengeData.points_reward || 0,
                    start_date: challengeData.start_date,
                    is_active: true
                });

                // await FillInTheBlanksChallenge.bulkCreate(challengeData.fillInTheBlanks.map(q => ({
                //     challenge_id: challenge.id,
                //     text: q.text,
                //     answers: q.answers
                // })));

                for (const mcq of challengeData.mcqs) {
                    const mcqEntry = await MCQChallenge.create({
                        challenge_id: challenge.id,
                        question_text: mcq.question_text
                    });

                    await MCQOptionChallenge.bulkCreate(mcq.options.map((option) => ({
                        mcq_id: mcqEntry.id,
                        option_text: option.option_text,
                        option_type: "text",
                        is_correct: option.is_correct
                    })));
                }
            }
        }

        // Insert challenges
        for (const challengeData of defaultChallenges) {
            const existingChallenge = await Challenge.findOne({
                where: { title: challengeData.title }
            });

            if (!existingChallenge) {
                const challenge = await Challenge.create({
                    title: challengeData.title,
                    description: challengeData.description,
                    category_id: categoryRecords[challengeData.category],
                    duration: challengeData.duration,
                    difficulty_level: challengeData.difficulty_level,
                    reward_points: challengeData.reward_points,
                    max_attempt: challengeData.max_attempt,
                    rules: challengeData.rules,
                    startDate: new Date(),
                    endDate: new Date(Date.now() + challengeData.duration * 24 * 60 * 60 * 1000),
                    is_active: true
                });

                // Insert phases for each challenge
                for (const phaseData of challengeData.phases) {
                    const phase = await ChallengePhase.create({
                        challenge_id: challenge.id,
                        phase_number: phaseData.phase_number,
                        title: phaseData.title,
                        description: phaseData.description,
                        tasks_count: phaseData.tasks.length,
                        auto_unlock: phaseData.auto_unlock || true,
                        unlock_condition: phaseData.unlock_condition || null,
                        bonus_reward: phaseData.bonus_reward || null,
                        is_final_phase: phaseData.is_final_phase || false,
                        is_active: true
                    });

                    // Insert tasks for each phase
                    for (const taskData of phaseData.tasks) {
                        const task = await ChallengeTask.create({
                            challenge_phase_id: phase.id,
                            title: taskData.title,
                            description: taskData.description,
                            order: taskData.order || 1,
                            difficulty_level: taskData.difficulty_level,
                            max_attempts: taskData.max_attempts,
                            reward_points: taskData.reward_points,
                            time_limit: taskData.time_limit,
                            is_mandatory: taskData.is_mandatory,
                            dependency_task_id: taskData.dependency_task_id || null,
                            is_active: true
                        });

                        // Insert True/False Questions
                        if (taskData.trueFalseQuestions?.length) {
                            for (const questionData of taskData.trueFalseQuestions) {
                                await TrueFalseChallenge.create({
                                    challenge_task_id: task.id,
                                    question: questionData.question,
                                    answer: questionData.answer
                                });
                            }
                        }

                        // Insert MCQ Questions
                        if (taskData.mcqQuestions?.length) {
                            for (const mcq of taskData.mcqQuestions) {
                                const mcqEntry = await MCQChallenge.create({
                                    challenge_task_id: task.id,
                                    question_text: mcq.question_text
                                });

                                await MCQOptionChallenge.bulkCreate(mcq.options.map(option => ({
                                    mcq_id: mcqEntry.id,
                                    option_text: option.option_text,
                                    option_type: "text",
                                    is_correct: option.is_correct
                                })));
                            }
                        }

                        // Insert Fill in the Blanks
                        if (taskData.fillInTheBlanks?.length) {
                            for (const fib of taskData.fillInTheBlanks) {
                                await FillInTheBlanksChallenge.create({
                                    challenge_task_id: task.id,
                                    text: fib.text,
                                    answers: fib.answers
                                });
                            }
                        }
                    }
                }
            }
        }

        // User Daily Challenge

        // Utility function to generate a random past date (within the last 30 days)
        function randomPastDate() {
            const daysAgo = Math.floor(Math.random() * 30); // up to 30 days ago
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            return date;
        }

        const userChallenge = await UserDailyChallenge.findAll();

        if (userChallenge.length <= 0) {
            const data = [];

            for (let i = 0; i < 15; i++) {
                const userId = Math.floor(Math.random() * 5) + 1; // user_id from 1 to 5
                const challengeId = Math.floor(Math.random() * 20) + 1; // challenge_id from 1 to 20
                const isCompleted = Math.random() < 0.3; // ~30% chance of completion
                data.push({
                    user_id: userId,
                    challenge_id: challengeId,
                    attempts: Math.floor(Math.random() * 5), // 0 to 5 attempts
                    is_completed: isCompleted,
                    completed_at: isCompleted ? new Date() : null,
                    points_earned: isCompleted ? Math.floor(Math.random() * 101) : 0, // 0 to 100 points
                    assigned_at: randomPastDate()
                });
            }

            await UserDailyChallenge.bulkCreate(data);
        }

        console.log("Challenge data inserted successfully.");

        for (const cheatSheetData of dummyCheatSheets) {
            // Extract MainSections to insert them after CheatSheet is created
            const mainSections = cheatSheetData.MainSections || [];
            delete cheatSheetData.MainSections;

            // Create CheatSheet
            const cheatSheet = await CheatSheet.create(cheatSheetData);

            for (const mainSectionData of mainSections) {
                // Extract Sections to insert them after MainSection is created
                const sections = mainSectionData.Sections || [];
                delete mainSectionData.Sections;

                // Create MainSection with reference to CheatSheet
                const mainSection = await MainSection.create({
                    ...mainSectionData,
                    cheatsheetId: cheatSheet.id
                });

                // Create all Sections with reference to MainSection
                for (const sectionData of sections) {
                    await Section.create({
                        ...sectionData,
                        mainSectionId: mainSection.id
                    });
                }
            }
        }

        // Insert Default Frontend FAQs

        const existingFrontendFaqs = await FrontendFaq.count();
        if (existingFrontendFaqs === 0) {
            await FrontendFaq.bulkCreate(defaultFrontendFAQs);
            console.log("Default Frontend FAQs inserted successfully.");
        }

        // Insert Default Frontend Statistics
        const existingFrontendStats = await FrontendStatistics.count();
        if (existingFrontendStats === 0) {
            await FrontendStatistics.bulkCreate(defaultFrontendStatistics.map((stat, i) => ({
                ...stat,
                is_active: true,
                sequence_no: i + 1,
                created_by: 1,
                updated_by: 1
            })));
            console.log("Default Frontend Statistics inserted successfully.");
        }

        // Insert Default Frontend Features
        const existingFrontendFeatures = await FrontendFeatures.count();
        if (existingFrontendFeatures === 0) {
            await FrontendFeatures.bulkCreate(defaultFrontendFeatures.map((feature, i) => ({
                ...feature,
                is_active: true,
                sequence_no: i + 1,
                created_by: 1,
                updated_by: 1
            })));
            console.log("Default Frontend Features inserted successfully.");
        }

        // Insert Default Interview Settings
        const existingFeatureSettings = await FeatureSettings.count();
        if (existingFeatureSettings === 0) {
            await FeatureSettings.bulkCreate(defaultFeatureSettings);
            console.log("Default Feature Settings inserted successfully.");
        }

        // Insert Default Company Logos and Testimonials
        const existingLogos = await CompanyLogo.count();
        if (existingLogos === 0) {
            const insertedLogos = await CompanyLogo.bulkCreate(defaultCompanyLogos);
            const logoMap = insertedLogos.reduce((acc, logo) => {
                acc[logo.name] = logo.id;
                return acc;
            }, {});

            const testimonialsToInsert = defaultTestimonials.map(t => {
                const { company_name, ...rest } = t;
                return {
                    ...rest,
                    company_id: logoMap[company_name] || null
                };
            });

            await Testimonial.bulkCreate(testimonialsToInsert);
            console.log("Default Company Logos and Testimonials inserted successfully.");
        }

        console.log('Dummy data inserted successfully!');

    } catch (error) {
        console.error("Error inserting default data:", error);
    }
}

module.exports = insertDefaultData;
