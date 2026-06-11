/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
//DisplayQuizContent.jsx

import React, { useState, useEffect, useMemo } from "react";
import {
    FaArrowLeft,
    FaCheck,
    FaLightbulb,
    FaPlayCircle,
    FaClock,
    FaTrophy,
    FaCheckCircle,
    FaTimesCircle,
    FaRedo,
    FaArrowRight,
    FaChartBar,
    FaExclamationTriangle,
    FaUsers,
    FaAward,
    FaQuestion,
    FaGraduationCap,
    FaBars,
} from "react-icons/fa";
import { motion } from "framer-motion";
import BestOptionQuestion from "./BestOptionQuestion";
import DragDropQuestion from "./DragDropQuestion";
import AudioPlayer from "../../ui/audioPlayer";
import { getStudentToken } from "../../../services/CookieService";
import { useCreateQuizCompletionMutation } from "../../../services/QuizResponse/quizCompletionApi";
import { useCreateQuizResponseMutation } from "../../../services/QuizResponse/quizResponseApi";
import { useGetQuizCompletionByStudentIdQuery } from "../../../services/QuizResponse/quizCompletionApi";
import { addCompletion } from "../../../features/QuizResponse/quizCompletionSlice";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { useCreateSummarizePassageResponseMutation } from "../../../services/Learning_Progress/summarizePassageResponseApi";
import ArrangeOrderQuestion from "./ArrangeOrderQuestion";

// Function to count total questions in a quiz
const countTotalQuestions = (quiz) => {
    if (!quiz) return 0;

    return (
        (quiz.QuizQuestions?.length || 0) +
        (quiz.QuizPreDefinedQuestions?.length || 0) +
        (quiz.RealWordQuestions?.[0]?.correct_answers?.length || 0) +
        (quiz.AudioToScriptQuestions?.length || 0) +
        (quiz.DragDropQuestions?.length || 0) +
        (quiz.SummarizePassageQuestions?.length || 0) +
        (quiz.BestOptionQuestions?.length || 0) +
        (quiz.CompleteSentenceQuestions?.length || 0)
    );
};

// Robust date parser (supports ms timestamps, numeric strings, ISO strings)
const parseDateValue = (value) => {
    if (!value && value !== 0) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value === 'number') {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;
        if (/^\d+$/.test(trimmed)) { // pure digits
            const num = parseInt(trimmed, 10);
            const d = new Date(num);
            return isNaN(d.getTime()) ? null : d;
        }
        const d = new Date(trimmed);
        return isNaN(d.getTime()) ? null : d;
    }
    return null;
};

function CollapsibleText({ text, maxLines = 2 }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className="w-full max-w-2xl mx-auto my-4">
            <div className="bg-white rounded-lg shadow-md p-4">
                <div
                    className={`relative ${!isExpanded ? "overflow-hidden" : ""}`}
                    style={{ maxHeight: isExpanded ? "none" : `${maxLines * 1.5}rem` }}
                >
                    <p className="text-gray-800">{text}</p>

                    {!isExpanded && (
                        <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent"></div>
                    )}
                </div>

                <button
                    onClick={toggleExpand}
                    className="mt-2 text-blue-500 hover:text-blue-700 font-medium flex items-center"
                >
                    {isExpanded ? "Show less" : "..."}
                </button>
            </div>
        </div>
    );
}

