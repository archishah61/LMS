"use client"

import { useEffect, useMemo, useState } from "react"
import { Users, Clock, ArrowLeft, Calendar, Award, BarChart3 } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { useGetActiveContestsQuery } from "../../../services/Contest/contestAPI"
import { slugify } from "../../../utils/slugify"
import PrimaryLoader from "../../../components/ui/PrimaryLoader"

// Static images for templates
const templateImages = {
    1: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=200&fit=crop&crop=center",
    2: "https://images.unsplash.com/photo-1635372722656-389f87a941b7?w=400&h=200&fit=crop&crop=center",
    3: "https://images.unsplash.com/photo-1555949963352-d6fc5c10da5a?w=400&h=200&fit=crop&crop=center",
    4: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop&crop=center",
    5: "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=400&h=200&fit=crop&crop=center",
}

const defaultBanner = "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop&crop=center"

const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-semibold"
    switch (status) {
        case "active":
            return `${baseClasses} bg-green-100 text-green-800 border border-green-200`
        case "upcoming":
            return `${baseClasses} bg-blue-100 text-blue-800 border border-blue-200`
        case "ended":
            return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`
        default:
            return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`
    }
}

const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
        case "easy":
            return "bg-green-500"
        case "medium":
            return "bg-yellow-500"
        case "hard":
            return "bg-red-500"
        default:
            return "bg-gray-500"
    }
}

const formatDisplayTime = (timeString) => {
    if (timeString === "00:00:00:00") return "LIVE NOW!"

    const [days, hours, minutes, seconds] = timeString.split(':').map(Number)

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m ${seconds}s`
    } else if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`
    } else {
        return `${seconds}s`
    }
}

const getTemplateType = (template) => {
    const t = (template?.type || template?.template_type || template?.contest_type || template?.category || "")
        ?.toString()
        ?.toLowerCase()
    return t || ""
}

const getNextOccurrenceISO = (template) => {
    return (
        template?.next_occurrence_at ||
        template?.next_occurrence ||
        template?.next_start_time ||
        template?.start_time ||
        getNextContestTime(template)
    )
}

const getNextContestTime = (template) => {
    const { created_at, recurrence_pattern, recurrence_interval, recurrence_days_of_week } = template;
    const createdAt = new Date(created_at);
    const now = new Date();

    // If no recurrence pattern, return null
    if (!recurrence_pattern) {
        return null;
    }

    let nextDate = new Date(createdAt);

    // Helper: map weekdays to number (0 = Sunday ... 6 = Saturday)
    const daysMap = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
    };

    // If the created date is in future, use it as first occurrence
    if (createdAt > now) {
        return createdAt.toISOString();
    }

    if (recurrence_pattern === "day") {
        // Daily recurrence
        const daysSinceStart = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
        const occurrences = Math.floor(daysSinceStart / recurrence_interval);
        nextDate.setDate(createdAt.getDate() + (occurrences + 1) * recurrence_interval);

        // Ensure we don't return a date in the past
        while (nextDate <= now) {
            nextDate.setDate(nextDate.getDate() + recurrence_interval);
        }
        return nextDate.toISOString();
    }

    if (recurrence_pattern === "week") {
        // Weekly recurrence with specific days
        const targetDays = (recurrence_days_of_week || []).map(day => daysMap[day]).sort((a, b) => a - b);

        if (targetDays.length === 0) {
            // If no specific days, use the creation day
            targetDays.push(createdAt.getDay());
        }

        // Start from the last occurrence or creation date
        let currentDate = new Date(createdAt);

        // Find the next occurrence
        while (true) {
            // Check each target day in the current week
            for (let day of targetDays) {
                const candidate = new Date(currentDate);
                const daysToAdd = (day - candidate.getDay() + 7) % 7;
                candidate.setDate(candidate.getDate() + daysToAdd);

                // If we found a future date, return it
                if (candidate > now) {
                    return candidate.toISOString();
                }
            }

            // Move to next week
            currentDate.setDate(currentDate.getDate() + 7 * recurrence_interval);
        }
    }

    if (recurrence_pattern === "month") {
        // Monthly recurrence
        nextDate = new Date(createdAt);
        while (nextDate <= now) {
            nextDate.setMonth(nextDate.getMonth() + recurrence_interval);
        }
        return nextDate.toISOString();
    }

    if (recurrence_pattern === "year") {
        // Yearly recurrence
        nextDate = new Date(createdAt);
        while (nextDate <= now) {
            nextDate.setFullYear(nextDate.getFullYear() + recurrence_interval);
        }
        return nextDate.toISOString();
    }

    // fallback if no pattern matched
    return null;
};

const toTitleCase = (s) => (s || "").replace(/[_-]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())

