const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const puppeteer = require('puppeteer');
const path = require('path');
const handlebars = require('handlebars');

const LearningPath = require('../../models/aiLearningPath/learning_path');
const { callProcedure } = require('../../utils/procedure/callProcedure');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const extractJSON = (text) => {
    try {
        // Try to parse as-is first
        return JSON.parse(text);
    } catch (e) {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[1].trim());
            } catch (e2) {
                // Continue to next method
            }
        }

        // Try to find JSON object in text (starts with { and ends with })
        const objectMatch = text.match(/\{[\s\S]*\}/);
        if (objectMatch) {
            try {
                return JSON.parse(objectMatch[0]);
            } catch (e3) {
                // Continue to next method
            }
        }

        // Try to sanitize and parse
        try {
            const sanitized = text
                .replace(/[\u0000-\u001F]+/g, ' ') // Remove control characters
                .replace(/\\(?!["\\/bfnrtu])/g, '\\\\') // Fix escape sequences
                .replace(/\n/g, '\\n') // Handle newlines in strings
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t');

            // Try to extract JSON again after sanitizing
            const sanitizedMatch = sanitized.match(/\{[\s\S]*\}/);
            if (sanitizedMatch) {
                return JSON.parse(sanitizedMatch[0]);
            }
        } catch (e4) {
            throw new Error('Could not parse JSON response');
        }

        throw new Error('No valid JSON found in response');
    }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 60000) => {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Check if it's a rate limit / too many requests error
            const isRateLimit = error.message?.includes('429') ||
                error.message?.includes('too many requests') ||
                error.status === 429 ||
                error.code === 429;

            if (!isRateLimit || i === maxRetries - 1) {
                throw error; // Re-throw if not rate limit or out of retries
            }

            // Exponential backoff with jitter
            const delay = (baseDelay) * Math.pow(2, i) + Math.random() * 1000;
            await sleep(delay);
        }
    }

    throw lastError;
};

