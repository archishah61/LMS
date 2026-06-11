"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
    Loader2,
    AlertTriangle,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Clock,
    Info,
    HelpCircle,
    Maximize2,
} from "lucide-react"
import { useBlocker, useLocation, useNavigate } from "react-router-dom"
import { getStudentToken } from "../../../services/CookieService"
import toast from "react-hot-toast"
import { useGetUserPointsByIdQuery } from "../../../services/Challenge/userChallenge"
import { useCheckContestQuizMutation, useStartContestQuizMutation } from "../../../services/Contest/userActivityAPI"
import { useSaveUserContestQuizAttemptMutation } from "../../../services/Contest/userContestQuizAPI"
import PrimaryLoader from "../../../components/ui/PrimaryLoader"

const QuizResultAnimation = ({ type, onClose, message }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="text-center">
                <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${type === "success" ? "bg-green-100" : "bg-red-100"
                        }`}
                >
                    {type === "success" ? (
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                        <XCircle className="w-8 h-8 text-red-600" />
                    )}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{type === "success" ? "Success!" : "Try Again!"}</h3>
                <p className="text-gray-600 mb-4">{message}</p>
                <button onClick={onClose} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    Close
                </button>
            </div>
        </div>
    </div>
)

export default function ContestQuiz() {
    const navigate = useNavigate()
    const { contest_id, quiz_id, user_activity_id } = useLocation().state

    // Storage key to store timer and answer
    const getStorageKey = (key) => `quiz_${quiz_id}_${key}`;

    const { access_token } = getStudentToken();

    const [quizData, setQuizData] = useState(null)

    const showAnswer = Boolean(quizData?.show_answer);

    // Fullscreen related states
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [fullscreenWarnings, setFullscreenWarnings] = useState(0)
    const [showFullscreenModal, setShowFullscreenModal] = useState(false)
    const [fullscreenExitCount, setFullscreenExitCount] = useState(0)
    const [isReentering, setIsReentering] = useState(false)

    const MAX_FULLSCREEN_WARNINGS = quizData?.no_of_warning >= 0 ? quizData?.no_of_warning : 3
    const timeLimit = quizData?.time_limit_seconds || 0

    // Responsive grid classes and text sizes map
    const responsiveGrid = "grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-8"
    const mainContentCols = showAnswer ? "lg:col-span-8" : "lg:col-span-12"
    const sidebarCols = showAnswer ? "lg:col-span-4" : "lg:col-span-12"
    const cardPadding = "p-4 sm:p-5 md:p-6"
    const buttonPadding = "px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3"
    const textSizes = {
        title: "text-lg sm:text-xl md:text-2xl",
        subtitle: "text-sm sm:text-base",
        body: "text-xs sm:text-sm md:text-base",
        small: "text-xs sm:text-xs md:text-sm"
    }

    const [loading, setLoading] = useState(true)

    const [startContestQuiz] = useStartContestQuizMutation();
    const [checkContestQuiz] = useCheckContestQuizMutation();
    const [saveAttempt] = useSaveUserContestQuizAttemptMutation();

    const { refetch: refetchPoints } = useGetUserPointsByIdQuery(
        { access_token },
        {
            skip: !access_token,
        },
    )

    // Check fullscreen status
    const checkFullscreen = useCallback(() => {
        const fullscreenElement =
            document.fullscreenElement ||
            document.mozFullScreenElement ||
            document.webkitFullscreenElement ||
            document.msFullscreenElement

        return !!fullscreenElement
    }, [])

    // Fullscreen functions
    const enterFullscreen = useCallback(async () => {
        try {
            const elem = document.documentElement

            if (elem.requestFullscreen) {
                await elem.requestFullscreen()
            } else if (elem.mozRequestFullScreen) {
                await elem.mozRequestFullScreen()
            } else if (elem.webkitRequestFullscreen) {
                await elem.webkitRequestFullscreen()
            } else if (elem.msRequestFullscreen) {
                await elem.msRequestFullscreen()
            } else {
                toast.error("Your browser does not support fullscreen mode")
            }

            const checkFullscreenInterval = setInterval(() => {
                if (checkFullscreen()) {
                    setIsFullscreen(true)
                    clearInterval(checkFullscreenInterval)
                }
            }, 100)

            setTimeout(() => clearInterval(checkFullscreenInterval), 3000)

        } catch (error) {
            console.error("Error entering fullscreen:", error)
            throw error
        }
    }, [checkFullscreen])

    const exitFullscreen = useCallback(async () => {
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen()
            } else if (document.mozCancelFullScreen) {
                await document.mozCancelFullScreen()
            } else if (document.webkitExitFullscreen) {
                await document.webkitExitFullscreen()
            } else if (document.msExitFullscreen) {
                await document.msExitFullscreen()
            }
        } catch (error) {
            console.error("Error exiting fullscreen:", error)
        }
    }, [])

    useEffect(() => {
        const fetchContestData = async () => {
            if (!quiz_id) {
                setLoading(false)
                return
            }

            const { data: quizData } = await startContestQuiz({ contest_id, quiz_id, access_token })

            setQuizData(quizData.contestQuiz)
            setLoading(false)
        }

        fetchContestData()
    }, [quiz_id])

    const [submitting, setSubmitting] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [userAnswers, setUserAnswers] = useState({})
    const [quizCompleted, setQuizCompleted] = useState(false)
    const [quizResults, setQuizResults] = useState(null)
    const [timeRemaining, setTimeRemaining] = useState(null)
    const [timeSpent, setTimeSpent] = useState(0) // Track time spent when no limit
    const [timerActive, setTimerActive] = useState(true)
    const [showTimeoutModal, setShowTimeoutModal] = useState(false)
    const [modalType, setModalType] = useState(null) // 'timeout', 'tab-change', 'back-button'
    const [isStateRestored, setIsStateRestored] = useState(false);
    const submissionStarted = useRef(false)

    // Helper for scroll
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [scrollLeft, setScrollLeft] = useState(0)

    useEffect(() => {
        if (quizData?.time_limit_seconds && !isStateRestored) {
            setTimeRemaining(quizData.time_limit_seconds)
        }
    }, [quizData])

    const [showResult, setShowResult] = useState(false)
    const [resultType, setResultType] = useState("success")
    const [resultMessage, setResultMessage] = useState("")

    const triggerSuccess = (message = null) => {
        setResultType("success")
        setResultMessage(message || "Congratulations! You've successfully completed the Quiz!")
        setShowResult(true)
    }

    const triggerFailure = (message = null) => {
        setResultType("failure")
        setResultMessage(message || "Oops! You didn't pass this time.")
        setShowResult(true)
    }

    const handleCloseAnimation = () => {
        setShowResult(false)
    }

    const allQuestions = [
        ...(quizData?.mcq_questions || []).map((q) => ({ ...q, type: "mcq" })),
        ...(quizData?.fill_in_the_blanks || []).map((q) => ({ ...q, type: "fill-in-the-blank" })),
        ...(quizData?.true_false_questions || []).map((q) => ({ ...q, type: "true-false" })),
    ]

    // Save states to localStorage
    const saveQuizState = useCallback(() => {
        if (quizCompleted || submitting || !quiz_id || !isStateRestored) return;

        const quizState = {
            userAnswers,
            currentStep,
            timeRemaining,
            timestamp: Date.now(),
            quiz_id, // Also save the ID for verification
        };

        localStorage.setItem(getStorageKey('state'), JSON.stringify(quizState));
    }, [userAnswers, currentStep, timeRemaining, quizCompleted, submitting, quiz_id]);

    // Auto-save when state changes
    useEffect(() => {
        if (!loading && !quizCompleted) {
            saveQuizState();
        }
    }, [userAnswers, currentStep, timeRemaining, loading, quizCompleted, saveQuizState]);

    // Add this useEffect for changing state Restored
    useEffect(() => {
        setIsStateRestored(false);
    }, [quiz_id]);

    const clearQuizState = useCallback(() => {
        if (quiz_id) {
            localStorage.removeItem(getStorageKey('state'));
        }
    }, [quiz_id]);

    const handleSubmit = useCallback(
        async (isTimeout = false, reason = 'manual') => {
            if (submissionStarted.current || submitting || quizCompleted) {
                return
            }
            submissionStarted.current = true
            setSubmitting(true)
            setTimerActive(false)

            // Exit fullscreen when submitting
            await exitFullscreen()

            try {
                const formattedAnswers = Object.values(userAnswers)

                if (isTimeout) {
                    if (reason === 'timeout') {
                        setModalType('timeout')
                    } else if (reason === 'tab-change') {
                        setModalType('tab-change')
                    } else if (reason === 'left-early') {
                        setModalType('left-early')
                    } else if (reason === 'fullscreen-exit-exceeded') {
                        setModalType('fullscreen-exceeded')
                    }
                    setShowTimeoutModal(true)
                    await new Promise((resolve) => setTimeout(resolve, 2000))
                    setShowTimeoutModal(false)
                } else if (timeRemaining > 0 && allQuestions.length !== formattedAnswers.length) {
                    toast.error("All Questions Should Be Answered")
                    submissionStarted.current = false
                    setSubmitting(false)
                    setTimerActive(true)
                    // Re-enter fullscreen if not all questions answered
                    await enterFullscreen()
                    return
                }

                const checkResponse = await checkContestQuiz({
                    contest_quiz_id: quizData.quiz_id,
                    user_contest_activity_id: user_activity_id,
                    access_token,
                    answers: formattedAnswers || []
                }).unwrap();

                const transformedResult = {
                    message: checkResponse.result.message,
                    totalQuestions: checkResponse.result.total_count,
                    totalCorrect: checkResponse.result.results.filter((r) => r.isCorrect).length,
                    totalRewardPoints: checkResponse.result.totalRewardPoints,
                    timeUsed: quizData.time_limit_seconds > 0 ? quizData.time_limit_seconds - timeRemaining : timeSpent,
                    details: checkResponse.result.results.map((r) => {
                        const question = allQuestions.find((q) => q.id === r.question_id)
                        return {
                            question_id: r.question_id,
                            question_type: question.type,
                            question_text_stored: question?.question_text || question?.question || question?.text,
                            isCorrect: r.isCorrect,
                            userAnswer: r.userAnswer ?? null,
                            correctAnswer: r.correctAnswer ?? null
                        }
                    }),
                }

                const isPassed = Boolean(checkResponse?.result.isQualified)

                if (isPassed) {
                    refetchPoints();
                }

                setQuizResults(transformedResult)
                setQuizCompleted(true)

                const attemptData = await saveAttempt({
                    contest_id: contest_id || null,
                    quiz_id: Number.parseInt(quiz_id),
                    score: transformedResult.totalCorrect,
                    percentage: (transformedResult.totalCorrect * 100 / transformedResult.totalQuestions),
                    time_taken_seconds: Math.round(transformedResult.timeUsed),
                    status: isPassed ? "completed" : "failed",
                    meta: transformedResult.details,
                    access_token,
                }).unwrap();

                if (attemptData.success) {
                    toast.success("Contest Quiz attempt recorded successfully!")
                }
                // Clear localStorage after successful submission
                clearQuizState();
            } catch (error) {
                const errorMessage = error?.data?.error ||
                    error?.data?.message ||
                    error?.error ||
                    error?.message ||
                    'Failed to delete role';
                toast.error(errorMessage);
                submissionStarted.current = false
                if (!isTimeout) {
                    setTimerActive(true)
                    // Re-enter fullscreen on error
                    await enterFullscreen()
                }
            } finally {
                setSubmitting(false)
            }
        },
        [
            userAnswers,
            timeRemaining,
            allQuestions.length,
            quiz_id,
            quizData?.time_limit_seconds,
            submitting,
            quizCompleted,
            clearQuizState,
            enterFullscreen,
            exitFullscreen,
        ],
    )

    // Handle fullscreen change
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = checkFullscreen()
            setIsFullscreen(isCurrentlyFullscreen)

            if (!isCurrentlyFullscreen && !quizCompleted && !submitting && !submissionStarted.current) {
                // Only track fullscreen exits if warnings are enabled
                if (Boolean(quizData?.is_warning) && !isReentering) {
                    setFullscreenExitCount((prev) => {
                        const newCount = prev + 1

                        if (newCount > MAX_FULLSCREEN_WARNINGS) {
                            handleSubmit(true, 'fullscreen-exit-exceeded')
                        } else {
                            setShowFullscreenModal(true)
                        }
                        return newCount
                    })
                }
            }
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)
        document.addEventListener('mozfullscreenchange', handleFullscreenChange)
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
        document.addEventListener('msfullscreenchange', handleFullscreenChange)

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange)
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
            document.removeEventListener('msfullscreenchange', handleFullscreenChange)
        }
    }, [checkFullscreen, quizCompleted, submitting, handleSubmit, isReentering])
    // Auto enter fullscreen on component mount
    useEffect(() => {
        if (!quizCompleted) {
            enterFullscreen()
        }
        return () => {
            if (!quizCompleted) {
                exitFullscreen()
            }
        }
    }, [enterFullscreen, exitFullscreen, quizCompleted])

    const handleReenterFullscreen = useCallback(async () => {
        try {
            // ✅ FULLSCREEN REQUEST MUST BE THE VERY FIRST THING (browser security rule)
            await enterFullscreen()
        } catch (error) {
            console.error("Error re-entering fullscreen:", error)
            toast.error("Failed to enter fullscreen mode. Please try again.")
            throw error // keep modal open on failure
        }
    }, [enterFullscreen])

    // Timer effect
    useEffect(() => {
        let timer
        if (timerActive && !quizCompleted && !submissionStarted.current) {
            timer = setInterval(() => {
                if (timeLimit > 0) {
                    setTimeRemaining((prev) => {
                        if (prev <= 1) {
                            handleSubmit(true, 'timeout')
                            return 0
                        }
                        return prev - 1
                    })
                } else {
                    // Count up mode (track time spent)
                    setTimeSpent((prev) => prev + 1)
                }
            }, 1000)
        }
        return () => {
            if (timer) {
                clearInterval(timer)
            }
        }
    }, [timerActive, timeRemaining, quizCompleted, timeLimit, handleSubmit])

    // only once on mount
    useEffect(() => {
        const initializeQuiz = () => {
            setLoading(true);

            // Load saved state
            const savedState = localStorage.getItem(getStorageKey('state'));
            if (savedState) {
                try {
                    const parsedState = JSON.parse(savedState);
                    const isStateValid = Date.now() - parsedState.timestamp < 24 * 60 * 60 * 1000;

                    if (isStateValid && quiz_id) {
                        setUserAnswers(parsedState.userAnswers || {});
                        setCurrentStep(parsedState.currentStep || 0);
                        setTimeRemaining(parsedState.timeRemaining || quizData?.time_limit_seconds);
                    }
                } catch (error) {
                    console.error('Error loading saved state:', error);
                    localStorage.removeItem(getStorageKey('state'));
                }
            } else {
                // No saved state, start fresh
                setTimeRemaining(quizData?.time_limit_seconds);
            }

            setLoading(false);
        };

        // Wait a bit to ensure quiz_id is available
        if (quiz_id && !isStateRestored) {
            initializeQuiz();
        } else {
            // If quiz_id isn't available yet, try again
            const timer = setTimeout(() => {
                if (quiz_id) {
                    initializeQuiz();
                } else {
                    setLoading(false);
                }
            }, 100);
            return () => clearTimeout(timer);
        }
        setIsStateRestored(true);
    }, [quiz_id, quizData?.time_limit_seconds, isStateRestored]);

    // Handle beforeunload to save state
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (!quizCompleted && !submitting) {
                saveQuizState();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // Save state when component unmounts (but not when quiz is completed)
            if (!quizCompleted && !submitting) {
                saveQuizState();
            }
        };
    }, [quizCompleted, submitting, saveQuizState]);

    // Auto submit on tab / window switch (visibility change)
    useEffect(() => {
        if (quizCompleted) return;
        const handleVisibilityChange = () => {
            if (Boolean(quizData?.is_warning) && document.hidden && !submissionStarted.current && !quizCompleted) {
                setFullscreenExitCount(prev => prev + 1)

                if (fullscreenExitCount + 1 > MAX_FULLSCREEN_WARNINGS) {
                    handleSubmit(true, 'tab-change')
                } else {
                    setShowFullscreenModal(true)
                }
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [handleSubmit, quizCompleted]);

    // Use React Router's blocker API
    const blocker = useBlocker(({ currentLocation, nextLocation }) => {
        // Only block if quiz is not completed and not already submitting
        return !quizCompleted && !submissionStarted.current && currentLocation.pathname !== nextLocation.pathname;
    });

    useEffect(() => {
        if (blocker.state === "blocked") {
            setModalType('back-button');
            setShowTimeoutModal(true);
        }
    }, [blocker.state]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
    }

    const getTimerColor = () => {
        if (timeRemaining < 60) return "text-red-600"
        if (timeRemaining < 180) return "text-orange-500"
        return "text-indigo-600"
    }

    const handleAnswerChange = (questionId, answer, questionType) => {
        setUserAnswers({
            ...userAnswers,
            [questionId + "-" + questionType]: {
                userAnswer: answer,
                question_type: questionType,
                question_id: questionId,
            },
        })
    }

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleNext = () => {
        if (currentStep < allQuestions.length - 1) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handleJumpToQuestion = (index) => {
        setCurrentStep(index)
    }

    const handleFinish = () => {
        exitFullscreen()
        navigate(-1)
    }

    const isQuestionAnswered = (index) => {
        const question = allQuestions[index]
        if (!question) return false
        return !!userAnswers[question.id + "-" + question.type]
    }

    const handleManualSubmit = () => {
        setModalType('manual-submit')
        setShowTimeoutModal(true)
    }

    const FullscreenWarningModal = () => {
        const warningsLeft = MAX_FULLSCREEN_WARNINGS - fullscreenExitCount

        const handleReenterClick = async () => {
            if (isReentering) return

            setIsReentering(true)

            try {
                await handleReenterFullscreen()   // ← fullscreen request happens here
                setShowFullscreenModal(false)     // close modal ONLY after success
            } catch (error) {
                // Modal stays open so user can try again
            } finally {
                setIsReentering(false)
            }
        }

        return (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md transform transition-all duration-300 scale-100">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Maximize2 className="w-8 h-8 text-amber-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Fullscreen Mode Required</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            You have exited fullscreen mode. This is warning {fullscreenExitCount} of {MAX_FULLSCREEN_WARNINGS}.
                            {warningsLeft > 0 ? (
                                <span className="block mt-2 font-semibold text-amber-600">
                                    {warningsLeft} {warningsLeft === 1 ? 'warning' : 'warnings'} remaining before auto-submission.
                                </span>
                            ) : (
                                <span className="block mt-2 font-semibold text-red-600">
                                    This is your final warning! Next exit will auto-submit your quiz.
                                </span>
                            )}
                        </p>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleReenterClick}
                                disabled={isReentering}
                                className={`w-full py-3 px-4 bg-forestGreen text-white font-bold rounded-lg transition-colors text-sm 
                ${isReentering
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-forestGreen/90 hover:scale-[1.02] active:scale-[0.98]'
                                    }`}
                            >
                                {isReentering ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Entering...
                                    </span>
                                ) : (
                                    'Re-enter Fullscreen Mode'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Generic Modal Component
    const QuizWarningModal = () => {
        const getModalConfig = () => {
            switch (modalType) {
                case 'manual-submit':
                    return {
                        icon: <HelpCircle className="w-8 h-8 text-primary" />,
                        title: "Submit Quiz?",
                        message: "Are you sure you want to submit your quiz? You won't be able to change your answers.",
                        bgColor: "bg-primary/10",
                        textColor: "text-primary",
                        buttonText: "Submitting...",
                        showSpinner: false,
                        showActions: true,
                        confirmText: "Yes, Submit",
                        cancelText: "Cancel"
                    }
                case 'timeout':
                    return {
                        icon: <Clock className="w-8 h-8 text-orange-600" />,
                        title: "Time's Up!",
                        message: "The time limit has been reached. Your answers are being submitted automatically.",
                        bgColor: "bg-orange-100",
                        textColor: "text-orange-600",
                        buttonText: "Submitting your answers...",
                        showSpinner: true
                    }
                case 'tab-change':
                    return {
                        icon: <AlertTriangle className="w-8 h-8 text-red-600" />,
                        title: "Tab Change Detected!",
                        message: "You have switched tabs/windows. As per exam rules, your quiz is being submitted automatically.",
                        bgColor: "bg-red-100",
                        textColor: "text-red-600",
                        buttonText: "Submitting your answers...",
                        showSpinner: true
                    }
                case 'back-button':
                    return {
                        icon: <AlertTriangle className="w-8 h-8 text-amber-600" />,
                        title: "Don't Leave!",
                        message: "Are you sure you want to leave? Your progress will be submitted and you won't be able to return to this quiz.",
                        bgColor: "bg-amber-100",
                        textColor: "text-amber-600",
                        buttonText: "Stay on Page",
                        showSpinner: false,
                        showActions: true
                    }
                case 'left-early':
                    return {
                        icon: <AlertTriangle className="w-8 h-8 text-amber-600" />,
                        title: "Submitting Quiz",
                        message: "Your progress is being submitted since you chose to leave.",
                        bgColor: "bg-amber-100",
                        textColor: "text-amber-600",
                        buttonText: "Submitting...",
                        showSpinner: true,
                    }
                case 'fullscreen-exceeded':
                    return {
                        icon: <Maximize2 className="w-8 h-8 text-red-600" />,
                        title: "Fullscreen Mode Violation",
                        message: "You have exceeded the maximum number of fullscreen exits. Your quiz is being submitted automatically.",
                        bgColor: "bg-red-100",
                        textColor: "text-red-600",
                        buttonText: "Submitting your answers...",
                        showSpinner: true,
                    }
                default:
                    return {
                        icon: <AlertTriangle className="w-8 h-8 text-gray-600" />,
                        title: "Warning",
                        message: "An issue has been detected.",
                        bgColor: "bg-gray-100",
                        textColor: "text-gray-600",
                        buttonText: "Continue",
                        showSpinner: false
                    }
            }
        }

        const config = getModalConfig()


        // Update your handleLeavePage function:
        const handleLeavePage = () => {
            setShowTimeoutModal(false);
            setModalType(null);

            // If using React Router blocker, reset it
            if (blocker.state === "blocked") {
                blocker.reset?.();
            }

            handleSubmit(true, 'left-early');
        }

        // Update your handleStayOnPage function:
        const handleStayOnPage = () => {
            setShowTimeoutModal(false);
            setModalType(null);

            // If using React Router blocker, reset it
            if (blocker.state === "blocked") {
                blocker.reset?.();
            }
        }

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md transform transition-all duration-300 scale-100">
                    <div className="text-center">
                        <div className={`w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                            {config.icon}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{config.title}</h3>
                        <p className="text-gray-600 mb-4">{config.message}</p>

                        {config.showSpinner ? (
                            <div className="flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin mr-2" style={{ color: config.textColor }} />
                                <span className={`${config.textColor} font-medium`}>{config.buttonText}</span>
                            </div>
                        ) : config.showActions ? (
                            <div className="flex gap-3 justify-center mt-4">
                                <button
                                    onClick={handleStayOnPage}
                                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    {config.cancelText || "Stay on Page"}
                                </button>
                                <button
                                    onClick={config.title === "Submit Quiz?" ? () => handleSubmit(false) : handleLeavePage}
                                    className={`px-4 py-2 text-white rounded-lg transition-colors ${config.title === "Submit Quiz?" ? "bg-primary" : "bg-red-600"}`}
                                >
                                    {config.confirmText || "Leave Anyway"}
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        )
    }

    const getQuestionBadgeColor = (type) => {
        switch (type) {
            case "mcq":
                return "bg-purple-100 text-purple-800"
            case "true-false":
                return "bg-indigo-100 text-indigo-800"
            case "fill-in-the-blank":
                return "bg-pink-100 text-pink-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const getQuestionTypeName = (type) => {
        switch (type) {
            case "mcq":
                return "Multiple Choice"
            case "true-false":
                return "True/False"
            case "fill-in-the-blank":
                return "Fill In The Blank"
            default:
                return type
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <PrimaryLoader />
            </div>
        )
    }

    if (!quizData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <AlertTriangle className="w-8 h-8 text-red-600 mr-2" />
                <span>No contest quiz data found</span>
            </div>
        )
    }

    if (quizCompleted) {
        return (
            <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
                <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6">
                    <div className={responsiveGrid}>
                        {/* Left Side: Summary & Stats */}
                        <div className={`${!showAnswer ? 'max-w-6xl mx-auto w-full' : ''} ${sidebarCols} space-y-5 md:space-y-6 lg:top-4`}>
                            {/* Header - Centered when no answers */}
                            <div className={`${!showAnswer ? 'text-center' : 'text-left'} space-y-1 sm:space-y-2`}>
                                <h2 className={`${!showAnswer ? 'text-2xl md:text-3xl' : textSizes.title} font-bold text-slate-800 line-clamp-2 leading-tight`}>
                                    {quizData.quiz_title}
                                </h2>
                                <p className={`${!showAnswer ? 'text-base' : textSizes.small + ' sm:' + textSizes.body} text-slate-500 font-medium`}>
                                    Congratulations! You've completed this quiz!
                                </p>
                            </div>

                            {/* Feedback Message - Centered when no answers */}
                            <div className={`${!showAnswer ? 'flex justify-center' : ''}`}>
                                {quizResults.totalCorrect === quizResults.totalQuestions ? (
                                    <div className={`inline-flex items-center justify-center bg-primary/10 text-forestGreen/85 px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl border border-primary/20 font-bold ${!showAnswer ? 'text-sm sm:text-base w-auto' : 'text-xs sm:text-sm w-full'}`}>
                                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                        Perfect score! Excellent work!
                                    </div>
                                ) : quizResults.totalCorrect > quizResults.totalQuestions / 2 ? (
                                    <div className={`inline-flex items-center justify-center bg-primary/10 text-forestGreen/85 px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl border border-primary/20 font-bold ${!showAnswer ? 'text-sm sm:text-base w-auto' : 'text-xs sm:text-sm w-full'}`}>
                                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                        Good job! You're on the right track.
                                    </div>
                                ) : (
                                    <div className={`inline-flex items-center justify-center bg-orange-50 text-forestGreen/85 px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl border border-orange-200 font-bold ${!showAnswer ? 'text-sm sm:text-base w-auto' : 'text-xs sm:text-sm w-full'}`}>
                                        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                        Keep practicing to improve your score.
                                    </div>
                                )}
                            </div>

                            {/* Stats Cards */}
                            {!showAnswer ? (
                                /* When answers are HIDDEN: Cards in 1 ROW (3 columns) */
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                                    {/* Score Card */}
                                    <div className="bg-white rounded-xl p-4 sm:p-5 flex items-center gap-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0">
                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                <path
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none"
                                                    stroke="#F1F5F9"
                                                    strokeWidth="3"
                                                />
                                                <path
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2.5"
                                                    strokeDasharray={`${(quizResults.totalCorrect / quizResults.totalQuestions) * 100}, 100`}
                                                    className="text-primary transition-all duration-1000 ease-out"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm font-bold text-forestGreen">
                                                {Math.round((quizResults.totalCorrect / quizResults.totalQuestions) * 100)}%
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-base sm:text-lg font-bold text-slate-800">Score</h3>
                                            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                                                {quizResults.totalCorrect}/{quizResults.totalQuestions} correct
                                            </p>
                                        </div>
                                    </div>

                                    {/* Points Card */}
                                    <div className="bg-white rounded-xl p-4 sm:p-5 flex items-center gap-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-orange-50 rounded-full flex-shrink-0">
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                                                    fill="#F59E0B"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-base sm:text-lg font-bold text-slate-800">Points</h3>
                                            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                                                {quizResults.totalRewardPoints} pts earned
                                            </p>
                                        </div>
                                    </div>

                                    {/* Time Card */}
                                    <div className="bg-white rounded-xl p-4 sm:p-5 flex items-center gap-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-indigo-50 rounded-full flex-shrink-0">
                                            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-base sm:text-lg font-bold text-slate-800">Time</h3>
                                            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                                                {Math.floor(quizResults.timeUsed / 60)}m {quizResults.timeUsed % 60}s
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* When answers are SHOWING: Cards in 1 COLUMN (3 rows) - STACKED VERTICALLY */
                                <div className="space-y-3 sm:space-y-4">
                                    {/* Score Card */}
                                    <div className="w-full bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border border-gray-100 shadow-sm">
                                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0">
                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                <path
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none"
                                                    stroke="#F1F5F9"
                                                    strokeWidth="3"
                                                />
                                                <path
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeDasharray={`${(quizResults.totalCorrect / quizResults.totalQuestions) * 100}, 100`}
                                                    className="text-primary transition-all duration-1000 ease-out"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm font-bold text-forestGreen">
                                                {Math.round((quizResults.totalCorrect / quizResults.totalQuestions) * 100)}%
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-base sm:text-lg font-bold text-slate-800">Score Achieved</h3>
                                            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                                                {quizResults.totalCorrect}/{quizResults.totalQuestions} correct answers
                                            </p>
                                        </div>
                                    </div>

                                    {/* Points Card */}
                                    <div className="w-full bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border border-gray-100 shadow-sm">
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-orange-50 rounded-full flex-shrink-0">
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                                                    fill="#F59E0B"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-base sm:text-lg font-bold text-slate-800">Points Earned</h3>
                                            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                                                You earned {quizResults.totalRewardPoints} pts
                                            </p>
                                        </div>
                                    </div>

                                    {/* Time Card */}
                                    <div className="w-full bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border border-gray-100 shadow-sm">
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-indigo-50 rounded-full flex-shrink-0">
                                            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-base sm:text-lg font-bold text-slate-800">Time Taken</h3>
                                            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                                                Completed in {Math.floor(quizResults.timeUsed / 60)}m {quizResults.timeUsed % 60}s
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action Button - Centered when no answers */}
                            {showAnswer ?
                                (
                                    <button
                                        onClick={handleFinish}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3.5 bg-forestGreen text-white rounded-lg sm:rounded-xl font-bold transition-all shadow-sm active:scale-95 text-xs sm:text-sm"
                                    >
                                        <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                                        Back to Challenges
                                    </button>
                                ) : (
                                    <div className="flex justify-center pt-3">
                                        <button
                                            onClick={handleFinish}
                                            className="w-full md:w-1/2 lg:w-1/3 flex items-center justify-center gap-2 
                                                    px-5 py-3 sm:px-6 sm:py-3.5 
                                                    bg-forestGreen text-white 
                                                    rounded-lg sm:rounded-xl 
                                                    font-bold text-sm sm:text-base 
                                                    transition-all shadow-sm hover:shadow-md 
                                                    active:scale-95 hover:bg-forestGreen/90"
                                        >
                                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                                            Back to Challenges
                                        </button>
                                    </div>
                                )}
                        </div>

                        {/* Right Side: Question Review */}
                        {showAnswer &&
                            <div className={`${mainContentCols} mt-6 lg:mt-0`}>
                                <div className="flex items-center justify-between mb-4 sm:mb-6">
                                    <h3 className={`${textSizes.body} sm:text-lg font-bold text-slate-800 flex items-center gap-2`}>
                                        Question Review
                                        <span className="text-[10px] sm:text-xs font-medium px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full bg-gray-100 text-gray-500">
                                            {quizResults.totalQuestions} Questions
                                        </span>
                                    </h3>
                                </div>

                                <div className="space-y-3 sm:space-y-4 max-h-[60vh] sm:max-h-[70vh] md:max-h-[75vh] overflow-y-auto pr-1 sm:pr-2 scrollbar-hide">
                                    {quizResults.details && quizResults.details.length > 0 ? (
                                        quizResults.details.map((detail, index) => {
                                            const isCorrect = detail.isCorrect;

                                            return (
                                                <div key={index} className="border-b border-gray-100 last:border-0">
                                                    <div className="p-3 sm:p-4 md:p-5">
                                                        <div className="flex items-start justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                                                            <div className="flex items-start gap-2 sm:gap-3">
                                                                <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] sm:text-xs font-bold mt-0.5 ${isCorrect
                                                                    ? "bg-green-100 text-green-700"
                                                                    : "bg-red-100 text-red-700"
                                                                    }`}>
                                                                    {index + 1}
                                                                </span>
                                                                <p className={`${textSizes.small} sm:${textSizes.body} text-slate-800 font-medium leading-relaxed`}>
                                                                    {detail.question_text_stored}
                                                                </p>
                                                            </div>
                                                            <span className={`flex-shrink-0 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold border ${isCorrect
                                                                ? "bg-green-50 text-green-700 border-green-200"
                                                                : "bg-red-50 text-red-700 border-red-200"
                                                                }`}>
                                                                {isCorrect ? "Correct" : "Incorrect"}
                                                            </span>
                                                        </div>

                                                        <div className="space-y-2 sm:space-y-3 bg-gray-50 rounded-lg p-2 sm:p-3">
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                                                <div className={`${textSizes.small} min-w-[80px] sm:min-w-[100px] text-slate-500 font-semibold uppercase tracking-wide`}>
                                                                    Your Answer
                                                                </div>
                                                                <div className={`font-bold flex-1 ${isCorrect
                                                                    ? "text-green-600"
                                                                    : "text-red-600"
                                                                    }`}>
                                                                    {detail.question_type === "true-false" ?
                                                                        detail.userAnswer == 1 || detail.userAnswer == "true" ?
                                                                            "True" :
                                                                            "False" :
                                                                        detail.userAnswer || "No Answer"
                                                                    }
                                                                </div>
                                                            </div>

                                                            {!isCorrect && detail.correctAnswer !== null && (
                                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 pt-2 border-t border-gray-200">
                                                                    <div className={`${textSizes.small} min-w-[80px] sm:min-w-[100px] text-slate-500 font-semibold uppercase tracking-wide`}>
                                                                        Correct Answer
                                                                    </div>
                                                                    <div className="font-bold text-slate-800 flex-1">
                                                                        {detail.question_type === "true-false" ?
                                                                            detail.correctAnswer == 1 || detail.correctAnswer == "true" ?
                                                                                "True" :
                                                                                "False" :
                                                                            Array.isArray(detail.correctAnswer)
                                                                                ? detail.correctAnswer.join(", ")
                                                                                : detail.correctAnswer || "No Answer"
                                                                        }
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                                <HelpCircle className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-1">No Questions Attempted</h3>
                                            <p className="text-gray-500 text-sm max-w-xs mx-auto">
                                                You haven't attempted any questions in this quiz.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        }
                    </div>
                </div>
                {showResult && <QuizResultAnimation type={resultType} onClose={handleCloseAnimation} message={resultMessage} />}
            </div>
        )
    }

    const currentQuestion = allQuestions[currentStep]

    return (
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 pb-24 sm:pb-32">
            {!quizCompleted && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Fullscreen Status Indicator */}
                    {Boolean(quizData.is_warning) && <div className="fixed top-4 right-4 z-50">
                        {!isFullscreen && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg border border-amber-200 shadow-lg">
                                <Maximize2 className="w-4 h-4" />
                                <span className="text-xs font-medium">Fullscreen Required</span>
                            </div>
                        )}
                    </div>}

                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 pb-4 sm:pb-5 mb-2 sm:mb-4">
                        <div className="space-y-1 sm:space-y-2">
                            <div className="flex items-center gap-1 sm:gap-2">
                                <h1 className={`${textSizes.title} font-bold text-slate-800 tracking-tight`}>
                                    {quizData.quiz_title}
                                </h1>
                                {Boolean(quizData?.is_warning) &&
                                    <div className="group relative flex items-center cursor-pointer mt-1">
                                        <Info className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 hover:text-slate-600 transition-colors" />
                                        <div className="absolute left-0 top-full mt-2 w-60 sm:w-72 p-3 bg-slate-900/95 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none backdrop-blur-sm border border-slate-700/50">
                                            <div className="font-semibold text-amber-400 mb-1.5 flex items-center gap-1.5">
                                                <AlertTriangle className="w-3 h-3" />
                                                Exam Rules:
                                            </div>
                                            <p className="leading-relaxed text-slate-200 space-y-1">
                                                • Fullscreen mode is required<br />
                                                • Switching tabs/windows will auto-submit<br />
                                                • {MAX_FULLSCREEN_WARNINGS} warnings for exiting fullscreen
                                            </p>
                                            {/* Arrow */}
                                            {/* <div className="hidden sm:block absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-900/95" /> */}
                                            <div className="absolute bottom-full left-2 border-8 border-transparent border-b-slate-900/95" />
                                        </div>
                                    </div>
                                }
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="uppercase tracking-wide text-[10px] sm:text-xs font-semibold text-slate-400">
                                    {getQuestionTypeName(currentQuestion.type)}
                                </span>
                                <span className={`${textSizes.small} text-slate-500`}>
                                    Question {currentStep + 1} of {allQuestions.length}
                                </span>
                            </div>
                        </div>

                        {/* Timer */}
                        <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 xs:gap-4 w-full xs:w-auto">
                            <span className={`${textSizes.subtitle} font-semibold text-slate-500`}>
                                Total Questions: {allQuestions.length}
                            </span>
                            {Boolean(timeRemaining) && (
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 font-medium text-xs sm:text-sm ${getTimerColor()}`}>
                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="tabular-nums font-bold">
                                        {formatTime(timeRemaining)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Question Navigation Bar */}
                    <div className="relative pb-2 mb-4 sm:mb-6 flex items-center gap-1 sm:gap-2">
                        <button
                            onClick={() => {
                                const container = document.getElementById("questions-container")
                                if (container) container.scrollBy({ left: -150, behavior: "smooth" })
                            }}
                            className="p-1 sm:p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors flex-shrink-0"
                        >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <div
                            id="questions-container"
                            className="flex overflow-x-auto scrollbar-hide scroll-smooth gap-2 sm:gap-3 cursor-grab active:cursor-grabbing select-none w-full px-1"
                            onWheel={(e) => {
                                const container = e.currentTarget
                                if (e.deltaY !== 0) {
                                    container.scrollLeft += e.deltaY
                                    e.preventDefault()
                                }
                            }}
                            onMouseDown={(e) => {
                                setIsDragging(true)
                                setStartX(e.pageX - e.currentTarget.offsetLeft)
                                setScrollLeft(e.currentTarget.scrollLeft)
                            }}
                            onMouseLeave={() => {
                                setIsDragging(false)
                            }}
                            onMouseUp={() => {
                                setIsDragging(false)
                            }}
                            onMouseMove={(e) => {
                                if (!isDragging) return
                                e.preventDefault()
                                const x = e.pageX - e.currentTarget.offsetLeft
                                const walk = (x - startX) * 2
                                e.currentTarget.scrollLeft = scrollLeft - walk
                            }}
                        >
                            {allQuestions.map((q, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleJumpToQuestion(idx)}
                                    className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-200 border relative ${currentStep === idx
                                        ? "text-black bg-slate-100 border-slate-300"
                                        : isQuestionAnswered(idx)
                                            ? "bg-green-50 text-green-700 border-green-200 hover:border-green-300"
                                            : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600"
                                        }`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                const container = document.getElementById("questions-container")
                                if (container) container.scrollBy({ left: 150, behavior: "smooth" })
                            }}
                            className="p-1 sm:p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors flex-shrink-0"
                        >
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>

                    {/* Question Card */}
                    <div className="">
                        <h2 className={`${textSizes.body} sm:text-lg md:text-xl font-semibold text-slate-800 mb-4 sm:mb-6 leading-relaxed`}>
                            {currentQuestion?.type === "fill-in-the-blank"
                                ? currentQuestion.text
                                : currentQuestion?.type === "mcq"
                                    ? currentQuestion.question_text
                                    : currentQuestion?.question}
                        </h2>

                        <div className="space-y-2 sm:space-y-3 max-w-2xl">
                            {/* MCQ Options */}
                            {currentQuestion.type === "mcq" && (
                                <>
                                    {currentQuestion.options?.map((option) => (
                                        <div
                                            key={option.id}
                                            onClick={() => handleAnswerChange(currentQuestion.id, option.id, "mcq")}
                                            className={`group flex items-center p-2.5 sm:p-3 md:p-3.5 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 border ${userAnswers[currentQuestion.id + "-mcq"]?.userAnswer === option.id
                                                ? "border-emerald-500 bg-emerald-50/20"
                                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                                                }`}
                                        >
                                            <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border flex items-center justify-center mr-2 sm:mr-3 transition-colors flex-shrink-0 ${userAnswers[currentQuestion.id + "-mcq"]?.userAnswer === option.id
                                                ? "border-emerald-500"
                                                : "border-slate-300 group-hover:border-slate-400"
                                                }`}>
                                                {userAnswers[currentQuestion.id + "-mcq"]?.userAnswer === option.id && (
                                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" />
                                                )}
                                            </div>
                                            <span className={`${textSizes.small} sm:${textSizes.body} font-medium ${userAnswers[currentQuestion.id + "-mcq"]?.userAnswer === option.id
                                                ? "text-slate-900"
                                                : "text-slate-600"
                                                }`}>
                                                {option.option_text}
                                            </span>
                                        </div>
                                    ))}
                                </>
                            )}

                            {/* True/False Options */}
                            {currentQuestion.type === "true-false" && (
                                <div className="grid grid-cols-1 gap-2 sm:gap-3">
                                    {[true, false].map((val) => (
                                        <div
                                            key={val.toString()}
                                            onClick={() => handleAnswerChange(currentQuestion.id, val, "true-false")}
                                            className={`group flex items-center p-2.5 sm:p-3 md:p-3.5 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 border ${userAnswers[currentQuestion.id + "-true-false"]?.userAnswer === val
                                                ? "border-emerald-500 bg-emerald-50/20"
                                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                                                }`}
                                        >
                                            <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border flex items-center justify-center mr-2 sm:mr-3 transition-colors flex-shrink-0 ${userAnswers[currentQuestion.id + "-true-false"]?.userAnswer === val
                                                ? "border-emerald-500"
                                                : "border-slate-300 group-hover:border-slate-400"
                                                }`}>
                                                {userAnswers[currentQuestion.id + "-true-false"]?.userAnswer === val && (
                                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" />
                                                )}
                                            </div>
                                            <span className={`${textSizes.small} sm:${textSizes.body} font-medium ${userAnswers[currentQuestion.id + "-true-false"]?.userAnswer === val
                                                ? "text-slate-900"
                                                : "text-slate-600"
                                                }`}>
                                                {val ? "True" : "False"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Fill in the Blank Options */}
                            {currentQuestion.type === "fill-in-the-blank" && (
                                <div className="bg-slate-50 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl border border-slate-200">
                                    <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-2">
                                        Your Answer
                                    </label>
                                    <input
                                        type="text"
                                        className={`w-full p-2 sm:p-2.5 ${textSizes.small} sm:${textSizes.body} border border-slate-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white text-slate-800 placeholder:text-slate-300`}
                                        placeholder="Type your answer here..."
                                        value={userAnswers[currentQuestion.id + "-fill-in-the-blank"]?.userAnswer || ""}
                                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value, "fill-in-the-blank")}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Navigation */}
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
                            <button
                                disabled={currentStep === 0}
                                onClick={handlePrev}
                                className={`${buttonPadding} w-32 justify-center rounded-lg ${textSizes.small} sm:${textSizes.body} font-medium border transition-all flex items-center gap-1.5 ${currentStep === 0
                                    ? "border-slate-100 text-slate-300 cursor-not-allowed"
                                    : "border-slate-300 text-slate-800 bg-white"
                                    }`}
                            >
                                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="inline">Previous</span>
                            </button>

                            {currentStep < allQuestions.length - 1 ? (
                                <button
                                    onClick={handleNext}
                                    className={`${buttonPadding} w-32 justify-center bg-slate-900 text-white rounded-lg ${textSizes.small} sm:${textSizes.body} font-medium flex items-center gap-2 border border-transparent shadow-sm`}
                                >
                                    Next
                                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleManualSubmit}
                                    disabled={submitting || allQuestions.length !== Object.values(userAnswers).length}
                                    className={`${buttonPadding} w-32 justify-center bg-primary text-white rounded-lg ${textSizes.small} sm:${textSizes.body} font-medium flex items-center gap-2 shadow-sm ${submitting ? "opacity-75 cursor-not-allowed" : ""}`}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            Submit
                                            <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showFullscreenModal && <FullscreenWarningModal />}
            {showTimeoutModal && <QuizWarningModal />}
        </div>
    )
}