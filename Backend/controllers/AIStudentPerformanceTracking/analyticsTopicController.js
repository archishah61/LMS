const { Quizzes } = require("../../models/content_management/quizzesModel");
const Topic = require("../../models/course_management/topic");
const TopicContent = require("../../models/course_management/topic_content");
const QuizCompletion = require("../../models/learning_progress/quizCompletion");
// const QuizQuestion = require("../../models/content_management/quizQuestionsModel");
const sequelize = require("../../config/db");
const { Op } = require("sequelize");
const fetch = require('node-fetch');
const { QuizPreDefinedQuestions } = require("../../models/masters/quizPreDefinedQuestions");
const { PreDefinedQuestions } = require("../../models/masters/predefinedQuestion");
const QuizResponse = require("../../models/learning_progress/quizResponse");
const ProgressTracking = require("../../models/learning_progress/progressTracking");
const Module = require("../../models/course_management/module");
const PerformanceFeedback = require("../../models/aiStudentPerformanceTracking/performanceFeedback");
const Assignment = require("../../models/content_management/assignmentsModel");
const AssignmentCompletion = require("../../models/learning_progress/assignmentCompletion");
const AssignmentResponse = require("../../models/learning_progress/assignmentResponse");
const MatchingQuestion = require("../../models/content_management/matchingQuestion");
const TrueFalseQuestion = require("../../models/content_management/trueFalseQuestion");
const FillTheBlanksQuestion = require("../../models/content_management/fillTheBlanks");
const ParagraphWriting = require("../../models/content_management/paragraphwriting");

const { QuizQuestion } = require('../../models/content_management/quizQuestion.js')

const { callProcedure } = require("../../utils/procedure/callProcedure");


const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function callGemini(prompt) {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'no';
}

async function generateFeedback(topics, errorAnalysis, allQuestions, completionMap, inferredScores, assignmentCompletionMap, assignmentMap, allAssignmentQuestions, topicRelatedQuestions, timeSpentMap) {
    let feedback = {
        weak_topics: [],
        strong_topics: []
    };

    for (const topic of topics) {
        const score = inferredScores[topic.id]?.score || 0;
        const assignmentId = assignmentMap[topic.id];
        const assignmentCompletion = assignmentCompletionMap[assignmentId];
        const timeSpent = timeSpentMap[topic.id] || 0;

        // Convert time spent from seconds to minutes for better readability
        const timeSpentMinutes = Math.round(timeSpent / 60);

        let topicFeedback = {
            title: topic.title,
            description: topic.description || 'No description',
            score: score,
            hasAssignment: !!assignmentId,
            assignmentScore: assignmentCompletion?.score || 0,
            timeSpentMinutes: timeSpentMinutes
        };

        const topicQuestions = allQuestions.filter(question => {
            // Assuming you have a way to map questions to topics
            // This is a placeholder; you need to implement the actual logic
            return question.topic_id === topic.id;
        });

        // Get assignment questions for this topic
        const topicAssignmentQuestions = topicRelatedQuestions[topic.id]?.filter(q => q.assignment_id) || [];
        const assignmentQuestionsForTopic = allAssignmentQuestions.filter(aq =>
            topicAssignmentQuestions.some(tq => tq.id === aq.id && tq.assignment_id === aq.assignment_id)
        );

        // Combine quiz and assignment questions for comprehensive feedback
        const allTopicQuestions = [
            ...topicQuestions.map(q => `Quiz: ${q.question_text}`),
            ...assignmentQuestionsForTopic.map(aq => `Assignment: ${aq.question_text}`)
        ];

        if (score < 50) {
            // Topic is weak
            let feedbackPrompt = `
You are an expert tutor. Analyze the student's performance in the topic: "${topic.title}".
Topic Description: "${topic.description || 'No description'}".
The student scored ${score}% on this topic.${assignmentCompletion ? ` They also completed an assignment with a score of ${assignmentCompletion.score}%.` : ''}
Time spent on this topic: ${timeSpentMinutes} minutes.

Return your feedback as a JSON object with the following keys:
- "key_points": A list of the most important points of this topic.
- "suggestions": Actionable suggestions for improvement.
- "weak_areas": Specific areas or subtopics where the student is weak.
- "time_analysis": Analysis of the time spent (too little, appropriate, or too much time).
- "practice_questions": 5 practice questions relevant to this topic, each as an object with "question" and "answer" fields.

Example format:
{
  "key_points": ["point 1", "point 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "weak_areas": ["area 1", "area 2"],
  "time_analysis": "The student spent X minutes on this topic, which is [too little/appropriate/too much] time for the complexity level.",
  "practice_questions": [
    {"question": "What is X?", "answer": "X is ..."},
    {"question": "How does Y work?", "answer": "Y works by ..."},
    {"question": "List two features of Z.", "answer": "Feature 1: ...; Feature 2: ..."}
  ]
}

Student's recent questions for this topic:
${allTopicQuestions.map(q => `- ${q}`).join('\n')}

Return ONLY the JSON object, no explanation.

`;

            const topicFeedbackResponse = await callGemini(feedbackPrompt);

            let feedbackJson = {};
            try {
                // Remove markdown if present
                const cleanResponse = topicFeedbackResponse.replace(/```json\n?|\n?```/g, '').trim();
                feedbackJson = JSON.parse(cleanResponse);
            } catch (e) {
                console.error('Error parsing feedback JSON:', e);
                feedbackJson = { error: 'Invalid AI response', raw: topicFeedbackResponse };
            }

            topicFeedback.feedback = feedbackJson;
            feedback.weak_topics.push(topicFeedback);
        } else {
            // Topic is strong
            feedback.strong_topics.push(topicFeedback);
        }
    }

    return feedback;
}

