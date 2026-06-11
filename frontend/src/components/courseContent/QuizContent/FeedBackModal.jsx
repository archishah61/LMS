/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
"use client"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useGenerateFeedbackMutation } from "../../../services/Ai_performace_tracking/performanceTrackingApi"
import {
    useGetModuleFeedbackHistoryQuery,
    useGetFeedbackByIdQuery,
} from "../../../services/Ai_performace_tracking/performanceFeedbackApi"
import {
    AlertTriangle,
    BookOpen,
    Clock,
    RefreshCcw,
    History,
    TrendingUp,
    TrendingDown,
    Target,
    CheckCircle,
    X,
    ChevronDown,
    Sparkles,
    Award,
    BarChart3,
} from "lucide-react"
import { format } from "date-fns"
import { getStudentToken } from "../../../services/CookieService"

export default function FeedbackModal({ userId, moduleId, isOpen, onClose, isAutoGenerating = false }) {
    const access_token = getStudentToken()?.access_token

    const [activeTab, setActiveTab] = useState("topics")
    const [openAccordions, setOpenAccordions] = useState({})
    const [showHistory, setShowHistory] = useState(false)
    const [selectedFeedbackId, setSelectedFeedbackId] = useState(null)
    const [latestFeedbackId, setLatestFeedbackId] = useState(null)
    const modalRef = useRef(null)
    const [isGenerating, setIsGenerating] = useState(false)

    // API query parameters memoized to prevent unnecessary API calls
    const queryParams = useMemo(
        () => ({
            userId,
            moduleId,
            access_token,
        }),
        [userId, moduleId, access_token],
    )

    const shouldSkipQueries = useMemo(() => {
        return !isOpen || !userId || !moduleId || !access_token
    }, [isOpen, userId, moduleId, access_token])

    // Get feedback history only - never automatically generate feedback
    const {
        data: feedbackHistory,
        isLoading: historyLoading,
        refetch: refetchHistory,
        error: historyError,
    } = useGetModuleFeedbackHistoryQuery(queryParams, { skip: shouldSkipQueries })

    // Generate feedback mutation - will be triggered explicitly by user action
    const [generateFeedback, { data, error, isLoading: isGeneratingFeedback }] = useGenerateFeedbackMutation()

    // Get specific feedback by ID when viewing history or latest feedback
    const { data: historicalFeedback, isLoading: historicalFeedbackLoading } = useGetFeedbackByIdQuery(
        { feedbackId: selectedFeedbackId || latestFeedbackId, access_token },
        { skip: !(selectedFeedbackId || latestFeedbackId) || !access_token },
    )

    // Find and set latest feedback ID when history data is loaded
    useEffect(() => {
        if (!feedbackHistory) {
            setLatestFeedbackId(null)
            return
        }

        if (feedbackHistory?.data && Array.isArray(feedbackHistory.data)) {
            if (feedbackHistory.data.length > 0) {
                const latest = feedbackHistory.data.find((item) => item.is_current)
                if (latest) {
                    setLatestFeedbackId(latest.id)
                } else {
                    const mostRecent = feedbackHistory.data[0]
                    if (mostRecent) {
                        setLatestFeedbackId(mostRecent.id)
                    } else {
                        setLatestFeedbackId(null)
                    }
                }
            } else {
                setLatestFeedbackId(null)
            }
        } else {
            setLatestFeedbackId(null)
        }
    }, [feedbackHistory])

    // Handle auto-generation state
    useEffect(() => {
        if (isAutoGenerating) {
            setIsGenerating(true);
        } else {
            setIsGenerating(false);
        }
    }, [isAutoGenerating]);

    // Close modal when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isOpen, onClose])

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "auto"
        }
        return () => {
            document.body.style.overflow = "auto"
        }
    }, [isOpen])

    // Handle escape key press
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === "Escape") {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener("keydown", handleEscKey)
        }
        return () => {
            document.removeEventListener("keydown", handleEscKey)
        }
    }, [isOpen, onClose])

    // Toggle accordion
    const toggleAccordion = (id) => {
        setOpenAccordions((prev) => {
            // Extract the topic index from the accordion id (e.g., "key-points-0" -> "0")
            const topicIndex = id.split("-").pop()

            // Close all accordions for this topic
            const newAccordions = { ...prev }
            Object.keys(newAccordions).forEach((key) => {
                if (key.endsWith(`-${topicIndex}`)) {
                    newAccordions[key] = false
                }
            })

            // Toggle the clicked accordion
            newAccordions[id] = !prev[id]

            return newAccordions
        })
    }

    // Function to get color based on score
    const getScoreColor = (score) => {
        if (score >= 80) return "text-green-600"
        if (score >= 60) return "text-yellow-600"
        return "text-red-600"
    }

    // Function to get progress color based on score
    const getProgressColor = (score) => {
        if (score >= 80) return "bg-gradient-to-r from-green-400 to-green-600"
        if (score >= 60) return "bg-gradient-to-r from-yellow-400 to-yellow-600"
        return "bg-gradient-to-r from-red-400 to-red-600"
    }

    // Function to get skill badge color
    const getSkillBadgeColor = (skill) => {
        switch (skill?.toLowerCase()) {
            case "beginner":
                return "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300"
            case "intermediate":
                return "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300"
            case "advanced":
                return "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300"
            case "expert":
                return "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border border-amber-300"
            default:
                return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300"
        }
    }

    // State for error messages
    const [generationError, setGenerationError] = useState(null)

    // Generate new feedback - wrapped with useCallback to prevent multiple rapid calls
    const handleGenerateNewFeedback = useCallback(async () => {
        if (isGenerating || isGeneratingFeedback) {
            return
        }

        try {
            setGenerationError(null)
            setIsGenerating(true)

            const result = await generateFeedback({
                userId,
                moduleId,
                access_token,
            }).unwrap()

            await refetchHistory()
            setShowHistory(false)
            setSelectedFeedbackId(null)
        } catch (error) {
            console.error("Failed to generate new feedback", error)
            setGenerationError({
                status: error.status || "ERROR",
                message: error.data?.message || "Failed to generate feedback. Please try again.",
                details: `Error ${error.status || ""}${error.originalStatus ? " (" + error.originalStatus + ")" : ""}`,
            })

            alert(
                `Error generating feedback: ${error.status === "PARSING_ERROR"
                    ? "The API endpoint could not be reached. Please check your network connection."
                    : "There was a problem generating feedback. Please try again later."
                }`,
            )
        } finally {
            setIsGenerating(false)
        }
    }, [userId, moduleId, access_token, generateFeedback, refetchHistory, isGenerating, isGeneratingFeedback])

    // Format date for display
    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), "MMM d, yyyy h:mm a")
        } catch (error) {
            return dateString
        }
    }

    if (!isOpen) return null

    // Toggle between real-time feedback and history view
    const toggleHistoryView = () => {
        setShowHistory(!showHistory)
        setSelectedFeedbackId(null)
    }

    // Handle feedback history item selection
    const selectHistoricalFeedback = (feedbackId) => {
        setSelectedFeedbackId(feedbackId)
    }

    // Determine content based on conditions
    const showLatestFeedback = !showHistory && latestFeedbackId && historicalFeedback?.data
    const showRealTimeFeedback = !showHistory && !latestFeedbackId && data
    const showNoFeedbackState = !showHistory && !latestFeedbackId && !data
    const showHistoryList = showHistory && !selectedFeedbackId
    const showHistoricalFeedbackItem = showHistory && selectedFeedbackId && historicalFeedback?.data

    // Parse feedback data for display
    const parseFeedbackData = (feedbackData) => {
        if (!feedbackData) return null

        try {
            // If it's already an object, return it
            if (typeof feedbackData === "object") {
                return feedbackData
            }

            // If it's a string, try to parse it
            if (typeof feedbackData === "string") {
                return JSON.parse(feedbackData)
            }

            return null
        } catch (error) {
            console.error("Error parsing feedback data:", error)
            return null
        }
    }

    const renderFeedbackContent = (feedbackData, feedbackSummary) => {
        const parsedData = parseFeedbackData(feedbackData)

        if (!parsedData) {
            return (
                <div className="p-6 animate-fadeIn">
                    <div className="bg-white rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-blue-600" />
                                Feedback Summary
                            </h3>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {feedbackSummary || "No feedback summary available."}
                            </p>
                        </div>
                    </div>
                </div>
            )
        }

        return (
            <div className="space-y-6 animate-fadeIn">
                {/* Overall Performance */}
                {parsedData.module_score !== undefined && (
                    <div className="bg-white rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="p-6 border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-t-xl">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Target className="w-5 h-5 text-blue-600" />
                                Overall Performance
                                <Award className="w-4 h-4 text-yellow-500 animate-pulse" />
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center transform hover:scale-105 transition-transform duration-200">
                                    <div className={`text-4xl font-bold ${getScoreColor(parsedData.module_score)} animate-countUp`}>
                                        {parsedData.module_score}%
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">Module Score</p>
                                </div>
                                {parsedData.module_skill && (
                                    <div className="text-center transform hover:scale-105 transition-transform duration-200">
                                        <span
                                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSkillBadgeColor(parsedData.module_skill)} shadow-sm`}
                                        >
                                            {parsedData.module_skill}
                                        </span>
                                        <p className="text-sm text-gray-600 mt-2">Skill Level</p>
                                    </div>
                                )}
                                {parsedData.topics && (
                                    <div className="text-center transform hover:scale-105 transition-transform duration-200">
                                        <div className="text-3xl font-bold text-blue-600 animate-countUp">{parsedData.topics.length}</div>
                                        <p className="text-sm text-gray-600 mt-1">Topics Completed</p>
                                    </div>
                                )}
                            </div>
                            <div className="mt-6">
                                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                                    <div
                                        className={`h-4 rounded-full ${getProgressColor(parsedData.module_score)} transition-all duration-1000 ease-out shadow-sm`}
                                        style={{ width: `${parsedData.module_score}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="w-full">
                    <div className="flex bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-1.5 mb-6 shadow-inner">
                        {[
                            { id: "topics", label: "Topics", icon: BookOpen },
                            { id: "weak", label: "Areas to Improve", icon: TrendingDown },
                            { id: "strong", label: "Strengths", icon: TrendingUp },
                            { id: "errors", label: "Error Analysis", icon: BarChart3 },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === tab.id
                                    ? "bg-white text-gray-900 shadow-lg transform scale-105"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-6">
                        {/* Error Analysis Tab */}
                        {activeTab === "errors" && (
                            <div className="space-y-4 animate-slideInUp">
                                <div className="bg-white rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300">
                                    <div className="p-6 border-b bg-gradient-to-r from-red-50 to-orange-50 rounded-t-xl">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-red-600" />
                                            Question Type Analysis
                                        </h3>
                                    </div>
                                    <div className="p-6">
                                        {parsedData.error_analysis ? (
                                            <div className="space-y-4">
                                                {Object.entries(parsedData.error_analysis).map(([type, count], index) => (
                                                    <div
                                                        key={type}
                                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                                                        style={{ animationDelay: `${index * 100}ms` }}
                                                    >
                                                        <span className="text-sm font-medium text-gray-800">
                                                            {type.replace(/([A-Z])/g, " $1").trim()}
                                                        </span>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-32 bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                                                                <div
                                                                    className="bg-gradient-to-r from-red-400 to-red-600 h-3 rounded-full transition-all duration-1000 ease-out"
                                                                    style={{ width: `${Math.min((count / 5) * 100, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm font-bold text-red-600 min-w-[60px] text-right">
                                                                {count} errors
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                                <p className="text-gray-500">No error analysis data available.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Weak Topics */}
                        {activeTab === "weak" && (
                            <div className="space-y-6 animate-slideInUp">
                                {parsedData.feedback?.weak_topics?.map((topic, index) => (
                                    <div
                                        key={index}
                                        className="bg-white rounded-xl border border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                                        style={{ animationDelay: `${index * 150}ms` }}
                                    >
                                        <div className="p-6 border-b bg-gradient-to-r from-red-50 to-pink-50 rounded-t-xl">
                                            <h3 className="text-lg font-semibold flex items-center gap-2 text-red-700">
                                                <TrendingDown className="w-5 h-5" />
                                                {topic.title}
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300 shadow-sm">
                                                    {topic.score}%
                                                </span>
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                                                <div
                                                    className="text-sm text-gray-600 bg-gray-50 p-3 rounded"
                                                    dangerouslySetInnerHTML={{ __html: topic.description }}
                                                />
                                            </p>
                                        </div>
                                        <div className="p-6">
                                            {topic.feedback && (
                                                <div className="space-y-4">
                                                    {topic.feedback.key_points && (
                                                        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                                                            <button
                                                                onClick={() => toggleAccordion(`key-points-${index}`)}
                                                                className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-blue-50 transition-colors duration-200 group"
                                                            >
                                                                <span className="font-medium text-gray-800 group-hover:text-blue-700">
                                                                    Key Points to Remember
                                                                </span>
                                                                <ChevronDown
                                                                    className={`w-5 h-5 transition-all duration-300 text-gray-500 group-hover:text-blue-600 ${openAccordions[`key-points-${index}`] ? "rotate-180 text-blue-600" : ""}`}
                                                                />
                                                            </button>
                                                            {openAccordions[`key-points-${index}`] && (
                                                                <div className="px-4 pb-4 animate-slideDown">
                                                                    <ul className="space-y-3">
                                                                        {topic.feedback.key_points.map((point, idx) => (
                                                                            <li
                                                                                key={idx}
                                                                                className="flex items-start gap-3 animate-fadeIn"
                                                                                style={{ animationDelay: `${idx * 100}ms` }}
                                                                            >
                                                                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0 animate-pulse" />
                                                                                <span className="text-sm text-gray-700 leading-relaxed">{point}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {topic.feedback.weak_areas && (
                                                        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                                                            <button
                                                                onClick={() => toggleAccordion(`weak-areas-${index}`)}
                                                                className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-red-50 transition-colors duration-200 group"
                                                            >
                                                                <span className="font-medium text-gray-800 group-hover:text-red-700">
                                                                    Areas Needing Improvement
                                                                </span>
                                                                <ChevronDown
                                                                    className={`w-5 h-5 transition-all duration-300 text-gray-500 group-hover:text-red-600 ${openAccordions[`weak-areas-${index}`] ? "rotate-180 text-red-600" : ""}`}
                                                                />
                                                            </button>
                                                            {openAccordions[`weak-areas-${index}`] && (
                                                                <div className="px-4 pb-4 animate-slideDown">
                                                                    <ul className="space-y-3">
                                                                        {topic.feedback.weak_areas.map((area, idx) => (
                                                                            <li
                                                                                key={idx}
                                                                                className="flex items-start gap-3 animate-fadeIn"
                                                                                style={{ animationDelay: `${idx * 100}ms` }}
                                                                            >
                                                                                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                                                                <span className="text-sm text-gray-700 leading-relaxed">{area}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {topic.feedback.suggestions && (
                                                        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                                                            <button
                                                                onClick={() => toggleAccordion(`suggestions-${index}`)}
                                                                className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-green-50 transition-colors duration-200 group"
                                                            >
                                                                <span className="font-medium text-gray-800 group-hover:text-green-700">
                                                                    Improvement Suggestions
                                                                </span>
                                                                <ChevronDown
                                                                    className={`w-5 h-5 transition-all duration-300 text-gray-500 group-hover:text-green-600 ${openAccordions[`suggestions-${index}`] ? "rotate-180 text-green-600" : ""}`}
                                                                />
                                                            </button>
                                                            {openAccordions[`suggestions-${index}`] && (
                                                                <div className="px-4 pb-4 animate-slideDown">
                                                                    <ul className="space-y-3">
                                                                        {topic.feedback.suggestions.map((suggestion, idx) => (
                                                                            <li
                                                                                key={idx}
                                                                                className="flex items-start gap-3 animate-fadeIn"
                                                                                style={{ animationDelay: `${idx * 100}ms` }}
                                                                            >
                                                                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0 animate-pulse" />
                                                                                <span className="text-sm text-gray-700 leading-relaxed">{suggestion}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {topic.feedback.practice_questions && (
                                                        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                                                            <button
                                                                onClick={() => toggleAccordion(`practice-${index}`)}
                                                                className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-purple-50 transition-colors duration-200 group"
                                                            >
                                                                <span className="font-medium text-gray-800 group-hover:text-purple-700">
                                                                    Practice Questions
                                                                </span>
                                                                <ChevronDown
                                                                    className={`w-5 h-5 transition-all duration-300 text-gray-500 group-hover:text-purple-600 ${openAccordions[`practice-${index}`] ? "rotate-180 text-purple-600" : ""}`}
                                                                />
                                                            </button>
                                                            {openAccordions[`practice-${index}`] && (
                                                                <div className="px-4 pb-4 animate-slideDown">
                                                                    <div className="space-y-4">
                                                                        {topic.feedback.practice_questions.map((qa, idx) => (
                                                                            <div
                                                                                key={idx}
                                                                                className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-purple-50 hover:to-purple-100 transition-all duration-200 animate-fadeIn"
                                                                                style={{ animationDelay: `${idx * 150}ms` }}
                                                                            >
                                                                                <p className="font-medium text-sm mb-3 text-gray-800">
                                                                                    Q{idx + 1}: {qa.question}
                                                                                </p>
                                                                                <p className="text-sm text-gray-700 leading-relaxed">
                                                                                    <strong className="text-purple-700">Answer:</strong> {qa.answer}
                                                                                </p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {topic.feedback?.time_analysis && (
                                                <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg shadow-sm">
                                                    <p className="text-sm text-yellow-800 leading-relaxed">
                                                        <strong className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4" />
                                                            Time Analysis:
                                                        </strong>
                                                        {topic.feedback.time_analysis}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )) || (
                                        <div className="bg-white rounded-xl border shadow-lg">
                                            <div className="p-8 text-center">
                                                <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                                <p className="text-gray-500">No areas for improvement identified. Great job!</p>
                                            </div>
                                        </div>
                                    )}
                            </div>
                        )}

                        {/* Strong Topics */}
                        {activeTab === "strong" && (
                            <div className="space-y-6 animate-slideInUp">
                                {parsedData.feedback?.strong_topics?.map((topic, index) => (
                                    <div
                                        key={index}
                                        className="bg-white rounded-xl border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                                        style={{ animationDelay: `${index * 150}ms` }}
                                    >
                                        <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl">
                                            <h3 className="text-lg font-semibold flex items-center gap-2 text-green-700">
                                                <TrendingUp className="w-5 h-5" />
                                                {topic.title}
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300 shadow-sm">
                                                    {topic.score}%
                                                </span>
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                                                <div
                                                    className="text-sm text-gray-600 bg-gray-50 p-3 rounded"
                                                    dangerouslySetInnerHTML={{ __html: topic.description }}
                                                />
                                            </p>
                                        </div>
                                        <div className="p-6">
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="flex items-center gap-2 text-green-600">
                                                    <CheckCircle className="w-5 h-5 animate-pulse" />
                                                    <span className="font-medium">Great job on this topic!</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) || (
                                        <div className="bg-white rounded-xl border shadow-lg">
                                            <div className="p-8 text-center">
                                                <Award className="w-12 h-12 text-yellow-500 mx-auto mb-3 animate-bounce" />
                                                <p className="text-gray-500">No strong topics identified yet. Keep learning!</p>
                                            </div>
                                        </div>
                                    )}
                            </div>
                        )}

                        {/* Topics Overview */}
                        {activeTab === "topics" && (
                            <div className="space-y-4 animate-slideInUp">
                                <div className="grid gap-4">
                                    {parsedData.topics?.map((topic, index) => (
                                        <div
                                            key={topic.id}
                                            className="bg-white rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                                            style={{ animationDelay: `${index * 100}ms` }}
                                        >
                                            <div className="p-6">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h3 className="font-semibold text-lg text-gray-800 leading-tight">{topic.title}</h3>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                                        <span className={`font-bold text-lg ${getScoreColor(topic.topic_score)}`}>
                                                            {topic.topic_score}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{topic.topic_time_spent} min</span>
                                                    </div>
                                                    <span
                                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getSkillBadgeColor(topic.topic_skill)} shadow-sm`}
                                                    >
                                                        {topic.topic_skill}
                                                    </span>
                                                    <span className="text-green-600 capitalize font-medium">{topic.topic_completion_status}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )) || (
                                            <div className="bg-white rounded-xl border shadow-lg">
                                                <div className="p-8 text-center">
                                                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                                    <p className="text-gray-500">No topic data available.</p>
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* Full Screen Overlay */}
            <div
                className={`fixed inset-0 bg-black transition-all duration-500 ease-out ${isOpen ? "bg-opacity-60 backdrop-blur-sm" : "bg-opacity-0"
                    }`}
                style={{ zIndex: 9998 }}
                onClick={onClose}
            ></div>

            {/* Modal Container */}
            <div
                className={`fixed inset-0 flex items-center justify-center p-4 transition-all duration-500 ease-out ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
                    }`}
                style={{ zIndex: 9999 }}
                data-feedback-modal="true"
                data-generating={isGenerating || isGeneratingFeedback || isAutoGenerating ? "true" : "false"}
            >
                <div
                    ref={modalRef}
                    className={`bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-500 ease-out ${isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
                        }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Modal Header */}
                    <div className="p-6 border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                        <div className="flex justify-between items-start">
                            <div className="animate-fadeIn">
                                <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-800">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <BookOpen className="h-6 w-6 text-blue-600" />
                                    </div>
                                    {showHistory
                                        ? selectedFeedbackId
                                            ? "Historical Feedback"
                                            : "Feedback History"
                                        : "AI-Generated Learning Feedback"}
                                    <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
                                </h2>
                                <p className="text-gray-600 mt-2 leading-relaxed">
                                    {showHistory
                                        ? selectedFeedbackId
                                            ? "View your previously generated feedback"
                                            : "Browse your feedback history for this module"
                                        : "Your personalized learning feedback and performance analysis"}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-gray-200 transition-all duration-200 group transform hover:scale-110"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5 text-gray-500 group-hover:text-gray-700 transition-colors duration-200" />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 mt-4 animate-slideInUp">
                            <button
                                onClick={toggleHistoryView}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 text-sm font-medium transform hover:scale-105 hover:shadow-md"
                            >
                                {showHistory ? <RefreshCcw className="h-4 w-4" /> : <History className="h-4 w-4" />}
                                {showHistory ? "Current Feedback" : "View History"}
                            </button>

                            {!showHistory && (
                                <button
                                    onClick={handleGenerateNewFeedback}
                                    disabled={isGenerating || isGeneratingFeedback}
                                    className={`px-4 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-2 transition-all duration-200 transform hover:scale-105 hover:shadow-lg ${isGenerating || isGeneratingFeedback
                                        ? "bg-blue-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                                        }`}
                                >
                                    {isGenerating || isGeneratingFeedback ? (
                                        <>
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCcw className="h-4 w-4" />
                                            Generate New
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Modal Content */}
                    <div className="flex-1 overflow-auto">
                        {/* Loading States */}
                        {((isGeneratingFeedback && !showHistory && !latestFeedbackId) ||
                            (historyLoading && showHistory && !selectedFeedbackId) ||
                            (historicalFeedbackLoading &&
                                ((showHistory && selectedFeedbackId) || (!showHistory && latestFeedbackId)))) && (
                                <div className="flex flex-col items-center justify-center p-12 animate-fadeIn">
                                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
                                    <span className="text-gray-600 text-lg font-medium">
                                        {isAutoGenerating
                                            ? "Auto-generating your first feedback..."
                                            : historicalFeedbackLoading && selectedFeedbackId
                                                ? "Loading selected feedback..."
                                                : historicalFeedbackLoading && latestFeedbackId
                                                    ? "Loading latest feedback..."
                                                    : historyLoading
                                                        ? "Loading feedback history..."
                                                        : "Generating feedback..."}
                                    </span>
                                    <div className="mt-2 text-sm text-gray-500">
                                        {isAutoGenerating
                                            ? "This may take a few moments as we analyze your performance"
                                            : "Please wait a moment"}
                                    </div>
                                </div>
                            )}

                        {/* Error States */}
                        {(error || generationError) && !showHistory && !latestFeedbackId && (
                            <div className="p-6 m-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl shadow-lg animate-slideInUp">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="h-6 w-6 flex-shrink-0 text-red-600" />
                                    <div>
                                        <span className="font-semibold text-red-800 text-lg">
                                            {generationError ? "Error generating feedback" : "Error fetching feedback data"}
                                        </span>
                                        <p className="text-sm mt-1 text-red-700 leading-relaxed">
                                            {generationError ? generationError.message : "Please try again later."}
                                        </p>
                                        <button
                                            onClick={() => refetchHistory()}
                                            className="mt-3 px-4 py-2 bg-red-100 text-red-800 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors duration-200 transform hover:scale-105"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Feedback History List View */}
                        {showHistoryList && (
                            <div className="p-6 space-y-6 animate-fadeIn">
                                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <History className="w-6 h-6 text-blue-600" />
                                    Feedback History
                                </h3>

                                {historyError ? (
                                    <div className="p-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl shadow-lg">
                                        <div className="flex items-center gap-3">
                                            <AlertTriangle className="h-6 w-6 flex-shrink-0 text-red-600" />
                                            <div>
                                                <p className="font-semibold text-red-800 text-lg">Error loading feedback history</p>
                                                <p className="text-sm mt-1 text-red-700 leading-relaxed">
                                                    {historyError.status === "FETCH_ERROR"
                                                        ? "Network error. Please check your connection and try again."
                                                        : historyError.toString()}
                                                </p>
                                                <button
                                                    onClick={() => refetchHistory()}
                                                    className="mt-3 px-4 py-2 bg-red-100 text-red-800 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors duration-200 transform hover:scale-105"
                                                >
                                                    Retry
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : !feedbackHistory?.data || feedbackHistory.data.length === 0 ? (
                                    <div className="bg-white rounded-xl border shadow-lg">
                                        <div className="p-8 text-center">
                                            <div className="bg-gray-100 rounded-full p-6 mx-auto w-20 h-20 flex items-center justify-center mb-6">
                                                <BookOpen className="h-10 w-10 text-gray-500" />
                                            </div>
                                            <h4 className="text-xl font-semibold text-gray-700 mb-3">No feedback history found</h4>
                                            <p className="text-gray-500 mb-6 leading-relaxed">
                                                Generate your first feedback for this module to track your progress.
                                            </p>
                                            <div className="flex gap-4 justify-center">
                                                <button
                                                    onClick={() => refetchHistory()}
                                                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 font-medium"
                                                >
                                                    Retry Loading
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowHistory(false)
                                                        handleGenerateNewFeedback()
                                                    }}
                                                    disabled={isGenerating || isGeneratingFeedback}
                                                    className={`px-6 py-3 rounded-lg text-white font-medium transition-all duration-200 transform hover:scale-105 ${isGenerating || isGeneratingFeedback
                                                        ? "bg-blue-400 cursor-not-allowed"
                                                        : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                                                        }`}
                                                >
                                                    {isGenerating || isGeneratingFeedback ? "Generating..." : "Generate Feedback"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {feedbackHistory.data.map((item, index) => (
                                            <div
                                                key={item.id}
                                                onClick={() => selectHistoricalFeedback(item.id)}
                                                className={`bg-white rounded-xl border shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${item.is_current
                                                    ? "border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50"
                                                    : "border-gray-200 hover:border-blue-300"
                                                    }`}
                                                style={{ animationDelay: `${index * 100}ms` }}
                                            >
                                                <div className="p-6">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <div className="font-semibold text-lg text-gray-800">
                                                            Version {item.version}
                                                            {!!item.is_current && (
                                                                <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300 shadow-sm">
                                                                    Latest
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-gray-500 font-medium">{formatDate(item.created_at)}</div>
                                                    </div>
                                                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{item.feedback_summary}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Selected Historical Feedback View */}
                        {showHistoricalFeedbackItem && (
                            <div className="space-y-4 animate-fadeIn">
                                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <History className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600 font-medium">
                                                Version {historicalFeedback.data.version}
                                            </span>
                                            <span className="mx-2 text-gray-400">•</span>
                                            <span className="text-sm text-gray-600 font-medium">
                                                Generated on {formatDate(historicalFeedback.data.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedFeedbackId(null)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-all duration-200 transform hover:scale-105"
                                    >
                                        Back to history
                                    </button>
                                </div>
                                <div className="p-6">
                                    {renderFeedbackContent(
                                        historicalFeedback.data.feedback_data,
                                        historicalFeedback.data.feedback_summary,
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Latest Saved Feedback View */}
                        {showLatestFeedback && (
                            <div className="space-y-4 animate-fadeIn">
                                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Sparkles className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600 font-medium">
                                                Version {historicalFeedback.data.version}
                                            </span>
                                            <span className="mx-2 text-gray-400">•</span>
                                            <span className="text-sm text-gray-600 font-medium">
                                                Generated on {formatDate(historicalFeedback.data.created_at)}
                                            </span>
                                            <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300 shadow-sm">
                                                Latest Saved Feedback
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {renderFeedbackContent(
                                        historicalFeedback.data.feedback_data,
                                        historicalFeedback.data.feedback_summary,
                                    )}
                                </div>
                            </div>
                        )}

                        {/* No Feedback State */}
                        {showNoFeedbackState && (
                            <div className="bg-white rounded-xl border shadow-lg m-6 animate-fadeIn">
                                <div className="p-12 text-center">
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full p-6 mx-auto w-20 h-20 flex items-center justify-center mb-6">
                                        <BookOpen className="h-10 w-10 text-blue-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-3">
                                        {isAutoGenerating ? "Generating Your First Feedback..." : "No Feedback Generated Yet"}
                                    </h3>
                                    <p className="text-gray-600 mb-8 leading-relaxed max-w-md mx-auto">
                                        {isAutoGenerating
                                            ? "We're analyzing your performance and creating personalized feedback. This may take a few moments."
                                            : "Generate your first personalized feedback to see your performance analysis and improvement suggestions."
                                        }
                                    </p>
                                    {!isAutoGenerating && (
                                        <button
                                            onClick={toggleHistoryView}
                                            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 mx-auto transition-all duration-200 transform hover:scale-105 font-medium shadow-sm hover:shadow-md"
                                        >
                                            <History className="h-5 w-5" />
                                            View History
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInUp {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0; 
            max-height: 0; 
          }
          to { 
            opacity: 1; 
            max-height: 500px; 
          }
        }
        
        @keyframes countUp {
          from { 
            opacity: 0; 
            transform: scale(0.5); 
          }
          to { 
            opacity: 1; 
            transform: scale(1); 
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        
        .animate-slideInUp {
          animation: slideInUp 0.6s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        
        .animate-countUp {
          animation: countUp 0.8s ease-out;
        }
      `}</style>
        </>
    )
}
