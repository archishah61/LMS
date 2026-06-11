"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, Play, Send, Clock, CheckCircle, XCircle, Loader2, Maximize2, AlertTriangle, HelpCircle } from "lucide-react"
import { useStartContestCodingMutation } from "../../../services/Contest/userActivityAPI"
import { useBlocker, useLocation, useNavigate } from "react-router-dom"
import { getStudentToken } from "../../../services/CookieService"
import toast from "react-hot-toast"
import PrimaryLoader from "../../../components/ui/PrimaryLoader"
import { io } from "socket.io-client"
import { useGetTestCasesQuery } from "../../../services/Contest/contestCodingTestCaseAPI"
import { useSaveUserContestCodingAttemptMutation } from "../../../services/Contest/userContestCodingAPI"
import CodeEditor from "../../../components/contest/Code"
import { useCallback } from "react"

// Define backend URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_MEDIA_URL
const socket = io(BACKEND_URL)

const CodingQuizInterface = () => {
  const navigate = useNavigate()
  const { contest_id, coding_id } = useLocation().state

  const { access_token } = getStudentToken();

  const [activeTab, setActiveTab] = useState("Problem")
  const [selectedLanguage, setSelectedLanguage] = useState("python")
  const [code, setCode] = useState("")
  const [contestCoding, setContestCoding] = useState(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [testing, setTesting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [testResults, setTestResults] = useState([])
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [consoleOutput, setConsoleOutput] = useState("")
  const [error, setError] = useState("")
  const [codingId, setCodingId] = useState(null);
  const [allTestsPassed, setAllTestsPassed] = useState(false)
  const [submissionInProgress, setSubmissionInProgress] = useState(false)
  const submissionStarted = useRef(false)
  const [autoSubmitTriggered, setAutoSubmitTriggered] = useState(false)

  // Fullscreen related states
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenWarnings, setFullscreenWarnings] = useState(0)
  const [showFullscreenModal, setShowFullscreenModal] = useState(false)
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0)
  const [isReentering, setIsReentering] = useState(false)
  const MAX_FULLSCREEN_WARNINGS = contestCoding?.no_of_warning >= 0 ? contestCoding?.no_of_warning : 3;

  const [showTimeoutModal, setShowTimeoutModal] = useState(false)
  const [modalType, setModalType] = useState(null) // 'timeout', 'tab-change', 'back-button', 'fullscreen-exceeded', 'manual-submit'
  const [quizCompleted, setQuizCompleted] = useState(false) // Add this line

  const [startContestCoding] = useStartContestCodingMutation();
  const [saveAttempt] = useSaveUserContestCodingAttemptMutation();

  const {
    data: testCasesResponse,
    isLoading: testCasesLoading,
    refetch: refetchTestCases,
  } = useGetTestCasesQuery(codingId, {
    skip: !codingId,
  })

  const testCases = testCasesResponse?.testCases || []

  const availableLanguages = [
    { value: "javascript", label: "JavaScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "c", label: "C" }
  ]

  // Connect to socket
  useEffect(() => {
    socket.on("execution-results", (data) => {
      setRunning(false);
      setTesting(false);
      setSubmitting(false);

      if (!data?.isSample) {
        setTestResults(data.results);
        setActiveTab("Results");

        // Check if all test cases passed
        const allPassed = data.results.every(r => r.passed);
        setAllTestsPassed(allPassed);

        if (!data?.isSubmission) {
          if (data.allPassed) {
            toast.success("All test cases passed!");
          } else {
            toast.error("Some test cases failed");
          }
        }
      }

      // Format console output
      const outputText = data.results
        .filter(r => data.isSample || r.isPublic)
        .map((r, i) => {
          return (
            `Test Case #${i + 1}\n` +
            `Input:\n${r.input}\n\n` +
            (r.error
              ? `Output:\nStatus: Error\nError:\n${r.error}\n`
              : `Output:\n${r.actual}\n`) +
            `--------------------------------`
          );
        })
        .join('\n\n');

      setConsoleOutput(outputText);
    });

    socket.on("execution-error", (data) => {
      setRunning(false);
      setTesting(false);
      setSubmitting(false);
      setAllTestsPassed(false);
      setError(data.error);
      setConsoleOutput(`Error: ${data.error}`);
    });

    return () => {
      socket.off("execution-results");
      socket.off("execution-error");
    };
  }, []);

  const fetchContestActivity = async (coding_id) => {
    try {
      const codingData = await startContestCoding({ contest_id, coding_id, access_token }).unwrap();

      setContestCoding(codingData?.contestCoding)
      setCode(codingData?.contestCoding.starter_code[selectedLanguage] || "")
      setTimeRemaining(codingData?.contestCoding.time_limit_seconds) // Already in seconds

      if (codingData?.contestCoding?.coding_id) {
        await fetchTestCases(codingData.contestCoding.coding_id)
      }
    } catch (error) {
      console.error("Error fetching contest activity:", error)
      toast.error(error?.data?.error || error?.data?.message || "Failed to load coding challenge")
    }
  }

  const fetchTestCases = async (codingId) => {
    try {
      setCodingId(codingId);
      refetchTestCases();
    } catch (error) {
      console.error("Error fetching test cases:", error)
    }
  }

  const submitCode = async (autoSubmit = false, reason = 'manual') => {
    // Prevent multiple submissions
    if (submissionStarted.current || submissionInProgress) {
      return;
    }

    // Don't allow manual submit if tests haven't passed (unless auto-submit)
    if (!autoSubmit && !allTestsPassed) {
      toast.error("Please pass all test cases before submitting");
      return;
    }

    submissionStarted.current = true;
    setSubmissionInProgress(true);
    setSubmitting(true);

    try {
      // Add this check at the beginning
      if (!socket.connected) {
        toast.error('Not connected to server. Please wait or refresh the page.');
        return;
      }

      // Execute with all test cases for final verification
      socket.emit("execute-code", {
        code,
        language: selectedLanguage,
        testCases: testCases,
        isSampleRun: false,
        isSubmission: true
      });

      // Wait for execution results
      const results = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Execution timeout"));
        }, 30000);

        socket.once("execution-results", (data) => {
          clearTimeout(timeout);
          resolve(data);
        });

        socket.once("execution-error", (data) => {
          clearTimeout(timeout);
          reject(data);
        });
      });

      const allPassed = results.results.every(r => r.passed);

      // Prepare attempt data
      const attemptData = {
        contest_id: contest_id,
        coding_id: coding_id,
        score: contestCoding.points_reward,
        time_taken_seconds: contestCoding.time_limit_seconds - timeRemaining,
        status: allPassed ? "completed" : "failed",
        meta: {
          submitted_code: code,
          language: selectedLanguage,
          total_test_cases: results.results.length,
          passed_test_cases: results.results.filter(r => r.passed).length,
          submission_reason: autoSubmit ? reason : "manual",
          test_case_details: results.results
            .filter(r => r.isPublic)
            .map(r => ({
              input: r.input,
              expected_output: r.expected,
              actual_output: r.actual,
              passed: r.passed,
              error: r.error || null
            }))
        }
      };

      // Save attempt to backend
      const saveResponse = await saveAttempt({
        ...attemptData,
        access_token
      }).unwrap();

      if (saveResponse.success) {
        if (autoSubmit) {
          if (reason === 'timeout') {
            toast.success("Time's up! Code auto-submitted.");
          } else if (reason === 'tab-change') {
            toast.success("Tab change detected. Code auto-submitted.");
          } else if (reason === 'fullscreen-exceeded') {
            toast.success("Fullscreen violation. Code auto-submitted.");
          } else if (reason === 'left-early') {
            toast.success("Leaving page. Code auto-submitted.");
          }
        } else {
          toast.success(allPassed ? "Code submitted successfully!" : "Code submitted but not all tests passed.");
        }

        // Exit fullscreen before navigating
        await exitFullscreen();

        // Navigate back after successful submission
        navigate(-1);
      } else {
        throw new Error("Failed to save attempt");
      }

    } catch (error) {
      console.error("Error submitting code:", error);
      toast.error(error.message || "Error submitting code");
      submissionStarted.current = false;
      setSubmissionInProgress(false);
      setSubmitting(false);
      setAutoSubmitTriggered(false);
      setShowTimeoutModal(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0 && !submissionStarted.current && !autoSubmitTriggered && !submissionInProgress) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeRemaining === 0 && contestCoding && !submissionStarted.current && !autoSubmitTriggered && !submissionInProgress) {
      setAutoSubmitTriggered(true);
      setModalType('timeout');
      setShowTimeoutModal(true);
      // Auto-submit when time runs out
      submitCode(true, 'timeout');
    }
  }, [timeRemaining, contestCoding, submissionStarted.current, autoSubmitTriggered, submissionInProgress])

  // Auto submit on tab / window switch (visibility change)
  useEffect(() => {
    if (submissionInProgress || autoSubmitTriggered) return;

    const handleVisibilityChange = () => {
      if (document.hidden && !submissionStarted.current && !submissionInProgress && !autoSubmitTriggered) {
        setModalType('tab-change');
        setShowTimeoutModal(true);
        submitCode(true, 'tab-change');
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [submitCode, submissionInProgress, autoSubmitTriggered]);

  // Load contest activity and test cases
  useEffect(() => {
    const loadData = async () => {
      if (!coding_id) {
        setLoading(false)
        return
      }

      setLoading(true)
      await fetchContestActivity(coding_id)
      setLoading(false)
    }
    loadData()
  }, [coding_id])

  // Update code when language changes
  useEffect(() => {
    if (contestCoding && contestCoding.starter_code[selectedLanguage]) {
      setCode(contestCoding.starter_code[selectedLanguage])
    }
  }, [selectedLanguage, contestCoding])

  // Use React Router's blocker API
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    // Only block if not submitting and not already auto-submitted
    return !submissionInProgress && !submitting && !autoSubmitTriggered &&
      !submissionStarted.current && currentLocation.pathname !== nextLocation.pathname;
  });

  useEffect(() => {
    if (blocker.state === "blocked") {
      setModalType('back-button');
      setShowTimeoutModal(true);
    }
  }, [blocker.state]);

  // Fullscreen functions
  const checkFullscreen = useCallback(() => {
    const fullscreenElement =
      document.fullscreenElement ||
      document.mozFullScreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    return !!fullscreenElement
  }, [])

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

  const handleReenterFullscreen = useCallback(async () => {
    try {
      await enterFullscreen()
    } catch (error) {
      console.error("Error re-entering fullscreen:", error)
      toast.error("Failed to enter fullscreen mode. Please try again.")
      throw error
    }
  }, [enterFullscreen])

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = checkFullscreen()
      setIsFullscreen(isCurrentlyFullscreen)

      if (!isCurrentlyFullscreen && !submissionInProgress && !submitting && !autoSubmitTriggered) {
        if (Boolean(contestCoding?.is_warning) && !isReentering) {
          setFullscreenExitCount((prev) => {
            const newCount = prev + 1
            if (newCount > MAX_FULLSCREEN_WARNINGS) {
              setModalType('fullscreen-exceeded')
              setShowTimeoutModal(true)
              submitCode(true, 'fullscreen-exceeded')
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
  }, [checkFullscreen, submissionInProgress, submitting, autoSubmitTriggered, isReentering, submitCode])

  // Auto enter fullscreen on component mount
  useEffect(() => {
    if (!submissionInProgress && !autoSubmitTriggered) {
      enterFullscreen()
    }
    return () => {
      if (!submissionInProgress && !autoSubmitTriggered) {
        exitFullscreen()
      }
    }
  }, [enterFullscreen, exitFullscreen, submissionInProgress, autoSubmitTriggered])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-700"
      case "medium":
        return "bg-orange-100 text-orange-700"
      case "hard":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const runCode = async () => {
    setRunning(true)
    setConsoleOutput("")
    setError("")

    // Get first public test case
    const mappedTestCases = (contestCoding?.sample_inputs_outputs || []).map(tc => ({
      ...tc,
      expected_output: tc.output, // rename output -> expected_output
    }));

    const testCase = testCases.find(tc => tc.is_public === 1) || testCases[0];

    if (!testCase) {
      toast.error("No test cases available");
      setRunning(false);
      return;
    }

    // Add this check at the beginning
    if (!socket.connected) {
      toast.error('Not connected to server. Please wait or refresh the page.');
      return;
    }

    // Execute with just this test case
    socket.emit("execute-code", {
      code,
      language: selectedLanguage,
      testCases: mappedTestCases?.length > 0 ? mappedTestCases : [testCase],
      isSampleRun: true
    });
  }

  const testCode = async () => {
    setTesting(true)
    setTestResults([])
    setConsoleOutput("")
    setError("")

    if (testCases.length === 0) {
      toast.error("No test cases available");
      setTesting(false);
      return;
    }

    // Add this check at the beginning
    if (!socket.connected) {
      toast.error('Not connected to server. Please wait or refresh the page.');
      return;
    }

    // Execute with all test cases
    socket.emit("execute-code", {
      code,
      language: selectedLanguage,
      testCases: testCases,
      isSampleRun: false
    });
  }

  const getFileExtension = (language) => {
    const extensions = {
      python: "py",
      javascript: "js",
      java: "java",
      cpp: "cpp",
      c: "c",
      csharp: "cs",
      go: "go",
      dart: "dart",
      php: "php"
    }
    return extensions[language] || "txt"
  }

  const clearOutput = () => {
    setConsoleOutput("")
    setError("")
  }

  const FullscreenWarningModal = () => {
    const warningsLeft = MAX_FULLSCREEN_WARNINGS - fullscreenExitCount

    const handleReenterClick = async () => {
      if (isReentering) return
      setIsReentering(true)
      try {
        await enterFullscreen()
        setShowFullscreenModal(false)
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
                  This is your final warning! Next exit will auto-submit your code.
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

  // QuizWarningModal Component
  const QuizWarningModal = () => {
    const getModalConfig = () => {
      switch (modalType) {
        case 'manual-submit':
          return {
            icon: <HelpCircle className="w-8 h-8 text-primary" />,
            title: "Submit Code?",
            message: "Are you sure you want to submit your code? Make sure all test cases are passing.",
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
            message: "The time limit has been reached. Your code is being submitted automatically.",
            bgColor: "bg-orange-100",
            textColor: "text-orange-600",
            buttonText: "Submitting your code...",
            showSpinner: true
          }
        case 'tab-change':
          return {
            icon: <AlertTriangle className="w-8 h-8 text-red-600" />,
            title: "Tab Change Detected!",
            message: "You have switched tabs/windows. As per exam rules, your code is being submitted automatically.",
            bgColor: "bg-red-100",
            textColor: "text-red-600",
            buttonText: "Submitting your code...",
            showSpinner: true
          }
        case 'back-button':
          return {
            icon: <AlertTriangle className="w-8 h-8 text-amber-600" />,
            title: "Don't Leave!",
            message: "Are you sure you want to leave? Your progress will be submitted and you won't be able to return to this coding challenge.",
            bgColor: "bg-amber-100",
            textColor: "text-amber-600",
            buttonText: "Stay on Page",
            showSpinner: false,
            showActions: true
          }
        case 'left-early':
          return {
            icon: <AlertTriangle className="w-8 h-8 text-amber-600" />,
            title: "Submitting Code",
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
            message: "You have exceeded the maximum number of fullscreen exits. Your code is being submitted automatically.",
            bgColor: "bg-red-100",
            textColor: "text-red-600",
            buttonText: "Submitting your code...",
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

    const handleLeavePage = () => {
      setShowTimeoutModal(false);
      setModalType(null);
      if (blocker.state === "blocked") {
        blocker.reset?.();
      }
      submitCode(true, 'left-early');
    }

    const handleStayOnPage = () => {
      setShowTimeoutModal(false);
      setModalType(null);
      if (blocker.state === "blocked") {
        blocker.reset?.();
      }
    }

    const handleManualSubmit = () => {
      setShowTimeoutModal(false);
      setModalType(null);
      submitCode(false);
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
                  onClick={modalType === 'manual-submit' ? handleStayOnPage : handleStayOnPage}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  {config.cancelText || "Stay on Page"}
                </button>
                <button
                  onClick={modalType === 'manual-submit' ? handleManualSubmit : handleLeavePage}
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${modalType === 'manual-submit' ? "bg-primary" : "bg-red-600"
                    }`}
                >
                  {modalType === 'manual-submit' ? "Yes, Submit" : "Leave Anyway"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <PrimaryLoader />
      </div>
    )
  }

  if (!contestCoding) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-red-600">Error loading coding challenge</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <ChevronLeft
            className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700"
            onClick={() => navigate(-1)}
          />
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium text-forestGreen">
              {contestCoding.title}
            </span>
            <span className={`px-2 py-1 text-xs rounded ${getDifficultyColor(contestCoding.difficulty_level)}`}>
              {contestCoding.difficulty_level?.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Clock className={`${timeRemaining < 120 ? "text-experience4 font-medium" : "text-leafGreen"} w-4 h-4`} />
            <span className={timeRemaining < 120 ? "sm:text-base text-experience4 font-medium" : "sm:text-base text-leafGreen"}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-53px)]">
        {/* Left Panel */}
        <div className="w-2/5 border-r border-gray-200 flex flex-col">
          <div className="flex border-b border-gray-200">
            {["Problem", "Results"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-all duration-300 ${activeTab === tab
                  ? "text-leafGreen border-leafGreen"
                  : "border-transparent text-gray-500 hover:text-leafGreen/90"
                  }`}
              >
                {tab}
                {tab === "Results" && testResults.length > 0 && (
                  <span
                    className={`ml-2 px-2 py-0.5 text-xs rounded-full ${testResults.every((r) => r.passed) ? "bg-primary text-white" : "bg-experience4 text-white"
                      }`}
                  >
                    {testResults.filter((r) => r.passed).length}/{testResults.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "Problem" && (
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-forestGreen">
                      Problem Statement
                    </h2>
                    <div className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">{contestCoding.problem_statement}</div>
                  </div>

                  {contestCoding.constraints && (
                    <div>
                      <h3 className="text-base font-semibold text-forestGreen">Constraints</h3>
                      <div className="text-sm text-gray-700 whitespace-pre-line">
                        {contestCoding.constraints}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-base text-forestGreen mb-2">Sample Input/Output</h3>
                    <div className="space-y-2">
                      {contestCoding.sample_inputs_outputs?.map((sample, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 p-4 rounded-lg font-mono text-sm border border-gray-200"
                        >
                          {sample.input && <>
                            <div className="mb-1">
                              <span className="text-forestGreen font-semibold">Input:</span>
                            </div>
                            <pre className="mb-3 text-gray-700 bg-white p-2 rounded border text-sm">
                              {sample.input}
                            </pre>
                          </>}

                          <div className="mb-1">
                            <span className="text-forestGreen font-semibold">Output:</span>
                          </div>
                          <pre className="bg-white text-gray-700 p-2 rounded border text-sm">
                            {sample.output}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* <div>
                    <h3 className="font-semibold text-base text-forestGreen">Test Cases</h3>
                    <div className="space-y-2">
                      {testCases.map((tc, index) => (
                        <div key={tc.id} className="flex items-center gap-2 text-sm">
                          <span className={`w-2 h-2 rounded-full ${tc.is_public ? 'bg-green-500' : 'bg-yellow-500'}`} />
                          <span>Test Case {index + 1}</span>
                          {tc.is_public ?
                            <span className="text-xs text-green-600">(Public)</span> :
                            <span className="text-xs text-yellow-600">(Private)</span>
                          }
                        </div>
                      ))}
                    </div>
                  </div> */}

                  {/* <div className="text-sm text-gray-500 border-t pt-4">
                    <div className="flex justify-between">
                      <span>Time Limit: {contestCoding.time_limit_seconds} seconds</span>
                      <span>Memory Limit: {contestCoding.memory_limit_mb} MB</span>
                    </div>
                  </div> */}
                </div>
              </div>
            )}

            {activeTab === "Results" && (
              <div className="p-4">
                <h3 className="text-base font-semibold text-forestGreen">
                  Test Results
                </h3>
                {testResults.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">Run tests to see results</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-l-4 transition-all duration-300 ${result.passed
                          ? "border-primary bg-gradient-to-r from-indigo-50 to-purple-50"
                          : "border-experience4 bg-gradient-to-r from-red-50 to-pink-50"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          {result.passed ? (
                            <CheckCircle className="w-5 h-5 text-leafGreen" />
                          ) : (
                            <XCircle className="w-5 h-5 text-experience4" />
                          )}
                          <span className="font-medium">
                            Test Case {index + 1} {result.passed ? "Passed" : "Failed"}
                            {result.isPublic && <span className="ml-2 text-xs text-leafGreen">(Public)</span>}
                          </span>
                        </div>
                        {result.isPublic &&
                          <div className="text-sm space-y-1 mt-2">
                            {result?.input && <div>
                              <strong>Input:</strong>
                              <pre className="bg-white px-2 py-1 rounded">{result.input}</pre>
                            </div>}
                            <div>
                              <strong>Output:</strong>
                              <pre className="bg-white px-2 py-1 rounded">{result.actual}</pre>
                            </div>
                            <div>
                              <strong>Correct:</strong>{" "}
                              <pre className="bg-white px-2 py-1 rounded">{result.expected}</pre>
                            </div>
                            {result.error && (
                              <div className="text-experience4">
                                <strong>Error:</strong> {result.error}
                              </div>
                            )}
                          </div>
                        }
                      </div>
                    ))}

                    {/* Summary */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-forestGreen">Total Tests: {testResults.length}</span>
                        <span className="text-primary">Passed: {testResults.filter(r => r.passed).length}</span>
                        <span className="text-experience4">Failed: {testResults.filter(r => !r.passed).length}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Output" && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                    Console Output
                  </h3>
                  <button
                    onClick={clearOutput}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                    {error}
                  </div>
                )}
                <pre className="bg-gray-50 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap min-h-[200px]">
                  {consoleOutput || "No output yet. Run your code to see results."}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="w-3/5 text-white font-mono text-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-200 p-2">
            <div className="flex items-center gap-3">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-white text-black px-3 py-1 rounded text-sm border border-gray-600 focus:border-indigo-500"
              >
                {contestCoding.allowed_languages?.map((lang) => (
                  <option key={lang} value={lang}>
                    {availableLanguages.find((l) => l.value === lang)?.label || lang}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={runCode}
                disabled={running || testing || submitting}
                className="flex items-center gap-1 px-3 py-1 bg-primary hover:bg-leafGreen disabled:bg-gray-600 text-white rounded text-sm transition-all duration-300"
              >
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Run
              </button>
              <button
                onClick={testCode}
                disabled={running || testing || submitting}
                className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded text-sm transition-all duration-300"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Test
              </button>
              <button
                onClick={() => {
                  setModalType('manual-submit');
                  setShowTimeoutModal(true);
                }}
                disabled={!allTestsPassed || submitting || running || testing || submissionInProgress}
                className={`flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 
                  ${(!allTestsPassed || submitting || running || submissionInProgress)
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:from-indigo-700 hover:to-purple-700'
                  } text-white rounded text-sm transition-all duration-300`}
                title={!allTestsPassed ? "Pass all test cases to submit" : ""}
              >
                {submitting || submissionInProgress ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit
              </button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 min-h-0 flex flex-col">
            <CodeEditor
              value={code}
              onChange={setCode}
            // theme="dark"
            />

            {/* Console Panel */}
            {(consoleOutput || error) && (
              <div className="border-t border-gray-700 bg-black">

                {/* Console Header */}
                <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-700 flex justify-between items-center">
                  <span className="font-semibold">Console Output</span>
                  <button
                    onClick={clearOutput}
                    className="text-gray-400 hover:text-white text-xs"
                  >
                    Clear
                  </button>
                </div>

                {/* Console Body */}
                <div className="p-2 text-sm max-h-40 overflow-y-auto font-mono">

                  {consoleOutput && (
                    <pre className="whitespace-pre-wrap text-green-400 leading-relaxed">
                      {consoleOutput}
                    </pre>
                  )}

                  {error && (
                    <pre className="whitespace-pre-wrap text-red-400 mt-3 leading-relaxed">
                      Error:
                      {error}
                    </pre>
                  )}

                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showFullscreenModal && <FullscreenWarningModal />}
      {showTimeoutModal && <QuizWarningModal />}
    </div >
  )
}

export default CodingQuizInterface