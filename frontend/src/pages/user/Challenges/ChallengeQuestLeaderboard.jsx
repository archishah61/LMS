"use client"
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    Trophy,
    Medal,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Filter,
    Calendar,
    Star,
    User,
    Crown,
    Award,
    Target,
    Zap,
    Shield,
    ChevronDown,
    TrendingUp,
    Clock,
    CalendarDays,
    CalendarRange,
    Users,
    ArrowLeft,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getStudentToken } from "../../../services/CookieService"
import PrimaryLoader from "../../../components/ui/PrimaryLoader"
import { useGetChallengeQuestLeaderboardQuery } from "../../../services/Challenge/userChallengeQuestAPI"
import { useGetAllChallengeCategoriesQuery } from "../../../services/Masters/challengeCategoryApi"

export default function ChallengeQuestLeaderboard() {
    const navigate = useNavigate()
    const { access_token } = getStudentToken()

    // Filter states
    const [difficultyFilter, setDifficultyFilter] = useState("all")
    const [timeInterval, setTimeInterval] = useState("today")
    const [categoryFilter, setCategoryFilter] = useState("all")

    // UI states
    const [showFilters, setShowFilters] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)

    const { data: categoriesData, isLoading: loadingCategories } = useGetAllChallengeCategoriesQuery(
        { access_token },
        { skip: !access_token },
    )

    // Fetch leaderboard data
    const { data: leaderboardData, isLoading, refetch } = useGetChallengeQuestLeaderboardQuery({
        difficulty_level: difficultyFilter,
        category_id: categoryFilter || null,
        timeinterval: timeInterval,
    })

    // Time interval options
    const timeOptions = [
        { value: "today", label: "Today", icon: Clock },
        { value: "week", label: "This Week", icon: CalendarDays },
        { value: "month", label: "This Month", icon: CalendarRange },
        { value: "all", label: "All Time", icon: TrendingUp },
    ]

    // Difficulty options
    const difficultyOptions = [
        { value: "all", label: "All Difficulties", icon: Target },
        { value: "Beginner", label: "Beginner", icon: Star },
        { value: "Intermediate", label: "Intermediate", icon: Shield },
        { value: "Advanced", label: "Advanced", icon: Zap },
    ]

    // Get medal color based on rank
    const getMedalColor = (rank) => {
        switch (rank) {
            case 1: return "text-yellow-500"
            case 2: return "text-gray-400"
            case 3: return "text-amber-600"
            default: return "text-gray-300"
        }
    }

    // Get rank badge
    const getRankBadge = (rank) => {
        switch (rank) {
            case 1: return <Crown className="w-5 h-5 text-yellow-500" />
            case 2: return <Medal className="w-5 h-5 text-gray-400" />
            case 3: return <Medal className="w-5 h-5 text-amber-600" />
            default: return <span className="text-gray-500 font-medium">{rank}</span>
        }
    }

    // Pagination
    const totalCount = leaderboardData?.data?.length || 0
    const totalPages = totalCount ? Math.ceil(totalCount / itemsPerPage) : 1
    const currentData = leaderboardData?.data?.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )
    const startItem = totalCount ? (currentPage - 1) * itemsPerPage + 1 : 0
    const endItem = totalCount ? Math.min(currentPage * itemsPerPage, totalCount) : 0

    // Scroll to top on page change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" })
    }, [currentPage])

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [difficultyFilter, timeInterval, categoryFilter])

    // Handle back to challenges
    const handleBackToChallenges = () => {
        navigate("/challenges")
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <PrimaryLoader />
            </div>
        )
    }

    return (
        <div className="bg-white text-gray-900 min-h-screen">
            <div className="container mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6">
                {/* Header Section with Title and All Controls */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 sm:mb-6 md:mb-8">
                    {/* Left side - Title */}
                    <div className="w-full lg:w-auto">
                        <div className="flex items-center justify-between gap-3">
                            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-bold text-forestGreen">
                                Challenge Leaderboard
                            </h1>
                            {/* Mobile Back Button */}
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center justify-center flex-shrink-0 gap-1.5 px-3 py-2 bg-white text-primary text-xs sm:text-xs md:text-sm font-medium rounded-md border border-gray-200 transition-all hover:border-gray-300 hover:shadow-sm active:scale-95 whitespace-nowrap group lg:hidden"
                            >
                                <ArrowLeft className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 transition-transform group-hover:-translate-x-0.5" />
                                <span className="hidden sm:inline">Back</span>
                            </button>
                        </div>
                        <p className="text-gray-500 text-xs sm:text-sm md:text-sm lg:text-base mt-1 hidden lg:block">
                            See who's leading the pack in challenge quests. Compete, earn points, and climb the ranks!
                        </p>
                    </div>

                    {/* Right side - All Filters and Back Button */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                        {/* Filters Group */}
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            {/* Difficulty Filter */}
                            <div className="relative flex-1 sm:flex-none min-w-[140px]">
                                <select
                                    value={difficultyFilter}
                                    onChange={(e) => setDifficultyFilter(e.target.value)}
                                    className="w-full appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-md text-xs sm:text-xs md:text-sm text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                >
                                    {difficultyOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            </div>

                            {/* Category Filter */}
                            <div className="relative flex-1 sm:flex-none min-w-[140px]">
                                <select
                                    value={categoryFilter || "all"}
                                    onChange={(e) => setCategoryFilter(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                                    className="w-full appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-md text-xs sm:text-xs md:text-sm text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                >
                                    <option value="all">All Categories</option>
                                    {categoriesData?.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.category}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            </div>

                            {/* Time Filter */}
                            <div className="relative flex-1 sm:flex-none min-w-[140px]">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="flex items-center justify-between w-full gap-1.5 sm:gap-2 px-3 py-2 bg-white text-gray-700 rounded-md border border-gray-200 text-xs sm:text-xs md:text-sm font-medium hover:border-gray-300 transition-colors active:scale-95"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-gray-500 flex-shrink-0" />
                                        <span className="text-gray-600 truncate">
                                            {timeOptions.find((t) => t.value === timeInterval)?.label || "This Week"}
                                        </span>
                                    </div>
                                    <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${showFilters ? 'rotate-180' : ''}`} />
                                </button>

                                {showFilters && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowFilters(false)}
                                        />
                                        <div className="absolute top-full right-0 mt-1.5 bg-white rounded-md border border-gray-200 shadow-lg z-50 min-w-[150px] overflow-hidden animate-in fade-in slide-in-from-top-5 duration-200">
                                            <div className="p-1.5">
                                                {timeOptions.map((option) => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => {
                                                            setTimeInterval(option.value)
                                                            setShowFilters(false)
                                                        }}
                                                        className={`w-full text-left px-3 py-2.5 rounded-md transition-colors flex items-center justify-between ${timeInterval === option.value
                                                            ? "bg-primary/10 text-primary font-medium"
                                                            : "text-gray-700 hover:bg-gray-50"
                                                            }`}
                                                    >
                                                        <span className="text-xs sm:text-xs md:text-sm">{option.label}</span>
                                                        {timeInterval === option.value && (
                                                            <div className="w-1.5 h-1.5 bg-primary rounded-full ml-2 flex-shrink-0" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Desktop Back Button */}
                        <button
                            onClick={() => navigate(-1)}
                            className="hidden lg:flex items-center justify-center flex-shrink-0 gap-1.5 px-3 py-2 bg-white text-primary text-xs sm:text-xs md:text-sm font-medium rounded-md border border-gray-200 transition-all hover:border-gray-300 hover:shadow-sm active:scale-95 whitespace-nowrap group"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 transition-transform group-hover:-translate-x-0.5" />
                            <span>Back</span>
                        </button>
                    </div>
                </div>

                {/* Leaderboard Table */}
                <div className="flex flex-row justify-between items-center mb-3 sm:mb-4 md:mb-5 gap-2">
                    <p className="text-xs sm:text-xs md:text-sm text-gray-500 font-medium">
                        Showing <span className="font-semibold">{startItem}-{endItem}</span> of <span className="font-semibold">{totalCount}</span>
                    </p>
                </div>

                {currentData?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                            <Trophy className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-megistic mb-2">No Leaderboard Data</h3>
                        <p className="text-gray-500 text-sm max-w-md mb-6 px-4">
                            No participants found for the selected filters. Try adjusting your filters or check back later.
                        </p>
                        <button
                            onClick={() => {
                                setDifficultyFilter("all")
                                setTimeInterval("today")
                                setCategoryFilter("all")
                            }}
                            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            Clear All Filters
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg sm:rounded-md md:rounded-lg overflow-hidden border border-gray-200 shadow-sm mb-5 sm:mb-6 md:mb-8">
                        {/* Table Header - Tablet + Desktop */}
                        <div className="hidden sm:grid grid-cols-12 gap-3 sm:gap-2 md:gap-3 lg:gap-4 px-4 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-3 md:py-4 bg-sand text-xs sm:text-xs md:text-sm font-medium text-gray-500 border-b border-gray-100">
                            <div className="col-span-2 text-center">Rank</div>
                            <div className="col-span-7">Participant</div>
                            <div className="col-span-3 text-center">Total Points</div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-100">
                            <AnimatePresence>
                                {currentData?.map((participant, index) => (
                                    <motion.div
                                        key={participant.user_id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group hover:bg-gray-50 transition-colors"
                                    >
                                        {/* Desktop/Tablet View */}
                                        <div className="hidden sm:grid grid-cols-12 gap-3 sm:gap-2 md:gap-3 lg:gap-4 px-4 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-3 md:py-4 items-center">
                                            <div className="col-span-2 flex items-center justify-center">
                                                <div className="w-7 h-7 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-gray-50">
                                                    {getRankBadge(participant.user_rank)}
                                                </div>
                                            </div>
                                            <div className="col-span-7 flex items-center gap-3">
                                                <div className="w-8 h-8 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 overflow-hidden flex-shrink-0">
                                                    <User className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-gray-900 font-medium truncate text-xs sm:text-xs md:text-sm">
                                                        {participant.full_name}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-span-3 text-gray-900 font-bold text-center text-xs sm:text-xs md:text-sm">
                                                {participant.total_points?.toLocaleString()}
                                            </div>
                                        </div>

                                        {/* Mobile View */}
                                        <div className="sm:hidden grid grid-cols-12 gap-1 px-3 py-2.5 items-center">
                                            <div className="col-span-2 flex items-center justify-center">
                                                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-50">
                                                    {getRankBadge(participant.user_rank)}
                                                </div>
                                            </div>

                                            <div className="col-span-7 flex items-center space-x-2">
                                                <div className="w-7 h-7 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 overflow-hidden flex-shrink-0">
                                                    <User className="w-3.5 h-3.5 text-gray-500" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-gray-900 font-medium truncate text-xs flex items-center gap-1">
                                                        <span className="truncate">{participant.full_name}</span>
                                                        {participant.user_rank <= 3 && (
                                                            <Crown className={`w-3.5 h-3.5 ${getMedalColor(participant.user_rank)}`} />
                                                        )}
                                                    </div>
                                                    <div className="text-gray-500 text-xs truncate">
                                                        Score: {participant.total_points?.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-span-3 flex justify-end text-gray-900 font-bold text-xs sm:text-xs md:text-sm">
                                                {participant.total_points?.toLocaleString()}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-t border-gray-200 pt-4 sm:pt-4 md:pt-6">
                        <div className="text-xs sm:text-xs md:text-sm text-gray-500 order-2 sm:order-1">
                            Page {currentPage} of {totalPages}
                        </div>

                        <div className="flex items-center gap-1 sm:gap-1 md:gap-1.5 order-1 sm:order-2 mb-3 sm:mb-0">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className={`p-1.5 sm:p-1.5 md:p-2 rounded-lg border transition-colors ${currentPage === 1
                                    ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                <ChevronLeft className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                            </button>

                            <div className="flex items-center gap-0.5 sm:gap-0.5 md:gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`min-w-[32px] sm:min-w-[32px] md:min-w-[36px] lg:min-w-[40px] h-8 sm:h-8 md:h-9 lg:h-10 flex items-center justify-center rounded-lg border text-xs sm:text-xs md:text-sm font-medium transition-colors ${page === currentPage
                                            ? 'bg-primary text-white border-primary shadow-sm'
                                            : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className={`p-1.5 sm:p-1.5 md:p-2 rounded-lg border transition-colors ${currentPage === totalPages
                                    ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                <ChevronRight className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}