// Function to determine skill level based on score, revision count, and time spent
function determineSkillLevel(score, revisionCount, timeSpentMinutes = 0) {
    // Define weights for score, revision count, and time spent
    const scoreWeight = 0.6;
    const revisionWeight = 0.25;
    const timeWeight = 0.15;

    // Normalize the revision count to a scale similar to the score (0-100)
    const normalizedRevisionCount = Math.min(revisionCount * 10, 100); // Assuming each revision adds 10 points up to a max of 100

    // Normalize time spent (assuming 30 minutes is optimal for most topics)
    const normalizedTimeSpent = Math.min((timeSpentMinutes / 30) * 100, 100); // Cap at 100

    // Calculate the combined metric
    const combinedMetric = (score * scoreWeight) + (normalizedRevisionCount * revisionWeight) + (normalizedTimeSpent * timeWeight);

    // Determine the skill level based on the combined metric
    if (combinedMetric >= 80) {
        return 'Advanced';
    } else if (combinedMetric >= 50) {
        return 'Intermediate';
    } else {
        return 'Beginner';
    }
}


exports.topicsSkillLevel = async (req, res) => {
    const { moduleId, userId } = req.params;

    if (!moduleId || !userId) {
        return res.status(400).json({ message: 'Module ID and User ID are required' });
    }

    try {
        // Step 1: Fetch all topics using stored procedure
        const procResult = await callProcedure('getTopicsByModuleIdForAnalytics', [moduleId]);

        if (!procResult.success) {
            return res.status(500).json({ message: 'Failed to fetch topics', error: procResult.error });
        }
        // The result is an array of arrays (MySQL returns [rows, ...]), so use the first array
        const topics = Array.isArray(procResult.data) ? procResult.data : [];

        if (!topics.length) {
            return res.status(404).json({ message: 'No topics found for this module' });
        }

        const topicIds = topics.map(t => t.id);

        // Step 2: Get quizzes and assignments mapped to topics
        let topicContent = [];
        if (topicIds.length > 0) {
            const topicIdsCsv = topicIds.join(',');
            const procTopicContentResult = await callProcedure('getTopicContentByModuleAndTopics', [moduleId, topicIdsCsv]);
            if (!procTopicContentResult.success) {
                return res.status(500).json({ message: 'Failed to fetch topic content', error: procTopicContentResult.error });
            }
            topicContent = Array.isArray(procTopicContentResult.data) ? procTopicContentResult.data : [];
        }

        const quizMap = {};
        const assignmentMap = {};
        const usedQuizIds = [];
        const usedAssignmentIds = [];
        topicContent.forEach(tc => {
            if (tc.quiz_id) {
                quizMap[tc.topic_id] = tc.quiz_id;
                usedQuizIds.push(tc.quiz_id);
            }
            if (tc.assignment_id) {
                assignmentMap[tc.topic_id] = tc.assignment_id;
                usedAssignmentIds.push(tc.assignment_id);
            }
        });

        // Step 3: Get user quiz completions
        let completions = [];
        if (topicIds.length > 0) {
            const topicIdsCsv = topicIds.join(',');
            const completionsProcResult = await callProcedure('getQuizCompletionsByUserModuleTopics', [userId, moduleId, topicIdsCsv]);
            if (!completionsProcResult.success) {
                return res.status(500).json({ message: 'Failed to fetch quiz completions', error: completionsProcResult.error });
            }
            completions = Array.isArray(completionsProcResult.data) ? completionsProcResult.data : [];
        }


        const completionMap = {};
        completions.forEach(c => {
            completionMap[c.topic_id] = {
                score: c.score,
            };
        });


        // Step 3.5: Get user assignment completions
        let assignmentCompletions = [];
        if (usedAssignmentIds.length > 0) {
            const assignmentIdsCsv = usedAssignmentIds.join(',');
            const assignmentCompletionsProcResult = await callProcedure('getAssignmentCompletionsByUserAssignments', [userId, assignmentIdsCsv]);
            if (!assignmentCompletionsProcResult.success) {
                return res.status(500).json({ message: 'Failed to fetch assignment completions', error: assignmentCompletionsProcResult.error });
            }
            assignmentCompletions = Array.isArray(assignmentCompletionsProcResult.data) ? assignmentCompletionsProcResult.data : [];
        }

        const assignmentCompletionMap = {};
        assignmentCompletions.forEach(ac => {
            assignmentCompletionMap[ac.assignmentId] = {
                score: ac.score,
                isCompleted: ac.isCompleted,
                status: ac.status
            };
        });

        // Step 4: Get all quizzes and identify unmapped ones
        let allQuizzes = [];
        if (moduleId) {
            const allQuizzesProcResult = await callProcedure('getQuizzesByModuleId', [moduleId]);
            if (!allQuizzesProcResult.success) {
                return res.status(500).json({ message: 'Failed to fetch quizzes', error: allQuizzesProcResult.error });
            }
            allQuizzes = Array.isArray(allQuizzesProcResult.data) ? allQuizzesProcResult.data : [];
        }
        const allQuizIds = allQuizzes.map(q => q.id);
        const unmappedQuizIds = allQuizIds.filter(qid => !usedQuizIds.includes(qid));

        // Step 4.5: Get all assignments and identify unmapped ones
        let allAssignments = [];
        if (moduleId) {
            const allAssignmentsProcResult = await callProcedure('getAssignmentsByModuleIdForAnalytics', [moduleId]);
            if (!allAssignmentsProcResult.success) {
                return res.status(500).json({ message: 'Failed to fetch assignments', error: allAssignmentsProcResult.error });
            }
            allAssignments = Array.isArray(allAssignmentsProcResult.data) ? allAssignmentsProcResult.data : [];
        }
        const allAssignmentIds = allAssignments.map(a => a.id);
        const unmappedAssignmentIds = allAssignmentIds.filter(aid => !usedAssignmentIds.includes(aid));

        // Step 5: Collect questions from all types
        const fetchQuestions = async (model, type, questionColumn) => {
            if (!unmappedQuizIds.length) return [];
            const quizIdsCsv = unmappedQuizIds.join(',');
            const procResult = await callProcedure('getQuizQuestionsByQuizIdsAndType', [quizIdsCsv, type, questionColumn]);
            const records = Array.isArray(procResult.data) ? procResult.data : [];

            return records.map(q => {
                let question_text = q[questionColumn];

                if (Array.isArray(question_text)) {
                    question_text = question_text.join(', ');
                }

                return {
                    id: q.id,
                    quiz_id: q.quiz_id,
                    question_text,
                    type
                };
            });
        };

        const fetchPreDefinedQuestions = async (model, type) => {
            if (!unmappedQuizIds.length) return [];
            const quizIdsCsv = unmappedQuizIds.join(',');
            const procResult = await callProcedure('getPreDefinedQuestionsByQuizIds', [quizIdsCsv]);
            const records = Array.isArray(procResult.data) ? procResult.data : [];

            return records.map(r => ({
                id: r.id,
                quiz_id: r.quiz_id,
                question_text: r.question_text,
                type
            }));
        };

        const fetchRealWordQuestions = async () => {
            if (!unmappedQuizIds.length) return [];
            const quizIdsCsv = unmappedQuizIds.join(',');
            const procResult = await callProcedure('getRealWordQuestionsByQuizIds', [quizIdsCsv]);
            const records = Array.isArray(procResult.data) ? procResult.data : [];

            const flattened = [];
            records.forEach(record => {
                if (Array.isArray(record.realword_words)) {
                    record.realword_words.forEach(word => {
                        flattened.push({
                            id: record.id,
                            quiz_id: record.quiz_id,
                            question_text: word,
                            type: 'RealWordQuestion',
                        });
                    });
                }
            });
            return flattened;
        };

        const allQuestions = [
            ...(await fetchQuestions(QuizQuestion, 'mcq', 'mcq_question_text')),
            ...(await fetchPreDefinedQuestions(QuizPreDefinedQuestions, 'mcq')),
            ...(await fetchQuestions(QuizQuestion, 'bestoption', 'bestoption_passage')),
            ...(await fetchQuestions(QuizQuestion, 'dragdrop', 'dragdrop_prompt')),
            ...(await fetchQuestions(QuizQuestion, 'audiotoscript', 'audiotoscript_script')),
            ...(await fetchQuestions(QuizQuestion, 'mcq_question_text')),
            ...(await fetchRealWordQuestions()),
            ...(await fetchQuestions(QuizQuestion, 'summarizepassage', 'summarizepassage_summary')),
        ];

        // Step 5.5: Collect assignment questions from all types
        const fetchAssignmentQuestions = async (model, type, questionColumn) => {
            const records = await model.findAll({
                where: { assignment_id: { [Op.in]: unmappedAssignmentIds } },
                attributes: ['id', 'assignment_id', questionColumn]
            });

            return records.map(q => {
                let question_text = q[questionColumn];

                if (Array.isArray(question_text)) {
                    question_text = question_text.join(', ');
                }

                return {
                    id: q.id,
                    assignment_id: q.assignment_id,
                    question_text,
                    type
                };
            });
        };

        const fetchFillTheBlanksQuestions = async () => {
            const records = await FillTheBlanksQuestion.findAll({
                where: { assignment_id: { [Op.in]: unmappedAssignmentIds } },
                attributes: ['id', 'assignment_id', 'question_text', 'answers'],
                raw: true,
            });

            return records.map(q => ({
                id: q.id,
                assignment_id: q.assignment_id,
                question_text: q.question_text,
                type: 'FillTheBlanksQuestion'
            }));
        };

        const fetchParagraphWritingQuestions = async () => {
            const records = await ParagraphWriting.findAll({
                where: { assignment_id: { [Op.in]: unmappedAssignmentIds } },
                attributes: ['id', 'assignment_id', 'paragraph'],
                raw: true,
            });

            return records.map(q => ({
                id: q.id,
                assignment_id: q.assignment_id,
                question_text: q.paragraph,
                type: 'ParagraphWriting'
            }));
        };

        const allAssignmentQuestions = [
            ...(await fetchAssignmentQuestions(MatchingQuestion, 'MatchingQuestion', 'question_text')),
            ...(await fetchAssignmentQuestions(TrueFalseQuestion, 'TrueFalseQuestion', 'question_text')),
            ...(await fetchFillTheBlanksQuestions()),
            ...(await fetchParagraphWritingQuestions()),
        ];

        // Step 6: Use Gemini to relate questions to topics
        const topicRelatedQuestions = {};
        // Initialize empty arrays for each topic
        topics.forEach(topic => {
            if (!quizMap[topic.id] && !assignmentMap[topic.id]) {
                topicRelatedQuestions[topic.id] = [];
            }
        });

        // Single loop for quiz questions

        let rw = 0;
        for (const q of allQuestions) {
            // Create a prompt that includes all topics
            const topicsPrompt = topics.map(topic => ({
                id: topic.id,
                title: topic.title,
                description: topic.description || 'No description'
            }));

            const prompt = `Analyze the following quiz question and determine which ONE topic from the list is MOST relevant to it. Return ONLY the topic ID as a string (not an array).

Topics:
${JSON.stringify(topicsPrompt, null, 2)}

Quiz Question: "${q.question_text}"

Response Format:
"topic_id"  // Only the single most relevant topic ID

Example:
"47"`;

            const response = await callGemini(prompt);

            try {
                // Clean up the response by removing markdown formatting
                const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
                // Parse the cleaned response as JSON array
                let relevantTopicIds = JSON.parse(cleanResponse);

                // Special handling for RealWordQuestion
                if (q.type === 'RealWordQuestion') {
                    // const [realWordId, realWordIndex] = relevantTopicIds.split('_');
                    if (topicRelatedQuestions[relevantTopicIds]) {
                        topicRelatedQuestions[relevantTopicIds].push({ id: q.id, type: q.type, realWordIndex: rw });
                        rw++;
                    }
                    continue;
                }

                if (topicRelatedQuestions[relevantTopicIds]) {
                    topicRelatedQuestions[relevantTopicIds].push({ id: q.id, type: q.type });
                }
            } catch (error) {
                console.error('Error parsing AI response for quiz question:', error);
                // If parsing fails, try to handle simple yes/no responses for backward compatibility
                if (response.toLowerCase().includes('yes')) {
                    // If it's a simple 'yes', assign to the first topic (fallback behavior)
                    const firstTopic = topics[0];
                    if (firstTopic && topicRelatedQuestions[firstTopic.id]) {
                        topicRelatedQuestions[firstTopic.id].push({ id: q.id, type: q.type });
                    }
                }
            }
        }

        // Single loop for assignment questions
        for (const q of allAssignmentQuestions) {
            // Create a prompt that includes all topics
            const topicsPrompt = topics.map(topic => ({
                id: topic.id,
                title: topic.title,
                description: topic.description || 'No description'
            }));

            const prompt = `Analyze the following assignment question and determine which ONE topic from the list is MOST relevant to it. Return ONLY the topic ID as a string (not an array).

Topics:
${JSON.stringify(topicsPrompt, null, 2)}

Assignment Question: "${q.question_text}"

Response Format:
"topic_id"  // Only the single most relevant topic ID

Example:
"47"`;

            const response = await callGemini(prompt);

            try {
                // Clean up the response by removing markdown formatting
                const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();

                // Parse the cleaned response as JSON array
                let relevantTopicIds = JSON.parse(cleanResponse);

                // Special handling for RealWordQuestion
                if (q.type === 'RealWordQuestion' && typeof relevantTopicIds === 'string' && relevantTopicIds.includes('_')) {
                    const [realWordId, realWordIndex] = relevantTopicIds.split('_');
                    if (topicRelatedQuestions[realWordId]) {
                        topicRelatedQuestions[realWordId].push({ id: Number(realWordId), type: q.type, realWordIndex: Number(realWordIndex) });
                    }
                    continue;
                }

                if (topicRelatedQuestions[relevantTopicIds]) {
                    topicRelatedQuestions[relevantTopicIds].push({ id: q.id, type: q.type, assignment_id: q.assignment_id });
                }
            } catch (error) {
                console.error('Error parsing AI response for assignment question:', error);
                // If parsing fails, try to handle simple yes/no responses for backward compatibility
                if (response.toLowerCase().includes('yes')) {
                    // If it's a simple 'yes', assign to the first topic (fallback behavior)
                    const firstTopic = topics[0];
                    if (firstTopic && topicRelatedQuestions[firstTopic.id]) {
                        topicRelatedQuestions[firstTopic.id].push({ id: q.id, type: q.type, assignment_id: q.assignment_id });
                    }
                }
            }
        }

        // Step 7: Check user answers from correct tables with proper questionId mapping
        const errorAnalysis = {};
        const inferredScores = {};
        const processedQuestions = new Set(); // To track processed question IDs
        const processedAssignmentQuestions = new Set(); // To track processed assignment question IDs

        for (const [topicId, questionList] of Object.entries(topicRelatedQuestions)) {
            let realWord = 0;
            let correct = 0;
            let total = questionList.length;
            let realWordCorrect = 0;


            for (const q of questionList) {
                // Handle assignment questions differently
                if (q.assignment_id) {
                    // This is an assignment question
                    const assignmentQuestionId = `${q.type}_${q.id}`;
                    if (processedAssignmentQuestions.has(assignmentQuestionId)) continue;

                    // Get assignment responses for this question
                    const assignmentResponses = await AssignmentResponse.findAll({
                        where: { questionId: q.id },
                        attributes: ['selectedAnswer', 'optionIndex'],
                        order: [['created_at', 'DESC']],
                        limit: 1,
                        raw: true
                    });

                    let isCorrect = false;
                    if (q.type === 'MatchingQuestion') {
                        // You may need to adjust this logic based on your schema
                        // For now, just count as attempted (not auto-graded)
                        isCorrect = null;
                    } else if (q.type === 'TrueFalseQuestion') {
                        const question = await TrueFalseQuestion.findByPk(q.id);
                        if (question) {
                            isCorrect = String(assignmentResponses[0].selectedAnswer).toLowerCase() === String(question.correct_answer).toLowerCase();
                        }
                    } else if (q.type === 'FillTheBlanksQuestion') {
                        const question = await FillTheBlanksQuestion.findByPk(q.id);
                        if (question ) {
                            try {
                                const studentAnswers = JSON.parse(assignmentResponses[0].selectedAnswer);
                                isCorrect = JSON.stringify(studentAnswers) === JSON.stringify(question.answers);
                            } catch {
                                isCorrect = null;
                            }
                        }
                    } else if (q.type === 'ParagraphWriting') {
                        // Only count as attempted, not auto-graded
                        isCorrect = null;
                    }

                    if (isCorrect === true) {
                        correct++;
                    } else if (isCorrect === false) {
                        errorAnalysis[q.type] = (errorAnalysis[q.type] || 0) + 1;
                    }
                    // If isCorrect is null (open-ended), do not increment correct or errorAnalysis

                    processedAssignmentQuestions.add(assignmentQuestionId);
                    continue;
                }

                // Handle quiz questions (existing logic)
                let questionId;
                switch (q.type) {
                    case 'mcq':
                        questionId = q.id.toString();
                        break;
                    case 'BestOptionQuestion':
                        questionId = `bestoption_${q.id}`;
                        break;
                    case 'DragDropQuestion':
                        questionId = `dragdrop_${q.id}`;
                        break;
                    case 'RealWordQuestion':
                        // Use both id and realWordIndex
                        const realWordIndex = typeof q.realWordIndex !== 'undefined' ? q.realWordIndex : realWord;
                        questionId = `realword_${q.id}_${realWordIndex}`;
                        if (processedQuestions.has(questionId)) {
                            realWord++;
                            continue;
                        }
                        const realWordResponses = await QuizResponse.findAll({
                            where: {
                                questionId: {
                                    [Op.like]: `realword_${q.id}_${realWordIndex}%`
                                },
                            },
                            attributes: ['questionId', 'isCorrect'],
                            order: [['created_at', 'DESC']],
                            limit: 1,
                            raw: true
                        });
                        if (realWordResponses) {
                            realWord++;
                        }
                        realWordResponses.forEach(response => {
                            if (response.isCorrect) {
                                realWordCorrect++;
                            } else {
                                errorAnalysis[q.type] = (errorAnalysis[q.type] || 0) + 1;
                            }
                        });
                        processedQuestions.add(questionId);
                        continue;
                    case 'SummarizePassageQuestion':
                        questionId = `summary_${q.id} `;
                        break;
                    case 'AudioToScriptQuestion':
                        questionId = `audio_${q.id} `;
                        break;
                    case 'CompleteSentence':
                        questionId = `complete_${q.id} `;
                        break;
                    default:
                        console.warn(`Unknown question type: ${q.type} `);
                        questionId = q.id.toString();
                }

                // Skip if the question has already been processed
                if (processedQuestions.has(questionId)) {
                    continue;
                }

                const userAnswer = await QuizResponse.findOne({
                    where: {
                        questionId: questionId,
                    },
                    attributes: ['isCorrect'],
                    order: [['created_at', 'DESC']], // <-- Sort by created_at descending
                    raw: true
                });

                if (userAnswer && userAnswer.isCorrect) {
                    correct++;
                } else {
                    errorAnalysis[q.type] = (errorAnalysis[q.type] || 0) + 1;
                }

                // Mark this question as processed
                processedQuestions.add(questionId);

            }
            if (total > 0) {
                const score = Math.round(((correct + realWordCorrect) / total) * 100);
                inferredScores[topicId] = {
                    score,
                };
            }
        }

        // Step 8: Fetch topic revision count from ProgressTracking
        const progressTrackings = await ProgressTracking.findAll({
            where: {
                module_id: moduleId,
                topic_id: { [Op.in]: topicIds },
            },
            attributes: ['topic_id', 'revision_count', 'student_time_spent', 'completion_status']
        });

        const revisionCountMap = {};
        const timeSpentMap = {};
        const completionStatusMap = {};
        progressTrackings.forEach(pt => {
            revisionCountMap[pt.topic_id] = pt.revision_count;
            timeSpentMap[pt.topic_id] = pt.student_time_spent;
            completionStatusMap[pt.topic_id] = pt.completion_status;
        });

        // Step 9: Final topic response
        const finalTopics = topics.map(topic => {
            const quizId = quizMap[topic.id] || null;
            const assignmentId = assignmentMap[topic.id] || null;

            // Get quiz completion data
            const quizCompletion = completionMap[topic.id] || null;
            const quizScore = quizCompletion?.score || 0;

            // Get assignment completion data
            const assignmentCompletion = assignmentCompletionMap[assignmentId] || null;
            const assignmentScore = assignmentCompletion?.score || 0;

            // Calculate combined score (average of quiz and assignment scores)
            let combinedScore = 0;
            let scoreCount = 0;

            if (quizCompletion) {
                combinedScore += quizScore;
                scoreCount++;
            }

            if (assignmentCompletion) {
                combinedScore += assignmentScore;
                scoreCount++;
            }

            // If no scores available, use inferred score
            if (scoreCount === 0) {
                const inferredScore = inferredScores[topic.id] || { score: 0 };
                combinedScore = inferredScore.score;
            } else {
                combinedScore = Math.round(combinedScore / scoreCount);
            }

            const revisionCount = revisionCountMap[topic.id] || 0;
            const timeSpent = timeSpentMap[topic.id] || 0;
            const timeSpentMinutes = Math.round(timeSpent / 60);
            const skill = determineSkillLevel(combinedScore, revisionCount, timeSpentMinutes);
            const completionStatus = completionStatusMap[topic.id] || 'not_started';

            return {
                id: topic.id,
                title: topic.title,
                hasQuiz: !!quizId,
                hasAssignment: !!assignmentId,
                quizId,
                assignmentId,
                topic_score: combinedScore,
                quiz_score: quizScore,
                assignment_score: assignmentScore,
                topic_skill: skill,
                topic_revision_count: revisionCount,
                topic_time_spent: timeSpent,
                topic_completion_status: completionStatus
            };
        });

        // Generate feedback
        const feedback = await generateFeedback(topics, errorAnalysis, allQuestions, completionMap, inferredScores, assignmentCompletionMap, assignmentMap, allAssignmentQuestions, topicRelatedQuestions, timeSpentMap);

        // Calculate module score and skill level
        const moduleScores = finalTopics.map(topic => topic.topic_score);
        const moduleRevisionCounts = finalTopics.map(topic => topic.topic_revision_count);
        const moduleTimeSpent = finalTopics.map(topic => topic.topic_time_spent);

        const moduleScore = moduleScores.length > 0 ? Math.round(moduleScores.reduce((a, b) => a + b, 0) / moduleScores.length) : 0;
        const averageModuleRevisionCount = moduleRevisionCounts.length > 0 ? Math.round(moduleRevisionCounts.reduce((a, b) => a + b, 0) / moduleRevisionCounts.length) : 0;
        const averageModuleTimeSpent = moduleTimeSpent.length > 0 ? Math.round(moduleTimeSpent.reduce((a, b) => a + b, 0) / moduleTimeSpent.length) : 0;

        const moduleSkill = determineSkillLevel(moduleScore, averageModuleRevisionCount, Math.round(averageModuleTimeSpent / 60));

        // Fetch course_id for the module
        const moduleData = await Module.findOne({
            where: { id: moduleId },
            attributes: ['course_id'],
            raw: true
        });

        if (!moduleData) {
            return res.status(404).json({ message: 'Module not found' });
        }

        const courseId = moduleData.course_id;

        // Store the feedback in the database
        try {
            // Set existing feedback for this user/module as not current
            await PerformanceFeedback.update(
                { is_current: false },
                {
                    where: {
                        user_id: userId,
                        module_id: moduleId,
                        is_current: true
                    }
                }
            );

            // Get the latest version number
            const latestVersion = await PerformanceFeedback.findOne({
                where: {
                    user_id: userId,
                    module_id: moduleId
                },
                attributes: [
                    [sequelize.fn('MAX', sequelize.col('version')), 'maxVersion']
                ],
                raw: true
            });

            const newVersion = latestVersion && latestVersion.maxVersion ? latestVersion.maxVersion + 1 : 1;

            // Create summary from feedback
            const generateSummary = () => {
                let summary = `Module Score: ${moduleScore}%, Skill Level: ${moduleSkill}. `;

                if (feedback.weak_topics && feedback.weak_topics.length > 0) {
                    summary += `Weak areas: ${feedback.weak_topics.map(t => t.title).join(', ')}. `;
                }

                if (feedback.strong_topics && feedback.strong_topics.length > 0) {
                    summary += `Strong areas: ${feedback.strong_topics.map(t => t.title).join(', ')}. `;
                }

                return summary;
            };

            // Create new feedback record
            const feedbackRecord = await PerformanceFeedback.create({
                user_id: userId,
                course_id: courseId,
                module_id: moduleId,
                feedback_data: {
                    module_score: moduleScore,
                    module_skill: moduleSkill,
                    error_analysis: errorAnalysis,
                    feedback: feedback,
                    topics: finalTopics,
                },
                feedback_summary: generateSummary(),
                version: newVersion,
                is_current: true,
                created_by: userId,
                updated_by: userId
            });

        } catch (dbError) {
            console.error("Error storing feedback:", dbError);
            // Don't fail the request if storage fails, just log the error
        }

        return res.status(200).json({
            message: 'Topics with inferred skill level fetched successfully',
            module_score: moduleScore,
            module_skill: moduleSkill,
            error_analysis: errorAnalysis,
            feedback: feedback,
            topics: finalTopics,
        });

    } catch (err) {
        console.error("topicsSkillLevel error:", err);
        return res.status(500).json({
            message: "Something went wrong",
            error: err.message
        });
    }
};