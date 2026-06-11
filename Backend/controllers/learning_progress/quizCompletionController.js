// controllers/learning_progress/quizCompletionController.js

const { callProcedure } = require("../../utils/procedure/callProcedure"); // Adjust path accordingly

function normalizeFlags(data) {
    const convertFlags = (arr) =>
        arr.map((item) => ({
            ...item,
            isCompleted: Boolean(item.isCompleted),
            isAccessible: Boolean(item.isAccessible),
        }));

    return {
        ...data,
        topic_ids: convertFlags(data.topic_ids || []),
        quiz_ids: convertFlags(data.quiz_ids || []),
        assignment_ids: convertFlags(data.assignment_ids || []),
    };
}

// Create Quiz Completion Record
exports.createQuizCompletion = async (req, res, next) => {
    try {
        const {
            userId,
            quizId,
            score,
            isCompleted,
            status,
            triedAttempts,
            lastAttemptTime,
            count,
            total_question,
            created_by,
            updated_by,
            module_id,
            topic_id,
            totalMarks,
            obtainedMarks,
            courseId
        } = req.body;

        const quiz = await Quizzes.findOne({
            where: {
                id: quizId
            },
            attributes: ['id', 'isQuizCompulsory'],
            raw: true
        });

        if ((isCompleted) || (quiz && !Boolean(quiz.isQuizCompulsory))) {
            // Check if a record already exists for this user and quiz
            const accessibleData = await studentAccessibleData.findOne({
                where: {
                    user_id: userId,
                    course_id: courseId
                },
                attributes: ['id', 'topic_ids', 'quiz_ids', 'assignment_ids'],
                raw: true
            });

            if (!accessibleData) {
                return res.status(404).json({
                    success: false,
                    message: "No accessible data found for this user"
                });
            }

            let updatedData = { ...accessibleData };

            updatedData.quiz_ids = accessibleData.quiz_ids.map(quiz => {
                if (quiz.id === quizId) {
                    return { ...quiz, isCompleted: true };
                }
                return quiz;
            });

            // Usage before update
            const normalizedData = normalizeFlags(updatedData);


            await studentAccessibleData.update(
                normalizedData,
                {
                    where: { id: accessibleData.id },
                    returning: true
                }
            );
            // await studentAccessibleData.update(
            //     updatedData,
            //     {
            //         where: { id: accessibleData.id },
            //         returning: true
            //     }
            // );
        }


        const lastAttempt = await QuizCompletion.findOne({
            where: {
                quizId,
                userId
            },
            order: [['lastAttemptTime', 'DESC']]
        });

        // Format lastAttemptTime properly
        const formattedLastAttemptTime = lastAttemptTime ? String(lastAttemptTime) : 'null';

        const { success, data, error } = await callProcedure("createQuizCompletion", [
            userId,
            quizId,
            score || 0,
            isCompleted,
            status,
            lastAttempt?.triedAttempts ? lastAttempt?.triedAttempts + 1 : 1,
            formattedLastAttemptTime,
            count,
            total_question,
            created_by,
            updated_by,
            module_id,
            topic_id ? topic_id : null,
            totalMarks,
            obtainedMarks
        ]);

        if (!success && error) return next(error);

        if (!success) {
            return res.status(400).json({ error });
        }

        // Get the newly created record with all fields
        const quizCompletion = await callProcedure("getQuizCompletionById", [data[0].id]);
        const dataValues = quizCompletion.data[0];

        // Update the course completion percentage
        await callProcedure("calculateCourseCompletionFromAccessData", [userId, courseId]);

        // Update topic completion status based on quiz
        await checkAndUpdateTopicCompletionStatus(userId, courseId, 'quiz', quizId);

        // 🔥 Call module completion check here
        let moduleCompletionStatus = null;
        let sessionCompletionStatus = null;
        let courseCompletionStatus = null;
        if (module_id && courseId && userId) {
            moduleCompletionStatus = await getModuleCompletionStatus(userId, courseId, module_id);

            // 🔥 If module completed, check session completion too
            if (moduleCompletionStatus.isModuleCompleted === true && moduleCompletionStatus.sessionId) {
                sessionCompletionStatus = await getSessionCompletionStatus(userId, courseId, moduleCompletionStatus.sessionId);
                if (sessionCompletionStatus.sessionCompleted === true) {
                    courseCompletionStatus = await getCourseCompletionStatus(userId, courseId)
                }
            }
        }

        // Format the response
        const response = {
            quizCompletion: dataValues,
            moduleCompletionStatus, // include module status in response
            sessionCompletionStatus,
            courseCompletionStatus
        };

        res.status(201).json(response);
    } catch (error) {
        next(error);
    }
};

// //old code