// CompleteSentenceQuestion subcomponent for modular rendering
function CompleteSentenceQuestion({ question, selectedAnswers, handleCompleteSentenceInput }) {
    const parts = question.question.split("_____");
    const numBlanks = parts.length - 1;

    // Handle both new array format and legacy single string format
    const correctWords = Array.isArray(question.correct_word)
        ? question.correct_word
        : Array(numBlanks).fill(question.correct_word || "");

    const hints = Array.isArray(question.hint)
        ? question.hint
        : Array(numBlanks).fill(question.hint || "");

    // Ensure we have enough correct words and hints for all blanks
    while (correctWords.length < numBlanks) {
        correctWords.push("");
    }

    while (hints.length < numBlanks) {
        hints.push("");
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                {parts.map((part, blankIndex) => (
                    <React.Fragment key={`part_${blankIndex}`}>
                        <span className="text-slate-800">{part}</span>

                        {blankIndex < numBlanks && (
                            <div className="inline-flex border border-slate-300 rounded-lg overflow-hidden shadow-sm">
                                {Array.from({ length: correctWords[blankIndex]?.length || 0 }).map((_, letterIndex) => {
                                    const inputId = `${question.id}_${blankIndex}_${letterIndex}`;
                                    const hintLetters = hints[blankIndex]?.split("") || [];
                                    const isHintLetter = letterIndex < hintLetters.length;

                                    const value = isHintLetter
                                        ? hintLetters[letterIndex]
                                        : selectedAnswers[inputId] || "";

                                    return (
                                        <div
                                            key={letterIndex}
                                            className={`w-9 h-9 flex justify-center items-center ${isHintLetter ? "bg-blue-50" : "bg-white"
                                                } ${letterIndex < correctWords[blankIndex].length - 1 ? "border-r border-slate-300" : ""}`}
                                        >
                                            <input
                                                type="text"
                                                id={inputId}
                                                maxLength={1}
                                                className="w-full h-full text-center text-base font-medium focus:outline-none bg-transparent lowercase"
                                                value={value}
                                                readOnly={isHintLetter}
                                                onChange={(e) => {
                                                    if (!isHintLetter) {
                                                        const letter = e.target.value.toLowerCase();
                                                        handleCompleteSentenceInput(
                                                            question.id,
                                                            blankIndex,
                                                            letterIndex,
                                                            letter
                                                        );

                                                        // Auto-focus to the next letter if not empty
                                                        if (letter && letterIndex < correctWords[blankIndex].length - 1) {
                                                            const nextInputId = `${question.id}_${blankIndex}_${letterIndex + 1}`;
                                                            const nextInput = document.getElementById(nextInputId);
                                                            if (nextInput) {
                                                                nextInput.focus();
                                                            }
                                                        }
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    // Backspace: go to previous letter
                                                    if (e.key === "Backspace" && !value && letterIndex > 0) {
                                                        let prevIndex = letterIndex - 1;
                                                        const prevInputId = `${question.id}_${blankIndex}_${prevIndex}`;
                                                        const prevInput = document.getElementById(prevInputId);
                                                        if (prevInput) {
                                                            prevInput.focus();
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}

export default function DisplayQuizContentDup({
    activeQuiz,
    setActiveTopic,
    onBack,
    setActiveQuiz,
    quizData,
    userId,
    refetchModules,
    isQuizCompleted,
    completionData,
    topicContentDataByModule,
    setAttachmentsCompleted,
    refetchTopics,
    materialType,
    courseId,
    refetchQuizCompletion,
    setQuizStarted,
}) {
    const totalQuestionCount = countTotalQuestions(activeQuiz);
    const [showInstructions, setShowInstructions] = useState(true);
    const [quizInProgress, setQuizInProgress] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [combinedQuestions, setCombinedQuestions] = useState([]);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [totalMarks, setTotalMarks] = useState(0);
    const [earnedMarks, setEarnedMarks] = useState(0);
    const [alertCount, setAlertCount] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [showBackModal, setShowBackModal] = useState(false);
    const [timeExpired, setTimeExpired] = useState(false);
    const [hasPassedQuiz, setHasPassedQuiz] = useState(false);
    const [summaryTimeRemaining, setSummaryTimeRemaining] = useState(null);
    const [isSummaryTimerRunning, setIsSummaryTimerRunning] = useState(false);
    const [quizCompletions, setQuizCompletions] = useState([]);
    const { access_token } = getStudentToken();
    const dispatch = useDispatch();
    const [completionId, setCompletionId] = useState();
    const [triedAttempts, setTriedAttempts] = useState(0);
    const [nextAttemptTime, setNextAttemptTime] = useState(null); // Date object for next allowed attempt (gap rule)
    const [renewalTime, setRenewalTime] = useState(null); // Date object when attempts renew (renew rule)
    const [lastAttemptTime, setLastAttemptTime] = useState(null); // Date object of last attempt
    const [canAttempt, setCanAttempt] = useState(true);
    const [attemptsExhausted, setAttemptsExhausted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const [createQuizCompletion] = useCreateQuizCompletionMutation();
    const [createQuizResponse] = useCreateQuizResponseMutation();

    const [createSummarizePassageResponse] = useCreateSummarizePassageResponseMutation();

    // Mobile detection
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        // When active quiz changes, reset attempt tracking (will be recalculated below)
        setAttemptsExhausted(false);
        setNextAttemptTime(null);
        setRenewalTime(null);
        setLastAttemptTime(null);
        setCanAttempt(true);
        setTriedAttempts(0);
    }, [activeQuiz]);


    // Add this function to check if user can attempt quiz

    const checkAttemptEligibility = (latestCompletion) => {
        if (!activeQuiz || !latestCompletion) {
            setCanAttempt(true);
            return true;
        }
        const now = new Date();
        const attemptsGap = Number(activeQuiz.attempts_gap) || 0;
        const maxAttempts = Number(activeQuiz.max_attempts) || Infinity;
        const renewDays = Number(activeQuiz.attempts_renew_days) || 0;

        // Normalise last attempt time (could be ms timestamp or ISO string)
        const lastTimeRaw = latestCompletion.lastAttemptTime || latestCompletion.updatedAt || latestCompletion.createdAt;
        const lastTime = parseDateValue(lastTimeRaw);
        if (lastTime) setLastAttemptTime(lastTime);

        const usedAttempts = latestCompletion.triedAttempts || 0;

        // Renewal logic
        if (maxAttempts !== Infinity && usedAttempts >= maxAttempts) {
            // compute renewal date if applicable
            if (renewDays > 0 && lastTime) {
                const renew = new Date(lastTime.getTime());
                renew.setDate(renew.getDate() + renewDays);
                setRenewalTime(renew);
                if (now >= renew) {
                    // Renewal window reached, reset state so user can attempt again
                    setAttemptsExhausted(false);
                    setCanAttempt(true);
                    setNextAttemptTime(null);
                    return true;
                }
            }
            setAttemptsExhausted(true);
            setCanAttempt(false);
            return false;
        } else {
            setAttemptsExhausted(false);
        }

        // Gap logic (only matters if user already has at least one attempt)
        if (attemptsGap > 0 && lastTime) {
            const next = new Date(lastTime.getTime());
            next.setHours(next.getHours() + attemptsGap);
            if (now < next) {
                setNextAttemptTime(next);
                setCanAttempt(false);
                return false;
            }
        }

        setNextAttemptTime(null);
        setCanAttempt(true);
        return true;
    };

    // Derive completions for this quiz from completionData prop (all completions)
    const quizCompletionHistory = useMemo(() => {
        if (!completionData || !activeQuiz) return [];
        return completionData.filter(c => c.quizId === activeQuiz.id)
            .sort((a, b) => {
                const atDate = parseDateValue(a.lastAttemptTime || a.updatedAt || a.createdAt);
                const btDate = parseDateValue(b.lastAttemptTime || b.updatedAt || b.createdAt);
                const at = atDate ? atDate.getTime() : 0;
                const bt = btDate ? btDate.getTime() : 0;
                return bt - at;
            });
    }, [completionData, activeQuiz]);

    // Recalculate attempt metadata when history changes
    useEffect(() => {
        if (quizCompletionHistory.length === 0) {
            setTriedAttempts(0);
            setLastAttemptTime(null);
            setNextAttemptTime(null);
            setRenewalTime(null);
            setCanAttempt(true);
            setAttemptsExhausted(false);
            return;
        }
        const latest = quizCompletionHistory[0];
        const used = latest.triedAttempts || quizCompletionHistory.length;
        setTriedAttempts(used);
        checkAttemptEligibility(latest);
    }, [quizCompletionHistory]);

    // Modify the useEffect that checks quiz completion
    useEffect(() => {
        if (isQuizCompleted && activeQuiz?.completionData) {
            // Always show latest results when a completion object is present
            setShowResults(true);
            setShowInstructions(false);
            setScore(activeQuiz.completionData.score);
            setCorrectAnswers(activeQuiz.completionData.count);
            setTotalMarks(activeQuiz.completionData.totalMarks || 0);
            setEarnedMarks(activeQuiz.completionData.obtainedMarks || 0);
            setHasPassedQuiz(activeQuiz.completionData.status === "Passed");
            setTimeExpired(false);
            if (activeQuiz.completionData.QuizResponses) {
                setCombinedQuestions(activeQuiz.completionData.QuizResponses);
            }
            if (activeQuiz.completionData.triedAttempts) {
                setTriedAttempts(activeQuiz.completionData.triedAttempts);
            }
            setQuizCompletions(activeQuiz.completionData);
            checkAttemptEligibility(activeQuiz.completionData);
        } else if (!quizInProgress && !showResults) {
            // Only revert to instructions if not currently displaying a fresh result
            setShowResults(false);
            setShowInstructions(true);
        }
    }, [isQuizCompleted, activeQuiz, quizInProgress]);



    // Add check for topic quiz completion
    useEffect(() => {
        const isTopicQuiz = topicContentDataByModule?.data?.[0]?.data?.some(
            (content) => content.quiz_id === activeQuiz.id
        );

        // If it's a completed topic quiz, show results directly
        if (isTopicQuiz && isQuizCompleted && activeQuiz?.completionData) {
            setShowResults(true);
            setShowInstructions(false);
        } else if (isTopicQuiz && !isQuizCompleted) {
            setShowResults(false);
            setShowInstructions(true);
        }
    }, [activeQuiz, isQuizCompleted, topicContentDataByModule]);

    // Check if quiz is associated with a topic
    const isTopicQuiz = topicContentDataByModule?.data?.[0]?.data?.some(
        (content) => content.quiz_id === activeQuiz.id
    );

    const handleBack = () => {
        if (setActiveQuiz) {
            setActiveQuiz(quizData); // Set activeQuiz to the full quizData array to show cards
            setActiveTopic(null); // Reset activeTopic to null
        }
        if (onBack) onBack();
    };

    const handleCompleteSentenceInput = (questionId, blankIndex, letterIndex, value) => {
        const letterKey = `${questionId}_${blankIndex}_${letterIndex}`;
        setSelectedAnswers((prev) => ({
            ...prev,
            [letterKey]: value,
        }));
    };


    // Modify handleBeginQuiz to check eligibility
    const handleBeginQuiz = () => {
        if (!canAttempt) {
            if (attemptsExhausted) {
                toast.error("Maximum attempts reached. Please wait for renewal.");
            } else if (nextAttemptTime) {
                toast.warn("You must wait until the next attempt time.");
            }
            return;
        }

        setQuizStarted(true);
        setShowInstructions(false);
        setShowResults(false);
        enterFullScreen();
        setQuizInProgress(true);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setScore(0);
        setCorrectAnswers(0);
        setTotalMarks(0);
        setEarnedMarks(0);
        setTimeExpired(false);
        setHasPassedQuiz(false);

        // Prepare questions based on quiz type
        if (activeQuiz) {
            if (activeQuiz.quizType === "text_based") {
                const textBasedQuestions =
                    activeQuiz.TextedBasedQuizTexts?.flatMap((text) => [
                        ...(text.FillInBlankQuestions || []).map((q) => ({
                            ...q,
                            id: `fill_${q.id}`,
                            type: "fill_in_the_blank",
                            quiz_id: activeQuiz.id,
                            question_text: text.text,
                        })),
                        ...(text.MultipleChoiceQuestions || []).map((q) => ({
                            ...q,
                            id: `multi_${q.id}`,
                            type: "multiple_choice",
                            quiz_id: activeQuiz.id,
                            question_text: text.text,
                        })),
                        ...(text.TrueFalseQuestions || []).map((q) => ({
                            ...q,
                            id: `true_false_${q.id}`,
                            type: "true_false",
                            quiz_id: activeQuiz.id,
                            question_text: text.text,
                        })),
                    ]) || [];
                setCombinedQuestions(textBasedQuestions);
            } else {

                const regularQuestions = activeQuiz.QuizQuestions || [];
                const predefinedQuestions = (
                    activeQuiz.QuizPreDefinedQuestions || []
                ).map((preDefQues) => {
                    const questionData = preDefQues.PreDefinedQuestion;
                    return {
                        id: `pre_${questionData.id}`,
                        quiz_id: activeQuiz.id,
                        question_text: questionData.question_text,
                        question_img: questionData.question_img,
                        question_type: questionData.question_type,
                        marks: questionData.marks,
                        sequence_no: questionData.sequence_no,
                        QuizOptions: questionData.PreDefinedOptions.map((option) => ({
                            id: `pre_opt_${option.id}`,
                            question_id: `pre_${questionData.id}`,
                            option_text: option.option_text,
                            option_img: option.option_img,
                            is_correct: option.is_correct,
                        })),
                    };
                });

                // Add AudioToScriptQuestions if they exist
                const audioScriptQuestions = (
                    activeQuiz.AudioToScriptQuestions || []
                ).map((audioQuestion, index) => ({
                    id: `audio_${audioQuestion.id}`,
                    quiz_id: activeQuiz.id,
                    question_text: "Listen to the audio and type the script you hear:",
                    question_type: "audio_script",
                    marks: audioQuestion.marks, // Default marks for audio questions
                    sequence_no: 1000 + index, // Place audio questions at the end
                    audioUrl: audioQuestion.url,
                    correctScript: audioQuestion.script,
                    type: "audio_script",
                }));

                // Add RealWordQuestions if they exist
                const realWordQuestions = (activeQuiz.RealWordQuestions || []).flatMap(
                    (realWordQuestion, questionIndex) =>
                        realWordQuestion.words.map((word, wordIndex) => ({
                            id: `realword_${realWordQuestion.id}_${wordIndex}`,
                            quiz_id: activeQuiz.id,
                            question_text: "Is this a correct word?",
                            question_type: "real_word",
                            marks: 1, // Default marks for real word questions
                            sequence_no: 2000 + wordIndex, // Place real word questions after audio questions
                            word: word,
                            correctAnswer: realWordQuestion.correct_answers[wordIndex],
                            type: "real_word",
                        }))
                );

                // Add DragDropQuestions if they exist
                const dragDropQuestions = (activeQuiz.DragDropQuestions || []).map(
                    (dragDropQuestion, index) => ({
                        id: `drag_drop_${dragDropQuestion.id}`,
                        quiz_id: activeQuiz.id,
                        prompt: dragDropQuestion.prompt,
                        question_type: "drag_drop",
                        marks: dragDropQuestion.marks, // Default marks for drag and drop questions
                        sequence_no: 3000 + index, // Place drag and drop questions after real word questions
                        options: dragDropQuestion.options,
                        blanks: dragDropQuestion.blanks,
                        type: "drag_drop",
                    })
                );

                // Add SummaryPassageQuestions if they exist
                const summaryPassageQuestions = (
                    activeQuiz.SummarizePassageQuestions || []
                ).map((summary, index) => ({
                    id: `summary_${summary.id}`,
                    quiz_id: activeQuiz.id,
                    question_text: summary.summary,
                    question_type: "summary_passage",
                    marks: summary.marks || 1, // Default marks or from DB
                    sequence_no: 4000 + index,
                    expectedSummary: summary.expected_summary, // Assuming you store the expected answer
                    type: "summary_passage",
                    time_limit: summary.time_limit,
                }));

                // Add BestOptionQuestions if they exist
                const bestOptionQuestions = (activeQuiz.BestOptionQuestions || []).map(
                    (question, index) => ({
                        id: `bestoption_${question.id}`,
                        quiz_id: activeQuiz.id,
                        question_type: "best_option",
                        passage: question.passage,
                        blanked_words: question.blanked_words,
                        distractor_options: question.distractor_options,
                        type: "best_option",
                        marks: question.marks || 1, // Default marks or from DB
                        sequence_no: 5000 + index,
                    })
                );


                // Add CompleteSentenceQuestions if they exist
                const completeSentenceQuestions = (activeQuiz.CompleteSentenceQuestions || []).map((q, idx) => {
                    // Extract correct words and hints from options array
                    const options = q.options || [];
                    const correct_word = options.map(opt => opt.correct_word);
                    const hint = options.map(opt => opt.hint);

                    return {
                        ...q,
                        id: `complete_sentence_${q.id}`,
                        type: "complete_sentence",
                        quiz_id: activeQuiz.id,
                        question: q.question,
                        correct_word: correct_word,
                        hint: hint,
                        marks: q.marks || 1,
                        sequence_no: 6000 + idx,
                    };
                });

                // Add ArrangeOrderQuestions if they exist
                const arrangeOrderQuestions = (activeQuiz.ArrangeOrderQuestions || []).map((q, idx) => ({
                    id: `arrangeorder_${q.id}`,
                    quiz_id: activeQuiz.id,
                    type: "arrange_order",
                    question_type: "arrange_order",
                    sentences: q.sentences || [],
                    correct_order: q.correct_order || [],
                    marks: q.marks || 1,
                    sequence_no: 7000 + idx, // Place after complete_sentence
                }));


                const allQuestions = [
                    ...regularQuestions,
                    ...predefinedQuestions,
                    ...audioScriptQuestions,
                    ...realWordQuestions,
                    ...dragDropQuestions,
                    ...summaryPassageQuestions,
                    ...bestOptionQuestions,
                    ...completeSentenceQuestions, // Add here
                    ...arrangeOrderQuestions // ✅ Add new type
                ].sort((a, b) => a.sequence_no - b.sequence_no);

                setCombinedQuestions(allQuestions);
            }
            setTimeRemaining(activeQuiz.duration_minutes * 60);
        }
    };

    // Effect for timer
    useEffect(() => {
        const currentQ = combinedQuestions[currentQuestionIndex];

        // Pause if summary_passage
        if (
            timeRemaining !== null &&
            timeRemaining > 0 &&
            activeQuiz &&
            currentQ?.question_type !== "summary_passage"
        ) {
            const timer = setTimeout(() => {
                setTimeRemaining((prevTime) => prevTime - 1);
            }, 1000);

            if (timeRemaining === 1) {
                handleSubmitQuiz();
            }

            return () => clearTimeout(timer);
        }
    }, [timeRemaining, activeQuiz, currentQuestionIndex, combinedQuestions]);

    // Effect for summary timer
    useEffect(() => {
        const currentQuestion = combinedQuestions[currentQuestionIndex];

        if (currentQuestion?.question_type === "summary_passage") {
            const limitInSeconds = (currentQuestion.time_limit || 1);
            setSummaryTimeRemaining(limitInSeconds);
            setIsSummaryTimerRunning(true);
        } else {
            setIsSummaryTimerRunning(false);
            setSummaryTimeRemaining(null);
        }
    }, [currentQuestionIndex, combinedQuestions]);

    useEffect(() => {
        if (isSummaryTimerRunning && summaryTimeRemaining > 0) {
            const timer = setTimeout(() => {
                setSummaryTimeRemaining((prev) => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }

        if (isSummaryTimerRunning && summaryTimeRemaining === 0) {
            setIsSummaryTimerRunning(false);
            handleNextQuestion();
        }
    }, [isSummaryTimerRunning, summaryTimeRemaining]);

    const handleAnswerSelect = (questionId, value, isMulti = false) => {
        setSelectedAnswers((prev) => {
            const currentQuestion = combinedQuestions.find(q => q.id === questionId);
            // Check if the current question has multiple correct options
            const correctOptions = currentQuestion?.QuizOptions?.filter(opt => opt.is_correct) || [];
            const isMultiSelect = correctOptions.length > 1;

            if (currentQuestion?.type === "summary_passage") {
                return {
                    ...prev,
                    [questionId]: {
                        userPassage: value,
                        student_summary: null,
                        grade: null,
                    },
                };
            } else if (isMultiSelect) {
                // Multi-select: Toggle value in array
                const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
                if (current.includes(value)) {
                    return { ...prev, [questionId]: current.filter((v) => v !== value) };
                } else {
                    return { ...prev, [questionId]: [...current, value] };
                }
            } else {
                // Single-select: Set single value
                return { ...prev, [questionId]: value };
            }
        });
    };


    const handleNextQuestion = async () => {
        const currentQuestion = combinedQuestions[currentQuestionIndex];

        // For summary passage questions, we would normally make an API call here
        // For this implementation, we'll just simulate it
        if (currentQuestion?.type === "summary_passage") {

            const userPassage = selectedAnswers[currentQuestion.id]?.userPassage;

            try {
                const response = await createSummarizePassageResponse({
                    data: {
                        question_id: currentQuestion.id,
                        student_id: userId,
                        response_text: userPassage,
                    },
                    access_token,
                }).unwrap();

                // Assuming API returns student_summary and grade
                const { student_summary, marks } = response;

                setSelectedAnswers((prev) => ({
                    ...prev,
                    [currentQuestion.id]: {
                        userPassage,
                        student_summary,
                        marks,
                    },
                }));
            } catch (error) {
                console.error("Error creating summarize passage response:", error);
                toast.error(error?.data?.error || "Failed to evaluate summary. Please try again.");
                return; // Do not proceed to next question
            }

        }

        // Proceed to next
        if (currentQuestionIndex < combinedQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            handleSubmitQuiz();
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleSubmitQuiz = async () => {
        const isTimeExpired = timeRemaining <= 1;
        let calculatedEarnedMarks = 0;
        let calculatedTotalMarks = 0;
        let correctAnswerCount = 0;

        combinedQuestions.forEach((question) => {
            // Get the marks for this question (default to 1 if not specified)
            const questionMarks = question.marks;
            calculatedTotalMarks += questionMarks;
            let questionIsFullyCorrect = false;

            if (question.type === "fill_in_the_blank") {
                const userAnswer = selectedAnswers[question.id]?.trim().toLowerCase();

                // Fix: Check multiple possible property names for correct answer
                let correctAnswer;
                if (question.correct_answer) {
                    correctAnswer = question.correct_answer.trim().toLowerCase();
                } else if (question.correctAnswer) {
                    correctAnswer = question.correctAnswer.trim().toLowerCase();
                } else if (question.answer) {
                    correctAnswer = question.answer.trim().toLowerCase();
                } else {
                    correctAnswer = "";
                }

                if (userAnswer === correctAnswer) {
                    calculatedEarnedMarks += questionMarks;
                    questionIsFullyCorrect = true;
                }

            } else if (question.type === "true_false") {
                const userAnswer = selectedAnswers[question.id] === "True";

                // Fix: Check multiple possible property names for correct answer
                let correctAnswer;
                if (question.correct_answer !== undefined) {
                    correctAnswer = Boolean(question.correct_answer);
                } else if (question.correctAnswer !== undefined) {
                    correctAnswer = Boolean(question.correctAnswer);
                } else if (question.is_true !== undefined) {
                    correctAnswer = Boolean(question.is_true);
                } else {
                    console.error("No correct answer found for true_false question:", question);
                    correctAnswer = false;
                }

                if (userAnswer === correctAnswer) {
                    calculatedEarnedMarks += questionMarks;
                    questionIsFullyCorrect = true;
                }

            } else if (question.type === "multiple_choice") {
                const userAnswer = selectedAnswers[question.id];
                const correctOptions = question.QuizOptions?.filter(opt => opt.is_correct).map(o => o.id) || [];
                const isMultiSelect = correctOptions.length > 1;

                let isCorrect = false;
                if (isMultiSelect) {
                    // Multi-select: Exact match (all or nothing)
                    const userArray = Array.isArray(userAnswer) ? [...userAnswer].sort() : [];
                    const correctArray = [...correctOptions].sort();
                    isCorrect = userArray.length === correctArray.length && userArray.every((val, idx) => val === correctArray[idx]);
                } else {
                    // Single-select
                    isCorrect = correctOptions.includes(userAnswer);
                }

                if (isCorrect) {
                    calculatedEarnedMarks += questionMarks;
                    questionIsFullyCorrect = true;
                }
            }
            else if (question.type === "audio_script") {
                if (
                    selectedAnswers[question.id]?.toLowerCase().trim() ===
                    question.correctScript?.toLowerCase().trim()
                ) {
                    calculatedEarnedMarks += questionMarks;
                    questionIsFullyCorrect = true;
                }
            } else if (question.type === "real_word") {
                if (selectedAnswers[question.id] === question.correctAnswer) {
                    calculatedEarnedMarks += questionMarks;
                    questionIsFullyCorrect = true;
                }
            } else if (question.type === "drag_drop") {
                const userAnswers = selectedAnswers[question.id];
                if (userAnswers) {
                    let correctBlanks = 0;
                    const totalBlanks = question.blanks.length;
                    const marksPerBlank = questionMarks / totalBlanks;

                    question.blanks.forEach((blank) => {
                        const position = blank.position;
                        const userAnswer = userAnswers[position];

                        if (userAnswer && userAnswer === blank.correct) {
                            correctBlanks++;
                            calculatedEarnedMarks += marksPerBlank;
                        }
                    });

                    if (correctBlanks === totalBlanks) {
                        questionIsFullyCorrect = true;
                    }
                }
            } else if (question.type === "best_option") {
                let allBlanksCorrect = true;

                // Parse blanked_words if it's a string
                let blankedWords = question.blanked_words;
                if (typeof blankedWords === 'string') {
                    try {
                        blankedWords = JSON.parse(blankedWords);
                    } catch (error) {
                        console.error('Error parsing blanked_words JSON:', error);
                        blankedWords = [];
                    }
                }

                blankedWords?.forEach((blankedWord, index) => {
                    const userAnswer =
                        selectedAnswers[
                            question.id + "_" + index
                        ]?.toLowerCase();
                    if (userAnswer !== blankedWord.word.toLowerCase()) {
                        allBlanksCorrect = false;
                    }
                });

                if (allBlanksCorrect) {
                    calculatedEarnedMarks += questionMarks;
                    questionIsFullyCorrect = true;
                }
            } else if (question.type === "complete_sentence") {
                // Handle multiple blanks in complete sentence questions
                const parts = question.question.split("_____");
                const numBlanks = parts.length - 1;

                // Get correct words and hints, ensuring they're arrays
                const correctWords = Array.isArray(question.correct_word)
                    ? question.correct_word
                    : Array(numBlanks).fill(question.correct_word || "");

                const hints = Array.isArray(question.hint)
                    ? question.hint
                    : Array(numBlanks).fill(question.hint || "");

                // Ensure we have enough correct words and hints for all blanks
                while (correctWords.length < numBlanks) {
                    correctWords.push("");
                }

                while (hints.length < numBlanks) {
                    hints.push("");
                }

                // All-or-nothing requirement: any wrong blank -> zero marks
                let allBlanksCorrect = true;

                // Check each blank separately
                for (let blankIndex = 0; blankIndex < numBlanks; blankIndex++) {
                    const correctWord = correctWords[blankIndex] || "";
                    const hint = hints[blankIndex] || "";
                    let userWord = "";

                    // Build the user's answer for this blank
                    for (let letterIndex = 0; letterIndex < correctWord.length; letterIndex++) {
                        if (letterIndex < hint.length) {
                            userWord += hint[letterIndex];
                        } else {
                            const key = `${question.id}_${blankIndex}_${letterIndex}`;
                            userWord += (selectedAnswers[key] || "").trim();
                        }
                    }

                    // Compare this blank's answer
                    const trimmedUserWord = userWord.trim().toLowerCase();
                    const trimmedCorrectWord = correctWord.trim().toLowerCase();

                    if (trimmedUserWord !== trimmedCorrectWord) {
                        allBlanksCorrect = false;
                    }
                }
                if (allBlanksCorrect) {
                    calculatedEarnedMarks += question.marks;
                    // Only count as a correct answer if every blank is correct
                    if (numBlanks > 0) {
                        questionIsFullyCorrect = true;
                    }
                }
            } else if (question.type === "summary_passage") {
                const answerData = selectedAnswers[question.id];

                if (answerData) {
                    calculatedEarnedMarks += answerData.marks;
                    questionIsFullyCorrect = answerData.marks >= (question.marks * 0.5); // or any threshold logic
                }
            } else {
                // For regular quiz questions and predefined questions
                const correctOptions = question.QuizOptions?.filter((option) => option.is_correct).map(o => o.id) || [];
                const userSelected = selectedAnswers[question.id];
                let isQuestionCorrect = false;
                if (correctOptions.length > 1) {
                    // Multi-select: Exact match (all or nothing)
                    const userArray = Array.isArray(userSelected) ? [...userSelected].sort() : [];
                    const correctArray = [...correctOptions].sort();
                    isQuestionCorrect = userArray.length === correctArray.length && userArray.every((val, idx) => val === correctArray[idx]);
                } else {
                    // Single-select
                    isQuestionCorrect = correctOptions.includes(userSelected);
                }
                if (isQuestionCorrect) {
                    calculatedEarnedMarks += questionMarks;
                    questionIsFullyCorrect = true;
                }
            }

            // If the entire question is correct, increment our counter
            if (questionIsFullyCorrect) {
                correctAnswerCount++;
            }
        });

        // Calculate percentage score
        const finalScore = calculatedTotalMarks > 0 ? (calculatedEarnedMarks / calculatedTotalMarks) * 100 : 0;

        if (isTimeExpired) {
            setTimeExpired(true);
        }

        setQuizStarted(false);
        setScore(finalScore);
        setCorrectAnswers(correctAnswerCount);
        setTotalMarks(calculatedTotalMarks);
        setEarnedMarks(calculatedEarnedMarks);
        setShowResults(true);
        setQuizInProgress(false);
        storeQuizData(finalScore, correctAnswerCount, calculatedEarnedMarks, calculatedTotalMarks);

        if (refetchQuizCompletion) {
            await refetchQuizCompletion()
        }

        // Set the pass status
        setHasPassedQuiz(finalScore >= (activeQuiz.passing_score || 70));

        // Exit fullscreen mode
        exitFullScreen();
    };

    const storeQuizData = (finalScore, correctAnswerCount, emarks, tmarks) => {

        const storeQuizCompletion = async () => {
            try {
                // Determine new attempt number robustly from latest history
                const previousAttempts = quizCompletionHistory;
                const prevAttemptCount = previousAttempts.length;
                // Use highest triedAttempts recorded (fallback to count)
                const prevMaxTried = previousAttempts.reduce((m, c) => Math.max(m, c.triedAttempts || 0), 0);
                const newAttemptNumber = (prevMaxTried || prevAttemptCount) + 1;

                const formData = {
                    userId: userId,
                    quizId: activeQuiz.id,
                    score: finalScore,
                    isCompleted: true,
                    status: finalScore >= activeQuiz.passing_score ? "Passed" : "Failed",
                    triedAttempts: newAttemptNumber,
                    lastAttemptTime: Date.now(),
                    count: correctAnswerCount,
                    total_question: combinedQuestions.length,
                    created_by: userId,
                    updated_by: userId,
                    module_id: activeQuiz.module_id,
                    totalMarks: tmarks,
                    obtainedMarks: emarks,
                    topic_id: (() => {
                        //check if activeQuiz is a topic quiz
                        if (topicContentDataByModule?.data?.[0]?.data) {
                            const topicContent = topicContentDataByModule?.data?.[0]?.data?.find((content) => content.quiz_id === activeQuiz.id && content.topic_id);
                            return topicContent ? topicContent.topic_id : null;
                        }
                        return null;
                    })(),
                    courseId: courseId,
                };

                const response = await createQuizCompletion({
                    completionData: formData,
                    access_token,
                }).unwrap();

                dispatch(addCompletion(response));
                return response.id;
            } catch (error) {
                console.error("Failed to store quiz completion", error);
                toast.error(error.data?.message || error?.data?.error || "Failed to store quiz completion.")
                throw error;
            }
        };

        storeQuizCompletion()
            .then(async (id) => {
                setCompletionId(id);
                setTriedAttempts(prev => prev + 1);
                setLastAttemptTime(new Date());
                if (materialType === "moduleMaterial") {
                    setAttachmentsCompleted(true);
                    await refetchModules();
                }
                if (materialType === "topicMaterial") {
                    setAttachmentsCompleted(true);
                    await refetchTopics();
                    // Also refresh basic topics to update accessibility
                    if (refetchTopics) {
                        await refetchTopics();
                    }
                }

                // Store quiz responses
                const quizAnswersData = combinedQuestions.map((question) => {
                    const answerPayload = {};
                    let isCorrect = false;

                    // Helper: Compare arrays ignoring order
                    const arraysEqual = (a, b) =>
                        a.length === b.length &&
                        a.every((val) => b.includes(val)) &&
                        b.every((val) => a.includes(val));



                    if (question.type === "summary_passage") {
                        const answerData = selectedAnswers[question.id] || {};
                        answerPayload[question.id] = {
                            userPassage: answerData.userPassage,
                            student_summary: answerData.student_summary,
                            marks: answerData.marks,
                        };
                        isCorrect = answerData.marks >= 1; // e.g., passing grade is 4 or above

                    } else if (
                        question.question_type === "mcq" ||
                        question.question_type === "true_false" ||
                        question.type === "complete_sentence"
                    ) {

                        if (question.type === "complete_sentence") {
                            // Handle multiple blanks in complete sentence questions
                            const parts = question.question.split("_____");
                            const numBlanks = parts.length - 1;

                            // Get correct words and hints as arrays
                            const correctWords = Array.isArray(question.correct_word)
                                ? question.correct_word
                                : Array(numBlanks).fill(question.correct_word || "");

                            const hints = Array.isArray(question.hint)
                                ? question.hint
                                : Array(numBlanks).fill(question.hint || "");

                            // Process each blank
                            const userWords = [];
                            let allBlanksCorrect = true;

                            for (let blankIndex = 0; blankIndex < numBlanks; blankIndex++) {
                                const correctWord = correctWords[blankIndex] || "";
                                const hint = hints[blankIndex] || "";
                                let userWord = "";

                                for (let letterIndex = 0; letterIndex < correctWord.length; letterIndex++) {
                                    if (letterIndex < hint.length) {
                                        userWord += hint[letterIndex];
                                    } else {
                                        const key = `${question.id}_${blankIndex}_${letterIndex}`;
                                        userWord += (selectedAnswers[key] || "").trim();
                                    }
                                }

                                const trimmedUserWord = userWord.trim().toLowerCase();
                                const trimmedCorrectWord = correctWord.trim().toLowerCase();

                                userWords.push(trimmedUserWord);

                                if (trimmedUserWord !== trimmedCorrectWord) {
                                    allBlanksCorrect = false;
                                }
                            }

                            isCorrect = allBlanksCorrect;

                            // Store all user words in the payload
                            answerPayload[question.id] = userWords;
                        } else if (
                            question.question_type === "complete_sentence" &&
                            Array.isArray(question.CompleteSentenceQuestions
                            )
                        ) {
                            isCorrect = true; // Assume all sentences are correct initially

                            question.CompleteSentenceQuestions
                                .forEach((sentence) => {
                                    // Fetch the user's answer for this specific sentence
                                    const userAnswerKey = `${question.id}_${sentence.id}`;
                                    const userAnswer = selectedAnswers[userAnswerKey]?.toLowerCase();
                                    const correctAnswer = sentence.correct_word.toLowerCase();

                                    // Check if the user's answer matches the correct answer
                                    if (userAnswer !== correctAnswer) {
                                        isCorrect = false; // Mark as incorrect if any sentence is wrong
                                    }

                                    // Store the user's answer in the payload
                                    answerPayload[userAnswerKey] = userAnswer || "";
                                });
                        } else {
                            // Handle MCQ / True False
                            const correctOptions = question.QuizOptions?.filter((option) => option.is_correct).map(o => o.id) || [];
                            const userSelected = selectedAnswers[question.id];
                            if (correctOptions.length > 1) {
                                // Multi-select
                                const userArray = Array.isArray(userSelected) ? [...userSelected].sort() : [];
                                const correctArray = [...correctOptions].sort();
                                isCorrect = userArray.length === correctArray.length && userArray.every((val, idx) => val === correctArray[idx]);
                                answerPayload[question.id] = userArray;  // Store as array
                            } else {
                                // Single-select
                                isCorrect = correctOptions.includes(userSelected);
                                answerPayload[question.id] = userSelected || null;
                            }
                        }
                    }
                    else if (question.type === "audio_script") {
                        const userAnswer = selectedAnswers[question.id]?.trim().toLowerCase() || "";
                        const correctAnswer = question.correctScript?.trim().toLowerCase() || "";
                        isCorrect = userAnswer === correctAnswer;
                        answerPayload[question.id] = userAnswer;

                    } else if (question.type === "real_word") {
                        const userAnswer = selectedAnswers[question.id];
                        const correctAnswer = question.correctAnswer;
                        isCorrect = userAnswer === correctAnswer;
                        answerPayload[question.id] = userAnswer;

                    } else if (question.type === "drag_drop") {
                        const userAnswers = selectedAnswers[question.id] || {};
                        let correctBlanks = 0;
                        const totalBlanks = question.blanks?.length || 0;

                        question.blanks.forEach((blank) => {
                            const position = blank.position;
                            const correctAnswer = blank.correct;
                            const userAnswer = userAnswers[position];

                            if (userAnswer === correctAnswer) {
                                correctBlanks++;
                            }
                        });

                        isCorrect = correctBlanks === totalBlanks;
                        answerPayload[question.id] = userAnswers;

                    } else if (question.type === "best_option") {
                        let allBlanksCorrect = true;

                        // Parse blanked_words if it's a string
                        let blankedWords = question.blanked_words;
                        if (typeof blankedWords === 'string') {
                            try {
                                blankedWords = JSON.parse(blankedWords);
                            } catch (error) {
                                console.error('Error parsing blanked_words JSON:', error);
                                blankedWords = [];
                            }
                        }

                        blankedWords?.forEach((blankedWord, index) => {
                            const key = `${question.id}_${index}`;
                            const userAnswer = selectedAnswers[key]?.toLowerCase();
                            if (userAnswer !== blankedWord.word.toLowerCase()) {
                                allBlanksCorrect = false;
                            }
                        });

                        isCorrect = allBlanksCorrect;
                        answerPayload[question.id] = selectedAnswers[question.id] || "";

                    } else {
                        Object.entries(selectedAnswers).forEach(([key, value]) => {
                            if (key === question.id || key.startsWith(`${question.id}_`)) {
                                answerPayload[key] = value;
                            }
                        });
                        const correctOption = question.QuizOptions?.find(
                            (option) => option.is_correct
                        );
                        isCorrect =
                            selectedAnswers[question.id] !== undefined &&
                            selectedAnswers[question.id] === correctOption?.id;
                        answerPayload[question.id] = selectedAnswers[question.id] || null;
                    }

                    return {
                        quizCompletionId: id,
                        questionId: question.id,
                        answer: JSON.stringify(answerPayload),
                        isCorrect,
                        updated_by: userId,
                        created_by: userId,
                    };
                });

                try {
                    await createQuizResponse({
                        responseData: quizAnswersData,
                        access_token,
                    }).unwrap();

                } catch (error) {
                    console.log("Error storing quiz answers:", error);
                    toast.error(error.data?.message || error?.data?.error || "Error storing quiz answers.")
                }

                if (refetchQuizCompletion) {
                    await refetchQuizCompletion(); // 👈 Refetch quiz completion data
                }
            })
            .catch((error) => {
                console.log("Error:", error);
            });
    };

    const resetQuiz = () => {
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setShowResults(false);
        setScore(0);
        setTimeRemaining(activeQuiz.duration_minutes * 60);
        setQuizInProgress(true);
        setTimeExpired(false);
        enterFullScreen();
    };

    const handleBackToQuizzes = async () => {
        // Reset quiz state
        if (refetchQuizCompletion) {
            await refetchQuizCompletion(); // Refresh status before going back
        }
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setShowResults(false);
        setScore(0);
        setShowInstructions(true);
        setQuizInProgress(false);
        setTimeRemaining(0);
        setTimeExpired(false);
        setCorrectAnswers(0);
        setHasPassedQuiz(false);
        setShowBackModal(false);

        // Exit fullscreen if currently in fullscreen mode
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }

        // Go back to the quiz list
        // handleBack();
    };

    const handleBackToQuizzesContent = () => {
        if (quizInProgress) {
            setShowBackModal(true);
            return;
        }

        handleBackToQuizzes();
    };

    const enterFullScreen = () => {
        const elem = document.documentElement;
        const requestFullScreen =
            elem.requestFullscreen ||
            elem.mozRequestFullScreen ||
            elem.webkitRequestFullscreen ||
            elem.msRequestFullscreen;

        if (requestFullScreen) {
            requestFullScreen.call(elem).catch((error) => {
                setShowModal(true);
            });
        } else {
            setShowModal(true);
        }
    };

    const exitFullScreen = () => {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    };

    const handleFullScreenChange = () => {
        if (!document.fullscreenElement && quizInProgress) {
            if (alertCount < 3) {
                setAlertCount(alertCount + 1);
                setShowModal(true);
            } else {
                // After 3 attempts, automatically submit the quiz
                handleSubmitQuiz();
                setShowModal(true); // Show the modal with the exhausted message
            }
        }
    };

    useEffect(() => {
        document.addEventListener("fullscreenchange", handleFullScreenChange);
        document.addEventListener("webkitfullscreenchange", handleFullScreenChange);
        document.addEventListener("mozfullscreenchange", handleFullScreenChange);
        document.addEventListener("MSFullscreenChange", handleFullScreenChange);

        return () => {
            document.removeEventListener("fullscreenchange", handleFullScreenChange);
            document.removeEventListener(
                "webkitfullscreenchange",
                handleFullScreenChange
            );
            document.removeEventListener(
                "mozfullscreenchange",
                handleFullScreenChange
            );
            document.removeEventListener(
                "MSFullscreenChange",
                handleFullScreenChange
            );
        };
    }, [alertCount, quizInProgress]);

    // Check if a question has been answered
    const isNextButtonDisabled = () => {
        const currentQuestion = combinedQuestions[currentQuestionIndex];
        if (!currentQuestion) return true;

        const selected = selectedAnswers[currentQuestion.id];
        const correctOptions = currentQuestion.QuizOptions?.filter(opt => opt.is_correct) || [];
        const isMultiSelect = correctOptions.length > 1;

        // Handle best_option questions
        if (currentQuestion.type === "best_option") {
            // Parse blanked_words if it's a string
            let blankedWords = currentQuestion.blanked_words;
            if (typeof blankedWords === 'string') {
                try {
                    blankedWords = JSON.parse(blankedWords);
                } catch (error) {
                    console.error('Error parsing blanked_words JSON:', error);
                    blankedWords = [];
                }
            }
            // Check if all blanks are filled
            for (let i = 0; i < blankedWords.length; i++) {
                const key = `${currentQuestion.id}_${i}`;
                if (!selectedAnswers[key]) {
                    return true; // Disable if any blank is empty
                }
            }
            return false; // Enable if all blanks are filled
        }

        if (currentQuestion.type === "summary_passage") {
            return !selected?.userPassage;
        } else if (isMultiSelect) {
            return !selected || selected.length === 0;
        } else {
            return !selected;
        }
    };


    const CircularCountdown = ({ timeInSeconds, totalSeconds }) => {
        const radius = isMobile ? 20 : 30;
        const stroke = isMobile ? 4 : 6;
        const normalizedRadius = radius - stroke * 0.5;
        const circumference = normalizedRadius * 2 * Math.PI;
        const progress =
            circumference - (timeInSeconds / totalSeconds) * circumference;

        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        const displayTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

        return (
            <div className={`relative ${isMobile ? "w-16 h-16" : "w-24 h-24"}`}>
                <svg height="100%" width="100%">
                    <circle
                        stroke="#e5e7eb"
                        fill="transparent"
                        strokeWidth={stroke}
                        r={normalizedRadius}
                        cx="50%"
                        cy="50%"
                    />
                    <circle
                        stroke="#3b82f6"
                        fill="transparent"
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={progress}
                        r={normalizedRadius}
                        cx="50%"
                        cy="50%"
                        style={{ transition: "stroke-dashoffset 1s linear" }}
                    />
                </svg>
                <div className={`absolute inset-0 flex items-center justify-center text-blue-700 font-bold ${isMobile ? "text-xs" : "text-sm"}`}>
                    {displayTime}
                </div>
            </div>
        );
    };

    // Add this component to show attempt status
    const AttemptStatus = () => {
        // Always show attempt info if user has attempted at least once or restrictions apply
        if (triedAttempts === 0 && !attemptsExhausted && !nextAttemptTime) return null;

        return (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm">
                <div className="flex items-start gap-3">
                    <FaExclamationTriangle className="text-amber-500 text-lg mt-0.5" />
                    <div className="flex-1 space-y-1">
                        <p className="text-amber-800 font-medium">
                            Attempts Used: {triedAttempts}{activeQuiz.max_attempts && activeQuiz.max_attempts !== Infinity ? ` / ${activeQuiz.max_attempts}` : ""}
                        </p>
                        {lastAttemptTime && (
                            <p className="text-amber-700">Last Attempt: {lastAttemptTime.toLocaleString()}</p>
                        )}
                        {attemptsExhausted && renewalTime && (
                            <p className="text-amber-700 font-medium">Attempts exhausted. Renewal on {renewalTime.toLocaleString()}</p>
                        )}
                        {!attemptsExhausted && nextAttemptTime && (
                            <p className="text-amber-700">Next Attempt Available: {nextAttemptTime.toLocaleString()}</p>
                        )}
                        {!attemptsExhausted && !nextAttemptTime && triedAttempts > 0 && (
                            <p className="text-amber-700">You can attempt again now.</p>
                        )}
                    </div>
                    {/* Attempt Timing / Availability */}
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                        <p className="text-sm font-semibold text-slate-700 mb-2">Attempt Availability</p>
                        <ul className="text-xs text-slate-600 space-y-1">
                            {lastAttemptTime && (<li>Last Attempt: <span className="font-medium text-slate-800">{lastAttemptTime.toLocaleString()}</span></li>)}
                            {nextAttemptTime && !canAttempt && (<li>Next Attempt: <span className="font-medium text-slate-800">{nextAttemptTime.toLocaleString()}</span></li>)}
                            {renewalTime && attemptsExhausted && (<li>Renews On: <span className="font-medium text-slate-800">{renewalTime.toLocaleDateString()}</span></li>)}
                            <li>Status: {attemptsExhausted ? (<span className="text-rose-600 font-medium">Attempts Exhausted</span>) : canAttempt ? (<span className="text-emerald-600 font-medium">You can attempt now</span>) : (<span className="text-amber-600 font-medium">Waiting Gap</span>)}</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    };

    if (showInstructions) {
        return (
            <div className="w-full bg-white overflow-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full bg-white"
                >
                    {/* Mobile Header */}
                    {isMobile && (
                        <div className="md:hidden bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={handleBack}
                                    className="flex items-center text-slate-600 hover:text-slate-800"
                                >
                                    <FaArrowLeft className="mr-2" />
                                    Back
                                </button>
                                <h1 className="text-lg font-bold text-slate-800 truncate max-w-[200px]">
                                    {activeQuiz.title || "Quiz"}
                                </h1>
                                <div className="w-6"></div> {/* Spacer for balance */}
                            </div>
                        </div>
                    )}

                    {/* Main Content - Flexible Height */}
                    <div className={`${isMobile ? "flex-col" : "flex"} min-h-[calc(77vh)]`}>
                        {/* Content Area - Scrollable */}
                        <div className={`${isMobile ? "p-4" : "flex-1 pt-8 pl-8 pr-8 pb-8"}`}>
                            <AttemptStatus />

                            {/* Responsive Grid Layout */}
                            <div className={`${isMobile ? "space-y-6" : "grid grid-cols-2 gap-8"}`}>
                                {/* Left Column */}
                                <div className="space-y-6">
                                    {/* Quiz Overview */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                                            Quiz Overview
                                        </h3>
                                        <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-2"} gap-4`}>
                                            <div className="bg-white p-3 rounded-lg border border-blue-200">
                                                <div className="text-2xl font-bold text-slate-800">{totalQuestionCount}</div>
                                                <div className="text-sm text-slate-600">Questions</div>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg border border-blue-200">
                                                <div className="text-2xl font-bold text-slate-800">{activeQuiz.duration_minutes}</div>
                                                <div className="text-sm text-slate-600">Minutes</div>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg border border-blue-200">
                                                <div className="text-2xl font-bold text-slate-800">{activeQuiz.passing_score}%</div>
                                                <div className="text-sm text-slate-600">Pass Score</div>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg border border-blue-200">
                                                <div className="text-2xl font-bold text-slate-800">{activeQuiz.max_attempts}</div>
                                                <div className="text-sm text-slate-600">Max Attempts</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Attempt Progress */}
                                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                                            <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                                            Your Progress
                                        </h3>
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <div className="text-3xl font-bold text-slate-800">{triedAttempts}/{activeQuiz.max_attempts}</div>
                                                <div className="text-sm text-slate-600">Attempts Used</div>
                                            </div>
                                            <div className="flex space-x-2">
                                                {Array.from({ length: activeQuiz.max_attempts }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-4 h-4 rounded-full border-2 ${i < triedAttempts
                                                            ? 'bg-orange-500 border-orange-500'
                                                            : 'bg-white border-orange-300'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        {activeQuiz.attempts_gap > 0 && (
                                            <div className="bg-white p-3 rounded-lg border border-orange-200">
                                                <div className="flex items-center text-orange-700">
                                                    <FaExclamationTriangle className="mr-2 text-sm" />
                                                    <span className="text-sm">Wait {activeQuiz.attempts_gap}h between attempts</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6">
                                    {/* Instructions */}
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                                            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                                            Quiz Instructions
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex items-start bg-white p-3 rounded-lg border border-green-200">
                                                <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</div>
                                                <span className="text-slate-700">Select one answer per question before proceeding</span>
                                            </div>
                                            <div className="flex items-start bg-white p-3 rounded-lg border border-green-200">
                                                <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</div>
                                                <span className="text-slate-700">Navigate back to review your answers anytime</span>
                                            </div>
                                            <div className="flex items-start bg-white p-3 rounded-lg border border-green-200">
                                                <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</div>
                                                <span className="text-slate-700">Quiz auto-submits when time expires</span>
                                            </div>
                                            <div className="flex items-start bg-white p-3 rounded-lg border border-green-200">
                                                <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</div>
                                                <span className="text-slate-700">All questions must be answered to submit</span>
                                            </div>

                                            {/* Recent Attempts Snapshot - Now properly contained */}
                                            {quizCompletionHistory.length > 0 && (
                                                <div className="bg-white p-3 rounded-lg border border-green-200">
                                                    <p className="text-sm font-semibold text-neutral-700 mb-2">Recent Attempts</p>
                                                    {/* Fixed scrollable container with proper max height */}
                                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar" aria-live="polite">
                                                        {quizCompletionHistory.slice(0, 5).map((att, i) => {
                                                            const attTime = parseDateValue(att.lastAttemptTime || att.updatedAt || att.createdAt)
                                                            return (
                                                                <div
                                                                    key={att.id || i}
                                                                    className="flex items-center justify-between bg-green-50 rounded-md px-3 py-2 border border-green-100"
                                                                >
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-medium text-neutral-800 text-sm truncate">
                                                                            Attempt #{att.triedAttempts || quizCompletionHistory.length - i}
                                                                        </p>
                                                                        <p className="text-[10px] text-neutral-500 truncate">
                                                                            {attTime ? attTime.toLocaleString() : "--"}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-right flex-shrink-0 ml-2">
                                                                        <p className="font-semibold text-neutral-800 text-sm">
                                                                            {att.obtainedMarks ?? att.score ?? 0}/{att.totalMarks ?? 0}
                                                                        </p>
                                                                        <span
                                                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${att.status === "Passed"
                                                                                ? "bg-emerald-100 text-emerald-700"
                                                                                : "bg-rose-100 text-rose-700"
                                                                                }`}
                                                                        >
                                                                            {att.status || "NA"}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Sidebar - Fixed position on desktop, normal flow on mobile */}
                        <div className={`${isMobile ? "w-full p-4 border-t border-neutral-200 bg-white" : "w-80 bg-neutral-50 border-l border-neutral-200 pl-8 pr-8 sticky top-16 h-auto overflow-y-auto"}`}>
                            <div className={`${isMobile ? "py-4" : "h-full flex flex-col items-center justify-center text-center py-8"}`}>
                                <div className={`space-y-12 w-full ${isMobile ? "space-y-6" : ""}`}>
                                    <div className={`${isMobile ? "w-16 h-16" : "w-20 h-20"} bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-md`}>
                                        <FaPlayCircle className="text-white text-3xl" />
                                    </div>

                                    <div>
                                        <h2 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-neutral-900 mb-3`}>Ready to Begin?</h2>
                                        <p className="text-neutral-600 leading-relaxed">
                                            Ensure you have a stable internet connection and won't be interrupted during the quiz.
                                        </p>
                                    </div>

                                    <div className="w-full space-y-4">
                                        <button
                                            onClick={handleBeginQuiz}
                                            disabled={!canAttempt}
                                            className={`w-full ${isMobile ? "py-3 px-4 text-base" : "py-4 px-6 text-lg"} rounded-xl font-semibold transition-all duration-200 ${canAttempt
                                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                                                : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                                                }`}
                                        >
                                            <div className="flex items-center justify-center">
                                                <FaPlayCircle className="mr-3" />
                                                {!canAttempt ? "Cannot Start Quiz" : "Start Quiz"}
                                            </div>
                                        </button>
                                    </div>

                                    {!isMobile && (
                                        <>
                                            <hr className="border-neutral-200" />
                                            <div className="text-neutral-500 text-sm">Make sure you're ready before clicking start!</div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (showResults) {
        const isPassed = score >= (activeQuiz.passing_score || 70);
        const isTopicQuiz = topicContentDataByModule?.data?.[0]?.data?.some(
            (content) => content.quiz_id === activeQuiz.id
        );

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen p-4 md:p-6"
            >
                {/* Mobile Header */}
                {isMobile && (
                    <div className="md:hidden bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-4 sticky top-0 z-10">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setShowInstructions(true)}
                                className="flex items-center text-slate-600 hover:text-slate-800"
                            >
                                <FaArrowLeft className="mr-2" />
                                Back
                            </button>
                            <h1 className="text-lg font-bold text-slate-800">Quiz Results</h1>
                            <div className="w-6"></div>
                        </div>
                    </div>
                )}

                {/* Main Container */}
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-center mb-8"
                    >
                        <h1 className={`${isMobile ? "text-3xl" : "text-4xl md:text-5xl"} font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2`}>
                            Quiz Results!
                        </h1>
                        <p className={`${isMobile ? "text-base" : "text-lg"} text-slate-600`}>
                            {activeQuiz.title || "Module Quiz"}
                        </p>
                    </motion.div>

                    {/* Time Expired Alert */}
                    {timeExpired && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-center shadow-sm max-w-2xl mx-auto"
                        >
                            <FaExclamationTriangle className="text-amber-500 mr-3 text-xl flex-shrink-0" />
                            <p className="text-sm">Time expired. Your quiz was automatically submitted.</p>
                        </motion.div>
                    )}

                    {/* Topic Quiz Completion Message */}
                    {isTopicQuiz && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 max-w-2xl mx-auto"
                        >
                            <p className="text-blue-800 font-medium text-center text-sm">
                                You have already completed this quiz. Here are your results:
                            </p>
                        </motion.div>
                    )}

                    {/* Main Content Grid */}
                    <div className={`${isMobile ? "space-y-6" : "grid grid-cols-1 lg:grid-cols-3 gap-8"} mb-8`}>
                        {/* Left Column - Result Status & Score */}
                        <motion.div
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className={isMobile ? "" : "lg:col-span-1"}
                        >
                            {/* Result Status Card */}
                            <div className="bg-white rounded-2xl shadow-xl p-6 text-center mb-6 border border-slate-100">
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                                    className={`inline-flex items-center justify-center ${isMobile ? "w-16 h-16" : "w-20 h-20"} rounded-full ${isPassed
                                        ? "bg-gradient-to-br from-emerald-50 to-emerald-100 border-4 border-emerald-200"
                                        : "bg-gradient-to-br from-rose-50 to-rose-100 border-4 border-rose-200"
                                        } mb-6 shadow-lg`}
                                >
                                    {isPassed ? (
                                        <FaCheckCircle className={`${isMobile ? "text-2xl" : "text-3xl"} text-emerald-500`} />
                                    ) : (
                                        <FaTimesCircle className={`${isMobile ? "text-2xl" : "text-3xl"} text-rose-500`} />
                                    )}
                                </motion.div>

                                <motion.div
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.6, type: "spring" }}
                                    className={`font-bold ${isMobile ? "text-2xl" : "text-3xl"} mb-2 ${isPassed ? "text-emerald-600" : "text-rose-600"
                                        }`}
                                >
                                    {isPassed ? "PASSED" : "FAILED"}
                                </motion.div>

                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {isPassed
                                        ? "Congratulations! You've successfully completed this assessment."
                                        : "Don't worry! Review the material and try again when you're ready."}
                                </p>
                            </div>

                            {/* Score Progress Card */}
                            <motion.div
                                initial={{ x: -50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-slate-700 font-medium flex items-center">
                                        <FaChartBar className="mr-2 text-blue-500" /> Score
                                    </span>
                                    <span className="text-blue-700 font-bold text-xl">{earnedMarks}/{totalMarks}</span>
                                </div>

                                <div className="relative w-full bg-slate-200 rounded-full h-8 overflow-hidden shadow-inner mb-4">
                                    <motion.div
                                        initial={{ width: "0%" }}
                                        animate={{ width: `${score}%` }}
                                        transition={{ delay: 0.7, duration: 1.5, ease: "easeOut" }}
                                        className={`h-8 rounded-full ${isPassed
                                            ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                                            : "bg-gradient-to-r from-rose-400 to-rose-500"
                                            } flex items-center justify-end`}
                                    >
                                        <span className="text-white text-sm font-bold mr-3">
                                            {score?.toFixed(1)}%
                                        </span>
                                    </motion.div>
                                </div>

                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>0%</span>
                                    <span className="font-medium">Passing: {activeQuiz.passing_score || 70}%</span>
                                    <span>100%</span>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Right Column - Stats & Summary */}
                        <motion.div
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className={isMobile ? "" : "lg:col-span-2"}
                        >
                            {/* Statistics Grid */}
                            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100 mb-6">
                                <h3 className="font-semibold text-xl text-slate-800 mb-6 flex items-center">
                                    <FaTrophy className="mr-3 text-amber-500" />
                                    Performance Summary
                                </h3>

                                <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"} gap-4`}>
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 text-center"
                                    >
                                        <FaGraduationCap className={`${isMobile ? "text-2xl" : "text-3xl"} text-blue-500 mx-auto mb-3`} />
                                        <p className="text-blue-600 text-sm font-medium mb-1">Total Questions</p>
                                        <p className="font-bold text-xl text-slate-800">{combinedQuestions.length}</p>
                                    </motion.div>

                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                        className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200 text-center"
                                    >
                                        <FaCheckCircle className={`${isMobile ? "text-2xl" : "text-3xl"} text-emerald-500 mx-auto mb-3`} />
                                        <p className="text-emerald-600 text-sm font-medium mb-1">Correct Answers</p>
                                        <p className="font-bold text-xl text-slate-800">{correctAnswers}</p>
                                    </motion.div>

                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.7 }}
                                        className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 text-center"
                                    >
                                        <FaTimesCircle className={`${isMobile ? "text-2xl" : "text-3xl"} text-purple-500 mx-auto mb-3`} />
                                        <p className="text-purple-600 text-sm font-medium mb-1">Attempts Allowed</p>
                                        <p className="font-bold text-xl text-slate-800">
                                            {activeQuiz.max_attempts || "∞"}
                                        </p>
                                    </motion.div>

                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.8 }}
                                        className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200 text-center"
                                    >
                                        <FaClock className={`${isMobile ? "text-2xl" : "text-3xl"} text-amber-500 mx-auto mb-3`} />
                                        <p className="text-amber-600 text-sm font-medium mb-1">Attempts Used</p>
                                        <p className="font-bold text-xl text-slate-800">{triedAttempts}</p>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Performance Insights */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100"
                            >
                                <h3 className="font-semibold text-xl text-slate-800 mb-4">
                                    Performance Insights
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-slate-600">Accuracy Rate</span>
                                        <span className="font-semibold text-slate-800">
                                            {((correctAnswers / combinedQuestions.length) * 100).toFixed(1)}%
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-slate-600">Questions Attempted</span>
                                        <span className="font-semibold text-slate-800">
                                            {combinedQuestions.length}/{combinedQuestions.length}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-slate-600">Status</span>
                                        <span className={`font-semibold px-3 py-1 rounded-full text-sm ${isPassed
                                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                            : 'bg-rose-100 text-rose-700 border border-rose-200'
                                            }`}>
                                            {isPassed ? 'Passed' : 'Needs Improvement'}
                                        </span>
                                    </div>

                                    {/* Attempts Meta */}
                                    <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"} gap-4 pt-4`}>
                                        <div className="bg-white/60 backdrop-blur rounded-lg p-4 border border-indigo-100">
                                            <p className="text-xs uppercase tracking-wide text-slate-500 font-medium mb-2">Attempts</p>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-slate-600">Used</p>
                                                    <p className="font-semibold text-slate-800">{triedAttempts}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-600">Allowed</p>
                                                    <p className="font-semibold text-slate-800">{activeQuiz.max_attempts || '∞'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-600">Remaining</p>
                                                    <p className="font-semibold text-slate-800">{activeQuiz.max_attempts ? Math.max((activeQuiz.max_attempts - triedAttempts), 0) : '∞'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white/60 backdrop-blur rounded-lg p-4 border border-indigo-100">
                                            <p className="text-xs uppercase tracking-wide text-slate-500 font-medium mb-2">Timing</p>
                                            <ul className="text-xs space-y-1 text-slate-600">
                                                {lastAttemptTime && (
                                                    <li>Last Attempt: <span className="font-medium text-slate-800">{lastAttemptTime.toLocaleString()}</span></li>
                                                )}
                                                {nextAttemptTime && !canAttempt && (
                                                    <li>Next Attempt: <span className="font-medium text-slate-800">{nextAttemptTime.toLocaleString()}</span></li>
                                                )}
                                                {renewalTime && attemptsExhausted && (
                                                    <li>Renews: <span className="font-medium text-slate-800">{renewalTime.toLocaleDateString()}</span></li>
                                                )}
                                                {!attemptsExhausted && canAttempt && (
                                                    <li className="text-emerald-600 font-medium">You can attempt again now</li>
                                                )}
                                                {attemptsExhausted && !renewalTime && (
                                                    <li className="text-rose-600 font-medium">No attempts remaining</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Attempt History */}
                                    {quizCompletionHistory.length > 0 && (
                                        <div className="pt-6">
                                            <p className="text-xs uppercase tracking-wide text-slate-500 font-medium mb-3">Recent Attempts</p>
                                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                                {quizCompletionHistory.slice(0, 5).map((att, i) => {
                                                    const attTime = parseDateValue(att.lastAttemptTime || att.updatedAt || att.createdAt);
                                                    return (
                                                        <div key={att.id || i} className="flex items-center justify-between text-xs bg-white rounded-md px-3 py-2 border border-slate-100">
                                                            <div className="flex-1">
                                                                <p className="font-medium text-slate-700">Attempt #{att.triedAttempts || (quizCompletionHistory.length - i)}</p>
                                                                <p className="text-[10px] text-slate-500">{attTime ? attTime.toLocaleString() : '--'}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-semibold text-slate-800">{att.obtainedMarks ?? att.score ?? 0}/{att.totalMarks ?? 0}</p>
                                                                <p className={`text-[10px] font-medium ${att.status === 'Passed' ? 'text-emerald-600' : 'text-rose-600'}`}>{att.status || 'NA'}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className={`flex ${isMobile ? "flex-col space-y-3" : "flex-col sm:flex-row justify-center gap-4"} max-w-2xl mx-auto`}
                    >
                        <motion.button
                            whileHover={{
                                scale: 1.03,
                                boxShadow: "0 20px 40px -10px rgba(59, 130, 246, 0.4)",
                            }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setShowInstructions(true)}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl"
                        >
                            <FaRedo className="mr-3" />
                            Retry Quiz
                        </motion.button>

                        {!isTopicQuiz && (
                            <motion.button
                                whileHover={{
                                    scale: 1.03,
                                    boxShadow: "0 20px 40px -10px rgba(16, 185, 129, 0.4)",
                                }}
                                whileTap={{ scale: 0.97 }}
                                onClick={handleBackToQuizzes}
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl"
                            >
                                <FaArrowLeft className="mr-3" />
                                Back to Quizzes
                            </motion.button>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    // Render quiz questions
    const currentQuestion = combinedQuestions[currentQuestionIndex];
    const totalQuestions = combinedQuestions.length;
    const progressPercentage =
        ((currentQuestionIndex + 1) / totalQuestions) * 100;

    return (
        <div className="rounded-2xl transition-all duration-500 mx-auto max-w-7xl p-4 md:p-6">
            {/* Mobile Header */}
            {isMobile && (
                <div className="md:hidden bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-4 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleBackToQuizzesContent}
                            className="flex items-center text-slate-600 hover:text-slate-800"
                        >
                            <FaArrowLeft className="mr-2" />
                            Back
                        </button>
                        <h1 className="text-lg font-bold text-slate-800 truncate max-w-[200px]">
                            {activeQuiz.title || "Quiz"}
                        </h1>
                        <div className="w-6"></div>
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            <div className="mb-6 animate-fadeIn">
                <div className="flex justify-between text-sm text-slate-600 mb-2 font-medium">
                    <span className="flex items-center">
                        <FaChartBar className="mr-2 text-blue-600" /> Progress
                    </span>
                    <span className="bg-blue-100 px-4 py-1 rounded-full text-blue-800 font-semibold shadow-sm">
                        Question {currentQuestionIndex + 1} of {totalQuestions}
                    </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                        className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000 ease-in-out transform origin-left"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>

            {/* Timer */}
            <div className="mb-8 animate-fadeIn">
                <div className="flex justify-between text-sm text-slate-600 mb-2 font-medium">
                    <span className="flex items-center">
                        <FaClock className="mr-2 text-rose-500" /> Time Remaining
                    </span>
                    <span
                        className={`${timeRemaining < 60
                            ? "bg-rose-100 text-rose-800 animate-pulse"
                            : "bg-slate-100 text-slate-800"
                            } px-4 py-1 rounded-full font-mono font-semibold shadow-sm`}
                    >
                        {Math.floor(timeRemaining / 60)}:
                        {timeRemaining % 60 < 10 ? "0" : ""}
                        {timeRemaining % 60}
                    </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                        className="h-3 rounded-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-1000"
                        style={{
                            width: `${(timeRemaining / (activeQuiz.duration_minutes * 60)) * 100
                                }%`,
                        }}
                    ></div>
                </div>
            </div>

            {/* Question Content */}
            {currentQuestion && (
                <div className="mb-8 animate-slideUp">
                    <div className="bg-white p-6 rounded-xl mb-5 border border-blue-100 shadow-lg transition-all duration-300 hover:shadow-xl">
                        <div className="flex justify-end mb-2">
                            <span className="text-sm text-blue-700 font-semibold bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                Marks: {currentQuestion.marks || 1}
                            </span>
                        </div>
                        {currentQuestion.question_type !== "complete_sentence" && (
                            <p className="text-slate-800 font-medium text-lg leading-relaxed">
                                {currentQuestion.question_text}
                            </p>
                        )}

                        {currentQuestion.question_img && (
                            <div className="mt-4 transition-all duration-500 transform hover:scale-105">
                                <img
                                    src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${currentQuestion.question_img || "/placeholder.png"}` || "/placeholder.svg"}
                                    alt="Question illustration"
                                    className="rounded-lg shadow-md w-full max-w-xs mx-auto object-cover"
                                />
                            </div>
                        )}

                        {/* Answer Options */}
                        <div className="space-y-4 mt-6">
                            {currentQuestion.type === "summary_passage" ? (
                                <div className="space-y-4">
                                    <p className="text-slate-700 mb-2 font-medium">
                                        Write a summary for the given passage:
                                    </p>

                                    <div className="flex items-center justify-between mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-lg">
                                        <div className="text-amber-800 font-medium">
                                            You have <strong>{currentQuestion.time_limit}</strong>{" "}
                                            seconds(s) to write your thoughts.
                                        </div>
                                        <CircularCountdown
                                            timeInSeconds={summaryTimeRemaining}
                                            totalSeconds={(currentQuestion.time_limit || 1)}
                                        />
                                    </div>
                                    <textarea
                                        className="p-4 border border-slate-300 rounded-xl w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 outline-none shadow-sm min-h-[150px] text-slate-800"
                                        value={
                                            selectedAnswers[currentQuestion.id]?.userPassage || ""
                                        }
                                        onChange={(e) =>
                                            handleAnswerSelect(currentQuestion.id, e.target.value)
                                        }
                                        placeholder="Write your summary here..."
                                    />

                                </div>
                            ) : currentQuestion.type === "fill_in_the_blank" ? (
                                <div className="space-y-4">
                                    <p className="text-slate-800 text-lg font-semibold leading-relaxed">
                                        {currentQuestion.text}
                                    </p>
                                    <input
                                        type="text"
                                        className="w-full p-4 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-slate-800 placeholder:text-slate-400"
                                        value={selectedAnswers[currentQuestion.id] || ""}
                                        onChange={(e) =>
                                            handleAnswerSelect(currentQuestion.id, e.target.value)
                                        }
                                        placeholder="Type your answer here"
                                    />
                                </div>
                            ) : currentQuestion.type === "multiple_choice" ? (
                                <div className="space-y-4">
                                    <p className="text-slate-800 text-lg font-semibold leading-relaxed">
                                        {currentQuestion.text}
                                    </p>
                                    <div className="space-y-3">
                                        {currentQuestion.options?.map((option, index) => {
                                            const isMultiSelect = (currentQuestion.QuizOptions?.filter(opt => opt.is_correct) || []).length > 1;
                                            const isSelected = Array.isArray(selectedAnswers[currentQuestion.id])
                                                ? selectedAnswers[currentQuestion.id].includes(option)
                                                : selectedAnswers[currentQuestion.id] === option;

                                            return (
                                                <div
                                                    key={index}
                                                    className={`p-4 border rounded-xl cursor-pointer transition-all duration-300 transform hover:translate-x-1 ${isSelected
                                                        ? "border-blue-500 bg-blue-50 shadow-md"
                                                        : "border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                                                        }`}
                                                    onClick={() => handleAnswerSelect(currentQuestion.id, option, isMultiSelect)}
                                                >
                                                    <div className="flex items-center">
                                                        <div
                                                            className={`w-6 h-6 flex items-center justify-center rounded-full border mr-4 transition-all duration-300 ${isSelected
                                                                ? "border-blue-600 bg-blue-600 scale-110"
                                                                : "border-slate-300"
                                                                }`}
                                                        >
                                                            {isSelected && (
                                                                <div className="w-3 h-3 bg-white rounded-full animate-scaleIn"></div>
                                                            )}
                                                        </div>
                                                        <span
                                                            className={`${isSelected ? "text-slate-900 font-medium" : "text-slate-700"
                                                                }`}
                                                        >
                                                            {option}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : currentQuestion.type === "true_false" ? (
                                <div className="space-y-4">
                                    <p className="text-slate-800 text-lg font-semibold leading-relaxed">
                                        {currentQuestion.text}
                                    </p>
                                    <div className="space-y-3">
                                        {["True", "False"].map((option) => (
                                            <div
                                                key={option}
                                                className={`p-4 border rounded-xl cursor-pointer transition-all duration-300 transform hover:translate-x-1 ${selectedAnswers[currentQuestion.id] === option
                                                    ? "border-blue-500 bg-blue-50 shadow-md"
                                                    : "border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                                                    }`}
                                                onClick={() =>
                                                    handleAnswerSelect(currentQuestion.id, option)
                                                }
                                            >
                                                <div className="flex items-center">
                                                    <div
                                                        className={`w-6 h-6 flex items-center justify-center rounded-full border mr-4 transition-all duration-300 ${selectedAnswers[currentQuestion.id] === option
                                                            ? "border-blue-600 bg-blue-600 scale-110"
                                                            : "border-slate-300"
                                                            }`}
                                                    >
                                                        {selectedAnswers[currentQuestion.id] === option && (
                                                            <div className="w-3 h-3 bg-white rounded-full animate-scaleIn"></div>
                                                        )}
                                                    </div>
                                                    <span
                                                        className={`${selectedAnswers[currentQuestion.id] === option
                                                            ? "text-slate-900 font-medium"
                                                            : "text-slate-700"
                                                            }`}
                                                    >
                                                        {option}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : currentQuestion.type === "complete_sentence" ? (
                                <CompleteSentenceQuestion
                                    question={currentQuestion}
                                    selectedAnswers={selectedAnswers}
                                    handleCompleteSentenceInput={handleCompleteSentenceInput}
                                />
                            ) : currentQuestion.type === "audio_script" ? (
                                <div className="my-6">
                                    {/* Container for Audio Player and Text Input */}
                                    <div className={`${isMobile ? "flex-col" : "flex flex-col md:flex-row"} items-stretch gap-8`}>
                                        {/* Audio Player Column */}
                                        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 p-6 rounded-2xl shadow-lg border border-blue-100 w-full md:w-1/2">
                                            <h3 className="text-indigo-700 font-medium mb-4 text-center">
                                                Listen carefully and transcribe
                                            </h3>
                                            <div className="bg-white/70 backdrop-blur rounded-xl shadow-sm border border-indigo-100">
                                                <AudioPlayer
                                                    fileUrl={`${import.meta.env.VITE_BACKEND_MEDIA_URL
                                                        }${currentQuestion.audioUrl}`}
                                                />
                                            </div>
                                        </div>

                                        {/* Text Input Column */}
                                        <div className="w-full md:w-1/2 bg-white p-6 rounded-2xl shadow-lg border border-slate-200 flex flex-col">
                                            <label
                                                htmlFor="transcript"
                                                className="text-slate-700 font-medium mb-3"
                                            >
                                                Your Transcription
                                            </label>
                                            <div className="relative flex-grow">
                                                <textarea
                                                    id="transcript"
                                                    className="p-6 border border-slate-200 rounded-xl w-full h-[300px] focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300 outline-none shadow-sm text-slate-700 bg-white resize-none"
                                                    value={selectedAnswers[currentQuestion.id] || ""}
                                                    onChange={(e) =>
                                                        handleAnswerSelect(
                                                            currentQuestion.id,
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Type the script you hear in the audio..."
                                                />
                                                <div className="absolute bottom-4 right-4 text-xs text-slate-400">
                                                    {selectedAnswers[currentQuestion.id]?.length || 0}{" "}
                                                    characters
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center mt-3">
                                                <div className="text-sm text-slate-500 flex items-center gap-1">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="text-indigo-400"
                                                    >
                                                        <path d="M12 20h9"></path>
                                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                                    </svg>
                                                    Punctuation and capitalization matter
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        handleAnswerSelect(currentQuestion.id, "")
                                                    }
                                                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors flex items-center gap-1"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <rect
                                                            x="3"
                                                            y="3"
                                                            width="18"
                                                            height="18"
                                                            rx="2"
                                                            ry="2"
                                                        ></rect>
                                                        <line x1="8" y1="12" x2="16" y2="12"></line>
                                                    </svg>
                                                    Clear transcript
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : currentQuestion.type === "real_word" ? (
                                <div className="space-y-4">
                                    <div className="text-center mb-6">
                                        <p className="text-xl font-medium text-slate-700 mb-2">
                                            Word:
                                        </p>
                                        <h3 className="text-3xl font-bold mt-4 mb-8 text-slate-900 bg-gradient-to-r from-blue-50 to-indigo-50 inline-block px-8 py-4 rounded-xl border border-slate-200">
                                            {currentQuestion.word}
                                        </h3>
                                    </div>
                                    <div className="flex justify-center gap-6">
                                        <button
                                            onClick={() =>
                                                handleAnswerSelect(currentQuestion.id, "yes")
                                            }
                                            className={`py-3 px-8 rounded-xl transition-all duration-300 text-lg font-medium ${selectedAnswers[currentQuestion.id] === "yes"
                                                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md"
                                                : "bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200"
                                                }`}
                                        >
                                            Yes
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleAnswerSelect(currentQuestion.id, "no")
                                            }
                                            className={`py-3 px-8 rounded-xl transition-all duration-300 text-lg font-medium ${selectedAnswers[currentQuestion.id] === "no"
                                                ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md"
                                                : "bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200"
                                                }`}
                                        >
                                            No
                                        </button>
                                    </div>
                                </div>
                            ) : currentQuestion.type === "drag_drop" ? (
                                <DragDropQuestion
                                    currentQuestion={currentQuestion}
                                    handleAnswerSelect={handleAnswerSelect}
                                    selectedAnswers={selectedAnswers}
                                />
                            ) : currentQuestion.type === "best_option" ? (
                                <BestOptionQuestion
                                    question={currentQuestion}
                                    handleAnswerSelect={handleAnswerSelect}
                                    selectedAnswers={selectedAnswers}
                                />
                            ) : currentQuestion.type === "arrange_order" ? (
                                <ArrangeOrderQuestion
                                    question={currentQuestion}
                                    selectedAnswers={selectedAnswers}
                                    handleAnswerSelect={handleAnswerSelect}
                                />
                            ) : (
                                currentQuestion.QuizOptions?.map((option) => (
                                    <div
                                        key={option.id}
                                        className={`p-4 border rounded-xl cursor-pointer transition-all duration-300 transform hover:translate-x-1 ${selectedAnswers[currentQuestion.id] === option.id
                                            ? "border-blue-500 bg-blue-50 shadow-md"
                                            : "border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                                            }`}
                                        onClick={() =>
                                            handleAnswerSelect(currentQuestion.id, option.id)
                                        }
                                    >
                                        <div className="flex items-center">
                                            <div
                                                className={`w-6 h-6 flex items-center justify-center rounded-full border mr-4 transition-all duration-300 ${selectedAnswers[currentQuestion.id] === option.id
                                                    ? "border-blue-600 bg-blue-600 scale-110"
                                                    : "border-slate-300"
                                                    }`}
                                            >
                                                {selectedAnswers[currentQuestion.id] === option.id && (
                                                    <div className="w-3 h-3 bg-white rounded-full animate-scaleIn"></div>
                                                )}
                                            </div>
                                            <span
                                                className={`${selectedAnswers[currentQuestion.id] === option.id
                                                    ? "text-slate-900 font-medium"
                                                    : "text-slate-700"
                                                    }`}
                                            >
                                                {option.option_text}
                                            </span>
                                        </div>
                                        {option.option_img && typeof option.option_img === "string" && option.option_img.trim() !== "" && option.option_img !== "null" && (
                                            <div className="ml-10 mt-3 transition-all duration-500 transform hover:scale-105">
                                                <img
                                                    src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${option.option_img || "/placeholder.png"
                                                        }`}
                                                    alt="Option illustration"
                                                    className="rounded-lg shadow-md max-h-32"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className={`flex ${isMobile ? "flex-col space-y-3" : "justify-between"} mt-8`}>
                            <button
                                onClick={handlePrevQuestion}
                                disabled={currentQuestionIndex === 0}
                                className={`${isMobile ? "w-full" : "py-2.5 px-5"} rounded-xl transition-all duration-300 flex items-center justify-center ${currentQuestionIndex === 0
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 hover:-translate-x-1 shadow-sm hover:shadow"
                                    }`}
                            >
                                <FaArrowLeft className="mr-2 transition-transform group-hover:-translate-x-1" />
                                Previous
                            </button>
                            <button
                                onClick={handleNextQuestion}
                                disabled={isNextButtonDisabled()}
                                className={`${isMobile ? "w-full" : "py-2.5 px-5"} rounded-xl transition-all duration-300 flex items-center justify-center ${isNextButtonDisabled()
                                    ? "bg-blue-300 text-white cursor-not-allowed"
                                    : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white hover:translate-x-1 shadow-md hover:shadow-lg"
                                    }`}
                            >
                                {currentQuestionIndex < combinedQuestions.length - 1 ? (
                                    <>
                                        Next
                                        <FaArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
                                    </>
                                ) : (
                                    <>
                                        Submit
                                        <FaCheckCircle className="ml-2 animate-pulse" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm animate-fadeIn z-50">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl text-center animate-scaleIn max-w-md w-full mx-4">
                        <div className="text-5xl mb-6 mx-auto w-16 h-16 flex items-center justify-center rounded-full">
                            {alertCount < 3 ? (
                                <FaExclamationTriangle className="text-amber-500" />
                            ) : (
                                <FaTimesCircle className="text-rose-500" />
                            )}
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-slate-900">
                            {alertCount < 3
                                ? "Please Stay in Fullscreen"
                                : "Quiz Automatically Submitted"}
                        </h3>
                        <p className="mb-6 text-slate-600 leading-relaxed">
                            {alertCount < 3
                                ? `To complete the quiz, please keep the screen in fullscreen mode. Warning ${alertCount} of 3.`
                                : alertCount === 3
                                    ? "You have attempted to exit fullscreen mode too many times. Your quiz has been automatically submitted. Click OK to view your results."
                                    : "You have attempted to exit fullscreen mode too many times. Your quiz has been automatically submitted."}
                        </p>
                        <button
                            onClick={() => {
                                setShowModal(false);
                                if (alertCount < 3) {
                                    enterFullScreen();
                                } else if (alertCount === 3) {
                                    handleSubmitQuiz();
                                    setShowResults(true);
                                } else {
                                    // If already showing results, go back to quiz list
                                    handleBackToQuizzes();
                                }
                            }}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-3 px-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 w-full"
                        >
                            {alertCount < 3 ? "Return to Quiz" : "OK"}
                        </button>
                    </div>
                </div>
            )}

            {showBackModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm animate-fadeIn z-50">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl text-center animate-scaleIn max-w-md w-full mx-4">
                        <div className="text-5xl mb-6 mx-auto w-16 h-16 flex items-center justify-center rounded-full">
                            <FaExclamationTriangle className="text-amber-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-slate-900">
                            Exit Quiz?
                        </h3>
                        <p className="mb-6 text-slate-600 leading-relaxed">
                            Are you sure you want to exit the quiz? Your progress will be lost
                            and you&apos;ll need to start over.
                        </p>
                        <div className={`flex ${isMobile ? "flex-col space-y-3" : "gap-3"}`}>
                            <button
                                onClick={() => setShowBackModal(false)}
                                className={`${isMobile ? "w-full" : "flex-1"} bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBackToQuizzes}
                                className={`${isMobile ? "w-full" : "flex-1"} bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-3 px-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300`}
                            >
                                Exit Quiz
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Animations */}
            <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .animate-slideUp {
          animation: slideUp 0.5s ease-out forwards;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }

        .animate-pulse {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }

        /* Mobile-specific styles */
        @media (max-width: 767px) {
            .mobile-sticky-header {
                position: sticky;
                top: 0;
                z-index: 40;
                background: white;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .mobile-padding {
                padding: 1rem;
            }
            
            .mobile-text-sm {
                font-size: 0.875rem;
            }
            
            .mobile-text-lg {
                font-size: 1.125rem;
            }
            
            .mobile-flex-col {
                flex-direction: column;
            }
            
            .mobile-space-y-4 > * + * {
                margin-top: 1rem;
            }
        }
      `}</style>
        </div>
    );
}