export default function TemplateContestsPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const template = location?.state?.template
    const [currentTime, setCurrentTime] = useState(new Date())

    const templateId = template?.id || template?.template_id
    const { data: contestsData, isLoading: contestsLoading, error: contestsError } = useGetActiveContestsQuery(templateId)

    const contests = contestsData?.success ? contestsData.data : []

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    const sortedContests = useMemo(() => {
        const list = Array.isArray(contests) ? contests.slice() : []
        return list.sort((a, b) => {
            const aTime = a?.start_time ? new Date(a.start_time).getTime() : Number.MAX_SAFE_INTEGER
            const bTime = b?.start_time ? new Date(b.start_time).getTime() : Number.MAX_SAFE_INTEGER
            return aTime - bTime
        })
    }, [contests])

    const handleContestClick = (contest) => {
        const contestTitle = contest.title || contest.name || "contest"
        navigate(`/contests/${slugify(contestTitle)}`, {
            state: { id: contest.id },
        })
    }

    const handleBackToContests = () => {
        navigate("/contests")
    }

    const getTimeRemaining = (dateString) => {
        if (!dateString) return ""
        const now = currentTime // Use the reactive currentTime
        const target = new Date(dateString)
        const diff = target.getTime() - now.getTime()
        if (diff <= 0) return "00:00:00:00"

        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)

        return `${days.toString().padStart(2, "0")}:${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }

    const getTemplateTimerLabel = (template) => {
        const t = getTemplateType(template)
        if (["on_demand", "on-demand", "ondemand", "demand", "ndemand"].some((k) => t.includes(k))) {
            return "On Demand"
        }
        if (t.includes("recurring")) {
            const timeRemaining = getTimeRemaining(getNextOccurrenceISO(template))
            return formatDisplayTime(timeRemaining)
        }
        const next = getNextOccurrenceISO(template)
        return next ? formatDisplayTime(getTimeRemaining(next)) : ""
    }

    if (!template) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-700 mb-4">No template data provided.</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        )
    }

    if (contestsLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <PrimaryLoader />
            </div>
        )
    }

    if (contestsError) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Error loading contests</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    const templateTitle = template?.title || template?.name || "Contest Template"
    const templateDescription = template?.description || template?.short_description || ""
    const templateImg = `${import.meta.env.VITE_BACKEND_MEDIA_URL}${template.banner_url}` || templateImages[template?.id] || defaultBanner
    const templateTypeRaw = getTemplateType(template)
    const templateTypeLabel = templateTypeRaw ? toTitleCase(templateTypeRaw) : "Template"
    const templateDifficulty = template?.meta?.difficulty || template?.difficulty
    const templateDuration =
        template?.meta?.duration || template?.duration || template?.estimated_duration || template?.time_limit || null
    const templateMaxParticipants =
        template?.max_participants || template?.participant_limit || template?.max_users || null

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
                {/* Template Header Card - Responsive */}
                <div className="bg-white rounded-lg sm:rounded-xl md:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-6 mb-6 sm:mb-8 md:mb-10">
                    {/* Banner Image - Responsive */}
                    <div className="relative w-full h-32 xs:h-36 sm:h-44 md:h-56 lg:h-80 bg-gray-100 rounded-lg sm:rounded-xl md:rounded-xl overflow-hidden mb-4 sm:mb-5 md:mb-6">
                        <button
                            onClick={handleBackToContests}
                            className="absolute top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4 z-20 bg-white/90 backdrop-blur-sm text-gray-800 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-1.5 sm:gap-2 text-xs font-medium shadow-sm border border-gray-100 hover:bg-white transition-colors"
                        >
                            <ArrowLeft size={14} className="sm:w-4 sm:h-4" />
                            <span className="hidden xs:inline">Back</span>
                        </button>

                        <img
                            src={templateImg}
                            alt={templateTitle}
                            className="relative aspect-[2/1] w-full h-full object-cover"
                            onError={(e) => {
                                e.target.src = `/assets/placeholder1.png`
                            }}
                        />
                        <div className="absolute inset-0 bg-black/10" />
                    </div>

                    {/* Template Info - Responsive */}
                    <div className="pt-2 sm:pt-4 md:pt-6 px-0 sm:px-1">
                        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 leading-tight">{templateTitle}</h1>
                        <p className="text-gray-500 text-xs sm:text-sm md:text-base mb-3 sm:mb-4 leading-relaxed line-clamp-3 md:line-clamp-none">
                            {templateDescription || "Join this contest series to improve your coding skills and compete with others."}
                        </p>
                        
                        {/* Metadata - Responsive */}
                        {(templateMaxParticipants || templateDifficulty || templateDuration) && (
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                                {templateDuration && (
                                    <div className="bg-gray-50 text-gray-700 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md border border-gray-200 flex items-center gap-1.5 sm:gap-2 shadow-sm">
                                        <Clock size={14} className="sm:w-4 sm:h-4 text-primary" />
                                        <span className="font-medium whitespace-nowrap">{templateDuration}</span>
                                    </div>
                                )}
                                {templateDifficulty && (
                                    <div className="bg-gray-50 text-gray-700 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md border border-gray-200 flex items-center gap-1.5 sm:gap-2 shadow-sm">
                                        <span className="font-medium text-gray-500 whitespace-nowrap">Difficulty:</span>
                                        <span className={`font-bold whitespace-nowrap ${
                                            String(templateDifficulty).toLowerCase() === 'hard' ? 'text-red-500' :
                                            String(templateDifficulty).toLowerCase() === 'medium' ? 'text-amber-500' :
                                            'text-emerald-500'
                                        }`}>
                                            {toTitleCase(String(templateDifficulty))}
                                        </span>
                                    </div>
                                )}
                                {templateMaxParticipants && (
                                    <div className="bg-gray-50 text-gray-700 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md border border-gray-200 flex items-center gap-1.5 sm:gap-2 shadow-sm">
                                        <Users size={14} className="sm:w-4 sm:h-4 text-primary" />
                                        <span className="font-medium whitespace-nowrap">Max {templateMaxParticipants}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Badges - Responsive */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <span className="bg-blue-600 text-white text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg font-medium shadow-md">
                                {templateTypeLabel}
                            </span>
                            <span className="bg-primary text-white text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg font-medium shadow-md tabular-nums">
                                {getTemplateTimerLabel(template)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Available Contests Section - Responsive */}
                <div className="mb-6 sm:mb-8 md:mb-10">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-6 md:mb-8">
                        <div>
                            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1">Available Contests</h2>
                            <p className="text-black text-xs sm:text-sm">All Contests — Browse and join programming contests</p>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-xs sm:text-xs font-medium text-gray-600">
                            <BarChart3 size={12} className="sm:w-3.5 sm:h-3.5" />
                            <span>{sortedContests.length} contest{sortedContests.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    {/* Contests Grid - Responsive */}
                    {sortedContests.length === 0 ? (
                        <div className="text-center py-12 sm:py-16 md:py-20 bg-white rounded-lg sm:rounded-xl md:rounded-2xl border border-dashed border-gray-200">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-gray-100">
                                <Award className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-300" />
                            </div>
                            <h3 className="text-gray-900 font-medium mb-1 text-sm sm:text-base">No contests available</h3>
                            <p className="text-gray-500 text-xs sm:text-sm">Check back later for new challenges in this series.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                            {sortedContests.map((contest) => {
                                const title = contest.title || contest.name || "Contest"
                                const status = contest.status;

                                return (
                                    <div
                                        key={contest.id}
                                        className="group bg-white rounded-lg sm:rounded-xl md:rounded-xl border border-gray-200 shadow-sm overflow-hidden cursor-pointer flex flex-col h-full hover:shadow-md transition-shadow"
                                        onClick={() => handleContestClick(contest)}
                                    >
                                        {/* Card Image - Responsive */}
                                        <div className="p-2.5 sm:p-3 md:p-4 pb-0">
                                            <div className="aspect-[2/1] relative overflow-hidden rounded-lg sm:rounded-xl md:rounded-xl bg-gray-100">
                                                <img
                                                    src={
                                                        contest.banner_url
                                                            ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${contest.banner_url}`
                                                            : `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`
                                                    }
                                                    alt={title}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.src = '/assets/placeholder2.png' }}
                                                />
                                            </div>
                                        </div>

                                        {/* Card Content - Responsive */}
                                        <div className="p-3 sm:p-4 md:p-5 pt-2.5 sm:pt-3 md:pt-4 flex flex-col flex-1">
                                            <div className="flex justify-between items-start mb-1 gap-2 sm:gap-4">
                                                <h3 className="font-bold text-sm sm:text-base text-gray-900 line-clamp-1 flex-1 min-w-0">
                                                    {title}
                                                </h3>
                                                <span className="bg-emerald-50 text-emerald-600 text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 rounded font-bold uppercase tracking-wide shrink-0">
                                                    {contest.category_name || "Programming"}
                                                </span>
                                            </div>

                                            <p className="text-gray-500 text-xs sm:text-sm md:text-md font-medium mb-1.5 sm:mb-2">Regular Series</p>

                                            <div className="mt-auto space-y-1.5 sm:space-y-2">
                                                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500">
                                                    <Calendar size={14} className="sm:w-4 sm:h-4 text-gray-400" />
                                                    <span className="font-medium truncate">
                                                        {status === "active" ? (
                                                            <span className="flex items-center gap-1">Live Now</span>
                                                        ) : status === "upcoming" ? (
                                                            `Starts ${formatDate(contest.start_time)}`
                                                        ) : (
                                                            `Ended ${formatDate(contest.end_time)}`
                                                        )}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500">
                                                    <Users size={14} className="sm:w-4 sm:h-4 text-gray-400" />
                                                    <span>{contest.total_participants || 0} participants</span>
                                                </div>

                                                {Number.isFinite(contest?.max_participants) && contest.max_participants > 0 && (
                                                    <div className="mt-2 sm:mt-3">
                                                        <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                                                            <span className="font-medium">
                                                                {Math.min(100, Math.round(((contest.total_participants || 0) / contest.max_participants) * 100))}% Full
                                                            </span>
                                                            <span className="text-gray-500">
                                                                {contest.total_participants || 0}/{contest.max_participants}
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-1 sm:h-1.5 overflow-hidden">
                                                            <div
                                                                className="bg-primary h-full rounded-full transition-all duration-300"
                                                                style={{ 
                                                                    width: `${Math.min(100, Math.round(((contest.total_participants || 0) / contest.max_participants) * 100))}%` 
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}