"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation, useNavigationType } from "react-router-dom"
import { Loader2, AlertCircle, Trophy, Clock, Target, BookOpen, Play, Eye, X, CheckCircle, XCircle, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react"
import { toast } from "react-hot-toast"
import QuizResultAnimation from "../../../components/ui/animated-celebration"
import { getStudentToken } from "../../../services/CookieService"
import { slugify } from "../../../utils/slugify"
import { useStartContestActivityMutation } from "../../../services/Contest/userActivityAPI"
import { useGetUserContestQuizAttemptsQuery } from "../../../services/Contest/userContestQuizAPI"

import PrimaryLoader from "../../../components/ui/PrimaryLoader"
import { useRef } from "react"

const AttemptAccordionItem = ({ attempt, index, formatDate, convertToBoolean }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="border border-gray-200 rounded-md overflow-hidden transition-all duration-200 bg-white">
            {/* Attempt Header - Clickable for Accordion */}
            <div
                className="bg-gray-50 p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-semibold text-forestGreen">Attempt #{attempt.attempt_number}</h3>
                        <span
                            className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-bold uppercase tracking-wide ${attempt.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                                }`}
                        >
                            {attempt.status}
                        </span>
                    </div>
                    {isExpanded ? <ChevronUp className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronDown className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-sm">
                    <div>
                        <span className="text-gray-500 block text-xs uppercase font-semibold mb-1">Score</span>
                        <span className="font-bold text-gray-800 text-sm sm:text-base">{attempt.score}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block text-xs uppercase font-semibold mb-1">Percentage</span>
                        <span className="font-bold text-gray-800 text-sm sm:text-base">{attempt.percentage}%</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block text-xs uppercase font-semibold mb-1">Time Taken</span>
                        <span className="font-bold text-gray-800 text-sm sm:text-base">{attempt.time_taken_seconds}s</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block text-xs uppercase font-semibold mb-1">Submitted</span>
                        <span className="font-bold text-gray-800 text-xs sm:text-sm truncate">{formatDate(attempt.submitted_at)}</span>
                    </div>
                </div>
            </div>

            {/* Questions and Answers - Accordion Body */}
            {isExpanded && (
                <div className="p-3 sm:p-4 bg-white animate-in slide-in-from-top-2 duration-200">
                    <h4 className="text-sm sm:text-md font-bold text-gray-800 mb-3 sm:mb-4 border-b pb-2">Questions & Answers</h4>

                    {attempt.meta && attempt.meta.length > 0 ? (
                        <div className="space-y-3 sm:space-y-4">
                            {attempt.meta.map((questionData, questionIndex) => {
                                const isCorrect = convertToBoolean(questionData.isCorrect)
                                return (
                                    <div key={questionData.question_id} className="border border-gray-100 rounded-lg p-3 sm:p-4 bg-gray-50/50">
                                        <div className="flex items-start justify-between mb-2 sm:mb-3">
                                            <h5 className="text-xs sm:text-sm font-medium text-gray-900 flex-1 leading-relaxed">
                                                <span className="font-bold text-gray-500 mr-2">Q{questionIndex + 1}:</span>
                                                {questionData.question_text_stored}
                                            </h5>
                                            <div className="flex items-center ml-2 sm:ml-4 flex-shrink-0">
                                                {isCorrect ? (
                                                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm mt-2 sm:mt-3">
                                            <div>
                                                <span className="text-gray-500 text-xs font-bold uppercase tracking-wide block mb-1">Your Answer:</span>
                                                <div
                                                    className={`p-2 sm:p-2.5 rounded-md text-xs sm:text-sm font-medium ${isCorrect
                                                        ? "bg-green-50 text-green-700 border border-green-200"
                                                        : "bg-red-50 text-red-700 border border-red-200"
                                                        }`}
                                                >
                                                    {questionData?.question_type === "true-false"
                                                        ? convertToBoolean(questionData?.userAnswer)
                                                            ? "True"
                                                            : "False"
                                                        : questionData.userAnswer || "No Answer"}
                                                </div>
                                            </div>

                                            {questionData.correctAnswer !== undefined &&
                                                questionData.correctAnswer !== null && (
                                                    <div>
                                                        <span className="text-gray-500 text-xs font-bold uppercase tracking-wide block mb-1">Correct Answer:</span>
                                                        <div className="p-2 sm:p-2.5 rounded-md bg-green-50 text-green-700 border border-green-200 text-xs sm:text-sm font-medium">
                                                            {questionData?.question_type === "true-false"
                                                                ? convertToBoolean(questionData?.correctAnswer)
                                                                    ? "True"
                                                                    : "False"
                                                                : Array.isArray(questionData.correctAnswer) ? questionData.correctAnswer.join(", ") : questionData.correctAnswer}
                                                        </div>
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-xs sm:text-sm italic">No questions details available for this attempt.</p>
                    )}
                </div>
            )}
        </div>
    )
}

const QuizAttemptsModal = ({ isOpen, onClose, quizId, quizTitle, accessToken }) => {
    const {
        data: attemptsData,
        isLoading,
        error,
    } = useGetUserContestQuizAttemptsQuery({ quiz_id: quizId, access_token: accessToken }, { skip: !isOpen || !quizId })

    const convertToBoolean = (value) => {
        if (value === 1 || value === "1" || value === true) return true
        if (value === 0 || value === "0" || value === false) return false
        return value
    }

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
                            Quiz Attempts
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{quizTitle}</p>
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
                            <PrimaryLoader />
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
                                    <p className="text-gray-500 text-sm sm:text-base px-2">You haven't attempted this quiz yet. Give it a shot!</p>
                                </div>
                            ) : (
                                <div className="space-y-3 sm:space-y-4">
                                    {attemptsData.attempts.map((attempt, attemptIndex) => (
                                        <AttemptAccordionItem
                                            key={attempt.id}
                                            attempt={attempt}
                                            index={attemptIndex}
                                            formatDate={formatDate}
                                            convertToBoolean={convertToBoolean}
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

export default function QuizActivityPage() {
    const { access_token } = getStudentToken()
    const navigate = useNavigate()
    const navType = useNavigationType()

    const { contest_id, activity_id } = useLocation().state
    const [contest, setContest] = useState(null)
    const [activity, setActivity] = useState(null)
    const [loading, setLoading] = useState(true)

    const [showResult, setShowResult] = useState(false)
    const [resultType, setResultType] = useState("success")
    const [resultMessage, setResultMessage] = useState("")

    const [attemptsModal, setAttemptsModal] = useState({
        isOpen: false,
        quizId: null,
        quizTitle: "",
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

    const handleQuizClick = async (quiz) => {
        try {

            if (quiz.max_attempts > 0 && quiz.attempt_count >= quiz.max_attempts) {
                toast.error("Max Attempt Reached");
                return;
            }
            navigate(`/contests/${slugify(contest?.title || "contest")}/quiz/${slugify(quiz.title)}/start`, {
                state: { contest_id, quiz_id: quiz.id, user_activity_id: activity.user_activity_id },
            })
        } catch (error) {
            console.error("Failed to navigate to quiz:", error)
            toast.error("Failed to start quiz")
        }
    }

    const handleViewAttempts = (quiz, event) => {
        event.stopPropagation()
        setAttemptsModal({
            isOpen: true,
            quizId: quiz.id,
            quizTitle: quiz.title,
        })
    }

    const closeAttemptsModal = () => {
        setAttemptsModal({
            isOpen: false,
            quizId: null,
            quizTitle: "",
        })
    }

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

    const totalQuizzes = activity.quizzes?.length || 0;
    const completedQuizzes = activity?.completed_quizzes_count;
    const progressPercentage = totalQuizzes > 0 ? (completedQuizzes / totalQuizzes) * 100 : 0

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
                    {activity.description && <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto px-2 sm:px-0">{activity.description}</p>}
                </div>
            </div>

            {/* Premium Stats Row - Responsive for all screen sizes */}
            <div className="grid grid-cols-1 [@media(min-width:385px)]:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8 md:mb-10">                {/* 1. Completion Card (Circular Progress) */}
                <div className="bg-white rounded-lg sm:rounded-xl border border-gray-100 shadow-sm p-2.5 sm:p-3 md:p-4 flex items-center gap-2 sm:gap-3 md:gap-4">
                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 flex-shrink-0">
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
                        <div className="absolute inset-0 flex items-center justify-center text-[9px] sm:text-[10px] md:text-xs font-bold text-gray-700">
                            {Math.round(progressPercentage)}%
                        </div>
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 uppercase tracking-wider font-semibold mb-0.5 sm:mb-1 truncate">Completion</div>
                        <div className="font-bold text-gray-900 text-[10px] sm:text-xs md:text-sm truncate">{completedQuizzes} of {totalQuizzes} Quizzes</div>
                    </div>
                </div>

                {/* 2. Current Score */}
                <div className="bg-white rounded-lg sm:rounded-xl border border-gray-100 shadow-sm p-2.5 sm:p-3 md:p-4 flex items-center gap-2 sm:gap-3 md:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                        <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-6 md:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 uppercase tracking-wider font-semibold mb-0.5 sm:mb-1 truncate">Current Score</div>
                        <div className="font-bold text-forestGreen text-xs sm:text-sm md:text-lg leading-tight">
                            {activity.score} <span className="text-[9px] sm:text-[10px] md:text-xs font-normal text-gray-400">pts</span>
                        </div>
                    </div>
                </div>

                {/* 3. Difficulty */}
                <div className="bg-white rounded-lg sm:rounded-xl border border-gray-100 shadow-sm p-2.5 sm:p-3 md:p-4 flex items-center gap-2 sm:gap-3 md:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 flex-shrink-0">
                        <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-6 md:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 uppercase tracking-wider font-semibold mb-0.5 sm:mb-1 truncate">Difficulty</div>
                        <div className="font-bold text-gray-900 text-xs sm:text-sm md:text-lg capitalize truncate">{activity.difficulty}</div>
                    </div>
                </div>

                {/* 4. Rewards */}
                <div className="bg-white rounded-lg sm:rounded-xl border border-gray-100 shadow-sm p-2.5 sm:p-3 md:p-4 flex items-center gap-2 sm:gap-3 md:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                        <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-6 md:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 uppercase tracking-wider font-semibold mb-0.5 sm:mb-1 truncate">Rewards</div>
                        <div className="font-bold text-forestGreen text-xs sm:text-sm md:text-lg leading-tight">
                            {activity.points_reward} <span className="text-[9px] sm:text-[10px] md:text-xs font-normal text-gray-400">pts</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-forestGreen truncate">
                            Active Quiz Modules
                        </h2>
                        <p className="text-gray-500 text-xs sm:text-sm mt-1 truncate">
                            Select an assessment to begin or review your previous attempts.
                        </p>
                    </div>
                </div>

                {/* Premium Quiz Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {activity.quizzes?.map((quiz, index) => {
                        // Helper to format time
                        const formatTime = (seconds) => {
                            if (!seconds) return "";
                            const h = Math.floor(seconds / 3600);
                            const m = Math.floor((seconds % 3600) / 60);
                            const s = seconds % 60;

                            if (h > 0) return `${h}h ${m}m`;
                            if (m > 0) return `${m}m`;
                            return `${s}s`;
                        };

                        const isMaxAttemptsReached = quiz.max_attempts > 0 && quiz.attempt_count >= quiz.max_attempts;

                        return (
                            <div
                                key={quiz.id}
                                className={`bg-white border rounded-lg sm:rounded-xl p-4 sm:p-6 flex flex-col justify-between h-full ${quiz.is_completed
                                    ? 'border-green-100'
                                    : 'border-gray-200'
                                    }`}
                            >
                                {/* Card Header */}
                                <div className="mb-3 sm:mb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-base sm:text-lg md:text-xl text-gray-900 flex-1 pr-2 truncate">
                                            {quiz.title}
                                        </h3>
                                        <div className="flex-shrink-0">
                                            {quiz.is_completed ? (
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
                                        {quiz.description && (
                                            <p className="text-gray-500 text-xs sm:text-sm leading-relaxed line-clamp-2 flex-1">
                                                {quiz.description}
                                            </p>
                                        )}
                                        {isMaxAttemptsReached && (
                                            <span className="text-red-500 text-xs font-medium border border-red-500 rounded-full px-2 py-1 bg-red-500/10 w-fit">
                                                Max Attempts
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Card Footer: Meta + Actions */}
                                <div className="flex flex-col sm:flex-row justify-between mt-auto pt-3 sm:pt-4 border-t border-gray-50 gap-3 sm:gap-4">
                                    {/* Meta Icons */}
                                    <div className="flex flex-wrap gap-2 sm:gap-3 text-xs font-medium text-gray-500">
                                        {quiz.time_limit_seconds && (
                                            <div className="flex items-center" title="Time Limit">
                                                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 text-gray-400" />
                                                <span className="hidden xs:inline">{formatTime(quiz.time_limit_seconds)}</span>
                                                <span className="xs:hidden">{quiz.time_limit_seconds}s</span>
                                            </div>
                                        )}
                                        <div className="flex items-center text-green-600" title="Points">
                                            <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 text-green-500" />
                                            <span className="hidden xs:inline">{quiz.points_reward} Pts</span>
                                            <span className="xs:hidden">{quiz.points_reward}</span>
                                        </div>
                                        <div className="flex items-center" title="Pass Percentage">
                                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 text-gray-400" />
                                            <span className="hidden xs:inline">{quiz.qualify_percentage}%</span>
                                            <span className="xs:hidden">{quiz.qualify_percentage}%</span>
                                        </div>
                                        <div className="flex items-center" title="Attempts Used">
                                            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 text-gray-400" />
                                            <span className="hidden xs:inline">{quiz.attempt_count || 0}/{quiz.max_attempts || "∞"}</span>
                                            <span className="xs:hidden">{quiz.attempt_count || 0}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3">
                                        <button
                                            onClick={(e) => handleViewAttempts(quiz, e)}
                                            className="text-xs sm:text-sm font-semibold text-green-600 whitespace-nowrap px-2 py-1.5 sm:px-0 sm:py-0"
                                        >
                                            View Attempts
                                        </button>
                                        <button
                                            disabled={isMaxAttemptsReached}
                                            onClick={() => handleQuizClick(quiz)}
                                            className={`px-4 py-2 sm:px-5 sm:py-2 rounded-md text-xs sm:text-sm font-bold text-white shadow-sm transition-all transform active:scale-95 flex justify-center items-center ${isMaxAttemptsReached
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : quiz.is_completed
                                                    ? 'bg-gray-800'
                                                    : 'bg-green-500'
                                                }`}
                                        >
                                            {quiz.is_completed ? "Re-attempt" : "Start"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {(!activity.quizzes || activity.quizzes.length === 0) && (
                    <div className="bg-white rounded-md border border-gray-200 p-6 sm:p-8 md:p-12 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 mb-3 sm:mb-4">
                            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                        </div>
                        <h3 className="text-base sm:text-lg md:text-lg font-medium text-gray-900 mb-2">No Quizzes Available</h3>
                        <p className="text-gray-500 text-sm sm:text-base max-w-sm mx-auto">
                            There are no quizzes available for this contest activity at the moment.
                        </p>
                    </div>
                )}
            </div>

            {showResult && (
                <QuizResultAnimation type={resultType} onClose={() => setShowResult(false)} message={resultMessage} />
            )}

            {/* QuizAttemptsModal Component */}
            <QuizAttemptsModal
                isOpen={attemptsModal.isOpen}
                onClose={closeAttemptsModal}
                quizId={attemptsModal.quizId}
                quizTitle={attemptsModal.quizTitle}
                accessToken={access_token}
            />
        </div>
    )
}