const { Quizzes } = require("../../models/content_management/quizzesModel");
const QuizCompletion = require("../../models/learning_progress/quizCompletion"); // Adjust the path as necessary
const QuizResponse = require("../../models/learning_progress/quizResponse"); // Adjust the path as necessary
const { PreDefinedOptions } = require("../../models/masters/predefinedOption");
const { PreDefinedQuestions } = require("../../models/masters/predefinedQuestion");
const { QuizPreDefinedQuestions } = require("../../models/masters/quizPreDefinedQuestions");
const { QuizQuestion } = require("../../models/content_management/quizQuestion");
const { QuizQuestionOption } = require("../../models/content_management/quizQuestionOption");
const studentAccessibleData = require("../../models/enrollment_management/student_accessible_data");
const { getModuleCompletionStatus, getSessionCompletionStatus, getCourseCompletionStatus, checkAndUpdateTopicCompletionStatus } = require("../../progresTracking/newProgressTracking");
const { Op } = require('sequelize');
const { TextedBasedQuizText } = require("../../models/content_management/textBasedQuizText");
const { FillInBlankQuestion } = require("../../models/content_management/generated_quiz/fillInblankquestion");
const { TrueFalseQuestion } = require("../../models/content_management/generated_quiz/truefalsequestion");
const { MultipleChoiceQuestion } = require("../../models/content_management/generated_quiz/multiplechoicequestion");
const { checkAnswerWithGemini, transcribeAudioWithGemini } = require("../AI/answerCheckController");

async function transcribeSpeakingAnswerByQuestionId(reqFiles, questionId) {
    try {
        // 1️⃣ Find matching audio file
        const audioFile = reqFiles.find(file => {
            const match = file.originalname.match(/speakingAudio_(\d+)/);
            return match && Number(match[1]) === Number(questionId);
        });

        if (!audioFile) {
            return;
        }

        // 2️⃣ Transcribe using Gemini
        const transcript = await transcribeAudioWithGemini(
            audioFile.path,
            audioFile.mimetype
        );

        return transcript;
    } catch (error) {
        console.error(error)
    }
}

