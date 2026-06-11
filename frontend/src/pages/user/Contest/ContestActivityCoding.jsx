"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation, useParams } from "react-router-dom"
import { Loader2, AlertCircle, Trophy, Clock, Target, BookOpen, Code, XCircle, ChevronRight, Calendar, ArrowLeft, Cpu, HardDrive, Play, CheckSquare, CheckCircle, X, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "react-hot-toast"
import { getStudentToken } from "../../../services/CookieService"
import { slugify } from "../../../utils/slugify"
import { useStartContestActivityMutation } from "../../../services/Contest/userActivityAPI"

import PrimaryLoader from "../../../components/ui/PrimaryLoader"
import { useGetUserContestCodingAttemptsQuery } from "../../../services/Contest/userContestCodingAPI"

// Common Accordion Item Component that handles both quiz and coding attempts
const AttemptAccordionItem = ({ attempt, index, formatDate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Render coding submission details
  const renderCodingContent = () => {
    const meta = attempt.meta;
    const passedTests = meta?.passed_test_cases || 0;
    const totalTests = meta?.total_test_cases || 0;
    const passPercentage = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    return (
      <>
        {/* Code Submission Section */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Code className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            <h4 className="text-sm sm:text-md font-bold text-gray-800">Submitted Code</h4>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {meta?.language || 'Unknown'}
            </span>
          </div>
          <pre className="bg-gray-900 text-gray-100 p-3 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm font-mono border border-gray-700">
            <code>{meta?.submitted_code || 'No code submitted'}</code>
          </pre>
        </div>

        {/* Test Cases Summary */}
        <div className="mb-4 sm:mb-6">
          <h4 className="text-sm sm:text-md font-bold text-gray-800 mb-3">Test Cases Summary</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="text-gray-500 text-xs uppercase font-semibold block mb-1">Total Tests</span>
              <span className="text-xl sm:text-2xl font-bold text-gray-800">{totalTests}</span>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <span className="text-green-600 text-xs uppercase font-semibold block mb-1">Passed</span>
              <span className="text-xl sm:text-2xl font-bold text-green-700">{passedTests}</span>
            </div>
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <span className="text-red-600 text-xs uppercase font-semibold block mb-1">Failed</span>
              <span className="text-xl sm:text-2xl font-bold text-red-700">{totalTests - passedTests}</span>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <span className="text-blue-600 text-xs uppercase font-semibold block mb-1">Success Rate</span>
              <span className="text-xl sm:text-2xl font-bold text-blue-700">{passPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Test Case Details */}
        <div>
          <h4 className="text-sm sm:text-md font-bold text-gray-800 mb-3">Test Case Details</h4>
          <div className="space-y-3">
            {meta?.test_case_details?.map((testCase, idx) => (
              <div
                key={idx}
                className={`border rounded-lg p-3 sm:p-4 ${testCase.passed
                  ? 'border-green-200 bg-green-50/30'
                  : 'border-red-200 bg-red-50/30'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">Test Case #{idx + 1}</span>
                    {testCase.passed ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Passed</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">Failed</span>
                    )}
                  </div>
                  {testCase.passed ? (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-500 font-medium block mb-1">Input:</span>
                      <pre className="bg-gray-800 text-gray-100 p-2 rounded-md overflow-x-auto font-mono text-xs">
                        {testCase.input || 'No input'}
                      </pre>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block mb-1">Expected Output:</span>
                      <pre className="bg-gray-800 text-green-400 p-2 rounded-md overflow-x-auto font-mono text-xs">
                        {testCase.expected_output || 'No output'}
                      </pre>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-500 font-medium block mb-1">Actual Output:</span>
                      <pre className={`p-2 rounded-md overflow-x-auto font-mono text-xs ${testCase.passed
                        ? 'bg-primary/20 text-forestGreen border border-green-200'
                        : 'bg-experience1/20 text-experience4 border border-red-200'
                        }`}>
                        {testCase.actual_output || 'No output'}
                      </pre>
                    </div>
                    {testCase.error && (
                      <div>
                        <span className="text-gray-500 font-medium block mb-1">Error:</span>
                        <pre className="bg-red-900/20 text-red-400 p-2 rounded-md overflow-x-auto font-mono text-xs border border-red-200">
                          {testCase.error}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  const submissionReasonLabels = {
    "manual": "User Submitted",
    "tab-change": "Tab Switched",
    "fullscreen-exceeded": "Fullscreen Exited",
    "left-early": "Submitted Early",
    "timeout": "Time Limit Reached"
  };

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden transition-all duration-200 bg-white">
      {/* Attempt Header - Clickable for Accordion */}
      <div
        className="bg-gray-50 p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-forestGreen">
              Coding Attempt
            </h3>
            <span
              className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-bold uppercase tracking-wide ${attempt.status === "completed"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
                }`}
            >
              {attempt.status}
            </span>
            {attempt.meta?.language && (
              <span className="px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-700">
                {attempt.meta.language}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <ChevronDown className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-sm">
          <div>
            <span className="text-gray-500 block text-xs uppercase font-semibold mb-1">
              Score/Passed
            </span>
            <span className="font-bold text-gray-800 text-sm sm:text-base">
              {attempt.meta?.passed_test_cases || 0}/{attempt.meta?.total_test_cases || 0}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block text-xs uppercase font-semibold mb-1">
              Success Rate
            </span>
            <span className="font-bold text-gray-800 text-sm sm:text-base">
              {attempt.meta?.total_test_cases
                ? Math.round((attempt.meta.passed_test_cases / attempt.meta.total_test_cases) * 100)
                : 0}%
            </span>
          </div>
          <div>
            <span className="text-gray-500 block text-xs uppercase font-semibold mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Time Taken
            </span>
            <span className="font-bold text-gray-800 text-sm sm:text-base">{attempt.time_taken_seconds}s</span>
          </div>
          <div>
            <span className="text-gray-500 block text-xs uppercase font-semibold mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Submitted
            </span>
            <span className="font-bold text-gray-800 text-xs sm:text-sm truncate">{formatDate(attempt.submitted_at)}</span>
          </div>
        </div>

        {attempt.meta?.submission_reason && (
          <div className="mt-2 text-xs text-gray-500">
            <span className="font-medium">Submission reason:</span>{" "}
            {submissionReasonLabels[attempt.meta?.submission_reason] || "Submitted"}
          </div>
        )}
      </div>

      {/* Accordion Body */}
      {isExpanded && (
        <div className="p-3 sm:p-4 bg-white animate-in slide-in-from-top-2 duration-200">
          {renderCodingContent()}
        </div>
      )}
    </div>
  )
}

// Main Modal Component
const AttemptsModal = ({ isOpen, onClose, codingId, accessToken, title }) => {

  const {
    data: attemptsData,
    isLoading,
    error,
  } = useGetUserContestCodingAttemptsQuery({ coding_id: codingId, access_token: accessToken }, { skip: !isOpen || !codingId })

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl sm:rounded-xl shadow-2xl border border-gray-100 w-full max-w-4xl max-h-[90vh] sm:max-h-[90vh] overflow-hidden flex flex-col mx-2 sm:mx-0">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-3 sm:p-5 border-b border-gray-100 bg-white z-10">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-forestGreen flex items-center gap-2 truncate">
              <Code className="w-5 h-5" />
              Coding Attempts
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 sm:p-2 rounded-full transition-colors ml-2 flex-shrink-0"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto p-3 sm:p-6 bg-gray-50/30 flex-1">
          {isLoading && (
            <div className="flex items-center justify-center p-4 sm:p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forestGreen"></div>
              <span className="ml-2 text-gray-600 font-medium text-sm sm:text-base">Loading attempts...</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center p-4 sm:p-8 text-red-600">
              <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 mb-2" />
              <span className="font-medium text-sm sm:text-base">Failed to load attempts</span>
            </div>
          )}

          {attemptsData?.success && attemptsData?.attempts && (
            <div>
              {attemptsData.attempts.length === 0 ? (
                <div className="text-center py-6 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">No Attempts Yet</h3>
                  <p className="text-gray-500 text-sm sm:text-base px-2">
                    You haven't attempted this coding challenge yet. Give it a shot!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {attemptsData.attempts.map((attempt, attemptIndex) => (
                    <AttemptAccordionItem
                      key={attempt.id}
                      attempt={attempt}
                      index={attemptIndex}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CodingActivityPage() {
  const { access_token } = getStudentToken()
  const navigate = useNavigate()
  const { contest_id, activity_id } = useLocation().state
  const { activitySlug, contestSlug } = useParams();

  const [contest, setContest] = useState(null)
  const [activity, setActivity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [attemptsModal, setAttemptsModal] = useState({
    isOpen: false,
    codingId: null,
    codingTitle: "",
  })

  const [startContestActivity] = useStartContestActivityMutation()

  const fetchContestActivity = async (activity_id) => {
    try {
      const { data: activityData } = await startContestActivity({ contest_id, activity_id, access_token })

      if (activityData?.success && activityData?.contestActivity) {
        setActivity(activityData.contestActivity)
        if (activityData.contest) {
          setContest(activityData.contest)
        }
      }
    } catch (error) {
      console.error("Error fetching contest activity:", error)
      toast.error("Failed to load coding challenge")
    } finally {
      setLoading(false)
    }
  }

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!activity_id || hasFetchedRef.current) return;

    hasFetchedRef.current = true;
    fetchContestActivity(activity_id);
  }, [activity_id]);

  const handleCodingClick = (coding) => {
    try {
      navigate(`/contests/${contestSlug || slugify(contest?.title || "contest")}/coding/${slugify(coding.title || "challenge")}/solve`, {
        state: {
          contest_id,
          coding_id: coding.id,
          user_activity_id: activity.user_activity_id,
          coding_data: coding // Pass the full coding data
        },
      })
    } catch (error) {
      console.error("Failed to navigate to coding challenge:", error)
      toast.error("Failed to start coding challenge")
    }
  }

  const handleViewAttempts = (coding, event) => {
    event.stopPropagation()
    setAttemptsModal({
      isOpen: true,
      codingId: coding.id,
      codingTitle: coding.title,
    })
  }

  const closeAttemptsModal = () => {
    setAttemptsModal({
      isOpen: false,
      codingId: null,
      codingTitle: "",
    })
  }

  const formatTime = (seconds) => {
    if (!seconds) return "No limit";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <PrimaryLoader />
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 mb-3 sm:mb-4" />
        <h3 className="text-lg sm:text-xl font-bold">Activity Not Found</h3>
        <p className="text-gray-600 text-sm sm:text-base mt-2">This activity doesn't exist or you don't have access to it.</p>
      </div>
    )
  }

  const totalCodings = activity.codings?.length || 0;
  const completedCodings = activity?.completed_codings_count || 0;
  const progressPercentage = totalCodings > 0 ? (completedCodings / totalCodings) * 100 : 0

  return (
    <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
      {/* Activity Header */}
      <div className="mb-4 sm:mb-6 relative">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-0 left-0 flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-forestGreen bg-white border border-gray-200 rounded-md z-10"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          Back
        </button>

        {/* Title and Description */}
        <div className="text-center pt-6 sm:pt-8 px-2 sm:px-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold my-2 text-forestGreen px-2 sm:px-0">
            {activity.title}
          </h1>
          {activity.description && (
            <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto px-2 sm:px-0">
              {activity.description}
            </p>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-10">
        {/* 1. Completion Card */}
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 flex items-center">
          <div className="relative w-12 h-12 sm:w-16 sm:h-16 mr-3 sm:mr-4 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="42%"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                className="text-gray-100"
              />
              <circle
                cx="50%"
                cy="50%"
                r="42%"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={175.93}
                strokeDashoffset={175.93 - (progressPercentage / 100) * 175.93}
                className="text-green-500 transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
              {Math.round(progressPercentage)}%
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1 truncate">Completion</div>
            <div className="font-bold text-gray-900 text-xs sm:text-sm truncate">
              {completedCodings} of {totalCodings} Challenges
            </div>
          </div>
        </div>

        {/* 2. Current Score */}
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 flex items-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600 mr-3 sm:mr-4 flex-shrink-0">
            <Code className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1 truncate">Current Score</div>
            <div className="font-bold text-forestGreen text-sm sm:text-lg">
              {activity.score} <span className="text-xs font-normal text-gray-400">pts</span>
            </div>
          </div>
        </div>

        {/* 3. Difficulty */}
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 flex items-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 mr-3 sm:mr-4 flex-shrink-0">
            <Target className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1 truncate">Difficulty</div>
            <div className="font-bold text-gray-900 text-sm sm:text-lg capitalize truncate">{activity.difficulty}</div>
          </div>
        </div>

        {/* 4. Rewards */}
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 flex items-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600 mr-3 sm:mr-4 flex-shrink-0">
            <Trophy className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1 truncate">Rewards</div>
            <div className="font-bold text-forestGreen text-sm sm:text-lg">
              {activity.points_reward} <span className="text-xs font-normal text-gray-400">pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Coding Challenges Section */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-forestGreen truncate">
              Coding Challenges
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-1 truncate">
              Solve programming challenges and test your skills.
            </p>
          </div>
        </div>

        {/* Coding Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {activity.codings?.map((coding, index) => {
            const isMaxAttemptsReached = coding?.max_attempts > 0 && coding?.attempt_count >= coding?.max_attempts;

            return (
              <div
                key={coding.id}
                className="bg-white border border-gray-200 rounded-lg sm:rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Card Header - Always Visible */}
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-base sm:text-lg md:text-xl text-gray-900 flex-1 pr-2 truncate">
                      {coding?.title || `Coding Challenge #${index + 1}`}
                    </h3>
                    <div className="flex-shrink-0">
                      {isMaxAttemptsReached && (
                        <span className="mr-2 text-red-500 text-xs font-medium border border-red-500 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 font-bold bg-red-500/10 w-fit">
                          Attempts Exhausted
                        </span>
                      )}
                      {coding.is_completed ? (
                        <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-bold bg-green-100 text-primary uppercase tracking-wide border border-primary">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          <span className="hidden sm:inline">Completed</span>
                          <span className="sm:hidden">Done</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-500 uppercase tracking-wide">
                          Level {String(index + 1).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {coding.problem_statement && (
                      <p className="text-gray-500 text-xs sm:text-sm leading-relaxed line-clamp-2 flex-1">
                        {coding.problem_statement}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between mt-auto pt-3 sm:pt-4 border-t border-gray-50 gap-3 sm:gap-4">
                    {/* Meta Icons */}
                    <div className="flex flex-wrap gap-2 sm:gap-3 text-xs font-medium text-gray-500">
                      {coding.time_limit_seconds && (
                        <div className="flex items-center" title="Time Limit">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 text-gray-400" />
                          <span className="hidden xs:inline">{formatTime(coding.time_limit_seconds)}</span>
                          <span className="xs:hidden">{coding.time_limit_seconds}s</span>
                        </div>
                      )}
                      <div className="flex items-center text-green-600" title="Points">
                        <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 text-green-500" />
                        <span className="hidden xs:inline">{coding.points_reward} Pts</span>
                        <span className="xs:hidden">{coding.points_reward}</span>
                      </div>
                      <div className="flex items-center" title="Attempts Used">
                        <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 text-gray-400" />
                        <span className="hidden xs:inline">{coding.attempt_count || 0}/{coding.max_attempts || "∞"}</span>
                        <span className="xs:hidden">{coding.attempt_count || 0}</span>
                      </div>
                      <div className="flex items-center" title="Code Languages">
                        <Code className="w-3 h-3 mr-1" />
                        {coding.allowed_languages?.join(", ")}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3">
                      <button
                        onClick={(e) => handleViewAttempts(coding, e)}
                        className="text-xs sm:text-sm font-semibold text-green-600 whitespace-nowrap px-2 py-1.5 sm:px-0 sm:py-0"
                      >
                        View Attempts
                      </button>
                      <button
                        disabled={isMaxAttemptsReached}
                        onClick={() => handleCodingClick(coding)}
                        className={`px-4 py-2 sm:px-5 sm:py-2 rounded-md text-xs sm:text-sm font-bold text-white shadow-sm transition-all transform active:scale-95 flex justify-center items-center ${isMaxAttemptsReached
                          ? 'bg-gray-400 cursor-not-allowed'
                          : coding.is_completed
                            ? 'bg-gray-800'
                            : 'bg-green-500'
                          }`}
                      >
                        Solve
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {(!activity.codings || activity.codings.length === 0) && (
          <div className="bg-white rounded-md border border-gray-200 p-6 sm:p-8 md:p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 mb-3 sm:mb-4">
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg md:text-lg font-medium text-gray-900 mb-2">No Coding Challenges Available</h3>
            <p className="text-gray-500 text-sm sm:text-base max-w-sm mx-auto">
              There are no coding challenges available for this contest activity at the moment.
            </p>
          </div>
        )}
      </div>
      {/* AttemptsModal Component */}
      <AttemptsModal
        isOpen={attemptsModal.isOpen}
        onClose={closeAttemptsModal}
        codingId={attemptsModal.codingId}
        title={attemptsModal.codingTitle}
        accessToken={access_token}
      />
    </div>
  )
}