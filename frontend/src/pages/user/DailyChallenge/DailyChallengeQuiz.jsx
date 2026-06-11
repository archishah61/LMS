"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Loader2,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Menu,
  X,
  Star,
  Maximize2,
  Info,
} from "lucide-react"
import { toast } from "react-hot-toast"
import { useCheckChallengeMutation } from "../../../services/Challenge/userChallenge"
import { useCreateQuizAttemptMutation, useGetQuizAttemptsQuery } from "../../../services/Challenge/challengeResponseAPI"
import QuizResultAnimation from "../../../components/ui/animated-celebration"
import { getStudentToken } from "../../../services/CookieService"
import PrimaryLoader from "../../../components/ui/PrimaryLoader"

export default function DailyChallengeQuiz() {
  const { access_token } = getStudentToken()
  const navigate = useNavigate()
  const location = useLocation()
  const { challengeId } = location.state
  const getStorageKey = (key) => `quiz_${challengeId}_${key}`
  const challenge = location.state?.challenge

  const MAX_FULLSCREEN_WARNINGS = challenge?.no_of_warning >= 0 ? challenge?.no_of_warning : 3;

  const timeLimit = challenge?.time_limit || 0

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [quizResults, setQuizResults] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(timeLimit > 0 ? timeLimit * 60 : 0)
  const [timeSpent, setTimeSpent] = useState(0) // Track time spent when no limit
  const [timerActive, setTimerActive] = useState(true)
  const [showTimeoutModal, setShowTimeoutModal] = useState(false)
  const [modalType, setModalType] = useState(null)
  const [isStateRestored, setIsStateRestored] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const submissionStarted = useRef(false)

  // Fullscreen related states
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenWarnings, setFullscreenWarnings] = useState(0)
  const [showFullscreenModal, setShowFullscreenModal] = useState(false)
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0)
  const [isReentering, setIsReentering] = useState(false)

  const [checkChallenge] = useCheckChallengeMutation()
  const [createQuizAttempt] = useCreateQuizAttemptMutation()
  const { data: quizAttemptsData, isLoading: isLoadingAttempts } = useGetQuizAttemptsQuery(
    { user_challenge_id: Number.parseInt(challengeId) },
    { skip: !challengeId },
  )

  const [showResult, setShowResult] = useState(false)
  const [resultType, setResultType] = useState("success")
  const [resultMessage, setResultMessage] = useState("")

  const triggerSuccess = (message = null) => {
    setResultType("success")
    setResultMessage(message || "Congratulations! You've successfully completed the quiz!")
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

  const [quizData, setQuizData] = useState({
    challengeTask: challenge,
  })

  const allQuestions = [
    ...(quizData.challengeTask.TrueFalseChallenges || []).map((q) => ({ ...q, type: "true-false" })),
    ...(quizData.challengeTask.FillInTheBlanksChallenges || []).map((q) => ({ ...q, type: "fill-in-the-blank" })),
    ...(quizData.challengeTask.MCQChallenges || []).map((q) => ({ ...q, type: "mcq" })),
  ]

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

  const saveQuizState = useCallback(() => {
    if (quizCompleted || submitting || !challengeId || !isStateRestored) return

    const quizState = {
      userAnswers,
      currentStep,
      timeRemaining,
      timestamp: Date.now(),
      challengeId,
    }

    localStorage.setItem(getStorageKey("state"), JSON.stringify(quizState))
  }, [userAnswers, currentStep, timeRemaining, quizCompleted, submitting, challengeId, isStateRestored])

  useEffect(() => {
    if (!loading && !quizCompleted) {
      saveQuizState()
    }
  }, [userAnswers, currentStep, timeRemaining, loading, quizCompleted, saveQuizState])

  useEffect(() => {
    setIsStateRestored(false)
  }, [challengeId])

  const clearQuizState = useCallback(() => {
    if (challengeId) {
      localStorage.removeItem(getStorageKey("state"))
    }
  }, [challengeId])

  const handleSubmit = useCallback(
    async (isTimeout = false, reason = "manual") => {
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
          if (reason === "timeout") {
            setModalType("timeout")
          } else if (reason === "tab-change") {
            setModalType("tab-change")
          } else if (reason === "fullscreen-exit-exceeded") {
            setModalType("fullscreen-exceeded")
          } else if (reason === "left-early") {
            setModalType("left-early")
          }
          setShowTimeoutModal(true)
          await new Promise((resolve) => setTimeout(resolve, 1000))
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
        const response = await checkChallenge({
          data: {
            challenge_id: Number.parseInt(challenge.id),
            userAnswers: formattedAnswers,
          },
          access_token,
        }).unwrap()
        const transformedResult = {
          message: response.message,
          totalQuestions: response.total_count,
          totalCorrect: response.correct_count,
          totalRewardPoints: response.totalRewardPoints,
          timeUsed: timeLimit > 0 ? timeLimit * 60 - timeRemaining : timeSpent,
          details: response.results.map((r) => {
            const question = allQuestions.find((q) => q.id === r.question_id)
            return {
              question_id: r.question_id,
              question_type: question.type,
              question_text_stored: question?.question || question?.question_text || question?.text,
              isCorrect: r.isCorrect,
              userAnswer: r.userAnswer ?? null,
              correctAnswer: r.correctAnswer ?? null,
              rewardPoints: r.rewardPoints,
            }
          }),
        }

        const currentAttemptNumber = (quizAttemptsData?.attempts?.length || 0) + 1
        const qualify_percentage = challenge?.qualify_percentage || 100
        const isPassed = (transformedResult.totalQuestions * qualify_percentage) / 100 <= transformedResult.totalCorrect

        if (isPassed) {
          triggerSuccess(isTimeout ? "Time's up! But you still passed the challenge!" : undefined)
        } else {
          triggerFailure(isTimeout ? "Time's up! You didn't pass this time." : undefined)
        }
        setQuizResults(transformedResult)
        setQuizCompleted(true)

        await createQuizAttempt({
          user_challenge_id: Number.parseInt(challengeId),
          user_challenge_task_id: null,
          attempt_number: currentAttemptNumber,
          total_questions: transformedResult.totalQuestions,
          total_correct: transformedResult.totalCorrect,
          total_reward_points: transformedResult.totalRewardPoints,
          time_used_seconds: Math.round(transformedResult.timeUsed),
          is_passed: isPassed,
          results_details: transformedResult.details.map((r) => {
            const question = allQuestions.find((q) => q.id === r.question_id)
            return {
              question_id: r.question_id,
              question_text_stored: question?.question || question?.question_text || question?.text,
              isCorrect: r.isCorrect,
              userAnswer: r.userAnswer ?? null,
              rewardPoints: r.rewardPoints ? (r.isCorrect ? r.rewardPoints : 0) : null,
            }
          }),
        }).unwrap()
        toast.success("Quiz attempt recorded successfully!")

        clearQuizState()
      } catch (error) {
        console.error("Failed to submit answers or record attempt:", error)
        toast.error(error.data?.message || "Failed to submit answers or record attempt")
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
      challenge,
      access_token,
      checkChallenge,
      timeLimit,
      submitting,
      quizCompleted,
      createQuizAttempt,
      quizAttemptsData,
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
        if (Boolean(challenge?.is_warning) && !isReentering) {
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
      // Fullscreen request must be the FIRST thing in the user gesture
      await enterFullscreen()
    } catch (error) {
      console.error("Error re-entering fullscreen:", error)
      toast.error("Failed to enter fullscreen mode. Please try again.")
      throw error
    }
  }, [enterFullscreen])

  useEffect(() => {
    let timer
    if (timerActive && !quizCompleted && !submissionStarted.current) {
      timer = setInterval(() => {
        if (timeLimit > 0) {
          // Countdown mode with auto-submit
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              handleSubmit(true, "timeout")
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
  }, [timerActive, quizCompleted, submissionStarted.current, timeLimit, handleSubmit])

  useEffect(() => {
    const initializeQuiz = () => {
      setLoading(true)

      const savedState = localStorage.getItem(getStorageKey("state"))
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState)
          const isStateValid = Date.now() - parsedState.timestamp < 24 * 60 * 60 * 1000

          if (isStateValid && challengeId) {
            setUserAnswers(parsedState.userAnswers || {})
            setCurrentStep(parsedState.currentStep || 0)
            setTimeRemaining(parsedState.timeRemaining || timeLimit * 60)
          }
        } catch (error) {
          console.error("Error loading saved state:", error)
          localStorage.removeItem(getStorageKey("state"))
        }
      } else {
        setTimeRemaining(timeLimit * 60)
      }

      setLoading(false)
    }

    if (challengeId && !isStateRestored) {
      initializeQuiz()
    } else {
      const timer = setTimeout(() => {
        if (challengeId) {
          initializeQuiz()
        } else {
          setLoading(false)
        }
      }, 100)
      return () => clearTimeout(timer)
    }
    setIsStateRestored(true)
  }, [challengeId, timeLimit, isStateRestored])

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!quizCompleted && !submitting) {
        saveQuizState()
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      if (!quizCompleted && !submitting) {
        saveQuizState()
      }
    }
  }, [quizCompleted, submitting, saveQuizState])

  useEffect(() => {
    if (quizCompleted) return
    const handleVisibilityChange = () => {
      if (Boolean(challenge?.is_warning) && document.hidden && !submissionStarted.current && !quizCompleted) {
        setFullscreenExitCount(prev => prev + 1)

        if (fullscreenExitCount + 1 > MAX_FULLSCREEN_WARNINGS) {
          handleSubmit(true, 'tab-change')
        } else {
          setShowFullscreenModal(true)
        }
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [handleSubmit, quizCompleted])

  useEffect(() => {
    if (quizCompleted) return

    const handleBackButton = (event) => {
      if (!submissionStarted.current && !quizCompleted) {
        event.preventDefault()
        event.returnValue = ""

        setTimeout(() => {
          window.history.go(1)
        }, 0)

        setModalType("back-button")
        setShowTimeoutModal(true)
      }
    }

    window.addEventListener("popstate", handleBackButton)

    return () => {
      window.removeEventListener("popstate", handleBackButton)
    }
  }, [quizCompleted, submissionStarted])

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
    setMobileSidebarOpen(false)
  }

  const isQuestionAnswered = (index) => {
    const question = allQuestions[index]
    if (!question) return false
    return !!userAnswers[question.id + "-" + question.type]
  }

  const getQuestionBadgeColor = (type) => {
    switch (type) {
      case "mcq":
        return "bg-purple-100 text-purple-800"
      case "true-false":
        return "bg-green-100 text-green-800"
      case "fill-in-the-blank":
        return "bg-blue-100 text-blue-800"
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

  const handleFinish = () => {
    exitFullscreen()
    navigate(-1)
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

  const QuizWarningModal = () => {
    const getModalConfig = () => {
      switch (modalType) {
        case "timeout":
          return {
            icon: <Clock className="w-8 h-8 text-orange-600" />,
            title: "Time's Up!",
            message: "The time limit has been reached. Your answers are being submitted automatically.",
            bgColor: "bg-orange-100",
            textColor: "text-orange-600",
            buttonText: "Submitting your answers...",
            showSpinner: true,
          }
        case "tab-change":
          return {
            icon: <AlertTriangle className="w-8 h-8 text-red-600" />,
            title: "Tab Change Detected!",
            message: "You have switched tabs/windows. As per exam rules, your quiz is being submitted automatically.",
            bgColor: "bg-red-100",
            textColor: "text-red-600",
            buttonText: "Submitting your answers...",
            showSpinner: true,
          }
        case "back-button":
          return {
            icon: <AlertTriangle className="w-8 h-8 text-amber-600" />,
            title: "Don't Leave!",
            message: "Are you sure you want to leave? Your progress will be submitted and you won't be able to return to this quiz.",
            bgColor: "bg-amber-100",
            textColor: "text-amber-600",
            buttonText: "Stay on Page",
            showSpinner: false,
            showActions: true,
          }
        case "left-early":
          return {
            icon: <AlertTriangle className="w-8 h-8 text-amber-600" />,
            title: "Leaving Quiz",
            message: "Your quiz is being submitted as you've chosen to leave. Please wait...",
            bgColor: "bg-amber-100",
            textColor: "text-amber-600",
            buttonText: "Submitting your answers...",
            showSpinner: true,
          }
        case "fullscreen-exceeded":
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
            showSpinner: false,
          }
      }
    }

    const config = getModalConfig()

    const handleStayOnPage = () => {
      setShowTimeoutModal(false)
      setModalType(null)
    }

    const handleLeavePage = () => {
      setShowTimeoutModal(false)
      setModalType(null)
      handleSubmit(true, "left-early")
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
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                <button
                  onClick={handleStayOnPage}
                  className="px-4 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex-1 sm:flex-none"
                >
                  Stay on Page
                </button>
                <button
                  onClick={handleLeavePage}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex-1 sm:flex-none"
                >
                  Leave Anyway
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  const MobileQuestionModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 md:hidden">
      <div className="bg-white rounded-xl shadow-xl w-full max-h-[90vh] overflow-hidden max-w-md">
        <div className="p-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800 text-lg">Questions</h3>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3">
            {allQuestions.map((question, index) => (
              <div
                key={index}
                onClick={() => handleJumpToQuestion(index)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transform transition-all duration-300
                  ${currentStep === index
                    ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200"
                    : "hover:bg-gray-50"
                  }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 transition-colors duration-300
                    ${isQuestionAnswered(index)
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                      : "bg-gray-100 text-gray-600"
                    }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-base ${currentStep === index
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 font-semibold"
                      : "text-gray-800 font-medium"
                      }`}
                  >
                    Question {index + 1}
                  </span>
                  <span className={`text-xs ml-2 ${getQuestionBadgeColor(question.type)} px-2 py-1 rounded-full`}>
                    {getQuestionTypeName(question.type)}
                  </span>
                </div>
                {isQuestionAnswered(index) && (
                  <div className="ml-auto">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t">
          <div className="text-sm text-gray-600 mb-2 flex justify-between">
            <span>
              <span className="font-semibold">{Object.keys(userAnswers).length}</span> of{" "}
              <span className="font-semibold">{allQuestions.length}</span> questions answered
            </span>
            <span className="text-green-600 font-medium">
              {Math.round((Object.keys(userAnswers).length / allQuestions.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${(Object.keys(userAnswers).length / allQuestions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )

  if (loading || isLoadingAttempts) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <PrimaryLoader />
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-xl shadow-lg flex flex-col items-center max-w-md mx-4">
          <div className="w-16 h-16 flex items-center justify-center bg-red-100 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">No Challenge Found</h2>
          <p className="text-gray-600 text-center mb-6">
            We couldn't find the challenge data you're looking for.
          </p>
          <button
            onClick={() => navigate("/challenges")}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-base"
          >
            Back to Challenges
          </button>
        </div>
      </div>
    )
  }

  const showAnswer = Boolean(quizData?.challengeTask?.show_answer);

  if (quizCompleted) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-8 max-w-7xl">
        <div className="bg-white rounded-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-8">

            {/* Left Column: Summary & Stats - Updated for mobile/tablet */}
            <div className={`${!showAnswer ? 'lg:col-span-12 max-w-5xl mx-auto w-full' : 'lg:col-span-4'} space-y-6 lg:top-8`}>
              {/* Header - Centered when no answers */}
              <div className={`${!showAnswer ? 'text-center' : 'text-left'} space-y-2`}>
                <h1 className={`${!showAnswer ? 'text-2xl md:text-3xl' : 'text-xl sm:text-2xl'} font-bold text-slate-900 line-clamp-2 leading-tight`}>
                  {challenge.title}
                </h1>
                <p className={`${!showAnswer ? 'text-base' : 'text-sm sm:text-base'} text-slate-500 font-medium`}>
                  Congratulations! You've completed this challenge!
                </p>
              </div>

              {/* Feedback Banner - Centered when no answers */}
              <div className={`${!showAnswer ? 'flex justify-center' : ''}`}>
                {quizResults.totalCorrect === quizResults.totalQuestions ? (
                  <div className={`inline-flex items-center justify-center bg-emerald-50 text-emerald-700 px-4 sm:px-6 py-3 sm:py-4 rounded-xl border border-emerald-100 font-bold shadow-sm ${!showAnswer ? 'text-sm sm:text-base w-auto' : 'w-full text-sm sm:text-base'}`}>
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Perfect score! Excellent work!
                  </div>
                ) : quizResults.totalCorrect > quizResults.totalQuestions / 2 ? (
                  <div className={`inline-flex items-center justify-center bg-emerald-50 text-emerald-700 px-4 sm:px-6 py-3 sm:py-4 rounded-xl border border-emerald-100 font-bold shadow-sm ${!showAnswer ? 'text-sm sm:text-base w-auto' : 'w-full text-sm sm:text-base'}`}>
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Good job! You're on the right track.
                  </div>
                ) : (
                  <div className={`inline-flex items-center justify-center bg-orange-50 text-orange-700 px-4 sm:px-6 py-3 sm:py-4 rounded-xl border border-orange-100 font-bold shadow-sm ${!showAnswer ? 'text-sm sm:text-base w-auto' : 'w-full text-sm sm:text-base'}`}>
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Keep practicing to improve your score.
                  </div>
                )}
              </div>

              {/* Stats Cards */}
              {!showAnswer ? (
                /* When answers are HIDDEN: Cards in 1 ROW (3 columns) */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Score Card */}
                  <div className="bg-white rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
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
                          stroke={quizResults.totalCorrect === quizResults.totalQuestions ? "#10B981" : "#F59E0B"}
                          strokeWidth="3"
                          strokeDasharray={`${(quizResults.totalCorrect / quizResults.totalQuestions) * 100}, 100`}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-900">
                        {Math.round((quizResults.totalCorrect / quizResults.totalQuestions) * 100)}%
                      </div>
                    </div>
                    <div>
                      <h3 className="text-slate-900 font-bold text-sm sm:text-base">Score</h3>
                      <p className="text-slate-500 font-medium text-xs sm:text-sm">
                        {quizResults.totalCorrect}/{quizResults.totalQuestions} correct
                      </p>
                    </div>
                  </div>

                  {/* Points Card */}
                  <div className="bg-white rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-orange-50 rounded-full flex-shrink-0">
                      <Star className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 fill-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-slate-900 font-bold text-sm sm:text-base">Points</h3>
                      <p className="text-slate-500 font-medium text-xs sm:text-sm">{quizResults.totalRewardPoints} pts earned</p>
                    </div>
                  </div>

                  {/* Time Card */}
                  <div className="bg-white rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-indigo-50 rounded-full flex-shrink-0">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="text-slate-900 font-bold text-sm sm:text-base">Time</h3>
                      <p className="text-slate-500 font-medium text-xs sm:text-sm">
                        {Math.floor(quizResults.timeUsed / 60)}m {quizResults.timeUsed % 60}s
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* When answers are SHOWING: Cards in 1 COLUMN (3 rows) - STACKED VERTICALLY */
                <div className="space-y-3 sm:space-y-4">
                  {/* Score Card */}
                  <div className="w-full bg-white rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border border-slate-100 shadow-sm">
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
                          stroke={quizResults.totalCorrect === quizResults.totalQuestions ? "#10B981" : "#F59E0B"}
                          strokeWidth="3"
                          strokeDasharray={`${(quizResults.totalCorrect / quizResults.totalQuestions) * 100}, 100`}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-900">
                        {Math.round((quizResults.totalCorrect / quizResults.totalQuestions) * 100)}%
                      </div>
                    </div>
                    <div>
                      <h3 className="text-slate-900 font-bold text-base sm:text-lg">Score Achieved</h3>
                      <p className="text-slate-500 font-medium text-xs sm:text-sm">
                        {quizResults.totalCorrect}/{quizResults.totalQuestions} correct answers
                      </p>
                    </div>
                  </div>

                  {/* Points Card */}
                  <div className="w-full bg-white rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-orange-50 rounded-full flex-shrink-0">
                      <Star className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 fill-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-slate-900 font-bold text-base sm:text-lg">Points Earned</h3>
                      <p className="text-slate-500 font-medium text-xs sm:text-sm">You earned {quizResults.totalRewardPoints} pts</p>
                    </div>
                  </div>

                  {/* Time Card */}
                  <div className="w-full bg-white rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-indigo-50 rounded-full flex-shrink-0">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="text-slate-900 font-bold text-base sm:text-lg">Time Taken</h3>
                      <p className="text-slate-500 font-medium text-xs sm:text-sm">
                        Completed in {Math.floor(quizResults.timeUsed / 60)}m {quizResults.timeUsed % 60}s
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Back Button - Centered when no answers */}
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
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleFinish}
                      className="w-full md:w-1/2 lg:w-1/3 flex items-center justify-center gap-2 
                                px-4 py-2.5 sm:px-6 sm:py-3.5 
                                bg-forestGreen text-white 
                                rounded-lg sm:rounded-xl 
                                font-bold transition-all shadow-sm 
                                active:scale-95 text-xs sm:text-sm"
                    >
                      <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                      Back to Challenges
                    </button>
                  </div>
                )}
            </div>

            {/* Right Column: Question Review - Updated for mobile/tablet */}
            {showAnswer &&
              <div className="lg:col-span-8 mt-6 lg:mt-0">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-xs sm:text-sm md:text-base font-bold text-slate-800 flex items-center gap-2">
                    Question Review
                    <span className="text-[10px] sm:text-xs font-medium px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {quizResults.totalQuestions} Questions
                    </span>
                  </h3>
                </div>
                <div className="space-y-3 sm:space-y-4 max-h-[60vh] sm:max-h-[70vh] md:max-h-[75vh] overflow-y-auto pr-1 sm:pr-2 scrollbar-hide">
                  {quizResults.details.length > 0 ?
                    (quizResults.details.map((detail, index) => {
                      const question = allQuestions.find((q) => q.id === detail.question_id)
                      const isCorrect = showAnswer ? detail.isCorrect : null

                      return (
                        <div key={index} className="border-b border-gray-100 last:border-0">
                          <div className="p-3 sm:p-4 md:p-5">
                            <div className="flex items-start justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                              <div className="flex items-start gap-2 sm:gap-3">
                                <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] sm:text-xs font-bold mt-0.5 ${!showAnswer
                                  ? "bg-gray-100 text-gray-500"
                                  : isCorrect
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                  }`}>
                                  {index + 1}
                                </span>
                                <p className="text-xs sm:text-xs md:text-sm text-slate-800 font-medium leading-relaxed">
                                  {detail.question_text_stored}
                                </p>
                              </div>
                              {Boolean(showAnswer) && (
                                <span className={`flex-shrink-0 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold border ${isCorrect
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                                  }`}>
                                  {isCorrect ? "Correct" : "Incorrect"}
                                </span>
                              )}
                            </div>

                            <div className="space-y-2 sm:space-y-3 bg-gray-50 rounded-lg p-2 sm:p-3">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <div className="text-xs sm:text-xs md:text-sm min-w-[80px] sm:min-w-[100px] text-slate-500 font-semibold uppercase tracking-wide">
                                  Your Answer
                                </div>
                                <div className={`font-bold flex-1 ${!showAnswer
                                  ? "text-slate-800"
                                  : isCorrect
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

                              {Boolean(showAnswer) && !Boolean(isCorrect) && (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 pt-2 border-t border-gray-200">
                                  <div className="text-xs sm:text-xs md:text-sm min-w-[80px] sm:min-w-[100px] text-slate-500 font-semibold uppercase tracking-wide">
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
                      <div className="flex items-center justify-center h-full py-12">
                        <p className="text-slate-500 text-sm sm:text-base font-medium">
                          No questions answered
                        </p>
                      </div>
                    )
                  }
                </div>
              </div>
            }

          </div>
        </div>

        {showResult && (
          <QuizResultAnimation type={resultType} onClose={handleCloseAnimation} message={resultMessage} />
        )}
      </div>
    )
  }

  const currentQuestion = allQuestions[currentStep]

  return (
    <div className="container py-4 md:py-8 bg-white min-h-screen">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        {/* Fullscreen Status Indicator */}
        {Boolean(challenge?.is_warning) &&
          <div className="fixed top-4 right-4 z-50">
            {!isFullscreen && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg border border-amber-200 shadow-lg">
                <Maximize2 className="w-4 h-4" />
                <span className="text-xs font-medium">Fullscreen Required</span>
              </div>
            )}
          </div>
        }

        {/* Header - Updated for mobile/tablet */}
        <div className="flex flex-row items-center justify-between mb-6 md:mb-8 gap-3 md:gap-4">
          {/* Left side: Challenge title and info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 line-clamp-1">{challenge.title}</h1>
              {Boolean(challenge?.is_warning) &&
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
                    <div className="absolute bottom-full left-2 border-8 border-transparent border-b-slate-900/95" />
                  </div>
                </div>
              }
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {getQuestionTypeName(currentQuestion.type)}
            </p>
          </div>

          {/* Right side: Total Questions and Timer */}
          <div className="flex flex-row items-center gap-4 sm:gap-6">
            {/* Total Questions */}
            <div className="hidden sm:flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm text-slate-400 whitespace-nowrap">Total Questions</span>
              <span className="text-sm sm:text-base font-semibold text-slate-900">{allQuestions.length}</span>
            </div>

            {/* Timer */}
            {timeLimit > 0 && (
              <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-indigo-50 flex items-center gap-2 ${getTimerColor()} whitespace-nowrap`}>
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-mono font-bold text-xs sm:text-sm">{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile: Total Questions (shown only on mobile below the header) */}
        <div className="sm:hidden mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Total Questions:</span>
              <span className="text-sm font-semibold text-slate-900">{allQuestions.length}</span>
            </div>
            <div className="text-xs text-slate-400">
              Answered: <span className="font-semibold text-green-600">{Object.keys(userAnswers).length}/{allQuestions.length}</span>
            </div>
          </div>
        </div>

        {/* Horizontal Navigation - Enhanced for mobile scrolling */}
        <div className="flex items-center gap-2 sm:gap-4 mb-8 md:mb-10 overflow-hidden pb-2">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 text-slate-400 disabled:opacity-30 transition-colors flex-shrink-0"
            aria-label="Previous question"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex-1 overflow-x-auto flex gap-2 sm:gap-3 py-1 sm:py-2 px-1 scroll-smooth scrollbar-hide"
            id="question-nav">
            {allQuestions.map((_, index) => (
              <button
                key={index}
                onClick={() => handleJumpToQuestion(index)}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex-shrink-0 flex items-center justify-center text-sm sm:text-base font-bold transition-all duration-200
          ${currentStep === index
                    ? "bg-indigo-50 text-indigo-600 ring-1 sm:ring-2 ring-indigo-100 scale-105"
                    : isQuestionAnswered(index)
                      ? "bg-green-50 text-green-600 border border-green-200 hover:border-green-300"
                      : "bg-white text-slate-400 border border-slate-100 hover:bg-slate-50"
                  }`}
                aria-label={`Go to question ${index + 1}`}
                aria-current={currentStep === index ? "step" : undefined}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={currentStep === allQuestions.length - 1}
            className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 text-slate-400 disabled:opacity-30 transition-colors flex-shrink-0"
            aria-label="Next question"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Question & Options - Updated for mobile/tablet */}
        <div className="mb-20 md:mb-12">
          <h2 className="text-base sm:text-lg md:text-lg font-medium text-slate-900 mb-6 md:mb-8 leading-relaxed">
            {currentQuestion.type === "fill-in-the-blank"
              ? currentQuestion.text
              : currentQuestion.type === "mcq"
                ? currentQuestion.question_text
                : currentQuestion.question}
          </h2>

          <div className="space-y-2.5 sm:space-y-3 max-w-2xl">
            {/* MCQ options */}
            {currentQuestion.type === "mcq" && (
              <>
                {currentQuestion.MCQOptionChallenges?.map((option) => {
                  const isSelected = userAnswers[currentQuestion.id + "-mcq"]?.userAnswer === option.id;
                  return (
                    <div
                      key={option.id}
                      onClick={() => handleAnswerChange(currentQuestion.id, option.id, "mcq")}
                      className={`group flex items-center p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all duration-200
                          ${isSelected
                          ? "bg-white border-green-100"
                          : "bg-white border-slate-100 "
                        }`}
                    >
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 mr-3 sm:mr-4 flex items-center justify-center transition-colors
                          ${isSelected ? "border-green-500" : "border-slate-200"}`}>
                        {isSelected && <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-500" />}
                      </div>
                      <span className={`text-sm sm:text-sm ${isSelected ? "text-slate-900 font-medium" : "text-slate-600"}`}>
                        {option.option_text}
                      </span>
                    </div>
                  )
                })}
              </>
            )}

            {/* True/False options */}
            {currentQuestion.type === "true-false" && (
              <>
                {[true, false].map((val) => {
                  const isSelected = userAnswers[currentQuestion.id + "-true-false"]?.userAnswer === val;
                  return (
                    <div
                      key={val.toString()}
                      onClick={() => handleAnswerChange(currentQuestion.id, val, "true-false")}
                      className={`group flex items-center p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all duration-200
                          ${isSelected
                          ? "bg-white border-green-100"
                          : "bg-white border-slate-100 "
                        }`}
                    >
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 mr-3 sm:mr-4 flex items-center justify-center transition-colors
                          ${isSelected ? "border-green-500" : "border-slate-200"}`}>
                        {isSelected && <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-500" />}
                      </div>
                      <span className={`text-sm sm:text-sm ${isSelected ? "text-slate-900 font-medium" : "text-slate-600"}`}>
                        {val ? "True" : "False"}
                      </span>
                    </div>
                  )
                })}
              </>
            )}

            {/* Fill in the blank */}
            {currentQuestion.type === "fill-in-the-blank" && (
              <div className="bg-white border-2 border-slate-100 rounded-lg sm:rounded-xl p-1 focus-within:border-green-200 focus-within:ring-2 sm:focus-within:ring-4 focus-within:ring-green-500/10 transition-all">
                <input
                  type="text"
                  className="w-full p-3 sm:p-4 bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-300 text-slate-900"
                  placeholder="Type your answer here..."
                  value={userAnswers[currentQuestion.id + "-fill-in-the-blank"]?.userAnswer || ""}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value, "fill-in-the-blank")}
                />
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer Navigation - Updated for mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-3 sm:p-4 md:px-8 z-40 shadow-lg">
          <div className="container flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>

            {currentStep < allQuestions.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting || allQuestions.length !== Object.values(userAnswers).length}
                className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed min-w-[100px] sm:min-w-[140px] justify-center"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    <span className="hidden sm:inline">Submitting...</span>
                    <span className="sm:hidden">Submit...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Submit Quiz</span>
                    <span className="sm:hidden">Submit</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Warning Modals */}
      {showFullscreenModal && <FullscreenWarningModal />}
      {showTimeoutModal && <QuizWarningModal />}

      {/* Mobile Question Navigation Modal */}
      {mobileSidebarOpen && <MobileQuestionModal />}
    </div>
  )
}