exports.evaluateQuiz = async (req, res) => {
    try {
        let { quizId, answers, timeRemaining = 0 } = req.body;
        const userId = req.user?.id || req.body.userId;

        answers = typeof answers === "string" ? JSON.parse(answers) : answers;

        const getAnswerByKeys = (answerObj, keys = []) => {
            for (const key of keys) {
                if (Object.prototype.hasOwnProperty.call(answerObj, key)) {
                    return answerObj[key];
                }
            }
            return undefined;
        };

        const normalizeText = (value) =>
            String(value ?? "")
                .replace(/\s+/g, " ")
                .trim()
                .toLowerCase();

        const normalizeOptionValue = (value) => {
            if (value === null || value === undefined) return null;
            const numeric = Number(value);
            return Number.isNaN(numeric) ? String(value) : numeric;
        };

        const normalizeOptionArray = (value) => {
            if (value === null || value === undefined) return [];
            const raw = Array.isArray(value) ? value : [value];
            return raw
                .map((v) => normalizeOptionValue(v))
                .filter((v) => v !== null)
                .sort((a, b) => String(a).localeCompare(String(b)));
        };

        const evaluateCompleteSentence = (questionObj, answerObj) => {
            const optionsForComplete = [...(questionObj.QuizQuestionOptions || [])].sort(
                (a, b) => (a.id || 0) - (b.id || 0)
            );

            if (!optionsForComplete.length) {
                return {
                    isFullyCorrect: false,
                    marksObtained: 0,
                    correctAnswer: []
                };
            }

            const submittedFullAnswer = answerObj[`complete_sentence_${questionObj.id}`];
            let correctBlanks = 0;

            optionsForComplete.forEach((blank, blankIndex) => {
                const correctWord = String(blank?.complate_correct_word || "");
                const hint = String(blank?.complate_hint || "");

                let userReconstructed = "";

                if (Array.isArray(submittedFullAnswer) && submittedFullAnswer[blankIndex] !== undefined) {
                    userReconstructed = String(submittedFullAnswer[blankIndex] ?? "");
                } else {
                    for (let i = 0; i < correctWord.length; i++) {
                        const keyCandidates = [
                            `complete_sentence_${questionObj.id}_${blankIndex}_${i}`,
                            `${questionObj.id}_${blankIndex}_${i}`,
                            `complete_sentence_${questionObj.id}_${i}`,
                            `${questionObj.id}_${i}`,
                        ];

                        const typedChar = getAnswerByKeys(answerObj, keyCandidates);
                        if (typedChar !== undefined && typedChar !== null && typedChar !== "") {
                            userReconstructed += String(typedChar);
                        } else {
                            userReconstructed += hint[i] ?? "";
                        }
                    }
                }

                if (normalizeText(userReconstructed) === normalizeText(correctWord)) {
                    correctBlanks++;
                }
            });

            const totalBlanks = optionsForComplete.length;
            const isFullyCorrect = correctBlanks === totalBlanks;
            const marksObtained = isFullyCorrect ? Number(questionObj.marks || 0) : 0;

            return {
                isFullyCorrect,
                marksObtained,
                correctAnswer: optionsForComplete.map((b) => ({ correct: b.complate_correct_word }))
            };
        };

        if (!quizId) {
            return res.status(400).json({
                success: false,
                message: 'Quiz ID is required'
            });
        }

        if (!answers) {
            return res.status(400).json({
                success: false,
                message: 'Answers are required'
            });
        }

        // Fetch quiz details
        const quiz = await Quizzes.findByPk(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }

        const lastAttempt = await QuizCompletion.findOne({
            where: {
                quizId,
                userId
            },
            order: [['lastAttemptTime', 'DESC']]
        });

        const maxAttemptsReached = lastAttempt && lastAttempt.triedAttempts >= quiz.max_attempts;

        if (maxAttemptsReached) {
            return res.status(403).json({
                success: false,
                message: "Maximum quiz attempts reached",
                reason: "MAX_ATTEMPTS_REACHED"
            });
        }

        let attemptGapBlocked = false;
        let nextAllowedAttemptAt = null;

        if (lastAttempt && quiz.attempts_gap > 0) {
            const lastAttemptTime = new Date(lastAttempt.lastAttemptTime);
            const gapInMs = quiz.attempts_gap * 60 * 60 * 1000;

            nextAllowedAttemptAt = new Date(lastAttemptTime.getTime() + gapInMs);

            if (Date.now() < nextAllowedAttemptAt.getTime()) {
                attemptGapBlocked = true;
            }
        }

        if (attemptGapBlocked) {
            return res.status(403).json({
                success: false,
                message: "Please wait before retrying the quiz",
                reason: "ATTEMPT_GAP_NOT_PASSED",
                nextAllowedAttemptAt
            });
        }

        // Fetch all questions for this quiz
        let quizQuestions = await QuizQuestion.findAll({
            where: {
                quiz_id: quizId,
                is_active: true
            },
            include: [{
                model: QuizQuestionOption,
                as: 'QuizQuestionOptions',
                where: { is_active: true },
                required: false
            }]
        });

        const quizPreDefinedData = await QuizPreDefinedQuestions.findAll({
            where: {
                quiz_id: quizId
            },
            include: [{
                model: PreDefinedQuestions,
                as: 'PreDefinedQuestion', // Check your actual association name
                where: { is_active: true },
                required: false,
                include: [{
                    model: PreDefinedOptions,
                    as: 'PreDefinedOptions', // or whatever alias you've defined
                    required: false
                }]
            }]
        });

        const preDefinedQuestions = quizPreDefinedData.map(item => {
            const question = item.PreDefinedQuestion;
            if (!question) return null;

            return {
                id: question.id,
                question_text: question.question_text,
                question_img: question.question_img,
                question_type: question.question_type === 'mcq' ? 'predefined_mcq' : question.question_type,
                marks: question.marks,
                options: question.PreDefinedOptions || []
            };
        }).filter(item => item !== null);

        // First, get the text content for this quiz
        const textContents = await TextedBasedQuizText.findAll({
            where: {
                quiz_id: quizId
            },
            include: [
                {
                    model: FillInBlankQuestion,
                    as: 'FillInBlankQuestions',
                    required: false
                },
                {
                    model: MultipleChoiceQuestion,
                    as: 'MultipleChoiceQuestions',
                    required: false
                },
                {
                    model: TrueFalseQuestion,
                    as: 'TrueFalseQuestions',
                    required: false
                }
            ]
        });

        // Transform the data into a unified format
        const textBasedQuestions = [];

        textContents.forEach(textContent => {
            const textId = textContent.id;

            // Process Fill in the Blank questions
            if (textContent.FillInBlankQuestions && textContent.FillInBlankQuestions.length > 0) {
                textContent.FillInBlankQuestions.forEach(question => {
                    textBasedQuestions.push({
                        id: `fill_${question.id}`,
                        type: 'fill_in_the_blank_gq',
                        text: question.text,
                        correctAnswer: question.correctAnswer,
                        marks: question.marks || 1,
                        quizTextId: textId,
                        fullText: textContent.text,
                        isTextBased: true
                    });
                });
            }

            // Process Multiple Choice questions
            if (textContent.MultipleChoiceQuestions && textContent.MultipleChoiceQuestions.length > 0) {
                textContent.MultipleChoiceQuestions.forEach(question => {
                    // Parse options if they're stored as JSON string
                    let options = question.options;
                    if (typeof options === 'string') {
                        try {
                            options = JSON.parse(options);
                        } catch (error) {
                            options = [];
                        }
                    }

                    textBasedQuestions.push({
                        id: `multi_${question.id}`,
                        type: 'mcq_gq',
                        text: question.text,
                        correctAnswer: question.correctAnswer,
                        marks: question.marks || 1,
                        options: options,
                        quizTextId: textId,
                        fullText: textContent.text,
                        isTextBased: true
                    });
                });
            }

            // Process True/False questions
            if (textContent.TrueFalseQuestions && textContent.TrueFalseQuestions.length > 0) {
                textContent.TrueFalseQuestions.forEach(question => {
                    textBasedQuestions.push({
                        id: `true_false_${question.id}`,
                        type: 'true_false_gq',
                        text: question.text,
                        correctAnswer: question.correctAnswer,
                        marks: question.marks || 1,
                        quizTextId: textId,
                        fullText: textContent.text,
                        isTextBased: true
                    });
                });
            }
        });

        // const excludedQuestionIds = new Set();

        // quizQuestions.forEach(question => {
        //     // ❌ if pause question is inactive → exclude its linked questions
        //     if (question.type === "audio_pause" && !question.is_active) {
        //         question.audio_pause_question_ids?.forEach(group =>
        //             group.forEach(id => excludedQuestionIds.add(id))
        //         );
        //     }

        //     if (question.type === "video_pause" && !question.is_active) {
        //         question.video_pause_question_ids?.forEach(group =>
        //             group.forEach(id => excludedQuestionIds.add(id))
        //         );
        //     }
        // });

        // quizQuestions = quizQuestions.filter(question => {
        //     return (
        //         question.is_active &&
        //         !excludedQuestionIds.has(question.id)
        //     );
        // });

        // First, collect all question IDs that are included in pause questions
        const pauseQuestionIds = new Set();

        // Find all audio_pause and video_pause questions
        quizQuestions.forEach(question => {
            if (question.type === 'audio_pause' && question.audio_pause_question_ids) {
                // Flatten the nested arrays and add all IDs to the set
                question.audio_pause_question_ids.forEach(idArray => {
                    idArray.forEach(id => pauseQuestionIds.add(id));
                });
            }

            if (question.type === 'video_pause' && question.video_pause_question_ids) {
                // Flatten the nested arrays and add all IDs to the set
                question.video_pause_question_ids.forEach(idArray => {
                    idArray.forEach(id => pauseQuestionIds.add(id));
                });
            }
        });

        // Now modify the types of questions that are in pauseQuestionIds
        quizQuestions.forEach(question => {
            if (pauseQuestionIds.has(question.id) && question.type !== 'audio_pause' && question.type !== 'video_pause') {
                question.type = `${question.type}_pause`;
            }
        });

        const questions = [...quizQuestions, ...preDefinedQuestions, ...textBasedQuestions];

        if (!questions.length) {
            return res.status(404).json({
                success: false,
                message: 'No questions found for this quiz'
            });
        }

        // Process and evaluate answers
        let calculatedEarnedMarks = 0;
        let calculatedTotalMarks = 0;
        let correctAnswerCount = 0;
        const detailedResults = [];
        const isTimeExpired = timeRemaining <= 1;

        for (const question of questions) {
            const questionMarks = question.marks;
            // Add Question Marks in Total Marks Only If its not Pause Questions Because it make count twice as already included in audio_pause, video_pause
            if (!pauseQuestionIds.has(question.id) || question.type === 'audio_pause' || question.type === 'video_pause') {
                calculatedTotalMarks += questionMarks;
            }
            let questionIsFullyCorrect = false;
            let userAnswer = answers[question.id];
            let correctAnswer = null;
            let explanation = null;
            let marksObtained = 0;

            switch (question.type || question.question_type) {
                case 'dragdrop':
                    userAnswer = answers[`drag_drop_${question.id}`]
                    if (userAnswer) {
                        const userAnswers = typeof userAnswer === 'string' ? JSON.parse(userAnswer) : userAnswer;
                        const dragdropBlanks = question.dragdrop_blanks || [];
                        let correctBlanks = 0;
                        const totalBlanks = dragdropBlanks.length;
                        const marksPerBlank = questionMarks / totalBlanks;

                        dragdropBlanks.forEach((blank, index) => {
                            const position = blank.position;
                            const userChoice = userAnswers[position];

                            if (userChoice && userChoice === blank.correct) {
                                correctBlanks++;
                                marksObtained += marksPerBlank;
                            }
                        });

                        if (correctBlanks === totalBlanks) {
                            questionIsFullyCorrect = true;
                        }

                        correctAnswer = dragdropBlanks.map(b => ({ position: b.position, correct: b.correct }));
                    }
                    break;

                case 'audiotoscript':
                case 'videotoscript':
                case 'imagetoscript':
                case 'speaking':
                    if (question.type === 'audiotoscript') {
                        userAnswer = answers[`audio_${question.id}`]
                    } else if (question.type === 'videotoscript') {
                        userAnswer = answers[`video_${question.id}`]
                    } else if (question.type === 'imagetoscript') {
                        userAnswer = answers[`image_${question.id}`]
                    } else if (question.type === 'speaking') {
                        const transcript = await transcribeSpeakingAnswerByQuestionId(req.files, question.id);
                        userAnswer = transcript ?? answers[`speaking_${question.id}`]?.transcript;
                    }
                    if (userAnswer) {
                        const correctScript =
                            question.audiotoscript_script ||
                            question.videotoscript_script ||
                            question.imagetoscript_script ||
                            question.speaking_answer;

                        const { similarity } = await checkAnswerWithGemini(
                            question.type,
                            question.type === 'speaking' ? question.speaking_question : "",
                            correctScript,
                            userAnswer
                        );

                        if (similarity >= 70) {
                            questionIsFullyCorrect = true;
                        }

                        marksObtained = questionMarks * Number(similarity) / 100;
                        correctAnswer = correctScript;
                    }
                    break;

                case 'realword':
                    const correctAnswers = question.realword_correct_answers || [];
                    if (Array.isArray(correctAnswers)) {
                        const correctCount = correctAnswers.filter((ans, idx) =>
                            normalizeText(ans) === normalizeText(
                                getAnswerByKeys(answers, [
                                    `realword_${question.id}_word_${idx}`,
                                    `realword_${question.id}_${idx}`,
                                    `${question.id}_word_${idx}`,
                                    `${question.id}_${idx}`,
                                ])
                            )
                        ).length;

                        const marksPerWord = questionMarks / correctAnswers.length;
                        marksObtained = correctCount * marksPerWord;

                        if (correctCount === correctAnswers.length) {
                            questionIsFullyCorrect = true;
                        }

                        correctAnswer = correctAnswers;
                    }
                    break;

                case 'summarizepassage':
                    userAnswer = answers[`summary_${question.id}`]
                    if (userAnswer?.userPassage) {
                        const { similarity } = await checkAnswerWithGemini(
                            "summary_passage",
                            "Check the Summarize of this",
                            question.summarizepassage_summary,
                            userAnswer.userPassage
                        );

                        if (similarity >= 70) {
                            questionIsFullyCorrect = true;
                        }

                        marksObtained = questionMarks * Number(similarity) / 100;
                        correctAnswer = question.summarizepassage_summary;
                    }
                    break;

                case 'bestoption':
                    const blankedWords = question.bestoption_blanked_words || [];
                    let allBlanksCorrect = true;
                    const totalBlanks = blankedWords.length;
                    const marksPerBlank = questionMarks / totalBlanks;

                    blankedWords.forEach((blankedWord, index) => {
                        const userBlankAnswer = answers[`bestoption_${question.id}_${index}`];
                        if (userBlankAnswer && userBlankAnswer.toLowerCase() === blankedWord.word.toLowerCase()) {
                            marksObtained += marksPerBlank;
                        } else {
                            allBlanksCorrect = false;
                        }
                    });

                    if (allBlanksCorrect) {
                        marksObtained = questionMarks;
                        questionIsFullyCorrect = true;
                    }

                    correctAnswer = blankedWords.map(b => b.word);
                    break;

                case 'mcq':
                    const options = question.QuizQuestionOptions || [];
                    const correctOptions = options.filter(opt => opt.mcq_is_correct).map(o => normalizeOptionValue(o.id));

                    if (correctOptions.length > 1) {
                        // Multi-select
                        const userArray = normalizeOptionArray(userAnswer);
                        const correctArray = normalizeOptionArray(correctOptions);
                        const isCorrect = userArray.length === correctArray.length &&
                            userArray.every((val, idx) => val === correctArray[idx]);

                        if (isCorrect) {
                            marksObtained = questionMarks;
                            questionIsFullyCorrect = true;
                        }
                    } else {
                        // Single-select
                        const normalizedUserAnswer = normalizeOptionValue(userAnswer);
                        if (correctOptions.includes(normalizedUserAnswer)) {
                            marksObtained = questionMarks;
                            questionIsFullyCorrect = true;
                        }
                    }

                    correctAnswer = correctOptions;
                    break;

                case 'predefined_mcq':
                    userAnswer = answers[`pre_${question.id}`];
                    if (userAnswer) {
                        const mcqQuestion = preDefinedQuestions.find(que => que.id === question.id)
                        // Find the correct option for this question
                        const correctOption = mcqQuestion.options.find(opt => opt.is_correct);
                        const correctOptionId = `pre_opt_${correctOption.id}`;

                        // Check if user selected the correct option
                        const isCorrect = userAnswer === correctOptionId;

                        if (isCorrect) {
                            marksObtained = questionMarks;
                            questionIsFullyCorrect = true;
                        }
                        correctAnswer = correctOptionId;
                    }

                    break;

                case 'true_false':
                    userAnswer = answers[`pre_${question.id}`];
                    if (userAnswer) {
                        const trueFalseQuestion = preDefinedQuestions.find(que => que.id === question.id)
                        // Find the correct option for this question
                        const correctOption = trueFalseQuestion.options.find(opt => opt.is_correct);
                        const correctOptionId = `pre_opt_${correctOption.id}`;

                        // Check if user selected the correct option
                        const isCorrect = userAnswer === correctOptionId;

                        if (isCorrect) {
                            marksObtained = questionMarks;
                            questionIsFullyCorrect = true;
                        }
                        correctAnswer = correctOptionId;
                    }

                    break;

                case 'image':
                    userAnswer = answers[`pre_${question.id}`];
                    const imageQuestion = preDefinedQuestions.find(que => que.id === question.id)
                    // Find the correct option for this question
                    const imageCorrectOption = imageQuestion.options.find(opt => opt.is_correct);
                    const imageCorrectOptionId = `pre_opt_${imageCorrectOption.id}`;

                    // Check if user selected the correct option
                    const isCorrect = userAnswer === imageCorrectOptionId;

                    if (isCorrect) {
                        marksObtained = questionMarks;
                        questionIsFullyCorrect = true;
                    }

                    correctAnswer = imageCorrectOptionId;
                    break;

                case 'fill_in_the_blank_gq':
                    if (userAnswer) {
                        correctAnswer = question.correctAnswer;

                        // Check if user selected the correct option
                        const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

                        if (isCorrect) {
                            marksObtained = questionMarks;
                            questionIsFullyCorrect = true;
                        }
                    }
                    break;

                case 'true_false_gq':
                    if (userAnswer) {
                        correctAnswer = question.correctAnswer;

                        // Check if user selected the correct option
                        const isCorrect = (userAnswer === "True") === correctAnswer;

                        if (isCorrect) {
                            marksObtained = questionMarks;
                            questionIsFullyCorrect = true;
                        }
                    }
                    break;

                case 'mcq_gq':
                    if (userAnswer) {
                        const correctIndex = question.options.indexOf(question.correctAnswer);

                        // Check if user selected the correct option
                        const isCorrect = userAnswer == `${question.id}_opt_${correctIndex}`;

                        if (isCorrect) {
                            marksObtained = questionMarks;
                            questionIsFullyCorrect = true;
                        }
                    }
                    break;

                case 'complete the sentance':
                    const completeSentenceResult = evaluateCompleteSentence(question, answers);
                    questionIsFullyCorrect = completeSentenceResult.isFullyCorrect;
                    marksObtained = completeSentenceResult.marksObtained;
                    correctAnswer = completeSentenceResult.correctAnswer;
                    break;

                case 'arrangeorder':
                    const sentences = question.sentences || [];
                    userAnswer = answers[`arrangeorder_${question.id}`]

                    if (Array.isArray(userAnswer) && userAnswer.length === sentences.length) {
                        const isCorrect = userAnswer.every((sentence, index) =>
                            sentence === sentences[index]
                        );

                        if (isCorrect) {
                            marksObtained = questionMarks;
                            questionIsFullyCorrect = true;
                        }
                    }

                    correctAnswer = sentences;
                    break;

                case 'video_pause':
                case 'audio_pause':
                    // For pause questions, we need to evaluate associated questions
                    const pauseQuestionIds = question[`${question.type}_question_ids`] || [];
                    // const pauseStamps = question[`${question.type}_stamps`] || [];

                    let pauseTotalMarks = 0;
                    let pauseEarnedMarks = 0;

                    // Evaluate each pause question separately
                    for (const pauseQId of pauseQuestionIds) {
                        const pauseQuestion = questions.find(q => q.id === pauseQId[0]);
                        if (pauseQuestion) {
                            const pauseQType = pauseQuestion.type.replace('_pause', '');
                            const pauseUserAnswer = getAnswerByKeys(answers, [
                                String(pauseQuestion.id),
                                pauseQuestion.id,
                                pauseQId,
                                String(pauseQId)
                            ]);
                            let pauseCorrect = false;
                            let pauseCorrectAnswer = '';

                            switch (pauseQType) {
                                case 'dragdrop':
                                    userAnswer = answers[`dragdrop_${pauseQuestion.id}`]
                                    if (userAnswer) {
                                        const userAnswers = typeof userAnswer === 'string' ? JSON.parse(userAnswer) : userAnswer;
                                        const dragdropBlanks = pauseQuestion.dragdrop_blanks || [];
                                        let correctBlanks = 0;
                                        const totalBlanks = dragdropBlanks.length;
                                        const marksPerBlank = pauseQuestion.marks / totalBlanks;

                                        dragdropBlanks.forEach((blank, index) => {
                                            const position = blank.position;
                                            const userChoice = userAnswers[position];

                                            if (userChoice && userChoice === blank.correct) {
                                                correctBlanks++;
                                                pauseEarnedMarks += (marksPerBlank || 0);
                                            }
                                        });

                                        if (correctBlanks === totalBlanks) {
                                            pauseCorrect = true;
                                        }

                                        pauseCorrectAnswer = dragdropBlanks.map(b => ({ position: b.position, correct: b.correct }));
                                    }
                                    break;

                                case 'mcq':
                                    const pauseOptions = pauseQuestion.QuizQuestionOptions || [];
                                    const pauseCorrectOptions = pauseOptions.filter(opt => opt.mcq_is_correct).map(o => normalizeOptionValue(o.id));

                                    if (pauseCorrectOptions.length > 1) {
                                        const userArray = normalizeOptionArray(pauseUserAnswer);
                                        const correctArray = normalizeOptionArray(pauseCorrectOptions);
                                        const isCorrect = userArray.length === correctArray.length &&
                                            userArray.every((val, idx) => val === correctArray[idx]);

                                        if (isCorrect) {
                                            pauseEarnedMarks += (pauseQuestion.marks || 0);
                                            pauseCorrect = true;
                                        }
                                    } else {
                                        const normalizedPauseAnswer = normalizeOptionValue(pauseUserAnswer);
                                        if (pauseCorrectOptions.includes(normalizedPauseAnswer)) {
                                            pauseEarnedMarks += (pauseQuestion.marks || 0);
                                            pauseCorrect = true;
                                        }
                                    }

                                    pauseCorrectAnswer = pauseCorrectOptions;
                                    break;

                                case 'complete the sentance':
                                    const pauseCompleteSentenceResult = evaluateCompleteSentence(pauseQuestion, answers);
                                    pauseEarnedMarks += pauseCompleteSentenceResult.marksObtained;
                                    pauseCorrect = pauseCompleteSentenceResult.isFullyCorrect;
                                    break;

                                case 'bestoption':
                                    const blankedWords = pauseQuestion.bestoption_blanked_words || [];
                                    let allBlanksCorrect = true;

                                    blankedWords.forEach((blankedWord, index) => {
                                        const userBlankAnswer = answers[`${pauseQuestion.id}_${index}`];
                                        if (!userBlankAnswer ||
                                            userBlankAnswer.toLowerCase() !== blankedWord.word.toLowerCase()) {
                                            allBlanksCorrect = false;
                                        }
                                    });

                                    if (allBlanksCorrect) {
                                        pauseEarnedMarks += pauseQuestion.marks;
                                        pauseCorrect = true;
                                    }

                                    break;

                                case 'arrangeorder':
                                    const sentences = pauseQuestion.sentences || [];
                                    userAnswer = answers[`arrangeorder_${pauseQuestion.id}`]

                                    if (Array.isArray(userAnswer) && userAnswer.length === sentences.length) {
                                        const isCorrect = userAnswer.every((sentence, index) =>
                                            sentence === sentences[index]
                                        );

                                        if (isCorrect) {
                                            pauseEarnedMarks += pauseQuestion.marks;
                                            pauseCorrect = true;
                                        }
                                    }

                                    break;

                                case 'realword':
                                    const correctAnswers = pauseQuestion.realword_correct_answers || [];
                                    if (Array.isArray(correctAnswers)) {
                                        const correctCount = correctAnswers.filter((ans, idx) =>
                                            normalizeText(ans) === normalizeText(
                                                getAnswerByKeys(answers, [
                                                    `realword_${pauseQuestion.id}_word_${idx}`,
                                                    `realword_${pauseQuestion.id}_${idx}`,
                                                    `${pauseQuestion.id}_word_${idx}`,
                                                    `${pauseQuestion.id}_${idx}`,
                                                ])
                                            )
                                        ).length;

                                        const marksPerWord = pauseQuestion.marks / correctAnswers.length;
                                        pauseEarnedMarks += correctCount * marksPerWord;

                                        if (correctCount === correctAnswers.length) {
                                            pauseCorrect = true;
                                        }

                                        pauseCorrectAnswer = correctAnswers;
                                    }
                                    break;

                                case 'summarizepassage':
                                    userAnswer = answers[`${pauseQuestion.id}`]
                                    if (userAnswer) {
                                        const { similarity } = await checkAnswerWithGemini(
                                            "summary_passage",
                                            "Check the Summarize of this",
                                            pauseQuestion.summarizepassage_summary,
                                            userAnswer
                                        );

                                        if (similarity >= 70) {
                                            pauseCorrect = true;
                                        }

                                        pauseEarnedMarks += pauseQuestion.marks * Number(similarity) / 100;
                                        pauseCorrectAnswer = question.summarizepassage_summary;
                                    }
                                    break;

                                case 'speaking':
                                    const transcript = await transcribeSpeakingAnswerByQuestionId(
                                        req.files,
                                        pauseQuestion.id
                                    );

                                    userAnswer = transcript ?? answers[`speaking_${pauseQuestion.id}`]?.transcript ?? answers[`${pauseQuestion.id}`]?.transcript;

                                    if (userAnswer) {
                                        const { similarity } = await checkAnswerWithGemini(
                                            "speaking",
                                            pauseQuestion.speaking_question,
                                            pauseQuestion.speaking_answer,
                                            userAnswer
                                        );

                                        if (similarity >= 70) {
                                            pauseCorrect = true;
                                        }
                                        pauseEarnedMarks += pauseQuestion.marks * Number(similarity) / 100;

                                    }
                                    break;
                            }
                            pauseTotalMarks += (pauseQuestion.marks || 0);

                            detailedResults.push({
                                questionId: pauseQuestion.id,
                                type: pauseQuestion.type,
                                marks: pauseQuestion.marks,
                                isCorrect: pauseCorrect,
                                userAnswer: pauseUserAnswer,
                                correctAnswer: pauseCorrectAnswer
                            });

                        }
                    }

                    marksObtained = pauseEarnedMarks;
                    if (pauseEarnedMarks === pauseTotalMarks && pauseTotalMarks > 0) {
                        questionIsFullyCorrect = true;
                    }
                    break;

                default:
                    // Handle other question types or default to MCQ logic
                    // const defaultOptions = question.QuizQuestionOptions || [];
                    // const defaultCorrectOptions = defaultOptions.filter(opt => opt.mcq_is_correct).map(o => o.id);

                    // if (defaultCorrectOptions.includes(userAnswer)) {
                    //     marksObtained = questionMarks;
                    //     questionIsFullyCorrect = true;
                    // }

                    correctAnswer = "Question Not Found";
            }

            calculatedEarnedMarks += marksObtained;

            if (questionIsFullyCorrect) {
                correctAnswerCount++;
            }

            // Store detailed result for this question
            detailedResults.push({
                questionId: question.id,
                type: question.type,
                marks: questionMarks,
                obtainedMarks: marksObtained,
                isCorrect: questionIsFullyCorrect,
                userAnswer: userAnswer,
                correctAnswer: correctAnswer,
                explanation: explanation
            });
        }

        // Calculate final score
        const finalScore = calculatedTotalMarks > 0
            ? (calculatedEarnedMarks / calculatedTotalMarks) * 100
            : 0;

        const hasPassed = finalScore >= (quiz.passing_score || 70);

        // Save quiz attempt to database (you'll need to create this model)
        // const quizAttempt = await QuizAttempt.create({
        //   user_id: userId,
        //   quiz_id: quizId,
        //   score: finalScore,
        //   total_marks: calculatedTotalMarks,
        //   earned_marks: calculatedEarnedMarks,
        //   correct_answers: correctAnswerCount,
        //   total_questions: questions.length,
        //   time_spent: quiz.duration_minutes * 60 - timeRemaining,
        //   passed: hasPassed,
        //   detailed_results: detailedResults,
        //   submission_reason: req.body.submissionReason || 'user_submit'
        // });

        return res.status(200).json({
            success: true,
            data: {
                score: Number(finalScore.toFixed(2)),
                totalMarks: calculatedTotalMarks,
                earnedMarks: Number(calculatedEarnedMarks.toFixed(2)),
                correctAnswers: correctAnswerCount,
                totalQuestions: questions.length,
                hasPassed: hasPassed,
                isTimeExpired: isTimeExpired,
                // detailedResults: detailedResults,
                // attemptId: quizAttempt.id // If you save the attempt
            },
            message: 'Quiz evaluated successfully'
        });

    } catch (error) {
        console.error('Error evaluating quiz:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Helper function to calculate similarity percentage
const calculateSimilarity = (text1, text2) => {
    if (!text1 || !text2) return 0;

    const str1 = text1.toLowerCase().replace(/\s+/g, ' ');
    const str2 = text2.toLowerCase().replace(/\s+/g, ' ');

    if (str1 === str2) return 100;

    // Simple similarity calculation (you can replace with more sophisticated algorithm)
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));

    return Math.round((commonWords.length / Math.max(words1.length, words2.length)) * 100);
};

// // // Get Quiz Completion by ID
exports.getQuizResponsesByStudentId = async (req, res) => {
    const { studentId } = req.params;
    try {
        const quizCompletions = await QuizCompletion.findAll({
            where: { userId: studentId },
            include: [
                { model: QuizResponse },
                {
                    model: Quizzes,
                    include: [
                        {
                            model: QuizPreDefinedQuestions,
                            include: [
                                {
                                    model: PreDefinedQuestions,
                                    include: [{ model: PreDefinedOptions }],
                                },
                            ],
                        },
                        {
                            model: QuizQuestion,
                            include: [{ model: QuizQuestionOption }],
                        },
                    ],
                }
            ],
            order: [['created_at', 'DESC']] // Ensure newer records come first
        });

        // Group by quizId and keep only the first (latest) entry per quizId
        const uniqueQuizzesMap = new Map();
        for (const completion of quizCompletions) {
            if (!uniqueQuizzesMap.has(completion.quizId)) {
                uniqueQuizzesMap.set(completion.quizId, completion);
            }
        }

        const latestQuizCompletions = Array.from(uniqueQuizzesMap.values());

        res.status(200).json(latestQuizCompletions);
    } catch (error) {
        console.error("Error fetching quiz responses by student ID:", error);
        res.status(400).json({ error: error.message });
    }
};

exports.getQuizCompletionByQuizId = async (req, res) => {
    try {
        const { quizId, userId } = req.params;

        const quizCompletion = await QuizCompletion.findAll({  // <-- await missing
            where: {
                quizId: quizId,
                userId: userId,
            },
            raw: true,
        });

        res.status(200).json(quizCompletion); // <-- you must send response
    } catch (error) {
        console.error("Error fetching quiz completion by student ID:", error);
        res.status(500).json({ message: "Error fetching quiz completion" });
    }
};