const generateRoadmapPDF = async (roadmapData, nextStepsData, goal) => {
    let browser;

    try {

        // Read HTML template
        const templatePath = path.join(__dirname, '../template/roadmap-template.html');
        let htmlTemplate;

        // try {
        //     htmlTemplate = fs.readFileSync(templatePath, 'utf8');
        // } catch (err) {
        //     htmlTemplate = getDefaultRoadmapTemplate();
        // }

        htmlTemplate = getDefaultRoadmapTemplate();

        // Register Handlebars helper for adding numbers
        handlebars.registerHelper('add', function (a, b) {
            return a + b;
        });

        // Compile template with Handlebars
        const template = handlebars.compile(htmlTemplate);

        // Prepare data for template
        const templateData = {
            goal: goal,
            roadmap: roadmapData,
            nextSteps: nextStepsData,
            generatedDate: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            generatedTime: new Date().toLocaleTimeString()
        };

        // Render HTML with actual data
        const finalHTML = template(templateData);

        // Launch Puppeteer with additional arguments for better performance
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--disable-web-security', // Disable CORS issues
                '--disable-features=IsolateOrigins,site-per-process'
            ]
        });

        const page = await browser.newPage();

        // Set viewport for A4 size at 96 DPI
        await page.setViewport({ width: 1123, height: 794 });

        // Set timeout for all operations
        page.setDefaultTimeout(60000);
        page.setDefaultNavigationTimeout(60000);

        // Block unnecessary resources to speed up loading
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            // Block fonts, images, and other resources that might cause delays
            const resourceType = request.resourceType();
            if (resourceType === 'font' || resourceType === 'image' || resourceType === 'media') {
                request.abort();
            } else {
                request.continue();
            }
        });

        // Set the HTML content with a better waitUntil strategy
        await page.setContent(finalHTML, {
            waitUntil: 'domcontentloaded', // Changed from 'networkidle0' to 'domcontentloaded'
            timeout: 30000
        });

        // Add a small delay to ensure rendering is complete
        await page.evaluate(() => {
            return new Promise(resolve => {
                // Force a reflow
                document.body.offsetHeight;
                setTimeout(resolve, 1000);
            });
        });

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            },
            pageRanges: '1-'
        });

        // Create filename with sessionId and timestamp
        const sessionId = roadmapData.sessionId || Date.now();
        const fileName = `roadmap_${sessionId}_${Date.now()}.pdf`;

        // Build final path
        const uploadDir = path.join(__dirname, "../../uploads/roadmaps");
        const finalPath = path.join(uploadDir, fileName);

        // Ensure directory exists
        fs.mkdirSync(uploadDir, { recursive: true });

        // Save PDF to file
        fs.writeFileSync(finalPath, pdfBuffer);

        return `/roadmaps/${fileName}`;

    } catch (error) {
        console.error('❌ Error generating roadmap PDF:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

const getDefaultRoadmapTemplate = () => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>{{goal}} Roadmap</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Inter', sans-serif;
                    line-height: 1.5;
                    color: #1f2937;
                    background: #fff;
                    padding: 40px;
                    font-size: 11px;
                    -webkit-print-color-adjust: exact;
                }
                
                .header {
                    margin-bottom: 20px;
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }
                .header h1 {
                    color: #002322;
                    font-size: 24px;
                    margin-bottom: 5px;
                }
                .header p { color: #00BB6E; font-size: 12px; font-weight: 600; }
                .header-meta { color: #6b7280; font-size: 10px; }

                .section { margin-bottom: 20px; page-break-inside: avoid; }
                .section-title {
                    font-size: 14px;
                    font-weight: 700;
                    color: #002322;
                    border-bottom: 2px solid #00BB6E;
                    padding-bottom: 5px;
                    margin-bottom: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .card {
                    background: #fff;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    padding: 12px;
                    margin-bottom: 10px;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }
                .card-title {
                    font-size: 11px;
                    font-weight: 700;
                    color: #00BB6E;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 8px;
                    border-bottom: 1px solid #F0FBF6;
                    padding-bottom: 4px;
                }
                
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
                
                h3 { font-size: 12px; color: #002322; margin-bottom: 6px; font-weight: 600; }
                p { margin-bottom: 6px; color: #374151; }
                ul { padding-left: 16px; margin-bottom: 8px; }
                li { margin-bottom: 3px; color: #4b5563; }
                
                .chip {
                    display: inline-block;
                    background: #F0FBF6;
                    color: #002322;
                    border: 1px solid #00BB6E;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 9px;
                    font-weight: 600;
                    margin-right: 4px;
                    margin-bottom: 4px;
                }
                
                .stat-box {
                    text-align: center;
                    padding: 8px;
                    background: #F0FBF6;
                    border: 1px solid #00BB6E;
                    border-radius: 6px;
                }
                .stat-label { font-size: 9px; color: #002322; text-transform: uppercase; font-weight: 600; }
                .stat-value { font-size: 14px; font-weight: 700; color: #00BB6E; }

                .timeline-item {
                    position: relative;
                    padding-left: 15px;
                    margin-bottom: 8px;
                }
                .timeline-item:before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 5px;
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #00BB6E;
                }
                
                .resource-item {
                    font-size: 10px;
                    margin-bottom: 6px;
                    padding-bottom: 6px;
                    border-bottom: 1px dashed #e5e7eb;
                }
                .resource-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
                
                @media print {
                    body { padding: 20px; }
                    .section { page-break-inside: avoid; }
                    .grid-2, .grid-3 { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <h1>{{goal}}</h1>
                    <p>Your Personalized Path to Mastery</p>
                </div>
                <div style="text-align: right;">
                    <p class="header-meta">Generated: {{generatedDate}} at {{generatedTime}}</p>
                </div>
            </div>

            <!-- Quick Stats -->
            {{#if nextSteps.quickSummary}}
            <div class="section">
                <div class="grid-3">
                    <div class="stat-box">
                        <div class="stat-label">Duration</div>
                        <div class="stat-value">{{nextSteps.quickSummary.totalJourneyTime}}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Daily Effort</div>
                        <div class="stat-value">{{nextSteps.quickSummary.dailyCommitment}}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Success Rate</div>
                        <div class="stat-value">{{nextSteps.quickSummary.successProbability}}</div>
                    </div>
                </div>
            </div>
            {{/if}}

            <!-- Executive Summary -->
            {{#if roadmap.executiveSummary}}
            <div class="section">
                <div class="section-title">📋 Strategic Overview</div>
                
                <div class="card" style="margin-bottom: 12px;">
                    <p><strong>Goal Analysis:</strong> {{roadmap.executiveSummary.goalOverview}}</p>
                    <p><strong>Timeline Reality:</strong> {{roadmap.executiveSummary.timelineReality}}</p>
                    {{#if roadmap.executiveSummary.personalizedAssessment}}
                        <p><strong>Assessment:</strong> {{roadmap.executiveSummary.personalizedAssessment}}</p>
                    {{/if}}
                </div>

                <div class="grid-3">
                    {{#if roadmap.executiveSummary.competitiveAdvantages}}
                    <div class="card">
                        <div class="card-title">Your Advantages</div>
                        <ul>
                            {{#each roadmap.executiveSummary.competitiveAdvantages}}
                                <li>{{this}}</li>
                            {{/each}}
                        </ul>
                    </div>
                    {{/if}}
                    
                    <div class="card">
                        <div class="card-title">Success Factors</div>
                        <ul>
                            {{#each roadmap.executiveSummary.keySuccessFactors}}
                                <li>{{this}}</li>
                            {{/each}}
                        </ul>
                    </div>
                    
                    <div class="card">
                        <div class="card-title">Unique Challenges</div>
                        <ul>
                            {{#each roadmap.executiveSummary.uniqueChallenges}}
                                <li>{{this}}</li>
                            {{/each}}
                            {{#unless roadmap.executiveSummary.uniqueChallenges}}
                                <li>None identified</li>
                            {{/unless}}
                        </ul>
                    </div>
                </div>
            </div>
            {{/if}}

            <!-- Goal Deep Dive -->
            {{#if roadmap.goalDetails}}
            <div class="section">
                <div class="section-title">🎯 Goal Deep Dive</div>
                <div class="card">
                    <p><strong>What it Involves:</strong> {{roadmap.goalDetails.whatItInvolves}}</p>
                </div>
                <div class="grid-2">
                    <div class="card">
                        <div class="card-title">Required Skills</div>
                        <div>
                            {{#each roadmap.goalDetails.skillsRequired}}
                                <span class="chip">{{this}}</span>
                            {{/each}}
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-title">Knowledge Areas</div>
                        <ul>
                            {{#each roadmap.goalDetails.knowledgeAreas}}
                                <li>{{this}}</li>
                            {{/each}}
                        </ul>
                    </div>
                </div>
                <div class="grid-2">
                    {{#if roadmap.goalDetails.certifications.length}}
                    <div class="card">
                        <div class="card-title">Rec. Certifications</div>
                        {{#each roadmap.goalDetails.certifications}}
                            <div class="resource-item">
                                • <strong>{{this}}</strong>
                            </div>
                        {{/each}}
                    </div>
                    {{/if}}
                    
                    {{#if roadmap.goalDetails.careerPathways.length}}
                    <div class="card">
                        <div class="card-title">Future Pathways</div>
                        <div>
                            {{#each roadmap.goalDetails.careerPathways}}
                                <span class="chip">{{this}}</span>
                            {{/each}}
                        </div>
                    </div>
                    {{/if}}
                </div>
            </div>
            {{/if}}

            <!-- Learning Path - SHOW ALL PHASES -->
            {{#if roadmap.learningPath.phases}}
            <div class="section">
                <div class="section-title">🎓 Learning Path</div>
                {{#each roadmap.learningPath.phases}}
                <div style="margin-bottom: 25px; page-break-inside: avoid;">
                    <h3 style="background:#F0FBF6; padding:8px; border-radius:4px; border-left:4px solid #00BB6E;">
                        Phase {{add @index 1}}: {{phaseName}} <span style="font-weight:400; color:#002322; font-size:11px; margin-left:10px;">({{duration}})</span>
                    </h3>
                    
                    <div class="grid-2" style="margin-top:10px;">
                        <div class="card">
                            <div class="card-title">Objectives & Knowledge</div>
                            <ul>
                                {{#each objectives}}
                                    <li>{{this}}</li>
                                {{/each}}
                            </ul>
                            <div style="margin-top:8px;">
                                {{#each knowledgeToGain}}
                                    <span class="chip">{{this}}</span>
                                {{/each}}
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-title">Schedule & Strategy</div>
                            
                            <div style="margin-top:8px;">
                                {{#each practicalProjects}}
                                    <div style="font-size:10px; margin-bottom:8px; background:#fafafa; border:1px solid #eee; padding:6px; border-radius:4px;">
                                        <div style="font-weight:700; color:#00BB6E; margin-bottom:2px;">{{#if projectName}}{{projectName}}{{else}}{{this}}{{/if}}</div>
                                        {{#if expectedOutcome}}
                                            <div style="color:#4b5563; font-style:italic; margin-bottom:4px;">Outcome: {{expectedOutcome}}</div>
                                        {{/if}}
                                    </div>
                                {{/each}}
                            </div>
                        </div>
                    </div>
                    
                    <div class="grid-2">
                        <div class="card">
                            <div class="card-title">Core Activities</div>
                            {{#each keyActivities}}
                                <div class="timeline-item">{{this}}</div>
                            {{/each}}
                        </div>
                        <div class="card">
                            <div class="card-title">Skills to Acquire</div>
                            <div>
                                {{#each skillsToAcquire}}
                                    <span class="chip">{{this}}</span>
                                {{/each}}
                            </div>
                        </div>
                    </div>
                </div>
                {{/each}}
            </div>
            {{/if}}

            <!-- Strategy & Challenges -->
            <div class="section">
                <div class="section-title">🛡️ Strategy & Support</div>
                <div class="grid-2">
                    {{#if roadmap.practiceStrategy}}
                    <div class="card">
                        <div class="card-title">Practice Strategy</div>
                        {{#if roadmap.practiceStrategy.skillBuilding.dailyPractice}}
                            <p><strong>Daily:</strong> {{roadmap.practiceStrategy.skillBuilding.dailyPractice}}</p>
                        {{/if}}
                        {{#if roadmap.practiceStrategy.assessmentMethods}}
                            <div style="margin-top:5px;">
                                <strong>Assessments:</strong> 
                                {{#each roadmap.practiceStrategy.assessmentMethods}}
                                    {{methodName}}{{#unless @last}}, {{/unless}}
                                {{/each}}
                            </div>
                        {{/if}}
                    </div>
                    {{/if}}
                    
                    {{#if roadmap.overcomingChallenges}}
                    <div class="card">
                        <div class="card-title">Challenges</div>
                        {{#each roadmap.overcomingChallenges.commonObstacles}}
                            <div style="margin-bottom:4px; font-size:10px;">
                                • <strong>{{obstacle}}</strong>: {{resolutionStrategy}}
                            </div>
                        {{/each}}
                    </div>
                    {{/if}}
                </div>
                
                <div class="grid-2">
                    {{#if roadmap.mentorshipAndNetworking}}
                    <div class="card">
                        <div class="card-title">Networking</div>
                        <p style="font-size:10px;">{{roadmap.mentorshipAndNetworking.findingMentors.approachStrategy}}</p>
                        <div style="margin-top:5px;">
                            {{#each roadmap.mentorshipAndNetworking.peerCommunities}}
                                <span class="chip">{{communityName}}</span>
                            {{/each}}
                        </div>
                    </div>
                    {{/if}}
                    
                    {{#if roadmap.budgetOptimization}}
                    <div class="card">
                        <div class="card-title">Budget Smart</div>
                        {{#if roadmap.budgetOptimization.freeResources.length}}
                        <div style="margin-bottom:6px;">
                            <strong>Free Resources:</strong>
                            <ul>
                                {{#each roadmap.budgetOptimization.freeResources}}
                                    <li>{{this}}</li>
                                {{/each}}
                            </ul>
                        </div>
                        {{/if}}
                        {{#if roadmap.budgetOptimization.costSavingTips.length}}
                        <div style="margin-top:6px; border-top:1px dashed #eee; padding-top:6px;">
                            <strong>Smart Saving Tips:</strong>
                            <ul>
                                {{#each roadmap.budgetOptimization.costSavingTips}}
                                    <li>{{this}}</li>
                                {{/each}}
                            </ul>
                        </div>
                        {{/if}}
                    </div>
                    {{/if}}
                </div>
            </div>

            <!-- Resources - SHOW ALL RESOURCES -->
            {{#if roadmap.resourceLibrary}}
            <div class="section">
                <div class="section-title">📚 Resource Library</div>
                <div class="grid-3">
                    {{#if roadmap.resourceLibrary.essentialBooks.length}}
                    <div class="card">
                        <div class="card-title">Books</div>
                        {{#each roadmap.resourceLibrary.essentialBooks}}
                            <div class="resource-item">
                                • <strong>{{title}}</strong> by {{author}}
                                <div style="margin-top:2px; margin-bottom:2px;">
                                    {{#if difficulty}}
                                        <span style="background:#eee; color:#555; padding:1px 4px; border-radius:3px; font-size:8px;">{{difficulty}}</span>
                                    {{/if}}
                                </div>
                                {{#if purchaseLink}}
                                    <a href="{{purchaseLink}}" target="_blank" style="color:#00BB6E; text-decoration:none;">View Book →</a>
                                {{/if}}
                            </div>
                        {{/each}}
                    </div>
                    {{/if}}
                    
                    {{#if roadmap.resourceLibrary.onlinePlatforms.length}}
                    <div class="card">
                        <div class="card-title">Platforms</div>
                        {{#each roadmap.resourceLibrary.onlinePlatforms}}
                            <div class="resource-item">
                                • {{platformName}}
                                <div style="margin-top:2px; margin-bottom:2px;">
                                    {{#if priceRange}}
                                        <span style="background:#eee; color:#555; padding:1px 4px; border-radius:3px; font-size:8px;">{{priceRange}}</span>
                                    {{/if}}
                                </div>
                                {{#if platformUrl}}
                                    <a href="{{platformUrl}}" target="_blank" style="color:#00BB6E; text-decoration:none;">Visit Platform →</a>
                                {{/if}}
                            </div>
                        {{/each}}
                    </div>
                    {{/if}}
                    
                    {{#if roadmap.resourceLibrary.youtubeChannels.length}}
                    <div class="card">
                        <div class="card-title">YouTube</div>
                        {{#each roadmap.resourceLibrary.youtubeChannels}}
                            <div class="resource-item">
                                • {{channelName}}
                                {{#if channelUrl}}
                                    <br><a href="{{channelUrl}}" target="_blank" style="color:#00BB6E; text-decoration:none;">Watch Channel →</a>
                                {{/if}}
                            </div>
                        {{/each}}
                    </div>
                    {{/if}}
                    
                    {{#if roadmap.resourceLibrary.blogs.length}}
                    <div class="card">
                        <div class="card-title">Blogs</div>
                        {{#each roadmap.resourceLibrary.blogs}}
                            <div class="resource-item">
                                • {{blogName}}
                                {{#if blogUrl}}
                                    <br><a href="{{blogUrl}}" target="_blank" style="color:#00BB6E; text-decoration:none;">Read Blog →</a>
                                {{/if}}
                            </div>
                        {{/each}}
                    </div>
                    {{/if}}
                </div>
            </div>
            {{/if}}

            <!-- Success Metrics & Next Steps -->
            <div class="section">
                <div class="section-title">🚀 Execution Plan</div>
                
                <div class="grid-2">
                    <div class="card">
                        <div class="card-title">Immediate Actions</div>
                        {{#each nextSteps.immediateActions}}
                            <div style="margin-bottom:6px; font-size:10px;">
                                <strong>{{add @index 1}}. {{action}}</strong>
                                <div style="color:#6b7280;">Outcome: {{expectedOutcome}}</div>
                            </div>
                        {{/each}}
                    </div>
                    
                    <div class="card">
                        <div class="card-title">Weekly Goals Preview</div>
                        {{#each nextSteps.weeklyGoals}}
                            <div style="margin-bottom:8px;">
                                <strong>Week {{week}}:</strong>
                                <ul style="margin-top:2px;">
                                    {{#each goals}}
                                        <li style="font-size:9px;">{{this}}</li>
                                    {{/each}}
                                </ul>
                            </div>
                        {{/each}}
                    </div>
                </div>
            </div>
            
            <div class="header" style="border-top:1px solid #eee; border-bottom:none; margin-top:30px; padding-top:20px;">
                <p style="margin:0 auto; color:#6b7280; font-size:10px; font-weight:400;">Excel with Queekies • Your Journey Begins Now</p>
            </div>
        </body>
        </html>
    `;
}

// Step 1: Get initial user goal and generate relevant questions
const initializeLearningPath = async (req, res, next) => {
    try {
        const { goal } = req.body;

        const user_id = req.user?.id;

        const { success, data, error } = await callProcedure("getUserDailyFeatureCount", [user_id, "learning_path"]);
        if (!success) return next(error);
        const { success: sLimit, data: dLimit, error: eLimit } = await callProcedure("getFeatureSettings", ["learning_path"]);
        if (!sLimit) return next(eLimit);

        const featureDetails = data[0];

        if (dLimit[0]?.limit && featureDetails?.count >= dLimit[0]?.limit) {
            return res.status(409).json({
                error: 'Your Usage Limit is Reached.',
                success: false
            });
        }

        if (!goal) {
            return res.status(400).json({
                error: 'Learning goal is required',
                success: false
            });
        }

        const session = await LearningPath.create({
            user_id: req.user?.id,
            goal,
            status: "initialized",
            current_step: 1
        });

        const model = genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
            tools: [{
                google_search: {}
            }]
        });

        const prompt = `Please search for comprehensive information about "${goal}" to understand what type of goal this is and what it involves. This could be:
        - An exam preparation goal (e.g. JEE, UPSC, GMAT, IELTS, a university entrance exam)
        - A career transition goal (e.g. becoming a data scientist, switching to product management)
        - A skill development goal (e.g. web development, machine learning, graphic design)
        - A personal development goal (e.g. public speaking, leadership)
        - A fitness/health goal
        - A creative/artistic goal
        - A business/entrepreneurship goal
        - An academic goal (e.g. studying at a university abroad or domestically, pursuing a specific degree)
        - A certification goal
        - Any other personal or professional objective

        Based on your search results, analyze the goal thoroughly, then generate a CONTEXT-SPECIFIC assessment questionnaire.

        CRITICAL RULE FOR assessmentQuestions:
        - You MUST generate 6 to 8 questions that are SPECIFIC and RELEVANT to the exact goal the user described ("${goal}").
        - Do NOT ask generic questions like "What is your experience level?" or "What is your motivation?" unless they are genuinely the most informative for THIS goal.
        - Instead, ask questions whose answers will meaningfully change the roadmap you produce.
        - Examples of goal-specific thinking:
            * If the goal is about studying at a university or college: ask about which country/city they are targeting, what degree/field they want, whether they have taken entrance exams (SAT/ACT/IELTS/TOEFL/GRE/GMAT), their current academic standing (GPA or percentage), their budget range for tuition and living, and whether they are looking for scholarships.
            * If the goal is about an entrance exam (JEE, NEET, UPSC, CAT, etc.): ask which edition/year they are targeting, their current school class or academic level, which subjects they find hardest, how many hours they currently study, whether they attend coaching, and their target score or percentile.
            * If the goal is about a career switch or job: ask about their current role, what specific job title they are aiming for, which companies or industries interest them, whether they are looking for local or remote/international roles, and their target salary range.
            * If the goal is about learning a technical skill (programming, design, etc.): ask what they already know in this domain, what they want to build or create with this skill, whether they want to freelance or get a job, and which tools or languages/frameworks interest them.
            * If the goal mentions a specific budget or lifestyle condition (e.g. "with $20,000"), make sure to ask follow-up questions contextualised to that constraint.
        - Each option must be a real, meaningful choice — not filler text.
        - The question category should reflect what dimension is being assessed (e.g. "target_country", "exam_readiness", "budget_for_tuition", "current_class", "preferred_tech_stack").

        Create a JSON response with the following structure:
        {
            "goalAnalysis": {
                "goalTitle": "specific goal title",
                "goalType": "exam/career/skill/personal/fitness/creative/business/academic/certification/other",
                "description": "detailed description of what this goal involves",
                "complexity": "beginner/intermediate/advanced/expert",
                "timeFrameEstimate": "typical time needed to achieve this goal",
                "requirements": {
                    "prerequisites": ["prerequisite1", "prerequisite2"],
                    "skills": ["required skill1", "required skill2"],
                    "resources": ["resource type1", "resource type2"],
                    "tools": ["tool1", "tool2"],
                    "qualifications": ["if any qualifications needed"]
                },
                "pathways": {
                    "primary": "main pathway to achieve this goal",
                    "alternative": ["alternative approach1", "alternative approach2"],
                    "fastTrack": "quickest way to achieve this goal",
                    "comprehensive": "most thorough approach"
                },
                "outcomes": {
                    "immediateOutcomes": ["immediate benefit1", "immediate benefit2"],
                    "longTermBenefits": ["long term benefit1", "long term benefit2"],
                    "careerImpact": "how this affects career prospects",
                    "personalGrowth": "personal development aspects",
                    "marketValue": "market/industry value"
                },
                "challenges": {
                    "commonChallenges": ["challenge1", "challenge2"],
                    "difficultyLevel": "easy/moderate/challenging/very challenging",
                    "timeCommitment": "daily/weekly time commitment needed",
                    "financialInvestment": "typical cost involved"
                },
                "successMetrics": {
                    "quantitative": ["measurable metric1", "measurable metric2"],
                    "qualitative": ["qualitative indicator1", "qualitative indicator2"],
                    "milestones": ["milestone1", "milestone2"]
                },
                "industryContext": {
                    "currentTrends": ["trend1", "trend2"],
                    "marketDemand": "current market demand/relevance",
                    "futureProspects": "future outlook",
                    "competitionLevel": "level of competition"
                },
                "topResources": {
                    "courses": [
                        { "name": "Specific Course Name", "provider": "Platform like Coursera/Udemy/edX" }
                    ],
                    "youtubeChannels": [
                        { "name": "Channel Name", "focus": "What they teach best" }
                    ],
                    "books": [
                        { "title": "Specific Book Title", "author": "Author Name" }
                    ]
                }
            },
            "assessmentQuestions": [
                {
                    "id": 1,
                    "question": "<GOAL-SPECIFIC question — replace this with a REAL question tailored to '${goal}'>",
                    "options": ["<specific option 1>", "<specific option 2>", "<specific option 3>", "<specific option 4>"],
                    "category": "<goal-specific category>"
                }
            ]
        }

        The assessmentQuestions array must contain 6–8 entries, each uniquely relevant to the goal "${goal}".
        
        Make sure to include specific and current information based on your search results about the goal.
        
        IMPORTANT: 
        1. Return ONLY valid JSON - no markdown formatting, no code blocks, no explanatory text before or after
        2. Ensure all strings are properly escaped
        3. Do not include trailing commas
        4. Use double quotes for strings, not single quotes
        5. Ensure all JSON is complete and properly closed
        6. If you cannot provide complete information for any field, use empty array [] or empty string "" but keep the structure intact`;

        // const result = await retryWithBackoff(async () => {
        //     await sleep(5000);
        //     return await model.generateContent(prompt);
        // }, 3); // 3 retries, starting with 2 second delay

        await sleep(5000);
        const result = await model.generateContent(prompt);

        const response = await result.response;
        const content = response.text();

        let parsedData;
        try {
            parsedData = extractJSON(content);
        } catch (parseError) {
            return next(parseError)
        }

        await session.update({
            goal_analysis: parsedData.goalAnalysis,
            current_step: 1.5,
            questions: parsedData.assessmentQuestions?.map(q => ({
                ...q,
                type: "initial",
                step: 1,
                answer: null
            }))
        });

        return res.json({
            message: 'Goal analysis and assessment questions generated successfully',
            data: {
                goal,
                goalAnalysis: parsedData.goalAnalysis,
                assessmentQuestions: parsedData.assessmentQuestions,
                sessionId: session.id || Date.now().toString(),
                step: 1
            },
            success: true
        });

    } catch (error) {
        next(error);
    }
};

function sanitizeJSONString(jsonString) {
    // Remove invalid escape sequences (like \ followed by a non-escape character)
    return jsonString.replace(/\\(?!["\\/bfnrtu])/g, '');
}

// Step 2: Process user responses and generate additional specific questions
const processUserResponses = async (req, res, next) => {
    try {
        const { sessionId, goal, responses, step, goalType } = req.body;

        if (!sessionId || !goal || !responses) {
            return res.status(400).json({
                error: 'Session ID, goal, and responses are required',
                success: false
            });
        }

        const session = await LearningPath.findOne({
            where: {
                user_id: req.user?.id,
                id: sessionId
            },
        })

        const existing = session.questions;

        const updatedQuestions = existing.map(q => ({
            ...q,
            answer: responses[q.id] || q.answer
        }));

        const model = genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
            tools: [{
                google_search: {}
            }]
        });

        // Build a human-readable Q&A summary from the question objects (passed in body) or raw responses
        const questionKeys = Object.keys(responses);
        const qaSummary = questionKeys.map(key => `Q${key}: ${responses[key]}`).join('\n');

        const prompt = `
        The user is working toward the goal: "${goal}"

        They have already answered an initial assessment. Here are their exact question-answer pairs:
        ${qaSummary}

        Based on THIS SPECIFIC user profile, now search for targeted information and generate:
        1. Highly specific follow-up questions that BRANCH based on their actual answers above.
        2. A preliminary insight analysis that references what they said specifically.

        RULES FOR followUpQuestions:
        - Generate 3–5 follow-up questions.
        - Each question must directly build on one or more of the user's answers above.
        - Do NOT repeat any question that was already essentially asked in the initial assessment.
        - For example:
            * If the user said they want to study abroad → ask which specific countries they are considering, whether they have taken required language proficiency tests (IELTS/TOEFL/PTE), and how they plan to fund tuition vs living expenses.
            * If the user mentioned a tight budget → ask which free or subsidised scholarship programs they are aware of, and whether they are open to part-time work or Assistantship programs.
            * If the user said they are a complete beginner → ask what foundational material they have already tried, and what their biggest learning blocker is.
            * If the user said they prefer self-paced learning → ask what time of day they study best and whether they have a dedicated study space.
        - Options must be realistic, specific, and meaningful for the goal "${goal}".

        RULES FOR preliminaryInsights:
        - "personalizedApproach" must describe a concrete recommended approach TAILORED to this specific user's answers (not generic).
        - "potentialChallenges" must list challenges THIS person specifically will face based on their profile.
        - "leverageableStrengths" must list actual strengths visible from their answers (e.g. large budget, flexible schedule, prior domain exposure).
        - "recommendedFocus" must list the 3–4 most impactful areas for THIS person to focus on first.
        - "timelineRealism" must evaluate their implied or stated timeline against reality.
        - "budgetOptimization" must give specific budget advice relevant to their stated situation.
        - "supportNeeds" must describe what kind of guidance will best fit them.

        Return this exact JSON structure:
        {
            "followUpQuestions": [
                {
                    "id": 9,
                    "question": "specific question that branches from the user's prior answers",
                    "options": ["specific option1", "specific option2", "specific option3", "specific option4"],
                    "category": "specific_category",
                    "reasoning": "why this question is critical given what the user answered"
                }
            ],
            "preliminaryInsights": {
                "personalizedApproach": "concrete recommended approach tailored to this specific user",
                "potentialChallenges": ["challenge specific to their profile"],
                "leverageableStrengths": ["strength visible from their answers"],
                "recommendedFocus": ["top priority area 1", "top priority area 2", "top priority area 3"],
                "timelineRealism": "honest assessment of their timeline vs reality",
                "budgetOptimization": "specific advice on how to best use their stated budget",
                "supportNeeds": "what kind of support or guidance will help them most"
            },
            "quickWins": [
                {
                    "action": "immediate action they can take this week",
                    "timeRequired": "time needed",
                    "expectedOutcome": "what they will achieve",
                    "resources": ["specific resource needed for this action"]
                }
            ],
            "readyForRoadmap": true
        }
        
        IMPORTANT: 
        1. Return ONLY valid JSON - no markdown formatting, no code blocks, no explanatory text before or after
        2. Ensure all strings are properly escaped
        3. Do not include trailing commas
        4. Use double quotes for strings, not single quotes
        5. Ensure all JSON is complete and properly closed
        6. If you cannot provide complete information for any field, use empty array [] or empty string "" but keep the structure intact`;

        // const result = await retryWithBackoff(async () => {
        //     return await model.generateContent(prompt);
        // }, 3);

        await sleep(5000)
        const result = await model.generateContent(prompt);

        const response = await result.response;
        const content = response.text();

        let parsedData;
        try {
            parsedData = extractJSON(content);
        } catch (parseError) {
            return next(parseError);
        }

        const followups = parsedData.followUpQuestions.map(q => ({
            ...q,
            type: "followup",
            step: 2,
            answer: null
        }));

        const finalQuestions = [...updatedQuestions, ...followups];

        await session.update({
            questions: finalQuestions,
            preliminary_insights: parsedData.preliminaryInsights,
            current_step: 2.5,
            status: "in_progress"
        });

        return res.json({
            message: 'Follow-up questions generated successfully',
            data: {
                sessionId,
                goal,
                followUpQuestions: parsedData.followUpQuestions,
                preliminaryInsights: parsedData.preliminaryInsights,
                quickWins: parsedData.quickWins || [],
                readyForRoadmap: parsedData.readyForRoadmap,
                step: step + 1
            },
            success: true
        });

    } catch (error) {
        next(error);
    }
};

// Step 3: Generate comprehensive universal learning roadmap
const generateComprehensiveUniversalRoadmap = async (req, res, next) => {
    try {
        const {
            sessionId,
            goal,
            allResponses,
            userProfile,
            goalType
        } = req.body;

        if (!sessionId || !goal || !allResponses) {
            return res.status(400).json({
                error: 'Session ID, goal, and all responses are required',
                success: false
            });
        }

        const session = await LearningPath.findOne({
            where: {
                user_id: req.user?.id,
                id: sessionId
            },
        })

        const existing = session.questions;

        const updatedQuestions = existing.map(q => ({
            ...q,
            answer: allResponses[q.id] || q.answer
        }));

        const model = genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
            tools: [{
                google_search: {}
            }]
        });

        const prompt = `
        Research "${goal}" comprehensively using current, authoritative sources. Focus on:

        **Core Research Areas:**
        - Current industry standards and best practices (2024-2025)
        - Evidence-based learning methodologies and proven frameworks
        - Market demand analysis and career trajectory data
        - Expert-validated resources and tools
        - Active communities and professional networks
        - Recognized certification programs with industry acceptance
        - Success case studies with measurable outcomes
        - Common failure patterns and mitigation strategies
        - Performance metrics and assessment benchmarks

        **Resource Verification Requirements:**
        Find and verify functional links for:
        - Primary learning platforms (Coursera, Udemy, edX, LinkedIn Learning)
        - Official documentation and authoritative websites
        - Industry-standard tools and software (with trial/free tiers)
        - Active professional communities (Reddit, Discord, Stack Overflow, industry forums)
        - Certification bodies and their official programs
        - Open-source resources and repositories
        - Measurable success stories with attribution
        - Free/low-cost alternatives to premium resources

        **User Context:**
        ${JSON.stringify(allResponses, null, 2)}

        **Output Requirements:**
        Create a personalized roadmap using this exact JSON structure, ensuring all recommendations are:
        1. Directly relevant to the user's current skill level and constraints
        2. Supported by verified, working links
        3. Prioritized by impact and feasibility
        4. Adapted to user's available time and budget
        5. Measurable with specific success criteria

        {
            "executiveSummary": {
                "goalOverview": "Evidence-based overview of goal requirements and scope",
                "personalizedAssessment": "User-specific gap analysis and readiness evaluation",
                "timelineReality": "Realistic timeline based on user constraints and industry benchmarks",
                "successProbability": "Data-driven probability assessment with confidence factors",
                "keySuccessFactors": ["factor1", "factor2", "factor3"],
                "uniqueChallenges": ["user-specific obstacles based on profile"],
                "competitiveAdvantages": ["user strengths that accelerate progress"]
            },
            "goalDetails": {
                "whatItInvolves": "Concrete breakdown of deliverables and competencies",
                "skillsRequired": ["verified essential skills", "secondary skills", "advanced skills"],
                "knowledgeAreas": ["foundational concepts", "applied knowledge", "specialized areas"],
                "practicalExperience": "Specific hands-on requirements with measurable outcomes",
                "certifications": ["industry-recognized credentials with ROI data"],
                "industryStandards": "Current benchmarks and performance expectations",
                "marketRelevance": "2024-2025 market data and future projections",
                "careerPathways": ["entry-level paths", "mid-level transitions", "senior opportunities"]
            },
            "learningPath": {
                "phases": [
                    {
                        "phaseName": "Foundation Phase",
                        "duration": "specific timeframe based on user availability",
                        "objectives": ["measurable objective1", "measurable objective2"],
                        "keyActivities": ["activity with time estimate", "activity with deliverable"],
                        "skillsToAcquire": ["skill with proficiency level", "skill with assessment method"],
                        "knowledgeToGain": ["concept with application", "theory with practice"],
                        "practicalProjects": ["project with portfolio value", "project with skill demonstration"],
                        "assessmentMethods": ["specific measurement criteria", "benchmark standards"],
                        "resources": {
                            "books": [
                                {
                                    "title": "exact title",
                                    "author": "author name",
                                    "relevance": "specific application to user's goal",
                                    "purchaseLink": "verified working URL",
                                    "price": "current price range",
                                    "priority": "High/Medium/Low with justification"
                                }
                            ],
                            "onlineResources": [
                                {
                                    "resourceName": "exact resource name",
                                    "type": "course/tutorial/documentation/certification",
                                    "provider": "verified provider",
                                    "url": "verified working URL",
                                    "cost": "exact pricing or 'free'",
                                    "timeCommitment": "specific hours/weeks",
                                    "difficulty": "beginner/intermediate/advanced with prerequisites"
                                }
                            ],
                            "tools": [
                                {
                                    "toolName": "exact tool name",
                                    "purpose": "specific use case in learning path",
                                    "websiteUrl": "verified working URL",
                                    "cost": "exact pricing structure",
                                    "alternatives": ["free alternative", "budget alternative"]
                                }
                            ],
                            "communities": [
                                {
                                    "communityName": "exact community name",
                                    "platform": "specific platform",
                                    "url": "verified working URL",
                                    "size": "current member count",
                                    "activityLevel": "high/medium/low with evidence",
                                    "focus": "specific discussion topics relevant to goal"
                                }
                            ]
                        },
                        "dailySchedule": {
                            "recommendedHours": "specific hours based on user availability",
                            "timeAllocation": {
                                "theory": "percentage with rationale",
                                "practice": "percentage with rationale",
                                "revision": "percentage with rationale",
                                "projects": "percentage with rationale"
                            },
                            "weeklyPlan": "specific day-by-day structure"
                        },
                        "milestones": [
                            {
                                "milestone": "specific, measurable milestone",
                                "targetDate": "realistic date based on user schedule",
                                "successCriteria": "objective measurement criteria",
                                "reward": "meaningful reward suggestion"
                            }
                        ]
                    }
                ]
            },
            "resourceLibrary": {
                "essentialBooks": [
                    {
                        "title": "exact title",
                        "author": "author name",
                        "category": "specific category",
                        "difficulty": "level with prerequisites",
                        "pages": "page count",
                        "rating": "verified rating with source",
                        "purchaseLink": "verified working URL",
                        "price": "current price",
                        "keyTakeaways": ["specific takeaway1", "specific takeaway2"],
                        "bestFor": "specific user type/situation"
                    }
                ],
                "onlinePlatforms": [
                    {
                        "platformName": "exact platform name",
                        "platformUrl": "verified working URL",
                        "specialization": "specific area of expertise",
                        "courseCount": "relevant course count",
                        "priceRange": "current pricing",
                        "certificationOffered": "yes/no with details",
                        "bestCourses": ["course1 with URL", "course2 with URL"],
                        "instructorQuality": "verified quality metrics"
                    }
                ],
                "youtubeChannels": [
                    {
                        "channelName": "exact channel name",
                        "channelUrl": "verified working URL",
                        "subscribers": "current subscriber count",
                        "focus": "specific teaching focus",
                        "videoQuality": "verified quality assessment",
                        "updateFrequency": "posting schedule",
                        "bestPlaylists": ["playlist1 with URL", "playlist2 with URL"],
                        "instructorBackground": "verified credentials"
                    }
                ],
                "podcastsAndAudiobooks": [
                    {
                        "name": "exact name",
                        "host": "host name and credentials",
                        "platform": "specific platform",
                        "url": "verified working URL",
                        "episodeCount": "current episode count",
                        "averageLength": "typical duration",
                        "bestEpisodes": ["episode1 with specific value", "episode2 with specific value"]
                    }
                ],
                "blogs": [
                    {
                        "blogName": "exact blog name",
                        "blogUrl": "verified working URL",
                        "author": "author name and credentials",
                        "postFrequency": "posting schedule",
                        "expertise": "verified expertise areas",
                        "mustReadPosts": ["post1 with URL", "post2 with URL"]
                    }
                ],
                "mobileApps": [
                    {
                        "appName": "exact app name",
                        "platform": "iOS/Android/Both",
                        "downloadUrl": "verified app store URL",
                        "rating": "current rating with review count",
                        "features": ["specific feature1", "specific feature2"],
                        "cost": "exact pricing",
                        "bestFor": "specific use case"
                    }
                ],
                "certificationPrograms": [
                    {
                        "certificationName": "exact certification name",
                        "provider": "official certifying body",
                        "websiteUrl": "verified working URL",
                        "cost": "exact certification cost",
                        "duration": "specific time commitment",
                        "difficulty": "level with prerequisites",
                        "industryRecognition": "verified recognition level",
                        "prerequisites": ["specific prerequisite1", "specific prerequisite2"],
                        "examFormat": "detailed exam structure"
                    }
                ]
            },
            "practiceStrategy": {
                "skillBuilding": {
                    "dailyPractice": "specific routine adapted to user schedule",
                    "progressTracking": "measurable tracking methods",
                    "practiceProjects": [
                        {
                            "projectName": "specific project name",
                            "difficulty": "level with prerequisites",
                            "timeRequired": "specific time estimate",
                            "skillsUsed": ["skill1", "skill2"],
                            "resources": ["resource1 with URL", "resource2 with URL"],
                            "expectedOutcome": "measurable outcome"
                        }
                    ]
                },
                "assessmentMethods": [
                    {
                        "methodName": "specific assessment method",
                        "frequency": "optimal frequency",
                        "toolsNeeded": ["tool1 with URL", "tool2 with URL"],
                        "metrics": ["measurable metric1", "measurable metric2"],
                        "benchmarks": "industry-standard benchmarks"
                    }
                ],
                "feedbackSources": [
                    {
                        "sourceName": "specific source name",
                        "type": "peer/mentor/automated/community",
                        "howToAccess": "step-by-step access method",
                        "cost": "exact cost",
                        "responseTime": "typical response time"
                    }
                ]
            },
            "mentorshipAndNetworking": {
                "findingMentors": {
                    "whereLook": ["platform1 with URL", "platform2 with URL"],
                    "approachStrategy": "specific approach methodology",
                    "whatToOffer": "value proposition based on user profile",
                    "platformLinks": ["verified URL1", "verified URL2"]
                },
                "peerCommunities": [
                    {
                        "communityName": "exact community name",
                        "platform": "specific platform",
                        "joinUrl": "verified working URL",
                        "memberCount": "current member count",
                        "activityLevel": "activity level with evidence",
                        "benefits": ["specific benefit1", "specific benefit2"],
                        "howToEngage": "effective participation strategy"
                    }
                ],
                "networkingEvents": [
                    {
                        "eventType": "specific event type",
                        "whereToFind": "platforms/websites with URLs",
                        "frequencyAttend": "optimal attendance frequency",
                        "preparationTips": ["actionable tip1", "actionable tip2"],
                        "followUpStrategy": "systematic follow-up approach"
                    }
                ]
            },
            "progressTracking": {
                "trackingMethods": [
                    {
                        "methodName": "specific tracking method",
                        "toolsNeeded": ["tool1 with URL", "tool2 with URL"],
                        "frequency": "optimal tracking frequency",
                        "metricsToTrack": ["quantifiable metric1", "quantifiable metric2"],
                        "analysisMethod": "data analysis approach"
                    }
                ],
                "milestoneChecks": [
                    {
                        "checkpointName": "specific checkpoint name",
                        "timing": "specific timing based on user schedule",
                        "assessmentCriteria": ["measurable criteria1", "measurable criteria2"],
                        "adjustmentStrategy": "specific adjustment protocols"
                    }
                ],
                "selfAssessment": {
                    "frequency": "optimal self-assessment frequency",
                    "questions": ["specific question1", "specific question2"],
                    "scoringMethod": "objective scoring system",
                    "improvementPlanning": "systematic improvement approach"
                }
            },
            "overcomingChallenges": {
                "commonObstacles": [
                    {
                        "obstacle": "specific obstacle relevant to user profile",
                        "whyItHappens": "root cause analysis",
                        "preventionStrategy": "proactive prevention approach",
                        "resolutionStrategy": "reactive resolution approach",
                        "resources": ["helpful resource1 with URL", "helpful resource2 with URL"]
                    }
                ],
                "motivationMaintenance": {
                    "techniques": ["evidence-based technique1", "evidence-based technique2"],
                    "rewardSystem": "personalized reward system",
                    "accountabilityPartners": "specific accountability strategies",
                    "motivationalResources": ["resource1 with URL", "resource2 with URL"]
                },
                "timeManagement": {
                    "strategiesToUse": ["strategy1 adapted to user", "strategy2 adapted to user"],
                    "toolsToUse": ["tool1 with URL", "tool2 with URL"],
                    "scheduleOptimization": "user-specific optimization",
                    "productivityHacks": ["hack1 with measurement", "hack2 with measurement"]
                }
            },
            "successMetrics": {
                "quantitativeMetrics": [
                    {
                        "metric": "specific quantifiable metric",
                        "howToMeasure": "exact measurement method",
                        "frequency": "optimal measurement frequency",
                        "benchmarks": "industry-standard benchmarks",
                        "improvementRate": "expected improvement trajectory"
                    }
                ],
                "qualitativeMetrics": [
                    {
                        "metric": "specific qualitative metric",
                        "howToAssess": "systematic assessment method",
                        "frequency": "optimal assessment frequency",
                        "indicators": ["specific indicator1", "specific indicator2"],
                        "feedback": "specific feedback sources"
                    }
                ],
                "celebrationPoints": [
                    {
                        "achievement": "specific achievement milestone",
                        "celebration": "meaningful celebration suggestion",
                        "sharing": "strategic sharing approach",
                        "reflection": "structured reflection questions"
                    }
                ]
            },
            "careerAndFutureOpportunities": {
                "immediateOpportunities": ["specific opportunity1 with action plan", "specific opportunity2 with action plan"],
                "longTermProspects": ["prospect1 with timeline", "prospect2 with timeline"],
                "industryConnections": ["connection type1 with access strategy", "connection type2 with access strategy"],
                "portfolioBuilding": {
                    "whatToInclude": ["specific item1", "specific item2"],
                    "platformsToUse": ["platform1 with URL", "platform2 with URL"],
                    "showcaseStrategy": "strategic showcase approach"
                },
                "continuousLearning": {
                    "stayUpdated": "systematic update methodology",
                    "advancedSkills": ["skill1 with learning path", "skill2 with learning path"],
                    "specializations": ["specialization1 with market data", "specialization2 with market data"]
                }
            },
            "budgetOptimization": {
                "freeResources": ["verified free resource1", "verified free resource2"],
                "budgetAllocation": {
                    "essential": "percentage with specific allocation",
                    "nice-to-have": "percentage with specific allocation",
                    "emergency": "percentage with specific allocation"
                },
                "costSavingTips": ["actionable tip1", "actionable tip2"],
                "ROIMaximization": "systematic ROI optimization strategy"
            },
            "personalizationNotes": {
                "basedOnUserProfile": "specific customizations based on user's exact situation",
                "adaptationAdvice": "dynamic adaptation strategy",
                "alternativePathways": ["if constraint X occurs, execute strategy Y", "if progress exceeds expectations, accelerate via Z"],
                "scalingStrategy": "systematic scaling methodology"
            }
        }

        **Critical Requirements:**
        1. All URLs must be verified and functional
        2. All pricing must be current (2024-2025)
        3. All recommendations must be directly applicable to user's specific situation
        4. Prioritize evidence-based resources over popular but unproven options
        5. Include specific success metrics and measurement methods
        6. Adapt all timelines to user's actual availability constraints
        7. Focus on actionable, measurable outcomes rather than generic advice

        IMPORTANT: 
        1. Return ONLY valid JSON - no markdown formatting, no code blocks, no explanatory text before or after
        2. Ensure all strings are properly escaped
        3. Do not include trailing commas
        4. Use double quotes for strings, not single quotes
        5. Ensure all JSON is complete and properly closed
        6. If you cannot provide complete information for any field, use empty array [] or empty string "" but keep the structure intact
        `;

        // const result = await retryWithBackoff(async () => {
        //     return await model.generateContent(prompt);
        // }, 4); // 4 retries for the main roadmap (longer operation)

        await sleep(5000);
        const result = await model.generateContent(prompt);

        const response = await result.response;
        const content = response.text();

        let roadmapData;
        try {
            roadmapData = extractJSON(content);
        } catch (parseError) {
            console.error('Roadmap JSON Parse Error:', parseError);
            // Fallback to text response
            roadmapData = {
                roadmapText: content,
                format: 'text',
                error: 'Could not parse structured roadmap'
            };
        }

        // Generate actionable next steps
        const nextStepsPrompt = `
        User Profile:
        ${JSON.stringify(allResponses, null, 2)}

        RoadMap Data:
        ${JSON.stringify(roadmapData, null, 2)}
        
        Based on the comprehensive roadmap and user profile, create immediate actionable next steps:
        {
            "immediateActions": [
                {
                    "action": "specific action to take",
                    "timeframe": "when to do this",
                    "resources": ["resource1", "resource2"],
                    "expectedOutcome": "what this will achieve",
                    "priority": "High/Medium/Low"
                }
            ],
            "weeklyGoals": [
                {
                    "week": 1,
                    "goals": ["goal1", "goal2"],
                    "activities": ["activity1", "activity2"],
                    "timeCommitment": "hours per day",
                    "successCriteria": "how to know you succeeded"
                }
            ],
            "quickSummary": {
                "totalJourneyTime": "estimated total time",
                "dailyCommitment": "daily time commitment",
                "keyPriorities": ["priority1", "priority2"],
                "firstMilestone": "first major milestone",
                "successProbability": "likelihood of success"
            }
        } 
        
        IMPORTANT: 
        1. Return ONLY valid JSON - no markdown formatting, no code blocks, no explanatory text before or after
        2. Ensure all strings are properly escaped
        3. Do not include trailing commas
        4. Use double quotes for strings, not single quotes
        5. Ensure all JSON is complete and properly closed
        6. If you cannot provide complete information for any field, use empty array [] or empty string "" but keep the structure intact`;

        // const nextStepsResult = await retryWithBackoff(async () => {
        //     return await model.generateContent(nextStepsPrompt);
        // }, 3);

        await sleep(5000);
        const nextStepsResult = await model.generateContent(nextStepsPrompt);

        const nextStepsResponse = await nextStepsResult.response;
        const nextStepsContent = nextStepsResponse.text();

        let nextStepsData = {};
        try {
            nextStepsData = extractJSON(nextStepsContent);
        } catch (parseError) {
            console.error('Next steps parse error:', parseError);
            nextStepsData = { immediateActions: [] }; // Provide default
        }

        // Generate PDF from roadmap data
        let pdfUrl = null;
        try {
            // Add sessionId to roadmapData for filename
            roadmapData.sessionId = sessionId;

            pdfUrl = await generateRoadmapPDF(
                roadmapData,
                nextStepsData,
                goal
            );
        } catch (pdfError) {
            console.error('⚠️ Failed to generate PDF, but continuing:', pdfError);
            // Don't fail the whole request if PDF generation fails
        }

        // Update session with PDF URL
        await session.update({
            questions: updatedQuestions,
            current_step: 4,
            status: "completed",
            roadmap_pdf_url: pdfUrl // Add this field to your LearningPath model
        });

        return res.json({
            message: 'Comprehensive universal learning roadmap generated successfully',
            data: {
                sessionId,
                goal,
                userProfile: allResponses,
                roadmap: roadmapData,
                nextSteps: nextStepsData,
                pdfUrl: pdfUrl,
                generatedAt: new Date().toISOString(),
                aiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash-with-search',
                searchEnabled: true,
                roadmapType: 'universal'
            },
            success: true,
            status: 'roadmap_complete'
        });

    } catch (error) {
        next(error);
    }
};

// Get user's learning path history
const getUserLearningPaths = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        // Convert to numbers and validate
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);

        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({
                error: 'Invalid page parameter',
                success: false
            });
        }

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
            return res.status(400).json({
                error: 'Invalid limit parameter (must be between 1 and 50)',
                success: false
            });
        }

        const offset = (pageNum - 1) * limitNum;

        // Get all learning paths for the user
        const { count, rows: learningPaths } = await LearningPath.findAndCountAll({
            where: {
                user_id: req.user?.id
            },
            attributes: [
                'id',
                'goal',
                'status',
                'current_step',
                'goal_analysis',
                'questions',
                'preliminary_insights',
                'roadmap_pdf_url',
                'started_at',
                'completed_at',
                'createdAt',
                'updatedAt'
            ],
            order: [['createdAt', 'DESC']],
            limit: limitNum,
            offset: offset
        });

        // Transform each learning path to frontend-friendly format
        const transformedPaths = learningPaths.map(path => {
            const pathData = path.toJSON();

            // Extract goal title and type from goal_analysis
            const goalAnalysis = pathData.goal_analysis || {};
            const goalTitle = goalAnalysis.goalTitle || pathData.goal;
            const goalType = goalAnalysis.goalType || 'other';

            // Calculate progress percentage based on current_step
            const progressPercentage = calculateProgress(pathData.current_step);

            // Determine if user has answered questions
            const questions = pathData.questions || [];
            const answeredQuestions = questions.filter(q => q.answer !== null).length;
            const totalQuestions = questions.length;

            // Get quick summary from goal_analysis if available
            const timeFrameEstimate = goalAnalysis.timeFrameEstimate || 'Not specified';
            const complexity = goalAnalysis.complexity || 'beginner';

            // Extract top skills from requirements
            const skills = goalAnalysis.requirements?.skills?.slice(0, 3) || [];

            // Extract top resources
            const topResources = {
                courses: goalAnalysis.topResources?.courses?.slice(0, 2) || [],
                youtubeChannels: goalAnalysis.topResources?.youtubeChannels?.slice(0, 2) || [],
                books: goalAnalysis.topResources?.books?.slice(0, 2) || []
            };

            // Determine if roadmap is ready (status completed)
            const isRoadmapReady = pathData.status === 'completed';

            // Format dates
            const createdAt = pathData.createdAt ? new Date(pathData.createdAt).toISOString() : null;
            const updatedAt = pathData.updatedAt ? new Date(pathData.updatedAt).toISOString() : null;
            const completedAt = pathData.completedAt ? new Date(pathData.completedAt).toISOString() : null;

            return {
                // Core session info
                sessionId: pathData.id,
                goal: pathData.goal,
                goalTitle: goalTitle,
                goalType: goalType,
                status: pathData.status,
                roadmap_pdf_url: pathData.roadmap_pdf_url || null,
                currentStep: pathData.current_step,
                progressPercentage: progressPercentage,

                // Analytics
                timeFrameEstimate: timeFrameEstimate,
                complexity: complexity,
                skills: skills,
                topResources: topResources,

                // Question stats
                questionsAnswered: answeredQuestions,
                totalQuestions: totalQuestions,
                completionRate: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,

                // Insights availability
                hasGoalAnalysis: !!pathData.goal_analysis,
                hasPreliminaryInsights: !!pathData.preliminary_insights,
                isRoadmapReady: isRoadmapReady,

                // Timestamps
                startedAt: createdAt,
                updatedAt: updatedAt,
                completedAt: completedAt,

                // Raw data for detailed view (optional - can be fetched separately)
                goalAnalysis: pathData.goal_analysis,
                preliminaryInsights: pathData.preliminary_insights,

                // Summary for quick preview
                summary: {
                    goalDescription: goalAnalysis.description || `Learning path for ${goalTitle}`,
                    keyMilestones: goalAnalysis.successMetrics?.milestones?.slice(0, 2) || [],
                    immediateOutcomes: goalAnalysis.outcomes?.immediateOutcomes?.slice(0, 2) || [],
                    challenges: goalAnalysis.challenges?.commonChallenges?.slice(0, 2) || []
                }
            };
        });

        // Calculate pagination metadata
        const totalPages = Math.ceil(count / limitNum);

        return res.json({
            message: 'Learning paths retrieved successfully',
            data: {
                learningPaths: transformedPaths,
                pagination: {
                    currentPage: pageNum,
                    totalPages: totalPages,
                    totalItems: count,
                    itemsPerPage: limitNum,
                    hasNextPage: pageNum < totalPages,
                    hasPreviousPage: pageNum > 1
                },
                summary: {
                    totalPaths: count,
                    completedPaths: learningPaths.filter(p => p.status === 'completed').length,
                    inProgressPaths: learningPaths.filter(p => p.status === 'in_progress').length,
                    initializedPaths: learningPaths.filter(p => p.status === 'initialized').length
                }
            },
            success: true
        });

    } catch (error) {
        console.error('Error fetching learning paths:', error);
        next(error);
    }
};

// Helper function to calculate progress percentage
const calculateProgress = (currentStep) => {
    switch (currentStep) {
        case 1:
            return 10; // Initialized
        case 1.5:
            return 25
        case 2:
            return 35; // Assessment complete
        case 2.5:
            return 50;
        case 3:
            return 75; // Follow-up complete
        case 4:
            return 100; // Roadmap generated
        default:
            return 0;
    }
};

// Get single learning path details for restoration
const getLearningPathDetails = async (req, res, next) => {
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({
                error: 'Session ID is required',
                success: false
            });
        }

        const learningPath = await LearningPath.findOne({
            where: {
                id: sessionId,
                user_id: req.user?.id
            }
        });

        if (!learningPath) {
            return res.status(404).json({
                error: 'Learning path not found',
                success: false
            });
        }

        const pathData = learningPath.toJSON();

        // Reconstruct the session data format that the frontend expects
        const sessionData = {
            sessionId: pathData.id,
            goal: pathData.goal,
            goalAnalysis: pathData.goal_analysis,
            assessmentQuestions: (pathData.questions || [])
                .filter(q => q.type === 'initial')
                .map(q => ({
                    id: q.id,
                    question: q.question,
                    options: q.options,
                    category: q.category,
                    answer: q.answer
                })),
            preliminaryInsights: pathData.preliminary_insights,
            step: pathData.current_step,
            status: pathData.status
        };

        // Extract user responses for restoration
        const userResponses = {};
        const followUpResponses = {};

        (pathData.questions || []).forEach(q => {
            if (q.answer !== null) {
                if (q.type === 'initial') {
                    userResponses[q.id] = q.answer;
                } else if (q.type === 'followup') {
                    followUpResponses[q.id] = q.answer;
                }
            }
        });

        // Get follow-up questions
        const followUpQuestions = (pathData.questions || [])
            .filter(q => q.type === 'followup')
            .map(q => ({
                id: q.id,
                question: q.question,
                options: q.options,
                category: q.category,
                reasoning: q.reasoning,
                answer: q.answer
            }));

        return res.json({
            message: 'Learning path details retrieved successfully',
            data: {
                sessionData: sessionData,
                userResponses: userResponses,
                followUpResponses: followUpResponses,
                followUpQuestions: followUpQuestions,
                preliminaryInsights: pathData.preliminary_insights,
                roadmapData: pathData.roadmap_pdf_url ? { pdfUrl: pathData.roadmap_pdf_url } : null,
                canResume: pathData.status !== 'completed',
                canViewRoadmap: pathData.status === 'completed',
                currentStep: pathData.current_step
            },
            success: true
        });

    } catch (error) {
        console.error('Error fetching learning path details:', error);
        next(error);
    }
};

// Resume a learning path (return data in format ready for frontend)
const resumeLearningPath = async (req, res, next) => {
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({
                error: 'Session ID is required',
                success: false
            });
        }

        const learningPath = await LearningPath.findOne({
            where: {
                id: sessionId,
                user_id: req.user?.id
            }
        });

        if (!learningPath) {
            return res.status(404).json({
                error: 'Learning path not found',
                success: false
            });
        }

        const pathData = learningPath.toJSON();

        // Restore the complete state for the frontend
        const restoredState = {
            sessionData: {
                sessionId: pathData.id,
                goal: pathData.goal,
                goalAnalysis: pathData.goal_analysis,
                assessmentQuestions: (pathData.questions || [])
                    .filter(q => q.type === 'initial')
                    .map(q => ({
                        id: q.id,
                        question: q.question,
                        options: q.options,
                        category: q.category
                    })),
                step: pathData.current_step
            },
            userResponses: {},
            followUpResponses: {},
            followUpQuestions: (pathData.questions || [])
                .filter(q => q.type === 'followup')
                .map(q => ({
                    id: q.id,
                    question: q.question,
                    options: q.options,
                    category: q.category,
                    reasoning: q.reasoning
                })),
            preliminaryInsights: pathData.preliminary_insights,
            currentStep: pathData.current_step
        };

        // Populate responses
        (pathData.questions || []).forEach(q => {
            if (q.answer !== null) {
                if (q.type === 'initial') {
                    restoredState.userResponses[q.id] = q.answer;
                } else if (q.type === 'followup') {
                    restoredState.followUpResponses[q.id] = q.answer;
                    restoredState.followUpQuestions.push({
                        id: q.id,
                        question: q.question,
                        options: q.options,
                        category: q.category,
                        reasoning: q.reasoning
                    });
                }
            }
        });

        // Update the session status if resuming from initialized state
        if (pathData.status === 'initialized') {
            await learningPath.update({ status: 'in_progress' });
        }

        return res.json({
            message: 'Learning path resumed successfully',
            data: restoredState,
            success: true
        });

    } catch (error) {
        console.error('Error resuming learning path:', error);
        next(error);
    }
};

// Utility function to get goal-specific updates and trends
const getGoalUpdates = async (req, res, next) => {
    try {
        const { goalName, goalType } = req.query;

        if (!goalName) {
            return res.status(400).json({
                error: 'Goal name is required',
                success: false
            });
        }

        const model = genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
            tools: [{
                google_search: {}
            }]
        });

        const prompt = `
        Search for the latest updates, trends, and developments related to "${goalName}" for ${new Date().getFullYear()}. 
        Look for:
        - Recent industry changes or updates
        - New tools, platforms, or methodologies
        - Emerging trends and opportunities
        - Success stories and case studies
        - Market demand changes
        - New learning resources or programs
        - Certification updates
        - Expert insights and recommendations
        - Technology changes affecting this goal
        - Best practices evolution

        Format the response as JSON with current updates and actionable insights.

        {
            "latestUpdates": [
                {
                    "updateType": "industry/technology/methodology/certification",
                    "title": "update title",
                    "description": "detailed description",
                    "impact": "how this affects people pursuing this goal",
                    "actionRequired": "what learners should do about this",
                    "source": "source of information",
                    "date": "when this update was announced"
                }
            ],
            "emergingTrends": [
                {
                    "trend": "trend description",
                    "significance": "why this trend matters",
                    "timeframe": "when this trend will be important",
                    "preparationTips": ["tip1", "tip2"],
                    "resources": ["resource1", "resource2"]
                }
            ],
            "marketInsights": {
                "currentDemand": "current market demand",
                "futureProjections": "future outlook",
                "salaryTrends": "salary/compensation trends",
                "skillsInDemand": ["skill1", "skill2"],
                "geographicalHotspots": ["location1", "location2"]
            },
            "newResources": [
                {
                    "resourceName": "resource name",
                    "type": "course/book/tool/platform",
                    "provider": "provider name",
                    "url": "resource URL",
                    "cost": "pricing information",
                    "uniqueFeatures": ["feature1", "feature2"],
                    "targetAudience": "who it's best for"
                }
            ],
            "successStories": [
                {
                    "achieverName": "name or anonymous",
                    "background": "their starting point",
                    "journey": "how they achieved the goal",
                    "timeframe": "how long it took",
                    "keyStrategies": ["strategy1", "strategy2"],
                    "advice": "their advice for others",
                    "currentRole": "where they are now",
                    "storySource": "URL to full story if available"
                }
            ],
            "expertInsights": [
                {
                    "expertName": "expert name",
                    "credentials": "expert background",
                    "insight": "their key insight",
                    "recommendation": "their recommendation",
                    "prediction": "their future prediction",
                    "source": "interview/article/post URL"
                }
            ],
            "actionableRecommendations": [
                "immediate action you can take",
                "skill to focus on next",
                "resource to explore"
            ]
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text();

        let parsedData;
        try {
            const match = content.match(/```json\s*([\s\S]*?)```/);
            if (match) {
                parsedData = JSON.parse(match[1].trim());
            } else {
                parsedData = JSON.parse(content);
            }
        } catch (parseError) {
            parsedData = {
                updatesText: content,
                format: 'text',
                error: 'Could not parse structured updates'
            };
        }

        return res.json({
            message: 'Latest goal updates retrieved successfully',
            data: {
                goalName,
                goalType: goalType || 'general',
                updates: parsedData,
                lastUpdated: new Date().toISOString(),
                searchEnabled: true
            },
            success: true
        });

    } catch (error) {
        next(error);
    }
};

// Function to validate and adjust roadmap based on progress
const validateAndAdjustRoadmap = async (req, res, next) => {
    try {
        const { sessionId, goal, currentProgress, challenges, timeSpent, achievements } = req.body;

        if (!sessionId || !goal || !currentProgress) {
            return res.status(400).json({
                error: 'Session ID, goal, and current progress are required',
                success: false
            });
        }

        const model = genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
            tools: [{
                google_search: {}
            }]
        });

        const prompt = `
        Analyze the user's progress towards their goal "${goal}" and provide personalized adjustments to their learning roadmap.

        Current Progress: ${JSON.stringify(currentProgress)}
        Challenges Faced: ${JSON.stringify(challenges)}
        Time Spent: ${JSON.stringify(timeSpent)}
        Achievements: ${JSON.stringify(achievements)}

        Search for updated strategies and solutions for common challenges in achieving "${goal}".

        Provide a JSON response with roadmap adjustments:
        {
            "progressAnalysis": {
                "overallProgress": "percentage or assessment",
                "strengths": ["strength1", "strength2"],
                "weakAreas": ["area1", "area2"],
                "paceAssessment": "ahead/on-track/behind schedule",
                "qualityAssessment": "quality of learning so far"
            },
            "challengeAnalysis": [
                {
                    "challenge": "specific challenge",
                    "rootCause": "why this challenge occurred",
                    "severity": "high/medium/low",
                    "solution": "specific solution strategy",
                    "resources": ["resource1", "resource2"],
                    "timeframe": "how long to implement solution"
                }
            ],
            "roadmapAdjustments": {
                "timelineAdjustment": "suggested timeline changes",
                "priorityChanges": ["new priority1", "new priority2"],
                "methodologyChanges": ["change1", "change2"],
                "resourceAdjustments": ["resource change1", "resource change2"],
                "scheduleOptimization": "suggested schedule changes"
            },
            "nextPhaseRecommendations": {
                "immediateActions": ["action1", "action2"],
                "skillFocus": ["skill1", "skill2"],
                "newResources": ["resource1", "resource2"],
                "supportNeeded": "type of support needed"
            },
            "motivationBoost": {
                "achievements": ["celebrate these achievements"],
                "progressHighlights": ["progress highlight1", "progress highlight2"],
                "encouragement": "personalized encouragement message",
                "quickWins": ["easy win1", "easy win2"]
            },
            "preventiveMeasures": {
                "futureRisks": ["risk1", "risk2"],
                "preventionStrategies": ["strategy1", "strategy2"],
                "earlyWarningSignals": ["signal1", "signal2"],
                "supportSystem": "recommended support system"
            }
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text();

        let adjustmentData;
        try {
            const match = content.match(/```json\s*([\s\S]*?)```/);
            if (match) {
                adjustmentData = JSON.parse(match[1].trim());
            } else {
                adjustmentData = JSON.parse(content);
            }
        } catch (parseError) {
            adjustmentData = {
                adjustmentText: content,
                format: 'text',
                error: 'Could not parse structured adjustments'
            };
        }

        return res.json({
            message: 'Roadmap validation and adjustments generated successfully',
            data: {
                sessionId,
                goal,
                adjustments: adjustmentData,
                adjustmentDate: new Date().toISOString(),
                progressSnapshot: {
                    currentProgress,
                    challenges,
                    timeSpent,
                    achievements
                }
            },
            success: true
        });

    } catch (error) {
        next(error);
    }
};

// Function to find mentors and communities for any goal
const findMentorsAndCommunities = async (req, res, next) => {
    try {
        const { goal, userLocation, experienceLevel, budget } = req.body;

        if (!goal) {
            return res.status(400).json({
                error: 'Goal is required',
                success: false
            });
        }

        const model = genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
            tools: [{
                google_search: {}
            }]
        });

        const prompt = `
        Search for mentors, communities, and networking opportunities for someone pursuing "${goal}".
        Consider their experience level: ${experienceLevel || 'not specified'}
        Location: ${userLocation || 'global'}
        Budget: ${budget || 'not specified'}

        Find:
        - Online communities and forums
        - Local meetups and groups
        - Mentorship platforms and programs
        - Professional networks
        - Industry associations
        - Coaching services
        - Peer groups
        - Success stories with contact information

        {
            "onlineCommunities": [
                {
                    "communityName": "community name",
                    "platform": "platform (Reddit, Discord, Slack, etc.)",
                    "url": "direct URL to join",
                    "memberCount": "number of members",
                    "activityLevel": "high/medium/low",
                    "cost": "free/paid",
                    "focus": "what they focus on",
                    "benefits": ["benefit1", "benefit2"],
                    "howToJoin": "joining process",
                    "bestFor": "who should join"
                }
            ],
            "mentorshipOpportunities": [
                {
                    "platformName": "platform name",
                    "url": "platform URL",
                    "mentorTypes": ["type1", "type2"],
                    "cost": "pricing structure",
                    "matchingProcess": "how they match mentors",
                    "averageResponse": "response time",
                    "specializations": ["specialization1", "specialization2"],
                    "userRatings": "platform ratings"
                }
            ],
            "localOpportunities": [
                {
                    "opportunityType": "meetup/workshop/conference/networking",
                    "name": "event/group name",
                    "location": "city/region",
                    "frequency": "how often they meet",
                    "cost": "cost to attend",
                    "website": "website URL",
                    "contactInfo": "how to get involved",
                    "benefits": "what you'll gain"
                }
            ],
            "professionalNetworks": [
                {
                    "networkName": "network name",
                    "type": "association/group/organization",
                    "website": "website URL",
                    "membershipCost": "cost to join",
                    "benefits": ["benefit1", "benefit2"],
                    "events": ["event type1", "event type2"],
                    "networking": "networking opportunities",
                    "resources": "resources provided"
                }
            ],
            "coachingServices": [
                {
                    "serviceName": "coaching service name",
                    "website": "service website",
                    "specialization": "what they specialize in",
                    "priceRange": "pricing range",
                    "coachCredentials": "coach qualifications",
                    "sessionFormat": "1-on-1/group/online/in-person",
                    "successStories": "client success stories",
                    "freeConsultation": "yes/no"
                }
            ],
            "peerLearningGroups": [
                {
                    "groupName": "group name",
                    "formation": "how to form/join",
                    "platform": "where they meet",
                    "structure": "how they operate",
                    "commitmentLevel": "time commitment",
                    "benefits": "what you gain",
                    "bestPractices": ["practice1", "practice2"]
                }
            ],
            "expertConnections": [
                {
                    "expertName": "expert name",
                    "expertise": "area of expertise",
                    "howToConnect": "LinkedIn/Twitter/email/etc.",
                    "approachStrategy": "how to approach them",
                    "valueProposition": "what you can offer",
                    "expectedResponse": "likelihood of response"
                }
            ],
            "actionPlan": {
                "immediate": ["immediate action1", "immediate action2"],
                "shortTerm": ["1-month action1", "1-month action2"],
                "longTerm": ["3-month action1", "3-month action2"],
                "networking": ["networking tip1", "networking tip2"],
                "relationship": ["relationship building tip1", "tip2"]
            }
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text();

        let networkingData;
        try {
            const match = content.match(/```json\s*([\s\S]*?)```/);
            if (match) {
                networkingData = JSON.parse(match[1].trim());
            } else {
                networkingData = JSON.parse(content);
            }
        } catch (parseError) {
            networkingData = {
                networkingText: content,
                format: 'text',
                error: 'Could not parse structured networking data'
            };
        }

        return res.json({
            message: 'Mentors and communities found successfully',
            data: {
                goal,
                userLocation: userLocation || 'global',
                experienceLevel: experienceLevel || 'not specified',
                budget: budget || 'not specified',
                networking: networkingData,
                searchDate: new Date().toISOString()
            },
            success: true
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    initializeLearningPath,
    processUserResponses,
    generateComprehensiveUniversalRoadmap,
    getGoalUpdates,
    validateAndAdjustRoadmap,
    findMentorsAndCommunities,
    getUserLearningPaths,
    getLearningPathDetails,
    resumeLearningPath
};
